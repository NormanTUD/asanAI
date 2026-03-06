const evoSpaces = {
	'1d': {
		vocab: { 
			'Freezing': [-30, 0, 0], 
			'Icy': [-10, 0, 0], 
			'Cold': [5, 0, 0], 
			'Mild': [20, 0, 0], 
			'Warm': [35, 0, 0],
			'Hot': [60, 0, 0], 
			'Boiling': [100, 0, 0] 
		},
		axes: { x: 'Temperature (°C)' }, 
		dims: 1,
		rangeX: [-50, 120]
	},
	'2d': {
		vocab: { 
			'Man': [5, -10, 0], 'Woman': [5, 10, 0], 
			'Boy': [-10, -10, 0], 'Girl': [-10, 10, 0],
			'Prince': [15, -10, 0], 'Princess': [15, 10, 0], // Knight durch Prince ersetzt, Princess ergänzt
			'King': [25, -10, 0], 'Queen': [25, 10, 0],
			'Power': [15, 0, 0], 'Childhood': [-20, 0, 0]
		},
		axes: { x: 'Power / Age', y: 'Gender' }, 
		dims: 2,
		rangeX: [-30, 50]
	},
	'3d': {
		vocab: {
			'Human': [0, 0, 0], 'Man': [0, -10, 0], 'Woman': [0, 10, 0], 
			'Prince': [8, -10, 0], 'Princess': [8, 10, 0],
			'King': [15, -10, 0], 'Queen': [15, 10, 0],
			'Divine': [0, 0, 25], 
			'Demigod': [12, -10, 12], 'Demigoddess': [12, 10, 12],
			'God': [25, -10, 25], 'Goddess': [25, 10, 25], 
			'Animal': [0, 0, -20], 
			'Lion': [18, -10, -20], 'Lioness': [18, 10, -20], // Klare Gender-Trennung (-10, 10)
			'Tomcat': [0, -10, -20], 'Cat': [0, 10, -20],     // "Kater" vs "Katze"
			'Power': [7.5, 0, 0], 'Weak': [-15, 0, 0]
		},
		axes: { x: 'Power', y: 'Gender', z: 'Species' }, 
		dims: 3,
		rangeX: [-30, 30]
	}
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
	let traces = [];
	let annotations = [];

	// Render Vocabulary Points
	Object.keys(space.vocab).forEach(word => {
		const v = space.vocab[word];
		let trace = {
			x: [v[0]], y: [v[1]],
			mode: 'markers+text',
			name: word, text: [word], textposition: 'top center',
			marker: { size: 6, opacity: 0.5, color: '#94a3b8' },
			cliponaxis: false
		};
		if (is3D) { trace.type = 'scatter3d'; trace.z = [v[2]]; }
		else { trace.type = 'scatter'; }
		traces.push(trace);
	});

	// Render Calculation Steps (Paths)
	steps.forEach(step => {
		if (is3D) {
			// 3D Path: Line trace WITH hover on every point of the line
			const midX = (step.from[0] + step.to[0]) / 2;
			const midY = (step.from[1] + step.to[1]) / 2;
			const midZ = (step.from[2] + step.to[2]) / 2;

			traces.push({
				type: 'scatter3d',
				x: [step.from[0], midX, step.to[0]],
				y: [step.from[1], midY, step.to[1]],
				z: [step.from[2], midZ, step.to[2]],
				mode: 'lines',
				line: { color: '#3b82f6', width: 4 },
				text: [step.label, step.label, step.label],
				hoverinfo: 'text',
				showlegend: false
			});
			traces.push({
				type: 'cone',
				x: [step.to[0]], y: [step.to[1]], z: [step.to[2]],
				u: [step.to[0] - step.from[0]],
				v: [step.to[1] - step.from[1]],
				w: [step.to[2] - step.from[2]],
				sizemode: 'absolute', sizeref: 2, showscale: false,
				colorscale: [[0, '#3b82f6'], [1, '#3b82f6']],
				hoverinfo: 'skip'
			});
		} else {
			// 1D/2D Path logic using Annotations (Arrows)
			annotations.push({
				ax: step.from[0],
				ay: step.from[1],
				axref: 'x',
				ayref: 'y',
				x: step.to[0],
				y: step.to[1],
				xref: 'x',
				yref: 'y',
				showarrow: true,
				arrowhead: 2,
				arrowsize: 1.5,
				arrowwidth: 3,
				arrowcolor: '#3b82f6'
			});

			// 2D Arrow Hover Label: invisible marker at midpoint
			traces.push({
				type: 'scatter',
				x: [(step.from[0] + step.to[0]) / 2],
				y: [(step.from[1] + step.to[1]) / 2],
				mode: 'markers',
				marker: { size: 12, color: 'rgba(59,130,246,0.01)' },
				text: [step.label],
				hovertemplate: '<b>%{text}</b><extra></extra>',
				showlegend: false,
				cliponaxis: false
			});
		}
	});

	// Render Result Highlight
	if (highlightPos) {
		let res = {
			x: [highlightPos[0]], y: [highlightPos[1]],
			mode: 'markers', marker: { size: 12, color: '#ef4444', symbol: 'diamond' }
		};
		if (is3D) { res.type = 'scatter3d'; res.z = [highlightPos[2]]; }
		else { res.type = 'scatter'; }
		traces.push(res);
	}

	const layout = {
		margin: { l: 40, r: 40, b: 40, t: 20 },
		showlegend: false,
		xaxis: { range: rangeX, title: space.axes.x },
		yaxis: { range: [-30, 30], title: space.axes.y || '', visible: space.dims > 1 },
		annotations: annotations
	};

	if (is3D) {
		layout.scene = {
			xaxis: { title: space.axes.x, range: rangeX },
			yaxis: { title: space.axes.y, range: [-30, 30] },
			zaxis: { title: space.axes.z, range: [-30, 30] }
		};
	}

	Plotly.react(divId, traces, layout).then(() => {
		const loader = plotDiv.querySelector('.plot-loading');
		if (loader) loader.remove();
	});
}

function calcEvo(key) {
	const inputVal = document.getElementById(`input-${key}`).value;
	const space = evoSpaces[key];
	const resDiv = document.getElementById(`res-${key}`);

	// Create a lowercase map for lookups
	const lowerVocab = Object.keys(space.vocab).reduce((acc, word) => {
		acc[word.toLowerCase()] = { vec: space.vocab[word], original: word };
		return acc;
	}, {});

	const tokens = inputVal.match(/[a-zA-Z\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc]+|\d*\.\d+|\d+|[\+\-\*\/\(\)]/g);
	if (!tokens) return;

	let pos = 0;
	let steps = [];

	const toVecTex = (arr) => `\\begin{pmatrix} ${arr.slice(0, space.dims).map(v => v.toFixed(1)).join(' \\\\ ')} \\end{pmatrix}`;

	function peek() { return tokens[pos]; }
	function consume() { return tokens[pos++]; }

	function parseFactor() {
		let token = consume();
		if (token === '(') {
			let res = parseExpression();
			consume(); 
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

		// Perform case-insensitive lookup
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

			// Do NOT push a step here — multiplication/division computes
			// an intermediate vector value, not a spatial movement on the plot.
			// Only +/- in parseExpression should generate arrows.

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

		// Logic to determine if it is an exact match or an approximation
		const isExact = minDist < 0.01;
		const symbol = isExact ? "=" : "\\approx";

		// The resultTex now includes the symbol inside the substack next to the name
		const resultTex = `\\underbrace{${toVecTex(result.val)}}_{\\substack{ ${symbol} \\text{ ${nearest}} \\\\ ${toVecTex(nearestVec)} }}`;

		resDiv.innerHTML = `
		    <div style="overflow-x: auto; padding: 15px 0; font-size: 1.1em;">
			$$ ${result.tex} = ${resultTex} $$
		    </div>
		`;

		render_temml();
		renderSpace(key, result.val, steps);
	} catch(e) { 
		console.error(e);
		resDiv.innerText = "Syntax Error"; 
	}
}

function renderComparison3D(config) {
	const divId = 'plot-comparison-3d';
	const statsId = 'comparison-stats-3d';

	const Man = [0, -10, 0];
	const King = [20, -10, 0];
	const Lion = [18, -10, -20];

	const getMetrics3D = (v1, v2) => {
		const dot = v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
		const mag1 = Math.sqrt(v1[0]**2 + v1[1]**2 + v1[2]**2);
		const mag2 = Math.sqrt(v2[0]**2 + v2[1]**2 + v2[2]**2);
		const cos = dot / (mag1 * mag2);
		const angle = Math.acos(Math.min(1, Math.max(-1, cos)));
		return { 
			dist: Math.sqrt(v1.reduce((s,x,i)=>s+(x-v2[i])**2,0)).toFixed(1), 
			cos: cos.toFixed(3), 
			angle, 
			deg: (angle*180/Math.PI).toFixed(1) 
		};
	};

	const mk = getMetrics3D(Man, King);
	const ml = getMetrics3D(Man, Lion);

	function getArcPoints(v1, v2, angle, radius) {
		const pts = {x:[], y:[], z:[]};
		const steps = 30; // Increased steps for a smoother arc
		const norm1 = v1.map(x => x / (Math.sqrt(v1.reduce((s,a)=>s+a**2,0)) || 1));

		// Find the component of v2 perpendicular to v1 to create the plane for the arc
		const dot = v2[0]*norm1[0] + v2[1]*norm1[1] + v2[2]*norm1[2];
		let w = v2.map((x,i) => x - dot*norm1[i]);
		const magW = Math.sqrt(w.reduce((s,a)=>s+a**2,0)) || 1;
		w = w.map(x => x/magW);

		for(let i=0; i<=steps; i++) {
			const t = (i/steps) * angle;
			pts.x.push(radius * (Math.cos(t)*norm1[0] + Math.sin(t)*w[0]));
			pts.y.push(radius * (Math.cos(t)*norm1[1] + Math.sin(t)*w[1]));
			pts.z.push(radius * (Math.cos(t)*norm1[2] + Math.sin(t)*w[2]));
		}
		return pts;
	}

	const arcMK = getArcPoints(Man, King, mk.angle, 6);
	const arcML = getArcPoints(Man, Lion, ml.angle, 8);

	const traces = [
		// Vector: Man
		{ 
			type:'scatter3d', x:[0,Man[0]], y:[0,Man[1]], z:[0,Man[2]], 
			name:'Man', mode:'lines+markers+text', text:['','Man'], 
			marker: { size: [0, 10], color: '#64748b' }, line:{width:6, color:'#64748b'} 
		},
		// Vector: King
		{ 
			type:'scatter3d', x:[0,King[0]], y:[0,King[1]], z:[0,King[2]], 
			name:'King', mode:'lines+markers+text', text:['','King'], 
			marker: { size: [0, 10], color: '#10b981' }, line:{width:6, color:'#10b981'} 
		},
		// Vector: Lion
		{ 
			type:'scatter3d', x:[0,Lion[0]], y:[0,Lion[1]], z:[0,Lion[2]], 
			name:'Lion', mode:'lines+markers+text', text:['','Lion'], 
			marker: { size: [0, 10], color: '#ef4444' }, line:{width:6, color:'#ef4444'} 
		},
		// Arc: Man -> King
		{
			type: 'scatter3d', x: arcMK.x, y: arcMK.y, z: arcMK.z,
			mode: 'lines', line: { width: 5, color: '#10b981', dash: 'dot' },
			name: 'Angle (King)'
		},
		// Arc: Man -> Lion
		{
			type: 'scatter3d', x: arcML.x, y: arcML.y, z: arcML.z,
			mode: 'lines', line: { width: 5, color: '#ef4444', dash: 'dot' },
			name: 'Angle (Lion)'
		}
	];

	const layout = { 
		margin:{l:0,r:0,b:0,t:0}, 
		showlegend:false, 
		scene:{ 
			xaxis:{title:'Power', range: [-25, 25]}, 
			yaxis:{title:'Gender', range: [-25, 25]}, 
			zaxis:{title:'Species', range: [-25, 25]} 
		} 
	};

	Plotly.react(divId, traces, layout, config).then(() => {
		const loader = document.getElementById(divId)?.querySelector('.plot-loading');
		if (loader) loader.remove();
	});


	document.getElementById(statsId).innerHTML = `
	<div style="font-family: sans-serif; font-size: 0.85em; padding:15px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
	    <p style="margin: 0 0 8px 0;"><b style="color:#10b981">Man → King:</b><br>
	       <span style="font-size: 1.2em;">θ = ${mk.deg}°</span> | Dist: ${mk.dist}</p>
	    <p style="margin: 0;"><b style="color:#ef4444">Man → Lion:</b><br>
	       <span style="font-size: 1.2em;">θ = ${ml.deg}°</span> | Dist: ${ml.dist}</p>
	</div>
    `;
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
		    <th style="padding: 10px; text-align: center;">Delete Entry?</th>
		</tr>
	    </thead>
	    <tbody>`;

		words.forEach(word => {
			html += generateRowHtml(spaceKey, word, space.vocab[word], space.dims);
		});

		html += `
	    </tbody>
	</table>
	<div style="padding: 10px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; gap: 10px;">
	    <input type="text" id="new-token-${spaceKey}" placeholder="New token name (will be randomly initialized)..." style="flex-grow: 1; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">
	    <button onclick="addTokenToSpace('${spaceKey}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">+ Add</button>
	</div>
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
	<td style="padding: 5px; text-align: center;">
	    <button 
		onclick="removeTokenFromSpace('${spaceKey}', '${word}')" 
		style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 18px; font-weight: bold; padding: 0 10px;"
		title="Remove ${word}"
	    >
		&times;
	    </button>
	</td>
    </tr>`;
}

/**
 * Adds a new token with random coordinates within current bounds
 */
window.addTokenToSpace = function(spaceKey) {
	const nameInput = document.getElementById(`new-token-${spaceKey}`);
	const tokenName = nameInput.value.trim();
	const space = evoSpaces[spaceKey];

	if (!tokenName || space.vocab[tokenName]) {
		alert("Please enter a unique token name.");
		return;
	}

	// 1. Calculate current bounds to keep the new point "in range"
	const vecs = Object.values(space.vocab);
	const newVec = [0, 0, 0];

	for (let d = 0; d < 3; d++) {
		const coords = vecs.map(v => v[d]);
		const min = Math.min(0, ...coords);
		const max = Math.max(1, ...coords);
		// Random value between current min and max
		newVec[d] = Math.round((min + Math.random() * (max - min)) * 2) / 2;
	}

	// 2. Update Data
	space.vocab[tokenName] = newVec;

	// 3. Update Table UI
	const tbody = document.querySelector(`#table-${spaceKey} tbody`);
	tbody.insertAdjacentHTML('beforeend', generateRowHtml(spaceKey, tokenName, newVec, space.dims));

	// 4. Update Plots and clear input
	nameInput.value = "";
	renderSpace(spaceKey);
	if (spaceKey === '3d') renderComparison3D();
};

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

function renderDotProductLab() {
	const plotDiv = document.getElementById('dot-product-plot');
	const angleSliderA = document.getElementById('angle-a');
	const angleSliderB = document.getElementById('angle-b');
	const valA = document.getElementById('val-a');
	const valB = document.getElementById('val-b');
	const resultDiv = document.getElementById('dot-product-result');

	function update() {
		const degA = parseFloat(angleSliderA.value);
		const degB = parseFloat(angleSliderB.value);
		valA.innerText = degA;
		valB.innerText = degB;

		const radA = degA * (Math.PI / 180);
		const radB = degB * (Math.PI / 180);

		// Vektoren (Länge 1)
		const ax = Math.cos(radA);
		const ay = Math.sin(radA);
		const bx = Math.cos(radB);
		const by = Math.sin(radB);

		const dotProduct = (ax * bx) + (ay * by);

		// --- KÜRZESTER WINKEL & ARC LOGIK ---
		let diff = degB - degA;
		// Normalisieren auf -180 bis 180 Grad (kürzester Weg)
		while (diff > 180) diff -= 360;
		while (diff < -180) diff += 360;

		const arcRadius = 0.3;
		const sX = arcRadius * Math.cos(radA);
		const sY = arcRadius * Math.sin(radA);
		const eX = arcRadius * Math.cos(radB);
		const eY = arcRadius * Math.sin(radB);

		// sweep-flag: 1 wenn diff positiv, 0 wenn negativ
		const sweepFlag = diff > 0 ? 1 : 0;
		// Da wir immer den kürzesten Weg nehmen, ist large-arc immer 0
		const arcPath = `M 0 0 L ${sX} ${sY} A ${arcRadius} ${arcRadius} 0 0 ${sweepFlag} ${eX} ${eY} Z`;

		// Position für die Winkel-Beschriftung (Mitte des Arcs)
		const midRad = radA + (diff / 2) * (Math.PI / 180);
		const labelR = arcRadius + 0.15;
		const lx = labelR * Math.cos(midRad);
		const ly = labelR * Math.sin(midRad);

		const data = [
			{
				x: [0, ax], y: [0, ay],
				type: 'scatter', mode: 'lines+markers',
				name: 'Vector A', line: { color: '#3b82f6', width: 4 },
				marker: { size: 10, symbol: 'arrow', angleref: 'previous' }
			},
			{
				x: [0, bx], y: [0, by],
				type: 'scatter', mode: 'lines+markers',
				name: 'Vector B', line: { color: '#ef4444', width: 4 },
				marker: { size: 10, symbol: 'arrow', angleref: 'previous' }
			}
		];

		const layout = {
			xaxis: { range: [-1.2, 1.2], zeroline: true, fixedrange: true },
			yaxis: { range: [-1.2, 1.2], zeroline: true, fixedrange: true },
			margin: { l: 20, r: 20, b: 20, t: 20 },
			showlegend: false,
			shapes: [
				{
					type: 'path',
					path: arcPath,
					fillcolor: 'rgba(139, 92, 246, 0.3)',
					line: { color: 'rgb(139, 92, 246)', width: 2 },
					xref: 'x', yref: 'y'
				}
			],
			annotations: [
				{
					x: lx, y: ly,
					text: `${Math.abs(Math.round(diff))}°`,
					showarrow: false,
					font: { color: 'rgb(139, 92, 246)', size: 14, weight: 'bold' }
				}
			]
		};

		Plotly.react(plotDiv, data, layout, {displayModeBar: false}).then(() => {
			// Remove any lingering loading indicator
			const loader = plotDiv.querySelector('.plot-loading');
			if (loader) loader.remove();
		});

		// --- VEKTOREN ANZEIGE UNTERHALB ---
		let status = "";
		if (dotProduct > 0.9) status = "🔥 <b>Very similar</b>";
		else if (dotProduct > 0.1) status = "✅ <b>Related</b>";
		else if (dotProduct > -0.1) status = "😐 <b>Neutral</b>";
		else status = "❄️ <b>Opposite</b>";

		resultDiv.innerHTML = `
	    <div style="display: flex; justify-content: space-around; font-size: 0.9rem; margin-bottom: 10px;">
		<span style="color:#3b82f6"><b>Vector A:</b> [${ax.toFixed(2)}, ${ay.toFixed(2)}]</span>
		<span style="color:#ef4444"><b>Vector B:</b> [${bx.toFixed(2)}, ${by.toFixed(2)}]</span>
	    </div>
	    <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 10px;">
		<span style="font-size: 1.2rem;">Dot Product: <b>${dotProduct.toFixed(3)}</b></span><br>
		${status}
	    </div>
	`;
	}

	angleSliderA.addEventListener('input', update);
	angleSliderB.addEventListener('input', update);
	update();
}

function renderRotationalInvariance() {
	const plotDiv = document.getElementById('plot-rotational-invariance');
	if (!plotDiv) return;

	// --- Define a small "language" cluster ---
	const originalPoints = {
		'King':    [20, -8],
		'Queen':   [20,  8],
		'Man':     [5,  -8],
		'Woman':   [5,   8],
		'Prince':  [12, -8],
		'Princess':[12,  8],
	};

	// Japanese labels for Language B
	const japaneseLabels = {
		'King':     '王様',
		'Queen':    '女王',
		'Man':      '男',
		'Woman':    '女',
		'Prince':   '王子',
		'Princess': '王女',
	};

	// --- Rotation function ---
	function rotate2D(points, angleDeg, offsetX, offsetY) {
		const rad = angleDeg * Math.PI / 180;
		const result = {};
		for (const [key, [x, y]] of Object.entries(points)) {
			result[key] = [
				x * Math.cos(rad) - y * Math.sin(rad) + offsetX,
				x * Math.sin(rad) + y * Math.cos(rad) + offsetY
			];
		}
		return result;
	}

	// "English" — original orientation
	const langA = rotate2D(originalPoints, 0, -20, 0);
	// "Japanese" — rotated by 55°, shifted right
	const langB = rotate2D(originalPoints, 55, 25, 0);

	const traces = [];
	const colors = {
		'King': '#f59e0b', 'Queen': '#f59e0b',
		'Man': '#3b82f6', 'Woman': '#3b82f6',
		'Prince': '#10b981', 'Princess': '#10b981'
	};

	// --- Draw English points ---
	for (const [word, [x, y]] of Object.entries(langA)) {
		traces.push({
			x: [x], y: [y],
			mode: 'markers+text',
			text: [word],
			textposition: 'top center',
			marker: { size: 10, color: colors[word], opacity: 0.9 },
			showlegend: false,
			hovertemplate: `<b>${word}</b> (English)<br>x: %{x:.1f}, y: %{y:.1f}<extra></extra>`
		});
	}

	// --- Draw Japanese points (with Japanese labels) ---
	for (const [word, [x, y]] of Object.entries(langB)) {
		traces.push({
			x: [x], y: [y],
			mode: 'markers+text',
			text: [japaneseLabels[word]],
			textposition: 'top center',
			marker: { size: 10, color: colors[word], opacity: 0.9, symbol: 'diamond' },
			showlegend: false,
			hovertemplate: `<b>${japaneseLabels[word]}</b> (Japanese)<br>x: %{x:.1f}, y: %{y:.1f}<extra></extra>`
		});
	}

	// --- Draw internal structure lines for English (Gender pairs) ---
	const pairs = [['King','Queen'], ['Man','Woman'], ['Prince','Princess']];
	for (const [a, b] of pairs) {
		traces.push({
			x: [langA[a][0], langA[b][0]], y: [langA[a][1], langA[b][1]],
			mode: 'lines', line: { color: '#94a3b8', width: 1.5, dash: 'dot' },
			showlegend: false, hoverinfo: 'skip'
		});
		traces.push({
			x: [langB[a][0], langB[b][0]], y: [langB[a][1], langB[b][1]],
			mode: 'lines', line: { color: '#94a3b8', width: 1.5, dash: 'dot' },
			showlegend: false, hoverinfo: 'skip'
		});
	}

	// --- Draw "Power" axis lines (Man→King) for each language ---
	const powerPairs = [['Man','Prince'], ['Prince','King'], ['Woman','Princess'], ['Princess','Queen']];
	for (const [a, b] of powerPairs) {
		traces.push({
			x: [langA[a][0], langA[b][0]], y: [langA[a][1], langA[b][1]],
			mode: 'lines', line: { color: '#cbd5e1', width: 1 },
			showlegend: false, hoverinfo: 'skip'
		});
		traces.push({
			x: [langB[a][0], langB[b][0]], y: [langB[a][1], langB[b][1]],
			mode: 'lines', line: { color: '#cbd5e1', width: 1 },
			showlegend: false, hoverinfo: 'skip'
		});
	}

	// --- Draw a "translation path" arrow from Lang A King to Lang B King ---
	const translationPairs = [['Man', 'King'], ['King', 'Queen']];
	for (const [a, b] of translationPairs) {
		// Path in English (solid blue arrow)
		traces.push({
			x: [langA[a][0], langA[b][0]], y: [langA[a][1], langA[b][1]],
			mode: 'lines', line: { color: '#3b82f6', width: 3 },
			showlegend: false, hoverinfo: 'skip'
		});
		// Corresponding path in Japanese (solid green arrow)
		traces.push({
			x: [langB[a][0], langB[b][0]], y: [langB[a][1], langB[b][1]],
			mode: 'lines', line: { color: '#10b981', width: 3 },
			showlegend: false, hoverinfo: 'skip'
		});
	}

	// --- Labels for the two spaces ---
	const annotations = [
		{
			x: -20, y: 18, text: '<b>English</b>',
			showarrow: false, font: { size: 13, color: '#475569' },
			bgcolor: 'rgba(248,250,252,0.8)', borderpad: 4
		},
		{
			x: 25, y: 28, text: '<b>Japanese</b>',
			showarrow: false, font: { size: 13, color: '#475569' },
			bgcolor: 'rgba(248,250,252,0.8)', borderpad: 4
		},
		// Arrow annotations for the translation paths in A
		{
			ax: langA['Man'][0], ay: langA['Man'][1],
			x: langA['King'][0], y: langA['King'][1],
			axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
			showarrow: true, arrowhead: 2, arrowsize: 1.5, arrowwidth: 3, arrowcolor: '#3b82f6'
		},
		{
			ax: langA['King'][0], ay: langA['King'][1],
			x: langA['Queen'][0], y: langA['Queen'][1],
			axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
			showarrow: true, arrowhead: 2, arrowsize: 1.5, arrowwidth: 3, arrowcolor: '#3b82f6'
		},
		// Arrow annotations for the translation paths in B
		{
			ax: langB['Man'][0], ay: langB['Man'][1],
			x: langB['King'][0], y: langB['King'][1],
			axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
			showarrow: true, arrowhead: 2, arrowsize: 1.5, arrowwidth: 3, arrowcolor: '#10b981'
		},
		{
			ax: langB['King'][0], ay: langB['King'][1],
			x: langB['Queen'][0], y: langB['Queen'][1],
			axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
			showarrow: true, arrowhead: 2, arrowsize: 1.5, arrowwidth: 3, arrowcolor: '#10b981'
		}
	];

	const layout = {
		margin: { l: 40, r: 40, b: 40, t: 20 },
		showlegend: false,
		xaxis: { range: [-45, 50], zeroline: false, showgrid: true, gridcolor: '#f1f5f9' },
		yaxis: { range: [-30, 35], zeroline: false, showgrid: true, gridcolor: '#f1f5f9', scaleanchor: 'x' },
		annotations: annotations,
		plot_bgcolor: '#fff'
	};

	Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });
}

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

// ============================================================
// CROSS-LINGUAL ALIGNMENT ANIMATION
// ============================================================

const crossLingualState = {
	originalPoints: {
		'King':     [20, -8],
		'Queen':    [20,  8],
		'Man':      [5,  -8],
		'Woman':    [5,   8],
		'Prince':   [12, -8],
		'Princess': [12,  8],
	},
	targetAngleDeg: 55,
	offsetX: 25,
	offsetY: 0,
	currentAngleDeg: 55,   // current animated angle of Language B
	currentOffsetX: 25,
	currentOffsetY: 0,
	animating: false,
	aligned: false
};

function clRotate2D(points, angleDeg, offsetX, offsetY) {
	const rad = angleDeg * Math.PI / 180;
	const result = {};
	for (const [key, [x, y]] of Object.entries(points)) {
		result[key] = [
			x * Math.cos(rad) - y * Math.sin(rad) + offsetX,
			x * Math.sin(rad) + y * Math.cos(rad) + offsetY
		];
	}
	return result;
}

