/**
 * PATH: asanai/blog/embeddinglab.js
 */

// Benutze var oder window.prop um "Redeclaration" Fehler bei Live-Reloads zu vermeiden
var embeddedVocab3d = {
    'Man':      [0, -5, 0],   'Woman':    [0, 5, 0],
    'King':     [10, -5, 0],  'Queen':    [10, 5, 0],
    'Prince':   [7, -5, 0],   'Princess': [7, 5, 0],
    'Boy':      [-2, -5, 0],  'Girl':     [-2, 5, 0],
    'God':      [12, -5, 0],  'Goddess':  [12, 5, 0],
    'Dog':      [0, -3, 10],  'Cat':      [0, 3, 10],
    'Puppy':    [-4, -3, 10], 'Kitten':   [-4, 3, 10],
    'Lion':     [8, -2, 10],  'Lioness':  [8, 4, 10], 
    'Power':    [10, 0, 0],   
    'Human':    [0, 0, 0],
    'Animal':   [0, 0, 10],
    'Apple':    [0, 0, -10]   
};

window.addEventListener('load', () => {
    if (typeof Plotly !== 'undefined') {
        plot3DSpace();
    }
    updateAvailableWords();
});

function updateAvailableWords() {
    const container = document.getElementById('available-words-list');
    if (container) {
        container.innerText = Object.keys(embeddedVocab3d).join(', ');
    }
}

function plot3DSpace(highlightPos = null, label = "") {
    let traces = [];
    
    Object.keys(embeddedVocab3d).forEach(word => {
        const v = embeddedVocab3d[word];
        traces.push({
            x: [v[0]], y: [v[1]], z: [v[2]],
            mode: 'markers+text',
            name: word, 
            text: word,
            textposition: 'top center',
            marker: { 
                size: 6, opacity: 0.7, 
                color: word === label ? '#ef4444' : '#94a3b8' 
            },
            type: 'scatter3d'
        });
    });

    if (highlightPos) {
        traces.push({
            x: [highlightPos[0]], y: [highlightPos[1]], z: [highlightPos[2]],
            mode: 'markers',
            name: 'CALCULATED',
            marker: { size: 12, color: '#ef4444', symbol: 'diamond' },
            type: 'scatter3d'
        });
    }

    const layout = {
        title: 'Word Embedding Space (3D)',
        margin: { l: 0, r: 0, b: 0, t: 40 },
        scene: {
            xaxis: { title: 'Status', range: [-15, 15] },
            yaxis: { title: 'Gender', range: [-15, 15] },
            zaxis: { title: 'Species', range: [-15, 15] }
        },
        showlegend: false
    };

    Plotly.react('vec-3d-plot', traces, layout);
}

function calcVector() {
    const inputField = document.getElementById('vec-input');
    const input = inputField ? inputField.value : "";
    if (!input.trim()) return;

    const tokens = input.split(/([\+\-\*])/).map(s => s.trim()).filter(s => s !== "");
    let currentVec = [0, 0, 0];
    let operation = "+";
    let firstWordSet = false;

    tokens.forEach(t => {
        if (t === "+" || t === "-" || t === "*") {
            operation = t;
        } else {
            const isNumber = !isNaN(t) && !isNaN(parseFloat(t));
            const v = isNumber ? null : embeddedVocab3d[t];

            if (v || isNumber) {
                if (!firstWordSet && v) {
                    currentVec = [...v];
                    firstWordSet = true;
                } else {
                    if (operation === "+") {
                        currentVec = currentVec.map((val, i) => val + v[i]);
                    } else if (operation === "-") {
                        currentVec = currentVec.map((val, i) => val - v[i]);
                    } else if (operation === "*") {
                        const m = isNumber ? parseFloat(t) : v;
                        currentVec = currentVec.map((val, i) => 
                            Array.isArray(m) ? val * m[i] : val * m
                        );
                    }
                }
            }
        }
    });

    let nearestWord = "Unknown";
    let minDist = Infinity;
    Object.keys(embeddedVocab3d).forEach(word => {
        const v = embeddedVocab3d[word];
        const dist = Math.sqrt(
            Math.pow(v[0] - currentVec[0], 2) + 
            Math.pow(v[1] - currentVec[1], 2) + 
            Math.pow(v[2] - currentVec[2], 2)
        );
        if (dist < minDist) { minDist = dist; nearestWord = word; }
    });

    document.getElementById('result-word').innerText = nearestWord;
    document.getElementById('result-display').style.display = 'block';

    try { if (typeof log === 'function') log('vec', `${input} = ${nearestWord}`); } catch(e) {}
    plot3DSpace(currentVec, nearestWord);
}
