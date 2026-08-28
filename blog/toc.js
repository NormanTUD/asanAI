function slugify(text, usedIds) {
	var base = String(text || '')
		.toLowerCase()
		.replace(/[‘’]/g, "'")
		.replace(/[^\w\s\-·]+/g, '')
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
		'#toc { font-family: system-ui, sans-serif; background: #fafafa; padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0; line-height: 1.3; }',
		'#toc-toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }',
		'#toc-toolbar input[type="search"] { flex: 1; min-width: 140px; padding: 5px 10px; font-size: 0.85em; border: 1px solid #ccc; border-radius: 4px; font-family: inherit; }',
		'#toc-toolbar input[type="search"]:focus { outline: none; border-color: #66f; box-shadow: 0 0 0 2px rgba(102,102,255,0.2); }',
		'#toc-toolbar button { padding: 5px 12px; font-size: 0.8em; background: #fff; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-family: inherit; color: #333; }',
		'#toc-toolbar button:hover { background: #eef; border-color: #99c; }',
		'#toc-toolbar button:active { background: #dde; }',
		'#toc > ul { display: grid; grid-template-columns: 1fr; gap: 0 20px; padding: 0; margin: 0; list-style: none; }',
		'#toc ul { list-style: none; margin: 2px 0; }',
		'#toc ul ul { padding-left: 12px; }',
		'#toc ul.collapsible { max-height: 0; overflow: hidden; transition: none; }',
		'#toc.toc-ready ul.collapsible { transition: max-height 0.3s ease; }',
		'#toc li.expanded > ul.collapsible { max-height: 5000px; }',
		'#toc a { text-decoration: none; color: #0044aa; font-size: 0.85em; cursor: pointer; }',
		'#toc a:hover { text-decoration: underline; color: #cc3300; }',
		'.toggle-icon { display: inline-block; width: 12px; cursor: pointer; color: #888; font-size: 0.75em; user-select: none; visibility: hidden; }',
		'.has-children > .toggle-icon { visibility: visible; }',
		'.toc-item { margin: 1px 0; }',
		'#toc.filtering li.toc-hidden { display: none; }',
		'#toc.filtering li.toc-match > ul, #toc.filtering li.toc-ancestor-match > ul { display: block !important; max-height: none !important; overflow: visible !important; }',
		'#toc.filtering li.toc-match > a, #toc.filtering li.toc-ancestor-match > a { font-weight: 600; }',
		'@media (prefers-reduced-motion: reduce) { #toc ul.collapsible, #toc.toc-ready ul.collapsible { transition: none; } }'
	].join('\n');
	document.head.appendChild(s);

	// 2. Identify all headers
	var headers = contents.querySelectorAll("h1, h2, h3, h4, h5, h6");
	var rootUl = document.createElement("ul");
	var stack = [{ level: 0, element: rootUl }];
	var usedIds = new Set();

	function saveState() {
		var state = {};
		tocDiv.querySelectorAll('li.has-children').forEach(function(li) {
			var link = li.querySelector(':scope > a');
			if (!link) return;
			var href = link.getAttribute('href') || '';
			if (href) state[href] = li.classList.contains('expanded');
		});
		try {
			localStorage.setItem(storageKey, JSON.stringify(state));
		} catch (e) { /* noop */ }
	}

	headers.forEach(function(header, index) {
		var level = parseInt(header.tagName.substring(1));
		var titleText = header.textContent;

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
		li.className = "toc-item";

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

		var link = document.createElement("a");
		link.textContent = titleText;
		if (header.id) {
			link.href = '#' + header.id;
		}

		// Event listener for smooth scrolling
		link.addEventListener("click", function(e) {
			e.preventDefault();
			if (typeof revealAncestorOptionalBlocks === 'function') {
				revealAncestorOptionalBlocks(header);
			}
			header.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});

		li.appendChild(toggle);
		li.appendChild(link);
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
			var li = found.parentElement;
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
			var link = li.querySelector(':scope > a');
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
