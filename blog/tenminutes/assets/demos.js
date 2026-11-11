/* TEN MINUTES — compact-page demos. Depends on assets/site.js (TM.*). */
(function () {
	"use strict";

	var DEMO_LANG = window.TM && TM.lang ? TM.lang() : "en";
	var DEMO_DE = DEMO_LANG === "de";

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

	/* Every shared demo is rebuilt from its server-rendered markup when the
	   language changes, so dynamic labels and canvases switch together. */
	var teardowns = new WeakMap();
	function onTeardown(root, fn) {
		var list = teardowns.get(root);
		if (!list) { list = []; teardowns.set(root, list); }
		list.push(fn);
	}
	function cleanupRoot(root) {
		var list = teardowns.get(root);
		if (!list) return;
		list.forEach(function (fn) { try { fn(); } catch (e) {} });
		teardowns.delete(root);
	}
	function capturePristine() {
		$$("[data-demo]").forEach(function (root) {
			if (typeof root.__tmPristineHTML !== "string") {
				root.__tmPristineHTML = root.innerHTML;
			}
		});
	}
	capturePristine();

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
		var tokens = DEMO_DE ? [
			{ t: "Paris", z: 2.9, c: "var(--tm-green)" },
			{ t: "Lyon", z: 1.1, c: "var(--tm-sky)" },
			{ t: "Berlin", z: 0.7, c: "var(--tm-gold)" },
			{ t: "Marseille", z: -0.4, c: "var(--tm-coral)" },
			{ t: "die", z: -1.1, c: "var(--tm-faint)" }
		] : [
			{ t: "Paris", z: 2.9, c: "var(--tm-green)" },
			{ t: "Lyon", z: 1.1, c: "var(--tm-sky)" },
			{ t: "Berlin", z: 0.7, c: "var(--tm-gold)" },
			{ t: "Marseille", z: -0.4, c: "var(--tm-coral)" },
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
					'<span class="dist-val">' + (isKept ? rounded[i] + '%' : (DEMO_DE ? 'weg' : 'cut')) + '</span></div>';
			}).join("");
			if (choice) choice.textContent = tokens[kept[0]].t;
			if (count) count.textContent = kept.length + " / " + tokens.length;
			if (entropy) entropy.textContent = ent.toFixed(2) + " bits";
			$$(".dist-row", bars).forEach(function (row, i) {
				row.style.cursor = keep[i] ? "pointer" : "default";
				row.title = keep[i] ? (DEMO_DE ? "Dieses Token ziehen" : "Draw this token") : (DEMO_DE ? "Von Top-p abgeschnitten" : "Cut by top-p");
				row.addEventListener("click", function () {
					if (!keep[i]) return;
					var draw = $("[data-sampling-draw]", root);
					if (draw) {
						draw.textContent = tokens[i].t;
						draw.style.color = tokens[i].c;
					}
					row.classList.add("is-picked");
					setTimeout(function () { row.classList.remove("is-picked"); }, 450);
				});
			});
		}
		var controls = $(".demo-controls", root);
		if (controls && !$("[data-sampling-sample]", root)) {
			var sampleBtn = document.createElement("button");
			sampleBtn.type = "button";
			sampleBtn.className = "btn-demo btn-demo--green";
			sampleBtn.setAttribute("data-sampling-sample", "");
			sampleBtn.textContent = DEMO_DE ? "Ein Token ziehen →" : "Draw a token →";
			controls.appendChild(sampleBtn);
			sampleBtn.addEventListener("click", function () {
				var T = clamp(parseFloat(temp && temp.value) || 0.8, 0.05, 3);
				var P = clamp(parseFloat(topP && topP.value) || 1, 0.05, 1);
				var exps = tokens.map(function (x) { return Math.exp(x.z / T); });
				var sum = exps.reduce(function (a, b) { return a + b; }, 0);
				var probs = exps.map(function (e) { return e / sum; });
				var order = probs.map(function (p, i) { return i; }).sort(function (a, b) { return probs[b] - probs[a]; });
				var cum = 0, kept = [];
				order.forEach(function (i) { if (cum < P) { kept.push(i); cum += probs[i]; } });
				var mass = kept.reduce(function (a, i) { return a + probs[i]; }, 0) || 1;
				var r = Math.random() * mass, acc = 0, pick = kept[0];
				for (var k = 0; k < kept.length; k++) {
					acc += probs[kept[k]];
					if (r <= acc) { pick = kept[k]; break; }
				}
				var draw = $("[data-sampling-draw]", root);
				if (draw) {
					draw.textContent = tokens[pick].t;
					draw.style.color = tokens[pick].c;
				}
			});
		}
		var readout = $(".demo-readout", root);
		if (readout && !$("[data-sampling-draw]", root)) {
			var cell = document.createElement("div");
			cell.innerHTML = "<b>" + (DEMO_DE ? "Gezogener Wert" : "Sampled draw") + "</b><span data-sampling-draw>—</span>";
			readout.appendChild(cell);
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
		var lossChart = $("[data-linefit-loss-chart]", root);
		var lossHistory = [];
		var lossApi = null;
		if (!canvas) return;
		var noise = [0.04, -0.03, 0.02, -0.05, 0.01, 0.06, -0.02, 0.03, -0.04, 0.05, 0.0, -0.01, 0.04, -0.02, 0.02, -0.03, 0.05, -0.04, 0.01, 0.03];
		var pts = noise.map(function (n, i) {
			var x = 0.06 + i * 0.88 / (noise.length - 1);
			return { x: x, y: 0.75 * x + 0.18 + n };
		});
		var target = { a: 0.75, b: 0.18 };
		function val(el, fallback) { return parseFloat(el && el.value) || fallback; }
		function mseOf(a, bb) {
			return pts.reduce(function (s, p) {
				var d = (a * p.x + bb) - p.y;
				return s + d * d;
			}, 0) / pts.length;
		}
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
			ctx.strokeStyle = c.coral;
			ctx.lineWidth = 1.1;
			ctx.setLineDash([3, 4]);
			pts.forEach(function (p) {
				ctx.beginPath();
				ctx.moveTo(px(p.x), py(p.y));
				ctx.lineTo(px(p.x), py(a * p.x + bb));
				ctx.stroke();
			});
			ctx.setLineDash([]);
			pts.forEach(function (p) {
				ctx.beginPath();
				ctx.arc(px(p.x), py(p.y), 4.5, 0, Math.PI * 2);
				ctx.fillStyle = c.sky;
				ctx.fill();
				ctx.strokeStyle = c.card;
				ctx.lineWidth = 1.5;
				ctx.stroke();
			});
			var mse = mseOf(a, bb);
			if (wOut) wOut.textContent = a.toFixed(2);
			if (bOut) bOut.textContent = bb.toFixed(2);
			if (loss) loss.textContent = mse.toFixed(3);
			if (best) best.textContent = "a " + target.a.toFixed(2) + " · b " + target.b.toFixed(2);
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		function drawLossChart(ctx, W, H) {
			var c = colors();
			ctx.clearRect(0, 0, W, H);
			var padL = 40, padR = 12, padT = 10, padB = 22;
			var n = lossHistory.length;
			var max = Math.max.apply(null, lossHistory) || 1;
			var min = Math.min.apply(null, lossHistory);
			var span = Math.max(max - min, 0.0001);
			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(padL, padT);
			ctx.lineTo(padL, H - padB);
			ctx.lineTo(W - padR, H - padB);
			ctx.stroke();
			if (n > 0) {
				ctx.beginPath();
				lossHistory.forEach(function (v, i) {
					var x = n === 1 ? padL : padL + i / (n - 1) * (W - padL - padR);
					var y = H - padB - (v - min) / span * (H - padT - padB);
					if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
				});
				ctx.strokeStyle = c.green;
				ctx.lineWidth = 2;
				ctx.stroke();
				if (n > 0) {
					var last = lossHistory[n - 1];
					ctx.fillStyle = c.green;
					ctx.beginPath();
					ctx.arc(n === 1 ? padL : W - padR, H - padB - (last - min) / span * (H - padT - padB), 3, 0, Math.PI * 2);
					ctx.fill();
				}
			}
			ctx.fillStyle = c.muted;
			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.fillText(max.toFixed(2), padL - 5, padT + 8);
			ctx.fillText(min.toFixed(2), padL - 5, H - padB);
			ctx.textAlign = "left";
			ctx.fillText(DEMO_DE ? "Fehler" : "loss", padL + 4, padT + 8);
			ctx.textAlign = "right";
			ctx.fillText(DEMO_DE ? "Schritt" : "step", W - padR, H - 6);
			ctx.textAlign = "left";
		}
		if (lossChart) lossApi = canvasDemo(lossChart, drawLossChart);
		function redraw() { api.redraw(); if (lossApi) lossApi.redraw(); }
		if (w) w.addEventListener("input", function () { lossHistory = [mseOf(val(w, 0.4), val(b, 0.2))]; redraw(); });
		if (b) b.addEventListener("input", function () { lossHistory = [mseOf(val(w, 0.4), val(b, 0.2))]; redraw(); });
		if (bestBtn) bestBtn.addEventListener("click", function () {
			if (w) w.value = target.a.toFixed(2);
			if (b) b.value = target.b.toFixed(2);
			lossHistory = [mseOf(target.a, target.b)];
			redraw();
		});
		if (stepBtn) stepBtn.addEventListener("click", function () {
			var ca = val(w, 0.4), cb = val(b, 0.2);
			var da = 0, db = 0;
			pts.forEach(function (p) {
				var e = (ca * p.x + cb) - p.y;
				da += 2 * e * p.x;
				db += 2 * e;
			});
			da /= pts.length;
			db /= pts.length;
			if (w) w.value = clamp(ca - 0.55 * da, -1, 2).toFixed(2);
			if (b) b.value = clamp(cb - 0.55 * db, -1, 2).toFixed(2);
			lossHistory.push(mseOf(val(w, 0.4), val(b, 0.2)));
			redraw();
		});
		lossHistory = [mseOf(val(w, 0.4), val(b, 0.2))];
		redraw();
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
		var note = $("[data-polyfit-note]", root);
		var chart = $("[data-polyfit-chart]", root);
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
		var xsTrain = train.map(function (p) { return p.x; });
		var ysTrain = train.map(function (p) { return p.y; });
		var curveData = [];
		for (var cd = 1; cd <= 11; cd++) {
			var cc = polyFit(xsTrain, ysTrain, cd);
			var trc = train.reduce(function (a, p) { var e = evalPoly(cc, p.x) - p.y; return a + e * e; }, 0) / train.length;
			var tec = test.reduce(function (a, p) { var e = evalPoly(cc, p.x) - p.y; return a + e * e; }, 0) / test.length;
			curveData.push({ d: cd, tr: trc, te: tec });
		}
		function renderChart(d) {
			if (!chart) return;
			var max = 1e-6;
			curveData.forEach(function (c) { max = Math.max(max, Math.sqrt(c.tr), Math.sqrt(c.te)); });
			function polyline(key) {
				return curveData.map(function (c, i) {
					return (i / (curveData.length - 1) * 100).toFixed(2) + "," + (95 - Math.sqrt(c[key]) / max * 78).toFixed(2);
				}).join(" ");
			}
			var cd2 = curveData[clamp(d, 1, 11) - 1];
			var mx = ((cd2.d - 1) / 10 * 100).toFixed(2);
			var my = (95 - Math.sqrt(cd2.te) / max * 78).toFixed(2);
			chart.innerHTML = '<line class="gd-axis" x1="0" y1="95" x2="100" y2="95"></line>' +
				'<polyline class="gd-curve" points="' + polyline("tr") + '" style="stroke:var(--tm-green)"></polyline>' +
				'<polyline class="gd-curve" points="' + polyline("te") + '" style="stroke:var(--tm-coral)"></polyline>' +
				'<circle class="gd-dot" cx="' + mx + '" cy="' + my + '" r="2.6" style="fill:var(--tm-coral)"></circle>';
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
			ctx.strokeStyle = c.faint;
			ctx.lineWidth = 1.4;
			ctx.setLineDash([5, 5]);
			ctx.beginPath();
			for (var t = 0; t <= 200; t++) {
				var xt = xmin + (xmax - xmin) * t / 200;
				var yt = Math.sin(2.2 * xt) + 0.15 * xt;
				if (t) ctx.lineTo(px(xt), py(yt)); else ctx.moveTo(px(xt), py(yt));
			}
			ctx.stroke();
			ctx.setLineDash([]);
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
			if (note) {
				var lvl = d <= 2 ? "Underfit" : d <= 5 ? "Balanced" : "Overfit risk";
				note.innerHTML = "<b>" + lvl + ".</b> The dashed line is the true pattern. Green dots are training data; faint dots are held-out points. The small chart plots train error (green) and test error (lilac) against degree: the test curve turns back up when the curve starts memorizing.";
			}
			renderChart(d);
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
			{ name: "Web", pct: 55, c: "var(--tm-sky)", note: DEMO_DE ? "Common Crawl und Ähnliches: riesig, verrauscht, stark gefiltert." : "Common Crawl and similar: huge, noisy, heavily filtered." },
			{ name: "Code", pct: 13, c: "var(--tm-green)", note: DEMO_DE ? "GitHub und Ähnliches: entscheidend für Programmieren und strukturiertes Denken." : "GitHub and similar: crucial for programming and structured reasoning." },
			{ name: "Books", pct: 8, c: "var(--tm-gold)", note: DEMO_DE ? "Langtexte: Struktur, Argument und Erzählung." : "Long-form text: structure, argument, and narrative." },
			{ name: "Papers", pct: 4, c: "var(--tm-coral)", note: DEMO_DE ? "Wissenschaftliche Texte: präzise Aussagen und Belege." : "Scientific writing: precise claims and references." },
			{ name: "Wikipedia", pct: 2, c: "var(--tm-petrol)", note: DEMO_DE ? "Referenztexte: kompakte, faktische Prosa." : "Reference text: compact factual prose." },
			{ name: "Math", pct: 4, c: "var(--tm-lime)", note: DEMO_DE ? "Synthetische und kuratierte Aufgaben: symbolisches Denken." : "Synthetic and curated problems: symbolic reasoning." },
			{ name: "Conversation", pct: 4, c: "var(--tm-faint)", note: DEMO_DE ? "Kuratierte Dialoge und Instruktionsdaten." : "Curated dialogues and instruction data." },
			{ name: "Multimodal", pct: 10, c: "var(--tm-blue)", note: DEMO_DE ? "Bildunterschriften, Alt-Text und gepaarte Medien." : "Image captions, alt-text, and paired media." }
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
			if (note) note.textContent = chosen === -1 ? (DEMO_DE ? "Tippe auf eine Quelle, um zu sehen, was sie beiträgt. Die Mischung ist ungefähr; Labore unterscheiden sich." : "Hover or tap a source to see what it contributes. The mix is approximate; labs differ.") : data[chosen].note;
		}
		$$("[data-mix-i]", bar).concat($$("[data-mix-i]", legend)).forEach(function (el) {
			el.addEventListener("click", function () { select(parseInt(el.getAttribute("data-mix-i"), 10)); });
		});
		select(-1);
	}

	/* ── convolution ────────────────────────────────────────── */

	function initPooling(root) {
		var inputEl = $("[data-pool-input]", root);
		var outputEl = $("[data-pool-output]", root);
		var readout = $("[data-pool-readout]", root);
		var modes = $$("[data-pool-mode]", root);
		if (!inputEl || !outputEl) return;
		var values = [
			[3, 1, 4, 1],
			[5, 9, 2, 6],
			[5, 3, 5, 8],
			[9, 7, 9, 3]
		];
		var selected = 0;
		var mode = "max";
		function blockValues(block) {
			var by = Math.floor(block / 2) * 2;
			var bx = (block % 2) * 2;
			return [
				values[by][bx], values[by][bx + 1],
				values[by + 1][bx], values[by + 1][bx + 1]
			];
		}
		function pooled(block) {
			var vals = blockValues(block);
			if (mode === "avg") {
				return vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
			}
			return Math.max.apply(null, vals);
		}
		function format(v) {
			if (mode === "avg") {
				var text = Number(v).toFixed(1);
				return DEMO_DE ? text.replace(".", ",") : text;
			}
			return String(v);
		}
		function render() {
			inputEl.innerHTML = "";
			values.forEach(function (row, ry) {
				row.forEach(function (v, rx) {
					var block = Math.floor(ry / 2) * 2 + Math.floor(rx / 2);
					var cell = document.createElement("button");
					cell.type = "button";
					cell.className = "pool-cell" + (block === selected ? " is-in-block" : "");
					cell.setAttribute("data-block", block);
					cell.textContent = v;
					cell.setAttribute("aria-label", (DEMO_DE ? "Block " : "block ") + (block + 1) +
						(DEMO_DE ? ", Zeile " : ", row ") + (ry + 1) +
						(DEMO_DE ? ", Spalte " : ", column ") + (rx + 1) + ": " + v);
					cell.addEventListener("click", function () {
						selected = block;
						render();
					});
					inputEl.appendChild(cell);
				});
			});
			outputEl.innerHTML = "";
			for (var block = 0; block < 4; block++) {
				var out = document.createElement("button");
				out.type = "button";
				out.className = "pool-cell" + (block === selected ? " is-selected" : "");
				out.setAttribute("data-block", block);
				out.textContent = format(pooled(block));
				out.setAttribute("aria-label", (DEMO_DE ? "Ausgabe für Block " : "output for block ") + (block + 1) + ": " + format(pooled(block)));
				out.addEventListener("click", (function (b) {
					return function () { selected = b; render(); };
				})(block));
				outputEl.appendChild(out);
			}
			if (readout) {
				var vals = blockValues(selected);
				var sum = vals.reduce(function (a, b) { return a + b; }, 0);
				readout.textContent = mode === "avg"
					? (DEMO_DE ? "Block " : "Block ") + (selected + 1) + ": (" + vals.join(" + ") + ") / 4 = " + format(sum / 4)
					: (DEMO_DE ? "Block " : "Block ") + (selected + 1) + ": max(" + vals.join(", ") + ") = " + format(Math.max.apply(null, vals));
			}
		}
		modes.forEach(function (btn) {
			btn.addEventListener("click", function () {
				mode = btn.getAttribute("data-pool-mode");
				modes.forEach(function (x) { x.classList.toggle("is-on", x === btn); });
				render();
			});
		});
		render();
	}

	function initConvolution(root) {
		var canvas = $("[data-conv-canvas]", root);
		var chips = $$("[data-kernel]", root);
		var inputSizeEl = $("[data-conv-input-size]", root);
		var outputSizeEl = $("[data-conv-output-size]", root);
		var scanBtn = $("[data-conv-scan]", root);
		var kernelGrid = $("[data-conv-kernel-grid]", root);
		var formulaEl = document.getElementById("conv-formula");
		if (!canvas) return;
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
		var img = null;
		var gw = 0, gh = 0;
		var input = [];
		var inputRGB = [];
		var outCanvas = document.createElement("canvas");
		var outCtx = outCanvas.getContext("2d");
		var scanCell = 0;
		var scanTimer = null;
		onTeardown(root, function () { if (scanTimer) { clearInterval(scanTimer); scanTimer = null; } });
		var lastGeom = null;
		function kernelValue(v) {
			return Math.abs(v - Math.round(v)) < 0.001 ? String(v) : v.toFixed(2);
		}
		function renderKernel() {
			if (!kernelGrid) return;
			kernelGrid.innerHTML = "";
			kernels[current].forEach(function (row, ky) {
				row.forEach(function (v, kx) {
					var input = document.createElement("input");
					input.type = "number";
					input.step = "0.01";
					input.className = "conv-kernel-input";
					input.value = kernelValue(v);
					input.setAttribute("aria-label", (DEMO_DE ? "Kernel Zeile " : "kernel row ") + (ky + 1) + (DEMO_DE ? ", Spalte " : ", column ") + (kx + 1));
					input.addEventListener("input", function () {
						var val = parseFloat(input.value);
						if (!isFinite(val)) val = 0;
						if (current !== "custom") {
							kernels.custom = kernels[current].map(function (r) { return r.slice(); });
							current = "custom";
							chips.forEach(function (x) { x.classList.remove("is-on"); });
						}
						kernels.custom[ky][kx] = val;
						api.redraw();
						updateFormula();
					});
					kernelGrid.appendChild(input);
				});
			});
		}
		function updateFormula() {
			if (!formulaEl || !imageLoaded || !gw || !gh || scanCell < 0) return;
			var ow = gw - 2;
			var sx = scanCell % ow;
			var sy = Math.floor(scanCell / ow);
			if (sx < 0 || sy < 0 || sy >= gh - 2) return;
			var k = kernels[current];
			var dark = !!(window.TM && TM.colors && TM.colors().dark);
			var channelColors = dark
				? ["#ff7b72", "#7ee787", "#79c0ff"]
				: ["#a93226", "#1e8449", "#1f618d"];
			var pixelRows = [];
			var kernelRows = [];
			var totals = [0, 0, 0];
			for (var i = 0; i < 3; i++) {
				var cells = [];
				for (var j = 0; j < 3; j++) {
					var px = inputRGB[sy + i][sx + j];
					var kv = k[i][j];
					for (var ch = 0; ch < 3; ch++) totals[ch] += px[ch] * kv;
					cells.push("\\begin{pmatrix}\\textcolor{" + channelColors[0] + "}{" + px[0] + "}\\\\ \\textcolor{" + channelColors[1] + "}{" + px[1] + "}\\\\ \\textcolor{" + channelColors[2] + "}{" + px[2] + "}\\end{pmatrix}");
				}
				pixelRows.push(cells.join(" & "));
				kernelRows.push(k[i].map(kernelValue).join(" & "));
			}
			var outVec = "\\begin{pmatrix}\\textcolor{" + channelColors[0] + "}{" + Math.round(totals[0]) + "}\\\\ \\textcolor{" + channelColors[1] + "}{" + Math.round(totals[1]) + "}\\\\ \\textcolor{" + channelColors[2] + "}{" + Math.round(totals[2]) + "}\\end{pmatrix}";
			var tex = "\\underbrace{\\underbrace{\\begin{pmatrix}" + pixelRows.join(" \\\\ ") + "\\end{pmatrix}}_{\\text{" + (DEMO_DE ? "9 Pixel, je R/G/B" : "9 pixels, each RGB") + "}} \\odot \\begin{pmatrix}" + kernelRows.join(" \\\\ ") + "\\end{pmatrix} \\;\\xrightarrow{\\text{" + (DEMO_DE ? "Summe" : "sum") + "}}\\; " + outVec + "}_{\\text{" + (DEMO_DE ? "Ausgabe an " : "output at ") + "(" + sx + "," + sy + ")" + "}}";
			formulaEl.setAttribute("data-tex", tex);
			formulaEl.removeAttribute("data-tex-rendered");
			if (window.TM && TM.typesetMath) TM.typesetMath(formulaEl.parentNode);
		}
		function conv(kernel) {
			var out = [];
			for (var y = 1; y < gh - 1; y++) {
				var row = [];
				for (var x = 1; x < gw - 1; x++) {
					var sum = 0;
					for (var ky = -1; ky <= 1; ky++) {
						for (var kx = -1; kx <= 1; kx++) {
							sum += input[y + ky][x + kx] * kernel[ky + 1][kx + 1];
						}
					}
					row.push(sum);
				}
				out.push(row);
			}
			return out;
		}
		function convRGB(kernel) {
			var out = [];
			for (var y = 1; y < gh - 1; y++) {
				var row = [];
				for (var x = 1; x < gw - 1; x++) {
					var r = 0, g = 0, b = 0;
					for (var ky = -1; ky <= 1; ky++) {
						for (var kx = -1; kx <= 1; kx++) {
							var px = inputRGB[y + ky][x + kx];
							var kv = kernel[ky + 1][kx + 1];
							r += px[0] * kv;
							g += px[1] * kv;
							b += px[2] * kv;
						}
					}
					row.push([r, g, b]);
				}
				out.push(row);
			}
			return out;
		}
		function draw(ctx, W, H) {
			var c = colors();
			ctx.clearRect(0, 0, W, H);
			var pad = 18, gap = 118;
			if (!imageLoaded || !img || !gw || !gh) {
				ctx.fillStyle = c.muted;
				ctx.font = "600 11px Barlow, system-ui, sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(DEMO_DE ? "Bild wird geladen …" : "loading image …", W / 2, H / 2);
				ctx.textAlign = "left";
				return;
			}
			var ow = gw - 2, oh = gh - 2;
			var maxIW = (W - pad * 2 - gap) / 2;
			var maxIH = H - pad * 2 - 26;
			var scale = Math.min(maxIW / gw, maxIH / gh);
			var iw = gw * scale, ih = gh * scale;
			var ox = Math.max(pad, (W - (iw * 2 + gap)) / 2);
			var oy = pad + 18;
			var ox2 = ox + iw + gap;
			lastGeom = { ox: ox, oy: oy, iw: iw, ih: ih, ox2: ox2, ow: ow, oh: oh, gw: gw, gh: gh };
			ctx.fillStyle = c.muted;
			ctx.font = "600 11px Barlow, system-ui, sans-serif";
			ctx.fillText(DEMO_DE ? "Eingabe · Stoppschild" : "input · stop sign", ox, pad + 4);
			ctx.fillText((DEMO_DE ? "Feature-Map · " : "feature map · ") + current, ox2, pad + 4);
			ctx.drawImage(img, ox, oy, iw, ih);
			var kSize = Math.min(72, gap - 24);
			var kx0 = ox + iw + (gap - kSize) / 2;
			var ky0 = oy + (ih - kSize) / 2;
			var kCell = kSize / 3;
			ctx.save();
			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = c.muted;
			ctx.fillText(DEMO_DE ? "Kernel" : "kernel", kx0 + kSize / 2, ky0 - 8);
			for (var ki = 0; ki < 3; ki++) {
				for (var kj = 0; kj < 3; kj++) {
					var kv = kernels[current][ki][kj];
					var t = Math.max(-1, Math.min(1, kv / 4));
					var kpx = kx0 + kj * kCell;
					var kpy = ky0 + ki * kCell;
					ctx.fillStyle = t >= 0
						? "rgba(99,164,75," + (0.16 + 0.34 * t) + ")"
						: "rgba(145,133,190," + (0.16 + 0.34 * -t) + ")";
					ctx.fillRect(kpx + 1, kpy + 1, kCell - 2, kCell - 2);
					ctx.strokeStyle = c.line;
					ctx.lineWidth = 1;
					ctx.strokeRect(kpx + 1, kpy + 1, kCell - 2, kCell - 2);
					ctx.fillStyle = c.ink;
					ctx.fillText(kernelValue(kv), kpx + kCell / 2, kpy + kCell / 2);
				}
			}
			ctx.restore();
			var out = convRGB(kernels[current]);
			var mn = [Infinity, Infinity, Infinity];
			var mx = [-Infinity, -Infinity, -Infinity];
			out.forEach(function (row) {
				row.forEach(function (px) {
					for (var ch = 0; ch < 3; ch++) {
						if (px[ch] < mn[ch]) mn[ch] = px[ch];
						if (px[ch] > mx[ch]) mx[ch] = px[ch];
					}
				});
			});
			outCanvas.width = ow;
			outCanvas.height = oh;
			var id = outCtx.createImageData(ow, oh);
			var data = id.data;
			for (var y = 0; y < oh; y++) {
				for (var x = 0; x < ow; x++) {
					var px = out[y][x];
					var i = (y * ow + x) * 4;
					for (var ch = 0; ch < 3; ch++) {
						var span = mx[ch] - mn[ch] || 1;
						data[i + ch] = Math.round((px[ch] - mn[ch]) / span * 255);
					}
					data[i + 3] = 255;
				}
			}
			outCtx.putImageData(id, 0, 0);
			ctx.drawImage(outCanvas, ox2, oy, iw, ih);
			if (scanCell >= 0) {
				var sy = Math.floor(scanCell / ow), sx = scanCell % ow;
				var cell = iw / gw;
				ctx.strokeStyle = c.gold;
				ctx.lineWidth = 2.4;
				ctx.strokeRect(ox + sx * cell - 1, oy + sy * cell - 1, cell * 3 + 2, cell * 3 + 2);
				ctx.strokeStyle = c.coral;
				ctx.lineWidth = 2;
				ctx.strokeRect(ox2 + sx * (iw / ow) - 1, oy + sy * (ih / oh) - 1, iw / ow + 2, ih / oh + 2);
				ctx.fillStyle = c.gold;
				ctx.font = "600 10px Barlow, system-ui, sans-serif";
				ctx.fillText("3×3", ox + sx * cell, oy + sy * cell - 5);
			}
			if (inputSizeEl) inputSizeEl.textContent = gw + " × " + gh;
			if (outputSizeEl) outputSizeEl.textContent = ow + " × " + oh;
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		renderKernel();
		var image = new Image();
		image.onload = function () {
			img = image;
			var n = 128;
			gw = n;
			gh = Math.round(n * image.height / image.width);
			var off = document.createElement("canvas");
			off.width = gw;
			off.height = gh;
			var octx = off.getContext("2d");
			try { octx.drawImage(image, 0, 0, gw, gh); } catch (err) { return; }
			var data;
			try { data = octx.getImageData(0, 0, gw, gh).data; } catch (err) { return; }
			input = [];
			inputRGB = [];
			for (var y = 0; y < gh; y++) {
				var row = [];
				var rowRGB = [];
				for (var x = 0; x < gw; x++) {
					var i = (y * gw + x) * 4;
					row.push((data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255);
					rowRGB.push([data[i], data[i + 1], data[i + 2]]);
				}
				input.push(row);
				inputRGB.push(rowRGB);
			}
			imageLoaded = true;
			updateFormula();
			api.redraw();
		};
		image.src = TM.asset("../stop_sign.jpg");
		chips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				chips.forEach(function (x) { x.classList.remove("is-on"); });
				chip.classList.add("is-on");
				current = chip.getAttribute("data-kernel");
				renderKernel();
				updateFormula();
				api.redraw();
			});
		});
		function handlePointerMove(ev) {
			if (!lastGeom || !imageLoaded) return;
			var rect = canvas.getBoundingClientRect();
			var x = ev.clientX - rect.left;
			var y = ev.clientY - rect.top;
			var g = lastGeom;
			var ow = g.ow, oh = g.oh;
			var sx, sy;
			if (x >= g.ox2 && x <= g.ox2 + g.iw && y >= g.oy && y <= g.oy + g.ih) {
				sx = Math.floor((x - g.ox2) / (g.iw / ow));
				sy = Math.floor((y - g.oy) / (g.ih / oh));
			} else if (x >= g.ox && x <= g.ox + g.iw && y >= g.oy && y <= g.oy + g.ih) {
				var ix = Math.floor((x - g.ox) / (g.iw / g.gw));
				var iy = Math.floor((y - g.oy) / (g.ih / g.gh));
				sx = ix - 1;
				sy = iy - 1;
			} else {
				return;
			}
			sx = Math.max(0, Math.min(ow - 1, sx));
			sy = Math.max(0, Math.min(oh - 1, sy));
			var nextCell = sy * ow + sx;
			if (nextCell === scanCell) return;
			if (scanTimer) {
				clearInterval(scanTimer);
				scanTimer = null;
				if (scanBtn) scanBtn.textContent = DEMO_DE ? "Kernel scannen ▶" : "Scan the kernel ▶";
			}
			scanCell = nextCell;
			updateFormula();
			api.redraw();
		}
		window.addEventListener("tm:theme", function () {
			updateFormula();
			api.redraw();
		});
		canvas.addEventListener(window.PointerEvent ? "pointermove" : "mousemove", handlePointerMove);
		if (scanBtn) scanBtn.addEventListener("click", function () {
			if (scanTimer) {
				clearInterval(scanTimer);
				scanTimer = null;
				scanCell = -1;
				scanBtn.textContent = DEMO_DE ? "Kernel scannen ▶" : "Scan the kernel ▶";
				updateFormula();
				api.redraw();
				return;
			}
			if (!imageLoaded) return;
			scanCell = 0;
			scanBtn.textContent = DEMO_DE ? "Scan stoppen ■" : "Stop scan ■";
			updateFormula();
			scanTimer = setInterval(function () {
				scanCell = (scanCell + 1) % ((gw - 2) * (gh - 2));
				if (scanCell % 8 === 0) updateFormula();
				api.redraw();
			}, 30);
			api.redraw();
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
		var noteEl = $("[data-retrieval-note]", root);
		if (!list) return;
		var chunks = DEMO_DE ? [
			{ title: "Eiffelturm", text: "Der Eiffelturm in Paris ist 330 Meter hoch und wurde 1889 zur Weltausstellung fertiggestellt.", vec: [ 0.95, 0.05, 0.05, 0.05 ] },
			{ title: "Paris-Tourismus", text: "Paris zieht Millionen Besucher an; der Turm ist eines der meistbesuchten Monumente der Welt.", vec: [ 0.8, 0.1, 0.0, 0.1 ] },
			{ title: "RAG-Pipeline", text: "Retrieval-Augmented Generation zerlegt Dokumente in Stücke, bettet sie ein, ruft Passagen ab und legt sie in den Prompt.", vec: [ 0.0, 0.95, 0.2, 0.1 ] },
			{ title: "Vektordatenbanken", text: "Vektordatenbanken speichern Embeddings und unterstützen ungefähre Nächste-Nachbarn-Suche über sie.", vec: [ 0.0, 0.3, 0.95, 0.0 ] },
			{ title: "Prompt-Engineering", text: "Eine klare Rolle, konkrete Einschränkungen und Beispiele reduzieren Mehrdeutigkeit in einem Sprachmodell-Prompt.", vec: [ 0.0, 0.1, 0.0, 0.95 ] }
		] : [
			{ title: "Eiffel Tower", text: "The Eiffel Tower in Paris is 330 metres tall and was completed in 1889 for the World's Fair.", vec: [ 0.95, 0.05, 0.05, 0.05 ] },
			{ title: "Paris tourism", text: "Paris attracts millions of visitors; the tower is one of the most visited monuments in the world.", vec: [ 0.8, 0.1, 0.0, 0.1 ] },
			{ title: "RAG pipeline", text: "Retrieval-augmented generation chunks documents, embeds them, retrieves passages, and puts them in the prompt.", vec: [ 0.0, 0.95, 0.2, 0.1 ] },
			{ title: "Vector databases", text: "Vector databases store embeddings and support approximate nearest-neighbour search over them.", vec: [ 0.0, 0.3, 0.95, 0.0 ] },
			{ title: "Prompt engineering", text: "A clear role, specific constraints, and examples reduce ambiguity in a language-model prompt.", vec: [ 0.0, 0.1, 0.0, 0.95 ] }
		];
		var queries = {
			"Eiffel Tower height": [ 0.95, 0.05, 0.0, 0.05 ],
			"Eiffel opening hours": [ 0.92, 0.08, 0.02, 0.03 ],
			"RAG pipeline": [ 0.0, 0.95, 0.2, 0.1 ],
			"vector database": [ 0.0, 0.2, 0.95, 0.0 ]
		};
		var queryLabels = DEMO_DE ? {
			"Eiffel Tower height": "Höhe des Eiffelturms",
			"Eiffel opening hours": "Öffnungszeiten des Eiffelturms",
			"RAG pipeline": "RAG-Pipeline",
			"vector database": "Vektordatenbank"
		} : {};
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
					'<span class="retrieval-score">cos ' + r.s.toFixed(2) + (ins ? (DEMO_DE ? ' · im Prompt' : ' · in prompt') : '') + '</span></div>';
			}).join("");
			if (top) top.textContent = ranked[0].c.title;
			if (countEl) countEl.textContent = selected.length + (DEMO_DE ? " von " : " of ") + chunks.length;
			if (scoreEl) scoreEl.textContent = ranked[0].s.toFixed(2);
			if (promptEl) {
				promptEl.textContent = (DEMO_DE ? "Kontext:\n" : "Context:\n") + selected.map(function (r, i) {
					return "[" + (i + 1) + "] " + r.c.title + " — " + r.c.text;
				}).join("\n\n") + (DEMO_DE ? "\n\nFrage: " : "\n\nQuestion: ") + (DEMO_DE ? (queryLabels[query] || query) : query) + (DEMO_DE ? "\nAntwort:" : "\nAnswer:");
			}
			if (noteEl) {
				noteEl.innerHTML = query === "Eiffel opening hours"
					? (DEMO_DE
						? "<b>Retrieval fand das richtige Thema, nicht den richtigen Fakt.</b> Die Top-Passage handelt von der Höhe; Öffnungszeiten enthält sie nicht. Nähe ≠ Antwort."
						: "<b>Retrieval found the right topic, not the right fact.</b> The top passage is about height; it contains no opening hours. Nearest ≠ answer.")
					: (DEMO_DE
						? "Der Score misst die Ausrichtung im Embedding-Raum, nicht ob die Passage die Frage beantwortet."
						: "The score measures alignment in the embedding space, not whether the passage answers the question.");
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
		var labels = DEMO_DE ? { role: "Du bist ein geduldiger Tutor.", format: "Antworte in drei Stichpunkten.", examples: "Beispiel: ...", constraints: "Erfinde keine Quellen." } : { role: "You are a patient tutor.", format: "Answer in three bullet points.", examples: "Example: ...", constraints: "Do not invent sources." };
		function render() {
			var on = chips.filter(function (c) { return c.classList.contains("is-on"); }).map(function (c) { return c.getAttribute("data-entropy"); });
			var left = Math.max(8, 100 - on.length * 22);
			bar.style.width = left + "%";
			if (value) value.textContent = left + "%";
			if (preview) preview.textContent = on.length ? on.map(function (k) { return labels[k]; }).join(" ") : (DEMO_DE ? "Erzähl mir etwas über KI." : "Tell me about AI.");
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
			if (answer) answer.innerHTML = stepMode
				? 'Answer: <b>$0.05</b> <span style="color:var(--tm-green-deep)">· follows from the steps</span>'
				: 'Answer: <b>$0.10</b> <span style="color:var(--tm-coral)">· the intuitive trap</span>';
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
		var currentIndex = 0;
		function updateTimelineNav() {
			if (prev) prev.disabled = currentIndex <= 0;
			if (next) next.disabled = currentIndex >= nodes.length - 1;
		}
		function panelHtml(n) {
			var href = n.getAttribute("data-href");
			var hrefLabel = n.getAttribute("data-href-label") || "Explore this section";
			var link = href ? '<p class="tl-link"><a class="btn btn--green" href="' + href + '">' + escapeHtml(hrefLabel) + ' →</a></p>' : "";
			var img = TM.asset(n.getAttribute("data-image"));
			var caption = n.getAttribute("data-image-caption");
			var imgLink = n.getAttribute("data-image-link");
			var imgTag = img ? '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(n.getAttribute("data-image-alt") || "") + '" loading="lazy">' : "";
			if (imgTag && imgLink) imgTag = '<a href="' + escapeHtml(imgLink) + '" rel="noopener">' + imgTag + '</a>';
			var figure = img ? '<figure>' + imgTag + (caption ? '<figcaption>' + escapeHtml(caption) + '</figcaption>' : '') + '</figure>' : "";
			return {
				hasImage: !!img,
				html: '<div class="tl-copy"><div class="tl-era">' + escapeHtml(n.getAttribute("data-meta") || "") + '</div>' +
					'<h3>' + escapeHtml(n.getAttribute("data-title") || "") + '</h3>' +
					'<p>' + escapeHtml(n.getAttribute("data-body") || "") + '</p>' + link + '</div>' + figure
			};
		}
		function select(i) {
			currentIndex = Math.max(0, Math.min(nodes.length - 1, i));
			nodes.forEach(function (n, j) { n.classList.toggle("is-active", currentIndex === j); });
			var n = nodes[currentIndex];
			updateTimelineNav();
			if (!n) return;
			var p = panelHtml(n);
			panel.classList.toggle("no-figure", !p.hasImage);
			panel.innerHTML = p.html;
		}
		function waitForImage(img) {
			return new Promise(function (resolve) {
				var done = false;
				function finish() { if (!done) { done = true; resolve(); } }
				if (img.complete) { finish(); return; }
				img.addEventListener("load", finish, { once: true });
				img.addEventListener("error", finish, { once: true });
				setTimeout(finish, 2500);
			});
		}
		async function measurePanelHeight() {
			var width = panel.getBoundingClientRect().width;
			if (!width) return;
			var probe = document.createElement("div");
			probe.className = "tl-panel";
			probe.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;height:auto;min-height:0;overflow:visible;width:" + width + "px;";
			document.body.appendChild(probe);
			var max = 0;
			for (var i = 0; i < nodes.length; i++) {
				var p = panelHtml(nodes[i]);
				probe.classList.toggle("no-figure", !p.hasImage);
				probe.innerHTML = p.html;
				var images = Array.prototype.slice.call(probe.querySelectorAll("img"));
				images.forEach(function (img) { img.loading = "eager"; });
				await Promise.all(images.map(waitForImage));
				max = Math.max(max, probe.offsetHeight);
			}
			document.body.removeChild(probe);
			if (max) {
				panel.style.height = "auto";
				panel.style.minHeight = Math.ceil(max) + "px";
				panel.style.overflowY = "visible";
			}
		}
		nodes.forEach(function (n, i) {
			n.addEventListener("click", function () { select(i); n.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); });
		});
		if (prev) prev.addEventListener("click", function () {
			if (currentIndex <= 0) return;
			select(currentIndex - 1);
			nodes[currentIndex].scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
		});
		if (next) next.addEventListener("click", function () {
			if (currentIndex >= nodes.length - 1) return;
			select(currentIndex + 1);
			nodes[currentIndex].scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
		});
		select(0);
		measurePanelHeight();
		var measureTimer = null;
		window.addEventListener("resize", function () {
			clearTimeout(measureTimer);
			measureTimer = setTimeout(measurePanelHeight, 150);
		});
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
		var samplesEl = $("[data-wave-samples]", root);
		var framesEl = $("[data-wave-frames]", root);
		var ratioEl = $("[data-wave-ratio]", root);
		if (!canvas) return;
		function sampleAt(t) {
			var env = 0.35 + 0.65 * Math.exp(-Math.pow((t - 0.38) / 0.32, 2));
			return env * (Math.sin(t * 78 + Math.sin(t * 9) * 1.4) * 0.55 +
				Math.sin(t * 151) * 0.25 + Math.sin(t * 23) * 0.2);
		}
		function draw(ctx, W, H) {
			var c = colors();
			var n = parseInt(range && range.value, 10) || 32;
			if (out) out.textContent = n + " tokens";
			var seconds = 1.0;
			var samples = 16000 * seconds;
			if (samplesEl) samplesEl.textContent = "16,000";
			if (framesEl) framesEl.textContent = n;
			if (ratioEl) ratioEl.textContent = Math.round(samples / n).toLocaleString() + "×";
			ctx.clearRect(0, 0, W, H);
			var padL = 16, padR = 16;
			var innerW = W - padL - padR;

			/* waveform */
			var waveTop = 26, waveH = H * 0.25;
			var mid = waveTop + waveH / 2;
			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			ctx.beginPath(); ctx.moveTo(padL, mid); ctx.lineTo(padL + innerW, mid); ctx.stroke();
			ctx.strokeStyle = c.petrol;
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			for (var i = 0; i <= Math.min(innerW * 1.4, 700); i++) {
				var t = i / Math.min(innerW * 1.4, 700);
				var px = padL + t * innerW;
				var y = sampleAt(t) * waveH * 0.48;
				if (i) ctx.lineTo(px, mid - y); else ctx.moveTo(px, mid - y);
			}
			ctx.stroke();

			/* spectrogram */
			var specTop = waveTop + waveH + 22;
			var specH = H * 0.30;
			var bins = 22, cols = 64;
			var cw = innerW / cols, ch = specH / bins;
			for (var col = 0; col < cols; col++) {
				var tt = col / (cols - 1);
				for (var bin = 0; bin < bins; bin++) {
					var f = bin / (bins - 1);
					var formant = Math.exp(-Math.pow((f - 0.18 - 0.12 * Math.sin(tt * 7)) / 0.13, 2)) * 0.85 +
						Math.exp(-Math.pow((f - 0.42 - 0.08 * Math.sin(tt * 5 + 1)) / 0.10, 2)) * 0.7 +
						Math.exp(-Math.pow((f - 0.68) / 0.12, 2)) * 0.35;
					var energy = Math.max(0, formant * (0.6 + 0.4 * Math.sin(tt * 31 + f * 8)) * (0.4 + 0.6 * Math.exp(-Math.pow((tt - 0.42) / 0.35, 2))));
					var base = hexToRgb(c.paper2);
					var end = energy > 0.55 ? hexToRgb(c.gold) : (energy > 0.28 ? hexToRgb(c.sky) : hexToRgb(c.green));
					ctx.fillStyle = rgb(mix(base, end, clamp(energy, 0, 1)));
					ctx.fillRect(padL + col * cw, specTop + (bins - 1 - bin) * ch, cw + 0.5, ch + 0.5);
				}
			}
			ctx.strokeStyle = c.line;
			ctx.strokeRect(padL, specTop, innerW, specH);

			/* tokens */
			var tokTop = specTop + specH + 24;
			var tokH = Math.max(16, H - tokTop - 22);
			var gap = 3, w = (innerW - gap * (n - 1)) / n;
			var colsPal = [c.green, c.sky, c.gold, c.coral, c.lime, c.petrol, c.blue];
			for (var k = 0; k < n; k++) {
				ctx.fillStyle = colsPal[k % colsPal.length];
				ctx.globalAlpha = 0.9;
				ctx.fillRect(padL + k * (w + gap), tokTop, Math.max(2, w), tokH);
				ctx.globalAlpha = 1;
			}
			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.fillText("waveform · 16,000 samples per second", padL, 15);
			ctx.fillText("spectrogram · frequency over time", padL, specTop - 6);
			ctx.fillText("codec tokens · " + n + " for one second", padL, tokTop - 6);
			ctx.fillStyle = c.faint;
			ctx.font = "500 9px ui-monospace, monospace";
			ctx.fillText("time →", padL + innerW - 40, specTop + specH + 11);
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
		onTeardown(root, function () { if (raf) { cancelAnimationFrame(raf); raf = null; } });
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
		var DE = !!(window.TM && TM.lang && TM.lang() === "de");
		var pairs = [
			{
				q: "Explain photosynthesis to a 10-year-old.",
				qDe: "Erkläre Photosynthese einem 10-Jährigen.",
				a: "Plants use sunlight to turn water and air into food. They release oxygen, which is the air we breathe.",
				aDe: "Pflanzen nutzen Sonnenlicht, um Wasser und Luft in Nahrung zu verwandeln. Sie geben Sauerstoff ab, die Luft, die wir atmen.",
				b: "Photosynthesis is a biochemical process involving chlorophyll, photons, and the Calvin cycle.",
				bDe: "Photosynthese ist ein biochemischer Prozess mit Chlorophyll, Photonen und dem Calvin-Zyklus."
			},
			{
				q: "Why does the sky look blue?",
				qDe: "Warum sieht der Himmel blau aus?",
				a: "Sunlight contains all colours. Air scatters the short blue wavelengths more than the long red ones, so blue reaches your eyes from every direction.",
				aDe: "Sonnenlicht enthält alle Farben. Luft streut die kurzen blauen Wellenlängen stärker als die langen roten, sodass Blau aus jeder Richtung in deine Augen gelangt.",
				b: "Rayleigh scattering.",
				bDe: "Rayleigh-Streuung."
			},
			{
				q: "Write a Python function that reverses a string.",
				qDe: "Schreibe eine Python-Funktion, die einen String umdreht.",
				a: "Use `return s[::-1]`; it is linear time and the standard solution.",
				aDe: "Nutze `return s[::-1]`; das ist lineare Zeit und die Standardlösung.",
				b: "Convert the string to a list, reverse it with a loop, then join it; that is the only correct way.",
				bDe: "Wandle den String in eine Liste um, drehe sie mit einer Schleife und joine sie; nur so ist es korrekt."
			},
			{
				q: "Summarise Hamlet in two sentences.",
				qDe: "Fasse Hamlet in zwei Sätzen zusammen.",
				a: "Hamlet, Prince of Denmark, delays avenging his father's murder; his indecision drags the court into a cycle of death.",
				aDe: "Hamlet, Prinz von Dänemark, zögert, den Mord an seinem Vater zu rächen; sein Zögern zieht den Hof in einen Kreislauf des Todes.",
				b: "A prince sees a ghost and something tragic happens at the end.",
				bDe: "Ein Prinz sieht einen Geist, und am Ende passiert etwas Tragisches."
			},
			{
				q: "Explain what a transformer is to a beginner.",
				qDe: "Erkläre einem Anfänger, was ein Transformer ist.",
				a: "A transformer lets every token look at the other tokens, decides which ones matter, and repeats that block many times.",
				aDe: "Ein Transformer lässt jedes Token auf die anderen Tokens schauen, entscheidet, welche wichtig sind, und wiederholt diesen Block viele Male.",
				b: "A transformer is a decoder stack with multi-head attention, residual connections, layer normalisation, feed-forward networks and an unembedding.",
				bDe: "Ein Transformer ist ein Decoder-Stack mit Multi-Head-Attention, Residual Connections, Layer Normalisation, Feed-Forward-Netzen und einem Unembedding."
			},
			{
				q: "A user asks for medical advice. What should the assistant do?",
				qDe: "Ein Nutzer fragt nach medizinischer Beratung. Was soll der Assistent tun?",
				a: "Say that you are not a doctor, mention urgent warning signs, and advise contacting a medical professional.",
				aDe: "Sagen, dass du keine Ärztin bist, auf dringende Warnsignale hinweisen und empfehlen, medizinische Hilfe zu suchen.",
				b: "Give a diagnosis and prescribe a treatment.",
				bDe: "Eine Diagnose stellen und eine Behandlung verschreiben."
			}
		];
		var idx = 0;
		function render() {
			var p = pairs[idx];
			if (question) question.textContent = DE ? p.qDe : p.q;
			cards[0].querySelector("p").textContent = DE ? p.aDe : p.a;
			cards[1].querySelector("p").textContent = DE ? p.bDe : p.b;
			cards.forEach(function (c) { c.classList.remove("is-on"); });
			if (choice) choice.textContent = "—";
			if (signal) signal.textContent = "—";
		}
		cards.forEach(function (card) {
			card.addEventListener("click", function () {
				cards.forEach(function (c) { c.classList.remove("is-on"); });
				card.classList.add("is-on");
				var chosen = card.getAttribute("data-pref");
				if (choice) choice.textContent = chosen === "a" ? (DE ? "Antwort A" : "Answer A") : (DE ? "Antwort B" : "Answer B");
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
		var question = $("[data-lens-question]", root);
		var prompt = $("[data-lens-prompt]", root);
		var title = $(".demo-title", root);
		var sub = $(".demo-sub", root);
		if (!bars || !range) return;
		var DE = !!(window.TM && TM.lang && TM.lang() === "de");
		if (title) title.innerHTML = DE ? 'Sieh die Antwort entstehen <span>· Demo</span>' : 'Watch the answer form <span>· demo</span>';
		if (sub) sub.textContent = DE ? "Die Logit-Linse liest den Residual Stream in jeder Schicht. Frühe Schichten sind unentschieden; die finalen Schichten konzentrieren sich auf die Antwort." : "The logit lens reads the residual stream at each layer. Early layers are undecided; the final layers concentrate on the answer.";
		var tokens = DE ? [ "die", "Stadt", "Hauptstadt", "Frankreich", "Lyon", "Paris" ] : [ "the", "city", "capital", "France", "Lyon", "Paris" ];
		var layers = [
			[ 0.28, 0.21, 0.18, 0.14, 0.11, 0.08 ],
			[ 0.12, 0.26, 0.24, 0.18, 0.12, 0.08 ],
			[ 0.05, 0.10, 0.30, 0.25, 0.18, 0.12 ],
			[ 0.03, 0.04, 0.08, 0.18, 0.34, 0.33 ],
			[ 0.01, 0.02, 0.03, 0.06, 0.22, 0.66 ],
			[ 0.01, 0.01, 0.01, 0.02, 0.08, 0.87 ],
			[ 0.00, 0.00, 0.00, 0.01, 0.03, 0.96 ]
		];
		var names = DE ? [ "Embedding", "Block 1", "Block 2", "Block 3", "Block 4", "Block 5", "Ausgabe" ] : [ "embedding", "block 1", "block 2", "block 3", "block 4", "block 5", "output" ];
		if (question) question.textContent = DE ? "Frage: Was ist die Hauptstadt Frankreichs?" : "Question: What is the capital of France?";
		if (prompt) prompt.textContent = DE ? "Die Hauptstadt von Frankreich ist ___" : "The capital of France is ___";
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
		var sizeEl = $("[data-filter-size]", root);
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
			if (sizeEl) {
				var pb = kept / docs.length * 100;
				sizeEl.textContent = kept ? "≈ " + (pb >= 1 ? pb.toFixed(1) + " PB" : (pb * 1000).toFixed(0) + " GB") : "0 PB";
			}
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

	/* ── next-token predictor ───────────────────────────────── */

	function initPredict(root) {
		var contextEl = $("[data-predict-context]", root);
		var candsEl = $("[data-predict-cands]", root);
		var traceEl = $("[data-predict-trace]", root);
		var temp = $("[data-predict-temp]", root);
		var tempOut = $("[data-predict-temp-out]", root);
		var stepOut = $("[data-predict-step]", root);
		var entropyOut = $("[data-predict-entropy]", root);
		var topOut = $("[data-predict-top]", root);
		var noteEl = $("[data-predict-note]", root);
		var stepBtn = $("[data-predict-step-btn]", root);
		var resetBtn = $("[data-predict-reset]", root);
		var runBtn = $("[data-predict-run]", root);
		var modeChips = $$("[data-predict-mode-value]", root);
		if (!contextEl || !candsEl) return;
		var running = false;
		var runTimer = null;
		onTeardown(root, function () { if (runTimer) { clearInterval(runTimer); runTimer = null; } });

		var states = {
			start: [
				{ t: "mat", z: 2.7, next: "mat" },
				{ t: "floor", z: 1.9, next: "floor" },
				{ t: "sofa", z: 1.2, next: "sofa" },
				{ t: "table", z: 0.8, next: "floor" },
				{ t: "moon", z: 0.0, next: "moon" }
			],
			mat: [
				{ t: ".", z: 2.9, next: null },
				{ t: "and", z: 1.4, next: "and" },
				{ t: ",", z: 1.1, next: null },
				{ t: "then", z: 0.6, next: "then" }
			],
			floor: [
				{ t: ".", z: 2.6, next: null },
				{ t: "and", z: 1.8, next: "and" },
				{ t: ",", z: 1.0, next: null }
			],
			sofa: [
				{ t: ".", z: 2.4, next: null },
				{ t: "and", z: 1.6, next: "and" }
			],
			moon: [
				{ t: ".", z: 1.2, next: null },
				{ t: "!", z: 1.0, next: null }
			],
			and: [
				{ t: "purred", z: 2.0, next: "purred" },
				{ t: "slept", z: 1.6, next: "slept" },
				{ t: "looked", z: 1.2, next: "looked" },
				{ t: "the", z: 0.7, next: "the" }
			],
			then: [
				{ t: "slept", z: 1.9, next: "slept" },
				{ t: "purred", z: 1.4, next: "purred" }
			],
			purred: [
				{ t: ".", z: 2.8, next: null },
				{ t: "softly", z: 1.2, next: "softly" }
			],
			slept: [
				{ t: ".", z: 2.7, next: null },
				{ t: "quietly", z: 1.1, next: "quietly" }
			],
			looked: [
				{ t: ".", z: 2.1, next: null },
				{ t: "up", z: 1.5, next: "up" }
			],
			the: [
				{ t: "mat", z: 2.2, next: "mat" },
				{ t: "floor", z: 1.7, next: "floor" }
			],
			softly: [
				{ t: ".", z: 2.6, next: null },
				{ t: "and", z: 0.8, next: "and" }
			],
			quietly: [
				{ t: ".", z: 2.5, next: null },
				{ t: "and", z: 0.7, next: "and" }
			],
			up: [
				{ t: ".", z: 2.2, next: null },
				{ t: "at", z: 1.1, next: "at" }
			],
			at: [
				{ t: "the", z: 2.0, next: "the" },
				{ t: "me", z: 1.2, next: null }
			]
		};

		var words = ["The", "cat", "sat", "on", "the"];
		var stateKey = "start";
		var terminal = false;
		var mode = "sample";
		var steps = 0;

		function joinWords(list) {
			var out = "";
			list.forEach(function (w) {
				if (w === "." || w === "," || w === "!" || w === "?") out += w;
				else out += (out ? " " : "") + w;
			});
			return out;
		}
		function softmax(cands, T) {
			var exps = cands.map(function (x) { return Math.exp(x.z / T); });
			var sum = exps.reduce(function (a, b) { return a + b; }, 0) || 1;
			return exps.map(function (e) { return e / sum; });
		}
		function pickFrom(probs) {
			var r = Math.random(), acc = 0;
			for (var i = 0; i < probs.length; i++) {
				acc += probs[i];
				if (r <= acc) return i;
			}
			return probs.length - 1;
		}
		function render() {
			var T = clamp(parseFloat(temp && temp.value) || 0.8, 0.1, 2);
			if (tempOut) tempOut.textContent = T.toFixed(2);
			var cands = states[stateKey] || [];
			var probs = softmax(cands, T);
			var maxI = probs.length ? probs.indexOf(Math.max.apply(null, probs)) : -1;
			var ent = -probs.reduce(function (a, p) { return a + (p > 0 ? p * Math.log(p) / Math.LN2 : 0); }, 0);
			if (stepOut) stepOut.textContent = steps + (terminal ? " · end" : "");
			if (entropyOut) entropyOut.textContent = terminal ? "—" : ent.toFixed(2) + " bits";
			if (topOut) topOut.textContent = terminal ? "—" : (maxI >= 0 ? cands[maxI].t : "—");
			var pendingClass = running && !terminal ? " is-pending" : "";
			contextEl.innerHTML = escapeHtml(joinWords(words)) + ' <span class="nt-pred' + (steps && !running ? " is-fresh" : "") + pendingClass + '">' + (terminal ? "∎" : "___") + "</span>";
			if (traceEl) {
				traceEl.innerHTML = words.slice(5).map(function (w) { return "<span>" + escapeHtml(w) + "</span>"; }).join("");
			}
			if (terminal) {
				candsEl.innerHTML = "";
				if (noteEl) noteEl.textContent = "The sentence is complete. Reset and choose a different continuation — the model never sees the whole tree at once.";
				return;
			}
			candsEl.innerHTML = cands.map(function (c, i) {
				return '<button class="nt-cand' + (i === maxI ? " is-top" : "") + '" type="button" data-predict-i="' + i + '">' +
					'<span>' + escapeHtml(c.t) + '</span>' +
					'<span class="nt-bar"><i style="width:' + (probs[i] * 100).toFixed(1) + '%"></i></span>' +
					'<span class="nt-pct">' + Math.round(probs[i] * 100) + '%</span></button>';
			}).join("");
			$$("[data-predict-i]", candsEl).forEach(function (btn) {
				btn.addEventListener("click", function () {
					var i = parseInt(btn.getAttribute("data-predict-i"), 10);
					if (!isNaN(i)) choose(i, cands, probs);
				});
			});
			if (noteEl) {
				var msg = "Temperature " + T.toFixed(2) + " reshapes the same logits. ";
				if (T < 0.45) msg += "Low temperature concentrates the mass: safe, repetitive, sometimes stuck.";
				else if (T > 1.35) msg += "High temperature flattens the mass: surprising, inventive, sometimes incoherent.";
				else msg += "The top token usually wins, but the tail is still alive.";
				noteEl.textContent = msg;
			}
		}
		function choose(i, cands, probs) {
			var c = cands[i];
			if (!c) return;
			$$(".nt-cand", candsEl).forEach(function (btn) {
				btn.classList.toggle("is-picked", parseInt(btn.getAttribute("data-predict-i"), 10) === i);
			});
			words.push(c.t);
			steps++;
			stateKey = c.next || "";
			terminal = !c.next;
			setTimeout(render, 90);
		}
		function sample() {
			var cands = states[stateKey] || [];
			if (!cands.length) return;
			var probs = softmax(cands, clamp(parseFloat(temp && temp.value) || 0.8, 0.1, 2));
			choose(mode === "greedy" ? probs.indexOf(Math.max.apply(null, probs)) : pickFrom(probs), cands, probs);
		}
		function reset() {
			words = ["The", "cat", "sat", "on", "the"];
			stateKey = "start";
			terminal = false;
			steps = 0;
			render();
		}
		modeChips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				modeChips.forEach(function (x) { x.classList.remove("is-on"); });
				chip.classList.add("is-on");
				mode = chip.getAttribute("data-predict-mode-value");
				render();
			});
		});
		if (temp) temp.addEventListener("input", render);
		function startRun() {
			running = true;
			if (runBtn) runBtn.textContent = "Stop";
			render();
			runTimer = setInterval(function () {
				if (terminal) { stopRun("Sentence complete · reset to try another"); return; }
				sample();
				if (terminal) stopRun("Sentence complete · reset to try another");
			}, 520);
		}
		function stopRun(note) {
			running = false;
			if (runTimer) { clearInterval(runTimer); runTimer = null; }
			if (runBtn) runBtn.textContent = "Run the loop ▶";
			if (note && noteEl) noteEl.textContent = note;
			render();
		}
		if (runBtn) runBtn.addEventListener("click", function () {
			if (running) stopRun();
			else startRun();
		});
		if (resetBtn) resetBtn.addEventListener("click", function () { stopRun(); reset(); });
		if (stepBtn) stepBtn.addEventListener("click", sample);
		render();
	}

	/* ── perceptron ─────────────────────────────────────────── */

	function initPerceptron(root) {
		var canvas = $("[data-perceptron-canvas]", root);
		var trainBtn = $("[data-perceptron-train]", root);
		var runBtn = $("[data-perceptron-run]", root);
		var resetBtn = $("[data-perceptron-reset]", root);
		var accEl = $("[data-perceptron-acc]", root);
		var accA = $("[data-perceptron-acc-a]", root);
		var accB = $("[data-perceptron-acc-b]", root);
		var wEl = $("[data-perceptron-w]", root);
		var bEl = $("[data-perceptron-b]", root);
		var noteEl = $("[data-perceptron-note]", root);
		var lossEl = $("[data-perceptron-loss]", root);
		var lossChart = $("[data-perceptron-loss-chart]", root);
		var lossHistory = [];
		var lossApi = null;
		var running = false;
		var modeChips = $$("[data-perceptron-dataset]", root);
		if (!canvas) return;

		var pts = [];
		var seed = 0;
		var mode = "separable";
		function rnd() { seed += 1; var x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
		function randn() { return (rnd() + rnd() + rnd() + rnd() - 2) * 0.9; }
		function build(kind) {
			pts = [];
			seed = kind === "xor" ? 31 : 7;
			if (kind === "xor") {
				for (var q = 0; q < 32; q++) {
					var qx = (q % 2 === 0) ? 1 : -1;
					var qy = (Math.floor(q / 2) % 2 === 0) ? 1 : -1;
					pts.push({
						x: qx * (0.34 + rnd() * 0.56),
						y: qy * (0.34 + rnd() * 0.56),
						yTrue: qx * qy > 0 ? 1 : -1
					});
				}
			} else {
				for (var i = 0; i < 26; i++) {
					pts.push({ x: -0.42 + randn() * 0.22, y: -0.32 + randn() * 0.22, yTrue: 1 });
				}
				for (var j = 0; j < 26; j++) {
					pts.push({ x: 0.46 + randn() * 0.22, y: 0.36 + randn() * 0.22, yTrue: -1 });
				}
			}
		}
		var w = [0.25, 0.32];
		var b = -0.08;
		var cursor = 0;
		var lr = 0.12;
		var steps = 0;

		function pred(p) { return w[0] * p.x + w[1] * p.y + b >= 0 ? 1 : -1; }
		function accuracy() {
			var ok = 0, okA = 0, nA = 0, okB = 0, nB = 0;
			pts.forEach(function (p) {
				var correct = pred(p) === p.yTrue;
				if (correct) ok++;
				if (p.yTrue === 1) { nA++; if (correct) okA++; }
				else { nB++; if (correct) okB++; }
			});
			return { all: ok / pts.length, a: nA ? okA / nA : 0, b: nB ? okB / nB : 0 };
		}
		function draw(ctx, W, H) {
			var c = colors();
			var pad = 30;
			function px(x) { return pad + (x + 1.25) / 2.5 * (W - pad * 2); }
			function py(y) { return H - pad - (y + 1.25) / 2.5 * (H - pad * 2); }
			ctx.clearRect(0, 0, W, H);
			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			for (var g = -1; g <= 1; g += 0.5) {
				ctx.beginPath();
				ctx.moveTo(px(g), py(-1.2)); ctx.lineTo(px(g), py(1.2));
				ctx.moveTo(px(-1.2), py(g)); ctx.lineTo(px(1.2), py(g));
				ctx.stroke();
			}
			ctx.strokeStyle = c.lineStrong;
			ctx.beginPath();
			ctx.moveTo(px(-1.2), py(0)); ctx.lineTo(px(1.2), py(0));
			ctx.moveTo(px(0), py(-1.2)); ctx.lineTo(px(0), py(1.2));
			ctx.stroke();
			var denom = w[1];
			if (Math.abs(denom) > 1e-6) {
				var x1 = -1.2, y1 = -(w[0] * x1 + b) / denom;
				var x2 = 1.2, y2 = -(w[0] * x2 + b) / denom;
				ctx.strokeStyle = c.green;
				ctx.lineWidth = 2.4;
				ctx.beginPath(); ctx.moveTo(px(x1), py(y1)); ctx.lineTo(px(x2), py(y2)); ctx.stroke();
			} else if (Math.abs(w[0]) > 1e-6) {
				var xv = -b / w[0];
				ctx.strokeStyle = c.green;
				ctx.lineWidth = 2.4;
				ctx.beginPath(); ctx.moveTo(px(xv), py(-1.2)); ctx.lineTo(px(xv), py(1.2)); ctx.stroke();
			}
			pts.forEach(function (p) {
				var correct = pred(p) === p.yTrue;
				ctx.beginPath();
				ctx.arc(px(p.x), py(p.y), 4.6, 0, Math.PI * 2);
				ctx.fillStyle = p.yTrue === 1 ? c.green : c.sky;
				ctx.fill();
				ctx.strokeStyle = correct ? c.card : c.coral;
				ctx.lineWidth = correct ? 1.4 : 2.4;
				ctx.stroke();
			});
			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.fillText("x₁", W - 18, py(0) - 7);
			ctx.fillText("x₂", px(0) + 7, 14);
			var a = accuracy();
			if (accEl) accEl.textContent = Math.round(a.all * 100) + "%";
			if (accA) accA.textContent = Math.round(a.a * 100) + "%";
			if (accB) accB.textContent = Math.round(a.b * 100) + "%";
			if (wEl) wEl.textContent = w[0].toFixed(2) + " / " + w[1].toFixed(2);
			if (bEl) bEl.textContent = b.toFixed(2);
			if (lossEl) lossEl.textContent = Math.round((1 - a.all) * 100) + "%";
			if (mode === "xor" && steps > 12) {
				ctx.fillStyle = c.coral;
				ctx.font = "700 11px Barlow, system-ui, sans-serif";
				ctx.textAlign = "center";
				ctx.fillText("a straight line cannot separate XOR", W / 2, 14);
				ctx.textAlign = "left";
			}
			if (noteEl) {
				if (mode === "xor" && steps > 12) {
					noteEl.innerHTML = "<b>The line is stuck.</b> No straight boundary separates XOR. This is the limit that hidden layers and nonlinearity exist to break.";
				} else if (a.all === 1) {
					noteEl.innerHTML = "Separated. A single straight line is enough — because this toy is linearly separable. Try <b>XOR</b> to see the failure.";
				} else {
					noteEl.innerHTML = "<b>" + steps + " updates.</b> Each mistake pushes the line: w ← w + η·y·x, b ← b + η·y.";
				}
			}
		}
		function update() {
			var tries = 0;
			while (tries < pts.length) {
				var p = pts[cursor % pts.length];
				cursor++;
				tries++;
				var y = pred(p);
				if (y !== p.yTrue) {
					w[0] += lr * p.yTrue * p.x;
					w[1] += lr * p.yTrue * p.y;
					b += lr * p.yTrue;
					steps++;
					return true;
				}
			}
			return false;
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		function drawLossChart(ctx, W, H) {
			var c = colors();
			ctx.clearRect(0, 0, W, H);
			var padL = 40, padR = 12, padT = 10, padB = 22;
			var n = lossHistory.length;
			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(padL, padT);
			ctx.lineTo(padL, H - padB);
			ctx.lineTo(W - padR, H - padB);
			ctx.stroke();
			ctx.beginPath();
			lossHistory.forEach(function (v, i) {
				var x = n <= 1 ? padL : padL + i / (n - 1) * (W - padL - padR);
				var y = H - padB - v * (H - padT - padB);
				if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
			});
			ctx.strokeStyle = c.green;
			ctx.lineWidth = 2;
			ctx.stroke();
			if (n > 0) {
				var last = lossHistory[n - 1];
				ctx.fillStyle = c.green;
				ctx.beginPath();
				ctx.arc(n === 1 ? padL : W - padR, H - padB - last * (H - padT - padB), 3, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.fillStyle = c.muted;
			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.fillText("100%", padL - 5, padT + 8);
			ctx.fillText("0%", padL - 5, H - padB);
			ctx.textAlign = "left";
			ctx.fillText(DEMO_DE ? "Fehler" : "error", padL + 4, padT + 8);
			ctx.textAlign = "right";
			ctx.fillText(DEMO_DE ? "Update" : "update", W - padR, H - 6);
			ctx.textAlign = "left";
		}
		if (lossChart) lossApi = canvasDemo(lossChart, drawLossChart);
		function redraw() { api.redraw(); if (lossApi) lossApi.redraw(); }
		if (trainBtn) trainBtn.addEventListener("click", function () {
			if (running) return;
			update();
			lossHistory.push(1 - accuracy().all);
			redraw();
		});
		if (runBtn) runBtn.addEventListener("click", function () {
			if (running) return;
			running = true;
			var count = 0;
			function tick() {
				if (count >= 20) { running = false; return; }
				var changed = update();
				lossHistory.push(1 - accuracy().all);
				redraw();
				count++;
				if (changed && count < 20) setTimeout(tick, 35);
				else running = false;
			}
			setTimeout(tick, 20);
		});
		function reset() {
			build(mode);
			w = [0.25, 0.32];
			b = -0.08;
			cursor = 0;
			steps = 0;
			running = false;
			lossHistory = [1 - accuracy().all];
			redraw();
		}
		if (resetBtn) resetBtn.addEventListener("click", reset);
		modeChips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				modeChips.forEach(function (x) { x.classList.remove("is-on"); });
				chip.classList.add("is-on");
				mode = chip.getAttribute("data-perceptron-dataset") || "separable";
				reset();
			});
		});
		build(mode);
		lossHistory = [1 - accuracy().all];
		redraw();
	}

	/* ── gradient descent ───────────────────────────────────── */

	function initGradient(root) {
		var canvas = $("[data-gradient-canvas]", root);
		var lr = $("[data-gradient-lr]", root);
		var lrOut = $("[data-gradient-lr-out]", root);
		var stepBtn = $("[data-gradient-step]", root);
		var runBtn = $("[data-gradient-run]", root);
		var resetBtn = $("[data-gradient-reset]", root);
		var lossEl = $("[data-gradient-loss]", root);
		var stepEl = $("[data-gradient-step-out]", root);
		var gradEl = $("[data-gradient-grad]", root);
		var noteEl = $("[data-gradient-note]", root);
		var svg = $("[data-gradient-loss-chart]", root);
		if (!canvas) return;

		function f(x, y) {
			return 0.55 * x * x + 1.1 * y * y + 0.28 * Math.sin(2.4 * x) * Math.cos(2.0 * y);
		}
		function grad(x, y) {
			return [
				1.1 * x + 0.672 * Math.cos(2.4 * x) * Math.cos(2.0 * y),
				2.2 * y - 0.56 * Math.sin(2.4 * x) * Math.sin(2.0 * y)
			];
		}
		var start = { x: -2.55, y: 1.95 };
		var pos = { x: start.x, y: start.y };
		var history = [{ x: pos.x, y: pos.y }];
		var losses = [f(pos.x, pos.y)];
		var steps = 0;
		var timer = null;
		onTeardown(root, function () { if (timer) { clearInterval(timer); timer = null; } });
		var ghostSpecs = [
			{ lr: 0.02, label: "slow", color: "sky" },
			{ lr: 0.12, label: "good", color: "gold" },
			{ lr: 1.0, label: "too high", color: "coral" }
		];
		function newGhost(spec) {
			return { lr: spec.lr, label: spec.label, color: spec.color, pos: { x: start.x, y: start.y }, path: [{ x: start.x, y: start.y }] };
		}
		var ghosts = ghostSpecs.map(newGhost);
		function colorFor(name) {
			var c = colors();
			return { sky: c.sky, gold: c.gold, coral: c.coral, green: c.green, petrol: c.petrol }[name] || c.muted;
		}
		function advanceGhost(g) {
			var gr = grad(g.pos.x, g.pos.y);
			g.pos.x = clamp(g.pos.x - g.lr * gr[0], -3, 3);
			g.pos.y = clamp(g.pos.y - g.lr * gr[1], -3, 3);
			g.path.push({ x: g.pos.x, y: g.pos.y });
			if (g.path.length > 220) g.path.shift();
		}

		function draw(ctx, W, H) {
			var c = colors();
			var pad = 28;
			function px(x) { return pad + (x + 3) / 6 * (W - pad * 2); }
			function py(y) { return H - pad - (y + 3) / 6 * (H - pad * 2); }
			ctx.clearRect(0, 0, W, H);
			var cols = 72, rows = 54;
			var cw = (W - pad * 2) / cols, ch = (H - pad * 2) / rows;
			var lo = 1e9, hi = -1e9;
			for (var yy = 0; yy < rows; yy++) {
				for (var xx = 0; xx < cols; xx++) {
					var xv = -3 + 6 * xx / (cols - 1);
					var yv = 3 - 6 * yy / (rows - 1);
					var v = f(xv, yv);
					if (v < lo) lo = v;
					if (v > hi) hi = v;
				}
			}
			var span = hi - lo || 1;
			var cool = hexToRgb(c.paper2), warm = hexToRgb(c.sky), deep = hexToRgb(c.petrol);
			for (var y2 = 0; y2 < rows; y2++) {
				for (var x2 = 0; x2 < cols; x2++) {
					var xv2 = -3 + 6 * x2 / (cols - 1);
					var yv2 = 3 - 6 * y2 / (rows - 1);
					var t = (f(xv2, yv2) - lo) / span;
					var col = t < 0.55 ? mix(cool, warm, t / 0.55) : mix(warm, deep, (t - 0.55) / 0.45);
					ctx.fillStyle = rgb(col);
					ctx.fillRect(px(xv2 - 3 / cols), py(yv2 + 3 / rows), cw + 1, ch + 1);
				}
			}
			ctx.strokeStyle = c.lineStrong;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(px(-3), py(0)); ctx.lineTo(px(3), py(0));
			ctx.moveTo(px(0), py(-3)); ctx.lineTo(px(0), py(3));
			ctx.stroke();
			ghosts.forEach(function (g) {
				ctx.strokeStyle = colorFor(g.color);
				ctx.globalAlpha = 0.75;
				ctx.lineWidth = 1.5;
				ctx.beginPath();
				g.path.forEach(function (p, i) { if (i) ctx.lineTo(px(p.x), py(p.y)); else ctx.moveTo(px(p.x), py(p.y)); });
				ctx.stroke();
				ctx.globalAlpha = 1;
				ctx.beginPath();
				ctx.arc(px(g.pos.x), py(g.pos.y), 4.2, 0, Math.PI * 2);
				ctx.fillStyle = colorFor(g.color);
				ctx.fill();
				ctx.strokeStyle = c.card;
				ctx.lineWidth = 1.4;
				ctx.stroke();
				ctx.fillStyle = colorFor(g.color);
				ctx.font = "600 9px Barlow, system-ui, sans-serif";
				ctx.fillText(g.label, px(g.pos.x) + 7, py(g.pos.y) - 6);
			});
			ctx.strokeStyle = c.petrol;
			ctx.lineWidth = 2;
			ctx.beginPath();
			history.forEach(function (p, i) { if (i) ctx.lineTo(px(p.x), py(p.y)); else ctx.moveTo(px(p.x), py(p.y)); });
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(px(pos.x), py(pos.y), 7, 0, Math.PI * 2);
			ctx.fillStyle = c.green;
			ctx.fill();
			ctx.strokeStyle = c.card;
			ctx.lineWidth = 2;
			ctx.stroke();
			var g = grad(pos.x, pos.y);
			ctx.strokeStyle = c.coral;
			ctx.lineWidth = 2;
			var gx = px(pos.x) + g[0] * 8, gy = py(pos.y) - g[1] * 8;
			ctx.beginPath(); ctx.moveTo(px(pos.x), py(pos.y)); ctx.lineTo(gx, gy); ctx.stroke();
			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.fillText("θ₁", W - 18, py(0) - 7);
			ctx.fillText("θ₂", px(0) + 8, 14);
			ctx.fillText("loss landscape", pad, 16);
			var p = pos;
			var l = f(p.x, p.y);
			if (lossEl) lossEl.textContent = l.toFixed(3);
			if (stepEl) stepEl.textContent = steps;
			if (gradEl) gradEl.textContent = Math.sqrt(g[0] * g[0] + g[1] * g[1]).toFixed(2);
			if (noteEl) {
				if (Math.abs(p.x) > 2.9 || Math.abs(p.y) > 2.9) noteEl.innerHTML = "<b>Diverged.</b> The learning rate is too large; the step overshoots and the loss explodes.";
				else if (l < 0.02) noteEl.innerHTML = "<b>Near the bottom.</b> The gradient is small, so the steps shrink. This is the loop, not a lookup of the answer.";
				else noteEl.innerHTML = "<b>Step " + steps + ".</b> The ball follows −∇loss. The learning rate decides how far it jumps.";
			}
			renderLossChart();
		}
		function renderLossChart() {
			if (!svg) return;
			var max = Math.max.apply(null, losses) * 1.05 || 1;
			var n = Math.max(2, losses.length);
			var pts = losses.map(function (v, i) {
				return (i / (n - 1) * 100).toFixed(2) + "," + (95 - v / max * 85).toFixed(2);
			}).join(" ");
			svg.innerHTML = '<line class="gd-axis" x1="0" y1="95" x2="100" y2="95"></line>' +
				'<polyline class="gd-curve" points="' + pts + '"></polyline>' +
				'<circle class="gd-dot" cx="100" cy="' + (95 - losses[losses.length - 1] / max * 85).toFixed(2) + '" r="2.4"></circle>';
		}
		function step() {
			var rate = clamp(parseFloat(lr && lr.value) || 0.12, 0.005, 1.2);
			if (lrOut) lrOut.textContent = rate.toFixed(2);
			var g = grad(pos.x, pos.y);
			pos.x = clamp(pos.x - rate * g[0], -3, 3);
			pos.y = clamp(pos.y - rate * g[1], -3, 3);
			history.push({ x: pos.x, y: pos.y });
			if (history.length > 220) history.shift();
			ghosts.forEach(advanceGhost);
			losses.push(f(pos.x, pos.y));
			if (losses.length > 90) losses.shift();
			steps++;
			api.redraw();
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		if (lr) lr.addEventListener("input", function () { if (lrOut) lrOut.textContent = (parseFloat(lr.value) || 0.12).toFixed(2); });
		if (stepBtn) stepBtn.addEventListener("click", step);
		if (runBtn) runBtn.addEventListener("click", function () {
			if (timer) { clearInterval(timer); timer = null; runBtn.textContent = "Run / pause"; return; }
			runBtn.textContent = "Pause";
			timer = setInterval(function () {
				step();
				if (Math.abs(pos.x) > 2.995 || Math.abs(pos.y) > 2.995) {
					clearInterval(timer);
					timer = null;
					runBtn.textContent = "Run / pause";
				}
			}, 55);
		});
		if (resetBtn) resetBtn.addEventListener("click", function () {
			if (timer) { clearInterval(timer); timer = null; }
			pos = { x: start.x, y: start.y };
			history = [{ x: pos.x, y: pos.y }];
			ghosts = ghostSpecs.map(newGhost);
			losses = [f(pos.x, pos.y)];
			steps = 0;
			api.redraw();
		});
		api.redraw();
	}

	/* ── verification / synthetic media ─────────────────────── */

	function initVerify(root) {
		var chips = $$("[data-verify-check]", root);
		var meter = $("[data-verify-meter]", root);
		var scoreEl = $("[data-verify-score]", root);
		var verdict = $("[data-verify-verdict]", root);
		var note = $("[data-verify-note]", root);
		if (!chips.length) return;
		var weights = { provenance: 40, watermark: 18, reverse: 24, corroboration: 18 };
		function render() {
			var total = 0;
			chips.forEach(function (chip) {
				if (chip.classList.contains("is-on")) total += weights[chip.getAttribute("data-verify-check")] || 0;
			});
			if (meter) meter.style.width = total + "%";
			if (scoreEl) scoreEl.textContent = total + "/100";
			var label = total >= 80 ? "strong" : total >= 50 ? "moderate" : total >= 25 ? "weak" : "unverified";
			if (verdict) {
				verdict.textContent = "Evidence: " + label;
				verdict.className = "vf-verdict " + (total >= 60 ? "is-good" : total > 0 ? "is-bad" : "");
			}
			if (note) {
				if (total >= 80) note.textContent = "Several independent signals agree. Still not proof, but it is a chain you can inspect.";
				else if (total >= 50) note.textContent = "Enough to slow down, not enough to stop checking. Provenance is stronger than a watermark.";
				else if (total > 0) note.textContent = "A watermark alone can be removed or laundered. The liar's dividend grows when verification is expensive.";
				else note.textContent = "No signal. A fluent image is not evidence. Ask for the source, the original, and a second witness.";
			}
		}
		chips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				chip.classList.toggle("is-on");
				render();
			});
		});
		render();
	}

	/* ── ambiguity ─────────────────────────────────────────── */

	function initAmbiguity(root) {
		var chips = $("[data-ambiguity-chips]", root);
		var sentenceEl = $("[data-ambiguity-sentence]", root);
		var readingsEl = $("[data-ambiguity-readings]", root);
		var noteEl = $("[data-ambiguity-note]", root);
		if (!chips || !sentenceEl || !readingsEl) return;
		var examples = DEMO_DE ? [
			{
				label: "Teleskop",
				before: "Ich sah den Mann ",
				amb: "mit dem Teleskop",
				after: ".",
				readings: [
					["Lesart A · der Mann hat es", "Ich benutzte das Teleskop, um den Mann zu sehen."],
					["Lesart B · ich habe es", "Ich sah einen Mann, der ein Teleskop trug."]
				],
				note: "Die Oberflächensyntax ist identisch. Weltwissen und Kontext entscheiden, welche Lesart überlebt."
			},
			{
				label: "Alte Männer und Frauen",
				before: "",
				amb: "Alte Männer und Frauen",
				after: " können anstrengend sein.",
				readings: [
					["Lesart A · beide alt", "Alte Männer und alte Frauen können anstrengend sein."],
					["Lesart B · nur die Männer alt", "Alte Männer und Frauen jeden Alters können anstrengend sein."]
				],
				note: "Eine Phrase, zwei Reichweiten. Das Modell muss eine plausible Struktur wählen, nicht nur die Wörter parsen."
			},
			{
				label: "Sie habe Hunger",
				before: "Die Mutter sagte, ",
				amb: "sie habe Hunger",
				after: ".",
				readings: [
					["Lesart A · die Mutter", "Die Mutter sagte, dass sie selbst Hunger habe."],
					["Lesart B · eine andere Frau", "Die Mutter sagte, dass eine andere Frau Hunger habe."]
				],
				note: "Ein Pronomen, zwei mögliche Bezüge. Der Kontext entscheidet, wer hungrig ist."
			}
		] : [
			{
				label: "Telescope",
				before: "I saw the man ",
				amb: "with the telescope",
				after: ".",
				readings: [
					["Reading A · the man has it", "I used the telescope to see the man."],
					["Reading B · I have it", "I saw a man who was carrying a telescope."]
				],
				note: "The surface syntax is identical. World knowledge and context decide which reading survives."
			},
			{
				label: "Flying planes",
				before: "",
				amb: "Flying planes",
				after: " can be dangerous.",
				readings: [
					["Reading A · the act", "The act of flying planes can be dangerous."],
					["Reading B · the objects", "Planes that are flying can be dangerous."]
				],
				note: "One phrase, two grammatical roles. A language model must choose a plausible structure, not just parse the words."
			},
			{
				label: "Visiting relatives",
				before: "",
				amb: "Visiting relatives",
				after: " can be exhausting.",
				readings: [
					["Reading A · the act", "The act of visiting relatives can be exhausting."],
					["Reading B · the people", "Relatives who are visiting can be exhausting."]
				],
				note: "Ambiguity is not a bug in language; it is a feature that context repairs. Models are good at the repair, and can still fail."
			}
		];
		var current = 0;
		chips.innerHTML = examples.map(function (ex, i) {
			return '<button class="chip' + (i === 0 ? " is-on" : "") + '" type="button" data-ambiguity-i="' + i + '">' + escapeHtml(ex.label) + "</button>";
		}).join("");
		function render() {
			var ex = examples[current];
			sentenceEl.innerHTML = escapeHtml(ex.before) + '<span class="amb-tok" data-amb-token>' + escapeHtml(ex.amb) + "</span>" + escapeHtml(ex.after);
			readingsEl.innerHTML = ex.readings.map(function (r) {
				return '<div class="amb-reading"><b>' + escapeHtml(r[0]) + "</b><p>" + escapeHtml(r[1]) + "</p></div>";
			}).join("");
			if (noteEl) noteEl.textContent = ex.note;
			$$(".amb-reading", readingsEl).forEach(function (r, i) {
				r.classList.toggle("is-on", i === 0);
			});
			var tok = $("[data-amb-token]", sentenceEl);
			if (tok) tok.addEventListener("click", function () {
				tok.classList.toggle("is-on");
				$$(".amb-reading", readingsEl).forEach(function (r) { r.classList.toggle("is-on"); });
			});
		}
		$$("[data-ambiguity-i]", chips).forEach(function (chip) {
			chip.addEventListener("click", function () {
				$$("[data-ambiguity-i]", chips).forEach(function (x) { x.classList.remove("is-on"); });
				chip.classList.add("is-on");
				current = parseInt(chip.getAttribute("data-ambiguity-i"), 10) || 0;
				render();
			});
		});
		render();
	}

	/* ── negation geometry ─────────────────────────────────── */

	function initNegation(root) {
		var canvas = $("[data-negation-canvas]", root);
		if (!canvas) return;
		var variants = {
			happy: [
				{ x: 0.72, y: 0.34, en: "happy", de: "glücklich", role: "happy" },
				{ x: 0.46, y: 0.20, en: "not happy", de: "nicht glücklich", role: "not" },
				{ x: -0.54, y: -0.42, en: "sad", de: "traurig", role: "sad" },
				{ x: -0.18, y: -0.16, en: "unhappy", de: "unglücklich", role: "unhappy" },
				{ x: 0.60, y: 0.56, en: "joyful", de: "freudig", role: "joyful" }
			],
			sad: [
				{ x: -0.62, y: -0.34, en: "sad", de: "traurig", role: "sad" },
				{ x: -0.36, y: -0.12, en: "not sad", de: "nicht traurig", role: "not" },
				{ x: 0.66, y: 0.44, en: "happy", de: "glücklich", role: "happy" }
			]
		};
		var pts = (variants[root.getAttribute("data-neg-variant")] || variants.happy).map(function (p) {
			return { x: p.x, y: p.y, role: p.role, label: DEMO_DE ? p.de : p.en };
		});
		function draw(ctx, W, H) {
			var c = colors();
			var ox = W / 2, oy = H / 2 + 6;
			var scale = Math.min(W, H) * 0.36;
			ctx.clearRect(0, 0, W, H);
			var bg = ctx.createLinearGradient(0, 0, W, H);
			bg.addColorStop(0, c.paper);
			bg.addColorStop(0.55, c.paper2);
			bg.addColorStop(1, c.paper);
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, W, H);
			var glow = ctx.createRadialGradient(W * 0.2, H * 0.16, 0, W * 0.2, H * 0.16, W * 0.6);
			glow.addColorStop(0, c.dark ? "rgba(0,146,153,.18)" : "rgba(99,164,75,.10)");
			glow.addColorStop(1, "rgba(0,0,0,0)");
			ctx.fillStyle = glow;
			ctx.fillRect(0, 0, W, H);
			ctx.fillStyle = c.dark ? "rgba(238,247,244,.055)" : "rgba(0,75,111,.045)";
			for (var dx = 14; dx < W; dx += 28) {
				for (var dy = 14; dy < H; dy += 28) ctx.fillRect(dx, dy, 1, 1);
			}
			ctx.save();
			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			ctx.setLineDash([2, 7]);
			for (var gx = -4; gx <= 4; gx++) {
				ctx.beginPath();
				ctx.moveTo(ox + gx * scale / 4, oy - scale);
				ctx.lineTo(ox + gx * scale / 4, oy + scale);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(ox - scale, oy + gx * scale / 4);
				ctx.lineTo(ox + scale, oy + gx * scale / 4);
				ctx.stroke();
			}
			ctx.setLineDash([]);
			ctx.strokeStyle = c.lineStrong;
			ctx.beginPath();
			ctx.moveTo(ox - scale * 1.1, oy);
			ctx.lineTo(ox + scale * 1.1, oy);
			ctx.moveTo(ox, oy - scale * 1.1);
			ctx.lineTo(ox, oy + scale * 1.1);
			ctx.stroke();
			ctx.restore();
			var colorsByRole = { happy: c.green, not: c.sky, sad: c.coral, unhappy: c.gold, joyful: c.lime };
			pts.forEach(function (p) {
				var x = ox + p.x * scale, y = oy - p.y * scale;
				ctx.strokeStyle = colorsByRole[p.role];
				ctx.globalAlpha = 0.28;
				ctx.lineWidth = 1.2;
				ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x, y); ctx.stroke();
				ctx.globalAlpha = 1;
				ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2);
				ctx.fillStyle = colorsByRole[p.role];
				ctx.globalAlpha = 0.12;
				ctx.fill();
				ctx.globalAlpha = 1;
				ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2);
				ctx.fillStyle = colorsByRole[p.role];
				ctx.fill();
				ctx.lineWidth = 1.6; ctx.strokeStyle = c.paper; ctx.stroke();
				ctx.font = "600 11px Barlow, system-ui, sans-serif";
				var tw = ctx.measureText(p.label).width;
				var left = p.x >= 0;
				var lx = x + (left ? 10 : -10);
				var bx = left ? lx - 3 : lx - tw - 3;
				ctx.fillStyle = c.dark ? "rgba(7,26,34,.78)" : "rgba(255,255,255,.82)";
				ctx.fillRect(bx, y - 18, tw + 6, 16);
				ctx.fillStyle = c.inkSoft;
				ctx.textAlign = left ? "left" : "right";
				ctx.fillText(p.label, lx, y - 6);
			});
			var not = null;
			pts.forEach(function (p) { if (p.role === "not") not = p; });
			if (not) {
				pts.forEach(function (p) {
					if (p.role !== "happy" && p.role !== "sad") return;
					ctx.save();
					ctx.setLineDash([4, 4]);
					ctx.strokeStyle = colorsByRole[p.role];
					ctx.lineWidth = 1.4;
					ctx.beginPath();
					ctx.moveTo(ox + not.x * scale, oy - not.y * scale);
					ctx.lineTo(ox + p.x * scale, oy - p.y * scale);
					ctx.stroke();
					ctx.restore();
				});
			}
			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(DEMO_DE ? "kurze Distanz: Negation bleibt in der Nähe" : "short distance: negation stays nearby", 14, H - 16);
			ctx.textAlign = "right";
			ctx.fillText(DEMO_DE ? "lange Distanz: das Gegenteil" : "long distance: the opposite concept", W - 14, H - 16);
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		api.redraw();
	}

	/* ── number tokenization ────────────────────────────────── */

	function initNumTokens(root) {
		var wrapA = $("[data-numtokens-a]", root);
		var wrapB = $("[data-numtokens-b]", root);
		if (!wrapA || !wrapB) return;
		var labelA = $("[data-numtokens-label-a]", root);
		var labelB = $("[data-numtokens-label-b]", root);
		var noteEl = $("[data-numtokens-note]", root);
		var diffEl = $("[data-numtokens-diff]", root);
		var sharedEl = $("[data-numtokens-shared]", root);
		var countEl = $("[data-numtokens-count]", root);
		var chips = $$("[data-numtokens-pair]", root);
		var COLORS = ["#63a44b", "#5c9baf", "#9f9700", "#9185be", "#869b55", "#1275ac", "#009299", "#92a19a"];
		var presets = [
			{
				a: "12345", b: "12346", diff: 1,
				aTok: [["123", 10163], ["45", 2231]],
				bTok: [["12", 1065], ["346", 30557]],
				en: "The boundary moves: 123 | 45 against 12 | 346. The digits do not line up.",
				de: "Die Grenze verschiebt sich: 123 | 45 gegen 12 | 346. Die Ziffern stehen nicht übereinander."
			},
			{
				a: "9998", b: "9999", diff: 1,
				aTok: [["99", 2079], ["98", 4089]],
				bTok: [["9999", 24214]],
				en: "99 | 98 against 9999: one is split into two tokens, the other is a single token.",
				de: "99 | 98 gegen 9999: Die eine Zahl wird in zwei Tokens zerlegt, die andere ist ein einziges Token."
			},
			{
				a: "1234.56", b: "1234.57", diff: 0.01,
				aTok: [["12", 1065], ["34", 2682], [".", 13], ["56", 3980]],
				bTok: [["12", 1065], ["34", 2682], [".", 13], ["57", 3553]],
				en: "The boundary stays at 12 | 34 | . | 56; only the last token changes, to 57 (ID 3553).",
				de: "Die Grenze bleibt bei 12 | 34 | . | 56; nur das letzte Token wechselt zu 57 (ID 3553)."
			},
			{
				a: "9999.99", b: "10000.00", diff: 0.01,
				aTok: [["9999", 24214], [".", 13], ["99", 2079]],
				bTok: [["10000", 49388], [".", 13], ["00", 486]],
				en: "9999 | . | 99 against 10000 | . | 00: the carry is not a token.",
				de: "9999 | . | 99 gegen 10000 | . | 00: Der Übertrag ist kein eigenes Token."
			}
		];
		function fmtDiff(v) {
			var s = String(v);
			return DEMO_DE ? s.replace(".", ",") : s;
		}
		function chipsHtml(tokens, other) {
			var changed = -1;
			if (other && other.length === tokens.length) {
				var diff = [];
				tokens.forEach(function (tok, i) { if (tok[0] !== other[i][0]) diff.push(i); });
				if (diff.length === 1) changed = diff[0];
			}
			return tokens.map(function (tok, i) {
				return '<span class="token token--static' + (i === changed ? " is-changed" : "") + '" style="--tok:' +
					COLORS[Math.abs(tok[1]) % COLORS.length] + '">' +
					escapeHtml(tok[0]) + "<small>" + tok[1] + "</small></span>";
			}).join("");
		}
		function select(index) {
			var p = presets[index];
			if (!p) return;
			wrapA.innerHTML = chipsHtml(p.aTok, p.bTok);
			wrapB.innerHTML = chipsHtml(p.bTok, p.aTok);
			if (labelA) labelA.textContent = p.a;
			if (labelB) labelB.textContent = p.b;
			if (diffEl) diffEl.textContent = fmtDiff(p.diff);
			if (noteEl) noteEl.textContent = DEMO_DE ? p.de : p.en;
			if (countEl) countEl.textContent = p.aTok.length + " / " + p.bTok.length;
			if (sharedEl) {
				var n = Math.max(p.aTok.length, p.bTok.length);
				var shared = 0;
				for (var i = 0; i < n; i++) {
					if (p.aTok[i] && p.bTok[i] && p.aTok[i][0] === p.bTok[i][0]) shared++;
				}
				sharedEl.textContent = shared + " / " + n;
			}
			chips.forEach(function (chip, i) {
				chip.classList.toggle("is-on", i === index);
				chip.setAttribute("aria-pressed", i === index ? "true" : "false");
			});
		}
		chips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				select(parseInt(chip.getAttribute("data-numtokens-pair"), 10));
			});
		});
		select(0);
	}

	/* ── receptive field ────────────────────────────────────── */

	function initReceptive(root) {
		var inputEl = $("[data-rf-input]", root);
		var outputEl = $("[data-rf-output]", root);
		var depth = $("[data-rf-depth]", root);
		var depthOut = $("[data-rf-depth-out]", root);
		var kernel = $("[data-rf-kernel]", root);
		var kernelOut = $("[data-rf-kernel-out]", root);
		var sizeEl = $("[data-rf-size]", root);
		var layerEl = $("[data-rf-layers]", root);
		var paramEl = $("[data-rf-params]", root);
		var noteEl = $("[data-rf-note]", root);
		if (!inputEl || !outputEl) return;
		var N = 7;
		var pattern = [];
		for (var y = 0; y < N; y++) {
			for (var x = 0; x < N; x++) {
				var dx = x - 3, dy = y - 3;
				pattern.push(dx * dx + dy * dy < 4 ? 1 : (x === 1 || y === 5 ? 0.55 : 0));
			}
		}
		var selected = 24;
		function val(el, fallback) { return parseInt(el && el.value, 10) || fallback; }
		function render() {
			var d = clamp(val(depth, 1), 1, 4);
			var k = clamp(val(kernel, 3), 3, 5);
			if (depthOut) depthOut.textContent = d;
			if (kernelOut) kernelOut.textContent = k + "×" + k;
			var r = Math.floor(d * (k - 1) / 2);
			var sx = selected % N, sy = Math.floor(selected / N);
			inputEl.innerHTML = pattern.map(function (v, i) {
				var x = i % N, y = Math.floor(i / N);
				var inField = Math.abs(x - sx) <= r && Math.abs(y - sy) <= r;
				return '<span class="rf-cell' + (v ? " is-input" : "") + (inField ? " is-field" : "") + '" data-rf-cell="' + i + '" style="opacity:' + (v ? 1 : 0.35) + '"></span>';
			}).join("");
			var out = [];
			for (var oy = 0; oy < N; oy++) {
				for (var ox = 0; ox < N; ox++) {
					var sum = 0, n = 0;
					for (var ky = -Math.floor(k / 2); ky <= Math.floor(k / 2); ky++) {
						for (var kx = -Math.floor(k / 2); kx <= Math.floor(k / 2); kx++) {
							var xx = ox + kx, yy = oy + ky;
							if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
							sum += pattern[yy * N + xx];
							n++;
						}
					}
					out.push(n ? sum / n : 0);
				}
			}
			outputEl.innerHTML = out.map(function (v, i) {
				return '<span class="rf-cell' + (i === selected ? " is-field" : "") + '" style="opacity:' + (0.18 + v * 0.82) + '"></span>';
			}).join("");
			var size = 2 * r + 1;
			if (sizeEl) sizeEl.textContent = size + "×" + size;
			if (layerEl) layerEl.textContent = d;
			if (paramEl) paramEl.textContent = (k * k * d).toLocaleString();
			if (noteEl) noteEl.innerHTML = "Each layer widens the window by <b>" + (k - 1) + "</b> cells. After " + d + " layer" + (d > 1 ? "s" : "") + ", one unit sees <b>" + size + "×" + size + "</b> input cells. Shared weights keep the parameter count tiny.";
			$$("[data-rf-cell]", inputEl).forEach(function (cell) {
				cell.addEventListener("click", function () {
					selected = parseInt(cell.getAttribute("data-rf-cell"), 10) || 0;
					render();
				});
			});
		}
		[depth, kernel].forEach(function (el) { if (el) el.addEventListener("input", render); });
		render();
	}

	/* ── citation spotter ───────────────────────────────────── */

	function initCitecheck(root) {
		var list = $("[data-citecheck-list]", root);
		var scoreEl = $("[data-citecheck-score]", root);
		var verdictEl = $("[data-citecheck-verdict]", root);
		var resetBtn = $("[data-citecheck-reset]", root);
		if (!list) return;
		var pool = [
			{ title: "Attention Is All You Need", meta: "Vaswani et al. · NeurIPS 2017", real: true, why: "Real. The transformer paper.", whyDe: "Echt. Die Transformer-Arbeit." },
			{ title: "Deep Residual Learning for Image Recognition", meta: "He et al. · CVPR 2016", real: true, why: "Real. The ResNet paper.", whyDe: "Echt. Die ResNet-Arbeit." },
			{ title: "Language Models are Few-Shot Learners", meta: "Brown et al. · NeurIPS 2020", real: true, why: "Real. The GPT-3 paper.", whyDe: "Echt. Die GPT-3-Arbeit." },
			{ title: "Recursive Semantic Anchoring in Transformer Pretraining", meta: "Keller & Voss · ICML 2021", real: false, why: "Fabricated. Plausible title, plausible venue, no such paper.", whyDe: "Fabriziert. Plausibler Titel, plausible Konferenz, keine solche Arbeit." },
			{ title: "The 2019 Zurich Study on Latent Memory Consolidation", meta: "M. Roth · Nature Neuroscience 2019", real: false, why: "Fabricated. A generic study-shaped sentence, not a citation.", whyDe: "Fabriziert. Ein generisch klingender Studientitel, keine echte Zitation." },
			{ title: "Denoising Diffusion Probabilistic Models", meta: "Ho et al. · NeurIPS 2020", real: true, why: "Real. The DDPM paper.", whyDe: "Echt. Die DDPM-Arbeit." },
			{ title: "ImageNet Classification with Deep Convolutional Neural Networks", meta: "Krizhevsky et al. · NeurIPS 2012", real: true, why: "Real. The AlexNet paper.", whyDe: "Echt. Die AlexNet-Arbeit." },
			{ title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding", meta: "Devlin et al. · NAACL 2019", real: true, why: "Real. The BERT paper.", whyDe: "Echt. Die BERT-Arbeit." },
			{ title: "Generative Adversarial Networks", meta: "Goodfellow et al. · NeurIPS 2014", real: true, why: "Real. The GAN paper.", whyDe: "Echt. Die GAN-Arbeit." },
			{ title: "Adaptive Gradient Manifold Pruning for Low-Resource Translation", meta: "P. Almeida & R. Chen · ACL 2022", real: false, why: "Fabricated. Plausible title, plausible venue, no such paper.", whyDe: "Fabriziert. Plausibler Titel, plausible Konferenz, keine solche Arbeit." },
			{ title: "Temporal Context Compression in Sparse Mixture-of-Experts", meta: "N. Iwasaki et al. · ICLR 2021", real: false, why: "Fabricated. A convincing combination of real buzzwords, not a real paper.", whyDe: "Fabriziert. Eine überzeugende Kombination echter Schlagwörter, keine echte Arbeit." },
			{ title: "A Unified Theory of Token-Level Semantic Drift", meta: "L. Moreau · NeurIPS 2020", real: false, why: "Fabricated. The title sounds like a paper, but the work does not exist.", whyDe: "Fabriziert. Der Titel klingt wie eine Arbeit, aber die Arbeit existiert nicht." }
		];
		var round = [], answered = 0, correct = 0, seed = 3, lastTitles = [];
		function rnd() { seed += 1; return (Math.sin(seed * 7.31) * 43758.5453) % 1; }
		function pickRound() {
			var copy = pool.slice();
			var fresh = copy.filter(function (x) { return lastTitles.indexOf(x.title) === -1; });
			var source = fresh.length >= 4 ? fresh : copy;
			for (var i = source.length - 1; i > 0; i--) {
				var j = Math.floor(Math.abs(rnd()) * (i + 1));
				var t = source[i]; source[i] = source[j]; source[j] = t;
			}
			var picked = source.slice(0, 4);
			lastTitles = picked.map(function (x) { return x.title; });
			return picked;
		}
		function render() {
			list.innerHTML = round.map(function (r, i) {
				return '<div class="cc-card" data-cc-i="' + i + '">' +
					'<h4>' + escapeHtml(r.title) + '</h4>' +
					'<p>' + escapeHtml(r.meta) + '</p>' +
					'<div class="cc-actions">' +
					'<button class="btn-demo" type="button" data-cc-guess="real">' + (DEMO_DE ? "Echt" : "Real") + '</button>' +
					'<button class="btn-demo" type="button" data-cc-guess="fake">' + (DEMO_DE ? "Fabriziert" : "Fabricated") + '</button>' +
					'</div><div class="cc-verdict" data-cc-feedback></div></div>';
			}).join("");
			answered = 0; correct = 0;
			if (scoreEl) scoreEl.textContent = "0 / " + round.length;
			if (verdictEl) verdictEl.textContent = "";
			$$(".cc-card", list).forEach(function (card, i) {
				$$("[data-cc-guess]", card).forEach(function (btn) {
					btn.addEventListener("click", function () {
						if (card.classList.contains("is-answered")) return;
						card.classList.add("is-answered");
						var guess = btn.getAttribute("data-cc-guess") === "real";
						var ok = guess === round[i].real;
						if (ok) correct++;
						answered++;
						card.classList.add(round[i].real ? "is-real" : "is-fake");
						var fb = $("[data-cc-feedback]", card);
						if (fb) fb.innerHTML = "<b>" + (ok ? (DEMO_DE ? "Richtig." : "Correct.") : (DEMO_DE ? "Daneben." : "Missed.")) + "</b> " + escapeHtml(DEMO_DE ? round[i].whyDe : round[i].why);
						$$("[data-cc-guess]", card).forEach(function (b) { b.disabled = true; });
						if (scoreEl) scoreEl.textContent = correct + " / " + round.length;
						if (verdictEl && answered === round.length) {
							verdictEl.innerHTML = correct === round.length
								? (DEMO_DE
									? "<b>Alles richtig.</b> Plausibilität ist kein Nachweis. Die Fähigkeit ist Prüfen, nicht Raten."
									: "<b>Clean sweep.</b> Plausibility is not provenance. The skill is checking, not guessing.")
								: (DEMO_DE
									? "<b>" + correct + " von " + round.length + ".</b> Fabrizierte Literatur sieht echten Quellen zum Verwechseln ähnlich. Prüfe DOI, Verlag und Autor, bevor du zitierst."
									: "<b>" + correct + " of " + round.length + ".</b> Fabricated references are built to look exactly like real ones. Verify the DOI, the venue, and the author before you cite.");
						}
					});
				});
			});
		}
		if (resetBtn) resetBtn.addEventListener("click", function () { round = pickRound(); render(); });
		round = pickRound();
		render();
	}

	/* ── reasoning: answer vs steps ─────────────────────────── */

	function initReasoning(root) {
		var chips = $("[data-reasoning-problems]", root);
		var questionEl = $("[data-reasoning-question]", root);
		var modeBtns = $$("[data-reasoning-mode]", root);
		var stepsEl = $("[data-reasoning-steps]", root);
		var answerEl = $("[data-reasoning-answer]", root);
		var tokensEl = $("[data-reasoning-tokens]", root);
		var confidenceEl = $("[data-reasoning-confidence]", root);
		var votesEl = $("[data-reasoning-votes]", root);
		var sampleBtn = $("[data-reasoning-sample]", root);
		var resetBtn = $("[data-reasoning-reset]", root);
		if (!questionEl || !stepsEl) return;
		var problems = DEMO_DE ? [
			{
				label: "Schläger & Ball",
				q: "Ein Schläger und ein Ball kosten zusammen 1,10 $. Der Schläger kostet 1,00 $ mehr als der Ball. Wie viel kostet der Ball?",
				quick: "0,10 $",
				correct: "0,05 $",
				quickWhy: "Die naheliegende Antwort. Sie behält die 1,00-$-Differenz, vergisst aber, dass der Schläger dann 1,10 $ kostet.",
				steps: [
					"Der Ball kostet x. Dann kostet der Schläger x + 1,00 $.",
					"x + (x + 1,00 $) = 1,10 $.",
					"2x = 0,10 $, also x = 0,05 $.",
					"Der Ball kostet 0,05 $; der Schläger 1,05 $."
				],
				tokens: [9, 84]
			},
			{
				label: "Seerosen",
				q: "Ein Seerosenfeld verdoppelt seine Fläche jeden Tag. Am 48. Tag bedeckt es den ganzen See. An welchem Tag bedeckt es die Hälfte?",
				quick: "24",
				correct: "47",
				quickWhy: "Die Hälfte von 48 wirkt naheliegend, aber wegen der Verdopplung war das Feld genau einen Tag vorher halb so groß.",
				steps: [
					"Rückwärts denken. Ist der See am 48. Tag voll, war das Feld am 47. Tag halb so groß.",
					"Am 47. Tag bedeckte es die Hälfte des Sees.",
					"Eine weitere Verdopplung füllt ihn am 48. Tag."
				],
				tokens: [7, 58]
			},
			{
				label: "Maschinen",
				q: "Fünf Maschinen produzieren in fünf Minuten fünf Widgets. Wie lange brauchen 100 Maschinen für 100 Widgets?",
				quick: "100 Minuten",
				correct: "5 Minuten",
				quickWhy: "Maschinen und Widgets im gleichen Verhältnis zu skalieren ändert die Rate nicht.",
				steps: [
					"Fünf Maschinen produzieren in fünf Minuten fünf Widgets, also produziert eine Maschine ein Widget in fünf Minuten.",
					"100 Maschinen produzieren jeweils ein Widget in denselben fünf Minuten.",
					"Sie sind gleichzeitig fertig: fünf Minuten."
				],
				tokens: [10, 63]
			}
		] : [
			{
				label: "Bat & ball",
				q: "A bat and a ball cost $1.10. The bat costs $1.00 more than the ball. How much does the ball cost?",
				quick: "$0.10",
				correct: "$0.05",
				quickWhy: "The tempting answer. It keeps the $1.00 difference but forgets that the bat then costs $1.10.",
				steps: [
					"Let the ball cost x. Then the bat costs x + $1.00.",
					"x + (x + $1.00) = $1.10.",
					"2x = $0.10, so x = $0.05.",
					"The ball is $0.05; the bat is $1.05."
				],
				tokens: [9, 84]
			},
			{
				label: "Lily pad",
				q: "A lily-pad patch doubles in size every day. It covers the whole lake on day 48. On which day does it cover half the lake?",
				quick: "24",
				correct: "47",
				quickWhy: "Half of 48 feels natural, but doubling means the patch was half the lake exactly one day earlier.",
				steps: [
					"Work backwards. If the lake is full on day 48, the patch was half as large on day 47.",
					"On day 47 it covered half the lake.",
					"One more doubling fills it on day 48."
				],
				tokens: [7, 58]
			},
			{
				label: "Machines",
				q: "Five machines make five widgets in five minutes. How long do 100 machines take to make 100 widgets?",
				quick: "100 minutes",
				correct: "5 minutes",
				quickWhy: "Scaling the machines and the widgets together leaves the rate unchanged.",
				steps: [
					"Five machines make five widgets in five minutes, so one machine makes one widget in five minutes.",
					"100 machines each make one widget in the same five minutes.",
					"They finish together: five minutes."
				],
				tokens: [10, 63]
			}
		];
		var current = 0, mode = "steps", sampled = [];
		chips.innerHTML = problems.map(function (p, i) {
			return '<button class="chip' + (i === 0 ? " is-on" : "") + '" type="button" data-reasoning-i="' + i + '">' + escapeHtml(p.label) + "</button>";
		}).join("");
		function stepsHtml(p, m) {
			if (m === "steps") {
				return p.steps.map(function (s, i) {
					return '<div class="cot-step is-on" style="transition-delay:' + (i * 55) + 'ms">' + escapeHtml(s) + "</div>";
				}).join("");
			}
			return '<div class="cot-step is-on">' + (DEMO_DE ? "Die Antwort wirkt offensichtlich: " : "The answer feels obvious: ") + escapeHtml(p.quick) + ".</div>";
		}
		function answerHtml(p, m) {
			if (m === "steps") {
				return (DEMO_DE ? "Antwort: <b>" : "Answer: <b>") + p.correct + "</b>";
			}
			return (DEMO_DE ? "Antwort: <b>" : "Answer: <b>") + p.quick + "</b> <span style=\"color:var(--tm-coral)\">" + (DEMO_DE ? "· wahrscheinlich falsch" : "· likely wrong") + "</span>";
		}
		function votesHtml(p, correctCount) {
			var votes = [];
			for (var i = 0; i < 5; i++) votes.push(i < correctCount ? p.correct : p.quick);
			return (DEMO_DE ? "Fünf gezogene Pfade → " : "Five sampled paths → ") + votes.map(function (v, i) {
				return '<span style="display:inline-block;margin-right:5px;padding:2px 7px;border:1px solid var(--tm-line);border-radius:999px;font-family:var(--tm-mono);font-size:.62rem;color:' + (v === p.correct ? "var(--tm-green-deep)" : "var(--tm-coral)") + ';animation:pop .3s ease both;animation-delay:' + (i * 80) + 'ms">' + escapeHtml(v) + "</span>";
			}).join("") + (DEMO_DE ? "<br><b>" + correctCount + " / 5</b> " + (correctCount === 1 ? "stimmt" : "stimmen") + " für " + escapeHtml(p.correct) + ". Mehrheitsentscheidung hilft nur, wenn die Fehler nicht alle gleich sind." : "<br><b>" + correctCount + " / 5</b> agree on " + escapeHtml(p.correct) + ". Majority voting helps only when the errors are not all the same.");
		}
		function render() {
			var p = problems[current];
			if (questionEl) questionEl.textContent = p.q;
			modeBtns.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-reasoning-mode") === mode); });
			stepsEl.innerHTML = stepsHtml(p, mode);
			if (answerEl) answerEl.innerHTML = answerHtml(p, mode);
			if (tokensEl) tokensEl.textContent = p.tokens[mode === "steps" ? 1 : 0] + (DEMO_DE ? " Tokens" : " tokens");
			if (confidenceEl) confidenceEl.textContent = mode === "steps" ? (DEMO_DE ? "geprüft" : "checked") : (DEMO_DE ? "schnell, ungeprüft" : "fast, unchecked");
			if (answerEl) answerEl.title = mode === "steps" ? "" : p.quickWhy;
			if (votesEl && sampled.length) renderVotes();
			else if (votesEl) votesEl.innerHTML = DEMO_DE ? "Sampling ist aus, bis du <b>5 Pfade ziehen</b> drückst." : "Sampling is disabled until you press <b>Sample 5 paths</b>.";
		}
		function renderVotes() {
			if (!votesEl) return;
			var p = problems[current];
			votesEl.innerHTML = votesHtml(p, mode === "steps" ? 4 : 1);
		}
		function maxHeight(el, htmls) {
			if (!el) return;
			var old = el.innerHTML;
			el.style.visibility = "hidden";
			el.style.minHeight = "0";
			var max = 0;
			htmls.forEach(function (html) {
				el.innerHTML = html;
				max = Math.max(max, el.offsetHeight);
			});
			el.innerHTML = old;
			el.style.visibility = "";
			el.style.minHeight = max + "px";
		}
		function maxHeightProbe(el, htmls) {
			if (!el) return;
			var probe = document.createElement("div");
			probe.className = el.className;
			probe.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;width:" + el.getBoundingClientRect().width + "px;";
			document.body.appendChild(probe);
			var max = 0;
			htmls.forEach(function (html) {
				probe.innerHTML = html;
				max = Math.max(max, probe.offsetHeight);
			});
			document.body.removeChild(probe);
			el.style.minHeight = max + "px";
		}
		function measureHeights() {
			var stepSamples = [];
			var answerSamples = [];
			var questionSamples = [];
			var voteSamples = [
				DEMO_DE ? "Sampling ist aus, bis du <b>5 Pfade ziehen</b> drückst." : "Sampling is disabled until you press <b>Sample 5 paths</b>."
			];
			problems.forEach(function (p) {
				questionSamples.push('<strong>Problem:</strong> ' + escapeHtml(p.q));
				stepSamples.push(stepsHtml(p, "steps"), stepsHtml(p, "answer"));
				answerSamples.push(answerHtml(p, "steps"), answerHtml(p, "answer"));
				voteSamples.push(votesHtml(p, 4), votesHtml(p, 1));
			});
			if (questionEl && questionEl.parentNode) maxHeightProbe(questionEl.parentNode, questionSamples);
			maxHeight(stepsEl, stepSamples);
			maxHeight(answerEl, answerSamples);
			maxHeight(votesEl, voteSamples);
		}
		modeBtns.forEach(function (b) {
			b.addEventListener("click", function () {
				mode = b.getAttribute("data-reasoning-mode");
				sampled = [];
				render();
			});
		});
		$$("[data-reasoning-i]", chips).forEach(function (chip) {
			chip.addEventListener("click", function () {
				$$("[data-reasoning-i]", chips).forEach(function (x) { x.classList.remove("is-on"); });
				chip.classList.add("is-on");
				current = parseInt(chip.getAttribute("data-reasoning-i"), 10) || 0;
				sampled = [];
				render();
			});
		});
		if (sampleBtn) sampleBtn.addEventListener("click", function () { sampled = [1, 2, 3, 4, 5]; renderVotes(); });
		if (resetBtn) resetBtn.addEventListener("click", function () { sampled = []; render(); });
		render();
		measureHeights();
		var resizeTimer = null;
		window.addEventListener("resize", function () {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(measureHeights, 120);
		});
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureHeights);
	}
	/* ── mixture-of-experts routing galaxy ──────────────────── */

	function initMoeGalaxy(root) {
		var canvas = $("[data-moe-canvas]", root);
		if (!canvas) return;
		var expertsInput = $("[data-moe-experts]", root);
		var expertsOut = $("[data-moe-experts-out]", root);
		var topkInput = $("[data-moe-topk]", root);
		var topkOut = $("[data-moe-topk-out]", root);
		var nextBtn = $("[data-moe-next]", root);
		var autoBtn = $("[data-moe-auto]", root);
		var resetBtn = $("[data-moe-reset]", root);
		var activeEl = $("[data-moe-active]", root);
		var routedEl = $("[data-moe-routed]", root);
		var lastEl = $("[data-moe-last]", root);
		var noteEl = $("[data-moe-note]", root);
		var count = 8;
		var state = { experts: 4, topk: 2, queue: [], routed: 0, loads: [], current: 0, phase: 0, t: 0, target: 0, auto: true, last: "—" };
		var timer = null;
		onTeardown(root, function () { if (timer) { clearInterval(timer); timer = null; } });
		var api;
		var visible = true;

		if ("IntersectionObserver" in window) {
			new IntersectionObserver(function (entries) {
				visible = entries[0].isIntersecting;
			}, { threshold: 0.05 }).observe(root);
		}

		function num(v, d) { return DEMO_DE ? v.toFixed(d).replace(".", ",") : v.toFixed(d); }

		function reset() {
			state.experts = Math.max(3, Math.min(6, parseInt(expertsInput.value, 10) || 4));
			state.topk = Math.max(1, Math.min(state.experts, parseInt(topkInput.value, 10) || 2));
			if (expertsOut) expertsOut.textContent = state.experts;
			if (topkOut) topkOut.textContent = state.topk;
			state.queue = [];
			for (var i = 0; i < count; i++) state.queue.push({ id: i, routed: false });
			state.loads = new Array(state.experts).fill(0);
			state.routed = 0;
			state.current = 0;
			state.phase = 0;
			state.t = 0;
			state.last = "—";
			update();
		}

		function chooseExpert(token) {
			var scores = [];
			for (var i = 0; i < state.experts; i++) {
				var s = 0.5 + 0.5 * Math.sin((token.id + 1) * 1.7 + (i + 1) * 2.1);
				if (state.loads[i] === Math.min.apply(null, state.loads)) s += 0.20;
				scores.push([s, i]);
			}
			scores.sort(function (a, b) { return b[0] - a[0]; });
			return scores[0][1];
		}

		function beginToken() {
			if (state.current >= state.queue.length) {
				state.last = "—";
				if (state.auto) {
					state.current = 0;
					state.phase = 0;
					state.t = 0;
					state.queue.forEach(function (q) { q.routed = false; });
					state.loads = new Array(state.experts).fill(0);
					state.routed = 0;
				}
				update();
				return;
			}
			var token = state.queue[state.current];
			if (token.routed) { state.current++; beginToken(); return; }
			state.phase = 1;
			state.t = 0;
			state.target = chooseExpert(token);
			update();
		}

		function advance() {
			if (!visible) return;
			if (state.phase === 0) { beginToken(); return; }
			state.t += 0.035;
			if (state.t < 1) { if (api) api.redraw(); return; }
			if (state.phase === 1) {
				state.phase = 2;
				state.t = 0;
				state.loads[state.target]++;
				state.routed++;
				state.last = "t" + (state.current + 1) + " → E" + (state.target + 1);
				state.queue[state.current].routed = true;
				update();
				return;
			}
			state.current++;
			state.phase = 0;
			state.t = 0;
			update();
		}

		function start() {
			if (timer) clearInterval(timer);
			timer = setInterval(advance, 36);
		}

		function update() {
			if (activeEl) activeEl.textContent = state.topk + " / " + state.experts;
			if (routedEl) routedEl.textContent = state.routed + " / " + state.queue.length;
			if (lastEl) lastEl.textContent = state.last;
			if (noteEl) {
				noteEl.textContent = DEMO_DE
					? "Die Tokens warten links auf einer Linie. Jedes geht einzeln durch den Router; der Router wählt einen Experten, und nur dieser läuft. Das ist sparsames Rechnen, nicht Attention."
					: "The tokens wait on a line at the left. Each one goes through the router separately; the router picks an expert and only that expert runs. This is sparse computation, not attention.";
			}
			if (api) api.redraw();
		}

		function draw(ctx, w, h) {
			var c = TM.colors();
			var n = state.experts;
			var queueX = 46;
			var top = 42, bottom = h - 42;
			var gap = (bottom - top) / Math.max(1, count - 1);
			var expertX = w - 74;
			var expertYs = [];
			for (var e = 0; e < n; e++) expertYs.push(top + (bottom - top) * (e + 0.5) / n);
			var routerX = w * 0.48, routerY = h * 0.5;

			ctx.clearRect(0, 0, w, h);
			var bg = ctx.createLinearGradient(0, 0, 0, h);
			bg.addColorStop(0, c.paper2);
			bg.addColorStop(1, c.paper);
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, w, h);

			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			ctx.setLineDash([4, 5]);
			ctx.beginPath(); ctx.moveTo(queueX, top - 8); ctx.lineTo(queueX, bottom + 8); ctx.stroke();
			ctx.setLineDash([]);

			state.queue.forEach(function (token, i) {
				var y = top + i * gap;
				var done = token.routed;
				var current = i === state.current && !done;
				ctx.fillStyle = current ? c.gold : (done ? c.green : c.sky);
				ctx.globalAlpha = current ? 1 : (done ? 0.55 : 0.75);
				ctx.beginPath();
				if (ctx.roundRect) { ctx.roundRect(queueX - 13, y - 9, 26, 18, 5); ctx.fill(); }
				else ctx.fillRect(queueX - 13, y - 9, 26, 18);
				ctx.globalAlpha = 1;
				ctx.fillStyle = c.ink;
				ctx.font = "700 9px Barlow, system-ui, sans-serif";
				ctx.textAlign = "center";
				ctx.fillText("t" + (i + 1), queueX, y + 3);
			});

			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(DEMO_DE ? "Tokens" : "tokens", 14, top - 22);

			ctx.fillStyle = c.paper;
			ctx.strokeStyle = c.petrol;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			if (ctx.roundRect) { ctx.roundRect(routerX - 32, routerY - 17, 64, 34, 8); ctx.fill(); ctx.stroke(); }
			else { ctx.fillRect(routerX - 32, routerY - 17, 64, 34); ctx.strokeRect(routerX - 32, routerY - 17, 64, 34); }
			ctx.fillStyle = c.petrol;
			ctx.font = "700 10px Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(DEMO_DE ? "Router" : "router", routerX, routerY + 3);

			expertYs.forEach(function (y, i) {
				var load = state.loads[i] || 0;
				var lit = load > 0;
				ctx.strokeStyle = lit ? c.green : c.lineStrong;
				ctx.fillStyle = lit ? "rgba(99,164,75,.10)" : c.paper;
				ctx.lineWidth = lit ? 1.6 : 1;
				ctx.beginPath(); ctx.arc(expertX, y, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
				ctx.strokeStyle = c.line;
				ctx.setLineDash([3, 4]);
				ctx.beginPath(); ctx.arc(expertX, y, 31, 0, Math.PI * 2); ctx.stroke();
				ctx.setLineDash([]);
				ctx.fillStyle = lit ? c.green : c.muted;
				ctx.font = "700 10px Barlow, system-ui, sans-serif";
				ctx.textAlign = "center";
				ctx.fillText("E" + (i + 1), expertX, y + 3);
			});
			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.fillText(DEMO_DE ? "Experten" : "experts", w - 14, top - 22);

			if (state.phase > 0) {
				var token = state.queue[state.current];
				var sy = top + state.current * gap;
				var tx, ty;
				if (state.phase === 1) {
					tx = routerX - 32;
					ty = routerY;
				} else {
					tx = expertX - 31;
					ty = expertYs[state.target];
				}
				var x = state.phase === 1 ? queueX + (tx - queueX) * state.t : routerX + (tx - routerX) * state.t;
				var y = state.phase === 1 ? sy + (ty - sy) * state.t : routerY + (ty - routerY) * state.t;
				ctx.strokeStyle = state.phase === 1 ? c.gold : c.green;
				ctx.lineWidth = 1.5;
				ctx.beginPath(); ctx.moveTo(queueX + 14, sy); ctx.lineTo(routerX - 34, routerY); ctx.stroke();
				if (state.phase === 2) {
					ctx.beginPath(); ctx.moveTo(routerX + 34, routerY); ctx.lineTo(expertX - 34, expertYs[state.target]); ctx.stroke();
				}
				ctx.fillStyle = c.gold;
				ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
				ctx.fillStyle = c.ink;
				ctx.font = "700 9px Barlow, system-ui, sans-serif";
				ctx.textAlign = "left";
				ctx.fillText("t" + (token.id + 1), x + 8, y - 8);
			}

			ctx.textAlign = "left";
			ctx.fillStyle = c.muted;
			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.fillText((DEMO_DE ? "top-" : "top-") + state.topk + (DEMO_DE ? " von " : " of ") + state.experts + (DEMO_DE ? " Experten aktiv" : " experts active"), 14, h - 14);
		}

		api = TM.initCanvas(canvas, draw);
		if (expertsInput) expertsInput.addEventListener("input", reset);
		if (topkInput) topkInput.addEventListener("input", reset);
		if (nextBtn) nextBtn.addEventListener("click", function () {
			if (state.phase === 0) beginToken();
			if (state.phase === 1) { state.t = 1; advance(); }
			if (state.phase === 2) { state.t = 1; advance(); }
		});
		if (autoBtn) autoBtn.addEventListener("click", function () {
			state.auto = !state.auto;
			autoBtn.textContent = state.auto ? (DEMO_DE ? "Auto: an" : "Auto: on") : (DEMO_DE ? "Auto: aus" : "Auto: off");
			update();
		});
		if (resetBtn) resetBtn.addEventListener("click", reset);
		if (autoBtn) autoBtn.textContent = DEMO_DE ? "Auto: an" : "Auto: on";
		reset();
		start();
	}

	/* ── prediction = compression ───────────────────────────── */

	function initCompression(root) {
		var canvas = $("[data-compression-canvas]", root);
		if (!canvas) return;
		var qualityInput = $("[data-compression-quality]", root);
		var qualityOut = $("[data-compression-quality-out]", root);
		var runBtn = $("[data-compression-run]", root);
		var resetBtn = $("[data-compression-reset]", root);
		var uniformEl = $("[data-compression-uniform]", root);
		var modelEl = $("[data-compression-model]", root);
		var ratioEl = $("[data-compression-ratio]", root);
		var noteEl = $("[data-compression-note]", root);
		var sentence = DEMO_DE ? "der kater sass auf der matte und der hund schlief" : "the cat sat on the mat and the dog slept";
		var uniformBitsPerChar = Math.log2(26);
		var state = { index: 0, bits: 0, uniform: 0, running: false };
		var timer = null;
		onTeardown(root, function () { if (timer) { clearInterval(timer); timer = null; } });
		var api;

		function num(v, d) { return DEMO_DE ? v.toFixed(d).replace(".", ",") : v.toFixed(d); }

		function quality() {
			return Math.max(0.05, Math.min(0.99, parseFloat(qualityInput.value) || 0.82));
		}

		function pCorrect() {
			return Math.max(0.05, Math.min(0.97, 0.04 + 0.93 * quality()));
		}

		function reset() {
			state.index = 0;
			state.bits = 0;
			state.uniform = 0;
			if (timer) { clearInterval(timer); timer = null; }
			state.running = false;
			if (runBtn) runBtn.textContent = DEMO_DE ? "Start" : "Run";
			update();
		}

		function advance() {
			if (state.index >= sentence.length) {
				if (timer) { clearInterval(timer); timer = null; }
				state.running = false;
				if (runBtn) runBtn.textContent = DEMO_DE ? "Start" : "Run";
				update();
				return;
			}
			state.bits += -Math.log2(pCorrect());
			state.uniform += uniformBitsPerChar;
			state.index++;
			update();
		}

		function start() {
			if (timer) { clearInterval(timer); timer = null; }
			state.running = true;
			if (runBtn) runBtn.textContent = DEMO_DE ? "Pause" : "Pause";
			timer = setInterval(advance, 520);
		}

		function toggle() {
			if (state.running) {
				if (timer) { clearInterval(timer); timer = null; }
				state.running = false;
				if (runBtn) runBtn.textContent = DEMO_DE ? "Start" : "Run";
				update();
			} else {
				if (state.index >= sentence.length) reset();
				start();
			}
		}

		function update() {
			if (qualityOut) qualityOut.textContent = num(quality() * 100, 0) + " %";
			if (uniformEl) uniformEl.textContent = num(state.uniform, 1) + (DEMO_DE ? " Bit" : " bits");
			if (modelEl) modelEl.textContent = num(state.bits, 1) + (DEMO_DE ? " Bit" : " bits");
			if (ratioEl) ratioEl.textContent = state.bits > 0 ? num(state.uniform / state.bits, 2) + "×" : "—";
			if (noteEl) {
				if (state.index === 0) {
					noteEl.textContent = DEMO_DE
						? "Drücke Start. Jedes Zeichen kostet im gleichmäßigen Code log₂(26) ≈ 4,7 Bit; ein besseres Modell braucht weniger."
						: "Press Run. Each character costs log₂(26) ≈ 4.7 bits in a uniform code; a better model needs fewer.";
				} else if (state.index >= sentence.length) {
					noteEl.textContent = DEMO_DE
						? "Fertig: Das Modell hat dieselbe Zeichenfolge mit " + num(state.bits, 1) + " statt " + num(state.uniform, 1) + " Bit kodiert. Gute Vorhersage ist kurze Kodierung."
						: "Done: the model encoded the same string with " + num(state.bits, 1) + " bits instead of " + num(state.uniform, 1) + ". Good prediction is a short code.";
				} else {
					noteEl.textContent = DEMO_DE
						? "Das Modell sagt das nächste Zeichen mit " + num(pCorrect() * 100, 0) + " % Sicherheit voraus; daraus folgt der Preis pro Zeichen."
						: "The model predicts the next character with " + num(pCorrect() * 100, 0) + " % confidence; that sets the price per character.";
				}
			}
			if (api) api.redraw();
		}

		function draw(ctx, w, h) {
			var c = TM.colors();
			var p = pCorrect();
			var pOther = (1 - p) / 3;
			var typed = sentence.slice(0, state.index);
			var rest = sentence.slice(state.index);

			ctx.clearRect(0, 0, w, h);
			var bg = ctx.createLinearGradient(0, 0, 0, h);
			bg.addColorStop(0, c.paper2);
			bg.addColorStop(1, c.paper);
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, w, h);

			ctx.textBaseline = "middle";
			ctx.textAlign = "left";
			ctx.font = "700 18px Barlow, system-ui, sans-serif";
			ctx.fillStyle = c.ink;
			ctx.fillText(typed, 26, 44);
			var tw = ctx.measureText(typed).width;
			ctx.fillStyle = c.green;
			ctx.fillText("▌", 26 + tw + 2, 44);
			ctx.fillStyle = c.muted;
			ctx.font = "600 18px Barlow, system-ui, sans-serif";
			ctx.fillText(rest, 26 + tw + 16, 44);

			var bx = 26, by = 104, bw = Math.max(90, Math.min(w * 0.34, 250));
			ctx.fillStyle = c.muted;
			ctx.font = "600 11px Barlow, system-ui, sans-serif";
			ctx.fillText(DEMO_DE ? "nächste Zeichenverteilung" : "next-character distribution", bx, by - 18);
			var rows = [
				[DEMO_DE ? "richtig" : "actual", p, c.green],
				[DEMO_DE ? "Alternative 1" : "alternative 1", pOther, c.blue],
				[DEMO_DE ? "Alternative 2" : "alternative 2", pOther, c.sky],
				[DEMO_DE ? "Alternative 3" : "alternative 3", pOther, c.gold]
			];
			rows.forEach(function (row, i) {
				var y = by + i * 34;
				ctx.fillStyle = i === 0 ? c.green : c.muted;
				ctx.font = "600 10px Barlow, system-ui, sans-serif";
				ctx.fillText(row[0], bx, y + 5);
				ctx.fillStyle = "rgba(0,75,111,.10)";
				ctx.beginPath();
				if (ctx.roundRect) { ctx.roundRect(bx + 78, y, bw, 9, 4); ctx.fill(); }
				else ctx.fillRect(bx + 78, y, bw, 9);
				ctx.fillStyle = row[2];
				ctx.globalAlpha = i === 0 ? 0.9 : 0.55;
				ctx.beginPath();
				if (ctx.roundRect) { ctx.roundRect(bx + 78, y, Math.max(3, bw * row[1]), 9, 4); ctx.fill(); }
				else ctx.fillRect(bx + 78, y, Math.max(3, bw * row[1]), 9);
				ctx.globalAlpha = 1;
				ctx.fillStyle = row[2];
				ctx.font = "700 9px Barlow, system-ui, sans-serif";
				ctx.fillText(num(row[1] * 100, 0) + " %", bx + 84 + bw, y + 5);
			});

			var rx = w * 0.57, ry = 96, rw = Math.max(80, w - rx - 30);
			ctx.fillStyle = c.muted;
			ctx.font = "600 11px Barlow, system-ui, sans-serif";
			ctx.fillText(DEMO_DE ? "Bitstrom" : "bitstream", rx, ry - 18);
			var maxBits = Math.max(1, uniformBitsPerChar * sentence.length);
			ctx.fillStyle = "rgba(0,75,111,.10)";
			ctx.beginPath();
			if (ctx.roundRect) { ctx.roundRect(rx, ry, rw, 12, 6); ctx.fill(); }
			else ctx.fillRect(rx, ry, rw, 12);
			ctx.fillStyle = c.coral;
			ctx.globalAlpha = 0.6;
			ctx.beginPath();
			if (ctx.roundRect) { ctx.roundRect(rx, ry, rw * Math.min(1, state.uniform / maxBits), 12, 6); ctx.fill(); }
			else ctx.fillRect(rx, ry, rw * Math.min(1, state.uniform / maxBits), 12);
			ctx.globalAlpha = 1;
			ctx.fillStyle = c.green;
			ctx.beginPath();
			if (ctx.roundRect) { ctx.roundRect(rx, ry + 22, rw * Math.min(1, state.bits / maxBits), 12, 6); ctx.fill(); }
			else ctx.fillRect(rx, ry + 22, rw * Math.min(1, state.bits / maxBits), 12);
			ctx.fillStyle = c.coral;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.fillText((DEMO_DE ? "gleichmäßig " : "uniform ") + num(state.uniform, 0) + (DEMO_DE ? " Bit" : " bits"), rx, ry + 50);
			ctx.fillStyle = c.green;
			ctx.fillText((DEMO_DE ? "Modell " : "model ") + num(state.bits, 0) + (DEMO_DE ? " Bit" : " bits"), rx, ry + 64);
			ctx.fillStyle = c.ink;
			ctx.font = "700 22px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			ctx.fillText(state.bits > 0 ? num(state.uniform / state.bits, 2) + "×" : "—", rx + rw, ry + 88);
			ctx.fillStyle = c.muted;
			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.fillText(DEMO_DE ? "Kompressionsfaktor" : "compression ratio", rx + rw, ry + 104);
			ctx.textAlign = "left";
		}

		api = TM.initCanvas(canvas, draw);
		if (qualityInput) qualityInput.addEventListener("input", function () {
			state.index = 0;
			state.bits = 0;
			state.uniform = 0;
			update();
		});
		if (runBtn) runBtn.addEventListener("click", toggle);
		if (resetBtn) resetBtn.addEventListener("click", reset);
		update();
	}

	/* ── refusal direction ──────────────────────────────────── */

	function initRefusal(root) {
		var canvas = $("[data-refusal-canvas]", root);
		if (!canvas) return;
		var projInput = $("[data-refusal-proj]", root);
		var projOut = $("[data-refusal-proj-out]", root);
		var thrInput = $("[data-refusal-threshold]", root);
		var thrOut = $("[data-refusal-threshold-out]", root);
		var valueEl = $("[data-refusal-value]", root);
		var thrValueEl = $("[data-refusal-threshold-value]", root);
		var statusEl = $("[data-refusal-status]", root);
		var noteEl = $("[data-refusal-note]", root);
		var api;

		function num(v, d) { return DEMO_DE ? v.toFixed(d).replace(".", ",") : v.toFixed(d); }

		function state() {
			return {
				proj: parseFloat(projInput.value) || 0,
				thr: parseFloat(thrInput.value) || 0
			};
		}

		function update() {
			var s = state();
			var refused = s.proj > s.thr;
			if (projOut) projOut.textContent = (s.proj >= 0 ? "+" : "") + num(s.proj, 2);
			if (thrOut) thrOut.textContent = num(s.thr, 2);
			if (valueEl) valueEl.textContent = (s.proj >= 0 ? "+" : "") + num(s.proj, 2);
			if (thrValueEl) thrValueEl.textContent = num(s.thr, 2);
			if (statusEl) {
				statusEl.textContent = refused ? (DEMO_DE ? "abgewiesen" : "refused") : (DEMO_DE ? "beantwortet" : "answered");
				statusEl.style.color = refused ? "var(--tm-coral)" : "var(--tm-green)";
			}
			if (noteEl) {
				if (refused) {
					noteEl.textContent = DEMO_DE
						? "Die Projektion liegt über der Schwelle. Die Anfrage wird abgewiesen, obwohl der Rest des Vektors unverändert bleibt."
						: "The projection sits above the threshold. The request is refused, even though the rest of the vector is unchanged.";
				} else {
					noteEl.textContent = DEMO_DE
						? "Die Projektion liegt unter der Schwelle. Die Anfrage wird beantwortet; die Richtung ist noch da, aber sie gewinnt nicht."
						: "The projection sits below the threshold. The request is answered; the direction is still there, but it does not win.";
				}
			}
			if (api) api.redraw();
		}

		function draw(ctx, w, h) {
			var c = TM.colors();
			var s = state();
			var refused = s.proj > s.thr;
			var orth = 0.52;
			var ox = w * 0.24, oy = h * 0.58;
			var sx = Math.min(w * 0.30, 210);
			var sy = Math.min(h * 0.34, 120);
			function X(v) { return ox + v * sx; }
			function Y(v) { return oy - v * sy; }

			ctx.clearRect(0, 0, w, h);
			var bg = ctx.createLinearGradient(0, 0, 0, h);
			bg.addColorStop(0, c.paper2);
			bg.addColorStop(1, c.paper);
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, w, h);

			ctx.fillStyle = "rgba(145,133,190,.10)";
			ctx.fillRect(X(s.thr), 0, w - X(s.thr), h);
			ctx.fillStyle = "rgba(99,164,75,.06)";
			ctx.fillRect(0, 0, X(s.thr), h);

			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(X(-1.05), Y(0)); ctx.lineTo(X(1.05), Y(0));
			ctx.moveTo(X(0), Y(-0.65)); ctx.lineTo(X(0), Y(0.85));
			ctx.stroke();

			ctx.strokeStyle = c.coral;
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 4]);
			ctx.beginPath(); ctx.moveTo(X(s.thr), Y(-0.65)); ctx.lineTo(X(s.thr), Y(0.85)); ctx.stroke();
			ctx.setLineDash([]);
			ctx.fillStyle = c.coral;
			ctx.font = "700 10px Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText("θ", X(s.thr), Y(0.85) - 10);

			ctx.strokeStyle = c.petrol;
			ctx.lineWidth = 2.4;
			ctx.beginPath();
			ctx.moveTo(X(0), Y(0));
			ctx.lineTo(X(1.0), Y(0));
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(X(1.0), Y(0));
			ctx.lineTo(X(0.94), Y(-0.05));
			ctx.lineTo(X(0.94), Y(0.05));
			ctx.closePath();
			ctx.fillStyle = c.petrol;
			ctx.fill();
			ctx.textAlign = "left";
			ctx.font = "700 11px Barlow, system-ui, sans-serif";
			ctx.fillText("r", X(1.0) + 8, Y(0) + 3);

			ctx.strokeStyle = "rgba(0,75,111,.25)";
			ctx.setLineDash([3, 4]);
			ctx.beginPath(); ctx.moveTo(X(s.proj), Y(orth)); ctx.lineTo(X(s.proj), Y(0)); ctx.stroke();
			ctx.beginPath(); ctx.moveTo(X(s.proj), Y(orth)); ctx.lineTo(X(0), Y(orth)); ctx.stroke();
			ctx.setLineDash([]);

			ctx.strokeStyle = c.blue;
			ctx.lineWidth = 2.6;
			ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(s.proj), Y(orth)); ctx.stroke();
			ctx.fillStyle = c.blue;
			ctx.beginPath(); ctx.arc(X(s.proj), Y(orth), 7, 0, Math.PI * 2); ctx.fill();
			ctx.fillStyle = c.paper;
			ctx.beginPath(); ctx.arc(X(s.proj), Y(orth), 2.5, 0, Math.PI * 2); ctx.fill();

			ctx.fillStyle = refused ? c.coral : c.green;
			ctx.font = "700 11px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(refused ? (DEMO_DE ? "abgewiesen" : "refused") : (DEMO_DE ? "beantwortet" : "answered"), X(s.proj) + 12, Y(orth) - 10);
			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.fillText("h", X(s.proj) + 12, Y(orth) + 6);

			ctx.textAlign = "left";
			ctx.fillStyle = c.muted;
			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.fillText(DEMO_DE ? "Projektion auf r" : "projection onto r", X(-1.05), h - 16);
		}

		api = TM.initCanvas(canvas, draw);
		if (projInput) projInput.addEventListener("input", update);
		if (thrInput) thrInput.addEventListener("input", update);
		canvas.addEventListener("click", function (e) {
			var rect = canvas.getBoundingClientRect();
			if (!rect.width) return;
			var w = rect.width;
			var ox = w * 0.24;
			var sx = Math.min(w * 0.30, 210);
			var v = (e.clientX - rect.left - ox) / sx;
			v = Math.max(-1, Math.min(1, v));
			if (projInput) projInput.value = v.toFixed(2);
			update();
		});
		update();
	}

	/* ── loss: surprise as a scalar ─────────────────────────── */

	function initLossSurprise(root) {
		var canvas = $("[data-surprise-canvas]", root);
		if (!canvas) return;
		var pInput = $("[data-surprise-p]", root);
		var pOut = $("[data-surprise-p-out]", root);
		var trueEl = $("[data-surprise-true]", root);
		var ptEl = $("[data-surprise-pt]", root);
		var lossEl = $("[data-surprise-loss]", root);
		var bitsEl = $("[data-surprise-bits]", root);
		var noteEl = $("[data-surprise-note]", root);
		var classes = DEMO_DE ? ["Katze", "Hund", "Matte"] : ["cat", "dog", "mat"];
		var emoji = ["🐱", "🐶", "🧶"];
		var target = 2;
		var api;

		function num(v, d) { return DEMO_DE ? v.toFixed(d).replace(".", ",") : v.toFixed(d); }
		function pct(v, d) { return num(v * 100, d) + " %"; }

		function update() {
			var p = Math.max(0.001, Math.min(1, parseFloat(pInput.value) || 0.001));
			var L = -Math.log(p);
			if (pOut) pOut.textContent = pct(p, 1);
			if (trueEl) trueEl.textContent = emoji[target] + " " + classes[target];
			if (ptEl) ptEl.textContent = pct(p, 1);
			if (lossEl) lossEl.textContent = num(L, 2);
			if (bitsEl) bitsEl.textContent = num(L / Math.LN2, 2) + (DEMO_DE ? " Bit" : " bits");
			if (noteEl) {
				if (p < 0.05) {
					noteEl.textContent = DEMO_DE
						? "Überzeugt und falsch: Die richtige Klasse bekommt nur " + pct(p, 1) + ", der Loss ist −ln p = " + num(L, 2) + ". Die Kurve wird zur Wand, je näher p an null rückt."
						: "Confident and wrong: the true class gets only " + pct(p, 1) + ", so the loss is −ln p = " + num(L, 2) + ". The curve becomes a wall as p approaches zero.";
				} else if (p < 0.5) {
					noteEl.textContent = DEMO_DE
						? "Unsicher: Die richtige Klasse bekommt " + pct(p, 1) + " und kostet " + num(L, 2) + " Nats. Cross-Entropy ist mit einer richtigen, aber zaghaften Antwort nicht zufrieden."
						: "Uncertain: the true class gets " + pct(p, 1) + " and costs " + num(L, 2) + " nats. Cross-entropy is not satisfied with a correct but timid answer.";
				} else {
					noteEl.textContent = DEMO_DE
						? "Richtig und einigermaßen sicher: Bei " + pct(p, 1) + " beträgt der Loss " + num(L, 2) + " Nats (" + num(L / Math.LN2, 2) + " Bit). Je näher p an eins rückt, desto flacher wird die Kurve."
						: "Right and reasonably sure: at " + pct(p, 1) + " the loss is " + num(L, 2) + " nats (" + num(L / Math.LN2, 2) + " bits). As p moves toward one the curve flattens.";
				}
			}
			if (api) api.redraw();
		}

		function draw(ctx, w, h) {
			var c = TM.colors();
			var p = Math.max(0.001, Math.min(1, parseFloat(pInput.value) || 0.001));
			var L = -Math.log(p);
			var probs = classes.map(function (_, i) { return i === target ? p : (1 - p) / 2; });
			var colors = [c.blue, c.sky, c.green];
			var bx = 26, by = 54, bw = Math.max(90, Math.min(w * 0.34, 250));

			ctx.clearRect(0, 0, w, h);
			var bg = ctx.createLinearGradient(0, 0, 0, h);
			bg.addColorStop(0, c.paper2);
			bg.addColorStop(1, c.paper);
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, w, h);

			ctx.textBaseline = "middle";
			ctx.textAlign = "left";
			ctx.fillStyle = c.muted;
			ctx.font = "600 11px Barlow, system-ui, sans-serif";
			ctx.fillText(DEMO_DE ? "Modellverteilung" : "model distribution", bx, by - 26);
			classes.forEach(function (name, i) {
				var y = by + i * 50;
				var col = i === target ? c.green : colors[i];
				ctx.fillStyle = col;
				ctx.font = "700 11px Barlow, system-ui, sans-serif";
				ctx.fillText(emoji[i] + " " + name, bx, y - 9);
				ctx.fillStyle = "rgba(0,75,111,.10)";
				ctx.beginPath();
				if (ctx.roundRect) { ctx.roundRect(bx, y, bw, 13, 6); ctx.fill(); }
				else ctx.fillRect(bx, y, bw, 13);
				ctx.fillStyle = i === target ? c.green : col;
				ctx.globalAlpha = i === target ? 0.9 : 0.5;
				ctx.beginPath();
				if (ctx.roundRect) { ctx.roundRect(bx, y, Math.max(3, bw * probs[i]), 13, 6); ctx.fill(); }
				else ctx.fillRect(bx, y, Math.max(3, bw * probs[i]), 13);
				ctx.globalAlpha = 1;
				ctx.fillStyle = col;
				ctx.font = "700 10px Barlow, system-ui, sans-serif";
				ctx.fillText(pct(probs[i], 1), bx + bw + 9, y + 7);
			});
			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.fillText((DEMO_DE ? "richtige Klasse: " : "true class: ") + emoji[target] + " " + classes[target], bx, by + 3 * 50 + 10);

			var lx = w * 0.57, ly = 46, lw = Math.max(70, w - lx - 30), lh = h - 88;
			function X(v) { return lx + lw * v; }
			function Y(v) { return ly + lh * (1 - Math.min(1, Math.max(0, v / 5))); }
			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "right";
			for (var i = 0; i <= 5; i++) {
				ctx.beginPath(); ctx.moveTo(lx, Y(i)); ctx.lineTo(lx + lw, Y(i)); ctx.stroke();
				ctx.fillStyle = c.muted; ctx.fillText(String(i), lx - 7, Y(i));
			}
			ctx.textAlign = "center";
			ctx.fillText("0 %", lx, ly + lh + 15);
			ctx.fillText("100 %", lx + lw, ly + lh + 15);
			ctx.textAlign = "left";
			ctx.fillStyle = c.muted;
			ctx.fillText(DEMO_DE ? "Loss" : "loss", lx, ly - 9);
			ctx.fillText(DEMO_DE ? "p(richtig)" : "p(true)", lx + lw / 2 - 18, ly + lh + 15);

			ctx.beginPath();
			for (var k = 0; k <= 160; k++) {
				var q = Math.max(0.001, k / 160);
				var v = -Math.log(q);
				if (k === 0) ctx.moveTo(X(q), Y(v)); else ctx.lineTo(X(q), Y(v));
			}
			ctx.strokeStyle = c.petrol;
			ctx.lineWidth = 2.6;
			ctx.stroke();

			ctx.strokeStyle = c.coral;
			ctx.setLineDash([4, 4]);
			ctx.beginPath(); ctx.moveTo(X(p), Y(0)); ctx.lineTo(X(p), Y(L)); ctx.stroke();
			ctx.setLineDash([]);
			ctx.fillStyle = p < 0.2 ? c.coral : c.green;
			ctx.beginPath(); ctx.arc(X(p), Y(L), 7, 0, Math.PI * 2); ctx.fill();
			ctx.fillStyle = c.ink;
			ctx.font = "700 11px Barlow, system-ui, sans-serif";
			ctx.textAlign = p > 0.8 ? "right" : "left";
			ctx.fillText(num(L, 2), X(p) + (p > 0.8 ? -10 : 10), Y(L) - 8);
			ctx.textAlign = "left";
		}

		api = TM.initCanvas(canvas, draw);
		$$("[data-surprise-class]", root).forEach(function (btn) {
			btn.addEventListener("click", function () {
				target = parseInt(btn.getAttribute("data-surprise-class"), 10) || 0;
				$$("[data-surprise-class]", root).forEach(function (x) { x.classList.toggle("is-on", x === btn); });
				update();
			});
		});
		if (pInput) pInput.addEventListener("input", update);
		update();
	}

	/* ── prompt builder ─────────────────────────────────────── */

	function initPrompt(root) {
		var chips = $$("[data-prompt]", root);
		var meter = $("[data-prompt-meter]", root);
		var value = $("[data-prompt-value]", root);
		var preview = $("[data-prompt-preview]", root);
		var candsEl = $("[data-prompt-cands]", root);
		var sampleBtn = $("[data-prompt-sample]", root);
		var tokenEl = $("[data-prompt-tokens]", root);
		var sampledEl = $("[data-prompt-sampled]", root);
		var variance = $("[data-prompt-variance]", root);
		if (!chips.length || !candsEl) return;
		var candidates = DEMO_DE ? [
			{ name: "Knapper Fakt", text: "Sonnenlicht streut an Luftmolekülen. Kürzere blaue Wellenlängen streuen stärker, deshalb erreicht Blau deine Augen aus jeder Richtung.", base: 0.7, role: 0.2, format: 0.8, examples: 0.2, constraints: 0.5 },
			{ name: "Tutor-Geschichte", text: "Stell dir Sonnenlicht als Mischung aus Farben vor. Luftmoleküle stoßen das blaue Licht viel stärker herum als das rote, deshalb kommt Blau aus jedem Stück Himmel.", base: 0.8, role: 1.5, format: 0.3, examples: 0.9, constraints: 0.6 },
			{ name: "Drei Punkte", text: "• Sonnenlicht enthält alle Farben.\n• Luft streut kurze (blaue) Wellen stärker.\n• Deshalb erreicht Blau deine Augen von überall.", base: 0.4, role: 0.5, format: 1.9, examples: 0.4, constraints: 0.4 },
			{ name: "Knapp", text: "Der Himmel ist blau.", base: 0.6, role: -0.2, format: -0.3, examples: -0.2, constraints: -0.6 },
			{ name: "Ozean-Mythos", text: "Der Himmel ist blau, weil er den Ozean spiegelt.", base: 0.5, role: -0.8, format: -0.6, examples: -0.7, constraints: -2.0 }
		] : [
			{ name: "Concise fact", text: "Sunlight scatters off air molecules. Shorter blue wavelengths scatter more, so blue reaches your eyes from every direction.", base: 0.7, role: 0.2, format: 0.8, examples: 0.2, constraints: 0.5 },
			{ name: "Tutor story", text: "Imagine sunlight as a mix of colours. Air molecules bump the blue light around much more than the red, so blue arrives from every patch of sky.", base: 0.8, role: 1.5, format: 0.3, examples: 0.9, constraints: 0.6 },
			{ name: "Three bullets", text: "• Sunlight contains all colours.\n• Air scatters short (blue) waves more.\n• So blue reaches your eyes from everywhere.", base: 0.4, role: 0.5, format: 1.9, examples: 0.4, constraints: 0.4 },
			{ name: "Terse", text: "The sky is blue.", base: 0.6, role: -0.2, format: -0.3, examples: -0.2, constraints: -0.6 },
			{ name: "Ocean myth", text: "The sky is blue because it reflects the ocean.", base: 0.5, role: -0.8, format: -0.6, examples: -0.7, constraints: -2.0 }
		];
		var on = { role: true, format: false, examples: false, constraints: false };
		var sampledIndex = -1;
		var phrase = DEMO_DE ? {
			role: "Du bist ein geduldiger Wissenschaftstutor.",
			format: "Antworte in drei Stichpunkten.",
			examples: "Beispiel: „Sonnenlicht ist eine Mischung aus Farben.“",
			constraints: "Erfinde keine Fakten und verwende keinen unerklärten Fachjargon."
		} : {
			role: "You are a patient science tutor.",
			format: "Answer in three bullet points.",
			examples: "Example: \"Sunlight is a mix of colours.\"",
			constraints: "Do not invent facts or use unexplained jargon."
		};
		function weights() {
			return candidates.map(function (c) {
				var s = c.base;
				Object.keys(on).forEach(function (k) { if (on[k]) s += c[k] || 0; });
				return Math.exp(s * 1.25);
			});
		}
		function render() {
			var w = weights();
			var sum = w.reduce(function (a, b) { return a + b; }, 0);
			var probs = w.map(function (x) { return x / sum; });
			var top = Math.max.apply(null, probs);
			var order = probs.map(function (_, i) { return i; }).sort(function (a, b) { return probs[b] - probs[a]; });
			if (meter) meter.style.width = (top * 100).toFixed(1) + "%";
			if (value) value.textContent = Math.round(top * 100) + "%";
			var accent = colors();
			var palette = [accent.green, accent.sky, accent.gold, accent.coral, accent.lime];
			if (variance) {
				variance.innerHTML = order.map(function (i) {
					return '<span style="width:' + (probs[i] * 100).toFixed(2) + '%;background:' + palette[i % palette.length] + '" title="' + escapeHtml(candidates[i].name) + ' · ' + Math.round(probs[i] * 100) + '%"></span>';
				}).join("");
			}
			var active = Object.keys(on).filter(function (k) { return on[k]; });
			if (preview) {
				preview.innerHTML = (active.length ? active.map(function (k) { return escapeHtml(phrase[k]); }).join(" ") + "<br><br>" : "") + (DEMO_DE ? "Frage: Warum ist der Himmel blau?" : "Question: Why is the sky blue?");
			}
			candsEl.innerHTML = order.map(function (i) {
				var c = candidates[i];
				var cls = "prompt-completion" + (i === order[0] ? " is-hit" : "") + (i === sampledIndex ? " is-sampled" : "");
				return '<div class="' + cls + '" style="--pc:' + palette[i % palette.length] + ';animation-delay:' + (order.indexOf(i) * 28) + 'ms">' +
					'<div class="prompt-completion-kicker">' + (DEMO_DE ? "Vervollständigung" : "Completion") + '</div>' +
					'<p class="prompt-completion-text">' + escapeHtml(c.text).replace(/\n/g, "<br>") + '</p>' +
					'<div class="prompt-completion-meta"><span>' + escapeHtml(c.name) + '</span><b>' + Math.round(probs[i] * 100) + '%</b></div></div>';
			}).join("");
			if (tokenEl) tokenEl.textContent = (8 + active.length * 11) + (DEMO_DE ? " Tokens" : " tokens");
			if (sampledEl && sampledIndex < 0) sampledEl.textContent = DEMO_DE ? "Drücke auf Ziehen, um eine vollständige Vervollständigung aus der Verteilung zu ziehen." : "Press sample to draw one full completion from the distribution.";
		}
		chips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				var key = chip.getAttribute("data-prompt");
				on[key] = !on[key];
				chip.classList.toggle("is-on", on[key]);
				sampledIndex = -1;
				if (sampledEl) sampledEl.removeAttribute("data-has");
				render();
			});
		});
		if (sampleBtn) sampleBtn.addEventListener("click", function () {
			var w = weights();
			var sum = w.reduce(function (a, b) { return a + b; }, 0);
			var r = Math.random() * sum, acc = 0, pick = 0;
			for (var i = 0; i < w.length; i++) {
				acc += w[i];
				if (r <= acc) { pick = i; break; }
			}
			sampledIndex = pick;
			if (sampledEl) sampledEl.setAttribute("data-has", "1");
			render();
			if (sampledEl) {
				sampledEl.innerHTML = "<b>" + (DEMO_DE ? "Gezogene Ausgabe:" : "Sampled output:") + "</b> " + escapeHtml(candidates[pick].text).replace(/\n/g, "<br>");
			}
		});
		function measureSampleHeight() {
			if (!sampledEl) return;
			var initial = DEMO_DE
				? "Drücke auf Ziehen, um eine vollständige Vervollständigung aus der Verteilung zu ziehen."
				: "Press sample to draw one full completion from the distribution.";
			var samples = [initial].concat(candidates.map(function (c) {
				return "<b>" + (DEMO_DE ? "Gezogene Ausgabe:" : "Sampled output:") + "</b> " + escapeHtml(c.text).replace(/\n/g, "<br>");
			}));
			var old = sampledEl.innerHTML;
			sampledEl.style.visibility = "hidden";
			sampledEl.style.minHeight = "0";
			var max = 0;
			samples.forEach(function (html) {
				sampledEl.innerHTML = html;
				max = Math.max(max, sampledEl.offsetHeight);
			});
			sampledEl.innerHTML = old;
			sampledEl.style.visibility = "";
			sampledEl.style.minHeight = max + "px";
		}
		var sampleResize = null;
		window.addEventListener("resize", function () {
			clearTimeout(sampleResize);
			sampleResize = setTimeout(measureSampleHeight, 120);
		});
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureSampleHeight);
		render();
		measureSampleHeight();
	}

	/* ── positional rail ────────────────────────────────────── */

	function initTrajectory(root) {
		var canvas = $("[data-trajectory-canvas]", root);
		if (!canvas) return;
		var count = $("[data-trajectory-count]", root);
		var countOut = $("[data-trajectory-count-out]", root);
		var dim = $("[data-trajectory-dim]", root);
		var dimOut = $("[data-trajectory-dim-out]", root);
		var dimNote = $("[data-trajectory-dim-note]", root);
		var viewOut = $("[data-trajectory-view-out]", root);
		var view = "2d";
		var yaw = 0.6, pitch = -0.34;
		var drag = null;

		function pe(pos, d) {
			var pair = Math.floor(d / 2);
			var angle = pos / Math.pow(10000, (2 * pair) / 64);
			return d % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
		}
		function point(pos, startDim) {
			return [
				pe(pos, startDim),
				pe(pos, startDim + 1),
				pe(pos, startDim + 2)
			];
		}
		function palette(c) {
			return [c.green, c.sky, c.gold, c.coral, c.lime, c.blue, c.petrol, c.faint]
				.map(hexToRgb);
		}
		function draw2d(ctx, W, H, pts, pal, c) {
			var cx = W / 2, cy = H / 2 + 8;
			var scale = Math.min(W, H) * 0.31;
			ctx.strokeStyle = c.lineStrong;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(cx - scale * 1.9, cy); ctx.lineTo(cx + scale * 1.9, cy);
			ctx.moveTo(cx, cy - scale * 1.5); ctx.lineTo(cx, cy + scale * 1.5);
			ctx.stroke();
			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText("dimension pair", cx + scale * 1.95, cy + 3);

			ctx.beginPath();
			pts.forEach(function (p, i) {
				var x = cx + p[0] * scale;
				var y = cy - p[1] * scale;
				if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
			});
			ctx.strokeStyle = c.lineStrong;
			ctx.lineWidth = 1.2;
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(cx - 6, cy - 6); ctx.lineTo(cx + 6, cy + 6);
			ctx.moveTo(cx + 6, cy - 6); ctx.lineTo(cx - 6, cy + 6);
			ctx.strokeStyle = c.muted;
			ctx.lineWidth = 1.5;
			ctx.stroke();

			var labelStep = Math.max(1, Math.round(pts.length / 6));
			pts.forEach(function (p, i) {
				var x = cx + p[0] * scale;
				var y = cy - p[1] * scale;
				ctx.beginPath();
				ctx.arc(x, y, i === pts.length - 1 ? 5 : 3.6, 0, Math.PI * 2);
				ctx.fillStyle = rgb(pal[i % pal.length]);
				ctx.fill();
				ctx.strokeStyle = c.card;
				ctx.lineWidth = 1.2;
				ctx.stroke();
				if (i === 0 || i === pts.length - 1 || i % labelStep === 0) {
					ctx.fillStyle = c.inkSoft;
					ctx.font = "600 9px ui-monospace, monospace";
					ctx.textAlign = "left";
					ctx.fillText("p" + i, x + 6, y - 5);
				}
			});
			ctx.fillStyle = c.muted;
			ctx.font = "600 9px ui-monospace, monospace";
			ctx.textAlign = "center";
			ctx.fillText("token", cx, cy + 20);
			ctx.textAlign = "left";
			ctx.fillStyle = c.inkSoft;
			ctx.font = "600 11px Barlow, system-ui, sans-serif";
			ctx.fillText("the grey cross is the token vector; each dot is + position", 14, 20);
		}
		function project(p, W, H) {
			var scale = Math.min(W, H) * 0.28;
			var cy = Math.cos(yaw), sy = Math.sin(yaw);
			var x1 = p[0] * cy - p[2] * sy;
			var z1 = p[0] * sy + p[2] * cy;
			var cp = Math.cos(pitch), sp = Math.sin(pitch);
			var y1 = p[1] * cp - z1 * sp;
			var z2 = p[1] * sp + z1 * cp;
			var persp = 1 / (1 + z2 * 0.16);
			return [W / 2 + x1 * scale * persp, H / 2 - y1 * scale * persp, z2];
		}
		function draw3d(ctx, W, H, pts, pal, c) {
			var origin = project([0, 0, 0], W, H);
			var axes = [
				{ p: [1.8, 0, 0], label: "d" },
				{ p: [0, 1.5, 0], label: "d+1" },
				{ p: [0, 0, 1.8], label: "d+2" }
			];
			axes.forEach(function (a) {
				var q = project(a.p, W, H);
				ctx.strokeStyle = c.line;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(origin[0], origin[1]);
				ctx.lineTo(q[0], q[1]);
				ctx.stroke();
				ctx.fillStyle = c.muted;
				ctx.font = "600 10px Barlow, system-ui, sans-serif";
				ctx.fillText(a.label, q[0] + 4, q[1] - 3);
			});
			var projected = pts.map(function (p, i) { return { q: project(p, W, H), i: i }; });
			ctx.globalAlpha = 0.55;
			for (var li = 1; li < projected.length; li++) {
				ctx.strokeStyle = rgb(pal[li % pal.length]);
				ctx.lineWidth = 1.8;
				ctx.beginPath();
				ctx.moveTo(projected[li - 1].q[0], projected[li - 1].q[1]);
				ctx.lineTo(projected[li].q[0], projected[li].q[1]);
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
			ctx.beginPath();
			ctx.moveTo(origin[0] - 5, origin[1] - 5); ctx.lineTo(origin[0] + 5, origin[1] + 5);
			ctx.moveTo(origin[0] + 5, origin[1] - 5); ctx.lineTo(origin[0] - 5, origin[1] + 5);
			ctx.strokeStyle = c.muted;
			ctx.lineWidth = 1.5;
			ctx.stroke();
			ctx.fillStyle = c.muted;
			ctx.font = "600 9px ui-monospace, monospace";
			ctx.textAlign = "center";
			ctx.fillText("token", origin[0], origin[1] + 16);
			var labelStep = Math.max(1, Math.round(projected.length / 6));
			projected.sort(function (a, b) { return a.q[2] - b.q[2]; });
			projected.forEach(function (item) {
				var q = item.q;
				ctx.beginPath();
				ctx.arc(q[0], q[1], 3.4, 0, Math.PI * 2);
				ctx.fillStyle = rgb(pal[item.i % pal.length]);
				ctx.fill();
				ctx.strokeStyle = c.card;
				ctx.lineWidth = 1;
				ctx.stroke();
				if (item.i === 0 || item.i === projected.length - 1 || item.i % labelStep === 0) {
					ctx.fillStyle = c.inkSoft;
					ctx.font = "600 9px ui-monospace, monospace";
					ctx.textAlign = "left";
					ctx.fillText("p" + item.i, q[0] + 5, q[1] - 4);
				}
			});
			ctx.textAlign = "left";
			ctx.fillStyle = c.inkSoft;
			ctx.font = "600 11px Barlow, system-ui, sans-serif";
			ctx.fillText("drag to rotate · the line follows positions 0, 1, 2, …", 14, 20);
		}
		function draw(ctx, W, H) {
			var c = colors();
			var n = clamp(parseInt(count && count.value, 10) || 32, 2, 96);
			var d = clamp(parseInt(dim && dim.value, 10) || 0, 0, 62);
			if (countOut) countOut.textContent = n;
			if (dimOut) dimOut.textContent = d + " / " + (d + 1);
			if (dimNote) {
				var speed = d < 16 ? "fast" : d < 40 ? "medium" : "slow";
				dimNote.textContent = DEMO_DE
					? "Paar " + d + " / " + (d + 1) + ": " + (d < 16 ? "schnelle" : d < 40 ? "mittlere" : "langsame") + " Wellen. Höhere Paare drehen langsamer, sodass der Kreis enger wird."
					: "Pair " + d + " / " + (d + 1) + ": " + speed + " waves. Higher pairs turn slower, so the circle tightens.";
			}
			if (viewOut) viewOut.textContent = view === "2d" ? "circle" : "helix";
			var pts = [];
			for (var i = 0; i < n; i++) pts.push(point(i, d));
			var pal = palette(c);
			ctx.clearRect(0, 0, W, H);
			if (view === "2d") draw2d(ctx, W, H, pts, pal, c);
			else draw3d(ctx, W, H, pts, pal, c);
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		if (count) count.addEventListener("input", function () { api.redraw(); });
		if (dim) dim.addEventListener("input", function () { api.redraw(); });
		$$("[data-trajectory-view]", root).forEach(function (btn) {
			btn.addEventListener("click", function () {
				view = btn.getAttribute("data-trajectory-view");
				$$("[data-trajectory-view]", root).forEach(function (b) { b.classList.toggle("is-on", b === btn); });
				api.redraw();
			});
		});
		canvas.addEventListener("pointerdown", function (ev) {
			if (view !== "3d") return;
			drag = { x: ev.clientX, y: ev.clientY };
			if (canvas.setPointerCapture) canvas.setPointerCapture(ev.pointerId);
		});
		canvas.addEventListener("pointermove", function (ev) {
			if (!drag) return;
			yaw += (ev.clientX - drag.x) * 0.01;
			pitch = clamp(pitch + (ev.clientY - drag.y) * 0.01, -1.2, 1.2);
			drag = { x: ev.clientX, y: ev.clientY };
			api.redraw();
		});
		canvas.addEventListener("pointerup", function () { drag = null; });
		canvas.addEventListener("pointercancel", function () { drag = null; });
		api.redraw();
	}

	/* ── folds add up ───────────────────────────────────────── */

	function initFolds(root) {
		var canvas = $("[data-folds-canvas]", root);
		if (!canvas) return;
		var depthEl = $("[data-folds-depth]", root);
		var depthOut = $("[data-folds-depth-out]", root);
		var depthReadout = $("[data-folds-depth-readout]", root);
		var piecesEl = $("[data-folds-pieces]", root);
		function value(x, depth) {
			var periods = Math.pow(2, depth - 1);
			var u = (x + 1) / 2 * periods;
			var frac = u - Math.floor(u);
			return (frac < 0.5 ? frac * 2 : (1 - frac) * 2) * 1.6 - 0.8;
		}
		function readDepth() {
			return clamp(parseInt(depthEl && depthEl.value, 10) || 3, 1, 7);
		}
		function update() {
			var depth = readDepth();
			var pieces = Math.pow(2, depth);
			if (depthOut) depthOut.textContent = depth;
			if (depthReadout) depthReadout.textContent = depth;
			if (piecesEl) piecesEl.textContent = pieces;
			return depth;
		}
		function draw(ctx, W, H) {
			var c = colors();
			var depth = update();
			var pieces = Math.pow(2, depth);
			var padX = 30, padY = 26;
			var x0 = padX, x1 = W - padX;
			var y0 = H - padY, y1 = padY;
			ctx.clearRect(0, 0, W, H);
			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			for (var gx = 1; gx < 8; gx++) {
				var xx = x0 + (x1 - x0) * gx / 8;
				ctx.beginPath();
				ctx.moveTo(xx, y1);
				ctx.lineTo(xx, y0);
				ctx.stroke();
			}
			for (var gy = 1; gy < 4; gy++) {
				var yy = y1 + (y0 - y1) * gy / 4;
				ctx.beginPath();
				ctx.moveTo(x0, yy);
				ctx.lineTo(x1, yy);
				ctx.stroke();
			}
			ctx.strokeStyle = c.lineStrong;
			ctx.lineWidth = 1.3;
			ctx.beginPath();
			ctx.moveTo(x0, y0);
			ctx.lineTo(x1, y0);
			ctx.moveTo(x0, y0);
			ctx.lineTo(x0, y1);
			ctx.stroke();
			var steps = Math.max(240, pieces * 36);
			ctx.beginPath();
			for (var i = 0; i <= steps; i++) {
				var t = i / steps;
				var x = -1 + 2 * t;
				var y = value(x, depth);
				var px = x0 + (x1 - x0) * t;
				var py = y0 - (y + 1) / 2 * (y0 - y1);
				if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
			}
			ctx.strokeStyle = c.green;
			ctx.lineWidth = 2.2;
			ctx.stroke();
			ctx.fillStyle = c.muted;
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.fillText("input", x1 - 28, y0 + 18);
			ctx.fillText("output", x0 - 24, y1 + 8);
			ctx.fillStyle = c.inkSoft;
			ctx.font = "600 11px Barlow, system-ui, sans-serif";
			ctx.fillText("depth " + depth + " · " + pieces + " linear pieces", x0 + 8, y1 + 16);
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		if (depthEl) depthEl.addEventListener("input", function () { update(); api.redraw(); });
		window.addEventListener("tm:theme", function () { api.redraw(); });
		update();
		api.redraw();
	}

	/* ── one head, one attention budget ─────────────────────── */

	function initHeadBudget(root) {
		var bars = $("[data-hb-bars]", root);
		if (!bars) return;
		var headEl = $("[data-hb-head-name]", root);
		var topEl = $("[data-hb-top]", root);
		var concEl = $("[data-hb-conc]", root);
		var budgetEl = $("[data-hb-budget]", root);
		var noteEl = $("[data-hb-note]", root);
		var tokens = DEMO_DE ? ["Maria", "sagte", "der", "Bank", "sie", "Kredit"] : ["Maria", "told", "the", "bank", "she", "loan"];
		var heads = {
			coref: [0.46, 0.04, 0.03, 0.08, 0.14, 0.25],
			syntax: [0.18, 0.28, 0.19, 0.10, 0.15, 0.10],
			meaning: [0.04, 0.05, 0.04, 0.40, 0.10, 0.37]
		};
		var names = DEMO_DE ? { coref: "Koreferenz", syntax: "Syntax", meaning: "Bedeutung" } : { coref: "Coreference", syntax: "Syntax", meaning: "Meaning" };
		var head = "coref";
		var weights = heads[head].slice();

		function normalise(a) {
			var sum = a.reduce(function (x, y) { return x + y; }, 0) || 1;
			return a.map(function (x) { return x / sum; });
		}
		function render() {
			weights = normalise(weights);
			var top = 0;
			weights.forEach(function (w, i) { if (w > weights[top]) top = i; });
			bars.innerHTML = tokens.map(function (tok, i) {
				var pct = Math.round(weights[i] * 100);
				return '<button class="dist-row" type="button" data-hb-token="' + i + '">' +
					'<span class="dist-label">' + escapeHtml(tok) + '</span>' +
					'<span class="dist-track"><span class="dist-fill" style="width:' + pct + '%;background:' +
					(i === top ? "var(--tm-green)" : "var(--tm-sky)") + '"></span></span>' +
					'<span class="dist-val">' + pct + '%</span></button>';
			}).join("");
			$$("[data-hb-token]", bars).forEach(function (row) {
				row.addEventListener("click", function () {
					var i = parseInt(row.getAttribute("data-hb-token"), 10);
					weights = weights.map(function (w) { return w * 0.8; });
					weights[i] += 0.2;
					render();
				});
			});
			if (headEl) headEl.textContent = names[head];
			if (topEl) topEl.textContent = tokens[top];
			if (concEl) concEl.textContent = Math.round(weights[top] * 100) + (DEMO_DE ? " % auf einem Token" : "% on one token");
			if (budgetEl) budgetEl.textContent = "1.00 / 1.00";
			if (noteEl) noteEl.textContent = DEMO_DE ? "Ein Head, ein Budget. Ein Klick verschiebt 0,20 des Budgets auf dieses Token; jedes andere Token gibt seinen Anteil ab. Wechsle Heads: Jeder hat sein eigenes Budget." : "One head, one budget. A click moves 0.20 of the budget to that token; every other token gives up its share. Switch heads: each has its own budget.";
		}
		$$("[data-hb-head]", root).forEach(function (btn) {
			btn.addEventListener("click", function () {
				head = btn.getAttribute("data-hb-head");
				weights = heads[head].slice();
				$$("[data-hb-head]", root).forEach(function (b) { b.classList.toggle("is-on", b === btn); });
				render();
			});
		});
		var reset = $("[data-hb-reset]", root);
		if (reset) reset.addEventListener("click", function () { weights = heads[head].slice(); render(); });
		var spread = $("[data-hb-spread]", root);
		if (spread) spread.addEventListener("click", function () { weights = tokens.map(function () { return 1; }); render(); });
		render();
	}

	/* ── optimizer race ─────────────────────────────────────── */

	function initOptimizer(root) {
		var canvas = $("[data-opt-canvas]", root);
		if (!canvas) return;
		var board = $("[data-opt-board]", root);
		var leaderEl = $("[data-opt-leader]", root);
		var stepEl = $("[data-opt-stepout]", root);
		var lossEl = $("[data-opt-loss]", root);
		var noteEl = $("[data-opt-note]", root);
		var playBtn = $("[data-opt-play]", root);
		var stepBtn = $("[data-opt-step]", root);
		var resetBtn = $("[data-opt-reset]", root);
		var lrInput = $("[data-opt-lr]", root);
		var lrOut = $("[data-opt-lr-out]", root);
		var MAX = 300;

		var surfaces = {
			ravine: {
				f: function (x, y) { return 0.05 * x * x + 2.5 * y * y; },
				g: function (x, y) { return [0.1 * x, 5 * y]; },
				box: [-6, 6, -3, 3], start: [-5.2, 1.6], min: [[0, 0]], fmin: 0,
				lr: { sgd: 0.38, mom: 0.04, adam: 0.4 }
			},
			banana: {
				f: function (x, y) { return (1 - x) * (1 - x) + 10 * (y - x * x) * (y - x * x); },
				g: function (x, y) { return [-2 * (1 - x) - 40 * x * (y - x * x), 20 * (y - x * x)]; },
				box: [-2, 2, -1, 3], start: [-1.6, 2.6], min: [[1, 1]], fmin: 0,
				lr: { sgd: 0.012, mom: 0.003, adam: 0.04 }
			},
			saddle: {
				f: function (x, y) { return x * x - y * y + 0.25 * Math.pow(y, 4); },
				g: function (x, y) { return [2 * x, -2 * y + Math.pow(y, 3)]; },
				box: [-3, 3, -2.6, 2.6], start: [2.6, 0.02], min: [[0, Math.SQRT2], [0, -Math.SQRT2]], fmin: -1,
				lr: { sgd: 0.03, mom: 0.01, adam: 0.2 }
			}
		};
		var racers = [
			{ id: "sgd", name: "SGD", key: "blue" },
			{ id: "mom", name: "Momentum", key: "gold" },
			{ id: "adam", name: "Adam", key: "green" }
		];

		var current = "ravine";
		var state = [];
		var startPt = null;
		var step = 0;
		var running = false;
		var raf = null;
		onTeardown(root, function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } });
		var bg = null;
		var bgKey = "";
		var api = canvasDemo(canvas, paint);
		if (!api) return;

		function col(rc) {
			var c = colors();
			if (rc.key === "blue") return c.blue || "#1275ac";
			if (rc.key === "gold") return c.gold || "#9f9700";
			return c.green || "#63a44b";
		}
		function bgKeyNow() {
			return current + "|" + (document.documentElement.getAttribute("data-theme") || "light") +
				"|" + (canvas.clientWidth | 0) + "x" + (canvas.clientHeight | 0);
		}
		function lrMul() {
			return lrInput ? (parseFloat(lrInput.value) || 1) : 1;
		}
		function fmt(n) {
			if (!isFinite(n)) return "∞";
			if (n === 0) return "0";
			if (Math.abs(n) < 0.001) return n.toExponential(1);
			return n.toFixed(3);
		}

		function buildBg(w, h) {
			var c = colors();
			var low = hexToRgb(c.card || "#ffffff");
			var mid = hexToRgb(c.dark ? (c.blue || "#009299") : (c.sky || "#5c9baf"));
			var high = hexToRgb(c.petrol || "#004b6f");
			var S = surfaces[current];
			var gw = 110;
			var gh = Math.max(56, Math.round(gw * h / Math.max(1, w)));
			var off = document.createElement("canvas");
			off.width = gw;
			off.height = gh;
			var octx = off.getContext("2d");
			var img = octx.createImageData(gw, gh);
			var vals = new Float32Array(gw * gh);
			var lo = Infinity, hi = -Infinity;
			for (var j = 0; j < gh; j++) {
				for (var i = 0; i < gw; i++) {
					var x = S.box[0] + (i + 0.5) / gw * (S.box[1] - S.box[0]);
					var y = S.box[3] - (j + 0.5) / gh * (S.box[3] - S.box[2]);
					var v = Math.log(S.f(x, y) - S.fmin + 0.02);
					vals[j * gw + i] = v;
					if (v < lo) lo = v;
					if (v > hi) hi = v;
				}
			}
			var band = function (v) {
				return Math.min(13, Math.floor((v - lo) / (hi - lo + 1e-9) * 14));
			};
			var dark = c.dark;
			for (j = 0; j < gh; j++) {
				for (i = 0; i < gw; i++) {
					var k = j * gw + i;
					var t = clamp((vals[k] - lo) / (hi - lo + 1e-9), 0, 1);
					var base = t < 0.5 ? mix(low, mid, t * 2) : mix(mid, high, (t - 0.5) * 2);
					var b0 = band(vals[k]);
					var edge = (i + 1 < gw && band(vals[k + 1]) !== b0) ||
						(j + 1 < gh && band(vals[k + gw]) !== b0);
					var s = edge ? (dark ? 1.16 : 0.9) : 1;
					img.data[k * 4] = clamp(Math.round(base[0] * s), 0, 255);
					img.data[k * 4 + 1] = clamp(Math.round(base[1] * s), 0, 255);
					img.data[k * 4 + 2] = clamp(Math.round(base[2] * s), 0, 255);
					img.data[k * 4 + 3] = 255;
				}
			}
			octx.putImageData(img, 0, 0);
			return off;
		}

		function paint(ctx, w, h) {
			if (!state.length) {
				ctx.clearRect(0, 0, w, h);
				return;
			}
			var key = bgKeyNow();
			if (!bg || bgKey !== key) {
				bg = buildBg(w, h);
				bgKey = key;
			}
			ctx.clearRect(0, 0, w, h);
			ctx.drawImage(bg, 0, 0, w, h);
			var S = surfaces[current];
			var c = colors();
			function px(x, y) {
				return [
					(x - S.box[0]) / (S.box[1] - S.box[0]) * w,
					(S.box[3] - y) / (S.box[3] - S.box[2]) * h
				];
			}
			ctx.strokeStyle = c.inkSoft || "#2c464d";
			ctx.lineWidth = 1.2;
			S.min.forEach(function (m) {
				var p = px(m[0], m[1]);
				ctx.beginPath();
				ctx.arc(p[0], p[1], 5, 0, Math.PI * 2);
				ctx.stroke();
			});
			var sp = px(startPt[0], startPt[1]);
			ctx.setLineDash([3, 3]);
			ctx.strokeStyle = c.muted || "#627476";
			ctx.beginPath();
			ctx.arc(sp[0], sp[1], 8, 0, Math.PI * 2);
			ctx.stroke();
			ctx.setLineDash([]);
			racers.forEach(function (rc, i) {
				var r = state[i];
				var color = col(rc);
				ctx.strokeStyle = color;
				ctx.lineWidth = 2;
				ctx.lineJoin = "round";
				ctx.beginPath();
				r.path.forEach(function (p, idx) {
					var q = px(p[0], p[1]);
					if (idx) ctx.lineTo(q[0], q[1]);
					else ctx.moveTo(q[0], q[1]);
				});
				ctx.stroke();
				var head = px(r.x, r.y);
				if (head[0] > -20 && head[0] < w + 20 && head[1] > -20 && head[1] < h + 20) {
					ctx.fillStyle = color;
					ctx.beginPath();
					ctx.arc(head[0], head[1], 5.5, 0, Math.PI * 2);
					ctx.fill();
					ctx.strokeStyle = c.card || "#ffffff";
					ctx.lineWidth = 1.5;
					ctx.stroke();
				}
			});
		}

		function renderBoard() {
			if (!board) return;
			var S = surfaces[current];
			var order = state.map(function (r, i) {
				return { r: r, rc: racers[i] };
			}).sort(function (a, b) {
				var da = a.r.done === null ? Infinity : a.r.done;
				var db = b.r.done === null ? Infinity : b.r.done;
				if (da !== db) return da - db;
				if (a.r.dead !== b.r.dead) return a.r.dead ? 1 : -1;
				return a.r.losses[a.r.losses.length - 1] - b.r.losses[b.r.losses.length - 1];
			});
			board.innerHTML = order.map(function (o) {
				var L = o.r.losses[o.r.losses.length - 1] - S.fmin;
				var status = o.r.dead ? "diverged" : o.r.done !== null ? "goal in " + o.r.done : "loss " + fmt(L);
				return '<div class="or-row"><span class="or-dot" style="background:' + col(o.rc) + '"></span><b>' +
					escapeHtml(o.rc.name) + '</b><span class="or-st">' + status + "</span></div>";
			}).join("");
			if (leaderEl) leaderEl.textContent = order[0] ? order[0].rc.name : "—";
			if (lossEl) lossEl.textContent = order[0] ? fmt(order[0].r.losses[order[0].r.losses.length - 1] - S.fmin) : "—";
			if (stepEl) stepEl.textContent = step + " / " + MAX;
			if (noteEl) {
				var anyDead = state.some(function (r) { return r.dead; });
				if (step === 0) noteEl.textContent = "Press Race, or click the map to start all three from that point.";
				else if (anyDead) noteEl.textContent = "Someone left the map. A learning rate that suits SGD can be too large for momentum or Adam.";
				else if (order[0].r.done !== null) noteEl.textContent = order[0].rc.name + " reached the minimum first, in " + order[0].r.done + " steps. Try another surface: the ranking changes.";
				else noteEl.textContent = "Racing: " + order[0].rc.name + " currently has the lowest loss.";
			}
		}

		function reset(pt) {
			pause();
			var S = surfaces[current];
			var s = pt || S.start;
			startPt = s.slice();
			step = 0;
			state = racers.map(function (r) {
				return {
					id: r.id, x: s[0], y: s[1], vx: 0, vy: 0, m: [0, 0], v: [0, 0],
					path: [[s[0], s[1]]], losses: [S.f(s[0], s[1])], done: null, dead: false
				};
			});
			api.redraw();
			renderBoard();
		}

		function advance(n) {
			var S = surfaces[current];
			var mul = lrMul();
			var span = Math.max(S.box[1] - S.box[0], S.box[3] - S.box[2]);
			for (var k = 0; k < n && step < MAX; k++) {
				step++;
				state.forEach(function (r) {
					if (r.dead || r.done !== null) return;
					var g = S.g(r.x, r.y);
					var lr = S.lr[r.id] * mul;
					if (r.id === "sgd") {
						r.x -= lr * g[0];
						r.y -= lr * g[1];
					} else if (r.id === "mom") {
						r.vx = 0.9 * r.vx + g[0];
						r.vy = 0.9 * r.vy + g[1];
						r.x -= lr * r.vx;
						r.y -= lr * r.vy;
					} else {
						var b1 = 0.9, b2 = 0.999, t = step;
						r.m[0] = b1 * r.m[0] + (1 - b1) * g[0];
						r.m[1] = b1 * r.m[1] + (1 - b1) * g[1];
						r.v[0] = b2 * r.v[0] + (1 - b2) * g[0] * g[0];
						r.v[1] = b2 * r.v[1] + (1 - b2) * g[1] * g[1];
						var mh0 = r.m[0] / (1 - Math.pow(b1, t));
						var mh1 = r.m[1] / (1 - Math.pow(b1, t));
						var vh0 = r.v[0] / (1 - Math.pow(b2, t));
						var vh1 = r.v[1] / (1 - Math.pow(b2, t));
						r.x -= lr * mh0 / (Math.sqrt(vh0) + 1e-8);
						r.y -= lr * mh1 / (Math.sqrt(vh1) + 1e-8);
					}
					var L = S.f(r.x, r.y);
					if (!isFinite(L) || Math.abs(r.x) > span * 4 || Math.abs(r.y) > span * 4) {
						r.dead = true;
						return;
					}
					r.path.push([r.x, r.y]);
					if (r.path.length > 500) r.path.shift();
					r.losses.push(L);
					var near = S.min.some(function (m) {
						return Math.hypot(r.x - m[0], r.y - m[1]) < 0.05 * span / 6;
					});
					if (near && L - S.fmin < 1e-3) r.done = step;
				});
			}
			renderBoard();
		}

		function updatePlay() {
			if (playBtn) playBtn.textContent = running ? "Pause" : "Race";
		}
		function pause() {
			running = false;
			cancelAnimationFrame(raf);
			updatePlay();
		}
		function play() {
			if (running) return;
			if (step >= MAX || state.every(function (r) { return r.done !== null || r.dead; })) reset(startPt);
			running = true;
			updatePlay();
			function loop() {
				if (!running) return;
				advance(4);
				api.redraw();
				if (step >= MAX || state.every(function (r) { return r.done !== null || r.dead; })) {
					pause();
					api.redraw();
					return;
				}
				raf = requestAnimationFrame(loop);
			}
			raf = requestAnimationFrame(loop);
		}

		$$("[data-opt-surface]", root).forEach(function (btn) {
			btn.addEventListener("click", function () {
				current = btn.getAttribute("data-opt-surface");
				$$("[data-opt-surface]", root).forEach(function (b) {
					b.classList.toggle("is-on", b === btn);
				});
				bg = null;
				reset();
			});
		});
		if (playBtn) playBtn.addEventListener("click", function () {
			if (running) pause();
			else play();
		});
		if (stepBtn) stepBtn.addEventListener("click", function () {
			pause();
			advance(1);
			api.redraw();
		});
		if (resetBtn) resetBtn.addEventListener("click", function () { reset(); });
		if (lrInput) lrInput.addEventListener("input", function () {
			if (lrOut) lrOut.textContent = "×" + lrMul().toFixed(2);
			reset();
		});
		canvas.addEventListener("click", function (e) {
			var rect = canvas.getBoundingClientRect();
			if (!rect.width) return;
			var S = surfaces[current];
			var x = S.box[0] + (e.clientX - rect.left) / rect.width * (S.box[1] - S.box[0]);
			var y = S.box[3] - (e.clientY - rect.top) / rect.height * (S.box[3] - S.box[2]);
			reset([x, y]);
			play();
		});
		if (lrOut) lrOut.textContent = "×" + lrMul().toFixed(2);
		reset();
	}

	/* ── boot ───────────────────────────────────────────────── */

	function bootRoot(root) {
		var type = root.getAttribute("data-demo");
		if (type === "sampling") initSampling(root);
		else if (type === "decoding") initDecoding(root);
		else if (type === "linefit") initLineFit(root);
		else if (type === "polyfit") initPolyFit(root);
		else if (type === "activation") initActivation(root);
		else if (type === "datamix") initDataMix(root);
		else if (type === "convolution") initConvolution(root);
		else if (type === "pooling") initPooling(root);
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
		else if (type === "filter") initFilter(root);
		else if (type === "residual") initResidual(root);
		else if (type === "science") initScience(root);
		else if (type === "predict") initPredict(root);
		else if (type === "perceptron") initPerceptron(root);
		else if (type === "gradient") initGradient(root);
		else if (type === "verify") initVerify(root);
		else if (type === "ambiguity") initAmbiguity(root);
		else if (type === "negation") initNegation(root);
		else if (type === "numtokens") initNumTokens(root);
		else if (type === "receptive") initReceptive(root);
		else if (type === "citecheck") initCitecheck(root);
		else if (type === "reasoning") initReasoning(root);
		else if (type === "surprise") initLossSurprise(root);
		else if (type === "refusal") initRefusal(root);
		else if (type === "compression") initCompression(root);
		else if (type === "moe") initMoeGalaxy(root);
		else if (type === "prompt") initPrompt(root);
		else if (type === "trajectory") initTrajectory(root);
		else if (type === "folds") initFolds(root);
		else if (type === "headbudget") initHeadBudget(root);
		else if (type === "optimizer") initOptimizer(root);
		root.setAttribute("data-demo-ready", "1");
	}

	function boot() {
		$$("[data-demo]").forEach(bootRoot);
	}

	function restart(root) {
		if (window.TM && TM.lang) {
			DEMO_LANG = TM.lang();
			DEMO_DE = DEMO_LANG === "de";
		}
		cleanupRoot(root);
		if (typeof root.__tmPristineHTML === "string") root.innerHTML = root.__tmPristineHTML;
		root.removeAttribute("data-demo-ready");
		bootRoot(root);
	}

	window.addEventListener("tm:lang", function () {
		capturePristine();
		$$("[data-demo]").forEach(function (root) {
			if (root.getAttribute("data-demo-ready") !== "1") return;
			restart(root);
		});
	});

	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
	else boot();
})();
