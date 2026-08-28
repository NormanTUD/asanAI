/* ════════════════════════════════════════════════════════════
   EFFECTS — Gorgeous but quiet enhancements
   • Scroll-reveal cascade for course parts
   The hero network's own scroll-fade is handled inside
   organic-network.js so it can pause its RAF loop too.
   Activated by adding `effects-on` to <html>. No-JS users see
   the default visible state — graceful fallback.
   ════════════════════════════════════════════════════════════ */
(function () {
	'use strict';

	const html = document.documentElement;
	html.classList.add('effects-on');

	const reduceMotion = window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* ─────────────────────────────────────────────────────────
	   Scroll-reveal for course parts
	   Each .course-part fades in with a cascading tile reveal
	   when it enters the viewport. Falls back gracefully if
	   IntersectionObserver is unavailable.
	   ───────────────────────────────────────────────────────── */
	function initScrollReveal() {
		const parts = document.querySelectorAll('.course-part');
		if (!parts.length) return;

		parts.forEach(p => p.classList.add('reveal-target'));

		if (!('IntersectionObserver' in window) || reduceMotion) {
			parts.forEach(p => p.classList.add('is-revealed'));
			return;
		}

		const io = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-revealed');
					io.unobserve(entry.target);
				}
			});
		}, {
			threshold: 0.12,
			rootMargin: '0px 0px -6% 0px'
		});

		parts.forEach(p => io.observe(p));
	}

	function init() {
		initScrollReveal();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
