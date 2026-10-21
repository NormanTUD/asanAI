// Foggy Mountain: find the lowest point of a hidden loss curve with a
// limited number of probes. Each probe reveals the height and the local
// slope — exactly the information gradient descent gets.

const FogGame = {
	PROBES: 8,
	X0: 0,
	X1: 10,
	round: 0,

	init: function () {
		this.root = document.getElementById("fog-game");
		if (!this.root) return false;
		this.el = {};
		this.root.querySelectorAll("[data-fg]").forEach((n) => { this.el[n.dataset.fg] = n; });
		this.ctx = this.el.canvas.getContext("2d");
		this.el.canvas.addEventListener("click", (e) => {
			if (this.over) return;
			const r = this.el.canvas.getBoundingClientRect();
			const x = this.X0 + (e.clientX - r.left) / r.width * (this.X1 - this.X0);
			this.probe(x);
		});
		this.el.canvas.addEventListener("pointermove", (e) => {
			const r = this.el.canvas.getBoundingClientRect();
			this.cursor = (e.clientX - r.left) / r.width;
			if (!this.over) this.draw();
		});
		this.el.canvas.addEventListener("pointerleave", () => { this.cursor = null; this.draw(); });
		this.el.next.addEventListener("click", () => this.newRound());
		this.el.reveal.addEventListener("click", () => this.finish());
		this.el.slopes.addEventListener("click", () => {
			this.showSlopes = !this.showSlopes;
			this.el.slopes.setAttribute("aria-pressed", String(this.showSlopes));
			this.draw();
		});
		this.showSlopes = true;
		if (window.MNQuest && window.MNQuest.getBest) this.best = window.MNQuest.getBest("fog");
		window.addEventListener("mnquest:reset", () => { this.best = undefined; this.update(); });
		if (window.ResizeObserver) {
			let raf = 0;
			new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => this.resize()); }).observe(this.root);
		}
		if (window.__MN_DARK && window.__MN_DARK.onChange) window.__MN_DARK.onChange(() => this.draw());
		this.newRound();
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

	newRound: function () {
		this.round++;
		const r = this.rng(Date.now() % 1e9);
		const c = 2 + r() * 6;
		const wells = [];
		const n = 3 + Math.floor(r() * 3);
		for (let k = 0; k < n; k++) wells.push({ m: 0.6 + r() * 8.8, a: 0.6 + r() * 1.6, s: 0.25 + r() * 0.6 });
		this.f = (x) => 0.045 * (x - c) * (x - c) - wells.reduce((s, w) => s + w.a * Math.exp(-(x - w.m) * (x - w.m) / (2 * w.s * w.s)), 0);
		this.df = (x) => 0.09 * (x - c) + wells.reduce((s, w) => s + w.a * (x - w.m) / (w.s * w.s) * Math.exp(-(x - w.m) * (x - w.m) / (2 * w.s * w.s)), 0);
		let lo = Infinity, hi = -Infinity, xmin = 0;
		for (let x = this.X0; x <= this.X1; x += 0.002) {
			const v = this.f(x);
			if (v < lo) { lo = v; xmin = x; }
			if (v > hi) hi = v;
		}
		this.lo = lo; this.hi = hi; this.xmin = xmin;
		this.probes = [];
		this.over = false;
		this.el.result.innerHTML = "";
		this.el.reveal.disabled = true;
		this.update();
	},

	probe: function (x) {
		if (this.probes.length >= this.PROBES) return;
		x = Math.max(this.X0, Math.min(this.X1, x));
		this.probes.push({ x: x, y: this.f(x), d: this.df(x), t: performance.now() });
		this.el.reveal.disabled = false;
		this.update();
		if (this.probes.length >= this.PROBES) setTimeout(() => this.finish(), 450);
	},

	// Gradient descent with the same budget: start at a random point, then
	// use each further evaluation for one step.
	rivals: function () {
		const r = this.rng(this.round * 31 + 7);
		let x = this.X0 + r() * (this.X1 - this.X0);
		let best = this.f(x);
		const lr = 0.25, path = [x];
		for (let k = 1; k < this.PROBES; k++) {
			x = Math.max(this.X0, Math.min(this.X1, x - lr * this.df(x)));
			path.push(x);
			best = Math.min(best, this.f(x));
		}
		let rnd = Infinity;
		const rr = this.rng(this.round * 17 + 3);
		for (let k = 0; k < this.PROBES; k++) rnd = Math.min(rnd, this.f(this.X0 + rr() * (this.X1 - this.X0)));
		return { gd: best, gdPath: path, rnd: rnd };
	},

	score: function (v) { return Math.max(0, Math.round(100 * (1 - (v - this.lo) / (this.hi - this.lo)))); },

	finish: function () {
		if (this.over || !this.probes.length) return;
		this.over = true;
		this.revealT = performance.now();
		const mine = Math.min(...this.probes.map((p) => p.y));
		const R = this.rivals();
		this.rivalData = R;
		const s = this.score(mine), sg = this.score(R.gd), sr = this.score(R.rnd);
		const stars = s >= 98 ? 3 : s >= 90 ? 2 : s >= 75 ? 1 : 0;
		let pb = null;
		if (window.MNQuest) {
			const b = window.MNQuest.best("fog", s);
			if (b.isNew && b.previous !== undefined) pb = b.previous;
			this.best = b.best;
		} else {
			this.best = Math.max(this.best || 0, s);
		}
		const rows = [["You", s, "--mn-accent"], ["Gradient descent", sg, "--mn-emerald"], ["Random guessing", sr, "--mn-text-muted"]]
			.sort((a, b) => b[1] - a[1])
			.map((r) => '<div class="fg-row"><span class="fg-dot" style="background:var(' + r[2] + ')"></span><b>' + r[0] + '</b><span class="fg-bar"><i style="width:' + r[1] + "%;background:var(" + r[2] + ')"></i></span><span class="fg-num">' + r[1] + "</span></div>").join("");
		this.el.result.innerHTML =
			'<div class="fg-stars" aria-label="' + stars + ' of 3 stars">' + [0, 1, 2].map((k) => '<span class="' + (k < stars ? "is-on" : "") + '">★</span>').join("") + "</div>" +
			'<div class="fg-res">' + rows + "</div>" +
			'<p class="fg-verdict">' + (s >= 98 ? "You found the global minimum." : s >= sg ? "You beat gradient descent — it rolled into the nearest valley and stayed there." : "Gradient descent did better this time. Using the slope arrows pays off.") +
			(pb !== null ? " <b>New personal best!</b>" : "") + "</p>";
		if (window.MNQuest) {
			const d = new Date(), day = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
			if (stars > 0) window.MNQuest.xp(stars * 10, "· foggy mountain, " + stars + "★", "fog-" + day + "-" + stars);
			if (stars === 3) window.MNQuest.count("fog3");
		}
		window.dispatchEvent(new CustomEvent("foggame:finish", { detail: { score: s, gd: sg, stars: stars } }));
		const anim = () => { this.draw(); if (this.over && performance.now() - this.revealT < 1200) requestAnimationFrame(anim); };
		requestAnimationFrame(anim);
		this.update();
	},

	update: function () {
		const left = this.PROBES - this.probes.length;
		this.el.left.innerHTML = Array.from({ length: this.PROBES }, (_, k) => '<span class="fg-pip' + (k < left ? "" : " is-used") + '"></span>').join("");
		const best = this.probes.length ? Math.min(...this.probes.map((p) => p.y)) : null;
		this.el.bestv.textContent = best === null ? "–" : best.toFixed(2);
		this.el.pb.textContent = this.best === undefined ? "–" : String(this.best);
		this.el.roundv.textContent = String(this.round);
		this.draw();
	},

	resize: function () {
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const w = Math.max(240, this.el.canvas.parentNode.clientWidth);
		const h = Math.round(Math.min(340, Math.max(220, w * 0.45)));
		this.el.canvas.width = Math.round(w * dpr); this.el.canvas.height = Math.round(h * dpr);
		this.el.canvas.style.height = h + "px";
		this.draw();
	},

	css: function (n, fb) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb; },

	draw: function () {
		if (!this.ctx || !this.f) return;
		const ctx = this.ctx, W = this.el.canvas.width, H = this.el.canvas.height;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const pad = 18 * dpr;
		const X = (x) => (x - this.X0) / (this.X1 - this.X0) * W;
		const Y = (y) => pad + (this.hi + 0.2 - y) / (this.hi - this.lo + 0.4) * (H - 2 * pad);
		const dark = document.documentElement.classList.contains("dark");
		ctx.clearRect(0, 0, W, H);

		// ground fill + curve
		const curve = () => {
			ctx.beginPath();
			for (let i = 0; i <= 400; i++) { const x = this.X0 + i / 400 * (this.X1 - this.X0); const px = X(x), py = Y(this.f(x)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
		};
		const ground = ctx.createLinearGradient(0, 0, 0, H);
		ground.addColorStop(0, dark ? "rgba(99,102,241,.35)" : "rgba(99,102,241,.22)");
		ground.addColorStop(1, dark ? "rgba(14,165,233,.08)" : "rgba(14,165,233,.05)");
		const reveal = this.over ? Math.min(1, (performance.now() - this.revealT) / 1000) : 0;
		const lanterns = this.probes.map((p) => ({ x: X(p.x), r: 34 * dpr }));

		ctx.save();
		if (!this.over) {
			ctx.beginPath();
			lanterns.forEach((l) => { ctx.moveTo(l.x + l.r, 0); ctx.rect(l.x - l.r, 0, 2 * l.r, H); });
			ctx.clip();
		} else {
			ctx.beginPath(); ctx.rect(0, 0, W * reveal, H);
			lanterns.forEach((l) => ctx.rect(l.x - l.r, 0, 2 * l.r, H));
			ctx.clip();
		}
		curve(); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = ground; ctx.fill();
		curve(); ctx.strokeStyle = this.css("--mn-accent", "#6366f1"); ctx.lineWidth = 3 * dpr; ctx.stroke();
		ctx.restore();

		// fog
		if (!this.over || reveal < 1) {
			const fog = ctx.createLinearGradient(0, 0, 0, H);
			fog.addColorStop(0, dark ? "rgba(148,163,184,.10)" : "rgba(120,110,90,.08)");
			fog.addColorStop(1, dark ? "rgba(148,163,184,.22)" : "rgba(120,110,90,.16)");
			ctx.fillStyle = fog;
			ctx.fillRect(this.over ? W * reveal : 0, 0, W, H);
		}

		// cursor guide
		if (!this.over && this.cursor !== null && this.cursor !== undefined && this.probes.length < this.PROBES) {
			ctx.strokeStyle = this.css("--mn-text-muted", "#888"); ctx.setLineDash([4 * dpr, 4 * dpr]); ctx.lineWidth = 1 * dpr;
			ctx.beginPath(); ctx.moveTo(this.cursor * W, 0); ctx.lineTo(this.cursor * W, H); ctx.stroke(); ctx.setLineDash([]);
		}

		// gradient-descent rival path after reveal
		if (this.over && this.rivalData) {
			const pth = this.rivalData.gdPath;
			ctx.strokeStyle = this.css("--mn-emerald", "#059669"); ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2 * dpr;
			ctx.beginPath();
			pth.forEach((x, i) => { const px = X(x), py = Y(this.f(x)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
			ctx.globalAlpha = reveal; ctx.stroke();
			pth.forEach((x) => { ctx.beginPath(); ctx.arc(X(x), Y(this.f(x)), 3.5 * dpr, 0, Math.PI * 2); ctx.fill(); });
			ctx.globalAlpha = 1;
			ctx.font = (16 * dpr) + "px system-ui, sans-serif"; ctx.textAlign = "center";
			ctx.globalAlpha = reveal; ctx.fillText("⭐", X(this.xmin), Y(this.lo) + 6 * dpr); ctx.globalAlpha = 1;
		}

		// probes
		const bestY = this.probes.length ? Math.min(...this.probes.map((p) => p.y)) : null;
		this.probes.forEach((p, k) => {
			const px = X(p.x), py = Y(p.y);
			if (this.showSlopes) {
				const dx = 0.45, ax = X(p.x - dx), bx = X(p.x + dx), ay = Y(p.y - p.d * dx), by = Y(p.y + p.d * dx);
				ctx.strokeStyle = this.css("--mn-coral", "#f97316"); ctx.lineWidth = 2.5 * dpr;
				ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
				// downhill arrow
				const dir = p.d > 0 ? -1 : 1, mag = Math.min(1, Math.abs(p.d) / 2);
				if (Math.abs(p.d) > 0.05) {
					const tx = px + dir * (14 + 18 * mag) * dpr;
					ctx.beginPath(); ctx.moveTo(px + dir * 9 * dpr, py - 14 * dpr); ctx.lineTo(tx, py - 14 * dpr);
					ctx.lineTo(tx - dir * 5 * dpr, py - 18 * dpr); ctx.moveTo(tx, py - 14 * dpr); ctx.lineTo(tx - dir * 5 * dpr, py - 10 * dpr);
					ctx.lineWidth = 2 * dpr; ctx.stroke();
				}
			}
			const isBest = p.y === bestY;
			const age = Math.min(1, (performance.now() - p.t) / 300);
			ctx.beginPath(); ctx.arc(px, py, (isBest ? 8 : 6) * dpr * (0.6 + 0.4 * age), 0, Math.PI * 2);
			ctx.fillStyle = isBest ? this.css("--mn-accent", "#6366f1") : this.css("--mn-heading", "#111");
			ctx.fill(); ctx.lineWidth = 2.5 * dpr; ctx.strokeStyle = this.css("--mn-surface", "#fff"); ctx.stroke();
			ctx.fillStyle = this.css("--mn-text-secondary", "#666"); ctx.font = (10 * dpr) + "px system-ui, sans-serif"; ctx.textAlign = "center";
			ctx.fillText(String(k + 1), px, py + 20 * dpr);
			if (age < 1) this.animating = true;
		});
		// One pending frame at most, however many probes are still popping in.
		if (this.animating && !this._raf) {
			this._raf = requestAnimationFrame(() => { this._raf = 0; this.animating = false; this.draw(); });
		}
	}
};

async function loadFogGameModule() {
	if (typeof updateLoadingStatus === "function") updateLoadingStatus("Loading section about the foggy mountain game...");
	FogGame.init();
}
