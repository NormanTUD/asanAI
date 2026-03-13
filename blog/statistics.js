let cltHistory = [];
let chainData = {};

// ============================================================
// UNIFIED PLOTLY THEME — The "Gorgeous" Foundation
// ============================================================

const STAT_THEME = {
    font: {
        family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#334155',
        size: 13
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    colorway: [
        '#6366f1', '#8b5cf6', '#a78bfa', '#c084fc',
        '#e879f9', '#f472b6', '#fb7185', '#f97316',
        '#eab308', '#22c55e', '#14b8a6', '#06b6d4'
    ],
    xaxis: {
        gridcolor: 'rgba(148,163,184,0.12)',
        zerolinecolor: 'rgba(148,163,184,0.25)',
        linecolor: 'rgba(148,163,184,0.2)',
        tickfont: { size: 11, color: '#64748b' },
        title: { font: { size: 12, color: '#475569', weight: 600 } }
    },
    yaxis: {
        gridcolor: 'rgba(148,163,184,0.12)',
        zerolinecolor: 'rgba(148,163,184,0.25)',
        linecolor: 'rgba(148,163,184,0.2)',
        tickfont: { size: 11, color: '#64748b' },
        title: { font: { size: 12, color: '#475569', weight: 600 } }
    },
    title: {
        font: { size: 15, color: '#1e293b', weight: 700 },
        x: 0.03,
        xanchor: 'left'
    },
    margin: { t: 48, b: 44, l: 52, r: 24 },
    hoverlabel: {
        bgcolor: '#1e293b',
        bordercolor: 'transparent',
        font: { color: '#f8fafc', size: 12, family: "'Inter', sans-serif" }
    },
    legend: {
        bgcolor: 'rgba(255,255,255,0.85)',
        bordercolor: 'rgba(148,163,184,0.2)',
        borderwidth: 1,
        font: { size: 11, color: '#475569' },
        orientation: 'h',
        y: -0.18,
        x: 0.5,
        xanchor: 'center'
    }
};

const PLOTLY_CONFIG = {
    displayModeBar: false,
    responsive: false,
    scrollZoom: false
};

function mergeLayout(custom) {
    const base = JSON.parse(JSON.stringify(STAT_THEME));
    return deepMerge(base, custom);
}

function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// ============================================================
// GRADIENT PALETTE HELPERS
// ============================================================

function gradientBar(values, baseHue = 245) {
    return values.map((_, i) => {
        const t = values.length > 1 ? i / (values.length - 1) : 0;
        const h = baseHue + t * 80;
        const s = 70 + t * 15;
        const l = 58 - t * 10;
        return `hsl(${h}, ${s}%, ${l}%)`;
    });
}

function alphaColor(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// ============================================================
// ANIMATION UTILITIES
// ============================================================

function animateValue(el, start, end, duration = 600, formatter = v => v.toFixed(2)) {
    const startTime = performance.now();
    function tick(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        const current = start + (end - start) * eased;
        el.textContent = formatter(current);
        if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

function pulseElement(el) {
    el.classList.remove('stat-pulse');
    void el.offsetWidth; // force reflow
    el.classList.add('stat-pulse');
}

// ============================================================
// INIT
// ============================================================

async function initStatistics() {
    await ZarathustraLab.init();

    const tasks = [
        renderNormalDistribution(),
        renderDiceDistribution(),
        renderGaussLegendreComplex(),
        renderCorrelationPlayground(),
        renderCeresAstronomy(),
        renderBayesianComplex(),
        renderEntropy(),
        rollCLT(),
        renderStandardScaler(),
        renderDirichletLab(),
        renderGMMContextLab(),
        renderBayesianLanguageLab(),
        trainMarkovModel(),
        initLLMStats(),
        renderBoW(),
        renderExtremeLab(),
        renderPoissonLab()
    ];

    try {
        await Promise.all(tasks);
        console.log("All statistics modules loaded successfully.");
    } catch (error) {
        console.error("Error loading statistics modules:", error);
    }
}

// ============================================================
// MARKOV MODEL
// ============================================================

async function trainMarkovModel() {
    const text = document.getElementById('markov-corpus').value.toLowerCase();
    const words = text.match(/\b(\w+)\b/g);

    if (!words || words.length < 2) return;

    for (let key in chainData) delete chainData[key];

    for (let i = 0; i < words.length - 1; i++) {
        const current = words[i];
        const next = words[i + 1];
        if (!chainData[current]) chainData[current] = {};
        chainData[current][next] = (chainData[current][next] || 0) + 1;
    }
}

function generatePredictions() {
    const inputField = document.getElementById('seed-word');
    const word = inputField.value.toLowerCase().trim();
    const container = document.getElementById('word-suggestions');
    const output = document.getElementById('sequence-output');

    container.innerHTML = '';

    if (!chainData[word]) {
        container.innerHTML = `
            <div class="stat-empty-state">
                <span class="stat-empty-icon">🔍</span>
                <span>No successors found for "<strong>${word}</strong>"</span>
            </div>`;
        return;
    }

    const totalOccurrences = Object.values(chainData[word]).reduce((a, b) => a + b, 0);
    const candidates = Object.entries(chainData[word])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    candidates.forEach(([nextWord, count], index) => {
        const probability = ((count / totalOccurrences) * 100).toFixed(1);
        const btn = document.createElement('button');
        btn.className = 'stat-suggestion-chip';
        btn.style.animationDelay = `${index * 60}ms`;

        const barWidth = (count / totalOccurrences) * 100;

        btn.innerHTML = `
            <div class="stat-suggestion-bar" style="width: ${barWidth}%"></div>
            <span class="stat-suggestion-word">${nextWord}</span>
            <span class="stat-suggestion-prob">${probability}%</span>
        `;

        btn.onclick = () => {
            if (output.innerText === "...") {
                output.innerText = word + " " + nextWord;
            } else {
                output.innerText += " " + nextWord;
            }
            inputField.value = nextWord;
            pulseElement(output);
            generatePredictions();
        };

        container.appendChild(btn);
    });
}

function resetSequence() {
    const output = document.getElementById('sequence-output');
    output.innerText = "...";
    output.classList.remove('stat-pulse');
    document.getElementById('word-suggestions').innerHTML = "";
    document.getElementById('seed-word').value = "";
}

// ============================================================
// DICE DISTRIBUTION
// ============================================================

async function renderDiceDistribution() {
    const container = document.getElementById('dice-matrix-container');
    if (!container) return;

    const groups = {};
    for (let i = 2; i <= 12; i++) groups[i] = [];

    for (let d1 = 1; d1 <= 6; d1++) {
        for (let d2 = 1; d2 <= 6; d2++) {
            groups[d1 + d2].push([d1, d2]);
        }
    }

    container.innerHTML = '';
    container.className = 'stat-dice-tower-grid';

    Object.keys(groups).forEach((sum, colIdx) => {
        const column = document.createElement('div');
        column.className = 'stat-dice-column';
        column.style.animationDelay = `${colIdx * 40}ms`;

        groups[sum].forEach(pair => {
            const pairDiv = document.createElement('div');
            pairDiv.className = 'stat-dice-pair';
            pairDiv.appendChild(createDiceSVG(pair[0]));
            pairDiv.appendChild(createDiceSVG(pair[1]));
            column.appendChild(pairDiv);
        });

        const label = document.createElement('div');
        label.className = 'stat-dice-label';
        label.innerHTML = `<span class="stat-dice-sum">${sum}</span><span class="stat-dice-count">${groups[sum].length}/36</span>`;
        column.appendChild(label);
        container.appendChild(column);
    });

    // Plotly chart
    const xValues = Object.keys(groups).map(Number);
    const yValues = xValues.map(x => groups[x].length);
    const colors = gradientBar(yValues, 240);

    const trace = {
        x: xValues,
        y: yValues,
        type: 'bar',
        marker: {
            color: colors,
            line: { color: 'rgba(255,255,255,0.6)', width: 1.5 }
        },
        hovertemplate: '<b>Sum %{x}</b><br>%{y} of 36 combinations<br>P = %{customdata:.1%}<extra></extra>',
        customdata: yValues.map(y => y / 36)
    };

    Plotly.newPlot('dice-distribution-plot', [trace], mergeLayout({
        title: { text: 'The Triangular Distribution of Two Dice' },
        xaxis: { title: { text: 'Sum' }, dtick: 1 },
        yaxis: { title: { text: 'Ways to Achieve' }, fixedrange: true },
        height: 300
    }), PLOTLY_CONFIG);
}

// ============================================================
// NORMAL DISTRIBUTION
// ============================================================

async function renderNormalDistribution() {
    const sliderMu = document.getElementById('slider-mu');
    const sliderSigma = document.getElementById('slider-sigma');
    const sliderPoints = document.getElementById('gauss-points');

    function generateRandomGauss(mu, sigma) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return mu + sigma * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    const update = () => {
        const mu = parseFloat(sliderMu.value);
        const sigma = parseFloat(sliderSigma.value);
        const n = parseInt(sliderPoints.value);

        let samples = [];
        for (let i = 0; i < n; i++) samples.push(generateRandomGauss(mu, sigma));

        const traceHist = {
            x: samples,
            type: 'histogram',
            name: 'Random Samples',
            histnorm: 'probability density',
            marker: {
                color: alphaColor('#6366f1', 0.45),
                line: { color: alphaColor('#6366f1', 0.7), width: 1 }
            },
            nbinsx: 30
        };

        const xValues = [], yValues = [];
        for (let i = -5; i <= 5; i += 0.05) {
            xValues.push(i);
            const pdf = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((i - mu) / sigma, 2));
            yValues.push(pdf);
        }

        const traceCurve = {
            x: xValues,
            y: yValues,
            mode: 'lines',
            name: 'Theoretical PDF',
            line: {
                color: '#e11d48',
                width: 3,
                shape: 'spline'
            },
            fill: 'tozeroy',
            fillcolor: alphaColor('#e11d48', 0.08)
        };

        Plotly.react('plot-gaussian', [traceHist, traceCurve], mergeLayout({
            xaxis: { range: [-5, 5] },
            yaxis: { title: { text: 'Density' } },
            showlegend: false,
            margin: { t: 12 }
        }), PLOTLY_CONFIG);

        document.getElementById('gauss-formula').innerHTML =
            `$$f(x | \\mu, \\sigma^2) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}$$`;
        refreshMath();
    };

    sliderMu.oninput = update;
    sliderSigma.oninput = update;
    sliderPoints.oninput = update;
    update();
}

function refreshMath() {
    if (typeof render_temml === "function") {
        render_temml();
    }
}

// ============================================================
// CERES ASTRONOMY
// ============================================================

async function renderCeresAstronomy() {
    const sliderSigma = document.getElementById('astro-sigma');
    if (!sliderSigma) return;

    const update = () => {
        const sigma = parseFloat(sliderSigma.value);

        const xPath = [], yPath = [];
        for (let i = 0; i <= 10; i += 0.2) {
            xPath.push(i);
            yPath.push(Math.sin(i / 2) * 3 + 5);
        }

        const xObs = [], yObs = [], actualErrors = [];
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * 10;
            const trueY = Math.sin(x / 2) * 3 + 5;
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            const noise = sigma * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
            xObs.push(x);
            yObs.push(trueY + noise);
            actualErrors.push(noise);
        }

        const traceOrbit = {
            x: xPath, y: yPath, mode: 'lines', name: 'True Orbit',
            line: { color: '#22c55e', width: 3, shape: 'spline' },
            xaxis: 'x1', yaxis: 'y1'
        };

        const traceObs = {
            x: xObs, y: yObs, mode: 'markers', name: 'Observations',
            marker: {
                color: '#6366f1',
                size: 5,
                opacity: 0.55,
                line: { color: alphaColor('#6366f1', 0.3), width: 1 }
            },
            xaxis: 'x1', yaxis: 'y1'
        };

        const traceErrorHist = {
            x: actualErrors,
            type: 'histogram',
            name: 'Actual Error Dist.',
            histnorm: 'probability density',
            marker: { color: alphaColor('#6366f1', 0.35), line: { color: alphaColor('#6366f1', 0.6), width: 1 } },
            xaxis: 'x2', yaxis: 'y2',
            nbinsx: 20
        };

        const xBell = [], yBell = [];
        for (let i = -4; i <= 4; i += 0.1) {
            xBell.push(i);
            const pdf = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(i / sigma, 2));
            yBell.push(pdf);
        }
        const traceBell = {
            x: xBell, y: yBell, mode: 'lines', name: 'Theoretical Curve',
            line: { color: '#e11d48', width: 2.5 },
            xaxis: 'x2', yaxis: 'y2'
        };

        Plotly.react('plot-astro', [traceOrbit, traceObs, traceErrorHist, traceBell], mergeLayout({
            grid: { rows: 1, columns: 2, pattern: 'independent' },
            title: { text: 'Ceres: Truth vs. Noisy Observation Errors' },
            xaxis: { title: { text: 'Time / Arc' }, domain: [0, 0.58] },
            yaxis: { title: { text: 'Celestial Position' }, anchor: 'x1' },
            xaxis2: { title: { text: 'Residual Error (Δ)' }, domain: [0.68, 1], range: [-4, 4] },
            yaxis2: { title: { text: 'Probability Density' }, anchor: 'x2' },
            showlegend: false,
            height: 500,
            margin: { t: 48, b: 50, l: 50, r: 20 }
        }), PLOTLY_CONFIG);
    };

    sliderSigma.oninput = update;
    update();
}

// ============================================================
// CORRELATION PLAYGROUND
// ============================================================

async function renderCorrelationPlayground() {
    const inputs = {
        r: document.getElementById('corr-strength'),
        mux: document.getElementById('corr-mu-x') || { value: 0 },
        muy: document.getElementById('corr-mu-y') || { value: 0 },
        sx: document.getElementById('corr-sigma-x'),
        sy: document.getElementById('corr-sigma-y'),
        n: { value: 300 }
    };

    const varDisplay = document.getElementById('var-definitions');
    const muDisplay = document.getElementById('mu-calculation');
    const covDefDisplay = document.getElementById('cov-definition');
    const breakdownDisplay = document.getElementById('corr-math-breakdown');

    const update = () => {
        const r = parseFloat(inputs.r.value);
        const mux = parseFloat(inputs.mux.value);
        const muy = parseFloat(inputs.muy.value);
        const sx = parseFloat(inputs.sx.value);
        const sy = parseFloat(inputs.sy.value);
        const n = parseInt(inputs.n.value);

        const covariance = r * sx * sy;

        let x = [], y = [];
        for (let i = 0; i < n; i++) {
            let z1 = 0, z2 = 0;
            while (z1 === 0) z1 = Math.random();
            while (z2 === 0) z2 = Math.random();
            const norm1 = Math.sqrt(-2.0 * Math.log(z1)) * Math.cos(2.0 * Math.PI * z2);
            const norm2 = Math.sqrt(-2.0 * Math.log(z1)) * Math.sin(2.0 * Math.PI * z2);
            x.push(mux + (sx * norm1));
            y.push(muy + (sy * (r * norm1 + Math.sqrt(1 - r ** 2) * norm2)));
        }

        // Color by density approximation
        const pointColors = x.map((xi, i) => {
            const dist = Math.sqrt(xi * xi + y[i] * y[i]);
            return dist;
        });

        varDisplay.innerHTML = `
            $$\\begin{aligned}
            n &= \\underbrace{${n}}_{\\text{Sample Size}} \\\\
            \\sigma_X &= \\underbrace{${sx.toFixed(1)}}_{\\text{Spread of X}} \\quad \\sigma_Y = \\underbrace{${sy.toFixed(1)}}_{\\text{Spread of Y}}
            \\end{aligned}$$
        `;

        muDisplay.innerHTML = `
            $$\\mu_X = ${mux.toFixed(1)}, \\quad \\mu_Y = ${muy.toFixed(1)}$$
        `;

        covDefDisplay.innerHTML = `
            $$\\begin{aligned}
            \\text{Cov}(X,Y) &= \\frac{\\sum (\\Delta X \\cdot \\Delta Y)}{n-1} \\\\
            &= \\mathbf{${covariance.toFixed(2)}}
            \\end{aligned}$$
            <p class="stat-hint">Notice: If you increase scale, Covariance grows!</p>
        `;

        breakdownDisplay.innerHTML = `
            $$r = \\frac{\\text{Cov}(X,Y)}{\\sigma_X \\cdot \\sigma_Y} = \\frac{${covariance.toFixed(2)}}{\\underbrace{${sx.toFixed(1)} \\cdot ${sy.toFixed(1)}}_{${(sx * sy).toFixed(2)}}} = \\mathbf{${r.toFixed(2)}}$$
            <p class="stat-hint">Standardizing "cancels out" the scale to find the pure relationship</p>
        `;

        Plotly.react('plot-correlation', [{
            x: x, y: y, mode: 'markers',
            marker: {
                color: pointColors,
                colorscale: [[0, '#6366f1'], [0.5, '#a78bfa'], [1, '#f0abfc']],
                size: 5,
                opacity: 0.6,
                line: { width: 0 }
            },
            type: 'scatter'
        }], mergeLayout({
            margin: { t: 10, b: 40, l: 40, r: 10 },
            xaxis: { range: [-15, 15], title: { text: 'Variable X' } },
            yaxis: { range: [-15, 15], title: { text: 'Variable Y' } }
        }), PLOTLY_CONFIG);

        if (typeof refreshMath === "function") refreshMath();
    };

    [inputs.r, inputs.sx, inputs.sy].forEach(input => {
        if (input) input.oninput = update;
    });
    update();
}

// ============================================================
// GAUSS-LEGENDRE (LEAST SQUARES)
// ============================================================

async function renderGaussLegendreComplex() {
    const noiseIn = document.getElementById('gl-noise-new');
    const nIn = document.getElementById('gl-n-new');
    const mathDisplay = document.getElementById('gl-math-complex');

    const update = () => {
        const noise = parseFloat(noiseIn.value);
        const n = parseInt(nIn.value);

        const x = Array.from({ length: n }, (_, i) => i);
        const yTrue = x.map(v => v);
        const yObs = x.map(v => v + (Math.random() - 0.5) * noise * 2);

        const xSum = x.reduce((a, b) => a + b, 0);
        const ySum = yObs.reduce((a, b) => a + b, 0);
        const slope = (n * x.reduce((a, b, i) => a + b * yObs[i], 0) - xSum * ySum) /
            (n * x.reduce((a, b) => a + b * b, 0) - xSum * xSum);
        const intercept = (ySum - slope * xSum) / n;

        const yFit = x.map(v => slope * v + intercept);
        const totalError = yObs.reduce((a, b, i) => a + Math.pow(b - yFit[i], 2), 0);

        mathDisplay.innerHTML = `
            $$\\underbrace{\\text{Error}}_{\\text{Minimized}} S = \\sum \\underbrace{(y_i - \\hat{y}_i)^2}_{\\text{Squares}} = \\mathbf{${totalError.toFixed(2)}}$$
            <p class="stat-hint-warm">Gauß showed that minimizing $S$ is equivalent to maximizing the likelihood of the orbit.</p>
        `;

        const traces = [
            {
                x, y: yObs, mode: 'markers', name: 'Noisy Observations',
                marker: {
                    color: '#f97316',
                    size: 8,
                    opacity: 0.8,
                    line: { color: '#fff', width: 1.5 }
                }
            },
            {
                x, y: yFit, mode: 'lines', name: 'Least Squares Fit',
                line: { color: '#1e293b', width: 3 }
            }
        ];

        // Error squares with gradient opacity
        yObs.forEach((val, i) => {
            const diff = val - yFit[i];
            const absDiff = Math.abs(diff);
            const maxDiff = Math.max(...yObs.map((v, j) => Math.abs(v - yFit[j])));
            const intensity = maxDiff > 0 ? absDiff / maxDiff : 0;

            traces.push({
                x: [x[i], x[i], x[i] + diff, x[i] + diff, x[i]],
                y: [yFit[i], val, val, yFit[i], yFit[i]],
                fill: 'toself',
                fillcolor: `rgba(249, 115, 22, ${0.05 + intensity * 0.2})`,
                line: { width: 0.5, color: `rgba(249, 115, 22, ${0.15 + intensity * 0.3})` },
                showlegend: false,
                hoverinfo: 'skip'
            });
        });

        Plotly.react('plot-gauss-legendre', traces, mergeLayout({
            xaxis: { title: { text: 'Time / Position' } },
            yaxis: { title: { text: 'Observed Coordinate' } },
            margin: { t: 10, b: 40, l: 40, r: 10 },
            height: 450
        }), PLOTLY_CONFIG);

        if (typeof refreshMath === "function") refreshMath();
    };

    [noiseIn, nIn].forEach(el => el.oninput = update);
    update();
}

// ============================================================
// BAYESIAN COMPLEX
// ============================================================

async function renderBayesianComplex() {
    const priorIn = document.getElementById('bay-prior-new');
    const tpIn = document.getElementById('bay-tp');
    const fpIn = document.getElementById('bay-fp');
    const mathDisplay = document.getElementById('bay-math-complex');

    const update = () => {
        const P_H = parseFloat(priorIn.value);
        const P_notH = 1 - P_H;
        const P_E_H = parseFloat(tpIn.value);
        const P_E_notH = parseFloat(fpIn.value);

        const numerator = P_E_H * P_H;
        const totalProbE = (P_E_H * P_H) + (P_E_notH * P_notH);
        const posterior = numerator / totalProbE;

        mathDisplay.innerHTML = `
            $$P(H|E) = \\frac{\\underbrace{${P_E_H} \\cdot ${P_H.toFixed(2)}}_{\\text{Signal (${numerator.toFixed(3)})}}}{\\underbrace{${numerator.toFixed(3)} + (${P_E_notH} \\cdot ${P_notH.toFixed(2)})}_{\\text{Total Evidence (${totalProbE.toFixed(3)})}}} = \\mathbf{${(posterior * 100).toFixed(1)}\\%}$$
        `;

        const tracePrior = {
            x: ['Belief'], y: [P_H], name: 'Prior', type: 'bar',
            marker: {
                color: alphaColor('#94a3b8', 0.4),
                line: { color: '#94a3b8', width: 2 }
            },
            width: [0.35]
        };
        const tracePosterior = {
            x: ['Belief'], y: [posterior], name: 'Posterior', type: 'bar',
            marker: {
                color: alphaColor('#6366f1', 0.7),
                line: { color: '#6366f1', width: 2 }
            },
            width: [0.35]
        };

        Plotly.react('plot-bayesian-migration', [tracePrior, tracePosterior], mergeLayout({
            barmode: 'group',
            yaxis: { range: [0, 1], title: { text: 'Confidence' } },
            showlegend: true,
            margin: { t: 10, b: 30, l: 50, r: 10 },
            height: 400
        }), PLOTLY_CONFIG
        );

        if (typeof refreshMath === "function") refreshMath();
    };

    [priorIn, tpIn, fpIn].forEach(el => el.oninput = update);
    update();
}

// ============================================================
// ENTROPY
// ============================================================

async function renderEntropy() {
    const slider1 = document.getElementById('entropy-p1');
    const slider2 = document.getElementById('entropy-p2');
    const labelHead = document.getElementById('label-head');
    const labelTail = document.getElementById('label-tail');
    const mathDisplay = document.getElementById('entropy-math-complex');
    const plotElement = document.getElementById('plot-entropy');

    if (!slider1 || !slider2 || !plotElement) return;

    const update = (source) => {
        let val1, val2;

        if (source === 1) {
            val1 = parseInt(slider1.value);
            val2 = 100 - val1;
            slider2.value = val2;
        } else {
            val2 = parseInt(slider2.value);
            val1 = 100 - val2;
            slider1.value = val1;
        }

        labelHead.innerText = val1;
        labelTail.innerText = val2;

        const p1 = val1 / 100;
        const p2 = val2 / 100;

        const term1 = p1 > 0 ? p1 * Math.log2(p1) : 0;
        const term2 = p2 > 0 ? p2 * Math.log2(p2) : 0;
        const entropy = -(term1 + term2);

        if (mathDisplay) {
            mathDisplay.innerHTML = `
                <p style="margin-top:0;"><strong>Shannon Entropy $H(X)$ Calculation:</strong></p>
                $$H(X) = - \\sum_{i=1}^{n} p(x_i) \\log_2 p(x_i)$$
                <hr style="border:0; border-top:1px solid #e2e8f0; margin:15px 0;">
                $$H(X) = - \\left[ 
                    \\underbrace{${p1.toFixed(2)} \\log_2(${p1.toFixed(2)})}_{\\text{Head}} + 
                    \\underbrace{${p2.toFixed(2)} \\log_2(${p2.toFixed(2)})}_{\\text{Tail}} 
                \\right]$$
                $$H(X) = - \\left[ 
                    \\underbrace{${term1.toFixed(3)}}_{\\text{Term for Head}} + 
                    \\underbrace{${term2.toFixed(3)}}_{\\text{Term for Tail}} 
                \\right] = \\mathbf{${entropy.toFixed(3)}} \\text{ bits}$$
                <p class="stat-hint">
                    When probabilities are equal (50/50), entropy is maximized at 1 bit.
                </p>
            `;
        }

        Plotly.react(plotElement, [{
            x: ['Head', 'Tail'],
            y: [p1, p2],
            type: 'bar',
            text: [val1 + ' / 100', val2 + ' / 100'],
            textposition: 'auto',
            textfont: { color: '#fff', weight: 700, size: 13 },
            marker: {
                color: ['#eab308', '#94a3b8'],
                line: { width: 1.5, color: ['#a16207', '#475569'] },
                pattern: { shape: '' }
            }
        }], mergeLayout({
            height: 350,
            margin: { t: 30, b: 40, l: 50, r: 20 },
            yaxis: { range: [0, 1.1], title: { text: 'Probability (p)' } }
        }), PLOTLY_CONFIG);

        if (typeof refreshMath === "function") refreshMath();
    };

    slider1.oninput = () => update(1);
    slider2.oninput = () => update(2);
    update(1);
}

// ============================================================
// CENTRAL LIMIT THEOREM
// ============================================================

async function rollCLT() {
    const n = parseInt(document.getElementById('clt-n').value);
    const diceContainer = document.getElementById('dice-container');

    let sum = 0;
    let currentRoll = [];

    for (let i = 0; i < n; i++) {
        const val = Math.floor(Math.random() * 6) + 1;
        sum += val;
        currentRoll.push(val);
    }

    cltHistory.push(sum / n);
    document.getElementById('clt-count').innerText = cltHistory.length;

    diceContainer.innerHTML = '';
    diceContainer.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:50px;padding:15px;background:#fff;border:1px dashed #cbd5e1;border-radius:8px;';

    currentRoll.forEach((val, i) => {
        const svg = createDiceSVG(val);
        svg.style.opacity = '0';
        svg.style.transform = 'scale(0.5) rotate(-15deg)';
        svg.style.transition = `all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 25}ms`;
        diceContainer.appendChild(svg);
        requestAnimationFrame(() => {
            svg.style.opacity = '1';
            svg.style.transform = 'scale(1) rotate(0deg)';
        });
    });

    updateCLTPlot();
}

function resetCLT() {
    cltHistory = [];
    document.getElementById('clt-count').innerText = "0";
    const dc = document.getElementById('dice-container');
    dc.innerHTML = '<span style="color: #94a3b8; font-style: italic;">Roll the dice to see individual results here...</span>';
    updateCLTPlot();
}

function updateCLTPlot() {
    const n = parseInt(document.getElementById('clt-n').value);

    const traceHist = {
        x: cltHistory,
        type: 'histogram',
        histnorm: 'probability density',
        nbinsx: n === 1 ? 6 : 40,
        marker: {
            color: alphaColor('#6366f1', 0.5),
            line: { color: '#fff', width: 0.5 }
        },
        name: 'Observed Averages'
    };

    const mu = 3.5;
    const sigma = Math.sqrt((35 / 12) / n);

    const xValues = [], yValues = [];
    for (let x = 1; x <= 6; x += 0.05) {
        xValues.push(x);
        const pdf = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
        yValues.push(pdf);
    }

    const traceLine = {
        x: xValues,
        y: yValues,
        mode: 'lines',
        name: 'Theoretical Gauss',
        line: { color: '#e11d48', width: 3, shape: 'spline' }
    };

    Plotly.react('plot-clt', [traceHist, traceLine], mergeLayout({
        title: { text: `CLT: Distribution of Averages (n=${n} dice)` },
        xaxis: { title: { text: 'Average Value' }, range: [0.8, 6.2], dtick: n === 1 ? 1 : null },
        yaxis: { title: { text: 'Probability Density' }, rangemode: 'nonnegative' },
        showlegend: true,
        margin: { t: 50, b: 80, l: 50, r: 20 },
        bargap: 0.05
    }), PLOTLY_CONFIG);
}

// ============================================================
// DICE SVG HELPER
// ============================================================

function createDiceSVG(value) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "30");
    svg.setAttribute("height", "30");
    svg.setAttribute("viewBox", "0 0 100 100");

    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", "5"); rect.setAttribute("y", "5");
    rect.setAttribute("width", "90"); rect.setAttribute("height", "90");
    rect.setAttribute("rx", "14");
    rect.setAttribute("fill", "#ffffff");
    rect.setAttribute("stroke", "#cbd5e1");
    rect.setAttribute("stroke-width", "3");
    svg.appendChild(rect);

    const dots = {
        1: [[50, 50]],
        2: [[25, 25], [75, 75]],
        3: [[25, 25], [50, 50], [75, 75]],
        4: [[25, 25], [75, 25], [25, 75], [75, 75]],
        5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
        6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]]
    };

    dots[value].forEach(p => {
        const c = document.createElementNS(svgNS, "circle");
        c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]);
        c.setAttribute("r", "8");
        c.setAttribute("fill", "#1e293b");
        svg.appendChild(c);
    });

    return svg;
}