function renderCrossLingualFrame() {
	const plotDiv = document.getElementById('plot-crosslingual-align');
	if (!plotDiv) return;

	const st = crossLingualState;
	const langA = clRotate2D(st.originalPoints, 0, -20, 0);
	const langB = clRotate2D(st.originalPoints, st.currentAngleDeg, st.currentOffsetX, st.currentOffsetY);

	// Japanese labels for Language B
	const japaneseLabels = {
		'King':     '王様',
		'Queen':    '女王',
		'Man':      '男',
		'Woman':    '女',
		'Prince':   '王子',
		'Princess': '王女',
	};

	const traces = [];
	const colors = {
		'King': '#f59e0b', 'Queen': '#f59e0b',
		'Man': '#3b82f6', 'Woman': '#3b82f6',
		'Prince': '#10b981', 'Princess': '#10b981'
	};

	// English points (circles)
	for (const [word, [x, y]] of Object.entries(langA)) {
		traces.push({
			x: [x], y: [y],
			mode: 'markers+text', text: [word], textposition: 'top center',
			marker: { size: 11, color: colors[word], opacity: 0.9 },
			showlegend: false,
			hovertemplate: `<b>${word}</b> (English)<br>x: %{x:.1f}, y: %{y:.1f}<extra></extra>`
		});
	}

	// Japanese points (diamonds, with Japanese labels)
	for (const [word, [x, y]] of Object.entries(langB)) {
		traces.push({
			x: [x], y: [y],
			mode: 'markers+text', text: [japaneseLabels[word]], textposition: 'bottom center',
			marker: { size: 11, color: colors[word], opacity: 0.9, symbol: 'diamond' },
			showlegend: false,
			hovertemplate: `<b>${japaneseLabels[word]}</b> (Japanese)<br>x: %{x:.1f}, y: %{y:.1f}<extra></extra>`
		});
	}

	// Internal structure lines (gender pairs)
	const pairs = [['King','Queen'], ['Man','Woman'], ['Prince','Princess']];
	for (const [a, b] of pairs) {
		traces.push({
			x: [langA[a][0], langA[b][0]], y: [langA[a][1], langA[b][1]],
			mode: 'lines', line: { color: '#94a3b8', width: 1.5, dash: 'dot' },
			showlegend: false, hoverinfo: 'skip'
		});
		traces.push({
			x: [langB[a][0], langB[b][0]], y: [langB[a][1], langB[b][1]],
			mode: 'lines', line: { color: '#94a3b8', width: 1.5, dash: 'dot' },
			showlegend: false, hoverinfo: 'skip'
		});
	}

	// Power axis lines
	const powerPairs = [['Man','Prince'], ['Prince','King'], ['Woman','Princess'], ['Princess','Queen']];
	for (const [a, b] of powerPairs) {
		traces.push({
			x: [langA[a][0], langA[b][0]], y: [langA[a][1], langA[b][1]],
			mode: 'lines', line: { color: '#cbd5e1', width: 1 },
			showlegend: false, hoverinfo: 'skip'
		});
		traces.push({
			x: [langB[a][0], langB[b][0]], y: [langB[a][1], langB[b][1]],
			mode: 'lines', line: { color: '#cbd5e1', width: 1 },
			showlegend: false, hoverinfo: 'skip'
		});
	}

	// Translation path arrows (Man → King → Queen)
	const annotations = [];
	const arrowPairs = [['Man', 'King'], ['King', 'Queen']];
	for (const [a, b] of arrowPairs) {
		// English arrows (blue)
		annotations.push({
			ax: langA[a][0], ay: langA[a][1],
			x: langA[b][0], y: langA[b][1],
			axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
			showarrow: true, arrowhead: 2, arrowsize: 1.5, arrowwidth: 3, arrowcolor: '#3b82f6'
		});
		// Japanese arrows (green)
		annotations.push({
			ax: langB[a][0], ay: langB[a][1],
			x: langB[b][0], y: langB[b][1],
			axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
			showarrow: true, arrowhead: 2, arrowsize: 1.5, arrowwidth: 3, arrowcolor: '#10b981'
		});
	}

	// Connecting lines between corresponding words (show alignment)
	if (st.currentAngleDeg < 50) {
		const opacity = Math.max(0, 1 - st.currentAngleDeg / 50);
		for (const word of Object.keys(langA)) {
			traces.push({
				x: [langA[word][0], langB[word][0]],
				y: [langA[word][1], langB[word][1]],
				mode: 'lines',
				line: { color: `rgba(139, 92, 246, ${opacity * 0.5})`, width: 1.5, dash: 'dash' },
				showlegend: false, hoverinfo: 'skip'
			});
		}
	}

	// Labels
	const labelAngle = st.currentAngleDeg;
	annotations.push({
		x: -20, y: 18,
		text: '<b>English</b>',
		showarrow: false, font: { size: 13, color: '#475569' },
		bgcolor: 'rgba(248,250,252,0.8)', borderpad: 4
	});
	annotations.push({
		x: st.currentOffsetX, y: 28,
		text: `<b>Japanese</b><br>(Rotated ${Math.round(labelAngle)}°)`,
		showarrow: false, font: { size: 13, color: '#475569' },
		bgcolor: 'rgba(248,250,252,0.8)', borderpad: 4
	});

	const layout = {
		margin: { l: 40, r: 40, b: 40, t: 20 },
		showlegend: false,
		xaxis: { range: [-45, 50], zeroline: false, showgrid: true, gridcolor: '#f1f5f9' },
		yaxis: { range: [-30, 35], zeroline: false, showgrid: true, gridcolor: '#f1f5f9', scaleanchor: 'x' },
		annotations: annotations,
		plot_bgcolor: '#fff'
	};

	Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });
}

function animateCrossLingualAlignment() {
	const st = crossLingualState;
	if (st.animating) return;

	if (st.aligned) {
		// Already aligned — do nothing, user should reset first
		return;
	}

	st.animating = true;
	const statusEl = document.getElementById('align-status');
	const btnAlign = document.getElementById('btn-align');
	btnAlign.disabled = true;
	btnAlign.style.opacity = '0.5';

	const startAngle = st.currentAngleDeg;
	const startOffsetX = st.currentOffsetX;
	const startOffsetY = st.currentOffsetY;

	// Target: angle 0, offset to -20 (same as Language A)
	const targetAngle = 0;
	const targetOffsetX = -20;
	const targetOffsetY = 0;

	const duration = 2000; // ms
	const startTime = performance.now();

	function easeInOutCubic(t) {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	}

	function step(now) {
		const elapsed = now - startTime;
		const rawT = Math.min(elapsed / duration, 1);
		const t = easeInOutCubic(rawT);

		st.currentAngleDeg = startAngle + (targetAngle - startAngle) * t;
		st.currentOffsetX = startOffsetX + (targetOffsetX - startOffsetX) * t;
		st.currentOffsetY = startOffsetY + (targetOffsetY - startOffsetY) * t;

		if (statusEl) {
			statusEl.textContent = `Aligning... rotation: ${Math.round(st.currentAngleDeg)}° → 0°`;
		}

		renderCrossLingualFrame();

		if (rawT < 1) {
			requestAnimationFrame(step);
		} else {
			st.currentAngleDeg = 0;
			st.currentOffsetX = -20;
			st.currentOffsetY = 0;
			st.animating = false;
			st.aligned = true;
			btnAlign.disabled = true;
			if (statusEl) {
				statusEl.innerHTML = '✓ <b>Aligned!</b> Both languages now share the same coordinate frame. Internal geometry is preserved.';
				statusEl.style.color = '#10b981';
			}
			renderCrossLingualFrame();
		}
	}

	requestAnimationFrame(step);
}

function resetCrossLingualAlignment() {
	const st = crossLingualState;
	if (st.animating) return;

	st.currentAngleDeg = st.targetAngleDeg;
	st.currentOffsetX = st.offsetX;
	st.currentOffsetY = st.offsetY;
	st.aligned = false;

	const btnAlign = document.getElementById('btn-align');
	const statusEl = document.getElementById('align-status');
	btnAlign.disabled = false;
	btnAlign.style.opacity = '1';
	if (statusEl) {
		statusEl.textContent = 'Ready — Language B is rotated 55° from Language A.';
		statusEl.style.color = '#64748b';
	}

	renderCrossLingualFrame();
}

// ============================================================
// ATTENTION AS METRIC TENSOR WARPING
// ============================================================

const metricTensorState = {
    tokens: {
        'King':     { pos: [3.0,  1.5], group: 'royalty' },
        'Queen':    { pos: [3.5,  3.5], group: 'royalty' },
        'Prince':   { pos: [2.0,  2.0], group: 'royalty' },
        'Princess': { pos: [2.5,  4.0], group: 'royalty' },
        'Man':      { pos: [0.5,  1.0], group: 'person' },
        'Woman':    { pos: [0.5,  3.5], group: 'person' },
        'Boy':      { pos: [-1.0, 1.5], group: 'person' },
        'Girl':     { pos: [-1.0, 3.5], group: 'person' },
        'Cat':      { pos: [-3.0, 2.5], group: 'animal' },
        'Dog':      { pos: [-3.5, 1.0], group: 'animal' },
        'Lion':     { pos: [-2.0, 0.5], group: 'animal' },
        'Democracy':{ pos: [-3.0, 4.5], group: 'abstract' },
        'Freedom':  { pos: [-2.5, 5.0], group: 'abstract' },
        'Power':    { pos: [1.5,  0.0], group: 'abstract' },
    },
    // Semantic similarity matrix (simplified: same group = high, adjacent groups = medium)
    groupSimilarity: {
        'royalty-royalty': 0.95,
        'royalty-person': 0.6,
        'royalty-abstract': 0.4,
        'royalty-animal': 0.15,
        'person-person': 0.9,
        'person-animal': 0.3,
        'person-abstract': 0.35,
        'animal-animal': 0.85,
        'animal-abstract': 0.1,
        'abstract-abstract': 0.7,
    },
    attendedToken: null,
    warpStrength: 0.65
};

function getGroupSimilarity(g1, g2) {
    const key1 = `${g1}-${g2}`;
    const key2 = `${g2}-${g1}`;
    return metricTensorState.groupSimilarity[key1] || metricTensorState.groupSimilarity[key2] || 0.2;
}

function computeWarpedPosition(originalPos, attendedTokenKey) {
    const st = metricTensorState;
    if (!attendedTokenKey) return originalPos;

    const attended = st.tokens[attendedTokenKey];
    const attendedPos = attended.pos;
    const attendedGroup = attended.group;

    // For grid points, we warp toward/away from the attended token
    // based on a radial function
    const dx = originalPos[0] - attendedPos[0];
    const dy = originalPos[1] - attendedPos[1];
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.001) return originalPos;

    // Warp: pull nearby grid points closer, push far ones slightly away
    // This creates the "pinch" effect
    const influence = Math.exp(-dist * dist / 8) * st.warpStrength;
    const warpedX = originalPos[0] - dx * influence * 0.4;
    const warpedY = originalPos[1] - dy * influence * 0.4;

    return [warpedX, warpedY];
}

function computeWarpedTokenPosition(tokenKey, attendedTokenKey) {
    const st = metricTensorState;
    if (!attendedTokenKey) return st.tokens[tokenKey].pos;

    const token = st.tokens[tokenKey];
    const attended = st.tokens[attendedTokenKey];

    if (tokenKey === attendedTokenKey) return token.pos;

    const sim = getGroupSimilarity(token.group, attended.group);
    const dx = token.pos[0] - attended.pos[0];
    const dy = token.pos[1] - attended.pos[1];
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.001) return token.pos;

    // High similarity → pull closer; low similarity → push away
    const pullStrength = (sim - 0.3) * st.warpStrength * 1.8;
    const factor = pullStrength * Math.exp(-dist * dist / 20);

    return [
        token.pos[0] - dx * factor,
        token.pos[1] - dy * factor
    ];
}

function renderMetricTensor(animate = false) {
    const plotDiv = document.getElementById('plot-metric-tensor');
    if (!plotDiv) return;

    const st = metricTensorState;
    const attended = st.attendedToken;
    const traces = [];

    const groupColors = {
        'royalty': '#f59e0b',
        'person': '#3b82f6',
        'animal': '#10b981',
        'abstract': '#8b5cf6'
    };

    // --- 1. Draw the deformable grid ---
    const gridMin = -5, gridMax = 6.5, gridStep = 0.5;
    const gridLines = [];

    // Horizontal lines
    for (let y = gridMin; y <= gridMax; y += gridStep) {
        const lineX = [], lineY = [];
        for (let x = gridMin; x <= gridMax; x += gridStep / 2) {
            const warped = computeWarpedPosition([x, y], attended);
            lineX.push(warped[0]);
            lineY.push(warped[1]);
        }
        traces.push({
            x: lineX, y: lineY,
            mode: 'lines',
            line: { color: attended ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.2)', width: 1 },
            showlegend: false, hoverinfo: 'skip'
        });
    }

    // Vertical lines
    for (let x = gridMin; x <= gridMax; x += gridStep) {
        const lineX = [], lineY = [];
        for (let y = gridMin; y <= gridMax; y += gridStep / 2) {
            const warped = computeWarpedPosition([x, y], attended);
            lineX.push(warped[0]);
            lineY.push(warped[1]);
        }
        traces.push({
            x: lineX, y: lineY,
            mode: 'lines',
            line: { color: attended ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.2)', width: 1 },
            showlegend: false, hoverinfo: 'skip'
        });
    }

    // --- 2. Draw attention halo (if attending) ---
    if (attended) {
        const attendedPos = st.tokens[attended].pos;
        const haloSteps = 60;
        for (let r = 0; r < 3; r++) {
            const radius = 0.8 + r * 1.2;
            const opacity = 0.25 - r * 0.07;
            const haloX = [], haloY = [];
            for (let i = 0; i <= haloSteps; i++) {
                const angle = (i / haloSteps) * 2 * Math.PI;
                haloX.push(attendedPos[0] + radius * Math.cos(angle));
                haloY.push(attendedPos[1] + radius * Math.sin(angle));
            }
            traces.push({
                x: haloX, y: haloY,
                mode: 'lines', fill: 'toself',
                fillcolor: `rgba(139, 92, 246, ${opacity * 0.3})`,
                line: { color: `rgba(139, 92, 246, ${opacity})`, width: 1.5 },
                showlegend: false, hoverinfo: 'skip'
            });
        }
    }

    // --- 3. Draw connection lines (attention weights) ---
    if (attended) {
        for (const [word, token] of Object.entries(st.tokens)) {
            if (word === attended) continue;
            const sim = getGroupSimilarity(token.group, st.tokens[attended].group);
            if (sim < 0.25) continue;

            const warpedPos = computeWarpedTokenPosition(word, attended);
            const attendedPos = st.tokens[attended].pos;

            traces.push({
                x: [attendedPos[0], warpedPos[0]],
                y: [attendedPos[1], warpedPos[1]],
                mode: 'lines',
                line: {
                    color: `rgba(139, 92, 246, ${sim * 0.6})`,
                    width: sim * 4,
                    dash: sim > 0.5 ? 'solid' : 'dot'
                },
                showlegend: false, hoverinfo: 'skip'
            });
        }
    }

    // --- 4. Draw token points ---
    for (const [word, token] of Object.entries(st.tokens)) {
        const pos = attended ? computeWarpedTokenPosition(word, attended) : token.pos;
        const isAttended = word === attended;
        const sim = attended ? getGroupSimilarity(token.group, st.tokens[attended]?.group || token.group) : 0;

        traces.push({
            x: [pos[0]], y: [pos[1]],
            mode: 'markers+text',
            text: [word],
            textposition: 'top center',
            textfont: {
                size: isAttended ? 14 : 11,
                color: isAttended ? '#7c3aed' : '#1e293b',
                weight: isAttended ? 'bold' : 'normal'
            },
            marker: {
                size: isAttended ? 18 : 10,
                color: groupColors[token.group],
                opacity: attended ? (isAttended ? 1 : 0.4 + sim * 0.6) : 0.9,
                line: {
                    width: isAttended ? 3 : 1,
                    color: isAttended ? '#7c3aed' : '#fff'
                }
            },
            showlegend: false,
            hovertemplate: `<b>${word}</b><br>Group: ${token.group}${attended && !isAttended ? '<br>Similarity to ' + attended + ': ' + (sim * 100).toFixed(0) + '%' : ''}<extra></extra>`,
            customdata: [word]
        });
    }

    // --- 5. Legend for groups ---
    const legendY = 5.5;
    const legendItems = [
        { label: '👑 Royalty', color: groupColors.royalty, x: -4.5 },
        { label: '🧑 Person', color: groupColors.person, x: -2.0 },
        { label: '🐾 Animal', color: groupColors.animal, x: 0.5 },
        { label: '💡 Abstract', color: groupColors.abstract, x: 3.0 },
    ];

    const annotations = legendItems.map(item => ({
        x: item.x, y: legendY + 0.8,
        text: `<b>${item.label}</b>`,
        showarrow: false,
        font: { size: 11, color: item.color },
        xref: 'x', yref: 'y'
    }));

    if (attended) {
        annotations.push({
            x: st.tokens[attended].pos[0],
            y: st.tokens[attended].pos[1] - 0.7,
            text: `<b>⚡ Attending to: ${attended}</b>`,
            showarrow: false,
            font: { size: 12, color: '#7c3aed' },
            bgcolor: 'rgba(237, 233, 254, 0.9)',
            borderpad: 4
        });
    }

    const layout = {
        margin: { l: 40, r: 40, b: 40, t: 20 },
        showlegend: false,
        xaxis: {
            range: [-5.5, 7],
            zeroline: false,
            showgrid: false,
            title: '',
            fixedrange: true
        },
        yaxis: {
            range: [-2, 7],
            zeroline: false,
            showgrid: false,
            title: '',
            scaleanchor: 'x',
            fixedrange: true
        },
        annotations: annotations,
        plot_bgcolor: '#fff'
    };

    Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true }).then(() => {
        // Attach click handler
        plotDiv.removeAllListeners?.('plotly_click');
        plotDiv.on('plotly_click', function(data) {
            if (data.points && data.points[0] && data.points[0].customdata) {
                const clickedWord = data.points[0].customdata;
                if (st.tokens[clickedWord]) {
                    st.attendedToken = clickedWord;
                    const statusEl = document.getElementById('metric-status');
                    if (statusEl) {
                        const group = st.tokens[clickedWord].group;
                        statusEl.innerHTML = `⚡ Attending to <b>${clickedWord}</b> (${group}). Related tokens pulled closer, unrelated pushed away.`;
                        statusEl.style.color = '#7c3aed';
                    }
                    renderMetricTensor(true);
                }
            }
        });
    });
}

function resetMetricTensor() {
    const st = metricTensorState;
    st.attendedToken = null;

    const statusEl = document.getElementById('metric-status');
    if (statusEl) {
        statusEl.textContent = 'Click any token to apply attention.';
        statusEl.style.color = '#64748b';
    }

    renderMetricTensor();
}

// ============================================================
// TRANSLATION INVARIANCE — PARALLELOGRAM LAW
// ============================================================

const parallelogramState = {
    currentConcept: 'royalty',
    points: {
        'Boy':      [-15, -10],
        'Girl':     [-15,  10],
        'Man':      [0,   -10],
        'Woman':    [0,    10],
        'Prince':   [12,  -10],
        'Princess': [12,   10],
        'King':     [25,  -10],
        'Queen':    [25,   10],
    },
    concepts: {
        royalty: {
            label: '👑 Royalty',
            pairs: [
                ['Man', 'King'],
                ['Woman', 'Queen'],
                ['Boy', 'Prince'],
                ['Girl', 'Princess']
            ],
            color: '#f59e0b',
            description: 'The "royalty" direction: the same offset transforms commoners into royals, regardless of gender or age.'
        },
        gender: {
            label: '⚤ Gender',
            pairs: [
                ['Man', 'Woman'],
                ['King', 'Queen'],
                ['Prince', 'Princess'],
                ['Boy', 'Girl']
            ],
            color: '#ec4899',
            description: 'The "gender" direction: the same offset transforms male tokens into female tokens, regardless of rank or age.'
        },
        age: {
            label: '📅 Age',
            pairs: [
                ['Boy', 'Man'],
                ['Girl', 'Woman'],
                ['Prince', 'King'],
                ['Princess', 'Queen']
            ],
            color: '#10b981',
            description: 'The "age/maturity" direction: the same offset transforms young tokens into adult tokens, regardless of gender or rank.'
        }
    }
};

function setParallelogramConcept(concept) {
    parallelogramState.currentConcept = concept;

    // Update button styles
    document.querySelectorAll('.parallelogram-btn').forEach(btn => {
        btn.style.background = '#64748b';
    });
    const activeBtn = document.getElementById(`btn-para-${concept}`);
    if (activeBtn) activeBtn.style.background = '#3b82f6';

    renderParallelogram();
}

function renderParallelogram() {
    const plotDiv = document.getElementById('plot-parallelogram');
    if (!plotDiv) return;

    const st = parallelogramState;
    const concept = st.concepts[st.currentConcept];
    const pts = st.points;
    const traces = [];
    const annotations = [];

    const tokenColors = {
        'King': '#f59e0b', 'Queen': '#f59e0b',
        'Prince': '#10b981', 'Princess': '#10b981',
        'Man': '#3b82f6', 'Woman': '#3b82f6',
        'Boy': '#8b5cf6', 'Girl': '#8b5cf6'
    };

    // --- Draw all tokens ---
    for (const [word, [x, y]] of Object.entries(pts)) {
        traces.push({
            x: [x], y: [y],
            mode: 'markers+text',
            text: [word],
            textposition: 'top center',
            textfont: { size: 12, color: '#1e293b' },
            marker: { size: 10, color: tokenColors[word] || '#94a3b8', opacity: 0.9, line: { width: 1, color: '#fff' } },
            showlegend: false,
            hovertemplate: `<b>${word}</b><br>x: %{x:.1f}, y: %{y:.1f}<extra></extra>`
        });
    }

    // --- Draw light grid connecting all structural pairs ---
    const structuralPairs = [
        ['Boy', 'Girl'], ['Man', 'Woman'], ['Prince', 'Princess'], ['King', 'Queen'],
        ['Boy', 'Man'], ['Girl', 'Woman'], ['Man', 'King'], ['Woman', 'Queen'],
        ['Boy', 'Prince'], ['Girl', 'Princess'], ['Prince', 'King'], ['Princess', 'Queen']
    ];
    for (const [a, b] of structuralPairs) {
        traces.push({
            x: [pts[a][0], pts[b][0]], y: [pts[a][1], pts[b][1]],
            mode: 'lines',
            line: { color: 'rgba(203, 213, 225, 0.5)', width: 1 },
            showlegend: false, hoverinfo: 'skip'
        });
    }

    // --- Draw the concept offset arrows ---
    // Compute the average offset vector for display
    let avgDx = 0, avgDy = 0;
    for (const [from, to] of concept.pairs) {
        avgDx += pts[to][0] - pts[from][0];
        avgDy += pts[to][1] - pts[from][1];
    }
    avgDx /= concept.pairs.length;
    avgDy /= concept.pairs.length;

    for (let i = 0; i < concept.pairs.length; i++) {
        const [from, to] = concept.pairs[i];
        const fromPos = pts[from];
        const toPos = pts[to];

        // Thick colored arrow for the concept direction
        annotations.push({
            ax: fromPos[0], ay: fromPos[1],
            x: toPos[0], y: toPos[1],
            axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
            showarrow: true,
            arrowhead: 2, arrowsize: 1.5, arrowwidth: 4,
            arrowcolor: concept.color,
            opacity: 0.85
        });

        // Label on the first arrow only
        if (i === 0) {
            const midX = (fromPos[0] + toPos[0]) / 2;
            const midY = (fromPos[1] + toPos[1]) / 2;
            annotations.push({
                x: midX, y: midY + 3,
                text: `<b>${concept.label}</b><br>Δ = [${avgDx.toFixed(0)}, ${avgDy.toFixed(0)}]`,
                showarrow: false,
                font: { size: 12, color: concept.color },
                bgcolor: 'rgba(255,255,255,0.85)',
                borderpad: 4
            });
        }
    }

    // --- Draw parallelogram shading for the first two pairs ---
    if (concept.pairs.length >= 2) {
        const [a1, b1] = concept.pairs[0];
        const [a2, b2] = concept.pairs[1];
        traces.push({
            x: [pts[a1][0], pts[b1][0], pts[b2][0], pts[a2][0], pts[a1][0]],
            y: [pts[a1][1], pts[b1][1], pts[b2][1], pts[a2][1], pts[a1][1]],
            mode: 'lines',
            fill: 'toself',
            fillcolor: concept.color + '15',
            line: { color: concept.color + '40', width: 2, dash: 'dot' },
            showlegend: false, hoverinfo: 'skip'
        });
    }

    // Update description
    const statusEl = document.getElementById('parallelogram-status');
    if (statusEl) {
        const pairsStr = concept.pairs.map(([a, b]) => `${a} → ${b}`).join(', ');
        statusEl.innerHTML = `<b>${concept.description}</b><br>Pairs: ${pairsStr}. All arrows are parallel and equal in length — the offset vector <code>Δ = [${avgDx.toFixed(0)}, ${avgDy.toFixed(0)}]</code> is the same everywhere.`;
    }

    const layout = {
        margin: { l: 40, r: 40, b: 40, t: 20 },
        showlegend: false,
        xaxis: { range: [-25, 35], zeroline: false, showgrid: true, gridcolor: '#f1f5f9' },
        yaxis: { range: [-20, 22], zeroline: false, showgrid: true, gridcolor: '#f1f5f9', scaleanchor: 'x' },
        annotations: annotations,
        plot_bgcolor: '#fff'
    };

    Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });
}

// ============================================================
// SCALE INVARIANCE VISUALIZATION
// ============================================================

const scaleInvarianceState = {
    tokenA: { label: 'King', angle: 30, magnitude: 1.0, color: '#f59e0b' },
    tokenB: { label: 'Monarch', angle: 30, magnitude: 1.0, color: '#3b82f6' },  // Same direction!
    tokenC: { label: 'Cat', angle: 150, magnitude: 1.0, color: '#10b981' },     // Different direction
    baseLength: 8
};

function renderScaleInvariance() {
    const plotDiv = document.getElementById('plot-scale-invariance');
    if (!plotDiv) return;

    const st = scaleInvarianceState;
    const slider = document.getElementById('scale-magnitude');
    const magVal = document.getElementById('scale-mag-val');
    const statsDiv = document.getElementById('scale-invariance-stats');

    const mag = parseFloat(slider.value);
    st.tokenB.magnitude = mag;
    magVal.textContent = mag.toFixed(2) + '×';

    const radA = st.tokenA.angle * Math.PI / 180;
    const radB = st.tokenB.angle * Math.PI / 180;
    const radC = st.tokenC.angle * Math.PI / 180;

    const ax = st.baseLength * st.tokenA.magnitude * Math.cos(radA);
    const ay = st.baseLength * st.tokenA.magnitude * Math.sin(radA);
    const bx = st.baseLength * st.tokenB.magnitude * Math.cos(radB);
    const by = st.baseLength * st.tokenB.magnitude * Math.sin(radB);
    const cx = st.baseLength * st.tokenC.magnitude * Math.cos(radC);
    const cy = st.baseLength * st.tokenC.magnitude * Math.sin(radC);

    // Compute metrics
    const eucAB = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
    const eucAC = Math.sqrt((ax - cx) ** 2 + (ay - cy) ** 2);
    const dotAB = ax * bx + ay * by;
    const dotAC = ax * cx + ay * cy;
    const magA = Math.sqrt(ax * ax + ay * ay);
    const magB = Math.sqrt(bx * bx + by * by);
    const magC = Math.sqrt(cx * cx + cy * cy);
    const cosAB = dotAB / (magA * magB || 1);
    const cosAC = dotAC / (magA * magC || 1);

    // Direction ray for Token B
    const rayLen = st.baseLength * 3.5;
    const rayX = rayLen * Math.cos(radB);
    const rayY = rayLen * Math.sin(radB);

    const traces = [
        // Direction ray (shows the line Token B moves along)
        {
            x: [0, rayX], y: [0, rayY],
            mode: 'lines',
            line: { color: 'rgba(59, 130, 246, 0.15)', width: 12 },
            showlegend: false, hoverinfo: 'skip'
        },
        // Vector A
        {
            x: [0, ax], y: [0, ay],
            mode: 'lines+markers+text',
            text: ['', st.tokenA.label],
            textposition: 'top right',
            textfont: { size: 13, color: st.tokenA.color, weight: 'bold' },
            line: { color: st.tokenA.color, width: 4 },
            marker: { size: [4, 12], color: st.tokenA.color },
            showlegend: false,
            hovertemplate: `<b>${st.tokenA.label}</b><br>Magnitude: ${st.tokenA.magnitude.toFixed(2)}<extra></extra>`
        },
        // Vector B (the one being scaled)
        {
            x: [0, bx], y: [0, by],
            mode: 'lines+markers+text',
            text: ['', st.tokenB.label],
            textposition: 'top right',
            textfont: { size: 13, color: st.tokenB.color, weight: 'bold' },
            line: { color: st.tokenB.color, width: 4 },
            marker: { size: [4, 14], color: st.tokenB.color, symbol: ['circle', 'diamond'] },
            showlegend: false,
            hovertemplate: `<b>${st.tokenB.label}</b><br>Magnitude: ${mag.toFixed(2)}×<extra></extra>`
        },
        // Vector C (reference — different direction)
        {
            x: [0, cx], y: [0, cy],
            mode: 'lines+markers+text',
            text: ['', st.tokenC.label],
            textposition: 'top left',
            textfont: { size: 13, color: st.tokenC.color, weight: 'bold' },
            line: { color: st.tokenC.color, width: 3, dash: 'dot' },
            marker: { size: [4, 10], color: st.tokenC.color },
            showlegend: false,
            hovertemplate: `<b>${st.tokenC.label}</b><br>Different direction entirely<extra></extra>`
        },
        // Euclidean distance line A↔B
        {
            x: [ax, bx], y: [ay, by],
            mode: 'lines',
            line: { color: '#ef4444', width: 2.5, dash: 'dash' },
            showlegend: false,
            hovertemplate: `Euclidean(${st.tokenA.label}, ${st.tokenB.label}): ${eucAB.toFixed(2)}<extra></extra>`
        }
    ];

    // Angle arc between A and B (should stay constant)
    const arcRadius = 2.5;
    const arcSteps = 30;
    const arcX = [0], arcY = [0];
    const startAngle = Math.min(radA, radB);
    const endAngle = Math.max(radA, radB);
    for (let i = 0; i <= arcSteps; i++) {
        const t = startAngle + (i / arcSteps) * (endAngle - startAngle);
        arcX.push(arcRadius * Math.cos(t));
        arcY.push(arcRadius * Math.sin(t));
    }
    arcX.push(0);
    arcY.push(0);

    // Only show arc if A and B have different angles (they don't here, but keeping for robustness)
    if (Math.abs(st.tokenA.angle - st.tokenB.angle) > 0.5) {
        traces.push({
            x: arcX, y: arcY,
            mode: 'lines', fill: 'toself',
            fillcolor: 'rgba(16, 185, 129, 0.15)',
            line: { color: '#10b981', width: 2 },
            showlegend: false, hoverinfo: 'skip'
        });
    }

    const annotations = [
        {
            x: (ax + bx) / 2 + 0.5, y: (ay + by) / 2 + 0.5,
            text: `<b>Euclidean: ${eucAB.toFixed(2)}</b>`,
            showarrow: false,
            font: { size: 11, color: '#ef4444' },
            bgcolor: 'rgba(255,255,255,0.85)', borderpad: 3
        }
    ];

    // If same direction, show "θ = 0°" label
    if (Math.abs(st.tokenA.angle - st.tokenB.angle) < 1) {
        annotations.push({
            x: 3.5 * Math.cos(radA), y: 3.5 * Math.sin(radA) + 1.2,
            text: `<b>θ = 0° → cos = ${cosAB.toFixed(4)}</b>`,
            showarrow: false,
            font: { size: 12, color: '#10b981' },
            bgcolor: 'rgba(255,255,255,0.85)', borderpad: 3
        });
    }

    const layout = {
        margin: { l: 40, r: 40, b: 40, t: 20 },
        showlegend: false,
        xaxis: { range: [-20, 30], zeroline: true, zerolinecolor: '#e2e8f0', showgrid: true, gridcolor: '#f1f5f9' },
        yaxis: { range: [-5, 22], zeroline: true, zerolinecolor: '#e2e8f0', showgrid: true, gridcolor: '#f1f5f9', scaleanchor: 'x' },
        annotations: annotations,
        plot_bgcolor: '#fff'
    };

    Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });

    // Update stats
    if (statsDiv) {
        statsDiv.innerHTML = `
            <div style="padding: 12px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <div style="font-size: 0.8em; color: #64748b; margin-bottom: 4px;">Cosine Similarity</div>
                <div style="font-size: 1.6em; font-weight: bold; color: #10b981;">${cosAB.toFixed(4)}</div>
                <div style="font-size: 0.75em; color: #94a3b8; margin-top: 2px;">Direction match — constant!</div>
            </div>
            <div style="padding: 12px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <div style="font-size: 0.8em; color: #64748b; margin-bottom: 4px;">Euclidean Distance</div>
                <div style="font-size: 1.6em; font-weight: bold; color: #ef4444;">${eucAB.toFixed(2)}</div>
                <div style="font-size: 0.75em; color: #94a3b8; margin-top: 2px;">Magnitude-dependent — changes!</div>
            </div>
        `;
    }
}

