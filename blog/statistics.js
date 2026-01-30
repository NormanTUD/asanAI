/**
 * statistics.js - Visual Statistics for AI (Expanded)
 */

function initStatistics() {
    renderNormalDistribution();
    renderCorrelationPlayground();
    renderBayesianUpdater();
    renderSoftmaxVisualizer();
    renderLinearRegression();
    renderLogLoss();
    renderCLT();
    renderEntropy();
    renderStandardScaler();
    renderGradientDescent();
    renderVarianceBias();
    renderChiSquare();
}

// Helper for math rendering
function refreshMath() {
    if (typeof render_temml === "function") {
        render_temml();
    }
}

// 1. Gaussian (Already exists, kept for completeness)
function renderNormalDistribution() {
    const sliderMu = document.getElementById('slider-mu');
    const sliderSigma = document.getElementById('slider-sigma');
    const update = () => {
        const mu = parseFloat(sliderMu.value);
        const sigma = parseFloat(sliderSigma.value);
        let xVal = [], yVal = [];
        for (let x = -5; x <= 5; x += 0.1) {
            let y = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
            xVal.push(x); yVal.push(y);
        }
        Plotly.react('plot-gaussian', [{ x: xVal, y: yVal, type: 'scatter', fill: 'tozeroy' }], { margin: { t: 0, b: 30, l: 30, r: 10 } });
        document.getElementById('gauss-formula').innerHTML = `$$f(x) = \\frac{1}{${sigma}\\sqrt{2\\pi}} e^{-\\frac{1}{2}(\\frac{x-${mu}}{${sigma}})^2}$$`;
        refreshMath();
    };
    sliderMu.oninput = update; sliderSigma.oninput = update;
    update();
}

// 2. Correlation
function renderCorrelationPlayground() {
    const slider = document.getElementById('corr-strength');
    const update = () => {
        const r = parseFloat(slider.value);
        let x = [], y = [];
        for (let i = 0; i < 100; i++) {
            let vx = (Math.random() * 2 - 1);
            let noise = (Math.random() * 2 - 1) * Math.sqrt(1 - r * r);
            x.push(vx); y.push(r * vx + noise * 0.3);
        }
        Plotly.react('plot-correlation', [{ x, y, mode: 'markers' }], { margin: { t: 0, b: 30, l: 30, r: 10 } });
        document.getElementById('r-val').innerText = r.toFixed(2);
        document.getElementById('cov-matrix').innerText = `[ 1.00  ${r.toFixed(2)} ]\n[ ${r.toFixed(2)}  1.00 ]`;
    };
    slider.oninput = update;
    update();
}

// 3. Bayes Theorem (Fixed Visibility)
function renderBayesianUpdater() {
    const priorS = document.getElementById('bay-prior');
    const likeliS = document.getElementById('bay-likeli');
    const update = () => {
        const pA = parseFloat(priorS.value);
        const pB_A = parseFloat(likeliS.value);
        const pB_notA = 0.1; 
        const posterior = (pB_A * pA) / ((pB_A * pA) + (pB_notA * (1 - pA)));

        document.getElementById('bay-result-box').style.height = (posterior * 100) + '%';
        document.getElementById('bay-text').innerText = (posterior * 100).toFixed(1) + '%';
        document.getElementById('bay-math-step').innerHTML = `$$P(A|B) = \\frac{${pB_A} \\cdot ${pA}}{(${pB_A} \\cdot ${pA}) + (${pB_notA} \\cdot ${1-pA})} = ${posterior.toFixed(3)}$$`;
        refreshMath();
    };
    priorS.oninput = update; likeliS.oninput = update;
    update();
}

// 4. Softmax
function renderSoftmaxVisualizer() {
    const inputs = document.querySelectorAll('.softmax-input');
    const update = () => {
        let logits = Array.from(inputs).map(i => parseFloat(i.value) || 0);
        let exps = logits.map(v => Math.exp(v));
        let sum = exps.reduce((a, b) => a + b, 0);
        logits.forEach((l, i) => {
            let prob = Math.exp(l) / sum;
            document.getElementById(`softmax-bar-${i}`).style.width = (prob * 100) + '%';
            document.getElementById(`softmax-text-${i}`).innerText = (prob * 100).toFixed(1) + '%';
        });
    };
    inputs.forEach(i => i.oninput = update);
    update();
}