// ============================================================
// STANDARDIZATION (Z-SCORES)
// ============================================================

async function renderStandardScaler() {
    const inputX = document.getElementById('z-x');
    const inputMu = document.getElementById('z-mu');
    const inputSigma = document.getElementById('z-sigma');
    const mathDisplay = document.getElementById('z-math');

    const update = () => {
        const x = parseFloat(inputX.value);
        const mu = parseFloat(inputMu.value);
        const sigma = parseFloat(inputSigma.value);

        const deviation = x - mu;
        const z = deviation / sigma;

        mathDisplay.innerHTML = `
            $$ z = \\frac{
                \\underbrace{ ${x} - ${mu} }_{ \\text{Deviation from Mean} (\\text{${deviation.toFixed(1)}}) }
            }{
                \\underbrace{ ${sigma} }_{ \\text{Standard Scale} }
            } = \\mathbf{${z.toFixed(2)}} $$

            <div class="stat-interpretation-card ${Math.abs(z) > 2 ? 'stat-interpretation-outlier' : ''}">
                <p class="stat-interpretation-title">Interpretation:</p>
                <p class="stat-interpretation-body">
                    The value <strong>${x}</strong> is <strong>${Math.abs(z).toFixed(2)}</strong> 
                    standard units ${z >= 0 ? 'above' : 'below'} the average. 
                    ${Math.abs(z) > 2 ? 'Pearson would consider this an <em>outlier</em>.' : 'This is considered a <em>typical</em> variation.'}
                </p>
            </div>
        `;

        if (typeof refreshMath === "function") refreshMath();
    };

    [inputX, inputMu, inputSigma].forEach(input => input.oninput = update);
    update();
}

