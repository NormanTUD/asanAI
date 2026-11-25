// Optimizer Race: SGD, SGD + momentum and Adam start at the same point on
// a 2-D loss surface and descend side by side. Exact gradients, no noise.

const OptimizerRace = {
	surfaces: {
		ravine: {
			label: "Narrow ravine",
			f: (x, y) => 0.05 * x * x + 2.5 * y * y,
			g: (x, y) => [0.1 * x, 5 * y],
			box: [-6, 6, -3, 3], start: [-5.2, 1.6], min: [[0, 0]], fmin: 0,
			lr: { sgd: 0.38, mom: 0.04, adam: 0.4 },
			blurb: "Steep walls, a gentle floor (50× flatter along x than across). Plain SGD bounces between the walls while it crawls along the floor; momentum averages the bouncing away, and Adam rescales each direction separately. Double the learning rate and watch SGD fly off."
		},
		banana: {
			label: "Banana valley",
			f: (x, y) => (1 - x) * (1 - x) + 10 * (y - x * x) * (y - x * x),
			g: (x, y) => [-2 * (1 - x) - 40 * x * (y - x * x), 20 * (y - x * x)],
			box: [-2, 2, -1, 3], start: [-1.6, 2.6], min: [[1, 1]], fmin: 0,
			lr: { sgd: 0.012, mom: 0.003, adam: 0.04 },
			blurb: "A curved valley (a gentler Rosenbrock function). Finding the valley is easy; following its bend to the minimum at (1, 1) is the hard part."
		},
		saddle: {
			label: "Saddle point",
			f: (x, y) => x * x - y * y + 0.25 * Math.pow(y, 4),
			g: (x, y) => [2 * x, -2 * y + Math.pow(y, 3)],
			box: [-3, 3, -2.6, 2.6], start: [2.6, 0.02], min: [[0, Math.SQRT2], [0, -Math.SQRT2]], fmin: -1,
			lr: { sgd: 0.03, mom: 0.01, adam: 0.2 },
			blurb: "The start sits almost exactly on the ridge of a saddle. The gradient across the ridge is tiny, so whoever amplifies small signals escapes first."
		},
		bumpy: {
			label: "Bumpy field",
			f: (x, y) => 0.1 * (x * x + y * y) - 0.2 * Math.cos(2.2 * x) * Math.cos(2.2 * y),
			g: (x, y) => [0.2 * x + 0.44 * Math.sin(2.2 * x) * Math.cos(2.2 * y), 0.2 * y + 0.44 * Math.cos(2.2 * x) * Math.sin(2.2 * y)],
			box: [-4, 4, -3, 3], start: [3.4, 2.5], min: [[0, 0]], fmin: -0.2,
			lr: { sgd: 0.2, mom: 0.03, adam: 0.05 },
			blurb: "Small pits all over a big bowl. SGD and Adam settle into the first pit they meet; momentum's inertia carries it over the rims to the centre. Real loss landscapes are not this bumpy everywhere — but this is why momentum helps."
		}
	},

	racers: [
		{ id: "sgd", name: "SGD", color: "--mn-rose" },
		{ id: "mom", name: "Momentum", color: "--mn-sky" },
		{ id: "adam", name: "Adam", color: "--mn-emerald" }
	],

	key: "ravine",
	running: false,
	step: 0,
	MAX_STEPS: 400,

	init: function () {
		this.root = document.getElementById("optimizer-race");
		if (!this.root) return false;
		this.el = {};
		this.root.querySelectorAll("[data-or]").forEach((n) => { this.el[n.dataset.or] = n; });
		this.canvas = this.el.canvas;
		this.ctx = this.canvas.getContext("2d");
		this.curve = this.el.curve;
		this.cctx = this.curve.getContext("2d");

		this.root.querySelectorAll("[data-surface]").forEach((b) => b.addEventListener("click", () => this.setSurface(b.dataset.surface)));
		this.el.play.addEventListener("click", () => (this.running ? this.pause() : this.play()));
		this.el.stepbtn.addEventListener("click", () => { this.pause(); this.advance(1); this.draw(); });
		this.el.reset.addEventListener("click", () => this.reset());
		this.el.lr.addEventListener("input", () => { this.fillSlider(); this.reset(); });
		this.el.speed.addEventListener("input", () => this.fillSlider());
		this.canvas.addEventListener("click", (e) => {
			const r = this.canvas.getBoundingClientRect();
			const S = this.surfaces[this.key];
			const x = S.box[0] + (e.clientX - r.left) / r.width * (S.box[1] - S.box[0]);
			const y = S.box[3] - (e.clientY - r.top) / r.height * (S.box[3] - S.box[2]);
			this.reset([x, y]);
			this.play();
		});

		if (window.ResizeObserver) {
			let raf = 0;
			new ResizeObserver(() => {
				cancelAnimationFrame(raf);
				raf = requestAnimationFrame(() => this.resize());
			}).observe(this.el.stage);
		}
		if (window.IntersectionObserver) {
			new IntersectionObserver((es) => { this.visible = es.some((e) => e.isIntersecting); }).observe(this.root);
		}
		this.visible = true;
		if (window.__MN_DARK && window.__MN_DARK.onChange) window.__MN_DARK.onChange(() => { this.bg = null; this.draw(); });

		this.fillSlider();
		this.setSurface("ravine");
		return true;
	},

	css: function (name, fb) {
		const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
		return v || fb;
	},

	isDark: function () { return document.documentElement.classList.contains("dark"); },

	fillSlider: function () {
		[this.el.lr, this.el.speed].forEach((input) => {
			const min = parseFloat(input.min), max = parseFloat(input.max), v = parseFloat(input.value);
			input.style.setProperty("--fill", ((v - min) / (max - min) * 100) + "%");
		});
		this.el.lrv.textContent = "× " + this.lrMul().toFixed(2);
		this.el.speedv.textContent = parseInt(this.el.speed.value, 10) + " steps/frame";
	},

	lrMul: function () { return Math.pow(2, parseFloat(this.el.lr.value)); },

	setSurface: function (key) {
		this.key = key;
		this.root.querySelectorAll("[data-surface]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.surface === key)));
		this.el.blurb.textContent = this.surfaces[key].blurb;
		this.bg = null;
		this.reset();
		this.resize();
	},

	reset: function (start) {
		this.pause();
		const S = this.surfaces[this.key];
		const s = start || S.start;
		this.startPt = s.slice();
		this.step = 0;
		this.state = this.racers.map((r) => ({
			id: r.id, x: s[0], y: s[1], vx: 0, vy: 0, m: [0, 0], v: [0, 0],
			path: [[s[0], s[1]]], losses: [S.f(s[0], s[1])], doneAt: null, dead: false
		}));
		this.draw();
	},

	play: function () {
		if (this.running) return;
		if (this.step >= this.MAX_STEPS || this.state.every((r) => r.doneAt !== null || r.dead)) this.reset(this.startPt);
		this.running = true;
		this.el.play.textContent = "❚❚ Pause";
		const loop = () => {
			if (!this.running) return;
			if (this.visible !== false) {
				this.advance(parseInt(this.el.speed.value, 10));
				this.draw();
			}
			if (this.step >= this.MAX_STEPS || this.state.every((r) => r.doneAt !== null || r.dead)) { this.pause(); this.draw(); return; }
			this.raf = requestAnimationFrame(loop);
		};
		this.raf = requestAnimationFrame(loop);
	},

	pause: function () {
		this.running = false;
		cancelAnimationFrame(this.raf);
		if (this.el && this.el.play) this.el.play.textContent = "▶ Race";
	},

	advance: function (n) {
		const S = this.surfaces[this.key];
		const mul = this.lrMul();
		const span = Math.max(S.box[1] - S.box[0], S.box[3] - S.box[2]);
		for (let k = 0; k < n && this.step < this.MAX_STEPS; k++) {
			this.step++;
			this.state.forEach((r) => {
				if (r.dead || r.doneAt !== null) return;
				const [gx, gy] = S.g(r.x, r.y);
				const lr = S.lr[r.id] * mul;
				if (r.id === "sgd") {
					r.x -= lr * gx; r.y -= lr * gy;
				} else if (r.id === "mom") {
					r.vx = 0.9 * r.vx + gx; r.vy = 0.9 * r.vy + gy;
					r.x -= lr * r.vx; r.y -= lr * r.vy;
				} else {
					const b1 = 0.9, b2 = 0.999, t = this.step;
					r.m[0] = b1 * r.m[0] + (1 - b1) * gx; r.m[1] = b1 * r.m[1] + (1 - b1) * gy;
					r.v[0] = b2 * r.v[0] + (1 - b2) * gx * gx; r.v[1] = b2 * r.v[1] + (1 - b2) * gy * gy;
					const mh0 = r.m[0] / (1 - Math.pow(b1, t)), mh1 = r.m[1] / (1 - Math.pow(b1, t));
					const vh0 = r.v[0] / (1 - Math.pow(b2, t)), vh1 = r.v[1] / (1 - Math.pow(b2, t));
					r.x -= lr * mh0 / (Math.sqrt(vh0) + 1e-8); r.y -= lr * mh1 / (Math.sqrt(vh1) + 1e-8);
				}
				const L = S.f(r.x, r.y);
				if (!isFinite(L) || Math.abs(r.x) > span * 4 || Math.abs(r.y) > span * 4) { r.dead = true; return; }
				r.path.push([r.x, r.y]);
				if (r.path.length > 600) r.path.shift();
				r.losses.push(L);
				const near = S.min.some((m) => Math.hypot(r.x - m[0], r.y - m[1]) < 0.05 * span / 6);
				if (near && L - S.fmin < 1e-3) r.doneAt = this.step;
			});
		}
	},

	resize: function () {
		const stage = this.el.stage;
		const S = this.surfaces[this.key];
		const w = Math.max(240, stage.clientWidth);
		const aspect = (S.box[3] - S.box[2]) / (S.box[1] - S.box[0]);
		const h = Math.round(Math.min(w * aspect, 520));
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
			this.canvas.width = Math.round(w * dpr);
			this.canvas.height = Math.round(h * dpr);
			this.canvas.style.height = h + "px";
			this.bg = null;
		}
		const cw = Math.max(200, this.el.curvewrap.clientWidth);
		this.curve.width = Math.round(cw * dpr);
		this.curve.height = Math.round(130 * dpr);
		this.curve.style.height = "130px";
		this.draw();
	},

	// Height map: log-scaled loss → colour bands with thin contour lines.
	buildBackground: function () {
		const S = this.surfaces[this.key];
		const W = this.canvas.width, H = this.canvas.height;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const gw = Math.max(80, Math.round(W / dpr)), gh = Math.max(50, Math.round(H / dpr));
		const vals = new Float32Array(gw * gh);
		let lo = Infinity, hi = -Infinity;
		for (let j = 0; j < gh; j++) {
			for (let i = 0; i < gw; i++) {
				const x = S.box[0] + (i + 0.5) / gw * (S.box[1] - S.box[0]);
				const y = S.box[3] - (j + 0.5) / gh * (S.box[3] - S.box[2]);
				const v = Math.log(S.f(x, y) - S.fmin + 0.02);
				vals[j * gw + i] = v;
				if (v < lo) lo = v;
				if (v > hi) hi = v;
			}
		}
		const dark = this.isDark();
		const stops = dark
			? [[8, 12, 32], [22, 28, 72], [46, 44, 122], [70, 70, 168], [52, 112, 168], [62, 156, 158], [150, 190, 170], [222, 210, 170]]
			: [[67, 56, 202], [99, 102, 241], [139, 152, 248], [176, 190, 250], [206, 216, 250], [228, 232, 246], [244, 240, 228], [250, 247, 238]];
		const BANDS = 16;
		const img = document.createElement("canvas");
		img.width = gw; img.height = gh;
		const ictx = img.getContext("2d");
		const data = ictx.createImageData(gw, gh);
		const band = (v) => Math.min(BANDS - 1, Math.floor((v - lo) / (hi - lo + 1e-9) * BANDS));
		for (let j = 0; j < gh; j++) {
			for (let i = 0; i < gw; i++) {
				const k = j * gw + i;
				// vals is float32, lo/hi are float64: clamp the rounding drift.
				const t = Math.max(0, Math.min(1, (vals[k] - lo) / (hi - lo + 1e-9)));
				const p = t * (stops.length - 1), a = Math.floor(p), f = p - a;
				const c0 = stops[a], c1 = stops[Math.min(stops.length - 1, a + 1)];
				let r = c0[0] + (c1[0] - c0[0]) * f, g = c0[1] + (c1[1] - c0[1]) * f, b = c0[2] + (c1[2] - c0[2]) * f;
				const b0 = band(vals[k]);
				const edge = (i + 1 < gw && band(vals[k + 1]) !== b0) || (j + 1 < gh && band(vals[k + gw]) !== b0);
				if (edge) { const s = dark ? 1.28 : 0.86; r *= s; g *= s; b *= s; }
				data.data[k * 4] = Math.min(255, r); data.data[k * 4 + 1] = Math.min(255, g); data.data[k * 4 + 2] = Math.min(255, b); data.data[k * 4 + 3] = 255;
			}
		}
		ictx.putImageData(data, 0, 0);
		this.bg = img;
	},

	toPx: function (x, y) {
		const S = this.surfaces[this.key];
		return [
			(x - S.box[0]) / (S.box[1] - S.box[0]) * this.canvas.width,
			(S.box[3] - y) / (S.box[3] - S.box[2]) * this.canvas.height
		];
	},

	draw: function () {
		if (!this.ctx || !this.state) return;
		const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const S = this.surfaces[this.key];
		if (!this.bg) this.buildBackground();
		ctx.imageSmoothingEnabled = true;
		ctx.drawImage(this.bg, 0, 0, W, H);

		// minima
		S.min.forEach((m) => {
			const [px, py] = this.toPx(m[0], m[1]);
			ctx.save();
			ctx.font = (16 * dpr) + "px system-ui, sans-serif";
			ctx.textAlign = "center"; ctx.textBaseline = "middle";
			ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 6 * dpr;
			ctx.fillText("⭐", px, py);
			ctx.restore();
		});
		// start
		const [sx, sy] = this.toPx(this.startPt[0], this.startPt[1]);
		ctx.strokeStyle = this.isDark() ? "rgba(255,255,255,.8)" : "rgba(30,30,40,.7)";
		ctx.lineWidth = 2 * dpr;
		ctx.setLineDash([3 * dpr, 3 * dpr]);
		ctx.beginPath(); ctx.arc(sx, sy, 9 * dpr, 0, Math.PI * 2); ctx.stroke();
		ctx.setLineDash([]);

		this.racers.forEach((rc, idx) => {
			const r = this.state[idx];
			const col = this.css(rc.color, "#888");
			ctx.lineWidth = 2.4 * dpr;
			ctx.lineJoin = "round";
			ctx.strokeStyle = col;
			ctx.globalAlpha = 0.9;
			ctx.beginPath();
			r.path.forEach((p, i) => { const [px, py] = this.toPx(p[0], p[1]); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
			ctx.stroke();
			ctx.globalAlpha = 1;
			const [px, py] = this.toPx(r.x, r.y);
			if (px > -20 && px < W + 20 && py > -20 && py < H + 20) {
				ctx.save();
				ctx.shadowColor = col; ctx.shadowBlur = 14 * dpr;
				ctx.fillStyle = col;
				ctx.beginPath(); ctx.arc(px, py, 7 * dpr, 0, Math.PI * 2); ctx.fill();
				ctx.restore();
				ctx.lineWidth = 2 * dpr; ctx.strokeStyle = "#fff";
				ctx.beginPath(); ctx.arc(px, py, 7 * dpr, 0, Math.PI * 2); ctx.stroke();
			}
		});

		this.drawCurve();
		this.renderBoard();
	},

	drawCurve: function () {
		const ctx = this.cctx, W = this.curve.width, H = this.curve.height;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const S = this.surfaces[this.key];
		ctx.clearRect(0, 0, W, H);
		const pad = 8 * dpr, left = 34 * dpr;
		const all = [];
		this.state.forEach((r) => r.losses.forEach((l) => all.push(Math.log10(Math.max(1e-6, l - S.fmin)))));
		const lo = Math.max(-6, Math.min.apply(null, all)), hi = Math.max.apply(null, all) + 0.1;
		const xs = (i) => left + i / Math.max(this.MAX_STEPS, 1) * (W - left - pad);
		const ys = (v) => pad + (hi - v) / (hi - lo + 1e-9) * (H - 2 * pad);
		ctx.strokeStyle = this.css("--mn-border", "#ccc");
		ctx.fillStyle = this.css("--mn-text-muted", "#888");
		ctx.lineWidth = 1;
		ctx.font = (10 * dpr) + "px system-ui, sans-serif";
		for (let e = Math.ceil(lo); e <= Math.floor(hi); e++) {
			const y = ys(e);
			ctx.globalAlpha = 0.5;
			ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(W - pad, y); ctx.stroke();
			ctx.globalAlpha = 1;
			ctx.fillText("1e" + e, 2 * dpr, y + 3 * dpr);
		}
		this.racers.forEach((rc, idx) => {
			const r = this.state[idx];
			ctx.strokeStyle = this.css(rc.color, "#888");
			ctx.lineWidth = 2 * dpr;
			ctx.beginPath();
			r.losses.forEach((l, i) => {
				const v = Math.log10(Math.max(1e-6, l - S.fmin));
				if (i) ctx.lineTo(xs(i), ys(v)); else ctx.moveTo(xs(i), ys(v));
			});
			ctx.stroke();
		});
	},

	renderBoard: function () {
		const S = this.surfaces[this.key];
		const order = this.state.map((r, i) => ({ r: r, rc: this.racers[i] }))
			.sort((a, b) => {
				const da = a.r.doneAt === null ? Infinity : a.r.doneAt, db = b.r.doneAt === null ? Infinity : b.r.doneAt;
				if (da !== db) return da - db;
				if (a.r.dead !== b.r.dead) return a.r.dead ? 1 : -1;
				return a.r.losses[a.r.losses.length - 1] - b.r.losses[b.r.losses.length - 1];
			});
		const medals = ["🥇", "🥈", "🥉"];
		this.el.board.innerHTML = order.map((o, i) => {
			const L = o.r.losses[o.r.losses.length - 1] - S.fmin;
			const st = o.r.dead ? '<span class="or-st is-dead">diverged 💥</span>'
				: o.r.doneAt !== null ? '<span class="or-st is-done">goal in ' + o.r.doneAt + " steps</span>"
				: '<span class="or-st">loss ' + (L < 0.001 ? L.toExponential(1) : L.toFixed(3)) + "</span>";
			return '<div class="or-row"><span class="or-medal">' + medals[i] + '</span><span class="or-dot" style="background:var(' + o.rc.color + ')"></span><b>' + o.rc.name + "</b>" + st + "</div>";
		}).join("");
		this.el.stepv.textContent = "step " + this.step + " / " + this.MAX_STEPS;
		this.narrate(order);
		window.dispatchEvent(new CustomEvent("optimizerrace:update"));
	},

	narrate: function (order) {
		const n = this.el.note;
		const lead = order[0];
		const anyDead = this.state.some((r) => r.dead);
		if (this.step === 0) {
			n.dataset.tone = "accent";
			n.innerHTML = "Press <b>Race</b> — or click anywhere on the map to start all three from there.";
		} else if (anyDead) {
			n.dataset.tone = "bad";
			n.innerHTML = "<b>Someone flew off the map.</b> A learning rate that is fine for one optimizer can be far too large for another — momentum, in particular, multiplies the effective step by up to 10×.";
		} else if (lead.r.doneAt !== null) {
			n.dataset.tone = "good";
			n.innerHTML = "<b>" + lead.rc.name + "</b> reached the minimum first, after " + lead.r.doneAt + " steps. Try another start point or learning rate — the ranking changes more often than you might expect.";
		} else {
			n.dataset.tone = "accent";
			n.innerHTML = "Racing… <b>" + lead.rc.name + "</b> currently has the lowest loss.";
		}
	}
};

async function loadOptimizerRaceModule() {
	if (typeof updateLoadingStatus === "function") updateLoadingStatus("Loading section about the optimizer race...");
	OptimizerRace.init();
}