// 5. Linear Regression (MSE)
function renderLinearRegression() {
    const sliderM = document.getElementById('reg-m');
    const points = [[1, 2], [2, 3.5], [3, 2.8], [4, 4.6], [5, 5.2]];
    const update = () => {
        const m = parseFloat(sliderM.value);
        let mse = 0;
        let lineX = [0, 6], lineY = [0, 6 * m];
        points.forEach(p => {
            let pred = m * p[0];
            mse += Math.pow(p[1] - pred, 2);
        });
        mse /= points.length;
        Plotly.react('plot-reg', [
            { x: points.map(p => p[0]), y: points.map(p => p[1]), mode: 'markers', name: 'Data' },
            { x: lineX, y: lineY, mode: 'lines', name: 'Model' }
        ], { margin: { t: 0 }, yaxis: { range: [0, 7] } });
        document.getElementById('mse-val').innerHTML = `$$MSE = \\frac{1}{n}\\sum(y - \\hat{y})^2 = ${mse.toFixed(2)}$$`;
        refreshMath();
    };
    sliderM.oninput = update; update();
}

// 6. Entropy (Uncertainty)
function renderEntropy() {
    const slider = document.getElementById('ent-p');
    const update = () => {
        const p = parseFloat(slider.value);
        const q = 1 - p;
        const entropy = (p === 0 || p === 1) ? 0 : -(p * Math.log2(p) + q * Math.log2(q));
        document.getElementById('ent-val').innerText = entropy.toFixed(3);
        document.getElementById('ent-formula').innerHTML = `$$H(X) = -\\sum p(x)\\log_2 p(x)$$`;
        refreshMath();
    };
    slider.oninput = update; update();
}

// 7. Central Limit Theorem
function renderCLT() {
    const btn = document.getElementById('clt-roll');
    let means = [];
    btn.onclick = () => {
        for(let i=0; i<50; i++) {
            let sum = 0;
            for(let j=0; j<10; j++) sum += Math.floor(Math.random() * 6) + 1;
            means.push(sum / 10);
        }
        Plotly.react('plot-clt', [{ x: means, type: 'histogram', marker: {color: '#f59e0b'} }], { margin: { t: 0 } });
    };
}

// 8. Log Loss (Cross-Entropy)
function renderLogLoss() {
    const slider = document.getElementById('logloss-p');
    const update = () => {
        const p = parseFloat(slider.value);
        const loss = -Math.log(p);
        document.getElementById('logloss-val').innerText = loss.toFixed(2);
        document.getElementById('logloss-math').innerHTML = `$$Loss = -\\ln(${p.toFixed(2)}) = ${loss.toFixed(2)}$$`;
        refreshMath();
    };
    slider.oninput = update; update();
}

// 9. Standard Scaler (Z-Score)
function renderStandardScaler() {
    const slider = document.getElementById('z-val-in');
    const update = () => {
        const x = parseFloat(slider.value);
        const mu = 100, sigma = 15; // IQ Example
        const z = (x - mu) / sigma;
        document.getElementById('z-res').innerHTML = `$$z = \\frac{${x} - ${mu}}{${sigma}} = ${z.toFixed(2)}$$`;
        refreshMath();
    };
    slider.oninput = update; update();
}

// 10. Gradient Descent
function renderGradientDescent() {
    const slider = document.getElementById('gd-step');
    const update = () => {
        const x = parseFloat(slider.value);
        const y = x * x;
        const slope = 2 * x;
        Plotly.react('plot-gd', [
            { x: [-2, -1, 0, 1, 2], y: [4, 1, 0, 1, 4], mode: 'lines' },
            { x: [x], y: [y], mode: 'markers', marker: { size: 12, color: 'red' } }
        ], { margin: { t: 0 } });
        document.getElementById('gd-math').innerHTML = `$$f'(x) = 2x \\rightarrow \\text{Slope: } ${slope.toFixed(2)}$$`;
        refreshMath();
    };
    slider.oninput = update; update();
}

// 11. Variance vs Bias
function renderVarianceBias() {
    const type = document.getElementById('vb-select');
    const update = () => {
        let x = [1, 2, 3, 4, 5], y;
        if (type.value === 'bias') y = [3, 3.1, 2.9, 3, 3.2]; // High Bias, Low Var
        else y = [1, 5, 0, 6, 2]; // Low Bias, High Var
        Plotly.react('plot-vb', [{ x, y, mode: 'markers+lines' }], { margin: { t: 0 }, yaxis: { range: [-1, 7] } });
    };
    type.onchange = update; update();
}

// 12. Chi-Square (Independence)
function renderChiSquare() {
    const obsA = document.getElementById('chi-a');
    const update = () => {
        const val = parseInt(obsA.value);
        const expected = 50;
        const chi = Math.pow(val - expected, 2) / expected;
        document.getElementById('chi-res').innerHTML = `$$\\chi^2 = \\frac{(${val} - ${expected})^2}{${expected}} = ${chi.toFixed(2)}$$`;
        refreshMath();
    };
    obsA.oninput = update; update();
}

window.onload = initStatistics;
