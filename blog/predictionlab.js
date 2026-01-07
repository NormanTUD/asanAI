/**
 * PredictionLab.js - QKV Deep Dive Version
 * Berechnet und visualisiert Query, Key und Value Matrizen live.
 */

const transformerData = {
    embeddings: {
        "The": [0.1, 0.1, 0.9], "A": [0.1, 0.2, 0.9], "and": [0, 0, 0], 
        "is": [0, 0.2, 0.5], "in": [0.1, 0.1, 0.4], ".": [0, 0, -0.5],
        "King": [0.8, 0.1, 0.2], "Queen": [0.8, 0.2, 0.3], "Crown": [0.9, 0.1, 0.1], 
        "Power": [0.7, 0.3, 0.2], "golden": [0.7, 0.4, 0.1],
        "Forest": [0.1, 0.8, 0.1], "Tree": [0.1, 0.9, 0.0], "Flower": [0.2, 0.8, 0.3], 
        "grows": [0.2, 0.7, 0.2], "green": [0.1, 0.7, 0.4],
        "AI": [-0.7, 0.4, 0.3], "Data": [-0.8, 0.3, 0.2], "Robot": [-0.6, 0.4, 0.4], 
        "learns": [-0.6, 0.6, 0.1], "digital": [-0.5, 0.5, 0.5],
        "wears": [0.5, 0.2, 0.1], "sees": [0.3, 0.5, 0.1], "creates": [-0.4, 0.6, 0.2], 
        "shines": [0.6, 0.1, 0.4], "large": [0.3, 0.4, 0.6]
    },

    weights: {
        Wq: [ [1.2, 0.1, -0.5], [0.2, 1.1, 0.1], [-0.4, 0.2, 0.8] ],
        Wk: [ [1.0, 0.2, 0.1], [0.1, 1.0, 0.2], [0.1, 0.1, 1.0] ],
        Wv: [ [0.8, 0.3, 0.1], [0.2, 0.8, 0.2], [0.1, 0.2, 0.8] ]
    },

    project: function(vector, matrix) {
        return matrix.map(row => row.reduce((acc, val, i) => acc + val * vector[i], 0));
    },

    getPredictions: function(sentence) {
        const last = sentence[sentence.length - 1];
        const fullText = sentence.join(" ");
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
            let score = 0.2 + Math.random() * 0.3;
            if (isTech && ["Data", "digital", "AI", "creates"].includes(c)) score += 0.6;
            if (isNature && ["Forest", "green", "grows", "Tree"].includes(c)) score += 0.6;
            if (isRoyalty && ["Crown", "golden", "Power", "wears"].includes(c)) score += 0.6;
            res[c] = Math.max(0.05, score); 
        });
        return res;
    }
};

let currentSentence = ["The"];
let hoverIndex = null;

function initTransformerLab() { renderAll(); }

function renderAll() {
    const stream = document.getElementById('token-stream');
    stream.innerHTML = currentSentence.map((w, i) => `
        <div class="token-chip" onmouseover="hoverIndex=${i}; renderAttention();" onmouseout="hoverIndex=null; renderAttention();">
            <div class="token-id">#${100+i}</div><div class="token-word">${w}</div>
        </div>
    `).join("");

    renderProbabilities();
    renderAttention();
    plotEmbeddingSpace();
    renderQKVMath();
    plotQKVVectors();
}