// ============================================================
// DIRICHLET LAB
// ============================================================

async function renderDirichletLab() {
    const a1In = document.getElementById('diri-a1');
    const a2In = document.getElementById('diri-a2');
    const a3In = document.getElementById('diri-a3');

    const update = () => {
        const a = [
            parseFloat(a1In.value),
            parseFloat(a2In.value),
            parseFloat(a3In.value)
        ];

        const numSamples = 600;
        let aPoints = [], bPoints = [], cPoints = [];

        for (let i = 0; i < numSamples; i++) {
            let samples = a.map(val => {
                let u = Math.random();
                return -Math.log(u || 0.0001) * val;
            });
            let sum = samples.reduce((prev, curr) => prev + curr, 0);
            aPoints.push(samples[0] / sum);
            bPoints.push(samples[1] / sum);
            cPoints.push(samples[2] / sum);
        }

        const trace = {
            type: 'scatterternary',
            mode: 'markers',
            a: aPoints,
            b: bPoints,
            c: cPoints,
            marker: {
                symbol: 'circle',
                color: aPoints.map((ap, i) => {
                    const dominant = Math.max(ap, bPoints[i], cPoints[i]);
                    return dominant;
                }),
                colorscale: [[0, '#6366f1'], [0.5, '#a78bfa'], [1, '#f0abfc']],
                size: 5,
                opacity: 0.55,
                line: { width: 0 }
            }
        };

        const layout = {
            ternary: {
                sum: 1,
                aaxis: { title: 'Science', min: 0.01, linewidth: 2, ticks: 'outside', tickcolor: '#94a3b8' },
                baxis: { title: 'Art', min: 0.01, linewidth: 2, ticks: 'outside', tickcolor: '#94a3b8' },
                caxis: { title: 'Sports', min: 0.01, linewidth: 2, ticks: 'outside', tickcolor: '#94a3b8' }
            },
            margin: { t: 80, b: 40, l: 40, r: 40 },
            title: {
                text: `Likely Topic Mixtures (α: ${a.map(n => n.toFixed(1)).join(', ')})`,
                y: 0.95,
                x: 0.5,
                xanchor: 'center',
                font: { size: 15, color: '#1e293b', weight: 700 }
            },
            font: { family: "'Inter', sans-serif", color: '#334155' },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };

        Plotly.react('plot-dirichlet-simplex', [trace], layout, PLOTLY_CONFIG);
    };

    [a1In, a2In, a3In].forEach(el => el.addEventListener('input', update));
    update();
}

