// Lab challenges: small goals inside the interactive labs, plus the
// catalog of all of them (MNChallengeCatalog) that the progress overview
// lists on every page. Each check() runs after its lab updates; progress
// is stored by MNQuest (modules/quests.js).

(function () {
	"use strict";

	// The labs declare `const X = {…}` at top level: global, but not on window.
	const G = {
		ds: () => (typeof DecodingStudio !== "undefined" ? DecodingStudio : null),
		sl: () => (typeof SlopeLab !== "undefined" ? SlopeLab : null),
		rl: () => (typeof RegressionLossLab !== "undefined" ? RegressionLossLab : null),
		ce: () => (typeof CrossEntropyLab !== "undefined" ? CrossEntropyLab : null),
		gh: () => (typeof ResNetLab !== "undefined" ? ResNetLab : null),
		or: () => (typeof OptimizerRace !== "undefined" ? OptimizerRace : null),
		nn: () => (typeof NNPlayground !== "undefined" ? NNPlayground : null),
		cv: () => (typeof ConvStudio !== "undefined" ? ConvStudio : null),
		fg: () => (typeof FogGame !== "undefined" ? FogGame : null)
	};

	// Per-lab memory for event-based goals (reset with the challenges).
	const mem = { trained: false, crossings: 0, lastSign: 0, ceHigh: false, scanned: false, fog: null };
	window.addEventListener("mnquest:reset", () => {
		mem.trained = false; mem.crossings = 0; mem.lastSign = 0; mem.ceHigh = false; mem.scanned = false; mem.fog = null;
	});

	const est = (L) => { const F = L.landscapes[L.key]; const h = L.h(); return { sec: (F.f(L.x + h) - F.f(L.x)) / h, tru: F.df(L.x) }; };

	const LABS = [
		{
			root: "decoding-studio", obj: G.ds, hooks: ["update"], icon: "🎲", title: "Decoding Studio", lesson: "samplinglab",
			items: [
				{ id: "ds-greedy-disguise", xp: 40, text: "<b>Greedy in disguise:</b> keep T ≥ 0.8, use <i>only</i> top-p, and leave exactly one candidate.",
					check: (L) => { const s = L.readSettings(); return s.T >= 0.8 && s.k === 0 && s.mp <= 0 && s.p < 1 && L.current.kept === 1; } },
				{ id: "ds-junk-filter", xp: 40, text: "<b>Junk filter:</b> on the open story at T ≥ 1.5, cut “teapot”, “sock”, “spreadsheet” and “the” while at least 5 words survive.",
					check: (L) => {
						const s = L.readSettings();
						if (L.scenario !== "story" || s.T < 1.5 || L.current.kept < 5) return false;
						return L.current.rows.filter((r) => ["teapot", "sock", "spreadsheet", "the"].indexOf(r.token) >= 0).every((r) => !r.kept);
					} },
				{ id: "ds-blind-spot", xp: 30, text: "<b>Top-k's blind spot:</b> on the factual prompt, let top-k admit a word with less than 0.1 % probability.",
					check: (L) => { const s = L.readSettings(); return L.scenario === "fact" && s.k > 1 && L.current.rows.some((r) => r.kept && r.raw < 0.001); } },
				{ id: "ds-large-numbers", xp: 30, text: "<b>Law of large numbers:</b> draw at least 1000 times until every observed frequency is within 2 points of its probability.",
					check: (L) => L.draws >= 1000 && L.current.rows.every((r, i) => Math.abs(L.tally[i] / L.draws - r.final) < 0.02) }
			]
		},
		{
			root: "slope-lab", obj: G.sl, hooks: ["update"], icon: "📉", title: "Slope Explorer", lesson: "derivativelab",
			items: [
				{ id: "sl-global", xp: 40, text: "<b>Global champion:</b> on “Two valleys”, let gradient descent (not the slider) bring the ball to the <i>deeper</i> valley.",
					check: (L) => L.key === "hills" && L.trail.length > 0 && Math.abs(L.x + 1.4955) < 0.05 && Math.abs(est(L).tru) < 0.05 },
				{ id: "sl-diverge", xp: 30, text: "<b>Overshoot:</b> make gradient descent on the valley x² blow up.",
					check: (L) => L.key === "valley" && L.status === "diverged" },
				{ id: "sl-precision", xp: 30, text: "<b>Precision probe:</b> on the waves, get the slope estimate within 0.001 of the true derivative where the slope is steeper than 0.5.",
					check: (L) => { const e = est(L); return L.key === "waves" && Math.abs(e.tru) > 0.5 && Math.abs(e.sec - e.tru) < 1e-3; } },
				{ id: "sl-fooled", xp: 30, text: "<b>Fooled:</b> find a spot where the secant says “flat” although the true slope is steeper than 0.5.",
					check: (L) => { const e = est(L); return Math.abs(e.sec) < 0.02 && Math.abs(e.tru) > 0.5; } }
			]
		},
		{
			root: "fog-game", obj: G.fg, hooks: ["update"], icon: "🌫️", title: "Foggy Mountain", lesson: "derivativelab",
			setup: () => window.addEventListener("foggame:finish", (e) => { mem.fog = Object.assign({}, e.detail, { slopes: G.fg() ? G.fg().showSlopes : true }); if (G.fg()) G.fg().update(); }),
			items: [
				{ id: "fg-beat", xp: 30, text: "<b>Beat the machine:</b> finish a round with a higher score than gradient descent.", check: () => !!mem.fog && mem.fog.score > mem.fog.gd },
				{ id: "fg-three", xp: 30, text: "<b>Valley found:</b> earn 3 stars.", check: () => !!mem.fog && mem.fog.stars === 3 },
				{ id: "fg-blind", xp: 50, text: "<b>Blindfolded:</b> earn 3 stars with the slope arrows switched off.", check: () => !!mem.fog && mem.fog.stars === 3 && !mem.fog.slopes }
			]
		},
		{
			root: "mse-lab", obj: G.rl, hooks: ["update"], icon: "🎯", title: "The Loss Bowl", lesson: "losslab",
			setup: (R) => {
				const orig = R.step;
				R.step = function () {
					const y = parseFloat(this.el.y.value);
					const r = orig.apply(this, arguments);
					mem.trained = true;
					const s = Math.sign(y - parseFloat(this.el.yh.value));
					if (this.mode === "mae" && mem.lastSign && s && s !== mem.lastSign) mem.crossings++;
					if (s) mem.lastSign = s;
					return r;
				};
				R.root.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { mem.crossings = 0; mem.lastSign = 0; }));
			},
			items: [
				{ id: "ll-bullseye", xp: 30, text: "<b>Bull's-eye:</b> with squared error, let training (not the slider) bring the loss below 0.0001.",
					check: (R) => { const e = parseFloat(R.el.y.value) - parseFloat(R.el.yh.value); return R.mode === "mse" && mem.trained && e * e < 1e-4; } },
				{ id: "ll-pingpong", xp: 30, text: "<b>Ping-pong:</b> with absolute error, make the guess jump across the truth 3 times.",
					check: (R) => R.mode === "mae" && mem.crossings >= 3 }
			]
		},
		{
			root: "ce-lab", obj: G.ce, hooks: ["update"], icon: "🐱", title: "Cross-Entropy Playground", lesson: "losslab",
			items: [
				{ id: "ce-bird", xp: 30, text: "<b>Bird whisperer:</b> make 🐦 the truth and get the model above 95 % confidence.",
					check: (C) => C.target === 2 && C.softmax(C.logits())[2] > 0.95 },
				{ id: "ce-surprise", xp: 30, text: "<b>Confidently wrong:</b> push the loss above 5 (the model gives the truth less than 0.7 %).",
					check: (C) => -Math.log(C.softmax(C.logits())[C.target]) > 5 },
				{ id: "ce-recover", xp: 40, text: "<b>Comeback:</b> start from a loss above 3 and train until the model is correct and above 90 % sure.",
					check: (C) => {
						const p = C.softmax(C.logits());
						if (-Math.log(p[C.target]) > 3) mem.ceHigh = true;
						return mem.ceHigh && C.history.length > 0 && p[C.target] > 0.9;
					} }
			]
		},
		{
			root: "gradient-highway", obj: G.gh, hooks: ["update"], icon: "🛣️", title: "The Gradient Highway", lesson: "resnetlab", needs: (L) => !!L.el,
			items: [
				{ id: "gh-deadzone", xp: 30, text: "<b>Dead zone:</b> with at most 40 layers, push the plain gradient below 10⁻⁶ while the residual one stays between 0.1 and 10.",
					check: (L) => { const d = parseInt(L.el.depth.value, 10), s = L.simulate(d, parseFloat(L.el.gain.value)); return d <= 40 && s.plain[0] < 1e-6 && s.res[0] > 0.1 && s.res[0] < 10; } },
				{ id: "gh-explode", xp: 30, text: "<b>Explosion:</b> make the plain network's gradient grow above 1000.",
					check: (L) => L.simulate(parseInt(L.el.depth.value, 10), parseFloat(L.el.gain.value)).plain[0] > 1e3 },
				{ id: "gh-edge", xp: 50, text: "<b>Edge of chaos:</b> 100 plain layers whose gradient still lands between 0.01 and 100 — it takes a very fine touch.",
					check: (L) => { const d = parseInt(L.el.depth.value, 10), s = L.simulate(d, parseFloat(L.el.gain.value)); return d >= 100 && s.plain[0] > 0.01 && s.plain[0] < 100; } }
			]
		},
		{
			root: "optimizer-race", obj: G.or, hooks: ["renderBoard"], icon: "🏁", title: "Optimizer Race", lesson: "optimizerlab",
			items: [
				{ id: "or-crash", xp: 30, text: "<b>Crash test:</b> make at least one optimizer diverge.", check: (R) => R.state.some((r) => r.dead) },
				{ id: "or-escape", xp: 30, text: "<b>Escape artist:</b> on the bumpy field, get momentum to the centre ⭐.", check: (R) => R.key === "bumpy" && R.state[1].doneAt !== null },
				{ id: "or-banana", xp: 40, text: "<b>Banana split:</b> find a learning rate at which all three reach the banana's minimum.", check: (R) => R.key === "banana" && R.state.every((r) => r.doneAt !== null) },
				{ id: "or-underdog", xp: 50, text: "<b>Underdog:</b> let plain SGD win a race outright.",
					check: (R) => {
						const done = R.state.filter((r) => r.doneAt !== null).sort((a, b) => a.doneAt - b.doneAt);
						return done.length > 0 && done[0].id === "sgd" && (done.length === 1 || done[1].doneAt > done[0].doneAt);
					} }
			]
		},
		{
			root: "nn-playground", obj: G.nn, hooks: ["renderStats"], icon: "🕸️", title: "Neural Network Playground", lesson: "deeplearninglab",
			items: [
				{ id: "nn-feature-magic", xp: 40, text: "<b>Feature magic:</b> solve the circle (≥ 95 % test accuracy) with <i>no hidden layer at all</i>.",
					check: (N) => N.dataset === "circle" && N.hidden.length === 0 && N.last && N.last.te.acc >= 0.95 },
				{ id: "nn-xor-mini", xp: 40, text: "<b>XOR minimalist:</b> solve XOR (≥ 95 %) with only x₁, x₂ as inputs and at most 3 hidden neurons in total.",
					check: (N) => {
						const n = N.hidden.reduce((a, b) => a + b, 0);
						const feats = Object.keys(N.feats).filter((k) => N.feats[k]).sort().join(",");
						return N.dataset === "xor" && feats === "x,y" && n > 0 && n <= 3 && N.last && N.last.te.acc >= 0.95;
					} },
				{ id: "nn-spiral", xp: 50, text: "<b>Spiral tamer:</b> reach ≥ 90 % test accuracy on the spiral.",
					check: (N) => N.dataset === "spiral" && N.last && N.last.te.acc >= 0.9 },
				{ id: "nn-overfit", xp: 40, text: "<b>Overfit on purpose:</b> with ≥ 40 % noise, get the training loss below 0.15 while the test loss is at least 0.3 higher.",
					check: (N) => N.noise >= 0.4 && N.last && N.last.tr.loss < 0.15 && N.last.te.loss - N.last.tr.loss >= 0.3 }
			]
		},
		{
			root: "conv-studio", obj: G.cv, hooks: ["compute"], icon: "🎨", title: "Convolution Studio", lesson: "computer_vision",
			setup: () => window.addEventListener("convstudio:scanned", () => { mem.scanned = true; if (G.cv()) G.cv().compute(); }),
			items: [
				{ id: "cv-copycat", xp: 30, text: "<b>Copycat:</b> type a kernel by hand (no preset) whose feature map is an exact copy of the image.",
					check: (C) => C.preset === null && !C.relu && C.img.some((v) => v) && C.out.every((v, i) => Math.abs(v - C.img[i]) < 1e-9) },
				{ id: "cv-negative", xp: 30, text: "<b>Photo negative:</b> build a kernel whose output is exactly the negative of the image.",
					check: (C) => !C.relu && C.img.some((v) => v) && C.out.every((v, i) => Math.abs(v + C.img[i]) < 1e-9) },
				{ id: "cv-edge", xp: 40, text: "<b>Edge hunter:</b> on the filled square, design your own kernel (no preset) that gives 0 inside the square but responds at its border.",
					check: (C) => {
						const sum = C.kernel.reduce((a, b) => a + b, 0);
						if (C.preset !== null || C.img.filter((v) => v).length !== 100 || Math.abs(sum) > 1e-9 || C.kernel.every((k) => k === 0)) return false;
						return C.out[7 * 16 + 7] === 0 && C.out.some((v) => Math.abs(v) > 1e-9);
					} },
				{ id: "cv-scan", xp: 20, text: "<b>Full scan:</b> watch the kernel slide over all 256 positions.", check: () => mem.scanned }
			]
		}
	];

	const isDone = (c) => (window.MNQuest ? window.MNQuest.done("challenge-" + c.id) : !!c._done);

	window.MNChallengeCatalog = {
		labs: () => LABS,
		total: () => LABS.reduce((s, l) => s + l.items.length, 0),
		doneCount: () => LABS.reduce((s, l) => s + l.items.filter(isDone).length, 0)
	};

	function register(lab, obj) {
		const root = document.getElementById(lab.root);
		if (!root || root.querySelector(".mnc")) return;
		const box = document.createElement("div");
		box.className = "mnc";
		box.innerHTML = '<div class="mnc-head"><span class="mnc-title">🏆 Challenges</span><span class="mnc-count"></span></div><ul class="mnc-list"></ul>';
		const ul = box.querySelector(".mnc-list");
		const items = lab.items.map((c) => {
			const li = document.createElement("li");
			li.className = "mnc-item";
			li.innerHTML = '<span class="mnc-check" aria-hidden="true"></span><span class="mnc-text">' + c.text + '</span><span class="mnc-xp">+' + c.xp + " XP</span>";
			ul.appendChild(li);
			return { c: c, li: li };
		});
		root.appendChild(box);

		function paint() {
			let n = 0;
			items.forEach((it) => {
				const d = isDone(it.c);
				it.li.classList.toggle("is-done", d);
				it.li.querySelector(".mnc-check").textContent = d ? "✓" : "";
				if (d) n++;
			});
			box.querySelector(".mnc-count").textContent = n + " / " + items.length;
			box.classList.toggle("is-complete", n === items.length);
		}

		let busy = false;
		function evaluate() {
			if (busy) return;
			busy = true;
			try {
				items.forEach((it) => {
					if (isDone(it.c)) return;
					let ok = false;
					try { ok = !!it.c.check(obj); } catch (e) { ok = false; }
					if (!ok) return;
					it.c._done = true;
					const name = it.c.text.replace(/<[^>]+>/g, "").replace(/:.*$/, "");
					if (window.MNQuest) {
						window.MNQuest.xp(it.c.xp, "· challenge: " + name, "challenge-" + it.c.id);
						window.MNQuest.count("challenges");
						if (lab.root === "nn-playground" && lab.items.every(isDone)) window.MNQuest.unlock("architect");
					}
					it.li.classList.add("is-new");
					setTimeout(() => it.li.classList.remove("is-new"), 900);
					window.dispatchEvent(new CustomEvent("mnchallenge:done", { detail: { id: it.c.id, root: root } }));
				});
				paint();
			} finally {
				busy = false;
			}
		}

		if (lab.setup) lab.setup(obj);
		lab.hooks.forEach((method) => {
			const orig = obj[method];
			if (typeof orig !== "function" || orig._mncWrapped) return;
			const wrapped = function () {
				const r = orig.apply(this, arguments);
				setTimeout(evaluate, 0);
				return r;
			};
			wrapped._mncWrapped = true;
			obj[method] = wrapped;
		});
		window.addEventListener("mnquest:reset", () => { items.forEach((it) => { it.c._done = false; }); paint(); });
		window.addEventListener("mnquest:change", paint);
		paint();
		evaluate();
		lab._wired = true;
	}

	function boot() {
		let pending = 0;
		LABS.forEach((lab) => {
			if (lab._wired || !document.getElementById(lab.root)) return;
			const obj = lab.obj();
			if (!obj || !obj.root || (lab.needs && !lab.needs(obj))) { pending++; return; }
			register(lab, obj);
		});
		return pending === 0;
	}

	window.MNLabChallenges = { boot: boot };

	// Labs initialise asynchronously (module loader, lazy observers on
	// scroll): keep looking, cheaply, until every lab on the page is wired.
	function start() {
		if (!LABS.some((l) => document.getElementById(l.root))) return;
		const timer = setInterval(() => { if (boot()) clearInterval(timer); }, 1000);
		boot();
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
	else start();
	window.addEventListener("blogPostLoadComplete", boot);
})();
