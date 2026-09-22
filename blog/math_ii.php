<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Basic Math Concepts II — Linear Algebra for AI
description: Vector spaces, tensors, function composition, Hadamard product, matrix transposition.
icon: &#128290;
part: 1
order: 4
color: accent
topics: math-ii
tags: math-heavy
math: 70
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

// ── Tensor calculations: broadcasting + contraction ─────────────────────────

function initTcalcBroadcast() {
	const el = document.getElementById('tcalc-bcast');
	if (!el || el.dataset.ready) return;
	el.dataset.ready = '1';

	const g = (id) => document.getElementById(id);
	const clamp = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
	const label = (d) => (d.length ? '(' + d.join(', ') + ')' : '()');
	const SDIMS = { 'sc': [], '3': [3], '1x3': [1, 3], '3x1': [3, 1], '3x3': [3, 3], '2x3': [2, 3], '4': [4] };
	const SDEF = { 'sc': [5], '3': [10, 20, 30], '1x3': [10, 20, 30], '3x1': [10, 20, 30], '3x3': [1, 2, 3, 4, 5, 6, 7, 8, 9], '2x3': [1, 2, 3, 4, 5, 6], '4': [1, 2, 3, 4] };
	const PRESETS = {
		bias: { a: '3x3', b: '3', op: '+' },
		rows: { a: '3x3', b: '3x1', op: '*' },
		shift: { a: '3x3', b: 'sc', op: '+' },
		batch: { a: '2x3', b: '3', op: '+' },
		clash: { a: '3x3', b: '4', op: '*' }
	};

	let Ashape = '3x3', Bshape = '3', op = '+';
	let A = SDEF[Ashape].slice(), B = SDEF[Bshape].slice();

	const Agrid = g('tcalc-bcast-a'), Bgrid = g('tcalc-bcast-b'), Rgrid = g('tcalc-bcast-res');
	const Shapes = g('tcalc-bcast-shapes'), Status = g('tcalc-bcast-status');
	const Sym = g('tcalc-bcast-sym'), Acap = g('tcalc-bcast-acap'), Bcap = g('tcalc-bcast-bcap');
	const asel = g('tcalc-bcast-ashape'), bsel = g('tcalc-bcast-bshape'), opWrap = g('tcalc-bcast-op'), presetWrap = g('tcalc-bcast-presets');

	function bshape(a, b) {
		const n = Math.max(a.length, b.length);
		const x = [...Array(n - a.length).fill(1), ...a], y = [...Array(n - b.length).fill(1), ...b], out = [];
		for (let i = 0; i < n; i++) { if (x[i] === y[i] || x[i] === 1 || y[i] === 1) out.push(Math.max(x[i], y[i])); else return null; }
		return out;
	}
	function bcast(flat, shape, out) {
		const nd = out.length, pad = [...Array(nd - shape.length).fill(1), ...shape], st = new Array(nd).fill(0);
		let acc = 1;
		for (let i = nd - 1; i >= 0; i--) { st[i] = acc; acc *= pad[i]; }
		const idx = new Array(nd).fill(0), res = [];
		const T = out.reduce((p, q) => p * q, 1);
		for (let t = 0; t < T; t++) {
			let s = 0;
			for (let i = 0; i < nd; i++) s += (idx[i] % pad[i]) * st[i];
			res.push(flat[s]);
			let d = nd - 1;
			while (d >= 0) { idx[d]++; if (idx[d] < out[d]) break; idx[d] = 0; d--; }
		}
		return res;
	}
	function gridFor(grid, arr, onEdit) {
		const dims = grid === Agrid ? SDIMS[Ashape] : SDIMS[Bshape];
		grid.style.gridTemplateColumns = 'repeat(' + (dims.length ? dims[dims.length - 1] : 1) + ',auto)'; grid.innerHTML = '';
		arr.forEach((v, i) => { const inp = document.createElement('input'); inp.type = 'number'; inp.value = v; inp.className = 'tcalc-cell input'; inp.addEventListener('input', () => { onEdit(i, inp.value); }); grid.appendChild(inp); });
	}
	function buildA() {
		const dims = SDIMS[Ashape], n = dims.reduce((p, q) => p * q, 1) || 1;
		if (A.length !== n) A = SDEF[Ashape].slice();
		if (Acap) Acap.textContent = 'A ' + label(dims);
		gridFor(Agrid, A, (i, v) => { A[i] = clamp(v); refresh(); });
	}
	function buildB() {
		const dims = SDIMS[Bshape], n = dims.reduce((p, q) => p * q, 1) || 1;
		if (B.length !== n) B = SDEF[Bshape].slice();
		Bcap.textContent = 'B ' + label(dims);
		gridFor(Bgrid, B, (i, v) => { B[i] = clamp(v); refresh(); });
	}
	function dimRow(parent, lbl, dims, opts) {
		const row = document.createElement('div'); row.className = 'tcalc-shape-row';
		const l = document.createElement('span'); l.className = 'lbl'; l.textContent = lbl; row.appendChild(l);
		const boxes = [];
		dims.forEach((d, i) => {
			const box = document.createElement('span'); box.className = 'tcalc-dim';
			const a = opts.a[i], b = opts.b[i];
			if (d === null) { box.style.opacity = '.25'; box.textContent = ''; }
			else {
				box.textContent = d;
				const conflict = a != null && b != null && a !== b && a !== 1 && b !== 1;
				if (conflict) box.classList.add('bad');
				else if (d === 1 && (a || b) && Math.max(a || 1, b || 1) !== 1) box.classList.add('stretch');
			}
			boxes.push(box); row.appendChild(box);
		});
		parent.appendChild(row); return boxes;
	}
	function markPreset(name) {
		if (!presetWrap) return;
		presetWrap.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.preset === name));
	}
	function applyPreset(name) {
		const p = PRESETS[name]; if (!p) return;
		Ashape = p.a; Bshape = p.b; op = p.op;
		A = SDEF[Ashape].slice(); B = SDEF[Bshape].slice();
		if (asel) asel.value = Ashape;
		if (bsel) bsel.value = Bshape;
		opWrap.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.op === op));
		buildA(); buildB(); refresh();
		markPreset(name);
	}
	function refresh() {
		Sym.textContent = op === '+' ? '+' : (op === '-' ? '−' : '×');
		const aD = SDIMS[Ashape], bD = SDIMS[Bshape], out = bshape(aD, bD);
		const n = Math.max(aD.length, bD.length, out ? out.length : 0);
		const pA = [...Array(n - aD.length).fill(null), ...aD], pB = [...Array(n - bD.length).fill(null), ...bD];
		const pO = out ? [...Array(n - out.length).fill(null), ...out] : [];
		Shapes.innerHTML = '';
		dimRow(Shapes, 'A', pA, { kind: 'a', a: pA, b: pB });
		dimRow(Shapes, 'B', pB, { kind: 'b', a: pA, b: pB });
		if (!out) {
			Status.className = 'tcalc-status err';
			const fail = (function () { for (let i = n - 1; i >= 0; i--) { const a = pA[i], b = pB[i]; if (a != null && b != null && a !== b && a !== 1 && b !== 1) return [a, b]; } return [pA[n - 1], pB[n - 1]]; })();
			Status.textContent = 'Not broadcastable: axes ' + fail[0] + ' and ' + fail[1] + ' (neither equal nor 1).';
			Rgrid.style.gridTemplateColumns = 'repeat(3,auto)'; Rgrid.innerHTML = ''; return;
		}
		dimRow(Shapes, '=', pO, { kind: 'o', a: pA, b: pB });
		const x = bcast(A, aD, out), y = bcast(B, bD, out);
		const res = x.map((v, i) => (op === '+' ? v + y[i] : op === '-' ? v - y[i] : v * y[i]));
		Status.className = 'tcalc-status ok'; Status.textContent = 'broadcast to ' + label(out);
		Rgrid.style.gridTemplateColumns = 'repeat(' + out[out.length - 1] + ',auto)'; Rgrid.innerHTML = '';
		res.forEach((v) => { const d = document.createElement('div'); d.className = 'tcalc-cell result'; d.textContent = v; Rgrid.appendChild(d); });
	}

	opWrap.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => { op = btn.dataset.op; opWrap.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn)); markPreset(''); refresh(); }));
	if (asel) asel.addEventListener('change', () => { Ashape = asel.value; A = SDEF[Ashape].slice(); markPreset(''); buildA(); refresh(); });
	if (bsel) bsel.addEventListener('change', () => { Bshape = bsel.value; B = SDEF[Bshape].slice(); markPreset(''); buildB(); refresh(); });
	if (presetWrap) presetWrap.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => applyPreset(btn.dataset.preset)));
	buildA(); buildB(); refresh();
	markPreset('bias');
}

