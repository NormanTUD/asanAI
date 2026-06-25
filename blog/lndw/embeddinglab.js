const _ec3dCache = {};

function _getEC3D(divId) {
    if (_ec3dCache[divId]) return _ec3dCache[divId];
    const el = document.getElementById(divId);
    if (!el) return null;
    try { Plotly.purge(el); } catch (e) {}
    const loader = el.querySelector('.plot-loading');
    if (loader) loader.remove();
    el.innerHTML = '';
    const chart = echarts.init(el);
    _ec3dCache[divId] = chart;
    new ResizeObserver(() => chart.resize()).observe(el);
    return chart;
}

const evoSpaces = {
	'2d': {
		vocab: { 
			'Mann': [5, -10, 0], 'Frau': [5, 10, 0], 
			'männlich': [0, -20, 0], 'weiblich': [0, 20, 0], 
			'Junge': [-10, -10, 0], 'Mädchen': [-10, 10, 0],
			'Prinz': [15, -10, 0], 'Prinzessin': [15, 10, 0], // Knight durch Prince ersetzt, Princess ergänzt
			'König': [25, -10, 0], 'Königin': [25, 10, 0],
			'Macht': [15, 0, 0]
		},
		axes: { x: 'Power / Age', y: 'Gender' }, 
		dims: 2,
		rangeX: [-15, 40]
	},
};

// ============================================================
// TRANSLATION AS PATH-FINDING ON DUAL MANIFOLDS
// ============================================================

const dualManifoldState = {
	rotationDeg: 55,
	separation: 5,
	showCorrespondence: true,
	showPaths: true,
	aligned: false,
	animating: false,
	origRotation: 55,
	origSeparation: 5,
	rendered: false
};

function dualManifoldZ(u, v) {
	return 0.3 * (u * u - v * v) + 0.15 * Math.sin(u * 2) * Math.cos(v * 2);
}

function getDualEnPos(u, v) {
	return [u, v, dualManifoldZ(u, v)];
}

function getDualJpPos(u, v) {
	const st = dualManifoldState;
	const x = u, y = v, z = dualManifoldZ(u, v);
	const rad = st.rotationDeg * Math.PI / 180;
	// Rotate the (x, y) plane around the Z axis, then offset vertically
	return [
		x * Math.cos(rad) - y * Math.sin(rad),
		x * Math.sin(rad) + y * Math.cos(rad),
		z + st.separation
	];
}

function renderDualManifolds() {
	const plotDiv = document.getElementById('plot-dual-manifolds');
	if (!plotDiv) return;

	const st = dualManifoldState;
	const resolution = 30;
	const uRange = Array.from({length: resolution}, (_, i) => -2 + (4 * i / (resolution - 1)));
	const vRange = Array.from({length: resolution}, (_, i) => -1.5 + (3 * i / (resolution - 1)));

	// --- English manifold surface ---
	const enSX = [], enSY = [], enSZ = [];
	for (let i = 0; i < resolution; i++) {
		const rx = [], ry = [], rz = [];
		for (let j = 0; j < resolution; j++) {
			const [x, y, z] = getDualEnPos(uRange[i], vRange[j]);
			rx.push(x); ry.push(y); rz.push(z);
		}
		enSX.push(rx); enSY.push(ry); enSZ.push(rz);
	}

	// --- Japanese manifold surface (rotated + offset) ---
	const jpSX = [], jpSY = [], jpSZ = [];
	for (let i = 0; i < resolution; i++) {
		const rx = [], ry = [], rz = [];
		for (let j = 0; j < resolution; j++) {
			const [x, y, z] = getDualJpPos(uRange[i], vRange[j]);
			rx.push(x); ry.push(y); rz.push(z);
		}
		jpSX.push(rx); jpSY.push(ry); jpSZ.push(rz);
	}

	// --- Word definitions (shared parametric coords) ---
	const wordDefs = [
		{ en: 'King',     jp: '王様',  u:  1.2, v: -0.6, color: '#f59e0b' },
		{ en: 'Queen',    jp: '女王',  u:  1.2, v:  0.6, color: '#f59e0b' },
		{ en: 'Man',      jp: '男',    u: -0.5, v: -0.6, color: '#3b82f6' },
		{ en: 'Woman',    jp: '女',    u: -0.5, v:  0.6, color: '#3b82f6' },
		{ en: 'Prince',   jp: '王子',  u:  0.4, v: -0.6, color: '#10b981' },
		{ en: 'Princess', jp: '王女',  u:  0.4, v:  0.6, color: '#10b981' },
	];

	const traces = [];

	// ---- Surfaces ----
	traces.push({
		type: 'surface',
		x: enSX, y: enSY, z: enSZ,
		colorscale: [[0, 'rgba(191,219,254,0.7)'], [1, 'rgba(96,165,250,0.7)']],
		showscale: false, opacity: 0.4, hoverinfo: 'skip',
		name: 'English Manifold',
		contours: {
			x: { show: true, color: 'rgba(59,130,246,0.15)', width: 1 },
			y: { show: true, color: 'rgba(59,130,246,0.15)', width: 1 },
			z: { show: false }
		}
	});
	traces.push({
		type: 'surface',
		x: jpSX, y: jpSY, z: jpSZ,
		colorscale: [[0, 'rgba(187,247,208,0.7)'], [1, 'rgba(74,222,128,0.7)']],
		showscale: false, opacity: 0.4, hoverinfo: 'skip',
		name: 'Japanese Manifold',
		contours: {
			x: { show: true, color: 'rgba(16,185,129,0.15)', width: 1 },
			y: { show: true, color: 'rgba(16,185,129,0.15)', width: 1 },
			z: { show: false }
		}
	});

	// ---- Internal structure lines on BOTH manifolds ----
	const structPairs = [
		// Gender pairs (horizontal in v)
		['Man', 'Woman'], ['King', 'Queen'], ['Prince', 'Princess'],
		// Power chain (horizontal in u)
		['Man', 'Prince'], ['Prince', 'King'],
		['Woman', 'Princess'], ['Princess', 'Queen']
	];

	structPairs.forEach(([a, b]) => {
		const wa = wordDefs.find(w => w.en === a);
		const wb = wordDefs.find(w => w.en === b);

		// English structure
		const ea = getDualEnPos(wa.u, wa.v);
		const eb = getDualEnPos(wb.u, wb.v);
		traces.push({
			type: 'scatter3d',
			x: [ea[0], eb[0]], y: [ea[1], eb[1]], z: [ea[2], eb[2]],
			mode: 'lines',
			line: { color: 'rgba(148,163,184,0.4)', width: 2 },
			showlegend: false, hoverinfo: 'skip'
		});

		// Japanese structure
		const ja = getDualJpPos(wa.u, wa.v);
		const jb = getDualJpPos(wb.u, wb.v);
		traces.push({
			type: 'scatter3d',
			x: [ja[0], jb[0]], y: [ja[1], jb[1]], z: [ja[2], jb[2]],
			mode: 'lines',
			line: { color: 'rgba(148,163,184,0.4)', width: 2 },
			showlegend: false, hoverinfo: 'skip'
		});
	});

	// ---- Word points ----
	const enX = [], enY = [], enZ = [], enLabels = [], enColors = [];
	const jpX = [], jpY = [], jpZ = [], jpLabels = [], jpColors = [];

	wordDefs.forEach(w => {
		const ep = getDualEnPos(w.u, w.v);
		enX.push(ep[0]); enY.push(ep[1]); enZ.push(ep[2]);
		enLabels.push(w.en); enColors.push(w.color);

		const jp = getDualJpPos(w.u, w.v);
		jpX.push(jp[0]); jpY.push(jp[1]); jpZ.push(jp[2]);
		jpLabels.push(w.jp); jpColors.push(w.color);
	});

	traces.push({
		type: 'scatter3d',
		x: enX, y: enY, z: enZ,
		mode: 'markers+text',
		text: enLabels, textposition: 'top center',
		textfont: { size: 11, color: '#1e40af' },
		marker: { size: 7, color: enColors, opacity: 0.95, line: { width: 1, color: '#fff' } },
		name: 'English words',
		hovertemplate: '<b>%{text}</b> (English)<extra></extra>'
	});

	traces.push({
		type: 'scatter3d',
		x: jpX, y: jpY, z: jpZ,
		mode: 'markers+text',
		text: jpLabels, textposition: 'bottom center',
		textfont: { size: 11, color: '#065f46' },
		marker: { size: 7, color: jpColors, opacity: 0.95, symbol: 'diamond', line: { width: 1, color: '#fff' } },
		name: 'Japanese words (日本語)',
		hovertemplate: '<b>%{text}</b> (日本語)<extra></extra>'
	});

	// ---- Manifold labels ----
	const enLabelPos = getDualEnPos(-1.9, 0);
	traces.push({
		type: 'scatter3d',
		x: [enLabelPos[0]], y: [enLabelPos[1]], z: [enLabelPos[2] + 0.6],
		mode: 'text', text: ['English'],
		textfont: { size: 14, color: '#1e40af' },
		showlegend: false, hoverinfo: 'skip'
	});

	const jpLabelPos = getDualJpPos(-1.9, 0);
	traces.push({
		type: 'scatter3d',
		x: [jpLabelPos[0]], y: [jpLabelPos[1]], z: [jpLabelPos[2] - 0.6],
		mode: 'text', text: ['日本語'],
		textfont: { size: 14, color: '#065f46' },
		showlegend: false, hoverinfo: 'skip'
	});

	// ---- Correspondence lines (cross-manifold bridges) ----
	if (st.showCorrespondence) {
		wordDefs.forEach(w => {
			const ep = getDualEnPos(w.u, w.v);
			const jp = getDualJpPos(w.u, w.v);
			traces.push({
				type: 'scatter3d',
				x: [ep[0], jp[0]], y: [ep[1], jp[1]], z: [ep[2], jp[2]],
				mode: 'lines',
				line: { color: 'rgba(139,92,246,0.5)', width: 3, dash: 'dash' },
				showlegend: false,
				hovertemplate: `<b>${w.en} ↔ ${w.jp}</b><br>Cross-lingual correspondence<extra></extra>`
			});
		});
	}

	// ---- Translation paths (geodesics on each surface) ----
	if (st.showPaths) {
		const pathWords = ['Man', 'King', 'Queen'];
		const pathSteps = 25;
		const enPX = [], enPY = [], enPZ = [];
		const jpPX = [], jpPY = [], jpPZ = [];

		for (let seg = 0; seg < pathWords.length - 1; seg++) {
			const from = wordDefs.find(w => w.en === pathWords[seg]);
			const to = wordDefs.find(w => w.en === pathWords[seg + 1]);
			for (let s = 0; s <= pathSteps; s++) {
				const t = s / pathSteps;
				const iu = from.u + t * (to.u - from.u);
				const iv = from.v + t * (to.v - from.v);

				const ep = getDualEnPos(iu, iv);
				enPX.push(ep[0]); enPY.push(ep[1]); enPZ.push(ep[2]);

				const jp = getDualJpPos(iu, iv);
				jpPX.push(jp[0]); jpPY.push(jp[1]); jpPZ.push(jp[2]);
			}
		}

		traces.push({
			type: 'scatter3d',
			x: enPX, y: enPY, z: enPZ,
			mode: 'lines',
			line: { width: 7, color: '#3b82f6' },
			name: 'English: Man → King → Queen',
			hovertemplate: '<b>English geodesic</b><br>Man → King → Queen<extra></extra>'
		});

		traces.push({
			type: 'scatter3d',
			x: jpPX, y: jpPY, z: jpPZ,
			mode: 'lines',
			line: { width: 7, color: '#10b981' },
			name: 'Japanese: 男 → 王様 → 女王',
			hovertemplate: '<b>Japanese geodesic</b><br>男 → 王様 → 女王<extra></extra>'
		});

		// Arrowhead cones at the end of each path
		const enEnd = getDualEnPos(wordDefs.find(w=>w.en==='Queen').u, wordDefs.find(w=>w.en==='Queen').v);
		const enPrev = getDualEnPos(wordDefs.find(w=>w.en==='King').u, wordDefs.find(w=>w.en==='King').v);
		traces.push({
			type: 'cone',
			x: [enEnd[0]], y: [enEnd[1]], z: [enEnd[2]],
			u: [enEnd[0]-enPrev[0]], v: [enEnd[1]-enPrev[1]], w: [enEnd[2]-enPrev[2]],
			sizemode: 'absolute', sizeref: 0.4, showscale: false,
			colorscale: [[0,'#3b82f6'],[1,'#3b82f6']], hoverinfo: 'skip'
		});

		const jpEnd = getDualJpPos(wordDefs.find(w=>w.en==='Queen').u, wordDefs.find(w=>w.en==='Queen').v);
		const jpPrev = getDualJpPos(wordDefs.find(w=>w.en==='King').u, wordDefs.find(w=>w.en==='King').v);
		traces.push({
			type: 'cone',
			x: [jpEnd[0]], y: [jpEnd[1]], z: [jpEnd[2]],
			u: [jpEnd[0]-jpPrev[0]], v: [jpEnd[1]-jpPrev[1]], w: [jpEnd[2]-jpPrev[2]],
			sizemode: 'absolute', sizeref: 0.4, showscale: false,
			colorscale: [[0,'#10b981'],[1,'#10b981']], hoverinfo: 'skip'
		});
	}

	const layout = {
		margin: { l: 0, r: 0, b: 0, t: 0 },
		showlegend: true,
		legend: {
			x: 0.01, y: 0.99,
			bgcolor: 'rgba(255,255,255,0.9)',
			bordercolor: '#e2e8f0', borderwidth: 1,
			font: { size: 11 }
		},
		scene: {
			xaxis: { title: '', showgrid: true, gridcolor: '#f1f5f9', zeroline: false, showticklabels: false },
			yaxis: { title: '', showgrid: true, gridcolor: '#f1f5f9', zeroline: false, showticklabels: false },
			zaxis: { title: '', showgrid: true, gridcolor: '#f1f5f9', zeroline: false, showticklabels: false },
			camera: { eye: { x: 1.5, y: 1.8, z: 1.2 } },
			bgcolor: '#fff',
			aspectmode: 'data'
		}
	};

	Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true })
		.then(() => {
			dualManifoldState.rendered = true;
			const loader = plotDiv.querySelector('.plot-loading');
			if (loader) loader.remove();
		});
}

