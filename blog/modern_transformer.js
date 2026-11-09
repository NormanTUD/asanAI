/* Interactive forward-pass lab for the modern transformer block. */

function loadModernTransformerModule() {
	"use strict";

	const TOKENS = ["the", "cat", "sat", "down"];
	const VOCAB = ["the", "cat", "sat", "down", "runs", "mat", "a", "."];
	const D = 8, HEADS = 2, DH = 4, DFF = 16, EPS = 1e-6;
	const S = { norm: "rms", pos: "rope", attn: "gqa", ffn: "swiglu", final: "on", head: "untied", qk: "on", bias: "off" };

	function cssVar(name, fallback) {
		const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
		return v || fallback;
	}
	function colors() {
		return {
			ink: cssVar("--mn-text", "#0f172a"),
			muted: cssVar("--mn-text-secondary", "#475569"),
			surface: cssVar("--mn-surface", "#ffffff"),
			border: cssVar("--mn-border", "#cbd5e1"),
			blue: "#3b82f6",
			green: "#10b981",
			amber: "#f59e0b",
			rose: "#f43f5e",
		};
	}
	function seedRandom(seed) {
		let s = seed >>> 0;
		return function () {
			s = (s * 1664525 + 1013904223) >>> 0;
			return s / 4294967296;
		};
	}
	const rng = seedRandom(20250308);
	function randn() { return (rng() * 2 - 1); }
	function matrix(rows, cols) { return Array.from({ length: rows }, () => Array.from({ length: cols }, () => randn() * 0.45)); }
	function vector(n) { return Array.from({ length: n }, () => randn() * 0.2); }
	function zeros(n) { return new Array(n).fill(0); }

	const EMB = VOCAB.map(() => vector(D));
	const GAMMA = new Array(D).fill(1);
	const BETA = zeros(D);
	const QW = matrix(D, HEADS * DH);
	const KW = matrix(D, HEADS * DH);
	const VW = matrix(D, HEADS * DH);
	const OW = matrix(HEADS * DH, D);
	const QB = vector(HEADS * DH);
	const KB = vector(HEADS * DH);
	const VB = vector(HEADS * DH);
	const OB = vector(D);
	const W1 = matrix(D, DFF);
	const W3 = matrix(D, DFF);
	const W2 = matrix(DFF, D);
	const W1B = matrix(D, DFF);
	const W3B = matrix(D, DFF);
	const W2B = matrix(DFF, D);
	const GATE = matrix(D, 2);
	const B1 = zeros(DFF);
	const B2 = zeros(D);
	const FGAMMA = new Array(D).fill(1);
	const FBETA = zeros(D);
	const UNEMB = VOCAB.map(() => vector(D));

	function matVec(W, x, b) {
		const out = new Array(W[0].length).fill(0);
		for (let i = 0; i < W.length; i++) {
			const xi = x[i] || 0;
			for (let j = 0; j < W[i].length; j++) out[j] += xi * W[i][j];
		}
		if (b) for (let j = 0; j < out.length; j++) out[j] += b[j] || 0;
		return out;
	}
	function dot(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] || 0) * (b[i] || 0); return s; }
	function add(a, b) { return a.map((x, i) => x + (b[i] || 0)); }
	function normVec(x, type, gamma, beta) {
		const n = x.length;
		let mean = 0, ms = 0;
		for (const v of x) mean += v;
		mean /= n;
		for (const v of x) ms += v * v;
		if (type === "ln") {
			const variance = ms / n - mean * mean;
			const inv = 1 / Math.sqrt(variance + EPS);
			return x.map((v, i) => (v - mean) * inv * (gamma ? gamma[i] : 1) + (beta ? beta[i] : 0));
		}
		const inv = 1 / Math.sqrt(ms / n + EPS);
		return x.map((v, i) => v * inv * (gamma ? gamma[i] : 1));
	}
	function normMatrix(X, type, gamma, beta) { return X.map(row => normVec(row, type, gamma, beta)); }
	function gelu(x) { return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x))); }
	function silu(x) { return x / (1 + Math.exp(-x)); }
	function softmax(x) {
		const mx = Math.max(...x);
		const ex = x.map(v => Math.exp(v - mx));
		const sum = ex.reduce((a, b) => a + b, 0);
		return ex.map(v => v / sum);
	}
	function sinPE(pos, i, d) {
		const k = Math.floor(i / 2);
		const denom = Math.pow(10000, 2 * k / d);
		return (i % 2 === 0) ? Math.sin(pos / denom) : Math.cos(pos / denom);
	}
	function rotatePair(x, y, angle) {
		const c = Math.cos(angle), s = Math.sin(angle);
		return [x * c - y * s, x * s + y * c];
	}
	function rope(v, pos, base) {
		const out = v.slice();
		for (let i = 0; i + 1 < out.length; i += 2) {
			const angle = pos / Math.pow(base, i / out.length);
			const r = rotatePair(out[i], out[i + 1], angle);
			out[i] = r[0]; out[i + 1] = r[1];
		}
		return out;
	}
	function attention(X) {
		const n = X.length;
		const kvHeads = S.attn === "gqa" ? 1 : HEADS;
		const Q = X.map(x => matVec(QW, x, S.bias === "on" ? QB : null));
		const K = X.map(x => matVec(KW, x, S.bias === "on" ? KB : null));
		const V = X.map(x => matVec(VW, x, S.bias === "on" ? VB : null));
		const heads = [];
		for (let h = 0; h < HEADS; h++) {
			const kv = h % kvHeads;
			const q = Q.map(row => row.slice(h * DH, (h + 1) * DH));
			const k = K.map(row => row.slice(kv * DH, (kv + 1) * DH));
			const v = V.map(row => row.slice(kv * DH, (kv + 1) * DH));
			const scores = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
				if (j > i) return -1e9;
				const qq = S.qk === "on" ? normVec(q[i], "rms", null, null) : q[i];
				const kk = S.qk === "on" ? normVec(k[j], "rms", null, null) : k[j];
				return dot(qq, kk) / Math.sqrt(DH);
			}));
			const w = scores.map(softmax);
			const ctx = V.map((_, i) => {
				const out = zeros(DH);
				for (let j = 0; j < n; j++) for (let d = 0; d < DH; d++) out[d] += w[i][j] * v[j][d];
				return out;
			});
			heads.push({ w, ctx });
		}
		const concat = X.map((_, i) => heads.flatMap(h => h.ctx[i]));
		const proj = concat.map(c => matVec(OW, c, S.bias === "on" ? OB : null));
		const out = X.map((x, i) => add(x, proj[i]));
		const attn = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => heads.reduce((s, h) => s + h.w[i][j], 0) / HEADS));
		return { out, attn };
	}
	function ffn(X) {
		return X.map(x => {
			if (S.ffn === "moe") {
				const g = softmax(matVec(GATE, x, null));
				const out = zeros(D);
				for (let e = 0; e < 2; e++) {
					const h = matVec(e === 0 ? W1 : W1B, x, B1);
					const gate = matVec(e === 0 ? W3 : W3B, x, null);
					const act = h.map((v, i) => silu(v) * gate[i]);
					const y = matVec(e === 0 ? W2 : W2B, act, null);
					for (let i = 0; i < D; i++) out[i] += g[e] * y[i];
				}
				return out;
			}
			const h = matVec(W1, x, B1);
			if (S.ffn === "swiglu") {
				const gate = matVec(W3, x, null);
				const act = h.map((v, i) => silu(v) * gate[i]);
				return matVec(W2, act, null);
			}
			return matVec(W2, h.map(gelu), B2);
		});
	}
	// RoPE is applied to q/k in attention: patch the projection step here.
	// Keep a dedicated version to avoid changing all other projections.
	const _attention = attention;
	function attentionRope(X) {
		if (S.pos !== "rope") return _attention(X);
		const n = X.length, kvHeads = S.attn === "gqa" ? 1 : HEADS;
		const Q = X.map((x, p) => matVec(QW, x, S.bias === "on" ? QB : null).map((v, i) => v));
		const K = X.map((x, p) => matVec(KW, x, S.bias === "on" ? KB : null));
		const V = X.map(x => matVec(VW, x, S.bias === "on" ? VB : null));
		const heads = [];
		for (let h = 0; h < HEADS; h++) {
			const kv = h % kvHeads;
			const q = Q.map((row, p) => row.slice(h * DH, (h + 1) * DH));
			const k = K.map((row, p) => row.slice(kv * DH, (kv + 1) * DH));
			const v = V.map(row => row.slice(kv * DH, (kv + 1) * DH));
			const qn = q.map(row => S.qk === "on" ? normVec(row, "rms", null, null) : row);
			const kn = k.map(row => S.qk === "on" ? normVec(row, "rms", null, null) : row);
			const qr = qn.map((row, p) => rope(row, p, 10000));
			const kr = kn.map((row, p) => rope(row, p, 10000));
			const scores = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
				if (j > i) return -1e9;
				return dot(qr[i], kr[j]) / Math.sqrt(DH);
			}));
			const w = scores.map(softmax);
			const ctx = V.map((_, i) => {
				const out = zeros(DH);
				for (let j = 0; j < n; j++) for (let d = 0; d < DH; d++) out[d] += w[i][j] * v[j][d];
				return out;
			});
			heads.push({ w, ctx });
		}
		const concat = X.map((_, i) => heads.flatMap(h => h.ctx[i]));
		const proj = concat.map(c => matVec(OW, c, S.bias === "on" ? OB : null));
		const out = X.map((x, i) => add(x, proj[i]));
		const attn = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => heads.reduce((s, h) => s + h.w[i][j], 0) / HEADS));
		return { out, attn };
	}
	// Replace the attention call used by forward().
	function runForward() {
		let X = TOKENS.map(t => EMB[VOCAB.indexOf(t)].slice());
		if (S.pos === "sin") X = X.map((x, p) => x.map((v, i) => v + sinPE(p, i, D)));
		X = normMatrix(X, S.norm, GAMMA, BETA);
		const attn = attentionRope(X);
		X = attn.out;
		X = X.map(h => add(h, ffn([h])[0]));
		if (S.final === "on") X = normMatrix(X, S.norm, FGAMMA, FBETA);
		const headW = S.head === "tied" ? EMB : UNEMB;
		const logits = X.map(x => headW.map(row => dot(x, row)));
		return { X, attn: attn.attn, logits };
	}

	function readControls() {
		["norm", "pos", "attn", "ffn", "final", "head", "qk", "bias"].forEach(k => {
			const el = document.getElementById("mtl-" + k);
			if (el) S[k] = el.value;
		});
	}
	function renderReadout() {
		const el = document.getElementById("mtl-readout");
		if (!el) return;
		const labels = {
			rms: "RMSNorm", ln: "LayerNorm", rope: "RoPE", sin: "Sinusoidal",
			gqa: "GQA", mha: "MHA", swiglu: "SwiGLU", gelu: "GELU", moe: "MoE (2 experts)",
			on: "on", off: "off", untied: "separate head", tied: "tied head"
		};
		el.innerHTML = [
			["norm", "Norm"], ["pos", "Position"], ["attn", "Attention"],
			["ffn", "FFN"], ["final", "Final norm"], ["head", "Output"],
			["qk", "QK norm"], ["bias", "Attention bias"]
		].map(([k, name]) => `<span class="mtl-chip">${name}: <b>${labels[S[k]] || S[k]}</b></span>`).join("");
	}
	function plotAttention(result) {
		const c = colors();
		const n = result.attn.length;
		const z = result.attn;
		const text = z.map(row => row.map(v => v.toFixed(3)));
		Plotly.react("mtl-attention", [{
			type: "heatmap", z: z, x: TOKENS, y: TOKENS, text: text,
			hovertemplate: "query %{y} → key %{x}: %{text}<extra></extra>",
			colorscale: [[0, "rgba(59,130,246,0.08)"], [1, "rgba(16,185,129,0.92)"]],
			showscale: false
		}], {
			paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
			margin: { l: 45, r: 10, t: 10, b: 35 },
			font: { color: c.ink, size: 11 },
			xaxis: { title: "key (attended to)", color: c.muted, side: "bottom" },
			yaxis: { title: "query", color: c.muted, autorange: "reversed" }
		}, { responsive: true, displayModeBar: false });
		const note = document.getElementById("mtl-attention-note");
		if (note) note.textContent = S.attn === "gqa"
			? "GQA: both query heads read the same K/V head. The heatmap is the mean over query heads."
			: "MHA: every query head has its own K/V head. The heatmap is the mean over heads.";
	}
	function plotLogits(result) {
		const c = colors();
		const last = result.logits[result.logits.length - 1];
		const probs = softmax(last);
		const order = probs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p).slice(0, 6);
		Plotly.react("mtl-logits", [{
			type: "bar", orientation: "h",
			x: order.map(o => o.p).reverse(), y: order.map(o => VOCAB[o.i]).reverse(),
			marker: { color: order.map(o => o.p).reverse().map(p => `rgba(16,185,129,${0.35 + p * 0.65})`) },
			text: order.map(o => (o.p * 100).toFixed(1) + "%").reverse(),
			textposition: "outside", hovertemplate: "%{y}: %{text}<extra></extra>"
		}], {
			paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
			margin: { l: 55, r: 35, t: 10, b: 35 },
			font: { color: c.ink, size: 11 },
			xaxis: { title: "probability", color: c.muted, tickformat: ".0%" },
			yaxis: { color: c.muted }
		}, { responsive: true, displayModeBar: false });
		const note = document.getElementById("mtl-logits-note");
		if (note) note.textContent = S.head === "tied"
			? "The output head is tied to the token embedding matrix."
			: "The output head is a separate matrix, as in Qwen2.5/Qwen3, Llama and DeepSeek.";
	}
	function renderLab() {
		readControls();
		renderReadout();
		const result = runForward();
		plotAttention(result);
		plotLogits(result);
	}
	function renderRope() {
		const c = colors();
		const m = +document.getElementById("mtl-m").value;
		const n = +document.getElementById("mtl-n").value;
		const pair = +document.getElementById("mtl-pair").value;
		const base = +document.getElementById("mtl-theta").value;
		document.getElementById("mtl-m-val").textContent = m;
		document.getElementById("mtl-n-val").textContent = n;
		document.getElementById("mtl-pair-val").textContent = pair;
		document.getElementById("mtl-theta-val").textContent = base;
		const omega = 1 / Math.pow(base, 2 * pair / D);
		const am = m * omega, an = n * omega;
		const qx = Math.cos(am), qy = Math.sin(am);
		const kx = Math.cos(an), ky = Math.sin(an);
		const arc = (a) => { const x = [0], y = [0]; for (let t = 0; t <= a + 0.01; t += 0.02) { x.push(Math.cos(t)); y.push(Math.sin(t)); } return { x, y }; };
		const amArc = arc(am), anArc = arc(an);
		Plotly.react("mtl-rope-vectors", [
			{ x: Array.from({ length: 129 }, (_, i) => Math.cos(i / 128 * 2 * Math.PI)), y: Array.from({ length: 129 }, (_, i) => Math.sin(i / 128 * 2 * Math.PI)), mode: "lines", line: { color: c.border, width: 1 }, hoverinfo: "skip", showlegend: false },
			{ x: [0, qx], y: [0, qy], mode: "lines+markers", line: { color: c.blue, width: 4 }, marker: { size: [0, 10], color: c.blue }, name: "query m", hovertemplate: "query at m=%{text}<extra></extra>", text: String(m) },
			{ x: [0, kx], y: [0, ky], mode: "lines+markers", line: { color: c.green, width: 4 }, marker: { size: [0, 10], color: c.green }, name: "key n", hovertemplate: "key at n=%{text}<extra></extra>", text: String(n) },
			{ x: amArc.x, y: amArc.y, mode: "lines", line: { color: "rgba(59,130,246,.35)", width: 1, dash: "dot" }, hoverinfo: "skip", showlegend: false },
			{ x: anArc.x, y: anArc.y, mode: "lines", line: { color: "rgba(16,185,129,.35)", width: 1, dash: "dot" }, hoverinfo: "skip", showlegend: false }
		], {
			paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
			margin: { l: 10, r: 10, t: 10, b: 10 },
			xaxis: { range: [-1.15, 1.15], scaleanchor: "y", zeroline: true, showticklabels: false, color: c.muted },
			yaxis: { range: [-1.15, 1.15], zeroline: true, showticklabels: false, color: c.muted },
			showlegend: true, legend: { orientation: "h", y: -0.1, font: { size: 10, color: c.muted } }
		}, { responsive: true, displayModeBar: false });
		const offs = [];
		for (let d = -8; d <= 8; d++) offs.push({ d, score: Math.cos(d * omega) });
		Plotly.react("mtl-rope-score", [{
			x: offs.map(o => o.d), y: offs.map(o => o.score), mode: "lines+markers",
			line: { color: c.amber, width: 3 }, marker: { size: 5, color: c.amber },
			hovertemplate: "offset %{x}: cos = %{y:.3f}<extra></extra>"
		}], {
			paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
			margin: { l: 45, r: 10, t: 10, b: 35 },
			font: { color: c.ink, size: 11 },
			xaxis: { title: "relative offset m − n", color: c.muted },
			yaxis: { title: "q · k (cosine)", color: c.muted, range: [-1.1, 1.1] },
			shapes: [{ type: "line", x0: m - n, x1: m - n, y0: -1.1, y1: 1.1, line: { color: c.rose, width: 1, dash: "dash" } }]
		}, { responsive: true, displayModeBar: false });
		const readout = document.getElementById("mtl-rope-readout");
		if (readout) readout.textContent = `ω = ${omega.toFixed(5)} rad/position; q·k = cos(${m} − ${n}) = ${Math.cos((m - n) * omega).toFixed(4)}. The same offset gives the same score, wherever it occurs.`;
	}
	function init() {
		document.querySelectorAll("#mtl-norm, #mtl-pos, #mtl-attn, #mtl-ffn, #mtl-final, #mtl-head, #mtl-qk, #mtl-bias").forEach(el => el.addEventListener("change", renderLab));
		["mtl-m", "mtl-n", "mtl-pair", "mtl-theta"].forEach(id => document.getElementById(id).addEventListener("input", renderRope));
		renderLab();
		renderRope();
		if (window.__MN_DARK && window.__MN_DARK.onChange) window.__MN_DARK.onChange(() => { renderLab(); renderRope(); });
		else window.addEventListener("tm:theme", () => { renderLab(); renderRope(); });
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
	else init();
}