// ============================================================
// GMM CONTEXT LAB
// ============================================================

async function renderGMMContextLab() {
    const distSlider = document.getElementById('gmm-dist');
    const varSlider = document.getElementById('gmm-var');

    const update = () => {
        const dist = parseFloat(distSlider.value);
        const variance = parseFloat(varSlider.value);

        const xValues = [], topicA = [], topicB = [], mixture = [];

        for (let x = -5; x <= 10; x += 0.1) {
            xValues.push(x);
            const pdf = (mu, sigma, xv) =>
                (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((xv - mu) / sigma, 2));

            const a = pdf(0, variance, x);
            const b = pdf(dist, variance, x);

            topicA.push(a);
            topicB.push(b);
            mixture.push((a + b) / 2);
        }

        const traceA = {
            x: xValues, y: topicA, name: 'Topic: Biology',
            type: 'scatter', fill: 'tozeroy',
            line: { color: '#6366f1', width: 2 },
            fillcolor: alphaColor('#6366f1', 0.15)
        };
        const traceB = {
            x: xValues, y: topicB, name: 'Topic: Tech',
            type: 'scatter', fill: 'tozeroy',
            line: { color: '#22c55e', width: 2 },
            fillcolor: alphaColor('#22c55e', 0.15)
        };
        const traceMix = {
            x: xValues, y: mixture, name: 'Total Probability P(x)',
            line: { color: '#1e293b', width: 3 }
        };

        Plotly.react('plot-gmm-clusters', [traceA, traceB, traceMix], mergeLayout({
            title: { text: 'Inference: Deciding between Latent Topics' },
            xaxis: { title: { text: 'Semantic Space (Word Meanings)' }, range: [-3, 8] },
            yaxis: { title: { text: 'Likelihood' }, showgrid: false },
            margin: { t: 60, b: 40, l: 50, r: 20 },
            height: 450
        }), PLOTLY_CONFIG);
    };

    distSlider.addEventListener('input', update);
    varSlider.addEventListener('input', update);
    update();
}

