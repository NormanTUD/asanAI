// "Predict first" cards: placed right before a demo, they ask the reader
// to commit to a guess, then to try it in the demo, then reveal.
// Markup: <div class="mn-predict" data-predict="id"><script type="application/json">{…}</script></div>
// JSON:   { "q": "…", "options": ["…"], "answer": 0, "explain": "…", "try": "…" }
// "try" is the instruction for the demo ("Set the learning rate to 1.5 …").
// XP: +5 for committing, +10 more if the guess was right (MNQuest).

(function () {
	"use strict";

	const STORE = "mn_predict_v1";

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
		try { return JSON.parse(localStorage.getItem(STORE) || "{}") || {}; } catch (e) { return {}; }
	}
	function save(d) {
		try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) { /* ignore */ }
	}

	function mount(root) {
		if (root._mnpReady) return;
		const src = root.querySelector('script[type="application/json"]');
		if (!src) return;
		let data;
		try { data = JSON.parse(src.textContent); } catch (e) { return; }
		if (!data || !Array.isArray(data.options)) return;
		root._mnpReady = true;
		root.setAttribute("data-interactive", "");
		const id = root.getAttribute("data-predict") || "predict";
		const memo = load();
		let guess = memo[id] ? memo[id].guess : null;
		let revealed = memo[id] ? !!memo[id].revealed : false;

		function paint() {
			const L = "ABCDEFGH";
			let html = '<div class="mnp-head"><span class="mnp-ic" aria-hidden="true">🔮</span><div><div class="mnp-kicker">Predict first</div><p class="mnp-q">' + fmt(data.q) + "</p></div></div>" +
				'<div class="mnp-opts" role="group" aria-label="Your prediction">' + data.options.map((o, k) => {
					let cls = "mnp-opt";
					if (guess === k) cls += " is-picked";
					if (revealed && k === data.answer) cls += " is-right";
					if (revealed && guess === k && k !== data.answer) cls += " is-wrong";
					return '<button type="button" class="' + cls + '" data-k="' + k + '"' + (guess !== null ? " disabled" : "") + '><span class="mnz-letter">' + L[k] + "</span><span>" + fmt(o) + "</span></button>";
				}).join("") + "</div>";
			if (guess !== null && !revealed) {
				html += '<div class="mnp-try"><b>Locked in.</b> ' + fmt(data.try || "Now try it in the demo below.") + ' <span class="mnp-arrow" aria-hidden="true">↓</span></div>' +
					'<div class="mnz-foot"><span class="mnz-hint">Come back after trying it.</span><button type="button" class="mnz-btn mnp-reveal">Reveal the answer</button></div>';
			}
			if (revealed) {
				const right = guess === data.answer;
				html += '<div class="mnz-explain' + (right ? "" : " is-wrong") + '"><b>' + (right ? "You called it!" : "Surprise!") + "</b> " + fmt(data.explain || "") + "</div>";
			}
			root.innerHTML = html;
			root.querySelectorAll(".mnp-opt:not(:disabled)").forEach((b) => b.addEventListener("click", () => {
				guess = parseInt(b.dataset.k, 10);
				const m = load(); m[id] = { guess: guess, revealed: false }; save(m);
				if (window.MNQuest) window.MNQuest.xp(5, "· prediction", "predict-" + id);
				paint();
			}));
			const rv = root.querySelector(".mnp-reveal");
			if (rv) rv.addEventListener("click", () => {
				revealed = true;
				const m = load(); m[id] = { guess: guess, revealed: true }; save(m);
				if (guess === data.answer && window.MNQuest && window.MNQuest.xp(10, "· prediction was right", "predict-right-" + id)) window.MNQuest.count("predictRight");
				paint();
			});
		}
		paint();
	}

	function mountAll() { document.querySelectorAll(".mn-predict").forEach(mount); }
	window.MNPredict = { mountAll: mountAll };
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll);
	else mountAll();
	window.addEventListener("blogPostLoadComplete", mountAll);
})();
