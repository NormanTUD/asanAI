const GATE_PLOTS = ['plot-or-gate', 'plot-xor-gate'];
let _gatePlotsInit = false;
let _gatePlotsRendered = false;

function resizeGatePlots() {
	if (!window.Plotly || !Plotly.Plots || typeof Plotly.Plots.resize !== 'function') return;
	GATE_PLOTS.forEach(function (id) {
		const el = document.getElementById(id);
		if (!el || !el.data || !el.data.length || el.clientWidth <= 0) return;
		try { Plotly.Plots.resize(el); } catch (e) { /* hidden/detached → skip */ }
	});
}

function renderGatePlots() {
	if (_gatePlotsRendered) return;
	const c = document.getElementById('contents');
	if (!c || c.clientWidth <= 0) return;
	_gatePlotsRendered = true;
	renderLinearSeparability();
}

function initGatePlots() {
	if (_gatePlotsInit) return;
	_gatePlotsInit = true;
	const c = document.getElementById('contents');
	if (c && typeof ResizeObserver === 'function') {
		let lastW = -1;
		new ResizeObserver(function () {
			const w = c.clientWidth;
			if (w <= 0 || w === lastW) return;
			lastW = w;
			renderGatePlots();
			resizeGatePlots();
		}).observe(c);
	} else {
		renderGatePlots();
	}
	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(resizeGatePlots);
	}
}

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

	const p1 = Plotly.newPlot('plot-or-gate', orData, { ...layoutBase, title: 'OR Gate: Linearly Separable' });
	const p2 = Plotly.newPlot('plot-xor-gate', xorData, {
		...layoutBase,
		title: 'XOR Gate: NOT Separable',
		annotations: [{
			x: 0.5, y: 0.5, text: 'No single line can<br>separate these classes!',
			showarrow: false, font: { color: themeColor('#475569'), size: 14 }
		}]
	});
	Promise.all([p1, p2]).then(resizeGatePlots).catch(function () {});
	return Promise.all([p1, p2]);
}

async function loadHistoryModule() {
	updateLoadingStatus("Loading section about History...");
	initGatePlots();
	return Promise.resolve();
}

if (window.__MN_DARK) {
	// Defer one tick so the helper.js global Plotly observer (also
	// scheduled via setTimeout(0) and registered first) runs first.
	// Without this, the observer would double-swap our already-themed
	// colors back to the wrong palette.
	window.__MN_DARK.onChange(() => {
		setTimeout(renderLinearSeparability, 0);
	});
}
