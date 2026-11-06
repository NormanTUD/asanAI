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
		var scores = words.map(function (word) {
			var dot = 0;
			for (var i = 0; i < vec.length; i++) dot += vec[i] * (space[word][i] || 0);
			return { word: word, score: dot };
		}).sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
		window.__tmUnembedTop = scores.map(function (item) { return item.word; });
		var max = scores[0].score || 1;
		var pad = 16, left = 84, top = 18;
		var rowH = (h - top - pad) / Math.max(1, scores.length);
		scores.forEach(function (item, i) {
			var y = top + i * rowH;
			var bw = Math.max(2, (item.score / max) * (w - left - pad));
			ctx.fillStyle = i === 0 ? c.gold : c.blue;
			ctx.fillRect(left, y + rowH * 0.18, bw, Math.max(4, rowH * 0.58));
			ctx.fillStyle = c.ink;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			ctx.fillText(fitText(ctx, display(item.word), 74), left - 6, y + rowH / 2);
			ctx.textAlign = "left";
			ctx.fillStyle = c.muted;
			ctx.fillText(item.score.toFixed(2), left + bw + 6, y + rowH / 2);
		});
		ctx.textBaseline = "alphabetic";
		ctx.textAlign = "left";
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.fillText(DE() ? "Top-Logits des letzten Tokens" : "top logits of the last token", pad, 12);
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

	function drawLayerSignal(ctx, w, h, layerIdx) {
		var c = palette();
		var trace = (window.__tmLayerTrace || [])[layerIdx];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!trace || !tokens.length) {
			return drawPlaceholder(ctx, w, h, DE() ? "Öffne eine Schicht, um ihr Signal zu sehen." : "Open a layer to see its signal.");
		}
		var n = tokens.length;
		var padL = 90, padR = 18, padT = 28, padB = 30;
		var bw = (w - padL - padR) / Math.max(1, n);
		var max = 0.0001;
		tokens.forEach(function (_, i) {
			max = Math.max(max, norm(trace.h_in[i] || []), norm(trace.h_attn[i] || []), norm(trace.h_out[i] || []));
		});
		var scale = (h - padT - padB) / max;
		var baseY = h - padB;
		ctx.strokeStyle = c.line;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(padL, baseY);
		ctx.lineTo(w - padR, baseY);
		ctx.stroke();
		tokens.forEach(function (token, i) {
			var n0 = norm(trace.h_in[i] || []);
			var n1 = norm(trace.h_attn[i] || []);
			var n2 = norm(trace.h_out[i] || []);
			var x = padL + i * bw + Math.max(1, bw * 0.12);
			var width = Math.max(1, bw * 0.76);
			var y0 = baseY - n0 * scale;
			var y1 = baseY - n1 * scale;
			var y2 = baseY - n2 * scale;
			ctx.fillStyle = c.muted;
			ctx.fillRect(x, y0, width, n0 * scale);
			ctx.fillStyle = c.blue;
			ctx.globalAlpha = 0.9;
			ctx.fillRect(x, Math.min(y0, y1), width, Math.abs(y1 - y0));
			ctx.fillStyle = c.green;
			ctx.fillRect(x, Math.min(y1, y2), width, Math.abs(y2 - y1));
			ctx.globalAlpha = 1;
			ctx.beginPath();
			ctx.arc(x + width / 2, y2, 2.4, 0, Math.PI * 2);
			ctx.fillStyle = c.gold;
			ctx.fill();
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
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.textAlign = "left";
		ctx.fillText((DE() ? "Layer " : "Layer ") + (layerIdx + 1) + (DE() ? " · Signal pro Token: h0, Attention-Schritt, FFN-Schritt; Punkt = Ausgabe" : " · signal per token: h0, attention step, FFN step; dot = output"), padL, 14);
		ctx.fillStyle = c.muted;
		ctx.fillRect(padL, h - 12, 10, 5);
		ctx.fillStyle = c.blue;
		ctx.fillRect(padL + 76, h - 12, 10, 5);
		ctx.fillStyle = c.green;
		ctx.fillRect(padL + 152, h - 12, 10, 5);
		ctx.fillStyle = c.muted;
		ctx.font = "600 8px Barlow, system-ui, sans-serif";
		ctx.fillText(DE() ? "Eingabe" : "input", padL + 14, h - 7);
		ctx.fillText("Attention", padL + 90, h - 7);
		ctx.fillText("FFN", padL + 166, h - 7);
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
	}
	window.addEventListener('tm:theme', redrawLayerCanvases);
	window.addEventListener('tm:transformer-data', function () {
		redrawLayerCanvases();
		renderLayerPreviews();
	});

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
			var stepModes = { embed: "pca", position: "heatmap", attend: "0" };
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
					labels.position = [["heatmap", "Heatmap"], ["pca", DE() ? "PCA-Kurve" : "PCA curve"], ["parallel", DE() ? "Alle Dimensionen" : "All dimensions"]];
				} else if (d > 0) {
					labels.position = [["heatmap", "Heatmap"], ["pca", DE() ? "Kurve" : "Curve"]];
				}
				if (heads) {
					labels.attend = Array.from({ length: heads }, function (_, i) { return [String(i), "Head " + (i + 1)]; });
				}
				return labels;
			}
			function buildStepModes() {
				var labels = stepModeLabels();
				if (dModel() <= 3) {
					if (stepModes.embed === "parallel") stepModes.embed = "pca";
					if (stepModes.position === "parallel") stepModes.position = "heatmap";
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
				unembedSentence.innerHTML = tokens.map(function (token) {
					return '<span class="tm-unembed-sent-token">' + display(token) + '</span>';
				}).join('') + '<span class="tm-unembed-sent-cursor" aria-hidden="true">▍</span>';
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
				});
				var mainTemp = document.getElementById("transformer-temperature");
				if (mainTemp) {
					mainTemp.addEventListener("input", function () {
						unembedTemp.value = mainTemp.value;
						if (unembedTempOut) unembedTempOut.textContent = parseFloat(mainTemp.value).toFixed(1);
					});
				}
			}
			renderUnembedTokens();
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
			var entry = signalCanvasRegistry[canvasId];
			if (!entry) {
				entry = { layerIdx: layerIdx, api: null };
				entry.api = initCanvas(canvas, function (ctx, w, h) {
					drawLayerSignal(ctx, w, h, entry.layerIdx);
				});
				signalCanvasRegistry[canvasId] = entry;
			} else {
				entry.layerIdx = layerIdx;
				entry.api.redraw();
			}
			canvas.setAttribute("data-layer-signal-ready", "1");
		},
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
					box.innerHTML = '<div class="tm-step-head"><h3>4 · Transformer</h3><button class="tm-step-toggle" type="button" aria-expanded="true" aria-label="' + (isDe ? "Schritt einklappen" : "Collapse step") + '">−</button></div><p>' + (isDe ? "Der Block, der die Schichten stapelt. Die Token Trajectory zeigt, wie sich die Vektoren Schicht für Schicht verschieben; die Layer darunter zeigen Attention und FFN." : "The block that stacks the layers. The token trajectory shows how the vectors shift layer by layer; the layers below show attention and FFN.") + '</p><div class="tm-step-body" id="tm-transformer-body"></div>';
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
				// Move the already-rendered overview cards into the Transformer box.
				[[attendCard, isDe ? "Attention-Überblick" : "Attention overview"],
				 [ffnCard, isDe ? "Feed-Forward-Überblick" : "Feed-forward overview"],
				 [residualCard, isDe ? "Residual-Stream-Überblick" : "Residual stream overview"]].forEach(function (pair) {
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
			// Token Trajectory is the opening picture of the block.
			var traj = document.getElementById("transformer-trajectory-full-path-wrapper") || document.getElementById("transformer-trajectory-full-path");
			if (traj && boxNowBody && traj.parentNode !== boxNowBody) {
				boxNowBody.insertBefore(traj, boxNowBody.firstChild);
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
