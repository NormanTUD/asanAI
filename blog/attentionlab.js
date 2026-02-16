/**
 * Optimized 2D Transformer & Attention Simulation
 */
const contextVocab = {
	'bank':  { base: [5, 5], color: '#3b82f6' },
	'river': { base: [1, 9], color: '#10b981' },
	'money': { base: [9, 1], color: '#f59e0b' }
};

function runAttention() {
	const inputField = document.getElementById('trans-input');
	const container = 'transformer-plot';

	if (!inputField || !document.getElementById(container)) return;

	const input = inputField.value.toLowerCase();
	const words = input.split(/\s+/).filter(w => contextVocab[w]);

	let traces = [];

	// 1. Static Vocabulary (Background)
	Object.keys(contextVocab).forEach(word => {
		const pos = contextVocab[word].base;
		traces.push({
			x: [pos[0]], y: [pos[1]],
			mode: 'markers+text',
			name: word,
			text: word,
			textposition: 'bottom center',
			marker: { size: 12, opacity: 0.6, color: contextVocab[word].color },
			type: 'scatter' // Changed from scatter3d
		});
	});

	// 2. Attention Logic
	if (words.includes('bank')) {
		const bankBase = contextVocab['bank'].base;
		// Start at the base position
		let currentPos = [...bankBase]; 

		words.forEach(other => {
			if (other !== 'bank') {
				const otherBase = contextVocab[other].base;

				// Move 50% of the remaining distance to the "other" word
				// Formula: Current + (Target - Current) * 0.5
				currentPos = currentPos.map((coord, i) => coord + (otherBase[i] - coord) * 0.5);

				// Draw attention line (the "Handshake") from the original bank base
				traces.push({
					x: [bankBase[0], otherBase[0]],
					y: [bankBase[1], otherBase[1]],
					mode: 'lines',
					line: { color: '#f97316', width: 3, dash: 'dot' },
					hoverinfo: 'none',
					showlegend: false,
					type: 'scatter'
				});
			}
		});

		// The Resulting Contextual Embedding (now using the iteratively shifted position)
		traces.push({
			x: [currentPos[0]], y: [currentPos[1]],
			mode: 'markers+text',
			text: 'BANK (in context)',
			textposition: 'top center',
			marker: { 
				size: 16, 
				color: '#3b82f6', 
				symbol: 'diamond', 
				line: {color:'black', width:2} 
			},
			type: 'scatter'
		});
	}

	const layout = {
		margin: { l: 40, r: 40, b: 40, t: 40 },
		hovermode: 'closest',
		xaxis: { range: [0, 10], title: 'Semantic Dim A', gridcolor: '#e2e8f0' },
		yaxis: { range: [0, 10], title: 'Semantic Dim B', gridcolor: '#e2e8f0' },
		showlegend: false
	};

	Plotly.react(container, traces, layout);
}

/**
 * THE NEURAL UNIVERSE
 */
const universeVocab = {
	'happy': [2, 8, 2], 'sad': [-2, 2, 1], 'love': [4, 9, 3], 'hate': [-4, 1, 0],
	'king': [8, 5, 10], 'queen': [8, 9, 10], 'man': [1, 5, 5], 'woman': [1, 9, 5],
	'dog': [0, 2, -8], 'cat': [0, 4, -9], 'puppy': [-2, 2, -10], 'kitten': [-2, 4, -10],
	'pizza': [10, 2, -5], 'apple': [8, 4, -6], 'burger': [10, 3, -7],
	'the': [0,0,0], 'is': [0,1,0], 'his': [1,0,0], 'a': [0,0,1]
};

function runUniverse() {
	const inputField = document.getElementById('universe-input');
	if (!inputField) return;

	const tokens = inputField.value.toLowerCase().split(/\s+/).filter(t => universeVocab[t]);
	const container = 'universe-plot';

	let traces = [];

	// 1. Hintergrund (Latent Space) - Dunklere Punkte
	const allWords = Object.keys(universeVocab);
	traces.push({
		x: allWords.map(w => universeVocab[w][0]),
		y: allWords.map(w => universeVocab[w][1]),
		z: allWords.map(w => universeVocab[w][2]),
		mode: 'markers',
		marker: { size: 5, color: '#475569', opacity: 0.7 }, // Deutlich sichtbares Grau
		type: 'scatter3d'
	});

	// 2. Aktive Tokens & Attention Lines
	if (tokens.length > 0) {
		tokens.forEach(t => {
			const p = universeVocab[t];
			traces.push({
				x: [p[0]], y: [p[1]], z: [p[2]],
				mode: 'markers+text',
				text: t,
				marker: { size: 12, color: '#2563eb', line: {color: 'black', width: 2} },
				type: 'scatter3d'
			});
		});
	}

	const layout = {
		margin: { l: 0, r: 0, b: 0, t: 0 },
		scene: {
			xaxis: { 
				gridcolor: '#000000', // Schwarzes Gitter
				gridwidth: 1, 
				showgrid: true, 
				zeroline: true, 
				zerolinecolor: '#000000', 
				zerolinewidth: 3 
			},
			yaxis: { 
				gridcolor: '#000000', 
				gridwidth: 1, 
				showgrid: true, 
				zeroline: true, 
				zerolinecolor: '#000000', 
				zerolinewidth: 3 
			},
			zaxis: { 
				gridcolor: '#000000', 
				gridwidth: 1, 
				showgrid: true, 
				zeroline: true, 
				zerolinecolor: '#000000', 
				zerolinewidth: 3 
			}
		},
		showlegend: false
	};

	Plotly.react(container, traces, layout);
}

