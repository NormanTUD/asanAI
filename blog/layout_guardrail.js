/* ════════════════════════════════════════════════════════════════
   LAYOUT GUARDRAIL — page-load width check.

   The reading column (#contents) has a hard width: 80ch in normal
   mode, 90ch in reader mode (style.css). Anything in the prose flow
   that renders WIDER than that column is a layout bug — an unclamped
   <img>, a fixed-width canvas, a wide table, an un-wrapped widget.

   On load, and again on reader-mode toggle / resize / late content
   swaps, we walk the column and flag every offending element: a red
   outline in the DOM plus a dismissible banner plus console.error.

   Margin notes (.sideimage / .sidenote / .sidenote-fallback and the
   two body-level rails) and boxes (.optional / .cl-block) are EXEMPT —
   they are allowed to use extra width by design.
   ════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	if (window.__layoutGuardrailInstalled) return;
	window.__layoutGuardrailInstalled = true;

	var TOL = 2; // px of slack for sub-pixel / border rounding
	var FLAG_CLASS = 'lg-overflow-flag';
	var EXEMPT =
		'.sideimage, .sidenote, .sidenote-fallback, ' +
		'#sideimages-rail, #sidenotes-rail, .optional, .cl-block';

	function modeName() {
		return document.documentElement.classList.contains('reader-mode')
			? 'reader' : 'normal';
	}

	function allowedWidth() {
		var c = document.getElementById('contents');
		if (!c) return 0;
		var r = c.getBoundingClientRect();
		return r.width > 0 ? r.width : 0; // 0 ⇒ hidden / not laid out yet
	}

	function selectorOf(el) {
		var s = el.tagName.toLowerCase();
		if (el.id) return s + '#' + el.id;
		var cls = (el.className && typeof el.className === 'string')
			? el.className.trim().split(/\s+/).slice(0, 2).join('.')
			: '';
		return cls ? s + '.' + cls : s;
	}

	function isExempt(el) {
		if (!el.matches) return false;
		return !!(el.matches(EXEMPT) || el.closest(EXEMPT));
	}

	function isOverlay(el) {
		var pos = getComputedStyle(el).position;
		// portaled overlays (tooltips, lightbox) are not part of the flow
		return pos === 'absolute' || pos === 'fixed' || pos === 'sticky';
	}

	function collect(allowed) {
		var c = document.getElementById('contents');
		if (!c) return [];
		var all = c.querySelectorAll('*');
		var out = [];
		for (var i = 0; i < all.length; i++) {
			var el = all[i];
			if (el.classList && el.classList.contains(FLAG_CLASS)) continue;
			// cheap path first: almost every element fits, so measure before
			// paying for closest()/getComputedStyle() on the rare offender
			var w = el.getBoundingClientRect().width;
			if (w <= allowed + TOL) continue;
			if (isExempt(el)) continue;
			if (isOverlay(el)) continue;
			out.push({ el: el, width: w, sel: selectorOf(el) });
		}
		// keep only the outermost offender in each ancestor chain
		return out.filter(function (o) {
			for (var j = 0; j < out.length; j++) {
				if (o !== out[j] && out[j].el.contains(o.el)) return false;
			}
			return true;
		});
	}

	var banner = null;
	function clearBanner() {
		if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
		banner = null;
	}

	function clearFlags() {
		var flagged = document.querySelectorAll('.' + FLAG_CLASS);
		for (var i = 0; i < flagged.length; i++) {
			flagged[i].classList.remove(FLAG_CLASS);
			flagged[i].style.outline = '';
			flagged[i].style.outlineOffset = '';
		}
	}

	function showBanner(offenders, allowed, mode) {
		clearBanner();
		var list = offenders.slice(0, 8).map(function (o) {
			return o.sel + ' → ' + Math.round(o.width) + 'px';
		}).join(', ');
		if (offenders.length > 8) list += ', … +' + (offenders.length - 8) + ' more';

		banner = document.createElement('div');
		banner.id = 'lg-banner';
		banner.setAttribute('role', 'alert');
		banner.style.cssText =
			'position:fixed;top:0;left:0;right:0;z-index:99999;' +
			'background:#7f1d1d;color:#fff;padding:10px 14px;' +
			'font:13px/1.5 system-ui,sans-serif;border-bottom:2px solid #ef4444;' +
			'box-shadow:0 2px 8px rgba(0,0,0,.25);pointer-events:none;' +
			'display:flex;align-items:center;gap:8px;flex-wrap:wrap;';

		var msg = document.createElement('span');
		msg.textContent =
			'Layout guardrail · ' + mode + ' mode · reading column ≈ ' +
			Math.round(allowed) + 'px · ' + offenders.length +
			' element(s) wider than allowed (margin notes & boxes exempt): ';
		var code = document.createElement('code');
		code.textContent = list;
		code.style.cssText =
			'background:rgba(0,0,0,.25);padding:2px 6px;border-radius:4px;' +
			'font-size:12px;';
		var dismiss = document.createElement('button');
		dismiss.type = 'button';
		dismiss.textContent = '×';
		dismiss.setAttribute('aria-label', 'Dismiss layout warning');
		dismiss.style.cssText =
			'margin-left:auto;pointer-events:auto;cursor:pointer;' +
			'background:rgba(255,255,255,.15);color:#fff;border:none;' +
			'border-radius:6px;padding:3px 10px;font-size:15px;line-height:1;';
		dismiss.addEventListener('click', clearBanner);

		banner.appendChild(msg);
		banner.appendChild(code);
		banner.appendChild(dismiss);
		document.body.appendChild(banner);
	}

	function check() {
		var allowed = allowedWidth();
		// column not laid out yet (hidden / pre-render) → report "not ready"
		// so callers (incl. the CI harness) can poll until it is measurable
		if (allowed <= 0) {
			window.__layoutGuardrail = {
				ok: null, ready: false, mode: modeName(), allowedPx: 0, offenders: []
			};
			return window.__layoutGuardrail;
		}

		var offenders = collect(allowed);
		clearFlags();

		if (offenders.length === 0) {
			clearBanner();
			window.__layoutGuardrail = {
				ok: true, ready: true, mode: modeName(), allowedPx: allowed, offenders: []
			};
			return window.__layoutGuardrail;
		}

		offenders.forEach(function (o) {
			o.el.classList.add(FLAG_CLASS);
			o.el.style.outline = '3px solid #ef4444';
			o.el.style.outlineOffset = '2px';
		});

		// actionable detail per offender: selector, measured width, a short
		// content hint (so the CI report can say WHICH equation/img/widget)
		var details = offenders.map(function (o) {
			var raw = (o.el.textContent || '').trim();
			if (!raw && o.el.getAttribute) {
				raw = o.el.getAttribute('alt') || o.el.getAttribute('src') || '';
			}
			var snippet = (raw || '').replace(/\s+/g, ' ').trim().slice(0, 60);
			return { sel: o.sel, widthPx: Math.round(o.width), snippet: snippet };
		});

		showBanner(offenders, allowed, modeName());
		console.error(
			'[layout-guardrail] ' + offenders.length + ' element(s) overflow the ' +
			modeName() + '-mode reading column (' + Math.round(allowed) + 'px):',
			details.map(function (d) { return d.sel + ' (' + d.widthPx + 'px)' + (d.snippet ? ' "' + d.snippet + '"' : ''); })
		);
		window.__layoutGuardrail = {
			ok: false, ready: true, mode: modeName(), allowedPx: allowed,
			offenders: offenders.map(function (o) { return o.sel; }),
			offenderDetails: details
		};
		return window.__layoutGuardrail;
	}

	// Synchronous, on-demand entry point for the CI harness (and tests).
	window.__layoutGuardrailCheck = check;

	var timer = null;
	function schedule(delay) {
		if (timer) clearTimeout(timer);
		timer = setTimeout(check, (delay == null) ? 220 : delay);
	}

	function init() {
		var c = document.getElementById('contents');
		if (!c) return;

		// reader-mode toggle (any class change on <html>) → re-measure
		// after the ~300ms width transition settles.
		new MutationObserver(function (muts) {
			for (var i = 0; i < muts.length; i++) {
				if (muts[i].type === 'attributes' && muts[i].attributeName === 'class') {
					schedule(360);
					return;
				}
			}
		}).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

		// late content swaps (Markdown render, MathJax, modules) → re-check
		new MutationObserver(function () { schedule(220); })
			.observe(c, { childList: true, subtree: true });

		var rz;
		window.addEventListener('resize', function () {
			clearTimeout(rz);
			rz = setTimeout(check, 200);
		});

		window.addEventListener('load', function () { schedule(300); });
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
