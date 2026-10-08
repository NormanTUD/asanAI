function renderLinearSeparability() {
	const layoutBase = {
		xaxis: {
			title: 'Input A',
			range: [-0.5, 1.5],
			tickvals: [0, 1],
			ticktext: ['False (0)', 'True (1)'],
			zeroline: false,
			color: themeColor('#1e293b'),
			gridcolor: themeColor('#f1f5f9')
		},
		yaxis: {
			title: 'Input B',
			range: [-0.5, 1.5],
			tickvals: [0, 1],
			ticktext: ['False (0)', 'True (1)'],
			zeroline: false,
			color: themeColor('#1e293b'),
			gridcolor: themeColor('#f1f5f9')
		},
		margin: { l: 60, r: 40, b: 60, t: 40 },
		showlegend: false,
		plot_bgcolor: 'rgba(0,0,0,0)',
		paper_bgcolor: 'rgba(0,0,0,0)',
		font: { color: themeColor('#1e293b') }
	};

	// OR Gate Data
	const orData = [
		{ x: [0], y: [0], mode: 'markers+text', text: ['False (0)'], textposition: 'bottom center', marker: { size: 18, color: '#ef4444' } },
		{ x: [0, 1, 1], y: [1, 0, 1], mode: 'markers+text', text: ['True (1)', 'True (1)', 'True (1)'], textposition: 'top center', marker: { size: 18, color: '#22c55e' } },
		{ x: [-0.2, 1.2], y: [1.2, -0.2], mode: 'lines', line: { color: '#3b82f6', dash: 'dash', width: 3 } }
	];

	// XOR Gate Data
	const xorData = [
		{ x: [0, 1], y: [0, 1], mode: 'markers+text', text: ['False (0)', 'False (0)'], textposition: 'bottom center', marker: { size: 18, color: '#ef4444' } },
		{ x: [0, 1], y: [1, 0], mode: 'markers+text', text: ['True (1)', 'True (1)'], textposition: 'top center', marker: { size: 18, color: '#22c55e' } }
	];

	Plotly.newPlot('plot-or-gate', orData, { ...layoutBase, title: 'OR Gate: Linearly Separable' });
	Plotly.newPlot('plot-xor-gate', xorData, {
		...layoutBase,
		title: 'XOR Gate: NOT Separable',
		annotations: [{
			x: 0.5, y: 0.5, text: 'No single line can<br>separate these classes!',
			showarrow: false, font: { color: themeColor('#475569'), size: 14 }
		}]
	});
}

