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
    // ===== Skip already-rendered elements =====
    if (el.hasAttribute('data-math-rendered')) return false;
    if (el.querySelector('math')) return false;

    // ===== Skip elements that ARE code blocks or are INSIDE code blocks =====
    if (el.tagName === 'PRE' || el.tagName === 'CODE') return false;
    if (el.closest('pre, code')) return false;

    // ===== Check if element contains code blocks =====
    // If it does, we need to mark code blocks so Temml skips them,
    // then let Temml handle it natively
    const codeBlocks = el.querySelectorAll('pre, code');
    if (codeBlocks.length > 0) {
        // Temporarily add a class that prevents Temml from processing these
        codeBlocks.forEach(cb => cb.setAttribute('data-temml-skip', 'true'));

        // Use Temml's native renderMathInElement but with a custom filter
        // that skips code blocks
        _renderMathSkippingCode(el);
        el.setAttribute('data-math-rendered', 'true');

        // Clean up
        codeBlocks.forEach(cb => cb.removeAttribute('data-temml-skip'));
        return true;
    }

    // ===== For elements WITHOUT code blocks, fix the em/strong issue =====
    // The problem: markdown renderers turn _x_ into <em>x</em> inside math
    // We need to undo this ONLY inside $...$ delimiters

    let html = el.innerHTML;
    if (!html.includes('$')) return false;

    // Check if there are <em> or <strong> tags inside math delimiters
    // If not, no need for our fix — let Temml handle it natively
    const hasMathWithMarkup = /\$[^$]*<\/?(?:em|strong)[^>]*>[^$]*\$/i.test(html);
    if (!hasMathWithMarkup) return false;

    // ===== Only fix the specific problem: <em>/<strong> inside math =====
    let changed = false;

    // Block math: $$ ... $$
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
        if (!/<\/?(?:em|strong)/i.test(inner)) return match;

        const clean = _cleanMathContent(inner);
        if (!clean) return match;

        try {
            const rendered = temml.renderToString(clean, { displayMode: true });
            changed = true;
            return rendered;
        } catch (e) {
            console.warn('Temml block error:', clean, e);
            return match;
        }
    });

    // Inline math: $ ... $
    // Use a more conservative regex that won't match across lines
    html = html.replace(/(?<!\$)\$(?!\$)([^$\n]*?)(?<!\$)\$(?!\$)/g, (match, inner) => {
        if (!inner.trim()) return match;
        if (inner.includes('<math') || inner.includes('</math>')) return match;

        // Only intervene if there's HTML markup inside the math
        if (!/</.test(inner)) return match;

        const clean = _cleanMathContent(inner);
        if (!clean) return match;

        try {
            const rendered = temml.renderToString(clean, { displayMode: false });
            changed = true;
            return rendered;
        } catch (e) {
            console.warn('Temml inline error:', clean, e);
            return match;
        }
    });

    if (changed) {
        el.innerHTML = html;
        el.setAttribute('data-math-rendered', 'true');
    }
    return changed;
}

