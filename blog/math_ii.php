<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Basic Math Concepts II — Linear Algebra for AI
description: Vector spaces, tensors, function composition, Hadamard product, matrix transposition.
icon: &#128290;
part: 1
order: 3
color: accent
topics: math-ii
-->

<script>
// ── Lazy-render infrastructure ──────────────────────────────────────────────
// Tracks which plot containers are currently visible.
const _visiblePlots = new Set();
// Stores the latest render function for each plot so we can replay it on scroll-in.
const _pendingRenders = {};

/**
 * Central IntersectionObserver for ALL 3D (and other heavy) plots.
 * When a plot enters the viewport we render it (using the latest pending state
 * if one was queued while it was off-screen).
 */
const _plotVisibilityObserver = new IntersectionObserver(
	(entries) => {
		entries.forEach((entry) => {
			const id = entry.target.id;
			if (entry.isIntersecting) {
				_visiblePlots.add(id);
				// If a render was queued while off-screen, execute it now.
				if (_pendingRenders[id]) {
					_pendingRenders[id]();
				}
			} else {
				_visiblePlots.delete(id);
			}
		});
	},
	{ rootMargin: rootMargin, threshold: 0 }
);

/**
 * Conditionally render a plot.
 *  – If the container is in (or near) the viewport → render immediately.
 *  – Otherwise → stash the render callback so it fires when the user scrolls to it.
 */
function lazyRender(plotId, renderFn) {
	// Always save the latest state so it's never lost.
	_pendingRenders[plotId] = renderFn;

	if (_visiblePlots.has(plotId)) {
		renderFn();
	}
	// else: renderFn will be called by the observer when the element scrolls in.
}

/**
 * Start observing a plot container. Call once per plot after the DOM is ready.
 */
function observePlot(plotId) {
	const el = document.getElementById(plotId);
	if (el) _plotVisibilityObserver.observe(el);
}

// ── Application bootstrap ───────────────────────────────────────────────────

function initDataBasics() {
	// ── Cheap / global work – always run immediately ──
	refreshMath();

	// ── Everything else – deferred until its section scrolls near ──

	lazyInit('bw-matrix-container', () => {
		renderBWTable();
		updateBWPreview();
	});

	lazyInit('rgb-combined-container', () => {
		renderRGBCombinedTable();
		updateRGBPreview();
	});

	lazyInit('vector-plot',           renderVectorPlot);
	lazyInit('movable-vector-plot',   renderMovableVector);
	lazyInit('log-plot',              initLogPlot);
	lazyInit('plot-composition',      initCompositionPlot);
	lazyInit('hadamard-display',      initHadamard);

	// ELI5Math already has internal lazy-render logic for its 3-D plots,
	// but we still defer the whole setup until the first ELI5 element is near.
	lazyInit('plot-step-1',           renderELI5Math);

	// Interactive vector spaces (1D–4D); the 3D sub-plot already uses lazyRender internally.
	lazyInit('v1-plot',               initInteractiveVectorSpaces);
}

// ── Hadamard ────────────────────────────────────────────────────────────────

function initHadamard() {
	['h-a1', 'h-a2', 'h-a3', 'h-b1', 'h-b2', 'h-b3'].forEach((id) => {
		document.getElementById(id).addEventListener('input', runHadamardExperiment);
	});
	runHadamardExperiment();
}

// ── Composition Plot ────────────────────────────────────────────────────────

