/**
 * Organisiert den Graphen als sauberen Stammbaum (Hierarchie).
 * @param {string} containerId - Die ID des Divs.
 */
function renderCitationGraph(containerId) {
    const bibData = window.bibData || {};
    const citationGraph = window.citationGraph || {};
    const elements = [];

    // 1. Nodes vorbereiten
    const validKeys = new Set(Object.keys(bibData));
    validKeys.forEach(key => {
        const paper = bibData[key];
        // Wir nehmen die erste Kategorie für die Farbe, falls vorhanden
        const color = paper.category ? getCategoryColor(paper.category) : '#4A90E2';

        elements.push({
            data: {
                id: key,
                label: `${paper.author?.split(',')[0] || key}\n(${paper.year || '?'})`,
                categoryColor: color
            }
        });
    });

    // 2. Edges vorbereiten (mit Validitäts-Check)
    Object.keys(citationGraph).forEach(source => {
        if (!validKeys.has(source)) return; // Verhindert Crash bei unbekannten Quellen
        
        const targets = citationGraph[source];
        if (Array.isArray(targets)) {
            targets.forEach(target => {
                if (validKeys.has(target)) { // Verhindert den "nonexistent source/target" Error
                    elements.push({
                        data: { id: `e-${source}-${target}`, source: source, target: target }
                    });
                }
            });
        }
    });

    // 3. Cytoscape Initialisierung
    const cy = cytoscape({
        container: document.getElementById(containerId),
        elements: elements,
        style: [
            {
                selector: 'node',
                style: {
                    'content': 'data(label)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'shape': 'round-rectangle',
                    'width': '80px',
                    'height': '40px',
                    'background-color': 'data(categoryColor)',
                    'color': '#fff',
                    'font-size': '10px',
                    'text-wrap': 'wrap',
                    'font-weight': 'bold',
                    'border-width': 1,
                    'border-color': '#333'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#bbb',
                    'target-arrow-color': '#bbb',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'taxi', // Erzeugt rechtwinklige "U-Bahn-Linien"
                    'taxi-direction': 'vertical'
                }
            }
        ],
        layout: {
            name: 'dagre', // Erfordert das Dagre-Plugin
            rankDir: 'TB', // Top to Bottom (von oben nach unten)
            nodeSep: 50,   // Abstand zwischen Knoten nebeneinander
            rankSep: 100,  // Abstand zwischen den Zeilen (Jahren)
            directed: true
        }
    });

    // Zoom-Steuerung
    cy.fit(50);
}

document.addEventListener('DOMContentLoaded', () => {
	renderCitationGraph('paper-graph');
});
