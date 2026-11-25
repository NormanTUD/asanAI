// Neural Network Playground: a tiny multilayer perceptron trained live in
// the browser (full-batch Adam, binary cross-entropy). Every hidden neuron
// shows what it has learned to respond to as a little heat map.

const NNPlayground = {
	datasets: ["circle", "xor", "gauss", "spiral"],
	dataset: "circle",
	noise: 0.1,
	hidden: [4, 2],
	act: "tanh",
	feats: { x: true, y: true, sq: false, xy: false, sin: false },
	lr: 0.03,
	running: false,
	epoch: 0,
	seed: 1,

	init: function () {
		this.root = document.getElementById("nn-playground");
		if (!this.root) return false;
		this.el = {};
		this.root.querySelectorAll("[data-nn]").forEach((n) => { this.el[n.dataset.nn] = n; });
		this.bctx = this.el.boundary.getContext("2d");
		this.nctx = this.el.net.getContext("2d");

		this.root.querySelectorAll("[data-ds]").forEach((b) => b.addEventListener("click", () => {
			this.dataset = b.dataset.ds;
			this.root.querySelectorAll("[data-ds]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
			this.makeData();
			this.resetWeights();
		}));
		this.root.querySelectorAll("[data-feat]").forEach((b) => b.addEventListener("click", () => {
			const k = b.dataset.feat;
			const on = !this.feats[k];
			if (!on && this.activeFeats().length <= 1) return;
			this.feats[k] = on;
			b.setAttribute("aria-pressed", String(on));
			this.resetWeights();
		}));
		this.root.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => {
			this.act = b.dataset.act;
			this.root.querySelectorAll("[data-act]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
			this.resetWeights();
		}));
		this.el.layers.addEventListener("input", () => {
			const L = parseInt(this.el.layers.value, 10);
			while (this.hidden.length < L) this.hidden.push(this.hidden[this.hidden.length - 1] || 3);
			this.hidden.length = L;
			this.resetWeights();
		});
		this.el.neurons.addEventListener("input", () => {
			const n = parseInt(this.el.neurons.value, 10);
			this.hidden = this.hidden.map(() => n);
			this.resetWeights();
		});
		this.el.noise.addEventListener("input", () => { this.noise = parseFloat(this.el.noise.value); this.makeData(); this.resetWeights(); });
		this.el.lr.addEventListener("input", () => { this.lr = Math.pow(10, parseFloat(this.el.lr.value)); this.paintControls(); });
		this.el.play.addEventListener("click", () => (this.running ? this.pause() : this.play()));
		this.el.step.addEventListener("click", () => { this.pause(); this.train(1); this.render(); });
		this.el.reset.addEventListener("click", () => { this.seed++; this.resetWeights(); });

		if (window.ResizeObserver) {
			let raf = 0;
			new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => this.resize()); }).observe(this.root);
		}
		if (window.IntersectionObserver) {
			new IntersectionObserver((es) => { this.visible = es.some((e) => e.isIntersecting); }).observe(this.root);
		}
		if (window.__MN_DARK && window.__MN_DARK.onChange) window.__MN_DARK.onChange(() => this.render());
		this.makeData();
		this.resetWeights();
		this.resize();
		return true;
	},

	rng: function (seed) {
		let a = seed >>> 0;
		return () => {
			a = (a + 0x6D2B79F5) >>> 0;
			let t = Math.imul(a ^ (a >>> 15), a | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	},

	gauss: function (r) { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()); },

	makeData: function () {
		const r = this.rng(4242 + this.datasets.indexOf(this.dataset));
		const N = 300, pts = [];
		const nz = () => this.noise * 0.45 * this.gauss(r);
		for (let i = 0; i < N; i++) {
			let x, y, c;
			if (this.dataset === "circle") {
				c = i % 2;
				const rad = c ? r() * 0.42 : 0.62 + r() * 0.3, a = r() * Math.PI * 2;
				x = rad * Math.cos(a); y = rad * Math.sin(a);
			} else if (this.dataset === "xor") {
				x = r() * 1.8 - 0.9; y = r() * 1.8 - 0.9;
				x += x > 0 ? 0.06 : -0.06; y += y > 0 ? 0.06 : -0.06;
				c = x * y > 0 ? 1 : 0;
			} else if (this.dataset === "gauss") {
				c = i % 2;
				x = (c ? 0.45 : -0.45) + 0.2 * this.gauss(r); y = (c ? 0.45 : -0.45) + 0.2 * this.gauss(r);
			} else {
				c = i % 2;
				const t = 0.08 + 0.92 * (Math.floor(i / 2) / (N / 2));
				const a = t * 1.75 * 2 * Math.PI + (c ? Math.PI : 0);
				x = 0.9 * t * Math.cos(a); y = 0.9 * t * Math.sin(a);
			}
			pts.push({ x: Math.max(-1, Math.min(1, x + nz())), y: Math.max(-1, Math.min(1, y + nz())), c: c });
		}
		for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = pts[i]; pts[i] = pts[j]; pts[j] = t; }
		this.train_ = pts.slice(0, N / 2);
		this.test_ = pts.slice(N / 2);
	},

	featList: [
		{ k: "x", label: "x₁", f: (x) => [x[0]] },
		{ k: "y", label: "x₂", f: (x) => [x[1]] },
		{ k: "sq", label: "x₁², x₂²", f: (x) => [x[0] * x[0], x[1] * x[1]], names: ["x₁²", "x₂²"] },
		{ k: "xy", label: "x₁·x₂", f: (x) => [x[0] * x[1]] },
		{ k: "sin", label: "sin", f: (x) => [Math.sin(3 * x[0]), Math.sin(3 * x[1])], names: ["sin x₁", "sin x₂"] }
	],

	activeFeats: function () { return this.featList.filter((F) => this.feats[F.k]); },

	inputs: function (x, y) {
		const out = [];
		this.activeFeats().forEach((F) => F.f([x, y]).forEach((v) => out.push(v)));
		return out;
	},

	inputNames: function () {
		const n = [];
		this.activeFeats().forEach((F) => (F.names || [F.label]).forEach((s) => n.push(s)));
		return n;
	},

	resetWeights: function () {
		this.pause();
		const r = this.rng(this.seed * 7919);
		const sizes = [this.inputs(0, 0).length].concat(this.hidden, [1]);
		this.sizes = sizes;
		this.W = []; this.b = []; this.mW = []; this.vW = []; this.mb = []; this.vb = [];
		for (let l = 0; l + 1 < sizes.length; l++) {
			const nin = sizes[l], nout = sizes[l + 1], s = Math.sqrt(2 / (nin + nout));
			const W = [], mW = [], vW = [];
			for (let o = 0; o < nout; o++) {
				W.push(Array.from({ length: nin }, () => this.gauss(r) * s));
				mW.push(new Array(nin).fill(0)); vW.push(new Array(nin).fill(0));
			}
			this.W.push(W); this.mW.push(mW); this.vW.push(vW);
			this.b.push(new Array(nout).fill(0)); this.mb.push(new Array(nout).fill(0)); this.vb.push(new Array(nout).fill(0));
		}
		this.t = 0;
		this.epoch = 0;
		this.hist = [];
		this.paintControls();
		this.render();
	},

	actF: function (z) {
		if (this.act === "relu") return z > 0 ? z : 0;
		if (this.act === "sigmoid") return 1 / (1 + Math.exp(-z));
		return Math.tanh(z);
	},
	actD: function (a, z) {
		if (this.act === "relu") return z > 0 ? 1 : 0;
		if (this.act === "sigmoid") return a * (1 - a);
		return 1 - a * a;
	},

	forward: function (inp) {
		const A = [inp], Z = [null];
		for (let l = 0; l < this.W.length; l++) {
			const W = this.W[l], b = this.b[l], a = A[l], last = l === this.W.length - 1;
			const z = new Array(W.length), out = new Array(W.length);
			for (let o = 0; o < W.length; o++) {
				let s = b[o];
				const w = W[o];
				for (let i = 0; i < w.length; i++) s += w[i] * a[i];
				z[o] = s;
				out[o] = last ? 1 / (1 + Math.exp(-s)) : this.actF(s);
			}
			Z.push(z); A.push(out);
		}
		return { A: A, Z: Z };
	},

	predict: function (x, y) { const f = this.forward(this.inputs(x, y)); return f.A[f.A.length - 1][0]; },

	loss: function (set) {
		let L = 0, acc = 0;
		set.forEach((p) => {
			const q = Math.min(1 - 1e-7, Math.max(1e-7, this.predict(p.x, p.y)));
			L -= p.c ? Math.log(q) : Math.log(1 - q);
			if ((q > 0.5 ? 1 : 0) === p.c) acc++;
		});
		return { loss: L / set.length, acc: acc / set.length };
	},

	train: function (epochs) {
		const nL = this.W.length;
		for (let e = 0; e < epochs; e++) {
			const gW = this.W.map((W) => W.map((w) => new Array(w.length).fill(0)));
			const gb = this.b.map((b) => new Array(b.length).fill(0));
			this.train_.forEach((p) => {
				const f = this.forward(this.inputs(p.x, p.y));
				let delta = [f.A[nL][0] - p.c];
				for (let l = nL - 1; l >= 0; l--) {
					const a = f.A[l];
					for (let o = 0; o < delta.length; o++) {
						gb[l][o] += delta[o];
						const row = gW[l][o];
						for (let i = 0; i < a.length; i++) row[i] += delta[o] * a[i];
					}
					if (l > 0) {
						const nd = new Array(a.length).fill(0);
						for (let i = 0; i < a.length; i++) {
							let s = 0;
							for (let o = 0; o < delta.length; o++) s += this.W[l][o][i] * delta[o];
							nd[i] = s * this.actD(a[i], f.Z[l][i]);
						}
						delta = nd;
					}
				}
			});
			const n = this.train_.length, b1 = 0.9, b2 = 0.999;
			this.t++;
			const c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
			for (let l = 0; l < nL; l++) {
				for (let o = 0; o < this.W[l].length; o++) {
					for (let i = 0; i < this.W[l][o].length; i++) {
						const g = gW[l][o][i] / n;
						this.mW[l][o][i] = b1 * this.mW[l][o][i] + (1 - b1) * g;
						this.vW[l][o][i] = b2 * this.vW[l][o][i] + (1 - b2) * g * g;
						this.W[l][o][i] -= this.lr * (this.mW[l][o][i] / c1) / (Math.sqrt(this.vW[l][o][i] / c2) + 1e-8);
					}
					const g = gb[l][o] / n;
					this.mb[l][o] = b1 * this.mb[l][o] + (1 - b1) * g;
					this.vb[l][o] = b2 * this.vb[l][o] + (1 - b2) * g * g;
					this.b[l][o] -= this.lr * (this.mb[l][o] / c1) / (Math.sqrt(this.vb[l][o] / c2) + 1e-8);
				}
			}
			this.epoch++;
			if (this.epoch % 5 === 0) {
				const tr = this.loss(this.train_), te = this.loss(this.test_);
				this.hist.push([tr.loss, te.loss]);
				if (this.hist.length > 300) this.hist.shift();
			}
		}
	},

	play: function () {
		if (this.running) return;
		this.running = true;
		this.el.play.textContent = "❚❚ Pause";
		let frame = 0;
		const loop = () => {
			if (!this.running) return;
			if (this.visible !== false) {
				this.train(4);
				if (++frame % 2 === 0) this.render(); else this.renderStats();
			}
			if (this.epoch >= 3000) { this.pause(); this.render(); return; }
			this.raf = requestAnimationFrame(loop);
		};
		this.raf = requestAnimationFrame(loop);
	},

	pause: function () {
		this.running = false;
		cancelAnimationFrame(this.raf);
		if (this.el && this.el.play) this.el.play.textContent = "▶ Train";
	},

	css: function (n, fb) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb; },

	rgb: function (hex) {
		const m = (hex || "").match(/^#([0-9a-f]{6})$/i);
		if (!m) return [128, 128, 128];
		const n = parseInt(m[1], 16);
		return [n >> 16 & 255, n >> 8 & 255, n & 255];
	},

	// Diverging map: −1 → coral, 0 → surface, +1 → sky.
	palette: function () {
		return { neg: this.rgb(this.css("--mn-coral", "#f97316")), pos: this.rgb(this.css("--mn-sky", "#0ea5e9")), mid: this.rgb(this.css("--mn-surface", "#1e293b")) };
	},

	mix: function (P, v) {
		const t = Math.max(-1, Math.min(1, v));
		const c = t < 0 ? P.neg : P.pos, a = Math.abs(t) * 0.85;
		return [P.mid[0] + (c[0] - P.mid[0]) * a, P.mid[1] + (c[1] - P.mid[1]) * a, P.mid[2] + (c[2] - P.mid[2]) * a];
	},

	paintField: function (ctx, x0, y0, w, h, res, fn) {
		const P = this.palette();
		const img = ctx.createImageData(res, res);
		for (let j = 0; j < res; j++) {
			for (let i = 0; i < res; i++) {
				const v = fn(-1 + 2 * (i + 0.5) / res, 1 - 2 * (j + 0.5) / res);
				const c = this.mix(P, v), k = (j * res + i) * 4;
				img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
			}
		}
		if (!this._tmp) this._tmp = document.createElement("canvas");
		this._tmp.width = res; this._tmp.height = res;
		this._tmp.getContext("2d").putImageData(img, 0, 0);
		ctx.imageSmoothingEnabled = true;
		ctx.drawImage(this._tmp, x0, y0, w, h);
	},

	resize: function () {
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const bw = Math.max(200, this.el.bwrap.clientWidth);
		this.el.boundary.width = Math.round(bw * dpr);
		this.el.boundary.height = Math.round(bw * dpr);
		this.el.boundary.style.height = bw + "px";
		const nw = Math.max(240, this.el.nwrap.clientWidth);
		this.el.net.width = Math.round(nw * dpr);
		this.el.net.height = Math.round(Math.min(340, Math.max(220, nw * 0.62)) * dpr);
		this.el.net.style.height = Math.round(this.el.net.height / dpr) + "px";
		this.el.curve.width = Math.round(Math.max(200, this.el.curve.parentNode.clientWidth) * dpr);
		this.el.curve.height = Math.round(70 * dpr);
		this.el.curve.style.height = "70px";
		this.render();
	},

	render: function () {
		if (!this.W) return;
		this.renderBoundary();
		this.renderNet();
		this.renderStats();
	},

	renderBoundary: function () {
		const ctx = this.bctx, W = this.el.boundary.width, H = this.el.boundary.height;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		this.paintField(ctx, 0, 0, W, H, 72, (x, y) => 2 * this.predict(x, y) - 1);
		// decision contour at 0.5: darker outline pixels
		const toPx = (x, y) => [(x + 1) / 2 * W, (1 - y) / 2 * H];
		const draw = (set, test) => set.forEach((p) => {
			const [px, py] = toPx(p.x, p.y);
			ctx.beginPath();
			ctx.arc(px, py, (test ? 3.2 : 4) * dpr, 0, Math.PI * 2);
			ctx.fillStyle = p.c ? this.css("--mn-sky", "#0ea5e9") : this.css("--mn-coral", "#f97316");
			ctx.globalAlpha = test && !this.showTest ? 0 : 1;
			ctx.fill();
			ctx.lineWidth = (test ? 1.6 : 1.3) * dpr;
			ctx.strokeStyle = test ? this.css("--mn-heading", "#000") : "#fff";
			ctx.stroke();
			ctx.globalAlpha = 1;
		});
		this.showTest = this.el.showtest ? this.el.showtest.checked : false;
		draw(this.train_, false);
		draw(this.test_, true);
	},

	renderNet: function () {
		const ctx = this.nctx, W = this.el.net.width, H = this.el.net.height;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		ctx.clearRect(0, 0, W, H);
		const sizes = this.sizes, cols = sizes.length;
		const box = Math.min(34 * dpr, (H - 20 * dpr) / Math.max.apply(null, sizes) - 8 * dpr);
		const colX = (c) => 30 * dpr + c * (W - 60 * dpr - box) / Math.max(1, cols - 1);
		const nodeY = (c, i) => { const n = sizes[c], gap = Math.min(box * 1.45, (H - 20 * dpr) / n); return H / 2 + (i - (n - 1) / 2) * gap - box / 2; };
		// edges
		for (let l = 0; l + 1 < cols; l++) {
			for (let o = 0; o < sizes[l + 1]; o++) {
				for (let i = 0; i < sizes[l]; i++) {
					const w = this.W[l][o][i];
					const x1 = colX(l) + box, y1 = nodeY(l, i) + box / 2, x2 = colX(l + 1), y2 = nodeY(l + 1, o) + box / 2;
					ctx.strokeStyle = w > 0 ? this.css("--mn-sky", "#0ea5e9") : this.css("--mn-coral", "#f97316");
					ctx.globalAlpha = Math.min(0.9, 0.15 + Math.abs(w) * 0.35);
					ctx.lineWidth = Math.min(6, 0.6 + Math.abs(w) * 1.6) * dpr;
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2);
					ctx.stroke();
				}
			}
		}
		ctx.globalAlpha = 1;
		// nodes: tiny heat maps of what each unit computes
		const names = this.inputNames();
		const res = 18;
		for (let c = 0; c < cols; c++) {
			for (let i = 0; i < sizes[c]; i++) {
				const x = colX(c), y = nodeY(c, i);
				const fn = (px, py) => {
					if (c === 0) return Math.max(-1, Math.min(1, this.inputs(px, py)[i]));
					const f = this.forward(this.inputs(px, py));
					const a = f.A[c][i];
					return c === cols - 1 || this.act === "sigmoid" ? 2 * a - 1 : this.act === "relu" ? Math.min(1, a) * 2 - 1 : a;
				};
				ctx.save();
				ctx.beginPath();
				const rr = 6 * dpr;
				ctx.moveTo(x + rr, y); ctx.arcTo(x + box, y, x + box, y + box, rr); ctx.arcTo(x + box, y + box, x, y + box, rr); ctx.arcTo(x, y + box, x, y, rr); ctx.arcTo(x, y, x + box, y, rr);
				ctx.closePath();
				ctx.clip();
				this.paintField(ctx, x, y, box, box, res, fn);
				ctx.restore();
				ctx.strokeStyle = this.css("--mn-border", "#888");
				ctx.lineWidth = 1 * dpr;
				ctx.strokeRect(x + 0.5, y + 0.5, box - 1, box - 1);
				if (c === 0) {
					ctx.fillStyle = this.css("--mn-text-secondary", "#888");
					ctx.font = (10 * dpr) + "px system-ui, sans-serif";
					ctx.textAlign = "right";
					ctx.fillText(names[i] || "", x - 4 * dpr, y + box / 2 + 3 * dpr);
				}
			}
		}
		ctx.fillStyle = this.css("--mn-text-muted", "#888");
		ctx.font = (10 * dpr) + "px system-ui, sans-serif";
		ctx.textAlign = "center";
		for (let c = 0; c < cols; c++) {
			const label = c === 0 ? "input" : c === cols - 1 ? "output" : "hidden " + c;
			ctx.fillText(label, colX(c) + box / 2, H - 4 * dpr);
		}
	},

	renderStats: function () {
		const tr = this.loss(this.train_), te = this.loss(this.test_);
		this.last = { tr: tr, te: te };
		this.el.epoch.textContent = String(this.epoch);
		this.el.trl.textContent = tr.loss.toFixed(3);
		this.el.tel.textContent = te.loss.toFixed(3);
		this.el.acc.innerHTML = (te.acc * 100).toFixed(1) + "<small>%</small>";
		const params = this.W.reduce((s, W, l) => s + W.length * W[0].length + this.b[l].length, 0);
		this.el.params.textContent = String(params);
		// loss curve
		const c = this.el.curve, ctx = c.getContext("2d"), Wd = c.width, Hd = c.height;
		ctx.clearRect(0, 0, Wd, Hd);
		if (this.hist.length > 1) {
			const mx = Math.max(0.75, ...this.hist.map((h) => Math.max(h[0], h[1])));
			[[0, "--mn-sky"], [1, "--mn-coral"]].forEach(([k, col]) => {
				ctx.strokeStyle = this.css(col, "#888");
				ctx.lineWidth = 2;
				ctx.beginPath();
				this.hist.forEach((h, i) => {
					const x = i / (this.hist.length - 1) * Wd, y = Hd - 3 - h[k] / mx * (Hd - 6);
					if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
				});
				ctx.stroke();
			});
		}
		const gap = te.loss - tr.loss;
		const n = this.el.note;
		if (this.epoch === 0) {
			n.dataset.tone = "accent";
			n.innerHTML = "The network starts with random weights — the background colour is its current guess (blue vs. orange). Press <b>Train</b>.";
		} else if (te.acc >= 0.97) {
			n.dataset.tone = "good";
			n.innerHTML = "<b>Solved.</b> " + (te.acc * 100).toFixed(1) + " % of the unseen test points are classified correctly with " + this.el.params.textContent + " parameters. Can you do it with fewer neurons?";
		} else if (gap > 0.25 && tr.loss < 0.15) {
			n.dataset.tone = "warn";
			n.innerHTML = "<b>Overfitting.</b> The training loss is tiny but the test loss is much higher: the network memorises noise in the training points instead of learning the shape.";
		} else if (this.epoch > 600 && tr.acc < 0.8) {
			n.dataset.tone = "bad";
			n.innerHTML = "<b>Stuck.</b> After " + this.epoch + " epochs the network still cannot separate the classes. It may simply be too small for this shape — add neurons, layers or a helpful input feature.";
		} else {
			n.dataset.tone = "accent";
			n.innerHTML = "Training… epoch " + this.epoch + ". Watch the little squares: each hidden neuron learns one simple cut, and later layers combine those cuts into curves.";
		}
		window.dispatchEvent(new CustomEvent("nnplayground:update"));
	},

	paintControls: function () {
		[["layers", this.hidden.length], ["neurons", this.hidden[0] || 0]].forEach(([k, v]) => { this.el[k].value = v; });
		this.el.layersv.textContent = this.hidden.length + (this.hidden.length === 1 ? " layer" : " layers");
		this.el.neuronsv.textContent = (this.hidden[0] || 0) + " each";
		this.el.noisev.textContent = Math.round(this.noise * 100) + " %";
		this.el.lrv.textContent = this.lr.toPrecision(2);
		[this.el.layers, this.el.neurons, this.el.noise, this.el.lr].forEach((input) => {
			const min = parseFloat(input.min), max = parseFloat(input.max), v = parseFloat(input.value);
			input.style.setProperty("--fill", ((v - min) / (max - min) * 100) + "%");
		});
	}
};

async function loadNNPlaygroundModule() {
	if (typeof updateLoadingStatus === "function") updateLoadingStatus("Loading section about the network playground...");
	NNPlayground.init();
}
