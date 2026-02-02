/**
 * statistics.js - Deep Theory & Random Simulations
 */

function initStatistics() {
	renderNormalDistribution();
	renderDiceDistribution();
	renderGaussLegendreComplex();
	renderCorrelationPlayground();
	renderCeresAstronomy();
	renderBayesianComplex();
	renderEntropy();
	rollCLT();
	renderStandardScaler();
	renderChiSquare();
	renderDirichletLab();
	renderGMMContextLab();
	renderBayesianLanguageLab();
	renderPCALab();
	renderKDELab();
	renderDimensionLab();
}

/**
 * logic for the new Statistical LLM Labs
 */

// 1. High Dimensionality Lab
function renderDimensionLab() {
    const container = document.getElementById('dimension-dist-plot');
    const slider = document.getElementById('dim-slider');
    const valDisp = document.getElementById('dim-val');
    if (!container || !slider) return;

    function calculateDistances(dim) {
        const numPoints = 100;
        const distances = [];
        const points = Array.from({ length: numPoints }, () =>
            Array.from({ length: dim }, () => Math.random() - 0.5)
        );

        for (let i = 0; i < numPoints; i++) {
            for (let j = i + 1; j < numPoints; j++) {
                // Calculate Euclidean Distance
                let sum = 0;
                for (let k = 0; k < dim; k++) {
                    sum += Math.pow(points[i][k] - points[j][k], 2);
                }
                distances.push(Math.sqrt(sum));
            }
        }
        return distances;
    }

    function update() {
        const d = parseInt(slider.value);
        valDisp.innerText = d;
        const dists = calculateDistances(d);

        const data = [{
            x: dists,
            type: 'histogram',
            marker: { color: '#636efa' },
            nbinsx: 30
        }];

        const layout = {
            title: `Distribution of Distances in ${d} Dimensions`,
            xaxis: { title: 'Distance between random points' },
            yaxis: { title: 'Frequency' },
            margin: { t: 50 }
        };

        Plotly.newPlot(container, data, layout);
    }

    slider.addEventListener('input', update);
    update();
}

// 3. Cross-Entropy Lab
function renderLossLab() {
    const container = document.getElementById('loss-plot');
    const slider = document.getElementById('prob-slider');
    const valDisp = document.getElementById('prob-val');

    function update() {
        const p = slider.value / 100;
        valDisp.innerText = slider.value;
        const loss = -Math.log(p);

        const trace1 = {
            x: ['Model Prediction'],
            y: [p],
            type: 'bar',
            name: 'Probability of Correct Word',
            marker: { color: '#10b981' }
        };

        const trace2 = {
            x: ['Surprise (Loss)'],
            y: [loss],
            type: 'bar',
            name: 'Cross-Entropy Loss',
            marker: { color: '#ef4444' }
        };

        const layout = {
            title: 'As Confidence drops, Loss increases exponentially',
            yaxis: { range: [0, 5] },
            margin: { t: 50 }
        };

        Plotly.newPlot(container, [trace1, trace2], layout);
    }

    slider.addEventListener('input', update);
    update();
}

// Call these in your initStatistics()


function renderKDELab() {
    const container = document.getElementById('kde-plot');
    if (!container) return;
    let points = [2, 2.2, 7.5, 7.8];

    function draw() {
        const xRange = Array.from({length: 100}, (_, i) => i / 10);
        const yRange = xRange.map(x => points.reduce((acc, p) => acc + Math.exp(-0.5 * Math.pow((x - p) / 0.4, 2)), 0));

        Plotly.newPlot(container, [
            { x: xRange, y: yRange, fill: 'tozeroy', name: 'Probability Density' },
            { x: points, y: points.map(() => 0), mode: 'markers', name: 'Contexts' }
        ], { title: 'Building a Multi-modal Distribution', margin: { t: 50 } }).then(p => {
            // Re-attach listener to the Plotly-initialized container
            p.removeAllListeners('plotly_click');
            p.on('plotly_click', data => {
                points.push(data.points[0].x);
                draw();
            });
        });
    }
    draw();
}

