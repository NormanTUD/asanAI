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
	if(names.length < 2) {
		return;
	}
	const container = document.getElementById('loader-checklist');
	if (!container) return;

	// Clear any existing content first
	container.innerHTML = '';

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

	// Update status to reflect we're about to start
	const statusText = document.getElementById('loader-status');
	if (statusText) {
		statusText.textContent = `Loading sections... (0/${names.length})`;
	}
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
	if (!statusText) return;

	if (!_loaderChecklistBuilt) {
		// Before checklist exists, use the main status line
		statusText.textContent = message;
	} else {
		// After checklist exists, show as a secondary detail line
		let subStatus = document.getElementById('loader-substatus');
		if (!subStatus) {
			subStatus = document.createElement('p');
			subStatus.id = 'loader-substatus';
			subStatus.style.cssText = 'color: #94a3b8; font-size: 11px; margin-top: 2px; font-style: italic; transition: opacity 0.2s ease;';
			statusText.parentNode.insertBefore(subStatus, statusText.nextSibling);
		}
		subStatus.textContent = message;
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

const _temmlOpts = {
	delimiters: [
		{ left: "$$", right: "$$", display: true },
		{ left: "$",  right: "$",  display: false }
	],
	annotate: true
};

function _fixMathInElement(el) {
    // ===== ANTI-FLICKER: Bereits verarbeitete Elemente überspringen =====
    if (el.hasAttribute('data-math-rendered')) return false;
    if (el.querySelector('math')) return false; // Enthält bereits gerendertes MathML

    let html = el.innerHTML;
    if (!html.includes('$')) return false;

    let changed = false;

    // Block math: $$ ... $$ (mit kaputtem HTML drin)
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
        changed = true;
        const clean = inner
            .replace(/<\/?em>/gi, '_')
            .replace(/<\/?strong>/gi, '__')
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<\/?p>/gi, '')
            .replace(/<\/?[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&nbsp;/g, ' ')
            .trim();
        try {
            return temml.renderToString(clean, { displayMode: true });
        } catch (e) {
            console.error('Temml block error:', clean, e);
            return match;
        }
    });

    // Inline math: $ ... $
    html = html.replace(/(?<!\$)\$(?!\$)([\s\S]*?)(?<!\$)\$(?!\$)/g, (match, inner) => {
        if (inner.includes('<math') || inner.includes('</math>')) return match;
        if (!inner.trim()) return match;

        changed = true;
        const clean = inner
            .replace(/<\/?em>/gi, '_')
            .replace(/<\/?strong>/gi, '__')
            .replace(/<\/?[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&nbsp;/g, ' ')
            .trim();
        try {
            return temml.renderToString(clean, { displayMode: false });
        } catch (e) {
            console.error('Temml inline error:', clean, e);
            return match;
        }
    });

    if (changed) {
        el.innerHTML = html;
        el.setAttribute('data-math-rendered', 'true');
    }
    return changed;
}

const _temmlObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            if (el.isConnected &&
                !el.hasAttribute('data-math-rendered') &&
                el.textContent.includes('$')) {
                // Versuche zuerst unseren Fix
                const fixed = _fixMathInElement(el);
                // Falls unser Fix nichts gefunden hat, Temml normal laufen lassen
                if (!fixed) {
                    temml.renderMathInElement(el, _temmlOpts);
                    el.setAttribute('data-math-rendered', 'true');
                }
            }
            _temmlObserver.unobserve(el);
        }
    });
}, {
    threshold: 0,
    rootMargin: rootMargin
});

