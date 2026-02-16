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

/* ============================================================
   ATTENTION GEOMETRY — NAMED CONCEPTS + LIVE SENTENCES
   Cartesian canvas. No Plotly. Colorful. No overlap.
   ============================================================ */

/* ============================================================
   ATTENTION GEOMETRY — NAMED CONCEPTS + RICH SENTENCES
   ============================================================ */

function softmax(scores) {
    const max = Math.max(...scores);
    const exps = scores.map(s => Math.exp(s - max));
    const sum  = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

/* ─── Canvas helpers (same as before) ─── */

function drawDot(ctx, x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha != null ? alpha : 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}

function drawDiamond(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = color;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();
}

function drawStar(ctx, cx, cy, r, color) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.4;
        ctx[i === 0 ? 'moveTo' : 'lineTo'](cx + rad * Math.cos(a), cy + rad * Math.sin(a));
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

function drawLabel(ctx, text, x, y, color, size, align, bold) {
    ctx.font = `${bold ? 'bold ' : ''}${size || 13}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = color || '#1e293b';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

function drawSquare(ctx, x, y, s, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha != null ? alpha : 1;
    ctx.fillStyle = color;
    ctx.fillRect(x - s, y - s, s * 2, s * 2);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - s, y - s, s * 2, s * 2);
    ctx.restore();
}


/* ═══════════════════════════════════════════════════════════
   1D — "How Financial Is It?"
   ═══════════════════════════════════════════════════════════ */

const KV1 = [
    { k: -3.0, v: -3.5, color: '#10b981', kIcon: '🌊', kName: 'river',  vIcon: '💧', vName: 'water' },
    { k:  3.5, v:  4.0, color: '#f59e0b', kIcon: '🏦', kName: 'vault',  vIcon: '💰', vName: 'money' },
    { k:  0.3, v: -1.0, color: '#8b5cf6', kIcon: '✈️', kName: 'tilt',   vIcon: '🔄', vName: 'turn'  }
];

const SENTENCES_1D = [
	// Bucket 0: river/water — q from -5.0 to about -0.8
	[
		{ min: 0.99, text: 'A <b style="color:#0ea5e9">catastrophic flood</b> obliterated the <b style="color:#10b981">💧 bank</b>, leaving nothing but <b style="color:#10b981">exposed bedrock</b> where the <b style="color:#10b981">meadow</b> once stood.' },
		{ min: 0.98, text: 'The <b style="color:#10b981">💧 bank</b> <b style="color:#0ea5e9">collapsed</b> with a <b style="color:#0ea5e9">thunderous crack</b>, dumping <b style="color:#10b981">tons of earth</b> into the <b style="color:#10b981">swollen rapids</b>.' },
		{ min: 0.97, text: '<b style="color:#0ea5e9">Torrential rains</b> turned the <b style="color:#10b981">💧 bank</b> into a <b style="color:#10b981">mudslide</b>, burying the <b style="color:#f97316">hiking trail</b> under <b style="color:#10b981">three feet of silt</b>.' },
		{ min: 0.96, text: 'After the <b style="color:#0ea5e9">dam</b> broke, the <b style="color:#10b981">💧 bank</b> was <b style="color:#0ea5e9">swallowed whole</b> by <b style="color:#10b981">floodwaters</b> within minutes.' },
		{ min: 0.95, text: 'Geologists measured the <b style="color:#10b981">💧 bank</b> retreating <b style="color:#0ea5e9">six inches per hour</b> as the <b style="color:#10b981">floodwaters</b> tore at the <b style="color:#10b981">clay</b>.' },
		{ min: 0.93, text: 'A <b style="color:#10b981">massive cottonwood</b> toppled from the <b style="color:#10b981">💧 bank</b> into the <b style="color:#0ea5e9">churning current</b>, creating a <b style="color:#10b981">natural dam</b>.' },
		{ min: 0.91, text: '<b style="color:#10b981">Salmon</b> leapt upstream along the <b style="color:#10b981">💧 bank</b> during the <b style="color:#0ea5e9">spring run</b>, silver flashes in the <b style="color:#0ea5e9">rapids</b>.' },
		{ min: 0.89, text: 'A <b style="color:#10b981">beaver lodge</b> sat wedged against the <b style="color:#10b981">💧 bank</b>, blocking the <b style="color:#0ea5e9">side channel</b> entirely.' },
		{ min: 0.87, text: 'A <b style="color:#10b981">kingfisher</b> perched on a branch overhanging the <b style="color:#10b981">💧 bank</b>, eyeing the <b style="color:#0ea5e9">water</b> below.' },
		{ min: 0.85, text: '<b style="color:#10b981">Moss</b> and <b style="color:#10b981">ferns</b> clung to the steep <b style="color:#10b981">💧 bank</b> above the <b style="color:#0ea5e9">waterfall</b>.' },
		{ min: 0.83, text: 'The <b style="color:#0ea5e9">kayaker</b> paddled close to the <b style="color:#10b981">💧 bank</b>, dodging <b style="color:#10b981">overhanging roots</b> and <b style="color:#10b981">low branches</b>.' },
		{ min: 0.80, text: '<b style="color:#10b981">Wildflowers</b> lined the <b style="color:#10b981">💧 bank</b> as far as the eye could see, swaying in the <b style="color:#0ea5e9">breeze</b>.' },
		{ min: 0.77, text: 'They spread a <b style="color:#f97316">blanket</b> on the grassy <b style="color:#10b981">💧 bank</b> for a <b style="color:#f97316">picnic</b> by the <b style="color:#0ea5e9">stream</b>.' },
		{ min: 0.74, text: 'A <b style="color:#10b981">heron</b> stood motionless on the <b style="color:#10b981">💧 bank</b>, watching for <b style="color:#0ea5e9">fish</b> in the <b style="color:#0ea5e9">shallows</b>.' },
		{ min: 0.71, text: '<b style="color:#f97316">Children</b> skipped <b style="color:#94a3b8">stones</b> from the <b style="color:#10b981">💧 bank</b> into the calm <b style="color:#0ea5e9">water</b>.' },
		{ min: 0.68, text: 'An <b style="color:#10b981">otter</b> slid down the <b style="color:#10b981">💧 bank</b> and splashed into the <b style="color:#0ea5e9">creek</b> with a happy chirp.' },
		{ min: 0.65, text: 'The <b style="color:#f97316">path</b> followed the <b style="color:#10b981">💧 bank</b> of the <b style="color:#0ea5e9">creek</b> through the <b style="color:#10b981">woods</b>.' },
		{ min: 0.62, text: 'The <b style="color:#0ea5e9">river</b> had eroded the <b style="color:#10b981">💧 bank</b> into a gentle <b style="color:#f97316">slope</b> over the centuries.' },
		{ min: 0.58, text: '<b style="color:#10b981">Reeds</b> rustled along the <b style="color:#10b981">💧 bank</b> as the <b style="color:#0ea5e9">tide</b> slowly came in.' },
		{ min: 0.54, text: 'She sat on the <b style="color:#10b981">💧 bank</b> and dipped her <b style="color:#f97316">toes</b> in the <b style="color:#0ea5e9">water</b>.' },
		{ min: 0.50, text: 'The word "bank" here leans toward <b style="color:#10b981">💧 water</b> — probably a <b style="color:#10b981">riverbank</b>.' },
		{ min: 0.45, text: 'There\'s a pull toward <b style="color:#10b981">💧 nature</b>, but the meaning isn\'t fully settled yet.' },
		{ min: 0.40, text: 'A faint hint of <b style="color:#10b981">💧 river</b>, but the context is still wide open.' },
		{ min: 0.00, text: 'The word "bank" is almost <b style="color:#94a3b8">neutral</b>.' }
	],
	// Bucket 1: vault/money — q from about +0.8 to +5.0
	[
		{ min: 0.99, text: '<b style="color:#dc2626">FBI agents</b> seized <b style="color:#f59e0b">servers</b> from the <b style="color:#f59e0b">💰 bank\'s</b> headquarters in a <b style="color:#dc2626">predawn raid</b> linked to <b style="color:#f59e0b">money laundering</b>.' },
		{ min: 0.98, text: 'The <b style="color:#f59e0b">💰 bank</b> was placed under <b style="color:#dc2626">federal receivership</b> after <b style="color:#f59e0b">$2 billion</b> in <b style="color:#f59e0b">toxic assets</b> surfaced on its <b style="color:#f59e0b">balance sheet</b>.' },
		{ min: 0.97, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">CEO</b> was <b style="color:#dc2626">indicted</b> on <b style="color:#dc2626">fourteen counts</b> of <b style="color:#f59e0b">securities fraud</b>.' },
		{ min: 0.96, text: '<b style="color:#dc2626">Regulators</b> shut down the <b style="color:#f59e0b">💰 bank</b> overnight after a <b style="color:#dc2626">run</b> drained its <b style="color:#f59e0b">cash reserves</b> to zero.' },
		{ min: 0.95, text: 'The <b style="color:#f59e0b">💰 bank vault</b> held <b style="color:#f59e0b">$40 million</b> in <b style="color:#eab308">gold reserves</b> behind <b style="color:#94a3b8">three-foot steel doors</b>.' },
		{ min: 0.93, text: '<b style="color:#dc2626">Armored trucks</b> lined up outside the <b style="color:#f59e0b">💰 bank</b> to transport <b style="color:#f59e0b">$100 million</b> in <b style="color:#f59e0b">bearer bonds</b>.' },
		{ min: 0.91, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">trading floor</b> erupted in <b style="color:#dc2626">panic</b> as the <b style="color:#f59e0b">stock</b> plummeted <b style="color:#dc2626">30%</b>.' },
		{ min: 0.89, text: '<b style="color:#dc2626">Federal investigators</b> subpoenaed every record from the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">offshore accounts</b>.' },
		{ min: 0.87, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">quarterly earnings</b> shattered every <b style="color:#f59e0b">Wall Street</b> forecast.' },
		{ min: 0.85, text: 'The <b style="color:#f59e0b">💰 bank</b> <b style="color:#dc2626">foreclosed</b> on three <b style="color:#f59e0b">properties</b> this <b style="color:#f59e0b">quarter</b> alone.' },
		{ min: 0.83, text: '<b style="color:#dc2626">Protesters</b> gathered outside the <b style="color:#f59e0b">💰 bank</b> demanding lower <b style="color:#f59e0b">interest rates</b> on <b style="color:#f59e0b">student loans</b>.' },
		{ min: 0.80, text: 'She nervously entered the <b style="color:#f59e0b">💰 bank</b> to negotiate the terms of her <b style="color:#f59e0b">business loan</b>.' },
		{ min: 0.77, text: 'The <b style="color:#f59e0b">💰 bank</b> approved her <b style="color:#f59e0b">mortgage</b> application after weeks of <b style="color:#94a3b8">paperwork</b>.' },
		{ min: 0.74, text: 'She deposited her <b style="color:#f59e0b">paycheck</b> at the <b style="color:#f59e0b">💰 bank</b> on <b style="color:#94a3b8">Friday afternoon</b>.' },
		{ min: 0.71, text: 'He checked his <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">balance</b> nervously before making the <b style="color:#f59e0b">purchase</b>.' },
		{ min: 0.68, text: 'The <b style="color:#f59e0b">💰 bank</b> sent a letter about new <b style="color:#f59e0b">savings account</b> terms and <b style="color:#f59e0b">fees</b>.' },
		{ min: 0.65, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">ATM</b> was out of <b style="color:#f59e0b">cash</b> again this <b style="color:#94a3b8">weekend</b>.' },
		{ min: 0.62, text: 'The <b style="color:#f59e0b">💰 bank</b> <b style="color:#94a3b8">branch</b> on <b style="color:#94a3b8">Main Street</b> was always <b style="color:#94a3b8">crowded</b> at <b style="color:#94a3b8">noon</b>.' },
		{ min: 0.58, text: 'She received a <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">statement</b> in the <b style="color:#94a3b8">mail</b> and tossed it on the <b style="color:#94a3b8">counter</b>.' },
		{ min: 0.54, text: 'He needed to visit the <b style="color:#f59e0b">💰 bank</b> before it <b style="color:#94a3b8">closed</b> at <b style="color:#94a3b8">five</b>.' },
		{ min: 0.50, text: '"Bank" is starting to sound like <b style="color:#f59e0b">💰 finance</b> — maybe a <b style="color:#f59e0b">loan office</b>?' },
		{ min: 0.45, text: 'There\'s a pull toward <b style="color:#f59e0b">💰 money</b>, but it could go either way.' },
		{ min: 0.40, text: 'A faint whiff of <b style="color:#f59e0b">💰 money</b>, but nothing conclusive yet.' },
		{ min: 0.00, text: '"Bank" is ambiguous — a slight lean toward <b style="color:#f59e0b">💰 finance</b>, but barely.' }
	],
	// Index 2 = bench/park dominant
	[
		{ min: 0.64, text: 'The <b style="color:#8b5cf6">fighter jet</b> <b style="color:#8b5cf6">🔄 banked</b> so hard the <b style="color:#dc2626">wingtip</b> nearly scraped the <b style="color:#10b981">canyon wall</b>, pulling <b style="color:#dc2626">seven Gs</b>.' },
		{ min: 0.63, text: 'At <b style="color:#8b5cf6">400 knots</b>, the pilot <b style="color:#8b5cf6">🔄 banked</b> the aircraft into a <b style="color:#dc2626">near-vertical turn</b> to evade the <b style="color:#dc2626">missile lock</b>.' },
		{ min: 0.62, text: 'The <b style="color:#8b5cf6">stunt plane</b> <b style="color:#8b5cf6">🔄 banked</b> upside down over the <b style="color:#94a3b8">airshow crowd</b>, trailing <b style="color:#dc2626">red smoke</b>.' },
		{ min: 0.61, text: 'She <b style="color:#8b5cf6">🔄 banked</b> the <b style="color:#8b5cf6">helicopter</b> sharply to avoid the <b style="color:#dc2626">power lines</b> looming out of the <b style="color:#94a3b8">fog</b>.' },
		{ min: 0.60, text: 'The <b style="color:#8b5cf6">race car</b> <b style="color:#8b5cf6">🔄 banked</b> through the <b style="color:#94a3b8">curve</b> at <b style="color:#dc2626">180 mph</b>, tires screaming on the <b style="color:#94a3b8">asphalt</b>.' },
		{ min: 0.59, text: 'The <b style="color:#8b5cf6">airliner</b> <b style="color:#8b5cf6">🔄 banked</b> gently to the <b style="color:#94a3b8">left</b> as it began its <b style="color:#94a3b8">approach</b> into <b style="color:#94a3b8">O\'Hare</b>.' },
		{ min: 0.58, text: 'He <b style="color:#8b5cf6">🔄 banked</b> the <b style="color:#8b5cf6">billiard shot</b> off the <b style="color:#94a3b8">cushion</b> and sank the <b style="color:#eab308">eight ball</b> cleanly.' },
		{ min: 0.57, text: 'The <b style="color:#8b5cf6">drone</b> <b style="color:#8b5cf6">🔄 banked</b> around the <b style="color:#10b981">lighthouse</b>, its <b style="color:#94a3b8">camera</b> capturing the <b style="color:#0ea5e9">coastline</b>.' },
		{ min: 0.56, text: 'She <b style="color:#8b5cf6">🔄 banked</b> the <b style="color:#8b5cf6">basketball</b> off the <b style="color:#94a3b8">backboard</b> for a perfect <b style="color:#eab308">layup</b>.' },
		{ min: 0.55, text: 'The <b style="color:#8b5cf6">motorcycle</b> <b style="color:#8b5cf6">🔄 banked</b> low through the <b style="color:#94a3b8">hairpin turn</b>, the rider\'s <b style="color:#94a3b8">knee</b> brushing the <b style="color:#94a3b8">pavement</b>.' },
		{ min: 0.54, text: 'The <b style="color:#8b5cf6">Cessna</b> <b style="color:#8b5cf6">🔄 banked</b> over the <b style="color:#10b981">valley</b>, giving passengers a view of the <b style="color:#10b981">autumn foliage</b>.' },
		{ min: 0.53, text: 'He <b style="color:#8b5cf6">🔄 banked</b> the <b style="color:#8b5cf6">cue ball</b> off two <b style="color:#94a3b8">rails</b> in a trick shot that left the <b style="color:#94a3b8">bar</b> silent.' },
		{ min: 0.52, text: 'The <b style="color:#8b5cf6">glider</b> <b style="color:#8b5cf6">🔄 banked</b> into a <b style="color:#0ea5e9">thermal</b>, spiraling upward without a sound.' },
		{ min: 0.51, text: 'The <b style="color:#8b5cf6">bobsled</b> <b style="color:#8b5cf6">🔄 banked</b> through the <b style="color:#0ea5e9">ice channel</b> at <b style="color:#dc2626">terrifying speed</b>.' },
		{ min: 0.50, text: '"Bank" here feels like <b style="color:#8b5cf6">🔄 a turn</b> — something <b style="color:#8b5cf6">tilting</b> or <b style="color:#8b5cf6">angling</b>.' },
		{ min: 0.48, text: 'There\'s a pull toward <b style="color:#8b5cf6">🔄 motion</b> and <b style="color:#8b5cf6">turning</b>, but the meaning isn\'t locked in.' },
		{ min: 0.46, text: 'A gentle lean toward <b style="color:#8b5cf6">🔄 banking a turn</b>, but still ambiguous.' },
		{ min: 0.44, text: 'A whisper of <b style="color:#8b5cf6">🔄 aviation</b>, but the context could shift any moment.' },
		{ min: 0.42, text: '"Bank" is ambiguous — a slight lean toward <b style="color:#8b5cf6">🔄 a turn or tilt</b>, but barely.' },
		{ min: 0.00, text: 'The word "bank" is almost <b style="color:#94a3b8">neutral</b>.' }
	]
];

const SENTENCES_2D = [
	// Index 0 = river/water dominant
	[
		{ min: 0.975, text: 'The <b style="color:#10b981">💧 river bank</b> completely <b style="color:#0ea5e9">collapsed</b> into the <b style="color:#10b981">raging torrent</b>, taking a <b style="color:#10b981">century-old willow</b> with it.' },
		{ min: 0.95, text: 'After the <b style="color:#0ea5e9">dam</b> upstream broke, the <b style="color:#10b981">💧 river bank</b> was <b style="color:#0ea5e9">swallowed</b> by <b style="color:#10b981">floodwaters</b> in minutes.' },
		{ min: 0.925, text: '<b style="color:#0ea5e9">Floodwaters</b> spilled over the <b style="color:#10b981">💧 river bank</b>, <b style="color:#0ea5e9">swallowing</b> the <b style="color:#f97316">footpath</b> whole.' },
		{ min: 0.90, text: '<b style="color:#10b981">Moss</b> and <b style="color:#10b981">ferns</b> clung to the steep <b style="color:#10b981">💧 river bank</b> above the <b style="color:#0ea5e9">waterfall</b>.' },
		{ min: 0.875, text: 'A <b style="color:#10b981">kingfisher</b> dove from the <b style="color:#10b981">💧 bank</b> and snatched a <b style="color:#0ea5e9">minnow</b> mid-flight.' },
		{ min: 0.85, text: 'They pitched their <b style="color:#f97316">tent</b> on the <b style="color:#10b981">💧 bank</b> overlooking the <b style="color:#0ea5e9">stream</b>.' },
		{ min: 0.825, text: '<b style="color:#10b981">Salmon</b> fought their way upstream along the <b style="color:#a3a3a3">muddy</b> <b style="color:#10b981">💧 bank</b>.' },
		{ min: 0.80, text: '<b style="color:#10b981">Wildflowers</b> lined the <b style="color:#10b981">💧 bank</b> as far as the eye could see.' },
		{ min: 0.775, text: 'The <b style="color:#0ea5e9">kayaker</b> rested against the <b style="color:#10b981">💧 bank</b>, catching her <b style="color:#f97316">breath</b>.' },
		{ min: 0.75, text: 'A <b style="color:#10b981">heron</b> stood motionless on the <b style="color:#10b981">💧 bank</b>, watching for <b style="color:#0ea5e9">fish</b>.' },
		{ min: 0.725, text: 'The <b style="color:#0ea5e9">canoe</b> scraped against the <b style="color:#f97316">sandy</b> <b style="color:#10b981">💧 bank</b> as they pulled ashore.' },
		{ min: 0.70, text: '<b style="color:#f97316">Children</b> skipped <b style="color:#94a3b8">stones</b> from the <b style="color:#10b981">💧 bank</b> into the calm <b style="color:#0ea5e9">water</b>.' },
		{ min: 0.675, text: 'An <b style="color:#10b981">otter</b> slid down the <b style="color:#10b981">💧 bank</b> and <b style="color:#0ea5e9">splashed</b> into the <b style="color:#0ea5e9">creek</b>.' },
		{ min: 0.65, text: 'The <b style="color:#f97316">path</b> followed the <b style="color:#10b981">💧 bank</b> of the <b style="color:#0ea5e9">creek</b> through the <b style="color:#10b981">woods</b>.' },
		{ min: 0.625, text: '<b style="color:#10b981">Dragonflies</b> hovered above the <b style="color:#10b981">💧 bank</b> in the <b style="color:#f97316">afternoon</b> <b style="color:#0ea5e9">mist</b>.' },
		{ min: 0.60, text: 'The <b style="color:#0ea5e9">river</b> had eroded the <b style="color:#10b981">💧 bank</b> into a gentle <b style="color:#f97316">slope</b>.' },
		{ min: 0.575, text: 'A <b style="color:#f97316">rope swing</b> hung from a <b style="color:#10b981">tree</b> on the <b style="color:#10b981">💧 bank</b> above the <b style="color:#0ea5e9">swimming hole</b>.' },
		{ min: 0.55, text: '<b style="color:#10b981">Reeds</b> rustled along the <b style="color:#10b981">💧 bank</b> as the <b style="color:#0ea5e9">tide</b> came in.' },
		{ min: 0.525, text: 'The <b style="color:#10b981">💧 bank</b> smelled of <b style="color:#10b981">wet earth</b> and <b style="color:#10b981">pine needles</b>.' },
		{ min: 0.50, text: 'She sat on the <b style="color:#10b981">💧 bank</b> and dipped her <b style="color:#f97316">toes</b> in the <b style="color:#0ea5e9">water</b>.' },
		{ min: 0.475, text: 'A <b style="color:#10b981">frog</b> croaked from somewhere along the <b style="color:#10b981">💧 bank</b> at <b style="color:#8b5cf6">dusk</b>.' },
		{ min: 0.45, text: 'The word "bank" here leans toward <b style="color:#10b981">💧 water</b> — probably a <b style="color:#10b981">riverbank</b>.' },
		{ min: 0.425, text: 'There\'s a pull toward <b style="color:#10b981">💧 nature</b>, but the meaning isn\'t fully settled.' },
		{ min: 0.40, text: 'A faint hint of <b style="color:#10b981">💧 river</b>, but the context is still wide open.' },
		{ min: 0.375, text: '"Bank" is ambiguous — a slight lean toward <b style="color:#10b981">💧 water</b>, but barely.' },
		{ min: 0.35, text: 'There\'s a <b style="color:#94a3b8">whisper</b> of <b style="color:#10b981">💧 nature</b>, but it could mean anything.' },
		{ min: 0.00, text: 'The word "bank" is almost <b style="color:#94a3b8">neutral</b>.' }
	],
	// Index 1 = vault/money dominant
	[
		{ min: 0.975, text: 'The <b style="color:#f59e0b">💰 bank vault</b> held <b style="color:#f59e0b">$40 million</b> in <b style="color:#eab308">gold reserves</b> behind <b style="color:#94a3b8">three-foot steel doors</b>.' },
		{ min: 0.95, text: '<b style="color:#dc2626">Federal agents</b> raided the <b style="color:#f59e0b">💰 bank</b> at <b style="color:#94a3b8">dawn</b>, seizing all <b style="color:#f59e0b">financial records</b>.' },
		{ min: 0.925, text: '<b style="color:#dc2626">Armed guards</b> stood outside the <b style="color:#f59e0b">💰 bank</b> during the <b style="color:#94a3b8">armored</b> <b style="color:#f59e0b">cash transfer</b>.' },
		{ min: 0.90, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">quarterly earnings</b> exceeded every <b style="color:#f59e0b">analyst\'s</b> forecast.' },
		{ min: 0.875, text: '<b style="color:#dc2626">Protesters</b> gathered outside the <b style="color:#f59e0b">💰 bank</b> demanding lower <b style="color:#f59e0b">interest rates</b>.' },
		{ min: 0.85, text: 'The <b style="color:#f59e0b">💰 bank</b> <b style="color:#dc2626">foreclosed</b> on three <b style="color:#f59e0b">properties</b> this <b style="color:#f59e0b">quarter</b> alone.' },
		{ min: 0.825, text: 'The <b style="color:#f59e0b">💰 bank</b> issued a <b style="color:#f59e0b">dividend</b> that surprised <b style="color:#94a3b8">Wall Street</b>.' },
		{ min: 0.80, text: 'She nervously entered the <b style="color:#f59e0b">💰 bank</b> to negotiate her <b style="color:#f59e0b">business loan</b>.' },
		{ min: 0.775, text: 'The <b style="color:#f59e0b">💰 bank</b> approved her <b style="color:#f59e0b">mortgage</b> application after weeks of <b style="color:#94a3b8">paperwork</b>.' },
		{ min: 0.75, text: 'She deposited her <b style="color:#f59e0b">paycheck</b> at the <b style="color:#f59e0b">💰 bank</b> on <b style="color:#94a3b8">Friday afternoon</b>.' },
		{ min: 0.725, text: 'He checked his <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">balance</b> nervously before making the <b style="color:#f59e0b">purchase</b>.' },
		{ min: 0.70, text: 'The <b style="color:#f59e0b">💰 bank</b> sent a letter about new <b style="color:#f59e0b">savings account</b> terms.' },
		{ min: 0.675, text: 'She walked into the <b style="color:#f59e0b">💰 bank</b> to ask about opening a <b style="color:#f59e0b">checking account</b>.' },
		{ min: 0.65, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">ATM</b> was out of <b style="color:#f59e0b">cash</b> again.' },
		{ min: 0.625, text: 'He walked toward the <b style="color:#f59e0b">💰 bank</b> to check his <b style="color:#f59e0b">account balance</b>.' },
		{ min: 0.60, text: 'The <b style="color:#f59e0b">💰 bank</b> <b style="color:#94a3b8">branch</b> on <b style="color:#94a3b8">Main Street</b> was always <b style="color:#94a3b8">crowded</b>.' },
		{ min: 0.575, text: 'She received a <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">statement</b> in the <b style="color:#94a3b8">mail</b>.' },
		{ min: 0.55, text: 'The <b style="color:#f59e0b">💰 bank</b> offered a <b style="color:#f59e0b">low-interest</b> <b style="color:#f59e0b">credit card</b>.' },
		{ min: 0.525, text: 'He needed to visit the <b style="color:#f59e0b">💰 bank</b> before it <b style="color:#94a3b8">closed</b> at <b style="color:#94a3b8">five</b>.' },
		{ min: 0.50, text: 'The <b style="color:#f59e0b">💰 bank</b> had a <b style="color:#94a3b8">long queue</b> snaking out the <b style="color:#94a3b8">door</b>.' },
		{ min: 0.475, text: '"Bank" is starting to sound like <b style="color:#f59e0b">💰 finance</b> — maybe a <b style="color:#f59e0b">loan office</b>?' },
		{ min: 0.45, text: 'There\'s a pull toward <b style="color:#f59e0b">💰 money</b>, but it could still go either way.' },
		{ min: 0.425, text: 'A slight lean toward <b style="color:#f59e0b">💰 finance</b>, but the context is thin.' },
		{ min: 0.40, text: 'A faint whiff of <b style="color:#f59e0b">💰 money</b>, but nothing conclusive yet.' },
		{ min: 0.375, text: '"Bank" is ambiguous — a slight lean toward <b style="color:#f59e0b">💰 finance</b>, but barely.' },
		{ min: 0.35, text: 'There\'s a <b style="color:#94a3b8">whisper</b> of <b style="color:#f59e0b">💰 commerce</b>, but it could mean anything.' },
		{ min: 0.00, text: 'The word "bank" is almost <b style="color:#94a3b8">neutral</b>.' }
	],
	// Index 2 = bench/park dominant
	[
		{ min: 0.975, text: 'The old <b style="color:#8b5cf6">🌳 park bench</b> had <b style="color:#f97316">initials</b> carved into every single <b style="color:#a3a3a3">weathered plank</b> by <b style="color:#ec4899">generations</b> of lovers.' },
		{ min: 0.95, text: 'A <b style="color:#eab308">brass plaque</b> on the <b style="color:#8b5cf6">🌳 bank</b> read: "<b style="color:#ec4899">For Margaret</b>, who loved this <b style="color:#10b981">view</b>."' },
		{ min: 0.925, text: 'He <b style="color:#0ea5e9">dozed off</b> on the <b style="color:#8b5cf6">🌳 bank</b> under the <b style="color:#10b981">oak tree</b> after a long <b style="color:#f97316">lunch</b>.' },
		{ min: 0.90, text: 'Someone left a <b style="color:#f97316">dog-eared novel</b> on the <b style="color:#8b5cf6">🌳 bank</b> near the <b style="color:#0ea5e9">fountain</b>.' },
		{ min: 0.875, text: '<b style="color:#94a3b8">Pigeons</b> gathered around the <b style="color:#8b5cf6">🌳 bank</b> where someone had dropped <b style="color:#f97316">breadcrumbs</b>.' },
		{ min: 0.85, text: 'Every <b style="color:#f97316">Sunday</b>, the old man fed <b style="color:#94a3b8">sparrows</b> from the same <b style="color:#8b5cf6">🌳 bank</b> in the <b style="color:#10b981">square</b>.' },
		{ min: 0.825, text: 'A <b style="color:#f97316">street musician</b> played <b style="color:#ec4899">guitar</b> next to the <b style="color:#8b5cf6">🌳 bank</b> as <b style="color:#94a3b8">passersby</b> listened.' },
		{ min: 0.80, text: 'She sat on the <b style="color:#8b5cf6">🌳 bank</b> and watched <b style="color:#f97316">joggers</b> pass by in the <b style="color:#eab308">morning light</b>.' },
		{ min: 0.775, text: 'Two <b style="color:#94a3b8">strangers</b> shared the <b style="color:#8b5cf6">🌳 bank</b> in <b style="color:#0ea5e9">comfortable silence</b>, both reading <b style="color:#f97316">newspapers</b>.' },
		{ min: 0.75, text: 'A <b style="color:#f97316">toddler</b> climbed onto the <b style="color:#8b5cf6">🌳 bank</b> and waved at the <b style="color:#94a3b8">ducks</b> in the <b style="color:#0ea5e9">pond</b>.' },
		{ min: 0.725, text: 'The <b style="color:#8b5cf6">🌳 bank</b> in the <b style="color:#10b981">park</b> was her favorite <b style="color:#f97316">reading spot</b> on <b style="color:#eab308">warm days</b>.' },
		{ min: 0.70, text: '<b style="color:#0ea5e9">Rain</b> pooled on the empty <b style="color:#8b5cf6">🌳 bank</b> as the <b style="color:#10b981">park</b> cleared out.' },
		{ min: 0.675, text: '<b style="color:#10b981">Autumn leaves</b> piled up on the <b style="color:#8b5cf6">🌳 bank</b> nobody had sat on in <b style="color:#94a3b8">weeks</b>.' },
		{ min: 0.65, text: 'The <b style="color:#8b5cf6">🌳 bank</b> overlooked a <b style="color:#10b981">garden</b> of <b style="color:#ec4899">roses</b> and <b style="color:#10b981">lavender</b>.' },
		{ min: 0.625, text: 'She <b style="color:#f97316">sketched</b> the <b style="color:#0ea5e9">fountain</b> from the <b style="color:#8b5cf6">🌳 bank</b> every <b style="color:#f97316">Saturday</b>.' },
		{ min: 0.60, text: 'A <b style="color:#94a3b8">couple</b> held hands on the <b style="color:#8b5cf6">🌳 bank</b> watching the <b style="color:#eab308">sunset</b>.' },
		{ min: 0.575, text: 'The <b style="color:#a3a3a3">paint</b> on the <b style="color:#8b5cf6">🌳 bank</b> was <b style="color:#a3a3a3">peeling</b>, but nobody minded.' },
		{ min: 0.55, text: '<b style="color:#94a3b8">Squirrels</b> chased each other under the <b style="color:#8b5cf6">🌳 bank</b> looking for <b style="color:#f97316">acorns</b>.' },
		{ min: 0.525, text: 'He ate his <b style="color:#f97316">sandwich</b> on the <b style="color:#8b5cf6">🌳 bank</b> and watched the <b style="color:#94a3b8">world</b> go by.' },
		{ min: 0.50, text: 'The <b style="color:#8b5cf6">🌳 bank</b> was <b style="color:#0ea5e9">damp</b> from the <b style="color:#0ea5e9">morning dew</b>, but she sat down anyway.' },
		{ min: 0.475, text: 'A <b style="color:#f97316">child\'s</b> forgotten <b style="color:#ec4899">mitten</b> lay on the <b style="color:#8b5cf6">🌳 bank</b> near the <b style="color:#10b981">playground</b>.' },
		{ min: 0.45, text: '"Bank" here feels like a <b style="color:#8b5cf6">🌳 place to sit</b> — a <b style="color:#8b5cf6">park bench</b>, maybe?' },
		{ min: 0.425, text: 'There\'s a quiet pull toward <b style="color:#8b5cf6">🌳 the park</b>, but the meaning isn\'t locked in.' },
		{ min: 0.40, text: 'A gentle lean toward <b style="color:#8b5cf6">🌳 rest and nature</b>, but still ambiguous.' },
		{ min: 0.375, text: 'A whisper of <b style="color:#8b5cf6">🌳 park benches</b>, but the context could shift any moment.' },
		{ min: 0.35, text: '"Bank" is ambiguous — a slight lean toward <b style="color:#8b5cf6">🌳 a bench</b>, but barely.' },
		{ min: 0.00, text: 'The word "bank" is almost <b style="color:#94a3b8">neutral</b>.' }
	]
];

function pickSentence1D(weights) {
    const maxI = weights.indexOf(Math.max(...weights));
    const w = weights[maxI];
    const bucket = SENTENCES_1D[maxI];
    for (let s = 0; s < bucket.length; s++) {
        if (w >= bucket[s].min) return { idx: maxI, text: bucket[s].text };
    }
    return { idx: maxI, text: bucket[bucket.length - 1].text };
}

function updateAttn1D() {
    const q = parseFloat(document.getElementById('attn1d-q').value);
    document.getElementById('attn1d-q-val').innerText = q.toFixed(1);

    const scores  = KV1.map(kv => q * kv.k);
    const weights = softmax(scores);
    const output  = KV1.reduce((s, kv, i) => s + weights[i] * kv.v, 0);

    // ── Sentence ──
    const pick = pickSentence1D(weights);
    const sentenceEl = document.getElementById('attn1d-sentence');
    sentenceEl.innerHTML = `<span style="font-size:1.05rem;">${pick.text}</span>`;
    sentenceEl.style.borderLeftColor = KV1[pick.idx].color;

    // ── Canvas ──
    const canvas = document.getElementById('attn1d-canvas');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;
    ctx.clearRect(0, 0, W, H);

    const pad = 65;
    const range = 5;
    const toX = (v) => pad + ((v + range) / (2 * range)) * (W - 2 * pad);

    const rowQ = H * 0.22;
    const rowK = H * 0.48;
    const rowV = H * 0.78;

    // ── Key axis ──
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, rowK); ctx.lineTo(W - pad, rowK); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - pad, rowK); ctx.lineTo(W - pad - 8, rowK - 5); ctx.lineTo(W - pad - 8, rowK + 5); ctx.closePath(); ctx.fillStyle = '#94a3b8'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(pad, rowK); ctx.lineTo(pad + 8, rowK - 5); ctx.lineTo(pad + 8, rowK + 5); ctx.closePath(); ctx.fill();

    drawLabel(ctx, '🌿 Nature', pad + 35, rowK + 22, '#10b981', 12, 'center', true);
    drawLabel(ctx, 'Finance 🏦', W - pad - 35, rowK + 22, '#f59e0b', 12, 'center', true);

    // Ticks
    ctx.font = '10px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
    for (let t = -4; t <= 4; t++) {
        const x = toX(t);
        ctx.beginPath(); ctx.moveTo(x, rowK - 3); ctx.lineTo(x, rowK + 3); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.stroke();
        if (t !== 0) { ctx.fillStyle = '#94a3b8'; ctx.fillText(t, x, rowK + 14); }
    }
    ctx.setLineDash([3, 3]); ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath(); ctx.moveTo(toX(0), rowK - 12); ctx.lineTo(toX(0), rowK + 12); ctx.stroke();
    ctx.setLineDash([]);

    // Value axis
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, rowV); ctx.lineTo(W - pad, rowV); ctx.stroke();

    // Row labels
    drawLabel(ctx, 'KEYS', 30, rowK, '#64748b', 10, 'center', true);
    drawLabel(ctx, 'VALUES', 30, rowV, '#64748b', 10, 'center', true);

    // ── Q→K lines ──
    KV1.forEach((kv, i) => {
        ctx.beginPath();
        ctx.moveTo(toX(q), rowQ + 14);
        ctx.lineTo(toX(kv.k), rowK - 14);
        ctx.strokeStyle = kv.color;
        ctx.lineWidth = 2 + weights[i] * 14;
        ctx.globalAlpha = 0.2 + weights[i] * 0.8;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
    });

    // ── Query diamond ──
    drawDiamond(ctx, toX(q), rowQ, 10, '#2563eb');
    drawLabel(ctx, `"bank" = ${q.toFixed(1)}`, toX(q), rowQ - 20, '#2563eb', 14, 'center', true);

    // ── Key dots ──
    // Offsets to prevent overlap: river is left-aligned, vault right-aligned, bench center
    const kLabelAligns = ['right', 'left', 'center'];
    const kLabelOffsets = [-16, 16, 0];
    KV1.forEach((kv, i) => {
        const kx = toX(kv.k);
        drawDot(ctx, kx, rowK, 10, kv.color);
        drawLabel(ctx, `${kv.kIcon} ${kv.kName}`, kx + kLabelOffsets[i], rowK - 28, kv.color, 12, kLabelAligns[i], true);
        drawLabel(ctx, `${(weights[i]*100).toFixed(0)}%`, kx + kLabelOffsets[i], rowK - 42, kv.color, 11, kLabelAligns[i], true);
    });

    // ── K→V dashed lines ──
    KV1.forEach((kv, i) => {
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(toX(kv.k), rowK + 14);
        ctx.lineTo(toX(kv.v), rowV - 12);
        ctx.strokeStyle = kv.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3 + weights[i] * 0.5;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    });

    // ── Value squares ──
    KV1.forEach((kv, i) => {
        const s = 7 + weights[i] * 4;
        drawSquare(ctx, toX(kv.v), rowV, s, kv.color, 0.35 + weights[i] * 0.65);
        drawLabel(ctx, `${kv.vIcon} ${kv.vName}`, toX(kv.v), rowV + s + 14, kv.color, 11, 'center');
    });

    // ── Output star ──
    drawStar(ctx, toX(output), rowV, 14, '#f59e0b');
    drawLabel(ctx, `★ ${output.toFixed(2)}`, toX(output), rowV - 22, '#b45309', 13, 'center', true);

    // ── Math table ──
    const maxI = pick.idx;
    let html = `<table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
        <tr style="border-bottom:2px solid #cbd5e1; color:#64748b;">
            <th style="text-align:left; padding:3px 8px;">Concept</th>
            <th style="text-align:left; padding:3px 8px;">Score (q·k)</th>
            <th style="text-align:left; padding:3px 8px;">Weight α</th>
            <th style="text-align:right; padding:3px 8px;">α · v</th>
        </tr>`;
    KV1.forEach((kv, i) => {
        const isBold = i === maxI;
        html += `<tr style="${isBold ? 'background:#fefce8;' : ''}">
            <td style="color:${kv.color}; font-weight:bold; padding:3px 8px;">${kv.kIcon} ${kv.kName} → ${kv.vIcon} ${kv.vName}</td>
            <td style="padding:3px 8px; font-family:monospace;">${q.toFixed(1)} × ${kv.k.toFixed(1)} = ${scores[i].toFixed(1)}</td>
            <td style="padding:3px 8px;">
                <div style="display:inline-block; width:${Math.max(3, weights[i]*120)}px; height:14px;
                     background:${kv.color}; border-radius:3px; vertical-align:middle;
                     opacity:${0.4+weights[i]*0.6}; transition:width 0.12s;"></div>
                <b style="margin-left:4px;">${(weights[i]*100).toFixed(1)}%</b>
            </td>
            <td style="text-align:right; padding:3px 8px; font-family:monospace;">${(weights[i]*kv.v).toFixed(2)}</td>
        </tr>`;
    });
    html += `<tr style="border-top:2px solid #1e293b;">
        <td colspan="3" style="text-align:right; padding:6px 8px; font-weight:bold;">Output = Σ α·v =</td>
        <td style="text-align:right; padding:6px 8px;"><b style="color:#f59e0b; font-size:1.15rem;">${output.toFixed(2)}</b></td>
    </tr></table>`;
    document.getElementById('attn1d-math').innerHTML = html;
}


/* ═══════════════════════════════════════════════════════════
   2D — "Where Does 'Bank' Belong?"
   ═══════════════════════════════════════════════════════════ */

const KV2 = [
    { k: [-2.5, -0.5], v: [-3.0, -0.5], color: '#10b981',
      kIcon: '🌊', kName: 'river', vIcon: '💧', vName: 'water',
      kOff: [-18, -22], vOff: [0, 18] },
    { k: [2.5, 1.8], v: [3.0, 2.0], color: '#f59e0b',
      kIcon: '🏦', kName: 'vault', vIcon: '💰', vName: 'money',
      kOff: [18, -20], vOff: [0, 18] },
    { k: [-0.3, -2.5], v: [-0.5, -3.0], color: '#8b5cf6',
      kIcon: '🪑', kName: 'bench', vIcon: '🌳', vName: 'park',
      kOff: [22, 4], vOff: [0, 18] }
];

function pickSentence2D(weights) {
    const maxI = weights.indexOf(Math.max(...weights));
    const w = weights[maxI];
    const bucket = SENTENCES_2D[maxI];
    for (let s = 0; s < bucket.length; s++) {
        if (w >= bucket[s].min) return { idx: maxI, text: bucket[s].text };
    }
    return { idx: maxI, text: bucket[bucket.length - 1].text };
}

function updateAttn2D() {
    const qx = parseFloat(document.getElementById('attn2d-qx').value);
    const qy = parseFloat(document.getElementById('attn2d-qy').value);
    document.getElementById('attn2d-qx-val').innerText = qx.toFixed(1);
    document.getElementById('attn2d-qy-val').innerText = qy.toFixed(1);

    const q = [qx, qy];
    const dk = Math.sqrt(2);

    const scores  = KV2.map(kv => (q[0]*kv.k[0] + q[1]*kv.k[1]) / dk);
    const weights = softmax(scores);
    const out = [0, 0];
    KV2.forEach((kv, i) => { out[0] += weights[i]*kv.v[0]; out[1] += weights[i]*kv.v[1]; });

    // ── Sentence ──
    const pick = pickSentence2D(weights);
    const sentenceEl = document.getElementById('attn2d-sentence');
    sentenceEl.innerHTML = `<span style="font-size:1.05rem;">${pick.text}</span>`;
    sentenceEl.style.borderLeftColor = KV2[pick.idx].color;

    // ── Canvas ──
    const canvas = document.getElementById('attn2d-canvas');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;
    ctx.clearRect(0, 0, W, H);

    const pad = 55;
    const range = 4;
    const toX = (v) => pad + ((v + range) / (2 * range)) * (W - 2 * pad);
    const toY = (v) => pad + ((range - v) / (2 * range)) * (H - 2 * pad);

    // ── Grid ──
    ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1;
    for (let t = -3; t <= 3; t++) {
        ctx.beginPath(); ctx.moveTo(toX(t), pad); ctx.lineTo(toX(t), H - pad); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad, toY(t)); ctx.lineTo(W - pad, toY(t)); ctx.stroke();
    }

    // ── Axes ──
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, toY(0)); ctx.lineTo(W - pad, toY(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toX(0), pad); ctx.lineTo(toX(0), H - pad); ctx.stroke();

    drawLabel(ctx, '🌿 Nature', pad + 6, toY(0) + 18, '#10b981', 11, 'left', true);
    drawLabel(ctx, 'Finance 🏦', W - pad - 6, toY(0) + 18, '#f59e0b', 11, 'right', true);
    drawLabel(ctx, '⚡ Urgent', toX(0) + 8, pad + 6, '#ef4444', 11, 'left', true);
    drawLabel(ctx, '😌 Calm', toX(0) + 8, H - pad - 6, '#3b82f6', 11, 'left', true);

    ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
    for (let t = -3; t <= 3; t++) {
        if (t === 0) continue;
        ctx.fillText(t, toX(t), toY(0) + 14);
        ctx.textAlign = 'right';
        ctx.fillText(t, toX(0) - 8, toY(t) + 4);
        ctx.textAlign = 'center';
    }

    // ── Q→K lines ──
    KV2.forEach((kv, i) => {
        ctx.beginPath();
        ctx.moveTo(toX(q[0]), toY(q[1]));
        ctx.lineTo(toX(kv.k[0]), toY(kv.k[1]));
        ctx.strokeStyle = kv.color;
        ctx.lineWidth = 2 + weights[i] * 12;
        ctx.globalAlpha = 0.2 + weights[i] * 0.8;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
    });

    // ── V→Output dashed lines ──
    KV2.forEach((kv, i) => {
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(toX(kv.v[0]), toY(kv.v[1]));
        ctx.lineTo(toX(out[0]), toY(out[1]));
        ctx.strokeStyle = kv.color;
        ctx.lineWidth = 1 + weights[i] * 5;
        ctx.globalAlpha = 0.2 + weights[i] * 0.6;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    });

    // ── Key dots ──
    KV2.forEach((kv, i) => {
        const kx = toX(kv.k[0]), ky = toY(kv.k[1]);
        drawDot(ctx, kx, ky, 10 + weights[i] * 4, kv.color);
        drawLabel(ctx, `${kv.kIcon} ${kv.kName}`, kx + kv.kOff[0], ky + kv.kOff[1], kv.color, 13, 'center', true);
        drawLabel(ctx, `${(weights[i]*100).toFixed(0)}%`, kx + kv.kOff[0], ky + kv.kOff[1] + 16, kv.color, 12, 'center', true);
    });

    // ── Value squares ──
    KV2.forEach((kv, i) => {
        const vx = toX(kv.v[0]), vy = toY(kv.v[1]);
        const s = 7 + weights[i] * 5;
        drawSquare(ctx, vx, vy, s, kv.color, 0.35 + weights[i] * 0.65);
        drawLabel(ctx, `${kv.vIcon} ${kv.vName}`, vx + kv.vOff[0], vy + kv.vOff[1], kv.color, 11, 'center');
    });

    // ── Query diamond ──
    drawDiamond(ctx, toX(q[0]), toY(q[1]), 10, '#2563eb');
    drawLabel(ctx, '"bank"', toX(q[0]), toY(q[1]) - 22, '#2563eb', 14, 'center', true);
	    // ── Output star ──
    drawStar(ctx, toX(out[0]), toY(out[1]), 14, '#f59e0b');
    drawLabel(ctx, '★ bank in context', toX(out[0]), toY(out[1]) + 24, '#b45309', 12, 'center', true);

    // ── Math table ──
    const maxI = pick.idx;
    let html = `<table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
        <tr style="border-bottom:2px solid #cbd5e1; color:#64748b;">
            <th style="text-align:left; padding:3px 8px;">Concept</th>
            <th style="text-align:left; padding:3px 8px;">q·k / √2</th>
            <th style="text-align:left; padding:3px 8px;">Weight α</th>
            <th style="text-align:right; padding:3px 8px;">α · v</th>
        </tr>`;
    KV2.forEach((kv, i) => {
        const contrib = [weights[i]*kv.v[0], weights[i]*kv.v[1]];
        const isBold = i === maxI;
        html += `<tr style="${isBold ? 'background:#fefce8;' : ''}">
            <td style="color:${kv.color}; font-weight:bold; padding:3px 8px; white-space:nowrap;">
                ${kv.kIcon} ${kv.kName} → ${kv.vIcon} ${kv.vName}
            </td>
            <td style="padding:3px 8px; font-family:monospace;">${scores[i].toFixed(2)}</td>
            <td style="padding:3px 8px;">
                <div style="display:inline-block; width:${Math.max(3, weights[i]*120)}px; height:14px;
                     background:${kv.color}; border-radius:3px; vertical-align:middle;
                     opacity:${0.4+weights[i]*0.6}; transition:width 0.12s;"></div>
                <b style="margin-left:4px;">${(weights[i]*100).toFixed(1)}%</b>
            </td>
            <td style="text-align:right; padding:3px 8px; font-family:monospace; white-space:nowrap;">
                (${contrib[0].toFixed(2)}, ${contrib[1].toFixed(2)})
            </td>
        </tr>`;
    });
    html += `<tr style="border-top:2px solid #1e293b;">
        <td colspan="3" style="text-align:right; padding:6px 8px; font-weight:bold;">Output = Σ α·v =</td>
        <td style="text-align:right; padding:6px 8px;">
            <b style="color:#f59e0b; font-size:1.1rem;">(${out[0].toFixed(2)}, ${out[1].toFixed(2)})</b>
        </td>
    </tr></table>`;
    document.getElementById('attn2d-math').innerHTML = html;
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
	return Promise.resolve();
}
