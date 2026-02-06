/**
 * Renders an interactive, zoomable tree graph with the oldest papers at the top.
 */
function renderInteractiveGraph(containerId) {
    const bibData = window.bibData || {};
    const citationGraph = window.citationGraph || {};
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. Mermaid Definition: TD (Top-Down) puts the source nodes at the top
    let graphDefinition = "graph TD\n"; 
    const validKeys = new Set(Object.keys(bibData));

    Object.keys(citationGraph).forEach(source => {
        if (!validKeys.has(source)) return;
        const targets = citationGraph[source];
        
        targets.forEach(target => {
            if (validKeys.has(target)) {
                const yearSource = bibData[source].year;
                const yearTarget = bibData[target].year;

                // Determine which paper is older to ensure it stays on top
                let parentKey = yearSource <= yearTarget ? source : target;
                let childKey = yearSource <= yearTarget ? target : source;

                // Create labels with years
                const sLabel = `${bibData[parentKey].author?.split(',')[0] || parentKey} (${bibData[parentKey].year})`;
                const tLabel = `${bibData[childKey].author?.split(',')[0] || childKey} (${bibData[childKey].year})`;
                
                // Sanitize IDs for Mermaid
                const sId = parentKey.replace(/[^a-zA-Z0-9]/g, "");
                const tId = childKey.replace(/[^a-zA-Z0-9]/g, "");
                
                graphDefinition += `  ${sId}["${sLabel}"] --> ${tId}["${tLabel}"]\n`;
            }
        });
    });

    // 2. Mermaid Rendering
    container.innerHTML = `<div id="mermaid-holder" style="cursor:grab">${graphDefinition}</div>`;
    
    mermaid.render('prepared-svg', graphDefinition).then(({ svg }) => {
        container.innerHTML = `<div id="svg-container" style="width:100%; height:100%; overflow:hidden;">${svg}</div>`;
        
        // 3. Zoom Logic (D3.js)
        const svgElement = container.querySelector('svg');
        svgElement.setAttribute("width", "100%");
        svgElement.setAttribute("height", "100%");
        
        const d3Svg = d3.select(svgElement);
        const g = d3Svg.select('g'); 
        
        const zoom = d3.zoom()
            .scaleExtent([0.1, 10]) 
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        d3Svg.call(zoom);
        
        // Initial Zoom: Center and fit all content
        const bounds = g.node().getBBox();
        const fullWidth = container.clientWidth;
        const fullHeight = container.clientHeight;
        const midX = bounds.x + bounds.width / 2;
        const midY = bounds.y + bounds.height / 2;
        
        const scale = 0.8 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
        d3Svg.call(zoom.transform, d3.zoomIdentity
            .translate(fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY)
            .scale(scale));
    });
}

document.addEventListener('DOMContentLoaded', () => {
	renderInteractiveGraph('paper-graph');
});
