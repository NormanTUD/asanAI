/* Initializer chapter: a small variance model plus a histogram. */

function loadInitializersModule() {
	"use strict";
	const SCHEMES = {
		lecun: { label: "LeCun normal", sd: f => Math.sqrt(1 / f) },
		xavier: { label: "Xavier / Glorot uniform", sd: f => Math.sqrt(2 / (2 * f)) },
		he: { label: "He normal", sd: f => Math.sqrt(2 / f) },
		orthogonal: { label: "Orthogonal", sd: f => Math.sqrt(1 / f) },
		gpt2: { label: "GPT-2 normal (σ = 0.02)", sd: () => 0.02 },
		uniform: { label: "Uniform ±1/√fan_in", sd: f => 1 / Math.sqrt(3 * f) }
	};
	function color(name, fallback) {
		const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
		return v || fallback;
	}
	function gain(act) {
		if (act === "relu") return 0.5;
		if (act === "gelu") return 0.6;
		return 1.0;
	}
	function sdFor(kind, fan) {
		return (SCHEMES[kind] || SCHEMES.xavier).sd(Math.max(1, fan));
	}
	function values(kind, fan) {
		const out = [];
		const sd = sdFor(kind, fan);
		if (kind === "uniform" || kind === "xavier") {
			const limit = Math.sqrt(3) * sd;
			for (let i = 0; i < 500; i++) out.push((Math.random() * 2 - 1) * limit);
		} else if (kind === "orthogonal") {
			for (let i = 0; i < 500; i++) out.push(gaussian() * sd);
		} else {
			for (let i = 0; i < 500; i++) out.push(gaussian() * sd);
		}
		return out;
	}
	function gaussian() {
		let u = 0, v = 0;
		while (u === 0) u = Math.random();
		while (v === 0) v = Math.random();
		return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	}
	function controls() {
		return {
			kind: document.getElementById("init-scheme").value,
			act: document.getElementById("init-act").value,
			fan: +document.getElementById("init-fan").value,
			depth: +document.getElementById("init-depth").value
		};
	}
	function variance(kind, fan, act, depth) {
		const v0 = 1;
		const layer = fan * Math.pow(sdFor(kind, fan), 2) * gain(act);
		const out = [v0];
		for (let l = 1; l <= depth; l++) {
			const next = out[l - 1] * layer;
			out.push(Math.max(1e-12, Math.min(1e12, next)));
		}
		return out;
	}
	function renderPlot() {
		const c = controls();
		const x = Array.from({ length: c.depth + 1 }, (_, i) => i);
		const y = variance(c.kind, c.fan, c.act, c.depth).map(v => Math.log10(v));
		const yx = variance("xavier", c.fan, c.act, c.depth).map(v => Math.log10(v));
		const ink = color("--mn-text", "#0f172a");
		const muted = color("--mn-text-secondary", "#64748b");
		const line = color("--mn-border", "#cbd5e1");
		Plotly.react("init-variance-plot", [
			{ x, y: yx, mode: "lines", name: "Xavier reference", line: { color: muted, width: 2, dash: "dot" }, hovertemplate: "layer %{x}: log10 variance %{y:.3f}<extra></extra>" },
			{ x, y, mode: "lines+markers", name: SCHEMES[c.kind].label, line: { color: "#10b981", width: 3 }, marker: { size: 4, color: "#10b981" }, hovertemplate: "layer %{x}: log10 variance %{y:.3f}<extra></extra>" }
		], {
			paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
			margin: { l: 52, r: 12, t: 12, b: 40 },
			font: { color: ink, size: 11 },
			xaxis: { title: "layer", color: muted, gridcolor: line },
			yaxis: { title: "log10 variance", color: muted, gridcolor: line },
			hoverlabel: { bgcolor: color("--mn-surface", "#fff"), bordercolor: line, font: { color: ink, size: 12 } },
			legend: { orientation: "h", y: -0.24, font: { size: 10, color: muted } }
		}, { responsive: true, displayModeBar: false });
		const slope = y[y.length - 1] - y[0];
		document.getElementById("init-variance-note").textContent =
			`fan-in ${c.fan}, ${c.act}, ${c.depth} layers. Log-variance change: ${slope >= 0 ? "+" : ""}${slope.toFixed(2)} decades. A flat line is the critical regime; upward bends amplify, downward bends vanish.`;
	}
	function renderHist() {
		const c = controls();
		const canvas = document.getElementById("init-hist");
		const rect = canvas.getBoundingClientRect();
		const w = Math.max(220, rect.width || 320);
		const h = Math.max(220, rect.height || 280);
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
		const ctx = canvas.getContext("2d");
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);
		const vals = values(c.kind, c.fan);
		let lo = Math.min(...vals), hi = Math.max(...vals);
		if (lo === hi) { lo -= 1; hi += 1; }
		const bins = 28, counts = new Array(bins).fill(0);
		vals.forEach(v => { const b = Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / (hi - lo) * bins))); counts[b]++; });
		const max = Math.max(...counts) || 1;
		const left = 10, right = 10, top = 10, bottom = 22;
		const bw = (w - left - right) / bins;
		const ink = color("--mn-text", "#0f172a");
		const muted = color("--mn-text-secondary", "#64748b");
		const line = color("--mn-border", "#cbd5e1");
		ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(left, h - bottom); ctx.lineTo(w - right, h - bottom); ctx.stroke();
		counts.forEach((n, i) => {
			const bh = n / max * (h - top - bottom);
			ctx.fillStyle = "rgba(16,185,129,.72)";
			ctx.fillRect(left + i * bw + 1, h - bottom - bh, Math.max(1, bw - 2), bh);
		});
		ctx.fillStyle = muted; ctx.font = "600 9px system-ui, sans-serif";
		ctx.textAlign = "left"; ctx.fillText(lo.toFixed(3), left, h - 5);
		ctx.textAlign = "right"; ctx.fillText(hi.toFixed(3), w - right, h - 5);
		ctx.textAlign = "left"; ctx.fillStyle = ink; ctx.font = "700 11px system-ui, sans-serif";
		ctx.fillText(SCHEMES[c.kind].label + " · 500 samples", left, 14);
		document.getElementById("init-hist-note").textContent = `Sampled standard deviation ≈ ${sdFor(c.kind, c.fan).toFixed(4)} for fan-in ${c.fan}.`;
	}
	function render() {
		const c = controls();
		document.getElementById("init-fan-val").textContent = c.fan;
		document.getElementById("init-depth-val").textContent = c.depth;
		renderPlot(); renderHist();
	}
	function init() {
		["init-scheme", "init-act", "init-fan", "init-depth"].forEach(id => {
			const el = document.getElementById(id);
			if (el) el.addEventListener("input", render);
		});
		render();
		if (window.__MN_DARK && window.__MN_DARK.onChange) window.__MN_DARK.onChange(render);
		else window.addEventListener("tm:theme", render);
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
	else init();
}
