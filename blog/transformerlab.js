/**
 * Transformer / Attention Simulation
 */
const contextVocab = {
    'bank':  { base: [5, 5, 0], color: '#3b82f6' },
    'river': { base: [2, 8, 8], color: '#10b981' }, // Water/Nature direction
    'money': { base: [8, 2, -5], color: '#f59e0b' } // Finance direction
};

function runAttention() {
    const input = document.getElementById('trans-input').value.toLowerCase();
    const words = input.split(/\s+/).filter(w => contextVocab[w]);
    const container = 'transformer-plot';
    
    if (words.length < 1) return;

    let traces = [];
    let logs = [];

    // 1. Draw "Static" Base Vectors
    words.forEach(word => {
        const pos = contextVocab[word].base;
        traces.push({
            x: [pos[0]], y: [pos[1]], z: [pos[2]],
            mode: 'markers+text',
            name: word + ' (Static)',
            text: word,
            marker: { size: 5, opacity: 0.3, color: contextVocab[word].color },
            type: 'scatter3d'
        });
    });

    // 2. Simulating Attention (The "Shift")
    // If 'bank' and 'river' are together, 'bank' moves towards 'river'
    if (words.includes('bank') && words.length > 1) {
        const bankBase = contextVocab['bank'].base;
        let shiftVec = [0, 0, 0];
        
        words.forEach(other => {
            if (other !== 'bank') {
                const otherBase = contextVocab[other].base;
                // Simple Attention: Move 40% towards the context word
                shiftVec = shiftVec.map((v, i) => v + (otherBase[i] - bankBase[i]) * 0.4);
                
                // Draw Attention Line
                traces.push({
                    x: [bankBase[0], otherBase[0]],
                    y: [bankBase[1], otherBase[1]],
                    z: [bankBase[2], otherBase[2]],
                    mode: 'lines',
                    line: { color: '#f97316', width: 4 },
                    name: 'Attention Path'
                });
            }
        });

        const shiftedBank = bankBase.map((v, i) => v + shiftVec[i]);
        
        // The "Contextualized" Bank
        traces.push({
            x: [shiftedBank[0]], y: [shiftedBank[1]], z: [shiftedBank[2]],
            mode: 'markers+text',
            name: 'Bank (Context)',
            text: 'Bank (Contextualized)',
            marker: { size: 10, color: '#3b82f6', symbol: 'diamond' },
            type: 'scatter3d'
        });
        
        log('trans', `Attention: "Bank" pulled towards context words.`);
    }

    const layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 },
        scene: {
            xaxis: { title: 'Finance', range: [0, 10] },
            yaxis: { title: 'Nature', range: [0, 10] },
            zaxis: { title: 'Abstract', range: [-10, 10] }
        }
    };

    Plotly.react(container, traces, layout);
}

// Init call for window.onload
function initTransformerLab() {
    runAttention();
}
