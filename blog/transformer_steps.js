/* TEN MINUTES — the six-step canvas overview for the transformer lessons.
 *
 * Shared by blog/transformer.php and blog/tenminutes/transformer.php.
 * The pages provide the headings and the short explanations; this file draws
 * the live pictures from the data the transformer engine has already computed.
 */
(function () {
	"use strict";

	function DE() {
		return !!(window.TM && window.TM.lang && window.TM.lang() === "de");
	}

	function updateCapacityNote() {
		var note = document.getElementById("tm-capacity-note");
		var slider = document.getElementById("transformer-dimension-model");
		if (!note || !slider) return;
		var d = parseInt(slider.value, 10);
		note.hidden = !(d > 3);
	}

	function bindCapacityNote() {
		updateCapacityNote();
		var slider = document.getElementById("transformer-dimension-model");
		if (slider && !slider._tmCapacityBound) {
			slider._tmCapacityBound = true;
			slider.addEventListener("input", updateCapacityNote);
		}
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindCapacityNote);
	else bindCapacityNote();

	function typesetMathIn(root) {
		if (!root) return;
		if (window.TM && typeof TM.typesetMath === "function") {
			TM.typesetMath(root);
			return;
		}
		if (!window.temml || typeof temml.renderToString !== "function") return;
		root.querySelectorAll("[data-tex]:not(math)").forEach(function (el) {
			if (el.getAttribute("data-tex-rendered") === "1") return;
			var tex = el.getAttribute("data-tex");
			var display = el.getAttribute("data-tex-display") !== "false";
			try {
				el.innerHTML = temml.renderToString(tex, { displayMode: display });
				el.setAttribute("data-tex-rendered", "1");
			} catch (e) {
				el.textContent = tex;
			}
		});
	}
	window.tmTypesetMathIn = typesetMathIn;

	/* One heavy render per frame. The main transformer page provides the
	   shared queue; the tenminutes page uses its own engine copy, so fall
	   back to a local queue there. */
	function tmQueueHeavy(fn) {
		if (typeof fn !== "function") return;
		if (typeof window.tmScheduleHeavyRender === "function") {
			window.tmScheduleHeavyRender(fn);
			return;
		}
		if (!tmQueueHeavy._q) { tmQueueHeavy._q = []; tmQueueHeavy._running = false; }
		tmQueueHeavy._q.push(fn);
		tmQueueHeavy._pump();
	}
	tmQueueHeavy._pump = function () {
		if (tmQueueHeavy._running || tmQueueHeavy._q.length === 0) return;
		tmQueueHeavy._running = true;
		requestAnimationFrame(function () {
			setTimeout(function () {
				tmQueueHeavy._running = false;
				var job = tmQueueHeavy._q.shift();
				try { if (job) job(); } catch (e) { console.error("[transformer_steps] deferred plot render failed", e); }
				if (tmQueueHeavy._q.length) tmQueueHeavy._pump();
			}, 0);
		});
	};

	/* The live feature-migration refresh gets its own queue. During training
	   the shared heavy queue is busy with the full-visualization rebuild, and
	   a feature job parked there would only run every few epochs. This queue
	   keeps the visible feature plots on the newest epoch. */
	function tmQueueFeature(fn) {
		if (typeof fn !== "function") return;
		if (!tmQueueFeature._q) { tmQueueFeature._q = []; tmQueueFeature._running = false; }
		tmQueueFeature._q.push(fn);
		tmQueueFeature._pump();
	}
	tmQueueFeature._pump = function () {
		if (tmQueueFeature._running || tmQueueFeature._q.length === 0) return;
		tmQueueFeature._running = true;
		requestAnimationFrame(function () {
			setTimeout(function () {
				tmQueueFeature._running = false;
				var job = tmQueueFeature._q.shift();
				try { if (job) job(); } catch (e) { console.error("[transformer_steps] feature plot render failed", e); }
				if (tmQueueFeature._q.length) tmQueueFeature._pump();
			}, 0);
		});
	};

	function markerTrace(points, name) {
		return {
			type: "scatter3d", mode: "markers",
			x: points.map(function (p) { return p.x; }),
			y: points.map(function (p) { return p.y; }),
			z: points.map(function (p) { return p.z; }),
			marker: {
				size: points.map(function (p) { return p.size; }),
				color: points.map(function (p) { return p.color; }),
				symbol: points.map(function (p) { return p.symbol; })
			},
			hovertext: points.map(function (p) { return p.hover || ""; }),
			hovertemplate: "%{hovertext}<extra></extra>",
			showlegend: false,
			name: name || "tokens"
		};
	}

	function css(name, fallback) {
		var value = getComputedStyle(document.documentElement).getPropertyValue(name);
		return value ? value.trim() : fallback;
	}

	function palette() {
		var dark = document.documentElement.getAttribute("data-theme") === "dark" ||
			document.documentElement.classList.contains("dark");
		return {
			dark: dark,
			paper: css("--tm-paper", css("--mn-bg", dark ? "#071a22" : "#ffffff")),
			ink: css("--tm-ink", css("--mn-text", dark ? "#e9f2ee" : "#000000")),
			soft: css("--tm-ink-soft", css("--mn-text-secondary", dark ? "#c4d8d6" : "#2c464d")),
			muted: css("--tm-muted", css("--mn-text-muted", dark ? "#9db5b5" : "#627476")),
			line: css("--tm-line", dark ? "rgba(238,247,244,.18)" : "rgba(0,75,111,.16)"),
			blue: css("--tm-blue", "#1275ac"),
			sky: css("--tm-sky", "#5c9baf"),
			green: css("--tm-green", "#63a44b"),
			lime: css("--tm-lime", "#869b55"),
			gold: css("--tm-gold", "#9f9700"),
			lilac: css("--tm-coral", "#9185be"),
			teal: css("--tm-petrol-mid", "#009299")
		};
	}

	function initCanvas(canvas, draw) {
		if (window.TM && window.TM.initCanvas) return window.TM.initCanvas(canvas, draw);
		var ctx = canvas.getContext("2d");
		var raf = null, lastW = 0, lastH = 0, lastDpr = 0;
		function paint() {
			raf = null;
			var rect = canvas.getBoundingClientRect();
			if (!rect.width) {
				if (canvas.isConnected && (canvas._tmZeroPaintRetries || 0) < 20) {
					canvas._tmZeroPaintRetries = (canvas._tmZeroPaintRetries || 0) + 1;
					setTimeout(request, 100);
				}
				return;
			}
			canvas._tmZeroPaintRetries = 0;
			var dpr = Math.min(window.devicePixelRatio || 1, 2);
			if (rect.width !== lastW || rect.height !== lastH || dpr !== lastDpr) {
				canvas.width = Math.round(rect.width * dpr);
				canvas.height = Math.round(rect.height * dpr);
				lastW = rect.width; lastH = rect.height; lastDpr = dpr;
			}
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			draw(ctx, rect.width, rect.height);
		}
		function request() { if (raf === null) raf = requestAnimationFrame(paint); }
		if (window.ResizeObserver) new ResizeObserver(request).observe(canvas);
		else window.addEventListener("resize", request);
		request();
		return { redraw: request, ctx: ctx };
	}

	function display(value) {
		return String(value == null ? "" : value).replace(/Ġ/g, " ").replace(/\s/g, "␣");
	}

	function norm(v) {
		var n = 0;
		for (var i = 0; i < v.length; i++) n += v[i] * v[i];
		return Math.sqrt(n);
	}

	function diffNorm(a, b) {
		var n = 0;
		for (var i = 0; i < a.length; i++) {
			var d = a[i] - b[i];
			n += d * d;
		}
		return Math.sqrt(n);
	}

	function pca2(vectors) {
		if (!vectors.length) return [];
		var d = vectors[0].length;
		if (d <= 2) {
			return vectors.map(function (v) { return [v[0] || 0, v[1] || 0]; });
		}
		var mean = new Array(d).fill(0);
		vectors.forEach(function (v) { for (var i = 0; i < d; i++) mean[i] += v[i] / vectors.length; });
		var centered = vectors.map(function (v) { return v.map(function (x, i) { return x - mean[i]; }); });
		var cov = [];
		for (var i = 0; i < d; i++) {
			cov.push(new Array(d).fill(0));
			for (var j = 0; j < d; j++) {
				var sum = 0;
				for (var k = 0; k < centered.length; k++) sum += centered[k][i] * centered[k][j];
				cov[i][j] = sum / Math.max(1, centered.length);
			}
		}
		function multiply(m, v) {
			var out = new Array(d).fill(0);
			for (var i = 0; i < d; i++) for (var j = 0; j < d; j++) out[i] += m[i][j] * v[j];
			return out;
		}
		function normalize(v) {
			var n = Math.sqrt(v.reduce(function (a, x) { return a + x * x; }, 0)) || 1;
			return v.map(function (x) { return x / n; });
		}
		var v1 = new Array(d).fill(0);
		v1[0] = 1;
		for (var it = 0; it < 40; it++) v1 = normalize(multiply(cov, v1));
		var lambda1 = v1.reduce(function (a, x, i) { return a + x * multiply(cov, v1)[i]; }, 0);
		var deflated = cov.map(function (row, i) {
			return row.map(function (x, j) { return x - lambda1 * v1[i] * v1[j]; });
		});
		var v2 = new Array(d).fill(0);
		v2[1 % d] = 1;
		for (var it2 = 0; it2 < 40; it2++) v2 = normalize(multiply(deflated, v2));
		function sign(v) {
			var best = 0;
			for (var i = 0; i < v.length; i++) if (Math.abs(v[i]) > Math.abs(v[best])) best = i;
			return v[best] < 0 ? v.map(function (x) { return -x; }) : v;
		}
		v1 = sign(v1); v2 = sign(v2);
		return centered.map(function (v) {
			return [v.reduce(function (a, x, i) { return a + x * v1[i]; }, 0),
				v.reduce(function (a, x, i) { return a + x * v2[i]; }, 0)];
		});
	}

	function pcaBasis3(vectors) {
		if (!vectors.length) return null;
		var d = vectors[0].length;
		if (d <= 3) return null;
		var mean = new Array(d).fill(0);
		vectors.forEach(function (v) { for (var i = 0; i < d; i++) mean[i] += v[i] / vectors.length; });
		var centered = vectors.map(function (v) { return v.map(function (x, i) { return x - mean[i]; }); });
		var cov = [];
		for (var i = 0; i < d; i++) {
			cov.push(new Array(d).fill(0));
			for (var j = 0; j < d; j++) {
				var sum = 0;
				for (var k = 0; k < centered.length; k++) sum += centered[k][i] * centered[k][j];
				cov[i][j] = sum / Math.max(1, centered.length);
			}
		}
		function multiply(m, v) {
			var out = new Array(d).fill(0);
			for (var i = 0; i < d; i++) for (var j = 0; j < d; j++) out[i] += m[i][j] * v[j];
			return out;
		}
		function normalize(v) {
			var n = Math.sqrt(v.reduce(function (a, x) { return a + x * x; }, 0)) || 1;
			return v.map(function (x) { return x / n; });
		}
		function deflate(m, v, lambda) {
			return m.map(function (row, i) {
				return row.map(function (x, j) { return x - lambda * v[i] * v[j]; });
			});
		}
		function component(m, start) {
			var v = start;
			for (var it = 0; it < 50; it++) v = normalize(multiply(m, v));
			var lambda = v.reduce(function (a, x, i) { return a + x * multiply(m, v)[i]; }, 0);
			return { v: v, lambda: lambda };
		}
		function sign(v) {
			var best = 0;
			for (var i = 0; i < v.length; i++) if (Math.abs(v[i]) > Math.abs(v[best])) best = i;
			return v[best] < 0 ? v.map(function (x) { return -x; }) : v;
		}
		var v1 = new Array(d).fill(0); v1[0] = 1;
		var p1 = component(cov, v1);
		var m2 = deflate(cov, p1.v, p1.lambda);
		var v2 = new Array(d).fill(0); v2[1 % d] = 1;
		var p2 = component(m2, v2);
		var m3 = deflate(m2, p2.v, p2.lambda);
		var v3 = new Array(d).fill(0); v3[2 % d] = 1;
		var p3 = component(m3, v3);
		var axes = [sign(p1.v), sign(p2.v), sign(p3.v)];
		var scale = 0.0001;
		centered.forEach(function (v) {
			axes.forEach(function (axis) {
				var projected = 0;
				for (var i = 0; i < d; i++) projected += v[i] * axis[i];
				scale = Math.max(scale, Math.abs(projected));
			});
		});
		return { d: d, mean: mean, axes: axes, scale: scale };
	}

	function alignPcaBasis3(next, prev) {
		if (!next || !prev || !prev.axes) return next;
		next.axes = next.axes.map(function (axis, k) {
			var old = prev.axes[k] || [];
			var dot = 0;
			for (var i = 0; i < Math.min(axis.length, old.length); i++) dot += axis[i] * old[i];
			return dot < 0 ? axis.map(function (x) { return -x; }) : axis;
		});
		return next;
	}

	function applyPcaBasis3(vectors, basis) {
		if (!vectors.length) return [];
		var d = vectors[0].length;
		if (!basis || d <= 3 || basis.d !== d) {
			return vectors.map(function (v) { return [v[0] || 0, v[1] || 0, v[2] || 0]; });
		}
		var mean = basis.mean, axes = basis.axes;
		return vectors.map(function (v) {
			return axes.map(function (axis) {
				var projected = 0;
				for (var i = 0; i < d; i++) projected += ((v[i] || 0) - (mean[i] || 0)) * axis[i];
				return projected;
			});
		});
	}

	function pca3(vectors) { return applyPcaBasis3(vectors, pcaBasis3(vectors)); }

	function pcaBasisDrift(vectors, basis) {
		if (!basis || !vectors.length) return 0;
		var max = 0.0001;
		vectors.forEach(function (v) {
			basis.axes.forEach(function (axis) {
				var projected = 0;
				for (var i = 0; i < Math.min(v.length, axis.length); i++) {
					projected += ((v[i] || 0) - (basis.mean[i] || 0)) * axis[i];
				}
				max = Math.max(max, Math.abs(projected));
			});
		});
		return max / (basis.scale || 0.0001);
	}

	window.tmPCA3 = pca3;
	if (!window.tmHighDimMode) window.tmHighDimMode = "pca";

	function project3(p, max, rotY, rotX) {
		var x = (p[0] || 0) / max;
		var y = (p[1] || 0) / max;
		var z = (p[2] || 0) / max;
		var cy = Math.cos(rotY), sy = Math.sin(rotY);
		var cx = Math.cos(rotX), sx = Math.sin(rotX);
		var x1 = x * cy + z * sy;
		var z1 = -x * sy + z * cy;
		var y1 = y * cx - z1 * sx;
		var z2 = y * sx + z1 * cx;
		var persp = 3.0;
		var f = persp / (persp + z2);
		return [x1 * f, y1 * f, z2, f];
	}

	function projectForView(points, dims, rot) {
		if (!points.length) return { coords: [], label: "", axes: ["", ""], is3d: false };
		if (dims <= 1) {
			return {
				coords: points.map(function (p) { return [p[0] || 0, 0]; }),
				label: DE() ? "rohe Dimension · 1D" : "raw dimension · 1D",
				axes: ["dim 0", ""],
				is3d: false
			};
		}
		if (dims === 2) {
			return {
				coords: points.map(function (p) { return [p[0] || 0, p[1] || 0]; }),
				label: DE() ? "rohe Dimensionen · 2D" : "raw dimensions · 2D",
				axes: ["dim 0", "dim 1"],
				is3d: false
			};
		}
		if (dims === 3) {
			var rotation = rot || { y: -0.6, x: 0.35 };
			var cx = 0, cy = 0, cz = 0;
			points.forEach(function (p) { cx += (p[0] || 0); cy += (p[1] || 0); cz += (p[2] || 0); });
			cx /= points.length; cy /= points.length; cz /= points.length;
			var max = 0.0001;
			points.forEach(function (p) {
				max = Math.max(max, Math.hypot((p[0] || 0) - cx, (p[1] || 0) - cy, (p[2] || 0) - cz));
			});
			return {
				coords: points.map(function (p) { return project3([(p[0] || 0) - cx, (p[1] || 0) - cy, (p[2] || 0) - cz], max, rotation.y, rotation.x); }),
				origin: project3([0, 0, 0], max, rotation.y, rotation.x),
				axes3d: [
					project3([max * 1.12, 0, 0], max, rotation.y, rotation.x),
					project3([0, max * 1.12, 0], max, rotation.y, rotation.x),
					project3([0, 0, max * 1.12], max, rotation.y, rotation.x)
				],
				label: DE() ? "rohe Dimensionen · 3D" : "raw dimensions · 3D",
				axes: ["dim 0", "dim 1", "dim 2"],
				is3d: true
			};
		}
		return {
			coords: pca2(points),
			label: (DE() ? "PCA-Projektion" : "PCA projection") + " · d=" + dims,
			axes: ["PC 1", "PC 2"],
			is3d: false
		};
	}

	function make3DMap(w, h) {
		var range = 1.35;
		return function (p) {
			return {
				x: w / 2 + (p[0] || 0) / range * (w * 0.42),
				y: h / 2 - (p[1] || 0) / range * (h * 0.42),
				z: p[2] || 0
			};
		};
	}

	function depthAlpha(p) {
		var z = p[2] || 0;
		return Math.max(0.3, Math.min(1, 0.72 - z * 0.18));
	}

	function draw3DAxes(ctx, w, h, view, map) {
		var c = palette();
		var o = map(view.origin);
		var colors = [c.blue, c.green, c.gold];
		for (var i = 0; i < 3; i++) {
			var a = map(view.axes3d[i]);
			ctx.strokeStyle = colors[i];
			ctx.lineWidth = 1.5;
			ctx.globalAlpha = 0.85;
			ctx.beginPath();
			ctx.moveTo(o.x, o.y);
			ctx.lineTo(a.x, a.y);
			ctx.stroke();
			ctx.globalAlpha = 1;
			ctx.fillStyle = colors[i];
			ctx.font = "700 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(view.axes[i], a.x + 4, a.y + 3);
		}
		ctx.beginPath();
		ctx.arc(o.x, o.y, 2.4, 0, Math.PI * 2);
		ctx.fillStyle = c.muted;
		ctx.fill();
	}

	function mix(a, b, t) {
		return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
	}

	function rgb(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }

	function hex(c) {
		c = String(c || "#000").replace("#", "");
		if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
		return [parseInt(c.slice(0, 2), 16) || 0, parseInt(c.slice(2, 4), 16) || 0, parseInt(c.slice(4, 6), 16) || 0];
	}

	function fitText(ctx, text, maxWidth) {
		if (ctx.measureText(text).width <= maxWidth) return text;
		var out = text;
		while (out.length > 1 && ctx.measureText(out + "…").width > maxWidth) out = out.slice(0, -1);
		return out + "…";
	}

	function tokenList() {
		var trace = window.__tmLayerTrace || [];
		if (trace[0] && trace[0].tokenStrings && trace[0].tokenStrings.length) return trace[0].tokenStrings.slice();
		var collector = window.tlab_trajectory_collector;
		if (collector && collector.displayTokens) return collector.displayTokens.slice();
		return [];
	}

	function vocabList() {
		var space = window.persistentEmbeddingSpace || {};
		return Object.keys(space).map(function (word) {
			return { word: word, vec: space[word] };
		});
	}

	function dModel() {
		var space = window.persistentEmbeddingSpace || {};
		var keys = Object.keys(space);
		return keys.length ? space[keys[0]].length : 0;
	}

	function drawPlaceholder(ctx, w, h, text) {
		var c = palette();
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = c.muted;
		ctx.font = "600 11px Barlow, system-ui, sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(text, w / 2, h / 2);
	}

		function positionRgb(index, total) {
		if (typeof getPositionColor === "function") {
			var c = getPositionColor(index, total, "object");
			return [c.r, c.g, c.b];
		}
		var t = total > 1 ? index / (total - 1) : 0;
		return [Math.round(59 + (16 - 59) * t), Math.round(130 + (185 - 130) * t), Math.round(246 + (129 - 246) * t)];
	}

	function drawTokenize(ctx, w, h) {
		var c = palette();
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!tokens.length) return drawPlaceholder(ctx, w, h, DE() ? "Starte das Modell, um Tokens zu sehen." : "Run the model to see tokens.");
		var vocab = Object.keys(window.persistentEmbeddingSpace || {});
		var pad = 14, gap = 6;
		var fontSize = tokens.length > 18 ? 9 : 11;
		ctx.font = "600 " + fontSize + "px Barlow, system-ui, sans-serif";
		var x = pad, y = pad + 10, lineH = fontSize + 20;
		tokens.forEach(function (token, i) {
			var text = display(token);
			var label = fitText(ctx, text, 92);
			var tw = Math.max(30, ctx.measureText(label).width + 14);
			if (x + tw > w - pad) { x = pad; y += lineH; }
			var fill = positionRgb(i, tokens.length - 1);
			ctx.fillStyle = "rgba(" + fill[0] + "," + fill[1] + "," + fill[2] + ",.14)";
			ctx.fillRect(x, y, tw, fontSize + 12);
			ctx.strokeStyle = rgb(fill);
			ctx.lineWidth = 1;
			ctx.strokeRect(x, y, tw, fontSize + 12);
			ctx.fillStyle = c.ink;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(label, x + tw / 2, y + (fontSize + 12) / 2);
			ctx.fillStyle = c.muted;
			ctx.font = "700 8px Barlow, system-ui, sans-serif";
			ctx.fillText("#" + i + " · id " + (vocab.indexOf(token) >= 0 ? vocab.indexOf(token) : "?"), x + tw / 2, y + fontSize + 18);
			ctx.font = "600 " + fontSize + "px Barlow, system-ui, sans-serif";
			x += tw + gap;
		});
		ctx.textAlign = "left";
		ctx.fillStyle = c.muted;
		ctx.font = "600 10px Barlow, system-ui, sans-serif";
		ctx.fillText(DE() ? tokens.length + " Tokens · Leserichtung →" : tokens.length + " tokens · reading order →", pad, h - 10);
	}

	var stepRotations = {
		embed: { y: -0.6, x: 0.35 },
		position: { y: -0.6, x: 0.35 }
	};

	function attachRotation(canvas, rot, redraw) {
		if (!canvas) return;
		var drag = null;
		canvas.style.cursor = "grab";
		canvas.addEventListener("pointerdown", function (event) {
			drag = { x: event.clientX, y: event.clientY, ry: rot.y, rx: rot.x };
			canvas.setPointerCapture(event.pointerId);
			canvas.style.cursor = "grabbing";
		});
		canvas.addEventListener("pointermove", function (event) {
			if (!drag) return;
			rot.y = drag.ry + (event.clientX - drag.x) * 0.008;
			rot.x = drag.rx + (event.clientY - drag.y) * 0.008;
			redraw();
		});
		canvas.addEventListener("pointerup", function () { drag = null; canvas.style.cursor = "grab"; });
		canvas.addEventListener("pointercancel", function () { drag = null; canvas.style.cursor = "grab"; });
	}

	function drawEmbedPca(ctx, w, h) {
		var c = palette();
		var vocab = vocabList();
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!vocab.length) return drawPlaceholder(ctx, w, h, DE() ? "Noch kein Embedding-Raum." : "No embedding space yet.");
		var view = projectForView(vocab.map(function (v) { return v.vec; }), vocab[0].vec.length, stepRotations.embed);
		var coords = view.coords;
		window.__tmStepViewLabels = window.__tmStepViewLabels || {};
		window.__tmStepViewLabels.embed = view.label;
		var index = {};
		vocab.forEach(function (v, i) { index[v.word] = i; });
		var map;
		if (view.is3d) {
			map = make3DMap(w, h);
			draw3DAxes(ctx, w, h, view, map);
		} else {
			var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
			coords.forEach(function (p) {
				minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
				minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
			});
			var spanX = maxX - minX || 1, spanY = maxY - minY || 1;
			var pad = 22;
			map = function (p) {
				return {
					x: pad + (p[0] - minX) / spanX * (w - pad * 2),
					y: h - pad - (p[1] - minY) / spanY * (h - pad * 2)
				};
			};
			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
			ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.stroke();
		}
		var order = coords.map(function (_, i) { return i; }).sort(function (a, b) { return (coords[a][2] || 0) - (coords[b][2] || 0); });
		order.forEach(function (i) {
			var p = coords[i], q = map(p);
			ctx.globalAlpha = view.is3d ? depthAlpha(p) : 1;
			ctx.beginPath();
			ctx.arc(q.x, q.y, view.is3d ? 1.8 + (p[3] || 1) * 1.2 : 2.2, 0, Math.PI * 2);
			ctx.fillStyle = c.dark ? "rgba(157,181,181,.45)" : "rgba(0,75,111,.28)";
			ctx.fill();
		});
		ctx.globalAlpha = 1;
		if (tokens.length) {
			ctx.beginPath();
			tokens.forEach(function (token, i) {
				var idx = index[token];
				if (idx == null) return;
				var q = map(coords[idx]);
				if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
			});
			ctx.strokeStyle = c.green;
			ctx.lineWidth = view.is3d ? 2.8 : 2.2;
			ctx.stroke();
			tokens.forEach(function (token, i) {
				var idx = index[token];
				if (idx == null) return;
				var p = coords[idx], q = map(p);
				var col = positionRgb(i, tokens.length - 1);
				ctx.globalAlpha = view.is3d ? depthAlpha(p) : 1;
				ctx.beginPath();
				ctx.arc(q.x, q.y, view.is3d ? 3.4 + (p[3] || 1) * 1.6 : 5, 0, Math.PI * 2);
				ctx.fillStyle = rgb(col);
				ctx.fill();
				ctx.strokeStyle = c.paper;
				ctx.lineWidth = 1.5;
				ctx.stroke();
				ctx.font = "700 9px Barlow, system-ui, sans-serif";
				ctx.textAlign = "center";
				ctx.fillStyle = c.ink;
				ctx.fillText(fitText(ctx, display(token), 60), q.x, q.y - 9);
			});
			ctx.globalAlpha = 1;
		}
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.textAlign = "left";
		ctx.fillText(view.label + (view.is3d ? (DE() ? " · ziehen zum Drehen" : " · drag to rotate") : ""), 10, 16);
		if (!view.is3d) {
			ctx.fillText(view.axes[0] + " →", w - 64, h - 8);
			if (view.axes[1]) {
				ctx.save();
				ctx.translate(10, 66);
				ctx.rotate(-Math.PI / 2);
				ctx.fillText(view.axes[1] + " →", 0, 0);
				ctx.restore();
			}
		}
	}

	function drawPositionHeatmap(ctx, w, h) {
		var c = palette();
		var tokens = tokenList();
		var d = dModel();
		ctx.clearRect(0, 0, w, h);
		if (!tokens.length || !d) return drawPlaceholder(ctx, w, h, DE() ? "Noch keine Positionen." : "No positions yet.");
		var rows = tokens.length, cols = Math.min(d, 16);
		var pad = 18, top = 26;
		var cw = (w - pad * 2) / cols, ch = (h - top - pad) / rows;
		var negative = hex(c.blue), zero = hex(c.paper), positive = hex(c.gold);
		function value(pos, i) {
			var angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / d);
			return i % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
		}
		for (var r = 0; r < rows; r++) {
			for (var i = 0; i < cols; i++) {
				var v = value(r, i);
				var t = (v + 1) / 2;
				var col = t < 0.5 ? mix(negative, zero, t * 2) : mix(zero, positive, (t - 0.5) * 2);
				ctx.fillStyle = rgb(col);
				ctx.fillRect(pad + i * cw, top + r * ch, Math.ceil(cw) + 0.5, Math.ceil(ch) + 0.5);
			}
			ctx.fillStyle = c.ink;
			ctx.font = "600 8px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			ctx.fillText("p" + r, pad - 4, top + r * ch + ch / 2);
		}
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.textAlign = "left";
		ctx.textBaseline = "alphabetic";
		ctx.fillText(DE() ? "Position × Dimension · blau = negativ, gold = positiv" : "position × dimension · blue = negative, gold = positive", pad, 14);
	}

	function positionVectors(count, d) {
		var out = [];
		for (var pos = 0; pos < count; pos++) {
			if (typeof window.computePositionalEncoding === 'function') {
				out.push(window.computePositionalEncoding(pos, d));
			} else {
				var vec = [];
				for (var i = 0; i < d; i++) {
					var angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / d);
					vec.push(i % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
				}
				out.push(vec);
			}
		}
		return out;
	}

	function drawEmbedParallel(ctx, w, h) {
		var c = palette();
		var vocab = vocabList();
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!vocab.length) return drawPlaceholder(ctx, w, h, DE() ? "Noch kein Embedding-Raum." : "No embedding space yet.");
		var d = vocab[0].vec.length;
		var min = Infinity, max = -Infinity;
		vocab.forEach(function (item) {
			item.vec.forEach(function (x) { min = Math.min(min, x); max = Math.max(max, x); });
		});
		var span = max - min || 1;
		var pad = 24, left = pad, right = w - pad, top = 28, bottom = h - 34;
		function px(dim) { return left + (d <= 1 ? 0 : (dim / (d - 1)) * (right - left)); }
		function py(value) { return bottom - (value - min) / span * (bottom - top); }
		ctx.strokeStyle = c.line;
		ctx.lineWidth = 1;
		ctx.beginPath(); ctx.moveTo(left, bottom); ctx.lineTo(right, bottom); ctx.stroke();
		vocab.forEach(function (item) {
			ctx.beginPath();
			item.vec.forEach(function (value, dim) {
				if (dim === 0) ctx.moveTo(px(dim), py(value)); else ctx.lineTo(px(dim), py(value));
			});
			ctx.strokeStyle = c.dark ? "rgba(157,181,181,.10)" : "rgba(0,75,111,.08)";
			ctx.lineWidth = 1;
			ctx.stroke();
		});
		tokens.forEach(function (token, t) {
			var item = null;
			for (var i = 0; i < vocab.length; i++) if (vocab[i].word === token) { item = vocab[i]; break; }
			if (!item) return;
			var col = positionRgb(t, tokens.length - 1);
			ctx.beginPath();
			item.vec.forEach(function (value, dim) {
				if (dim === 0) ctx.moveTo(px(dim), py(value)); else ctx.lineTo(px(dim), py(value));
			});
			ctx.strokeStyle = rgb(col);
			ctx.lineWidth = 2.2;
			ctx.stroke();
			ctx.fillStyle = rgb(col);
			ctx.font = "700 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.fillText(fitText(ctx, display(token), 64), right - 4, py(item.vec[d - 1]) - 4);
		});
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.textAlign = "left";
		ctx.fillText(DE() ? "Alle Dimensionen · eine Linie pro Token · Originaldaten" : "all dimensions · one line per token · original data", pad, 15);
		ctx.fillText("dim 0", left, h - 10);
		ctx.textAlign = "right";
		ctx.fillText("dim " + (d - 1), right, h - 10);
	}

	function semanticVectors() {
		var tokens = tokenList();
		var trace = (window.__tmLayerTrace || [])[0];
		if (trace && trace.h_in && trace.h_in.length) return trace.h_in.slice(0, tokens.length);
		if (window.__tmInputState && window.__tmInputState.tokensWithPositional) return window.__tmInputState.tokensWithPositional.slice(0, tokens.length);
		return positionVectors(tokens.length, dModel());
	}

	function drawPositionPca(ctx, w, h) {
		var c = palette();
		var tokens = tokenList();
		var d = dModel();
		ctx.clearRect(0, 0, w, h);
		if (!tokens.length || !d) return drawPlaceholder(ctx, w, h, DE() ? "Noch keine Positionen." : "No positions yet.");
		var vectors = semanticVectors();
		var d = vectors.length ? vectors[0].length : dModel();
		var view = projectForView(vectors, d, stepRotations.position);
		var coords = view.coords;
		window.__tmStepViewLabels = window.__tmStepViewLabels || {};
		window.__tmStepViewLabels.position = view.label;
		var map;
		if (view.is3d) {
			map = make3DMap(w, h);
			draw3DAxes(ctx, w, h, view, map);
		} else {
			var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
			coords.forEach(function (q) { minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]); minY = Math.min(minY, q[1]); maxY = Math.max(maxY, q[1]); });
			var spanX = maxX - minX || 1, spanY = maxY - minY || 1;
			var pad = 32;
			map = function (q) { return { x: pad + (q[0] - minX) / spanX * (w - pad * 2), y: h - pad - (q[1] - minY) / spanY * (h - pad * 2) }; };
			ctx.strokeStyle = c.line;
			ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
			ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.stroke();
		}
		ctx.beginPath();
		coords.forEach(function (q, i) {
			var p = map(q);
			if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
		});
		ctx.strokeStyle = c.green;
		ctx.lineWidth = view.is3d ? 2.8 : 2.2;
		ctx.stroke();
		var order = coords.map(function (_, i) { return i; }).sort(function (a, b) { return (coords[a][2] || 0) - (coords[b][2] || 0); });
		order.forEach(function (i) {
			var q = coords[i], p = map(q);
			var col = mix(hex(c.blue), hex(c.gold), i / Math.max(1, coords.length - 1));
			ctx.globalAlpha = view.is3d ? depthAlpha(q) : 1;
			ctx.beginPath();
			ctx.arc(p.x, p.y, view.is3d ? 3.4 + (q[3] || 1) * 1.4 : 4.6, 0, Math.PI * 2);
			ctx.fillStyle = rgb(col);
			ctx.fill();
			ctx.strokeStyle = c.paper;
			ctx.lineWidth = 1.3;
			ctx.stroke();
			ctx.fillStyle = c.ink;
			ctx.font = "700 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText("p" + i, p.x, p.y - 9);
		});
		ctx.globalAlpha = 1;
		ctx.textAlign = "left";
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.fillText((DE() ? "h0 = Token-Embedding + Position · " : "h0 = token embedding + position · ") + view.label + (view.is3d ? (DE() ? " · ziehen zum Drehen" : " · drag to rotate") : ""), 12, 16);
	}

	function drawPositionParallel(ctx, w, h) {
		var c = palette();
		var tokens = tokenList();
		var d = dModel();
		ctx.clearRect(0, 0, w, h);
		if (!tokens.length || !d) return drawPlaceholder(ctx, w, h, DE() ? "Noch keine Positionen." : "No positions yet.");
		var vectors = semanticVectors();
		var d = vectors.length ? vectors[0].length : dModel();
		var min = -1.1, max = 1.1;
		var pad = 24, left = pad, right = w - pad, top = 28, bottom = h - 34;
		function px(dim) { return left + (d <= 1 ? 0 : (dim / (d - 1)) * (right - left)); }
		function py(value) { return bottom - (value - min) / (max - min) * (bottom - top); }
		ctx.strokeStyle = c.line;
		ctx.beginPath(); ctx.moveTo(left, bottom); ctx.lineTo(right, bottom); ctx.stroke();
		vectors.forEach(function (vec, pos) {
			var col = mix(hex(c.blue), hex(c.gold), pos / Math.max(1, vectors.length - 1));
			ctx.beginPath();
			vec.forEach(function (value, dim) {
				if (dim === 0) ctx.moveTo(px(dim), py(value)); else ctx.lineTo(px(dim), py(value));
			});
			ctx.strokeStyle = rgb(col);
			ctx.globalAlpha = 0.85;
			ctx.lineWidth = 1.6;
			ctx.stroke();
			ctx.globalAlpha = 1;
			ctx.fillStyle = rgb(col);
			ctx.font = "700 8px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.fillText("p" + pos, right - 4, py(vec[d - 1]) - 3);
		});
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.textAlign = "left";
		ctx.fillText((DE() ? "h0 = Token-Embedding + Position · alle Dimensionen · eine Linie pro Position" : "h0 = token embedding + position · all dimensions · one line per position"), pad, 15);
		ctx.fillText("dim 0", left, h - 10);
		ctx.textAlign = "right";
		ctx.fillText("dim " + (d - 1), right, h - 10);
	}

	function drawEmbed(ctx, w, h, mode) {
		if (mode === "parallel") return drawEmbedParallel(ctx, w, h);
		return drawEmbedPca(ctx, w, h);
	}

	function drawPosition(ctx, w, h, mode) {
		if (mode === "pca") return drawPositionPca(ctx, w, h);
		if (mode === "parallel") return drawPositionParallel(ctx, w, h);
		return drawPositionHeatmap(ctx, w, h);
	}

	function averageAttention(trace) {
		if (!trace || !trace.headData || !trace.headData.length) return null;
		var heads = trace.headData.filter(function (h) { return h && h.weights; });
		if (!heads.length) return null;
		var rows = heads[0].weights.length;
		var cols = heads[0].weights[0].length;
		var out = [];
		for (var i = 0; i < rows; i++) {
			out.push(new Array(cols).fill(0));
			for (var h = 0; h < heads.length; h++) {
				for (var j = 0; j < cols; j++) out[i][j] += (heads[h].weights[i] ? heads[h].weights[i][j] : 0) / heads.length;
			}
		}
		return out;
	}

	function drawAttend(ctx, w, h, mode, layerIdx) {
		var c = palette();
		var tokens = tokenList();
		layerIdx = layerIdx || 0;
		var trace = (window.__tmLayerTrace || [])[layerIdx];
		ctx.clearRect(0, 0, w, h);
		if (!tokens.length || !trace) return drawPlaceholder(ctx, w, h, DE() ? "Noch keine Attention-Daten." : "No attention data yet.");
		var headIdx = parseInt(mode, 10);
		if (isNaN(headIdx)) headIdx = 0;
		var heads = (trace.headData || []).filter(function (h) { return h && h.weights; });
		var head = heads[headIdx] || heads[0];
		if (!head) return drawPlaceholder(ctx, w, h, DE() ? "Noch keine Attention-Gewichte." : "No attention weights yet.");
		var weights = head.weights;
		var n = tokens.length;
		var pad = 24, baseY = h * 0.68;
		var step = (w - pad * 2) / Math.max(1, n - 1);
		var positions = tokens.map(function (_, i) { return { x: pad + i * step, y: baseY }; });
		ctx.strokeStyle = c.line;
		ctx.beginPath(); ctx.moveTo(pad, baseY); ctx.lineTo(w - pad, baseY); ctx.stroke();
		for (var i = 0; i < n; i++) {
			for (var j = 0; j < n; j++) {
				var weight = weights[i] ? weights[i][j] : 0;
				if (weight < 0.035) continue;
				var a = positions[i], b = positions[j];
				var midX = (a.x + b.x) / 2;
				var lift = Math.min(92, Math.abs(a.x - b.x) * 0.42) + 12;
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				ctx.quadraticCurveTo(midX, a.y - lift, b.x, b.y);
				ctx.strokeStyle = c.blue;
				ctx.globalAlpha = Math.min(0.9, 0.08 + weight * 0.9);
				ctx.lineWidth = 0.6 + weight * 3.6;
				ctx.stroke();
			}
		}
		ctx.globalAlpha = 1;
		tokens.forEach(function (token, i) {
			var p = positions[i];
			ctx.beginPath();
			ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
			ctx.fillStyle = c.green;
			ctx.fill();
			ctx.strokeStyle = c.paper;
			ctx.lineWidth = 1.4;
			ctx.stroke();
			ctx.save();
			ctx.translate(p.x, p.y + 9);
			ctx.rotate(-0.55);
			ctx.fillStyle = c.ink;
			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(fitText(ctx, display(token), 66), 0, 0);
			ctx.restore();
		});
		ctx.fillStyle = c.muted;
		ctx.font = "600 10px Barlow, system-ui, sans-serif";
		ctx.textAlign = "left";
		ctx.fillText((DE() ? "Layer " : "Layer ") + (layerIdx + 1) + (DE() ? " · Head " : " · head ") + (headIdx + 1) + (DE() ? " · echte Gewichte · Liniendicke = Gewicht" : " · real weights · line width = weight"), pad, 16);
	}

	var layerAttentionLineRegistry = {};
	var layerFFNHeatmapRegistry = {};

	function drawFFNMatrix(ctx, w, h, layerIdx, which) {
		var c = palette();
		var ffn = (window.__tmFFNTrace || [])[layerIdx];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!ffn || !tokens.length) {
			return drawPlaceholder(ctx, w, h, DE() ? "Öffne eine Schicht, um die FFN-Aktivierungen zu sehen." : "Open a layer to see the FFN activations.");
		}
		var matrix, label, title;
		if (which === "h1") {
			matrix = ffn.h1;
			label = DE() ? "Eingang" : "input";
			title = DE() ? "FFN-Eingang h₁" : "FFN input h₁";
		} else if (which === "norm") {
			matrix = ffn.normed_h1;
			label = DE() ? "normiert" : "normalized";
			title = DE() ? "nach LayerNorm" : "after LayerNorm";
		} else if (which === "outFFN") {
			matrix = ffn.out_FFN;
			label = DE() ? "komprimiert" : "compressed";
			title = DE() ? "FFN-Ausgabe" : "FFN output";
		} else {
			matrix = ffn.out_L1;
			var act = (typeof tmActivationLabel === "function") ? tmActivationLabel() : "GELU";
			label = act;
			title = (DE() ? "Hidden-Aktivierungen (" : "hidden activations (") + act + ")";
		}
		if (!matrix || !matrix.length) {
			return drawPlaceholder(ctx, w, h, DE() ? "Keine FFN-Aktivierungen." : "No FFN activations.");
		}
		var rows = Math.min(tokens.length, matrix.length);
		var cols = Math.min((matrix[0] || []).length, 64);
		if (!rows || !cols) return drawPlaceholder(ctx, w, h, DE() ? "Keine FFN-Aktivierungen." : "No FFN activations.");
		var min = Infinity, max = -Infinity;
		for (var i = 0; i < rows; i++) {
			for (var j = 0; j < cols; j++) {
				var v = matrix[i][j] || 0;
				min = Math.min(min, v); max = Math.max(max, v);
			}
		}
		var span = max - min || 1;
		var narrow = w < 300;
		var padL = narrow ? 68 : 90, padT = 26, padB = 24, padR = 14;
		var cw = (w - padL - padR) / cols;
		var ch = (h - padT - padB) / rows;
		var neg = hex(c.blue), zero = hex(c.paper), pos = hex(c.gold);
		for (var r = 0; r < rows; r++) {
			for (var k = 0; k < cols; k++) {
				var t = ((matrix[r][k] || 0) - min) / span;
				var col = t < 0.5 ? mix(neg, zero, t * 2) : mix(zero, pos, (t - 0.5) * 2);
				ctx.fillStyle = rgb(col);
				ctx.fillRect(padL + k * cw, padT + r * ch, Math.ceil(cw) + 0.5, Math.ceil(ch) + 0.5);
			}
			ctx.fillStyle = getPositionColor(r, rows - 1);
			ctx.font = "600 8px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			ctx.fillText(fitText(ctx, display(tokens[r]), padL - 6), padL - 5, padT + r * ch + ch / 2);
		}
		ctx.textBaseline = "alphabetic";
		ctx.textAlign = "left";
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		var titleText = (w < 140)
			? ("L" + (layerIdx + 1))
			: (title + " · " + (DE() ? "Layer " : "layer ") + (layerIdx + 1));
		ctx.fillText(fitText(ctx, titleText, w - padL - padR), padL, 15);
	}

	function drawFFNHeatmap(ctx, w, h, layerIdx) {
		drawFFNMatrix(ctx, w, h, layerIdx, "outL1");
	}

	function drawFFNCurvature(ctx, w, h, layerIdx) {
		var c = palette();
		var ffn = (window.__tmFFNTrace || [])[layerIdx];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!ffn || !ffn.normed_h1 || !ffn.W1 || !tokens.length) {
			return drawPlaceholder(ctx, w, h, DE() ? "Öffne eine Schicht, um die Krümmung zu sehen." : "Open a layer to see the curvature.");
		}
		var kind = (typeof tmActivationKind === "function") ? tmActivationKind() : "gelu";
		var gated = (typeof tmActivationIsGated === "function") && tmActivationIsGated(kind);
		var actKind = gated ? "silu" : kind;
		var actName = gated ? "SiLU gate" : ((typeof tmActivationLabel === "function") ? tmActivationLabel(kind) : "GELU");
		var u = matMul(ffn.normed_h1, ffn.W1, ffn.b1);
		var act = function (x) { return (typeof activationValue === "function") ? activationValue(actKind, x) : x; };
		var xs = [], ys = [];
		u.forEach(function (row) { row.forEach(function (v) { xs.push(v); ys.push(act(v)); }); });
		if (!xs.length) return drawPlaceholder(ctx, w, h, DE() ? "Keine Voraktivierungen." : "No pre-activations.");
		var xlo = Math.min.apply(null, xs), xhi = Math.max.apply(null, xs);
		var ylo = Math.min(0, Math.min.apply(null, ys)), yhi = Math.max(0, Math.max.apply(null, ys));
		if (xhi - xlo < 1e-9) { xlo -= 1; xhi += 1; }
		if (yhi - ylo < 1e-9) { yhi += 1; }
		var xpad = (xhi - xlo) * 0.08, ypad = (yhi - ylo) * 0.12;
		xlo -= xpad; xhi += xpad; ylo -= ypad; yhi += ypad;
		var padL = 58, padR = 18, padT = 30, padB = 30;
		var px = function (v) { return padL + (v - xlo) / (xhi - xlo) * (w - padL - padR); };
		var py = function (v) { return h - padB - (v - ylo) / (yhi - ylo) * (h - padT - padB); };
		ctx.strokeStyle = c.line; ctx.lineWidth = 1;
		ctx.beginPath(); ctx.moveTo(padL, h - padB); ctx.lineTo(w - padR, h - padB); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.stroke();
		if (xlo <= 0 && xhi >= 0) {
			ctx.strokeStyle = c.line; ctx.setLineDash([3, 4]);
			ctx.beginPath(); ctx.moveTo(px(0), padT); ctx.lineTo(px(0), h - padB); ctx.stroke();
			ctx.setLineDash([]);
		}
		if (ylo <= 0 && yhi >= 0) {
			ctx.strokeStyle = c.line; ctx.setLineDash([3, 4]);
			ctx.beginPath(); ctx.moveTo(padL, py(0)); ctx.lineTo(w - padR, py(0)); ctx.stroke();
			ctx.setLineDash([]);
		}
		ctx.strokeStyle = c.blue; ctx.lineWidth = 2.4;
		ctx.beginPath();
		for (var i = 0; i <= 180; i++) {
			var xv = xlo + (xhi - xlo) * i / 180;
			var yv = act(xv);
			if (i === 0) ctx.moveTo(px(xv), py(yv)); else ctx.lineTo(px(xv), py(yv));
		}
		ctx.stroke();
		u.forEach(function (row, r) {
			var col = getPositionColor(r, tokens.length - 1);
			row.forEach(function (xv) {
				var yv = act(xv);
				ctx.beginPath();
				ctx.arc(px(xv), py(yv), 2.1, 0, Math.PI * 2);
				ctx.fillStyle = col;
				ctx.globalAlpha = 0.8;
				ctx.fill();
				ctx.globalAlpha = 1;
			});
		});
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.textAlign = "left";
		ctx.fillText(actName + " curvature · " + (DE() ? "Layer " : "layer ") + (layerIdx + 1), padL, 15);
		ctx.textAlign = "right";
		ctx.fillText("pre-activation u", w - padR, h - 8);
		ctx.save();
		ctx.translate(12, h / 2);
		ctx.rotate(-Math.PI / 2);
		ctx.textAlign = "center";
		ctx.fillText("activation", 0, 0);
		ctx.restore();
	}

	/* A 2-D slice through the real normalized input: two input dimensions vary,
	   all others stay fixed at the last token. The surface is the real FFN output. */
	function drawFFNSpace(ctx, w, h, layerIdx) {
		var c = palette();
		var ffn = (window.__tmFFNTrace || [])[layerIdx];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!ffn || !ffn.normed_h1 || !ffn.W1 || !ffn.W2 || !tokens.length) {
			return drawPlaceholder(ctx, w, h, DE() ? "Öffne eine Schicht, um die Raumkrümmung zu sehen." : "Open a layer to see the space curvature.");
		}
		var dm = ffn.W1.length;
		var dff = (ffn.W1[0] || []).length;
		var x0 = ffn.normed_h1[ffn.normed_h1.length - 1];
		if (!x0 || x0.length < 2 || dm < 2 || !dff) {
			return drawPlaceholder(ctx, w, h, DE() ? "Zu wenige Dimensionen für einen Schnitt." : "Too few dimensions for a slice.");
		}
		var kind = (typeof tmActivationKind === "function") ? tmActivationKind() : "gelu";
		var gated = !!(typeof tmActivationIsGated === "function" && tmActivationIsGated(kind) && ffn.Wg);
		var actKind = (typeof tmActivationIsGated === "function" && tmActivationIsGated(kind)) ? "silu" : kind;
		var actName = (typeof tmActivationLabel === "function") ? tmActivationLabel(kind) : "GELU";
		var act = function (x) { return (typeof activationValue === "function") ? activationValue(actKind, x) : x; };

		var influence = [];
		for (var d = 0; d < dm; d++) {
			var score = 0;
			for (var j = 0; j < dff; j++) score += Math.abs((ffn.W1[d] && ffn.W1[d][j]) || 0);
			influence.push({ d: d, score: score });
		}
		influence.sort(function (a, b) { return b.score - a.score; });
		var d0 = influence[0].d;
		var d1 = influence.length > 1 ? influence[1].d : (d0 === 0 ? 1 : 0);
		if (d1 === d0) d1 = (d0 + 1) % dm;

		var maxAbs = 0.9;
		ffn.normed_h1.forEach(function (row) {
			maxAbs = Math.max(maxAbs, Math.abs(row[d0] || 0), Math.abs(row[d1] || 0));
		});
		var R = Math.max(0.9, Math.min(2.2, maxAbs * 1.25));
		var N = 14;
		var off = [];
		for (var i = 0; i <= N; i++) off.push((i / N * 2 - 1) * R);

		var hiddenFor = function (xin) {
			var pre = matMul([xin], ffn.W1, ffn.b1)[0];
			if (gated) {
				var value = matMul([xin], ffn.Wg, ffn.bg)[0];
				return pre.map(function (v, k) { return act("silu", v) * ((value[k]) || 0); });
			}
			return pre.map(function (v) { return act(v); });
		};

		var Y = [];
		for (var i = 0; i <= N; i++) {
			var rowY = [];
			for (var j = 0; j <= N; j++) {
				var xin = x0.slice();
				xin[d0] += off[i];
				xin[d1] += off[j];
				rowY.push(matMul([hiddenFor(xin)], ffn.W2, ffn.b2)[0]);
			}
			Y.push(rowY);
		}

		var outDim = 0, outSpan = -1, outMin = 0, outMax = 0;
		for (var o = 0; o < dm; o++) {
			var lo = Infinity, hi = -Infinity;
			for (var i = 0; i <= N; i++) {
				for (var j = 0; j <= N; j++) {
					var v = Y[i][j][o] || 0;
					if (v < lo) lo = v;
					if (v > hi) hi = v;
				}
			}
			if (hi - lo > outSpan) { outSpan = hi - lo; outDim = o; outMin = lo; outMax = hi; }
		}
		var zmin = outMin;
		var zRange = (outMax - outMin) || 1;
		var zrel = [];
		for (var i = 0; i <= N; i++) {
			var zrow = [];
			for (var j = 0; j <= N; j++) zrow.push((Y[i][j][outDim] || 0) - zmin);
			zrel.push(zrow);
		}

		var zGain = 1;
		if (zRange > 1e-6) zGain = Math.min(8, Math.max(1, (R * 0.9) / zRange));
		var zPlot = [];
		var zMaxPlot = 0;
		for (var i = 0; i <= N; i++) {
			var zrowPlot = [];
			for (var j = 0; j <= N; j++) {
				var zz = zrel[i][j] * zGain;
				zrowPlot.push(zz);
				if (zz > zMaxPlot) zMaxPlot = zz;
			}
			zPlot.push(zrowPlot);
		}
		var scaleX = (w * 0.46) / (R * 1.35);
		var scaleY = (h * 0.44) / Math.max(1e-6, R * 1.15 + zMaxPlot);
		var cx = w * 0.5;
		var cy = h * 0.54;
		var yaw = -0.70, pitch = 0.58;
		var cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
		var cpit = Math.cos(pitch), spit = Math.sin(pitch);
		function project(u, v, z) {
			var x1 = u * cyaw - v * syaw;
			var y1 = u * syaw + v * cyaw;
			var y2 = y1 * cpit - z * spit;
			var depth = y1 * spit + z * cpit;
			return { x: cx + x1 * scaleX, y: cy + y2 * scaleY, d: depth };
		}

		var flat = [], surf = [];
		for (var i = 0; i <= N; i++) {
			flat.push([]); surf.push([]);
			for (var j = 0; j <= N; j++) {
				flat[i].push(project(off[i], off[j], 0));
				surf[i].push(project(off[i], off[j], zPlot[i][j]));
			}
		}

		ctx.strokeStyle = c.line;
		ctx.globalAlpha = 0.32;
		ctx.lineWidth = 1;
		for (var i = 0; i <= N; i++) {
			ctx.beginPath();
			for (var j = 0; j <= N; j++) {
				var p = flat[i][j];
				if (j === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
			}
			ctx.stroke();
		}
		for (var j = 0; j <= N; j++) {
			ctx.beginPath();
			for (var i = 0; i <= N; i++) {
				var p = flat[i][j];
				if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
			}
			ctx.stroke();
		}

		ctx.strokeStyle = c.muted;
		ctx.globalAlpha = 0.22;
		ctx.lineWidth = 0.8;
		for (var i = 0; i <= N; i += 2) {
			for (var j = 0; j <= N; j += 2) {
				var a = flat[i][j], b = surf[i][j];
				ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
			}
		}
		ctx.globalAlpha = 1;

		var quads = [];
		for (var i = 0; i < N; i++) {
			for (var j = 0; j < N; j++) {
				var p00 = surf[i][j], p10 = surf[i + 1][j], p11 = surf[i + 1][j + 1], p01 = surf[i][j + 1];
				quads.push({
					p: [p00, p10, p11, p01],
					d: (p00.d + p10.d + p11.d + p01.d) / 4,
					z: (zrel[i][j] + zrel[i + 1][j] + zrel[i + 1][j + 1] + zrel[i][j + 1]) / 4
				});
			}
		}
		quads.sort(function (a, b) { return a.d - b.d; });
		var neg = hex(c.blue), mid = hex(c.paper), pos = hex(c.gold);
		quads.forEach(function (q) {
			var t = Math.max(0, Math.min(1, q.z / zRange));
			var col = t < 0.5 ? mix(neg, mid, t * 2) : mix(mid, pos, (t - 0.5) * 2);
			ctx.beginPath();
			ctx.moveTo(q.p[0].x, q.p[0].y);
			ctx.lineTo(q.p[1].x, q.p[1].y);
			ctx.lineTo(q.p[2].x, q.p[2].y);
			ctx.lineTo(q.p[3].x, q.p[3].y);
			ctx.closePath();
			ctx.fillStyle = rgb(col);
			ctx.globalAlpha = 0.62;
			ctx.fill();
			ctx.strokeStyle = c.line;
			ctx.globalAlpha = 0.35;
			ctx.lineWidth = 0.7;
			ctx.stroke();
		});
		ctx.globalAlpha = 1;

		var centre = surf[N / 2][N / 2];
		if (centre) {
			ctx.beginPath();
			ctx.arc(centre.x, centre.y, 4.2, 0, Math.PI * 2);
			ctx.fillStyle = c.paper;
			ctx.fill();
			ctx.strokeStyle = c.ink;
			ctx.lineWidth = 1.5;
			ctx.stroke();
			ctx.fillStyle = c.ink;
			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(fitText(ctx, display(tokens[tokens.length - 1]), 80), centre.x + 7, centre.y - 6);
		}

		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.textAlign = "left";
		var head = (DE() ? "Raumkrümmung · echte W₁ → " : "Space curvature · real W₁ → ") + actName +
			(DE() ? " → W₂" : " → W₂") + " · " + (DE() ? "Layer " : "layer ") + (layerIdx + 1);
		ctx.fillText(fitText(ctx, head, w - 20), 10, 15);
		var foot = (DE() ? "grau: flacher Schnitt · Farbe: FFN-Ausgabe (Dim " : "grey: flat slice · colour: FFN output (dim ") + (outDim + 1) + ")" +
			(zGain > 1.15 ? (DE() ? " · Höhe ×" : " · height ×") + zGain.toFixed(1) : "");
		ctx.fillText(fitText(ctx, foot, w * 0.62), 10, h - 9);
		ctx.textAlign = "right";
		var slice = (DE() ? "2-D-Schnitt · Dim " : "2-D slice · dims ") + (d0 + 1) + "/" + (d1 + 1) +
			(DE() ? " · übrige Dims fest" : " · other dims fixed");
		ctx.fillText(fitText(ctx, slice, w * 0.5), w - 10, h - 9);
	}

	function drawFFNFan(ctx, w, h, layerIdx) {
		var c = palette();
		var ffn = (window.__tmFFNTrace || [])[layerIdx];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!ffn || !ffn.W1 || !ffn.W2 || !tokens.length) {
			return drawPlaceholder(ctx, w, h, DE() ? "Öffne eine Schicht, um den Gewichts-Fächer zu sehen." : "Open a layer to see the weight fan.");
		}
		var dm = ffn.W1.length, dff = (ffn.W1[0] || []).length;
		if (!dm || !dff) return drawPlaceholder(ctx, w, h, DE() ? "Keine Gewichte." : "No weights.");
		var maxIn = Math.min(dm, 12), maxOut = Math.min(dm, 12), maxHid = Math.min(dff, 16);
		var hidIdx = [];
		for (var q = 0; q < maxHid; q++) {
			hidIdx.push(maxHid === 1 ? 0 : Math.round(q * (dff - 1) / (maxHid - 1)));
		}
		var xIn = 46, xHid = w * 0.5, xOut = w - 46;
		var top = 38, bottom = h - 30;
		var yAt = function (i, n) { return n <= 1 ? (top + bottom) / 2 : top + (bottom - top) * i / Math.max(1, n - 1); };
		var maxW = 1e-9;
		for (var i = 0; i < maxIn; i++) hidIdx.forEach(function (j) { maxW = Math.max(maxW, Math.abs(ffn.W1[i][j] || 0)); });
		hidIdx.forEach(function (j) { for (var o = 0; o < maxOut; o++) maxW = Math.max(maxW, Math.abs(ffn.W2[j][o] || 0)); });
		function edge(x1, y1, x2, y2, weight) {
			var mag = Math.abs(weight) / maxW;
			ctx.strokeStyle = weight >= 0 ? c.blue : c.gold;
			ctx.globalAlpha = Math.min(0.9, 0.12 + mag * 0.75);
			ctx.lineWidth = 0.6 + mag * 3.2;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.quadraticCurveTo(x1 + (x2 - x1) * 0.55, y1 + (y2 - y1) * 0.12, x2, y2);
			ctx.stroke();
		}
		for (var i = 0; i < maxIn; i++) {
			hidIdx.forEach(function (j, ji) {
				edge(xIn, yAt(i, maxIn), xHid, yAt(ji, maxHid), ffn.W1[i][j] || 0);
			});
		}
		hidIdx.forEach(function (j, ji) {
			for (var o = 0; o < maxOut; o++) {
				edge(xHid, yAt(ji, maxHid), xOut, yAt(o, maxOut), ffn.W2[j][o] || 0);
			}
		});
		ctx.globalAlpha = 1;
		var last = (ffn.out_L1 && ffn.out_L1[ffn.out_L1.length - 1]) || [];
		if (!last.length) last = new Array(dff).fill(0);
		var hmin = Math.min.apply(null, last), hmax = Math.max.apply(null, last);
		function node(x, y, r, col) {
			ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fillStyle = col; ctx.fill();
			ctx.strokeStyle = c.paper; ctx.lineWidth = 1.2; ctx.stroke();
		}
		for (var i = 0; i < maxIn; i++) node(xIn, yAt(i, maxIn), 3.6, c.muted);
		hidIdx.forEach(function (j, ji) {
			var t = (last[j] - hmin) / (hmax - hmin || 1);
			var col = rgb(mix(hex(c.blue), hex(c.gold), Math.max(0, Math.min(1, t))));
			node(xHid, yAt(ji, maxHid), 4.4, col);
		});
		for (var o = 0; o < maxOut; o++) node(xOut, yAt(o, maxOut), 3.6, c.muted);
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.textAlign = "center";
		ctx.fillText("input " + dm, xIn, 18);
		ctx.fillText("hidden " + dff, xHid, 18);
		ctx.fillText("output " + dm, xOut, 18);
		ctx.textAlign = "left";
		ctx.fillText("W1 fan-out → W2 projection · " + (DE() ? "Layer " : "layer ") + (layerIdx + 1), xIn, 32);
		if (dff > maxHid || dm > maxIn) {
			ctx.fillText((DE() ? "zeigt " : "showing ") + maxIn + "/" + maxHid + (DE() ? " von " : " of ") + dm + "/" + dff + (DE() ? " Einheiten" : " units"), xIn, h - 8);
		}
	}

	var tdaState = {};
	var TDA_MIN_PERSISTENCE = 0.08;

	function tdaSliderValue(prefix) {
		var slider = document.getElementById(prefix + "-tda-eps");
		var value = slider ? parseFloat(slider.value) : 35;
		if (!isFinite(value)) value = 35;
		return Math.max(0, Math.min(1, value / 100));
	}

	function tdaMode(prefix) {
		var select = document.getElementById(prefix + "-tda-mode");
		return select && select.value === "ffn" ? "ffn" : "residual";
	}

	function tdaInitCanvas(id, draw) {
		var canvas = document.getElementById(id);
		if (!canvas) return;
		if (!canvas._tmTdaApi) {
			canvas._tmTdaApi = initCanvas(canvas, function (ctx, w, h) { draw(ctx, w, h); });
		}
	}

	function tdaRedraw(prefix) {
		var det = document.getElementById(prefix + "-tda-step");
		if (!det || !det.open) return;
		["-tda-before-cloud", "-tda-after-cloud", "-tda-before-barcode", "-tda-after-barcode"].forEach(function (suffix) {
			var canvas = document.getElementById(prefix + suffix);
			if (canvas && canvas._tmTdaApi) canvas._tmTdaApi.redraw();
		});
	}

	function tdaFmt(value) {
		return isFinite(value) ? value.toFixed(2) : "∞";
	}

	function tdaRobustH1(topo) {
		return topo.h1.filter(function (bar) {
			return !isFinite(bar.death) || bar.death - bar.birth >= TDA_MIN_PERSISTENCE;
		}).sort(function (a, b) {
			return (b.death - b.birth) - (a.death - a.birth);
		});
	}

	function tdaComponentGap(before, after) {
		var best = { diff: 0, eps: 0, b0b: 0, b0a: 0, start: 0, end: 0 };
		var points = [];
		for (var i = 0; i <= 100; i++) {
			var eps = i / 100;
			var b0b = window.TDAFFN.bettiAt(before.h0, eps);
			var b0a = window.TDAFFN.bettiAt(after.h0, eps);
			var point = { eps: eps, b0b: b0b, b0a: b0a, diff: b0a - b0b };
			points.push(point);
			if (Math.abs(point.diff) > Math.abs(best.diff)) {
				best = { diff: point.diff, eps: eps, b0b: b0b, b0a: b0a, start: eps, end: eps };
			}
		}
		if (best.diff === 0) return best;
		var idx = Math.round(best.eps * 100);
		var lo = idx, hi = idx;
		while (lo > 0 && Math.sign(points[lo - 1].diff) === Math.sign(best.diff)) lo--;
		while (hi < points.length - 1 && Math.sign(points[hi + 1].diff) === Math.sign(best.diff)) hi++;
		best.start = points[lo].eps;
		best.end = points[hi].eps;
		return best;
	}

	function tdaBarText(bar, de) {
		var birth = de ? "bei ε≈" + tdaFmt(bar.birth) : "at ε≈" + tdaFmt(bar.birth);
		if (!isFinite(bar.death)) return birth + (de ? " und bleibt bis ε=1 offen" : " and stays open to ε=1");
		return birth + (de ? " und wird bei ε≈" + tdaFmt(bar.death) + " gefüllt" : " and is filled at ε≈" + tdaFmt(bar.death));
	}

	function tdaExplanation(prefix) {
		var st = tdaState[prefix];
		if (!st || !window.TDAFFN) return "";
		var de = DE();
		var before = st.before.topo;
		var after = st.after.topo;
		var minP = TDA_MIN_PERSISTENCE.toFixed(2);
		var sentences = [];
		sentences.push(de
			? (st.mode === "ffn"
				? "Verglichen wird der normierte FFN-Eingang mit dem FFN-Update nach W₂; ε ist jeweils ein Anteil am eigenen Durchmesser der Wolke."
				: "Verglichen wird der Zustand h₁ vor dem FFN mit h₂ nach dem Residual-Schritt; ε ist jeweils ein Anteil am eigenen Durchmesser der Wolke.")
			: (st.mode === "ffn"
				? "The comparison is the normalized FFN input against the FFN update after W₂; ε is a fraction of each cloud’s own diameter."
				: "The comparison is the state h₁ before the FFN against h₂ after the residual step; ε is a fraction of each cloud’s own diameter."));

		var gap = tdaComponentGap(before, after);
		var b0b0 = window.TDAFFN.bettiAt(before.h0, 0);
		var b0a0 = window.TDAFFN.bettiAt(after.h0, 0);
		var gapWidth = gap.end - gap.start;
		var gapStrong = gapWidth >= 0.05;
		var startText = b0b0 === b0a0
			? (de ? "Bei ε=0 starten beide mit " + b0b0 + " Komponenten." : "At ε=0 both start with " + b0b0 + " components.")
			: (de ? "Bei ε=0 starten sie mit " + b0b0 + " bzw. " + b0a0 + " Komponenten." : "At ε=0 they start with " + b0b0 + " and " + b0a0 + " components.");
		if (gap.diff === 0) {
			sentences.push(de
				? "Die H0-Kurven sind über die ganze Filtration identisch: Bei ε=0 starten vorher " + b0b0 + " und nachher " + b0a0 + " Komponenten, und sie verschmelzen bei denselben Radien. Der Layer verändert die Komponentenzahl in diesem Schnitt nicht."
				: "The H0 curves are identical over the whole filtration: at ε=0 the cloud starts with " + b0b0 + " components before and " + b0a0 + " after, and they merge at the same radii. The layer does not change the component count on this slice.");
		} else if (!gapStrong) {
			sentences.push(de
				? "Die H0-Kurven unterscheiden sich nur in einem schmalen Fenster um ε≈" + tdaFmt(gap.eps) + " (vorher " + gap.b0b + " von " + b0b0 + ", nachher " + gap.b0a + " von " + b0a0 + " Komponenten); die Breite ≈" + tdaFmt(gapWidth) + " ist zu klein für eine belastbare Aussage. " + startText
				: "The H0 curves differ only in a narrow window around ε≈" + tdaFmt(gap.eps) + " (" + gap.b0b + " of " + b0b0 + " components before, " + gap.b0a + " of " + b0a0 + " after); the width ≈" + tdaFmt(gapWidth) + " is too small for a reliable claim. " + startText);
		} else if (gap.diff > 0) {
			var windowText = gap.end - gap.start < 0.005
				? (de ? "Bei ε≈" + tdaFmt(gap.eps) + " " : "At ε≈" + tdaFmt(gap.eps) + " ")
				: (de ? "Zwischen ε≈" + tdaFmt(gap.start) + " und ε≈" + tdaFmt(gap.end) + " " : "Between ε≈" + tdaFmt(gap.start) + " and ε≈" + tdaFmt(gap.end) + " ");
			sentences.push(de
				? "Die H0-Kurven trennen sich am stärksten bei ε≈" + tdaFmt(gap.eps) + ": vorher sind noch " + gap.b0b + " von " + b0b0 + " Komponenten übrig, nachher " + gap.b0a + " von " + b0a0 + ". " + windowText + "hält der Layer also " + gap.diff + " zusätzliche Komponente" + (gap.diff === 1 ? "" : "n") + " getrennt. " + startText
				: "The H0 curves separate most strongly at ε≈" + tdaFmt(gap.eps) + ": " + gap.b0b + " of " + b0b0 + " components remain before, " + gap.b0a + " of " + b0a0 + " after. " + windowText + "the layer therefore keeps " + gap.diff + " extra component" + (gap.diff === 1 ? "" : "s") + " apart. " + startText);
			if (gap.diff === 1 && gap.b0b === 1 && gap.b0a === 2) {
				sentences.push(de
					? "An dieser Stelle ist vorher alles eine Komponente, nachher zwei: Der Layer trennt einen zusammenhängenden topologischen Verband in zwei Teile."
					: "At this radius everything is one component before and two after: the layer splits one connected topological object into two.");
			}
		} else {
			var merged = -gap.diff;
			var windowText2 = gap.end - gap.start < 0.005
				? (de ? "Bei ε≈" + tdaFmt(gap.eps) + " " : "At ε≈" + tdaFmt(gap.eps) + " ")
				: (de ? "Zwischen ε≈" + tdaFmt(gap.start) + " und ε≈" + tdaFmt(gap.end) + " " : "Between ε≈" + tdaFmt(gap.start) + " and ε≈" + tdaFmt(gap.end) + " ");
			sentences.push(de
				? "Die H0-Kurven fallen am stärksten bei ε≈" + tdaFmt(gap.eps) + " zusammen: vorher sind noch " + gap.b0b + " von " + b0b0 + " Komponenten übrig, nachher nur " + gap.b0a + " von " + b0a0 + ". " + windowText2 + "sind es " + merged + " Komponente" + (merged === 1 ? "" : "n") + " weniger. " + startText
				: "The H0 curves collapse most strongly at ε≈" + tdaFmt(gap.eps) + ": " + gap.b0b + " of " + b0b0 + " components remain before, only " + gap.b0a + " of " + b0a0 + " after. " + windowText2 + "there are " + merged + " fewer component" + (merged === 1 ? "" : "s") + ". " + startText);
			if (gap.diff === -1 && gap.b0b === 2 && gap.b0a === 1) {
				sentences.push(de
					? "An dieser Stelle sind vorher zwei Komponenten getrennt, nachher eine: Der Layer führt sie zusammen."
					: "At this radius two components are separate before and one after: the layer merges them.");
			}
		}

		var rb = tdaRobustH1(before);
		var ra = tdaRobustH1(after);
		var hb = rb.length ? rb[0] : null;
		var ha = ra.length ? ra[0] : null;
		var shortB = before.h1.length - rb.length;
		var shortA = after.h1.length - ra.length;
		if (hb && ha) {
			var similar = Math.abs(hb.birth - ha.birth) < 0.03 &&
				((!isFinite(hb.death) && !isFinite(ha.death)) ||
					(isFinite(hb.death) && isFinite(ha.death) && Math.abs(hb.death - ha.death) < 0.03));
			if (similar) {
				sentences.push(de
					? "Eine belastbare H1-Schleife (Persistenz ≥ " + minP + ") entsteht vorher " + tdaBarText(hb, true) + ", nachher " + tdaBarText(ha, true) + ". Die Schleifenstruktur bleibt erhalten."
					: "A reliable H1 loop (persistence ≥ " + minP + ") appears before " + tdaBarText(hb, false) + ", after " + tdaBarText(ha, false) + ". The loop structure is preserved.");
			} else {
				var pb = hb.death - hb.birth;
				var pa = ha.death - ha.birth;
				var tail = pa > pb + 0.05
					? (de ? "Nachher hält die Schleife länger." : "Afterwards the loop persists longer.")
					: pa < pb - 0.05
						? (de ? "Nachher wird sie früher gefüllt." : "Afterwards it is filled earlier.")
						: (de ? "Die Persistenz ist ähnlich." : "The persistence is similar.");
				sentences.push(de
					? "Eine belastbare H1-Schleife (Persistenz ≥ " + minP + ") entsteht vorher " + tdaBarText(hb, true) + ", nachher " + tdaBarText(ha, true) + ". " + tail
					: "A reliable H1 loop (persistence ≥ " + minP + ") appears before " + tdaBarText(hb, false) + ", after " + tdaBarText(ha, false) + ". " + tail);
			}
			if (rb.length !== ra.length) {
				sentences.push(de
					? "Insgesamt gibt es vorher " + rb.length + " belastbare H1-Balken, nachher " + ra.length + "."
					: "In total there are " + rb.length + " reliable H1 bars before and " + ra.length + " after.");
			}
			if (shortB || shortA) {
				sentences.push(de
					? "Dazu kommen " + shortB + " kurzlebige H1-Balken vorher und " + shortA + " nachher (Persistenz < " + minP + "); sie werden blass gezeichnet und zählen nicht als belastbare Struktur."
					: "There are also " + shortB + " short-lived H1 bars before and " + shortA + " after (persistence < " + minP + "); they are drawn faintly and do not count as a reliable structure.");
			}
		} else if (hb || ha) {
			var only = hb || ha;
			var otherShort = hb ? shortA : shortB;
			sentences.push(de
				? "Eine belastbare H1-Schleife (Persistenz ≥ " + minP + ") entsteht nur " + (hb ? "vorher" : "nachher") + ": " + tdaBarText(only, true) + ". In der anderen Wolke gibt es " + (otherShort ? otherShort + " kurzlebige H1-Balken (Persistenz < " + minP + "), aber keine belastbare Schleife." : "keine H1-Balken.")
				: "A reliable H1 loop (persistence ≥ " + minP + ") appears only " + (hb ? "before" : "after") + ": " + tdaBarText(only, false) + ". The other cloud has " + (otherShort ? otherShort + " short-lived H1 bars (persistence < " + minP + ") but no reliable loop." : "no H1 bars."));
		} else if (before.h1.length || after.h1.length) {
			sentences.push(de
				? "H1 zeigt nur kurzlebige Balken: " + before.h1.length + " vorher und " + after.h1.length + " nachher, alle mit Persistenz < " + minP + ". Sie sind zu kurz für eine belastbare Aussage."
				: "H1 shows only short-lived bars: " + before.h1.length + " before and " + after.h1.length + " after, all with persistence < " + minP + ". They are too short for a reliable claim.");
		} else {
			sentences.push(de
				? "In beiden Wolken entsteht im gezeigten Bereich keine H1-Schleife; die H1-Barcodes sind leer."
				: "No H1 loop appears in either cloud on the shown range; the H1 barcodes are empty.");
		}
		return sentences.join(" ");
	}

	function tdaUpdateLabels(prefix) {
		var st = tdaState[prefix];
		if (!st || !window.TDAFFN) return;
		var epsEl = document.getElementById(prefix + "-tda-eps-val");
		if (epsEl) epsEl.textContent = st.eps.toFixed(2);
		var b0b = window.TDAFFN.bettiAt(st.before.topo.h0, st.eps);
		var b1b = window.TDAFFN.bettiAt(st.before.topo.h1, st.eps);
		var b0a = window.TDAFFN.bettiAt(st.after.topo.h0, st.eps);
		var b1a = window.TDAFFN.bettiAt(st.after.topo.h1, st.eps);
		var rb = tdaRobustH1(st.before.topo);
		var ra = tdaRobustH1(st.after.topo);
		var shortH1 = (st.before.topo.h1.length - rb.length) + (st.after.topo.h1.length - ra.length);
		var betti = document.getElementById(prefix + "-tda-betti");
		if (betti) {
			betti.innerHTML = '<span class="tm-tda-chip">' + (DE() ? "Vorher" : "Before") + ' <b>b₀=' + b0b + '</b> <b>b₁=' + b1b + '</b></span>' +
				'<span class="tm-tda-chip tm-tda-chip--after">' + (DE() ? "Nachher" : "After") + ' <b>b₀=' + b0a + '</b> <b>b₁=' + b1a + '</b></span>' +
				(shortH1 ? '<span class="tm-tda-chip tm-tda-chip--muted">H1 blass: kurzlebig (<' + TDA_MIN_PERSISTENCE.toFixed(2) + ')</span>' : '');
		}
		var status = document.getElementById(prefix + "-tda-status");
		if (!status) return;
		var d0 = b0a - b0b;
		var d1 = ra.length - rb.length;
		var parts = [];
		if (d0 > 0) parts.push(DE() ? "+" + d0 + " Komponente" + (d0 === 1 ? "" : "n") + " getrennt (bei diesem ε)" : "+" + d0 + " component" + (d0 === 1 ? "" : "s") + " separated (at this ε)");
		else if (d0 < 0) parts.push(DE() ? "-" + (-d0) + " Komponente" + (-d0 === 1 ? "" : "n") + " zusammengeführt (bei diesem ε)" : "-" + (-d0) + " component" + (-d0 === 1 ? "" : "s") + " merged (at this ε)");
		if (d1 > 0) parts.push(DE() ? "+" + d1 + " belastbare Schleife" + (d1 === 1 ? "" : "n") + " über die Filtration" : "+" + d1 + " reliable loop" + (d1 === 1 ? "" : "s") + " across the filtration");
		else if (d1 < 0) parts.push(DE() ? "-" + (-d1) + " belastbare Schleife" + (-d1 === 1 ? "" : "n") + " über die Filtration" : "-" + (-d1) + " reliable loop" + (-d1 === 1 ? "" : "s") + " across the filtration");
		else if (shortH1 && (st.before.topo.h1.length || st.after.topo.h1.length)) parts.push(DE() ? "H1 nur kurzlebig (<" + TDA_MIN_PERSISTENCE.toFixed(2) + ") über die Filtration" : "H1 only short-lived (<" + TDA_MIN_PERSISTENCE.toFixed(2) + ") across the filtration");
		var current = (DE() ? "Bei ε = " : "At ε = ") + st.eps.toFixed(2) + ": " +
			(DE() ? "vorher b₀=" + b0b + ", b₁=" + b1b + "; nachher b₀=" + b0a + ", b₁=" + b1a + "." : "before b₀=" + b0b + ", b₁=" + b1b + "; after b₀=" + b0a + ", b₁=" + b1a + ".");
		status.textContent = current + (parts.length ? " " + parts.join(" · ") + "." : "");
	}

	function drawTDACloud(ctx, w, h, cloud, tokens, eps, before, mode) {
		var c = palette();
		ctx.clearRect(0, 0, w, h);
		if (!cloud || !cloud.proj || !cloud.proj.length || !tokens.length) {
			return drawPlaceholder(ctx, w, h, DE() ? "Keine Token-Wolke." : "No token cloud.");
		}
		var proj = cloud.proj;
		var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		proj.forEach(function (p) {
			if (p[0] < minX) minX = p[0];
			if (p[0] > maxX) maxX = p[0];
			if (p[1] < minY) minY = p[1];
			if (p[1] > maxY) maxY = p[1];
		});
		var span = Math.max(maxX - minX, maxY - minY, 1e-6);
		var pad = 30;
		var scale = (Math.min(w, h) - pad * 2) / span;
		var midX = (minX + maxX) / 2;
		var midY = (minY + maxY) / 2;
		function tdaX(p) { return w / 2 + (p[0] - midX) * scale; }
		function tdaY(p) { return h / 2 - (p[1] - midY) * scale; }

		ctx.strokeStyle = c.line;
		ctx.lineWidth = 0.8;
		ctx.globalAlpha = 0.45;
		for (var i = 0; i < proj.length; i++) {
			for (var j = i + 1; j < proj.length; j++) {
				var d = cloud.topo.dist[i][j] / (cloud.topo.scale || 1);
				if (d <= eps + 1e-12) {
					ctx.beginPath();
					ctx.moveTo(tdaX(proj[i]), tdaY(proj[i]));
					ctx.lineTo(tdaX(proj[j]), tdaY(proj[j]));
					ctx.stroke();
				}
			}
		}
		ctx.globalAlpha = 1;
		proj.forEach(function (p, i) {
			var X = tdaX(p), Y = tdaY(p);
			ctx.beginPath();
			ctx.arc(X, Y, 4.2, 0, Math.PI * 2);
			ctx.fillStyle = getPositionColor(i, proj.length - 1);
			ctx.fill();
			ctx.strokeStyle = c.paper;
			ctx.lineWidth = 1.2;
			ctx.stroke();
			ctx.fillStyle = c.ink;
			ctx.font = "600 8px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(fitText(ctx, display(tokens[i] || ""), 54), X + 6, Y + 3);
		});
		var b0 = window.TDAFFN.bettiAt(cloud.topo.h0, eps);
		var b1 = window.TDAFFN.bettiAt(cloud.topo.h1, eps);
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.textAlign = "left";
		var cloudLabel = before
			? (mode === "ffn" ? (DE() ? "normiert (FFN-Eingang)" : "normalized (FFN input)") : (DE() ? "h₁ vor dem FFN" : "h₁ before the FFN"))
			: (mode === "ffn" ? (DE() ? "FFN-Update (W₂)" : "FFN update (W₂)") : (DE() ? "h₂ nach dem FFN" : "h₂ after the FFN"));
		ctx.fillText(fitText(ctx,
			cloudLabel + " · ε=" + eps.toFixed(2) + " · b₀=" + b0 + " · b₁=" + b1, w - 16), 8, 14);
		ctx.textAlign = "right";
		ctx.fillText(fitText(ctx, DE() ? "PCA-Projektion; Kanten aus vollen Distanzen" : "PCA projection; edges from full distances", w - 16), w - 8, h - 6);
	}

	function drawTDABarcode(ctx, w, h, topo, eps) {
		var c = palette();
		ctx.clearRect(0, 0, w, h);
		if (!topo) return drawPlaceholder(ctx, w, h, DE() ? "Keine Barcodes." : "No barcodes.");
		var padL = 34, padR = 12, padT = 22, padB = 24;
		var x0 = padL, x1 = w - padR, y0 = padT, y1 = h - padB;
		function tdaBarX(v) { return x0 + Math.max(0, Math.min(1, v)) * (x1 - x0); }

		ctx.strokeStyle = c.line;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(x0, y1);
		ctx.lineTo(x1, y1);
		ctx.stroke();
		ctx.fillStyle = c.muted;
		ctx.font = "600 8px Barlow, system-ui, sans-serif";
		ctx.textAlign = "center";
		for (var t = 0; t <= 4; t++) {
			var tv = t / 4;
			ctx.beginPath();
			ctx.moveTo(tdaBarX(tv), y1);
			ctx.lineTo(tdaBarX(tv), y1 + 3);
			ctx.stroke();
			ctx.fillText(tv === 0 ? "0" : tv === 1 ? "1" : tv.toFixed(2).replace("0.", "."), tdaBarX(tv), y1 + 13);
		}

		ctx.strokeStyle = c.ink;
		ctx.globalAlpha = 0.65;
		ctx.setLineDash([3, 4]);
		ctx.beginPath();
		ctx.moveTo(tdaBarX(eps), y0);
		ctx.lineTo(tdaBarX(eps), y1);
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.globalAlpha = 1;
		ctx.fillStyle = c.ink;
		ctx.font = "600 8px Barlow, system-ui, sans-serif";
		ctx.textAlign = "right";
		ctx.fillText("ε=" + eps.toFixed(2), x1, 12);

		var gap = 8;
		var areaH = (y1 - y0 - gap) / 2;
		[
			{ name: "H0", bars: topo.h0, color: c.blue, top: y0 },
			{ name: "H1", bars: topo.h1, color: c.gold, top: y0 + areaH + gap }
		].forEach(function (group) {
			ctx.fillStyle = group.color;
			ctx.font = "700 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(group.name, 4, group.top + 9);
			if (group.name === "H1" && group.bars.some(function (bar) {
				return isFinite(bar.death) && bar.death - bar.birth < TDA_MIN_PERSISTENCE;
			})) {
				ctx.fillStyle = c.muted;
				ctx.font = "600 7px Barlow, system-ui, sans-serif";
				ctx.fillText(DE() ? "blass <" + TDA_MIN_PERSISTENCE.toFixed(2) : "faint <" + TDA_MIN_PERSISTENCE.toFixed(2), 22, group.top + 9);
			}
			if (!group.bars.length) {
				ctx.fillStyle = c.muted;
				ctx.font = "600 8px Barlow, system-ui, sans-serif";
				ctx.fillText(group.name === "H1" ? (DE() ? "keine H1-Balken" : "no H1 bars") : (DE() ? "keine H0-Balken" : "no H0 bars"), x0 + 4, group.top + areaH / 2 + 3);
				return;
			}
			var rowH = areaH / Math.max(1, group.bars.length);
			group.bars.forEach(function (bar, i) {
				var yy = group.top + (i + 0.5) * rowH;
				var xd = isFinite(bar.death) ? tdaBarX(bar.death) : x1 - 4;
				var persistence = isFinite(bar.death) ? bar.death - bar.birth : Infinity;
				var shortBar = group.name === "H1" && persistence < TDA_MIN_PERSISTENCE;
				ctx.strokeStyle = group.color;
				ctx.globalAlpha = shortBar ? 0.3 : 0.9;
				ctx.setLineDash(shortBar ? [2, 3] : []);
				ctx.lineWidth = Math.max(1.6, Math.min(3, rowH * 0.5));
				ctx.beginPath();
				ctx.moveTo(tdaBarX(bar.birth), yy);
				ctx.lineTo(xd, yy);
				ctx.stroke();
				if (!isFinite(bar.death)) {
					ctx.beginPath();
					ctx.moveTo(x1 - 4, yy - 3);
					ctx.lineTo(x1, yy);
					ctx.lineTo(x1 - 4, yy + 3);
					ctx.closePath();
					ctx.fillStyle = group.color;
					ctx.fill();
				}
				ctx.setLineDash([]);
				ctx.globalAlpha = 1;
			});
		});
		ctx.fillStyle = c.muted;
		ctx.font = "600 8px Barlow, system-ui, sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(DE() ? "Filtrationsradius ε (normiert)" : "filtration radius ε (normalised)", (x0 + x1) / 2, h - 4);
	}

	function renderTDAStep(layerIdx) {
		var prefix = "unified-layer-" + layerIdx;
		var det = document.getElementById(prefix + "-tda-step");
		if (!det || !det.open) return;
		var ffn = (window.__tmFFNTrace || [])[layerIdx];
		var tokens = tokenList();
		var status = document.getElementById(prefix + "-tda-status");
		if (!ffn || !ffn.h1 || !ffn.h2 || !tokens.length) {
			if (status) status.textContent = DE() ? "Noch keine Token-Zustände." : "No token states yet.";
			return;
		}
		if (!window.TDAFFN || typeof window.TDAFFN.persistence !== "function") {
			if (status) status.textContent = DE() ? "TDA-Bibliothek nicht geladen." : "TDA library not loaded.";
			return;
		}
		var n = Math.min(tokens.length, ffn.h1.length, ffn.h2.length, 16);
		if (n < 2) {
			if (status) status.textContent = DE() ? "Zu wenige Tokens für eine Filtration." : "Too few tokens for a filtration.";
			return;
		}
		var st = tdaState[prefix] || (tdaState[prefix] = {});
		st.layerIdx = layerIdx;
		st.mode = tdaMode(prefix);
		st.tokens = tokens.slice(0, n);
		var beforePoints = (st.mode === "ffn" ? ffn.normed_h1 : ffn.h1).slice(0, n);
		var afterPoints = (st.mode === "ffn" ? ffn.out_FFN : ffn.h2).slice(0, n);
		if (!beforePoints.length || !afterPoints.length) {
			if (status) status.textContent = DE() ? "Noch keine passenden Zustände für diesen Vergleich." : "No matching states for this comparison yet.";
			return;
		}
		st.before = {
			points: beforePoints,
			topo: window.TDAFFN.persistence(beforePoints),
			proj: pca2(beforePoints)
		};
		st.after = {
			points: afterPoints,
			topo: window.TDAFFN.persistence(afterPoints),
			proj: pca2(afterPoints)
		};
		st.eps = tdaSliderValue(prefix);
		var beforeTitle = document.getElementById(prefix + "-tda-before-title");
		var afterTitle = document.getElementById(prefix + "-tda-after-title");
		if (beforeTitle) beforeTitle.textContent = st.mode === "ffn"
			? (DE() ? "Vorher: normiert (FFN-Eingang)" : "Before: normalized (FFN input)")
			: (DE() ? "Vorher: Token-Wolke (h₁)" : "Before: token cloud (h₁)");
		if (afterTitle) afterTitle.textContent = st.mode === "ffn"
			? (DE() ? "Nachher: FFN-Update (W₂)" : "After: FFN update (W₂)")
			: (DE() ? "Nachher: Token-Wolke (h₂)" : "After: token cloud (h₂)");

		tdaInitCanvas(prefix + "-tda-before-cloud", function (ctx, w, h) {
			var cur = tdaState[prefix];
			if (cur) drawTDACloud(ctx, w, h, cur.before, cur.tokens, cur.eps, true, cur.mode);
		});
		tdaInitCanvas(prefix + "-tda-after-cloud", function (ctx, w, h) {
			var cur = tdaState[prefix];
			if (cur) drawTDACloud(ctx, w, h, cur.after, cur.tokens, cur.eps, false, cur.mode);
		});
		tdaInitCanvas(prefix + "-tda-before-barcode", function (ctx, w, h) {
			var cur = tdaState[prefix];
			if (cur) drawTDABarcode(ctx, w, h, cur.before.topo, cur.eps);
		});
		tdaInitCanvas(prefix + "-tda-after-barcode", function (ctx, w, h) {
			var cur = tdaState[prefix];
			if (cur) drawTDABarcode(ctx, w, h, cur.after.topo, cur.eps);
		});
		tdaUpdateLabels(prefix);
		var explain = document.getElementById(prefix + "-tda-explain");
		if (explain) explain.textContent = tdaExplanation(prefix);
		tdaRedraw(prefix);
	}

	function wireTDASteps(root) {
		if (!root) return;
		root.querySelectorAll(".tm-tda-step").forEach(function (det) {
			if (det._tmTdaBound) return;
			det._tmTdaBound = true;
			det.addEventListener("toggle", function () {
				if (!det.open) return;
				var card = det.closest(".tm-layer-card");
				var idx = card ? parseInt(card.getAttribute("data-layer-idx"), 10) : NaN;
				if (!isNaN(idx)) renderTDAStep(idx);
			});
			var slider = det.querySelector('input[type="range"]');
			if (slider && !slider._tmTdaBound) {
				slider._tmTdaBound = true;
				slider.addEventListener("input", function () {
					var card = det.closest(".tm-layer-card");
					var idx = card ? parseInt(card.getAttribute("data-layer-idx"), 10) : NaN;
					if (isNaN(idx)) return;
					var prefix = "unified-layer-" + idx;
					var st = tdaState[prefix];
					var value = parseFloat(slider.value);
					if (!st) { renderTDAStep(idx); return; }
					if (!isFinite(value)) return;
					st.eps = Math.max(0, Math.min(1, value / 100));
					tdaUpdateLabels(prefix);
					tdaRedraw(prefix);
				});
			}
			var mode = det.querySelector("select");
			if (mode && !mode._tmTdaBound) {
				mode._tmTdaBound = true;
				mode.addEventListener("change", function () {
					var card = det.closest(".tm-layer-card");
					var idx = card ? parseInt(card.getAttribute("data-layer-idx"), 10) : NaN;
					if (!isNaN(idx)) renderTDAStep(idx);
				});
			}
		});
	}

	function attachFFNHeatmapHover(canvas, getEntry) {
		if (!canvas || canvas._tmFfnHoverBound) return;
		canvas._tmFfnHoverBound = true;
		var parent = canvas.parentNode;
		if (parent && getComputedStyle(parent).position === "static") parent.style.position = "relative";
		var tip = document.createElement("div");
		tip.className = "tm-ffn-tooltip";
		tip.hidden = true;
		(parent || canvas).appendChild(tip);
		canvas.addEventListener("mousemove", function (event) {
			var entry = getEntry();
			var layerIdx = entry.layerIdx;
			var which = entry.which;
			var ffn = (window.__tmFFNTrace || [])[layerIdx];
			var tokens = tokenList();
			var matrix = ffn ? (which === "h1" ? ffn.h1 : which === "norm" ? ffn.normed_h1 : which === "outFFN" ? ffn.out_FFN : ffn.out_L1) : null;
			if (!ffn || !matrix || !matrix.length || !tokens.length) { tip.hidden = true; return; }
			var rows = Math.min(tokens.length, matrix.length);
			var cols = Math.min((matrix[0] || []).length, 64);
			var rect = canvas.getBoundingClientRect();
			var narrow = rect.width < 300;
			var left = narrow ? 68 : 90, top = 26, right = 14, bottom = 24;
			var cw = (rect.width - left - right) / Math.max(1, cols);
			var ch = (rect.height - top - bottom) / Math.max(1, rows);
			var x = event.clientX - rect.left, y = event.clientY - rect.top;
			var col = Math.floor((x - left) / cw), row = Math.floor((y - top) / ch);
			if (x < left || y < top || col < 0 || row < 0 || col >= cols || row >= rows) { tip.hidden = true; return; }
			var value = (matrix[row] && matrix[row][col]) || 0;
			var token = (ffn.tokenStrings && ffn.tokenStrings[row]) || tokens[row] || "";
			var label = which === "h1" ? (DE() ? "Eingang" : "input") : which === "norm" ? (DE() ? "normiert" : "normalized") : which === "outFFN" ? (DE() ? "Ausgabe" : "output") : ((typeof tmActivationLabel === "function") ? tmActivationLabel() : "GELU");
			tip.textContent = display(token) + " · dim " + col + " · " + label + " " + value.toFixed(3);
			tip.hidden = false;
			var pr = (parent || canvas).getBoundingClientRect();
			tip.style.left = Math.max(0, Math.min(pr.width - 160, event.clientX - pr.left + 12)) + "px";
			tip.style.top = Math.max(0, event.clientY - pr.top + 12) + "px";
		});
		canvas.addEventListener("mouseleave", function () { tip.hidden = true; });
	}

	function drawFFN(ctx, w, h) {
		var c = palette();
		var trace = window.__tmLayerTrace || [];
		var ffn = window.__tmFFNTrace || [];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!trace.length || !tokens.length) return drawPlaceholder(ctx, w, h, DE() ? "Noch keine FFN-Daten." : "No FFN data yet.");
		if (ffn.length) return drawFFNHeatmap(ctx, w, h, ffn.length - 1);
		var layer = ffn.length ? ffn[ffn.length - 1] : null;
		var pad = 20;
		if (!layer) {
			// Fall back to the update magnitude per token for the last layer.
			var last = trace[trace.length - 1];
			var vals = tokens.map(function (_, i) { return diffNorm(last.h_out[i], last.h_attn[i]); });
			var max = Math.max.apply(null, vals) || 1;
			var bw = (w - pad * 2) / Math.max(1, vals.length);
			vals.forEach(function (v, i) {
				var bh = (v / max) * (h - 50);
				ctx.fillStyle = c.green;
				ctx.fillRect(pad + i * bw + 2, h - pad - bh, Math.max(2, bw - 4), bh);
			});
			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.fillText(DE() ? "FFN-Update pro Token (letzte Schicht)" : "FFN update per token (last layer)", pad, 16);
			return;
		}
		var activations = layer.out_L1[layer.out_L1.length - 1] || [];
		var maxA = Math.max.apply(null, activations.map(function (x) { return Math.abs(x); })) || 1;
		var n = activations.length;
		var slot = (w - pad * 2) / Math.max(1, n);
		activations.forEach(function (value, i) {
			var bh = Math.abs(value) / maxA * (h - 70);
			ctx.fillStyle = value >= 0 ? c.green : c.lilac;
			ctx.fillRect(pad + i * slot + 1, h - pad - bh, Math.max(1, slot - 2), bh);
		});
		ctx.strokeStyle = c.line;
		ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
		ctx.fillStyle = c.muted;
		ctx.font = "600 10px Barlow, system-ui, sans-serif";
		ctx.textAlign = "left";
		ctx.fillText(DE() ? "FFN-Hidden-Aktivierung des letzten Tokens (GELU) · grün positiv, lila negativ" : "FFN hidden activation of the last token (GELU) · green positive, lilac negative", pad, 16);
	}

	function drawCurlyGroup(ctx, x1, x2, y, height, color) {
		var mid = (x1 + x2) / 2;
		ctx.save();
		ctx.strokeStyle = color;
		ctx.lineWidth = 1.2;
		ctx.beginPath();
		ctx.moveTo(x1, y + height);
		ctx.quadraticCurveTo(x1, y, mid, y);
		ctx.quadraticCurveTo(x2, y, x2, y + height);
		ctx.moveTo(mid, y);
		ctx.lineTo(mid, y + height * 0.55);
		ctx.stroke();
		ctx.restore();
	}

	function drawResidual(ctx, w, h) {
		var c = palette();
		var trace = window.__tmLayerTrace || [];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!trace.length || !tokens.length) return drawPlaceholder(ctx, w, h, DE() ? "Noch keine Residual-Daten." : "No residual data yet.");
		var layers = trace.length;
		var pad = 18, left = 78, top = 48;
		var rows = tokens.length;
		var cols = layers * 2 + 2;
		var cw = (w - left - pad) / Math.max(1, cols);
		var ch = (h - top - pad) / Math.max(1, rows);
		var max = 0;
		tokens.forEach(function (_, i) {
			max = Math.max(max, norm(trace[0].h_in[i] || []), norm(trace[layers - 1].h_out[i] || []));
		});
		trace.forEach(function (layer) {
			tokens.forEach(function (_, i) {
				max = Math.max(max, diffNorm(layer.h_attn[i], layer.h_in[i]), diffNorm(layer.h_out[i], layer.h_attn[i]));
			});
		});
		max = max || 1;
		for (var i = 0; i < rows; i++) {
			var y = top + i * ch;
			var input = norm(trace[0].h_in[i] || []) / max;
			ctx.fillStyle = "rgba(" + hex(c.muted).join(",") + "," + (0.12 + input * 0.7) + ")";
			ctx.fillRect(left, y, cw, ch);
			var output = norm(trace[layers - 1].h_out[i] || []) / max;
			ctx.fillStyle = "rgba(" + hex(c.gold).join(",") + "," + (0.12 + output * 0.7) + ")";
			ctx.fillRect(left + (cols - 1) * cw, y, cw, ch);
		}
		for (var l = 0; l < layers; l++) {
			var layer = trace[l];
			for (var i2 = 0; i2 < rows; i2++) {
				var a = diffNorm(layer.h_attn[i2], layer.h_in[i2]) / max;
				var f = diffNorm(layer.h_out[i2], layer.h_attn[i2]) / max;
				var y2 = top + i2 * ch;
				ctx.fillStyle = "rgba(" + hex(c.blue).join(",") + "," + (0.06 + a * 0.9) + ")";
				ctx.fillRect(left + (1 + l * 2) * cw, y2, cw, ch);
				ctx.fillStyle = "rgba(" + hex(c.green).join(",") + "," + (0.06 + f * 0.9) + ")";
				ctx.fillRect(left + (2 + l * 2) * cw, y2, cw, ch);
			}
			var bx1 = left + (1 + l * 2) * cw + 2;
			var bx2 = left + (3 + l * 2) * cw - 2;
			var by = top - 16;
			drawCurlyGroup(ctx, bx1, bx2, by, 8, c.muted);
			ctx.fillStyle = c.muted;
			ctx.font = "700 8px Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText("L" + (l + 1), (bx1 + bx2) / 2, by - 4);
		}
		ctx.fillStyle = c.ink;
		ctx.font = "700 9px Barlow, system-ui, sans-serif";
		ctx.textAlign = "center";
		ctx.fillText("h0", left + cw / 2, top - 10);
		ctx.fillText("hN", left + (cols - 0.5) * cw, top - 10);
		tokens.forEach(function (token, i3) {
			ctx.fillStyle = c.ink;
			ctx.font = "600 8px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			ctx.fillText(fitText(ctx, display(token), 66), left - 6, top + i3 * ch + ch / 2);
		});
		ctx.textBaseline = "alphabetic";
		ctx.textAlign = "left";
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.fillText(DE() ? "h0 = Token-Embedding + Position → Updates der Layer → hN" : "h0 = token embedding + position → layer updates → hN", left, 15);
		var lx = left;
		ctx.fillStyle = c.muted; ctx.fillRect(lx, h - 12, 10, 5);
		ctx.fillStyle = c.blue; ctx.fillRect(lx + 84, h - 12, 10, 5);
		ctx.fillStyle = c.green; ctx.fillRect(lx + 164, h - 12, 10, 5);
		ctx.fillStyle = c.gold; ctx.fillRect(lx + 236, h - 12, 10, 5);
		ctx.fillStyle = c.muted;
		ctx.font = "600 8px Barlow, system-ui, sans-serif";
		ctx.fillText(DE() ? "h0" : "h0", lx + 14, h - 7);
		ctx.fillText("Attention", lx + 98, h - 7);
		ctx.fillText("FFN", lx + 178, h - 7);
		ctx.fillText(DE() ? "hN (Ausgabe)" : "hN (output)", lx + 250, h - 7);
	}

	function drawUnembed(ctx, w, h) {
		var c = palette();
		var cached = window._cachedFinalProjection;
		var space = window.persistentEmbeddingSpace;
		ctx.clearRect(0, 0, w, h);
		if (!cached || !cached.h_final || !cached.h_final.length || !space) {
			return drawPlaceholder(ctx, w, h, DE() ? "Starte das Modell, um die nächste Verteilung zu sehen." : "Run the model to see the next-token distribution.");
		}
		var vec = cached.h_final[cached.h_final.length - 1];
		var words = Object.keys(space);
		var tempEl = document.getElementById("tm-unembed-temp") || document.getElementById("transformer-temperature");
		var temperature = Math.max(0.05, parseFloat(tempEl ? tempEl.value : 1) || 1);
		var topkEl = document.getElementById("tm-unembed-topk");
		var topk = Math.max(1, parseInt(topkEl ? topkEl.value : "8", 10) || 8);
		var logits = words.map(function (word) {
			var dot = 0;
			for (var i = 0; i < vec.length; i++) dot += vec[i] * (space[word][i] || 0);
			return { word: word, logit: dot };
		});
		var ranked = logits.slice().sort(function (a, b) { return (b.logit / temperature) - (a.logit / temperature); }).slice(0, topk);
		var maxLogit = Math.max.apply(null, ranked.map(function (x) { return x.logit / temperature; }));
		var exps = ranked.map(function (x) { return Math.exp(x.logit / temperature - maxLogit); });
		var sum = exps.reduce(function (a, b) { return a + b; }, 0) || 1;
		var scores = ranked.map(function (x, i) {
			return { word: x.word, score: x.logit, prob: exps[i] / sum };
		});
		window.__tmUnembedTop = scores.map(function (item) { return item.word; });
		window.__tmUnembedProbs = scores.map(function (item) { return item.prob; });
		var max = scores[0].prob || 1;
		var pad = 16, left = 84, top = 18;
		var rowH = (h - top - pad) / Math.max(1, scores.length);
		scores.forEach(function (item, i) {
			var y = top + i * rowH;
			var bw = Math.max(2, (item.prob / max) * (w - left - pad));
			ctx.fillStyle = i === 0 ? c.gold : c.blue;
			ctx.fillRect(left, y + rowH * 0.18, bw, Math.max(4, rowH * 0.58));
			ctx.fillStyle = c.ink;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			ctx.fillText(fitText(ctx, display(item.word), 74), left - 6, y + rowH / 2);
			ctx.textAlign = "left";
			ctx.fillStyle = c.muted;
			ctx.fillText((item.prob * 100).toFixed(1) + "%", left + bw + 6, y + rowH / 2);
		});
		ctx.textBaseline = "alphabetic";
		ctx.textAlign = "left";
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.fillText((DE() ? "Nächste-Token-Wahrscheinlichkeiten · T=" : "next-token probabilities · T=") + temperature.toFixed(1) + (DE() ? " · Top-k=" : " · top-k=") + topk, pad, 12);
	}

	var layerCanvasRegistry = {};
	var migrationCanvasRegistry = {};

	function drawArrow(ctx, x1, y1, x2, y2, color, width) {
		ctx.save();
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.lineWidth = width || 1.6;
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
		var angle = Math.atan2(y2 - y1, x2 - x1);
		ctx.beginPath();
		ctx.moveTo(x2, y2);
		ctx.lineTo(x2 - 7 * Math.cos(angle - 0.4), y2 - 7 * Math.sin(angle - 0.4));
		ctx.lineTo(x2 - 7 * Math.cos(angle + 0.4), y2 - 7 * Math.sin(angle + 0.4));
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	function drawMigrationArrows(ctx, w, h, layerIdx, rot) {
		var c = palette();
		var trace = (window.__tmLayerTrace || [])[layerIdx];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!trace || !tokens.length) {
			return drawPlaceholder(ctx, w, h, DE() ? "Öffne eine Schicht, um die Bewegung der Punkte zu sehen." : "Open a layer to see the points move.");
		}
		var n = tokens.length;
		var all = [];
		for (var i = 0; i < n; i++) {
			all.push(trace.h_in[i]);
			all.push(trace.h_out[i]);
		}
		var view = projectForView(all, (all[0] || []).length, rot || { y: -0.6, x: 0.35 });
		var coords = view.coords;
		window.__tmStepViewLabels = window.__tmStepViewLabels || {};
		window.__tmStepViewLabels.migration = view.label;
		var start = coords.slice(0, n);
		var end = coords.slice(n);
		var map;
		if (view.is3d) {
			map = make3DMap(w, h);
			draw3DAxes(ctx, w, h, view, map);
		} else {
			var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
			coords.forEach(function (p) {
				minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
				minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
			});
			var spanX = maxX - minX || 1, spanY = maxY - minY || 1;
			var pad = 30;
			map = function (p) {
				return {
					x: pad + (p[0] - minX) / spanX * (w - pad * 2),
					y: h - pad - (p[1] - minY) / spanY * (h - pad * 2)
				};
			};
			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
			ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.stroke();
		}
		var order = [];
		for (var t = 0; t < n; t++) order.push(t);
		order.sort(function (a, b) { return (start[a][2] || 0) - (start[b][2] || 0); });
		order.forEach(function (t) {
			var a = map(start[t]);
			var b = map(end[t]);
			var col = positionRgb(t, n - 1);
			ctx.globalAlpha = view.is3d ? depthAlpha(start[t]) : 1;
			ctx.beginPath();
			ctx.arc(a.x, a.y, view.is3d ? 2.4 + (start[t][3] || 1) : 3.2, 0, Math.PI * 2);
			ctx.fillStyle = c.muted;
			ctx.fill();
			drawArrow(ctx, a.x, a.y, b.x, b.y, rgb(col), view.is3d ? 1.4 + (start[t][3] || 1) * 0.7 : 1.8);
			ctx.globalAlpha = view.is3d ? depthAlpha(end[t]) : 1;
			ctx.beginPath();
			ctx.arc(b.x, b.y, view.is3d ? 3.2 + (end[t][3] || 1) * 1.2 : 4.4, 0, Math.PI * 2);
			ctx.fillStyle = rgb(col);
			ctx.fill();
			ctx.strokeStyle = c.paper;
			ctx.lineWidth = 1.3;
			ctx.stroke();
			ctx.font = "700 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			ctx.fillStyle = c.ink;
			ctx.fillText(fitText(ctx, display(tokens[t]), 64), b.x, b.y - 9);
		});
		ctx.globalAlpha = 1;
		ctx.textAlign = "left";
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.fillText(view.label + (view.is3d ? (DE() ? " · ziehen zum Drehen · grau = vorher · Farbe = danach" : " · drag to rotate · grey = before · colour = after") : (DE() ? " · grau = vor dieser Schicht · Farbe = danach" : " · grey = before this layer · colour = after")), 14, 16);
	}

	var signalCanvasRegistry = {};
	var residualHeatmapRegistry = {};

	function drawLayerSignal(ctx, w, h, layerIdx, mode) {
		var c = palette();
		var trace = (window.__tmLayerTrace || [])[layerIdx];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!trace || !tokens.length) {
			return drawPlaceholder(ctx, w, h, DE() ? "Öffne eine Schicht, um ihr Signal zu sehen." : "Open a layer to see its signal.");
		}
		mode = mode || "attention";
		var n = tokens.length;
		if (mode === "pre") {
			var pPad = 90, pLeft = 90, pTop = 18, pBottom = 32;
			var pCell = (w - pLeft - pPad) / Math.max(1, n);
			var pMax = 0.0001;
			tokens.forEach(function (_, i) {
				pMax = Math.max(pMax, norm(trace.h_in[i] || []), norm(trace.h_out[i] || []));
			});
			var pScale = (h - pTop - pBottom) / pMax;
			var pBase = h - pBottom;
			var decrease = "#b23a48";
			ctx.globalAlpha = 1;
			ctx.fillStyle = c.blue;
			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.fillText(DE() ? "blau = vorher · grün = Zunahme · rot = Abnahme" : "blue = before · green = increase · red = decrease", pLeft, 16);
			tokens.forEach(function (token, i) {
				var before = norm(trace.h_in[i] || []);
				var after = norm(trace.h_out[i] || []);
				var x = pLeft + i * pCell + pCell * 0.2;
				var bw = Math.max(1, pCell * 0.55);
				ctx.globalAlpha = 0.9;
				ctx.fillStyle = c.blue;
				ctx.fillRect(x, pBase - before * pScale, bw, before * pScale);
				if (after >= before) {
					ctx.fillStyle = c.green;
					ctx.fillRect(x, pBase - after * pScale, bw, (after - before) * pScale);
				} else {
					ctx.fillStyle = decrease;
					ctx.fillRect(x, pBase - before * pScale, bw, (before - after) * pScale);
				}
				ctx.globalAlpha = 1;
				if (n <= 40 || i % Math.ceil(n / 40) === 0) {
					ctx.save();
					ctx.translate(x + bw / 2, pBase + 8);
					ctx.rotate(-0.6);
					ctx.fillStyle = c.ink;
					ctx.font = "600 8px Barlow, system-ui, sans-serif";
					ctx.textAlign = "left";
					ctx.fillText(fitText(ctx, display(token), 64), 0, 0);
					ctx.restore();
				}
			});
			return;
		}
		if (mode === "block") {
			var bPad = 16, bLeft = 90, bTop = 18, bBottom = 32;
			var cell = (w - bLeft - bPad) / Math.max(1, n);
			var bMax = 0.0001;
			tokens.forEach(function (_, i) {
				bMax = Math.max(bMax, norm(trace.h_in[i] || []), norm(trace.h_out[i] || []));
			});
			var bScale = (h - bTop - bBottom) / bMax;
			var bBase = h - bBottom;
			tokens.forEach(function (token, i) {
				var n0 = norm(trace.h_in[i] || []);
				var n2 = norm(trace.h_out[i] || []);
				var x = bLeft + i * cell + cell * 0.1;
				var bw = Math.max(1, cell * 0.34);
				ctx.fillStyle = c.lime;
				ctx.globalAlpha = 0.75;
				ctx.fillRect(x, bBase - n0 * bScale, bw, n0 * bScale);
				ctx.globalAlpha = 1;
				ctx.fillStyle = c.green;
				ctx.fillRect(x + bw + 1, bBase - n2 * bScale, bw, n2 * bScale);
				if (n <= 40 || i % Math.ceil(n / 40) === 0) {
					ctx.save();
					ctx.translate(x + bw, bBase + 8);
					ctx.rotate(-0.6);
					ctx.fillStyle = c.ink;
					ctx.font = "600 8px Barlow, system-ui, sans-serif";
					ctx.textAlign = "left";
					ctx.fillText(fitText(ctx, display(token), 64), 0, 0);
					ctx.restore();
				}
			});
			return;
		}
		var padL = 90, padR = 18, padT = 30, padB = 30;
		var bw = (w - padL - padR) / Math.max(1, n);
		var max = 0.0001;
		tokens.forEach(function (_, i) {
			max = Math.max(max, norm(trace.h_in[i] || []), norm(trace.h_attn[i] || []), norm(trace.h_out[i] || []));
		});
		var scale = (h - padT - padB) / max;
		var baseY = h - padB;
		var decrease = "#b23a48";
		ctx.strokeStyle = c.line;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(padL, baseY);
		ctx.lineTo(w - padR, baseY);
		ctx.stroke();

		var initialLine = [], finalLine = [];
		tokens.forEach(function (token, i) {
			var n0 = norm(trace.h_in[i] || []);
			var n1 = norm(trace.h_attn[i] || []);
			var n2 = norm(trace.h_out[i] || []);
			var baseN = mode === "ffn" ? n1 : n0;
			var afterN = mode === "ffn" ? n2 : n1;
			var x = padL + i * bw + Math.max(1, bw * 0.12);
			var width = Math.max(1, bw * 0.76);
			var y0 = baseY - n0 * scale;
			var y1 = baseY - n1 * scale;
			var y2 = baseY - n2 * scale;
			var yBase = baseY - baseN * scale;
			var yAfter = baseY - afterN * scale;
			initialLine.push([x + width / 2, y0]);
			finalLine.push([x + width / 2, y2]);

			ctx.fillStyle = c.muted;
			ctx.globalAlpha = 0.35;
			ctx.fillRect(x, yBase, width, baseN * scale);
			ctx.globalAlpha = 1;
			ctx.fillStyle = afterN >= baseN ? (mode === "ffn" ? c.green : c.blue) : decrease;
			ctx.globalAlpha = 0.9;
			ctx.fillRect(x, Math.min(yBase, yAfter), width, Math.abs(yAfter - yBase));
			ctx.globalAlpha = 1;
			ctx.beginPath();
			ctx.arc(x + width / 2, yAfter, 2.6, 0, Math.PI * 2);
			ctx.fillStyle = c.gold;
			ctx.fill();

			if (mode === "ffn") {
				ctx.strokeStyle = c.muted;
				ctx.globalAlpha = 0.55;
				ctx.setLineDash([3, 3]);
				ctx.beginPath();
				ctx.moveTo(x - 2, y0);
				ctx.lineTo(x + width + 2, y0);
				ctx.stroke();
				ctx.setLineDash([]);
				ctx.strokeStyle = c.gold;
				ctx.globalAlpha = 0.9;
				ctx.beginPath();
				ctx.moveTo(x - 2, y2);
				ctx.lineTo(x + width + 2, y2);
				ctx.stroke();
				ctx.globalAlpha = 1;
				if (n2 < n0) {
					ctx.fillStyle = decrease;
					ctx.font = "700 8px Barlow, system-ui, sans-serif";
					ctx.textAlign = "right";
					ctx.fillText("↓", x - 3, Math.max(y0, y2) - 2);
				}
			}

			if (n <= 40 || i % Math.ceil(n / 40) === 0) {
				ctx.save();
				ctx.translate(x + width / 2, baseY + 8);
				ctx.rotate(-0.6);
				ctx.fillStyle = c.ink;
				ctx.font = "600 8px Barlow, system-ui, sans-serif";
				ctx.textAlign = "left";
				ctx.fillText(fitText(ctx, display(token), 64), 0, 0);
				ctx.restore();
			}
		});

		if (mode === "ffn") {
			ctx.strokeStyle = c.muted;
			ctx.globalAlpha = 0.35;
			ctx.lineWidth = 1;
			ctx.beginPath();
			initialLine.forEach(function (p, i) {
				if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
			});
			ctx.stroke();
			ctx.strokeStyle = c.gold;
			ctx.globalAlpha = 0.85;
			ctx.beginPath();
			finalLine.forEach(function (p, i) {
				if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
			});
			ctx.stroke();
			ctx.globalAlpha = 1;
		}

		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.textAlign = "left";
		var title = mode === "ffn"
			? ((DE() ? "FFN-Signal · Schicht " : "FFN signal · layer ") + (layerIdx + 1))
			: ((DE() ? "Attention-Signal · Schicht " : "Attention signal · layer ") + (layerIdx + 1));
		ctx.fillText(title, padL, 14);
		ctx.fillStyle = c.muted;
		ctx.fillRect(padL, h - 12, 10, 5);
		ctx.fillStyle = mode === "ffn" ? c.green : c.blue;
		ctx.fillRect(padL + 82, h - 12, 10, 5);
		ctx.fillStyle = decrease;
		ctx.fillRect(padL + 164, h - 12, 10, 5);
		ctx.fillStyle = c.muted;
		ctx.font = "600 8px Barlow, system-ui, sans-serif";
		ctx.fillText(DE() ? "Start" : "start", padL + 14, h - 7);
		ctx.fillText(DE() ? "Zunahme" : "increase", padL + 96, h - 7);
		ctx.fillText(DE() ? "Abnahme" : "decrease", padL + 178, h - 7);
	}

	function drawResidualHeatmap(ctx, w, h, layerIdx, which) {
		var c = palette();
		var trace = (window.__tmLayerTrace || [])[layerIdx];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!trace || !tokens.length) {
			return drawPlaceholder(ctx, w, h, DE() ? "Öffne eine Schicht, um den Residual-Stream zu sehen." : "Open a layer to see the residual stream.");
		}
		var rows = tokens.length;
		var d = trace.h_in[0].length;
		var source;
		if (which === "delta") {
			source = trace.h_in.map(function (row, i) {
				return row.map(function (v, j) { return (trace.h_out[i][j] || 0) - v; });
			});
		} else if (which === "normdelta") {
			source = trace.h_in.map(function (row, i) {
				return row.map(function (v, j) { return ((trace.normH && trace.normH[i] ? trace.normH[i][j] : 0) || 0) - v; });
			});
		} else if (which === "norm") {
			source = trace.normH || trace.h_in;
		} else {
			source = which === "in" ? trace.h_in : trace.h_out;
		}
		var minAll = Infinity, maxAll = -Infinity;
		if (which === "delta" || which === "normdelta") {
			source.forEach(function (row) { row.forEach(function (v) { minAll = Math.min(minAll, v); maxAll = Math.max(maxAll, v); }); });
		} else {
			tokens.forEach(function (_, i) {
				(trace.h_in[i] || []).forEach(function (v) { minAll = Math.min(minAll, v); maxAll = Math.max(maxAll, v); });
				(trace.h_out[i] || []).forEach(function (v) { minAll = Math.min(minAll, v); maxAll = Math.max(maxAll, v); });
				if (trace.normH && trace.normH[i]) trace.normH[i].forEach(function (v) { minAll = Math.min(minAll, v); maxAll = Math.max(maxAll, v); });
			});
		}
		if (!isFinite(minAll) || !isFinite(maxAll)) { minAll = -1; maxAll = 1; }
		ctx.canvas._tmResidualRange = { min: minAll, max: maxAll };
		var left = 74, top = 34, right = 10, bottom = 8;
		var cw = (w - left - right) / Math.max(1, d);
		var ch = (h - top - bottom) / Math.max(1, rows);
		function cellColor(v) {
			if (v < 0) return rgb(mix(hex(c.paper), hex(c.blue), Math.min(1, v / (minAll || -1))));
			return rgb(mix(hex(c.paper), hex(c.gold), Math.min(1, v / (maxAll || 1))));
		}
		for (var i = 0; i < rows; i++) {
			for (var j = 0; j < d; j++) {
				ctx.fillStyle = cellColor((source[i] && source[i][j]) || 0);
				ctx.fillRect(left + j * cw, top + i * ch, Math.ceil(cw) + 0.5, Math.ceil(ch) + 0.5);
			}
			ctx.fillStyle = getPositionColor(i, rows - 1);
			ctx.font = "600 8px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			ctx.fillText(fitText(ctx, display(tokens[i]), 64), left - 7, top + i * ch + ch / 2);
		}
		ctx.textBaseline = "alphabetic";
		ctx.fillStyle = c.muted;
		ctx.font = "600 8px Barlow, system-ui, sans-serif";
		ctx.textAlign = "center";
		var step = Math.max(1, Math.ceil(d / 8));
		for (var k = 0; k < d; k += step) {
			ctx.fillText(String(k), left + k * cw + cw / 2, top - 7);
		}
		ctx.textAlign = "left";
		ctx.fillText(DE() ? "Dimension →" : "dimension →", left, 12);
	}

	function drawLayerResidual(ctx, w, h, layerIdx) {
		var c = palette();
		var trace = (window.__tmLayerTrace || [])[layerIdx];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!trace || !tokens.length) {
			return drawPlaceholder(ctx, w, h, DE() ? "Öffne eine Schicht, um ihren Residual-Stream zu sehen." : "Open a layer to see its residual stream.");
		}
		var shown = tokens;
		var pad = 14, left = 82, top = 26;
		var rowH = (h - top - pad) / Math.max(1, shown.length);
		var max = 0;
		shown.forEach(function (_, i) {
			max = Math.max(max, norm(trace.h_in[i] || []), norm(trace.h_attn[i] || []), norm(trace.h_out[i] || []));
		});
		max = max || 1;
		var x0 = left, x1 = w - pad;
		function px(value) { return x0 + (value / max) * (x1 - x0); }
		ctx.strokeStyle = c.line;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(x0, top - 8);
		ctx.lineTo(x0, h - pad);
		ctx.stroke();
		shown.forEach(function (token, i) {
			var y = top + i * rowH + rowH / 2;
			var n0 = norm(trace.h_in[i] || []);
			var n1 = norm(trace.h_attn[i] || []);
			var n2 = norm(trace.h_out[i] || []);
			ctx.strokeStyle = c.line;
			ctx.globalAlpha = 0.55;
			ctx.beginPath();
			ctx.moveTo(x0, y);
			ctx.lineTo(x1, y);
			ctx.stroke();
			ctx.globalAlpha = 1;
			ctx.strokeStyle = c.blue;
			ctx.lineWidth = 2.2;
			ctx.beginPath();
			ctx.moveTo(px(n0), y);
			ctx.lineTo(px(n1), y);
			ctx.stroke();
			ctx.strokeStyle = c.green;
			ctx.beginPath();
			ctx.moveTo(px(n1), y);
			ctx.lineTo(px(n2), y);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(px(n0), y, 2.6, 0, Math.PI * 2);
			ctx.fillStyle = c.muted;
			ctx.fill();
			ctx.beginPath();
			ctx.arc(px(n1), y, 3.2, 0, Math.PI * 2);
			ctx.fillStyle = c.blue;
			ctx.fill();
			ctx.beginPath();
			ctx.arc(px(n2), y, 3.2, 0, Math.PI * 2);
			ctx.fillStyle = c.green;
			ctx.fill();
			ctx.fillStyle = c.ink;
			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			ctx.fillText(fitText(ctx, display(token), 74), left - 7, y);
		});
		ctx.textBaseline = "alphabetic";
		ctx.textAlign = "left";
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.fillText(DE() ? "Norm des laufenden Vektors: grau = Eingabe, blau = nach Attention, grün = nach FFN" : "running-vector norm: grey = input, blue = after attention, green = after FFN", pad, 14);

	}

	function redrawLayerCanvases() {
		Object.keys(layerCanvasRegistry).forEach(function (key) {
			layerCanvasRegistry[key].api.redraw();
		});
		Object.keys(migrationCanvasRegistry).forEach(function (key) {
			migrationCanvasRegistry[key].api.redraw();
		});
	}
	function headTypeLabels() {
		var de = DE();
		return {
			induction: de ? "Induction" : "Induction",
			previous: de ? "Vorheriges Token" : "Previous token",
			self: de ? "Selbst" : "Self",
			first: de ? "Erstes Token / Sink" : "First token / sink",
			local: de ? "Lokaler Kontext" : "Local context",
			duplicate: de ? "Duplicate-Token" : "Duplicate token",
			positional: de ? "Positions-Offset" : "Positional offset",
			rare: de ? "Seltene Tokens" : "Rare tokens",
			broad: de ? "Breite Mischung" : "Broad mixing",
			content: de ? "Kontext-Mischung" : "Context mixing"
		};
	}

	function analyzeHead(head, tokens) {
		var W = head && head.weights;
		if (!W || !W.length || !tokens || !tokens.length) return null;
		var n = W.length;
		var self = 0, prev = 0, first = 0, local = 0, ind = 0, indRows = 0;
		var dup = 0, dupRows = 0, rare = 0, entropy = 0, maxMean = 0;
		var offSum = [], offRows = [];
		var freq = {};
		tokens.forEach(function (t) { freq[t] = (freq[t] || 0) + 1; });
		for (var i = 0; i < n; i++) {
			var row = W[i] || [];
			self += row[i] || 0;
			maxMean += Math.max.apply(null, row.map(function (v) { return v || 0; }));
			if (i > 0) {
				prev += row[i - 1] || 0;
				first += row[0] || 0;
				var bestLocal = 0;
				for (var k = 1; k <= 3; k++) if (i - k >= 0) bestLocal = Math.max(bestLocal, row[i - k] || 0);
				local += bestLocal;
				var prevTok = tokens[i - 1];
				for (var p = 0; p < i - 1; p++) {
					if (tokens[p] === prevTok) { ind += row[p + 1] || 0; indRows++; break; }
				}
			}
			for (var d = 1; d < n; d++) {
				offSum[d] = offSum[d] || 0; offRows[d] = offRows[d] || 0;
				if (i - d >= 0) { offSum[d] += row[i - d] || 0; offRows[d]++; }
			}
			for (var p2 = i - 1; p2 >= 0; p2--) {
				if (tokens[p2] === tokens[i]) { dup += row[p2] || 0; dupRows++; break; }
			}
			var rareMass = 0;
			for (var j = 0; j <= i; j++) if ((freq[tokens[j]] || 0) <= 2) rareMass += row[j] || 0;
			rare += rareMass;
			var e = 0;
			row.forEach(function (p3) { if (p3 > 1e-12) e -= p3 * Math.log(p3); });
			entropy += e / Math.log(Math.max(2, n));
		}
		var rows = Math.max(1, n - 1);
		var bestOffset = 0, bestOffsetK = 0;
		for (var d2 = 1; d2 < n; d2++) {
			var avg = offRows[d2] ? offSum[d2] / offRows[d2] : 0;
			if (avg > bestOffset) { bestOffset = avg; bestOffsetK = d2; }
		}
		return {
			self: self / n,
			prev: prev / rows,
			first: first / rows,
			local: local / rows,
			induction: indRows ? ind / indRows : 0,
			duplicate: dupRows ? dup / dupRows : 0,
			rare: rare / n,
			bestOffset: bestOffset,
			bestOffsetK: bestOffsetK,
			entropy: entropy / n,
			max: maxMean / n
		};
	}

	function classifyHead(f, de) {
		var type = "content", score = f.max, threshold = 0.35, reason = "";
		if (f.induction >= 0.25 && f.induction >= f.prev * 0.8) {
			type = "induction"; score = f.induction; threshold = 0.25;
			reason = de ? "Ein früheres Vorkommen des vorherigen Tokens wird kopiert (Schwelle 25 %)."
				: "It copies the token after an earlier occurrence of the previous token (threshold 25%).";
		} else if (f.duplicate >= 0.30 && f.duplicate >= f.prev * 0.9) {
			type = "duplicate"; score = f.duplicate; threshold = 0.30;
			reason = de ? "Aufmerksamkeit liegt auf einem früheren Vorkommen desselben Tokens (Schwelle 30 %)."
				: "Attention sits on an earlier occurrence of the same token (threshold 30%).";
		} else if (f.prev >= 0.45) {
			type = "previous"; score = f.prev; threshold = 0.45;
			reason = de ? "Aufmerksamkeit liegt auf dem unmittelbar vorherigen Token (Schwelle 45 %)."
				: "Attention sits on the immediately previous token (threshold 45%).";
		} else if (f.self >= 0.5) {
			type = "self"; score = f.self; threshold = 0.5;
			reason = de ? "Aufmerksamkeit liegt auf dem Query-Token selbst (Schwelle 50 %)."
				: "Attention sits on the query token itself (threshold 50%).";
		} else if (f.first >= 0.4) {
			type = "first"; score = f.first; threshold = 0.4;
			reason = de ? "Aufmerksamkeit sammelt sich auf Position 0 (Schwelle 40 %)."
				: "Attention collects on position 0 (threshold 40%).";
		} else if (f.bestOffset >= 0.35 && f.bestOffsetK > 3) {
			type = "positional"; score = f.bestOffset; threshold = 0.35;
			reason = de ? "Ein fester Positions-Offset von " + f.bestOffsetK + " dominiert (Schwelle 35 %)."
				: "A fixed positional offset of " + f.bestOffsetK + " dominates (threshold 35%).";
		} else if (f.local >= 0.45) {
			type = "local"; score = f.local; threshold = 0.45;
			reason = de ? "Aufmerksamkeit bleibt in den letzten drei Positionen (Schwelle 45 %)."
				: "Attention stays within the previous three positions (threshold 45%).";
		} else if (f.rare >= 0.50) {
			type = "rare"; score = f.rare; threshold = 0.50;
			reason = de ? "Aufmerksamkeit sammelt sich auf seltene Tokens (Schwelle 50 %)."
				: "Attention collects on rare tokens (threshold 50%).";
		} else if (f.entropy >= 0.72) {
			type = "broad"; score = f.entropy; threshold = 0.72;
			reason = de ? "Die normalisierte Attention-Entropie ist hoch (Schwelle 0,72)."
				: "Normalized attention entropy is high (threshold 0.72).";
		} else {
			reason = de ? "Kein einzelnes Token dominiert (stärkstes mittleres Zeilengewicht unter 35 %); die Attention verteilt sich auf mehrere Tokens und mischt so den Kontext."
				: "No single token dominates (the strongest mean row weight is below 35%); attention is spread across several tokens, so the head mixes context.";
		}
		var confidence = Math.max(0.5, Math.min(0.95, 0.5 + 0.45 * Math.min(1, score / Math.max(0.001, threshold * 2))));
		return { type: type, score: score, threshold: threshold, confidence: confidence, reason: reason };
	}

	function headTypeMechanism(type, de) {
		var mechanisms = {
			induction: de
				? "Ein Vorheriges-Token-Head merkt sich, was zuletzt kam. Ein Induction-Head sucht eine frühere Stelle, an der dasselbe vorherige Token stand, und kopiert, was danach folgte. Erkannt wird das über Zeilen, deren stärkstes Gewicht auf dem Token nach einem früheren Vorkommen des vorherigen Tokens liegt (mindestens 25 %)."
				: "A previous-token head tracks what just came before. An induction head then finds an earlier place where that same previous token appeared and copies what followed it. Detection: rows whose strongest weight lands on the token after an earlier occurrence of the previous token (at least 25%).",
			duplicate: de
				? "Die Attention liegt auf einem früheren Vorkommen desselben Tokens, sodass die Position liest, was beim letzten Mal mit diesem Token geschah. Schwelle: mindestens 30 % der Zeilenmasse."
				: "Attention sits on an earlier occurrence of the same token, so the position can read what happened last time this token appeared. Threshold: at least 30% of the row mass.",
			previous: de
				? "Die Attention liegt fast ganz auf dem unmittelbar vorherigen Token. Schwelle: mindestens 45 % der Zeilenmasse."
				: "Attention sits almost entirely on the immediately preceding token. Threshold: at least 45% of the row mass.",
			self: de
				? "Die Attention bleibt auf dem Query-Token selbst. Schwelle: mindestens 50 % auf der Diagonalen."
				: "Attention stays on the query token itself. Threshold: at least 50% on the diagonal.",
			first: de
				? "Die Attention sammelt sich auf Position 0, einem häufigen Attention-Sink. Schwelle: mindestens 40 % auf dem ersten Token."
				: "Attention collects on position 0, a common attention sink. Threshold: at least 40% on the first token.",
			positional: de
				? "Ein fester Abstand dominiert, unabhängig vom Inhalt. Erkannt wird das über einen mittleren Positions-Offset k > 3 mit mindestens 35 % Gewicht."
				: "A fixed distance dominates, independent of content. Detection: an average positional offset k > 3 carries at least 35% of the weight.",
			local: de
				? "Die Attention bleibt in den letzten drei Positionen. Schwelle: mindestens 45 % der Zeilenmasse."
				: "Attention stays within the previous three positions. Threshold: at least 45% of the row mass.",
			rare: de
				? "Die Attention bevorzugt seltene Tokens, die im Satz höchstens zweimal vorkommen. Schwelle: mindestens 50 % auf seltenen Tokens."
				: "Attention prefers rare tokens that occur at most twice in the sentence. Threshold: at least 50% on rare tokens.",
			broad: de
				? "Die Attention ist fast gleichmäßig über die Zeile verteilt. Schwelle: normalisierte Entropie mindestens 0,72."
				: "Attention is spread almost uniformly across the row. Threshold: normalized entropy at least 0.72.",
			content: de
				? "Kein einzelnes Muster dominiert; der Head verteilt die Attention über mehrere Tokens und mischt so den Kontext."
				: "No single pattern dominates; the head spreads attention across several tokens and mixes context."
		};
		return mechanisms[type] || mechanisms.content;
	}

	function classifyAttentionHeads() {
		var traces = window.__tmLayerTrace || [];
		Array.prototype.slice.call(document.querySelectorAll(".tm-layer-card")).forEach(function (card) {
			var idx = parseInt(card.getAttribute("data-layer-idx"), 10);
			var trace = traces[idx];
			if (isNaN(idx) || !trace || !trace.headData) return;
			var buttons = card.querySelectorAll(".head-tab-list .mha-head-tab-btn");
			var contents = card.querySelectorAll(".head-tab-in-layer");
			var labels = headTypeLabels();
			var de = DE();
			var links = {
				voita: '<a href="https://arxiv.org/abs/1905.09418" target="_blank" rel="noopener">Voita et al. (2019)</a>',
				clark: '<a href="https://arxiv.org/abs/1906.04341" target="_blank" rel="noopener">Clark et al. (2019)</a>',
				olsson: '<a href="https://arxiv.org/abs/2209.11895" target="_blank" rel="noopener">Olsson et al. (2022)</a>',
				wang: '<a href="https://arxiv.org/abs/2211.00593" target="_blank" rel="noopener">Wang et al. (2022)</a>',
				zheng: '<a href="https://arxiv.org/abs/2409.03752" target="_blank" rel="noopener">Zheng et al. (2024)</a>',
				jain: '<a href="https://arxiv.org/abs/1902.10186" target="_blank" rel="noopener">Jain &amp; Wallace (2019)</a>',
				wiegreffe: '<a href="https://arxiv.org/abs/1908.04626" target="_blank" rel="noopener">Wiegreffe &amp; Pinter (2019)</a>'
			};
			var methodHtml = de
				? "Head-Typen sind heuristische <b>Schätzungen</b> aus dem Attention-Muster; die Schwelle steht jeweils dabei. Grundlage: " + links.voita + ", " + links.clark + ", " + links.olsson + ", " + links.wang + ", " + links.zheng + ". Attention-Gewichte sind keine vollständige Erklärung (" + links.jain + "; " + links.wiegreffe + ")."
				: "Head types are heuristic <b>estimates</b> from the attention pattern; the threshold is stated in each label. Basis: " + links.voita + ", " + links.clark + ", " + links.olsson + ", " + links.wang + ", " + links.zheng + ". Attention weights are not a complete explanation (" + links.jain + "; " + links.wiegreffe + ").";
			var detections = [];
			Array.prototype.slice.call(buttons).forEach(function (btn, h) {
				var result = analyzeHead(trace.headData[h], trace.tokenStrings || []);
				if (!result) return;
				var c = classifyHead(result, de);
				btn.dataset.headType = c.type;
				btn.title = (de ? "Geschätzt: " : "Estimated: ") + labels[c.type] + " · ~" + Math.round(c.confidence * 100) + "%\n" + c.reason;
				btn.textContent = "Head " + (h + 1);
				var confidence = Math.round(c.confidence * 100);
				var content = contents[h];
				if (content) {
					var note = content.querySelector(".tm-head-estimate");
					if (!note) {
						note = document.createElement("p");
						note.className = "tm-head-estimate";
						content.appendChild(note);
					}
					note.textContent = (de ? "Schätzung: " : "Estimate: ") + labels[c.type] + " · ~" + confidence + "%. " + c.reason;
					var method = content.querySelector(".tm-head-method-details");
					if (!method) {
						method = document.createElement("details");
						method.className = "tm-head-method-details";
						method.innerHTML = "<summary>" + (de ? "Wie werden die Head-Typen geschätzt? · Quellen" : "How are head types estimated? · sources") + "</summary><div class='tm-head-method'></div>";
					}
					content.appendChild(method);
					method.querySelector(".tm-head-method").innerHTML = methodHtml;
				}
				if (c.type !== "content") {
					detections.push({ head: h + 1, type: c.type, confidence: confidence, reason: c.reason });
				}
			});
			var attnSub = card.querySelector('.tm-layer-subbox[data-sub="attention"]');
			var existingSummary = card.querySelector(".tm-layer-head-summary");
			if (!detections.length) {
				if (existingSummary) existingSummary.remove();
				return;
			}
			var counts = {};
			detections.forEach(function (d) { counts[d.type] = (counts[d.type] || 0) + 1; });
			var parts = Object.keys(counts).map(function (type) {
				var n = counts[type];
				return de
					? n + " Head" + (n === 1 ? "" : "s") + " vom Typ " + labels[type]
					: n + " " + labels[type].toLowerCase() + " head" + (n === 1 ? "" : "s");
			});
			var summaryText = de
				? "Diese Schicht könnte " + parts.join(" und ") + " enthalten. Öffne für die Evidenz."
				: "This layer could have " + parts.join(" and ") + " based on the attention pattern. Open for the evidence.";
			var items = detections.map(function (d) {
				return "<li><b>Head " + d.head + "</b> · " + labels[d.type] + " · ~" + d.confidence + "%: " + d.reason + "</li>";
			}).join("");
			var mechanisms = Object.keys(counts).map(function (type) {
				return "<p><b>" + labels[type] + ":</b> " + headTypeMechanism(type, de) + "</p>";
			}).join("");
			if (!existingSummary) {
				existingSummary = document.createElement("details");
				existingSummary.className = "tm-layer-head-summary";
			}
			existingSummary.innerHTML = "<summary>" + summaryText + "</summary><div class='tm-layer-head-summary-body'><ul>" + items + "</ul>" + mechanisms + "</div>";
			if (attnSub && existingSummary.parentNode !== attnSub.parentNode) {
				attnSub.parentNode.insertBefore(existingSummary, attnSub);
			}
		});
	}
	window.tmClassifyAttentionHeads = classifyAttentionHeads;

	function updateSignalRailLabels() {
		var traces = window.__tmLayerTrace || [];
		document.querySelectorAll(".tm-layer-signal-between").forEach(function (wrap) {
			var canvas = wrap.querySelector(".layer-signal-canvas");
			if (!canvas) return;
			var idx = parseInt(canvas.getAttribute("data-layer-idx"), 10);
			var trace = traces[idx];
			var n = trace && trace.tokenStrings ? trace.tokenStrings.length : 0;
			var label = wrap.querySelector(".tm-signal-between-label");
			if (!label) return;
			if (wrap.classList.contains("tm-layer-signal-before")) {
				label.textContent = (DE() ? "Residual-Stream vor/nach Schicht 1" : "Residual stream before/after layer 1") + " · " + n + (DE() ? " Tokens" : " tokens");
			} else {
				label.textContent = (DE() ? "Residual-Stream nach Schicht " : "Residual stream after layer ") + (idx + 1) + " · " + n + (DE() ? " Tokens" : " tokens");
			}
		});
	}

	function renderLayerPreviews() {
		document.querySelectorAll('.layer-residual-canvas[data-layer-idx]').forEach(function (canvas) {
			var idx = parseInt(canvas.getAttribute('data-layer-idx'), 10);
			if (isNaN(idx)) return;
			if (window.TransformerSteps && window.TransformerSteps.renderLayerResidual) {
				window.TransformerSteps.renderLayerResidual(canvas.id, idx);
			}
		});
		document.querySelectorAll('.layer-signal-canvas[data-layer-idx]').forEach(function (canvas) {
			var idx = parseInt(canvas.getAttribute('data-layer-idx'), 10);
			if (isNaN(idx)) return;
			if (window.TransformerSteps && window.TransformerSteps.renderLayerSignal) {
				window.TransformerSteps.renderLayerSignal(canvas.id, idx);
			}
		});
		document.querySelectorAll('.tm-residual-heatmap-canvas[data-layer-idx]').forEach(function (canvas) {
			var idx = parseInt(canvas.getAttribute('data-layer-idx'), 10);
			if (isNaN(idx)) return;
			if (window.TransformerSteps && window.TransformerSteps.renderLayerResidualHeatmap) {
				window.TransformerSteps.renderLayerResidualHeatmap(canvas.id, idx, canvas.getAttribute('data-which') || 'in');
			}
		});
	}
	window.addEventListener('tm:theme', redrawLayerCanvases);
	window.addEventListener('tm:transformer-data', function () {
		redrawLayerCanvases();
		renderLayerPreviews();
		updateSignalRailLabels();
	});

	var featureState = {};
	var featureProjectionCache = {};
	var featureAxisRange3D = {};
	var featureAxisRange2D = {};
	var featureLastTraceVersion = -1;

	function featureCacheKey(layerIdx, d, metric) { return layerIdx + "|" + d + "|" + metric; }
	function resetFeatureProjectionCache() {
		featureProjectionCache = {};
		featureAxisRange3D = {};
		featureAxisRange2D = {};
	}
	window.tmResetFeatureProjection = resetFeatureProjectionCache;

	var FEATURE_METRICS = {
		euclidean: { de: "Euklidisch (L2)", en: "Euclidean (L2)", short: "L2" },
		angular: { de: "Großkreis / angular (Cosinus, 0–1)", en: "Great-circle / angular (cosine, 0–1)", short: "angle" }
	};
	if (!window.tmFeatureMetric || !FEATURE_METRICS[window.tmFeatureMetric]) window.tmFeatureMetric = "euclidean";
	function featureMetric() { return window.tmFeatureMetric || "euclidean"; }
	function featureMetricLabel() { return FEATURE_METRICS[featureMetric()][DE() ? "de" : "en"]; }
	function vectorNorm(v) { return Math.sqrt((v || []).reduce(function (s, x) { return s + x * x; }, 0)); }
	function normalizeVector(v) { var n = vectorNorm(v) || 1; return (v || []).map(function (x) { return x / n; }); }
	function metricDistance(a, b, metric) {
		metric = metric || featureMetric();
		if (metric === "angular") {
			var u = normalizeVector(a), w = normalizeVector(b);
			var dot = 0;
			for (var i = 0; i < Math.min(u.length, w.length); i++) dot += u[i] * w[i];
			return Math.acos(Math.max(-1, Math.min(1, dot))) / Math.PI;
		}
		var sum = 0;
		for (var j = 0; j < Math.min(a.length, b.length); j++) {
			var d = (a[j] || 0) - (b[j] || 0);
			sum += d * d;
		}
		return Math.sqrt(sum);
	}
	function metricDistanceLabel(a, b, metric) {
		var d = metricDistance(a, b, metric);
		if (metric === "angular") return (DE() ? "Winkel " : "angle ") + d.toFixed(3) + " (" + (d * 180).toFixed(1) + "°)";
		return "L2 " + d.toFixed(3);
	}
	function slerpPoints(a, b, steps) {
		var u = normalizeVector(a), w = normalizeVector(b);
		var dot = 0;
		for (var i = 0; i < Math.min(u.length, w.length); i++) dot += u[i] * w[i];
		var theta = Math.acos(Math.max(-1, Math.min(1, dot)));
		var out = [];
		if (theta < 1e-5) return [a, b];
		for (var k = 0; k <= steps; k++) {
			var t = k / steps;
			var s1 = Math.sin((1 - t) * theta) / Math.sin(theta);
			var s2 = Math.sin(t * theta) / Math.sin(theta);
			out.push(u.map(function (_, j) { return s1 * u[j] + s2 * w[j]; }));
		}
		return out;
	}

	window.tmMetric = {
		get: featureMetric,
		set: function (metric) { if (FEATURE_METRICS[metric]) window.tmFeatureMetric = metric; },
		options: FEATURE_METRICS,
		label: featureMetricLabel,
		explainHtml: function () {
			var de = DE();
			if (featureMetric() === "angular") {
				var formula = '<div class="tm-metric-formula" data-tex="\\theta=\\arccos\\!\\left(\\frac{u\\cdot v}{\\lVert u\\rVert\\,\\lVert v\\rVert}\\right),\\quad d=\\frac{\\theta}{\\pi}"></div>';
				if (de) {
					return '<details class="tm-metric-detail"><summary><b>Großkreis / angular (Cosinus, 0–1)</b></summary><p>Der geometrische Name ist <i>Großkreis-Distanz</i> (Bogen auf der Einheitskugel). In ML heißt dieselbe Größe meist <i>Cosinus-Distanz</i> <code>1−cosθ</code> oder <i>Winkel-Distanz</i> <code>θ</code>. Wir zeigen <code>θ/π</code>: 0 = gleiche Richtung, 1 = Gegenrichtung; kleiner Winkel = kleiner Abstand, großer Winkel = großer Abstand.</p></details>'
						+ '<details class="tm-metric-detail"><summary><b>Kugel</b></summary><p>Nach L2-Normalisierung liegen Vektoren per Definition auf der Einheitskugel; die Normalisierung (hier LayerNorm, in vielen modernen Modellen RMSNorm) normiert die Features jedes Tokens vor den Subschichten (<a href="https://arxiv.org/abs/1607.06450" target="_blank" rel="noopener">Ba et al., 2016</a>), und GPT-artige Modelle setzen vor dem Unembedding oft eine finale Normalisierung (LayerNorm oder RMSNorm). Roh sind Embeddings aber nicht gleichmäßig auf der Kugel verteilt: kontextuelle Repräsentationen sind anisotrop und liegen in einem engen Kegel (<a href="https://aclanthology.org/D19-1006/" target="_blank" rel="noopener">Ethayarajh, 2019</a>). Satz-Embeddings werden üblicherweise per Cosinus verglichen (<a href="https://arxiv.org/abs/1908.10084" target="_blank" rel="noopener">Reimers &amp; Gurevych, 2019</a>). Die Winkelansicht ist also eine nützliche Projektion, keine Behauptung, das Modell speichere eine perfekte Kugel.</p></details>'
						+ formula;
				}
				return '<details class="tm-metric-detail"><summary><b>Great-circle / angular (cosine, 0–1)</b></summary><p>The geometric name is <i>great-circle distance</i> (the arc on the unit sphere). In ML the same quantity is usually called <i>cosine distance</i> <code>1−cosθ</code> or <i>angular distance</i> <code>θ</code>. We show <code>θ/π</code>: 0 = same direction, 1 = opposite; small angle = small distance, large angle = large distance.</p></details>'
					+ '<details class="tm-metric-detail"><summary><b>Sphere</b></summary><p>After L2 normalization vectors lie on the unit sphere by construction; the normalization layer (LayerNorm here, RMSNorm in many modern models) normalizes each token\'s features before the sublayers (<a href="https://arxiv.org/abs/1607.06450" target="_blank" rel="noopener">Ba et al., 2016</a>), and GPT-style models often apply a final normalization (LayerNorm or RMSNorm) before the unembedding. Raw embeddings are not spread uniformly on that sphere, however: contextual representations are anisotropic and sit in a narrow cone (<a href="https://aclanthology.org/D19-1006/" target="_blank" rel="noopener">Ethayarajh, 2019</a>). Sentence embeddings are commonly compared by cosine similarity (<a href="https://arxiv.org/abs/1908.10084" target="_blank" rel="noopener">Reimers &amp; Gurevych, 2019</a>). The angular view is therefore a useful projection, not a claim that the model stores a perfect sphere.</p></details>'
					+ formula;
			}
			if (de) {
				return '<p><b>Euklidisch (L2) · Standard.</b> Gerade Linie im Raum. Für das nächste Token zählen oft die Winkel: Die Logits sind Skalarprodukte <code>h·w</code>; nach Normierung entscheidet der Cosinus, also der Winkel. Schalte im Metrik-Schalter auf <b>Großkreis / angular</b>, um diese Sicht zu sehen; wir suchen die Darstellung, in der die Daten am einfachsten aussehen.</p>'
					+ '<div class="tm-metric-formula" data-tex="d_{\\text{L2}}=\\lVert u-v\\rVert_2"></div>';
			}
			return '<p><b>Euclidean (L2) · default.</b> Straight-line distance in the space. For the next token, angles often matter more: the logits are dot products <code>h·w</code>; after normalization the cosine, i.e. the angle, decides. Switch to <b>Great-circle / angular</b> in the metric switch to see that view; we look for the representation that makes the data simplest.</p>'
				+ '<div class="tm-metric-formula" data-tex="d_{\\text{L2}}=\\lVert u-v\\rVert_2"></div>';
		},
		transform: function (v, metric) {
			metric = metric || featureMetric();
				if (metric === "angular") return normalizeVector(v);
			return v;
		},
		distance: metricDistance,
		distanceLabel: metricDistanceLabel,
		slerpPoints: slerpPoints,
		normalize: normalizeVector,
		rerenderWithOverlay: rerenderWithOverlay,
		sphereEnabled: function () { return window.tmMetricSphere !== false; },
		setSphere: function (v) { window.tmMetricSphere = !!v; },
		showSphere: function () { return featureMetric() === "angular" && window.tmMetricSphere !== false; },
		sphereHint: function (is2d) {
			var de = DE();
			if (is2d) {
				return de
					? "Einheitskreis:<br>Jeder Vektor wird auf Länge 1 skaliert,<br>jeder Punkt ist also eine Richtung, keine Länge.<br>Die Winkelmetrik misst hier den Winkel θ<br>zwischen zwei Richtungen;<br>θ/π ist die normierte Distanz<br>(0 = gleiche Richtung, 1 = Gegenrichtung).<br>Die echten Token-Vektoren werden auf diesen Kreis projiziert."
					: "Unit circle:<br>every vector is scaled to length 1,<br>so each point is a direction, not a length.<br>The angular metric measures the angle θ<br>between two directions here;<br>θ/π is the normalized distance<br>(0 = same direction, 1 = opposite).<br>The real token vectors are projected onto this circle.";
			}
			return de
				? "Einheitskugel:<br>Jeder Vektor wird auf Länge 1 skaliert,<br>jeder Punkt ist also eine Richtung, keine Länge.<br>Die Winkelmetrik misst hier den Großkreiswinkel θ<br>zwischen zwei Richtungen;<br>θ/π ist die normierte Distanz<br>(0 = gleiche Richtung, 1 = Gegenrichtung).<br>Die echten Token-Vektoren werden auf diese Oberfläche projiziert."
				: "Unit sphere:<br>every vector is scaled to length 1,<br>so each point is a direction, not a length.<br>The angular metric measures the great-circle angle θ<br>between two directions here;<br>θ/π is the normalized distance<br>(0 = same direction, 1 = opposite).<br>The real token vectors are projected onto this surface.";
		}
	};
	if (window.tmMetricSphere === undefined) window.tmMetricSphere = true;
	window.addEventListener("tm:unembedview", function () {
		document.querySelectorAll(".tm-logit-lens-host").forEach(function (host) {
			var match = /^unified-layer-(\d+)-logit-lens$/.exec(host.id);
			if (!match) return;
			var idx = parseInt(match[1], 10);
			rerenderWithOverlay(host, function () { renderLayerLogitLens(idx); });
		});
	});
	window.addEventListener("tm:metricchange", function () {
		Object.keys(featureState).forEach(function (key) {
			var idx = parseInt(key, 10);
			var target = document.getElementById("unified-layer-" + idx + "-feature-arrows");
			rerenderWithOverlay(target, function () { renderLayerFeaturePlots(idx); });
		});
		document.querySelectorAll(".tm-feature-metric-explain").forEach(function (el) {
			el.innerHTML = (window.tmMetric && window.tmMetric.explainHtml) ? window.tmMetric.explainHtml() : "";
			typesetMathIn(el);
		});
	});

	function metricIsVisible(el) {
		if (!el) return false;
		var r = el.getBoundingClientRect();
		var vh = window.innerHeight || document.documentElement.clientHeight;
		var vw = window.innerWidth || document.documentElement.clientWidth;
		return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
	}
	function showMetricOverlay(el) {
		if (!el) return null;
		var parent = el.parentElement || el;
		if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
		var ov = document.createElement("div");
		ov.className = "tm-metric-loading";
		ov.innerHTML = "<span class='tm-metric-spinner' aria-hidden='true'></span><span>" + (DE() ? "Metrik wird angewendet…" : "Updating metric…") + "</span>";
		parent.appendChild(ov);
		return ov;
	}
	function hideMetricOverlay(ov) {
		if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
	}
	function rerenderWithOverlay(el, fn) {
		if (!el) { fn(); return; }
		var render = function () {
			var ov = showMetricOverlay(el);
			requestAnimationFrame(function () {
				setTimeout(function () {
					try { fn(); } finally { hideMetricOverlay(ov); }
				}, 30);
			});
		};
		if (metricIsVisible(el)) { render(); return; }
		el.setAttribute("data-tm-metric-dirty", "1");
		if (!el._tmMetricObserver) {
			el._tmMetricObserver = new IntersectionObserver(function (entries) {
				if (entries.some(function (e) { return e.isIntersecting; }) && el.getAttribute("data-tm-metric-dirty") === "1") {
					el.removeAttribute("data-tm-metric-dirty");
					render();
				}
			}, { rootMargin: "120px" });
			el._tmMetricObserver.observe(el);
		}
	}
	function ensureGlobalMetricControl() {
		if (window.__tmMetricInStickyBar) return;
		var cfg = document.getElementById("transformer_config");
		if (!cfg || document.getElementById("tm-global-metric")) return;
		var de = DE();
		var options = Object.keys(FEATURE_METRICS).map(function (k) {
			return "<option value='" + k + "'>" + FEATURE_METRICS[k][de ? "de" : "en"] + "</option>";
		}).join("");
		var wrap = document.createElement("div");
		wrap.id = "tm-global-metric";
		wrap.className = "tm-global-metric";
		wrap.innerHTML = "<label>" + (de ? "Distanzmetrik (alle Plots)" : "Distance metric (all plots)") + " <select>" + options + "</select></label><label class='tm-global-sphere'><input type='checkbox' " + (window.tmMetricSphere !== false ? "checked" : "") + "> " + (de ? "Kugel / Kreis zeigen" : "Show sphere / circle") + "</label><label class='tm-global-highdim' style='display:none; margin-left:10px;'>" + (de ? "Hochdim" : "High-dim") + " <select><option value='pca'>PCA</option><option value='parallel'>Parallel</option></select></label><span class='tm-global-metric-note'>" + (de ? "Euklidisch ist der Standard. Probiere Großkreis/angular: Die scheinbar wirren Bewegungen ordnen sich auf einer Kugeloberfläche, und LLMs geht es oft mehr um Winkel als um exakte Distanzen." : "Euclidean is the default. Try great-circle/angular: the seemingly chaotic moves become ordered on a sphere, and LLMs often care more about angles than exact distances.") + "</span>";
		var select = wrap.querySelector("select");
		var sphere = wrap.querySelector("input[type=checkbox]");
		var highdimLabel = wrap.querySelector(".tm-global-highdim");
		var highdimSelect = highdimLabel ? highdimLabel.querySelector("select") : null;
		var syncSphere = function () {
			var angular = select.value === "angular";
			sphere.parentElement.style.display = angular ? "inline-flex" : "none";
			sphere.checked = window.tmMetricSphere !== false;
			if (highdimLabel && highdimSelect) {
				var dimSlider = document.getElementById("transformer-dimension-model");
				var dim = dimSlider ? parseInt(dimSlider.value, 10) : 3;
				highdimLabel.style.display = dim > 3 ? "inline-flex" : "none";
				highdimSelect.value = window.tmHighDimMode || "pca";
			}
		};
		select.value = featureMetric();
		syncSphere();
		select.addEventListener("change", function () {
			window.tmFeatureMetric = select.value;
			syncSphere();
			window.dispatchEvent(new CustomEvent("tm:metricchange", { detail: { metric: select.value } }));
		});
		sphere.addEventListener("change", function () {
			window.tmMetricSphere = sphere.checked;
			window.dispatchEvent(new CustomEvent("tm:metricchange", { detail: { metric: select.value } }));
		});
		if (highdimSelect) {
			highdimSelect.addEventListener("change", function () {
				window.tmHighDimMode = highdimSelect.value;
				window.dispatchEvent(new CustomEvent("tm:highdimmode", { detail: { mode: highdimSelect.value } }));
			});
		}
		var dimSlider = document.getElementById("transformer-dimension-model");
		if (dimSlider) dimSlider.addEventListener("input", syncSphere);
		cfg.insertBefore(wrap, cfg.firstChild);
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensureGlobalMetricControl);
	else ensureGlobalMetricControl();

	function _plotlyColors() {
		var c = palette();
		return { paper: "rgba(0,0,0,0)", plot: "rgba(0,0,0,0)", ink: c.ink, muted: c.muted, line: c.line, blue: "#3b82f6", green: c.green, gold: c.gold };
	}
	function plotlySphereTraces() {
		var n = 14, m = 28;
		var xs = [], ys = [], zs = [];
		for (var i = 0; i <= n; i++) {
			var xr = [], yr = [], zr = [];
			var theta = Math.PI * i / n;
			for (var j = 0; j <= m; j++) {
				var phi = 2 * Math.PI * j / m;
				xr.push(Math.sin(theta) * Math.cos(phi));
				yr.push(Math.sin(theta) * Math.sin(phi));
				zr.push(Math.cos(theta));
			}
			xs.push(xr); ys.push(yr); zs.push(zr);
		}
		var hint = (window.tmMetric && window.tmMetric.sphereHint) ? window.tmMetric.sphereHint(false) : "";
		var textGrid = zs.map(function (row) { return row.map(function () { return hint; }); });
		return [
			{ type: "surface", x: xs, y: ys, z: zs, surfacecolor: zs.map(function (r) { return r.map(function () { return 0; }); }), colorscale: [[0, "#3b82f6"], [1, "#3b82f6"]], showscale: false, opacity: 0.18, hoverinfo: "text", text: textGrid, name: "unit sphere" }
		];
	}
	function plotlyCircleTraces() {
		var cx = [], cy = [];
		for (var a = 0; a <= 96; a++) {
			var t = 2 * Math.PI * a / 96;
			cx.push(Math.cos(t)); cy.push(Math.sin(t));
		}
		var hint = (window.tmMetric && window.tmMetric.sphereHint) ? window.tmMetric.sphereHint(true) : "";
		return [
			{ type: "scatter", mode: "lines", x: cx, y: cy, fill: "toself", fillcolor: "rgba(59,130,246,0.12)", line: { color: "#3b82f6", width: 1 }, hoverinfo: "text", text: cx.map(function () { return hint; }), name: "unit circle" }
		];
	}
	function plotlyConeTrace(items, color, name, sizeref) {
		if (!items || !items.length) return null;
		return {
			type: "cone",
			x: items.map(function (p) { return p.x; }),
			y: items.map(function (p) { return p.y; }),
			z: items.map(function (p) { return p.z; }),
			u: items.map(function (p) { return p.u; }),
			v: items.map(function (p) { return p.v; }),
			w: items.map(function (p) { return p.w; }),
			colorscale: [[0, color], [1, color]],
			showscale: false,
			sizemode: "absolute",
			sizeref: (typeof sizeref === "number" && sizeref > 0) ? sizeref : 0.32,
			anchor: "tip",
			hoverinfo: "text",
			text: items.map(function (p) { return p.tip || ""; }),
			name: name || "direction",
			showlegend: false
		};
	}
	function _flattenNumbers(value, out) {
		if (typeof value === "number") {
			if (isFinite(value)) out.push(value);
			return;
		}
		if (Array.isArray(value)) {
			value.forEach(function (v) { _flattenNumbers(v, out); });
		}
	}

	/* Equal x/y/z spans keep the unit sphere round. Without this, Plotly's
	   auto ranges can give the axes different spans and the sphere renders
	   as an ellipsoid. */
	function equalize3D(layout, traces, minR) {
		if (!layout || !layout.scene) return layout;
		var R = Math.max(1, Number(minR) || 0);
		(traces || []).forEach(function (trace) {
			["x", "y", "z"].forEach(function (axis) {
				if (!trace || trace[axis] == null) return;
				var nums = [];
				_flattenNumbers(trace[axis], nums);
				nums.forEach(function (v) { R = Math.max(R, Math.abs(v)); });
			});
		});
		if (!isFinite(R) || R <= 0) R = 1;
		layout.scene.aspectmode = "cube";
		["xaxis", "yaxis", "zaxis"].forEach(function (axis) {
			layout.scene[axis] = layout.scene[axis] || {};
			layout.scene[axis].range = [-R, R];
		});
		return layout;
	}

	function plotlyLayout3D(title, axes) {
		var c = _plotlyColors();
		var p = palette();
		var axis = function (name) { return { title: { text: name }, color: c.muted, gridcolor: c.line, zerolinecolor: c.line, showbackground: false }; };
		return {
			uirevision: "tm-3d",
			paper_bgcolor: c.paper, plot_bgcolor: c.plot,
			hoverlabel: { bgcolor: p.paper, bordercolor: p.line, font: { color: p.ink, size: 12 } },
			title: { text: title, font: { size: 13, color: c.ink } },
			showlegend: false,
			margin: { l: 0, r: 0, t: title ? 38 : 8, b: 0 },
			scene: {
				aspectmode: "cube",
				dragmode: "turntable",
				xaxis: axis(axes[0]), yaxis: axis(axes[1]), zaxis: axis(axes[2]),
				camera: { eye: { x: 1.6, y: 1.6, z: 1.15 } }
			}
		};
	}
	function plotlyLayout2D(title, axes) {
		var c = _plotlyColors();
		var p = palette();
		var axis = function (name) { return { title: { text: name }, color: c.muted, gridcolor: c.line, zeroline: false }; };
		return {
			paper_bgcolor: c.paper, plot_bgcolor: c.plot,
			hoverlabel: { bgcolor: p.paper, bordercolor: p.line, font: { color: p.ink, size: 12 } },
			title: { text: title, font: { size: 13, color: c.ink } },
			showlegend: false,
			margin: { l: 46, r: 18, t: title ? 38 : 12, b: 42 },
			xaxis: axis(axes[0]), yaxis: axis(axes[1])
		};
	}
	window.tmPlotly = {
		colors: _plotlyColors,
		sphereTraces: plotlySphereTraces,
		circleTraces: plotlyCircleTraces,
		coneTrace: plotlyConeTrace,
		equalize3D: equalize3D,
		layout3D: plotlyLayout3D,
		layout2D: plotlyLayout2D
	};

	function featureTraceAt(layerIdx) {
		var live = (window.__tmFeatureTrace || [])[layerIdx];
		if (live && live.h_in && live.h_out) return live;
		return (window.__tmLayerTrace || [])[layerIdx];
	}

	function featureData(layerIdx) {
		var trace = featureTraceAt(layerIdx);
		if (!trace || !trace.h_in || !trace.h_out) return null;
		var tokens = trace.tokenStrings || tokenList();
		var n = Math.min(tokens.length, trace.h_in.length, trace.h_out.length);
		if (!n) return null;
		if (!featureState[layerIdx]) featureState[layerIdx] = { selected: n - 1, allDims: false };
		if (featureState[layerIdx].selected >= n) featureState[layerIdx].selected = n - 1;
		return { trace: trace, tokens: tokens.slice(0, n), n: n, selected: featureState[layerIdx].selected, allDims: !!featureState[layerIdx].allDims };
	}

	function featureProjection(data, layerIdx) {
		var metric = featureMetric();
		var d = data.trace.h_in[0].length;
		var rawIn = data.trace.h_in.slice(0, data.n);
		var rawOut = data.trace.h_out.slice(0, data.n);
		function transform(v) {
				if (metric === "angular") return normalizeVector(v);
			return v;
		}
		var all = rawIn.map(transform).concat(rawOut.map(transform));
		var coords;
		var normalizeProjected = function (p) {
			var n = Math.sqrt(p.reduce(function (s, x) { return s + x * x; }, 0)) || 1;
			return p.map(function (x) { return x / n; });
		};
		if (d > 3) {
			var key = featureCacheKey(layerIdx, d, metric);
			var basis = featureProjectionCache[key];
			var drift = basis ? pcaBasisDrift(all, basis) : 0;
			if (!basis || !window.isTraining || drift > 3.5) {
				var next = pcaBasis3(all);
				if (next) {
					next = alignPcaBasis3(next, basis);
					featureProjectionCache[key] = next;
					basis = next;
				}
			}
			coords = applyPcaBasis3(all, basis);
			if (metric === "angular") coords = coords.map(normalizeProjected);
			return {
				in: coords.slice(0, data.n),
				out: coords.slice(data.n),
				is3d: true,
				axes: metric === "angular" ? ["dir 1", "dir 2", "dir 3"] : ["PC 1 (PCA)", "PC 2 (PCA)", "PC 3 (PCA)"],
				label: (metric === "angular" ? "great-circle: unit sphere" : "PCA") + ": d=" + d + " → 3D",
				metric: metric,
				rawIn: rawIn,
				rawOut: rawOut
			};
		}
		if (d === 3) {
			coords = all.map(function (v) { return [v[0] || 0, v[1] || 0, v[2] || 0]; });
			if (metric === "angular") coords = coords.map(normalizeProjected);
			return {
				in: coords.slice(0, data.n),
				out: coords.slice(data.n),
				is3d: true,
				axes: metric === "angular" ? ["dir 0", "dir 1", "dir 2"] : ["Dim 0", "Dim 1", "Dim 2"],
				label: metric === "angular" ? "great-circle: unit sphere" : "",
				metric: metric,
				rawIn: rawIn,
				rawOut: rawOut
			};
		}
		if (d === 2) {
			coords = all.map(function (v) { return [v[0] || 0, v[1] || 0]; });
			if (metric === "angular") coords = coords.map(normalizeProjected);
			return {
				in: coords.slice(0, data.n),
				out: coords.slice(data.n),
				is3d: false,
				axes: metric === "angular" ? ["dir 0", "dir 1"] : ["Dim 0", "Dim 1"],
				label: metric === "angular" ? "great-circle: unit circle" : "",
				metric: metric,
				rawIn: rawIn,
				rawOut: rawOut
			};
		}
		coords = all.map(function (v) { return [v[0] || 0, 0]; });
		if (metric === "angular") coords = coords.map(normalizeProjected);
		return {
			in: coords.slice(0, data.n),
			out: coords.slice(data.n),
			is3d: false,
			axes: ["Dim 0", ""],
			label: metric === "angular" ? "great-circle: unit circle" : "",
			metric: metric,
			rawIn: rawIn,
			rawOut: rawOut
		};
	}

	function renderFeatureChart(el, coords, labels, selected, color, title, projection) {
		if (!el || !window.echarts || !coords.length) return;
		var c = palette();
		var chart = echarts.getInstanceByDom(el) || echarts.init(el);
		var data = coords.map(function (p, i) {
			var isSel = i === selected;
			return {
				name: labels[i],
				value: projection.is3d ? [p[0], p[1], p[2]] : [p[0], p[1]],
				symbolSize: isSel ? 15 : 7,
				itemStyle: {
					color: isSel ? c.gold : color,
					opacity: isSel ? 1 : 0.42,
					borderColor: isSel ? c.ink : "transparent",
					borderWidth: isSel ? 2 : 0
				},
				label: {
					show: isSel,
					position: "top",
					formatter: labels[i],
					color: c.ink,
					fontSize: 11,
					fontWeight: 700
				}
			};
		});
		var option;
		if (projection.is3d) {
			option = {
				backgroundColor: "transparent",
				title: {
					text: title,
					subtext: (projection.label ? projection.label + " · " : "") + (DE() ? "ausgewählt: " : "selected: ") + labels[selected],
					left: "center",
					textStyle: { fontSize: 13, color: c.ink, fontFamily: "Barlow, Open Sans, sans-serif" },
					subtextStyle: { fontSize: 10, color: c.muted, fontFamily: "Open Sans, sans-serif" }
				},
				tooltip: { trigger: "item", confine: true },
				xAxis3D: { type: "value", name: projection.axes[0], nameTextStyle: { color: c.muted }, axisLabel: { color: c.muted } },
				yAxis3D: { type: "value", name: projection.axes[1], nameTextStyle: { color: c.muted }, axisLabel: { color: c.muted } },
				zAxis3D: { type: "value", name: projection.axes[2], nameTextStyle: { color: c.muted }, axisLabel: { color: c.muted } },
				grid3D: {
					boxWidth: 100, boxDepth: 100, boxHeight: 100,
					viewControl: { alpha: 22, beta: 35, distance: 190 },
					axisLine: { lineStyle: { color: c.line } },
					splitLine: { lineStyle: { color: c.line } }
				},
				series: [{ type: "scatter3D", data: data, symbol: "circle", emphasis: { itemStyle: { color: c.gold } } }]
			};
		} else {
			option = {
				backgroundColor: "transparent",
				title: {
					text: title,
					subtext: projection.label + (DE() ? " · ausgewählt: " : " · selected: ") + labels[selected],
					left: "center",
					textStyle: { fontSize: 13, color: c.ink, fontFamily: "Barlow, Open Sans, sans-serif" },
					subtextStyle: { fontSize: 10, color: c.muted, fontFamily: "Open Sans, sans-serif" }
				},
				tooltip: { trigger: "item", confine: true },
				grid: { top: 62, bottom: 38, left: 48, right: 18 },
				xAxis: { type: "value", name: projection.axes[0], nameTextStyle: { color: c.muted }, axisLabel: { color: c.muted }, splitLine: { lineStyle: { color: c.line } } },
				yAxis: { type: "value", name: projection.axes[1], nameTextStyle: { color: c.muted }, axisLabel: { color: c.muted }, splitLine: { lineStyle: { color: c.line } } },
				series: [{ type: "scatter", data: data, symbol: "circle", emphasis: { itemStyle: { color: c.gold } } }]
			};
		}
		chart.setOption(option, true);
		chart.resize();
	}

	function featureMaxAbs(traces) {
		var max = 1;
		(traces || []).forEach(function (trace) {
			["x", "y", "z"].forEach(function (axis) {
				var values = trace && trace[axis];
				if (!Array.isArray(values)) return;
				values.forEach(function (value) {
					if (Array.isArray(value)) value.forEach(function (n) { if (isFinite(n)) max = Math.max(max, Math.abs(n)); });
					else if (isFinite(value)) max = Math.max(max, Math.abs(value));
				});
			});
		});
		return max;
	}

	function featureExtent2D(points) {
		var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		(points || []).forEach(function (p) {
			if (!p) return;
			minX = Math.min(minX, p[0] || 0); maxX = Math.max(maxX, p[0] || 0);
			minY = Math.min(minY, p[1] || 0); maxY = Math.max(maxY, p[1] || 0);
		});
		if (!isFinite(minX)) return { minX: -1, maxX: 1, minY: -1, maxY: 1 };
		var padX = (maxX - minX) * 0.12 || 0.5;
		var padY = (maxY - minY) * 0.12 || 0.5;
		return { minX: minX - padX, maxX: maxX + padX, minY: minY - padY, maxY: maxY + padY };
	}

	function renderFeatureArrows(el, layerIdx, data, projection) {
		if (!el || !window.Plotly || !projection || !projection.in.length) return;
		var c = palette();
		var labels = data.tokens.map(function (t) { return display(t); });
		var metric = projection.metric || featureMetric();
		var traces = [];
		if (window.tmMetric && window.tmMetric.showSphere && window.tmMetric.showSphere()) {
			Array.prototype.push.apply(traces, projection.is3d ? tmPlotly.sphereTraces() : tmPlotly.circleTraces());
		}
		var coordinate = function (v) { return (v || []).slice(0, 3).map(function (x) { return Number(x || 0).toFixed(3); }).join(", "); };
		var markerPoints = [];
		for (var i = 0; i < data.n; i++) {
			var sel = i === data.selected;
			var col = getPositionColor(i, data.n - 1);
			var rawIn = projection.rawIn[i] || [], rawOut = projection.rawOut[i] || [];
			var l2 = metricDistance(rawIn, rawOut, "euclidean");
			var ang = metricDistance(rawIn, rawOut, "angular");
			var tip = "<b>" + labels[i] + "</b><br>L2 " + l2.toFixed(3) + " · angle " + ang.toFixed(3) + " (" + (ang * 180).toFixed(1) + "°)<br>from [" + coordinate(rawIn) + "]<br>to [" + coordinate(rawOut) + "]";
			var from = projection.in[i], to = projection.out[i];
			var angular = metric === "angular" && window.tmMetric && window.tmMetric.slerpPoints;
			if (projection.is3d) {
				var arc = angular ? window.tmMetric.slerpPoints(from, to, 14) : [from, to];
				traces.push({
					type: "scatter3d", mode: "lines",
					x: arc.map(function (p) { return p[0]; }), y: arc.map(function (p) { return p[1]; }), z: arc.map(function (p) { return p[2]; }),
					line: { color: col, width: sel ? 6 : 3 }, hoverinfo: "skip", showlegend: false
				});
				var last = arc[arc.length - 1], prev = arc[arc.length - 2] || from;
				var dx = last[0] - prev[0], dy = last[1] - prev[1], dz = last[2] - prev[2];
				var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
				var cone = tmPlotly.coneTrace([{ x: last[0], y: last[1], z: last[2], u: dx / len, v: dy / len, w: dz / len, tip: tip }], col, labels[i]);
				if (cone) traces.push(cone);
				markerPoints.push({ x: from[0], y: from[1], z: from[2], size: sel ? 6 : 4, color: col, symbol: "circle", hover: tip });
			} else {
				var arc2 = angular ? window.tmMetric.slerpPoints([from[0], from[1] || 0, 0], [to[0], to[1] || 0, 0], 14).map(function (p) { return [p[0], p[1]]; }) : [[from[0], from[1] || 0], [to[0], to[1] || 0]];
				traces.push({
					type: "scatter", mode: "lines+markers",
					x: arc2.map(function (p) { return p[0]; }), y: arc2.map(function (p) { return p[1]; }),
					line: { color: col, width: sel ? 4 : 2 },
					marker: {
						symbol: arc2.map(function (_, k) { return k === arc2.length - 1 ? "arrow" : "circle"; }),
						size: arc2.map(function (_, k) { return k === arc2.length - 1 ? (sel ? 9 : 6) : (k === 0 ? (sel ? 6 : 4) : 0); }),
						color: col, line: { color: sel ? c.ink : col, width: sel ? 1 : 0 }, angleref: "previous"
					},
					hovertext: arc2.map(function () { return tip; }), hovertemplate: "%{hovertext}<extra></extra>", showlegend: false
				});
			}
		}
		if (markerPoints.length) traces.push(markerTrace(markerPoints));
		// Keep a compact metric title so a screenshot stays self-describing;
		// the step text carries the long explanation.
		var title = (DE() ? "Feature-Migration" : "Feature migration") + " · " + featureMetricLabel();
		var layout = projection.is3d ? tmPlotly.layout3D(title, projection.axes) : tmPlotly.layout2D(title, projection.axes);
		var rangeKey = featureCacheKey(layerIdx, data.trace.h_in[0].length, metric);
		if (projection.is3d) {
			var minR = 0;
			if (metric === "euclidean") {
				var currentR = featureMaxAbs(traces);
				var cachedR = window.isTraining ? (featureAxisRange3D[rangeKey] || 0) : 0;
				minR = Math.max(currentR, cachedR);
				if (window.isTraining) featureAxisRange3D[rangeKey] = minR;
			}
			tmPlotly.equalize3D(layout, traces, minR);
		} else if (metric === "euclidean") {
			var extent = featureExtent2D(projection.in.concat(projection.out));
			var cached2 = window.isTraining ? featureAxisRange2D[rangeKey] : null;
			if (cached2) {
				extent.minX = Math.min(extent.minX, cached2.minX);
				extent.maxX = Math.max(extent.maxX, cached2.maxX);
				extent.minY = Math.min(extent.minY, cached2.minY);
				extent.maxY = Math.max(extent.maxY, cached2.maxY);
			}
			if (window.isTraining) featureAxisRange2D[rangeKey] = extent;
			if (layout.xaxis) layout.xaxis.range = [extent.minX, extent.maxX];
			if (layout.yaxis) layout.yaxis.range = [extent.minY, extent.maxY];
		}
		if (window.echarts && el) { var oldChart = echarts.getInstanceByDom(el); if (oldChart) oldChart.dispose(); }
		var loading = el.querySelector(".plot-loading");
		if (loading) loading.remove();
		Array.prototype.slice.call(el.childNodes).forEach(function (node) {
			if (node.nodeType === 3 && node.nodeValue.trim()) node.remove();
		});
		el.style.height = featurePlotHeight() + "px";
		Plotly.react(el, traces, layout, { responsive: true, displayModeBar: false });
		el._tmFeatureRendered = true;
		el._tmFeatureQueued = false;
		el._tmFeatureSig = featureSignature(layerIdx);
	}

	function renderFeatureParallel(el, vec, label, color, title) {
		if (!el || !window.echarts || !vec || !vec.length) return;
		var c = palette();
		var chart = echarts.getInstanceByDom(el) || echarts.init(el);
		var axes = vec.map(function (_, i) {
			return { dim: i, name: "Dim " + i, nameTextStyle: { color: c.muted }, axisLabel: { color: c.muted }, axisLine: { lineStyle: { color: c.line } } };
		});
		chart.setOption({
			backgroundColor: "transparent",
			title: {
				text: title,
				subtext: (DE() ? "alle Dimensionen · " : "all dimensions · ") + label,
				left: "center",
				textStyle: { fontSize: 13, color: c.ink, fontFamily: "Barlow, Open Sans, sans-serif" },
				subtextStyle: { fontSize: 10, color: c.muted, fontFamily: "Open Sans, sans-serif" }
			},
			tooltip: { trigger: "item", confine: true },
			parallelAxis: axes,
			parallel: { left: 44, right: 44, bottom: 26, top: 60 },
			series: [{ type: "parallel", data: [vec], lineStyle: { width: 3, color: color }, emphasis: { lineStyle: { width: 5 } } }]
		}, true);
		chart.resize();
	}

	function featureMovementSummary(data) {
		var n = Math.max(1, Math.min(data.n, data.trace.h_in.length, data.trace.h_out.length));
		var l2 = 0, ang = 0;
		for (var i = 0; i < n; i++) {
			l2 += metricDistance(data.trace.h_in[i], data.trace.h_out[i], "euclidean");
			ang += metricDistance(data.trace.h_in[i], data.trace.h_out[i], "angular");
		}
		return { l2: l2 / n, ang: ang / n };
	}

	function renderLayerFeaturePlots(layerIdx) {
		var data = featureData(layerIdx);
		var prefix = "unified-layer-" + layerIdx;
		var arrowsEl = document.getElementById(prefix + "-feature-arrows");
		var note = document.getElementById(prefix + "-feature-projection");
		if (!data || !arrowsEl) return;
		var proj = featureProjection(data, layerIdx);
		if (note) {
			var movement = featureMovementSummary(data);
			var trained = (window.lossHistory || []).length;
			var label = trained > 0
				? (DE() ? "Epoche " : "Epoch ") + trained
				: (DE() ? "Untrainiert" : "Untrained");
			note.textContent = label
				+ (DE() ? " · mittleres Update: L2 " : " · mean update: L2 ") + movement.l2.toFixed(4)
				+ (DE() ? " · Winkel " : " · angle ") + (movement.ang * 180).toFixed(1) + "°";
			note.style.display = "";
		}
		renderFeatureArrows(arrowsEl, layerIdx, data, proj);
	}

	/* Automatic layer-card renders go through an observer and the shared
	   heavy-render queue: the 520px box stays (with its spinner) until the
	   card is actually near the viewport, then one plot is built per frame. */
	function featurePlotHeight() {
		var cfg = (typeof getTransformerConfig === 'function') ? getTransformerConfig() : null;
		return (cfg && cfg.d_model <= 3) ? 850 : 520;
	}

	function layerFeatureLoadingMarkup() {
		var text = DE() ? "Feature-Migration wird geladen…" : "Loading feature migration…";
		if (window.PlotState && PlotState.loadingMarkup) return PlotState.loadingMarkup(text);
		return '<div class="plot-loading" style="height:100%; flex-direction:column; gap:14px;">' +
			'<div class="spinner"></div><span>' + text + '</span></div>';
	}

	function featureSignature(layerIdx) {
		var trace = featureTraceAt(layerIdx);
		var n = trace && trace.h_in ? trace.h_in.length : 0;
		var d = trace && trace.h_in && trace.h_in[0] ? trace.h_in[0].length : 0;
		return (window.__tmTraceVersion | 0) + "|" + featureMetric() + "|" + d + "|" + n;
	}

	function queueLayerFeaturePlot(layerIdx, arrowsEl, force) {
		if (!arrowsEl || !arrowsEl.isConnected) return;
		var signature = featureSignature(layerIdx);
		if (!force && arrowsEl._tmFeatureRendered && arrowsEl._tmFeatureSig === signature) return;
		if (arrowsEl._tmFeatureQueued) { arrowsEl._tmFeatureDirty = true; return; }
		arrowsEl._tmFeatureQueued = true;
		arrowsEl._tmFeatureDirty = true;
		var run = function () {
			arrowsEl._tmFeatureQueued = false;
			if (!arrowsEl.isConnected) return;
			var currentSignature = featureSignature(layerIdx);
			if (!force && arrowsEl._tmFeatureRendered && arrowsEl._tmFeatureSig === currentSignature) {
				arrowsEl._tmFeatureDirty = false;
				return;
			}
			arrowsEl._tmFeatureDirty = false;
			var loader = arrowsEl.querySelector(".plot-loading");
			if (loader) loader.remove();
			renderLayerFeaturePlots(layerIdx);
			arrowsEl._tmFeatureRendered = !!arrowsEl.data;
			arrowsEl._tmFeatureSig = currentSignature;
		};
		if (window.isTraining) {
			try { run(); } catch (e) { console.error("[transformer_steps] live feature plot render failed", e); }
			return;
		}
		tmQueueFeature(run);
	}

	function observeDirtyFeaturePlot(layerIdx, arrowsEl) {
		if (!arrowsEl || arrowsEl._tmFeatureDirtyObserver) return;
		if (!('IntersectionObserver' in window)) { queueLayerFeaturePlot(layerIdx, arrowsEl, true); return; }
		arrowsEl._tmFeatureDirtyObserver = new IntersectionObserver(function (entries) {
			if (!entries.some(function (e) { return e.isIntersecting; })) return;
			if (!arrowsEl._tmFeatureDirty) return;
			queueLayerFeaturePlot(layerIdx, arrowsEl, true);
		}, { rootMargin: "200px 0px" });
		arrowsEl._tmFeatureDirtyObserver.observe(arrowsEl);
	}

	function featureLayerIdxForElement(el) {
		var match = /^unified-layer-(\d+)-feature-arrows$/.exec(el && el.id ? el.id : "");
		return match ? parseInt(match[1], 10) : -1;
	}

	/* Called on every training visual sync and from the event/interval
	   fallbacks. It redraws the Plotly feature-migration plots in place
	   (no loader wipe) so their arrows actually follow the weights. */
	function refreshFeaturePlots(opts) {
		opts = opts || {};
		if (opts.refit) resetFeatureProjectionCache();
		Array.prototype.slice.call(document.querySelectorAll('[id$="-feature-arrows"]')).forEach(function (el) {
			var idx = featureLayerIdxForElement(el);
			if (idx < 0) return;
			if (opts.visibleOnly && !metricIsVisible(el)) {
				el._tmFeatureDirty = true;
				observeDirtyFeaturePlot(idx, el);
				return;
			}
			queueLayerFeaturePlot(idx, el);
		});
	}
	window.tmRefreshFeaturePlots = refreshFeaturePlots;
	window.tmFeaturePlotsVisible = function () {
		return Array.prototype.some.call(document.querySelectorAll('[id$="-feature-arrows"]'), function (el) {
			return metricIsVisible(el);
		});
	};

	function scheduleLayerFeaturePlot(layerIdx, force) {
		var arrowsEl = document.getElementById("unified-layer-" + layerIdx + "-feature-arrows");
		if (!arrowsEl) return;
		if (arrowsEl.data && (force || arrowsEl._tmFeatureRendered)) {
			queueLayerFeaturePlot(layerIdx, arrowsEl, true);
			return;
		}
		if (force) {
			arrowsEl._tmFeatureRendered = false;
			arrowsEl._tmFeatureQueued = false;
			if (arrowsEl._tmFeatureObserver) {
				arrowsEl._tmFeatureObserver.disconnect();
				arrowsEl._tmFeatureObserver = null;
			}
		}
		if (arrowsEl._tmFeatureRendered) return;
		arrowsEl.style.height = featurePlotHeight() + "px";
		if (!arrowsEl.querySelector(".plot-loading")) {
			arrowsEl.innerHTML = layerFeatureLoadingMarkup();
		}
		if (arrowsEl._tmFeatureObserver) return;
		if (!('IntersectionObserver' in window)) { queueLayerFeaturePlot(layerIdx, arrowsEl); return; }
		arrowsEl._tmFeatureObserver = new IntersectionObserver(function (entries) {
			if (!entries.some(function (e) { return e.isIntersecting; })) return;
			arrowsEl._tmFeatureObserver.disconnect();
			arrowsEl._tmFeatureObserver = null;
			queueLayerFeaturePlot(layerIdx, arrowsEl);
		}, { rootMargin: "200px 0px" });
		arrowsEl._tmFeatureObserver.observe(arrowsEl);
	}

	function featureTopWords(vec, count) {
		var space = window.persistentEmbeddingSpace || {};
		var words = Object.keys(space);
		if (!words.length || !vec) return [];
		var temperature = 1;
		if (typeof getTransformerConfig === "function") {
			try { temperature = Math.max(0.05, getTransformerConfig().temperature || 1); } catch (e) { temperature = 1; }
		}
		var angleMode = !!window.tmUnembedAngleView;
		var vecNorm = 0;
		for (var vi = 0; vi < vec.length; vi++) vecNorm += (vec[vi] || 0) * (vec[vi] || 0);
		vecNorm = Math.sqrt(vecNorm) || 1;
		var scores = words.map(function (word) {
			var row = space[word] || [];
			var dot = 0, rowNorm = 0;
			for (var i = 0; i < vec.length; i++) {
				dot += (vec[i] || 0) * (row[i] || 0);
				rowNorm += (row[i] || 0) * (row[i] || 0);
			}
			if (angleMode) {
				var cos = dot / (vecNorm * (Math.sqrt(rowNorm) || 1));
				cos = Math.max(-1, Math.min(1, cos));
				return { word: word, score: cos, prob: cos, cos: cos, angle: Math.acos(cos) / Math.PI };
			}
			return { word: word, score: dot / temperature };
		});
		if (angleMode) {
			scores.sort(function (a, b) { return b.cos - a.cos; });
			return scores.slice(0, count);
		}
		var max = Math.max.apply(null, scores.map(function (s) { return s.score; }));
		var exps = scores.map(function (s) { return Math.exp(s.score - max); });
		var sum = exps.reduce(function (a, b) { return a + b; }, 0) || 1;
		scores.forEach(function (s, i) { s.prob = exps[i] / sum; });
		scores.sort(function (a, b) { return b.prob - a.prob; });
		return scores.slice(0, count);
	}

	function featureEsc(value) {
		return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	}

	function logitChip(item, color) {
		var angleMode = !!window.tmUnembedAngleView;
		var pct = angleMode
			? Math.max(0, Math.min(100, Math.round((item.cos || 0) * 100)))
			: Math.max(0, Math.min(100, Math.round((item.prob || 0) * 100)));
		var label = angleMode ? "cos " + (item.cos || 0).toFixed(2) : pct + "%";
		var title = angleMode ? "θ/π " + (item.angle || 0).toFixed(3) + " (" + ((item.angle || 0) * 180).toFixed(1) + "°)" : "";
		return '<span class="tm-logit-chip" style="--tm-logit-color:' + color + '">' +
			'<span class="tm-logit-chip-top"><span class="tm-logit-word">' + featureEsc(display(item.word)) + '</span><span class="tm-logit-pct" title="' + title + '">' + label + '</span></span>' +
			'<span class="tm-logit-bar"><i style="width:' + pct + '%"></i></span></span>';
	}

	function renderLayerLogitLens(layerIdx) {
		var host = document.getElementById("unified-layer-" + layerIdx + "-logit-lens");
		var data = featureData(layerIdx);
		if (!host) return;
		if (!data) {
			host.innerHTML = "<p class='tm-feature-empty'>" + (DE() ? "Noch keine Layer-Daten." : "No layer data yet.") + "</p>";
			return;
		}
		var trace = data.trace;
		var tokens = data.tokens;
		var labels = tokens.map(function (t) { return featureEsc(display(t)); });
		var d = trace.h_out[0].length;
		var head = "<div class='tm-logit-head'><span>" + (DE() ? "Token" : "token") + "</span><span>" + (DE() ? "vorher" : "before") + "</span><span></span><span>" + (DE() ? "nachher" : "after") + "</span></div>";
		function makeRow(i) {
			var before = featureTopWords(trace.h_in[i], 3);
			var after = featureTopWords(trace.h_out[i], 3);
			return "<div class='tm-logit-row" + (i === labels.length - 1 ? " is-last" : "") + "'><span class='tm-logit-token'>" + labels[i] + "</span><div class='tm-logit-side'>" + before.map(function (w) { return logitChip(w, "var(--tm-blue)"); }).join("") + "</div><span class='tm-logit-arrow'>→</span><div class='tm-logit-side'>" + after.map(function (w) { return logitChip(w, "var(--tm-green)"); }).join("") + "</div></div>";
		}
		var lastIdx = labels.length - 1;
		var lastRow = makeRow(lastIdx);
		var otherRows = labels.slice(0, lastIdx).map(function (_, i) { return makeRow(i); }).join("");
		var others = otherRows
			? "<details class='tm-logit-others'><summary>" + (DE() ? "Andere Tokens anzeigen" : "Show other tokens") + " (" + lastIdx + ")</summary><div class='tm-logit-lens'>" + head + otherRows + "</div></details>"
			: "";
		var texRows = trace.h_out.map(function (row) {
			return row.map(function (v) { return (Number(v) || 0).toFixed(2); }).join(" & ");
		}).join(" \\\\ ");
		var totalLayers = (window.__tmLayerTrace || []).length || 1;
		var depthColor = (typeof getPositionColor === "function") ? getPositionColor(layerIdx, totalLayers, "temml") : "";
		var hafterTex = "\\underbrace{" + depthColor + " h_{\\text{after}}^{(" + (layerIdx + 1) + ")}}_{\\text{hidden state after layer " + (layerIdx + 1) + "}} = \\underbrace{\\begin{pmatrix} " + texRows + " \\end{pmatrix}}_{\\substack{\\text{rows: tokens }(T)\\\\ \\text{columns: dimensions }(d_{\\text{model}})}}";
		var title = DE() ? "Logit-Linse · Schicht " + (layerIdx + 1) : "Logit lens · layer " + (layerIdx + 1);
		var angleMode = !!window.tmUnembedAngleView;
		var note = angleMode
			? (DE()
				? "Winkelansicht: Der Vektor wird mit jeder Wortzeile per Cosinus verglichen. Die Balken zeigen cos; der Tooltip nennt θ/π (0 = gleiche Richtung, 1 = Gegenrichtung). Das ist eine normierte Richtungsansicht, nicht die Modellwahrscheinlichkeit."
				: "Angle view: the vector is compared with every word row by cosine. The bars show cos; the tooltip gives θ/π (0 = same direction, 1 = opposite). This is a normalized direction view, not the model probability.")
			: (DE()
				? "Die Logit-Linse projiziert den Vektor nach dieser Schicht auf das Vokabular und vergleicht die Winkel. Standardmäßig siehst du nur das letzte Token: Sein Vektor hat den gesamten Kontext gesehen und bestimmt die nächste Vorhersage. Die Balken zeigen die Wahrscheinlichkeit des jeweiligen Kandidaten."
				: "The logit lens projects the vector after this layer onto the vocabulary and compares the angles. By default you see only the last token: its vector has seen the whole context and drives the next prediction. The bars show each candidate's probability.");
		var viewSelect = "<label class='tm-logit-view'>" + (DE() ? "Ansicht" : "View") + " <select class='tm-logit-view-select'><option value='logits'" + (!angleMode ? " selected" : "") + ">" + (DE() ? "Wahrscheinlichkeiten" : "Probabilities") + "</option><option value='angle'" + (angleMode ? " selected" : "") + ">" + (DE() ? "Winkel (Cosinus)" : "Angle (cosine)") + "</option></select></label>";
		var traces = window.__tmLayerTrace || [];
		var lastTokenIdx = data.tokens.length - 1;
		var sweep = "";
		if (traces.length > 1) {
			sweep = "<div class='tm-lens-sweep'><div class='tm-lens-sweep-title'>" + (DE() ? "Logit-Linse über die Tiefe · letztes Token" : "Logit lens across depth · last token") + "</div>";
			traces.forEach(function (tr, l) {
				if (!tr || !tr.h_out || !tr.h_out[lastTokenIdx]) return;
				var words = featureTopWords(tr.h_out[lastTokenIdx], 3);
				sweep += "<div class='tm-lens-sweep-row" + (l === layerIdx ? " is-current" : "") + "'><span class='tm-lens-sweep-layer'>L" + (l + 1) + "</span><div class='tm-logit-side'>" + words.map(function (w) { return logitChip(w, "var(--tm-green)"); }).join("") + "</div></div>";
			});
			sweep += "</div>";
		}
		host.innerHTML = "<details class='tm-layer-subbox tm-logit-subbox' data-sub='logit'><summary>" + title + "</summary><div class='tm-layer-subbox-body tm-logit-wrap'>" +
			viewSelect +
			"<div class='tm-hafter-simple'><div class='tm-hafter-math' data-tex='" + hafterTex + "' data-tex-display='true'></div></div>" +
			"<p class='tm-logit-note'>" + note + "</p><div class='tm-logit-lens'>" + head + lastRow + "</div>" + others + sweep + "</div></details>";
		typesetMathIn(host);
		var logitDetails = host.querySelector(".tm-logit-subbox");
		if (logitDetails && !logitDetails._tmSpinWired) {
			logitDetails._tmSpinWired = true;
			logitDetails.addEventListener("toggle", function () {
				if (!logitDetails.open) { hideSubboxLoading(logitDetails); return; }
				showSubboxLoading(logitDetails);
				setTimeout(function () { hideSubboxLoading(logitDetails); }, 450);
			});
		}
		var viewSel = host.querySelector(".tm-logit-view-select");
		if (viewSel) {
			viewSel.addEventListener("change", function () {
				window.tmUnembedAngleView = viewSel.value === "angle";
				window.dispatchEvent(new CustomEvent("tm:unembedview", { detail: { angle: window.tmUnembedAngleView } }));
			});
		}
	}

	function toggleTripleMath(layerIdx, triple) {
		var host = triple.parentNode;
		var panel = host.querySelector('.tm-triple-math[data-layer="' + layerIdx + '"]');
		if (panel) { panel.hidden = !panel.hidden; return; }
		var trace = (window.__tmLayerTrace || [])[layerIdx];
		if (!trace) return;
		var tokens = trace.tokenStrings || tokenList();
		var delta = trace.h_in.map(function (row, i) {
			return row.map(function (v, j) { return (trace.h_out[i][j] || 0) - v; });
		});
		var toMatrix = (typeof matrixToPmatrixLabeled === "function") ? matrixToPmatrixLabeled : matrixToPmatrix;
		panel = document.createElement("div");
		panel.className = "tm-triple-math";
		panel.setAttribute("data-layer", String(layerIdx));
		var intro = document.createElement("p");
		intro.className = "tm-triple-math-note";
		intro.textContent = DE()
			? "Die Heatmaps zeigen genau diese Matrizen: Zeilen sind Tokens, Spalten sind Dimensionen. Der Ausgang ist die Summe aus Eingang und Änderung."
			: "The heatmaps show exactly these matrices: rows are tokens, columns are dimensions. The output is the input plus the change.";
		panel.appendChild(intro);
		var formulas = [
			"h_{\\text{in}} = " + toMatrix(trace.h_in, tokens, DE() ? "Eingang" : "input"),
			"\\Delta h = " + toMatrix(delta, tokens, DE() ? "Änderung" : "change"),
			"h_{\\text{out}} = h_{\\text{in}} + \\Delta h = " + toMatrix(trace.h_out, tokens, DE() ? "Ausgang" : "output")
		];
		formulas.forEach(function (tex) {
			var row = document.createElement("div");
			row.className = "tm-triple-formula";
			row.setAttribute("data-tex", tex);
			panel.appendChild(row);
		});
		host.insertBefore(panel, triple.nextSibling);
		typesetMathIn(panel);
	}

	function renderLayerPreLNTriple(layerIdx) {
		var prefix = "unified-layer-" + layerIdx;
		var pairs = [["in", "in"], ["delta", "normdelta"], ["out", "norm"]];
		pairs.forEach(function (pair) {
			var id = prefix + "-preln-" + pair[0];
			var canvas = document.getElementById(id);
			if (!canvas) return;
			canvas.setAttribute("data-which", pair[1]);
			if (window.TransformerSteps && window.TransformerSteps.renderLayerResidualHeatmap) {
				window.TransformerSteps.renderLayerResidualHeatmap(id, layerIdx, pair[1]);
			}
		});
	}

	function wireRevealHeads(root) {
		if (!root) return;
		root.querySelectorAll("[data-reveal-target]").forEach(function (head) {
			if (head._tmRevealBound) return;
			head._tmRevealBound = true;
			var target = document.getElementById(head.getAttribute("data-reveal-target"));
			if (!target) return;
			var isDetails = target.tagName === "DETAILS";
			var group = head.getAttribute("data-reveal-group");
			var sync = function () {
				var open = isDetails ? target.open : !target.hidden;
				head.classList.toggle("is-revealed", open);
				head.setAttribute("aria-expanded", String(open));
			};
			var toggle = function () {
				var willOpen = isDetails ? !target.open : target.hidden;
				if (willOpen && group) {
					root.querySelectorAll('[data-reveal-group="' + group + '"]').forEach(function (other) {
						if (other === head) return;
						var t = document.getElementById(other.getAttribute("data-reveal-target"));
						if (!t) return;
						if (t.tagName === "DETAILS") t.open = false; else t.hidden = true;
						other.classList.remove("is-revealed");
						other.setAttribute("aria-expanded", "false");
					});
				}
				if (isDetails) target.open = !target.open;
				else target.hidden = !target.hidden;
				sync();
			};
			head.addEventListener("click", function (event) {
				if (event.target.closest && event.target.closest("summary, a, button")) return;
				toggle();
			});
			head.addEventListener("keydown", function (event) {
				if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); }
			});
			if (isDetails) target.addEventListener("toggle", sync);
			sync();
		});
	}

	function wireFFNViewSwitches(root) {
		if (!root) return;
		root.querySelectorAll(".tm-ffn-viewswitch").forEach(function (sw) {
			if (sw._tmViewBound) return;
			sw._tmViewBound = true;
			sw.addEventListener("click", function (event) {
				var btn = event.target.closest ? event.target.closest("button[data-view]") : null;
				if (!btn) return;
				event.stopPropagation();
				var view = btn.getAttribute("data-view");
				var stage = sw.closest(".tm-ffn-stage");
				if (!stage) return;
				sw.querySelectorAll("button").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
				stage.querySelectorAll(".tm-ffn-stage-canvas[data-view]").forEach(function (c) {
					c.hidden = c.getAttribute("data-view") !== view;
				});
				var card = stage.closest(".tm-layer-card");
				var idx = card ? parseInt(card.getAttribute("data-layer-idx"), 10) : NaN;
				if (!isNaN(idx)) renderLayerFFNStages(idx);
			});
		});
	}

	function redrawTripleCanvases(triple) {
		if (!triple || !triple.isConnected) return;
		triple.querySelectorAll(".tm-residual-heatmap-canvas").forEach(function (canvas) {
			var match = /-residual-(in|delta|out)$/.exec(canvas.id);
			var layer = parseInt(canvas.getAttribute("data-layer-idx"), 10);
			if (match && !isNaN(layer) && window.TransformerSteps && window.TransformerSteps.renderLayerResidualHeatmap) {
				window.TransformerSteps.renderLayerResidualHeatmap(canvas.id, layer, match[1]);
			}
		});
	}

	function renderLayerTripleResiduals(layerIdx) {
		var prefix = "unified-layer-" + layerIdx;
		var trace = (window.__tmLayerTrace || [])[layerIdx];
		var inEl = document.getElementById(prefix + "-residual-in");
		var deltaEl = document.getElementById(prefix + "-residual-delta");
		var outEl = document.getElementById(prefix + "-residual-out");
		var triple = inEl ? inEl.closest(".tm-residual-triple") : null;
		if (!trace || !inEl || !deltaEl || !outEl) return;
		var tripleRows = (trace.h_in && trace.h_in.length) || 0;
		[inEl, deltaEl, outEl].forEach(function (canvas) {
			canvas.style.height = (170 + tripleRows * 5) + "px";
		});
		["in", "delta", "out"].forEach(function (which) {
			var el = document.getElementById(prefix + "-residual-" + which);
			if (el && window.TransformerSteps && window.TransformerSteps.renderLayerResidualHeatmap) {
				window.TransformerSteps.renderLayerResidualHeatmap(el.id, layerIdx, which);
			}
		});
		var minIn = Infinity, maxIn = -Infinity, minDelta = Infinity, maxDelta = -Infinity;
		trace.h_in.forEach(function (row) { row.forEach(function (v) { minIn = Math.min(minIn, v); maxIn = Math.max(maxIn, v); }); });
		trace.h_out.forEach(function (row) { row.forEach(function (v) { minIn = Math.min(minIn, v); maxIn = Math.max(maxIn, v); }); });
		trace.h_in.forEach(function (row, i) { row.forEach(function (v, j) {
			var d = (trace.h_out[i][j] || 0) - v;
			minDelta = Math.min(minDelta, d); maxDelta = Math.max(maxDelta, d);
		}); });
		function rangeText(min, max) { return "min " + min.toFixed(2) + " · max " + max.toFixed(2); }
		var ri = document.getElementById(prefix + "-range-in");
		var rd = document.getElementById(prefix + "-range-delta");
		var ro = document.getElementById(prefix + "-range-out");
		if (ri) ri.textContent = rangeText(minIn, maxIn);
		if (ro) ro.textContent = rangeText(minIn, maxIn);
		if (rd) rd.textContent = rangeText(minDelta, maxDelta);
		if (triple && !triple._tmTripleBound) {
			triple._tmTripleBound = true;
			var tip = document.getElementById(prefix + "-residual-tooltip");
			var ids = [prefix + "-residual-in", prefix + "-residual-delta", prefix + "-residual-out"];
			ids.forEach(function (id) {
				var canvas = document.getElementById(id);
				if (!canvas) return;
				canvas.addEventListener("mousemove", function (event) {
					var rect = canvas.getBoundingClientRect();
					var left = 74, top = 34, right = 10, bottom = 8;
					var rows = trace.h_in.length, d = trace.h_in[0].length;
					var cw = (rect.width - left - right) / Math.max(1, d);
					var ch = (rect.height - top - bottom) / Math.max(1, rows);
					var x = event.clientX - rect.left, y = event.clientY - rect.top;
					var col = Math.floor((x - left) / cw), row = Math.floor((y - top) / ch);
					if (x < left || y < top || col < 0 || row < 0 || col >= d || row >= rows) { if (tip) tip.hidden = true; return; }
					var vi = (trace.h_in[row] && trace.h_in[row][col]) || 0;
					var vo = (trace.h_out[row] && trace.h_out[row][col]) || 0;
					var token = (trace.tokenStrings && trace.tokenStrings[row]) || tokenList()[row] || "";
					if (tip) {
						tip.textContent = display(token) + " · dim " + col + " · " + (DE() ? "Eingang " : "input ") + vi.toFixed(3) + " · Δ " + (vo - vi).toFixed(3) + " · " + (DE() ? "Ausgang " : "output ") + vo.toFixed(3);
						tip.hidden = false;
						var tr = triple.getBoundingClientRect();
						tip.style.left = Math.min(tr.width - 200, event.clientX - tr.left + 12) + "px";
						tip.style.top = Math.max(0, event.clientY - tr.top + 12) + "px";
					}
				});
				canvas.addEventListener("mouseleave", function () { if (tip) tip.hidden = true; });
			});
			if (!triple._tmTripleClickBound) {
				triple._tmTripleClickBound = true;
				triple.style.cursor = "pointer";
				triple.title = DE() ? "Klicken für die Matrizen" : "Click for the matrices";
				triple.addEventListener("click", function () { toggleTripleMath(layerIdx, triple); });
			}
		}
		if (triple) {
			if (window.ResizeObserver && !triple._tmTripleRO) {
				triple._tmTripleRO = new ResizeObserver(function () { redrawTripleCanvases(triple); });
				triple._tmTripleRO.observe(triple);
			}
			requestAnimationFrame(function () {
				requestAnimationFrame(function () { redrawTripleCanvases(triple); });
			});
		}
	}

	function updateDimensionReadout() {
		var el = document.getElementById("tm-dim-readout");
		if (!el) return;
		var cfg = (typeof getTransformerConfig === "function") ? getTransformerConfig() : {};
		var trace = (window.__tmLayerTrace || [])[0];
		var ffn = (window.__tmFFNTrace || [])[0];
		var dIn = trace && trace.h_in && trace.h_in[0] ? trace.h_in[0].length : (cfg.d_model || 0);
		var dHidden = ffn && ffn.out_L1 && ffn.out_L1[0] ? ffn.out_L1[0].length : (cfg.d_ff || dIn * 4);
		var dOut = trace && trace.h_out && trace.h_out[0] ? trace.h_out[0].length : (cfg.d_model || 0);
		el.textContent = DE()
			? "Gemessen: h_in = " + dIn + " → FFN-Hidden = " + dHidden + " → h_out = " + dOut + ". Attention bleibt bei d_model; nur das FFN erweitert und komprimiert wieder."
			: "Measured: h_in = " + dIn + " → FFN hidden = " + dHidden + " → h_out = " + dOut + ". Attention stays at d_model; only the FFN expands and compresses back.";
	}

	function enhanceLayerCards() {
		updateDimensionReadout();
		if (!window.__tmLayerTrace || !window.__tmLayerTrace.length) return;
		var headsFaq = document.querySelector('.optional[data-headline="What the heads actually react to"]');
		if (headsFaq && !headsFaq.dataset.tmHeadsMoved) {
			var firstAttn = document.querySelector('.tm-layer-card .tm-layer-subbox[data-sub="attention"] .tm-layer-subbox-body');
			if (firstAttn) {
				firstAttn.appendChild(headsFaq);
				headsFaq.dataset.tmHeadsMoved = "1";
			}
		}
		Array.prototype.slice.call(document.querySelectorAll(".tm-layer-card")).forEach(function (card) {
			if (card.getAttribute("data-tm-enhanced") === "1") return;
			var idx = parseInt(card.getAttribute("data-layer-idx"), 10);
			if (isNaN(idx)) return;
			var body = card.querySelector(".tm-layer-body");
			if (!body) return;
			if (!card.getAttribute("data-tm-opened-default")) {
				card.setAttribute("data-tm-opened-default", "1");
				body.hidden = false;
				var headBtn = card.querySelector(".tm-layer-head");
				if (headBtn) headBtn.setAttribute("aria-expanded", "true");
				card.classList.add("is-open");
			}
			var isDe = DE();
			var prefix = "unified-layer-" + idx;
			var preview = card.querySelector(".tm-layer-preview");
			var firstSignal = preview ? preview.querySelector(".layer-signal-canvas") : null;
			if (firstSignal) firstSignal.setAttribute("data-signal-mode", "block");
			if (preview) {
				Array.prototype.slice.call(preview.querySelectorAll(".layer-signal-canvas--ffn")).forEach(function (el) { el.remove(); });
			}
			var stack = body.querySelector(".tm-layer-subbox-stack") || body;
			if (!document.getElementById("tm-pre-layer-signal")) {
				var layerStack = card.parentNode;
				var firstCard = layerStack ? layerStack.querySelector(":scope > .tm-layer-card") : null;
				if (firstCard) {
					var preWrap = document.createElement("div");
					preWrap.className = "tm-layer-signal-between tm-layer-signal-before";
					preWrap.innerHTML = "<div class='tm-signal-between-label'>" + (isDe ? "Residual-Stream vor/nach Schicht 1" : "Residual stream before/after layer 1") + " · " + ((window.__tmLayerTrace && window.__tmLayerTrace[0] && window.__tmLayerTrace[0].tokenStrings) ? window.__tmLayerTrace[0].tokenStrings.length : 0) + (isDe ? " Tokens" : " tokens") + "</div><canvas id='tm-pre-layer-signal' class='layer-signal-canvas' data-layer-idx='0' data-signal-mode='pre'></canvas>";
					layerStack.insertBefore(preWrap, firstCard);
				}
			}
			if (idx === 0 && firstSignal) {
				firstSignal.style.display = "none";
			} else if (firstSignal && firstSignal.parentNode && !firstSignal.closest(".tm-layer-signal-between")) {
				var sigWrap = document.createElement("div");
				sigWrap.className = "tm-layer-signal-between tm-layer-signal-after";
				sigWrap.innerHTML = "<div class='tm-signal-between-label'>" + (isDe ? "Residual-Stream nach Schicht " : "Residual stream after layer ") + (idx + 1) + " · " + ((window.__tmLayerTrace && window.__tmLayerTrace[idx] && window.__tmLayerTrace[idx].tokenStrings) ? window.__tmLayerTrace[idx].tokenStrings.length : 0) + (isDe ? " Tokens" : " tokens") + "</div>";
				sigWrap.appendChild(firstSignal);
				card.parentNode.insertBefore(sigWrap, card.nextSibling);
			}
			if (window.TransformerSteps && window.TransformerSteps.renderLayerSignal) {
				Array.prototype.slice.call(document.querySelectorAll(".layer-signal-canvas")).forEach(function (c) {
					var si = parseInt(c.getAttribute("data-layer-idx"), 10);
					if (!isNaN(si)) window.TransformerSteps.renderLayerSignal(c.id, si);
				});
			}
			var sub = card.querySelector('.tm-layer-subbox[data-sub="migration"]');
			if (!sub) {
				sub = document.createElement("details");
				sub.className = "tm-layer-subbox";
				sub.setAttribute("data-sub", "migration");
				sub.innerHTML = "<summary>" + (isDe ? "Feature-Migration" : "Feature migration") + "</summary><div class='tm-layer-subbox-body'></div>";
				stack.insertBefore(sub, stack.firstChild);
			}
			var summary = sub.querySelector("summary");
			if (summary) summary.textContent = isDe ? "Feature-Migration" : "Feature migration";
			var sb = sub.querySelector(".tm-layer-subbox-body");
			if (!sb) return;
			if (!sub._tmSpinWired) {
				sub._tmSpinWired = true;
				sub.addEventListener("toggle", function () {
					if (!sub.open) { hideSubboxLoading(sub); return; }
					showSubboxLoading(sub);
					setTimeout(function () { hideSubboxLoading(sub); }, 450);
				});
			}
			Array.prototype.slice.call(sb.querySelectorAll(".tm-migration-canvas")).forEach(function (el) { el.remove(); });
			var oldDetail = sb.querySelector(".tm-migration-detail");
			if (oldDetail) oldDetail.style.display = "none";
			var lead = sb.querySelector(".tm-level-text");
			if (!lead) {
				lead = document.createElement("p");
				lead.className = "tm-level-text";
				sb.insertBefore(lead, sb.firstChild);
			}
			lead.textContent = isDe
				? "Diese Schicht liest den laufenden Vektor und schreibt ein Update. Die drei Heatmaps zeigen Eingang, die relative Änderung und Ausgang; darunter stehen die echten Min/Max-Werte. Die Heatmaps bleiben roh — die Distanzmetrik gilt für die Pfeil- und Trajektorien-Plots."
				: "This layer reads the running vector and writes an update. The three heatmaps show input, the relative change, and output; the real min/max values are shown below. The heatmaps stay raw; the distance metric applies to the arrow and trajectory plots.";
			if (!sb.querySelector(".tm-residual-triple")) {
				var triple = document.createElement("div");
				triple.className = "tm-residual-triple";
				triple.innerHTML = "<div class='tm-triple-cell'><div class='tm-triple-label'>" + (isDe ? "Eingang" : "input") + "</div><canvas id='" + prefix + "-residual-in' class='tm-residual-heatmap-canvas' data-layer-idx='" + idx + "' data-which='in'></canvas><div class='tm-triple-range' id='" + prefix + "-range-in'></div></div>" +
					"<span class='tm-triple-op'>+</span>" +
					"<div class='tm-triple-cell'><div class='tm-triple-label'>" + (isDe ? "Änderung" : "change") + "</div><canvas id='" + prefix + "-residual-delta' class='tm-residual-heatmap-canvas' data-layer-idx='" + idx + "' data-which='delta'></canvas><div class='tm-triple-range' id='" + prefix + "-range-delta'></div></div>" +
					"<span class='tm-triple-op'>=</span>" +
					"<div class='tm-triple-cell'><div class='tm-triple-label'>" + (isDe ? "Ausgang" : "output") + "</div><canvas id='" + prefix + "-residual-out' class='tm-residual-heatmap-canvas' data-layer-idx='" + idx + "' data-which='out'></canvas><div class='tm-triple-range' id='" + prefix + "-range-out'></div></div>" +
					"<div class='tm-residual-tooltip' id='" + prefix + "-residual-tooltip' hidden></div>";
			}
			renderLayerTripleResiduals(idx);
			if (!sb.querySelector(".tm-feature-wrap")) {
				var wrap = document.createElement("div");
				wrap.className = "tm-feature-wrap";
				var metricExplain = (window.tmMetric && window.tmMetric.explainHtml) ? window.tmMetric.explainHtml() : "";
				wrap.innerHTML = "<div class='tm-feature-primary'><span class='tm-feature-note' id='unified-layer-" + idx + "-feature-projection'></span>" +
					"<div id='unified-layer-" + idx + "-feature-arrows' class='tm-feature-arrows tm-plotly-frame'></div>" +
					"<div class='tm-feature-metric-explain'>" + metricExplain + "</div></div>" +
					"<div id='unified-layer-" + idx + "-logit-lens' class='tm-logit-lens-host'></div>";
				sb.insertBefore(wrap, oldDetail || null);
				typesetMathIn(wrap);
			}
			var featureWrap = sb.querySelector(".tm-feature-wrap");
			if (triple && featureWrap && triple.parentNode !== featureWrap) {
				featureWrap.insertBefore(triple, featureWrap.querySelector(".tm-logit-lens-host"));
			}
			var attentionBody = card.querySelector('.tm-layer-subbox[data-sub="attention"] .tm-layer-subbox-body');
			var formulaBody = card.querySelector('[id$="-formula-body"]');
			var layerCount = (window.__tmLayerTrace || []).length;
			var hlastViz = document.getElementById(prefix + "-hlast");
			var hlastStep = hlastViz ? hlastViz.closest(".tm-formula-step") : null;
			if (hlastStep && idx !== layerCount - 1) hlastStep.remove();
			if (attentionBody && formulaBody) {
				Array.prototype.slice.call(attentionBody.querySelectorAll(".tm-layer-attention-lines")).forEach(function (el) { el.remove(); });
				var normViz = document.getElementById(prefix + "-layernorm-viz");
				var normStep = normViz ? normViz.closest(".tm-formula-step") : null;
				var prelnBlock = document.getElementById(prefix + "-preln-block");
				var outViz = document.getElementById(prefix + "-concat-viz");
				var outStep = outViz ? outViz.closest(".tm-formula-step") : null;
				var headsHost = attentionBody.querySelector('[id$="-attention-heads"]') || attentionBody.firstChild;
				if (prelnBlock && prelnBlock.parentNode !== attentionBody) attentionBody.insertBefore(prelnBlock, headsHost);
				else if (!prelnBlock && normStep && normStep.parentNode !== attentionBody) attentionBody.insertBefore(normStep, headsHost);
				if (outStep && outStep.parentNode !== attentionBody) attentionBody.appendChild(outStep);
			}
			var logitHost = sb.querySelector(".tm-logit-lens-host");
			if (logitHost && logitHost.parentNode !== stack) stack.appendChild(logitHost);
			var attentionLead = card.querySelector('.tm-layer-subbox[data-sub="attention"] .tm-level-text');
			if (attentionLead) {
				attentionLead.textContent = isDe
					? "Attention ist der Mixer. Für ein Token bewertet seine Query jedes sichtbare Token; Softmax macht aus den Scores Gewichte, die sich zu 1 addieren. Lautet eine Zeile zum Beispiel [0.8, 0.05, 0.15], dann ist der neue Vektor 0.8·v₁ + 0.05·v₂ + 0.15·v₃: Das Token wandert zur Bedeutung des Kontexts, auf den es schaut. Die Query fragt, was das Token sucht; der Key sagt, was ein anderes Token anbietet; der Value ist der Inhalt, der bei einem guten Match mitkommt."
					: "Attention is the mixer. For one token, its query scores every visible token; softmax turns the scores into weights that sum to 1. With a row of [0.8, 0.05, 0.15], the new vector is 0.8·v₁ + 0.05·v₂ + 0.15·v₃: the token moves toward the meaning of the context it looks at. The query asks what the token is looking for; the key says what another token offers; the value is the content that travels on a good match.";
			}
			var ffnLead = card.querySelector('.tm-layer-subbox[data-sub="ffn"] .tm-level-text');
			if (ffnLead) {
				var actLabel = (typeof tmActivationLabel === "function") ? tmActivationLabel() : "GELU";
				var dmTag = '<span class="tm-inline-math" data-tex="d_{\\text{model}}" data-tex-display="false"></span>';
				var dffTag = '<span class="tm-inline-math" data-tex="d_{\\text{ff}}" data-tex-display="false"></span>';
				ffnLead.innerHTML = isDe
					? "Das FFN ist der Bearbeiter pro Token. Es schaut nicht auf andere Positionen: Attention hat den Kontext bereits in den Vektor gemischt. Das FFN expandiert den Vektor auf " + dffTag + ", wendet " + actLabel + " als Nichtlinearität an und komprimiert ihn zurück auf " + dmTag + ". Danach addiert der Residual-Stream das Ergebnis zum alten Vektor, statt ihn zu überschreiben."
					: "The FFN is the per-token editor. It does not look at other positions: attention has already mixed the context into the vector. The FFN expands the vector to " + dffTag + ", applies " + actLabel + " as the nonlinearity, and compresses it back to " + dmTag + ". The residual stream then adds the result to the old vector instead of overwriting it.";
				typesetMathIn(ffnLead);
			}
			if (!sub._tmFeatureBound) {
				sub._tmFeatureBound = true;
				sub.addEventListener("toggle", function () {
					if (!sub.open) return;
					setTimeout(function () {
						renderLayerTripleResiduals(idx);
						renderLayerPreLNTriple(idx);
						renderLayerFFNStages(idx);
						renderLayerFeaturePlots(idx);
						renderLayerLogitLens(idx);
					}, 60);
				});
			}
			if (preview) {
				var migrationDefault = preview.querySelector(".tm-migration-default");
				if (!migrationDefault) {
					migrationDefault = document.createElement("div");
					migrationDefault.className = "tm-migration-default";
					preview.appendChild(migrationDefault);
				}
				while (sb.firstChild) migrationDefault.appendChild(sb.firstChild);
				if (sub.parentNode) sub.remove();
				setTimeout(function () {
					renderLayerTripleResiduals(idx);
					scheduleLayerFeaturePlot(idx);
					renderLayerLogitLens(idx);
				}, 80);
			}
			wireRevealHeads(card);
			wireFFNViewSwitches(card);
			wireTDASteps(card);
			renderLayerPreLNTriple(idx);
			var stageGrid = card.querySelector(".tm-ffn-stages");
			if (stageGrid) typesetMathIn(stageGrid);
			card.setAttribute("data-tm-enhanced", "1");
			if (sub.open) {
				scheduleLayerFeaturePlot(idx);
				renderLayerLogitLens(idx);
			}
		});
	}
	window.addEventListener("tm:theme", function () {
		Object.keys(featureState).forEach(function (key) { renderLayerFeaturePlots(parseInt(key, 10)); });
		Object.keys(tdaState).forEach(tdaRedraw);
	});
	window.addEventListener("resize", function () {
		Object.keys(featureState).forEach(function (key) {
			var inputEl = document.getElementById("unified-layer-" + key + "-feature-input");
			var outputEl = document.getElementById("unified-layer-" + key + "-feature-output");
			[inputEl, outputEl].forEach(function (el) {
				if (!el || !window.echarts) return;
				var chart = echarts.getInstanceByDom(el);
				if (chart) chart.resize();
			});
		});
	});
	window.addEventListener("tm:transformer-data", function () {
		setTimeout(function () {
			enhanceLayerCards();
			updateDimensionReadout();
			Array.prototype.slice.call(document.querySelectorAll('.tm-layer-subbox[data-sub="migration"][open]')).forEach(function (sub) {
				var card = sub.closest(".tm-layer-card");
				if (!card) return;
				var idx = parseInt(card.getAttribute("data-layer-idx"), 10);
				if (!isNaN(idx)) {
					renderLayerTripleResiduals(idx);
					renderLayerPreLNTriple(idx);
					if (typeof renderLayerMigration === 'function') renderLayerMigration(idx);
					if (typeof renderLayerMigrationPlot === 'function') renderLayerMigrationPlot(idx);
					scheduleLayerFeaturePlot(idx, true);
					renderLayerLogitLens(idx);
				}
			});
			Array.prototype.slice.call(document.querySelectorAll('.tm-layer-subbox[data-sub="ffn"][open]')).forEach(function (sub) {
				var card = sub.closest(".tm-layer-card");
				if (!card) return;
				var idx = parseInt(card.getAttribute("data-layer-idx"), 10);
				if (!isNaN(idx)) renderLayerFFNStages(idx);
			});
			/* The feature wrap is moved from the migration subbox into the
			   layer preview during enhancement, so the [open] query above no
			   longer finds it. Refresh every rendered feature plot directly. */
			refreshFeaturePlots({ visibleOnly: true });
		}, 350);
	});
	window.addEventListener("tm:training-tick", function () {
		refreshFeaturePlots({ visibleOnly: true });
	});
	window.addEventListener("tm:training-end", function () {
		refreshFeaturePlots({ visibleOnly: false, refit: true });
	});
	setInterval(enhanceLayerCards, 1200);
	setInterval(classifyAttentionHeads, 1800);
	/* Fallback independent of events: when a new layer trace was published
	   while training, redraw the visible feature plots. */
	setInterval(function () {
		if (!window.isTraining) return;
		var version = window.__tmTraceVersion | 0;
		if (version === featureLastTraceVersion) return;
		featureLastTraceVersion = version;
		refreshFeaturePlots({ visibleOnly: true });
	}, 400);

	function typesetConfigMath() {
		var cfg = document.getElementById("transformer_config");
		if (!cfg) return;
		typesetMathIn(cfg);
	}
	setTimeout(typesetConfigMath, 700);
	setInterval(typesetConfigMath, 1800);

	function equalizeHyperCards() {
		var config = document.getElementById("transformer_config");
		if (!config) return;
		if (config.closest(".tm-hyper-body")) return;
		var cards = Array.prototype.slice.call(config.querySelectorAll(".transformer-config-field")).filter(function (el) {
			return el.id !== "transformer-preset-field" && el.offsetParent !== null;
		});
		if (!cards.length) return;
		cards.forEach(function (el) { el.style.minHeight = "0px"; });
		var max = Math.max.apply(null, cards.map(function (el) { return el.offsetHeight; }));
		if (!isFinite(max) || max <= 0) return;
		cards.forEach(function (el) { el.style.minHeight = max + "px"; });
	}
	setTimeout(equalizeHyperCards, 900);
	window.addEventListener("resize", equalizeHyperCards);
	window.addEventListener("tm:transformer-data", function () { setTimeout(equalizeHyperCards, 250); });

	function kvStatus(mode, reused) {
		var el = document.getElementById("tm-kv-cache-status");
		if (!el) return;
		if (!window.__tmKVCacheEnabled) {
			el.textContent = DE() ? "Aus" : "Off";
			return;
		}
		if (mode === "hit") {
			el.textContent = DE()
				? "An · " + reused + " Prefix-Tokens wiederverwendet, 1 neu berechnet"
				: "On · reused " + reused + " prefix tokens, computed 1";
		} else if (mode === "same") {
			el.textContent = DE()
				? "An · kompletter Cache wiederverwendet (" + reused + " Tokens)"
				: "On · full cache reused (" + reused + " tokens)";
		} else if (mode === "build") {
			el.textContent = DE()
				? "An · Cache für " + reused + " Tokens aufgebaut"
				: "On · cache built for " + reused + " tokens";
		} else {
			el.textContent = DE() ? "An" : "On";
		}
	}
	window.tmSetKVCacheStatus = kvStatus;

	function initKVCacheToggle() {
		var cb = document.getElementById("transformer-kv-cache");
		if (!cb) return;
		window.__tmKVCacheEnabled = !!cb.checked;
		if (!cb._tmKVBound) {
			cb._tmKVBound = true;
			cb.addEventListener("change", function () {
				window.__tmKVCacheEnabled = !!cb.checked;
				window.__tmKVCache = null;
				kvStatus("idle");
				if (cb.checked && typeof window.run_transformer_demo === "function") {
					setTimeout(function () { window.run_transformer_demo(); }, 0);
				}
			});
		}
		if (!window.__tmKVCacheEnabled) kvStatus("idle");
	}

	function kvDot(a, b) {
		var sum = 0;
		for (var i = 0; i < Math.min(a.length, b.length); i++) sum += (a[i] || 0) * (b[i] || 0);
		return sum;
	}

	window.tmKVCachedForwardPass = function (tokens, weights, d_model, n_heads, n_layers) {
		if (!window.__tmKVCacheEnabled || !window.__tmKVCacheEnabled) return null;
		if (typeof embedTokensWithPE !== "function" || typeof calculateLayerNorm !== "function" ||
			typeof matMul !== "function" || typeof matAdd !== "function" || typeof softmax !== "function" ||
			typeof geluApprox !== "function" || typeof addPositionalEncoding !== "function" ||
			typeof forwardOneLayer !== "function") return null;
		if (!tokens || !tokens.length || !weights || !weights.length) return null;

		var cache = window.__tmKVCache;
		var sameWeights = cache && cache.weightsRef === weights && cache.d_model === d_model &&
			cache.n_heads === n_heads && cache.n_layers === n_layers;
		if (sameWeights && cache.tokens.length === tokens.length) {
			var same = true;
			for (var i = 0; i < tokens.length; i++) if (cache.tokens[i] !== tokens[i]) { same = false; break; }
			if (same) {
				kvStatus("same", tokens.length);
				return cache.hFinal;
			}
		}
		var canIncrement = sameWeights && cache.tokens.length + 1 === tokens.length;
		if (canIncrement) {
			for (var p = 0; p < cache.tokens.length; p++) {
				if (cache.tokens[p] !== tokens[p]) { canIncrement = false; break; }
			}
		}
		if (canIncrement) {
			var last = tokens[tokens.length - 1];
			var pos = tokens.length - 1;
			var space = window.persistentEmbeddingSpace || {};
			var embedding = (space[last] || new Array(d_model).fill(0)).slice();
			var hNew = addPositionalEncoding(embedding, pos, d_model, 1);
			var dk = d_model / n_heads;
			for (var l = 0; l < n_layers; l++) {
				var w = weights[l];
				var cl = cache.layers[l];
				if (!cl || cl.K.length !== pos) return null;
				var norm = calculateLayerNorm([hNew], w.gamma, w.beta)[0];
				var Q = matMul([norm], w.attention.query)[0];
				var Knew = matMul([norm], w.attention.key)[0];
				var Vnew = matMul([norm], w.attention.value)[0];
				var keys = cl.K.concat([Knew]);
				var vals = cl.V.concat([Vnew]);
				var headContexts = [];
				for (var h = 0; h < n_heads; h++) {
					var off = h * dk;
					var q = Q.slice(off, off + dk);
					var scores = keys.map(function (k) { return kvDot(q, k.slice(off, off + dk)) / Math.sqrt(dk); });
					var probs = softmax(scores);
					var ctx = new Array(dk).fill(0);
					for (var j = 0; j < vals.length; j++) {
						for (var d = 0; d < dk; d++) ctx[d] += probs[j] * (vals[j][off + d] || 0);
					}
					headContexts.push(ctx);
				}
				var concat = [].concat.apply([], headContexts);
				var projected = matMul([concat], w.attention.output)[0];
				var hAttn = matAdd([hNew], [projected])[0];
				var gamma2 = w.gamma2 || new Array(d_model).fill(1);
				var beta2 = w.beta2 || new Array(d_model).fill(0);
				var norm2 = calculateLayerNorm([hAttn], gamma2, beta2)[0];
				var out1 = matMul([norm2], w.W1, w.b1)[0].map(geluApprox);
				var out2 = matMul([out1], w.W2, w.b2)[0];
				hNew = matAdd([hAttn], [out2])[0];
				cl.K.push(Knew);
				cl.V.push(Vnew);
			}
			cache.tokens.push(last);
			cache.hFinal.push(hNew);
			kvStatus("hit", tokens.length - 1);
			return cache.hFinal;
		}

		// Cache miss: build K/V for the full sequence once.
		var h = embedTokensWithPE(tokens, d_model);
		var layers = [];
		for (var l2 = 0; l2 < n_layers; l2++) {
			var w2 = weights[l2];
			var normH = calculateLayerNorm(h, w2.gamma, w2.beta);
			layers.push({
				K: matMul(normH, w2.attention.key),
				V: matMul(normH, w2.attention.value)
			});
			var result = forwardOneLayer(h, w2, d_model, n_heads, tokens, null);
			h = result.h_out;
		}
		window.__tmKVCache = {
			tokens: tokens.slice(),
			weightsRef: weights,
			d_model: d_model,
			n_heads: n_heads,
			n_layers: n_layers,
			layers: layers,
			hFinal: h.slice()
		};
		kvStatus("build", tokens.length);
		return h;
	};
	initKVCacheToggle();

	function setupResidualHoverPopup() {
		if (window.__tmResidualHoverBound) return;
		window.__tmResidualHoverBound = true;

		var popup = null, titleEl = null, canvasEl = null, vectorEl = null;
		var api = null, current = null, hoverRow = -1, hoverCol = -1;
		var hideTimer = null;

		function ensurePopup() {
			if (popup) return;
			popup = document.createElement("div");
			popup.className = "tm-res-hover-popup";
			popup.hidden = true;
			popup.innerHTML = '<div class="tm-res-hover-title"></div><canvas class="tm-res-hover-canvas"></canvas><div class="tm-res-hover-vector"></div>';
			document.body.appendChild(popup);
			titleEl = popup.querySelector(".tm-res-hover-title");
			canvasEl = popup.querySelector(".tm-res-hover-canvas");
			vectorEl = popup.querySelector(".tm-res-hover-vector");
			api = initCanvas(canvasEl, function (ctx, w, h) { drawHeatmap(ctx, w, h); });
			canvasEl.addEventListener("mousemove", onMove);
			canvasEl.addEventListener("mouseleave", function () { hoverRow = -1; hoverCol = -1; updateVector(); api.redraw(); });
			popup.addEventListener("mouseenter", cancelHide);
			popup.addEventListener("mouseleave", scheduleHide);
		}

		function cancelHide() { clearTimeout(hideTimer); }
		function scheduleHide() {
			clearTimeout(hideTimer);
			hideTimer = setTimeout(function () {
				if (popup) popup.hidden = true;
				current = null;
				hoverRow = -1;
				hoverCol = -1;
			}, 180);
		}

		function getLayout(w, h) {
			var rows = current ? current.data.length : 0;
			var cols = current && current.data[0] ? current.data[0].length : 0;
			var left = 78, top = 28, right = 10, bottom = 22;
			return {
				rows: rows, cols: cols, left: left, top: top, right: right, bottom: bottom,
				cw: (w - left - right) / Math.max(1, cols),
				ch: (h - top - bottom) / Math.max(1, rows)
			};
		}

		function cellColor(v, min, max) {
			var c = palette();
			if (v < 0) return rgb(mix(hex(c.paper), hex(c.blue), Math.min(1, v / (min || -1))));
			return rgb(mix(hex(c.paper), hex(c.gold), Math.min(1, v / (max || 1))));
		}

		function drawHeatmap(ctx, w, h) {
			ctx.clearRect(0, 0, w, h);
			if (!current || !current.data.length) return;
			var c = palette();
			var data = current.data, tokens = current.tokens;
			var rows = data.length, cols = data[0].length;
			var min = Infinity, max = -Infinity;
			for (var i = 0; i < rows; i++) {
				for (var j = 0; j < cols; j++) {
					var v = data[i][j] || 0;
					min = Math.min(min, v); max = Math.max(max, v);
				}
			}
			if (!isFinite(min) || !isFinite(max)) { min = -1; max = 1; }
			var L = getLayout(w, h);
			for (var r = 0; r < rows; r++) {
				for (var k = 0; k < cols; k++) {
					ctx.fillStyle = cellColor(data[r][k] || 0, min, max);
					ctx.fillRect(L.left + k * L.cw, L.top + r * L.ch, Math.ceil(L.cw) + 0.5, Math.ceil(L.ch) + 0.5);
				}
				ctx.fillStyle = getPositionColor(r, rows - 1);
				ctx.font = "600 9px Barlow, system-ui, sans-serif";
				ctx.textAlign = "right";
				ctx.textBaseline = "middle";
				ctx.fillText(fitText(ctx, display(tokens[r] || ""), 70), L.left - 6, L.top + r * L.ch + L.ch / 2);
			}
			if (hoverRow >= 0 && hoverRow < rows) {
				ctx.strokeStyle = c.ink;
				ctx.lineWidth = 1.5;
				ctx.strokeRect(L.left + 0.5, L.top + hoverRow * L.ch + 0.5, cols * L.cw - 1, L.ch - 1);
			}
			if (hoverRow >= 0 && hoverCol >= 0 && hoverCol < cols) {
				ctx.strokeStyle = c.ink;
				ctx.lineWidth = 2;
				ctx.strokeRect(L.left + hoverCol * L.cw + 0.5, L.top + hoverRow * L.ch + 0.5, L.cw - 1, L.ch - 1);
			}
			ctx.textAlign = "center";
			ctx.textBaseline = "alphabetic";
			ctx.fillStyle = c.muted;
			ctx.font = "600 8px Barlow, system-ui, sans-serif";
			var step = Math.max(1, Math.ceil(cols / 16));
			for (var d = 0; d < cols; d += step) {
				ctx.fillText(String(d), L.left + d * L.cw + L.cw / 2, h - 7);
			}
			ctx.textAlign = "left";
			ctx.fillText(DE() ? "Dimension →" : "dimension →", L.left, 13);
		}

		function updateVector() {
			if (!vectorEl) return;
			if (!current || hoverRow < 0 || hoverRow >= current.data.length) {
				vectorEl.textContent = DE() ? "Über eine Zeile fahren, um den vollständigen Vektor zu sehen." : "Hover a row to see the full vector.";
				return;
			}
			var row = current.data[hoverRow] || [];
			vectorEl.textContent = display(current.tokens[hoverRow] || "") + (DE() ? " · vollständiger Vektor: [" : " · full vector: [") + row.map(function (v) { return (v || 0).toFixed(3); }).join(", ") + "]";
		}

		function onMove(event) {
			if (!current || !canvasEl) return;
			var rect = canvasEl.getBoundingClientRect();
			var L = getLayout(rect.width, rect.height);
			var x = event.clientX - rect.left, y = event.clientY - rect.top;
			var col = Math.floor((x - L.left) / L.cw);
			var row = Math.floor((y - L.top) / L.ch);
			if (x < L.left || y < L.top || col < 0 || row < 0 || col >= L.cols || row >= L.rows) {
				row = -1; col = -1;
			}
			if (row === hoverRow && col === hoverCol) return;
			hoverRow = row; hoverCol = col;
			updateVector();
			api.redraw();
		}

		function positionPopup(label) {
			var r = label.getBoundingClientRect();
			var pw = popup.offsetWidth, ph = popup.offsetHeight;
			var left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left));
			var top = r.bottom + 8;
			if (top + ph > window.innerHeight - 70) top = Math.max(8, r.top - ph - 8);
			popup.style.left = left + "px";
			popup.style.top = top + "px";
		}

		function showFor(label) {
			var wrap = label.closest(".tm-layer-signal-between");
			if (!wrap) return;
			var canvas = wrap.querySelector(".layer-signal-canvas");
			var idx = canvas ? parseInt(canvas.getAttribute("data-layer-idx"), 10) : 0;
			if (isNaN(idx)) idx = 0;
			var trace = (window.__tmLayerTrace || [])[idx];
			if (!trace) return;
			var pre = wrap.classList.contains("tm-layer-signal-before");
			var data = pre ? trace.h_in : trace.h_out;
			if (!data || !data.length) return;
			var tokens = trace.tokenStrings || tokenList();
			ensurePopup();
			current = { data: data, tokens: tokens, layerIdx: idx, pre: pre };
			hoverRow = -1; hoverCol = -1;
			popup.hidden = false;
			var prefix = pre ? (DE() ? "Residual-Stream vor/nach Schicht 1" : "Residual stream before/after layer 1") : (DE() ? "Residual-Stream nach Schicht " : "Residual stream after layer ") + (idx + 1);
			titleEl.textContent = prefix + " · " + (DE() ? "alle Tokens, alle Dimensionen" : "all tokens, all dimensions");
			var below = window.innerHeight - label.getBoundingClientRect().bottom - 180;
			canvasEl.style.height = Math.max(200, Math.min(data.length * 17 + 52, below)) + "px";
			updateVector();
			api.redraw();
			positionPopup(label);
			cancelHide();
		}

		document.addEventListener("mouseover", function (event) {
			var label = event.target.closest ? event.target.closest(".tm-signal-between-label") : null;
			if (label) { showFor(label); return; }
			if (popup && popup.contains(event.target)) cancelHide();
		});
		document.addEventListener("mouseout", function (event) {
			var label = event.target.closest ? event.target.closest(".tm-signal-between-label") : null;
			if (label) scheduleHide();
		});
	}

	function subboxLoadingBody(sub) {
		return sub ? sub.querySelector(".tm-layer-subbox-body") : null;
	}

	function showSubboxLoading(sub) {
		var body = subboxLoadingBody(sub);
		if (!body) return;
		var loader = body.querySelector(":scope > .tm-subbox-loading");
		if (!loader) {
			loader = document.createElement("div");
			loader.className = "tm-subbox-loading";
			loader.innerHTML = '<span class="tm-metric-spinner" aria-hidden="true"></span><span></span>';
			body.appendChild(loader);
		}
		loader.lastElementChild.textContent = DE() ? "Plots werden geladen …" : "Loading plots…";
		loader.hidden = false;
		body.classList.add("tm-subbox-loading-active");
	}

	function hideSubboxLoading(sub) {
		var body = subboxLoadingBody(sub);
		if (!body) return;
		var loader = body.querySelector(":scope > .tm-subbox-loading");
		if (loader) loader.hidden = true;
		body.classList.remove("tm-subbox-loading-active");
	}

	window.tmSubboxLoading = { show: showSubboxLoading, hide: hideSubboxLoading };

	function renderLayerFFNMatrix(canvasId, layerIdx, which) {
		var canvas = document.getElementById(canvasId);
		if (!canvas) return;
		var entry = layerFFNHeatmapRegistry[canvasId];
		if (entry && (entry.canvas !== canvas || entry.which !== which)) {
			delete layerFFNHeatmapRegistry[canvasId];
			entry = null;
		}
		if (!entry) {
			entry = { canvas: canvas, layerIdx: layerIdx, which: which, api: null };
			entry.api = initCanvas(canvas, function (ctx, w, h) {
				if (entry.which === "fan") drawFFNFan(ctx, w, h, entry.layerIdx);
				else if (entry.which === "curve") drawFFNCurvature(ctx, w, h, entry.layerIdx);
				else if (entry.which === "space") drawFFNSpace(ctx, w, h, entry.layerIdx);
				else drawFFNMatrix(ctx, w, h, entry.layerIdx, entry.which);
			});
			layerFFNHeatmapRegistry[canvasId] = entry;
		} else {
			entry.layerIdx = layerIdx;
			entry.which = which;
			entry.api.redraw();
		}
		if (which !== "fan" && which !== "curve" && which !== "space") {
			attachFFNHeatmapHover(canvas, function () { return entry; });
		}
		canvas.setAttribute("data-layer-ffn-ready", "1");
	}

	function renderLayerFFNStages(layerIdx) {
		var prefix = "unified-layer-" + layerIdx;
		var ffn = (window.__tmFFNTrace || [])[layerIdx];
		if (ffn && ffn.normed_h1 && ffn.normed_h1[0] && ffn.out_L1 && ffn.out_L1[0]) {
			var dm = ffn.normed_h1[0].length;
			var dff = ffn.out_L1[0].length;
			var p = document.getElementById(prefix + "-ffn-shape-preln");
			var e = document.getElementById(prefix + "-ffn-shape-expand");
			var c = document.getElementById(prefix + "-ffn-shape-compress");
			if (p) p.textContent = "h₁ (" + dm + ") → Norm (" + dm + ")";
			if (e) e.textContent = dm + " → " + dff;
			if (c) c.textContent = dff + " → " + dm;
			var fillBar = function (id, a, b, la, lb) {
				var el = document.getElementById(id);
				if (!el) return;
				var max = Math.max(a, b) || 1;
				el.innerHTML = '<div class="tm-ffn-widthrow"><span>' + la + ' · ' + a + '</span><i style="width:' + (a / max * 100).toFixed(1) + '%"></i></div>' +
					'<div class="tm-ffn-widthrow"><span>' + lb + ' · ' + b + '</span><i style="width:' + (b / max * 100).toFixed(1) + '%"></i></div>';
			};
			fillBar(prefix + "-ffn-width-expand", dm, dff, "d_model", "d_ff");
			fillBar(prefix + "-ffn-width-compress", dff, dm, "d_ff", "d_model");
		}
		[
			["-ffn-preln-in", "h1"],
			["-ffn-preln-out", "norm"],
			["-ffn-heatmap", "outL1"],
			["-ffn-compress-heatmap", "outFFN"],
			["-ffn-fan", "fan"],
			["-ffn-curve", "curve"],
			["-ffn-space", "space"]
		].forEach(function (pair) {
			var canvas = document.getElementById(prefix + pair[0]);
			// The space view evaluates the real FFN on a grid; build it only when visible.
			if (canvas && canvas.hidden && pair[1] === "space") return;
			renderLayerFFNMatrix(prefix + pair[0], layerIdx, pair[1]);
		});
		renderTDAStep(layerIdx);
	}

	window.TransformerSteps = {
		init: function (hostId) {
			var host = document.getElementById(hostId);
			if (!host) return null;
			updateCapacityNote();
			bindCapacityNote();
			var canvases = {
				tokenize: document.getElementById("tm-step-tokenize"),
				embed: document.getElementById("tm-step-embed"),
				position: document.getElementById("tm-step-position"),
				attend: document.getElementById("tm-step-attend"),
				ffn: document.getElementById("tm-step-ffn"),
				residual: document.getElementById("tm-step-residual"),
				unembed: document.getElementById("tm-step-unembed")
			};
			var draws = {
				tokenize: drawTokenize,
				embed: drawEmbed,
				position: drawPosition,
				attend: drawAttend,
				ffn: drawFFN,
				residual: drawResidual,
				unembed: drawUnembed
			};
			var stepModes = { embed: "pca", position: "pca", attend: "0" };
			if (canvases.position) {
				var posCanvas = canvases.position;
				var posParent = posCanvas.parentNode;
				if (posParent && !posParent.querySelector(".tm-position-loading")) {
					if (getComputedStyle(posParent).position === "static") posParent.style.position = "relative";
					var loading = document.createElement("div");
					loading.className = "tm-position-loading";
					loading.innerHTML = "<span class='tm-position-spinner' aria-hidden='true'></span><span>" + (DE() ? "Positionsvektoren werden geladen …" : "Position vectors are loading…") + "</span>";
					posParent.appendChild(loading);
					var loadingTries = 0;
					var loadingPoll = setInterval(function () {
						loadingTries++;
						if ((window.__tmLayerTrace && window.__tmLayerTrace.length) || loadingTries > 80) {
							clearInterval(loadingPoll);
							loading.remove();
						}
					}, 250);
				}
			}
			var apis = {};
			Object.keys(canvases).forEach(function (key) {
				var canvas = canvases[key];
				if (!canvas) return;
				apis[key] = initCanvas(canvas, function (ctx, w, h) {
					draws[key](ctx, w, h, stepModes[key]);
				});
			});
			if (canvases.ffn) attachFFNHeatmapHover(canvases.ffn, function () {
				return (window.__tmFFNTrace || []).length - 1;
			});
			function stepModeLabels() {
				var d = dModel();
				var trace = (window.__tmLayerTrace || [])[0];
				var heads = (trace && trace.headData) ? trace.headData.length : 0;
				var labels = { embed: [], position: [], attend: [] };
				if (d > 3) {
					labels.embed = [["pca", "PCA"], ["parallel", DE() ? "Alle Dimensionen" : "All dimensions"]];
				}
				// Position shows the semantic vector (h0 = token + position)
				// in raw dimensions up to 3D and PCA above that; no heatmap
				// or curve switch, so the view is not hidden behind a mode.
				if (heads) {
					labels.attend = Array.from({ length: heads }, function (_, i) { return [String(i), "Head " + (i + 1)]; });
				}
				return labels;
			}
			function buildStepModes() {
				var labels = stepModeLabels();
				if (dModel() <= 3) {
					if (stepModes.embed === "parallel") stepModes.embed = "pca";
					stepModes.position = "pca";
				}
				["embed", "position", "attend"].forEach(function (key) {
					var list = labels[key] || [];
					var has = list.some(function (pair) { return pair[0] === stepModes[key]; });
					if (!has) stepModes[key] = list.length ? list[0][0] : (key === "attend" ? "0" : stepModes[key]);
				});
				host.querySelectorAll("[data-step-modes]").forEach(function (modeHost) {
					var key = modeHost.getAttribute("data-step-modes");
					var list = labels[key] || [];
					modeHost.innerHTML = "";
					if (!list.length) { modeHost.style.display = "none"; return; }
					modeHost.style.display = "";
					list.forEach(function (pair) {
						var btn = document.createElement("button");
						btn.type = "button";
						btn.className = "tm-step-mode" + (stepModes[key] === pair[0] ? " is-active" : "");
						btn.textContent = pair[1];
						btn.addEventListener("click", function () {
							stepModes[key] = pair[0];
							modeHost.querySelectorAll(".tm-step-mode").forEach(function (x) { x.classList.remove("is-active"); });
							btn.classList.add("is-active");
							if (apis[key]) apis[key].redraw();
						});
						modeHost.appendChild(btn);
					});
				});
			}
			buildStepModes();
			if (canvases.embed && apis.embed) attachRotation(canvases.embed, stepRotations.embed, apis.embed.redraw);
			if (canvases.position && apis.position) attachRotation(canvases.position, stepRotations.position, apis.position.redraw);
			var pending = null;
			function redraw() {
				if (pending) return;
				pending = requestAnimationFrame(function () {
					pending = null;
					Object.keys(apis).forEach(function (key) { apis[key].redraw(); });
				});
			}
			var unembedTemp = document.getElementById("tm-unembed-temp");
			var unembedTempOut = document.getElementById("tm-unembed-temp-out");
			var unembedTokens = document.getElementById("tm-unembed-tokens");
			function renderUnembedTokens() {
				if (!unembedTokens) return;
				var words = window.__tmUnembedTop || [];
				if (!words.length) {
					var space = window.persistentEmbeddingSpace || {};
					words = Object.keys(space).slice(0, 12);
				}
				unembedTokens.innerHTML = "";
				words.slice(0, 12).forEach(function (word) {
					var btn = document.createElement("button");
					btn.type = "button";
					btn.className = "tm-unembed-token";
					btn.textContent = display(word);
					btn.title = DE() ? "Token anhängen" : "Append token";
					btn.addEventListener("click", function () {
						if (typeof window.select_suggested_word === "function") window.select_suggested_word(word);
						setTimeout(renderUnembedSentence, 250);
					});
					unembedTokens.appendChild(btn);
				});
			}
			var unembedTopk = document.getElementById("tm-unembed-topk");
			var unembedTopkOut = document.getElementById("tm-unembed-topk-out");
			var unembedSample = document.getElementById("tm-unembed-sample");
			var unembedSampleOut = document.getElementById("tm-unembed-sample-out");
			var unembedSentence = document.getElementById("tm-unembed-sentence");
			function renderUnembedSentence() {
				if (!unembedSentence) return;
				var prompt = document.getElementById("transformer-master-token-input");
				var text = prompt ? prompt.value : "";
				var tokens = [];
				if (text && typeof window.transformer_tokenize_render === "function") {
					tokens = window.transformer_tokenize_render(text, null, false);
				} else if (text) {
					tokens = text.split(/\s+/);
				}
				tokens = tokens.filter(function (token) { return String(token) !== "<|endoftext|>"; });
				unembedSentence.innerHTML = tokens.map(function (token, i) {
					return '<span class="tm-unembed-sent-token">' + featureEsc(display(token)) + '<button type="button" class="tm-unembed-sent-remove" data-index="' + i + '" aria-label="' + (DE() ? "Token entfernen" : "Remove token") + '" title="' + (DE() ? "Token entfernen" : "Remove token") + '">×</button></span>';
				}).join('') + '<span class="tm-unembed-sent-cursor" aria-hidden="true">▍</span>';
			}
			if (unembedSentence && !unembedSentence._tmRemoveBound) {
				unembedSentence._tmRemoveBound = true;
				unembedSentence.addEventListener("click", function (event) {
					var btn = event.target.closest ? event.target.closest(".tm-unembed-sent-remove") : null;
					if (!btn) return;
					var idx = parseInt(btn.getAttribute("data-index"), 10);
					var prompt = document.getElementById("transformer-master-token-input");
					if (!prompt || isNaN(idx)) return;
					var typeEl = document.getElementById("transformer-tokenizer-type");
					var type = typeEl ? typeEl.value : "regex";
					var tokens = (typeof window.tokenizeTextCore === "function")
						? window.tokenizeTextCore(prompt.value, type)
						: (prompt.value ? prompt.value.split(/\s+/) : []);
					if (idx < 0 || idx >= tokens.length) return;
					tokens.splice(idx, 1);
					prompt.value = tokens.join("\u200B");
					prompt.dispatchEvent(new Event("input", { bubbles: true }));
					setTimeout(renderUnembedSentence, 250);
				});
			}
			function sampleUnembed() {
				var cached = window._cachedFinalProjection;
				var space = window.persistentEmbeddingSpace;
				if (!cached || !cached.h_final || !cached.h_final.length || !space) return;
				var vec = cached.h_final[cached.h_final.length - 1];
				var mainTemp = document.getElementById("transformer-temperature");
				var temp = mainTemp ? Math.max(0.05, parseFloat(mainTemp.value) || 1) : 1;
				var k = unembedTopk ? Math.max(1, parseInt(unembedTopk.value, 10) || 1) : 5;
				var scores = Object.keys(space).map(function (word) {
					var dot = 0;
					for (var i = 0; i < vec.length; i++) dot += vec[i] * (space[word][i] || 0);
					return { word: word, score: dot / temp };
				}).sort(function (a, b) { return b.score - a.score; }).slice(0, k);
				if (!scores.length) return;
				var max = scores[0].score;
				var exps = scores.map(function (item) { return Math.exp(item.score - max); });
				var sum = exps.reduce(function (a, b) { return a + b; }, 0);
				var r = Math.random() * sum;
				var chosen = scores[scores.length - 1];
				for (var j = 0; j < scores.length; j++) {
					r -= exps[j];
					if (r <= 0) { chosen = scores[j]; break; }
				}
				if (unembedSampleOut) unembedSampleOut.textContent = "→ " + display(chosen.word);
				if (typeof window.select_suggested_word === "function") window.select_suggested_word(chosen.word);
				setTimeout(renderUnembedSentence, 300);
			}
			if (unembedTopk) {
				unembedTopk.addEventListener("input", function () {
					if (unembedTopkOut) unembedTopkOut.textContent = unembedTopk.value;
					if (apis.unembed) apis.unembed.redraw();
				});
				if (unembedTopkOut) unembedTopkOut.textContent = unembedTopk.value;
			}
			if (unembedSample) unembedSample.addEventListener("click", sampleUnembed);
			renderUnembedSentence();
			function syncUnembedTemp() {
				if (!unembedTemp) return;
				var main = document.getElementById("transformer-temperature");
				if (main) {
					main.value = unembedTemp.value;
					main.dispatchEvent(new Event("input", { bubbles: true }));
				}
				if (unembedTempOut) unembedTempOut.textContent = parseFloat(unembedTemp.value).toFixed(1);
			}
			if (unembedTemp) {
				unembedTemp.addEventListener("input", function () {
					if (unembedTempOut) unembedTempOut.textContent = parseFloat(unembedTemp.value).toFixed(1);
					syncUnembedTemp();
					if (apis.unembed) apis.unembed.redraw();
				});
				var mainTemp = document.getElementById("transformer-temperature");
				if (mainTemp) {
					mainTemp.addEventListener("input", function () {
						unembedTemp.value = mainTemp.value;
						if (unembedTempOut) unembedTempOut.textContent = parseFloat(mainTemp.value).toFixed(1);
						if (apis.unembed) apis.unembed.redraw();
					});
				}
			}
			renderUnembedTokens();
			if (canvases.unembed && !canvases.unembed._tmLogitClickBound) {
				canvases.unembed._tmLogitClickBound = true;
				canvases.unembed.style.cursor = "pointer";
				canvases.unembed.setAttribute("tabindex", "0");
				canvases.unembed.setAttribute("role", "button");
				canvases.unembed.title = DE() ? "Auf einen Balken klicken, um das Token anzuhängen" : "Click a bar to append that token";
				canvases.unembed.addEventListener("click", function (event) {
					var words = window.__tmUnembedTop || [];
					if (!words.length) return;
					var rect = canvases.unembed.getBoundingClientRect();
					var y = event.clientY - rect.top;
					var x = event.clientX - rect.left;
					var top = 18, pad = 16, left = 0;
					var rowH = (rect.height - top - pad) / Math.max(1, words.length);
					var idx = Math.floor((y - top) / rowH);
					if (x < left || idx < 0 || idx >= words.length) return;
					if (typeof window.select_suggested_word === "function") {
						window.select_suggested_word(words[idx]);
						setTimeout(renderUnembedSentence, 280);
					}
				});
			}
			host.setAttribute("data-demo-ready", "1");
			renderLayerPreviews();
			window.addEventListener("tm:theme", redraw);
			if (window.__MN_DARK && window.__MN_DARK.onChange) window.__MN_DARK.onChange(redraw);
			window.addEventListener("tm:transformer-data", function () { buildStepModes(); redraw(); renderUnembedTokens(); renderUnembedSentence(); });
			window.addEventListener("resize", redraw);
			var tries = 0;
			var poll = setInterval(function () {
				tries++;
				if ((window.__tmLayerTrace && window.__tmLayerTrace.length) || tries > 80) {
					clearInterval(poll);
					buildStepModes();
					redraw();
					renderLayerPreviews();
					renderUnembedTokens();
					renderUnembedSentence();
				}
			}, 500);
			redraw();
			return { redraw: redraw };
		},
		renderLayerResidual: function (canvasId, layerIdx) {
			var canvas = document.getElementById(canvasId);
			if (!canvas) return;
			var entry = layerCanvasRegistry[canvasId];
			if (!entry) {
				entry = { layerIdx: layerIdx, api: null };
				entry.api = initCanvas(canvas, function (ctx, w, h) {
					drawLayerResidual(ctx, w, h, entry.layerIdx);
				});
				layerCanvasRegistry[canvasId] = entry;
			} else {
				entry.layerIdx = layerIdx;
				entry.api.redraw();
			}
			canvas.setAttribute('data-layer-residual-ready', '1');
		},
		renderLayerAttentionLines: function (canvasId, layerIdx) {
			var canvas = document.getElementById(canvasId);
			if (!canvas) return;
			var entry = layerAttentionLineRegistry[canvasId];
			if (!entry) {
				entry = { layerIdx: layerIdx, api: null };
				entry.api = initCanvas(canvas, function (ctx, w, h) {
					drawAttend(ctx, w, h, "0", entry.layerIdx);
				});
				layerAttentionLineRegistry[canvasId] = entry;
			} else {
				entry.layerIdx = layerIdx;
				entry.api.redraw();
			}
			canvas.setAttribute("data-layer-attention-ready", "1");
		},
		renderLayerFFNHeatmap: function (canvasId, layerIdx) {
			renderLayerFFNMatrix(canvasId, layerIdx, "outL1");
		},
		renderLayerFFNMatrix: renderLayerFFNMatrix,
		renderLayerFFNStages: renderLayerFFNStages,
		renderLayerSignal: function (canvasId, layerIdx) {
			var canvas = document.getElementById(canvasId);
			if (!canvas) return;
			var mode = canvas.getAttribute("data-signal-mode") || "attention";
			var entry = signalCanvasRegistry[canvasId];
			if (entry && entry.canvas !== canvas) { delete signalCanvasRegistry[canvasId]; entry = null; }
			if (!entry) {
				entry = { canvas: canvas, layerIdx: layerIdx, mode: mode, api: null };
				entry.api = initCanvas(canvas, function (ctx, w, h) {
					drawLayerSignal(ctx, w, h, entry.layerIdx, entry.mode);
				});
				signalCanvasRegistry[canvasId] = entry;
			} else {
				entry.layerIdx = layerIdx;
				entry.mode = mode;
				entry.api.redraw();
			}
			canvas.setAttribute("data-layer-signal-ready", "1");
		},
		renderLayerResidualHeatmap: function (canvasId, layerIdx, which) {
			var canvas = document.getElementById(canvasId);
			if (!canvas) return;
			which = which || "in";
			var entry = residualHeatmapRegistry[canvasId];
			if (entry && entry.canvas !== canvas) { delete residualHeatmapRegistry[canvasId]; entry = null; }
			if (!entry) {
				entry = { canvas: canvas, layerIdx: layerIdx, which: which, api: null };
				entry.api = initCanvas(canvas, function (ctx, w, h) {
					drawResidualHeatmap(ctx, w, h, entry.layerIdx, entry.which);
				});
				residualHeatmapRegistry[canvasId] = entry;
			} else {
				entry.layerIdx = layerIdx;
				entry.which = which;
				entry.api.redraw();
			}
			canvas.setAttribute("data-residual-heatmap-ready", "1");
		},
		enhanceLayerCards: enhanceLayerCards,
		renderLayerPreLNTriple: renderLayerPreLNTriple,
		renderLayerFeaturePlots: renderLayerFeaturePlots,
		renderLayerLogitLens: renderLayerLogitLens,
		renderLayerMigration: function (canvasId, layerIdx) {
			var canvas = document.getElementById(canvasId);
			if (!canvas) return;
			var entry = migrationCanvasRegistry[canvasId];
			if (!entry) {
				entry = { layerIdx: layerIdx, api: null, rot: { y: -0.6, x: 0.35 } };
				entry.api = initCanvas(canvas, function (ctx, w, h) {
					drawMigrationArrows(ctx, w, h, entry.layerIdx, entry.rot);
				});
				attachRotation(canvas, entry.rot, entry.api.redraw);
				migrationCanvasRegistry[canvasId] = entry;
			} else {
				entry.layerIdx = layerIdx;
				entry.api.redraw();
			}
			canvas.setAttribute('data-layer-migration-ready', '1');
		}
	};
	setupResidualHoverPopup();
})();

