/**
 * PATH: asanai/blog/embeddingbpelab.js
 */

const bpeVocab = {
    // Basis-Wörter (Stämme) [Status, Gender, Spezies]
    'Man': [0, -5, 0],
    'King': [10, -5, 0],
    'God': [15, -5, 0],
    'Prince': [8, -5, 0],
    'Lion': [5, -2, 12],
    'Actor': [3, -2, 0],
    
    // Sub-word Units (Verschiebungen)
    '##ess': [0, 10, 0],   // Verschiebt hart von Männlich (-5) zu Weiblich (+5)
    '##ly': [2, 0, 0],     // Erhöht den Status/Adjektiv-Grad etwas
    '##ship': [4, 0, 0]    // Erhöht den abstrakten Status
};

let bpePlotlyInitialized = false;

window.addEventListener('load', () => {
    updateTokenList();
    setupBPEPlotting();
    processBPEEmbedding();
});

function updateTokenList() {
    const container = document.getElementById('token-vocab-list');
    if (container) container.innerText = Object.keys(bpeVocab).join(', ');
}

function tokenizeBPE(text) {
    if (!text) return [];
    // Wir suchen nach typischen Endungen
    const subUnits = ["ess", "ly", "ship"];
    let tokens = [];
    let found = false;
    
    for (let unit of subUnits) {
        if (text.toLowerCase().endsWith(unit) && text.length > unit.length) {
            tokens.push(text.substring(0, text.length - unit.length));
            tokens.push("##" + unit);
            found = true;
            break;
        }
    }
    if (!found) tokens.push(text);
    return tokens;
}

function processBPEEmbedding() {
    const input = document.getElementById('bpe-input').value.trim();
    const tokens = tokenizeBPE(input);
    renderTokenBadges(tokens);
    
    let currentPos = [0, 0, 0];
    let steps = [];

    tokens.forEach(t => {
        // Falls Token nicht exakt gefunden, case-insensitive Suche
        let key = Object.keys(bpeVocab).find(k => k.toLowerCase() === t.toLowerCase());
        const vec = bpeVocab[key] || [0, 0, 0];
        
        const nextPos = currentPos.map((v, i) => v + vec[i]);
        steps.push({ from: [...currentPos], to: [...nextPos], label: t });
        currentPos = nextPos;
    });

    drawBPEPlot(currentPos, input, steps);
    document.getElementById('result-word').innerText = input || "-";
}

function renderTokenBadges(tokens) {
    const container = document.getElementById('bpe-tokens-display');
    container.innerHTML = tokens.map(t => {
        const isKnown = Object.keys(bpeVocab).some(k => k.toLowerCase() === t.toLowerCase());
        return `<span style="background: ${isKnown ? '#fb7185' : '#94a3b8'}; color: white; padding: 4px 10px; border-radius: 6px; font-family: 'Courier New', monospace; font-weight: bold;">${t}</span>`;
    }).join('');
}

function drawBPEPlot(finalVec, label, steps) {
    const plotDiv = document.getElementById('bpe-3d-plot');
    if (!plotDiv || typeof Plotly === 'undefined') return;

    let traces = [];

    // Achsen-Vektoren zur Orientierung
    traces.push({
        x: [-15, 15], y: [0, 0], z: [0, 0], mode: 'lines', line: {color: '#ddd', width: 2}, name: 'Status'
    });

    // Der Rechenweg
    steps.forEach((step, i) => {
        // Der Pfeil (Linie)
        traces.push({
            x: [step.from[0], step.to[0]], 
            y: [step.from[1], step.to[1]], 
            z: [step.from[2], step.to[2]],
            mode: 'lines+markers',
            line: { color: i === 0 ? '#3b82f6' : '#f43f5e', width: 6 },
            marker: { size: 5 },
            type: 'scatter3d'
        });
        
        // Beschriftung am Vektor
        traces.push({
            x: [(step.from[0] + step.to[0])/2], 
            y: [(step.from[1] + step.to[1])/2], 
            z: [(step.from[2] + step.to[2])/2],
            mode: 'text',
            text: (i > 0 ? "+ " : "") + step.label,
            textfont: { color: i === 0 ? '#1e40af' : '#9f1239', size: 14, weight: 'bold' },
            type: 'scatter3d'
        });
    });

    // Endpunkt
    traces.push({
        x: [finalVec[0]], y: [finalVec[1]], z: [finalVec[2]],
        mode: 'markers+text',
        text: '📍 ' + label,
        textposition: 'top center',
        marker: { size: 12, color: '#f43f5e', symbol: 'diamond' },
        type: 'scatter3d'
    });

    const layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 },
        scene: {
            xaxis: { title: 'Status (Royal)', range: [-5, 20] },
            yaxis: { title: 'Gender (Female)', range: [-10, 10] },
            zaxis: { title: 'Species (Animal)', range: [-5, 15] },
            camera: { eye: {x: 1.5, y: 1.5, z: 0.8} }
        },
        showlegend: false
    };

    Plotly.react('bpe-3d-plot', traces, layout);
    bpePlotlyInitialized = true;
}