function initTcalcContraction() {
	const el = document.getElementById('tcalc-contraction');
	if (!el || el.dataset.ready) return;
	el.dataset.ready = '1';
	const clamp = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
	const C = [1, 2, 3, 4], D = [5, 6, 7, 8];
	let sel = { r: 0, c: 0 };
	const Cg = document.getElementById('tcalc-contr-c'), Dg = document.getElementById('tcalc-contr-d'), Mg = document.getElementById('tcalc-contr-m'), Det = document.getElementById('tcalc-contr-detail');

	function build(grid, arr) {
		grid.style.gridTemplateColumns = 'repeat(2,auto)'; grid.innerHTML = '';
		arr.forEach((v, i) => { const inp = document.createElement('input'); inp.type = 'number'; inp.value = v; inp.className = 'tcalc-cell input'; inp.addEventListener('input', () => { arr[i] = clamp(inp.value); refresh(); }); grid.appendChild(inp); });
	}
	function chip(cls, html) { const s = document.createElement('span'); s.className = cls; s.innerHTML = html; return s; }
	function op(txt) { const s = document.createElement('span'); s.className = 'tcalc-plus'; s.textContent = txt; return s; }
	function refresh() {
		const M = [0, 0, 0, 0];
		for (let i = 0; i < 2; i++) for (let k = 0; k < 2; k++) M[i * 2 + k] = C[i * 2] * D[k] + C[i * 2 + 1] * D[2 + k];
		Mg.style.gridTemplateColumns = 'repeat(2,auto)'; Mg.innerHTML = '';
		for (let i = 0; i < 2; i++) for (let k = 0; k < 2; k++) {
			const d = document.createElement('div'); d.className = 'tcalc-cell result click' + (i === sel.r && k === sel.c ? ' sel' : ''); d.textContent = M[i * 2 + k];
			d.addEventListener('click', () => { sel = { r: i, c: k }; refresh(); const c = Mg.children[i * 2 + k]; if (c) { c.classList.add('tcalc-pulse'); setTimeout(() => c.classList.remove('tcalc-pulse'), 750); } });
			Mg.appendChild(d);
		}
		for (let i = 0; i < 2; i++) for (let c = 0; c < 2; c++) { Cg.children[i * 2 + c].classList.toggle('hl', i === sel.r); Dg.children[i * 2 + c].classList.toggle('hl', c === sel.c); }
		const i = sel.r, k = sel.c;
		const t1 = C[i * 2] * D[k], t2 = C[i * 2 + 1] * D[2 + k];
		Det.innerHTML = '';
		const row = document.createElement('div'); row.className = 'tcalc-contr-terms';
		row.appendChild(chip('tcalc-chip', 'C<sub>' + (i + 1) + ',1</sub>&middot;D<sub>1,' + (k + 1) + '</sub> = ' + C[i * 2] + '&times;' + D[k] + ' = ' + t1));
		row.appendChild(op('+'));
		row.appendChild(chip('tcalc-chip', 'C<sub>' + (i + 1) + ',2</sub>&middot;D<sub>2,' + (k + 1) + '</sub> = ' + C[i * 2 + 1] + '&times;' + D[2 + k] + ' = ' + t2));
		row.appendChild(op('='));
		row.appendChild(chip('tcalc-chip result', 'M<sub>' + (i + 1) + ',' + (k + 1) + '</sub> = ' + (t1 + t2)));
		Det.appendChild(row);
		const cap = document.createElement('div'); cap.className = 'tcalc-contr-cap';
		cap.textContent = 'One row of C dotted with one column of D — multiply along the shared index and add. That single step is the whole matrix product.';
		Det.appendChild(cap);
	}
	build(Cg, C); build(Dg, D); refresh();
}

