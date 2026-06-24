// ============================================================
// SIMPLE TRAINING VISUALIZATION – Maximum Clarity
// ============================================================

const SimpleTraining = {
    examples: [
        { words: ["Die", "Katze", "saß", "auf", "der", "Matte"], wrongs: ["Hund", "lief", "unter", "dem", "Straße"] },
        { words: ["Es", "war", "einmal", "ein", "König"], wrongs: ["ist", "nie", "kein", "Bauer"] },
        { words: ["Die", "Sonne", "ging", "langsam", "unter"], wrongs: ["Mond", "kam", "schnell", "auf"] },
    ],

    textIdx: 0,
    wordIdx: 1,
    lossHistory: [],
    correctHistory: [],
    autoInterval: null,
    totalSteps: 0,

    render: function(isCorrect) {
        const ex = this.examples[this.textIdx];
        const words = ex.words;
        const targetIdx = Math.min(this.wordIdx, words.length - 1);
        const target = words[targetIdx];
        const wrong = ex.wrongs[Math.min(targetIdx - 1, ex.wrongs.length - 1)] || "???";

        // === SATZ: Kontext schwarz, Zukunft grau, Ziel grün ===
        let sentenceHTML = '';
        words.forEach((w, i) => {
            if (i < targetIdx) {
                // Kontext – sichtbar, schwarz
                sentenceHTML += `<span style="color:#1e293b; font-weight:600;">${w} </span>`;
            } else if (i === targetIdx) {
                // Zielwort – grün hervorgehoben
                sentenceHTML += `<span style="background:#dcfce7; border:2px solid #10b981; padding:2px 10px; border-radius:6px; font-weight:bold; color:#065f46;">${w}</span> `;
            } else {
                // Zukunft – ausgegraut
                sentenceHTML += `<span style="color:#d1d5db;">${w} </span>`;
            }
        });
        document.getElementById('training-sentence').innerHTML = sentenceHTML;

        // === VORHERSAGE: Zwei Karten – Falsch & Richtig ===
        const hasResult = typeof isCorrect !== 'undefined';
        // Simuliere: 30% Chance falsch am Anfang, wird besser
        const modelPickedCorrect = hasResult ? isCorrect : null;

        let predHTML = '';

        // FALSCHE Vorhersage
        predHTML += `<div style="padding:20px 30px; border-radius:12px; text-align:center; min-width:150px;
            border:3px solid ${hasResult && !modelPickedCorrect ? '#ef4444' : '#e2e8f0'};
            background:${hasResult && !modelPickedCorrect ? '#fef2f2' : '#f8fafc'};
            ${hasResult && !modelPickedCorrect ? 'transform:scale(1.05);' : ''}">
            <div style="font-size:0.8em; color:#ef4444; font-weight:bold; margin-bottom:6px;">✗ FALSCH</div>
            <div style="font-size:1.3em; font-weight:bold; color:#991b1b; text-decoration:line-through;">"${wrong}"</div>
            ${hasResult && !modelPickedCorrect ? '<div style="margin-top:8px; font-size:1.4em; font-weight:bold; color:#ef4444;">Loss: 4.2</div>' : ''}
        </div>`;

        // RICHTIGE Vorhersage
        predHTML += `<div style="padding:20px 30px; border-radius:12px; text-align:center; min-width:150px;
            border:3px solid ${hasResult && modelPickedCorrect ? '#10b981' : '#e2e8f0'};
            background:${hasResult && modelPickedCorrect ? '#f0fdf4' : '#f8fafc'};
            ${hasResult && modelPickedCorrect ? 'transform:scale(1.05);' : ''}">
            <div style="font-size:0.8em; color:#10b981; font-weight:bold; margin-bottom:6px;">✓ RICHTIG</div>
            <div style="font-size:1.3em; font-weight:bold; color:#065f46;">"${target}"</div>
            ${hasResult && modelPickedCorrect ? '<div style="margin-top:8px; font-size:1.4em; font-weight:bold; color:#10b981;">Loss: 0.3</div>' : ''}
        </div>`;

        document.getElementById('training-prediction').innerHTML = predHTML;

        // === LOSS DISPLAY ===
        let lossHTML = '';
        if (hasResult) {
            const loss = modelPickedCorrect ? 0.3 : 4.2;
            const color = modelPickedCorrect ? '#10b981' : '#ef4444';
            const icon = modelPickedCorrect ? '✓ Richtig → niedriger Loss' : '✗ Falsch → hoher Loss';
            lossHTML = `<div style="font-size:1.2em; font-weight:bold; color:${color}; padding:10px 20px; background:${modelPickedCorrect ? '#f0fdf4' : '#fef2f2'}; border-radius:10px; display:inline-block;">${icon} = ${loss.toFixed(1)}</div>`;
        }
        document.getElementById('training-loss-display').innerHTML = lossHTML;

        // === LOSS CHART ===
        this.renderChart();
    },

    next: function() {
        const ex = this.examples[this.textIdx];
        // Modell wird mit der Zeit besser
        const correctProb = Math.min(0.85, 0.3 + this.totalSteps * 0.02);
        const isCorrect = Math.random() < correctProb;
        const loss = isCorrect ? (0.2 + Math.random() * 0.3) : (3.5 + Math.random() * 1.5);

        this.lossHistory.push(loss);
        this.correctHistory.push(isCorrect);
        this.totalSteps++;

        this.render(isCorrect);

        // Advance
        this.wordIdx++;
        if (this.wordIdx >= ex.words.length) {
            this.textIdx = (this.textIdx + 1) % this.examples.length;
            this.wordIdx = 1;
        }
    },

    renderChart: function() {
        const plotDiv = document.getElementById('training-loss-chart');
        if (!plotDiv || this.lossHistory.length === 0) return;

        const colors = this.correctHistory.map(c => c ? '#10b981' : '#ef4444');

        const traces = [{
            x: Array.from({length: this.lossHistory.length}, (_, i) => i + 1),
            y: this.lossHistory,
            type: 'scatter',
            mode: 'markers+lines',
            marker: { color: colors, size: 8, line: { width: 1, color: '#fff' } },
            line: { color: '#cbd5e1', width: 1 },
            showlegend: false,
        }];

        const layout = {
            margin: { l: 40, r: 10, b: 25, t: 5 },
            xaxis: { title: '', gridcolor: '#f1f5f9' },
            yaxis: { title: 'Loss', gridcolor: '#f1f5f9', range: [0, 6] },
            plot_bgcolor: '#fff',
            showlegend: false,
            annotations: [{
                x: 0.5, y: 5.5, xref: 'paper', yref: 'y',
                text: '🔴 = falsch (hoher Loss)  🟢 = richtig (niedriger Loss)',
                showarrow: false, font: { size: 11, color: '#64748b' }
            }]
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });
    },

    toggleAuto: function() {
        const btn = document.getElementById('simple-auto-btn');
        if (this.autoInterval) {
            clearInterval(this.autoInterval);
            this.autoInterval = null;
            btn.textContent = '⏩ Autoplay';
            btn.style.background = '#fff';
            btn.style.color = '#1e293b';
        } else {
            this.autoInterval = setInterval(() => this.next(), 1200);
            btn.textContent = '⏸ Stopp';
            btn.style.background = '#ef4444';
            btn.style.color = '#fff';
        }
    },

    init: function() {
        this.render();
    }
};

// Auto-init when slide becomes visible
document.addEventListener('DOMContentLoaded', () => SimpleTraining.init());
