const NormLab = {
    // Einfache Werte für perfekte Nachrechenbarkeit
    // Spalte 1: Mittelwert 20, Spalte 2: Mittelwert 6
    data: [
        [10, 2],  // Bsp 1
        [20, 4],  // Bsp 2
        [30, 12]  // Bsp 3
    ],

    init: function() {
        this.renderTable('input-table', this.data);
        this.renderPlot('input-plot', this.data, 'Input Verteilung');
    },

    process: function(mode) {
        const epsilon = 0.00001;
        let results = [];
        let mathHtml = `<h3>Rechnung: ${mode === 'batch' ? 'Batch' : 'Layer'} Normalization</h3>`;
        
        if (mode === 'batch') {
            // Über Spalten
            const features = [0, 1];
            const stats = features.map(colIndex => {
                const values = this.data.map(row => row[colIndex]);
                const mu = values.reduce((a, b) => a + b) / values.length;
                const sigmaSq = values.reduce((a, b) => a + Math.pow(b - mu, 2), 0) / values.length;
                return { mu, sigmaSq, std: Math.sqrt(sigmaSq + epsilon) };
            });

            mathHtml += `$$\\mu_{col1} = ${stats[0].mu}, \\quad \\mu_{col2} = ${stats[1].mu}$$`;
            mathHtml += `$$\\sigma^2_{col1} = ${stats[0].sigmaSq.toFixed(2)}, \\quad \\sigma^2_{col2} = ${stats[1].sigmaSq.toFixed(2)}$$`;

            results = this.data.map(row => [
                (row[0] - stats[0].mu) / stats[0].std,
                (row[1] - stats[1].mu) / stats[1].std
            ]);
            
            document.getElementById('output-formula').innerHTML = `$$x_{norm} = \\frac{x - \\mu_{batch}}{\\sqrt{\\sigma^2_{batch} + \\epsilon}}$$`;
        } else {
            // Über Zeilen (Layer)
            mathHtml += `<p>Hier berechnen wir $\\mu$ und $\\sigma$ für jedes Beispiel separat:</p>`;
            results = this.data.map((row, i) => {
                const mu = (row[0] + row[1]) / 2;
                const sigmaSq = (Math.pow(row[0] - mu, 2) + Math.pow(row[1] - mu, 2)) / 2;
                const std = Math.sqrt(sigmaSq + epsilon);
                mathHtml += `$$Bsp_{${i+1}}: \\mu = ${mu}, \\sigma^2 = ${sigmaSq.toFixed(1)}$$`;
                return [(row[0] - mu) / std, (row[1] - mu) / std];
            });

            document.getElementById('output-formula').innerHTML = `$$x_{norm} = \\frac{x - \\mu_{layer}}{\\sqrt{\\sigma^2_{layer} + \\epsilon}}$$`;
        }

        document.getElementById('math-steps').innerHTML = mathHtml;
        document.getElementById('output-title').innerText = `2. Output (${mode === 'batch' ? 'Batch' : 'Layer'} Norm)`;
        
        this.renderTable('output-table', results, true);
        this.renderPlot('output-plot', results, 'Normalisierte Werte');
        
        if (window.MathJax) MathJax.typesetPromise();
    },

    renderTable: function(id, data, round = false) {
        const table = document.getElementById(id);
        let html = `<thead><tr><th>Bsp</th><th>F1</th><th>F2</th></tr></thead><tbody>`;
        data.forEach((row, i) => {
            html += `<tr>
                <td style="border:1px solid #ddd; padding:5px;">#${i+1}</td>
                <td style="border:1px solid #ddd; padding:5px;">${round ? row[0].toFixed(3) : row[0]}</td>
                <td style="border:1px solid #ddd; padding:5px;">${round ? row[1].toFixed(3) : row[1]}</td>
            </tr>`;
        });
        html += `</tbody>`;
        table.innerHTML = html;
    },

    renderPlot: function(id, data, title) {
        const traces = [
            { x: ['Bsp 1', 'Bsp 2', 'Bsp 3'], y: [data[0][0], data[1][0], data[2][0]], name: 'Feature 1', type: 'bar' },
            { x: ['Bsp 1', 'Bsp 2', 'Bsp 3'], y: [data[0][1], data[1][1], data[2][1]], name: 'Feature 2', type: 'bar' }
        ];
        const layout = { 
            title: { text: title, font: { size: 14 } },
            margin: { t: 30, b: 30, l: 40, r: 10 },
            barmode: 'group',
            showlegend: false
        };
        Plotly.newPlot(id, traces, layout);
    }
};

window.addEventListener('load', () => NormLab.init());