function log(type, msg) {
	const el = document.getElementById(type + '-console');
	if (el) el.innerText = msg;
}

// Renamed to SelfAttentionLab to avoid generic naming conflicts
const SelfAttentionLab = {
	data: {
		tokens: ["The", "hunter", "sees", "the", "bear"],
		matrix: [
			[0.10, 0.85, 0.05, 0.00, 0.00], 
			[0.10, 0.60, 0.25, 0.00, 0.05], 
			[0.00, 0.45, 0.10, 0.00, 0.45], 
			[0.00, 0.00, 0.05, 0.10, 0.85], 
			[0.00, 0.05, 0.45, 0.05, 0.45]  
		]
	},
	hoverIndex: null,

	init: function() {
		this.renderTokens();
		this.drawTable();
		// Specific namespaced event listener
		window.addEventListener('resize', () => this.drawWeb());
		this.drawWeb();
	},

	renderTokens: function() {
		// Updated to namespaced ID: sa-token-stream
		const container = document.getElementById('sa-token-stream');
		if (!container) return;

		container.innerHTML = this.data.tokens.map((word, i) => `
	    <div class="sa-token-block" 
		 onmouseover="SelfAttentionLab.hoverIndex=${i}; SelfAttentionLab.drawWeb();" 
		 onmouseout="SelfAttentionLab.hoverIndex=null; SelfAttentionLab.drawWeb();">
		${word}
	    </div>
	`).join('');
	},

	drawWeb: function() {
		// Updated to namespaced IDs and Classes
		const canvas = document.getElementById('sa-attn-canvas');
		const container = document.getElementById('sa-attention-container');
		const chips = document.querySelectorAll('.sa-token-block');

		if (!canvas || !container || chips.length === 0) return;

		const ctx = canvas.getContext('2d');
		canvas.width = container.offsetWidth;
		canvas.height = container.offsetHeight;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		const containerRect = container.getBoundingClientRect();

		this.data.tokens.forEach((_, i) => {
			this.data.tokens.forEach((_, j) => {
				if (i === j) return;

				const strength = this.data.matrix[i][j];
				if (strength < 0.01) return;

				const chip1 = chips[i].getBoundingClientRect();
				const chip2 = chips[j].getBoundingClientRect();

				const x1 = (chip1.left + chip1.width / 2) - containerRect.left;
				const x2 = (chip2.left + chip2.width / 2) - containerRect.left;
				const baseY = (chip1.top - containerRect.top);

				const isSource = (this.hoverIndex === i);

				ctx.beginPath();
				if (isSource) {
					ctx.lineWidth = 2 + strength * 20;
					ctx.strokeStyle = `rgba(37, 99, 235, ${0.3 + strength * 0.7})`;
				} else {
					ctx.lineWidth = 1;
					ctx.strokeStyle = `rgba(203, 213, 225, 0.2)`;
				}

				const dist = Math.abs(x2 - x1);
				const h = Math.min(dist * 0.5, 150);

				ctx.moveTo(x1, baseY);
				ctx.bezierCurveTo(x1, baseY - h, x2, baseY - h, x2, baseY);
				ctx.stroke();

				if (isSource && strength > 0.05) {
					ctx.fillStyle = "#1e40af";
					ctx.font = "bold 14px Inter, sans-serif";
					const txt = Math.round(strength * 100) + "%";
					ctx.fillText(txt, (x1 + x2)/2 - 10, baseY - h/1.5);
				}
			});
		});
	},

	drawTable: function() {
		const { tokens, matrix } = this.data;
		let html = '<table class="sa-attn-table"><tr><th>Source Word</th>';
		tokens.forEach(w => html += `<th>Attends to: ${w}</th>`);
		html += '</tr>';

		tokens.forEach((w, i) => {
			html += `<tr><td class="sa-row-label">${w}</td>`;
			matrix[i].forEach(val => {
				const color = `rgba(37, 99, 235, ${val})`;
				const textColor = val > 0.3 ? 'white' : '#475569';
				html += `<td style="background:${color}; color:${textColor}">${(val * 100).toFixed(0)}%</td>`;
			});
			html += '</tr>';
		});
		document.getElementById('sa-matrix-container').innerHTML = html + '</table>';
	}
};