function renderPCALab() {
    const container = document.getElementById('pca-vs-mse-plot');
    if (!container) return;

    // Data: A clear linear cluster + one "Outlier" to show the difference
    // The outlier is far in X but normal in Y, which pulls Regression less than PCA usually,
    // but here we construct it to show the visual difference in "Error Direction".
    const rawData = [
        {x: 1, y: 1.2}, {x: 1.5, y: 1.8}, {x: 2, y: 2.2}, 
        {x: 2.5, y: 1.9}, {x: 3, y: 3.1}, {x: 3.5, y: 3.5}, 
        {x: 4, y: 3.8}, {x: 4.5, y: 4.2},
        {x: 7, y: 2.0} // The Outlier (High X, Low Y)
    ];

    const xVals = rawData.map(p => p.x);
    const yVals = rawData.map(p => p.y);

    function update(mode) {
        const traces = [];

        // 1. The Data Points
        traces.push({
            x: xVals, y: yVals, mode: 'markers', type: 'scatter',
            name: 'Data Points', 
            marker: { size: 10, color: '#333' }
        });

        if (mode === 'regression') {
            // -- LINEAR REGRESSION MATH --
            // Simple Least Squares: y = mx + b
            const n = rawData.length;
            const sumX = xVals.reduce((a,b)=>a+b,0), sumY = yVals.reduce((a,b)=>a+b,0);
            const sumXY = rawData.reduce((a,p)=>a + p.x*p.y, 0);
            const sumXX = rawData.reduce((a,p)=>a + p.x*p.x, 0);
            
            const slope = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX);
            const intercept = (sumY - slope*sumX) / n;

            // The Line
            const lineX = [0, 8];
            const lineY = lineX.map(v => slope*v + intercept);

            traces.push({
                x: lineX, y: lineY, mode: 'lines',
                line: { color: '#2ca02c', width: 4 }, name: 'Prediction Line (y = mx+b)'
            });

            // The VERTICAL Errors (Residuals)
            rawData.forEach(p => {
                const predY = slope * p.x + intercept;
                traces.push({
                    x: [p.x, p.x], // X stays same
                    y: [p.y, predY], // Y moves vertically
                    mode: 'lines',
                    line: { color: 'rgba(44, 160, 44, 0.5)', width: 2, dash: 'solid' },
                    showlegend: false,
                    hoverinfo: 'skip'
                });
            });

        } else {
            // -- PCA MATH (Simplified for 2D) --
            // We center data, then find the angle that maximizes variance (Empirically here for demo stability)
            // Or roughly the regression of Y on X AND X on Y averaged.
            // For this specific dataset, we can approximate the first eigenvector visually for the demo
            // to ensure the visual "Perpendicularity" is perfect without importing a Linear Algebra library.
            
            // Calculating Centroid
            const centerX = xVals.reduce((a,b)=>a+b,0)/xVals.length;
            const centerY = yVals.reduce((a,b)=>a+b,0)/yVals.length;

            // Approximate PCA Slope (The axis of max variance)
            // Visually for this set, it points towards the cluster, ignoring the outlier slightly less than regression
            const pcaSlope = 0.55; 
            
            const lineX = [0, 8];
            const lineY = lineX.map(v => centerY + pcaSlope * (v - centerX));

            traces.push({
                x: lineX, y: lineY, mode: 'lines',
                line: { color: '#d62728', width: 4 }, name: 'Principal Component (Axis)'
            });

            // The ORTHOGONAL Errors (Projections)
            rawData.forEach(p => {
                // To find the closest point on the line y = mx + c to point (x0, y0):
                // We drop a perpendicular. 
                // The line is -mx + y = c. Normal vector is (-m, 1).
                // Intersection math...
                
                const c = centerY - pcaSlope * centerX; // y intercept of PCA line
                const m = pcaSlope;
                
                // Formula for foot of perpendicular from (x0, y0) to mx - y + c = 0
                // x = (x0 + m(y0 - c)) / (1 + m^2)
                // y = mx + c
                
                const projX = (p.x + m * (p.y - c)) / (1 + m * m);
                const projY = m * projX + c;

                traces.push({
                    x: [p.x, projX], 
                    y: [p.y, projY],
                    mode: 'lines',
                    line: { color: 'rgba(214, 39, 40, 0.5)', width: 2, dash: 'solid' },
                    showlegend: false,
                    hoverinfo: 'skip'
                });
            });
        }

        const layout = {
            title: mode === 'regression' ? 'Regression: Minimizing VERTICAL Error' : 'PCA: Minimizing PERPENDICULAR Distance',
            xaxis: { range: [0, 8], title: 'Dimension 1' },
            yaxis: { range: [0, 6], title: 'Dimension 2', scaleanchor: "x", scaleratio: 1 }, // crucial for visual 90deg
            hovermode: 'closest',
            margin: { t: 50, l: 50, r: 50, b: 50 }
        };

        Plotly.newPlot(container, traces, layout);
    }

    document.getElementById('btn-show-regression').onclick = () => update('regression');
    document.getElementById('btn-show-pca').onclick = () => update('pca');
    
    update('pca'); 
}

