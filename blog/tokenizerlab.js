function tokenizeLive() {
    const text = document.getElementById('token-input').value;
    const method = document.getElementById('token-method').value;
    const container = document.getElementById('token-visualizer');
    let tokens = [];

    if (method === 'spaces') {
        // Simples Splitting nach Leerzeichen
        tokens = text.split(/\s+/).filter(t => t.length > 0);
    } else if (method === 'trigrams') {
        // Fixe Länge: Immer 3 Zeichen (Trigramme)
        const cleanText = text.replace(/\s+/g, '_');
        for (let i = 0; i < cleanText.length; i += 3) {
            tokens.push(cleanText.substring(i, i + 3));
        }
    } else if (method === 'bpe') {
        // Simuliertes BPE (Byte-Pair Encoding)
        // Erkennt häufige Endungen/Vorsilben wie "ing", "tion", "is"
        const commonSub = ["tion", "ing", "iz", "is", "ment", "al"];
        let tempText = text;
        
        // Sehr vereinfachte Simulation: Wir suchen nach häufigen Mustern
        let words = text.split(/\s+/);
        words.forEach(word => {
            let found = false;
            commonSub.forEach(sub => {
                if (word.endsWith(sub) && word.length > sub.length) {
                    tokens.push(word.replace(sub, ""));
                    tokens.push("##" + sub);
                    found = true;
                }
            });
            if (!found) tokens.push(word);
        });
    }

    // Visualisierung rendern
    container.innerHTML = tokens.map((t, i) => `
        <div class="token-badge" style="
            background: ${getColorForToken(t)};
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-family: monospace;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            animation: popIn 0.3s ease-out;
        ">
            ${t}
            <div style="font-size: 0.6rem; opacity: 0.8; text-align: center;">ID: ${Math.abs(t.hashCode()) % 1000}</div>
        </div>
    `).join('');
    
    document.getElementById('token-count').innerText = tokens.length;
}

// Hilfsfunktionen
String.prototype.hashCode = function() {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        hash = ((hash << 5) - hash) + this.charCodeAt(i);
        hash |= 0;
    }
    return hash;
};

function getColorForToken(str) {
    const hues = [210, 190, 160, 280, 340];
    const hash = Math.abs(str.hashCode());
    return `hsl(${hues[hash % hues.length]}, 70%, 45%)`;
}

// CSS Animation hinzufügen (einfach per JS)
const style = document.createElement('style');
style.innerHTML = `@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }`;
document.head.appendChild(style);
