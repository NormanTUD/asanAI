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
	const containers = document.querySelectorAll('.md'); // Target your markdown containers
	const footnotesDiv = document.getElementById('footnotes');
	let footnotesHTML = "";

	// Helper to track citations
	const trackCitation = (key) => {
		if (!window.bibData[key]) {
			console.warn(`Citation key '${key}' not found in window.bibData`);
			return null;
		}
		// Add to used list if not already there (to preserve first-appearance order, or use Set)
		if (!window.usedCitations.includes(key)) {
			window.usedCitations.push(key);
		}
		return window.bibData[key];
	};

	containers.forEach(container => {
		let html = container.innerHTML;

		// 1. Handle \footnote{text}
		// Regex looks for \footnote{...} non-greedy
		html = html.replace(/\\footnote\{(.+?)\}/g, (match, text) => {
			const id = window.footnoteCounter++;
			// Create the list item for the bottom section
			footnotesHTML += `<li id="fn-${id}">${text} <a href="#ref-fn-${id}" title="Jump back">↩</a></li>\n`;
			// Return the superscript link
			return `<sup class="footnote-ref"><a href="#fn-${id}" id="ref-fn-${id}">[${id}]</a></sup>`;
		});

		html = html.replace(/\\footcite\{(.+?)\}/g, (match, key) => {
			const id = window.footnoteCounter++;
			// Create the list item for the bottom section
			const data = trackCitation(key);
			let year = "";
			if(data.year) {
				year = `, ${data.year}`;
			}

			footnotesHTML += `<li id="fn-${id}">${data.author}, ${data.title}${year}<a href="#ref-fn-${id}" title="Jump back">↩</a></li>\n`;
			// Return the superscript link
			return `<sup class="footnote-ref"><a href="#fn-${id}" id="ref-fn-${id}">[${id}]</a></sup>`;
		});

		html = html.replace(/\\cite\{(.+?)\}/g, (match, key) => {
			const data = trackCitation(key);
			return data ? `[${data.author}, ${data.title}, ${data.year}]` : `[?${key}?]`;
		});

		html = html.replace(/\\citeauthor\{(.+?)\}/g, (match, key) => {
			const data = trackCitation(key);
			return data ? data.author : `[?${key}?]`;
		});

		html = html.replace(/\\citeyear\{(.+?)\}/g, (match, key) => {
			const data = trackCitation(key);
			return data ? data.year : `[?${key}?]`;
		});

		html = html.replace(/\\citetitle\{(.+?)\}/g, (match, key) => {
			const data = trackCitation(key);
			return data ? data.title : `[?${key}?]`;
		});

		html = html.replace(/\\citeurl\{(.+?)\}/g, (match, key) => {
			const data = trackCitation(key);
			return data ? `<a target="_blank" href="data.url">${data.title}</a>` : `[?${key}?]`;
		});

		container.innerHTML = html;
	});

	// Populate Footnotes Div
	if (footnotesDiv && footnotesHTML) {
		footnotesDiv.innerHTML = `<ol>${footnotesHTML}</ol>`;
	}

	// Populate Sources Div
	source_bibliography();
}

function source_bibliography() {
	const sourcesDiv = document.getElementById('sources');
	if (!sourcesDiv || window.usedCitations.length === 0) return;

	let html = "";

	// Sort citations alphabetically by author for the bibliography
	const sortedKeys = [...window.usedCitations].sort((a, b) => {
		const authorA = window.bibData[a].author.toLowerCase();
		const authorB = window.bibData[b].author.toLowerCase();
		return authorA.localeCompare(authorB);
	});

	sortedKeys.forEach(key => {
		const data = window.bibData[key];
		let string = `**${data.author}**`;

		// Nur hinzufügen, wenn year vorhanden ist
		if (data.year) {
			string += ` (${data.year})`;
		}

		string += `: *${data.title}*.`;

		if (data.publisher) string += ` ${data.publisher}.`;
		if (data.city) string += ` ${data.city}.`;

		if (data.url) {
			string += ` [Link](${data.url})`;
		}

		html += `* ${string}\n`; // Markdown list format
	});

	// We inject Markdown here, renderMarkdown() will parse it later in the main flow
	sourcesDiv.innerHTML = `<div class="md">${html}</div>`; 
	renderMarkdown();
}