// ============================================================
// THE PLATONIC REPRESENTATION HYPOTHESIS
// ============================================================

// ============================================================
// THE PLATONIC REPRESENTATION HYPOTHESIS (2D)
// ============================================================

const platonicState = {
	visionRotDeg: 65,
	audioRotDeg: -130,
	visionOffset: [25, 18],
	audioOffset: [-25, 18],
	currentVisionRotDeg: 65,
	currentAudioRotDeg: -130,
	currentVisionOffset: [25, 18],
	currentAudioOffset: [-25, 18],
	residualVisionRotDeg: 1.5,
	residualAudioRotDeg: -2,
	residualVisionOffset: [0.15, 0.1],
	residualAudioOffset: [-0.12, -0.08],
	aligned: false,
	animating: false,
	showCorrespondence: true,
	showStructure: true
};

const platonicConcepts = [
    { name: 'Dog',     pos: [ 5,   -3],   group: 'animal' },
    { name: 'Cat',     pos: [ 3,    1],   group: 'animal' },
    { name: 'Bird',    pos: [ 1.5, -1],   group: 'animal' },
    { name: 'Car',     pos: [-5,   -3],   group: 'machine' },
    { name: 'Guitar',  pos: [-1.5,  5],   group: 'music' },
    { name: 'Piano',   pos: [-3.5,  5.5], group: 'music' },
    { name: 'Thunder', pos: [ 0,   -5.5], group: 'nature' },
    { name: 'Rain',    pos: [ 1,   -4],   group: 'nature' },
];

const platonicStructurePairs = [
    ['Dog', 'Cat'], ['Dog', 'Bird'], ['Cat', 'Bird'],
    ['Guitar', 'Piano'],
    ['Thunder', 'Rain'],
];

const platonicGroupColors = {
    animal:  '#ef4444',
    machine: '#6366f1',
    music:   '#ec4899',
    nature:  '#14b8a6'
};

function platonicRotate2D(pos, deg, offsetX, offsetY) {
    const rad = deg * Math.PI / 180;
    return [
        pos[0] * Math.cos(rad) - pos[1] * Math.sin(rad) + offsetX,
        pos[0] * Math.sin(rad) + pos[1] * Math.cos(rad) + offsetY
    ];
}

function getPlatonicModPos(concept, modality) {
    const st = platonicState;
    const p = concept.pos;
    if (modality === 'language') return [...p];
    if (modality === 'vision')
        return platonicRotate2D(p, st.currentVisionRotDeg,
            st.currentVisionOffset[0], st.currentVisionOffset[1]);
    if (modality === 'audio')
        return platonicRotate2D(p, st.currentAudioRotDeg,
            st.currentAudioOffset[0], st.currentAudioOffset[1]);
    return [...p];
}

function renderPlatonicHypothesis() {
    const plotDiv = document.getElementById('plot-platonic');
    if (!plotDiv) return;

    const st = platonicState;
    const traces = [];
    const annotations = [];

    // --- Convergence metric: 0 = fully separated, 1 = fully aligned ---
    const totalRange =
        Math.abs(st.visionRotDeg - st.residualVisionRotDeg) +
        Math.abs(st.audioRotDeg - st.residualAudioRotDeg) +
        Math.abs(st.visionOffset[0] - st.residualVisionOffset[0]) +
        Math.abs(st.visionOffset[1] - st.residualVisionOffset[1]) +
        Math.abs(st.audioOffset[0] - st.residualAudioOffset[0]) +
        Math.abs(st.audioOffset[1] - st.residualAudioOffset[1]);

    const currentDelta =
        Math.abs(st.currentVisionRotDeg - st.residualVisionRotDeg) +
        Math.abs(st.currentAudioRotDeg - st.residualAudioRotDeg) +
        Math.abs(st.currentVisionOffset[0] - st.residualVisionOffset[0]) +
        Math.abs(st.currentVisionOffset[1] - st.residualVisionOffset[1]) +
        Math.abs(st.currentAudioOffset[0] - st.residualAudioOffset[0]) +
        Math.abs(st.currentAudioOffset[1] - st.residualAudioOffset[1]);

    const convergence = totalRange > 0 ? 1 - (currentDelta / totalRange) : 1;

    const modalityConfig = [
        { key: 'language', label: 'Language Model',  color: '#3b82f6', symbol: 'circle',  textColor: '#1e40af', prefix: '' },
        { key: 'vision',   label: 'Vision Model',   color: '#f59e0b', symbol: 'diamond', textColor: '#92400e', prefix: '👁 ' },
        { key: 'audio',    label: 'Audio Model',     color: '#10b981', symbol: 'square',  textColor: '#065f46', prefix: '🔊 ' },
    ];

    // Small offsets so converged markers fan out instead of stacking
    const nudgeVectors = {
        language: [0,    0.45],
        vision:   [0.5, -0.3],
        audio:    [-0.5,-0.3]
    };

    // --- 1. Points: one trace per modality ---
    modalityConfig.forEach(mod => {
        const xs = [], ys = [], labels = [], hoverLabels = [], colors = [];

        // Hide vision/audio text once they're close to the language labels
        const showText = mod.key === 'language' || convergence < 0.75;

        // Nudge ramps in smoothly as modalities overlap
        const nudgeFactor = Math.pow(Math.max(0, convergence - 0.3) / 0.7, 2);
        const nudge = nudgeVectors[mod.key];

        platonicConcepts.forEach(c => {
            const p = getPlatonicModPos(c, mod.key);
            xs.push(p[0] + nudge[0] * nudgeFactor);
            ys.push(p[1] + nudge[1] * nudgeFactor);
            labels.push(showText ? (mod.prefix + c.name) : '');
            hoverLabels.push(mod.prefix + c.name);
            colors.push(platonicGroupColors[c.group]);
        });

        traces.push({
            type: 'scatter',
            x: xs, y: ys,
            mode: 'markers+text',
            text: labels,
            customdata: hoverLabels,
            textposition: mod.key === 'language' ? 'top center' :
                          mod.key === 'vision'   ? 'bottom right' : 'bottom left',
            textfont: { size: 10, color: mod.textColor },
            marker: {
                size: 11, color: colors, opacity: 0.9,
                symbol: mod.symbol,
                line: { width: 1, color: '#fff' }
            },
            name: mod.label,
            hovertemplate: '<b>%{customdata}</b> (' + mod.label + ')<extra></extra>'
        });
    });

    // --- 2. Cluster structure lines ---
        // --- 2. Cluster structure lines (differentiated per modality) ---
    if (st.showStructure) {
        const dashStyles = ['solid', 'dash', 'dot'];
        modalityConfig.forEach((mod, modIdx) => {
            const lx = [], ly = [];
            platonicStructurePairs.forEach(([a, b]) => {
                const ca = platonicConcepts.find(c => c.name === a);
                const cb = platonicConcepts.find(c => c.name === b);
                const pa = getPlatonicModPos(ca, mod.key);
                const pb = getPlatonicModPos(cb, mod.key);
                lx.push(pa[0], pb[0], null);
                ly.push(pa[1], pb[1], null);
            });
            traces.push({
                type: 'scatter',
                x: lx, y: ly,
                mode: 'lines',
                line: {
                    color: mod.color,
                    width: 2.5 - modIdx * 0.3,
                    dash: dashStyles[modIdx]
                },
                opacity: 0.35,
                showlegend: false,
                hoverinfo: 'skip',
                connectgaps: false
            });
        });
    }

    // --- 3. Correspondence lines ---
    if (st.showCorrespondence) {
        // Fade out correspondence lines as modalities merge
	const corrOpacity = Math.max(0.15, 1 - convergence * 0.85);
        const cx = [], cy = [];
        platonicConcepts.forEach(c => {
            const pL = getPlatonicModPos(c, 'language');
            const pV = getPlatonicModPos(c, 'vision');
            const pA = getPlatonicModPos(c, 'audio');
            cx.push(pL[0], pV[0], null);
            cy.push(pL[1], pV[1], null);
            cx.push(pL[0], pA[0], null);
            cy.push(pL[1], pA[1], null);
        });
        traces.push({
            type: 'scatter',
            x: cx, y: cy,
            mode: 'lines',
            line: { color: `rgba(139,92,246,${(0.3 * corrOpacity).toFixed(2)})`, width: 1.5, dash: 'dash' },
            showlegend: false,
            hoverinfo: 'skip',
            connectgaps: false
        });
    }

    
    const layout = {
        margin: { l: 40, r: 40, b: 40, t: 20 },
        showlegend: true,
        legend: {
            x: 0.01, y: 0.99,
            bgcolor: 'rgba(255,255,255,0.9)',
            bordercolor: '#e2e8f0', borderwidth: 1,
            font: { size: 11 }
        },
        xaxis: {
            zeroline: false, showgrid: true,
            gridcolor: '#f1f5f9', showticklabels: false
        },
        yaxis: {
            zeroline: false, showgrid: true,
            gridcolor: '#f1f5f9', showticklabels: false,
            scaleanchor: 'x'
        },
        annotations: annotations,
        plot_bgcolor: '#fff'
    };

    Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });
}

// --- Animate alignment ---

window.animatePlatonicAlignment = function() {
    const st = platonicState;
    if (st.animating || st.aligned) return;

    st.animating = true;
    const btn = document.getElementById('btn-platonic-align');
    btn.disabled = true;
    btn.style.opacity = '0.5';

    const startVRot = st.currentVisionRotDeg;
    const startARot = st.currentAudioRotDeg;
    const startVOff = [...st.currentVisionOffset];
    const startAOff = [...st.currentAudioOffset];

    // Target residual values, NOT zero
    const targetVRot = st.residualVisionRotDeg;
    const targetARot = st.residualAudioRotDeg;
    const targetVOff = st.residualVisionOffset;
    const targetAOff = st.residualAudioOffset;

    const duration = 2500;
    const startTime = performance.now();

    function easeInOutCubic(t) {
        return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
    }

    function step(now) {
        const elapsed = now - startTime;
        const rawT = Math.min(elapsed / duration, 1);
        const t = easeInOutCubic(rawT);

        st.currentVisionRotDeg = startVRot + (targetVRot - startVRot) * t;
        st.currentAudioRotDeg  = startARot + (targetARot - startARot) * t;
        st.currentVisionOffset = [
            startVOff[0] + (targetVOff[0] - startVOff[0]) * t,
            startVOff[1] + (targetVOff[1] - startVOff[1]) * t
        ];
        st.currentAudioOffset = [
            startAOff[0] + (targetAOff[0] - startAOff[0]) * t,
            startAOff[1] + (targetAOff[1] - startAOff[1]) * t
        ];

        const statusEl = document.getElementById('platonic-status');
        if (statusEl) {
            statusEl.textContent = 'Converging… Vision: ' +
                Math.round(st.currentVisionRotDeg) + '° → ~' + targetVRot + '° | Audio: ' +
                Math.round(st.currentAudioRotDeg) + '° → ~' + targetARot + '°';
        }

        renderPlatonicHypothesis();

        if (rawT < 1) {
            requestAnimationFrame(step);
        } else {
            st.currentVisionRotDeg = targetVRot;
            st.currentAudioRotDeg  = targetARot;
            st.currentVisionOffset = [...targetVOff];
            st.currentAudioOffset  = [...targetAOff];
            st.animating = false;
            st.aligned = true;
            btn.disabled = true;

            if (statusEl) {
                statusEl.innerHTML = '✅ <b>Converged!</b> All three modalities approach the same geometry — but with residual differences, just as the hypothesis predicts (*approximately* the same, not identical).';
                statusEl.style.color = '#10b981';
            }
            renderPlatonicHypothesis();
        }
    }
    requestAnimationFrame(step);
};

// --- Reset ---

window.resetPlatonicAlignment = function() {
    const st = platonicState;
    if (st.animating) return;

    st.currentVisionRotDeg = st.visionRotDeg;
    st.currentAudioRotDeg  = st.audioRotDeg;
    st.currentVisionOffset = [...st.visionOffset];
    st.currentAudioOffset  = [...st.audioOffset];
    st.aligned = false;

    const btn = document.getElementById('btn-platonic-align');
    btn.disabled = false;
    btn.style.opacity = '1';

    const statusEl = document.getElementById('platonic-status');
    if (statusEl) {
        statusEl.textContent = 'Ready — three models, three different orientations, one shared geometry.';
        statusEl.style.color = '#64748b';
    }

    renderPlatonicHypothesis();
};

// --- Toggles ---

window.togglePlatonicOption = function() {
    platonicState.showCorrespondence = document.getElementById('platonic-correspondence').checked;
    platonicState.showStructure = document.getElementById('platonic-structure').checked;
    renderPlatonicHypothesis();
};

// ============================================================
// ANISOTROPY VISUALIZATION
// ============================================================

const anisotropyState = {
    numVectors: 80,
    level: 0,
    baseVectors: [],
    coneCenter: Math.PI / 4, // 45° — the dominant direction the cone points toward
    labeledIndices: {}
};

function initAnisotropy() {
    const st = anisotropyState;
    st.baseVectors = [];

    for (let i = 0; i < st.numVectors; i++) {
        st.baseVectors.push({
            baseAngle: Math.random() * 2 * Math.PI,
            magnitude: 0.4 + Math.random() * 0.6
        });
    }

    // Assign word labels to a subset of vectors for tangibility
    const labels = [
        'King', 'Queen', 'Man', 'Woman', 'Cat', 'Dog', 'Run',
        'Think', 'Democracy', 'Sandwich', 'River', 'Happy',
        'Blue', 'Ancient', 'Protein'
    ];
    const step = Math.floor(st.numVectors / labels.length);
    labels.forEach((label, i) => {
        st.labeledIndices[i * step] = label;
    });
}

function getAnisotropicVectors(level) {
    const st = anisotropyState;
    const center = st.coneCenter;
    const vectors = [];

    for (let i = 0; i < st.numVectors; i++) {
        const base = st.baseVectors[i];

        // Compute angular offset from cone center, normalized to [-π, π]
        let offset = base.baseAngle - center;
        while (offset > Math.PI) offset -= 2 * Math.PI;
        while (offset < -Math.PI) offset += 2 * Math.PI;

        // Compress the offset as anisotropy increases
        const compressedOffset = offset * (1 - level * 0.93);
        const finalAngle = center + compressedOffset;

        vectors.push({
            x: base.magnitude * Math.cos(finalAngle),
            y: base.magnitude * Math.sin(finalAngle),
            angle: finalAngle,
            mag: base.magnitude,
            idx: i
        });
    }
    return vectors;
}

function computePairwiseCosines(vectors) {
    const sims = [];
    for (let i = 0; i < vectors.length; i++) {
        for (let j = i + 1; j < vectors.length; j++) {
            const a = vectors[i], b = vectors[j];
            const dot = a.x * b.x + a.y * b.y;
            const mA = Math.sqrt(a.x * a.x + a.y * a.y);
            const mB = Math.sqrt(b.x * b.x + b.y * b.y);
            if (mA > 1e-6 && mB > 1e-6) {
                sims.push(dot / (mA * mB));
            }
        }
    }
    return sims;
}

function renderAnisotropy() {
	const scatterDiv = document.getElementById('plot-anisotropy-scatter');
	const histDiv    = document.getElementById('plot-anisotropy-histogram');
	const statsDiv   = document.getElementById('anisotropy-stats');
	if (!scatterDiv || !histDiv) return;

	const st     = anisotropyState;
	const slider = document.getElementById('anisotropy-slider');
	const valEl  = document.getElementById('anisotropy-val');

	st.level = parseFloat(slider.value);
	const pct = Math.round(st.level * 100);

	let tag = `${pct}%`;
	if      (pct === 0)  tag += ' (Isotropic)';
	else if (pct < 30)   tag += ' (Mild)';
	else if (pct < 60)   tag += ' (Moderate)';
	else if (pct < 85)   tag += ' (Strong)';
	else                  tag += ' (Extreme)';
	valEl.textContent = tag;

	const vectors = getAnisotropicVectors(st.level);
	const sims    = computePairwiseCosines(vectors);

	// ───────── LEFT: Scatter Plot ─────────
	const scatterTraces = [];

	// Reference unit circle
	const cX = [], cY = [];
	for (let i = 0; i <= 64; i++) {
		const a = (i / 64) * 2 * Math.PI;
		cX.push(Math.cos(a));
		cY.push(Math.sin(a));
	}
	scatterTraces.push({
		x: cX, y: cY, mode: 'lines',
		line: { color: 'rgba(203,213,225,0.4)', width: 1 },
		showlegend: false, hoverinfo: 'skip'
	});

	// Cone wedge highlight (only visible when anisotropy > 5%)
	if (st.level > 0.05) {
		const halfAngle = Math.PI * (1 - st.level * 0.93);
		const wX = [0], wY = [0];
		for (let i = 0; i <= 40; i++) {
			const t = st.coneCenter - halfAngle + (2 * halfAngle * i / 40);
			wX.push(1.25 * Math.cos(t));
			wY.push(1.25 * Math.sin(t));
		}
		wX.push(0); wY.push(0);
		scatterTraces.push({
			x: wX, y: wY, mode: 'lines', fill: 'toself',
			fillcolor: 'rgba(239,68,68,0.07)',
			line: { color: 'rgba(239,68,68,0.25)', width: 1.5, dash: 'dash' },
			showlegend: false, hoverinfo: 'skip'
		});
	}

	// Unlabeled vector lines + endpoints
	const endX = [], endY = [];
	vectors.forEach((v, i) => {
		if (st.labeledIndices[i]) return; // handled below
		scatterTraces.push({
			x: [0, v.x], y: [0, v.y], mode: 'lines',
			line: { color: 'rgba(148,163,184,0.35)', width: 1 },
			showlegend: false, hoverinfo: 'skip'
		});
		endX.push(v.x); endY.push(v.y);
	});
	scatterTraces.push({
		x: endX, y: endY, mode: 'markers',
		marker: { size: 3.5, color: '#94a3b8', opacity: 0.6 },
		showlegend: false, hoverinfo: 'skip'
	});

	// Labeled vectors (on top)
	vectors.forEach((v, i) => {
		const label = st.labeledIndices[i];
		if (!label) return;
		scatterTraces.push({
			x: [0, v.x], y: [0, v.y],
			mode: 'lines+markers+text',
			text: ['', label], textposition: 'top center',
			textfont: { size: 10, color: '#1e293b' },
			line: { color: '#3b82f6', width: 2 },
			marker: { size: [0, 6], color: '#3b82f6' },
			showlegend: false,
			hovertemplate: `<b>${label}</b><br>Angle: ${(v.angle * 180 / Math.PI).toFixed(1)}°<extra></extra>`
		});
	});

	Plotly.react(scatterDiv, scatterTraces, {
		margin: { l: 30, r: 30, b: 30, t: 35 },
		showlegend: false,
		xaxis: { range: [-1.45, 1.45], zeroline: true, zerolinecolor: '#e2e8f0', showgrid: false, scaleanchor: 'y' },
		yaxis: { range: [-1.45, 1.45], zeroline: true, zerolinecolor: '#e2e8f0', showgrid: false },
		plot_bgcolor: '#fff',
		title: { text: 'Embedding Vectors', font: { size: 13, color: '#64748b' } }
	}, { displayModeBar: false, responsive: true });

	// ───────── RIGHT: Histogram ─────────
	const barColor = st.level < 0.3 ? 'rgba(59,130,246,0.6)'
		: st.level < 0.7 ? 'rgba(245,158,11,0.6)'
		:                   'rgba(239,68,68,0.6)';

	Plotly.react(histDiv, [{
		x: sims, type: 'histogram', nbinsx: 50,
		marker: { color: barColor, line: { color: '#fff', width: 0.5 } },
		hovertemplate: 'Cosine Sim: %{x:.2f}<br>Count: %{y}<extra></extra>'
	}], {
		margin: { l: 45, r: 30, b: 45, t: 35 },
		xaxis: { title: 'Cosine Similarity', range: [-1.05, 1.05], dtick: 0.25 },
		yaxis: { title: 'Pair Count' },
		plot_bgcolor: '#fff',
		bargap: 0.05,
		title: { text: 'Pairwise Cosine Similarities', font: { size: 13, color: '#64748b' } }
	}, { displayModeBar: false, responsive: true });

	// ───────── STATS ─────────
	if (statsDiv && sims.length) {
		const avg   = sims.reduce((a, b) => a + b, 0) / sims.length;
		const lo    = Math.min(...sims);
		const hi    = Math.max(...sims);
		const range = hi - lo;

		const colorFor = (good, warn, val, threshGood, threshWarn) =>
			val > threshWarn ? '#ef4444' : val > threshGood ? '#f59e0b' : '#10b981';

		statsDiv.innerHTML = `
	    <div style="padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
		<div style="font-size:0.8em; color:#64748b; margin-bottom:4px;">Avg Cosine Similarity</div>
		<div style="font-size:1.5em; font-weight:bold; color:${colorFor(0,0,avg,0.3,0.6)};">${avg.toFixed(3)}</div>
		<div style="font-size:0.75em; color:#94a3b8;">Isotropic ideal: ≈ 0.000</div>
	    </div>
	    <div style="padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
		<div style="font-size:0.8em; color:#64748b; margin-bottom:4px;">Similarity Range</div>
		<div style="font-size:1.5em; font-weight:bold; color:${range < 0.5 ? '#ef4444' : range < 1.2 ? '#f59e0b' : '#10b981'};">${lo.toFixed(2)} → ${hi.toFixed(2)}</div>
		<div style="font-size:0.75em; color:#94a3b8;">Full range: −1.0 → +1.0</div>
	    </div>
	    <div style="padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
		<div style="font-size:0.8em; color:#64748b; margin-bottom:4px;">Effective Bandwidth</div>
		<div style="font-size:1.5em; font-weight:bold; color:${range < 0.5 ? '#ef4444' : range < 1.2 ? '#f59e0b' : '#10b981'};">${range.toFixed(3)}</div>
		<div style="font-size:0.75em; color:#94a3b8;">Discriminative capacity</div>
	    </div>
	`;
	}
}

// ============================================================
// SUPERPOSITION & POLYSEMANTICITY VISUALIZATION
// ============================================================

const superpositionState = {
    featureLabels: [
        'Royalty', 'Gender', 'Species', 'Formality', 'Emotion', 'Time',
        'Agency', 'Plural', 'Negation', 'Cause', 'Abstract', 'Animacy'
    ],
    featureColors: [
        '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4',
        '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#e11d48', '#0ea5e9'
    ]
};

