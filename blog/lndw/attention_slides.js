// ============================================================
// ATTENTION MATRIX VISUALIZATION
// ============================================================

const AttentionMatrixViz = {
    sentences: {
        katze: ['Die', 'Katze', 'saß', 'auf', 'der', 'Matte', 'weil', 'sie', 'müde', 'war'],
        koenig: ['Der', 'König', 'gab', 'der', 'Königin', 'den', 'Ring'],
    },

    // Causal masked attention weights (nur unteres Dreieck + Diagonale haben echte Werte)
    // Jede Zeile i hat nur Gewichte für Spalten 0..i (summiert sich zu 1)
    // Spalten j > i sind null (causal mask)
    weights: {
        katze: {
            syntax: [
                [1.00, 0, 0, 0, 0, 0, 0, 0, 0, 0],                          // Die: kann nur sich selbst sehen
                [0.35, 0.65, 0, 0, 0, 0, 0, 0, 0, 0],                        // Katze → Die
                [0.08, 0.62, 0.30, 0, 0, 0, 0, 0, 0, 0],                     // saß → Katze (Subjekt-Verb)
                [0.05, 0.08, 0.22, 0.65, 0, 0, 0, 0, 0, 0],                  // auf → saß
                [0.04, 0.06, 0.05, 0.20, 0.65, 0, 0, 0, 0, 0],              // der → auf
                [0.03, 0.07, 0.10, 0.40, 0.15, 0.25, 0, 0, 0, 0],           // Matte → auf (Präp→Obj)
                [0.02, 0.05, 0.15, 0.03, 0.03, 0.05, 0.67, 0, 0, 0],        // weil → saß
                [0.03, 0.55, 0.05, 0.03, 0.03, 0.04, 0.07, 0.20, 0, 0],     // sie → Katze (Pronomen!)
                [0.02, 0.05, 0.04, 0.02, 0.02, 0.03, 0.04, 0.48, 0.30, 0],  // müde → sie
                [0.02, 0.05, 0.08, 0.02, 0.02, 0.02, 0.12, 0.12, 0.45, 0.10], // war → müde
            ],
            coref: [
                [1.00, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0.50, 0.50, 0, 0, 0, 0, 0, 0, 0, 0],
                [0.20, 0.40, 0.40, 0, 0, 0, 0, 0, 0, 0],
                [0.15, 0.20, 0.30, 0.35, 0, 0, 0, 0, 0, 0],
                [0.12, 0.18, 0.20, 0.20, 0.30, 0, 0, 0, 0, 0],
                [0.10, 0.15, 0.15, 0.20, 0.15, 0.25, 0, 0, 0, 0],
                [0.08, 0.12, 0.20, 0.10, 0.10, 0.15, 0.25, 0, 0, 0],
                [0.02, 0.72, 0.03, 0.02, 0.02, 0.04, 0.03, 0.12, 0, 0],     // sie → Katze (stark!)
                [0.02, 0.08, 0.03, 0.02, 0.02, 0.02, 0.03, 0.63, 0.15, 0],  // müde → sie
                [0.02, 0.10, 0.03, 0.02, 0.02, 0.02, 0.03, 0.52, 0.14, 0.10], // war → sie
            ],
            adjacent: [
                [1.00, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0.40, 0.60, 0, 0, 0, 0, 0, 0, 0, 0],
                [0.10, 0.55, 0.35, 0, 0, 0, 0, 0, 0, 0],
                [0.05, 0.10, 0.50, 0.35, 0, 0, 0, 0, 0, 0],
                [0.03, 0.05, 0.10, 0.47, 0.35, 0, 0, 0, 0, 0],
                [0.02, 0.03, 0.05, 0.10, 0.45, 0.35, 0, 0, 0, 0],
                [0.02, 0.02, 0.03, 0.05, 0.08, 0.45, 0.35, 0, 0, 0],
                [0.01, 0.02, 0.02, 0.03, 0.05, 0.07, 0.42, 0.38, 0, 0],
                [0.01, 0.01, 0.02, 0.02, 0.03, 0.05, 0.07, 0.42, 0.37, 0],
                [0.01, 0.01, 0.01, 0.02, 0.02, 0.03, 0.05, 0.06, 0.40, 0.39],
            ],
        },
        koenig: {
            syntax: [
                [1.00, 0, 0, 0, 0, 0, 0],
                [0.30, 0.70, 0, 0, 0, 0, 0],
                [0.05, 0.55, 0.40, 0, 0, 0, 0],                    // gab → König (Subj-Verb)
                [0.08, 0.05, 0.12, 0.75, 0, 0, 0],                 // der → gab
                [0.04, 0.10, 0.42, 0.14, 0.30, 0, 0],              // Königin → gab (indir. Obj)
                [0.03, 0.05, 0.15, 0.05, 0.07, 0.65, 0],           // den → Königin
                [0.03, 0.08, 0.48, 0.04, 0.12, 0.10, 0.15],        // Ring → gab (dir. Obj)
            ],
            coref: [
                [1.00, 0, 0, 0, 0, 0, 0],
                [0.40, 0.60, 0, 0, 0, 0, 0],
                [0.20, 0.30, 0.50, 0, 0, 0, 0],
                [0.15, 0.20, 0.25, 0.40, 0, 0, 0],
                [0.05, 0.50, 0.10, 0.10, 0.25, 0, 0],              // Königin → König (Koreferenz!)
                [0.10, 0.15, 0.15, 0.15, 0.20, 0.25, 0],
                [0.05, 0.15, 0.35, 0.05, 0.20, 0.08, 0.12],        // Ring → gab, Königin
            ],
            adjacent: [
                [1.00, 0, 0, 0, 0, 0, 0],
                [0.40, 0.60, 0, 0, 0, 0, 0],
                [0.08, 0.52, 0.40, 0, 0, 0, 0],
                [0.04, 0.08, 0.48, 0.40, 0, 0, 0],
                [0.03, 0.05, 0.08, 0.44, 0.40, 0, 0],
                [0.02, 0.03, 0.05, 0.08, 0.42, 0.40, 0],
                [0.02, 0.02, 0.03, 0.05, 0.08, 0.42, 0.38],
            ],
        }
    },

    render: function() {
        const plotDiv = document.getElementById('attn-matrix-plot');
        if (!plotDiv) return;

        const sentenceKey = document.getElementById('attn-matrix-sentence')?.value || 'katze';
        const aspect = document.getElementById('attn-matrix-aspect')?.value || 'syntax';

        const tokens = this.sentences[sentenceKey];
        const rawMatrix = this.weights[sentenceKey][aspect];
        const n = tokens.length;

        // Erstelle die Display-Matrix: echte Werte unten-links, null oben-rechts (causal mask)
        const displayMatrix = [];
        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j < n; j++) {
                if (j > i) {
                    row.push(null); // Causal mask: kann Zukunft nicht sehen
                } else {
                    row.push(rawMatrix[i][j]);
                }
            }
            displayMatrix.push(row);
        }

        // Custom colorscale mit grau für null
        const trace = {
            z: displayMatrix,
            x: tokens,
            y: tokens.slice(),
            type: 'heatmap',
            colorscale: [
                [0, '#f8fafc'],
                [0.08, '#e0f2fe'],
                [0.15, '#bae6fd'],
                [0.25, '#7dd3fc'],
                [0.4, '#38bdf8'],
                [0.55, '#0ea5e9'],
                [0.7, '#0284c7'],
                [0.85, '#0369a1'],
                [1, '#0c4a6e']
            ],
            showscale: true,
            colorbar: { title: 'Gewicht', titleside: 'right', len: 0.8, thickness: 14 },
            hovertemplate: '<b>%{y}</b> → <b>%{x}</b><br>Attention: %{z:.3f}<extra></extra>',
            xgap: 2,
            ygap: 2,
            zmin: 0,
            zmax: 1,
        };

        // Text-Annotationen für ALLE Zellen
        const annotations = [];
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (j > i) {
                    // Maskierte Zelle: zeige "✕" oder "—"
                    annotations.push({
                        x: tokens[j],
                        y: tokens[i],
                        text: '✕',
                        font: { size: tokens.length > 8 ? 8 : 10, color: '#cbd5e1' },
                        showarrow: false,
                    });
                } else {
                    // Echte Werte: immer anzeigen
                    const val = displayMatrix[i][j];
                    annotations.push({
                        x: tokens[j],
                        y: tokens[i],
                        text: val >= 0.01 ? val.toFixed(2) : '0',
                        font: {
                            size: tokens.length > 8 ? 8 : 10,
                            color: val > 0.45 ? '#fff' : val > 0.25 ? '#f0f9ff' : '#334155'
                        },
                        showarrow: false,
                    });
                }
            }
        }

        // Zeichne eine diagonale Linie für die Causal-Mask-Grenze
        const shapes = [];
        // Visuelles Overlay für den maskierten Bereich (oberes Dreieck)
        // Wir nutzen Plotly shapes um ein halbtransparentes Dreieck zu zeichnen
        shapes.push({
            type: 'line',
            x0: -0.5,
            y0: -0.5,
            x1: n - 0.5,
            y1: n - 0.5,
            xref: 'x',
            yref: 'y',
            line: { color: '#ef4444', width: 2, dash: 'dot' },
        });

        const layout = {
            margin: { l: 80, r: 60, b: 80, t: 50 },
            xaxis: {
                title: '← schaut auf (Key)',
                tickangle: -30,
                tickfont: { size: 11, weight: 'bold' },
                side: 'bottom'
            },
            yaxis: {
                title: 'Dieses Wort (Query) →',
                tickfont: { size: 11, weight: 'bold' },
                autorange: 'reversed'
            },
            annotations: annotations,
            shapes: shapes,
            plot_bgcolor: '#fff',
            title: {
                text: `Aspekt: ${aspect === 'syntax' ? 'Syntaktische Beziehungen' : aspect === 'coref' ? 'Koreferenz (Pronomen-Auflösung)' : 'Lokale Nähe'} │ 🔺 Causal Mask (oberes Dreieck blockiert)`,
                font: { size: 13, color: '#475569' }
            }
        };

        Plotly.react(plotDiv, [trace], layout, { displayModeBar: false, responsive: true });

        // Update info
        const info = document.getElementById('attn-matrix-info');
        if (info) {
            const aspectDescs = {
                syntax: '🔗 <b>Syntax-Head:</b> "saß" achtet stark auf "Katze" (Subjekt→Verb), "Matte" auf "auf" (Präp→Objekt). Jeder Head lernt andere grammatische Beziehungen.',
                coref: '👆 <b>Koreferenz-Head:</b> "sie" achtet mit 0.72 auf "Katze" – es löst das Pronomen auf! So "weiß" das Modell, wer müde ist.',
                adjacent: '📍 <b>Lokaler Head:</b> Jedes Wort achtet vor allem auf seinen direkten Vorgänger. Nützlich für Subword-Komposition und lokale Phrasen.',
            };
            info.innerHTML = aspectDescs[aspect] +
                '<br><span style="font-size:0.82em; color:#64748b;">Jede Zeile summiert sich zu 1 (Softmax). <b style="color:#ef4444;">✕ = Causal Mask</b>: Ein Wort kann nur auf sich selbst und vorherige Wörter schauen – nie in die Zukunft!</span>';
        }
    }
};

