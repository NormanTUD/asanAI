// MNQuest — XP, levels, achievements, lesson quests and the progress
// overview (the badge in the bottom-left corner). Everything is stored in
// this browser only (localStorage); nothing is ever sent anywhere.
//
// Public API (used by quiz.js / lab_challenges.js and the demos):
//   MNQuest.xp(amount, reason, key?)   award XP (once per key, if given)
//   MNQuest.count(counter, n?)         bump a counter that drives achievements
//   MNQuest.unlock(id)                 unlock an achievement directly
//   MNQuest.done(key) / MNQuest.mark(key)
//   MNQuest.open(tab?)                 open the overview
//
// Console only (there is deliberately no reset button):
//   mnResetProgress = true             wipe XP, levels, achievements, everything
//   resetChallenges()                  reset all lab challenges (XP stays)
//   resetChallenges("nn-")             reset challenges whose id starts with "nn-"
//   resetChallenges(null, true)        reset all challenges and remove their XP
//   MNQuest.listChallenges()           table of all challenges

(function () {
	"use strict";
	if (window.MNQuest) return;

	const STORE = "mn_quest_v1";

	const LEVELS = [
		{ xp: 0, name: "Pebble Counter", icon: "🪨" },
		{ xp: 60, name: "Tally Carver", icon: "🪵" },
		{ xp: 160, name: "Abacus Apprentice", icon: "🧮" },
		{ xp: 320, name: "Logarithm Lover", icon: "📜" },
		{ xp: 540, name: "Difference Engineer", icon: "⚙️" },
		{ xp: 820, name: "Punch-Card Poet", icon: "🗂️" },
		{ xp: 1180, name: "Perceptron Pilot", icon: "🔌" },
		{ xp: 1620, name: "Backprop Bard", icon: "🔁" },
		{ xp: 2160, name: "Attention Architect", icon: "🎯" },
		{ xp: 2800, name: "Frontier Researcher", icon: "🚀" }
	];

	const CATEGORIES = [
		["explore", "Exploration"], ["read", "Reading"], ["curiosity", "Curiosity"], ["demos", "Demos & labs"],
		["quiz", "Quizzes"], ["mastery", "Mastery"], ["habit", "Habits"], ["special", "Specials"], ["hidden", "Hidden achievements"]
	];

	const ACHIEVEMENTS = {
		"first-steps": { cat: "explore", icon: "👣", name: "First Steps", desc: "Earn your first XP." },
		"explorer-5": { cat: "explore", icon: "🧭", name: "Explorer", desc: "Visit 5 different lessons.", counter: "lessons", goal: 5 },
		"explorer-20": { cat: "explore", icon: "🗺️", name: "Cartographer", desc: "Visit 20 different lessons.", counter: "lessons", goal: 20 },
		"explorer-all": { cat: "explore", icon: "🌍", name: "Completionist", desc: "Visit every lesson of the course.", counter: "lessons", goal: "all" },
		"part-explorer": { cat: "explore", icon: "🧩", name: "Part Explorer", desc: "Visit every lesson of one part of the course." },
		"bookworm": { cat: "read", icon: "📖", name: "Bookworm", desc: "Read 5 lessons to the end.", counter: "finished", goal: 5 },
		"scholar": { cat: "read", icon: "🎓", name: "Scholar", desc: "Read 25 lessons to the end.", counter: "finished", goal: 25 },
		"source-checker": { cat: "read", icon: "📚", name: "Source Checker", desc: "Follow 10 citations to their sources.", counter: "sources", goal: 10 },
		"deep-diver": { cat: "curiosity", icon: "🤿", name: "Deep Diver", desc: "Open 10 optional deep-dive boxes.", counter: "optionals", goal: 10 },
		"abyss": { cat: "curiosity", icon: "🐙", name: "Into the Abyss", desc: "Open 50 deep-dive boxes.", counter: "optionals", goal: 50 },
		"curiosity-cat": { cat: "curiosity", icon: "🐈", name: "Curiosity Cat", desc: "Open every deep dive on a single page." },
		"seeker": { cat: "curiosity", icon: "🔎", name: "Seeker", desc: "Use the course search." },
		"window-shopper": { cat: "demos", icon: "👀", name: "Window Shopper", desc: "Watch 10 interactive demos.", counter: "demosSeen", goal: 10 },
		"tinkerer": { cat: "demos", icon: "🛠️", name: "Tinkerer", desc: "Play with 10 different demos.", counter: "demosPlayed", goal: 10 },
		"lab-rat": { cat: "demos", icon: "🧪", name: "Lab Rat", desc: "Complete 3 lab challenges.", counter: "challenges", goal: 3 },
		"mad-scientist": { cat: "demos", icon: "⚗️", name: "Mad Scientist", desc: "Complete 15 lab challenges.", counter: "challenges", goal: 15 },
		"grand-experimenter": { cat: "demos", icon: "🔬", name: "Grand Experimenter", desc: "Complete every lab challenge in the course.", counter: "challenges", goal: "allChallenges" },
		"architect": { cat: "demos", icon: "🕸️", name: "Network Architect", desc: "Complete every challenge in the Neural Network Playground." },
		"fog-walker": { cat: "demos", icon: "🌫️", name: "Fog Walker", desc: "Find the global minimum in Foggy Mountain (3 stars).", counter: "fog3", goal: 1 },
		"fog-master": { cat: "demos", icon: "🏔️", name: "Mountain Guide", desc: "Earn 3 stars in Foggy Mountain five times.", counter: "fog3", goal: 5 },
		"quiz-first": { cat: "quiz", icon: "✅", name: "Checked Yourself", desc: "Answer a quiz question correctly.", counter: "quizCorrect", goal: 1 },
		"quiz-10": { cat: "quiz", icon: "💡", name: "Quiz Whiz", desc: "Answer 10 quiz questions correctly.", counter: "quizCorrect", goal: 10 },
		"quiz-25": { cat: "quiz", icon: "🏛️", name: "Quiz Master", desc: "Answer 25 quiz questions correctly.", counter: "quizCorrect", goal: 25 },
		"perfect-round": { cat: "quiz", icon: "💎", name: "Flawless", desc: "Finish a whole quiz with every answer right." },
		"mastered-1": { cat: "mastery", icon: "🏆", name: "Lesson Mastered", desc: "Complete every quest of one lesson.", counter: "mastered", goal: 1 },
		"mastered-5": { cat: "mastery", icon: "🥇", name: "Master of Five", desc: "Master 5 lessons.", counter: "mastered", goal: 5 },
		"mastered-15": { cat: "mastery", icon: "🌟", name: "Polymath", desc: "Master 15 lessons.", counter: "mastered", goal: 15 },
		"level-5": { cat: "mastery", icon: "🏅", name: "Difference Engineer", desc: "Reach level 5." },
		"level-10": { cat: "mastery", icon: "👑", name: "Frontier Researcher", desc: "Reach the highest level." },
		"streak-3": { cat: "habit", icon: "🔥", name: "On a Roll", desc: "Learn on 3 different days.", counter: "days", goal: 3 },
		"streak-7": { cat: "habit", icon: "🌋", name: "Habit Formed", desc: "Learn on 7 different days.", counter: "days", goal: 7 },
		"streak-fire": { cat: "habit", icon: "📅", name: "Three in a Row", desc: "Learn on three consecutive days." },
		"night-owl": { cat: "habit", icon: "🦉", name: "Night Owl", desc: "Study between midnight and 4 a.m." },
		"early-bird": { cat: "habit", icon: "🐦", name: "Early Bird", desc: "Study between 5 and 7 a.m." },
		"globetrotter": { cat: "special", icon: "🛰️", name: "Globetrotter", desc: "Open the Atlas of the course." },
		"big-picture": { cat: "special", icon: "🕸", name: "The Big Picture", desc: "Open the knowledge map or the course graph." },
		"light-and-shadow": { cat: "special", icon: "🌗", name: "Light & Shadow", desc: "Switch between light and dark mode." },
		"focus-mode": { cat: "special", icon: "🧘", name: "Focus Mode", desc: "Try reader mode." },
		"self-aware": { cat: "special", icon: "🪞", name: "Know Thyself", desc: "Mark 3 lessons as learned.", counter: "learned", goal: 3 },
		"konami": { cat: "hidden", icon: "🎮", name: "Old-School Gamer", desc: "↑ ↑ ↓ ↓ ← → ← → B A", hidden: true },
		"four-leaf": { cat: "hidden", icon: "🍀", name: "Four-Leaf Clover", desc: "Pure luck: a 1-in-100 chance on any page view.", hidden: true, hint: "Some page views are luckier than others." },
		"the-answer": { cat: "hidden", icon: "🌌", name: "The Answer", desc: "Have an XP total that ends in 42.", hidden: true, hint: "Life, the universe and your XP…" },
		"pi-time": { cat: "hidden", icon: "🥧", name: "Pi o'Clock", desc: "Study at 3:14 or on Pi Day (14 March).", hidden: true, hint: "Some moments are irrational." },
		"friday-13": { cat: "hidden", icon: "🐈‍⬛", name: "Not Superstitious", desc: "Study on a Friday the 13th.", hidden: true, hint: "Black cats welcome." },
		"turing-day": { cat: "hidden", icon: "🎂", name: "Happy Birthday, Alan", desc: "Study on 23 June, Alan Turing's birthday.", hidden: true, hint: "Someone important was born on this day." },
		"poke": { cat: "hidden", icon: "👉", name: "Stop Poking Me", desc: "Poke your level icon seven times in a row.", hidden: true, hint: "Your level icon is ticklish." },
		"disco": { cat: "hidden", icon: "🪩", name: "Disco Fever", desc: "Flip between light and dark mode 8 times on one page.", hidden: true, hint: "Lights on, lights off, lights on…" },
		"speedrun": { cat: "hidden", icon: "🏎️", name: "Speedrunner", desc: "Zip to the bottom of a long page and back to the top in under 3 seconds.", hidden: true, hint: "Top to bottom to top. Fast." },
		"lost-in-thought": { cat: "hidden", icon: "💭", name: "Lost in Thought", desc: "Stay on a page for 5 minutes without touching anything, then carry on.", hidden: true, hint: "Sometimes it pays to just sit and think." },
		"copy-paste": { cat: "hidden", icon: "📋", name: "Copy-Paste Engineer", desc: "Copy a code example from a lesson.", hidden: true, hint: "Real programmers…" }
	};

	function blank() {
		return {
			xp: 0, keys: {}, earned: {}, unlocked: {}, counters: {}, days: {},
			lessons: {}, finished: {}, mastered: {}, quests: {}, bests: {}, demosSeen: {}, demosPlayed: {}, learned: {}
		};
	}

	const MAPS = ["keys", "earned", "unlocked", "days", "lessons", "finished", "mastered", "quests", "bests", "demosSeen", "demosPlayed", "learned"];

	function readStore() {
		try {
			const raw = localStorage.getItem(STORE);
			if (raw) return Object.assign(blank(), JSON.parse(raw));
		} catch (e) { /* private mode / broken JSON */ }
		return null;
	}

	// Another tab, or this page restored from the back/forward cache, may
	// hold an older copy of the progress. Merge instead of overwriting, so
	// nothing that was unlocked elsewhere gets lost. A reset (newer `rev`)
	// wins over everything older.
	function merge(mine, theirs) {
		if (!theirs) return mine;
		if ((theirs.rev || 0) !== (mine.rev || 0)) return (theirs.rev || 0) > (mine.rev || 0) ? theirs : mine;
		const out = Object.assign(blank(), mine);
		out.xp = Math.max(mine.xp || 0, theirs.xp || 0);
		MAPS.forEach((k) => { out[k] = Object.assign({}, theirs[k] || {}, mine[k] || {}); });
		Object.keys(theirs.unlocked || {}).forEach((id) => {
			if (mine.unlocked && mine.unlocked[id]) out.unlocked[id] = Math.min(mine.unlocked[id], theirs.unlocked[id]);
		});
		out.counters = Object.assign({}, theirs.counters || {});
		Object.keys(mine.counters || {}).forEach((k) => { out.counters[k] = Math.max(mine.counters[k], out.counters[k] || 0); });
		return out;
	}

	let state = readStore() || blank();

	function writeNow(replace) {
		clearTimeout(saveTimer);
		if (!replace) state = merge(state, readStore());
		try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ }
	}

	let saveTimer = 0;
	function save() {
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => writeNow(false), 60);
		window.dispatchEvent(new CustomEvent("mnquest:change"));
	}
	window.addEventListener("pagehide", () => writeNow(false));
	window.addEventListener("visibilitychange", () => { if (document.hidden) writeNow(false); });

	function resync() {
		const before = Object.keys(state.unlocked).length + "|" + state.xp;
		state = merge(state, readStore());
		if (before === Object.keys(state.unlocked).length + "|" + state.xp) return;
		renderHud(false);
		renderPanel();
		window.dispatchEvent(new CustomEvent("mnquest:change"));
	}
	window.addEventListener("storage", (e) => { if (e.key === STORE) resync(); });
	window.addEventListener("pageshow", (e) => { if (e.persisted) resync(); });

	const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	// ── Helpers ─────────────────────────────────────────────────────
	function navModules() {
		return (window.__moduleNavData && window.__moduleNavData.modules) || [];
	}

	function goalOf(a) {
		if (a.goal === "all") return Math.max(1, navModules().length || 100);
		if (a.goal === "allChallenges") return Math.max(1, window.MNChallengeCatalog ? window.MNChallengeCatalog.total() : 30);
		return a.goal;
	}

	function counterValue(name) {
		if (name === "days") return Object.keys(state.days).length;
		if (name === "lessons") return Object.keys(state.lessons).length;
		if (name === "finished") return Object.keys(state.finished).length;
		if (name === "mastered") return Object.keys(state.mastered).length;
		if (name === "demosSeen") return Object.keys(state.demosSeen).length;
		if (name === "demosPlayed") return Object.keys(state.demosPlayed).length;
		if (name === "learned") return Object.keys(state.learned).length;
		return state.counters[name] || 0;
	}

	function dayKey(d) {
		return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
	}

	function streak() {
		let n = 0;
		const d = new Date();
		while (state.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
		return n;
	}

	function levelOf(xp) {
		let i = 0;
		while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
		const cur = LEVELS[i], next = LEVELS[i + 1];
		return { n: i + 1, name: cur.name, icon: cur.icon, from: cur.xp, to: next ? next.xp : cur.xp, frac: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1, max: !next };
	}

	function esc(s) {
		return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
	}

	function node(tag, cls, html) {
		const n = document.createElement(tag);
		if (cls) n.className = cls;
		if (html !== undefined) n.innerHTML = html;
		return n;
	}

	// ── HUD + toasts ────────────────────────────────────────────────
	let hud, toastWrap, panel;

	function buildUI() {
		if (hud || !document.body) return;
		hud = node("button", "mnq-hud");
		hud.id = "mnq-hud";
		hud.type = "button";
		hud.setAttribute("aria-label", "Your progress: level, achievements and challenges");
		hud.title = "Your progress";
		hud.innerHTML =
			'<svg class="mnq-ring" viewBox="0 0 36 36" aria-hidden="true"><circle class="mnq-ring-bg" cx="18" cy="18" r="15.5"/><circle class="mnq-ring-fg" cx="18" cy="18" r="15.5"/></svg>' +
			'<span class="mnq-hud-icon" aria-hidden="true"></span><span class="mnq-hud-text"><b class="mnq-hud-lv"></b><span class="mnq-hud-xp"></span></span><span class="mnq-hud-streak" hidden></span>';
		hud.addEventListener("click", () => openPanel());
		document.body.appendChild(hud);
		document.documentElement.classList.add("mnq-on");
		toastWrap = node("div", "mnq-toasts");
		toastWrap.setAttribute("aria-live", "polite");
		document.body.appendChild(toastWrap);
		renderHud(false);
	}

	function renderHud(bump) {
		if (!hud) return;
		const L = levelOf(state.xp);
		hud.querySelector(".mnq-hud-icon").textContent = L.icon;
		hud.querySelector(".mnq-hud-lv").textContent = "Level " + L.n;
		hud.querySelector(".mnq-hud-xp").textContent = state.xp + " XP";
		const c = 2 * Math.PI * 15.5;
		const fg = hud.querySelector(".mnq-ring-fg");
		fg.style.strokeDasharray = c.toFixed(1);
		fg.style.strokeDashoffset = (c * (1 - L.frac)).toFixed(1);
		const st = streak(), sEl = hud.querySelector(".mnq-hud-streak");
		sEl.hidden = st < 2;
		sEl.textContent = "🔥 " + st;
		sEl.title = st + " days in a row";
		if (bump && !reduceMotion) {
			hud.classList.remove("is-bump");
			void hud.offsetWidth;
			hud.classList.add("is-bump");
		}
	}

	function toast(html, kind) {
		buildUI();
		if (!toastWrap) return;
		const t = node("div", "mnq-toast" + (kind ? " mnq-toast--" + kind : ""), html);
		if (kind === "ach" || kind === "level") {
			t.setAttribute("role", "button");
			t.tabIndex = 0;
			t.addEventListener("click", () => openPanel(kind === "ach" ? "achievements" : "overview"));
		}
		toastWrap.appendChild(t);
		requestAnimationFrame(() => t.classList.add("is-in"));
		const life = kind === "ach" || kind === "level" ? 4200 : 1500;
		setTimeout(() => { t.classList.remove("is-in"); setTimeout(() => t.remove(), 450); }, life);
		while (toastWrap.children.length > 4) toastWrap.firstChild.remove();
	}

	function burst(x, y) {
		if (reduceMotion || !document.body) return;
		const cv = node("canvas", "mnq-burst");
		const W = window.innerWidth, H = window.innerHeight;
		cv.width = W; cv.height = H;
		document.body.appendChild(cv);
		const ctx = cv.getContext("2d");
		const css = getComputedStyle(document.documentElement);
		const cols = ["--mn-accent", "--mn-sky", "--mn-emerald", "--mn-coral", "--mn-rose"].map((v) => css.getPropertyValue(v).trim() || "#6366f1");
		const parts = [];
		for (let i = 0; i < 80; i++) {
			const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, s = 4 + Math.random() * 7;
			parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 2 + Math.random() * 3, c: cols[i % cols.length], life: 1, rot: Math.random() * 6 });
		}
		const tick = () => {
			ctx.clearRect(0, 0, W, H);
			let alive = false;
			parts.forEach((p) => {
				p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.vx *= 0.99; p.life -= 0.011; p.rot += 0.2;
				if (p.life <= 0) return;
				alive = true;
				ctx.globalAlpha = Math.max(0, p.life);
				ctx.fillStyle = p.c;
				ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
				ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
				ctx.restore();
			});
			if (alive) requestAnimationFrame(tick); else cv.remove();
		};
		requestAnimationFrame(tick);
	}

	// ── Core state changes ──────────────────────────────────────────
	function checkCounters() {
		Object.keys(ACHIEVEMENTS).forEach((id) => {
			const a = ACHIEVEMENTS[id];
			if (a.counter && !state.unlocked[id] && counterValue(a.counter) >= goalOf(a)) unlock(id, true);
		});
		const L = levelOf(state.xp);
		if (L.n >= 5) unlock("level-5", true);
		if (L.n >= 10) unlock("level-10", true);
	}

	function unlock(id, silentSave) {
		const a = ACHIEVEMENTS[id];
		if (!a || state.unlocked[id]) return false;
		state.unlocked[id] = Date.now();
		buildUI();
		toast('<span class="mnq-t-icon">' + a.icon + '</span><span><small>Achievement unlocked</small><b>' + esc(a.name) + "</b><em>" + esc(a.desc) + "</em></span>", "ach");
		if (Object.keys(state.unlocked).length >= Object.keys(ACHIEVEMENTS).length) {
			const r = hud ? hud.getBoundingClientRect() : { left: 40, top: window.innerHeight - 40, width: 0, height: 0 };
			burst(r.left + r.width / 2, r.top);
		}
		if (!silentSave) { save(); renderHud(false); }
		renderPanel();
		return true;
	}

	function xp(amount, reason, key) {
		if (key) {
			if (state.keys[key]) return false;
			state.keys[key] = 1;
			state.earned[key] = amount;
		}
		const before = levelOf(state.xp).n;
		state.xp += amount;
		buildUI();
		if (amount >= 10) toast('<b class="mnq-plus">+' + amount + " XP</b> " + esc(reason || ""), "xp");
		const after = levelOf(state.xp);
		if (after.n > before) {
			toast('<span class="mnq-t-icon">' + after.icon + '</span><span><small>Level up · Level ' + after.n + "</small><b>" + esc(after.name) + "</b><em>Click to see your progress.</em></span>", "level");
		}
		if (!state.unlocked["first-steps"]) unlock("first-steps", true);
		if (state.xp % 100 === 42) unlock("the-answer", true);
		checkCounters();
		save();
		renderHud(after.n > before);
		return true;
	}

	function count(name, n) {
		state.counters[name] = (state.counters[name] || 0) + (n || 1);
		checkCounters();
		save();
		renderHud(false);
	}

	// ── Overview panel ──────────────────────────────────────────────
	let currentTab = "overview";

	function openPanel(tab) {
		buildUI();
		if (tab) currentTab = tab;
		if (panel) { renderPanel(); return; }
		panel = node("div", "mnq-panel-wrap");
		panel.innerHTML = '<div class="mnq-panel" role="dialog" aria-modal="true" aria-label="Your progress"></div>';
		document.body.appendChild(panel);
		document.documentElement.classList.add("mnq-panel-open");
		renderPanel();
		requestAnimationFrame(() => panel.classList.add("is-in"));
		panel.addEventListener("click", (e) => {
			if (e.target === panel) { closePanel(); return; }
			const ic = e.target.closest(".mnq-big-icon");
			if (ic) poke(ic);
			const t = e.target.closest("[data-mnq-tab]");
			if (t) { currentTab = t.getAttribute("data-mnq-tab"); renderPanel(); }
			if (e.target.closest(".mnq-close")) closePanel();
		});
		document.addEventListener("keydown", escClose);
		const c = panel.querySelector(".mnq-close");
		if (c) c.focus({ preventScroll: true });
	}

	function escClose(e) { if (e.key === "Escape") closePanel(); }

	let pokes = [];
	function poke(ic) {
		const now = Date.now();
		pokes = pokes.filter((t) => now - t < 3000).concat(now);
		if (!reduceMotion) {
			ic.classList.remove("is-poked");
			void ic.offsetWidth;
			ic.classList.add("is-poked");
		}
		if (pokes.length >= 7) { pokes = []; unlock("poke", false); }
	}

	function closePanel() {
		document.removeEventListener("keydown", escClose);
		if (!panel) return;
		const p = panel;
		panel = null;
		p.classList.remove("is-in");
		document.documentElement.classList.remove("mnq-panel-open");
		setTimeout(() => p.remove(), 260);
		if (hud) hud.focus({ preventScroll: true });
	}

	function renderPanel() {
		if (!panel) return;
		const L = levelOf(state.xp);
		const achIds = Object.keys(ACHIEVEMENTS);
		const got = achIds.filter((k) => state.unlocked[k]).length;
		const cat = window.MNChallengeCatalog;
		const chTotal = cat ? cat.total() : 0, chDone = cat ? cat.doneCount() : 0;
		const mods = navModules();
		const lessonsDone = mods.filter((m) => state.mastered[m.slug]).length;
		const tabs = [["overview", "Overview"], ["achievements", "Achievements <span>" + got + "/" + achIds.length + "</span>"]];
		if (cat) tabs.push(["challenges", "Lab challenges <span>" + chDone + "/" + chTotal + "</span>"]);
		if (mods.length) tabs.push(["lessons", "Lessons <span>" + lessonsDone + "/" + mods.length + "</span>"]);
		if (!tabs.some((t) => t[0] === currentTab)) currentTab = "overview";

		let body = "";
		if (currentTab === "overview") body = renderOverview(L);
		else if (currentTab === "achievements") body = renderAchievements();
		else if (currentTab === "challenges") body = renderChallenges();
		else body = renderLessons();

		const st = streak();
		panel.querySelector(".mnq-panel").innerHTML =
			'<button type="button" class="mnq-close" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>' +
			'<div class="mnq-panel-head"><span class="mnq-big-icon">' + L.icon + "</span><div>" +
			'<div class="mnq-kicker">Level ' + L.n + (st >= 2 ? ' · <span class="mnq-streak-chip">🔥 ' + st + "-day streak</span>" : "") + "</div>" +
			'<div class="mnq-title">' + esc(L.name) + "</div>" +
			'<div class="mnq-bar"><i style="width:' + (L.frac * 100).toFixed(1) + '%"></i></div>' +
			'<div class="mnq-sub">' + (L.max ? state.xp + " XP — top level reached" : state.xp + " / " + L.to + " XP · next: " + esc(LEVELS[L.n].name)) + "</div></div></div>" +
			'<div class="mnq-tabs" role="tablist">' + tabs.map((t) => '<button type="button" role="tab" class="mnq-tab' + (t[0] === currentTab ? " is-active" : "") + '" aria-selected="' + (t[0] === currentTab) + '" data-mnq-tab="' + t[0] + '">' + t[1] + "</button>").join("") + "</div>" +
			'<div class="mnq-body">' + body + "</div>" +
			'<div class="mnq-foot">Progress is saved only in this browser.</div>';
	}

	function renderOverview(L) {
		const stats = [
			["lessons", "lessons visited"], ["finished", "read to the end"], ["mastered", "lessons mastered"], ["demosPlayed", "demos played"],
			["challenges", "challenges done"], ["quizCorrect", "quiz answers right"], ["optionals", "deep dives opened"], ["days", "learning days"]
		];
		const ladder = LEVELS.map((lv, i) => '<span class="mnq-lvl' + (i + 1 <= L.n ? " is-reached" : "") + (i + 1 === L.n ? " is-now" : "") + '" title="Level ' + (i + 1) + ": " + esc(lv.name) + " (" + lv.xp + ' XP)">' + lv.icon + "</span>").join('<i class="mnq-lvl-gap"></i>');
		// last 12 weeks activity
		const cells = [];
		const d = new Date();
		d.setDate(d.getDate() - 83);
		for (let i = 0; i < 84; i++) {
			const k = dayKey(d);
			cells.push('<i class="' + (state.days[k] ? "is-on" : "") + '" title="' + k + '"></i>');
			d.setDate(d.getDate() + 1);
		}
		// closest unfinished achievements
		const next = Object.keys(ACHIEVEMENTS)
			.filter((id) => !state.unlocked[id] && ACHIEVEMENTS[id].counter && !ACHIEVEMENTS[id].hidden)
			.map((id) => { const a = ACHIEVEMENTS[id]; return { id: id, a: a, p: Math.min(1, counterValue(a.counter) / goalOf(a)) }; })
			.sort((x, y) => y.p - x.p).slice(0, 3);
		const hid = Object.keys(ACHIEVEMENTS).filter((id) => ACHIEVEMENTS[id].cat === "hidden");
		const hidGot = hid.filter((id) => state.unlocked[id]).length;
		return '<div class="mnq-ladder">' + ladder + "</div>" +
			'<div class="mnq-stats">' + stats.map((s) => "<div><b>" + counterValue(s[0]) + "</b><span>" + s[1] + "</span></div>").join("") + "</div>" +
			'<button type="button" class="mnq-hidden-chip" data-mnq-tab="achievements">🗝️ <b>' + hidGot + " of " + hid.length + "</b> hidden achievements found →</button>" +
			(next.length ? '<div class="mnq-sect">Almost there</div><div class="mnq-achs">' + next.map((n) => achCard(n.id)).join("") + "</div>" : "") +
			'<div class="mnq-sect">Your last 12 weeks</div><div class="mnq-heat">' + cells.join("") + "</div>" +
			'<div class="mnq-sect">How to earn XP</div><ul class="mnq-how">' +
			"<li><b>+10</b> first visit of a lesson · <b>+10</b> per lesson quest · <b>+30</b> for mastering a lesson</li>" +
			"<li><b>+15</b> per correct quiz answer · <b>+20–50</b> per lab challenge</li>" +
			"<li><b>+3</b> per deep dive opened · <b>+2</b> per demo watched · <b>+5</b> per demo you play with</li></ul>";
	}

	function achCard(id) {
		const a = ACHIEVEMENTS[id], gotIt = !!state.unlocked[id];
		const secret = a.hidden && !gotIt;
		let prog = "";
		if (!gotIt && a.counter) {
			const g = goalOf(a), v = Math.min(g, counterValue(a.counter));
			prog = '<span class="mnq-ach-prog"><i style="width:' + (v / g * 100).toFixed(0) + '%"></i></span><span class="mnq-ach-num">' + v + " / " + g + "</span>";
		}
		const when = gotIt ? '<span class="mnq-ach-num">unlocked ' + new Date(state.unlocked[id]).toLocaleDateString() + "</span>" : "";
		return '<div class="mnq-ach' + (gotIt ? " is-got" : "") + '"><span class="mnq-ach-icon">' + (gotIt ? a.icon : secret ? "❔" : "🔒") + '</span><span class="mnq-ach-body"><b>' +
			(secret ? "Secret achievement" : esc(a.name)) + "</b><span>" + (secret ? esc(a.hint || "Keep exploring…") : esc(a.desc)) + "</span>" + prog + when + "</span></div>";
	}

	function renderAchievements() {
		return CATEGORIES.map(([key, label]) => {
			const ids = Object.keys(ACHIEVEMENTS).filter((id) => ACHIEVEMENTS[id].cat === key);
			if (!ids.length) return "";
			const n = ids.filter((id) => state.unlocked[id]).length;
			if (key === "hidden") {
				ids.sort((a, b) => (state.unlocked[b] ? 1 : 0) - (state.unlocked[a] ? 1 : 0));
				return '<div class="mnq-sect mnq-sect--hidden">🗝️ ' + label + ' <span class="mnq-sect-n">' + n + " of " + ids.length + " found</span></div>" +
					'<div class="mnq-hidden-bar" title="' + n + " of " + ids.length + ' found"><i style="width:' + (n / ids.length * 100).toFixed(0) + '%"></i></div>' +
					'<p class="mnq-intro">These are not listed anywhere else. Some need a trick, some a special date, some plain luck.</p>' +
					'<div class="mnq-achs">' + ids.map(achCard).join("") + "</div>";
			}
			return '<div class="mnq-sect">' + label + ' <span class="mnq-sect-n">' + n + " / " + ids.length + '</span></div><div class="mnq-achs">' + ids.map(achCard).join("") + "</div>";
		}).join("");
	}

	function lessonTitle(slug) {
		const m = navModules().find((x) => x.slug === slug);
		return m ? m.title : slug;
	}

	function renderChallenges() {
		const cat = window.MNChallengeCatalog;
		if (!cat) return "";
		return '<p class="mnq-intro">Every lab in the course hides a few goals. Open the lesson, play with the demo, and the checkmarks appear by themselves.</p><div class="mnq-labs">' +
			cat.labs().map((lab) => {
				const items = lab.items, d = items.filter((c) => state.keys["challenge-" + c.id]).length;
				const xpSum = items.reduce((s, c) => s + c.xp, 0);
				return '<div class="mnq-labcard' + (d === items.length ? " is-complete" : "") + '"><div class="mnq-labhead"><span class="mnq-labicon">' + lab.icon + '</span><div><b>' + esc(lab.title) + '</b><a href="' + esc(lab.lesson) + '">' + esc(lessonTitle(lab.lesson)) + ' →</a></div><span class="mnq-labnum">' + d + " / " + items.length + "<small>" + xpSum + " XP</small></span></div>" +
					'<span class="mnq-qbar"><i style="width:' + (d / items.length * 100).toFixed(0) + '%"></i></span><ul>' +
					items.map((c) => { const ok = !!state.keys["challenge-" + c.id]; return '<li class="' + (ok ? "is-done" : "") + '"><span>' + (ok ? "✓" : "○") + '</span><span class="mnq-ch-t">' + c.text + '</span><em>+' + c.xp + "</em></li>"; }).join("") +
					"</ul></div>";
			}).join("") + "</div>";
	}

	function renderLessons() {
		const mods = navModules();
		const parts = {};
		mods.forEach((m) => { (parts[m.part] = parts[m.part] || []).push(m); });
		return '<p class="mnq-intro">👁 visited · 📖 read to the end · 🏆 all lesson quests done. Lesson quests are at the bottom of every lesson.</p>' +
			Object.keys(parts).sort((a, b) => a - b).map((p) => {
				const list = parts[p], v = list.filter((m) => state.lessons[m.slug]).length;
				return '<div class="mnq-sect">Part ' + esc(p) + ' <span class="mnq-sect-n">' + v + " / " + list.length + ' visited</span></div><div class="mnq-lessons">' +
					list.map((m) => {
						const s = m.slug;
						const badge = (state.lessons[s] ? "👁" : "·") + (state.finished[s] ? " 📖" : "") + (state.mastered[s] ? " 🏆" : "");
						return '<a class="mnq-lesson' + (state.lessons[s] ? " is-seen" : "") + (state.mastered[s] ? " is-mastered" : "") + '" href="' + esc(m.url || s) + '"><span class="mnq-lesson-ic">' + (m.icon || "•") + '</span><span class="mnq-lesson-t">' + esc(m.title) + '</span><span class="mnq-lesson-b">' + badge + "</span></a>";
					}).join("") + "</div>";
			}).join("");
	}

	// ── Console helpers ─────────────────────────────────────────────
	const CHALLENGE_ACH = ["lab-rat", "mad-scientist", "grand-experimenter", "architect"];

	function resetChallenges(filter, withXp) {
		const ids = Object.keys(state.keys)
			.filter((k) => k.indexOf("challenge-") === 0)
			.map((k) => k.slice("challenge-".length))
			.filter((id) => !filter || id === filter || id.indexOf(filter) === 0);
		let xpBack = 0;
		ids.forEach((id) => {
			const key = "challenge-" + id;
			delete state.keys[key];
			if (state.earned[key]) { if (withXp) xpBack += state.earned[key]; delete state.earned[key]; }
		});
		state.counters.challenges = Math.max(0, (state.counters.challenges || 0) - ids.length);
		if (withXp) state.xp = Math.max(0, state.xp - xpBack);
		CHALLENGE_ACH.forEach((a) => {
			const ach = ACHIEVEMENTS[a];
			if (state.unlocked[a] && (!ach.counter || counterValue(ach.counter) < goalOf(ach))) delete state.unlocked[a];
		});
		state.rev = Date.now();
		writeNow(true);
		save();
		renderHud(false);
		renderPanel();
		window.dispatchEvent(new CustomEvent("mnquest:reset", { detail: { ids: ids } }));
		console.info("[MNQuest] reset " + ids.length + " challenge(s)" + (withXp ? ", −" + xpBack + " XP" : "") + (ids.length ? ": " + ids.join(", ") : ""));
		return ids;
	}

	function resetAll() {
		state = blank();
		state.rev = Date.now();
		writeNow(true);
		save();
		renderHud(false);
		renderPanel();
		window.dispatchEvent(new CustomEvent("mnquest:reset", { detail: { ids: "all" } }));
		console.info("[MNQuest] all progress has been reset.");
	}

	const api = {
		xp: xp,
		count: count,
		unlock: function (id) { return unlock(id, false); },
		done: function (key) { return !!state.keys[key]; },
		mark: function (key) { state.keys[key] = 1; save(); },
		level: function () { return levelOf(state.xp); },
		summary: function () { return { xp: state.xp, level: levelOf(state.xp), unlocked: Object.keys(state.unlocked), streak: streak() }; },
		open: openPanel,
		close: closePanel,
		quest: function (id, label, group) {
			if (state.quests[id] && state.quests[id].label === label) return;
			state.quests[id] = { label: label, group: group };
			save();
		},
		best: function (key, value, lowerIsBetter) {
			const prev = state.bests[key];
			const better = prev === undefined || (lowerIsBetter ? value < prev : value > prev);
			if (better) { state.bests[key] = value; save(); }
			return { best: better ? value : prev, previous: prev, isNew: better };
		},
		getBest: function (key) { return state.bests[key]; },
		resetChallenges: resetChallenges,
		listChallenges: function () {
			const cat = window.MNChallengeCatalog;
			const rows = cat ? cat.labs().reduce((acc, lab) => acc.concat(lab.items.map((c) => ({ id: c.id, lab: lab.title, lesson: lab.lesson, xp: c.xp, done: !!state.keys["challenge-" + c.id] }))), []) : [];
			if (console.table) console.table(rows);
			return rows;
		},
		resetAll: resetAll,
		achievements: ACHIEVEMENTS
	};
	window.MNQuest = api;
	window.resetChallenges = resetChallenges;
	try {
		Object.defineProperty(window, "mnResetProgress", {
			configurable: true,
			enumerable: false,
			get: function () { return "Assign true to reset all progress: mnResetProgress = true"; },
			set: function (v) { if (v) resetAll(); }
		});
	} catch (e) { /* ignore */ }

	// ── Passive tracking ────────────────────────────────────────────
	// The URL slug is authoritative; data-lesson-id is a fallback (some
	// lessons spell it with hyphens, e.g. "math-iv" for math_iv.php).
	function lessonSlug() {
		const known = navModules().map((m) => m.slug);
		const m = location.pathname.match(/([a-z0-9_-]+)(?:\.php)?\/?$/i);
		const first = document.querySelector("[data-lesson-id]");
		const id = first ? first.getAttribute("data-lesson-id") : null;
		const cands = [m && m[1], id, id && id.replace(/-/g, "_")].filter(Boolean);
		return cands.find((c) => known.indexOf(c) >= 0) || cands[0] || null;
	}

	// Computed in start(): the lesson id and the course index live in <body>.
	let SLUG = null;
	let IS_LESSON = false;
	const NON_LESSONS = /^(index|index_full|graph|atlas|knowledge_map|literature|search|asanai_blog_proxy|headings|image)$/;
	const T0 = Date.now();

	function onceLessonKey(task) { return "lq-" + SLUG + "-" + task; }

	// Lesson quests: small goals at the bottom of every lesson.
	const LESSON_TASKS = [
		{ id: "read", icon: "📖", label: "Read to the end", hint: "scroll down to here", test: () => true },
		{ id: "deep", icon: "🔍", label: "Open a deep dive", hint: "the collapsible boxes", test: () => !!document.querySelector("#contents div.optional") },
		{ id: "demo", icon: "🕹️", label: "Play with a demo", hint: "drag, click or slide", test: () => demoRoots().length > 0 },
		{ id: "source", icon: "📚", label: "Check a source", hint: "click a citation", test: () => !!document.querySelector('#contents a[id^="cite-"], #contents .citation, #sources a') },
		{ id: "quiz", icon: "✅", label: "Finish the quiz", hint: "“Check yourself” card", test: () => !!document.querySelector("#contents .mn-quiz") },
		{ id: "challenge", icon: "🏆", label: "Solve a lab challenge", hint: "goals inside the lab", test: () => !!document.querySelector("#contents .mnc") }
	];

	function completeTask(task) {
		if (!IS_LESSON) return;
		const key = onceLessonKey(task);
		if (state.keys[key]) return;
		const t = LESSON_TASKS.find((x) => x.id === task);
		if (!t || !t.test()) return;
		if (task === "read") state.finished[SLUG] = Date.now();
		xp(10, "· " + t.label.toLowerCase(), key);
		renderLessonCard();
		checkMastered();
	}

	function checkMastered() {
		if (!IS_LESSON || state.mastered[SLUG]) return;
		const avail = LESSON_TASKS.filter((t) => t.test());
		if (avail.length && avail.every((t) => state.keys[onceLessonKey(t.id)])) {
			state.mastered[SLUG] = Date.now();
			xp(30, "· lesson mastered!", "lq-" + SLUG + "-mastered");
			renderLessonCard();
		}
	}

	function renderLessonCard() {
		if (!IS_LESSON) return;
		const contents = document.getElementById("contents");
		if (!contents) return;
		let card = document.getElementById("mnq-lesson");
		const avail = LESSON_TASKS.filter((t) => t.test());
		if (!avail.length) return;
		if (!card) {
			card = node("div", "mnq-lessoncard");
			card.id = "mnq-lesson";
			card.setAttribute("data-interactive", "");
			const anchor = document.getElementById("topic-learned-btn") || document.getElementById("course-status-box") || document.getElementById("sources-section");
			if (anchor && anchor.parentNode === contents) contents.insertBefore(card, anchor);
			else contents.appendChild(card);
			observeCard(card);
		}
		const done = avail.filter((t) => state.keys[onceLessonKey(t.id)]).length;
		const mastered = !!state.mastered[SLUG];
		card.classList.toggle("is-mastered", mastered);
		const open = card.classList.contains("is-open");
		card.innerHTML =
			'<button type="button" class="mnq-lesson-toggle" aria-expanded="' + open + '">' +
			'<span class="mnq-lesson-ic" aria-hidden="true">' + (mastered ? "🏆" : "🎯") + "</span>" +
			'<span class="mnq-lesson-head-main"><span class="mnq-kicker">Lesson quests</span><span class="mnq-lesson-title">' + (mastered ? "Lesson mastered" : "Make this lesson yours") + "</span></span>" +
			'<span class="mnq-lesson-mini">' + (mastered ? "✓" : done + "/" + avail.length) + "</span>" +
			'<svg class="mnq-lesson-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>' +
			"</button>" +
			'<div class="mnq-lesson-body">' +
			'<ul class="mnq-lesson-tasks">' + avail.map((t) => {
				const ok = !!state.keys[onceLessonKey(t.id)];
				return '<li class="' + (ok ? "is-done" : "") + '"><span class="mnq-lt-ic">' + (ok ? "✓" : t.icon) + '</span><span class="mnq-lt-txt"><b>' + t.label + "</b><small>" + t.hint + '</small></span><em>+10</em></li>';
			}).join("") + "</ul>" +
			'<div class="mnq-lesson-foot">' + (mastered ? "All done — +30 XP bonus collected." : "Complete all of them for a <b>+30 XP</b> mastery bonus.") + "</div>" +
			'<button type="button" class="mnq-lesson-open">View all progress →</button>' +
			"</div>";
		card.querySelector(".mnq-lesson-toggle").addEventListener("click", () => {
			const isOpen = card.classList.toggle("is-open");
			card.querySelector(".mnq-lesson-toggle").setAttribute("aria-expanded", isOpen ? "true" : "false");
		});
		card.querySelector(".mnq-lesson-open").addEventListener("click", () => openPanel("lessons"));
	}

	function observeCard(card) {
		const tryRead = () => {
			if (Date.now() - T0 >= 40000) { completeTask("read"); return true; }
			return false;
		};
		if (!window.IntersectionObserver) return;
		let pending = 0;
		new IntersectionObserver((es) => {
			es.forEach((e) => {
				if (!e.isIntersecting) { clearTimeout(pending); return; }
				if (!tryRead()) {
					clearTimeout(pending);
					pending = setTimeout(() => { if (card.getBoundingClientRect().top < window.innerHeight) tryRead(); }, 40000 - (Date.now() - T0) + 50);
				}
			});
		}, { threshold: 0.4 }).observe(card);
	}

	// Demo detection: blocks between the prose that contain something to
	// play with (labs, plots, canvases, sliders).
	const DEMO_SEL = ".mnlab, [data-interactive], .lab-container, .lab-dashboard, .js-plotly-plot, .plot-container, canvas, input[type=range], select";
	let demoCache = null;

	function demoRoots() {
		if (demoCache) return demoCache;
		const contents = document.getElementById("contents");
		if (!contents) return [];
		const out = [];
		Array.prototype.forEach.call(contents.children, (el) => {
			if (!el || el.id === "mnq-lesson" || el.id === "toc" || el.id === "topic-learned-btn" || el.id === "course-status-box" || el.id === "sources-section") return;
			if (el.classList.contains("mn-quiz") || el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
			if (el.matches(DEMO_SEL) || el.querySelector(DEMO_SEL)) {
				const cv = el.matches("canvas") ? el : null;
				if (cv && cv.width < 120) return;
				out.push(el);
			}
		});
		demoCache = out;
		return out;
	}

	function demoKey(el) {
		const roots = demoRoots();
		return SLUG + "#" + (el.id || el.querySelector("[id]") && el.querySelector("[id]").id || roots.indexOf(el));
	}

	const tracked = new WeakSet();
	let demoIO = null;
	const demoTimers = new Map();

	function trackDemos() {
		demoCache = null;
		const roots = demoRoots().filter((el) => !tracked.has(el));
		if (!roots.length || !window.IntersectionObserver) return;
		const timers = demoTimers;
		const io = demoIO || (demoIO = new IntersectionObserver((es) => {
			es.forEach((e) => {
				const el = e.target;
				if (e.isIntersecting) {
					timers.set(el, setTimeout(() => {
						const k = demoKey(el);
						if (state.demosSeen[k]) return;
						state.demosSeen[k] = Date.now();
						xp(2, "· demo watched");
						io.unobserve(el);
					}, 1800));
				} else {
					clearTimeout(timers.get(el));
				}
			});
		}, { threshold: 0.35 }));
		roots.forEach((el) => {
			tracked.add(el);
			io.observe(el);
			const play = (ev) => {
				if (ev.target.closest && ev.target.closest(".mnc, #mnq-lesson")) return;
				const k = demoKey(el);
				if (!state.demosPlayed[k]) {
					state.demosPlayed[k] = Date.now();
					xp(5, "· you played with a demo");
				}
				completeTask("demo");
			};
			el.addEventListener("pointerdown", play, { passive: true });
			el.addEventListener("input", play, { passive: true });
			el.addEventListener("change", play, { passive: true });
		});
	}

	function onOptionalClick(e) {
		const box = e.target.closest && e.target.closest("div.optional");
		if (!box || !SLUG) return;
		const all = document.querySelectorAll("div.optional");
		const idx = Array.prototype.indexOf.call(all, box);
		const key = "opt-" + SLUG + "-" + idx;
		if (!state.keys[key]) {
			state.keys[key] = 1;
			state.counters.optionals = (state.counters.optionals || 0) + 1;
			xp(3, "· deep dive opened");
		}
		completeTask("deep");
		if (all.length >= 2 && Array.prototype.every.call(all, (b, i) => state.keys["opt-" + SLUG + "-" + i])) unlock("curiosity-cat", false);
	}

	function onSourceClick(e) {
		const a = e.target.closest && e.target.closest('a[id^="cite-"], .citation, #sources a, a[href^="#bib-"]');
		if (!a) return;
		const k = "src-" + SLUG + "-" + (a.id || a.getAttribute("href") || a.textContent).slice(0, 80);
		if (!state.keys[k]) {
			state.keys[k] = 1;
			count("sources");
		}
		completeTask("source");
	}

	const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
	let konamiPos = 0;

	function onKey(e) {
		const k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
		konamiPos = k === KONAMI[konamiPos] ? konamiPos + 1 : (k === KONAMI[0] ? 1 : 0);
		if (konamiPos === KONAMI.length) { konamiPos = 0; unlock("konami", false); }
		if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) unlock("seeker", false);
	}

	function wireChrome() {
		const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
		bind("search-trigger", () => unlock("seeker", false));
		let flips = 0;
		bind("theme-toggle", () => {
			unlock("light-and-shadow", false);
			if (++flips >= 8) unlock("disco", false);
		});
		bind("reader-toggle", () => unlock("focus-mode", false));
		document.addEventListener("click", (e) => {
			const a = e.target.closest && e.target.closest('a[href*="knowledge_map"], a[href*="graph"]');
			if (a && unlock("big-picture", true)) save();
		}, true);
		document.addEventListener("click", (e) => {
			const b = e.target.closest && e.target.closest("#topic-learned-btn");
			if (!b || !SLUG || state.learned[SLUG]) return;
			state.learned[SLUG] = Date.now();
			xp(5, "· marked as learned");
		});
	}

	function checkClock(silent) {
		const now = new Date(), h = now.getHours(), m = now.getMinutes(), mon = now.getMonth() + 1, day = now.getDate();
		const hit = (id) => { if (unlock(id, true) && !silent) { save(); renderHud(false); } };
		if (h >= 0 && h < 4) hit("night-owl");
		if (h >= 5 && h < 7) hit("early-bird");
		if ((h % 12 === 3 && m === 14) || (mon === 3 && day === 14)) hit("pi-time");
		if (now.getDay() === 5 && day === 13) hit("friday-13");
		if (mon === 6 && day === 23) hit("turing-day");
	}

	function wireSecrets() {
		let bottomAt = 0;
		window.addEventListener("scroll", () => {
			const doc = document.documentElement;
			if (doc.scrollHeight < window.innerHeight * 4) return;
			if (window.scrollY + window.innerHeight >= doc.scrollHeight - 8) bottomAt = Date.now();
			else if (window.scrollY < 8 && bottomAt && Date.now() - bottomAt < 3000) { bottomAt = 0; unlock("speedrun", false); }
		}, { passive: true });

		let idleSince = Date.now(), idleValid = !document.hidden;
		const stir = () => {
			if (idleValid && Date.now() - idleSince >= 300000) unlock("lost-in-thought", false);
			idleSince = Date.now();
			idleValid = !document.hidden;
		};
		["pointerdown", "keydown", "wheel", "touchstart", "scroll"].forEach((ev) => window.addEventListener(ev, stir, { passive: true, capture: true }));
		document.addEventListener("visibilitychange", () => { if (document.hidden) idleValid = false; });

		document.addEventListener("click", (e) => {
			if (e.target.closest && e.target.closest(".code-copy-btn")) unlock("copy-paste", false);
		}, true);
		document.addEventListener("copy", () => {
			const sel = window.getSelection && window.getSelection();
			const n = sel && sel.anchorNode;
			const el = n && (n.nodeType === 1 ? n : n.parentElement);
			if (el && el.closest("pre, code") && String(sel).trim().length > 10) unlock("copy-paste", false);
		});

		setInterval(() => { if (!document.hidden) checkClock(false); }, 30000);
	}

	function checkParts() {
		const mods = navModules();
		if (!mods.length || state.unlocked["part-explorer"]) return;
		const parts = {};
		mods.forEach((m) => { (parts[m.part] = parts[m.part] || []).push(m.slug); });
		if (Object.keys(parts).some((p) => parts[p].length >= 2 && parts[p].every((s) => state.lessons[s]))) unlock("part-explorer", true);
	}

	function start() {
		SLUG = lessonSlug();
		IS_LESSON = !!(SLUG && !NON_LESSONS.test(SLUG) && navModules().some((m) => m.slug === SLUG));
		buildUI();
		const d = dayKey(new Date());
		if (!state.days[d]) {
			state.days[d] = 1;
			if (Object.keys(state.days).length > 1) xp(5, "· new learning day", "day-" + d);
		}
		if (streak() >= 3) unlock("streak-fire", true);
		checkClock(true);
		if (Math.random() < 0.01) unlock("four-leaf", true);
		if (SLUG === "atlas") unlock("globetrotter", true);
		if (SLUG === "knowledge_map" || SLUG === "graph") unlock("big-picture", true);

		if (IS_LESSON && !state.lessons[SLUG]) {
			state.lessons[SLUG] = Date.now();
			xp(10, "· new lesson: " + lessonTitle(SLUG));
		}
		checkParts();

		document.addEventListener("click", onOptionalClick, true);
		document.addEventListener("click", onSourceClick, true);
		document.addEventListener("keydown", onKey);
		wireChrome();
		wireSecrets();

		window.addEventListener("mnquiz:finish", () => completeTask("quiz"));
		window.addEventListener("mnchallenge:done", (e) => {
			if (e.detail && e.detail.root && document.getElementById("contents") && document.getElementById("contents").contains(e.detail.root)) completeTask("challenge");
		});

		const late = () => {
			trackDemos();
			renderLessonCard();
			if (IS_LESSON && document.querySelector("#contents .mnc-item.is-done")) completeTask("challenge");
		};
		if (document.documentElement.classList.contains("is-ready")) setTimeout(late, 600);
		window.addEventListener("blogPostLoadComplete", () => setTimeout(late, 600));
		window.addEventListener("load", () => setTimeout(late, 2500));

		checkCounters();
		save();
		renderHud(false);
	}

	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
	else start();
})();
