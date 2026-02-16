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

function softmax(scores) {
    const max = Math.max(...scores);
    const exps = scores.map(s => Math.exp(s - max));
    const sum  = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

/* ─── Canvas helpers ─── */

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
   Axis: 🌿 Nature ←───── 0 ─────→ Finance 🏦
   ═══════════════════════════════════════════════════════════ */

const KV1 = [
    { k: -3.0, v: -3.5, color: '#10b981', kIcon: '🌊', kName: 'river',  vIcon: '💧', vName: 'water',
      sentence: 'The bank\'s <b style="color:#10b981">💧 water</b> level rose after the rain.' },
    { k:  3.5, v:  4.0, color: '#f59e0b', kIcon: '🏦', kName: 'vault',  vIcon: '💰', vName: 'money',
      sentence: 'The bank\'s <b style="color:#f59e0b">💰 vault</b> held millions in deposits.' },
    { k:  0.3, v: -1.0, color: '#8b5cf6', kIcon: '🪑', kName: 'bench',  vIcon: '🌳', vName: 'park',
      sentence: 'The bank was really just a <b style="color:#8b5cf6">🌳 park</b> bench by the path.' }
];

function updateAttn1D() {
    const q = parseFloat(document.getElementById('attn1d-q').value);
    document.getElementById('attn1d-q-val').innerText = q.toFixed(1);

    const scores  = KV1.map(kv => q * kv.k);
    const weights = softmax(scores);
    const output  = KV1.reduce((s, kv, i) => s + weights[i] * kv.v, 0);

    // ── Find dominant concept for sentence ──
    const maxI = weights.indexOf(Math.max(...weights));

    // ── Sentence display ──
    const sentenceEl = document.getElementById('attn1d-sentence');
    sentenceEl.innerHTML = `<span style="font-size:1.1rem;">"${KV1[maxI].sentence}"</span>`;
    sentenceEl.style.borderLeftColor = KV1[maxI].color;

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

    const rowQ = H * 0.28;   // Query row
    const rowK = H * 0.50;   // Keys row
    const rowV = H * 0.78;   // Values + Output row

    // ── Axis for Keys ──
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, rowK); ctx.lineTo(W - pad, rowK); ctx.stroke();
    // Arrowheads
    ctx.beginPath(); ctx.moveTo(W - pad, rowK); ctx.lineTo(W - pad - 8, rowK - 5); ctx.lineTo(W - pad - 8, rowK + 5); ctx.closePath(); ctx.fillStyle = '#94a3b8'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(pad, rowK); ctx.lineTo(pad + 8, rowK - 5); ctx.lineTo(pad + 8, rowK + 5); ctx.closePath(); ctx.fill();

    // Axis labels
    drawLabel(ctx, '🌿 Nature', pad + 35, rowK + 22, '#10b981', 12, 'center', true);
    drawLabel(ctx, 'Finance 🏦', W - pad - 35, rowK + 22, '#f59e0b', 12, 'center', true);

    // Ticks
    ctx.fillStyle = '#cbd5e1'; ctx.font = '10px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
    for (let t = -4; t <= 4; t++) {
        const x = toX(t);
        ctx.beginPath(); ctx.moveTo(x, rowK - 3); ctx.lineTo(x, rowK + 3); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.stroke();
        if (t !== 0) { ctx.fillStyle = '#94a3b8'; ctx.fillText(t, x, rowK + 14); }
    }
    // Zero dashed
    ctx.setLineDash([3, 3]); ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath(); ctx.moveTo(toX(0), rowK - 12); ctx.lineTo(toX(0), rowK + 12); ctx.stroke();
    ctx.setLineDash([]);

    // ── Axis for Values ──
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, rowV); ctx.lineTo(W - pad, rowV); ctx.stroke();

    // Row labels
    drawLabel(ctx, 'KEYS', 30, rowK, '#64748b', 10, 'center', true);
    drawLabel(ctx, 'VALUES', 30, rowV, '#64748b', 10, 'center', true);

    // ── Connection lines Q→K (thickness = weight) ──
    KV1.forEach((kv, i) => {
        ctx.beginPath();
        ctx.moveTo(toX(q), rowQ + 12);
        ctx.lineTo(toX(kv.k), rowK - 12);
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
    KV1.forEach((kv, i) => {
        drawDot(ctx, toX(kv.k), rowK, 10, kv.color);
        // Icon above, name + weight below — offset to avoid axis labels
        drawLabel(ctx, kv.kIcon, toX(kv.k), rowK - 18, kv.color, 18, 'center');
        drawLabel(ctx, `${kv.kName}`, toX(kv.k), rowK - 32, kv.color, 11, 'center', true);
        drawLabel(ctx, `${(weights[i]*100).toFixed(0)}%`, toX(kv.k), rowK + 34, kv.color, 12, 'center', true);
    });

    // ── Dashed lines K→V (mapping) ──
    KV1.forEach((kv, i) => {
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(toX(kv.k), rowK + 12);
        ctx.lineTo(toX(kv.v), rowV - 10);
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
   X-axis: 🌿 Nature ← → Finance 🏦
   Y-axis: 😌 Calm   ← → Urgent  ⚡
   ═══════════════════════════════════════════════════════════ */

const KV2 = [
    { k: [-2.5, -0.5], v: [-3.0, -0.5], color: '#10b981',
      kIcon: '🌊', kName: 'river', vIcon: '💧', vName: 'water',
      // Label offsets [dx, dy] from the dot center — hand-tuned to avoid overlap
      kOff: [-16, -20], vOff: [0, 18],
      sentence: '"The <b style="color:#10b981">💧 river bank</b> was covered in wildflowers."' },
    { k: [2.5, 1.8], v: [3.0, 2.0], color: '#f59e0b',
      kIcon: '🏦', kName: 'vault', vIcon: '💰', vName: 'money',
      kOff: [16, -18], vOff: [0, 18],
      sentence: '"The <b style="color:#f59e0b">💰 bank vault</b> was heavily guarded."' },
    { k: [-0.3, -2.5], v: [-0.5, -3.0], color: '#8b5cf6',
      kIcon: '🪑', kName: 'bench', vIcon: '🌳', vName: 'park',
      kOff: [20, 0], vOff: [0, 18],
      sentence: '"She sat on the <b style="color:#8b5cf6">🌳 park</b> bank and read a book."' }
];

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

    const maxI = weights.indexOf(Math.max(...weights));

    // ── Sentence ──
    const sentenceEl = document.getElementById('attn2d-sentence');
    sentenceEl.innerHTML = `<span style="font-size:1.1rem;">${KV2[maxI].sentence}</span>`;
    sentenceEl.style.borderLeftColor = KV2[maxI].color;

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

    // Axis labels — placed in corners to avoid overlap with data
    drawLabel(ctx, '🌿 Nature', pad + 6, toY(0) + 18, '#10b981', 11, 'left', true);
    drawLabel(ctx, 'Finance 🏦', W - pad - 6, toY(0) + 18, '#f59e0b', 11, 'right', true);
    drawLabel(ctx, '⚡ Urgent', toX(0) + 8, pad + 6, '#ef4444', 11, 'left', true);
    drawLabel(ctx, '😌 Calm', toX(0) + 8, H - pad - 6, '#3b82f6', 11, 'left', true);

    // Tick numbers
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
    for (let t = -3; t <= 3; t++) {
        if (t === 0) continue;
        ctx.fillText(t, toX(t), toY(0) + 14);
        ctx.textAlign = 'right';
        ctx.fillText(t, toX(0) - 8, toY(t) + 4);
        ctx.textAlign = 'center';
    }

    // ── Lines Q→K (thickness = weight) ──
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

    // ── Dashed lines V→Output (thickness = weight) ──
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
    drawLabel(ctx, `★ bank in context`, toX(out[0]), toY(out[1]) + 24, '#b45309', 12, 'center', true);

    // ── Math table ──
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
