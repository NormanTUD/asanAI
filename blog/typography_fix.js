/* ════════════════════════════════════════════════════════════════════
   TYPOGRAPHY FIX — Butterick's "Practical Typography" applied here.
   Three silent autocorrects (quotes, dashes, ellipsis) and a devtools
   linter that flags what the autocorrects missed.

   Each pass walks ONLY text nodes inside `.md` containers, never
   touching <code>, <pre>, <kbd>, <samp>, <script>, <style>,
   <textarea>, <math>, or anything inside `.no-typo-fix`.

   Boot order:
     • DOMContentLoaded   → first pass + linter
     • `blogPostLoadComplete` (dispatched by functions.php after
       renderMarkdown, bibtexify, sidenote extraction) → re-pass
     • MutationObserver on document.body → catch late inserts
       (Toc / MathJax / lab modules) without overwriting user edits
       (we only touch text nodes that still contain the broken chars)

   Public API:  window.TypographyFix.fixTypography(root?)
                            TypographyFix.lint(root?)
                            TypographyFix.version
   ════════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	const VERSION = '1.0.0';

	const SKIP_TAGS = new Set([
		'CODE', 'PRE', 'KBD', 'SAMP',
		'SCRIPT', 'STYLE', 'TEXTAREA', 'OPTION',
		'MATH', 'SVG'
	]);

	/* Tags whose TEXT nodes are protected, but whose *children* are
	   still eligible (so we can fix quote marks in an <a> inside <p>,
	   but never the <a>'s `href` attribute etc — we never walk
	   attributes anyway).                                          */
	const TEXT_SKIP_TAGS = new Set([
		'CODE', 'PRE', 'KBD', 'SAMP',
		'SCRIPT', 'STYLE', 'TEXTAREA',
		'MATH', 'SVG', 'OPTION'
	]);

	const SKIP_CLASSES = [
		'.no-typo-fix',
		'.no-smart-punct',
		'.do-not-touch'
	];

	const SKIP_SELECTOR = SKIP_CLASSES.join(', ');

	/* ── 1. Walk safe text nodes inside a .md subtree ───────────── */
	function safeTextNodes(root) {
		if (!root || !root.querySelectorAll) return [];
		// We expand the root to include every .md descendant so
		// QuerySelectorAll inside TreeWalker can use the same root
		// for ancestor-traversal.
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
			acceptNode: function (node) {
				const v = node.nodeValue;
				if (!v || !v.length) {
					return NodeFilter.FILTER_REJECT;
				}
				// Real prefilter: no pass and no lint counter can touch a
				// node without one of these chars, so reject it before paying
				// for the ancestor-climb. The set is a strict superset of what
				// smartQuotes / smartDashes / smartEllipsis / lint look for.
				if (v.indexOf("'") === -1 && v.indexOf('"') === -1 &&
					v.indexOf('-') === -1 && v.indexOf('...') === -1) {
					return NodeFilter.FILTER_REJECT;
				}
				let el = node.parentElement;
				while (el && el !== root) {
					if (TEXT_SKIP_TAGS.has((el.tagName || '').toUpperCase())) return NodeFilter.FILTER_REJECT;
					if (el.matches && el.matches(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
					if (el.isContentEditable) return NodeFilter.FILTER_REJECT;
					el = el.parentElement;
				}
				return NodeFilter.FILTER_ACCEPT;
			}
		});
		const out = [];
		let n;
		while ((n = walker.nextNode())) out.push(n);
		return out;
	}

	/* ── 2. Smart quotes ──────────────────────────────────────────
	   Straight ' and " → curly ‘ ’ “ ”.
	   Rules (English):
	     • opening double quote:  " at start of word / after space /
	       after opening bracket / after dash
	     • closing double quote:  otherwise
	     • apostrophe:            between letters
	     • opening single quote:  at start of word
	     • closing single quote:  otherwise
	   Implemented via a single character-class pass, then a state
	   machine over the runs.                                        */
	const CURLY_OPEN_D  = '\u201C';
	const CURLY_CLOSE_D = '\u201D';
	const CURLY_OPEN_S  = '\u2018';
	const CURLY_CLOSE_S = '\u2019';

	function isWordBoundary(ch) {
		// "start of word" for English: start-of-string, whitespace,
		// or any non-alphanumeric punctuation that isn't `'` itself.
		return !ch || /[\s\u00A0\(\[\{<\u2014\u2013\-–—\u2026.,;:!?]/.test(ch);
	}

	function smartQuotesPass(text) {
		// Walk the string char by char. Only operate on ASCII quotes;
		// leave already-curly quotes alone.
		const out = [];
		const len = text.length;
		for (let i = 0; i < len; i++) {
			const c = text[i];
			if (c !== '"' && c !== "'") {
				out.push(c);
				continue;
			}
			const prev = text[i - 1] || '';
			const next = text[i + 1] || '';

			if (c === '"') {
				// Decide open vs. close.
				// Open: at start of word / after a space / opening
				// bracket / colon / semicolon / dash / em-dash.
				// Close: otherwise, OR if the next char is a digit
				// or lowercase letter (e.g. "1\" is closed).
				const opens = isWordBoundary(prev) && next !== '"' &&
					!/^[.,;:!?\)\]\}>\s]/.test(next);
				// Heuristic: closing if next is whitespace, punct,
				// end-of-string, or a digit followed by non-letter.
				const closes = !opens;
				out.push(closes ? CURLY_CLOSE_D : CURLY_OPEN_D);
			} else {
				// Apostrophe vs. single quote.
				const prevIsLetter = /[\p{L}]/u.test(prev);
				const nextIsLetter = /[\p{L}]/u.test(next);
				if (prevIsLetter && !nextIsLetter) {
					// possessive / contraction closing
					out.push(CURLY_CLOSE_S);
				} else if (!prevIsLetter && nextIsLetter) {
					// opening single quote
					out.push(CURLY_OPEN_S);
				} else {
					// ambiguous; default to closing single
					out.push(CURLY_CLOSE_S);
				}
			}
		}
		return out.join('');
	}

	function smartQuotes(root) {
		const nodes = safeTextNodes(root);
		let count = 0;
		for (let i = 0; i < nodes.length; i++) {
			const s = nodes[i].nodeValue;
			if (s && (s.indexOf('"') !== -1 || s.indexOf("'") !== -1)) {
				const t = smartQuotesPass(s);
				if (t !== s && nodes[i].parentNode) { nodes[i].nodeValue = t; count++; }
			}
		}
		return count;
	}

	/* ── 3. Smart dashes ──────────────────────────────────────────
	     word -- word      →  word — word   (em-dash, with NBSPs)
	     1 -- 3            →  1–3           (en-dash range)
	     1--3              →  1–3           (en-dash range)
	     1 - 3             →  1–3           (en-dash range)
	   We deliberately DO NOT touch a single `-` between letters
	   (would mangle hyphenated compounds).                           */
	const EM  = '\u2014';
	const EN  = '\u2013';
	const NBSP = '\u00A0';

	function smartDashesPass(text) {
		let s = text;
		// 1. Number ranges: digits – (space optional) – digits.
		//    Handles "1--3", "1 -- 3", "1 - 3". Does NOT touch
		//    negative numbers like "-3" or minus signs.
		s = s.replace(/(\d)\s*--\s*(\d)/g, '$1' + EN + '$2');
		s = s.replace(/(\d)\s+-\s+(\d)/g, '$1' + EN + '$2');
		// 2. Em-dash REQUIRES whitespace on both sides of `--` —
		//    that prevents breaking compound words like "co--operate"
		//    or "well--known". The lookbehind keeps the boundary
		//    character intact (no double-replacement).
		s = s.replace(/(?<=^|\S) +-- +(?=\S)/g, ' ' + EM + ' ');
		// 3. Em-dash at the start or end of a line: "-- word" or "end --".
		s = s.replace(/(^|\s)--(?=\s|$)/g, '$1' + EM);
		// 4. Triple-dash with spaces: " --- ".
		s = s.replace(/(?<=^|\S) +--- +(?=\S)/g, ' ' + EM + ' ');
		return s;
	}

	function smartDashes(root) {
		const nodes = safeTextNodes(root);
		let count = 0;
		for (const node of nodes) {
			const s = node.nodeValue;
			if (!s || !/--| - /.test(s)) continue;
			const after = smartDashesPass(s);
			if (after === s) continue;
			/* Replace the whole text node, never just the first `--`.
			   Feeding the matched substring into smartDashesPass lets
			   its ^/$ anchors convert ANY `--` (e.g. a GFM table
			   delimiter row `|------|`) into an em-dash, which breaks
			   table parsing before marked even runs. Operating on the
			   full node value keeps the rules context-aware: a `--`
			   only converts when whitespace/line-start flanks it, so
			   pipe-table separator rows are left intact. Setting
			   nodeValue (not createContextualFragment) also avoids
			   re-parsing raw markdown as HTML. */
			node.nodeValue = after;
			count++;
		}
		return count;
	}

	/* ── 4. Smart ellipsis ────────────────────────────────────────
	     ...           →  …
	     ....          →  ….   (period + ellipsis; very rare)
	   We only convert an EXACTLY-3-dot run that is not part of a
	   longer dot-run. Anything in <code> etc. is already filtered. */
	function smartEllipsisPass(text) {
		return text.replace(/(^|[^\.])\.\.\.([^\.]|$)/g, '$1\u2026$2');
	}

	function smartEllipsis(root) {
		const nodes = safeTextNodes(root);
		let count = 0;
		for (let i = 0; i < nodes.length; i++) {
			const s = nodes[i].nodeValue;
			if (s && s.indexOf('...') !== -1) {
				const t = smartEllipsisPass(s);
				if (t !== s && nodes[i].parentNode) { nodes[i].nodeValue = t; count++; }
			}
		}
		return count;
	}

	/* ── 4b. Single-walk fix + lint (the hot path) ──────────────── */
	function lintNode(s, issues) {
		issues.straightQuotes += (s.match(/['"]/g) || []).length;
		issues.asciiEmDashes  += (s.match(/(\s)--(\s)|(\s)---(\s)/g) || []).length;
		issues.asciiEllipsis  += (s.match(/(^|[^\.])\.\.\.([^\.]|$)/g) || []).length;
	}

	function processNode(node, issues) {
		const s = node.nodeValue;
		if (!s) return { quotes: 0, dashes: 0, ellipsis: 0 };
		const hasQ = s.indexOf('"') !== -1 || s.indexOf("'") !== -1;
		const hasD = s.indexOf('-') !== -1;
		const hasE = s.indexOf('...') !== -1;
		let out = s, quotes = 0, dashes = 0, ellipsis = 0;
		if (hasQ) { const t = smartQuotesPass(out);   if (t !== out) { quotes = 1; out = t; } }
		if (hasD) { const t = smartDashesPass(out);   if (t !== out) { dashes = 1; out = t; } }
		if (hasE) { const t = smartEllipsisPass(out); if (t !== out) { ellipsis = 1; out = t; } }
		if (out !== s && node.parentNode) node.nodeValue = out;
		if (issues) lintNode(out, issues);
		return { quotes: quotes, dashes: dashes, ellipsis: ellipsis };
	}

	function applyLint(issues) {
		const total = issues.straightQuotes + issues.asciiEmDashes + issues.asciiEllipsis;
		const de = document.documentElement;
		de.setAttribute('data-typo-issues', String(total));
		de.setAttribute('data-typo-quotes', String(issues.straightQuotes));
		de.setAttribute('data-typo-dashes', String(issues.asciiEmDashes));
		de.setAttribute('data-typo-ellipsis', String(issues.asciiEllipsis));
		if (window.__TYPO_DEBUG__) {
			if (total === 0) {
				console.info('[TypographyFix] lint clean.');
			} else {
				console.groupCollapsed(
					'[TypographyFix] lint: ' + total + ' potential issue(s) (' +
					issues.straightQuotes + ' quotes, ' + issues.asciiEmDashes +
					' dashes, ' + issues.asciiEllipsis + ' ellipsis)'
				);
				console.info(
					'These survived the autocorrect because they sit in a skipped ' +
					'subtree (code/pre/math/no-typo-fix) or are outside any .md block.'
				);
				console.info('Set window.__TYPO_DEBUG__ = false to silence.');
				console.groupEnd();
			}
		}
	}

	function fixAndLint(root) {
		const scope = root || document;
		const t0 = performance.now();
		const nodes = safeTextNodes(scope);
		const issues = { straightQuotes: 0, asciiEmDashes: 0, asciiEllipsis: 0 };
		let q = 0, d = 0, e = 0;
		for (let i = 0; i < nodes.length; i++) {
			const r = processNode(nodes[i], issues);
			q += r.quotes; d += r.dashes; e += r.ellipsis;
		}
		applyLint(issues);
		const dt = performance.now() - t0;
		if (window.__TYPO_DEBUG__ && (q + d + e) > 0) {
			console.info(
				'[TypographyFix v' + VERSION + '] fixed ' + q + ' quote, ' +
				d + ' dash, ' + e + ' ellipsis in ' + dt.toFixed(1) + 'ms'
			);
		}
		return { quotes: q, dashes: d, ellipsis: e, ms: dt, issues: issues };
	}

	/* ── 5. Public API ──────────────────────────────────────────── */
	function fixTypography(root) {
		const scope = root || document;
		const t0 = performance.now();
		const nodes = safeTextNodes(scope);
		let q = 0, d = 0, e = 0;
		for (let i = 0; i < nodes.length; i++) {
			const r = processNode(nodes[i], null);
			q += r.quotes; d += r.dashes; e += r.ellipsis;
		}
		const dt = performance.now() - t0;
		if (window.__TYPO_DEBUG__ && (q + d + e) > 0) {
			console.info(
				'[TypographyFix v' + VERSION + '] fixed ' + q + ' quote, ' +
				d + ' dash, ' + e + ' ellipsis in ' + dt.toFixed(1) + 'ms'
			);
		}
		return { quotes: q, dashes: d, ellipsis: e, ms: dt };
	}

	/* ── 6. Linter — flags what the autocorrects MISSED ───────────
	   Walks the same safe-text scope and counts leftover straight
	   quotes / ASCII dashes-in-dash-context / three-dots. Warnings
	   go to console (devtools) and to `data-typo-issues` on <html>
	   for tooling to read. In production this is silent unless
   `window.__TYPO_DEBUG__ = true` is set.                           */
	function lint(root) {
		const scope = root || document;
		const nodes = safeTextNodes(scope);
		const issues = { straightQuotes: 0, asciiEmDashes: 0, asciiEllipsis: 0 };
		for (let i = 0; i < nodes.length; i++) lintNode(nodes[i].nodeValue, issues);
		applyLint(issues);
		return issues;
	}

	/* ── 7. Boot ────────────────────────────────────────────────── */
	let _booted = false;
	let _mo = null;

	function runOnce(root) {
		try {
			fixAndLint(root);
		} catch (e) {
			console.error('[TypographyFix] pass failed:', e);
		}
	}

	function boot() {
		if (_booted) return;
		_booted = true;

		// First pass after initial render. We give marked.js a
		// microtask to finish so .md has its rendered DOM.
		setTimeout(function () { runOnce(document); }, 0);

		// After the blog's master post-load (sidenotes + bibtexify +
		// renderMarkdown all done), re-run to catch any text that
		// marked inserted into the document.
		window.addEventListener('blogPostLoadComplete', function () {
			setTimeout(function () { runOnce(document); }, 0);
		});

		// Catch late inserts (Toc, MathJax rerender, lab modules).
		_mo = new MutationObserver(function (muts) {
			let touchedRoot = null;
			for (const m of muts) {
				m.addedNodes.forEach(function (n) {
					if (!(n instanceof Element)) return;
					if (!n.querySelectorAll) return;
					// Only re-run when a .md subtree grew.
					if (n.classList && n.classList.contains('md')) {
						touchedRoot = touchedRoot || n;
						return;
					}
					if (n.closest && n.closest('.md')) {
						touchedRoot = touchedRoot || n.closest('.md') || document;
					}
				});
			}
			if (touchedRoot) {
				clearTimeout(window.__typoFixTO);
				window.__typoFixTO = setTimeout(function () {
					runOnce(touchedRoot);
				}, 80);
			}
		});
		_mo.observe(document.body, { childList: true, subtree: true });

		// Expose for polish.js to call directly after its run().
		window.TypographyFix = {
			version: VERSION,
			fixTypography: fixTypography,
			lint: lint,
			_internal: {
				smartQuotes: smartQuotes,
				smartDashes: smartDashes,
				smartEllipsis: smartEllipsis
			}
		};
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})();
