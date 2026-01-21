function toc() {
	var tocDiv = document.getElementById("toc");
	var contents = document.getElementById("contents");
	if (!tocDiv || !contents) return;

	// 1. Setup Styles
	var s = document.createElement("style");
	s.textContent = `
	#toc { font-family: system-ui, sans-serif; background: #fafafa; padding: 14px 18px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0; line-height: 1.4; }
	#toc ul { list-style: none; padding-left: 15px; margin: 4px 0; border-left: 1px solid #eee; }
	#toc a { text-decoration: none; color: #0044aa; font-size: 0.94em; }
	#toc a:hover { text-decoration: underline; color: #cc3300; }

	/* Collapse Logic */
	#toc ul ul { display: none; } /* Hide nested levels by default */
	#toc li.expanded > ul { display: block; } /* Show when parent has .expanded */

	.toggle-icon { 
	    display: inline-block; 
	    width: 14px; 
	    cursor: pointer; 
	    color: #888; 
	    font-size: 0.8em;
	    user-select: none;
	}
	.toc-item { margin: 4px 0; }
    `;
	document.head.appendChild(s);

	// 2. Identify all headers
	var headers = contents.querySelectorAll("h1, h2, h3, h4, h5, h6");
	var rootUl = document.createElement("ul");
	var currentList = rootUl;
	var stack = [rootUl];
	var currentLevel = 1;

	headers.forEach(function(header, index) {
		var level = parseInt(header.tagName.substring(1));
		var titleText = header.textContent;
		var anchor = titleText.trim().replace(/\s+/g, "_").toLowerCase() + "_" + index;

		// Set ID on the actual header for jumping
		header.id = anchor;

		// Adjust nesting level
		while (level > currentLevel) {
			var newList = document.createElement("ul");
			var lastLi = currentList.lastElementChild;
			if (!lastLi) {
				// Handle cases where a header level is skipped (e.g., h1 to h3)
				lastLi = document.createElement("li");
				lastLi.className = "toc-item";
				currentList.appendChild(lastLi);
			}
			lastLi.appendChild(newList);
			stack.push(newList);
			currentList = newList;
			currentLevel++;
		}

		while (level < currentLevel) {
			stack.pop();
			currentList = stack[stack.length - 1];
			currentLevel--;
		}

		// Create the list item
		var li = document.createElement("li");
		li.className = "toc-item";

		// Add toggle icon if it's not the deepest possible level
		var toggle = document.createElement("span");
		toggle.className = "toggle-icon";
		toggle.innerHTML = "▸ "; 

		var link = document.createElement("a");
		link.href = "#" + anchor;
		link.textContent = titleText;

		li.appendChild(toggle);
		li.appendChild(link);
		currentList.appendChild(li);

		// Click Logic for collapsing
		li.addEventListener("click", function(e) {
			if (e.target.tagName !== "A") {
				e.stopPropagation();
				var hasChild = li.querySelector("ul");
				if (hasChild) {
					li.classList.toggle("expanded");
					toggle.innerHTML = li.classList.contains("expanded") ? "▾ " : "▸ ";
				}
			}
		});
	});

	// 3. Render and finalize
	tocDiv.innerHTML = "<strong>Table of Contents</strong>";
	tocDiv.appendChild(rootUl);
}
