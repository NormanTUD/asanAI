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

	function typesetMathIn(root) {
		if (!root) return;
		if (window.TM && typeof TM.typesetMath === "function") {
			TM.typesetMath(root);
			return;
		}
		if (!window.temml || typeof temml.renderToString !== "function") return;
		root.querySelectorAll("[data-tex]").forEach(function (el) {
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
			if (!rect.width) return;
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

	function pca3(vectors) {
		if (!vectors.length) return [];
		var d = vectors[0].length;
		if (d <= 3) {
			return vectors.map(function (v) { return [v[0] || 0, v[1] || 0, v[2] || 0]; });
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
		var a = sign(p1.v), b = sign(p2.v), c = sign(p3.v);
		return centered.map(function (v) {
			return [
				v.reduce(function (sum, x, i) { return sum + x * a[i]; }, 0),
				v.reduce(function (sum, x, i) { return sum + x * b[i]; }, 0),
				v.reduce(function (sum, x, i) { return sum + x * c[i]; }, 0)
			];
		});
	}

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
			var col = i / Math.max(1, tokens.length - 1);
			var fill = mix(hex(c.blue), hex(c.lilac), col);
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
				var col = mix(hex(c.blue), hex(c.lilac), i / Math.max(1, tokens.length - 1));
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
			var angle = pos / Math.pow(10000, (2 * i) / d);
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
			var col = mix(hex(c.blue), hex(c.lilac), t / Math.max(1, tokens.length - 1));
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

	function drawFFNHeatmap(ctx, w, h, layerIdx) {
		var c = palette();
		var ffn = (window.__tmFFNTrace || [])[layerIdx];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!ffn || !ffn.out_L1 || !tokens.length) {
			return drawPlaceholder(ctx, w, h, DE() ? "Öffne eine Schicht, um die FFN-Aktivierungen zu sehen." : "Open a layer to see the FFN activations.");
		}
		var rows = Math.min(tokens.length, ffn.out_L1.length);
		var cols = Math.min((ffn.out_L1[0] || []).length, 64);
		if (!rows || !cols) return drawPlaceholder(ctx, w, h, DE() ? "Keine FFN-Aktivierungen." : "No FFN activations.");
		var min = Infinity, max = -Infinity;
		for (var i = 0; i < rows; i++) {
			for (var j = 0; j < cols; j++) {
				var v = ffn.out_L1[i][j] || 0;
				min = Math.min(min, v); max = Math.max(max, v);
			}
		}
		var span = max - min || 1;
		var padL = 74, padT = 26, padB = 24, padR = 14;
		var cw = (w - padL - padR) / cols;
		var ch = (h - padT - padB) / rows;
		var neg = hex(c.blue), zero = hex(c.paper), pos = hex(c.gold);
		for (var r = 0; r < rows; r++) {
			for (var k = 0; k < cols; k++) {
				var t = ((ffn.out_L1[r][k] || 0) - min) / span;
				var col = t < 0.5 ? mix(neg, zero, t * 2) : mix(zero, pos, (t - 0.5) * 2);
				ctx.fillStyle = rgb(col);
				ctx.fillRect(padL + k * cw, padT + r * ch, Math.ceil(cw) + 0.5, Math.ceil(ch) + 0.5);
			}
			ctx.fillStyle = c.ink;
			ctx.font = "600 8px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			ctx.fillText(fitText(ctx, display(tokens[r]), 66), padL - 5, padT + r * ch + ch / 2);
		}
		ctx.textBaseline = "alphabetic";
		ctx.textAlign = "left";
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.fillText((DE() ? "FFN-Hidden-Aktivierungen (GELU) · alle Tokens · Layer " : "FFN hidden activations (GELU) · all tokens · layer ") + (layerIdx + 1), padL, 15);
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
		var maxLogit = Math.max.apply(null, logits.map(function (x) { return x.logit / temperature; }));
		var exps = logits.map(function (x) { return Math.exp(x.logit / temperature - maxLogit); });
		var sum = exps.reduce(function (a, b) { return a + b; }, 0) || 1;
		var scores = logits.map(function (x, i) {
			return { word: x.word, score: x.logit, prob: exps[i] / sum };
		}).sort(function (a, b) { return b.prob - a.prob; }).slice(0, topk);
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
			var col = mix(hex(c.blue), hex(c.lilac), t / Math.max(1, n - 1));
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
			var pPad = 16, pLeft = 90, pTop = 18, pBottom = 32;
			var pCell = (w - pLeft - pPad) / Math.max(1, n);
			var pMax = 0.0001;
			tokens.forEach(function (_, i) { pMax = Math.max(pMax, norm(trace.h_in[i] || [])); });
			var pScale = (h - pTop - pBottom) / pMax;
			var pBase = h - pBottom;
			tokens.forEach(function (token, i) {
				var v = norm(trace.h_in[i] || []);
				var x = pLeft + i * pCell + pCell * 0.2;
				var bw = Math.max(1, pCell * 0.55);
				ctx.fillStyle = c.lime;
				ctx.fillRect(x, pBase - v * pScale, bw, v * pScale);
				if (n <= 18 || i % Math.ceil(n / 18) === 0) {
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
				if (n <= 18 || i % Math.ceil(n / 18) === 0) {
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

			if (n <= 18 || i % Math.ceil(n / 18) === 0) {
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
		} else {
			source = which === "in" ? trace.h_in : trace.h_out;
		}
		var minAll = Infinity, maxAll = -Infinity;
		if (which === "delta") {
			source.forEach(function (row) { row.forEach(function (v) { minAll = Math.min(minAll, v); maxAll = Math.max(maxAll, v); }); });
		} else {
			tokens.forEach(function (_, i) {
				(trace.h_in[i] || []).forEach(function (v) { minAll = Math.min(minAll, v); maxAll = Math.max(maxAll, v); });
				(trace.h_out[i] || []).forEach(function (v) { minAll = Math.min(minAll, v); maxAll = Math.max(maxAll, v); });
			});
		}
		if (!isFinite(minAll) || !isFinite(maxAll)) { minAll = -1; maxAll = 1; }
		ctx.canvas._tmResidualRange = { min: minAll, max: maxAll };
		var left = 74, top = 24, right = 10, bottom = 8;
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
			ctx.fillStyle = c.ink;
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
	});

	var featureState = {};

	function featureData(layerIdx) {
		var trace = (window.__tmLayerTrace || [])[layerIdx];
		if (!trace || !trace.h_in || !trace.h_out) return null;
		var tokens = trace.tokenStrings || tokenList();
		var n = Math.min(tokens.length, trace.h_in.length, trace.h_out.length);
		if (!n) return null;
		if (!featureState[layerIdx]) featureState[layerIdx] = { selected: n - 1, allDims: false };
		if (featureState[layerIdx].selected >= n) featureState[layerIdx].selected = n - 1;
		return { trace: trace, tokens: tokens.slice(0, n), n: n, selected: featureState[layerIdx].selected, allDims: !!featureState[layerIdx].allDims };
	}

	function featureProjection(data) {
		var d = data.trace.h_in[0].length;
		var all = data.trace.h_in.slice(0, data.n).concat(data.trace.h_out.slice(0, data.n));
		var coords;
		if (d > 3) {
			coords = pca3(all);
			return {
				in: coords.slice(0, data.n),
				out: coords.slice(data.n),
				is3d: true,
				axes: ["PC 1 (PCA)", "PC 2 (PCA)", "PC 3 (PCA)"],
				label: "PCA: d=" + d + " → 3D"
			};
		}
		if (d === 3) {
			coords = all.map(function (v) { return [v[0] || 0, v[1] || 0, v[2] || 0]; });
			return {
				in: coords.slice(0, data.n),
				out: coords.slice(data.n),
				is3d: true,
				axes: ["Dim 0", "Dim 1", "Dim 2"],
				label: ""
			};
		}
		if (d === 2) {
			coords = all.map(function (v) { return [v[0] || 0, v[1] || 0]; });
			return {
				in: coords.slice(0, data.n),
				out: coords.slice(data.n),
				is3d: false,
				axes: ["Dim 0", "Dim 1"],
				label: ""
			};
		}
		coords = all.map(function (v) { return [v[0] || 0, 0]; });
		return {
			in: coords.slice(0, data.n),
			out: coords.slice(data.n),
			is3d: false,
			axes: ["Dim 0", ""],
			label: ""
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
					boxWidth: 100, boxDepth: 100, boxHeight: 75,
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

	function renderFeatureArrows(el, layerIdx, data, projection) {
		if (!el || !window.echarts || !projection || !projection.in.length) return;
		var c = palette();
		var chart = echarts.getInstanceByDom(el) || echarts.init(el);
		var labels = data.tokens.map(function (t) { return display(t); });
		var series = [];
		for (var i = 0; i < data.n; i++) {
			var sel = i === data.selected;
			var col = sel ? c.gold : rgb(mix(hex(c.blue), hex(c.lilac), i / Math.max(1, data.n - 1)));
			if (projection.is3d) {
				var from = projection.in[i], to = projection.out[i];
				series.push({
					name: labels[i],
					type: "line3D",
					data: [from, to],
					lineStyle: { width: sel ? 5 : 2.4, color: col, opacity: sel ? 1 : 0.72 }
				});
				if (typeof _add3DArrowheadSeries === "function") {
					_add3DArrowheadSeries(series, from, to, col, { lineWidth: sel ? 6 : 4, maxHeadLen: 0.45, spreadRatio: 0.35, name: labels[i] });
				}
				series.push({
					name: labels[i],
					type: "scatter3D",
					data: [{ value: from, itemStyle: { color: col }, _tmPoint: "in" }],
					symbolSize: sel ? 9 : 5,
					label: { show: sel, formatter: labels[i], color: c.ink, fontSize: 10, fontWeight: 700 }
				});
			} else {
				var a = projection.in[i], b = projection.out[i];
				series.push({
					name: labels[i],
					type: "line",
					data: [[a[0], a[1]], [b[0], b[1]]],
					symbol: ["circle", "arrow"],
					symbolSize: sel ? 9 : 5,
					lineStyle: { width: sel ? 4 : 2, color: col, opacity: sel ? 1 : 0.72 },
					itemStyle: { color: col },
					label: { show: sel, formatter: labels[i], position: "end", color: c.ink, fontSize: 10, fontWeight: 700 }
				});
			}
		}
		var option = {
			backgroundColor: "transparent",
			title: {
				text: (DE() ? "Feature-Migration · Schicht " : "Feature migration · layer ") + (layerIdx + 1),
				subtext: (projection.label ? projection.label + " · " : "") + (DE() ? "alle Tokens, Pfeil = Eingabe → Ausgabe" : "all tokens, arrow = input → output"),
				left: "center",
				textStyle: { fontSize: 13, color: c.ink, fontFamily: "Barlow, Open Sans, sans-serif" },
				subtextStyle: { fontSize: 10, color: c.muted, fontFamily: "Open Sans, sans-serif" }
			},
			tooltip: { trigger: "item", confine: true },
			series: series,
			animation: false
		};
		if (projection.is3d) {
			option.xAxis3D = { type: "value", name: projection.axes[0], nameTextStyle: { color: c.muted }, axisLabel: { color: c.muted } };
			option.yAxis3D = { type: "value", name: projection.axes[1], nameTextStyle: { color: c.muted }, axisLabel: { color: c.muted } };
			option.zAxis3D = { type: "value", name: projection.axes[2], nameTextStyle: { color: c.muted }, axisLabel: { color: c.muted } };
			option.grid3D = {
				boxWidth: 100, boxDepth: 100, boxHeight: 75,
				viewControl: { alpha: 22, beta: 35, distance: 190 },
				axisLine: { lineStyle: { color: c.line } },
				splitLine: { lineStyle: { color: c.line } }
			};
		} else {
			option.grid = { top: 62, bottom: 38, left: 48, right: 24 };
			option.xAxis = { type: "value", name: projection.axes[0], nameTextStyle: { color: c.muted }, axisLabel: { color: c.muted }, splitLine: { lineStyle: { color: c.line } } };
			option.yAxis = { type: "value", name: projection.axes[1], nameTextStyle: { color: c.muted }, axisLabel: { color: c.muted }, splitLine: { lineStyle: { color: c.line } } };
		}
		chart.setOption(option, true);
		chart.resize();
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

	function renderLayerFeaturePlots(layerIdx) {
		var data = featureData(layerIdx);
		var prefix = "unified-layer-" + layerIdx;
		var arrowsEl = document.getElementById(prefix + "-feature-arrows");
		var note = document.getElementById(prefix + "-feature-projection");
		if (!data || !arrowsEl) return;
		var proj = featureProjection(data);
		if (note) {
			note.textContent = proj.label || "";
			note.style.display = proj.label ? "block" : "none";
		}
		renderFeatureArrows(arrowsEl, layerIdx, data, proj);
	}

	function featureTopWords(vec, count) {
		var space = window.persistentEmbeddingSpace || {};
		var words = Object.keys(space);
		if (!words.length || !vec) return [];
		var temperature = 1;
		if (typeof getTransformerConfig === "function") {
			try { temperature = Math.max(0.05, getTransformerConfig().temperature || 1); } catch (e) { temperature = 1; }
		}
		var scores = words.map(function (word) {
			var row = space[word] || [];
			var dot = 0;
			for (var i = 0; i < vec.length; i++) dot += (vec[i] || 0) * (row[i] || 0);
			return { word: word, score: dot / temperature };
		});
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
		var pct = Math.max(0, Math.min(100, Math.round((item.prob || 0) * 100)));
		return '<span class="tm-logit-chip" style="--tm-logit-color:' + color + '"><span class="tm-logit-word">' + featureEsc(display(item.word)) + '</span><span class="tm-logit-pct">' + pct + '%</span><i style="width:' + pct + '%"></i></span>';
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
		var head = "<div class='tm-logit-head'><span>" + (DE() ? "Token" : "token") + "</span><span>" + (DE() ? "vorher" : "before") + "</span><span>" + (DE() ? "nachher" : "after") + "</span></div>";
		var rows = labels.map(function (label, i) {
			var before = featureTopWords(trace.h_in[i], 3);
			var after = featureTopWords(trace.h_out[i], 3);
			return "<div class='tm-logit-row'><span class='tm-logit-token'>" + label + "</span><div class='tm-logit-side'>" + before.map(function (w) { return logitChip(w, "var(--tm-blue)"); }).join("") + "</div><span class='tm-logit-arrow'>→</span><div class='tm-logit-side'>" + after.map(function (w) { return logitChip(w, "var(--tm-green)"); }).join("") + "</div></div>";
		}).join("");
		var texRows = trace.h_out.map(function (row) {
			return row.map(function (v) { return (Number(v) || 0).toFixed(2); }).join(" & ");
		}).join(" \\\\ ");
		var hafterTex = "h_{\\text{after}} = \\begin{pmatrix} " + texRows + " \\end{pmatrix}";
		var title = DE() ? "Logit-Linse · Schicht " + (layerIdx + 1) : "Logit lens · layer " + (layerIdx + 1);
		var note = DE()
			? "Die Logit-Linse projiziert den Vektor nach dieser Schicht auf das Vokabular und vergleicht die Winkel. Sie zeigt, welches Wort das Modell erzeugen würde, wenn es hier aufhören würde; über die Schichten hinweg siehst du, wie sich die Repräsentation bewegt und ihre Meinung ein wenig ändert."
			: "The logit lens projects the vector after this layer onto the vocabulary and compares the angles. It shows which word the model would produce if it stopped here; across layers you can watch the representation move and change its guess, at least a little.";
		host.innerHTML = "<details class='tm-logit-collapse'><summary>" + title + "</summary><div class='tm-logit-wrap'>" +
			"<details class='tm-layer-hafter'><summary>" + (DE() ? "h_after · Hidden State nach Schicht " : "h_after · hidden state after layer ") + (layerIdx + 1) + "</summary><div class='tm-hafter-scroll'><div class='tm-hafter-math' data-tex='" + hafterTex + "' data-tex-display='true'></div></div></details>" +
			"<p class='tm-logit-note'>" + note + "</p><div class='tm-logit-lens'>" + head + rows + "</div></div></details>";
		typesetMathIn(host);
	}

	function renderLayerTripleResiduals(layerIdx) {
		var prefix = "unified-layer-" + layerIdx;
		var trace = (window.__tmLayerTrace || [])[layerIdx];
		var inEl = document.getElementById(prefix + "-residual-in");
		var deltaEl = document.getElementById(prefix + "-residual-delta");
		var outEl = document.getElementById(prefix + "-residual-out");
		var triple = inEl ? inEl.closest(".tm-residual-triple") : null;
		if (!trace || !inEl || !deltaEl || !outEl) return;
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
					var left = 74, top = 24, right = 10, bottom = 8;
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
		Array.prototype.slice.call(document.querySelectorAll(".tm-layer-card")).forEach(function (card) {
			if (card.getAttribute("data-tm-enhanced") === "1") return;
			var idx = parseInt(card.getAttribute("data-layer-idx"), 10);
			if (isNaN(idx)) return;
			var body = card.querySelector(".tm-layer-body");
			if (!body) return;
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
					preWrap.innerHTML = "<div class='tm-signal-between-label'>" + (isDe ? "Residual-Stream vor Schicht 1" : "Residual stream before layer 1") + "</div><canvas id='tm-pre-layer-signal' class='layer-signal-canvas' data-layer-idx='0' data-signal-mode='pre'></canvas>";
					layerStack.insertBefore(preWrap, firstCard);
				}
			}
			if (firstSignal && firstSignal.parentNode && !firstSignal.closest(".tm-layer-signal-between")) {
				var sigWrap = document.createElement("div");
				sigWrap.className = "tm-layer-signal-between tm-layer-signal-after";
				sigWrap.innerHTML = "<div class='tm-signal-between-label'>" + (isDe ? "Residual-Stream nach Schicht " : "Residual stream after layer ") + (idx + 1) + "</div>";
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
				? "Diese Schicht liest den laufenden Vektor und schreibt ein Update. Die drei Heatmaps zeigen Eingang, die relative Änderung und Ausgang; darunter stehen die echten Min/Max-Werte."
				: "This layer reads the running vector and writes an update. The three heatmaps show input, the relative change, and output; the real min/max values are shown below.";
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
				wrap.innerHTML = "<div class='tm-feature-primary'><span class='tm-feature-note' id='unified-layer-" + idx + "-feature-projection'></span><div id='unified-layer-" + idx + "-feature-arrows' class='tm-feature-arrows'></div></div>" +
					"<div id='unified-layer-" + idx + "-logit-lens' class='tm-logit-lens-host'></div>";
				sb.insertBefore(wrap, oldDetail || null);
			}
			var featureWrap = sb.querySelector(".tm-feature-wrap");
			if (triple && featureWrap && triple.parentNode !== featureWrap) {
				featureWrap.insertBefore(triple, featureWrap.querySelector(".tm-logit-lens-host"));
			}
			var attentionBody = card.querySelector('.tm-layer-subbox[data-sub="attention"] .tm-layer-subbox-body');
			var formulaBody = card.querySelector('[id$="-formula-body"]');
			if (attentionBody && formulaBody) {
				["layernorm-viz", "concat-viz", "h1-final-viz"].forEach(function (kind) {
					var viz = document.getElementById(prefix + "-" + kind);
					var step = viz ? viz.closest(".tm-formula-step") : null;
					if (step && step.parentNode !== attentionBody) attentionBody.appendChild(step);
				});
			}
			var attentionLead = card.querySelector('.tm-layer-subbox[data-sub="attention"] .tm-level-text');
			if (attentionLead) {
				attentionLead.textContent = isDe
					? "Attention verteilt Aufmerksamkeit anhand des Kontexts: Sie mischt die Tokens je nachdem, in welchem Kontext sie stehen. Die Query fragt, was ein Token sucht; der Key sagt, was ein anderes anbietet; der Value ist der Inhalt, der bei einem guten Match weitergegeben wird."
					: "Attention distributes attention based on context: it mixes the tokens depending on the context they are in. The query asks what a token looks for; the key says what another offers; the value is the content that travels on a good match.";
			}
			var ffnLead = card.querySelector('.tm-layer-subbox[data-sub="ffn"] .tm-level-text');
			if (ffnLead) {
				ffnLead.textContent = isDe
					? "Das FFN verschiebt den Punkt danach im Raum mit der Information aus dem bisherigen Kontext. Es expandiert auf d_ff, wendet GELU an und komprimiert wieder zurück."
					: "The FFN then shifts the point in space with the information from the previous context. It expands to d_ff, applies GELU, and compresses back.";
			}
			if (!sub._tmFeatureBound) {
				sub._tmFeatureBound = true;
				sub.addEventListener("toggle", function () {
					if (!sub.open) return;
					setTimeout(function () {
						renderLayerTripleResiduals(idx);
						renderLayerFeaturePlots(idx);
						renderLayerLogitLens(idx);
					}, 60);
				});
			}
			if (preview && sub.parentNode !== preview) {
				preview.appendChild(sub);
				if (!sub.dataset.tmOpenedOnce) {
					sub.dataset.tmOpenedOnce = "1";
					sub.open = true;
				}
				setTimeout(function () {
					renderLayerTripleResiduals(idx);
					renderLayerFeaturePlots(idx);
					renderLayerLogitLens(idx);
				}, 80);
			}
			card.setAttribute("data-tm-enhanced", "1");
			if (sub.open) {
				renderLayerFeaturePlots(idx);
				renderLayerLogitLens(idx);
			}
		});
	}
	window.addEventListener("tm:theme", function () {
		Object.keys(featureState).forEach(function (key) { renderLayerFeaturePlots(parseInt(key, 10)); });
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
					renderLayerFeaturePlots(idx);
					renderLayerLogitLens(idx);
				}
			});
		}, 350);
	});
	setInterval(enhanceLayerCards, 1200);

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
		var cards = Array.prototype.slice.call(config.querySelectorAll(":scope > div")).filter(function (el) {
			return el.offsetParent !== null && el.id !== "param-breakdown-toggle" && el.id !== "param-breakdown-chart" && el.id !== "arch-validity-message";
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

	window.TransformerSteps = {
		init: function (hostId) {
			var host = document.getElementById(hostId);
			if (!host) return null;
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
			var canvas = document.getElementById(canvasId);
			if (!canvas) return;
			var entry = layerFFNHeatmapRegistry[canvasId];
			if (!entry) {
				entry = { layerIdx: layerIdx, api: null };
				entry.api = initCanvas(canvas, function (ctx, w, h) {
					drawFFNHeatmap(ctx, w, h, entry.layerIdx);
				});
				layerFFNHeatmapRegistry[canvasId] = entry;
			} else {
				entry.layerIdx = layerIdx;
				entry.api.redraw();
			}
			canvas.setAttribute("data-layer-ffn-ready", "1");
		},
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
		root.querySelectorAll("[data-tex]").forEach(function (el) {
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
				if (tokDetail) tokDetail.remove();
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
			if (shift) shift.style.height = "420px";
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
					box.innerHTML = '<div class="tm-step-head"><h3>4 · Transformer</h3><button class="tm-step-toggle" type="button" aria-expanded="true" aria-label="' + (isDe ? "Schritt einklappen" : "Collapse step") + '">−</button></div><p>' + (isDe ? "Jede Schicht liest den laufenden Vektor, lässt Attention Information zwischen den Tokens austauschen, addiert das Ergebnis zum Vektor, und das FFN transformiert jeden Token einzeln, bevor es wieder addiert wird. Die Token Trajectory zeigt die Vektoren Schicht für Schicht; darunter stehen die Layer mit ihren Attention- und FFN-Schritten. Ein Transformer ist ein Stapel kleiner, wiederverwendbarer Änderungen an einem gemeinsamen Vektor, in dem der gesamte Kontext mit beachtet wird." : "Each layer reads the running vector, lets attention exchange information between tokens, adds the result back, and the FFN transforms each token on its own before adding it back. The token trajectory shows the vectors layer by layer; below are the layers with their attention and FFN steps. A transformer is a stack of small, reusable edits to one shared vector, with the whole context taken into account.") + '</p><div class="tm-step-body" id="tm-transformer-body"></div>';
				var formulaStrip = document.createElement("div");
				formulaStrip.className = "tm-transformer-formulas";
				formulaStrip.innerHTML = "<div data-tex='\\operatorname{Attention}(Q,K,V)=\\operatorname{softmax}\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right)V'></div>" +
					"<div data-tex='z=x+\\operatorname{Attention}(\\operatorname{Norm}(x)),\\quad y=z+\\operatorname{FFN}(\\operatorname{Norm}(z))'></div>" +
					"<div data-tex='\\operatorname{FFN}(x)=W_2\\operatorname{GELU}(W_1x+b_1)+b_2'></div>";
				box.querySelector(".tm-step-body").appendChild(formulaStrip);
				typesetMathInOrg(formulaStrip);
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
					if (background) contextBody.appendChild(background);
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
				var pipelineFirst = pipeline ? pipeline.querySelector(".prose p") : null;
				if (pipelineFirst && boxNowBody) {
					var pipeDetail = document.createElement("details");
					pipeDetail.className = "tm-step-detail tm-pipeline-prose";
					pipeDetail.innerHTML = "<summary>" + (isDe ? "Vom Text zur Verteilung" : "From text to a distribution") + "</summary><div class='tm-step-detail-body'></div>";
					pipeDetail.querySelector(".tm-step-detail-body").appendChild(pipelineFirst);
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
