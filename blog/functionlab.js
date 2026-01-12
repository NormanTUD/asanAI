function renderELI5Math() {
	const range = [];
	for (let i = -10; i <= 10; i++) range.push(i);

	const layoutBase = {
		margin: { t: 10, b: 30, l: 30, r: 10 },
		xaxis: { range: [-10, 10], fixedrange: true, zeroline: true },
		yaxis: { range: [-10, 10], fixedrange: true, zeroline: true },
		showlegend: false
	};

	// Helper function for MathJax and Markdown
	function refreshContent(id, markdownText) {
		if (window.marked && window.marked.parse) {
			document.getElementById(id).innerHTML = window.marked.parse(markdownText);
		}
		if (window.MathJax && window.MathJax.typeset) {
			window.MathJax.typeset();
		}
	}

	function updatePlotLinear() {
		const a = parseFloat(document.getElementById('slider-6-a').value);
		const b = parseFloat(document.getElementById('slider-6-b').value);
		
		// Update Markdown
		const slopeText = a > 0 ? "climbing up" : a < 0 ? "falling down" : "perfectly flat";
		const description = `## 2. Interactive: The Straight Line
Current Weight (**a**): **${a}**. Current Bias (**b**): **${b}**. 
Because the weight is ${a}, the line is **${slopeText}**. The bias of ${b} means the line crosses the center at height ${b}.`;
		refreshContent('desc-6', description);

		// Update Code Example
		document.getElementById('code-6').textContent = `# Predict a value based on weight 'a' and bias 'b'
def linear_predict(x, a=${a}, b=${b}):
    return a * x + b

# Calculating f(3):
print(linear_predict(3)) # Output: ${((a * 3) + b).toFixed(2)}`;

		// Update Formula
		document.getElementById('formula-6').innerHTML = `$$f(x) = ${a}x + ${b}$$`;
		if (window.MathJax && window.MathJax.typeset) window.MathJax.typeset();

		Plotly.react('plot-step-6', [{
			x: range, y: range.map(x => a * x + b), 
			mode: 'lines', line: {color: '#3b82f6', width: 4}
		}], layoutBase);
	}

	function updatePlotSurface() {
		const a = parseFloat(document.getElementById('slider-7-a').value);
		const b = parseFloat(document.getElementById('slider-7-b').value);
		
		// Update Markdown
		const description = `## 4. Interactive: The Slanted Plane
We are giving X a weight of **${a}** and Y a weight of **${b}**. 
If you look at the floor, you'll see the sheet is tilted more towards the axis with the higher weight!`;
		refreshContent('desc-7', description);

		// Update Code Example
		document.getElementById('code-7').textContent = `# Weighted sum of two inputs
def weighted_sum(x, y, weight_a=${a}, weight_b=${b}):
    return (weight_a * x) + (weight_b * y)

# Calculating f(10, 10):
print(weighted_sum(10, 10)) # Output: ${((a * 10) + (b * 10)).toFixed(2)}`;

		// Update Formula
		document.getElementById('formula-7').innerHTML = `$$f(x, y) = ${a}x + ${b}y$$`;
		if (window.MathJax && window.MathJax.typeset) window.MathJax.typeset();

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
		
		// Update Markdown
		const description = `## 5. Interactive: Non-Linearity (Waves)
With a frequency of **${freq}**, the waves are packed closer together. With an amplitude of **${amp}**, the hills are **${amp} units tall**.`;
		refreshContent('desc-5', description);

		// Update Code Example
		document.getElementById('code-5').textContent = `import math

# Using a wavy function with amplitude ${amp} and frequency ${freq}
def wave_function(x, y):
    return ${amp} * (math.sin(${freq} * x) + math.sin(${freq} * y))

print(wave_function(1.0, 1.0)) # Output: ${(amp * (Math.sin(freq) + Math.sin(freq))).toFixed(3)}`;

		// Update Formula
		document.getElementById('formula-5').innerHTML = `$$f(x, y) = ${amp} \\cdot (\\sin(${freq}x) + \\sin(${freq}y))$$`;
		if (window.MathJax && window.MathJax.typeset) window.MathJax.typeset();

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
