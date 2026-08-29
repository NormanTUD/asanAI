window.usedCitations = []; // Tracks order of citation usage
window.footnoteCounter = 1;
window.quotesLog = [];
window.indexedTerms = {};
const _sectionInitFns = new Map();
const _initializedSections = new Set();

const _sectionInitObserver = new IntersectionObserver(
	(entries) => {
		entries.forEach((entry) => {
			const id = entry.target.id;
			if (entry.isIntersecting && !_initializedSections.has(id)) {
				_initializedSections.add(id);
				const fn = _sectionInitFns.get(id);
				if (fn) fn();
				_sectionInitObserver.unobserve(entry.target);   // one-shot
				_sectionInitFns.delete(id);                     // free reference
			}
		});
	},
	{ rootMargin: rootMargin, threshold: 0 }
);

const categoryConfig = {
	data: "Data",
	math: "Math",
	programming: "Programming",
	archaeology: "Archaeology",
	hardware: "Hardware",
	philosophy: "Philosophy",
	history: "History",
	culture: "Culture",
	machine_learning: "Machine Learning",
	alignment: "Alignment",
	ethics: "Ethics",
	advanced_math: "Advanced Math",
};

function getCategoryColor(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	const h = Math.abs(hash) % 360;
	return `hsl(${h}, 70%, 45%)`;
}

// --- Existing Functions ---

function log(id, msg) {
	const con = document.getElementById(id + '-console');
	if (!con) {
		console.info(`Element '${id}-console' not found`);
		console.log(msg);
		return false;
	}
	const time = new Date().toLocaleTimeString().split(' ')[0];
	con.innerHTML = `[${time}] ${msg}<br>` + con.innerHTML;
	$(con).show();

	return true;
}

function warn(id, msg) {
	const con = document.getElementById(id + '-console');
	const time = new Date().toLocaleTimeString().split(' ')[0];
	con.innerHTML = `[${time}] &#9888; <span class='warning-msg'>${msg}</span><br>` + con.innerHTML;
}

function getTopLevelMdContainers() {
	return Array.from(document.querySelectorAll('.md')).filter(container => {
		let parent = container.parentElement;
		while (parent) {
			if (parent.classList && parent.classList.contains('md')) {
				return false;
			}
			parent = parent.parentElement;
		}
		return true;
	});
}

/* ── Typographic punctuation pass ──────────────────────────────
   Runs on the RENDERED DOM (never the Markdown source), so fenced
   code, inline code, kbd and math are untouched by construction —
   they're excluded explicitly anyway. Stateless per text node:
   every decision uses only its immediate left/right context, which
   makes the pass idempotent and safe across inline-tag boundaries.

     --- → em dash   -- → en dash   ... → ellipsis
     "a" → “a”       it's / dogs'  → ’      'x' → ‘x’            */
