let optInterval = null;
let pathX = [];
let pathY = [];
let currentX = -3.5;
let isRunning = false;

// Optimizer Internal States
let velocity = 0;
let m = 0, v = 0, t = 0;

// The objective function: f(x) = e^(0.5x) + e^(-0.5x) + 0.1x²
// This creates a smooth valley with gentle slopes — ideal for demonstrating optimizer behavior.
const f = (x) => Math.exp(0.5 * x) + Math.exp(-0.5 * x) + 0.1 * x * x;

// The derivative (gradient): f'(x) = 0.5e^(0.5x) - 0.5e^(-0.5x) + 0.2x
const df = (x) => 0.5 * Math.exp(0.5 * x) - 0.5 * Math.exp(-0.5 * x) + 0.2 * x;

// Optimizer description texts for the info banner
const optimizerInfo = {
	sgd: `<b>📘 SGD (Stochastic Gradient Descent):</b> The simplest optimizer. It computes the gradient at the current position and takes a fixed-size step downhill. No memory of past steps.<br><b>Update rule:</b> <code>x ← x − lr × gradient</code>`,
	momentum: `<b>📘 SGD + Momentum:</b> Adds a velocity term that accumulates past gradients, like a ball rolling downhill with inertia. Helps power through flat regions and small bumps.<br><b>Update rule:</b> <code>v ← 0.9 × v + 0.1 × gradient</code>, then <code>x ← x − lr × v</code>`,
	adam: `<b>📘 Adam (Adaptive Moment Estimation):</b> Tracks both the mean and variance of recent gradients to automatically tune the effective learning rate per parameter. The industry standard.<br><b>Update rule:</b> <code>x ← x − lr × m̂ / (√v̂ + ε)</code> where m̂ and v̂ are bias-corrected moment estimates.`
};

function updateInfoBanner() {
	const type = document.getElementById('opt-type').value;
	const banner = document.getElementById('opt-info-banner');
	if (banner && optimizerInfo[type]) {
		banner.innerHTML = optimizerInfo[type];
	}
}

function updateStats(xVal, lossVal, gradVal, steps) {
	const statX = document.getElementById('stat-x');
	const statLoss = document.getElementById('stat-loss');
	const statGrad = document.getElementById('stat-grad');
	const statSteps = document.getElementById('stat-steps');

	if (statX) statX.innerText = xVal !== null ? xVal.toFixed(4) : '—';
	if (statLoss) statLoss.innerText = lossVal !== null ? lossVal.toFixed(4) : '—';
	if (statGrad) {
		if (gradVal !== null) {
			statGrad.innerText = gradVal.toFixed(4);
			// Color-code gradient: red for large, green for near-zero
			const absGrad = Math.abs(gradVal);
			if (absGrad < 0.01) {
				statGrad.style.color = '#10b981'; // green — converged
			} else if (absGrad < 0.5) {
				statGrad.style.color = '#f59e0b'; // amber — moderate
			} else {
				statGrad.style.color = '#ef4444'; // red — steep
			}
		} else {
			statGrad.innerText = '—';
			statGrad.style.color = '#0f172a';
		}
	}
	if (statSteps) statSteps.innerText = steps;
}

function toggleOptimizer() {
	if (isRunning) {
		pauseOptimizer();
	} else {
		startOptimizer();
	}
}

