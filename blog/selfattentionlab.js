const VisualAttentionLab = {
    vocab: {
        "Der": [0.1, 0.1, 0.1], "den": [0.1, 0.2, 0.2],
        "Jäger": [0.9, 0.8, 0.7], "Bär": [0.85, 0.9, 0.3],   
        "sieht": [0.4, 0.3, 0.9], "Wald": [0.7, 0.8, 0.1],
        "Gewehr": [0.1, 0.9, 0.4]
    },

    update: function() {
        const words = document.getElementById('sa-input').value.split(" ").filter(w => this.vocab[w]);
        if (words.length < 1) return;

        const matrix = this.calcAttention(words);
        
        // 8 Plots & Table
        this.drawWeb(words, matrix);
        this.drawFlow(words, matrix);
        this.drawTable(words, matrix);
        this.drawDotPlot(words, matrix);
        this.drawSpace(words);
        this.drawAlignment(words);
        this.drawEnergy(words, matrix);
        this.drawEntropy(words, matrix);

        if (window.MathJax) MathJax.typeset();
    },

    calcAttention: function(words) {
        return words.map(w1 => {
            let energies = words.map(w2 => {
                const v1 = this.vocab[w1], v2 = this.vocab[w2];
                return v1.reduce((s, x, i) => s + x * v2[i], 0) * 5; // Dot product scale
            });
            const exp = energies.map(e => Math.exp(e));
            const sum = exp.reduce((a, b) => a + b, 0);
            return exp.map(s => s / sum);
        });
    },

    drawTable: function(words, matrix) {
        let html = '<table class="attn-table" style="width:100%"><tr><th></th>';
        words.forEach(w => html += `<th>${w}</th>`);
        html += '</tr>';
        words.forEach((w, i) => {
            html += `<tr><td class="row-label">${w}</td>`;
            matrix[i].forEach(val => {
                const color = `rgba(59, 130, 246, ${val})`;
                html += `<td style="background:${color}; color:${val > 0.4 ? 'white' : 'black'}; border:1px solid #fff;">${(val * 100).toFixed(0)}%</td>`;
            });
            html += '</tr>';
        });
        document.getElementById('sa-matrix-container').innerHTML = html + '</table>';
    },

    drawDotPlot: function(words, matrix) {
        // Visualizes the Raw "Pre-Softmax" Energy
        const data = words.map((w, i) => ({
            x: words, y: matrix[i].map(v => Math.log(v + 0.0001)), // Approximating raw energy
            type: 'bar', name: w
        }));
        Plotly.newPlot('plot-dot-products', data, { barmode: 'group', margin: {t:0, b:40, l:30, r:10}, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' });
    },

    drawAlignment: function(words) {
        // Step 6: Query-Key Cosine Similarity
        const data = [{
            z: words.map(w1 => words.map(w2 => {
                const v1 = this.vocab[w1], v2 = this.vocab[w2];
                return v1.reduce((s, x, i) => s + x * v2[i], 0);
            })),
            x: words, y: words, type: 'heatmap', colorscale: 'Viridis'
        }];
        Plotly.newPlot('plot-alignment', data, { margin: {t:0, b:30, l:50, r:10} });
    },

    drawEnergy: function(words, matrix) {
        // Step 7: 3D Surface of Attention Energy
        const data = [{
            z: matrix, type: 'surface', colorscale: 'Blues', showscale: false
        }];
        Plotly.newPlot('plot-energy', data, { margin: {t:0, b:0, l:0, r:0}, scene: {xaxis: {showticklabels: false}, yaxis: {showticklabels: false}, zaxis: {showticklabels: false}} });
    },

    drawEntropy: function(words, matrix) {
        // Step 8: How focused is the attention? (Entropy)
        const entropies = matrix.map(row => -row.reduce((s, p) => s + p * Math.log(p + 0.00001), 0));
        Plotly.newPlot('plot-entropy', [{
            x: words, y: entropies, type: 'scatter', fill: 'tozeroy', line: {color: '#8b5cf6'}
        }], { title: 'Focus Depth (Lower = More Focused)', margin: {t:30, b:40, l:40, r:20} });
    },

    // ... (Keep drawWeb, drawSpace, drawFlow from previous version, just update container IDs)
    drawWeb: function(words, matrix) { /* ... same logic ... */ },
    drawSpace: function(words) { /* ... same logic ... */ },
    drawFlow: function(words, matrix) { /* ... same logic ... */ }
};

$(document).ready(() => VisualAttentionLab.update());
