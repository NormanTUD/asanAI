const FittingLab = {
    // ── Configuration ──────────────────────────────────────────
    trainRange: [0, 6],
    viewRange:  [-4, 10],
    numPoints:  40,
    numTestPoints: 25,
    noiseStdDev: 0.15,
    lambda: 0.0,                // L2 regularisation strength
    isTraining: false,
    model: null,
    epochCount: 0,
    data: { xTrain: [], yTrain: [], xTest: [], yTest: [], xTrue: [], yTrue: [] },

    // ── Bootstrap ──────────────────────────────────────────────
    init: function () {
        this.generateData();
        this.setupListeners();
        this.updateModelAndPlot();
    },

    // ── UI Wiring ──────────────────────────────────────────────
    setupListeners: function () {
        const rebuild = () => {
            this.epochCount = 0;
            this.updateEpochDisplay();
            this.generateData();
            if (this.isTraining) this.trainLoop();
            else this.updateModelAndPlot();
        };

        // Degree slider
        document.getElementById('slider-degree').oninput = (e) => {
            document.getElementById('label-degree').innerText = e.target.value;
            rebuild();
        };

        // Noise slider
        const noiseSlider = document.getElementById('slider-noise');
        if (noiseSlider) {
            noiseSlider.oninput = (e) => {
                this.noiseStdDev = parseFloat(e.target.value);
                document.getElementById('label-noise').innerText =
                    this.noiseStdDev.toFixed(2);
                rebuild();
            };
        }

        // Lambda slider (L2 regularisation)
        const lambdaSlider = document.getElementById('slider-lambda');
        if (lambdaSlider) {
            lambdaSlider.oninput = (e) => {
                this.lambda = parseFloat(e.target.value);
                document.getElementById('label-lambda').innerText =
                    this.lambda.toFixed(3);
                // Rebuild model with new lambda (recompile needed)
                this.epochCount = 0;
                this.updateEpochDisplay();
                if (this.isTraining) this.trainLoop();
                else this.updateModelAndPlot();
            };
        }

        // Train / Stop button
        const btn = document.getElementById('btn-toggle-train');
        btn.onclick = () => {
            this.isTraining = !this.isTraining;
            btn.innerText      = this.isTraining ? '🛑 Stop Training' : '🚀 Start Training';
            btn.style.background = this.isTraining ? '#ef4444' : '#22c55e';
            if (this.isTraining) this.trainLoop();
        };

        // Reset button
        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.onclick = () => {
                this.isTraining = false;
                btn.innerText      = '🚀 Start Training';
                btn.style.background = '#22c55e';
                this.epochCount = 0;
                this.updateEpochDisplay();
                rebuild();
            };
        }
    },

    // ── Data Generation ────────────────────────────────────────
    generateData: function () {
        this.data = { xTrain: [], yTrain: [], xTest: [], yTest: [], xTrue: [], yTrue: [] };

        // Dense ground-truth curve across the full view
        for (let x = this.viewRange[0]; x <= this.viewRange[1]; x += 0.1) {
            this.data.xTrue.push(x);
            this.data.yTrue.push(Math.sin(x));
        }

        // Noisy training samples inside the training window
        for (let i = 0; i < this.numPoints; i++) {
            const x = this.trainRange[0] +
                      Math.random() * (this.trainRange[1] - this.trainRange[0]);
            const noise = this.noiseStdDev * this._randn();
            this.data.xTrain.push(x);
            this.data.yTrain.push(Math.sin(x) + noise);
        }

        // Held-out test samples inside the training window (never used for training)
        for (let i = 0; i < this.numTestPoints; i++) {
            const x = this.trainRange[0] +
                      Math.random() * (this.trainRange[1] - this.trainRange[0]);
            const noise = this.noiseStdDev * this._randn();
            this.data.xTest.push(x);
            this.data.yTest.push(Math.sin(x) + noise);
        }
    },

    /** Box–Muller transform for Gaussian noise */
    _randn: function () {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    },

    // ── Feature Expansion ──────────────────────────────────────
    expand: function (t, degree) {
        return tf.tidy(() => {
            let cols = [t];
            for (let i = 2; i <= degree; i++) {
                cols.push(t.pow(tf.scalar(i)));
            }
            return tf.concat(cols, 1);
        });
    },

    // ── Custom L2 Loss ─────────────────────────────────────────
    _makeL2Loss: function () {
        const self = this;
        return (yTrue, yPred) => {
            const mse = tf.losses.meanSquaredError(yTrue, yPred);
            if (self.lambda <= 0) return mse;
            // Sum of squared weights
            const kernel = self.model.layers[0].getWeights()[0];
            const l2     = kernel.square().sum().mul(tf.scalar(self.lambda));
            return mse.add(l2);
        };
    },

    // ── Model (Re-)Initialisation + First Plot ────────────────
    updateModelAndPlot: async function () {
        const degree = parseInt(document.getElementById('slider-degree').value);
        if (this.model) dispose(this.model);

        this.model = tf.sequential();
        this.model.add(tf.layers.dense({
            units: 1,
            inputShape: [degree],
            kernelInitializer: 'zeros',
        }));
        this.model.compile({
            optimizer: tf.train.adam(0.01),
            loss: this._makeL2Loss(),
        });

        // Compute initial losses
        this._updateLossDisplays(degree);
        this.updateEquation(degree);
        await this.visualize();
    },

    // ── Loss Display Helper ────────────────────────────────────
    _updateLossDisplays: function (degree) {
        tf.tidy(() => {
            // Training loss
            const xt      = tensor2d(this.data.xTrain, [this.data.xTrain.length, 1]);
            const yt      = tensor2d(this.data.yTrain, [this.data.yTrain.length, 1]);
            const inputs  = this.expand(xt, degree);
            const preds   = this.model.predict(inputs);
            const mseTr   = tf.losses.meanSquaredError(yt, preds);
            document.getElementById('loss-train').innerText =
                mseTr.dataSync()[0].toFixed(6);

            // Test loss (pure MSE, no regularisation penalty)
            const xte     = tensor2d(this.data.xTest, [this.data.xTest.length, 1]);
            const yte     = tensor2d(this.data.yTest, [this.data.yTest.length, 1]);
            const tInputs = this.expand(xte, degree);
            const tPreds  = this.model.predict(tInputs);
            const mseTe   = tf.losses.meanSquaredError(yte, tPreds);
            document.getElementById('loss-test').innerText =
                mseTe.dataSync()[0].toFixed(6);
        });
    },

    // ── Training Loop ──────────────────────────────────────────
    trainLoop: async function () {
        if (!this.isTraining) return;

        const degree = parseInt(document.getElementById('slider-degree').value);

        // Rebuild model if lambda changed (need fresh compile)
        if (this.epochCount === 0) {
            await this.updateModelAndPlot();
        }

        const xt     = tensor2d(this.data.xTrain, [this.data.xTrain.length, 1]);
        const yt     = tensor2d(this.data.yTrain, [this.data.yTrain.length, 1]);
        const inputs = this.expand(xt, degree);

        const BATCH_EPOCHS = 15;

        while (this.isTraining) {
            await this.model.fit(inputs, yt, {
                epochs: BATCH_EPOCHS,
                verbose: 0,
            });
            this.epochCount += BATCH_EPOCHS;
            this.updateEpochDisplay();

            this._updateLossDisplays(degree);
            this.updateEquation(degree);
            await this.visualize();
            await tf.nextFrame();
        }

        dispose(xt, yt, inputs);
    },

    // ── Visualisation ──────────────────────────────────────────
    visualize: async function () {
        const degree = parseInt(document.getElementById('slider-degree').value);
        const xT     = tensor2d(this.data.xTrue, [this.data.xTrue.length, 1]);
        const feats  = this.expand(xT, degree);
        const yPred  = this.model.predict(feats).dataSync();
        this.renderPlot(Array.from(yPred));
        dispose(xT, feats);
    },

    // ── Equation Monitor ───────────────────────────────────────
    updateEquation: function (degree) {
        const weights = this.model.layers[0].getWeights()[0].dataSync();
        const bias    = this.model.layers[0].getWeights()[1].dataSync()[0];

        let terms = [];
        for (let i = degree - 1; i >= 0; i--) {
            const w = weights[i].toFixed(3);
            const power = i + 1;
            const exponent = power === 1 ? 'x' : `x^{${power}}`;
            terms.push(`${w}${exponent}`);
        }

        let eq =
            `\\text{Model: }\\; f(x) = ` +
            (terms.length ? terms.join(' + ') : '0') +
            ` + ${bias.toFixed(3)}`;

        // Clean up double-signs like "+ -"
        eq = eq.replace(/\+ -/g, '- ');

        const container = document.getElementById('equation-monitor');
        container.innerHTML = `$$ ${eq} $$`;
        if (window.refreshMath) refreshMath('#equation-monitor');
    },

    // ── Epoch Counter ──────────────────────────────────────────
    updateEpochDisplay: function () {
        const el = document.getElementById('epoch-count');
        if (el) el.innerText = this.epochCount;
    },

    // ── Plotly Rendering ───────────────────────────────────────
    renderPlot: function (yPred) {
        const traces = [
            // Training data scatter
            {
                x: this.data.xTrain,
                y: this.data.yTrain,
                mode: 'markers',
                name: 'Training Data (Noisy)',
                marker: { color: '#1e293b', size: 5, opacity: 0.7 },
            },
            // Test data scatter (held-out, never trained on)
            {
                x: this.data.xTest,
                y: this.data.yTest,
                mode: 'markers',
                name: 'Test Data (Held Out)',
                marker: { color: '#22c55e', size: 6, opacity: 0.6, symbol: 'diamond' },
            },
            // Ground truth
            {
                x: this.data.xTrue,
                y: this.data.yTrue,
                mode: 'lines',
                name: 'True Function  y = sin(x)',
                line: { dash: 'dot', color: '#94a3b8', width: 2 },
            },
            // Model prediction
            {
                x: this.data.xTrue,
                y: yPred,
                mode: 'lines',
                name: 'AI Approximation',
                line: { color: '#ef4444', width: 3 },
            },
        ];

        const layout = {
            shapes: [
                {
                    type: 'rect', xref: 'x', yref: 'paper',
                    x0: this.trainRange[0], x1: this.trainRange[1],
                    y0: 0, y1: 1,
                    fillcolor: '#3b82f6', opacity: 0.07,
                    line: { width: 0 },
                },
            ],
            xaxis: {
                range: this.viewRange,
                title: 'x  —  the shaded region is the training window',
                gridcolor: '#f1f5f9',
            },
            yaxis: {
                range: [-2.5, 2.5],
                title: 'y',
                gridcolor: '#f1f5f9',
            },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff',
            margin: { t: 20, b: 55, l: 55, r: 20 },
            legend: { orientation: 'h', y: -0.22 },
        };

        Plotly.react('fitting-plot', traces, layout, { responsive: true });
    },
};

// ============================================================
//  LAZY LOADING FOR OVER- AND UNDERFITTING MODULE
// ============================================================

const _oufLazyRegistry = [];
let   _oufLazyObserver  = null;

function _oufLazyRegister(elementId, initFn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    _oufLazyRegistry.push({ el, initFn, initialized: false });
}

function _oufLazyCreateObserver() {
    if (_oufLazyObserver) return;

    _oufLazyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const match = _oufLazyRegistry.find((r) => r.el === entry.target);
                if (match && !match.initialized) {
                    match.initialized = true;
                    _oufLazyObserver.unobserve(match.el);
                    match.initFn();
                }
            });
        },
        { rootMargin: rootMargin },
    );

    _oufLazyRegistry.forEach((r) => {
        if (!r.initialized) _oufLazyObserver.observe(r.el);
    });
}

// ============================================================
//  PUBLIC ENTRY POINT
// ============================================================

async function loadOverAndUnderFittingModule() {
    _oufLazyRegister('fitting-plot', () => FittingLab.init());
    _oufLazyCreateObserver();
    return Promise.resolve();
}
