function updateProbabilities(currentVec) {
    const temp = (document.getElementById('temp-slider').value / 20) || 0.5;
    const scores = [];
    
    // 1. Berechne Abstände zu ALLEN Wörtern
    Object.keys(vocab3D).forEach(word => {
        const v = vocab3D[word];
        const dist = Math.sqrt(v.reduce((acc, val, i) => acc + Math.pow(val - currentVec[i], 2), 0));
        // Inverse Distanz: Kleinerer Abstand = Höherer Score
        scores.push({ word, score: Math.exp(-dist / temp) });
    });

    // 2. Normalisieren (Summe = 100%)
    const sum = scores.reduce((acc, s) => acc + s.score, 0);
    scores.forEach(s => s.prob = (s.score / sum) * 100);
    
    // 3. Sortieren und Top 5 anzeigen
    scores.sort((a, b) => b.prob - a.prob);
    
    const container = document.getElementById('prob-bars');
    container.innerHTML = scores.slice(0, 5).map(s => `
        <div style="margin-bottom: 5px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                <span>${s.word}</span> <span>${s.prob.toFixed(1)}%</span>
            </div>
            <div style="background: #e2e8f0; width: 100%; height: 8px; border-radius: 4px;">
                <div style="background: #3b82f6; width: ${s.prob}%; height: 100%; border-radius: 4px; transition: width 0.3s;"></div>
            </div>
        </div>
    `).join('');

    // 4. "Würfeln" (Stochastisches Sampling)
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
    document.getElementById('final-word').innerText = chosen;
}
