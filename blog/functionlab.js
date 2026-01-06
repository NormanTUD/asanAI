function renderELI5Math() {
    const range = [];
    for (let i = -10; i <= 10; i++) range.push(i);

    const layoutBase = {
        margin: { t: 10, b: 30, l: 30, r: 10 },
        xaxis: { fixedrange: true, zeroline: true },
        yaxis: { fixedrange: true, zeroline: true },
        showlegend: false
    };

    // Plot 1: Standard
    Plotly.newPlot('plot-step-1', [{
        x: range, y: range, mode: 'lines', line: {color: '#3b82f6', width: 4}
    }], layoutBase);

    // Plot 2: Flip (-x)
    Plotly.newPlot('plot-step-2', [{
        x: range, y: range.map(x => -x), mode: 'lines', line: {color: '#ef4444', width: 4}
    }], layoutBase);

    // Plot 3: Steep (3x)
    Plotly.newPlot('plot-step-3', [{
        x: range, y: range.map(x => 3 * x), mode: 'lines', line: {color: '#10b981', width: 4}
    }], layoutBase);

    // Plot 4: 3D Plane (x + y)
    const zData = range.map(x => range.map(y => x + y));
    Plotly.newPlot('plot-step-4', [{
        z: zData, x: range, y: range, type: 'surface', colorscale: 'Blues', showscale: false
    }], {
        margin: { t: 0, b: 0, l: 0, r: 0 },
        scene: { camera: { eye: { x: 1.5, y: 1.5, z: 1 } } }
    });
}

window.addEventListener('load', renderELI5Math);
