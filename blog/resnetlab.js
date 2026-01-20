const ResNetLab = {
    compare: function() {
        const depthInput = document.getElementById('net-depth');
        if(!depthInput) return; // Safety check

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

            // Plain: Gradient dies due to chain rule (0.90^depth)
            gPlain *= 0.90; 
            
            // ResNet: Gradient has a "highway" (Addition in backprop)
            // d(F(x)+x)/dx = dF/dx + 1  <-- The "1" preserves the gradient
            gRes = (gRes * 0.90) + 0.09; 
            if(gRes > 1.0) gRes = 1.0;
        }

        this.plot(labels, plainGradients, resGradients);
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