// ============================================================
// BAYESIAN LANGUAGE LAB
// ============================================================

async function renderBayesianLanguageLab() {
    const input = document.getElementById('bayes-text-input');

    const dict = {
        "hello": { en: 0.8, fr: 0.01, de: 0.01 },
        "the": { en: 0.7, fr: 0.05, de: 0.05 },
        "bonjour": { en: 0.01, fr: 0.9, de: 0.01 },
        "le": { en: 0.05, fr: 0.6, de: 0.05 },
        "guten": { en: 0.01, fr: 0.01, de: 0.9 },
        "tag": { en: 0.05, fr: 0.01, de: 0.7 },
        "is": { en: 0.6, fr: 0.1, de: 0.1 },
        "and": { en: 0.9, fr: 0.05, de: 0.05 },
        "und": { en: 0.05, fr: 0.05, de: 0.9 },
        "et": { en: 0.05, fr: 0.9, de: 0.05 },
        "est": { en: 0.1, fr: 0.7, de: 0.1 },
        "ist": { en: 0.1, fr: 0.1, de: 0.7 }
    };

    const update = () => {
        const words = input.value.toLowerCase().split(/[^a-z]+/);
        let scores = { English: 0.33, French: 0.33, German: 0.33 };

        words.forEach(w => {
            if (dict[w]) {
                scores.English *= dict[w].en;
                scores.French *= dict[w].fr;
                scores.German *= dict[w].de;
            }
        });

        const total = scores.English + scores.French + scores.German;
        const finalProbs = [
            scores.English / total,
            scores.French / total,
            scores.German / total
        ];

        const langColors = ['#6366f1', '#e11d48', '#eab308'];
        const maxIdx = finalProbs.indexOf(Math.max(...finalProbs));

        Plotly.react('plot-bayesian-languages', [{
            x: ['English', 'French', 'German'],
            y: finalProbs,
            type: 'bar',
            marker: {
                color: langColors.map((c, i) => i === maxIdx ? c : alphaColor(c, 0.4)),
                line: { color: langColors, width: 2 }
            },
            text: finalProbs.map(p => (p * 100).toFixed(1) + '%'),
            textposition: 'auto',
            textfont: { size: 13, weight: 700 }
        }], mergeLayout({
            title: { text: 'Bayesian Belief: What language are you using?' },
            yaxis: { title: { text: 'Probability' }, range: [0, 1] },
            height: 400
        }), PLOTLY_CONFIG);
    };

    input.addEventListener('input', update);
    update();
}

