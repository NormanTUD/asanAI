/**
 * Transformer & Attention Simulation
 */
const contextVocab = {
    'bank':  { base: [5, 5, 0], color: '#3b82f6' },
    'river': { base: [1, 9, 8], color: '#10b981' }, // Ecke: Natur/Wasser
    'money': { base: [9, 1, -8], color: '#f59e0b' } // Ecke: Finanzen
};

function runAttention() {
    const inputField = document.getElementById('trans-input');
    const container = 'transformer-plot';
    
    if (!inputField || !document.getElementById(container)) return;

    const input = inputField.value.toLowerCase();
    const words = input.split(/\s+/).filter(w => contextVocab[w]);
    
    let traces = [];

    // 1. Zeichne die Basis-Wörter (die statischen Ankerpunkte)
    Object.keys(contextVocab).forEach(word => {
        const pos = contextVocab[word].base;
        traces.push({
            x: [pos[0]], y: [pos[1]], z: [pos[2]],
            mode: 'markers+text',
            name: word,
            text: word,
            textposition: 'bottom center',
            marker: { size: 6, opacity: 0.4, color: contextVocab[word].color },
            type: 'scatter3d'
        });
    });

    // 2. Attention-Logik: Falls "bank" vorhanden ist, berechne den Shift
    if (words.includes('bank')) {
        const bankBase = contextVocab['bank'].base;
        let shiftVec = [0, 0, 0];
        let hasContext = false;

        words.forEach(other => {
            if (other !== 'bank') {
                hasContext = true;
                const otherBase = contextVocab[other].base;
                
                // Wir bewegen "Bank" zu 50% in Richtung des Kontext-Wortes
                shiftVec = shiftVec.map((v, i) => v + (otherBase[i] - bankBase[i]) * 0.5);
                
                // Zeichne die Attention-Linie (Der "Blick" der KI)
                traces.push({
                    x: [bankBase[0], otherBase[0]],
                    y: [bankBase[1], otherBase[1]],
                    z: [bankBase[2], otherBase[2]],
                    mode: 'lines',
                    name: 'Attention',
                    line: { color: '#f97316', width: 6, opacity: 0.8 },
                    type: 'scatter3d'
                });
            }
        });

        // Berechne die neue Position der Bank im Kontext
        const shiftedBank = bankBase.map((v, i) => v + shiftVec[i]);
        
        // Zeichne die "kontextualisierte" Bank als auffälligen Diamanten
        traces.push({
            x: [shiftedBank[0]], y: [shiftedBank[1]], z: [shiftedBank[2]],
            mode: 'markers+text',
            name: 'Contextual Bank',
            text: 'BANK (in context)',
            textposition: 'top center',
            marker: { size: 12, color: '#3b82f6', symbol: 'diamond', line: {color:'white', width:2} },
            type: 'scatter3d'
        });

        if (hasContext) {
            log('trans', `Attention active! Bank vector moved towards context.`);
        } else {
            log('trans', `No context words found. Bank is static.`);
        }
    }

    const layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 },
        scene: {
            xaxis: { title: 'Finance Axis', range: [0, 10] },
            yaxis: { title: 'Nature Axis', range: [0, 10] },
            zaxis: { title: 'Abstract Axis', range: [-10, 10] },
            camera: { eye: { x: 1.8, y: 1.8, z: 1.2 } }
        },
        showlegend: false
    };

    Plotly.react(container, traces, layout);
}

// Damit der Plot beim Starten direkt da ist:
window.addEventListener('load', () => {
    setTimeout(runAttention, 500); // Kurzer Delay damit Plotly bereit ist
});
