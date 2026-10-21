// "Check yourself" quiz cards.
// Markup: <div class="mn-quiz" data-quiz="id"><script type="application/json">{…}</script></div>
// JSON:   { "title": "…", "questions": [ { "q": "…", "options": ["…"], "answer": 0, "explain": "…" } ] }
// Options are shuffled, one try per question, the explanation always follows.
// XP and achievements go through MNQuest (modules/quests.js).

(function () {
	"use strict";

	const LETTERS = "ABCDEFGH";

	function esc(s) {
		return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
	}

	// Tiny inline formatting: **bold**, *italic*, `code`.
	function fmt(s) {
		return esc(s)
			.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
			.replace(/\*(.+?)\*/g, "<i>$1</i>")
			.replace(/`(.+?)`/g, "<code>$1</code>");
	}

	function shuffled(n) {
		const a = Array.from({ length: n }, (_, i) => i);
		for (let i = n - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const t = a[i]; a[i] = a[j]; a[j] = t;
		}
		return a;
	}

	function mount(root) {
		if (root._mnzReady) return;
		const src = root.querySelector('script[type="application/json"]');
		if (!src) return;
		let data;
		try { data = JSON.parse(src.textContent); } catch (e) { return; }
		if (!data || !Array.isArray(data.questions) || !data.questions.length) return;
		root._mnzReady = true;

		const id = root.getAttribute("data-quiz") || "quiz";
		const Q = data.questions;
		let i = 0, results = [];

		root.innerHTML = "";
		root.setAttribute("data-interactive", "");
		const head = document.createElement("div");
		head.className = "mnz-head";
		head.innerHTML = '<div><div class="mnz-kicker">Check yourself</div><div class="mnz-title">' + fmt(data.title || "Quick quiz") + '</div></div><div class="mnz-dots" aria-hidden="true">' +
			Q.map(() => '<span class="mnz-dot"></span>').join("") + "</div>";
		const body = document.createElement("div");
		root.appendChild(head);
		root.appendChild(body);
		const dots = head.querySelectorAll(".mnz-dot");

		function paintDots() {
			dots.forEach((d, k) => {
				d.className = "mnz-dot" + (k === i && k >= results.length ? " is-now" : "") + (results[k] === true ? " is-right" : results[k] === false ? " is-wrong" : "");
			});
		}

		function show() {
			paintDots();
			const q = Q[i];
			const order = shuffled(q.options.length);
			body.innerHTML =
				'<p class="mnz-q">' + fmt(q.q) + "</p>" +
				'<div class="mnz-opts" role="group" aria-label="Answers">' +
				order.map((o, k) => '<button type="button" class="mnz-opt" data-o="' + o + '"><span class="mnz-letter">' + LETTERS[k] + "</span><span>" + fmt(q.options[o]) + "</span></button>").join("") +
				"</div>" +
				'<div class="mnz-feedback" aria-live="polite"></div>' +
				'<div class="mnz-foot"><span class="mnz-hint">Question ' + (i + 1) + " of " + Q.length + " · one try per question</span></div>";
			body.querySelectorAll(".mnz-opt").forEach((b) => b.addEventListener("click", () => answer(parseInt(b.dataset.o, 10), b)));
		}

		function answer(o, btn) {
			const q = Q[i];
			const right = o === q.answer;
			results[i] = right;
			body.querySelectorAll(".mnz-opt").forEach((b) => {
				b.disabled = true;
				if (parseInt(b.dataset.o, 10) === q.answer) b.classList.add("is-right");
			});
			if (!right) btn.classList.add("is-wrong");
			body.querySelector(".mnz-feedback").innerHTML =
				'<div class="mnz-explain' + (right ? "" : " is-wrong") + '"><b>' + (right ? "Correct!" : "Not quite.") + "</b> " + fmt(q.explain || "") + "</div>";
			if (right && window.MNQuest) {
				const fresh = window.MNQuest.xp(15, "· quiz answer", "quiz-" + id + "-" + i);
				if (fresh) window.MNQuest.count("quizCorrect");
			}
			const foot = body.querySelector(".mnz-foot");
			const next = document.createElement("button");
			next.type = "button";
			next.className = "mnz-btn";
			next.textContent = i + 1 < Q.length ? "Next question →" : "See result";
			next.addEventListener("click", () => { i++; if (i < Q.length) show(); else finish(); });
			foot.appendChild(next);
			paintDots();
			next.focus({ preventScroll: true });
		}

		function finish() {
			paintDots();
			const n = results.filter(Boolean).length;
			const perfect = n === Q.length;
			const verdict = perfect ? "Flawless — every answer right."
				: n >= Q.length * 0.6 ? "Solid! Re-read the explanations for the ones you missed."
				: "Worth another look at the section above — then try again.";
			body.innerHTML =
				'<div class="mnz-result"><div class="mnz-score">' + n + " <small>/ " + Q.length + "</small></div>" +
				'<p class="mnz-verdict">' + verdict + "</p>" +
				'<button type="button" class="mnz-btn mnz-btn--ghost">↺ Try again</button></div>';
			body.querySelector("button").addEventListener("click", () => { i = 0; results = []; show(); });
			if (perfect && window.MNQuest) {
				window.MNQuest.xp(30, "· perfect quiz", "quiz-perfect-" + id);
				window.MNQuest.unlock("perfect-round");
			}
			window.dispatchEvent(new CustomEvent("mnquiz:finish", { detail: { id: id, score: n, total: Q.length } }));
		}

		show();
	}

	function mountAll() {
		document.querySelectorAll(".mn-quiz").forEach(mount);
	}

	window.MNQuiz = { mountAll: mountAll };
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll);
	else mountAll();
	window.addEventListener("blogPostLoadComplete", mountAll);
})();
