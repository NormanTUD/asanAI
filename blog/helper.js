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

function parseCategories() {
	const containers = document.querySelectorAll('.md');
	const activeCategories = new Set();
	const catRegex = /\\category\{([^}]+)\}/g;

	containers.forEach(container => {
		const children = Array.from(container.children);
		let currentWrapper = null;
		let stopLevel = null;

		children.forEach(el => {
			if (el.id === 'toc') return;

			const text = el.textContent || "";
			const matches = [...text.matchAll(catRegex)];

			if (matches.length > 0) {
				const foundKeys = [];
				matches.forEach(m => {
					const parts = m[1].split(',').map(s => s.trim());
					foundKeys.push(...parts);
				});

				const validKeys = foundKeys.filter(k => categoryConfig[k]);

				if (validKeys.length > 0) {
					validKeys.forEach(k => activeCategories.add(k));

					// Erstelle den Wrapper
					currentWrapper = document.createElement('div');
					currentWrapper.className = 'category-block ' + validKeys.map(k => `cat-${k}`).join(' ');

					const mainColor = getCategoryColor(validKeys[0]);
					//currentWrapper.style.cssText = `border-left: 4px solid ${mainColor}; padding-left: 15px; margin-bottom: 20px; display: block;`;

					// Füge den Wrapper nach dem aktuellen Element ein
					container.insertBefore(currentWrapper, el.nextSibling);

					// LOGIK: Finde das Stopp-Level
					// Wir schauen, ob das nächste Element eine Überschrift ist
					let nextEl = el.nextElementSibling;
					// Überspringe leere Textknoten/Wrapper falls vorhanden
					while (nextEl && nextEl === currentWrapper) nextEl = nextEl.nextElementSibling;

					if (nextEl && /^H([1-6])$/.test(nextEl.tagName)) {
						// Wenn unmittelbar danach ein H<n> kommt, stoppen wir erst beim nächsten H <= n
						stopLevel = parseInt(nextEl.tagName.substring(1));
					} else {
						// Ansonsten stoppen wir bei JEDER Überschrift
						stopLevel = 7;
					}

					// Entferne den Tag aus dem Element
					el.innerHTML = el.innerHTML.replace(catRegex, '');
					if (el.textContent.trim() === "" && el.children.length === 0) {
						el.remove();
					}
					return; // Springe zum nächsten Element (das dann in den Wrapper wandert)
				}
			}

			// --- STOPP-LOGIK ---
			if (/^H[1-6]$/.test(el.tagName)) {
				const currentLevel = parseInt(el.tagName.substring(1));

				// Wir stoppen, wenn:
				// 1. Ein Wrapper aktiv ist UND
				// 2. Der Wrapper bereits Inhalt hat (damit die Start-Überschrift mitgenommen wird) UND
				// 3. Die aktuelle Überschrift Ebene <= stopLevel ist
				if (currentWrapper && currentWrapper.children.length > 0) {
					if (currentLevel <= stopLevel) {
						currentWrapper = null;
						stopLevel = null;
					}
				}
			}

			// --- VERSCHIEBE-LOGIK ---
			if (currentWrapper && el !== currentWrapper && el.parentNode === container) {
				currentWrapper.appendChild(el);
			}
		});
	});

	//renderCategoryUI(activeCategories); // TODO re-enable
}

function renderCategoryUI(activeCategories) {
	const mainContent = document.getElementById('contents');
	if (!mainContent || activeCategories.size === 0) return;

	let filterBar = document.getElementById('category-filter-bar');
	if (!filterBar) {
		filterBar = document.createElement('div');
		filterBar.id = 'category-filter-bar';
		filterBar.style.cssText = "margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 10px;";

		// WICHTIG: Wenn ein TOC existiert, füge die Bar DANACH ein, nicht davor
		const toc = document.getElementById('toc');
		if (toc && toc.parentNode === mainContent) {
			toc.insertAdjacentElement('afterend', filterBar);
		} else {
			mainContent.prepend(filterBar);
		}
	}

	filterBar.innerHTML = '';

	activeCategories.forEach(key => {
		const color = getCategoryColor(key);
		const btn = document.createElement('button');
		btn.innerHTML = categoryConfig[key];
		btn.style.cssText = `border: 2px solid ${color}; padding: 6px 14px; border-radius: 20px; cursor: pointer; background: ${color}; color: white; font-weight: bold;`;
		btn.dataset.active = "true";

		btn.onclick = () => {
			const isActive = btn.dataset.active === "true";
			btn.dataset.active = !isActive;
			btn.style.background = !isActive ? color : "transparent";
			btn.style.color = !isActive ? "white" : color;

			const blocks = document.querySelectorAll(`.cat-${key}`);
			console.log(`Click Debug: Toggling ${blocks.length} blocks for ${key}`);

			blocks.forEach(b => {
				b.style.setProperty('display', !isActive ? 'block' : 'none', 'important');
			});
		};
		filterBar.appendChild(btn);
	});
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
	const content = document.getElementById('all');

	if (loader) loader.style.display = 'none';
	if (content) {
		content.style.opacity = '0';
		content.style.display = 'block';
		content.style.transition = 'opacity 0.5s ease';
		requestAnimationFrame(() => { content.style.opacity = '1'; });
	}
}

