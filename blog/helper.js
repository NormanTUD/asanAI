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
	// 1. Safety initialization
	if (!window.usedCitations) window.usedCitations = [];
	if (!window.citationMap) window.citationMap = {};

	document.querySelectorAll('.smart-quote').forEach(el => {
		const citeKey = el.getAttribute('data-cite');
		const legacyAuthor = el.getAttribute('data-author');
		
		let author = legacyAuthor || 'Unknown';
		let title = "";
		let year = "";
		let url = el.getAttribute('data-url');

		if (citeKey && window.bibData && window.bibData[citeKey]) {
			const bib = window.bibData[citeKey];
			author = bib.author || author;
			title = bib.title || "";
			year = bib.year || "";
			url = bib.url || url;
			
			// 2. Track Citation (Matches your bibtexify logic exactly)
			const instanceId = `ref-${citeKey}-${Math.random().toString(36).substr(2, 5)}`;
			
			if (!window.usedCitations.includes(citeKey)) {
				window.usedCitations.push(citeKey);
			}
			
			if (!window.citationMap[citeKey]) {
				window.citationMap[citeKey] = [];
			}
			window.citationMap[citeKey].push(instanceId);

			const text = el.innerText.trim().replace(/^"|"$/g, '');
			const info = `${author}: ${title}${year ? ' ('+year+')' : ''}`;
			const author_display = title !== "" ? `${author} (${title})` : author;

			// 3. Create HTML
			const htmlContent = `
				<p>»${text}«</p>
				<footer>— <a href="#bib-${citeKey}" id="${instanceId}" class="cite-stealth" title="${info}">${author_display}</a></footer>
			`;

			const quoteBox = document.createElement('blockquote');
			quoteBox.className = el.className.replace('smart-quote', 'rendered-quote');
			quoteBox.innerHTML = htmlContent;
			el.replaceWith(quoteBox);
		}
	});

	// 4. Update the "Sources" section to include these new citations
	if (typeof source_bibliography === "function") {
		source_bibliography();
	}
}

// --- NEW FUNCTIONS ---

function bibtexify() {
	const containers = document.querySelectorAll('.md');
	const mainContent = document.getElementById('contents'); // Target the content div
	let footnotesDiv = document.getElementById('footnotes');
	let footnotesHTML = "";

	// --- Inject Footnotes container into #all if missing ---
	if (!footnotesDiv && mainContent) {
		const footerSection = document.createElement('section');
		footerSection.id = 'footnotes-section';
		footerSection.innerHTML = `<h1>Footnotes</h1><div id="footnotes"></div>`;
		mainContent.appendChild(footerSection); 
		footnotesDiv = document.getElementById('footnotes');
	}

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

		content = content.replace(/\\(cite|citeauthor|citetitle|citeyear|citeurl)\{(.+?)\}/g, (match, type, key) => {
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

	if (footnotesDiv && footnotesHTML) {
		footnotesDiv.innerHTML = `<ol>${footnotesHTML}</ol>`;
		document.getElementById('footnotes-section').style.display = 'block';
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
