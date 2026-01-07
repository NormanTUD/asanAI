// Ein kleiner Wissens-Graph für die Demo
const gptLogic = {
    vocab: {
        "Der": { id: 101, color: "#3b82f6" },
        "König": { id: 442, color: "#ef4444" },
        "trägt": { id: 891, color: "#10b981" },
        "eine": { id: 205, color: "#f59e0b" },
        "Krone": { id: 993, color: "#8b5cf6" },
        "Brille": { id: 512, color: "#6366f1" },
        "Verantwortung": { id: 771, color: "#ec4899" }
    },
    // Simulation der Logits (Wahrscheinlichkeiten basierend auf dem Kontext)
    predict: function(sentence) {
        const last = sentence[sentence.length - 1];
        const full = sentence.join(" ");
        
        if (last === "eine") {
            // Hier passiert die "Magie": Kontextprüfung
            if (sentence.includes("König")) {
                return { "Krone": 0.75, "Verantwortung": 0.20, "Brille": 0.05 };
            }
            return { "Brille": 0.4, "Krone": 0.1, "Verantwortung": 0.5 };
        }
        if (last === "Der") return { "König": 0.8, "Mann": 0.2 };
        if (last === "König") return { "trägt": 0.9, "schläft": 0.1 };
        if (last === "trägt") return { "eine": 1.0 };
        return { "...": 1.0 };
    }
};

let currentSentence = ["Der", "König", "trägt", "eine"];

function initTransformerLab() {
    renderAll();
}

function renderAll() {
    renderTokens();
    renderAttention();
    
    const probs = gptLogic.predict(currentSentence);
    renderProbabilities(probs);
}

function renderTokens() {
    const container = document.getElementById('token-stream');
    container.innerHTML = currentSentence.map((w, i) => `
        <div class="token-chip" style="background: ${gptLogic.vocab[w]?.color || '#64748b'}">
            <span style="font-size: 10px; opacity: 0.8;">#${i}</span>
            <span style="font-weight: bold;">${w}</span>
            <span style="font-size: 9px;">ID: ${gptLogic.vocab[w]?.id || '??'}</span>
        </div>
    `).join("");
}

function renderAttention() {
    const canvas = document.getElementById('attention-canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    const count = currentSentence.length;
    const spacing = w / (count + 1);
    
    // Wir visualisieren die Attention des LETZTEN Wortes auf die vorherigen
    ctx.setLineDash([5, 5]);
    for (let i = 0; i < count - 1; i++) {
        const strength = (currentSentence[i] === "König" || currentSentence[i] === "trägt") ? 3 : 0.5;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(59, 130, 246, ${strength / 3})`;
        ctx.lineWidth = strength;
        
        // Zeichne Kurven
        ctx.moveTo((i + 1) * spacing, 20);
        ctx.bezierCurveTo((i + 1) * spacing, h, count * spacing, h, count * spacing, 20);
        ctx.stroke();
    }
}

function renderProbabilities(probs) {
    const container = document.getElementById('prob-container');
    container.innerHTML = Object.entries(probs).map(([word, p]) => `
        <div class="prob-row" onclick="addWord('${word}')" style="margin-bottom: 8px; cursor: pointer;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
                <span>${word}</span>
                <span>${(p * 100).toFixed(0)}%</span>
            </div>
            <div style="width: 100%; background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="width: ${p * 100}%; background: #3b82f6; height: 100%; transition: width 0.3s;"></div>
            </div>
        </div>
    `).join("");
}

function addWord(word) {
    currentSentence.push(word);
    if (currentSentence.length > 8) currentSentence.shift(); // Kurz halten
    renderAll();
}

// Start
window.addEventListener('load', initTransformerLab);