function renderSuperposition() {
    const plotDiv = document.getElementById('plot-superposition');
    if (!plotDiv) return;

    const slider  = document.getElementById('superposition-n');
    const nSpan   = document.getElementById('superposition-n-val');
    const statDiv = document.getElementById('superposition-stats');
    const matDiv  = document.getElementById('superposition-matrix');

    const N = parseInt(slider.value);
    nSpan.textContent = N;

    const st = superpositionState;
    const traces = [];

    // ---- Upper-half unit circle (reference arc) ----
    const circX = [], circY = [];
    for (let i = 0; i <= 100; i++) {
        const t = (i / 100) * Math.PI;
        circX.push(Math.cos(t));
        circY.push(Math.sin(t));
    }
    traces.push({
        x: circX, y: circY,
        mode: 'lines',
        line: { color: 'rgba(148,163,184,0.25)', width: 1.5, dash: 'dot' },
        showlegend: false, hoverinfo: 'skip'
    });

    // ---- Compute feature directions ----
    // Spread N features evenly over [0°, 180°):  θ_i = i·π/N
    const angles  = [];
    const vectors = [];
    for (let i = 0; i < N; i++) {
        const a = (i * Math.PI) / N;
        angles.push(a);
        vectors.push([Math.cos(a), Math.sin(a)]);
    }

    // ---- Pairwise dot-product matrix ----
    const dotMat = [];
    let maxIntf = 0, totalIntf = 0, pairs = 0;
    for (let i = 0; i < N; i++) {
        dotMat[i] = [];
        for (let j = 0; j < N; j++) {
            const d = vectors[i][0]*vectors[j][0] + vectors[i][1]*vectors[j][1];
            dotMat[i][j] = d;
            if (j > i) {
                const a = Math.abs(d);
                totalIntf += a;
                pairs++;
                if (a > maxIntf) maxIntf = a;
            }
        }
    }
    const avgIntf      = pairs > 0 ? totalIntf / pairs : 0;
    const minAngleDeg  = N > 1 ? 180 / N : 180;
    const isSuperposed = N > 2;

    // ---- Interference lines between feature tips ----
    for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
            const ad = Math.abs(dotMat[i][j]);
            if (ad > 0.08) {
                traces.push({
                    x: [vectors[i][0], vectors[j][0]],
                    y: [vectors[i][1], vectors[j][1]],
                    mode: 'lines',
                    line: {
                        color: `rgba(239,68,68,${Math.min(ad * 0.65, 0.55)})`,
                        width: 1 + ad * 4
                    },
                    showlegend: false,
                    hovertemplate:
                        `<b>${st.featureLabels[i % 12]} ↔ ${st.featureLabels[j % 12]}</b>` +
                        `<br>|dot| = ${ad.toFixed(3)}` +
                        `<br>Interference: ${(ad * 100).toFixed(1)}%<extra></extra>`
                });
            }
        }
    }

    // ---- Feature arrows + labels ----
    for (let i = 0; i < N; i++) {
        const [vx, vy] = vectors[i];
        const color = st.featureColors[i % 12];
        const label = st.featureLabels[i % 12];
        const deg   = angles[i] * 180 / Math.PI;

        // Choose text position based on angle
        let tPos;
        if      (deg < 25)  tPos = 'middle right';
        else if (deg < 65)  tPos = 'top right';
        else if (deg < 115) tPos = 'top center';
        else if (deg < 155) tPos = 'top left';
        else                tPos = 'middle left';

        const fontSize = N > 8 ? 8 : (N > 5 ? 9 : 10);

        // Arrow line
        traces.push({
            x: [0, vx], y: [0, vy],
            mode: 'lines',
            line: { color, width: 3.5 },
            showlegend: false, hoverinfo: 'skip'
        });
        // Tip marker + label
        traces.push({
            x: [vx], y: [vy],
            mode: 'markers+text',
            text: [label], textposition: tPos,
            textfont: { size: fontSize, color, weight: 'bold' },
            marker: { size: 9, color, line: { width: 1, color: '#fff' } },
            showlegend: false,
            hovertemplate: `<b>${label}</b><br>θ = ${deg.toFixed(1)}°<extra></extra>`
        });
    }

    // ---- Right-angle marker when N = 2 ----
    if (N === 2) {
        const s = 0.07;
        traces.push({
            x: [s, s, 0], y: [0, s, s],
            mode: 'lines',
            line: { color: '#10b981', width: 2 },
            showlegend: false, hoverinfo: 'skip'
        });
    }

    // ---- Origin dot ----
    traces.push({
        x: [0], y: [0],
        mode: 'markers',
        marker: { size: 5, color: '#1e293b' },
        showlegend: false, hoverinfo: 'skip'
    });

    // ---- Layout ----
    Plotly.react(plotDiv, traces, {
        margin: { l: 30, r: 30, b: 30, t: 10 },
        showlegend: false,
        xaxis: {
            range: [-1.5, 1.5], zeroline: true, zerolinecolor: '#e2e8f0',
            showgrid: true, gridcolor: '#f1f5f9', scaleanchor: 'y', dtick: 0.5
        },
        yaxis: {
            range: [-0.25, 1.5], zeroline: true, zerolinecolor: '#e2e8f0',
            showgrid: true, gridcolor: '#f1f5f9', dtick: 0.5
        },
        plot_bgcolor: '#fff'
    }, { displayModeBar: false, responsive: true });

    // ---- Stats cards ----
    if (statDiv) {
        statDiv.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px;">
            <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-size:0.7em; color:#64748b;">Features</div>
                <div style="font-size:1.3em; font-weight:bold; color:#3b82f6;">${N}</div>
            </div>
            <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-size:0.7em; color:#64748b;">Min Angle</div>
                <div style="font-size:1.3em; font-weight:bold; color:${isSuperposed ? '#f59e0b' : '#10b981'};">${minAngleDeg.toFixed(0)}°</div>
            </div>
            <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid ${isSuperposed ? '#fecaca' : '#bbf7d0'}; text-align:center;">
                <div style="font-size:0.7em; color:#64748b;">Max |dot|</div>
                <div style="font-size:1.3em; font-weight:bold; color:${isSuperposed ? '#ef4444' : '#10b981'};">${maxIntf.toFixed(2)}</div>
            </div>
            <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-size:0.7em; color:#64748b;">Status</div>
                <div style="font-size:0.95em; font-weight:bold; color:${isSuperposed ? '#ef4444' : '#10b981'};">${isSuperposed ? '⚠️ Superposition' : '✅ Orthogonal'}</div>
            </div>
        </div>`;
    }

    // ---- Interference matrix (HTML table) ----
    if (matDiv) {
        let h = '<div style="font-size:0.8em; color:#475569; margin-bottom:6px; font-family:sans-serif; text-align:center;"><b>Interference Matrix  ( |dot product| )</b></div>';
        h += '<div style="overflow-x:auto;"><table style="border-collapse:collapse; font-size:0.72em; font-family:monospace; margin:0 auto;">';

        // Header
        h += '<tr><td style="padding:2px 4px;"></td>';
        for (let j = 0; j < N; j++) {
            const lab = st.featureLabels[j % 12].slice(0, 3);
            h += `<td style="padding:2px 4px; text-align:center; font-weight:bold; color:${st.featureColors[j % 12]}; font-size:0.9em;">${lab}</td>`;
        }
        h += '</tr>';

        for (let i = 0; i < N; i++) {
            const lab = st.featureLabels[i % 12].slice(0, 3);
            h += `<tr><td style="padding:2px 4px; font-weight:bold; color:${st.featureColors[i % 12]}; font-size:0.9em;">${lab}</td>`;
            for (let j = 0; j < N; j++) {
                const ad = Math.abs(dotMat[i][j]);
                let bg, tc;
                if (i === j) {
                    bg = '#f0f9ff'; tc = '#94a3b8';
                } else if (ad < 0.05) {
                    bg = 'rgba(16,185,129,0.1)'; tc = '#10b981';
                } else {
                    bg = `rgba(239,68,68,${Math.min(ad, 1) * 0.25})`; tc = ad > 0.5 ? '#dc2626' : '#475569';
                }
                const txt = i === j ? '—' : ad.toFixed(2);
                h += `<td style="padding:2px 4px; text-align:center; background:${bg}; color:${tc}; border:1px solid #f1f5f9;">${txt}</td>`;
            }
            h += '</tr>';
        }
        h += '</table></div>';
        matDiv.innerHTML = h;
    }
}

// ============================================================
// THE GEOMETRY OF IN-CONTEXT LEARNING
// ============================================================

// ============================================================
// THE GEOMETRY OF IN-CONTEXT LEARNING
// ============================================================

const iclState = {
    numExamples: 3,
    injected: false,
    animating: false,
    queryAnimT: 0,

    // Each pair: the prompt sentence "Q: capital of {input}?  A: {label}"
    // Positions approximate where each token lands in the residual stream.
    // The first pair is intentionally noisier (different offset direction)
    // to show why averaging over more examples helps.
    examplePairs: [
        { input: 'Germany',   inputPos: [-5,   2],  label: 'Berlin',   labelPos: [7,  13],  color: '#8b5cf6' },
        { input: 'France',    inputPos: [-8,  -2],  label: 'Paris',    labelPos: [7,   5],  color: '#f59e0b' },
        { input: 'Japan',     inputPos: [-10, -5],  label: 'Tokyo',    labelPos: [5,   4],  color: '#06b6d4' },
        { input: 'Spain',     inputPos: [-4,  -3],  label: 'Madrid',   labelPos: [10,  4],  color: '#ec4899' },
        { input: 'Brazil',    inputPos: [-9,   3],  label: 'Brasília', labelPos: [4,  11],  color: '#84cc16' },
        { input: 'Australia', inputPos: [-3,  -6],  label: 'Canberra', labelPos: [12,  2],  color: '#f97316' },
    ],

    query:          { token: 'Italy', pos: [-7, 0] },
    expectedAnswer: { token: 'Rome',  pos: [8, 8] },
    answerRadius: 2.5
};

/* ---------- helpers ---------- */

function getICLTaskVector() {
    var st = iclState;
    var n  = st.numExamples;
    var dx = 0, dy = 0;
    for (var i = 0; i < n; i++) {
        var ex = st.examplePairs[i];
        dx += ex.labelPos[0] - ex.inputPos[0];
        dy += ex.labelPos[1] - ex.inputPos[1];
    }
    return [dx / n, dy / n];
}

function iclSteeredPos() {
    var tv = getICLTaskVector();
    var t  = iclState.queryAnimT;
    return [
        iclState.query.pos[0] + tv[0] * t,
        iclState.query.pos[1] + tv[1] * t
    ];
}

function iclDistToAnswer() {
    var p = iclSteeredPos();
    var a = iclState.expectedAnswer.pos;
    return Math.sqrt(Math.pow(p[0] - a[0], 2) + Math.pow(p[1] - a[1], 2));
}

/* ---------- prompt preview panel ---------- */

function updateICLPromptPanel() {
    var panel = document.getElementById('icl-prompt-preview');
    if (!panel) return;

    var st  = iclState;
    var n   = st.numExamples;
    var tv  = getICLTaskVector();
    var sp  = iclSteeredPos();
    var dist = iclDistToAnswer();
    var inside = dist <= st.answerRadius;

    // ---- Prompt block (dark terminal look) ----
    var html = '' +
        '<div style="font-family:\'Courier New\',monospace; font-size:0.78em; background:#1e293b; color:#e2e8f0;' +
        ' border-radius:8px; padding:14px; line-height:1.9; margin-bottom:10px;">' +

        '<div style="color:#94a3b8; margin-bottom:6px; font-family:sans-serif; font-size:0.92em;">' +
        '<b>📝 Few-shot Prompt</b> <span style="color:#475569;">(what the model sees)</span></div>' +

        '<div style="border-bottom:1px solid #334155; margin-bottom:8px; padding-bottom:4px; color:#94a3b8; font-style:italic;">' +
        'Task: Given a country, name its capital.</div>';

    // Example lines
    for (var i = 0; i < st.examplePairs.length; i++) {
        var ex     = st.examplePairs[i];
        var active = i < n;
        var dx     = ex.labelPos[0] - ex.inputPos[0];
        var dy     = ex.labelPos[1] - ex.inputPos[1];

        html += '<div style="opacity:' + (active ? 1 : 0.22) + '; display:flex; align-items:center; gap:8px;' +
            ' padding:2px 0; transition:opacity 0.3s;">' +
            '<span style="display:inline-block; width:10px; height:10px; border-radius:50%;' +
            ' background:' + ex.color + '; flex-shrink:0;"></span>' +
            '<span>Q: ' + ex.input + '&nbsp;&nbsp;A: <b>' + ex.label + '</b></span>';
        if (active) {
            html += '<span style="color:#64748b; margin-left:auto; font-size:0.85em; white-space:nowrap;">' +
                'Δ=[' + dx + ',' + dy + ']</span>';
        }
        html += '</div>';
    }

    // Query line
    var answerText = st.injected ? (inside ? st.expectedAnswer.token + ' ✓' : '??? (close)') : '???';
    var answerColor = st.injected ? (inside ? '#10b981' : '#fbbf24') : '#ef4444';

    html += '<div style="border-top:1px solid #334155; margin-top:8px; padding-top:8px;' +
        ' display:flex; align-items:center; gap:8px;">' +
        '<span style="display:inline-block; width:10px; height:10px; background:#ef4444;' +
        ' transform:rotate(45deg); flex-shrink:0;"></span>' +
        '<span style="color:#fbbf24;">Q: ' + st.query.token + '&nbsp;&nbsp;A: ' +
        '<b style="color:' + answerColor + ';">' + answerText + '</b></span></div></div>';

    // ---- Offset computation block ----
    html += '<div style="font-family:\'Courier New\',monospace; font-size:0.75em; background:#f8fafc;' +
        ' border:1px solid #e2e8f0; border-radius:8px; padding:12px; line-height:1.8;">' +
        '<div style="font-family:sans-serif; font-size:0.95em; color:#475569; margin-bottom:6px;">' +
        '<b>⚙️ Task Vector Computation</b></div>';

    for (var i = 0; i < n; i++) {
        var ex = st.examplePairs[i];
        var dx = ex.labelPos[0] - ex.inputPos[0];
        var dy = ex.labelPos[1] - ex.inputPos[1];
        html += '<div style="color:' + ex.color + ';">' +
            'Δ<sub>' + (i + 1) + '</sub> = ' + ex.label + ' − ' + ex.input +
            ' = [' + dx + ', ' + dy + ']</div>';
    }

    html += '<div style="border-top:1px solid #e2e8f0; margin-top:6px; padding-top:6px;' +
        ' color:#3b82f6; font-weight:bold;">' +
        'Avg Δ = [' + tv[0].toFixed(1) + ', ' + tv[1].toFixed(1) + ']</div>';

    html += '<div style="color:#64748b; font-size:0.9em; margin-top:4px;">' +
        'Apply to ' + st.query.token + ': [' + st.query.pos[0] + ', ' + st.query.pos[1] + ']' +
        ' + Δ = [' + sp[0].toFixed(1) + ', ' + sp[1].toFixed(1) + ']</div>';

    html += '<div style="color:' + (inside && st.injected ? '#10b981' : '#94a3b8') +
        '; font-size:0.85em; margin-top:3px;">' +
        'Distance to ' + st.expectedAnswer.token + ': ' + dist.toFixed(2) +
        (inside ? ' ✅ inside' : ' — radius ' + st.answerRadius) + '</div></div>';

    panel.innerHTML = html;
}

/* ---------- main render ---------- */

function renderICL() {
    var plotDiv = document.getElementById('plot-icl-task-vector');
    if (!plotDiv) return;

    var st  = iclState;
    var n   = st.numExamples;
    var tv  = getICLTaskVector();
    var qPos = st.query.pos;
    var t   = st.queryAnimT;

    var traces      = [];
    var annotations = [];

    // ---- 1. Answer region (green circle around Rome) ----
    var cSteps = 60, cX = [], cY = [];
    for (var i = 0; i <= cSteps; i++) {
        var a = (i / cSteps) * 2 * Math.PI;
        cX.push(st.expectedAnswer.pos[0] + st.answerRadius * Math.cos(a));
        cY.push(st.expectedAnswer.pos[1] + st.answerRadius * Math.sin(a));
    }
    traces.push({
        x: cX, y: cY, mode: 'lines', fill: 'toself',
        fillcolor: 'rgba(16,185,129,0.08)',
        line: { color: 'rgba(16,185,129,0.4)', width: 2, dash: 'dot' },
        showlegend: false, hoverinfo: 'skip'
    });

    // Rome marker
    traces.push({
        x: [st.expectedAnswer.pos[0]], y: [st.expectedAnswer.pos[1]],
        mode: 'markers+text',
        text: ['Rome'], textposition: 'top center',
        textfont: { size: 11, color: '#10b981' },
        marker: { size: 9, color: '#10b981', symbol: 'star', opacity: 0.7 },
        showlegend: false,
        hovertemplate: '<b>Rome</b> (expected answer)<extra></extra>'
    });
    annotations.push({
        x: st.expectedAnswer.pos[0],
        y: st.expectedAnswer.pos[1] + st.answerRadius + 1.2,
        text: '<b>🏛️ Answer Region</b>',
        showarrow: false,
        font: { size: 10, color: '#10b981' },
        bgcolor: 'rgba(255,255,255,0.85)', borderpad: 3
    });

    // ---- 2. Inactive example pairs (very faint) ----
    for (var i = n; i < st.examplePairs.length; i++) {
        var ex = st.examplePairs[i];
        traces.push({
            x: [ex.inputPos[0]], y: [ex.inputPos[1]],
            mode: 'markers', marker: { size: 4, color: '#cbd5e1', opacity: 0.25 },
            showlegend: false, hovertemplate: '<b>' + ex.input + '</b> (inactive)<extra></extra>'
        });
        traces.push({
            x: [ex.labelPos[0]], y: [ex.labelPos[1]],
            mode: 'markers', marker: { size: 4, color: '#cbd5e1', opacity: 0.25, symbol: 'triangle-up' },
            showlegend: false, hovertemplate: '<b>' + ex.label + '</b> (inactive)<extra></extra>'
        });
    }

    // ---- 3. Active example pairs (color-coded arrows) ----
    for (var i = 0; i < n; i++) {
        var ex = st.examplePairs[i];
        var dx = ex.labelPos[0] - ex.inputPos[0];
        var dy = ex.labelPos[1] - ex.inputPos[1];

        // Input point (circle)
        traces.push({
            x: [ex.inputPos[0]], y: [ex.inputPos[1]],
            mode: 'markers+text',
            text: [ex.input], textposition: 'bottom left',
            textfont: { size: 10, color: ex.color },
            marker: { size: 9, color: ex.color, opacity: 0.9 },
            showlegend: false,
            hovertemplate: '<b>' + ex.input + '</b> (input)<br>[' +
                ex.inputPos[0] + ', ' + ex.inputPos[1] + ']<extra></extra>'
        });

        // Label point (triangle)
        traces.push({
            x: [ex.labelPos[0]], y: [ex.labelPos[1]],
            mode: 'markers+text',
            text: [ex.label], textposition: 'top right',
            textfont: { size: 10, color: ex.color },
            marker: { size: 9, color: ex.color, opacity: 0.9, symbol: 'triangle-up' },
            showlegend: false,
            hovertemplate: '<b>' + ex.label + '</b> (label for ' + ex.input + ')' +
                '<br>Δ = [' + dx + ', ' + dy + ']<extra></extra>'
        });

        // Arrow from input → label
        annotations.push({
            ax: ex.inputPos[0], ay: ex.inputPos[1],
            x: ex.labelPos[0], y: ex.labelPos[1],
            axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
            showarrow: true,
            arrowhead: 2, arrowsize: 1.2, arrowwidth: 2.5,
            arrowcolor: ex.color, opacity: 0.6
        });

        // Midpoint label (e.g., "France → Paris")
        var mx = (ex.inputPos[0] + ex.labelPos[0]) / 2;
        var my = (ex.inputPos[1] + ex.labelPos[1]) / 2;
        annotations.push({
            x: mx + (i % 2 === 0 ? 1 : -1) * 0.8,
            y: my + 0.9,
            text: '<i>' + ex.input + ' → ' + ex.label + '</i>',
            showarrow: false,
            font: { size: 8, color: ex.color },
            opacity: 0.7
        });
    }

    // ---- 4. Task vector preview (dashed blue, from query) ----
    var tvEndX = qPos[0] + tv[0];
    var tvEndY = qPos[1] + tv[1];

    if (t < 0.01) {
        // Before injection — show where the task vector would send the query
        traces.push({
            x: [qPos[0], tvEndX], y: [qPos[1], tvEndY],
            mode: 'lines',
            line: { color: 'rgba(59,130,246,0.25)', width: 3, dash: 'dash' },
            showlegend: false, hoverinfo: 'skip'
        });
        annotations.push({
            ax: qPos[0], ay: qPos[1],
            x: tvEndX, y: tvEndY,
            axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
            showarrow: true,
            arrowhead: 2, arrowsize: 1.5, arrowwidth: 3,
            arrowcolor: 'rgba(59,130,246,0.3)'
        });
        // Label
        annotations.push({
            x: (qPos[0] + tvEndX) / 2 + 2,
            y: (qPos[1] + tvEndY) / 2 - 0.5,
            text: '<b>Task Vector</b><br>Δ̄ = [' + tv[0].toFixed(1) + ', ' + tv[1].toFixed(1) + ']',
            showarrow: true, ax: 25, ay: -20,
            font: { size: 11, color: '#3b82f6' },
            bgcolor: 'rgba(255,255,255,0.9)', borderpad: 4,
            arrowcolor: '#3b82f6', arrowwidth: 1, arrowhead: 0
        });
    }

    // ---- 5. Query token ----
    var sX = qPos[0] + tv[0] * t;
    var sY = qPos[1] + tv[1] * t;
    var insideNow = iclDistToAnswer() <= st.answerRadius;

    // Ghost of original position + animated path
    if (t > 0.01) {
        traces.push({
            x: [qPos[0]], y: [qPos[1]],
            mode: 'markers+text',
            text: [st.query.token], textposition: 'bottom right',
            textfont: { size: 9, color: 'rgba(239,68,68,0.25)' },
            marker: { size: 12, color: 'rgba(239,68,68,0.15)', symbol: 'diamond' },
            showlegend: false, hoverinfo: 'skip'
        });
        traces.push({
            x: [qPos[0], sX], y: [qPos[1], sY],
            mode: 'lines',
            line: { color: 'rgba(59,130,246,0.45)', width: 3, dash: 'dash' },
            showlegend: false, hoverinfo: 'skip'
        });
        annotations.push({
            ax: qPos[0], ay: qPos[1],
            x: sX, y: sY,
            axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
            showarrow: true,
            arrowhead: 2, arrowsize: 1.5, arrowwidth: 3,
            arrowcolor: '#3b82f6',
            opacity: Math.min(t * 1.5, 1)
        });
        // Label the applied task vector during/after animation
        annotations.push({
            x: (qPos[0] + sX) / 2 + 2,
            y: (qPos[1] + sY) / 2 - 0.5,
            text: '<b>Task Vector applied</b><br>Δ̄ = [' + tv[0].toFixed(1) + ', ' + tv[1].toFixed(1) + ']',
            showarrow: true, ax: 25, ay: -20,
            font: { size: 10, color: '#3b82f6' },
            bgcolor: 'rgba(255,255,255,0.9)', borderpad: 3,
            arrowcolor: '#3b82f6', arrowwidth: 1, arrowhead: 0
        });
    }

    // Current query marker
    var qColor = (t > 0.95 && insideNow) ? '#10b981' : '#ef4444';
    traces.push({
        x: [sX], y: [sY],
        mode: 'markers+text',
        text: [st.query.token],
        textposition: t > 0.5 ? 'bottom right' : 'top left',
        textfont: { size: 14, color: qColor, weight: 'bold' },
        marker: { size: 16, color: qColor, symbol: 'diamond',
            line: { width: 2, color: '#fff' } },
        showlegend: false,
        hovertemplate: '<b>' + st.query.token + '</b> (query)' +
            '<br>[' + sX.toFixed(1) + ', ' + sY.toFixed(1) + ']<extra></extra>'
    });

    // ---- Layout ----
    var layout = {
        margin: { l: 35, r: 15, b: 35, t: 15 },
        showlegend: false,
        xaxis: {
            range: [-14, 17], zeroline: true, zerolinecolor: '#e2e8f0',
            showgrid: true, gridcolor: '#f1f5f9', title: ''
        },
        yaxis: {
            range: [-10, 17], zeroline: true, zerolinecolor: '#e2e8f0',
            showgrid: true, gridcolor: '#f1f5f9', scaleanchor: 'x', title: ''
        },
        annotations: annotations,
        plot_bgcolor: '#fff'
    };

    Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });

    // ---- Side panels ----
    updateICLPromptPanel();

    // ---- Stats cards ----
    var statsDiv = document.getElementById('icl-stats');
    if (statsDiv) {
        var mag  = Math.sqrt(tv[0] * tv[0] + tv[1] * tv[1]);
        var dist = iclDistToAnswer();
        var ok   = dist <= st.answerRadius;

        statsDiv.innerHTML =
            '<div style="padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">' +
                '<div style="font-size:0.8em; color:#64748b; margin-bottom:4px;">Task Vector ‖Δ̄‖</div>' +
                '<div style="font-size:1.5em; font-weight:bold; color:#3b82f6;">' + mag.toFixed(1) + '</div>' +
                '<div style="font-size:0.75em; color:#94a3b8;">from ' + n + ' example' + (n > 1 ? 's' : '') + '</div>' +
            '</div>' +
            '<div style="padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">' +
                '<div style="font-size:0.8em; color:#64748b; margin-bottom:4px;">Distance to Rome</div>' +
                '<div style="font-size:1.5em; font-weight:bold; color:' + (ok ? '#10b981' : '#ef4444') + ';">' +
                    dist.toFixed(2) + '</div>' +
                '<div style="font-size:0.75em; color:#94a3b8;">' +
                    (ok ? '✅ Inside answer region' : '⬜ Outside (radius ' + st.answerRadius + ')') + '</div>' +
            '</div>' +
            '<div style="padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">' +
                '<div style="font-size:0.8em; color:#64748b; margin-bottom:4px;">Examples Used</div>' +
                '<div style="font-size:1.5em; font-weight:bold; color:#8b5cf6;">' + n + ' / ' +
                    st.examplePairs.length + '</div>' +
                '<div style="font-size:0.75em; color:#94a3b8;">More → stabler direction</div>' +
            '</div>';
    }
}

/* ---------- animation ---------- */

window.animateICLInjection = function() {
    var st = iclState;
    if (st.animating || st.injected) return;

    st.animating = true;
    var btn = document.getElementById('btn-icl-inject');
    btn.disabled = true;
    btn.style.opacity = '0.5';

    var duration  = 1500;
    var startTime = performance.now();

    function ease(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(now) {
        var elapsed = now - startTime;
        var rawT    = Math.min(elapsed / duration, 1);
        st.queryAnimT = ease(rawT);

        var statusEl = document.getElementById('icl-status');
        if (statusEl) {
            statusEl.textContent = 'Injecting task vector… ' + Math.round(rawT * 100) + '%';
            statusEl.style.color = '#3b82f6';
        }

        renderICL();

        if (rawT < 1) {
            requestAnimationFrame(step);
        } else {
            st.queryAnimT = 1;
            st.animating  = false;
            st.injected   = true;
            btn.disabled  = true;

            if (statusEl) {
                var ok = iclDistToAnswer() <= st.answerRadius;
                statusEl.innerHTML = ok
                    ? '✅ <b>Success!</b> The task vector steered "Italy" into the answer region near "Rome" — no weight update needed.'
                    : '⚠️ <b>Injected</b>, but landed outside the answer region. Try adding more examples for a more precise task vector.';
                statusEl.style.color = ok ? '#10b981' : '#f59e0b';
            }
            renderICL();
        }
    }
    requestAnimationFrame(step);
};

/* ---------- reset ---------- */

window.resetICL = function() {
    var st = iclState;
    if (st.animating) return;

    st.queryAnimT = 0;
    st.injected   = false;

    var btn = document.getElementById('btn-icl-inject');
    btn.disabled = false;
    btn.style.opacity = '1';

    var statusEl = document.getElementById('icl-status');
    if (statusEl) {
        statusEl.textContent = 'Ready — adjust examples and click Inject.';
        statusEl.style.color = '#64748b';
    }
    renderICL();
};

/* ---------- slider ---------- */

function initICL() {
    var slider = document.getElementById('icl-num-examples');
    if (!slider) return;

    function onSliderChange() {
        iclState.numExamples = parseInt(slider.value);
        document.getElementById('icl-num-val').textContent = iclState.numExamples;
        if (iclState.injected) {
            resetICL();
        } else {
            renderICL();
        }
    }

    slider.addEventListener('input', onSliderChange);
    renderICL();
}

// ============================================================
// THE GEOMETRY OF NEGATION
// ============================================================

const negationState = {
    selectedWord: 'Happy',
    words: {
        'Happy':  { pos: [7,  5],   antonym: 'Sad' },
        'Sad':    { pos: [-8,  4],  antonym: 'Happy' },
        'Good':   { pos: [5,  2],   antonym: 'Bad' },
        'Bad':    { pos: [-6,  1],  antonym: 'Good' },
        'Love':   { pos: [8, -1],   antonym: 'Hate' },
        'Hate':   { pos: [-7, -2],  antonym: 'Love' },
        'Alive':  { pos: [4, -4],   antonym: 'Dead' },
        'Dead':   { pos: [-5, -5],  antonym: 'Alive' },
        'Hot':    { pos: [6, -6],   antonym: 'Cold' },
        'Cold':   { pos: [-6, -6],  antonym: 'Hot' },
        'Big':    { pos: [3,  7],   antonym: 'Small' },
        'Small':  { pos: [-4,  7],  antonym: 'Big' },
    },
    // The "not" vector. In real embeddings, vec("not") is a small, generic
    // function-word vector — it does NOT encode logical inversion.
    notVector: [-1.5, -0.8],
};

function getNegatedPosition(wordKey) {
    const st = negationState;
    const w = st.words[wordKey];
    return [
        w.pos[0] + st.notVector[0],
        w.pos[1] + st.notVector[1]
    ];
}

function setNegationWord(word) {
    negationState.selectedWord = word;

    // Update button highlights
    document.querySelectorAll('.negation-btn').forEach(btn => {
        btn.style.background = '#64748b';
        btn.style.opacity = '0.7';
    });
    const activeBtn = document.getElementById(`btn-neg-${word.toLowerCase()}`);
    if (activeBtn) {
        activeBtn.style.background = '#3b82f6';
        activeBtn.style.opacity = '1';
    }

    renderNegation();
}

window.handleNegationInput = function(val) {
    let word = val.trim();
    // Accept "not happy" or just "happy"
    if (word.toLowerCase().startsWith('not ')) {
        word = word.substring(4).trim();
    }
    const match = Object.keys(negationState.words).find(
        w => w.toLowerCase() === word.toLowerCase()
    );
    if (match) {
        setNegationWord(match);
    }
};

function renderNegation() {
	const plotDiv = document.getElementById('plot-negation');
	if (!plotDiv) return;

	const st       = negationState;
	const selected = st.selectedWord;
	const selData  = st.words[selected];
	const antKey   = selData.antonym;
	const antData  = st.words[antKey];
	const notPos   = getNegatedPosition(selected);

	// Distances
	const distToNot = Math.sqrt(
		Math.pow(notPos[0] - selData.pos[0], 2) +
		Math.pow(notPos[1] - selData.pos[1], 2)
	);
	const distNotToAnt = Math.sqrt(
		Math.pow(antData.pos[0] - notPos[0], 2) +
		Math.pow(antData.pos[1] - notPos[1], 2)
	);
	const ratio = (distNotToAnt / distToNot).toFixed(1);

	const traces      = [];
	const annotations = [];

	// ---- 1. Background words (faded) ----
	for (const [word, data] of Object.entries(st.words)) {
		if (word === selected || word === antKey) continue;
		traces.push({
			x: [data.pos[0]], y: [data.pos[1]],
			mode: 'markers+text',
			text: [word], textposition: 'top center',
			textfont: { size: 10, color: '#94a3b8' },
			marker: { size: 6, color: '#cbd5e1', opacity: 0.5 },
			showlegend: false,
			hovertemplate: `<b>${word}</b><br>x: %{x:.1f}, y: %{y:.1f}<extra></extra>`
		});
	}

	// ---- 2. "Expected" ghost circle at antonym ----
	const ghostSteps = 50;
	const ghostR     = 1.8;
	const gX = [], gY = [];
	for (let i = 0; i <= ghostSteps; i++) {
		const a = (i / ghostSteps) * 2 * Math.PI;
		gX.push(antData.pos[0] + ghostR * Math.cos(a));
		gY.push(antData.pos[1] + ghostR * Math.sin(a));
	}
	traces.push({
		x: gX, y: gY,
		mode: 'lines', fill: 'toself',
		fillcolor: 'rgba(239, 68, 68, 0.06)',
		line: { color: 'rgba(239, 68, 68, 0.3)', width: 2, dash: 'dash' },
		showlegend: false,
		hovertemplate: `<b>Expected position of "not ${selected}"</b><br>If negation worked logically<extra></extra>`
	});
	annotations.push({
		x: antData.pos[0], y: antData.pos[1] - 2.5,
		text: `<i>Expected: "not ${selected}"</i>`,
		showarrow: false,
		font: { size: 10, color: 'rgba(239, 68, 68, 0.55)' }
	});

	// ---- 3. Faded "expected logic" line: selected → antonym ----
	traces.push({
		x: [selData.pos[0], antData.pos[0]],
		y: [selData.pos[1], antData.pos[1]],
		mode: 'lines',
		line: { color: 'rgba(16, 185, 129, 0.18)', width: 2.5, dash: 'dash' },
		showlegend: false,
		hovertemplate: `Expected logical negation path<br>"${selected}" → "${antKey}"<extra></extra>`
	});

	// ---- 4. Gold arrow: selected → "not selected" (the tiny real displacement) ----
	annotations.push({
		ax: selData.pos[0], ay: selData.pos[1],
		x: notPos[0], y: notPos[1],
		axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
		showarrow: true,
		arrowhead: 2, arrowsize: 1.5, arrowwidth: 3,
		arrowcolor: '#f59e0b'
	});

	// ---- 5. Dotted line: "not selected" → antonym (still far!) ----
	traces.push({
		x: [notPos[0], antData.pos[0]],
		y: [notPos[1], antData.pos[1]],
		mode: 'lines',
		line: { color: '#ef4444', width: 2, dash: 'dot' },
		showlegend: false,
		hovertemplate: `Distance to antonym: ${distNotToAnt.toFixed(2)}<extra></extra>`
	});

	// ---- 6. The selected word (blue) ----
	traces.push({
		x: [selData.pos[0]], y: [selData.pos[1]],
		mode: 'markers+text',
		text: [selected], textposition: 'top center',
		textfont: { size: 14, color: '#1e40af', weight: 'bold' },
		marker: { size: 16, color: '#3b82f6', opacity: 0.95, line: { width: 2, color: '#fff' } },
		name: `"${selected}"`,
		hovertemplate: `<b>${selected}</b><br>The original word<extra></extra>`
	});

	// ---- 7. "not [word]" (red diamond) ----
	traces.push({
		x: [notPos[0]], y: [notPos[1]],
		mode: 'markers+text',
		text: [`not ${selected}`], textposition: 'bottom right',
		textfont: { size: 13, color: '#dc2626', weight: 'bold' },
		marker: { size: 16, color: '#ef4444', opacity: 0.95, symbol: 'diamond', line: { width: 2, color: '#fff' } },
		name: `"not ${selected}" (actual)`,
		hovertemplate: `<b>not ${selected}</b><br>Actual embedding position<br>Dist to "${selected}": ${distToNot.toFixed(2)}<br>Dist to "${antKey}": ${distNotToAnt.toFixed(2)}<extra></extra>`
	});

	// ---- 8. The antonym (green) ----
	traces.push({
		x: [antData.pos[0]], y: [antData.pos[1]],
		mode: 'markers+text',
		text: [antKey], textposition: 'top center',
		textfont: { size: 14, color: '#065f46', weight: 'bold' },
		marker: { size: 16, color: '#10b981', opacity: 0.95, line: { width: 2, color: '#fff' } },
		name: `"${antKey}" (antonym)`,
		hovertemplate: `<b>${antKey}</b><br>The logical antonym of "${selected}"<extra></extra>`
	});

	// ---- 9. "not" vector indicator (bottom-right legend) ----
	const nvOriginX = 8.5, nvOriginY = -7;
	traces.push({
		x: [nvOriginX, nvOriginX + st.notVector[0]],
		y: [nvOriginY, nvOriginY + st.notVector[1]],
		mode: 'lines',
		line: { color: '#f59e0b', width: 3 },
		showlegend: false, hoverinfo: 'skip'
	});
	annotations.push({
		ax: nvOriginX, ay: nvOriginY,
		x: nvOriginX + st.notVector[0], y: nvOriginY + st.notVector[1],
		axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
		showarrow: true, arrowhead: 2, arrowsize: 1, arrowwidth: 2,
		arrowcolor: '#f59e0b'
	});
	annotations.push({
		x: nvOriginX + st.notVector[0] / 2, y: nvOriginY + st.notVector[1] / 2 - 1,
		text: '<b>vec("not")</b>',
		showarrow: false,
		font: { size: 10, color: '#f59e0b' },
		bgcolor: 'rgba(255,255,255,0.85)', borderpad: 2
	});

	// ---- 10. Distance labels ----
	const midNotX = (selData.pos[0] + notPos[0]) / 2;
	const midNotY = (selData.pos[1] + notPos[1]) / 2;
	annotations.push({
		x: midNotX + 1.2, y: midNotY + 0.6,
		text: `<b>d = ${distToNot.toFixed(1)}</b>`,
		showarrow: false,
		font: { size: 12, color: '#f59e0b' },
		bgcolor: 'rgba(255,255,255,0.9)', borderpad: 3
	});

	const midAntX = (notPos[0] + antData.pos[0]) / 2;
	const midAntY = (notPos[1] + antData.pos[1]) / 2;
	annotations.push({
		x: midAntX, y: midAntY - 1.2,
		text: `<b>d = ${distNotToAnt.toFixed(1)}</b>`,
		showarrow: false,
		font: { size: 12, color: '#ef4444' },
		bgcolor: 'rgba(255,255,255,0.9)', borderpad: 3
	});

	// ---- 11. Verdict banner ----
	annotations.push({
		x: 0, y: -11,
		text: `<b>⚠️ "not ${selected}" is ${ratio}× closer to "${selected}" than to "${antKey}"</b>`,
		showarrow: false,
		font: { size: 13, color: '#dc2626' },
		bgcolor: 'rgba(254, 226, 226, 0.9)',
		borderpad: 6
	});

	// ---- Layout ----
	const layout = {
		margin: { l: 40, r: 40, b: 60, t: 20 },
		showlegend: true,
		legend: {
			x: 0.01, y: 0.99,
			bgcolor: 'rgba(255,255,255,0.9)',
			bordercolor: '#e2e8f0', borderwidth: 1,
			font: { size: 11 }
		},
		xaxis: {
			range: [-12, 13], zeroline: false,
			showgrid: true, gridcolor: '#f1f5f9',
			title: ''
		},
		yaxis: {
			range: [-11, 10], zeroline: false,
			showgrid: true, gridcolor: '#f1f5f9',
			scaleanchor: 'x', title: ''
		},
		annotations: annotations,
		plot_bgcolor: '#fff'
	};

	Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });

	// ---- Stats cards ----
	const statsEl = document.getElementById('negation-stats');
	if (statsEl) {
		statsEl.innerHTML = `
	<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
	    <div style="padding: 12px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
		<div style="font-size: 0.75em; color: #64748b; margin-bottom: 4px;">"${selected}" → "not ${selected}"</div>
		<div style="font-size: 1.6em; font-weight: bold; color: #f59e0b;">${distToNot.toFixed(2)}</div>
		<div style="font-size: 0.7em; color: #94a3b8;">Barely moved!</div>
	    </div>
	    <div style="padding: 12px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
		<div style="font-size: 0.75em; color: #64748b; margin-bottom: 4px;">"not ${selected}" → "${antKey}"</div>
		<div style="font-size: 1.6em; font-weight: bold; color: #ef4444;">${distNotToAnt.toFixed(2)}</div>
		<div style="font-size: 0.7em; color: #94a3b8;">Still far away</div>
	    </div>
	    <div style="padding: 12px; background: #fff; border-radius: 8px; border: 2px solid #fecaca; text-align: center;">
		<div style="font-size: 0.75em; color: #64748b; margin-bottom: 4px;">Failure Ratio</div>
		<div style="font-size: 1.6em; font-weight: bold; color: #dc2626;">${ratio}×</div>
		<div style="font-size: 0.7em; color: #dc2626;">Closer to original than antonym</div>
	    </div>
	</div>`;
	}
}

// ============================================================
// HYPERBOLIC EMBEDDINGS — POINCARÉ DISK VISUALIZATION
// ============================================================

const hyperbolicState = {
    curvature: 1.0,
    tree: null,
    maxDepth: 4
};

function buildHyperbolicTree() {
    const nodes = [
        { name: 'Entity',      depth: 0, parent: null,         group: 'root' },
        { name: 'Animal',      depth: 1, parent: 'Entity',     group: 'animal' },
        { name: 'Object',      depth: 1, parent: 'Entity',     group: 'object' },
        { name: 'Mammal',      depth: 2, parent: 'Animal',     group: 'animal' },
        { name: 'Bird',        depth: 2, parent: 'Animal',     group: 'animal' },
        { name: 'Vehicle',     depth: 2, parent: 'Object',     group: 'object' },
        { name: 'Instrument',  depth: 2, parent: 'Object',     group: 'object' },
        { name: 'Dog',         depth: 3, parent: 'Mammal',     group: 'animal' },
        { name: 'Cat',         depth: 3, parent: 'Mammal',     group: 'animal' },
        { name: 'Lion',        depth: 3, parent: 'Mammal',     group: 'animal' },
        { name: 'Eagle',       depth: 3, parent: 'Bird',       group: 'animal' },
        { name: 'Sparrow',     depth: 3, parent: 'Bird',       group: 'animal' },
        { name: 'Car',         depth: 3, parent: 'Vehicle',    group: 'object' },
        { name: 'Plane',       depth: 3, parent: 'Vehicle',    group: 'object' },
        { name: 'Guitar',      depth: 3, parent: 'Instrument', group: 'object' },
        { name: 'Piano',       depth: 3, parent: 'Instrument', group: 'object' },
        { name: 'Poodle',      depth: 4, parent: 'Dog',        group: 'animal' },
        { name: 'Retriever',   depth: 4, parent: 'Dog',        group: 'animal' },
        { name: 'Tabby',       depth: 4, parent: 'Cat',        group: 'animal' },
        { name: 'Siamese',     depth: 4, parent: 'Cat',        group: 'animal' },
        { name: 'Sedan',       depth: 4, parent: 'Car',        group: 'object' },
        { name: 'SUV',         depth: 4, parent: 'Car',        group: 'object' },
    ];

    var childrenMap = {};
    nodes.forEach(function(n) { childrenMap[n.name] = []; });
    nodes.forEach(function(n) {
        if (n.parent && childrenMap[n.parent]) {
            childrenMap[n.parent].push(n);
        }
    });

    function leafCount(name) {
        var ch = childrenMap[name];
        if (!ch || ch.length === 0) return 1;
        var sum = 0;
        for (var i = 0; i < ch.length; i++) {
            sum += leafCount(ch[i].name);
        }
        return sum;
    }

    function layoutNode(name, aMin, aMax) {
        var node = null;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].name === name) { node = nodes[i]; break; }
        }
        if (!node) return;
        node.angle = (aMin + aMax) / 2;
        node.angleMin = aMin;
        node.angleMax = aMax;

        var children = childrenMap[name];
        if (!children || children.length === 0) return;

        var totalLeaves = 0;
        for (var i = 0; i < children.length; i++) {
            totalLeaves += leafCount(children[i].name);
        }

        var cur = aMin;
        for (var i = 0; i < children.length; i++) {
            var weight = leafCount(children[i].name) / totalLeaves;
            var next = cur + weight * (aMax - aMin);
            layoutNode(children[i].name, cur, next);
            cur = next;
        }
    }

    layoutNode('Entity', 0, 2 * Math.PI);
    return nodes;
}

function getHyperbolicRadius(depth, curvature) {
    var hypR = Math.tanh(depth * 0.55);
    var eucR = depth / (hyperbolicState.maxDepth + 0.5);
    return eucR + curvature * (hypR - eucR);
}

function getHypNodePos(node, curvature) {
    if (!node || node.depth === 0) return [0, 0];
    var r = getHyperbolicRadius(node.depth, curvature);
    var a = node.angle || 0;
    return [r * Math.cos(a), r * Math.sin(a)];
}

function poincareGeodesic(p1, p2, nPts) {
    nPts = nPts || 50;
    var x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1];
    var n1 = x1*x1 + y1*y1;
    var n2 = x2*x2 + y2*y2;
    var cross = x1*y2 - x2*y1;

    // Straight-line fallback
    if (Math.abs(cross) < 1e-6 || n1 < 1e-8 || n2 < 1e-8) {
        var xs = [], ys = [];
        for (var i = 0; i <= nPts; i++) {
            var t = i / nPts;
            xs.push(x1 + t*(x2 - x1));
            ys.push(y1 + t*(y2 - y1));
        }
        return { x: xs, y: ys };
    }

    var a1 = 2*(x2 - x1), b1 = 2*(y2 - y1);
    var c1 = x2*x2 + y2*y2 - x1*x1 - y1*y1;
    var a2 = 2*x1, b2 = 2*y1;
    var c2 = x1*x1 + y1*y1 + 1;
    var det = a1*b2 - a2*b1;

    if (Math.abs(det) < 1e-10) {
        var xs = [], ys = [];
        for (var i = 0; i <= nPts; i++) {
            var t = i / nPts;
            xs.push(x1 + t*(x2 - x1));
            ys.push(y1 + t*(y2 - y1));
        }
        return { x: xs, y: ys };
    }

    var cx = (c1*b2 - c2*b1) / det;
    var cy = (a1*c2 - a2*c1) / det;
    var r  = Math.sqrt((cx - x1)*(cx - x1) + (cy - y1)*(cy - y1));

    var ang1 = Math.atan2(y1 - cy, x1 - cx);
    var ang2 = Math.atan2(y2 - cy, x2 - cx);
    var diff = ang2 - ang1;
    while (diff >  Math.PI) diff -= 2*Math.PI;
    while (diff < -Math.PI) diff += 2*Math.PI;

    var midA = ang1 + diff/2;
    var mx = cx + r*Math.cos(midA), my = cy + r*Math.sin(midA);
    if (mx*mx + my*my > 1.02) {
        diff = diff > 0 ? diff - 2*Math.PI : diff + 2*Math.PI;
    }

    var xs = [], ys = [];
    for (var i = 0; i <= nPts; i++) {
        var a = ang1 + (i/nPts)*diff;
        xs.push(cx + r*Math.cos(a));
        ys.push(cy + r*Math.sin(a));
    }
    return { x: xs, y: ys };
}

function poincareDistance(p1, p2) {
    var dx = p1[0]-p2[0], dy = p1[1]-p2[1];
    var num = dx*dx + dy*dy;
    var d1 = 1 - p1[0]*p1[0] - p1[1]*p1[1];
    var d2 = 1 - p2[0]*p2[0] - p2[1]*p2[1];
    if (d1 <= 0 || d2 <= 0) return Infinity;
    var arg = 1 + 2*num/(d1*d2);
    return Math.acosh(Math.max(1, arg));
}

function getHypEdgePath(p1, p2, curvature) {
    if (curvature < 0.01) {
        return { x: [p1[0], p2[0]], y: [p1[1], p2[1]] };
    }
    var geo = poincareGeodesic(p1, p2);
    if (curvature > 0.99) return geo;

    var n = geo.x.length;
    var xs = [], ys = [];
    for (var i = 0; i < n; i++) {
        var t = i / (n - 1);
        var sx = p1[0] + t*(p2[0] - p1[0]);
        var sy = p1[1] + t*(p2[1] - p1[1]);
        xs.push(sx + curvature*(geo.x[i] - sx));
        ys.push(sy + curvature*(geo.y[i] - sy));
    }
    return { x: xs, y: ys };
}

function hypTextPos(angle, depth) {
    if (depth === 0) return 'top center';
    var deg = ((angle * 180 / Math.PI) % 360 + 360) % 360;
    if (deg <  30 || deg > 330) return 'middle right';
    if (deg <  70)  return 'top right';
    if (deg < 110)  return 'top center';
    if (deg < 150)  return 'top left';
    if (deg < 210)  return 'middle left';
    if (deg < 250)  return 'bottom left';
    if (deg < 290)  return 'bottom center';
    return 'bottom right';
}

function renderHyperbolicEmbedding() {
    var plotDiv = document.getElementById('plot-poincare-disk');
    if (!plotDiv) { console.warn('Hyperbolic: plot div not found'); return; }

    // ── Lazy-build the tree if it hasn't been built yet ──
    if (!hyperbolicState.tree || hyperbolicState.tree.length === 0) {
        hyperbolicState.tree = buildHyperbolicTree();
    }
    var nodes = hyperbolicState.tree;
    if (!nodes || nodes.length === 0) {
        console.warn('Hyperbolic: tree is empty');
        return;
    }

    var slider = document.getElementById('poincare-curvature');
    var valEl  = document.getElementById('poincare-curvature-val');
    var curvature = (slider) ? parseFloat(slider.value) : 1.0;
    if (isNaN(curvature)) curvature = 1.0;
    hyperbolicState.curvature = curvature;

    if (valEl) {
        if      (curvature < 0.1)  valEl.textContent = 'Euclidean (flat)';
        else if (curvature < 0.35) valEl.textContent = 'Slightly curved';
        else if (curvature < 0.65) valEl.textContent = 'Moderately curved';
        else if (curvature < 0.9)  valEl.textContent = 'Strongly curved';
        else                       valEl.textContent = 'Hyperbolic';
    }

    var traces = [];

    // ASCII arrow for edge key matching (avoids Unicode copy-paste issues)
    var chainNames = { 'Entity':1, 'Animal':1, 'Mammal':1, 'Dog':1, 'Poodle':1 };
    var chainEdges = [
        ['Entity','Animal'], ['Animal','Mammal'],
        ['Mammal','Dog'],    ['Dog','Poodle']
    ];
    var chainEdgeKeys = {};
    chainEdges.forEach(function(e) { chainEdgeKeys[e[0] + '->' + e[1]] = true; });

    var depthColors = ['#1e293b','#8b5cf6','#6366f1','#3b82f6','#10b981'];
    var groupColors = { root: '#1e293b', animal: '#ef4444', object: '#6366f1' };

    // ── 1. Boundary circle ──
    if (curvature > 0.05) {
        var cX = [], cY = [];
        for (var i = 0; i <= 120; i++) {
            var a = (i/120) * 2 * Math.PI;
            cX.push(Math.cos(a));
            cY.push(Math.sin(a));
        }
        traces.push({
            type: 'scatter', x: cX, y: cY, mode: 'lines',
            line: { color: 'rgba(100,116,139,' + (0.15 + curvature*0.35).toFixed(2) + ')', width: 2 },
            showlegend: false, hoverinfo: 'skip'
        });
    }

    // ── 2. Depth rings ──
    for (var d = 1; d <= hyperbolicState.maxDepth; d++) {
        var r = getHyperbolicRadius(d, curvature);
        var rX = [], rY = [];
        for (var i = 0; i <= 90; i++) {
            var a = (i/90) * 2 * Math.PI;
            rX.push(r * Math.cos(a));
            rY.push(r * Math.sin(a));
        }
        traces.push({
            type: 'scatter', x: rX, y: rY, mode: 'lines',
            line: { color: 'rgba(203,213,225,0.35)', width: 1, dash: 'dot' },
            showlegend: false, hoverinfo: 'skip'
        });
        traces.push({
            type: 'scatter', x: [r + 0.04], y: [0],
            mode: 'text', text: ['d=' + d],
            textfont: { size: 9, color: 'rgba(148,163,184,0.7)' },
            showlegend: false, hoverinfo: 'skip'
        });
    }

    // ── 3. Normal edges (geodesics) ──
    nodes.forEach(function(node) {
        if (!node.parent) return;
        var edgeKey = node.parent + '->' + node.name;
        if (chainEdgeKeys[edgeKey]) return;

        var parent = null;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].name === node.parent) { parent = nodes[i]; break; }
        }
        if (!parent) return;

        var p1 = getHypNodePos(parent, curvature);
        var p2 = getHypNodePos(node, curvature);
        var path = getHypEdgePath(p1, p2, curvature);

        traces.push({
            type: 'scatter', x: path.x, y: path.y, mode: 'lines',
            line: { color: 'rgba(99,102,241,' + (0.15 + curvature*0.25).toFixed(2) + ')', width: 1.8 },
            showlegend: false, hoverinfo: 'skip'
        });
    });

    // ── 4. Chain edges (amber, thick) ──
    chainEdges.forEach(function(pair) {
        var pName = pair[0], cName = pair[1];
        var parentNode = null, childNode = null;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].name === pName) parentNode = nodes[i];
            if (nodes[i].name === cName) childNode = nodes[i];
        }
        if (!parentNode || !childNode) return;

        var p1 = getHypNodePos(parentNode, curvature);
        var p2 = getHypNodePos(childNode, curvature);
        var path = getHypEdgePath(p1, p2, curvature);

        traces.push({
            type: 'scatter', x: path.x, y: path.y, mode: 'lines',
            line: { color: '#f59e0b', width: 4 },
            showlegend: false,
            hovertemplate: '<b>' + pName + ' -> ' + cName + '</b><br>Depth ' + parentNode.depth + ' -> ' + childNode.depth + '<extra></extra>'
        });
    });

    // ── 5. Node points ──
    nodes.forEach(function(node) {
        var pos     = getHypNodePos(node, curvature);
        var hasChild = false;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].parent === node.name) { hasChild = true; break; }
        }
        var isLeaf  = !hasChild;
        var onChain = !!chainNames[node.name];
        var color   = onChain ? '#f59e0b' : (groupColors[node.group] || depthColors[node.depth] || '#64748b');
        var sz      = node.depth === 0 ? 15 : (onChain ? 11 : (isLeaf ? 6 : 9));
        var fSz     = node.depth === 0 ? 14 : (node.depth <= 2 ? 11 : (isLeaf ? 9 : 10));
        var rr      = Math.sqrt(pos[0]*pos[0] + pos[1]*pos[1]);

        var hoverStr = '<b>' + node.name + '</b><br>Depth: ' + node.depth +
                       '<br>Parent: ' + (node.parent || '(root)') +
                       '<br>Radius: ' + rr.toFixed(4);

        if (curvature > 0.4 && node.depth > 0) {
            var hd = poincareDistance([0,0], pos);
            if (isFinite(hd)) {
                hoverStr += '<br>Hyp dist to root: ' + hd.toFixed(2);
            }
        }
        hoverStr += '<extra></extra>';

        traces.push({
            type: 'scatter',
            x: [pos[0]], y: [pos[1]],
            mode: 'markers+text',
            text: [node.name],
            textposition: hypTextPos(node.angle || 0, node.depth),
            textfont: {
                size: fSz,
                color: onChain ? '#92400e' : (depthColors[Math.min(node.depth, 4)] || '#1e293b'),
                weight: (node.depth <= 1 || onChain) ? 'bold' : 'normal'
            },
            marker: {
                size: sz, color: color, opacity: 0.92,
                line: { width: onChain ? 2 : 1, color: onChain ? '#fbbf24' : '#fff' }
            },
            showlegend: false,
            hovertemplate: hoverStr
        });
    });

    // ── 6. Plotly render ──
    var pad = 1.22;
    Plotly.react(plotDiv, traces, {
        margin: { l: 20, r: 20, b: 20, t: 15 },
        showlegend: false,
        xaxis: {
            range: [-pad, pad], zeroline: false,
            showgrid: curvature < 0.25,
            gridcolor: '#f1f5f9', showticklabels: false,
            scaleanchor: 'y'
        },
        yaxis: {
            range: [-pad, pad], zeroline: false,
            showgrid: curvature < 0.25,
            gridcolor: '#f1f5f9', showticklabels: false
        },
        plot_bgcolor: '#fff'
    }, { displayModeBar: false, responsive: true });

    // ── 7. Stats panel ──
    var statsDiv = document.getElementById('poincare-stats');
    if (!statsDiv) return;

    renderHyperbolicStats(statsDiv, nodes, curvature, chainEdges, depthColors);
}

// Stats panel in its own function so an error here can't prevent the plot
function renderHyperbolicStats(statsDiv, nodes, curvature, chainEdges, depthColors) {
	try {
		var html = '';

		// Depth -> Radius table
		html += '<div style="font-family:sans-serif;font-size:0.82em;color:#475569;">';
		html += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:12px;">';
		html += '<div style="font-weight:bold;margin-bottom:8px;color:#1e293b;">Depth &rarr; Radius</div>';
		for (var d = 0; d <= hyperbolicState.maxDepth; d++) {
			var r = getHyperbolicRadius(d, curvature);
			var dc = depthColors[d] || '#1e293b';
			html += '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f1f5f9;">';
			html += '<span style="color:' + dc + ';">Depth ' + d + '</span>';
			html += '<span style="font-family:monospace;font-weight:bold;">r = ' + r.toFixed(4) + '</span>';
			html += '</div>';
		}
		if (curvature > 0.5) {
			html += '<div style="font-size:0.8em;color:#94a3b8;margin-top:6px;">Exponential compression &mdash; leaves cluster near r &rarr; 1</div>';
		} else if (curvature < 0.15) {
			html += '<div style="font-size:0.8em;color:#94a3b8;margin-top:6px;">Linear spacing &mdash; uniform depth intervals</div>';
		} else {
			html += '<div style="font-size:0.8em;color:#94a3b8;margin-top:6px;">Interpolating between linear and exponential</div>';
		}
		html += '</div>';

		// Chain distances
		if (curvature > 0.3) {
			html += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:12px;">';
			html += '<div style="font-weight:bold;margin-bottom:8px;color:#92400e;">&#x1F536; Highlighted Chain Distances</div>';
			var totalHyp = 0;
			chainEdges.forEach(function(pair) {
				var pNode = null, cNode = null;
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].name === pair[0]) pNode = nodes[i];
					if (nodes[i].name === pair[1]) cNode = nodes[i];
				}
				if (!pNode || !cNode) return;
				var p1 = getHypNodePos(pNode, curvature);
				var p2 = getHypNodePos(cNode, curvature);
				var hd = poincareDistance(p1, p2);
				var ed = Math.sqrt(Math.pow(p1[0]-p2[0],2) + Math.pow(p1[1]-p2[1],2));
				totalHyp += (isFinite(hd) ? hd : 0);
				html += '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f1f5f9;font-size:0.85em;">';
				html += '<span>' + pair[0] + ' &rarr; ' + pair[1] + '</span>';
				html += '<span style="font-family:monospace;"><span style="color:#f59e0b;font-weight:bold;">' + (isFinite(hd)?hd.toFixed(2):'&infin;') + '</span>';
				html += ' <span style="color:#94a3b8;">(euc: ' + ed.toFixed(3) + ')</span></span>';
				html += '</div>';
			});
			html += '<div style="display:flex;justify-content:space-between;padding:5px 0 0;font-size:0.85em;font-weight:bold;border-top:2px solid #fef3c7;">';
			html += '<span>Total path</span>';
			html += '<span style="color:#f59e0b;font-family:monospace;">' + totalHyp.toFixed(2) + '</span>';
			html += '</div></div>';
		}

		// Geometry summary
		html += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">';
		html += '<div style="font-weight:bold;margin-bottom:8px;color:#1e293b;">Geometry</div>';
		html += '<div style="font-size:0.85em;line-height:1.6;">';
		if (curvature > 0.5) {
			html += '<span style="color:#8b5cf6;">&#9679;</span> <b>Exponential</b> room near boundary<br>';
			html += '<span style="color:#8b5cf6;">&#9679;</span> Geodesics <b>curve inward</b><br>';
			html += '<span style="color:#8b5cf6;">&#9679;</span> Distance <b>explodes</b> near edge<br>';
			html += '<span style="color:#8b5cf6;">&#9679;</span> Trees embed with <b>low distortion</b>';
		} else {
			html += '<span style="color:#94a3b8;">&#9679;</span> Uniform polynomial spacing<br>';
			html += '<span style="color:#94a3b8;">&#9679;</span> Geodesics are straight lines<br>';
			html += '<span style="color:#94a3b8;">&#9679;</span> Polynomial volume growth<br>';
			html += '<span style="color:#ef4444;">&#9679;</span> <b>Leaf nodes crowd together</b>';
		}
		html += '</div></div></div>';

		statsDiv.innerHTML = html;
	} catch(e) {
		console.error('Hyperbolic stats error:', e);
		statsDiv.innerHTML = '<div style="color:#ef4444;padding:12px;">Stats rendering error &mdash; see console.</div>';
	}
}

// ============================================================
// LAZY LOADING FOR EMBEDDING MODULE
// ============================================================

const _embLazyRegistry = [];
let _embLazyObserver = null;

function _embLazyRegister(elementId, initFn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    _embLazyRegistry.push({ el, initFn, initialized: false });
}

function _embLazyCreateObserver() {
    if (_embLazyObserver) return;

    _embLazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const match = _embLazyRegistry.find(r => r.el === entry.target);
            if (match && !match.initialized) {
                match.initialized = true;
                _embLazyObserver.unobserve(match.el);
                match.initFn();
            }
        });
    }, {
        rootMargin: rootMargin
    });

    _embLazyRegistry.forEach(r => {
        if (!r.initialized) {
            _embLazyObserver.observe(r.el);
        }
    });
}

// ============================================================
// TOPOLOGY: CLUMPS AND BRANCHES — NARROW CONES VISUALIZATION
// ============================================================

const topologyConesState = {
    numPoints: 120,
    numCones: 5,
    level: 0,
    basePoints: [],
    coneAngles: []
};

function initTopologyCones() {
    const st = topologyConesState;
    st.basePoints = [];

    // Define cone center angles (evenly-ish spaced around the upper half)
    st.coneAngles = [];
    for (let i = 0; i < st.numCones; i++) {
        st.coneAngles.push((i / st.numCones) * 2 * Math.PI + 0.3);
    }

    // Assign each point to a random cone, with a random offset and magnitude
    for (let i = 0; i < st.numPoints; i++) {
        const coneIdx = Math.floor(Math.random() * st.numCones);
        st.basePoints.push({
            coneIdx: coneIdx,
            offsetAngle: (Math.random() - 0.5) * 2 * Math.PI, // full spread at level 0
            magnitude: 0.3 + Math.random() * 0.7
        });
    }
}

function getTopologyPoints(level) {
    const st = topologyConesState;
    const points = [];

    for (let i = 0; i < st.numPoints; i++) {
        const bp = st.basePoints[i];
        const coneCenter = st.coneAngles[bp.coneIdx];

        // At level 0: offset is the full random angle (uniform spread)
        // At level 1: offset is compressed tightly around the cone center
        const maxSpread = Math.PI; // full semicircle at level 0
        const compressedSpread = 0.08; // very narrow at level 1
        const currentSpread = maxSpread * (1 - level) + compressedSpread * level;

        // Normalize the offset to [-1, 1] range, then scale by current spread
        const normalizedOffset = bp.offsetAngle / (2 * Math.PI); // ~ [-0.5, 0.5]
        const finalAngle = coneCenter + normalizedOffset * currentSpread * 2;

        const x = bp.magnitude * Math.cos(finalAngle);
        const y = bp.magnitude * Math.sin(finalAngle);

        points.push({ x, y, angle: finalAngle, mag: bp.magnitude, cone: bp.coneIdx });
    }
    return points;
}

function renderTopologyCones() {
    const plotDiv = document.getElementById('plot-topology-cones');
    if (!plotDiv) return;

    const st = topologyConesState;
    const slider = document.getElementById('topology-dim-slider');
    const valEl = document.getElementById('topology-dim-val');
    const statsDiv = document.getElementById('topology-stats');

    st.level = parseFloat(slider.value);
    const pct = Math.round(st.level * 100);

    let tag;
    if (pct < 15) tag = 'Low (2D-like)';
    else if (pct < 40) tag = 'Moderate';
    else if (pct < 70) tag = 'High';
    else tag = 'Very High (768D-like)';
    valEl.textContent = tag;

    const points = getTopologyPoints(st.level);
    const traces = [];

    // --- 1. Unit circle reference ---
    const cX = [], cY = [];
    for (let i = 0; i <= 80; i++) {
        const a = (i / 80) * 2 * Math.PI;
        cX.push(Math.cos(a));
        cY.push(Math.sin(a));
    }
    traces.push({
        x: cX, y: cY, mode: 'lines',
        line: { color: 'rgba(203,213,225,0.3)', width: 1.5 },
        showlegend: false, hoverinfo: 'skip'
    });

    // --- 2. Empty void wedges (between cones, visible at higher levels) ---
    if (st.level > 0.15) {
        const maxSpread = Math.PI;
        const compressedSpread = 0.08;
        const currentSpread = maxSpread * (1 - st.level) + compressedSpread * st.level;
        const halfCone = currentSpread * 0.5;

        // Sort cone angles
        const sorted = [...st.coneAngles].sort((a, b) => a - b);

        for (let i = 0; i < sorted.length; i++) {
            const coneEnd = sorted[i] + halfCone;
            const nextConeStart = sorted[(i + 1) % sorted.length] - halfCone +
                (i === sorted.length - 1 ? 2 * Math.PI : 0);

            if (nextConeStart - coneEnd > 0.05) {
                const wX = [0], wY = [0];
                const steps = 30;
                for (let s = 0; s <= steps; s++) {
                    const a = coneEnd + (s / steps) * (nextConeStart - coneEnd);
                    wX.push(1.15 * Math.cos(a));
                    wY.push(1.15 * Math.sin(a));
                }
                wX.push(0); wY.push(0);
                traces.push({
                    x: wX, y: wY, mode: 'lines', fill: 'toself',
                    fillcolor: `rgba(148,163,184,${Math.min(st.level * 0.15, 0.12)})`,
                    line: { color: `rgba(148,163,184,${Math.min(st.level * 0.3, 0.25)})`, width: 1 },
                    showlegend: false, hoverinfo: 'skip'
                });
            }
        }
    }

    // --- 3. Cone highlight wedges ---
    if (st.level > 0.2) {
        const maxSpread = Math.PI;
        const compressedSpread = 0.08;
        const currentSpread = maxSpread * (1 - st.level) + compressedSpread * st.level;
        const coneColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

        st.coneAngles.forEach((center, idx) => {
            const half = currentSpread * 0.5;
            const wX = [0], wY = [0];
            for (let s = 0; s <= 20; s++) {
                const a = center - half + (s / 20) * 2 * half;
                wX.push(1.1 * Math.cos(a));
                wY.push(1.1 * Math.sin(a));
            }
            wX.push(0); wY.push(0);
            traces.push({
                x: wX, y: wY, mode: 'lines', fill: 'toself',
                fillcolor: coneColors[idx] + '10',
                line: { color: coneColors[idx] + '30', width: 1.5 },
                showlegend: false, hoverinfo: 'skip'
            });
        });
    }

    // --- 4. Point lines from origin + endpoints ---
    const coneColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    points.forEach(p => {
        traces.push({
            x: [0, p.x], y: [0, p.y], mode: 'lines',
            line: { color: `rgba(148,163,184,${0.15 + st.level * 0.2})`, width: 0.8 },
            showlegend: false, hoverinfo: 'skip'
        });
    });

    // Endpoints colored by cone
    const coneGroups = {};
    points.forEach(p => {
        if (!coneGroups[p.cone]) coneGroups[p.cone] = { x: [], y: [] };
        coneGroups[p.cone].x.push(p.x);
        coneGroups[p.cone].y.push(p.y);
    });

    Object.entries(coneGroups).forEach(([cone, data]) => {
        const color = coneColors[parseInt(cone) % coneColors.length];
        traces.push({
            x: data.x, y: data.y, mode: 'markers',
            marker: { size: 5, color: color, opacity: 0.8 },
            showlegend: false,
            hovertemplate: `Cone ${parseInt(cone) + 1}<extra></extra>`
        });
    });

    // --- 5. Origin ---
    traces.push({
        x: [0], y: [0], mode: 'markers',
        marker: { size: 6, color: '#1e293b' },
        showlegend: false, hoverinfo: 'skip'
    });

    Plotly.react(plotDiv, traces, {
        margin: { l: 30, r: 30, b: 30, t: 10 },
        showlegend: false,
        xaxis: {
            range: [-1.35, 1.35], zeroline: true, zerolinecolor: '#e2e8f0',
            showgrid: false, scaleanchor: 'y', showticklabels: false
        },
        yaxis: {
            range: [-1.35, 1.35], zeroline: true, zerolinecolor: '#e2e8f0',
            showgrid: false, showticklabels: false
        },
        plot_bgcolor: '#fff'
    }, { displayModeBar: false, responsive: true });

    // --- Stats ---
    if (statsDiv) {
        // Compute angular spread
        const angles = points.map(p => p.angle);
        const maxSpread = Math.PI;
        const compressedSpread = 0.08;
        const currentSpread = maxSpread * (1 - st.level) + compressedSpread * st.level;
        const occupiedFraction = Math.min(1, (st.numCones * currentSpread) / (2 * Math.PI));
        const voidFraction = 1 - occupiedFraction;

        statsDiv.innerHTML = `
            <div style="padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-size:0.8em; color:#64748b; margin-bottom:4px;">Occupied Fraction</div>
                <div style="font-size:1.5em; font-weight:bold; color:${occupiedFraction < 0.3 ? '#ef4444' : occupiedFraction < 0.7 ? '#f59e0b' : '#10b981'};">${(occupiedFraction * 100).toFixed(1)}%</div>
                <div style="font-size:0.75em; color:#94a3b8;">of angular space used</div>
            </div>
            <div style="padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-size:0.8em; color:#64748b; margin-bottom:4px;">Void Fraction</div>
                <div style="font-size:1.5em; font-weight:bold; color:${voidFraction > 0.7 ? '#ef4444' : voidFraction > 0.3 ? '#f59e0b' : '#10b981'};">${(voidFraction * 100).toFixed(1)}%</div>
                <div style="font-size:0.75em; color:#94a3b8;">semantic desert</div>
            </div>
            <div style="padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-size:0.8em; color:#64748b; margin-bottom:4px;">Cone Width</div>
                <div style="font-size:1.5em; font-weight:bold; color:#8b5cf6;">${(currentSpread * 180 / Math.PI).toFixed(1)}°</div>
                <div style="font-size:0.75em; color:#94a3b8;">per cluster</div>
            </div>
        `;
    }
}

// ============================================================
// SEMANTIC FOLDING & FRACTAL SELF-SIMILARITY
// ============================================================

const fractalFoldingState = {
    zoom: 1.0,
    showAxes: true,
    showHulls: true
};

/*
 * Data: a 3-level hierarchy.
 * Level 1 (coarse): Animal classes      — Mammal, Bird, Reptile
 * Level 2 (mid):    Species within class — Dog, Cat, Lion, Eagle, …
 * Level 3 (fine):   Breeds / variants    — Poodle, Retriever, Tabby, …
 *
 * Each node stores a "coarse" position (where it appears when collapsed)
 * and an "unfolded" offset (where it drifts to when its level is revealed).
 * The key insight: the offset pattern at Level 3 mirrors Level 2,
 * which mirrors Level 1 — scaled down each time.
 */

const fractalTree = {
    // ── Level 1 clusters ──
    classes: [
        {
            name: 'Mammal', color: '#ef4444', pos: [-4, 2],
            // Distinction axes at this level (drawn as arrows from the cluster center)
            axes: [
                { label: 'Size', dir: [1.8, 0] },
                { label: 'Domestic', dir: [0, 1.5] }
            ],
            species: [
                {
                    name: 'Dog', pos: [-1.5, 1.2], color: '#f97316',
                    axes: [
                        { label: 'size', dir: [0.7, 0] },
                        { label: 'domestic', dir: [0, 0.55] }
                    ],
                    breeds: [
                        { name: 'Poodle',    offset: [-0.4,  0.35] },
                        { name: 'Retriever', offset: [ 0.45, 0.25] },
                        { name: 'Wolf-dog',  offset: [ 0.3, -0.4]  },
                        { name: 'Chihuahua', offset: [-0.5, 0.1]   },
                    ]
                },
                {
                    name: 'Cat', pos: [-0.5, -0.8], color: '#fb923c',
                    axes: [
                        { label: 'size', dir: [0.6, 0] },
                        { label: 'domestic', dir: [0, 0.5] }
                    ],
                    breeds: [
                        { name: 'Tabby',   offset: [-0.25,  0.3] },
                        { name: 'Siamese', offset: [ 0.3,   0.25] },
                        { name: 'Persian', offset: [-0.35, -0.15] },
                    ]
                },
                {
                    name: 'Lion', pos: [1.8, -0.3], color: '#dc2626',
                    axes: [
                        { label: 'size', dir: [0.5, 0] },
                        { label: 'wild', dir: [0, -0.45] }
                    ],
                    breeds: [
                        { name: 'Asiatic',     offset: [-0.3, -0.2] },
                        { name: 'African',     offset: [ 0.35, -0.15] },
                        { name: 'Barbary',     offset: [ 0.0,   0.3] },
                    ]
                },
            ]
        },
        {
            name: 'Bird', color: '#3b82f6', pos: [5, 3],
            axes: [
                { label: 'Size', dir: [1.5, 0] },
                { label: 'Flight', dir: [0, 1.3] }
            ],
            species: [
                {
                    name: 'Eagle', pos: [1.2, 0.8], color: '#2563eb',
                    axes: [
                        { label: 'size', dir: [0.55, 0] },
                        { label: 'range', dir: [0, 0.45] }
                    ],
                    breeds: [
                        { name: 'Bald',   offset: [ 0.3,  0.2] },
                        { name: 'Golden', offset: [-0.25, 0.25] },
                        { name: 'Harpy',  offset: [ 0.1, -0.35] },
                    ]
                },
                {
                    name: 'Sparrow', pos: [-1.0, -0.5], color: '#60a5fa',
                    axes: [
                        { label: 'size', dir: [0.45, 0] },
                        { label: 'habitat', dir: [0, 0.4] }
                    ],
                    breeds: [
                        { name: 'House',  offset: [-0.2,  0.25] },
                        { name: 'Tree',   offset: [ 0.25, 0.15] },
                        { name: 'Song',   offset: [ 0.0, -0.3]  },
                    ]
                },
            ]
        },
        {
            name: 'Reptile', color: '#10b981', pos: [0, -5],
            axes: [
                { label: 'Size', dir: [1.6, 0] },
                { label: 'Venom', dir: [0, -1.3] }
            ],
            species: [
                {
                    name: 'Snake', pos: [-1.0, -0.6], color: '#059669',
                    axes: [
                        { label: 'size', dir: [0.5, 0] },
                        { label: 'venom', dir: [0, -0.45] }
                    ],
                    breeds: [
                        { name: 'Cobra',  offset: [ 0.1, -0.35] },
                        { name: 'Python', offset: [ 0.35, 0.2] },
                        { name: 'Garter', offset: [-0.3,  0.2] },
                    ]
                },
                {
                    name: 'Lizard', pos: [1.2, 0.4], color: '#34d399',
                    axes: [
                        { label: 'size', dir: [0.5, 0] },
                        { label: 'habitat', dir: [0, 0.4] }
                    ],
                    breeds: [
                        { name: 'Gecko',   offset: [-0.25, 0.2] },
                        { name: 'Komodo',  offset: [ 0.35, -0.15] },
                        { name: 'Iguana',  offset: [ 0.0,  0.3] },
                    ]
                },
            ]
        }
    ]
};

function renderFractalFolding() {
    const plotDiv = document.getElementById('plot-fractal-folding');
    if (!plotDiv) return;

    const slider = document.getElementById('fractal-zoom-slider');
    const valEl = document.getElementById('fractal-zoom-val');
    const statsDiv = document.getElementById('fractal-stats');
    const showAxesCb = document.getElementById('fractal-show-axes');
    const showHullsCb = document.getElementById('fractal-show-hulls');

    const zoom = parseFloat(slider.value);
    fractalFoldingState.zoom = zoom;
    fractalFoldingState.showAxes = showAxesCb ? showAxesCb.checked : true;
    fractalFoldingState.showHulls = showHullsCb ? showHullsCb.checked : true;

    // Zoom phases:
    //   1.0 → 2.0 : Level 1 → Level 2 (species unfold from class centers)
    //   2.0 → 3.0 : Level 2 → Level 3 (breeds unfold from species centers)
    const t12 = Math.max(0, Math.min(1, zoom - 1));  // 0 at zoom=1, 1 at zoom=2
    const t23 = Math.max(0, Math.min(1, zoom - 2));  // 0 at zoom=2, 1 at zoom=3

    // Label
    if (zoom < 1.5) valEl.textContent = 'Level 1 — Animal Classes';
    else if (zoom < 2.5) valEl.textContent = 'Level 2 — Species';
    else valEl.textContent = 'Level 3 — Breeds / Variants';

    const traces = [];
    const annotations = [];

    // Easing
    function ease(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    const et12 = ease(t12);
    const et23 = ease(t23);

    // Collect all rendered points for auto-ranging
    const allX = [], allY = [];

    // Scale factor: as we zoom in, the camera "magnifies" — we keep coordinates
    // but the visual effect is that sub-structures spread apart.
    // We achieve this by scaling the species/breed offsets by the zoom factor.
    const speciesScale = 1.0 + et12 * 2.5;  // species spread out
    const breedScale = 1.0 + et23 * 2.0;    // breeds spread out

    let totalNodes = 0;
    let visibleLevels = 1;
    if (t12 > 0.05) visibleLevels = 2;
    if (t23 > 0.05) visibleLevels = 3;

    fractalTree.classes.forEach(cls => {
        const cx = cls.pos[0];
        const cy = cls.pos[1];

        // ── Level 1: Class nodes ──
        const classOpacity = 1.0 - et12 * 0.4; // fade slightly as species appear
        const classSize = 18 - et12 * 6;

        traces.push({
            x: [cx], y: [cy],
            mode: 'markers+text',
            text: [cls.name],
            textposition: 'top center',
            textfont: { size: 14 - et12 * 2, color: cls.color, weight: 'bold' },
            marker: {
                size: classSize, color: cls.color,
                opacity: classOpacity,
                line: { width: 2, color: '#fff' }
            },
            showlegend: false,
            hovertemplate: `<b>${cls.name}</b><br>Level 1 — Class<extra></extra>`
        });
        allX.push(cx); allY.push(cy);
        totalNodes++;

        // ── Class-level distinction axes ──
        if (fractalFoldingState.showAxes && et12 < 0.8) {
            const axisOpacity = Math.max(0, 1 - et12 * 1.5);
            cls.axes.forEach(ax => {
                annotations.push({
                    ax: cx - ax.dir[0], ay: cy - ax.dir[1],
                    x: cx + ax.dir[0], y: cy + ax.dir[1],
                    axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
                    showarrow: true,
                    arrowhead: 2, arrowsize: 1, arrowwidth: 2,
                    arrowcolor: `rgba(139,92,246,${(axisOpacity * 0.5).toFixed(2)})`,
                    opacity: axisOpacity
                });
                annotations.push({
                    x: cx + ax.dir[0] * 1.15,
                    y: cy + ax.dir[1] * 1.15,
                    text: `<i>${ax.label}</i>`,
                    showarrow: false,
                    font: { size: 9, color: `rgba(139,92,246,${(axisOpacity * 0.7).toFixed(2)})` },
                    opacity: axisOpacity
                });
            });
        }

        // ── Class-level hull ──
        if (fractalFoldingState.showHulls && et12 > 0.1) {
            const hullR = 2.5 * speciesScale * 0.45;
            const hullSteps = 40;
            const hX = [], hY = [];
            for (let i = 0; i <= hullSteps; i++) {
                const a = (i / hullSteps) * 2 * Math.PI;
                hX.push(cx + hullR * Math.cos(a));
                hY.push(cy + hullR * 0.8 * Math.sin(a));
            }
            traces.push({
                x: hX, y: hY,
                mode: 'lines', fill: 'toself',
                fillcolor: cls.color + '08',
                line: { color: cls.color + '25', width: 1.5, dash: 'dot' },
                showlegend: false, hoverinfo: 'skip'
            });
        }

        // ── Level 2: Species ──
        if (et12 > 0.01) {
            cls.species.forEach(sp => {
                const sx = cx + sp.pos[0] * speciesScale * 0.6;
                const sy = cy + sp.pos[1] * speciesScale * 0.6;

                const spOpacity = et12 * (1 - et23 * 0.3);
                const spSize = 6 + et12 * 6 - et23 * 2;

                // Line from class center to species
                traces.push({
                    x: [cx, sx], y: [cy, sy],
                    mode: 'lines',
                    line: { color: cls.color + '30', width: 1.5 },
                    showlegend: false, hoverinfo: 'skip'
                });

                traces.push({
                    x: [sx], y: [sy],
                    mode: 'markers+text',
                    text: [sp.name],
                    textposition: 'top center',
                    textfont: { size: 11, color: sp.color, weight: 'bold' },
                    marker: {
                        size: spSize, color: sp.color,
                        opacity: spOpacity,
                        line: { width: 1, color: '#fff' }
                    },
                    showlegend: false,
                    hovertemplate: `<b>${sp.name}</b><br>Level 2 — Species<br>Parent: ${cls.name}<extra></extra>`
                });
                allX.push(sx); allY.push(sy);
                totalNodes++;

                // ── Species-level distinction axes (smaller copies!) ──
                if (fractalFoldingState.showAxes && et12 > 0.3 && et23 < 0.8) {
                    const axisOpacity2 = Math.min(1, (et12 - 0.3) / 0.5) * Math.max(0, 1 - et23 * 1.5);
                    sp.axes.forEach(ax => {
                        const scaledDir = [ax.dir[0] * speciesScale * 0.5, ax.dir[1] * speciesScale * 0.5];
                        annotations.push({
                            ax: sx - scaledDir[0], ay: sy - scaledDir[1],
                            x: sx + scaledDir[0], y: sy + scaledDir[1],
                            axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
                            showarrow: true,
                            arrowhead: 2, arrowsize: 1, arrowwidth: 1.5,
                            arrowcolor: `rgba(139,92,246,${(axisOpacity2 * 0.4).toFixed(2)})`,
                            opacity: axisOpacity2
                        });
                        annotations.push({
                            x: sx + scaledDir[0] * 1.2,
                            y: sy + scaledDir[1] * 1.2,
                            text: `<i>${ax.label}</i>`,
                            showarrow: false,
                            font: { size: 8, color: `rgba(139,92,246,${(axisOpacity2 * 0.6).toFixed(2)})` },
                            opacity: axisOpacity2
                        });
                    });
                }

                // ── Species-level hull ──
                if (fractalFoldingState.showHulls && et23 > 0.1) {
                    const hullR2 = 1.2 * breedScale * 0.4;
                    const hX2 = [], hY2 = [];
                    for (let i = 0; i <= 30; i++) {
                        const a = (i / 30) * 2 * Math.PI;
                        hX2.push(sx + hullR2 * Math.cos(a));
                        hY2.push(sy + hullR2 * 0.8 * Math.sin(a));
                    }
                    traces.push({
                        x: hX2, y: hY2,
                        mode: 'lines', fill: 'toself',
                        fillcolor: sp.color + '08',
                        line: { color: sp.color + '20', width: 1, dash: 'dot' },
                        showlegend: false, hoverinfo: 'skip'
                    });
                }

                // ── Level 3: Breeds ──
                if (et23 > 0.01) {
                    sp.breeds.forEach(br => {
                        const bx = sx + br.offset[0] * breedScale;
                        const by = sy + br.offset[1] * breedScale;

                        const brOpacity = et23;
                        const brSize = 3 + et23 * 5;

                        // Line from species to breed
                        traces.push({
                            x: [sx, bx], y: [sy, by],
                            mode: 'lines',
                            line: { color: sp.color + '25', width: 1 },
                            showlegend: false, hoverinfo: 'skip'
                        });

                        traces.push({
                            x: [bx], y: [by],
                            mode: 'markers+text',
                            text: [br.name],
                            textposition: 'bottom center',
                            textfont: { size: 9, color: sp.color },
                            marker: {
                                size: brSize, color: sp.color,
                                opacity: brOpacity,
                                symbol: 'diamond',
                                line: { width: 1, color: '#fff' }
                            },
                            showlegend: false,
                            hovertemplate: `<b>${br.name}</b><br>Level 3 — Breed/Variant<br>Parent: ${sp.name}<extra></extra>`
                        });
                        allX.push(bx); allY.push(by);
                        totalNodes++;
                    });
                }
            });
        }
    });

    // ── Auto-range with padding ──
    const padFrac = 0.15;
    let xMin = Math.min(...allX), xMax = Math.max(...allX);
    let yMin = Math.min(...allY), yMax = Math.max(...allY);
    const xPad = (xMax - xMin) * padFrac + 1;
    const yPad = (yMax - yMin) * padFrac + 1;

    const layout = {
        margin: { l: 30, r: 30, b: 30, t: 10 },
        showlegend: false,
        xaxis: {
            range: [xMin - xPad, xMax + xPad],
            zeroline: false, showgrid: true, gridcolor: '#f1f5f9',
            showticklabels: false, scaleanchor: 'y'
        },
        yaxis: {
            range: [yMin - yPad, yMax + yPad],
            zeroline: false, showgrid: true, gridcolor: '#f1f5f9',
            showticklabels: false
        },
        annotations: annotations,
        plot_bgcolor: '#fff'
    };

    Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });

    // ── Stats ──
    if (statsDiv) {
        const scaleLabel = zoom < 1.5 ? '1.0× (full view)' :
                           zoom < 2.5 ? `${speciesScale.toFixed(1)}× (species)` :
                                        `${(speciesScale * breedScale * 0.5).toFixed(1)}× (breeds)`;
        statsDiv.innerHTML = `
            <div style="padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-size:0.8em; color:#64748b; margin-bottom:4px;">Visible Levels</div>
                <div style="font-size:1.5em; font-weight:bold; color:#8b5cf6;">${visibleLevels} / 3</div>
                <div style="font-size:0.75em; color:#94a3b8;">hierarchy depth</div>
            </div>
            <div style="padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-size:0.8em; color:#64748b; margin-bottom:4px;">Visible Nodes</div>
                <div style="font-size:1.5em; font-weight:bold; color:#3b82f6;">${totalNodes}</div>
                <div style="font-size:0.75em; color:#94a3b8;">concepts rendered</div>
            </div>
            <div style="padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-size:0.8em; color:#64748b; margin-bottom:4px;">Spatial Scale</div>
                <div style="font-size:1.5em; font-weight:bold; color:#10b981;">${scaleLabel}</div>
                <div style="font-size:0.75em; color:#94a3b8;">magnification</div>
            </div>
        `;
    }
}

// ============================================================
// HOLOGRAPHIC INFORMATION STORAGE
// ============================================================

const holographicState = {
    numDims: 64,       // simulated embedding dimensionality
    damage: 0,         // fraction of dimensions zeroed out
    showGhost: true,
    damageMask: null,   // boolean array: true = surviving, false = zeroed
    concepts: [],       // will be populated in init
    initialized: false
};

function initHolographic() {
    const st = holographicState;
    if (st.initialized) return;

    const D = st.numDims;

    // Define concepts with semantic groups.
    // Each concept gets a random-ish vector, but concepts in the same group
    // share a "group direction" component so they cluster together.
    const conceptDefs = [
        { name: 'Dog',       group: 'animal',     color: '#ef4444' },
        { name: 'Cat',       group: 'animal',     color: '#ef4444' },
        { name: 'Wolf',      group: 'animal',     color: '#ef4444' },
        { name: 'Eagle',     group: 'animal',     color: '#ef4444' },
        { name: 'Car',       group: 'machine',    color: '#6366f1' },
        { name: 'Plane',     group: 'machine',    color: '#6366f1' },
        { name: 'Robot',     group: 'machine',    color: '#6366f1' },
        { name: 'Guitar',    group: 'music',      color: '#ec4899' },
        { name: 'Piano',     group: 'music',      color: '#ec4899' },
        { name: 'Drum',      group: 'music',      color: '#ec4899' },
        { name: 'River',     group: 'nature',     color: '#14b8a6' },
        { name: 'Mountain',  group: 'nature',     color: '#14b8a6' },
        { name: 'Ocean',     group: 'nature',     color: '#14b8a6' },
    ];

    // Generate group direction vectors (random unit-ish vectors)
    const groups = {};
    const uniqueGroups = [...new Set(conceptDefs.map(c => c.group))];
    uniqueGroups.forEach(g => {
        const v = [];
        for (let i = 0; i < D; i++) v.push((Math.random() - 0.5) * 2);
        // Normalize
        const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
        groups[g] = v.map(x => x / mag);
    });

    // Each concept = groupDirection * groupWeight + noise
    st.concepts = conceptDefs.map(def => {
        const groupDir = groups[def.group];
        const groupWeight = 3.0;
        const noiseWeight = 1.0;
        const vec = [];
        for (let i = 0; i < D; i++) {
            vec.push(groupDir[i] * groupWeight + (Math.random() - 0.5) * noiseWeight);
        }
        return { name: def.name, group: def.group, color: def.color, vec };
    });

    // Initialize damage mask (all surviving)
    st.damageMask = new Array(D).fill(true);
    st.initialized = true;
}

function generateDamageMask(damageFraction) {
    const st = holographicState;
    const D = st.numDims;
    const numDamaged = Math.round(damageFraction * D);

    // Create array of indices, shuffle, pick first numDamaged to zero out
    const indices = Array.from({ length: D }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = D - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const mask = new Array(D).fill(true);
    for (let i = 0; i < numDamaged; i++) {
        mask[indices[i]] = false;
    }
    st.damageMask = mask;
}

function applyDamage(vec, mask) {
    return vec.map((v, i) => mask[i] ? v : 0);
}

function cosineSim(a, b) {
    let dot = 0, ma = 0, mb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        ma += a[i] * a[i];
        mb += b[i] * b[i];
    }
    ma = Math.sqrt(ma);
    mb = Math.sqrt(mb);
    if (ma < 1e-10 || mb < 1e-10) return 0;
    return dot / (ma * mb);
}

// Simple 2D projection via the first two principal-ish axes
// (we use the first two group directions as projection axes for stability)
function project2D(vec, axis1, axis2) {
    let x = 0, y = 0;
    for (let i = 0; i < vec.length; i++) {
        x += vec[i] * axis1[i];
        y += vec[i] * axis2[i];
    }
    return [x, y];
}

window.rerollHolographicDamage = function () {
    const st = holographicState;
    generateDamageMask(st.damage);
    renderHolographic();
};

function renderHolographic() {
    const scatterDiv = document.getElementById('plot-holographic-scatter');
    const matrixDiv = document.getElementById('plot-holographic-matrix');
    const statsDiv = document.getElementById('holographic-stats');
    if (!scatterDiv || !matrixDiv) return;

    const st = holographicState;
    const slider = document.getElementById('holographic-damage');
    const valEl = document.getElementById('holographic-damage-val');
    const ghostCb = document.getElementById('holographic-show-ghost');

    st.damage = parseFloat(slider.value);
    st.showGhost = ghostCb ? ghostCb.checked : true;

    const pct = Math.round(st.damage * 100);
    let tag = `${pct}%`;
    if (pct === 0) tag += ' (intact)';
    else if (pct < 25) tag += ' (minor)';
    else if (pct < 50) tag += ' (moderate)';
    else if (pct < 75) tag += ' (severe)';
    else tag += ' (catastrophic)';
    valEl.textContent = tag;

    // Regenerate damage mask if damage level changed
    generateDamageMask(st.damage);

    const concepts = st.concepts;
    const mask = st.damageMask;
    const D = st.numDims;

    // Compute damaged vectors
    const damagedVecs = concepts.map(c => applyDamage(c.vec, mask));

    // Projection axes: use first two unique group directions
    // (recompute from the concept data for stability)
    const groups = {};
    concepts.forEach(c => {
        if (!groups[c.group]) groups[c.group] = [];
        groups[c.group].push(c.vec);
    });
    const groupNames = Object.keys(groups);
    // Average vector per group as axis
    function avgVec(vecs) {
        const avg = new Array(D).fill(0);
        vecs.forEach(v => v.forEach((x, i) => avg[i] += x));
        const n = vecs.length;
        const mag = Math.sqrt(avg.reduce((s, x) => s + (x / n) * (x / n), 0));
        return avg.map(x => x / (n * mag));
    }
    const axis1 = avgVec(groups[groupNames[0]]);
    const axis2 = avgVec(groups[groupNames[1]]);

    // ── LEFT: Scatter plot ──
    const scatterTraces = [];

    // Ghost (original) positions
    if (st.showGhost && st.damage > 0.01) {
        const gx = [], gy = [], gt = [], gc = [];
        concepts.forEach(c => {
            const [px, py] = project2D(c.vec, axis1, axis2);
            gx.push(px); gy.push(py); gt.push(c.name); gc.push(c.color);
        });
        scatterTraces.push({
            x: gx, y: gy, mode: 'markers+text',
            text: gt, textposition: 'top center',
            textfont: { size: 9, color: 'rgba(148,163,184,0.4)' },
            marker: { size: 8, color: gc, opacity: 0.15 },
            showlegend: false, hoverinfo: 'skip'
        });

        // Drift lines from ghost to damaged
        concepts.forEach((c, i) => {
            const [ox, oy] = project2D(c.vec, axis1, axis2);
            const [dx, dy] = project2D(damagedVecs[i], axis1, axis2);
            scatterTraces.push({
                x: [ox, dx], y: [oy, dy], mode: 'lines',
                line: { color: 'rgba(148,163,184,0.25)', width: 1, dash: 'dot' },
                showlegend: false, hoverinfo: 'skip'
            });
        });
    }

    // Damaged positions
    const groupTraces = {};
    concepts.forEach((c, i) => {
        if (!groupTraces[c.group]) {
            groupTraces[c.group] = { x: [], y: [], text: [], color: c.color, name: c.group };
        }
        const [px, py] = project2D(damagedVecs[i], axis1, axis2);
        groupTraces[c.group].x.push(px);
        groupTraces[c.group].y.push(py);
        groupTraces[c.group].text.push(c.name);
    });

    const groupEmoji = { animal: '🐾', machine: '⚙️', music: '🎵', nature: '🌿' };
    Object.values(groupTraces).forEach(g => {
        scatterTraces.push({
            x: g.x, y: g.y, mode: 'markers+text',
            text: g.text, textposition: 'top center',
            textfont: { size: 11, color: g.color, weight: 'bold' },
            marker: { size: 11, color: g.color, opacity: 0.9, line: { width: 1, color: '#fff' } },
            name: (groupEmoji[g.name] || '') + ' ' + g.name.charAt(0).toUpperCase() + g.name.slice(1),
            hovertemplate: '<b>%{text}</b><br>Group: ' + g.name + '<extra></extra>'
        });
    });

    Plotly.react(scatterDiv, scatterTraces, {
        margin: { l: 25, r: 25, b: 25, t: 35 },
        showlegend: true,
        legend: { x: 0.01, y: 0.99, bgcolor: 'rgba(255,255,255,0.9)', bordercolor: '#e2e8f0', borderwidth: 1, font: { size: 10 } },
        xaxis: { zeroline: false, showgrid: true, gridcolor: '#f1f5f9', showticklabels: false },
        yaxis: { zeroline: false, showgrid: true, gridcolor: '#f1f5f9', showticklabels: false, scaleanchor: 'x' },
        plot_bgcolor: '#fff',
        title: { text: 'Concept Positions (2D projection)', font: { size: 12, color: '#64748b' } }
    }, { displayModeBar: false, responsive: true });

    // ── RIGHT: Similarity matrix (heatmap) ──
    const N = concepts.length;
    const simMatrix = [];
    const labels = concepts.map(c => c.name);

    for (let i = 0; i < N; i++) {
        const row = [];
        for (let j = 0; j < N; j++) {
            row.push(cosineSim(damagedVecs[i], damagedVecs[j]));
        }
        simMatrix.push(row);
    }

    // Also compute original similarity matrix for comparison
    const origMatrix = [];
    for (let i = 0; i < N; i++) {
        const row = [];
        for (let j = 0; j < N; j++) {
            row.push(cosineSim(concepts[i].vec, concepts[j].vec));
        }
        origMatrix.push(row);
    }

    // Compute matrix correlation (Pearson between flattened upper triangles)
    const origFlat = [], damFlat = [];
    for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
            origFlat.push(origMatrix[i][j]);
            damFlat.push(simMatrix[i][j]);
        }
    }
    const meanO = origFlat.reduce((a, b) => a + b, 0) / origFlat.length;
    const meanD = damFlat.reduce((a, b) => a + b, 0) / damFlat.length;
    let num = 0, denO = 0, denD = 0;
    for (let i = 0; i < origFlat.length; i++) {
        const dO = origFlat[i] - meanO;
        const dD = damFlat[i] - meanD;
        num += dO * dD;
        denO += dO * dO;
        denD += dD * dD;
    }
    const matrixCorrelation = (denO > 0 && denD > 0) ? num / (Math.sqrt(denO) * Math.sqrt(denD)) : 1;

    Plotly.react(matrixDiv, [{
        z: simMatrix,
        x: labels, y: labels,
        type: 'heatmap',
        colorscale: [
            [0, '#1e3a5f'],
            [0.3, '#3b82f6'],
            [0.5, '#93c5fd'],
            [0.7, '#fbbf24'],
            [1, '#ef4444']
        ],
        zmin: -0.3, zmax: 1.0,
        hovertemplate: '<b>%{y} ↔ %{x}</b><br>Cosine Sim: %{z:.3f}<extra></extra>'
    }], {
        margin: { l: 70, r: 20, b: 70, t: 35 },
        xaxis: { tickangle: -45, tickfont: { size: 9 } },
        yaxis: { tickfont: { size: 9 }, autorange: 'reversed' },
        plot_bgcolor: '#fff',
        title: { text: 'Pairwise Cosine Similarity', font: { size: 12, color: '#64748b' } }
    }, { displayModeBar: false, responsive: true });

    // ── Stats ──
    if (statsDiv) {
        const surviving = mask.filter(m => m).length;
        const theoreticalSignal = Math.sqrt(surviving / D);
        const corrColor = matrixCorrelation > 0.9 ? '#10b981' :
            matrixCorrelation > 0.7 ? '#f59e0b' : '#ef4444';

        statsDiv.innerHTML = `
            <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Surviving Dims</div>
                <div style="font-size:1.4em; font-weight:bold; color:#3b82f6;">${surviving} / ${D}</div>
                <div style="font-size:0.7em; color:#94a3b8;">${(surviving / D * 100).toFixed(0)}% intact</div>
            </div>
            <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Signal Quality</div>
                <div style="font-size:1.4em; font-weight:bold; color:${theoreticalSignal > 0.7 ? '#10b981' : theoreticalSignal > 0.4 ? '#f59e0b' : '#ef4444'};">${(theoreticalSignal * 100).toFixed(1)}%</div>
                <div style="font-size:0.7em; color:#94a3b8;">√(k/d) theoretical</div>
            </div>
            <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
                <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Structure Preserved</div>
                <div style="font-size:1.4em; font-weight:bold; color:${corrColor};">${(matrixCorrelation * 100).toFixed(1)}%</div>
                <div style="font-size:0.7em; color:#94a3b8;">matrix correlation</div>
            </div>
            <div style="padding:10px; background:#fff; border-radius:8px; border:${matrixCorrelation > 0.85 ? '1px solid #bbf7d0' : '2px solid #fecaca'}; text-align:center;">
                <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Verdict</div>
                <div style="font-size:1.0em; font-weight:bold; color:${matrixCorrelation > 0.85 ? '#10b981' : matrixCorrelation > 0.6 ? '#f59e0b' : '#ef4444'};">${
                    matrixCorrelation > 0.95 ? '✅ Intact' :
                    matrixCorrelation > 0.85 ? '✅ Degraded' :
                    matrixCorrelation > 0.6  ? '⚠️ Noisy' :
                                               '❌ Broken'
                }</div>
                <div style="font-size:0.7em; color:#94a3b8;">holographic resilience</div>
            </div>
        `;
    }
}

// ============================================================
// VORONOI CELLS: THE TERRITORIES OF MEANING
// ============================================================

const voronoiState = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    seeds: [],
    dragging: null,
    clickPoint: null,
    presets: {
        animals: [
            { name: 'Dog',    x: 0.30, y: 0.35, color: '#ef4444', group: 'pet' },
            { name: 'Cat',    x: 0.38, y: 0.28, color: '#f97316', group: 'pet' },
            { name: 'Fish',   x: 0.45, y: 0.50, color: '#06b6d4', group: 'pet' },
            { name: 'Wolf',   x: 0.22, y: 0.42, color: '#dc2626', group: 'wild' },
            { name: 'Lion',   x: 0.18, y: 0.55, color: '#b91c1c', group: 'wild' },
            { name: 'Eagle',  x: 0.55, y: 0.20, color: '#8b5cf6', group: 'bird' },
            { name: 'Parrot', x: 0.62, y: 0.30, color: '#a78bfa', group: 'bird' },
            { name: 'Snake',  x: 0.70, y: 0.60, color: '#10b981', group: 'reptile' },
            { name: 'Lizard', x: 0.75, y: 0.50, color: '#34d399', group: 'reptile' },
            { name: 'Whale',  x: 0.50, y: 0.72, color: '#3b82f6', group: 'marine' },
            { name: 'Shark',  x: 0.58, y: 0.78, color: '#2563eb', group: 'marine' },
        ],
        emotions: [
            { name: 'Happy',      x: 0.30, y: 0.25, color: '#facc15', group: 'positive' },
            { name: 'Joyful',     x: 0.35, y: 0.20, color: '#fbbf24', group: 'positive' },
            { name: 'Excited',    x: 0.25, y: 0.30, color: '#f59e0b', group: 'positive' },
            { name: 'Content',    x: 0.40, y: 0.30, color: '#eab308', group: 'positive' },
            { name: 'Sad',        x: 0.65, y: 0.70, color: '#3b82f6', group: 'negative' },
            { name: 'Melancholy', x: 0.70, y: 0.65, color: '#6366f1', group: 'negative' },
            { name: 'Angry',      x: 0.75, y: 0.30, color: '#ef4444', group: 'intense' },
            { name: 'Furious',    x: 0.80, y: 0.25, color: '#dc2626', group: 'intense' },
            { name: 'Calm',       x: 0.45, y: 0.55, color: '#10b981', group: 'neutral' },
            { name: 'Neutral',    x: 0.50, y: 0.50, color: '#64748b', group: 'neutral' },
            { name: 'Fearful',    x: 0.60, y: 0.40, color: '#8b5cf6', group: 'negative' },
        ],
        code: [
            { name: 'function', x: 0.25, y: 0.30, color: '#3b82f6', group: 'keyword' },
            { name: 'return',   x: 0.30, y: 0.38, color: '#6366f1', group: 'keyword' },
            { name: 'const',    x: 0.20, y: 0.25, color: '#2563eb', group: 'keyword' },
            { name: 'if',       x: 0.35, y: 0.22, color: '#8b5cf6', group: 'control' },
            { name: 'else',     x: 0.40, y: 0.28, color: '#a78bfa', group: 'control' },
            { name: 'for',      x: 0.42, y: 0.18, color: '#7c3aed', group: 'control' },
            { name: 'while',    x: 0.48, y: 0.22, color: '#9333ea', group: 'control' },
            { name: '(',        x: 0.60, y: 0.55, color: '#f59e0b', group: 'syntax' },
            { name: ')',        x: 0.65, y: 0.55, color: '#eab308', group: 'syntax' },
            { name: '{',        x: 0.60, y: 0.65, color: '#f97316', group: 'syntax' },
            { name: '}',        x: 0.65, y: 0.65, color: '#ea580c', group: 'syntax' },
            { name: 'Array',    x: 0.75, y: 0.35, color: '#10b981', group: 'type' },
            { name: 'String',   x: 0.78, y: 0.45, color: '#14b8a6', group: 'type' },
        ],
        mixed: [
            { name: 'Dog',      x: 0.15, y: 0.20, color: '#ef4444', group: 'animal' },
            { name: 'Cat',      x: 0.22, y: 0.25, color: '#f97316', group: 'animal' },
            { name: 'Piano',    x: 0.50, y: 0.18, color: '#ec4899', group: 'music' },
            { name: 'Guitar',   x: 0.55, y: 0.25, color: '#f472b6', group: 'music' },
            { name: 'River',    x: 0.80, y: 0.30, color: '#06b6d4', group: 'nature' },
            { name: 'Mountain', x: 0.78, y: 0.40, color: '#14b8a6', group: 'nature' },
            { name: 'Quantum',  x: 0.35, y: 0.75, color: '#8b5cf6', group: 'science' },
            { name: 'Electron', x: 0.42, y: 0.70, color: '#a78bfa', group: 'science' },
            { name: 'the',      x: 0.50, y: 0.50, color: '#64748b', group: 'function' },
            { name: 'is',       x: 0.55, y: 0.48, color: '#94a3b8', group: 'function' },
            { name: 'Happy',    x: 0.70, y: 0.70, color: '#facc15', group: 'emotion' },
            { name: 'Sad',      x: 0.72, y: 0.78, color: '#3b82f6', group: 'emotion' },
        ]
    },
    currentPreset: 'animals'
};

window.loadVoronoiPreset = function (name) {
    const st = voronoiState;
    st.currentPreset = name;
    st.seeds = JSON.parse(JSON.stringify(st.presets[name]));
    st.clickPoint = null;
    st.dragging = null;

    // Update button styles
    document.querySelectorAll('.voronoi-preset-btn').forEach(btn => {
        btn.style.background = '#64748b';
    });
    const activeBtn = document.getElementById('vp-' + name);
    if (activeBtn) activeBtn.style.background = '#8b5cf6';

    renderVoronoi();
    updateVoronoiLegend();
};

function initVoronoi() {
    const canvas = document.getElementById('canvas-voronoi');
    if (!canvas) return;

    const st = voronoiState;
    st.canvas = canvas;

    // Set canvas resolution
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        st.width = rect.width;
        st.height = rect.height;
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        st.ctx = canvas.getContext('2d');
        st.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resizeCanvas();

    // Load default preset
    st.seeds = JSON.parse(JSON.stringify(st.presets.animals));

    // ── Mouse / touch interaction ──
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height
        };
    }

    function findSeedAt(pos, threshold) {
        let closest = null, minD = Infinity;
        st.seeds.forEach((s, i) => {
            const d = Math.hypot(s.x - pos.x, s.y - pos.y);
            if (d < minD) { minD = d; closest = i; }
        });
        return (minD < threshold) ? closest : null;
    }

    canvas.addEventListener('mousedown', e => {
        const pos = getPos(e);
        const idx = findSeedAt(pos, 0.04);
        if (idx !== null) {
            st.dragging = idx;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mousemove', e => {
        const pos = getPos(e);
        if (st.dragging !== null) {
            st.seeds[st.dragging].x = Math.max(0.02, Math.min(0.98, pos.x));
            st.seeds[st.dragging].y = Math.max(0.02, Math.min(0.98, pos.y));
            renderVoronoi();
        } else {
            const idx = findSeedAt(pos, 0.04);
            canvas.style.cursor = idx !== null ? 'grab' : 'crosshair';
        }
    });

    canvas.addEventListener('mouseup', e => {
        if (st.dragging !== null) {
            st.dragging = null;
            canvas.style.cursor = 'crosshair';
        } else {
            // Click to query
            const pos = getPos(e);
            st.clickPoint = pos;
            renderVoronoi();
            updateVoronoiClickInfo(pos);
        }
    });

    canvas.addEventListener('mouseleave', () => {
        st.dragging = null;
        canvas.style.cursor = 'crosshair';
    });

    // Touch support
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        const pos = getPos(e);
        const idx = findSeedAt(pos, 0.06);
        if (idx !== null) st.dragging = idx;
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        if (st.dragging !== null) {
            const pos = getPos(e);
            st.seeds[st.dragging].x = Math.max(0.02, Math.min(0.98, pos.x));
            st.seeds[st.dragging].y = Math.max(0.02, Math.min(0.98, pos.y));
            renderVoronoi();
        }
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
        st.dragging = null;
    });

    // Resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resizeCanvas(); renderVoronoi(); }, 150);
    });

    renderVoronoi();
    updateVoronoiLegend();
}

function renderVoronoi() {
    const st = voronoiState;
    if (!st.ctx) return;

    const ctx = st.ctx;
    const W = st.width;
    const H = st.height;
    const seeds = st.seeds;

    const showGradient = document.getElementById('voronoi-show-gradient')?.checked ?? true;
    const showBoundaries = document.getElementById('voronoi-show-boundaries')?.checked ?? true;
    const showLabels = document.getElementById('voronoi-show-labels')?.checked ?? true;

    // ── Step 1: Render Voronoi cells via pixel sampling ──
    // Use an offscreen approach at lower resolution for performance
    const res = 3; // pixel step size (lower = higher quality, slower)
    const cellOwner = []; // flat array: which seed owns each sampled pixel
    const cellDist = [];  // distance to nearest seed
    const cellDist2 = []; // distance to second-nearest seed

    for (let py = 0; py < H; py += res) {
        for (let px = 0; px < W; px += res) {
            const nx = px / W;
            const ny = py / H;

            let minD = Infinity, minI = 0;
            let min2D = Infinity;

            for (let i = 0; i < seeds.length; i++) {
                const d = Math.hypot(seeds[i].x - nx, seeds[i].y - ny);
                if (d < minD) {
                    min2D = minD;
                    minD = d;
                    minI = i;
                } else if (d < min2D) {
                    min2D = d;
                }
            }

            cellOwner.push(minI);
            cellDist.push(minD);
            cellDist2.push(min2D);
        }
    }

    // ── Step 2: Draw cells ──
    ctx.clearRect(0, 0, W, H);

    const cols = Math.ceil(W / res);
    let idx = 0;

    for (let py = 0; py < H; py += res) {
        for (let px = 0; px < W; px += res) {
            const owner = cellOwner[idx];
            const d1 = cellDist[idx];
            const d2 = cellDist2[idx];
            const seed = seeds[owner];

            if (showGradient) {
                // Distance-based shading: darker near seed, lighter near boundary
                const boundaryProximity = 1 - (d2 - d1) / (d2 + d1 + 0.001);
                // boundaryProximity: 0 = far from boundary (center), 1 = on boundary
                const alpha = 0.15 + (1 - boundaryProximity) * 0.35;
                ctx.fillStyle = hexToRgba(seed.color, alpha);
            } else {
                ctx.fillStyle = hexToRgba(seed.color, 0.25);
            }

            ctx.fillRect(px, py, res, res);

            // Boundary detection: if the next pixel (right or down) has a different owner, draw boundary
            if (showBoundaries) {
                const rightIdx = idx + 1;
                const downIdx = idx + cols;
                const isRightBoundary = (px + res < W) && rightIdx < cellOwner.length && cellOwner[rightIdx] !== owner;
                const isDownBoundary = (py + res < H) && downIdx < cellOwner.length && cellOwner[downIdx] !== owner;

                if (isRightBoundary || isDownBoundary) {
                    ctx.fillStyle = 'rgba(255,255,255,0.9)';
                    ctx.fillRect(px, py, res + 1, res + 1);
                }
            }

            idx++;
        }
    }

    // ── Step 3: Draw seeds and labels ──
    seeds.forEach((s, i) => {
        const sx = s.x * W;
        const sy = s.y * H;

        // Seed dot
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner dot
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Label
        if (showLabels) {
            ctx.font = 'bold 12px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            // Background for readability
            const textWidth = ctx.measureText(s.name).width;
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.fillRect(sx - textWidth / 2 - 3, sy - 24, textWidth + 6, 16);

            ctx.fillStyle = s.color;
            ctx.fillText(s.name, sx, sy - 10);
        }
    });

    // ── Step 4: Click point indicator ──
    if (st.clickPoint) {
        const cp = st.clickPoint;
        const cpx = cp.x * W;
        const cpy = cp.y * H;

        // Find owner
        let minD = Infinity, minI = 0;
        seeds.forEach((s, i) => {
            const d = Math.hypot(s.x - cp.x, s.y - cp.y);
            if (d < minD) { minD = d; minI = i; }
        });

        // Line to owner
        ctx.beginPath();
        ctx.moveTo(cpx, cpy);
        ctx.lineTo(seeds[minI].x * W, seeds[minI].y * H);
        ctx.strokeStyle = 'rgba(30,41,59,0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Click marker
        ctx.beginPath();
        ctx.arc(cpx, cpy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Crosshair
        ctx.strokeStyle = 'rgba(30,41,59,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cpx - 12, cpy); ctx.lineTo(cpx + 12, cpy);
        ctx.moveTo(cpx, cpy - 12); ctx.lineTo(cpx, cpy + 12);
        ctx.stroke();
    }

    // ── Step 5: Stats ──
    updateVoronoiStats(cellOwner, cellDist, cellDist2);
}

function updateVoronoiClickInfo(pos) {
    const st = voronoiState;
    const infoDiv = document.getElementById('voronoi-click-info');
    if (!infoDiv) return;

    const seeds = st.seeds;

    // Find distances to all seeds, sorted
    const dists = seeds.map((s, i) => ({
        idx: i, name: s.name, color: s.color, group: s.group,
        dist: Math.hypot(s.x - pos.x, s.y - pos.y)
    })).sort((a, b) => a.dist - b.dist);

    const owner = dists[0];
    const runner = dists[1];
    const boundaryDist = (runner.dist - owner.dist).toFixed(4);
    const confidence = ((runner.dist - owner.dist) / (runner.dist + owner.dist + 0.001) * 100).toFixed(1);

    infoDiv.innerHTML = `
        <div style="margin-bottom: 8px;">
            <b>Owner:</b> <span style="color:${owner.color}; font-weight:bold; font-size:1.1em;">${owner.name}</span>
            <span style="color:#94a3b8; font-size:0.85em;">(${owner.group})</span>
        </div>
        <div style="margin-bottom: 4px;">
            <b>Distance to ${owner.name}:</b> ${owner.dist.toFixed(4)}
        </div>
        <div style="margin-bottom: 4px;">
            <b>Runner-up:</b> <span style="color:${runner.color};">${runner.name}</span> (${runner.dist.toFixed(4)})
        </div>
        <div style="margin-bottom: 4px;">
            <b>Boundary margin:</b> ${boundaryDist}
        </div>
        <div style="margin-bottom: 8px;">
            <b>Confidence:</b>
            <span style="color:${parseFloat(confidence) > 30 ? '#10b981' : parseFloat(confidence) > 10 ? '#f59e0b' : '#ef4444'}; font-weight:bold;">
                ${confidence}%
            </span>
            ${parseFloat(confidence) < 10 ? '<span style="color:#ef4444; font-size:0.8em;"> ⚠️ near boundary!</span>' : ''}
        </div>
        <div style="font-size: 0.8em; color: #94a3b8;">
            <b>Nearest 5:</b><br>
            ${dists.slice(0, 5).map((d, i) =>
                `<span style="color:${d.color};">${i === 0 ? '→' : '&nbsp;&nbsp;'} ${d.name}</span> <span style="color:#cbd5e1;">(${d.dist.toFixed(3)})</span>`
            ).join('<br>')}
        </div>
    `;
}

function updateVoronoiLegend() {
    const st = voronoiState;
    const legendDiv = document.getElementById('voronoi-legend');
    if (!legendDiv) return;

    // Group seeds by group
    const groups = {};
    st.seeds.forEach(s => {
        if (!groups[s.group]) groups[s.group] = [];
        groups[s.group].push(s);
    });

    let html = '';
    Object.entries(groups).forEach(([group, members]) => {
        html += `<div style="margin-bottom: 6px;">
            <span style="font-weight:bold; color:#1e293b; font-size:0.85em; text-transform:capitalize;">${group}</span><br>`;
        members.forEach(m => {
            html += `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${m.color}; margin-right:4px; vertical-align:middle;"></span>
                <span style="font-size:0.8em; color:${m.color};">${m.name}</span>&nbsp;&nbsp;`;
        });
        html += `</div>`;
    });

    legendDiv.innerHTML = html;
}

function updateVoronoiStats(cellOwner, cellDist, cellDist2) {
    const statsDiv = document.getElementById('voronoi-stats');
    if (!statsDiv) return;

    const st = voronoiState;
    const seeds = st.seeds;
    const N = seeds.length;

    // Count pixels per cell (approximate cell area)
    const cellCounts = new Array(N).fill(0);
    cellOwner.forEach(o => cellCounts[o]++);
    const totalPixels = cellOwner.length;

    // Find largest and smallest cells
    let maxIdx = 0, minIdx = 0;
    cellCounts.forEach((c, i) => {
        if (c > cellCounts[maxIdx]) maxIdx = i;
        if (c < cellCounts[minIdx]) minIdx = i;
    });

    const largestPct = (cellCounts[maxIdx] / totalPixels * 100).toFixed(1);
    const smallestPct = (cellCounts[minIdx] / totalPixels * 100).toFixed(1);

    // Average boundary proximity (how much of the space is "ambiguous")
    let boundaryPixels = 0;
    for (let i = 0; i < cellDist.length; i++) {
        const margin = cellDist2[i] - cellDist[i];
        if (margin < 0.02) boundaryPixels++;
    }
    const ambiguousPct = (boundaryPixels / totalPixels * 100).toFixed(1);

    // Find which pairs share the longest boundaries
    // (approximate: count boundary pixels between each pair)
    const pairBoundary = {};
    const cols = Math.ceil(st.width / 3); // res = 3

    for (let i = 0; i < cellOwner.length; i++) {
        const owner = cellOwner[i];
        const rightIdx = i + 1;
        const downIdx = i + cols;

        if (rightIdx < cellOwner.length && cellOwner[rightIdx] !== owner) {
            const key = [Math.min(owner, cellOwner[rightIdx]), Math.max(owner, cellOwner[rightIdx])].join('-');
            pairBoundary[key] = (pairBoundary[key] || 0) + 1;
        }
        if (downIdx < cellOwner.length && cellOwner[downIdx] !== owner) {
            const key = [Math.min(owner, cellOwner[downIdx]), Math.max(owner, cellOwner[downIdx])].join('-');
            pairBoundary[key] = (pairBoundary[key] || 0) + 1;
        }
    }

    // Top neighbor pair
    let topPairKey = null, topPairCount = 0;
    Object.entries(pairBoundary).forEach(([key, count]) => {
        if (count > topPairCount) { topPairKey = key; topPairCount = count; }
    });

    let topPairLabel = '—';
    if (topPairKey) {
        const [a, b] = topPairKey.split('-').map(Number);
        topPairLabel = `${seeds[a].name} ↔ ${seeds[b].name}`;
    }

    statsDiv.innerHTML = `
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Largest Cell</div>
            <div style="font-size:1.1em; font-weight:bold; color:${seeds[maxIdx].color};">${seeds[maxIdx].name}</div>
            <div style="font-size:0.85em; color:#94a3b8;">${largestPct}% of space</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Smallest Cell</div>
            <div style="font-size:1.1em; font-weight:bold; color:${seeds[minIdx].color};">${seeds[minIdx].name}</div>
            <div style="font-size:0.85em; color:#94a3b8;">${smallestPct}% of space</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Longest Boundary</div>
            <div style="font-size:0.9em; font-weight:bold; color:#8b5cf6;">${topPairLabel}</div>
            <div style="font-size:0.75em; color:#94a3b8;">closest neighbors</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Ambiguous Zone</div>
            <div style="font-size:1.2em; font-weight:bold; color:${parseFloat(ambiguousPct) > 20 ? '#f59e0b' : '#10b981'};">${ambiguousPct}%</div>
            <div style="font-size:0.75em; color:#94a3b8;">near boundaries</div>
        </div>
    `;
}

function hexToRgba(hex, alpha) {
    // Handle shorthand and full hex
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r},${g},${b},${alpha})`;
}

