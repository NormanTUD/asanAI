function initDataBasics() {
	renderBWTable();
	renderRGBCombinedTable();
	updateBWPreview();
	updateRGBPreview();
	refreshMath();
	renderVectorPlot();
	renderELI5Math();
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
    if (window.MathJax && window.MathJax.typesetPromise) {
        const target = document.querySelector(selector);
        if (target) {
            // typesetPromise ist die modernere Variante für MathJax v3+
            window.MathJax.typesetPromise([target]).catch((err) => console.log(err.message));
        }
    }
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
		if (window.MathJax && window.MathJax.typeset) {
			window.MathJax.typeset();
		}
	}

	function updatePlotLinear() {
		const a = parseFloat(document.getElementById('slider-6-a').value);
		const b = parseFloat(document.getElementById('slider-6-b').value);
		
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


window.addEventListener('load', () => {
    setTimeout(initDataBasics, 200);
});
