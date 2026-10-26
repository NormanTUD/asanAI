/* TEN MINUTES — compact-page demos. Depends on assets/site.js (TM.*). */
(function () {
	"use strict";

	function $(sel, root) { return (root || document).querySelector(sel); }
	function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
	function colors() { return window.TM && TM.colors ? TM.colors() : {}; }
	function escapeHtml(s) {
		return String(s).replace(/[&<>"]/g, function (c) {
			return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
		});
	}
	function canvasDemo(canvas, draw) {
		if (!canvas || !window.TM || !TM.initCanvas) return null;
		var api = TM.initCanvas(canvas, draw);
		window.addEventListener("tm:theme", function () { api.redraw(); });
		return api;
	}
	function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
	function lerp(a, b, t) { return a + (b - a) * t; }
	function mix(c1, c2, t) {
		return [
			Math.round(lerp(c1[0], c2[0], t)),
			Math.round(lerp(c1[1], c2[1], t)),
			Math.round(lerp(c1[2], c2[2], t))
		];
	}
	function rgb(a) { return "rgb(" + a[0] + "," + a[1] + "," + a[2] + ")"; }
	function hexToRgb(h) {
		h = String(h || "").replace("#", "");
		if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
		return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
	}

	/* ── sampling ───────────────────────────────────────────── */

	function initSampling(root) {
		var bars = $("[data-sampling-bars]", root);
		var temp = $("[data-sampling-temp]", root);
		var tempOut = $("[data-sampling-temp-out]", root);
		var topP = $("[data-sampling-topp]", root);
		var topPOut = $("[data-sampling-topp-out]", root);
		var choice = $("[data-sampling-choice]", root);
		var count = $("[data-sampling-count]", root);
		var entropy = $("[data-sampling-entropy]", root);
		if (!bars) return;
		var tokens = [
			{ t: "Paris", z: 2.9, c: "var(--tm-green)" },
			{ t: "Lyon", z: 1.1, c: "var(--tm-sky)" },
			{ t: "Berlin", z: 0.7, c: "var(--tm-gold)" },
			{ t: "Frog", z: -0.4, c: "var(--tm-coral)" },
			{ t: "the", z: -1.1, c: "var(--tm-faint)" }
		];
		function render() {
			var T = clamp(parseFloat(temp && temp.value) || 0.8, 0.05, 3);
			var P = clamp(parseFloat(topP && topP.value) || 1, 0.05, 1);
			if (tempOut) tempOut.textContent = T.toFixed(2);
			if (topPOut) topPOut.textContent = P.toFixed(2);
			var exps = tokens.map(function (x) { return Math.exp(x.z / T); });
			var sum = exps.reduce(function (a, b) { return a + b; }, 0);
			var probs = exps.map(function (e) { return e / sum; });
			var order = probs.map(function (p, i) { return i; }).sort(function (a, b) { return probs[b] - probs[a]; });
			var cum = 0, keep = {};
			order.forEach(function (i) {
				if (cum < P) { keep[i] = true; cum += probs[i]; }
			});
			var kept = order.filter(function (i) { return keep[i]; });
			var mass = kept.reduce(function (a, i) { return a + probs[i]; }, 0) || 1;
			var active = probs.map(function (p, i) { return keep[i] ? p / mass : 0; });
			var rounded = {};
			var total = 0;
			kept.forEach(function (i) {
				rounded[i] = Math.round(active[i] * 100);
				total += rounded[i];
			});
			if (kept.length && total !== 100) {
				var largest = kept.reduce(function (a, b) { return active[a] >= active[b] ? a : b; }, kept[0]);
				rounded[largest] += 100 - total;
			}
			var ent = -kept.reduce(function (a, i) {
				var q = active[i];
				return a + (q > 0 ? q * Math.log(q) / Math.LN2 : 0);
			}, 0);
			bars.innerHTML = tokens.map(function (tok, i) {
				var isKept = keep[i];
				return '<div class="dist-row' + (isKept ? "" : " is-cut") + '">' +
					'<span class="dist-label">' + escapeHtml(tok.t) + '</span>' +
					'<span class="dist-track"><span class="dist-fill" style="width:' + (isKept ? rounded[i] : 0) + '%;background:' + tok.c + '"></span></span>' +
					'<span class="dist-val">' + (isKept ? rounded[i] + '%' : 'cut') + '</span></div>';
			}).join("");
			if (choice) choice.textContent = tokens[kept[0]].t;
			if (count) count.textContent = kept.length + " / " + tokens.length;
			if (entropy) entropy.textContent = ent.toFixed(2) + " bits";
		}
		if (temp) temp.addEventListener("input", render);
		if (topP) topP.addEventListener("input", render);
		render();
	}

	/* ── decoding studio ───────────────────────────────────── */

	function initDecoding(root) {
		var bars = $("[data-decoding-bars]", root);
		var sentence = $("[data-decoding-sentence]", root);
		var promptChips = $$("[data-decoding-prompt]", root);
		var filterChips = $$("[data-decoding-filter-value]", root);
		var temp = $("[data-decoding-temp]", root);
		var tempOut = $("[data-decoding-temp-out]", root);
		var topp = $("[data-decoding-topp]", root);
		var toppOut = $("[data-decoding-topp-out]", root);
		var topk = $("[data-decoding-topk]", root);
		var topkOut = $("[data-decoding-topk-out]", root);
		var minp = $("[data-decoding-minp]", root);
		var minpOut = $("[data-decoding-minp-out]", root);
		var toppWrap = $("[data-decoding-topp-wrap]", root);
		var topkWrap = $("[data-decoding-topk-wrap]", root);
		var minpWrap = $("[data-decoding-minp-wrap]", root);
		var filterName = $("[data-decoding-filter-name]", root);
		var countEl = $("[data-decoding-count]", root);
		var entropyEl = $("[data-decoding-entropy]", root);
		var drawEl = $("[data-decoding-draw]", root);
		var historyEl = $("[data-decoding-history]", root);
		var sampleBtn = $("[data-decoding-sample]", root);
		var resetBtn = $("[data-decoding-reset]", root);
		if (!bars) return;
		var prompts = {
			story: {
				sentence: 'Once upon a time there was a <span class="pred">___</span>',
				tokens: [
					{ t: "dragon", z: 2.0 },
					{ t: "castle", z: 1.8 },
					{ t: "forest", z: 1.6 },
					{ t: "princess", z: 1.4 },
					{ t: "knight", z: 1.0 },
					{ t: "river", z: 0.7 },
					{ t: "mountain", z: 0.4 }
				]
			},
			fact: {
				sentence: 'The capital of France is <span class="pred">___</span>',
				tokens: [
					{ t: "Paris", z: 2.4 },
					{ t: "Lyon", z: 1.6 },
					{ t: "Marseille", z: 1.3 },
					{ t: "Berlin", z: 1.0 },
					{ t: "Frog", z: 0.2 }
				]
			},
			code: {
				sentence: 'def add(a, b): return <span class="pred">___</span>',
				tokens: [
					{ t: "a + b", z: 2.2 },
					{ t: "a", z: 1.9 },
					{ t: "b", z: 1.6 },
					{ t: "sum", z: 1.2 },
					{ t: "None", z: 0.8 }
				]
			}
		};
		var currentPrompt = "story";
		var currentFilter = "topp";
		var kept = [];
		var filtered = [];
		var history = [];
		function softmax(tokens, T) {
			var exps = tokens.map(function (x) { return Math.exp(x.z / T); });
			var sum = exps.reduce(function (a, b) { return a + b; }, 0);
			return exps.map(function (e) { return e / sum; });
		}
		function compute() {
			var T = clamp(parseFloat(temp && temp.value) || 0.9, 0.05, 3);
			var p = clamp(parseFloat(topp && topp.value) || 0.9, 0.05, 1);
			var k = parseInt(topk && topk.value, 10) || 4;
			var m = clamp(parseFloat(minp && minp.value) || 0.1, 0, 1);
			if (tempOut) tempOut.textContent = T.toFixed(2);
			if (toppOut) toppOut.textContent = p.toFixed(2);
			if (topkOut) topkOut.textContent = k;
			if (minpOut) minpOut.textContent = m.toFixed(2);
			var tokens = prompts[currentPrompt].tokens;
			var probs = softmax(tokens, T);
			var order = probs.map(function (_, i) { return i; }).sort(function (a, b) { return probs[b] - probs[a]; });
			var keep = {};
			if (currentFilter === "none") {
				order.forEach(function (i) { keep[i] = true; });
			} else if (currentFilter === "topk") {
				order.slice(0, k).forEach(function (i) { keep[i] = true; });
			} else if (currentFilter === "minp") {
				var maxP = probs[order[0]];
				order.forEach(function (i) {
					if (probs[i] >= m * maxP) keep[i] = true;
				});
			} else {
				var cum = 0;
				order.forEach(function (i) {
					if (cum < p) { keep[i] = true; cum += probs[i]; }
				});
			}
			var keptIdx = order.filter(function (i) { return keep[i]; });
			var mass = keptIdx.reduce(function (a, i) { return a + probs[i]; }, 0) || 1;
			filtered = probs.map(function (v, i) { return keep[i] ? v / mass : 0; });
			kept = keptIdx.map(function (i) { return { i: i, p: filtered[i] }; });
			var ent = -keptIdx.reduce(function (a, i) {
				var q = filtered[i];
				return a + (q > 0 ? q * Math.log(q) / Math.LN2 : 0);
			}, 0);
			if (countEl) countEl.textContent = kept.length + " / " + tokens.length;
			if (entropyEl) entropyEl.textContent = ent.toFixed(2) + " bits";
			if (filterName) {
				var label = currentFilter === "none" ? "no filter" : (currentFilter === "topk" ? "top-k " + k : (currentFilter === "minp" ? "min-p " + m.toFixed(2) : "top-p " + p.toFixed(2)));
				filterName.textContent = label;
			}
			renderBars(tokens, probs);
		}
		function renderBars(tokens, probs) {
			var top = kept.length ? kept[0].i : -1;
			bars.innerHTML = tokens.map(function (tok, i) {
				var cut = filtered[i] === 0;
				return '<button class="bar-row' + (cut ? " is-cut" : "") + (i === top ? " is-top" : "") + '" type="button" data-decoding-i="' + i + '">' +
					'<span class="bar-name">' + escapeHtml(tok.t) + '</span>' +
					'<span class="bar-track"><span class="bar-ghost" style="width:' + (probs[i] * 100).toFixed(2) + '%"></span><span class="bar-fill" style="width:' + (filtered[i] * 100).toFixed(2) + '%"></span></span>' +
					'<span class="bar-pct">' + Math.round(filtered[i] * 100) + '%</span></button>';
			}).join("");
			$$("[data-decoding-i]", bars).forEach(function (btn) {
				btn.addEventListener("click", function () {
					var i = parseInt(btn.getAttribute("data-decoding-i"), 10);
					if (!kept.length || filtered[i] === 0) return;
					record(i);
				});
			});
		}
		function record(i) {
			var token = prompts[currentPrompt].tokens[i].t;
			if (drawEl) drawEl.textContent = token;
			history.push(token);
			if (history.length > 12) history.shift();
			if (historyEl) historyEl.innerHTML = history.map(function (t) { return "<span>" + escapeHtml(t) + "</span>"; }).join("");
			var btn = $('[data-decoding-i="' + i + '"]', bars);
			if (btn) {
				btn.classList.add("is-pick");
				setTimeout(function () { btn.classList.remove("is-pick"); }, 800);
			}
		}
		function sample() {
			if (!kept.length) return;
			var r = Math.random(), acc = 0, pick = kept[0];
			for (var i = 0; i < kept.length; i++) {
				acc += kept[i].p;
				if (r <= acc) { pick = kept[i]; break; }
			}
			record(pick.i);
		}
		function setFilter(value) {
			currentFilter = value;
			filterChips.forEach(function (c) { c.classList.toggle("is-on", c.getAttribute("data-decoding-filter-value") === value); });
			if (toppWrap) toppWrap.hidden = value !== "topp";
			if (topkWrap) topkWrap.hidden = value !== "topk";
			if (minpWrap) minpWrap.hidden = value !== "minp";
			compute();
		}
		promptChips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				promptChips.forEach(function (c) { c.classList.remove("is-on"); });
				chip.classList.add("is-on");
				currentPrompt = chip.getAttribute("data-decoding-prompt");
				if (sentence) sentence.innerHTML = prompts[currentPrompt].sentence;
				history = [];
				if (historyEl) historyEl.innerHTML = "";
				if (drawEl) drawEl.textContent = "—";
				compute();
			});
		});
		filterChips.forEach(function (chip) {
			chip.addEventListener("click", function () { setFilter(chip.getAttribute("data-decoding-filter-value")); });
		});
		if (temp) temp.addEventListener("input", compute);
		if (topp) topp.addEventListener("input", compute);
		if (topk) topk.addEventListener("input", compute);
		if (minp) minp.addEventListener("input", compute);
		if (sampleBtn) sampleBtn.addEventListener("click", sample);
		if (resetBtn) resetBtn.addEventListener("click", function () {
			history = [];
			if (historyEl) historyEl.innerHTML = "";
			if (drawEl) drawEl.textContent = "—";
			compute();
		});
		if (sentence) sentence.innerHTML = prompts[currentPrompt].sentence;
		setFilter(currentFilter);
	}

	/* ── line fit ───────────────────────────────────────────── */

	function initLineFit(root) {
		var canvas = $("[data-linefit-canvas]", root);
		var w = $("[data-linefit-w]", root);
		var b = $("[data-linefit-b]", root);
		var wOut = $("[data-linefit-w-out]", root);
		var bOut = $("[data-linefit-b-out]", root);
		var loss = $("[data-linefit-loss]", root);
		var best = $("[data-linefit-best-val]", root);
		var bestBtn = $("[data-linefit-best]", root);
		var stepBtn = $("[data-linefit-step]", root);
		if (!canvas) return;
		var noise = [0.04, -0.03, 0.02, -0.05, 0.01, 0.06, -0.02, 0.03, -0.04, 0.05, 0.0, -0.01, 0.04, -0.02, 0.02, -0.03, 0.05, -0.04, 0.01, 0.03];
		var pts = noise.map(function (n, i) {
			var x = 0.06 + i * 0.88 / (noise.length - 1);
			return { x: x, y: 0.75 * x + 0.18 + n };
		});
		var target = { a: 0.75, b: 0.18 };
		function val(el, fallback) { return parseFloat(el && el.value) || fallback; }
		function draw(ctx, W, H) {
			var c = colors();
			var a = val(w, 0.4), bb = val(b, 0.2);
			var pad = 30, xmin = -0.05, xmax = 1.05, ymin = -0.15, ymax = 1.15;
			function px(x) { return pad + (x - xmin) / (xmax - xmin) * (W - pad * 2); }
			function py(y) { return H - pad - (y - ymin) / (ymax - ymin) * (H - pad * 2); }
			ctx.clearRect(0, 0, W, H);
			ctx.strokeStyle = c.lineStrong;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(px(xmin), py(0)); ctx.lineTo(px(xmax), py(0));
			ctx.moveTo(px(0), py(ymin)); ctx.lineTo(px(0), py(ymax));
			ctx.stroke();
			ctx.strokeStyle = c.gold;
			ctx.setLineDash([5, 5]);
			ctx.beginPath();
			ctx.moveTo(px(0), py(target.b)); ctx.lineTo(px(1), py(target.a + target.b));
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.strokeStyle = c.green;
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(px(0), py(bb)); ctx.lineTo(px(1), py(a + bb));
			ctx.stroke();
			pts.forEach(function (p) {
				ctx.beginPath();
				ctx.arc(px(p.x), py(p.y), 4.5, 0, Math.PI * 2);
				ctx.fillStyle = c.sky;
				ctx.fill();
				ctx.strokeStyle = c.card;
				ctx.lineWidth = 1.5;
				ctx.stroke();
			});
			var mse = pts.reduce(function (s, p) {
				var d = (a * p.x + bb) - p.y;
				return s + d * d;
			}, 0) / pts.length;
			if (wOut) wOut.textContent = a.toFixed(2);
			if (bOut) bOut.textContent = bb.toFixed(2);
			if (loss) loss.textContent = mse.toFixed(3);
			if (best) best.textContent = "a " + target.a.toFixed(2) + " · b " + target.b.toFixed(2);
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		function redraw() { api.redraw(); }
		if (w) w.addEventListener("input", redraw);
		if (b) b.addEventListener("input", redraw);
		if (bestBtn) bestBtn.addEventListener("click", function () {
			if (w) w.value = target.a.toFixed(2);
			if (b) b.value = target.b.toFixed(2);
			redraw();
		});
		if (stepBtn) stepBtn.addEventListener("click", function () {
			var ca = val(w, 0.4), cb = val(b, 0.2);
			if (w) w.value = lerp(ca, target.a, 0.25).toFixed(2);
			if (b) b.value = lerp(cb, target.b, 0.25).toFixed(2);
			redraw();
		});
		redraw();
	}

	/* ── dream ──────────────────────────────────────────────── */

	function initDream(root) {
		var canvas = $("[data-dream-canvas]", root);
		var strength = $("[data-dream-strength]", root);
		var out = $("[data-dream-strength-out]", root);
		var label = $("[data-dream-label]", root);
		var chips = $$("[data-dream-class]", root);
		var current = "banana";
		if (!canvas) return;
		function rnd(i) {
			var x = Math.sin(i * 12.9898) * 43758.5453;
			return x - Math.floor(x);
		}
		function drawShape(ctx, W, H, kind, alpha) {
			ctx.save();
			ctx.globalAlpha = alpha;
			var cx = W / 2, cy = H / 2;
			if (kind === "banana") {
				ctx.fillStyle = "#9f9700";
				ctx.strokeStyle = "#004b6f";
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(cx - 95, cy + 35);
				ctx.bezierCurveTo(cx - 70, cy - 55, cx + 45, cy - 75, cx + 100, cy - 25);
				ctx.bezierCurveTo(cx + 55, cy + 5, cx - 25, cy + 40, cx - 95, cy + 35);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			} else if (kind === "dumbbell") {
				ctx.fillStyle = "#5c9baf";
				ctx.strokeStyle = "#004b6f";
				ctx.lineWidth = 2;
				ctx.fillRect(cx - 55, cy - 7, 110, 14);
				ctx.strokeRect(cx - 55, cy - 7, 110, 14);
				[-1, 1].forEach(function (s) {
					ctx.beginPath();
					ctx.arc(cx + s * 72, cy, 25, 0, Math.PI * 2);
					ctx.fill();
					ctx.stroke();
				});
			} else {
				ctx.fillStyle = "#9185be";
				ctx.strokeStyle = "#004b6f";
				ctx.lineWidth = 2;
				var widths = [90, 64, 110];
				var y = cy - 50;
				widths.forEach(function (w) {
					ctx.fillRect(cx - w / 2, y, w, 24);
					ctx.strokeRect(cx - w / 2, y, w, 24);
					y += 32;
				});
			}
			ctx.restore();
		}
		function draw(ctx, W, H) {
			var c = colors();
			var t = clamp(parseFloat(strength && strength.value) || 0.6, 0, 1);
			if (out) out.textContent = t.toFixed(2);
			if (label) label.textContent = "class: " + current;
			ctx.clearRect(0, 0, W, H);
			var cols = 82, rows = Math.max(24, Math.round(cols * H / W));
			var cw = W / cols, ch = H / rows;
			for (var y = 0; y < rows; y++) {
				for (var x = 0; x < cols; x++) {
					var v = rnd(x * 97 + y * 131);
					var g = Math.round(30 + v * 150);
					ctx.fillStyle = c.dark
						? "rgba(" + g + "," + (g + 20) + "," + (g + 30) + ",0.75)"
						: "rgba(" + (235 - Math.round(v * 70)) + "," + (240 - Math.round(v * 70)) + "," + (238 - Math.round(v * 70)) + ",0.8)";
					ctx.fillRect(x * cw, y * ch, cw + 1, ch + 1);
				}
			}
			drawShape(ctx, W, H, current, 0.08 + t * 0.82);
			ctx.fillStyle = c.muted;
			ctx.font = "600 11px Barlow, system-ui, sans-serif";
			ctx.fillText("network noise + learned template", 12, H - 12);
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		if (strength) strength.addEventListener("input", function () { api.redraw(); });
		chips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				chips.forEach(function (x) { x.classList.remove("is-on"); });
				chip.classList.add("is-on");
				current = chip.getAttribute("data-dream-class");
				api.redraw();
			});
		});
		api.redraw();
	}

	/* ── polynomial fit ─────────────────────────────────────── */

	function solve(A, b) {
		var n = b.length;
		for (var i = 0; i < n; i++) {
			var p = i;
			for (var r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
			var tmp = A[i]; A[i] = A[p]; A[p] = tmp;
			var tb = b[i]; b[i] = b[p]; b[p] = tb;
			var piv = A[i][i];
			if (Math.abs(piv) < 1e-12) continue;
			for (var j = i; j < n; j++) A[i][j] /= piv;
			b[i] /= piv;
			for (var r2 = 0; r2 < n; r2++) {
				if (r2 === i) continue;
				var f = A[r2][i];
				if (!f) continue;
				for (var j2 = i; j2 < n; j2++) A[r2][j2] -= f * A[i][j2];
				b[r2] -= f * b[i];
			}
		}
		return b;
	}
	function polyFit(xs, ys, degree) {
		var n = degree + 1;
		var A = [], b = [];
		for (var i = 0; i < n; i++) { A.push([]); b.push(0); }
		for (var k = 0; k < xs.length; k++) {
			var powers = [1];
			for (var p = 1; p < 2 * n; p++) powers.push(powers[p - 1] * xs[k]);
			for (var r = 0; r < n; r++) {
				for (var c2 = 0; c2 < n; c2++) A[r][c2] = (A[r][c2] || 0) + powers[r + c2];
				b[r] += powers[r] * ys[k];
			}
		}
		for (var d = 0; d < n; d++) A[d][d] += 1e-7;
		return solve(A, b);
	}
	function evalPoly(coef, x) {
		var y = 0;
		for (var i = coef.length - 1; i >= 0; i--) y = y * x + coef[i];
		return y;
	}
	function initPolyFit(root) {
		var canvas = $("[data-polyfit-canvas]", root);
		var degree = $("[data-polyfit-degree]", root);
		var degreeOut = $("[data-polyfit-degree-out]", root);
		var trainOut = $("[data-polyfit-train]", root);
		var testOut = $("[data-polyfit-test]", root);
		if (!canvas) return;
		var train = [], test = [];
		for (var i = 0; i < 12; i++) {
			var x = -1 + 2 * i / 11;
			train.push({ x: x, y: Math.sin(2.2 * x) + 0.15 * x + Math.sin(i * 13.7) * 0.20 });
		}
		for (var j = 0; j < 40; j++) {
			var xt = -1 + 2 * j / 39;
			test.push({ x: xt, y: Math.sin(2.2 * xt) + 0.15 * xt + Math.sin(j * 7.3 + 2) * 0.05 });
		}
		function draw(ctx, W, H) {
			var c = colors();
			var d = parseInt(degree && degree.value, 10) || 1;
			if (degreeOut) degreeOut.textContent = d;
			var coef = polyFit(train.map(function (p) { return p.x; }), train.map(function (p) { return p.y; }), d);
			var pad = 28, xmin = -1.05, xmax = 1.05, ymin = -1.7, ymax = 1.7;
			function px(x) { return pad + (x - xmin) / (xmax - xmin) * (W - pad * 2); }
			function py(y) { return H - pad - (y - ymin) / (ymax - ymin) * (H - pad * 2); }
			ctx.clearRect(0, 0, W, H);
			ctx.strokeStyle = c.lineStrong;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(px(xmin), py(0)); ctx.lineTo(px(xmax), py(0));
			ctx.moveTo(px(0), py(ymin)); ctx.lineTo(px(0), py(ymax));
			ctx.stroke();
			ctx.strokeStyle = c.gold;
			ctx.lineWidth = 2.5;
			ctx.beginPath();
			for (var s = 0; s <= 200; s++) {
				var xv = xmin + (xmax - xmin) * s / 200;
				var yv = clamp(evalPoly(coef, xv), ymin, ymax);
				if (s) ctx.lineTo(px(xv), py(yv)); else ctx.moveTo(px(xv), py(yv));
			}
			ctx.stroke();
			test.forEach(function (p) {
				ctx.beginPath();
				ctx.arc(px(p.x), py(p.y), 2.3, 0, Math.PI * 2);
				ctx.fillStyle = c.sky;
				ctx.globalAlpha = 0.65;
				ctx.fill();
				ctx.globalAlpha = 1;
			});
			train.forEach(function (p) {
				ctx.beginPath();
				ctx.arc(px(p.x), py(p.y), 4.2, 0, Math.PI * 2);
				ctx.fillStyle = c.green;
				ctx.fill();
				ctx.strokeStyle = c.card;
				ctx.lineWidth = 1.4;
				ctx.stroke();
			});
			var tr = train.reduce(function (a, p) { var e = evalPoly(coef, p.x) - p.y; return a + e * e; }, 0) / train.length;
			var te = test.reduce(function (a, p) { var e = evalPoly(coef, p.x) - p.y; return a + e * e; }, 0) / test.length;
			if (trainOut) trainOut.textContent = tr.toFixed(3);
			if (testOut) testOut.textContent = te.toFixed(3);
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		if (degree) degree.addEventListener("input", function () { api.redraw(); });
		api.redraw();
	}

	/* ── activation ─────────────────────────────────────────── */

	function erf(x) {
		var sign = x < 0 ? -1 : 1;
		x = Math.abs(x);
		var t = 1 / (1 + 0.3275911 * x);
		var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
		return sign * y;
	}
	function initActivation(root) {
		var canvas = $("[data-activation-canvas]", root);
		var chips = $$("[data-activation]", root);
		var name = $("[data-activation-name]", root);
		var range = $("[data-activation-range]", root);
		var shape = $("[data-activation-shape]", root);
		if (!canvas) return;
		var fns = {
			relu: { fn: function (z) { return Math.max(0, z); }, ymin: -0.6, ymax: 4.2, range: "0 … ∞", shape: "not injective" },
			tanh: { fn: Math.tanh, ymin: -1.2, ymax: 1.2, range: "−1 … 1", shape: "strictly increasing" },
			sigmoid: { fn: function (z) { return 1 / (1 + Math.exp(-z)); }, ymin: -0.15, ymax: 1.15, range: "0 … 1", shape: "strictly increasing" },
			gelu: { fn: function (z) { return 0.5 * z * (1 + erf(z / Math.SQRT2)); }, ymin: -0.6, ymax: 4.2, range: "≈ −0.17 … ∞", shape: "not monotonic" }
		};
		var current = "relu";
		function draw(ctx, W, H) {
			var c = colors();
			var spec = fns[current];
			var pad = 28, xmin = -4, xmax = 4;
			function px(x) { return pad + (x - xmin) / (xmax - xmin) * (W - pad * 2); }
			function py(y) { return H - pad - (y - spec.ymin) / (spec.ymax - spec.ymin) * (H - pad * 2); }
			ctx.clearRect(0, 0, W, H);
			ctx.strokeStyle = c.lineStrong;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(px(xmin), py(0)); ctx.lineTo(px(xmax), py(0));
			ctx.moveTo(px(0), py(spec.ymin)); ctx.lineTo(px(0), py(spec.ymax));
			ctx.stroke();
			ctx.strokeStyle = c.green;
			ctx.lineWidth = 3;
			ctx.beginPath();
			for (var i = 0; i <= 160; i++) {
				var x = xmin + (xmax - xmin) * i / 160;
				var y = spec.fn(x);
				if (i) ctx.lineTo(px(x), py(y)); else ctx.moveTo(px(x), py(y));
			}
			ctx.stroke();
			ctx.fillStyle = c.faint;
			ctx.font = "11px Barlow, system-ui, sans-serif";
			ctx.fillText("z", W - 18, py(0) - 8);
			ctx.fillText("f(z)", px(0) + 8, 16);
			if (name) name.textContent = current.toUpperCase();
			if (range) range.textContent = spec.range;
			if (shape) shape.textContent = spec.shape;
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		chips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				chips.forEach(function (x) { x.classList.remove("is-on"); });
				chip.classList.add("is-on");
				current = chip.getAttribute("data-activation");
				api.redraw();
			});
		});
		api.redraw();
	}

	/* ── data mix ───────────────────────────────────────────── */

	function initDataMix(root) {
		var bar = $("[data-mix-bar]", root);
		var legend = $("[data-mix-legend]", root);
		var note = $("[data-mix-note]", root);
		if (!bar || !legend) return;
		var data = [
			{ name: "Web", pct: 55, c: "var(--tm-sky)", note: "Common Crawl and similar: huge, noisy, heavily filtered." },
			{ name: "Code", pct: 13, c: "var(--tm-green)", note: "GitHub and similar: crucial for programming and structured reasoning." },
			{ name: "Books", pct: 8, c: "var(--tm-gold)", note: "Long-form text: structure, argument, and narrative." },
			{ name: "Papers", pct: 4, c: "var(--tm-coral)", note: "Scientific writing: precise claims and references." },
			{ name: "Wikipedia", pct: 2, c: "var(--tm-petrol)", note: "Reference text: compact factual prose." },
			{ name: "Math", pct: 4, c: "var(--tm-lime)", note: "Synthetic and curated problems: symbolic reasoning." },
			{ name: "Conversation", pct: 4, c: "var(--tm-faint)", note: "Curated dialogues and instruction data." },
			{ name: "Multimodal", pct: 10, c: "var(--tm-blue)", note: "Image captions, alt-text, and paired media." }
		];
		bar.innerHTML = data.map(function (d, i) {
			return '<span class="mix-seg" data-mix-i="' + i + '" style="flex:' + d.pct + ';background:' + d.c + '" title="' + escapeHtml(d.name + " · " + d.pct + "%") + '"></span>';
		}).join("");
		legend.innerHTML = data.map(function (d, i) {
			return '<button type="button" data-mix-i="' + i + '"><i style="background:' + d.c + '"></i>' + escapeHtml(d.name) + ' · ' + d.pct + '%</button>';
		}).join("");
		var chosen = -1;
		function select(i) {
			chosen = chosen === i ? -1 : i;
			$$(".mix-seg", bar).forEach(function (seg, j) { seg.classList.toggle("is-dim", chosen !== -1 && j !== chosen); });
			$$("button", legend).forEach(function (btn, j) { btn.classList.toggle("is-on", j === chosen); });
			if (note) note.textContent = chosen === -1 ? "Hover or tap a source to see what it contributes. The mix is approximate; labs differ." : data[chosen].note;
		}
		$$("[data-mix-i]", bar).concat($$("[data-mix-i]", legend)).forEach(function (el) {
			el.addEventListener("click", function () { select(parseInt(el.getAttribute("data-mix-i"), 10)); });
		});
		select(-1);
	}

	/* ── convolution ────────────────────────────────────────── */

	function initConvolution(root) {
		var canvas = $("[data-conv-canvas]", root);
		var chips = $$("[data-kernel]", root);
		var inputSizeEl = $("[data-conv-input-size]", root);
		var outputSizeEl = $("[data-conv-output-size]", root);
		if (!canvas) return;
		var size = 14;
		var input = [];
		for (var y = 0; y < size; y++) {
			input.push([]);
			for (var x = 0; x < size; x++) {
				var dx = x - (size - 1) / 2, dy = y - (size - 1) / 2;
				input[y].push(dx * dx + dy * dy < 18 ? 1 : 0);
			}
		}
		var kernels = {
			edge: [ [-1, -1, -1], [-1, 8, -1], [-1, -1, -1] ],
			blur: [ [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9] ],
			sharpen: [ [0, -1, 0], [-1, 5, -1], [0, -1, 0] ],
			"sobel-h": [ [-1, -2, -1], [0, 0, 0], [1, 2, 1] ],
			"sobel-v": [ [-1, 0, 1], [-2, 0, 2], [-1, 0, 1] ],
			emboss: [ [-2, -1, 0], [-1, 1, 1], [0, 1, 2] ]
		};
		var current = "edge";
		var imageLoaded = false;
		function conv(kernel) {
			var out = [];
			for (var y = 1; y < size - 1; y++) {
				out.push([]);
				for (var x = 1; x < size - 1; x++) {
					var s = 0;
					for (var ky = -1; ky <= 1; ky++) for (var kx = -1; kx <= 1; kx++) {
						s += input[y + ky][x + kx] * kernel[ky + 1][kx + 1];
					}
					out[y - 1].push(s);
				}
			}
			return out;
		}
		function draw(ctx, W, H) {
			var c = colors();
			var out = conv(kernels[current]);
			var pad = 18, gap = 36;
			var cell = Math.min((W - pad * 2 - gap) / (size + size - 2), (H - pad * 2 - 26) / size);
			var ox = pad, oy = pad + 18;
			ctx.clearRect(0, 0, W, H);
			ctx.font = "600 11px Barlow, system-ui, sans-serif";
			ctx.fillStyle = c.muted;
			ctx.fillText(imageLoaded ? "input · stop sign" : "input", ox, pad + 4);
			ctx.fillText("feature map · " + current, ox + size * cell + gap, pad + 4);
			for (var y = 0; y < size; y++) {
				for (var x = 0; x < size; x++) {
					var v = clamp(input[y][x], 0, 1);
					ctx.fillStyle = rgb(mix(hexToRgb(c.petrol), hexToRgb(c.card), v));
					ctx.fillRect(ox + x * cell, oy + y * cell, cell - 1, cell - 1);
				}
			}
			var flat = [];
			out.forEach(function (row) { row.forEach(function (v) { flat.push(v); }); });
			var mn = Math.min.apply(null, flat), mx = Math.max.apply(null, flat);
			var span = mx - mn || 1;
			var ox2 = ox + size * cell + gap;
			for (var yy = 0; yy < out.length; yy++) {
				for (var xx = 0; xx < out[yy].length; xx++) {
					var t = Math.abs(out[yy][xx] - mn) / span;
					ctx.fillStyle = rgb(mix(hexToRgb(c.paper2), hexToRgb(c.green), t));
					ctx.fillRect(ox2 + xx * cell, oy + yy * cell, cell - 1, cell - 1);
				}
			}
			if (inputSizeEl) inputSizeEl.textContent = size + " × " + size;
			if (outputSizeEl) outputSizeEl.textContent = (size - 2) + " × " + (size - 2);
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		var img = new Image();
		img.onload = function () {
			var n = 32;
			var off = document.createElement("canvas");
			off.width = n; off.height = n;
			var octx = off.getContext("2d");
			try { octx.drawImage(img, 0, 0, n, n); } catch (err) { return; }
			var data;
			try { data = octx.getImageData(0, 0, n, n).data; } catch (err) { return; }
			var grid = [];
			for (var y = 0; y < n; y++) {
				grid.push([]);
				for (var x = 0; x < n; x++) {
					var i = (y * n + x) * 4;
					grid[y].push((data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255);
				}
			}
			input = grid;
			size = n;
			imageLoaded = true;
			api.redraw();
		};
		img.src = "../stop_sign.jpg";
		chips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				chips.forEach(function (x) { x.classList.remove("is-on"); });
				chip.classList.add("is-on");
				current = chip.getAttribute("data-kernel");
				api.redraw();
			});
		});
		api.redraw();
	}

	/* ── vram calculator ────────────────────────────────────── */

	function initVram(root) {
		var model = $("[data-vram-model]", root);
		var bits = $("[data-vram-bits]", root);
		var device = $("[data-vram-device]", root);
		var mem = $("[data-vram-mem]", root);
		var fit = $("[data-vram-fit]", root);
		var note = $("[data-vram-note]", root);
		if (!model || !bits || !device) return;
		function render() {
			var p = parseFloat(model.value) || 7;
			var b = parseFloat(bits.value) || 4;
			var cap = parseFloat(device.value) || 16;
			var gb = p * b / 8 * 1.2;
			if (mem) mem.textContent = gb.toFixed(1) + " GB";
			var ok = gb <= cap * 0.85 ? "fits comfortably" : (gb <= cap ? "tight fit" : "does not fit");
			if (fit) {
				fit.textContent = ok;
				fit.className = gb <= cap ? "fits-yes" : "fits-no";
			}
			if (note) note.textContent = "Weights plus rough runtime overhead. Context length and KV cache can add several more gigabytes.";
		}
		[model, bits, device].forEach(function (el) { el.addEventListener("change", render); });
		render();
	}

	/* ── context budget ─────────────────────────────────────── */

	function initBudget(root) {
		var range = $("[data-budget-window]", root);
		var out = $("[data-budget-window-out]", root);
		var rows = $$("[data-budget-block]", root);
		var free = $("[data-budget-free]", root);
		if (!range || !rows.length) return;
		function render() {
			var win = parseInt(range.value, 10) * 1000;
			if (out) out.textContent = (win / 1000) + "k tokens";
			var used = 0;
			rows.forEach(function (row) {
				var tokens = parseInt(row.getAttribute("data-tokens"), 10) || 0;
				var required = row.getAttribute("data-required") === "1";
				var fits = required || used + tokens <= win;
				if (fits) used += tokens;
				row.classList.toggle("is-dropped", !fits);
				var fill = $(".budget-fill", row);
				var track = $(".budget-track", row);
				if (fill && track) fill.style.width = Math.min(100, tokens / win * 100) + "%";
			});
			if (free) free.textContent = Math.max(0, win - used).toLocaleString() + " tokens free";
		}
		range.addEventListener("input", render);
		render();
	}

	/* ── retrieval ──────────────────────────────────────────── */

	function initRetrieval(root) {
		var list = $("[data-retrieval-list]", root);
		var run = $("[data-retrieval-run]", root);
		var queryChips = $$("[data-retrieval-query]", root);
		var top = $("[data-retrieval-top]", root);
		var countEl = $("[data-retrieval-count]", root);
		var scoreEl = $("[data-retrieval-score]", root);
		var promptEl = $("[data-retrieval-prompt]", root);
		var query = "Eiffel Tower height";
		if (!list) return;
		var chunks = [
			{ title: "Eiffel Tower", text: "The Eiffel Tower in Paris is 330 metres tall and was completed in 1889 for the World's Fair.", vec: [ 0.95, 0.05, 0.05, 0.05 ] },
			{ title: "Paris tourism", text: "Paris attracts millions of visitors; the tower is one of the most visited monuments in the world.", vec: [ 0.8, 0.1, 0.0, 0.1 ] },
			{ title: "RAG pipeline", text: "Retrieval-augmented generation chunks documents, embeds them, retrieves passages, and puts them in the prompt.", vec: [ 0.0, 0.95, 0.2, 0.1 ] },
			{ title: "Vector databases", text: "Vector databases store embeddings and support approximate nearest-neighbour search over them.", vec: [ 0.0, 0.3, 0.95, 0.0 ] },
			{ title: "Prompt engineering", text: "A clear role, specific constraints, and examples reduce ambiguity in a language-model prompt.", vec: [ 0.0, 0.1, 0.0, 0.95 ] }
		];
		var queries = {
			"Eiffel Tower height": [ 0.95, 0.05, 0.0, 0.05 ],
			"RAG pipeline": [ 0.0, 0.95, 0.2, 0.1 ],
			"vector database": [ 0.0, 0.2, 0.95, 0.0 ]
		};
		var TOP_K = 2;
		function cosine(a, b) {
			var dot = 0, na = 0, nb = 0;
			for (var i = 0; i < a.length; i++) {
				dot += a[i] * b[i];
				na += a[i] * a[i];
				nb += b[i] * b[i];
			}
			return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
		}
		function render() {
			var q = queries[query] || queries["Eiffel Tower height"];
			var ranked = chunks.map(function (c) {
				return { c: c, s: cosine(c.vec, q) };
			}).sort(function (a, b) { return b.s - a.s; });
			var selected = ranked.slice(0, TOP_K);
			var inPrompt = {};
			selected.forEach(function (r, i) { inPrompt[r.c.title] = i + 1; });
			list.innerHTML = ranked.map(function (r) {
				var ins = inPrompt[r.c.title];
				return '<div class="retrieval-item' + (ins ? " is-hit" : "") + '">' +
					'<div><b>' + escapeHtml(r.c.title) + '</b><p>' + escapeHtml(r.c.text) + '</p></div>' +
					'<span class="retrieval-score">cos ' + r.s.toFixed(2) + (ins ? ' · in prompt' : '') + '</span></div>';
			}).join("");
			if (top) top.textContent = ranked[0].c.title;
			if (countEl) countEl.textContent = selected.length + " of " + chunks.length;
			if (scoreEl) scoreEl.textContent = ranked[0].s.toFixed(2);
			if (promptEl) {
				promptEl.textContent = "Context:\n" + selected.map(function (r, i) {
					return "[" + (i + 1) + "] " + r.c.title + " — " + r.c.text;
				}).join("\n\n") + "\n\nQuestion: " + query + "\nAnswer:";
			}
		}
		queryChips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				queryChips.forEach(function (x) { x.classList.remove("is-on"); });
				chip.classList.add("is-on");
				query = chip.getAttribute("data-retrieval-query");
				render();
			});
		});
		if (run) run.addEventListener("click", render);
		render();
	}

	/* ── prompt entropy ─────────────────────────────────────── */

	function initEntropy(root) {
		var chips = $$("[data-entropy]", root);
		var bar = $("[data-entropy-bar]", root);
		var value = $("[data-entropy-value]", root);
		var preview = $("[data-entropy-prompt]", root);
		if (!chips.length || !bar) return;
		var labels = { role: "You are a patient tutor.", format: "Answer in three bullet points.", examples: "Example: ...", constraints: "Do not invent sources." };
		function render() {
			var on = chips.filter(function (c) { return c.classList.contains("is-on"); }).map(function (c) { return c.getAttribute("data-entropy"); });
			var left = Math.max(8, 100 - on.length * 22);
			bar.style.width = left + "%";
			if (value) value.textContent = left + "%";
			if (preview) preview.textContent = on.length ? on.map(function (k) { return labels[k]; }).join(" ") : "Tell me about AI.";
		}
		chips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				chip.classList.toggle("is-on");
				render();
			});
		});
		render();
	}

	/* ── chain of thought ───────────────────────────────────── */

	function initCot(root) {
		var chips = $$("[data-cot-mode]", root);
		var steps = $$("[data-cot-step]", root);
		var answer = $("[data-cot-answer]", root);
		if (!chips.length || !steps.length) return;
		function render() {
			var stepMode = chips[1] && chips[1].classList.contains("is-on");
			steps.forEach(function (step, i) {
				step.classList.toggle("is-on", stepMode ? i <= 3 : false);
			});
			if (answer) answer.textContent = stepMode ? "Answer: $0.05." : "Answer: $0.05.";
		}
		chips.forEach(function (chip, i) {
			chip.addEventListener("click", function () {
				chips.forEach(function (x) { x.classList.remove("is-on"); });
				chip.classList.add("is-on");
				render();
			});
		});
		render();
	}

	/* ── timeline / stepper ─────────────────────────────────── */

	function initTimeline(root) {
		var track = $("[data-timeline-track]", root);
		var panel = $("[data-timeline-panel]", root);
		var prev = $("[data-timeline-prev]", root);
		var next = $("[data-timeline-next]", root);
		if (!track || !panel) return;
		var nodes = $$(".tl-node", track);
		function select(i) {
			nodes.forEach(function (n, j) { n.classList.toggle("is-active", i === j); });
			var n = nodes[i];
			if (!n) return;
			var href = n.getAttribute("data-href");
			var hrefLabel = n.getAttribute("data-href-label") || "Explore this section";
			var link = href ? '<p class="tl-link"><a class="btn btn--green" href="' + href + '">' + escapeHtml(hrefLabel) + ' →</a></p>' : "";
			panel.innerHTML = '<div class="tl-era">' + escapeHtml(n.getAttribute("data-meta") || "") + '</div>' +
				'<h3>' + escapeHtml(n.getAttribute("data-title") || "") + '</h3>' +
				'<p>' + escapeHtml(n.getAttribute("data-body") || "") + '</p>' + link;
		}
		nodes.forEach(function (n, i) {
			n.addEventListener("click", function () { select(i); n.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); });
		});
		if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -160, behavior: "smooth" }); });
		if (next) next.addEventListener("click", function () { track.scrollBy({ left: 160, behavior: "smooth" }); });
		select(0);
	}

	/* ── contamination ──────────────────────────────────────── */

	function initContamination(root) {
		var range = $("[data-contam]", root);
		var out = $("[data-contam-out]", root);
		var score = $("[data-contam-score]", root);
		var scoreVal = $("[data-contam-score-val]", root);
		var skill = $("[data-contam-skill]", root);
		var skillVal = $("[data-contam-skill-val]", root);
		if (!range || !score || !skill) return;
		function render() {
			var t = parseInt(range.value, 10) / 100;
			var trueSkill = 55;
			var reported = Math.min(100, trueSkill + t * 45);
			if (out) out.textContent = Math.round(t * 100) + "%";
			score.style.width = reported + "%";
			skill.style.width = trueSkill + "%";
			if (scoreVal) scoreVal.textContent = Math.round(reported) + "%";
			if (skillVal) skillVal.textContent = trueSkill + "%";
		}
		range.addEventListener("input", render);
		render();
	}

	/* ── position heatmap ───────────────────────────────────── */

	function initPosition(root) {
		var canvas = $("[data-position-canvas]", root);
		var range = $("[data-position-row]", root);
		var out = $("[data-position-row-out]", root);
		if (!canvas) return;
		var P = 32, D = 32;
		function value(pos, dim) {
			var pair = Math.floor(dim / 2);
			var angle = pos / Math.pow(10000, (2 * pair) / D);
			return dim % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
		}
		function draw(ctx, W, H) {
			var c = colors();
			var row = parseInt(range && range.value, 10) || 0;
			if (out) out.textContent = "position " + row;
			var pad = 22, cell = Math.min((W - pad * 2) / D, (H - pad * 2) / P);
			var ox = (W - cell * D) / 2, oy = (H - cell * P) / 2;
			ctx.clearRect(0, 0, W, H);
			var cold = hexToRgb(c.sky), zero = hexToRgb(c.paper2), hot = hexToRgb(c.green);
			for (var y = 0; y < P; y++) {
				for (var x = 0; x < D; x++) {
					var v = value(y, x);
					var t = Math.abs(v);
					var col = v >= 0 ? mix(zero, hot, t) : mix(zero, cold, t);
					ctx.fillStyle = rgb(col);
					ctx.fillRect(ox + x * cell, oy + y * cell, cell - 0.5, cell - 0.5);
				}
			}
			ctx.strokeStyle = c.petrol;
			ctx.lineWidth = 2;
			ctx.strokeRect(ox, oy + row * cell, cell * D, cell);
			ctx.fillStyle = c.muted;
			ctx.font = "11px Barlow, system-ui, sans-serif";
			ctx.fillText("dimension →", ox, H - 4);
			ctx.save();
			ctx.translate(10, oy + cell * P / 2);
			ctx.rotate(-Math.PI / 2);
			ctx.fillText("position →", 0, 0);
			ctx.restore();
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		if (range) range.addEventListener("input", function () { api.redraw(); });
		api.redraw();
	}

	/* ── waveform ───────────────────────────────────────────── */

	function initWaveform(root) {
		var canvas = $("[data-wave-canvas]", root);
		var range = $("[data-wave-tokens]", root);
		var out = $("[data-wave-tokens-out]", root);
		if (!canvas) return;
		function draw(ctx, W, H) {
			var c = colors();
			var n = parseInt(range && range.value, 10) || 32;
			if (out) out.textContent = n + " tokens";
			ctx.clearRect(0, 0, W, H);
			var mid = H * 0.34, amp = H * 0.23;
			ctx.strokeStyle = c.petrol;
			ctx.lineWidth = 2;
			ctx.beginPath();
			for (var i = 0; i <= 300; i++) {
				var t = i / 300;
				var y = Math.sin(t * 38) * 0.55 + Math.sin(t * 91) * 0.25 + Math.sin(t * 13) * 0.2;
				var px = 16 + t * (W - 32);
				ctx.lineTo(px, mid - y * amp);
			}
			ctx.stroke();
			var y0 = H * 0.66, h = 22;
			var gap = 3, w = (W - 32 - gap * (n - 1)) / n;
			var cols = [c.green, c.sky, c.gold, c.coral, c.lime, c.petrol];
			for (var k = 0; k < n; k++) {
				ctx.fillStyle = cols[k % cols.length];
				ctx.fillRect(16 + k * (w + gap), y0, Math.max(2, w), h);
			}
			ctx.fillStyle = c.muted;
			ctx.font = "11px Barlow, system-ui, sans-serif";
			ctx.fillText("waveform", 16, 16);
			ctx.fillText("tokens", 16, y0 - 8);
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		if (range) range.addEventListener("input", function () { api.redraw(); });
		api.redraw();
	}

	/* ── retrieval space ───────────────────────────────────── */

	function initRagSpace(root) {
		var canvas = $("[data-ragspace-canvas]", root);
		var chips = $$("[data-ragquery]", root);
		var queryEl = $("[data-ragspace-query]", root);
		var topEl = $("[data-ragspace-top]", root);
		var distEl = $("[data-ragspace-dist]", root);
		if (!canvas) return;
		var chunks = [
			{ label: "Eiffel Tower", x: 0.18, y: 0.28, c: "green" },
			{ label: "Paris tourism", x: 0.30, y: 0.38, c: "sky" },
			{ label: "RAG pipeline", x: 0.74, y: 0.70, c: "gold" },
			{ label: "Vector DB", x: 0.82, y: 0.62, c: "lilac" },
			{ label: "Prompting", x: 0.52, y: 0.20, c: "grey" },
			{ label: "Fine-tuning", x: 0.64, y: 0.44, c: "teal" }
		];
		var queries = {
			eiffel: { x: 0.21, y: 0.31, label: "Eiffel Tower height" },
			rag: { x: 0.75, y: 0.68, label: "RAG pipeline" },
			vectors: { x: 0.80, y: 0.64, label: "vector database" }
		};
		var current = "eiffel";
		function colorOf(name) {
			var c = colors();
			return { green: c.green, sky: c.sky, gold: c.gold, lilac: c.coral, grey: c.faint, teal: c.petrol }[name] || c.muted;
		}
		function draw(ctx, W, H) {
			var c = colors();
			var q = queries[current];
			var pad = 34;
			function px(x) { return pad + x * (W - pad * 2); }
			function py(y) { return H - pad - y * (H - pad * 2); }
			ctx.clearRect(0, 0, W, H);
			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(px(0), py(0)); ctx.lineTo(px(1), py(0));
			ctx.moveTo(px(0), py(0)); ctx.lineTo(px(0), py(1));
			ctx.stroke();
			var ranked = chunks.map(function (ch) {
				var dx = ch.x - q.x, dy = ch.y - q.y;
				return { ch: ch, d: Math.sqrt(dx * dx + dy * dy) };
			}).sort(function (a, b) { return a.d - b.d; });
			ranked.slice(0, 2).forEach(function (r, i) {
				ctx.strokeStyle = i === 0 ? c.green : c.sky;
				ctx.globalAlpha = i === 0 ? 0.9 : 0.45;
				ctx.beginPath();
				ctx.moveTo(px(q.x), py(q.y));
				ctx.lineTo(px(r.ch.x), py(r.ch.y));
				ctx.stroke();
				ctx.globalAlpha = 1;
			});
			chunks.forEach(function (ch) {
				ctx.beginPath();
				ctx.arc(px(ch.x), py(ch.y), 7, 0, Math.PI * 2);
				ctx.fillStyle = colorOf(ch.c);
				ctx.fill();
				ctx.strokeStyle = c.card;
				ctx.lineWidth = 2;
				ctx.stroke();
				ctx.fillStyle = c.muted;
				ctx.font = "600 10px Barlow, system-ui, sans-serif";
				ctx.fillText(ch.label, px(ch.x) + 10, py(ch.y) + 3);
			});
			var qx = px(q.x), qy = py(q.y);
			ctx.beginPath();
			ctx.moveTo(qx, qy - 9); ctx.lineTo(qx + 9, qy); ctx.lineTo(qx, qy + 9); ctx.lineTo(qx - 9, qy);
			ctx.closePath();
			ctx.fillStyle = c.ink;
			ctx.fill();
			ctx.strokeStyle = c.paper2;
			ctx.lineWidth = 2;
			ctx.stroke();
			if (queryEl) queryEl.textContent = q.label;
			if (topEl) topEl.textContent = ranked[0].ch.label;
			if (distEl) distEl.textContent = ranked[0].d.toFixed(2);
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		chips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				chips.forEach(function (x) { x.classList.remove("is-on"); });
				chip.classList.add("is-on");
				current = chip.getAttribute("data-ragquery");
				var q = queries[current];
				var ranked = chunks.map(function (ch) {
					var dx = ch.x - q.x, dy = ch.y - q.y;
					return { ch: ch, d: Math.sqrt(dx * dx + dy * dy) };
				}).sort(function (a, b) { return a.d - b.d; });
				if (queryEl) queryEl.textContent = q.label;
				if (topEl) topEl.textContent = ranked[0].ch.label;
				if (distEl) distEl.textContent = ranked[0].d.toFixed(2);
				api.redraw();
			});
		});
		api.redraw();
	}

	/* ── multimodal alignment ───────────────────────────────── */

	function initAlign(root) {
		var canvas = $("[data-align-canvas]", root);
		var btn = $("[data-align-toggle]", root);
		var stateEl = $("[data-align-state]", root);
		var simEl = $("[data-align-sim]", root);
		if (!canvas) return;
		var left = [
			{ label: "dog", x: 0.22, y: 0.72 },
			{ label: "cat", x: 0.34, y: 0.56 },
			{ label: "car", x: 0.62, y: 0.30 },
			{ label: "tree", x: 0.78, y: 0.52 },
			{ label: "house", x: 0.66, y: 0.78 }
		];
		var right = [
			{ label: "dog", x: 0.18, y: 0.30 },
			{ label: "cat", x: 0.42, y: 0.22 },
			{ label: "car", x: 0.72, y: 0.70 },
			{ label: "tree", x: 0.82, y: 0.28 },
			{ label: "house", x: 0.52, y: 0.46 }
		];
		var t = 0, target = 0, raf = null;
		function draw(ctx, W, H) {
			var c = colors();
			var pad = 26, mid = W / 2;
			ctx.clearRect(0, 0, W, H);
			ctx.strokeStyle = c.lineStrong;
			ctx.beginPath();
			ctx.moveTo(mid, pad); ctx.lineTo(mid, H - pad);
			ctx.stroke();
			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.fillText("image embeddings", pad, pad - 8);
			ctx.fillText("text embeddings", mid + 14, pad - 8);
			function point(panel, p) {
				var x = panel === 0 ? p.x * (mid - pad * 2) + pad : mid + pad + p.x * (mid - pad * 2);
				var y = H - pad - p.y * (H - pad * 2);
				return { x: x, y: y };
			}
			left.forEach(function (p, i) {
				var a = point(0, p);
				var q = right[i];
				var b = point(1, { x: lerp(q.x, p.x, t), y: lerp(q.y, p.y, t) });
				if (t > 0.35) {
					ctx.strokeStyle = c.green;
					ctx.globalAlpha = (t - 0.35) / 0.65;
					ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
					ctx.globalAlpha = 1;
				}
				[ a, b ].forEach(function (pt, j) {
					ctx.beginPath();
					ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
					ctx.fillStyle = j === 0 ? c.sky : c.gold;
					ctx.fill();
					ctx.strokeStyle = c.card;
					ctx.lineWidth = 2;
					ctx.stroke();
					ctx.fillStyle = c.muted;
					ctx.font = "600 10px Barlow, system-ui, sans-serif";
					ctx.fillText(p.label, pt.x + 11, pt.y + 3);
				});
			});
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		function animate() {
			raf = null;
			var diff = target - t;
			if (Math.abs(diff) < 0.01) {
				t = target;
				api.redraw();
				if (stateEl) stateEl.textContent = t > 0.5 ? "aligned" : "separate";
				if (simEl) simEl.textContent = t > 0.5 ? "high" : "low";
				return;
			}
			t += diff * 0.18;
			api.redraw();
			raf = requestAnimationFrame(animate);
		}
		if (btn) btn.addEventListener("click", function () {
			target = target > 0.5 ? 0 : 1;
			btn.textContent = target > 0.5 ? "Separate the spaces →" : "Align the spaces →";
			if (stateEl) stateEl.textContent = target > 0.5 ? "aligned" : "separate";
			if (simEl) simEl.textContent = target > 0.5 ? "high" : "low";
			if (!raf) raf = requestAnimationFrame(animate);
		});
		api.redraw();
	}

	/* ── preference pair ────────────────────────────────────── */

	function initPreference(root) {
		var cards = $$("[data-pref]", root);
		var choice = $("[data-pref-choice]", root);
		var signal = $("[data-pref-signal]", root);
		var next = $("[data-pref-next]", root);
		var question = $("[data-pref-question]", root);
		if (!cards.length) return;
		var pairs = [
			{
				q: "Explain photosynthesis to a 10-year-old.",
				a: "Plants use sunlight to turn water and air into food. They release oxygen, which is the air we breathe.",
				b: "Photosynthesis is a biochemical process involving chlorophyll, photons, and the Calvin cycle."
			},
			{
				q: "Why does the sky look blue?",
				a: "Sunlight contains all colours. Air scatters the short blue wavelengths more than the long red ones, so blue reaches your eyes from every direction.",
				b: "Rayleigh scattering."
			}
		];
		var idx = 0;
		function render() {
			var p = pairs[idx];
			if (question) question.textContent = p.q;
			cards[0].querySelector("p").textContent = p.a;
			cards[1].querySelector("p").textContent = p.b;
			cards.forEach(function (c) { c.classList.remove("is-on"); });
			if (choice) choice.textContent = "—";
			if (signal) signal.textContent = "—";
		}
		cards.forEach(function (card) {
			card.addEventListener("click", function () {
				cards.forEach(function (c) { c.classList.remove("is-on"); });
				card.classList.add("is-on");
				var chosen = card.getAttribute("data-pref");
				if (choice) choice.textContent = chosen === "a" ? "Answer A" : "Answer B";
				if (signal) signal.textContent = chosen === "a" ? "A > B" : "B > A";
			});
		});
		if (next) next.addEventListener("click", function () { idx = (idx + 1) % pairs.length; render(); });
		render();
	}

	/* ── Mary's Room ────────────────────────────────────────── */

	function initMary(root) {
		var room = $("[data-mary-room]", root);
		var btn = $("[data-mary-toggle]", root);
		var cap = $("[data-mary-caption]", root);
		if (!room || !btn) return;
		var on = false;
		btn.addEventListener("click", function () {
			on = !on;
			room.classList.toggle("is-color", on);
			btn.textContent = on ? "Back to the grey room →" : "Let Mary see red →";
			if (cap) cap.textContent = on ? "Mary sees red for the first time. Does she learn a new fact, or something else?" : "Mary knows every physical fact about red. The room is still grey.";
		});
	}

	/* ── logit lens ─────────────────────────────────────────── */

	function initLogitLens(root) {
		var bars = $("[data-lens-bars]", root);
		var range = $("[data-lens-layer]", root);
		var out = $("[data-lens-layer-out]", root);
		var top = $("[data-lens-top]", root);
		var paris = $("[data-lens-paris]", root);
		var name = $("[data-lens-layer-name]", root);
		if (!bars || !range) return;
		var tokens = [ "the", "city", "capital", "France", "Lyon", "Paris" ];
		var layers = [
			[ 0.28, 0.21, 0.18, 0.14, 0.11, 0.08 ],
			[ 0.12, 0.26, 0.24, 0.18, 0.12, 0.08 ],
			[ 0.05, 0.10, 0.30, 0.25, 0.18, 0.12 ],
			[ 0.03, 0.04, 0.08, 0.18, 0.34, 0.33 ],
			[ 0.01, 0.02, 0.03, 0.06, 0.22, 0.66 ],
			[ 0.01, 0.01, 0.01, 0.02, 0.08, 0.87 ],
			[ 0.00, 0.00, 0.00, 0.01, 0.03, 0.96 ]
		];
		var names = [ "embedding", "block 1", "block 2", "block 3", "block 4", "block 5", "output" ];
		function render() {
			var l = parseInt(range.value, 10) || 0;
			if (out) out.textContent = l;
			if (name) name.textContent = names[l];
			var probs = layers[l];
			var maxI = probs.indexOf(Math.max.apply(null, probs));
			if (top) top.textContent = tokens[maxI];
			if (paris) paris.textContent = Math.round(probs[5] * 100) + "%";
			bars.innerHTML = tokens.map(function (tok, i) {
				return '<div class="dist-row"><span class="dist-label">' + tok + '</span><span class="dist-track"><span class="dist-fill" style="width:' + (probs[i] * 100).toFixed(1) + '%;background:var(--tm-' + (i === 5 ? "green" : "sky") + ')"></span></span><span class="dist-val">' + Math.round(probs[i] * 100) + '%</span></div>';
			}).join("");
		}
		range.addEventListener("input", render);
		render();
	}

	/* ── vision layers ──────────────────────────────────────── */

	function initVisionLayers(root) {
		var canvas = $("[data-vision-canvas]", root);
		var chips = $$("[data-vision-layer]", root);
		var label = $("[data-vision-label]", root);
		var feature = $("[data-vision-feature]", root);
		var field = $("[data-vision-field]", root);
		if (!canvas) return;
		var current = "edges";
		function draw(ctx, W, H) {
			var c = colors();
			var cx = W / 2, cy = H / 2 + 10, r = Math.min(W, H) * 0.26;
			ctx.clearRect(0, 0, W, H);
			ctx.strokeStyle = c.petrol;
			ctx.fillStyle = c.card;
			ctx.lineWidth = 3;
			if (current === "object") {
				ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = c.gold; ctx.fill(); ctx.stroke();
				ctx.beginPath(); ctx.moveTo(cx - r * 0.75, cy - r * 0.65); ctx.lineTo(cx - r * 0.4, cy - r * 1.15); ctx.lineTo(cx - r * 0.1, cy - r * 0.85); ctx.closePath(); ctx.fillStyle = c.gold; ctx.fill(); ctx.stroke();
				ctx.beginPath(); ctx.moveTo(cx + r * 0.75, cy - r * 0.65); ctx.lineTo(cx + r * 0.4, cy - r * 1.15); ctx.lineTo(cx + r * 0.1, cy - r * 0.85); ctx.closePath(); ctx.fillStyle = c.gold; ctx.fill(); ctx.stroke();
			} else {
				ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
				ctx.beginPath(); ctx.moveTo(cx - r * 0.75, cy - r * 0.65); ctx.lineTo(cx - r * 0.4, cy - r * 1.15); ctx.lineTo(cx - r * 0.1, cy - r * 0.85); ctx.stroke();
				ctx.beginPath(); ctx.moveTo(cx + r * 0.75, cy - r * 0.65); ctx.lineTo(cx + r * 0.4, cy - r * 1.15); ctx.lineTo(cx + r * 0.1, cy - r * 0.85); ctx.stroke();
			}
			if (current !== "edges") {
				ctx.beginPath(); ctx.arc(cx - r * 0.35, cy - r * 0.1, r * 0.12, 0, Math.PI * 2); ctx.fillStyle = c.petrol; ctx.fill();
				ctx.beginPath(); ctx.arc(cx + r * 0.35, cy - r * 0.1, r * 0.12, 0, Math.PI * 2); ctx.fill();
				ctx.beginPath(); ctx.moveTo(cx, cy + r * 0.1); ctx.lineTo(cx - r * 0.1, cy + r * 0.25); ctx.lineTo(cx + r * 0.1, cy + r * 0.25); ctx.closePath(); ctx.fillStyle = c.coral; ctx.fill();
			}
			if (current === "object") {
				ctx.strokeStyle = c.petrol;
				ctx.lineWidth = 2;
				[-1, 1].forEach(function (s) {
					for (var i = 0; i < 3; i++) {
						ctx.beginPath();
						ctx.moveTo(cx + s * r * 0.3, cy + r * 0.4 + i * 4);
						ctx.lineTo(cx + s * r * 0.9, cy + r * 0.3 + i * 8);
						ctx.stroke();
					}
				});
			}
			if (label) label.textContent = current === "edges" ? "early" : (current === "parts" ? "middle" : "late");
			if (feature) feature.textContent = current;
			if (field) field.textContent = current === "edges" ? "small" : (current === "parts" ? "medium" : "large");
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		chips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				chips.forEach(function (x) { x.classList.remove("is-on"); });
				chip.classList.add("is-on");
				current = chip.getAttribute("data-vision-layer");
				if (label) label.textContent = current === "edges" ? "early" : (current === "parts" ? "middle" : "late");
				if (feature) feature.textContent = current;
				if (field) field.textContent = current === "edges" ? "small" : (current === "parts" ? "medium" : "large");
				api.redraw();
			});
		});
		api.redraw();
	}

	/* ── quality filter ─────────────────────────────────────── */

	function initFilter(root) {
		var stream = $("[data-filter-stream]", root);
		var range = $("[data-filter-strength]", root);
		var out = $("[data-filter-strength-out]", root);
		var keptEl = $("[data-filter-kept]", root);
		var droppedEl = $("[data-filter-dropped]", root);
		var qualityEl = $("[data-filter-quality]", root);
		if (!stream || !range) return;
		var docs = [
			{ name: "news", q: 3 }, { name: "blog", q: 2 }, { name: "spam", q: 0 },
			{ name: "wiki", q: 3 }, { name: "forum", q: 1 }, { name: "duplicate", q: 0 },
			{ name: "paper", q: 3 }, { name: "listing", q: 0 }, { name: "book", q: 3 },
			{ name: "comment", q: 1 }, { name: "tutorial", q: 2 }, { name: "lorem", q: 0 },
			{ name: "manual", q: 2 }, { name: "newsletter", q: 2 }, { name: "code", q: 3 },
			{ name: "seo", q: 0 }, { name: "docs", q: 3 }, { name: "chat", q: 1 }
		];
		function render() {
			var s = parseInt(range.value, 10) || 0;
			if (out) out.textContent = s;
			var kept = 0, sum = 0;
			stream.innerHTML = docs.map(function (d) {
				var keep = d.q >= s;
				if (keep) { kept++; sum += d.q; }
				return '<span class="filter-doc ' + (keep ? "is-kept" : "is-dropped") + '"><b>' + d.name + '</b> q' + d.q + '</span>';
			}).join("");
			if (keptEl) keptEl.textContent = kept + " / " + docs.length;
			if (droppedEl) droppedEl.textContent = (docs.length - kept) + "";
			if (qualityEl) qualityEl.textContent = kept ? (sum / kept).toFixed(1) : "—";
		}
		range.addEventListener("input", render);
		render();
	}


	/* ── residual stream ────────────────────────────────────── */

	function initResidual(root) {
		var layersEl = $("[data-res-layers]", root);
		var barsEl = $("[data-res-bars]", root);
		var noteEl = $("[data-res-note]", root);
		if (!layersEl || !barsEl) return;
		var base = [ 0.35, 0.5, 0.28, 0.62, 0.44, 0.3, 0.55, 0.4, 0.33, 0.48 ];
		var updates = [
			{ label: "Embedding", note: "The token becomes a vector.", add: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ] },
			{ label: "+ Attention 1", note: "Attention reads the context and adds what it found.", add: [ 0.18, 0.24, 0.12, 0.2, 0.16, 0.22, 0.1, 0.18, 0.2, 0.16 ] },
			{ label: "+ MLP 1", note: "The feed-forward layer computes and writes a new feature.", add: [ 0.12, 0.16, 0.22, 0.14, 0.18, 0.12, 0.2, 0.16, 0.14, 0.12 ] },
			{ label: "+ Attention 2", note: "A second head routes a longer-range clue.", add: [ 0.1, 0.14, 0.1, 0.16, 0.12, 0.18, 0.14, 0.1, 0.14, 0.16 ] },
			{ label: "+ MLP 2", note: "More features combine; the stream becomes richer.", add: [ 0.08, 0.12, 0.16, 0.1, 0.14, 0.1, 0.12, 0.18, 0.1, 0.08 ] }
		];
		var step = 0;
		function render() {
			layersEl.innerHTML = updates.map(function (u, i) {
				return '<button class="res-layer' + (i === step ? " is-on" : "") + '" type="button" data-res="' + i + '">' + u.label + '</button>';
			}).join("");
			$$("[data-res]", layersEl).forEach(function (btn) {
				btn.addEventListener("click", function () {
					step = parseInt(btn.getAttribute("data-res"), 10);
					render();
				});
			});
			var cum = base.slice();
			for (var i = 1; i <= step; i++) {
				for (var j = 0; j < cum.length; j++) cum[j] += updates[i].add[j];
			}
			var max = Math.max.apply(null, cum) * 1.1;
			barsEl.innerHTML = cum.map(function (v) {
				return '<span class="res-bar" style="height:' + Math.max(6, v / max * 100) + '%"></span>';
			}).join("");
			if (noteEl) noteEl.textContent = updates[step].note;
		}
		render();
	}

	/* ── AI for science: pLDDT + contact map ────────────────── */

	function initScience(root) {
		var canvas = $("[data-science-canvas]", root);
		if (!canvas) return;
		var slider = $("[data-science-threshold]", root);
		var out = $("[data-science-threshold-out]", root);
		var keptEl = $("[data-science-kept]", root);
		var meanEl = $("[data-science-mean]", root);
		var selEl = $("[data-science-selected]", root);
		var confEl = $("[data-science-confidence]", root);
		var noteEl = $("[data-science-note]", root);
		var N = 40;
		var conf = [];
		var contacts = [];
		var i, j;
		for (i = 0; i < N; i++) {
			var core = i >= 8 && i <= 31;
			var base = core ? 84 + 7 * Math.sin(i * 0.7) : 38 + 12 * Math.sin(i * 1.1);
			conf.push(clamp(Math.round(base + 3 * Math.sin(i * 2.3)), 25, 97));
			var row = [];
			for (j = 0; j < N; j++) row.push(0);
			contacts.push(row);
		}
		function setC(a, b, s) {
			if (a < 0 || b < 0 || a >= N || b >= N || a === b) return;
			contacts[a][b] = Math.max(contacts[a][b], s);
			contacts[b][a] = Math.max(contacts[b][a], s);
		}
		for (i = 0; i < N - 1; i++) {
			setC(i, i + 1, 1.0);
			if (i + 2 < N) setC(i, i + 2, 0.6);
			if (i + 3 < N) setC(i, i + 3, 0.35);
		}
		var longRange = [
			[10, 24, 0.9], [12, 27, 0.85], [14, 22, 0.75], [16, 30, 0.8],
			[18, 28, 0.7], [20, 26, 0.65], [9, 30, 0.6], [11, 20, 0.55]
		];
		longRange.forEach(function (p) { setC(p[0], p[1], p[2]); });
		for (i = 0; i < 8; i++) {
			if (i + 1 < 8) setC(i, i + 1, 0.45);
			if (i + 2 < 8) setC(i, i + 2, 0.25);
		}
		for (i = 32; i < N; i++) {
			if (i + 1 < N) setC(i, i + 1, 0.4);
			if (i + 2 < N) setC(i, i + 2, 0.2);
		}
		var threshold = 70;
		var selected = 15;

		function draw(ctx, w, h) {
			var c = colors();
			var sky = hexToRgb(c.sky);
			ctx.clearRect(0, 0, w, h);
			var pad = 24;
			var maxMatrix = Math.min(h - 40, w * 0.58);
			var cell = maxMatrix / N;
			var ox = pad;
			var oy = pad + 10;
			var barsX = ox + maxMatrix + 30;
			var barsW = Math.max(40, w - barsX - pad);
			var barW = barsW / N;
			var barsBottom = oy + maxMatrix;
			var barsTop = oy + 10;

			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.fillStyle = c.muted;
			ctx.textAlign = "left";
			ctx.fillText("contact map", ox, oy - 8);
			ctx.fillText("per-residue confidence (pLDDT)", barsX, oy - 8);

			for (i = 0; i < N; i++) {
				for (j = 0; j < N; j++) {
					var strength = contacts[i][j];
					if (!strength) continue;
					var passed = conf[i] >= threshold && conf[j] >= threshold;
					var alpha = strength * (Math.min(conf[i], conf[j]) / 100) * (passed ? 0.9 : 0.1);
					if (i === selected || j === selected) alpha *= 1.25;
					ctx.fillStyle = "rgba(" + sky[0] + "," + sky[1] + "," + sky[2] + "," + Math.min(0.9, alpha).toFixed(3) + ")";
					ctx.fillRect(ox + j * cell, oy + i * cell, Math.max(1, cell - 1), Math.max(1, cell - 1));
				}
			}

			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			ctx.strokeRect(ox, oy, maxMatrix, maxMatrix);
			ctx.font = "500 9px ui-monospace, monospace";
			ctx.fillStyle = c.faint;
			ctx.textAlign = "center";
			var ticks = [0, 9, 19, 29, 39];
			var tickLabels = ["1", "10", "20", "30", "40"];
			for (var k = 0; k < ticks.length; k++) {
				ctx.fillText(tickLabels[k], ox + (ticks[k] + 0.5) * cell, oy + maxMatrix + 12);
			}
			ctx.textAlign = "right";
			for (var k2 = 0; k2 < ticks.length; k2++) {
				ctx.fillText(tickLabels[k2], ox - 4, oy + (ticks[k2] + 0.5) * cell + 3);
			}

			ctx.strokeStyle = c.green;
			ctx.lineWidth = 1.2;
			ctx.strokeRect(ox, oy + selected * cell, maxMatrix, Math.max(1, cell));
			ctx.strokeRect(ox + selected * cell, oy, Math.max(1, cell), maxMatrix);

			var barH = barsBottom - barsTop;
			for (i = 0; i < N; i++) {
				var v = conf[i];
				var bh = v / 100 * barH;
				var pass = v >= threshold;
				var col = v >= 80 ? c.green : v >= 65 ? c.sky : v >= 50 ? c.gold : c.coral;
				ctx.globalAlpha = pass ? 1 : 0.25;
				ctx.fillStyle = col;
				ctx.fillRect(barsX + i * barW, barsBottom - bh, Math.max(1, barW - 1), bh);
				ctx.globalAlpha = 1;
				if (i === selected) {
					ctx.strokeStyle = c.ink;
					ctx.lineWidth = 1.2;
					ctx.strokeRect(barsX + i * barW, barsTop, Math.max(1, barW - 1), barH);
				}
			}

			var ty = barsBottom - threshold / 100 * barH;
			ctx.setLineDash([4, 4]);
			ctx.strokeStyle = c.coral;
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			ctx.moveTo(barsX, ty);
			ctx.lineTo(barsX + barsW, ty);
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.strokeStyle = c.lineStrong;
			ctx.beginPath();
			ctx.moveTo(barsX, barsBottom);
			ctx.lineTo(barsX + barsW, barsBottom);
			ctx.stroke();

			ctx.font = "500 9px ui-monospace, monospace";
			ctx.fillStyle = c.faint;
			ctx.textAlign = "center";
			ctx.fillText("1", barsX + 0.5 * barW, barsBottom + 12);
			ctx.fillText("40", barsX + (N - 0.5) * barW, barsBottom + 12);

			var kept = conf.filter(function (v) { return v >= threshold; }).length;
			var mean = Math.round(conf.reduce(function (a, b) { return a + b; }, 0) / N);
			if (keptEl) keptEl.textContent = kept + " / " + N;
			if (meanEl) meanEl.textContent = mean + " / 100";
			if (selEl) selEl.textContent = "residue " + (selected + 1);
			if (confEl) confEl.textContent = conf[selected] + " / 100";
			if (noteEl) {
				noteEl.textContent = conf[selected] >= threshold
					? "Residue " + (selected + 1) + " passes the threshold; its contacts are drawn bright."
					: "Residue " + (selected + 1) + " is below the threshold; treat its contacts as uncertain.";
			}
		}

		var api = canvasDemo(canvas, draw);
		function setThreshold(v) {
			threshold = clamp(Math.round(v), 0, 100);
			if (slider) slider.value = threshold;
			if (out) out.textContent = threshold;
			if (api) api.redraw();
		}
		if (slider) slider.addEventListener("input", function () { setThreshold(parseFloat(slider.value)); });
		canvas.addEventListener("click", function (ev) {
			var rect = canvas.getBoundingClientRect();
			var x = ev.clientX - rect.left;
			var y = ev.clientY - rect.top;
			var pad = 24;
			var maxMatrix = Math.min(rect.height - 40, rect.width * 0.58);
			var cell = maxMatrix / N;
			var ox = pad;
			var oy = pad + 10;
			var barsX = ox + maxMatrix + 30;
			var barsW = Math.max(40, rect.width - barsX - pad);
			var barW = barsW / N;
			var next = selected;
			if (x >= ox && x <= ox + maxMatrix && y >= oy && y <= oy + maxMatrix) {
				next = clamp(Math.floor((y - oy) / cell), 0, N - 1);
			} else if (x >= barsX && x <= barsX + barsW && y >= oy && y <= oy + maxMatrix + 20) {
				next = clamp(Math.floor((x - barsX) / barW), 0, N - 1);
			}
			if (next !== selected) {
				selected = next;
				if (api) api.redraw();
			}
		});
		setThreshold(threshold);
	}

	/* ── boot ───────────────────────────────────────────────── */

	function boot() {
		$$("[data-demo]").forEach(function (root) {
			var type = root.getAttribute("data-demo");
			if (type === "sampling") initSampling(root);
			else if (type === "decoding") initDecoding(root);
			else if (type === "linefit") initLineFit(root);
			else if (type === "dream") initDream(root);
			else if (type === "polyfit") initPolyFit(root);
			else if (type === "activation") initActivation(root);
			else if (type === "datamix") initDataMix(root);
			else if (type === "convolution") initConvolution(root);
			else if (type === "vram") initVram(root);
			else if (type === "budget") initBudget(root);
			else if (type === "retrieval") initRetrieval(root);
			else if (type === "entropy") initEntropy(root);
			else if (type === "cot") initCot(root);
			else if (type === "timeline") initTimeline(root);
			else if (type === "contamination") initContamination(root);
			else if (type === "position") initPosition(root);
			else if (type === "waveform") initWaveform(root);
			else if (type === "ragspace") initRagSpace(root);
			else if (type === "align") initAlign(root);
			else if (type === "preference") initPreference(root);
			else if (type === "mary") initMary(root);
			else if (type === "logitlens") initLogitLens(root);
			else if (type === "visionlayers") initVisionLayers(root);
			else if (type === "filter") initFilter(root);
			else if (type === "residual") initResidual(root);
			else if (type === "science") initScience(root);
		});
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
	else boot();
})();
