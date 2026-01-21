const PositionalLab = {
    d_model: 4, // Dimensions of the vector (must be even)
    
    // Calculate the PE vector for a specific position
    getEncoding: function(pos, d_model) {
        let pe = new Array(d_model).fill(0);
        for (let i = 0; i < d_model; i += 2) {
            // The denominator (division term) determines the wavelength
            // Lower 'i' = high frequency (fast waves)
            // Higher 'i' = low frequency (slow waves)
            let div_term = Math.pow(10000, (2 * i) / d_model);
            
            pe[i] = Math.sin(pos / div_term);
            if (i + 1 < d_model) {
                pe[i + 1] = Math.cos(pos / div_term);
            }
        }
        return pe;
    },

    renderTable: function(numPositions) {
        const container = document.getElementById('pe-viz-container');
        let html = `<table style="width:100%; border-collapse: collapse; font-family: monospace; font-size: 13px;">
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 10px; border: 1px solid #ddd;">Pos</th>
                        <th colspan="${this.d_model}" style="padding: 10px; border: 1px solid #ddd;">Encoding Vector (Dimensions 0 to ${this.d_model - 1})</th>
                    </tr>`;
        
        for (let p = 0; p < numPositions; p++) {
            const vec = this.getEncoding(p, this.d_model);
            const cells = vec.map(v => {
                const alpha = Math.abs(v);
                // Blue for positive, Red for negative
                const color = v > 0 ? `rgba(59, 130, 246, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
                return `<td style="background: ${color}; border: 1px solid #ddd; padding: 8px; text-align: center; width: 80px;">
                            ${v.toFixed(4)}
                        </td>`;
            }).join('');
            
            html += `<tr><td style="padding: 8px; font-weight: bold; background: #f9fafb; border: 1px solid #ddd; text-align: center;">#${p}</td>${cells}</tr>`;
        }
        container.innerHTML = html + `</table>`;
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
                x: x,
                y: y,
                mode: 'lines+markers',
                name: `Dim ${i}`,
                line: { shape: 'spline' }
            });
        }

        const layout = {
            title: 'Positional Sine/Cosine Waves',
            margin: { t: 40, b: 40, l: 40, r: 20 },
            xaxis: { title: 'Position ($pos$)', gridcolor: '#eee' },
            yaxis: { title: 'Value', range: [-1.1, 1.1], gridcolor: '#eee' },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };

        Plotly.newPlot('pe-chart', traces, layout);
    },

    update: function(val) {
        document.getElementById('pe-val').innerText = val;
        this.renderTable(val);
        this.renderChart(val);
    }
};

// Initial Render
window.addEventListener('DOMContentLoaded', () => {
    PositionalLab.update(5);
});
