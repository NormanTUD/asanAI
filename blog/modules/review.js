// Review deck: spaced repetition for quiz questions. A question answered
// wrong in any "Check yourself" card lands here and comes back after
// 1, 3, 7, 16 and 35 days; right every time, it retires. Wrong again, it
// starts over. Stored only in this browser (localStorage); the session
// runs inside the progress overview (MNQuest tab "review").
//
// Public API: MNReview.due() → number of due cards · MNReview.open()

(function () {
	"use strict";

	const STORE = "mn_review_v1";
	const DAYS = [1, 3, 7, 16, 35];
	const DAY = 86400000;

	function esc(s) {
		return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
	}
	function fmt(s) {
		return esc(s)
			.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
			.replace(/\*(.+?)\*/g, "<i>$1</i>")
			.replace(/`(.+?)`/g, "<code>$1</code>");
	}

	function load() {
		try {
			const raw = localStorage.getItem(STORE);
			const d = raw ? JSON.parse(raw) : null;
			if (d && d.cards) return d;
		} catch (e) { /* private mode / broken JSON */ }
		return { cards: {}, toastDay: "" };
	}
	let deck = load();
	function save() {
		try { localStorage.setItem(STORE, JSON.stringify(deck)); } catch (e) { /* ignore */ }
	}
	window.addEventListener("storage", (e) => { if (e.key === STORE) { deck = load(); refresh(); } });

	function startOfDay(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
	function dueAfter(days) { return startOfDay(Date.now()) + days * DAY; }
	function dayKey() { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }

	function dueCards() {
		const now = Date.now();
		return Object.keys(deck.cards).map((k) => Object.assign({ key: k }, deck.cards[k])).filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
	}

	function lesson() {
		const nav = window.__moduleNavData;
		const m = nav && nav.modules && nav.current >= 0 ? nav.modules[nav.current] : null;
		return m ? { slug: m.slug, title: m.title, url: m.url } : null;
	}

	// Collect wrong answers from every quiz on the page.
	window.addEventListener("mnquiz:answer", (e) => {
		const d = e.detail || {};
		const q = d.question;
		if (!q || !Array.isArray(q.options) || d.id === "mn-review") return;
		const key = d.id + "#" + d.index;
		if (d.id.indexOf("daily-") === 0 && window.MNQuest && !window.MNQuest.done("count-" + d.id)) {
			window.MNQuest.mark("count-" + d.id);
			window.MNQuest.count("daily");
		}
		if (d.right) return;
		if (deck.cards[key]) { deck.cards[key].box = 0; deck.cards[key].due = dueAfter(1); save(); refresh(); return; }
		const from = d.source && d.source.href ? { url: d.source.href, title: d.source.title } : lesson();
		deck.cards[key] = {
			q: q.q, options: q.options, answer: q.answer, explain: q.explain || "",
			from: from ? from.title : "", url: from ? from.url : "",
			box: 0, due: dueAfter(1), added: Date.now()
		};
		save();
		refresh();
		if (window.MNQuest) window.MNQuest.toast('<b class="mnq-plus">🔁</b> Saved to your review deck — it comes back tomorrow.', "xp");
	});

	// ── Session (lives in the MNQuest panel) ─────────────────────────
	let session = null;

	function begin() {
		const list = dueCards();
		session = { list: list, i: 0, picked: null, right: 0, order: null };
		if (window.MNQuest) window.MNQuest.refresh();
	}

	function shuffled(n) {
		const a = Array.from({ length: n }, (_, i) => i);
		for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
		return a;
	}

	function render() {
		const due = dueCards();
		const all = Object.keys(deck.cards).length;
		if (!session) {
			const upcoming = Object.keys(deck.cards).map((k) => deck.cards[k]).filter((c) => c.due > Date.now()).sort((a, b) => a.due - b.due);
			const next = upcoming.length ? new Date(upcoming[0].due).toLocaleDateString() : null;
			return '<p class="mnq-intro">Every question you get wrong in a quiz lands here and comes back after 1, 3, 7, 16 and 35 days. Get it right each time and it retires — that is how things move into long-term memory.</p>' +
				'<div class="mnr-summary"><div><b>' + due.length + "</b><span>due now</span></div><div><b>" + all + "</b><span>in your deck</span></div><div><b>" + ((window.MNQuest && window.MNQuest.value("retired")) || 0) + "</b><span>retired</span></div></div>" +
				(due.length
					? '<button type="button" class="mnz-btn mnr-start">Start review (' + due.length + ") →</button>"
					: '<p class="mnr-empty">' + (all ? "Nothing due right now. Next review: <b>" + esc(next) + "</b>." : "Your deck is empty. Answer a few quizzes — anything you miss will show up here.") + "</p>") +
				(all ? '<div class="mnq-sect">In your deck</div><ul class="mnr-list">' + Object.keys(deck.cards).map((k) => deck.cards[k]).sort((a, b) => a.due - b.due).slice(0, 30).map((c) =>
					'<li><span class="mnr-box" title="Box ' + (c.box + 1) + ' of 5">' + "●".repeat(c.box + 1) + "○".repeat(Math.max(0, 4 - c.box)) + '</span><span class="mnr-q">' + fmt(c.q) + "</span><em>" + (c.due <= Date.now() ? "due" : new Date(c.due).toLocaleDateString()) + "</em></li>").join("") + "</ul>" : "");
		}
		if (session.i >= session.list.length) {
			const n = session.list.length;
			return '<div class="mnz-result"><div class="mnz-score">' + session.right + " <small>/ " + n + "</small></div>" +
				'<p class="mnz-verdict">' + (session.right === n ? "Every one stuck. They will be back later, further apart." : "The ones you missed start over and come back tomorrow.") + "</p>" +
				'<button type="button" class="mnz-btn mnz-btn--ghost mnr-done">Back to the deck</button></div>';
		}
		const c = session.list[session.i];
		if (!session.order) session.order = shuffled(c.options.length);
		const L = "ABCDEFGH";
		const picked = session.picked;
		return '<div class="mn-quiz mnr-card" data-interactive><div class="mnz-head"><div><div class="mnz-kicker">Review · ' + (session.i + 1) + " of " + session.list.length + '</div><div class="mnz-title">' + esc(c.from || "From an earlier quiz") + "</div></div></div>" +
			'<p class="mnz-q">' + fmt(c.q) + '</p><div class="mnz-opts">' +
			session.order.map((o, k) => {
				let cls = "mnz-opt";
				if (picked !== null && o === c.answer) cls += " is-right";
				if (picked !== null && o === picked && picked !== c.answer) cls += " is-wrong";
				return '<button type="button" class="' + cls + '" data-o="' + o + '"' + (picked !== null ? " disabled" : "") + '><span class="mnz-letter">' + L[k] + "</span><span>" + fmt(c.options[o]) + "</span></button>";
			}).join("") + "</div>" +
			(picked !== null ? '<div class="mnz-explain' + (picked === c.answer ? "" : " is-wrong") + '"><b>' + (picked === c.answer ? "Correct!" : "Not quite.") + "</b> " + fmt(c.explain) + "</div>" : "") +
			'<div class="mnz-foot">' + (c.url ? '<a class="mnz-source" href="' + esc(c.url) + '">Re-read the lesson →</a>' : "<span></span>") +
			(picked !== null ? '<button type="button" class="mnz-btn mnr-next">' + (session.i + 1 < session.list.length ? "Next →" : "Finish") + "</button>" : "") + "</div></div>";
	}

	function answer(o) {
		const c = session.list[session.i];
		session.picked = o;
		const card = deck.cards[c.key];
		const right = o === c.answer;
		if (right) session.right++;
		if (card) {
			if (right) {
				card.box++;
				if (card.box >= DAYS.length) {
					delete deck.cards[c.key];
					if (window.MNQuest) window.MNQuest.count("retired");
				} else card.due = dueAfter(DAYS[card.box]);
			} else {
				card.box = 0;
				card.due = dueAfter(1);
			}
			save();
		}
		if (window.MNQuest) {
			window.MNQuest.count("reviews");
			if (right) window.MNQuest.xp(5, "· review", "review-" + c.key + "-" + dayKey());
		}
		window.MNQuest && window.MNQuest.refresh();
	}

	function bind(root) {
		const go = (sel, fn) => { const b = root.querySelector(sel); if (b) b.addEventListener("click", fn); };
		go(".mnr-start", begin);
		go(".mnr-done", () => { session = null; refresh(); });
		go(".mnr-next", () => { session.i++; session.picked = null; session.order = null; window.MNQuest.refresh(); });
		root.querySelectorAll(".mnr-card .mnz-opt:not(:disabled)").forEach((b) => b.addEventListener("click", () => answer(parseInt(b.dataset.o, 10))));
	}

	function refresh() {
		if (window.MNQuest) window.MNQuest.refresh();
		document.querySelectorAll("[data-mnr-due]").forEach((el) => { el.textContent = String(dueCards().length); });
		paintHome();
	}

	function open() {
		if (!window.MNQuest) return;
		begin();
		window.MNQuest.open("review");
	}

	// Home page card (#mn-home-review) — only while something is due.
	function paintHome() {
		const host = document.getElementById("mn-home-review");
		if (!host) return;
		const n = dueCards().length;
		host.hidden = !n;
		if (!n) return;
		host.innerHTML = '<div class="mnh-card mnh-card--review"><span class="mnh-ic" aria-hidden="true">🔁</span><div class="mnh-main"><div class="mnh-kicker">Review</div>' +
			'<div class="mnh-title">' + n + " question" + (n === 1 ? " is" : "s are") + " due</div><div class=\"mnh-sub\">About " + Math.max(1, Math.round(n * 0.4)) + " minute" + (n > 2 ? "s" : "") + " — things you missed once, coming back to stick.</div></div>" +
			'<button type="button" class="mnz-btn">Review now</button></div>';
		host.querySelector("button").addEventListener("click", open);
	}

	function start() {
		if (window.MNQuest) {
			window.MNQuest.addTab({
				id: "review",
				label: () => { const n = dueCards().length; return "Review <span>" + (n ? n + " due" : Object.keys(deck.cards).length) + "</span>"; },
				render: render,
				bind: bind
			});
		}
		paintHome();
		// Once a day, on any page, a gentle nudge when something is due.
		const n = dueCards().length;
		if (n && deck.toastDay !== dayKey() && window.MNQuest) {
			deck.toastDay = dayKey();
			save();
			setTimeout(() => window.MNQuest.toast('<span class="mnq-t-icon">🔁</span><span><small>Review</small><b>' + n + " question" + (n === 1 ? " is" : "s are") + " due</b><em>One minute — click to start.</em></span>", "ach", open), 6000);
		}
	}

	window.MNReview = { due: () => dueCards().length, open: open };
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
	else setTimeout(start, 0);
})();
