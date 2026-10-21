// Convolution Studio: paint a small image, slide a 3×3 kernel over it
// (zero padding, stride 1) and see the feature map. Hover an output cell to
// see its receptive field and the multiply-and-add behind it.

const ConvStudio = {
	N: 16,
	kernels: {
		identity: { label: "Identity", k: [0, 0, 0, 0, 1, 0, 0, 0, 0] },
		blur: { label: "Blur", k: [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9] },
		sharpen: { label: "Sharpen", k: [0, -1, 0, -1, 5, -1, 0, -1, 0] },
		sobelx: { label: "Vertical edges", k: [-1, 0, 1, -2, 0, 2, -1, 0, 1] },
		sobely: { label: "Horizontal edges", k: [-1, -2, -1, 0, 0, 0, 1, 2, 1] },
		outline: { label: "Outline", k: [-1, -1, -1, -1, 8, -1, -1, -1, -1] }
	},
	images: {
		seven: ["................", "................", "...##########...", "...##########...", "..........###...", ".........###....", "........###.....", ".......###......", "......###.......", ".....###........", ".....###........", "....###.........", "....###.........", "................", "................", "................"],
		smile: ["................", ".....######.....", "...##......##...", "..#..........#..", ".#..##....##..#.", ".#..##....##..#.", "#..............#", "#..............#", "#..#........#..#", "#...#......#...#", ".#...######...#.", ".#............#.", "..#..........#..", "...##......##...", ".....######.....", "................"],
		square: ["................", "................", "................", "...##########...", "...##########...", "...##########...", "...##########...", "...##########...", "...##########...", "...##########...", "...##########...", "...##########...", "...##########...", "................", "................", "................"]
	},

	kernel: null,
	relu: false,
	brush: 1,
	hover: null,

	init: function () {
		this.root = document.getElementById("conv-studio");
		if (!this.root) return false;
		this.el = {};
		this.root.querySelectorAll("[data-cv]").forEach((n) => { this.el[n.dataset.cv] = n; });
		this.inCtx = this.el.input.getContext("2d");
		this.outCtx = this.el.output.getContext("2d");
		this.img = new Array(this.N * this.N).fill(0);

		// kernel editor
		this.kInputs = [];
		for (let i = 0; i < 9; i++) {
			const inp = document.createElement("input");
			inp.type = "number"; inp.step = "1"; inp.className = "cv-k";
			inp.setAttribute("aria-label", "kernel weight " + (Math.floor(i / 3) + 1) + "," + (i % 3 + 1));
			inp.addEventListener("input", () => { this.readKernel(); this.markPreset(null); this.compute(); });
			this.el.kgrid.appendChild(inp);
			this.kInputs.push(inp);
		}
		this.root.querySelectorAll("[data-kernel]").forEach((b) => b.addEventListener("click", () => this.setKernel(b.dataset.kernel)));
		this.root.querySelectorAll("[data-img]").forEach((b) => b.addEventListener("click", () => this.setImage(b.dataset.img)));
		this.el.relu.addEventListener("click", () => {
			this.relu = !this.relu;
			this.el.relu.setAttribute("aria-pressed", String(this.relu));
			this.compute();
		});
		this.root.querySelectorAll("[data-brush]").forEach((b) => b.addEventListener("click", () => {
			this.brush = parseInt(b.dataset.brush, 10);
			this.root.querySelectorAll("[data-brush]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
		}));
		this.el.scan.addEventListener("click", () => this.scan());

		// painting
		let painting = false;
		const paint = (e) => {
			const c = this.cellAt(this.el.input, e);
			if (!c) return;
			const idx = c[1] * this.N + c[0];
			if (this.img[idx] !== this.brush) { this.img[idx] = this.brush; this.compute(); }
		};
		this.el.input.addEventListener("pointerdown", (e) => { painting = true; this.el.input.setPointerCapture(e.pointerId); paint(e); e.preventDefault(); });
		this.el.input.addEventListener("pointermove", (e) => { if (painting) paint(e); });
		this.el.input.addEventListener("pointerup", () => { painting = false; });
		this.el.input.addEventListener("pointercancel", () => { painting = false; });
		this.el.output.addEventListener("pointermove", (e) => { if (this.scanning) return; this.hover = this.cellAt(this.el.output, e); this.draw(); });
		this.el.output.addEventListener("pointerleave", () => { if (this.scanning) return; this.hover = null; this.draw(); });

		if (window.ResizeObserver) {
			let raf = 0;
			new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => this.resize()); }).observe(this.root);
		}
		if (window.__MN_DARK && window.__MN_DARK.onChange) window.__MN_DARK.onChange(() => this.draw());
		this.setKernel("sobelx");
		this.setImage("seven");
		this.resize();
		return true;
	},

	cellAt: function (canvas, e) {
		const r = canvas.getBoundingClientRect();
		const i = Math.floor((e.clientX - r.left) / r.width * this.N), j = Math.floor((e.clientY - r.top) / r.height * this.N);
		return i >= 0 && j >= 0 && i < this.N && j < this.N ? [i, j] : null;
	},

	setImage: function (key) {
		const rows = this.images[key];
		this.img = new Array(this.N * this.N).fill(0);
		if (rows) rows.forEach((row, j) => row.split("").forEach((ch, i) => { if (ch === "#") this.img[j * this.N + i] = 1; }));
		this.compute();
	},

	setKernel: function (key) {
		const K = this.kernels[key];
		if (!K) return;
		this.kernel = K.k.slice();
		this.kInputs.forEach((inp, i) => { inp.value = this.fmtK(this.kernel[i]); });
		this.markPreset(key);
		this.compute();
	},

	fmtK: function (v) { return Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(3); },

	markPreset: function (key) {
		this.root.querySelectorAll("[data-kernel]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kernel === key)));
		this.preset = key;
	},

	readKernel: function () { this.kernel = this.kInputs.map((inp) => parseFloat(inp.value) || 0); },

	compute: function () {
		const N = this.N, K = this.kernel, out = new Array(N * N);
		for (let j = 0; j < N; j++) {
			for (let i = 0; i < N; i++) {
				let s = 0;
				for (let dj = -1; dj <= 1; dj++) {
					for (let di = -1; di <= 1; di++) {
						const x = i + di, y = j + dj;
						if (x < 0 || y < 0 || x >= N || y >= N) continue;
						s += this.img[y * N + x] * K[(dj + 1) * 3 + (di + 1)];
					}
				}
				out[j * N + i] = this.relu ? Math.max(0, s) : s;
			}
		}
		this.out = out;
		this.draw();
		window.dispatchEvent(new CustomEvent("convstudio:update"));
	},

	resize: function () {
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		[this.el.input, this.el.output].forEach((c) => {
			const w = Math.max(140, c.parentNode.clientWidth);
			c.width = Math.round(w * dpr); c.height = Math.round(w * dpr);
			c.style.height = w + "px";
		});
		this.draw();
	},

	css: function (n, fb) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb; },

	draw: function () {
		if (!this.out) return;
		const N = this.N;
		const dark = document.documentElement.classList.contains("dark");
		const ink = dark ? [241, 245, 249] : [26, 20, 14];
		const paper = this.hexRgb(this.css("--mn-surface", dark ? "#1e293b" : "#fdfaf1"));
		const pos = this.hexRgb(this.css("--mn-sky", "#0ea5e9")), neg = this.hexRgb(this.css("--mn-coral", "#f97316"));
		const grid = this.css("--mn-border", "#888");

		const cell = (ctx, W, i, j, rgb) => {
			const s = W / N;
			ctx.fillStyle = "rgb(" + rgb.map(Math.round).join(",") + ")";
			ctx.fillRect(i * s, j * s, Math.ceil(s), Math.ceil(s));
		};
		// input
		const ci = this.inCtx, Wi = this.el.input.width;
		for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) cell(ci, Wi, i, j, this.img[j * N + i] ? ink : paper);
		this.gridLines(ci, Wi, grid);
		// output
		const co = this.outCtx, Wo = this.el.output.width;
		const maxAbs = Math.max(1, ...this.out.map(Math.abs));
		for (let j = 0; j < N; j++) {
			for (let i = 0; i < N; i++) {
				const v = this.out[j * N + i] / maxAbs, c = v >= 0 ? pos : neg, a = Math.min(1, Math.abs(v));
				cell(co, Wo, i, j, [paper[0] + (c[0] - paper[0]) * a, paper[1] + (c[1] - paper[1]) * a, paper[2] + (c[2] - paper[2]) * a]);
			}
		}
		this.gridLines(co, Wo, grid);

		const h = this.hover;
		if (h) {
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const si = Wi / N, so = Wo / N;
			ci.strokeStyle = this.css("--mn-accent", "#6366f1"); ci.lineWidth = 3 * dpr;
			ci.strokeRect((h[0] - 1) * si, (h[1] - 1) * si, 3 * si, 3 * si);
			co.strokeStyle = this.css("--mn-accent", "#6366f1"); co.lineWidth = 3 * dpr;
			co.strokeRect(h[0] * so, h[1] * so, so, so);
			this.explain(h);
		} else {
			this.el.calc.innerHTML = '<span class="mnlab-hint">Hover over (or tap) the feature map to see how one output value is computed — or press <b>Animate scan</b>.</span>';
		}
		this.el.range.textContent = "range " + Math.min(...this.out).toFixed(1) + " … " + Math.max(...this.out).toFixed(1);
	},

	gridLines: function (ctx, W, color) {
		const s = W / this.N;
		ctx.strokeStyle = color; ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
		ctx.beginPath();
		for (let k = 1; k < this.N; k++) { ctx.moveTo(k * s, 0); ctx.lineTo(k * s, W); ctx.moveTo(0, k * s); ctx.lineTo(W, k * s); }
		ctx.stroke();
		ctx.globalAlpha = 1;
	},

	hexRgb: function (hex) {
		const m = (hex || "").match(/^#([0-9a-f]{6})$/i);
		if (!m) return [128, 128, 128];
		const n = parseInt(m[1], 16);
		return [n >> 16 & 255, n >> 8 & 255, n & 255];
	},

	explain: function (h) {
		const N = this.N, terms = [];
		let s = 0;
		for (let dj = -1; dj <= 1; dj++) {
			for (let di = -1; di <= 1; di++) {
				const x = h[0] + di, y = h[1] + dj;
				const p = x < 0 || y < 0 || x >= N || y >= N ? 0 : this.img[y * N + x];
				const k = this.kernel[(dj + 1) * 3 + (di + 1)];
				s += p * k;
				if (p !== 0 && k !== 0) terms.push(p + "·" + this.fmtK(k));
			}
		}
		const val = this.relu ? Math.max(0, s) : s;
		this.el.calc.innerHTML = "output[" + h[1] + "," + h[0] + "] = " + (terms.length ? terms.join(" + ") : "0") + " = <b>" + this.fmtK(s) + "</b>" + (this.relu && s < 0 ? " → ReLU → <b>0</b>" : "") +
			' <span class="mnlab-hint">(only cells where pixel and weight are both non-zero are listed)</span>';
		return val;
	},

	scan: function () {
		if (this.scanning) { this.scanning = false; return; }
		this.scanning = true;
		this.el.scan.textContent = "■ Stop";
		let k = 0;
		const N = this.N;
		const tick = () => {
			if (!this.scanning || k >= N * N) {
				this.scanning = false;
				this.hover = null;
				this.el.scan.textContent = "▶ Animate scan";
				this.draw();
				if (k >= N * N) window.dispatchEvent(new CustomEvent("convstudio:scanned"));
				return;
			}
			this.hover = [k % N, Math.floor(k / N)];
			this.draw();
			k++;
			setTimeout(tick, 28);
		};
		tick();
	}
};

async function loadConvStudioModule() {
	if (typeof updateLoadingStatus === "function") updateLoadingStatus("Loading section about convolutions...");
	ConvStudio.init();
}
