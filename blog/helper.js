window.usedCitations = []; // Tracks order of citation usage
window.footnoteCounter = 1;
window.quotesLog = [];
window.indexedTerms = {};

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

function bindIframeSafeLinks() {
	// We use delegation on the body/document so we don't have to re-bind constantly
	document.body.onclick = (e) => {
		const link = e.target.closest('.iframe-safe-link');
		if (!link) return;

		e.preventDefault();
		e.stopPropagation();

		const targetId = link.getAttribute('data-target');
		const targetEl = document.getElementById(targetId);

		if (targetEl) {
			// Log for debugging inside iframe
			console.log(`Scrolling to: ${targetId}`);

			// Method 1: Standard Scroll
			targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

			// Method 2: Fallback for restrictive iframes
			// window.scrollTo(0, targetEl.offsetTop);

			// Highlight effect to show it worked
			targetEl.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
			setTimeout(() => { targetEl.style.backgroundColor = 'transparent'; }, 2000);
		} else {
			console.warn(`Target element #${targetId} not found.`);
		}
	};
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
			if(page != "") page = `, p. ${page}`;
			if(after != "") after = `, ${after}`;
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
				const shortHtml = shortEl.innerHTML.trim().replace(/^["»]|["«]$/g, '');
				const fullHtml = fullEl.innerHTML.trim().replace(/^["»]|["«]$/g, '');
				p.setAttribute('data-state', 'short');
				p.innerHTML = `»${shortHtml}« <span class="quote-expand-hint">[click to show full]</span>`;
				p.onclick = () => {
					const isShort = p.getAttribute('data-state') === 'short';
					p.innerHTML = isShort ? `»${fullHtml}«` : `»${shortHtml}« <span class="quote-expand-hint">[click to show full]</span>`;
					p.setAttribute('data-state', isShort ? 'full' : 'short');
				};
			} else {
				p.innerHTML = `»${el.innerHTML.trim().replace(/^["»]|["«]$/g, '')}«`;
			}

			const footer = document.createElement('footer');
			const citeLink = document.createElement('a');
			// CHANGED: Iframe safe link for smartquote footer
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

	bindIframeSafeLinks(); // Initialize links for smartquotes
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

async function renderGlossary() {
	let container = document.getElementById('glossary-container');
	const mainContent = document.getElementById('contents');

	// Falls der Container nicht existiert, erstelle ihn und hänge ihn an #contents an
	if (!container && mainContent) {
		container = document.createElement('div');
		container.id = 'glossary-container';
		// Optional: Anker für das Inhaltsverzeichnis hinzufügen
		container.setAttribute('data-toc-title', 'Glossary');
		mainContent.appendChild(container);
	}

	if (!container) return;

	try {
		// 1. Glossar laden
		const response = await fetch('glossary.json');
		const glossary = await response.json();

		// 2. Globalen Tracker zurücksetzen
		window.indexedTerms = {};

		// 3. Text in den .md Containern scannen (Nur lesen!)
		const containers = document.querySelectorAll('.md');

		glossary.forEach(item => {
			const term = item.term;
			const normalizedTerm = term.toLowerCase().replace(/_/g, ' ');

			// Regex mit Word-Boundaries und Escaping für Sonderzeichen
			const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp(`\\b(${escapedTerm})\\b`, 'gi');

			containers.forEach(contentContainer => {
				const text = contentContainer.textContent;
				const matches = text.match(regex);

				if (matches) {
					if (!window.indexedTerms[normalizedTerm]) {
						window.indexedTerms[normalizedTerm] = 0;
					}
					window.indexedTerms[normalizedTerm] += matches.length;
				}
			});
		});

		// 4. Glossar alphabetisch sortieren
		glossary.sort((a, b) => a.term.localeCompare(b.term));

		// 5. HTML als Tabelle generieren
		let foundAny = false;
		let html = `
	    <h1 id="glossary-title">Glossary</h1>
	    <table class="glossary-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
		<thead>
		    <tr style="border-bottom: 2px solid #ccc;">
			<th style="text-align: left; padding: 10px;">Term</th>
			<th style="text-align: left; padding: 10px;">Definition</th>
			<th style="text-align: center; padding: 10px;">Occurrences</th>
		    </tr>
		</thead>
		<tbody>`;

		glossary.forEach(item => {
			const normalizedTerm = item.term.toLowerCase().replace(/_/g, ' ');
			const count = window.indexedTerms[normalizedTerm] || 0;

			if (count > 0) {
				foundAny = true;
				html += `
		    <tr style="border-bottom: 1px solid #eee;">
			<td style="padding: 10px; font-weight: bold; vertical-align: top;">${item.term}</td>
			<td style="padding: 10px; vertical-align: top;">${item.definition}</td>
			<td style="padding: 10px; text-align: center; vertical-align: top;">${count}</td>
		    </tr>`;
			}
		});

		html += '</tbody></table>';

		if (!foundAny) {
			container.style.display = 'none';
		} else {
			container.style.display = 'block';
			container.innerHTML = html;
		}

	} catch (error) {
		console.error("Fehler beim Laden/Rendern des Glossars:", error);
	}

	// 6. Inhaltsverzeichnis aktualisieren, nachdem das Glossar eingefügt wurde
	if (typeof toc === 'function') {
		toc();
	}
}

function addCopyButtons() {
	document.querySelectorAll('pre[class*="language-"]').forEach((pre) => {
		// Duplikat-Check: Wenn schon ein Button da ist, überspringen
		if (pre.parentNode.classList?.contains('code-copy-wrapper')) return;

		// Wrapper erstellen
		const wrapper = document.createElement('div');
		wrapper.classList.add('code-copy-wrapper');
		wrapper.style.cssText = 'position: relative;';
		pre.parentNode.insertBefore(wrapper, pre);
		wrapper.appendChild(pre);

		// Copy-Button
		const btn = document.createElement('button');
		btn.textContent = 'Copy';
		btn.className = 'code-copy-btn';
		btn.style.cssText = `
      position: absolute;
      top: 6px;
      right: 6px;
      background: #2d2d2d;
      color: #ccc;
      border: 1px solid #555;
      border-radius: 4px;
      padding: 4px 10px;
      cursor: pointer;
      font-size: 12px;
      z-index: 10;
      transition: background 0.2s, color 0.2s;
    `;

		// Button bleibt sichtbar beim Scrollen innerhalb des <pre>
		pre.addEventListener('scroll', () => {
			btn.style.top = (pre.scrollTop + 6) + 'px';
			btn.style.right = (-pre.scrollLeft + 6) + 'px';
		});

		btn.addEventListener('mouseenter', () => {
			btn.style.background = '#444';
			btn.style.color = '#fff';
		});
		btn.addEventListener('mouseleave', () => {
			btn.style.background = '#2d2d2d';
			btn.style.color = '#ccc';
		});

		// Klick: Code kopieren
		btn.addEventListener('click', () => {
			const code = pre.querySelector('code');
			const text = code ? code.innerText : pre.innerText;

			navigator.clipboard.writeText(text).then(() => {
				btn.textContent = '✓ Copied!';
				btn.style.color = '#6f6';
				setTimeout(() => {
					btn.textContent = 'Copy';
					btn.style.color = '#ccc';
				}, 2000);
			}).catch(() => {
				const ta = document.createElement('textarea');
				ta.value = text;
				document.body.appendChild(ta);
				ta.select();
				document.execCommand('copy');
				document.body.removeChild(ta);
				btn.textContent = '✓ Copied!';
				setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
			});
		});

		wrapper.appendChild(btn);
	});
}
