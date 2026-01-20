/**
 * MinimalLab - Self-contained namespace for the Minimal Neuron Lab
 */
const MinimalLab = {
    config: {
        id: 'lin',
        inputs: ["x"],
        outputs: ["y"],
        layers: [], 
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
            if (btn) btn.innerText = "🚀 Start Training";
        }

        if (c.model) c.model.dispose();

        c.model = tf.sequential();
        c.model.add(tf.layers.dense({ 
            units: 1, 
            inputShape: [1], 
            activation: null 
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
            btn.innerText = "🛑 Stop";
        }

        const xs = tf.tensor2d(c.data.map(r => [r[0]]));
        const ys = tf.tensor2d(c.data.map(r => [r[1]]));
        const epochs = parseInt(document.getElementById('lin-epochs')?.value) || 1000;

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
            btn.innerText = "🚀 Continue Training";
        }
        xs.dispose();
        ys.dispose();
    },

    updateVisuals: function(force = false) {
        const c = this.config;
        
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

        const dataChart = document.getElementById('lin-data-chart');
        if (dataChart && typeof Plotly !== 'undefined') {
            const xData = c.data.map(r => r[0]);
            const yData = c.data.map(r => r[1]);
            
            const testX = [];
            for(let i=0; i<=7; i+=0.5) testX.push(i);
            const predY = c.model.predict(tf.tensor2d(testX, [testX.length, 1])).dataSync();

            Plotly.react('lin-data-chart', [
                {x: xData, y: yData, mode: 'markers', name: 'Actual'},
                {x: testX, y: Array.from(predY), mode: 'lines', name: 'Model'}
            ], { margin: {t:30, b:30, l:30, r:10}, title: 'Linear Regression' });
        }

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

window.toggleTraining = (id) => {
    if (id === 'lin') MinimalLab.toggleTraining();
};

window.initBlock = (id) => {
    if (id === 'lin') MinimalLab.init();
};

window.train_onload = () => {
    MinimalLab.init();
};

window.addEventListener('load', () => {
    if (document.getElementById('lin-loss-chart')) {
        MinimalLab.init();
    }
});
