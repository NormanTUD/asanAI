function toc() {
	var tocDiv = document.getElementById("toc");
	var contents = document.getElementById("contents");
	if (!tocDiv || !contents) return;

	const urlParams = new URLSearchParams(window.location.search);
	const shouldExpandAll = urlParams.get('opentoc') === '1';

	// 1. Setup Styles
	var s = document.createElement("style");
	s.textContent = `
	#toc { font-family: system-ui, sans-serif; background: #fafafa; padding: 14px 18px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0; line-height: 1.4; }
	#toc ul { list-style: none; padding-left: 15px; margin: 4px 0; border-left: 1px solid #eee; }
	#toc a { text-decoration: none; color: #0044aa; font-size: 0.94em; }
	#toc a:hover { text-decoration: underline; color: #cc3300; }
	#toc ul ul { display: none; } 
	#toc li.expanded > ul { display: block; } 
	.toggle-icon { display: inline-block; width: 14px; cursor: pointer; color: #888; font-size: 0.8em; user-select: none; visibility: hidden; }
	.has-children > .toggle-icon { visibility: visible; }
	.toc-item { margin: 4px 0; }
    `;
	document.head.appendChild(s);

	// 2. Identify all headers
	var headers = contents.querySelectorAll("h1, h2, h3, h4, h5, h6");
	var rootUl = document.createElement("ul");
	var stack = [{ level: 0, element: rootUl }]; 

	headers.forEach(function(header, index) {
		var level = parseInt(header.tagName.substring(1));
		var titleText = header.textContent;
		
		// --- NEW: Skip Level Detection ---
		var lastLevel = stack[stack.length - 1].level;
		if (lastLevel !== 0 && level > lastLevel + 1) {
			console.error(
				`TOC Error: Level skipped! Found <${header.tagName}> following <H${lastLevel}>. ` +
				`Text: "${titleText.substring(0, 30)}..."`
			);
		}
		// ---------------------------------

		var anchor = titleText.trim().replace(/\s+/g, "_").toLowerCase() + "_" + index;
		header.id = anchor;

		while (stack.length > 1 && stack[stack.length - 1].level >= level) {
			stack.pop();
		}

		var parentObj = stack[stack.length - 1];
		var parentUl = parentObj.element;

		var li = document.createElement("li");
		li.className = "toc-item";

		if (shouldExpandAll) {
			li.classList.add("expanded");
		}

		var toggle = document.createElement("span");
		toggle.className = "toggle-icon";
		toggle.innerHTML = li.classList.contains("expanded") ? "▾ " : "▸ "; 

		var link = document.createElement("a");
		link.href = "#" + anchor;
		link.textContent = titleText;

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
		li.appendChild(nextUl);
		stack.push({ level: level, element: nextUl });

		li.addEventListener("click", function(e) {
			if (e.target.tagName !== "A" && li.classList.contains("has-children")) {
				e.stopPropagation();
				li.classList.toggle("expanded");
				toggle.innerHTML = li.classList.contains("expanded") ? "▾ " : "▸ ";
			}
		});
	});

	// 3. Final Cleanup
	tocDiv.innerHTML = "<strong>Table of Contents</strong>";
	tocDiv.appendChild(rootUl);
	
	tocDiv.querySelectorAll("ul").forEach(ul => {
		if (ul.children.length === 0) {
			ul.remove();
		}
	});
}