/* The step boxes themselves are collapsible, independent of the data engine. */
(function () {
	"use strict";
	function wire() {
		document.querySelectorAll(".tm-step-toggle").forEach(function (btn) {
			if (btn._tmStepWired) return;
			btn._tmStepWired = true;
			btn.addEventListener("click", function () {
				var card = btn.closest(".tm-step");
				if (!card) return;
				var body = card.querySelector(".tm-step-body");
				if (!body) return;
				var open = body.hidden;
				body.hidden = !open;
				btn.setAttribute("aria-expanded", String(open));
				btn.textContent = open ? "−" : "+";
				btn.setAttribute("aria-label", open ? "Collapse step" : "Expand step");
				card.classList.toggle("is-collapsed", !open);
				if (open) setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 60);
			});
		});
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
	else wire();
})();

/* Full-bleed cards need the real scrollbar width, or 100vw overflows by it. */
(function () {
	"use strict";
	function updateBleed() {
		var scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
		document.documentElement.style.setProperty("--tm-scrollbar", scrollbar + "px");
		document.documentElement.style.setProperty("--tm-scrollbar-half", (scrollbar / 2) + "px");
	}
	updateBleed();
	window.addEventListener("resize", updateBleed);
})();

/* Re-home the big live views into the step boxes. The engine renders first;
   this pass only moves already-rendered DOM, so math, tables and code keep
   their exact output. */