// ── Module loader ───────────────────────────────────────────────────────────

async function loadMathLabModule() {
	updateLoadingStatus('Loading section about Math...');
	initDataBasics();
	return Promise.resolve();
}

</script>

<div class="md" data-lesson-id="math-ii">
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
		<figcaption class="md">\citealternativetitle{rgb_color_cube}: every color in this RGB color cube is a single point inside it, located by its Red, Green, and Blue coordinates.</figcaption>
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

1. **A scalar is not "any number".** A scalar lives in a specific number system $k$ — usually $\mathbb{R}$. The set of pixel brightnesses $\{0, 1, \ldots, 255\}$ is *not* a field (no negatives, no quotients), so it cannot serve as the base field $k$; the individual values are of course real numbers, used as coordinates.
2. **A vector is not a "list of numbers".** A vector is an *element* of a vector space. The list-of-numbers representation only appears once you pick a basis — that is, once you choose how to measure vectors. The vector itself exists without that choice. (This is why we can rotate, stretch, or translate an embedding space in later chapters without changing the meaning of "vector".)
3. **Every vector space has a basis.** A basis is a small set of vectors such that every other vector is a unique combination of them. This is a deep theorem (equivalent to the axiom of choice); for our purposes it just means: in $d$ dimensions, every vector is described by exactly $d$ coordinates.

</div>

<div class="md" data-mathlevel="45" data-optionaltitle="Scalars and vectors">
## Scalars and Vectors

### Scalars

A **scalar** is a single number from the base field — in this course, almost always a real number. You use scalars every time you stretch a vector or measure a single quantity.

$$ s \in \mathbb{R} \qquad \text{Example: } s = 2.5 $$