/**
 * Visualizes the "Semantic Tug-of-War" for Apple and Key examples.
 * @param {string} containerId - The ID of the div to render the plot in.
 */

function initAppleShift(containerId) {
	const landmarks = [           
		// Tech Cluster (Silicon & Software) - Bottom Right
		{ x: 9, y: 1, text: 'Linux', color: '#64748b' },
		{ x: 8.5, y: 2, text: 'iPhone', color: '#64748b' },
		{ x: 9.5, y: 2.5, text: 'Computer', color: '#64748b' },
		{ x: 8, y: 1.5, text: 'Mac', color: '#64748b' },
		// Fruit Cluster (Organic) - Top Left
		{ x: 1, y: 9, text: 'Banana', color: '#eab308' },
		{ x: 2, y: 8.5, text: 'Orchard', color: '#eab308' },
		{ x: 1.5, y: 7.5, text: 'Vitamin', color: '#eab308' }
	];                            

	const apple_base = { pos: [5, 5], text: 'Apple (Neutral)' };
	const context_word = { pos: [2, 8], text: '"Juicy"' };
	// Subtle movement: The point lands in the "Fruit Quadrant" but not directly on the banana
	const z = [3.8, 6.2];          

	const traces = [              
		{                           
			x: landmarks.map(l => l.x), y: landmarks.map(l => l.y),
			mode: 'markers+text', text: landmarks.map(l => l.text),
			textposition: 'top center', marker: { size: 8, opacity: 0.4, color: landmarks.map(l => l.color) },
			name: 'Landmarks', type: 'scatter'
		},                        
		{ x: [apple_base.pos[0]], y: [apple_base.pos[1]], mode: 'markers+text', text: [apple_base.text],
			marker: { size: 12, color: '#94a3b8' }, name: 'Base Embedding', type: 'scatter' },
		{ x: [context_word.pos[0]], y: [context_word.pos[1]], mode: 'markers+text', text: [context_word.text],
			marker: { size: 12, color: '#10b981' }, name: 'Context Giver', type: 'scatter' },
		{ x: [apple_base.pos[0], z[0]], y: [apple_base.pos[1], z[1]], mode: 'lines',
			line: { dash: 'dot', color: '#f97316', width: 2 }, showlegend: false, type: 'scatter' },
		{ x: [z[0]], y: [z[1]], mode: 'markers+text', text: ['Apple (contextualized)'],
			marker: { size: 18, symbol: 'diamond', color: '#1e40af', line: {width: 2, color: '#fff'} },
			name: 'Result', type: 'scatter' }
	];                            

	const layout = {              
		title: 'Semantic Space: Nature vs. Technology',
		xaxis: { title: 'Tech Dimension', range: [0, 10] },
		yaxis: { title: 'Bio Dimension', range: [0, 10] },
	};                            
	Plotly.newPlot(containerId, traces, layout);
}                                 

function initKeyShift(containerId) {
	const landmarks = [           
		// Security & Infrastructure Cluster - Top Right
		{ x: 9, y: 9, text: 'Encryption', color: '#ef4444' },
		{ x: 8, y: 8.5, text: 'Security', color: '#ef4444' },
		{ x: 9.5, y: 8, text: 'SSH', color: '#ef4444' },
		{ x: 7.5, y: 9.5, text: 'Safety', color: '#ef4444' },
		// Music & Art Cluster - Bottom Left
		{ x: 1, y: 1.5, text: 'Melody', color: '#8b5cf6' },
		{ x: 2, y: 1, text: 'Music', color: '#8b5cf6' },
		{ x: 1.5, y: 2.5, text: 'Guitar', color: '#8b5cf6' }
	];                            

	const key_base = { pos: [5, 5], text: 'Key (Neutral)' };
	const context_word = { pos: [1.5, 1.5], text: '"Minor"' }; 
	// Shifted towards the Music cluster (Bottom Left)
	const z = [3.2, 2.8];          

	const traces = [              
		{                           
			x: landmarks.map(l => l.x), y: landmarks.map(l => l.y),
			mode: 'markers+text', text: landmarks.map(l => l.text),
			textposition: 'bottom center', marker: { size: 8, opacity: 0.4, color: landmarks.map(l => l.color) },
			name: 'Landmarks', type: 'scatter'
		},                        
		{ x: [key_base.pos[0]], y: [key_base.pos[1]], mode: 'markers+text', text: [key_base.text],
			marker: { size: 12, color: '#94a3b8' }, name: 'Base Embedding', type: 'scatter' },
		{ x: [context_word.pos[0]], y: [context_word.pos[1]], mode: 'markers+text', text: [context_word.text],
			marker: { size: 12, color: '#8b5cf6' }, name: 'Context Giver', type: 'scatter' },
		{ x: [key_base.pos[0], z[0]], y: [key_base.pos[1], z[1]], mode: 'lines',
			line: { dash: 'dot', color: '#f97316', width: 2 }, showlegend: false, type: 'scatter' },
		{ x: [z[0]], y: [z[1]], mode: 'markers+text', text: ['Key (Music)'],
			marker: { size: 18, symbol: 'diamond', color: '#1e40af', line: {width: 2, color: '#fff'} },
			name: 'Result', type: 'scatter' }
	];                            

	const layout = {              
		title: 'Semantic Space: Security vs. Music',                                                                                                                                                                                                                                                                                                                                                                           
		xaxis: { title: 'Artistic Axis', range: [0, 10] },
		yaxis: { title: 'Security Axis', range: [0, 10] },
	};                            
	Plotly.newPlot(containerId, traces, layout);
}