// ---- Controls ----

window.updateDualManifold = function() {
	const st = dualManifoldState;
	const rotSlider = document.getElementById('dm-rotation');
	const sepSlider = document.getElementById('dm-separation');

	st.rotationDeg = parseFloat(rotSlider.value);
	st.separation = parseFloat(sepSlider.value);

	document.getElementById('dm-rot-val').textContent = Math.round(st.rotationDeg) + '°';
	document.getElementById('dm-sep-val').textContent = st.separation.toFixed(1);

	renderDualManifolds();
};

window.toggleDualManifold = function() {
	const st = dualManifoldState;
	st.showCorrespondence = document.getElementById('dm-correspondence').checked;
	st.showPaths = document.getElementById('dm-paths').checked;
	renderDualManifolds();
};

window.animateDualManifoldAlignment = function() {
	const st = dualManifoldState;
	if (st.animating || st.aligned) return;

	st.animating = true;
	const btn = document.getElementById('btn-dm-align');
	btn.disabled = true;
	btn.style.opacity = '0.5';

	const startRot = st.rotationDeg;
	const startSep = st.separation;
	const duration = 2500;
	const startTime = performance.now();

	function easeInOutCubic(t) {
		return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
	}

	function step(now) {
		const elapsed = now - startTime;
		const rawT = Math.min(elapsed / duration, 1);
		const t = easeInOutCubic(rawT);

		st.rotationDeg = startRot * (1 - t);
		st.separation = startSep * (1 - t);

		document.getElementById('dm-rotation').value = st.rotationDeg;
		document.getElementById('dm-separation').value = st.separation;
		document.getElementById('dm-rot-val').textContent = Math.round(st.rotationDeg) + '°';
		document.getElementById('dm-sep-val').textContent = st.separation.toFixed(1);

		const statusEl = document.getElementById('dm-status');
		if (statusEl) {
			statusEl.textContent = `Aligning... rotation: ${Math.round(st.rotationDeg)}° → 0°, separation: ${st.separation.toFixed(1)} → 0`;
		}

		renderDualManifolds();

		if (rawT < 1) {
			requestAnimationFrame(step);
		} else {
			st.rotationDeg = 0;
			st.separation = 0;
			st.animating = false;
			st.aligned = true;
			btn.disabled = true;

			document.getElementById('dm-rotation').value = 0;
			document.getElementById('dm-separation').value = 0;
			document.getElementById('dm-rot-val').textContent = '0°';
			document.getElementById('dm-sep-val').textContent = '0.0';

			if (statusEl) {
statusEl.innerHTML = '✅ <b>Aligned!</b> Both manifolds overlap — the paths merge. Translation is the same geometric journey on both surfaces.';
				statusEl.style.color = '#10b981';
			}
			renderDualManifolds();
		}
	}
	requestAnimationFrame(step);
};

window.resetDualManifold = function() {
	const st = dualManifoldState;
	if (st.animating) return;

	st.rotationDeg = st.origRotation;
	st.separation = st.origSeparation;
	st.aligned = false;

	document.getElementById('dm-rotation').value = st.origRotation;
	document.getElementById('dm-separation').value = st.origSeparation;
	document.getElementById('dm-rot-val').textContent = st.origRotation + '°';
	document.getElementById('dm-sep-val').textContent = st.origSeparation.toFixed(1);

	const btn = document.getElementById('btn-dm-align');
	btn.disabled = false;
	btn.style.opacity = '1';

	const statusEl = document.getElementById('dm-status');
	if (statusEl) {
		statusEl.textContent = 'Ready — Japanese manifold is rotated 55° and separated.';
		statusEl.style.color = '#64748b';
	}
	renderDualManifolds();
};

