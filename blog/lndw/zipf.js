// ============================================================
// ZIPF'S LAW VISUALIZATION — reale Daten aus Finnegans Wake
// und King James Bible, geladen aus zipf_data.json
// ============================================================

const ZipfViz = {

    data: null,

    loadData: async function() {
        if (this.data) return this.data;
        try {
            const resp = await fetch('zipf_data.json');
            this.data = await resp.json();
        } catch (e) {
            console.error('Konnte zipf_data.json nicht laden:', e);
            this.data = {
                finwake: { top_words: [], top_freqs: [], total_words: 0, unique_words: 0 },
                kjv:     { top_words: [], top_freqs: [], total_words: 0, unique_words: 0 }
            };
        }
        return this.data;
    },

    buildTrace: function(ds, color, label) {
        const text = ds.top_freqs.map((c, i) =>
            `#${i+1}: "${ds.top_words[i]}" (${c.toLocaleString('de-DE')})`
        );
        return {
            x: ds.top_freqs.map((_, i) => i + 1),
            y: ds.top_freqs,
            mode: 'markers+lines',
            marker: {
                color: color,
                size: 5,
                line: { width: 0 }
            },
            line: { color: color, width: 2 },
            text: text,
            hovertemplate: '%{text}<extra></extra>',
            name: label,
            showlegend: true
        };
    },

    // Annotations: top 8 Wörter + "..." in der Mitte + letztes Wort
    // Position: neben den Datenpunkten (nicht darauf)
    buildAnnotations: function(ds, color) {
        const N = ds.top_words.length;
        const annotations = [];

        // Top 8: kleine Labels rechts neben den Datenpunkten
        const TOP = Math.min(8, N);
        for (let r = 1; r <= TOP; r++) {
            annotations.push({
                x: Math.log10(r),
                y: Math.log10(ds.top_freqs[r - 1]),
                xref: 'x', yref: 'y',
                text: `<b>${ds.top_words[r - 1]}</b>`,
                showarrow: false,
                xanchor: 'left',
                yanchor: 'bottom',
                xshift: 4,
                yshift: 2,
                font: { size: 11, color: color },
                bgcolor: 'rgba(255,255,255,0.7)',
                borderpad: 1
            });
        }

        // "..." an drei Stellen in der Mitte (visuelle Lücken-Andeutung)
        if (N > 20) {
            const dots = [Math.floor(N * 0.3), Math.floor(N * 0.5), Math.floor(N * 0.7)];
            dots.forEach(r => {
                annotations.push({
                    x: Math.log10(r),
                    y: Math.log10(ds.top_freqs[r - 1]) - 0.08,
                    xref: 'x', yref: 'y',
                    text: '⋮',
                    showarrow: false,
                    font: { size: 18, color: '#94a3b8' }
                });
            });
        }

        // Letztes Wort im Top-N (mit Häufigkeit)
        annotations.push({
            x: Math.log10(N),
            y: Math.log10(ds.top_freqs[N - 1]),
            xref: 'x', yref: 'y',
            text: `<b>${ds.top_words[N - 1]}</b><br><span style="font-size:10px">${ds.top_freqs[N - 1].toLocaleString('de-DE')}</span>`,
            showarrow: false,
            xanchor: 'right',
            yanchor: 'top',
            xshift: -4,
            yshift: -2,
            font: { size: 11, color: color },
            bgcolor: 'rgba(255,255,255,0.9)',
            bordercolor: color,
            borderwidth: 1.5,
            borderpad: 3
        });

        return annotations;
    },

    renderGermanZipf: async function() {
        const plotDiv = document.getElementById('zipf-german-plot');
        if (!plotDiv) return;

        const data = await this.loadData();
        const kjv     = data.kjv;
        const finwake = data.finwake;

        const TOP_N = 200;

        const kjvDS = {
            top_words: kjv.top_words.slice(0, TOP_N),
            top_freqs: kjv.top_freqs.slice(0, TOP_N)
        };
        const fwDS = {
            top_words: finwake.top_words.slice(0, TOP_N),
            top_freqs: finwake.top_freqs.slice(0, TOP_N)
        };

        const traceKJV = this.buildTrace(kjvDS, '#1e40af', 'King James Bible');
        const traceFW  = this.buildTrace(fwDS,  '#dc2626', 'Finnegans Wake');

        const annotations = [
            ...this.buildAnnotations(kjvDS, '#1e40af'),
            ...this.buildAnnotations(fwDS, '#dc2626')
        ];

        // y-Range so dass beide Linien gut reinpassen
        const allFreqs = [...kjvDS.top_freqs, ...fwDS.top_freqs];
        const yMin = Math.min(...allFreqs);
        const yMax = Math.max(...allFreqs);

        const layout = {
            margin: { l: 70, r: 30, b: 60, t: 30 },
            xaxis: {
                title: 'Rang des Wortes (nach Häufigkeit)  →  log',
                type: 'log',
                gridcolor: '#f1f5f9',
                tickfont: { size: 11 },
                range: [Math.log10(0.7), Math.log10(TOP_N * 1.3)]
            },
            yaxis: {
                title: 'Häufigkeit im Text  →  log',
                type: 'log',
                gridcolor: '#f1f5f9',
                tickformat: ',d',
                tickfont: { size: 11 },
                range: [Math.log10(yMin) - 0.4, Math.log10(yMax) + 0.3]
            },
            plot_bgcolor: '#fff',
            paper_bgcolor: '#fff',
            showlegend: true,
            legend: {
                x: 0.02, y: 0.98,
                xanchor: 'left', yanchor: 'top',
                bgcolor: 'rgba(255,255,255,0.92)',
                bordercolor: '#cbd5e1',
                borderwidth: 1,
                font: { size: 11 }
            },
            annotations: annotations
        };

        Plotly.react(plotDiv, [traceKJV, traceFW], layout, {
            displayModeBar: false,
            responsive: true
        });
    },

    init: function() {
        this.renderGermanZipf();
    },

    resize: function() {
        const plotDiv = document.getElementById('zipf-german-plot');
        if (plotDiv) {
            setTimeout(() => Plotly.Plots.resize(plotDiv), 50);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => ZipfViz.init(), 300);
});
