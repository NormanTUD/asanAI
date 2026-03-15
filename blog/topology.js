"use strict";

function initTopologyVisualization() {
    const warpSlider = document.getElementById('topo-warp');
    const plotId = 'topology-plot';
    
    function render() {
        const warp = parseFloat(warpSlider.value);
        
        const xSize = 40; // Increased resolution for a smoother surface
        const ySize = 40;
        let zValues = [];
        let xValues = [];
        let yValues = [];

        // Pre-fill X and Y axes
        for (let i = 0; i < xSize; i++) xValues.push(i - 20);
        for (let j = 0; j < ySize; j++) yValues.push(j - 20);

        // Generate the 2D grid for Z (the manifold surface)
        for (let i = 0; i < xSize; i++) {
            let row = [];
            for (let j = 0; j < ySize; j++) {
                let x = i - 20;
                let y = j - 20;
                
                // A wave-like function representing a manifold deformation
                // Using sin(r)/r pattern for a "ripple" topology
                let r = Math.sqrt(x*x + y*y);
                let z = Math.sin(r * warp); 
                
                row.push(z);
            }
            zValues.push(row);
        }

        const data = [{
            z: zValues,
            x: xValues,
            y: yValues,
            type: 'surface',
            colorscale: 'Viridis',
            showscale: false,
            contours: {
                z: { show: true, usecolormap: true, project: { z: true } }
            }
        }];

        const layout = {
            title: 'Topological Manifold (LLM Latent Space)',
            scene: {
                camera: { eye: { x: 1.8, y: 1.8, z: 1.2 } },
                xaxis: { title: 'Feature A', showgrid: true },
                yaxis: { title: 'Feature B', showgrid: true },
                zaxis: { title: 'Activation', range: [-1.5, 1.5] }
            },
            margin: { t: 50, b: 0, l: 0, r: 0 }
        };

        // If lazyRender exists from math.js, use it; otherwise fallback to Plotly directly
        if (typeof lazyRender === 'function') {
            lazyRender(plotId, () => Plotly.react(plotId, data, layout));
        } else {
            Plotly.react(plotId, data, layout);
        }
    }

    if (warpSlider) {
        warpSlider.addEventListener('input', render);
        render();
    }
}

// Infrastructure to hook into your existing math.js observer
async function loadTopologyModule() {
    if (typeof observePlot === 'function') {
        observePlot('topology-plot');
    }
    initTopologyVisualization();
}
