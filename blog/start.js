const rootMargin = "800px";
const subUnits = [
	// --- Deutsch (Häufige Endungen & Wortbestandteile) ---
	"ung", "heit", "keit", "schaft", "chen", "lein", "isch", "erl", "end", "est",
	"erei", "ler", "ner", "rich", "aus", "bau", "hof", "berg", "dorf", "stadt",
	"land", "fluss", "weg", "platz", "mann", "frau", "kind", "zeit", "tag", "jahr",
	"lich", "haft", "sam", "bar", "los", "voll", "reich", "arm", "wert", "würdig",
	"ieren", "elte", "erte", "igt", "icht", "ern", "eln", "st", "t", "en",

	// --- Englisch (Common Suffixes & Word Ends) ---
	"tion", "ing", "ly", "ment", "ness", "able", "ible", "al", "ial", "er",
	"or", "ist", "ism", "ship", "ance", "ence", "ity", "ty", "ive", "ous",
	"ful", "less", "ish", "ic", "ical", "ify", "ize", "ise", "en", "ed",
	"ward", "wise", "ways", "hood", "dom", "some", "th", "fold", "teen", "ty",
	"age", "ery", "ory", "ury", "ure", "ate", "ute", "ite", "ade", "ide",

	// --- Französisch (Suffixes et Terminaisons) ---
	"tion", "sion", "ment", "age", "ence", "ance", "esse", "eur", "euse", "iste",
	"isme", "té", "itée", "ière", "ier", "aire", "oire", "ure", "ude", "ade",
	"able", "ible", "uble", "ique", "iste", "esque", "âtre", "ard", "asse", "et",
	"ette", "ot", "otte", "on", "onne", "ais", "ait", "aient", "iez", "ons",
	"erie", "ie", "ail", "aille", "ille", "illeur", "ance", "ence", "onne", "ième",

	// --- Übergreifende / Lateinische & Griechische Wurzeln ---
	"logie", "graph", "gramm", "phon", "scope", "meter", "sphere", "path", "phil", "phob",
	"cracy", "arch", "onym", "the", "bio", "geo", "astro", "auto", "poly", "mono",
	"multi", "inter", "intra", "trans", "sub", "super", "pre", "post", "anti", "pro",
	"ex", "in", "re", "de", "dis", "un", "mis", "over", "under", "non",

	// --- Top 200 Ergänzungen (Häufige Wortausgänge) ---
	"land", "water", "world", "light", "night", "power", "work", "life", "form", "part",
	"point", "line", "side", "head", "back", "hand", "field", "room", "house", "book",
	"word", "name", "sound", "place", "thing", "case", "system", "group", "area", "state",
	"story", "study", "fact", "idea", "home", "way", "week", "month", "night", "day",
	"man", "woman", "child", "people", "school", "king", "queen", "law", "war", "peace"
];

const isIndexPage = window.location.pathname.endsWith('index.php') || window.location.pathname === '/';

const _loaderSections = [];
let _loaderChecklistBuilt = false;

function registerLoaderSections(names) {
	const container = document.getElementById('loader-checklist');
	if (!container) return;

	names.forEach((name, i) => {
		const id = `loader-section-${i}`;
		_loaderSections.push({ id, name, status: 'pending' });

		const row = document.createElement('div');
		row.id = id;
		row.className = 'loader-section-row pending';
		row.innerHTML = `<span class="loader-icon">○</span> <span class="loader-label">${name}</span>`;
		container.appendChild(row);
	});

	_loaderChecklistBuilt = true;
}

function markLoaderSection(index, status) {
	if (!_loaderChecklistBuilt) return;
	const s = _loaderSections[index];
	if (!s) return;

	const row = document.getElementById(s.id);
	if (!row) return;

	s.status = status;
	row.className = `loader-section-row ${status}`;

	const icon = row.querySelector('.loader-icon');
	if (status === 'loading') {
		icon.textContent = '⟳';
	} else if (status === 'done') {
		icon.textContent = '✓';
	}

	// Update the top status text with the current state
	const loadingCount = _loaderSections.filter(s => s.status === 'loading').length;
	const doneCount = _loaderSections.filter(s => s.status === 'done').length;
	const total = _loaderSections.length;

	const statusText = document.getElementById('loader-status');
	if (statusText) {
		if (doneCount === total) {
			statusText.textContent = 'Finalizing...';
		} else {
			statusText.textContent = `Loading sections... (${doneCount}/${total})`;
		}
	}
}

