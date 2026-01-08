/**
 * Synchronisiert alle Visualisierungen basierend auf dem Master-Input
 */
function syncAndTokenize(val) {
    const masterInput = document.getElementById('master-token-input');
    
    // Falls das Eingabefeld nicht existiert (andere Seite), Funktion abbrechen
    if (!masterInput) return;

    const text = (val !== undefined) ? val : masterInput.value;
    const methods = ['spaces', 'trigrams', 'bpe', 'chars'];
    
    methods.forEach(type => {
        renderTokens(type, text);
    });
}

/**
 * Erstellt die Token-Badges für eine spezifische Methode
 */
function renderTokens(type, text) {
    const container = document.getElementById(`viz-${type}`);
    // Falls der spezifische Container nicht existiert, überspringen
    if (!container) return;

    let tokens = [];

    if (type === 'spaces') {
        tokens = text.split(/\s+/).filter(t => t.length > 0);
    } 
    else if (type === 'trigrams') {
        const nInput = document.getElementById('ngram-size');
        const n = nInput ? parseInt(nInput.value) : 3;
        const cleanText = text.replace(/\s+/g, '_');
        for (let i = 0; i < cleanText.length; i += n) {
            tokens.push(cleanText.substring(i, i + n));
        }
    } 
    else if (type === 'bpe') {
        const subUnits = ["tion", "ing", "haus", "er", "ly", "is", "ment", "ness", "ation"];
        const words = text.split(/\s+/);
        words.forEach(word => {
            let found = false;
            for (let unit of subUnits) {
                if (word.toLowerCase().endsWith(unit) && word.length > unit.length) {
                    tokens.push(word.substring(0, word.length - unit.length));
                    tokens.push("##" + unit);
                    found = true;
                    break;
                }
            }
            if (!found && word.length > 0) tokens.push(word);
        });
    }
    else if (type === 'chars') {
        tokens = text.split('');
    }

    // HTML Rendering mit konsistentem Hashing für Farben
    container.innerHTML = tokens.map(t => {
        const hash = t.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
        const hue = Math.abs(hash) % 360;
        const displayToken = (t === ' ') ? '␣' : t; 
        
        return `
            <div style="background: hsl(${hue}, 65%, 40%); color: white; padding: 5px 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 0.85rem; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ${displayToken}
                <span style="font-size: 0.6rem; opacity: 0.8; margin-top: 3px; border-top: 1px solid rgba(255,255,255,0.2); width: 100%; text-align: center;">
                    ID: ${Math.abs(hash) % 1000}
                </span>
            </div>
        `;
    }).join('');
}

// Event-Listener sicher initialisieren
window.addEventListener('load', () => {
    // Kleiner Delay, damit PHP-Inhalte sicher im DOM verfügbar sind
    setTimeout(syncAndTokenize, 50);
});
