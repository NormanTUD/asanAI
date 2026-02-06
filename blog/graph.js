/**
 * Renders a dependency graph using Mermaid.js
 * Better for clear, top-down tree structures.
 */
function renderMermaidGraph(containerId) {
    const bibData = window.bibData || {};
    const citationGraph = window.citationGraph || {};
    const container = document.getElementById(containerId);

    if (!container) return;

    // Start des Mermaid-Strings (Top-Down Flow)
    let graphDefinition = "graph TD\n";

    // Styling Klassen definieren
    graphDefinition += "classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px,font-size:12px;\n";

    const validKeys = new Set(Object.keys(bibData));

    // 1. Edges definieren (Die Verbindungen)
    Object.keys(citationGraph).forEach(source => {
        if (!validKeys.has(source)) return;

        const targets = citationGraph[source];
        targets.forEach(target => {
            if (validKeys.has(target)) {
                // Format: SourceID[Label] --> TargetID[Label]
                const sourceLabel = `${bibData[source].author?.split(',')[0] || source} (${bibData[source].year})`;
                const targetLabel = `${bibData[target].author?.split(',')[0] || target} (${bibData[target].year})`;
                
                // Wir säubern die IDs von Sonderzeichen für Mermaid
                const sId = source.replace(/[^a-zA-Z0-9]/g, "");
                const tId = target.replace(/[^a-zA-Z0-9]/g, "");

                graphDefinition += `  ${sId}["${sourceLabel}"] --> ${tId}["${targetLabel}"]\n`;
            }
        });
    });

    // 2. Container leeren und Mermaid-Div einfügen
    container.innerHTML = `<pre class="mermaid">${graphDefinition}</pre>`;

    // 3. Mermaid anweisen, das Element zu rendern
    if (window.mermaid) {
        window.mermaid.run();
    }
}

document.addEventListener('DOMContentLoaded', () => {
	renderMermaidGraph('paper-graph');
});
