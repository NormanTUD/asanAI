// Slope Explorer: finite-difference slope vs. the true derivative, and
// gradient descent that walks downhill using that measured slope.

const SlopeLab = {
	landscapes: {
		valley: {
			label: "x²",
			f: (x) => x * x,
			df: (x) => 2 * x,
			y: [-1.2, 13],
			start: 2.6
		},
		waves: {
			label: "cos x",
			f: (x) => Math.cos(x),
			df: (x) => -Math.sin(x),
			y: [-1.6, 1.9],
			start: 0.6
		},
		hills: {
			label: "¼x⁴ − x² + 0.35x",
			f: (x) => 0.25 * Math.pow(x, 4) - x * x + 0.35 * x,
			df: (x) => Math.pow(x, 3) - 2 * x + 0.35,
			y: [-2.1, 5.2],
			start: 1.9,
			global: -1.4955
		}
	},

	X_MIN: -4,
	X_MAX: 4,

	root: null,
	key: "valley",
	x: 2.6,
	trail: [],
	timer: null,
	status: null,

	init: function () {
		this.root = document.getElementById("slope-lab");
		if (!this.root) return false;
		this.el = {};
		this.root.querySelectorAll("[data-sl]").forEach((n) => { this.el[n.dataset.sl] = n; });

		this.el.x.addEventListener("input", () => {
			this.stop();
			this.x = parseFloat(this.el.x.value);
			this.trail = [];
			this.status = null;
			this.update();
		});
		this.el.h.addEventListener("input", () => this.update());
		this.el.lr.addEventListener("input", () => this.update());
		this.el.step.addEventListener("click", () => { this.stop(); this.step(); });
		this.el.run.addEventListener("click", () => (this.timer ? this.stop() : this.run()));
		this.el.reset.addEventListener("click", () => this.setLandscape(this.key, true));
		this.root.querySelectorAll("[data-land]").forEach((b) => {
			b.addEventListener("click", () => this.setLandscape(b.dataset.land, true));
		});

		this.setLandscape("valley", true);

		const plot = this.el.plot;
		if (plot && plot.on) {
			plot.on("plotly_click", (ev) => {
				if (!ev || !ev.points || !ev.points.length) return;
				this.stop();
				this.x = this.clampX(ev.points[0].x);
				this.trail = [];
				this.status = null;
				this.update();
			});
		}

		if (window.__MN_DARK && window.__MN_DARK.onChange) {
			window.__MN_DARK.onChange(() => this.update());
		}
		if (window.ResizeObserver && window.Plotly) {
			let raf = 0;
			new ResizeObserver(() => {
				cancelAnimationFrame(raf);
				raf = requestAnimationFrame(() => {
					if (plot.offsetParent !== null && plot.clientWidth !== this._w) this.update();
				});
			}).observe(plot);
		}
		return true;
	},

	clampX: function (x) { return Math.max(this.X_MIN, Math.min(this.X_MAX, x)); },

	h: function () {
		const v = parseFloat(this.el.h.value);
		return Math.pow(10, -4 + 4.3 * v / 100);
	},

	lr: function () { return parseFloat(this.el.lr.value); },

	setLandscape: function (key, resetX) {
		this.stop();
		this.key = key;
		this.root.querySelectorAll("[data-land]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.land === key)));
		if (resetX) this.x = this.landscapes[key].start;
		this.trail = [];
		this.status = null;
		this.update();
	},

	slopeAt: function (x) {
		const L = this.landscapes[this.key];
		const h = this.h();
		return (L.f(x + h) - L.f(x)) / h;
	},

	step: function () {
		const L = this.landscapes[this.key];
		const g = this.slopeAt(this.x);
		const next = this.x - this.lr() * g;
		this.trail.push(this.x);
		if (this.trail.length > 60) this.trail.shift();
		if (!isFinite(next) || next < this.X_MIN - 0.01 || next > this.X_MAX + 0.01) {
			this.x = this.clampX(isFinite(next) ? next : this.x);
			this.status = "diverged";
			this.stop();
		} else {
			this.x = next;
			const moved = Math.abs(this.lr() * g);
			if (moved < 1e-4) {
				this.status = "converged";
				this.stop();
			} else if (this.trail.length >= 3) {
				const a = this.trail[this.trail.length - 2], b = this.trail[this.trail.length - 1];
				this.status = Math.sign(b - a) !== Math.sign(this.x - b) && Math.abs(this.x - b) > 1e-3 ? "zigzag" : "moving";
			} else {
				this.status = "moving";
			}
			if (L.f(this.x) > 1e6) { this.status = "diverged"; this.stop(); }
		}
		this.update();
	},

	run: function () {
		if (this.status === "converged" || this.status === "diverged") this.trail = [];
		this.status = "moving";
		this.el.run.innerHTML = "❚❚ Pause";
		this.el.run.setAttribute("aria-pressed", "true");
		let n = 0;
		this.timer = setInterval(() => {
			this.step();
			if (++n > 120) this.stop();
		}, 380);
	},

	stop: function () {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
		if (this.el && this.el.run) {
			this.el.run.innerHTML = "▶ Run descent";
			this.el.run.setAttribute("aria-pressed", "false");
		}
	},

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
			ink: v("--mn-heading", "#1a140e"),
			grid: v("--mn-border", "#d8cfb6"),
			surface: v("--mn-surface", "#ffffff")
		};
	},

	fmt: function (v, d) {
		if (!isFinite(v)) return "∞";
		const s = v.toFixed(d === undefined ? 3 : d);
		return s === "-0.000" ? "0.000" : s;
	},

	update: function () {
		const L = this.landscapes[this.key];
		const x = this.x, h = this.h(), lr = this.lr();
		const fx = L.f(x), fxh = L.f(x + h);
		const sec = (fxh - fx) / h;
		const tru = L.df(x);
		const err = sec - tru;
		const xNext = x - lr * sec;
		const C = this.colors();

		this.el.x.value = x;
		this.fill(this.el.x); this.fill(this.el.h); this.fill(this.el.lr);
		this.el.xv.textContent = "x = " + x.toFixed(2);
		this.el.hv.textContent = "h = " + (h < 0.01 ? h.toExponential(1) : h.toFixed(h < 0.1 ? 3 : 2));
		this.el.lrv.textContent = "η = " + lr.toFixed(2);

		const xs = [], ys = [];
		for (let t = this.X_MIN; t <= this.X_MAX + 1e-9; t += 0.02) { xs.push(t); ys.push(L.f(t)); }
		const yLo = L.y[0];

		const tanX = [x - 1.3, x + 1.3];
		const tanY = tanX.map((t) => fx + tru * (t - x));
		const secX = [x - 0.9, x + h + 0.9];
		const secY = secX.map((t) => fx + sec * (t - x));

		const trailY = this.trail.map((t) => L.f(t));
		const trailOpacity = this.trail.map((_, i) => 0.25 + 0.6 * (i + 1) / Math.max(1, this.trail.length));
		const nextIn = xNext >= this.X_MIN && xNext <= this.X_MAX && isFinite(xNext);

		const data = [
			{ x: [this.X_MIN, this.X_MAX], y: [yLo, yLo], mode: "lines", line: { width: 0 }, hoverinfo: "skip", showlegend: false },
			{ x: xs, y: ys, mode: "lines", fill: "tonexty", fillcolor: this.alpha(C.accent, 0.10),
				line: { color: C.accent, width: 3, shape: "spline" }, name: "f(x)", hovertemplate: "x = %{x:.2f}<br>f(x) = %{y:.3f}<extra>click to move here</extra>" },
			{ x: tanX, y: tanY, mode: "lines", line: { color: C.good, width: 2, dash: "dash" }, name: "true tangent", hoverinfo: "skip" },
			{ x: secX, y: secY, mode: "lines", line: { color: C.coral, width: 2 }, name: "secant (your estimate)", hoverinfo: "skip" },
			{ x: [x, x + h, x + h], y: [fx, fx, fxh], mode: "lines", line: { color: C.coral, width: 1.5, dash: "dot" }, hoverinfo: "skip", showlegend: false },
			{ x: this.trail, y: trailY, mode: "lines+markers", line: { color: C.sky, width: 1.5, dash: "dot" },
				marker: { size: 7, color: C.sky, opacity: trailOpacity }, name: "descent path", hoverinfo: "skip" },
			{ x: nextIn ? [xNext] : [], y: nextIn ? [L.f(xNext)] : [], mode: "markers",
				marker: { size: 13, color: "rgba(0,0,0,0)", line: { color: C.ink, width: 1.5 }, symbol: "circle" }, name: "next step lands here", hoverinfo: "skip" },
			{ x: [x + h], y: [fxh], mode: "markers", marker: { size: 9, color: C.coral, symbol: "diamond", line: { color: C.surface, width: 1.5 } }, name: "look-ahead point", hoverinfo: "skip" },
			{ x: [x], y: [fx], mode: "markers", marker: { size: 16, color: C.accent, line: { color: C.surface, width: 3 } }, name: "you are here", hoverinfo: "skip" }
		];

		const layout = {
			margin: { t: 8, r: 8, b: 36, l: 40 },
			paper_bgcolor: "rgba(0,0,0,0)",
			plot_bgcolor: "rgba(0,0,0,0)",
			font: { color: C.text, size: 11 },
			showlegend: false,
			hovermode: "closest",
			dragmode: false,
			xaxis: { range: [this.X_MIN, this.X_MAX], gridcolor: this.alpha(C.grid, 0.6), zerolinecolor: C.grid, fixedrange: true, title: { text: "x  (a model parameter)", font: { size: 11 } } },
			yaxis: { range: L.y, gridcolor: this.alpha(C.grid, 0.6), zerolinecolor: C.grid, fixedrange: true },
			annotations: [
				{ x: x + h / 2, y: fx, text: "h", showarrow: false, yshift: -11, font: { color: C.coral, size: 12 } },
				{ x: x + h, y: (fx + fxh) / 2, text: "Δy", showarrow: false, xshift: 14, font: { color: C.coral, size: 12 } }
			]
		};
		if (Math.abs(h) < 0.08) layout.annotations = [];

		this._w = this.el.plot.clientWidth;
		if (this._w > 0) layout.width = this._w;
		layout.height = this.el.plot.clientHeight || 380;
		if (window.Plotly) {
			Plotly.react(this.el.plot, data, layout, { displayModeBar: false });
		}

		this.el.fx.textContent = this.fmt(fx);
		this.el.sec.textContent = this.fmt(sec);
		this.el.tru.textContent = this.fmt(tru);
		this.el.err.innerHTML = this.fmt(Math.abs(err), Math.abs(err) < 0.001 ? 5 : 3) + (Math.abs(tru) > 1e-3 ? " <small>(" + Math.min(999, Math.abs(err / tru) * 100).toFixed(Math.abs(err / tru) < 0.01 ? 2 : 0) + "%)</small>" : "");
		this.el.err.parentNode.dataset.tone = Math.abs(err) > 0.25 * Math.max(0.2, Math.abs(tru)) ? "bad" : "good";

		this.renderMath(fx, fxh, h, sec, lr, xNext);
		this.narrate(sec, tru, err, lr, xNext);
	},

	renderMath: function (fx, fxh, h, sec, lr, xNext) {
		const f = (v, d) => this.fmt(v, d).replace("-", "−");
		const hs = h < 0.01 ? h.toExponential(1).replace("e-", "·10<sup>−") + "</sup>" : h.toFixed(3);
		const dd = h < 0.01 ? Math.min(8, Math.ceil(-Math.log10(h)) + 2) : 3;
		const frac = (top, bot) => '<span class="sl-frac"><span>' + top + '</span><span>' + bot + '</span></span>';
		this.el.math.innerHTML =
			'<div class="sl-eq"><span class="sl-lbl">slope ≈</span>' +
			frac("f(x+h) − f(x)", "h") + '<span>=</span>' +
			frac(f(fxh, dd) + " − (" + f(fx, dd) + ")", hs) + '<span>=</span><b class="sl-hi">' + f(sec) + '</b></div>' +
			'<div class="sl-eq"><span class="sl-lbl">x<sub>new</sub> =</span><span>x − η · slope</span><span>=</span>' +
			'<span>' + f(this.x, 2) + ' − ' + lr.toFixed(2) + ' · (' + f(sec, 2) + ')</span><span>=</span><b class="sl-hi">' + f(xNext, 2) + '</b></div>';
	},

	narrate: function (sec, tru, err, lr, xNext) {
		const L = this.landscapes[this.key];
		const note = this.el.note;
		let tone = "accent", html;
		const dir = sec > 0 ? "left (decrease x)" : "right (increase x)";
		if (this.status === "diverged") {
			tone = "bad";
			html = "<b>Diverged!</b> With a learning rate of η = " + lr.toFixed(2) + " each step overshoots the valley by more than it gained, so the ball is flung further out every time and leaves the chart. Lower η and press reset.";
		} else if (Math.abs(sec) < 0.02 && Math.abs(tru) > 0.1) {
			tone = "bad";
			html = "<b>Fooled by a bad measurement.</b> Your estimate says the ground is flat (slope " + sec.toFixed(3) + "), so descent stops — but the true slope here is " + tru.toFixed(2) + ". With h = " + this.h().toFixed(2) + " the look-ahead point lands at almost the same height on the other side of the curve, so the secant comes out flat. Shrink h and descent will start moving again.";
		} else if (this.status === "converged" || Math.abs(sec) < 0.003) {
			if (L.global !== undefined && Math.abs(this.x - L.global) > 0.3 && L.df(this.x) * L.df(this.x) < 1e-3) {
				tone = "warn";
				html = "<b>Stuck in a local valley.</b> The slope here is ≈ 0, so gradient descent stops — yet the valley on the left near x ≈ " + L.global.toFixed(2) + " is " + (L.f(this.x) - L.f(L.global)).toFixed(2) + " lower. The ball can only feel the ground under its feet; it never sees the deeper valley. Click the left valley to drop it there instead.";
			} else if (L.df(this.x) * L.df(this.x) < 1e-3 && L.f(this.x) > L.f(this.x + 0.3) - 1e-9 && L.f(this.x) > L.f(this.x - 0.3) - 1e-9) {
				tone = "warn";
				html = "<b>Flat — but this is a peak, not a valley.</b> The slope is zero on a hilltop too. Nudge x a little and descent will roll off to one side.";
			} else {
				tone = "good";
				html = "<b>Converged.</b> The slope is practically zero: there is no downhill direction left. This is what “training has converged” means.";
			}
		} else if (this.status === "zigzag") {
			tone = "warn";
			html = "<b>Zig-zagging.</b> η = " + lr.toFixed(2) + " is large enough that every step jumps over the bottom to the other wall. It may still settle — or blow up if η grows further.";
		} else if (Math.abs(err) > 0.25 * Math.max(0.2, Math.abs(tru))) {
			tone = "bad";
			html = "<b>Your slope estimate is off.</b> With a look-ahead of h = " + this.h().toFixed(2) + " the orange secant measures the average steepness over a wide stretch, not the steepness at x: " + sec.toFixed(2) + " instead of " + tru.toFixed(2) + ". Shrink h and watch the orange line snap onto the green tangent.";
		} else {
			tone = "good";
			html = "Slope " + (sec > 0 ? "+" : "") + sec.toFixed(2) + " — the ground rises to the " + (sec > 0 ? "right" : "left") + ", so downhill is to the <b>" + dir + "</b>. One step moves the ball by η·|slope| = <b>" + Math.abs(lr * sec).toFixed(3) + "</b> to x = " + xNext.toFixed(2) + " (hollow circle).";
		}
		note.dataset.tone = tone;
		note.innerHTML = html;
	},

	fill: function (input) {
		const min = parseFloat(input.min), max = parseFloat(input.max), v = parseFloat(input.value);
		input.style.setProperty("--fill", ((v - min) / (max - min) * 100) + "%");
	},

	alpha: function (color, a) {
		const c = (color || "").trim();
		let m = c.match(/^#([0-9a-f]{3})$/i);
		if (m) {
			const s = m[1];
			return "rgba(" + parseInt(s[0] + s[0], 16) + "," + parseInt(s[1] + s[1], 16) + "," + parseInt(s[2] + s[2], 16) + "," + a + ")";
		}
		m = c.match(/^#([0-9a-f]{6})$/i);
		if (m) {
			const n = parseInt(m[1], 16);
			return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
		}
		m = c.match(/^rgba?\(([^)]+)\)$/i);
		if (m) {
			const p = m[1].split(",").map((t) => t.trim());
			return "rgba(" + p[0] + "," + p[1] + "," + p[2] + "," + a + ")";
		}
		return c;
	}
};

async function loadDerivativeModule() {
	updateLoadingStatus("Loading section about derivatives...");
	SlopeLab.init();
	return Promise.resolve();
}
