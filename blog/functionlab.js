function renderELI5Math() {
	const range = [];
	for (let i = -10; i <= 10; i++) range.push(i);

	const layoutBase = {
		margin: { t: 10, b: 30, l: 30, r: 10 },
		xaxis: { range: [-10, 10], fixedrange: true, zeroline: true },
		yaxis: { range: [-10, 10], fixedrange: true, zeroline: true },
		showlegend: false
	};

	// Helper for Markdown Text
	function refreshMD(id, markdownText) {
		if (window.marked && window.marked.parse) {
			document.getElementById(id).innerHTML = window.marked.parse(markdownText);
		}
	}

	// Helper for Highlighting Code with Prism support
	function refreshCode(containerId, codeString) {
		if (window.marked && window.marked.parse) {
			const container = document.getElementById(containerId);
			const markdownCode = "```python\n" + codeString + "\n```";
			
			// Render the markdown to HTML
			container.innerHTML = window.marked.parse(markdownCode);
			
			// Tell Prism to highlight the newly injected code
			if (window.Prism) {
				Prism.highlightAllUnder(container);
			}
		}
	}

	function refreshMath() {
		if (window.MathJax && window.MathJax.typeset) {
			window.MathJax.typeset();
		}
	}

	function updatePlotLinear() {
		const a = parseFloat(document.getElementById('slider-6-a').value);
		const b = parseFloat(document.getElementById('slider-6-b').value);
		
		refreshMD('desc-6', `## 2. Interactive: The Straight Line\nCurrent Weight (**a**): **${a}**. Current Bias (**b**): **${b}**.`);
		
		refreshCode('code-6-container', `# Predict a value\ndef linear_predict(x, a=${a}, b=${b}):\n    return a * x + b\n\nprint(linear_predict(3)) # Result: ${((a * 3) + b).toFixed(2)}`);

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
		
		refreshMD('desc-7', `## 4. Interactive: The Slanted Plane\nX weight is **${a}** and Y weight is **${b}**.`);
		
		refreshCode('code-7-container', `# Weighted sum\ndef weighted_sum(x, y, wa=${a}, wb=${b}):\n    return (wa * x) + (wb * y)\n\nprint(weighted_sum(10, 10)) # Result: ${((a * 10) + (b * 10)).toFixed(2)}`);

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
		
		refreshMD('desc-5', `## 5. Interactive: Non-Linearity (Waves)\nFrequency: **${freq}**, Amplitude: **${amp}**.`);
		
		refreshCode('code-5-container', `import math\n\ndef wave(x, y):\n    return ${amp} * (math.sin(${freq}*x) + math.sin(${freq}*y))\n\nprint(wave(1.0, 1.0)) # Result: ${(amp * (Math.sin(freq) + Math.sin(freq))).toFixed(3)}`);

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

	document.getElementById('slider-6-a').addEventListener('input', updatePlotLinear);
	document.getElementById('slider-6-b').addEventListener('input', updatePlotLinear);
	document.getElementById('slider-7-a').addEventListener('input', updatePlotSurface);
	document.getElementById('slider-7-b').addEventListener('input', updatePlotSurface);
	document.getElementById('slider-5-freq').addEventListener('input', updatePlotWaves);
	document.getElementById('slider-5-amp').addEventListener('input', updatePlotWaves);
}

window.addEventListener('load', renderELI5Math);
