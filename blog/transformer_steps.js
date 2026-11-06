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

	function drawEmbedPca(ctx, w, h) {
		var c = palette();
		var vocab = vocabList();
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!vocab.length) return drawPlaceholder(ctx, w, h, DE() ? "Noch kein Embedding-Raum." : "No embedding space yet.");
		var coords = pca2(vocab.map(function (v) { return v.vec; }));
		var index = {};
		vocab.forEach(function (v, i) { index[v.word] = i; });
		var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		coords.forEach(function (p) {
			minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
			minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
		});
		var spanX = maxX - minX || 1, spanY = maxY - minY || 1;
		var pad = 22;
		function map(p) {
			return {
				x: pad + (p[0] - minX) / spanX * (w - pad * 2),
				y: h - pad - (p[1] - minY) / spanY * (h - pad * 2)
			};
		}
		ctx.strokeStyle = c.line;
		ctx.lineWidth = 1;
		ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.stroke();
		coords.forEach(function (p, i) {
			var q = map(p);
			ctx.beginPath();
			ctx.arc(q.x, q.y, 2.2, 0, Math.PI * 2);
			ctx.fillStyle = c.dark ? "rgba(157,181,181,.45)" : "rgba(0,75,111,.28)";
			ctx.fill();
		});
		if (tokens.length) {
			ctx.beginPath();
			tokens.forEach(function (token, i) {
				var idx = index[token];
				if (idx == null) return;
				var q = map(coords[idx]);
				if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
			});
			ctx.strokeStyle = c.green;
			ctx.lineWidth = 2.2;
			ctx.stroke();
			tokens.forEach(function (token, i) {
				var idx = index[token];
				if (idx == null) return;
				var q = map(coords[idx]);
				var col = mix(hex(c.blue), hex(c.lilac), i / Math.max(1, tokens.length - 1));
				ctx.beginPath();
				ctx.arc(q.x, q.y, 5, 0, Math.PI * 2);
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
		}
		ctx.fillStyle = c.muted;
		ctx.font = "600 10px Barlow, system-ui, sans-serif";
		ctx.textAlign = "left";
		ctx.fillText("PC 1 →", w - 64, h - 8);
		ctx.save();
		ctx.translate(10, 66);
		ctx.rotate(-Math.PI / 2);
		ctx.fillText("PC 2 →", 0, 0);
		ctx.restore();
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

	function drawPositionPca(ctx, w, h) {
		var c = palette();
		var tokens = tokenList();
		var d = dModel();
		ctx.clearRect(0, 0, w, h);
		if (!tokens.length || !d) return drawPlaceholder(ctx, w, h, DE() ? "Noch keine Positionen." : "No positions yet.");
		var vectors = positionVectors(tokens.length, d);
		var coords = pca2(vectors);
		var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		coords.forEach(function (q) { minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]); minY = Math.min(minY, q[1]); maxY = Math.max(maxY, q[1]); });
		var spanX = maxX - minX || 1, spanY = maxY - minY || 1;
		var pad = 32;
		function map(q) { return { x: pad + (q[0] - minX) / spanX * (w - pad * 2), y: h - pad - (q[1] - minY) / spanY * (h - pad * 2) }; }
		ctx.strokeStyle = c.line;
		ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.stroke();
		ctx.beginPath();
		coords.forEach(function (q, i) {
			var p = map(q);
			if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
		});
		ctx.strokeStyle = c.green;
		ctx.lineWidth = 2.2;
		ctx.stroke();
		coords.forEach(function (q, i) {
			var p = map(q);
			var col = mix(hex(c.blue), hex(c.gold), i / Math.max(1, coords.length - 1));
			ctx.beginPath();
			ctx.arc(p.x, p.y, 4.6, 0, Math.PI * 2);
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
		ctx.textAlign = "left";
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.fillText(DE() ? "PCA-Projektion der Positionsvektoren · Kurve = Reihenfolge der Positionen" : "PCA projection of the position vectors · curve = position order", pad, 15);
	}

	function drawPositionParallel(ctx, w, h) {
		var c = palette();
		var tokens = tokenList();
		var d = dModel();
		ctx.clearRect(0, 0, w, h);
		if (!tokens.length || !d) return drawPlaceholder(ctx, w, h, DE() ? "Noch keine Positionen." : "No positions yet.");
		var vectors = positionVectors(tokens.length, d);
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
		ctx.fillText(DE() ? "Alle Dimensionen · eine Linie pro Position · Originaldaten" : "all dimensions · one line per position · original data", pad, 15);
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

	function drawAttend(ctx, w, h) {
		var c = palette();
		var tokens = tokenList();
		var trace = (window.__tmLayerTrace || [])[0];
		ctx.clearRect(0, 0, w, h);
		if (!tokens.length || !trace) return drawPlaceholder(ctx, w, h, DE() ? "Noch keine Attention-Daten." : "No attention data yet.");
		var weights = averageAttention(trace);
		if (!weights) return drawPlaceholder(ctx, w, h, DE() ? "Noch keine Attention-Gewichte." : "No attention weights yet.");
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
		ctx.fillText(DE() ? "Bögen: gemittelte Attention über alle Heads · Liniendicke = Gewicht" : "arcs: attention averaged over all heads · line width = weight", pad, 16);
	}

	function drawFFN(ctx, w, h) {
		var c = palette();
		var trace = window.__tmLayerTrace || [];
		var ffn = window.__tmFFNTrace || [];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!trace.length || !tokens.length) return drawPlaceholder(ctx, w, h, DE() ? "Noch keine FFN-Daten." : "No FFN data yet.");
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

	function drawResidual(ctx, w, h) {
		var c = palette();
		var trace = window.__tmLayerTrace || [];
		var tokens = tokenList();
		ctx.clearRect(0, 0, w, h);
		if (!trace.length || !tokens.length) return drawPlaceholder(ctx, w, h, DE() ? "Noch keine Residual-Daten." : "No residual data yet.");
		var layers = trace.length;
		var pad = 22, left = 74, top = 28;
		var rows = tokens.length;
		var cw = (w - left - pad) / Math.max(1, layers * 2);
		var ch = (h - top - pad) / Math.max(1, rows);
		var max = 0;
		trace.forEach(function (layer) {
			tokens.forEach(function (_, i) {
				max = Math.max(max, diffNorm(layer.h_attn[i], layer.h_in[i]), diffNorm(layer.h_out[i], layer.h_attn[i]));
			});
		});
		max = max || 1;
		for (var l = 0; l < layers; l++) {
			var layer = trace[l];
			for (var i = 0; i < rows; i++) {
				var a = diffNorm(layer.h_attn[i], layer.h_in[i]) / max;
				var f = diffNorm(layer.h_out[i], layer.h_attn[i]) / max;
				var y = top + i * ch;
				ctx.fillStyle = "rgba(" + hex(c.blue).join(",") + "," + (0.06 + a * 0.9) + ")";
				ctx.fillRect(left + (l * 2) * cw, y, cw, ch);
				ctx.fillStyle = "rgba(" + hex(c.green).join(",") + "," + (0.06 + f * 0.9) + ")";
				ctx.fillRect(left + (l * 2 + 1) * cw, y, cw, ch);
			}
			ctx.fillStyle = c.muted;
			ctx.font = "600 8px Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText("L" + (l + 1), left + (l * 2 + 1) * cw, top - 8);
		}
		tokens.forEach(function (token, i) {
			ctx.fillStyle = c.ink;
			ctx.font = "600 8px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			ctx.fillText(fitText(ctx, display(token), 64), left - 6, top + i * ch + ch / 2);
		});
		ctx.textBaseline = "alphabetic";
		ctx.textAlign = "left";
		ctx.fillStyle = c.blue;
		ctx.fillRect(left, h - 12, 10, 5);
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.fillText(DE() ? "Attention-Update" : "attention update", left + 14, h - 8);
		ctx.fillStyle = c.green;
		ctx.fillRect(left + 118, h - 12, 10, 5);
		ctx.fillStyle = c.muted;
		ctx.fillText(DE() ? "FFN-Update" : "FFN update", left + 132, h - 8);
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

	function drawMigrationArrows(ctx, w, h, layerIdx) {
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
		var coords = pca2(all);
		var start = coords.slice(0, n);
		var end = coords.slice(n);
		var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		coords.forEach(function (p) {
			minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
			minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
		});
		var spanX = maxX - minX || 1, spanY = maxY - minY || 1;
		var pad = 30;
		function map(p) {
			return {
				x: pad + (p[0] - minX) / spanX * (w - pad * 2),
				y: h - pad - (p[1] - minY) / spanY * (h - pad * 2)
			};
		}
		ctx.strokeStyle = c.line;
		ctx.lineWidth = 1;
		ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.stroke();
		for (var t = 0; t < n; t++) {
			var a = map(start[t]);
			var b = map(end[t]);
			var col = mix(hex(c.blue), hex(c.lilac), t / Math.max(1, n - 1));
			ctx.beginPath();
			ctx.arc(a.x, a.y, 3.2, 0, Math.PI * 2);
			ctx.fillStyle = c.muted;
			ctx.fill();
			drawArrow(ctx, a.x, a.y, b.x, b.y, rgb(col), 1.8);
			ctx.beginPath();
			ctx.arc(b.x, b.y, 4.4, 0, Math.PI * 2);
			ctx.fillStyle = rgb(col);
			ctx.fill();
			ctx.strokeStyle = c.paper;
			ctx.lineWidth = 1.3;
			ctx.stroke();
			ctx.font = "700 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			ctx.fillStyle = c.ink;
			ctx.fillText(fitText(ctx, display(tokens[t]), 64), b.x, b.y - 9);
		}
		ctx.textAlign = "left";
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.fillText(DE() ? "grau = vor dieser Schicht · Farbe = danach · Pfeil = Bewegung" : "grey = before this layer · colour = after · arrow = movement", pad, 16);
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
			var stepModes = { embed: "pca", position: "heatmap" };
			var modeLabels = {
				embed: [
					["pca", "PCA"],
					["parallel", DE() ? "Alle Dimensionen" : "All dimensions"]
				],
				position: [
					["heatmap", "Heatmap"],
					["pca", DE() ? "PCA-Kurve" : "PCA curve"],
					["parallel", DE() ? "Alle Dimensionen" : "All dimensions"]
				]
			};
			var apis = {};
			Object.keys(canvases).forEach(function (key) {
				var canvas = canvases[key];
				if (!canvas) return;
				apis[key] = initCanvas(canvas, function (ctx, w, h) {
					draws[key](ctx, w, h, stepModes[key]);
				});
			});
			function buildStepModes() {
				host.querySelectorAll("[data-step-modes]").forEach(function (modeHost) {
					var key = modeHost.getAttribute("data-step-modes");
					if (!modeLabels[key]) return;
					modeHost.innerHTML = "";
					modeLabels[key].forEach(function (pair) {
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
			var pending = null;
			function redraw() {
				if (pending) return;
				pending = requestAnimationFrame(function () {
					pending = null;
					Object.keys(apis).forEach(function (key) { apis[key].redraw(); });
				});
			}
			host.setAttribute("data-demo-ready", "1");
			renderLayerPreviews();
			window.addEventListener("tm:theme", redraw);
			if (window.__MN_DARK && window.__MN_DARK.onChange) window.__MN_DARK.onChange(redraw);
			window.addEventListener("tm:transformer-data", redraw);
			window.addEventListener("resize", redraw);
			var tries = 0;
			var poll = setInterval(function () {
				tries++;
				if ((window.__tmLayerTrace && window.__tmLayerTrace.length) || tries > 80) {
					clearInterval(poll);
					redraw();
					renderLayerPreviews();
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
		renderLayerMigration: function (canvasId, layerIdx) {
			var canvas = document.getElementById(canvasId);
			if (!canvas) return;
			var entry = migrationCanvasRegistry[canvasId];
			if (!entry) {
				entry = { layerIdx: layerIdx, api: null };
				entry.api = initCanvas(canvas, function (ctx, w, h) {
					drawMigrationArrows(ctx, w, h, entry.layerIdx);
				});
				migrationCanvasRegistry[canvasId] = entry;
			} else {
				entry.layerIdx = layerIdx;
				entry.api.redraw();
			}
			canvas.setAttribute('data-layer-migration-ready', '1');
		}
	};
})();
