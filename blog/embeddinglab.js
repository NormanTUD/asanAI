/**
 * 3D WORD EMBEDDING LAB - LOGIC
 * Achsen-Definition:
 * [0] Status/Power (0 = normal, 10 = royal/divine)
 * [1] Gender       (-5 = männlich, 5 = weiblich, 0 = neutral)
 * [2] Species      (0 = Mensch, 10 = Tier, -10 = Objekt)
 */

const vocab3D = {
    // Menschen (Normal & Royal)
    'Man':      [0, -5, 0],   'Woman':    [0, 5, 0],
    'King':     [10, -5, 0],  'Queen':    [10, 5, 0],
    'Prince':   [7, -5, 0],   'Princess': [7, 5, 0],
    'Boy':      [-2, -5, 0],  'Girl':     [-2, 5, 0],
    
    // Gottheiten (Max Status)
    'God':      [12, -5, 0],  'Goddess':  [12, 5, 0],

    // Tiere (Wild & Haus)
    'Dog':      [0, -3, 10],  'Cat':      [0, 3, 10],
    'Puppy':    [-4, -3, 10], 'Kitten':   [-4, 3, 10],
    'Lion':     [8, -2, 10],  'Lioness':  [8, 4, 10], 
    
    // Abstrakte Konzepte / Achsen-Vektoren
    'Power':    [10, 0, 0],   
    'Human':    [0, 0, 0],
    'Animal':   [0, 0, 10],
    'Apple':    [0, 0, -10]   
};

/**
 * Initialisiert den 3D Plot sofort beim Laden der Seite
 */
window.addEventListener('load', () => {
    if (typeof Plotly !== 'undefined') {
        plot3DSpace();
    }
    updateAvailableWords();
});

/**
 * Hilfsfunktion: Zeigt alle verfügbaren Wörter in der UI an
 */
function updateAvailableWords() {
    const container = document.getElementById('available-words-list');
    if (container) {
        container.innerText = Object.keys(vocab3D).join(', ');
    }
}

/**
 * Zeichnet den Vektor-Raum
 */
function plot3DSpace(highlightPos = null, label = "") {
    let traces = [];
    
    Object.keys(vocab3D).forEach(word => {
        const v = vocab3D[word];
        traces.push({
            x: [v[0]], y: [v[1]], z: [v[2]],
            mode: 'markers+text',
            name: word, 
            text: word,
            textposition: 'top center',
            marker: { 
                size: 6, 
                opacity: 0.7, 
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
            marker: { 
                size: 12, 
                color: '#ef4444', 
                symbol: 'diamond',
                line: { color: 'white', width: 2 }
            },
            type: 'scatter3d'
        });
    }

    const layout = {
        title: 'Word Embedding Space (3D)',
        autosize: true,
        margin: { l: 0, r: 0, b: 0, t: 40 },
        scene: {
            xaxis: { title: 'Status', range: [-15, 15] },
            yaxis: { title: 'Gender', range: [-15, 15] },
            zaxis: { title: 'Species', range: [-15, 15] },
            camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } }
        },
        showlegend: false
    };

    Plotly.react('vec-3d-plot', traces, layout);
}

function calcVector() {
    const inputField = document.getElementById('vec-input');
    const input = inputField ? inputField.value : "";
    if (!input.trim()) return;

    const tokens = input.split(/([\+\-])/).map(s => s.trim()).filter(s => s !== "");
    
    let currentVec = [0, 0, 0];
    let operation = "+";
    let firstWordSet = false;

    tokens.forEach(t => {
        if (t === "+" || t === "-") {
            operation = t;
        } else {
            const v = vocab3D[t];
            if (v) {
                if (!firstWordSet) {
                    currentVec = [...v];
                    firstWordSet = true;
                } else {
                    if (operation === "+") {
                        currentVec = currentVec.map((val, i) => val + v[i]);
                    } else {
                        currentVec = currentVec.map((val, i) => val - v[i]);
                    }
                }
            }
        }
    });

    let nearestWord = "Unknown";
    let minDist = Infinity;
    
    Object.keys(vocab3D).forEach(word => {
        const v = vocab3D[word];
        const dist = Math.sqrt(
            Math.pow(v[0] - currentVec[0], 2) + 
            Math.pow(v[1] - currentVec[1], 2) + 
            Math.pow(v[2] - currentVec[2], 2)
        );
        
        if (dist < minDist) {
            minDist = dist;
            nearestWord = word;
        }
    });

    // Ergebnis-Anzeige (Groß)
    const resultBox = document.getElementById('result-display');
    const resultWord = document.getElementById('result-word');
    if (resultBox && resultWord) {
        resultWord.innerText = nearestWord;
        resultBox.style.display = 'block';
    }

    // Fehler-sicheres Logging
    try {
        if (typeof log === 'function') {
            log('vec', `Input: ${input} -> Match: ${nearestWord}`);
        }
    } catch(e) {
        console.log("Log-UI Element nicht gefunden, nutze Browser-Konsole:", nearestWord);
    }

    plot3DSpace(currentVec, nearestWord);
}