function smartPunct(root) {
	if (!root || !root.querySelectorAll) return;
	const SKIP = 'code, pre, kbd, samp, script, style, textarea, option, math, .no-smart';
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
		acceptNode: function (n) {
			if (!n.nodeValue || !/["'\-.]/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
			const p = n.parentElement;
			if (p && p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
			return NodeFilter.FILTER_ACCEPT;
		}
	});
	const nodes = [];
	while (walker.nextNode()) nodes.push(walker.currentNode);
	for (const node of nodes) {
		let s = node.nodeValue;
		s = s.replace(/-{2,}/g, function (d) { return d.length >= 3 ? '\u2014' : '\u2013'; })
		     .replace(/\.\.\./g, '\u2026');
		// apostrophes: contractions (it's) and word-final possessives (dogs')
		s = s.replace(/(\p{L})'(\p{L})/gu, '$1\u2019$2')
		     .replace(/(\p{L})'(?![\p{L}\p{N}])/gu, '$1\u2019');
		// double quotes: an opener is a quote preceded by start/space/opening
		// punctuation and followed by non-space; everything else closes.
		s = s.replace(/(^|[\s(\[{\u2014\u2013])"(?=\S)/g, '$1\u201C')
		     .replace(/"/g, '\u201D');
		// single quotes: same shape, AFTER contractions were consumed
		s = s.replace(/(^|[\s(\[{\u2014\u2013])'(?=[^\s'])/g, '$1\u2018')
		     .replace(/'/g, '\u2019');
		if (s !== node.nodeValue) node.nodeValue = s;
	}
}

function renderMarkdown() {
	updateLoadingStatus("Rendering Markdown...");
	getTopLevelMdContainers().forEach(container => {
		// 1. Inhalt holen und Einrückungen fixen
		let rawContent = container.innerHTML.replace(/^[ \t]+/gm, '');

		// 2. Index-Logik VOR dem Markdown-Parsing ausführen
		// Wir nutzen hier die Logik, die normalerweise in deiner parseIndex-Funktion steht
		const regex = /\\index\{([^}]+)\}/g;
		rawContent = rawContent.replace(regex, (match, term) => {
			const normalizedTerm = term.toLowerCase().replace(/_/g, ' ');

			// ID generieren (ähnlich wie in deiner restlichen Logik)
			const safeIdBase = normalizedTerm.replace(/\s+/g, '-');
			const occurrenceId = `idx-${safeIdBase}-${Math.random().toString(36).substr(2, 4)}`;

			// Im globalen Tracker registrieren
			if (!window.indexedTerms[normalizedTerm]) {
				window.indexedTerms[normalizedTerm] = [];
			}
			window.indexedTerms[normalizedTerm].push(occurrenceId);

			// Den Tag durch ein sauberes HTML-Span ersetzen
			// Marked lässt HTML-Tags in der Regel unberührt, wodurch die ID der Überschrift sauber bleibt
			return `<span id="${occurrenceId}">${term}</span>`;
		});

		// 2b. Aurora cluster markers: [[c:name]]…[[/c]]  →  <span/div data-cluster="…">
		if (window.BlogClusters && BlogClusters.preprocess) {
			rawContent = BlogClusters.preprocess(rawContent);
		}

		// 2c. Interest-topic blocks: [[t:topic]]…[[/t]] → marked extension handles it
		if (window.BlogTopics && BlogTopics.preprocess) {
			rawContent = BlogTopics.preprocess(rawContent);
		}

		// 3. Erst jetzt das Markdown (mit den bereits fertigen Spans) parsen
		container.innerHTML = marked.parse(rawContent);
		smartPunct(container);
	});
	updateLoadingStatus("Almost finished.");

	// 3b. inject per-cluster CSS variables now that the DOM has them
	if (window.BlogClusters && BlogClusters.injectCSS) BlogClusters.injectCSS();

	// 3c. Apply interest-filter visibility to .topic-block nodes
	if (window.BlogTopics && BlogTopics.applyVisibility) {
		BlogTopics.applyVisibility();
	}

	const fnContainer = document.getElementById('footnotes');
	if (fnContainer) {
		if (window.BlogTopics && BlogTopics.preprocess) {
			fnContainer.innerHTML = BlogTopics.preprocess(fnContainer.innerHTML);
		}
		fnContainer.innerHTML = marked.parse(fnContainer.innerHTML);
		smartPunct(fnContainer);
		if (window.BlogTopics && BlogTopics.applyVisibility) {
			BlogTopics.applyVisibility();
		}
	}

	const srcContainer = document.getElementById('sources');
	if (srcContainer) {
		if (window.BlogTopics && BlogTopics.preprocess) {
			srcContainer.innerHTML = BlogTopics.preprocess(srcContainer.innerHTML);
		}
		srcContainer.innerHTML = marked.parse(srcContainer.innerHTML);
		smartPunct(srcContainer);
		if (window.BlogTopics && BlogTopics.applyVisibility) {
			BlogTopics.applyVisibility();
		}
	}
}

function sonarPing(targetEl) {
    const rect = targetEl.getBoundingClientRect();
    const ripple = document.createElement('div');
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2 + window.scrollY;

    ripple.style.cssText = `
        position: absolute;
        left: ${cx}px; top: ${cy}px;
        width: 0; height: 0;
        border: 2px solid rgba(255, 200, 50, 0.4);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 9000;
        transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1),
                    height 0.8s cubic-bezier(0.22, 1, 0.36, 1),
                    opacity 0.8s ease,
                    border-color 0.8s ease;
    `;
    document.body.appendChild(ripple);

    requestAnimationFrame(() => {
        const size = Math.max(rect.width, rect.height) * 2.5;
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';
        ripple.style.opacity = '0';
        ripple.style.borderColor = 'rgba(255, 200, 50, 0)';
    });

    setTimeout(() => ripple.remove(), 900);
}

function revealContent() {
    const loader = document.getElementById('loader');
    const content = document.getElementById('contents');
    if (!content) return;

    // Floating top buttons (search / theme) fade in together with the
    // content instead of flashing over the loader on first paint.
    document.documentElement.classList.add('is-ready');

    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);

    content.style.display = 'block';
    content.style.opacity = '0';
    content.style.transition = 'opacity 0.5s ease';

    requestAnimationFrame(() => {
        content.style.opacity = '1';
    });

    const sections = content.querySelectorAll(':scope > section, :scope > .category-block, :scope > h1, :scope > h2');
    const perSection = Math.max(40, Math.min(120, 800 / sections.length));

    sections.forEach((section, i) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(10px)';
        section.style.filter = 'blur(4px)';
        section.style.transition = `opacity 0.5s ease ${i * perSection}ms,
                                     transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * perSection}ms,
                                     filter 0.5s ease ${i * perSection}ms`;
        requestAnimationFrame(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
            section.style.filter = 'blur(0)';
        });
    });
}

function make_external_a_href_target_blank() {
	updateLoadingStatus("Processing external links...");
	const links = document.querySelectorAll('a[href]');

	links.forEach(link => {
		if (link.hostname && link.hostname !== window.location.hostname) {
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
		}
	});
	updateLoadingStatus("Processed external links.");
}

function bindIframeSafeLinks() {
	document.body.onclick = (e) => {
		const link = e.target.closest('.iframe-safe-link');
		if (!link) return;

		e.preventDefault();
		e.stopPropagation();

		const targetId = link.getAttribute('data-target');
		const targetEl = document.getElementById(targetId);

		if (targetEl) {
			// --- 1. Reveal any ancestor optional blocks ---
			revealAncestorOptionalBlocks(targetEl);

			// --- 2. Reveal any ancestor category blocks that were toggled off ---
			revealAncestorCategoryBlocks(targetEl);

			// --- 3. Force-run any lazy-init section that contains the target ---
			forceInitLazySections(targetEl);

			// --- 4. Expand any collapsed toggleable-quote ancestor ---
			revealAncestorToggleableQuotes(targetEl);

			// --- 5. Determine the best scroll target ---
			// If the target is a citation link inside a rendered-quote,
			// scroll to the parent blockquote so the full quote is visible
			let scrollTarget = targetEl;
			const ancestorQuote = targetEl.closest('.rendered-quote');
			if (ancestorQuote) {
				scrollTarget = ancestorQuote;
			}

			// Small delay to let DOM reflow after reveals
			requestAnimationFrame(() => {
				scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });

				sonarPing(targetEl);

				// --- Cinematic highlight effect ---

				// Phase 1: Border glow materializes (like quote-flash)
				targetEl.style.transition = 'box-shadow 0.3s ease, background-color 0.3s ease';
				targetEl.style.boxShadow = '0 0 16px rgba(255, 200, 50, 0.25), inset 0 0 8px rgba(255, 200, 50, 0.08)';
				targetEl.style.backgroundColor = 'rgba(255, 200, 50, 0.12)';

				// Phase 2: Brief blur-to-sharp pulse on the text (crystallization)
				const textChildren = targetEl.querySelectorAll('p, li, span, code, td, th, h1, h2, h3, h4, h5, h6');
				const pulseTargets = textChildren.length > 0 ? textChildren : [targetEl];

				pulseTargets.forEach(child => {
					child.style.transition = 'filter 0.2s ease';
					child.style.filter = 'blur(1.5px)';
				});

				// Phase 3: Sharpen after brief blur (the "focus snap")
				setTimeout(() => {
					pulseTargets.forEach(child => {
						child.style.transition = 'filter 0.3s ease';
						child.style.filter = 'blur(0)';
					});
				}, 200);

				// Phase 4: Glow intensifies slightly, then fades
				setTimeout(() => {
					targetEl.style.boxShadow = '0 0 20px rgba(255, 200, 50, 0.35), inset 0 0 12px rgba(255, 200, 50, 0.1)';
					targetEl.style.backgroundColor = 'rgba(255, 200, 50, 0.18)';
				}, 300);

				// Phase 5: Everything dissolves away gracefully
				setTimeout(() => {
					targetEl.style.transition = 'box-shadow 0.8s ease, background-color 0.8s ease';
					targetEl.style.boxShadow = 'none';
					targetEl.style.backgroundColor = 'transparent';

					setTimeout(() => {
						targetEl.style.removeProperty('box-shadow');
						targetEl.style.removeProperty('background-color');
						targetEl.style.removeProperty('transition');
						pulseTargets.forEach(child => {
							child.style.removeProperty('filter');
							child.style.removeProperty('transition');
						});
					}, 850);
				}, 1800);
			});
		} else {
			console.warn(`Target element #${targetId} not found.`);
		}
	};
}

function addReadingProgress() {
	updateLoadingStatus("Adding Reading Progress bar...");
	const bar = document.createElement('div');
	bar.id = 'reading-progress';
	bar.style.cssText = `
		position: fixed; top: 0; left: 0; height: 3px;
		background: linear-gradient(90deg, #4fc3f7, #ab47bc);
		width: 0%; z-index: 9999; transition: width 0.15s ease-out;
		box-shadow: none;
	`;
	document.body.appendChild(bar);

	// Glow element that pulses at the leading edge
	const glow = document.createElement('div');
	glow.style.cssText = `
		position: absolute; right: -1px; top: -2px;
		width: 8px; height: 7px; border-radius: 50%;
		background: rgba(171, 71, 188, 0.6);
		box-shadow: 0 0 12px rgba(171, 71, 188, 0.4), 0 0 4px rgba(79, 195, 247, 0.3);
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
	`;
	bar.appendChild(glow);

	let lastPct = 0;
	let scrollTimeout;
	let milestonesFired = new Set();

	window.addEventListener('scroll', () => {
		const h = document.documentElement;
		const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
		bar.style.width = pct + '%';

		// Show leading-edge glow while actively scrolling
		glow.style.opacity = '1';
		clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(() => {
			glow.style.opacity = '0';
		}, 400);

		// Shift gradient hue as you progress — the bar "warms up"
		const hueShift = pct * 0.6; // 0 at top, ~60 at bottom
		bar.style.background = `linear-gradient(90deg, hsl(${195 + hueShift * 0.3}, 80%, 60%), hsl(${285 + hueShift * 0.2}, 60%, 55%))`;

		// Milestone pulses at 25%, 50%, 75%, 100%
		[25, 50, 75, 100].forEach(milestone => {
			if (pct >= milestone && lastPct < milestone && !milestonesFired.has(milestone)) {
				milestonesFired.add(milestone);

				// Bar does a brief height pulse
				bar.style.transition = 'width 0.15s ease-out, height 0.2s ease, box-shadow 0.3s ease';
				bar.style.height = '5px';
				bar.style.boxShadow = `0 0 15px rgba(171, 71, 188, 0.3)`;

				setTimeout(() => {
					bar.style.height = '3px';
					bar.style.boxShadow = 'none';
					bar.style.transition = 'width 0.15s ease-out';
				}, 500);

				// At 100%: special completion shimmer
				if (milestone === 100) {
					bar.style.background = 'linear-gradient(90deg, #4ade80, #4fc3f7, #ab47bc, #f472b6)';
					bar.style.backgroundSize = '200% 100%';
					bar.style.animation = 'progress-shimmer 2s ease infinite';

					// Inject shimmer keyframes if not already present
					if (!document.getElementById('progress-shimmer-style')) {
						const style = document.createElement('style');
						style.id = 'progress-shimmer-style';
						style.textContent = `
							@keyframes progress-shimmer {
								0% { background-position: 0% 50%; }
								50% { background-position: 100% 50%; }
								100% { background-position: 0% 50%; }
							}
						`;
						document.head.appendChild(style);
					}
				}
			}
		});

		lastPct = pct;
	});
	updateLoadingStatus("Added Reading Progress bar.");
}

/**
 * Walk up from `el` and open every collapsed .optional block along the way.
 */
function revealAncestorOptionalBlocks(el) {
	let node = el.closest('.optional');
	while (node) {
		const contentWrapper = node.querySelector('.optional-content');
		const header = node.querySelector('.optional-header');
		if (contentWrapper && contentWrapper.style.display === 'none') {
			contentWrapper.style.display = 'block';
			if (header) {
				const icon = header.querySelector('.optional-icon');
				if (icon) icon.innerHTML = '▼';
				header.classList.add('active');
			}
		}
		// Walk further up in case optional blocks are nested
		node = node.parentElement ? node.parentElement.closest('.optional') : null;
	}
}

/**
 * Walk up from `el` and re-show any category block that was hidden by the filter UI.
 */
function revealAncestorCategoryBlocks(el) {
	let node = el.closest('.category-block');
	while (node) {
		if (node.style.display === 'none') {
			node.style.setProperty('display', 'block', 'important');

			// Also sync the filter button state so the UI isn't contradictory
			const classes = [...node.classList].filter(c => c.startsWith('cat-'));
			classes.forEach(cls => {
				const key = cls.replace('cat-', '');
				const btn = document.querySelector(`#category-filter-bar button[data-active="false"]`);
				// More precise: find the button whose click toggles this category
				const allBtns = document.querySelectorAll('#category-filter-bar button');
				allBtns.forEach(b => {
					// Re-check by toggling logic — match by category key
					if (b.textContent === (categoryConfig[key] || '')) {
						const color = getCategoryColor(key);
						b.dataset.active = "true";
						b.style.background = color;
						b.style.color = "white";
					}
				});
			});
		}
		node = node.parentElement ? node.parentElement.closest('.category-block') : null;
	}
}

/**
 * If `el` lives inside a section that is registered for lazy init but hasn't
 * fired yet, force-run its init function immediately.
 */
function forceInitLazySections(el) {
	for (const [sectionId, fn] of _sectionInitFns.entries()) {
		const section = document.getElementById(sectionId);
		if (section && section.contains(el)) {
			_initializedSections.add(sectionId);
			fn();
			_sectionInitObserver.unobserve(section);
			_sectionInitFns.delete(sectionId);
		}
	}
}

/**
 * If `el` is inside a toggleable-quote that's in "short" state, expand it.
 */
function revealAncestorToggleableQuotes(el) {
	let node = el.closest('.toggleable-quote, .rendered-quote');
	while (node) {
		const p = node.classList.contains('toggleable-quote')
			? node
			: node.querySelector('.toggleable-quote');
		if (p && p.getAttribute('data-state') === 'short') {
			requestAnimationFrame(() => {
				p.click();
			});
		}
		node = node.parentElement
			? node.parentElement.closest('.toggleable-quote, .rendered-quote')
			: null;
	}
}

function smartquote() {
	updateLoadingStatus("Processing Quotes...");
	if (!window.usedCitations) window.usedCitations = [];
	if (!window.citationMap) window.citationMap = {};

	document.querySelectorAll('.smart-quote').forEach(el => {
		const citeKey = el.getAttribute('data-cite');
		const citePage = el.getAttribute('data-page');
		const citeAfter = el.getAttribute('data-after');
		const fullEl = el.querySelector('.full-quote');
		const shortEl = el.querySelector('.short-quote');

		let author = 'Unknown';
		let title = "";
		let after = citeAfter || "";
		let page = citePage || "";

		let year = "";
		let url = el.getAttribute('data-url');

		if (citeKey && window.bibData && window.bibData[citeKey]) {
			const bib = window.bibData[citeKey];
			author = bib.author || author;
			title = bib.title || "";
			year = bib.year || "";
			if (page != "") page = `, p. ${page}`;
			if (after != "") after = `, ${after}`;
			url = bib.url || url;

			const instanceId = `ref-${citeKey}-${Math.random().toString(36).substr(2, 5)}`;
			if (!window.usedCitations.includes(citeKey)) window.usedCitations.push(citeKey);
			if (!window.citationMap[citeKey]) window.citationMap[citeKey] = [];
			window.citationMap[citeKey].push(instanceId);

			const info = `${author}: ${title}${year ? ' (' + year + ')' : ''}`;
			const author_display = title !== "" ? `${author} (${title})` : author;

			const quoteBox = document.createElement('blockquote');
			quoteBox.className = el.className.replace('smart-quote', 'rendered-quote');

			const p = document.createElement('p');

			if (fullEl && shortEl) {
				p.className = 'toggleable-quote';
				const shortHtml = shortEl.innerHTML.trim().replace(/^["»]|["«]$/g, '');
				const fullHtml = fullEl.innerHTML.trim().replace(/^["»]|["«]$/g, '');

				p.setAttribute('data-state', 'short');

				// --- Staggered character reveal ---
				const animateTextIn = (container, html, onComplete) => {
					const temp = document.createElement('span');
					temp.innerHTML = html;
					container.innerHTML = '';
					container.appendChild(temp);

					const walker = document.createTreeWalker(temp, NodeFilter.SHOW_TEXT, null, false);
					const textNodes = [];
					while (walker.nextNode()) textNodes.push(walker.currentNode);

					textNodes.forEach(node => {
						const text = node.textContent;
						const frag = document.createDocumentFragment();
						for (let i = 0; i < text.length; i++) {
							const charSpan = document.createElement('span');
							charSpan.className = 'quote-char';
							charSpan.textContent = text[i];
							charSpan.style.opacity = '0';
							charSpan.style.filter = 'blur(4px)';
							charSpan.style.transform = 'translateY(4px)';
							charSpan.style.display = 'inline-block';
							charSpan.style.transition = 'opacity 0.3s ease, filter 0.3s ease, transform 0.3s ease';
							if (text[i] === ' ') charSpan.style.width = '0.3em';
							frag.appendChild(charSpan);
						}
						node.parentNode.replaceChild(frag, node);
					});

					const allChars = temp.querySelectorAll('.quote-char');
					const totalChars = allChars.length;
					const perChar = Math.max(4, Math.min(18, 600 / totalChars));

					allChars.forEach((ch, i) => {
						setTimeout(() => {
							ch.style.opacity = '1';
							ch.style.filter = 'blur(0)';
							ch.style.transform = 'translateY(0)';
						}, i * perChar);
					});

					if (onComplete) {
						setTimeout(onComplete, totalChars * perChar + 300);
					}
				};

				// --- Render a state ---
				const renderState = (isShort, animate = false) => {
					const text = isShort ? shortHtml : fullHtml;
					p.setAttribute('data-state', isShort ? 'short' : 'full');
					p.classList.toggle('quote-char-mode', !!animate);

					const hintText = isShort ? 'expand' : 'collapse';
					const hintEl = `<span class="quote-expand-hint"><span class="quote-hint-dot">·</span> <i>${hintText}</i></span>`;

					if (!animate) {
						p.innerHTML = `<span class="quote-guillemet quote-guillemet-open">»</span><span class="quote-text-inner">${text}</span><span class="quote-guillemet quote-guillemet-close">«</span>&nbsp;${hintEl}`;
						return;
					}

					p.innerHTML = `<span class="quote-guillemet quote-guillemet-open glow-pulse">»</span><span class="quote-text-inner"></span><span class="quote-guillemet quote-guillemet-close" style="opacity:0">«</span>&nbsp;${hintEl}`;

					const textContainer = p.querySelector('.quote-text-inner');
					const closeGuill = p.querySelector('.quote-guillemet-close');

					animateTextIn(textContainer, text, () => {
						closeGuill.style.transition = 'opacity 0.4s ease';
						closeGuill.style.opacity = '1';

						setTimeout(() => {
							p.querySelector('.quote-guillemet-open')?.classList.remove('glow-pulse');
						}, 400);
					});
				};

				// --- Initial render (no animation) ---
				renderState(true, false);

				// --- Click handler ---
				let isAnimating = false;

				p.addEventListener('click', () => {
					if (isAnimating) return;
					isAnimating = true;

					const isCurrentlyShort = p.getAttribute('data-state') === 'short';

					// Border glow flash
					quoteBox.classList.add('quote-flash');
					setTimeout(() => quoteBox.classList.remove('quote-flash'), 800);

					// --- Step 1: Capture current height of <p> ---
					const pStartHeight = p.offsetHeight;

					// Phase 1: Dissolve out current text
					const closeGuill = p.querySelector('.quote-guillemet-close');
					if (closeGuill) {
						closeGuill.style.transition = 'opacity 0.2s ease';
						closeGuill.style.opacity = '0';
					}

					const textInner = p.querySelector('.quote-text-inner');
					if (textInner) {
						textInner.style.transition = 'opacity 0.25s ease, filter 0.25s ease';
						textInner.style.opacity = '0';
						textInner.style.filter = 'blur(3px)';
					}

					// Phase 2: After dissolve, measure target, then animate
					setTimeout(() => {
						// --- Step 2: Measure the END height of <p> using an off-screen clone ---
						const clone = quoteBox.cloneNode(true);
						clone.style.cssText = `
							position: absolute;
							visibility: hidden;
							height: auto;
							overflow: visible;
							pointer-events: none;
							width: ${quoteBox.offsetWidth}px;
						`;
						const computedStyle = window.getComputedStyle(quoteBox);
						clone.style.padding = computedStyle.padding;
						clone.style.borderWidth = computedStyle.borderWidth;
						clone.style.borderStyle = computedStyle.borderStyle;
						clone.style.boxSizing = computedStyle.boxSizing;
						clone.style.font = computedStyle.font;
						clone.style.lineHeight = computedStyle.lineHeight;

						quoteBox.parentNode.insertBefore(clone, quoteBox.nextSibling);

						const cloneP = clone.querySelector('.toggleable-quote');
						if (cloneP) {
							const targetText = !isCurrentlyShort ? shortHtml : fullHtml;
							const hintText = !isCurrentlyShort ? 'expand' : 'collapse';
							const hintEl = `<span class="quote-expand-hint"><span class="quote-hint-dot">·</span> <i>${hintText}</i></span>`;
							cloneP.innerHTML = `<span class="quote-guillemet quote-guillemet-open">»</span><span class="quote-text-inner">${targetText}</span><span class="quote-guillemet quote-guillemet-close">«</span>&nbsp;${hintEl}`;
						}

						const pEndHeight = cloneP ? cloneP.offsetHeight : pStartHeight;
						clone.remove();

						// --- Step 3: Lock <p> at its current height ---
						p.style.transition = 'none';
						p.style.height = pStartHeight + 'px';
						p.style.overflow = 'hidden';

						// --- Step 4: Render new content WITH animation ---
						renderState(!isCurrentlyShort, true);

						// Force reflow
						void p.offsetHeight;

						// --- Step 5: Animate <p> height from start → end ---
						// The footer sits below <p> in normal flow, so as <p>
						// smoothly grows/shrinks, the footer glides with it.
						p.style.transition = 'height 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)';
						p.style.height = pEndHeight + 'px';

						// --- Step 6: Clean up after transition ---
						const cleanup = () => {
							p.style.removeProperty('height');
							p.style.removeProperty('overflow');
							p.style.removeProperty('transition');
						};

						const fallbackTimer = setTimeout(cleanup, 600);

						p.addEventListener('transitionend', function handler(e) {
							if (e.target === p && e.propertyName === 'height') {
								clearTimeout(fallbackTimer);
								cleanup();
								p.removeEventListener('transitionend', handler);
							}
						});

						// Unlock isAnimating after text stagger completes
						const newText = p.querySelector('.quote-text-inner');
						const charCount = newText ? newText.textContent.length : 50;
						const perChar = Math.max(4, Math.min(18, 600 / charCount));
						setTimeout(() => {
							isAnimating = false;
						}, charCount * perChar + 400);
					}, 280);
				});

			} else {
				p.innerHTML = `<span class="quote-guillemet quote-guillemet-open">»</span>${el.innerHTML.trim().replace(/^["»]|["«]$/g, '')}<span class="quote-guillemet quote-guillemet-close">«</span>`;
			}

			const footer = document.createElement('footer');
			const citeLink = document.createElement('a');
			citeLink.id = instanceId;
			citeLink.className = "cite-stealth iframe-safe-link";
			citeLink.setAttribute('data-target', `bib-${citeKey}`);
			citeLink.style.cursor = "pointer";
			// Guardrail: no title attribute — the citation preview tooltip
			// (via .cite-stealth) already shows this info on hover. A native
			// browser title tooltip would overlay our custom tooltip.
			citeLink.innerHTML = `${author_display}${page}${after}`;

			footer.appendChild(document.createTextNode('— '));
			footer.appendChild(citeLink);
			quoteBox.appendChild(p);
			quoteBox.appendChild(footer);
			el.replaceWith(quoteBox);
		}
	});

	bindIframeSafeLinks();
	if (typeof source_bibliography === "function") source_bibliography();
	updateLoadingStatus("Processed Quotes.");
}

function bibtexify() {
	updateLoadingStatus("Processing Citations...");

	const containers = getTopLevelMdContainers();
	const mainContent = document.getElementById('contents');
	let footnotesDiv = document.getElementById('footnotes');
	let footnotesHTML = "";

	window.usedCitations = [];
	window.citationMap = {};
	window.footnoteCounter = 1;

	const trackCitation = (key, instanceId, isDuplicateInBlock) => {
		if (!window.bibData || !window.bibData[key]) return null;
		if (!window.usedCitations.includes(key)) window.usedCitations.push(key);
		if (!isDuplicateInBlock) {
			if (!window.citationMap[key]) window.citationMap[key] = [];
			window.citationMap[key].push(instanceId);
		}
		return window.bibData[key];
	};

	containers.forEach(container => {
		let content = container.innerHTML;
		const citedInThisBlock = new Set();

		// UPDATED REGEX: Added (?:\[(.*?)\])? to capture optional [text]
		// Now also handles comma-separated keys like \cite{key1, key2, key3}
		content = content.replace(/\\(cite|citeauthor|citeauthorlastnameand|citetitle|citeyear|citealternativetitle|citeurl)(?:\[(.*?)\])?\{([^}]+)\}/g, (match, type, manualText, keysStr) => {
			const keys = keysStr.split(/\s*,\s*/);
			const renderedKeys = keys.map((key) => {
			const isDuplicate = citedInThisBlock.has(key);
			const instanceId = `ref-${key}-${Math.random().toString(36).substr(2, 5)}`;
			const data = trackCitation(key, instanceId, isDuplicate);
			if (!data) {
				console.error(`Reference ${key} not found!`);
				return `[?${key}?]`;
			}

			citedInThisBlock.add(key);
			let linkText = "";

			// LOGIC: Use manual text if provided, otherwise switch based on type
			if (manualText !== undefined) {
				linkText = manualText;
			} else {
				switch(type) {
					case 'citeauthor': linkText = data.author; break;
					case 'citeauthorlastnameand':
						const authors = data.author.split(/, | and /).map(a => a.trim());
						const lastNames = authors.map(name => name.split(' ').pop());
						if (lastNames.length === 1) linkText = lastNames[0];
						else if (lastNames.length === 2) linkText = lastNames.join(" and ");
						else {
							const last = lastNames.pop();
							linkText = lastNames.join(", ") + " and " + last;
						}
						break;
					case 'citetitle':  linkText = data.title; break;
					case 'citealternativetitle':  linkText = data.alternativetitle; break;
					case 'citeyear':   linkText = data.year; break;
					case 'citeurl':    linkText = data.title; break;
					default:           linkText = `[${data.author}, ${data.year}]`;
				}
			}
			return { key, linkText, data };
			});

			const html = renderedKeys.map(({ key, linkText, data }) => {
				// Source icon as its own link (sibling, not nested) opening the source URL in a new tab
				const svgIcon = data.url
					? `<a class="bibtexify_auto_link_icon" href="${data.url}" target="_blank" rel="noopener noreferrer" title="View source"><span class="external_link_icon">
<svg
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:cc="http://creativecommons.org/ns#"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   viewBox="0 -256 1850 1850"
   id="svg3025"
   version="1.1"
   inkscape:version="0.48.3.1 r9886"
   width="100%"
   height="100%">
  <metadata
     id="metadata3035">
    <rdf:RDF>
      <cc:Work
	 rdf:about="">
        <dc:format>image/svg+xml</dc:format>
        <dc:type
	   rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
      </cc:Work>
    </rdf:RDF>
  </metadata>
  <defs
     id="defs3033" />
  <sodipodi:namedview
     pagecolor="#ffffff"
     bordercolor="#666666"
     borderopacity="1"
     objecttolerance="10"
     gridtolerance="10"
     guidetolerance="10"
     inkscape:pageopacity="0"
     inkscape:pageshadow="2"
     inkscape:window-width="640"
     inkscape:window-height="480"
     id="namedview3031"
     showgrid="false"
     inkscape:zoom="0.13169643"
     inkscape:cx="896"
     inkscape:cy="896"
     inkscape:window-x="0"
     inkscape:window-y="25"
     inkscape:window-maximized="0"
     inkscape:current-layer="svg3025" />
  <g
     transform="matrix(1,0,0,-1,30.372881,1426.9492)"
     id="g3027">
    <path
       d="M 1408,608 V 288 Q 1408,169 1323.5,84.5 1239,0 1120,0 H 288 Q 169,0 84.5,84.5 0,169 0,288 v 832 Q 0,1239 84.5,1323.5 169,1408 288,1408 h 704 q 14,0 23,-9 9,-9 9,-23 v -64 q 0,-14 -9,-23 -9,-9 -23,-9 H 288 q -66,0 -113,-47 -47,-47 -47,-113 V 288 q 0,-66 47,-113 47,-47 113,-47 h 832 q 66,0 113 47 47,47 47,113 v 320 q 0,14 9 23 9,9 23,9 h 64 q 14,0 23,-9 9,-9 9,-23 z m 384,864 V 960 q 0,-26 -19,-45 -19,-19 -45,-19 -26,0 -45,19 L 1507,1091 855,439 q -10,-10 -23,-10 -13,0 -23,10 L 695,553 q -10,10 -10,23 0,13 10,23 l 652,652 -176,176 q -19,19 -19,45 0,26 19,45 19,19 45,19 h 512 q 26,0 45,-19 19,-19 19,-45 z"
       id="path3029"
       inkscape:connector-curvature="0"
       style="fill:currentColor" />
  </g>
</svg>
</span></a>`
					: "";

				const instanceId = `ref-${key}-${Math.random().toString(36).substr(2, 5)}`;
				const idAttribute = citedInThisBlock.has(key) ? "" : `id="${instanceId}"`;
				const fullLink = `<a class="cite-stealth iframe-safe-link" ${idAttribute} data-target="bib-${key}" style="cursor:pointer;">${linkText}</a>`;
				return `<span class="autociteelement">${fullLink}${svgIcon}</span>`;
			}).join('');

			return html;
		});

		content = content.replace(/\\footcite\{(.+?)\}/g, (match, key) => {
			const fnId = window.footnoteCounter++;
			const instanceId = `ref-${key}-fn-${fnId}`;
			const data = trackCitation(key, instanceId, false);
			if (!data) {
				console.error(`Reference ${key} not found!`);
				return `<sup>[?${key}?]</sup>`;
			}

			let year = data.year ? `, ${data.year}` : "";
			footnotesHTML += `<li id="fn-${fnId}">${data.author}, <a class="iframe-safe-link" data-target="bib-${key}" style="cursor:pointer;">${data.title}</a>${year} <a class="iframe-safe-link" data-target="${instanceId}" style="cursor:pointer;">↩</a></li>\n`;
			return `<sup class="footnote-ref"><a class="iframe-safe-link" data-target="fn-${fnId}" id="${instanceId}" style="cursor:pointer;">[${fnId}]</a></sup>`;
		});

		container.innerHTML = content;
	});

	if (footnotesHTML) {
		if (!footnotesDiv && mainContent) {
			const footerSection = document.createElement('section');
			footerSection.id = 'footnotes-section';
			footerSection.innerHTML = `<h1>Footnotes</h1><div id="footnotes"></div>`;
			mainContent.appendChild(footerSection);
			footnotesDiv = document.getElementById('footnotes');
		}

		if(footnotesDiv) {
			footnotesDiv.innerHTML = `<ol>${footnotesHTML}</ol>`;
			document.getElementById('footnotes-section').style.display = 'block';
		}
	} else if (footnotesDiv) {
		const section = document.getElementById('footnotes-section');
		if (section) section.style.display = 'none';
	}

	bindIframeSafeLinks();
	if (typeof source_bibliography === "function") source_bibliography();
	updateLoadingStatus("Processed Citations.");
}

function source_bibliography() {
	const mainContent = document.getElementById('contents');
	let sourcesDiv = document.getElementById('sources');

	if (!sourcesDiv && mainContent && window.usedCitations.length > 0) {
		const sourcesSection = document.createElement('section');
		sourcesSection.id = 'sources-section';
		sourcesSection.innerHTML = `<h1>Sources</h1><div id="sources"></div>`;
		mainContent.appendChild(sourcesSection);
		sourcesDiv = document.getElementById('sources');
	}

	if (!sourcesDiv || window.usedCitations.length === 0) return;

	let html = "";
	const sortedKeys = [...window.usedCitations].sort((a, b) => {
		const authorA = (window.bibData[a].author || "").toLowerCase();
		const authorB = (window.bibData[b].author || "").toLowerCase();
		return authorA.localeCompare(authorB);
	});

	sortedKeys.forEach(key => {
		const data = window.bibData[key];
		const instances = window.citationMap[key] || [];
		let backLinks = "";
		if (instances.length > 0) {
			// NEW: Backlinks updated to iframe-safe-link
			const links = instances.map((id, index) => `<a class="iframe-safe-link" data-target="${id}" style="text-decoration:none; font-size:0.8em; margin:0 2px; cursor:pointer;">${index + 1}</a>`).join("");
			backLinks = `<span style="color:#888;">^ ${links}</span> `;
		}

		let entryText = `${backLinks} **${data.author}**`;
		if (data.year) entryText += ` (${data.year})`;
		entryText += `: *${data.title}*.`;
		if (data.url) entryText += ` [Link](${data.url})`;

		html += `<div id="bib-${key}" class="bib-entry" style="margin-bottom:4px;">${entryText}</div>\n`;
	});

	sourcesDiv.innerHTML = html;

	if (typeof renderMarkdown === "function") {
		sourcesDiv.querySelectorAll('.bib-entry').forEach(el => {
			if (window.marked) el.innerHTML = marked.parse(el.innerHTML);
			smartPunct(el);
		});
	}

	bindIframeSafeLinks(); // NEW: Ensure bibliography links are also clickable
}

function addCopyButtons() {
	updateLoadingStatus("Adding Copy buttons to Code Blocks...");
	document.querySelectorAll('pre[class*="language-"]').forEach((pre) => {
		if (pre.querySelector('.code-copy-btn')) return;

		pre.style.position = 'relative';
		pre.style.overflow = 'auto';

		const btnContainer = document.createElement('div');
		btnContainer.style.cssText = `
			position: sticky;
			top: 0;
			float: right;
			z-index: 10;
			pointer-events: none;
		`;

		const btn = document.createElement('button');
		btn.className = 'code-copy-btn';

		const defaultBg = 'rgba(255,255,255,0.08)';
		const defaultColor = '#aaa';
		const hoverBg = 'rgba(255,255,255,0.18)';
		const hoverColor = '#fff';
		const successColor = '#6f6';

		btn.style.cssText = `
			display: block;
			margin-left: auto;
			pointer-events: auto;
			background: ${defaultBg};
			color: ${defaultColor};
			border: 1px solid rgba(255,255,255,0.15);
			border-radius: 6px;
			padding: 4px 12px;
			cursor: pointer;
			font-size: 12px;
			backdrop-filter: blur(6px);
			transition: all 0.2s ease;
			overflow: hidden;
			position: relative;
		`;

		let isCopied = false;
		let isSwapping = false;

		// --- Build internal text container for dissolve-swap ---
		const textWrap = document.createElement('span');
		textWrap.style.cssText = 'display: inline-block; transition: opacity 0.15s ease, filter 0.15s ease, transform 0.15s ease;';
		textWrap.textContent = 'Copy';
		btn.appendChild(textWrap);

		// --- Dissolve-swap function ---
		const swapText = (newText, newColor, callback) => {
			if (isSwapping) return;
			isSwapping = true;

			// Phase 1: Dissolve out
			textWrap.style.opacity = '0';
			textWrap.style.filter = 'blur(3px)';
			textWrap.style.transform = 'translateY(-2px)';

			setTimeout(() => {
				// Phase 2: Swap and materialize
				textWrap.innerHTML = '';
				btn.style.color = newColor;

				// Staggered character reveal
				const perChar = Math.max(12, Math.min(25, 200 / newText.length));

				for (let i = 0; i < newText.length; i++) {
					const ch = document.createElement('span');
					ch.textContent = newText[i];
					ch.style.cssText = `
						display: inline-block;
						opacity: 0;
						filter: blur(3px);
						transform: translateY(2px);
						transition: opacity 0.2s ease, filter 0.2s ease, transform 0.2s ease;
					`;
					if (newText[i] === ' ') ch.style.width = '0.25em';
					textWrap.appendChild(ch);

					setTimeout(() => {
						ch.style.opacity = '1';
						ch.style.filter = 'blur(0)';
						ch.style.transform = 'translateY(0)';
					}, 20 + (i * perChar));
				}

				// Reset wrapper visibility
				textWrap.style.opacity = '1';
				textWrap.style.filter = 'blur(0)';
				textWrap.style.transform = 'translateY(0)';

				// Button border flash
				btn.style.boxShadow = `0 0 8px rgba(111, 255, 111, 0.15)`;
				setTimeout(() => { btn.style.boxShadow = 'none'; }, 600);

				setTimeout(() => {
					isSwapping = false;
					if (callback) callback();
				}, newText.length * perChar + 250);
			}, 170);
		};

		btn.addEventListener('mouseenter', () => {
			btn.style.background = hoverBg;
			if (!isCopied) btn.style.color = hoverColor;
		});

		btn.addEventListener('mouseleave', () => {
			btn.style.background = defaultBg;
			if (!isCopied) btn.style.color = defaultColor;
		});

		btn.addEventListener('click', () => {
			if (isCopied || isSwapping) return;

			const code = pre.querySelector('code');
			const text = code ? code.innerText : pre.innerText;

			const onSuccess = () => {
				isCopied = true;

				swapText('✓ Copied!', successColor, () => {
					setTimeout(() => {
						// Swap back to "Copy" with dissolve
						swapText('Copy', btn.matches(':hover') ? hoverColor : defaultColor, () => {
							isCopied = false;
						});
					}, 1600);
				});
			};

			navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
				const ta = document.createElement('textarea');
				ta.value = text;
				ta.style.position = 'fixed';
				ta.style.left = '-9999px';
				document.body.appendChild(ta);
				ta.select();
				document.execCommand('copy');
				document.body.removeChild(ta);
				onSuccess();
			});
		});

		btnContainer.appendChild(btn);
		pre.insertBefore(btnContainer, pre.firstChild);
	});
	updateLoadingStatus("Added Copy buttons to Code Blocks.");
}

function lazyInit(sectionId, initFn) {
	const el = document.getElementById(sectionId);
	if (!el) {
		console.warn(`[lazyInit] #${sectionId} not found – running initFn eagerly`);
		initFn();
		return;
	}
	_sectionInitFns.set(sectionId, initFn);
	_sectionInitObserver.observe(el);
}

function addCuriosityScore() {
	const optionals = document.querySelectorAll('div.optional');
	if (optionals.length < 2) return;

	const opened = new Set();

	const badge = document.createElement('div');
	badge.id = 'curiosity-score';
	badge.style.cssText = `
		position: fixed; top: 14px; left: 20px; z-index: 9998;
		background: rgba(20, 20, 30, 0.85);
		padding: 6px 14px; border-radius: 20px;
		font-size: 11px; font-family: system-ui, sans-serif;
		color: #666; backdrop-filter: blur(10px);
		border: 1px solid rgba(255,255,255,0.06);
		opacity: 0; transition: opacity 0.2s ease;
		pointer-events: none;
		overflow: hidden;
	`;
	document.body.appendChild(badge);

	// Internal structure for animated content
	const badgeContent = document.createElement('span');
	badgeContent.className = 'curiosity-content';
	badgeContent.style.cssText = 'display: inline-block; white-space: nowrap;';
	badge.appendChild(badgeContent);

	let currentLabel = '';
	let isSwapping = false;

	// --- Animated badge update ---
	const updateBadge = (emoji, label, count, total, isComplete) => {
		const newText = `${emoji} ${label} (${count}/${total})`;

		// If badge isn't visible yet or same label, just update without dissolve
		if (badge.style.opacity === '0' || !currentLabel) {
			badge.style.opacity = '1';
			renderBadgeContent(emoji, label, count, total, isComplete, true);
			currentLabel = label;
			return;
		}

		// If label changed, do a dissolve-swap
		if (label !== currentLabel && !isSwapping) {
			isSwapping = true;

			// Phase 1: Dissolve out current content
			badgeContent.style.transition = 'opacity 0.2s ease, filter 0.2s ease';
			badgeContent.style.opacity = '0';
			badgeContent.style.filter = 'blur(3px)';

			setTimeout(() => {
				// Phase 2: Swap content and animate in
				renderBadgeContent(emoji, label, count, total, isComplete, true);
				currentLabel = label;

				setTimeout(() => { isSwapping = false; }, 500);
			}, 220);
		} else {
			// Same label, just update the counter with a quick flip
			animateCounterUpdate(count, total);
		}
	};

	// --- Render badge with optional character stagger ---
	const renderBadgeContent = (emoji, label, count, total, isComplete, animate) => {
		badgeContent.innerHTML = '';
		badgeContent.style.opacity = '1';
		badgeContent.style.filter = 'blur(0)';

		// Emoji with glow pulse
		const emojiSpan = document.createElement('span');
		emojiSpan.className = 'curiosity-emoji';
		emojiSpan.textContent = emoji + ' ';
		if (animate) {
			emojiSpan.style.cssText = 'display:inline-block; opacity:0; filter:blur(4px); transform:scale(0.7); transition: opacity 0.3s ease, filter 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);';
			setTimeout(() => {
				emojiSpan.style.opacity = '1';
				emojiSpan.style.filter = 'blur(0)';
				emojiSpan.style.transform = 'scale(1)';
			}, 30);
		}
		badgeContent.appendChild(emojiSpan);

		// Label text — staggered character reveal
		const labelSpan = document.createElement('span');
		labelSpan.style.color = themeColor('#dddddd');

		if (animate) {
			const perChar = Math.max(10, Math.min(25, 400 / label.length));
			for (let i = 0; i < label.length; i++) {
				const ch = document.createElement('span');
				ch.textContent = label[i];
				ch.style.cssText = `display:inline-block; opacity:0; filter:blur(3px); transform:translateY(2px); transition: opacity 0.25s ease, filter 0.25s ease, transform 0.25s ease;`;
				if (label[i] === ' ') ch.style.width = '0.25em';
				labelSpan.appendChild(ch);

				setTimeout(() => {
					ch.style.opacity = '1';
					ch.style.filter = 'blur(0)';
					ch.style.transform = 'translateY(0)';
				}, 80 + (i * perChar)); // 80ms offset to let emoji pop first
			}
		} else {
			labelSpan.textContent = label;
		}
		badgeContent.appendChild(labelSpan);

		// Counter
		const counterSpan = document.createElement('span');
		counterSpan.className = 'curiosity-counter';
		counterSpan.style.color = '#fff';
		counterSpan.textContent = ` (${count}/${total})`;

		if (animate) {
			counterSpan.style.cssText += '; opacity:0; filter:blur(3px); transition: opacity 0.3s ease, filter 0.3s ease;';
			const counterDelay = 80 + (label.length * Math.max(10, Math.min(25, 400 / label.length))) + 100;
			setTimeout(() => {
				counterSpan.style.opacity = '1';
				counterSpan.style.filter = 'blur(0)';
			}, counterDelay);
		}
		badgeContent.appendChild(counterSpan);

		// Completion glow
		if (isComplete) {
			badge.style.color = '#ce93d8';
			badge.style.borderColor = 'rgba(171,71,188,0.3)';
		}
	};

	// --- Quick counter flip for same-label updates ---
	const animateCounterUpdate = (count, total) => {
		const counter = badgeContent.querySelector('.curiosity-counter');
		if (!counter) return;

		counter.style.transition = 'opacity 0.15s ease, filter 0.15s ease';
		counter.style.opacity = '0';
		counter.style.filter = 'blur(3px)';

		setTimeout(() => {
			counter.textContent = ` (${count}/${total})`;
			counter.style.opacity = '1';
			counter.style.filter = 'blur(0)';
		}, 160);
	};

	optionals.forEach((block, i) => {
		const header = block.querySelector('.optional-header');
		if (!header) return;

		const origClick = header.onclick;
		header.onclick = (e) => {
			if (origClick) origClick(e);

			if (!opened.has(i)) {
				opened.add(i);
				const total = optionals.length;
				const count = opened.size;
				const pct = Math.round((count / total) * 100);

				let label = 'Curious';
				let emoji = '🔎';
				if (pct >= 100) { label = 'Insatiably Curious'; emoji = '⭐'; }
				else if (pct >= 75) { label = 'Very Curious'; emoji = '🔬'; }
				else if (pct >= 50) { label = 'Curious'; emoji = '🔎'; }
				else if (pct >= 25) { label = 'Getting Curious'; emoji = '👀'; }

				updateBadge(emoji, label, count, total, count === total);

				// Pulse
				badge.style.transform = 'scale(1.06)';
				badge.style.borderColor = 'rgba(171,71,188,0.3)';
				setTimeout(() => {
					badge.style.transform = 'scale(1)';
					badge.style.borderColor = 'rgba(255,255,255,0.06)';
				}, 700);

				// Fade out after delay
				setTimeout(() => {
					badge.style.opacity = '0';
				}, 2500);
			}
		};
	});
}

function initOptionalBlocks() {
	updateLoadingStatus("Processing Optional Blocks...");
	document.querySelectorAll('div.optional').forEach(block => {
		if (block.classList.contains('optional-initialized')) {
			console.info("Leaving optional block click early");
			return;
		}
		block.classList.add('optional-initialized');

		const headline = block.getAttribute('data-headline') || "More Information";
		let contentHtml = block.innerHTML;
		block.innerHTML = '';

		// Create Header
		const header = document.createElement('div');
		header.className = 'optional-header';
		header.style.cursor = 'pointer';
		header.innerHTML = `
			<span class="optional-icon" style="display:inline-block; transition: transform 0.3s ease;">▶</span>
			<span class="optional-title">${headline}</span>
		`;

		// ── Markdown pass for nested .optional.md blocks ─────────────
		// getTopLevelMdContainers() only processes .md containers whose
		// ancestors are NOT .md. A <div class="optional md"> is always
		// nested inside the outer <div class="md"> section, so
		// renderMarkdown() skips it; marked, in turn, treats the nested
		// <div> as a raw HTML block and passes its body through
		// untouched. That is why "*italic*" inside an optional block used
		// to render as literal "*italic*" instead of <em>italic</em>.
		//
		// bibtexify(), BlogClusters.preprocess(), BlogTopics.preprocess()
		// and the \index{} replacement all run on the OUTER container's
		// string content, so their substitutions (citations, index
		// spans, cluster/topic markers) ARE already present inside the
		// optional body — marked.parse() will simply leave that HTML
		// alone while processing the still-raw markdown around it.
		//
		// Top-level .optional.md blocks (no .md ancestor) were already
		// processed by renderMarkdown() and must NOT be re-parsed.
		const nestedUnderMd =
			!!block.parentElement &&
			!!block.parentElement.closest('.md');

		if (nestedUnderMd && typeof marked !== 'undefined' && typeof marked.parse === 'function') {
			contentHtml = marked.parse(contentHtml);
		}

		// Create Content Wrapper (initially hidden)
		const contentWrapper = document.createElement('div');
		contentWrapper.className = 'optional-content';
		contentWrapper.style.display = 'none';
		// 🔧 FIX 2: overflow:hidden NICHT mehr dauerhaft setzen.
		// Es wird nur noch temporär während der Collapse-Animation gesetzt.
		// Vorher blieb overflow:hidden nach dem Expand permanent bestehen,
		// was in Kombination mit einer CSS max-height den Inhalt bei ~2000px abschnitt.
		contentWrapper.innerHTML = contentHtml;

		// Mirror renderMarkdown()'s post-processing on the freshly
		// rendered subtree so typographic punctuation, [[t:…]] topic
		// visibility, and per-cluster CSS all behave consistently with
		// the rest of the page.
		smartPunct(contentWrapper);
		if (window.BlogTopics && BlogTopics.applyVisibility) {
			BlogTopics.applyVisibility();
		}
		if (window.BlogClusters && BlogClusters.injectCSS) {
			BlogClusters.injectCSS();
		}

		block.appendChild(header);
		block.appendChild(contentWrapper);

		let isAnimating = false;

		// --- Staggered paragraph reveal ---
		const animateContentIn = (wrapper, onComplete) => {
			const children = wrapper.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > pre, :scope > blockquote, :scope > div, :scope > table, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');

			if (children.length === 0) {
				wrapper.style.opacity = '0';
				wrapper.style.filter = 'blur(3px)';
				wrapper.style.transform = 'translateY(6px)';
				wrapper.style.transition = 'opacity 0.35s ease, filter 0.35s ease, transform 0.35s ease';
				requestAnimationFrame(() => {
					wrapper.style.opacity = '1';
					wrapper.style.filter = 'blur(0)';
					wrapper.style.transform = 'translateY(0)';
				});
				if (onComplete) setTimeout(onComplete, 400);
				return;
			}

			const perChild = Math.max(30, Math.min(100, 500 / children.length));

			children.forEach((child, i) => {
				child.style.opacity = '0';
				child.style.filter = 'blur(4px)';
				child.style.transform = 'translateY(8px)';
				child.style.transition = 'opacity 0.35s ease, filter 0.35s ease, transform 0.35s ease';

				setTimeout(() => {
					child.style.opacity = '1';
					child.style.filter = 'blur(0px)';
					child.style.transform = 'translateY(0px)';
				}, i * perChild);

				// 🔧 FIX (angle 7): after the animation completes, strip EVERY
				// property that could create a containing block for
				// position:fixed descendants. Not just transform — also
				// filter, backdrop-filter, clip-path, mask, perspective,
				// will-change, contain.
				setTimeout(() => {
					child.style.transform = '';
					child.style.filter = '';
					child.style.backdropFilter = '';
					child.style.clipPath = '';
					child.style.mask = '';
					child.style.perspective = '';
					child.style.willChange = 'auto';
					child.style.contain = '';
				}, i * perChild + 380);
			});

			if (onComplete) {
				setTimeout(onComplete, children.length * perChild + 380);
			}
		};

		// --- Dissolve out content ---
		const animateContentOut = (wrapper, onComplete) => {
			const children = wrapper.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > pre, :scope > blockquote, :scope > div, :scope > table, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');

			if (children.length === 0) {
				wrapper.style.transition = 'opacity 0.25s ease, filter 0.25s ease';
				wrapper.style.opacity = '0';
				wrapper.style.filter = 'blur(3px)';
				if (onComplete) setTimeout(onComplete, 280);
				return;
			}

			const perChild = Math.max(15, Math.min(50, 250 / children.length));
			const reversed = [...children].reverse();

			reversed.forEach((child, i) => {
				child.style.transition = 'opacity 0.2s ease, filter 0.2s ease, transform 0.2s ease';
				setTimeout(() => {
					child.style.opacity = '0';
					child.style.filter = 'blur(3px)';
					child.style.transform = 'translateY(-4px)';
				}, i * perChild);
			});

			if (onComplete) {
				setTimeout(onComplete, reversed.length * perChild + 230);
			}
		};

		// Toggle Logic
		header.onclick = () => {
			if (isAnimating) {
				console.info("isAnimating: leaving early");
				return;
			}

			const icon = header.querySelector('.optional-icon');
			const isHidden = contentWrapper.style.display === 'none';

			if (isHidden) {
				// --- EXPAND ---
				isAnimating = true;

				icon.style.transform = 'rotate(90deg)';
				icon.innerHTML = '▼';
				header.classList.add('active');

				block.style.transition = 'box-shadow 0.4s ease';
				block.style.boxShadow = '0 0 12px rgba(171,71,188,0.15)';
				setTimeout(() => { block.style.boxShadow = 'none'; }, 800);

				// 🔧 FIX 3a: overflow:hidden nur WÄHREND der Animation setzen,
				// damit die staggered-Einblendung sauber aussieht.
				contentWrapper.style.overflow = 'hidden';
				contentWrapper.style.display = 'block';

				requestAnimationFrame(() => {
					animateContentIn(contentWrapper, () => {
						// 🔧 FIX 3b: Nach der Animation overflow ENTFERNEN,
						// damit der gesamte Inhalt sichtbar ist – egal wie lang.
						contentWrapper.style.overflow = '';
						isAnimating = false;
					});
				});

			} else {
				// --- COLLAPSE ---
				isAnimating = true;

				// 🔧 FIX 3c: overflow:hidden setzen, BEVOR die Collapse-Animation startet,
				// damit nichts beim Zuklappen herausragt.
				contentWrapper.style.overflow = 'hidden';

				animateContentOut(contentWrapper, () => {
					contentWrapper.style.display = 'none';
					// overflow spielt bei display:none keine Rolle,
					// wird aber beim nächsten Expand sowieso neu gesetzt.
					contentWrapper.style.overflow = '';

					const children = contentWrapper.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > pre, :scope > blockquote, :scope > div, :scope > table, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
					children.forEach(child => {
						child.style.opacity = '';
						child.style.filter = '';
						child.style.transform = '';
						child.style.transition = '';
					});

					icon.style.transform = 'rotate(0deg)';
					icon.innerHTML = '▶';
					header.classList.remove('active');

					isAnimating = false;
				});
			}
		};
	});
	updateLoadingStatus("Processed Optional Blocks.");
}

function addKonamiEgg() {
	const code = [38,38,40,40,37,39,37,39,66,65];
	let pos = 0;

	document.addEventListener('keydown', (e) => {
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

		if (e.keyCode === code[pos]) {
			pos++;
			if (pos === code.length) {
				pos = 0;
				showKonamiReward();
			}
		} else {
			pos = 0;
		}
	});

	function showKonamiReward() {
		const msgs = [
			"You found the secret. Turing would be proud.",
			"Achievement unlocked: Knows the Konami Code AND backpropagation.",
			"Hidden layer discovered. You ARE the neural network now.",
			"sudo grant-diploma --field='AI' --effort='konami'",
			"Error 418: I'm a teapot. But you're a scholar.",
			"Gradient descent complete. You've reached the global minimum of easter eggs.",
		];

		const msg = msgs[Math.floor(Math.random() * msgs.length)];

		const el = document.createElement('div');
		el.style.cssText = `
			position: fixed; top: 50%; left: 50%;
			transform: translate(-50%, -50%) scale(0.9);
			background: rgba(10, 10, 20, 0.95); color: #4ade80;
			padding: 30px 40px; border-radius: 12px;
			font-family: monospace; font-size: 15px;
			text-align: center; max-width: 420px;
			border: 1px solid rgba(74,222,128,0.2);
			box-shadow: 0 0 80px rgba(74,222,128,0.08);
			z-index: 999999; opacity: 0;
			transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
		`;

		// --- Build internal structure for phased animation ---
		const emojiDiv = document.createElement('div');
		emojiDiv.style.cssText = 'font-size: 28px; margin-bottom: 12px; opacity: 0; filter: blur(6px); transform: scale(0.6); transition: opacity 0.4s ease, filter 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);';
		emojiDiv.textContent = '🎮';

		const codeDiv = document.createElement('div');
		codeDiv.style.cssText = 'margin-bottom: 8px; min-height: 1.2em;';

		const msgDiv = document.createElement('div');
		msgDiv.style.cssText = 'color: #aaa; font-size: 13px; line-height: 1.6; min-height: 2em;';

		el.appendChild(emojiDiv);
		el.appendChild(codeDiv);
		el.appendChild(msgDiv);
		document.body.appendChild(el);

		// --- Staggered character reveal helper ---
		const staggerReveal = (container, text, perChar, startDelay, onComplete) => {
			container.innerHTML = '';
			for (let i = 0; i < text.length; i++) {
				const ch = document.createElement('span');
				ch.textContent = text[i];
				ch.style.cssText = `
					display: inline-block;
					opacity: 0;
					filter: blur(4px);
					transform: translateY(4px);
					transition: opacity 0.3s ease, filter 0.3s ease, transform 0.3s ease;
				`;
				if (text[i] === ' ') ch.style.width = '0.35em';
				container.appendChild(ch);

				setTimeout(() => {
					ch.style.opacity = '1';
					ch.style.filter = 'blur(0)';
					ch.style.transform = 'translateY(0)';
				}, startDelay + (i * perChar));
			}
			if (onComplete) {
				setTimeout(onComplete, startDelay + (text.length * perChar) + 300);
			}
		};

		// Phase 1: Container scales in
		requestAnimationFrame(() => {
			el.style.opacity = '1';
			el.style.transform = 'translate(-50%, -50%) scale(1)';

			// Phase 2: Emoji materializes with glow pulse (200ms)
			setTimeout(() => {
				emojiDiv.style.opacity = '1';
				emojiDiv.style.filter = 'blur(0)';
				emojiDiv.style.transform = 'scale(1)';

				// Border glow flash
				el.style.boxShadow = '0 0 120px rgba(74,222,128,0.15)';
				setTimeout(() => {
					el.style.boxShadow = '0 0 80px rgba(74,222,128,0.08)';
				}, 600);
			}, 200);

			// Phase 3: Konami code types out character by character (500ms)
			// Each arrow/letter appears like it's being typed back
			const konamiText = '↑↑↓↓←→←→BA';
			staggerReveal(codeDiv, konamiText, 65, 500);

			// Phase 4: Message text cascades in (after code finishes)
			const codeFinish = 500 + (konamiText.length * 65) + 200;
			const msgPerChar = Math.max(8, Math.min(20, 500 / msg.length));
			staggerReveal(msgDiv, msg, msgPerChar, codeFinish);

			// Phase 5: Dismissal — full dissolve
			const totalAnimTime = codeFinish + (msg.length * msgPerChar) + 800;
			const dismissTime = Math.max(5000, totalAnimTime + 1000);

			setTimeout(() => {
				// Dissolve text in reverse: message first, then code, then emoji
				const msgChars = [...msgDiv.querySelectorAll('span')].reverse();
				const codeChars = [...codeDiv.querySelectorAll('span')].reverse();

				const msgPerOut = Math.max(3, Math.min(8, 150 / msgChars.length));
				msgChars.forEach((ch, i) => {
					setTimeout(() => {
						ch.style.opacity = '0';
						ch.style.filter = 'blur(3px)';
						ch.style.transform = 'translateY(-3px)';
					}, i * msgPerOut);
				});

				const codeOutStart = msgChars.length * msgPerOut + 100;
				codeChars.forEach((ch, i) => {
					setTimeout(() => {
						ch.style.opacity = '0';
						ch.style.filter = 'blur(3px)';
						ch.style.transform = 'translateY(-3px)';
					}, codeOutStart + (i * 30));
				});

				const emojiOutStart = codeOutStart + (codeChars.length * 30) + 100;
				setTimeout(() => {
					emojiDiv.style.opacity = '0';
					emojiDiv.style.filter = 'blur(6px)';
					emojiDiv.style.transform = 'scale(0.6)';
				}, emojiOutStart);

				// Container fades last
				setTimeout(() => {
					el.style.opacity = '0';
					el.style.transform = 'translate(-50%, -50%) scale(0.95)';
					setTimeout(() => el.remove(), 600);
				}, emojiOutStart + 400);
			}, dismissTime);
		});
	}
}

/**
 * Attempt to generate a beautiful, unique but deterministic palette from a string.
 * Returns an object with hue, a gradient, and a glow color.
 */
function tokenColor(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 7) - hash) + str.charCodeAt(i);
		hash |= 0;
	}
	const hue = Math.abs(hash) % 360;
	const hue2 = (hue + 30) % 360;
	return {
		hue,
		id: Math.abs(hash) % 10000,
		bg: `linear-gradient(135deg, hsl(${hue}, 70%, 42%), hsl(${hue2}, 80%, 32%))`,
		glow: `hsla(${hue}, 80%, 50%, 0.35)`,
		border: `hsla(${hue}, 60%, 70%, 0.25)`
	};
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function toggleDarkMode() {
	const darkStyleId = 'dark-mode-style';
	const existing = document.getElementById(darkStyleId);

	if (existing) {
		existing.remove();
		return;
	}

	const style = document.createElement('style');
	style.id = darkStyleId;
	style.textContent = `
    /* === ALLES INVERTIEREN === */
    html {
      filter: invert(1) hue-rotate(180deg) !important;
      background-color: #fff !important;
    }

    /* === BILDER ZURÜCK-INVERTIEREN (doppelt = original) === */
    img,
    picture,
    video,
    canvas,
    iframe {
      filter: invert(1) hue-rotate(180deg) !important;
    }

    /* === BEREITS DUNKLE UI ZURÜCK-INVERTIEREN === */
    #training-progress-bar-container,
    #tlab-bar-idle,
    #tlab-bar-training,
    #tlab-bar-done {
      filter: invert(1) hue-rotate(180deg) !important;
    }

    /* === PLOTLY: nur die SVG-Hintergründe fixen === */
    .js-plotly-plot .main-svg {
      background: transparent !important;
    }
    .js-plotly-plot .main-svg rect.bg {
      fill: transparent !important;
    }
  `;
	document.head.appendChild(style);

	// Plotly SVG rects einmalig patchen (kein Observer!)
	function patchPlotlyOnce() {
		document.querySelectorAll('.js-plotly-plot').forEach(plot => {
			// Alle weißen rect-Fills transparent machen
			// → die globale Invertierung macht den Hintergrund dann dunkel
			plot.querySelectorAll('rect').forEach(rect => {
				const fill = (rect.getAttribute('fill') || '').toLowerCase();
				if (fill === '#fff' || fill === '#ffffff' || fill === 'white' || fill === 'rgb(255, 255, 255)' || fill === 'rgb(255,255,255)') {
					rect.setAttribute('fill', 'transparent');
				}
			});
			// Inline background-color auf dem Container entfernen
			const mainSvgs = plot.querySelectorAll('.main-svg');
			mainSvgs.forEach(svg => {
				svg.style.background = 'transparent';
			});
		});
	}

	// Einmalig + verzögert (für async Plotly renders)
	patchPlotlyOnce();
	setTimeout(patchPlotlyOnce, 200);
	setTimeout(patchPlotlyOnce, 800);
}