// ============================================================
// ZARATHUSTRA LAB
// ============================================================

const ZarathustraLab = {
    isLogScale: false,
    tokens: [],
    wordsToTrack: ["the", "and", "zarathustra", "god"],
    colors: ['#6366f1', '#22c55e', '#eab308', '#e11d48'],

    init: async function () {
        const slider = document.getElementById('lln-zarathustra-n');

        try {
            const response = await fetch('zarathustra.txt');
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const text = await response.text();
            this.tokens = text.toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"]/g, "")
                .split(/\s+/)
                .filter(t => t.length > 0);

            if (this.tokens.length < 10) throw new Error("Text file is too short or empty.");

            document.getElementById('lln-total-tokens').textContent = this.tokens.length;
            slider.disabled = false;

            this.render();
            this.renderMarkovLab();
            this.renderZipf();
            slider.addEventListener('input', () => this.render());

        } catch (error) {
            console.error("ZarathustraLab Failure:", error);
            document.getElementById('plot-zarathustra-convergence').innerHTML =
                `<div class="stat-empty-state">
                    <span class="stat-empty-icon">📖</span>
                    <b>File Load Error</b><br>${error.message}<br>
                    <small>Make sure 'zarathustra.txt' is in the same folder as this page.</small>
                </div>`;
        }
    },

    render: function () {
        const slider = document.getElementById('lln-zarathustra-n');
        const display = document.getElementById('lln-count-display');
        const N = parseInt(slider.value);
        display.textContent = N;

        if (this.tokens.length === 0) return;

        const traces = this.wordsToTrack.map((word, idx) => {
            let runningCount = 0;
            let x = [], y = [];

            for (let i = 0; i < N; i++) {
                if (this.tokens[i] === word) runningCount++;
                if (i < 500 || i % 20 === 0 || i === N - 1) {
                    x.push(i + 1);
                    y.push(runningCount / (i + 1));
                }
            }

            return {
                x, y,
                name: `"${word}"`,
                mode: 'lines',
                line: { color: this.colors[idx], width: 2.5, shape: 'spline' },
                hovertemplate: `Word: ${word}<br>Pos: %{x}<br>Freq: %{y:.2%}<extra></extra>`
            };
        });

        Plotly.react('plot-zarathustra-convergence', traces, mergeLayout({
            title: { text: 'Law of Large Numbers: Word Frequency Convergence' },
            xaxis: { title: { text: 'Tokens Read' } },
            yaxis: { title: { text: 'Statistical Frequency' }, tickformat: '.1%' },
            margin: { t: 50, b: 50, l: 60, r: 30 },
            hovermode: 'x unified'
        }), PLOTLY_CONFIG);
    },

    renderMarkovLab: function () {
        const selector = document.getElementById('markov-word-select');

        const update = () => {
            const target = selector.value.toLowerCase();
            const followers = {};

            for (let i = 0; i < this.tokens.length - 1; i++) {
                if (this.tokens[i] === target) {
                    const nextWord = this.tokens[i + 1];
                    followers[nextWord] = (followers[nextWord] || 0) + 1;
                }
            }

            const labels = Object.keys(followers);
            const counts = Object.values(followers);
            if (counts.length === 0) return;

            const total = counts.reduce((a, b) => a + b, 0);
            const actualProbs = counts.map(c => c / total);

            const combined = labels.map((l, i) => ({ l, p: actualProbs[i] }))
                .sort((a, b) => b.p - a.p)
                .slice(0, 15);

            const xLabels = combined.map(d => d.l);
            const sortedActual = combined.map(d => d.p);
            const theoreticalZipf = combined.map((_, i) => sortedActual[0] / (i + 1));

            const barColors = gradientBar(sortedActual, 240);

            Plotly.react('plot-markov-transitions', [
                {
                    x: xLabels,
                    y: sortedActual,
                    type: 'bar',
                    name: 'Actual Likelihood',
                    marker: {
                        color: barColors,
                        line: { color: 'rgba(255,255,255,0.6)', width: 1 }
                    }
                },
                {
                    x: xLabels,
                    y: theoreticalZipf,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Zipf Prediction',
                    line: { dash: 'dash', color: '#e11d48', width: 3 },
                    marker: { size: 8, symbol: 'diamond-open', color: '#e11d48' }
                }
            ], mergeLayout({
                title: { text: `Transition Probabilities: What follows "${target}"?` },
                xaxis: { title: { text: 'Possible Next Words (Ranked)' } },
                yaxis: { title: { text: 'Probability P(Next | Current)' }, tickformat: '.1%' },
                margin: { t: 50, b: 100 }
            }), PLOTLY_CONFIG);
        };

        selector.addEventListener('change', update);
        update();
    },

    toggleZipfScale: function () {
        this.isLogScale = !this.isLogScale;
        this.renderZipf();
    },

    renderZipf: function () {
        const statusEl = document.getElementById('zipf-status');
        if (!this.tokens || this.tokens.length === 0) {
            statusEl.textContent = "Waiting for data...";
            return;
        }

        statusEl.textContent = "Analyzing vocabulary...";

        const counts = {};
        this.tokens.forEach(t => { counts[t] = (counts[t] || 0) + 1; });

        const sortedWords = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        const ranks = [], frequencies = [], labels = [];

        sortedWords.slice(0, 500).forEach((word, index) => {
            ranks.push(index + 1);
            frequencies.push(counts[word]);
            labels.push(`Rank ${index + 1}: "${word}"`);
        });

        const trace = {
            x: ranks,
            y: frequencies,
            text: labels,
            mode: 'lines+markers',
            marker: { size: 4, color: '#6366f1' },
            line: { color: '#6366f1', width: 2 },
            name: 'Nietzsche Vocabulary'
        };

        const theoretical = {
            x: ranks,
            y: ranks.map(r => frequencies[0] / r),
            mode: 'lines',
            line: { dash: 'dash', color: alphaColor('#e11d48', 0.5), width: 2 },
            name: 'Pure Zipf Law'
        };

        Plotly.react('plot-zipf-zarathustra', [trace, theoretical], mergeLayout({
            title: { text: `Zipf Distribution in Zarathustra (${sortedWords.length} unique words)` },
            xaxis: {
                title: { text: 'Rank (1 = Most Common)' },
                type: this.isLogScale ? 'log' : 'linear'
            },
            yaxis: {
                title: { text: 'Frequency (Count)' },
                type: this.isLogScale ? 'log' : 'linear'
            },
            margin: { t: 50, b: 50, l: 60, r: 30 },
            hovermode: 'closest'
        }), PLOTLY_CONFIG);

        statusEl.textContent = "";
    }
};

// ============================================================
// LLM STATS LAB
// ============================================================