A note on terminology: in machine learning, you will often see "scalar" used more loosely to mean "a single number of any kind" — for example a pixel brightness in $\{0, 1, \ldots, 255\}$. That is fine as a casual usage, but strictly speaking the *set* $\{0, 1, \ldots, 255\}$ is not a field (no negatives, no quotients), so it cannot be the base field; each individual brightness value is just a real number. The two meanings rarely cause problems in practice; just be aware they exist.

### Vectors

A **vector** is an element of a vector space. The geometric picture is an *arrow* with a direction and a length: "three steps to the right, four steps up." The algebraic picture is a single thing you can add to other vectors and stretch with scalars.

If you pick a basis, you can write a vector as a list of coordinates. In $\mathbb{R}^3$ with the standard basis, the arrow "3 right, 4 up, 2 forward" becomes the column

$$ \vec{v} = \begin{pmatrix} 3 \\ 4 \\ 2 \end{pmatrix} $$

Two important properties:

* A vector is *not glued to one spot*. The arrow "3 right, 4 up" is the same arrow whether you draw it starting at the origin or at $(1, 1)$. This is what it means for vectors to be *free* (not anchored to a point).
* You can stretch a vector by a scalar: $2 \cdot (3, 4, 2) = (6, 8, 4)$. You can add vectors component-wise: $(1, 2) + (3, 4) = (4, 6)$.

To make a color, a computer needs a list of 3 numbers: one for Red, one for Green, one for Blue. This 3-tuple is a vector in $\mathbb{R}^3$:

$$ \vec{v}_{\text{color}} = \begin{pmatrix} r \\ g \\ b \end{pmatrix} \qquad \text{Example: } \vec{v}_{\text{color}} = \begin{pmatrix} 255 \\ 0 \\ 0 \end{pmatrix} \text{ (Pure Red!)} $$


</div>

<div id="vector-plot" style="width:100%; max-width:400px; height:400px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;"></div>

<div class="md">
A vector is *not glued to one spot*. The arrow "3 right, 4 up" is the same arrow whether you draw it starting at the origin or somewhere else. This is what it means for vectors to be *free* (not anchored to a point).
</div>

<div style="text-align: center; margin-bottom: 10px;">
    Start Position ($x$): <input type="range" id="slider-vector-x" min="0" max="5" step="0.5" value="1">
    Start Position ($y$): <input type="range" id="slider-vector-y" min="0" max="5" step="0.5" value="1">
</div>

<div id="movable-vector-plot" style="width:100%; max-width:400px; height:400px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;"></div>

<div class="md" data-mathlevel="45">
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

<div class="md" data-mathlevel="45" data-optionaltitle="Arrays, vectors, matrices, and tensors">
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

* a *contravariant* index (a superscript, e.g. $V^{\mu}$),
* a *covariant* index (a subscript, e.g. $V_{\mu}$),
* a *type* $(p, q)$, meaning $p$ contravariant slots and $q$ covariant slots.

In that language, a vector field is a $(1, 0)$-tensor, a one-form (linear functional) is a $(0, 1)$-tensor, and a metric tensor is a symmetric $(0, 2)$-tensor. None of this matters for the ML sense above — but it is why the word was tempting to borrow.

<div class="optional md" data-headline="Convention">

Throughout this course, "tensor" means "multidimensional array" (the ML sense).

</div>

### The shape of a colour image, written out

When you type numbers into the grid, the computer organises them into a structured object. Here is how your **colour image** looks as a 3-axis tensor $\mathcal{T}$.

Notice how each "cell" of the grid is actually a vector (a vertical list) of three values:
</div>

<div class="topic-block" data-optionaltitle="A colour image as a 3-axis tensor" data-mathlevel="45">
$$
\mathcal{T}_{3 \times 3 \text{ color image}} = \begin{pmatrix}
\begin{pmatrix} \color{red}{r_{1,1}} \\ \color{green}{g_{1,1}} \\ \color{blue}{b_{1,1}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{1,2}} \\ \color{green}{g_{1,2}} \\ \color{blue}{b_{1,2}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{1,3}} \\ \color{green}{g_{1,3}} \\ \color{blue}{b_{1,3}} \end{pmatrix} \\ \\
\begin{pmatrix} \color{red}{r_{2,1}} \\ \color{green}{g_{2,1}} \\ \color{blue}{b_{2,1}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{2,2}} \\ \color{green}{g_{2,2}} \\ \color{blue}{b_{2,2}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{2,3}} \\ \color{green}{g_{2,3}} \\ \color{blue}{b_{2,3}} \end{pmatrix} \\ \\
\begin{pmatrix} \color{red}{r_{3,1}} \\ \color{green}{g_{3,1}} \\ \color{blue}{b_{3,1}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{3,2}} \\ \color{green}{g_{3,2}} \\ \color{blue}{b_{3,2}} \end{pmatrix} & \begin{pmatrix} \color{red}{r_{3,3}} \\ \color{green}{g_{3,3}} \\ \color{blue}{b_{3,3}} \end{pmatrix}
\end{pmatrix}
$$
</div>

