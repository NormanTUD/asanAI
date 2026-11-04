/* TEN MINUTES — Power / Gender embedding plot, ported from the full intuition lesson. */
(function () {
	"use strict";

	var LANG = TM.lang();
	var DE = LANG === "de";
	var LABELS = {
		Man: "Mann", Woman: "Frau", Male: "männlich", Female: "weiblich",
		Prince: "Prinz", Princess: "Prinzessin", King: "König", Queen: "Königin", Power: "Macht"
	};
	function labelFor(word) {
		return DE ? (LABELS[word] || word) : word;
	}
	function displayExpr(expr) {
		var out = DE ? expr.replace(/[A-Za-z]+/g, function (word) {
			return labelFor(word);
		}).replace(/ - /g, " − ") : expr;
		return out.replace(/\*/g, "·");
	}
	var canvas = document.getElementById("emb-plot-canvas");
	if (!canvas) return;

	var space = {
		vocab: {
			Man: [5, -10], Woman: [5, 10], Male: [0, -20], Female: [0, 20],
			Prince: [15, -10], Princess: [15, 10], King: [25, -10], Queen: [25, 10],
			Power: [10, 0]
		},
		rangeX: [-5, 40],
		rangeY: [-30, 30]
	};
	var current = { mode: "expr", expr: "King - Man + Woman" };
	var result = null;

	function tokenize(expr) {
		return expr.match(/[a-zA-Z]+|\d+|[+\-*/()]/g) || [];
	}
	function wordFor(t) {
		var lc = t.toLowerCase();
		return Object.keys(space.vocab).find(function (w) { return w.toLowerCase() === lc; }) || null;
	}
	function termsFor(expr) {
		var terms = [];
		var sign = 1, scale = 1;
		tokenize(expr).forEach(function (t) {
			if (t === "+") { sign = 1; return; }
			if (t === "-") { sign = -1; return; }
			if (t === "*" || t === "/" || t === "(" || t === ")") return;
			if (/^\d+$/.test(t)) { scale = parseInt(t, 10); return; }
			var word = wordFor(t);
			if (!word) return;
			terms.push({ word: word, sign: sign, scale: scale });
			sign = 1;
			scale = 1;
		});
		return terms;
	}
	function nearest(pos) {
		var best = null, bd = Infinity;
		Object.keys(space.vocab).forEach(function (w) {
			var v = space.vocab[w];
			var d = Math.hypot(pos[0] - v[0], pos[1] - v[1]);
			if (d < bd) { bd = d; best = w; }
		});
		return { word: best, dist: bd };
	}
	function analyze(expr) {
		var terms = termsFor(expr);
		var pos = null;
		var steps = [];
		terms.forEach(function (term) {
			var v = space.vocab[term.word];
			var delta = [v[0] * term.scale * term.sign, v[1] * term.scale * term.sign];
			if (!pos) {
				pos = [delta[0], delta[1]];
			} else {
				var next = [pos[0] + delta[0], pos[1] + delta[1]];
				steps.push({ from: pos.slice(), to: next });
				pos = next;
			}
		});
		if (!pos) return null;
		var near = nearest(pos);
		return { terms: terms, pos: pos, steps: steps, nearest: near.word, dist: near.dist };
	}
	function pmat(v) {
		return "\\begin{pmatrix}" + v[0] + "\\\\" + v[1] + "\\end{pmatrix}";
	}
	function vtext(w) {
		return "\\vec{\\text{" + labelFor(w) + "}}";
	}
	function termVector(term, first) {
		var sign = first ? (term.sign < 0 ? "-" : "") : (term.sign < 0 ? " - " : " + ");
		var v = space.vocab[term.word];
		var scaled = [v[0] * term.scale, v[1] * term.scale];
		return sign + pmat(scaled);
	}
	function equationLatex(expr, target) {
		var terms = termsFor(expr);
		var info = analyze(expr);
		if (!terms.length || !info) return "";
		var lhs = terms.map(function (t, i) { return termVector(t, i === 0); }).join("");
		return "\\begin{aligned}" + lhs + " &= " + pmat(info.pos) + " \\\\ &= " + vtext(target) + "\\end{aligned}";
	}
	function directionsLatex() {
		return "\\begin{gathered}\\text{" + (DE ? "Geschlecht" : "Gender") + ": } " + vtext("Woman") + " - " + vtext("Man") + " = " + pmat([0, 20]) +
			"\\\\ \\text{" + (DE ? "Macht" : "Power") + ": } " + vtext("Prince") + " - " + vtext("Man") + " = " + pmat([10, 0]) + "\\end{gathered}";
	}
	function setEquation(tex) {
		var el = document.getElementById("emb-plot-equation");
		if (!el) return;
		el.setAttribute("data-tex", tex);
		el.removeAttribute("data-tex-rendered");
		if (window.TM && TM.typesetMath) TM.typesetMath();
	}
	function setReadout(expr, info, directions) {
		var exprEl = document.getElementById("emb-plot-expr");
		var nearEl = document.getElementById("emb-plot-nearest");
		var distEl = document.getElementById("emb-plot-dist");
		if (exprEl) exprEl.textContent = expr;
		if (nearEl) nearEl.textContent = directions ? (DE ? "mehrere" : "multiple") : (info ? labelFor(info.nearest) : "...");
		if (distEl) distEl.textContent = directions ? "—" : (info ? info.dist.toFixed(1) : "...");
	}

	function palette() {
		var c = TM.colors();
		return {
			blue: c.blue, green: c.green, gold: c.gold, coral: c.coral,
			sky: c.sky, lime: c.lime, petrol: c.petrol, muted: c.muted,
			ink: c.ink, inkSoft: c.inkSoft, line: c.line, card: c.card, paper: c.paper2
		};
	}

	function drawArrow(ctx, x1, y1, x2, y2, color, label) {
		ctx.save();
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
		var ang = Math.atan2(y2 - y1, x2 - x1);
		ctx.beginPath();
		ctx.moveTo(x2, y2);
		ctx.lineTo(x2 - 8 * Math.cos(ang - 0.4), y2 - 8 * Math.sin(ang - 0.4));
		ctx.lineTo(x2 - 8 * Math.cos(ang + 0.4), y2 - 8 * Math.sin(ang + 0.4));
		ctx.closePath();
		ctx.fill();
		if (label) {
			ctx.font = "600 10px Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
			var tw = ctx.measureText(label).width;
			ctx.globalAlpha = 0.92;
			ctx.fillStyle = palette().card;
			ctx.fillRect(mx - tw / 2 - 4, my - 8, tw + 8, 16);
			ctx.globalAlpha = 1;
			ctx.fillStyle = color;
			ctx.fillText(label, mx, my);
		}
		ctx.restore();
	}

	function draw(ctx, W, H) {
		var c = palette();
		var padL = 48, padR = 18, padT = 20, padB = 32;
		var x0 = padL, x1 = W - padR, y0 = H - padB, y1 = padT;
		function mx(x) { return x0 + (x - space.rangeX[0]) / (space.rangeX[1] - space.rangeX[0]) * (x1 - x0); }
		function my(y) { return y0 - (y - space.rangeY[0]) / (space.rangeY[1] - space.rangeY[0]) * (y0 - y1); }
		ctx.clearRect(0, 0, W, H);
		ctx.strokeStyle = c.line;
		ctx.lineWidth = 1;
		[0, 10, 20, 30, 40].forEach(function (v) {
			ctx.beginPath(); ctx.moveTo(mx(v), y0); ctx.lineTo(mx(v), y1); ctx.stroke();
		});
		[-20, -10, 0, 10, 20].forEach(function (v) {
			ctx.beginPath(); ctx.moveTo(x0, my(v)); ctx.lineTo(x1, my(v)); ctx.stroke();
		});
		ctx.strokeStyle = c.inkSoft;
		ctx.lineWidth = 1.2;
		ctx.beginPath();
		ctx.moveTo(x0, my(0)); ctx.lineTo(x1, my(0));
		ctx.moveTo(mx(0), y0); ctx.lineTo(mx(0), y1);
		ctx.stroke();
		ctx.fillStyle = c.muted;
		ctx.font = "600 10px Barlow, system-ui, sans-serif";
		ctx.textAlign = "left";
		ctx.fillText((DE ? "Macht" : "Power") + " →", x1 - 58, y0 + 18);
		ctx.fillText((DE ? "Geschlecht" : "Gender") + " ↑", x0 - 34, y1 + 2);

		var info = current.mode === "expr" ? analyze(current.expr) : null;
		var highlight = info ? new Set(info.terms.map(function (t) { return t.word; }).concat([info.nearest])) : new Set();
		var paletteColors = [c.blue, c.green, c.gold, c.coral, c.sky, c.lime, c.petrol, c.muted];
		Object.keys(space.vocab).forEach(function (w, idx) {
			if (w === "Power") return;
			var v = space.vocab[w];
			var isHi = highlight.has(w);
			var color = isHi ? paletteColors[idx % paletteColors.length] : c.muted;
			var px = mx(v[0]), py = my(v[1]);
			ctx.beginPath();
			ctx.arc(px, py, isHi ? 6 : 3.5, 0, Math.PI * 2);
			ctx.fillStyle = color;
			ctx.globalAlpha = isHi ? 1 : 0.45;
			ctx.fill();
			ctx.globalAlpha = 1;
			ctx.fillStyle = isHi ? color : c.muted;
			ctx.font = (isHi ? "700 " : "600 ") + (isHi ? "12px" : "10px") + " Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(labelFor(w), px, py - (isHi ? 12 : 9));
		});

		if (current.mode === "directions") {
			drawArrow(ctx, mx(5), my(-10), mx(5), my(10), c.green, DE ? "Geschlecht" : "gender");
			drawArrow(ctx, mx(25), my(-10), mx(25), my(10), c.green, null);
			drawArrow(ctx, mx(5), my(-10), mx(15), my(-10), c.gold, DE ? "Macht" : "power");
			drawArrow(ctx, mx(15), my(-10), mx(25), my(-10), c.gold, null);
			drawArrow(ctx, mx(5), my(10), mx(15), my(10), c.gold, null);
			drawArrow(ctx, mx(15), my(10), mx(25), my(10), c.gold, null);
		} else if (info) {
			info.steps.forEach(function (step) {
				drawArrow(ctx, mx(step.from[0]), my(step.from[1]), mx(step.to[0]), my(step.to[1]), c.blue, null);
			});
			var rx = mx(info.pos[0]), ry = my(info.pos[1]);
			ctx.beginPath();
			ctx.arc(rx, ry, 9, 0, Math.PI * 2);
			ctx.fillStyle = c.coral;
			ctx.fill();
			ctx.strokeStyle = c.card;
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.fillStyle = c.ink;
			ctx.font = "700 11px Barlow, system-ui, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(DE ? "Ergebnis" : "result", rx + 12, ry + 3);
		}
	}

	var api = TM.initCanvas(canvas, draw);
	if (!api) return;

	function update() {
		if (current.mode === "directions") {
			result = null;
			setReadout(DE ? "Richtungen" : "Directions", null, true);
			setEquation(directionsLatex());
		} else if (current.mode === "none") {
			result = null;
			setReadout(DE ? "Wähle ein Beispiel" : "Choose an example", null, false);
			setEquation("");
		} else {
			var info = analyze(current.expr);
			result = info;
			setReadout(displayExpr(current.expr), info, false);
			setEquation(equationLatex(current.expr, info ? info.nearest : ""));
		}
		api.redraw();
	}

	document.querySelectorAll("[data-emb-ex]").forEach(function (btn) {
		btn.addEventListener("click", function () {
			if (btn.classList.contains("is-on")) {
				btn.classList.remove("is-on");
				current = { mode: "none" };
				update();
				return;
			}
			document.querySelectorAll("[data-emb-ex]").forEach(function (b) { b.classList.remove("is-on"); });
			btn.classList.add("is-on");
			var ex = btn.getAttribute("data-emb-ex");
			if (ex === "directions") current = { mode: "directions" };
			else current = { mode: "expr", expr: ex };
			update();
		});
	});
	window.addEventListener("tm:theme", update);
	update();
})();
