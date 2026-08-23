/* ════════════════════════════════════════════════════════════════
   POLISH — small, native-feeling touches that make a long
   technical book easier and more pleasant to work through.

   • ¶ anchor links on every heading, visible on hover
   • TOC scroll-spy: the section you're reading lights up
   • Code blocks show their language as a quiet corner label
   • Keyboard shortcuts (1-9 jump, / search, ? help, j/k nav)
   • Quiet word-count + reading-time stamp at the top of each module
   • A back-to-top chevron that only appears after 60% scroll
   • Anything else that needs a pinch of JS lives here too.

   No external dependencies. Runs once on DOMContentLoaded and
   again after late content swaps (MathJax, modules, etc.).
   ════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	/* ── 1. Heading anchors ──
	   For every H1–H6 inside `.md`, prepend a `#` link that
	   copies the section URL to the clipboard on click.
	   The link is invisible until the heading is hovered. */
	function installHeadingAnchors(root) {
		const headings = (root || document).querySelectorAll(
			'.md h1, .md h2, .md h3, .md h4, .md h5, .md h6'
		);
		headings.forEach(function (h) {
			if (h.id) return;                    // already has an id
			if (h.querySelector(':scope > .cl-h-anchor')) return;
			const text = (h.textContent || '').trim();
			if (!text) return;
			const slug = slugify(text);
			if (!slug) return;
			h.id = slug;
			const a = document.createElement('a');
			a.className = 'cl-h-anchor';
			a.href = '#' + slug;
			a.setAttribute('aria-label', 'Permalink to ' + text);
			a.textContent = '#';
			a.addEventListener('click', function (ev) {
				if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return; // let users open in new tab
				ev.preventDefault();
				h.scrollIntoView({ behavior: 'smooth', block: 'start' });
				history.replaceState(null, '', '#' + slug);
			});
			h.insertBefore(a, h.firstChild);
		});
	}

	function slugify(text) {
		return text
			.toLowerCase()
			.replace(/[‘’]/g, "'")
			.replace(/[^\w\s\-·]+/g, '')
			.replace(/[\s·]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 80);
	}

	/* ── 2. TOC scroll-spy ──
	   When the TOC exists, mark the LI whose section is currently
	   in view. Uses IntersectionObserver so it costs nothing
	   while idle. */
	function installTocScrollSpy() {
		const tocRoot = document.getElementById('toc');
		if (!tocRoot) return;
		const headings = document.querySelectorAll(
			'.md h1, .md h2, .md h3, .md h4'
		);
		if (!headings.length) return;

		const linkByHeading = new Map();
		const links = tocRoot.querySelectorAll('a');
		links.forEach(function (a) {
			const id = (a.getAttribute('href') || '').replace(/^#/, '');
			if (!id) return;
			const h = document.getElementById(id);
			if (h) linkByHeading.set(h, a.closest('li'));
		});
		if (!linkByHeading.size) return;

		let current = null;
		function setCurrent(h) {
			const li = linkByHeading.get(h);
			if (!li || li === current) return;
			if (current) current.classList.remove('toc-current');
			li.classList.add('toc-current');
			current = li;
			// ensure the active item is visible in the TOC
			try {
				const tocRect = tocRoot.getBoundingClientRect();
				const liRect = li.getBoundingClientRect();
				if (liRect.top < tocRect.top || liRect.bottom > tocRect.bottom) {
					li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
				}
			} catch (e) { /* noop */ }
		}

		const io = new IntersectionObserver(function (entries) {
			// pick the topmost intersecting heading
			const visible = entries
				.filter(function (e) { return e.isIntersecting; })
				.sort(function (a, b) {
					return a.boundingClientRect.top - b.boundingClientRect.top;
				});
			if (visible.length) {
				setCurrent(visible[0].target);
			}
		}, { rootMargin: '-15% 0px -65% 0px', threshold: [0, 0.5, 1] });

		headings.forEach(function (h) {
			if (linkByHeading.has(h)) io.observe(h);
		});
	}

	/* ── 3. Code-block language label ──
	   Prism already adds `language-xxx` to the inner <code>.
	   We surface that as `data-language` on the <pre>, so the
	   CSS can render a tiny label in the corner. */
	function labelCodeBlocks(root) {
		const pres = (root || document).querySelectorAll('.md pre');
		pres.forEach(function (pre) {
			if (pre.dataset.language) return;
			const code = pre.querySelector('code');
			if (!code) return;
			const m = (code.className || '').match(/language-([\w-]+)/);
			if (!m) return;
			const lang = m[1];
			if (lang === 'none' || lang === 'plain' || lang === 'text') return;
			pre.dataset.language = lang;
			pre.setAttribute('data-language', lang);
		});
	}

	/* ── 4. Keyboard shortcuts (invisible until you press them) ──
	     /     → focus the search box (if present)
	     ?     → show a small overlay of all shortcuts
	     Esc   → close any open modal/drawer
	     g g   → jump to top of the page
	     G     → jump to bottom
	     1-9   → jump to the Nth item in the TOC
	     n / p → next / previous section in the TOC
	   We only activate when the user is not typing in an input. */
	function installShortcuts() {
		const help = ensureShortcutHelp();
		const isEditable = function (el) {
			if (!el) return false;
			const tag = (el.tagName || '').toLowerCase();
			if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
			if (el.isContentEditable) return true;
			return false;
		};

		let lastG = 0;
		document.addEventListener('keydown', function (ev) {
			if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
			if (isEditable(ev.target)) return;

			// "/" focuses search
			if (ev.key === '/') {
				ev.preventDefault();
				const s = document.querySelector('input[type="search"], .search-input, #search-input, [data-search-input]');
				if (s) { s.focus(); s.select && s.select(); }
				return;
			}

			// "?" opens help (Shift+/ on most layouts)
			if (ev.key === '?' || (ev.shiftKey && ev.key === '/')) {
				ev.preventDefault();
				help.toggle();
				return;
			}

			// Esc closes everything
			if (ev.key === 'Escape') {
				help.hide();
				document.querySelectorAll('.drawer-backdrop.show, .search-overlay.show, [aria-modal="true"]')
					.forEach(function (el) { el.click && el.click(); });
				return;
			}

			// "g g" → top, "G" → bottom
			if (ev.key === 'g' && !ev.shiftKey) {
				const now = Date.now();
				if (now - lastG < 500) {
					window.scrollTo({ top: 0, behavior: 'smooth' });
					lastG = 0;
					return;
				}
				lastG = now;
				return;
			}
			if (ev.key === 'G') {
				window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
				return;
			}

			// 1-9 → Nth TOC item
			if (/^[1-9]$/.test(ev.key)) {
				const links = document.querySelectorAll('#toc a');
				if (links.length) {
					const target = links[Math.min(links.length, parseInt(ev.key, 10)) - 1];
					if (target) { ev.preventDefault(); target.click(); }
				}
				return;
			}

			// n / p → next / previous TOC section
			if (ev.key === 'n' || ev.key === 'p') {
				const links = Array.from(document.querySelectorAll('#toc a'));
				if (!links.length) return;
				const tops = links.map(function (a) {
					const id = (a.getAttribute('href') || '').replace(/^#/, '');
					const h = id ? document.getElementById(id) : null;
					return { a: a, y: h ? h.getBoundingClientRect().top + window.scrollY : Infinity };
				});
				const y = window.scrollY;
				let next = null;
				if (ev.key === 'n') {
					next = tops.find(function (t) { return t.y > y + 80; });
				} else {
					for (let i = tops.length - 1; i >= 0; i--) {
						if (tops[i].y < y - 80) { next = tops[i]; break; }
					}
				}
				if (next) { ev.preventDefault(); next.a.click(); }
			}
		});

		// also: Esc closes the help if it's open
		document.addEventListener('keydown', function (ev) {
			if (ev.key === 'Escape' && !help.hidden) help.hide();
		});
	}

	function ensureShortcutHelp() {
		let el = document.getElementById('cl-shortcut-help');
		if (el) return makeHelpApi(el);
		el = document.createElement('div');
		el.id = 'cl-shortcut-help';
		el.setAttribute('role', 'dialog');
		el.setAttribute('aria-label', 'Keyboard shortcuts');
		el.hidden = true;
		el.innerHTML = [
			'<div class="cl-sh-card">',
			'  <div class="cl-sh-head">Keyboard shortcuts</div>',
			'  <dl class="cl-sh-list">',
			'    <dt><kbd>/</kbd></dt><dd>Focus the search box</dd>',
			'    <dt><kbd>?</kbd></dt><dd>Show / hide this panel</dd>',
			'    <dt><kbd>Esc</kbd></dt><dd>Close any open panel</dd>',
			'    <dt><kbd>g</kbd> <kbd>g</kbd></dt><dd>Jump to top</dd>',
			'    <dt><kbd>G</kbd></dt><dd>Jump to bottom</dd>',
			'    <dt><kbd>n</kbd> / <kbd>p</kbd></dt><dd>Next / previous section</dd>',
			'    <dt><kbd>1</kbd>…<kbd>9</kbd></dt><dd>Jump to Nth section</dd>',
			'  </dl>',
			'  <div class="cl-sh-foot">Press <kbd>?</kbd> again to close</div>',
			'</div>'
		].join('');
		document.body.appendChild(el);
		return makeHelpApi(el);
	}

	function makeHelpApi(el) {
		return {
			el: el,
			hidden: true,
			toggle: function () { el.hidden ? this.show() : this.hide(); },
			show:   function () { el.hidden = false; this.hidden = false; },
			hide:   function () { el.hidden = true;  this.hidden = true;  }
		};
	}

	/* ── 6. Word count + reading time, set on the H1 ──
	   Reading speed ~ 220 wpm for technical prose. Result is a
	   small `data-reading-meta` attribute the CSS can render as
	   a muted caption if it wants to (or just leave it). */
	function installReadingMeta() {
		// The page title is rendered directly inside #contents by
		// functions.php — NOT inside a .md block — so look there first.
		const h1 = document.querySelector('#contents > h1') || document.querySelector('.md h1');
		if (!h1) return;
		if (h1.dataset.readingTime) return; // already set
		let text = '';
		document.querySelectorAll('.md').forEach(function (md) {
			text += (md.textContent || '') + ' ';
		});
		text = text.trim();
		const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
		const minutes = Math.max(1, Math.round(words / 220));
		h1.setAttribute('data-words', String(words));
		h1.setAttribute('data-reading-time', String(minutes));
		document.documentElement.setAttribute('data-reading-time', String(minutes));
	}

	/* ── 6b. Copy-code button on every <pre> ──
	   Small text label in the corner that appears on hover.
	   Click → copies code to clipboard, briefly swaps to "copied".
	   Falls back to a textarea-based copy on older browsers. */
	function installCopyButtons(root) {
		const pres = (root || document).querySelectorAll('.md pre');
		pres.forEach(function (pre) {
			if (pre.dataset.copyReady) return;
			pre.dataset.copyReady = '1';
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'cl-copy';
			btn.textContent = 'copy';
			btn.setAttribute('aria-label', 'Copy code to clipboard');
			btn.addEventListener('click', function (ev) {
				ev.stopPropagation();
				const code = pre.querySelector('code') || pre;
				const text = code.innerText.replace(/\u00a0/g, ' ');
				const done = function (ok) {
					const orig = btn.textContent;
					btn.textContent = ok ? 'copied' : 'failed';
					btn.classList.toggle('is-ok', !!ok);
					clearTimeout(btn.__t);
					btn.__t = setTimeout(function () {
						btn.textContent = orig;
						btn.classList.remove('is-ok');
					}, 1400);
				};
				if (navigator.clipboard && navigator.clipboard.writeText) {
					navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
				} else {
					const ta = document.createElement('textarea');
					ta.value = text;
					ta.style.position = 'fixed';
					ta.style.opacity = '0';
					document.body.appendChild(ta);
					ta.select();
					let ok = false;
					try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
					document.body.removeChild(ta);
					done(ok);
				}
			});
			pre.appendChild(btn);
		});
	}

	/* ── 6b.5. Heading anchor — click copies URL, with feedback ──
	   Hover any heading shows its `#` link. Click → scrolls AND
	   copies the full URL (with hash) to clipboard. Brief `copied`
	   text replaces the `#` so you know it worked. */
	function upgradeHeadingAnchors(root) {
		(root || document).querySelectorAll('.md .cl-h-anchor').forEach(function (a) {
			if (a.dataset.copyReady) return;
			a.dataset.copyReady = '1';
			a.title = 'Copy link to this section';
			a.addEventListener('click', function (ev) {
				if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
				ev.preventDefault();
				const h = a.parentNode;
				if (!h || !h.id) return;
				const url = location.origin + location.pathname + '#' + h.id;
				const target = h;
				const orig = a.textContent;
				const restore = function () {
					a.textContent = orig;
					a.classList.remove('is-ok');
				};
				const ok = function () {
					a.textContent = 'copied';
					a.classList.add('is-ok');
					clearTimeout(a.__t);
					a.__t = setTimeout(restore, 1100);
				};
				target.scrollIntoView({ behavior: 'smooth', block: 'start' });
				history.replaceState(null, '', '#' + h.id);
				if (navigator.clipboard && navigator.clipboard.writeText) {
					navigator.clipboard.writeText(url).then(ok, restore);
				} else {
					const ta = document.createElement('textarea');
					ta.value = url;
					ta.style.position = 'fixed';
					ta.style.opacity = '0';
					document.body.appendChild(ta);
					ta.select();
					let r = false;
					try { r = document.execCommand('copy'); } catch (e) { r = false; }
					document.body.removeChild(ta);
					if (r) ok(); else restore();
				}
			});
		});
	}

	/* ── 6c/6d shared: hover preview tooltips ──
	   Both the footnote and citation hover previews used to live inside
	   the anchor's parent node. That put them inside whatever stacking
	   context the surrounding animated quote/figure created (quoteReveal,
	   imgReveal keep a transform via fill-mode:both), so the tip's
	   z-index was trapped beneath following text.
	   Fix: portal each tooltip to <body>, position it with position:fixed
	   from the anchor's viewport rect, and temporarily neutralize any
	   ancestor that would create a containing block for fixed positioning.
	   This is the same guardrailed pattern the glossary tooltip uses. */

	var _previewSavedStyles = new WeakMap();

	function neutralizeContainingBlock(el) {
		var node = el;
		var stack = [];
		var props = ['transform', 'filter', 'backdropFilter', 'perspective',
			'clipPath', 'mask', 'maskImage', 'willChange', 'contain'];
		while (node && node !== document.documentElement) {
			var cs = window.getComputedStyle(node);
			var saved = _previewSavedStyles.get(node) || {};
			var touched = false;
			for (var i = 0; i < props.length; i++) {
				var p = props[i];
				var v = cs[p];
				if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && !(p === 'willChange' && v === 'auto')) {
					if (!(p in saved)) {
						saved[p] = node.style[p] || '';
						node.style[p] = 'none';
						touched = true;
					}
				}
			}
			if (touched) _previewSavedStyles.set(node, saved);
			stack.push(node);
			node = node.parentElement;
		}
		return stack;
	}

	function restoreAncestors(stack) {
		for (var i = 0; i < stack.length; i++) {
			var node = stack[i];
			var saved = _previewSavedStyles.get(node);
			if (!saved) continue;
			for (var p in saved) {
				if (saved[p]) node.style[p] = saved[p];
				else node.style.removeProperty(p);
			}
			_previewSavedStyles.delete(node);
		}
	}

	function positionPreviewTip(anchor, tip) {
		var aRect = anchor.getBoundingClientRect();
		var tipRect = tip.getBoundingClientRect();
		var vw = window.innerWidth || document.documentElement.clientWidth;
		var margin = 8;
		var tipW = tipRect.width;
		var tipH = tipRect.height;

		var left = aRect.left + aRect.width / 2 - tipW / 2;
		var top = aRect.top - tipH - 8;

		if (top < margin) {
			top = aRect.bottom + 8;
		}
		if (left < margin) {
			left = margin;
		} else if (left + tipW > vw - margin) {
			left = vw - tipW - margin;
		}

		tip.style.left = left + 'px';
		tip.style.top = top + 'px';
		// Force on top no matter what z-index any neighbour claims.
		tip.style.zIndex = '2147483647';
	}

	function wirePreviewTip(anchor, tip) {
		tip._anchor = anchor;
		var timer = null;
		var neutralized = null;
		var show = function () {
			clearTimeout(timer);
			neutralized = neutralizeContainingBlock(anchor);
			positionPreviewTip(anchor, tip);
			tip.classList.add('is-visible');
		};
		var hide = function () {
			clearTimeout(timer);
			timer = setTimeout(function () {
				tip.classList.remove('is-visible');
				if (neutralized) {
					restoreAncestors(neutralized);
					neutralized = null;
				}
			}, 80);
		};
		anchor.addEventListener('mouseenter', show);
		anchor.addEventListener('mouseleave', hide);
		anchor.addEventListener('focus', show);
		anchor.addEventListener('blur', hide);
		tip.addEventListener('mouseenter', show);
		tip.addEventListener('mouseleave', hide);
	}

	/* ── 6c. Footnote hover preview ──
	   Hover a footnote-ref superscript → tooltip with the
	   footnote text appears next to it. Pure utility, zero
	   pixels when not hovering. */
	function installFootnotePreview(root) {
		const refs = (root || document).querySelectorAll('.md sup.footnote-ref a[href^="#fn-"]');
		refs.forEach(function (a) {
			if (a.dataset.fnPreviewReady) return;
			a.dataset.fnPreviewReady = '1';
			const tip = document.createElement('span');
			tip.className = 'cl-fn-tip';
			tip.setAttribute('role', 'tooltip');
			const id = (a.getAttribute('href') || '').replace(/^#/, '');
			const target = id ? document.getElementById(id) : null;
			if (target) {
				// clone the footnote content (strip the back-link arrow)
				const clone = target.cloneNode(true);
				clone.removeAttribute('id'); // avoid duplicate id; keep the real footnote reachable
				clone.querySelectorAll && clone.querySelectorAll('a').forEach(function (la) {
					if ((la.textContent || '').trim() === '↩') la.remove();
				});
				tip.appendChild(clone);
			}
			document.body.appendChild(tip);
			wirePreviewTip(a, tip);
		});
	}

	/* ── 6d. Citation hover preview ──
	   Links with `data-target="bib-xxx"` reference the bibliography.
	   On hover, show the formatted citation in a small tooltip. */
	function installCitationPreview(root) {
		const refs = (root || document).querySelectorAll('.md a[data-target^="bib-"]');
		refs.forEach(function (a) {
			if (a.dataset.citePreviewReady) return;
			a.dataset.citePreviewReady = '1';
			const id = (a.getAttribute('data-target') || '').replace(/^bib-/, '');
			const target = id ? document.getElementById('bib-' + id) : null;
			if (!target) return;
			const tip = document.createElement('span');
			tip.className = 'cl-cite-tip';
			tip.setAttribute('role', 'tooltip');
			const clone = target.cloneNode(true);
			clone.removeAttribute('id'); // avoid duplicate id; keep the real bibliography reachable
			clone.querySelectorAll && clone.querySelectorAll('a').forEach(function (la) {
				// Keep real source links (they have an href); drop internal backlink/arrow anchors
				if (!la.getAttribute('href')) la.remove();
			});
			tip.appendChild(clone);
			document.body.appendChild(tip);
			wirePreviewTip(a, tip);
		});
	}

	/* ── 6e. Image lightbox — click any <img> in .md to zoom ──
	   Uses event delegation on document.body so it catches images
	   added AFTER bootstrap (renderMarkdown populates .md later). */
	function installImageLightbox() {
		const lb = document.createElement('div');
		lb.id = 'cl-lb';
		lb.setAttribute('role', 'dialog');
		lb.setAttribute('aria-modal', 'true');
		lb.setAttribute('aria-label', 'Image viewer');
		lb.hidden = true;
		lb.innerHTML = '<button class="cl-lb-x" type="button" aria-label="Close">\u00d7</button>'
			+ '<button class="cl-lb-prev" type="button" aria-label="Previous image">\u2039</button>'
			+ '<button class="cl-lb-next" type="button" aria-label="Next image">\u203a</button>'
			+ '<img alt=""><figcaption></figcaption>';
		document.body.appendChild(lb);
		const img = lb.querySelector('img');
		const cap = lb.querySelector('figcaption');
		const x = lb.querySelector('.cl-lb-x');
		const prevBtn = lb.querySelector('.cl-lb-prev');
		const nextBtn = lb.querySelector('.cl-lb-next');

		/* current set of zoomable images + index; rebuilt on every open */
		let gallery = [];
		let idx = -1;

		function loadFromIdx(i) {
			if (i < 0 || i >= gallery.length) return;
			idx = i;
			const target = gallery[i];
			const src = target.currentSrc || target.src;
			img.src = src;
			img.alt = target.alt || '';
			const fig = target.closest('figure');
			let capHtml = '';
			if (fig) {
				const capEl = fig.querySelector('figcaption');
				if (capEl) {
					const clone = capEl.cloneNode(true);
					clone.querySelectorAll('.cl-cite-tip, .cl-fn-tip').forEach(function (el) { el.remove(); });
					capHtml = clone.innerHTML.trim();
				}
			}
			if (capHtml && /<[a-z][\s\S]*>/i.test(capHtml)) {
				cap.innerHTML = capHtml;
			} else {
				cap.textContent = capHtml || '';
			}
			cap.style.display = capHtml ? '' : 'none';
			prevBtn.disabled = i <= 0;
			nextBtn.disabled = i >= gallery.length - 1;
			prevBtn.style.display = gallery.length > 1 ? '' : 'none';
			nextBtn.style.display = gallery.length > 1 ? '' : 'none';
		}

		function collectGallery(root) {
			return Array.from(root.querySelectorAll('img')).filter(function (im) {
				if (im.naturalWidth && im.naturalWidth < 50) return false;
				if (im.closest('button, a.btn, svg')) return false;
				if (im.matches('[class*="emoji"], .no-zoom')) return false;
				return true;
			});
		}
		function open(targetImg) {
			/* build the gallery from the entire article body (#contents)
			   so prev/next follows the actual reading order across all
			   sections, not just the nearest .md wrapper. */
			const root = document.getElementById('contents') || document.body || document;
			gallery = collectGallery(root);
			idx = gallery.indexOf(targetImg);
			if (idx < 0) {
				gallery = [targetImg];
				idx = 0;
			}
			loadFromIdx(idx);
			lb.hidden = false;
			// force a reflow so the transition runs
			void lb.offsetHeight;
			lb.classList.add('is-visible');
			document.body.style.overflow = 'hidden';
		}
		function close() {
			lb.classList.remove('is-visible');
			setTimeout(function () {
				lb.hidden = true;
				img.src = '';
				document.body.style.overflow = '';
				gallery = [];
				idx = -1;
			}, 180);
		}
		function step(delta) {
			const ni = idx + delta;
			if (ni < 0 || ni >= gallery.length) return;
			loadFromIdx(ni);
		}
		x.addEventListener('click', function (ev) { ev.stopPropagation(); close(); });
		prevBtn.addEventListener('click', function (ev) { ev.stopPropagation(); step(-1); });
		nextBtn.addEventListener('click', function (ev) { ev.stopPropagation(); step(1); });
		lb.addEventListener('click', function (ev) {
			if (ev.target === lb) close();
		});
		/* clicking an in-document citation link inside the caption:
		   close the lightbox first so the delegated scroll handler works */
		lb.addEventListener('click', function (ev) {
			if (ev.target.closest && ev.target.closest('.iframe-safe-link')) {
				document.body.style.overflow = '';
				close();
			}
		}, true);
		document.addEventListener('keydown', function (ev) {
			if (lb.hidden) return;
			if (ev.key === 'Escape') { close(); return; }
			if (ev.key === 'ArrowLeft')  { ev.preventDefault(); step(-1); return; }
			if (ev.key === 'ArrowRight') { ev.preventDefault(); step(1);  return; }
		});

		/* delegated click — fires for any image, present or future.
		   Uses capture phase because `document.body.onclick` (set by
		   helper.js's bindIframeSafeLinks) calls stopPropagation() in
		   its handler, which would swallow the event before it bubbles
		   up to a listener on `document`. Capture runs FIRST, top-down,
		   so our handler fires before bindIframeSafeLinks can interfere. */
		function lightboxClickHandler(ev) {
			const t = ev.target;
			if (!(t instanceof Element)) return;
			// the target may be the img, a wrapper, or even a link inside the
			// surrounding figcaption (e.g. a citation link to the figure's source).
			// `closest('img')` only walks ancestors, so for citation links inside
			// a figcaption the IMG (a sibling of figcaption inside figure) would
			// be missed — fall back to the figure's own img.
			let img = t.tagName === 'IMG' ? t : t.closest('img');
			if (!img) {
				const fig = t.closest('figure');
				if (fig) img = fig.querySelector('img');
			}
			if (!img) return;
			// only inside the article body, not in drawer / header / footer
			if (!img.closest('#contents')) return;
			// user is selecting text — don't hijack
			const sel = window.getSelection && window.getSelection();
			if (sel && sel.toString().length > 0) return;
			// ignore tiny icons inside buttons / links (the cursor isn't zoom-in there anyway)
			if (img.closest('button, a.btn, svg')) return;
			// ignore very small images (likely icons, not content)
			if (img.naturalWidth && img.naturalWidth < 50) return;
			ev.preventDefault();
			ev.stopPropagation();
			open(img);
		}
		document.addEventListener('click', lightboxClickHandler, true);

		/* delegated cursor hint — anything .md img gets zoom-in cursor */
		const styleEl = document.createElement('style');
		styleEl.textContent = '.md img:not([class*="emoji"]):not(.no-zoom) { cursor: zoom-in; }';
		document.head.appendChild(styleEl);
	}

	/* ── 7. Back-to-top — invisible until 60% scrolled ──
	   Just a small text link in the bottom-right corner. No
	   circle, no button, no background. If you don't see it,
	   it's because you haven't scrolled far enough. */
	function installBackToTop() {
		const btn = document.createElement('button');
		btn.id = 'cl-top';
		btn.type = 'button';
		btn.setAttribute('aria-label', 'Back to top');
		btn.title = 'Back to top  (g g)';
		btn.textContent = '\u2191\u00a0top'; // "↑ top"
		btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
		document.body.appendChild(btn);
		let visible = false;
		function update() {
			const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
			const p = window.scrollY / max;
			const shouldShow = p > 0.6;
			if (shouldShow !== visible) {
				visible = shouldShow;
				btn.classList.toggle('is-visible', visible);
			}
		}
		let raf = null;
		document.addEventListener('scroll', function () {
			if (raf) return;
			raf = requestAnimationFrame(function () { update(); raf = null; });
		}, { passive: true });
		update();
	}

	/* ── 8. Drop-cap target ──
	   Tags the very first paragraph of the page with `.cl-dropcap`
	   and measures the real geometry so the CSS float cap spans
	   N text lines (see style.css §4):
	     • N adapts to the paragraph: start at 5, step down towards
	       3 while the paragraph has fewer real text lines than the
	       cap would be tall;
	     • paragraph line height comes from getComputedStyle — so
	       it follows any breakpoint / theme change automatically;
	     • the ink ratio (visible cap height ÷ em) of the actual
	       first character is measured in Floral Capitals via
	       canvas, because ornamental fonts carry a lot of empty
	       leading inside their em box.
	   font-size = lines × lineHeightPx ÷ inkRatio. */
	const DC_FONT = 'Floral Capitals';
	const DC_LINES_MIN = 3;
	const DC_LINES_MAX = 5;
	/* Native `initial-letter` (Chromium 110+, Safari; Firefox still takes
	   the JS float path below): the browser sinks and scales the cap
	   itself, so no canvas ink measuring is needed — we only pick how
	   many lines the cap should span. */
	const DC_NATIVE = typeof CSS !== 'undefined' && CSS.supports && (
		CSS.supports('initial-letter', '3') ||
		CSS.supports('-webkit-initial-letter', '3'));
	function dcLineTarget(p) {
		// Longer opening paragraphs can carry a taller cap without the
		// text running out underneath it (mirrors the float-path fit loop).
		const words = ((p.textContent || '').trim().match(/\S+/g) || []).length;
		return words < 40 ? 3 : words < 70 ? 4 : DC_LINES_MAX;
	}
	function dcInkRatio(ch) {
		try {
			const cv = markDropcapParagraph._cv || (markDropcapParagraph._cv = document.createElement('canvas'));
			const ctx = cv.getContext('2d');
			ctx.font = '100px "' + DC_FONT + '", Georgia, serif';
			const m = ctx.measureText(ch);
			if (m.actualBoundingBoxAscent > 0) return m.actualBoundingBoxAscent / 100;
		} catch (e) { /* keep fallback */ }
		return 0.72;
	}
	function sizeDropcap(p) {
		if (DC_NATIVE) {
			// The @supports block in style.css does the layout; just say
			// how tall the cap should be.
			p.style.setProperty('--cl-dc-lines', dcLineTarget(p));
			return;
		}
		const apply = function (lines, ratio, cs) {
			const fs = parseFloat(cs.fontSize) || 18;
			const lh = parseFloat(cs.lineHeight) || fs * 1.25;
			p.style.setProperty('--cl-dc-size',
				((lines * lh) / ratio).toFixed(1) + 'px');
		};
		// Count the paragraph's real text line boxes. NOTE: comparing
		// against p.offsetHeight does NOT work — Blink grows the block
		// around its own floated ::first-letter, so the box always
		// "fits". Only actual line boxes reveal how much text there is.
		const textLineCount = function (lh) {
			try {
				const rng = document.createRange();
				rng.selectNodeContents(p);
				const tops = new Set();
				for (const r of rng.getClientRects()) {
					if (r.width > 2 && r.height > 2) {
						tops.add(Math.round(r.top / (lh * 0.5)));
					}
				}
				return tops.size;
			} catch (e) { return DC_LINES_MAX; }
		};
		const fit = function (ratio) {
			const cs = getComputedStyle(p);
			const fs = parseFloat(cs.fontSize) || 18;
			const lh = parseFloat(cs.lineHeight) || fs * 1.25;
			for (let lines = DC_LINES_MAX; lines >= DC_LINES_MIN; lines--) {
				apply(lines, ratio, cs);
				// reading rects forces a re-layout with the new size
				if (lines <= textLineCount(lh) || lines === DC_LINES_MIN) break;
			}
		};
		const ch = (p.textContent.trim()[0] || 'A');
		if (document.fonts && document.fonts.check('16px "' + DC_FONT + '"', ch)) {
			requestAnimationFrame(function () { fit(dcInkRatio(ch)); });
		} else if (document.fonts) {
			document.fonts.load('16px "' + DC_FONT + '"', ch)
				.then(function () { fit(dcInkRatio(ch)); })
				.catch(function () { fit(0.72); });
		} else {
			fit(0.72);
		}
	}
	function markDropcapParagraph() {
		document.querySelectorAll('.md > p.cl-dropcap').forEach(function (p) {
			p.classList.remove('cl-dropcap');
			p.style.removeProperty('--cl-dc-size');
		});
		// Walk every .md block in document order — the page may OPEN with
		// a figure row, heading or anchor wrapper that holds no <p> at all
		// (e.g. intro.php's image strip), so the real opening paragraph
		// can live in a later .md block.
		const scopes = [];
		const contents = document.getElementById('contents');
		if (contents) scopes.push(contents);
		scopes.push(document);
		for (const scope of scopes) {
			for (const md of scope.querySelectorAll('.md')) {
				for (const p of md.querySelectorAll(':scope > p')) {
					// skip layout-only paragraphs (lone anchors, spacing)
					if ((p.textContent || '').trim()) {
						p.classList.add('cl-dropcap');
						sizeDropcap(p);
						return;
					}
				}
			}
		}
	}
	// re-measure when the viewport crosses the narrow/desktop boundary
	if (!markDropcapParagraph._mqBound && window.matchMedia) {
		markDropcapParagraph._mqBound = true;
		window.matchMedia('(max-width: 700px)').addEventListener('change', function () {
			markDropcapParagraph();
		});
	}

	/* ── Figure / table / equation numbering (CSS counters do the
	   math — see style.css §15b). These passes only prepare the DOM:
	     • wrap display math so a right-margin number can attach,
	     • opt captions out when they carry their own label or sit
	       before the page's first h2 (counter would read "0.x"). */
	function precededByH2(el, h2s) {
		for (let i = 0; i < h2s.length; i++) {
			if (h2s[i].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) return true;
		}
		return false;
	}
	function numberEquations(root) {
		const scope = root.nodeType === 9 ? (root.getElementById('contents') || root.body || root) : root;
		const h2s = Array.prototype.slice.call(scope.querySelectorAll('.md h2'));
		scope.querySelectorAll('.md math.tml-display, .md math[display="block"]').forEach(function (m) {
			if (!m.parentNode || m.closest('.cl-eq')) return;
			if (m.closest('.no-eq-num, [data-no-eq-num]')) return;
			const wrap = document.createElement('span');
			wrap.className = 'cl-eq';
			m.parentNode.insertBefore(wrap, m);
			wrap.appendChild(m);
			if (!precededByH2(m, h2s)) wrap.classList.add('no-eq-num');
		});
	}
	const MANUAL_CAPTION_RE = /^\s*(?:figures?|figs?\.|abb\.?|tables?|tab\.|tbl\.?)\s*[\dIVX]/i;
	function tagAutoNumberedCaptions(root) {
		const scope = root.nodeType === 9 ? (root.getElementById('contents') || root.body || root) : root;
		const h2s = Array.prototype.slice.call(scope.querySelectorAll('.md h2'));
		scope.querySelectorAll('.md figure figcaption, .md > figcaption, .md table > caption').forEach(function (cap) {
			if (MANUAL_CAPTION_RE.test((cap.textContent || '').trim())) {
				cap.classList.add('no-auto-num');
				return;
			}
			if (!precededByH2(cap, h2s)) cap.classList.add('no-auto-num');
		});
	}

	/* ── Acronym small caps — "HTTP", "LLM" & co. get the .caps class
	   (all-small-caps + slight tracking). Case-sensitive on purpose:
	   prose words that merely contain capitals are never touched.
	   Code, math and already-marked spans are skipped. */
	const ACRO_RE = /\b(AI|AGI|LLMs?|GPT-\d(?:\.\d)?|CNNs?|RNNs?|LSTMs?|GRUs?|MLPs?|APIs?|GPUs?|TPUs?|CPUs?|RAM|VRAM|NLP|BPE|RLHF|RL|DQN|PPO|MCTS|SOTA|RAG|LoRA|VAEs?|GANs?|ReLU|SGD|JSON|HTML|CSS|SQL|HTTPS?|URLs?|URIs?|PDFs?|CSV|TSV|TOC|FAQ|CLI|GUI)\b/g;
	const ACRO_SKIP = '.caps, code, pre, kbd, samp, script, style, textarea, option, math, .no-caps';
	function markAcronyms(root) {
		const scope = root.nodeType === 9 ? (root.getElementById('contents') || root.body || root) : root;
		const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
			acceptNode: function (n) {
				if (!n.nodeValue || !/[A-Za-z]{2}/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
				if (!/\b[A-Z][A-Z]/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
				const p = n.parentElement;
				if (p && p.closest(ACRO_SKIP)) return NodeFilter.FILTER_REJECT;
				return NodeFilter.FILTER_ACCEPT;
			}
		});
		const nodes = [];
		while (walker.nextNode()) nodes.push(walker.currentNode);
		for (const node of nodes) {
			const s = node.nodeValue;
			let out = '', last = 0, hit = false, m;
			ACRO_RE.lastIndex = 0;
			while ((m = ACRO_RE.exec(s))) {
				hit = true;
				out += s.slice(last, m.index);
				out += '<span class="caps">' + m[0] + '</span>';
				last = m.index + m[0].length;
			}
			if (!hit) continue;
			out += s.slice(last);
			node.parentNode.replaceChild(
				document.createRange().createContextualFragment(out), node);
		}
	}

	/* ── First-touch helpers (silent, once) ── */
	function run(root) {
		try {
			markDropcapParagraph();
			installHeadingAnchors(root);
			upgradeHeadingAnchors(root);
			labelCodeBlocks(root);
			installCopyButtons(root);
			installFootnotePreview(root);
			installCitationPreview(root);
			tagAutoNumberedCaptions(root);
			numberEquations(root);
			markAcronyms(root);
		} catch (e) { /* silent */ }
	}

	/* bootstrap */
	function start() {
		run(document);
		installTocScrollSpy();
		installShortcuts();
		installReadingMeta();
		installBackToTop();
		installImageLightbox();
		// Keep any visible hover preview glued to its anchor while scrolling.
		document.addEventListener('scroll', function () {
			document.querySelectorAll('.cl-fn-tip.is-visible, .cl-cite-tip.is-visible').forEach(function (tip) {
				if (tip._anchor) positionPreviewTip(tip._anchor, tip);
			});
		}, true);
		// pick up late content (MathJax, lazy modules, etc.)
		const mo = new MutationObserver(function (muts) {
			let touched = false;
			let h1Appeared = false;
			for (const m of muts) {
				m.addedNodes.forEach(function (n) {
					if (!(n instanceof Element)) return;
					if (n.matches && n.matches('.md, .md *')) { touched = true; return; }
					if (n.querySelector && n.querySelector('.md h2, .md h3, .md pre, .md figure img')) touched = true;
					if (n.tagName === 'H1' || (n.querySelector && n.querySelector('.md h1'))) h1Appeared = true;
				});
			}
			if (h1Appeared) installReadingMeta();
			if (touched || h1Appeared) {
				clearTimeout(window.__clPolishTO);
				window.__clPolishTO = setTimeout(function () { run(document); }, 80);
			}
		});
		mo.observe(document.body, { childList: true, subtree: true });
		// also poll briefly for H1 if renderMarkdown is slow
		let tries = 0;
		const iv = setInterval(function () {
			tries++;
			installReadingMeta();
			const h1 = document.querySelector('.md h1');
			if (h1 && h1.dataset.readingTime) clearInterval(iv);
			if (tries > 50) clearInterval(iv);
		}, 100);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start);
	} else {
		start();
	}
})();