/**
 * Renders the Binomial/Dice Distribution logic
 */
/**
 * Renders Dice Combinations grouped by sum from left to right
 */
/**
 * Renders Dice Combinations grouped by sum from left to right
 */
function renderDiceDistribution() {
    const container = document.getElementById('dice-matrix-container');
    if (!container) return;

    // 1. Group all 36 combinations by their sum
    const groups = {};
    for (let i = 2; i <= 12; i++) groups[i] = [];

    for (let d1 = 1; d1 <= 6; d1++) {
        for (let d2 = 1; d2 <= 6; d2++) {
            groups[d1 + d2].push([d1, d2]);
        }
    }

    // 2. Prepare Container (Flexbox for horizontal columns)
    container.innerHTML = '';
    container.style.display = "flex";
    container.style.flexDirection = "row";
    container.style.alignItems = "flex-end"; // Align columns to the bottom
    container.style.justifyContent = "space-between";
    container.style.gap = "0px";
    container.style.overflowX = "auto";
    container.style.padding = "20px 0";

    // 3. Create Columns for each sum (2 to 12)
    Object.keys(groups).forEach(sum => {
        const column = document.createElement('div');
        column.style = "display: flex; flex-direction: column; gap: 8px; align-items: center; flex: 1;";

        // Add each dice pair in this sum-group
        groups[sum].forEach(pair => {
            const pairDiv = document.createElement('div');
            pairDiv.style = "display: flex; gap: 2px; padding: 4px; border: 1px solid #e2e8f0; border-radius: 4px; background: white;";
            
            // Append SVG Objects
            pairDiv.appendChild(createDiceSVG(pair[0]));
            pairDiv.appendChild(createDiceSVG(pair[1]));
            
            column.appendChild(pairDiv);
        });

        // Add Header for the column
        const label = document.createElement('div');
        label.style = "margin-top: 10px; font-weight: bold; font-family: sans-serif; text-align: center;";
        label.innerHTML = `<span style="color:#3b82f6">Sum ${sum}</span><br><small style="color:#64748b; font-weight:normal;">${groups[sum].length}/36</small>`;
        
        column.appendChild(label);
        container.appendChild(column);
    });

    // 4. Plotly Chart
    const xValues = Object.keys(groups).map(Number);
    const yValues = xValues.map(x => groups[x].length);

    const trace = {
        x: xValues,
        y: yValues,
        type: 'bar',
        //marker: { color: xValues.map(x => x === 7 ? '#ef4444' : '#3b82f6') },
        marker: { color: xValues.map(x => '#3b82f6') },
        hovertemplate: 'Sum: %{x}<br>Probability: %{y}/36<extra></extra>'
    };

    Plotly.newPlot('dice-distribution-plot', [trace], {
        title: 'The Triangular Distribution of Dice',
        xaxis: { title: 'Possible Sum', dtick: 1 },
        yaxis: { title: 'Ways to achieve', fixedrange: true },
        margin: { t: 40, b: 40, l: 40, r: 20 },
        height: 300
    });
}

// Ensure it's called in initStatistics
// initStatistics() { ... renderDiceDistribution(); ... }

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

/**
 * statistics.js - Updated Entropy Logic with Coin Example
 */

/**
 * statistics.js - Updated Entropy Step-by-Step Calculation
 */

/**
 * statistics.js - Updated Entropy with Multi-line Calculation & Curve
 */