var LLMStatsLab = {
    renderBoltzmann: function () {
        var input = document.getElementById('boltz-input').value.split(',').map(Number);
        var t = parseFloat(document.getElementById('boltz-temp').value);

        var exps = input.map(z => Math.exp(z / t));
        var sumExps = exps.reduce((a, b) => a + b, 0);
        var probs = exps.map(e => e / sumExps);

        document.getElementById('boltz-eqn').innerHTML =
            `Equation: $P(i) = \\frac{e^{${input[0]}/T}}{\\sum e^{z/T}}$ <br> Result for first item: <b>${(probs[0] * 100).toFixed(2)}%</b>`;

        const barColors = gradientBar(probs, 240);

        Plotly.newPlot('boltz-plot', [{
            x: input.map((_, i) => 'Token ' + i),
            y: probs,
            type: 'bar',
            marker: {
                color: barColors,
                line: { color: 'rgba(255,255,255,0.6)', width: 1.5 }
            }
        }], mergeLayout({
            title: { text: 'Probability Distribution (Softmax)' },
            yaxis: { range: [0, 1] }
        }), PLOTLY_CONFIG);

        render_temml();
    },

    renderMLE: function ()     {
        // Reference 'this' so we can call renderMLE() from inside the click event
        const self = this;
        const plotDiv = document.getElementById('mle-plot');
        const inputEl = document.getElementById('mle-input');
        const muInput = document.getElementById('mle-mu');

        if (!plotDiv || !inputEl || !muInput) return;

        let data = inputEl.value.split(',')
            .map(x => x.trim())
            .filter(x => x !== "")
            .map(Number);

        const mu = parseFloat(muInput.value);
        const xRange = [], yGauss = [];
        let totalLikelihood = 1;

        for (let i = -5; i <= 5; i += 0.1) {
            let p = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * Math.pow(i - mu, 2));
            xRange.push(i);
            yGauss.push(p);
        }

        data.forEach(x => {
            totalLikelihood *= (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * Math.pow(x - mu, 2));
        });

        document.getElementById('mle-eqn').innerHTML =
            `$\\mathcal{L}(\\mu) = \\prod P(x_i | \\mu)$ <br> Current Likelihood: <b>${totalLikelihood.toExponential(4)}</b>`;

        const traces = [
            {
                x: xRange,
                y: yGauss,
                name: 'Gaussian Model',
                line: { color: '#6366f1', width: 3, shape: 'spline' },
                fill: 'tozeroy',
                fillcolor: alphaColor('#6366f1', 0.08)
            },
            {
                x: data,
                y: data.map(() => 0),
                mode: 'markers',
                name: 'Observed Data',
                marker: {
                    color: '#e11d48',
                    size: 12,
                    symbol: 'circle',
                    line: { color: '#fff', width: 2 }
                }
            }
        ];

        Plotly.newPlot('mle-plot', traces, mergeLayout({
            title: { text: 'Fisherian Fit: Click the Plot to Add Observations' },
            xaxis: { range: [-5, 5], fixedrange: true },
            yaxis: { range: [-0.05, 0.5], fixedrange: true },
            hovermode: 'closest'
        }), PLOTLY_CONFIG).then(() => {
            plotDiv.removeAllListeners('plotly_click');

            plotDiv.on('plotly_click', function (eventData) {
                const newX = eventData.points[0].x.toFixed(2);
                const currentVal = inputEl.value.trim();
                inputEl.value = currentVal ? `${currentVal}, ${newX}` : newX;
                self.renderMLE();
            });
        });

        if (typeof render_temml === "function") render_temml();
    },

    renderChainRule: function () {
        var p1 = parseFloat(document.getElementById('cr-p1').value) || 0;
        var p2 = parseFloat(document.getElementById('cr-p2').value) || 0;
        var p3 = parseFloat(document.getElementById('cr-p3').value) || 0;

        var c1 = p1;
        var c2 = p1 * p2;
        var c3 = p1 * p2 * p3;

        var labels = ['Step 1: P(W₁)', 'Step 2: P(W₁,W₂)', 'Step 3: P(W₁,W₂,W₃)'];
        var values = [c1, c2, c3];

        document.getElementById('cr-eqn').innerHTML =
            `<div style="display:grid; grid-template-columns: auto 1fr; gap: 4px 12px; align-items: baseline;">
                <span style="color:#94a3b8;">Step 1:</span> <span>${p1.toFixed(2)}</span>
                <span style="color:#94a3b8;">Step 2:</span> <span>${p1.toFixed(2)} × ${p2.toFixed(2)} = <strong>${c2.toFixed(4)}</strong></span>
                <span style="color:#94a3b8;">Step 3:</span> <span>${c2.toFixed(4)} × ${p3.toFixed(2)} = <strong style="color:#6366f1; font-size:1.1em;">${c3.toFixed(6)}</strong></span>
            </div>`;

        var barColors = ['#a78bfa', '#8b5cf6', '#6d28d9'];

        Plotly.newPlot('cr-plot', [{
            x: labels,
            y: values,
            type: 'bar',
            text: values.map(v => v.toFixed(4)),
            textposition: 'auto',
            textfont: { color: '#fff', weight: 700 },
            marker: {
                color: barColors,
                line: { color: 'rgba(255,255,255,0.6)', width: 1.5 }
            }
        }], mergeLayout({
            title: { text: 'Probability of the Sequence (The Chain)' },
            yaxis: {
                title: { text: 'Joint Probability' },
                range: [0, Math.max(p1, 0.1) * 1.1]
            },
            xaxis: { fixedrange: true },
            margin: { t: 50, b: 50, l: 60, r: 30 }
        }), PLOTLY_CONFIG);
    },

    renderKL: function () {
        var qMu = parseFloat(document.getElementById('kl-q-mu').value);
        var pMu = 0;
        var x = [], pY = [], qY = [];
        var kl = 0;

        for (var i = -10; i <= 10; i += 0.1) {
            var p = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * Math.pow(i - pMu, 2));
            var q = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * Math.pow(i - qMu, 2));
            x.push(i);
            pY.push(p);
            qY.push(q);
            if (p > 0.0001) kl += p * Math.log(p / q) * 0.1;
        }

        document.getElementById('kl-eqn').innerHTML =
            `$D_{KL}(P || Q) = \\sum P(x) \\log \\frac{P(x)}{Q(x)}$ <br> Divergence: <b>${kl.toFixed(4)} bits</b>`;

        var traceP = {
            x: x, y: pY, name: 'Target (P)',
            fill: 'tozeroy',
            line: { color: '#6366f1', width: 2.5 },
            fillcolor: alphaColor('#6366f1', 0.15)
        };
        var traceQ = {
            x: x, y: qY, name: 'Model (Q)',
            fill: 'tozeroy',
            line: { color: '#e11d48', width: 2.5 },
            fillcolor: alphaColor('#e11d48', 0.15)
        };

        Plotly.newPlot('kl-plot', [traceP, traceQ], mergeLayout({
            title: { text: 'KL Divergence (Area of Mismatch)' },
            height: 400
        }), PLOTLY_CONFIG);

        if (typeof render_temml === "function") render_temml();
    }
};

// ============================================================
// BAG OF WORDS
// ============================================================

async function renderBoW() {
    let text = document.getElementById('bow-input').value.toLowerCase();
    let words = text.match(/\b(\w+)\b/g) || [];

    let counts = {};
    words.forEach(function (w) {
        counts[w] = (counts[w] || 0) + 1;
    });

    let sortedKeys = Object.keys(counts).sort(function (a, b) {
        return counts[b] - counts[a];
    });
    let sortedValues = sortedKeys.map(function (k) { return counts[k]; });

    let vectorSnippet = sortedKeys.slice(0, 5).map(function (k) {
        return "\\text{" + k + "}:" + counts[k];
    }).join(", ");

    document.getElementById('bow-eqn').innerHTML =
        "<strong>Document Vector (Top 5):</strong><br>" +
        "$\\vec{V} = [ " + vectorSnippet + ", ... ]$ <br>" +
        "<small>Total Unique Dimensions (Vocabulary Size): " + sortedKeys.length + "</small>";

    const barColors = gradientBar(sortedValues, 150);

    Plotly.newPlot('bow-plot', [{
        x: sortedKeys,
        y: sortedValues,
        type: 'bar',
        marker: {
            color: barColors,
            line: { color: 'rgba(255,255,255,0.6)', width: 1 }
        }
    }], mergeLayout({
        title: { text: 'Word Frequency Distribution (The "Bag")' },
        xaxis: { title: { text: 'Vocabulary Tokens' }, tickangle: -45 },
        yaxis: { title: { text: 'Frequency' }, dtick: 1 },
        margin: { t: 50, b: 100, l: 50, r: 20 }
    }), PLOTLY_CONFIG);

    if (typeof render_temml === "function") render_temml();
}