<div class="md" data-mathlevel="45">
The form a tensor has is called a *shape*. The shape defines how many rows and columns a tensor has, and how many nested tensors it has. For example, an image with $ 32 \cdot 32 $ pixels and 3 channels (one for red, green and blue each) has a shape of $ \left[ 32, 32, 3 \right] $.

* **The Grid:** The large outer brackets $\begin{pmatrix} \dots \end{pmatrix}$ represent the **Shape** (Rows and Columns).
* **The Depth:** Each small inner bracket $\begin{pmatrix} r \\ g \\ b \end{pmatrix}$ is the **Feature Vector** for a single pixel.
* **The Coordinates:** The numbers like $_{1,2}$ mean: “Row 1, Column 2”.

To make colors, we use **three numbers** for every single pixel: one for **Red**, one for **Green**, and one for **Blue**.

We can think of a pixel $P$ as a stack of three values:

$$P = \begin{pmatrix} \color{red}{R} \\ \color{green}{G} \\ \color{blue}{B} \end{pmatrix}$$

By mixing these three primary lights at different brightness levels (0 to 255), you can create a vast range of colors — over 16 million of them!
</div>

<div id="section-rgb">
	<div style="display: flex; align-items: center; gap: 40px; padding: 20px; border-radius: 12px; margin-top: 15px;">
			<div id="rgb-combined-container"></div>
			<canvas id="rgb-preview-canvas" width="3" height="3" style="width: 180px; height: 180px; image-rendering: pixelated; border: 4px solid #333;"></canvas>
	</div>
</div>

<div class="md" data-mathlevel="45">
You can then use full images as tensors, ie you can write an image into a variable, and pass it to functions, and get a vector out of it again:

$$ f\left(\text{Image}\right) = \begin{pmatrix} \text{Probability cat} \\ \text{Probability dog} \end{pmatrix} $$

When we cannot write the function by hand, we learn it instead and call the result a **Model**. A model approximates the true function and stands in for it.

With other methods of making numbers from data (like Embeddings to create numbers from texts, as ChatGPT does, which we will discuss later), we can create models that do many things. For example, we could create a function that maps $\text{Text} \rightarrow \text{Music}$ or $\text{Image} \rightarrow \text{Text}$.

<div class="smart-quote red" data-cite="box1987empirical">
  All models are wrong, but some are useful.
</div>
</div>

