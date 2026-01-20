/**
 * MinimalLab - Self-contained namespace for the Minimal Neuron Lab
 * This prevents conflicts with DeepLab or other scripts on the same page.
 */
const MinimalLab = {
    config: {
        id: 'lin', // Matching the ID used in minimalneuron.php
        inputs: ["x"],
        outputs: ["y"],
        layers: [], // Empty for a single minimal neuron (linear/dense)
        data: [[1, 2], [2, 4], [3, 6]],
        model: null,
        loss: [],
        isTraining: false,
        totalEpochs: 0
    },

    init: function(resetLoss = true) {
        const c = this.config;
        if (resetLoss) {
            c.loss = [];
            c.totalEpochs = 0;
            const btn = document.getElementById(`btn-lin-train`);
            if (btn) btn.innerText = "🚀 Training Starten";
        }

        if (c.model) c.model.dispose();

        // Build a minimal 1-node model
        c.model = tf.sequential();
        c.model.add(tf.layers.dense({ 
            units: 1, 
            inputShape: [1], 
            activation: null // Linear activation for simple regression
        }));

        const lrEl = document.getElementById('lin-lr');
        const lr = lrEl ? parseFloat(lrEl.value) : 0.001;

        c.model.compile({ 
            optimizer: tf.train.sgd(lr), 
            loss: 'meanSquaredError' 
        });

        this.updateVisuals(true);
    },

    toggleTraining: async function() {
        const c = this.config;
        if (c.isTraining) {
            c.isTraining = false;
            return;
        }

        c.isTraining = true;
        const btn = document.getElementById(`btn-lin-train`);
        if (btn) {
            btn.className = "btn btn-stop";
            btn.innerText = "🛑 Stoppen";
        }

        const xs = tf.tensor2d(c.data.map(r => [r[0]]));
        const ys = tf.tensor2d(c.data.map(r => [r[1]]));
        const epochs = parseInt(document.getElementById('lin-epochs')?.value) || 100;

        for (let i = 0; i < epochs && c.isTraining; i++) {
            const h = await c.model.fit(xs, ys, { epochs: 1, verbose: 0 });
            c.loss.push(h.history.loss[0]);
            c.totalEpochs++;

            if (i % 5 === 0 || i === epochs - 1) {
                this.updateVisuals();
                const cons = document.getElementById('lin-console');
                if (cons) cons.innerText = `[Epoch ${c.totalEpochs}] Loss: ${h.history.loss[0].toFixed(6)}`;
            }
            await tf.nextFrame();
        }

        c.isTraining = false;
        if (btn) {
            btn.className = "btn btn-train";
            btn.innerText = "🚀 Training Fortsetzen";
        }
        xs.dispose();
        ys.dispose();
    },

    updateVisuals: function(force = false) {
        const c = this.config;
        
        // 1. Loss Chart
        const lossChart = document.getElementById('lin-loss-chart');
        if (lossChart && typeof Plotly !== 'undefined') {
            const layout = { 
                margin: {t:30, b:30, l:40, r:10}, 
                title: 'Loss History', 
                yaxis: {type: 'log'}, 
                autosize: true 
            };
            Plotly.react('lin-loss-chart', [{ 
                x: c.loss.map((_, i) => i), 
                y: c.loss, 
                type: 'scatter', 
                line: {color: '#ef4444'} 
            }], layout);
        }

        // 2. Data/Regression Chart
        const dataChart = document.getElementById('lin-data-chart');
        if (dataChart && typeof Plotly !== 'undefined') {
            const xData = c.data.map(r => r[0]);
            const yData = c.data.map(r => r[1]);
            
            // Generate prediction line
            const testX = [];
            for(let i=0; i<=7; i+=0.5) testX.push(i);
            const predY = c.model.predict(tf.tensor2d(testX, [testX.length, 1])).dataSync();

            Plotly.react('lin-data-chart', [
                {x: xData, y: yData, mode: 'markers', name: 'Ist'},
                {x: testX, y: Array.from(predY), mode: 'lines', name: 'Modell'}
            ], { margin: {t:30, b:30, l:30, r:10}, title: 'Lineare Regression' });
        }

        // 3. Math Monitor (Formula Display)
        const mon = document.getElementById('lin-math-monitor');
        if (mon) {
            const weights = c.model.layers[0].getWeights();
            const w = weights[0].dataSync()[0].toFixed(2);
            const b = weights[1].dataSync()[0].toFixed(2);
            mon.innerHTML = `<div style="text-align:center; font-size:1.2em;">
                $ y = ${w} \\cdot x + ${b} $
            </div>`;
            if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([mon]);
        }
    }
};

// Global entry point to prevent "function not found" errors in PHP
window.toggleTraining = (id) => {
    if (id === 'lin') MinimalLab.toggleTraining();
};

window.initBlock = (id) => {
    if (id === 'lin') MinimalLab.init();
};

window.train_onload = () => {
    MinimalLab.init();
};

// Auto-initialize when script loads
window.addEventListener('load', () => {
    if (document.getElementById('lin-loss-chart')) {
        MinimalLab.init();
    }
});