function render_temml() {

	/* ═══════════════════════════════════════════════════════════════
	   ONE-TIME POPUP BOOTSTRAP
	   ═══════════════════════════════════════════════════════════ */
	if (!render_temml._popupReady) {
		render_temml._popupReady   = true;
		render_temml._overlay      = null;
		render_temml._mathEl       = null;
		render_temml._currentLatex = null;
		render_temml._containerEl  = null;
		render_temml._mathIndex    = -1;

		const s = document.createElement('style');
		s.id = 'temml-popup-css';
		s.textContent = `
			.lp-overlay{
				position:fixed;inset:0;
				background:rgba(0,0,0,.18);backdrop-filter:blur(4px);
				z-index:100000;display:flex;align-items:center;justify-content:center;
				animation:lpFadeIn .18s ease-out}
			@keyframes lpFadeIn{from{opacity:0}to{opacity:1}}
			@keyframes lpSlideUp{from{opacity:0;transform:translateY(12px) scale(.97)}
				to{opacity:1;transform:translateY(0) scale(1)}}

			.lp-box{
				background:#ffffff;
				border:1px solid rgba(0,0,0,.1);border-radius:14px;
				width:min(560px,90vw);max-height:80vh;overflow:hidden;
				box-shadow:0 8px 40px rgba(0,0,0,.12),
				           0 0 0 1px rgba(0,0,0,.04);
				animation:lpSlideUp .22s ease-out;
				font-family:'Inter','Segoe UI',system-ui,sans-serif}

			.lp-header{
				display:flex;align-items:center;justify-content:space-between;
				padding:14px 20px;
				border-bottom:1px solid #e5e7eb;
				background:#fafbfc}
			.lp-header h3{
				margin:0;font-size:14px;font-weight:600;color:#1f2937;
				display:flex;align-items:center;gap:8px}
			.lp-header h3::before{
				content:'∑';font-size:18px;
				background:linear-gradient(135deg,#4f46e5,#7c3aed);
				-webkit-background-clip:text;-webkit-text-fill-color:transparent}

			.lp-close{
				background:#f3f4f6;border:1px solid #e5e7eb;
				color:#6b7280;font-size:18px;width:32px;height:32px;
				border-radius:8px;cursor:pointer;
				display:flex;align-items:center;justify-content:center;
				transition:all .15s ease}
			.lp-close:hover{
				background:#fee2e2;border-color:#fca5a5;color:#dc2626}

			.lp-body{padding:20px}

			.lp-preview{
				background:#f8f9fb;
				border:1px solid #e5e7eb;
				border-radius:10px;padding:16px;margin-bottom:16px;
				text-align:center;overflow-x:auto;color:#1f2937;font-size:1.3em;
				pointer-events:none;
				transition:opacity .2s ease}

			.lp-code-wrap{
				position:relative;background:#f9fafb;
				border:1px solid #e5e7eb;border-radius:10px;overflow:hidden}
			.lp-code-bar{
				display:flex;align-items:center;justify-content:space-between;
				padding:8px 14px;
				background:#f3f4f6;
				border-bottom:1px solid #e5e7eb}
			.lp-code-bar span{
				font-size:11px;color:#9ca3af;text-transform:uppercase;
				letter-spacing:.5px;font-weight:600}

			.lp-copy{
				background:linear-gradient(135deg,#4f46e5,#7c3aed);
				color:#fff;border:none;padding:5px 14px;border-radius:6px;
				font-size:12px;font-weight:600;cursor:pointer;transition:all .2s ease}
			.lp-copy:hover{transform:translateY(-1px);
				box-shadow:0 4px 12px rgba(79,70,229,.3)}
			.lp-copy.copied{
				background:linear-gradient(135deg,#059669,#10b981)}

			.lp-code{
				padding:14px 16px;margin:0;
				font-family:'JetBrains Mono','Fira Code','Cascadia Code',monospace;
				font-size:13.5px;line-height:1.6;color:#1e293b;
				white-space:pre-wrap;word-break:break-all;
				overflow-y:auto;max-height:35vh;tab-size:2;
				user-select:all;
				transition:opacity .2s ease}

			.lp-footer{
				padding:12px 20px;
				border-top:1px solid #e5e7eb;text-align:center}
			.lp-footer span{font-size:11px;color:#9ca3af}
			.lp-footer kbd{
				background:#f3f4f6;
				border:1px solid #e5e7eb;
				border-radius:4px;padding:1px 5px;font-size:10px;color:#6b7280}

			/* ── Animated swap (user switches to a different equation) ── */
			.lp-swap .lp-preview,
			.lp-swap .lp-code{opacity:.15}

			/* ── Subtle pulse for live updates (same equation changed) ── */
			@keyframes lpPulse{
				0%{box-shadow:inset 0 0 0 2px rgba(79,70,229,.2)}
				100%{box-shadow:inset 0 0 0 2px transparent}}
			.lp-live-pulse .lp-code-wrap{animation:lpPulse .5s ease-out}
			.lp-live-pulse .lp-preview{animation:lpPulse .5s ease-out}

			.lp-badge{
				display:inline-block;font-size:10px;font-weight:600;
				padding:2px 7px;border-radius:4px;margin-left:8px;
				vertical-align:middle}
			.lp-badge-display{background:#ede9fe;color:#6d28d9}
			.lp-badge-inline{background:#e0f2fe;color:#0369a1}
		`;
		document.head.appendChild(s);

		/* ── Helpers ── */
		function _close() {
			if (!render_temml._overlay) return;
			render_temml._overlay.remove();
			render_temml._overlay      = null;
			render_temml._mathEl       = null;
			render_temml._currentLatex = null;
			render_temml._containerEl  = null;
			render_temml._mathIndex    = -1;
		}

		function _extractLatex(mathEl) {
			const ann = mathEl.querySelector('annotation[encoding="application/x-tex"]');
			if (ann) return ann.textContent.trim();
			if (mathEl.dataset && mathEl.dataset.tex) return mathEl.dataset.tex.trim();
			const wrapper = mathEl.closest('.temml');
			if (wrapper && wrapper.dataset.tex) return wrapper.dataset.tex.trim();
			return null;
		}

		function _findContainer(mathEl) {
			let el = mathEl.parentElement;
			while (el && el !== document.body) {
				if (el.hasAttribute('data-math-rendered')) return el;
				el = el.parentElement;
			}
			return null;
		}

		function _getMathIndex(container, mathEl) {
			const all = container.querySelectorAll('math');
			for (let i = 0; i < all.length; i++) {
				if (all[i] === mathEl) return i;
			}
			return -1;
		}

		function _setBadge(overlay, isDisplay) {
			const oldBadge = overlay.querySelector('.lp-badge');
			if (oldBadge) oldBadge.remove();
			const badge = document.createElement('span');
			badge.className = isDisplay
				? 'lp-badge lp-badge-display'
				: 'lp-badge lp-badge-inline';
			badge.textContent = isDisplay ? 'display' : 'inline';
			overlay.querySelector('.lp-header h3').appendChild(badge);
		}

		function _resetCopyBtn(overlay) {
			const btn = overlay.querySelector('.lp-copy');
			btn.textContent = 'Copy';
			btn.classList.remove('copied');
		}

		function _wireClose(overlay) {
			overlay.querySelector('.lp-close').addEventListener('click', _close);
			overlay.addEventListener('click', e => { if (e.target === overlay) _close(); });
		}

		function _wireCopy(overlay) {
			const btn = overlay.querySelector('.lp-copy');
			let timeout;
			btn.addEventListener('click', () => {
				const text = overlay.querySelector('.lp-code').textContent;
				navigator.clipboard.writeText(text).then(() => {
					btn.textContent = '✓ Copied!';
					btn.classList.add('copied');
					clearTimeout(timeout);
					timeout = setTimeout(() => {
						btn.textContent = 'Copy';
						btn.classList.remove('copied');
					}, 2000);
				});
			});
		}

		/* ── Content update — two modes ── */

		// Animated swap: fades out old → swaps → fades in new
		// Used when user right-clicks a DIFFERENT equation
		function _animatedSwap(overlay, latex, isDisplay, mathEl) {
			render_temml._mathEl       = mathEl;
			render_temml._currentLatex = latex;

			const box = overlay.querySelector('.lp-box');
			box.classList.add('lp-swap');

			setTimeout(() => {
				overlay.querySelector('.lp-preview').innerHTML = '';
				overlay.querySelector('.lp-preview').appendChild(mathEl.cloneNode(true));
				overlay.querySelector('.lp-code').textContent = latex;
				_setBadge(overlay, isDisplay);
				_resetCopyBtn(overlay);

				requestAnimationFrame(() => box.classList.remove('lp-swap'));
			}, 180); // matches the CSS transition duration
		}

		// Instant swap + subtle pulse: no opacity change, just swaps content
		// Used when the SAME equation re-renders (live update)
		function _liveSwap(overlay, latex, isDisplay, mathEl) {
			render_temml._mathEl       = mathEl;
			render_temml._currentLatex = latex;

			// Swap content instantly — no flicker
			overlay.querySelector('.lp-preview').innerHTML = '';
			overlay.querySelector('.lp-preview').appendChild(mathEl.cloneNode(true));
			overlay.querySelector('.lp-code').textContent = latex;
			_setBadge(overlay, isDisplay);

			// Gentle inset glow to signal the update
			const box = overlay.querySelector('.lp-box');
			box.classList.remove('lp-live-pulse');
			// Force reflow so animation restarts if triggered rapidly
			void box.offsetWidth;
			box.classList.add('lp-live-pulse');

			// Clean up class after animation ends
			const onEnd = () => { box.classList.remove('lp-live-pulse'); box.removeEventListener('animationend', onEnd); };
			box.addEventListener('animationend', onEnd);
		}

		function _show(latex, isDisplay, mathEl) {
			const container = _findContainer(mathEl);
			const mathIndex = container ? _getMathIndex(container, mathEl) : -1;

			// Same equation, same content → no-op
			if (render_temml._overlay &&
				render_temml._mathEl === mathEl &&
				render_temml._currentLatex === latex) {
				return;
			}

			// Popup already open → animated swap to new equation
			if (render_temml._overlay) {
				render_temml._containerEl = container;
				render_temml._mathIndex   = mathIndex;
				_animatedSwap(render_temml._overlay, latex, isDisplay, mathEl);
				return;
			}

			// ── Create new popup ──
			const overlay = document.createElement('div');
			overlay.className = 'lp-overlay';
			overlay.innerHTML = `
				<div class="lp-box" role="dialog" aria-label="LaTeX Source">
					<div class="lp-header">
						<h3>LaTeX Source</h3>
						<button class="lp-close" aria-label="Close" title="Close">&times;</button>
					</div>
					<div class="lp-body">
						<div class="lp-preview"></div>
						<div class="lp-code-wrap">
							<div class="lp-code-bar">
								<span>LaTeX</span>
								<button class="lp-copy">Copy</button>
							</div>
							<pre class="lp-code"></pre>
						</div>
					</div>
					<div class="lp-footer">
						<span><kbd>Esc</kbd> to close</span>
					</div>
				</div>`;

			overlay.querySelector('.lp-code').textContent = latex;
			overlay.querySelector('.lp-preview').appendChild(mathEl.cloneNode(true));
			_setBadge(overlay, isDisplay);

			_wireClose(overlay);
			_wireCopy(overlay);

			document.body.appendChild(overlay);

			render_temml._overlay      = overlay;
			render_temml._mathEl       = mathEl;
			render_temml._currentLatex = latex;
			render_temml._containerEl  = container;
			render_temml._mathIndex    = mathIndex;
		}

		/* ── Live-update hook — called at end of every render pass ── */
		render_temml._liveUpdate = function() {
			if (!render_temml._overlay || !render_temml._containerEl) return;

			const maths = render_temml._containerEl.querySelectorAll('math');
			const idx   = render_temml._mathIndex;
			if (idx < 0 || idx >= maths.length) return;

			const newMath  = maths[idx];
			const newLatex = _extractLatex(newMath);
			if (!newLatex) return;

			// Always keep the DOM reference fresh (Temml replaces nodes)
			render_temml._mathEl = newMath;

			// Content actually changed → smooth live swap
			if (newLatex !== render_temml._currentLatex) {
				const isDisplay = newMath.getAttribute('display') === 'block';
				_liveSwap(render_temml._overlay, newLatex, isDisplay, newMath);
			}
		};

		/* ── Global listeners (once) ── */
		document.addEventListener('contextmenu', function(e) {
			const mathEl = e.target.closest('math');
			if (!mathEl) return;

			// Ignore math clones inside the popup preview
			if (mathEl.closest('.lp-overlay')) return;

			const latex = _extractLatex(mathEl);
			if (!latex) return;

			e.preventDefault();

			const isDisplay = mathEl.getAttribute('display') === 'block';
			_show(latex, isDisplay, mathEl);
		});

		document.addEventListener('keydown', function(e) {
			if (e.key === 'Escape') _close();
		});

	} /* end one-time bootstrap */


	/* ═══════════════════════════════════════════════════════════════
	   NORMAL RENDERING PASS
	   ═══════════════════════════════════════════════════════════ */
	const elements = document.querySelectorAll(
		'p:not([data-math-rendered]), span:not([data-math-rendered]), ' +
		'div:not([data-math-rendered]), li:not([data-math-rendered])'
	);

	elements.forEach(el => {
		if (!el.textContent.includes('$')) return;

		// Versuche zuerst unseren Fix (rendert direkt via temml.renderToString)
		const fixed = _fixMathInElement(el);

		// Falls unser Fix nichts gefunden hat, Temml normal laufen lassen
		if (!fixed) {
			const rect = el.getBoundingClientRect();

			if (rect.width === 0 && rect.height === 0) {
				temml.renderMathInElement(el, _temmlOpts);
				el.setAttribute('data-math-rendered', 'true');
				return;
			}

			if (rect.bottom > -300 && rect.top < window.innerHeight + 300) {
				temml.renderMathInElement(el, _temmlOpts);
				el.setAttribute('data-math-rendered', 'true');
			} else {
				_temmlObserver.observe(el);
			}
		}
	});

	/* ═══════════════════════════════════════════════════════════════
	   LIVE UPDATE CHECK  (every render pass)
	   ═══════════════════════════════════════════════════════════ */
	if (render_temml._liveUpdate) render_temml._liveUpdate();
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