function renderEntropy() {
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

        // Zahlen-Update (Neutraler Text, kein Orange)
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
		<p style="font-size:0.85em; color: #64748b; margin-top: 10px;">
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
            marker: { 
                color: ['#fbbf24', '#94a3b8'], // Gold für Head, Slate für Tail
                line: { width: 1, color: '#475569' }
            }
        }], {
            height: 350,
            margin: { t: 30, b: 40, l: 50, r: 20 },
            yaxis: { range: [0, 1.1], title: 'Probability (p)' },
            template: 'plotly_white'
        });

        if (typeof refreshMath === "function") refreshMath();
    };

    slider1.oninput = () => update(1);
    slider2.oninput = () => update(2);
    
    update(1);
}

let cltHistory = [];

function rollCLT() {
    const n = parseInt(document.getElementById('clt-n').value);
    const diceContainer = document.getElementById('dice-container');
    
    let sum = 0;
    let currentRoll = [];

    // 1. Roll the dice
    for (let i = 0; i < n; i++) {
        const val = Math.floor(Math.random() * 6) + 1;
        sum += val;
        currentRoll.push(val);
    }

    // 2. Add Average to history
    cltHistory.push(sum / n);
    document.getElementById('clt-count').innerText = cltHistory.length;

    // 3. Render Dice SVGs
    diceContainer.innerHTML = '';
    currentRoll.forEach(val => {
        diceContainer.appendChild(createDiceSVG(val));
    });

    updateCLTPlot();
}

function resetCLT() {
    cltHistory = [];
    document.getElementById('clt-count').innerText = "0";
    document.getElementById('dice-container').innerHTML = '<span style="color: #94a3b8; font-style: italic;">Roll the dice to see individual results here...</span>';
    updateCLTPlot();
}

function updateCLTPlot() {
    const n = parseInt(document.getElementById('clt-n').value);
    
    // Histogram of accrued data
    const traceHist = {
        x: cltHistory,
        type: 'histogram',
        histnorm: 'probability density', // Normalize so the red line (PDF) fits the scale
        nbinsx: n === 1 ? 6 : 40,
        marker: { color: 'rgba(59, 130, 246, 0.6)', line: { color: '#fff', width: 0.5 } },
        name: 'Observed Averages'
    };

    // Theoretical Gauss Curve (Normal Distribution)
    // Mean of one die is 3.5. Variance of one die is 35/12.
    // Mean of average of n dice is 3.5. Variance is (35/12) / n.
    const mu = 3.5;
    const sigma = Math.sqrt((35 / 12) / n);
    
    const xValues = [];
    const yValues = [];
    for (let x = 1; x <= 6; x += 0.05) {
        xValues.push(x);
        // Normal Distribution Formula
        const pdf = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
        yValues.push(pdf);
    }

    const traceLine = {
        x: xValues,
        y: yValues,
        mode: 'lines',
        name: 'Theoretical Gauss',
        line: { color: '#ef4444', width: 3 }
    };

    const layout = {
        title: `CLT: Distribution of Averages (n=${n} dice)`,
        xaxis: { title: 'Average Value', range: [0.8, 6.2], dtick: n === 1 ? 1 : null },
        yaxis: { title: 'Probability Density', rangemode: 'nonnegative' },
        showlegend: true,
        legend: { orientation: 'h', y: -0.2 },
        margin: { t: 50, b: 80, l: 50, r: 20 },
        template: 'plotly_white',
        bargap: 0.05
    };

    Plotly.react('plot-clt', [traceHist, traceLine], layout);
}

function createDiceSVG(value) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "30");
    svg.setAttribute("height", "30");
    svg.setAttribute("viewBox", "0 0 100 100");
    
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", "5"); rect.setAttribute("y", "5");
    rect.setAttribute("width", "90"); rect.setAttribute("height", "90");
    rect.setAttribute("rx", "12");
    rect.setAttribute("fill", "white");
    rect.setAttribute("stroke", "#475569");
    rect.setAttribute("stroke-width", "4");
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