function make_external_a_href_target_blank() {
	const links = document.querySelectorAll('a[href]');

	links.forEach(link => {
		if (link.hostname && link.hostname !== window.location.hostname) {
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
		}
	});
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

			// Small delay to let DOM reflow after reveals
			requestAnimationFrame(() => {
				targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

				// Highlight effect
				targetEl.style.transition = 'background-color 0.3s ease';
				targetEl.style.backgroundColor = 'rgba(255, 200, 50, 0.35)';
				setTimeout(() => { targetEl.style.backgroundColor = 'transparent'; }, 2000);
			});
		} else {
			console.warn(`Target element #${targetId} not found.`);
		}
	};
}

function addReadingProgress() {
	const bar = document.createElement('div');
	bar.id = 'reading-progress';
	bar.style.cssText = `
    position: fixed; top: 0; left: 0; height: 3px;
    background: linear-gradient(90deg, #4fc3f7, #ab47bc);
    width: 0%; z-index: 9999; transition: width 0.1s linear;
  `;
	document.body.appendChild(bar);

	window.addEventListener('scroll', () => {
		const h = document.documentElement;
		const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
		bar.style.width = pct + '%';
	});
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
			// Simulate click to expand
			p.click();
		}
		node = node.parentElement
			? node.parentElement.closest('.toggleable-quote, .rendered-quote')
			: null;
	}
}

