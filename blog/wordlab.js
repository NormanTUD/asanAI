function updateProbabilities(currentVec) {
    const tempSlider = document.getElementById('temp-slider');
    const container = document.getElementById('prob-bars');
    const finalWordEl = document.getElementById('final-word');
    
    if (!container || !currentVec) return;

    // Temperatur berechnen (0.1 bis 5.0)
    const temp = tempSlider ? (tempSlider.value / 20) : 0.5;
    const scores = [];
    
    // 1. Abstände zu allen Wörtern im Vokabular berechnen
    Object.keys(vocab3D).forEach(word => {
        const v = vocab3D[word];
        const dist = Math.sqrt(
            Math.pow(v[0] - currentVec[0], 2) + 
            Math.pow(v[1] - currentVec[1], 2) + 
            Math.pow(v[2] - currentVec[2], 2)
        );
        // Softmax-ähnlicher Score: Kleinerer Abstand = deutlich höherer Score
        scores.push({ word, score: Math.exp(-dist / temp) });
    });

    // 2. Normalisieren auf 100%
    const sum = scores.reduce((acc, s) => acc + s.score, 0);
    scores.forEach(s => s.prob = (s.score / sum) * 100);
    
    // 3. Sortieren (höchste Wahrscheinlichkeit zuerst)
    scores.sort((a, b) => b.prob - a.prob);
    
    // 4. HTML Balken zeichnen
    container.innerHTML = scores.slice(0, 5).map(s => `
        <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #1e293b; margin-bottom: 2px;">
                <span style="font-weight:bold">${s.word}</span> <span>${s.prob.toFixed(1)}%</span>
            </div>
            <div style="background: #e2e8f0; width: 100%; height: 10px; border-radius: 5px; overflow: hidden;">
                <div style="background: #3b82f6; width: ${s.prob}%; height: 100%; transition: width 0.4s ease-out;"></div>
            </div>
        </div>
    `).join('');

    // 5. "Würfeln" (Stochastisches Sampling)
    let rand = Math.random() * 100;
    let cumulative = 0;
    let chosen = scores[0].word;
    for(let s of scores) {
        cumulative += s.prob;
        if(rand <= cumulative) {
            chosen = s.word;
            break;
        }
    }
    if (finalWordEl) finalWordEl.innerText = chosen;
}