function renderSpace(key, highlightPos = null, steps = []) {
    const divId = `plot-${key}`;
    const plotDiv = document.getElementById(divId);
    if (!plotDiv) return;

    const space = evoSpaces[key];
    const is3D = (space.dims === 3);
    const rangeX = space.rangeX || [-30, 30];

    // ═══════ 3D → ECharts GL ═══════
    if (is3D) {
        const chart = _getEC3D(divId);
        if (!chart) return;

        const series = [];

        series.push({
            type: 'scatter3D',
            name: 'Vocabulary',
            data: Object.keys(space.vocab).map(w => ({
                value: [...space.vocab[w]],
                name: w
            })),
            symbolSize: 8,
            itemStyle: { color: '#94a3b8', opacity: 0.6, borderColor: '#fff', borderWidth: 1 },
            label: {
                show: true,
                formatter: '{b}',
                distance: 8,
                textStyle: { fontSize: 11, color: '#475569' }
            },
            emphasis: {
                itemStyle: { color: '#64748b', borderWidth: 2 },
                label: { fontSize: 13, fontWeight: 'bold' }
            }
        });

        steps.forEach(step => {
            series.push({
                type: 'line3D',
                data: [[...step.from], [...step.to]],
                lineStyle: { color: '#3b82f6', width: 4, opacity: 0.85 },
                silent: true
            });
            series.push({
                type: 'scatter3D',
                data: [{ value: [...step.to], name: step.label }],
                symbolSize: 10,
                symbol: 'triangle',
                itemStyle: { color: '#3b82f6' },
                label: { show: false }
            });
        });

        if (highlightPos) {
            series.push({
                type: 'scatter3D',
                name: 'Result',
                data: [{ value: [...highlightPos] }],
                symbolSize: 16,
                symbol: 'diamond',
                itemStyle: { color: '#ef4444' },
                label: { show: false }
            });
        }

        chart.setOption({
            tooltip: { show: true },
            grid3D: {
                boxWidth: 100, boxHeight: 100, boxDepth: 100,
                viewControl: {
                    autoRotate: false,
                    damping: 0.85,
                    rotateSensitivity: 2,
                    zoomSensitivity: 1.2
                },
                light: {
                    main: { intensity: 1.2, shadow: false },
                    ambient: { intensity: 0.4 }
                },
                axisLine:  { lineStyle: { color: '#cbd5e1' } },
                axisLabel: { textStyle: { color: '#94a3b8' } },
                splitLine: { lineStyle: { color: '#f1f5f9' } }
            },
            xAxis3D: { name: space.axes.x, type: 'value', min: rangeX[0], max: rangeX[1] },
            yAxis3D: { name: space.axes.y, type: 'value', min: -30, max: 30 },
            zAxis3D: { name: space.axes.z, type: 'value', min: -30, max: 30 },
            series
        }, true);

        return;
    }

    // ═══════ 1D / 2D → Plotly ═══════
    let traces = [];
    let annotations = [];

    Object.keys(space.vocab).forEach(word => {
        const v = space.vocab[word];
        traces.push({
            type: 'scatter',
            x: [v[0]], y: [v[1]],
            mode: 'markers+text',
            name: word, text: [word], textposition: 'top center',
            marker: { size: 6, opacity: 0.5, color: '#94a3b8' },
            cliponaxis: false
        });
    });

    steps.forEach(step => {
        annotations.push({
            ax: step.from[0], ay: step.from[1],
            axref: 'x', ayref: 'y',
            x: step.to[0], y: step.to[1],
            xref: 'x', yref: 'y',
            showarrow: true, arrowhead: 2, arrowsize: 1.5,
            arrowwidth: 3, arrowcolor: '#3b82f6'
        });
        traces.push({
            type: 'scatter',
            x: [(step.from[0] + step.to[0]) / 2],
            y: [(step.from[1] + step.to[1]) / 2],
            mode: 'markers',
            marker: { size: 12, color: 'rgba(59,130,246,0.01)' },
            text: [step.label],
            hovertemplate: '<b>%{text}</b><extra></extra>',
            showlegend: false, cliponaxis: false
        });
    });

    if (highlightPos) {
        traces.push({
            type: 'scatter',
            x: [highlightPos[0]], y: [highlightPos[1]],
            mode: 'markers',
            marker: { size: 12, color: '#ef4444', symbol: 'diamond' }
        });
    }

    Plotly.react(divId, traces, {
        margin: { l: 40, r: 40, b: 40, t: 20 },
        showlegend: false,
        xaxis: { range: rangeX, title: space.axes.x },
        yaxis: { range: [-30, 30], title: space.axes.y || '', visible: space.dims > 1 },
        annotations
    }).then(() => {
        const loader = plotDiv.querySelector('.plot-loading');
        if (loader) loader.remove();
    });
}

let _calcEvoFocusState = {};
let _calcEvoTimers = {};
let _renderingInProgress = {};

function calcEvo(key) {
    const inputEl = document.getElementById(`input-${key}`);
    if (!inputEl) return;
    
    // ═══════════════════════════════════════════════════════════
    // CRITICAL FIX: Save the CURRENT input value immediately
    // because DOM mutations can clear it
    // ═══════════════════════════════════════════════════════════
    const inputVal = inputEl.value;
    const space = evoSpaces[key];
    const resDiv = document.getElementById(`res-${key}`);

    const selStart = inputEl.selectionStart;
    const selEnd = inputEl.selectionEnd;
    _calcEvoFocusState[key] = { selStart, selEnd, value: inputVal };

    _renderingInProgress[key] = true;

    if (_calcEvoTimers[key]) {
        clearTimeout(_calcEvoTimers[key]);
    }

    const lowerVocab = Object.keys(space.vocab).reduce((acc, word) => {
        acc[word.toLowerCase()] = { vec: space.vocab[word], original: word };
        return acc;
    }, {});

    const tokens = inputVal.match(/[a-zA-Z\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc]+|\d*\.\d+|\d+|[\+\-\*\/\(\)]/g);
    if (!tokens) {
        _renderingInProgress[key] = false;
        return;
    }

    let pos = 0;
    let steps = [];

    const toVecTex = (arr) => `\\begin{pmatrix} ${arr.slice(0, space.dims).map(v => v.toFixed(1)).join(' \\\\ ')} \\end{pmatrix}`;

    function peek() { return tokens[pos]; }
    function consume() { return tokens[pos++]; }

    function parseFactor() {
        let token = peek();
        if (token === undefined) return { val: [0, 0, 0], tex: '', isScalar: false, label: '' };
        consume();

        if (token === '(') {
            let res = parseExpression();
            if (peek() === ')') consume();
            return { val: res.val, tex: `\\left( ${res.tex} \\right)`, isScalar: res.isScalar, label: res.label };
        }
        if (token === '-') {
            let res = parseFactor();
            return { val: res.val.map(v => -v), tex: `-${res.tex}`, isScalar: res.isScalar, label: `-${res.label}` };
        }
        if (!isNaN(token)) {
            const s = parseFloat(token);
            return { val: [s, 0, 0], tex: `${s}`, isScalar: true, label: `${s}` };
        }

        const entry = lowerVocab[token.toLowerCase()];
        const vec = [...(entry ? entry.vec : [0, 0, 0])];
        const displayName = entry ? entry.original : token;

        return {
            val: vec,
            tex: `\\underbrace{${toVecTex(vec)}}_{\\text{${displayName}}}`,
            isScalar: false,
            label: displayName
        };
    }

    function parseTerm() {
        let left = parseFactor();
        while (peek() === '*' || peek() === '/') {
            let op = consume();
            let right = parseFactor();
            let opTex = op === '*' ? '\\cdot' : '\\div';

            if (op === '*') {
                if (left.isScalar) {
                    left.val = right.val.map(v => left.val[0] * v);
                    left.isScalar = right.isScalar;
                } else if (right.isScalar) {
                    left.val = left.val.map(v => v * right.val[0]);
                }
            } else if (op === '/') {
                left.val = left.val.map(v => v / (right.val[0] || 1));
            }

            left.tex = `${left.tex} ${opTex} ${right.tex}`;
            left.label = `${left.label}${op}${right.label}`;
        }
        return left;
    }

    function parseExpression() {
        let left = parseTerm();
        while (peek() === '+' || peek() === '-') {
            let op = consume();
            let right = parseTerm();
            let prev = [...left.val];

            if (op === '+') {
                left.val = left.val.map((v, i) => v + right.val[i]);
            } else if (op === '-') {
                left.val = left.val.map((v, i) => v - right.val[i]);
            }

            steps.push({ from: prev, to: [...left.val], label: `${op}${right.label}` });
            left.tex = `${left.tex} ${op} ${right.tex}`;
            left.label = `${left.label}${op}${right.label}`;
        }
        return left;
    }

    try {
        const result = parseExpression();
        let nearest = "None";
        let nearestVec = [0, 0, 0];
        let minDist = Infinity;

        Object.keys(space.vocab).forEach(w => {
            const v = space.vocab[w];
            const d = Math.sqrt(v.reduce((s, val, i) => s + Math.pow(val - result.val[i], 2), 0));
            if (d < minDist) {
                minDist = d;
                nearest = w;
                nearestVec = v;
            }
        });

        const isExact = minDist < 0.01;
        const symbol = isExact ? "=" : "\\approx";
        const resultTex = `\\underbrace{${toVecTex(result.val)}}_{\\substack{ ${symbol} \\text{ ${nearest}} \\\\ ${toVecTex(nearestVec)} }}`;

        // ═══════════════════════════════════════════════════════════
        // CRITICAL FIX: Render math COMPLETELY offline, then inject
        // as pre-rendered HTML. Mark with data-math-rendered so
        // render_temml() NEVER touches it again.
        // ═══════════════════════════════════════════════════════════
        const fullTex = `${result.tex} = ${resultTex}`;
        let renderedHtml;
        try {
            renderedHtml = temml.renderToString(fullTex, { displayMode: true });
        } catch(e) {
            renderedHtml = `<span style="color:red;">Render Error</span>`;
        }

        // ═══════════════════════════════════════════════════════════
        // CRITICAL FIX: Use innerHTML on resDiv directly with
        // data-math-rendered already set BEFORE the write, so the
        // MutationObserver doesn't re-trigger render_temml on it
        // ═══════════════════════════════════════════════════════════
        resDiv.setAttribute('data-math-rendered', 'true');
        resDiv.innerHTML = `<div data-math-rendered="true" style="overflow-x: auto; padding: 15px 0; font-size: 1.1em;">${renderedHtml}</div>`;

        // ═══════════════════════════════════════════════════════════
        // CRITICAL FIX: Restore input value AND focus immediately
        // because innerHTML on a sibling can cause browser to reset
        // ═══════════════════════════════════════════════════════════
        if (inputEl.value !== inputVal) {
            inputEl.value = inputVal;
        }
        if (document.activeElement !== inputEl) {
            inputEl.focus();
        }
        inputEl.setSelectionRange(selStart, selEnd);

        // Debounced plot render
        const capturedResult = [...result.val];
        const capturedSteps = steps.map(s => ({...s, from: [...s.from], to: [...s.to]}));
        const capturedSelStart = selStart;
        const capturedSelEnd = selEnd;
        const capturedValue = inputVal;

        _calcEvoTimers[key] = setTimeout(() => {
            const inputStillFocused = (document.activeElement === inputEl);

            _renderingInProgress[key] = true;

            renderSpace(key, capturedResult, capturedSteps);

            const restoreFocus = () => {
                // Also restore value if it got wiped
                if (inputEl.value !== capturedValue && inputEl.value === '') {
                    inputEl.value = capturedValue;
                }
                if (inputStillFocused && document.activeElement !== inputEl) {
                    const freshState = _calcEvoFocusState[key] || { selStart: capturedSelStart, selEnd: capturedSelEnd };
                    inputEl.focus();
                    inputEl.setSelectionRange(freshState.selStart, freshState.selEnd);
                }
            };

            restoreFocus();
            requestAnimationFrame(() => {
                restoreFocus();
                setTimeout(() => {
                    restoreFocus();
                    _renderingInProgress[key] = false;
                }, 50);
            });

            setTimeout(() => {
                restoreFocus();
                _renderingInProgress[key] = false;
            }, 200);

        }, 150);

    } catch(e) {
        console.error(e);
        resDiv.setAttribute('data-math-rendered', 'true');
        resDiv.innerText = "Syntax Error";
        _renderingInProgress[key] = false;
    }
}

