function initTaylorSeries() {
	const sliderTaylor = document.getElementById('slider-taylor-n');

	function factorial(n) {
		let r = 1;
		for (let i = 2; i <= n; i++) r *= i;
		return r;
	}

	function sinTaylor(x, N) {
		let sum = 0;
		for (let n = 0; n < N; n++) {
			sum += Math.pow(-1, n) * Math.pow(x, 2 * n + 1) / factorial(2 * n + 1);
		}
		return sum;
	}

	function updateTaylor() {
		const N = parseInt(sliderTaylor.value);
		document.getElementById('disp-taylor-n').textContent = N;

		// Build formula string
		const terms = [];
		for (let n = 0; n < N; n++) {
			const sign = n === 0 ? '' : (n % 2 === 0 ? ' + ' : ' - ');
			const exp = 2 * n + 1;
			const denom = factorial(exp);
			if (n === 0) {
				terms.push('\\theta');
			} else {
				terms.push(`${sign}\\frac{\\theta^{${exp}}}{${denom}}`);
			}
		}
		document.getElementById('taylor-formula').innerHTML =
			`$$\\sin\\theta \\approx ${terms.join('')}$$`;
		render_temml();

		const xVals = [], yTrue = [], yApprox = [];
		for (let t = -2 * Math.PI; t <= 2 * Math.PI; t += 0.05) {
			xVals.push(t);
			yTrue.push(Math.sin(t));
			yApprox.push(sinTaylor(t, N));
		}

		const data = [
			{ x: xVals, y: yTrue, mode: 'lines', line: { color: '#94a3b8', width: 2, dash: 'dot' }, name: 'True sin θ' },
			{ x: xVals, y: yApprox, mode: 'lines', line: { color: '#dc2626', width: 3 }, name: `Taylor (${N} term${N > 1 ? 's' : ''})` },
		];

		const layout = {
			margin: { t: 10, b: 40, l: 40, r: 10 },
			xaxis: { title: 'θ (radians)', range: [-2 * Math.PI, 2 * Math.PI], zeroline: true },
			yaxis: { title: 'Value', range: [-3, 3], zeroline: true },
			legend: { orientation: 'h', y: -0.25 },
		};

		Plotly.react('plot-taylor', data, layout);
	}

	sliderTaylor.addEventListener('input', updateTaylor);
	updateTaylor();
}

async function loadAppendixModule() {
	initTaylorSeries();
}
