/* ════════════════════════════════════════════════════════════════
   POLISH — small, native-feeling touches that make a long
   technical book easier and more pleasant to work through.

   • ¶ anchor links on every heading, visible on hover
   • TOC scroll-spy: the section you're reading lights up
   • Code blocks show their language as a quiet corner label
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

	/* ── 4. First-touch helpers (silent, once) ── */
	function run(root) {
		try {
			installHeadingAnchors(root);
			labelCodeBlocks(root);
		} catch (e) { /* silent */ }
	}

	/* bootstrap */
	function start() {
		run(document);
		installTocScrollSpy();
		// pick up late content (MathJax, lazy modules, etc.)
		const mo = new MutationObserver(function (muts) {
			let touched = false;
			for (const m of muts) {
				m.addedNodes.forEach(function (n) {
					if (!(n instanceof Element)) return;
					if (n.matches && n.matches('.md, .md *')) { touched = true; return; }
					if (n.querySelector && n.querySelector('.md h2, .md h3, .md pre')) touched = true;
				});
			}
			if (touched) {
				clearTimeout(window.__clPolishTO);
				window.__clPolishTO = setTimeout(function () { run(document); }, 80);
			}
		});
		mo.observe(document.body, { childList: true, subtree: true });
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start);
	} else {
		start();
	}
})();