// ============================================================
// INIT LLM STATS
// ============================================================

async function initLLMStats() {
    LLMStatsLab.renderBoltzmann();
    LLMStatsLab.renderMLE();
    LLMStatsLab.renderChainRule();
    LLMStatsLab.renderKL();
}

// ============================================================
// EXTREME VALUE + POISSON DISTRIBUTIONS
// ============================================================

async function renderExtremeLab() {
    const bernPInput = document.getElementById('bern-p');
    const gumMuInput = document.getElementById('gum-mu');
    const gumBetaInput = document.getElementById('gum-beta');

    const updateBernoulli = () => {
        const p = parseFloat(bernPInput.value);

        Plotly.newPlot('bernoulli-chart', [{
            x: ['Failure (0)', 'Success (1)'],
            y: [1 - p, p],
            type: 'bar',
            marker: {
                color: [alphaColor('#94a3b8', 0.6), alphaColor('#6366f1', 0.8)],
                line: { color: ['#64748b', '#4338ca'], width: 2 }
            },
            text: [(1 - p).toFixed(2), p.toFixed(2)],
            textposition: 'auto',
            textfont: { color: '#fff', weight: 700, size: 14 }
        }], mergeLayout({
            title: { text: `Bernoulli Trial (p=${p.toFixed(2)})` },
            yaxis: { range: [0, 1], title: { text: 'Probability' } }
        }), PLOTLY_CONFIG);
    };

    const updateGumbel = () => {
        const mu = parseFloat(gumMuInput.value);
        const beta = parseFloat(gumBetaInput.value);

        const xValues = [], yValues = [];
        for (let x = -5; x <= 20; x += 0.1) {
            const z = (x - mu) / beta;
            const pdf = (1 / beta) * Math.exp(-(z + Math.exp(-z)));
            xValues.push(x);
            yValues.push(pdf);
        }

        Plotly.newPlot('gumbel-chart', [{
            x: xValues,
            y: yValues,
            mode: 'lines',
            fill: 'tozeroy',
            line: { color: '#e11d48', width: 3, shape: 'spline' },
            fillcolor: alphaColor('#e11d48', 0.1)
        }], mergeLayout({
            title: { text: 'Gumbel PDF: Predicting the "100-Year Event"' },
            xaxis: { title: { text: 'Magnitude (e.g., Flood Height)' } },
            yaxis: { title: { text: 'Probability Density' } }
        }), PLOTLY_CONFIG);
    };

    bernPInput.addEventListener('input', updateBernoulli);
    gumMuInput.addEventListener('input', updateGumbel);
    gumBetaInput.addEventListener('input', updateGumbel);

    updateBernoulli();
    updateGumbel();
}

async function renderPoissonLab() {
    const lambdaInput = document.getElementById('poisson-lambda');
    const valDisp = document.getElementById('poisson-lambda-val');
    const lambda = parseFloat(lambdaInput.value);
    valDisp.innerText = lambda.toFixed(1);

    const xValues = [], yValues = [];

    const factorial = (n) => {
        if (n === 0) return 1;
        let res = 1;
        for (let i = 1; i <= n; i++) res *= i;
        return res;
    };

    const limit = Math.max(20, Math.ceil(lambda + 12));
    for (let k = 0; k <= limit; k++) {
        const prob = (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
        xValues.push(k);
        yValues.push(prob);
    }

    const barColors = gradientBar(yValues, 270);

    Plotly.newPlot('poisson-chart', [{
        x: xValues,
        y: yValues,
        type: 'bar',
        marker: {
            color: barColors,
            line: { color: 'rgba(255,255,255,0.5)', width: 0.5 }
        },
        name: 'P(X=k)'
    }], mergeLayout({
        title: { text: `Poisson Distribution (λ = ${lambda})` },
        xaxis: { title: { text: 'Number of Events (k)' }, dtick: 1 },
        yaxis: { title: { text: 'Probability' }, range: [0, 0.4] }
    }), PLOTLY_CONFIG);
}

// ============================================================
// LAZY LOADING FOR STATISTICS MODULE
// ============================================================

const _statLazyRegistry = [];
let _statLazyObserver = null;
let _statZarathustraInitialized = false;

function _statLazyRegister(elementId, initFn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    _statLazyRegistry.push({ el, initFn, initialized: false });
}

function _statLazyCreateObserver() {
    if (_statLazyObserver) return;

    _statLazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const match = _statLazyRegistry.find(r => r.el === entry.target);
            if (match && !match.initialized) {
                match.initialized = true;
                _statLazyObserver.unobserve(match.el);
                match.initFn();
            }
        });
    }, {
        rootMargin: typeof rootMargin !== 'undefined' ? rootMargin : '200px'
    });

    _statLazyRegistry.forEach(r => {
        if (!r.initialized) {
            _statLazyObserver.observe(r.el);
        }
    });
}

async function _statEnsureZarathustra() {
    if (_statZarathustraInitialized) return;
    _statZarathustraInitialized = true;
    await ZarathustraLab.init();
}

// ============================================================
// REPLACEMENT: loadStatisticsModule (drop-in replacement)
// ============================================================

async function loadStatisticsModule() {
    if (typeof updateLoadingStatus === 'function') {
        updateLoadingStatus("Loading section about statistics...");
    }

    _statLazyRegister('bernoulli-chart', () => renderExtremeLab());
    _statLazyRegister('dice-matrix-container', () => renderDiceDistribution());
    _statLazyRegister('plot-astro', () => renderCeresAstronomy());
    _statLazyRegister('plot-gaussian', () => renderNormalDistribution());
    _statLazyRegister('plot-clt', () => rollCLT());
    _statLazyRegister('plot-gauss-legendre', () => renderGaussLegendreComplex());
    _statLazyRegister('gumbel-chart', () => renderExtremeLab());
    _statLazyRegister('poisson-chart', () => renderPoissonLab());
    _statLazyRegister('plot-correlation', () => renderCorrelationPlayground());
    _statLazyRegister('plot-bayesian-migration', () => renderBayesianComplex());
    _statLazyRegister('plot-bayesian-languages', () => renderBayesianLanguageLab());
    _statLazyRegister('plot-entropy', () => renderEntropy());
    _statLazyRegister('z-math', () => renderStandardScaler());

    _statLazyRegister('plot-zipf-zarathustra', async () => {
        await _statEnsureZarathustra();
        ZarathustraLab.renderZipf();
    });

    _statLazyRegister('plot-dirichlet-simplex', () => renderDirichletLab());
    _statLazyRegister('plot-gmm-clusters', () => renderGMMContextLab());

    _statLazyRegister('plot-zarathustra-convergence', async () => {
        await _statEnsureZarathustra();
        ZarathustraLab.render();
    });

    _statLazyRegister('plot-markov-transitions', async () => {
        await _statEnsureZarathustra();
        ZarathustraLab.renderMarkovLab();
    });

    _statLazyRegister('markov-corpus', () => trainMarkovModel());
    _statLazyRegister('boltz-plot', () => LLMStatsLab.renderBoltzmann());
    _statLazyRegister('mle-plot', () => LLMStatsLab.renderMLE());
    _statLazyRegister('cr-plot', () => LLMStatsLab.renderChainRule());
    _statLazyRegister('kl-plot', () => LLMStatsLab.renderKL());
    _statLazyRegister('bow-plot', () => renderBoW());

    _statLazyCreateObserver();

    return Promise.resolve();
}