function renderAttention() {
    const canvas = document.getElementById('attention-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const chips = document.querySelectorAll('.token-chip');
    const containerRect = document.getElementById('token-stream').getBoundingClientRect();

    currentSentence.forEach((wordI, i) => {
        const vI = transformerData.embeddings[wordI] || [0,0,0];
        const Q = transformerData.project(vI, transformerData.weights.Wq);

        currentSentence.forEach((wordJ, j) => {
            if (i === j) return; 
            const vJ = transformerData.embeddings[wordJ] || [0,0,0];
            const K = transformerData.project(vJ, transformerData.weights.Wk);

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

            if (hoverIndex === i && active) {
                ctx.fillStyle = "#1e293b"; ctx.font = "bold 9px monospace";
                ctx.fillText(`${dotProduct.toFixed(2)}`, (x1+x2)/2 - 10, baseY - h - 5);
            }
        });
    });
}

/**
 * Erzeugt MathJax Formeln für die Q, K, V Vektoren
 */
function renderQKVMath() {
    const container = document.getElementById('math-container');
    if (!container) return;

    let html = `<table style="width:100%; font-size:0.8rem; border-collapse:collapse;">
                <tr style="border-bottom:1px solid #eee; color:#64748b;"><th>Token</th><th>Query (Q)</th><th>Key (K)</th></tr>`;
    
    currentSentence.forEach(word => {
        const v = transformerData.embeddings[word];
        const Q = transformerData.project(v, transformerData.weights.Wq);
        const K = transformerData.project(v, transformerData.weights.Wk);
        
        const formatVec = (vec) => `[${vec.map(n => n.toFixed(1)).join(", ")}]`;
        
        html += `<tr>
            <td style="padding:8px; font-weight:bold;">${word}</td>
            <td style="padding:8px;">$$\\vec{v} \\cdot W_q = ${formatVec(Q)}$$</td>
            <td style="padding:8px;">$$\\vec{v} \\cdot W_k = ${formatVec(K)}$$</td>
        </tr>`;
    });
    html += `</table>`;
    container.innerHTML = html;
    if (window.MathJax) MathJax.typeset();
}

/**
 * Plottet die transformierten Q und K Vektoren
 */
function plotQKVVectors() {
    const traces = [];
    currentSentence.forEach((word, i) => {
        const v = transformerData.embeddings[word];
        const Q = transformerData.project(v, transformerData.weights.Wq);
        const K = transformerData.project(v, transformerData.weights.Wk);

        // Query Vector Trace
        traces.push({
            x: [0, Q[0]], y: [0, Q[1]], z: [0, Q[2]],
            mode: 'lines+markers', type: 'scatter3d', name: `Q:${word}`,
            line: {width: 6, color: '#3b82f6'}
        });
        // Key Vector Trace
        traces.push({
            x: [0, K[0]], y: [0, K[1]], z: [0, K[2]],
            mode: 'lines+markers', type: 'scatter3d', name: `K:${word}`,
            line: {width: 4, dash: 'dot', color: '#ef4444'}
        });
    });

    const layout = {
        margin: {l:0, r:0, b:0, t:0},
        scene: { xaxis: {title: 'Q/K-X'}, yaxis: {title: 'Q/K-Y'}, zaxis: {title: 'Q/K-Z'} },
        showlegend: false, paper_bgcolor: 'rgba(0,0,0,0)'
    };
    Plotly.newPlot('qkv-plot', traces, layout, {displayModeBar: false});
}

function plotEmbeddingSpace() {
    const data = currentSentence.map((word, i) => {
        const vec = transformerData.embeddings[word] || [0,0,0];
        return {
            x: [vec[0]], y: [vec[1]], z: [vec[2]],
            mode: 'markers+text', type: 'scatter3d', name: word, text: [word],
            marker: { size: 8, opacity: 0.9 }
        };
    });
    Plotly.newPlot('embedding-plot', data, {margin: {l:0,r:0,b:0,t:0}, paper_bgcolor: 'rgba(0,0,0,0)'}, {displayModeBar: false});
}

function renderProbabilities() {
    const probs = transformerData.getPredictions(currentSentence);
    const container = document.getElementById('prob-container');
    container.innerHTML = Object.entries(probs).sort(([, a], [, b]) => b - a).map(([word, p]) => `
        <div class="prob-row" onclick="addWord('${word}')">
            <div class="prob-info"><span class="prob-word">${word}</span><span class="prob-value">${(p*100).toFixed(1)}%</span></div>
            <div class="prob-bar-bg"><div class="prob-bar-fill" style="width:${p*100}%"></div></div>
        </div>
    `).join("");
}

function addWord(word) {
    currentSentence.push(word);
    if(currentSentence.length > 8) currentSentence.shift();
    renderAll();
}

window.addEventListener('load', initTransformerLab);
