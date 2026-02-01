window.usedCitations = []; // Tracks order of citation usage
window.footnoteCounter = 1;
window.indexedTerms = {}; // Global tracker for used terms

// 1. Konfiguration der erlaubten Kategorien
const categoryConfig = {
    math: "Math",
    hard_math: "Hard math",
    philosophy: "Philosophy",
    history: "History",
    hard: "Hard Content",
    bli: "Bli"
};

// Hilfsfunktion für stabile Farben basierend auf dem Namen
function getCategoryColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 45%)`;
}

/**
 * Scannt das Dokument nach \category{...} und gruppiert die Elemente
 */
function parseCategories() {
    const containers = document.querySelectorAll('.md');
    const activeCategories = new Set();

    containers.forEach(container => {
        let html = container.innerHTML;

        // Regex findet \category{key}
        const regex = /\\category\{([^}]+)\}/g;

        // Temporäres Array der Elemente, um sie später zu gruppieren
        const elements = Array.from(container.childNodes);
        let currentCategory = null;
        let currentWrapper = null;

        elements.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && regex.test(node.textContent)) {
                const match = node.textContent.match(/\\category\{([^}]+)\}/);
                const key = match[1];

                if (!categoryConfig[key]) {
                    console.error(`Glossary Error: Category "${key}" is not defined in categoryConfig.`);
                    return;
                }

                currentCategory = key;
                activeCategories.add(key);

                // Entferne das \category{...} Tag aus dem Text
                node.textContent = node.textContent.replace(regex, '');

                // Erstelle neuen Wrapper für diese Kategorie
                currentWrapper = document.createElement('div');
                currentWrapper.className = `category-block cat-${key}`;
                currentWrapper.style.borderLeft = `4px solid ${getCategoryColor(key)}`;
                currentWrapper.style.paddingLeft = "15px";
                currentWrapper.style.marginBottom = "10px";

                node.parentNode.insertBefore(currentWrapper, node.nextSibling);
            } else if (currentCategory) {
                // Wenn wir eine Überschrift finden, die das Ende markiert
                if (node.nodeType === Node.ELEMENT_NODE && /^H[1-6]$/.test(node.tagName)) {
                    currentCategory = null;
                    currentWrapper = null;
                } else if (currentWrapper) {
                    // Verschiebe das Element in den aktuellen Kategorie-Wrapper
                    currentWrapper.appendChild(node);
                }
            }
        });
    });

    renderCategoryUI(activeCategories);
}

/**
 * Erstellt die Filter-Buttons am Anfang des Dokuments
 */
function renderCategoryUI(activeCategories) {
    const mainContent = document.getElementById('contents');
    if (!mainContent || activeCategories.size === 0) return;

    let filterBar = document.getElementById('category-filter-bar');
    if (!filterBar) {
        filterBar = document.createElement('div');
        filterBar.id = 'category-filter-bar';
        filterBar.style.cssText = "margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; display: flex; flex-wrap: wrap; gap: 10px;";
        mainContent.prepend(filterBar);
    }

    filterBar.innerHTML = '<span style="width:100%; font-weight:bold; font-size: 0.9em; margin-bottom:5px;">Filter Content:</span>';

    activeCategories.forEach(key => {
        const label = categoryConfig[key];
        const color = getCategoryColor(key);

        const btn = document.createElement('button');
        btn.innerHTML = label;
        btn.style.cssText = `
            border: none;
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            color: white;
            font-weight: bold;
            transition: opacity 0.2s;
            background-color: ${color};
        `;

        btn.dataset.active = "true";
        btn.onclick = () => {
            const isActive = btn.dataset.active === "true";
            btn.dataset.active = !isActive;
            btn.style.opacity = isActive ? "0.3" : "1";

            // Sichtbarkeit der Blöcke umschalten
            document.querySelectorAll(`.cat-${key}`).forEach(el => {
                el.style.display = isActive ? "none" : "block";
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
		const rawContent = container.innerHTML.replace(/^[ \t]+/gm, '');
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
	if (content) content.style.display = 'block';
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

window.quotesLog = [];

function smartquote() {
	if (!window.usedCitations) window.usedCitations = [];
	if (!window.citationMap) window.citationMap = {};

	document.querySelectorAll('.smart-quote').forEach(el => {
		const citeKey = el.getAttribute('data-cite');
		const citePage = el.getAttribute('data-page');

		const fullEl = el.querySelector('.full-quote');
		const shortEl = el.querySelector('.short-quote');

		let author = 'Unknown';
		let title = "";
		let page = citePage || "";
		let year = "";
		let url = el.getAttribute('data-url');

		if (citeKey && window.bibData && window.bibData[citeKey]) {
			const bib = window.bibData[citeKey];
			author = bib.author || author;
			title = bib.title || "";
			year = bib.year || "";
			if(page != "") page = `, p. ${page}`;
			url = bib.url || url;

			const instanceId = `ref-${citeKey}-${Math.random().toString(36).substr(2, 5)}`;
			if (!window.usedCitations.includes(citeKey)) window.usedCitations.push(citeKey);
			if (!window.citationMap[citeKey]) window.citationMap[citeKey] = [];
			window.citationMap[citeKey].push(instanceId);

			const info = `${author}: ${title}${year ? ' ('+year+')' : ''}`;
			const author_display = title !== "" ? `${author} (${title})` : author;

			const quoteBox = document.createElement('blockquote');
			quoteBox.className = el.className.replace('smart-quote', 'rendered-quote');

			const p = document.createElement('p');

			if (fullEl && shortEl) {
				p.className = 'toggleable-quote';
				p.title = "Click to toggle quote length";
				
				const shortHtml = shortEl.innerHTML.trim().replace(/^["»]|["«]$/g, '');
				const fullHtml = fullEl.innerHTML.trim().replace(/^["»]|["«]$/g, '');
				const hint = ` <span class="quote-expand-hint" style="cursor:pointer; opacity:0.5; font-size:0.8em;">[click to show full]<span>`;

				// Initialize state
				p.setAttribute('data-state', 'short');
				p.innerHTML = `»${shortHtml}«${hint}`;

				p.onclick = () => {
					const currentState = p.getAttribute('data-state');
					if (currentState === 'short') {
						p.innerHTML = `»${fullHtml}«`;
						p.setAttribute('data-state', 'full');
						p.style.fontStyle = 'normal';
					} else {
						p.innerHTML = `»${shortHtml}«${hint}`;
						p.setAttribute('data-state', 'short');
						p.style.fontStyle = 'italic';
					}
				};
			} else {
				const cleanContent = el.innerHTML.trim().replace(/^["»]|["«]$/g, '');
				p.innerHTML = `»${cleanContent}«`;
			}

			const footer = document.createElement('footer');
			const citeLink = document.createElement('a');
			citeLink.href = `#bib-${citeKey}`;
			citeLink.id = instanceId;
			citeLink.className = "cite-stealth";
			citeLink.title = info;
			citeLink.innerHTML = `${author_display}${page}`;

			footer.appendChild(document.createTextNode('— '));
			footer.appendChild(citeLink);

			quoteBox.appendChild(p);
			quoteBox.appendChild(footer);
			el.replaceWith(quoteBox);
		}
	});

	if (typeof source_bibliography === "function") source_bibliography();
}