// ============================================================
// ISOSURFACES OF PROBABILITY: TRUTH TUNNELS
// ============================================================

const isoState = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    temperature: 0.8,
    currentStep: 0,
    currentSentence: 'capital',
    animFrame: null,
    sentences: {
        capital: {
            tokens: ['The', 'capital', 'of', 'France', 'is', 'Paris', '.'],
            // entropy at each step (0-1 normalized): high = wide tunnel, low = narrow
            entropy: [0.95, 0.55, 0.20, 0.60, 0.15, 0.05, 0.10],
            // position path through 2D "embedding space" (normalized 0-1)
            path: [
                { x: 0.08, y: 0.50 },
                { x: 0.20, y: 0.42 },
                { x: 0.32, y: 0.38 },
                { x: 0.45, y: 0.35 },
                { x: 0.58, y: 0.32 },
                { x: 0.74, y: 0.30 },
                { x: 0.88, y: 0.32 },
            ],
            // branch points: at which step does a fork appear, and where does the branch go?
            branches: [
                {
                    atStep: 3, // after "of" — could be many countries
                    alternatives: [
                        { token: 'Germany', path: { x: 0.45, y: 0.55 }, entropy: 0.55 },
                        { token: 'Japan', path: { x: 0.45, y: 0.22 }, entropy: 0.50 },
                    ]
                },
                {
                    atStep: 5, // after "is" — very constrained
                    alternatives: [
                        { token: 'the', path: { x: 0.74, y: 0.40 }, entropy: 0.25 },
                    ]
                }
            ],
            description: 'A factual statement that starts wide open and narrows to a single answer.'
        },
        story: {
            tokens: ['Once', 'upon', 'a', 'time', ',', 'a', 'dragon', 'flew', 'over', 'the', 'kingdom'],
            entropy: [0.70, 0.15, 0.10, 0.12, 0.08, 0.85, 0.60, 0.50, 0.20, 0.15, 0.65],
            path: [
                { x: 0.05, y: 0.50 },
                { x: 0.13, y: 0.46 },
                { x: 0.19, y: 0.44 },
                { x: 0.25, y: 0.43 },
                { x: 0.31, y: 0.43 },
                { x: 0.39, y: 0.44 },
                { x: 0.49, y: 0.38 },
                { x: 0.58, y: 0.35 },
                { x: 0.66, y: 0.37 },
                { x: 0.74, y: 0.38 },
                { x: 0.85, y: 0.35 },
            ],
            branches: [
                {
                    atStep: 6, // after "a" — what creature?
                    alternatives: [
                        { token: 'princess', path: { x: 0.49, y: 0.55 }, entropy: 0.55 },
                        { token: 'knight', path: { x: 0.49, y: 0.25 }, entropy: 0.50 },
                        { token: 'wizard', path: { x: 0.52, y: 0.48 }, entropy: 0.45 },
                    ]
                },
                {
                    atStep: 10, // "the ___" — many possible places
                    alternatives: [
                        { token: 'castle', path: { x: 0.85, y: 0.50 }, entropy: 0.55 },
                        { token: 'village', path: { x: 0.85, y: 0.22 }, entropy: 0.50 },
                    ]
                }
            ],
            description: 'A fairy tale opening — formulaic start, then creative explosion at each noun.'
        },
        code: {
            tokens: ['function', '(', 'x', ',', 'y', ')', '{', 'return', 'x', '+', 'y'],
            entropy: [0.50, 0.05, 0.60, 0.08, 0.55, 0.05, 0.06, 0.30, 0.40, 0.25, 0.35],
            path: [
                { x: 0.05, y: 0.50 },
                { x: 0.14, y: 0.45 },
                { x: 0.22, y: 0.42 },
                { x: 0.29, y: 0.43 },
                { x: 0.36, y: 0.40 },
                { x: 0.43, y: 0.42 },
                { x: 0.50, y: 0.44 },
                { x: 0.59, y: 0.40 },
                { x: 0.68, y: 0.37 },
                { x: 0.77, y: 0.38 },
                { x: 0.88, y: 0.36 },
            ],
            branches: [
                {
                    atStep: 7, // after "{" — what operation?
                    alternatives: [
                        { token: 'if', path: { x: 0.59, y: 0.55 }, entropy: 0.60 },
                        { token: 'const', path: { x: 0.59, y: 0.28 }, entropy: 0.50 },
                    ]
                },
                {
                    atStep: 9, // "x ___" — what operator?
                    alternatives: [
                        { token: '*', path: { x: 0.77, y: 0.50 }, entropy: 0.30 },
                        { token: '-', path: { x: 0.77, y: 0.28 }, entropy: 0.30 },
                    ]
                }
            ],
            description: 'Code is highly structured — syntax tokens have near-zero entropy, variable names are open.'
        },
        ambiguous: {
            tokens: ['I', 'went', 'to', 'the', 'bank', 'of', 'the', 'river'],
            entropy: [0.80, 0.65, 0.15, 0.12, 0.70, 0.45, 0.12, 0.55],
            path: [
                { x: 0.06, y: 0.50 },
                { x: 0.17, y: 0.47 },
                { x: 0.27, y: 0.45 },
                { x: 0.36, y: 0.44 },
                { x: 0.48, y: 0.43 },
                { x: 0.60, y: 0.40 },
                { x: 0.72, y: 0.38 },
                { x: 0.87, y: 0.35 },
            ],
            branches: [
                {
                    atStep: 4, // "the ___" — bank is ambiguous!
                    alternatives: [
                        { token: 'store', path: { x: 0.48, y: 0.30 }, entropy: 0.50 },
                        { token: 'park', path: { x: 0.48, y: 0.60 }, entropy: 0.55 },
                    ]
                },
                {
                    atStep: 5, // "bank ___" — this resolves the ambiguity
                    alternatives: [
                        { token: 'to', path: { x: 0.60, y: 0.55 }, entropy: 0.40 },
                        { token: 'account', path: { x: 0.60, y: 0.28 }, entropy: 0.35 },
                    ]
                }
            ],
            description: 'The word "bank" creates a fork — geography vs. finance — resolved only by "river."'
        }
    }
};

