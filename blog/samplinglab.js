const Sampler = {
    // Simulated "logits" (raw neural network outputs)
    logits: {
        "wise": 4.5,
        "brave": 3.8,
        "old": 3.2,
        "dead": 2.5,
        "here": 2.1,
        "tall": 1.8,
        "angry": 1.4,
        "eating": 0.9,
        "sad": 0.5,
        "happy": 0.2
    },

    init: function() {
        document.getElementById('slider-temp').addEventListener('input', () => this.update());
        document.getElementById('slider-k').addEventListener('input', () => this.update());
        this.update();
    },

    update: function(selectedWord = null) {
        const temp = parseFloat(document.getElementById('slider-temp').value);
        const k = parseInt(document.getElementById('slider-k').value);
        document.getElementById('temp-display').innerText = temp.toFixed(1);
        document.getElementById('k-display').innerText = k;

        // 1. Apply Temperature to Logits & Calc Softmax
        let entries = Object.entries(this.logits).map(([word, val]) => {
            return { word, scaled: Math.exp(val / temp) };
        });
        
        const sum = entries.reduce((a, b) => a + b.scaled, 0);
        entries = entries.map(e => ({ ...e, prob: e.scaled / sum }));

        // 2. Apply Top-K Truncation
        entries.sort((a, b) => b.prob - a.prob);
        const topKEntries = entries.slice(0, k);
        const topKSum = topKEntries.reduce((a, b) => a + b.prob, 0);

        // 3. Final Normalized Probabilities for the UI
        const finalData = entries.map((e, index) => {
            const inTopK = index < k;
            return {
                ...e,
                inTopK: inTopK,
                finalProb: inTopK ? (e.prob / topKSum) : 0,
                isSelected: e.word === selectedWord
            };
        });

        this.render(finalData);
    },

    render: function(data) {
        // Render Plotly Chart
        const trace = {
            x: data.map(d => d.word),
            y: data.map(d => d.finalProb * 100),
            type: 'bar',
            marker: {
                color: data.map(d => d.isSelected ? '#facc15' : (d.inTopK ? '#3b82f6' : '#e2e8f0')),
                line: { width: data.map(d => d.isSelected ? 3 : 0), color: '#854d0e' }
            }
        };

        Plotly.newPlot('sampling-plot', [trace], {
            margin: { t: 10, r: 10, b: 40, l: 50 },
            yaxis: { title: 'Probability (%)', range: [0, 100] }
        });

        // Render Results Table
        let html = '';
        data.forEach(d => {
            const statusClass = d.isSelected ? 'selected' : (d.inTopK ? '' : 'discarded');
            html += `
                <div class="result-row ${statusClass}">
                    <span>${d.isSelected ? '➡️ ' : ''}${d.word}</span>
                    <span>${(d.finalProb * 100).toFixed(1)}%</span>
                </div>
            `;
        });
        document.getElementById('results-table').innerHTML = html;
    },

    rollDice: function() {
        const k = parseInt(document.getElementById('slider-k').value);
        const temp = parseFloat(document.getElementById('slider-temp').value);
        
        // Calculate the current active probabilities
        let entries = Object.entries(this.logits).map(([word, val]) => ({ word, p: Math.exp(val / temp) }));
        entries.sort((a, b) => b.p - a.p);
        const topK = entries.slice(0, k);
        const sum = topK.reduce((a, b) => a + b.p, 0);

        // Weighted Random selection
        let r = Math.random() * sum;
        let selected = topK[0].word;
        for (let item of topK) {
            r -= item.p;
            if (r <= 0) { selected = item.word; break; }
        }

        this.update(selected);
    }
};

document.addEventListener('DOMContentLoaded', () => Sampler.init());
