/* ════════════════════════════════════════════════════════════════════
   BlogSidenotes — Tufte-style margin annotations + sticky figures.

   ── Authoring ──────────────────────────────────────────────────────
   Two new commands are recognised inside any .md block:

       \sidenote{ … }              — a textual margin annotation,
                                      anchored to the marker's
                                      position in the text. Content
                                      supports the full main-column
                                      pipeline: LaTeX, markdown,
                                      images, HTML, \cite{}, etc.

       \sideimage{URL}{CAPTION}    — a sticky right-margin figure.
                                      Falls back to a normal inline
                                      <figure> when the viewport is
                                      too narrow to fit a margin
                                      column.

   Both commands' arguments are brace-balanced and honour `\{` / `\}`
   as literal characters. Nested braces (from \cite{…}, \citetitle{…},
   etc.) balance correctly.

   ── Pipeline ──────────────────────────────────────────────────────
   extract()         preprocess  — runs BEFORE  bibtexify/renderMarkdown
   finalize()        postprocess — runs AFTER   bibtexify/renderMarkdown
   layout()          positions sidenotes; toggles sideimage visibility

   Citations inside sidenotes / sideimages work: extract() stashes the
   raw argument inside a hidden .sidenote-source.md (or
   .sideimage-source.md) container so the regular bibtexify +
   renderMarkdown passes pick them up alongside the main text.
   finalize() copies the rendered HTML into the actual elements.

   ── Visibility rules ──────────────────────────────────────────────
   Sidenotes ONLY appear when their marker is currently in the
   viewport (tracked by IntersectionObserver) AND the marker itself
   is rendered (i.e. its parent isn't inside a collapsed optional
   block). This was the fix for the complaint that the Cajal
   sidenote was clinging to the top of the page while the Cajal
   paragraph was tucked away in a collapsed block.

   Sideimages follow the same rule, plus a viewport test.

   ── Guard rails ───────────────────────────────────────────────────
   Every code path is guarded; the worst that can happen on a
   malformed sidenote or sideimage is a console.error and a safe
   fallback. See `guardRailCount` below for the running count of
   specific defensive checks (currently > 30).
   ════════════════════════════════════════════════════════════════════ */
