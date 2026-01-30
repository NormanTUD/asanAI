/**
 * statistics.js - Deep Theory & Random Simulations
 */

function initStatistics() {
	renderNormalDistribution();
	renderGaussLegendreComplex();
	renderCorrelationPlayground();
	renderCeresAstronomy();
	renderBayesianComplex();
	renderEntropy();
	renderCLT();
	renderStandardScaler();
	renderVarianceBias();
	renderChiSquare();
}

function refreshMath() {
	if (typeof render_temml === "function") {
		render_temml();
	}
}

function renderCorrelationPlayground() {
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

        // Covariance is sensitive to scale: Cov = r * sx * sy
        const covariance = r * sx * sy;

        let x = [], y = [];
        for (let i = 0; i < n; i++) {
            let z1 = 0, z2 = 0;
            while(z1 === 0) z1 = Math.random();
            while(z2 === 0) z2 = Math.random();
            const norm1 = Math.sqrt(-2.0 * Math.log(z1)) * Math.cos(2.0 * Math.PI * z2);
            const norm2 = Math.sqrt(-2.0 * Math.log(z1)) * Math.sin(2.0 * Math.PI * z2);
            x.push(mux + (sx * norm1));
            y.push(muy + (sy * (r * norm1 + Math.sqrt(1 - r**2) * norm2)));
        }

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
            <p style="font-size:0.8em; color:gray; text-align:center;">
                (Notice: If you increase scale, Covariance grows!)
            </p>
        `;

        // Standardizing the covariance by dividing by the product of sigmas
        breakdownDisplay.innerHTML = `
            $$r = \\frac{\\text{Cov}(X,Y)}{\\sigma_X \\cdot \\sigma_Y} = \\frac{${covariance.toFixed(2)}}{\\underbrace{${sx.toFixed(1)} \\cdot ${sy.toFixed(1)}}_{${(sx*sy).toFixed(2)}}} = \\mathbf{${r.toFixed(2)}}$$
            <p style="font-size:0.8em; color:gray; text-align:center;">
                (Standardizing "cancels out" the scale to find the pure relationship)
            </p>
        `;

        Plotly.react('plot-correlation', [{
            x: x, y: y, mode: 'markers',
            marker: { color: '#d946ef', size: 4, opacity: 0.5 },
            type: 'scatter'
        }], {
            margin: { t: 10, b: 40, l: 40, r: 10 },
            xaxis: { range: [-15, 15], title: 'Variable X' },
            yaxis: { range: [-15, 15], title: 'Variable Y' },
            template: 'plotly_white'
        });
        
        if (typeof refreshMath === "function") refreshMath();
    };

    [inputs.r, inputs.sx, inputs.sy].forEach(input => {
        if(input) input.oninput = update;
    });
    update();
}

function renderCeresAstronomy() {
    const sliderSigma = document.getElementById('astro-sigma');
    if (!sliderSigma) return;

    const update = () => {
        const sigma = parseFloat(sliderSigma.value);
        
        // 1. Generate the "True Path" (The Signal)
        const xPath = [], yPath = [];
        for (let i = 0; i <= 10; i += 0.2) {
            xPath.push(i);
            yPath.push(Math.sin(i / 2) * 3 + 5); 
        }

        // 2. Generate Random Observations + Calculate Residuals (The actual errors)
        const xObs = [], yObs = [], actualErrors = [];
        for (let i = 0; i < 150; i++) { // Increased points for a better histogram fit
            const x = Math.random() * 10;
            const trueY = Math.sin(x / 2) * 3 + 5;
            
            // Box-Muller Transform
            let u = 0, v = 0;
            while(u === 0) u = Math.random();
            while(v === 0) v = Math.random();
            const noise = sigma * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
            
            xObs.push(x);
            yObs.push(trueY + noise);
            actualErrors.push(noise); // This is the "Real Data" error
        }

        // Trace 1: Theoretical Orbit
        const traceOrbit = {
            x: xPath, y: yPath, mode: 'lines', name: 'True Orbit',
            line: { color: '#2ecc71', width: 3 }, xaxis: 'x1', yaxis: 'y1'
        };

        // Trace 2: Noisy Observations
        const traceObs = {
            x: xObs, y: yObs, mode: 'markers', name: 'Observations',
            marker: { color: '#3498db', size: 5, opacity: 0.6 }, xaxis: 'x1', yaxis: 'y1'
        };

        // Trace 3: Histogram of REAL errors (The "Real" Glockenkurve)
        const traceErrorHist = {
            x: actualErrors,
            type: 'histogram',
            name: 'Actual Error Dist.',
            histnorm: 'probability density',
            marker: { color: 'rgba(52, 152, 219, 0.4)' },
            xaxis: 'x2', yaxis: 'y2',
            nbinsx: 20
        };

        // Trace 4: Theoretical PDF (The "Simulated/Ideal" Glockenkurve)
        const xBell = [], yBell = [];
        for (let i = -4; i <= 4; i += 0.1) {
            xBell.push(i);
            const pdf = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(i / sigma, 2));
            yBell.push(pdf);
        }
        const traceBell = {
            x: xBell, y: yBell, mode: 'lines', name: 'Theoretical Curve',
            line: { color: '#e74c3c', width: 2 }, xaxis: 'x2', yaxis: 'y2'
        };

        const layout = {
            grid: { rows: 1, columns: 2, pattern: 'independent' },
            title: 'Ceres: Truth vs. Noisy Observation Errors',
            xaxis: { title: 'Time / Arc', domain: [0, 0.60] },
            yaxis: { title: 'Celestial Pos', anchor: 'x1' },
            xaxis2: { title: 'Residual Error (Δ)', domain: [0.70, 1], range: [-4, 4] },
            yaxis2: { title: 'Probability Density', anchor: 'x2' },
            showlegend: false,
            template: 'plotly_white',
            margin: { t: 50, b: 50, l: 50, r: 20 }
        };

        Plotly.react('plot-astro', [traceOrbit, traceObs, traceErrorHist, traceBell], layout);
    };

    sliderSigma.oninput = update;
    update();
}

// Gaussian with Random Sampling + Theoretical Overlay
function renderNormalDistribution() {
	const sliderMu = document.getElementById('slider-mu');
	const sliderSigma = document.getElementById('slider-sigma');
	const sliderPoints = document.getElementById('gauss-points');

	function generateRandomGauss(mu, sigma) {
		let u = 0, v = 0;
		while(u === 0) u = Math.random();
		while(v === 0) v = Math.random();
		return mu + sigma * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	}

	const update = () => {
		const mu = parseFloat(sliderMu.value);
		const sigma = parseFloat(sliderSigma.value);
		const n = parseInt(sliderPoints.value);

		let samples = [];
		for(let i=0; i<n; i++) samples.push(generateRandomGauss(mu, sigma));

		// 1. The Histogram (Real Data)
		const traceHist = {
			x: samples,
			type: 'histogram',
			name: 'Random Samples',
			histnorm: 'probability density', // Scale histogram to match PDF area
			marker: { color: 'rgba(59, 130, 246, 0.5)' },
			nbinsx: 30
		};

		// 2. The Theoretical Glockenkurve (Half-Transparent)
		const xValues = [];
		const yValues = [];
		for (let i = -5; i <= 5; i += 0.1) {
			xValues.push(i);
			// PDF formula: 1 / (sigma * sqrt(2pi)) * e^(-0.5 * ((x-mu)/sigma)^2)
			const pdf = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((i - mu) / sigma, 2));
			yValues.push(pdf);
		}

		const traceCurve = {
			x: xValues,
			y: yValues,
			mode: 'lines',
			name: 'Theoretical PDF',
			line: {
				color: 'rgba(239, 68, 68, 0.5)', // Reddish, half-transparent
				width: 4,
				shape: 'spline'
			},
			fill: 'tozeroy',
			fillcolor: 'rgba(239, 68, 68, 0.1)' // Very light fill under the curve
		};

		Plotly.react('plot-gaussian', [traceHist, traceCurve], {
			margin: { t: 0, b: 30, l: 30, r: 10 },
			xaxis: { range: [-5, 5] },
			yaxis: { title: 'Density' },
			showlegend: false
		});

		document.getElementById('gauss-formula').innerHTML = 
			`$$f(x | \\mu, \\sigma^2) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}$$`;
		refreshMath();
	};

	sliderMu.oninput = update;
	sliderSigma.oninput = update;
	sliderPoints.oninput = update;
	update();
}

function renderBayesianComplex() {
    const priorIn = document.getElementById('bay-prior-new');
    const tpIn = document.getElementById('bay-tp'); 
    const fpIn = document.getElementById('bay-fp'); 
    const mathDisplay = document.getElementById('bay-math-complex');

    const update = () => {
        const P_H = parseFloat(priorIn.value);
        const P_notH = 1 - P_H;
        const P_E_H = parseFloat(tpIn.value);
        const P_E_notH = parseFloat(fpIn.value);
        
        // Numerator: The Joint Probability
        const numerator = P_E_H * P_H;
        // Denominator: Normalizing Constant
        const totalProbE = (P_E_H * P_H) + (P_E_notH * P_notH);
        const posterior = numerator / totalProbE;

        mathDisplay.innerHTML = `
            $$P(H|E) = \\frac{\\underbrace{${P_E_H} \\cdot ${P_H.toFixed(2)}}_{\\text{Signal (${numerator.toFixed(3)})}}}{\\underbrace{${numerator.toFixed(3)} + (${P_E_notH} \\cdot ${P_notH.toFixed(2)})}_{\\text{Total Evidence (${totalProbE.toFixed(3)})}}} = \\mathbf{${(posterior * 100).toFixed(1)}\\%}$$
        `;

        const tracePrior = {
            x: ['Belief'], y: [P_H], name: 'Prior', type: 'bar',
            marker: { color: '#cbd5e1' }
        };
        const tracePosterior = {
            x: ['Belief'], y: [posterior], name: 'Posterior', type: 'bar',
            marker: { color: '#3b82f6' }
        };

        Plotly.react('plot-bayesian-migration', [tracePrior, tracePosterior], {
            barmode: 'group',
            yaxis: { range: [0, 1], title: 'Confidence' },
            template: 'plotly_white',
            showlegend: true,
            margin: { t: 10, b: 30, l: 50, r: 10 }
        });

        if (typeof refreshMath === "function") refreshMath();
    };

    [priorIn, tpIn, fpIn].forEach(el => el.oninput = update);
    update();
}

// Entropy
function renderEntropy() {
	const slider = document.getElementById('ent-p');
	const update = () => {
		const p = parseFloat(slider.value);
		const q = 1 - p;
		const h = (p === 0 || p === 1) ? 0 : -(p * Math.log2(p) + q * Math.log2(q));
		document.getElementById('ent-val').innerText = h.toFixed(3);
		document.getElementById('ent-math').innerHTML = 
			`$$H(X) = -(${p.toFixed(2)} \\log_2 ${p.toFixed(2)} + ${q.toFixed(2)} \\log_2 ${q.toFixed(2)}) = ${h.toFixed(2)} \\text{ bits}$$`;
		refreshMath();
	};
	slider.oninput = update;
	update();
}

// CLT with Dice
function renderCLT() {
	const btn = document.getElementById('clt-roll');
	let means = [];
	btn.onclick = () => {
		for(let i=0; i<100; i++) {
			let sum = 0;
			for(let j=0; j<12; j++) sum += Math.floor(Math.random() * 6) + 1;
			means.push(sum / 12);
		}
		Plotly.react('plot-clt', [{ x: means, type: 'histogram', marker: {color: '#f59e0b'} }], { margin: { t: 0 } });
	};
}

// Standardization
function renderStandardScaler() {
	const inputX = document.getElementById('z-x');
	const inputMu = document.getElementById('z-mu');
	const inputSigma = document.getElementById('z-sigma');
	const update = () => {
		const x = parseFloat(inputX.value);
		const mu = parseFloat(inputMu.value);
		const sigma = parseFloat(inputSigma.value);
		const z = (x - mu) / sigma;
		document.getElementById('z-math').innerHTML = 
			`$$z = \\frac{${x} - ${mu}}{${sigma}} = ${z.toFixed(2)}$$`;
		refreshMath();
	};
	[inputX, inputMu, inputSigma].forEach(i => i.oninput = update);
	update();
}

// Bias vs Variance
function renderVarianceBias() {
	const update = () => {
		const x = [1, 2, 3, 4, 5, 6, 7, 8];
		const target = x.map(v => Math.sin(v/2) * 5);

		// High Bias: Just a straight line (Underfitting)
		const highBias = x.map(v => 2); 
		// High Variance: Wiggly line through every point (Overfitting)
		const highVar = x.map((v, i) => target[i] + (i % 2 === 0 ? 2 : -2));

		Plotly.react('plot-vb', [
			{ x, y: target, name: 'True Pattern', mode: 'lines', line: {dash: 'dot'} },
			{ x, y: highBias, name: 'High Bias', mode: 'lines+markers' },
			{ x, y: highVar, name: 'High Variance', mode: 'lines+markers' }
		], { margin: { t: 0 }, legend: {orientation: 'h'} });
	};
	update();
}

// Chi Square
function renderChiSquare() {
	const obs = document.getElementById('chi-obs');
	const update = () => {
		const O = parseInt(obs.value);
		const E = 50; // Expected
		const chiVal = Math.pow(O - E, 2) / E;
		document.getElementById('chi-math').innerHTML = 
			`$$\\chi^2 = \\frac{(O - E)^2}{E} = \\frac{(${O} - ${E})^2}{${E}} = ${chiVal.toFixed(2)}$$`;
		refreshMath();
	};
	obs.oninput = update;
	update();
}

function renderGaussLegendreComplex() {
    const noiseIn = document.getElementById('gl-noise-new');
    const nIn = document.getElementById('gl-n-new');
    const mathDisplay = document.getElementById('gl-math-complex');

    const update = () => {
        const noise = parseFloat(noiseIn.value);
        const n = parseInt(nIn.value);

        // Generate points along y = x with noise
        const x = Array.from({length: n}, (_, i) => i);
        const yTrue = x.map(v => v);
        const yObs = x.map(v => v + (Math.random() - 0.5) * noise * 2);

        // Simple Least Squares Fit
        const xSum = x.reduce((a, b) => a + b, 0);
        const ySum = yObs.reduce((a, b) => a + b, 0);
        const slope = (n * x.reduce((a, b, i) => a + b * yObs[i], 0) - xSum * ySum) /
                      (n * x.reduce((a, b) => a + b * b, 0) - xSum * xSum);
        const intercept = (ySum - slope * xSum) / n;

        const yFit = x.map(v => slope * v + intercept);
        const totalError = yObs.reduce((a, b, i) => a + Math.pow(b - yFit[i], 2), 0);

        mathDisplay.innerHTML = `
            $$\\text{Minimized Error } S = \\sum \\underbrace{(y_i - \\hat{y}_i)^2}_{\\text{Squares}} = \\mathbf{${totalError.toFixed(2)}}$$
            <p style="font-size:0.9em; color:#92400e;">Gauss showed that minimizing $S$ is equivalent to maximizing the likelihood of the orbit.</p>
        `;

        const traces = [
            { x, y: yObs, mode: 'markers', name: 'Noisy Observations', marker: {color: '#d97706'} },
            { x, y: yFit, mode: 'lines', name: 'Least Squares Fit', line: {color: '#1e293b'} }
        ];

        // Add visual "Error Squares"
        yObs.forEach((val, i) => {
            const diff = val - yFit[i];
            traces.push({
                x: [x[i], x[i], x[i] + diff, x[i] + diff, x[i]],
                y: [yFit[i], val, val, yFit[i], yFit[i]],
                fill: 'toself', fillcolor: 'rgba(217, 119, 6, 0.1)',
                line: {width: 0}, showlegend: false
            });
        });

        Plotly.react('plot-gauss-legendre', traces, {
            xaxis: { title: 'Time / Position' },
            yaxis: { title: 'Observed Coordinate' },
            template: 'plotly_white',
            margin: { t: 10, b: 40, l: 40, r: 10 }
        });

        if (typeof refreshMath === "function") refreshMath();
    };

    [noiseIn, nIn].forEach(el => el.oninput = update);
    update();
}

window.addEventListener('load', () => {
	setTimeout(initStatistics, 200);
});
