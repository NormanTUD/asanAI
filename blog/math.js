function initDataBasics() {
	renderBWTable();
	renderRGBCombinedTable();
	updateBWPreview();
	updateRGBPreview();
	refreshMath();
	renderVectorPlot();
	renderELI5Math();
	renderMovableVector();
	initLogPlot();
	initInteractiveVectorSpaces();
	initCompositionPlot();
}

function initCompositionPlot() {
	const sliders = ['a', 'b', 'c', 'd'].map(id => document.getElementById(`slider-comp-${id}`));

	function update() {
		const a = parseFloat(sliders[0].value);
		const b = parseFloat(sliders[1].value);
		const c = parseFloat(sliders[2].value);
		const d = parseFloat(sliders[3].value);

		const xValues = Array.from({length: 40}, (_, i) => (i - 20) / 2);
		const fVals = xValues.map(x => a * x + b);
		const gVals = xValues.map(x => c * x + d);
		const compVals = xValues.map(x => c * (a * x + b) + d);

		const data = [
			{ x: xValues, y: fVals, name: 'f(x)', line: {dash: 'dot', color: '#94a3b8'} },
			{ x: xValues, y: gVals, name: 'g(x)', line: {dash: 'dot', color: '#cbd5e1'} },
			{ x: xValues, y: compVals, name: '(g ∘ f)(x)', line: {width: 4, color: '#2563eb'} }
		];

		const layout = {
			margin: { t: 10, b: 30, l: 30, r: 10 },
			legend: { orientation: 'h', y: -0.2 },
			xaxis: { range: [-10, 10] },
			yaxis: { range: [-10, 10] }
		};

		Plotly.react('plot-composition', data, layout);
		document.getElementById('composition-formula').innerHTML =
			`$$(g \\circ f)(x) = ${c}(${a}x + ${b}) + ${d}$$`;
		render_temml();
	}

	sliders.forEach(s => s.addEventListener('input', update));
	update();
}

function initLogPlot() {
	const sliderBase = document.getElementById('slider-log-base');
	const sliderX = document.getElementById('slider-log-x');
	const dispBase = document.getElementById('disp-log-base');
	const dispX = document.getElementById('disp-log-x');
	const formulaContainer = document.getElementById('log-equation-display');

	function render() {
		const b = parseFloat(sliderBase.value);
		const inputX = parseFloat(sliderX.value);

		dispBase.textContent = b.toFixed(1);
		dispX.textContent = inputX.toFixed(1);

		// 1. Generate the Curve Data
		const xValues = [];
		const yValues = [];

		for (let i = 0.1; i <= 50; i += 0.5) {
			xValues.push(i);
			yValues.push(Math.log(i) / Math.log(b));
		}

		const currentY = Math.log(inputX) / Math.log(b);

		// --- Dynamic Y-Axis Logic ---
		// We find the min/max of our curve and the current point to keep them in view
		const minY = Math.min(...yValues, currentY);
		const maxY = Math.max(...yValues, currentY);
		const padding = (maxY - minY) * 0.1 || 1; // Fallback padding of 1 if flat
		// ----------------------------

		// 2. Setup Plotly Data
		const traceCurve = {
			x: xValues,
			y: yValues,
			mode: 'lines',
			name: `log base ${b.toFixed(1)}`,
			line: { color: '#2563eb', width: 3 }
		};

		const tracePoint = {
			x: [inputX],
			y: [currentY],
			mode: 'markers',
			name: 'Your Value',
			marker: { size: 12, color: '#db2777', line: {color: 'white', width: 2} }
		};

		const traceLines = {
			x: [inputX, inputX, 0],
			y: [0, currentY, currentY],
			mode: 'lines',
			showlegend: false,
			line: { color: '#94a3b8', width: 1, dash: 'dash' }
		};

		const layout = {
			title: { text: `The Logarithm`, font: {size: 16} },
			xaxis: { title: 'Input (x)', range: [0, 52], zeroline: true },
			// Updated yaxis uses dynamic range
			yaxis: { 
				title: 'Output (y)', 
				range: [minY - padding, maxY + padding], 
				zeroline: true 
			},
			margin: { l: 50, r: 20, b: 50, t: 40 },
			showlegend: false,
			hovermode: 'closest'
		};

		Plotly.react('log-plot', [traceCurve, traceLines, tracePoint], layout);

		// 3. Update Math Equation
		const tex = `$$ \\log_{${b.toFixed(1)}}(${inputX.toFixed(1)}) = ${currentY.toFixed(2)} \\iff ${b.toFixed(1)}^{${currentY.toFixed(2)}} = ${inputX.toFixed(1)} $$`;
		formulaContainer.innerHTML = tex;

		render_temml();
	}

	sliderBase.addEventListener('input', render);
	sliderX.addEventListener('input', render);

	render();
}

