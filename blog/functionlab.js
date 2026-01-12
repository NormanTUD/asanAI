function renderELI5Math() {
	const range = [];
	for (let i = -10; i <= 10; i++) range.push(i);

	const layoutBase = {
		margin: { t: 10, b: 30, l: 30, r: 10 },
		xaxis: { range: [-10, 10], fixedrange: true, zeroline: true },
		yaxis: { range: [-10, 10], fixedrange: true, zeroline: true },
		showlegend: false
	};

	// Helper function to render MathJax
	function refreshMath() {
		if (window.MathJax && window.MathJax.typeset) {
			window.MathJax.typeset();
		}
	}

	function updatePlotLinear() {
		const a = parseFloat(document.getElementById('slider-6-a').value);
		const b = parseFloat(document.getElementById('slider-6-b').value);
		
		// Update Formula
		document.getElementById('formula-6').innerHTML = `$$f(x) = ${a}x + ${b}$$`;
		refreshMath();

		Plotly.react('plot-step-6', [{
			x: range, y: range.map(x => a * x + b), 
			mode: 'lines', line: {color: '#3b82f6', width: 4}
		}], layoutBase);
	}

	function updatePlotSurface() {
		const a = parseFloat(document.getElementById('slider-7-a').value);
		const b = parseFloat(document.getElementById('slider-7-b').value);
		
		// Update Formula
		document.getElementById('formula-7').innerHTML = `$$f(x, y) = ${a}x + ${b}y$$`;
		refreshMath();

		const zData = range.map(x => range.map(y => (a * x) + (b * y)));
		Plotly.react('plot-step-7', [{
			z: zData, x: range, y: range, type: 'surface', colorscale: 'Blues', showscale: false
		}], {
			margin: { t: 0, b: 0, l: 0, r: 0 },
			scene: { zaxis: {range: [-20, 20]}, camera: { eye: { x: 1.5, y: 1.5, z: 1 } } }
		});
	}

	function updatePlotWaves() {
		const freq = parseFloat(document.getElementById('slider-5-freq').value);
		const amp = parseFloat(document.getElementById('slider-5-amp').value);
		
		// Update Formula
		document.getElementById('formula-5').innerHTML = `$$f(x, y) = ${amp} \\cdot (\\sin(${freq}x) + \\sin(${freq}y))$$`;
		refreshMath();

		const zWaves = range.map(x => range.map(y => amp * (Math.sin(x * freq) + Math.sin(y * freq))));
		Plotly.react('plot-step-5', [{
			z: zWaves, x: range, y: range, type: 'surface', colorscale: 'Viridis', showscale: false
		}], {
			margin: { t: 0, b: 0, l: 0, r: 0 },
			scene: { zaxis: {range: [-10, 10]}, camera: { eye: { x: 1.8, y: 1.8, z: 1.2 } } }
		});
	}

	const plotJobs = {
		'plot-step-1': () => Plotly.newPlot('plot-step-1', [{
			x: range, y: range, mode: 'lines', line: {color: '#333', width: 3}
		}], layoutBase),

		'plot-step-4': () => {
			const zData = range.map(x => range.map(y => x + y));
			Plotly.newPlot('plot-step-4', [{
				z: zData, x: range, y: range, type: 'surface', colorscale: 'Greys', showscale: false
			}], {
				margin: { t: 0, b: 0, l: 0, r: 0 },
				scene: { camera: { eye: { x: 1.5, y: 1.5, z: 1 } } }
			});
		}
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const id = entry.target.id;
				if (plotJobs[id]) plotJobs[id]();
				if (id === 'plot-step-6') updatePlotLinear();
				if (id === 'plot-step-7') updatePlotSurface();
				if (id === 'plot-step-5') updatePlotWaves();
				observer.unobserve(entry.target);
			}
		});
	}, { rootMargin: '100px', threshold: 0.01 });

	document.querySelectorAll('.plot-container').forEach(el => observer.observe(el));

	// Listeners for Sliders
	document.getElementById('slider-6-a').addEventListener('input', updatePlotLinear);
	document.getElementById('slider-6-b').addEventListener('input', updatePlotLinear);
	document.getElementById('slider-7-a').addEventListener('input', updatePlotSurface);
	document.getElementById('slider-7-b').addEventListener('input', updatePlotSurface);
	document.getElementById('slider-5-freq').addEventListener('input', updatePlotWaves);
	document.getElementById('slider-5-amp').addEventListener('input', updatePlotWaves);
}

window.addEventListener('load', renderELI5Math);