// Standardization
function renderStandardScaler() {
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

        // Enhanced LaTeX with deep underbracing
        mathDisplay.innerHTML = `
            $$ z = \\frac{
                \\underbrace{ ${x} - ${mu} }_{ \\text{Deviation from Mean} (\\text{${deviation.toFixed(1)}}) }
            }{
                \\underbrace{ ${sigma} }_{ \\text{Standard Scale} }
            } = \\mathbf{${z.toFixed(2)}} $$
            
            <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; font-weight: 600; color: #1e293b;">Interpretation:</p>
                <p style="margin: 5px 0 0; color: #475569; font-size: 0.95em;">
                    The value <strong>${x}</strong> is <strong>${Math.abs(z).toFixed(2)}</strong> 
                    standard units ${z >= 0 ? 'above' : 'below'} the average. 
                    ${Math.abs(z) > 2 ? 'Pearson would consider this an <em>outlier</em>.' : 'This is considered a <em>typical</em> variation.'}
                </p>
            </div>
        `;

        if (typeof refreshMath === "function") {
            refreshMath();
        }
    };

    [inputX, inputMu, inputSigma].forEach(input => {
        input.oninput = update;
    });

    update();
}

function renderChiSquare() {
    const inputs = {
        obsA: document.getElementById('chi-obs-a'),
        expA: document.getElementById('chi-exp-a')
    };
    const mathDisplay = document.getElementById('chi-math-result');

    const update = () => {
        const obs = parseFloat(inputs.obsA.value);
        const exp = parseFloat(inputs.expA.value);

        // 1. Calculate Chi-Square
        const otherObs = exp * 2 - obs;
        const totalChi = (Math.pow(obs - exp, 2) / exp) + (Math.pow(otherObs - exp, 2) / exp);

        // 2. Calculate p-value via Z-score (for df=1)
        // For 1 degree of freedom, Z = sqrt(ChiSquare)
        const zScore = Math.sqrt(totalChi);
        const pValue = 1 - errorFunction(zScore / Math.sqrt(2));

        // 3. Update UI with both equations
        mathDisplay.innerHTML = `
            $$\\chi^2 = \\frac{(${obs} - ${exp})^2}{${exp}} + \\frac{(${otherObs.toFixed(0)} - ${exp})^2}{${exp}} = \\mathbf{${totalChi.toFixed(2)}}$$
            
            $$\\underbrace{p = 1 - \\text{erf}\\left(\\frac{\\sqrt{${totalChi.toFixed(2)}}}{\\sqrt{2}}\\right)}_{\\text{Integration of Normal Tail}} = \\mathbf{${pValue.toFixed(4)}}$$

            <p style="font-size:0.9em; margin-top:10px; color: ${totalChi > 3.84 ? '#d32f2f' : '#2e7d32'};">
                ${totalChi > 3.84 ? "⚠ <strong>Significant:</strong> p < 0.05. Reject the null hypothesis." : "✅ <strong>Not Significant:</strong> p > 0.05. Result is likely random."}
            </p>
        `;

        // 4. Plotly Chart
        const traces = [
            { x: ['Heads', 'Tails'], y: [obs, otherObs], name: 'Observed', type: 'bar', marker: {color: '#3b82f6'} },
            { x: ['Heads', 'Tails'], y: [exp, exp], name: 'Expected', type: 'bar', marker: {color: '#cbd5e1'} }
        ];
        
        const layout = { 
            title: 'Observed vs. Expected Counts', 
            barmode: 'group', 
            margin: { t: 40, b: 40, l: 40, r: 20 } 
        };

        Plotly.newPlot('chi-plotly-chart', traces, layout, {displayModeBar: false});

        if (typeof refreshMath === "function") refreshMath();
    };

    /**
     * Mathematical Error Function (erf) approximation
     * This is the standard way to integrate the Normal Distribution curve in JS.
     */
    function errorFunction(x) {
        const t = 1.0 / (1.0 + 0.5 * Math.abs(x));
        const ans = 1 - t * Math.exp(-x * x - 1.26551223 +
            t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + 
            t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + 
            t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
        return x >= 0 ? ans : -ans;
    }

    [inputs.obsA, inputs.expA].forEach(el => el.oninput = update);
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
            $$\\underbrace{\\text{Error}}_{\\text{Minimized}} S = \\sum \\underbrace{(y_i - \\hat{y}_i)^2}_{\\text{Squares}} = \\mathbf{${totalError.toFixed(2)}}$$
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

/**
 * Visualizes a 3-Topic Dirichlet Distribution using a Ternary Plot
 */
function renderDirichletLab() {
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
            // Sampling via Gamma distribution approximation
            let samples = a.map(val => {
                let u = Math.random();
                // Simple approximation of Gamma(alpha, 1)
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
                color: '#636efa',
                size: 5,
                opacity: 0.5,
                line: { width: 0 }
            }
        };

        const layout = {
            ternary: {
                sum: 1,
                aaxis: { title: 'Science', min: 0.01, linewidth: 2, ticks: 'outside', tickcolor: '#666' },
                baxis: { title: 'Art', min: 0.01, linewidth: 2, ticks: 'outside', tickcolor: '#666' },
                caxis: { title: 'Sports', min: 0.01, linewidth: 2, ticks: 'outside', tickcolor: '#666' }
            },
            // Margin T increased from 40 to 80 to clear the Science label
            margin: { t: 80, b: 40, l: 40, r: 40 },
            title: {
                text: `Likely Topic Mixtures (Alpha: ${a.map(n => n.toFixed(1)).join(', ')})`,
                y: 0.95, // Moves title closer to the very top edge
                x: 0.5,
                xanchor: 'center'
            },
            font: { family: 'Inter, sans-serif' },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };

        Plotly.react('plot-dirichlet-simplex', [trace], layout);
    };

    [a1In, a2In, a3In].forEach(el => el.addEventListener('input', update));
    update();
}

function renderGMMContextLab() {
	const distSlider = document.getElementById('gmm-dist');
	const varSlider = document.getElementById('gmm-var');

	const update = () => {
		const dist = parseFloat(distSlider.value);
		const variance = parseFloat(varSlider.value);

		// Generate points for two Gaussian Bell Curves (Topic A and Topic B)
		const xValues = [];
		const topicA = [];
		const topicB = [];
		const mixture = [];

		for (let x = -5; x <= 10; x += 0.1) {
			xValues.push(x);

			// Standard Normal PDF formula: (1 / (std * sqrt(2pi))) * e^(-0.5 * ((x-mu)/std)^2)
			const pdf = (mu, sigma, x) =>
				(1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));

			const a = pdf(0, variance, x);
			const b = pdf(dist, variance, x);

			topicA.push(a);
			topicB.push(b);
			mixture.push((a + b) / 2); // 50/50 Mixture
		}

		const traceA = {
			x: xValues, y: topicA, name: 'Topic: Biology',
			type: 'scatter', fill: 'tozeroy', line: {color: 'rgba(59, 130, 246, 0.5)'}
		};
		const traceB = {
			x: xValues, y: topicB, name: 'Topic: Tech',
			type: 'scatter', fill: 'tozeroy', line: {color: 'rgba(16, 185, 129, 0.5)'}
		};
		const traceMix = {
			x: xValues, y: mixture, name: 'Total Probability P(x)',
			line: {color: '#1e293b', width: 3}
		};

		const layout = {
			title: 'Inference: Deciding between Latent Topics',
			xaxis: { title: 'Semantic Space (Word Meanings)', range: [-3, 8] },
			yaxis: { title: 'Likelihood', showgrid: false },
			margin: { t: 60, b: 40, l: 50, r: 20 },
			legend: { orientation: 'h', y: -0.2 }
		};

		Plotly.react('plot-gmm-clusters', [traceA, traceB, traceMix], layout);
	};

	distSlider.addEventListener('input', update);
	varSlider.addEventListener('input', update);
	update();
}

