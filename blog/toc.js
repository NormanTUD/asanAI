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
	// Minimalist TOC: no boxes, no backgrounds, no badges. Just typography,
	// hierarchy by indent + weight, hover for interactivity, and a quiet
	// meta line on the right for reading time.
	var s = document.createElement("style");
	s.textContent = [
		// Container — no border, no background, just a hairline rule above.
		'#toc { font-family: system-ui, -apple-system, sans-serif; color: #1f2328; padding: 18px 0 4px; margin: 24px 0; line-height: 1.55; border-top: 1px solid #d0d7de; }',
		'#toc-toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; font-size: 0.8em; color: #656d76; }',
		'#toc-toolbar input[type="search"] { flex: 1; min-width: 140px; padding: 4px 8px; font-size: 1em; border: none; border-bottom: 1px solid #d0d7de; border-radius: 0; background: transparent; font-family: inherit; color: #1f2328; outline: none; }',
		'#toc-toolbar input[type="search"]:focus { border-bottom-color: #1f2328; }',
		'#toc-toolbar button { padding: 4px 10px; font-size: 1em; background: transparent; border: none; cursor: pointer; font-family: inherit; color: #656d76; border-radius: 4px; }',
		'#toc-toolbar button:hover { background: #f6f8fa; color: #1f2328; }',

		// Tree layout.
		'#toc > ul, #toc ul { list-style: none; padding: 0; margin: 0; }',
		'#toc ul ul { padding-left: 1.4em; }',
		'#toc ul.collapsible { max-height: 0; overflow: hidden; transition: none; }',
		'#toc.toc-ready ul.collapsible { transition: max-height 0.25s ease; }',
		'#toc li.expanded > ul.collapsible { max-height: 5000px; }',
		'#toc li { list-style: none; }',

		// Links: just text, no decoration except on hover.
		'#toc a { text-decoration: none; color: inherit; cursor: pointer; }',
		'#toc a:hover { text-decoration: underline; text-underline-offset: 3px; }',

		// Hierarchy: only two visible levels — chapter vs sub-section.
		// Chapter (h2) is slightly bigger and darker; sub-section (h3+) is
		// the same size but lighter, indented.
		'#toc .toc-row { display: flex; align-items: baseline; justify-content: space-between; gap: 1em; padding: 2px 0; }',
		'#toc .toc-row > a { flex: 1; min-width: 0; }',
		'#toc li.toc-level-2 > .toc-row > a { font-weight: 500; color: #1f2328; }',
		'#toc li.toc-level-3 > .toc-row > a, #toc li.toc-level-4 > .toc-row > a, #toc li.toc-level-5 > .toc-row > a, #toc li.toc-level-6 > .toc-row > a { color: #57606a; font-weight: 400; }',

		// Optional content: same color, italic. No badge, no border.
		'#toc li.toc-optional > .toc-row > a { color: #8c959f; font-style: italic; }',
		'#toc li.toc-optional > .toc-row > a:hover { color: #57606a; }',

		// Reading-time meta on the right: very small, tabular, muted.
		'#toc .toc-meta { flex: 0 0 auto; font-size: 0.78em; color: #8c959f; font-variant-numeric: tabular-nums; font-weight: 400; }',
		'#toc li.toc-level-2 > .toc-row > .toc-meta { color: #656d76; }',

		// Toggle icon — a tiny chevron before the link. Click on the
		// chevron toggles; click anywhere else on the row navigates.
		'#toc .toggle-icon { display: inline-block; width: 1em; cursor: pointer; color: #8c959f; font-size: 0.75em; user-select: none; margin-right: 4px; flex: 0 0 auto; }',
		'#toc .toggle-icon:hover { color: #1f2328; }',
		'#toc li:not(.has-children) > .toc-row > .toggle-icon { visibility: hidden; }',

		// Filter
		'#toc.filtering li.toc-hidden { display: none; }',
		'#toc.filtering li.toc-match > ul, #toc.filtering li.toc-ancestor-match > ul { display: block !important; max-height: none !important; overflow: visible !important; }',
		'#toc.filtering li.toc-match > .toc-row > a, #toc.filtering li.toc-ancestor-match > .toc-row > a { color: #1f2328; font-weight: 500; }',

		// Total reading time footer
		'#toc .toc-footer { font-size: 0.78em; color: #8c959f; margin-top: 14px; padding-top: 10px; border-top: 1px solid #eaeef2; }',

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

	var totalWords = 0; // for the footer summary

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

		// Row layout: [toggle?] [link] [meta?]
		var row = document.createElement("div");
		row.className = "toc-row";

		// A small chevron is rendered for items that have sub-sections.
		// We add it to every row, but hide it via CSS for leaves. Click
		// on the chevron toggles; click anywhere else navigates.
		var toggle = document.createElement("span");
		toggle.className = "toggle-icon";
		toggle.textContent = li.classList.contains("expanded") ? '▾' : '▸';
		row.appendChild(toggle);

		var link = document.createElement("a");
		link.textContent = titleText;
		if (header.id) {
			link.href = '#' + header.id;
		}

		link.addEventListener("click", function(e) {
			e.preventDefault();
			if (typeof revealAncestorOptionalBlocks === 'function') {
				revealAncestorOptionalBlocks(header);
			}
			header.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});

		row.appendChild(link);

		// Reading-time meta on h2/h3 chapters; skip h4+ to keep it sparse.
		if (level <= 3) {
			var sectionText = getSectionText(header);
			var words = countWords(sectionText);
			if (words > 0) {
				var meta = document.createElement("span");
				meta.className = "toc-meta";
				meta.textContent = formatReadingTime(words);
				meta.title = words + ' Wörter';
				row.appendChild(meta);
				// Add h2 chapters' words to the total; h3 sub-sections are
				// already counted within their h2's section, so summing
				// them would double-count.
				if (level === 2) totalWords += words;
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

		// Click on the chevron toggles expansion; click on the link
		// itself navigates (handled in the link's own listener above).
		toggle.addEventListener("click", function(e) {
			e.preventDefault();
			e.stopPropagation();
			li.classList.toggle("expanded");
			toggle.textContent = li.classList.contains("expanded") ? '▾' : '▸';
			saveState();
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
			if (t) t.textContent = wantsExpanded ? '▾' : '▸';
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

	// Footer with total reading time, so the reader has a one-glance
	// summary of how long the whole page takes. Skipped if we couldn't
	// measure anything.
	if (totalWords > 0) {
		var footer = document.createElement("div");
		footer.className = "toc-footer";
		var totalMin = formatReadingTime(totalWords);
		footer.textContent = 'Total: ' + totalMin + ' reading time · ' + totalWords.toLocaleString('en-US') + ' words';
		tocDiv.appendChild(footer);
	}

	function setAllExpanded(wantExpanded) {
		tocDiv.querySelectorAll('li.has-children').forEach(function(li) {
			li.classList.toggle('expanded', wantExpanded);
			var t = li.querySelector(':scope > .toggle-icon');
			if (t) t.textContent = wantExpanded ? '▾' : '▸';
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
