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
	document.querySelectorAll('.smart-quote').forEach(el => {
		const author = el.getAttribute('data-author') || 'Unbekannt';
		const source = el.getAttribute('data-source') || 'k.A.';
		const url = el.getAttribute('data-url');
		const text = el.innerText.trim().replace(/^"|"$/g, '');

		const exists = window.quotesLog.some(q => q.author === author && q.source === source);
		if (!exists) {
			window.quotesLog.push({
				author,
				source,
				url
			});
		}

		let htmlContent = `<p>»${text}«</p>`;

		if (author !== 'Unbekannt' || source !== 'k.A.') {
			let authorSpan = `<span class="quote-author">${author}</span>`;
			let sourceCite = source !== 'k.A.' ? `<cite class="quote-source">${source}</cite>` : '';

			if (url) {
				if (source !== 'k.A.') {
					sourceCite = `<a href="${url}" target="_blank" rel="noopener">${sourceCite}</a>`;
				} else {
					authorSpan = `<a href="${url}" target="_blank" rel="noopener">${authorSpan}</a>`;
				}
			}

			let signature = authorSpan;
			if (author !== 'Unbekannt' && source !== 'k.A.') signature += ', ';
			signature += sourceCite;

			htmlContent += `<footer>— ${signature}</footer>`;
		}

		const quoteBox = document.createElement('blockquote');
		quoteBox.className = el.className.replace('smart-quote', 'rendered-quote');
		quoteBox.innerHTML = htmlContent;
		el.replaceWith(quoteBox);
	});
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
			footnotesHTML += `<li id="fn-${id}">${data.author}, ${data.title}, ${data.year}<a href="#ref-fn-${id}" title="Jump back">↩</a></li>\n`;
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
		// Deutsche Zitation style construction (Harvard-like)
		// Format: Name, Firstname (Year): Title. Publisher.

		let string = `**${data.author}** (${data.year}): *${data.title}*.`;

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
