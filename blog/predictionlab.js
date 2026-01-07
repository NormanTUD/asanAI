/**
 * PredictionLab.js 
 * Implementiert eine vereinfachte Transformer-Architektur mit:
 * - Query (Q), Key (K), Value (V) Projektionen
 * - Dot-Product Attention Berechnung
 * - Kontext-sensitiver Token-Vorhersage
 */

const transformerData = {
    // Statische Embeddings (Bedeutungs-Vektoren)
    embeddings: {
        "The": [0.1, 0.1, 0.9], "A": [0.1, 0.2, 0.9], "and": [0, 0, 0], 
        "is": [0, 0.2, 0.5], "in": [0.1, 0.1, 0.4], ".": [0, 0, -0.5],
        
        // Royalty Cluster
        "King": [0.8, 0.1, 0.2], "Queen": [0.8, 0.2, 0.3], 
        "Crown": [0.9, 0.1, 0.1], "Power": [0.7, 0.3, 0.2], "golden": [0.7, 0.4, 0.1],
        
        // Nature Cluster
        "Forest": [0.1, 0.8, 0.1], "Tree": [0.1, 0.9, 0.0], 
        "Flower": [0.2, 0.8, 0.3], "grows": [0.2, 0.7, 0.2], "green": [0.1, 0.7, 0.4],
        
        // Technology Cluster
        "AI": [-0.7, 0.4, 0.3], "Data": [-0.8, 0.3, 0.2], 
        "Robot": [-0.6, 0.4, 0.4], "learns": [-0.6, 0.6, 0.1], "digital": [-0.5, 0.5, 0.5],
        
        // Actions & Descriptors
        "wears": [0.5, 0.2, 0.1], "sees": [0.3, 0.5, 0.1], 
        "creates": [-0.4, 0.6, 0.2], "shines": [0.6, 0.1, 0.4], "large": [0.3, 0.4, 0.6]
    },

    // Gewichts-Matrizen für die lineare Projektion
    weights: {
        Wq: [ [1.2, 0.1, -0.5], [0.2, 1.1, 0.1], [-0.4, 0.2, 0.8] ], // Query: Was ein Wort "sucht"
        Wk: [ [1.0, 0.2, 0.1], [0.1, 1.0, 0.2], [0.1, 0.1, 1.0] ],  // Key: Was ein Wort "anbietet"
        Wv: [ [0.8, 0.3, 0.1], [0.2, 0.8, 0.2], [0.1, 0.2, 0.8] ]   // Value: Der inhaltliche Wert
    },

    // Hilfsfunktion: Matrix-Vektor Multiplikation
    project: function(vector, matrix) {
        return matrix.map(row => row.reduce((acc, val, i) => acc + val * vector[i], 0));
    },

    /**
     * Berechnet die Wahrscheinlichkeiten für das nächste Wort basierend auf dem Kontext.
     */
    getPredictions: function(sentence) {
        const last = sentence[sentence.length - 1];
        const fullText = sentence.join(" ");
        
        // Kontext-Erkennung zur Steuerung der thematischen Relevanz
        const isTech = fullText.match(/AI|Data|Robot|digital/);
        const isNature = fullText.match(/Forest|Tree|Flower|green/);
        const isRoyalty = fullText.match(/King|Queen|Crown|Power/);

        const grammar = {
            "The": ["King", "Queen", "AI", "Forest", "Robot"],
            "A": ["King", "Queen", "Tree", "Flower", "Robot"],
            "King": ["wears", "sees", "shines", "is"],
            "Queen": ["wears", "sees", "shines", "is"],
            "AI": ["learns", "creates", "sees", "is"],
            "Robot": ["learns", "creates", "is"],
            "Data": ["is", "shines", "grows"], 
            "wears": ["a", "the", "golden", "digital"],
            "shines": ["in", "and", "."],
            "grows": ["in", "and", "."],
            "Forest": ["is", "grows", "sees", "."],
            "Tree": ["grows", "is", "."],
            "golden": ["Crown", "Flower", "shines"],
            "digital": ["Data", "Power", "AI"],
            "green": ["Forest", "Tree", "Flower"],
            "is": ["large", "golden", "green", "digital"],
            "creates": ["Data", "Power", "AI", "a"],
            "sees": ["the", "a", "Forest", "King"],
            "and": ["The", "A", "AI"],
            "in": ["the", "a", "Forest", "digital"],
            ".": ["The", "A", "AI", "Forest"]
        };

        let choices = grammar[last] || ["and", "The", "AI", "Forest"];
        let res = {};

        choices.forEach((c) => {
            let score = 0.2 + Math.random() * 0.3; // Basis-Score
            
            // Kontext-Boosts für logischere Sätze
            if (isTech && ["Data", "digital", "AI", "creates"].includes(c)) score += 0.6;
            if (isNature && ["Forest", "green", "grows", "Tree"].includes(c)) score += 0.6;
            if (isRoyalty && ["Crown", "golden", "Power", "wears"].includes(c)) score += 0.6;
            
            // Logik-Filter
            if (last === "creates" && isTech && c === "Forest") score -= 0.7;
            if (last === "is" && isRoyalty && c === "digital") score -= 0.5;
            if (sentence.length > 5 && c === ".") score += 0.4;

            res[c] = Math.max(0.05, score); 
        });
        return res;
    }
};