window.loadIsoSentence = function (name) {
    isoState.currentSentence = name;
    isoState.currentStep = 0;

    const slider = document.getElementById('iso-step-slider');
    const sent = isoState.sentences[name];
    if (slider) {
        slider.max = sent.tokens.length - 1;
        slider.value = 0;
    }

    document.querySelectorAll('.iso-preset-btn').forEach(btn => {
        btn.style.background = '#64748b';
    });
    const activeBtn = document.getElementById('iso-' + name);
    if (activeBtn) activeBtn.style.background = '#8b5cf6';

    renderIsosurface();
};

function initIsosurface() {
    const canvas = document.getElementById('canvas-isosurface');
    if (!canvas) return;

    const st = isoState;
    st.canvas = canvas;

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        st.width = rect.width;
        st.height = rect.height;
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        st.ctx = canvas.getContext('2d');
        st.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resizeCanvas();

    const stepSlider = document.getElementById('iso-step-slider');
    const tempSlider = document.getElementById('iso-temperature');

    if (stepSlider) {
        const sent = st.sentences[st.currentSentence];
        stepSlider.max = sent.tokens.length - 1;
        stepSlider.addEventListener('input', () => {
            st.currentStep = parseInt(stepSlider.value);
            renderIsosurface();
        });
    }

    if (tempSlider) {
        tempSlider.addEventListener('input', () => {
            st.temperature = parseFloat(tempSlider.value);
            renderIsosurface();
        });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resizeCanvas(); renderIsosurface(); }, 150);
    });

    renderIsosurface();
}

