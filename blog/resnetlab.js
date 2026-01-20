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
            labels.push(`Layer ${i}`);
            plainGradients.push(gPlain);
            resGradients.push(gRes);

            gPlain *= 0.90; 
            gRes = (gRes * 0.90) + 0.09; 
            if(gRes > 1.0) gRes = 1.0;
        }

        this.plot(labels, plainGradients, resGradients);
        this.drawArchitecture(depth); // New visual call
    },

    drawArchitecture: function(depth) {
        const container = document.getElementById('network-viz');
        if(!container) return;

        const width = container.clientWidth;
        const height = 120;
        const padding = 40;
        // Limit visualized layers for UI clarity if depth is huge
        const displayDepth = Math.min(depth, 15); 
        const spacing = (width - (padding * 2)) / displayDepth;

        let svgHtml = `<svg width="100%" height="${height}">`;

        // Define Marker for arrows
        svgHtml += `<defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"/></marker></defs>`;

        for(let i = 0; i <= displayDepth; i++) {
            const x = padding + (i * spacing);
            const y = height / 2;

            // Draw Skip Connection (The Highway)
            if (i > 0 && i % 2 === 0) {
                const prevX = padding + ((i-2) * spacing);
                const arcPath = `M ${prevX} ${y} Q ${(prevX+x)/2} ${y-60} ${x} ${y}`;
                svgHtml += `<path d="${arcPath}" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4" />`;
                svgHtml += `<text x="${(prevX+x)/2}" y="${y-35}" fill="#3b82f6" font-size="10" text-anchor="middle">Identity Shortcut</text>`;
            }

            // Draw Main Path Connection
            if (i < displayDepth) {
                svgHtml += `<line x1="${x}" y1="${y}" x2="${x + spacing}" y2="${y}" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)" />`;
            }

            // Draw Layer Node
            const color = i === 0 ? '#22c55e' : (i === displayDepth ? '#ef4444' : '#64748b');
            svgHtml += `<circle cx="${x}" cy="${y}" r="6" fill="${color}" />`;
            if (depth <= 20) {
                svgHtml += `<text x="${x}" y="${y + 20}" font-size="10" text-anchor="middle" fill="#64748b">L${i}</text>`;
            }
        }

        if (depth > 15) {
            svgHtml += `<text x="${width-10}" y="${height/2}" fill="#94a3b8" font-size="12">...</text>`;
        }

        svgHtml += `</svg>`;
        container.innerHTML = svgHtml;
    },

    plot: function(labels, plain, res) {
        const trace1 = {
            x: labels, y: plain, name: 'Plain Network',
            type: 'scatter', fill: 'tozeroy', line: {color: '#ef4444'}
        };
        const trace2 = {
            x: labels, y: res, name: 'ResNet (Skip Connection)',
            type: 'scatter', fill: 'tozeroy', line: {color: '#3b82f6'}
        };

        const layout = {
            margin: {t:30, b:40, l:50, r:20},
            yaxis: {title: 'Gradient Magnitude', range: [0, 1.1]},
            xaxis: {title: 'Network Depth'},
            legend: {orientation: 'h', y: 1.1}
        };

        Plotly.newPlot('gradient-plot', [trace1, trace2], layout);
    }
};
