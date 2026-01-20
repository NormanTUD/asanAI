const ResNetLab = {
    compare: function() {
        const depthInput = document.getElementById('net-depth');
        if(!depthInput) return; 

        const depth = parseInt(depthInput.value);
        let plainGradients = [];
        let resGradients = [];
        let labels = [];

        let gPlain = 1.0;
        let gRes = 1.0;

        for(let i = 0; i <= depth; i++) {
            labels.push(`L${i}`);
            plainGradients.push(gPlain);
            resGradients.push(gRes);

            // Plain Network: Gradient vanishes exponentially
            gPlain *= 0.88; 
            
            // ResNet: Gradient is preserved by the "1" in the derivative: d(F+x)/dx = dF/dx + 1
            // Even if weights (dF/dx) are small, the identity path maintains flow.
            gRes = (gRes * 0.88) + 0.11; 
            if(gRes > 1.0) gRes = 1.0;
        }

        // Use ResNetLab instead of 'this' to avoid binding errors
        ResNetLab.plot(labels, plainGradients, resGradients);
        ResNetLab.drawArchitecture(depth);
    },

    drawArchitecture: function(depth) {
        const container = document.getElementById('network-viz');
        if(!container) return;

        const width = container.clientWidth || 600;
        const height = 120;
        const displayDepth = Math.min(depth, 10); 
        const spacing = (width - 80) / displayDepth;

        let svg = `<svg width="100%" height="${height}" style="overflow:visible">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                </marker>
            </defs>`;
        
        for(let i = 0; i <= displayDepth; i++) {
            const x = 40 + (i * spacing);
            const y = 80;

            // Shortcut Arcs (every 2 layers)
            if (i > 0 && i % 2 === 0) {
                const prevX = 40 + ((i-2) * spacing);
                // Abstract logic: Layer 4 simulates a filter expansion (Projection)
                const isProjection = (i === 4); 
                const strokeColor = isProjection ? "#f59e0b" : "#3b82f6";
                const label = isProjection ? "W_s (1x1 Conv)" : "Identity (x)";

                svg += `<path d="M ${prevX} ${y-10} Q ${(prevX+x)/2} ${y-70} ${x} ${y-15}" 
                        fill="none" stroke="${strokeColor}" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrow)" />`;
                
                svg += `<text x="${(prevX+x)/2}" y="${y-55}" font-size="10" text-anchor="middle" fill="${strokeColor}" font-weight="bold">${label}</text>`;
            }

            // Main path line
            if (i < displayDepth) {
                svg += `<line x1="${x}" y1="${y}" x2="${x + spacing}" y2="${y}" stroke="#94a3b8" stroke-width="2" />`;
            }

            // Nodes: different colors for start, hidden, and addition points
            let nodeColor = '#64748b';
            if (i === 0) nodeColor = '#22c55e';
            if (i > 0 && i % 2 === 0) nodeColor = '#1e293b';

            svg += `<circle cx="${x}" cy="${y}" r="6" fill="${nodeColor}" />`;
        }
        svg += `</svg>`;
        container.innerHTML = svg;
    },

    plot: function(labels, plain, res) {
        const trace1 = {
            x: labels, y: plain, name: 'Plain (Multiplicative)',
            type: 'scatter', fill: 'tozeroy', line: {color: '#ef4444', width: 3}
        };
        const trace2 = {
            x: labels, y: res, name: 'ResNet (Additive)',
            type: 'scatter', fill: 'tozeroy', line: {color: '#3b82f6', width: 3}
        };

        const layout = {
            margin: {t:10, b:40, l:50, r:20},
            yaxis: {title: 'Gradient Strength', range: [0, 1.1], gridcolor: '#f1f5f9'},
            xaxis: {title: 'Network Depth (Layers)', gridcolor: '#f1f5f9'},
            legend: {orientation: 'h', y: -0.2},
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };

        Plotly.newPlot('gradient-plot', [trace1, trace2], layout);
    }
};

window.addEventListener('load', () => {
    ResNetLab.compare();
});
