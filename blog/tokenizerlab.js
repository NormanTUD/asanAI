/**
 * Global Tokenizer Function
 * @param {string} type - 'spaces', 'trigrams', or 'bpe'
 */
function tokenize(type) {
    const input = document.getElementById(`token-input-${type}`);
    const container = document.getElementById(`viz-${type}`);
    if (!input || !container) return;

    const text = input.value;
    let tokens = [];

    if (type === 'spaces') {
        // Simple split by whitespace
        tokens = text.split(/\s+/).filter(t => t.length > 0);
    } 
    else if (type === 'trigrams') {
        // Fixed length of 3, replacing spaces with underscores for visibility
        const cleanText = text.replace(/\s+/g, '_');
        for (let i = 0; i < cleanText.length; i += 3) {
            tokens.push(cleanText.substring(i, i + 3));
        }
    } 
    else if (type === 'bpe') {
        // Simulated BPE: We define common sub-word patterns
        const subUnits = ["tion", "ing", "haus", "er", "ly", "is", "ment", "ness", "ation"];
        const words = text.split(/\s+/);
        
        words.forEach(word => {
            let found = false;
            // Check if word ends with one of our known sub-units
            for (let unit of subUnits) {
                if (word.toLowerCase().endsWith(unit) && word.length > unit.length) {
                    tokens.push(word.substring(0, word.length - unit.length));
                    tokens.push("##" + unit); // Common notation for sub-tokens
                    found = true;
                    break;
                }
            }
            if (!found && word.length > 0) tokens.push(word);
        });
    }

    // Render the badges
    container.innerHTML = tokens.map(t => {
        // Simple hash for consistent colors per token
        const hash = t.split('').reduce((acc, char) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0);
        const hue = Math.abs(hash) % 360;
        
        return `
            <div style="
                background: hsl(${hue}, 65%, 40%); 
                color: white; 
                padding: 5px 12px; 
                border-radius: 6px; 
                font-family: 'Courier New', monospace; 
                font-size: 0.85rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
                ${t}
                <span style="font-size: 0.6rem; opacity: 0.8; margin-top: 3px; border-top: 1px solid rgba(255,255,255,0.2); width: 100%; text-align: center;">
                    ID: ${Math.abs(hash) % 1000}
                </span>
            </div>
        `;
    }).join('');
}

// Initialer Aufruf beim Laden der Seite
window.addEventListener('load', () => {
    ['spaces', 'trigrams', 'bpe'].forEach(type => tokenize(type));
});
