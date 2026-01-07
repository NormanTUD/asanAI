/**
 * Transformer & Attention Simulation
 */
const contextVocab = {
    'bank':  { base: [5, 5, 0], color: '#3b82f6' },
    'river': { base: [1, 9, 8], color: '#10b981' },
    'money': { base: [9, 1, -8], color: '#f59e0b' }
};

function runAttention() {
    const inputField = document.getElementById('trans-input');
    const container = 'transformer-plot';
    
    if (!inputField || !document.getElementById(container)) return;

    const input = inputField.value.toLowerCase();
    const words = input.split(/\s+/).filter(w => contextVocab[w]);
    
    let traces = [];

    // 1. Basis-Wörter
    Object.keys(contextVocab).forEach(word => {
        const pos = contextVocab[word].base;
        traces.push({
            x: [pos[0]], y: [pos[1]], z: [pos[2]],
            mode: 'markers+text',
            name: word,
            text: word,
            textposition: 'bottom center',
            marker: { size: 8, opacity: 0.8, color: contextVocab[word].color },
            type: 'scatter3d'
        });
    });

    // 2. Attention-Logik
    if (words.includes('bank')) {
        const bankBase = contextVocab['bank'].base;
        let shiftVec = [0, 0, 0];
        let hasContext = false;

        words.forEach(other => {
            if (other !== 'bank') {
                hasContext = true;
                const otherBase = contextVocab[other].base;
                shiftVec = shiftVec.map((v, i) => v + (otherBase[i] - bankBase[i]) * 0.5);
                
                traces.push({
                    x: [bankBase[0], otherBase[0]],
                    y: [bankBase[1], otherBase[1]],
                    z: [bankBase[2], otherBase[2]],
                    mode: 'lines',
                    line: { color: '#f97316', width: 8, opacity: 1 },
                    type: 'scatter3d'
                });
            }
        });

        const shiftedBank = bankBase.map((v, i) => v + shiftVec[i]);
        traces.push({
            x: [shiftedBank[0]], y: [shiftedBank[1]], z: [shiftedBank[2]],
            mode: 'markers+text',
            text: 'BANK (in context)',
            marker: { size: 14, color: '#3b82f6', symbol: 'diamond', line: {color:'black', width:2} },
            type: 'scatter3d'
        });
    }

    const layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 },
        scene: {
            xaxis: { 
                gridcolor: '#475569', // Dunkles Schiefergrau
                gridwidth: 2,         // Dickere Linien
                zerolinecolor: '#000000',
                zerolinewidth: 4,
                backgroundcolor: '#f1f5f9',
                showbackground: true
            },
            yaxis: { 
                gridcolor: '#475569', 
                gridwidth: 2,
                zerolinecolor: '#000000',
                zerolinewidth: 4,
                backgroundcolor: '#f1f5f9',
                showbackground: true
            },
            zaxis: { 
                gridcolor: '#475569', 
                gridwidth: 2,
                zerolinecolor: '#000000',
                zerolinewidth: 4,
                backgroundcolor: '#f1f5f9',
                showbackground: true
            }
        }
    };

    Plotly.react(container, traces, layout);
}

/**
 * THE NEURAL UNIVERSE
 */
const universeVocab = {
    'happy': [2, 8, 2], 'sad': [-2, 2, 1], 'love': [4, 9, 3], 'hate': [-4, 1, 0],
    'king': [8, 5, 10], 'queen': [8, 9, 10], 'man': [1, 5, 5], 'woman': [1, 9, 5],
    'dog': [0, 2, -8], 'cat': [0, 4, -9], 'puppy': [-2, 2, -10], 'kitten': [-2, 4, -10],
    'pizza': [10, 2, -5], 'apple': [8, 4, -6], 'burger': [10, 3, -7],
    'the': [0,0,0], 'is': [0,1,0], 'his': [1,0,0], 'a': [0,0,1]
};

function runUniverse() {
    const inputField = document.getElementById('universe-input');
    if (!inputField) return;
    
    const tokens = inputField.value.toLowerCase().split(/\s+/).filter(t => universeVocab[t]);
    const container = 'universe-plot';

    let traces = [];

    // 1. Hintergrund (Latent Space) - Dunklere Punkte
    const allWords = Object.keys(universeVocab);
    traces.push({
        x: allWords.map(w => universeVocab[w][0]),
        y: allWords.map(w => universeVocab[w][1]),
        z: allWords.map(w => universeVocab[w][2]),
        mode: 'markers',
        marker: { size: 5, color: '#475569', opacity: 0.7 }, // Deutlich sichtbares Grau
        type: 'scatter3d'
    });

    // 2. Aktive Tokens & Attention Lines
    if (tokens.length > 0) {
        tokens.forEach(t => {
            const p = universeVocab[t];
            traces.push({
                x: [p[0]], y: [p[1]], z: [p[2]],
                mode: 'markers+text',
                text: t,
                marker: { size: 12, color: '#2563eb', line: {color: 'black', width: 2} },
                type: 'scatter3d'
            });
        });
    }

    const layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 },
        scene: {
            xaxis: { 
                gridcolor: '#000000', // Schwarzes Gitter
                gridwidth: 1, 
                showgrid: true, 
                zeroline: true, 
                zerolinecolor: '#000000', 
                zerolinewidth: 3 
            },
            yaxis: { 
                gridcolor: '#000000', 
                gridwidth: 1, 
                showgrid: true, 
                zeroline: true, 
                zerolinecolor: '#000000', 
                zerolinewidth: 3 
            },
            zaxis: { 
                gridcolor: '#000000', 
                gridwidth: 1, 
                showgrid: true, 
                zeroline: true, 
                zerolinecolor: '#000000', 
                zerolinewidth: 3 
            }
        },
        showlegend: false
    };

    Plotly.react(container, traces, layout);
}

function log(type, msg) {
    const el = document.getElementById(type + '-console');
    if (el) el.innerText = msg;
}

window.addEventListener('load', () => {
    setTimeout(runAttention, 500);
    setTimeout(runUniverse, 1000);
});
