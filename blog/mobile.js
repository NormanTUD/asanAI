/* ════════════════════════════════════════════════════════════════════
   MOBILE / RESPONSIVE JS POLISH
   --------------------------------------------------------------------
   Loaded AFTER start.js. Provides runtime helpers that only make sense
   on phones (or any device without a real hover).

   Features:
     1. CSS fallback — if mobile.css wasn't injected via <link> (i.e.
        we're on a page that went through functions.php's auto-render
        path), we inject it now so the styles still apply.
     2. Glossary tap-toggle — on touch devices, tap a `.glossary-term`
        to show its tooltip; tap again or anywhere else to dismiss.
     3. Drawer swipe-to-close — drag from the right edge of the
        drawer (or swipe left anywhere on it) to close.
     4. iOS viewport-height fix — keep --vh in sync so any 100vh
        fallback works correctly when the address bar collapses.
     5. Input zoom lock — iOS zooms the page on focus if font-size
        < 16px. We've set 16px in CSS, but this is a belt-and-braces.
     6. Orientation / resize helper — re-runs Plotly resize and fires
        a custom event so other modules can hook in.

   All features are defensive: each one no-ops if its target element
   doesn't exist or if the browser doesn't support the relevant API.
   ════════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	var MOBILE_CSS_HREF = 'mobile.css';
	var MOBILE_MAX_WIDTH = 900; // match CSS breakpoint

	/* ─────────────────────────────────────────────────────────────
	   1. CSS FALLBACK
	   ----------------------------------------------------------------
	   If mobile.css isn't already on the page, inject it now.
	   This catches module pages that go through functions.php's
	   auto-render path (where we couldn't add a <link> tag).
	   ───────────────────────────────────────────────────────────── */
	function ensureMobileCSS() {
		var links = document.querySelectorAll('link[rel="stylesheet"]');
		for (var i = 0; i < links.length; i++) {
			var href = links[i].getAttribute('href') || '';
			if (href.indexOf('mobile.css') !== -1) return; // already loaded
		}
		var l = document.createElement('link');
		l.rel = 'stylesheet';
		l.href = MOBILE_CSS_HREF;
		l.type = 'text/css';
		l.media = 'all';
		document.head.appendChild(l);
	}

	/* ─────────────────────────────────────────────────────────────
	   2. GLOSSARY TAP-TOGGLE  (touch devices only)
	   ───────────────────────────────────────────────────────────── */
	function isTouch() {
		return (
			window.matchMedia &&
			window.matchMedia('(hover: none)').matches
		) || ('ontouchstart' in window);
	}

	function initGlossaryTapToggle() {
		if (!isTouch()) return;

		var contents = document.getElementById('contents');
		if (!contents) return;

		// Track which term is currently open (only one at a time).
		var openTerm = null;

		function closeAll() {
			if (!openTerm) return;
			openTerm.classList.remove('is-tap-open');
			var tip = openTerm.querySelector('.glossary-tooltip');
			if (tip) tip.style.visibility = '';
			openTerm = null;
		}

		contents.addEventListener('click', function (ev) {
			var term = ev.target.closest && ev.target.closest('.glossary-term');
			if (term) {
				ev.preventDefault();
				ev.stopPropagation();
				if (openTerm === term) {
					closeAll();
					return;
				}
				closeAll();
				term.classList.add('is-tap-open');
				var tip = term.querySelector('.glossary-tooltip');
				if (tip) {
					// Position above the term, but clamp to viewport.
					var rect = term.getBoundingClientRect();
					var tipRect = tip.getBoundingClientRect();
					var vw = window.innerWidth;
					var margin = 8;
					var tipW = Math.min(tipRect.width || 220, vw - 2 * margin);
					tip.style.width = tipW + 'px';
					tip.style.maxWidth = (vw - 2 * margin) + 'px';

					// Re-measure after width change.
					tipRect = tip.getBoundingClientRect();

					var left = rect.left + rect.width / 2 - tipW / 2;
					var top = rect.top - tipRect.height - 8;
					if (top < margin) top = rect.bottom + 8;
					if (left < margin) left = margin;
					if (left + tipW > vw - margin) left = vw - tipW - margin;

					tip.style.left = left + 'px';
					tip.style.top = top + 'px';
					tip.style.visibility = 'visible';
				}
				openTerm = term;
				return;
			}
			// Click elsewhere → close any open term.
			closeAll();
		});

		// Tap-highlight color (Safari iOS) — set inline so it works
		// without depending on the CSS being already parsed.
		document.addEventListener('touchstart', function () {}, { passive: true });
	}

	/* ─────────────────────────────────────────────────────────────
	   3. DRAWER SWIPE-TO-CLOSE
	   ───────────────────────────────────────────────────────────── */
	function initDrawerSwipe() {
		var panel = document.getElementById('drawer-panel');
		if (!panel || !isTouch()) return;

		var startX = 0;
		var startY = 0;
		var tracking = false;
		var THRESHOLD = 60;     // px to drag before commit
		var MAX_VERT = 80;      // ignore if scroll-direction is vertical

		panel.addEventListener('touchstart', function (e) {
			if (!panel.classList.contains('open')) return;
			var t = e.touches[0];
			startX = t.clientX;
			startY = t.clientY;
			tracking = true;
			panel.style.transition = 'none';
		}, { passive: true });

		panel.addEventListener('touchmove', function (e) {
			if (!tracking) return;
			var t = e.touches[0];
			var dx = t.clientX - startX;
			var dy = Math.abs(t.clientY - startY);
			if (dy > MAX_VERT) { tracking = false; return; }
			if (dx < 0) {
				panel.style.transform = 'translateX(' + dx + 'px)';
			}
		}, { passive: true });

		panel.addEventListener('touchend', function (e) {
			if (!tracking) return;
			tracking = false;
			panel.style.transition = '';
			var t = e.changedTouches[0];
			var dx = t.clientX - startX;
			if (dx < -THRESHOLD) {
				// Close
				var closeBtn = document.getElementById('drawer-close');
				var backdrop = document.getElementById('drawer-backdrop');
				if (closeBtn) closeBtn.click();
				else {
					panel.classList.remove('open');
					if (backdrop) backdrop.classList.remove('open');
				}
			}
			panel.style.transform = '';
		}, { passive: true });
	}

	/* ─────────────────────────────────────────────────────────────
	   4. iOS VIEWPORT-HEIGHT FIX
	   ----------------------------------------------------------------
	   On iOS Safari, window.innerHeight jumps when the URL bar
	   collapses. We expose --vh as a CSS variable so any 100vh
	   fallback (e.g. for search/drawer backdrops) can use it.
	   ───────────────────────────────────────────────────────────── */
	function syncVH() {
		var vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty('--vh', vh + 'px');
	}

	/* ─────────────────────────────────────────────────────────────
	   5. INPUT ZOOM LOCK (iOS Safari)
	   ───────────────────────────────────────────────────────────── */
	function lockInputZoom() {
		// CSS already sets font-size: 16px, but double-belt with
		// meta-tag viewport scaling protection.
		var vp = document.querySelector('meta[name="viewport"]');
		if (vp && /user-scalable=no/i.test(vp.content)) {
			// ensure maximum-scale is set so iOS doesn't auto-zoom
			if (!/maximum-scale=/i.test(vp.content)) {
				vp.content = vp.content + ', maximum-scale=1';
			}
		}
	}

	/* ─────────────────────────────────────────────────────────────
	   6. ORIENTATION / RESIZE BROADCAST
	   ───────────────────────────────────────────────────────────── */
	function broadcastResize() {
		try {
			window.dispatchEvent(new Event('mobile:resize'));
		} catch (e) {
			var ev = document.createEvent('Event');
			ev.initEvent('mobile:resize', true, true);
			window.dispatchEvent(ev);
		}

		// Hook into Plotly charts: resize them on rotation.
		if (window.Plotly && Plotly.Plots && typeof Plotly.Plots.resize === 'function') {
			var plots = document.querySelectorAll('.js-plotly-plot');
			for (var i = 0; i < plots.length; i++) {
				Plotly.Plots.resize(plots[i]);
			}
		}
	}

	/* ─────────────────────────────────────────────────────────────
	   7. SAFE-AREA CSS-VAR PUSH
	   ----------------------------------------------------------------
	   Make safe-area values accessible as CSS vars (in case anything
	   else needs them besides the inline env() calls in style.css).
	   ───────────────────────────────────────────────────────────── */
	function syncSafeArea() {
		var s = getComputedStyle(document.documentElement);
		var insetLeft = s.getPropertyValue('env(safe-area-inset-left)') || '0px';
		var insetRight = s.getPropertyValue('env(safe-area-inset-right)') || '0px';
		var insetTop = s.getPropertyValue('env(safe-area-inset-top)') || '0px';
		var insetBottom = s.getPropertyValue('env(safe-area-inset-bottom)') || '0px';
		document.documentElement.style.setProperty('--mn-safe-left', insetLeft.trim());
		document.documentElement.style.setProperty('--mn-safe-right', insetRight.trim());
		document.documentElement.style.setProperty('--mn-safe-top', insetTop.trim());
		document.documentElement.style.setProperty('--mn-safe-bottom', insetBottom.trim());
	}

	/* ─────────────────────────────────────────────────────────────
	   BOOT
	   ───────────────────────────────────────────────────────────── */
	function boot() {
		ensureMobileCSS();
		initGlossaryTapToggle();
		initDrawerSwipe();
		syncVH();
		syncSafeArea();
		lockInputZoom();

		// Re-sync on resize / orientation change.
		var rafId = null;
		function onResize() {
			if (rafId) cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(function () {
				syncVH();
				syncSafeArea();
				broadcastResize();
			});
		}
		window.addEventListener('resize', onResize);
		window.addEventListener('orientationchange', onResize);
	}

	// Wait for DOM (so the chrome elements we look up exist).
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot, { once: true });
	} else {
		boot();
	}

	// Also run after window.load — covers cases where the drawer / search
	// buttons are inserted by other scripts at runtime.
	window.addEventListener('load', boot, { once: true });
})();
