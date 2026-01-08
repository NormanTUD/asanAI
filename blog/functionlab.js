function renderELI5Math() {
	const range = [];
	for (let i = -10; i <= 10; i++) range.push(i);

	const layoutBase = {
		margin: { t: 10, b: 30, l: 30, r: 10 },
		xaxis: { range: [-10, 10], fixedrange: true, zeroline: true },
		yaxis: { range: [-10, 10], fixedrange: true, zeroline: true },
		showlegend: false
	};

	// Logic for Interactive Step 2 (2D Line)
	function updatePlotLinear() {
		const a = parseFloat(document.getElementById('slider-6-a').value);
		const b = parseFloat(document.getElementById('slider-6-b').value);
		Plotly.react('plot-step-6', [{
			x: range, 
			y: range.map(x => a * x + b), 
			mode: 'lines', 
			line: {color: '#3b82f6', width: 4}
		}], layoutBase);
	}

	// Logic for Interactive Step 4 (3D Surface)
	function updatePlotSurface() {
		const a = parseFloat(document.getElementById('slider-7-a').value);
		const b = parseFloat(document.getElementById('slider-7-b').value);
		const zData = range.map(x => range.map(y => (a * x) + (b * y)));
		Plotly.react('plot-step-7', [{
			z: zData, x: range, y: range, type: 'surface', colorscale: 'Blues', showscale: false
		}], {
			margin: { t: 0, b: 0, l: 0, r: 0 },
			scene: { zaxis: {range: [-20, 20]}, camera: { eye: { x: 1.5, y: 1.5, z: 1 } } }
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
		},

		'plot-step-5': () => {
			const zWaves = range.map(x => range.map(y => Math.sin(x/2) + Math.sin(y/2)));
			Plotly.newPlot('plot-step-5', [{
				z: zWaves, x: range, y: range, type: 'surface', colorscale: 'Viridis', showscale: false
			}], {
				margin: { t: 0, b: 0, l: 0, r: 0 },
				scene: { camera: { eye: { x: 1.8, y: 1.8, z: 1.2 } } }
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
				observer.unobserve(entry.target);
			}
		});
	}, { rootMargin: '100px', threshold: 0.01 });

	document.querySelectorAll('.plot-container').forEach(el => observer.observe(el));

	// Event Listeners
	document.getElementById('slider-6-a').addEventListener('input', updatePlotLinear);
	document.getElementById('slider-6-b').addEventListener('input', updatePlotLinear);
	document.getElementById('slider-7-a').addEventListener('input', updatePlotSurface);
	document.getElementById('slider-7-b').addEventListener('input', updatePlotSurface);
}

window.addEventListener('load', renderELI5Math);