<style>
.tcalc-card{background:var(--mn-surface,#fff);border:1px solid var(--mn-border,#e6e6e6);border-radius:var(--mn-radius-lg,14px);padding:18px 18px 20px;margin:18px 0;box-shadow:var(--mn-shadow-sm,0 1px 3px rgba(0,0,0,.06));}
.tcalc-card-title{font-weight:700;font-size:1.02rem;margin-bottom:4px;color:var(--mn-text,#111);}
.tcalc-hint{margin:0 0 14px;font-size:.9rem;color:var(--mn-text-secondary,#666);line-height:1.5;}
.tcalc-bcast-row,.tcalc-contr-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;}
.tcalc-gridwrap{display:flex;flex-direction:column;align-items:center;gap:6px;}
.tcalc-cap{font-size:.82rem;color:var(--mn-text-secondary,#666);font-family:var(--mn-font-mono,monospace);}
.tcalc-sym{font-size:1.5rem;font-weight:700;color:var(--mn-accent,#2b6cb0);padding:0 2px;}
.tcalc-grid{display:grid;gap:4px;}
.tcalc-cell{min-width:42px;padding:5px 6px;text-align:center;font-family:var(--mn-font-mono,monospace);font-size:.9rem;border-radius:var(--mn-radius-sm,6px);border:1px solid var(--mn-border,#e0e0e0);background:var(--mn-bg-subtle,#fafafa);color:var(--mn-text,#111);box-sizing:border-box;}
.tcalc-cell.input{width:52px;-moz-appearance:textfield;}
.tcalc-cell.input::-webkit-outer-spin-button,.tcalc-cell.input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.tcalc-cell.result{background:var(--mn-accent-lighter,#eaf1fb);border-color:var(--mn-accent-light,#cdddf5);font-weight:600;}
.tcalc-cell.result.click{cursor:pointer;}
.tcalc-cell.result.click:hover{outline:2px solid var(--mn-accent-light,#cdddf5);}
.tcalc-cell.result.sel{background:var(--mn-accent,#2b6cb0);border-color:var(--mn-accent,#2b6cb0);color:#fff;}
.tcalc-cell.hl{background:var(--mn-sky-light,#e2f0ff);border-color:var(--mn-sky,#7cc0ff);}
.tcalc-bcast-foot{margin-top:14px;display:flex;flex-direction:column;gap:8px;align-items:center;}
.tcalc-shapes{display:flex;flex-direction:column;gap:3px;align-items:center;}
.tcalc-shape-row{display:flex;gap:4px;align-items:center;}
.tcalc-shape-row .lbl{width:14px;font-family:var(--mn-font-mono,monospace);font-size:.8rem;color:var(--mn-text-secondary,#666);text-align:right;}
.tcalc-dim{min-width:30px;text-align:center;padding:2px 5px;font-size:.82rem;font-family:var(--mn-font-mono,monospace);border:1px dashed var(--mn-border,#ccc);border-radius:4px;color:var(--mn-text,#111);}
.tcalc-dim.stretch{border-style:solid;border-color:var(--mn-emerald,#2f9e6f);color:var(--mn-emerald,#2f9e6f);font-weight:700;}
.tcalc-dim.bad{border-style:solid;border-color:var(--mn-coral,#e0654a);color:var(--mn-coral,#e0654a);font-weight:700;}
.tcalc-status{font-size:.85rem;font-family:var(--mn-font-mono,monospace);}
.tcalc-status.ok{color:var(--mn-emerald,#2f9e6f);}
.tcalc-status.err{color:var(--mn-coral,#e0654a);}
.tcalc-controls{margin-top:14px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding-top:12px;border-top:1px solid var(--mn-border-light,#eee);}
.tcalc-ctl-lbl{font-size:.85rem;color:var(--mn-text-secondary,#666);}
.tcalc-controls select{font:inherit;font-size:.9rem;padding:5px 8px;border-radius:6px;border:1px solid var(--mn-border,#ddd);background:var(--mn-bg,#fff);color:var(--mn-text,#111);}
.tcalc-op{display:inline-flex;border:1px solid var(--mn-border,#ddd);border-radius:6px;overflow:hidden;}
.tcalc-op button{font:inherit;font-size:.95rem;line-height:1;padding:6px 12px;border:none;cursor:pointer;background:var(--mn-bg,#fff);color:var(--mn-text-secondary,#555);}
.tcalc-op button + button{border-left:1px solid var(--mn-border,#ddd);}
.tcalc-op button.active{background:var(--mn-accent,#2b6cb0);color:#fff;}
.tcalc-detail{margin-top:14px;text-align:center;font-size:.95rem;min-height:1.4em;}
.tcalc-presets{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:2px 0;padding-top:12px;border-top:1px solid var(--mn-border-light,#eee);}
.tcalc-preset{font:inherit;font-size:.82rem;line-height:1;padding:6px 11px;border-radius:99px;border:1px solid var(--mn-border,#ddd);background:var(--mn-bg,#fff);color:var(--mn-text-secondary,#555);cursor:pointer;transition:border-color .15s,background .15s,color .15s;}
.tcalc-preset:hover{border-color:var(--mn-accent,#2b6cb0);color:var(--mn-accent,#2b6cb0);}
.tcalc-preset.active{background:var(--mn-accent,#2b6cb0);border-color:var(--mn-accent,#2b6cb0);color:#fff;}
.tcalc-contr-axis{margin-top:12px;text-align:center;font-size:.85rem;color:var(--mn-text-secondary,#666);font-family:var(--mn-font-mono,monospace);}
.tcalc-contr-terms{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;}
.tcalc-chip{display:inline-flex;align-items:center;gap:1px;padding:6px 10px;border-radius:8px;border:1px solid var(--mn-border,#e0e0e0);background:var(--mn-bg-subtle,#fafafa);font-family:var(--mn-font-mono,monospace);font-size:.88rem;color:var(--mn-text,#111);}
.tcalc-chip sub{font-size:.7em;}
.tcalc-chip.result{background:var(--mn-accent-lighter,#eaf1fb);border-color:var(--mn-accent-light,#cdddf5);font-weight:700;}
.tcalc-plus{font-size:1.05rem;font-weight:700;color:var(--mn-accent,#2b6cb0);padding:0 1px;}
.tcalc-contr-cap{margin-top:10px;font-size:.85rem;color:var(--mn-text-secondary,#666);text-align:center;}
@keyframes tcalcPulse{0%{box-shadow:0 0 0 0 rgba(43,108,176,.5);}100%{box-shadow:0 0 0 8px rgba(43,108,176,0);}}
.tcalc-pulse{animation:tcalcPulse .7s ease-out;}
@media (max-width:560px){.tcalc-cell{min-width:34px;padding:4px;}.tcalc-cell.input{width:44px;}.tcalc-sym{font-size:1.25rem;}.tcalc-chip{padding:5px 7px;font-size:.8rem;}}
</style>

<div class="md" data-mathlevel="40">
## Doing arithmetic with tensors

So far a tensor was just *data* — numbers arranged in a shape. But you can also *compute* with it, and two operations power almost everything that follows.

**Element-wise.** Combine the matching entries of two tensors, one by one. The tensors do not even need the same shape: shapes are lined up from the right, an axis of length $1$ stretches to match, and a missing leading axis counts as $1$. This rule is called **broadcasting** \cite[Broadcasting, NumPy]{numpy_broadcasting} — and it quietly explains the $\mathbf{x}+b$ of every affine layer.

**Contraction.** Multiply entries along a shared axis and add them up. The matrix product is exactly one contraction, $M_{ik}=\sum_{j} C_{ij}\,D_{jk}$, where the index $j$ that appears twice is summed over and then hidden — the *summation convention* Einstein introduced in 1916 \cite[Einstein, 1916]{einstein1916annalen}. Contraction is the single most important operation in both linear algebra and deep learning.

Try both below.
</div>

<div class="tcalc-card" id="tcalc-bcast">
  <div class="tcalc-card-title">Broadcasting, hands-on</div>
  <p class="tcalc-hint">Two tensors combine one entry at a time, but they need not share a shape: right-align the shapes, an axis of $1$ stretches, and a missing leading axis counts as $1$. Tap a scenario, or set both shapes yourself — and find the one that fails.</p>
  <div class="tcalc-bcast-row">
    <div class="tcalc-gridwrap">
      <div class="tcalc-cap" id="tcalc-bcast-acap">A (3, 3)</div>
      <div class="tcalc-grid" id="tcalc-bcast-a"></div>
    </div>
    <div class="tcalc-sym" id="tcalc-bcast-sym">+</div>
    <div class="tcalc-gridwrap">
      <div class="tcalc-cap" id="tcalc-bcast-bcap">B (3)</div>
      <div class="tcalc-grid" id="tcalc-bcast-b"></div>
    </div>
    <div class="tcalc-sym">=</div>
    <div class="tcalc-gridwrap">
      <div class="tcalc-cap">result</div>
      <div class="tcalc-grid" id="tcalc-bcast-res"></div>
    </div>
  </div>
  <div class="tcalc-bcast-foot">
    <div class="tcalc-shapes" id="tcalc-bcast-shapes"></div>
    <div class="tcalc-status ok" id="tcalc-bcast-status"></div>
  </div>
  <div class="tcalc-presets" id="tcalc-bcast-presets">
    <span class="tcalc-ctl-lbl">try:</span>
    <button type="button" class="tcalc-preset" data-preset="bias">bias per column</button>
    <button type="button" class="tcalc-preset" data-preset="rows">scale each row</button>
    <button type="button" class="tcalc-preset" data-preset="shift">shift every cell</button>
    <button type="button" class="tcalc-preset" data-preset="batch">batch of 2</button>
    <button type="button" class="tcalc-preset" data-preset="clash">shape clash</button>
  </div>
  <div class="tcalc-controls">
    <span class="tcalc-ctl-lbl">shape of A</span>
    <select id="tcalc-bcast-ashape">
      <option value="sc">scalar ()</option>
      <option value="3">row (3)</option>
      <option value="1x3">row (1, 3)</option>
      <option value="3x1">col (3, 1)</option>
      <option value="3x3" selected>matrix (3, 3)</option>
      <option value="2x3">matrix (2, 3)</option>
      <option value="4">row (4)</option>
    </select>
    <span class="tcalc-ctl-lbl">shape of B</span>
    <select id="tcalc-bcast-bshape">
      <option value="sc">scalar ()</option>
      <option value="3" selected>row (3)</option>
      <option value="1x3">row (1, 3)</option>
      <option value="3x1">col (3, 1)</option>
      <option value="3x3">matrix (3, 3)</option>
      <option value="2x3">matrix (2, 3)</option>
      <option value="4">row (4)</option>
    </select>
    <span class="tcalc-ctl-lbl">operator</span>
    <div class="tcalc-op" id="tcalc-bcast-op">
      <button type="button" data-op="+" class="active">+</button>
      <button type="button" data-op="-">&#8722;</button>
      <button type="button" data-op="*">&#215;</button>
    </div>
  </div>
</div>

<div class="tcalc-card" id="tcalc-contraction">
  <div class="tcalc-card-title">Contraction — the matrix product</div>
  <p class="tcalc-hint">A contraction multiplies entries along a shared axis and adds them — the matrix product is one contraction, $M_{ik}=\sum_{j} C_{ij}D_{jk}$. Click any cell of $M$ to watch its dot product: a row of $C$ dotted with a column of $D$. This single operation is every linear layer in a neural net, $y = Wx$.</p>
  <div class="tcalc-contr-row">
    <div class="tcalc-gridwrap">
      <div class="tcalc-cap">C (2, 2)</div>
      <div class="tcalc-grid" id="tcalc-contr-c"></div>
    </div>
    <div class="tcalc-sym">&#215;</div>
    <div class="tcalc-gridwrap">
      <div class="tcalc-cap">D (2, 2)</div>
      <div class="tcalc-grid" id="tcalc-contr-d"></div>
    </div>
    <div class="tcalc-sym">=</div>
    <div class="tcalc-gridwrap">
      <div class="tcalc-cap">M = C&#183;D (2, 2)</div>
      <div class="tcalc-grid" id="tcalc-contr-m"></div>
    </div>
  </div>
  <div class="tcalc-contr-axis">contract the shared axis: (2, 2) &middot; (2, 2) &rarr; (2, 2)</div>
  <div class="tcalc-detail" id="tcalc-contr-detail"></div>
</div>

<div class="md" data-mathlevel="40" data-optionaltitle="Where the words come from">
### Where the words come from
All four words are old, and each still carries its original meaning:

- **Matrix** — from Latin *matrix*, "womb or mold" (from *māter*, "mother"). Sylvester coined the math word in 1850 for "an oblong arrangement of terms … a Matrix out of which we may form various systems of determinants" \cite[Sylvester, 1850]{sylvester1850matrix} — a mold that *births* determinants. Cayley developed the arithmetic of matrices in 1858 \cite[Cayley, 1858]{cayleymemoirmatrices}.
- **Vector** — from Latin *vĕctōr*, "carrier" (from *vĕhĕre*, "to carry"): it carries a direction and a magnitude.
- **Scalar** — from Latin *scāla*, "ladder" (a single step): one lone number that *scales* a vector. Hamilton set the two apart in his 1846 quaternions — a quaternion is a *scalar* plus a *vector*, and its length is the *tensor* \cite[Tensor, History]{tensor_wiki}, defined in "On some Extensions of Quaternions" \cite[Hamilton, 1854]{hamiltonextensionsquaternions}.
- **Tensor** — from Latin *tendere*, "to stretch." Voigt named the modern physical "Tensoren" in 1898 \cite[Voigt, 1898]{voigt1898krystalle}; the calculus that makes them work is Ricci-Curbastro's and Levi-Civita's, 1900 \cite[Ricci-Curbastro & Levi-Civita, 1900]{riccilevicivita1900}.
- **Summation convention** — a repeated index is summed over, silently. Einstein wrote it down in 1916 \cite[Einstein, 1916]{einstein1916annalen}; it is why the matrix product writes out $\sum_{j}$ and then hides the $j$.
</div>

<script>
  if (typeof initTcalcBroadcast === 'function') initTcalcBroadcast();
  if (typeof initTcalcContraction === 'function') initTcalcContraction();
</script>

<div class="md" data-mathlevel="40" data-optionaltitle="Chaining Functions (Composition)">
## Chaining Functions (Composition)

In programming and math, we often want to take the result of one function and plug it directly into another. This is called **composition**. If we have a function $f$ and a function $g$, applying $f$ first and then $g$ is written as $(g \circ f)(x)$, which is just a shorthand for $g(f(x))$. A deep network is built exactly this way: each layer is a function acting on the previous layer's output, so the whole network is a **chain of composed functions**, and — in Olah's framing — the role that *types* play in programming is played by *representations*: two layers can be composed only when the output representation of one matches the input the next expects \cite[Olah, 2015]{colah2015types}.

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
We can visualize these relationships using a triangle diagram. It shows that there are two ways to reach the same result: either you transform your data first and then apply a function, or you apply a modified version of that function to your raw data. In Category Theory, $A, B, C$ are *objects* (which can be any mathematical objects, like sets) and $f$ and $g$ (the arrows) are so-called *morphisms* (which can be anything that connects mathematical objects to each other, like functions). When both paths lead to the same result, we say the diagram **commutes**.

<center>
<?php
	include("commutation.html");
?>
</center>
</div>

<div class="md" data-mathlevel="45" data-optionaltitle="The Hadamard Product">
## The Hadamard Product ($\odot$)

The **Hadamard Product** ($\odot$) was introduced by \citeauthor{hadamardproduct} to study **singularities** in complex power series: it first appears in his \citeyear{hadamardproduct} paper \citetitle{hadamardproduct}, and the related **Hadamard multiplication theorem** dates from 1899. It is defined for vectors as $\vec{a} \odot \vec{b} = (a_1 b_1, \dots, a_n b_n)^T$ — the coefficients are multiplied term by term — which is exactly what lets one predict the analytic continuation and boundaries of functions derived from known ones.

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

<div class="md" data-mathlevel="45" data-optionaltitle="Matrix Transposition">
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

<div class="md" data-mathlevel="65" data-optionaltitle="Softmax and cross-entropy">
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
