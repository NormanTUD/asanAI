/**
 * 3D WORD EMBEDDING LAB - LOGIC
 * Achsen-Definition:
 * [0] Status/Power (0 = normal, 10 = royal)
 * [1] Gender       (-5 = männlich, 5 = weiblich, 0 = neutral)
 * [2] Species      (0 = Mensch, 10 = Tier, -10 = Objekt)
 */

const vocab3D = {
    // Menschen
    'Man':    [0, -5, 0],   'Woman':  [0, 5, 0],
    'King':   [10, -5, 0],  'Queen':  [10, 5, 0],
    'Boy':    [-2, -5, 0],  'Girl':   [-2, 5, 0],
    
    // Tiere
    'Dog':    [0, -3, 10],  'Cat':    [0, 3, 10],
    'Puppy':  [-4, -3, 10], 'Kitten': [-4, 3, 10],
    
    // Abstrakte Konzepte (Das sind die "Achsen-Vektoren")
    'Power':  [10, 0, 0],   // Reiner Status-Vektor
    'Baby':   [-4, 0, 0],   // Reiner Alters-Vektor
    'Apple':  [0, 0, -10]
};

/**
 * Initialisiert den 3D Plot beim Laden
 */
function init3DVec() {
    plot3DSpace();
}

/**
 * Zeichnet den Vektor-Raum
 */
function plot3DSpace(highlightPos = null, label = "") {
    let traces = [];
    
    // Alle Wörter als graue Punkte zeichnen
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

    // Wenn ein Ergebnis berechnet wurde, dieses speziell markieren
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
            xaxis: { title: 'Status (Power)', range: [-12, 12] },
            yaxis: { title: 'Gender', range: [-12, 12] },
            zaxis: { title: 'Species', range: [-12, 12] },
            camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } }
        },
        showlegend: false
    };

    Plotly.react('vec-3d-plot', traces, layout);
}

/**
 * Kern-Logik: Rechnet mit den Vektoren
 */
function calcVector() {
    const input = document.getElementById('vec-input').value;
    // Teilt den String in Wörter und Operatoren auf
    const tokens = input.split(/([\+\-])/).map(s => s.trim()).filter(s => s !== "");
    
    let currentVec = [0, 0, 0];
    let operation = "+";
    let firstWordSet = false;

    tokens.forEach(t => {
        if (t === "+" || t === "-") {
            operation = t;
        } else {
            // Checke ob das Wort im Vokabular ist
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
            } else {
                console.warn(`Word not in vocab: ${t}`);
            }
        }
    });

    // Find Nearest Neighbor (Cosinus-Ähnlichkeit oder Euklidisch)
    // Wir nutzen hier Euklidisch für ELI5 Einfachheit
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

    // Ergebnis in die Konsole schreiben (nutzt deine helper.js log fkt)
    log('vec', `Input: <i>${input}</i> <br> 
                Result Coord: [${currentVec.map(v => v.toFixed(1))}] <br> 
                <b>Closest Match: ${nearestWord}</b>`);

    // Plot aktualisieren
    plot3DSpace(currentVec, nearestWord);
}
