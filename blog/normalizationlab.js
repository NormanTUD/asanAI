const NormLab = {
    // Static test data for 100% traceability
    // Column 1 (Features): 10, 20, 30 | Column 2 (Features): 2, 4, 12
    data: [
        [10, 2],  // Sample 1
        [20, 4],  // Sample 2
        [30, 12]  // Sample 3
    ],

    init: function() {
        this.renderTable('input-table', this.data);
        this.renderPlot('input-plot', this.data, 'Input: Uneven Scaling');
    },

    process: function(mode) {
        const container = document.getElementById('math-display');
        const epsilon = 1e-5; // Mathematical stability (prevents division by zero)
        let results = [];
        
        let html = `<h2 style="color:${mode === 'batch' ? '#4338ca' : '#10b981'}">${mode === 'batch' ? 'Batch' : 'Layer'} Normalization Guide</h2>`;
        
        if (mode === 'batch') {
            html += `<p><b>Goal:</b> Normalize features across the entire batch (vertically). Each feature will have mean 0 and variance 1.</p>`;
            
            const featureIndices = [0, 1];
            const stats = featureIndices.map(col => {
                const values = this.data.map(row => row[col]);
                const mu = values.reduce((a, b) => a + b) / values.length;
                const variance = values.reduce((a, b) => a + Math.pow(b - mu, 2), 0) / values.length;
                const std = Math.sqrt(variance + epsilon);

                html += `<div style="margin-bottom: 25px; padding: 15px; border-left: 4px solid #4338ca; background: #f0f7ff;">
                    <b style="font-size:1.1rem;">Step for Feature ${col+1} (Column ${col+1}):</b><br>
                    1. Calculate Mean (Average): 
                    $$ \\mu = \\frac{${values.join(' + ')}}{3} = ${mu} $$
                    2. Calculate Variance:
                    $$ \\sigma^2 = \\frac{\\sum (x - \\mu)^2}{N} = \\frac{(${values[0]}-${mu})^2 + (${values[1]}-${mu})^2 + (${values[2]}-${mu})^2}{3} = ${variance.toFixed(2)} $$
                    3. Calculate Standard Deviation:
                    $$ \\sigma = \\sqrt{\\sigma^2 + \\epsilon} = \\sqrt{${variance.toFixed(2)} + ${epsilon}} = ${std.toFixed(4)} $$
                </div>`;
                return { mu, std };
            });

            results = this.data.map(row => [
                (row[0] - stats[0].mu) / stats[0].std,
                (row[1] - stats[1].mu) / stats[1].std
            ]);
        } else {
            html += `<p><b>Goal:</b> Normalize within each sample (horizontally). Useful for Transformers where batch sizes vary.</p>`;
            
            results = this.data.map((row, i) => {
                const mu = (row[0] + row[1]) / 2;
                const variance = (Math.pow(row[0] - mu, 2) + Math.pow(row[1] - mu, 2)) / 2;
                const std = Math.sqrt(variance + epsilon);

                html += `<div style="margin-bottom: 25px; padding: 15px; border-left: 4px solid #10b981; background: #f0fdf4;">
                    <b style="font-size:1.1rem;">Step for Sample ${i+1} (Row ${i+1}):</b><br>
                    1. Calculate Row Mean:
                    $$ \\mu = \\frac{${row[0]} + ${row[1]}}{2} = ${mu} $$
                    2. Calculate Row Variance:
                    $$ \\sigma^2 = \\frac{(${row[0]}-${mu})^2 + (${row[1]}-${mu})^2}{2} = ${variance.toFixed(2)} $$
                    3. Standardize:
                    $$ x_{norm} = \\frac{x - \\mu}{\\sigma} \\rightarrow \\left[ \\frac{${row[0]}-${mu}}{${std.toFixed(2)}}, \\frac{${row[1]}-${mu}}{${std.toFixed(2)}} \\right] $$
                </div>`;
                return [(row[0] - mu) / std, (row[1] - mu) / std];
            });
        }

        container.innerHTML = html;
        this.renderPlot('output-plot', results, 'Output: Centered & Scaled');
        if (window.MathJax) MathJax.typesetPromise();
    },

    renderTable: function(id, data) {
        let h = `<tr style="background:#eee"><th>#</th><th>F1</th><th>F2</th></tr>`;
        data.forEach((r, i) => h += `<tr><td>${i+1}</td><td>${r[0]}</td><td>${r[1]}</td></tr>`);
        document.getElementById(id).innerHTML = h;
    },

    renderPlot: function(id, data, title) {
        const traces = [
            { x: ['S1', 'S2', 'S3'], y: [data[0][0], data[1][0], data[2][0]], name: 'Feature 1', type: 'bar', marker: {color: '#4338ca'} },
            { x: ['S1', 'S2', 'S3'], y: [data[0][1], data[1][1], data[2][1]], name: 'Feature 2', type: 'bar', marker: {color: '#10b981'} }
        ];
        Plotly.newPlot(id, traces, { 
            title: title, 
            barmode: 'group',
            margin: { t: 50, b: 30, l: 40, r: 10 },
            legend: { orientation: 'h', y: -0.2 }
        });
    }
};

window.addEventListener('load', () => NormLab.init());
