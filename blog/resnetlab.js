// Gradient Highway: backpropagate a gradient of 1 from the output through
// L layers. A plain layer multiplies the gradient by its local derivative
// a_l; a residual block multiplies it by (1 + b_l), where b_l is the
// (zero-mean, small) derivative of the residual branch F. Toy scalar model
// of the chain rule shown above.

const ResNetLab = {
	depth: 20,
	gain: 0.8,
	seed: 7,

	init: function () {
		this.root = document.getElementById("gradient-highway");
		if (!this.root) return false;
		this.el = {};
		this.root.querySelectorAll("[data-gh]").forEach((n) => { this.el[n.dataset.gh] = n; });
		this.el.depth.addEventListener("input", () => this.update());
		this.el.gain.addEventListener("input", () => this.update());
		this.el.reseed.addEventListener("click", () => { this.seed = (this.seed * 7919 + 13) % 100003; this.update(); });
		const plot = this.el.plot;
		if (window.ResizeObserver) {
			let raf = 0;
			new ResizeObserver(() => {
				cancelAnimationFrame(raf);
				raf = requestAnimationFrame(() => { if (plot.offsetParent !== null && plot.clientWidth !== this._w) this.update(); });
			}).observe(plot);
		}
		if (window.__MN_DARK && window.__MN_DARK.onChange) window.__MN_DARK.onChange(() => this.update());
		this.update();
		return true;
	},

	rng: function (seed) {
		let a = seed >>> 0;
		return function () {
			a = (a + 0x6D2B79F5) >>> 0;
			let t = a;
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	},

	simulate: function (L, gain) {
		const r = this.rng(this.seed);
		const plain = new Array(L + 1), res = new Array(L + 1);
		// index l = gradient arriving at the input of layer l (1 … L); L+1 = output
		plain[L] = 1; res[L] = 1;
		const facP = [], facR = [];
		for (let l = 0; l < L; l++) {
			facP.push(gain * (0.8 + 0.3 * r()));
			facR.push(1 + gain * 0.35 * (2 * r() - 1));
		}
		for (let l = L - 1; l >= 0; l--) {
			plain[l] = plain[l + 1] * facP[l];
			res[l] = res[l + 1] * facR[l];
		}
		return { plain: plain, res: res };
	},

	colors: function () {
		const v = (n, fb) => {
			const c = window.__MN_DARK && window.__MN_DARK.themeVar ? window.__MN_DARK.themeVar(n) : "";
			return c || fb;
		};
		return {
			accent: v("--mn-accent", "#6366f1"),
			good: v("--mn-emerald", "#059669"),
			rose: v("--mn-rose", "#e11d48"),
			coral: v("--mn-coral", "#f97316"),
			text: v("--mn-text-secondary", "#64748b"),
			ink: v("--mn-heading", "#1a140e"),
			grid: v("--mn-border", "#d8cfb6")
		};
	},

	alpha: function (hex, a) {
		const m = (hex || "").trim().match(/^#([0-9a-f]{6})$/i);
		if (!m) return hex;
		const n = parseInt(m[1], 16);
		return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
	},

	fmtG: function (g) {
		if (!isFinite(g)) return "∞";
		if (g === 0) return "0";
		const e = Math.floor(Math.log10(Math.abs(g)));
		if (e >= -2 && e <= 2) return g.toPrecision(3);
		return (g / Math.pow(10, e)).toFixed(2) + "·10<sup>" + (e < 0 ? "−" + (-e) : e) + "</sup>";
	},

	fill: function (input) {
		const min = parseFloat(input.min), max = parseFloat(input.max), v = parseFloat(input.value);
		input.style.setProperty("--fill", ((v - min) / (max - min) * 100) + "%");
	},

	update: function () {
		const L = parseInt(this.el.depth.value, 10);
		const gain = parseFloat(this.el.gain.value);
		this.fill(this.el.depth); this.fill(this.el.gain);
		this.el.depthv.textContent = L + " layers";
		this.el.gainv.textContent = "≈ " + (gain * 0.95).toFixed(2);

		const s = this.simulate(L, gain);
		const C = this.colors();
		const layers = [];
		for (let l = 0; l <= L; l++) layers.push(l === L ? "out" : String(l + 1));
		const xs = layers.map((_, i) => i + 1);
		const clamp = (g) => Math.max(1e-14, Math.min(1e10, g));

		const data = [
			{ x: xs, y: s.plain.map(clamp), mode: "lines+markers", name: "plain network", line: { color: C.rose, width: 3 }, marker: { size: L > 40 ? 0 : 5, color: C.rose },
				hovertemplate: "layer %{x}<br>plain: %{y:.2e}<extra></extra>" },
			{ x: xs, y: s.res.map(clamp), mode: "lines+markers", name: "residual network", line: { color: C.good, width: 3 }, marker: { size: L > 40 ? 0 : 5, color: C.good },
				hovertemplate: "layer %{x}<br>residual: %{y:.2e}<extra></extra>" }
		];
		this._w = this.el.plot.clientWidth;
		const layout = {
			margin: { t: 10, r: 12, b: 42, l: 54 },
			paper_bgcolor: "rgba(0,0,0,0)",
			plot_bgcolor: "rgba(0,0,0,0)",
			font: { color: C.text, size: 11 },
			showlegend: false,
			dragmode: false,
			hovermode: "x",
			xaxis: { range: [0.5, L + 1.5], fixedrange: true, gridcolor: this.alpha(C.grid, 0.5), zeroline: false,
				title: { text: this._w && this._w < 480 ? "layer (input → output)" : "layer  (1 = input → output)  ·  the gradient travels right → left", font: { size: 11 } } },
			yaxis: { type: "log", range: [-12, 6], fixedrange: true, gridcolor: this.alpha(C.grid, 0.5), zeroline: false, exponentformat: "power", dtick: 3,
				title: { text: "gradient size (log)", font: { size: 11 } } },
			shapes: [
				{ type: "rect", xref: "paper", x0: 0, x1: 1, y0: 1e-12, y1: 1e-6, fillcolor: this.alpha(C.rose, 0.08), line: { width: 0 }, layer: "below" },
				{ type: "rect", xref: "paper", x0: 0, x1: 1, y0: 1e3, y1: 1e6, fillcolor: this.alpha(C.coral, 0.08), line: { width: 0 }, layer: "below" }
			],
			annotations: [
				{ xref: "paper", x: 0.99, y: -11.3, yref: "y", text: "dead zone: too small to learn", showarrow: false, xanchor: "right", font: { size: 10, color: C.rose } },
				{ xref: "paper", x: 0.99, y: 5.4, yref: "y", text: "exploding", showarrow: false, xanchor: "right", font: { size: 10, color: C.coral } }
			]
		};
		this._w = this.el.plot.clientWidth;
		if (this._w > 0) layout.width = this._w;
		layout.height = this.el.plot.clientHeight || 320;
		if (window.Plotly) Plotly.react(this.el.plot, data, layout, { displayModeBar: false });

		const gp = s.plain[0], gr = s.res[0];
		this.el.gp.innerHTML = this.fmtG(gp);
		this.el.gr.innerHTML = this.fmtG(gr);
		this.el.ratio.innerHTML = gp > 0 ? this.fmtG(gr / gp) + "×" : "∞";
		this.el.gp.parentNode.dataset.tone = gp < 1e-3 || gp > 1e3 ? "bad" : "good";
		this.el.gr.parentNode.dataset.tone = gr < 1e-3 || gr > 1e3 ? "bad" : "good";

		this.drawNet(s, L);

		const note = this.el.note;
		if (gp < 1e-3) {
			note.dataset.tone = "bad";
			note.innerHTML = "<b>Vanishing gradient.</b> In the plain network every layer multiplies the signal by ≈ " + (gain * 0.95).toFixed(2) + ". After " + L + " layers only " + this.fmtG(gp) + " of it reaches the first layer, so its weights barely move" + (gp < 1e-6 ? " — they have effectively stopped learning" : "") + ". The residual network passes the same error through <b>1 + ∂F/∂x</b> per block, and keeps a gradient of " + this.fmtG(gr) + ".";
		} else if (gp > 1e3) {
			note.dataset.tone = "warn";
			note.innerHTML = "<b>Exploding gradient.</b> With a local derivative above 1, the plain network's gradient grows by " + this.fmtG(gp) + " on its way back — training steps become huge and unstable. The residual network's factors (1 + small zero-mean term) neither shrink nor grow systematically.";
		} else {
			note.dataset.tone = "good";
			note.innerHTML = "At this depth both networks still deliver a usable gradient (plain " + this.fmtG(gp) + ", residual " + this.fmtG(gr) + "). Make the network deeper or move the layer factor away from 1 and watch the plain curve fall off a cliff.";
		}
	},

	drawNet: function (s, L) {
		const narrow = this.el.net.clientWidth > 0 && this.el.net.clientWidth < 480;
		const n = Math.min(L, narrow ? 6 : 12);
		const W = narrow ? 340 : 640, H = 170, x0 = 78, x1 = W - 30;
		const step = n > 1 ? (x1 - x0) / n : 0;
		// sample n+1 evenly spaced layers (incl. output) for display
		const idx = [];
		for (let i = 0; i <= n; i++) idx.push(Math.round(i * L / n));
		const heat = (g) => {
			const lg = Math.log10(Math.max(1e-14, g));
			return Math.max(0.07, Math.min(1, 1 + lg / 5));
		};
		const row = (y, arr, cls, skip) => {
			let out = "";
			for (let i = 0; i < n; i++) {
				const xa = x0 + i * step, xb = xa + step;
				out += '<line class="gh-edge" x1="' + xa + '" y1="' + y + '" x2="' + xb + '" y2="' + y + '" />';
				if (skip) {
					out += '<path class="gh-skip" d="M ' + xa + ' ' + (y - 9) + ' Q ' + (xa + xb) / 2 + ' ' + (y - 34) + ' ' + xb + ' ' + (y - 9) + '" />';
				}
			}
			for (let i = 0; i <= n; i++) {
				const x = x0 + i * step, g = arr[idx[i]];
				out += '<circle class="gh-node ' + cls + '" cx="' + x + '" cy="' + y + '" r="' + (i === n ? 9 : 7.5) + '" style="opacity:' + heat(g).toFixed(3) + '"><title>layer ' + (i === n ? "output" : idx[i] + 1) + ": gradient " + g.toExponential(2) + "</title></circle>";
				if (skip && i > 0 && i < n) out += '<text class="gh-plus" x="' + x + '" y="' + (y + 3.5) + '">+</text>';
			}
			return out;
		};
		let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Plain and residual network, nodes shaded by gradient size">';
		svg += '<text class="gh-lbl" x="4" y="50">plain</text>';
		svg += row(54, s.plain, "is-plain", false);
		svg += '<text class="gh-lbl" x="4" y="136">residual</text>';
		svg += row(140, s.res, "is-res", true);
		svg += '<text class="gh-cap" x="' + x0 + '" y="' + (H - 2) + '">input</text>';
		svg += '<text class="gh-cap" x="' + x1 + '" y="' + (H - 2) + '" text-anchor="end">output · loss</text>';
		svg += '<text class="gh-cap" x="' + (W / 2) + '" y="16" text-anchor="middle">← error signal flows backward' + (L > n ? " (showing " + (n + 1) + " of " + (L + 1) + " layers)" : "") + '</text>';
		svg += "</svg>";
		this.el.net.innerHTML = svg;
	}
};

async function loadResnetModule() {
	updateLoadingStatus("Loading section about ResNet...");
	const el = document.getElementById("gradient-highway");
	if (!el) return;
	if (window.IntersectionObserver) {
		const io = new IntersectionObserver((entries) => {
			if (entries.some((e) => e.isIntersecting)) {
				io.disconnect();
				ResNetLab.init();
			}
		}, { rootMargin: "800px" });
		io.observe(el);
	} else {
		ResNetLab.init();
	}
}
