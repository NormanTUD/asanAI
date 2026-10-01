/* ════════════════════════════════════════════════════════════════
   MATH GUARDRAIL — authoring check for math-gated blocks.

   The math-comfort gate (topics.js) tucks every `data-mathlevel` block
   when the reader's comfort is below the requirement. A tucked block is
   labelled by its `data-optionaltitle`, or — failing that — by its first
   H1–H6 heading. A math-gated block that has NEITHER a title nor a
   heading (or that shows raw `$$` LaTeX outside a `.md` container, which
   never renders) is an authoring gap: the tuck would show a bare "needs
   … math" pill with no idea what the section is about, and the math may
   not even render.

   This guardrail finds those blocks and, like layout_guardrail.js, offers
   an actionable banner:
      • click a flagged entry → scrolls to the block and flashes it
      • "Copy data"   → copies a structured debug blob
      • "Copy AI-fix" → copies a ready-made prompt (file + each block +
                        exactly what to add) for an AI / your editor

   It runs ONLY in debug mode (`?debug=1` in the URL, or set
   `window.__MATH_GUARDRAIL__ = true` before load). Production and the CI
   render validator — which fails on any console.error — stay completely
   silent. In debug mode offenders are reported with console.error.
   ════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	if (window.__mathGuardrailInstalled) return;
	window.__mathGuardrailInstalled = true;

	var DEBUG = false;
	try {
		DEBUG = (typeof window !== 'undefined' && window.location && /\bdebug=1\b/.test(window.location.search))
			|| (typeof window !== 'undefined' && !!window.__MATH_GUARDRAIL__);
	} catch (e) { /* headless / non-browser: stays off */ }
	if (!DEBUG) return;

	var MAX_ROWS = 8;
	var FLAG_CLASS = 'mg-overflow-flag';
	var FLASH_CLASS = 'mg-flash';
	var lastDetails = [];
	var lastState = null;

	// ── clipboard (mirrors layout_guardrail.js) ─────────────────
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

	// ── detection ───────────────────────────────────────────────
	function firstHeading(block) {
		var h = block.querySelector('h1, h2, h3, h4, h5, h6');
		if (!h) return null;
		var t = (h.textContent || '').replace(/\s+/g, ' ').trim();
		return t || null;
	}
	function mathReqOf(block) {
		return block.getAttribute('data-mathlevel') || block.getAttribute('data-math-level') || '';
	}
	function hasRawMathOutsideMd(block) {
		if (block.closest && block.closest('.md')) return false;
		var txt = block.textContent || '';
		return /\$\$[^$]*[_\\][^$]*\$\$/.test(txt);
	}
	function openingTag(el) {
		var oh = el.outerHTML || '';
		var i = oh.indexOf('>');
		return (i === -1 ? oh : oh.slice(0, i + 1)).slice(0, 220);
	}
	function nearestHeadingAbove(el) {
		var p = el;
		while (p && p !== document.body) {
			var prev = p.previousElementSibling;
			while (prev) {
				var m = prev.matches && prev.matches('h1, h2, h3, h4, h5, h6');
				if (m) return (prev.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
				prev = prev.previousElementSibling;
			}
			p = p.parentElement;
		}
		return '';
	}

	function collect() {
		var blocks = document.querySelectorAll('[data-mathlevel], [data-math-level]');
		var out = [];
		Array.prototype.forEach.call(blocks, function (b) {
			if (b.querySelector && b.querySelector('.topic-block-alt')) return; // uses the plain-language twin
			var title = b.getAttribute('data-optionaltitle');
			var heading = firstHeading(b);
			var rawMath = hasRawMathOutsideMd(b);
			var noLabel = !title && !heading;
			if (!noLabel && !rawMath) return;
			out.push({
				el: b,
				mathReq: mathReqOf(b),
				hasTitle: !!title,
				heading: heading,
				rawMath: rawMath,
				open: openingTag(b),
				headingAbove: nearestHeadingAbove(b),
				snippet: (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70)
			});
		});
		return out;
	}

	// ── report builders ─────────────────────────────────────────
	function describe(d, i) {
		var reasons = [];
		if (!d.hasTitle && !d.heading) reasons.push('no data-optionaltitle and no H1–H6 heading');
		if (d.rawMath) reasons.push('raw $$ LaTeX outside a .md container (never renders)');
		return '  ' + (i + 1) + ') mathlevel ' + (d.mathReq || '?') + ' — ' + reasons.join('; ') +
			(d.headingAbove ? ' | under ' + d.headingAbove : '') +
			(d.snippet ? ' | "' + d.snippet + '"' : '');
	}
	function buildDataBlob(offenders) {
		var lines = [
			'MATH GUARDRAIL — debug data',
			'file/page: ' + (location.pathname || '?'),
			'offenders: ' + offenders.length
		];
		offenders.forEach(function (d, i) { lines.push(describe(d, i)); });
		lines.push('re-run: window.__mathGuardrailCheck()');
		return lines.join('\n');
	}
	function buildFixPrompt(offenders) {
		var lines = [
			'Fix the math-gated blocks on ' + (location.pathname || 'this lesson') + ' (blog lesson PHP).',
			'',
			'Contract: every element with a data-mathlevel="N" attribute is tucked by the math-comfort gate.',
			'When tucked it must be labelled — give it a `data-optionaltitle="…"` (a short title) OR put an',
			'H1–H6 heading at the top of the block. Any `$$ … $$` LaTeX must live inside a <div class="md">',
			'or it will never render (it shows as literal "$$ … $$" to the reader).',
			'',
			'The math guardrail flagged ' + offenders.length + ' block(s):'
		];
		offenders.forEach(function (d, i) {
			lines.push('');
			lines.push('  ' + (i + 1) + ') ' + d.open);
			if (!d.hasTitle && !d.heading) lines.push('     -> add data-optionaltitle="…" or an H1–H6 heading inside this block');
			if (d.rawMath) lines.push('     -> wrap the $$ math in <div class="md"> … </div> so it renders');
			if (d.headingAbove) lines.push('     (nearest heading above: "' + d.headingAbove + '")');
		});
		lines.push('');
		lines.push('Verify afterwards: reload with ?debug=1 and run window.__mathGuardrailCheck() — it must');
		lines.push('return { ok: true }.');
		return lines.join('\n');
	}

	// ── DOM banner (mirrors layout_guardrail.js) ────────────────
	function scrollToEl(el) {
		if (!el) return;
		el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
		el.classList.add(FLASH_CLASS);
		setTimeout(function () { el.classList.remove(FLASH_CLASS); }, 2200);
	}
	function mkBtn(label, tip) {
		var b = document.createElement('button');
		b.type = 'button';
		b.textContent = label;
		b.title = tip;
		b.style.cssText =
			'pointer-events:auto;cursor:pointer;white-space:nowrap;' +
			'background:rgba(255,255,255,.14);color:#fff;' +
			'border:1px solid rgba(255,255,255,.3);border-radius:6px;' +
			'padding:2px 8px;font-size:11px;line-height:1.6;font-family:inherit;';
		return b;
	}
	var banner = null;
	function clearBanner() {
		if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
		banner = null;
	}
	function showBanner(offenders) {
		clearBanner();
		banner = document.createElement('div');
		banner.id = 'mg-banner';
		banner.setAttribute('role', 'alert');
		banner.style.cssText =
			'position:fixed;top:0;left:0;right:0;z-index:99999;' +
			'background:#78350f;color:#fff;padding:10px 14px;' +
			'font:13px/1.5 system-ui,sans-serif;border-bottom:2px solid #f59e0b;' +
			'box-shadow:0 2px 8px rgba(0,0,0,.25);pointer-events:auto;' +
			'max-height:70vh;overflow-y:auto;';

		var head = document.createElement('div');
		head.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;';
		var msg = document.createElement('span');
		msg.textContent = 'Math guardrail (debug) · ' + offenders.length +
			' math-gated block(s) need a title/heading (or raw $$ to move into .md). ';
		var bData = mkBtn('Copy data', 'Copy structured debug data to the clipboard');
		var bFix = mkBtn('Copy AI-fix', 'Copy a ready-made fix prompt for an AI / your editor');
		var dismiss = mkBtn('×', 'Dismiss this warning');
		dismiss.style.cssText += 'margin-left:auto;font-size:14px;';
		bData.addEventListener('click', function () { copyText(buildDataBlob(offenders)); });
		bFix.addEventListener('click', function () { copyText(buildFixPrompt(offenders)); });
		dismiss.addEventListener('click', clearBanner);
		head.appendChild(msg);
		head.appendChild(bData);
		head.appendChild(bFix);
		head.appendChild(dismiss);
		banner.appendChild(head);

		offenders.slice(0, MAX_ROWS).forEach(function (d) {
			var row = document.createElement('div');
			row.style.cssText =
				'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px;' +
				'background:rgba(0,0,0,.18);padding:5px 8px;border-radius:6px;cursor:pointer;font-size:12px;';
			row.title = 'Click to scroll to this block';
			var info = document.createElement('span');
			info.style.cssText = 'flex:1 1 260px;min-width:0;';
			info.textContent = 'mathlevel ' + (d.mathReq || '?') +
				(!d.hasTitle && !d.heading ? ' · no title/heading' : '') +
				(d.rawMath ? ' · raw $$ outside .md' : '') +
				(d.snippet ? '  "' + d.snippet + '"' : '');
			row.addEventListener('click', function () { scrollToEl(d.el); });
			row.appendChild(info);
			banner.appendChild(row);
			d.el.classList.add(FLAG_CLASS);
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
		var offenders = collect();
		if (offenders.length === 0) {
			clearBanner();
			document.querySelectorAll('.' + FLAG_CLASS).forEach(function (el) { el.classList.remove(FLAG_CLASS); });
			lastState = { ok: true, ready: true, offenders: [] };
			window.__mathGuardrail = lastState;
			return lastState;
		}
		showBanner(offenders);
		console.error(
			'[math-guardrail] ' + offenders.length + ' math-gated block(s) need a title/heading (or raw $$ into .md):',
			offenders.map(function (d, i) {
				return 'mathlevel ' + (d.mathReq || '?') +
					(!d.hasTitle && !d.heading ? ' (no title/heading)' : '') +
					(d.rawMath ? ' (raw $$ outside .md)' : '') +
					(d.snippet ? ' "' + d.snippet + '"' : '');
			})
		);
		lastState = {
			ok: false, ready: true,
			offenders: offenders.map(function (d) { return { mathReq: d.mathReq, open: d.open, rawMath: d.rawMath }; })
		};
		window.__mathGuardrail = lastState;
		return lastState;
	}

	// Synchronous entry point for tests / console.
	window.__mathGuardrailCheck = check;

	var timer = null;
	function schedule(delay) {
		if (timer) clearTimeout(timer);
		timer = setTimeout(check, (delay == null) ? 260 : delay);
	}
	function init() {
		var c = document.getElementById('contents');
		// Markdown render + late module swaps mutate #contents → re-check.
		if (c && typeof MutationObserver !== 'undefined') {
			new MutationObserver(function () { schedule(); }).observe(c, { childList: true, subtree: true });
		}
		window.addEventListener('load', function () { schedule(400); });
		document.addEventListener('topics:change', function () { schedule(); });
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
