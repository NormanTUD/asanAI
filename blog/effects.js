/* ════════════════════════════════════════════════════════════
   EFFECTS — Gorgeous but quiet enhancements
   • Scroll-reveal cascade for course parts
   • Hero constellation fade-out on scroll past
   Activated by adding `effects-on` to <html>. No-JS users see
   the default visible state — graceful fallback.
   ════════════════════════════════════════════════════════════ */
(function () {
	'use strict';

	const html = document.documentElement;
	html.classList.add('effects-on');

	const reduceMotion = window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function rafThrottle(fn) {
		let pending = null;
		return function () {
			if (pending !== null) return;
			pending = requestAnimationFrame(() => {
				pending = null;
				fn();
			});
		};
	}

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

	/* ─────────────────────────────────────────────────────────
	   Hero constellation scroll-fade
	   Once the user scrolls past most of the hero, fade the
	   constellation to 0. Smooth and cheap.
	   ───────────────────────────────────────────────────────── */
	function initHeroScrollFade() {
		const hero = document.querySelector('.course-hero');
		if (!hero) return;
		const constellation = hero.querySelector('.constellation');
		if (!constellation) return;

		const check = rafThrottle(() => {
			const rect = hero.getBoundingClientRect();
			if (rect.bottom < window.innerHeight * 0.35) {
				hero.classList.add('is-scrolled-past');
			} else {
				hero.classList.remove('is-scrolled-past');
			}
		});

		window.addEventListener('scroll', check, { passive: true });
		check();
	}

	function init() {
		initScrollReveal();
		initHeroScrollFade();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
