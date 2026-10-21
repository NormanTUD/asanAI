// Resume reading: remembers, per lesson, the section the reader was in
// and offers to jump back there on the next visit ("Pick up where you
// left off"). The home page shows the last unfinished lesson as a
// "Continue reading" card. Only stored in this browser (localStorage).
//
// A lesson URL with ?continue=1 jumps straight to the saved spot.

(function () {
	"use strict";

	const STORE = "mn_resume_v1";
	const MAX = 40;

	function esc(s) {
		return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
	}

	function load() {
		try {
			const d = JSON.parse(localStorage.getItem(STORE) || "null");
			if (d && d.lessons) return d;
		} catch (e) { /* private mode / broken JSON */ }
		return { lessons: {}, last: null };
	}
	function save(d) {
		try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) { /* ignore */ }
	}

	function current() {
		const nav = window.__moduleNavData;
		return nav && nav.modules && nav.current >= 0 ? nav.modules[nav.current] : null;
	}

	function headings() {
		return Array.prototype.slice.call(document.querySelectorAll("#contents .md h2[id], #contents .md h3[id]"))
			.filter((h) => !h.closest(".optional, #sources-section, #footnotes-section") && h.offsetParent !== null);
	}

	function scrollFrac() {
		const doc = document.documentElement;
		const max = Math.max(1, doc.scrollHeight - window.innerHeight);
		return Math.min(1, Math.max(0, (window.scrollY || doc.scrollTop || 0) / max));
	}

	function sectionAt() {
		const line = window.innerHeight * 0.3;
		let cur = null;
		headings().forEach((h) => { if (h.getBoundingClientRect().top < line) cur = h; });
		return cur;
	}

	function jumpTo(entry, smooth) {
		const h = entry.id && document.getElementById(entry.id);
		const behavior = smooth ? "smooth" : "auto";
		if (h) {
			const y = h.getBoundingClientRect().top + window.scrollY - 80;
			window.scrollTo({ top: Math.max(0, y), behavior: behavior });
		} else {
			const doc = document.documentElement;
			window.scrollTo({ top: entry.frac * (doc.scrollHeight - window.innerHeight), behavior: behavior });
		}
		if (window.MNQuest) window.MNQuest.unlock("comeback");
	}

	// ── Lesson pages ────────────────────────────────────────────────
	function lessonPage(mod) {
		const slug = mod.slug;
		const saved = load().lessons[slug];
		let ready = false;
		let timer = 0;

		function record() {
			if (!ready) return;
			const frac = scrollFrac();
			const d = load();
			if (frac > 0.96) {
				delete d.lessons[slug];
				if (d.last === slug) d.last = null;
				save(d);
				return;
			}
			if (frac < 0.03) return;
			const h = sectionAt();
			d.lessons[slug] = { frac: frac, id: h ? h.id : "", heading: h ? h.textContent.replace(/#\s*$/, "").trim().slice(0, 90) : "", title: mod.title, url: mod.url, icon: mod.icon || "", t: Date.now() };
			d.last = slug;
			const keys = Object.keys(d.lessons).sort((a, b) => d.lessons[b].t - d.lessons[a].t);
			keys.slice(MAX).forEach((k) => { delete d.lessons[k]; });
			save(d);
		}

		window.addEventListener("scroll", () => { clearTimeout(timer); timer = setTimeout(record, 400); }, { passive: true });
		window.addEventListener("pagehide", record);

		function offer() {
			ready = true;
			if (!saved || saved.frac < 0.06 || saved.frac > 0.94) return;
			const params = new URLSearchParams(location.search);
			if (params.get("continue")) {
				params.delete("continue");
				const q = params.toString();
				history.replaceState(null, "", location.pathname + (q ? "?" + q : "") + location.hash);
				jumpTo(saved, false);
				return;
			}
			if (location.hash || window.scrollY > 300) return;
			const bar = document.createElement("div");
			bar.className = "mnr-resume";
			bar.setAttribute("role", "dialog");
			bar.setAttribute("aria-label", "Continue reading");
			bar.innerHTML = '<span class="mnr-resume-ic" aria-hidden="true">📌</span><span class="mnr-resume-txt"><small>Pick up where you left off</small><b>' +
				esc(saved.heading || "Your last spot") + '</b><span class="mnr-resume-bar"><i style="width:' + Math.round(saved.frac * 100) + '%"></i></span></span>' +
				'<button type="button" class="mnz-btn mnr-resume-go">Continue</button><button type="button" class="mnr-resume-x" aria-label="Dismiss">×</button>';
			document.body.appendChild(bar);
			requestAnimationFrame(() => bar.classList.add("is-in"));
			const close = () => { bar.classList.remove("is-in"); setTimeout(() => bar.remove(), 400); window.removeEventListener("scroll", onScroll); };
			const onScroll = () => { if (window.scrollY > 600) close(); };
			bar.querySelector(".mnr-resume-go").addEventListener("click", () => { close(); jumpTo(saved, true); });
			bar.querySelector(".mnr-resume-x").addEventListener("click", close);
			window.addEventListener("scroll", onScroll, { passive: true });
			setTimeout(close, 15000);
		}

		let done = false;
		const go = () => { if (done) return; done = true; setTimeout(offer, 700); };
		window.addEventListener("blogPostLoadComplete", go);
		if (document.documentElement.classList.contains("is-ready")) go();
	}

	// ── Home page ───────────────────────────────────────────────────
	function homePage(host) {
		const d = load();
		const e = d.last && d.lessons[d.last];
		if (!e) return;
		const others = Object.keys(d.lessons).filter((k) => k !== d.last).sort((a, b) => d.lessons[b].t - d.lessons[a].t).slice(0, 3);
		host.hidden = false;
		host.innerHTML = '<a class="mnh-card mnh-card--resume" href="' + esc(e.url || d.last) + '?continue=1">' +
			'<span class="mnh-ic" aria-hidden="true">' + (e.icon || "📌") + '</span><span class="mnh-main"><span class="mnh-kicker">Continue reading · ' + Math.round(e.frac * 100) + ' %</span>' +
			'<span class="mnh-title">' + esc(e.title) + "</span>" + (e.heading ? '<span class="mnh-sub">§ ' + esc(e.heading) + "</span>" : "") +
			'<span class="mnr-resume-bar"><i style="width:' + Math.round(e.frac * 100) + '%"></i></span></span><span class="mnh-go" aria-hidden="true">→</span></a>' +
			(others.length ? '<div class="mnh-also">Also unfinished: ' + others.map((k) => '<a href="' + esc(d.lessons[k].url || k) + '?continue=1">' + esc(d.lessons[k].title) + " <small>" + Math.round(d.lessons[k].frac * 100) + " %</small></a>").join(" · ") + "</div>" : "");
	}

	function start() {
		const host = document.getElementById("mn-home-resume");
		if (host) { homePage(host); return; }
		const mod = current();
		if (mod) lessonPage(mod);
	}

	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
	else setTimeout(start, 0);
})();