function addConsoleEasterEggs() {
	const styles = 'color: #4fc3f7; font-size: 14px; font-weight: bold;';
	const sub = 'color: #888; font-size: 11px;';

	console.log('%c🤓 Hey, you opened DevTools.', styles);
	console.log('%cThat means you\'re curious. We like curious.', sub);
	console.log('%cThe full source code is available at https://github.com/NormanTUD/asanAI/tree/master/blog', sub);

	const tips = [
		"The backpropagation algorithm was independently discovered at least 3 times before it became famous.",
		"The word 'embedding' comes from topology — mapping one space into another while preserving structure.",
		"GPT-3 has 175 billion parameters. A fruit fly brain has ~100,000 neurons. Draw your own conclusions.",
		"The 'temperature' in sampling is borrowed from thermodynamics. Boltzmann would be proud.",
		"The Transformer was originally designed for translation. Nobody expected it to write poetry.",
		"Layer normalization was invented because batch normalization doesn't work well with sequences.",
		"Tokenizers don't understand language. They understand byte frequencies. That's somehow enough.",
		"The softmax function is just a Boltzmann distribution wearing a trench coat.",
	];

	console.log(`%c💡 ${tips[Math.floor(Math.random() * tips.length)]}`, sub);

	window.lol = () => {
		const jokes = [
			"Why do neural networks never get lonely?\nThey have lots of connections.",
			"A QA engineer walks into a bar.\nOrders 1 beer. Orders 0 beers. Orders 99999999 beers.\nOrders -1 beers. Orders a lizard. Orders NULL beers.",
			"Roses are red, violets are blue,\nunexpected '{' on line 32.",
			"There are only 10 types of people:\nthose who understand binary and those who've completed this course.",
			"Why did the neural network go to therapy?\nIt had too many deep issues.",
			"What's a transformer's favorite band?\nThe Attention Heads.",
			"My neural network told me a joke about vanishing gradients.\nBut I couldn't get it.",
			"How does a neural network apologize?\n'Sorry, that was a local minimum of judgment.'",
			"Why don't transformers use RNNs?\nBecause they don't have the attention span. Wait—",
			"Overfitting is when you memorize the exam.\nUnderfitting is when you didn't even buy the textbook.",
			"A dropout layer walks into a bar.\nHalf the neurons don't show up.",
			"What did the loss function say to the optimizer?\n'You're going the wrong way.' 'No, I'm just exploring.'",
			"Why was the embedding space so peaceful?\nBecause similar things stayed close together.",
			"I asked GPT to write a joke about backpropagation.\nIt blamed the previous layer.",
		];

		const joke = jokes[Math.floor(Math.random() * jokes.length)];
		console.log(`%c😂 ${joke}`, 'color: #ffd54f; font-size: 12px;');
		return '😂';
	};
}