let currentSentence = ["The", "King"];
let hoverIndex = null;

function initTransformerLab() {
    renderAll();
}

/**
 * Zeichnet alle UI-Elemente neu
 */
function renderAll() {
    // 1. Token Chips rendern
    const stream = document.getElementById('token-stream');
    stream.innerHTML = currentSentence.map((w, i) => `
        <div class="token-chip" 
             onmouseover="hoverIndex=${i}; renderAttention();" 
             onmouseout="hoverIndex=null; renderAttention();">
            <div class="token-id">#${100+i}</div>
            <div class="token-word">${w}</div>
        </div>
    `).join("");

    // 2. Restliche Visualisierungen aktualisieren
    renderProbabilities();
    renderAttention();
    plotEmbeddingSpace();
}

/**
 * Berechnet und visualisiert die Self-Attention (Q * K)
 */
function renderAttention() {
    const canvas = document.getElementById('attention-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const chips = document.querySelectorAll('.token-chip');
    if (chips.length < 2) return;
    const containerRect = document.getElementById('token-stream').getBoundingClientRect();

    currentSentence.forEach((wordI, i) => {
        // Berechne Query (Q) für das fokussierte Wort
        const vI = transformerData.embeddings[wordI] || [0,0,0];
        const Q = transformerData.project(vI, transformerData.weights.Wq);

        currentSentence.forEach((wordJ, j) => {
            if (i === j) return; 

            // Berechne Key (K) für das Zielwort
            const vJ = transformerData.embeddings[wordJ] || [0,0,0];
            const K = transformerData.project(vJ, transformerData.weights.Wk);

            // Dot-Product Attention: Q * K
            const dotProduct = Q.reduce((sum, val, idx) => sum + val * K[idx], 0);
            const strength = Math.max(0.05, dotProduct / 1.5); 

            const chip1 = chips[i].getBoundingClientRect();
            const chip2 = chips[j].getBoundingClientRect();
            const x1 = (chip1.left + chip1.width / 2) - containerRect.left;
            const x2 = (chip2.left + chip2.width / 2) - containerRect.left;
            const baseY = canvas.height - 5; 

            const active = (hoverIndex === i || hoverIndex === j);
            
            ctx.beginPath();
            ctx.lineWidth = active ? strength * 10 : strength * 3;
            ctx.strokeStyle = active ? "#3b82f6" : "#cbd5e0";
            ctx.globalAlpha = (hoverIndex === null) ? Math.min(1, strength) : (active ? 0.9 : 0.05);
            
            const h = 20 + (strength * 30) + (Math.abs(x2 - x1) * 0.15);
            ctx.moveTo(x1, baseY);
            ctx.bezierCurveTo(x1, baseY - h, x2, baseY - h, x2, baseY);
            ctx.stroke();

            // Berechnungswert als Label bei Hover anzeigen
            if (hoverIndex === i && active) {
                ctx.fillStyle = "#1e293b";
                ctx.font = "bold 9px monospace";
                ctx.fillText(`${dotProduct.toFixed(2)}`, (x1+x2)/2 - 10, baseY - h - 5);
            }
        });
    });
}

/**
 * Visualisiert die statischen Embeddings im 3D-Raum
 */
function plotEmbeddingSpace() {
    const data = [];
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#71717a'];
    
    currentSentence.forEach((word, i) => {
        const vec = transformerData.embeddings[word] || [0,0,0];
        data.push({
            x: [vec[0]], y: [vec[1]], z: [vec[2]],
            mode: 'markers+text',
            type: 'scatter3d',
            name: word,
            text: [word],
            textposition: 'top center',
            marker: { size: 8, color: colors[i % colors.length], opacity: 0.9 }
        });
    });

    const layout = {
        margin: {l:0, r:0, b:0, t:0},
        scene: {
            xaxis: {title: 'Theme', showgrid: true, showticklabels:false},
            yaxis: {title: 'Context', showgrid: true, showticklabels:false},
            zaxis: {title: 'Syntax', showgrid: true, showticklabels:false}
        },
        showlegend: false,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };

    Plotly.newPlot('embedding-plot', data, layout, {displayModeBar: false});
}

/**
 * Zeigt die sortierten Vorhersagen für das nächste Wort an
 */
function renderProbabilities() {
    const probs = transformerData.getPredictions(currentSentence);
    const container = document.getElementById('prob-container');
    
    container.innerHTML = Object.entries(probs)
        .sort(([, a], [, b]) => b - a) 
        .map(([word, p]) => `
        <div class="prob-row" onclick="addWord('${word}')">
            <div class="prob-info">
                <span class="prob-word">${word}</span>
                <span class="prob-value">${(p*100).toFixed(1)}%</span>
            </div>
            <div class="prob-bar-bg">
                <div class="prob-bar-fill" style="width:${p*100}%"></div>
            </div>
        </div>
    `).join("");
}

/**
 * Fügt ein neues Wort zum Satz hinzu
 */
function addWord(word) {
    currentSentence.push(word);
    if(currentSentence.length > 10) currentSentence.shift();
    renderAll();
}

// Initialisierung
window.addEventListener('load', initTransformerLab);
