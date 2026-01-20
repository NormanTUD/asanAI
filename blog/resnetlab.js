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

            // Plain: Gradient dies due to chain rule
            gPlain *= 0.90; 
            
            // ResNet: d(F(x)+x)/dx = dF/dx + 1 (The "1" preserves the gradient)
            gRes = (gRes * 0.90) + 0.09; 
            if(gRes > 1.0) gRes = 1.0;
        }

        this.plot(labels, plainGradients, resGradients);
        this.drawArchitecture(depth);
        this.generateCode(depth);
    },

    drawArchitecture: function(depth) {
        const container = document.getElementById('network-viz');
        if(!container) return;

        const width = container.clientWidth || 600;
        const height = 100;
        const displayDepth = Math.min(depth, 12); 
        const spacing = (width - 60) / displayDepth;

        let svg = `<svg width="100%" height="${height}" style="overflow:visible">`;
        
        for(let i = 0; i <= displayDepth; i++) {
            const x = 30 + (i * spacing);
            const y = height / 2;

            // Shortcut Arc (every 2 layers)
            if (i > 0 && i % 2 === 0) {
                const prevX = 30 + ((i-2) * spacing);
                svg += `<path d="M ${prevX} ${y} Q ${(prevX+x)/2} ${y-50} ${x} ${y}" 
                        fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4" />`;
            }

            // Main path line
            if (i < displayDepth) {
                svg += `<line x1="${x}" y1="${y}" x2="${x + spacing}" y2="${y}" stroke="#94a3b8" stroke-width="2" />`;
            }

            svg += `<circle cx="${x}" cy="${y}" r="5" fill="${i === 0 ? '#22c55e' : '#64748b'}" />`;
        }
        svg += `</svg>`;
        container.innerHTML = svg;
    },

    generateCode: function(depth) {
        const codeElement = document.getElementById('code-display');
        if(!codeElement) return;

        codeElement.textContent = `// TF.js Residual Block for ${depth} layers
function residualBlock(input) {
  const shortcut = input; // Identity
  
  // F(x) path
  let x = tf.layers.conv2d({
    filters: 64, kernelSize: 3, padding: 'same', activation: 'relu'
  }).apply(input);

  x = tf.layers.conv2d({
    filters: 64, kernelSize: 3, padding: 'same'
  }).apply(x);

  // Add back the identity: F(x) + x
  // Shapes must match: [batch, h, w, 64]
  x = tf.layers.add().apply([x, shortcut]); 
  return tf.layers.relu().apply(x);
}`;
        // Re-run Prism highlighting if available
        if (window.Prism) Prism.highlightElement(codeElement);
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
            margin: {t:10, b:40, l:50, r:20},
            yaxis: {title: 'Gradient', range: [0, 1.1]},
            xaxis: {title: 'Layers'},
            legend: {orientation: 'h', y: -0.2}
        };

        Plotly.newPlot('gradient-plot', [trace1, trace2], layout);
    }
};

window.addEventListener('load', () => {
	if(typeof ResNetLab !== 'undefined') ResNetLab.compare();
});