function initCompositionPlot() {
	const sliders = ['a', 'b', 'c', 'd'].map((id) =>
		document.getElementById(`slider-comp-${id}`)
	);

	function update() {
		const a = parseFloat(sliders[0].value);
		const b = parseFloat(sliders[1].value);
		const c = parseFloat(sliders[2].value);
		const d = parseFloat(sliders[3].value);

		const xValues = Array.from({ length: 40 }, (_, i) => (i - 20) / 2);
		const fVals = xValues.map((x) => a * x + b);
		const gVals = xValues.map((x) => c * x + d);
		const compVals = xValues.map((x) => c * (a * x + b) + d);

		const data = [
			{ x: xValues, y: fVals, name: 'f(x)', line: { dash: 'dot', color: themeColor('#94a3b8') } },
			{ x: xValues, y: gVals, name: 'g(x)', line: { dash: 'dot', color: themeColor('#cbd5e1') } },
			{
				x: xValues,
				y: compVals,
				name: '(g ∘ f)(x)',
				line: { width: 4, color: '#2563eb' },
			},
		];

		const layout = {
			paper_bgcolor: themeColor('#ffffff'),
			plot_bgcolor: themeColor('#f8fafc'),
			font: { color: themeColor('#1e293b') },
			margin: { t: 10, b: 30, l: 30, r: 10 },
			legend: { orientation: 'h', y: -0.2, font: { color: themeColor('#1e293b') } },
			xaxis: { range: [-10, 10], gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
			yaxis: { range: [-10, 10], gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
		};

		Plotly.react('plot-composition', data, layout);
		document.getElementById('composition-formula').innerHTML =
			`$$(g \\circ f)(x) = ${c}(${a}x + ${b}) + ${d}$$`;
		render_temml();
	}

	sliders.forEach((s) => s.addEventListener('input', update));
	update();
}

// ── Log Plot ────────────────────────────────────────────────────────────────

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

		const xValues = [];
		const yValues = [];
		for (let i = 0.1; i <= 50; i += 0.5) {
			xValues.push(i);
			yValues.push(Math.log(i) / Math.log(b));
		}

		const currentY = Math.log(inputX) / Math.log(b);
		const minY = Math.min(...yValues, currentY);
		const maxY = Math.max(...yValues, currentY);
		const padding = (maxY - minY) * 0.1 || 1;

		const traceCurve = {
			x: xValues,
			y: yValues,
			mode: 'lines',
			name: `log base ${b.toFixed(1)}`,
			line: { color: '#2563eb', width: 3 },
		};
		const tracePoint = {
			x: [inputX],
			y: [currentY],
			mode: 'markers',
			name: 'Your Value',
			marker: { size: 12, color: '#db2777', line: { color: 'white', width: 2 } },
		};
		const traceLines = {
			x: [inputX, inputX, 0],
			y: [0, currentY, currentY],
			mode: 'lines',
			showlegend: false,
			line: { color: themeColor('#94a3b8'), width: 1, dash: 'dash' },
		};

		const layout = {
			paper_bgcolor: themeColor('#ffffff'),
			plot_bgcolor: themeColor('#f8fafc'),
			font: { color: themeColor('#1e293b') },
			title: { text: 'The Logarithm', font: { size: 16, color: themeColor('#1e293b') } },
			xaxis: { title: { text: 'Input (x)', font: { color: themeColor('#64748b') } }, range: [0, 52], zeroline: true, gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
			yaxis: {
				title: { text: 'Output (y)', font: { color: themeColor('#64748b') } },
				range: [minY - padding, maxY + padding],
				zeroline: true,
				gridcolor: themeColor('#f1f5f9'),
				zerolinecolor: themeColor('#cbd5e1'),
				tickfont: { color: themeColor('#64748b') },
			},
			margin: { l: 50, r: 20, b: 50, t: 40 },
			showlegend: false,
			hovermode: 'closest',
		};

		Plotly.react('log-plot', [traceCurve, traceLines, tracePoint], layout);

		const tex = `$$ \\log_{${b.toFixed(1)}}(${inputX.toFixed(1)}) = ${currentY.toFixed(
			2
		)} \\iff ${b.toFixed(1)}^{${currentY.toFixed(2)}} = ${inputX.toFixed(1)} $$`;
		formulaContainer.innerHTML = tex;
		render_temml();
	}

	sliderBase.addEventListener('input', render);
	sliderX.addEventListener('input', render);
	render();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function validateInput(el) {
	let val = parseFloat(el.value);
	if (isNaN(val)) val = 0;
	let finalVal = Math.floor(val);
	if (finalVal < 0) finalVal = 0;
	if (finalVal > 255) finalVal = 255;
	el.value = finalVal;
}

function refreshMath(selector = '#section-rgb') {
	render_temml();
}

// ── BW / RGB tables & previews ──────────────────────────────────────────────

function renderBWTable() {
	const container = document.getElementById('bw-matrix-container');
	let html = '<table>';
	for (let r = 0; r < 3; r++) {
		html += '<tr>';
		for (let c = 0; c < 3; c++) {
			let val = r === c ? 0 : 255;
			html += `<td class="bw-cell"><input type="number" value="${val}" min="0" max="255" class="bw-cell-input" id="bw_image_cell_${r}_${c}" oninput="validateInput(this); updateBWPreview()" style="width:55px; padding: 6px; border: 1px solid ${themeColor('#e2e8f0')}; font-weight: bold; text-align: center;"></td>`;
		}
		html += '</tr>';
	}
	container.innerHTML = html + '</table>';
}

function renderRGBCombinedTable() {
	const container = document.getElementById('rgb-combined-container');
	let html =
		'<table style="border-spacing: 8px; border-collapse: separate;">';
	for (let r = 0; r < 3; r++) {
		html += '<tr>';
		for (let c = 0; c < 3; c++) {
			let rv = r === 0 ? 255 : 0;
			let gv = r === 1 ? 255 : 0;
			let bv = r === 2 ? 255 : 0;
			html += `
			<td style="background: ${themeColor('#ffffff')}; border: 1px solid ${themeColor('#cbd5e1')}; padding: 8px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
				<div style="display: flex; flex-direction: column; gap: 5px;">
					<div style="display: flex; align-items: center; gap: 6px;">
						<div style="width: 6px; height: 18px; background: #ef4444; border-radius: 2px;"></div>
						<input type="number" value="${rv}" class="rgb-c-r" id="rgb_image_${r}_${c}_red" oninput="validateInput(this); updateRGBPreview()" style="width:55px; font-size:12px; border:1px solid ${themeColor('#fee2e2')}; text-align: center;">
					</div>
					<div style="display: flex; align-items: center; gap: 6px;">
						<div style="width: 6px; height: 18px; background: #22c55e; border-radius: 2px;"></div>
						<input type="number" value="${gv}" class="rgb-c-g" id="rgb_image_${r}_${c}_green" oninput="validateInput(this); updateRGBPreview()" style="width:55px; font-size:12px; border:1px solid ${themeColor('#dcfce7')}; text-align: center;">
					</div>
					<div style="display: flex; align-items: center; gap: 6px;">
						<div style="width: 6px; height: 18px; background: #3b82f6; border-radius: 2px;"></div>
						<input type="number" value="${bv}" class="rgb-c-b" id="rgb_image_${r}_${c}_blue" oninput="validateInput(this); updateRGBPreview()" style="width:55px; font-size:12px; border:1px solid ${themeColor('#dbeafe')}; text-align: center;">
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
	for (let i = 0; i < 9; i++) {
		imgData.data[i * 4] = parseInt(reds[i].value) || 0;
		imgData.data[i * 4 + 1] = parseInt(greens[i].value) || 0;
		imgData.data[i * 4 + 2] = parseInt(blues[i].value) || 0;
		imgData.data[i * 4 + 3] = 255;
	}
	ctx.putImageData(imgData, 0, 0);
}

// ── Simple vector plot (static) ─────────────────────────────────────────────

function renderVectorPlot() {
	const data = [
		{
			x: [0, 3],
			y: [0, 4],
			type: 'scatter',
			mode: 'lines+markers',
			marker: { size: 10, color: '#3b82f6' },
			line: { width: 4, color: '#3b82f6' },
			name: 'Vector [3, 4]',
		},
	];
	const layout = {
		paper_bgcolor: themeColor('#ffffff'),
		plot_bgcolor: themeColor('#f8fafc'),
		font: { color: themeColor('#1e293b') },
		title: { text: 'Vector Visualization', font: { color: themeColor('#1e293b') } },
		xaxis: { range: [0, 5], zeroline: true, title: { text: 'x', font: { color: themeColor('#64748b') } }, gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
		yaxis: { range: [0, 5], zeroline: true, title: { text: 'y', font: { color: themeColor('#64748b') } }, gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
		margin: { l: 40, r: 40, b: 40, t: 40 },
		annotations: [
			{
				x: 3, y: 4, ax: 0, ay: 0,
				xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
				text: '', showarrow: true,
				arrowhead: 2, arrowsize: 1, arrowwidth: 3, arrowcolor: '#3b82f6',
			},
		],
	};
	Plotly.newPlot('vector-plot', data, layout);
}

// ── ELI5 Math plots (mixed 2-D and 3-D) ────────────────────────────────────
// 3-D plots: plot-step-4, plot-step-5, plot-step-7  → lazy-rendered
// 2-D plots: plot-step-1, plot-step-6              → rendered on first view,
//            then always updated immediately by sliders (cheap)

function renderELI5Math() {
	const range = [];
	for (let i = -10; i <= 10; i++) range.push(i);

	const layoutBase = {
		paper_bgcolor: themeColor('#ffffff'),
		plot_bgcolor: themeColor('#f8fafc'),
		font: { color: themeColor('#1e293b') },
		margin: { t: 10, b: 30, l: 30, r: 10 },
		xaxis: { range: [-10, 10], fixedrange: true, zeroline: true, gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
		yaxis: { range: [-10, 10], fixedrange: true, zeroline: true, gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
		showlegend: false,
	};

	// ── 2-D: Linear (plot-step-6) ──
	function updatePlotLinear() {
		const a = parseFloat(document.getElementById('slider-6-a').value);
		const b = parseFloat(document.getElementById('slider-6-b').value);

		document.getElementById('formula-6').innerHTML =
			`$$f(x) = \\underbrace{${a}}_ax + \\underbrace{${b}}_b$$`;
		render_temml();

		Plotly.react(
			'plot-step-6',
			[
				{
					x: range,
					y: range.map((x) => a * x + b),
					mode: 'lines',
					line: { color: '#3b82f6', width: 4 },
				},
			],
			layoutBase
		);
	}

	// ── 3-D: Surface (plot-step-7) — LAZY ──
	function updatePlotSurface() {
		const a = parseFloat(document.getElementById('slider-7-a').value);
		const b = parseFloat(document.getElementById('slider-7-b').value);

		// Always update the formula text (cheap)
		document.getElementById('formula-7').innerHTML =
			`$$f(x, y) = \\underbrace{${a}}_ax + \\underbrace{${b}}_by$$`;
		render_temml();

		// Lazy-render the expensive 3-D surface
		lazyRender('plot-step-7', () => {
			const zData = range.map((x) => range.map((y) => a * x + b * y));
			Plotly.react(
				'plot-step-7',
				[
					{
						z: zData,
						x: range,
						y: range,
						type: 'surface',
						colorscale: 'Blues',
						showscale: false,
					},
				],
				{
					paper_bgcolor: themeColor('#ffffff'),
					plot_bgcolor: themeColor('#f8fafc'),
					font: { color: themeColor('#1e293b') },
					margin: { t: 0, b: 0, l: 0, r: 0 },
					scene: {
						xaxis: { gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
						yaxis: { gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
						zaxis: { range: [-20, 20], gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
						camera: { eye: { x: 1.5, y: 1.5, z: 1 } },
					},
				}
			);
		});
	}

	// ── 3-D: Waves (plot-step-5) — LAZY ──
	function updatePlotWaves() {
		const freq = parseFloat(document.getElementById('slider-5-freq').value);
		const amp = parseFloat(document.getElementById('slider-5-amp').value);

		document.getElementById('formula-5').innerHTML =
			`$$f(x, y) = \\underbrace{${amp}}_\\text{Amplitude} \\cdot (\\sin(\\underbrace{${freq}}_\\text{Frequence}x) + \\sin(\\underbrace{${freq}}_\\text{Frequence}y))$$`;
		render_temml();

		lazyRender('plot-step-5', () => {
			const zWaves = range.map((x) =>
				range.map((y) => amp * (Math.sin(x * freq) + Math.sin(y * freq)))
			);
			Plotly.react(
				'plot-step-5',
				[
					{
						z: zWaves,
						x: range,
						y: range,
						type: 'surface',
						colorscale: 'Viridis',
						showscale: false,
					},
				],
				{
					paper_bgcolor: themeColor('#ffffff'),
					plot_bgcolor: themeColor('#f8fafc'),
					font: { color: themeColor('#1e293b') },
					margin: { t: 0, b: 0, l: 0, r: 0 },
					scene: {
						xaxis: { gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
						yaxis: { gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
						zaxis: { range: [-10, 10], gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
						camera: { eye: { x: 1.8, y: 1.8, z: 1.2 } },
					},
				}
			);
		});
	}

	// ── 3-D: Static f(x,y)=x+y (plot-step-4) — LAZY ──
	function renderStep4() {
		lazyRender('plot-step-4', () => {
			const zData = range.map((x) => range.map((y) => x + y));
			Plotly.newPlot(
				'plot-step-4',
				[
					{
						z: zData,
						x: range,
						y: range,
						type: 'surface',
						colorscale: 'Greys',
						showscale: false,
					},
				],
				{
					paper_bgcolor: themeColor('#ffffff'),
					plot_bgcolor: themeColor('#f8fafc'),
					font: { color: themeColor('#1e293b') },
					margin: { t: 0, b: 0, l: 0, r: 0 },
					scene: {
						xaxis: { gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
						yaxis: { gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
						zaxis: { gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
						camera: { eye: { x: 1.5, y: 1.5, z: 1 } }
					},
				}
			);
		});
	}

	// ── First-view observer for 2-D plots (one-shot) ──
	const oneshotJobs = {
		'plot-step-1': () =>
			Plotly.newPlot(
				'plot-step-1',
				[
					{
						x: range,
						y: range,
						mode: 'lines',
						line: { color: themeColor('#333'), width: 3 },
					},
				],
				layoutBase
			),
		'plot-step-6': updatePlotLinear,
	};

	const oneshotObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const id = entry.target.id;
					if (oneshotJobs[id]) oneshotJobs[id]();
					oneshotObserver.unobserve(entry.target);
				}
			});
		},
		{ rootMargin: rootMargin, threshold: 0 }
	);

	// Observe 2-D one-shot plots
	['plot-step-1', 'plot-step-6'].forEach((id) => {
		const el = document.getElementById(id);
		if (el) oneshotObserver.observe(el);
	});

	// Observe 3-D lazy plots with the global visibility observer
	['plot-step-4', 'plot-step-5', 'plot-step-7'].forEach(observePlot);

	// Fire initial lazy renders (will only actually draw if in view)
	renderStep4();
	updatePlotSurface();
	updatePlotWaves();

	// Slider listeners — always call the update functions (they internally use lazyRender)
	document.getElementById('slider-6-a').addEventListener('input', updatePlotLinear);
	document.getElementById('slider-6-b').addEventListener('input', updatePlotLinear);
	document.getElementById('slider-7-a').addEventListener('input', updatePlotSurface);
	document.getElementById('slider-7-b').addEventListener('input', updatePlotSurface);
	document.getElementById('slider-5-freq').addEventListener('input', updatePlotWaves);
	document.getElementById('slider-5-amp').addEventListener('input', updatePlotWaves);
}

// ── Movable Vector ──────────────────────────────────────────────────────────

function renderMovableVector() {
	const plotId = 'movable-vector-plot';

	function update() {
		const sX = document.getElementById('slider-vector-x');
		const sY = document.getElementById('slider-vector-y');
		const plotDiv = document.getElementById(plotId);

		if (!sX || !sY || !plotDiv) {
			console.error('[Vector Plot] Update aborted: Elements missing from DOM');
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
				name: 'Original',
			},
			{
				x: [startX, startX + vecX], y: [startY, startY + vecY],
				type: 'scatter', mode: 'lines+markers',
				marker: { size: 8, color: '#ef4444' },
				line: { width: 4, color: '#ef4444' },
				name: 'Moved Vector',
			},
		];

		const layout = {
			paper_bgcolor: themeColor('#ffffff'),
			plot_bgcolor: themeColor('#f8fafc'),
			font: { color: themeColor('#1e293b') },
			showlegend: false,
			xaxis: { range: [0, 10], zeroline: true, dtick: 1, gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
			yaxis: { range: [0, 10], zeroline: true, dtick: 1, gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
			margin: { l: 40, r: 40, b: 40, t: 40 },
			annotations: [
				{
					x: vecX, y: vecY, ax: 0, ay: 0,
					xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
					showarrow: true, arrowhead: 2, arrowcolor: '#cbd5e0',
				},
				{
					x: startX + vecX, y: startY + vecY,
					ax: startX, ay: startY,
					xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
					showarrow: true, arrowhead: 2, arrowsize: 1,
					arrowwidth: 3, arrowcolor: '#ef4444',
				},
			],
		};

		Plotly.react(plotDiv, data, layout);
	}

	document.addEventListener('input', function (event) {
		if (
			event.target.id === 'slider-vector-x' ||
			event.target.id === 'slider-vector-y'
		) {
			update();
		}
	});

	update();
}

// ── Interactive Vector Spaces ───────────────────────────────────────────────

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
		Plotly.react(
			'v1-plot',
			[
				{
					x: [0, x], y: [0, 0],
					mode: 'lines+markers',
					line: { color: '#2563eb', width: 4 },
					marker: { size: 10 },
				},
			],
			{
				paper_bgcolor: themeColor('#ffffff'),
				plot_bgcolor: themeColor('#f8fafc'),
				font: { color: themeColor('#1e293b') },
				margin: { t: 0, b: 20, l: 20, r: 20 },
				height: 80,
				xaxis: { range: [-6, 6], gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
				yaxis: { visible: false },
			}
		);
	}

	// --- 2D Logic ---
	const v2x = document.getElementById('v2-x'),
		v2y = document.getElementById('v2-y');
	function draw2D() {
		const x = parseFloat(v2x.value),
			y = parseFloat(v2y.value);
		updateMath('v2-math', [x.toFixed(1), y.toFixed(1)]);
		Plotly.react(
			'v2-plot',
			[
				{
					x: [0, x], y: [0, y],
					mode: 'lines+markers',
					line: { color: '#059669', width: 4 },
					marker: { size: 12 },
				},
			],
			{
				paper_bgcolor: themeColor('#ffffff'),
				plot_bgcolor: themeColor('#f8fafc'),
				font: { color: themeColor('#1e293b') },
				margin: { t: 10, b: 30, l: 30, r: 10 },
				xaxis: { range: [-6, 6], zeroline: true, gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
				yaxis: { range: [-6, 6], zeroline: true, gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
			}
		);
	}

	// --- 3D Logic (RGB vector) — LAZY ---
	const v3r = document.getElementById('v3-r'),
		v3g = document.getElementById('v3-g'),
		v3b = document.getElementById('v3-b');

	function draw3D() {
		const r = v3r.value,
			g = v3g.value,
			b = v3b.value;
		const color = `rgb(${r},${g},${b})`;

		// Always update the math label (cheap)
		updateMath('v3-math', [r, g, b]);

		// Lazy-render the expensive 3-D scatter
		lazyRender('v3-plot', () => {
			const traceOutline = {
				x: [0, r], y: [0, g], z: [0, b],
				type: 'scatter3d', mode: 'lines',
				line: { color: '#000000', width: 12 },
				showlegend: false,
			};
			const traceColor = {
				x: [0, r], y: [0, g], z: [0, b],
				type: 'scatter3d', mode: 'lines+markers',
				line: { color: color, width: 8 },
				marker: { size: 4, color: '#000' },
				showlegend: false,
			};
			Plotly.react('v3-plot', [traceOutline, traceColor], {
				paper_bgcolor: themeColor('#ffffff'),
				plot_bgcolor: themeColor('#f8fafc'),
				font: { color: themeColor('#1e293b') },
				margin: { t: 0, b: 0, l: 0, r: 0 },
				uirevision: 'true',
				scene: {
					xaxis: { title: { text: 'Red', font: { color: themeColor('#64748b') } }, range: [0, 255], gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
					yaxis: { title: { text: 'Green', font: { color: themeColor('#64748b') } }, range: [0, 255], gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
					zaxis: { title: { text: 'Blue', font: { color: themeColor('#64748b') } }, range: [0, 255], gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
				},
			});
		});
	}

	// --- 4D Logic (bar chart — cheap, no lazy needed) ---
	const v4Inputs = [1, 2, 3, 4].map((i) => document.getElementById(`v4-${i}`));
	function draw4D() {
		const vals = v4Inputs.map((el) => parseInt(el.value));
		updateMath('v4-math', vals);
		Plotly.react(
			'v4-plot',
			[
				{
					x: ['Sweet', 'Sour', 'Firm', 'Seeds'],
					y: vals,
					type: 'bar',
					marker: { color: '#7c3aed' },
				},
			],
			{
				paper_bgcolor: themeColor('#ffffff'),
				plot_bgcolor: themeColor('#f8fafc'),
				font: { color: themeColor('#1e293b') },
				margin: { t: 10, b: 40, l: 30, r: 10 },
				xaxis: { tickfont: { color: themeColor('#64748b') } },
				yaxis: { range: [0, 10], gridcolor: themeColor('#f1f5f9'), zerolinecolor: themeColor('#cbd5e1'), tickfont: { color: themeColor('#64748b') } },
			}
		);
	}

	// Event Listeners
	v1s.oninput = draw1D;
	v2x.oninput = v2y.oninput = draw2D;
	v3r.oninput = v3g.oninput = v3b.oninput = draw3D;
	v4Inputs.forEach((el) => (el.oninput = draw4D));

	// Observe the 3D plot for lazy rendering
	observePlot('v3-plot');

	// Initial Renders
	draw1D();
	draw2D();
	draw3D(); // Will only actually render if v3-plot is in view; otherwise queued
	draw4D();
}

// ── Hadamard experiment ─────────────────────────────────────────────────────

function runHadamardExperiment() {
	const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;

	const a = [getVal('h-a1'), getVal('h-a2'), getVal('h-a3')];
	const b = [getVal('h-b1'), getVal('h-b2'), getVal('h-b3')];
	const res = a.map((val, i) => (val * b[i]).toFixed(2));

	const display = document.getElementById('hadamard-display');
	display.innerHTML = `$$ \\begin{pmatrix} ${a[0]} \\cdot ${b[0]} \\\\ ${a[1]} \\cdot ${b[1]} \\\\ ${a[2]} \\cdot ${b[2]} \\end{pmatrix} = \\begin{pmatrix} ${res[0]} \\\\ ${res[1]} \\\\ ${res[2]} \\end{pmatrix} $$`;

	refreshMath();
	render_temml();
}

// ── Module loader ───────────────────────────────────────────────────────────

async function loadMathLabModule() {
	updateLoadingStatus('Loading section about Math...');
	initDataBasics();
	return Promise.resolve();
}

</script>

<div class="md">
Modern AI is, at its core, applied linear algebra. Every image, every word, every token lives in a high-dimensional **vector space**. This chapter introduces the mathematical objects that make neural networks possible: vectors, matrices, tensors, and the operations that combine them.

If you complete this chapter, the rest of the textbook, embeddings, attention, gradients, activations, will read as natural applications of these primitives.
</div>

<div class="md">
## Vector Spaces

### 1D: The Line

In 1D, you only have one “degree of freedom.” You can go forward or backward.
* **Concept:** A single number describes your entire universe.
</div>

<div style="background: var(--mn-bg); padding: 15px; border: 1px solid var(--mn-border); border-radius: 8px;">
    <strong>Value ($x$):</strong> <input type="range" id="v1-slider" min="-5" max="5" step="0.1" value="2">
    <div id="v1-math" style="font-size: 1.2em; margin: 10px 0; color: #2563eb;">$$\vec{v} = \begin{pmatrix} 2.0 \end{pmatrix}$$</div>
    <div id="v1-plot" style="width:100%; height:80px;"></div>
</div>

<div class="md">
### 2D: The Plane

By adding a second number, we unlock an infinite flat surface.
</div>

<div style="background: var(--mn-bg); padding: 15px; border: 1px solid var(--mn-border); border-radius: 8px;">
    <strong>X:</strong> <input type="range" id="v2-x" min="-5" max="5" step="0.1" value="3">
    <strong>Y:</strong> <input type="range" id="v2-y" min="-5" max="5" step="0.1" value="4">
    <div id="v2-math" style="font-size: 1.2em; margin: 10px 0; color: #059669;">$$\vec{v} = \begin{pmatrix} 3.0 \\ 4.0 \end{pmatrix}$$</div>
    <div id="v2-plot" style="width:100%; height:300px;"></div>
</div>

<div class="md">
### 3D: The Color Cube

<div class="image-row md">
	<figure>
		<img src="rgb_color_cube.png" alt="RGB color cube diagram" />
		<figcaption class="md">\citealternativetitle{rgb_color_cube}: every visible color corresponds to a single point inside this cube, parameterized by its Red, Green, and Blue coordinates.</figcaption>
	</figure>
</div>

In 3D, we can represent volume. A great way to visualize this is **Color Space**. Every color you see on this screen is just a vector in a 3D space where the axes are **Red**, **Green**, and **Blue**.
</div>

<div style="background: var(--mn-bg); padding: 15px; border: 1px solid var(--mn-border); border-radius: 8px;">
    <div style="display: flex; gap: 10px;">
        R: <input type="range" id="v3-r" min="0" max="255" value="120">
        G: <input type="range" id="v3-g" min="0" max="255" value="50">
        B: <input type="range" id="v3-b" min="0" max="255" value="200">
    </div>
    <div id="v3-math" style="font-size: 1.2em; margin: 10px 0;">$$\vec{v}_{color} = \begin{pmatrix} 120 \\ 50 \\ 200 \end{pmatrix}$$</div>
    <div id="v3-plot" style="width:100%; height:400px;"></div>
</div>

<div class="md">
### 4D and Beyond: The “Feature” Space

We cannot “see” 4D, but we can **describe** it. In AI, dimensions are just “features.” Imagine we are describing a “Fruit.” We can use a 4D vector to describe:

1. **Sweetness**
2. **Sourness**
3. **Firmness**
4. **Seed Count**

Every fruit is now a point in a 4D “Fruit Space.”
</div>

<div style="background: var(--mn-bg); padding: 15px; border: 1px solid var(--mn-border); border-radius: 8px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <span>Sweet: <input type="range" id="v4-1" min="0" max="10" value="8"></span>
        <span>Sour: <input type="range" id="v4-2" min="0" max="10" value="2"></span>
        <span>Firm: <input type="range" id="v4-3" min="0" max="10" value="5"></span>
        <span>Seeds: <input type="range" id="v4-4" min="0" max="10" value="9"></span>
    </div>
    <div id="v4-math" style="font-size: 1.2em; margin: 20px 0; text-align: center; color: #7c3aed;">
        $$\vec{v}_{fruit} = \begin{pmatrix} 8 \\ 2 \\ 5 \\ 9 \end{pmatrix}$$
    </div>
    <div id="v4-plot" style="width:100%; height:250px;"></div>
</div>

<div class="md">
### The formal definition (the important one)

The geometric picture above is intuitive, but it hides a question: when we add a vector to a vector, or stretch a vector by a number, *what rules must those operations obey?* A **vector space** is the precise answer.

Mathematicians formalize this as follows. Pick a *base field* $k$ — a number system where addition, subtraction, multiplication, and division all behave as you would expect. In this course, $k$ will almost always be the **real numbers** $\mathbb{R}$; in cryptography or some physics contexts it might be a finite field or the complex numbers.

<div class="optional md" data-headline="Definition">

A *vector space over $k$* is a set $V$ together with two operations — vector addition $V \times V \to V$ and scalar multiplication $k \times V \to V$ — that satisfy eight axioms (closure, associativity, identity, inverses, distributivity, compatibility of scalar multiplication). The elements of $V$ are called **vectors**; the elements of $k$ are called **scalars**.

</div>

You don't need to memorise the eight axioms. What you need to remember is:

1. **A scalar is not "any number".** A scalar lives in a specific number system $k$ — usually $\mathbb{R}$. The integers $\{0, 1, \ldots, 255\}$ that index pixel brightness are *not* scalars of a vector space over $\mathbb{R}$; they are just integers, and we use them as coordinate indices.
2. **A vector is not a "list of numbers".** A vector is an *element* of a vector space. The list-of-numbers representation only appears once you pick a basis — that is, once you choose how to measure vectors. The vector itself exists without that choice. (This is why we can rotate, stretch, or translate an embedding space in later chapters without changing the meaning of "vector".)
3. **Every vector space has a basis.** A basis is a small set of vectors such that every other vector is a unique combination of them. This is a deep theorem (equivalent to the axiom of choice); for our purposes it just means: in $d$ dimensions, every vector is described by exactly $d$ coordinates.

</div>

<div class="md">
## Scalars and Vectors

### Scalars

A **scalar** is a single number from the base field — in this course, almost always a real number. You use scalars every time you stretch a vector or measure a single quantity.

$$ s \in \mathbb{R} \qquad \text{Example: } s = 2.5 $$

A note on terminology: in machine learning, you will often see "scalar" used more loosely to mean "a single number of any kind" — for example a pixel brightness in $\{0, 1, \ldots, 255\}$. That is fine as a casual usage, but strictly speaking pixel brightnesses are integers, not elements of the vector space's base field. The two meanings rarely cause problems in practice; just be aware they exist.

### Vectors

A **vector** is an element of a vector space. The geometric picture is an *arrow* with a direction and a length: "three steps to the right, four steps up." The algebraic picture is a single thing you can add to other vectors and stretch with scalars.

If you pick a basis, you can write a vector as a list of coordinates. In $\mathbb{R}^3$ with the standard basis, the arrow "3 right, 4 up, 2 forward" becomes the column

$$ \vec{v} = \begin{pmatrix} 3 \\ 4 \\ 2 \end{pmatrix} $$

Two important properties:

* A vector is *not glued to one spot*. The arrow "3 right, 4 up" is the same arrow whether you draw it starting at the origin or at $(1, 1)$. This is what it means for vectors to be basis-free.
* You can stretch a vector by a scalar: $2 \cdot (3, 4, 2) = (6, 8, 4)$. You can add vectors component-wise: $(1, 2) + (3, 4) = (4, 6)$.

To make a color, a computer needs a list of 3 numbers: one for Red, one for Green, one for Blue. This 3-tuple is a vector in $\mathbb{R}^3$:

$$ \vec{v}_{\text{color}} = \begin{pmatrix} r \\ g \\ b \end{pmatrix} \qquad \text{Example: } \vec{v}_{\text{color}} = \begin{pmatrix} 255 \\ 0 \\ 0 \end{pmatrix} \text{ (Pure Red!)} $$


</div>

<div id="vector-plot" style="width:100%; max-width:400px; height:400px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;"></div>

<div class="md">
A vector is *not glued to one spot*. The arrow "3 right, 4 up" is the same arrow whether you draw it starting at the origin or somewhere else. This is what it means for vectors to be basis-free.
</div>

<div style="text-align: center; margin-bottom: 10px;">
    Start Position ($x$): <input type="range" id="slider-vector-x" min="0" max="5" step="0.5" value="1">
    Start Position ($y$): <input type="range" id="slider-vector-y" min="0" max="5" step="0.5" value="1">
</div>

<div id="movable-vector-plot" style="width:100%; max-width:400px; height:400px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;"></div>

<div class="md">
Vectors can have any number of dimensions. Two essential operations on vectors:

**Scalar multiplication** multiplies each coordinate:


$$ c \cdot \vec{v} = c \cdot \begin{pmatrix} v_1 \\ v_2 \end{pmatrix} = \begin{pmatrix} c \cdot v_1 \\ c \cdot v_2 \end{pmatrix}$$

$$ 2 \cdot \begin{pmatrix} 3 \\ 4 \end{pmatrix} = \begin{pmatrix} 2 \cdot 3 \\ 2 \cdot 4 \end{pmatrix} = \begin{pmatrix} 6 \\ 8 \end{pmatrix}$$

Vectors can also be added:

$$ \begin{pmatrix} 1 \\ 2 \end{pmatrix} + \begin{pmatrix} 3 \\ 4 \end{pmatrix} = \begin{pmatrix} 1 + 3 \\ 2 + 4 \end{pmatrix} = \begin{pmatrix} 4 \\ 6 \end{pmatrix} $$

### The Matrix (rank 2)

A **Matrix** is a grid of numbers (like a spreadsheet).

A **Black & White photo** is just a Matrix. Each spot in the grid tells the computer how bright that specific pixel is, when we say $0$ means “black”, $255$ means white and everything inbetween are different shades of gray.

$$M = \begin{pmatrix} 255 & 0 \\ 0 & 255 \end{pmatrix}$$

</div>

<div id="section-bw">
	<div style="display: flex; align-items: center; gap: 40px; padding: 20px; border-radius: 12px; margin-top: 15px;">
		<div id="bw-matrix-container"></div>
		<canvas id="bw-preview-canvas" width="3" height="3" style="width: 180px; height: 180px; image-rendering: pixelated; border: 4px solid #333;"></canvas>
	</div>
</div>

<div class="md">
### Arrays, vectors, matrices, and the word "tensor"

You have seen scalars, vectors, and matrices. You can stack them in a grid of grids to get more structure. Python and PyTorch call these multidimensional arrays *tensors* — that is the meaning of the word in this course:

<div class="optional md" data-headline="Definition (informal, machine-learning sense)">

A *tensor* is a rectangular array of numbers with a fixed number of axes (also called *dimensions* or *modes*). A scalar is a 0-axis tensor, a vector is a 1-axis tensor, a matrix is a 2-axis tensor, and so on.

</div>

| Object | Axes | Shape | Example |
|--------|------|-------|---------|
| Scalar | 0 | `()` | $s = 5$ |
| Vector | 1 | `(d,)` | color $= (r, g, b)$ |
| Matrix | 2 | `(h, w)` | a black-and-white image |
| 3-axis tensor | 3 | `(h, w, c)` | a color image |
| 4-axis tensor | 4 | `(b, h, w, c)` | a batch of color images |

A color photo is a 3-axis tensor: a stack of three matrices (one each for red, green, blue).

$$\mathcal{T} \in \mathbb{R}^{\text{Height} \times \text{Width} \times \text{Colors}}$$

This is the meaning of "tensor" throughout the rest of this course. It is the meaning PyTorch, TensorFlow, and NumPy use.

#### A different word in mathematics

The same word — *tensor* — has a stricter meaning in mathematics and physics. There, a tensor is *an element of a tensor product of vector spaces*. This is the object used in general relativity, electromagnetism, and continuum mechanics. Its properties are fixed by *transformation rules*, not just by its numerical entries. The two meanings are connected historically — the ML usage borrowed the name because the underlying data structures share algebraic properties with the mathematical objects — but they are not the same definition.

If you go on to read physics or differential geometry, you will encounter:

* a *contravariant* index (subscript notation in physics, superscript in math),
* a *covariant* index (the other way),
* a *type* $(p, q)$, meaning $p$ contravariant slots and $q$ covariant slots.

In that language, a vector field is a $(1, 0)$-tensor, a one-form (linear functional) is a $(0, 1)$-tensor, and a metric tensor is a symmetric $(0, 2)$-tensor. None of this matters for the ML sense above — but it is why the word was tempting to borrow.

<div class="optional md" data-headline="Convention">

Throughout this course, "tensor" means "multidimensional array" (the ML sense).

</div>

### The shape of a colour image, written out

When you type numbers into the grid, the computer organises them into a structured object. Here is how your **colour image** looks as a 3-axis tensor $\mathcal{T}$.

Notice how each "cell" of the grid is actually a vector (a vertical list) of three values:
</div>

$$
\mathcal{T}_{3 \times 3 \text{ color image}} = \begin{pmatrix}
\begin{pmatrix} \color{red}{r_{1,1}} \\ \color{green}{g_{1,1}} \\ \color{blue}{b_{1,1}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{1,2}} \\ \color{green}{g_{1,2}} \\ \color{blue}{b_{1,2}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{1,3}} \\ \color{green}{g_{1,3}} \\ \color{blue}{b_{1,3}} \end{pmatrix} \\ \\
\begin{pmatrix} \color{red}{r_{2,1}} \\ \color{green}{g_{2,1}} \\ \color{blue}{b_{2,1}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{2,2}} \\ \color{green}{g_{2,2}} \\ \color{blue}{b_{2,2}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{2,3}} \\ \color{green}{g_{2,3}} \\ \color{blue}{b_{2,3}} \end{pmatrix} \\ \\
\begin{pmatrix} \color{red}{r_{3,1}} \\ \color{green}{g_{3,1}} \\ \color{blue}{b_{3,1}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{3,2}} \\ \color{green}{g_{3,2}} \\ \color{blue}{b_{3,2}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{3,3}} \\ \color{green}{g_{3,3}} \\ \color{blue}{b_{3,3}} \end{pmatrix}
\end{pmatrix}
$$

<div class="md">
The form a tensor has is called a *shape*. The shape defines how many rows and columns a tensor has, and how many nested tensors it has. For example, an image with $ 32 \cdot 32 $ pixels and 3 channels (one for red, green and blue each) has a shape of $ \left[ 32, 32, 3 \right] $.

* **The Grid:** The large outer brackets $\begin{pmatrix} \dots \end{pmatrix}$ represent the **Shape** (Rows and Columns).
* **The Depth:** Each small inner bracket $\begin{pmatrix} r \\ g \\ b \end{pmatrix}$ is the **Feature Vector** for a single pixel.
* **The Coordinates:** The numbers like $_{1,2}$ mean: “Row 1, Column 2”.

To make colors, we use **three numbers** for every single pixel: one for **Red**, one for **Green**, and one for **Blue**.

We can think of a pixel $P$ as a stack of three values:

$$P = \begin{pmatrix} \color{red}{R} \\ \color{green}{G} \\ \color{blue}{B} \end{pmatrix}$$

By mixing these three primary lights at different brightness levels (0 to 255), you can create any color in the world!
</div>

<div id="section-rgb">
	<div style="display: flex; align-items: center; gap: 40px; padding: 20px; border-radius: 12px; margin-top: 15px;">
			<div id="rgb-combined-container"></div>
			<canvas id="rgb-preview-canvas" width="3" height="3" style="width: 180px; height: 180px; image-rendering: pixelated; border: 4px solid #333;"></canvas>
	</div>
</div>

<div class="md">
You can then use full images as tensors, ie you can write an image into a variable, and pass it to functions, and get a vector out of it again:

$$ f\left(\text{Image}\right) = \begin{pmatrix} \text{Probability cat} \\ \text{Probability dog} \end{pmatrix} $$

This function, when it is not manually written, we call Model, as it models the behaviour of a function (and thus, acts as this function, even though it is just an approximation for it).

With other methods of making numbers from data (like Embeddings to create numbers from texts, like chatGPT does, which we will discuss later on), we can create models that do all kinds of stuff. For example, we could create a function that maps $\text{Text} \rightarrow \text{Music}$ or $\text{Image} \rightarrow \text{Text}$.

<div class="smart-quote red" data-cite="box1987empirical">
  All models are wrong, but some are useful.
</div>
</div>

<div class="md">
## Chaining Functions (Composition)

In programming and math, we often want to take the result of one function and plug it directly into another. This is called **composition**. If we have a function $f$ and a function $g$, applying $f$ first and then $g$ is written as $(g \circ f)(x)$, which is just a shorthand for $g(f(x))$.

You can experiment with how two linear functions combine. Adjust the sliders to see how the “inner” function $f$ and the “outer” function $g$ create a new, composed result.
</div>

<div style="background: var(--mn-surface, #f9f9f9); padding: 15px; border-radius: 8px; border: 1px solid #eee;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
            <strong>Function $f(x) = ax + b$</strong><br>
            a: <input type="range" id="slider-comp-a" min="-2" max="2" step="0.1" value="1"><br>
            b: <input type="range" id="slider-comp-b" min="-5" max="5" step="0.5" value="0">
        </div>
        <div>
            <strong>Function $g(x) = cx + d$</strong><br>
            c: <input type="range" id="slider-comp-c" min="-2" max="2" step="0.1" value="0.5"><br>
            d: <input type="range" id="slider-comp-d" min="-5" max="5" step="0.5" value="2">
        </div>
    </div>
    <div id="composition-formula" style="text-align: center; margin: 15px 0; font-size: 1.1em; color: #2563eb;">
        $(g \circ f)(x) = g(ax + b)$
    </div>
    <div id="plot-composition" style="width:100%; height:350px;"></div>
</div>

<div class="optional md" data-headline="As a category-theoretical diagram">
We can visualize these relationships using a square diagram. It shows that there are two ways to reach the same result: either you transform your data first and then apply a function, or you apply a modified version of that function to your raw data. In Category Theory, $A, B, C$ are *objects* (which can be any mathematical objects, like sets) and $f$ and $g$ (the arrows) are so-called *morphisms* (which can be anything that connects mathematical objects to each other, like functions). When both paths lead to the same result, we say the diagram **commutes**.

<center>
<?php
	include("commutation.html");
?>
</center>
</div>

<div class="md">
## The Hadamard Product ($\odot$)

The **Hadamard Product** ($\odot$) was formally introduced by \citeauthor{hadamardproduct} in \citeyear{hadamardproduct} within his thesis \citetitle{hadamardproduct}. It was designed to solve the practical problem of identifying **singularities** in complex power series. By multiplying coefficients element-wise, defined for vectors as $\vec{a} \odot \vec{b} = (a_1 b_1, \dots, a_n b_n)^T$, Hadamard could predict the analytic continuation and boundaries of new functions derived from known ones.

While standard matrix multiplication follows the “row-by-column” rule, the **Hadamard Product** (also known as the *element-wise product*) is much more straightforward. It takes two matrices or vectors of the **same dimensions** and multiplies the elements that occupy the same position.

In the context of Deep Learning, the $\odot$ symbol is ubiquitous. It is used in **Layer Normalization** to scale normalized values by a learnable parameter $\gamma$, and in **Gating Mechanisms** (like LSTMs or GRUs) to decide which information should pass through a “gate.”

### Mathematical Definition

For two vectors $\vec{a}$ and $\vec{b}$ of length $n$, the product is defined as:

$$\vec{a} \odot \vec{b} = \begin{pmatrix} a_1 \cdot b_1 \\ a_2 \cdot b_2 \\ \vdots \\ a_n \cdot b_n \end{pmatrix}$$

Adjust the values in vectors $\vec{a}$ and $\vec{b}$ to see how the resulting vector is calculated element-by-element.
</div>

<div style="background: var(--mn-bg); padding: 25px; border: 1px solid var(--mn-border); border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin: 20px 0;">
    <div style="display: flex; justify-content: space-around; align-items: center; gap: 15px; flex-wrap: wrap;">
        <div style="text-align: center;">
            <strong style="color: #64748b;">Vector $\vec{a}$</strong><br>
            <input type="number" id="h-a1" value="3" style="width: 60px; margin: 4px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;"><br>
            <input type="number" id="h-a2" value="-2" style="width: 60px; margin: 4px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;"><br>
            <input type="number" id="h-a3" value="5" style="width: 60px; margin: 4px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;">
        </div>
        <div style="font-size: 2rem; color: #94a3b8;">$\odot$</div>
        <div style="text-align: center;">
            <strong style="color: #64748b;">Vector $\vec{b}$</strong><br>
            <input type="number" id="h-b1" value="2" step="0.5" style="width: 60px; margin: 4px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;"><br>
            <input type="number" id="h-b2" value="0.5" step="0.5" style="width: 60px; margin: 4px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;"><br>
            <input type="number" id="h-b3" value="10" step="0.5" style="width: 60px; margin: 4px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;">
        </div>
        <div style="font-size: 2rem; color: #94a3b8;">$=$</div>
        <div id="hadamard-display" style="min-width: 180px; background: var(--mn-bg-subtle); padding: 20px; border-radius: 8px; border: 1px dashed var(--mn-border); text-align: center;">
            </div>
    </div>
</div>

<div class="md">
## Matrix Transposition

Transposing a matrix means flipping it over its main diagonal, turning rows into columns and columns into rows. If $A$ is an $m \times n$ matrix with elements $a_{ij}$, then the transpose $A^T$ is an $n \times m$ matrix where $(A^T)_{ij} = A_{ji}$.

Example:

$$A = \begin{pmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \end{pmatrix}
\quad \Longrightarrow \quad
A^T = \begin{pmatrix} 1 & 4 \\ 2 & 5 \\ 3 & 6 \end{pmatrix}$$
</div>

<div class="optional md" data-headline="History of Matrix Transposition">
The idea of matrix transposition was introduced in 1858 by the British mathematician \citeauthor{cayleymemoirmatrices} in his paper \citetitle{cayleymemoirmatrices}. It arose from the study of bilinear and quadratic forms, where swapping rows and columns was needed to express symmetry properties.
</div>

<div class="md">
## Softmax and Cross-Entropy

Two vector operations appear so often in AI that they deserve explicit definitions here, even though they are first motivated in the Statistics and Loss chapters.

### Softmax: vector → probability distribution

Given a vector of real-valued scores $\vec{z} \in \mathbb{R}^{K}$ (called **logits**), the **softmax** turns it into a vector of probabilities that sum to $1$:

$$
\text{softmax}(\vec{z})_i = \frac{e^{z_i}}{\sum_{j=1}^{K} e^{z_j}}
$$

The exponential emphasises differences: a logit gap of $1$ becomes a ratio of $e \approx 2.7$, a gap of $2$ becomes $e^2 \approx 7.4$. This is the operation behind the output layer of a classification network and behind every next-token probability in an LLM (see the Attention chapter).

### Cross-entropy: measuring the gap between two distributions

Given a true probability distribution $\vec{y}$ (one-hot for a single correct class) and a predicted distribution $\hat{\vec{y}}$ (the model's softmax output), the **cross-entropy** is

$$
H(\vec{y}, \hat{\vec{y}}) = -\sum_{i=1}^{K} y_i \, \log \hat{y}_i
$$

For a one-hot true label where $y_c = 1$ for the correct class $c$, this collapses to

$$
L_{\text{CE}} = -\log \hat{y}_c
$$

That is: cross-entropy loss for a single example is just the **negative log-probability the model assigned to the correct class**. This is the standard classification loss (see the Loss chapter) and, paired with softmax, has the elegant property

$$
\frac{\partial L_{\text{CE}}}{\partial z_i} = \hat{y}_i - y_i
$$

i.e. the gradient is just “predicted minus actual”, the reason softmax + cross-entropy is the canonical pairing.
</div>

<script>
// The plot initializer functions live in the inline <script> at the top of
// this file (previously math.js). They are not auto-loaded by the module
// loader queue — initialize the page's plots directly here instead.
(function () {
	let initialized = false;

	function initMathIIPlots() {
		if (initialized) return;
		if (typeof Plotly === 'undefined') return;
		initialized = true;

		renderBWTable();
		updateBWPreview();
		renderRGBCombinedTable();
		updateRGBPreview();
		renderVectorPlot();
		renderMovableVector();
		initCompositionPlot();
		initHadamard();
		initInteractiveVectorSpaces();
	}

	async function loadMathIIModule() {
		updateLoadingStatus("Loading section about Math II...");
		initMathIIPlots();
		return Promise.resolve();
	}

	initMathIIPlots();
})();
</script>