function bibtexify() {
	const containers = document.querySelectorAll('.md');
	const mainContent = document.getElementById('contents'); // Target the content div
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

		content = content.replace(/\\(cite|citeauthor|citetitle|citeyear|citealternativetitle|citeurl)\{(.+?)\}/g, (match, type, key) => {
			const isDuplicate = citedInThisBlock.has(key);
			const instanceId = `ref-${key}-${Math.random().toString(36).substr(2, 5)}`;
			const data = trackCitation(key, instanceId, isDuplicate);
			if (!data) return `[?${key}?]`;

			citedInThisBlock.add(key);
			const info = `${data.author}: ${data.title}${data.year ? ' ('+data.year+')' : ''}`;
			let linkText = "";
			switch(type) {
				case 'citeauthor': linkText = data.author; break;
				case 'citetitle':  linkText = data.title; break;
				case 'citealternativetitle':  linkText = data.alternativetitle; break;
				case 'citeyear':   linkText = data.year; break;
				case 'citeurl':    linkText = data.title; break;
				default:           linkText = `[${data.author}, ${data.year}]`;
			}
			const idAttribute = isDuplicate ? "" : `id="${instanceId}"`;
			return `<a href="#bib-${key}" ${idAttribute} class="cite-stealth" title="${info}">${linkText}</a>`;
		});

		content = content.replace(/\\footcite\{(.+?)\}/g, (match, key) => {
			const fnId = window.footnoteCounter++;
			const instanceId = `ref-${key}-fn-${fnId}`;
			const data = trackCitation(key, instanceId, false);
			if (!data) return `<sup>[?${key}?]</sup>`;

			let year = data.year ? `, ${data.year}` : "";
			footnotesHTML += `<li id="fn-${fnId}">${data.author}, <a href="#bib-${key}">${data.title}</a>${year} <a href="#${instanceId}">↩</a></li>\n`;
			return `<sup class="footnote-ref"><a href="#fn-${fnId}" id="${instanceId}" title="${data.author}: ${data.title}">[${fnId}]</a></sup>`;
		});

		container.innerHTML = content;
	});

	if (footnotesHTML) {
		// --- Inject Footnotes container into #all if missing ---
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

	if (typeof source_bibliography === "function") source_bibliography();
}

function source_bibliography() {
	const mainContent = document.getElementById('contents');
	let sourcesDiv = document.getElementById('sources');

	// --- Inject Sources container into #all if missing ---
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
			const links = instances.map((id, index) => `<a href="#${id}" style="text-decoration:none; font-size:0.8em; margin:0 2px;">${index + 1}</a>`).join("");
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
}

