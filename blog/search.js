(function() {
	var overlay = null;
	var input = null;
	var resultsContainer = null;
	var activeIndex = -1;
	var abortController = null;
	var debounceTimer = null;
	var trigger = null;
	var lastFocus = null;
	var searchSeq = 0;
	var semanticEnabled = true;
	try {
		semanticEnabled = window.localStorage.getItem('mn_search_ai') !== '0';
	} catch (e) {
		semanticEnabled = true;
	}

	function init() {
		if (document.getElementById('search-overlay')) return;

		overlay = document.createElement('div');
		overlay.id = 'search-overlay';
		overlay.className = 'search-overlay';
		overlay.setAttribute('role', 'dialog');
		overlay.setAttribute('aria-modal', 'true');
		overlay.setAttribute('aria-label', 'Search the course');
		overlay.setAttribute('aria-hidden', 'true');
		overlay.innerHTML =
			'<div class="search-backdrop"></div>' +
			'<div class="search-modal">' +
				'<div class="search-header">' +
					'					<svg class="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
					'<input type="text" class="search-input" placeholder="Search or ask a question…" aria-label="Search across all lessons or ask a question" spellcheck="false">' +
					'<button type="button" class="search-close" aria-label="Close search">&times;</button>' +
				'</div>' +
				'<div class="search-hints">' +
					'<span class="search-hint-default">Press <kbd>Esc</kbd> to close &middot; <kbd>/pattern/</kbd> regex &middot; <kbd>~term</kbd> fuzzy &middot; or ask a question in plain language</span>' +
					'<label class="search-ai-toggle" title="Find results by meaning with a local model. Uncheck for pure keyword search.">' +
						'<input type="checkbox" id="search-ai-toggle"> AI search' +
					'</label>' +
					'<span class="search-hint-mode" id="search-hint-mode"></span>' +
				'</div>' +
				'<div class="search-results" aria-live="polite"></div>' +
			'</div>';

		document.body.appendChild(overlay);
		overlay.inert = true;
		showEmptyState();

		input = overlay.querySelector('.search-input');
		resultsContainer = overlay.querySelector('.search-results');

		overlay.querySelector('.search-backdrop').addEventListener('click', close);
		overlay.querySelector('.search-close').addEventListener('click', close);

		input.addEventListener('input', onInput);
		input.addEventListener('keydown', onKeyDown);

		var aiToggle = overlay.querySelector('#search-ai-toggle');
		if (aiToggle) {
			aiToggle.checked = semanticEnabled;
			aiToggle.addEventListener('change', function() {
				setSemanticEnabled(aiToggle.checked);
			});
		}

		trigger = document.getElementById('search-trigger');
		if (trigger) {
			trigger.addEventListener('click', open);
		}

		overlay.addEventListener('keydown', function(e) {
			if (e.key !== 'Tab' || !overlay.classList.contains('search-open')) return;
			var focusable = overlay.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
			if (!focusable.length) return;
			var first = focusable[0];
			var last = focusable[focusable.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		});

		document.addEventListener('keydown', function(e) {
			if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
				e.preventDefault();
				if (isPageReady()) open();
			}
			if (e.key === '/' && !isInputFocused() && !e.ctrlKey && !e.metaKey) {
				e.preventDefault();
				if (isPageReady()) open();
			}
			if (e.key === 'Escape' && overlay.classList.contains('search-open')) {
				close();
			}
		});
	}

	function isInputFocused() {
		var tag = document.activeElement && document.activeElement.tagName;
		return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
	}

	function open() {
		if (!isPageReady()) return;
		if (!trigger) trigger = document.getElementById('search-trigger');
		init();
		if (overlay.classList.contains('search-open')) {
			input.focus();
			input.select();
			return;
		}
		lastFocus = document.activeElement;
		overlay.inert = false;
		overlay.removeAttribute('aria-hidden');
		overlay.classList.add('search-open');
		if (trigger) trigger.setAttribute('aria-expanded', 'true');
		document.body.style.overflow = 'hidden';
		window.dispatchEvent(new CustomEvent('mnsearch:open'));
		setTimeout(function() { input.focus(); }, 100);
	}

	function isPageReady() {
		return !document.getElementById('loader') || document.getElementById('loader').style.display === 'none';
	}

	function close() {
		if (!overlay) return;
		if (overlay.contains(document.activeElement)) {
			lastFocus = trigger || lastFocus;
			if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
		}
		overlay.classList.remove('search-open');
		overlay.inert = true;
		overlay.setAttribute('aria-hidden', 'true');
		if (trigger) trigger.setAttribute('aria-expanded', 'false');
		document.body.style.overflow = '';
		if (abortController) {
			abortController.abort();
			abortController = null;
		}
		clearTimeout(debounceTimer);
	}

	function onInput() {
		var query = input.value.trim();
		clearTimeout(debounceTimer);
		updateSearchModeHint(query);
		if (query.length < 2) {
			showEmptyState();
			return;
		}
		debounceTimer = setTimeout(function() { doSearch(query); }, 200);
	}

	/* Mirrors detectSearchMode() in search_lib.php. */
	function detectMode(query) {
		if (query.length >= 2 && query.charAt(0) === '/' && query.charAt(query.length - 1) === '/') return 'regex';
		if (query.charAt(0) === '~' && query.length > 1) return 'fuzzy';
		return 'normal';
	}

	function updateSearchModeHint(query) {
		var hint = document.getElementById('search-hint-mode');
		if (!hint) return;
		var mode = detectMode(query);
		if (mode === 'regex') {
			hint.textContent = 'regex mode';
			hint.className = 'search-hint-mode search-hint-mode-regex';
		} else if (mode === 'fuzzy') {
			hint.textContent = 'fuzzy mode';
			hint.className = 'search-hint-mode search-hint-mode-fuzzy';
		} else {
			hint.textContent = '';
			hint.className = 'search-hint-mode';
		}
	}

	function doSearch(rawQuery) {
		var query = normalizeSmartQuotes(rawQuery);
		var seq = ++searchSeq;
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();

		resultsContainer.innerHTML = '<div class="search-loading"><div class="search-spinner"></div></div>';
		activeIndex = -1;

		var semantic = null;
		if (semanticEnabled && detectMode(query) === 'normal' && window.MNSemantic) {
			semantic = window.MNSemantic.load().catch(function() { return null; });
		}

		fetch('search.php?q=' + encodeURIComponent(query), {
			signal: abortController.signal
		})
		.then(function(r) { return r.json(); })
		.then(function(data) {
			if (seq !== searchSeq) return;
			if (data.error) {
				renderError(data.error, query);
				return;
			}
			var mode = data.mode || 'normal';
			var items = data.results && data.results.length > 0 ? data.results : (data.grouped || []);
			var hlQuery = query;
			if (mode === 'regex' && items.length > 0) {
				hlQuery = extractMatchFromSnippet(items[0].snippet || '', query);
			} else if (mode === 'fuzzy') {
				hlQuery = '';
			}
			renderResults(items || [], query, hlQuery, mode, data.total);

			if (!semantic || mode !== 'normal') return;
			if (items.length === 0) showSemanticPending();
			semantic.then(function() {
				if (seq !== searchSeq || !window.MNSemantic) return;
				var meaning = window.MNSemantic.search(query, { limit: 60, maxPerPage: 5 });
				if (!meaning || meaning.length === 0) {
					if (items.length === 0) renderResults([], query, query, 'normal', 0);
					return;
				}
				var fused = fuseResults(items, meaning, isQuestionLike(query));
				renderResults(fused, query, query, 'normal', fused.length);
			});
		})
		.catch(function(err) {
			if (err.name === 'AbortError') return;
			if (seq !== searchSeq) return;
			renderError('Search failed. Please try again.', query);
		});
	}

	function showSemanticPending() {
		resultsContainer.innerHTML =
			'<div class="search-loading"><div class="search-spinner"></div>' +
			'<p class="search-loading-label">Searching by meaning…</p></div>';
		window.dispatchEvent(new CustomEvent('mnsearch:results', { detail: { count: 0 } }));
	}

	function setSemanticEnabled(enabled) {
		semanticEnabled = !!enabled;
		try {
			window.localStorage.setItem('mn_search_ai', semanticEnabled ? '1' : '0');
		} catch (e) {
			/* private mode: the preference simply does not persist */
		}
		var toggle = overlay && overlay.querySelector('#search-ai-toggle');
		if (toggle) toggle.checked = semanticEnabled;
		if (overlay && overlay.classList.contains('search-open') && input) {
			var query = input.value.trim();
			if (query.length >= 2) doSearch(query);
		}
	}

	function isQuestionLike(query) {
		if (query.indexOf('?') !== -1) return true;
		var words = query.toLowerCase().split(/\s+/).filter(function(word) { return word.length > 0; });
		if (words.length >= 4) return true;
		return /^(what|why|how|when|where|which|who|whom|whose|does|do|did|is|are|was|were|can|could|should|would|explain|describe|difference|compare)\b/.test(words[0] || '');
	}

	/* Question-like queries follow the semantic ranking and append lexical
	 * matches that it missed. Shorter keyword queries use reciprocal rank
	 * fusion, where exact terms keep their weight. */
	function fuseResults(lexical, meaning, questionLike) {
		lexical = lexical || [];
		meaning = meaning || [];

		if (questionLike) {
			var seen = Object.create(null);
			var ordered = [];
			meaning.slice(0, 40).forEach(function(result) {
				seen[result.url || (result.page + '|' + result.title)] = true;
				ordered.push(result);
			});
			for (var i = 0; i < lexical.length && ordered.length < 60; i++) {
				var key = lexical[i].url || (lexical[i].page + '|' + lexical[i].title);
				if (seen[key]) continue;
				seen[key] = true;
				ordered.push(lexical[i]);
			}
			return ordered;
		}

		var k = 60;
		var byKey = Object.create(null);
		var merged = [];

		function add(result, position, semantic) {
			var key = result.url || (result.page + '|' + result.title);
			var entry = byKey[key];
			if (!entry) {
				entry = {};
				for (var p in result) {
					if (Object.prototype.hasOwnProperty.call(result, p)) entry[p] = result[p];
				}
				entry._rrf = 0;
				entry._lexical = false;
				entry._semantic = false;
				byKey[key] = entry;
				merged.push(entry);
			}
			entry._rrf += 1 / (k + position + 1);
			if (semantic) {
				entry._semantic = true;
				if (!entry._lexical) {
					entry.snippet = result.snippet;
					entry.title = result.title;
					entry.img = result.img || entry.img;
				}
			} else {
				entry._lexical = true;
			}
		}

		lexical.forEach(function(result, i) { add(result, i, false); });
		meaning.forEach(function(result, i) { add(result, i, true); });
		merged.sort(function(a, b) { return b._rrf - a._rrf; });
		merged.forEach(function(entry) {
			entry.semantic = entry._semantic && !entry._lexical;
			delete entry._rrf;
			delete entry._lexical;
			delete entry._semantic;
		});
		return merged;
	}

	function renderError(message, query) {
		resultsContainer.innerHTML =
			'<div class="search-error">' +
				escHtml(message) +
				(query ? ' for <strong>' + escHtml(query) + '</strong>' : '') +
			'</div>';
	}

	function renderResults(results, query, hlQuery, mode, total) {
		mode = mode || 'normal';
		hlQuery = hlQuery || (mode === 'normal' ? query : '');
		if (results.length === 0) {
			resultsContainer.innerHTML =
				'<div class="search-empty">' +
					'<div class="search-empty-icon">&#128533;</div>' +
					'<p>No results found for <strong>' + escHtml(query) + '</strong></p>' +
				'</div>';
			window.dispatchEvent(new CustomEvent('mnsearch:results', { detail: { count: 0 } }));
			return;
		}

		total = total || results.length;
		window.dispatchEvent(new CustomEvent('mnsearch:results', { detail: { count: total } }));

		/* Show every match, grouped under its page so the count matches what is rendered. */
		var groups = [];
		var groupByPage = {};
		results.forEach(function(r) {
			var g = groupByPage[r.page];
			if (!g) {
				g = { page: r.page, title: r.pageTitle || r.page, items: [] };
				groupByPage[r.page] = g;
				groups.push(g);
			}
			g.items.push(r);
		});

		var html = '<div class="search-results-count">' + total + ' match' + (total !== 1 ? 'es' : '') + ' across ' + groups.length + ' page' + (groups.length !== 1 ? 's' : '') + ' for <strong>' + escHtml(query) + '</strong></div>';

		groups.forEach(function(g) {
			html += '<div class="search-page-group">' +
				'<a href="' + escAttr(g.page) + '" class="search-page-title" data-search-nav>' +
					escHtml(g.title) +
					(g.items.length > 1 ? ' <span class="search-result-badge">' + g.items.length + '</span>' : '') +
				'</a>';

			g.items.forEach(function(r, i) {
				html += '<a href="' + escAttr(r.url) + '" class="search-result-item' + (r.img ? ' search-result-has-img' : '') + '" data-index="' + i + '" data-search-nav>' +
					(r.img ? '<div class="search-result-thumb"><img src="' + escAttr(r.img) + '" alt="" loading="lazy"></div>' : '') +
					'<div class="search-result-body">' +
					'<div class="search-result-title">' +
						escHtml(r.title) +
						(r.semantic ? ' <span class="search-result-badge search-result-badge-semantic">meaning</span>' : '') +
					'</div>' +
					'<div class="search-result-snippet">' + highlightText(escHtml(r.snippet), hlQuery, mode) + '</div>' +
					'</div>' +
				'</a>';
			});

			html += '</div>';
		});

		resultsContainer.innerHTML = html;

		resultsContainer.querySelectorAll('[data-search-nav]').forEach(function(el) {
			el.addEventListener('click', function(e) {
				e.preventDefault();
				var href = el.getAttribute('href');
				window.dispatchEvent(new CustomEvent('mnsearch:select', { detail: { url: href, index: el.getAttribute('data-index') || '-1' } }));
				navigateToResult(href);
			});
		});
	}

	function navigateToResult(url) {
		var parts = url.split('#');
		var page = parts[0];
		var hash = parts[1] || '';
		var current = window.location.pathname.replace(/\.php$/, '').split('/').pop() || 'index';
		if (page === current) {
			close();
			if (hash) {
				setTimeout(function() {
					var target = findHeadingBySlug(hash);
					if (target) {
						target.scrollIntoView({ behavior: 'smooth', block: 'center' });
						target.classList.add('search-target-flash');
					}
				}, 100);
			}
			return;
		}
		close();
		window.location.href = page + '.php' + (hash ? '#' + hash : '');
	}

	function onKeyDown(e) {
		var items = resultsContainer.querySelectorAll('.search-result-item');
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = Math.min(activeIndex + 1, items.length - 1);
			updateActive(items);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, -1);
			updateActive(items);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (activeIndex >= 0 && items[activeIndex]) {
				items[activeIndex].click();
			}
		}
	}

	function updateActive(items) {
		items.forEach(function(item, i) {
			item.classList.toggle('search-result-active', i === activeIndex);
		});
		if (activeIndex >= 0 && items[activeIndex]) {
			items[activeIndex].scrollIntoView({ block: 'nearest' });
		}
	}

	function normalizeSmartQuotes(str) {
		return str
			.replace(/[\u2018\u2019\u201A\u201B]/g, "'")
			.replace(/[\u201C\u201D\u201E\u201F]/g, '"')
			.replace(/\u00AB/g, '"')
			.replace(/\u00BB/g, '"');
	}

	function showEmptyState() {
		if (!resultsContainer) return;
		resultsContainer.innerHTML =
			'<div class="search-empty">' +
				'<div class="search-empty-icon">&#128269;</div>' +
				'<p>Start typing, or ask a question in plain language</p>' +
			'</div>';
	}

	function extractMatchFromSnippet(snippet, regexQuery) {
		try {
			var m = snippet.match(new RegExp(regexQuery.replace(/^\/(.+)\/$/, '$1'), 'i'));
			return m ? m[0] : '';
		} catch(e) { return ''; }
	}

	function splitTerms(query) {
		return query.split(/\s+/).filter(function(t) { return t.length >= 2; });
	}

	function escapeRegExp(str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	/* Highlight each query term (or the whole regex match) with <mark>. */
	function highlightText(text, query, mode) {
		if (!query) return text;
		mode = mode || 'normal';
		var cls = 'search-match';
		if (mode === 'regex') cls = 'search-match-regex';
		else if (mode === 'fuzzy') cls = 'search-match-fuzzy';

		if (mode === 'regex') {
			return text.replace(new RegExp('(' + escapeRegExp(query) + ')', 'gi'), '<mark class="' + cls + '">$1</mark>');
		}
		if (mode === 'fuzzy') {
			return text;
		}

		var terms = splitTerms(query);
		if (terms.length === 0) return text;

		var escaped = terms.map(escapeRegExp);
		var re = new RegExp('(' + escaped.join('|') + ')', 'gi');
		var parts = text.split(re);
		return parts.map(function(part, i) {
			if (i % 2 === 1) return '<mark class="' + cls + '">' + part + '</mark>';
			return part;
		}).join('');
	}

	function escHtml(str) {
		var div = document.createElement('div');
		div.appendChild(document.createTextNode(str));
		return div.innerHTML;
	}

	function escAttr(str) {
		return escHtml(str).replace(/"/g, '&quot;');
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	window.initSearch = {
		open: open,
		_internals: {
			detectMode: detectMode,
			normalizeSmartQuotes: normalizeSmartQuotes,
			splitTerms: splitTerms,
			highlightText: highlightText,
			extractMatchFromSnippet: extractMatchFromSnippet,
			isQuestionLike: isQuestionLike,
			fuseResults: fuseResults,
			isSemanticEnabled: function() { return semanticEnabled; },
			setSemanticEnabled: setSemanticEnabled
		}
	};

	if (window.location.hash) {
		var hash = window.location.hash.slice(1);
		if (hash) {
			document.addEventListener('DOMContentLoaded', function() {
				setTimeout(function() {
					var target = findHeadingBySlug(hash);
					if (target) {
						target.scrollIntoView({ behavior: 'smooth', block: 'center' });
						target.classList.add('search-target-flash');
					}
				}, 600);
			});
		}
	}

	function findHeadingBySlug(slug) {
		var targetSlug = slug.replace(/-+/g, ' ').toLowerCase().trim();

		var byId = document.getElementById(slug);
		if (byId) return byId;

		var headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [data-headline]');
		for (var i = 0; i < headers.length; i++) {
			var h = headers[i];
			var text = (h.dataset.headline || h.textContent).toLowerCase().trim();
			var hSlug = text.replace(/[^\w\s\p{L}]/gu, '').replace(/\s+/g, ' ').trim();
			if (hSlug === targetSlug) return h;
			var hSlug2 = text.replace(/[^\w\s]/g, '').replace(/\s+/g, '-').replace(/^-|-$/g, '');
			if (hSlug2 === slug) return h;
		}
		return null;
	}
})();
