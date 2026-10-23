// Learning paths: curated routes through the course ("How ChatGPT works
// in 9 lessons") plus one path per part. A lesson counts once it has been
// read to the end (MNQuest). A finished path earns +100 XP and a
// certificate the reader can download as a PNG — made in the browser,
// with a name they type in; nothing leaves the page.
//
// Everything lives in one window, opened from the route icon in the
// top-right chrome (#paths-toggle, render_paths_toggle() in functions.php).

(function () {
	"use strict";

	const NAME_KEY = "mn_cert_name";
	const PICK_KEY = "mn_path_pick";

	let pickedId = null;
	let searchQuery = "";
	let allOpen = false;
	try { pickedId = localStorage.getItem(PICK_KEY) || null; } catch (e) { /* ignore */ }

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

	function reducedMotion() {
		return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
	}

	let activeViewTransition = null, pendingSwap = null;
	function smoothSwap(fn) {
		if (!document.startViewTransition || reducedMotion() || document.visibilityState === "hidden") { fn(); return; }
		if (activeViewTransition) { pendingSwap = fn; return; }
		try {
			const vt = document.startViewTransition(fn);
			activeViewTransition = vt;
			const done = () => {
				if (activeViewTransition !== vt) return;
				activeViewTransition = null;
				if (pendingSwap) { const next = pendingSwap; pendingSwap = null; smoothSwap(next); }
			};
			if (vt.finished) vt.finished.then(done, done);
			if (vt.ready && vt.ready.catch) vt.ready.catch(() => {});
			if (vt.updateCallbackDone && vt.updateCallbackDone.catch) vt.updateCallbackDone.catch(() => {});
			return;
		} catch (e) { /* ignore */ }
		fn();
	}

	function shortTitle(t) { return String(t || "").split(/\s[—–:]\s|:\s/)[0]; }

	function nav() { return window.__moduleNavData || {}; }
	function mods() { return nav().modules || []; }
	function modOf(slug) { return mods().find((m) => m.slug === slug); }

	function moduleIds(m) {
		return ((m && m.topics ? m.topics : "") + "," + (m && m.tags ? m.tags : ""))
			.split(/[,\s]+/).filter(Boolean);
	}

	function lessonFit(m) {
		const bt = window.BlogTopics;
		if (!bt || !bt.scoreUnit || !m) return { state: "full", why: null, reason: "" };
		const ids = moduleIds(m);
		const mathReq = m.math !== undefined && m.math !== null && m.math !== "" ? m.math : null;
		const depthReq = m.depth !== undefined && m.depth !== null && m.depth !== "" ? m.depth : (m.depthlevel || null);
		if (!ids.length && mathReq === null && depthReq === null) return { state: "full", why: null, reason: "" };
		return bt.scoreUnit(ids, { mathReq: mathReq, depthReq: depthReq, pure: true });
	}

	function pathFit(p) {
		const fit = { total: p.lessons.length, full: 0, partial: 0, off: 0, why: null, reasons: {} };
		p.lessons.forEach((s) => {
			const f = lessonFit(modOf(s));
			if (f.state === "off") fit.off++;
			else if (f.state === "partial") fit.partial++;
			else fit.full++;
			if (f.state === "off" && f.why) fit.reasons[f.why] = (fit.reasons[f.why] || 0) + 1;
		});
		fit.score = fit.total ? (fit.full + fit.partial * 0.55) / fit.total : 0;
		fit.why = Object.keys(fit.reasons).sort((a, b) => fit.reasons[b] - fit.reasons[a])[0] || null;
		return fit;
	}

	function fitReason(why) {
		return {
			math: "Some lessons need more math comfort",
			depth: "Some lessons reach further back than your history depth",
			interests: "Some lessons are outside your selected interests",
			category: "Some lessons use a tone you switched off",
			layman: "Some lessons are beyond the layman core"
		}[why] || "Some lessons do not match your settings";
	}

	function fitChip(fit, compact) {
		if (!fit.total || !fit.off) return "";
		const good = fit.full + fit.partial;
		const label = compact ? good + "/" + fit.total + " fit" : good + " of " + fit.total + " lessons fit your settings";
		const title = fitReason(fit.why) + ". Click to tune your interests, math level and depth.";
		return '<button type="button" class="mnp-fit mnp-fit-tune" title="' + esc(title) + '">' + label + "</button>";
	}

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

	function selected() {
		if (!pickedId) return null;
		const p = allPaths().find((x) => x.id === pickedId);
		if (!p) {
			pickedId = null;
			try { localStorage.removeItem(PICK_KEY); } catch (e) { /* ignore */ }
			return null;
		}
		return p;
	}

	function setSelected(id, repaint) {
		pickedId = id;
		try {
			if (id) localStorage.setItem(PICK_KEY, id);
			else localStorage.removeItem(PICK_KEY);
		} catch (e) { /* ignore */ }
		if (repaint && overlay) paint();
		paintAll();
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
				q.toast('<span class="mnq-t-icon">🎓</span><span><small>Learning path complete</small><b>' + esc(p.title) + "</b><em>Click to get your certificate.</em></span>", "ach", open);
			});
			const sig = allPaths().map((p) => progress(p).done).join(",");
			if (sig !== lastSig) { lastSig = sig; paint(); }
		}, 300);
	}
	let lastSig = "";

	// ── Rendering ───────────────────────────────────────────────────
	const TONES = { llm: "accent", learn: "coral", math: "sky", build: "emerald", scale: "rose", safety: "coral", vision: "rose", inside: "accent", history: "emerald" };
	const COLORS = ["accent", "coral", "emerald", "rose", "sky"];

	function toneOf(p) {
		if (TONES[p.id]) return TONES[p.id];
		const m = modOf(p.lessons[0]);
		return m && COLORS.indexOf(m.color) >= 0 ? m.color : "accent";
	}

	function pathNum(p) {
		if (p.isPart) {
			const n = parseInt(String(p.id).split("-")[1], 10);
			return ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ"][n - 1] || String(n);
		}
		const i = CURATED.findIndex((x) => x.id === p.id);
		return i >= 0 ? String(i + 1).padStart(2, "0") : "·";
	}

	function card(p, knownFit) {
		const g = progress(p);
		const fit = knownFit || pathFit(p);
		const nm = g.next && modOf(g.next);
		const q = Q();
		const started = g.done > 0 || !!(q && p.lessons.some((s) => q.visited(s)));
		const pct = Math.round(g.done / g.total * 100);
		const dotState = (s) => q && q.finished(s) ? "is-done" : s === g.next ? "is-next" : q && q.visited(s) ? "is-seen" : "";
		const steps = p.lessons.map((s, k) => {
			const m = modOf(s);
			const f = lessonFit(m);
			const fitCls = f.state === "off" ? " is-off" : f.state === "partial" ? " is-dim" : "";
			const title = (m ? m.title : s) + (f.state === "off" ? " — " + f.reason : "");
			return '<li class="' + dotState(s) + fitCls + '"><span class="mnp-step-n">' + (q && q.finished(s) ? "✓" : k + 1) + '</span><a href="' + esc(m ? m.url : s) + '" title="' + esc(title) + '">' + esc(m ? m.title : s) + "</a></li>";
		}).join("");
		const isPicked = pickedId === p.id;
		const note = g.complete
			? '<span class="mnp-card-note">All ' + g.total + ' lessons read · certificate ready</span>'
			: nm ? '<span class="mnp-card-note"><span class="mnp-card-note-k">' + (started ? "Next" : "Starts with") + '</span><a href="' + esc(nm.url) + '">' + esc(shortTitle(nm.title)) + "</a></span>" : "";
		const action = g.complete
			? '<button type="button" class="mnp-card-go mnp-cert" data-path="' + esc(p.id) + '">🎓 Certificate</button>'
			: nm ? '<a class="mnp-card-go" href="' + esc(nm.url) + '">' + (started ? "Continue" : "Start path") + ' <span aria-hidden="true">→</span></a>' : "";
		const search = [p.title, p.desc].concat(p.lessons.map((s) => { const m = modOf(s); return m ? m.title : s; })).join(" ").toLowerCase();
		return '<article class="mnp-path' + (g.complete ? " is-complete" : "") + (isPicked ? " is-picked" : "") + '" data-path="' + esc(p.id) + '" data-search="' + esc(search) + '" style="--tone: var(--mn-' + toneOf(p) + ')">' +
			'<div class="mnp-path-head"><span class="mnp-path-num" aria-hidden="true">' + pathNum(p) + '</span>' +
			'<div class="mnp-path-t"><h4>' + esc(p.title) + "</h4><span>" + esc(p.desc) + "</span></div>" +
			'<button type="button" class="mnp-pick" aria-pressed="' + (isPicked ? "true" : "false") + '" aria-label="' + (isPicked ? "Following " : "Follow ") + esc(p.title) + '" title="' + (isPicked ? "Following this path" : "Follow this path") + '">' + (isPicked ? "Following ✓" : "Follow") + "</button></div>" +
			(started ? '<div class="mnp-card-progress"><span class="mnp-progress" role="progressbar" aria-label="' + g.done + ' of ' + g.total + ' lessons read" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></span>' +
			'<span class="mnp-card-pct">' + g.done + " of " + g.total + "</span></div>" : "") +
			note + fitChip(fit, true) +
			'<div class="mnp-card-foot">' + action + "</div>" +
			'<details class="mnp-path-more"><summary>' + p.lessons.length + ' lessons</summary><ol class="mnp-steps">' + steps + "</ol></details>" +
			"</article>";
	}

	function routeMap(p) {
		const g = progress(p);
		const q = Q();
		return '<ol class="mnp-map" aria-label="Route of ' + esc(p.title) + ", " + g.done + " of " + g.total + ' read">' + p.lessons.map((s, i) => {
			const m = modOf(s);
			const done = q && q.finished(s);
			const mastered = q && q.mastered(s);
			const seen = q && q.visited(s);
			const state = mastered ? " is-done is-mastered" : done ? " is-done" : s === g.next ? " is-current" : seen ? " is-seen" : "";
			const fit = lessonFit(m);
			const fitCls = fit.state === "off" ? " is-off" : fit.state === "partial" ? " is-dim" : "";
			const label = m ? m.title : s;
			const title = label + (fit.state === "off" ? " — " + fit.reason : "");
			return '<li class="mnp-map-node' + state + fitCls + '"><a href="' + esc(m ? m.url : s) + '" title="' + esc(title) + '"' + (s === g.next && !done ? ' aria-current="step"' : "") + ">" +
				'<span class="mnp-map-dot" aria-hidden="true">' + (mastered ? "★" : done ? "✓" : i + 1) + '</span>' +
				'<span class="mnp-map-title">' + esc(shortTitle(label)) + "</span>" +
				'<span class="mnp-sr">' + (mastered ? "Mastered, " : done ? "Completed, " : "") + "step " + (i + 1) + ": " + esc(title) + "</span>" +
				"</a></li>";
		}).join("") + "</ol>";
	}

	function recommended() {
		const cur = allPaths().filter((p) => !p.isPart);
		const open = cur.map((p, i) => ({ p: p, i: i, fit: pathFit(p) })).filter((x) => !progress(x.p).complete);
		open.sort((a, b) => b.fit.score - a.fit.score || a.i - b.i);
		return (open[0] && open[0].p) || cur[0] || null;
	}

	function heroHtml(p, picked) {
		const g = progress(p);
		const fit = pathFit(p);
		const next = g.next && modOf(g.next);
		const pct = Math.round(g.done / g.total * 100);
		const step = next ? p.lessons.indexOf(next.slug) + 1 : g.total;
		const kicker = picked ? "Your path · Step " + step + " of " + g.total : "Suggested for you · " + g.total + " lessons";
		const primary = g.complete
			? '<button type="button" class="mnp-jump mnp-hero-go mnp-cert" data-path="' + esc(p.id) + '">🎓 Certificate</button>'
			: next ? '<a class="mnp-jump mnp-hero-go" href="' + esc(next.url) + '">' + (picked ? "Continue" : "Start path") + ' <span aria-hidden="true">→</span></a>' : "";
		const follow = picked
			? '<span class="mnp-hero-following">Following ✓</span>'
			: '<button type="button" class="mnp-pick mnp-hero-follow" data-path="' + esc(p.id) + '" aria-pressed="false" aria-label="Follow ' + esc(p.title) + '">Follow this path</button>';
		const note = g.complete
			? '<span class="mnp-hero-next"><span>Complete</span>Certificate ready</span>'
			: next ? '<span class="mnp-hero-next"><span>' + (picked ? "Next" : "Starts with") + '</span><a href="' + esc(next.url) + '">' + esc(shortTitle(next.title)) + "</a></span>" : "";
		const allCount = allPaths().length;
		return '<section class="mnp-hero' + (picked ? " is-picked" : "") + '" data-path="' + esc(p.id) + '" aria-labelledby="mnp-hero-title" style="--tone: var(--mn-' + toneOf(p) + ')">' +
			'<div class="mnp-hero-top"><div class="mnp-hero-heading"><span class="mnp-hero-kicker">' + kicker + '</span>' +
			'<h3 class="mnp-hero-title" id="mnp-hero-title">' + esc(p.title) + '</h3>' +
			'<p class="mnp-hero-desc">' + esc(p.desc) + '</p></div>' +
			'<span class="mnp-path-num" aria-hidden="true">' + pathNum(p) + '</span></div>' +
			routeMap(p) +
			'<div class="mnp-hero-progress"><span class="mnp-progress" role="progressbar" aria-label="' + g.done + ' of ' + g.total + ' lessons read" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></span>' +
			'<span class="mnp-card-pct">' + g.done + " of " + g.total + " read</span></div>" +
			'<div class="mnp-hero-meta">' + note + fitChip(fit, false) + "</div>" +
			'<div class="mnp-hero-actions">' + primary + follow +
			'<button type="button" class="mnp-jump mnp-all-toggle" aria-expanded="' + (allOpen ? "true" : "false") + '" aria-controls="mnp-all-body" data-show="Show all ' + allCount + ' paths" data-hide="Hide all paths">' + (allOpen ? "Hide all paths" : "Show all " + allCount + " paths") + "</button></div>" +
			(picked ? '<button type="button" class="mnp-hero-leave" title="Stop following this path">Leave this path</button>' : "") +
			"</section>";
	}

	function render() {
		const ps = allPaths();
		const cur = ps.filter((p) => !p.isPart).map((p, i) => ({ p: p, i: i, fit: pathFit(p) }))
			.sort((a, b) => b.fit.score - a.fit.score || a.i - b.i);
		const parts = ps.filter((p) => p.isPart);
		const curDone = cur.filter((x) => progress(x.p).complete).length;
		const partDone = parts.filter((p) => progress(p).complete).length;
		const picked = selected();
		const hero = picked || recommended();
		return (hero ? heroHtml(hero, !!picked) : "") +
			'<div class="mnp-quiet"><span>Paths follow your interests, math comfort and history depth.</span>' +
				'<button type="button" class="mnp-quiet-link mnp-tune">Tune to my interests</button>' +
				'<button type="button" class="mnp-quiet-link mnp-browse">Browse all lessons</button></div>' +
			'<div class="mnp-all' + (allOpen ? " is-open" : "") + '">' +
				'<div class="mnp-all-body" id="mnp-all-body"' + (allOpen ? "" : " hidden") + '>' +
				'<div class="mnp-tools"><label class="mnp-search">' +
					'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>' +
					'<input id="mnp-search" type="search" autocomplete="off" placeholder="Search paths or lessons…" aria-label="Search paths or lessons" value="' + esc(searchQuery) + '">' +
					'<span class="mnp-search-count" aria-live="polite"></span></label>' +
					'<span class="mnp-count">' + curDone + " of " + cur.length + " curated paths completed</span></div>" +
				'<div class="mnp-sect-row"><div><h3 class="mnp-sect" id="mnp-curated">Curated paths</h3>' +
				'<p class="mnp-sect-sub">Goal-driven routes with a clear next step.</p></div></div>' +
				'<div class="mnp-paths" data-mnp-group="curated">' + cur.map((x) => card(x.p, x.fit)).join("") + "</div>" +
				'<p class="mnp-empty" data-mnp-empty="curated" hidden>No curated path matches that search.</p>' +
				'<div class="mnp-sect-row"><div><h3 class="mnp-sect">The six parts</h3>' +
				'<p class="mnp-sect-sub">The full course, part by part.</p></div>' +
				'<span class="mnp-count">' + partDone + " of " + parts.length + " parts completed</span></div>" +
				'<div class="mnp-paths" data-mnp-group="parts">' + parts.map(card).join("") + "</div>" +
				'<p class="mnp-empty" data-mnp-empty="parts" hidden>No part matches that search.</p>' +
				"</div>" +
			"</div>";
	}

	function applyFilter(root) {
		const input = root.querySelector("#mnp-search");
		const q = input ? input.value.trim().toLowerCase() : "";
		searchQuery = input ? input.value : "";
		let total = 0;
		root.querySelectorAll("[data-mnp-group]").forEach((grid) => {
			let shown = 0;
			grid.querySelectorAll(".mnp-path").forEach((el) => {
				const hit = !q || (el.getAttribute("data-search") || "").indexOf(q) >= 0;
				el.hidden = !hit;
				if (hit) shown++;
			});
			total += shown;
			const empty = root.querySelector('[data-mnp-empty="' + grid.getAttribute("data-mnp-group") + '"]');
			if (empty) empty.hidden = shown > 0;
		});
		const count = root.querySelector(".mnp-search-count");
		if (count) count.textContent = q ? total + (total === 1 ? " match" : " matches") : "";
	}

	function bindCerts(root) {
		root.querySelectorAll(".mnp-cert").forEach((b) => b.addEventListener("click", () => {
			const p = allPaths().find((x) => x.id === b.getAttribute("data-path"));
			if (p) certificate(p, b);
		}));
	}

	function bindCards(root) {
		root.querySelectorAll(".mnp-path").forEach((el) => {
			const id = el.getAttribute("data-path");
			if (!id) return;
			const pick = el.querySelector(".mnp-pick");
			if (pick) pick.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				setSelected(id, true);
			});
			el.querySelectorAll("a.mnp-card-go:not(.mnp-cert), .mnp-steps a").forEach((a) => {
				a.addEventListener("click", () => setSelected(id, false));
			});
		});
	}

	function tune() {
		if (!window.BlogTopics) return;
		if (overlay) overlay.inert = true;
		window.BlogTopics.openOverlay();
	}

	let allAnim = null;
	function setAllBody(root, open, animate) {
		const body = root.querySelector(".mnp-all-body");
		const all = root.querySelector(".mnp-all");
		if (!body) return;
		if (all) all.classList.toggle("is-open", open);
		if (allAnim) { allAnim.cancel(); allAnim = null; }
		body.style.height = "";
		body.style.overflow = "";
		if (!animate || reducedMotion()) { body.hidden = !open; return; }
		body.hidden = false;
		const height = body.scrollHeight;
		body.style.overflow = "hidden";
		body.style.height = (open ? 0 : height) + "px";
		void body.offsetHeight;
		allAnim = body.animate(
			[{ height: (open ? 0 : height) + "px" }, { height: (open ? height : 0) + "px" }],
			{ duration: open ? 420 : 300, easing: "cubic-bezier(.22, .61, .36, 1)" }
		);
		allAnim.onfinish = () => { allAnim = null; body.hidden = !open; body.style.height = ""; body.style.overflow = ""; };
		allAnim.oncancel = () => { allAnim = null; };
	}

	function bindFork(root) {
		const search = root.querySelector("#mnp-search");
		if (search) {
			search.addEventListener("input", () => applyFilter(root));
			search.addEventListener("search", () => applyFilter(root));
		}
		applyFilter(root);
		const curNode = root.querySelector(".mnp-map-node.is-current");
		const map = curNode && curNode.closest(".mnp-map");
		if (map && map.scrollWidth > map.clientWidth) map.scrollLeft = Math.max(0, curNode.offsetLeft - (map.clientWidth - curNode.offsetWidth) / 2);
		const allBtn = root.querySelector(".mnp-all-toggle");
		if (allBtn) allBtn.addEventListener("click", () => {
			allOpen = !allOpen;
			allBtn.setAttribute("aria-expanded", allOpen ? "true" : "false");
			allBtn.textContent = allOpen ? allBtn.getAttribute("data-hide") : allBtn.getAttribute("data-show");
			setAllBody(root, allOpen, true);
		});
		const hero = root.querySelector(".mnp-hero");
		if (hero) {
			const id = hero.getAttribute("data-path");
			hero.querySelectorAll(".mnp-map a, .mnp-hero-go:not(.mnp-cert)").forEach((a) => {
				a.addEventListener("click", () => setSelected(id, false));
			});
			const follow = hero.querySelector(".mnp-hero-follow");
			if (follow) follow.addEventListener("click", () => setSelected(id, true));
			const leave = hero.querySelector(".mnp-hero-leave");
			if (leave) leave.addEventListener("click", () => setSelected(null, true));
		}
		root.querySelectorAll(".mnp-tune, .mnp-fit-tune").forEach((b) => b.addEventListener("click", tune));
		const browse = root.querySelector(".mnp-browse");
		if (browse) browse.addEventListener("click", () => {
			close();
			const here = document.getElementById("course-overview");
			if (here) {
				setTimeout(() => here.scrollIntoView({ behavior: "smooth", block: "start" }), 240);
				return;
			}
			const home = document.getElementById("lesson-home");
			const href = (home ? home.getAttribute("href") : "index.php").split("#")[0];
			setTimeout(() => { window.location.href = href + "#course-overview"; }, 160);
		});
	}

	// ── Step pager: shown at the top (TOC) and end of a path lesson ──
	function pagerHtml(p, mod, compact) {
		const pos = p.lessons.indexOf(mod.slug);
		const prev = p.lessons[pos - 1] && modOf(p.lessons[pos - 1]);
		const next = p.lessons[pos + 1] && modOf(p.lessons[pos + 1]);
		const q = Q();
		const options = p.lessons.map((s, i) => {
			const m = modOf(s);
			return '<option value="' + esc(m ? m.url : s) + '"' + (i === pos ? " selected" : "") + ">" + (i + 1) + ". " + esc(shortTitle(m ? m.title : s)) + (q && q.finished(s) ? " ✓" : "") + "</option>";
		}).join("");
		const prevHtml = prev
			? '<a class="mnp-pager-btn" href="' + esc(prev.url) + '" aria-label="Previous lesson: ' + esc(prev.title) + '" title="Previous: ' + esc(prev.title) + '">←' + (compact ? "" : " Previous") + "</a>"
			: '<span class="mnp-pager-btn is-off" aria-hidden="true">←' + (compact ? "" : " Previous") + "</span>";
		const nextHtml = next
			? '<a class="mnp-pager-btn" href="' + esc(next.url) + '" aria-label="Next lesson: ' + esc(next.title) + '" title="Next: ' + esc(next.title) + '">' + (compact ? "" : "Next ") + "→</a>"
			: '<span class="mnp-pager-btn is-off" aria-hidden="true">' + (compact ? "" : "Next ") + "→</span>";
		return '<div class="mnp-pager' + (compact ? " mnp-pager--compact" : "") + '">' +
			prevHtml +
			(compact ? "" : '<span class="mnp-pager-label">Jump to</span>') +
			'<select class="mnp-pager-select" aria-label="Choose a lesson in ' + esc(p.title) + '">' + options + "</select>" +
			nextHtml +
			"</div>";
	}

	function bindPager(root) {
		const sel = root.querySelector(".mnp-pager-select");
		if (sel) sel.addEventListener("change", () => { if (sel.value) window.location.href = sel.value; });
	}

	// ── End of a lesson: next stop on the picked path ───────────────
	let lessonPanel = null;

	function removeLessonPanel() {
		if (lessonPanel && lessonPanel.parentNode) lessonPanel.remove();
		lessonPanel = null;
	}

	function lessonPanelHtml(p, mod) {
		const g = progress(p);
		const pos = p.lessons.indexOf(mod.slug);
		const step = pos + 1;
		const pct = Math.round(g.done / g.total * 100);
		const nextSlug = p.lessons[pos + 1];
		const next = nextSlug && modOf(nextSlug);
		const after = p.lessons.slice(pos + 2, pos + 4).map(modOf).filter(Boolean);
		let body;
		if (!next) {
			body = '<p class="mnp-end-text">' + (g.complete
				? "You have reached the end of this path. Every lesson is read — your certificate is waiting in the learning paths."
				: "This is the last lesson of the path. Read it to the end to complete the path.") + "</p>";
		} else {
			body = '<p class="mnp-end-text">Step ' + step + ' of ' + g.total + '. Next up in this path:</p>' +
				'<a class="mnp-end-next" href="' + esc(next.url) + '">' +
					'<span class="mnp-end-next-num">' + (pos + 2) + '</span>' +
					'<span class="mnp-end-next-body"><b>' + esc(next.title) + "</b>" + (next.desc ? "<span>" + esc(next.desc) + "</span>" : "") + "</span>" +
					'<span class="mnp-end-next-go">Continue →</span>' +
				"</a>" +
				(after.length ? '<p class="mnp-end-then">Then: ' + after.map((m) => '<a href="' + esc(m.url) + '">' + esc(m.title.split(/\s[—–:]\s|:\s/)[0]) + "</a>").join(" · ") + "</p>" : "");
		}
		return '<div class="mnp-end-head"><span class="mnp-end-kicker">Your learning path</span><span class="mnp-end-step">Step ' + step + ' of ' + g.total + "</span></div>" +
			'<div class="mnp-end-title">' + esc(p.title) + "</div>" +
			'<div class="mnp-end-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div>' +
			'<div class="mnp-end-pager">' + pagerHtml(p, mod, false) + "</div>" +
			body +
			'<div class="mnp-end-actions"><button type="button" class="mnp-end-btn mnp-end-all">All paths</button>' +
			'<button type="button" class="mnp-end-btn mnp-end-leave">Leave this path</button></div>';
	}

	function paintLesson() {
		const data = nav();
		const mod = data.modules && data.modules[data.current];
		const p = mod ? selected() : null;
		if (!mod || !p || p.lessons.indexOf(mod.slug) < 0) { removeLessonPanel(); return; }
		const contents = document.getElementById("contents");
		if (!contents) { removeLessonPanel(); return; }
		if (!lessonPanel) {
			lessonPanel = document.createElement("div");
			lessonPanel.className = "mnp-end";
		}
		lessonPanel.innerHTML = lessonPanelHtml(p, mod);
		const navEl = contents.querySelector(".module-nav");
		if (navEl && navEl.parentNode === contents) contents.insertBefore(lessonPanel, navEl);
		else contents.appendChild(lessonPanel);
		bindPager(lessonPanel);
		lessonPanel.querySelector(".mnp-end-all").addEventListener("click", open);
		lessonPanel.querySelector(".mnp-end-leave").addEventListener("click", () => setSelected(null, false));
	}

	// ── Site integration: home card, TOC strip, course tiles, chrome ──
	let homeCard = null, tocStrip = null;

	function removeHomeCard() {
		if (homeCard && homeCard.parentNode) homeCard.remove();
		homeCard = null;
	}

	function removeTocStrip() {
		if (tocStrip && tocStrip.parentNode) tocStrip.remove();
		tocStrip = null;
	}

	function openAtCard(p) {
		open();
		setTimeout(() => {
			const card = overlay && overlay.querySelector('.mnp-path[data-path="' + p.id + '"]');
			if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
		}, 260);
	}

	function paintHome() {
		const host = document.getElementById("mn-home-dash");
		if (!host) { homeCard = null; return; }
		const p = selected();
		if (!p) { removeHomeCard(); return; }
		if (!homeCard || !homeCard.parentNode) {
			homeCard = document.createElement("div");
			homeCard.id = "mn-home-path";
			homeCard.className = "mn-home-slot";
			host.appendChild(homeCard);
		}
		const g = progress(p);
		const fit = pathFit(p);
		const next = g.next && modOf(g.next);
		const meta = g.complete
			? "Completed · " + g.total + " lessons · certificate ready"
			: g.done + " of " + g.total + " read" + (next ? " · next: " + next.title : "") +
				(fit.off ? " · " + (fit.total - fit.off) + " of " + fit.total + " fit your settings" : "");
		const action = g.complete
			? '<button type="button" class="mnz-btn mnp-home-cert">Certificate</button>'
			: next ? '<a class="mnz-btn" href="' + esc(next.url) + '">Continue</a>' : "";
		homeCard.innerHTML = '<div class="mnh-card mnh-card--path" style="--tone: var(--mn-' + toneOf(p) + ')">' +
			'<span class="mnh-num" aria-hidden="true">' + pathNum(p) + '</span>' +
			'<div class="mnh-main"><div class="mnh-kicker">Your path</div>' +
			'<div class="mnh-title">' + esc(p.title) + '</div>' +
			'<div class="mnh-sub">' + esc(meta) + '</div></div>' + action + '</div>';
		const cert = homeCard.querySelector(".mnp-home-cert");
		if (cert) cert.addEventListener("click", () => openAtCard(p));
		const go = homeCard.querySelector("a.mnz-btn");
		if (go) go.addEventListener("click", () => setSelected(p.id, false));
	}

	function paintToc() {
		const toc = document.getElementById("toc");
		const data = nav();
		const mod = data.modules && data.modules[data.current];
		const p = mod ? selected() : null;
		if (!toc || !mod || !p || p.lessons.indexOf(mod.slug) < 0) { removeTocStrip(); return; }
		if (!tocStrip) {
			tocStrip = document.createElement("div");
			tocStrip.className = "mnp-ctx";
		}
		const g = progress(p);
		const pos = p.lessons.indexOf(mod.slug);
		tocStrip.style.setProperty("--tone", "var(--mn-" + toneOf(p) + ")");
		tocStrip.innerHTML = '<span class="mnp-ctx-num" aria-hidden="true">' + pathNum(p) + '</span>' +
			'<div class="mnp-ctx-main"><span class="mnp-ctx-kicker">Your path · step ' + (pos + 1) + ' of ' + g.total + '</span>' +
			'<b>' + esc(p.title) + '</b></div>' +
			pagerHtml(p, mod, true) +
			(g.complete ? '<button type="button" class="mnp-ctx-open" title="Certificate">🎓</button>' : "") +
			'<button type="button" class="mnp-ctx-all" title="All learning paths">All paths</button>';
		bindPager(tocStrip);
		const openBtn = tocStrip.querySelector(".mnp-ctx-open");
		if (openBtn) openBtn.addEventListener("click", () => openAtCard(p));
		tocStrip.querySelector(".mnp-ctx-all").addEventListener("click", open);
		if (!tocStrip.parentNode) toc.insertBefore(tocStrip, toc.firstChild);
	}

	function paintTiles() {
		const tiles = document.querySelectorAll("a.course-tile");
		if (!tiles.length) return;
		tiles.forEach((tile) => {
			tile.classList.remove("is-path-lesson", "is-path-next");
			tile.style.removeProperty("--tone");
			const b = tile.querySelector(".mnp-tile-step");
			if (b) b.remove();
		});
		const p = selected();
		if (!p) return;
		const stepOf = {};
		p.lessons.forEach((s, i) => { stepOf[s] = i + 1; });
		const next = progress(p).next;
		const tone = "var(--mn-" + toneOf(p) + ")";
		tiles.forEach((tile) => {
			const href = tile.getAttribute("href") || "";
			const slug = href.split("#")[0].split("?")[0].replace(/\.php$/, "").split("/").filter(Boolean).pop();
			if (!stepOf[slug]) return;
			tile.classList.add("is-path-lesson");
			tile.style.setProperty("--tone", tone);
			if (slug === next) tile.classList.add("is-path-next");
			const b = document.createElement("span");
			b.className = "mnp-tile-step";
			b.textContent = slug === next ? "Next" : "Step " + stepOf[slug];
			b.title = "Step " + stepOf[slug] + " of " + p.lessons.length + " in " + p.title;
			tile.appendChild(b);
		});
	}

	function paintChrome() {
		const btn = document.getElementById("paths-toggle");
		if (!btn) return;
		const p = selected();
		btn.classList.toggle("is-following", !!p);
		btn.removeAttribute("data-step");
		const label = p ? "Learning paths — following " + p.title : "Learning paths";
		btn.title = label;
		btn.setAttribute("aria-label", label);
	}

	function paintAll() {
		paintLesson();
		paintHome();
		paintToc();
		paintTiles();
		paintChrome();
	}

	// ── The paths window (opened from #paths-toggle, top right) ─────
	let overlay = null, lastFocus = null, pathsDirty = false;

	function paint(animate) {
		if (!overlay) return;
		const paintNow = () => {
			const body = overlay.querySelector(".mnp-modal-body");
			const scroll = overlay.scrollTop;
			const open = Array.prototype.map.call(body.querySelectorAll("details[open]"), (d) => d.closest(".mnp-path") && Array.prototype.indexOf.call(body.querySelectorAll(".mnp-path"), d.closest(".mnp-path")));
			body.innerHTML = render();
			const cards = body.querySelectorAll(".mnp-path");
			open.forEach((i) => { if (cards[i]) cards[i].querySelector("details").open = true; });
			bindCerts(body);
			bindFork(body);
			bindCards(body);
			overlay.scrollTop = scroll;
		};
		if (animate === false) paintNow();
		else smoothSwap(paintNow);
	}

	function open() {
		if (overlay) return;
		searchQuery = "";
		allOpen = false;
		pathsDirty = false;
		lastFocus = document.activeElement;
		overlay = document.createElement("div");
		overlay.className = "mnp-overlay";
		overlay.innerHTML = '<div class="mnp-modal" role="dialog" aria-modal="true" aria-labelledby="mnp-modal-title">' +
			'<header class="mnp-modal-head"><div class="mnp-head"><div class="mnp-head-text">' +
				'<div class="mnp-kicker">Your way through the course</div>' +
				'<h2 id="mnp-modal-title">Choose your way</h2>' +
				'<p class="mnp-lede">Pick a curated path through the course, or read by your own taste. A lesson counts once you have read it to the end.</p>' +
			'</div><button type="button" class="mnp-close" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div></header>' +
			'<div class="mnp-modal-body"></div></div>';
		document.body.appendChild(overlay);
		var triggerBtn = document.getElementById("paths-toggle");
		if (triggerBtn) triggerBtn.setAttribute("aria-expanded", "true");
		document.documentElement.classList.add("mnp-open");
		paint(false);
		requestAnimationFrame(() => overlay && overlay.classList.add("is-in"));
		overlay.addEventListener("click", (e) => { if (e.target === overlay || e.target.closest(".mnp-close")) close(); });
		document.addEventListener("keydown", onKey, true);
		overlay.querySelector(".mnp-close").focus({ preventScroll: true });
	}

	function close() {
		if (!overlay) return;
		const o = overlay;
		overlay = null;
		pathsDirty = false;
		pendingSwap = null;
		if (activeViewTransition) {
			try { if (activeViewTransition.skipTransition) activeViewTransition.skipTransition(); } catch (e) { /* ignore */ }
			activeViewTransition = null;
		}
		o.classList.remove("is-in");
		var triggerBtn = document.getElementById("paths-toggle");
		if (triggerBtn) triggerBtn.setAttribute("aria-expanded", "false");
		document.removeEventListener("keydown", onKey, true);
		setTimeout(() => {
			o.remove();
			if (!overlay) document.documentElement.classList.remove("mnp-open");
		}, 320);
		if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
	}

	function onKey(e) {
		const topics = document.getElementById("topics-overlay");
		if (topics && topics.classList.contains("open")) return;
		if (e.key === "Escape") { close(); return; }
		if (e.key !== "Tab" || !overlay) return;
		const items = Array.prototype.filter.call(
			overlay.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'),
			(el) => el.getClientRects().length > 0
		);
		if (!items.length) return;
		const first = items[0], last = items[items.length - 1];
		if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
		else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
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
		const host = anchor.closest(".mnp-path, .mnp-hero");
		if (!host) return;
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

	let questTries = 0, watching = false, checking = false;

	function start() {
		if (!mods().length) return;
		if (!watching) {
			watching = true;
			window.addEventListener("blogPostLoadComplete", paintAll);
			window.addEventListener("mnquest:change", paintAll);
			if (window.BlogTopics && window.BlogTopics.onChange) window.BlogTopics.onChange(() => {
				if (!overlay) return;
				const topics = document.getElementById("topics-overlay");
				if (topics && topics.classList.contains("open")) { pathsDirty = true; return; }
				paint(true);
			});
			document.addEventListener("topics:close", () => {
				if (!overlay) return;
				overlay.inert = false;
				if (!pathsDirty) return;
				pathsDirty = false;
				paint(false);
				const target = overlay.querySelector(".mnp-fit-tune, .mnp-tune, .mnp-close");
				if (target) target.focus({ preventScroll: true });
			});
		}
		paintAll();
		if (Q()) {
			if (!checking) {
				checking = true;
				check();
				window.addEventListener("mnquest:change", check);
			}
		} else if (questTries++ < 20) {
			setTimeout(start, 100);
		}
	}

	window.MNPaths = { list: allPaths, progress: progress, selected: selected, select: setSelected, open: open, close: close };
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
	else setTimeout(start, 0);
})();
