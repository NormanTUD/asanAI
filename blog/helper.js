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

function smartquote() {
	document.querySelectorAll('.smart-quote').forEach(el => {
		const author = el.getAttribute('data-author');
		const source = el.getAttribute('data-source');
		const text = el.innerText.trim();

		// Zitat-Text mit französischen Anführungszeichen
		let htmlContent = `<p>»${text}«</p>`;

		// Signatur (Footer) bauen
		if (author || source) {
			let signature = author ? `<span class="quote-author">${author}</span>` : '';

			if (author && source) signature += ', '; // Komma nur wenn beides da

			if (source) {
				signature += `<cite class="quote-source">${source}</cite>`;
			}

			htmlContent += `<footer>— ${signature}</footer>`;
		}

		const quoteBox = document.createElement('blockquote');
		quoteBox.innerHTML = htmlContent;
		el.replaceWith(quoteBox);
	});
}
