/**
 * PATH: asanai/blog/embeddinglab.js
 */

var embeddedVocab3d = {
    'Man': [0, -5, 0], 'Woman': [0, 5, 0],
    'King': [12, -5, 0], 'Queen': [12, 5, 0],
    'Prince': [6, -5, 0], 'Princess': [6, 5, 0],
    'Boy': [-4, -5, 0], 'Girl': [-4, 5, 0],
    'God': [15, -5, 0], 'Goddess': [15, 5, 0],
    'Dog': [0, -3, 10], 'Cat': [0, 3, 10],
    'Lion': [10, -2, 10], 'Lioness': [10, 4, 10],
    'Power': [10, 0, 0], 'Human': [0, 0, 0],
    'Animal': [0, 0, 10], 'Apple': [0, 0, -10]
};

let plotlyInitialized = false;

window.addEventListener('load', () => {
    updateAvailableWords();
    setupLazyPlotting();
});

function setupLazyPlotting() {
    const plotDiv = document.getElementById('vec-3d-plot');
    if (!plotDiv) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !plotlyInitialized) {
                if (typeof Plotly !== 'undefined') {
                    plot3DSpace();
                    observer.unobserve(plotDiv);
                }
            }
        });
    }, { threshold: 0.1 });
    observer.observe(plotDiv);
}

function updateAvailableWords() {
    const container = document.getElementById('available-words-list');
    if (container) container.innerText = Object.keys(embeddedVocab3d).join(', ');
}

function plot3DSpace(highlightPos = null, label = "", steps = []) {
    const plotDiv = document.getElementById('vec-3d-plot');
    if (!plotDiv || typeof Plotly === 'undefined') return;

    let traces = [];

    // Basis-Vokabular
    Object.keys(embeddedVocab3d).forEach(word => {
        const v = embeddedVocab3d[word];
        traces.push({
            x: [v[0]], y: [v[1]], z: [v[2]],
            mode: 'markers+text',
            name: word, text: word, textposition: 'top center',
            marker: { size: 4, opacity: 0.4, color: '#94a3b8' },
            type: 'scatter3d'
        });
    });

    // Zeichne Pfade mit Beschriftung
    steps.forEach((step, i) => {
        const start = step.from;
        const end = step.to;
        const mid = start.map((v, idx) => v + (end[idx] - start[idx]) / 2);

        // Linie
        traces.push({
            x: [start[0], end[0]], y: [start[1], end[1]], z: [start[2], end[2]],
            mode: 'lines',
            line: { color: '#3b82f6', width: 5 },
            type: 'scatter3d',
            hoverinfo: 'skip'
        });

        // Pfeilspitze
        traces.push({
            type: 'cone',
            x: [end[0]], y: [end[1]], z: [end[2]],
            u: [end[0] - start[0]], v: [end[1] - start[1]], w: [end[2] - start[2]],
            sizemode: 'absolute', sizeref: 1.5, showscale: false, 
            colorscale: [[0, '#3b82f6'], [1, '#3b82f6']]
        });

        // Label an der Mitte des Pfeils
        traces.push({
            x: [mid[0]], y: [mid[1]], z: [mid[2]],
            mode: 'text',
            text: step.label,
            textfont: { color: '#1e40af', size: 12, weight: 'bold' },
            type: 'scatter3d'
        });
    });

    if (highlightPos) {
        traces.push({
            x: [highlightPos[0]], y: [highlightPos[1]], z: [highlightPos[2]],
            mode: 'markers+text',
            text: 'Result: ' + label,
            textposition: 'bottom center',
            marker: { size: 10, color: '#ef4444', symbol: 'diamond' },
            type: 'scatter3d'
        });
    }

    const layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 },
        scene: {
            xaxis: { title: 'Power', range: [-20, 20] },
            yaxis: { title: 'Gender', range: [-20, 20] },
            zaxis: { title: 'Species', range: [-20, 20] }
        },
        showlegend: false
    };

    Plotly.react('vec-3d-plot', traces, layout);
    plotlyInitialized = true;
}

function calcVector() {
    const inputField = document.getElementById('vec-input');
    let input = inputField ? inputField.value : "";
    if (!input.trim()) return;

    // Tokens vorbereiten
    const tokens = input.match(/[a-zA-Z]+|[0-9.]+|[\+\-\*\/\(\)]/g);
    let pos = 0;
    let steps = [];

    function parseExpression() {
        let node = parseTerm();
        while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
            let op = tokens[pos++];
            let right = parseTerm();
            let prev = [...node];
            let label = op + " " + (tokens[pos-1]); // Label für den Schritt
            
            node = (op === '+') ? node.map((v, i) => v + right[i]) : node.map((v, i) => v - right[i]);
            steps.push({ from: prev, to: [...node], label: op + " " + getLabel(right) });
        }
        return node;
    }

    function parseTerm() {
        let node = parseFactor();
        while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
            let op = tokens[pos++];
            let right = parseFactor();
            let prev = Array.isArray(node) ? [...node] : node;

            let result;
            if (typeof node === 'number' && Array.isArray(right)) {
                result = right.map(v => v * node);
                steps.push({ from: [0,0,0], to: [...result], label: node + " * " + getLabel(right) });
            } else if (Array.isArray(node) && typeof right === 'number') {
                result = node.map(v => v * right);
                steps.push({ from: prev, to: [...result], label: "* " + right });
            } else {
                result = (op === '*') ? node * right : node / right;
            }
            node = result;
        }
        return node;
    }

    function parseFactor() {
        let token = tokens[pos++];
        if (token === '(') {
            let node = parseExpression();
            pos++; return node;
        }
        if (!isNaN(token)) return parseFloat(token);
        return [...(embeddedVocab3d[token] || [0, 0, 0])];
    }

    function getLabel(val) {
        if (typeof val === 'number') return val;
        // Suche Wort zu Vektor
        for (let w in embeddedVocab3d) {
            if (embeddedVocab3d[w].every((v, i) => v === val[i])) return w;
        }
        return "...";
    }

    try {
        const finalVec = parseExpression();
        let nearestWord = "Unknown";
        let minDist = Infinity;
        
        Object.keys(embeddedVocab3d).forEach(word => {
            const v = embeddedVocab3d[word];
            const dist = Math.sqrt(v.reduce((sum, val, i) => sum + Math.pow(val - finalVec[i], 2), 0));
            if (dist < minDist) { minDist = dist; nearestWord = word; }
        });

        document.getElementById('result-word').innerText = nearestWord;
        document.getElementById('result-display').style.display = 'block';
        
        const history = document.getElementById('history-content');
        const entry = document.createElement('div');
        entry.innerHTML = `> ${input} = <b>${nearestWord}</b>`;
        history.prepend(entry);

        plot3DSpace(finalVec, nearestWord, steps);
    } catch (e) { console.error(e); }
}