function startOptimizer() {
	const type = document.getElementById('opt-type').value;
	const lr = parseFloat(document.getElementById('opt-lr').value);
	const maxEpochs = parseInt(document.getElementById('opt-epochs').value);
	const consoleLog = document.getElementById('opt-console');
	const mainBtn = document.getElementById('btn-run-opt');
	const restartBtn = document.getElementById('btn-restart-opt');

	let stepsTaken = 0;
	isRunning = true;
	mainBtn.innerHTML = "⏸ Pause Training";
	restartBtn.style.display = "block";

	// Disable parameter controls while running
	document.getElementById('opt-type').disabled = true;
	document.getElementById('opt-start-x').disabled = true;

	const typeLabels = { sgd: 'SGD', momentum: 'Momentum', adam: 'Adam' };
	consoleLog.innerHTML = `<span style="color: #60a5fa">━━━ Starting ${typeLabels[type]} | LR: ${lr} | from x₀ = ${currentX.toFixed(2)} ━━━</span><br>` + consoleLog.innerHTML;

	optInterval = setInterval(() => {
		const grad = df(currentX);
		t++; // Total steps across all sessions for Adam bias correction
		stepsTaken++;

		let prevX = currentX;

		// Gradient Descent Logic
		if (type === 'sgd') {
			currentX = currentX - lr * grad;
		}
		else if (type === 'momentum') {
			const beta = 0.9;
			velocity = beta * velocity + (1 - beta) * grad;
			currentX = currentX - lr * velocity;
		}
		else if (type === 'adam') {
			const b1 = 0.9, b2 = 0.999, eps = 1e-8;
			m = b1 * m + (1 - b1) * grad;
			v = b2 * v + (1 - b2) * (grad * grad);
			const mHat = m / (1 - Math.pow(b1, t));
			const vHat = v / (1 - Math.pow(b2, t));
			currentX = currentX - lr * mHat / (Math.sqrt(vHat) + eps);
		}

		const currentLoss = f(currentX);
		const stepSize = Math.abs(currentX - prevX);

		pathX.push(currentX);
		pathY.push(currentLoss);
		updateOptPlot();
		updateStats(currentX, currentLoss, grad, t);

		// Detailed Logging with color-coded gradient
		const gradColor = Math.abs(grad) < 0.01 ? '#10b981' : (Math.abs(grad) < 0.5 ? '#f59e0b' : '#ef4444');
		const logEntry = `<span style="color: #94a3b8">Step ${String(t).padStart(3, ' ')}:</span> x = <b>${currentX.toFixed(5)}</b> | loss = ${currentLoss.toFixed(5)} | grad = <span style="color:${gradColor}">${grad.toFixed(5)}</span> | Δx = ${stepSize.toFixed(5)}`;
		consoleLog.innerHTML = `<div>${logEntry}</div>` + consoleLog.innerHTML;

		// Convergence detection
		if (Math.abs(grad) < 0.001 && stepsTaken > 5) {
			const convergeMsg = `<b style="color: #10b981">✓ Converged at step ${t}! x = ${currentX.toFixed(5)}, loss = ${currentLoss.toFixed(5)} (gradient ≈ 0)</b>`;
			pauseOptimizer(convergeMsg);
			return;
		}

		// Divergence detection
		if (Math.abs(currentX) > 50 || !isFinite(currentX)) {
			const divergeMsg = `<b style="color: #ef4444">✗ Diverged! The learning rate is too high. x has exploded to ${currentX.toFixed(2)}. Try reducing the learning rate.</b>`;
			pauseOptimizer(divergeMsg);
			return;
		}

		// Stop when the requested number of epochs is reached
		if (stepsTaken >= maxEpochs) {
			const finalMsg = `<b style="color: #60a5fa">Completed ${maxEpochs} steps. Final x = ${currentX.toFixed(5)}, loss = ${currentLoss.toFixed(5)}</b>`;
			pauseOptimizer(finalMsg);
		}
	}, 100);
}

function pauseOptimizer(msg = "⏸ Paused — click 'Continue Training' to resume.") {
	clearInterval(optInterval);
	isRunning = false;
	document.getElementById('btn-run-opt').innerHTML = "▶ Continue Training";
	document.getElementById('opt-console').innerHTML = `<div>${msg}</div>` + document.getElementById('opt-console').innerHTML;

	// Re-enable controls
	document.getElementById('opt-type').disabled = false;
	document.getElementById('opt-start-x').disabled = false;
}

function resetOptimizer() {
	clearInterval(optInterval);
	isRunning = false;

	currentX = parseFloat(document.getElementById('opt-start-x').value);
	pathX = [currentX];
	pathY = [f(currentX)];

	// Reset optimizer memory
	velocity = 0; m = 0; v = 0; t = 0;

	// Re-enable controls
	document.getElementById('opt-type').disabled = false;
	document.getElementById('opt-start-x').disabled = false;

	document.getElementById('btn-run-opt').innerHTML = "▶ Start Simulation";
	document.getElementById('btn-restart-opt').style.display = "none";
	document.getElementById('opt-console').innerHTML = "Reset to starting position. Adjust parameters and click <b>'Start Simulation'</b>.<br>";

	updateStats(currentX, f(currentX), df(currentX), 0);
	updateOptPlot();
}

