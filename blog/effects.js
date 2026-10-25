/* ════════════════════════════════════════════════════════════
   EFFECTS — Gorgeous but quiet enhancements
   • Course parts are marked visible immediately
   The hero network's own scroll-fade is handled inside
   organic-network.js (is-scrolled-past class + draw gating).
   Activated by adding `effects-on` to <html>. No-JS users see
   the default visible state — graceful fallback.
   ════════════════════════════════════════════════════════════ */
(function () {
	'use strict';

	const html = document.documentElement;
	html.classList.add('effects-on');

	/* ─────────────────────────────────────────────────────────
	   Course parts
	   Every part starts visible. The reveal classes are kept so
	   the stylesheet has an explicit "shown" state, but nothing
	   is hidden behind an IntersectionObserver: scrolling must
	   never be what makes a section or its tiles appear.
	   ───────────────────────────────────────────────────────── */
	function initCourseParts() {
		const parts = document.querySelectorAll('.course-part');
		if (!parts.length) return;

		parts.forEach(p => {
			p.classList.add('reveal-target');
			p.classList.add('is-revealed');
		});
	}

	function init() {
		initCourseParts();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
