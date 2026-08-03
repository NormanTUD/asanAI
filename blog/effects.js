/* ════════════════════════════════════════════════════════════
   EFFECTS — Gorgeous but quiet enhancements
   • Floating glass mini-header on scroll
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
	   Floating glass mini-header
	   Shows the current module/page title once you scroll past
	   the hero (or first content heading on module pages).
	   ───────────────────────────────────────────────────────── */
	function initFloatingHeader() {
		const fh = document.getElementById('floating-header');
		if (!fh) return;

		const titleEl = fh.querySelector('.fh-title');
		const labelEl = fh.querySelector('.fh-label');

		let title = '';
		let label = '';

		if (window.__moduleNavData &&
			typeof window.__moduleNavData.current === 'number' &&
			window.__moduleNavData.current >= 0) {
			const i = window.__moduleNavData.current;
			const m = window.__moduleNavData.modules && window.__moduleNavData.modules[i];
			if (m && m.title) {
				title = m.title;
				label = m.part ? 'Part ' + m.part : 'Module';
			}
		}

		if (!title) {
			const heroH1 = document.querySelector('.course-hero h1');
			const contentH1 = document.querySelector('#contents > h1');
			const h1 = heroH1 || contentH1;
			if (h1) {
				title = (h1.textContent || '').trim();
				label = heroH1 ? 'Course' : 'Module';
			}
		}

		if (titleEl) titleEl.textContent = title || (document.title || '').trim();
		if (labelEl) labelEl.textContent = label;

		if (!title) {
			fh.style.display = 'none';
			return;
		}

		let visible = false;
		let heroBottom = -1;

		function measure() {
			const hero = document.querySelector('.course-hero');
			if (hero) {
				const rect = hero.getBoundingClientRect();
				heroBottom = rect.bottom + window.scrollY;
			} else {
				const firstH1 = document.querySelector('#contents > h1');
				if (firstH1) {
					heroBottom = firstH1.getBoundingClientRect().bottom + window.scrollY - 60;
				} else {
					heroBottom = 240;
				}
			}
		}

		const check = rafThrottle(() => {
			const shouldShow = window.scrollY > heroBottom - 60;
			if (shouldShow !== visible) {
				visible = shouldShow;
				fh.classList.toggle('is-visible', visible);
			}
		});

		measure();
		window.addEventListener('scroll', check, { passive: true });
		window.addEventListener('resize', () => { measure(); check(); }, { passive: true });
		check();
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
		initFloatingHeader();
		initScrollReveal();
		initHeroScrollFade();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