// ============================================================
// ATTENTION ROUTER VISUALIZATION
// ============================================================

const AttentionRouterViz = {
    tokens: ['x₁', 'x₂', 'x₃'],
    outputLabels: ['sa₁[x•]', 'sa₂[x•]', 'sa₃[x•]'],

    // Routing weights (from the figure: each output has different weights)
    routingWeights: [
        [0.1, 0.3, 0.6],  // Output 1: mostly from x3
        [0.5, 0.2, 0.3],  // Output 2: mostly from x1
        [0.1, 0.2, 0.7],  // Output 3: mostly from x3
    ],

    animating: false,

    render: function() {
        const plotDiv = document.getElementById('attn-router-plot');
        if (!plotDiv) return;

        const focusVal = document.getElementById('attn-router-focus')?.value || 'all';
        const traces = [];
        const annotations = [];

        // Layout positions
        const inputX = 0.5;
        const valueX = 2.5;
        const outputX = 4.5;
        const yPositions = [3, 2, 1]; // top to bottom for x1, x2, x3

        // Draw input nodes
        traces.push({
            x: yPositions.map(() => inputX),
            y: yPositions,
            mode: 'markers+text',
            text: this.tokens,
            textposition: 'middle left',
            textfont: { size: 14, color: '#1e293b', weight: 'bold' },
            marker: { size: 28, color: ['#3b82f6', '#10b981', '#f59e0b'], line: { width: 2, color: '#fff' } },
            hoverinfo: 'none',
            showlegend: false,
        });

        // Draw value nodes (middle column)
        traces.push({
            x: yPositions.map(() => valueX),
            y: yPositions,
            mode: 'markers+text',
            text: ['v₁', 'v₂', 'v₃'],
            textposition: 'middle center',
            textfont: { size: 11, color: '#fff', weight: 'bold' },
            marker: { size: 24, color: ['#3b82f6', '#10b981', '#f59e0b'], symbol: 'square', line: { width: 1, color: '#fff' } },
            hoverinfo: 'none',
            showlegend: false,
        });

        // Draw output nodes
        traces.push({
            x: yPositions.map(() => outputX),
            y: yPositions,
            mode: 'markers+text',
            text: this.outputLabels,
            textposition: 'middle right',
            textfont: { size: 13, color: '#1e293b', weight: 'bold' },
            marker: { size: 26, color: ['#8b5cf6', '#ec4899', '#06b6d4'], symbol: 'diamond', line: { width: 2, color: '#fff' } },
            hoverinfo: 'none',
            showlegend: false,
        });

        // Input → Value arrows (always shown, thin)
        for (let i = 0; i < 3; i++) {
            traces.push({
                x: [inputX + 0.15, valueX - 0.15],
                y: [yPositions[i], yPositions[i]],
                mode: 'lines',
                line: { color: '#cbd5e1', width: 2, dash: 'dot' },
                hoverinfo: 'none',
                showlegend: false,
            });
        }

        // Value → Output routing lines
        const outputColors = ['#8b5cf6', '#ec4899', '#06b6d4'];

        for (let outIdx = 0; outIdx < 3; outIdx++) {
            if (focusVal !== 'all' && parseInt(focusVal) !== outIdx) continue;

            const weights = this.routingWeights[outIdx];
            for (let valIdx = 0; valIdx < 3; valIdx++) {
                const w = weights[valIdx];
                const lineWidth = Math.max(1, w * 12);
                const opacity = Math.max(0.2, w);

                traces.push({
                    x: [valueX + 0.15, outputX - 0.15],
                    y: [yPositions[valIdx], yPositions[outIdx]],
                    mode: 'lines',
                    line: { color: outputColors[outIdx], width: lineWidth },
                    opacity: opacity,
                    hoverinfo: 'none',
                    showlegend: false,
                });

                // Weight label on the line
                const midX = (valueX + 0.15 + outputX - 0.15) / 2;
                const midY = (yPositions[valIdx] + yPositions[outIdx]) / 2;
                if (w >= 0.2) {
                    annotations.push({
                        x: midX,
                        y: midY + 0.08,
                        text: `<b>${w.toFixed(1)}</b>`,
                        showarrow: false,
                        font: { size: 12, color: outputColors[outIdx] },
                        bgcolor: 'rgba(255,255,255,0.85)',
                        borderpad: 2,
                    });
                }
            }
        }

        // Column labels
        annotations.push(
            { x: inputX, y: 3.6, text: '<b>Inputs</b>', showarrow: false, font: { size: 13, color: '#64748b' } },
            { x: valueX, y: 3.6, text: '<b>Values</b>', showarrow: false, font: { size: 13, color: '#64748b' } },
            { x: outputX, y: 3.6, text: '<b>Outputs</b>', showarrow: false, font: { size: 13, color: '#64748b' } },
        );

        // Formula annotation at bottom
        if (focusVal !== 'all') {
            const idx = parseInt(focusVal);
            const w = this.routingWeights[idx];
            annotations.push({
                x: 2.5,
                y: 0.3,
                text: `<b>sa${idx+1}[x•] = ${w[0]}·v₁ + ${w[1]}·v₂ + ${w[2]}·v₃</b>`,
                showarrow: false,
                font: { size: 14, color: outputColors[idx] },
                bgcolor: 'rgba(255,255,255,0.9)',
                borderpad: 6,
                bordercolor: outputColors[idx],
                borderwidth: 1,
            });
        }

        const layout = {
            margin: { l: 20, r: 20, b: 20, t: 20 },
            xaxis: { range: [-0.3, 5.8], showgrid: false, zeroline: false, showticklabels: false },
            yaxis: { range: [0, 4], showgrid: false, zeroline: false, showticklabels: false, scaleanchor: 'x' },
            annotations: annotations,
            plot_bgcolor: '#fff',
            showlegend: false,
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });

        // Update info
        const info = document.getElementById('attn-router-info');
        if (info) {
            if (focusVal === 'all') {
                info.innerHTML = '🚦 <b>Alle Outputs gleichzeitig:</b> Jeder Output bekommt eine <b>andere gewichtete Mischung</b> der Values. Das ist das Routing – gleiche Eingabe, verschiedene Ausgaben je nach Attention-Gewichten. Spätere Layer sehen dadurch <b>verschiedene Zusammenfassungen</b> des Kontexts.';
            } else {
                const idx = parseInt(focusVal);
                const w = this.routingWeights[idx];
                const maxIdx = w.indexOf(Math.max(...w));
                info.innerHTML = `🎯 <b>Output ${idx+1}:</b> Bekommt ${(w[maxIdx]*100).toFixed(0)}% von <b>v${maxIdx+1}</b>. Die Attention-Gewichte routen die Information – spätere Layer "sehen" hauptsächlich den Value von x${maxIdx+1}. <b>Verschiedene Heads routen unterschiedlich</b> → das Modell kann gleichzeitig auf Syntax, Semantik und Position achten.`;
            }
        }
    },

    animate: function() {
        if (this.animating) return;
        this.animating = true;

        const select = document.getElementById('attn-router-focus');
        let step = 0;
        const sequence = ['0', '1', '2', 'all'];

        const interval = setInterval(() => {
            if (step >= sequence.length) {
                clearInterval(interval);
                this.animating = false;
                return;
            }
            if (select) select.value = sequence[step];
            this.render();
            step++;
        }, 1200);
    }
};

// ============================================================
// INIT für die neuen Attention-Slides
// ============================================================

function initAttentionSlides() {
    AttentionMatrixViz.render();
    AttentionRouterViz.render();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAttentionSlides);
} else {
    initAttentionSlides();
}