function smartquote() {
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
					// Parse HTML into a temporary element to get text + tags
					const temp = document.createElement('span');
					temp.innerHTML = html;
					container.innerHTML = '';
					container.appendChild(temp);

					// Get all text nodes
					const walker = document.createTreeWalker(temp, NodeFilter.SHOW_TEXT, null, false);
					const textNodes = [];
					while (walker.nextNode()) textNodes.push(walker.currentNode);

					// Wrap each character in a span
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
							// Preserve whitespace width
							if (text[i] === ' ') charSpan.style.width = '0.3em';
							frag.appendChild(charSpan);
						}
						node.parentNode.replaceChild(frag, node);
					});

					// Stagger the reveal
					const allChars = temp.querySelectorAll('.quote-char');
					const totalChars = allChars.length;
					// Dynamic speed: faster for longer quotes, minimum 4ms per char
					const perChar = Math.max(4, Math.min(18, 600 / totalChars));

					allChars.forEach((ch, i) => {
						setTimeout(() => {
							ch.style.opacity = '1';
							ch.style.filter = 'blur(0)';
							ch.style.transform = 'translateY(0)';
						}, i * perChar);
					});

					// Callback after all characters revealed
					if (onComplete) {
						setTimeout(onComplete, totalChars * perChar + 300);
					}
				};

				// --- Render a state ---
				const renderState = (isShort, animate = false) => {
					const text = isShort ? shortHtml : fullHtml;
					p.setAttribute('data-state', isShort ? 'short' : 'full');

					// Build the hint
					const hintText = isShort ? 'expand' : 'collapse';
					const hintEl = `<span class="quote-expand-hint"><span class="quote-hint-dot">·</span> <i>${hintText}</i></span>`;

					if (!animate) {
						p.innerHTML = `<span class="quote-guillemet quote-guillemet-open">»</span><span class="quote-text-inner">${text}</span><span class="quote-guillemet quote-guillemet-close">«</span>&nbsp;${hintEl}`;
						return;
					}

					// Animated version
					p.innerHTML = `<span class="quote-guillemet quote-guillemet-open glow-pulse">»</span><span class="quote-text-inner"></span><span class="quote-guillemet quote-guillemet-close" style="opacity:0">«</span>&nbsp;${hintEl}`;

					const textContainer = p.querySelector('.quote-text-inner');
					const closeGuill = p.querySelector('.quote-guillemet-close');

					animateTextIn(textContainer, text, () => {
						// Fade in closing guillemet after text is done
						closeGuill.style.transition = 'opacity 0.4s ease';
						closeGuill.style.opacity = '1';

						// Remove glow pulse from opening guillemet
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

					// Phase 1: Dissolve out current text
					const currentChars = p.querySelectorAll('.quote-text-inner, .quote-text-inner *');
					p.querySelector('.quote-guillemet-close').style.transition = 'opacity 0.2s ease';
					p.querySelector('.quote-guillemet-close').style.opacity = '0';

					// Fade out the text container
					const textInner = p.querySelector('.quote-text-inner');
					if (textInner) {
						textInner.style.transition = 'opacity 0.25s ease, filter 0.25s ease';
						textInner.style.opacity = '0';
						textInner.style.filter = 'blur(3px)';
					}

					// Phase 2: After dissolve, swap and animate in
					setTimeout(() => {
						renderState(!isCurrentlyShort, true);
						// Unlock after animation completes
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
}

function bibtexify() {
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
    document.querySelectorAll('pre[class*="language-"]').forEach((pre) => {
        if (pre.querySelector('.code-copy-btn')) return;

        // Pre braucht relative Positionierung und Scroll-Verhalten
        pre.style.position = 'relative';
        pre.style.overflow = 'auto';

        // Button-Container: sticky innerhalb des pre
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = `
            position: sticky;
            top: 0;
            float: right;
            z-index: 10;
            pointer-events: none;
        `;

        const btn = document.createElement('button');
        btn.textContent = 'Copy';
        btn.className = 'code-copy-btn';

        // Konsistente Farbkonstanten
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
        `;

        let isCopied = false;

        btn.addEventListener('mouseenter', () => {
            btn.style.background = hoverBg;
            if (!isCopied) btn.style.color = hoverColor;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.background = defaultBg;
            if (!isCopied) btn.style.color = defaultColor;
        });

        btn.addEventListener('click', () => {
            const code = pre.querySelector('code');
            const text = code ? code.innerText : pre.innerText;

            const onSuccess = () => {
                isCopied = true;
                btn.textContent = '✓ Copied!';
                btn.style.color = successColor;
                setTimeout(() => {
                    isCopied = false;
                    btn.textContent = 'Copy';
                    if (btn.matches(':hover')) {
                        btn.style.color = hoverColor;
                        btn.style.background = hoverBg;
                    } else {
                        btn.style.color = defaultColor;
                        btn.style.background = defaultBg;
                    }
                }, 2000);
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
        // Als erstes Kind in pre einfügen, damit er oben sticky bleibt
        pre.insertBefore(btnContainer, pre.firstChild);
    });
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
    opacity: 0; transition: opacity 0.2s ease; /* Reduced transition duration */
    pointer-events: none;
  `;
	document.body.appendChild(badge);

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

				badge.style.opacity = '1';

				// Curiosity labels
				let label = 'Curious';
				let emoji = '🔎';
				if (pct >= 100) { label = 'Insatiably Curious'; emoji = '⭐'; } // Changed emoji
				else if (pct >= 75) { label = 'Very Curious'; emoji = '🔬'; }
				else if (pct >= 50) { label = 'Curious'; emoji = '🔎'; }
				else if (pct >= 25) { label = 'Getting Curious'; emoji = '👀'; }

				badge.innerHTML = `${emoji} <span style="color:#ddd">${label}</span> <span style="color:#555">(${count}/${total})</span>`;

				// Pulse
				badge.style.transform = 'scale(1.06)';
				badge.style.borderColor = 'rgba(171,71,188,0.3)';
				setTimeout(() => {
					badge.style.transform = 'scale(1)';
					badge.style.borderColor = 'rgba(255,255,255,0.06)';
				}, 700);

				// Full completion
				if (count === total) {
					badge.style.color = '#ce93d8';
					badge.style.borderColor = 'rgba(171,71,188,0.3)';
				}

				// Make badge disappear faster after a delay
				setTimeout(() => {
					badge.style.opacity = '0';
				}, 1500); // Badge disappears after 1.5 seconds
			}
		};
	});
}

function addReturnVisitorWarmth() {
	const key = 'site_visit_count';
	const lastKey = 'site_last_visit';

	const count = parseInt(localStorage.getItem(key) || '0') + 1;
	const lastVisit = localStorage.getItem(lastKey);
	localStorage.setItem(key, count);
	localStorage.setItem(lastKey, new Date().toISOString());

	if (count < 2) return; // First visit — no toast

	const toast = document.createElement('div');
	toast.style.cssText = `
    position: fixed; top: 20px; left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: rgba(25, 25, 35, 0.9); color: #999;
    padding: 10px 22px; border-radius: 24px;
    font-size: 13px; font-family: system-ui, sans-serif;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.06);
    opacity: 0; z-index: 99999;
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
  `;

	let msg = '';
	if (count === 2) msg = 'Welcome back 👋';
	else if (count <= 5) msg = `Good to see you again · Visit #${count}`;
	else if (count <= 15) msg = `You're becoming a regular · Visit #${count}`;
	else if (count <= 50) msg = `One of the faithful · Visit #${count} ✨`;
	else msg = `A true scholar · Visit #${count} 🏛️`;

	toast.textContent = msg;
	document.body.appendChild(toast);

	// Animate in
	requestAnimationFrame(() => {
		toast.style.opacity = '1';
		toast.style.transform = 'translateX(-50%) translateY(0)';
	});

	// Fade out
	setTimeout(() => {
		toast.style.opacity = '0';
		toast.style.transform = 'translateX(-50%) translateY(-10px)';
		setTimeout(() => toast.remove(), 700);
	}, 3500);
}

function initOptionalBlocks() {
	document.querySelectorAll('div.optional').forEach(block => {
		// Prevent double initialization
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
			<span class="optional-icon">▶</span>
			<span class="optional-title">${headline}</span>
		`;

		// Create Content Wrapper (initially hidden)
		const contentWrapper = document.createElement('div');
		contentWrapper.className = 'optional-content md'; // Keep md class for your renderer
		contentWrapper.style.display = 'none';
		contentWrapper.innerHTML = contentHtml;

		block.appendChild(header);
		block.appendChild(contentWrapper);

		// Toggle Logic
		header.onclick = () => {
			const isHidden = contentWrapper.style.display === 'none';
			contentWrapper.style.display = isHidden ? 'block' : 'none';
			header.querySelector('.optional-icon').innerHTML = isHidden ? '▼' : '▶';
			header.classList.toggle('active', isHidden);
		};
	});
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
		el.innerHTML = `
      <div style="font-size: 28px; margin-bottom: 12px;">🎮</div>
      <div style="margin-bottom: 8px;">↑↑↓↓←→←→BA</div>
      <div style="color: #aaa; font-size: 13px; line-height: 1.6;">${msg}</div>
    `;
		document.body.appendChild(el);

		requestAnimationFrame(() => {
			el.style.opacity = '1';
			el.style.transform = 'translate(-50%, -50%) scale(1)';
		});

		setTimeout(() => {
			el.style.opacity = '0';
			setTimeout(() => el.remove(), 600);
		}, 5000);
	}
}

function addConsoleEasterEggs() {
	const styles = 'color: #4fc3f7; font-size: 14px; font-weight: bold;';
	const sub = 'color: #888; font-size: 11px;';

	console.log('%c🤓 Hey, you opened DevTools.', styles);
	console.log('%cThat means you\'re curious. We like curious.', sub);

	const tips = [
		"Fun fact: The backpropagation algorithm was independently discovered at least 3 times.",
		"The attention mechanism was inspired by how humans read — skipping boring parts, just like you're doing right now.",
		"GPT-3 has 175 billion parameters. This course has... fewer.",
		"If you can read this, you're overqualified for most AI discussions on Twitter.",
	];

	console.log(`%c💡 ${tips[Math.floor(Math.random() * tips.length)]}`, sub);

	window.lol = () => {
		const jokes = [
			"Why do neural networks never get lonely? They have lots of connections.",
			"A QA engineer walks into a bar. Orders 1 beer. Orders 0 beers. Orders 99999999 beers. Orders -1 beers. Orders a lizard.",
			"Machine learning is just statistics wearing a leather jacket.",
			"Roses are red, violets are blue, unexpected '{' on line 32.",
			"There are only 10 types of people: those who understand binary and those who've completed this course.",
		];
		const joke = jokes[Math.floor(Math.random() * jokes.length)];
		console.log(`%c😂 ${joke}`, 'color: #ffd54f; font-size: 12px;');
		return '😂';
	};
}
