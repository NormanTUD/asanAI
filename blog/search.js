(function() {
	var overlay = null;
	var input = null;
	var resultsContainer = null;
	var activeIndex = -1;
	var abortController = null;
	var debounceTimer = null;

	function init() {
		if (document.getElementById('search-overlay')) return;

		overlay = document.createElement('div');
		overlay.id = 'search-overlay';
		overlay.className = 'search-overlay';
		overlay.innerHTML =
			'<div class="search-backdrop"></div>' +
			'<div class="search-modal">' +
				'<div class="search-header">' +
					'<svg class="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
					'<input type="text" class="search-input" placeholder="Search across all modules…" autofocus spellcheck="false">' +
					'<button class="search-close" aria-label="Close search">&times;</button>' +
				'</div>' +
				'<div class="search-hints">' +
					'<span class="search-hint-default">Press <kbd>Esc</kbd> to close &middot; <kbd>/pattern/</kbd> regex &middot; <kbd>~term</kbd> fuzzy</span>' +
					'<span class="search-hint-mode" id="search-hint-mode"></span>' +
				'</div>' +
				'<div class="search-results"></div>' +
			'</div>';

		document.body.appendChild(overlay);
		showEmptyState();

		input = overlay.querySelector('.search-input');
		resultsContainer = overlay.querySelector('.search-results');

		overlay.querySelector('.search-backdrop').addEventListener('click', close);
		overlay.querySelector('.search-close').addEventListener('click', close);

		input.addEventListener('input', onInput);
		input.addEventListener('keydown', onKeyDown);

		var trigger = document.getElementById('search-trigger');
		if (trigger) {
			trigger.addEventListener('click', open);
		}

		document.addEventListener('keydown', function(e) {
			if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
				e.preventDefault();
				open();
			}
			if (e.key === '/' && !isInputFocused() && !e.ctrlKey && !e.metaKey) {
				e.preventDefault();
				open();
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
		init();
		if (overlay.classList.contains('search-open')) {
			input.focus();
			input.select();
			return;
		}
		overlay.classList.add('search-open');
		document.body.style.overflow = 'hidden';
		setTimeout(function() { input.focus(); }, 100);
	}

	function close() {
		if (!overlay) return;
		overlay.classList.remove('search-open');
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

	function updateSearchModeHint(query) {
		var hint = document.getElementById('search-hint-mode');
		if (!hint) return;
		if (/^\/.+\/$/.test(query)) {
			hint.textContent = 'regex mode';
			hint.className = 'search-hint-mode search-hint-mode-regex';
		} else if (query.charAt(0) === '~' && query.length > 1) {
			hint.textContent = 'fuzzy mode';
			hint.className = 'search-hint-mode search-hint-mode-fuzzy';
		} else {
			hint.textContent = '';
			hint.className = 'search-hint-mode';
		}
	}

	function doSearch(query) {
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();

		resultsContainer.innerHTML = '<div class="search-loading"><div class="search-spinner"></div></div>';
		activeIndex = -1;

		fetch('search.php?q=' + encodeURIComponent(query), {
			signal: abortController.signal
		})
		.then(function(r) { return r.json(); })
		.then(function(data) {
			var mode = data.mode || 'normal';
			var hlQuery = query;
			if (mode === 'regex' && data.results.length > 0) {
				hlQuery = extractMatchFromSnippet(data.results[0].snippet || '', query);
			} else if (mode === 'fuzzy') {
				hlQuery = '';
			}
			renderResults(data.results || [], query, hlQuery, mode);
		})
		.catch(function(err) {
			if (err.name === 'AbortError') return;
			resultsContainer.innerHTML = '<div class="search-error">Search failed. Please try again.</div>';
		});
	}

	function renderResults(results, query, hlQuery, mode) {
		mode = mode || 'normal';
		hlQuery = hlQuery || (mode === 'normal' ? query : '');
		if (results.length === 0) {
			resultsContainer.innerHTML =
				'<div class="search-empty">' +
					'<div class="search-empty-icon">&#128533;</div>' +
					'<p>No results found for <strong>' + escHtml(query) + '</strong></p>' +
				'</div>';
			return;
		}

		var html = '<div class="search-results-count">' + results.length + ' result' + (results.length !== 1 ? 's' : '') + ' for <strong>' + escHtml(query) + '</strong></div>';
		var currentPage = '';

		results.forEach(function(r, i) {
			if (r.page !== currentPage) {
				currentPage = r.page;
				html += '<div class="search-page-group">' +
					'<a href="' + escAttr(r.page) + '" class="search-page-title" data-search-nav>' +
						escHtml(r.pageTitle) +
					'</a>';
			}

			html += '<a href="' + escAttr(r.url) + '" class="search-result-item' + (r.img ? ' search-result-has-img' : '') + '" data-index="' + i + '" data-search-nav>' +
				(r.img ? '<div class="search-result-thumb"><img src="' + escAttr(r.img) + '" alt="" loading="lazy"></div>' : '') +
				'<div class="search-result-body">' +
				'<div class="search-result-title">' + escHtml(r.title) + '</div>' +
				'<div class="search-result-snippet">' + highlightText(escHtml(r.snippet), escHtml(hlQuery), mode) + '</div>' +
				'</div>' +
			'</a>';

			var nextResult = results[i + 1];
			if (!nextResult || nextResult.page !== currentPage) {
				html += '</div>';
			}
		});

		resultsContainer.innerHTML = html;

		resultsContainer.querySelectorAll('[data-search-nav]').forEach(function(el) {
			el.addEventListener('click', function(e) {
				e.preventDefault();
				var href = el.getAttribute('href');
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
				location.hash = hash;
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

	function showEmptyState() {
		if (!resultsContainer) return;
		resultsContainer.innerHTML =
			'<div class="search-empty">' +
				'<div class="search-empty-icon">&#128269;</div>' +
				'<p>Start typing to search across all course modules</p>' +
			'</div>';
	}

	function extractMatchFromSnippet(snippet, regexQuery) {
		try {
			var m = snippet.match(new RegExp(regexQuery.replace(/^\/(.+)\/$/, '$1'), 'i'));
			return m ? m[0] : '';
		} catch(e) { return ''; }
	}

	function highlightText(text, query, mode) {
		if (!query) return text;
		mode = mode || 'normal';
		var cls = 'search-match';
		if (mode === 'regex') cls = 'search-match-regex';
		else if (mode === 'fuzzy') cls = 'search-match-fuzzy';
		var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		var re = new RegExp('(' + escaped + ')', 'gi');
		return text.replace(re, '<mark class="' + cls + '">$1</mark>');
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

	window.initSearch = { open: open };

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
		var headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
		var targetSlug = slug.replace(/-+/g, ' ').toLowerCase().trim();
		for (var i = 0; i < headers.length; i++) {
			var h = headers[i];
			var text = h.textContent.toLowerCase().trim();
			var hSlug = text.replace(/[^\w\s\p{L}]/gu, '').replace(/\s+/g, ' ').trim();
			if (hSlug === targetSlug) return h;
			var hSlug2 = text.replace(/[^\w\s]/g, '').replace(/\s+/g, '-').replace(/^-|-$/g, '');
			if (hSlug2 === slug) return h;
		}
		return null;
	}
})();
