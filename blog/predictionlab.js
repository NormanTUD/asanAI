const vocab = { "Der": 1, "König": 2, "trägt": 3, "eine": 4, "Krone": 5, "Brille": 6, "Verantwortung": 7 };
const invVocab = Object.fromEntries(Object.entries(vocab).map(([k, v]) => [v, k]));

function processPredictionStep() {
    const input = document.getElementById('gpt-input').value;
    const words = input.split(" ");
    
    // 1. Tokenisierung (IDs statt Wörter)
    const tokens = words.map(w => vocab[w] || Math.floor(Math.random() * 10) + 8);
    updateViz('step-tokens', tokens.join(", "));

    // 2. Embedding (Vektoren simulieren)
    // Ähnlich wie in deinem embeddinglab.js
    const lastToken = tokens[tokens.length - 1];
    const mockVec = [Math.random().toFixed(2), Math.random().toFixed(2), Math.random().toFixed(2)];
    updateViz('step-embeddings', `[${mockVec}]`);

    // 3. Attention (Welche Wörter sind wichtig?)
    // Visualisierung: Welches Wort "leuchtet" am stärksten?
    updateViz('step-attention', `Fokus auf: "${words[1]}" (König)`);

    // 4. Output-Logits (Wahrscheinlichkeiten für das nächste Wort)
    const candidates = ["Krone", "Brille", "Verantwortung"];
    const nextWord = candidates[Math.floor(Math.random() * candidates.length)];
    updateViz('step-output', nextWord);

    // Iteration: Das neue Wort zum Input hinzufügen (Loop)
    setTimeout(() => {
        const newSentence = input + " " + nextWord;
        document.getElementById('gpt-input').value = newSentence;
        document.getElementById('full-sentence-display').innerText = newSentence;
    }, 1000);
}

function updateViz(id, content) {
    document.querySelector(`#${id} .viz-content`).innerText = content;
}
