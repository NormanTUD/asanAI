/* ════════════════════════════════════════════════════════════════
   KEY-POINT CALLOUTS — turn a `>` blockquote into an "in short" card.

   Trigger: the standard Markdown blockquote, `> `. That is the whole
   point — co-writing models reach for `>` to set off an important line
   or a quotation, so `>` is the trigger the author (and those models)
   already use. No new syntax to remember or to keep telling models.

   A blockquote becomes a key-point card when it is short (a summary
   sentence, a question, or a quote with a byline) and has no complex
   content. A qualifying blockquote is replaced in place by a
   <div class="kp-block" data-kp="…"> carrying the same children.

   If the last paragraph is a byline ("— Name", possibly a citation),
   it is kept but restyled as a small, muted .kp-source line beneath
   the (italic) quote — the classic pull-quote look.

   The formal quote system (a <footer>/<cite>, or .citation /
   .quote-author / .quote-source markup) and anything with code,
   tables, lists, images, … are left as ordinary blockquotes.

   Purely additive and idempotent: it never throws, never destroys
   content, and a blockquote that does not qualify keeps exactly the
   blockquote style it had before.
   ════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	const TAG = '[keypoint]';

	/* A "key point" is a summary sentence or the like, not a wall of
	   text. Anything longer is treated as a normal note/quote.       */
	const MAX_KEYPOINT_CHARS = 500;

	/* Content that disqualifies a blockquote from being a key point. */
	const FORBIDDEN = ['pre', 'table', 'img', 'video', 'iframe', 'form', 'blockquote', 'ul', 'ol'];

	/* HTML that marks a blockquote as part of the formal quote system
	   (a <footer>/<cite>, or the quote author/source markup). Those are
	   left exactly as the quoting system renders them.              */
	const ATTRIB_TAG  = ['footer', 'cite'];
	const ATTRIB_CLASS = ['citation', 'quote-author', 'quote-source'];

	/* ── 1. HTML-attribute escaper ─────────────────────────── */
	function escAttr(s) {
		// guard 1: never throw on null/undefined
		if (s === null || s === undefined) { return ''; }
		// guard 2: force a string before doing any text work
		let v = String(s);
		// guard 3: strip NUL bytes a malformed node could carry
		v = v.replace(/\u0000/g, '');
		// guard 4: cap absurdly long values so the DOM attribute stays sane
		if (v.length > 64) {
			console.warn(TAG + ' escAttr: value longer than 64 chars, truncating.');
			v = v.substring(0, 64);
		}
		// guard 5: escape the five attribute-breaking characters
		return v.replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}

	/* visible text of a node: its whole subtree's text, collapsed.
	   Uses textContent when present (a real DOM), else a manual walk. */
	function visibleText(el) {
		if (!el) return '';
		let t = (typeof el.textContent === 'string') ? el.textContent : '';
		if (!t && el.children) {
			t = el.children.map(visibleText).join(' ');
		}
		return t.replace(/\s+/g, ' ').trim();
	}

	/* does the subtree contain a descendant with any of `tags`, or a
	   matching class / data-attribute? Used for the guards below.   */
	function hasDescendant(el, tags, classes, attrNames) {
		if (!el || !el.children) return false;
		for (let i = 0; i < el.children.length; i++) {
			const n = el.children[i];
			if (!n) continue;
			const tag = (n.tagName || '').toLowerCase();
			if (tags && tags.indexOf(tag) !== -1) return true;
			if (classes && n.classList && classes.some(function (c) { return n.classList.contains(c); })) return true;
			if (attrNames) {
				const ds = n.dataset || {};
				if (attrNames.some(function (a) { return ds[a] !== undefined && ds[a] !== ''; })) return true;
			}
			if (hasDescendant(n, tags, classes, attrNames)) return true;
		}
		return false;
	}

	/* ── 2. classify a <blockquote> → {kind, source} | null ──────────
	   kind   : 'summary' | 'question'
	   source : the byline <p> node, or null when there is none
	   null   : "not a key point — leave it exactly as it is."         */
	function classifyBlockquote(bq) {
		// guard 1: it must be a real <blockquote> element
		if (!bq || bq.nodeType !== 1 || (bq.tagName || '').toUpperCase() !== 'BLOCKQUOTE') {
			if (bq) console.error(TAG + ' classify: not a <blockquote> element, got ' + (bq.tagName || typeof bq) + '.');
			return null;
		}
		// guard 2: it must sit inside rendered blog content
		if (typeof bq.closest === 'function' && !bq.closest('.md')) {
			console.warn(TAG + ' classify: blockquote is outside a .md container; leaving it as-is.');
			return null;
		}
		// guard 3: idempotency — never touch something already tagged
		if (bq.dataset && bq.dataset.kp) {
			console.warn(TAG + ' classify: node already carries data-kp; skipping to stay idempotent.');
			return null;
		}
		// guard 4: complex content (code, tables, lists, media, nested quote)
		if (FORBIDDEN.some(function (t) { return hasDescendant(bq, [t], null, null); })) {
			console.warn(TAG + ' classify: blockquote holds complex content; leaving it as a normal blockquote.');
			return null;
		}
		// guard 5: the formal quote system stays exactly as it is
		if (hasDescendant(bq, ATTRIB_TAG, ATTRIB_CLASS, ['cite', 'ref'])) {
			console.warn(TAG + ' classify: blockquote uses the formal quote markup; leaving it as-is.');
			return null;
		}
		// collect the top-level paragraphs
		const ps = (bq.querySelectorAll ? Array.from(bq.querySelectorAll(':scope > p')) : []).filter(Boolean);
		// guard 6: needs real text; an empty blockquote is not a key point
		const totalText = visibleText(bq);
		if (!totalText) {
			console.warn(TAG + ' classify: blockquote has no text; leaving it as-is.');
			return null;
		}
		// guard 7: a key point is short — at most two paragraphs
		if (ps.length > 2) {
			console.warn(TAG + ' classify: blockquote has ' + ps.length + ' paragraphs; too long for a key point.');
			return null;
		}
		// guard 8: the length cap — a "summary sentence or the like," not a wall
		if (totalText.length > MAX_KEYPOINT_CHARS) {
			console.warn(TAG + ' classify: blockquote is ' + totalText.length + ' chars (max ' + MAX_KEYPOINT_CHARS + '); leaving it as a normal blockquote.');
			return null;
		}
		// Detect a trailing byline ("— Name", possibly a citation). It
		// becomes the small .kp-source line, not part of the quote body.
		let source = null;
		if (ps.length >= 2) {
			const lastP = ps[ps.length - 1];
			const lastText = visibleText(lastP);
			// guard 9: byline = last para starts with a dash + is a short attribution
			if (/^[\u2014\u2013-]\s/.test(lastText) && lastText.length <= 120) {
				source = lastP;
			}
		}
		// decide the kind from the MAIN text (the byline, if any, is excluded)
		let kind = 'summary';
		try {
			const mainPs = source ? ps.slice(0, -1) : ps;
			const lastMain = mainPs.length ? mainPs[mainPs.length - 1] : bq;
			const stripped = visibleText(lastMain)
				.replace(/`[^`]*`/g, ' ')
				.replace(/\\cite\w*\{[^}]*\}\s*$/g, '')
				.replace(/[\s*_~>\]\}]+$/g, '');
			kind = (stripped.charAt(stripped.length - 1) === '?') ? 'question' : 'summary';
		} catch (e) {
			console.warn(TAG + ' classify: kind detection threw, defaulting to summary.', e);
			kind = 'summary';
		}
		return { kind: kind, source: source };
	}

	/* ── 3. replace a qualifying <blockquote> with a .kp-block div ──
	   `result` is { kind, source } from classifyBlockquote.          */
	function upgradeBlockquote(bq, result) {
		const kind = (result && result.kind) ? result.kind : 'summary';
		const source = (result && result.source) ? result.source : null;
		// guard 1: a real element still attached to the document
		if (!bq || bq.nodeType !== 1 || !bq.parentNode) {
			console.error(TAG + ' upgrade: blockquote is not attached to the document; skipping.');
			return false;
		}
		// guard 2: only the two known kinds are valid
		if (kind !== 'summary' && kind !== 'question') {
			console.warn(TAG + ' upgrade: unknown kind "' + kind + '", defaulting to summary.');
			kind = 'summary';
		}
		// guard 3: the source node must actually be a child of this blockquote
		if (source && source.parentNode !== bq) {
			console.warn(TAG + ' upgrade: byline node is not a child of the blockquote; dropping it.');
			result.source = null;
		}
		// guard 4: the DOM APIs we need must exist
		if (typeof document === 'undefined' || typeof document.createElement !== 'function' ||
		    typeof bq.parentNode.replaceChild !== 'function') {
			console.error(TAG + ' upgrade: required DOM API is unavailable; leaving the blockquote as-is.');
			return false;
		}
		try {
			const div = document.createElement('div');
			// guard 5: the replacement node must be usable
			if (!div || div.nodeType !== 1 || typeof div.appendChild !== 'function') {
				console.error(TAG + ' upgrade: could not create a usable replacement node.');
				return false;
			}
			div.className = 'kp-block';
			if (typeof div.setAttribute === 'function') { div.setAttribute('data-kp', escAttr(kind)); }
			else if (div.dataset) { div.dataset.kp = kind; }
			// move every child across (appendChild detaches it from bq)
			while (bq.firstChild) { div.appendChild(bq.firstChild); }
			// restyle the byline as a small source line
			if (result.source && result.source.classList && typeof result.source.classList.add === 'function') {
				result.source.classList.add('kp-source');
			}
			bq.parentNode.replaceChild(div, bq);
			// guard 6: verify the swap actually landed
			if (!div.parentNode) {
				console.error(TAG + ' upgrade: replacement did not land in the DOM; state may be inconsistent.');
				return false;
			}
			return true;
		} catch (e) {
			// guard 7: any failure leaves the blockquote exactly as it was
			console.error(TAG + ' upgrade: failed to upgrade the blockquote; leaving it unchanged.', e);
			return false;
		}
	}

	/* ── 4. walk a rendered .md container and upgrade the ones that qualify ── */
	function upgradeBlockquotes(container) {
		// guard 1: a usable container
		if (!container || typeof container.querySelectorAll !== 'function') {
			if (container) console.warn(TAG + ' upgradeBlockquotes: container has no querySelectorAll; skipping.');
			return { upgraded: 0, skipped: 0 };
		}
		let bqs;
		try {
			bqs = Array.from(container.querySelectorAll('blockquote')).filter(Boolean);
		} catch (e) {
			// guard 2: a broken querySelectorAll must not break the page
			console.error(TAG + ' upgradeBlockquotes: querySelectorAll("blockquote") threw; skipping.', e);
			return { upgraded: 0, skipped: 0 };
		}
		if (!bqs.length) {
			return { upgraded: 0, skipped: 0 }; // nothing to do — not an error
		}
		let upgraded = 0, skipped = 0;
		for (let i = 0; i < bqs.length; i++) {
			try {
				// guard 3: per-element fault isolation
				const result = classifyBlockquote(bqs[i]);
				if (!result) { skipped++; continue; }
				if (upgradeBlockquote(bqs[i], result)) upgraded++;
				else skipped++;
			} catch (e) {
				// guard 4: one bad node never aborts the rest
				console.error(TAG + ' upgradeBlockquotes: element ' + i + ' threw; continuing.', e);
				skipped++;
			}
		}
		// guard 5: blockquotes existed but none qualified — a misconfig signal
		if (upgraded === 0 && skipped > 0) {
			console.warn(TAG + ' upgradeBlockquotes: found ' + bqs.length + ' blockquote(s) but upgraded none; none looked like a key point.');
		}
		return { upgraded, skipped };
	}

	/* ── public API ── */
	window.BlogKeypoints = {
		classifyBlockquote,
		upgradeBlockquote,
		upgradeBlockquotes,
		escAttr
	};
})();