function observeAndRenderMath(targetNode = document.body) {
    if (!targetNode) {
        console.warn("MutationObserver: Ziel-Element nicht gefunden.");
        return;
    }

    const config = { childList: true, subtree: true, characterData: true };

    const callback = function(mutationsList) {
        // ═══════════════════════════════════════════════════════════
        // CRITICAL: Skip mutations caused by calcEvo result rendering
        // ═══════════════════════════════════════════════════════════
        let shouldRender = false;
        for (const mutation of mutationsList) {
            const target = mutation.target;
            // Skip if mutation is inside a res-* div (our own output)
            if (target && (
                target.id === 'res-2d' || target.id === 'res-1d' || target.id === 'res-3d' ||
                (target.closest && (target.closest('#res-2d') || target.closest('#res-1d') || target.closest('#res-3d') ||
                 target.closest('#res-2d-wrapper') || target.closest('#res-1d-wrapper') || target.closest('#res-3d-wrapper')))
            )) {
                continue; // Skip this mutation
            }
            
            if (mutation.type === 'characterData' || mutation.type === 'childList') {
                const parent = mutation.target.parentElement;
                if (parent && parent.hasAttribute('data-math-rendered')) {
                    parent.removeAttribute('data-math-rendered');
                }
                shouldRender = true;
            }
        }
        if (shouldRender) {
            render_temml();
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
}

const _temmlOpts = {
	delimiters: [
		{ left: "$$", right: "$$", display: true },
		{ left: "$",  right: "$",  display: false }
	],
	annotate: true
};

function _fixMathInElement(el) {
    // ===== Skip already-rendered elements =====
    if (el.hasAttribute('data-math-rendered')) return false;
    if (el.querySelector('math')) return false;

    // ===== Skip elements that ARE code blocks or are INSIDE code blocks =====
    if (el.tagName === 'PRE' || el.tagName === 'CODE') return false;
    if (el.closest('pre, code')) return false;

    // ===== Check if element contains code blocks =====
    // If it does, we need to mark code blocks so Temml skips them,
    // then let Temml handle it natively
    const codeBlocks = el.querySelectorAll('pre, code');
    if (codeBlocks.length > 0) {
        // Temporarily add a class that prevents Temml from processing these
        codeBlocks.forEach(cb => cb.setAttribute('data-temml-skip', 'true'));

        // Use Temml's native renderMathInElement but with a custom filter
        // that skips code blocks
        _renderMathSkippingCode(el);
        el.setAttribute('data-math-rendered', 'true');

        // Clean up
        codeBlocks.forEach(cb => cb.removeAttribute('data-temml-skip'));
        return true;
    }

    // ===== For elements WITHOUT code blocks, fix the em/strong issue =====
    // The problem: markdown renderers turn _x_ into <em>x</em> inside math
    // We need to undo this ONLY inside $...$ delimiters

    let html = el.innerHTML;
    if (!html.includes('$')) return false;

    // Check if there are <em> or <strong> tags inside math delimiters
    // If not, no need for our fix — let Temml handle it natively
    const hasMathWithMarkup = /\$[^$]*<\/?(?:em|strong)[^>]*>[^$]*\$/i.test(html);
    if (!hasMathWithMarkup) return false;

    // ===== Only fix the specific problem: <em>/<strong> inside math =====
    let changed = false;

    // Block math: $$ ... $$
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
        if (!/<\/?(?:em|strong)/i.test(inner)) return match;

        const clean = _cleanMathContent(inner);
        if (!clean) return match;

        try {
            const rendered = temml.renderToString(clean, { displayMode: true });
            changed = true;
            return rendered;
        } catch (e) {
            console.warn('Temml block error:', clean, e);
            return match;
        }
    });

    // Inline math: $ ... $
    // Use a more conservative regex that won't match across lines
    html = html.replace(/(?<!\$)\$(?!\$)([^$\n]*?)(?<!\$)\$(?!\$)/g, (match, inner) => {
        if (!inner.trim()) return match;
        if (inner.includes('<math') || inner.includes('</math>')) return match;

        // Only intervene if there's HTML markup inside the math
        if (!/</.test(inner)) return match;

        const clean = _cleanMathContent(inner);
        if (!clean) return match;

        try {
            const rendered = temml.renderToString(clean, { displayMode: false });
            changed = true;
            return rendered;
        } catch (e) {
            console.warn('Temml inline error:', clean, e);
            return match;
        }
    });

    if (changed) {
        el.innerHTML = html;
        el.setAttribute('data-math-rendered', 'true');
    }
    return changed;
}

function _cleanMathContent(inner) {
    return inner
        .replace(/<\/?em>/gi, '_')
        .replace(/<\/?strong>/gi, '')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/?p>/gi, '')
        .replace(/<\/?span[^>]*>/gi, '')
        .replace(/<\/?[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .trim();
}

function _renderMathSkippingCode(el) {
    // Walk through child nodes, only render math in non-code sections
    const children = Array.from(el.childNodes);

    for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            // Skip code blocks entirely
            if (child.tagName === 'PRE' || child.tagName === 'CODE' ||
                child.hasAttribute('data-temml-skip')) {
                continue;
            }
            // Recurse into child elements
            if (child.textContent.includes('$')) {
                // Check if this child itself has code blocks
                if (child.querySelector('[data-temml-skip]')) {
                    _renderMathSkippingCode(child);
                } else {
                    // Safe to render math in this subtree
                    const hasMathWithMarkup = /\$[^$]*<\/?(?:em|strong)[^>]*>[^$]*\$/i.test(child.innerHTML);
                    if (hasMathWithMarkup) {
                        _fixMathInElement(child);
                    } else {
                        temml.renderMathInElement(child, _temmlOpts);
                    }
                }
            }
        }
    }
}

function _manualRenderMath(el) {
    if (!el || typeof temml === 'undefined') return;
    let html = el.innerHTML;
    if (!html.includes('$')) return;

    // Display math: $$...$$
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
        const clean = inner.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
        try { return temml.renderToString(clean, { displayMode: true }); }
        catch (e) { return match; }
    });

    // Inline math: $...$
    html = html.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, (match, inner) => {
        if (!inner.trim() || inner.includes('<math')) return match;
        const clean = inner.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
        try { return temml.renderToString(clean, { displayMode: false }); }
        catch (e) { return match; }
    });

    el.innerHTML = html;
}

const _temmlObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            if (el.isConnected &&
                !el.hasAttribute('data-math-rendered') &&
                el.textContent.includes('$')) {
                // Versuche zuerst unseren Fix
                const fixed = _fixMathInElement(el);
                // Falls unser Fix nichts gefunden hat, Temml normal laufen lassen
                if (!fixed) {
                    if (typeof temml !== 'undefined' && typeof temml.renderMathInElement === 'function') {
                        temml.renderMathInElement(el, _temmlOpts);
                    } else {
                        _manualRenderMath(el);
                    }
                    el.setAttribute('data-math-rendered', 'true');
                }
            }
            _temmlObserver.unobserve(el);
        }
    });
}, {
    threshold: 0,
    rootMargin: rootMargin
});

