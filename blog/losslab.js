// Loss Lab: (1) squared vs. absolute error on one prediction, with
// gradient steps; (2) softmax + cross-entropy on three classes, trained
// with the gradient ŷ − y from the text.

const LossLabUtil = {
	colors: function () {
		const v = (n, fb) => {
			const c = window.__MN_DARK && window.__MN_DARK.themeVar ? window.__MN_DARK.themeVar(n) : "";
			return c || fb;
		};
		return {
			accent: v("--mn-accent", "#6366f1"),
			sky: v("--mn-sky", "#0ea5e9"),
			good: v("--mn-emerald", "#059669"),
			rose: v("--mn-rose", "#e11d48"),
			coral: v("--mn-coral", "#f97316"),
			text: v("--mn-text-secondary", "#64748b"),
			muted: v("--mn-text-muted", "#8c7e68"),
			ink: v("--mn-heading", "#1a140e"),
			grid: v("--mn-border", "#d8cfb6"),
			surface: v("--mn-surface", "#ffffff")
		};
	},

	alpha: function (color, a) {
		const c = (color || "").trim();
		let m = c.match(/^#([0-9a-f]{6})$/i);
		if (m) {
			const n = parseInt(m[1], 16);
			return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
		}
		m = c.match(/^#([0-9a-f]{3})$/i);
		if (m) {
			const s = m[1];
			return "rgba(" + parseInt(s[0] + s[0], 16) + "," + parseInt(s[1] + s[1], 16) + "," + parseInt(s[2] + s[2], 16) + "," + a + ")";
		}
		m = c.match(/^rgba?\(([^)]+)\)$/i);
		if (m) {
			const p = m[1].split(",").map((t) => t.trim());
			return "rgba(" + p[0] + "," + p[1] + "," + p[2] + "," + a + ")";
		}
		return c;
	},

	fill: function (input) {
		const min = parseFloat(input.min), max = parseFloat(input.max), v = parseFloat(input.value);
		input.style.setProperty("--fill", ((v - min) / (max - min) * 100) + "%");
	},

	plot: function (el, data, layout) {
		if (!window.Plotly || !el) return;
		const w = el.clientWidth;
		if (w > 0) layout.width = w;
		layout.height = el.clientHeight || 320;
		Plotly.react(el, data, layout, { displayModeBar: false });
		el._mnW = w;
	},

	watchSize: function (el, redraw) {
		if (!window.ResizeObserver || !el) return;
		let raf = 0;
		new ResizeObserver(() => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				if (el.offsetParent !== null && el.clientWidth !== el._mnW) redraw();
			});
		}).observe(el);
	},

	baseLayout: function (C) {
		return {
			margin: { t: 8, r: 10, b: 40, l: 46 },
			paper_bgcolor: "rgba(0,0,0,0)",
			plot_bgcolor: "rgba(0,0,0,0)",
			font: { color: C.text, size: 11 },
			showlegend: false,
			hovermode: false,
			dragmode: false
		};
	}
};