(function () {
	"use strict";
	var moved = {};
	function stepByNumber(n) {
		return Array.prototype.slice.call(document.querySelectorAll(".tm-step")).filter(function (card) {
			var h = card.querySelector("h3");
			return h && h.textContent.trim().indexOf(String(n)) === 0;
		})[0] || null;
	}
	function bodyOf(n) {
		var card = stepByNumber(n);
		return card ? card.querySelector(".tm-step-body") : null;
	}
	function detailBySummary(re) {
		return Array.prototype.slice.call(document.querySelectorAll(".tm-step-detail")).filter(function (d) {
			var s = d.querySelector("summary");
			return s && re.test(s.textContent);
		})[0] || null;
	}
	function typesetMathInOrg(root) {
		if (!root) return;
		if (window.TM && typeof TM.typesetMath === "function") { TM.typesetMath(root); return; }
		if (!window.temml || typeof temml.renderToString !== "function") return;
		root.querySelectorAll("[data-tex]:not(math)").forEach(function (el) {
			if (el.getAttribute("data-tex-rendered") === "1") return;
			var tex = el.getAttribute("data-tex");
			var display = el.getAttribute("data-tex-display") !== "false";
			try {
				el.innerHTML = temml.renderToString(tex, { displayMode: display });
				el.setAttribute("data-tex-rendered", "1");
			} catch (e) { el.textContent = tex; }
		});
	}

	function resizeCharts() {
		if (window.Plotly && Plotly.Plots) {
			document.querySelectorAll(".js-plotly-plot").forEach(function (el) { Plotly.Plots.resize(el); });
		}
		if (window.echarts) {
			document.querySelectorAll("[id$='-plot'], [id$='-space']").forEach(function (el) {
				var chart = echarts.getInstanceByDom(el);
				if (chart) chart.resize();
			});
		}
	}
	function moveLiveView(id, step, removeSelector) {
		var el = document.getElementById(id);
		var body = bodyOf(step);
		if (!el || !body) return false;
		if (el.parentNode !== body) {
			el.style.order = "3";
			el.style.width = "100%";
			el.style.maxWidth = "100%";
			body.appendChild(el);
		}
		if (removeSelector) {
			var old = body.querySelector(removeSelector);
			if (old) old.remove();
		}
		return true;
	}
	function organize() {
		// 1 · Tokenize: the coloured BPE view replaces the small canvas.
		if (!moved.tokenize) {
			if (moveLiveView("transformer-viz-bpe", 1, "#tm-step-tokenize")) {
				moved.tokenize = true;
				var tokDetail = detailBySummary(/Tokenizer in detail|Tokenizer im Detail/i);
				if (tokDetail && !document.getElementById("tm-prep-source")) tokDetail.remove();
			}
		}
		// 2 · Embed: the real embedding plot replaces the toy canvas.
		if (!moved.embed) {
			if (moveLiveView("transformer-plotly-space", 2, "#tm-step-embed")) {
				moved.embed = true;
				var embedModes = document.querySelector(".tm-step-body [data-step-modes='embed']");
				if (embedModes) embedModes.style.display = "none";
			}
		}
		// 3 · Position: the shift plot is the default view.
		if (!moved.position) {
			var shift = document.getElementById("transformer-pe-shift-plot");
			var embed = document.getElementById("transformer-plotly-space");
			var stepH = (typeof getTrajectoryPlotHeight === 'function' && typeof getTransformerConfig === 'function')
				? getTrajectoryPlotHeight(getTransformerConfig().d_model) : 850;
			if (embed) { embed.style.height = stepH + "px"; embed.style.minHeight = stepH + "px"; }
			if (shift) { shift.style.height = stepH + "px"; shift.style.minHeight = stepH + "px"; }
			if (moveLiveView("transformer-pe-shift-plot", 3, "#tm-step-position")) {
				moved.position = true;
				var posModes = document.querySelector(".tm-step-body [data-step-modes='position']");
				if (posModes) posModes.style.display = "none";
			}
		}
		// 4 · Attend: move the "Before 2017" background into a detail.
		if (!moved.before) {
			var before = document.getElementById("before");
			var attendBody = bodyOf(4);
			if (before && attendBody) {
				var bg = document.getElementById("tm-detail-attention-background");
				if (!bg) {
					bg = document.createElement("details");
					bg.className = "tm-step-detail";
					bg.id = "tm-detail-attention-background";
					bg.innerHTML = '<summary>' + (document.documentElement.lang === "de" ? "Warum Attention die Rekurrenz ersetzte" : "Why attention replaced recurrence") + '</summary><div class="tm-step-detail-body"></div>';
					attendBody.appendChild(bg);
				}
				var dest = bg.querySelector(".tm-step-detail-body");
				Array.prototype.slice.call(before.children).forEach(function (node) {
					if (node.classList && (node.classList.contains("prose") || node.classList.contains("pullquote") || node.classList.contains("aha"))) {
						dest.appendChild(node);
					}
				});
				before.remove();
				moved.before = true;
			}
		}
		// The code walkthrough and the output prose live in details inside the
		// residual / unembed step boxes. Move the already-rendered DOM so the
		// code tabs, tables and math keep their exact output.
		var codeBody = null;
		var residualBody = bodyOf(6);
		if (residualBody) {
			var codeDetail = document.getElementById("tm-detail-code");
			if (!codeDetail) {
				codeDetail = document.createElement("details");
				codeDetail.className = "tm-step-detail";
				codeDetail.id = "tm-detail-code";
				codeDetail.innerHTML = '<summary>' + (document.documentElement.lang === "de" ? "Das Modell im Code" : "The model in code") + '</summary><div class="tm-step-detail-body"></div>';
				residualBody.appendChild(codeDetail);
			}
			codeBody = codeDetail.querySelector(".tm-step-detail-body");
		}
		var codeAnchor = Array.prototype.slice.call(document.querySelectorAll(".md")).filter(function (m) {
			return m.textContent.indexOf("The Same, in Code") >= 0;
		})[0];
		var ffnContainer = document.getElementById("ffn-equations-container");
		if (codeAnchor && ffnContainer && codeBody && !codeBody.contains(codeAnchor)) {
			var node = codeAnchor;
			while (node && node !== ffnContainer) {
				var next = node.nextElementSibling;
				codeBody.appendChild(node);
				node = next;
			}
			codeBody.querySelectorAll('.md').forEach(function (m) { m.classList.add('no-markdown'); });
		}
		if (codeBody && !codeBody.textContent.trim() && codeBody.parentNode) {
			var emptyCode = codeBody.closest("#tm-detail-code");
			if (emptyCode) emptyCode.remove();
		}
		var attendDetail = detailBySummary(/Attention in detail|Attention im Detail/i);
		var ffnDetail = detailBySummary(/Feed-forward in detail|Feed-Forward im Detail/i);
		Array.prototype.slice.call(document.querySelectorAll(".optional")).forEach(function (opt) {
			var headline = (opt.getAttribute("data-headline") || "").toLowerCase();
			if (headline.indexOf("why the diagonal") >= 0 && attendDetail) {
				attendDetail.querySelector(".tm-step-detail-body").appendChild(opt);
			} else if (headline.indexOf("mixture of experts") >= 0 && ffnDetail) {
				ffnDetail.querySelector(".tm-step-detail-body").appendChild(opt);
			}
		});
		var outStart = document.getElementById("step-output");
		var tempInput2 = document.getElementById("transformer-temperature");
		var outStop = tempInput2 ? tempInput2.closest("div") : null;
		var unDetail = detailBySummary(/From vectors to words|Von Vektoren zu Wörtern/i);
		if (outStart && outStop && unDetail && !unDetail.contains(outStart)) {
			var unBody = unDetail.querySelector(".tm-step-detail-body");
			var node2 = outStart;
			while (node2 && node2 !== outStop) {
				var next2 = node2.nextElementSibling;
				unBody.appendChild(node2);
				node2 = next2;
			}
			unBody.querySelectorAll('.md').forEach(function (m) { m.classList.add('no-markdown'); });
		}
		// 4 · Transformer: one box after Position, with the token trajectory at
		// the top, then the overview steps, then the stacked layer cards.
		if (!moved.transformer) {
			var posCard = stepByNumber(3);
			if (posCard) {
				var isDe = !!(window.TM && window.TM.lang && window.TM.lang() === "de");
				var attendCard = stepByNumber(4);
				var ffnCard = stepByNumber(5);
				var residualCard = stepByNumber(6);
				var box = document.getElementById("tm-transformer-box");
				if (!box) {
					box = document.createElement("section");
					box.className = "tm-step tm-transformer-box";
					box.id = "tm-transformer-box";
					box.innerHTML = '<div class="tm-step-head"><h3>4 · Transformer</h3><button class="tm-step-toggle" type="button" aria-expanded="true" aria-label="' + (isDe ? "Schritt einklappen" : "Collapse step") + '">−</button></div><p>' + (isDe ? "Ein Transformer-Block schreibt den laufenden Vektor in zwei Schritten um. Zuerst mischt Attention Information aus den anderen Tokens in jede Position; danach transformiert das FFN jede Position für sich. Beide Ergebnisse werden zum Vektor addiert, nichts wird überschrieben. Der Plot verfolgt den Vektor jedes Tokens durch die Schichten; die Schichtkarten unten öffnen dieselben Schritte mit den vollständigen Formeln." : "A transformer block makes two edits to the running vector. Attention first mixes information from the other tokens into each position; the FFN then transforms each position on its own. Both edits are added back to the vector, so nothing is overwritten. The plot follows each token's vector through the layers; the layer cards below open the same steps with their full formulas.") + '</p><div class="tm-step-body" id="tm-transformer-body"></div>';
				var formulaStrip = document.createElement("div");
				formulaStrip.className = "tm-transformer-formulas";
				formulaStrip.innerHTML =
					"<div data-tex='Q=\\operatorname{Norm}(h_{\\text{in}})W^Q,\\quad K=\\operatorname{Norm}(h_{\\text{in}})W^K,\\quad V=\\operatorname{Norm}(h_{\\text{in}})W^V' title='" + (isDe ? "Q ist, wonach ein Token sucht; K ist, was ein Token anbietet; V ist der Inhalt, der weitergegeben wird. Norm hält die Zahlen stabil, und W sind gelernte Projektionsmatrizen." : "Q is what a token looks for; K is what each token offers; V is the content that travels. Norm keeps the numbers stable, and W are learned projection matrices.") + "'></div>" +
					"<div data-tex='\\text{head}_i=\\operatorname{softmax}\\!\\left(\\frac{Q_iK_i^\\top}{\\sqrt{d_k}}\\right)V_i' title='" + (isDe ? "Ein Attention-Head vergleicht jede Query mit allen Keys, macht aus den Scores mit Softmax Gewichte und mischt die Values. d_k ist die Kopfbreite, damit die Scores nicht explodieren." : "One attention head compares each query with all keys, turns the scores into weights with softmax, and mixes the values. d_k is the head width, so the scores do not explode.") + "'></div>" +
					"<div data-tex='h_{\\text{attn}}=h_{\\text{in}}+\\operatorname{Concat}(\\text{head}_1,\\dots,\\text{head}_h)\\,W^O' title='" + (isDe ? "Der gemischte Kontext wird zur Eingabe addiert: Das Token behält seinen alten Vektor und bekommt das Attention-Update obendrauf. Concat verbindet die Heads; W^O mischt sie." : "The mixed context is added back to the input: the token keeps its old vector and gets the attention update on top. Concat joins the heads; W^O mixes them.") + "'></div>" +
					"<div data-tex='h_{\\text{out}}=h_{\\text{attn}}+\\operatorname{FFN}(\\operatorname{Norm}(h_{\\text{attn}}))' title='" + (isDe ? "Auch das FFN-Update wird addiert. Das Ergebnis ist der nächste laufende Vektor; nichts wird überschrieben." : "The FFN update is added back too. The result is the next running vector; nothing is overwritten.") + "'></div>" +
					"<div data-tex='\\operatorname{FFN}(x)=W_2\\,\\operatorname{GELU}(W_1x+b_1)+b_2' title='" + (isDe ? "Das Feed-Forward-Netz erweitert den Vektor, wendet GELU an und komprimiert ihn wieder. Es arbeitet mit einem Token auf einmal." : "The feed-forward network expands the vector, applies GELU, and compresses it back. It works on one token at a time.") + "'></div>";
				box.querySelector(".tm-step-body").appendChild(formulaStrip);
				typesetMathInOrg(formulaStrip);
				var vizSwitch = document.createElement("div");
				vizSwitch.className = "tm-viz-switch";
				vizSwitch.innerHTML = "<label>" + (isDe ? "Layer-Panels zeigen" : "Layer panels show") + " <select id='tm-viz-mode' title='" + (isDe ? "Gleiche Gewichte, andere Daten: Das ändert nur, welche Tokenfolge die Layer-Panels zeigen; das Modell wird nicht neu trainiert." : "Same weights, different data: this only changes which token sequence the layer panels show; the model is not retrained.") + "'><option value='train'>" + (isDe ? "Trainings-Tokens" : "Training tokens") + "</option><option value='inference'>" + (isDe ? "Prompt-Tokens" : "Prompt tokens") + "</option></select></label><span class='tm-viz-switch-note'>" + (isDe ? "Gleiche Gewichte, andere Daten: Das ändert nur, welche Tokenfolge die Layer-Panels zeigen; das Modell wird nicht neu trainiert." : "Same weights, different data: this only changes which token sequence the layer panels show; the model is not retrained.") + "</span>";
				box.querySelector(".tm-step-body").appendChild(vizSwitch);
				var vizSelect = vizSwitch.querySelector("select");
				vizSelect.value = window.tlabVisualizationMode || "train";
				vizSelect.addEventListener("change", function () {
					window.tlabVisualizationMode = vizSelect.value;
					if (typeof window.run_transformer_demo === "function") window.run_transformer_demo();
				});
					posCard.parentNode.insertBefore(box, posCard.nextSibling);
					var toggle = box.querySelector(".tm-step-toggle");
					toggle.addEventListener("click", function () {
						var b = box.querySelector(".tm-step-body");
						var open = b.hidden;
						b.hidden = !open;
						toggle.textContent = open ? "−" : "+";
						toggle.setAttribute("aria-expanded", String(open));
						toggle.setAttribute("aria-label", open ? (isDe ? "Schritt einklappen" : "Collapse step") : (isDe ? "Schritt ausklappen" : "Expand step"));
						box.classList.toggle("is-collapsed", !open);
						if (open) setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 60);
					});
				}
				var boxBody = box.querySelector(".tm-step-body");
				// Attention and FFN are shown inside the layers. Keep the
				// residual overview and move the background notes into a
				// compact context block instead of a top-level overview card.
				[[residualCard, isDe ? "Residual-Stream-Überblick" : "Residual stream overview"]].forEach(function (pair) {
					var card = pair[0];
					if (!card || !boxBody) return;
					card.classList.add("tm-residual-overview");
					var h = card.querySelector("h3");
					if (h) h.textContent = pair[1];
					var b = card.querySelector(".tm-step-body");
					if (b) b.hidden = true;
					card.classList.add("is-collapsed");
					var btn = card.querySelector(".tm-step-toggle");
					if (btn) {
						btn.textContent = "+";
						btn.setAttribute("aria-expanded", "false");
						btn.setAttribute("aria-label", isDe ? "Schritt ausklappen" : "Expand step");
					}
					boxBody.appendChild(card);
				});
				var context = document.createElement("details");
				context.className = "tm-step-detail tm-transformer-context";
				context.innerHTML = "<summary>" + (isDe ? "Hintergrund: Warum Attention die Rekurrenz ersetzte" : "Background: why attention replaced recurrence") + "</summary><div class='tm-step-detail-body'></div>";
				var contextBody = context.querySelector(".tm-step-detail-body");
				[attendCard, ffnCard].forEach(function (card) {
					if (!card) return;
					var background = card.querySelector("#tm-detail-attention-background");
					if (background) {
						var backgroundBody = background.querySelector(".tm-step-detail-body");
						if (backgroundBody) {
							while (backgroundBody.firstChild) contextBody.appendChild(backgroundBody.firstChild);
						}
					}
					card.querySelectorAll(".optional").forEach(function (el) { contextBody.appendChild(el); });
					card.remove();
				});
				boxBody.appendChild(context);
				if (document.getElementById("step-attention")) {
					var attnProse = document.createElement("details");
					attnProse.className = "tm-step-detail tm-attention-prose";
					attnProse.innerHTML = "<summary>" + (isDe ? "Attention: Wie Tokens miteinander reden" : "Attention: Letting Tokens Talk") + "</summary><div class='tm-step-detail-body'></div>";
					boxBody.appendChild(attnProse);
				}
				// The old #block section keeps its prose, but the observer should
				// now fire on the Transformer box at the top.
				var oldBlock = document.getElementById("block");
				if (oldBlock && oldBlock !== box) oldBlock.id = "block-source";
				box.id = "block";
				// Renumber the final step now that the overview cards left the grid.
				var un = stepByNumber(7);
				if (un) {
					var uh = un.querySelector("h3");
					if (uh && uh.textContent.trim().indexOf("7") === 0) uh.textContent = "5 · Unembedding";
				}
				moved.transformer = true;
			}
		}
		var boxNow = document.querySelector(".tm-transformer-box");
		if (boxNow) {
			var boxNowBody = boxNow.querySelector(".tm-step-body");
			var layerContainer = document.getElementById("ffn-equations-container");
			if (layerContainer && boxNowBody && layerContainer.parentNode !== boxNowBody) boxNowBody.appendChild(layerContainer);
			var contextBlock = boxNowBody ? boxNowBody.querySelector(".tm-transformer-context") : null;
			if (contextBlock && boxNowBody.lastElementChild !== contextBlock) boxNowBody.appendChild(contextBlock);
			var attnProse = boxNowBody ? boxNowBody.querySelector(".tm-attention-prose") : null;
			if (attnProse && !moved.attentionProse) {
				var attnStart = document.getElementById("step-attention");
				var attnEnd = Array.prototype.slice.call(document.querySelectorAll(".optional")).filter(function (el) {
					return /Gradient Clipping/i.test(el.getAttribute("data-headline") || "");
				})[0];
				if (attnStart && attnEnd) {
					var attnBody = attnProse.querySelector(".tm-step-detail-body");
					var node3 = attnStart;
					while (node3 && node3 !== attnEnd) {
						var next3 = node3.nextElementSibling;
						attnBody.appendChild(node3);
						node3 = next3;
					}
					attnBody.querySelectorAll(".md").forEach(function (m) { m.classList.add("no-markdown"); });
					var h2 = attnBody.querySelector("#step-attention h2");
					if (h2) h2.remove();
					moved.attentionProse = true;
				}
			}
			if (attnProse && layerContainer && attnProse.parentNode === boxNowBody && attnProse.nextElementSibling !== layerContainer) {
				boxNowBody.insertBefore(attnProse, layerContainer);
			}
			// The three mechanism cards belong before the step boxes, not after them.
			var stepHost = document.getElementById("transformer-step-visuals");
			var formulaGrid = document.querySelector(".formula-grid");
			if (stepHost && formulaGrid && formulaGrid.nextElementSibling !== stepHost) {
				stepHost.parentNode.insertBefore(formulaGrid, stepHost);
				if (window.TM && typeof TM.typesetMath === "function") TM.typesetMath(formulaGrid);
			}
			// Move the layer-lens and pipeline prose into the Transformer box,
			// where the layers begin. Remove the now-redundant top sections.
			if (!moved.layerlens) {
				var layerlens = document.getElementById("layerlens");
				var layerProse = layerlens ? layerlens.querySelector(".prose") : null;
				if (layerProse && boxNowBody) {
					var lensDetail = document.createElement("details");
					lensDetail.className = "tm-step-detail tm-layerlens-prose";
					lensDetail.innerHTML = "<summary>" + (isDe ? "Ein Wort ändert mit der Tiefe seine Bedeutung" : "A word changes its meaning with depth") + "</summary><div class='tm-step-detail-body'></div>";
					lensDetail.querySelector(".tm-step-detail-body").appendChild(layerProse);
					boxNowBody.insertBefore(lensDetail, layerContainer || null);
					layerlens.remove();
					moved.layerlens = true;
				}
			}
			if (!moved.pipeline) {
				var pipeline = document.getElementById("pipeline");
				var pipelineProse = pipeline ? pipeline.querySelector(".prose") : null;
				if (pipelineProse && boxNowBody) {
					var pipeDetail = document.createElement("details");
					pipeDetail.className = "tm-step-detail tm-pipeline-prose";
					pipeDetail.innerHTML = "<summary>" + (isDe ? "Vom Text zur Verteilung" : "From text to a distribution") + "</summary><div class='tm-step-detail-body'></div>";
					var pipeBody = pipeDetail.querySelector(".tm-step-detail-body");
					pipeBody.appendChild(pipelineProse);
					var pipelineAha = pipeline.querySelector(".aha");
					if (pipelineAha) pipeBody.appendChild(pipelineAha);
					boxNowBody.insertBefore(pipeDetail, layerContainer || null);
					pipeline.remove();
					moved.pipeline = true;
				}
			}
			// The logits/softmax/stop-token prose belongs in the Unembed detail.
			if (!moved.outputProse) {
				var outputSection = document.getElementById("output");
				var unembedDetail = detailBySummary(/From vectors to words|Von Vektoren zu Wörtern/i);
				if (outputSection && unembedDetail) {
					var outputDetail = document.createElement("details");
					outputDetail.className = "tm-step-detail tm-output-words-prose";
					outputDetail.innerHTML = "<summary>" + (isDe ? "Logits, Softmax und das Stop-Token" : "Logits, softmax, and the stop token") + "</summary><div class='tm-step-detail-body'></div>";
					var outputBody = outputDetail.querySelector(".tm-step-detail-body");
					Array.prototype.slice.call(outputSection.querySelectorAll(":scope > .prose, :scope > .aha, :scope > .formula, :scope > .myth-grid, :scope > .optional")).forEach(function (el) {
						outputBody.appendChild(el);
					});
					unembedDetail.querySelector(".tm-step-detail-body").appendChild(outputDetail);
					outputSection.style.display = "none";
					moved.outputProse = true;
				}
			}
			// Token Trajectory is the opening picture of the block.
			var traj = document.getElementById("transformer-trajectory-full-path-wrapper") || document.getElementById("transformer-trajectory-full-path");
			if (traj && boxNowBody && traj.parentNode !== boxNowBody) {
				var formulaStripNow = boxNowBody.querySelector(".tm-transformer-formulas");
				boxNowBody.insertBefore(traj, formulaStripNow ? formulaStripNow.nextSibling : boxNowBody.firstChild);
				traj.style.width = "100%";
			}
		}
		// 7 · Unembed: the real output projection belongs in the expanded box.
		// The duplicate token builder and temperature block stay hidden; the
		// Unembed box already owns both controls.
		var tokenBuilder = document.getElementById("transformer-token-builder");
		if (tokenBuilder) tokenBuilder.style.display = "none";
		var tempInput = document.getElementById("transformer-temperature");
		if (tempInput) {
			var tempBlock = document.getElementById("transformer-temperature-block") || tempInput.closest("div");
			if (tempBlock) tempBlock.style.display = "none";
		}
		var out = document.getElementById("transformer-output-projection");
		var un = detailBySummary(/From vectors to words|Von Vektoren zu Wörtern/i);
		if (out && un) {
			var ub = un.querySelector(".tm-step-detail-body");
			if (ub && out.parentNode !== ub) ub.appendChild(out);
			if (!un._tmResizeWired) {
				un._tmResizeWired = true;
				un.addEventListener("toggle", function () { if (un.open) setTimeout(resizeCharts, 80); });
			}
		}
		resizeCharts();
	}

	function schedule() {
		var tries = 0;
		var timer = setInterval(function () {
			tries++;
			organize();
			if (tries > 20) clearInterval(timer);
		}, 500);
		organize();
	}
	window.addEventListener("load", schedule);
	window.addEventListener("tm:transformer-data", function () { setTimeout(organize, 250); });
	if (document.readyState === "complete") schedule();
})();