/**
 * Ensures numbers are whole (integers) and stay between 0 and 255
 */
function validateInput(el) {
	let val = parseFloat(el.value);

	// Default to 0 if input is empty or not a number
	if (isNaN(val)) val = 0;

	// 5.6 -> 5 (Force integer)
	let finalVal = Math.floor(val);

	// Clamp range (0-255)
	if (finalVal < 0) finalVal = 0;
	if (finalVal > 255) finalVal = 255;

	// Put the cleaned number back into the box
	el.value = finalVal;
}

function refreshMath(selector = '#section-rgb') {
	render_temml();
}

function renderBWTable() {
	const container = document.getElementById('bw-matrix-container');
	let html = '<table>';
	for(let r=0; r<3; r++) {
		html += '<tr>';
		for(let c=0; c<3; c++) {
			let val = (r === c) ? 0 : 255; // Initial pattern
			html += `<td class="bw-cell"><input type="number" value="${val}" min="0" max="255" class="bw-cell-input" oninput="validateInput(this); updateBWPreview()" style="width:55px; padding: 6px; border: 1px solid #ccc; font-weight: bold; text-align: center;"></td>`;
		}
		html += '</tr>';
	}
	container.innerHTML = html + '</table>';
}

function renderRGBCombinedTable() {
	const container = document.getElementById('rgb-combined-container');
	let html = '<table style="border-spacing: 8px; border-collapse: separate;">';

	for(let r=0; r<3; r++) {
		html += '<tr>';
		for(let c=0; c<3; c++) {
			let rv = (r === 0) ? 255 : 0;
			let gv = (r === 1) ? 255 : 0;
			let bv = (r === 2) ? 255 : 0;

			html += `
	    <td style="background: #ffffff; border: 1px solid #cbd5e0; padding: 8px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
		<div style="display: flex; flex-direction: column; gap: 5px;">
		    <div style="display: flex; align-items: center; gap: 6px;">
			<div style="width: 6px; height: 18px; background: #ef4444; border-radius: 2px;"></div>
			<input type="number" value="${rv}" class="rgb-c-r" oninput="validateInput(this); updateRGBPreview()" 
			       style="width:55px; font-size:12px; border:1px solid #fee2e2; text-align: center;">
		    </div>
		    <div style="display: flex; align-items: center; gap: 6px;">
			<div style="width: 6px; height: 18px; background: #22c55e; border-radius: 2px;"></div>
			<input type="number" value="${gv}" class="rgb-c-g" oninput="validateInput(this); updateRGBPreview()" 
			       style="width:55px; font-size:12px; border:1px solid #dcfce7; text-align: center;">
		    </div>
		    <div style="display: flex; align-items: center; gap: 6px;">
			<div style="width: 6px; height: 18px; background: #3b82f6; border-radius: 2px;"></div>
			<input type="number" value="${bv}" class="rgb-c-b" oninput="validateInput(this); updateRGBPreview()" 
			       style="width:55px; font-size:12px; border:1px solid #dbeafe; text-align: center;">
		    </div>
		</div>
	    </td>`;
		}
		html += '</tr>';
	}
	container.innerHTML = html + '</table>';
}

function updateBWPreview() {
	const canvas = document.getElementById('bw-preview-canvas');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	const imgData = ctx.createImageData(3, 3);
	const cells = document.querySelectorAll('.bw-cell-input');

	cells.forEach((cell, i) => {
		const val = parseInt(cell.value) || 0;
		imgData.data[i * 4] = val;
		imgData.data[i * 4 + 1] = val;
		imgData.data[i * 4 + 2] = val;
		imgData.data[i * 4 + 3] = 255;
	});
	ctx.putImageData(imgData, 0, 0);
}

function updateRGBPreview() {
	const canvas = document.getElementById('rgb-preview-canvas');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	const imgData = ctx.createImageData(3, 3);

	const reds = document.querySelectorAll('.rgb-c-r');
	const greens = document.querySelectorAll('.rgb-c-g');
	const blues = document.querySelectorAll('.rgb-c-b');

	for(let i=0; i<9; i++) {
		imgData.data[i * 4] = parseInt(reds[i].value) || 0;
		imgData.data[i * 4 + 1] = parseInt(greens[i].value) || 0;
		imgData.data[i * 4 + 2] = parseInt(blues[i].value) || 0;
		imgData.data[i * 4 + 3] = 255;
	}
	ctx.putImageData(imgData, 0, 0);
}