const RegressionLossLab = {
	mode: "mse",
	timer: null,

	init: function () {
		this.root = document.getElementById("mse-lab");
		if (!this.root) return false;
		this.el = {};
		this.root.querySelectorAll("[data-ml]").forEach((n) => { this.el[n.dataset.ml] = n; });
		["y", "yh", "lr"].forEach((k) => this.el[k].addEventListener("input", () => { if (k !== "lr") this.stop(); this.update(); }));
		this.root.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
			this.mode = b.dataset.mode;
			this.root.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
			this.update();
		}));
		this.el.step.addEventListener("click", () => { this.stop(); this.step(); });
		this.el.run.addEventListener("click", () => (this.timer ? this.stop() : this.run()));
		this.el.reset.addEventListener("click", () => { this.stop(); this.el.yh.value = 2; this.update(); });
		LossLabUtil.watchSize(this.el.plot, () => this.update());
		this.update();
		return true;
	},

	loss: function (y, yh) { const e = y - yh; return this.mode === "mse" ? e * e : Math.abs(e); },
	grad: function (y, yh) { const e = y - yh; return this.mode === "mse" ? -2 * e : (e === 0 ? 0 : -Math.sign(e)); },

	step: function () {
		const y = parseFloat(this.el.y.value), yh = parseFloat(this.el.yh.value), lr = parseFloat(this.el.lr.value);
		const next = Math.max(0, Math.min(10, yh - lr * this.grad(y, yh)));
		this.el.yh.value = next;
		this.update();
		if (Math.abs(next - yh) < 1e-3) this.stop();
	},

	run: function () {
		this.el.run.textContent = "❚❚ Pause";
		let n = 0;
		this.timer = setInterval(() => { this.step(); if (++n > 60) this.stop(); }, 320);
	},

	stop: function () {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
		if (this.el) this.el.run.textContent = "▶ Train";
	},

	update: function () {
		const C = LossLabUtil.colors();
		const y = parseFloat(this.el.y.value), yh = parseFloat(this.el.yh.value), lr = parseFloat(this.el.lr.value);
		const e = y - yh, L = this.loss(y, yh), g = this.grad(y, yh);
		["y", "yh", "lr"].forEach((k) => LossLabUtil.fill(this.el[k]));
		this.el.yv.textContent = "y = " + y.toFixed(1);
		this.el.yhv.textContent = "ŷ = " + yh.toFixed(2);
		this.el.lrv.textContent = "η = " + lr.toFixed(2);

		const xs = [], mse = [], mae = [];
		for (let t = 0; t <= 10.0001; t += 0.05) { xs.push(t); mse.push((y - t) * (y - t)); mae.push(Math.abs(y - t)); }
		const isMse = this.mode === "mse";
		const worst = Math.max(y, 10 - y);
		const yMax = (isMse ? worst * worst : worst) * 1.12 + 0.5;
		const tan = [yh - 1.2, yh + 1.2];
		const data = [
			{ x: xs, y: isMse ? mae : mse, mode: "lines", line: { color: LossLabUtil.alpha(C.muted, 0.55), width: 1.5, dash: "dot" } },
			{ x: xs, y: isMse ? mse : mae, mode: "lines", fill: "tozeroy", fillcolor: LossLabUtil.alpha(C.accent, 0.10), line: { color: C.accent, width: 3 } },
			{ x: [yh, yh], y: [0, L], mode: "lines", line: { color: C.rose, width: 2, dash: "dot" } },
			{ x: tan, y: tan.map((t) => L + g * (t - yh)), mode: "lines", line: { color: C.good, width: 2, dash: "dash" } },
			{ x: [y], y: [0], mode: "markers", marker: { size: 18, color: C.good, symbol: "star", line: { color: C.surface, width: 1.5 } } },
			{ x: [yh], y: [L], mode: "markers", marker: { size: 15, color: C.rose, line: { color: C.surface, width: 3 } } }
		];
		const layout = LossLabUtil.baseLayout(C);
		layout.xaxis = { range: [-0.2, 10.2], fixedrange: true, gridcolor: LossLabUtil.alpha(C.grid, 0.6), zeroline: false, title: { text: "prediction ŷ", font: { size: 11 } } };
		layout.yaxis = { range: [-yMax * 0.04, yMax], fixedrange: true, gridcolor: LossLabUtil.alpha(C.grid, 0.6), zerolinecolor: C.grid, title: { text: isMse ? "squared error" : "absolute error", font: { size: 11 } } };
		layout.annotations = [
			{ x: y, y: 0, text: "truth", showarrow: false, yshift: 18, font: { color: C.good, size: 11 } },
			{ x: yh, y: L, text: "loss " + L.toFixed(2), showarrow: true, arrowhead: 0, arrowcolor: C.rose, ax: yh > 6 ? -48 : 48, ay: -26, font: { color: C.rose, size: 11 } }
		];
		LossLabUtil.plot(this.el.plot, data, layout);

		this.el.err.textContent = e.toFixed(2);
		this.el.loss.textContent = L.toFixed(2);
		this.el.grad.textContent = (g > 0 ? "+" : "") + g.toFixed(2);
		this.el.next.textContent = (Math.max(0, Math.min(10, yh - lr * g))).toFixed(2);

		const note = this.el.note;
		if (Math.abs(e) < 0.02) {
			note.dataset.tone = "good";
			note.innerHTML = "<b>Bull's-eye.</b> The guess sits on the truth, the loss is zero and so is the slope — there is nothing left to learn from this example.";
		} else if (isMse) {
			note.dataset.tone = Math.abs(e) > 4 ? "warn" : "accent";
			note.innerHTML = "The guess is off by <b>" + Math.abs(e).toFixed(2) + "</b>, and squaring turns that into a loss of <b>" + L.toFixed(2) + "</b>. The slope −2(y − ŷ) = " + g.toFixed(2) + " is proportional to the error: big mistakes give big pushes, and the steps automatically shrink as the guess closes in. " + (Math.abs(e) > 4 ? "Notice how fast the bowl rises — one far-off prediction (an outlier) dominates the whole average." : "");
		} else {
			note.dataset.tone = "warn";
			note.innerHTML = "With the <b>absolute error</b> the slope is always ±1, no matter how close the guess is. Big errors are punished only linearly (robust to outliers), but near the target the steps do not shrink — press <b>Train</b> with a large η and watch the guess hop back and forth across the truth.";
		}
	}
};

