/* TEN MINUTES — Chinese Room simulator (vanilla JS, no jQuery). */
(function () {
	"use strict";

	var rounds = [
		{
			input: "ᐅᓪᓗᒥ ᓯᓚ ᖃᓄᐃᑦᑐᖅ?",
			correct: "ᓯᓚ ᐊᒃᓱᕈᕐᓇᖅᑐᖅ ᐅᓪᓗᒥ",
			distractors: ["ᐃᒡᓗ ᐊᖏᔪᖅ", "ᓇᒃᓴᕐᓗᒍ ᑎᒥᖅ", "ᐃᓄᒃ ᑕᑯᔪᖅ"],
			rules: [
				["ᐅᓪᓗᒥ ᓯᓚ ᖃᓄᐃᑦᑐᖅ?", "ᓯᓚ ᐊᒃᓱᕈᕐᓇᖅᑐᖅ ᐅᓪᓗᒥ"],
				["ᓇᑭᑦ?", "ᐃᖃᓗᐃᑦ ᐅᕙᖓ"]
			],
			english: "Q: How is the weather today? → A: The weather is harsh today."
		},
		{
			input: "ᐊᐱᖅᓱᖅᑐᖅ ᐊᐅᓚᔪᖅ?",
			correct: "ᐄ, ᐊᓄᕆ ᓴᖑᓪᓗᓂ",
			distractors: ["ᐅᖃᓕᒫᒐᖅ ᐱᐅᔪᖅ", "ᓂᕆᔪᒪᔪᖅ ᐃᒻᒪᖄ", "ᑐᒃᑐ ᐊᖏᔪᖅ"],
			rules: [
				["ᐊᐱᖅᓱᖅᑐᖅ ᐊᐅᓚᔪᖅ?", "ᐄ, ᐊᓄᕆ ᓴᖑᓪᓗᓂ"],
				["ᖃᖓ?", "ᐅᓪᓗᒥ ᐅᓐᓄᓴᒃᑯᑦ"]
			],
			english: "Q: Is the wind blowing? → A: Yes, the wind is shifting."
		},
		{
			input: "ᓇᒧᑦ ᐊᐅᓪᓚᖅᐱᑦ?",
			correct: "ᓂᐅᕕᕐᕕᒧᑦ ᐊᐅᓪᓚᖅᑐᖓ",
			distractors: ["ᐃᒡᓗ ᓯᑯᐃᔭᖅᑐᖅ", "ᐊᕐᓇᖅ ᐃᓱᒪᔪᖅ", "ᓄᓇᕗᑦ ᐊᖏᔪᖅ"],
			rules: [
				["ᓇᒧᑦ ᐊᐅᓪᓚᖅᐱᑦ?", "ᓂᐅᕕᕐᕕᒧᑦ ᐊᐅᓪᓚᖅᑐᖓ"],
				["ᖃᓄᐃᒻᒪᑦ?", "ᓂᕿᑦᑎᐊᕙᐅᔪᖅ"]
			],
			english: "Q: Where are you going? → A: I am going to the store."
		},
		{
			input: "ᓂᕿᒃᓴᖃᖅᐱᑦ?",
			correct: "ᐄ, ᑐᒃᑐᒥᒃ ᓂᕆᔪᒪᔪᖓ",
			distractors: ["ᐅᒥᐊᖅ ᐊᐅᓚᔪᖅ", "ᓯᓚ ᖃᐅᔨᒪᔪᖅ", "ᐃᒡᓗ ᐅᖅᑰᔪᖅ"],
			rules: [
				["ᓂᕿᒃᓴᖃᖅᐱᑦ?", "ᐄ, ᑐᒃᑐᒥᒃ ᓂᕆᔪᒪᔪᖓ"],
				["ᑭᓱᒥᒃ?", "ᑐᒃᑐᒥᒃ ᐊᒻᒪ ᐃᖃᓗᒃ"]
			],
			english: "Q: Do you have food? → A: Yes, I want to eat caribou."
		},
		{
			input: "ᖃᐅᔨᒪᕖᑦ ᐊᖅᑯᑎᒥᒃ?",
			correct: "ᓴᐅᒥᖕᒧᑦ ᐊᓂᒍᐊᕐᓗᑎᑦ",
			distractors: ["ᐃᓄᒃ ᓯᓂᒃᑐᖅ", "ᐊᕐᓇᖅ ᐃᒡᓗᒥ", "ᓇᓄᖅ ᑕᑯᔪᖅ"],
			rules: [
				["ᖃᐅᔨᒪᕖᑦ ᐊᖅᑯᑎᒥᒃ?", "ᓴᐅᒥᖕᒧᑦ ᐊᓂᒍᐊᕐᓗᑎᑦ"],
				["ᖃᓄᖅ ᐅᖓᓯᒃᑎᒋᕙ?", "ᐅᖓᓯᒃᑑᖏᑦᑐᖅ"]
			],
			english: "Q: Do you know the way? → A: Go past it to the left."
		},
		{
			input: "ᐃᓕᓐᓂᐊᕐᕕᒃ ᒪᑐᓯᒪᕖᑦ?",
			correct: null,
			distractors: ["ᐊᕐᓇᖅ ᐃᒡᓗᒥ", "ᓯᓚ ᐊᒃᓱᕈᕐᓇᖅᑐᖅ ᐅᓪᓗᒥ", "ᐄ, ᐊᓄᕆ ᓴᖑᓪᓗᓂ", "ᓂᐅᕕᕐᕕᒧᑦ ᐊᐅᓪᓚᖅᑐᖓ"],
			rules: [
				["ᐅᓪᓗᒥ ᓯᓚ ᖃᓄᐃᑦᑐᖅ?", "ᓯᓚ ᐊᒃᓱᕈᕐᓇᖅᑐᖅ ᐅᓪᓗᒥ"],
				["ᓇᒧᑦ ᐊᐅᓪᓚᖅᐱᑦ?", "ᓂᐅᕕᕐᕕᒧᑦ ᐊᐅᓪᓚᖅᑐᖓ"],
				["ᖃᐅᔨᒪᕖᑦ ᐊᖅᑯᑎᒥᒃ?", "ᓴᐅᒥᖕᒧᑦ ᐊᓂᒍᐊᕐᓗᑎᑦ"]
			],
			english: "Q: Is the school closed? → (Not in your rulebook, you're stuck!)",
			isTrick: true
		}
	];

	var currentRound = 0;
	var score = 0;
	var timerInterval = null;
	var roundStartTime = 0;

	function $(id) { return document.getElementById(id); }
	function shuffle(list) {
		var a = list.slice();
		for (var i = a.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var t = a[i]; a[i] = a[j]; a[j] = t;
		}
		return a;
	}
	function startTimer() {
		roundStartTime = performance.now();
		var el = $("cr-timer-val");
		clearInterval(timerInterval);
		timerInterval = setInterval(function () {
			if (el) el.textContent = ((performance.now() - roundStartTime) / 1000).toFixed(1);
		}, 100);
	}
	function stopTimer() {
		clearInterval(timerInterval);
		return (performance.now() - roundStartTime) / 1000;
	}
	function renderRound() {
		var r = rounds[currentRound];
		var room = $("cr-room");
		var reveal = $("cr-reveal");
		if (room) room.hidden = false;
		if (reveal) reveal.hidden = true;
		$("cr-round-num").textContent = currentRound + 1;
		$("cr-total-rounds").textContent = rounds.length;
		$("cr-incoming-msg").textContent = r.input;

		var tbody = $("cr-rulebook-body");
		tbody.innerHTML = "";
		r.rules.forEach(function (rule) {
			var tr = document.createElement("tr");
			var a = document.createElement("td");
			var b = document.createElement("td");
			a.textContent = rule[0];
			b.textContent = rule[1];
			tr.appendChild(a);
			tr.appendChild(b);
			tbody.appendChild(tr);
		});

		var options = r.isTrick ? shuffle(r.distractors) : shuffle([r.correct].concat(r.distractors));
		var box = $("cr-options");
		box.innerHTML = "";
		options.forEach(function (opt) {
			var btn = document.createElement("button");
			btn.type = "button";
			btn.className = "cr-choice";
			btn.textContent = opt;
			btn.addEventListener("click", function () { handleChoice(opt, btn); });
			box.appendChild(btn);
		});

		$("cr-feedback").textContent = "";
		startTimer();
	}
	function disableOptions() {
		var buttons = $("cr-options").querySelectorAll("button");
		buttons.forEach(function (b) { b.disabled = true; b.classList.add("is-spent"); });
	}
	function handleChoice(chosen, btn) {
		var r = rounds[currentRound];
		var elapsed = stopTimer();
		var feedback = $("cr-feedback");
		if (r.isTrick) {
			btn.classList.add("is-wrong");
			disableOptions();
			feedback.innerHTML = "<b>That is not in the rulebook.</b> The input matches no rule. You are stuck, just like a model meeting something truly outside its training distribution.";
			setTimeout(showReveal, 2800);
			return;
		}
		if (chosen === r.correct) {
			score++;
			btn.classList.add("is-right");
			$("cr-rulebook-body").querySelectorAll("tr").forEach(function (tr) {
				if (tr.firstChild.textContent === r.input) tr.classList.add("is-match");
			});
			disableOptions();
			feedback.textContent = "Correct. (" + elapsed.toFixed(1) + "s)";
			setTimeout(function () {
				currentRound++;
				if (currentRound < rounds.length) renderRound();
				else showReveal();
			}, 1100);
		} else {
			btn.classList.add("is-wrong");
			btn.disabled = true;
			$("cr-rulebook-body").querySelectorAll("tr").forEach(function (tr) {
				if (tr.firstChild.textContent === r.input) tr.classList.add("is-hint");
			});
			feedback.textContent = "Check the rulebook again.";
		}
	}
	function showReveal() {
		stopTimer();
		$("cr-room").hidden = true;
		$("cr-reveal").hidden = false;
		$("cr-translations").hidden = true;
		$("cr-reveal-translations").hidden = false;
		var pct = Math.round((score / (rounds.length - 1)) * 100);
		$("cr-accuracy").textContent = pct + "%";
		var bar = $("cr-accuracy-bar");
		if (bar) bar.style.width = pct + "%";
		var tbody = $("cr-translation-body");
		tbody.innerHTML = "";
		rounds.forEach(function (r) {
			var tr = document.createElement("tr");
			[r.input, r.correct || "—", r.english].forEach(function (text, i) {
				var td = document.createElement("td");
				td.textContent = text;
				if (i === 1) td.className = "cr-trans-out";
				tr.appendChild(td);
			});
			if (r.isTrick) tr.className = "is-trick";
			tbody.appendChild(tr);
		});
	}
	function revealTranslations() {
		$("cr-translations").hidden = false;
		$("cr-reveal-translations").hidden = true;
	}
	function start() {
		currentRound = 0;
		score = 0;
		renderRound();
	}

	window.CRSim = { start: start, revealTranslations: revealTranslations };
	function init() {
		if (!$("cr-room")) return;
		var restart = $("cr-restart");
		var revealBtn = $("cr-reveal-translations");
		if (restart) restart.addEventListener("click", start);
		if (revealBtn) revealBtn.addEventListener("click", revealTranslations);
		start();
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
	else init();
})();