function renderVectorPlot() {
	const data = [{
		x: [0, 3],
		y: [0, 4],
		type: 'scatter',
		mode: 'lines+markers',
		marker: { size: 10, color: '#3b82f6' },
		line: { width: 4, color: '#3b82f6' },
		name: 'Vector [3, 4]'
	}];

	const layout = {
		title: 'Vector Visualization',
		xaxis: { range: [0, 5], zeroline: true, title: 'x' },
		yaxis: { range: [0, 5], zeroline: true, title: 'y' },
		margin: { l: 40, r: 40, b: 40, t: 40 },
		annotations: [{
			x: 3, y: 4,
			ax: 0, ay: 0,
			xref: 'x', yref: 'y',
			axref: 'x', ayref: 'y',
			text: '',
			showarrow: true,
			arrowhead: 2,
			arrowsize: 1,
			arrowwidth: 3,
			arrowcolor: '#3b82f6'
		}]
	};

	Plotly.newPlot('vector-plot', data, layout);
}

function renderELI5Math() {
	const range = [];
	for (let i = -10; i <= 10; i++) range.push(i);

	const layoutBase = {
		margin: { t: 10, b: 30, l: 30, r: 10 },
		xaxis: { range: [-10, 10], fixedrange: true, zeroline: true },
		yaxis: { range: [-10, 10], fixedrange: true, zeroline: true },
		showlegend: false
	};

	function refreshMath() {
		render_temml();
	}

	function updatePlotLinear() {
		const a = parseFloat(document.getElementById('slider-6-a').value);
		const b = parseFloat(document.getElementById('slider-6-b').value);

		document.getElementById('formula-6').innerHTML = `$$f(x) = \\underbrace{${a}}_ax + \\underbrace{${b}}_b$$`;
		refreshMath();

		Plotly.react('plot-step-6', [{
			x: range, y: range.map(x => a * x + b), 
			mode: 'lines', line: {color: '#3b82f6', width: 4}
		}], layoutBase);
	}

	function updatePlotSurface() {
		const a = parseFloat(document.getElementById('slider-7-a').value);
		const b = parseFloat(document.getElementById('slider-7-b').value);

		document.getElementById('formula-7').innerHTML = `$$f(x, y) = \\underbrace{${a}}_ax + \\underbrace{${b}}_by$$`;
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

		document.getElementById('formula-5').innerHTML = `$$f(x, y) = \\underbrace{${amp}}_\\text{Amplitude} \\cdot (\\sin(\\underbrace{${freq}}_\\text{Frequence}x) + \\sin(\\underbrace{${freq}}_\\text{Frequence}y))$$`;
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

function renderMovableVector() {
	const plotId = 'movable-vector-plot';

	function update() {
		const sX = document.getElementById('slider-vector-x');
		const sY = document.getElementById('slider-vector-y');
		const plotDiv = document.getElementById(plotId);

		if (!sX || !sY || !plotDiv) {
			console.error("[Vector Plot] Update aborted: Elements missing from DOM");
			return;
		}

		const startX = parseFloat(sX.value) || 0;
		const startY = parseFloat(sY.value) || 0;
		const vecX = 2; 
		const vecY = 3;

		const data = [
			{
				x: [0, vecX], y: [0, vecY],
				type: 'scatter', mode: 'lines',
				line: { dash: 'dot', color: '#cbd5e0' },
				name: 'Original'
			},
			{
				x: [startX, startX + vecX],
				y: [startY, startY + vecY],
				type: 'scatter', mode: 'lines+markers',
				marker: { size: 8, color: '#ef4444' },
				line: { width: 4, color: '#ef4444' },
				name: 'Moved Vector'
			}
		];

		const layout = {
			showlegend: false,
			xaxis: { range: [0, 10], zeroline: true, dtick: 1 },
			yaxis: { range: [0, 10], zeroline: true, dtick: 1 },
			margin: { l: 40, r: 40, b: 40, t: 40 },
			annotations: [
				{
					x: vecX, y: vecY, ax: 0, ay: 0,
					xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
					showarrow: true, arrowhead: 2, arrowcolor: '#cbd5e0'
				},
				{
					x: startX + vecX, y: startY + vecY,
					ax: startX, ay: startY,
					xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
					showarrow: true, arrowhead: 2, arrowsize: 1,
					arrowwidth: 3, arrowcolor: '#ef4444'
				}
			]
		};

		Plotly.react(plotDiv, data, layout);
	}

	// EVENT DELEGATION: Listen on the document level
	// This catches events even if the sliders are deleted and recreated
	document.addEventListener('input', function(event) {
		if (event.target.id === 'slider-vector-x' || event.target.id === 'slider-vector-y') {
			update();
		}
	});

	// Initial draw
	update();
}

/**
 * Interactive Vector Space Exploration
 * Encapsulated initialization function.
 */
/**
 * Interactive Vector Space Demonstration
 * Logic for 1D, 2D, 3D (with outline), and 4D visualization.
 */
function initInteractiveVectorSpaces() {
	const updateMath = (id, values) => {
		const el = document.getElementById(id);
		const inner = values.join(' \\\\ ');
		el.innerHTML = `$$\\vec{v} = \\begin{pmatrix} ${inner} \\end{pmatrix}$$`;
		render_temml();
	};

	// --- 1D Logic ---
	const v1s = document.getElementById('v1-slider');
	function draw1D() {
		const x = parseFloat(v1s.value);
		updateMath('v1-math', [x.toFixed(1)]);
		Plotly.react('v1-plot', [{
			x: [0, x], y: [0, 0], mode: 'lines+markers',
			line: {color: '#2563eb', width: 4}, marker: {size: 10}
		}], {
			margin: {t:0, b:20, l:20, r:20}, height: 80,
			xaxis: {range: [-6, 6]}, yaxis: {visible: false}
		});
	}

	// --- 2D Logic ---
	const v2x = document.getElementById('v2-x'), v2y = document.getElementById('v2-y');
	function draw2D() {
		const x = parseFloat(v2x.value), y = parseFloat(v2y.value);
		updateMath('v2-math', [x.toFixed(1), y.toFixed(1)]);
		Plotly.react('v2-plot', [{
			x: [0, x], y: [0, y], mode: 'lines+markers',
			line: {color: '#059669', width: 4}, marker: {size: 12}
		}], {
			margin: {t:10, b:30, l:30, r:10},
			xaxis: {range: [-6, 6], zeroline: true}, yaxis: {range: [-6, 6], zeroline: true}
		});
	}

	// --- 3D Logic (With Black Outline) ---
	const v3r = document.getElementById('v3-r'), v3g = document.getElementById('v3-g'), v3b = document.getElementById('v3-b');
	function draw3D() {
		const r = v3r.value, g = v3g.value, b = v3b.value;
		const color = `rgb(${r},${g},${b})`;
		updateMath('v3-math', [r, g, b]);

		// Trace 1: The Black Outline (slightly thicker)
		const traceOutline = {
			x: [0, r], y: [0, g], z: [0, b],
			type: 'scatter3d', mode: 'lines',
			line: {color: '#000000', width: 12},
			showlegend: false
		};

		// Trace 2: The Actual Color Vector
		const traceColor = {
			x: [0, r], y: [0, g], z: [0, b],
			type: 'scatter3d', mode: 'lines+markers',
			line: {color: color, width: 8},
			marker: {size: 4, color: '#000'},
			showlegend: false
		};

		Plotly.react('v3-plot', [traceOutline, traceColor], {
			margin: {t:0, b:0, l:0, r:0},
			uirevision: 'true',
			scene: {
				xaxis: {title: 'Red', range: [0, 255]},
				yaxis: {title: 'Green', range: [0, 255]},
				zaxis: {title: 'Blue', range: [0, 255]}
			}
		});
	}

	// --- 4D Logic ---
	const v4Inputs = [1, 2, 3, 4].map(i => document.getElementById(`v4-${i}`));
	function draw4D() {
		const vals = v4Inputs.map(el => parseInt(el.value));
		updateMath('v4-math', vals);
		Plotly.react('v4-plot', [{
			x: ['Sweet', 'Sour', 'Firm', 'Seeds'],
			y: vals,
			type: 'bar',
			marker: {color: '#7c3aed'}
		}], {
			margin: {t:10, b:40, l:30, r:10},
			yaxis: {range: [0, 10]}
		});
	}

	// Event Listeners
	v1s.oninput = draw1D;
	v2x.oninput = v2y.oninput = draw2D;
	v3r.oninput = v3g.oninput = v3b.oninput = draw3D;
	v4Inputs.forEach(el => el.oninput = draw4D);

	// Initial Renders
	draw1D(); draw2D(); draw3D(); draw4D();
}

async function loadMathLabModule() {
	updateLoadingStatus("Loading section about Math...");
	initDataBasics();
	return Promise.resolve();
}
