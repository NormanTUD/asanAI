/**
 * statistics.js - Deep Theory & Random Simulations
 */

function initStatistics() {
	renderNormalDistribution();
	renderCorrelationPlayground();
	renderCeresAstronomy();
	renderBayesianUpdater();
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
        sx: document.getElementById('corr-sigma-x'),
        sy: document.getElementById('corr-sigma-y'),
        n: { value: 300 } 
    };
    const matrixDisplay = document.getElementById('cov-matrix');
    const covDefDisplay = document.getElementById('cov-definition');
    const breakdownDisplay = document.getElementById('corr-math-breakdown');

    const update = () => {
        const r = parseFloat(inputs.r.value);
        const sx = parseFloat(inputs.sx.value);
        const sy = parseFloat(inputs.sy.value);
        const n = parseInt(inputs.n.value);

        // 1. Core Statistics
        const covariance = r * sx * sy;
        const varX = sx * sx;
        const varY = sy * sy;

        // 2. Data Generation (Bivariate Normal)
        let x = [], y = [];
        for (let i = 0; i < n; i++) {
            let z1 = 0, z2 = 0;
            while(z1 === 0) z1 = Math.random();
            while(z2 === 0) z2 = Math.random();
            const norm1 = Math.sqrt(-2.0 * Math.log(z1)) * Math.cos(2.0 * Math.PI * z2);
            const norm2 = Math.sqrt(-2.0 * Math.log(z1)) * Math.sin(2.0 * Math.PI * z2);
            x.push(sx * norm1);
            y.push(sy * (r * norm1 + Math.sqrt(1 - r**2) * norm2));
        }

        // 3. Matrix Visualization
        matrixDisplay.innerText = 
            `Σ = [ ${varX.toFixed(2)}  ${covariance.toFixed(2)} ]\n` +
            `    [ ${covariance.toFixed(2)}  ${varY.toFixed(2)} ]`;

        // 4. Detailed Covariance Equation
        covDefDisplay.innerHTML = `
            $$\\text{Cov}(X,Y) = \\underbrace{${r.toFixed(2)}}_{r} \\cdot \\underbrace{${sx.toFixed(1)}}_{\\sigma_X} \\cdot \\underbrace{${sy.toFixed(1)}}_{\\sigma_Y} = ${covariance.toFixed(2)}$$
            <small style="display:block; text-align:center; color:#666;">
                $$\\text{Calculation: } E[(X - \\mu_X)(Y - \\mu_Y)]$$
            </small>
        `;

        // 5. Correlation Breakdown
        breakdownDisplay.innerHTML = `
            $$r = \\frac{\\text{Cov}(X,Y)}{\\sigma_X \\sigma_Y} = \\frac{${covariance.toFixed(2)}}{\\underbrace{${sx.toFixed(1)} \\cdot ${sy.toFixed(1)}}_{\\text{Total Scale}}} = ${r.toFixed(2)}$$
        `;

        // 6. Plotting
        const trace = {
            x: x, y: y,
            mode: 'markers',
            marker: { color: '#d946ef', size: 4, opacity: 0.5 },
            type: 'scatter'
        };

        const layout = {
            margin: { t: 10, b: 40, l: 40, r: 10 },
            xaxis: { range: [-10, 10], title: '\\text{Variable X}' },
            yaxis: { range: [-10, 10], title: '\\text{Variable Y}' },
            template: 'plotly_white'
        };

        Plotly.react('plot-correlation', [trace], layout);
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

// Bayesian Updater
function renderBayesianUpdater() {
	const priorS = document.getElementById('bay-prior');
	const likeliS = document.getElementById('bay-likeli');
	const update = () => {
		const P_A = parseFloat(priorS.value);
		const P_B_A = parseFloat(likeliS.value);
		const P_B_notA = 0.15; // False positive rate
		const P_B = (P_B_A * P_A) + (P_B_notA * (1 - P_A));
		const posterior = (P_B_A * P_A) / P_B;

		document.getElementById('bay-result-box').style.height = (posterior * 100) + '%';
		document.getElementById('bay-text').innerText = (posterior * 100).toFixed(1) + '%';
		document.getElementById('bay-eq-dynamic').innerHTML = 
			`$$P(Spam|Winner) = \\frac{${P_B_A} \\cdot ${P_A}}{${P_B.toFixed(3)}} = ${posterior.toFixed(3)}$$`;
		refreshMath();
	};
	priorS.oninput = update;
	likeliS.oninput = update;
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

window.addEventListener('load', () => {
	setTimeout(initStatistics, 200);
});