function renderBayesianLanguageLab() {
    const input = document.getElementById('bayes-text-input');
    
    // Simple Statistical Dictionary (Likelihoods)
    const dict = {
        "hello": { en: 0.8, fr: 0.01, de: 0.01 },
        "the":   { en: 0.7, fr: 0.05, de: 0.05 },
        "bonjour": { en: 0.01, fr: 0.9, de: 0.01 },
        "le":    { en: 0.05, fr: 0.6, de: 0.05 },
        "guten": { en: 0.01, fr: 0.01, de: 0.9 },
        "tag":   { en: 0.05, fr: 0.01, de: 0.7 },
        "is":    { en: 0.6, fr: 0.1, de: 0.1 },
        "and":    { en: 0.9, fr: 0.05, de: 0.05 },
        "und":    { en: 0.05, fr: 0.05, de: 0.9 },
        "et":    { en: 0.05, fr: 0.9, de: 0.05 },
        "est":   { en: 0.1, fr: 0.7, de: 0.1 },
        "ist":   { en: 0.1, fr: 0.1, de: 0.7 }
    };

    const update = () => {
        const words = input.value.toLowerCase().split(/\s+/);
        
        // Start with a neutral "Prior" (Equally likely)
        let scores = { English: 0.33, French: 0.33, German: 0.33 };

        words.forEach(w => {
            if (dict[w]) {
                // Bayesian Update: New Prob = Old Prob * Likelihood
                scores.English *= dict[w].en;
                scores.French *= dict[w].fr;
                scores.German *= dict[w].de;
            }
        });

        // Normalize so they sum to 1 (Softmax-like)
        const total = scores.English + scores.French + scores.German;
        const finalProbs = [
            scores.English / total,
            scores.French / total,
            scores.German / total
        ];

        Plotly.react('plot-bayesian-languages', [{
            x: ['English', 'French', 'German'],
            y: finalProbs,
            type: 'bar',
            marker: { color: ['#3b82f6', '#ef4444', '#f59e0b'] }
        }], {
            title: 'Bayesian Belief: What language are you using?',
            yaxis: { title: 'Probability', range: [0, 1] }
        });
    };

    input.addEventListener('input', update);
    update();
}

