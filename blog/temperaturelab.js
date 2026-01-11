// --- 1. TEMPERATURE LOGIC ---
let rawLogits = [4.5, 4.0, 3.8, 2.1, 1.0]; // "Energie"-Werte für Wörter
const words = ["Haus", "Hund", "Auto", "Pizza", "Weltraum"];

function updateSamplingChart() {
    const temp = parseFloat(document.getElementById('temp-slider').value);
    document.getElementById('temp-val').innerText = temp.toFixed(1);

    // Softmax mit Temperatur: exp(logit / temp) / sum(exp(logit / temp))
    const expValues = rawLogits.map(l => Math.exp(l / temp));
    const sumExp = expValues.reduce((a, b) => a + b, 0);
    const probs = expValues.map(v => v / sumExp);

    const data = [{
        x: words,
        y: probs,
        type: 'bar',
        marker: { color: '#3b82f6' }
    }];

    const layout = {
        title: 'Wahrscheinlichkeitsverteilung',
        yaxis: { range: [0, 1], title: 'Wahrscheinlichkeit' },
        margin: { t: 40, b: 40, l: 40, r: 40 }
    };

    Plotly.newPlot('sampling-chart', data, layout);
    return { words, probs };
}

function sampleWord() {
    const { words, probs } = updateSamplingChart();
    const rand = Math.random();
    let cumulative = 0;
    let selected = words[words.length - 1];

    for (let i = 0; i < probs.length; i++) {
        cumulative += probs[i];
        if (rand < cumulative) {
            selected = words[i];
            break;
        }
    }
    document.getElementById('sampling-output').innerHTML = `Gewähltes Wort: <b>${selected}</b> (Zufallswert: ${rand.toFixed(2)})`;
}

// --- 2. POSITIONAL ENCODING LOGIC ---
function drawPositionalEncoding() {
    const d_model = 64; // Dimension des Embeddings
    const max_pos = 50;  // Maximale Satzlänge
    const zData = [];

    for (let pos = 0; pos < max_pos; pos++) {
        const row = [];
        for (let i = 0; i < d_model; i++) {
            const angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / d_model);
            row.push(i % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
        }
        zData.push(row);
    }

    const data = [{
        z: zData,
        type: 'heatmap',
        colorscale: 'Viridis'
    }];

    const layout = {
        title: 'Positional Encoding Matrix (Sinus/Cosinus Muster)',
        xaxis: { title: 'Embedding Dimension' },
        yaxis: { title: 'Wort-Position im Satz' }
    };

    Plotly.newPlot('pos-encoding-chart', data, layout);
}

// --- 5. RLHF LOGIC ---
function giveFeedback(isPositive) {
    const signal = document.getElementById('reward-signal');
    if (isPositive) {
        signal.innerHTML = "<span style='color: #22c55e;'>+1.0 Belohnung: Modell wird in diese Richtung optimiert!</span>";
    } else {
        signal.innerHTML = "<span style='color: #ef4444;'>-1.0 Bestrafung: Wahrscheinlichkeit für diese Antwort sinkt!</span>";
    }
    
    // Kleiner visueller "Lerneffekt"
    const aiBox = document.getElementById('ai-response');
    aiBox.style.transition = "transform 0.2s";
    aiBox.style.transform = "scale(1.05)";
    setTimeout(() => aiBox.style.transform = "scale(1)", 200);
}

// Initialisierung
window.addEventListener('load', () => {
    updateSamplingChart();
    drawPositionalEncoding();
    document.getElementById('temp-slider').addEventListener('input', updateSamplingChart);
});
