window.usedCitations = []; // Tracks order of citation usage
window.footnoteCounter = 1;

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

	toc();
}

function revealContent() {
	try {
		if (typeof toc === "function") {
			toc();
		}
	} catch (e) {
		console.error("TOC generation failed, but showing page anyway:", e);
	} finally {
		const loader = document.getElementById('loader');
		const content = document.getElementById('all');

		if (loader) loader.style.display = 'none';
		if (content) content.style.display = 'block';
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

window.quotesLog = [];

function smartquote() {
	const footnotesDiv = document.getElementById('footnotes');
	if (footnotesDiv && !footnotesDiv.querySelector('ol')) {
		footnotesDiv.innerHTML = '<ol></ol>';
	}
	const footnoteList = footnotesDiv ? footnotesDiv.querySelector('ol') : null;

	document.querySelectorAll('.smart-quote').forEach(el => {
		// 1. Identification & Legacy Warning
		const citeKey = el.getAttribute('data-cite');
		const legacyAuthor = el.getAttribute('data-author');
		
		if (legacyAuthor) {
			console.error(`Deprecated: Legacy smart-quote detected (Author: "${legacyAuthor}"). Please switch to data-cite="${citeKey || 'key'}".`);
		}

		// 2. Data Retrieval (from literature.js or fallback)
		let author = legacyAuthor || 'Unknown';
		let source = el.getAttribute('data-source') || 'k.A.';
		let title = "";
		let url = el.getAttribute('data-url');

		if (citeKey && window.bibData && window.bibData[citeKey]) {
			const bib = window.bibData[citeKey];
			author = bib.author || author;
			source = bib.title || source;
			title = bib.title || "";
			url = bib.url || url;
			
			// Track for bibliography if needed
			if (typeof window.usedCitations !== 'undefined' && !window.usedCitations.includes(citeKey)) {
				window.usedCitations.push(citeKey);
			}
		}

		const text = el.innerText.trim().replace(/^"|"$/g, '');
		const fnId = window.footnoteCounter++;

		let author_and_publication_name = author;

		if(title != "") {
			author_and_publication_name = `${author_and_publication_name} (${title})`;
		}

		// 3. Create Quote HTML (»quote« — author[1])
		const htmlContent = `
			<p>»${text}«</p>
			<footer>— ${author_and_publication_name}<sup class="footnote-ref"><a href="#fn-${fnId}" id="ref-fn-${fnId}">[${fnId}]</a></sup></footer>
		`;

		// 4. Create Footnote Entry
		if (footnoteList) {
			let citationText = `**${author}**`;
			if (source !== 'k.A.') citationText += `: *${source}*`;
			if (url) citationText += ` [Link](${url})`;

			const li = document.createElement('li');
			li.id = `fn-${fnId}`;
			li.innerHTML = `<span class="md">${citationText}</span> <a href="#ref-fn-${fnId}" title="Jump back">↩</a>`;
			footnoteList.appendChild(li);
		}

		// 5. DOM Replacement
		const quoteBox = document.createElement('blockquote');
		quoteBox.className = el.className.replace('smart-quote', 'rendered-quote');
		quoteBox.innerHTML = htmlContent;
		el.replaceWith(quoteBox);
	});

	if (typeof renderMarkdown === "function") renderMarkdown();
}

function makebibliography() {
	// Legacy function for smartquotes, distinct from the new Bibtex system
	const bibDiv = document.querySelector('#bibliography');
	if (!bibDiv) return;

	window.quotesLog.sort((a, b) => a.author.localeCompare(b.author));

	let md = "| Author | Source |\n";
	md += "| :--- | :--- |\n";

	window.quotesLog.forEach(q => {
		const sourceDisplay = q.url ? `[${q.source}](${q.url})` : q.source;
		md += "| " + q.author + " | " + sourceDisplay + " |\n";
	});

	bibDiv.innerHTML = md;
	// Note: renderMarkdown() usually handles the parsing, but if called dynamically:
	bibDiv.innerHTML = marked.parse(md);
}

// --- NEW FUNCTIONS ---

function bibtexify() {
	const containers = document.querySelectorAll('.md');
	const footnotesDiv = document.getElementById('footnotes');
	let footnotesHTML = "";

	window.usedCitations = [];
	window.citationMap = {}; 
	window.footnoteCounter = 1;

	const trackCitation = (key, instanceId) => {
		if (!window.bibData || !window.bibData[key]) return null;
		if (!window.usedCitations.includes(key)) window.usedCitations.push(key);
		if (!window.citationMap[key]) window.citationMap[key] = [];
		window.citationMap[key].push(instanceId);
		return window.bibData[key];
	};

	containers.forEach(container => {
		let content = container.innerHTML;

		// Erfasst \cite, \citeauthor, \citetitle, \citeyear
		content = content.replace(/\\(cite|citeauthor|citetitle|citeyear|citeurl)\{(.+?)\}/g, (match, type, key) => {
			const instanceId = `ref-${key}-${Math.random().toString(36).substr(2, 5)}`;
			const data = trackCitation(key, instanceId);
			if (!data) return `[?${key}?]`;

			// Erstelle einen kompakten Info-String für das Mouseover
			const info = `${data.author}: ${data.title}${data.year ? ' ('+data.year+')' : ''}`;

			let linkText = "";
			switch(type) {
				case 'citeauthor': linkText = data.author; break;
				case 'citetitle':  linkText = data.title; break;
				case 'citeyear':   linkText = data.year; break;
				case 'citeurl':    linkText = data.title; break;
				default:           linkText = `[${data.author}, ${data.year}]`;
			}

			// 'cite-stealth' Klasse für das Styling; 'title' für das Mouseover
			return `<a href="#bib-${key}" id="${instanceId}" class="cite-stealth" title="${info}">${linkText}</a>`;
		});

		// Fußnoten bleiben meist klassisch, aber wir geben ihnen auch das Mouseover
		content = content.replace(/\\footcite\{(.+?)\}/g, (match, key) => {
			const fnId = window.footnoteCounter++;
			const instanceId = `ref-${key}-fn-${fnId}`;
			const data = trackCitation(key, instanceId);
			if (!data) return `<sup>[?${key}?]</sup>`;

			const info = `${data.author}: ${data.title}`;
			let year = data.year ? `, ${data.year}` : "";

			footnotesHTML += `<li id="fn-${fnId}">${data.author}, <a href="#bib-${key}">${data.title}</a>${year} <a href="#${instanceId}">↩</a></li>\n`;

			return `<sup class="footnote-ref"><a href="#fn-${fnId}" id="${instanceId}" title="${info}">[${fnId}]</a></sup>`;
		});

		container.innerHTML = content;
	});

	if (footnotesDiv && footnotesHTML) {
		footnotesDiv.innerHTML = `<ol>${footnotesHTML}</ol>`;
	}

	source_bibliography();
}

function source_bibliography() {
    const sourcesDiv = document.getElementById('sources');
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
        
        // Erzeuge Rücklinks: ^ 1 2 3
        let backLinks = "";
        if (instances.length > 0) {
            const links = instances.map((id, index) => `<a href="#${id}" style="text-decoration:none; font-size:0.8em; margin:0 2px;">${index + 1}</a>`).join("");
            backLinks = `<span style="color:#888;">^ ${links}</span> `;
        }

        let entryText = `${backLinks} **${data.author}**`;
        if (data.year) entryText += ` (${data.year})`;
        entryText += `: *${data.title}*.`;
        if (data.url) entryText += ` [Link](${data.url})`;

        // Das umschließende Div erhält die ID für den Sprung aus dem Text
        html += `<div id="bib-${key}" class="bib-entry" style="margin-bottom:10px;">${entryText}</div>\n`;
    });

    sourcesDiv.innerHTML = html; 
    
    // Da wir jetzt HTML mit Markdown-Inhalten (wie **bold**) mischen, 
    // rufen wir renderMarkdown nur für die Stellen auf, die es brauchen.
    if (typeof renderMarkdown === "function") {
        // Falls nötig, hier nochmals parsen:
        sourcesDiv.querySelectorAll('.bib-entry').forEach(el => {
             // Nur parsen, wenn Marked verfügbar ist
             if (window.marked) el.innerHTML = marked.parse(el.innerHTML);
        });
    }
}