function render_temml() {

	/* ═══════════════════════════════════════════════════════════════════════════
	   ONE-TIME POPUP BOOTSTRAP
	   ═══════════════════════════════════════════════════════════════════════════ */
	if (!render_temml._popupReady) {
		render_temml._popupReady   = true;
		render_temml._overlay      = null;
		render_temml._mathEl       = null;
		render_temml._currentLatex = null;
		render_temml._containerEl  = null;
		render_temml._mathIndex    = -1;

		const s = document.createElement('style');
		s.id = 'temml-popup-css';
		s.textContent = `
			.lp-overlay{
				position:fixed;inset:0;
				background:rgba(0,0,0,.18);backdrop-filter:blur(4px);
				z-index:100000;display:flex;align-items:center;justify-content:center;
				animation:lpFadeIn .18s ease-out}
			@keyframes lpFadeIn{from{opacity:0}to{opacity:1}}
			@keyframes lpSlideUp{from{opacity:0;transform:translateY(12px) scale(.97)}
				to{opacity:1;transform:translateY(0) scale(1)}}

			.lp-box{
				background:#ffffff;
				border:1px solid rgba(0,0,0,.1);border-radius:14px;
				width:min(560px,90vw);max-height:80vh;overflow:hidden;
				box-shadow:0 8px 40px rgba(0,0,0,.12),
				           0 0 0 1px rgba(0,0,0,.04);
				animation:lpSlideUp .22s ease-out;
				font-family:'Inter','Segoe UI',system-ui,sans-serif}

			.lp-header{
				display:flex;align-items:center;justify-content:space-between;
				padding:14px 20px;
				border-bottom:1px solid #e5e7eb;
				background:#fafbfc}
			.lp-header h3{
				margin:0;font-size:14px;font-weight:600;color:#1f2937;
				display:flex;align-items:center;gap:8px}
			.lp-header h3::before{
				content:'∑';font-size:18px;
				background:linear-gradient(135deg,#4f46e5,#7c3aed);
				-webkit-background-clip:text;-webkit-text-fill-color:transparent}

			.lp-close{
				background:#f3f4f6;border:1px solid #e5e7eb;
				color:#6b7280;font-size:18px;width:32px;height:32px;
				border-radius:8px;cursor:pointer;
				display:flex;align-items:center;justify-content:center;
				transition:all .15s ease}
			.lp-close:hover{
				background:#fee2e2;border-color:#fca5a5;color:#dc2626}

			.lp-body{padding:20px}

			.lp-preview{
				background:#f8f9fb;
				border:1px solid #e5e7eb;
				border-radius:10px;padding:16px;margin-bottom:16px;
				text-align:center;overflow-x:auto;color:#1f2937;font-size:1.3em;
				pointer-events:none;
				transition:opacity .2s ease}

			.lp-code-wrap{
				position:relative;background:#f9fafb;
				border:1px solid #e5e7eb;border-radius:10px;overflow:hidden}
			.lp-code-bar{
				display:flex;align-items:center;justify-content:space-between;
				padding:8px 14px;
				background:#f3f4f6;
				border-bottom:1px solid #e5e7eb}
			.lp-code-bar span{
				font-size:11px;color:#9ca3af;text-transform:uppercase;
				letter-spacing:.5px;font-weight:600}

			.lp-copy{
				background:linear-gradient(135deg,#4f46e5,#7c3aed);
				color:#fff;border:none;padding:5px 14px;border-radius:6px;
				font-size:12px;font-weight:600;cursor:pointer;transition:all .2s ease}
			.lp-copy:hover{transform:translateY(-1px);
				box-shadow:0 4px 12px rgba(79,70,229,.3)}
			.lp-copy.copied{
				background:linear-gradient(135deg,#059669,#10b981)}

			.lp-code{
				padding:14px 16px;margin:0;
				font-family:'JetBrains Mono','Fira Code','Cascadia Code',monospace;
				font-size:13.5px;line-height:1.6;color:#1e293b;
				white-space:pre-wrap;word-break:break-all;
				overflow-y:auto;max-height:35vh;tab-size:2;
				user-select:all;
				transition:opacity .2s ease}

			.lp-footer{
				padding:12px 20px;
				border-top:1px solid #e5e7eb;text-align:center}
			.lp-footer span{font-size:11px;color:#9ca3af}
			.lp-footer kbd{
				background:#f3f4f6;
				border:1px solid #e5e7eb;
				border-radius:4px;padding:1px 5px;font-size:10px;color:#6b7280}

			.lp-swap .lp-preview,
			.lp-swap .lp-code{opacity:.15}

			@keyframes lpPulse{
				0%{box-shadow:inset 0 0 0 2px rgba(79,70,229,.2)}
				100%{box-shadow:inset 0 0 0 2px transparent}}
			.lp-live-pulse .lp-code-wrap{animation:lpPulse .5s ease-out}
			.lp-live-pulse .lp-preview{animation:lpPulse .5s ease-out}

			.lp-badge{
				display:inline-block;font-size:10px;font-weight:600;
				padding:2px 7px;border-radius:4px;margin-left:8px;
				vertical-align:middle}
			.lp-badge-display{background:#ede9fe;color:#6d28d9}
			.lp-badge-inline{background:#e0f2fe;color:#0369a1}
		`;
		document.head.appendChild(s);

		function _close() {
			if (!render_temml._overlay) return;
			render_temml._overlay.remove();
			render_temml._overlay      = null;
			render_temml._mathEl       = null;
			render_temml._currentLatex = null;
			render_temml._containerEl  = null;
			render_temml._mathIndex    = -1;
		}

		function _extractLatex(mathEl) {
			const ann = mathEl.querySelector('annotation[encoding="application/x-tex"]');
			if (ann) return ann.textContent.trim();
			if (mathEl.dataset && mathEl.dataset.tex) return mathEl.dataset.tex.trim();
			const wrapper = mathEl.closest('.temml');
			if (wrapper && wrapper.dataset.tex) return wrapper.dataset.tex.trim();
			return null;
		}

		function _findContainer(mathEl) {
			let el = mathEl.parentElement;
			while (el && el !== document.body) {
				if (el.hasAttribute('data-math-rendered')) return el;
				el = el.parentElement;
			}
			return null;
		}

		function _getMathIndex(container, mathEl) {
			const all = container.querySelectorAll('math');
			for (let i = 0; i < all.length; i++) {
				if (all[i] === mathEl) return i;
			}
			return -1;
		}

		function _setBadge(overlay, isDisplay) {
			const oldBadge = overlay.querySelector('.lp-badge');
			if (oldBadge) oldBadge.remove();
			const badge = document.createElement('span');
			badge.className = isDisplay
				? 'lp-badge lp-badge-display'
				: 'lp-badge lp-badge-inline';
			badge.textContent = isDisplay ? 'display' : 'inline';
			overlay.querySelector('.lp-header h3').appendChild(badge);
		}

		function _resetCopyBtn(overlay) {
			const btn = overlay.querySelector('.lp-copy');
			btn.textContent = 'Copy';
			btn.classList.remove('copied');
		}

		function _wireClose(overlay) {
			overlay.querySelector('.lp-close').addEventListener('click', _close);
			overlay.addEventListener('click', e => { if (e.target === overlay) _close(); });
		}

		function _wireCopy(overlay) {
			const btn = overlay.querySelector('.lp-copy');
			let timeout;
			btn.addEventListener('click', () => {
				const text = overlay.querySelector('.lp-code').textContent;
				navigator.clipboard.writeText(text).then(() => {
					btn.textContent = '✓ Copied!';
					btn.classList.add('copied');
					clearTimeout(timeout);
					timeout = setTimeout(() => {
						btn.textContent = 'Copy';
						btn.classList.remove('copied');
					}, 2000);
				});
			});
		}

		function _animatedSwap(overlay, latex, isDisplay, mathEl) {
			render_temml._mathEl       = mathEl;
			render_temml._currentLatex = latex;

			const box = overlay.querySelector('.lp-box');
			box.classList.add('lp-swap');

			setTimeout(() => {
				overlay.querySelector('.lp-preview').innerHTML = '';
				overlay.querySelector('.lp-preview').appendChild(mathEl.cloneNode(true));
				overlay.querySelector('.lp-code').textContent = latex;
				_setBadge(overlay, isDisplay);
				_resetCopyBtn(overlay);

				requestAnimationFrame(() => box.classList.remove('lp-swap'));
			}, 180);
		}

		function _liveSwap(overlay, latex, isDisplay, mathEl) {
			render_temml._mathEl       = mathEl;
			render_temml._currentLatex = latex;

			overlay.querySelector('.lp-preview').innerHTML = '';
			overlay.querySelector('.lp-preview').appendChild(mathEl.cloneNode(true));
			overlay.querySelector('.lp-code').textContent = latex;
			_setBadge(overlay, isDisplay);

			const box = overlay.querySelector('.lp-box');
			box.classList.remove('lp-live-pulse');
			void box.offsetWidth;
			box.classList.add('lp-live-pulse');

			const onEnd = () => { box.classList.remove('lp-live-pulse'); box.removeEventListener('animationend', onEnd); };
			box.addEventListener('animationend', onEnd);
		}

		function _show(latex, isDisplay, mathEl) {
			const container = _findContainer(mathEl);
			const mathIndex = container ? _getMathIndex(container, mathEl) : -1;

			if (render_temml._overlay &&
				render_temml._mathEl === mathEl &&
				render_temml._currentLatex === latex) {
				return;
			}

			if (render_temml._overlay) {
				render_temml._containerEl = container;
				render_temml._mathIndex   = mathIndex;
				_animatedSwap(render_temml._overlay, latex, isDisplay, mathEl);
				return;
			}

			const overlay = document.createElement('div');
			overlay.className = 'lp-overlay';
			overlay.innerHTML = `
				<div class="lp-box" role="dialog" aria-label="LaTeX Source">
					<div class="lp-header">
						<h3>LaTeX Source</h3>
						<button class="lp-close" aria-label="Close" title="Close">&times;</button>
					</div>
					<div class="lp-body">
						<div class="lp-preview"></div>
						<div class="lp-code-wrap">
							<div class="lp-code-bar">
								<span>LaTeX</span>
								<button class="lp-copy">Copy</button>
							</div>
							<pre class="lp-code"></pre>
						</div>
					</div>
					<div class="lp-footer">
						<span><kbd>Esc</kbd> to close</span>
					</div>
				</div>`;

			overlay.querySelector('.lp-code').textContent = latex;
			overlay.querySelector('.lp-preview').appendChild(mathEl.cloneNode(true));
			_setBadge(overlay, isDisplay);

			_wireClose(overlay);
			_wireCopy(overlay);

			document.body.appendChild(overlay);

			render_temml._overlay      = overlay;
			render_temml._mathEl       = mathEl;
			render_temml._currentLatex = latex;
			render_temml._containerEl  = container;
			render_temml._mathIndex    = mathIndex;
		}

		render_temml._liveUpdate = function() {
			if (!render_temml._overlay || !render_temml._containerEl) return;

			const maths = render_temml._containerEl.querySelectorAll('math');
			const idx   = render_temml._mathIndex;
			if (idx < 0 || idx >= maths.length) return;

			const newMath  = maths[idx];
			const newLatex = _extractLatex(newMath);
			if (!newLatex) return;

			render_temml._mathEl = newMath;

			if (newLatex !== render_temml._currentLatex) {
				const isDisplay = newMath.getAttribute('display') === 'block';
				_liveSwap(render_temml._overlay, newLatex, isDisplay, newMath);
			}
		};

		document.addEventListener('contextmenu', function(e) {
			const mathEl = e.target.closest('math');
			if (!mathEl) return;
			if (mathEl.closest('.lp-overlay')) return;

			const latex = _extractLatex(mathEl);
			if (!latex) return;

			e.preventDefault();

			const isDisplay = mathEl.getAttribute('display') === 'block';
			_show(latex, isDisplay, mathEl);
		});

		document.addEventListener('keydown', function(e) {
			if (e.key === 'Escape') _close();
		});

	} /* end one-time bootstrap */


	/* ═══════════════════════════════════════════════════════════════════════════
	   NORMAL RENDERING PASS
	   ═══════════════════════════════════════════════════════════════════════════ */
	const elements = document.querySelectorAll(
		'p:not([data-math-rendered]), span:not([data-math-rendered]), ' +
		'div:not([data-math-rendered]), li:not([data-math-rendered])'
	);

	elements.forEach(el => {
		if (!el.textContent.includes('$')) return;

		// ═══════════════════════════════════════════════════════════
		// CRITICAL: Never process elements that contain input fields
		// or are part of the embedding calculator UI.
		// This prevents render_temml from destroying input state.
		// ═══════════════════════════════════════════════════════════
		if (el.querySelector('input')) return;
		if (el.closest && el.closest('[id^="input-"]')) return;

		// Skip the res-* divs and their wrappers — calcEvo handles these
		const elId = el.id || '';
		if (elId === 'res-1d' || elId === 'res-2d' || elId === 'res-3d') return;
		if (elId === 'res-1d-wrapper' || elId === 'res-2d-wrapper' || elId === 'res-3d-wrapper') return;
		if (el.closest && (
			el.closest('#res-1d') || el.closest('#res-2d') || el.closest('#res-3d') ||
			el.closest('#res-1d-wrapper') || el.closest('#res-2d-wrapper') || el.closest('#res-3d-wrapper')
		)) return;

		// Skip elements that ARE code blocks or are INSIDE code blocks
		if (el.tagName === 'PRE' || el.tagName === 'CODE') return;
		if (el.closest('pre, code')) return;

		// Try our fix first (only intervenes when there's HTML markup inside math)
		const fixed = _fixMathInElement(el);

		// If our fix didn't intervene, let Temml run normally
		if (!fixed) {
			const rect = el.getBoundingClientRect();

			if (rect.width === 0 && rect.height === 0) {
				if (typeof temml !== 'undefined' && typeof temml.renderMathInElement === 'function') {
					temml.renderMathInElement(el, _temmlOpts);
				} else {
					_manualRenderMath(el);
				}
				el.setAttribute('data-math-rendered', 'true');
				return;
			}

			if (rect.bottom > -300 && rect.top < window.innerHeight + 300) {
				if (typeof temml !== 'undefined' && typeof temml.renderMathInElement === 'function') {
					temml.renderMathInElement(el, _temmlOpts);
				} else {
					_manualRenderMath(el);
				}
				el.setAttribute('data-math-rendered', 'true');
			} else {
				_temmlObserver.observe(el);
			}
		}
	});

	/* ═══════════════════════════════════════════════════════════════════════════
	   LIVE UPDATE CHECK  (every render pass)
	   ═══════════════════════════════════════════════════════════════════════════ */
	if (render_temml._liveUpdate) render_temml._liveUpdate();
}


