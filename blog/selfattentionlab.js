const MultiHeadLab = {
    // 3D-Koordinaten: [Belebt/Unbelebt, Abstrakt/Konkret, Aktion/Objekt]
    vocab: {
        "Der": [0.1, 0.2, 0.0],
        "den": [0.1, 0.1, 0.0],
        "Jäger": [0.95, 0.2, 0.8], // Sehr belebt, konkret, Handelnder
        "Bär": [0.9, 0.1, 0.2],   // Sehr belebt, konkret, eher Objekt
        "sieht": [0.4, 0.8, 0.9],  // Mittel belebt, abstrakt (Wahrnehmung), Aktion
        "Gewehr": [0.1, 0.2, 0.4], // Unbelebt, konkret
        "Wald": [0.6, 0.3, 0.1]    // Organisch, konkret, Kulisse
    },

    update: function() {
        const input = document.getElementById('sa-input').value;
        const words = input.split(" ").filter(w => this.vocab[w]);
        if (words.length < 2) return;

        // Wir berechnen zwei verschiedene Matrizen für die Heads
        const head1 = this.calculateAttention(words, 'structure'); 
        const head2 = this.calculateAttention(words, 'semantic');

        this.renderMatrix(words, head1, head2);
        this.renderPlot(words, head1, head2);
    },

    calculateAttention: function(words, mode) {
        return words.map(w1 => {
            let row = words.map(w2 => {
                const v1 = this.vocab[w1];
                const v2 = this.vocab[w2];
                let score = 0;
                
                if (mode === 'structure') {
                    // Head 1: Achtet auf die Beziehung Handelnder (Dim 3) zu Aktion
                    score = Math.abs(v1[2] - v2[2]) * 5;
                } else {
                    // Head 2: Achtet auf die Ähnlichkeit der "Belebtheit" (Dim 1)
                    score = (v1[0] * v2[0] + v1[1] * v2[1]) * 4;
                }
                return Math.exp(score);
            });
            const sum = row.reduce((a, b) => a + b, 0);
            return row.map(s => s / sum);
        });
    },

    renderPlot: function(words, h1, h2) {
        let traces = [];

        // 1. Wort-Knoten als leuchtende Punkte
        words.forEach((word, i) => {
            const v = this.vocab[word];
            traces.push({
                x: [v[0]], y: [v[1]], z: [v[2]],
                mode: 'markers+text',
                type: 'scatter3d',
                name: word,
                text: [word],
                textfont: { color: '#fff' },
                marker: { size: 12, color: '#3b82f6', symbol: 'sphere', opacity: 0.9 }
            });

            // 2. Verbindungslinien (Heads)
            words.forEach((word2, j) => {
                const v2 = this.vocab[word2];
                
                // Head 1: Blau (Struktur)
                if (h1[i][j] > 0.25) {
                    traces.push(this.createLine(v, v2, '#3b82f6', h1[i][j] * 15, 'Head 1'));
                }
                // Head 2: Rot (Semantik)
                if (h2[i][j] > 0.25) {
                    traces.push(this.createLine(v, v2, '#ef4444', h2[i][j] * 15, 'Head 2'));
                }
            });
        });

        const layout = {
            scene: {
                xaxis: { title: 'Belebt / Biologisch', gridcolor: '#444', color: '#fff' },
                yaxis: { title: 'Konkret / Abstrakt', gridcolor: '#444', color: '#fff' },
                zaxis: { title: 'Handlung / Objekt', gridcolor: '#444', color: '#fff' },
                camera: { eye: {x: 1.5, y: 1.5, z: 1.2} }
            },
            margin: { l: 0, r: 0, b: 0, t: 0 },
            paper_bgcolor: '#0f172a',
            showlegend: false
        };

        Plotly.newPlot('sa-plot', traces, layout, {responsive: true});
    },

    createLine: function(p1, p2, color, width, name) {
        return {
            x: [p1[0], p2[0]], y: [p1[1], p2[1]], z: [p1[2], p2[2]],
            type: 'scatter3d', mode: 'lines',
            line: { color: color, width: width, opacity: 0.6 },
            name: name,
            hoverinfo: 'none'
        };
    },

    renderMatrix: function(words, h1, h2) {
        let html = '<table class="attn-table"><tr><th></th>';
        words.forEach(w => html += `<th>${w}</th>`);
        html += '</tr>';

        words.forEach((w, i) => {
            html += `<tr><td class="row-label">${w}</td>`;
            words.forEach((w2, j) => {
                // Mischfarbe aus beiden Heads
                const val1 = h1[i][j];
                const val2 = h2[i][j];
                const r = Math.floor(val2 * 255);
                const b = Math.floor(val1 * 255);
                const alpha = Math.max(val1, val2);
                
                html += `<td style="background: rgba(${r}, 100, ${b}, ${alpha}); border: 1px solid #334155;">
                            <span style="font-size:10px">H1:${Math.round(val1*100)}%</span><br>
                            <span style="font-size:10px">H2:${Math.round(val2*100)}%</span>
                         </td>`;
            });
            html += '</tr>';
        });
        document.getElementById('sa-matrix-container').innerHTML = html + '</table>';
    }
};

$(document).ready(() => MultiHeadLab.update());