function initShiftExamples() {
	initAppleShift('apple-shift-plot');
	initKeyShift('key-shift-plot');
}

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

		Plotly.react(plotDiv, data, layout, {displayModeBar: false});

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

/* ============================================================
   ATTENTION GEOMETRY LAB — 1D, 2D, 3D interactive demos
   Requires: Plotly.js (already loaded)
   ============================================================ */

// ─────────────────── UTILITIES ───────────────────

function softmax(scores) {
	const max = Math.max(...scores);
	const exps = scores.map(s => Math.exp(s - max));
	const sum = exps.reduce((a, b) => a + b, 0);
	return exps.map(e => e / sum);
}

// ─────────────────── 1D ATTENTION ───────────────────

function updateAttn1D() {
	const q  = parseFloat(document.getElementById('attn1d-q').value);
	const k1 = parseFloat(document.getElementById('attn1d-k1').value);
	const v1 = parseFloat(document.getElementById('attn1d-v1').value);
	const k2 = parseFloat(document.getElementById('attn1d-k2').value);
	const v2 = parseFloat(document.getElementById('attn1d-v2').value);
	const k3 = parseFloat(document.getElementById('attn1d-k3').value);
	const v3 = parseFloat(document.getElementById('attn1d-v3').value);

	// Update labels
	document.getElementById('attn1d-q-val').innerText = q.toFixed(1);
	document.getElementById('attn1d-k1-val').innerText = k1.toFixed(1);
	document.getElementById('attn1d-v1-val').innerText = v1.toFixed(1);
	document.getElementById('attn1d-k2-val').innerText = k2.toFixed(1);
	document.getElementById('attn1d-v2-val').innerText = v2.toFixed(1);
	document.getElementById('attn1d-k3-val').innerText = k3.toFixed(1);
	document.getElementById('attn1d-v3-val').innerText = v3.toFixed(1);

	// Scores (d_k=1, so sqrt=1, no scaling)
	const scores = [q * k1, q * k2, q * k3];
	const weights = softmax(scores);
	const output = weights[0] * v1 + weights[1] * v2 + weights[2] * v3;

	// ── Number line plot ──
	const numberLineTraces = [
		// Query marker
		{
			x: [q], y: [0.6], mode: 'markers+text', text: ['Q=' + q.toFixed(1)],
			textposition: 'top center',
			marker: { size: 16, color: '#2563eb', symbol: 'diamond' },
			name: 'Query', showlegend: true
		},
		// Keys
		{
			x: [k1], y: [0.3], mode: 'markers+text', text: ['K₁=' + k1.toFixed(1)],
			textposition: 'bottom center',
			marker: { size: 12, color: '#dc2626', symbol: 'circle' },
			name: 'Key 1'
		},
		{
			x: [k2], y: [0.3], mode: 'markers+text', text: ['K₂=' + k2.toFixed(1)],
			textposition: 'bottom center',
			marker: { size: 12, color: '#16a34a', symbol: 'circle' },
			name: 'Key 2'
		},
		{
			x: [k3], y: [0.3], mode: 'markers+text', text: ['K₃=' + k3.toFixed(1)],
			textposition: 'bottom center',
			marker: { size: 12, color: '#9333ea', symbol: 'circle' },
			name: 'Key 3'
		},
		// Values on a separate row
		{
			x: [v1], y: [-0.3], mode: 'markers+text', text: ['V₁=' + v1.toFixed(1)],
			textposition: 'bottom center',
			marker: { size: 10, color: '#dc2626', symbol: 'square', opacity: 0.6 },
			name: 'Value 1'
		},
		{
			x: [v2], y: [-0.3], mode: 'markers+text', text: ['V₂=' + v2.toFixed(1)],
			textposition: 'bottom center',
			marker: { size: 10, color: '#16a34a', symbol: 'square', opacity: 0.6 },
			name: 'Value 2'
		},
		{
			x: [v3], y: [-0.3], mode: 'markers+text', text: ['V₃=' + v3.toFixed(1)],
			textposition: 'bottom center',
			marker: { size: 10, color: '#9333ea', symbol: 'square', opacity: 0.6 },
			name: 'Value 3'
		},
		// Output
		{
			x: [output], y: [-0.3], mode: 'markers+text', text: ['Out=' + output.toFixed(2)],
			textposition: 'top center',
			marker: { size: 18, color: '#f59e0b', symbol: 'star', line: { width: 2, color: '#000' } },
			name: 'Output'
		}
	];

	// Score lines from Q to each K
	const colors = ['#dc2626', '#16a34a', '#9333ea'];
	[k1, k2, k3].forEach((k, i) => {
		numberLineTraces.push({
			x: [q, k], y: [0.6, 0.3],
			mode: 'lines', line: { color: colors[i], width: 1 + weights[i] * 8, dash: 'dot' },
			showlegend: false, hoverinfo: 'none'
		});
	});

	Plotly.react('attn1d-numberline', numberLineTraces, {
		xaxis: { range: [-6, 6], title: 'Value on number line', zeroline: true, zerolinewidth: 2 },
		yaxis: { range: [-0.7, 1.0], visible: false, fixedrange: true },
		margin: { l: 30, r: 30, t: 10, b: 40 },
		showlegend: false,
		annotations: [
			{ x: -5.5, y: 0.6, text: '<b>Keys & Query</b>', showarrow: false, font: { size: 11, color: '#475569' } },
			{ x: -5.5, y: -0.3, text: '<b>Values & Output</b>', showarrow: false, font: { size: 11, color: '#475569' } }
		],
		shapes: [
			{ type: 'line', x0: -6, x1: 6, y0: 0.0, y1: 0.0, line: { color: '#cbd5e1', width: 1, dash: 'dash' } }
		]
	}, { responsive: true, displayModeBar: false });

	// ── Weights bar chart ──
	Plotly.react('attn1d-weights', [{
		x: ['α₁', 'α₂', 'α₃'],
		y: weights,
		type: 'bar',
		marker: { color: colors },
		text: weights.map(w => (w * 100).toFixed(1) + '%'),
		textposition: 'outside'
	}], {
		title: { text: 'Attention Weights', font: { size: 13 } },
		yaxis: { range: [0, 1.1], title: 'Weight' },
		margin: { l: 40, r: 10, t: 35, b: 30 }
	}, { responsive: true, displayModeBar: false });

	// ── Output visualization ──
	// Show the weighted contributions as stacked
	const contributions = [weights[0] * v1, weights[1] * v2, weights[2] * v3];
	Plotly.react('attn1d-output', [
		{
			x: ['α₁·V₁', 'α₂·V₂', 'α₃·V₃', 'Output'],
			y: [...contributions, output],
			type: 'bar',
			marker: { color: [...colors, '#f59e0b'] },
			text: [...contributions.map(c => c.toFixed(2)), output.toFixed(2)],
			textposition: 'outside'
		}
	], {
		title: { text: 'Weighted Values → Output', font: { size: 13 } },
		yaxis: { title: 'Value' },
		margin: { l: 40, r: 10, t: 35, b: 30 }
	}, { responsive: true, displayModeBar: false });

	// ── Math display ──
	document.getElementById('attn1d-math').innerHTML = `
	Scores: $q \\cdot k_j = [${scores.map(s => s.toFixed(2)).join(',\\;')}]$ &nbsp;→&nbsp;
	$\\alpha = \\text{softmax}([${scores.map(s => s.toFixed(2)).join(',\\;')}]) = [${weights.map(w => w.toFixed(3)).join(',\\;')}]$ <br>
	Output: $\\sum \\alpha_j v_j = ${weights[0].toFixed(3)} \\cdot ${v1.toFixed(1)} + ${weights[1].toFixed(3)} \\cdot ${v2.toFixed(1)} + ${weights[2].toFixed(3)} \\cdot ${v3.toFixed(1)} = ${output.toFixed(3)}$
    `;
	if (typeof render_temml === 'function') render_temml();
}

