const PositionalLab = {
    d_model: 4, 
    // The actual "king" vector from transformerlab.js
    baseVector: [1.688, -0.454, 0, 0], 
    
    getEncoding: function(pos, d_model) {
        let pe = new Array(d_model).fill(0);
        for (let i = 0; i < d_model; i += 2) {
            let div_term = Math.pow(10000, (2 * i) / d_model);
            pe[i] = Math.sin(pos / div_term);
            if (i + 1 < d_model) {
                pe[i + 1] = Math.cos(pos / div_term);
            }
        }
        return pe;
    },

    update: function(pos) {
        document.getElementById('pe-val').innerText = "Position " + pos;
        const peVec = this.getEncoding(Number(pos), this.d_model);
        const combined = this.baseVector.map((val, i) => val + peVec[i]);
        
        this.renderComparison(pos, peVec, combined);
        this.renderChart(10);
    },

    renderComparison: function(pos, peVec, combined) {
        const container = document.getElementById('pe-viz-container');
        container.innerHTML = `
            <table style="width:100%; border-collapse: collapse; font-family: monospace; font-size: 13px;">
                <tr style="background: #f3f4f6;">
                    <th style="padding:10px; border:1px solid #ddd;">Component</th>
                    <th style="border:1px solid #ddd;">Dim 0</th>
                    <th style="border:1px solid #ddd;">Dim 1</th>
                    <th style="border:1px solid #ddd;">Dim 2</th>
                    <th style="border:1px solid #ddd;">Dim 3</th>
                </tr>
                <tr>
                    <td style="padding:10px; border:1px solid #ddd;"><b>Static "king"</b></td>
                    ${this.baseVector.map(v => `<td style="border:1px solid #ddd;">${v.toFixed(3)}</td>`).join('')}
                </tr>
                <tr style="color: #2563eb;">
                    <td style="padding:10px; border:1px solid #ddd;"><b>+ PE (Pos ${pos})</b></td>
                    ${peVec.map(v => `<td style="border:1px solid #ddd;">${v.toFixed(3)}</td>`).join('')}
                </tr>
                <tr style="background: #eff6ff; font-weight: bold;">
                    <td style="padding:10px; border:1px solid #ddd;"><b>= Contextual "king"</b></td>
                    ${combined.map(v => `<td style="border:1px solid #ddd;">${v.toFixed(3)}</td>`).join('')}
                </tr>
            </table>`;
    },

    renderChart: function(numPositions) {
        const traces = [];
        for (let i = 0; i < this.d_model; i++) {
            let x = [], y = [];
            for (let p = 0; p < numPositions; p++) {
                x.push(p);
                y.push(this.getEncoding(p, this.d_model)[i]);
            }
            traces.push({
                x: x, y: y,
                mode: 'lines+markers',
                name: `Dim ${i} Wave`,
                line: { shape: 'spline' }
            });
        }

        const layout = {
            title: 'Positional Waves (Adjusting the 4D Space)',
            margin: { t: 40, b: 40, l: 40, r: 20 },
            xaxis: { title: 'Position' },
            yaxis: { title: 'PE Value', range: [-1.1, 1.1] }
        };

        Plotly.newPlot('pe-chart', traces, layout);
    }
};

// Initialize on load
window.onload = () => PositionalLab.update(1);
