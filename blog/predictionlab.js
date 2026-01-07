const transformerData = {
    // 3D-Embeddings: Koordinaten im "Bedeutungsraum"
    embeddings: {
        "Der": [0.1, 0.2, 0.8], "Die": [0.1, 0.3, 0.8], "Das": [0.1, 0.1, 0.8],
        "König": [0.8, 0.1, 0.1], "Krone": [0.9, 0.1, 0.0], "Macht": [0.7, 0.3, 0.2],
        "Wald": [0.1, 0.8, 0.1], "Baum": [0.1, 0.9, 0.0], "wächst": [0.2, 0.7, 0.2],
        "KI": [-0.7, 0.4, 0.3], "Daten": [-0.8, 0.3, 0.2], "lernt": [-0.6, 0.6, 0.1],
        "trägt": [0.5, 0.2, 0.1], "sieht": [0.3, 0.5, 0.1], "generiert": [-0.4, 0.6, 0.2],
        "eine": [0.2, 0.1, 0.7], "große": [0.3, 0.4, 0.6], "glänzt": [0.6, 0.1, 0.4],
        "und": [0, 0, 0], ".": [0, 0, -0.5]
    },
    
    getPredictions: function(sentence) {
        const last = sentence[sentence.length - 1];
        const grammar = {
            "Der": ["König", "Wald", "Baum"],
            "Die": ["KI", "Macht", "Krone"],
            "König": ["trägt", "sieht", "glänzt", "und"],
            "KI": ["lernt", "generiert", "sieht"],
            "trägt": ["eine", "große", "viele"],
            "eine": ["Krone", "Macht", "KI"],
            "Krone": ["glänzt", "und", "."],
            "Wald": ["wächst", "sieht", "."],
            ".": ["Der", "Die", "Das"]
        };
        const choices = grammar[last] || ["und", "Der", "KI", "Wald"];
        let res = {};
        choices.forEach(c => res[c] = 0.3 + Math.random() * 0.6);
        return res;
    }
};

let currentSentence = ["Der", "König"];
let hoverIndex = null;

function initTransformerLab() {
    renderAll();
}

function renderAll() {
    // 1. Tokens rendern
    const stream = document.getElementById('token-stream');
    stream.innerHTML = currentSentence.map((w, i) => `
        <div class="token-chip" 
             onmouseover="hoverIndex=${i}; updateVisuals();" 
             onmouseout="hoverIndex=null; updateVisuals();">
            <div class="token-id">#${100+i}</div>
            <div class="token-word">${w}</div>
        </div>
    `).join("");

    // 2. Wahrscheinlichkeiten & Plotly Update
    renderProbabilities();
    updateVisuals();
    plotEmbeddingSpace();
}

function updateVisuals() {
    renderAttention();
}

function renderAttention() {
    const canvas = document.getElementById('attention-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 120;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const chips = document.querySelectorAll('.token-chip');
    if(chips.length < 2) return;

    currentSentence.forEach((word, i) => {
        currentSentence.forEach((targetWord, j) => {
            if (i >= j) return; 

            const x1 = chips[i].offsetLeft + chips[i].offsetWidth / 2;
            const x2 = chips[j].offsetLeft + chips[j].offsetWidth / 2;
            
            const v1 = transformerData.embeddings[word] || [0,0,0];
            const v2 = transformerData.embeddings[targetWord] || [0,0,0];
            const similarity = v1.reduce((sum, v, idx) => sum + v * v2[idx], 0);
            const strength = Math.max(0.05, similarity);

            const active = (hoverIndex === i || hoverIndex === j);
            
            ctx.beginPath();
            ctx.lineWidth = active ? strength * 8 : 1.5;
            ctx.strokeStyle = active ? "#3b82f6" : "#cbd5e0";
            ctx.globalAlpha = (hoverIndex === null) ? strength : (active ? 0.9 : 0.05);
            
            const h = 10 + (strength * 50) + (Math.abs(i-j) * 10);
            ctx.moveTo(x1, 110);
            ctx.bezierCurveTo(x1, 110-h, x2, 110-h, x2, 110);
            ctx.stroke();
        });
    });
}

function plotEmbeddingSpace() {
    const data = [];
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    
    // Aktuelle Wörter im Satz plotten
    currentSentence.forEach((word, i) => {
        const vec = transformerData.embeddings[word] || [0,0,0];
        data.push({
            x: [vec[0]], y: [vec[1]], z: [vec[2]],
            mode: 'markers+text',
            type: 'scatter3d',
            name: word,
            text: [word],
            textposition: 'top center',
            marker: { size: 8, color: colors[i % colors.length], opacity: 0.8 }
        });
    });

    const layout = {
        margin: {l:0, r:0, b:0, t:0},
        scene: {
            xaxis: {title: '', showgrid: true, zeroline: false, showticklabels:false},
            yaxis: {title: '', showgrid: true, zeroline: false, showticklabels:false},
            zaxis: {title: '', showgrid: true, zeroline: false, showticklabels:false}
        },
        showlegend: false,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };

    Plotly.newPlot('embedding-plot', data, layout, {displayModeBar: false});
}

function renderProbabilities() {
    const probs = transformerData.getPredictions(currentSentence);
    const container = document.getElementById('prob-container');
    container.innerHTML = Object.entries(probs).map(([word, p]) => `
        <div class="prob-row" onclick="addWord('${word}')">
            <div style="display:flex; justify-content:space-between; font-size:12px;">
                <span>${word}</span>
                <span style="color:#3b82f6; font-weight:bold;">${(p*100).toFixed(0)}%</span>
            </div>
            <div class="prob-bar-bg"><div class="prob-bar-fill" style="width:${p*100}%"></div></div>
        </div>
    `).join("");
}

function addWord(word) {
    currentSentence.push(word);
    if(currentSentence.length > 8) currentSentence.shift();
    renderAll();
}

// Sofort beim Laden starten
window.addEventListener('load', initTransformerLab);