// ══════════════════════════════════════════════════════════════
// NUCLEAR FOCUS PROTECTION
// This uses a focusin/focusout pair + a flag to BLOCK all
// focus-stealing during rendering. No blur can succeed while
// the flag is set.
// ══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// NUCLEAR FOCUS PROTECTION — MULTI-LAYERED
// Prevents ALL focus-stealing during rendering from:
// - Plotly DOM mutations
// - ECharts canvas creation
// - SVG/Canvas element focus grabs
// - MutationObserver-triggered reflows
// - Temml math rendering side effects
// ═══════════════════════════════════════════════════════════════════

['1d', '2d', '3d'].forEach(key => {
    const inputEl = document.getElementById(`input-${key}`);
    if (!inputEl) return;

    // ═══════════════════════════════════════════════════════════
    // GUARDRAIL 13: Continuously track cursor position
    // so we ALWAYS have a fresh value to restore to
    // ═══════════════════════════════════════════════════════════
    const trackCursor = function() {
        _calcEvoFocusState[key] = {
            selStart: this.selectionStart,
            selEnd: this.selectionEnd
        };
    };

    inputEl.addEventListener('keydown', trackCursor);
    inputEl.addEventListener('keyup', trackCursor);
    inputEl.addEventListener('input', trackCursor);
    inputEl.addEventListener('click', trackCursor);
    inputEl.addEventListener('mouseup', trackCursor);
    inputEl.addEventListener('focus', trackCursor);
    inputEl.addEventListener('select', trackCursor);

    // ═══════════════════════════════════════════════════════════
    // GUARDRAIL 14: Prevent the input from EVER losing focus
    // to a Plotly/ECharts/SVG/Canvas element during rendering
    // ═══════════════════════════════════════════════════════════
    inputEl.addEventListener('blur', function(e) {
        const self = this;
        const state = _calcEvoFocusState[key] || {
            selStart: self.value.length,
            selEnd: self.value.length
        };

        // ═══════════════════════════════════════════════════════
        // GUARDRAIL 15: If rendering is in progress, ALWAYS refocus
        // No exceptions — rendering caused this blur
        // ═══════════════════════════════════════════════════════
        if (_renderingInProgress[key]) {
            e.preventDefault();
            setTimeout(() => {
                self.focus();
                self.setSelectionRange(state.selStart, state.selEnd);
            }, 0);
            return;
        }

        // ═══════════════════════════════════════════════════════
        // GUARDRAIL 16: If focus went to null/body (DOM mutation steal)
        // ═══════════════════════════════════════════════════════
        if (!e.relatedTarget || e.relatedTarget === document.body) {
            setTimeout(() => {
                if (document.activeElement === document.body || !document.activeElement) {
                    self.focus();
                    self.setSelectionRange(state.selStart, state.selEnd);
                }
            }, 0);
            return;
        }

        // ═══════════════════════════════════════════════════════
        // GUARDRAIL 17: If focus went to SVG/Canvas/Plotly elements
        // (these are never intentional user interactions with the plot
        //  while typing in the input)
        // ═══════════════════════════════════════════════════════
        const target = e.relatedTarget;
        const tagName = target ? target.tagName : '';
        const isPlotElement = (
            tagName === 'svg' ||
            tagName === 'SVG' ||
            tagName === 'rect' ||
            tagName === 'RECT' ||
            tagName === 'path' ||
            tagName === 'PATH' ||
            tagName === 'CANVAS' ||
            tagName === 'canvas' ||
            tagName === 'g' ||
            tagName === 'G' ||
            (target && target.closest && (
                target.closest('.js-plotly-plot') ||
                target.closest('.plotly') ||
                target.closest('[data-echarts-bindbindbindto]') ||
                target.closest('canvas') ||
                target.closest('svg')
            ))
        );

        if (isPlotElement) {
            setTimeout(() => {
                self.focus();
                self.setSelectionRange(state.selStart, state.selEnd);
            }, 0);
            return;
        }

        // ═══════════════════════════════════════════════════════
        // GUARDRAIL 18: If focus went to the result div or its children
        // (math rendering can make elements focusable)
        // ═══════════════════════════════════════════════════════
        const resDiv = document.getElementById(`res-${key}`);
        const resWrapper = document.getElementById(`res-${key}-wrapper`);
        if (target && (
            target === resDiv ||
            target === resWrapper ||
            (resDiv && resDiv.contains(target)) ||
            (resWrapper && resWrapper.contains(target))
        )) {
            setTimeout(() => {
                self.focus();
                self.setSelectionRange(state.selStart, state.selEnd);
            }, 0);
            return;
        }

        // ═══════════════════════════════════════════════════════
        // GUARDRAIL 19: If focus went to the plot container itself
        // ═══════════════════════════════════════════════════════
        const plotDiv = document.getElementById(`plot-${key}`);
        if (target && plotDiv && (target === plotDiv || plotDiv.contains(target))) {
            setTimeout(() => {
                self.focus();
                self.setSelectionRange(state.selStart, state.selEnd);
            }, 0);
            return;
        }

        // ═══════════════════════════════════════════════════════
        // GUARDRAIL 20: Safety net — if ANY rendering timer is pending
        // for this key, assume the blur was caused by rendering
        // ═══════════════════════════════════════════════════════
        if (_calcEvoTimers[key]) {
            setTimeout(() => {
                // Only refocus if nothing else meaningful got focus
                if (document.activeElement === document.body ||
                    !document.activeElement ||
                    document.activeElement.tagName === 'DIV') {
                    self.focus();
                    self.setSelectionRange(state.selStart, state.selEnd);
                }
            }, 10);
            return;
        }
    });

    // ═══════════════════════════════════════════════════════════
    // GUARDRAIL BONUS: Make the input "sticky" — if it had focus
    // and a focusin event fires on a plot element, steal it back
    // ═══════════════════════════════════════════════════════════
    const plotDiv = document.getElementById(`plot-${key}`);
    if (plotDiv) {
        plotDiv.addEventListener('focusin', function(e) {
            if (_renderingInProgress[key] || _calcEvoTimers[key]) {
                const state = _calcEvoFocusState[key] || {
                    selStart: inputEl.value.length,
                    selEnd: inputEl.value.length
                };
                setTimeout(() => {
                    inputEl.focus();
                    inputEl.setSelectionRange(state.selStart, state.selEnd);
                }, 0);
            }
        });
    }
});


