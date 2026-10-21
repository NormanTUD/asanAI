// Learning paths: curated routes through the course ("How ChatGPT works
// in 9 lessons") plus one path per part. A lesson counts once it has been
// read to the end (MNQuest). A finished path earns +100 XP and a
// certificate the reader can download as a PNG — made in the browser,
// with a name they type in; nothing leaves the page.
//
// Shown as the "Paths" tab of the progress overview and, on the home
// page, inside #mn-home-paths.

(function () {
	"use strict";

	const NAME_KEY = "mn_cert_name";

	const CURATED = [
		{ id: "llm", icon: "💬", title: "How ChatGPT Works", desc: "The shortest route from “text in” to “answer out”.",
			lessons: ["intuition", "tokenizerlab", "embeddinglab", "attentionlab", "positionalembeddingslab", "transformer", "samplinglab", "finetuninglab", "hallucinations"] },
		{ id: "learn", icon: "📉", title: "How a Network Learns", desc: "Loss, gradients, backprop and a live training run.",
			lessons: ["losslab", "derivativelab", "backproplab", "optimizerlab", "minimalneuron", "activationlab", "traininglab", "overandunderfittinglab"] },
		{ id: "math", icon: "∑", title: "The Math Toolkit", desc: "Everything the rest of the course quietly assumes.",
			lessons: ["math_i", "math_ii", "math_iii", "math_iv", "differentiation", "statistics_i", "statistics_ii"] },
		{ id: "build", icon: "🛠️", title: "Building with LLMs", desc: "Prompts, retrieval, tools, agents — and how to test them.",
			lessons: ["promptengineering", "contextwindows", "rag", "vectorsearch", "websearch", "agents", "security_inference", "evaluation", "running_locally"] },
		{ id: "scale", icon: "⚡", title: "Inference & Scale", desc: "What it takes to train and serve a model for millions.",
			lessons: ["inference_vs_training", "inference_optimization", "production_serving", "training_data", "training_infrastructure", "trainingdynamics", "mixture_of_experts", "ai_economics"] },
		{ id: "safety", icon: "🛡️", title: "Safety & Society", desc: "When models fail, how to trust them, and who decides.",
			lessons: ["hallucinations", "reliability", "alignment", "security_inference", "law_regulation", "ai_and_society", "ai_existential_risk", "myths"] },
		{ id: "vision", icon: "🎨", title: "Seeing & Generating", desc: "Convolutions, dreams, diffusion, sound and video.",
			lessons: ["computer_vision", "deconvolution", "inceptionism", "multimodal", "diffusion", "speech_audio", "music_video_generation"] },
		{ id: "inside", icon: "🔬", title: "Inside the Black Box", desc: "Geometry, topology and the circuits inside a trained model.",
			lessons: ["origami", "topology", "geometry_ii", "mechanistic_interpretability", "fact_lookup", "unexpected_capabilities", "frontier"] },
		{ id: "history", icon: "🏺", title: "Ideas & History", desc: "From counting sticks to thinking machines.",
			lessons: ["history", "language", "information_market", "algorithms", "software", "untold_history", "human_mind", "philosophy"] }
	];

	function esc(s) {
		return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
	}

	function nav() { return window.__moduleNavData || {}; }
	function mods() { return nav().modules || []; }
	function modOf(slug) { return mods().find((m) => m.slug === slug); }

	function allPaths() {
		const known = {};
		mods().forEach((m) => { known[m.slug] = true; });
		const out = CURATED.map((p) => Object.assign({}, p, { lessons: p.lessons.filter((s) => known[s]) })).filter((p) => p.lessons.length >= 3);
		const titles = nav().parts || {};
		const byPart = {};
		mods().forEach((m) => { (byPart[m.part] = byPart[m.part] || []).push(m.slug); });
		Object.keys(byPart).sort((a, b) => a - b).forEach((p) => {
			const t = titles[p] || {};
			out.push({ id: "part-" + p, icon: "Ⅰ Ⅱ Ⅲ Ⅳ Ⅴ Ⅵ".split(" ")[p - 1] || p, title: "Part " + p + (t.title ? ": " + t.title : ""), desc: t.desc || "", lessons: byPart[p], isPart: true });
		});
		return out;
	}

	const Q = () => window.MNQuest;
	function progress(p) {
		const q = Q();
		const done = q ? p.lessons.filter((s) => q.finished(s)).length : 0;
		const next = q ? p.lessons.find((s) => !q.finished(s)) : p.lessons[0];
		return { done: done, total: p.lessons.length, next: next, complete: done === p.lessons.length };
	}

	// ── Completion ──────────────────────────────────────────────────
	let checkTimer = 0;
	function check() {
		clearTimeout(checkTimer);
		checkTimer = setTimeout(() => {
			const q = Q();
			if (!q) return;
			allPaths().forEach((p) => {
				if (!progress(p).complete || q.done("path-" + p.id)) return;
				q.xp(100, "· path complete: " + p.title, "path-" + p.id);
				q.count("paths");
				q.toast('<span class="mnq-t-icon">🎓</span><span><small>Learning path complete</small><b>' + esc(p.title) + "</b><em>Click to get your certificate.</em></span>", "ach", () => q.open("paths"));
			});
			const sig = allPaths().map((p) => progress(p).done).join(",");
			if (sig !== lastSig) { lastSig = sig; paintHome(); }
		}, 300);
	}
	let lastSig = "";

	// ── Rendering ───────────────────────────────────────────────────
	const TONES = { llm: "accent", learn: "coral", math: "sky", build: "emerald", scale: "rose", safety: "coral", vision: "rose", inside: "accent", history: "emerald" };
	const COLORS = ["accent", "coral", "emerald", "rose", "sky", "text-secondary"];

	function toneOf(p) {
		if (TONES[p.id]) return TONES[p.id];
		const m = modOf(p.lessons[0]);
		return m && COLORS.indexOf(m.color) >= 0 && m.color !== "text-secondary" ? m.color : "accent";
	}

	function ring(pct) {
		const R = 22, C = 2 * Math.PI * R;
		return '<svg class="mnp-ring" viewBox="0 0 52 52" aria-hidden="true"><circle class="mnp-ring-bg" cx="26" cy="26" r="' + R + '"/>' +
			'<circle class="mnp-ring-fg" cx="26" cy="26" r="' + R + '" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct / 100)).toFixed(1) + '"/></svg>' +
			'<span class="mnp-ring-num">' + pct + "<small>%</small></span>";
	}

	function card(p, compact) {
		const g = progress(p);
		const pct = Math.round(g.done / g.total * 100);
		const nm = g.next && modOf(g.next);
		const q = Q();
		const started = g.done > 0 || !!(q && p.lessons.some((s) => q.visited(s)));
		const stones = p.lessons.map((s, k) => {
			const m = modOf(s);
			const st = q && q.finished(s) ? "is-done" : s === g.next ? "is-next" : q && q.visited(s) ? "is-seen" : "";
			return '<li class="' + st + '"><a href="' + esc(m ? m.url : s) + '" title="' + (k + 1) + ". " + esc(m ? m.title : s) + '" aria-label="' + (k + 1) + ". " + esc(m ? m.title : s) + '"></a></li>';
		}).join("");
		const steps = compact ? "" : '<ol class="mnp-steps">' + p.lessons.map((s, k) => {
			const m = modOf(s);
			const st = q && q.finished(s) ? "is-done" : s === g.next ? "is-next" : q && q.visited(s) ? "is-seen" : "";
			return '<li class="' + st + '"><span class="mnp-step-n">' + (q && q.finished(s) ? "✓" : k + 1) + '</span><a href="' + esc(m ? m.url : s) + '">' + esc(m ? m.title : s) + "</a></li>";
		}).join("") + "</ol>";
		const cta = g.complete
			? '<button type="button" class="mnp-cta mnp-cert" data-path="' + esc(p.id) + '">🎓 Get your certificate</button>'
			: nm ? '<a class="mnp-cta" href="' + esc(nm.url) + '"><span>' + (started ? "Continue" : "Start the path") + '</span><em>' + esc(nm.title.split(/\s[—–:]\s|:\s/)[0]) + '</em><i aria-hidden="true">→</i></a>' : "";
		return '<article class="mnp-path' + (g.complete ? " is-complete" : "") + (started ? " is-started" : "") + (p.isPart ? " is-part" : "") + '" style="--tone: var(--mn-' + toneOf(p) + ')">' +
			'<div class="mnp-hero"><span class="mnp-orb" aria-hidden="true"><span>' + esc(p.icon) + "</span></span>" + ring(pct) + "</div>" +
			'<div class="mnp-kick">' + (g.complete ? "Completed · " + g.total + " lessons" : g.done ? g.done + " of " + g.total + " lessons read" : (p.isPart ? "Course part" : "Learning path") + " · " + g.total + " lessons") + "</div>" +
			'<div class="mnp-title">' + esc(p.title) + '</div><p class="mnp-desc">' + esc(p.desc) + "</p>" +
			'<ol class="mnp-trail" style="--p:' + (g.done / g.total).toFixed(3) + '">' + stones + "</ol>" + steps +
			'<div class="mnp-foot">' + cta + "</div></article>";
	}

	function renderTab() {
		const ps = allPaths();
		const cur = ps.filter((p) => !p.isPart), parts = ps.filter((p) => p.isPart);
		return '<p class="mnq-intro">Pick a route through the course. A lesson counts once you have read it to the end. Finish a path for <b>+100 XP</b> and a certificate.</p>' +
			'<div class="mnq-sect">Curated paths</div><div class="mnp-paths">' + cur.map((p) => card(p, false)).join("") + "</div>" +
			'<div class="mnq-sect">The six parts</div><div class="mnp-paths">' + parts.map((p) => card(p, false)).join("") + "</div>";
	}

	function bindCerts(root) {
		root.querySelectorAll(".mnp-cert").forEach((b) => b.addEventListener("click", () => {
			const p = allPaths().find((x) => x.id === b.getAttribute("data-path"));
			if (p) certificate(p, b);
		}));
	}

	function paintHome() {
		const host = document.getElementById("mn-home-paths");
		if (!host) return;
		const q = Q();
		const ps = allPaths().filter((p) => !p.isPart);
		// started paths first, then the rest in their curated order
		const started = ps.filter((p) => { const g = progress(p); return g.done > 0 || (q && p.lessons.some((s) => q.visited(s))); });
		const order = started.concat(ps.filter((p) => started.indexOf(p) < 0));
		host.innerHTML = '<div class="mnp-home-head"><div><div class="mnp-home-kicker">Learning paths</div><div class="mnp-home-title">Choose your way in</div>' +
			'<p class="mnp-home-sub">Nine routes through the course — each one a story with a beginning, a payoff and a certificate at the end.</p></div>' +
			'<button type="button" class="mnp-home-more">All paths & progress <span aria-hidden="true">→</span></button></div>' +
			'<div class="mnp-paths mnp-paths--home">' + order.map((p) => card(p, true)).join("") + "</div>";
		bindCerts(host);
		host.querySelector(".mnp-home-more").addEventListener("click", () => { if (q) q.open("paths"); });
	}

	// ── Certificate ─────────────────────────────────────────────────
	function certificate(p, anchor) {
		let name = "";
		try { name = localStorage.getItem(NAME_KEY) || ""; } catch (e) { /* ignore */ }
		const box = document.createElement("div");
		box.className = "mnp-certbox";
		box.innerHTML = '<label>Name on the certificate <input type="text" maxlength="60" value="' + esc(name) + '" placeholder="Your name"></label>' +
			'<canvas width="1600" height="1130" aria-label="Certificate preview"></canvas>' +
			'<div class="mnz-foot"><span class="mnz-hint">Made in your browser — nothing is uploaded.</span><button type="button" class="mnz-btn mnp-dl">Download PNG</button></div>';
		const host = anchor.closest(".mnp-path");
		const old = host.querySelector(".mnp-certbox");
		if (old) { old.remove(); return; }
		host.appendChild(box);
		const input = box.querySelector("input"), cv = box.querySelector("canvas");
		const draw = () => drawCert(cv, p, input.value.trim());
		input.addEventListener("input", () => { try { localStorage.setItem(NAME_KEY, input.value.trim()); } catch (e) { /* ignore */ } draw(); });
		box.querySelector(".mnp-dl").addEventListener("click", () => {
			draw();
			cv.toBlob((blob) => {
				if (!blob) return;
				const a = document.createElement("a");
				a.href = URL.createObjectURL(blob);
				a.download = "certificate-" + p.id + ".png";
				document.body.appendChild(a);
				a.click();
				setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
			}, "image/png");
		});
		draw();
	}

	function drawCert(cv, p, name) {
		const ctx = cv.getContext("2d");
		const W = cv.width, H = cv.height;
		const css = getComputedStyle(document.documentElement);
		const v = (k, d) => (css.getPropertyValue(k).trim() || d);
		const serif = v("--mn-font-heading", "Georgia, serif"), body = v("--mn-font-body", "sans-serif");
		const accent = v("--mn-accent", "#6366f1"), coral = v("--mn-coral", "#f97316");
		// The certificate is a printable document: always paper-light.
		ctx.fillStyle = "#FAF8F1";
		ctx.fillRect(0, 0, W, H);
		ctx.strokeStyle = accent; ctx.lineWidth = 6; ctx.strokeRect(50, 50, W - 100, H - 100);
		ctx.strokeStyle = coral; ctx.lineWidth = 2; ctx.strokeRect(70, 70, W - 140, H - 140);
		ctx.textAlign = "center";
		ctx.fillStyle = "#6b6357";
		ctx.font = "600 30px " + body;
		ctx.fillText("FROM NOTHING TO CHATGPT", W / 2, 200);
		ctx.fillStyle = "#1f1b16";
		ctx.font = "700 92px " + serif;
		ctx.fillText("Certificate of Completion", W / 2, 330);
		ctx.fillStyle = "#6b6357";
		ctx.font = "italic 36px " + serif;
		ctx.fillText("This certifies that", W / 2, 430);
		ctx.fillStyle = accent;
		ctx.font = "700 80px " + serif;
		ctx.fillText(name || "—", W / 2, 540);
		ctx.fillStyle = "#6b6357";
		ctx.font = "italic 36px " + serif;
		ctx.fillText("has read every lesson of the learning path", W / 2, 630);
		ctx.fillStyle = "#1f1b16";
		ctx.font = "700 60px " + serif;
		ctx.fillText(p.title, W / 2, 720);
		ctx.font = "400 28px " + body;
		ctx.fillStyle = "#6b6357";
		const titles = p.lessons.map((s) => { const m = modOf(s); return m ? m.title.split(/[:—–(]/)[0].trim() : s; });
		wrap(ctx, titles.join("  ·  "), W / 2, 790, W - 320, 38);
		ctx.font = "500 28px " + body;
		ctx.fillText(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) + "  ·  " + p.lessons.length + " lessons", W / 2, H - 140);
	}

	function wrap(ctx, text, x, y, max, lh) {
		const words = text.split(" ");
		let line = "", lines = [];
		words.forEach((w) => {
			const t = line ? line + " " + w : w;
			if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t;
		});
		if (line) lines.push(line);
		lines.slice(0, 4).forEach((l, i) => ctx.fillText(l.trim(), x, y + i * lh));
	}

	function start() {
		const q = Q();
		if (!q || !mods().length) return;
		q.addTab({
			id: "paths",
			label: () => { const ps = allPaths(); return "Paths <span>" + ps.filter((p) => progress(p).complete).length + "/" + ps.length + "</span>"; },
			render: renderTab,
			bind: bindCerts
		});
		check();
		window.addEventListener("mnquest:change", check);
	}

	window.MNPaths = { list: allPaths, progress: progress };
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
	else setTimeout(start, 0);
})();
