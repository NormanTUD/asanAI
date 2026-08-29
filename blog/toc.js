function slugify(text, usedIds) {
	var base = String(text || '')
		.toLowerCase()
		.replace(/[‘’]/g, "'")
		.replace(/[^\p{L}\p{N}\s\-·]+/gu, '')
		.replace(/[\s·]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);

	if (!usedIds || !base) return base;

	var candidate = base;
	var n = 2;
	while (usedIds.has(candidate)) {
		candidate = base + '-' + n;
		n++;
	}
	usedIds.add(candidate);
	return candidate;
}

function toc() {
	if (window.location.pathname.endsWith("index.php") || window.location.pathname.endsWith("/blog/") || window.location.pathname.endsWith("/blog")) {
		return;
	}

	updateLoadingStatus("Building Table of Contents...");

	var tocDiv = document.getElementById("toc");
	var contents = document.getElementById("contents");
	if (!contents) {
		console.error("#contents not found (toc)");
		return;
	}

	if (!tocDiv) {
		tocDiv = document.createElement('div');
		tocDiv.id = 'toc';
		tocDiv.innerHTML = '';
		contents.prepend(tocDiv);
	}

	var urlParams = new URLSearchParams(window.location.search);
	var shouldExpandAll = urlParams.get('opentoc') === '1';

	var storageKey = 'toc-state:' + window.location.pathname;
	var storedState = {};
	try {
		var raw = localStorage.getItem(storageKey);
		if (raw) storedState = JSON.parse(raw) || {};
	} catch (e) { /* noop */ }

	// 1. Setup Styles
	var s = document.createElement("style");
	s.textContent = [
		'#toc { font-family: system-ui, sans-serif; background: #fafafa; padding: 14px 18px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0; line-height: 1.35; }',
		'#toc-toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }',
		'#toc-toolbar input[type="search"] { flex: 1; min-width: 140px; padding: 5px 10px; font-size: 0.85em; border: 1px solid #ccc; border-radius: 4px; font-family: inherit; }',
		'#toc-toolbar input[type="search"]:focus { outline: none; border-color: #66f; box-shadow: 0 0 0 2px rgba(102,102,255,0.2); }',
		'#toc-toolbar button { padding: 5px 12px; font-size: 0.8em; background: #fff; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-family: inherit; color: #333; }',
		'#toc-toolbar button:hover { background: #eef; border-color: #99c; }',
		'#toc-toolbar button:active { background: #dde; }',
		'#toc > ul { display: grid; grid-template-columns: 1fr; gap: 0 20px; padding: 0; margin: 0; list-style: none; }',
		'#toc ul { list-style: none; margin: 2px 0; }',
		'#toc ul ul { padding-left: 16px; border-left: 2px solid #e5e5e5; margin-left: 6px; }',
		'#toc ul.collapsible { max-height: 0; overflow: hidden; transition: none; }',
		'#toc.toc-ready ul.collapsible { transition: max-height 0.3s ease; }',
		'#toc li.expanded > ul.collapsible { max-height: 5000px; }',
		'#toc a { text-decoration: none; color: #0044aa; font-size: 0.88em; cursor: pointer; }',
		'#toc a:hover { text-decoration: underline; color: #cc3300; }',

		// Main chapter (h2) styling
		'#toc li.toc-level-2 > a { font-weight: 600; font-size: 0.95em; color: #222; display: block; padding: 2px 0; }',
		'#toc li.toc-level-2 > a:hover { color: #cc3300; }',
		'#toc li.toc-level-2 .toc-num { display: inline-block; min-width: 1.8em; color: #888; font-weight: 400; margin-right: 2px; font-variant-numeric: tabular-nums; }',

		// Sub-section (h3+) styling
		'#toc li.toc-level-3 > a, #toc li.toc-level-4 > a, #toc li.toc-level-5 > a, #toc li.toc-level-6 > a { font-weight: 400; color: #0044aa; }',

		// Optional content styling
		'#toc li.toc-optional > a { color: #666; font-style: italic; }',
		'#toc li.toc-optional > a:hover { color: #cc3300; }',
		'#toc .toc-opt-badge { display: inline-block; font-size: 0.65em; color: #999; font-style: normal; font-weight: 400; margin-left: 4px; padding: 0 4px; border: 1px solid #ccc; border-radius: 3px; vertical-align: middle; letter-spacing: 0.02em; }',

		// Meta: word count / reading time
		'#toc .toc-meta { display: inline-block; margin-left: 6px; color: #999; font-size: 0.75em; font-weight: 400; font-variant-numeric: tabular-nums; white-space: nowrap; }',

		// Toggle icon
		'.toggle-icon { display: inline-block; width: 12px; cursor: pointer; color: #888; font-size: 0.75em; user-select: none; visibility: hidden; }',
		'.has-children > .toggle-icon { visibility: visible; }',

		// Layout helpers
		'.toc-item { margin: 1px 0; }',
		'#toc li.toc-level-2 { margin-top: 4px; }',
		'#toc .toc-row { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; }',
		'#toc .toc-row > a { flex: 1; min-width: 0; }',
		'#toc .toc-row > .toc-meta { flex: 0 0 auto; }',

		// Filter
		'#toc.filtering li.toc-hidden { display: none; }',
		'#toc.filtering li.toc-match > ul, #toc.filtering li.toc-ancestor-match > ul { display: block !important; max-height: none !important; overflow: visible !important; }',
		'#toc.filtering li.toc-match > a, #toc.filtering li.toc-ancestor-match > a { font-weight: 600; }',

		'@media (prefers-reduced-motion: reduce) { #toc ul.collapsible, #toc.toc-ready ul.collapsible { transition: none; } }'
	].join('\n');
	document.head.appendChild(s);

	// 2. Collect headings.
	// Skip the first h1 — it's the page title from incl() and is already
	// rendered as the visible page heading. Including it as a TOC item would
	// produce a redundant "Coherent Difference" line at the top of the TOC.
	var allHeaders = Array.from(contents.querySelectorAll("h1, h2, h3, h4, h5, h6"));
	if (allHeaders.length && allHeaders[0].tagName === 'H1') {
		allHeaders.shift();
	}
	var headers = allHeaders;

	var rootUl = document.createElement("ul");
	var stack = [{ level: 0, element: rootUl }];
	var usedIds = new Set();
	var chapterNumber = 0; // counter for h2-level main chapters

	// --- Helpers ---------------------------------------------------------

	// Extract the title text of a heading. Headings may contain inline LaTeX
	// like `$\Omega$` whose source we'd otherwise see in textContent. Render
	// math on a detached clone with `annotate: false`, strip any pre-existing
	// annotations, and read the rendered text.
	function getHeaderTitle(header) {
		var clone = header.cloneNode(true);
		clone.querySelectorAll('annotation, [data-mjx-annotation], mjx-annotation')
			.forEach(function(a) { a.remove(); });

		if (clone.textContent.indexOf('$') !== -1 &&
			typeof temml !== 'undefined' && temml.renderMathInElement) {
			try {
				temml.renderMathInElement(clone, {
					delimiters: [
						{ left: '$$', right: '$$', display: true },
						{ left: '$',  right: '$',  display: false }
					],
					annotate: false,
					throwOnError: false
				});
			} catch (e) { /* noop */ }
		}
		return clone.textContent.trim();
	}

	// Flat index of every element inside `#contents`, in document order.
	// Used to compute a heading's "section" — i.e. all elements after it
	// until the next heading at the same or higher level. We build the
	// index once and reuse it for every heading, instead of doing an
	// O(N) tree-walk per heading.
	var flatElements = Array.prototype.slice.call(
		contents.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, ul, ol, li, blockquote, figure, table, pre, span')
	);
	var headingIndex = new Map();
	flatElements.forEach(function(el, i) {
		if (/^H[1-6]$/.test(el.tagName)) {
			headingIndex.set(el, i);
		}
	});

	function getSectionText(header) {
		var level = parseInt(header.tagName.substring(1));
		var startIdx = headingIndex.get(header);
		if (startIdx === undefined) return '';

		var range = document.createRange();
		range.setStartAfter(header);

		for (var i = startIdx + 1; i < flatElements.length; i++) {
			var el = flatElements[i];
			if (/^H[1-6]$/.test(el.tagName)) {
				var nodeLevel = parseInt(el.tagName.substring(1));
				if (nodeLevel <= level) {
					range.setEndBefore(el);
					break;
				}
			}
		}

		var text = range.toString();
		if (typeof range.detach === 'function') range.detach();
		return text;
	}

	function countWords(text) {
		if (!text) return 0;
		// Match runs of word characters; ignore pure numbers / punctuation.
		var matches = text.match(/[\p{L}][\p{L}\p{N}'’\-]*/gu);
		return matches ? matches.length : 0;
	}

	function formatReadingTime(words) {
		if (!words) return '';
		var minutes = words / 220; // average reading speed: ~220 wpm
		if (minutes < 0.5) return '< 1 min';
		if (minutes < 1.5) return '1 min';
		return Math.round(minutes) + ' min';
	}

	// True if any ancestor of `header` is an .optional box.
	function isInOptional(header) {
		var node = header.parentElement;
		while (node && node !== document.body) {
			if (node.classList && node.classList.contains('optional')) {
				return true;
			}
			node = node.parentElement;
		}
		return false;
	}

	// --- State persistence ----------------------------------------------

	function saveState() {
		var state = {};
		tocDiv.querySelectorAll('li.has-children').forEach(function(li) {
			var link = li.querySelector(':scope > .toc-row > a');
			if (!link) return;
			var href = link.getAttribute('href') || '';
			if (href) state[href] = li.classList.contains('expanded');
		});
		try {
			localStorage.setItem(storageKey, JSON.stringify(state));
		} catch (e) { /* noop */ }
	}

	// --- Build the tree --------------------------------------------------

	headers.forEach(function(header) {
		var level = parseInt(header.tagName.substring(1));
		var titleText = getHeaderTitle(header);

		var lastLevel = stack[stack.length - 1].level;
		if (lastLevel !== 0 && level > lastLevel + 1) {
			console.error('TOC Error: Level skipped! Found <' + header.tagName + '>. Text: "' + titleText.substring(0, 30) + '..."');
		}

		while (stack.length > 1 && stack[stack.length - 1].level >= level) {
			stack.pop();
		}

		var parentObj = stack[stack.length - 1];
		var parentUl = parentObj.element;

		var li = document.createElement("li");
		li.className = "toc-item toc-level-" + level;
		if (isInOptional(header)) {
			li.classList.add("toc-optional");
		}

		if (shouldExpandAll || parentObj.level === 0) {
			li.classList.add("expanded");
		}

		var toggle = document.createElement("span");
		toggle.className = "toggle-icon";
		toggle.innerHTML = li.classList.contains("expanded") ? "▾ " : "▸ ";

		// Assign a stable, unique id so the link is focusable, shareable,
		// and so the scroll-spy + n/p shortcuts in polish.js (which resolve
		// targets via href) actually work. Dedup so two headings with the
		// same text don't collide.
		if (!header.id) {
			header.id = slugify(titleText, usedIds);
		} else if (usedIds.has(header.id)) {
			console.warn('TOC: duplicate heading id "' + header.id + '", renaming');
			header.id = slugify(titleText, usedIds);
		} else {
			usedIds.add(header.id);
		}

		// Layout: [toggle] [row: number?] [link] [meta]
		var row = document.createElement("div");
		row.className = "toc-row";
		li.appendChild(toggle);

		// Number main chapters (h2 only) so the TOC reads like a book.
		// We reset the counter only on encountering a new h2 (not when we
		// descend into h3/h4 sub-sections) — so the chapter count is
		// monotonic through the whole document.
		if (level === 2) {
			chapterNumber += 1;
			var numSpan = document.createElement("span");
			numSpan.className = "toc-num";
			numSpan.textContent = chapterNumber + '.';
			row.appendChild(numSpan);
		}

		var link = document.createElement("a");
		link.textContent = titleText;
		if (header.id) {
			link.href = '#' + header.id;
		}

		// Optional-content badge: a small "opt" tag so the reader can tell
		// at a glance which sub-sections live inside a foldable aside.
		if (li.classList.contains("toc-optional")) {
			var badge = document.createElement("span");
			badge.className = "toc-opt-badge";
			badge.textContent = 'opt';
			badge.title = 'Inhalt einer optionalen Box';
			link.appendChild(document.createTextNode(' '));
			link.appendChild(badge);
		}

		// Event listener for smooth scrolling
		link.addEventListener("click", function(e) {
			e.preventDefault();
			if (typeof revealAncestorOptionalBlocks === 'function') {
				revealAncestorOptionalBlocks(header);
			}
			header.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});

		row.appendChild(link);

		// Reading-time / word-count meta on h2 chapters (and h3 if there's
		// room). Skip h4+ to keep the TOC visually clean.
		if (level <= 3) {
			var sectionText = getSectionText(header);
			var words = countWords(sectionText);
			if (words > 0) {
				var meta = document.createElement("span");
				meta.className = "toc-meta";
				meta.textContent = formatReadingTime(words);
				meta.title = words + ' Wörter';
				row.appendChild(meta);
			}
		}

		li.appendChild(row);
		parentUl.appendChild(li);

		if (parentObj.level > 0) {
			var parentLi = parentUl.parentElement;
			if (parentLi && parentLi.tagName === "LI") {
				parentLi.classList.add("has-children");
			}
		}

		var nextUl = document.createElement("ul");
		nextUl.classList.add("collapsible");
		li.appendChild(nextUl);
		stack.push({ level: level, element: nextUl });

		li.addEventListener("click", function(e) {
			if (e.target.tagName !== "A" && li.classList.contains("has-children")) {
				e.stopPropagation();
				li.classList.toggle("expanded");
				toggle.innerHTML = li.classList.contains("expanded") ? "▾ " : "▸ ";
				saveState();
			}
		});
	});

	// Restore persisted state BEFORE first paint so transitions don't
	// animate the initial restore.
	if (!shouldExpandAll) {
		Object.keys(storedState).forEach(function(href) {
			var found = tocDiv.querySelector('a[href="' + href + '"]');
			if (!found) return;
			var li = found.parentElement.parentElement; // .toc-row wrapper -> li
			var wantsExpanded = !!storedState[href];
			li.classList.toggle('expanded', wantsExpanded);
			var t = li.querySelector(':scope > .toggle-icon');
			if (t) t.innerHTML = wantsExpanded ? '▾ ' : '▸ ';
		});
	}

	// 3. Final Cleanup
	tocDiv.innerHTML = "";

	// Toolbar
	var toolbar = document.createElement("div");
	toolbar.id = "toc-toolbar";

	var searchInput = document.createElement("input");
	searchInput.type = "search";
	searchInput.placeholder = "Filter TOC…";
	searchInput.setAttribute('aria-label', 'Filter table of contents');
	toolbar.appendChild(searchInput);

	var expandAllBtn = document.createElement("button");
	expandAllBtn.type = "button";
	expandAllBtn.textContent = "Expand all";
	toolbar.appendChild(expandAllBtn);

	var collapseAllBtn = document.createElement("button");
	collapseAllBtn.type = "button";
	collapseAllBtn.textContent = "Collapse all";
	toolbar.appendChild(collapseAllBtn);

	tocDiv.appendChild(toolbar);
	tocDiv.appendChild(rootUl);

	function setAllExpanded(wantExpanded) {
		tocDiv.querySelectorAll('li.has-children').forEach(function(li) {
			li.classList.toggle('expanded', wantExpanded);
			var t = li.querySelector(':scope > .toggle-icon');
			if (t) t.innerHTML = wantExpanded ? '▾ ' : '▸ ';
		});
		saveState();
	}

	expandAllBtn.addEventListener('click', function() {
		setAllExpanded(true);
	});

	collapseAllBtn.addEventListener('click', function() {
		setAllExpanded(false);
	});

	function applyFilter(q) {
		q = (q || '').trim().toLowerCase();
		var allLis = tocDiv.querySelectorAll('li');
		if (!q) {
			tocDiv.classList.remove('filtering');
			allLis.forEach(function(li) {
				li.classList.remove('toc-hidden', 'toc-match', 'toc-ancestor-match');
			});
			return;
		}
		tocDiv.classList.add('filtering');
		allLis.forEach(function(li) {
			li.classList.remove('toc-hidden', 'toc-match', 'toc-ancestor-match');
			var link = li.querySelector(':scope > .toc-row > a');
			if (!link) return;
			if (link.textContent.toLowerCase().indexOf(q) !== -1) {
				li.classList.add('toc-match');
			}
		});
		// Mark ancestors of matches by walking up the tree
		tocDiv.querySelectorAll('li.toc-match').forEach(function(li) {
			var parent = li.parentElement;
			while (parent && parent !== tocDiv) {
				if (parent.tagName === 'LI') {
					parent.classList.add('toc-ancestor-match');
				}
				parent = parent.parentElement;
			}
		});
		// Hide everything that isn't a match or an ancestor of one
		allLis.forEach(function(li) {
			if (!li.classList.contains('toc-match') && !li.classList.contains('toc-ancestor-match')) {
				li.classList.add('toc-hidden');
			}
		});
	}

	searchInput.addEventListener('input', function() {
		applyFilter(searchInput.value);
	});

	searchInput.addEventListener('keydown', function(e) {
		if (e.key === 'Escape') {
			searchInput.value = '';
			applyFilter('');
			searchInput.blur();
		}
	});

	// Remove empty uls and clean up their parent has-children markers
	tocDiv.querySelectorAll("ul").forEach(function(ul) {
		if (ul.children.length === 0) {
			var parentLi = ul.parentElement;
			ul.remove();
			if (parentLi && parentLi.tagName === "LI" && parentLi.classList.contains("has-children")) {
				var stillHasChildUl = parentLi.querySelector(':scope > ul');
				if (!stillHasChildUl) {
					parentLi.classList.remove("has-children");
				}
			}
		}
	});

	// Enable transitions AFTER first paint so the initial render doesn't
	// animate; subsequent toggles then animate smoothly.
	requestAnimationFrame(function() {
		tocDiv.classList.add('toc-ready');
	});

	updateLoadingStatus("Build Table of Contents.");
}
