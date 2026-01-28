function log(id, msg) {
	const con = document.getElementById(id + '-console');
	if(!con) {
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

	toc();
}

function revealContent() {
	try {
		// Run TOC if it exists
		if (typeof toc === "function") {
			toc();
		}
	} catch (e) {
		console.error("TOC generation failed, but showing page anyway:", e);
	} finally {
		// ALWAYS hide loader and show content, even if scripts above error out
		const loader = document.getElementById('loader');
		const content = document.getElementById('all');

		if (loader) loader.style.display = 'none';
		if (content) content.style.display = 'block';
	}
}

function make_external_a_href_target_blank () {
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

		// Ins Log speichern
		const exists = window.quotesLog.some(q => q.author === author && q.source === source);
		if (!exists) {
			window.quotesLog.push({ author, source, url });
		}

		// Zitat-Text
		let htmlContent = `<p>»${text}«</p>`;

		if (author !== 'Unbekannt' || source !== 'k.A.') {
			let authorSpan = `<span class="quote-author">${author}</span>`;
			let sourceCite = source !== 'k.A.' ? `<cite class="quote-source">${source}</cite>` : '';

			// Wenn URL da, Quelle (oder Autor) verlinken
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
	const bibDiv = document.querySelector('#bibliography');
	if (!bibDiv) return;

	// Sortieren nach Autor
	window.quotesLog.sort((a, b) => a.author.localeCompare(b.author));

	let md = "| Author | Source |\n";
	md += "| :--- | :--- |\n";

	window.quotesLog.forEach(q => {
		const sourceDisplay = q.url ? `[${q.source}](${q.url})` : q.source;
		md += "| " + q.author + " | " + sourceDisplay + " |\n";
	});

	bibDiv.innerHTML = md;

	renderMarkdown();
}