/* ════════════════════════════════════════════════════════════
   GLOSSARY — auto-linked term definitions
   ════════════════════════════════════════════════════════ */
const GLOSSARY = {
	'tensor': 'A multi-dimensional array of numbers — the fundamental data structure in ML frameworks like TensorFlow and PyTorch.',
	'logit': 'The raw, unnormalized output of a model layer before softmax is applied. Logits can be any real number.',
	'softmax': 'A function that converts a vector of logits into a probability distribution where values sum to 1.',
	'embedding': 'A dense vector representation of a discrete entity (word, token, concept) in a continuous high-dimensional space.',
	'attention': 'A mechanism that lets each token in a sequence weigh the importance of every other token when computing its own representation.',
	'self-attention': 'An attention mechanism where queries, keys, and values all come from the same source — the input sequence itself.',
	'transformer': 'A neural network architecture that uses self-attention instead of recurrence, forming the basis of modern LLMs.',
	'residual stream': 'The sum of all layer outputs flowing through the model; each layer reads from and writes to this shared "notebook."',
	'layer normalization': 'A technique that normalizes activations across the feature dimension, stabilizing training by keeping values in a consistent range.',
	'backpropagation': 'The algorithm that computes gradients of the loss with respect to every weight in the network by applying the chain rule backwards.',
	'group': 'A set equipped with an associative binary operation, an identity element, and inverses for every element. The algebraic structure underlying symmetry.',
	'subgroup': 'A subset of a group that is itself a group under the same operation. e.g. the even integers form a subgroup of the integers under addition.',
	'groupoid': 'A generalisation of a group in which there can be many objects, not just one. Each pair of objects has a set of invertible morphisms between them that compose and have inverses.',
	'infinity-groupoid': 'An ∞-groupoid — a groupoid with invertible morphisms at every level: objects, 1-morphisms between objects, 2-morphisms between parallel 1-morphisms, 3-morphisms between those, and so on ad infinitum. In HoTT, every type is an ∞-groupoid.',
	'homotopy': 'A continuous deformation between two paths (or more generally, between two morphisms). When a homotopy exists between two paths, they are considered equal in HoTT.',
	'sheaf': 'A mathematical object that assigns data to every open set of a topological space, consistently across overlaps. The local-to-global principle formalised: local data glues into global data iff it agrees on overlaps.',
	'stalk': 'The data assigned by a sheaf at a single point — all the germs at that point, collected. The "local view" of the sheaf at one point.',
	'germ': 'An equivalence class of functions (or sections) that agree in some neighbourhood of a point. The atomic unit of local data in sheaf theory.',
	'section': 'In sheaf theory, a choice of data over an open set, compatible with the sheaf\'s restriction maps. The "global" data the sheaf provides.',
	'restriction map': 'A map that takes data defined on a larger open set and restricts it to a smaller one. The compatibility check that makes a presheaf into a sheaf.',
	'topology': 'Similiar to geometry, but distance is abstracted away and of two points you can only say that d(x, y) = 0 if they are the same point, and d(x, y) != 0 if they are not.',
	'open cover': 'A collection of open sets whose union is the whole space. Sheaves are tested on covers: local data on each open set must glue to global data on the whole.',
	'category': 'A collection of objects and morphisms between them, with associative composition and identity morphisms. The language of modern structural mathematics.',
	'functor': 'A structure-preserving map between categories: it sends objects to objects and morphisms to morphisms, respecting composition and identities.',
	'natural transformation': 'A family of morphisms, one for each object of a category, that commutes with every morphism of that category. The "morphism between functors."',
	'adjoint functors': 'A pair of functors going in opposite directions that are "best approximations" of each other — one is the most general, the other the most specific. Ubiquitous in mathematics and computer science.',
	'limit': 'A universal construction that builds the "most general" object receiving maps from a given diagram. Products, equalisers, and pullbacks are all limits.',
	'colimit': 'The dual of a limit: the "most specific" object that all objects in a diagram map into. Coproducts and pushouts are colimits.',
	'universal property': 'A definition of a mathematical object by the maps into (or out of) it — the object that makes every compatible diagram commute in the "best" way. Products, sums, free constructions all have one.',
	'HoTT': 'Homotopy Type Theory — a foundational language for mathematics where types are spaces, terms are points, and equality is a path. The "oid" in ∞-groupoid means "group-like, but with many objects."',
	'univalence axiom': 'The axiom that equivalent types are equal: (A ≃ B) ≃ (A = B). Equality of types is exactly equivalence of types.',
	'identity type': 'In HoTT, the type of proofs that two terms are equal. An inhabitant of `Id_A(a, b)` is a path from `a` to `b` in the space `A`.',
	'path': 'In HoTT, a proof of equality between two terms — equivalently, a continuous path between two points in the corresponding space. Paths compose, and paths-between-paths (homotopies) live one level up.',
	'sheaf condition': 'The requirement that local sections of a sheaf on an open cover agree on overlaps iff they glue to a unique global section. What separates a sheaf from a mere presheaf.',
	'gluing': 'The process of assembling local data into global data, made unique by the sheaf condition. The sheaf condition says: compatible local data glues into exactly one global section.',
	'topological space': 'A set $X$ together with a collection of subsets (the open sets) closed under finite intersection and arbitrary union. Topology is geometry with the metric stripped away: of two points you can only ask whether one lies in a neighbourhood of the other, not how far apart they are.',
	'open set': 'In a topological space, a subset $U$ such that every point $x \\in U$ has some room around it still inside $U$. Intuition: think of $U$ as a city district. Each house in the district must have a little bit of street around it that is still in the district.',
	'fiber bundle': 'A space that looks locally like a product $B \\times F$ (base $\\times$ fibre) but may twist globally. A Möbius strip is the simplest non-trivial example: locally it looks like a strip of paper, but globally it has only one side. A vector bundle is a fiber bundle whose fibres are vector spaces.',
	'manifold': 'A topological space that locally looks like ordinary Euclidean space $\\mathbb{R}^n$. A sphere looks flat to an ant standing on it (locally $\\mathbb{R}^2$), but its global structure is curved. The embedding spaces in modern AI are usually assumed to lie on low-dimensional manifolds inside the high-dimensional ambient space.',
	'topos': 'A "universe of mathematics": a category that behaves, in enough respects, like the category of ordinary sets, with its own internal logic. Sheaves on a space form a topos; in this topos you can do all of set-theoretic mathematics, but the internal logic may not be classically Boolean. Introduced by Alexander Grothendieck in the early 1960s and axiomatised by Lawvere and Tierney.',
	'elementary topos': 'A category with finite limits, exponentials (so it is Cartesian closed), and a subobject classifier $\\Omega$. Every Grothendieck topos is an elementary topos; there are elementary topoi that are not Grothendieck (e.g. the effective topos, FinSet). The axioms are due to Lawvere and Tierney.',
	'grothendieck topos': 'A topos that is "the right size": equivalent to the category of sheaves on a small site. Characterised by Giraud\'s axioms: small set of generators, all small colimits, sums are disjoint, equivalence relations are effective. Equivalently, an elementary topos that is cocomplete and has a small generating set.',
	'subobject classifier': 'An object $\\Omega$ in a category together with a monomorphism $\\mathrm{true}: 1 \\to \\Omega$ such that every monomorphism $m: Y \\hookrightarrow X$ arises uniquely as a pullback of $\\mathrm{true}$ along a characteristic map $\\chi_m: X \\to \\Omega$. In Set, $\\Omega = \\{0, 1\\}$. In $\\mathbf{Sh}(X)$, $\\Omega(U)$ is the set of open subsets of $U$. The presence of $\\Omega$ is what makes the category "set-like" and gives it an internal logic.',
	'geometric morphism': 'The right notion of "map between topoi". A geometric morphism $f: \\mathcal{F} \\to \\mathcal{E}$ is an adjoint pair $f^* \\dashv f_*$ of functors with $f^*$ (the inverse image) left adjoint and finite-limit-preserving. Continuous maps $X \\to Y$ between spaces induce geometric morphisms $\\mathbf{Sh}(X) \\to \\mathbf{Sh}(Y)$. Points of a topos $\\mathcal{E}$ are geometric morphisms $\\mathbf{Set} \\to \\mathcal{E}$.',
	'heyting algebra': 'The intuitionistic generalization of a Boolean algebra: a lattice with $\\wedge, \\vee, \\Rightarrow, \\bot, \\top$ satisfying all the usual axioms except possibly the law of excluded middle $p \\vee \\neg p = \\top$. The subobject classifier of a topos is always a Heyting algebra internally, and is a Boolean algebra exactly when the topos is Boolean (e.g. Set, Sh(X) for a locale X).',
	'mitchell-bénabou language': 'The internal language of a topos: a typed higher-order intuitionistic logic in which one can write formulas and prove them inside the topos, with types interpreted as objects, terms as generalized elements, $\\Omega$-valued truth as the codomain of characteristic maps. Any theorem provable in higher-order intuitionistic logic holds internally in every topos.',
	'natural numbers object': 'An object $\\mathbb{N}$ in a topos with morphisms $0: 1 \\to \\mathbb{N}$ and $s: \\mathbb{N} \\to \\mathbb{N}$ that is universal for endomorphisms. Every Grothendieck topos has one (so Peano arithmetic works inside it), but an arbitrary elementary topos need not (e.g. FinSet does not). Its existence is what makes "arithmetic" available internally.',
	'internal logic': 'The logic obtained by interpreting the connectives, quantifiers and equality of a formal language inside a category with a subobject classifier. The internal logic of any topos is intuitionistic higher-order logic; the internal logic of a Boolean topos is classical.',
	'point of a topos': 'A geometric morphism $p: \\mathbf{Set} \\to \\mathcal{E}$, i.e. a way of recovering a "classical point" inside the topos. Many topoi have no points (Deligne gave a famous example), which forces one to work entirely with the internal, generalized notion.',
	'diaconescu\'s theorem': 'In any topos, the axiom of choice implies the law of excluded middle. This is a striking result: the two principles, classically equivalent in Set, become strictly separated once we leave Set behind.',
	'boolean topos': 'A topos in which the subobject classifier $\\Omega$ is (internally) the two-element set $\{0, 1\}$. Equivalently, a topos whose internal logic is classical. Set and $\\mathbf{Sh}(X)$ for any locale $X$ are Boolean.',
	'site': 'A small category equipped with a Grothendieck topology: a collection of "covering families" of morphisms, telling you which families of objects cover a given object. The category of sheaves on a site is a Grothendieck topos. Many non-equivalent sites can give equivalent topoi.',
	'presheaf topos': 'For a small category $\\mathcal{C}$, the functor category $[\mathcal{C}^{\\mathrm{op}}, \\mathbf{Set}]$. This is always a Grothendieck topos. The Yoneda embedding sends $\\mathcal{C}$ into it, so $\\mathcal{C}$ can be recovered from its presheaf topos.',
	'sheaf topos': 'For a topological space $X$ (or, more generally, a site), the category $\\mathbf{Sh}(X)$ of set-valued sheaves on $X$. This is the prototypical Grothendieck topos. Truth values in $\\mathbf{Sh}(X)$ are open sets, so statements can be "true on $U$, false on $V$, neither on the rest".',
	'barr\'s theorem': 'Every topos is a quotient (in the 2-categorical sense) of a presheaf topos. Equivalently, every topos can be obtained from Set by freely adjoining small colimits and then quotienting by a small "exact" congruence. This makes presheaf topoi, which are easy to compute with, dense among all topoi.',
	'monomorphism': 'A morphism $m: X \\to Y$ that is left-cancellable: if $f \\circ m = g \\circ m$ then $f = g$. The categorical generalisation of "injective function". The diagonal $\\Delta_X: X \\to X \\times X$ is always a monomorphism; in a topos every monomorphism is a pullback of the truth morphism $\\mathrm{true}: 1 \\hookrightarrow \\Omega$.',
	'epimorphism': 'A morphism $e: X \\to Y$ that is right-cancellable: if $e \\circ f = e \\circ g$ then $f = g$. The categorical generalisation of "surjective function". In a topos every morphism factors uniquely as an epimorphism followed by a monomorphism.',
	'pullback': {
		def: 'In category theory: the limit of a cospan (a diagram shaped like a corner with two arrows $X \\to Z$ and $Y \\to Z$ into a common apex). The pullback $X \\times_Z Y$ is the "most general" object receiving compatible maps from $X$ and $Y$. The categorical generalisation of the fibre product.',
		exclude: [/\bgit\b/i, /\bproduct\b/i, /\bbusiness\b/i, /\bsales\b/i, /\brequest\b/i, /\bfeedback\b/i]
	},
	'terminal object': 'The final object $1$ in a category: an object with exactly one morphism into it from every other object. In Set it is any singleton. Every morphism in a category with a terminal object has a unique factorization through it, which makes $1$ the categorical analogue of "the one-element set".',
	'initial object': 'The empty object $0$ in a category: an object with exactly one morphism out of it into every other object. In Set it is the empty set. Categorical dual of the terminal object; together they are the trivial cases of limits and colimits.',
	'cartesian closed': 'A category $\\mathcal{C}$ in which for every pair of objects $A, B$ there is an exponential object $B^A$ and the functor $-\\times A$ has a right adjoint — equivalently, morphisms out of a product $C \\times A$ biject naturally with morphisms $C \\to B^A$. Set and every (elementary) topos are Cartesian closed.',
	'exponential object': 'In a Cartesian closed category: an object $B^A$ with an evaluation map $\\mathrm{ev}: B^A \\times A \\to B$ such that for every object $C$ and every morphism $f: C \\times A \\to B$ there is a unique $\\mathrm{curry}(f): C \\to B^A$ with $f = \\mathrm{ev} \\circ (\\mathrm{curry}(f) \\times \\mathrm{id}_A)$. Categorical generalisation of the function space.',
	'coproduct': 'In a category: the colimit of a diagram of two objects. For objects $A, B$, the coproduct $A + B$ (or $A \\sqcup B$) comes with inclusions $A \\to A + B$ and $B \\to A + B$ such that every pair of morphisms out of $A$ and $B$ into some $C$ factors uniquely through them. In Set, coproduct is the disjoint union. Dual to the product.',
	'equalizer': 'In a category: the limit of a parallel pair of morphisms $f, g: A \\to B$. The equalizer $E$ comes with $e: E \\to A$ such that $f \\circ e = g \\circ e$, and $e$ is universal with this property. In Set it is the set $\\{a \\in A : f(a) = g(a)\\}$.',
	'coequalizer': 'In a category: the colimit of a parallel pair $f, g: A \\to B$. Categorical dual of the equalizer. In Set it is the quotient of $B$ by the smallest equivalence relation identifying $f(a)$ with $g(a)$ for every $a$.',
	'pushout': 'In a category: the colimit of a span (a diagram shaped like a corner with two arrows $X \\to Z$ and $Y \\to Z$ out of a common apex). The pushout of $f: Z \\to X$ and $g: Z \\to Y$ is the "most specific" object receiving compatible maps from $X$ and $Y$. In Set, pushout is the quotient of the disjoint union $X + Y$ by the relation identifying $f(z)$ and $g(z)$.',
	'product': {
		def: 'In a category: an object $A \\times B$ with projections to $A$ and $B$ such that every pair of morphisms into $A$ and $B$ from a common object $C$ factors uniquely through it. In Set, the product is the ordinary Cartesian product.',
		exclude: [/\bcartesian\b/i, /\bbusiness\b/i, /\bsales\b/i, /\bmarket/i, /\bconsumer\b/i, /\bfeature\b/i, /\bcustomer\b/i, /\bteam\b/i]
	},
	'power object': 'In a topos: the exponential $\\Omega^X$, which serves as the internal "power set of $X$". Subobjects of $X$ correspond bijectively to morphisms $X \\to \\Omega$, hence to elements of $\\Omega^X$. The existence of power objects for every $X$ is what makes higher-order logic work inside the topos.',
	'yoneda lemma': 'A foundational result of category theory: for any object $X$ in a locally small category $C$, the functor $C(-, X)$ that sends $Y$ to the set of morphisms $Y \\to X$ represents $X$ itself. Consequences include Cayley\'s theorem for monoids, the preservation of limits by representables, and the Yoneda embedding that turns any small category into a full subcategory of its presheaf topos.',
	'generalized element': 'A morphism $x: X \\to A$ from any object $X$ into an object $A$, thought of as an "element of $A$ relative to context $X$". A global element is the special case $X = 1$ (the terminal object). The generalized-element perspective replaces the classical "element of a set" with the categorical "morphism into an object", and is the natural setting in which topos theory does logic.',
	'slice category': 'For an object $X$ in a category $C$, the slice category $C / X$ has as objects morphisms into $X$ and as morphisms commutative triangles over $X$. Slicing is functorial, and for any topos $\\mathcal{E}$ and any object $\\Gamma$, the slice $\\mathcal{E} / \\Gamma$ is itself a topos — this is the "fundamental theorem of topos theory".',
	'sieve': 'A collection $S$ of morphisms into an object $c$ of a category, closed under precomposition: if $f: d \\to c$ is in $S$ and $g: e \\to d$ is any morphism, then $f \\circ g$ is in $S$. In a presheaf topos $[C^{\\mathrm{op}}, \\mathbf{Set}]$, the subobject classifier $\\Omega$ assigns to each object $c$ the set of sieves on $c$.',
	'w-type': 'In type theory and in a Grothendieck topos: an inductive type built by specifying a base case and a constructor that, given an element of the type, produces another. Named after the German mathematician who introduced well-orderings. Every Grothendieck topos has W-types for any polynomial functor; the natural numbers object is the simplest non-trivial example.',
	'image': {
		def: 'In a category: the smallest subobject of the codomain through which a morphism factors. In Set, the image of $f: X \\to Y$ is the set $\\{f(x) : x \\in X\\}$. In a topos, every morphism factors as epi followed by mono, and the mono part is the image.',
		exclude: [/\bprocessing\b/i, /\brecognition\b/i, /\bpixel\b/i, /\bvisual\b/i, /\bphoto/i, /\bgraphics\b/i, /\bfile\b/i, /\bformat\b/i, /\bjpg\b/i, /\bpng\b/i, /\bvector\b/i, /\btext\b/i, /\bgenerat/i]
	},
	'coimage': 'In a category: the quotient of the domain of a morphism by the kernel-pair equivalence relation. In Set, the coimage of $f: X \\to Y$ is the set of fibres $f^{-1}(f(x))$. In a topos, image and coimage always exist and are canonically isomorphic, so the epi-mono factorization is well-behaved.',
	'pretopos': 'A category that is finitely complete, finitely cocomplete, has disjoint finite coproducts stable under pullback, and whose coequalizers of equivalence relations are effective. Every elementary topos is a pretopos; the extra structure of a topos (universal colimits, power objects, etc.) is what the topos has on top of the pretopos.',
	'adhesive category': 'A category in which pushouts along monomorphisms are well-behaved: they satisfy a van Kampen-style condition that makes pushout–pullback arguments work. Every topos is adhesive, which is why "van Kampen theorems" and "gluing lemmas" work in topos theory the way they do in algebraic topology.',
	'extensive category': 'A category in which coproducts are disjoint (the fibre product of $X$ and $Y$ over $X \\sqcup Y$ is the initial object) and in which the universal property of coproducts is stable under pullback. Every topos is extensive; this is what makes disjoint sums behave the way you would expect them to.',
	'giraud\'s theorem': 'A theorem of Jean Giraud (1972) characterising Grothendieck topoi: a category is a Grothendieck topos iff it has a small set of generators, all small colimits, sums that are disjoint, and effective equivalence relations. Equivalently, every Grothendieck topos arises as the category of sheaves on a small site.',
	'classifying topos': 'For a geometric theory $T$ (a theory whose axioms are stable under the internal logic of every topos), the classifying topos $\\mathbf{Set}[T]$ has the universal property that geometric morphisms $\\mathcal{F} \\to \\mathbf{Set}[T]$ correspond to models of $T$ inside $\\mathcal{F}$. The theory is recovered from the topos; many non-equivalent theories can give the same classifying topos.',
	'grothendieck topology': 'A coverage on a category: a collection of "covering families" of morphisms, telling you which families of objects cover a given object, satisfying stability under pullback and transitivity. A category equipped with a Grothendieck topology is a site, and the category of sheaves on it is a Grothendieck topos.',
	'left adjoint': 'In an adjoint pair $F \\dashv G$: the functor $F$ that is "the most general" of the two. Left adjoints preserve colimits, are determined up to unique isomorphism by what they do to the terminal object, and turn out to be "the easy direction" of a structure-preserving correspondence.',
	'right adjoint': 'In an adjoint pair $F \\dashv G$: the functor $G$ that is "the most specific" of the two. Right adjoints preserve limits, are determined up to unique isomorphism by what they do to the initial object, and are "the universal solution to a problem" posed by $F$.',
	'effective equivalence relation': 'An equivalence relation $R \\rightrightarrows X$ in a category such that the canonical map $R \\to X \\times_{X/R} X$ is an isomorphism — i.e. the quotient $X/R$ "remembers" the relation. Effectivity of all equivalence relations is one of Giraud\'s four axioms for a Grothendieck topos.',
	'giraud\'s axioms': 'The four axioms characterising a Grothendieck topos by Jean Giraud: (1) a small set of generators, (2) all small colimits, (3) sums that are disjoint, and (4) effective equivalence relations. Any category satisfying all four is equivalent to the category of sheaves on a small site.',
	'pullback square': 'A commutative square in a category in which the top-right object is the pullback of the bottom-left along the bottom-right. Equivalently, the right vertical arrow is the pullback of the left vertical arrow along the top horizontal arrow.',
	'kernel pair': 'In a category: the pullback of a morphism $f: X \\to Y$ along itself. Categorical analogue of the equivalence relation $\\{(x_1, x_2) : f(x_1) = f(x_2)\\}$ from Set. The coimage of $f$ is the coequalizer of the two projections of the kernel pair.',
	'coequalizer of': 'In a category, the colimit of the diagram $A \\rightrightarrows B$ formed by the two morphisms. The categorical dual of the equalizer; it is the universal object receiving equal maps from the two arrows.',
	'pullback along': 'Given a morphism $f: A \\to B$ in a category with pullbacks, "pulling back along $f$" is the functor $f^*: C/B \\to C/A$ that sends each object over $B$ to its pullback along $f$. In a topos the pullback functors $f^*$ have both left and right adjoints $\\exists_f$ and $\\forall_f$, which give the internal quantifiers.',
	'left exact functor': 'A functor between categories with finite limits that preserves all finite limits: terminal objects, binary products, equalizers, and pullbacks. The pullback $f^*$ of a geometric morphism between topoi is always left exact, and this is what makes geometric morphisms preserve the topos structure.',
	'morphism factorization': 'Every morphism in a topos can be factored as an epimorphism followed by a monomorphism (an epi-mono factorization), uniquely up to unique isomorphism. This is the categorical version of "every function factors as a surjection followed by an injection"; in Set the two pieces meet at the image of the function.',
	'internal language of a topos': 'The typed higher-order intuitionistic logic obtained by interpreting a formal language inside a topos: types as objects, terms as generalized elements (morphisms from a context), propositions as morphisms $1 \\to \\Omega$. Also called the Mitchell–Bénabou language. Any theorem provable in higher-order intuitionistic logic holds internally in every topos.',
	'polymorphism': {
		def: 'In type theory: the property of a function or data type that works uniformly on values of many types. Polymorphic functions are "the same code" instantiated at many types. Category-theoretically: a natural transformation between functors.',
		exclude: [/\bbiolog/i, /\bgenetic/i, /\bmutation/i, /\bdna\b/i, /\bgene/i, /\bcell/i]
	},
	'higher-order logic': 'A formal logical system in which quantifiers may range over predicates, functions, sets, and other higher-type entities, not just over individuals. The internal language of every topos is higher-order; constructive higher-order logic is what intuitionistic type theories formalize.',
	'classification of': 'In category theory, the universal property that determines an object up to unique isomorphism by the maps into (or out of) it. The terminal object classifies morphisms into it; the initial object classifies morphisms out of it; the subobject classifier classifies subobjects; the natural numbers object classifies endomorphisms.',
	'covers the': 'In a sheaf or site, a family of morphisms $\{U_i \\to U\\}$ "covers" $U$ if the map $\\bigsqcup U_i \\to U$ is an epimorphism. In a Grothendieck topology, the designated "covering families" of a site satisfy stability under pullback and transitivity.',
	'a subobject of': 'In a category: a monomorphism $m: Y \\to X$. The "subobjects of $X$" form a pre-ordered class under inclusion; in a topos this class is representable by the subobject classifier $\\Omega$.',
	'pretopology': 'A coverage on a category specified by a class of jointly surjective families, generating a Grothendieck topology. More concrete than a general Grothendieck topology: a pretopology is enough data to define sheaves, and the resulting category of sheaves depends only on the generated Grothendieck topology.',
	'isomorphism': 'A morphism $f: X \\to Y$ in a category that has a two-sided inverse $g: Y \\to X$ with $g \\circ f = \\mathrm{id}_X$ and $f \\circ g = \\mathrm{id}_Y$. The categorical notion of "bijection": an isomorphism between $X$ and $Y$ means they are the same object up to relabelling.',
	'comma category': 'For functors $F: A \\to C$ and $G: B \\to C$, the comma category $(F \\downarrow G)$ has as objects triples $(A, B, f)$ with $f: F(A) \\to G(B)$. Morphisms are pairs of arrows in $A$ and $B$ making the obvious square commute. The slice $C/X$ is the comma category $(\\mathrm{id}_C \\downarrow X)$.',
	'reflective subcategory': 'A full subcategory $A \\hookrightarrow C$ such that the inclusion has a left adjoint (the reflector). Examples: abelian groups inside all groups, sheaves inside presheaves, compact Hausdorff spaces inside all topological spaces.',
	'reflective': 'A full subcategory $A \\hookrightarrow C$ whose inclusion has a left adjoint. The left adjoint "freely" turns a $C$-object into the closest $A$-object (e.g. sheafification freely turns a presheaf into a sheaf). Sheaves form a reflective subcategory of presheaves.',
	'sheafification': 'The left adjoint to the inclusion $\\mathbf{Sh}(X) \\hookrightarrow [\\mathrm{Open}(X)^{\\mathrm{op}}, \\mathbf{Set}]$. Sheafification takes any presheaf and returns the "closest sheaf to it", by forcing the gluing condition to hold. Always exists for any Grothendieck topology.',
	'homotopy hypothesis': 'The conjecture (due to Grothendieck) that $\\infty$-groupoids are equivalent to homotopy types: spaces up to homotopy. Conjecturally, this identifies higher category theory with algebraic topology. Still open in full generality.',
	'geometric theory': 'A logical theory whose axioms are geometric: they are built from atomic propositions using only $\\wedge, \\vee, \\exists, =, \\top, \\bot$, but not $\\Rightarrow, \\forall, \\neg$. Geometric axioms are exactly those preserved by the inverse-image functors of geometric morphisms, so geometric theories have a natural semantics in every Grothendieck topos.',
	'cohesion': 'A property of certain topoi, formalised by Lawvere: a topos is cohesive if it has an adjoint quadruple $i_! \\dashv i^* \\dashv i_* \\dashv i^!$ on itself, where $i^*$ sends an object to its underlying set of points, $i_*$ sends points to constant sheaves, $i_!$ generates connected components, and $i^!$ forgets connected components. The topos $\\mathbf{Set}$ itself is cohesive.',
	'cohesive topos': 'A topos with an adjoint quadruple $i_! \\dashv i^* \\dashv i_* \\dashv i^!$ of endofunctors capturing the relationship between an object and its underlying set of points. Cohesive topoi are the natural setting for differential geometry, smooth homotopy theory, and the synthetic study of continuous structure.',
	'classifying': 'In category theory: the universal property that determines an object by the maps into (or out of) it. The classifying space classifies principal bundles; the classifying topos classifies models of a theory; the subobject classifier classifies subobjects; the natural numbers object classifies endomorphisms.',
	'pasting': 'In category theory: the operation of gluing commutative squares along shared edges to form larger commutative diagrams. The "pasting lemma" says that if each square in a horizontal or vertical pasting is a pullback, so is the outer rectangle.',
	'pasting lemma': 'If two commutative squares are pasted along a shared edge and one of them is a pullback, the outer rectangle is a pullback iff the other square is.',
	'comma': 'For functors $F: A \\to C$ and $G: B \\to C$, the comma category $(F \\downarrow G)$ is the natural setting for "things in $A$ over things in $B$". The slice $C/X$ is the special case $(\\mathrm{id}_C \\downarrow X)$; the coslice $X / C$ is $(X \\downarrow \\mathrm{id}_C)$.',
	'coslice': 'For an object $X$ in a category $C$, the coslice $X / C$ has as objects morphisms $X \\to A$ and as morphisms commutative triangles under $X$. Dually to the slice $C / X$.',
	'evaluation': 'In a Cartesian closed category: the morphism $\\mathrm{ev}: B^A \\times A \\to B$ that evaluates an element of the exponential at an element of the domain. Universal with respect to "currying": morphisms $C \\times A \\to B$ biject with morphisms $C \\to B^A$ via $\\mathrm{curry}$.',
	'currying': 'In a Cartesian closed category: the bijection $C \\times A \\to B \\cong C \\to B^A$ that turns a two-variable function into a one-variable function returning a function. The categorical form of the programming-language technique where $f(x, y)$ becomes $f(x)(y)$.',
	'Yoneda': 'The Yoneda lemma says: for any object $X$ in a locally small category $C$ and any functor $F: C^{\\mathrm{op}} \\to \\mathbf{Set}$, the natural transformations $\\mathrm{Nat}(C(-, X), F)$ are in bijection with $F(X)$. The Yoneda embedding $C \\to [C^{\\mathrm{op}}, \\mathbf{Set}]$ sending $X$ to $C(-, X)$ is full and faithful.',
	'Yoneda embedding': 'The functor $Y: C \\to [C^{\\mathrm{op}}, \\mathbf{Set}]$ sending an object $X$ to the representable functor $C(-, X)$. The Yoneda lemma guarantees that $Y$ is full and faithful: every small category embeds into its presheaf topos as a full subcategory.',
	'restriction map': 'A map that takes data defined on a larger open set and restricts it to a smaller one. The compatibility check that makes a presheaf into a sheaf.',
	'comparison functor': 'For a functor $p: (C, J) \\to (D, K)$ between sites, the comparison functor $\\mathrm{Sh}(D) \\to \\mathrm{Sh}(C)$ sends a sheaf on $D$ to its "same data" view on $C$. Adjoints on either side give the geometric morphism $p_! \\dashv p^* \\dashv p_*$ between the corresponding sheaf topoi.',
	'hyperconnected': 'A topos is hyperconnected if every object can be covered by a single generalized element, equivalently if its global section functor $\\Gamma = \\mathrm{Hom}(1, -)$ reflects isomorphisms. Hyperconnected topoi are the categorical formalisation of "spaces that cannot be decomposed into smaller pieces".',
	'topos morphism': 'A map between topoi. There are two kinds: geometric morphisms $f = (f^* \\dashv f_*)$ and logical morphisms (functors preserving the topos structure). The geometric morphism is the right notion when one regards a topos as a generalized space.',
	'Bénabou': 'Jean Bénabou, together with William Lawvere, introduced the notion of an elementary topos and the concept of an internal language in the late 1960s and early 1970s. The internal language of a topos is called the Mitchell–Bénabou language in honour of William Mitchell and Jean Bénabou, who developed it independently.',
	'morphism': 'The primitive notion of "a way of getting from one object to another" in a category. In the category of sets, morphisms are functions. In the category of topological spaces, morphisms are continuous maps. In a sheaf category, morphisms are natural transformations that commute with restriction.',
	'axiom': 'A statement taken as a starting point of a theory, not derived from anything else. Euclidean geometry starts from five axioms; Zermelo-Fraenkel set theory from nine; Spencer-Brown\'s *Laws of Form* from two. Axioms are the "load-bearing walls" of a formal system.',
	'identity': 'In a category, for every object $A$ there is a special morphism $1_A : A \\to A$ that acts as the neutral element for composition: $f \\circ 1_A = f = 1_B \\circ f$ for any $f : A \\to B$. In HoTT, the identity type $\\mathrm{Id}_A(a, b)$ is the type of "proofs that $a$ equals $b$", i.e. paths from $a$ to $b$ in the space $A$.',
	'leiblich': '(German; lit. "bodily".) In Hermann Schmitz\'s neo-phenomenology, the qualitative bodily dimension of experience: pressure, vibration, temperature, swelling. Schmitz argues that lived space is first structured leiblich, before it is structured by Cartesian coordinates.',
	'leibliches': '(German; lit. "bodily".) Inflected form of leiblich. In Hermann Schmitz\'s neo-phenomenology, the qualitative bodily dimension of experience: pressure, vibration, temperature, swelling. Schmitz argues that lived space is first structured leiblich, before it is structured by Cartesian coordinates.',
	'presheaf': 'A map from the category of open sets of a space to a target category, with restriction maps but not necessarily the gluing condition. Every sheaf is a presheaf; not every presheaf is a sheaf.',
	'étale space': 'A space built from a presheaf by taking the disjoint union of all its stalks and topologising appropriately. Étale spaces make presheaves into actual spaces.',
	'variable': 'A named container for a value. In math: a symbol standing for an element of a set. In code: a memory location bound to a value.',
	'function': 'A rule mapping each input from a domain set to exactly one output in a codomain set. The mathematical generalisation of a subroutine.',
	'set': 'A collection of distinct elements with no order or multiplicity. The most basic object in mathematics. Notation: $\\{a, b, c\\}$.',
	'boolean': 'A type with exactly two values: True and False. The foundation of all digital logic.',
	'natural numbers': 'The counting numbers $\\mathbb{N} = \\{0, 1, 2, 3, \\dots\\}$. The simplest infinite set.',
	'real numbers': 'The continuum $\\mathbb{R}$: all numbers on the number line, including fractions and irrationals like $\\pi$.',
	'factorial': 'The product of all positive integers up to $n$: $n! = 1 \\cdot 2 \\cdot 3 \\cdots n$. Counts the number of permutations of $n$ objects.',
	'recursion': 'A function or process that calls itself with smaller inputs. The basis of divide-and-conquer algorithms and the definition of most data structures.',
	'permutation': 'An arrangement of items in order. There are $n!$ permutations of $n$ distinct items.',
	'infinity': 'A concept larger than any finite number. In computing, represented by IEEE 754 special values; in mathematics, approached via limits.',
	'NaN': 'Not a Number — the IEEE 754 result of an undefined arithmetic operation like $0/0$ or $\\infty - \\infty$.',
	'exponential': 'A function of the form $f(x) = b^x$ that grows (or decays) by a constant factor per unit step. The natural exponential $e^x$ is its own derivative.',
	'Taylor series': 'An infinite polynomial that approximates a smooth function near a point. $f(x) = \\sum f^{(n)}(a)/n! \\cdot (x-a)^n$. The engine of calculus-based ML.',
	'floating-point': 'A finite-precision real-number format used by computers, standardised as IEEE 754. Cannot represent most reals exactly; has $\\epsilon_{\\text{machine}} \\approx 10^{-7}$ for fp32.',
	'logarithm': 'The inverse of exponentiation: $\\log_b(x)$ asks "to what power must $b$ be raised to get $x$?" Multiplicative scale becomes additive.',
	'natural logarithm': 'Logarithm base $e$, written $\\ln(x)$. The logarithm that makes calculus clean, because $d/dx \\ln x = 1/x$.',
	'scalar': 'A single number. A rank-0 tensor. The opposite of a vector.',
	'vector': 'An ordered list of numbers. A rank-1 tensor. Geometrically, an arrow from the origin to a point in $\\mathbb{R}^d$.',
	'matrix': 'A 2D grid of numbers. A rank-2 tensor. Represents linear maps between vector spaces and batches of vectors.',
	'rank': {
		def: 'The number of indices a tensor has. Scalar = rank 0, vector = rank 1, matrix = rank 2, stack of matrices = rank 3, etc.',
		exclude: [/\bmilitary\b/i, /\bsocial\b/i, /\broyal\b/i, /\bofficer\b/i, /\bgeneral\b/i, /\bcolonel\b/i, /\bmajor\b/i, /\bcaptain\b/i, /\bsergeant\b/i, /\bprivate\b/i, /\bmember\b/i, /\bhighest\b/i, /\blowest\b/i, /\btop\b/i, /\bbottom\b/i, /\bequal\b/i, /\bsenior\b/i, /\bjunior\b/i, /\bposition\b/i, /\bstatus\b/i]
	},
	'shape': 'The dimensions of a tensor: e.g. a batch of 32 RGB images of $224 \\times 224$ has shape $(32, 3, 224, 224)$.',
	'Hadamard product': 'Element-wise multiplication of two tensors of the same shape, written $\\odot$. Different from matrix multiplication, which uses dot products of rows and columns.',
	'function composition': 'Applying one function to the output of another: $(g \\circ f)(x) = g(f(x))$. The algebra of pipelines.',
	'gating mechanism': 'A learnable element-wise multiplier (usually a sigmoid output) that decides what information passes through — the core of LSTMs, GRUs, and Mixture-of-Experts routing.',
	'approximation': 'A result close enough to the truth to be useful. Most AI is approximation; the alternative is exact symbolic computation.',
	'IEEE 754': 'The international standard for floating-point arithmetic in computers. Defines fp32, fp64, $\\pm\\infty$, and NaN.',
	'machine precision': 'The smallest number $\\epsilon$ such that $1 + \\epsilon \\neq 1$ in floating-point. About $10^{-7}$ for fp32.',
	'maximum likelihood estimation': 'MLE. A method for fitting a model by choosing parameters that maximise the probability of the observed data. The statistical backbone of most supervised learning.',
	'Universal Approximation Theorem': 'A feed-forward network with one sufficiently wide hidden layer can approximate any continuous function on a compact domain to arbitrary precision. Existence, not learnability.',
	'curse of dimensionality': 'The phenomenon that high-dimensional geometry breaks down: distances concentrate, volumes explode into corners, and sample complexity grows exponentially.',
	'blessing of dimensionality': 'The counter-phenomenon: random high-dimensional vectors are nearly orthogonal, giving exponentially many "free" directions for features.',
	'concentration of measure': 'For Lipschitz $f$, $P(|f(x) - \\mathbb{E}[f]| > t)$ shrinks exponentially in dimension. The reason random high-dimensional vectors behave deterministically.',
	'Lipschitz constant': 'The smallest $L$ such that $|f(x) - f(y)| \\le L \\|x - y\\|$ for all $x, y$. Bounds how fast a function can change — critical for generalization bounds.',
	'manifold hypothesis': 'Real-world data (faces, speech, text) does not fill high-dimensional space but lives on a low-dimensional manifold embedded in it. Neural networks are essentially manifold learners.',
	'forward stability': 'A numerical-analysis property: small perturbations in input cause bounded perturbations in output. What keeps floating-point error from compounding out of control.',
	'generalization bounds': 'Theoretical limits on the gap between training and test loss. With $n$ samples and $V$ parameters, the gap scales as $O(\\sqrt{V/n})$.',
	'type theory': 'A foundation for mathematics where the basic objects are types (sets with structure) and the basic maps are functions between them. The language of Lean, Coq, and Agda.',
	'type': 'A collection of things, optionally with a rule for how to construct its inhabitants. The basic object of type theory; corresponds to a set with structure.',
	'term': 'A specific inhabitant of a type. If $A$ is a type, $a : A$ means "$a$ is a term of type $A$".',
	'product type': 'The type of pairs: $A \\times B$ has exactly $|A| \\cdot |B|$ inhabitants. Written $(a, b)$ with $a : A$ and $b : B$.',
	'sum type': 'The disjoint union $A + B$: tagged values that are *either* an $A$ *or* a $B$. Cardinality $|A| + |B|$. Models "one of several cases".',
	'dependent type': 'A type $B(x)$ that depends on a value $x : A$. Captures invariants like "vector of length $n$" — the length is part of the type, not just a comment.',
	'projection': 'A map $\\pi_1 : A \\times B \\to A$ or $\\pi_2 : A \\times B \\to B$ that extracts one component of a pair.',
	'boolean values': 'The two-element set $\\mathbb{B} = \\{\\text{True}, \\text{False}\\}$, used for all of digital logic and for classifier outputs after thresholding.',
	'e': 'Euler\'s number, $\\approx 2.71828$. The unique base for which $e^x$ is its own derivative. The natural unit of continuous growth.',
	'gradient descent': 'An optimization algorithm that iteratively moves parameters in the direction of steepest descent of the loss function.',
	'loss function': 'A function that measures how far the model\'s predictions are from the true target values.',
	'activation function': 'A non-linear transformation applied to a neuron\'s output, enabling the network to learn complex patterns.',
	'ReLU': 'Rectified Linear Unit — an activation function that outputs the input directly if positive, and zero otherwise.',
	'epoch': 'One complete pass through the entire training dataset during model training.',
	'batch': 'A subset of the training data processed together in one forward/backward pass.',
	'learning rate': 'A hyperparameter that controls how much to adjust the model weights in response to the estimated error each update.',
	'overfitting': 'When a model learns the training data too well, including noise, and performs poorly on unseen data.',
	'underfitting': 'When a model is too simple to capture the underlying pattern in the data.',
	'token': 'A unit of text — typically a word, subword, or character — that the model processes as a single input element.',
	'tokenizer': 'An algorithm that splits text into tokens, mapping between raw text and the model\'s vocabulary indices.',
	'context window': 'The maximum number of tokens a model can process in a single forward pass, acting as its "working memory."',
	'fine-tuning': 'The process of taking a pre-trained model and training it further on a specific, usually smaller, dataset.',
	'parameter': 'A weight or bias in a neural network that is learned during training.',
	'hyperparameter': 'A configuration parameter set before training (e.g., learning rate, batch size) that controls the learning process.',
	'MLP': 'Multi-Layer Perceptron — a feedforward neural network with one or more hidden layers of neurons.',
	'CNN': 'Convolutional Neural Network — a network architecture designed for processing grid-like data such as images.',
	'RNN': 'Recurrent Neural Network — a network architecture designed for sequential data with hidden state that persists across time steps.',
	'LSTM': 'Long Short-Term Memory — a type of RNN with gating mechanisms that can learn long-range dependencies.',
	'perceptron': 'The simplest form of a neural network: a single neuron that makes a binary decision based on weighted inputs.',
	'logistic regression': 'A statistical model that uses a logistic (sigmoid) function to model binary outcomes.',
	'convolution': 'A mathematical operation that slides a filter over input data, detecting local patterns like edges or textures.',
	'pooling': 'A down-sampling operation that reduces the spatial dimensions of a feature map, keeping the most important information.',
	'dropout': 'A regularization technique that randomly drops neurons during training to prevent overfitting.',
	'batch normalization': 'A technique that normalizes layer inputs across the batch dimension, stabilizing and accelerating training.',
	'weight decay': 'A regularization technique that penalizes large weights by adding their magnitude to the loss.',
	'stochastic': 'Involving random probability — stochastic gradient descent uses random subsets of data (batches) rather than the full dataset.',
	'latent space': 'The low-dimensional space of compressed representations learned by a model, where similar concepts cluster together.',
	'logit lens': 'A technique that applies the unembedding matrix to intermediate residual stream states to interpret what the model is "thinking."',
	'sparse autoencoder': 'A neural network that learns a sparse, overcomplete representation of its input, used for mechanistic interpretability.',
	'KL divergence': 'Kullback-Leibler divergence — a measure of how one probability distribution differs from another.',
	'entropy': 'A measure of uncertainty or randomness in a probability distribution — higher entropy means more unpredictability.',
	'cross-entropy': 'A loss function that measures the difference between two probability distributions, commonly used for classification.',
	'cosine similarity': 'A measure of similarity between two vectors calculated as the cosine of the angle between them.',
	'dot product': 'A mathematical operation that multiplies corresponding elements of two vectors and sums the results.',
	'gradient': {
		def: 'A vector of partial derivatives pointing in the direction of steepest increase of a function.',
		exclude: [/color/i, /colour/i, /\bbackground\b/i, /\bsky\b/i, /\bwall\b/i, /\bhair\b/i, /\bsunset/i, /\bdawn/i, /\btint\b/i, /\bhue\b/i, /\bombre/i, /\bfade/i]
	},
	'training': 'The process of adjusting a model\'s parameters by repeatedly feeding it data and minimizing its loss — the "learning" phase.',
	'inference': 'Running a trained model on new input to produce an output — the usage phase, as opposed to training.',
	'pretrained': 'Already trained on a large general dataset before being adapted to a specific task or fine-tuned.',
	'weights': 'The learned parameters of a network that are adjusted during training and determine how inputs are transformed into outputs.',
	'bias': 'A learnable offset added to a neuron\'s weighted sum before its activation, letting the network shift its decision boundary.',
	'gradients': 'The vectors of partial derivatives computed by backpropagation; they point toward where the loss increases and drive weight updates.',
	'logits': 'The raw, unnormalized scores a model outputs before softmax converts them into probabilities.',
	'tokens': 'The text units (words, subwords, or characters) a model reads and generates one at a time.',
	'loss': {
		def: 'A scalar measuring how far the model\'s predictions are from the truth; training minimizes it.',
		exclude: [/\bweight loss\b/i, /\bfinancial/i, /\bmonetary/i, /\bprofit/i, /\bdefeat\b/i, /\bgame\b/i, /\bmatch\b/i, /\bbattle\b/i, /\bwar\b/i, /\b casualties\b/i, /\bmissing\b/i, /\bgrieving\b/i, /\bgrief\b/i, /\bmourning/i, /\bsense of\b/i, /\bat a loss\b/i]
	},
	'loss landscape': 'The high-dimensional surface mapping every possible set of weights to its loss, which optimizers navigate.',
	'convex': 'A function with a single valley where gradient descent reliably finds the minimum — real neural networks are almost never convex.',
	'local minimum': 'A point in the loss landscape that is lower than its neighbors but not the global lowest point, where training can get stuck.',
	'global minimum': 'The lowest point on the loss landscape — the best loss the model\'s capacity allows.',
	'saddle point': 'A spot in the loss landscape that is a minimum in some directions and a maximum in others, where gradients vanish.',
	'convergence': 'The stage of training when loss stops improving meaningfully and the model has settled into a good solution.',
	'dataset': 'The collection of examples a model is trained, validated, or evaluated on.',
	'validation set': 'A data slice held out from training, used to check generalization and tune hyperparameters without touching the test set.',
	'test set': 'A final, untouched data slice used once to measure the finished model\'s real-world performance.',
	'supervised learning': 'Learning from labeled examples — input-output pairs — where the model is trained to predict the known target.',
	'unsupervised learning': 'Finding structure in unlabeled data, such as clustering or compression, without explicit targets.',
	'self-supervised learning': 'Automatically creating labels from the data itself — e.g. predicting the next token — the core pre-training method for LLMs.',
	'transfer learning': 'Reusing knowledge from a model trained on one task (like web text) to perform a new, related task more easily.',
	'regularization': 'Any technique that constrains the model to prevent overfitting, such as dropout, weight decay, or early stopping.',
	'early stopping': 'Halting training when validation performance stops improving, preventing overfitting and saving compute.',
	'checkpoint': 'A saved snapshot of the model\'s weights, letting training resume, be inspected, or be shipped.',
	'warmup': 'Starting training with a small learning rate that ramps up gradually, stabilizing the noisy early updates.',
	'teacher forcing': 'Feeding the ground-truth previous token as input while training an autoregressive decoder, instead of its own predictions.',
	'optimizer': 'The algorithm that turns gradients into weight updates, e.g. SGD or Adam, with the learning rate controlling step size.',
	'Adam': 'An adaptive optimizer that gives every parameter its own learning rate based on the history of its gradients.',
	'SGD': 'Stochastic Gradient Descent — gradient descent performed on small random batches of data rather than the full dataset.',
	'momentum': 'An optimizer trick that accumulates a running average of past gradients, smoothing updates and powering through small bumps.',
	'vanishing gradient': 'Gradients becoming exponentially small as they travel back through many layers, so early weights barely learn.',
	'exploding gradient': 'Gradients growing exponentially during backpropagation, causing wild, unstable weight updates.',
	'gradient clipping': 'Capping gradients at a fixed magnitude before updating weights, preventing exploding-gradient blow-ups.',
	'autograd': 'Automatic differentiation — recording a computation graph and computing all gradients through it automatically, powering backpropagation in PyTorch.',
	'chain rule': 'The calculus rule for the derivative of a composed function — backpropagation is just the chain rule applied across the network.',
	'jacobian': 'The matrix of all partial derivatives of a vector-valued function, generalizing the gradient to multiple outputs.',
	'MSE': 'Mean Squared Error — a loss that averages the squared differences between predictions and targets, punishing large errors heavily.',
	'accuracy': 'The fraction of predictions a model gets right — simple, but misleading when classes are imbalanced.',
	'precision': {
		def: 'Of everything predicted as positive, the fraction that actually is; low precision means many false alarms.',
		exclude: [/astronomy/i, /astronomical/i, /stars?\b/i, /celestial/i, /mapping/i, /telescope/i, /imperfect/i, /\bmeasure(ments?)?\b/i, /remarkable/i, /extraordinary/i, /impressive/i, /stunning/i, /unprecedented/i, /modest/i, /limited/i, /rough/i, /meticulous/i, /exquisite/i]
	},
	'recall': 'Of all actually-positive cases, the fraction the model finds; low recall means many misses.',
	'F1 score': 'The harmonic mean of precision and recall, giving one balanced score for a classifier.',
	'benchmark': 'A standardized set of tasks and metrics used to compare models against each other.',
	'baseline': 'A simple reference approach that a new system must clearly outperform to be convincing.',
	'perplexity': 'A measure of how surprised a language model is by text — lower perplexity means more confident, better predictions.',
	'cross-validation': 'Repeatedly splitting data into train and validation folds and averaging results for a more robust performance estimate.',
	'classification': 'The task of assigning an input to one of a set of discrete categories.',
	'regression': 'The task of predicting a continuous numerical value from inputs.',
	'probability': 'A number between 0 and 1 measuring how likely an event is; models output probability distributions over choices.',
	'probability distribution': 'A function assigning a probability to every possible outcome of a random variable.',
	'random variable': 'A variable whose value is determined by the outcome of a random process.',
	'randomness': 'Unpredictability in data or model behavior — sampling, random initialization, and dropout all introduce it.',
	'deterministic': 'Producing exactly the same output for the same input every time — the opposite of stochastic sampling.',
	'expectation': 'The average value of a random variable, weighted by how likely each outcome is.',
	'variance': 'The average squared distance from the mean; in ML, also the component of error from sensitivity to training data.',
	'standard deviation': 'The square root of the variance — the typical amount by which values deviate from the mean.',
	'covariance': 'A measure of how two variables change together; positive covariance means they tend to move in the same direction.',
	'correlation': 'A normalized measure of association between two variables, ranging from -1 to +1.',
	'arithmetic mean': 'The arithmetic average of a set of numbers: sum divided by count.',
	'Gaussian': 'The bell-shaped "normal" distribution, ubiquitous in statistics and ML noise models.',
	'normal distribution': 'The bell-shaped probability distribution fully described by its mean and standard deviation.',
	'uniform distribution': 'A distribution in which every value within a range is equally likely.',
	'Monte Carlo': 'Estimating a hard-to-compute quantity by repeated random sampling instead of exact calculation.',
	'likelihood': 'The probability of the observed data given the model\'s parameters — training maximizes this.',
	'maximum likelihood': 'Choosing the parameters that make the observed data as probable as possible.',
	'prior': 'The probability assigned to a hypothesis before any data is seen.',
	'posterior': 'The updated probability of a hypothesis after observing data, via Bayes\' theorem.',
	'Bayes': 'Bayes\' theorem — a formula for updating a prior with observed evidence to compute a posterior.',
	'Markov': 'Describing systems where the next state depends only on the present state, not on the full history.',
	'conditional probability': 'The probability of one event occurring given that another event has occurred.',
	'outlier': 'A data point lying far outside the typical range, which can skew statistics and destabilize training.',
	'robust': 'Resistant to outliers, noise, or attacks — a desirable property for statistics and models alike.',
	'attention head': 'One of the parallel attention computations in a transformer, each specializing in different relationships between tokens.',
	'multi-head attention': 'Running several attention heads in parallel so the model can attend to different kinds of relationships at once.',
	'QKV': 'Query-Key-Value — the three projections in attention: queries search, keys are indexed against, and values carry the content.',
	'FFN': 'Feed-Forward Network — the per-token MLP block in a transformer that transforms each token\'s representation after attention.',
	'feed-forward': 'A block that processes each token independently through linear maps and a non-linearity, with no mixing between tokens.',
	'hidden state': 'The internal vector representation of a token inside a layer, encoding its accumulated meaning as it flows through the model.',
	'hidden dimension': 'The width of a model\'s hidden-state vectors; together with depth it determines capacity and parameter count.',
	'residual connection': 'A skip that adds a layer\'s input to its output, letting gradients flow through deep networks without vanishing.',
	'positional encoding': 'A signal added to token embeddings that tells the transformer where each token sits, since attention has no built-in notion of order.',
	'embedding matrix': 'The lookup table mapping each vocabulary token to its dense vector representation.',
	'unembedding': 'The final matrix mapping the last hidden state to one score per vocabulary token — the logits.',
	'encoder': 'The transformer block that reads a full input sequence into rich representations; the "understander" half.',
	'decoder': 'The transformer block that generates output tokens one at a time, attending to everything before; GPT-style models are decoder-only.',
	'encoder-decoder': 'An architecture pairing an input encoder with an autoregressive output decoder, e.g. T5 or BART.',
	'autoregressive': 'Generating one token at a time, each conditioned on all previously generated tokens — how GPT models write.',
	'causal mask': 'An attention mask forbidding tokens from attending to the future, enforcing left-to-right generation during training.',
	'attention mask': 'A filter telling attention which positions may interact — used for padding, causality, and batched sequences.',
	'recurrent': 'Processing sequences step by step while carrying a hidden state, as RNNs do, in contrast to the transformer\'s parallelism.',
	'bidirectional': 'Able to use both left and right context, as BERT does, unlike the strictly left-to-right causal masking of GPT.',
	'MoE': 'Mixture of Experts — an architecture with many specialist subnetworks and a router that activates only a few per token.',
	'expert': 'A specialist subnetwork inside a Mixture-of-Experts layer; only a small subset runs per token.',
	'router': 'The learned gating mechanism in MoE that decides which experts handle each token.',
	'GELU': 'Gaussian Error Linear Unit — a smooth activation used by many modern transformers, approximating ReLU with a Gaussian weighting.',
	'SiLU': 'Sigmoid Linear Unit, or Swish — the activation x·sigmoid(x) used by models like Llama.',
	'sigmoid': 'An S-shaped activation squeezing any real number into (0, 1), often used for probabilities and gates.',
	'tanh': 'An S-shaped activation mapping values to (-1, 1), historically common in RNNs and gates.',
	'neuron': 'The basic unit of a neural network: a weighted sum of inputs plus a bias, passed through a non-linearity.',
	'architecture': 'The structural blueprint of a network — its layers, connections, and scale.',
	'feature': 'An individual measurable or learned property of the input that the model uses to make decisions.',
	'dimension': {
		def: 'One coordinate of a vector space; embeddings live in high-dimensional spaces where nearby points are semantically similar.',
		exclude: [/other dimensions/i, /\bthree dimensions\b/i, /\bfour dimensions/i, /\bfifth dimension/i, /\bspatial/i, /\bphysical/i, /\broom\b/i, /\bbox\b/i, /\bpage\b/i, /\bwidth\b/i, /\bheight\b/i, /\bdepth\b/i, /\blength\b/i, /\bsize\b/i, /\bmeasured?\b/i, /\bcubic/i, /\bsquare/i]
	},
	'context length': 'The maximum number of tokens a model can consider at once — its attention working memory.',
	'sequence length': 'The number of tokens in a given input sequence, a key driver of compute and memory use.',
	'KV cache': 'Cached attention keys and values for all tokens so far, reused on each new generation step instead of recomputing the whole past.',
	'working memory': 'The tokens currently in context that a model can directly attend to while generating a response.',
	'memory bandwidth': 'The rate memory can feed data to the compute units — the main bottleneck for autoregressive token generation.',
	'FLOPs': 'Floating-Point Operations — a unit of compute used to measure training cost and model size.',
	'scaling laws': 'Empirical rules showing loss falls predictably as parameters, data, and compute grow, guiding how big to build models.',
	'emergent': 'Describing abilities that appear suddenly once a model crosses a size threshold, rather than improving smoothly.',
	'Chinchilla': 'The DeepMind result that parameters and training data should be scaled roughly equally for compute-optimal training.',
	'GPU': 'Graphics Processing Unit — massively parallel hardware that makes deep-learning training and inference practical.',
	'VRAM': 'The GPU\'s dedicated memory, a hard constraint on model size and context length.',
	'CUDA': 'NVIDIA\'s platform for running parallel computation on GPUs — the standard acceleration path for ML frameworks.',
	'throughput': 'How much work a system completes per second, e.g. tokens or requests — optimized at the cost of latency.',
	'latency': 'How quickly a model responds — measured as time to the first token and per-token generation time.',
	'batching': 'Processing many requests or examples together in one pass, raising throughput at some cost to individual latency.',
	'quantization': 'Compressing weights to lower numerical precision (e.g. fp16 to int8) to cut memory use and speed up inference.',
	'pruning': 'Removing unimportant weights, neurons, or connections to make a model smaller and faster.',
	'distillation': 'Training a smaller student model to imitate a large teacher model, capturing most of its capability cheaply.',
	'GGUF': 'A file format for storing quantized models so they run easily on consumer hardware via llama.cpp and similar runtimes.',
	'speculative decoding': 'Having a small draft model propose several tokens that a big model verifies in parallel — faster with identical output.',
	'continuous batching': 'Adding new requests to an in-flight batch as others finish, keeping the GPU busy instead of waiting for whole batches.',
	'paged attention': 'Storing the KV cache in flexible non-contiguous pages, like an OS manages memory, eliminating waste from fragmentation.',
	'sparse attention': 'Computing attention only between selected token pairs rather than all of them, cutting cost for long contexts.',
	'flash attention': 'A fused attention algorithm that never materializes the full attention matrix, saving huge amounts of memory and time.',
	'kernel': 'The small weight matrix slid over an image in a convolution to detect local patterns like edges.',
	'clustering': 'Grouping data points so that points within a group are more similar to each other than to points in other groups.',
	'k-means': 'A clustering algorithm that iteratively assigns points to the nearest of k centroids and updates the centroids.',
	'manifold': 'A continuous lower-dimensional surface embedded in a higher-dimensional space; learned representations are often assumed to lie on one.',
	'eigenvalue': 'A scalar λ such that a matrix maps some vector (an eigenvector) to λ times itself; eigenvalues reveal a matrix\'s stretching behavior.',
	'adversarial': 'Describing inputs or attacks deliberately crafted to fool a model into making wrong predictions.',
	'robustness': 'A model\'s ability to keep performing correctly under noise, perturbation, or attack.',
	'temperature': 'A hyperparameter controlling randomness in sampling — high values flatten probabilities and make outputs more diverse; low values sharpen them.',
	'sampling': 'Choosing tokens from the model\'s probability distribution rather than always taking the most likely one, adding variety to generation.',
	'beam search': 'A decoding method that keeps the most promising partial sequences at each step and expands them, trading compute for better overall probability.',
	'greedy decoding': 'Always picking the single most likely next token; fast and deterministic, but can produce repetitive or locally suboptimal text.',
	'top-p': 'Nucleus sampling — restrict sampling to the smallest set of tokens whose cumulative probability exceeds a threshold p, trimming the long tail.',
	'top-k': 'Sampling restricted to the k most likely tokens at each step; together with top-p it trims unlikely candidates.',
	'prompt': 'The input text given to a language model to guide what it should generate.',
	'system prompt': 'A high-level instruction that sets a model\'s behavior for the whole conversation, typically hidden from the user.',
	'few-shot': 'Providing a handful of examples in the prompt to show the model the desired input-output pattern before asking a question.',
	'zero-shot': 'Asking a model to perform a task without any examples, relying purely on what it learned during training.',
	'in-context learning': 'The ability of LLMs to adapt to a task from examples supplied directly in the prompt, without changing any weights.',
	'chain-of-thought': 'Prompting the model to reason step by step before answering, which dramatically improves performance on complex problems.',
	'prompt engineering': 'The craft of designing and refining prompts to reliably get the desired output from a language model.',
	'hallucination': 'When a model confidently generates plausible-sounding but factually wrong or invented content.',
	'jailbreak': 'A crafted prompt designed to bypass a model\'s safety rules and make it produce content it was trained to refuse.',
	'prompt injection': 'An attack where hidden instructions in user- or document-supplied text trick a model into overriding its original instructions.',
	'alignment': 'Training a model to behave in accordance with human intentions and values rather than just to maximize its training objective.',
	'reward model': 'A model trained on human preference comparisons to score outputs, providing the reward signal used in RLHF.',
	'reward': 'A scalar signal that tells an agent how good its action was, driving reinforcement learning.',
	'RLHF': 'Reinforcement Learning from Human Feedback — fine-tuning a model with a reward model trained on human preferences to make outputs more helpful and aligned.',
	'agent': 'An AI system that perceives its environment and takes actions to pursue goals.',
	'environment': 'The world an agent interacts with and receives observations and rewards from.',
	'exploration': 'Trying random or novel actions to discover better strategies, as opposed to exploiting known good ones.',
	'exploitation': 'Using the actions already known to give high reward, rather than exploring new options.',
	'reinforcement learning': 'Training an agent through trial and error by rewarding desired behavior; used in post-training and game-playing AI.',
	'RAG': 'Retrieval-Augmented Generation — feeding a model retrieved documents alongside the question so it can answer using external knowledge.',
	'vector database': 'A store optimized for fast similarity search over embeddings — at the heart of RAG systems.',
	'nearest neighbor': 'Finding the data points most similar to a query vector, the core search operation in vector retrieval.',
	'HNSW': 'Hierarchical Navigable Small World — a graph-based index that gives fast approximate nearest-neighbor search.',
	'reranking': 'Re-scoring a larger set of retrieved candidates with a more expensive, more accurate model to keep only the best few.',
	'chunking': 'Splitting documents into smaller pieces so each fits within the model\'s context window and embeds meaningfully.',
	'vocabulary': 'The fixed set of tokens a model can output, mapped to indices by the tokenizer.',
	'BPE': 'Byte Pair Encoding — a subword tokenization algorithm that iteratively merges the most frequent pairs of symbols.',
	'subword': 'The intermediate units between characters and words used by modern tokenizers to balance vocabulary size and coverage.',
	'WordPiece': 'A subword tokenization algorithm, used by BERT, that greedily merges the most probable token pairs.',
	'SentencePiece': 'A subword tokenizer that works directly on raw text, supporting BPE and unigram models without pre-tokenization.',
	'unigram': 'A language model based on single tokens with no context; also a subword vocabulary model used by SentencePiece.',

	// Diffusion Models
	'diffusion model': 'A generative model that learns to reverse a step-by-step noising process — start from random noise and iteratively denoise until a clean image emerges.',
	'forward process': 'The fixed, hand-designed Markov chain that gradually adds Gaussian noise to a clean image over T steps, ending at pure noise.',
	'reverse process': 'The learned denoising chain — a neural network iteratively removes noise from a sample, walking from pure noise back to a clean image.',
	'noise schedule': 'The sequence of per-step noise levels (β₁, β₂, …, β_T) that determines how much noise is added at each forward step, typically increasing from ~10⁻⁴ to ~0.02.',
	'score function': 'The gradient of the log probability density of the data distribution, ∇ₓ log p(x). A trained denoiser implicitly estimates this.',
	'score matching': 'A training objective that learns the score function by training a denoiser to predict the noise in corrupted samples.',
	'classifier-free guidance': 'A conditioning trick where the model is trained both with and without the prompt, and at inference the difference between the two is amplified by a guidance scale w.',
	'CFG': 'See "classifier-free guidance".',
	'guidance scale': 'The scalar w in classifier-free guidance — higher values follow the prompt more literally at the cost of diversity.',
	'cross-attention': 'An attention mechanism where queries come from one source (e.g. image patches) and keys/values from another (e.g. text tokens). Used by diffusion U-Nets to read the prompt.',
	'U-Net': 'An encoder-decoder neural network with skip connections at every resolution. The workhorse backbone of diffusion image models.',
	'latent diffusion': 'Running the diffusion process on a compressed latent representation of the image rather than on pixels — the trick behind Stable Diffusion that makes training tractable.',
	'VAE': 'Variational Autoencoder — a model that compresses images into a smaller latent space and decodes them back. In Stable Diffusion the VAE is pretrained and frozen.',
	'CLIP': 'Contrastive Language-Image Pre-training — a model that embeds images and text into a shared vector space, trained on image-caption pairs. Stable Diffusion 1.5 uses CLIP\'s text tower to encode prompts.',
	'text encoder': 'The neural network (CLIP or T5) that turns a text prompt into a sequence of vectors the diffusion U-Net can condition on.',
	'time embedding': 'A vector representation of the diffusion timestep t, typically via sinusoidal positional encoding followed by a small MLP, injected into every U-Net block.',
	'sinusoidal embedding': 'A positional encoding using sin/cos at geometrically-spaced frequencies; used for both transformer positions and diffusion timesteps.',
	'skip connection': 'A direct addition of an earlier layer\'s output to a later layer\'s input (as in ResNet and U-Net) — preserves gradients and fine detail across many layers.',
	'residual block': 'A conv block that adds its input back to its output — the basic building unit of the U-Net.',
	'GroupNorm': 'Group Normalization — normalizes activations per group of channels, works well at small batch sizes where BatchNorm fails.',
	'SiLU': 'Sigmoid Linear Unit, also called Swish — the activation x·σ(x) used in the diffusion U-Net, a smooth cousin of ReLU.',
	'DDPM': 'Denoising Diffusion Probabilistic Model — the 2020 paper (Ho et al.) that brought diffusion to mainstream generative modeling by training a U-Net to predict noise with simple MSE loss.',
	'DDIM': 'Denoising Diffusion Implicit Model — a faster sampler that can produce good images in 20-50 steps instead of 1000, without retraining.',
	'LoRA': 'Low-Rank Adaptation — a fine-tuning technique that trains only tiny rank-decomposed adapter matrices on top of frozen weights, enabling style/concept customization in minutes on consumer GPUs.',
	'ControlNet': 'A side network that adds spatial conditioning (edge maps, depth maps, pose skeletons) to a frozen diffusion U-Net via zero-convolutions.',
	'adversarial diffusion distillation': 'A training technique that compresses many denoising steps into one by combining a distillation loss with a GAN-style adversarial loss. Used to train SDXL-Turbo.',
	'Stable Diffusion': 'The open-source latent-diffusion model from Stability AI (2022) that popularized text-to-image generation on consumer GPUs.',
	'model collapse': 'The degenerative failure mode that occurs when generative models are trained on data produced by earlier generative models — distribution tails erode and outputs become repetitive.',
	'inpainting': 'Filling in a masked region of an image with diffusion — the model conditions on the unmasked pixels and generates only the missing area.',
	'img2img': 'Adding noise to an existing image and partially denoising it to get a modified version that preserves overall composition.',
	'im2img': 'See "img2img".',
	'image-to-image': 'See "img2img".',
	'noising': 'The forward diffusion process — adding Gaussian noise to data step by step until only noise remains.',
	'denoising': 'The reverse diffusion process — removing noise step by step to recover or generate data.',

	// Core ML Concepts
	'neural network': 'A computational model inspired by biological neurons, composed of layers of interconnected nodes that transform inputs through weighted connections and nonlinear activations.',
	'deep learning': 'Machine learning using neural networks with many layers, enabling hierarchical feature extraction from raw data.',
	'pre-training': 'The initial training phase where a model learns general representations from large unlabeled datasets before being adapted to specific tasks.',
	'fine-tuning': 'The process of taking a pre-trained model and training it further on a specific, usually smaller, dataset.',
	'distillation': 'Training a smaller student model to imitate a large teacher model, capturing most of its capability cheaply.',
	'backbone': 'The core feature-extracting subnetwork of a larger architecture — everything before the task-specific head.',
	'head': 'The task-specific output layer attached to a shared backbone — classification head, detection head, etc.',
	'latent': 'Existing in a hidden or compressed representation space not directly observable in the raw input.',
	'manifold': 'A continuous lower-dimensional surface embedded in a higher-dimensional space; learned representations are often assumed to lie on one.',
	'loss landscape': 'The high-dimensional surface mapping every possible set of weights to its loss, which optimizers navigate.',
	'embedding': 'A dense vector representation of a discrete entity (word, token, concept) in a continuous high-dimensional space.',
	'attention mechanism': 'A mechanism that lets each token in a sequence weigh the importance of every other token when computing its own representation.',
	'positional encoding': 'A signal added to token embeddings that tells the transformer where each token sits, since attention has no built-in notion of order.',

	// Architectures & Models
	'GAN': 'Generative Adversarial Network — a framework where a generator and discriminator are trained adversarially to produce realistic synthetic data.',
	'autoencoder': 'A neural network trained to compress its input into a latent code and then reconstruct it, learning efficient representations.',
	'encoder-decoder': 'An architecture pairing an input encoder with an autoregressive output decoder, e.g. T5 or BART.',
	'BERT': 'Bidirectional Encoder Representations from Transformers — a pre-trained encoder model that reads text bidirectionally, optimised for understanding tasks.',
	'GPT': 'Generative Pre-trained Transformer — a family of autoregressive decoder-only language models that generate text one token at a time.',
	'ResNet': 'Residual Network — a deep convolutional architecture that introduced skip connections to enable training of networks with hundreds of layers.',
	'U-Net': 'An encoder-decoder neural network with skip connections at every resolution. The workhorse backbone of diffusion image models.',
	'MoE': 'Mixture of Experts — an architecture with many specialist subnetworks and a router that activates only a few per token.',

	// Training Concepts
	'batch size': 'The number of training examples processed in one forward/backward pass before the model\'s weights are updated.',
	'learning rate schedule': 'A strategy for adjusting the learning rate during training — step decay, cosine annealing, warmup, etc.',
	'warm restart': 'Resetting the learning rate to a higher value during training, helping the optimizer escape local minima.',
	'early stopping': 'Halting training when validation performance stops improving, preventing overfitting and saving compute.',
	'label smoothing': 'Replacing hard one-hot labels with soft distributions (e.g. 0.9 for the correct class) to prevent the model from becoming overconfident.',
	'mixed precision': 'Training with reduced numerical precision (fp16 or bf16) where possible, cutting memory use and speeding up computation on modern GPUs.',
	'distributed training': 'Splitting training across multiple GPUs or machines, synchronizing gradients to scale up effective batch size and reduce wall-clock time.',
	'data augmentation': 'Artificially expanding a training dataset by applying realistic transformations (rotation, cropping, noise) to existing examples.',
	'transfer learning': 'Reusing knowledge from a model trained on one task to perform a new, related task more easily.',

	// Evaluation & Metrics
	'confusion matrix': 'A table comparing predicted vs. actual classes, showing true positives, true negatives, false positives, and false negatives.',
	'AUC': 'Area Under the ROC Curve — a single number summarising a classifier\'s performance across all threshold settings.',
	'F1 score': 'The harmonic mean of precision and recall, giving one balanced score for a classifier.',

	// Mathematical Foundations
	'Bayesian': 'Relating to Thomas Bayes\' theorem — updating beliefs about a hypothesis given observed evidence, using prior probabilities and likelihoods.',
	'Markov': 'Describing systems where the next state depends only on the present state, not on the full history.',
	'convex': 'A function with a single valley where gradient descent reliably finds the minimum — real neural networks are almost never convex.',
	'non-convex': 'A function with multiple local minima and saddle points — the typical loss landscape of deep neural networks.',

	// Interpretability
	'mechanistic interpretability': 'Reverse-engineering the internal computations of a neural network to understand exactly how it produces its outputs.',
	'activation pattern': 'The specific set of neuron values produced by a given input, revealing what features the network has detected.',
	'feature visualization': 'Techniques for creating inputs that maximally activate a particular neuron or channel, revealing what it has learned to detect.',
	'probing': 'Training a simple classifier on intermediate representations to test what information is linearly encoded at each layer.',
	'spare': { def: 'In mechanistic interpretability, a feature is sparse if only a small fraction of neurons activate for any given input — enabling cleaner decomposition.', exclude: [/free time/i, /\bnot busy\b/i, /\blittle\b.*\btime\b/i] },
	'superposition': 'The hypothesis that neural networks represent more features than they have dimensions by encoding them as overlapping, nearly-orthogonal directions.',

	// Generative Models
	'VAE': 'Variational Autoencoder — a generative model that learns a latent space by combining an encoder-decoder architecture with a probabilistic objective.',
	'GAN': 'Generative Adversarial Network — two networks trained in opposition: a generator creating fake data and a discriminator trying to distinguish real from fake.',
	'flow-based model': 'A generative model that learns an invertible mapping between data and a simple prior distribution, enabling exact likelihood computation.',
	'autoregressive model': 'A generative model that decomposes a joint probability into a product of conditionals, generating one variable at a time.',

	// Practical / Deployment
	'quantization': 'Compressing weights to lower numerical precision (e.g. fp16 to int8) to cut memory use and speed up inference.',
	'pruning': 'Removing unimportant weights, neurons, or connections to make a model smaller and faster.',
	'inference': 'Running a trained model on new input to produce an output — the usage phase, as opposed to training.',
	'latency': 'How quickly a model responds — measured as time to the first token and per-token generation time.',
	'throughput': 'How much work a system completes per second, e.g. tokens or requests — optimized at the cost of latency.',
	'batching': 'Processing many requests or examples together in one pass, raising throughput at some cost to individual latency.',
	'continuous batching': 'Adding new requests to an in-flight batch as others finish, keeping the GPU busy instead of waiting for whole batches.',
	'paged attention': 'Storing the KV cache in flexible non-contiguous pages, like an OS manages memory, eliminating waste from fragmentation.',
	'speculative decoding': 'Having a small draft model propose several tokens that a big model verifies in parallel — faster with identical output.',

	// NLP / Language
	'tokenizer': 'An algorithm that splits text into tokens, mapping between raw text and the model\'s vocabulary indices.',
	'vocabulary': 'The fixed set of tokens a model can output, mapped to indices by the tokenizer.',
	'BPE': 'Byte Pair Encoding — a subword tokenization algorithm that iteratively merges the most frequent pairs of symbols.',
	'corpus': 'A large collection of text used for training or evaluating language models.',
	'perplexity': 'A measure of how surprised a language model is by text — lower perplexity means more confident, better predictions.',
	'BLEU score': 'Bilingual Evaluation Understudy — a metric for machine translation quality based on n-gram overlap with reference translations.',
	'ROUGE score': 'Recall-Oriented Understudy for Gisting Evaluation — a metric for summarisation quality based on n-gram overlap with reference summaries.',
	'chain-of-thought': 'Prompting the model to reason step by step before answering, which dramatically improves performance on complex problems.',
	'few-shot': 'Providing a handful of examples in the prompt to show the model the desired input-output pattern before asking a question.',
	'zero-shot': 'Asking a model to perform a task without any examples, relying purely on what it learned during training.',
	'in-context learning': 'The ability of LLMs to adapt to a task from examples supplied directly in the prompt, without changing any weights.',
	'prompt engineering': 'The craft of designing and refining prompts to reliably get the desired output from a language model.',
	'hallucination': 'When a model confidently generates plausible-sounding but factually wrong or invented content.',

	// RLHF / Alignment
	'RLHF': 'Reinforcement Learning from Human Feedback — fine-tuning a model with a reward model trained on human preferences to make outputs more helpful and aligned.',
	'reward model': 'A model trained on human preference comparisons to score outputs, providing the reward signal used in RLHF.',
	'alignment': 'Training a model to behave in accordance with human intentions and values rather than just to maximize its training objective.',
	'DPO': 'Direct Preference Optimization — a simpler alternative to RLHF that directly optimises a language model on pairwise preference data without training a separate reward model.',
	'Constitutional AI': 'An alignment method where the model critiques and revises its own outputs against a set of principles, reducing reliance on human labellers.',

	// Serving / Infra
	'vLLM': 'A high-throughput LLM serving engine that uses paged attention for efficient memory management during generation.',
	'llama.cpp': 'A C/C++ inference engine for running quantised LLMs on consumer CPUs and GPUs.',
	'Ollama': 'A tool for downloading and running LLMs locally with a simple command-line interface.',
	'TensorRT': 'NVIDIA\'s deep learning inference optimiser and runtime, fusing and optimising layers for maximum GPU throughput.',
	'ONNX': 'Open Neural Network Exchange — a format for exporting trained models so they can run across different frameworks and hardware.',
	'token generation': 'The autoregressive process of producing output tokens one at a time, each conditioned on all previously generated tokens.',
	'TTFT': 'Time to First Token — the latency between receiving a request and generating the first output token, a key serving metric.',
	'context window': 'The maximum number of tokens a model can process in a single forward pass, acting as its "working memory."',

	// Diffusion / Vision
	'score function': 'The gradient of the log probability density of the data distribution, ∇ₓ log p(x). A trained denoiser implicitly estimates this.',
	'noise schedule': 'The sequence of per-step noise levels (β₁, β₂, …, β_T) that determines how much noise is added at each forward step.',
	'classifier-free guidance': 'A conditioning trick where the model is trained both with and without the prompt, and at inference the difference between the two is amplified by a guidance scale w.',
	'latent diffusion': 'Running the diffusion process on a compressed latent representation of the image rather than on pixels — the trick behind Stable Diffusion.',
	'LoRA': 'Low-Rank Adaptation — a fine-tuning technique that trains only tiny rank-decomposed adapter matrices on top of frozen weights, enabling style/concept customization in minutes on consumer GPUs.',
	'ControlNet': 'A side network that adds spatial conditioning (edge maps, depth maps, pose skeletons) to a frozen diffusion U-Net via zero-convolutions.',
	'IP-Adapter': 'An adapter that injects image features into the cross-attention layers of a diffusion U-Net, enabling image-conditioned generation.',
};

