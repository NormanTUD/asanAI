"use strict";

/* ═══════════════════════════════════════════════════════════════════
   BlogFeedback — public-facing feedback widget.
   Activated by the 🐛 button in the top-right chrome.
   Posts are hidden until the user enters "feedback mode"; once
   active, all approved feedback renders as sticky-notes ("post-its")
   anchored to the relevant text (or to a section for general feedback).

   Every browser gets a stable `fb_visitor` id (set on first run, kept
   for one year) so the user always sees their own feedback, replies,
   and "pending approval" items — even after reload, even before the
   admin approves them.

   Network errors, server errors, and per-field validation messages
   surface as toasts at the top of the page. Uncaught exceptions are
   caught by the global error handler below.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
	if (window.BlogFeedback && window.BlogFeedback._ready) return;

	const ROOT     = window.location.pathname.replace(/\/$/, '');
	const LESSON   = (() => {
		const m = ROOT.match(/\/([^\/]+?)(?:\.php)?$/);
		return m ? m[1] : 'index';
	})();
	const API_BASE = (ROOT.indexOf('/blog/') >= 0 ? '' : '/blog/') + 'api/feedback';
	const CATS = ['bug', 'typo', 'suggestion', 'question', 'content', 'other'];

	const $  = (s, r) => (r || document).querySelector(s);
	const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
	const escHtml = s => String(s == null ? '' : s)
		.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	const escAttr = s => escHtml(s);
	const relTime = iso => {
		if (!iso) return '';
		const t = new Date(iso.replace(' ', 'T') + 'Z').getTime();
		if (isNaN(t)) return '';
		const s = Math.round((Date.now() - t) / 1000);
		if (s < 60)     return 'just now';
		if (s < 3600)   return Math.round(s / 60) + 'm ago';
		if (s < 86400)  return Math.round(s / 3600) + 'h ago';
		if (s < 2592000) return Math.round(s / 86400) + 'd ago';
		const d = new Date(t);
		return d.toISOString().slice(0, 10);
	};

	const state = {
		mode:       false,
		items:      [],
		ahaTop:     [],
		visitorId:  '',
		admin:      false,
		git:        null,
		expanded:   new Set(),
		reactions:  new Map(),
		ahaOnText:  new Set(),
		pendingPopover: null,
		challenge:  '',
		optimistic: new Map(),     // local-only pending items, keyed by uuid
	};

	/* ─────────────────────────────────────────────────────────────────
	   Visitor id + challenge token (per-browser identity + anti-spam)
	   ───────────────────────────────────────────────────────────────── */
	function ensureChallenge() {
		if (state.challenge) return state.challenge;
		const c = (window.crypto && crypto.randomUUID)
			? crypto.randomUUID()
			: ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
				(c ^ (window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4)).toString(16));
		state.challenge = c;
		document.cookie = 'fb_challenge=' + c + '; path=/; max-age=7200; SameSite=Lax';
		return c;
	}

	function ensureVisitor() {
		if (state.visitorId) return state.visitorId;
		let v = '';
		const m = document.cookie.match(/(?:^|;\s*)fb_visitor=([a-f0-9]+)/);
		if (m && /^[a-f0-9]{32}$/.test(m[1])) v = m[1];
		if (!v) {
			const b = new Uint8Array(16);
			(window.crypto || msCrypto).getRandomValues(b);
			v = Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
			document.cookie = 'fb_visitor=' + v + '; path=/; max-age=' + (60*60*24*365) + '; SameSite=Lax';
		}
		state.visitorId = v;
		return v;
	}

	function isAdmin() {
		const c = document.cookie.match(/(?:^|;\s*)fb_admin=([a-f0-9]{40})/);
		return !!c;
	}

	/* ─────────────────────────────────────────────────────────────────
	   Network wrapper — every API call goes through here.
	   Returns {ok, data} on success, throws an Error on failure.
	   The thrown Error carries the server's human message so toasts
	   can show it verbatim, plus request_id for support.
	   ───────────────────────────────────────────────────────────────── */
	async function api(method, url, body) {
		let res;
		try {
			const opts = {
				method, credentials: 'same-origin',
				headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'BlogFeedback' },
			};
			if (body !== undefined) opts.body = JSON.stringify(body);
			res = await fetch(API_BASE + url, opts);
		} catch (e) {
			throw new Error('Network error: ' + (e.message || 'could not reach the server') +
				' — check your connection and retry.');
		}

		let payload = null;
		const ct = res.headers.get('Content-Type') || '';
		if (ct.indexOf('application/json') >= 0) {
			try { payload = await res.json(); } catch (_) { payload = null; }
		}
		const requestId = res.headers.get('X-Request-Id') || '';

		if (!res.ok) {
			const serverMsg = payload && payload.error ? payload.error : ('HTTP ' + res.status + ' ' + res.statusText);
			const err = new Error(serverMsg);
			err.status = res.status;
			err.code   = payload && payload.code;
			err.field  = payload && payload.field;
			err.requestId = requestId;
			throw err;
		}
		if (!payload) {
			throw new Error('Server returned an empty or non-JSON response.');
		}
		return payload;
	}

	/* ─────────────────────────────────────────────────────────────────
	   Mode toggle (enter/exit bug mode)
	   ───────────────────────────────────────────────────────────────── */
	function setMode(on) {
		state.mode = !!on;
		document.documentElement.classList.toggle('fb-mode', state.mode);
		const btn = $('#fb-toggle');
		if (btn) btn.classList.toggle('is-active', state.mode);
		if (state.mode) {
			ensureChallenge();
			ensureVisitor();
			fetchFeedback();
			mountNudgeDismiss();
		} else {
			closeAllPopovers();
			teardownRendered();
		}
	}

	function toggleMode() { setMode(!state.mode); }

	/* ── Auto-show annotations for admin users on every page load.
	   Admin sees post-its without clicking the bug button first. ── */
	function autoLoadForAdmin() {
		const c = document.cookie.match(/(?:^|;\s*)fb_admin=([a-f0-9]{40})/);
		if (!c) return;
		state.admin = true;
		ensureVisitor();
		fetchFeedback(true).then(() => {
			if (state.items.length) {
				renderAll();
				// Admin doesn't get the "click bug button to start" first-tour —
				// they see annotations immediately.
				const btn = $('#fb-toggle');
				if (btn) {
					btn.classList.add('is-admin-view');
					btn.title = 'Admin: annotations visible. Click to enter bug mode (add/edit).';
				}
				document.documentElement.classList.add('fb-admin-view');
				flashToast(`👁 Admin view: ${state.items.length} annotation${state.items.length === 1 ? '' : 's'} on this lesson.`, false, 'info');
			}
		});
	}

	function teardownRendered() {
		$$('.fb-postit, .fb-marker, .fb-general-marker, .fb-selection-pointer').forEach(el => el.remove());
		$$('.fb-highlight').forEach(el => {
			if (!el.dataset.aha) {
				const t = document.createTextNode(el.textContent);
				el.parentNode.replaceChild(t, el);
			}
		});
	}

	/* ─────────────────────────────────────────────────────────────────
	   Fetch feedback list + aha top
	   ───────────────────────────────────────────────────────────────── */
	async function fetchFeedback(silent) {
		try {
			// Admin users hit the auth-protected list endpoint so they see
			// pending / unapproved / resolved items too (public list hides
			// them). Non-admin users always see the public list.
			const isAdmin = state.admin || document.cookie.match(/(?:^|;\s*)fb_admin=([a-f0-9]{40})/);
			state.admin = !!isAdmin;
			const endpoint = isAdmin ? '/admin/list.php?lesson=' + encodeURIComponent(LESSON)
			                         : '/list.php?lesson='      + encodeURIComponent(LESSON);
			const j = await api('GET', endpoint);
			state.items  = j.feedback || [];
			state.ahaTop = j.aha_top || [];
			state.git    = j.git || null;
			state.items.forEach(it => {
				if (it.my_reaction) state.reactions.set(it.id, it.my_reaction);
			});
			renderAll();
			if (j.pending_own && !silent) {
				const pending = state.items.filter(x => x.is_own && !x.approved);
				if (pending.length === 1) {
					flashToast('Your previous feedback is still pending admin review.', false, 'info');
				} else if (pending.length > 1) {
					flashToast('You have ' + pending.length + ' pending feedback items awaiting review.', false, 'info');
				}
			}
		} catch (e) {
			if (!silent) flashToast('Could not load feedback: ' + e.message, true);
		}
	}

	/* ─────────────────────────────────────────────────────────────────
	   Anchor extraction — capture context around a text selection so we
	   can re-locate it after the lesson changes.
	   ───────────────────────────────────────────────────────────────── */
	function buildSelectorChain(el) {
		const parts = [];
		let cur = el;
		while (cur && cur.nodeType === 1 && parts.length < 12 && cur.tagName !== 'HTML') {
			let part = cur.tagName.toLowerCase();
			if (cur.classList && cur.classList.length) {
				const cls = Array.from(cur.classList)
					.filter(c => /^(md|cl|sidenote|optional|topic-block|figure|image-row|keypoint|kp|smart-quote)/.test(c) || c.length < 24)
					.slice(0, 3)
					.join('.');
				if (cls) part += '.' + cls;
			}
			if (cur.id && /^[a-zA-Z][\w\-:]*$/.test(cur.id)) {
				part += '#' + cur.id;
				parts.unshift(part);
				break;
			}
			const parent = cur.parentElement;
			if (parent) {
				const sibs = Array.from(parent.children).filter(c => c.tagName === cur.tagName);
				if (sibs.length > 1) {
					const idx = sibs.indexOf(cur) + 1;
					part += ':nth-of-type(' + idx + ')';
				}
			}
			parts.unshift(part);
			cur = parent;
		}
		return parts.join(' > ');
	}

	function captureAnchorFromSelection() {
		const sel = window.getSelection();
		if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
		const range = sel.getRangeAt(0);
		const text  = sel.toString();
		if (!text || text.trim().length < 2) return null;

		let container = range.commonAncestorContainer;
		if (container.nodeType === 3) container = container.parentElement;
		if (!container) return null;

		const inContent = container.closest('.md, p, li, blockquote, h1, h2, h3, h4, h5, figcaption, pre, figure');
		if (!inContent && !container.matches('h1, h2, h3, h4, h5, figcaption, p, li, blockquote')) {
			return null;
		}

		const fullText = container.textContent || '';
		const offset = textOffsetInContainer(range.startContainer, range.startOffset, container);
		const offsetEnd = offset + text.length;

		const prefix = fullText.slice(Math.max(0, offset - 80), offset);
		const suffix = fullText.slice(offsetEnd, Math.min(fullText.length, offsetEnd + 80));

		return {
			anchor_type: 'text',
			anchor_selector: buildSelectorChain(container),
			anchor_quote:   text.slice(0, 800),
			anchor_prefix:  prefix,
			anchor_suffix:  suffix,
			anchor_offset:  offset,
			anchor_offset_end: offsetEnd,
			anchor_section: nearestHeading(container),
			anchor_section_id: nearestHeadingId(container),
			anchor_chunks:    captureAnchorChunks(text),
			anchor_section_title: nearestHeading(container) || '',
			anchor_text_hash: djb2Hash(text),
			viewport_x: window.scrollX + range.getBoundingClientRect().left,
			viewport_y: window.scrollY + range.getBoundingClientRect().top,
		};
	}

	/* Split a selection into 2–3 overlapping chunks. Each chunk is
	   a self-contained string that, together with the main quote, lets
	   relocateAnchor() recover even after substantial text edits. */
	function captureAnchorChunks(text) {
		const t = String(text || '');
		if (t.length < 40) return [];
		const chunks = [];
		const head = t.slice(0, 40);
		const tail = t.slice(-40);
		chunks.push(head);
		if (t.length > 80) {
			const mid = Math.floor(t.length / 2);
			chunks.push(t.slice(Math.max(0, mid - 20), Math.min(t.length, mid + 20)));
		}
		if (tail && tail !== head) chunks.push(tail);
		// Trim duplicates, keep at most 3.
		const seen = new Set();
		return chunks.filter(c => {
			if (!c || seen.has(c)) return false;
			seen.add(c); return true;
		}).slice(0, 3);
	}

	/* Tiny string hash (DJB2) — used as anchor_text_hash to detect when the
	   exact selection still exists somewhere on the page (then we can be sure
	   fresh OR orphan — but never fuzzy-misdetected). */
	function djb2Hash(s) {
		let h = 5381;
		for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
		return (h >>> 0).toString(36);
	}

	function captureAnchorFromElement(el) {
		const fig  = el.closest('figure');
		const img  = el.matches && el.matches('img') ? el : (el.closest && el.closest('img'));
		const h    = el.closest && el.closest('h1, h2, h3, h4, h5, h6');
		const code = el.closest && el.closest('pre, code');
		const tbl  = el.closest && el.closest('table');
		const figcap = el.closest && el.closest('figcaption');
		const x = window.scrollX + el.getBoundingClientRect().left;
		const y = window.scrollY + el.getBoundingClientRect().top;

		const section = nearestHeading(el);
		const sectionId = nearestHeadingId(el);

		if (img || (fig && !fig.querySelector('pre, table, code'))) {
			const realImg = img || fig.querySelector('img');
			const cap = fig ? fig.querySelector('figcaption') : null;
			return {
				anchor_type: 'image',
				anchor_selector: buildSelectorChain(fig || img),
				anchor_section: section,
				anchor_section_id: sectionId,
				anchor_quote: (realImg ? (realImg.alt || realImg.src.split('/').pop() || 'image') : 'figure').slice(0, 800),
				anchor_image_src: realImg ? realImg.currentSrc || realImg.src : null,
				anchor_image_alt: realImg ? (realImg.alt || '') : (cap ? cap.textContent.trim().slice(0, 200) : ''),
				anchor_caption: cap ? cap.textContent.trim().slice(0, 400) : '',
				viewport_x: x, viewport_y: y,
			};
		}

		if (h) {
			return {
				anchor_type: 'heading',
				anchor_selector: buildSelectorChain(h),
				anchor_quote: h.textContent.trim().slice(0, 400),
				anchor_section: h.textContent.trim().slice(0, 200),
				anchor_section_id: h.id || '',
				viewport_x: x, viewport_y: y,
			};
		}

		if (code) {
			return {
				anchor_type: 'code',
				anchor_selector: buildSelectorChain(code),
				anchor_quote: code.textContent.trim().slice(0, 800),
				anchor_section: section,
				anchor_section_id: sectionId,
				viewport_x: x, viewport_y: y,
			};
		}

		if (tbl) {
			return {
				anchor_type: 'table',
				anchor_selector: buildSelectorChain(tbl),
				anchor_quote: tbl.textContent.trim().slice(0, 400),
				anchor_section: section,
				anchor_section_id: sectionId,
				viewport_x: x, viewport_y: y,
			};
		}

		return {
			anchor_type: 'general',
			anchor_selector: buildSelectorChain(el.closest('.md') || el.parentElement || el),
			anchor_section: section,
			anchor_section_id: sectionId,
			viewport_x: x, viewport_y: y,
		};
	}

	function textOffsetInContainer(node, offsetInNode, container) {
		if (node === container) return offsetInNode;
		let total = 0;
		const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
		let cur = walker.nextNode();
		while (cur) {
			if (cur === node) return total + offsetInNode;
			total += cur.nodeValue.length;
			cur = walker.nextNode();
		}
		return total;
	}

	function nearestHeading(el) {
		let cur = el;
		while (cur) {
			if (cur.tagName && /^H[1-6]$/.test(cur.tagName)) return cur.textContent.slice(0, 200);
			cur = cur.parentElement;
		}
		return '';
	}
	function nearestHeadingId(el) {
		let cur = el;
		while (cur) {
			if (cur.tagName && /^H[1-6]$/.test(cur.tagName) && cur.id) return cur.id;
			cur = cur.parentElement;
		}
		return '';
	}

	/* ─────────────────────────────────────────────────────────────────
	   Re-anchoring — locate the anchor text in the current DOM.
	   Strategy:
	     1. Try the stored CSS selector; if found, search the element's
	        text for prefix+quote+suffix; compute new offsets.
	     2. If selector not found, walk the page and look for prefix+quote.
	     3. If found with same offsets → 'fresh' (1.0).
	     4. If found but offsets differ → 'moved' (0.7).
	     5. If only the quote is found (no prefix/suffix context match) →
	        'moved' (0.5).
	     6. If nothing found → 'orphan' (0.0).
	   Returns { el, offset, offsetEnd, status, confidence } or null.
	   ───────────────────────────────────────────────────────────────── */
	function relocateAnchor(it) {
		const sel = it.anchor.selector;
		const quote = it.anchor.quote || '';
		const chunks = Array.isArray(it.anchor.chunks) ? it.anchor.chunks : [];
		if (!sel && !quote && !chunks.length) return null;

		const candidates = [];
		if (sel) {
			try {
				const el = document.querySelector(sel);
				if (el) candidates.push(el);
			} catch (_) { /* invalid selector */ }
		}
		if (!candidates.length) {
			$$('.md, p, li, blockquote, figcaption, h1, h2, h3, h4, h5, .sidenote-source').forEach(e => candidates.push(e));
		}

		let best = null;
		const prefix = it.anchor.prefix || '';
		const suffix = it.anchor.suffix || '';

		// Strategy 1 (highest confidence): main quote with prefix+suffix context.
		//   If the exact surrounding context still matches at the original offset
		//   the text is untouched — 'fresh', confidence 1.0.
		// Strategy 2: prefix+quote+suffix matches at a different offset —
		//   'moved', confidence 0.85.
		// Strategy 3: main quote matches alone — 'moved', confidence 0.6.
		// Strategy 4: a stored chunk matches — 'moved', confidence 0.4–0.55.
		// Strategy 5: fuzzy match (whitespace-normalized Levenshtein-ish window)
		//   — 'moved', confidence 0.25.
		// Strategy 6: nothing — 'orphan', confidence 0.

		for (const el of candidates) {
			const text = el.textContent || '';
			if (!text) continue;

			if (quote) {
				const r = tryExactAnchor(text, quote, prefix, suffix, it.anchor.offset);
				if (r && (!best || r.confidence > best.confidence)) best = r.el ? r : Object.assign(r, { el });
			}

			if (chunks.length && (!best || best.confidence < 0.55)) {
				for (const ch of chunks) {
					if (!ch || ch === quote) continue;
					const r = tryChunkAnchor(text, ch, prefix, suffix);
					if (r && (!best || r.confidence > best.confidence)) {
						best = Object.assign({ el }, r);
					}
				}
			}

			if (!best || best.confidence < 0.4) {
				const r = tryFuzzyAnchor(text, quote || chunks[0] || '');
				if (r && (!best || r.confidence > best.confidence)) {
					best = Object.assign({ el }, r);
				}
			}
		}

		if (!best) return { status: 'orphan', confidence: 0.0, el: null, offset: 0, offsetEnd: 0 };
		return best;
	}

	/* ── Anchor-search strategies (called per candidate element) ── */
	/* How many characters of offset drift still count as "fresh". The
	   page can legitimately shift the offset by hundreds of chars
	   (whitespace normalization, smart quotes, sibling paragraphs
	   added) without the user-meaning changing. The user's intuition
	   is: "if the highlighted text is the exact same words I selected,
	   it's still right where I clicked it". So we use a generous
	   tolerance — anything within 200 chars of the original offset is
	   considered fresh. */
	const FRESH_OFFSET_TOL = 200;

	function tryExactAnchor(text, quote, prefix, suffix, origOffset) {
		let idx;
		if (prefix || suffix) {
			idx = text.indexOf(prefix + quote + suffix);
			if (idx >= 0) {
				idx += prefix.length;
				const isFresh = origOffset !== null && origOffset !== undefined && Math.abs(idx - origOffset) <= FRESH_OFFSET_TOL;
				return { offset: idx, offsetEnd: idx + quote.length,
					status: isFresh ? 'fresh' : 'moved',
					confidence: isFresh ? 1.0 : 0.85 };
			}
		}
		idx = text.indexOf(quote);
		if (idx < 0) return null;
		const isFresh = origOffset !== null && origOffset !== undefined && Math.abs(idx - origOffset) <= FRESH_OFFSET_TOL;
		return { offset: idx, offsetEnd: idx + quote.length,
			status: isFresh ? 'fresh' : 'moved',
			confidence: isFresh ? 0.95 : 0.6 };
	}

	function tryChunkAnchor(text, chunk, prefix, suffix) {
		if (!chunk || chunk.length < 4) return null;
		let idx;
		if (prefix || suffix) {
			idx = text.indexOf(prefix + chunk + suffix);
			if (idx >= 0) {
				idx += prefix.length;
				return { offset: idx, offsetEnd: idx + chunk.length, status: 'moved', confidence: 0.55 };
			}
		}
		idx = text.indexOf(chunk);
		if (idx < 0) return null;
		return { offset: idx, offsetEnd: idx + chunk.length, status: 'moved', confidence: 0.4 };
	}

	function tryFuzzyAnchor(text, needle) {
		if (!needle || needle.length < 8) return null;
		const normText  = text.replace(/\s+/g, ' ').toLowerCase();
		const normNeed  = needle.replace(/\s+/g, ' ').toLowerCase();
		const wnd = normNeed.length;
		// Sliding window: find the window with the highest similarity to needle.
		let bestIdx = -1, bestSim = 0;
		const maxStart = Math.max(0, normText.length - wnd);
		const step = Math.max(1, Math.floor(wnd / 4));
		for (let i = 0; i <= maxStart; i += step) {
			const slice = normText.substr(i, wnd);
			const sim   = similarity(slice, normNeed);
			if (sim > bestSim) { bestSim = sim; bestIdx = i; }
			if (sim >= 0.98) break;
		}
		if (bestIdx < 0 || bestSim < 0.7) return null;
		// Map back to the original text indices (approximate).
		const start = text.indexOf(normText.substr(bestIdx, 8)) || bestIdx;
		return { offset: start, offsetEnd: Math.min(text.length, start + needle.length),
			status: 'moved', confidence: 0.25 + bestSim * 0.15 };
	}

	/* Quick ratio of matching characters at corresponding positions. */
	function similarity(a, b) {
		const n = Math.min(a.length, b.length);
		if (n === 0) return 0;
		let same = 0;
		for (let i = 0; i < n; i++) if (a[i] === b[i]) same++;
		return same / Math.max(a.length, b.length);
	}

	function createRangeFromOffsets(container, offset, end) {
		const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
		let cur = walker.nextNode();
		let pos = 0;
		let startNode = null, startOff = 0, endNode = null, endOff = 0;
		while (cur) {
			const len = cur.nodeValue.length;
			if (!startNode && pos + len >= offset) {
				startNode = cur; startOff = offset - pos;
			}
			if (pos + len >= end) {
				endNode = cur; endOff = end - pos; break;
			}
			pos += len;
			cur = walker.nextNode();
		}
		if (!startNode) return null;
		if (!endNode)  { endNode = startNode; endOff = startOff; }
		const r = document.createRange();
		try { r.setStart(startNode, startOff); r.setEnd(endNode, endOff); }
		catch (_) { return null; }
		// The range must be inside the container, otherwise surroundContents
		// will throw DOMException. Some browsers return a range that crosses
		// element boundaries when the container has nested elements.
		if (!container.contains(startNode) || !container.contains(endNode)) return null;
		return r;
	}

	/* Insert a marker at the text offset without using surroundContents
	   (which fails when the range crosses element boundaries — a common
	   case in markdown-rendered HTML where headings, lists, and links
	   sit inside the same .md container). We split the text node at the
	   offset and insert the marker right after. */
	function insertMarkerAtOffset(container, offset, marker) {
		const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
		let cur = walker.nextNode();
		let pos = 0;
		while (cur) {
			const len = cur.nodeValue.length;
			if (pos + len >= offset) {
				const splitAt = Math.max(0, Math.min(len, offset - pos));
				try {
					const tail = cur.splitText(splitAt);
					cur.parentNode.insertBefore(marker, tail);
					return true;
				} catch (_) { return false; }
			}
			pos += len;
			cur = walker.nextNode();
		}
		return false;
	}

	/* ─────────────────────────────────────────────────────────────────
	   Render — post-its and collapsed markers
	   ───────────────────────────────────────────────────────────────── */
	function renderAll() {
		$$('.fb-postit, .fb-marker, .fb-general-marker').forEach(el => el.remove());
		state.items.forEach(it => renderOne(it));
		renderAdminBar();
	}

	function renderOne(it) {
		if (it.anchor_type !== 'text') return renderNonText(it);

		const loc = relocateAnchor(it);
		const status = loc ? loc.status : 'orphan';
		const conf   = loc ? loc.confidence : 0;

		const marker = document.createElement('button');
		marker.className = 'fb-marker';
		marker.dataset.id = it.id;
		marker.dataset.uuid = it.uuid;
		marker.dataset.cat = it.category || 'bug';
		// marker shows the ⚠ chip only when the text was truly orphaned.
		// offset drift with a matching quote is not "stale" from the
		// user's POV — the right words are still highlighted.
		marker.dataset.stale = (status === 'orphan' || it.status === 'resolved' || it.status === 'wontfix' || it.status === 'spam') ? '1' : '0';
		if (it._pending) marker.dataset.pending = '1';
		if (it._failed)  marker.dataset.failed = '1';
		if (it.aha_count > 0) marker.classList.add('is-aha');
		if (it.upvotes + it.downvotes > 0) {
			marker.dataset.count = (it.upvotes - it.downvotes);
			if (marker.dataset.count === '0') delete marker.dataset.count;
		}
		marker.title = (it.category || 'bug') + ': ' + (it.body || '').slice(0, 200);
		marker.innerHTML = iconFor(it.category);

		if (loc && loc.el) {
			const range = createRangeFromOffsets(loc.el, loc.offset, loc.offsetEnd);
			let mounted = false;
			if (range) {
				const span = document.createElement('span');
				span.className = 'fb-highlight';
				span.dataset.fbId = it.id;
				try {
					range.surroundContents(span);
					span.appendChild(marker);
					mounted = true;
				} catch (_) {
					// Range crossed an element boundary (headings, links,
					// lists in markdown-rendered HTML). Fall back to
					// splitting at the start offset and dropping the marker
					// right at the text — never at the end of the element.
					if (insertMarkerAtOffset(loc.el, loc.offset, marker)) {
						// Wrap the surrounding text node with a thin
						// highlight so the user can still see which
						// passage was annotated.
						try {
							const walker = document.createTreeWalker(loc.el, NodeFilter.SHOW_TEXT);
							const tn = walker.nextNode();
							if (tn) {
								const span2 = document.createElement('span');
								span2.className = 'fb-highlight';
								span2.dataset.fbId = it.id;
								const range2 = document.createRange();
								range2.selectNodeContents(tn);
								range2.surroundContents(span2);
							}
						} catch (__) {}
						mounted = true;
					}
				}
				if (status !== 'fresh') {
					span.title = 'This feedback was filed when the text was at a different position. The post-it may be slightly outdated.';
				}
			} else if (insertMarkerAtOffset(loc.el, loc.offset, marker)) {
				mounted = true;
			}
			if (!mounted) {
				// Last-resort fallback: append to the element so the user
				// can still find the annotation, but mark it visibly
				// displaced.
				loc.el.appendChild(marker);
				marker.classList.add('fb-marker-displaced');
			}
		} else {
			// Anchor could not be re-located at all (text deleted / heavily
			// edited). Show the marker as a small footer chip in the
			// post-it itself rather than gluing it to the left edge.
			$('#contents') ? $('#contents').appendChild(marker)
				: document.body.appendChild(marker);
			marker.style.position = 'fixed';
			marker.style.right = '20px';
			marker.style.bottom = (60 + (Math.abs(it.id) % 5) * 32) + 'px';
			marker.classList.add('fb-marker-displaced');
			marker.title = '⚠ Annotation orphaned — the anchored text was edited away. The original quote: "' + (it.anchor.quote || '').slice(0, 120) + '"';
		}

		marker.addEventListener('click', e => {
			e.stopPropagation();
			togglePostit(it.id, marker);
		});
	}

	function renderNonText(it) {
		const loc = relocateAnchor(it);
		const targetEl = loc && loc.el ? loc.el : null;
		const x = it.anchor.viewport_x || 0;
		const y = it.anchor.viewport_y || 0;

		const marker = document.createElement('button');
		marker.className = 'fb-marker fb-marker-element';
		marker.dataset.id = it.id;
		marker.dataset.cat = it.category || 'bug';
		if (it._pending) marker.dataset.pending = '1';
		if (it._failed)  marker.dataset.failed = '1';
		if (it.aha_count > 0) marker.classList.add('is-aha');
		if (it.upvotes + it.downvotes > 0) {
			marker.dataset.count = (it.upvotes - it.downvotes);
			if (marker.dataset.count === '0') delete marker.dataset.count;
		}
		marker.title = (it.category || 'bug') + ' · ' + (it.anchor_type || 'element') + ': ' + (it.body || '').slice(0, 200);
		marker.innerHTML = iconFor(it.category);

		if (targetEl) {
			const tag = targetEl.tagName.toLowerCase();
			if (tag === 'img') {
				const wrap = targetEl.parentElement;
				if (wrap && getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
				marker.classList.add('fb-marker-corner');
				(wrap || targetEl).appendChild(marker);
			} else if (tag === 'figure') {
				if (getComputedStyle(targetEl).position === 'static') targetEl.style.position = 'relative';
				marker.classList.add('fb-marker-corner');
				targetEl.appendChild(marker);
			} else {
				if (getComputedStyle(targetEl).position === 'static') targetEl.style.position = 'relative';
				marker.classList.add('fb-marker-corner');
				targetEl.appendChild(marker);
			}
		} else if (x && y) {
			$('#contents') ? $('#contents').appendChild(marker) : document.body.appendChild(marker);
			marker.style.position = 'absolute';
			marker.style.left = Math.max(8, x) + 'px';
			marker.style.top  = Math.max(80, y) + 'px';
		} else {
			$('#contents') ? $('#contents').appendChild(marker) : document.body.appendChild(marker);
			marker.style.position = 'fixed';
			marker.style.left = '20px';
			marker.style.bottom = (60 + (Math.abs(it.id) % 5) * 32) + 'px';
		}

		marker.addEventListener('click', e => {
			e.stopPropagation();
			togglePostit(it.id, marker);
		});
	}

	function renderGeneral(it) {
		const m = document.createElement('button');
		m.className = 'fb-general-marker';
		m.dataset.id = it.id;
		m.dataset.cat = it.category || 'bug';
		m.innerHTML = '📌';
		m.title = 'General feedback: ' + (it.body || '').slice(0, 200);
		const x = it.anchor.viewport_x || (window.innerWidth / 2);
		const y = it.anchor.viewport_y || (window.innerHeight / 2);
		m.style.left = Math.max(8, Math.min(window.innerWidth - 36, x)) + 'px';
		m.style.top  = Math.max(80, Math.min(window.innerHeight - 36, y + window.scrollY)) + 'px';
		$('#contents') ? $('#contents').appendChild(m) : document.body.appendChild(m);

		m.addEventListener('click', e => {
			e.stopPropagation();
			togglePostit(it.id, m);
		});
	}

	function iconFor(cat) {
		return ({
			bug: '🐛', typo: '✏️', suggestion: '💡',
			question: '❓', content: '📚', other: '💬'
		})[cat] || '💬';
	}

	function togglePostit(id, anchor) {
		if (state.expanded.has(id)) {
			closePostit(id);
		} else {
			const it = state.items.find(x => x.id === id);
			if (!it) return;
			openPostit(it, anchor);
		}
	}

	function closePostit(id) {
		state.expanded.delete(id);
		$$('.fb-postit').forEach(el => { if (+el.dataset.id === id) el.remove(); });
	}

	function openPostit(it, anchor) {
		closePostit(it.id);
		state.expanded.add(it.id);
		const el = document.createElement('div');
		el.className = 'fb-postit';
		el.dataset.id = it.id;
		el.dataset.cat = it.category || 'bug';
		if (state.admin) el.classList.add('is-admin-view');
		el.innerHTML = renderPostitHTML(it);
		document.body.appendChild(el);
		positionPostit(el, anchor);
		bindPostitEvents(el, it);
		// Scroll the highlighted passage into view (if any) so the user
		// sees exactly which text the annotation is attached to, plus a
		// brief pulse on the highlight.
		const hl = anchor && anchor.classList && anchor.classList.contains('fb-highlight')
			? anchor
			: document.querySelector('.fb-highlight[data-fb-id="' + it.id + '"]');
		if (hl && hl.scrollIntoView) {
			hl.scrollIntoView({ behavior: 'smooth', block: 'center' });
			hl.classList.add('fb-highlight-pulse');
			setTimeout(() => hl.classList.remove('fb-highlight-pulse'), 1400);
		}
	}

	function renderPostitHTML(it) {
		const loc = it.anchor_type !== 'general' ? relocateAnchor(it) : null;
		// Show the "may be stale" badge only when the anchor truly lost
		// the original text — not when it merely drifted by a few hundred
		// characters in offset. If the exact quote text is still findable
		// anywhere, the highlight is still pointing at the user's words.
		const stale = !loc || loc.status === 'orphan';
		const adminExtras = state.admin ? `
			<div class="fb-postit-author">
				${it.author_handle ? 'by <b>' + escHtml(it.author_handle) + '</b>' : 'Anonymous'}
				${it.author_email ? ' · <a href="mailto:' + escAttr(it.author_email) + '">' + escHtml(it.author_email) + '</a>' : ''}
				${it.git_commit ? ' · commit <code>' + escHtml(it.git_commit.slice(0, 7)) + '</code>' : ''}
				${loc ? ' · anchor: ' + escHtml(loc.status) : ' · anchor: orphan'}
			</div>` : '';

		let context = '';
		if (it.anchor_type === 'image' && it.anchor.quote) {
			context = `<div class="fb-postit-context fb-postit-context-image">📷 ${escHtml(it.anchor.quote.slice(0, 200))}</div>`;
		} else if (it.anchor_type === 'heading' && it.anchor.quote) {
			context = `<div class="fb-postit-quote">§ ${escHtml(it.anchor.quote.slice(0, 200))}</div>`;
		} else if (it.anchor_type === 'code' && it.anchor.quote) {
			context = `<pre class="fb-postit-context-code">${escHtml(it.anchor.quote.slice(0, 240))}</pre>`;
		} else if (it.anchor.quote) {
			context = `<div class="fb-postit-quote">"${escHtml(it.anchor.quote.slice(0, 240))}"</div>`;
		}

		const sug = (it.anchor_type === 'suggestion' && it.suggestion_original) ? `
			<div class="fb-postit-suggestion">
				<div class="fb-suggestion-old">${escHtml(it.suggestion_original.slice(0, 240))}</div>
				<div class="fb-suggestion-arrow">↓</div>
				<div class="fb-suggestion-new">${escHtml((it.suggestion_replacement || '').slice(0, 240))}</div>
			</div>` : '';
		const myUp = state.reactions.get(it.id) === 'up';
		const myDown = state.reactions.get(it.id) === 'down';
		const myAhaKey = it.anchor.quote ? (LESSON + '|' + (it.anchor.prefix || '') + '|' + it.anchor.quote + '|' + (it.anchor.suffix || '')) : '';
		const myAha = state.ahaOnText.has(myAhaKey);

		const ownBadge = it.is_own ? '<span class="fb-postit-own" title="You posted this — only you and the admin can see it until approved.">★ your post</span>' : '';
		const pendingBadge = it._pending ? '<span class="fb-postit-pending">⏳ sending…</span>' : '';
		const failedBadge = it._failed ? `<span class="fb-postit-failed" title="${escAttr(it._error || 'Save failed')}">⚠ failed</span>` : '';

		const comments = (it.comments || []).map(c => `
			<div class="fb-comment ${c.is_admin ? 'is-admin' : ''} ${c.is_resolve ? 'is-resolve' : ''} ${c._optimistic ? 'is-optimistic' : ''} ${c._error ? 'is-error' : ''}">
				<span class="fb-comment-author">${escHtml(c.handle || (c.is_admin ? 'admin' : 'anonymous'))}</span>
				<span class="fb-comment-time">${escHtml(relTime(c.created_at))}${c._optimistic ? ' · sending…' : ''}${c._error ? ' · failed' : ''}</span>
				<span class="fb-comment-body">${escHtml(c.body)}</span>
			</div>`).join('');

		return `
			<button class="fb-postit-close" aria-label="Close">×</button>
			<div class="fb-postit-head">
				<span class="fb-postit-cat">${escHtml(it.category || 'bug')}</span>
				<span>${escHtml(relTime(it.created_at))}</span>
				${ownBadge}
				${pendingBadge}
				${failedBadge}
				${stale ? '<span class="fb-postit-stale" title="The anchored text was edited away — this annotation is orphaned.">⚠ orphaned</span>' : ''}
			</div>
			${adminExtras}
			${context}
			${sug}
			<div class="fb-postit-body">${escHtml(it.body)}</div>
			<div class="fb-postit-meta">
				${it.git_commit ? '<span class="fb-meta-item">📌 ' + escHtml(it.git_commit.slice(0, 7)) + '</span>' : ''}
				${it.anchor.section ? '<span class="fb-meta-item">§ ' + escHtml(it.anchor.section.slice(0, 40)) + '</span>' : ''}
				<span class="fb-meta-item">· ${escHtml(it.anchor_type || 'text')}</span>
			</div>
			<div class="fb-postit-actions">
				<button class="fb-vote ${myUp ? 'is-mine' : ''}" data-vote="up" title="I see this too / agree (U)">▲ <span class="fb-vote-count">${it.upvotes || 0}</span></button>
				<button class="fb-vote ${myDown ? 'is-mine' : ''}" data-vote="down" title="I disagree / not helpful (D)">▼ <span class="fb-vote-count">${it.downvotes || 0}</span></button>
				${myAhaKey ? `<button class="fb-aha-btn ${myAha ? 'is-on' : ''}" data-aha="1" title="This passage was illuminating (A)">${myAha ? '★' : '☆'} illuminating</button>` : ''}
				${(it.is_own && !it.approved && it.status !== 'resolved' && it.status !== 'wontfix') ? '<button class="fb-edit-btn" data-edit="1" title="Edit your feedback (only while pending admin approval)">✏️ Edit</button>' : ''}
			</div>
			<div class="fb-comments">
				${comments || '<div class="fb-comment" style="opacity:0.6">No replies yet.</div>'}
				<form class="fb-reply-form">
					<input type="text" placeholder="Reply…" maxlength="2000" name="body">
					<button type="submit">Reply</button>
				</form>
			</div>`;
	}

	function positionPostit(el, anchor) {
		const rect = anchor.getBoundingClientRect();
		const pw = 340, ph = 380;
		const margin = 8;
		let top  = rect.top + window.scrollY;
		let left = rect.right + window.scrollX + margin;
		if (left + pw > window.scrollX + window.innerWidth - margin) {
			left = rect.left + window.scrollX - pw - margin;
		}
		if (left < margin) left = margin;
		if (top + ph > window.scrollY + window.innerHeight - margin) {
			top = window.scrollY + window.innerHeight - ph - margin;
		}
		if (top < margin) top = margin;
		el.style.top = top + 'px';
		el.style.left = left + 'px';
	}

	function bindPostitEvents(el, it) {
		el.querySelector('.fb-postit-close').addEventListener('click', () => closePostit(it.id));
		el.querySelectorAll('.fb-vote').forEach(b => {
			b.addEventListener('click', () => vote(it.id, b.dataset.vote, el));
		});
		const aha = el.querySelector('[data-aha]');
		if (aha) aha.addEventListener('click', () => toggleAha(it, aha));
		const editBtn = el.querySelector('[data-edit]');
		if (editBtn) editBtn.addEventListener('click', () => openEditForm(el, it));
		const form = el.querySelector('.fb-reply-form');
		form.addEventListener('submit', e => {
			e.preventDefault();
			const body = form.querySelector('input').value.trim();
			if (!body) return;
			submitReply(it.id, body, form, el);
		});
	}

	function openEditForm(postitEl, it) {
		// Replace the static body display with an inline editor.
		const bodyEl = postitEl.querySelector('.fb-postit-body');
		const originalHtml = bodyEl.innerHTML;
		const originalText = it.body || '';
		bodyEl.innerHTML = `
			<textarea class="fb-edit-textarea" maxlength="4000">${escHtml(originalText)}</textarea>
			<div class="fb-edit-actions">
				<button class="fb-edit-cancel">Cancel</button>
				<button class="fb-edit-save primary">Save</button>
			</div>`;
		const ta = bodyEl.querySelector('.fb-edit-textarea');
		ta.focus();
		ta.setSelectionRange(ta.value.length, ta.value.length);
		ta.addEventListener('keydown', e => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); bodyEl.querySelector('.fb-edit-save').click(); }
			if (e.key === 'Escape')                          { e.preventDefault(); bodyEl.querySelector('.fb-edit-cancel').click(); }
		});
		bodyEl.querySelector('.fb-edit-cancel').addEventListener('click', () => {
			bodyEl.innerHTML = originalHtml;
		});
		bodyEl.querySelector('.fb-edit-save').addEventListener('click', async () => {
			const newBody = ta.value.trim();
			if (!newBody) { flashToast('Body cannot be empty.', true); return; }
			const btn = bodyEl.querySelector('.fb-edit-save');
			btn.disabled = true;
			try {
				const j = await api('POST', '/edit.php', {
					id: it.id,
					body: newBody,
					challenge_token: state.challenge,
					honeypot: '',
				});
				it.body = newBody;
				bodyEl.innerHTML = escHtml(newBody);
				flashToast(j.toast || 'Updated.');
			} catch (e) {
				flashToast('Edit failed: ' + e.message, true);
				btn.disabled = false;
			}
		});
	}

	async function vote(fbId, dir, postitEl) {
		const prev = state.reactions.get(fbId);
		const next = prev === dir ? 'remove' : dir;
		const item = state.items.find(x => x.id === fbId);
		if (!item) {
			flashToast('Could not find that feedback item.', true);
			return;
		}
		if (item) {
			if (prev === dir) { if (dir === 'up') item.upvotes--; if (dir === 'down') item.downvotes--; state.reactions.delete(fbId); }
			else if (prev)   { if (prev === 'up') item.upvotes--; if (prev === 'down') item.downvotes--; item[dir + 'votes']++; state.reactions.set(fbId, dir); }
			else             { item[dir + 'votes']++; state.reactions.set(fbId, dir); }
		}
		updateVoteUI(postitEl, item);
		try {
			const j = await api('POST', '/react.php', {
				target_type: 'feedback', target_key: item.uuid,
				feedback_id: fbId, reaction: next,
			});
			item.upvotes   = j.upvotes;
			item.downvotes = j.downvotes;
			if (j.my_reaction) state.reactions.set(fbId, j.my_reaction); else state.reactions.delete(fbId);
			updateVoteUI(postitEl, item);
			if (j.toast) flashToast(j.toast);
		} catch (e) {
			flashToast('Vote failed: ' + e.message, true);
			fetchFeedback(true);
		}
	}

	function updateVoteUI(el, it) {
		const btns = el.querySelectorAll('.fb-vote');
		btns.forEach(b => {
			const isUp = b.dataset.vote === 'up';
			b.classList.toggle('is-mine', state.reactions.get(it.id) === b.dataset.vote);
			if ((isUp && (state.reactions.get(it.id) === 'up' || state.reactions.get(it.id) === 'down' && !b.classList.contains('is-mine'))) || (!isUp)) {
				const c = b.querySelector('.fb-vote-count');
				if (c) c.textContent = (isUp ? it.upvotes : it.downvotes) || 0;
			}
		});
	}

	async function toggleAha(it, btn) {
		const quote = it.anchor.quote || '';
		if (!quote) return;
		const key = LESSON + '|' + (it.anchor.prefix || '') + '|' + quote + '|' + (it.anchor.suffix || '');
		const on = state.ahaOnText.has(key);
		const next = on ? 'remove' : 'aha';
		if (on) state.ahaOnText.delete(key); else state.ahaOnText.add(key);
		btn.classList.toggle('is-on', !on);
		btn.textContent = !on ? '★ illuminating' : '☆ illuminating';
		try {
			const j = await api('POST', '/react.php', {
				target_type: 'text_aha', target_key: key, reaction: next,
				lesson_slug: LESSON,
				anchor_selector: it.anchor.selector,
				anchor_prefix:   it.anchor.prefix,
				anchor_quote:    quote,
				anchor_suffix:   it.anchor.suffix,
				body: (it.anchor.prefix || '') + ' [' + quote + '] ' + (it.anchor.suffix || ''),
			});
			if (j.toast) flashToast(j.toast);
			fetchFeedback(true);
		} catch (e) {
			flashToast('Could not register aha: ' + e.message, true);
		}
	}

	async function submitReply(fbId, body, form, postitEl) {
		form.querySelector('input').value = '';
		const it = state.items.find(x => x.id === fbId);
		const tempId = 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
		const optimistic = {
			id: tempId, body, handle: state.admin ? 'admin' : 'you',
			is_admin: !!state.admin, is_resolve: false, is_own: true,
			created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
			_optimistic: true,
		};
		if (it) {
			if (!it.comments) it.comments = [];
			it.comments.push(optimistic);
			openPostit(it, postitEl.previousSibling || postitEl);
		}
		try {
			const j = await api('POST', '/comment.php', {
				feedback_id: fbId, body,
				honeypot: '',
				challenge_token: state.challenge,
			});
			if (it) {
				const idx = it.comments.findIndex(c => c.id === tempId);
				if (idx >= 0) it.comments[idx] = {
					id: j.id, body: j.body, handle: j.handle || 'you',
					is_admin: !!j.is_admin, is_resolve: false, is_own: true,
					created_at: j.created_at,
				};
				it.reply_count = (it.reply_count || 0) + 1;
				openPostit(it, postitEl.previousSibling || postitEl);
			}
			flashToast(j.toast || 'Reply posted.');
		} catch (e) {
			if (it) {
				const idx = it.comments.findIndex(c => c.id === tempId);
				if (idx >= 0) {
					it.comments[idx]._error = e.message;
					openPostit(it, postitEl.previousSibling || postitEl);
				}
			}
			flashToast('Reply failed: ' + e.message, true);
		}
	}

	/* ─────────────────────────────────────────────────────────────────
	   Aha top side-panel
	   ───────────────────────────────────────────────────────────────── */
	function renderAdminBar() {
		let bar = $('#fb-admin-bar');
		if (!state.admin) {
			if (bar) bar.remove();
			return;
		}
		if (!bar) {
			bar = document.createElement('a');
			bar.id = 'fb-admin-bar';
			bar.href = (window.location.pathname.indexOf('/blog/') >= 0 ? '' : '/blog/') + 'api/feedback/admin/panel.php';
			bar.target = '_blank';
			bar.style.cssText = 'position:fixed;left:16px;top:80px;z-index:9999;padding:8px 14px;background:var(--mn-coral);color:white;border-radius:999px;font-size:12px;font-weight:700;text-decoration:none;box-shadow:0 3px 10px rgba(0,0,0,0.3);font-family:inherit;';
			bar.innerHTML = '🐛 Admin Panel →';
			document.body.appendChild(bar);
		}
	}

	/* ─────────────────────────────────────────────────────────────────
	   Popover — single-step composer (no mode chooser)
	   ───────────────────────────────────────────────────────────────── */
	function closeAllPopovers() {
		$$('.fb-popover').forEach(p => p.remove());
		state.pendingPopover = null;
	}

	function openComposerAt(x, y, anchor, mode) {
		closeAllPopovers();
		const pop = document.createElement('div');
		pop.className = 'fb-popover fb-popover-simple';
		const wideMode = mode === 'suggest';
		pop.style.left = clampX(x, wideMode ? 600 : 420) + 'px';
		pop.style.top  = clampY(y, 420) + 'px';

		const isText    = anchor && anchor.anchor_type === 'text' && anchor.anchor_quote;
		const isImage   = anchor && anchor.anchor_type === 'image';
		const isHeading = anchor && anchor.anchor_type === 'heading';
		const isCode    = anchor && anchor.anchor_type === 'code';
		const isSuggest = mode === 'suggest';

		// Build context block — auto-detected from anchor type
		let contextHtml = '';
		if (isSuggest && isText) {
			contextHtml = `
				<div class="fb-suggest-diff">
					<div class="fb-suggest-diff-side">
						<div class="fb-suggest-diff-label">Original</div>
						<div class="fb-suggest-diff-old">${escHtml(anchor.anchor_quote.slice(0, 400))}</div>
					</div>
					<div class="fb-suggest-diff-arrow">↓</div>
					<div class="fb-suggest-diff-side">
						<div class="fb-suggest-diff-label">Your replacement</div>
						<div class="fb-suggest-diff-new" id="fb-suggest-diff-preview"></div>
					</div>
				</div>`;
		} else if (isText) {
			contextHtml = `<div class="fb-quote">"${escHtml(anchor.anchor_quote.slice(0, 240))}"</div>`;
		} else if (isImage) {
			const imgSrc = anchor.anchor_image_src || '';
			const alt    = anchor.anchor_image_alt || '';
			const cap    = anchor.anchor_caption || '';
			contextHtml = `
				<div class="fb-context-image">
					${imgSrc ? `<img src="${escAttr(imgSrc)}" alt="">` : ''}
					<div class="fb-context-meta">
						<div class="fb-context-label">📷 image${alt ? ' · ' + escHtml(alt.slice(0, 60)) : ''}</div>
						${cap ? `<div class="fb-context-cap">${escHtml(cap.slice(0, 160))}</div>` : ''}
					</div>
				</div>`;
		} else if (isHeading) {
			contextHtml = `<div class="fb-quote">§ ${escHtml((anchor.anchor_quote || '').slice(0, 200))}</div>`;
		} else if (isCode) {
			contextHtml = `<pre class="fb-context-code">${escHtml((anchor.anchor_quote || '').slice(0, 240))}</pre>`;
		} else if (anchor && anchor.anchor_section) {
			contextHtml = `<div style="font-size:11px;color:var(--mn-text-secondary);margin-bottom:6px">§ ${escHtml(anchor.anchor_section.slice(0, 80))}</div>`;
		}

		const defaultCat = isSuggest ? 'typo' : (isText ? 'bug' : (isImage ? 'content' : 'bug'));
		const editorId = isSuggest ? 'fb-sug-new' : 'fb-body';

		const placeholder = isSuggest
			? 'Your replacement wording — Markdown + $LaTeX$ supported…'
			: isText
				? 'Your note — Markdown + $LaTeX$ supported…'
				: isImage
					? 'Issue with this image — Markdown + $LaTeX$ supported…'
					: 'Your note — Markdown + $LaTeX$ supported…';

		pop.innerHTML = `
			<button class="fb-popover-close" aria-label="Close">×</button>
			<h3>🐛 ${isSuggest ? 'Suggest replacement' : 'Annotate ' + (isText ? 'passage' : isImage ? 'image' : isHeading ? 'section' : isCode ? 'code' : 'here')}</h3>
			${contextHtml}
			<textarea id="${editorId}" class="fb-simple-textarea" placeholder="${escAttr(placeholder)}" maxlength="4000" autofocus>${isSuggest ? escHtml(anchor && anchor.anchor_quote ? anchor.anchor_quote : '') : ''}</textarea>
			<small class="fb-simple-help">Markdown + $LaTeX$ · <kbd>Ctrl+Enter</kbd> to send · <kbd>Esc</kbd> to close</small>
			<div class="fb-cat-pills" id="fb-cat-pills">
				${CATS.map(c => `<button type="button" data-cat="${c}" ${c === defaultCat ? 'class="is-selected"' : ''}>${c}</button>`).join('')}
			</div>
			<div class="fb-row">
				<input type="text" id="fb-handle" placeholder="Name (optional)" maxlength="60">
				<input type="email" id="fb-email" placeholder="Email (for reply)" maxlength="200">
			</div>
			<input type="text" class="fb-honeypot" name="honeypot" tabindex="-1" autocomplete="off" value="">
			<div class="fb-submit-row">
				<button class="secondary" id="fb-cancel" type="button">Cancel</button>
				<button id="fb-submit" type="button">Send <kbd>⏎</kbd></button>
			</div>
			<div class="fb-status" id="fb-status"></div>`;
		document.body.appendChild(pop);
		state.pendingPopover = pop;

		// Add a visual pointer to the centre of the selected text
		if (isText && anchor && anchor.anchor_quote) {
			showSelectionPointer(anchor);
		}

		bindComposerEvents(pop, anchor, isSuggest, editorId);

		const editor = pop.querySelector('#' + editorId);
		editor.focus();
		if (isSuggest) {
			// Place cursor at end for replacement mode
			editor.selectionStart = editor.selectionEnd = editor.value.length;
		}
	}

	function bindComposerEvents(pop, anchor, isSuggest, editorId) {
		pop.querySelector('.fb-popover-close').addEventListener('click', () => {
			hideSelectionPointer();
			closeAllPopovers();
		});
		pop.querySelector('#fb-cancel').addEventListener('click', () => {
			hideSelectionPointer();
			closeAllPopovers();
		});

		// Category pills
		const pills = pop.querySelector('#fb-cat-pills');
		pills.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
			pills.querySelectorAll('button').forEach(x => x.classList.remove('is-selected'));
			b.classList.add('is-selected');
		}));

		// Submit
		pop.querySelector('#fb-submit').addEventListener('click', () => {
			hideSelectionPointer();
			submitFeedback(anchor, pop);
		});

		// Keyboard
		const editor = pop.querySelector('#' + editorId);
		editor.addEventListener('keydown', e => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); pop.querySelector('#fb-submit').click(); }
			if (e.key === 'Escape') { e.preventDefault(); hideSelectionPointer(); closeAllPopovers(); }
		});
	}

	/* ── Virtual pointer: shows an arrow at the centre of the selected
	   text so the user can always see what they're annotating. */
	function showSelectionPointer(anchor) {
		hideSelectionPointer();
		if (!anchor || !anchor.anchor_quote) return;
		const el = document.createElement('div');
		el.className = 'fb-selection-pointer';
		el.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M5 12l7 7 7-7"/></svg>';
		el.title = 'You are annotating this';
		document.body.appendChild(el);
		state.selectionPointer = el;

		// Position it at the centre of the matched highlight span, or fall
		// back to the section / viewport coordinates stored in the anchor.
		const target = findAnchorCenterElement(anchor);
		if (target) {
			const rect = target.getBoundingClientRect();
			positionPointerAt(el, rect.left + rect.width / 2, rect.top + rect.height);
		} else if (anchor.viewport_x != null && anchor.viewport_y != null) {
			positionPointerAt(el, anchor.viewport_x, anchor.viewport_y);
		} else {
			el.style.display = 'none';
			return;
		}

		// Reposition on scroll/resize so the pointer stays glued to the text.
		state._pointerAnchor = anchor;
		state._pointerReposition = () => {
			if (!el.isConnected) return;
			const t = findAnchorCenterElement(anchor);
			if (t) {
				const r = t.getBoundingClientRect();
				positionPointerAt(el, r.left + r.width / 2, r.top + r.height);
			}
		};
		window.addEventListener('scroll', state._pointerReposition, { passive: true });
		window.addEventListener('resize', state._pointerReposition);
	}

	function findAnchorCenterElement(anchor) {
		// Try the stored CSS selector first
		try {
			if (anchor.selector) {
				const el = document.querySelector(anchor.selector);
				if (el) return el;
			}
		} catch (_) {}
		// Fall back to walking the page for a highlight with the same anchor data
		const spans = document.querySelectorAll('.fb-highlight[data-fb-id]');
		for (const s of spans) {
			if (anchor.anchor_quote && s.textContent.indexOf(anchor.anchor_quote.slice(0, 20)) >= 0) {
				return s;
			}
		}
		return null;
	}

	function positionPointerAt(el, clientX, clientY) {
		const x = clientX + window.scrollX - 9;  // centre the 18×18 arrow
		const y = clientY + window.scrollY + 6;
		el.style.left = x + 'px';
		el.style.top  = y + 'px';
	}

	function hideSelectionPointer() {
		if (state._pointerReposition) {
			window.removeEventListener('scroll', state._pointerReposition);
			window.removeEventListener('resize', state._pointerReposition);
			state._pointerReposition = null;
		}
		if (state.selectionPointer && state.selectionPointer.parentNode) {
			state.selectionPointer.remove();
		}
		state.selectionPointer = null;
	}

	function clampX(x, w) { return Math.max(8, Math.min(window.innerWidth - w - 8, x)); }
	function clampY(y, h) { return Math.max(80, Math.min(window.innerHeight - h - 8, y + window.scrollY)); }

	async function submitFeedback(anchor, pop) {
		const bodyEl    = pop.querySelector('#fb-body');
		const sugEl     = pop.querySelector('#fb-sug-new');
		const sugBox    = pop.querySelector('#fb-suggestion-box');
		const handleEl  = pop.querySelector('#fb-handle');
		const emailEl   = pop.querySelector('#fb-email');
		const catBtn    = pop.querySelector('#fb-cat-pills .is-selected');
		const statusEl  = pop.querySelector('#fb-status');

		const isSuggestion = sugBox && !sugBox.hidden && sugEl && sugEl.value.trim();
		const body = bodyEl.value.trim();

		if (isSuggestion && !sugEl.value.trim()) {
			statusEl.textContent = 'Type the suggested replacement first.';
			statusEl.className = 'fb-status is-error';
			sugEl.focus();
			return;
		}
		if (!body && !isSuggestion) {
			statusEl.textContent = 'Type a note first.';
			statusEl.className = 'fb-status is-error';
			bodyEl.focus();
			return;
		}

		const cat = catBtn ? catBtn.dataset.cat : 'bug';
		const submitBtn = pop.querySelector('#fb-submit');
		submitBtn.disabled = true;
		statusEl.textContent = 'Sending…';
		statusEl.className = 'fb-status';

		const data = Object.assign({
			lesson_slug: LESSON,
			body,
			category: cat,
			author_handle: handleEl.value.trim(),
			author_email:  emailEl.value.trim(),
			honeypot: pop.querySelector('.fb-honeypot').value,
			challenge_token: state.challenge,
			page_url: location.href,
			viewport: window.innerWidth + 'x' + window.innerHeight,
			git_commit: state.git ? state.git.commit : '',
		}, anchor || {});

		if (isSuggestion) {
			data.anchor_type = 'suggestion';
			data.suggestion_original = (anchor && anchor.anchor_quote) || '';
			data.suggestion_replacement = sugEl.value.trim();
		} else if (anchor) {
			data.anchor_type = anchor.anchor_type || 'general';
		}

		const tempUuid = 'tmp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
		const optimistic = {
			id: -Date.now(),
			uuid: tempUuid,
			lesson: LESSON,
			category: cat,
			anchor_type: data.anchor_type || 'general',
			body,
			suggestion_original:    data.suggestion_original || null,
			suggestion_replacement: data.suggestion_replacement || null,
			author_handle: handleEl.value.trim() || null,
			author_email:  emailEl.value.trim() || null,
			visitor_id:    state.visitorId,
			status: 'open',
			approved: false,
			is_own: true,
			upvotes: 0, downvotes: 0, aha_count: 0, reply_count: 0,
			created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
			git_commit: data.git_commit || null,
			anchor: {
				selector: data.anchor_selector || null,
				quote: data.anchor_quote || null,
				prefix: data.anchor_prefix || null,
				suffix: data.anchor_suffix || null,
				offset: data.anchor_offset ?? null,
				offset_end: data.anchor_offset_end ?? null,
				section: data.anchor_section || null,
				section_id: data.anchor_section_id || null,
				chunks: data.anchor_chunks || null,
				section_title: data.anchor_section_title || null,
				text_hash: data.anchor_text_hash || null,
				image_src: data.anchor_image_src || null,
				image_alt: data.anchor_image_alt || null,
				caption: data.anchor_caption || null,
				viewport_x: data.anchor_viewport_x ?? null,
				viewport_y: data.anchor_viewport_y ?? null,
				status: 'fresh', confidence: 1.0,
			},
			comments: [],
			my_reaction: null,
			_pending: true,
		};

		if (state.mode) {
			state.items.unshift(optimistic);
			state.optimistic.set(tempUuid, optimistic);
			renderAll();
			flashToast('⏳ Saving your feedback…');
			setTimeout(closeAllPopovers, 600);
		}

		try {
			const j = await api('POST', '/submit.php', data);
			const idx = state.items.findIndex(x => x.uuid === tempUuid);
			if (idx >= 0) {
				state.items[idx] = Object.assign({}, state.items[idx], {
					id: j.id,
					uuid: j.uuid,
					approved: j.approved,
					_pending: false,
					_submitted: true,
					created_at: j.created_at || state.items[idx].created_at,
				});
			}
			state.optimistic.delete(tempUuid);
			renderAll();
			flashToast(j.toast || 'Feedback sent — awaiting admin approval.');
		} catch (e) {
			const idx = state.items.findIndex(x => x.uuid === tempUuid);
			if (idx >= 0) {
				state.items[idx]._error = e.message;
				state.items[idx]._pending = false;
				state.items[idx]._failed = true;
			}
			renderAll();
			flashToast('Could not save feedback: ' + e.message, true);
			submitBtn.disabled = false;
		}
	}

	/* ─────────────────────────────────────────────────────────────────
	   Event wiring (selection, click, keyboard)
	   ───────────────────────────────────────────────────────────────── */
	function onMouseUpInBugMode(e) {
		if (!state.mode) return;
		if (e.target.closest('.fb-popover, .fb-postit, .fb-marker, .fb-general-marker, #fb-toggle, #fb-admin-bar, .fb-inline-btn, .fb-end-callout, .fb-selection-toolbar')) return;
		const sel = window.getSelection();
		if (!sel || sel.isCollapsed || sel.toString().trim().length < 2) return;
		const anchor = captureAnchorFromSelection();
		if (!anchor) return;
		// Open the composer directly — no extra "Annotate" click required.
		// The textarea is auto-focused so the user can just start typing.
		const r = sel.getRangeAt(0).getBoundingClientRect();
		openComposerAt(r.left + window.scrollX, r.bottom + window.scrollY + 8, anchor, 'annotate');
	}

	async function registerAhaDirectly(anchor) {
		const quote = anchor.anchor_quote || '';
		if (!quote) { flashToast('No text selected.', true); return; }
		const key = LESSON + '|' + (anchor.anchor_prefix || '') + '|' + quote + '|' + (anchor.anchor_suffix || '');
		if (state.ahaOnText.has(key)) {
			state.ahaOnText.delete(key);
			flashToast('Aha removed.');
		} else {
			state.ahaOnText.add(key);
			flashToast('★ Marked as illuminating');
		}
		try {
			await api('POST', '/react.php', {
				target_type: 'text_aha', target_key: key,
				reaction: state.ahaOnText.has(key) ? 'aha' : 'remove',
				lesson_slug: LESSON,
				anchor_selector: anchor.anchor_selector,
				anchor_prefix:   anchor.anchor_prefix,
				anchor_quote:    quote,
				anchor_suffix:   anchor.anchor_suffix,
				body: (anchor.anchor_prefix || '') + ' [' + quote + '] ' + (anchor.anchor_suffix || ''),
			});
			fetchFeedback(true);
		} catch (e) {
			flashToast('Could not register aha: ' + e.message, true);
		}
	}

	function onClickInBugMode(e) {
		if (!state.mode) return;
		if (e.target.closest('.fb-popover, .fb-postit, .fb-marker, .fb-general-marker, #fb-toggle, #fb-admin-bar, .fb-inline-btn, .fb-end-callout')) return;
		const sel = window.getSelection();
		if (sel && !sel.isCollapsed) return;
		const target = e.target;
		const anchor = captureAnchorFromElement(target);
		openComposerAt(e.clientX, e.clientY + 14, anchor);
	}

	function onKeyDown(e) {
		if (e.ctrlKey || e.metaKey || e.altKey) return;
		const t = e.target;
		if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
		if (e.key === 'b' || e.key === 'B') { e.preventDefault(); toggleMode(); }
		if (e.key === 'Escape' && state.mode) { setMode(false); }
		// Keyboard shortcuts when a post-it is open: U = up-vote,
		// D = down-vote, A = toggle aha. Acts on the most recently
		// expanded post-it.
		if (state.expanded && state.expanded.size) {
			const lastId = [...state.expanded].pop();
			const it = state.items.find(x => x.id === lastId);
			if (it) {
				if (e.key === 'u' || e.key === 'U') { e.preventDefault(); vote(it.id, 'up'); }
				else if (e.key === 'd' || e.key === 'D') { e.preventDefault(); vote(it.id, 'down'); }
				else if (e.key === 'a' || e.key === 'A') {
					const k = it.anchor.quote ? (LESSON + '|' + (it.anchor.prefix || '') + '|' + it.anchor.quote + '|' + (it.anchor.suffix || '')) : '';
					if (k) { e.preventDefault(); toggleAha(it, k); }
				}
				else if (e.key === 'x' || e.key === 'X') { e.preventDefault(); closePostit(lastId); }
			}
		}
	}

	function mountNudgeDismiss() {
		if (localStorage.getItem('fb_nudge_dismissed')) return;
		const btn = $('#fb-toggle');
		if (!btn) return;
		btn.classList.add('fb-nudge');
		const off = () => { btn.classList.remove('fb-nudge'); localStorage.setItem('fb_nudge_dismissed', '1'); };
		btn.addEventListener('click', off, { once: true });
		setTimeout(off, 30000);
	}

	function flashToast(msg, isError, kind) {
		const t = document.createElement('div');
		t.className = 'fb-toast';
		const type = kind || (isError ? 'error' : 'success');
		if (type === 'error')   t.dataset.kind = 'error';
		if (type === 'info')    t.dataset.kind = 'info';
		if (type === 'warning') t.dataset.kind = 'warning';
		t.textContent = msg;
		document.body.appendChild(t);
		requestAnimationFrame(() => t.classList.add('is-visible'));
		const ttl = type === 'error' ? 4500 : 2400;
		setTimeout(() => { t.classList.remove('is-visible'); setTimeout(() => t.remove(), 250); }, ttl);
	}

	/* ─────────────────────────────────────────────────────────────────
	   Boot
	   ───────────────────────────────────────────────────────────────── */
	function bindButton() {
		const btn = $('#fb-toggle');
		if (!btn) return;
		btn.addEventListener('click', () => {
			if (btn.dataset.adminLink) return;
			toggleMode();
		});
	}

	function init() {
		bindButton();
		bindInlineButtons();
		document.addEventListener('mouseup', onMouseUpInBugMode);
		document.addEventListener('click', onClickInBugMode);
		document.addEventListener('keydown', onKeyDown);
		window.addEventListener('resize', () => {
			$$('.fb-postit').forEach(el => {
				const id = +el.dataset.id;
				const m = $(`.fb-marker[data-id="${id}"], .fb-general-marker[data-id="${id}"]`);
				if (m) positionPostit(el, m);
			});
		});
		window.addEventListener('error', e => {
			console.error('[BlogFeedback] Uncaught:', e.error || e.message);
			flashToast('Something went wrong in the page: ' + (e.message || 'unknown error'), true, 'error');
		});
		window.addEventListener('unhandledrejection', e => {
			console.error('[BlogFeedback] Unhandled rejection:', e.reason);
			const msg = (e.reason && e.reason.message) || String(e.reason);
			flashToast('Async error: ' + msg, true, 'error');
		});
		// Defer admin auto-load until after DOMContentLoaded completes and
		// marked.js has finished rendering markdown (so anchors can find text).
		const startAdminLoad = () => autoLoadForAdmin();
		if (document.readyState === 'complete') startAdminLoad();
		else window.addEventListener('load', startAdminLoad, { once: true });
	}

	function bindInlineButtons() {
		$$('.fb-inline-btn').forEach(b => {
			b.addEventListener('click', e => {
				e.preventDefault();
				setMode(true);
			});
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	window.BlogFeedback = {
		_ready: true,
		setMode, toggleMode,
		fetchFeedback,
		open: () => setMode(true),
		close: () => setMode(false),
	};
})();
