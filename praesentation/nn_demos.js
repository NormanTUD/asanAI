// ============================================================
// nn_demos.js – Interaktive Demos fuer die Folien
//   * NNApproxViz  : Stueckelungs-Plot ("Funktionsapproximation
//                    durch Stueckelung")
//   * NNStepDemo   : Pfeiltasten-Durchlauf durch die Stueckelung
//   * NeuronIntroViz : zwei Szenen auf "Was sind Neuronale Netzwerke?"
//   * TypewriterViz: Schreibmaschinen-Effekt auf "Klassisch vs. KI"
//
// Diese Datei enthaelt NUR Code fuer die vorhandenen Folien.
// loadIntuitionModule() wird von presentation.js beim Start gerufen.
// ============================================================

const rootMargin = "800px";

// ============================================================
// NEURAL NET APPROXIMATION VISUALIZER
// ============================================================

const NNApproxViz = {
    // Target functions
    targetFunctions: {
        sin: x => Math.sin(x * 1.5),
        quadratic: x => x * x / 4 - 0.5,
        abs: x => Math.abs(x) / 2,
        step: x => (x < -1.5 ? -0.5 : x < 0 ? 0.5 : x < 1.5 ? -0.3 : 0.7),
        custom: x => Math.sin(x * 2) * 0.5 + Math.cos(x * 3) * 0.3,
    },

    // Fit a simple Dense+ReLU+Dense network to approximate the target
    // Uses evenly-spaced "hinge points" (ReLU knees) to create piecewise linear approx
    fitNetwork: function(targetFn, numNeurons, xMin, xMax) {
        const neurons = [];
        const step = (xMax - xMin) / (numNeurons + 1);

        // Place hinge points evenly
        for (let i = 0; i < numNeurons; i++) {
            const hingeX = xMin + (i + 1) * step;
            neurons.push({ hingeX, weight: 0, bias: 0 });
        }

        // For each neuron, compute the slope change needed
        // We approximate by sampling the target and computing finite differences
        const samplePoints = 200;
        const xs = [];
        const ys = [];
        for (let i = 0; i <= samplePoints; i++) {
            const x = xMin + (xMax - xMin) * i / samplePoints;
            xs.push(x);
            ys.push(targetFn(x));
        }

        // Simple least-squares fit for piecewise linear with ReLU basis
        // Each neuron contributes: w_i * max(0, x - hingeX_i)
        // Plus a global linear term: a*x + b
        const N = numNeurons + 2; // neurons + linear + bias
        const M = xs.length;

        // Build design matrix
        const A = [];
        for (let j = 0; j < M; j++) {
            const row = [1, xs[j]]; // bias and linear
            for (let i = 0; i < numNeurons; i++) {
                row.push(Math.max(0, xs[j] - neurons[i].hingeX));
            }
            A.push(row);
        }

        // Solve via normal equations (A^T A) w = A^T y
        const ATA = Array.from({ length: N }, () => Array(N).fill(0));
        const ATy = Array(N).fill(0);

        for (let j = 0; j < M; j++) {
            for (let p = 0; p < N; p++) {
                ATy[p] += A[j][p] * ys[j];
                for (let q = 0; q < N; q++) {
                    ATA[p][q] += A[j][p] * A[j][q];
                }
            }
        }

        // Add small regularization
        for (let p = 0; p < N; p++) ATA[p][p] += 1e-6;

        // Gaussian elimination
        const weights = this.solveLinearSystem(ATA, ATy, N);

        return {
            bias: weights[0],
            linearWeight: weights[1],
            neurons: neurons.map((n, i) => ({
                hingeX: n.hingeX,
                weight: weights[i + 2]
            })),
            evaluate: function(x) {
                let y = weights[0] + weights[1] * x;
                for (let i = 0; i < numNeurons; i++) {
                    y += weights[i + 2] * Math.max(0, x - neurons[i].hingeX);
                }
                return y;
            }
        };
    },

    solveLinearSystem: function(A, b, n) {
        // Gaussian elimination with partial pivoting
        const aug = A.map((row, i) => [...row, b[i]]);

        for (let col = 0; col < n; col++) {
            // Pivot
            let maxRow = col;
            for (let row = col + 1; row < n; row++) {
                if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
            }
            [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

            if (Math.abs(aug[col][col]) < 1e-12) continue;

            for (let row = col + 1; row < n; row++) {
                const factor = aug[row][col] / aug[col][col];
                for (let j = col; j <= n; j++) {
                    aug[row][j] -= factor * aug[col][j];
                }
            }
        }

        // Back substitution
        const x = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            if (Math.abs(aug[i][i]) < 1e-12) continue;
            x[i] = aug[i][n];
            for (let j = i + 1; j < n; j++) {
                x[i] -= aug[i][j] * x[j];
            }
            x[i] /= aug[i][i];
        }
        return x;
    },

    render: function() {
        const plotDiv = document.getElementById('nn-approx-plot');
        if (!plotDiv) return;

        const fnSelect = document.getElementById('nn-target-fn');
        const neuronSlider = document.getElementById('nn-num-neurons');
        const fnKey = fnSelect ? fnSelect.value : 'sin';
        const numNeurons = neuronSlider ? parseInt(neuronSlider.value) : 4;

        // Update label
        const countLabel = document.getElementById('nn-neuron-count');
        if (countLabel) countLabel.textContent = numNeurons;

        const targetFn = this.targetFunctions[fnKey];
        const xMin = -3, xMax = 3;

        // Fit network
        const network = this.fitNetwork(targetFn, numNeurons, xMin, xMax);

        // Generate plot data
        const xs = [];
        const ysTarget = [];
        const ysApprox = [];
        for (let i = 0; i <= 300; i++) {
            const x = xMin + (xMax - xMin) * i / 300;
            xs.push(x);
            ysTarget.push(targetFn(x));
            ysApprox.push(network.evaluate(x));
        }

        // Hinge points
        const hingeXs = network.neurons.map(n => n.hingeX);
        const hingeYs = hingeXs.map(x => network.evaluate(x));

        const traces = [
            {
                x: xs, y: ysTarget,
                mode: 'lines',
                name: 'Zielfunktion',
                line: { color: '#94a3b8', width: 3, dash: 'dot' }
            },
            {
                x: xs, y: ysApprox,
                mode: 'lines',
                name: `Approximation (${numNeurons} Neuronen)`,
                line: { color: '#6366f1', width: 3 }
            },
            {
                x: hingeXs, y: hingeYs,
                mode: 'markers',
                name: 'ReLU-Knickpunkte',
                marker: { size: 10, color: '#ef4444', symbol: 'diamond', line: { width: 1, color: '#fff' } }
            }
        ];

        const layout = {
            margin: { l: 50, r: 30, b: 50, t: 20 },
            xaxis: { title: 'x', gridcolor: '#f1f5f9', zeroline: true, zerolinecolor: '#e2e8f0' },
            yaxis: { title: 'f(x)', gridcolor: '#f1f5f9', zeroline: true, zerolinecolor: '#e2e8f0' },
            showlegend: true,
            legend: { x: 0, y: 1, bgcolor: 'rgba(255,255,255,0.9)', font: { size: 11 } },
            plot_bgcolor: '#fff'
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });
    }
};

