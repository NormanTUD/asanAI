/* TEN MINUTES — Chinese Room simulator (vanilla JS, no jQuery). */
(function () {
	"use strict";

	var DE = !!(window.TM && TM.lang && TM.lang() === "de");

	var rounds = [
		{
			input: "ᐅᓪᓗᒥ ᓯᓚ ᖃᓄᐃᑦᑐᖅ?",
			correct: "ᓯᓚ ᐊᒃᓱᕈᕐᓇᖅᑐᖅ ᐅᓪᓗᒥ",
			distractors: ["ᐃᒡᓗ ᐊᖏᔪᖅ", "ᓇᒃᓴᕐᓗᒍ ᑎᒥᖅ", "ᐃᓄᒃ ᑕᑯᔪᖅ"],
			rules: [
				["ᐅᓪᓗᒥ ᓯᓚ ᖃᓄᐃᑦᑐᖅ?", "ᓯᓚ ᐊᒃᓱᕈᕐᓇᖅᑐᖅ ᐅᓪᓗᒥ"],
				["ᓇᑭᑦ?", "ᐃᖃᓗᐃᑦ ᐅᕙᖓ"]
			],
			english: "Q: How is the weather today? → A: The weather is harsh today.",
			german: "F: Wie ist das Wetter heute? → A: Das Wetter ist heute rau."
		},
		{
			input: "ᐊᐱᖅᓱᖅᑐᖅ ᐊᐅᓚᔪᖅ?",
			correct: "ᐄ, ᐊᓄᕆ ᓴᖑᓪᓗᓂ",
			distractors: ["ᐅᖃᓕᒫᒐᖅ ᐱᐅᔪᖅ", "ᓂᕆᔪᒪᔪᖅ ᐃᒻᒪᖄ", "ᑐᒃᑐ ᐊᖏᔪᖅ"],
			rules: [
				["ᐊᐱᖅᓱᖅᑐᖅ ᐊᐅᓚᔪᖅ?", "ᐄ, ᐊᓄᕆ ᓴᖑᓪᓗᓂ"],
				["ᖃᖓ?", "ᐅᓪᓗᒥ ᐅᓐᓄᓴᒃᑯᑦ"]
			],
			english: "Q: Is the wind blowing? → A: Yes, the wind is shifting.",
			german: "F: Weht der Wind? → A: Ja, der Wind dreht."
		},
		{
			input: "ᓇᒧᑦ ᐊᐅᓪᓚᖅᐱᑦ?",
			correct: "ᓂᐅᕕᕐᕕᒧᑦ ᐊᐅᓪᓚᖅᑐᖓ",
			distractors: ["ᐃᒡᓗ ᓯᑯᐃᔭᖅᑐᖅ", "ᐊᕐᓇᖅ ᐃᓱᒪᔪᖅ", "ᓄᓇᕗᑦ ᐊᖏᔪᖅ"],
			rules: [
				["ᓇᒧᑦ ᐊᐅᓪᓚᖅᐱᑦ?", "ᓂᐅᕕᕐᕕᒧᑦ ᐊᐅᓪᓚᖅᑐᖓ"],
				["ᖃᓄᐃᒻᒪᑦ?", "ᓂᕿᑦᑎᐊᕙᐅᔪᖅ"]
			],
			english: "Q: Where are you going? → A: I am going to the store.",
			german: "F: Wohin gehst du? → A: Ich gehe zum Laden."
		},
		{
			input: "ᓂᕿᒃᓴᖃᖅᐱᑦ?",
			correct: "ᐄ, ᑐᒃᑐᒥᒃ ᓂᕆᔪᒪᔪᖓ",
			distractors: ["ᐅᒥᐊᖅ ᐊᐅᓚᔪᖅ", "ᓯᓚ ᖃᐅᔨᒪᔪᖅ", "ᐃᒡᓗ ᐅᖅᑰᔪᖅ"],
			rules: [
				["ᓂᕿᒃᓴᖃᖅᐱᑦ?", "ᐄ, ᑐᒃᑐᒥᒃ ᓂᕆᔪᒪᔪᖓ"],
				["ᑭᓱᒥᒃ?", "ᑐᒃᑐᒥᒃ ᐊᒻᒪ ᐃᖃᓗᒃ"]
			],
			english: "Q: Do you have food? → A: Yes, I want to eat caribou.",
			german: "F: Hast du Essen? → A: Ja, ich möchte Karibu essen."
		},
		{
			input: "ᖃᐅᔨᒪᕖᑦ ᐊᖅᑯᑎᒥᒃ?",
			correct: "ᓴᐅᒥᖕᒧᑦ ᐊᓂᒍᐊᕐᓗᑎᑦ",
			distractors: ["ᐃᓄᒃ ᓯᓂᒃᑐᖅ", "ᐊᕐᓇᖅ ᐃᒡᓗᒥ", "ᓇᓄᖅ ᑕᑯᔪᖅ"],
			rules: [
				["ᖃᐅᔨᒪᕖᑦ ᐊᖅᑯᑎᒥᒃ?", "ᓴᐅᒥᖕᒧᑦ ᐊᓂᒍᐊᕐᓗᑎᑦ"],
				["ᖃᓄᖅ ᐅᖓᓯᒃᑎᒋᕙ?", "ᐅᖓᓯᒃᑑᖏᑦᑐᖅ"]
			],
			english: "Q: Do you know the way? → A: Go past it to the left.",
			german: "F: Kennst du den Weg? → A: Geh links daran vorbei."
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
			german: "F: Ist die Schule geschlossen? → (Nicht im Regelbuch, du steckst fest!)",
			isTrick: true
		}
	];

	var currentRound = 0;
	var score = 0;
	var timerInterval = null;
	var timerElapsed = 0;
	var timerStart = 0;
	var timerRunning = false;
	var timerEnabled = false;
	var visible = false;

	function $(id) { return document.getElementById(id); }
	function shuffle(list) {
		var a = list.slice();
		for (var i = a.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var t = a[i]; a[i] = a[j]; a[j] = t;
		}
		return a;
	}
	function updateTimer() {
		var el = $("cr-timer-val");
		if (!el) return;
		var value = timerElapsed + (timerRunning ? (performance.now() - timerStart) / 1000 : 0);
		el.textContent = value.toFixed(1);
	}
	function startTimer() {
		if (!visible || !timerEnabled || timerRunning) return;
		timerStart = performance.now();
		timerRunning = true;
		clearInterval(timerInterval);
		timerInterval = setInterval(updateTimer, 100);
		updateTimer();
	}
	function pauseTimer() {
		if (!timerRunning) return;
		timerElapsed += (performance.now() - timerStart) / 1000;
		timerRunning = false;
		clearInterval(timerInterval);
		updateTimer();
	}
	function resetTimer() {
		pauseTimer();
		timerElapsed = 0;
		updateTimer();
	}
	function stopTimer() {
		pauseTimer();
		return timerElapsed;
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
		timerEnabled = true;
		resetTimer();
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
			feedback.innerHTML = DE
				? "<b>Das steht nicht im Regelbuch.</b> Die Eingabe passt zu keiner Regel. Du steckst fest, genau wie ein Modell, das auf etwas außerhalb seiner Trainingsverteilung trifft."
				: "<b>That is not in the rulebook.</b> The input matches no rule. You are stuck, just like a model meeting something truly outside its training distribution.";
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
			feedback.textContent = (DE ? "Richtig. (" : "Correct. (") + elapsed.toFixed(1) + "s)";
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
			feedback.textContent = DE ? "Schau noch einmal ins Regelbuch." : "Check the rulebook again.";
		}
	}
	function celebrate() {
		if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		var old = document.querySelector(".cr-confetti");
		if (old) old.remove();
		var canvas = document.createElement("canvas");
		canvas.className = "cr-confetti";
		canvas.setAttribute("aria-hidden", "true");
		document.body.appendChild(canvas);
		var dpr = Math.min(window.devicePixelRatio || 1, 2);
		var w = window.innerWidth, h = window.innerHeight;
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		var ctx = canvas.getContext("2d");
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		var palette = ["#63a44b", "#5c9baf", "#9f9700", "#9185be", "#1275ac"];
		var parts = [];
		for (var i = 0; i < 54; i++) {
			parts.push({
				x: 12 + Math.random() * 30,
				y: h + 8,
				vx: 2 + Math.random() * 5,
				vy: -(6 + Math.random() * 7),
				size: 3 + Math.random() * 4,
				color: palette[i % palette.length],
				life: 1,
				spin: Math.random() * Math.PI
			});
		}
		var start = performance.now();
		function frame(now) {
			var dt = Math.min(2, (now - start) / 16.7);
			ctx.clearRect(0, 0, w, h);
			parts.forEach(function (p) {
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				p.vy += 0.18 * dt;
				p.vx *= 0.995;
				p.life -= 0.018 * dt;
				p.spin += 0.14 * dt;
				if (p.life <= 0) return;
				ctx.save();
				ctx.globalAlpha = Math.max(0, p.life);
				ctx.translate(p.x, p.y);
				ctx.rotate(p.spin);
				ctx.fillStyle = p.color;
				ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
				ctx.restore();
			});
			if (now - start < 2200) {
				requestAnimationFrame(frame);
			} else {
				canvas.remove();
			}
		}
		requestAnimationFrame(frame);
	}

	function showReveal() {
		timerEnabled = false;
		stopTimer();
		$("cr-room").hidden = true;
		$("cr-reveal").hidden = false;
		$("cr-translations").hidden = true;
		if (score === rounds.length - 1) celebrate();
		$("cr-reveal-translations").hidden = false;
		var pct = Math.round((score / (rounds.length - 1)) * 100);
		$("cr-accuracy").textContent = pct + "%";
		var bar = $("cr-accuracy-bar");
		if (bar) bar.style.width = pct + "%";
		var tbody = $("cr-translation-body");
		tbody.innerHTML = "";
		rounds.forEach(function (r) {
			var tr = document.createElement("tr");
			[r.input, r.correct || "—", DE ? r.german : r.english].forEach(function (text, i) {
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
		if ("IntersectionObserver" in window) {
			var host = $("cr-sim") || $("cr-room");
			new IntersectionObserver(function (entries) {
				visible = !!(entries[0] && entries[0].isIntersecting && entries[0].intersectionRatio > 0.12);
				if (visible) startTimer();
				else pauseTimer();
			}, { threshold: [0, 0.12, 0.5] }).observe(host);
		} else {
			visible = true;
		}
		start();
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
	else init();
})();
