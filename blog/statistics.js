/**
 * statistics.js - Deep Theory & Random Simulations
 */

function initStatistics() {
	renderNormalDistribution();
	renderCorrelationPlayground();
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

// Gaussian with Random Sampling
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

		const trace = {
			x: samples,
			type: 'histogram',
			name: 'Random Samples',
			marker: { color: 'rgba(59, 130, 246, 0.5)' },
			nbinsx: 30
		};

		Plotly.react('plot-gaussian', [trace], {
			margin: { t: 0, b: 30, l: 30, r: 10 },
			xaxis: { range: [-5, 5] }
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

// Correlation
function renderCorrelationPlayground() {
	const slider = document.getElementById('corr-strength');
	const update = () => {
		const r = parseFloat(slider.value);
		let x = [], y = [];
		for (let i = 0; i < 200; i++) {
			let vx = (Math.random() * 2 - 1);
			let noise = (Math.random() * 2 - 1) * Math.sqrt(1 - r * r);
			x.push(vx);
			y.push(r * vx + noise * 0.4);
		}
		Plotly.react('plot-correlation', [{ x, y, mode: 'markers', marker: {color: '#d946ef'} }], { margin: { t: 0 } });
		document.getElementById('cov-matrix').innerText = `[ 1.00  ${r.toFixed(2)} ]\n[ ${r.toFixed(2)}  1.00 ]`;
		refreshMath();
	};
	slider.oninput = update;
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
