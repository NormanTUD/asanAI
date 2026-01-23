const PositionalLab = {
    d_model: 4, 
    baseVector: [1.688, -0.454, 0, 0], 
    
    getEncoding: function(pos, d_model) {
        let pe = new Array(d_model).fill(0);
        for (let i = 0; i < d_model; i += 2) {
            // Using the standard Transformer PE formula
            let div_term = Math.pow(10000, (2 * i) / d_model);
            pe[i] = Math.sin(pos / div_term);
            if (i + 1 < d_model) {
                pe[i + 1] = Math.cos(pos / div_term);
            }
        }
        return pe;
    },

    update: function(pos) {
        const numericPos = Number(pos);
        document.getElementById('pe-val').innerText = "Position " + numericPos;
        const peVec = this.getEncoding(numericPos, this.d_model);
        const combined = this.baseVector.map((val, i) => val + peVec[i]);
        
        this.renderComparison(numericPos, peVec, combined);
        this.renderChart(numericPos); // Pass current pos to the chart
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

    renderChart: function(currentPos) {
        const traces = [];
        const resolution = 0.1; // Smaller steps for a smoother "rund" curve
        const maxPos = 10;

        // 1. Create smooth wave traces
        for (let i = 0; i < this.d_model; i++) {
            let x = [], y = [];
            for (let p = 0; p <= maxPos; p += resolution) {
                x.push(p);
                y.push(this.getEncoding(p, this.d_model)[i]);
            }
            traces.push({
                x: x,
                y: y,
                mode: 'lines',
                name: `Dim ${i} Wave`,
                line: { shape: 'spline', width: 2 },
                opacity: 0.4
            });
        }

        // 2. Add "moving" markers for the current position
        for (let i = 0; i < this.d_model; i++) {
            const currentVal = this.getEncoding(currentPos, this.d_model)[i];
            traces.push({
                x: [currentPos],
                y: [currentVal],
                mode: 'markers',
                name: `Pos ${currentPos} (D${i})`,
                marker: { size: 10, symbol: 'diamond' },
                showlegend: false
            });
        }

        const layout = {
            title: 'Positional Waves (Adjusting the 4D Space)',
            margin: { t: 40, b: 40, l: 40, r: 20 },
            xaxis: { title: 'Position', range: [0, maxPos] },
            yaxis: { title: 'PE Value', range: [-1.2, 1.2] },
            // Added a vertical line to show the "slice" of the current position
            shapes: [{
                type: 'line',
                x0: currentPos,
                x1: currentPos,
                y0: -1.1,
                y1: 1.1,
                line: { color: 'rgba(0,0,0,0.2)', width: 1, dash: 'dot' }
            }]
        };

        Plotly.newPlot('pe-chart', traces, layout, {responsive: true});
    }
};

window.onload = () => PositionalLab.update(1);