function _cleanMathContent(inner) {
    return inner
        .replace(/<\/?em>/gi, '_')
        .replace(/<\/?strong>/gi, '')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/?p>/gi, '')
        .replace(/<\/?span[^>]*>/gi, '')
        .replace(/<\/?[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .trim();
}

function _renderMathSkippingCode(el) {
    // Walk through child nodes, only render math in non-code sections
    const children = Array.from(el.childNodes);

    for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            // Skip code blocks entirely
            if (child.tagName === 'PRE' || child.tagName === 'CODE' ||
                child.hasAttribute('data-temml-skip')) {
                continue;
            }
            // Recurse into child elements
            if (child.textContent.includes('$')) {
                // Check if this child itself has code blocks
                if (child.querySelector('[data-temml-skip]')) {
                    _renderMathSkippingCode(child);
                } else {
                    // Safe to render math in this subtree
                    const hasMathWithMarkup = /\$[^$]*<\/?(?:em|strong)[^>]*>[^$]*\$/i.test(child.innerHTML);
                    if (hasMathWithMarkup) {
                        _fixMathInElement(child);
                    } else {
                        temml.renderMathInElement(child, _temmlOpts);
                    }
                }
            }
        }
    }
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
				background:rgba(0,0,0,.10);backdrop-filter:blur(2px);
				z-index:100000;display:flex;align-items:center;justify-content:center;
				animation:lpFadeIn .18s ease-out;
				pointer-events:none;
				touch-action:pan-y;
				overscroll-behavior:contain}
			@keyframes lpFadeIn{from{opacity:0}to{opacity:1}}
			@keyframes lpSlideUp{from{opacity:0;transform:translateY(12px) scale(.97)}
				to{opacity:1;transform:translateY(0) scale(1)}}

			.lp-box{
				background:#ffffff;
				border:1px solid rgba(0,0,0,.1);border-radius:14px;
				width:min(560px,90vw);max-height:80vh;
				display:flex;flex-direction:column;overflow:hidden;
				box-shadow:0 8px 40px rgba(0,0,0,.12),
				           0 0 0 1px rgba(0,0,0,.04);
				animation:lpSlideUp .22s ease-out;
				font-family:'Inter','Segoe UI',system-ui,sans-serif;
				pointer-events:auto}

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

			.lp-body{padding:20px;flex:1 1 auto;min-height:0;overflow-y:auto}

			.lp-preview{
				background:#f8f9fb;
				border:1px solid #e5e7eb;
				border-radius:10px;padding:16px;margin-bottom:16px;
				text-align:center;
				overflow:auto;max-height:45vh;
				color:#1f2937;font-size:1.3em;
				transition:opacity .2s ease;
				cursor:grab;
				scrollbar-width:thin}

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

			.lp-code .lp-tok-comment{color:#6b7280;font-style:italic}
			.lp-code .lp-tok-command{color:#7c3aed;font-weight:600}
			.lp-code .lp-tok-brace{color:#dc2626}
			.lp-code .lp-tok-special{color:#ea580c}
			.lp-code .lp-tok-number{color:#059669}
			html.dark .lp-code .lp-tok-comment{color:#9ca3af}
			html.dark .lp-code .lp-tok-command{color:#a78bfa}
			html.dark .lp-code .lp-tok-brace{color:#fca5a5}
			html.dark .lp-code .lp-tok-special{color:#fdba74}
			html.dark .lp-code .lp-tok-number{color:#6ee7b7}

			.lp-footer{
				padding:10px 16px;
				border-top:1px solid #e5e7eb;
				display:flex;align-items:center;justify-content:space-between;gap:12px}
			.lp-footer-hint{font-size:11px;color:#9ca3af;flex:1;text-align:center}
			.lp-footer kbd{
				background:#f3f4f6;
				border:1px solid #e5e7eb;
				border-radius:4px;padding:1px 5px;font-size:10px;color:#6b7280}

			.lp-scroll-btns{display:flex;gap:4px}
			.lp-scroll-btn{
				background:#f3f4f6;border:1px solid #e5e7eb;
				color:#374151;width:30px;height:30px;
				border-radius:6px;cursor:pointer;
				display:flex;align-items:center;justify-content:center;
				font-size:14px;font-weight:600;line-height:1;
				transition:all .15s ease;font-family:inherit}
			.lp-scroll-btn:hover{background:#e5e7eb;border-color:#cbd5e1;color:#1f2937}
			.lp-scroll-btn:active{transform:translateY(1px)}

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

			/* ── Dark mode overrides ── */
			html.dark .lp-box{
				background:var(--mn-surface);
				border-color:var(--mn-border);
				box-shadow:0 8px 40px rgba(0,0,0,.5),
				           0 0 0 1px rgba(255,255,255,.04)}
			html.dark .lp-header{
				background:var(--mn-bg-subtle);
				border-bottom-color:var(--mn-border)}
			html.dark .lp-header h3{color:var(--mn-heading)}
			html.dark .lp-close{
				background:var(--mn-surface-raised);
				border-color:var(--mn-border);
				color:var(--mn-text-secondary)}
			html.dark .lp-close:hover{
				background:#7f1d1d;border-color:#b91c1c;color:#fecaca}
			html.dark .lp-preview{
				background:var(--mn-bg);
				border-color:var(--mn-border);
				color:var(--mn-text)}
			html.dark .lp-code-wrap{
				background:var(--mn-bg);
				border-color:var(--mn-border)}
			html.dark .lp-code-bar{
				background:var(--mn-surface-raised);
				border-bottom-color:var(--mn-border)}
			html.dark .lp-code{color:var(--mn-text)}
			html.dark .lp-footer{border-top-color:var(--mn-border)}
			html.dark .lp-footer-hint{color:var(--mn-text-secondary)}
			html.dark .lp-footer kbd{
				background:var(--mn-surface-raised);
				border-color:var(--mn-border);
				color:var(--mn-text-secondary)}
			html.dark .lp-scroll-btn{
				background:var(--mn-surface-raised);
				border-color:var(--mn-border);
				color:var(--mn-text-secondary)}
			html.dark .lp-scroll-btn:hover{
				background:var(--mn-border);color:var(--mn-text)}
			html.dark .lp-badge-display{
				background:rgba(124,58,237,.2);color:#c4b5fd}
			html.dark .lp-badge-inline{
				background:rgba(14,165,233,.2);color:#7dd3fc}
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
		}

		// Click-outside: any mousedown that isn't on the box closes the popup
		document.addEventListener('mousedown', function(e) {
			if (!render_temml._overlay) return;
			if (e.target.closest && e.target.closest('.lp-box')) return;
			_close();
		}, true);

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

		function _getScrollPos() {
			return window.pageYOffset
				|| document.documentElement.scrollTop
				|| document.body.scrollTop
				|| 0;
		}

		// Tries every scrolling method known to work — returns true on success.
		function _scrollPage(dy) {
			if (!dy) return false;

			// Force 'instant' so CSS `scroll-behavior:smooth` doesn't queue
			// competing animations when the user wheels rapidly.
			const before = _getScrollPos();
			try { window.scrollBy({top: dy, behavior: 'instant'}); } catch(_) { window.scrollBy(0, dy); }
			if (_getScrollPos() !== before) return true;

			// Use the real scrolling element (handles quirks mode, mobile shenanigans)
			const se = document.scrollingElement || document.documentElement;
			if (se) {
				se.scrollTop += dy;
				if (_getScrollPos() !== before) return true;
			}

			// Direct element manipulation (works when window.scrollBy is muted)
			document.documentElement.scrollTop += dy;
			if (_getScrollPos() !== before) return true;
			document.body.scrollTop += dy;
			if (_getScrollPos() !== before) return true;

			// Final fallback: walk up looking for a scrollable ancestor
			let el = overlay && overlay.parentElement;
			while (el && el !== document) {
				if (el.scrollHeight > el.clientHeight + 1) {
					el.scrollTop += dy;
					if (_getScrollPos() !== before) return true;
					break;
				}
				el = el.parentElement;
			}

			return false;
		}

		// Last-resort fallback: centre the right-clicked formula on screen.
		function _scrollFallback(down) {
			if (!render_temml._mathEl) return;
			try {
				render_temml._mathEl.scrollIntoView({behavior: 'smooth', block: down ? 'end' : 'start'});
			} catch(_) { /* very old browser */ }
		}

		function _wireScroll(overlay) {
			const box = overlay.querySelector('.lp-box');
			const preview = () => overlay.querySelector('.lp-preview');

			const onWheel = e => {
				// Inside the code area: let it scroll vertically natively
				if (e.target.closest && e.target.closest('.lp-code')) return;

				// Inside the preview: scroll it (vertically natively, horizontally by mapping wheel)
				const pv = e.target.closest && e.target.closest('.lp-preview');
				if (pv) {
					const hasX = pv.scrollWidth  > pv.clientWidth  + 1;
					const hasY = pv.scrollHeight > pv.clientHeight + 1;
					if (!hasX && !hasY) return; // preview fits → fall through to page scroll

					e.preventDefault();
					e.stopPropagation();

					let dy = e.deltaY, dx = e.deltaX;
					if (e.deltaMode === 1)      { dy *= 20; dx *= 20; }
					else if (e.deltaMode === 2) { dy *= pv.clientHeight; dx *= pv.clientWidth; }

					if (e.shiftKey) {
						if (hasX) pv.scrollLeft += (dx || dy);
					} else if (hasX && hasY) {
						pv.scrollLeft  += dx;
						pv.scrollTop   += dy;
					} else if (hasY) {
						pv.scrollTop   += (dy || dx);
					} else if (hasX) {
						pv.scrollLeft  += (dy || dx);  // map vertical wheel → horizontal
					}
					return;
				}

				// Anywhere else on the box → scroll the page underneath
				e.preventDefault();
				e.stopPropagation();

				let dy = e.deltaY, dx = e.deltaX;
				if (e.deltaMode === 1)      { dy *= 20; dx *= 20; }
				else if (e.deltaMode === 2) { dy *= window.innerHeight; dx *= window.innerWidth; }

				if (e.shiftKey && dy === 0) dy = dx;
				if (dy === 0 && dx !== 0)   dy = dx;

				// Defer out of the event handler
				requestAnimationFrame(() => {
					if (!_scrollPage(dy)) _scrollFallback(dy > 0);
				});
			};

			box.addEventListener('wheel', onWheel, {passive: false, capture: true});

			// Drag-to-scroll on the preview (mouse)
			preview().addEventListener('mousedown', e => {
				const startX = e.clientX, startLeft = preview().scrollLeft;
				const onMove = ev => { preview().scrollLeft = startLeft - (ev.clientX - startX); };
				const onUp = () => {
					document.removeEventListener('mousemove', onMove);
					document.removeEventListener('mouseup', onUp);
				};
				document.addEventListener('mousemove', onMove);
				document.addEventListener('mouseup', onUp);
			});
			preview().addEventListener('touchstart', e => {
				if (e.touches.length !== 1) return;
				const startX = e.touches[0].clientX, startLeft = preview().scrollLeft;
				const onMove = ev => {
					if (!ev.touches.length) return;
					preview().scrollLeft = startLeft - (ev.touches[0].clientX - startX);
				};
				const onEnd = () => {
					preview().removeEventListener('touchmove', onMove);
					preview().removeEventListener('touchend', onEnd);
				};
				preview().addEventListener('touchmove', onMove, {passive: true});
				preview().addEventListener('touchend', onEnd);
			}, {passive: true});

			overlay.querySelectorAll('.lp-scroll-btn').forEach(btn => {
				const step = () => {
					const dy = window.innerHeight * Number(btn.dataset.dy);
					if (!_scrollPage(dy)) _scrollFallback(dy > 0);
				};
				btn.addEventListener('click', step);
				let timer;
				const start = () => { step(); timer = setInterval(step, 120); };
				const stop  = () => clearInterval(timer);
				btn.addEventListener('mousedown', e => { e.preventDefault(); start(); });
				btn.addEventListener('mouseup', stop);
				btn.addEventListener('mouseleave', stop);
				btn.addEventListener('touchstart', e => { e.preventDefault(); start(); }, {passive: false});
				btn.addEventListener('touchend', stop);
			});
		}

		function _highlightLatex(src) {
			const tokens = [];
			const len = src.length;
			let i = 0;
			while (i < len) {
				const c = src[i];
				if (c === '%') {
					let j = i;
					while (j < len && src[j] !== '\n') j++;
					tokens.push({t: 'comment', v: src.slice(i, j)});
					i = j;
				} else if (c === '\\') {
					const n = src[i + 1];
					if (n === undefined) {
						tokens.push({t: 'command', v: '\\'});
						i++;
					} else if (!/[a-zA-Z@]/.test(n)) {
						tokens.push({t: 'command', v: src.slice(i, i + 2)});
						i += 2;
					} else {
						let j = i + 1;
						while (j < len && /[a-zA-Z]/.test(src[j])) j++;
						tokens.push({t: 'command', v: src.slice(i, j)});
						i = j;
					}
				} else if (c === '{' || c === '}') {
					tokens.push({t: 'brace', v: c});
					i++;
				} else if (c === '$' || c === '^' || c === '_' || c === '&') {
					tokens.push({t: 'special', v: c});
					i++;
				} else if (c >= '0' && c <= '9') {
					let j = i;
					while (j < len && ((src[j] >= '0' && src[j] <= '9') || src[j] === '.')) j++;
					tokens.push({t: 'number', v: src.slice(i, j)});
					i = j;
				} else {
					tokens.push({t: 'plain', v: c});
					i++;
				}
			}
			const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			return tokens.map(tok => `<span class="lp-tok-${tok.t}">${esc(tok.v)}</span>`).join('');
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
				overlay.querySelector('.lp-code').innerHTML = _highlightLatex(latex);
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
			overlay.querySelector('.lp-code').innerHTML = _highlightLatex(latex);
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
						<div class="lp-scroll-btns">
							<button class="lp-scroll-btn" data-dy="-0.85" title="Scroll page up (↑)" aria-label="Scroll page up">↑</button>
							<button class="lp-scroll-btn" data-dy="0.85" title="Scroll page down (↓)" aria-label="Scroll page down">↓</button>
						</div>
						<span class="lp-footer-hint"><kbd>Esc</kbd> to close · wheel scrolls page</span>
						<div style="width:68px"></div>
					</div>
				</div>`;

			overlay.querySelector('.lp-code').innerHTML = _highlightLatex(latex);
			overlay.querySelector('.lp-preview').appendChild(mathEl.cloneNode(true));
			_setBadge(overlay, isDisplay);

			_wireClose(overlay);
			_wireCopy(overlay);
			_wireScroll(overlay);

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
			if (!render_temml._overlay) return;

			if (e.key === 'Escape') { _close(); return; }

			// Don't hijack keys when user is selecting text in the code box
			const ae = document.activeElement;
			if (ae && ae.closest && ae.closest('.lp-code') &&
			    (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End')) {
				// Arrow / Home / End inside lp-code → let text selection handle it
				if (!e.shiftKey || e.key === 'Home' || e.key === 'End') return;
			}

			if (e.key === 'PageUp' || (e.key === 'ArrowUp' && e.altKey)) {
				e.preventDefault();
				if (!_scrollPage(-window.innerHeight * 0.85)) _scrollFallback(false);
			} else if (e.key === 'PageDown' || (e.key === 'ArrowDown' && e.altKey)) {
				e.preventDefault();
				if (!_scrollPage(window.innerHeight * 0.85)) _scrollFallback(true);
			} else if (e.key === 'Home' && !e.shiftKey) {
				e.preventDefault();
				window.scrollTo({top: 0, behavior: 'instant'});
			} else if (e.key === 'End' && !e.shiftKey) {
				e.preventDefault();
				window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'});
			}
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

		// Skip elements that ARE code blocks or are INSIDE code blocks
		if (el.tagName === 'PRE' || el.tagName === 'CODE') return;
		if (el.closest('pre, code')) return;

		// Try our fix first (only intervenes when there's HTML markup inside math)
		const fixed = _fixMathInElement(el);

		// If our fix didn't intervene, let Temml run normally
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

/* ════════════════════════════════════════════════════════════
   DARK MODE TOGGLE
   ════════════════════════════════════════════════════════ */
function getThemeFromCookie() {
	var c = document.cookie.split(';');
	for (var i = 0; i < c.length; i++) {
		var t = c[i].trim();
		if (t.indexOf('theme=') === 0) return t.substring(6);
	}
	return '';
}

function setThemeCookie(value) {
	document.cookie = 'theme=' + value + '; path=/; max-age=' + 60*60*24*365;
}

function applyTheme(dark, persist) {
	var html = document.documentElement;
	if (dark) {
		html.classList.add('dark');
	} else {
		html.classList.remove('dark');
	}
	// Icon is switched via CSS (html.dark toggles .ti-sun/.ti-moon)
	// Update theme-color meta
	var meta = document.querySelector('meta[name="theme-color"]');
	if (meta) meta.content = dark ? '#0f172a' : '#ffffff';
	if (persist) setThemeCookie(dark ? 'dark' : 'light');
}

function initDarkMode() {
	var toggle = document.getElementById('theme-toggle');
	if (!toggle) return;

	toggle.addEventListener('click', function() {
		var isDark = !document.documentElement.classList.contains('dark');
		document.documentElement.classList.add('theme-transition');
		applyTheme(isDark, true);
		setTimeout(function() {
			document.documentElement.classList.remove('theme-transition');
		}, 400);
		adaptLabsToTheme();
	});

	// If no cookie set, respect system preference
	if (!getThemeFromCookie()) {
		var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		if (prefersDark) applyTheme(true, false);
	}

	adaptLabsToTheme();
}

/* ════════════════════════════════════════════════════════════
   ADAPT LABS — fix hardcoded inline styles in demos
   ════════════════════════════════════════════════════════ */
function fixPlotlyBg() {
	var isDark = document.documentElement.classList.contains('dark');
	if (!isDark) return;
	var LAB_BG = '#1e293b';
	document.querySelectorAll('.js-plotly-plot .main-svg').forEach(function(svg) {
		var rects = svg.querySelectorAll('rect.bg, rect[fill="#fff"], rect[fill="#ffffff"], rect[fill="white"], rect[fill="rgb(255,255,255)"], rect[fill="rgb(255, 255, 255)"]');
		rects.forEach(function(r) { r.setAttribute('fill', LAB_BG); });
	});
}

function isLightHex(hex) {
	hex = hex.replace('#', '');
	if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
	var r = parseInt(hex.substr(0,2), 16);
	var g = parseInt(hex.substr(2,2), 16);
	var b = parseInt(hex.substr(4,2), 16);
	return (0.299 * r + 0.587 * g + 0.114 * b) > 200;
}

let _lastAdaptedTheme = null;
function adaptLabsToTheme() {
	var isDark = document.documentElement.classList.contains('dark');
	// Skip if theme hasn't changed since the last full scan.
	// This is called by a body-wide MutationObserver on every DOM change
	// (e.g. every training epoch). Without this guard, the full
	// querySelectorAll + style-set pass repeats thousands of times and
	// dominates training runtime. New DOM nodes added at the current theme
	// are already styled correctly by the JS that creates them.
	if (_lastAdaptedTheme === isDark) return;
	_lastAdaptedTheme = isDark;
	var LAB_BG = '#1e293b';
	var LAB_TEXT = '#e2e8f0';
	var LAB_TEXT_SEC = '#94a3b8';
	var LAB_BORDER = '#334155';

	// Additional light-bg swatches that adaptLabsToTheme should catch in dark mode
	var LIGHT_TINTED_BG = /^#(f0fdf4|f0f9ff|dcfce7|e0e7ff|e0f2fe|fef9c3|fff3e0|e8f5e9|f8fafc|f1f5f9|ede9fe|faf5ff|ddd6fe|fef2f2|fee2e2|fff7ed|fef3c7|fdf2f8|fce7f3|f3e8ff|ecfeff|cffafe|fffbeb|fefce8|f7fee7|f0fdfa|ccfbf1|ffe4e6|f0f9ff|dbeafe|bef264|d9f99d|fef08a|fde68a|fed7aa|fdba74|fab12f|fb923c|fb7185|f43f5e|fbbf24|fcd34d|fde047|a3e635|84cc16|22c55e|10b981|14b8a6|06b6d4|0ea5e9|3b82f6|6366f1|8b5cf6|a855f7|d946ef|ec4899|f472b6|9ca3af|d1d5db|9ca3af|6b7280|4b5563|374151|1f2937|111827)$/i;

	if (isDark) {
		var all = document.querySelectorAll('[style*="background"]');
		for (var i = 0; i < all.length; i++) {
			var el = all[i];
			if (el.closest('pre') || el.closest('code') || el.id === 'contents' || el.id === 'loader') continue;
			var s = (el.getAttribute('style') || '').toLowerCase().replace(/\s/g, '');
			var m = s.match(/(?:background|background-color):(#[0-9a-f]{3,6})/);
			if (m && (isLightHex(m[1]) || LIGHT_TINTED_BG.test(m[1]))) {
				if (!el.hasAttribute('data-orig-bg')) {
					el.setAttribute('data-orig-bg', el.style.background || el.style.backgroundColor || '');
				}
				el.style.setProperty('background', LAB_BG, 'important');
				el.style.backgroundColor = '';
			}
		}

		var textEls = document.querySelectorAll('[style*="color"]');
		for (var i = 0; i < textEls.length; i++) {
			var el = textEls[i];
			if (el.closest('pre') || el.closest('code') || el.closest('.glossary-term')) continue;
			var s = (el.getAttribute('style') || '').toLowerCase().replace(/\s/g, '');
			var m = s.match(/color:(#[0-9a-f]{3,6})/);
			if (!m) continue;
			var c = m[1];
			if (/^#(1e293b|0f172a|333|333333|444|444444|555|555555|666|666666|777|777777|475569|4a5568|2d3748|1a202c|334155|374151|4b5563|6b7280|71717a|52525b)$/i.test(c)) {
				if (!el.hasAttribute('data-orig-color')) {
					el.setAttribute('data-orig-color', el.style.color || '');
				}
				el.style.setProperty('color', LAB_TEXT, 'important');
			}
		}

		fixPlotlyBg();
		document.querySelectorAll('div[id$="-chart"], div[id$="-plot"], div[id^="plot-"]').forEach(function(el) {
			var s = (el.getAttribute('style') || '').toLowerCase();
			if (/background/.test(s) && /#fff|#ffffff|white/.test(s)) {
				if (!el.hasAttribute('data-orig-bg')) {
					el.setAttribute('data-orig-bg', el.style.background || el.style.backgroundColor || '');
				}
				el.style.background = LAB_BG;
			}
		});
		document.querySelectorAll('canvas[style*="background"]').forEach(function(c) {
			var s = (c.getAttribute('style') || '').toLowerCase();
			if (/#fff|#ffffff|white/.test(s)) {
				if (!c.hasAttribute('data-orig-bg')) {
					c.setAttribute('data-orig-bg', c.style.background || '');
				}
				c.style.background = LAB_BG;
			}
		});

	} else {
		document.querySelectorAll('[data-orig-bg]').forEach(function(el) {
			var orig = el.getAttribute('data-orig-bg');
			if (orig) {
				el.style.setProperty('background', orig, 'important');
			} else {
				el.style.removeProperty('background');
				el.style.backgroundColor = '';
			}
			el.removeAttribute('data-orig-bg');
		});
		document.querySelectorAll('[data-orig-color]').forEach(function(el) {
			var orig = el.getAttribute('data-orig-color');
			if (orig) {
				el.style.setProperty('color', orig, 'important');
			} else {
				el.style.removeProperty('color');
			}
			el.removeAttribute('data-orig-color');
		});
		document.querySelectorAll('.js-plotly-plot .main-svg').forEach(function(svg) {
			var rects = svg.querySelectorAll('rect.bg');
			rects.forEach(function(r) { r.removeAttribute('fill'); });
		});
	}

	// Update temml/LaTeX rendering to respect dark mode
	// (temml renders math with black text which is hard to read on dark bg)
	document.querySelectorAll('math, .tml-display, mtext, mi, mn, mo, ms').forEach(function(el) {
		if (isDark) {
			if (!el.hasAttribute('data-orig-color-math')) {
				el.setAttribute('data-orig-color-math', el.getAttribute('color') || '');
			}
			el.setAttribute('color', '#e2e8f0');
		} else {
			if (el.hasAttribute('data-orig-color-math')) {
				var orig = el.getAttribute('data-orig-color-math');
				if (orig) el.setAttribute('color', orig);
				else el.removeAttribute('color');
				el.removeAttribute('data-orig-color-math');
			}
		}
	});
}

/* ════════════════════════════════════════════════════════════
   MOBILE DRAWER
   ════════════════════════════════════════════════════════ */
function initDrawer() {
	const toggle = document.getElementById('drawer-toggle');
	const panel = document.getElementById('drawer-panel');
	const backdrop = document.getElementById('drawer-backdrop');
	const close = document.getElementById('drawer-close');
	if (!toggle || !panel || !backdrop) return;

	function open() { panel.classList.add('open'); backdrop.classList.add('open'); }
	function closeDrawer() { panel.classList.remove('open'); backdrop.classList.remove('open'); }

	toggle.addEventListener('click', open);
	if (close) close.addEventListener('click', closeDrawer);
	backdrop.addEventListener('click', closeDrawer);

	// Close on escape
	document.addEventListener('keydown', function(e) {
		if (e.key === 'Escape' && panel.classList.contains('open')) closeDrawer();
	});

	// Close on module link click
	panel.querySelectorAll('.drawer-module').forEach(function(link) {
		link.addEventListener('click', closeDrawer);
	});
}

/* ════════════════════════════════════════════════════════════
   MODULE NAV (Prev / Next)
   ════════════════════════════════════════════════════════ */
function initModuleNav() {
	const data = window.__moduleNavData;
	if (!data || data.current < 0 || !data.modules || data.modules.length < 2) return;

	const contents = document.getElementById('contents');
	if (!contents) return;

	const modules = data.modules;
	const idx = data.current;
	const nav = document.createElement('nav');
	nav.className = 'module-nav';

	if (idx > 0) {
		const prev = modules[idx - 1];
		const a = document.createElement('a');
		a.href = prev.url;
		a.className = 'module-nav-link module-nav-prev';
		a.innerHTML = '<span class="module-nav-arrow" aria-hidden="true">←</span>'
			+ '<span class="module-nav-body">'
			+ '<span class="module-nav-label">Previous</span>'
			+ '<span class="module-nav-title">' + escHtml(prev.title) + '</span>'
			+ '</span>';
		nav.appendChild(a);
	} else {
		nav.appendChild(document.createElement('span'));
	}

	if (idx < modules.length - 1) {
		const next = modules[idx + 1];
		const a = document.createElement('a');
		a.href = next.url;
		a.className = 'module-nav-link module-nav-next';
		a.innerHTML = '<span class="module-nav-body">'
			+ '<span class="module-nav-label">Next</span>'
			+ '<span class="module-nav-title">' + escHtml(next.title) + '</span>'
			+ '</span>'
			+ '<span class="module-nav-arrow" aria-hidden="true">→</span>';
		nav.appendChild(a);
	} else {
		nav.appendChild(document.createElement('span'));
	}

	contents.appendChild(nav);
}

function escHtml(str) {
	var div = document.createElement('div');
	div.appendChild(document.createTextNode(str || ''));
	return div.innerHTML;
}

/* ════════════════════════════════════════════════════════════
   AUTO GLOSSARY
   ════════════════════════════════════════════════════════ */
function initGlossary() {
	if (typeof GLOSSARY === 'undefined' || !GLOSSARY) return;

	// #contents holds markdown-rendered prose; only used here to auto-detect
	// terms in long-form text. Pages like transformer.php have no #contents
	// but still ship hardcoded .glossary-term nodes (e.g. SGD/Adam labels)
	// that need the same hover positioning. Don't bail out if it's missing.
	var contents = document.getElementById('contents');

	// Build a single regex matching all glossary terms (word-boundary-aware)
	var terms = Object.keys(GLOSSARY);
	// Sort by length descending so longer terms match first
	terms.sort(function(a, b) { return b.length - a.length; });
	// Escape regex special chars and join with word boundaries
	var escaped = terms.map(function(t) {
		return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	});
	var pattern = new RegExp('\\b(' + escaped.join('|') + ')\\b', 'gi');

	// Helper: extract the definition string from a GLOSSARY entry (string or {def, exclude})
	function getGlossaryDef(entry) {
		return typeof entry === 'string' ? entry : entry.def;
	}

	// Helper: check if a match at the given position should be excluded because
	// surrounding context suggests everyday (non-technical) usage. Each GLOSSARY
	// entry may have an `exclude` array of RegExp patterns. If ANY pattern matches
	// within ±150 chars of the match, the term is treated as plain English.
	function isExcluded(text, matchIndex, matchLength, entry) {
		if (typeof entry === 'string' || !entry.exclude) return false;
		var start = Math.max(0, matchIndex - 150);
		var end = Math.min(text.length, matchIndex + matchLength + 150);
		var ctx = text.slice(start, end);
		for (var i = 0; i < entry.exclude.length; i++) {
			if (entry.exclude[i].test(ctx)) return true;
		}
		return false;
	}

	// Walk text nodes inside #contents (but skip code/pre/math/form elements).
	// Only does auto-detection of terms in markdown prose; hardcoded
	// .glossary-term nodes (e.g. on transformer.php) are handled below
	// via the document-level listeners regardless of #contents.
	if (contents) {
		var walker = document.createTreeWalker(
			contents,
			NodeFilter.SHOW_TEXT,
			{
				acceptNode: function(node) {
					// Skip code blocks, pre, math, script, style
					var parent = node.parentElement;
					if (!parent) return NodeFilter.FILTER_REJECT;
					var tag = parent.tagName;
					if (tag === 'CODE' || tag === 'PRE' || tag === 'SCRIPT' || tag === 'STYLE' ||
						tag === 'SVG') {
						return NodeFilter.FILTER_REJECT;
					}
					if (parent.closest('select, option, input, textarea, button, label[for]')) {
						return NodeFilter.FILTER_REJECT;
					}
					// Skip if inside math element or already has glossary-term
					if (parent.closest('math') || parent.closest('.glossary-term')) return NodeFilter.FILTER_REJECT;
					// Only process if text contains potential matches
					if (!pattern.test(node.textContent)) return NodeFilter.FILTER_REJECT;
					pattern.lastIndex = 0;
					return NodeFilter.FILTER_ACCEPT;
				}
			},
			false
		);

		var nodesToProcess = [];
		while (walker.nextNode()) nodesToProcess.push(walker.currentNode);

		nodesToProcess.forEach(function(textNode) {
			var text = textNode.textContent;
			pattern.lastIndex = 0;
			if (!pattern.test(text)) return;
			pattern.lastIndex = 0;

			var frag = document.createDocumentFragment();
			var lastIdx = 0;
			var match;

			while ((match = pattern.exec(text)) !== null) {
				// Text before match
				if (match.index > lastIdx) {
					frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
				}
				var term = match[0];
				var key = terms.find(function(k) { return k.toLowerCase() === term.toLowerCase(); });
				var entry = key ? GLOSSARY[key] : null;
				var def = entry ? getGlossaryDef(entry) : '';

				// Check contextual exclusion — if surrounding text suggests
				// everyday usage, skip the highlight entirely
				if (entry && isExcluded(text, match.index, match[0].length, entry)) {
					frag.appendChild(document.createTextNode(term));
					lastIdx = match.index + match[0].length;
					continue;
				}

				var span = document.createElement('span');
				span.className = 'glossary-term';
				span.textContent = term;
				span.removeAttribute('title');
				if (def) {
					// ANGLE 4: portal the tooltip to document.body.
					// This guarantees it can never be inside a clipped
					// or transformed ancestor — it lives at the top of
					// the DOM, sibling of #contents.
					var tooltip = document.createElement('span');
					tooltip.className = 'glossary-tooltip';
					tooltip.textContent = def;
					tooltip.dataset.ownerTerm = '__pending__';
					// keep a back-reference from the term to its tooltip
					span.dataset.tooltipId = 'tt_' + Math.random().toString(36).slice(2, 10);
					tooltip.dataset.tooltipId = span.dataset.tooltipId;
					document.body.appendChild(tooltip);
				}
				frag.appendChild(span);
				lastIdx = match.index + match[0].length;
			}
			if (lastIdx < text.length) {
				frag.appendChild(document.createTextNode(text.slice(lastIdx)));
			}
			textNode.parentNode.replaceChild(frag, textNode);
		});
	}

	// ANGLE 5: ancestor scanner. Before showing a tooltip, walk up from the
	// term and temporarily neutralize any property that would create a
	// containing block for position:fixed descendants. The original
	// values are saved so they can be restored on mouseout.
	var _savedAncestorStyles = new WeakMap();

	function neutralizeContainingBlock(el) {
		var node = el;
		var stack = [];
		while (node && node !== document.documentElement) {
			var cs = window.getComputedStyle(node);
			var props = ['transform', 'filter', 'backdropFilter', 'perspective',
				'clipPath', 'mask', 'maskImage', 'willChange', 'contain'];
			var saved = _savedAncestorStyles.get(node) || {};
			var touched = false;
			for (var i = 0; i < props.length; i++) {
				var p = props[i];
				var v = cs[p];
				if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && !(p === 'willChange' && v === 'auto')) {
					if (!(p in saved)) {
						saved[p] = node.style[p] || '';
						node.style[p] = 'none';
						touched = true;
					}
				}
			}
			if (touched) _savedAncestorStyles.set(node, saved);
			stack.push(node);
			node = node.parentElement;
		}
		return stack;
	}

	function restoreAncestors(stack) {
		for (var i = 0; i < stack.length; i++) {
			var node = stack[i];
			var saved = _savedAncestorStyles.get(node);
			if (!saved) continue;
			for (var p in saved) {
				if (saved[p]) node.style[p] = saved[p];
				else node.style.removeProperty(p);
			}
			_savedAncestorStyles.delete(node);
		}
	}

	// Position each tooltip. The tooltip is portaled to document.body,
	// so position:fixed is always relative to the viewport — no matter
	// what the term's ancestors do.
	function positionTooltip(term) {
		var tipId = term.dataset.tooltipId;
		if (!tipId) return;
		var tip = document.querySelector('.glossary-tooltip[data-tooltip-id="' + tipId + '"]');
		if (!tip) return;
		var termRect = term.getBoundingClientRect();
		var tipRect = tip.getBoundingClientRect();
		var vw = window.innerWidth || document.documentElement.clientWidth;
		var margin = 8;
		var tipW = tipRect.width;
		var tipH = tipRect.height;

		var left = termRect.left + termRect.width / 2 - tipW / 2;
		var insideCitation = !!term.closest('a.cite-stealth, a[data-target]');
		var top;
		if (insideCitation) {
			// Place glossary tooltip below the term so it doesn't collide
			// with the citation preview that sits above the anchor.
			top = termRect.bottom + 8;
		} else {
			top = termRect.top - tipH - 8;
		}

		if (!insideCitation && top < margin) {
			top = termRect.bottom + 8;
		}
		if (left < margin) {
			left = margin;
		} else if (left + tipW > vw - margin) {
			left = vw - tipW - margin;
		}

		tip.style.left = left + 'px';
		tip.style.top = top + 'px';
		// Force on top no matter what z-index any neighbour claims.
		tip.style.zIndex = '2147483647';

		// Arrow points up (toward the term) when tooltip is below,
		// points down when tooltip is above.
		tip.classList.toggle('glossary-tooltip--below', insideCitation);
		var arrowLeft = termRect.left + termRect.width / 2 - left;
		var arrowClamp = Math.max(10, Math.min(tipW - 10, arrowLeft));
		tip.style.setProperty('--arrow-x', arrowClamp + 'px');
	}

	// ════════════════════════════════════════════════════════════════
	// ANGLE 1 — PROTOTYPE TRAP
	// Override Element.prototype.title so that any code (ours, third-party,
	// browser extension) that tries to set .title on a .glossary-term
	// silently has the attribute stripped. This catches direct assignment,
	// setAttribute(), jQuery .attr(), framework bindings, etc.
	// Guardrail: only targets .glossary-term — all other elements untouched.
	// Guardrail: wrapped in try/catch — if another library already froze
	// the prototype, we degrade gracefully instead of breaking.
	// ════════════════════════════════════════════════════════════════
	try {
		var _origTitleDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'title');
		if (_origTitleDesc && _origTitleDesc.set) {
			Object.defineProperty(Element.prototype, 'title', {
				get: _origTitleDesc.get,
				set: function(v) {
					// Strip title from glossary terms — prevent native browser tooltip
					if (this.classList && this.classList.contains('glossary-term')) {
						try { this.removeAttribute('title'); } catch(e) {}
						return;
					}
					_origTitleDesc.set.call(this, v);
				},
				configurable: true,
				enumerable: true
			});
		}
	} catch(e) { /* Prototype frozen by another lib — degrade gracefully */ }

	// Helper: strip title from a single element (used by multiple angles)
	function stripTitle(el) {
		if (el && el.nodeType === 1 && el.hasAttribute && el.hasAttribute('title')) {
			el.removeAttribute('title');
		}
	}

	// Helper: sweep all .glossary-term elements for stray title attributes
	function sweepAllTerms() {
		var all = document.querySelectorAll('.glossary-term[title]');
		for (var i = 0; i < all.length; i++) {
			all[i].removeAttribute('title');
		}
	}

	// ════════════════════════════════════════════════════════════════
	// ANGLE 2 — CAPTURE-PHASE EVENT LISTENERS
	// The browser's native title tooltip fires after ~400ms hover delay.
	// By listening in the CAPTURE phase (which fires before bubble phase),
	// we intercept mouseover/mouseenter BEFORE the browser's timer starts.
	// Guardrail: passive:true — never blocks other event handlers.
	// Guardrail: stripped title is gone before browser can read it.
	// ════════════════════════════════════════════════════════════════
	function handleMouseOverCapture(ev) {
		var term = ev.target.closest && ev.target.closest('.glossary-term');
		if (term) stripTitle(term);
	}
	document.addEventListener('mouseover', handleMouseOverCapture, { capture: true, passive: true });
	document.addEventListener('mouseenter', handleMouseOverCapture, { capture: true, passive: true });

	// ════════════════════════════════════════════════════════════════
	// ANGLE 3 — POST-LOAD SWEEPS
	// Other scripts may set .title AFTER initGlossary runs. We sweep at
	// DOMContentLoaded (all sync scripts done) and window.load (all
	// async/defer scripts + images done). These are one-shot safety nets.
	// Guardrail: DOMContentLoaded fires even if we're past that point
	// (it's replayed if listener is added after it already fired — but
	// we add a fallback window.onload anyway).
	// ════════════════════════════════════════════════════════════════
	document.addEventListener('DOMContentLoaded', function() {
		sweepAllTerms();
		// Also re-parent any tooltips that got displaced
		document.querySelectorAll('.glossary-tooltip').forEach(function(tip) {
			if (tip.parentElement !== document.body) {
				document.body.appendChild(tip);
			}
		});
	});
	window.addEventListener('load', function() {
		sweepAllTerms();
		document.querySelectorAll('.glossary-tooltip').forEach(function(tip) {
			if (tip.parentElement !== document.body) {
				document.body.appendChild(tip);
			}
		});
	});
	// Belt: if we're already past DOMContentLoaded, sweep immediately
	if (document.readyState === 'complete' || document.readyState === 'interactive') {
		setTimeout(sweepAllTerms, 0);
		setTimeout(sweepAllTerms, 100);
	}

	// ════════════════════════════════════════════════════════════════
	// ANGLE 4 — MUTATION OBSERVER
	// Watches the entire body for any attribute changes on .glossary-term
	// elements. If 'title' is added (by any code), it's removed in the
	// same microtask — before the browser can process the change.
	// Also catches: class changes that add .glossary-term to an element
	// that already has a title; style changes that break tooltip stacking.
	// Guardrail: attributeFilter limits to ['title','style','class'] so
	// we don't observe irrelevant mutations (performance).
	// Guardrail: subtree:true catches deeply nested terms.
	// ════════════════════════════════════════════════════════════════
	var glossaryObserver = new MutationObserver(function(mutations) {
		for (var i = 0; i < mutations.length; i++) {
			var m = mutations[i];
			if (m.type !== 'attributes') continue;
			var t = m.target;

			// Title attribute added to a glossary term → strip immediately
			if (m.attributeName === 'title' && t.classList && t.classList.contains('glossary-term')) {
				t.removeAttribute('title');
				continue;
			}

			// Class changed — check if .glossary-term was just added and
			// the element already had a title from before
			if (m.attributeName === 'class' && t.classList && t.classList.contains('glossary-term')) {
				stripTitle(t);
				continue;
			}

			// Style changed on a glossary term — ensure tooltip stays portaled
			if (m.attributeName === 'style' && t.classList && t.classList.contains('glossary-term')) {
				var id = t.dataset.tooltipId;
				var tip = id ? document.querySelector('.glossary-tooltip[data-tooltip-id="' + id + '"]') : null;
				if (tip && tip.parentElement !== document.body) {
					document.body.appendChild(tip);
				}
			}
		}
	});
	glossaryObserver.observe(document.body, {
		attributes: true,
		attributeFilter: ['title', 'style', 'class'],
		subtree: true
	});

	// ════════════════════════════════════════════════════════════════
	// ANGLE 5 — PERIODIC SELF-CHECK (DEFENSE IN DEPTH)
	// Every 2 seconds: sweep for stray titles, ensure tooltips are
	// portaled to body, and force z-index. This catches everything
	// the other 4 angles might miss (race conditions, edge cases,
	// browser extensions that inject after observers fire).
	// Guardrail: querySelectorAll is cheap for <1000 terms.
	// Guardrail: runs in idle callback when available, else setTimeout.
	// ════════════════════════════════════════════════════════════════
	function periodicSweep() {
		// Sweep titles
		sweepAllTerms();
		// Ensure tooltips are portaled to body
		var tips = document.querySelectorAll('.glossary-tooltip');
		for (var i = 0; i < tips.length; i++) {
			var tip = tips[i];
			if (tip.parentElement !== document.body) {
				document.body.appendChild(tip);
			}
			if (tip.style.zIndex !== '2147483647') {
				tip.style.zIndex = '2147483647';
			}
		}
	}
	setInterval(function() {
		if (window.requestIdleCallback) {
			requestIdleCallback(periodicSweep, { timeout: 500 });
		} else {
			periodicSweep();
		}
	}, 2000);

	// ════════════════════════════════════════════════════════════════
	// GUARDRAIL 1 — showTooltip ALSO strips title on every hover
	// Even if all other angles fail, the moment we show our custom
	// tooltip, we strip the native title one more time. The browser
	// needs the title attribute to exist AT THE MOMENT of hover to
	// show the native tooltip — removing it here is too late for the
	// FIRST hover but prevents it on subsequent hovers.
	// ════════════════════════════════════════════════════════════════
	function showTooltip(term) {
		stripTitle(term);
		var tipId = term.dataset.tooltipId;
		if (!tipId) return;
		var tip = document.querySelector('.glossary-tooltip[data-tooltip-id="' + tipId + '"]');
		if (!tip) return;
		term._neutralizedAncestors = neutralizeContainingBlock(term);
		tip.style.opacity = '1';
		tip.style.visibility = 'visible';
		positionTooltip(term);
	}

	function hideTooltip(term) {
		var tipId = term.dataset.tooltipId;
		if (!tipId) return;
		var tip = document.querySelector('.glossary-tooltip[data-tooltip-id="' + tipId + '"]');
		if (!tip) return;
		tip.style.opacity = '0';
		tip.style.visibility = 'hidden';
		tip.style.left = '';
		tip.style.top = '';
		tip.classList.remove('glossary-tooltip--below');
		tip.style.removeProperty('--arrow-x');
		if (term._neutralizedAncestors) {
			restoreAncestors(term._neutralizedAncestors);
			term._neutralizedAncestors = null;
		}
	}

	// Use document-level delegation so tooltips are positioned on every page,
	// not just inside #contents.
	document.addEventListener('mouseover', function(ev) {
		var term = ev.target.closest && ev.target.closest('.glossary-term');
		if (!term) return;
		showTooltip(term);
	});
	document.addEventListener('mouseout', function(ev) {
		var term = ev.target.closest && ev.target.closest('.glossary-term');
		if (!term) return;
		hideTooltip(term);
	});
	document.addEventListener('scroll', function() {
		document.querySelectorAll('.glossary-tooltip[style*="visibility: visible"]').forEach(function(tip) {
			var id = tip.dataset.tooltipId;
			var term = document.querySelector('.glossary-term[data-tooltip-id="' + id + '"]');
			if (term) positionTooltip(term);
		});
	}, true);
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
	initDarkMode();
	initDrawer();
	initModuleNav();
	initGlossary();
}

document.addEventListener("DOMContentLoaded", function() {
	initDarkMode();
	initDrawer();
	render_temml();
	observeAndRenderMath(document.body);

	// Run adaptLabsToTheme before next paint after DOM changes
	var adaptPending = false;
	var domObserver = new MutationObserver(function() {
		if (!adaptPending) {
			adaptPending = true;
			requestAnimationFrame(function() {
				adaptPending = false;
				adaptLabsToTheme();
			});
		}
	});
	domObserver.observe(document.body, { childList: true, subtree: true });

	// Also hook Plotly's after-plot event for immediate fix
	document.addEventListener('plotly_afterplot', function() {
		fixPlotlyBg();
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
