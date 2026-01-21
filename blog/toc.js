function toc() {
    var tocContent = "";
    var level = 0;

    // 1. Enhanced Styles for Collapsible functionality
    var s = document.createElement("style");
    s.textContent = `
        #toc { font-family: system-ui, sans-serif; background: #fafafa; padding: 14px 18px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0; line-height: 1.4; }
        #toc ul { list-style: none; padding-left: 15px; margin: 6px 0; border-left: 1px solid #ddd; }
        
        /* Collapse logic: hide nested lists by default */
        #toc ul ul { display: none; }
        /* Show nested list when the parent li has the 'open' class */
        #toc li.open > ul { display: block; }
        
        #toc li { margin: 5px 0; cursor: pointer; position: relative; }
        #toc .toggle-btn { color: #888; margin-right: 5px; cursor: pointer; display: inline-block; width: 10px; }
        #toc a { text-decoration: none; color: #0044aa; font-size: 0.94em; }
        #toc a:hover { color: #cc3300; }
    `;
    document.head.appendChild(s);

    var container = document.getElementById("contents");
    
    // 2. Fixed Regex and Replacement logic
    // We use a temporary wrapper or ensure we are targeting the innerHTML properly
    container.innerHTML = container.innerHTML.replace(/<h([1-6])>(.*?)<\/h\1>/gi, function (str, openLevel, titleText) {
        openLevel = parseInt(openLevel);
        
        // Clean titleText from any nested HTML tags for the anchor name
        var cleanTitle = titleText.replace(/<[^>]*>?/gm, '');
        var anchor = cleanTitle.trim().replace(/\s+/g, "_").toLowerCase();

        if (openLevel > level) {
            tocContent += "<ul>";
        } else if (openLevel < level) {
            tocContent += new Array(level - openLevel + 1).join("</ul>");
        }
        
        level = openLevel;
        
        // Add a toggle indicator for items that might have children
        var toggle = openLevel < 6 ? "<span class='toggle-btn'>▸</span>" : "";
        tocContent += `<li class="toc-item">${toggle}<a href="#${anchor}">${cleanTitle}</a>`;
        
        return `<h${openLevel} id="${anchor}">${titleText}</h${openLevel}>`;
    });

    // Close remaining tags
    if (level) tocContent += new Array(level + 1).join("</ul>");
    
    var tocDiv = document.getElementById("toc");
    tocDiv.innerHTML = "<strong>Table of Contents</strong>" + tocContent;

    // 3. Add Event Listeners for Collapsing
    tocDiv.querySelectorAll('.toc-item').forEach(item => {
        item.addEventListener('click', function(e) {
            // Prevent clicking the link from just toggling
            if (e.target.tagName !== 'A') {
                e.stopPropagation();
                this.classList.toggle('open');
                var btn = this.querySelector('.toggle-btn');
                if(btn) btn.textContent = this.classList.contains('open') ? '▾' : '▸';
            }
        });
    });
}
