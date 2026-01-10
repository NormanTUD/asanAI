const NormLab = {
    // Beispiel-Daten: Ein Batch von 4 Beispielen mit 3 Features (z.B. Word-Embeddings)
    // Wir erzeugen absichtlich "out-of-balance" Daten
    data: [
        [10.5, 0.2, -5.0], // Beispiel 1 (Große Varianz)
        [12.0, 0.5, -4.5], // Beispiel 2
        [8.0, -0.1, -6.2], // Beispiel 3
        [15.0, 0.8, -3.0]  // Beispiel 4
    ],

    descriptions: {
        raw: {
            title: "Rohdaten",
            text: "Die Daten liegen in ihren ursprünglichen Skalen vor. Ein Feature (Wert ~10) dominiert die anderen, was das Training instabil macht.",
            math: "x = \\text{Input}"
        },
        batch: {
            title: "Batch Normalization",
            text: "Normalisiert <b>über die gesamte Spalte</b> (den Batch). Gut für CNNs. Macht das Modell unabhängig von der Skalierung einzelner Batches.",
            math: "\\hat{x}_{i,j} = \\frac{x_{i,j} - \\mu_{j}}{\\sigma_{j}}"
        },
        layer: {
            title: "Layer Normalization",
            text: "Normalisiert <b>innerhalb eines Beispiels</b> (über alle Features). Der Standard für <b>Transformer</b>. Funktioniert unabhängig von der Batch-Größe.",
            math: "\\hat{x}_{i,j} = \\frac{x_{i,j} - \\mu_{i}}{\\sigma_{i}}"
        }
    },

    init: function() {
        this.update();
    },

    update: function() {
        const mode = document.getElementById('norm-mode').value;
        const processed = this.calculate(mode);
        this.renderPlot(processed, mode);
        this.renderMeta(mode, processed);
    },

    calculate: function(mode) {
        if (mode === 'raw') return this.data;

        const tensor = tf.tensor2d(this.data);
        let normalized;

        if (mode === 'batch') {
            // Mittelwert und Varianz über Achse 0 (Spalten/Batch)
            const moments = tf.moments(tensor, 0);
            normalized = tensor.sub(moments.mean).div(moments.variance.sqrt().add(1e-5));
        } else {
            // Mittelwert und Varianz über Achse 1 (Zeilen/Features)
            const moments = tf.moments(tensor, 1, true);
            normalized = tensor.sub(moments.mean).div(moments.variance.sqrt().add(1e-5));
        }

        const result = normalized.arraySync();
        tensor.dispose();
        return result;
    },

    renderPlot: function(data, mode) {
        const traces = data.map((row, i) => ({
            x: ['Feature 1', 'Feature 2', 'Feature 3'],
            y: row,
            name: `Beispiel ${i+1}`,
            type: 'bar',
            marker: { opacity: 0.7 }
        }));

        const layout = {
            title: `Datenverteilung (${this.descriptions[mode].title})`,
            barmode: 'group',
            yaxis: { title: 'Wert', range: mode === 'raw' ? [-8, 16] : [-2.5, 2.5] },
            margin: { t: 40, b: 40, l: 50, r: 20 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };

        Plotly.newPlot('plot-normalization', traces, layout);
    },

    renderMeta: function(mode, data) {
        const info = this.descriptions[mode];
        document.getElementById('norm-explanation').innerHTML = `
            <h5 style="margin:0 0 10px 0; color:#4338ca;">${info.title}</h5>
            <p>${info.text}</p>
        `;

        document.getElementById('math-norm-formula').innerHTML = `$$\\text{Formel: } ${info.math}$$`;
        
        // Stats berechnen
        const flat = data.flat();
        const mean = (flat.reduce((a, b) => a + b, 0) / flat.length).toFixed(2);
        const std = Math.sqrt(flat.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / flat.length).toFixed(2);

        document.getElementById('stats-box').innerHTML = `
            <b>Live Statistik (Gesamt):</b><br>
            Durchschnitt (μ): ${mean}<br>
            Standardabw. (σ): ${std}
        `;

        if (window.MathJax) MathJax.typesetPromise();
    }
};

// Start
window.addEventListener('load', () => NormLab.init());
