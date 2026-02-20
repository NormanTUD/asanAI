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

	// "Language A" — original orientation
	const langA = rotate2D(originalPoints, 0, -20, 0);
	// "Language B" — rotated by 55°, shifted right
	const langB = rotate2D(originalPoints, 55, 25, 0);

	const traces = [];
	const colors = {
		'King': '#f59e0b', 'Queen': '#f59e0b',
		'Man': '#3b82f6', 'Woman': '#3b82f6',
		'Prince': '#10b981', 'Princess': '#10b981'
	};

	// --- Draw Language A points ---
	for (const [word, [x, y]] of Object.entries(langA)) {
		traces.push({
			x: [x], y: [y],
			mode: 'markers+text',
			text: [word],
			textposition: 'top center',
			marker: { size: 10, color: colors[word], opacity: 0.9 },
			showlegend: false,
			hovertemplate: `<b>${word}</b> (Language A)<br>x: %{x:.1f}, y: %{y:.1f}<extra></extra>`
		});
	}

	// --- Draw Language B points ---
	for (const [word, [x, y]] of Object.entries(langB)) {
		traces.push({
			x: [x], y: [y],
			mode: 'markers+text',
			text: [word],
			textposition: 'top center',
			marker: { size: 10, color: colors[word], opacity: 0.9, symbol: 'diamond' },
			showlegend: false,
			hovertemplate: `<b>${word}</b> (Language B)<br>x: %{x:.1f}, y: %{y:.1f}<extra></extra>`
		});
	}

	// --- Draw internal structure lines for Language A (Gender pairs) ---
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
		// Path in Language A (solid blue arrow)
		traces.push({
			x: [langA[a][0], langA[b][0]], y: [langA[a][1], langA[b][1]],
			mode: 'lines', line: { color: '#3b82f6', width: 3 },
			showlegend: false, hoverinfo: 'skip'
		});
		// Corresponding path in Language B (solid green arrow)
		traces.push({
			x: [langB[a][0], langB[b][0]], y: [langB[a][1], langB[b][1]],
			mode: 'lines', line: { color: '#10b981', width: 3 },
			showlegend: false, hoverinfo: 'skip'
		});
	}

	// --- Labels for the two spaces ---
	const annotations = [
		{
			x: -20, y: 18, text: '<b>Language A</b><br>(Original orientation)',
			showarrow: false, font: { size: 13, color: '#475569' },
			bgcolor: 'rgba(248,250,252,0.8)', borderpad: 4
		},
		{
			x: 25, y: 28, text: '<b>Language B</b><br>(Rotated 55°)',
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

	const traces = [];
	const colors = {
		'King': '#f59e0b', 'Queen': '#f59e0b',
		'Man': '#3b82f6', 'Woman': '#3b82f6',
		'Prince': '#10b981', 'Princess': '#10b981'
	};

	// Language A points (circles)
	for (const [word, [x, y]] of Object.entries(langA)) {
		traces.push({
			x: [x], y: [y],
			mode: 'markers+text', text: [word], textposition: 'top center',
			marker: { size: 11, color: colors[word], opacity: 0.9 },
			showlegend: false,
			hovertemplate: `<b>${word}</b> (Language A)<br>x: %{x:.1f}, y: %{y:.1f}<extra></extra>`
		});
	}

	// Language B points (diamonds)
	for (const [word, [x, y]] of Object.entries(langB)) {
		traces.push({
			x: [x], y: [y],
			mode: 'markers+text', text: [word], textposition: 'bottom center',
			marker: { size: 11, color: colors[word], opacity: 0.9, symbol: 'diamond' },
			showlegend: false,
			hovertemplate: `<b>${word}</b> (Language B)<br>x: %{x:.1f}, y: %{y:.1f}<extra></extra>`
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
		// Language A arrows (blue)
		annotations.push({
			ax: langA[a][0], ay: langA[a][1],
			x: langA[b][0], y: langA[b][1],
			axref: 'x', ayref: 'y', xref: 'x', yref: 'y',
			showarrow: true, arrowhead: 2, arrowsize: 1.5, arrowwidth: 3, arrowcolor: '#3b82f6'
		});
		// Language B arrows (green)
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
		text: '<b>Language A</b><br>(Reference)',
		showarrow: false, font: { size: 13, color: '#475569' },
		bgcolor: 'rgba(248,250,252,0.8)', borderpad: 4
	});
	annotations.push({
		x: st.currentOffsetX, y: 28,
		text: `<b>Language B</b><br>(Rotated ${Math.round(labelAngle)}°)`,
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

function loadEmbeddingModule () {
	const tasks = [
		...Object.keys(evoSpaces).map(key => ({ type: 'space', id: `plot-${key}`, key: key })),
		{ type: 'comparison', id: 'plot-comparison' },
		{ type: 'comparison3d', id: 'plot-comparison-3d' }
	];

	// Global Plotly config to reduce overhead
	const fastConfig = {
		displayModeBar: false, // Hides the heavy floating menu
		responsive: true,
		staticPlot: false,
		// This hint tells Plotly to prioritize frame rate
		glProto: 'webgl' 
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const task = tasks.find(t => t.id === entry.target.id);
				if (task) {
					// Use a slight delay based on the element's position
					// to ensure they don't all fire in the same millisecond
					const delay = entry.boundingClientRect.top < 500 ? 50 : 200;

					setTimeout(() => {
						requestAnimationFrame(() => {
							executeTask(task, fastConfig);
						});
					}, delay);
				}
				observer.unobserve(entry.target);
			}
		});
	}, { 
		// Reduced margin so we don't pre-render heavy 3D scenes 
		// that are too far down the page.
		rootMargin: '50px' 
	});

	function executeTask(task, config) {
		if (task.type === 'space') {
			// Passing config to the existing renderSpace call
			renderSpace(task.key, null, [], config);
		} else if (task.type === 'comparison3d') {
			renderComparison3D(config);
		}
	}

	tasks.forEach(task => {
		const el = document.getElementById(task.id);
		if (el) {
			// Inject a loading placeholder if the div is empty
			if (!el.hasChildNodes()) {
				el.innerHTML = `
		<div class="plot-loading">
		    <div class="spinner"></div>
		    <span>Loading 3D plot…</span>
		</div>`;
			}
			observer.observe(el);
		}
	});

	initEmbeddingEditor();

	renderDotProductLab();

	renderRotationalInvariance();

	renderManifoldVisualization();

	renderCrossLingualFrame();

	renderCrossLingualFrame();

	renderMetricTensor();
}
