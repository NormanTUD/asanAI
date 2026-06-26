(function() {
    function renderInterpolationViz() {
        const container = document.getElementById('interpolation-extrapolation-viz');
        if (!container) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    draw();
                    observer.disconnect();
                }
            });
        }, { rootMargin: '200px' });
        observer.observe(container);

        function draw() {
            // Bekannte Datenpunkte
            const knownX = [1, 2, 3, 4, 5, 6, 7];
            const knownY = [2, 3.2, 2.8, 5.1, 4.6, 5.8, 6.2];

            // Interpolation: Punkt zwischen bekannten Daten
            const interpX = [3.5];
            const interpY = [3.9];

            // Extrapolation: Punkt außerhalb
            const extrapX = [9, 10];
            const extrapY = [7.8, 9.1];

            // "Wahre" Funktion (gestrichelt)
            const trueX = [];
            const trueY = [];
            for (let i = 0; i <= 110; i++) {
                const x = i / 10;
                trueX.push(x);
                trueY.push(1.5 + 0.6 * x + 0.3 * Math.sin(x * 1.5));
            }

            const traces = [
                // Wahre Funktion
                {
                    x: trueX, y: trueY,
                    mode: 'lines', name: 'Wahres Muster',
                    line: { color: '#94a3b8', width: 2, dash: 'dot' }
                },
                // Bekannte Datenpunkte
                {
                    x: knownX, y: knownY,
                    mode: 'markers', name: 'Trainingsdaten',
                    marker: { color: '#3b82f6', size: 12, symbol: 'circle',
                              line: { color: '#fff', width: 2 } }
                },
                // Interpolation
                {
                    x: interpX, y: interpY,
                    mode: 'markers+text', name: 'Interpolation',
                    marker: { color: '#10b981', size: 14, symbol: 'diamond',
                              line: { color: '#fff', width: 2 } },
                    text: ['Interpolation'], textposition: 'top center',
                    textfont: { color: '#065f46', size: 13, family: 'system-ui' }
                },
                // Extrapolation
                {
                    x: extrapX, y: extrapY,
                    mode: 'markers+text', name: 'Extrapolation',
                    marker: { color: '#ef4444', size: 14, symbol: 'diamond',
                              line: { color: '#fff', width: 2 } },
                    text: ['Extrapolation', '⚠️ unsicher!'], textposition: 'top center',
                    textfont: { color: '#991b1b', size: 13, family: 'system-ui' }
                }
            ];

            // Interpolationsbereich (grün hinterlegt)
            const shapes = [
                {
                    type: 'rect', xref: 'x', yref: 'paper',
                    x0: 1, x1: 7, y0: 0, y1: 1,
                    fillcolor: 'rgba(16,185,129,0.06)',
                    line: { color: 'rgba(16,185,129,0.3)', width: 1, dash: 'dash' }
                },
                {
                    type: 'rect', xref: 'x', yref: 'paper',
                    x0: 7, x1: 11, y0: 0, y1: 1,
                    fillcolor: 'rgba(239,68,68,0.06)',
                    line: { color: 'rgba(239,68,68,0.3)', width: 1, dash: 'dash' }
                }
            ];

            const annotations = [
                {
                    x: 4, y: -0.3, xref: 'x', yref: 'y',
                    text: '<b>Zwischen</b> bekannten Daten → sicher',
                    showarrow: false,
                    font: { color: '#065f46', size: 12 }
                },
                {
                    x: 9.5, y: -0.3, xref: 'x', yref: 'y',
                    text: '<b>Außerhalb</b> → unsicher',
                    showarrow: false,
                    font: { color: '#991b1b', size: 12 }
                }
            ];

            const layout = {
                margin: { l: 40, r: 20, t: 30, b: 40 },
                xaxis: { range: [0, 11], title: '', gridcolor: '#f1f5f9' },
                yaxis: { range: [-1, 10], title: '', gridcolor: '#f1f5f9' },
                plot_bgcolor: '#fff',
                paper_bgcolor: '#fff',
                shapes: shapes,
                annotations: annotations,
                legend: {
                    x: 0.02, y: 0.98,
                    bgcolor: 'rgba(255,255,255,0.9)',
                    bordercolor: '#e2e8f0', borderwidth: 1,
                    font: { size: 11 }
                },
                showlegend: true
            };

            Plotly.newPlot(container, traces, layout, {
                displayModeBar: false, responsive: true
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderInterpolationViz);
    } else {
        renderInterpolationViz();
    }
})();