// ============================================================
// INITIALIZATION FOR NN DEMOS (add to lazy loading)
// ============================================================

function initNNDemos() {
    // NN Approximation Demo
    const nnTargetFn = document.getElementById('nn-target-fn');
    const nnNeuronSlider = document.getElementById('nn-num-neurons');

    if (nnTargetFn) {
        nnTargetFn.addEventListener('change', () => NNApproxViz.render());
    }
    if (nnNeuronSlider) {
        nnNeuronSlider.addEventListener('input', () => NNApproxViz.render());
    }
}
// ============================================================
// NN STEP DEMO – Pfeiltasten-gesteuertes Durchlaufen der Stückelungs-Folie
// ============================================================

const NNStepDemo = (() => {
    // Schritte: 1,2,4,6,8,10,20 Neuronen für sin(x).
    // (Die Zielfunktions-Auswahl wurde aus der Folie entfernt — nur sin(x)
    // wird durchgespielt. Nach dem letzten Schritt (20 Neuronen) geht die
    // Pfeiltaste zur nächsten Folie über.)
    const sinSteps = [1, 2, 4, 6, 8, 10, 20];
    let currentStep = 0;

    const sinEnd = sinSteps.length - 1; // 6

    function isOnStückelungSlide() {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return false;
        return activeSlide.getAttribute('data-title') === 'Wie funktionieren Neuronale Netzwerke?';
    }

    function finalStep() {
        return sinEnd;
    }

    function canGoNext() {
        if (!isOnStückelungSlide()) return false;
        return currentStep < finalStep();
    }

    function canGoPrev() {
        if (!isOnStückelungSlide()) return false;
        return currentStep > 0;
    }

    function applyStep() {
        const slider = document.getElementById('nn-num-neurons');
        const countLabel = document.getElementById('nn-neuron-count');

        if (!slider) return;

        const neurons = sinSteps[currentStep];
        slider.value = neurons;
        if (countLabel) countLabel.textContent = neurons;
        NNApproxViz.render();
    }

    function next() {
        if (!canGoNext()) return;
        currentStep++;
        applyStep();
    }

    function prev() {
        if (!canGoPrev()) return;
        currentStep--;
        applyStep();
    }

    function reset() {
        currentStep = 0;
        applyStep();
    }

    // Zustand merken/wiederherstellen (Presentation.js speichert ihn pro
    // Folie, damit Rückwärts-Navigation exakt dort landet, wo man war).
    function getState() { return { step: currentStep }; }
    function setState(st) {
        if (!st || typeof st.step !== 'number') return;
        currentStep = Math.min(Math.max(st.step, 0), 13);
        applyStep();
    }

    return {
        isOnStückelungSlide,
        canGoNext,
        canGoPrev,
        next,
        prev,
        reset,
        getState,
        setState
    };
})();
/* ================================================================
   TypewriterViz – Schreibmaschinen-Effekt für [data-typewriter]
   Äußere Pfeile werden blockiert, bis der Code komplett geschrieben
   ist; danach wird der nächste Klick/Pfeil wieder normal verarbeitet.
   ================================================================ */