function tensor(...args) {
	return tf.tensor(...args);
}

function tensor1d(...args) {
	return tf.tensor1d(...args);
}

function tensor2d(...args) {
	return tf.tensor2d(...args);
}

function dispose(...args) {
	for (var i = 0; i < args.length; i++) {
		args[i].dispose();
	}
}

function scalar (...args) {
	return tf.scalar(...args);
}

function tidy (...args) {
	return tf.tidy(...args);
}

function add (...args) {
	return tf.add(...args);
}

function addN (...args) {
	return tf.addN(...args);
}

/* ════════════════════════════════════════════════════════════
   DARK MODE HELPERS
   Centralised utilities so every JS file can react to the
   current theme via CSS variables and helper queries.
   ════════════════════════════════════════════════════════ */

window.__MN_DARK = {
	isDark: function () {
		return document.documentElement.classList.contains('dark');
	},
	// Returns the resolved value of a CSS custom property on <html>.
	// E.g. themeVar('--mn-bg') => '#0f172a' in dark, '#ffffff' in light.
	themeVar: function (name) {
		return getComputedStyle(document.documentElement)
			.getPropertyValue(name).trim();
	},
	// Listen to theme changes (cookie-driven toggle in functions.php
	// mutates the .dark class on <html>). Every module shares ONE
	// observer and all callbacks run in a single debounced batch:
	// a theme flip triggers exactly one pass over the re-renderers
	// instead of one MutationObserver + one synchronous callback per
	// module (which made the toggle feel frozen).
	onChange: function (callback) {
		const api = window.__MN_DARK;
		api._subscribers = api._subscribers || [];
		api._subscribers.push(callback);
		if (api._observer) return api._observer;
		const dispatch = () => {
			api._pending = false;
			const dark = api.isDark();
			api._subscribers.forEach((cb) => {
				try { cb(dark); } catch (e) { /* ignore */ }
			});
		};
		api._observer = new MutationObserver(() => {
			// Coalesce bursts of class mutations into a single pass.
			if (api._pending) return;
			api._pending = true;
			if (window.queueMicrotask) queueMicrotask(dispatch);
			else Promise.resolve().then(dispatch);
		});
		api._observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});
		return api._observer;
	},
	// Canonical colour pairs that swap when dark mode is active.
	// Use these when canvas/WebGL rendering cannot read CSS vars.
	pairs: {
		'#ffffff': '#1e293b', // white  -> dark surface
		'#fff':    '#1e293b',
		'#f8fafc': '#1e293b', // subtle bg -> dark bg
		'#f1f5f9': '#334155', // raised    -> dark raised
		'#e2e8f0': '#334155', // border    -> dark border
		'#fafafa': '#1e293b',
		'#f9fafb': '#0f172a',
		'#f0f0f0': '#334155', // plotly/echarts gridline light -> dark raised
		'#f4f4f5': '#334155',
		'#1e293b': '#e2e8f0', // dark text -> light text
		'#0f172a': '#f1f5f9',
		'#475569': '#cbd5e1',
		'#64748b': '#94a3b8',
		'#94a3b8': '#cbd5e1',
		'#cbd5e1': '#64748b', // axis lines / muted borders
		'#e2e8f0': '#475569',
		'#334155': '#cbd5e1', // reverse direction
		'#d1d5db': '#64748b',
		'#dbeafe': '#1e3a8a', // light blue tint -> deep navy
		'#eef2ff': '#312e81',
		'#ecfdf5': '#022c22', // success/light green
		'#f0fdf4': '#022c22',
		'#dcfce7': '#022c22',
		'#fef2f2': '#450a0a', // light red
		'#fee2e2': '#450a0a',
		'#fef9c3': '#422006', // light yellow
		'#fff3e0': '#431407', // light orange
		'#e8f5e9': '#022c22',
		'#e0f2fe': '#082f49', // light sky
		'#f0f9ff': '#082f49',
		'#f5f3ff': '#1e1b4b', // light indigo
		'#f5f3ff': '#1e1b4b',
		'#f5f3ff': '#1e1b4b',
		'#fff3e0': '#431407',
		'#fef9c3': '#422006',
		'#fef9c3': '#422006',
		'#fffbeb': '#422006',
		'#fffef0': '#1e293b', // cream -> dark surface
		'#fffef7': '#1e293b',
		'#f8f6f0': '#1e293b',
		'#fffb':   '#1e293b',
		// Additional light tints used by mechanistic_interpretability sections
		'#f9f9ff': '#1e293b',
		'#f9fff9': '#1e293b',
		'#fff9f0': '#1e293b',
		'#f9f0ff': '#1e293b',
		'#f0fff0': '#1e293b',
		'#f5f0ff': '#1e293b',
		'#f0faf0': '#1e293b',
		// Mid-gray text colors used on canvas — swap to light gray on dark canvas
		'#888': '#94a3b8',
		'#888888': '#94a3b8',
		'#999': '#cbd5e1',
		'#999999': '#cbd5e1',
		'#aaa': '#cbd5e1',
		'#aaaaaa': '#cbd5e1',
		'#bbb': '#cbd5e1',
		'#bbbbbb': '#cbd5e1',
		'#ccc': '#cbd5e1',
		'#cccccc': '#cbd5e1',
		'#ddd': '#e2e8f0',
		'#dddddd': '#e2e8f0',
		'#eee': '#e2e8f0',
		'#eeeeee': '#e2e8f0',
		// FFN / detector colors used in intuition.js
		'white':       '#1e293b',
		'#e0e7ff':     '#1e1b4b',  // light indigo bg -> dark indigo bg
		'#818cf8':     '#a5b4fc',  // indigo border -> lighter indigo
		'#312e81':     '#c7d2fe',  // dark indigo text -> light indigo
		'#34d399':     '#6ee7b7',  // emerald border -> lighter emerald
		'#065f46':     '#a7f3d0',  // dark green text -> light green
		'#fef3c7':     '#422006',  // light yellow bg -> dark yellow
		'#f59e0b':     '#fbbf24',  // amber -> brighter amber
		'#92400e':     '#fde68a',  // dark amber text -> light amber
		'#451a03':     '#fde68a',  // dark brown text -> light amber
		'#1e40af':     '#bfdbfe',  // dark blue text -> light blue
		'#1e3a5f':     '#bfdbfe',  // dark navy text -> light blue
		'#14532d':     '#bbf7d0',  // dark green text -> light green
		'#166534':     '#bbf7d0',  // dark green text -> light green
		'#854d0e':     '#fde68a',  // dark amber text -> light amber
		'#7c3aed':     '#c4b5fd',  // dark violet text -> light violet
		'#eab308':     '#facc15',  // yellow-500 -> yellow-400
		'#059669':     '#6ee7b7',  // dark emerald text -> light emerald
		'#fcd34d':     '#fbbf24',  // amber-300 -> amber-400
		'#86efac':     '#4ade80',  // green-300 -> green-400
		'#93c5fd':     '#60a5fa',  // blue-300 -> blue-400
		'#fef08a':     '#fde047',  // yellow-200 -> yellow-300
		'#bbf7d0':     '#86efac',  // green-200 -> green-300
		'#bfdbfe':     '#93c5fd',  // blue-200 -> blue-300
		'#dcfce7':     '#86efac',  // green-100 -> green-300
		'#fef9c3':     '#422006',  // light yellow bg -> dark yellow
		'#ef4444':     '#f87171',  // red -> lighter red
		'#991b1b':     '#fca5a5',  // dark red text -> light red
		'#6366f1':     '#818cf8',  // indigo -> lighter indigo
		'#10b981':     '#6ee7b7',  // emerald -> lighter emerald
		'#d97706':     '#fbbf24',  // dark amber -> bright amber
		// Attention-lab vector colours: the k/keys blue and weighted-v
		// green are used as text fills in the SVG; on the dark canvas
		// the original Blue-600 (#2563eb) is hard to read. Bump up one
		// shade so the in-SVG labels stay legible against #0f172a/#1e293b.
		'#2563eb':     '#60a5fa',  // Blue-600 (k keys) -> Blue-400
		'#3b82f6':     '#93c5fd',  // Blue-500 -> Blue-300
		'#1e3a8a':     '#93c5fd',  // Blue-900 (matrix cells) -> Blue-300
		'#15803d':     '#86efac',  // Green-700 (weighted-v) -> Green-300
		'#16a34a':     '#4ade80',  // Green-600 -> Green-400
		'#22c55e':     '#4ade80',  // Green-500 -> Green-400
		'#d946ef':     '#f0abfc',  // Fuchsia-500 (hover magenta) -> Fuchsia-300
		'#f97316':     '#fdba74',  // Orange-500 -> Orange-300
	},
	// Resolve a single colour through the swap map.
	// Accepts hex strings, returns the dark-mode equivalent (or the
	// original if no swap is registered).
	color: function (c) {
		if (!c || typeof c !== 'string') return c;
		const dark = this.isDark();
		if (!dark) return c;
		const key = c.toLowerCase().trim();
		if (this.pairs[key] !== undefined) return this.pairs[key];
		// Try without leading "#"
		if (key.startsWith('#')) {
			const short = '#' + key.slice(1);
			if (this.pairs[short] !== undefined) return this.pairs[short];
		}
		return c;
	}
};