/**
 * Zarathustra LLN Lab - Robust Version
 */
const ZarathustraLab = {
	isLogScale: false,
	tokens: [],
	wordsToTrack: ["the", "and", "zarathustra", "god"],
	colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],

	init: async function() {
		const statusEl = document.getElementById('lln-status');
		const slider = document.getElementById('lln-zarathustra-n');

		try {
			statusEl.textContent = "Fetching zarathustra.txt...";
			const response = await fetch('zarathustra.txt');

			if (!response.ok) {
				throw new Error(`HTTP Error: ${response.status} - Check if zarathustra.txt exists.`);
			}

			const text = await response.text();
			statusEl.textContent = "Tokenizing text...";

			// Robust tokenization
			this.tokens = text.toLowerCase()
				.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"]/g, "")
		.split(/\s+/)
		.filter(t => t.length > 0);

	    if (this.tokens.length < 10) {
		throw new Error("Text file is too short or empty.");
	    }

	    // UI Update
	    document.getElementById('lln-total-tokens').textContent = this.tokens.length;
	    slider.disabled = false;
	    statusEl.textContent = "Ready: Dataset Loaded.";
	    statusEl.style.color = "#10b981";

	    this.render();
	    this.renderMarkovLab();
	    this.renderZipf();
	    slider.addEventListener('input', () => this.render());

	} catch (error) {
	    console.error("ZarathustraLab Failure:", error);
	    statusEl.textContent = "❌ " + error.message;
	    statusEl.style.color = "#ef4444";
	    document.getElementById('plot-zarathustra-convergence').innerHTML =
		`<div style="padding:20px; text-align:center;">
					<b>File Load Error</b><br>${error.message}<br>
					<small>Make sure 'zarathustra.txt' is in the same folder as this page.</small>
					</div>`;
	}
    },

    render: function() {
	const slider = document.getElementById('lln-zarathustra-n');
	const display = document.getElementById('lln-count-display');
	const N = parseInt(slider.value);
	display.textContent = N;

	if (this.tokens.length === 0) return;

	// Process traces
	const traces = this.wordsToTrack.map((word, idx) => {
	    let runningCount = 0;
	    let x = [];
	    let y = [];

	    // Calculate running averages
	    for (let i = 0; i < N; i++) {
		if (this.tokens[i] === word) runningCount++;

		// Adaptive sampling to keep Plotly fast
		if (i < 500 || i % 20 === 0 || i === N - 1) {
		    x.push(i + 1);
		    y.push(runningCount / (i + 1));
		}
	    }

	    return {
		x: x,
		y: y,
		name: `"${word}"`,
		mode: 'lines',
		line: { color: this.colors[idx], width: 2.5 },
		hovertemplate: `Word: ${word}<br>Pos: %{x}<br>Freq: %{y:.2%}<extra></extra>`
	    };
	});

	const layout = {
	    title: 'Law of Large Numbers: Word Frequency Convergence',
	    paper_bgcolor: 'rgba(0,0,0,0)',
	    plot_bgcolor: 'rgba(0,0,0,0)',
	    xaxis: { title: 'Tokens Read', gridcolor: '#f1f5f9' },
	    yaxis: { title: 'Statistical Frequency', tickformat: '.1%', gridcolor: '#f1f5f9' },
	    margin: { t: 50, b: 50, l: 60, r: 30 },
	    hovermode: 'x unified',
	    legend: { orientation: 'h', y: -0.2 }
	};

	Plotly.react('plot-zarathustra-convergence', traces, layout);
    },
    renderMarkovLab: function() {
	    const selector = document.getElementById('markov-word-select');

	    const update = () => {
		const target = selector.value.toLowerCase();
		const followers = {};

		// Scan the entire book for the target word
		for (let i = 0; i < this.tokens.length - 1; i++) {
		    if (this.tokens[i] === target) {
			const nextWord = this.tokens[i + 1];
			followers[nextWord] = (followers[nextWord] || 0) + 1;
		    }
		}

		// Convert counts to probabilities
		const labels = Object.keys(followers);
		const counts = Object.values(followers);
		
		if (counts.length === 0) return;

		const total = counts.reduce((a, b) => a + b, 0);
		const actualProbs = counts.map(c => c / total);

		// Sort by probability to determine Rank (r)
		const combined = labels.map((l, i) => ({l, p: actualProbs[i]}))
				       .sort((a, b) => b.p - a.p)
				       .slice(0, 15); // Show top 15

		const xLabels = combined.map(d => d.l);
		const sortedActual = combined.map(d => d.p);
		
		// Calculate Theoretical Zipf: P(r) = P(1) / r
		const theoreticalZipf = combined.map((_, i) => sortedActual[0] / (i + 1));

		Plotly.react('plot-markov-transitions', [
		    {
			x: xLabels,
			y: sortedActual,
			type: 'bar',
			name: 'Actual Likelihood',
			marker: { color: '#636efa' }
		    },
		    {
			x: xLabels,
			y: theoreticalZipf,
			type: 'scatter',
			mode: 'lines+markers',
			name: 'Zipf Prediction ($1/r$)',
			line: { dash: 'dash', color: '#ef4444', width: 3 },
			marker: { size: 8, symbol: 'diamond-open' }
		    }
		], {
		    title: `Transition Probabilities: What follows "${target}"?`,
		    xaxis: { title: 'Possible Next Words (Ranked)' },
		    yaxis: { title: 'Probability $P(Next | Current)$', tickformat: '.1%' },
		    margin: { t: 50, b: 100 },
		    legend: { orientation: 'h', y: -0.2 }
		});
	    };

	    selector.addEventListener('change', update);
	    update();
	},
