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
            this.data = { finwake: { top_words: [], top_freqs: [], total_words: 0, unique_words: 0 },
                          kjv:     { top_words: [], top_freqs: [], total_words: 0, unique_words: 0 } };
        }
        return this.data;
    },

    buildTrace: function(ds, color, label, topN) {
        const ranks   = ds.top_freqs.map((_, i) => i + 1);
        const topWords = ds.top_words;
        const topCount = Math.min(topN, topWords.length);
        const text = ranks.map((r, i) => {
            const w = topWords[i];
            const c = ds.top_freqs[i];
            return `#${r}: "${w}" (${c.toLocaleString('de-DE')})`;
        });
        return {
            x: ranks,
            y: ds.top_freqs,
            mode: 'markers+lines',
            marker: {
                color: color,
                size: 6,
                line: { width: 0.5, color: color }
            },
            line: { color: color, width: 1.5 },
            text: text,
            hovertemplate: '%{text}<extra></extra>',
            name: label,
            showlegend: true
        };
    },

    // Wählt Anker für die Beschriftung: 1, 2, 3, 4, 5, 6, 7, 8 dann ...
    // dann letzte Position aus dem Top-Set
    annotationRanks: function(N) {
        if (N <= 10) return Array.from({ length: N }, (_, i) => i + 1);
        const head = [1, 2, 3, 4, 5, 6, 7, 8];
        const tail = [Math.round(N * 0.25), Math.round(N * 0.5), Math.round(N * 0.75), N];
        // Deduplizieren und sortieren
        return [...new Set([...head, ...tail])].sort((a, b) => a - b);
    },

    buildAnnotations: function(ds, color, position) {
        const N = ds.top_words.length;
        const ranks = this.annotationRanks(N);
        return ranks.map(r => {
            const w = ds.top_words[r - 1];
            const c = ds.top_freqs[r - 1];
            // Vorletzte oder letzte als Endpunkt hervorheben
            const isEdge = (r === 1) || (r === N);
            return {
                x: Math.log10(r),
                y: Math.log10(c),
                xref: 'x',
                yref: 'y',
                text: isEdge ? `<b>${w}</b><br>${c.toLocaleString('de-DE')}` : w,
                showarrow: false,
                font: { size: isEdge ? 12 : 10, color: color },
                bgcolor: isEdge ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.0)',
                bordercolor: isEdge ? color : 'rgba(0,0,0,0)',
                borderwidth: isEdge ? 1.5 : 0,
                borderpad: isEdge ? 3 : 0
            };
        });
    },

    renderGermanZipf: async function() {
        const plotDiv = document.getElementById('zipf-german-plot');
        if (!plotDiv) return;

        const data = await this.loadData();
        const kjv     = data.kjv;
        const finwake = data.finwake;

        const TOP_N = 200;

        // Beschneide auf TOP_N (wir plotten ohnehin nur die häufigsten)
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

        const layout = {
            margin: { l: 70, r: 20, b: 60, t: 30 },
            xaxis: {
                title: 'Rang des Wortes (nach Häufigkeit)  →  log',
                type: 'log',
                gridcolor: '#f1f5f9',
                tickfont: { size: 11 }
            },
            yaxis: {
                title: 'Häufigkeit im Text  →  log',
                type: 'log',
                gridcolor: '#f1f5f9',
                tickformat: ',d',
                tickfont: { size: 11 }
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