function updateOptPlot() {
	const xBase = [], yBase = [];
	for (let x = -5; x <= 5; x += 0.05) {
		xBase.push(x);
		yBase.push(f(x));
	}

	// Find and mark the global minimum for reference
	let minX = xBase[0], minY = yBase[0];
	for (let i = 1; i < xBase.length; i++) {
		if (yBase[i] < minY) {
			minX = xBase[i];
			minY = yBase[i];
		}
	}

	const data = [
		// Loss landscape
		{
			x: xBase, y: yBase,
			name: 'Loss Landscape',
			line: { color: '#94a3b8', width: 2, shape: 'spline' },
			fill: 'tozeroy',
			fillcolor: 'rgba(148, 163, 184, 0.08)',
			hovertemplate: 'x: %{x:.3f}<br>loss: %{y:.3f}<extra>Landscape</extra>'
		},
		// Global minimum marker
		{
			x: [minX], y: [minY],
			name: 'Global Minimum',
			mode: 'markers',
			marker: { size: 10, color: '#6366f1', symbol: 'star', line: { color: '#4f46e5', width: 1 } },
			hovertemplate: 'Global Min<br>x: %{x:.3f}<br>loss: %{y:.3f}<extra></extra>'
		},
		// Optimization path
		{
			x: pathX, y: pathY,
			name: 'Optimization Path',
			mode: 'lines+markers',
			marker: { color: '#ef4444', size: 4, opacity: 0.7 },
			line: { color: '#ef4444', width: 2 },
			hovertemplate: 'Step path<br>x: %{x:.4f}<br>loss: %{y:.4f}<extra></extra>'
		},
		// Current position (large green dot)
		{
			x: [currentX], y: [f(currentX)],
			name: 'Current Position',
			mode: 'markers+text',
			marker: { size: 16, color: '#10b981', symbol: 'circle', line: { color: '#059669', width: 2 } },
			text: [`x=${currentX.toFixed(2)}`],
			textposition: 'top center',
			textfont: { size: 11, color: '#059669', family: 'monospace' },
			hovertemplate: '<b>Current</b><br>x: %{x:.5f}<br>loss: ' + f(currentX).toFixed(5) + '<extra></extra>'
		}
	];

	const layout = {
		margin: { t: 10, b: 40, l: 50, r: 10 },
		showlegend: true,
		legend: { x: 0.01, y: 0.99, bgcolor: 'rgba(255,255,255,0.85)', bordercolor: '#e2e8f0', borderwidth: 1, font: { size: 11 } },
		xaxis: {
			range: [-5, 5], fixedrange: true, gridcolor: '#f1f5f9',
			title: { text: 'Weight (x)', font: { size: 12, color: '#64748b' } }
		},
		yaxis: {
			range: [-1, 20], fixedrange: true, gridcolor: '#f1f5f9',
			title: { text: 'Loss f(x)', font: { size: 12, color: '#64748b' } }
		},
		plot_bgcolor: '#ffffff',
		paper_bgcolor: '#ffffff',
		hoverlabel: { bgcolor: '#1e293b', font: { color: '#f8fafc', size: 12 } }
	};

	Plotly.react('plot-optimizer', data, layout, { displayModeBar: false });
}

function initOptimizerLab() {
	const startInput = document.getElementById('opt-start-x');
	const startValLabel = document.getElementById('opt-start-val');
	const lrInput = document.getElementById('opt-lr');
	const lrValLabel = document.getElementById('opt-lr-val');
	const lrWarning = document.getElementById('opt-lr-warning');
	const optTypeSelect = document.getElementById('opt-type');

	currentX = parseFloat(startInput.value);
	pathX = [currentX];
	pathY = [f(currentX)];

	updateOptPlot();
	updateInfoBanner();
	updateStats(currentX, f(currentX), df(currentX), 0);

	// Reset and update info banner when optimizer type changes
	optTypeSelect.onchange = () => {
		updateInfoBanner();
		resetOptimizer();
	};

	// Live update when sliding start position (only when not running)
	startInput.oninput = (e) => {
		const val = parseFloat(e.target.value);
		if (startValLabel) startValLabel.innerText = `x₀ = ${val.toFixed(1)}`;
		if (!isRunning) {
			currentX = val;
			pathX = [currentX];
			pathY = [f(currentX)];
			updateStats(currentX, f(currentX), df(currentX), 0);
			updateOptPlot();
		}
	};

	// Live update for learning rate slider with warning threshold
	lrInput.oninput = (e) => {
		const val = parseFloat(e.target.value);
		if (lrValLabel) lrValLabel.innerText = `LR = ${val}`;

		// Show warning when learning rate is dangerously high
		if (lrWarning) {
			if (val >= 0.35) {
				lrWarning.style.display = 'block';
			} else {
				lrWarning.style.display = 'none';
			}
		}
	};

	// Prevent epoch input from going below 1 or above 500
	const epochsInput = document.getElementById('opt-epochs');
	if (epochsInput) {
		epochsInput.onchange = (e) => {
			let val = parseInt(e.target.value);
			if (isNaN(val) || val < 1) val = 1;
			if (val > 500) val = 500;
			e.target.value = val;
		};
	}
}

async function loadOptimizerModule() {
	updateLoadingStatus("Loading section about Optimizers...");
	initOptimizerLab();
	return Promise.resolve();
}