toggleZipfScale: function() {
    this.isLogScale = !this.isLogScale;
    this.renderZipf();
},
renderZipf: function() {
    const statusEl = document.getElementById('zipf-status');
    if (!this.tokens || this.tokens.length === 0) {
        statusEl.textContent = "Waiting for data...";
        return;
    }

    statusEl.textContent = "Analyzing vocabulary...";

    // 1. Count frequencies of every word
    const counts = {};
    this.tokens.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
    });

    // 2. Sort words by frequency (Rank them)
    const sortedWords = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

    const ranks = [];
    const frequencies = [];
    const labels = [];

    // 3. Prepare top 500 words for plotting
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
        marker: { size: 4, color: '#636efa' },
        line: { color: '#636efa', width: 2 },
        name: 'Nietzsche Vocabulary'
    };

    // 4. Theoretical Zipf Line (1/x)
    const theoretical = {
        x: ranks,
        y: ranks.map(r => frequencies[0] / r),
        mode: 'lines',
        line: { dash: 'dash', color: 'rgba(239, 68, 68, 0.5)' },
        name: 'Pure Zipf Law'
    };

    const layout = {
        title: `Zipf Distribution in Zarathustra (${sortedWords.length} unique words)`,
        xaxis: {
            title: 'Rank (1 = Most Common)',
            type: this.isLogScale ? 'log' : 'linear'
        },
        yaxis: {
            title: 'Frequency (Count)',
            type: this.isLogScale ? 'log' : 'linear'
        },
        margin: { t: 50, b: 50, l: 60, r: 30 },
        hovermode: 'closest'
    };

    Plotly.react('plot-zipf-zarathustra', [trace, theoretical], layout);
    statusEl.textContent = "Analysis Complete.";
}
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => ZarathustraLab.init());

window.addEventListener('load', () => {
	setTimeout(initStatistics, 200);
});