/**
 * Checks the URL hash and scrolls to the target element once it is rendered in the DOM.
 * Includes a small delay to ensure dynamic content (like TeX or Markdown) has settled.
 */
function scrollToHash() {
	const hash = window.location.hash;
	if (!hash) return;

	// Remove the '#' to get the ID
	const targetId = hash.substring(1);

	// Set up an interval to wait for the element to appear in the DOM
	const checkExist = setInterval(() => {
		const element = document.getElementById(targetId);

		if (element) {
			clearInterval(checkExist);

			// Short delay ensures layout engines have finished positioning elements
			setTimeout(() => {
				element.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			}, 100);
		}
	}, 100);

	// Safety timeout: stop looking after 5 seconds if not found
	setTimeout(() => clearInterval(checkExist), 5000);
}

/**
 * Loads the glossary JSON and renders a table for indexed terms.
 * Similar to how renderSources() works in helper.js.
 */
/**
 * Loads the glossary JSON and appends a structured table to the #glossary div.
 * Similar to renderSources() in helper.js.
 */
async function renderGlossary() {
	let glossaryDiv = document.getElementById('glossary');

	// If the container doesn't exist, create it at the end of the #all container
	if (!glossaryDiv) {
		const allContainer = document.getElementById('contents');
		if (!allContainer) return;
		glossaryDiv = document.createElement('div');
		glossaryDiv.id = 'glossary';
		allContainer.appendChild(glossaryDiv);
	}

	try {
		const response = await fetch('glossary.json');
		const glossaryData = await response.json();

		// Use the global tracker from parseIndices()
		const usedTerms = window.indexedTerms || {};

		// Only include terms that were actually found via \index{}
		const entriesToShow = glossaryData.filter(item => 
			usedTerms[item.term.toLowerCase()]
		);

		if (entriesToShow.length === 0) {
			glossaryDiv.innerHTML = "";
			return;
		}

		let html = `<h1>Glossary</h1>`;
		html += `<table class="glossary-table" style="width:100%; border-collapse: collapse;">
		    <thead>
			<tr style="border-bottom: 2px solid #ccc; text-align: left;">
			    <th style="padding: 10px;">Term</th>
			    <th style="padding: 10px;">Definition</th>
			    <th style="padding: 10px;">Ref</th>
			</tr>
		    </thead>
		    <tbody>`;

		entriesToShow.forEach(item => {
			const key = item.term.toLowerCase();
			const refs = usedTerms[key].map((id, index) => 
				`<a href="#${id}" class="glossary-ref" style="text-decoration:none; margin:0 2px;">[${index + 1}]</a>`
			).join("");

			html += `
		<tr id="glossary-${key.replace(/\s+/g, '-')}" style="border-bottom: 1px solid #eee;">
		    <td style="padding: 10px; vertical-align: top;"><strong>${item.term}</strong></td>
		    <td class="md-glossary" style="padding: 10px; vertical-align: top;">${item.definition}</td>
		    <td style="padding: 10px; vertical-align: top; font-size: 0.8em;">${refs}</td>
		</tr>`;
		});

		html += `</tbody></table>`;
		glossaryDiv.innerHTML = html;

		// Ensure the definitions are parsed as Markdown (for LaTeX support)
		if (typeof marked !== "undefined") {
			glossaryDiv.querySelectorAll('.md-glossary').forEach(el => {
				el.innerHTML = marked.parse(el.innerHTML);
			});
		}

	} catch (error) {
		console.error("Error loading or rendering glossary:", error);
	}

	toc()
}

/**
 * Searches for \index{term} in .md tags.
 * Replaces with 'Term', adds an ID for anchoring, and stores the reference.
 */
async function parseIndices() {
    // We need the data first to check for existence
    let glossaryLookup = [];
    try {
        const response = await fetch('glossary.json');
        glossaryLookup = await response.json();
    } catch (e) {
        console.error("Could not load glossary for indexing check.");
        return;
    }

    const glossaryTerms = glossaryLookup.map(i => i.term.toLowerCase());

    document.querySelectorAll('.md').forEach(container => {
        // Regex to find \index{content}
        const regex = /\\index\{([^}]+)\}/g;

        container.innerHTML = container.innerHTML.replace(regex, (match, term) => {
            const lowerTerm = term.toLowerCase();

            // Check if term exists in glossary
            if (!glossaryTerms.includes(lowerTerm)) {
                console.error(`Glossary Error: Term "${term}" indexed but not found in glossary.json`);
                return term; // Return just the text without indexing logic
            }

            // Create a unique ID for this specific occurrence
            const occurrenceId = `idx-${lowerTerm.replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 4)}`;

            // Track the occurrence for the table references
            if (!window.indexedTerms[lowerTerm]) {
                window.indexedTerms[lowerTerm] = [];
            }
            window.indexedTerms[lowerTerm].push(occurrenceId);

            // Wrap in a span that is "invisible" to Markdown/Temml parsers
            // but provides the anchor for the glossary back-link
            return `<span id="${occurrenceId}">${term}</span>`;
        });
    });
}