// ─────────────────── 2D ATTENTION ───────────────────

// Fixed keys and values for 2D demo
const attn2d_keys = [
	{ k: [2.5, 1.0], v: [3.0, 0.5], color: '#dc2626', label: '1' },
	{ k: [-1.0, 2.0], v: [-1.0, 3.0], color: '#16a34a', label: '2' },
	{ k: [0.5, -2.5], v: [1.0, -2.0], color: '#9333ea', label: '3' }
];

function updateAttn2D() {
	const angle = parseFloat(document.getElementById('attn2d-qangle').value);
	const mag = parseFloat(document.getElementById('attn2d-qmag').value);
	const useScale = document.getElementById('attn2d-scale').checked;

	document.getElementById('attn2d-qangle-val').innerText = angle;
	document.getElementById('attn2d-qmag-val').innerText = mag.toFixed(1);

	const rad = angle * Math.PI / 180;
	const q = [mag * Math.cos(rad), mag * Math.sin(rad)];
	const dk = useScale ? Math.sqrt(2) : 1.0;

	// Compute scores
	const scores = attn2d_keys.map(kv => (q[0] * kv.k[0] + q[1] * kv.k[1]) / dk);
	const weights = softmax(scores);

	// Output = weighted sum of values
	const out = [0, 0];
	attn2d_keys.forEach((kv, i) => {
		out[0] += weights[i] * kv.v[0];
		out[1] += weights[i] * kv.v[1];
	});

	// ── Vector plot ──
	const traces = [];

	// Draw convex hull of values (filled polygon)
	const hullX = attn2d_keys.map(kv => kv.v[0]);
	const hullY = attn2d_keys.map(kv => kv.v[1]);
	hullX.push(hullX[0]); hullY.push(hullY[0]); // close polygon
	traces.push({
		x: hullX, y: hullY, mode: 'lines', fill: 'toself',
		fillcolor: 'rgba(251, 191, 36, 0.15)', line: { color: '#f59e0b', width: 1, dash: 'dot' },
		name: 'Value Convex Hull', hoverinfo: 'none'
	});

	// Query arrow
	traces.push({
		x: [0, q[0]], y: [0, q[1]], mode: 'lines+markers',
		line: { color: '#2563eb', width: 4 },
		marker: { size: [0, 10], symbol: 'arrow', angleref: 'previous' },
		name: 'Query'
	});

	// Key arrows and value points
	attn2d_keys.forEach((kv, i) => {
		// Key arrow
		traces.push({
			x: [0, kv.k[0]], y: [0, kv.k[1]], mode: 'lines+markers',
			line: { color: kv.color, width: 2 + weights[i] * 6 },
			marker: { size: [0, 8], symbol: 'arrow', angleref: 'previous' },
			name: 'K' + kv.label
		});
		// Value point
		traces.push({
			x: [kv.v[0]], y: [kv.v[1]], mode: 'markers+text',
			text: ['V' + kv.label], textposition: 'top right',
			marker: { size: 12, color: kv.color, symbol: 'square', opacity: 0.7 },
			name: 'V' + kv.label, showlegend: false
		});
		// Value point
		traces.push({
			x: [kv.v[0]], y: [kv.v[1]], mode: 'markers+text',
			text: ['V' + kv.label], textposition: 'top right',
			marker: { size: 12, color: kv.color, symbol: 'square', opacity: 0.7 },
			name: 'V' + kv.label, showlegend: false
		});

		// Dashed line from key tip to value point (shows K→V mapping)
		traces.push({
			x: [kv.k[0], kv.v[0]], y: [kv.k[1], kv.v[1]],
			mode: 'lines', line: { color: kv.color, width: 1, dash: 'dot' },
			showlegend: false, hoverinfo: 'none'
		});

		// Weight annotation near key arrow
		const midX = kv.k[0] * 0.6;
		const midY = kv.k[1] * 0.6;
		traces.push({
			x: [midX], y: [midY], mode: 'text',
			text: [(weights[i] * 100).toFixed(1) + '%'],
			textfont: { size: 11, color: kv.color, weight: 'bold' },
			showlegend: false, hoverinfo: 'none'
		});
	});

	// Output point (weighted average of values)
	traces.push({
		x: [out[0]], y: [out[1]], mode: 'markers+text',
		text: ['Output'], textposition: 'bottom center',
		marker: { size: 18, color: '#f59e0b', symbol: 'star', line: { width: 2, color: '#000' } },
		name: 'Output', showlegend: false
	});

	// Lines from output to each value (thickness = weight)
	attn2d_keys.forEach((kv, i) => {
		traces.push({
			x: [out[0], kv.v[0]], y: [out[1], kv.v[1]],
			mode: 'lines', line: { color: kv.color, width: 1 + weights[i] * 6, dash: 'dash' },
			showlegend: false, hoverinfo: 'none'
		});
	});

	const axRange = [-4, 4];
	Plotly.react('attn2d-vectors', traces, {
		xaxis: { range: axRange, zeroline: true, zerolinewidth: 2, zerolinecolor: '#94a3b8', title: 'Dim 1' },
		yaxis: { range: axRange, zeroline: true, zerolinewidth: 2, zerolinecolor: '#94a3b8', title: 'Dim 2', scaleanchor: 'x' },
		margin: { l: 50, r: 20, t: 10, b: 50 },
		showlegend: false,
		annotations: [
			{ x: q[0], y: q[1], text: '<b>Q</b>', showarrow: true, arrowhead: 0, ax: 15, ay: -15, font: { color: '#2563eb', size: 14 } }
		]
	}, { responsive: true, displayModeBar: false });

	// ── Weights bar chart ──
	Plotly.react('attn2d-weights', [{
		x: ['α₁', 'α₂', 'α₃'],
		y: weights,
		type: 'bar',
		marker: { color: attn2d_keys.map(kv => kv.color) },
		text: weights.map(w => (w * 100).toFixed(1) + '%'),
		textposition: 'outside'
	}], {
		title: { text: 'Attention Weights', font: { size: 13 } },
		yaxis: { range: [0, 1.1], title: 'Weight' },
		margin: { l: 40, r: 10, t: 35, b: 30 }
	}, { responsive: true, displayModeBar: false });

	// ── Math display ──
	const scaleLabel = useScale ? '\\sqrt{2}' : '1';
	document.getElementById('attn2d-math').innerHTML = `
	Scores: $\\frac{q \\cdot k_j}{${scaleLabel}} = [${scores.map(s => s.toFixed(2)).join(',\\;')}]$ <br>
	$\\alpha = [${weights.map(w => w.toFixed(3)).join(',\\;')}]$ <br>
	Out: $(${out[0].toFixed(2)},\\; ${out[1].toFixed(2)})$
    `;
	if (typeof render_temml === 'function') render_temml();
}

