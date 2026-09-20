/* ════════════════════════════════════════════════════════════════
   LAYOUT GUARDRAIL — page-load width check.

   The reading column (#contents) has a hard width set by the general
   max-width CSS variable --mn-col-width (80ch in normal mode, 90ch
   in reader mode — see style.css). Anything in the prose flow that
   renders WIDER than that column is a layout bug — an unclamped
   <img>, a fixed-width canvas, a wide table, an un-wrapped widget.

   On load, and again on reader-mode toggle / resize / late content
   swaps, we walk the column and flag every offending element: a red
   outline in the DOM plus an interactive banner plus console.error.

   The banner is actionable:
     • click a flagged entry → scrolls to the element and flashes it
     • "Exclude"        → stops flagging that selector on THIS page
                          (persisted in localStorage, per page)
     • "Tag"            → applies the special scroll tag (.lg-scroll)
                          to the element live and copies the authoring
                          snippet to your clipboard
     • "FullW"          → applies the full-page-width scroll tag
                          (.lg-widescroll) instead for exceptional
                          cases that may exceed the page width
     • "Copy data"      → copies a structured debug blob (file, mode,
                          allowed width, every offender w/ width +
                          overflow + heading + content snippet)
     • "Copy AI-fix"    → copies a ready-made fix prompt for an AI:
                          which file, which elements are affected and
                          how, listed one by one, and how to fix each
                          (clamp to --mn-col-width, or deliberately
                          label a special tag for scrollable content)

   Margin notes (.sideimage / .sidenote / .sidenote-fallback and the
   two body-level rails), boxes (.optional / .cl-block) and the two
   AUTHOR-LABELED special tags (.lg-scroll / .lg-widescroll) are EXEMPT —
   they are allowed to use extra width by design. So is content that
   overflows a horizontally scrollable ancestor (overflow-x:
   auto/scroll, e.g. long code lines in a <pre>): the overflow is
   contained by design and does not break the column. The scroller
   itself is still measured, so a scroller wider than the column is
   still caught unless you label it with a special tag.
   ════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	if (window.__layoutGuardrailInstalled) return;
	window.__layoutGuardrailInstalled = true;

	var TOL = 2; // px of slack for sub-pixel / border rounding
	var FLAG_CLASS = 'lg-overflow-flag';
	var FLASH_CLASS = 'lg-flash';
	var EXCLUDE_KEY = 'lg-excluded-v1';
	var EXEMPT =
		'.sideimage, .sidenote, .sidenote-fallback, ' +
		'#sideimages-rail, #sidenotes-rail, .optional, .cl-block, ' +
		'.lg-scroll, .lg-widescroll';
	var MAX_ROWS = 6;

	var excluded = loadExcluded();
	var lastDetails = [];
	var lastState = null;

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

	/** True if an ancestor between `el` and the column horizontally
	    scrolls and therefore absorbs the overflow. A long <code> line
	    inside a <pre> with overflow-x:auto is a scrolling code block —
	    intentional and contained, not a layout bug. The scroller itself
	    is still checked as usual, so a scroller that is itself wider
	    than the column is caught (unless it is a labelled special tag,
	    which is exempt by design). */
	function isContainedByScroller(el) {
		var p = el.parentElement;
		while (p && p.id !== 'contents') {
			var cs = getComputedStyle(p);
			if (/(auto|scroll)/.test(cs.overflowX) && p.scrollWidth > p.clientWidth) {
				return true;
			}
			p = p.parentElement;
		}
		return false;
	}

	// ── per-page exclusion store (localStorage) ───────────────────
	function pageKey() {
		return (location && location.pathname) || 'unknown';
	}
	function loadExcluded() {
		try {
			var all = JSON.parse(localStorage.getItem(EXCLUDE_KEY) || '{}');
			return Array.isArray(all[pageKey()]) ? all[pageKey()] : [];
		} catch (e) { return []; }
	}
	function saveExcluded(list) {
		try {
			var all = JSON.parse(localStorage.getItem(EXCLUDE_KEY) || '{}');
			all[pageKey()] = list;
			localStorage.setItem(EXCLUDE_KEY, JSON.stringify(all));
		} catch (e) { /* private mode / file:// → best-effort */ }
	}
	function isExcluded(sel) {
		return excluded.indexOf(sel) !== -1;
	}

	/** Nearest H1–H4 heading above the element — helps the fix report
	    say which section of which lesson an offender belongs to. */
	function contextHeading(el) {
		var p = el;
		while (p && p.getAttribute) {
			var t = p.tagName;
			if (/^H[1-4]$/.test(t)) {
				var txt = (p.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
				return txt ? t + ' "' + txt + '"' : t;
			}
			p = p.parentElement;
		}
		return '';
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
			var sel = selectorOf(el);
			if (isExcluded(sel)) continue;
			if (isExempt(el)) continue;
			if (isOverlay(el)) continue;
			if (isContainedByScroller(el)) continue;
			out.push({ el: el, width: w, sel: sel });
		}
		// keep only the outermost offender in each ancestor chain
		return out.filter(function (o) {
			for (var j = 0; j < out.length; j++) {
				if (o !== out[j] && out[j].el.contains(o.el)) return false;
			}
			return true;
		});
	}

	function computeDetails(offenders, allowed) {
		return offenders.map(function (o) {
			var raw = (o.el.textContent || '').trim();
			if (!raw && o.el.getAttribute) {
				raw = o.el.getAttribute('alt') || o.el.getAttribute('src') || '';
			}
			return {
				sel: o.sel,
				widthPx: Math.round(o.width),
				overflowPx: Math.max(0, Math.round(o.width - allowed)),
				snippet: (raw || '').replace(/\s+/g, ' ').trim().slice(0, 80),
				heading: contextHeading(o.el)
			};
		});
	}

	// ── clipboard ─────────────────────────────────────────────────
	function copyText(text) {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).catch(function () { legacyCopy(text); });
		} else {
			legacyCopy(text);
		}
	}
	function legacyCopy(text) {
		var ta = document.createElement('textarea');
		ta.value = text;
		ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
		document.body.appendChild(ta);
		ta.select();
		try { document.execCommand('copy'); } catch (e) { /* no-op */ }
		document.body.removeChild(ta);
	}

	// ── report builders ───────────────────────────────────────────
	function buildDataBlob(details, mode, allowed) {
		var lines = [
			'LAYOUT GUARDRAIL — debug data',
			'file/page: ' + (location.pathname || '?'),
			'mode: ' + mode + '  (reading column ≈ ' + Math.round(allowed) +
				'px; CSS var --mn-col-width = 80ch normal / 90ch reader)',
			'offenders: ' + details.length
		];
		details.forEach(function (d, i) {
			lines.push('  #' + (i + 1) + ' ' + d.sel + ' — ' + d.widthPx +
				'px (overflow +' + d.overflowPx + 'px)' +
				(d.heading ? ' | heading ' + d.heading : '') +
				(d.snippet ? ' | snippet "' + d.snippet + '"' : ''));
		});
		lines.push('re-run: window.__layoutGuardrailCheck()');
		return lines.join('\n');
	}

	function buildFixPrompt(details, mode, allowed) {
		var approx = Math.round(allowed);
		var lines = [
			'Fix the layout overflows on ' + (location.pathname || 'this page') +
				' (blog lesson PHP file).'
		];
		lines.push('');
		lines.push('Contract: no in-flow element may exceed the reading column ' +
			'#contents, whose width is set by the general max-width CSS variable ' +
			'--mn-col-width (' + (mode === 'reader' ? '90ch' : '80ch') +
			'; ≈ ' + approx + 'px on this page).');
		lines.push('');
		lines.push('The layout guardrail flagged ' + details.length +
			' element(s) rendering wider than the column:');
		lines.push('');
		details.forEach(function (d, i) {
			lines.push('  ' + (i + 1) + ') ' + d.sel + ' — measured ' + d.widthPx +
				'px, allowed ≈ ' + approx + 'px, overflow +' + d.overflowPx + 'px');
			if (d.heading) lines.push('      context heading: ' + d.heading);
			if (d.snippet) lines.push('      content: "' + d.snippet + '"');
		});
		lines.push('');
		lines.push('How to fix each one:');
		lines.push('  A. Default — clamp it to the column: set width:100%; ' +
			'max-width:var(--mn-col-width) on the element (or on the wrapper that ' +
			'constrains it) in the lesson file / the relevant CSS. This is the ' +
			'ONLY fix that needs no label.');
		lines.push('  B. Scrollable INSIDE — only if it truly cannot shrink ' +
			'(wide equation, table, code block): wrap it in the special tag: ' +
			'<div class="lg-scroll">…</div> (clamped to the column, horizontal ' +
			'scroll inside). Label it deliberately — the guardrail treats it as exempt.');
		lines.push('  C. Full page width, scroll inside — only for exceptional ' +
			'cases (e.g. the huge transformer equations): <div class="lg-widescroll">…' +
			'</div> (max-width:100vw, horizontal scroll inside its own box).');
		lines.push('Never widen the #contents column itself to accommodate content.');
		lines.push('');
		lines.push('Verify afterwards: open the console and run ' +
			'window.__layoutGuardrailCheck() — it must return { ok: true }.');
		return lines.join('\n');
	}

	// ── DOM helpers ───────────────────────────────────────────────
	function unflag(el) {
		el.classList.remove(FLAG_CLASS, FLASH_CLASS);
		el.style.outline = '';
		el.style.outlineOffset = '';
		el.style.cursor = '';
	}

	function flagEl(el) {
		el.classList.add(FLAG_CLASS);
		el.style.outline = '3px solid #ef4444';
		el.style.outlineOffset = '2px';
		el.style.cursor = 'crosshair';
		if (!el._lgClick) {
			el._lgClick = true;
			el.addEventListener('click', function () { scrollToEl(el); });
		}
	}

	function scrollToEl(el) {
		if (!el) return;
		el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
		el.classList.add(FLASH_CLASS);
		setTimeout(function () { el.classList.remove(FLASH_CLASS); }, 2200);
	}

	function applySpecialTag(el, kind) {
		if (!el) return;
		var cls = (kind === 'wide') ? 'lg-widescroll' : 'lg-scroll';
		el.classList.remove('lg-scroll', 'lg-widescroll');
		el.classList.add(cls);
		unflag(el);
		copyText(cls === 'lg-scroll'
			? 'Wrap the overflowing element with the special layout tag:\n\n' +
				'<div class="lg-scroll">…</div>\n\n' +
				'(or add class="lg-scroll" to its wrapper). Clamps to ' +
				'--mn-col-width and scrolls horizontally inside.'
			: 'Wrap it with the full-page-width scroll tag:\n\n' +
				'<div class="lg-widescroll">…</div>\n\n' +
				'(max-width:100vw, horizontal scroll inside its own box; ' +
				'guardrail-exempt and allowed to exceed the page width).');
	}

	function excludeSel(sel) {
		// normalise bare '#id' / '.cls' to the guardrail's canonical
		// selectorOf() form (e.g. 'div#foo') so lookup in collect() matches
		var canonical = sel;
		try {
			var el = document.querySelector(sel);
			if (el) canonical = selectorOf(el);
		} catch (e) { /* malformed selector → keep raw string */ }
		if (excluded.indexOf(canonical) === -1) {
			excluded.push(canonical);
			saveExcluded(excluded);
		}
		check();
	}

	var banner = null;
	function clearBanner() {
		if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
		banner = null;
	}

	function clearFlags() {
		var flagged = document.querySelectorAll('.' + FLAG_CLASS);
		for (var i = 0; i < flagged.length; i++) unflag(flagged[i]);
	}

	function mkBtn(label, cls, tip) {
		var b = document.createElement('button');
		b.type = 'button';
		b.textContent = label;
		b.title = tip;
		b.className = cls;
		b.style.cssText =
			'pointer-events:auto;cursor:pointer;white-space:nowrap;' +
			'background:rgba(255,255,255,.15);color:#fff;' +
			'border:1px solid rgba(255,255,255,.3);border-radius:6px;' +
			'padding:2px 8px;font-size:11px;line-height:1.6;';
		return b;
	}

	function showBanner(offenders, allowed, mode) {
		clearBanner();
		banner = document.createElement('div');
		banner.id = 'lg-banner';
		banner.setAttribute('role', 'alert');
		banner.style.cssText =
			'position:fixed;top:0;left:0;right:0;z-index:99999;' +
			'background:#7f1d1d;color:#fff;padding:10px 14px;' +
			'font:13px/1.5 system-ui,sans-serif;border-bottom:2px solid #ef4444;' +
			'box-shadow:0 2px 8px rgba(0,0,0,.25);pointer-events:auto;' +
			'max-height:70vh;overflow-y:auto;';

		var head = document.createElement('div');
		head.style.cssText =
			'display:flex;align-items:center;gap:8px;flex-wrap:wrap;';

		var msg = document.createElement('span');
		msg.textContent =
			'Layout guardrail · ' + mode + ' mode · reading column ≈ ' +
			Math.round(allowed) + 'px · ' + offenders.length +
			' element(s) wider than allowed (margin notes, boxes & special tags exempt). ' +
			'Click an entry to scroll to it. ';
		head.appendChild(msg);

		var bData = mkBtn('Copy data', 'lg-btn-data', 'Copy structured debug data to the clipboard');
		var bFix = mkBtn('Copy AI-fix', 'lg-btn-fix', 'Copy a ready-made fix prompt for an AI / your editor');
		var dismiss = mkBtn('×', 'lg-btn-dismiss', 'Dismiss this warning');
		dismiss.style.cssText += 'margin-left:auto;font-size:14px;';
		bData.addEventListener('click', function () {
			copyText(buildDataBlob(lastDetails, mode, allowed));
		});
		bFix.addEventListener('click', function () {
			copyText(buildFixPrompt(lastDetails, mode, allowed));
		});
		dismiss.addEventListener('click', clearBanner);

		head.appendChild(bData);
		head.appendChild(bFix);
		head.appendChild(dismiss);
		banner.appendChild(head);

		var visible = offenders.slice(0, MAX_ROWS);
		visible.forEach(function (o) {
			var d = lastDetails[offenders.indexOf(o)];
			var row = document.createElement('div');
			row.style.cssText =
				'display:flex;align-items:center;gap:8px;flex-wrap:wrap;' +
				'margin-top:6px;background:rgba(0,0,0,.18);padding:5px 8px;' +
				'border-radius:6px;cursor:pointer;font-size:12px;';
			row.title = 'Click to scroll to this element';

			var info = document.createElement('span');
			info.style.cssText = 'flex:1 1 260px;min-width:0;';
			info.textContent = o.sel + ' → ' + d.widthPx + 'px (overflow +' +
				d.overflowPx + 'px)' + (d.snippet ? ' "' + d.snippet + '"' : '');

			var bEx = mkBtn('Exclude', 'lg-btn-exclude', 'Stop flagging this element on this page (saved per page)');
			var bTag = mkBtn('Tag', 'lg-btn-tag', 'Apply the scrollable-inside special tag (class="lg-scroll") and copy the snippet');
			var bWide = mkBtn('FullW', 'lg-btn-wide', 'Apply the full-page-width scroll tag (class="lg-widescroll")');

			row.addEventListener('click', function () { scrollToEl(o.el); });
			bEx.addEventListener('click', function (ev) { ev.stopPropagation(); excludeSel(o.sel); });
			bTag.addEventListener('click', function (ev) { ev.stopPropagation(); applySpecialTag(o.el, 'scroll'); });
			bWide.addEventListener('click', function (ev) { ev.stopPropagation(); applySpecialTag(o.el, 'wide'); });

			row.appendChild(info);
			row.appendChild(bEx);
			row.appendChild(bTag);
			row.appendChild(bWide);
			banner.appendChild(row);
		});

		if (offenders.length > MAX_ROWS) {
			var more = document.createElement('div');
			more.textContent = '… +' + (offenders.length - MAX_ROWS) + ' more (see console)';
			more.style.cssText = 'margin-top:6px;font-size:11px;opacity:.8;';
			banner.appendChild(more);
		}

		document.body.appendChild(banner);
	}

	function check() {
		var allowed = allowedWidth();
		// column not laid out yet (hidden / pre-render) → report "not ready"
		// so callers (incl. the CI harness) can poll until it is measurable
		if (allowed <= 0) {
			lastState = {
				ok: null, ready: false, mode: modeName(), allowedPx: 0, offenders: []
			};
			window.__layoutGuardrail = lastState;
			return window.__layoutGuardrail;
		}

		var offenders = collect(allowed);
		clearFlags();

		if (offenders.length === 0) {
			clearBanner();
			lastState = {
				ok: true, ready: true, mode: modeName(), allowedPx: allowed, offenders: []
			};
			window.__layoutGuardrail = lastState;
			return window.__layoutGuardrail;
		}

		offenders.forEach(flagEl);
		lastDetails = computeDetails(offenders, allowed);
		showBanner(offenders, allowed, modeName());
		console.error(
			'[layout-guardrail] ' + offenders.length + ' element(s) overflow the ' +
			modeName() + '-mode reading column (' + Math.round(allowed) + 'px):',
			lastDetails.map(function (d) {
				return d.sel + ' (' + d.widthPx + 'px)' +
					(d.snippet ? ' "' + d.snippet + '"' : '');
			})
		);
		lastState = {
			ok: false, ready: true, mode: modeName(), allowedPx: allowed,
			offenders: offenders.map(function (o) { return o.sel; }),
			offenderDetails: lastDetails
		};
		window.__layoutGuardrail = lastState;
		return window.__layoutGuardrail;
	}

	// Synchronous, on-demand entry point for the CI harness (and tests).
	window.__layoutGuardrailCheck = check;

	// Public helpers so tests (and a human in the console) can drive the
	// interaction logic without clicking the banner.
	window.__layoutGuardrailExclude = excludeSel;
	window.__layoutGuardrailTag = function (sel, kind) {
		var el = null;
		try { el = document.querySelector(sel); } catch (e) { el = null; }
		if (el) applySpecialTag(el, kind || 'scroll');
		check();
	};

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