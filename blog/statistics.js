/**
 * statistics.js - Interactive Statistical Foundations for AI
 */

function initStatistics() {
    renderNormalDistribution();
    renderLinearRegression();
    renderSoftmaxVisualizer();
}

// 1. Normal Distribution (Gaussian)
function renderNormalDistribution() {
    const plotId = 'plot-gaussian';
    const sliderMu = document.getElementById('slider-mu');
    const sliderSigma = document.getElementById('slider-sigma');

    function getData(mu, sigma) {
        let xValues = [];
        let yValues = [];
        for (let x = -5; x <= 5; x += 0.1) {
            // The Gaussian Formula: 1/(σ√(2π)) * e^(-(x-μ)^2 / (2σ^2))
            let exponent = Math.exp(-Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2)));
            let y = (1 / (sigma * Math.sqrt(2 * Math.PI))) * exponent;
            xValues.push(x);
            yValues.push(y);
        }
        return { x: xValues, y: yValues };
    }

    function update() {
        const mu = parseFloat(sliderMu.value);
        const sigma = parseFloat(sliderSigma.value);
        const data = getData(mu, sigma);

        Plotly.react(plotId, [{
            x: data.x, y: data.y,
            type: 'scatter', mode: 'lines',
            fill: 'tozeroy',
            line: { color: '#3b82f6', width: 3 }
        }], {
            margin: { t: 10, b: 40, l: 40, r: 10 },
            xaxis: { range: [-5, 5] },
            yaxis: { range: [0, 1] }
        });
    }

    sliderMu.addEventListener('input', update);
    sliderSigma.addEventListener('input', update);
    update();
}

// 2. Linear Regression (The simplest "Learning")
function renderLinearRegression() {
    const plotId = 'plot-regression';
    // Initial points
    let points = { x: [1, 2, 3, 4, 5], y: [2, 1, 4, 3, 5] };

    function calculateRegression(x, y) {
        const n = x.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += x[i]; sumY += y[i];
            sumXY += x[i] * y[i]; sumX2 += x[i] * x[i];
        }
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        return { slope, intercept };
    }

    function update() {
        const { slope, intercept } = calculateRegression(points.x, points.y);
        const lineX = [0, 6];
        const lineY = [intercept, slope * 6 + intercept];

        const data = [
            { x: points.x, y: points.y, mode: 'markers', marker: { size: 12, color: '#ef4444' }, name: 'Data' },
            { x: lineX, y: lineY, mode: 'lines', line: { color: '#3b82f6' }, name: 'Model' }
        ];

        Plotly.react(plotId, data, {
            margin: { t: 10, b: 40, l: 40, r: 10 },
            xaxis: { range: [0, 6] },
            yaxis: { range: [0, 6] }
        });
    }
    
    update();
}

// 3. Softmax Visualizer
function renderSoftmaxVisualizer() {
    const inputs = document.querySelectorAll('.softmax-input');
    
    function update() {
        let values = Array.from(inputs).map(i => parseFloat(i.value) || 0);
        let exponents = values.map(v => Math.exp(v));
        let sumExp = exponents.reduce((a, b) => a + b, 0);
        let probabilities = exponents.map(e => e / sumExp);

        probabilities.forEach((p, i) => {
            const bar = document.getElementById(`softmax-bar-${i}`);
            const text = document.getElementById(`softmax-text-${i}`);
            bar.style.width = (p * 100) + '%';
            text.innerText = (p * 100).toFixed(1) + '%';
        });
    }

    inputs.forEach(input => input.addEventListener('input', update));
    update();
}

window.addEventListener('load', initStatistics);