const TypewriterViz = (() => {
    let active = false;

    function isTypewriting() { return active; }
    function setActive(v) { active = v; }

    function isOnClassicSlide() {
        const a = document.querySelector('.slide.active');
        return a && a.getAttribute('data-title') === 'Klassisch vs. KI';
    }

    // Auf Folie betreten automatisch den Schreibmaschinen-Effekt starten.
    // Wichtig: erst NACH der Folien-Transition (~850 ms) anfangen — sonst
    // tippt der Code schon während die Folie noch einfadet und der User
    // sieht nur das fertige Ergebnis.
    function activate() {
        // goTo() entfernt .active synchron und fügt es erst nach 2 rAFs wieder
        // hinzu. Hier sind wir also ZWISCHEN den beiden Operationen — wenn wir
        // .slide.active abfragen, gibt es gerade keinen Treffer. Komplett
        // verzögern (Folien-Transition 800 ms + kleiner Puffer) und dann erst
        // die Schreibmaschine starten.
        setTimeout(() => {
            const slide = document.querySelector('.slide.active');
            if (!slide) return;
            if (typeof startTypewriter === 'function') startTypewriter(slide);
        }, 850);
    }

    // Schreibmaschine stoppen (Folie verlassen).
    function stop() {
        const el = document.querySelector('[data-typewriter]');
        if (el && typeof _twStop === 'function') _twStop(el);
    }

    return { isTypewriting, setActive, isOnClassicSlide, activate, stop, nop() {} };
})();
/* ================================================================
   Neuron Intro Animation (Slide "Was sind Neuronale Netzwerk?")
   Pfeilrechts zeigt die nächste Szene, Pfeillinks die vorherige.
     Szene 1: dense(x) = W·x + B      (Underbraces: Gewichte / Bias)
     Szene 2: Vektoren/Matrizen          (W und B unterlegt mit "lernbar")
   ================================================================ */
const NeuronIntroViz = (() => {
    let revealed = false;
    let cur = 0;

    function isOnIntroSlide() {
        const active = document.querySelector('.slide.active');
        return active && active.getAttribute('data-title') === 'Neuronales Netz Intro';
    }

    function getScenes() {
        const el = document.getElementById('nn-intro-anim');
        return el ? Array.from(el.querySelectorAll('.nn-anim-scene')) : [];
    }

    function _apply(idx) {
        getScenes().forEach((s, k) => s.classList.toggle('on', k === idx));
    }

    function start() {
        revealed = true;
        cur = 0;
        _apply(0);
    }

    function hideFragment() { revealed = false; }

    function canGoNext() {
        if (!revealed) return false;
        return cur < getScenes().length - 1;
    }

    function next() {
        if (!canGoNext()) return;
        cur++;
        _apply(cur);
    }

    function canGoPrev() {
        if (!revealed) return false;
        return cur > 0;
    }

    function prev() {
        if (!canGoPrev()) return;
        cur--;
        _apply(cur);
    }

    function reset() {
        revealed = false;
        cur = 0;
        _apply(0);
    }

    // Zustand merken/wiederherstellen (siehe NNStepDemo). Wichtig: 'revealed'
    // und 'cur' müssen beide zurückkommen, sonst landet man beim
    // Rückwärts-Navigieren auf Szene 0 statt auf der, die man verlassen hat.
    function getState() { return { revealed, cur }; }
    function setState(st) {
        if (!st) return;
        revealed = !!st.revealed;
        cur = Math.min(Math.max(st.cur | 0, 0), Math.max(getScenes().length - 1, 0));
        _apply(cur);
    }

    return { start, hideFragment, canGoNext, next, canGoPrev, prev, reset, isOnIntroSlide, getState, setState };
})();
function reset_nn_num_neurons () {
	$("#nn-num-neurons").val(1).trigger("change");
}

// ============================================================
// BOOT – wird von presentation.js (runBootSequence) aufgerufen
// ============================================================
function loadIntuitionModule() {
    initNNDemos();
    NNApproxViz.render();
}
