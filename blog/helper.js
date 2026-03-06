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

function renderMarkdown() {
	updateLoadingStatus("Rendering Markdown...");
	document.querySelectorAll('.md').forEach(container => {
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

		// 3. Erst jetzt das Markdown (mit den bereits fertigen Spans) parsen
		container.innerHTML = marked.parse(rawContent);
	});
	updateLoadingStatus("Rendered Markdown.");

	const fnContainer = document.getElementById('footnotes');
	if (fnContainer) {
		fnContainer.innerHTML = marked.parse(fnContainer.innerHTML);
	}

	const srcContainer = document.getElementById('sources');
	if (srcContainer) {
		srcContainer.innerHTML = marked.parse(srcContainer.innerHTML);
	}
}

function revealContent() {
	const loader = document.getElementById('loader');
	const content = document.getElementById('contents');

	if (loader) loader.style.display = 'none';
	if (!content) {
		console.error("#contents not found");
		return;
	}

	$(loader).remove();

	content.style.display = 'block';
	content.style.opacity = '0';

	// Phase 1: Reading progress bar materializes first
	const progressBar = document.getElementById('reading-progress');
	if (progressBar) {
		progressBar.style.opacity = '0';
		progressBar.style.filter = 'blur(4px)';
		progressBar.style.transition = 'opacity 0.4s ease, filter 0.4s ease';
		requestAnimationFrame(() => {
			progressBar.style.opacity = '1';
			progressBar.style.filter = 'blur(0)';
		});
	}

	// Phase 2: Container fades in with blur-to-sharp
	requestAnimationFrame(() => {
		content.style.filter = 'blur(3px)';
		content.style.transform = 'translateY(6px)';
		content.style.transition = 'opacity 0.5s ease, filter 0.6s ease, transform 0.6s ease';

		requestAnimationFrame(() => {
			content.style.opacity = '1';
			content.style.filter = 'blur(0)';
			content.style.transform = 'translateY(0)';
		});
	});

	// Phase 3: Staggered section cascade — each top-level section drifts in
	const sections = content.querySelectorAll(':scope > section, :scope > .category-block, :scope > h1, :scope > h2');
	if (sections.length > 0) {
		const perSection = Math.max(40, Math.min(120, 800 / sections.length));

		sections.forEach((section, i) => {
			section.style.opacity = '0';
			section.style.filter = 'blur(3px)';
			section.style.transform = 'translateY(8px)';
			section.style.transition = 'opacity 0.45s ease, filter 0.45s ease, transform 0.45s ease';

			setTimeout(() => {
				section.style.opacity = '1';
				section.style.filter = 'blur(0)';
				section.style.transform = 'translateY(0)';
			}, 300 + (i * perSection)); // 300ms offset to let container start first
		});
	}
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
				p.innerHTML = `»${el.innerHTML.trim().replace(/^["»]|["«]$/g, '')}«`;
			}

			const footer = document.createElement('footer');
			const citeLink = document.createElement('a');
			citeLink.id = instanceId;
			citeLink.className = "cite-stealth iframe-safe-link";
			citeLink.setAttribute('data-target', `bib-${citeKey}`);
			citeLink.style.cursor = "pointer";
			citeLink.title = info;
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

	const containers = document.querySelectorAll('.md');
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
		content = content.replace(/\\(cite|citeauthor|citeauthorlastnameand|citetitle|citeyear|citealternativetitle|citeurl)(?:\[(.*?)\])?\{(.+?)\}/g, (match, type, manualText, key) => {
			const isDuplicate = citedInThisBlock.has(key);
			const instanceId = `ref-${key}-${Math.random().toString(36).substr(2, 5)}`;
			const data = trackCitation(key, instanceId, isDuplicate);
			if (!data) {
				console.error(`Reference ${key} not found!`);
				return `[?${key}?]`;
			}

			citedInThisBlock.add(key);
			const info = `${data.author}: ${data.title}${data.year ? ' ('+data.year+')' : ''}`;
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

			// Add SVG icon if URL is available
			const svgIcon = data.url
				? `<a class='bibtexify_auto_link_icon' href="${data.url}" target="_blank" rel="noopener noreferrer" title="View source"><span class="external_link_icon">
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
       d="M 1408,608 V 288 Q 1408,169 1323.5,84.5 1239,0 1120,0 H 288 Q 169,0 84.5,84.5 0,169 0,288 v 832 Q 0,1239 84.5,1323.5 169,1408 288,1408 h 704 q 14,0 23,-9 9,-9 9,-23 v -64 q 0,-14 -9,-23 -9,-9 -23,-9 H 288 q -66,0 -113,-47 -47,-47 -47,-113 V 288 q 0,-66 47,-113 47,-47 113,-47 h 832 q 66,0 113,47 47,47 47,113 v 320 q 0,14 9,23 9,9 23,9 h 64 q 14,0 23,-9 9,-9 9,-23 z m 384,864 V 960 q 0,-26 -19,-45 -19,-19 -45,-19 -26,0 -45,19 L 1507,1091 855,439 q -10,-10 -23,-10 -13,0 -23,10 L 695,553 q -10,10 -10,23 0,13 10,23 l 652,652 -176,176 q -19,19 -19,45 0,26 19,45 19,19 45,19 h 512 q 26,0 45,-19 19,-19 19,-45 z"
       id="path3029"
       inkscape:connector-curvature="0"
       style="fill:currentColor" />
  </g>
</svg>
</span></a>`
				: "";

			const idAttribute = isDuplicate ? "" : `id="${instanceId}"`;

			// Split the link text into words
			const linkWords = String(linkText).split(" ");
			const lastWord = linkWords.pop(); // Get the last word
			const precedingText = linkWords.join(" "); // All but the last word

			// Combine the preceding text, last word, and SVG icon into a single <a> tag
			const fullLink = `<a class="cite-stealth iframe-safe-link" ${idAttribute} data-target="bib-${key}" title="${info}" style="cursor:pointer; white-space: nowrap;">${precedingText} ${lastWord}${svgIcon}</a>`;

			// Return the final citation element
			return `<span class="autociteelement">${fullLink}</span>`;
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
			return `<sup class="footnote-ref"><a class="iframe-safe-link" data-target="fn-${fnId}" id="${instanceId}" title="${data.author}: ${data.title}" style="cursor:pointer;">[${fnId}]</a></sup>`;
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

		html += `<div id="bib-${key}" class="bib-entry" style="margin-bottom:10px;">${entryText}</div>\n`;
	});

	sourcesDiv.innerHTML = html;

	if (typeof renderMarkdown === "function") {
		sourcesDiv.querySelectorAll('.bib-entry').forEach(el => {
			if (window.marked) el.innerHTML = marked.parse(el.innerHTML);
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
		labelSpan.style.color = '#ddd';

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
		counterSpan.style.color = '#555';
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
		if (block.classList.contains('optional-initialized')) return;
		block.classList.add('optional-initialized');

		const headline = block.getAttribute('data-headline') || "More Information";
		const contentHtml = block.innerHTML;
		block.innerHTML = '';

		// Create Header
		const header = document.createElement('div');
		header.className = 'optional-header';
		header.style.cursor = 'pointer';
		header.innerHTML = `
			<span class="optional-icon" style="display:inline-block; transition: transform 0.3s ease;">▶</span>
			<span class="optional-title">${headline}</span>
		`;

		// Create Content Wrapper (initially hidden)
		const contentWrapper = document.createElement('div');
		contentWrapper.className = 'optional-content md';
		contentWrapper.style.display = 'none';
		contentWrapper.style.overflow = 'hidden';
		contentWrapper.innerHTML = contentHtml;

		block.appendChild(header);
		block.appendChild(contentWrapper);

		let isAnimating = false;

		// --- Staggered paragraph reveal ---
		const animateContentIn = (wrapper, onComplete) => {
			// Gather direct block-level children for staggered reveal
			const children = wrapper.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > pre, :scope > blockquote, :scope > div, :scope > table, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');

			if (children.length === 0) {
				// Fallback: animate the whole wrapper as one block
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

			// Adaptive pacing: fewer children = slower, more luxurious cascade
			const perChild = Math.max(30, Math.min(100, 500 / children.length));

			children.forEach((child, i) => {
				child.style.opacity = '0';
				child.style.filter = 'blur(4px)';
				child.style.transform = 'translateY(8px)';
				child.style.transition = 'opacity 0.35s ease, filter 0.35s ease, transform 0.35s ease';

				setTimeout(() => {
					child.style.opacity = '1';
					child.style.filter = 'blur(0)';
					child.style.transform = 'translateY(0)';
				}, i * perChild);
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

			// Reverse stagger: last child fades first (bottom-to-top reabsorption)
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
			if (isAnimating) return;

			const icon = header.querySelector('.optional-icon');
			const isHidden = contentWrapper.style.display === 'none';

			if (isHidden) {
				// --- EXPAND ---
				isAnimating = true;

				// Rotate icon
				icon.style.transform = 'rotate(90deg)';
				icon.innerHTML = '▼';
				header.classList.add('active');

				// Flash the block border
				block.style.transition = 'box-shadow 0.4s ease';
				block.style.boxShadow = '0 0 12px rgba(171,71,188,0.15)';
				setTimeout(() => { block.style.boxShadow = 'none'; }, 800);

				// Show wrapper, then animate children in
				contentWrapper.style.display = 'block';

				// Small delay to let display:block take effect
				requestAnimationFrame(() => {
					animateContentIn(contentWrapper, () => {
						isAnimating = false;
					});
				});

			} else {
				// --- COLLAPSE: dissolve out, then hide ---
				isAnimating = true;

				animateContentOut(contentWrapper, () => {
					contentWrapper.style.display = 'none';

					// Reset children styles for next expand
					const children = contentWrapper.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > pre, :scope > blockquote, :scope > div, :scope > table, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
					children.forEach(child => {
						child.style.opacity = '';
						child.style.filter = '';
						child.style.transform = '';
						child.style.transition = '';
					});

					// Rotate icon back
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

	const tips = [
		"The backpropagation algorithm was independently discovered at least 3 times before it became famous.",
		"The word 'embedding' comes from topology — mapping one space into another while preserving structure.",
		"Attention Is All You Need was rejected from ICML before being accepted at NeurIPS.",
		"GPT-3 has 175 billion parameters. A fruit fly brain has ~100,000 neurons. Draw your own conclusions.",
		"The 'temperature' in sampling is borrowed from thermodynamics. Boltzmann would be proud.",
		"The Transformer was originally designed for translation. Nobody expected it to write poetry.",
		"Layer normalization was invented because batch normalization doesn't work well with sequences.",
		"The 'residual' in ResNet was inspired by the idea that learning nothing should be easy.",
		"Tokenizers don't understand language. They understand byte frequencies. That's somehow enough.",
		"The softmax function is just a Boltzmann distribution wearing a trench coat.",
	];

	console.log(`%c💡 ${tips[Math.floor(Math.random() * tips.length)]}`, sub);

	window.lol = () => {
		const jokes = [
			"Why do neural networks never get lonely?\nThey have lots of connections.",
			"A QA engineer walks into a bar.\nOrders 1 beer. Orders 0 beers. Orders 99999999 beers.\nOrders -1 beers. Orders a lizard. Orders NULL beers.",
			"Machine learning is just statistics wearing a leather jacket.",
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