// ─────────────────── 3D ATTENTION ───────────────────

// Fixed keys and values for 3D demo
const attn3d_keys = [
	{ k: [2.0, 1.0, 0.5],  v: [2.5, 0.5, 1.0],  color: '#dc2626', label: '1' },
	{ k: [-1.0, 2.0, 0.5], v: [-1.5, 2.5, 0.0],  color: '#16a34a', label: '2' },
	{ k: [0.5, -0.5, 2.0], v: [0.0, -1.0, 2.5],  color: '#9333ea', label: '3' },
	{ k: [-1.0, -1.0, -1.5], v: [-2.0, -0.5, -1.5], color: '#0891b2', label: '4' }
];

function updateAttn3D() {
	const theta = parseFloat(document.getElementById('attn3d-theta').value);
	const phi = parseFloat(document.getElementById('attn3d-phi').value);
	const mag = parseFloat(document.getElementById('attn3d-mag').value);

	document.getElementById('attn3d-theta-val').innerText = theta;
	document.getElementById('attn3d-phi-val').innerText = phi;
	document.getElementById('attn3d-mag-val').innerText = mag.toFixed(1);

	const thetaRad = theta * Math.PI / 180;
	const phiRad = phi * Math.PI / 180;
	const q = [
		mag * Math.sin(thetaRad) * Math.cos(phiRad),
		mag * Math.sin(thetaRad) * Math.sin(phiRad),
		mag * Math.cos(thetaRad)
	];

	const dk = Math.sqrt(3);

	// Compute scores
	const scores = attn3d_keys.map(kv =>
		(q[0] * kv.k[0] + q[1] * kv.k[1] + q[2] * kv.k[2]) / dk
	);
	const weights = softmax(scores);

	// Output = weighted sum of values
	const out = [0, 0, 0];
	attn3d_keys.forEach((kv, i) => {
		out[0] += weights[i] * kv.v[0];
		out[1] += weights[i] * kv.v[1];
		out[2] += weights[i] * kv.v[2];
	});

	// ── 3D Scene ──
	const traces = [];

	// Origin point
	traces.push({
		type: 'scatter3d',
		x: [0], y: [0], z: [0],
		mode: 'markers',
		marker: { size: 4, color: '#94a3b8' },
		name: 'Origin', showlegend: false
	});

	// Query arrow (line + cone)
	traces.push({
		type: 'scatter3d',
		x: [0, q[0]], y: [0, q[1]], z: [0, q[2]],
		mode: 'lines',
		line: { color: '#2563eb', width: 8 },
		name: 'Query'
	});
	traces.push({
		type: 'cone',
		x: [q[0]], y: [q[1]], z: [q[2]],
		u: [q[0]], v: [q[1]], w: [q[2]],
		sizemode: 'absolute', sizeref: 0.25, anchor: 'tip',
		colorscale: [[0, '#2563eb'], [1, '#2563eb']], showscale: false,
		name: 'Q tip', showlegend: false
	});

	// Key arrows and value points
	attn3d_keys.forEach((kv, i) => {
		// Key arrow
		traces.push({
			type: 'scatter3d',
			x: [0, kv.k[0]], y: [0, kv.k[1]], z: [0, kv.k[2]],
			mode: 'lines',
			line: { color: kv.color, width: 3 + weights[i] * 10 },
			name: 'K' + kv.label
		});
		traces.push({
			type: 'cone',
			x: [kv.k[0]], y: [kv.k[1]], z: [kv.k[2]],
			u: [kv.k[0]], v: [kv.k[1]], w: [kv.k[2]],
			sizemode: 'absolute', sizeref: 0.15, anchor: 'tip',
			colorscale: [[0, kv.color], [1, kv.color]], showscale: false,
			showlegend: false
		});

		// Value point
		traces.push({
			type: 'scatter3d',
			x: [kv.v[0]], y: [kv.v[1]], z: [kv.v[2]],
			mode: 'markers+text',
			text: ['V' + kv.label],
			marker: { size: 6, color: kv.color, symbol: 'diamond', opacity: 0.8 },
			showlegend: false
		});

		// Line from output to each value (weight-proportional)
		traces.push({
			type: 'scatter3d',
			x: [out[0], kv.v[0]], y: [out[1], kv.v[1]], z: [out[2], kv.v[2]],
			mode: 'lines',
			line: { color: kv.color, width: 1 + weights[i] * 8, dash: 'dash' },
			showlegend: false
		});
	});

	// Convex hull of values (translucent mesh)
	// For 4 points, draw all 4 triangular faces
	const vPts = attn3d_keys.map(kv => kv.v);
	const hullIndices = [
		[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]
	];
	traces.push({
		type: 'mesh3d',
		x: vPts.map(p => p[0]),
		y: vPts.map(p => p[1]),
		z: vPts.map(p => p[2]),
		i: hullIndices.map(f => f[0]),
		j: hullIndices.map(f => f[1]),
		k: hullIndices.map(f => f[2]),
		opacity: 0.12,
		color: '#f59e0b',
		name: 'Value Hull',
		showlegend: true
	});

	// Output point (gold star)
	traces.push({
		type: 'scatter3d',
		x: [out[0]], y: [out[1]], z: [out[2]],
		mode: 'markers+text',
		text: ['Output'],
		textposition: 'top center',
		marker: { size: 10, color: '#f59e0b', symbol: 'diamond', line: { width: 2, color: '#000' } },
		name: 'Output'
	});

	const axRange3d = [-3.5, 3.5];
	Plotly.react('attn3d-scene', traces, {
		scene: {
			xaxis: { range: axRange3d, title: 'Dim 1' },
			yaxis: { range: axRange3d, title: 'Dim 2' },
			zaxis: { range: axRange3d, title: 'Dim 3' },
			camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } }
		},
		margin: { l: 0, r: 0, t: 0, b: 0 },
		showlegend: false
	}, { responsive: true, displayModeBar: false });

	// ── Weights bar chart ──
	Plotly.react('attn3d-weights', [{
		x: attn3d_keys.map(kv => 'α' + kv.label),
		y: weights,
		type: 'bar',
		marker: { color: attn3d_keys.map(kv => kv.color) },
		text: weights.map(w => (w * 100).toFixed(1) + '%'),
		textposition: 'outside'
	}], {
		title: { text: 'Attention Weights', font: { size: 13 } },
		yaxis: { range: [0, 1.1], title: 'Weight' },
		margin: { l: 40, r: 10, t: 35, b: 30 }
	}, { responsive: true, displayModeBar: false });

	// ── Math display ──
	document.getElementById('attn3d-math').innerHTML = `
	$q = (${q.map(v => v.toFixed(2)).join(',\\;')})$ <br>
	Scores$/\\sqrt{3}$: $[${scores.map(s => s.toFixed(2)).join(',\\;')}]$ <br>
	$\\alpha = [${weights.map(w => w.toFixed(3)).join(',\\;')}]$ <br>
	Out: $(${out.map(v => v.toFixed(2)).join(',\\;')})$<br>
	<span style="color:#f59e0b;">★ Output is inside the convex hull of V₁–V₄</span>
    `;
	if (typeof render_temml === 'function') render_temml();
}

// ─────────────────── INITIALIZATION ───────────────────

async function loadAttentionModule() {
	updateLoadingStatus("Loading section about activation functions...");
	SelfAttentionLab.init();
	initShiftExamples();
	renderDotProductLab();
	runAttention();
	runUniverse();
	updateAttn1D();
	updateAttn2D();
	updateAttn3D();
	return Promise.resolve();
}
