const NormLab = {
    data: [
        [10, 2, 8, 5],   
        [40, 10, 32, 25], 
        [15, 25, 5, 12]   
    ],

    init: function() {
        this.renderTable('input-table', this.data);
        this.renderPlot('input-plot', this.data, 'Raw Features (Varying Scales)');
        this.process(); // Auto-load results on start
        
        // Listen for live edits in the table
        document.getElementById('input-table').addEventListener('input', () => {
            this.syncData();
            this.process();
        });
    },

    syncData: function() {
        const rows = document.querySelectorAll('#input-table tr:not(:first-child)');
        this.data = Array.from(rows).map(row => {
            const cells = Array.from(row.querySelectorAll('td[contenteditable]'));
            return cells.map(td => {
                const val = parseFloat(td.innerText);
                return isNaN(val) ? 0 : val; // Sanitize invalid input to 0
            });
        });
    },

    process: function() {
        const container = document.getElementById('math-display');
        let html = `<h2 style="color:#10b981; margin-top:0;">Detailed Mathematical Breakdown</h2>`;
        html += `<p style="color: #64748b;">Applying Min-Max normalization to the range $[-1, 1]$ for each sample independently.</p>`;
        
        const results = this.data.map((row, i) => {
            const min = Math.min(...row);
            const max = Math.max(...row);
            const range = (max - min) || 1; // Prevent division by zero
            
            const normalizedRow = row.map(x => (2 * (x - min) / range) - 1);

            html += `
            <div style="margin-bottom: 25px; padding: 20px; border-left: 5px solid #10b981; background: #f0fdf4; border-radius: 8px;">
                <h4 style="margin:0 0 10px 0; color:#065f46;">Step-by-Step for Sample ${i+1}:</h4>
                <div style="font-size: 0.95rem; line-height: 2.2;">
                    $\\text{Constants: } \\min = ${min}, \\max = ${max}, \\text{range} = ${max - min}$ <br>
                    $\\text{Formula: } x_\\text{norm} = 2 \\times \\frac{x - \\min}{\\text{range}} - 1$ <br>
                    $F_1: 2 \\times \\frac{${row[0]} - ${min}}{${max-min}} - 1 = ${normalizedRow[0].toFixed(2)}$ <br>
                    $F_2: 2 \\times \\frac{${row[1]} - ${min}}{${max-min}} - 1 = ${normalizedRow[1].toFixed(2)}$ <br>
                    $F_3: 2 \\times \\frac{${row[2]} - ${min}}{${max-min}} - 1 = ${normalizedRow[2].toFixed(2)}$ <br>
                    $F_4: 2 \\times \\frac{${row[3]} - ${min}}{${max-min}} - 1 = ${normalizedRow[3].toFixed(2)}$
                </div>
            </div>`;
            
            return normalizedRow;
        });

        container.innerHTML = html;
        this.renderPlot('input-plot', this.data, 'Raw Features (Varying Scales)');
        this.renderPlot('output-plot', results, 'Layer Normalized (-1 to 1 Scale)');
        if (window.MathJax) MathJax.typesetPromise();
    },

    renderTable: function(id, data) {
        let h = `<tr style="background:#f1f5f9"><th>#</th><th>F1</th><th>F2</th><th>F3</th><th>F4</th></tr>`;
        data.forEach((r, i) => {
            h += `<tr><td style="padding:8px; border:1px solid #e2e8f0; font-weight:bold;">${i+1}</td>`;
            r.forEach(val => h += `<td contenteditable="true" style="padding:8px; border:1px solid #e2e8f0; background: white; outline: #10b981;">${val}</td>`);
            h += `</tr>`;
        });
        document.getElementById(id).innerHTML = h;
    },

    renderPlot: function(id, data, title) {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
        const traces = [];
        for (let f = 0; f < (data[0] ? data[0].length : 0); f++) {
            traces.push({
                x: data.map((_, i) => `S${i+1}`),
                y: data.map(row => row[f]),
                name: `Feat ${f+1}`,
                type: 'bar',
                marker: { color: colors[f], line: { color: '#1e293b', width: 1 } }
            });
        }
        const layout = { 
            title: title, barmode: 'group', margin: { t: 50, b: 30, l: 40, r: 10 },
            legend: { orientation: 'h', y: -0.2 },
            yaxis: {
                range: id === 'output-plot' ? [-1.2, 1.2] : null,
                zeroline: true, zerolinecolor: '#475569', gridcolor: '#e2e8f0'
            }
        };
        Plotly.newPlot(id, traces, layout);
    }
};

window.addEventListener('load', () => NormLab.init());
