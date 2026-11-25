// Decoding Studio: temperature, top-k, top-p and min-p on a real-looking
// next-token distribution. All filters follow the definitions in the text:
//   1. softmax(z / T)            (T = 0 -> greedy)
//   2. top-k   keep rank < k
//   3. top-p   keep the smallest prefix whose mass reaches p
//   4. min-p   keep P(i) >= s * max P
//   5. renormalise the survivors and sample from them.

const DecodingStudio = {
	scenarios: {
		story: {
			prompt: "Once upon a time, there was a little",
			tokens: [
				["girl", 5.1], ["boy", 4.6], ["village", 3.6], ["mouse", 3.2],
				["prince", 3.0], ["dragon", 2.7], ["house", 2.3], ["bird", 2.0],
				["robot", 1.4], ["star", 1.1], ["fox", 0.9], ["cloud", 0.5],
				["teapot", -0.2], ["sock", -0.8], ["spreadsheet", -1.6], ["the", -2.5]
			]
		},
		fact: {
			prompt: "The capital of France is",
			tokens: [
				["Paris", 9.0], ["a", 4.2], ["the", 3.9], ["located", 3.1],
				["Lyon", 2.2], ["not", 1.8], ["Marseille", 1.2], ["one", 0.9],
				["home", 0.6], ["known", 0.4], ["Berlin", -0.4], ["Nice", -0.7],
				["Rome", -1.1], ["banana", -2.6], ["purple", -3.2], ["42", -3.9]
			]
		}
	},

	presets: {
		greedy:   { T: 0,    k: 0, p: 1,    mp: 0 },
		precise:  { T: 0.4,  k: 0, p: 1,    mp: 0 },
		chat:     { T: 0.7,  k: 0, p: 0.9,  mp: 0 },
		creative: { T: 1.1,  k: 0, p: 1,    mp: 0.05 },
		chaos:    { T: 2,    k: 0, p: 1,    mp: 0 }
	},

	root: null,
	scenario: "story",
	state: null,
	tally: null,
	draws: 0,
	generated: [],
	lastPick: null,

	init: function () {
		this.root = document.getElementById("decoding-studio");
		if (!this.root) return false;

		this.el = {};
		this.root.querySelectorAll("[data-ds]").forEach((node) => { this.el[node.dataset.ds] = node; });

		const n = this.scenarios[this.scenario].tokens.length;
		this.el.k.max = n;

		["T", "k", "p", "mp"].forEach((key) => {
			this.el[key].addEventListener("input", () => {
				this.markPreset(null);
				this.resetTally();
				this.update();
			});
		});

		this.root.querySelectorAll("[data-preset]").forEach((btn) => {
			btn.addEventListener("click", () => this.applyPreset(btn.dataset.preset));
		});
		this.root.querySelectorAll("[data-scenario]").forEach((btn) => {
			btn.addEventListener("click", () => this.setScenario(btn.dataset.scenario));
		});

		this.el.sample.addEventListener("click", () => this.sample(1));
		this.el.sample100.addEventListener("click", () => this.sample(200));
		this.el.reset.addEventListener("click", () => { this.generated = []; this.lastPick = null; this.resetTally(); this.update(); });

		this.buildRows();
		this.applyPreset("chat");
		return true;
	},

	setScenario: function (name) {
		if (!this.scenarios[name] || name === this.scenario) return;
		this.scenario = name;
		this.root.querySelectorAll("[data-scenario]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scenario === name)));
		this.generated = [];
		this.lastPick = null;
		this.resetTally();
		this.buildRows();
		this.update();
	},

	applyPreset: function (name) {
		const pr = this.presets[name];
		if (!pr) return;
		const n = this.scenarios[this.scenario].tokens.length;
		this.el.T.value = pr.T;
		this.el.k.value = pr.k === 0 ? n : pr.k;
		this.el.p.value = pr.p;
		this.el.mp.value = pr.mp;
		this.markPreset(name);
		this.resetTally();
		this.update();
	},

	markPreset: function (name) {
		this.root.querySelectorAll("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.preset === name)));
	},

	resetTally: function () {
		this.tally = new Array(this.scenarios[this.scenario].tokens.length).fill(0);
		this.draws = 0;
	},

	readSettings: function () {
		const n = this.scenarios[this.scenario].tokens.length;
		const k = parseInt(this.el.k.value, 10);
		return {
			T: parseFloat(this.el.T.value),
			k: k >= n ? 0 : k,
			p: parseFloat(this.el.p.value),
			mp: parseFloat(this.el.mp.value)
		};
	},

	compute: function (s) {
		const toks = this.scenarios[this.scenario].tokens;
		const z = toks.map((t) => t[1]);
		let raw;
		if (s.T <= 0) {
			const top = z.indexOf(Math.max.apply(null, z));
			raw = z.map((_, i) => (i === top ? 1 : 0));
		} else {
			const zMax = Math.max.apply(null, z);
			const e = z.map((v) => Math.exp((v - zMax) / s.T));
			const sum = e.reduce((a, b) => a + b, 0);
			raw = e.map((v) => v / sum);
		}

		// Tokens are stored sorted by logit, so rank === index.
		const pMax = raw[0];
		let cumBefore = 0;
		const rows = raw.map((pr, i) => {
			const cutK = s.k > 0 && i >= s.k;
			const cutP = s.p < 1 && cumBefore >= s.p;
			const cutM = s.mp > 0 && pr < s.mp * pMax;
			cumBefore += pr;
			let reason = null;
			if (cutK) reason = "top-k";
			else if (cutP) reason = "top-p";
			else if (cutM) reason = "min-p";
			return { token: toks[i][0], logit: toks[i][1], raw: pr, kept: !reason, reason: reason, final: 0 };
		});

		const keptMass = rows.reduce((a, r) => a + (r.kept ? r.raw : 0), 0);
		rows.forEach((r) => { r.final = r.kept && keptMass > 0 ? r.raw / keptMass : 0; });

		let H = 0;
		rows.forEach((r) => { if (r.final > 0) H -= r.final * Math.log2(r.final); });

		return {
			rows: rows,
			kept: rows.filter((r) => r.kept).length,
			cut: 1 - keptMass,
			H: H,
			eff: Math.pow(2, H),
			pMax: pMax
		};
	},

	buildRows: function () {
		const toks = this.scenarios[this.scenario].tokens;
		this.el.prompt.textContent = this.scenarios[this.scenario].prompt;
		this.el.k.max = toks.length;
		this.el.rows.innerHTML = "";
		this.rowEls = toks.map((t, i) => {
			const row = document.createElement("div");
			row.className = "ds-row";
			row.innerHTML =
				'<span class="ds-tok"></span>' +
				'<span class="ds-track">' +
					'<span class="ds-ghost"></span>' +
					'<span class="ds-bar"></span>' +
					'<span class="ds-emp"></span>' +
					'<span class="ds-thr"></span>' +
				'</span>' +
				'<span class="ds-pct mnlab-mono"></span>' +
				'<span class="ds-tag"></span>';
			row.querySelector(".ds-tok").textContent = t[0];
			row.style.setProperty("--i", i);
			this.el.rows.appendChild(row);
			return {
				row: row,
				ghost: row.querySelector(".ds-ghost"),
				bar: row.querySelector(".ds-bar"),
				emp: row.querySelector(".ds-emp"),
				thr: row.querySelector(".ds-thr"),
				pct: row.querySelector(".ds-pct"),
				tag: row.querySelector(".ds-tag")
			};
		});
		this.resetTally();
	},

	fmtPct: function (v) {
		if (v <= 0) return "0%";
		if (v < 0.001) return "<0.1%";
		return (v * 100).toFixed(v < 0.1 ? 1 : 0) + "%";
	},

	fillSlider: function (input) {
		const min = parseFloat(input.min), max = parseFloat(input.max), v = parseFloat(input.value);
		input.style.setProperty("--fill", ((v - min) / (max - min) * 100) + "%");
	},

	update: function () {
		const s = this.readSettings();
		const r = this.compute(s);
		this.current = r;

		["T", "k", "p", "mp"].forEach((key) => this.fillSlider(this.el[key]));
		this.setVal(this.el.Tv, s.T <= 0 ? "0 · greedy" : s.T.toFixed(2), false);
		this.setVal(this.el.kv, s.k === 0 ? "off" : String(s.k), s.k === 0);
		this.setVal(this.el.pv, s.p >= 1 ? "off" : s.p.toFixed(2), s.p >= 1);
		this.setVal(this.el.mpv, s.mp <= 0 ? "off" : s.mp.toFixed(2), s.mp <= 0);

		const scale = Math.max(r.rows[0].raw, r.rows.reduce((m, x) => Math.max(m, x.final), 0)) || 1;
		let boundaryDrawn = false;
		r.rows.forEach((row, i) => {
			const e = this.rowEls[i];
			e.row.classList.toggle("is-cut", !row.kept);
			e.row.classList.toggle("is-pick", this.lastPick === i);
			e.row.classList.toggle("is-nucleus-end", false);
			e.ghost.style.width = (row.raw / scale * 100) + "%";
			e.bar.style.width = (row.final / scale * 100) + "%";
			const emp = this.draws > 0 ? this.tally[i] / this.draws : 0;
			e.emp.style.width = (emp / scale * 100) + "%";
			e.emp.style.opacity = this.draws > 0 ? 1 : 0;
			e.pct.textContent = row.kept ? this.fmtPct(row.final) : this.fmtPct(row.raw);
			e.pct.title = "after temperature: " + this.fmtPct(row.raw) + " · after filters: " + this.fmtPct(row.final);
			e.tag.textContent = row.reason ? "✂ " + row.reason : (this.draws > 0 ? "seen " + this.fmtPct(emp) : "");
			e.tag.dataset.reason = row.reason || "";
			if (!boundaryDrawn && s.p < 1 && row.kept && (i + 1 >= r.rows.length || r.rows[i + 1].reason === "top-p")) {
				e.row.classList.add("is-nucleus-end");
				boundaryDrawn = true;
			}
		});

		const thrOn = s.mp > 0 && s.T > 0;
		const thrX = thrOn ? Math.min(100, s.mp * r.pMax / scale * 100) : 0;
		this.rowEls.forEach((e) => {
			e.thr.style.left = thrX.toFixed(2) + "%";
			e.thr.style.opacity = thrOn ? 1 : 0;
		});

		this.el.statKept.innerHTML = r.kept + " <small>/ " + r.rows.length + "</small>";
		this.el.statCut.textContent = this.fmtPct(r.cut);
		this.el.statH.innerHTML = r.H.toFixed(2) + " <small>bits</small>";
		this.el.statEff.textContent = r.eff.toFixed(1);

		this.renderStream();
		this.narrate(s, r);
	},

	setVal: function (node, text, off) {
		node.textContent = text;
		node.classList.toggle("is-off", !!off);
	},

	narrate: function (s, r) {
		const note = this.el.note;
		const junk = r.rows.filter((x) => x.kept && x.raw < 0.01).length;
		let tone = "accent", html;
		if (s.T <= 0) {
			tone = "warn";
			html = "<b>Greedy decoding.</b> Temperature 0 collapses the distribution onto the single most likely token: the output is fully deterministic. Great for facts, but it is exactly the setting that produces “the the the …” loops in long texts.";
		} else if (r.kept === 1) {
			tone = "warn";
			html = "<b>Only one candidate survives</b> the filters — this is greedy decoding in disguise, whatever the temperature says.";
		} else if (s.k > 0 && junk > 0) {
			tone = "bad";
			html = "<b>Top-k is blind to the shape of the distribution.</b> It keeps exactly " + s.k + " tokens, and " + junk + " of them had less than 1 % probability. Try the same settings on the other prompt — or use top-p / min-p, which adapt to how confident the model is.";
		} else if (s.T > 1.4 && s.p >= 1 && s.mp <= 0 && s.k === 0) {
			tone = "bad";
			html = "<b>Hot and unfiltered.</b> At T = " + s.T.toFixed(1) + " the tail is heavily inflated: nonsense like “" + r.rows[r.rows.length - 1].token + "” now has " + this.fmtPct(r.rows[r.rows.length - 1].raw) + ". Add a min-p of 0.05 and watch the junk disappear while the variety stays.";
		} else if (s.p < 1 && s.mp > 0) {
			tone = "warn";
			html = "<b>Filters compound.</b> Top-p and min-p are both active; the survivors are the tokens that pass <i>every</i> filter (" + r.kept + " left). Usually one filter is enough.";
		} else {
			tone = "good";
			html = "<b>" + r.kept + " candidates survive</b>, " + this.fmtPct(r.cut) + " of the probability mass was cut away. The model now behaves as if it were choosing between about <b>" + r.eff.toFixed(1) + "</b> equally likely words (2<sup>H</sup> with H = " + r.H.toFixed(2) + " bits).";
		}
		note.dataset.tone = tone;
		note.innerHTML = html;
	},

	draw: function () {
		const rows = this.current.rows;
		let u = Math.random();
		for (let i = 0; i < rows.length; i++) {
			if (!rows[i].kept) continue;
			u -= rows[i].final;
			if (u <= 0) return i;
		}
		for (let i = rows.length - 1; i >= 0; i--) if (rows[i].kept) return i;
		return 0;
	},

	sample: function (n) {
		let pick = 0;
		for (let j = 0; j < n; j++) {
			pick = this.draw();
			this.tally[pick]++;
			this.draws++;
		}
		this.lastPick = pick;
		this.generated.push(pick);
		if (this.generated.length > 12) this.generated.shift();
		this.update();
		const e = this.rowEls[pick];
		e.row.classList.remove("is-flash");
		void e.row.offsetWidth;
		e.row.classList.add("is-flash");
		this.el.drawCount.textContent = this.draws > 0 ? this.draws + (this.draws === 1 ? " draw" : " draws") + " so far — the thin orange line under each bar shows how often that word was actually picked" : "";
	},

	renderStream: function () {
		const toks = this.scenarios[this.scenario].tokens;
		const last = this.lastPick === null ? null : toks[this.lastPick][0];
		this.el.next.textContent = last === null ? "▁▁▁" : last;
		this.el.next.classList.toggle("is-empty", last === null);
		this.el.history.innerHTML = "";
		this.generated.slice().reverse().forEach((idx, j) => {
			const chip = document.createElement("span");
			chip.className = "ds-hist";
			chip.style.opacity = Math.max(0.25, 1 - j * 0.08);
			chip.textContent = toks[idx][0];
			this.el.history.appendChild(chip);
		});
		if (!this.draws) this.el.drawCount.textContent = "";
	}
};

async function loadSamplingLabModule() {
	updateLoadingStatus("Loading section about Temperature & Sampling...");
	DecodingStudio.init();
	return Promise.resolve();
}
