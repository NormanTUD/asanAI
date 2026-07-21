// ============================================================
// HISTORY.JS – Interaktive Visualisierungen für die KI-Geschichte
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // OR/XOR Gate Plots (für die AI-Winter-Slide)
    // ============================================================
    function renderGatePlots() {
        const orDiv = document.getElementById('plot-or-gate-hist');
        const xorDiv = document.getElementById('plot-xor-gate-hist');
        if (!orDiv || !xorDiv) return;

        // OR Gate
        const orTrace = {
            x: [0, 0, 1, 1],
            y: [0, 1, 0, 1],
            mode: 'markers',
            marker: {
                size: 18,
                color: ['#ef4444', '#22c55e', '#22c55e', '#22c55e'],
                line: { width: 2, color: '#fff' }
            },
            text: ['(0,0)→F', '(0,1)→T', '(1,0)→T', '(1,1)→T'],
            hoverinfo: 'text',
            type: 'scatter'
        };

        // Trennlinie für OR
        const orLine = {
            x: [-0.3, 1.3],
            y: [0.5, -0.1],
            mode: 'lines',
            line: { color: '#6366f1', width: 3, dash: 'dash' },
            name: 'Trennlinie',
            hoverinfo: 'none'
        };

        Plotly.newPlot(orDiv, [orTrace, orLine], {
            title: { text: 'OR Gate – linear trennbar ✓', font: { size: 14 } },
            xaxis: { range: [-0.5, 1.5], title: 'Input 1', dtick: 1 },
            yaxis: { range: [-0.5, 1.5], title: 'Input 2', dtick: 1 },
            showlegend: false,
            margin: { t: 40, b: 40, l: 40, r: 20 },
            plot_bgcolor: '#fff'
        }, { displayModeBar: false, responsive: true });

        // XOR Gate
        const xorTrace = {
            x: [0, 0, 1, 1],
            y: [0, 1, 0, 1],
            mode: 'markers',
            marker: {
                size: 18,
                color: ['#ef4444', '#22c55e', '#22c55e', '#ef4444'],
                line: { width: 2, color: '#fff' }
            },
            text: ['(0,0)→F', '(0,1)→T', '(1,0)→T', '(1,1)→F'],
            hoverinfo: 'text',
            type: 'scatter'
        };

        Plotly.newPlot(xorDiv, [xorTrace], {
            title: { text: 'XOR Gate – NICHT linear trennbar ✗', font: { size: 14 } },
            xaxis: { range: [-0.5, 1.5], title: 'Input 1', dtick: 1 },
            yaxis: { range: [-0.5, 1.5], title: 'Input 2', dtick: 1 },
            showlegend: false,
            margin: { t: 40, b: 40, l: 40, r: 20 },
            plot_bgcolor: '#fff',
            annotations: [{
                x: 0.5, y: -0.35, xref: 'x', yref: 'y',
                text: 'Keine einzelne Linie kann T von F trennen!',
                showarrow: false,
                font: { size: 11, color: '#ef4444' }
            }]
        }, { displayModeBar: false, responsive: true });
    }

    // ============================================================
    // Timeline Plot
    // ============================================================
    function renderTimeline() {
        const div = document.getElementById('plot-timeline-hist');
        if (!div) return;

        const events = [
            { year: -35000, label: 'Lebombo-Knochen', era: 'ancient' },
            { year: -20000, label: 'Ishango-Knochen', era: 'ancient' },
            { year: -350, label: 'Aristoteles: Syllogismus', era: 'formal' },
            { year: -150, label: 'Antikythera-Mechanismus', era: 'ancient' },
            { year: 1275, label: 'Ramon Llull: Ars Magna', era: 'formal' },
            { year: 1685, label: 'Leibniz: Calculemus!', era: 'mechanical' },
            { year: 1837, label: 'Babbage: Analytical Engine', era: 'mechanical' },
            { year: 1854, label: 'Boole: Laws of Thought', era: 'mechanical' },
            { year: 1913, label: 'El Ajedrecista', era: 'electronic' },
            { year: 1937, label: 'Zuse: Z1', era: 'mechanical' },
            { year: 1943, label: 'McCulloch & Pitts', era: 'neural' },
            { year: 1950, label: 'Turing: Can Machines Think?', era: 'electronic' },
            { year: 1958, label: 'Rosenblatt: Perceptron', era: 'neural' },
            { year: 1969, label: 'Minsky: XOR-Problem', era: 'neural' },
            { year: 1997, label: 'LSTM / Deep Blue', era: 'neural' },
            { year: 2012, label: 'AlexNet / GPU-Revolution', era: 'modern' },
            { year: 2017, label: 'Transformer', era: 'modern' },
            { year: 2022, label: 'ChatGPT', era: 'llm' }
        ];

        const eraColors = {
            ancient: '#f59e0b',
            formal: '#8b5cf6',
            mechanical: '#0ea5e9',
            electronic: '#10b981',
            neural: '#ef4444',
            modern: '#3b82f6',
            llm: '#6366f1'
        };

        // Use log scale for better visibility
        const xPositions = events.map((e, i) => i);

        const trace = {
            x: xPositions,
            y: events.map(() => 1),
            mode: 'markers+text',
            marker: {
                size: 14,
                color: events.map(e => eraColors[e.era]),
                line: { width: 2, color: '#fff' }
            },
            text: events.map(e => e.label),
            textposition: events.map((_, i) => i % 2 === 0 ? 'top center' : 'bottom center'),
            textfont: { size: 9 },
            hovertext: events.map(e => `${e.year > 0 ? e.year : Math.abs(e.year) + ' v.Chr.'}: ${e.label}`),
            hoverinfo: 'text',
            type: 'scatter'
        };

        Plotly.newPlot(div, [trace], {
            xaxis: {
                tickvals: xPositions,
                ticktext: events.map(e => e.year > 0 ? String(e.year) : Math.abs(e.year) + ' v.Chr.'),
                tickangle: -45,
                tickfont: { size: 9 }
            },
            yaxis: { visible: false, range: [0.3, 1.7] },
            showlegend: false,
            margin: { t: 20, b: 80, l: 20, r: 20 },
            plot_bgcolor: '#fff',
            shapes: [{
                type: 'line',
                x0: 0, x1: xPositions.length - 1,
                y0: 1, y1: 1,
                line: { color: '#e2e8f0', width: 2 }
            }]
        }, { displayModeBar: false, responsive: true });
    }

    // ============================================================
    // INIT – wird aufgerufen wenn DOM ready
    // ============================================================
    function initHistoryViz() {
        renderGatePlots();
        renderTimeline();
    }

    // Export für history_presentation.js
    window.HistoryViz = { init: initHistoryViz };

    document.addEventListener('DOMContentLoaded', function() {
        // Wird von history_presentation.js nach Slide-Init aufgerufen
    });
})();