function renderComparison3D(config) {
    const divId = 'plot-comparison-3d';
    const statsId = 'comparison-stats-3d';

    const chart = _getEC3D(divId);
    if (!chart) return;

    const Man  = [0, -10, 0];
    const King = [20, -10, 0];
    const Lion = [18, -10, -20];

    const getMetrics3D = (v1, v2) => {
        const dot  = v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
        const mag1 = Math.sqrt(v1[0]**2 + v1[1]**2 + v1[2]**2);
        const mag2 = Math.sqrt(v2[0]**2 + v2[1]**2 + v2[2]**2);
        const cos  = dot / (mag1 * mag2);
        const angle = Math.acos(Math.min(1, Math.max(-1, cos)));
        return {
            dist: Math.sqrt(v1.reduce((s, x, i) => s + (x - v2[i])**2, 0)).toFixed(1),
            cos: cos.toFixed(3), angle,
            deg: (angle * 180 / Math.PI).toFixed(1)
        };
    };

    const mk = getMetrics3D(Man, King);
    const ml = getMetrics3D(Man, Lion);

    function arcPoints(v1, v2, angle, radius) {
        const pts = [];
        const steps = 40;
        const mag1 = Math.sqrt(v1.reduce((s, a) => s + a**2, 0)) || 1;
        const norm1 = v1.map(x => x / mag1);
        const dot = v2[0]*norm1[0] + v2[1]*norm1[1] + v2[2]*norm1[2];
        let w = v2.map((x, i) => x - dot * norm1[i]);
        const magW = Math.sqrt(w.reduce((s, a) => s + a**2, 0)) || 1;
        w = w.map(x => x / magW);
        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * angle;
            pts.push([
                radius * (Math.cos(t) * norm1[0] + Math.sin(t) * w[0]),
                radius * (Math.cos(t) * norm1[1] + Math.sin(t) * w[1]),
                radius * (Math.cos(t) * norm1[2] + Math.sin(t) * w[2])
            ]);
        }
        return pts;
    }

    const series = [
        // Vector lines from origin
        { type: 'line3D', data: [[0,0,0], Man],  lineStyle: { color: '#64748b', width: 6 } },
        { type: 'line3D', data: [[0,0,0], King], lineStyle: { color: '#10b981', width: 6 } },
        { type: 'line3D', data: [[0,0,0], Lion], lineStyle: { color: '#ef4444', width: 6 } },

        // Endpoint labels
        { type: 'scatter3D',
          data: [{ value: Man, name: 'Man' }],
          symbolSize: 14, itemStyle: { color: '#64748b' },
          label: { show: true, formatter: '{b}', distance: 6,
                   textStyle: { fontSize: 12, color: '#64748b', fontWeight: 'bold' } }
        },
        { type: 'scatter3D',
          data: [{ value: King, name: 'King' }],
          symbolSize: 14, itemStyle: { color: '#10b981' },
          label: { show: true, formatter: '{b}', distance: 6,
                   textStyle: { fontSize: 12, color: '#10b981', fontWeight: 'bold' } }
        },
        { type: 'scatter3D',
          data: [{ value: Lion, name: 'Lion' }],
          symbolSize: 14, itemStyle: { color: '#ef4444' },
          label: { show: true, formatter: '{b}', distance: 6,
                   textStyle: { fontSize: 12, color: '#ef4444', fontWeight: 'bold' } }
        },

        // Angle arcs
        { type: 'line3D', data: arcPoints(Man, King, mk.angle, 6),
          lineStyle: { color: '#10b981', width: 3, opacity: 0.55 } },
        { type: 'line3D', data: arcPoints(Man, Lion, ml.angle, 8),
          lineStyle: { color: '#ef4444', width: 3, opacity: 0.55 } },

        // Origin marker
        { type: 'scatter3D',
          data: [{ value: [0,0,0], name: 'Origin' }],
          symbolSize: 5, itemStyle: { color: '#1e293b' },
          label: { show: false } }
    ];

    chart.setOption({
        tooltip: { show: true },
        grid3D: {
            boxWidth: 100, boxHeight: 100, boxDepth: 100,
            viewControl: { autoRotate: false, damping: 0.85 },
            light: {
                main: { intensity: 1.2, shadow: false },
                ambient: { intensity: 0.4 }
            },
            axisLine:  { lineStyle: { color: '#cbd5e1' } },
            axisLabel: { textStyle: { color: '#94a3b8' } },
            splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        xAxis3D: { name: 'Power',   type: 'value', min: -25, max: 25 },
        yAxis3D: { name: 'Gender',  type: 'value', min: -25, max: 25 },
        zAxis3D: { name: 'Species', type: 'value', min: -25, max: 25 },
        series
    }, true);

    // Stats panel (unchanged)
    document.getElementById(statsId).innerHTML = `
    <div style="font-family: sans-serif; font-size: 0.85em; padding:15px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
        <p style="margin: 0 0 8px 0;"><b style="color:#10b981">Man → King:</b><br>
           <span style="font-size: 1.2em;">θ = ${mk.deg}°</span> | Dist: ${mk.dist}</p>
        <p style="margin: 0;"><b style="color:#ef4444">Man → Lion:</b><br>
           <span style="font-size: 1.2em;">θ = ${ml.deg}°</span> | Dist: ${ml.dist}</p>
    </div>`;
}

/**
 * Initialisiert die Tabellen.
 * Includes a footer with an "Add Token" button.
 */
function initEmbeddingEditor() {
	const containers = document.querySelectorAll('.embedding-table-container');

	containers.forEach(container => {
		const spaceKey = container.getAttribute('data-space');
		if (!spaceKey || !evoSpaces[spaceKey]) return;

		const space = evoSpaces[spaceKey];
		const words = Object.keys(space.vocab);

		let html = `
    <div style="overflow-x: auto; margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: white;">
	<table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 13px;" id="table-${spaceKey}">
	    <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
		<tr>
		    <th style="padding: 10px; text-align: left;">Token</th>
		    <th style="padding: 10px; text-align: center;">X</th>
		    ${space.dims >= 2 ? '<th style="padding: 10px; text-align: center;">Y</th>' : ''}
		    ${space.dims >= 3 ? '<th style="padding: 10px; text-align: center;">Z</th>' : ''}
		</tr>
	    </thead>
	    <tbody>`;

		words.forEach(word => {
			html += generateRowHtml(spaceKey, word, space.vocab[word], space.dims);
		});

		html += `
	    </tbody>
	</table>
    </div>`;
		container.innerHTML = html;
	});
}

/**
 * Helper to generate a single table row
 */
function generateRowHtml(spaceKey, word, vec, dims) {
	return `
    <tr style="border-bottom: 1px solid #f1f5f9;" id="row-${spaceKey}-${word}">
	<td style="padding: 8px 10px; font-weight: 500;">${word}</td>
	${[0, 1, 2].slice(0, dims).map(dim => `
	    <td style="padding: 5px; text-align: center;">
		<input
		    type="number"
		    value="${vec[dim]}"
		    step="0.5"
		    data-space="${spaceKey}"
		    data-word="${word}"
		    data-dim="${dim}"
		    style="width: 60px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;"
		    oninput="updateEmbeddingFromTable(this)"
		>
	    </td>
	`).join('')}
    </tr>`;
}

/**
 * Verarbeitet die Eingabe in der Tabelle und aktualisiert die Grafik.
 */
window.updateEmbeddingFromTable = function(input) {
	const spaceKey = input.getAttribute('data-space');
	const word = input.getAttribute('data-word');
	const dim = parseInt(input.getAttribute('data-dim'));
	const val = parseFloat(input.value) || 0;

	// 1. Wert im zentralen Datenobjekt speichern
	if (evoSpaces[spaceKey] && evoSpaces[spaceKey].vocab[word]) {
		evoSpaces[spaceKey].vocab[word][dim] = val;
	}

	// 2. Den Hauptplot aktualisieren
	renderSpace(spaceKey);

	// 3. Wenn es der 3D Raum ist, auch den Vergleichsplot (Man/King/Lion) updaten
	if (spaceKey === '3d') {
		renderComparison3D();
	}
};

/**
 * Removes a token from the space and updates the UI/Plot
 */
window.removeTokenFromSpace = function(spaceKey, word) {
	const space = evoSpaces[spaceKey];

	// 1. Delete from the data object
	if (space.vocab[word]) {
		delete space.vocab[word];
	}

	// 2. Remove the row from the table DOM
	const row = document.getElementById(`row-${spaceKey}-${word}`);
	if (row) {
		row.remove();
	}

	// 3. Update the main plot
	renderSpace(spaceKey);

	// 4. Update the comparison plot if we're in the 3D space
	if (spaceKey === '3d') {
		renderComparison3D();
	}
};