(function () {
	'use strict';

	if (window.BlogSidenotes && window.BlogSidenotes.__installed) {
		console.warn('[BlogSidenotes] already installed — skipping re-init.');
		return;
	}

	const API = {};
	let store = { notes: [], images: [] };
	const BREAKPOINT    = 1280;   /* px — matches style.css @media (ANGLE 19) */
	const VERTICAL_GAP  = 12;
	const MAX_Y         = 200000; /* sanity cap for absolute top    */
	const MAX_NOTES     = 100;    /* performance warning threshold  */
	const MAX_IMAGES    = 30;
	/* ANGLE 36 (sideimage wrap): when the right margin is too narrow to
	   hold the rail clear of the text, the rail's left edge digs into the
	   article. We then move the margin figures into the article flow as
	   right floats so the prose bends around them. These two constants are
	   the hysteresis band (in px of measured rail↔text overlap) that keeps
	   the margin/wrap decision from flip-flopping while the user resizes
	   the window across the boundary:
	     • enter wrap  only once the rail intrudes ≥ WRAP_ENTER px
	     • leave wrap  only once the rail is clear by ≥ WRAP_EXIT px       */
	const WRAP_ENTER    = 2;      /* px — intrusion needed to ENTER wrap mode */
	const WRAP_EXIT     = 2;      /* px — clearance needed to LEAVE  wrap mode */
	const WRAP_MIN_W    = 180;    /* px — never make a wrap figure narrower  */
	const WRAP_MAX_W    = 560;    /* px — never make a wrap figure wider     */

	let layoutRaf      = 0;
	let layoutFailsafe = 0;       /* consecutive layout failures    */
	let relayoutObserver = null;
	let ioObserver       = null;  /* IntersectionObserver           */
	let visibilityMap  = {};      /* { id: boolean } — markers currently in viewport */
	/* ANGLE 36: hysteresis state — true while the margin sideimages are
	   currently living in the article flow as floats (wrap mode) rather
	   than absolutely positioned in the rail. Reset on every extract(). */
	let sideimageWrapActive = false;

	/* GUARD RAIL G2: warning-suppression set.
	   Some warnings (NOTABLY "DETACHED") can fire during transient states
	   where the marker is briefly out of the DOM — e.g. while marked.js
	   reruns and replaces the container's innerHTML. These warnings are
	   noisy but harmless. To keep the console clean, we log each unique
	   warning AT MOST ONCE per marker id. */
	const alreadyWarned = new Set();

	/* ═════════════════════════════════════════════════════════════════
	   DIAGNOSTICS — every error goes through here so we get one
	   consistent `[BlogSidenotes]` prefix and never crash the page
	   because console.error is missing or sandboxed.
	   ═════════════════════════════════════════════════════════════════ */
	function logError(code, msg, extra) {
		try {
			const prefix = '[BlogSidenotes:' + code + '] ';
			if (extra !== undefined) console.error(prefix + msg, extra);
			else                      console.error(prefix + msg);
		} catch (_) { /* sandboxed iframe with no console */ }
	}
	function logWarn(code, msg, extra) {
		try {
			const key = code + ':' + (msg ? msg.substring(0, 60) : '');
			if (alreadyWarned.has(key)) return;
			alreadyWarned.add(key);
			const prefix = '[BlogSidenotes:' + code + '] ';
			if (extra !== undefined) console.warn(prefix + msg, extra);
			else                      console.warn(prefix + msg);
		} catch (_) {}
	}
	/* logError stays noisy — errors must always be visible. */
	function logInfo(msg) {
		try { console.info('[BlogSidenotes] ' + msg); } catch (_) {}
	}

	/* ═════════════════════════════════════════════════════════════════
	   Util — attribute escaping, plain-text extraction.
	   ═════════════════════════════════════════════════════════════════ */
	function _escapeAttr(s) {
		return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
		                 .replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
	function _plainText(html) {
		const tmp = document.createElement('div');
		tmp.innerHTML = html || '';
		return (tmp.textContent || '').trim().slice(0, 200);
	}

	/* ANGLE 29: sanitize SVG in caption HTML. Inkscape-authored
	   SVGs carry a lot of editor metadata (sodipodi:namedview,
	   inkscape:* attributes, <metadata> blocks) which is invisible
	   when the SVG is parsed as SVG — but some browser / pipeline
	   interactions surface this metadata as visible text inside
	   figcaptions (the Antikythera caption was the worst offender:
	   a wall of `<sodipodi:namedview pagecolor="#ffffff" ...>`
	   appearing as plain text right between the alternativetitle
	   and the caption prose).

	   We replace every <svg> with a Unicode arrow character
	   (↗). This is bulletproof: no parser can ever surface
	   invisible SVG metadata as visible text, because there is no
	   SVG anymore. The external-link icon stays visually distinct
	   (different from the citation link text) without requiring
	   a fragile SVG path.                                          */
	function _sanitizeSvgMetadata(html) {
		try {
			const tmp = document.createElement('div');
			tmp.innerHTML = html || '';
			const svgs = tmp.querySelectorAll('svg');
			svgs.forEach(function (svg) {
				const arrow = document.createElement('span');
				arrow.className = 'external-link-arrow';
				arrow.textContent = '↗';
				arrow.setAttribute('aria-hidden', 'true');
				if (svg.parentNode) {
					svg.parentNode.replaceChild(arrow, svg);
				}
			});
			/* Also drop top-level <metadata> blocks (outside SVGs). */
			const topMeta = tmp.querySelectorAll(':scope > metadata');
			topMeta.forEach(function (el) {
				if (el.parentNode) el.parentNode.removeChild(el);
			});
			return tmp.innerHTML;
		} catch (err) {
			logWarn('SVG_SANITIZE_FAIL',
				'_sanitizeSvgMetadata() failed: ' + err.message +
				' — returning original HTML.');
			return html;
		}
	}

	/* Guard #1: every function that touches the DOM checks `document`
	   first so we never crash on early script execution. */
	function _domReady() {
		return typeof document !== 'undefined' &&
		       document.body !== null &&
		       document.body !== undefined;
	}

	/* ═════════════════════════════════════════════════════════════════
	   Brace-balanced scanner (shared).
	   Honours `\{` / `\}` / `\\` / `\$` etc. as literal characters.
	   Guard #2: caps the scan at MAX_Y characters so a malicious or
	   truncated document doesn't cause an infinite loop.
	   ═════════════════════════════════════════════════════════════════ */
	function readBalanced(text, start) {
		if (typeof text !== 'string' || start < 0 || start >= text.length) {
			return { end: -1, content: null };
		}
		let depth = 1;
		let j = start;
		let steps = 0;
		const LIMIT = 50000;
		while (j < text.length && depth > 0) {
			steps++;
			if (steps > LIMIT) {
				logWarn('SCAN_LIMIT', 'Balanced-brace scan exceeded 50000 steps — aborting.');
				return { end: -1, content: null };
			}
			const c = text[j];
			if (c === '\\') { j += 2; continue; }
			if (c === '{') depth++;
			else if (c === '}') {
				depth--;
				if (depth === 0) break;
			}
			j++;
		}
		if (depth !== 0) return { end: -1, content: null };
		return { end: j + 1, content: text.substring(start, j) };
	}

	/* ═════════════════════════════════════════════════════════════════
	   \sidenote{ … } extraction
	   ═════════════════════════════════════════════════════════════════ */
	function extractSidenoteDirectives(text, startId) {
		const TAG = '\\sidenote{';
		const result = { processed: '', contents: [] };
		let cursor = 0;
		let nextId = (typeof startId === 'number' && startId >= 1) ? startId : 1;
		while (cursor < text.length) {
			const hit = text.indexOf(TAG, cursor);
			if (hit === -1) {
				result.processed += text.substring(cursor);
				break;
			}
			result.processed += text.substring(cursor, hit);
			const innerStart = hit + TAG.length;
			const got = readBalanced(text, innerStart);
			if (got.end === -1) {
				logError('UNMATCHED_BRACE',
					'\\sidenote{ at offset ' + hit +
					' has no matching closing brace — rendering the directive as plain text. ' +
					'Excerpt: "' + text.substring(hit, Math.min(text.length, hit + 60)) + '…"');
				result.processed += text.substring(hit, innerStart);
				cursor = innerStart;
				continue;
			}
			const content = got.content.trim();
			if (!content.length) {
				logWarn('EMPTY_SIDENOTE', '\\sidenote{} at offset ' + hit + ' is empty — skipping.');
				cursor = got.end;
				continue;
			}
			const id = nextId++;
			result.contents.push({ id: id, raw: content });
			result.processed +=
				'<sup class="sidenote-marker" data-sn-id="' + id + '">' +
					'<a id="snref-' + id + '" class="sidenote-ref" href="#sn-' + id + '">' +
						id +
					'</a>' +
				'</sup>';
			cursor = got.end;
		}
		return result;
	}

	/* ═════════════════════════════════════════════════════════════════
	   \sideimage{URL}{CAPTION}  — INLINE figure (in the body text).
	   Default mode: a block, centered figure that flows with the text.
	   Optional [mode] parameter:
	     \sideimage[float]{URL}{CAPTION}  — float:right, wider, the
	                                        article text wraps around
	                                        it on the left. Best for
	                                        figures the user wants to
	                                        read while the rest of the
	                                        article continues.
	   Use \marginfig for figures that should live in the right margin
	   without participating in the article flow.
	   ═════════════════════════════════════════════════════════════════ */
	function extractSideimageDirectives(text, startId) {
		const TAG = '\\sideimage';
		const result = { processed: '', entries: [] };
		let cursor = 0;
		let nextId = (typeof startId === 'number' && startId >= 1) ? startId : 1;
		while (cursor < text.length) {
			const hit = text.indexOf(TAG, cursor);
			if (hit === -1) {
				result.processed += text.substring(cursor);
				break;
			}
			result.processed += text.substring(cursor, hit);
			let mode = 'inline';
			let p = hit + TAG.length;
			if (text[p] === '[') {
				const optEnd = text.indexOf(']', p);
				if (optEnd === -1) {
					logError('UNMATCHED_OPTION_BRACE',
						'\\sideimage[ at offset ' + hit + ' has no matching `]`. ' +
						'Falling back to default mode.');
				} else {
					mode = text.substring(p + 1, optEnd).trim().toLowerCase();
					if (mode !== 'float' && mode !== 'inline') {
						logWarn('UNKNOWN_SIDEIMAGE_MODE',
							'\\sideimage[' + mode + '] is not recognised — use ' +
							'inline or float. Falling back to inline.');
						mode = 'inline';
					}
					p = optEnd + 1;
				}
			}
			if (text[p] !== '{') {
				logError('MISSING_URL_BRACE',
					'\\sideimage requires `{URL}` immediately after the tag (offset ' + hit + '). ' +
					'Found `' + text[p] + '` instead — skipping this directive.');
				cursor = hit + TAG.length + 1;
				continue;
			}
			p++;
			const first = readBalanced(text, p);
			if (first.end === -1) {
				logError('UNMATCHED_URL_BRACE',
					'\\sideimage{ at offset ' + hit + ' has no matching `}` for the URL — ' +
					'rendering as plain text.');
				result.processed += text.substring(hit, p);
				cursor = p;
				continue;
			}
			const url = first.content.trim();
			if (!url.length) {
				logWarn('EMPTY_URL', '\\sideimage{} at offset ' + hit + ' has an empty URL — skipping.');
				cursor = first.end;
				continue;
			}
			let q = first.end;
			while (q < text.length && /\s/.test(text[q])) q++;
			if (text[q] !== '{') {
				logError('MISSING_CAPTION_BRACE',
					'\\sideimage{URL} requires a second `{caption}` brace group (offset ' + hit + '). ' +
					'Found `' + text[q] + '` instead — skipping this directive.');
				cursor = first.end;
				continue;
			}
			q++;
			const second = readBalanced(text, q);
			if (second.end === -1) {
				logError('UNMATCHED_CAPTION_BRACE',
					'\\sideimage{URL}{ at offset ' + hit + ' has no matching `}` for the caption — ' +
					'rendering as plain text.');
				cursor = first.end;
				continue;
			}
			const caption = second.content.trim();
			const id = nextId++;
			result.entries.push({ id: id, url: url, caption: caption, mode: mode });
			result.processed +=
				'<span class="sideimage-marker sideimage-mode-' + mode + '" ' +
				'data-si-id="' + id + '" id="siref-' + id + '"></span>';
			cursor = second.end;
		}
		return result;
	}

	/* ═════════════════════════════════════════════════════════════════
	   \marginfig{URL}{CAPTION}  — STICKY right-margin figure (Tufte).
	   Use this when you want a figure that lives in the right
	   margin, sticks to the viewport while its paragraph is on
	   screen, and disappears when you scroll past. Per-image
	   opt-in — only the ones you mark with \marginfig go in the
	   rail; everything else stays inline.
	   ═════════════════════════════════════════════════════════════════ */
	function extractMarginfigDirectives(text, startId) {
		const TAG = '\\marginfig';
		const result = { processed: '', entries: [] };
		let cursor = 0;
		let nextId = (typeof startId === 'number' && startId >= 1) ? startId : 1;
		while (cursor < text.length) {
			const hit = text.indexOf(TAG, cursor);
			if (hit === -1) {
				result.processed += text.substring(cursor);
				break;
			}
			result.processed += text.substring(cursor, hit);
			/* ANGLE 25: optional [size] parameter, where size is
			   "wide" or "full". Default is normal rail width.
			     \marginfig{URL}{CAPTION}        → normal
			     \marginfig[wide]{URL}{CAPTION}  → wider (good for
			                                        newspaper articles,
			                                        dense diagrams)
			     \marginfig[full]{URL}{CAPTION}  → nearly full viewport
			                                        width (for very tall
			                                        things you want to
			                                        read carefully)        */
			let size = 'normal';
			let p = hit + TAG.length;
			if (text[p] === '[') {
				const optEnd = text.indexOf(']', p);
				if (optEnd === -1) {
					logError('UNMATCHED_OPTION_BRACE',
						'\\marginfig[ at offset ' + hit + ' has no matching `]`. ' +
						'Rendering with default size.');
				} else {
					size = text.substring(p + 1, optEnd).trim().toLowerCase();
					if (size !== 'wide' && size !== 'full' && size !== 'normal') {
						logWarn('UNKNOWN_SIZE',
							'\\marginfig[' + size + '] is not recognised — use ' +
							'normal, wide, or full. Falling back to normal.');
						size = 'normal';
					}
					p = optEnd + 1;
				}
			}
			if (text[p] !== '{') {
				logError('MISSING_URL_BRACE',
					'\\marginfig requires `{URL}` immediately after the tag (offset ' + hit + '). ' +
					'Found `' + text[p] + '` instead — skipping this directive.');
				cursor = hit + TAG.length + 1;
				continue;
			}
			p++;
			const first = readBalanced(text, p);
			if (first.end === -1) {
				logError('UNMATCHED_URL_BRACE',
					'\\marginfig{ at offset ' + hit + ' has no matching `}` for the URL — rendering as plain text.');
				result.processed += text.substring(hit, p);
				cursor = p;
				continue;
			}
			const url = first.content.trim();
			if (!url.length) {
				logWarn('EMPTY_URL', '\\marginfig{} at offset ' + hit + ' has an empty URL — skipping.');
				cursor = first.end;
				continue;
			}
			let q = first.end;
			while (q < text.length && /\s/.test(text[q])) q++;
			if (text[q] !== '{') {
				logError('MISSING_CAPTION_BRACE',
					'\\marginfig{URL} requires a second `{caption}` brace group (offset ' + hit + '). ' +
					'Found `' + text[q] + '` instead — skipping this directive.');
				cursor = first.end;
				continue;
			}
			q++;
			const second = readBalanced(text, q);
			if (second.end === -1) {
				logError('UNMATCHED_CAPTION_BRACE',
					'\\marginfig{URL}{ at offset ' + hit + ' has no matching `}` for the caption — ' +
					'rendering as plain text.');
				cursor = first.end;
				continue;
			}
			const caption = second.content.trim();
			const id = nextId++;
			result.entries.push({ id: id, url: url, caption: caption, mode: 'margin', size: size });
			result.processed +=
				'<span class="sideimage-marker sideimage-mode-margin sideimage-size-' + size +
				'" data-si-id="' + id + '" id="siref-' + id + '"></span>';
			cursor = second.end;
		}
		return result;
	}

	/* ═════════════════════════════════════════════════════════════════
	   extract()
	   ═════════════════════════════════════════════════════════════════ */
	function extract() {
		store = { notes: [], images: [] };
		visibilityMap = {};
		sideimageWrapActive = false;   /* ANGLE 36: fresh run → start in margin mode */

		if (!_domReady()) {
			logError('NO_DOM', 'extract() ran before document.body existed — aborting.');
			return { notes: 0, images: 0 };
		}

		const main = document.getElementById('contents');
		if (!main) {
			logError('NO_CONTENTS',
				'#contents not found — sidenotes cannot be placed. ' +
				'Did you forget to include the article shell?');
			return { notes: 0, images: 0 };
		}

		const containers = Array.from(
			document.querySelectorAll(
				'#contents .md:not(.sidenote-source):not(.sideimage-source)'
			)
		).filter(function (el) {
			/* Guard #4: skip .md elements nested inside another .md. */
			let p = el.parentElement;
			while (p) {
				if (p.classList && p.classList.contains('md')) return false;
				p = p.parentElement;
			}
			return true;
		});

		if (containers.length === 0) {
			logWarn('NO_MD_CONTAINERS',
				'No .md containers found in #contents — nothing to extract.');
			return { notes: 0, images: 0 };
		}

		/* Diagnostic: detect if marked.js has already processed the
		   containers BEFORE extract() ran. If it has, our `\sidenote{…}`
		   directive may have been partially consumed. */
		let alreadyMarked = 0;
		containers.forEach(function (c) {
			try {
				const h = c.innerHTML;
				if (h && (h.indexOf('<em>') >= 0 || h.indexOf('<strong>') >= 0)) {
					alreadyMarked++;
				}
			} catch (_) {}
		});
		if (alreadyMarked > 0) {
			logWarn('ALREADY_MARKED',
				alreadyMarked + ' of ' + containers.length +
				' .md containers ALREADY contain rendered markdown tags (<em>/<strong>) ' +
				'BEFORE extract() ran. This means renderMarkdown() ran earlier (likely ' +
				'from init.js\'s window.onload, which fires BEFORE our addEventListener ' +
				'handler on some browsers). We will still try to extract \sidenote{…} ' +
				'from the rendered HTML — but if marked.js stripped the directive, the ' +
				'corresponding sidenote will be missing.');
		}

		let nNotes  = 0;
		let nImages = 0;

		containers.forEach(function (container, ci) {
			let html;
			try {
				html = container.innerHTML;
			} catch (err) {
				logError('READ_FAIL',
					'Could not read innerHTML of .md container #' + ci + ' — skipping. ' + err.message);
				return;
			}
			if (typeof html !== 'string') {
				logWarn('READ_NON_STRING',
					'.md container #' + ci + ' innerHTML is not a string (' + typeof html + ') — skipping.');
				return;
			}

			const imgs = extractSideimageDirectives(html, nImages + 1);
			if (imgs.entries.length) html = imgs.processed;

			/* \marginfig — Tufte-style right-margin sticky figure. */
			const mfigs = extractMarginfigDirectives(html, nImages + imgs.entries.length + 1);
			if (mfigs.entries.length) html = mfigs.processed;

			/* IMPORTANT: pass the global sidenote counter as startId so
			   the marker IDs in the processed HTML match the IDs the
			   caller will use when registering them. The previous bug
			   was that extractSidenoteDirectives used its own local
			   counter starting at 1, so the Cajal container (processed
			   second) ended up with marker #1 instead of marker #2. */
			const notes = extractSidenoteDirectives(html, nNotes + 1);
			if (notes.contents.length) html = notes.processed;

			if (!imgs.entries.length && !mfigs.entries.length && !notes.contents.length) return;

			/* Guard #5: don't exceed the performance threshold. */
			if (nNotes + notes.contents.length > MAX_NOTES) {
				logWarn('TOO_MANY_NOTES',
					'Page would have more than ' + MAX_NOTES + ' sidenotes — ' +
					'skipping the rest. Layout performance degrades past this count.');
				return;
			}
			if (nImages + imgs.entries.length + mfigs.entries.length > MAX_IMAGES) {
				logWarn('TOO_MANY_IMAGES',
					'Page would have more than ' + MAX_IMAGES + ' sideimages — skipping the rest.');
				return;
			}

			try {
				container.innerHTML = html;
			} catch (err) {
				logError('WRITE_FAIL',
					'Could not write back to .md container #' + ci + '. Sidenotes in this block are not extracted. ' + err.message);
				return;
			}

			const allImages = imgs.entries.concat(mfigs.entries);
			allImages.forEach(function (entry, idx) {
				const id = entry.id;
				const src = document.createElement('div');
				src.className = 'md sideimage-source sideimage-mode-' + entry.mode;
				src.id = 'si-src-' + id;
				src.setAttribute('data-si-id', String(id));
				src.setAttribute('data-si-mode', entry.mode);
				src.innerHTML =
					'<div class="sideimage-source-inner">' +
						'<img src="' + _escapeAttr(entry.url) + '" alt="">' +
						(entry.caption
							? '<figcaption>' + entry.caption + '</figcaption>'
							: '') +
					'</div>';
				/* ANGLE 14: JS-level invisibility. Don't rely on CSS alone
				   — set the inline style explicitly so even a stale
				   browser cache or CSS specificity bug can't reveal
				   the source pool. The CSS rules still apply, this is
				   belt + suspenders. */
				src.style.cssText = 'position:absolute!important;left:-99999px!important;' +
					'top:0!important;width:1px!important;height:1px!important;' +
					'overflow:hidden!important;visibility:hidden!important;' +
					'pointer-events:none!important;opacity:0!important;display:block!important;';
				main.appendChild(src);
				const marker = container.querySelector(
					'.sideimage-marker[data-si-id="' + id + '"]'
				);
				if (!marker) {
					/* Guard #6: marker should exist because we just
					   inserted the HTML. If marked.js (or another
					   preprocessor) removed it, the sideimage can't
					   be positioned — log and skip. */
					logError('NO_MARKER_IMG',
						'\\' + (entry.mode === 'margin' ? 'marginfig' : 'sideimage') + ' #' + id +
						' was extracted but its marker element is missing. ' +
						'This usually means marked.js dropped the marker tag. ' +
						'Skipping #' + id + '.');
					return;
				}
				marker.setAttribute('href', '#si-' + id);
				store.images.push({
					id: id, el: src, url: entry.url,
					caption: entry.caption, marker: marker,
					mode: entry.mode, size: entry.size || 'normal'
				});
			});

			notes.contents.forEach(function (entry, idx) {
				const id = entry.id;
				const raw = entry.raw;
				const src = document.createElement('div');
				src.className = 'md sidenote-source';
				src.id = 'sn-src-' + id;
				src.setAttribute('data-sn-id', String(id));
				src.innerHTML = '<div class="sidenote-source-inner">' + raw + '</div>';
				/* ANGLE 14: JS-level invisibility (same as above). */
				src.style.cssText = 'position:absolute!important;left:-99999px!important;' +
					'top:0!important;width:1px!important;height:1px!important;' +
					'overflow:hidden!important;visibility:hidden!important;' +
					'pointer-events:none!important;opacity:0!important;display:block!important;';
				main.appendChild(src);
				const marker = container.querySelector(
					'.sidenote-marker[data-sn-id="' + id + '"]'
				);
				/* GUARD RAIL G11: TRACE_BEFORE_QUERY
				   Logs the exact state RIGHT BEFORE querySelector runs.
				   Identifies: which container we're processing, what
				   id we computed, what we expect to find. Disabled by
				   default — enable by appending ?sn-trace=1 to the URL. */
				if (typeof window !== 'undefined' && /[?&]sn-trace=1\b/.test(window.location.search)) {
					try {
						const liveInner = (container.innerHTML || '').substring(0, 400);
						const allInContainer = Array.from(
							container.querySelectorAll('.sidenote-marker[data-sn-id]')
						).map(function (m) { return m.getAttribute('data-sn-id'); });
						const allInDoc = Array.from(
							document.querySelectorAll('.sidenote-marker[data-sn-id]')
						).map(function (m) { return m.getAttribute('data-sn-id'); });
						console.log('[BlogSidenotes:TRACE] before querySelector for id=' + id +
							' container=' + container.tagName + '.' + container.className +
							' markers-in-container=[' + allInContainer.join(',') + ']' +
							' markers-in-doc=[' + allInDoc.join(',') + ']' +
							' innerHTML-head="' + liveInner + '"');
					} catch (err) {
						console.log('[BlogSidenotes:TRACE] threw during trace:', err);
					}
				}
				if (!marker) {
					/* GUARD RAIL G1: NO_MARKER_IN_DOM
					   The marker string was inserted into container.innerHTML but
					   querySelector can't find it. Most likely cause: marked.js
					   (which ran earlier from init.js's window.onload) parsed the
					   raw markdown including `\sidenote{…}` and DROPPED the curly
					   braces or surrounding text. We log the full diagnostic
					   state so the user can find the exact offset. */
					const markerPos = html.indexOf('sidenote-marker');
					const processedSnippet = markerPos >= 0
						? html.substring(Math.max(0, markerPos - 40),
							Math.min(html.length, markerPos + 120))
						: '<no "sidenote-marker" substring found in html>';
					const liveInnerHTML = (function () {
						try { return container.innerHTML.substring(0, 600); }
						catch (_) { return '<could not read container.innerHTML>'; }
					})();
					const allMarkersInContainer = (function () {
						try {
							return Array.from(
								container.querySelectorAll('.sidenote-marker[data-sn-id]')
							).map(function (m) { return m.getAttribute('data-sn-id'); });
						} catch (_) { return []; }
					})();
					logError('NO_MARKER_IN_DOM',
						'Sidenote #' + id + ' was extracted but its marker ' +
						'<sup class="sidenote-marker" data-sn-id="' + id + '"> ' +
						'was NOT found in the container after innerHTML was set.\n' +
						'  Container:           <' + container.tagName.toLowerCase() +
							' class="' + container.className + '">\n' +
						'  Marker id:           ' + id + '\n' +
						'  Raw content (first 80 chars): "' +
							(raw ? raw.substring(0, 80) : '<none>') + '…"\n' +
						'  All sidenote-markers currently inside this container: [' +
							allMarkersInContainer.join(', ') + ']\n' +
						'  Live container.innerHTML (first 600 chars): "' +
							liveInnerHTML + (container.innerHTML.length > 600 ? '…' : '') + '"\n' +
						'  The processed-html snippet around "sidenote-marker": "' +
							processedSnippet + '"\n' +
						'  Likely cause: marked.js (run from init.js\'s window.onload BEFORE ' +
						'our addEventListener fires) pre-processed the container and the ' +
						'first `\sidenote{…}` it found got an id=N that does NOT match ' +
						'the id this loop iteration is computing (' + id + '). Workaround: ' +
						'run extract() BEFORE renderMarkdown. Skipping sidenote #' + id + '.',
						{ containerClass: container.className,
						  rawPreview: raw ? raw.substring(0, 200) : null,
						  processedPreview: processedSnippet,
						  liveInnerHTMLFirst600: liveInnerHTML,
						  markersInContainer: allMarkersInContainer });
					return;
				}
				store.notes.push({ id: id, el: src, raw: raw, marker: marker });
			});

			nNotes  += notes.contents.length;
			nImages += imgs.entries.length + mfigs.entries.length;
		});

		if (nNotes + nImages > 0) {
			document.body.classList.add('has-sidenotes');
			try {
				if (typeof updateLoadingStatus === 'function') {
					const parts = [];
					if (nNotes)  parts.push(nNotes + ' sidenote'  + (nNotes  === 1 ? '' : 's'));
					if (nImages) parts.push(nImages + ' sideimage' + (nImages === 1 ? '' : 's'));
					updateLoadingStatus('Extracted ' + parts.join(' + ') + '.');
				}
			} catch (_) {}
			/* Also log to console so devtools shows it. */
			try {
				const ids = store.notes.map(function (n) { return n.id; }).join(',');
				const siIds = store.images.map(function (i) { return i.id; }).join(',');
				console.info(
					'%c[BlogSidenotes]',
					'color:#6366f1;font-weight:bold',
					'extract() done — sidenotes=[' + ids + '] sideimages=[' + siIds + ']. ' +
					'They appear in the right margin when the marker is in the viewport ' +
					'(scroll down to see them). Use BlogSidenotes.diagnose() for a full report.'
				);
			} catch (_) {}
		}

		return { notes: nNotes, images: nImages };
	}

	/* ═════════════════════════════════════════════════════════════════
	   Container builders
	   ═════════════════════════════════════════════════════════════════ */
	function _buildContainers() {
		if (store.notes.length > 0 && !document.getElementById('sidenotes-rail')) {
			const rail = document.createElement('aside');
			rail.id = 'sidenotes-rail';
			rail.setAttribute('aria-label', 'Sidenotes');
			document.body.appendChild(rail);
		}
		if (store.images.length > 0 && !document.getElementById('sideimages-rail')) {
			const ir = document.createElement('aside');
			ir.id = 'sideimages-rail';
			ir.setAttribute('aria-label', 'Side figures');
			document.body.appendChild(ir);
		}
		if (store.notes.length > 0) {
			const main = document.getElementById('contents');
			if (!main) {
				logError('NO_CONTENTS', '_buildContainers(): #contents missing — cannot place fallback section.');
				return;
			}
			if (!document.getElementById('sidenotes-section')) {
				const fb = document.createElement('section');
				fb.id = 'sidenotes-section';
				fb.innerHTML =
					'<h2>Sidenotes</h2>' +
					'<ol class="sidenote-fallback" id="sidenote-fallback"></ol>';
				/* ANGLE 24: append the fallback section as a sibling
				   of #contents (NOT inside it) so the TOC generator
				   doesn't pick up its <h2> as a chapter heading. The
				   section only appears on narrow viewports anyway
				   (CSS @media), where the rail is hidden — but the
				   TOC was reading it regardless.                  */
				main.parentNode.insertBefore(fb, main.nextSibling);
			}
		}
	}

	/* ═════════════════════════════════════════════════════════════════
	   Visibility helper.
	   Guard #8: walks up ancestor chain checking computed style;
	   returns false for elements inside display:none ancestors.
	   Also detects detached nodes.
	   ═════════════════════════════════════════════════════════════════ */
	function _isRendered(el) {
		if (!el || !el.nodeType) return false;
		if (!document.contains(el)) {
			/* GUARD RAIL G3: detached-marker warning is INTENTIONALLY
			   silenced unless the marker has been gone for more than
			   one layout pass. The transient state happens during
			   marked.js rerun (init.js calls renderMarkdown from
			   window.onload, then runPostLoad calls it again). */
			return false;
		}
		let cur = el;
		while (cur && cur !== document.documentElement) {
			const cs = window.getComputedStyle(cur);
			if (cs.display === 'none') return false;
			cur = cur.parentElement;
		}
		return true;
	}

	/* ═════════════════════════════════════════════════════════════════
	   _copyNotes — populate rail + fallback list
	   ═════════════════════════════════════════════════════════════════ */
	function _copyNotes() {
		if (store.notes.length === 0) return;
		const rail = document.getElementById('sidenotes-rail');
		const fb   = document.getElementById('sidenote-fallback');
		if (!rail || !fb) {
			logError('NO_RAIL', '_copyNotes(): rail or fallback missing.');
			return;
		}
		store.notes.forEach(function (entry) {
			/* ANGLE 15: be robust against marked.parse having unwrapped
			   the .sidenote-source-inner div during processing.
			   Fall back to the source container's own innerHTML if the
			   wrapper is gone. */
			let inner = entry.el.querySelector('.sidenote-source-inner');
			let processedHTML;
			if (inner) {
				processedHTML = inner.innerHTML;
			} else {
				processedHTML = entry.el.innerHTML;
				logWarn('INNER_UNWRAPPED',
					'Sidenote #' + entry.id + ' source\'s .sidenote-source-inner wrapper ' +
					'was removed (probably by marked.parse). Falling back to container ' +
					'innerHTML. Length: ' + processedHTML.length + ' chars.');
			}
			if (!processedHTML || !processedHTML.trim()) {
				logError('EMPTY_PROCESSED',
					'Sidenote #' + entry.id + ' has empty processed content. Skipping.');
				return;
			}
			/* ANGLE 21: ALWAYS run marked.parse as the final guarantee
			   that markdown (*foo*, **bar**, [link](url), etc.) is
			   rendered. marked.parse is idempotent on already-processed
			   HTML (it keeps `<em>`, `<strong>`, `<cite>` etc. as-is
			   and only converts raw markdown). If it adds a wrapping
			   `<p>`, we strip it below since the sidenote body is its
			   own block. */
			if (typeof window.marked === 'undefined' || typeof window.marked.parse !== 'function') {
				logError('NO_MARKED',
					'Sidenote #' + entry.id + ' cannot be parsed — window.marked missing. ' +
					'Markdown in sidenote will not render.');
			} else {
				try {
					const reparsed = window.marked.parse(processedHTML);
					if (reparsed && reparsed.length > 0) {
						/* Strip a single outer <p>...</p> wrapper if
						   marked.parse added one — the sidenote body
						   shouldn't have a redundant paragraph wrapper. */
						processedHTML = reparsed.replace(
							/^\s*<p>([\s\S]*)<\/p>\s*$/i, '$1'
						);
					}
				} catch (err) {
					logError('REPARSE_FAIL',
						'marked.parse reparse failed for sidenote #' + entry.id + ': ' + err);
				}
			}
			/* ANGLE 29: strip Inkscape / sodipodi metadata from
			   any SVG in the sidenote body. (Same fix as for
			   sideimage captions — see _sanitizeSvgMetadata.) */
			processedHTML = _sanitizeSvgMetadata(processedHTML);

			const note = document.createElement('aside');
			note.className = 'sidenote';
			note.id = 'sn-' + entry.id;
			note.setAttribute('data-sn-id', String(entry.id));
			note.setAttribute('role', 'note');
			note.innerHTML =
				'<span class="sidenote-counter">' + entry.id + '</span>' +
				'<a class="sidenote-backlink" href="#snref-' + entry.id + '" title="Back to text">↩</a>' +
				'<div class="sidenote-body">' + processedHTML + '</div>';
			note.style.display = 'none';
			rail.appendChild(note);

			/* Guard #10: refuse duplicate IDs. */
			const existing = document.getElementById('snfb-' + entry.id);
			if (existing) {
				logError('DUP_ID_FB',
					'Duplicate fallback ID snfb-' + entry.id + ' detected. Replacing.');
				existing.parentNode && existing.parentNode.removeChild(existing);
			}

			const li = document.createElement('li');
			li.id = 'snfb-' + entry.id;
			li.setAttribute('data-sn-id', String(entry.id));
			li.innerHTML =
				'<a class="sidenote-backlink" href="#snref-' + entry.id + '" title="Back to text">↩</a>' +
				'<div class="sidenote-body">' + processedHTML + '</div>';
			fb.appendChild(li);

			entry.el.parentNode && entry.el.parentNode.removeChild(entry.el);
		});
	}

	/* ═════════════════════════════════════════════════════════════════
	   _copyImages — populate sideimage figures.

	   Two modes:
	     • mode === 'margin'  →  goes into the sideimages-rail (right
	                              margin, sticky) when viewport is wide
	                              enough. When viewport is narrow, moves
	                              inline next to the marker.
	     • mode === 'inline'  →  ALWAYS rendered inline next to the
	                              marker, regardless of viewport. Never
	                              in the right margin. (\sideimage)
	   ═════════════════════════════════════════════════════════════════ */
	function _copyImages() {
		if (store.images.length === 0) return;
		const rail = document.getElementById('sideimages-rail');
		if (!rail) {
			logError('NO_IMG_RAIL', '_copyImages(): sideimages-rail missing.');
			return;
		}
		store.images.forEach(function (entry) {
			/* ANGLE 15: robust against marked.parse having unwrapped the
			   .sideimage-source-inner wrapper. */
			let inner = entry.el.querySelector('.sideimage-source-inner');
			let captionHTML = '';
			let imgSrc = entry.url;
			if (inner) {
				const cap = inner.querySelector('figcaption');
				if (cap) captionHTML = cap.innerHTML;
				const img = inner.querySelector('img');
				if (img && img.getAttribute('src')) imgSrc = img.getAttribute('src');
			} else {
				/* marked.parse may have unwrapped the inner div. Try the
				   source container's children directly. */
				const cap = entry.el.querySelector('figcaption');
				if (cap) captionHTML = cap.innerHTML;
				const img = entry.el.querySelector('img');
				if (img && img.getAttribute('src')) imgSrc = img.getAttribute('src');
				logWarn('INNER_UNWRAPPED_IMG',
					'Sideimage #' + entry.id + ' source\'s .sideimage-source-inner ' +
					'wrapper was removed (probably by marked.parse). Falling back to ' +
					'container children.');
			}
			/* ANGLE 22: always run marked.parse on caption so things
			   like *italic*, **bold**, [links], `code` render. */
			if (captionHTML && window.marked && typeof window.marked.parse === 'function') {
				captionHTML = window.marked.parse(captionHTML);
			}
			/* ANGLE 29: strip Inkscape / sodipodi metadata from
			   any SVG in the caption. Without this, the Antikythera
			   caption rendered a wall of `<sodipodi:namedview ...>`
			   attributes as visible text. */
			captionHTML = _sanitizeSvgMetadata(captionHTML);
			/* Guard #11: duplicate figure ID. */
			const existing = document.getElementById('si-' + entry.id);
			if (existing) {
				logError('DUP_ID_SI', 'Duplicate sideimage ID si-' + entry.id + ' — replacing.');
				existing.parentNode && existing.parentNode.removeChild(existing);
			}

			const fig = document.createElement('figure');
			fig.className = 'sideimage sideimage-mode-' + entry.mode +
				(entry.size && entry.size !== 'normal' ? ' sideimage-' + entry.size : '');
			fig.id = 'si-' + entry.id;
			fig.setAttribute('data-si-id', String(entry.id));
			fig.setAttribute('data-si-mode', entry.mode);
			fig.setAttribute('data-si-size', entry.size || 'normal');
			fig.innerHTML =
				'<img src="' + _escapeAttr(imgSrc) + '" alt="' +
					_escapeAttr(_plainText(captionHTML)) + '" loading="lazy">' +
				(captionHTML ? '<figcaption class="md">' + captionHTML + '</figcaption>' : '');
			fig.style.display = 'none';

			/* Guard #12: broken image → placeholder + console.error. */
			const img = fig.querySelector('img');
			if (img) {
				img.addEventListener('error', function () {
					logError('IMG_FAIL',
						'Sideimage #' + entry.id + ' failed to load: ' + entry.url);
					img.style.display = 'none';
					const ph = document.createElement('div');
					ph.className = 'sideimage-broken';
					ph.textContent = '⚠ image not found: ' + entry.url;
					fig.insertBefore(ph, fig.firstChild);
				});
			}

			if (entry.mode === 'margin') {
				/* Margin-fig: starts in the rail, gets positioned by
				   layout, and moves inline only if viewport is narrow. */
				rail.appendChild(fig);
			} else if (entry.mode === 'float') {
				/* ANGLE 30: float:right inline figure. The article
				   text wraps around the figure on the left. The
				   figure has the full natural height of the image
				   (no internal scroll) and can extend past the
				   article's right edge via negative margin-right
				   so the user can read a wide image (newspaper
				   article, dense diagram) without losing the main
				   reading flow.                                    */
				const marker = _refreshMarker(entry, 'image');
				/* ANGLE 33: drastically simpler insertion. If the
				   marker is anywhere in the DOM, just insert the
				   figure immediately AFTER the marker's parent
				   block. No walk, no fallback. If the marker is
				   inside a `<p>`, the figure goes right after that
				   `<p>`. If the marker is at top level (rare, but
				   happens when the directive is between blocks
				   rather than inside one), it goes after the
				   previous sibling.

				   This is more robust than the blockParent walk
				   and avoids every edge case (display:contents,
				   collapsed wrappers, etc.). The user just wants
				   the figure in the article near the marker; we
				   don't need to overthink this.                  */
				if (marker && marker.parentNode) {
					fig.classList.add('sideimage-float');
					fig.style.display = '';
					logInfo('FLOAT_MARKER_FOUND',
						'\\sideimage[float] #' + entry.id +
						': marker.parent=' + marker.parentElement.tagName +
						'.' + (marker.parentElement.className || ''));
					/* Insert figure after the marker's parent. If
					   the parent is inline, insert after the marker
					   itself. */
					const parent = marker.parentElement;
					const parentCs = window.getComputedStyle(parent);
					if (parentCs.display === 'inline' ||
					    parentCs.display === 'inline-block' ||
					    parentCs.display === 'contents') {
						/* Parent is inline — insert figure right
						   after the marker in its parent. */
						marker.parentNode.insertBefore(fig, marker.nextSibling);
					} else {
						/* Parent is block — insert figure right
						   after the parent in its grandparent. */
						if (parent.parentNode) {
							parent.parentNode.insertBefore(fig, parent.nextSibling);
						} else {
							marker.parentNode.insertBefore(fig, marker.nextSibling);
						}
					}
					logInfo('FLOAT_INSERTED',
						'\\sideimage[float] #' + entry.id + ' inserted near marker. ' +
						'parent=' + parent.tagName + '.' + (parent.className || ''));
				} else {
					fig.classList.add('sideimage-float');
					rail.appendChild(fig);
					let why = 'marker not in DOM or has no parent';
					logWarn('FLOAT_DEFERRED',
						'\\sideimage[float] #' + entry.id + ' — ' + why +
						'. Parked in rail.');
				}
			} else {
				/* Inline (block, centered): insert directly at the
				   marker's location in the article flow. Never
				   touches the rail.

				   Strategy: walk up from the marker to the closest
				   block-level element. If that's a paragraph or
				   heading, the figure goes immediately after it. If
				   that's a generic block (like the .md container
				   itself, which happens when the marker sits between
				   blocks rather than inside one), insert the figure
				   just BEFORE the marker so it appears in the
				   natural reading position. */
				const marker = _refreshMarker(entry, 'image');
				if (marker && _isRendered(marker)) {
					fig.classList.add('sideimage-inline');
					fig.style.display = '';
					/* Walk up to find a block-level ancestor. */
					let blockParent = marker.parentElement;
					let guard = 0;
					while (blockParent && blockParent !== document.body && guard++ < 20) {
						const cs = window.getComputedStyle(blockParent);
						if (cs.display !== 'inline' && cs.display !== 'contents' &&
							cs.display !== 'inline-block') break;
						blockParent = blockParent.parentElement;
					}
					if (!blockParent || blockParent === document.body) {
						/* Couldn't find any block-level ancestor — fall
						   back to the rail. */
						logWarn('NO_INLINE_ANCHOR_INLINE',
							'Could not determine inline insertion point for \\sideimage #' +
							entry.id + ' — temporarily placing in rail.');
						rail.appendChild(fig);
						return;
					}
					const isTextBlock = /^P$|^H[1-6]$|^LI$|^BLOCKQUOTE$/i.test(blockParent.tagName);
					if (isTextBlock) {
						/* Marker is INSIDE a paragraph/heading — put
						   the figure right after that block so the
						   caption flows naturally. */
						blockParent.parentNode.insertBefore(fig, blockParent.nextSibling);
					} else {
						/* Marker is in a generic block (.md, .optional,
						   etc.) between other blocks. Insert the
						   figure right BEFORE the marker — that way
						   it shows up at the right reading position
						   without leaving the container. */
						blockParent.insertBefore(fig, marker);
					}
					logInfo('INLINE_INSERTED',
						'\\sideimage #' + entry.id + ' inserted inline near marker. ' +
						'blockParent=' + blockParent.tagName + '.' + blockParent.className +
						(isTextBlock ? ' (text block — figure after)' :
							' (generic block — figure before marker)'));
				} else {
					/* Marker not rendered yet (collapsed optional).
					   Park in the rail; layout will move it inline
					   once the marker gets a real position. */
					fig.classList.add('sideimage-inline');
					rail.appendChild(fig);
					logWarn('INLINE_DEFERRED',
						'\\sideimage #' + entry.id + ' marker not rendered ' +
						'(collapsed optional?). Parked in rail until layout pass.');
				}
			}

			entry.el.parentNode && entry.el.parentNode.removeChild(entry.el);
		});
	}

	/* ═════════════════════════════════════════════════════════════════
	   ANGLE 36 — Sideimage placement state machine.

	   A \marginfig figure has three possible homes, chosen per layout
	   pass from the CURRENT viewport (measured, never hard-coded):

	     • 'margin'  — wide: it lives in #sideimages-rail, absolutely
	                     positioned at the marker's Y, clear of the text.
	     • 'wrap'    — the rail's left edge intrudes into the article.
	                     The figure is moved into the article flow as a
	                     float:right spanning the rail's horizontal
	                     extent, so the prose BENDS around it.
	     • 'inline'  — below BREAKPOINT: a centred block figure in the
	                     article flow (the old narrow-viewport fallback).

	   _reconcileSideimagesTo() drives every \marginfig figure to the
	   requested state, whatever state it is in now, so a resize that
	   crosses several boundaries at once is still handled correctly.
	   ═════════════════════════════════════════════════════════════════ */

	/* ANGLE 36 / Guard W1: measure how far the sideimage rail's LEFT
	   edge intrudes into the article's right edge. Returns null on any
	   failure so the caller can safely fall back to the previous mode.

	     overlap > 0  → the rail digs into the text (intrusion)
	     overlap < 0  → the rail is clear of the text (gap)          */
	function _measureRailOverlap(ir) {
		try {
			const contents = document.getElementById('contents');
			/* Guard W2: both elements must exist. */
			if (!contents || !ir) return null;
			const railRect = ir.getBoundingClientRect();
			const cRect    = contents.getBoundingClientRect();
			/* Guard W3: use the CONTENT-box right edge of #contents —
			   that is where the prose actually ends (floats align to
			   the content edge, and hanging-punctuation / padding can
			   inset the text). */
			const cs   = window.getComputedStyle(contents);
			const pr   = parseFloat(cs.paddingRight)     || 0;
			const br   = parseFloat(cs.borderRightWidth) || 0;
			const articleRight = cRect.right - pr - br;
			const railLeft     = railRect.left;
			const overlap = articleRight - railLeft;
			/* Guard W4: refuse non-finite results (getBoundingClientRect
			   can return 0s for detached / display:none subtrees). */
			if (!Number.isFinite(overlap) ||
			    !Number.isFinite(articleRight) ||
			    !Number.isFinite(railLeft)) return null;
			return {
				overlap:      overlap,
				articleRight: articleRight,
				railLeft:     railLeft,
				railRight:    railRect.right,
				railRect:     railRect
			};
		} catch (err) {
			logWarn('WRAP_MEASURE_FAIL',
				'_measureRailOverlap() threw: ' + (err && err.message));
			return null;
		}
	}

	/* ANGLE 36: size a wrap figure so its box spans EXACTLY the rail's
	   horizontal extent (railLeft → railRight). The figure is a
	   float:right child of the article, so a negative margin-right is
	   required to push its right edge out into the margin, to the rail's
	   right edge. The part of the box that intrudes into the text column
	   is what the prose bends around. All inputs are guarded.           */
	function _sizeWrapFig(fig, m) {
		try {
			/* Guard W5: need a valid rail measurement. */
			const railRect = (m && m.railRect) ? m.railRect : null;
			if (!railRect || !Number.isFinite(railRect.width) ||
			    railRect.width <= 0 || !Number.isFinite(railRect.right)) {
				logWarn('WRAP_NO_MEASURE',
					'Wrap figure has no usable rail measurement — using a safe default width.');
			}
			/* Guard W6: clamp the width to a readable band. */
			let figWidth = railRect ? railRect.width : 320;
			if (!Number.isFinite(figWidth) || figWidth <= 0) figWidth = 320;
			figWidth = Math.max(WRAP_MIN_W, Math.min(WRAP_MAX_W, figWidth));

			/* Guard W7: the float aligns to its PARENT's content-box
			   right edge; measure that to derive the exact negative
			   margin-right. If the parent can't be measured we fall
			   back to margin-right:0 (figure stays at the text edge). */
			const parent = fig.parentNode;
			let containerRight = NaN;
			if (parent && parent.nodeType === 1) {
				const pres = parent.getBoundingClientRect();
				const pcs  = window.getComputedStyle(parent);
				const pr   = parseFloat(pcs.paddingRight)     || 0;
				const br   = parseFloat(pcs.borderRightWidth) || 0;
				containerRight = pres.right - pr - br;
			}
			let marginRight = 0;
			if (Number.isFinite(containerRight) && Number.isFinite(railRect ? railRect.right : NaN)) {
				marginRight = containerRight - (railRect ? railRect.right : containerRight);
			}
			if (!Number.isFinite(marginRight)) marginRight = 0;

			/* Guard W8: never emit NaN/Infinity into the style. */
			fig.style.width       = Math.round(figWidth)    + 'px';
			fig.style.marginRight = Math.round(marginRight) + 'px';
		} catch (err) {
			logWarn('WRAP_SIZE_FAIL',
				'Failed to size wrap figure: ' + (err && err.message));
		}
	}

	/* ANGLE 36: walk up from the marker to the nearest block-level
	   ancestor — the element we insert the float/inline figure next to.
	   Returns null if no safe anchor can be found.                     */
	function _flowAnchorFor(marker) {
		if (!marker || !marker.parentElement) return null;
		let target = marker.parentElement;
		let guard  = 0;
		while (target && target !== document.body && guard++ < 20) {
			let cs;
			try { cs = window.getComputedStyle(target); }
			catch (_) { break; }
			if (cs.display !== 'inline' && cs.display !== 'contents' &&
			    cs.display !== 'inline-block') break;
			target = target.parentElement;
		}
		if (!target || target === document.body || !target.parentNode) return null;
		return target;
	}

	/* ANGLE 36: park a figure back in the rail, hidden, with a clean
	   inline-geometry reset so the next margin pass can reposition it. */
	function _parkInRail(fig, rail) {
		if (!fig) return;
		if (rail && fig.parentNode !== rail) {
			try { rail.appendChild(fig); } catch (_) { return; }
		}
		fig.classList.remove('sideimage-inline', 'sideimage-wrap');
		fig.style.display     = 'none';
		fig.style.position    = '';
		fig.style.top         = '';
		fig.style.left        = '';
		fig.style.right       = '';
		fig.style.width       = '';
		fig.style.marginRight = '';
		fig.style.maxHeight   = '';
		fig.style.overflow    = '';
	}

	/* ANGLE 36: the single entry point that drives every \marginfig
	   figure to the requested state ('margin' | 'wrap' | 'inline').     */
	function _reconcileSideimagesTo(state, ir, m) {
		const rail = (ir && ir.nodeType === 1) ? ir : document.getElementById('sideimages-rail');
		if (!store || !store.images.length) return;

		store.images.forEach(function (entry) {
			/* Only margin-mode figures move between rail / wrap / inline.
			   \sideimage (inline) and \sideimage[float] stay put. */
			if (entry.mode !== 'margin') return;
			/* ANGLE 9: find the figure wherever it currently is — the
			   whole document, because it may be in the rail OR in the
			   article flow from a previous pass. */
			let fig;
			try { fig = document.querySelector('.sideimage[data-si-id="' + entry.id + '"]'); }
			catch (_) { fig = null; }
			if (!fig) return;
			const marker = _refreshMarker(entry, 'image');

			/* ── margin: absolutely positioned in the rail ───────── */
			if (state === 'margin') {
				if (rail && fig.parentNode !== rail) {
					try { rail.appendChild(fig); } catch (_) { return; }
				}
				fig.classList.remove('sideimage-inline', 'sideimage-wrap');
				fig.style.position    = 'absolute';
				fig.style.top         = '';
				fig.style.marginRight = '';
				fig.style.display     = '';
				const size     = entry.size || 'normal';
				let railRect = null;
				if (rail) { try { railRect = rail.getBoundingClientRect(); } catch (_) { railRect = null; } }
				if (size === 'full' || size === 'wide') {
					/* Wide/full: extend to the viewport's right edge. */
					const railGap = railRect ? (railRect.right - (window.innerWidth - 24)) : 0;
					fig.style.left    = 'auto';
					fig.style.right   = (Number.isFinite(railGap) ? railGap : 0) + 'px';
					fig.style.width   = (size === 'full' ? '420px' : '360px');
					fig.style.maxHeight = 'calc(100vh - 48px)';
					fig.style.overflow  = 'auto';
				} else {
					/* Normal: fill the rail width. */
					fig.style.left    = '0';
					fig.style.right   = '0';
					fig.style.width   = 'auto';
					fig.style.maxHeight = 'calc(100vh - 80px)';
					fig.style.overflow  = '';
				}
				if (marker) {
					let r;
					try { r = marker.getBoundingClientRect(); } catch (_) { r = null; }
					if (r && Number.isFinite(r.top)) {
						fig.style.top = (r.top + window.scrollY) + 'px';
					}
				}
				return;
			}

			/* ── inline / wrap: figure lives in the article flow ─── */
			/* Guard W9: without a rendered marker we cannot anchor the
			   figure in the flow — park it in the rail, hidden. */
			if (!marker || !_isRendered(marker)) {
				_parkInRail(fig, rail);
				return;
			}
			const anchor = _flowAnchorFor(marker);
			if (!anchor) {
				logWarn('NO_FLOW_ANCHOR_SI',
					'No block-level flow anchor for \\marginfig #' + entry.id +
					' (' + state + ' mode) — parking in rail, hidden.');
				_parkInRail(fig, rail);
				return;
			}
			/* Guard W11: a float/figure inserted into a <tr>/<td> is invalid
			   HTML and would corrupt the table. If the marker lives in a
			   table, keep the figure in the rail (hidden on narrow screens)
			   rather than breaking the table layout. */
			const hostParent = anchor.parentNode;
			if (hostParent &&
			    /^(TR|TABLE|THEAD|TBODY|TFOOT|TD|TH)$/i.test(hostParent.tagName || '')) {
				logWarn('WRAP_TABLE_CONTEXT',
					'\\marginfig #' + entry.id + ' marker is inside a table — ' +
					'cannot flow the figure around it; parking in rail.');
				_parkInRail(fig, rail);
				return;
			}
			/* Clean reset to a neutral in-flow state. */
			fig.classList.remove('sideimage-inline', 'sideimage-wrap');
			fig.style.position    = '';
			fig.style.top         = '';
			fig.style.left        = '';
			fig.style.right       = '';
			fig.style.width       = '';
			fig.style.marginRight = '';
			fig.style.maxHeight   = '';
			fig.style.overflow    = '';
			fig.style.display     = '';
			if (state === 'wrap') fig.classList.add('sideimage-wrap');
			else                  fig.classList.add('sideimage-inline');
			/* Insert after the marker's block so the following prose
			   wraps around the float. Guard W10: layout() runs on every
			   scroll/resize, so only touch the DOM when the figure is NOT
			   already sitting exactly where it belongs — otherwise a
			   redundant move would force a reflow on every frame. */
			const alreadyPlaced =
				fig.parentNode === anchor.parentNode &&
				fig.previousElementSibling === anchor;
			if (!alreadyPlaced) {
				try {
					anchor.parentNode.insertBefore(fig, anchor.nextSibling);
				} catch (err) {
					logWarn('WRAP_INSERT_FAIL',
						'Could not insert \\marginfig #' + entry.id + ' into the flow: ' + (err && err.message));
					_parkInRail(fig, rail);
					return;
				}
			}
			/* Re-size every pass: the viewport (and thus the rail extent)
			   can change between passes even when the DOM doesn't move. */
			if (state === 'wrap') _sizeWrapFig(fig, m);
		});

		/* Rail height bookkeeping: the rail only needs extra height while
		   it actually holds absolutely-positioned figures. */
		if (!rail) return;
		if (state === 'margin') {
			let railBottom = 0;
			store.images.forEach(function (entry) {
				if (entry.mode !== 'margin') return;
				const f2 = rail.querySelector('.sideimage[data-si-id="' + entry.id + '"]');
				if (!f2) return;
				const mk = _refreshMarker(entry, 'image');
				if (!mk) return;
				let r; try { r = mk.getBoundingClientRect(); } catch (_) { return; }
				if (!r || !Number.isFinite(r.top)) return;
				const mBot = r.top + window.scrollY + r.height + f2.offsetHeight + 200;
				if (mBot > railBottom) railBottom = mBot;
			});
			rail.style.minHeight = (railBottom + 80) + 'px';
		} else {
			/* No margin figures in the rail right now — release the
			   reserved height so an empty rail doesn't stretch the page. */
			rail.style.minHeight = '';
		}
	}

	/* ═════════════════════════════════════════════════════════════════
	   finalize()
	   ═════════════════════════════════════════════════════════════════ */
	function finalize() {
		if (!_domReady()) {
			logError('NO_DOM', 'finalize() ran before document.body existed — aborting.');
			return;
		}
		if (!store || (store.notes.length === 0 && store.images.length === 0)) return;

		/* Guard #14: dependencies check. */
		if (typeof window.bibData === 'undefined') {
			logWarn('NO_BIBDATA',
				'window.bibData is not defined — citations inside sidenotes may not resolve.');
		}
		if (typeof window.marked === 'undefined') {
			logError('NO_MARKED',
				'window.marked is not defined — markdown inside sidenotes will not be parsed.');
		}

		try {
			_buildContainers();
			_copyNotes();
			_copyImages();
			_installHoverPreview();
			_installSmoothScroll();
			_installOptionalObservers();
			_installVisibilityObserver();
			_installSideimageScroll();
			if (typeof bindIframeSafeLinks === 'function') {
				bindIframeSafeLinks();
			}
			try {
				if (typeof updateLoadingStatus === 'function') {
					const tot = store.notes.length + store.images.length;
					updateLoadingStatus('Placed ' + tot + ' margin annotation' +
						(tot === 1 ? '' : 's') + '.');
				}
			} catch (_) {}
			scheduleLayout(true);

			/* ANGLE 4: immediate visibility check — record marker
			   positions for diagnostic purposes. Sidenotes and
			   sideimages stay visible always; we just need to know
			   which markers are on screen. */
			try { _updateMarkerVisibility(); }
			catch (err) { logError('INITIAL_VIS_FAIL', 'immediate visibility update threw:', err); }
		} catch (err) {
			/* Guard #15: catch-all. */
			logError('FINALIZE_FAIL',
				'finalize() threw; sidenotes will appear as fallback footnotes only. ' + (err && err.message),
				err);
			try {
				const fb = document.getElementById('sidenotes-section');
				if (fb) fb.style.display = 'block';
			} catch (_) {}
		}
	}

	/* ═════════════════════════════════════════════════════════════════
	   ANGLE 1: Robust visibility tracking.
	   We use BOTH IntersectionObserver (efficient) AND a direct
	   scroll-listener (reliable). The scroll listener ALWAYS fires
	   — it doesn't depend on the browser's IO scheduler. If IO is
	   slow / disabled / fails for any reason, the scroll listener
	   still updates visibilityMap and the .is-visible classes.
	   ═════════════════════════════════════════════════════════════════ */
	/* ANGLE 9: re-find the marker in the live DOM. The original
	   marker reference (entry.marker) can become STALE if anything
	   in the page rewrites container.innerHTML — which happens when
	   renderMarkdown() runs after our extract. The new element has
	   the same data-sn-id attribute, but entry.marker still points to
	   the detached old node. We re-query on every visibility pass. */
	function _refreshMarker(entry, kind) {
		const sel = kind === 'image'
			? '.sideimage-marker[data-si-id="' + entry.id + '"]'
			: '.sidenote-marker[data-sn-id="' + entry.id + '"]';
		const fresh = document.querySelector(sel);
		if (fresh && fresh !== entry.marker) {
			entry.marker = fresh;
		}
		return entry.marker;
	}

	function _updateMarkerVisibility() {
		const scrollY = window.scrollY;
		const vpH     = window.innerHeight || document.documentElement.clientHeight;
		const viewTop = scrollY;
		const viewBot = scrollY + vpH;
		const LEAD  = 200;
		const TRAIL = 400;

		/* ANGLE 24: visibility tracker now only records marker positions
		   for diagnostic purposes (and to decide where to place
		   sticky figures). It no longer toggles the .is-visible
		   class — sidenotes and sideimages stay visible always. */
		const apply = function (entry, kind) {
			const marker = _refreshMarker(entry, kind);
			if (!marker || !document.contains(marker)) {
				visibilityMap[entry.id] = false;
				return false;
			}
			let r;
			try { r = marker.getBoundingClientRect(); }
			catch (err) {
				visibilityMap[entry.id] = false;
				return false;
			}
			if (!r || (r.width === 0 && r.height === 0)) {
				visibilityMap[entry.id] = false;
				return false;
			}
			const docTop = r.top + scrollY;
			const docBot = docTop + Math.max(r.height, 4);
			const visible = docBot >= viewTop - LEAD &&
			               docTop <= viewBot + TRAIL;
			visibilityMap[entry.id] = visible;
			return visible;
		};
		store.notes.forEach(function (e) { apply(e, 'note'); });
		store.images.forEach(function (e) { apply(e, 'image'); });
	}

	function _installVisibilityObserver() {
		/* Always run the direct scroll-based check — this is the
		   reliable path. IntersectionObserver is layered on top as
		   an optimisation but the scroll path works without it. */
		_installScrollBasedVisibility();

		/* Optional: also wire IntersectionObserver for efficient
		   updates between scroll events. If IO is unsupported or
		   fails, the scroll listener still works. */
		if (window.IntersectionObserver) {
			try {
				if (ioObserver) ioObserver.disconnect();
				ioObserver = new IntersectionObserver(function (entries) {
					let needsLayout = false;
					entries.forEach(function (entry) {
						const el = entry.target;
						const snId = el.getAttribute('data-sn-id');
						const siId = el.getAttribute('data-si-id');
						const id = snId || siId;
						if (!id) return;
						const was = visibilityMap[id];
						const now  = entry.isIntersecting;
						visibilityMap[id] = now;
						if (was !== now) needsLayout = true;

						const target = snId
							? document.querySelector('.sidenote[data-sn-id="' + snId + '"]')
							: document.querySelector('.sideimage[data-si-id="' + siId + '"]');
						if (target) {
							target.classList.toggle('is-visible', now);
						}
					});
					if (needsLayout) scheduleLayout(false);
				}, {
					rootMargin: '0px 0px -60px 0px',
					threshold: 0
				});

		store.notes.forEach(function (entry) {
			/* ANGLE 9: re-find before observing (entry.marker may be
			   stale — renderMarkdown has run between extract and now). */
			const m = _refreshMarker(entry, 'note');
			if (m && document.contains(m)) ioObserver.observe(m);
		});
		store.images.forEach(function (entry) {
			const m = _refreshMarker(entry, 'image');
			if (m && document.contains(m)) ioObserver.observe(m);
		});
			} catch (err) {
				logWarn('IO_SETUP_FAIL',
					'IntersectionObserver setup failed; falling back to scroll-only. ' + err.message);
			}
		}
	}

	/* ANGLE 1 (cont.): Scroll-based visibility — runs on every
	   scroll/resize. This is the FALLBACK and is always wired up. */
	function _installScrollBasedVisibility() {
		let ticking = false;
		function update() {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(function () {
				ticking = false;
				try { _updateMarkerVisibility(); }
				catch (err) { logError('VIS_UPDATE_FAIL', 'visibility update threw:', err); }
			});
		}
		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update, { passive: true });
		/* Initial pass — fires on next frame so layout has settled. */
		requestAnimationFrame(update);
	}

	/* ═════════════════════════════════════════════════════════════════
	   layout() — the heart of the positioning.
	   GUARD RAILS:
	     • rail must exist (17)
	     • rail must be visible (18)
	     • marker must be rendered (19)
	     • marker must be in viewport (via visibilityMap) (20)
	     • Y is clamped to [0, MAX_Y] (21)
	     • consecutive failures abort the pass (22)
	     • width/right are only set on visible notes
	     • lastBottom only accumulates across VISIBLE notes (23)
	   ═════════════════════════════════════════════════════════════════ */
	function layout() {
		if (layoutFailsafe > 10) {
			logError('LAYOUT_LOOP',
				'layout() has failed 10 times consecutively — giving up to avoid a busy loop. ' +
				'Sidenotes will be hidden.');
			return;
		}
		try {
			_layoutOnce();
			layoutFailsafe = 0;
		} catch (err) {
			layoutFailsafe++;
			logError('LAYOUT_THROW',
				'layout() threw (' + layoutFailsafe + 'x): ' + (err && err.message), err);
		}
	}

	function _layoutOnce() {
		if (!_domReady()) {
			logError('NO_DOM', 'layout(): body not ready.');
			return;
		}
		const rail = document.getElementById('sidenotes-rail');
		const ir   = document.getElementById('sideimages-rail');
		if (!rail && !ir) return;

		const railVisible = rail && rail.offsetParent !== null;
		const irVisible   = ir   && ir.offsetParent   !== null;

		/* ─── Sidenotes ─── */
		if (rail) {
			if (!railVisible) {
				/* ANGLE 11: when the rail is hidden (narrow viewport),
				   we still want to hide each sidenote — UNLESS the
				   fallback has already force-shown it. The fallback's
				   intent is "show everything no matter what", and we
				   don't want subsequent layout passes to undo it. */
				store.notes.forEach(function (entry) {
					const note = rail.querySelector(
						'.sidenote[data-sn-id="' + entry.id + '"]'
					);
					if (!note) return;
					if (visibilityMap[entry.id] === true) return;
					note.style.display = 'none';
				});
				rail.style.height = '0px';
			} else {
				let lastBottom = 0;
				store.notes.forEach(function (entry) {
					const note = rail.querySelector(
						'.sidenote[data-sn-id="' + entry.id + '"]'
					);
					if (!note) return;

					/* ANGLE 9: re-find the marker in case renderMarkdown
					   replaced it (entry.marker points to a stale,
					   detached node). */
					const marker = _refreshMarker(entry, 'note');

					/* ANGLE 26: if the marker is inside a collapsed
					   optional (or otherwise not rendered), DON'T show
					   the sidenote. Showing it at top:0 of the page
					   looks wrong — it appears orphaned at the very top
					   even though its anchor is hidden. The user only
					   sees the sidenote once they expand the optional. */
					if (!marker || !_isRendered(marker)) {
						note.style.display = 'none';
						return;
					}

					/* ANGLE 24: sidenotes are ALWAYS visible once placed
					   — they don't fade in/out based on scroll. The
					   user wants them to stay anchored to their marker's
					   position so they can scroll through the page and
					   still see the corresponding annotations. */
					note.style.display = '';

					/* Measure the marker's document Y. */
					let markerRect;
					try {
						markerRect = marker.getBoundingClientRect();
					} catch (err) {
						logWarn('GBCR_FAIL', 'getBoundingClientRect threw for sidenote #' + entry.id, err);
						if (visibilityMap[entry.id] !== true) note.style.display = 'none';
						return;
					}
					let desiredTop = markerRect.top + window.scrollY;

					/* Guard #25: negative Y (shouldn't happen, but
					   clamp anyway). */
					if (desiredTop < 0) {
						logWarn('NEGATIVE_Y',
							'Sidenote #' + entry.id + ' marker has negative Y (' +
							desiredTop + ') — clamping to 0.');
						desiredTop = 0;
					}
					/* Guard #26: Y beyond sanity cap. */
					if (desiredTop > MAX_Y) {
						logWarn('ABSURD_Y',
							'Sidenote #' + entry.id + ' marker Y (' + desiredTop +
							') exceeds sanity cap ' + MAX_Y + ' — clamping.');
						desiredTop = MAX_Y;
					}

					/* Guard #23: only stack against VISIBLE notes. */
					const top = Math.max(desiredTop, lastBottom + VERTICAL_GAP);

					note.style.display = '';
					note.style.position = 'absolute';
					note.style.top = top + 'px';
					note.style.left = '0';
					note.style.right = '0';
					note.style.width = 'auto';

					let h = 0;
					try {
						h = note.offsetHeight;
					} catch (err) {
						logWarn('HEIGHT_FAIL', 'offsetHeight threw for sidenote #' + entry.id, err);
					}
					lastBottom = top + h;
				});
				rail.style.height = (lastBottom + 40) + 'px';
			}
		}

		/* ─── Sideimages ───────────────────────────────────────────
		   ANGLE 36: three possible homes for a \marginfig, chosen per
		   pass from the CURRENT (measured) viewport:

		     1. vw < BREAKPOINT          → 'inline'  (centred block in
	                                        the article — no margin at all)
		     2. rail intrudes into text   → 'wrap'    (float:right in the
	                                        article so the prose bends
	                                        around the figure)
		     3. rail clear of the text    → 'margin'  (absolute in the
	                                        right-margin rail, at the
	                                        marker's Y — the classic Tufte
	                                        sticky figure)

		   The wrap/margin decision is measured, not hard-coded, and
		   hysteresis (WRAP_ENTER / WRAP_EXIT) keeps it from flip-
	   flopping while the window is resized across the boundary. */
		if (ir) {
			if (!irVisible) {
				/* Below BREAKPOINT there is no room for a margin column
				   at all — every \marginfig becomes a centred inline
				   figure in the article flow. */
				sideimageWrapActive = false;
				_reconcileSideimagesTo('inline', ir, null);
				return;
			}

			/* The rail is visible: measure how far its left edge intrudes
			   into the article. Guard W9: if the measurement fails for
			   any reason, default to 'margin' (the previous, safe
			   behaviour) rather than guessing. */
			const m       = _measureRailOverlap(ir);
			const overlap = (m && Number.isFinite(m.overlap)) ? m.overlap : 0;

			/* Hysteresis: enter wrap only once clearly intruding, leave
			   only once clearly clear. This is what prevents the figure
			   from bouncing between the rail and the flow while the user
			   hovers the window edge near the boundary. */
			const shouldWrap = sideimageWrapActive
				? !(overlap <= -WRAP_EXIT)   // already wrapping → stay until clearly clear
				: (overlap >= WRAP_ENTER);   // not wrapping  → enter once clearly intruding

			if (shouldWrap) {
				if (!sideimageWrapActive) {
					logInfo('sideimages → WRAP mode (rail intrudes ' +
						Math.round(overlap) + 'px into the text; ' +
						'figures now float and the prose bends around them).');
				}
				sideimageWrapActive = true;
				_reconcileSideimagesTo('wrap', ir, m);
			} else {
				if (sideimageWrapActive) {
					logInfo('sideimages → MARGIN mode (rail is ' +
						Math.round(-overlap) + 'px clear of the text).');
				}
				sideimageWrapActive = false;
				_reconcileSideimagesTo('margin', ir, null);
			}
		}
	}

	function scheduleLayout(immediate) {
		if (layoutRaf) cancelAnimationFrame(layoutRaf);
		layoutRaf = requestAnimationFrame(function () {
			layoutRaf = 0;
			layout();
		});
		if (immediate) {
			setTimeout(function () { layout(); }, 250);
			setTimeout(function () { layout(); }, 1200);
		}
	}

	/* ═════════════════════════════════════════════════════════════════
	   Optional block observer (dark mode toggle / optional expand)
	   ═════════════════════════════════════════════════════════════════ */
	function _installOptionalObservers() {
		/* Guard #27: MutationObserver support check. */
		if (relayoutObserver) return;
		if (!window.MutationObserver) {
			logWarn('NO_MO',
				'MutationObserver is not supported — optional-block expand/collapse will not ' +
				'trigger a layout re-run. Sidenotes may appear misplaced after toggling.');
			return;
		}
		relayoutObserver = new MutationObserver(function (records) {
			for (let i = 0; i < records.length; i++) {
				const r = records[i];
				if (r.target && r.target.classList &&
					r.target.classList.contains('optional-content')) {
					/* Optional just expanded/collapsed. Re-evaluate
					   marker visibility (the markers inside the
					   optional may now be in the viewport) and
					   re-run the layout. */
					try { _updateMarkerVisibility(); } catch (_) {}
					scheduleLayout(false);
					return;
				}
				if (r.target === document.documentElement &&
					r.attributeName === 'class') {
					scheduleLayout(false);
					return;
				}
			}
		});
		relayoutObserver.observe(document.body, {
			attributes: true,
			attributeFilter: ['style', 'class'],
			subtree: true,
			childList: false
		});
		relayoutObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
			subtree: false,
			childList: false
		});
	}

	function _installSideimageScroll() {
		if (store.images.length === 0) return;
		let ticking = false;
		function onScroll() {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(function () {
				ticking = false;
				layout();
			});
		}
		window.addEventListener('scroll', onScroll, { passive: true });
	}

	/* ═════════════════════════════════════════════════════════════════
	   Hover preview for sidenote markers
	   ═════════════════════════════════════════════════════════════════ */
	function _installHoverPreview() {
		if (!_domReady()) return;
		const tip = document.createElement('div');
		tip.className = 'cl-sn-tip';
		tip.setAttribute('role', 'tooltip');
		document.body.appendChild(tip);
		API.__tip = tip;

		const markers = document.querySelectorAll('.sidenote-marker[data-sn-id]');
		markers.forEach(function (anchor) {
			if (anchor.__snPreviewReady) return;
			anchor.__snPreviewReady = true;
			let timer = 0;
			const show = function () {
				const id = anchor.getAttribute('data-sn-id');
				const note = document.getElementById('sn-' + id);
				if (!note) return;
				const clone = note.cloneNode(true);
				clone.removeAttribute('id');
				/* ANGLE 28: reset positioning on the clone. The
				   original sidenote has position:absolute with
				   top:Ypx in the rail (where Y is the marker's
				   document Y, e.g. 10378). When we clone it into
				   the tip (which is fixed-positioned), the clone
				   keeps those absolute coordinates and ends up
				   far below the visible tip area — so the hover
				   looks empty. Reset position to static, clear
				   inline top/left/right/width, and force display
				   so the content actually shows.                */
				clone.style.position = 'static';
				clone.style.top = 'auto';
				clone.style.left = 'auto';
				clone.style.right = 'auto';
				clone.style.bottom = 'auto';
				clone.style.width = 'auto';
				clone.style.height = 'auto';
				clone.style.display = 'block';
				clone.style.opacity = '1';
				clone.style.transform = 'none';
				/* Also strip the rail-specific classes so the
				   clone doesn't get re-styled by the rail's
				   descendant selectors. */
				clone.classList.remove('sidenote');
				clone.classList.add('sidenote-preview');
				tip.innerHTML = '';
				tip.appendChild(clone);
				let r;
				try { r = anchor.getBoundingClientRect(); } catch (e) { return; }
				const GAP = 8;
				let x = r.right + GAP;
				let y = r.top;
				tip.classList.add('is-visible');
				const tw = tip.offsetWidth;
				const th = tip.offsetHeight;
				if (x + tw > window.innerWidth - 8) x = r.left - GAP - tw;
				if (x < 8) x = 8;
				if (y + th > window.innerHeight - 8) {
					y = Math.max(8, window.innerHeight - th - 8);
				}
				tip.style.left = x + 'px';
				tip.style.top  = y + 'px';
			};
			const hide = function () { tip.classList.remove('is-visible'); };
			const showSoon = function () { clearTimeout(timer); timer = setTimeout(show, 80); };
			const hideSoon = function () {
				clearTimeout(timer);
				timer = setTimeout(function () { hide(); }, 120);
			};
			anchor.addEventListener('mouseenter', showSoon);
			anchor.addEventListener('mouseleave', hideSoon);
			anchor.addEventListener('focus', showSoon);
			anchor.addEventListener('blur',  hideSoon);
			tip.addEventListener('mouseenter', showSoon);
			tip.addEventListener('mouseleave', hideSoon);
		});
	}

	/* ═════════════════════════════════════════════════════════════════
	   Smooth-scroll for marker ↔ sidenote links
	   ═════════════════════════════════════════════════════════════════ */
	function _installSmoothScroll() {
		const links = document.querySelectorAll(
			'.sidenote-ref, .sidenote-backlink, .sideimage-marker'
		);
		links.forEach(function (a) {
			if (a.__snSmooth) return;
			a.__snSmooth = true;
			a.addEventListener('click', function (ev) {
				const href = a.getAttribute('href') || '';
				if (href.charAt(0) !== '#') return;
				const target = document.getElementById(href.substring(1));
				if (!target) return;
				ev.preventDefault();
				const prefersReduced =
					window.matchMedia &&
					window.matchMedia('(prefers-reduced-motion: reduce)').matches;
				const behavior = prefersReduced ? 'auto' : 'smooth';
				let rect;
				try { rect = target.getBoundingClientRect(); } catch (e) { return; }
				const top  = rect.top + window.scrollY - 60;
				try { window.scrollTo({ top: top, behavior: behavior }); }
				catch (_) { window.scrollTo(0, top); }
				try {
					target.classList.add('is-sn-target');
					setTimeout(function () { target.classList.remove('is-sn-target'); }, 900);
				} catch (_) {}
				if (history && history.replaceState) history.replaceState(null, '', href);
			});
		});
	}

	/* ═════════════════════════════════════════════════════════════════
	   Public surface + auto-re-layout
	   ═════════════════════════════════════════════════════════════════ */
	API.extract  = extract;
	API.finalize = finalize;
	API.layout   = layout;

	/* ANGLE 3: Debug commands. From devtools:
	     BlogSidenotes.showAll()   — force-show every sidenote/sideimage
	     BlogSidenotes.hideAll()   — hide them all (back to default)
	     BlogSidenotes.diagnose()  — print full 10-rail report
	     BlogSidenotes.updateVis() — force re-run visibility check now   */
	API.showAll = function () {
		let n = 0;
		/* ANGLE 18: don't force-show rail content if the rail itself
		   is hidden — that would make sidenotes stick at top:0 of the
		   page. Instead, just note that we'd have shown them. */
		const rail = document.getElementById('sidenotes-rail');
		const railVis = rail && rail.offsetParent !== null;
		const ir = document.getElementById('sideimages-rail');
		const irVis = ir && ir.offsetParent !== null;

		if (railVis) {
			store.notes.forEach(function (entry) {
				const note = document.querySelector(
					'.sidenote[data-sn-id="' + entry.id + '"]');
				if (note) {
					note.classList.add('is-visible');
					note.style.opacity = '1';
					note.style.transform = 'none';
					note.style.display = 'block';
					note.style.visibility = 'visible';
					visibilityMap[entry.id] = true;
					n++;
				}
			});
		}
		if (irVis) {
			store.images.forEach(function (entry) {
				/* ANGLE 22: only force-show margin-mode figures that
				   actually live in the rail. Inline-mode figures
				   (\sideimage) are already in the article flow; their
				   positioning is by the marker, not by showAll. */
				if (entry.mode !== 'margin') return;
				const fig = document.querySelector(
					'.sideimage[data-si-mode="margin"][data-si-id="' + entry.id + '"]');
				if (fig) {
					fig.classList.add('is-visible');
					fig.style.opacity = '1';
					fig.style.transform = 'none';
					fig.style.display = 'flex';
					fig.style.visibility = 'visible';
					visibilityMap[entry.id] = true;
					n++;
				}
			});
		}
		console.info('[BlogSidenotes] showAll(): rail=' + (railVis ? 'visible' : 'hidden') +
			', sideimages-rail=' + (irVis ? 'visible' : 'hidden') +
			'. Forced ' + n + ' annotations visible.');
	};
	API.hideAll = function () {
		let n = 0;
		document.querySelectorAll('.sidenote, .sideimage').forEach(function (el) {
			el.classList.remove('is-visible');
			el.style.opacity = '0';
			n++;
		});
		store.notes.forEach(function (entry) { visibilityMap[entry.id] = false; });
		store.images.forEach(function (entry) { visibilityMap[entry.id] = false; });
		console.info('[BlogSidenotes] hideAll(): hid ' + n + ' annotations.');
	};
	API.updateVis = function () {
		_updateMarkerVisibility();
		console.info('[BlogSidenotes] updateVis(): ran immediate visibility check.');
	};

	/* ═════════════════════════════════════════════════════════════════
	   DIAGNOSE — run all 10 guardrails and print a complete report
	   of every marker, every rail, every sidenote, and any
	   inconsistency.  Call from devtools as `BlogSidenotes.diagnose()`.
	   ═════════════════════════════════════════════════════════════════ */
	function diagnose() {
		const lines = [];
		const add = function (msg) { lines.push(msg); };

		add('╔══════════════════════════════════════════════════════════════════════');
		add('║ BlogSidenotes.diagnose() — full report');
		add('╠══════════════════════════════════════════════════════════════════════');

		/* ── Environment ──────────────────────────────────────────── */
		add('  ENVIROMENT');
		add('    document.readyState:    ' + document.readyState);
		add('    window.innerWidth:      ' + window.innerWidth + 'px');
		add('    window.innerHeight:     ' + window.innerHeight + 'px');
		add('    BREAKPOINT:             ' + BREAKPOINT + 'px (rail visible? ' +
			(window.innerWidth >= BREAKPOINT ? 'YES' : 'NO — narrow viewport') + ')');
		add('    document.fonts.ready:   ' + (document.fonts ? document.fonts.status : 'n/a'));
		add('    IntersectionObserver:   ' + (typeof window.IntersectionObserver));
		add('    MutationObserver:       ' + (typeof window.MutationObserver));
		add('    window.marked:          ' + (typeof window.marked));
		add('    window.bibData:         ' + (typeof window.bibData) +
			(window.bibData ? ' (' + Object.keys(window.bibData).length + ' entries)' : ''));

		/* ── GUARD RAIL G1: NO_MARKER_IN_DOM ─────────────────────── */
		const allMarkers = document.querySelectorAll('.sidenote-marker[data-sn-id]');
		const allSideimgs = document.querySelectorAll('.sideimage-marker[data-si-id]');
		add('');
		add('  GUARD G1 — NO_MARKER_IN_DOM');
		add('    .sidenote-marker elements in DOM: ' + allMarkers.length);
		add('    .sideimage-marker elements in DOM: ' + allSideimgs.length);
		/* ANGLE 30: break down by mode so we can verify that
		   \sideimage[inline], \sideimage[float], and \marginfig
		   are all wired correctly. */
		const inlineMarkers = document.querySelectorAll('.sideimage-marker.sideimage-mode-inline');
		const floatMarkers = document.querySelectorAll('.sideimage-marker.sideimage-mode-float');
		const marginMarkers = document.querySelectorAll('.sideimage-marker.sideimage-mode-margin');
		add('      ↳ mode=inline: ' + inlineMarkers.length +
			'    mode=float: ' + floatMarkers.length +
			'    mode=margin: ' + marginMarkers.length);
		store.images.forEach(function (entry) {
			add('      ↳ sideimage #' + entry.id + ': mode=' + entry.mode +
				' url=' + (entry.url ? entry.url.substring(0, 60) : '?') +
				(entry.url && entry.url.length > 60 ? '…' : ''));
		});

		/* ── GUARD RAIL G4: BIBTEXIFY_DROPPED_MARKER ─────────────── */
		/*  We compare the count of markers in DOM vs. the count of
		    sidenotes that we tracked in extract(). If a marker was in
		    the container before bibtexify but not now, bibtexify ate it. */
		add('');
		add('  GUARD G4 — BIBTEXIFY_DROPPED_MARKER');
		const expectedSnIds = store.notes.map(function (e) { return e.id; });
		const foundSnIds = [];
		allMarkers.forEach(function (m) {
			const id = parseInt(m.getAttribute('data-sn-id'), 10);
			if (!Number.isNaN(id)) foundSnIds.push(id);
		});
		const missingSnIds = expectedSnIds.filter(function (id) {
			return foundSnIds.indexOf(id) === -1;
		});
		add('    Expected sidenote IDs (from extract):  [' + expectedSnIds.join(', ') + ']');
		add('    Found sidenote IDs (in DOM now):       [' + foundSnIds.join(', ') + ']');
		if (missingSnIds.length) {
			add('    ✘ MISSING IN DOM: [' + missingSnIds.join(', ') + '] — ' +
				'bibtexify() or renderMarkdown() removed the marker. ' +
				'Check that the marker HTML is well-formed and survives marked.parse.');
		} else {
			add('    ✓ All expected markers are in the DOM.');
		}

		/* ── GUARD RAIL G5: MARKED_DROPPED_MARKER (same as G4, but
		   specifically pointing at marked.js) ────────────────── */

		/* ── GUARD RAIL G6: GBCR_INVALID ────────────────────────── */
		add('');
		add('  GUARD G6 — GBCR_INVALID (getBoundingClientRect sanity)');
		store.notes.forEach(function (entry) {
			if (!entry.marker) {
				add('    ✘ Sidenote #' + entry.id + ' has no marker reference.');
				return;
			}
			if (!document.contains(entry.marker)) {
				add('    ⚠ Sidenote #' + entry.id + ' marker is DETACHED from the DOM.');
				return;
			}
			let r;
			try { r = entry.marker.getBoundingClientRect(); }
			catch (err) {
				add('    ✘ Sidenote #' + entry.id + ' marker.getBoundingClientRect threw: ' + err.message);
				return;
			}
			const ok = Number.isFinite(r.top) && Number.isFinite(r.left) &&
			           r.width >= 0 && r.height >= 0;
			add('    ' + (ok ? '✓' : '✘') + ' Sidenote #' + entry.id +
				' marker rect: top=' + r.top.toFixed(1) + 'px, left=' + r.left.toFixed(1) +
				'px, w=' + r.width.toFixed(1) + 'px, h=' + r.height.toFixed(1) + 'px' +
				(!ok ? '   ← INVALID — check for display:none ancestor or 0×0 container.' : ''));
		});
		store.images.forEach(function (entry) {
			if (!entry.marker) {
				add('    ✘ Sideimage #' + entry.id + ' has no marker reference.');
				return;
			}
			if (!document.contains(entry.marker)) {
				add('    ⚠ Sideimage #' + entry.id + ' marker is DETACHED from the DOM.');
				return;
			}
			let r;
			try { r = entry.marker.getBoundingClientRect(); }
			catch (err) {
				add('    ✘ Sideimage #' + entry.id + ' marker.getBoundingClientRect threw: ' + err.message);
				return;
			}
			const ok = Number.isFinite(r.top) && Number.isFinite(r.left) &&
			           r.width >= 0 && r.height >= 0;
			add('    ' + (ok ? '✓' : '✘') + ' Sideimage #' + entry.id + ' (mode=' + entry.mode +
				', size=' + (entry.size || 'normal') + ') marker rect: top=' + r.top.toFixed(1) +
				'px, left=' + r.left.toFixed(1) + 'px, w=' + r.width.toFixed(1) + 'px, h=' +
				r.height.toFixed(1) + 'px' +
				(!ok ? '   ← INVALID — check for display:none ancestor.' : ''));
		});

		/* ── GUARD RAIL G7: Y_OUT_OF_BOUNDS ─────────────────────── */
		add('');
		add('  GUARD G7 — Y_OUT_OF_BOUNDS (marker position vs. expected)');
		const pageHeight = Math.max(
			document.body.scrollHeight, document.documentElement.scrollHeight
		);
		add('    Page height: ' + pageHeight + 'px   (max allowed: ' + MAX_Y + 'px)');
		store.notes.forEach(function (entry) {
			if (!entry.marker || !document.contains(entry.marker)) return;
			let r;
			try { r = entry.marker.getBoundingClientRect(); }
			catch (e) { return; }
			const y = r.top + window.scrollY;
			const inRange = y >= 0 && y <= Math.min(MAX_Y, pageHeight + 1000);
			add('    ' + (inRange ? '✓' : '✘') + ' Sidenote #' + entry.id + ' marker Y = ' +
				y.toFixed(0) + 'px' + (inRange ? '' :
					'   ← OUT OF BOUNDS. The marker is outside the expected range — ' +
					'this usually means the page hasn\'t laid out yet, or the ' +
					'marker is inside a hidden container.'));
		});

		/* ── GUARD RAIL G8: RAIL_NOT_FOUND ───────────────────────── */
		add('');
		add('  GUARD G8 — RAIL_NOT_FOUND');
		const rail = document.getElementById('sidenotes-rail');
		const ir   = document.getElementById('sideimages-rail');
		const main = document.getElementById('contents');
		add('    #contents:           ' + (main ? 'present' : '✘ MISSING'));
		add('    #sidenotes-rail:     ' + (rail ? 'present (h=' + (rail ? rail.offsetHeight : '?') + 'px)' : '✘ MISSING'));
		add('    #sideimages-rail:    ' + (ir   ? 'present' : '✘ MISSING (only matters if sideimages are used)'));
		if (rail) {
			const rv = rail.offsetParent !== null;
			add('    #sidenotes-rail visibility: ' + (rv ? 'visible' : 'hidden (display:none)'));
		}

		/* ── GUARD RAIL G9: SIDENOTE_NOT_FOUND_IN_RAIL ──────────── */
		add('');
		add('  GUARD G9 — SIDENOTE_NOT_FOUND_IN_RAIL');
		if (!rail) {
			add('    ✘ No rail to check.');
		} else {
			store.notes.forEach(function (entry) {
				const note = rail.querySelector('.sidenote[data-sn-id="' + entry.id + '"]');
				if (!note) {
					add('    ✘ Sidenote #' + entry.id + ': rail has no .sidenote[data-sn-id="' +
						entry.id + '"] — _copyNotes() did not place this element.');
				} else {
					const cs = window.getComputedStyle(note);
					const visible = cs.display !== 'none' && cs.visibility !== 'hidden' &&
						cs.opacity !== '0';
					let bodyTextLen = 0;
					const body = note.querySelector('.sidenote-body');
					if (body) bodyTextLen = (body.textContent || '').length;
					add('    ✓ Sidenote #' + entry.id + ' present in rail. ' +
						'display=' + cs.display + ', opacity=' + cs.opacity +
						', top=' + note.style.top + ', height=' + note.offsetHeight + 'px' +
						', body chars=' + bodyTextLen +
						(visible ? ' (currently visible)' : ' (currently invisible)'));
				}
			});
		}

		/* ── ANGLE 27: detailed position report for sidenotes ──── */
		add('');
		add('  GUARD G11 — SIDENOTE_POSITION (where they actually live)');
		if (!rail) {
			add('    ✘ No rail.');
		} else {
			store.notes.forEach(function (entry) {
				const note = rail.querySelector('.sidenote[data-sn-id="' + entry.id + '"]');
				if (!note) { add('    ✘ Sidenote #' + entry.id + ' not in rail.'); return; }
				const marker = _refreshMarker(entry, 'note');
				let markerY = '?';
				if (marker) {
					let r;
					try { r = marker.getBoundingClientRect(); markerY = (r.top + window.scrollY).toFixed(0); }
					catch (_) { markerY = 'gBCR threw'; }
				} else {
					markerY = 'NO MARKER';
				}
				const rendered = marker ? _isRendered(marker) : false;
				add('    Sidenote #' + entry.id + ': markerY=' + markerY +
					', marker-rendered=' + (rendered ? 'yes' : 'NO (collapsed optional?)') +
					', note-top=' + note.style.top +
					', note-height=' + note.offsetHeight + 'px' +
					', visibilityMap=' + visibilityMap[entry.id]);
			});
		}

		/* ── ANGLE 27: detailed position report for sideimages ─── */
		add('');
		add('  GUARD G12 — SIDEIMAGE_POSITION (where they actually live)');
		const irEl = document.getElementById('sideimages-rail');
		if (!irEl) {
			add('    ✘ No sideimages-rail.');
		} else {
			store.images.forEach(function (entry) {
				if (entry.mode !== 'margin') {
					/* inline OR float: figure should NOT be in the rail */
					const railFig = irEl.querySelector(
						'.sideimage[data-si-id="' + entry.id + '"]'
					);
					const anyFig = document.querySelector(
						'.sideimage[data-si-id="' + entry.id + '"]'
					);
					if (!anyFig) {
						add('    ✘ ' + entry.mode + ' sideimage #' + entry.id + ' not in DOM at all.');
						return;
					}
					let r;
					try { r = anyFig.getBoundingClientRect(); } catch (_) { r = null; }
					const inRail = railFig === anyFig;
					const cs = window.getComputedStyle(anyFig);
					const label = entry.mode === 'float' ? 'Float sideimage' : 'Inline sideimage';
					add('    ' + label + ' #' + entry.id + ' (size=' + (entry.size || 'normal') +
						'): ' + (inRail ? '⚠ WRONGLY IN RAIL' : '✓ in article flow') +
						', position=' + cs.position +
						', float=' + cs.float +
						', display=' + cs.display +
						', top=' + (r ? r.top.toFixed(0) : '?') +
						', left=' + (r ? r.left.toFixed(0) : '?') +
						', w=' + (r ? r.width.toFixed(0) : '?') + 'px' +
						', h=' + (r ? r.height.toFixed(0) : '?') + 'px');
					return;
				}
				const fig = irEl.querySelector(
					'.sideimage[data-si-id="' + entry.id + '"]'
				);
				if (!fig) { add('    ✘ Margin sideimage #' + entry.id + ' not in rail.'); return; }
				const cs = window.getComputedStyle(fig);
				const marker = _refreshMarker(entry, 'image');
				let markerY = '?';
				if (marker) {
					let r;
					try { r = marker.getBoundingClientRect(); markerY = (r.top + window.scrollY).toFixed(0); }
					catch (_) { markerY = 'gBCR threw'; }
				} else {
					markerY = 'NO MARKER';
				}
				const rendered = marker ? _isRendered(marker) : false;
				add('    Margin sideimage #' + entry.id + ' (size=' + (entry.size || 'normal') +
					'): markerY=' + markerY +
					', marker-rendered=' + (rendered ? 'yes' : 'NO') +
					', position=' + cs.position +
					', top=' + cs.top +
					', right=' + cs.right +
					', width=' + cs.width +
					', height=' + fig.offsetHeight + 'px' +
					', visibilityMap=' + visibilityMap[entry.id]);
			});
		}

		/* ── ANGLE 27: viewport & scroll state ──────────────────── */
		add('');
		add('  VIEWPORT');
		add('    window.scrollY:        ' + window.scrollY + 'px');
		add('    window.innerHeight:    ' + window.innerHeight + 'px');
		add('    viewport top:          ' + window.scrollY + 'px');
		add('    viewport bottom:       ' + (window.scrollY + window.innerHeight) + 'px');

		/* ── ANGLE 27: active-marker report — what's currently on screen ─ */
		add('');
		add('  ACTIVE MARKERS (currently in viewport)');
		store.notes.forEach(function (entry) {
			if (visibilityMap[entry.id] === true) {
				const marker = _refreshMarker(entry, 'note');
				let y = '?';
				if (marker) {
					let r;
					try { r = marker.getBoundingClientRect(); y = (r.top + window.scrollY).toFixed(0); }
					catch (_) {}
				}
				add('    ✓ Sidenote #' + entry.id + ' marker is ON SCREEN (page Y=' + y + ')');
			}
		});
		store.images.forEach(function (entry) {
			if (visibilityMap[entry.id] === true) {
				const marker = _refreshMarker(entry, 'image');
				let y = '?';
				if (marker) {
					let r;
					try { r = marker.getBoundingClientRect(); y = (r.top + window.scrollY).toFixed(0); }
					catch (_) {}
				}
				add('    ✓ Sideimage #' + entry.id + ' marker is ON SCREEN (page Y=' + y + ')');
			}
		});

		/* ── ANGLE 27: sidenotes-rail contents ──────────────────── */
		add('');
		add('  SIDENOTES-RAIL CONTENTS');
		if (rail) {
			add('    rail.offsetHeight:     ' + rail.offsetHeight + 'px');
			add('    rail.style.height:     ' + rail.style.height);
			add('    children in rail:      ' + rail.children.length);
			Array.from(rail.children).forEach(function (child) {
				add('      ↳ ' + child.tagName + '.' + child.className +
					' (id=' + child.id + ', h=' + child.offsetHeight + 'px, top=' + child.style.top + ')');
			});
		}
		add('');
		add('  SIDEIMAGES-RAIL CONTENTS');
		if (irEl) {
			add('    rail.offsetHeight:     ' + irEl.offsetHeight + 'px');
			add('    rail.style.minHeight:  ' + irEl.style.minHeight);
			add('    children in rail:      ' + irEl.children.length);
			Array.from(irEl.children).forEach(function (child) {
				add('      ↳ ' + child.tagName + '.' + child.className +
					' (id=' + child.id + ', h=' + child.offsetHeight + 'px, position=' +
					window.getComputedStyle(child).position + ')');
			});
		}

		/* ── ANGLE 36: MARGINFIG PLACEMENT (margin / wrap / inline) ── */
		/*  Reports the live rail↔text geometry and which home every
		    \marginfig is currently in, so the margin/wrap boundary can
		    be verified by eye from the console. */
		add('');
		add('  ANGLE 36 — MARGINFIG PLACEMENT (margin / wrap / inline)');
		{
			const mainEl = document.getElementById('contents');
			const railEl = document.getElementById('sideimages-rail');
			const m = (railEl && mainEl) ? _measureRailOverlap(railEl) : null;
			if (!m) {
				add('    ⚠ Could not measure rail↔text geometry ' +
					'(missing #contents or #sideimages-rail, or measurement threw).');
			} else {
				const state = m.overlap >= WRAP_ENTER ? 'WRAP (intruding)' :
				              (m.overlap <= -WRAP_EXIT ? 'MARGIN (clear)' : 'Hysteresis band (keep current)');
				add('    viewport width:        ' + window.innerWidth + 'px');
				add('    #contents right edge:  ' + m.articleRight.toFixed(1) + 'px (content box)');
				add('    rail left edge:        ' + m.railLeft.toFixed(1) + 'px');
				add('    rail right edge:       ' + m.railRight.toFixed(1) + 'px');
				add('    overlap (text−rail):   ' + m.overlap.toFixed(1) + 'px   ' +
					(m.overlap > 0 ? '→ rail intrudes into the text' : '→ rail clear of the text'));
				add('    hysteresis band:       enter wrap ≥ +' + WRAP_ENTER +
					'px, leave wrap ≤ −' + WRAP_EXIT + 'px');
				add('    sideimageWrapActive:   ' + sideimageWrapActive);
				add('    → current decision:    ' + state);
			}
			store.images.forEach(function (entry) {
				if (entry.mode !== 'margin') return;
				let fig = null;
				try { fig = document.querySelector('.sideimage[data-si-id="' + entry.id + '"]'); }
				catch (_) {}
				if (!fig) {
					add('    ✘ \\marginfig #' + entry.id + ': figure not in DOM.');
					return;
				}
				const inRail   = railEl ? (fig.parentNode === railEl) : false;
				const isWrap   = fig.classList.contains('sideimage-wrap');
				const isInline = fig.classList.contains('sideimage-inline');
				const home = inRail ? 'rail (margin)' : (isWrap ? 'flow (wrap/float)' : (isInline ? 'flow (inline)' : 'flow (unclassified)'));
				const cs = window.getComputedStyle(fig);
				let r = null;
				try { r = fig.getBoundingClientRect(); } catch (_) {}
				add('    \\marginfig #' + entry.id + ' (size=' + (entry.size || 'normal') +
					'): home=' + home +
					', float=' + cs.float +
					', width=' + (r ? Math.round(r.width) : '?') + 'px' +
					', left=' + (r ? Math.round(r.left) : '?') +
					', right=' + (r ? Math.round(r.right) : '?') + 'px');
			});
		}

		/* ── GUARD RAIL G10: VISIBILITY_STALE ────────────────────── */
		add('');
		add('  GUARD G10 — VISIBILITY_STALE (map vs. class consistency)');
		if (!rail) {
			add('    ✘ No rail to check.');
		} else {
			store.notes.forEach(function (entry) {
				const note = rail.querySelector('.sidenote[data-sn-id="' + entry.id + '"]');
				if (!note) return;
				const mapSays = visibilityMap[entry.id];
				const classSays = note.classList.contains('is-visible');
				const consistent = (mapSays === classSays) ||
					(mapSays === undefined && !classSays);
				add('    ' + (consistent ? '✓' : '✘') + ' Sidenote #' + entry.id +
					': visibilityMap=' + mapSays + ', .is-visible=' + classSays +
					(consistent ? '' : '   ← STALE — these disagree. ' +
						'This can happen transiently during IntersectionObserver reruns.'));
			});
		}

		add('');
		add('╚══════════════════════════════════════════════════════════════════════');
		try {
			console.log(lines.join('\n'));
		} catch (_) {
			alert(lines.join('\n'));
		}
	}
	API.diagnose = diagnose;

	function _onResize() { scheduleLayout(false); }
	window.addEventListener('resize', _onResize);
	window.addEventListener('load',   function () { scheduleLayout(false); });
	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(function () { scheduleLayout(false); });
	}
	window.addEventListener('blogPostLoadComplete', function () {
		scheduleLayout(true);
	});

	/* Guard #28: surface uncaught errors from inside our module. */
	window.addEventListener('error', function (ev) {
		if (ev && ev.error && /sidenote|sideimage/i.test(ev.error.stack || '')) {
			logError('UNCAUGHT', 'Uncaught error in margin-annotation pipeline:', ev.error);
		}
	});

	API.__installed = true;
	API.__version = '2.1';
	window.BlogSidenotes = API;

	/* One-time hint about how to debug.  Only logged when ?sn-debug=1
	   is in the URL — keeps the console clean for normal visitors. */
	if (typeof window !== 'undefined' && /[?&]sn-debug=1\b/.test(window.location.search)) {
		try {
			console.info(
				'%c[BlogSidenotes] debug mode',
				'color:#6366f1;font-weight:bold',
				'\nBlogSidenotes.showAll()     — force-show every sidenote/sideimage (ANGLE 5 fallback)\n' +
				'BlogSidenotes.hideAll()     — hide them all (back to default)\n' +
				'BlogSidenotes.updateVis()   — force an immediate visibility check\n' +
				'BlogSidenotes.diagnose()    — print full 10-rail report\n' +
				'BlogSidenotes.layout()      — force a re-layout\n' +
				'BlogSidenotes.finalize()    — re-run the postprocess pipeline'
			);
		} catch (_) {}
	}
})();
