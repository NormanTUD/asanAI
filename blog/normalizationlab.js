const NormLab = {
    // Simple numbers for manual verification
    data: [
        [10, 2],  // Sample 1
        [20, 4],  // Sample 2
        [30, 12]  // Sample 3
    ],

    init: function() {
        this.renderTable('input-table', this.data);
        this.renderPlot('input-plot', this.data, 'Original Data Scale');
    },

    process: function(mode) {
        const container = document.getElementById('math-display');
        let html = `<h2>${mode === 'batch' ? 'Batch' : 'Layer'} Normalization</h2>`;
        let results = [];
        const eps = 0.00001;

        if (mode === 'batch') {
            html += `<p><i>Batch Norm calculates statistics per feature (column) across all samples.</i></p>`;
            
            const cols = [0, 1];
            const stats = cols.map(c => {
                const vals = this.data.map(r => r[c]);
                const mu = vals.reduce((a, b) => a + b) / vals.length;
                const varSum = vals.reduce((a, b) => a + Math.pow(b - mu, 2), 0);
                const variance = varSum / vals.length;
                const std = Math.sqrt(variance + eps);

                html += `<h4>Feature ${c + 1} (Column ${c + 1}):</h4>`;
                html += `1. Mean: $$\\mu = \\frac{${vals.join('+')}}{3} = ${mu}$$`;
                html += `2. Variance: $$\\sigma^2 = \\frac{(${vals[0]}-${mu})^2 + (${vals[1]}-${mu})^2 + (${vals[2]}-${mu})^2}{3} = ${variance.toFixed(2)}$$`;
                html += `3. StdDev: $$\\sigma = \\sqrt{${variance.toFixed(2)} + \\epsilon} = ${std.toFixed(3)}$$`;
                
                return { mu, std };
            });

            results = this.data.map(row => [
                (row[0] - stats[0].mu) / stats[0].std,
                (row[1] - stats[1].mu) / stats[1].std
            ]);

        } else {
            html += `<p><i>Layer Norm calculates statistics per sample (row) across all features.</i></p>`;
            
            results = this.data.map((row, i) => {
                const mu = (row[0] + row[1]) / 2;
                const variance = (Math.pow(row[0] - mu, 2) + Math.pow(row[1] - mu, 2)) / 2;
                const std = Math.sqrt(variance + eps);

                html += `<h4>Sample ${i + 1} (Row ${i + 1}):</h4>`;
                html += `1. Mean: $$\\mu = \\frac{${row[0]} + ${row[1]}}{2} = ${mu}$$`;
                html += `2. Variance: $$\\sigma^2 = \\frac{(${row[0]}-${mu})^2 + (${row[1]}-${mu})^2}{2} = ${variance.toFixed(2)}$$`;
                html += `3. Normalized values: $$x_1 \\to \\frac{${row[0]}-${mu}}{${std.toFixed(2)}} = ${((row[0]-mu)/std).toFixed(3)}$$`;
                
                return [(row[0] - mu) / std, (row[1] - mu) / std];
            });
        }

        container.innerHTML = html;
        this.renderPlot('output-plot', results, `Result after ${mode} Normalization`);
        if (window.MathJax) MathJax.typesetPromise();
    },

    renderTable: function(id, data) {
        let h = `<tr><th>Sample</th><th>Feature 1</th><th>Feature 2</th></tr>`;
        data.forEach((r, i) => h += `<tr><td>#${i+1}</td><td>${r[0]}</td><td>${r[1]}</td></tr>`);
        document.getElementById(id).innerHTML = h;
    },

    renderPlot: function(id, data, title) {
        const traces = [
            { x: ['S1', 'S2', 'S3'], y: [data[0][0], data[1][0], data[2][0]], name: 'Feature 1', type: 'bar' },
            { x: ['S1', 'S2', 'S3'], y: [data[0][1], data[1][1], data[2][1]], name: 'Feature 2', type: 'bar' }
        ];
        Plotly.newPlot(id, traces, { 
            title: title, 
            barmode: 'group', 
            margin: { t: 40, b: 30, l: 40, r: 10 },
            yaxis: { zeroline: true }
        });
    }
};

window.addEventListener('load', () => NormLab.init());