function renderManifoldVisualization() {
	const plotDiv = document.getElementById('plot-manifold');
	if (!plotDiv) return;

	// --- 1. Generate the 2D manifold surface (a curved sheet in 3D) ---
	const resolution = 40;
	const uRange = Array.from({length: resolution}, (_, i) => -2 + (4 * i / (resolution - 1)));
	const vRange = Array.from({length: resolution}, (_, i) => -2 + (4 * i / (resolution - 1)));

	const surfX = [], surfY = [], surfZ = [];

	for (let i = 0; i < resolution; i++) {
		const rowX = [], rowY = [], rowZ = [];
		for (let j = 0; j < resolution; j++) {
			const u = uRange[i];
			const v = vRange[j];
			// A curved 2D sheet embedded in 3D — like a saddle / Pringle shape
			rowX.push(u);
			rowY.push(v);
			rowZ.push(0.3 * (u * u - v * v) + 0.15 * Math.sin(u * 2) * Math.cos(v * 2));
		}
		surfX.push(rowX);
		surfY.push(rowY);
		surfZ.push(rowZ);
	}

	// --- 2. Place "word" points ON the manifold surface ---
	const manifoldWords = {
		'King':     { u:  1.2, v: -0.8 },
		'Queen':    { u:  1.2, v:  0.8 },
		'Man':      { u: -0.3, v: -0.8 },
		'Woman':    { u: -0.3, v:  0.8 },
		'Prince':   { u:  0.5, v: -0.8 },
		'Princess': { u:  0.5, v:  0.8 },
		'Boy':      { u: -1.2, v: -0.8 },
		'Girl':     { u: -1.2, v:  0.8 },
		'Power':    { u:  1.8, v:  0.0 },
		'Child':    { u: -1.6, v:  0.0 },
	};

	function manifoldZ(u, v) {
		return 0.3 * (u * u - v * v) + 0.15 * Math.sin(u * 2) * Math.cos(v * 2);
	}

	const wordX = [], wordY = [], wordZ = [], wordLabels = [], wordColors = [];
	const colorMap = {
		'King': '#f59e0b', 'Queen': '#f59e0b',
		'Man': '#3b82f6', 'Woman': '#3b82f6',
		'Prince': '#10b981', 'Princess': '#10b981',
		'Boy': '#8b5cf6', 'Girl': '#8b5cf6',
		'Power': '#ef4444', 'Child': '#ec4899'
	};

	for (const [word, {u, v}] of Object.entries(manifoldWords)) {
		wordX.push(u);
		wordY.push(v);
		wordZ.push(manifoldZ(u, v));
		wordLabels.push(word);
		wordColors.push(colorMap[word] || '#64748b');
	}

	// --- 3. Place "noise" points OFF the manifold (in the ambient 3D space) ---
	const noiseX = [], noiseY = [], noiseZ = [];
	for (let i = 0; i < 60; i++) {
		const nx = (Math.random() - 0.5) * 5;
		const ny = (Math.random() - 0.5) * 5;
		const onManifold = manifoldZ(nx, ny);
		// Offset significantly away from the surface
		const nz = onManifold + (Math.random() - 0.5) * 4 + (Math.random() > 0.5 ? 1.5 : -1.5);
		noiseX.push(nx);
		noiseY.push(ny);
		noiseZ.push(nz);
	}

	// --- 4. Draw a geodesic path on the manifold: Man → Prince → King → Queen ---
	const pathWords = ['Man', 'Prince', 'King', 'Queen'];
	const pathSteps = 20;
	const geoX = [], geoY = [], geoZ = [];

	for (let seg = 0; seg < pathWords.length - 1; seg++) {
		const from = manifoldWords[pathWords[seg]];
		const to = manifoldWords[pathWords[seg + 1]];
		for (let s = 0; s <= pathSteps; s++) {
			const t = s / pathSteps;
			const iu = from.u + t * (to.u - from.u);
			const iv = from.v + t * (to.v - from.v);
			geoX.push(iu);
			geoY.push(iv);
			geoZ.push(manifoldZ(iu, iv));
		}
	}

	// --- 5. Draw a STRAIGHT LINE (Euclidean) from Man to Queen for contrast ---
	const manPos = [manifoldWords['Man'].u, manifoldWords['Man'].v, manifoldZ(manifoldWords['Man'].u, manifoldWords['Man'].v)];
	const queenPos = [manifoldWords['Queen'].u, manifoldWords['Queen'].v, manifoldZ(manifoldWords['Queen'].u, manifoldWords['Queen'].v)];
	const straightX = [], straightY = [], straightZ = [];
	for (let s = 0; s <= pathSteps; s++) {
		const t = s / pathSteps;
		straightX.push(manPos[0] + t * (queenPos[0] - manPos[0]));
		straightY.push(manPos[1] + t * (queenPos[1] - manPos[1]));
		straightZ.push(manPos[2] + t * (queenPos[2] - manPos[2]));
	}

	const traces = [
		// The manifold surface
		{
			type: 'surface',
			x: surfX, y: surfY, z: surfZ,
			colorscale: [[0, 'rgba(219, 234, 254, 0.6)'], [0.5, 'rgba(191, 219, 254, 0.6)'], [1, 'rgba(147, 197, 253, 0.6)']],
			showscale: false,
			opacity: 0.45,
			hoverinfo: 'skip',
			contours: {
				x: { show: true, color: 'rgba(148, 163, 184, 0.2)', width: 1 },
				y: { show: true, color: 'rgba(148, 163, 184, 0.2)', width: 1 },
				z: { show: false }
			},
			name: 'Semantic Manifold'
		},
		// Noise points (off-manifold)
		{
			type: 'scatter3d',
			x: noiseX, y: noiseY, z: noiseZ,
			mode: 'markers',
			marker: { size: 2.5, color: '#cbd5e1', opacity: 0.3 },
			name: 'Unused dimensions (noise)',
			hovertemplate: '<b>Off-manifold noise</b><br>This region of the ambient space<br>contains no meaningful data.<extra></extra>'
		},
		// Word points ON the manifold
		{
			type: 'scatter3d',
			x: wordX, y: wordY, z: wordZ,
			mode: 'markers+text',
			text: wordLabels,
			textposition: 'top center',
			textfont: { size: 11, color: '#1e293b' },
			marker: { size: 7, color: wordColors, opacity: 0.95, line: { width: 1, color: '#fff' } },
			name: 'Words (on manifold)',
			hovertemplate: '<b>%{text}</b><br>Lives on the manifold surface<br>x: %{x:.2f}, y: %{y:.2f}, z: %{z:.2f}<extra></extra>'
		},
		// Geodesic path (on the manifold surface)
		{
			type: 'scatter3d',
			x: geoX, y: geoY, z: geoZ,
			mode: 'lines',
			line: { width: 6, color: '#3b82f6' },
			name: 'Geodesic (on manifold)',
			hovertemplate: '<b>Geodesic path</b><br>Man → Prince → King → Queen<br>Follows the curved surface<extra></extra>'
		},
		// Straight Euclidean line (through ambient space)
		{
			type: 'scatter3d',
			x: straightX, y: straightY, z: straightZ,
			mode: 'lines',
			line: { width: 4, color: '#ef4444', dash: 'dash' },
			name: 'Euclidean (through space)',
			hovertemplate: '<b>Euclidean shortcut</b><br>Man → Queen (straight line)<br>Cuts through empty space — not meaningful<extra></extra>'
		}
	];

	const layout = {
		margin: { l: 0, r: 0, b: 0, t: 0 },
		showlegend: true,
		legend: {
			x: 0.01, y: 0.99,
			bgcolor: 'rgba(255,255,255,0.85)',
			bordercolor: '#e2e8f0',
			borderwidth: 1,
			font: { size: 11 }
		},
		scene: {
			xaxis: { title: '', showgrid: true, gridcolor: '#f1f5f9', zeroline: false, showticklabels: false },
			yaxis: { title: '', showgrid: true, gridcolor: '#f1f5f9', zeroline: false, showticklabels: false },
			zaxis: { title: '', showgrid: true, gridcolor: '#f1f5f9', zeroline: false, showticklabels: false },
			camera: { eye: { x: 1.8, y: 1.2, z: 1.0 } },
			bgcolor: '#fff'
		}
	};

	Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });
}

// Prevent temml/math renderers from stealing focus by blocking
// attribute mutations on containers that hold input elements
document.querySelectorAll('input[id^="input-"]').forEach(input => {
    const parent = input.parentElement;
    // Remove the attribute immediately if it gets set
    new MutationObserver((mutations) => {
        mutations.forEach(m => {
            if (m.type === 'attributes' && m.attributeName === 'data-math-rendered') {
                if (document.activeElement === input) {
                    // The attribute change stole focus — restore it
                    const s = input.selectionStart;
                    const e = input.selectionEnd;
                    requestAnimationFrame(() => {
                        input.focus();
                        input.setSelectionRange(s, e);
                    });
                }
            }
        });
    }).observe(parent, { attributes: true, attributeFilter: ['data-math-rendered'] });
});

function loadEmbeddingModule() {
	const fastConfig = {
		displayModeBar: false,
		responsive: true,
		staticPlot: false,
		glProto: 'webgl'
	};

	// 1. Embedding space plots (1d, 2d, 3d) — keep existing internal observer logic
	const spaceTasks = [
		...Object.keys(evoSpaces).map(key => ({ type: 'space', id: `plot-${key}`, key: key })),
		{ type: 'comparison3d', id: 'plot-comparison-3d' }
	];

	const _embSpaceObserver = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const task = spaceTasks.find(t => t.id === entry.target.id);
				if (task) {
					const delay = entry.boundingClientRect.top < 500 ? 50 : 200;
					setTimeout(() => {
						requestAnimationFrame(() => {
							if (task.type === 'space') {
								renderSpace(task.key, null, [], fastConfig);
							} else if (task.type === 'comparison3d') {
								renderComparison3D(fastConfig);
							}
						});
					}, delay);
				}
				_embSpaceObserver.unobserve(entry.target);
			}
		});
	}, { rootMargin: rootMargin });

	spaceTasks.forEach(task => {
		const el = document.getElementById(task.id);
		if (el) {
			if (!el.hasChildNodes()) {
				el.innerHTML = `
		<div class="plot-loading">
		    <div class="spinner"></div>
		    <span>Loading 3D plot…</span>
		</div>`;
			}
			_embSpaceObserver.observe(el);
		}
	});

	// 2. Embedding editor tables (lightweight, keep eager)
	initEmbeddingEditor();

	renderManifoldVisualization();

	// 9. Dual Manifolds (3D translation surfaces)
	const dualPlotDiv = document.getElementById('plot-dual-manifolds');
	if (dualPlotDiv && (!dualPlotDiv.hasChildNodes() || !dualManifoldState.rendered)) {
		dualPlotDiv.innerHTML = `
	    <div class="plot-loading" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; min-height:350px; gap:14px;">
		<div class="spinner"></div>
		<span style="color:#64748b; font-size:0.95em;">Please wait while it's rendering…</span>
	    </div>`;
	}
	setTimeout(() => {
		requestAnimationFrame(() => {
			renderDualManifolds();
		});
	}, 100);

}
