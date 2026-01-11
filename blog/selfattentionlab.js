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
        
        // Render All 8 Components
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
                return v1.reduce((s, x, i) => s + x * v2[i], 0) * 4;
            });
            const exp = energies.map(e => Math.exp(e));
            const sum = exp.reduce((a, b) => a + b, 0);
            return exp.map(s => s / sum);
        });
    },

    drawWeb: function(words, matrix) {
        let traces = [];
        words.forEach((w1, i) => {
            words.forEach((w2, j) => {
                if (matrix[i][j] > 0.1) {
                    traces.push({
                        x: [i, j], y: [0, 1], mode: 'lines',
                        line: { color: '#3b82f6', width: matrix[i][j] * 20 },
                        opacity: matrix[i][j]
                    });
                }
            });
            traces.push({
                x: [i], y: [0], mode: 'markers+text', text: [w1],
                textposition: 'bottom center', marker: { size: 12, color: '#1e293b' }
            });
        });
        Plotly.newPlot('plot-web', traces, { showlegend: false, margin: {t:20, b:40, l:40, r:40}, xaxis: {showgrid: false}, yaxis: {showgrid: false} });
    },

    drawFlow: function(words, matrix) {
        let traces = [];
        words.forEach((w1, i) => {
            const base = this.vocab[w1];
            let context = [0, 0, 0];
            words.forEach((w2, j) => {
                const v2 = this.vocab[w2];
                context = context.map((c, idx) => c + matrix[i][j] * v2[idx]);
            });
            traces.push({
                x: [base[0], context[0]], y: [base[1], context[1]], z: [base[2], context[2]],
                type: 'scatter3d', mode: 'lines+markers',
                line: { width: 8, color: '#f59e0b' },
                marker: { size: [4, 10], color: '#f59e0b' },
                name: w1
            });
        });
        Plotly.newPlot('plot-flow', traces, { margin: {l:0, r:0, b:0, t:0}, scene: {xaxis: {title: 'Bio'}, yaxis: {title: 'Conc'}, zaxis: {title: 'Dyn'}} });
    },

    drawTable: function(words, matrix) {
        let html = '<table class="attn-table"><tr><th></th>';
        words.forEach(w => html += `<th>${w}</th>`);
        html += '</tr>';
        words.forEach((w, i) => {
            html += `<tr><td class="row-label">${w}</td>`;
            matrix[i].forEach(val => {
                const color = `rgba(59, 130, 246, ${val})`;
                html += `<td style="background:${color}; color:${val > 0.4 ? 'white' : 'black'}">${(val * 100).toFixed(0)}%</td>`;
            });
            html += '</tr>';
        });
        document.getElementById('sa-matrix-container').innerHTML = html + '</table>';
    },

    drawDotPlot: function(words, matrix) {
        const data = words.map((w, i) => ({
            x: words, y: matrix[i].map(v => v * 10), // Scaling for visibility
            type: 'bar', name: w
        }));
        Plotly.newPlot('plot-dot-products', data, { barmode: 'group', margin: {t:10, b:40, l:30, r:10} });
    },

    drawSpace: function(words) {
        const traces = words.map(w => ({
            x: [this.vocab[w][0]], y: [this.vocab[w][2]],
            mode: 'markers+text', text: w, textposition: 'top center',
            marker: { size: 14, color: '#10b981' }, type: 'scatter'
        }));
        Plotly.newPlot('plot-space', traces, { xaxis: {range: [0, 1]}, yaxis: {range: [0, 1]}, margin: {t:20, b:40, l:40, r:20} });
    },

    drawAlignment: function(words) {
        const data = [{
            z: words.map(w1 => words.map(w2 => {
                const v1 = this.vocab[w1], v2 = this.vocab[w2];
                return v1.reduce((s, x, i) => s + x * v2[i], 0);
            })),
            x: words, y: words, type: 'heatmap', colorscale: 'Blues'
        }];
        Plotly.newPlot('plot-alignment', data, { margin: {t:10, b:30, l:50, r:10} });
    },

    drawEnergy: function(words, matrix) {
        Plotly.newPlot('plot-energy', [{ z: matrix, type: 'surface', colorscale: 'Viridis' }], { margin: {t:0, b:0, l:0, r:0} });
    },

    drawEntropy: function(words, matrix) {
        const entropies = matrix.map(row => -row.reduce((s, p) => s + p * Math.log(p + 0.00001), 0));
        Plotly.newPlot('plot-entropy', [{ x: words, y: entropies, type: 'bar', marker: {color: '#8b5cf6'} }], { margin: {t:20, b:40, l:40, r:20} });
    }
};

$(document).ready(() => VisualAttentionLab.update());