const CrossEntropyLab = {
	classes: ["cat", "dog", "bird"],
	emoji: ["🐱", "🐶", "🐦"],
	target: 0,
	timer: null,
	history: [],

	init: function () {
		this.root = document.getElementById("ce-lab");
		if (!this.root) return false;
		this.el = {};
		this.root.querySelectorAll("[data-ce]").forEach((n) => { this.el[n.dataset.ce] = n; });
		["z0", "z1", "z2", "lr"].forEach((k) => this.el[k].addEventListener("input", () => {
			if (k !== "lr") { this.stop(); this.history = []; }
			this.update();
		}));
		this.el.step.addEventListener("click", () => { this.stop(); this.step(); });
		this.el.run.addEventListener("click", () => (this.timer ? this.stop() : this.run()));
		this.el.reset.addEventListener("click", () => this.reset());
		this.root.querySelectorAll("[data-target]").forEach((b) => b.addEventListener("click", () => {
			this.target = parseInt(b.dataset.target, 10);
			this.root.querySelectorAll("[data-target]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
			this.history = [];
			this.update();
		}));
		LossLabUtil.watchSize(this.el.plot, () => this.update());
		this.reset();
		return true;
	},

	reset: function () {
		this.stop();
		this.el.z0.value = -0.5;
		this.el.z1.value = 1.6;
		this.el.z2.value = 0.4;
		this.history = [];
		this.update();
	},

	logits: function () { return [0, 1, 2].map((i) => parseFloat(this.el["z" + i].value)); },

	softmax: function (z) {
		const m = Math.max.apply(null, z);
		const e = z.map((v) => Math.exp(v - m));
		const s = e.reduce((a, b) => a + b, 0);
		return e.map((v) => v / s);
	},

	step: function () {
		const z = this.logits(), p = this.softmax(z), lr = parseFloat(this.el.lr.value);
		this.history.push(-Math.log(p[this.target]));
		if (this.history.length > 40) this.history.shift();
		z.forEach((v, i) => {
			const gi = p[i] - (i === this.target ? 1 : 0);
			this.el["z" + i].value = Math.max(-5, Math.min(5, v - lr * gi));
		});
		this.update();
		if (-Math.log(this.softmax(this.logits())[this.target]) < 0.02) this.stop();
	},

	run: function () {
		this.el.run.textContent = "❚❚ Pause";
		let n = 0;
		this.timer = setInterval(() => { this.step(); if (++n > 80) this.stop(); }, 260);
	},

	stop: function () {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
		if (this.el) this.el.run.textContent = "▶ Train";
	},

	update: function () {
		const C = LossLabUtil.colors();
		const z = this.logits(), p = this.softmax(z), t = this.target;
		const L = -Math.log(p[t]);
		const argmax = p.indexOf(Math.max.apply(null, p));
		["z0", "z1", "z2", "lr"].forEach((k) => LossLabUtil.fill(this.el[k]));
		z.forEach((v, i) => { this.el["zv" + i].textContent = (v >= 0 ? "+" : "") + v.toFixed(2); });
		this.el.lrv.textContent = "η = " + parseFloat(this.el.lr.value).toFixed(1);

		p.forEach((pi, i) => {
			const row = this.el["row" + i];
			row.classList.toggle("is-target", i === t);
			row.querySelector(".ce-p").style.width = (pi * 100) + "%";
			row.querySelector(".ce-pv").textContent = (pi * 100).toFixed(1) + "%";
			row.querySelector(".ce-y").textContent = i === t ? "1" : "0";
			const gi = pi - (i === t ? 1 : 0);
			const gEl = row.querySelector(".ce-g");
			gEl.style.width = (Math.abs(gi) * 50) + "%";
			gEl.style.left = gi < 0 ? (50 - Math.abs(gi) * 50) + "%" : "50%";
			gEl.classList.toggle("is-neg", gi < 0);
			row.querySelector(".ce-gv").textContent = (gi >= 0 ? "+" : "−") + Math.abs(gi).toFixed(2);
		});

		this.el.loss.textContent = L.toFixed(3);
		this.el.bits.innerHTML = (L / Math.LN2).toFixed(2) + " <small>bits</small>";
		this.el.pt.textContent = (p[t] * 100).toFixed(1) + "%";
		this.el.pred.textContent = this.emoji[argmax] + " " + this.classes[argmax];
		this.el.pred.parentNode.dataset.tone = argmax === t ? "good" : "bad";

		const xs = [], ys = [];
		for (let q = 0.004; q <= 1.0001; q += 0.004) { xs.push(q); ys.push(-Math.log(q)); }
		const shown = Math.min(L, 5.4);
		const data = [
			{ x: xs, y: ys, mode: "lines", fill: "tozeroy", fillcolor: LossLabUtil.alpha(C.coral, 0.10), line: { color: C.coral, width: 3 } },
			{ x: [p[t], p[t]], y: [0, shown], mode: "lines", line: { color: C.rose, width: 2, dash: "dot" } },
			{ x: [p[t]], y: [shown], mode: "markers", marker: { size: 15, color: argmax === t ? C.good : C.rose, line: { color: C.surface, width: 3 } } }
		];
		const layout = LossLabUtil.baseLayout(C);
		layout.xaxis = { range: [-0.02, 1.02], fixedrange: true, gridcolor: LossLabUtil.alpha(C.grid, 0.6), zeroline: false, tickformat: ".0%", title: { text: "probability given to the correct class", font: { size: 11 } } };
		layout.yaxis = { range: [0, 5.5], fixedrange: true, gridcolor: LossLabUtil.alpha(C.grid, 0.6), zeroline: false, title: { text: "loss = −ln p", font: { size: 11 } } };
		layout.annotations = [{ x: p[t], y: shown, text: (L > 5.4 ? "↑ " : "") + L.toFixed(2), showarrow: false, xshift: p[t] > 0.8 ? -26 : 26, yshift: 6, font: { color: C.ink, size: 12 } }];
		LossLabUtil.plot(this.el.plot, data, layout);

		const note = this.el.note;
		const name = this.emoji[t] + " " + this.classes[t];
		if (argmax !== t) {
			note.dataset.tone = "bad";
			note.innerHTML = "<b>Wrong answer.</b> The model bets on " + this.emoji[argmax] + " " + this.classes[argmax] + ", giving the true class " + name + " only " + (p[t] * 100).toFixed(1) + "%, so the loss is −ln(" + p[t].toFixed(3) + ") = <b>" + L.toFixed(2) + "</b>. Only the correct class enters the formula — but through softmax, every logit gets a push: the gradient ŷ − y is negative for " + name + " (raise it) and positive for the others (lower them).";
		} else if (p[t] < 0.8) {
			note.dataset.tone = "warn";
			note.innerHTML = "<b>Right, but unsure.</b> " + name + " wins with " + (p[t] * 100).toFixed(1) + "%. Cross-entropy is not satisfied with merely being right: the loss is still " + L.toFixed(2) + ", and the gradient keeps pushing until the model is confident.";
		} else {
			note.dataset.tone = "good";
			note.innerHTML = "<b>Confident and correct.</b> At " + (p[t] * 100).toFixed(1) + "% the curve is almost flat, the loss is " + L.toFixed(3) + " and the gradients have shrunk to " + Math.abs(p[t] - 1).toFixed(3) + " — learning from this example has nearly stopped. That is the error signal ŷ − y at work.";
		}
	}
};

function initLossLab() {
	RegressionLossLab.init();
	CrossEntropyLab.init();
	if (window.__MN_DARK && window.__MN_DARK.onChange) {
		window.__MN_DARK.onChange(() => {
			if (RegressionLossLab.root) RegressionLossLab.update();
			if (CrossEntropyLab.root) CrossEntropyLab.update();
		});
	}
}

async function loadLossModule() {
	updateLoadingStatus("Loading section about losses...");
	initLossLab();
	return Promise.resolve();
}
