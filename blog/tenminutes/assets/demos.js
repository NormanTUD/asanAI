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
			$$(".dist-row", bars).forEach(function (row, i) {
				row.style.cursor = keep[i] ? "pointer" : "default";
				row.title = keep[i] ? "Draw this token" : "Cut by top-p";
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
			sampleBtn.textContent = "Draw a token →";
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
			cell.innerHTML = "<b>Sampled draw</b><span data-sampling-draw>—</span>";
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
		var training = false;
		if (stepBtn) stepBtn.addEventListener("click", function () {
			if (training) return;
			training = true;
			var rounds = 0;
			var tick = function () {
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
				redraw();
				rounds++;
				if (rounds < 9) requestAnimationFrame(tick);
				else training = false;
			};
			requestAnimationFrame(tick);
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
		var scanBtn = $("[data-conv-scan]", root);
		var paintBtn = $("[data-conv-paint]", root);
		var imageBtn = $("[data-conv-image]", root);
		var hintEl = $("[data-conv-hint]", root);
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
		var scanCell = -1;
		var scanTimer = null;
		var lastGeom = null;
		var imageGrid = null;
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
			lastGeom = { pad: pad, gap: gap, cell: cell, ox: ox, oy: oy, ox2: ox + size * cell + gap };
			ctx.fillStyle = c.muted;
			ctx.fillText(imageLoaded ? "input · stop sign" : "input · painted", ox, pad + 4);
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
			if (scanCell >= 0) {
				var ow = size - 2;
				var sy = Math.floor(scanCell / ow), sx = scanCell % ow;
				ctx.strokeStyle = c.gold;
				ctx.lineWidth = 2.6;
				ctx.strokeRect(ox + sx * cell - 1, oy + sy * cell - 1, cell * 3 + 2, cell * 3 + 2);
				ctx.strokeStyle = c.coral;
				ctx.lineWidth = 2.2;
				ctx.strokeRect(ox2 + sx * cell - 1, oy + sy * cell - 1, cell + 2, cell + 2);
				ctx.fillStyle = c.gold;
				ctx.font = "600 10px Barlow, system-ui, sans-serif";
				ctx.fillText("3×3 window", ox + sx * cell, oy + sy * cell - 5);
			}
			if (inputSizeEl) inputSizeEl.textContent = size + " × " + size;
			if (outputSizeEl) outputSizeEl.textContent = (size - 2) + " × " + (size - 2);
		}
		var api = canvasDemo(canvas, draw);
		if (!api) return;
		var img = new Image();
		img.onload = function () {
			var n = 16;
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
			imageGrid = grid.map(function (row) { return row.slice(); });
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
		canvas.addEventListener("click", function (ev) {
			if (!lastGeom) return;
			var rect = canvas.getBoundingClientRect();
			var x = ev.clientX - rect.left;
			var y = ev.clientY - rect.top;
			var g = lastGeom;
			var ix = Math.floor((x - g.ox) / g.cell);
			var iy = Math.floor((y - g.oy) / g.cell);
			if (ix < 0 || iy < 0 || ix >= size || iy >= size) return;
			input[iy][ix] = input[iy][ix] > 0.5 ? 0 : 1;
			imageLoaded = false;
			api.redraw();
			if (hintEl) hintEl.textContent = "You painted cell " + (iy * size + ix + 1) + ". Watch the feature map change.";
		});
		if (scanBtn) scanBtn.addEventListener("click", function () {
			if (scanTimer) {
				clearInterval(scanTimer); scanTimer = null; scanCell = -1;
				scanBtn.textContent = "Scan the kernel ▶";
				api.redraw();
				return;
			}
			scanCell = 0;
			scanBtn.textContent = "Stop scan ■";
			scanTimer = setInterval(function () {
				scanCell = (scanCell + 1) % ((size - 2) * (size - 2));
				api.redraw();
			}, 30);
			api.redraw();
		});
		if (paintBtn) paintBtn.addEventListener("click", function () {
			if (scanTimer) { clearInterval(scanTimer); scanTimer = null; scanBtn.textContent = "Scan the kernel ▶"; }
			scanCell = -1;
			size = 14;
			input = [];
			for (var py = 0; py < size; py++) {
				input.push([]);
				for (var px = 0; px < size; px++) input[py].push(0);
			}
			imageLoaded = false;
			api.redraw();
			if (hintEl) hintEl.textContent = "Blank grid. Click cells to draw a shape, then pick a kernel or scan it.";
		});
		if (imageBtn) imageBtn.addEventListener("click", function () {
			if (!imageGrid) return;
			if (scanTimer) { clearInterval(scanTimer); scanTimer = null; scanBtn.textContent = "Scan the kernel ▶"; }
			scanCell = -1;
			input = imageGrid.map(function (row) { return row.slice(); });
			size = imageGrid.length;
			imageLoaded = true;
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
		var chunks = [
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
			if (noteEl) {
				noteEl.innerHTML = query === "Eiffel opening hours"
					? "<b>Retrieval found the right topic, not the right fact.</b> The top passage is about height; it contains no opening hours. Nearest ≠ answer."
					: "The score measures alignment in the embedding space, not whether the passage answers the question.";
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
		if (trainBtn) trainBtn.addEventListener("click", function () { update(); api.redraw(); });
		if (runBtn) runBtn.addEventListener("click", function () {
			for (var i = 0; i < 20; i++) update();
			api.redraw();
		});
		function reset() {
			build(mode);
			w = [0.25, 0.32];
			b = -0.08;
			cursor = 0;
			steps = 0;
			api.redraw();
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
		api.redraw();
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

	/* ── Chinese room ───────────────────────────────────────── */

	function initChinese(root) {
		var buttons = $$("[data-chinese-mode]", root);
		var caption = $("[data-chinese-caption]", root);
		var understanding = $("[data-chinese-understanding]", root);
		var room = $("[data-chinese-room]", root);
		if (!buttons.length) return;
		var copy = {
			inside: {
				cap: "Inside: a person follows a rule book, matching Chinese symbols to Chinese symbols. The answers are correct, but the person never learns Chinese.",
				val: "none inside",
				note: "The room passes the test. Does that settle whether it understands?"
			},
			whole: {
				cap: "From outside: the room as a whole takes Chinese in and produces Chinese out. Perhaps the system, not the person, is what understands — if anything does.",
				val: "possibly the system",
				note: "Searle's argument is contested: the whole room might be the understanding system. The demo cannot settle it."
			}
		};
		function select(mode) {
			buttons.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-chinese-mode") === mode); });
			var c = copy[mode];
			if (caption) caption.textContent = c.cap;
			if (understanding) understanding.textContent = c.val;
			if (room) room.classList.toggle("is-whole", mode === "whole");
		}
		buttons.forEach(function (b) {
			b.addEventListener("click", function () { select(b.getAttribute("data-chinese-mode")); });
		});
		select("inside");
	}

	/* ── ambiguity ──────────────────────────────────────────── */

	function initAmbiguity(root) {
		var chips = $("[data-ambiguity-chips]", root);
		var sentenceEl = $("[data-ambiguity-sentence]", root);
		var readingsEl = $("[data-ambiguity-readings]", root);
		var noteEl = $("[data-ambiguity-note]", root);
		if (!chips || !sentenceEl || !readingsEl) return;
		var examples = [
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
				label: "Chicken",
				before: "The chicken is ready ",
				amb: "to eat",
				after: ".",
				readings: [
					["Reading A · the chicken eats", "The chicken is hungry and ready for its food."],
					["Reading B · the chicken is eaten", "The chicken is cooked and ready to be served."]
				],
				note: "One adjective, two agents. A language model must choose a plausible world, not just parse a sentence."
			},
			{
				label: "Cooking apples",
				before: "They are ",
				amb: "cooking apples",
				after: ".",
				readings: [
					["Reading A · an action", "They are in the kitchen, cooking some apples."],
					["Reading B · a kind of apple", "They are a variety of apple used for cooking."]
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
			{ title: "Attention Is All You Need", meta: "Vaswani et al. · NeurIPS 2017", real: true, why: "Real. The transformer paper." },
			{ title: "Deep Residual Learning for Image Recognition", meta: "He et al. · CVPR 2016", real: true, why: "Real. The ResNet paper." },
			{ title: "Language Models are Few-Shot Learners", meta: "Brown et al. · NeurIPS 2020", real: true, why: "Real. The GPT-3 paper." },
			{ title: "Recursive Semantic Anchoring in Transformer Pretraining", meta: "Keller & Voss · ICML 2021", real: false, why: "Fabricated. Plausible title, plausible venue, no such paper." },
			{ title: "The 2019 Zurich Study on Latent Memory Consolidation", meta: "M. Roth · Nature Neuroscience 2019", real: false, why: "Fabricated. A generic study-shaped sentence, not a citation." },
			{ title: "Denoising Diffusion Probabilistic Models", meta: "Ho et al. · NeurIPS 2020", real: true, why: "Real. The DDPM paper." }
		];
		var round = [], answered = 0, correct = 0, seed = 3;
		function rnd() { seed += 1; return (Math.sin(seed * 7.31) * 43758.5453) % 1; }
		function pickRound() {
			var copy = pool.slice();
			for (var i = copy.length - 1; i > 0; i--) {
				var j = Math.floor(Math.abs(rnd()) * (i + 1));
				var t = copy[i]; copy[i] = copy[j]; copy[j] = t;
			}
			return copy.slice(0, 4);
		}
		function render() {
			list.innerHTML = round.map(function (r, i) {
				return '<div class="cc-card" data-cc-i="' + i + '">' +
					'<h4>' + escapeHtml(r.title) + '</h4>' +
					'<p>' + escapeHtml(r.meta) + '</p>' +
					'<div class="cc-actions">' +
					'<button class="btn-demo" type="button" data-cc-guess="real">Real</button>' +
					'<button class="btn-demo" type="button" data-cc-guess="fake">Fabricated</button>' +
					'</div><div class="cc-verdict" style="min-height:0" data-cc-feedback></div></div>';
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
						if (fb) fb.innerHTML = "<b>" + (ok ? "Correct." : "Missed.") + "</b> " + escapeHtml(round[i].why);
						$$("[data-cc-guess]", card).forEach(function (b) { b.disabled = true; });
						if (scoreEl) scoreEl.textContent = correct + " / " + round.length;
						if (verdictEl && answered === round.length) {
							verdictEl.innerHTML = correct === round.length
								? "<b>Clean sweep.</b> Plausibility is not provenance. The skill is checking, not guessing."
								: "<b>" + correct + " of " + round.length + ".</b> Fabricated references are built to look exactly like real ones. Verify the DOI, the venue, and the author before you cite.";
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
		var problems = [
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
		function render() {
			var p = problems[current];
			if (questionEl) questionEl.textContent = p.q;
			modeBtns.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-reasoning-mode") === mode); });
			if (mode === "steps") {
				stepsEl.innerHTML = p.steps.map(function (s, i) {
					return '<div class="cot-step is-on" style="transition-delay:' + (i * 55) + 'ms">' + escapeHtml(s) + "</div>";
				}).join("");
				if (answerEl) answerEl.innerHTML = 'Answer: <b>' + p.correct + "</b>";
				if (tokensEl) tokensEl.textContent = p.tokens[1] + " tokens";
				if (confidenceEl) confidenceEl.textContent = "checked";
			} else {
				stepsEl.innerHTML = '<div class="cot-step is-on">The answer feels obvious: ' + escapeHtml(p.quick) + ".</div>";
				if (answerEl) answerEl.innerHTML = 'Answer: <b>' + p.quick + "</b> <span style=\"color:var(--tm-coral)\">· likely wrong</span>";
				if (tokensEl) tokensEl.textContent = p.tokens[0] + " tokens";
				if (confidenceEl) confidenceEl.textContent = "fast, unchecked";
			}
			if (mode === "steps" && answerEl) answerEl.title = "";
			if (mode !== "steps" && answerEl) answerEl.title = p.quickWhy;
			if (votesEl && sampled.length) renderVotes();
			else if (votesEl) votesEl.innerHTML = "Sampling is disabled until you press <b>Sample 5 paths</b>.";
		}
		function renderVotes() {
			var p = problems[current];
			var correctCount = mode === "steps" ? 4 : 1;
			var votes = [];
			for (var i = 0; i < 5; i++) votes.push(i < correctCount ? p.correct : p.quick);
			votesEl.innerHTML = "Five sampled paths → " + votes.map(function (v, i) {
				return '<span style="display:inline-block;margin-right:5px;padding:2px 7px;border:1px solid var(--tm-line);border-radius:999px;font-family:var(--tm-mono);font-size:.62rem;color:' + (v === p.correct ? "var(--tm-green-deep)" : "var(--tm-coral)") + ';animation:pop .3s ease both;animation-delay:' + (i * 80) + 'ms">' + escapeHtml(v) + "</span>";
			}).join("") + "<br><b>" + correctCount + " / 5</b> agree on " + escapeHtml(p.correct) + ". Majority voting helps only when the errors are not all the same.";
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
		if (!chips.length || !candsEl) return;
		var candidates = [
			{ name: "Concise fact", text: "Sunlight scatters off air molecules. Shorter blue wavelengths scatter more, so blue reaches your eyes from every direction.", base: 0.7, role: 0.2, format: 0.8, examples: 0.2, constraints: 0.5 },
			{ name: "Tutor story", text: "Imagine sunlight as a mix of colours. Air molecules bump the blue light around much more than the red, so blue arrives from every patch of sky.", base: 0.8, role: 1.5, format: 0.3, examples: 0.9, constraints: 0.6 },
			{ name: "Three bullets", text: "• Sunlight contains all colours.\n• Air scatters short (blue) waves more.\n• So blue reaches your eyes from everywhere.", base: 0.4, role: 0.5, format: 1.9, examples: 0.4, constraints: 0.4 },
			{ name: "Terse", text: "The sky is blue.", base: 0.6, role: -0.2, format: -0.3, examples: -0.2, constraints: -0.6 },
			{ name: "Ocean myth", text: "The sky is blue because it reflects the ocean.", base: 0.5, role: -0.8, format: -0.6, examples: -0.7, constraints: -2.0 }
		];
		var on = { role: true, format: false, examples: false, constraints: false };
		var phrase = {
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
			var active = Object.keys(on).filter(function (k) { return on[k]; });
			if (preview) {
				preview.innerHTML = (active.length ? active.map(function (k) { return escapeHtml(phrase[k]); }).join(" ") + "<br><br>" : "") + "Question: Why is the sky blue?";
			}
			candsEl.innerHTML = order.map(function (i) {
				var c = candidates[i];
				return '<div class="retrieval-item' + (i === order[0] ? " is-hit" : "") + '" style="animation-delay:' + (order.indexOf(i) * 28) + 'ms">' +
					'<div><b>' + escapeHtml(c.name) + '</b><p>' + escapeHtml(c.text).replace(/\n/g, "<br>") + '</p></div>' +
					'<span class="retrieval-score">' + Math.round(probs[i] * 100) + '%</span></div>';
			}).join("");
			if (tokenEl) tokenEl.textContent = (8 + active.length * 11) + " tokens";
			if (sampledEl && !sampledEl.getAttribute("data-has")) sampledEl.textContent = "Press sample to draw an answer from the current distribution.";
		}
		chips.forEach(function (chip) {
			chip.addEventListener("click", function () {
				var key = chip.getAttribute("data-prompt");
				on[key] = !on[key];
				chip.classList.toggle("is-on", on[key]);
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
			if (sampledEl) {
				sampledEl.setAttribute("data-has", "1");
				sampledEl.innerHTML = "<b>Sampled:</b> " + escapeHtml(candidates[pick].text).replace(/\n/g, "<br>");
			}
		});
		render();
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
			else if (type === "predict") initPredict(root);
			else if (type === "perceptron") initPerceptron(root);
			else if (type === "gradient") initGradient(root);
			else if (type === "verify") initVerify(root);
			else if (type === "chinese") initChinese(root);
			else if (type === "ambiguity") initAmbiguity(root);
			else if (type === "receptive") initReceptive(root);
			else if (type === "citecheck") initCitecheck(root);
			else if (type === "reasoning") initReasoning(root);
			else if (type === "prompt") initPrompt(root);
		});
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
	else boot();
})();