function updateLoadingStatus(message) {
	console.info(message);
	const statusText = document.getElementById('loader-status');
	if (statusText && !_loaderChecklistBuilt) {
		statusText.textContent = message;
	}
}

function finalizeLoaderChecklist() {
	_loaderSections.forEach((s, i) => {
		if (s.status !== 'done') {
			markLoaderSection(i, 'done');
		}
	});
}


function observeAndRenderMath(targetNode = document.body) {
	if (!targetNode) {
		console.warn("MutationObserver: Ziel-Element nicht gefunden.");
		return;
	}

	const config = { childList: true, subtree: true, characterData: true };

	const callback = function(mutationsList) {
		for (const mutation of mutationsList) {
			if (mutation.type === 'characterData' || mutation.type === 'childList') {
				const parent = mutation.target.parentElement;
				if (parent && parent.hasAttribute('data-math-rendered')) {
					parent.removeAttribute('data-math-rendered');
				}
			}
		}
		render_temml();
	};

	const observer = new MutationObserver(callback);
	observer.observe(targetNode, config);
}

// ── Place once, near your other observers ──
const _temmlOpts = {
	delimiters: [
		{ left: "$$", right: "$$", display: true },
		{ left: "$",  right: "$",  display: false }
	]
};

const _temmlObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			const el = entry.target;
			// Guard: skip if already rendered, detached from DOM, or no math left
			if (el.isConnected &&
				!el.hasAttribute('data-math-rendered') &&
				el.textContent.includes('$')) {
				temml.renderMathInElement(el, _temmlOpts);
				el.setAttribute('data-math-rendered', 'true');
			}
			_temmlObserver.unobserve(el);
		}
	});
}, {
	threshold: 0,
	rootMargin: rootMargin
});

function render_temml() {
	const elements = document.querySelectorAll(
		'p:not([data-math-rendered]), span:not([data-math-rendered]), div:not([data-math-rendered]), li:not([data-math-rendered])'
	);

	elements.forEach(el => {
		if (!el.textContent.includes('$')) return;

		const rect = el.getBoundingClientRect();

		// ① FIX: Elements inside hidden tabs (display:none) have zero
		//    dimensions. IntersectionObserver will NEVER fire for them.
		//    Render immediately so they're ready when the tab is shown.
		if (rect.width === 0 && rect.height === 0) {
			temml.renderMathInElement(el, _temmlOpts);
			el.setAttribute('data-math-rendered', 'true');
			return;
		}

		// ② Elements in/near the viewport → render immediately
		if (rect.bottom > -300 && rect.top < window.innerHeight + 300) {
			temml.renderMathInElement(el, _temmlOpts);
			el.setAttribute('data-math-rendered', 'true');
		} else {
			// ③ Far off-screen → defer until scrolled into view
			_temmlObserver.observe(el);
		}
	});
}

// ─── Shared post-load initialization ───
// Called by both index.php and standalone subpages to avoid duplication.
function postLoadInit() {
	smartquote();
	initOptionalBlocks();
	toc();
	addReadingProgress();
	addCuriosityScore();
	addKonamiEgg();
	addConsoleEasterEggs();
}

document.addEventListener("DOMContentLoaded", function() {
	render_temml();
	observeAndRenderMath(document.body);

	const observer = new MutationObserver(function(mutations) {
		let needsRender = false;
		mutations.forEach(mutation => {
			if (mutation.addedNodes.length > 0) needsRender = true;
		});

		if (needsRender) {
			render_temml();
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
});

function sendHeight() {
	var body = document.body,
		html = document.documentElement;

	var height = Math.max(
		body.scrollHeight, 
		body.offsetHeight, 
		html.clientHeight, 
		html.scrollHeight, 
		html.offsetHeight
	);

	if (window.parent && window.parent !== window) {
		window.parent.postMessage({
			type: 'height',
			val: height
		}, '*');
	}
}
