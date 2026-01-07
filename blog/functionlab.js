function renderELI5Math() {
    const range = [];
    for (let i = -10; i <= 10; i++) range.push(i);

    const layoutBase = {
        margin: { t: 10, b: 30, l: 30, r: 10 },
        xaxis: { fixedrange: true, zeroline: true },
        yaxis: { fixedrange: true, zeroline: true },
        showlegend: false
    };

    // Definition der einzelnen Plot-Jobs
    const plotJobs = {
        'plot-step-1': () => Plotly.newPlot('plot-step-1', [{
            x: range, y: range, mode: 'lines', line: {color: '#3b82f6', width: 4}
        }], layoutBase),

        'plot-step-2': () => Plotly.newPlot('plot-step-2', [{
            x: range, y: range.map(x => -x), mode: 'lines', line: {color: '#ef4444', width: 4}
        }], layoutBase),

        'plot-step-3': () => Plotly.newPlot('plot-step-3', [{
            x: range, y: range.map(x => 3 * x), mode: 'lines', line: {color: '#10b981', width: 4}
        }], layoutBase),

        'plot-step-4': () => {
            const zData = range.map(x => range.map(y => x + y));
            return Plotly.newPlot('plot-step-4', [{
                z: zData, x: range, y: range, type: 'surface', colorscale: 'Blues', showscale: false
            }], {
                margin: { t: 0, b: 0, l: 0, r: 0 },
                scene: { camera: { eye: { x: 1.5, y: 1.5, z: 1 } } }
            });
        },

        'plot-step-5': () => {
            const zWaves = range.map(x => range.map(y => Math.sin(x/2) + Math.sin(y/2)));
            return Plotly.newPlot('plot-step-5', [{
                z: zWaves, x: range, y: range, type: 'surface', colorscale: 'Viridis', showscale: false
            }], {
                margin: { t: 0, b: 0, l: 0, r: 0 },
                scene: { camera: { eye: { x: 1.8, y: 1.8, z: 1.2 } } }
            });
        }
    };

    // Observer erstellen
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                if (plotJobs[id]) {
                    plotJobs[id](); // Plot ausführen
                    observer.unobserve(entry.target); // Nur einmal plotten
                }
            }
        });
    }, { 
        rootMargin: '100px', // Plot startet schon 100px bevor er ins Bild kommt -> flüssiger für den User
        threshold: 0.01 
    });

    // Alle Container überwachen
    Object.keys(plotJobs).forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
}

// Startet sofort, aber der Observer wartet auf das Sichtfeld
window.addEventListener('load', renderELI5Math);