// Convenience aliases that JS files can call without the window prefix.
const isDarkMode = () => window.__MN_DARK.isDark();
const themeColor = (c) => window.__MN_DARK.color(c);
const cssVar = (name) => window.__MN_DARK.themeVar(name);

// ════════════════════════════════════════════════════════════════
//   GLOBAL PLOTLY THEME OBSERVER
//   Most lab pages render their Plotly charts once at load time
//   with `themeColor('#fff')` baked into the layout. When the
//   user then toggles dark mode, the chart keeps its old colours
//   until the per-module listener re-runs its `Plotly.react()`.
//
//   To avoid having to wire that listener up in every file,
//   this observer walks every `.js-plotly-plot` instance after a
//   theme flip and patches `paper_bgcolor`, `plot_bgcolor`, font
//   colours, and any registered colour in the pairs table.
//   It is a no-op until Plotly is loaded.
// ════════════════════════════════════════════════════════════════
(function setupGlobalPlotlyThemeObserver() {
	const PATCH_KEYS = [
		'paper_bgcolor', 'plot_bgcolor',
		'bgcolor', 'gridcolor', 'line.color', 'marker.color',
		'fillcolor', 'font.color', 'color'
	];
	const swap = (val) => {
		if (Array.isArray(val)) return val.map(swap);
		if (val && typeof val === 'object') {
			const out = {};
			for (const k of Object.keys(val)) out[k] = swap(val[k]);
			return out;
		}
		if (typeof val !== 'string') return val;
		return window.__MN_DARK.color(val);
	};
	const patchLayout = (gd) => {
		try {
			const layout = gd._fullLayout || gd.layout || {};
			const update = {};
			for (const key of PATCH_KEYS) {
				if (layout[key] !== undefined) update[key] = swap(layout[key]);
			}
			if (Object.keys(update).length === 0) return;
			if (typeof Plotly !== 'undefined' && Plotly.relayout) {
				Plotly.relayout(gd, update);
			}
		} catch (e) { /* ignore — chart not yet attached */ }
	};
	const patchAll = () => {
		if (typeof Plotly === 'undefined') return;
		const nodes = document.querySelectorAll('.js-plotly-plot');
		nodes.forEach(patchLayout);
	};
	// Patch once on initial load too, in case the page loaded with
	// the dark class already set (e.g. via the prefers-color-scheme
	// path in index.php).
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', patchAll, { once: true });
	} else {
		patchAll();
	}
	// Patch on every theme flip.
	window.__MN_DARK.onChange(() => {
		// Defer one tick so any module-level re-renderers that also
		// listen have a chance to run first.
		setTimeout(patchAll, 0);
	});
})();

