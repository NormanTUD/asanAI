function renderAllFunctionLevels() {
    const range = [];
    for (let i = -10; i <= 10; i++) range.push(i / 2);

    // 1. Linear Plot
    const zLinear = range.map(x => range.map(y => x + 1));
    createStaticSurface('plot-linear', range, zLinear, 'Blues');

    // 2. Square (Bowl) Plot
    const zSquare = range.map(x => range.map(y => (x*x + y*y) * 0.1));
    createStaticSurface('plot-square', range, zSquare, 'Viridis');

    // 3. Tensor Logic Plot
    // We plot the "Magnitude" or sum of the resulting vector [a+5, b+a-6]
    const zTensor = range.map(x => range.map(y => ((x + 5) + (y + x - 6)) * 0.5));
    createStaticSurface('plot-tensor', range, zTensor, 'Plasma');
}

function createStaticSurface(divId, range, zData, colorscale) {
    const data = [{
        z: zData,
        x: range,
        y: range,
        type: 'surface',
        colorscale: colorscale,
        showscale: false,
        contours: {
            z: { show: true, usecolormap: true, project: { z: true } }
        }
    }];

    const layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 },
        autosize: true,
        scene: {
            xaxis: { visible: false },
            yaxis: { visible: false },
            zaxis: { title: 'Result' },
            camera: { eye: { x: 1.5, y: 1.5, z: 1.1 } }
        }
    };

    Plotly.newPlot(divId, data, layout, {responsive: true});
}

// In window.onload integrieren
window.addEventListener('load', renderAllFunctionLevels);
