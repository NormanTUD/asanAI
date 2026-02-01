function toc() {
    let tocDiv = document.getElementById("toc");
    const contents = document.getElementById("contents");
    if (!contents) return;

    // Falls TOC nicht existiert, erstellen
    if (!tocDiv) {
        tocDiv = document.createElement('div');
        tocDiv.id = 'toc';
        // Um Layout-Shifts zu minimieren, kann man hier eine min-height setzen
        tocDiv.style.minHeight = "50px"; 
        contents.prepend(tocDiv);
    }

    // Styles nur einmalig hinzufügen
    if (!document.getElementById('toc-styles')) {
        const s = document.createElement("style");
        s.id = 'toc-styles';
        s.textContent = `
            #toc { font-family: system-ui, sans-serif; background: #fafafa; padding: 14px 18px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0; }
            #toc ul { list-style: none; padding-left: 15px; margin: 4px 0; }
            #toc a { text-decoration: none; color: #0044aa; }
            #toc ul ul { display: none; } 
            #toc li.expanded > ul { display: block; } 
            .toggle-icon { display: inline-block; width: 14px; cursor: pointer; }
        `;
        document.head.appendChild(s);
    }

    // DocumentFragment verwenden, um DOM-Operationen zu bündeln (verhindert Flackern)
    const fragment = document.createDocumentFragment();
    const rootUl = document.createElement("ul");
    fragment.appendChild(rootUl);

    const headers = Array.from(contents.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    
    // Filter-Logik: Nur Header anzeigen, die physisch sichtbar sind
    const visibleHeaders = headers.filter(h => {
        const isVisible = h.offsetWidth > 0 || h.offsetHeight > 0;
        if (!isVisible) return false;

        // Zusatzcheck: Wenn es ein H1 ist, hat es sichtbaren Text nach sich?
        // (Optional: Verhindert "leere" H1 Sektionen)
        if (h.tagName === 'H1') {
            let next = h.nextElementSibling;
            let hasVisibleContent = false;
            while (next && next.tagName !== 'H1') {
                if (next.offsetWidth > 0 || next.offsetHeight > 0) {
                    hasVisibleContent = true;
                    break;
                }
                next = next.nextElementSibling;
            }
            return hasVisibleContent;
        }
        return true;
    });

    const stack = [{ level: 0, element: rootUl }];

    visibleHeaders.forEach((header, index) => {
        const level = parseInt(header.tagName.substring(1));
        const titleText = header.innerText || header.textContent;
        const anchor = `toc_${level}_${index}`;
        header.id = anchor;

        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        const li = document.createElement("li");
        li.innerHTML = `<span class="toggle-icon">▸ </span><a href="#${anchor}">${titleText}</a>`;
        
        const nextUl = document.createElement("ul");
        li.appendChild(nextUl);
        
        stack[stack.length - 1].element.appendChild(li);
        stack.push({ level: level, element: nextUl });
    });

    // Erst am Ende den alten Inhalt durch den neuen ersetzen (minimiert Repaints)
    tocDiv.innerHTML = '';
    tocDiv.appendChild(fragment);
}
