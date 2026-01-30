/**
 * statistics.js - Visual Statistics for AI
 */

function initStatistics() {
    renderNormalDistribution();
    renderCorrelationPlayground();
    renderBayesianUpdater();
    renderSoftmaxVisualizer();
}

// 1. Gaussian Distribution
function renderNormalDistribution() {
    const plotId = 'plot-gaussian';
    const sliderMu = document.getElementById('slider-mu');
    const sliderSigma = document.getElementById('slider-sigma');

    function update() {
        const mu = parseFloat(sliderMu.value);
        const sigma = parseFloat(sliderSigma.value);
        let xValues = [], yValues = [];

        for (let x = -5; x <= 5; x += 0.1) {
            let y = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
            xValues.push(x);
            yValues.push(y);
        }

        Plotly.react(plotId, [{
            x: xValues, y: yValues,
            type: 'scatter', mode: 'lines', fill: 'tozeroy',
            line: { color: '#3b82f6' }
        }], {
            margin: { t: 10, b: 30, l: 30, r: 10 },
            xaxis: { range: [-5, 5] }, yaxis: { range: [0, 1] }
        });
    }
    sliderMu.oninput = update;
    sliderSigma.oninput = update;
    update();
}

// 2. Correlation & Covariance
function renderCorrelationPlayground() {
    const plotId = 'plot-correlation';
    const slider = document.getElementById('corr-strength');

    function update() {
        const r = parseFloat(slider.value);
        let x = [], y = [];
        for (let i = 0; i < 150; i++) {
            let valX = (Math.random() * 2 - 1);
            let noise = (Math.random() * 2 - 1) * Math.sqrt(1 - r*r);
            x.push(valX);
            y.push(r * valX + noise * 0.5);
        }

        Plotly.react(plotId, [{
            x: x, y: y, mode: 'markers',
            marker: { color: '#d946ef', opacity: 0.5 }
        }], {
            margin: { t: 10, b: 30, l: 30, r: 10 },
            xaxis: { range: [-1.5, 1.5] }, yaxis: { range: [-1.5, 1.5] }
        });

        document.getElementById('r-val').innerText = r.toFixed(2);
        document.getElementById('cov-matrix').innerText = 
            `[ 1.00  ${r.toFixed(2)} ]\n[ ${r.toFixed(2)}  1.00 ]`;
    }
    slider.oninput = update;
    update();
}

// 3. Bayes Theorem Updater
function renderBayesianUpdater() {
    const priorS = document.getElementById('bay-prior');
    const likeliS = document.getElementById('bay-likeli');

    function update() {
        const P_A = parseFloat(priorS.value);
        const P_B_given_A = parseFloat(likeliS.value);
        const P_B_given_notA = 0.05; 
        
        const posterior = (P_B_given_A * P_A) / ((P_B_given_A * P_A) + (P_B_given_notA * (1 - P_A)));

        document.getElementById('bay-result-box').style.height = (posterior * 100) + '%';
        document.getElementById('bay-text').innerText = (posterior * 100).toFixed(1) + '%';
        document.getElementById('prior-text').innerText = (P_A * 100).toFixed(0) + '%';
    }
    priorS.oninput = update;
    likeliS.oninput = update;
    update();
}

// 4. Softmax
function renderSoftmaxVisualizer() {
    const inputs = document.querySelectorAll('.softmax-input');
    function update() {
        let logits = Array.from(inputs).map(i => parseFloat(i.value) || 0);
        let exps = logits.map(v => Math.exp(v));
        let sum = exps.reduce((a, b) => a + b, 0);
        
        exps.forEach((exp, i) => {
            let prob = exp / sum;
            document.getElementById(`softmax-bar-${i}`).style.width = (prob * 100) + '%';
            document.getElementById(`softmax-text-${i}`).innerText = (prob * 100).toFixed(1) + '%';
        });
    }
    inputs.forEach(i => i.oninput = update);
    update();
}

window.onload = initStatistics;