function renderSeparatingPlane() {
	const el = document.getElementById('plot-separating-plane');
	if (!el) { return; }
	const w1 = parseFloat(document.getElementById('plane-w1').value);
	const w2 = parseFloat(document.getElementById('plane-w2').value);
	const w3 = parseFloat(document.getElementById('plane-w3').value);
	const t = parseFloat(document.getElementById('plane-t').value);

	const planeColor = themeColor('#3b82f6');
	const axColor = themeColor('#1e293b');
	const gridColor = themeColor('#f1f5f9');
	const fontColor = themeColor('#1e293b');

	// The plane w1*x1 + w2*x2 + w3*x3 = t, clipped to the unit cube.
	// Solve for the axis with the largest |weight|; the other two axes
	// span the 21x21 grid, out-of-cube cells become null (surface hole).
	const planeTrace = (function () {
		const w = [w1, w2, w3];
		const axis = Math.abs(w[0]) >= Math.abs(w[1]) && Math.abs(w[0]) >= Math.abs(w[2]) ? 0
			: Math.abs(w[1]) >= Math.abs(w[2]) ? 1 : 2;
		if (Math.abs(w[axis]) < 1e-9) { return null; }
		const other = [0, 1, 2].filter((i) => i !== axis);
		const N = 20;
		const gx = [];
		const gy = [];
		const gz = [];
		let any = false;
		for (let a = 0; a <= N; a++) {
			const u = a / N;
			const rowX = [];
			const rowY = [];
			const rowZ = [];
			for (let b = 0; b <= N; b++) {
				const v = b / N;
				const p = [0, 0, 0];
				p[other[0]] = u;
				p[other[1]] = v;
				p[axis] = (t - w[other[0]] * u - w[other[1]] * v) / w[axis];
				const ok = p[axis] >= -1e-9 && p[axis] <= 1 + 1e-9;
				if (ok) { any = true; }
				rowX.push(ok ? p[0] : null);
				rowY.push(ok ? p[1] : null);
				rowZ.push(ok ? p[2] : null);
			}
			gx.push(rowX);
			gy.push(rowY);
			gz.push(rowZ);
		}
		if (!any) { return null; }
		return {
			type: 'surface',
			x: gx, y: gy, z: gz,
			opacity: 0.45,
			color: [planeColor],
			showsurface: true,
			showwireframe: false,
			showlegend: false,
			hoverinfo: 'skip'
		};
	})();

	// The 8 binary input corners, colored by the element's output.
	const corners = [];
	for (let i = 0; i < 8; i++) {
		const x1 = (i >> 0) & 1;
		const x2 = (i >> 1) & 1;
		const x3 = (i >> 2) & 1;
		const fires = w1 * x1 + w2 * x2 + w3 * x3 >= t;
		corners.push({
			type: 'scatter3d',
			mode: 'markers+text',
			x: [x1], y: [x2], z: [x3],
			text: [fires ? '1' : '0'],
			textposition: 'top center',
			marker: { size: 12, color: fires ? '#22c55e' : '#ef4444' },
			name: fires ? 'fires (1)' : 'silent (0)',
			showlegend: true
		});
	}

	// Unit cube wireframe.
	const cubeTrace = {
		type: 'scatter3d',
		mode: 'lines',
		x: [0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0],
		y: [0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
		z: [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 0],
		line: { color: themeColor('#94a3b8'), width: 3 },
		showlegend: false
	};

	const traces = [cubeTrace];
	if (planeTrace) { traces.push(planeTrace); }
	traces.push(...corners);

	const layout = {
		scene: {
			xaxis: { title: 'x₁', range: [-0.25, 1.25], color: axColor, gridcolor: gridColor, backgroundcolor: 'rgba(0,0,0,0)' },
			yaxis: { title: 'x₂', range: [-0.25, 1.25], color: axColor, gridcolor: gridColor, backgroundcolor: 'rgba(0,0,0,0)' },
			zaxis: { title: 'x₃', range: [-0.25, 1.25], color: axColor, gridcolor: gridColor, backgroundcolor: 'rgba(0,0,0,0)' },
			camera: { eye: { x: 1.6, y: -1.6, z: 0.9 } }
		},
		margin: { l: 0, r: 0, b: 0, t: 0 },
		showlegend: true,
		legend: { orientation: 'h', y: -0.15 },
		plot_bgcolor: 'rgba(0,0,0,0)',
		paper_bgcolor: 'rgba(0,0,0,0)',
		font: { color: fontColor },
		annotations: [{
			x: 0, y: 0, xref: 'paper', yref: 'paper',
			text: `w₁x₁ + w₂x₂ + w₃x₃ = t  →  ${w1}x₁ + ${w2}x₂ + ${w3}x₃ = ${t}`,
			showarrow: false,
			font: { size: 14, color: fontColor }
		}]
	};

	if (el.dataset.plotted) {
		Plotly.react('plot-separating-plane', traces, layout, { displayModeBar: false });
	} else {
		el.dataset.plotted = '1';
		Plotly.newPlot('plot-separating-plane', traces, layout, { displayModeBar: false });
		['plane-w1', 'plane-w2', 'plane-w3', 'plane-t'].forEach((id) => {
			document.getElementById(id).addEventListener('input', renderSeparatingPlane);
		});
	}
}

async function loadHistoryModule() {
	updateLoadingStatus("Loading section about History...");
	renderLinearSeparability();
	renderSeparatingPlane();
	return Promise.resolve();
}

if (window.__MN_DARK) {
	// Defer one tick so the helper.js global Plotly observer (also
	// scheduled via setTimeout(0) and registered first) runs first.
	// Without this, the observer would double-swap our already-themed
	// colors back to the wrong palette.
	window.__MN_DARK.onChange(() => {
		setTimeout(renderLinearSeparability, 0);
		setTimeout(renderSeparatingPlane, 0);
	});
}
