const transformerData = {
    // 3D Embeddings [X, Y, Z] - Ähnliche Begriffe liegen nah beieinander
    embeddings: {
        "Der": [0.1, 0.2, 0.5], "Die": [0.1, 0.2, 0.6],
        "König": [0.8, 0.1, 0.2], "Krone": [0.9, 0.1, 0.1],
        "trägt": [0.4, 0.8, 0.1], "besitzt": [0.4, 0.7, 0.2],
        "eine": [0.2, 0.2, 0.8], "glänzende": [0.5, 0.3, 0.9],
        "KI": [-0.8, 0.5, 0.3], "Daten": [-0.7, 0.4, 0.2],
        "lernt": [-0.5, 0.8, 0.1], "schnell": [-0.3, 0.6, 0.8],
        "und": [0.0, 0.0, 0.0], ".": [0.0, 0.0, -0.5],
        "Macht": [0.7, 0.4, 0.3], "Zukunft": [-0.5, 0.2, 0.9]
    },
    
    // Die Grammatik-Matrix (vereinfacht)
    getPredictions: function(sentence) {
        const last = sentence[sentence.length - 1];
        const context = sentence.join(" ");
        
        let pool = {};
        if (last === "Der") pool = {"König": 0.8, "Weg": 0.2};
        else if (last === "König") pool = {"trägt": 0.6, "besitzt": 0.3, "und": 0.1};
        else if (last === "trägt" || last === "besitzt") pool = {"eine": 0.9, "Macht": 0.1};
        else if (last === "eine") pool = {"Krone": 0.6, "glänzende": 0.3, "Zukunft": 0.1};
        else if (last === "Krone") pool = {".": 0.5, "und": 0.5};
        else if (last === "Die") pool = {"KI": 0.8, "Krone": 0.2};
        else if (last === "KI") pool = {"lernt": 0.7, "besitzt": 0.3};
        else if (last === "lernt") pool = {"schnell": 0.8, "Daten": 0.2};
        else if (last === "schnell") pool = {"und": 0.5, ".": 0.5};
        else pool = {"Der": 0.3, "Die": 0.3, "KI": 0.4}; // Fallback/Loop
        
        return pool;
    }
};

let currentSentence = ["Der", "König"];

function renderAll() {
    renderTokens();
    setTimeout(() => renderAttention(), 50);
    renderProbabilities();
}

function renderTokens() {
    const container = document.getElementById('token-stream');
    container.innerHTML = currentSentence.map((w, i) => `
        <div class="token-chip" id="token-${i}" style="background: #f8fafc; border: 1px solid #e2e8f0; color: #1e293b; padding: 10px; border-radius: 8px; min-width: 60px; text-align: center;">
            <div style="font-size: 10px; color: #94a3b8; font-family: monospace;">#${Math.floor(Math.random()*900)+100}</div>
            <div style="font-weight: bold;">${w}</div>
        </div>
    `).join("");
}

function renderAttention(hoverWord = null) {
    const canvas = document.getElementById('attention-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 120;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const lastIdx = currentSentence.length - 1;
    const targetEl = document.getElementById(`token-${lastIdx}`);
    if (!targetEl) return;
    
    // Ziel ist die Mitte des letzten Tokens
    const targetX = targetEl.offsetLeft + (targetEl.offsetWidth / 2);

    currentSentence.forEach((word, i) => {
        if (i === lastIdx) return;
        
        const sourceEl = document.getElementById(`token-${i}`);
        const sourceX = sourceEl.offsetLeft + (sourceEl.offsetWidth / 2);
        
        // Simuliere Attention-Score basierend auf Embedding-Nähe
        let weight = 0.1;
        const vecA = transformerData.embeddings[word] || [0,0,0];
        const focusWord = hoverWord || currentSentence[lastIdx];
        const vecB = transformerData.embeddings[focusWord] || [0,0,0];
        
        // Dot product als Ähnlichkeit
        const similarity = vecA.reduce((sum, val, idx) => sum + val * vecB[idx], 0);
        weight = Math.max(0.05, similarity);

        ctx.beginPath();
        ctx.lineWidth = weight * 6;
        ctx.strokeStyle = hoverWord ? "#3b82f6" : "#cbd5e0";
        ctx.globalAlpha = hoverWord ? 0.8 : 0.4;
        
        // Bogen-Logik: Höher bei mehr Korrelation
        const dist = Math.abs(targetX - sourceX);
        const height = 20 + (weight * 60); 
        
        ctx.moveTo(sourceX, 100);
        ctx.bezierCurveTo(sourceX, 100 - height, targetX, 100 - height, targetX, 100);
        ctx.stroke();

        if (weight > 0.25) {
            ctx.fillStyle = "#3b82f6";
            ctx.font = "10px sans-serif";
            ctx.fillText((weight * 100).toFixed(0) + "%", (sourceX + targetX)/2, 100 - height - 5);
        }
    });
}

function renderProbabilities() {
    const probs = transformerData.getPredictions(currentSentence);
    const container = document.getElementById('prob-container');
    container.innerHTML = Object.entries(probs).map(([word, p]) => `
        <div class="prob-row" 
             style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; margin-bottom: 5px;"
             onmouseover="renderAttention('${word}')" 
             onmouseout="renderAttention()"
             onclick="addWord('${word}')">
            <div style="display:flex; justify-content:space-between; font-size: 13px;">
                <span>${word}</span>
                <span style="color: #3b82f6; font-weight: bold;">${(p * 100).toFixed(0)}%</span>
            </div>
            <div style="background: #f1f5f9; height: 4px; border-radius: 2px; margin-top: 5px;">
                <div style="width: ${p * 100}%; background: #3b82f6; height: 100%;"></div>
            </div>
        </div>
    `).join("");
}

function addWord(word) {
    currentSentence.push(word);
    if (currentSentence.length > 7) currentSentence.shift();
    renderAll();
}

window.addEventListener('load', renderAll);
