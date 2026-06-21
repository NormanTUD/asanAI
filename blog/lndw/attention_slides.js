// ============================================================
// ATTENTION MATRIX VISUALIZATION
// ============================================================

const AttentionMatrixViz = {
    sentences: {
        katze: ['Die', 'Katze', 'saß', 'auf', 'der', 'Matte', 'weil', 'sie', 'müde', 'war'],
        koenig: ['Der', 'König', 'gab', 'der', 'Königin', 'den', 'Ring'],
    },

    // Simulated attention weights per aspect
    weights: {
        katze: {
            syntax: [
                [0.15, 0.60, 0.05, 0.05, 0.05, 0.02, 0.02, 0.02, 0.02, 0.02],  // Die → Katze
                [0.10, 0.15, 0.55, 0.05, 0.03, 0.03, 0.03, 0.02, 0.02, 0.02],  // Katze → saß
                [0.05, 0.60, 0.10, 0.05, 0.03, 0.07, 0.02, 0.03, 0.03, 0.02],  // saß → Katze
                [0.03, 0.03, 0.10, 0.10, 0.05, 0.55, 0.04, 0.03, 0.04, 0.03],  // auf → Matte
                [0.03, 0.03, 0.03, 0.03, 0.10, 0.65, 0.03, 0.03, 0.04, 0.03],  // der → Matte
                [0.03, 0.05, 0.08, 0.50, 0.15, 0.07, 0.03, 0.03, 0.03, 0.03],  // Matte → auf
                [0.02, 0.03, 0.03, 0.02, 0.02, 0.02, 0.10, 0.08, 0.12, 0.56],  // weil → war
                [0.05, 0.62, 0.03, 0.03, 0.03, 0.03, 0.05, 0.06, 0.05, 0.05],  // sie → Katze
                [0.02, 0.05, 0.03, 0.02, 0.02, 0.02, 0.04, 0.55, 0.15, 0.10],  // müde → sie
                [0.02, 0.05, 0.05, 0.02, 0.02, 0.02, 0.10, 0.10, 0.52, 0.10],  // war → müde
            ],
            coref: [
                [0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10],
                [0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10],
                [0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10],
                [0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10],
                [0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10],
                [0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10],
                [0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10],
                [0.02, 0.72, 0.02, 0.02, 0.02, 0.05, 0.02, 0.05, 0.04, 0.04],  // sie → Katze (stark!)
                [0.02, 0.05, 0.02, 0.02, 0.02, 0.02, 0.02, 0.70, 0.08, 0.05],  // müde → sie
                [0.02, 0.08, 0.02, 0.02, 0.02, 0.02, 0.02, 0.60, 0.15, 0.05],  // war → sie
            ],
            adjacent: [
                [0.50, 0.35, 0.05, 0.03, 0.02, 0.02, 0.01, 0.01, 0.005, 0.005],
                [0.30, 0.20, 0.35, 0.05, 0.03, 0.03, 0.02, 0.01, 0.005, 0.005],
                [0.05, 0.30, 0.20, 0.30, 0.05, 0.04, 0.03, 0.015, 0.01, 0.005],
                [0.03, 0.05, 0.30, 0.20, 0.28, 0.05, 0.04, 0.02, 0.02, 0.01],
                [0.02, 0.03, 0.05, 0.28, 0.22, 0.28, 0.05, 0.03, 0.02, 0.02],
                [0.02, 0.02, 0.04, 0.05, 0.30, 0.22, 0.25, 0.04, 0.03, 0.03],
                [0.01, 0.02, 0.03, 0.04, 0.05, 0.28, 0.22, 0.25, 0.05, 0.05],
                [0.01, 0.01, 0.02, 0.03, 0.04, 0.05, 0.28, 0.22, 0.25, 0.09],
                [0.005, 0.01, 0.01, 0.02, 0.03, 0.04, 0.05, 0.28, 0.25, 0.305],
                [0.005, 0.005, 0.01, 0.02, 0.02, 0.03, 0.04, 0.06, 0.30, 0.50],
            ],
        },
        koenig: {
            syntax: [
                [0.15, 0.65, 0.05, 0.03, 0.05, 0.03, 0.04],
                [0.08, 0.12, 0.60, 0.03, 0.05, 0.05, 0.07],
                [0.03, 0.50, 0.10, 0.03, 0.15, 0.04, 0.15],
                [0.03, 0.03, 0.03, 0.10, 0.65, 0.06, 0.10],
                [0.03, 0.05, 0.50, 0.10, 0.12, 0.05, 0.15],
                [0.03, 0.03, 0.05, 0.03, 0.05, 0.11, 0.70],
                [0.03, 0.05, 0.55, 0.03, 0.10, 0.14, 0.10],
            ],
            coref: [
                [0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.16],
                [0.14, 0.14, 0.14, 0.14, 0.16, 0.14, 0.14],
                [0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.16],
                [0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.16],
                [0.05, 0.55, 0.05, 0.05, 0.10, 0.10, 0.10],  // Königin → König
                [0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.16],
                [0.05, 0.15, 0.40, 0.05, 0.20, 0.05, 0.10],  // Ring → gab, Königin
            ],
            adjacent: [
                [0.45, 0.40, 0.05, 0.03, 0.03, 0.02, 0.02],
                [0.25, 0.25, 0.35, 0.05, 0.04, 0.03, 0.03],
                [0.05, 0.30, 0.25, 0.25, 0.05, 0.05, 0.05],
                [0.03, 0.05, 0.25, 0.27, 0.30, 0.05, 0.05],
                [0.03, 0.04, 0.05, 0.28, 0.25, 0.25, 0.10],
                [0.02, 0.03, 0.04, 0.05, 0.28, 0.28, 0.30],
                [0.02, 0.02, 0.03, 0.04, 0.06, 0.33, 0.50],
            ],
        }
    },

    render: function() {
        const plotDiv = document.getElementById('attn-matrix-plot');
        if (!plotDiv) return;

        const sentenceKey = document.getElementById('attn-matrix-sentence')?.value || 'katze';
        const aspect = document.getElementById('attn-matrix-aspect')?.value || 'syntax';

        const tokens = this.sentences[sentenceKey];
        const matrix = this.weights[sentenceKey][aspect];

        const trace = {
            z: matrix,
            x: tokens,
            y: tokens.slice(),
            type: 'heatmap',
            colorscale: [
                [0, '#f8fafc'],
                [0.15, '#dbeafe'],
                [0.3, '#93c5fd'],
                [0.5, '#3b82f6'],
                [0.75, '#1d4ed8'],
                [1, '#1e3a5f']
            ],
            showscale: true,
            colorbar: { title: 'Gewicht', titleside: 'right', len: 0.8, thickness: 14 },
            hovertemplate: '<b>%{y}</b> → <b>%{x}</b><br>Attention: %{z:.3f}<extra></extra>',
            xgap: 2,
            ygap: 2,
        };

        // Add text annotations showing values
        const annotations = [];
        for (let i = 0; i < tokens.length; i++) {
            for (let j = 0; j < tokens.length; j++) {
                const val = matrix[i][j];
                if (val >= 0.15) {
                    annotations.push({
                        x: tokens[j],
                        y: tokens[i],
                        text: val.toFixed(2),
                        font: { size: tokens.length > 8 ? 9 : 11, color: val > 0.4 ? '#fff' : '#1e293b' },
                        showarrow: false,
                    });
                }
            }
        }

        const layout = {
            margin: { l: 80, r: 60, b: 80, t: 40 },
            xaxis: { title: '← schaut auf (Key)', tickangle: -30, tickfont: { size: 12, weight: 'bold' }, side: 'bottom' },
            yaxis: { title: 'Dieses Wort (Query) →', tickfont: { size: 12, weight: 'bold' }, autorange: 'reversed' },
            annotations: annotations,
            plot_bgcolor: '#fff',
            title: { text: `Aspekt: ${aspect === 'syntax' ? 'Syntaktische Beziehungen' : aspect === 'coref' ? 'Koreferenz (Pronomen-Auflösung)' : 'Lokale Nähe'}`, font: { size: 14, color: '#475569' } }
        };

        Plotly.react(plotDiv, [trace], layout, { displayModeBar: false, responsive: true });

        // Update info
        const info = document.getElementById('attn-matrix-info');
        if (info) {
            const aspectDescs = {
                syntax: '🔗 <b>Syntax-Head:</b> "Katze" achtet stark auf "saß" (Subjekt→Verb), "auf" achtet auf "Matte" (Präposition→Objekt). Jeder Head lernt andere grammatische Beziehungen.',
                coref: '👆 <b>Koreferenz-Head:</b> "sie" achtet stark auf "Katze" – es löst das Pronomen auf! So "weiß" das Modell, wer müde ist.',
                adjacent: '📍 <b>Lokaler Head:</b> Jedes Wort achtet vor allem auf seine direkten Nachbarn. Nützlich für Subword-Komposition und lokale Phrasen.',
            };
            info.innerHTML = aspectDescs[aspect] + '<br><span style="font-size:0.82em; color:#64748b;">Jede Zeile summiert sich zu 1 (Softmax). Verschiedene Heads = verschiedene Aspekte gleichzeitig.</span>';
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