function renderIsosurface() {
    const st = isoState;
    if (!st.ctx) return;

    const ctx = st.ctx;
    const W = st.width;
    const H = st.height;
    const sent = st.sentences[st.currentSentence];
    const step = Math.min(st.currentStep, sent.tokens.length - 1);
    const temp = st.temperature;

    // Update labels
    const tempVal = document.getElementById('iso-temp-val');
    const stepVal = document.getElementById('iso-step-val');
    if (tempVal) {
        tempVal.textContent = temp.toFixed(2);
        tempVal.style.color = temp < 0.4 ? '#3b82f6' : temp < 1.2 ? '#f59e0b' : '#ef4444';
    }
    if (stepVal) stepVal.textContent = `${step} / ${sent.tokens.length - 1}`;

    // ── Clear ──
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // ── Grid ──
    ctx.strokeStyle = 'rgba(51,65,85,0.3)';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // Helper: normalized coords to canvas
    function toCanvas(p) {
        return { x: p.x * W, y: p.y * H };
    }

    // ── Draw the full path as a faint guide ──
    ctx.beginPath();
    sent.path.forEach((p, i) => {
        const cp = toCanvas(p);
        if (i === 0) ctx.moveTo(cp.x, cp.y);
        else ctx.lineTo(cp.x, cp.y);
    });
    ctx.strokeStyle = 'rgba(96,165,250,0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Draw isosurface envelope for completed steps ──
    // The envelope width at each point = entropy * temperature * baseWidth
    const baseWidth = 80;

    // Build upper and lower envelope paths
    if (step >= 1) {
        const upperPath = [];
        const lowerPath = [];

        for (let i = 0; i <= step; i++) {
            const cp = toCanvas(sent.path[i]);
            const envelope = sent.entropy[i] * temp * baseWidth;

            // Compute perpendicular direction
            let dx = 0, dy = -1; // default: perpendicular is up/down
            if (i < sent.path.length - 1) {
                const next = toCanvas(sent.path[i + 1]);
                const tdx = next.x - cp.x;
                const tdy = next.y - cp.y;
                const len = Math.hypot(tdx, tdy);
                if (len > 0) {
                    dx = -tdy / len;
                    dy = tdx / len;
                }
            } else if (i > 0) {
                const prev = toCanvas(sent.path[i - 1]);
                const tdx = cp.x - prev.x;
                const tdy = cp.y - prev.y;
                const len = Math.hypot(tdx, tdy);
                if (len > 0) {
                    dx = -tdy / len;
                    dy = tdx / len;
                }
            }

            upperPath.push({ x: cp.x + dx * envelope, y: cp.y + dy * envelope });
            lowerPath.push({ x: cp.x - dx * envelope, y: cp.y - dy * envelope });
        }

        // Draw envelope as filled shape
        // Gradient fill layers for glow effect
        for (let layer = 3; layer >= 0; layer--) {
            const scale = 1 + layer * 0.3;
            const alpha = 0.03 + (3 - layer) * 0.03;

            ctx.beginPath();
            upperPath.forEach((p, i) => {
                const cp = toCanvas(sent.path[i]);
                const ex = cp.x + (p.x - cp.x) * scale;
                const ey = cp.y + (p.y - cp.y) * scale;
                if (i === 0) ctx.moveTo(ex, ey);
                else ctx.lineTo(ex, ey);
            });
            for (let i = lowerPath.length - 1; i >= 0; i--) {
                const cp = toCanvas(sent.path[i]);
                const p = lowerPath[i];
                const ex = cp.x + (p.x - cp.x) * scale;
                const ey = cp.y + (p.y - cp.y) * scale;
                ctx.lineTo(ex, ey);
            }
            ctx.closePath();
            ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.fill();
        }

        // Inner envelope (brighter)
        ctx.beginPath();
        upperPath.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        for (let i = lowerPath.length - 1; i >= 0; i--) {
            ctx.lineTo(lowerPath[i].x, lowerPath[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(139, 92, 246, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // ── Draw branches at visible steps ──
    sent.branches.forEach(branch => {
        if (step >= branch.atStep) {
            const origin = toCanvas(sent.path[branch.atStep]);

            branch.alternatives.forEach(alt => {
                const target = toCanvas(alt.path);
                const altEnvelope = alt.entropy * temp * baseWidth * 0.6;

                // Branch line
                ctx.beginPath();
                ctx.moveTo(origin.x, origin.y);
                ctx.lineTo(target.x, target.y);
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([3, 5]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Branch envelope (small blob)
                ctx.beginPath();
                ctx.arc(target.x, target.y, altEnvelope, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(251, 191, 36, 0.06)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Branch label
                ctx.font = '11px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
                ctx.fillText(alt.token, target.x, target.y - altEnvelope - 6);

                // Small dot
                ctx.beginPath();
                ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#fbbf24';
                ctx.fill();
            });
        }
    });

    // ── Draw the main trajectory (solid, up to current step) ──
    if (step >= 1) {
        ctx.beginPath();
        for (let i = 0; i <= step; i++) {
            const cp = toCanvas(sent.path[i]);
            if (i === 0) ctx.moveTo(cp.x, cp.y);
            else ctx.lineTo(cp.x, cp.y);
        }
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Glow
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
        ctx.lineWidth = 8;
        ctx.stroke();
    }

    // ── Draw token nodes ──
    for (let i = 0; i <= step; i++) {
        const cp = toCanvas(sent.path[i]);
        const entropy = sent.entropy[i];
        const radius = 5 + entropy * temp * 4;

        // Outer glow
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96, 165, 250, ${0.1 + entropy * 0.1})`;
        ctx.fill();

        // Main dot
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, radius, 0, Math.PI * 2);

        // Color by entropy: blue (certain) → purple (moderate) → orange (uncertain)
        const hue = 220 - entropy * 180; // 220 (blue) → 40 (orange)
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Token label
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(sent.tokens[i], cp.x, cp.y - radius - 8);
    }

    // ── Future tokens (faint) ──
    for (let i = step + 1; i < sent.tokens.length; i++) {
        const cp = toCanvas(sent.path[i]);
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.fill();

        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.fillText(sent.tokens[i], cp.x, cp.y - 10);
    }

    // ── Entropy bar at current step ──
    if (step < sent.tokens.length) {
        const barX = W - 50;
        const barH = H - 80;
        const barW = 16;
        const barY = 40;

        // Background
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 8);
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 4, barY - 4, barW + 8, barH + 8);

        // Gradient fill
        const grad = ctx.createLinearGradient(0, barY, 0, barY + barH);
        grad.addColorStop(0, '#3b82f6');   // low entropy (top) = blue = certain
        grad.addColorStop(0.5, '#8b5cf6'); // mid = purple
        grad.addColorStop(1, '#f59e0b');   // high entropy (bottom) = orange = uncertain
        ctx.fillStyle = grad;
        ctx.fillRect(barX, barY, barW, barH);

        // Current entropy marker
        const currentEntropy = sent.entropy[step];
        const effectiveEntropy = Math.min(1, currentEntropy * temp);
        const markerY = barY + (1 - effectiveEntropy) * barH; // invert: high entropy = bottom

        // Marker arrow
        ctx.beginPath();
        ctx.moveTo(barX - 8, markerY);
        ctx.lineTo(barX, markerY - 4);
        ctx.lineTo(barX, markerY + 4);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Marker line
        ctx.beginPath();
        ctx.moveTo(barX, markerY);
        ctx.lineTo(barX + barW, markerY);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Labels
        ctx.font = '9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Certain', barX + barW / 2, barY - 8);
        ctx.fillText('Uncertain', barX + barW / 2, barY + barH + 14);

        // Entropy value
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(`H=${effectiveEntropy.toFixed(2)}`, barX + barW + 6, markerY + 4);
    }

    // ── Temperature indicator (top left) ──
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.fillText(`T = ${temp.toFixed(2)}`, 12, 20);

    let tempLabel;
    if (temp < 0.3) tempLabel = '❄️ Frozen — deterministic';
    else if (temp < 0.7) tempLabel = '🧊 Cool — focused';
    else if (temp < 1.2) tempLabel = '🌡️ Warm — balanced';
    else tempLabel = '🔥 Hot — chaotic';
    ctx.fillText(tempLabel, 12, 36);

    // ── Update sentence panel ──
    updateIsoSentencePanel(sent, step, temp);
    updateIsoStats(sent, step, temp);
}

function updateIsoSentencePanel(sent, step, temp) {
    const displayDiv = document.getElementById('iso-sentence-display');
    const infoDiv = document.getElementById('iso-step-info');
    if (!displayDiv || !infoDiv) return;

    // Build sentence with highlighting
    let html = '';
    sent.tokens.forEach((token, i) => {
        if (i < step) {
            // Past tokens: solid
            html += `<span style="color:#1e293b; font-weight:bold;">${token}</span> `;
        } else if (i === step) {
            // Current token: highlighted
            const entropy = sent.entropy[i];
            const hue = 220 - entropy * 180;
            html += `<span style="background: hsl(${hue}, 80%, 90%); color: hsl(${hue}, 80%, 30%); font-weight:bold; padding: 2px 6px; border-radius: 4px; border: 2px solid hsl(${hue}, 80%, 60%);">${token}</span> `;
        } else {
            // Future tokens: faded
            html += `<span style="color:#cbd5e1;">${token}</span> `;
        }
    });
    displayDiv.innerHTML = html;

    // Step info
    const entropy = sent.entropy[step];
    const effectiveEntropy = Math.min(1, entropy * temp);
    const tunnelWidth = (effectiveEntropy * 100).toFixed(0);

    // Find branches at this step
    let branchHtml = '';
    sent.branches.forEach(branch => {
        if (branch.atStep === step) {
            branchHtml += `<div style="margin-top: 6px; padding: 6px 8px; background: rgba(251,191,36,0.1); border-radius: 4px; border-left: 3px solid #fbbf24;">
                <b style="color:#f59e0b;">🔀 Fork detected!</b><br>`;
            branch.alternatives.forEach(alt => {
                branchHtml += `<span style="color:#f59e0b;">→ "${alt.token}"</span> <span style="color:#94a3b8;">(H=${alt.entropy.toFixed(2)})</span><br>`;
            });
            branchHtml += `</div>`;
        }
    });

    let certaintyLabel, certaintyColor;
    if (effectiveEntropy < 0.15) { certaintyLabel = 'Near-certain'; certaintyColor = '#3b82f6'; }
    else if (effectiveEntropy < 0.35) { certaintyLabel = 'Confident'; certaintyColor = '#10b981'; }
    else if (effectiveEntropy < 0.55) { certaintyLabel = 'Moderate'; certaintyColor = '#f59e0b'; }
    else if (effectiveEntropy < 0.75) { certaintyLabel = 'Uncertain'; certaintyColor = '#f97316'; }
    else { certaintyLabel = 'Wide open'; certaintyColor = '#ef4444'; }

    infoDiv.innerHTML = `
        <div style="margin-bottom: 6px;">
            <b>Token:</b> <span style="font-size:1.1em; font-weight:bold; color:#1e293b;">"${sent.tokens[step]}"</span>
        </div>
        <div style="margin-bottom: 4px;">
            <b>Base Entropy:</b> ${entropy.toFixed(2)}
        </div>
        <div style="margin-bottom: 4px;">
            <b>Effective (×T):</b> ${effectiveEntropy.toFixed(2)}
        </div>
        <div style="margin-bottom: 4px;">
            <b>Tunnel Width:</b>
            <div style="background:#1e293b; border-radius:4px; height:10px; width:100%; margin-top:2px; overflow:hidden;">
                <div style="background: linear-gradient(90deg, #8b5cf6, #a78bfa); height:100%; width:${tunnelWidth}%; border-radius:4px; transition: width 0.3s;"></div>
            </div>
        </div>
        <div style="margin-bottom: 6px;">
            <b>Certainty:</b> <span style="color:${certaintyColor}; font-weight:bold;">${certaintyLabel}</span>
        </div>
        ${branchHtml}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 8px 0;">
        <div style="font-size: 0.8em; color: #94a3b8; font-style: italic;">
            ${sent.description}
        </div>
    `;
}

function updateIsoStats(sent, step, temp) {
    const statsDiv = document.getElementById('iso-stats');
    if (!statsDiv) return;

    const entropy = sent.entropy[step];
    const effectiveEntropy = Math.min(1, entropy * temp);

    // Count total branches visible
    let visibleBranches = 0;
    sent.branches.forEach(b => { if (step >= b.atStep) visibleBranches += b.alternatives.length; });

    // Average entropy so far
    let avgEntropy = 0;
    for (let i = 0; i <= step; i++) avgEntropy += sent.entropy[i];
    avgEntropy = step > 0 ? avgEntropy / (step + 1) : sent.entropy[0];
    const avgEffective = Math.min(1, avgEntropy * temp);

    // Narrowing ratio: how much has the tunnel narrowed from step 0?
    const narrowing = sent.entropy[0] > 0 ? (1 - effectiveEntropy / (sent.entropy[0] * temp)) * 100 : 0;

    statsDiv.innerHTML = `
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Current Entropy</div>
            <div style="font-size:1.4em; font-weight:bold; color:${effectiveEntropy < 0.3 ? '#3b82f6' : effectiveEntropy < 0.6 ? '#f59e0b' : '#ef4444'};">${effectiveEntropy.toFixed(2)}</div>
            <div style="font-size:0.7em; color:#94a3b8;">H × T</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Avg. Entropy</div>
            <div style="font-size:1.4em; font-weight:bold; color:#8b5cf6;">${avgEffective.toFixed(2)}</div>
            <div style="font-size:0.7em; color:#94a3b8;">across ${step + 1} steps</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Tunnel Narrowing</div>
            <div style="font-size:1.4em; font-weight:bold; color:${narrowing > 50 ? '#10b981' : narrowing > 20 ? '#f59e0b' : '#94a3b8'};">${Math.max(0, narrowing).toFixed(0)}%</div>
            <div style="font-size:0.7em; color:#94a3b8;">vs. first step</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Visible Forks</div>
            <div style="font-size:1.4em; font-weight:bold; color:#fbbf24;">${visibleBranches}</div>
            <div style="font-size:0.7em; color:#94a3b8;">alternative paths</div>
        </div>
    `;
}

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

    // 3. Dot Product Lab
    _embLazyRegister('dot-product-plot', () => {
        renderDotProductLab();
    });

    // 4. Rotational Invariance
    _embLazyRegister('plot-rotational-invariance', () => {
        renderRotationalInvariance();
    });

    // 5. Manifold Visualization
    _embLazyRegister('plot-manifold', () => {
        renderManifoldVisualization();
    });

    // 6. Cross-Lingual Alignment (2D)
    _embLazyRegister('plot-crosslingual-align', () => {
        renderCrossLingualFrame();
    });

    // 7. Metric Tensor / Attention Warping
    _embLazyRegister('plot-metric-tensor', () => {
        renderMetricTensor();
    });

    // 8. Parallelogram Law
    _embLazyRegister('plot-parallelogram', () => {
        setParallelogramConcept('royalty');
    });

    // 9. Dual Manifolds (3D translation surfaces)
    _embLazyRegister('plot-dual-manifolds', () => {
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
    });

    // 10. Platonic Representation Hypothesis
    _embLazyRegister('plot-platonic', () => {
        renderPlatonicHypothesis();
    });

    // 11. Scale Invariance
    _embLazyRegister('plot-scale-invariance', () => {
        renderScaleInvariance();
        const slider = document.getElementById('scale-magnitude');
        if (slider) {
            slider.addEventListener('input', renderScaleInvariance);
        }
    });

    // 12. Anisotropy
    _embLazyRegister('plot-anisotropy-scatter', () => {
        initAnisotropy();
        renderAnisotropy();
        const anisotropySlider = document.getElementById('anisotropy-slider');
        if (anisotropySlider) {
            anisotropySlider.addEventListener('input', renderAnisotropy);
        }
    });

    // 13. Superposition & Polysemanticity
    _embLazyRegister('plot-superposition', () => {
        renderSuperposition();
        const spSlider = document.getElementById('superposition-n');
        if (spSlider) {
            spSlider.addEventListener('input', renderSuperposition);
        }
    });

    // 14. Negation
    _embLazyRegister('plot-negation', () => {
        renderNegation();
    });

    // 15. In-Context Learning
    _embLazyRegister('plot-icl-task-vector', () => {
        initICL();
    });

    // 16. Hyperbolic Embeddings — Poincaré Disk
    _embLazyRegister('plot-poincare-disk', () => {
        try {
            hyperbolicState.tree = buildHyperbolicTree();
            renderHyperbolicEmbedding();
            var poincareSlider = document.getElementById('poincare-curvature');
            if (poincareSlider) {
                poincareSlider.addEventListener('input', renderHyperbolicEmbedding);
            }
        } catch(e) {
            console.error('Hyperbolic init failed:', e);
        }
    });

    // 17. Topology: Narrow Cones
    _embLazyRegister('plot-topology-cones', () => {
        initTopologyCones();
        renderTopologyCones();
        const topoSlider = document.getElementById('topology-dim-slider');
        if (topoSlider) {
            topoSlider.addEventListener('input', renderTopologyCones);
        }
    });

    // 18. Semantic Folding — Fractal Self-Similarity
    _embLazyRegister('plot-fractal-folding', () => {
        renderFractalFolding();
        const fractalSlider = document.getElementById('fractal-zoom-slider');
        if (fractalSlider) {
            fractalSlider.addEventListener('input', renderFractalFolding);
        }
    });

    // 19. Holographic Information Storage
    _embLazyRegister('plot-holographic-scatter', () => {
        initHolographic();
        renderHolographic();
        const holoSlider = document.getElementById('holographic-damage');
        if (holoSlider) {
            holoSlider.addEventListener('input', renderHolographic);
        }
    });

    // 20. Voronoi Cells
    _embLazyRegister('canvas-voronoi', () => {
        initVoronoi();
    });

    // 21. Isosurfaces of Probability — Truth Tunnels
    _embLazyRegister('canvas-isosurface', () => {
        initIsosurface();
    });


    // Start observing all registered sections
    _embLazyCreateObserver();
}
