const ResNetLab = {
    compare: function() {
        const depthInput = document.getElementById('net-depth');
        if(!depthInput) return; // Sicherheits-Check

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

            // Plain: Gradient stirbt durch Kettenregel (0.85^depth)
            gPlain *= 0.90; 
            
            // ResNet: Gradient hat einen "Highway" (Addition im Backprop)
            // d(F(x)+x)/dx = dF/dx + 1  <-- Die 1 rettet den Gradienten
            gRes = (gRes * 0.90) + 0.09; 
            if(gRes > 1.0) gRes = 1.0;
        }

        this.plot(labels, plainGradients, resGradients);
    },

    plot: function(labels, plain, res) {
        const trace1 = {
            x: labels, y: plain, name: 'Normales Netz (Plain)',
            type: 'scatter', fill: 'tozeroy', line: {color: '#ef4444'}
        };
        const trace2 = {
            x: labels, y: res, name: 'ResNet (Skip Connection)',
            type: 'scatter', fill: 'tozeroy', line: {color: '#3b82f6'}
        };

        const layout = {
            margin: {t:30, b:40, l:50, r:20},
            yaxis: {title: 'Gradient Magnitude', range: [0, 1.1]},
            xaxis: {title: 'Tiefe des Netzwerks'},
            legend: {orientation: 'h', y: 1.1}
        };

        Plotly.newPlot('gradient-plot', [trace1, trace2], layout);
    }
};
