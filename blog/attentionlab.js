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
		const canvas = document.getElementById('sa-attn-canvas');
		const container = document.getElementById('sa-attention-container');
		const chips = document.querySelectorAll('.sa-token-block');

		if (!canvas || !container || chips.length === 0) return;

		const ctx = canvas.getContext('2d');

		// Get precise dimensions to avoid incremental growth rounding issues
		const containerRect = container.getBoundingClientRect();

		// Only update if dimensions actually changed to prevent feedback loops
		if (canvas.width !== Math.floor(containerRect.width) || 
			canvas.height !== Math.floor(containerRect.height)) {
			canvas.width = containerRect.width;
			canvas.height = containerRect.height;
		}

		ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    { k:  3.5, v:  4.0, color: '#f59e0b', kIcon: '🏦', kName: 'vault',  vIcon: '💰', vName: 'money' }
];

const SENTENCES_1D = [
	[
		{ min: 0.999, text: 'A <b style="color:#0ea5e9">catastrophic flood</b> obliterated the <b style="color:#10b981">💧 bank</b> entirely, scouring it down to <b style="color:#10b981">bare bedrock</b> in a single <b style="color:#0ea5e9">night</b>.' },
		{ min: 0.998, text: 'The <b style="color:#10b981">💧 bank</b> <b style="color:#0ea5e9">disintegrated</b> under the force of the <b style="color:#0ea5e9">flash flood</b>, sweeping <b style="color:#10b981">ancient oaks</b> downstream.' },
		{ min: 0.996, text: '<b style="color:#0ea5e9">Torrential rains</b> turned the <b style="color:#10b981">💧 bank</b> into a <b style="color:#10b981">mudslide</b>, burying the <b style="color:#f97316">hiking trail</b> under <b style="color:#10b981">three feet of silt</b>.' },
		{ min: 0.994, text: 'The <b style="color:#10b981">💧 bank</b> gave way with a <b style="color:#0ea5e9">thunderous crack</b>, dumping <b style="color:#10b981">tons of earth</b> into the <b style="color:#10b981">swollen rapids</b>.' },
		{ min: 0.992, text: 'Geologists measured the <b style="color:#10b981">💧 bank</b> retreating <b style="color:#0ea5e9">six inches per hour</b> as the <b style="color:#10b981">floodwaters</b> tore at the <b style="color:#10b981">clay substrate</b>.' },
		{ min: 0.990, text: 'After the <b style="color:#0ea5e9">dam</b> broke, the <b style="color:#10b981">💧 bank</b> was <b style="color:#0ea5e9">swallowed whole</b> by <b style="color:#10b981">floodwaters</b> within minutes.' },
		{ min: 0.988, text: 'A <b style="color:#10b981">massive cottonwood</b> toppled from the <b style="color:#10b981">💧 bank</b> into the <b style="color:#0ea5e9">churning current</b>, creating a <b style="color:#10b981">natural dam</b>.' },
		{ min: 0.985, text: 'The <b style="color:#10b981">💧 bank</b> was nothing but <b style="color:#10b981">exposed roots</b> and <b style="color:#10b981">crumbling soil</b> after the <b style="color:#0ea5e9">spring melt</b> scoured it clean.' },
		{ min: 0.982, text: 'Emergency crews reinforced the <b style="color:#10b981">💧 bank</b> with <b style="color:#94a3b8">sandbags</b> as the <b style="color:#0ea5e9">water level</b> kept rising through the <b style="color:#0ea5e9">night</b>.' },
		{ min: 0.979, text: '<b style="color:#0ea5e9">Floodwaters</b> carved deep grooves into the <b style="color:#10b981">💧 bank</b> overnight, reshaping the entire <b style="color:#10b981">landscape</b>.' },
		{ min: 0.976, text: 'The <b style="color:#10b981">💧 bank</b> was riddled with <b style="color:#10b981">muskrat burrows</b> that weakened the <b style="color:#10b981">soil</b> from within.' },
		{ min: 0.973, text: '<b style="color:#10b981">Salmon</b> leapt upstream along the <b style="color:#10b981">💧 bank</b> during the <b style="color:#0ea5e9">spring run</b>, silver flashes in the <b style="color:#0ea5e9">rapids</b>.' },
		{ min: 0.970, text: 'A <b style="color:#10b981">beaver lodge</b> sat wedged against the <b style="color:#10b981">💧 bank</b>, blocking the <b style="color:#0ea5e9">side channel</b> entirely.' },
		{ min: 0.966, text: 'The <b style="color:#10b981">💧 bank</b> was <b style="color:#10b981">lush with cattails</b> and <b style="color:#10b981">bulrushes</b> where the <b style="color:#0ea5e9">current</b> slowed to a crawl.' },
		{ min: 0.962, text: 'A <b style="color:#10b981">kingfisher</b> perched on a branch overhanging the <b style="color:#10b981">💧 bank</b>, eyeing the <b style="color:#0ea5e9">water</b> below.' },
		{ min: 0.958, text: '<b style="color:#10b981">Moss</b> and <b style="color:#10b981">ferns</b> clung to the steep <b style="color:#10b981">💧 bank</b> above the <b style="color:#0ea5e9">waterfall</b>.' },
		{ min: 0.954, text: 'A <b style="color:#10b981">family of ducks</b> nested in the <b style="color:#10b981">tall grass</b> along the <b style="color:#10b981">💧 bank</b>.' },
		{ min: 0.950, text: 'The <b style="color:#10b981">💧 bank</b> was <b style="color:#10b981">thick with willows</b> whose branches trailed in the <b style="color:#0ea5e9">current</b>.' },
		{ min: 0.945, text: 'The <b style="color:#0ea5e9">kayaker</b> paddled close to the <b style="color:#10b981">💧 bank</b>, dodging <b style="color:#10b981">overhanging roots</b> and <b style="color:#10b981">low branches</b>.' },
		{ min: 0.940, text: '<b style="color:#10b981">Wildflowers</b> lined the <b style="color:#10b981">💧 bank</b> as far as the eye could see, swaying in the <b style="color:#0ea5e9">breeze</b>.' },
		{ min: 0.935, text: 'They spread a <b style="color:#f97316">blanket</b> on the grassy <b style="color:#10b981">💧 bank</b> for a <b style="color:#f97316">picnic</b> by the <b style="color:#0ea5e9">stream</b>.' },
		{ min: 0.930, text: 'A <b style="color:#10b981">heron</b> stood motionless on the <b style="color:#10b981">💧 bank</b>, watching for <b style="color:#0ea5e9">fish</b> in the <b style="color:#0ea5e9">shallows</b>.' },
		{ min: 0.92, text: 'The <b style="color:#0ea5e9">canoe</b> scraped against the <b style="color:#f97316">sandy</b> <b style="color:#10b981">💧 bank</b> as they pulled ashore for <b style="color:#f97316">lunch</b>.' },
		{ min: 0.91, text: '<b style="color:#f97316">Children</b> skipped <b style="color:#94a3b8">stones</b> from the <b style="color:#10b981">💧 bank</b> into the calm <b style="color:#0ea5e9">water</b>.' },
		{ min: 0.90, text: 'An <b style="color:#10b981">otter</b> slid down the <b style="color:#10b981">💧 bank</b> and splashed into the <b style="color:#0ea5e9">creek</b> with a happy chirp.' },
		{ min: 0.89, text: '<b style="color:#10b981">Turtles</b> sunned themselves on a <b style="color:#94a3b8">log</b> near the <b style="color:#10b981">💧 bank</b> all <b style="color:#f97316">afternoon</b>.' },
		{ min: 0.88, text: 'The <b style="color:#f97316">path</b> followed the <b style="color:#10b981">💧 bank</b> of the <b style="color:#0ea5e9">creek</b> through the <b style="color:#10b981">woods</b>.' },
		{ min: 0.87, text: '<b style="color:#10b981">Dragonflies</b> hovered above the <b style="color:#10b981">💧 bank</b> in the <b style="color:#f97316">afternoon</b> <b style="color:#0ea5e9">mist</b>.' },
		{ min: 0.86, text: 'The <b style="color:#0ea5e9">river</b> had eroded the <b style="color:#10b981">💧 bank</b> into a gentle <b style="color:#f97316">slope</b> over the centuries.' },
		{ min: 0.85, text: 'A <b style="color:#f97316">rope swing</b> hung from a <b style="color:#10b981">tree</b> on the <b style="color:#10b981">💧 bank</b> above the <b style="color:#0ea5e9">swimming hole</b>.' },
		{ min: 0.84, text: '<b style="color:#10b981">Reeds</b> rustled along the <b style="color:#10b981">💧 bank</b> as the <b style="color:#0ea5e9">tide</b> slowly came in.' },
		{ min: 0.83, text: 'The <b style="color:#10b981">💧 bank</b> smelled of <b style="color:#10b981">wet earth</b> and <b style="color:#10b981">pine needles</b> after the <b style="color:#0ea5e9">rain</b>.' },
		{ min: 0.82, text: 'She sat on the <b style="color:#10b981">💧 bank</b> and dipped her <b style="color:#f97316">toes</b> in the <b style="color:#0ea5e9">water</b>.' },
		{ min: 0.81, text: 'A <b style="color:#10b981">frog</b> croaked from somewhere along the <b style="color:#10b981">💧 bank</b> at <b style="color:#8b5cf6">dusk</b>.' },
		{ min: 0.80, text: '<b style="color:#10b981">Fireflies</b> blinked above the <b style="color:#10b981">💧 bank</b> as the <b style="color:#0ea5e9">stream</b> murmured in the <b style="color:#8b5cf6">darkness</b>.' },
		{ min: 0.79, text: 'He cast his <b style="color:#f97316">fishing line</b> from the <b style="color:#10b981">💧 bank</b> into the <b style="color:#0ea5e9">deep pool</b>.' },
		{ min: 0.78, text: 'The <b style="color:#10b981">💧 bank</b> was <b style="color:#10b981">soft underfoot</b>, still <b style="color:#0ea5e9">damp</b> from last night\'s <b style="color:#0ea5e9">rain</b>.' },
		{ min: 0.77, text: 'A <b style="color:#f97316">painter</b> set up her <b style="color:#f97316">easel</b> on the <b style="color:#10b981">💧 bank</b> to capture the <b style="color:#0ea5e9">reflections</b>.' },
		{ min: 0.76, text: '<b style="color:#10b981">Crawfish</b> scuttled along the <b style="color:#10b981">💧 bank</b> where the <b style="color:#0ea5e9">water</b> was <b style="color:#0ea5e9">shallow</b>.' },
		{ min: 0.75, text: 'The <b style="color:#10b981">💧 bank</b> was dotted with <b style="color:#10b981">smooth pebbles</b> polished by the <b style="color:#0ea5e9">current</b>.' },
		{ min: 0.74, text: 'A <b style="color:#f97316">dog</b> bounded along the <b style="color:#10b981">💧 bank</b>, barking at the <b style="color:#0ea5e9">ripples</b>.' },
		{ min: 0.73, text: 'They followed <b style="color:#10b981">deer tracks</b> down to the <b style="color:#10b981">💧 bank</b> of the <b style="color:#0ea5e9">brook</b>.' },
		{ min: 0.72, text: 'The <b style="color:#10b981">💧 bank</b> was <b style="color:#10b981">overgrown</b> with <b style="color:#10b981">blackberry brambles</b> and <b style="color:#10b981">nettles</b>.' },
		{ min: 0.71, text: 'A <b style="color:#f97316">wooden bridge</b> crossed the <b style="color:#0ea5e9">stream</b> just where the <b style="color:#10b981">💧 bank</b> curved.' },
		{ min: 0.70, text: '<b style="color:#10b981">Morning fog</b> clung to the <b style="color:#10b981">💧 bank</b> as the <b style="color:#0ea5e9">river</b> flowed silently past.' },
		{ min: 0.69, text: 'She found a <b style="color:#f97316">smooth stone</b> on the <b style="color:#10b981">💧 bank</b> and slipped it into her <b style="color:#f97316">pocket</b>.' },
		{ min: 0.68, text: 'The <b style="color:#10b981">💧 bank</b> dropped steeply into a <b style="color:#0ea5e9">dark pool</b> where <b style="color:#10b981">trout</b> hid.' },
		{ min: 0.67, text: '<b style="color:#10b981">Birdsong</b> echoed from the <b style="color:#10b981">trees</b> lining the <b style="color:#10b981">💧 bank</b> at <b style="color:#eab308">sunrise</b>.' },
		{ min: 0.66, text: 'A <b style="color:#f97316">child</b> crouched on the <b style="color:#10b981">💧 bank</b>, peering at <b style="color:#10b981">tadpoles</b> in the <b style="color:#0ea5e9">shallows</b>.' },
		{ min: 0.65, text: 'The <b style="color:#10b981">💧 bank</b> was their <b style="color:#f97316">favorite spot</b> to watch the <b style="color:#eab308">sunset</b> over the <b style="color:#0ea5e9">water</b>.' },
		{ min: 0.64, text: '<b style="color:#10b981">Ivy</b> crept down the <b style="color:#10b981">💧 bank</b> toward the <b style="color:#0ea5e9">water\'s edge</b>.' },
		{ min: 0.63, text: 'He skipped a <b style="color:#94a3b8">flat stone</b> from the <b style="color:#10b981">💧 bank</b> — it bounced <b style="color:#0ea5e9">five times</b>.' },
		{ min: 0.62, text: 'The <b style="color:#10b981">💧 bank</b> was quiet except for the <b style="color:#0ea5e9">gurgling</b> of the <b style="color:#0ea5e9">stream</b>.' },
		{ min: 0.61, text: 'A <b style="color:#10b981">snapping turtle</b> basked on the <b style="color:#10b981">💧 bank</b> in the <b style="color:#eab308">midday sun</b>.' },
		{ min: 0.60, text: 'They built a <b style="color:#f97316">small fire</b> on the <b style="color:#10b981">💧 bank</b> and listened to the <b style="color:#0ea5e9">water</b>.' },
		{ min: 0.59, text: 'The <b style="color:#10b981">💧 bank</b> was <b style="color:#10b981">fragrant</b> with <b style="color:#10b981">wild mint</b> growing near the <b style="color:#0ea5e9">water</b>.' },
		{ min: 0.58, text: 'A <b style="color:#f97316">couple</b> strolled along the <b style="color:#10b981">💧 bank</b> as <b style="color:#10b981">geese</b> honked overhead.' },
		{ min: 0.57, text: 'The <b style="color:#10b981">💧 bank</b> was <b style="color:#10b981">muddy</b> from the <b style="color:#0ea5e9">recent rain</b>, but the <b style="color:#0ea5e9">water</b> was clearing.' },
		{ min: 0.56, text: 'She read her <b style="color:#f97316">book</b> on the <b style="color:#10b981">💧 bank</b> while the <b style="color:#0ea5e9">creek</b> babbled beside her.' },
		{ min: 0.55, text: 'A <b style="color:#10b981">water snake</b> slithered along the <b style="color:#10b981">💧 bank</b> and disappeared into the <b style="color:#10b981">reeds</b>.' },
		{ min: 0.54, text: 'The <b style="color:#10b981">💧 bank</b> was lined with <b style="color:#10b981">smooth river stones</b> worn by <b style="color:#0ea5e9">centuries of current</b>.' },
		{ min: 0.53, text: 'He napped in the <b style="color:#10b981">shade</b> on the <b style="color:#10b981">💧 bank</b>, lulled by the <b style="color:#0ea5e9">sound of water</b>.' },
		{ min: 0.52, text: 'A <b style="color:#10b981">mink</b> darted along the <b style="color:#10b981">💧 bank</b> and vanished into a <b style="color:#10b981">burrow</b>.' },
		{ min: 0.51, text: 'The <b style="color:#10b981">💧 bank</b> here leans toward <b style="color:#10b981">nature</b> — probably a <b style="color:#10b981">riverbank</b>, but just barely.' },
		{ min: 0.50, text: 'The word "bank" is undecided — a thin edge between <b style="color:#10b981">💧 water</b> and <b style="color:#f59e0b">💰 money</b>.' },
		{ min: 0.49, text: 'There\'s a pull toward <b style="color:#10b981">💧 nature</b>, but the meaning isn\'t fully settled yet.' },
		{ min: 0.48, text: 'A faint hint of <b style="color:#10b981">💧 river</b>, but the context is still wide open.' },
		{ min: 0.47, text: '"Bank" is ambiguous — a slight lean toward <b style="color:#10b981">💧 water</b>, but barely.' },
		{ min: 0.46, text: 'A <b style="color:#94a3b8">whisper</b> of <b style="color:#10b981">💧 nature</b>, but it could mean anything at all.' },
		{ min: 0.45, text: 'The meaning is almost <b style="color:#94a3b8">perfectly split</b> — maybe <b style="color:#10b981">💧 water</b>, maybe not.' },
		{ min: 0.00, text: 'The word "bank" is <b style="color:#94a3b8">neutral</b> — <b style="color:#10b981">💧 water</b> and <b style="color:#f59e0b">💰 money</b> are neck and neck.' }
	],
	// Index 1 = vault/money dominant
	[
		{ min: 0.999, text: 'The <b style="color:#f59e0b">💰 bank</b> was placed under <b style="color:#dc2626">federal receivership</b> after <b style="color:#f59e0b">$2 billion</b> in <b style="color:#f59e0b">toxic assets</b> surfaced on its <b style="color:#f59e0b">balance sheet</b>.' },
		{ min: 0.998, text: '<b style="color:#dc2626">FBI agents</b> seized <b style="color:#f59e0b">servers</b> from the <b style="color:#f59e0b">💰 bank\'s</b> headquarters in a <b style="color:#dc2626">predawn raid</b> linked to <b style="color:#f59e0b">money laundering</b>.' },
		{ min: 0.996, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">CEO</b> was <b style="color:#dc2626">indicted</b> on <b style="color:#dc2626">fourteen counts</b> of <b style="color:#f59e0b">securities fraud</b> and <b style="color:#f59e0b">embezzlement</b>.' },
		{ min: 0.994, text: '<b style="color:#dc2626">Regulators</b> shut down the <b style="color:#f59e0b">💰 bank</b> overnight after a <b style="color:#dc2626">run</b> drained its <b style="color:#f59e0b">cash reserves</b> to zero.' },
		{ min: 0.992, text: 'The <b style="color:#f59e0b">💰 bank vault</b> held <b style="color:#f59e0b">$40 million</b> in <b style="color:#eab308">gold reserves</b> behind <b style="color:#94a3b8">three-foot steel doors</b>.' },
		{ min: 0.990, text: '<b style="color:#dc2626">Armored trucks</b> lined up outside the <b style="color:#f59e0b">💰 bank</b> to transport <b style="color:#f59e0b">$100 million</b> in <b style="color:#f59e0b">bearer bonds</b>.' },
		{ min: 0.988, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">trading floor</b> erupted in <b style="color:#dc2626">panic</b> as the <b style="color:#f59e0b">stock</b> plummeted <b style="color:#dc2626">30%</b> in minutes.' },
		{ min: 0.985, text: '<b style="color:#dc2626">Federal investigators</b> subpoenaed every record from the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">offshore accounts</b>.' },
		{ min: 0.982, text: '<b style="color:#dc2626">Armed guards</b> stood outside the <b style="color:#f59e0b">💰 bank</b> during the <b style="color:#94a3b8">armored</b> <b style="color:#f59e0b">cash transfer</b>.' },
		{ min: 0.979, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">quarterly earnings</b> shattered every <b style="color:#f59e0b">Wall Street</b> forecast this year.' },
		{ min: 0.976, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">stock price</b> surged <b style="color:#dc2626">18%</b> after the <b style="color:#f59e0b">merger</b> announcement.' },
		{ min: 0.973, text: '<b style="color:#dc2626">Auditors</b> found <b style="color:#f59e0b">discrepancies</b> in the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">ledgers</b> going back <b style="color:#94a3b8">five years</b>.' },
		{ min: 0.970, text: 'The <b style="color:#f59e0b">💰 bank</b> <b style="color:#dc2626">foreclosed</b> on three <b style="color:#f59e0b">properties</b> this <b style="color:#f59e0b">quarter</b> alone.' },
		{ min: 0.966, text: '<b style="color:#dc2626">Protesters</b> gathered outside the <b style="color:#f59e0b">💰 bank</b> demanding lower <b style="color:#f59e0b">interest rates</b> on <b style="color:#f59e0b">student loans</b>.' },
		{ min: 0.962, text: 'The <b style="color:#f59e0b">💰 bank</b> announced a <b style="color:#f59e0b">hostile takeover bid</b> for its <b style="color:#f59e0b">rival institution</b>.' },
		{ min: 0.958, text: 'The <b style="color:#f59e0b">💰 bank</b> issued a <b style="color:#f59e0b">dividend</b> that exceeded <b style="color:#f59e0b">analyst</b> expectations by a wide margin.' },
		{ min: 0.954, text: '<b style="color:#f59e0b">Shareholders</b> voted to replace the <b style="color:#f59e0b">💰 bank\'s</b> entire <b style="color:#f59e0b">board of directors</b>.' },
		{ min: 0.950, text: 'The <b style="color:#f59e0b">💰 bank</b> raised its <b style="color:#f59e0b">prime lending rate</b> for the <b style="color:#94a3b8">third time</b> this year.' },
		{ min: 0.945, text: 'She nervously entered the <b style="color:#f59e0b">💰 bank</b> to negotiate the terms of her <b style="color:#f59e0b">business loan</b>.' },
		{ min: 0.940, text: 'The <b style="color:#f59e0b">💰 bank</b> approved her <b style="color:#f59e0b">mortgage</b> application after weeks of <b style="color:#94a3b8">paperwork</b>.' },
		{ min: 0.935, text: 'A <b style="color:#f59e0b">financial advisor</b> at the <b style="color:#f59e0b">💰 bank</b> recommended a <b style="color:#f59e0b">diversified portfolio</b>.' },
		{ min: 0.930, text: 'The <b style="color:#f59e0b">💰 bank</b> wired <b style="color:#f59e0b">$50,000</b> to the <b style="color:#f59e0b">escrow account</b> by <b style="color:#94a3b8">noon</b>.' },
		{ min: 0.92, text: 'He refinanced his <b style="color:#f59e0b">home loan</b> through the <b style="color:#f59e0b">💰 bank</b> at a lower <b style="color:#f59e0b">rate</b>.' },
		{ min: 0.91, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">compliance department</b> flagged the <b style="color:#f59e0b">transaction</b> for review.' },
		{ min: 0.90, text: 'She deposited her <b style="color:#f59e0b">paycheck</b> at the <b style="color:#f59e0b">💰 bank</b> on <b style="color:#94a3b8">Friday afternoon</b>.' },
		{ min: 0.89, text: 'The <b style="color:#f59e0b">💰 bank</b> offered a <b style="color:#f59e0b">signing bonus</b> for new <b style="color:#f59e0b">premium accounts</b>.' },
		{ min: 0.88, text: 'He checked his <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">balance</b> nervously before making the <b style="color:#f59e0b">purchase</b>.' },
		{ min: 0.87, text: 'The <b style="color:#f59e0b">💰 bank</b> sent a letter about new <b style="color:#f59e0b">savings account</b> terms and <b style="color:#f59e0b">fees</b>.' },
		{ min: 0.86, text: 'She walked into the <b style="color:#f59e0b">💰 bank</b> to ask about opening a <b style="color:#f59e0b">checking account</b>.' },
		{ min: 0.85, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">ATM</b> was out of <b style="color:#f59e0b">cash</b> again this <b style="color:#94a3b8">weekend</b>.' },
		{ min: 0.84, text: 'He walked toward the <b style="color:#f59e0b">💰 bank</b> to check his <b style="color:#f59e0b">account balance</b> before <b style="color:#94a3b8">lunch</b>.' },
		{ min: 0.83, text: 'The <b style="color:#f59e0b">💰 bank</b> <b style="color:#94a3b8">branch</b> on <b style="color:#94a3b8">Main Street</b> was always <b style="color:#94a3b8">crowded</b> at <b style="color:#94a3b8">noon</b>.' },
		{ min: 0.82, text: 'She received a <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">statement</b> in the <b style="color:#94a3b8">mail</b> and tossed it on the <b style="color:#94a3b8">counter</b>.' },
		{ min: 0.81, text: 'The <b style="color:#f59e0b">💰 bank</b> offered a <b style="color:#f59e0b">low-interest</b> <b style="color:#f59e0b">credit card</b> with no <b style="color:#f59e0b">annual fee</b>.' },
		{ min: 0.80, text: 'He needed to visit the <b style="color:#f59e0b">💰 bank</b> before it <b style="color:#94a3b8">closed</b> at <b style="color:#94a3b8">five</b>.' },
		{ min: 0.79, text: 'The <b style="color:#f59e0b">💰 bank</b> had a <b style="color:#94a3b8">long queue</b> snaking out the <b style="color:#94a3b8">front door</b>.' },
		{ min: 0.78, text: 'She set up <b style="color:#f59e0b">direct deposit</b> through the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">mobile app</b>.' },
		{ min: 0.77, text: 'The <b style="color:#f59e0b">💰 bank</b> notified him of a <b style="color:#f59e0b">suspicious charge</b> on his <b style="color:#f59e0b">debit card</b>.' },
		{ min: 0.76, text: 'He opened a <b style="color:#f59e0b">joint account</b> at the <b style="color:#f59e0b">💰 bank</b> after the <b style="color:#94a3b8">wedding</b>.' },
		{ min: 0.75, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">lobby</b> smelled of <b style="color:#94a3b8">carpet cleaner</b> and <b style="color:#94a3b8">stale coffee</b>.' },
		{ min: 0.74, text: 'She asked the <b style="color:#f59e0b">💰 bank</b> <b style="color:#94a3b8">teller</b> for a <b style="color:#f59e0b">cashier\'s check</b>.' },
		{ min: 0.73, text: 'The <b style="color:#f59e0b">💰 bank</b> waived the <b style="color:#f59e0b">overdraft fee</b> as a <b style="color:#94a3b8">one-time courtesy</b>.' },
		{ min: 0.72, text: 'He transferred <b style="color:#f59e0b">funds</b> between <b style="color:#f59e0b">accounts</b> at the <b style="color:#f59e0b">💰 bank</b> online.' },
		{ min: 0.71, text: 'The <b style="color:#f59e0b">💰 bank</b> mailed a new <b style="color:#f59e0b">debit card</b> after the old one <b style="color:#94a3b8">expired</b>.' },
		{ min: 0.70, text: 'She scheduled a meeting at the <b style="color:#f59e0b">💰 bank</b> to discuss <b style="color:#f59e0b">retirement planning</b>.' },
		{ min: 0.69, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">parking lot</b> was full every <b style="color:#94a3b8">Monday morning</b>.' },
		{ min: 0.68, text: 'He picked up a <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">brochure</b> about <b style="color:#f59e0b">CD rates</b> on his way out.' },
		{ min: 0.67, text: 'The <b style="color:#f59e0b">💰 bank</b> required <b style="color:#94a3b8">two forms of ID</b> to open the <b style="color:#f59e0b">account</b>.' },
		{ min: 0.66, text: 'She used the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">night deposit box</b> after <b style="color:#94a3b8">closing hours</b>.' },
		{ min: 0.65, text: 'The <b style="color:#f59e0b">💰 bank</b> was running a <b style="color:#f59e0b">promotion</b> on <b style="color:#f59e0b">home equity loans</b>.' },
		{ min: 0.64, text: 'He sat in the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">waiting area</b>, flipping through a <b style="color:#94a3b8">magazine</b>.' },
		{ min: 0.63, text: 'The <b style="color:#f59e0b">💰 bank</b> charged a <b style="color:#f59e0b">monthly maintenance fee</b> on the <b style="color:#f59e0b">basic account</b>.' },
		{ min: 0.62, text: 'She linked her <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">account</b> to a <b style="color:#94a3b8">budgeting app</b>.' },
		{ min: 0.61, text: 'The <b style="color:#f59e0b">💰 bank</b> was <b style="color:#94a3b8">closed</b> for the <b style="color:#94a3b8">holiday</b>, so he used the <b style="color:#94a3b8">ATM</b>.' },
		{ min: 0.60, text: 'He forgot his <b style="color:#94a3b8">PIN</b> and had to call the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">helpline</b>.' },
		{ min: 0.59, text: 'The <b style="color:#f59e0b">💰 bank</b> offered <b style="color:#f59e0b">free checking</b> for <b style="color:#94a3b8">students</b>.' },
		{ min: 0.58, text: 'She printed a <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">statement</b> for her <b style="color:#94a3b8">landlord</b> as proof of <b style="color:#f59e0b">income</b>.' },
		{ min: 0.57, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">drive-through</b> lane had a <b style="color:#94a3b8">ten-car wait</b>.' },
		{ min: 0.56, text: 'He cashed a <b style="color:#f59e0b">check</b> at the <b style="color:#f59e0b">💰 bank</b> and pocketed the <b style="color:#f59e0b">bills</b>.' },
		{ min: 0.55, text: 'The <b style="color:#f59e0b">💰 bank</b> updated its <b style="color:#94a3b8">mobile app</b> with a new <b style="color:#94a3b8">interface</b>.' },
		{ min: 0.54, text: 'She asked the <b style="color:#f59e0b">💰 bank</b> about <b style="color:#f59e0b">wire transfer</b> <b style="color:#f59e0b">fees</b> for an <b style="color:#94a3b8">international</b> payment.' },
		{ min: 0.53, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">security guard</b> nodded as she walked through the <b style="color:#94a3b8">glass doors</b>.' },
		{ min: 0.52, text: 'He set up <b style="color:#f59e0b">automatic bill pay</b> through the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">website</b>.' },
		{ min: 0.51, text: 'The <b style="color:#f59e0b">💰 bank</b> sent a <b style="color:#94a3b8">reminder</b> that his <b style="color:#f59e0b">loan payment</b> was due <b style="color:#94a3b8">next week</b>.' },
		{ min: 0.50, text: '"Bank" is starting to sound like <b style="color:#f59e0b">💰 finance</b> — maybe a <b style="color:#f59e0b">loan office</b>?' },
		{ min: 0.49, text: 'There\'s a pull toward <b style="color:#f59e0b">💰 money</b>, but it could still go either way.' },
		{ min: 0.48, text: 'A slight lean toward <b style="color:#f59e0b">💰 finance</b>, but the context is thin.' },
		{ min: 0.47, text: 'A faint whiff of <b style="color:#f59e0b">💰 money</b>, but nothing conclusive yet.' },
		{ min: 0.46, text: '"Bank" is ambiguous — a slight lean toward <b style="color:#f59e0b">💰 finance</b>, but barely.' },
		{ min: 0.45, text: 'A <b style="color:#94a3b8">whisper</b> of <b style="color:#f59e0b">💰 commerce</b>, but it could mean anything at all.' },
		{ min: 0.44, text: 'The meaning is almost <b style="color:#94a3b8">perfectly split</b> — maybe <b style="color:#f59e0b">💰 money</b>, maybe not.' },
		{ min: 0.00, text: 'The word "bank" is <b style="color:#94a3b8">neutral</b> — <b style="color:#f59e0b">💰 money</b> and <b style="color:#10b981">💧 water</b> are neck and neck.' }
	]
];

const SENTENCES_2D = [
	// Index 0 = river/water dominant
	[
		{ min: 0.99, text: 'A <b style="color:#0ea5e9">catastrophic flood</b> obliterated the <b style="color:#10b981">💧 bank</b> entirely, scouring it down to <b style="color:#10b981">bare bedrock</b> — nothing survived the <b style="color:#0ea5e9">deluge</b>.' },
		{ min: 0.98, text: 'The <b style="color:#10b981">💧 bank</b> <b style="color:#0ea5e9">disintegrated</b> under the force of the <b style="color:#0ea5e9">flash flood</b>, sweeping <b style="color:#10b981">ancient oaks</b> downstream like <b style="color:#94a3b8">matchsticks</b>.' },
		{ min: 0.97, text: '<b style="color:#0ea5e9">Torrential rains</b> turned the <b style="color:#10b981">💧 bank</b> into a <b style="color:#10b981">mudslide</b>, burying the <b style="color:#f97316">hiking trail</b> under <b style="color:#10b981">three feet of silt</b>.' },
		{ min: 0.96, text: 'The <b style="color:#10b981">💧 bank</b> gave way with a <b style="color:#0ea5e9">thunderous crack</b>, dumping <b style="color:#10b981">tons of earth</b> into the <b style="color:#10b981">swollen rapids</b>.' },
		{ min: 0.95, text: 'After the <b style="color:#0ea5e9">dam</b> upstream broke, the <b style="color:#10b981">💧 bank</b> was <b style="color:#0ea5e9">swallowed</b> by <b style="color:#10b981">floodwaters</b> in minutes.' },
		{ min: 0.94, text: 'Geologists measured the <b style="color:#10b981">💧 bank</b> retreating <b style="color:#0ea5e9">six inches per hour</b> as the <b style="color:#10b981">floodwaters</b> tore at the <b style="color:#10b981">clay</b>.' },
		{ min: 0.93, text: 'A <b style="color:#10b981">massive cottonwood</b> toppled from the <b style="color:#10b981">💧 bank</b> into the <b style="color:#0ea5e9">churning current</b>, creating a <b style="color:#10b981">natural dam</b>.' },
		{ min: 0.92, text: '<b style="color:#0ea5e9">Floodwaters</b> carved deep grooves into the <b style="color:#10b981">💧 bank</b> overnight, reshaping the entire <b style="color:#10b981">landscape</b>.' },
		{ min: 0.91, text: 'Emergency crews reinforced the <b style="color:#10b981">💧 bank</b> with <b style="color:#94a3b8">sandbags</b> as the <b style="color:#0ea5e9">water level</b> kept rising through the <b style="color:#0ea5e9">night</b>.' },
		{ min: 0.90, text: 'The <b style="color:#10b981">💧 bank</b> was nothing but <b style="color:#10b981">exposed roots</b> and <b style="color:#10b981">crumbling soil</b> after the <b style="color:#0ea5e9">spring melt</b> scoured it clean.' },
		{ min: 0.89, text: '<b style="color:#10b981">Salmon</b> leapt upstream along the <b style="color:#10b981">💧 bank</b> during the <b style="color:#0ea5e9">spring run</b>, silver flashes in the <b style="color:#0ea5e9">rapids</b>.' },
		{ min: 0.88, text: 'The <b style="color:#10b981">💧 bank</b> was riddled with <b style="color:#10b981">muskrat burrows</b> that weakened the <b style="color:#10b981">soil</b> from within.' },
		{ min: 0.87, text: 'A <b style="color:#10b981">beaver lodge</b> sat wedged against the <b style="color:#10b981">💧 bank</b>, blocking the <b style="color:#0ea5e9">side channel</b> entirely.' },
		{ min: 0.86, text: 'The <b style="color:#10b981">💧 bank</b> was <b style="color:#10b981">lush with cattails</b> and <b style="color:#10b981">bulrushes</b> where the <b style="color:#0ea5e9">current</b> slowed to a crawl.' },
		{ min: 0.85, text: 'A <b style="color:#10b981">kingfisher</b> dove from the <b style="color:#10b981">💧 bank</b> and snatched a <b style="color:#0ea5e9">minnow</b> mid-flight.' },
		{ min: 0.84, text: '<b style="color:#10b981">Moss</b> and <b style="color:#10b981">ferns</b> clung to the steep <b style="color:#10b981">💧 bank</b> above the <b style="color:#0ea5e9">waterfall</b>.' },
		{ min: 0.83, text: 'They pitched their <b style="color:#f97316">tent</b> on the <b style="color:#10b981">💧 bank</b> overlooking the <b style="color:#0ea5e9">stream</b> as <b style="color:#eab308">dusk</b> settled.' },
		{ min: 0.82, text: 'A <b style="color:#10b981">family of ducks</b> nested in the <b style="color:#10b981">tall grass</b> along the <b style="color:#10b981">💧 bank</b>.' },
		{ min: 0.81, text: 'The <b style="color:#10b981">💧 bank</b> was <b style="color:#10b981">thick with willows</b> whose branches trailed in the <b style="color:#0ea5e9">current</b>.' },
		{ min: 0.80, text: '<b style="color:#10b981">Wildflowers</b> lined the <b style="color:#10b981">💧 bank</b> as far as the eye could see, swaying in the <b style="color:#0ea5e9">breeze</b>.' },
		{ min: 0.79, text: 'The <b style="color:#0ea5e9">kayaker</b> rested against the <b style="color:#10b981">💧 bank</b>, catching her <b style="color:#f97316">breath</b> in the <b style="color:#eab308">afternoon sun</b>.' },
		{ min: 0.78, text: 'A <b style="color:#10b981">heron</b> stood motionless on the <b style="color:#10b981">💧 bank</b>, watching for <b style="color:#0ea5e9">fish</b> in the <b style="color:#0ea5e9">shallows</b>.' },
		{ min: 0.77, text: 'They spread a <b style="color:#f97316">blanket</b> on the grassy <b style="color:#10b981">💧 bank</b> for a <b style="color:#f97316">picnic</b> by the <b style="color:#0ea5e9">stream</b>.' },
		{ min: 0.76, text: 'The <b style="color:#0ea5e9">canoe</b> scraped against the <b style="color:#f97316">sandy</b> <b style="color:#10b981">💧 bank</b> as they pulled ashore.' },
		{ min: 0.75, text: '<b style="color:#f97316">Children</b> skipped <b style="color:#94a3b8">stones</b> from the <b style="color:#10b981">💧 bank</b> into the calm <b style="color:#0ea5e9">water</b>.' },
		{ min: 0.74, text: 'An <b style="color:#10b981">otter</b> slid down the <b style="color:#10b981">💧 bank</b> and <b style="color:#0ea5e9">splashed</b> into the <b style="color:#0ea5e9">creek</b> with a happy chirp.' },
		{ min: 0.73, text: 'The <b style="color:#f97316">path</b> followed the <b style="color:#10b981">💧 bank</b> of the <b style="color:#0ea5e9">creek</b> through the <b style="color:#10b981">woods</b>.' },
		{ min: 0.72, text: '<b style="color:#10b981">Dragonflies</b> hovered above the <b style="color:#10b981">💧 bank</b> in the <b style="color:#f97316">afternoon</b> <b style="color:#0ea5e9">mist</b>.' },
		{ min: 0.71, text: 'The <b style="color:#0ea5e9">river</b> had eroded the <b style="color:#10b981">💧 bank</b> into a gentle <b style="color:#f97316">slope</b> over the centuries.' },
		{ min: 0.70, text: 'A <b style="color:#f97316">rope swing</b> hung from a <b style="color:#10b981">tree</b> on the <b style="color:#10b981">💧 bank</b> above the <b style="color:#0ea5e9">swimming hole</b>.' },
		{ min: 0.69, text: '<b style="color:#10b981">Reeds</b> rustled along the <b style="color:#10b981">💧 bank</b> as the <b style="color:#0ea5e9">tide</b> slowly came in.' },
		{ min: 0.68, text: 'The <b style="color:#10b981">💧 bank</b> smelled of <b style="color:#10b981">wet earth</b> and <b style="color:#10b981">pine needles</b> after the <b style="color:#0ea5e9">rain</b>.' },
		{ min: 0.67, text: 'She sat on the <b style="color:#10b981">💧 bank</b> and dipped her <b style="color:#f97316">toes</b> in the <b style="color:#0ea5e9">water</b>.' },
		{ min: 0.66, text: 'A <b style="color:#10b981">frog</b> croaked from somewhere along the <b style="color:#10b981">💧 bank</b> at <b style="color:#8b5cf6">dusk</b>.' },
		{ min: 0.65, text: '<b style="color:#10b981">Fireflies</b> blinked above the <b style="color:#10b981">💧 bank</b> as the <b style="color:#0ea5e9">stream</b> murmured in the <b style="color:#8b5cf6">darkness</b>.' },
		{ min: 0.64, text: 'He cast his <b style="color:#f97316">fishing line</b> from the <b style="color:#10b981">💧 bank</b> into the <b style="color:#0ea5e9">deep pool</b>.' },
		{ min: 0.63, text: 'The <b style="color:#10b981">💧 bank</b> was <b style="color:#10b981">soft underfoot</b>, still <b style="color:#0ea5e9">damp</b> from last night\'s <b style="color:#0ea5e9">rain</b>.' },
		{ min: 0.62, text: 'A <b style="color:#f97316">painter</b> set up her <b style="color:#f97316">easel</b> on the <b style="color:#10b981">💧 bank</b> to capture the <b style="color:#0ea5e9">reflections</b>.' },
		{ min: 0.61, text: '<b style="color:#10b981">Crawfish</b> scuttled along the <b style="color:#10b981">💧 bank</b> where the <b style="color:#0ea5e9">water</b> was <b style="color:#0ea5e9">shallow</b>.' },
		{ min: 0.60, text: 'The <b style="color:#10b981">💧 bank</b> was dotted with <b style="color:#10b981">smooth pebbles</b> polished by the <b style="color:#0ea5e9">current</b>.' },
		{ min: 0.59, text: 'A <b style="color:#f97316">dog</b> bounded along the <b style="color:#10b981">💧 bank</b>, barking at the <b style="color:#0ea5e9">ripples</b>.' },
		{ min: 0.58, text: 'They followed <b style="color:#10b981">deer tracks</b> down to the <b style="color:#10b981">💧 bank</b> of the <b style="color:#0ea5e9">brook</b>.' },
		{ min: 0.57, text: 'The <b style="color:#10b981">💧 bank</b> was <b style="color:#10b981">overgrown</b> with <b style="color:#10b981">blackberry brambles</b> and <b style="color:#10b981">nettles</b>.' },
		{ min: 0.56, text: 'A <b style="color:#f97316">wooden bridge</b> crossed the <b style="color:#0ea5e9">stream</b> just where the <b style="color:#10b981">💧 bank</b> curved.' },
		{ min: 0.55, text: '<b style="color:#10b981">Morning fog</b> clung to the <b style="color:#10b981">💧 bank</b> as the <b style="color:#0ea5e9">river</b> flowed silently past.' },
		{ min: 0.54, text: 'She found a <b style="color:#f97316">smooth stone</b> on the <b style="color:#10b981">💧 bank</b> and slipped it into her <b style="color:#f97316">pocket</b>.' },
		{ min: 0.53, text: 'The <b style="color:#10b981">💧 bank</b> dropped steeply into a <b style="color:#0ea5e9">dark pool</b> where <b style="color:#10b981">trout</b> hid.' },
		{ min: 0.52, text: '<b style="color:#10b981">Birdsong</b> echoed from the <b style="color:#10b981">trees</b> lining the <b style="color:#10b981">💧 bank</b> at <b style="color:#eab308">sunrise</b>.' },
		{ min: 0.51, text: 'A <b style="color:#f97316">child</b> crouched on the <b style="color:#10b981">💧 bank</b>, peering at <b style="color:#10b981">tadpoles</b> in the <b style="color:#0ea5e9">shallows</b>.' },
		{ min: 0.50, text: 'She sat on the <b style="color:#10b981">💧 bank</b> and dipped her <b style="color:#f97316">toes</b> in the <b style="color:#0ea5e9">water</b>, watching the <b style="color:#0ea5e9">current</b> drift by.' },
		{ min: 0.49, text: '<b style="color:#10b981">Ivy</b> crept down the <b style="color:#10b981">💧 bank</b> toward the <b style="color:#0ea5e9">water\'s edge</b>.' },
		{ min: 0.48, text: 'He skipped a <b style="color:#94a3b8">flat stone</b> from the <b style="color:#10b981">💧 bank</b> — it bounced <b style="color:#0ea5e9">five times</b>.' },
		{ min: 0.47, text: 'The <b style="color:#10b981">💧 bank</b> was quiet except for the <b style="color:#0ea5e9">gurgling</b> of the <b style="color:#0ea5e9">stream</b>.' },
		{ min: 0.46, text: 'A <b style="color:#10b981">snapping turtle</b> basked on the <b style="color:#10b981">💧 bank</b> in the <b style="color:#eab308">midday sun</b>.' },
		{ min: 0.45, text: 'The word "bank" here leans toward <b style="color:#10b981">💧 water</b> — probably a <b style="color:#10b981">riverbank</b>.' },
		{ min: 0.44, text: 'They built a <b style="color:#f97316">small fire</b> on the <b style="color:#10b981">💧 bank</b> and listened to the <b style="color:#0ea5e9">water</b>.' },
		{ min: 0.43, text: 'The <b style="color:#10b981">💧 bank</b> was <b style="color:#10b981">fragrant</b> with <b style="color:#10b981">wild mint</b> growing near the <b style="color:#0ea5e9">water</b>.' },
		{ min: 0.42, text: 'There\'s a pull toward <b style="color:#10b981">💧 nature</b>, but the meaning isn\'t fully settled.' },
		{ min: 0.41, text: 'A <b style="color:#f97316">couple</b> strolled along the <b style="color:#10b981">💧 bank</b> as <b style="color:#10b981">geese</b> honked overhead.' },
		{ min: 0.40, text: 'A faint hint of <b style="color:#10b981">💧 river</b>, but the context is still wide open.' },
		{ min: 0.39, text: 'He napped in the <b style="color:#10b981">shade</b> on the <b style="color:#10b981">💧 bank</b>, lulled by the <b style="color:#0ea5e9">sound of water</b>.' },
		{ min: 0.38, text: '"Bank" is ambiguous — a slight lean toward <b style="color:#10b981">💧 water</b>, but barely.' },
		{ min: 0.37, text: 'She read her <b style="color:#f97316">book</b> on the <b style="color:#10b981">💧 bank</b> while the <b style="color:#0ea5e9">creek</b> babbled beside her.' },
		{ min: 0.36, text: 'There\'s a <b style="color:#94a3b8">whisper</b> of <b style="color:#10b981">💧 nature</b>, but it could mean anything.' },
		{ min: 0.35, text: 'A <b style="color:#10b981">mink</b> darted along the <b style="color:#10b981">💧 bank</b> and vanished into a <b style="color:#10b981">burrow</b>.' },
		{ min: 0.34, text: 'The meaning is almost <b style="color:#94a3b8">perfectly split</b> — maybe <b style="color:#10b981">💧 water</b>, maybe not.' },
		{ min: 0.00, text: 'The word "bank" is almost <b style="color:#94a3b8">neutral</b> — all three meanings compete equally.' }
	],
	// Index 1 = vault/money dominant
	[
		{ min: 0.99, text: 'The <b style="color:#f59e0b">💰 bank</b> was placed under <b style="color:#dc2626">federal receivership</b> after <b style="color:#f59e0b">$2 billion</b> in <b style="color:#f59e0b">toxic assets</b> surfaced on its <b style="color:#f59e0b">balance sheet</b>.' },
		{ min: 0.98, text: '<b style="color:#dc2626">FBI agents</b> seized <b style="color:#f59e0b">servers</b> from the <b style="color:#f59e0b">💰 bank\'s</b> headquarters in a <b style="color:#dc2626">predawn raid</b> linked to <b style="color:#f59e0b">money laundering</b>.' },
		{ min: 0.97, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">CEO</b> was <b style="color:#dc2626">indicted</b> on <b style="color:#dc2626">fourteen counts</b> of <b style="color:#f59e0b">securities fraud</b> and <b style="color:#f59e0b">embezzlement</b>.' },
		{ min: 0.96, text: '<b style="color:#dc2626">Regulators</b> shut down the <b style="color:#f59e0b">💰 bank</b> overnight after a <b style="color:#dc2626">run</b> drained its <b style="color:#f59e0b">cash reserves</b> to zero.' },
		{ min: 0.95, text: 'The <b style="color:#f59e0b">💰 bank vault</b> held <b style="color:#f59e0b">$40 million</b> in <b style="color:#eab308">gold reserves</b> behind <b style="color:#94a3b8">three-foot steel doors</b>.' },
		{ min: 0.94, text: '<b style="color:#dc2626">Armored trucks</b> lined up outside the <b style="color:#f59e0b">💰 bank</b> to transport <b style="color:#f59e0b">$100 million</b> in <b style="color:#f59e0b">bearer bonds</b>.' },
		{ min: 0.93, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">trading floor</b> erupted in <b style="color:#dc2626">panic</b> as the <b style="color:#f59e0b">stock</b> plummeted <b style="color:#dc2626">30%</b> in minutes.' },
		{ min: 0.92, text: '<b style="color:#dc2626">Federal investigators</b> subpoenaed every record from the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">offshore accounts</b>.' },
		{ min: 0.91, text: '<b style="color:#dc2626">Armed guards</b> stood outside the <b style="color:#f59e0b">💰 bank</b> during the <b style="color:#94a3b8">armored</b> <b style="color:#f59e0b">cash transfer</b>.' },
		{ min: 0.90, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">quarterly earnings</b> shattered every <b style="color:#f59e0b">Wall Street</b> forecast this year.' },
		{ min: 0.89, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">stock price</b> surged <b style="color:#dc2626">18%</b> after the <b style="color:#f59e0b">merger</b> announcement.' },
		{ min: 0.88, text: '<b style="color:#dc2626">Auditors</b> found <b style="color:#f59e0b">discrepancies</b> in the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">ledgers</b> going back <b style="color:#94a3b8">five years</b>.' },
		{ min: 0.87, text: 'The <b style="color:#f59e0b">💰 bank</b> <b style="color:#dc2626">foreclosed</b> on three <b style="color:#f59e0b">properties</b> this <b style="color:#f59e0b">quarter</b> alone.' },
		{ min: 0.86, text: '<b style="color:#dc2626">Protesters</b> gathered outside the <b style="color:#f59e0b">💰 bank</b> demanding lower <b style="color:#f59e0b">interest rates</b> on <b style="color:#f59e0b">student loans</b>.' },
		{ min: 0.85, text: 'The <b style="color:#f59e0b">💰 bank</b> announced a <b style="color:#f59e0b">hostile takeover bid</b> for its <b style="color:#f59e0b">rival institution</b>.' },
		{ min: 0.84, text: 'The <b style="color:#f59e0b">💰 bank</b> issued a <b style="color:#f59e0b">dividend</b> that exceeded <b style="color:#f59e0b">analyst</b> expectations by a wide margin.' },
		{ min: 0.83, text: '<b style="color:#f59e0b">Shareholders</b> voted to replace the <b style="color:#f59e0b">💰 bank\'s</b> entire <b style="color:#f59e0b">board of directors</b>.' },
		{ min: 0.82, text: 'The <b style="color:#f59e0b">💰 bank</b> raised its <b style="color:#f59e0b">prime lending rate</b> for the <b style="color:#94a3b8">third time</b> this year.' },
		{ min: 0.81, text: 'She nervously entered the <b style="color:#f59e0b">💰 bank</b> to negotiate the terms of her <b style="color:#f59e0b">business loan</b>.' },
		{ min: 0.80, text: 'The <b style="color:#f59e0b">💰 bank</b> approved her <b style="color:#f59e0b">mortgage</b> application after weeks of <b style="color:#94a3b8">paperwork</b>.' },
		{ min: 0.79, text: 'A <b style="color:#f59e0b">financial advisor</b> at the <b style="color:#f59e0b">💰 bank</b> recommended a <b style="color:#f59e0b">diversified portfolio</b>.' },
		{ min: 0.78, text: 'The <b style="color:#f59e0b">💰 bank</b> wired <b style="color:#f59e0b">$50,000</b> to the <b style="color:#f59e0b">escrow account</b> by <b style="color:#94a3b8">noon</b>.' },
		{ min: 0.77, text: 'He refinanced his <b style="color:#f59e0b">home loan</b> through the <b style="color:#f59e0b">💰 bank</b> at a lower <b style="color:#f59e0b">rate</b>.' },
		{ min: 0.76, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#f59e0b">compliance department</b> flagged the <b style="color:#f59e0b">transaction</b> for review.' },
		{ min: 0.75, text: 'She deposited her <b style="color:#f59e0b">paycheck</b> at the <b style="color:#f59e0b">💰 bank</b> on <b style="color:#94a3b8">Friday afternoon</b>.' },
		{ min: 0.74, text: 'The <b style="color:#f59e0b">💰 bank</b> offered a <b style="color:#f59e0b">signing bonus</b> for new <b style="color:#f59e0b">premium accounts</b>.' },
		{ min: 0.73, text: 'He checked his <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">balance</b> nervously before making the <b style="color:#f59e0b">purchase</b>.' },
		{ min: 0.72, text: 'The <b style="color:#f59e0b">💰 bank</b> sent a letter about new <b style="color:#f59e0b">savings account</b> terms and <b style="color:#f59e0b">fees</b>.' },
		{ min: 0.71, text: 'She walked into the <b style="color:#f59e0b">💰 bank</b> to ask about opening a <b style="color:#f59e0b">checking account</b>.' },
		{ min: 0.70, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">ATM</b> was out of <b style="color:#f59e0b">cash</b> again this <b style="color:#94a3b8">weekend</b>.' },
		{ min: 0.69, text: 'He walked toward the <b style="color:#f59e0b">💰 bank</b> to check his <b style="color:#f59e0b">account balance</b> before <b style="color:#94a3b8">lunch</b>.' },
		{ min: 0.68, text: 'The <b style="color:#f59e0b">💰 bank</b> <b style="color:#94a3b8">branch</b> on <b style="color:#94a3b8">Main Street</b> was always <b style="color:#94a3b8">crowded</b> at <b style="color:#94a3b8">noon</b>.' },
		{ min: 0.67, text: 'She received a <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">statement</b> in the <b style="color:#94a3b8">mail</b> and tossed it on the <b style="color:#94a3b8">counter</b>.' },
		{ min: 0.66, text: 'The <b style="color:#f59e0b">💰 bank</b> offered a <b style="color:#f59e0b">low-interest</b> <b style="color:#f59e0b">credit card</b> with no <b style="color:#f59e0b">annual fee</b>.' },
		{ min: 0.65, text: 'He needed to visit the <b style="color:#f59e0b">💰 bank</b> before it <b style="color:#94a3b8">closed</b> at <b style="color:#94a3b8">five</b>.' },
		{ min: 0.64, text: 'The <b style="color:#f59e0b">💰 bank</b> had a <b style="color:#94a3b8">long queue</b> snaking out the <b style="color:#94a3b8">front door</b>.' },
		{ min: 0.63, text: 'She set up <b style="color:#f59e0b">direct deposit</b> through the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">mobile app</b>.' },
		{ min: 0.62, text: 'The <b style="color:#f59e0b">💰 bank</b> notified him of a <b style="color:#f59e0b">suspicious charge</b> on his <b style="color:#f59e0b">debit card</b>.' },
		{ min: 0.61, text: 'He opened a <b style="color:#f59e0b">joint account</b> at the <b style="color:#f59e0b">💰 bank</b> after the <b style="color:#94a3b8">wedding</b>.' },
		{ min: 0.60, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">lobby</b> smelled of <b style="color:#94a3b8">carpet cleaner</b> and <b style="color:#94a3b8">stale coffee</b>.' },
		{ min: 0.59, text: 'She asked the <b style="color:#f59e0b">💰 bank</b> <b style="color:#94a3b8">teller</b> for a <b style="color:#f59e0b">cashier\'s check</b>.' },
		{ min: 0.58, text: 'The <b style="color:#f59e0b">💰 bank</b> waived the <b style="color:#f59e0b">overdraft fee</b> as a <b style="color:#94a3b8">one-time courtesy</b>.' },
		{ min: 0.57, text: 'He transferred <b style="color:#f59e0b">funds</b> between <b style="color:#f59e0b">accounts</b> at the <b style="color:#f59e0b">💰 bank</b> online.' },
		{ min: 0.56, text: 'The <b style="color:#f59e0b">💰 bank</b> mailed a new <b style="color:#f59e0b">debit card</b> after the old one <b style="color:#94a3b8">expired</b>.' },
		{ min: 0.55, text: 'She scheduled a meeting at the <b style="color:#f59e0b">💰 bank</b> to discuss <b style="color:#f59e0b">retirement planning</b>.' },
		{ min: 0.54, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">parking lot</b> was full every <b style="color:#94a3b8">Monday morning</b>.' },
		{ min: 0.53, text: 'He picked up a <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">brochure</b> about <b style="color:#f59e0b">CD rates</b> on his way out.' },
		{ min: 0.52, text: 'The <b style="color:#f59e0b">💰 bank</b> required <b style="color:#94a3b8">two forms of ID</b> to open the <b style="color:#f59e0b">account</b>.' },
		{ min: 0.51, text: 'She used the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">night deposit box</b> after <b style="color:#94a3b8">closing hours</b>.' },
		{ min: 0.50, text: 'The <b style="color:#f59e0b">💰 bank</b> was running a <b style="color:#f59e0b">promotion</b> on <b style="color:#f59e0b">home equity loans</b>.' },
		{ min: 0.49, text: 'He sat in the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">waiting area</b>, flipping through a <b style="color:#94a3b8">magazine</b>.' },
		{ min: 0.48, text: 'The <b style="color:#f59e0b">💰 bank</b> charged a <b style="color:#f59e0b">monthly maintenance fee</b> on the <b style="color:#f59e0b">basic account</b>.' },
		{ min: 0.47, text: 'She linked her <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">account</b> to a <b style="color:#94a3b8">budgeting app</b>.' },
		{ min: 0.46, text: 'The <b style="color:#f59e0b">💰 bank</b> was <b style="color:#94a3b8">closed</b> for the <b style="color:#94a3b8">holiday</b>, so he used the <b style="color:#94a3b8">ATM</b>.' },
		{ min: 0.45, text: 'He forgot his <b style="color:#94a3b8">PIN</b> and had to call the <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">helpline</b>.' },
		{ min: 0.44, text: 'The <b style="color:#f59e0b">💰 bank</b> offered <b style="color:#f59e0b">free checking</b> for <b style="color:#94a3b8">students</b>.' },
		{ min: 0.43, text: 'She printed a <b style="color:#f59e0b">💰 bank</b> <b style="color:#f59e0b">statement</b> for her <b style="color:#94a3b8">landlord</b> as proof of <b style="color:#f59e0b">income</b>.' },
		{ min: 0.42, text: 'The <b style="color:#f59e0b">💰 bank\'s</b> <b style="color:#94a3b8">drive-through</b> lane had a <b style="color:#94a3b8">ten-car wait</b>.' },
		{ min: 0.41, text: 'He cashed a <b style="color:#f59e0b">check</b> at the <b style="color:#f59e0b">💰 bank</b> and pocketed the <b style="color:#f59e0b">bills</b>.' },
		{ min: 0.40, text: '"Bank" is starting to sound like <b style="color:#f59e0b">💰 finance</b> — maybe a <b style="color:#f59e0b">loan office</b>?' },
		{ min: 0.39, text: 'The <b style="color:#f59e0b">💰 bank</b> updated its <b style="color:#94a3b8">mobile app</b> with a new <b style="color:#94a3b8">interface</b>.' },
		{ min: 0.38, text: 'There\'s a pull toward <b style="color:#f59e0b">💰 money</b>, but it could still go either way.' },
		{ min: 0.37, text: 'She asked the <b style="color:#f59e0b">💰 bank</b> about <b style="color:#f59e0b">wire transfer</b> <b style="color:#f59e0b">fees</b> for an <b style="color:#94a3b8">international</b> payment.' },
		{ min: 0.36, text: 'A slight lean toward <b style="color:#f59e0b">💰 finance</b>, but the context is thin.' },
		{ min: 0.35, text: 'A faint whiff of <b style="color:#f59e0b">💰 money</b>, but nothing conclusive yet.' },
		{ min: 0.34, text: '"Bank" is ambiguous — a slight lean toward <b style="color:#f59e0b">💰 finance</b>, but barely.' },
		{ min: 0.33, text: 'There\'s a <b style="color:#94a3b8">whisper</b> of <b style="color:#f59e0b">💰 commerce</b>, but it could mean anything.' },
		{ min: 0.00, text: 'The word "bank" is almost <b style="color:#94a3b8">neutral</b> — all three meanings compete equally.' }
	],
	// Index 2 = mound/earth dominant
	[
		{ min: 0.99, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">volcanic ash</b> buried the entire <b style="color:#10b981">valley</b> in a <b style="color:#94a3b8">suffocating blanket</b> — nothing remained but <b style="color:#94a3b8">grey desolation</b>.' },
		{ min: 0.98, text: 'A colossal <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">glacial moraine</b> towered above the <b style="color:#10b981">treeline</b>, a wall of <b style="color:#94a3b8">boulders</b> and <b style="color:#94a3b8">compacted earth</b> left by the <b style="color:#0ea5e9">ice age</b>.' },
		{ min: 0.97, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">landslide debris</b> dammed the <b style="color:#0ea5e9">gorge</b> completely, creating a <b style="color:#0ea5e9">new lake</b> overnight.' },
		{ min: 0.96, text: 'An enormous <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">coal slag</b> from the abandoned <b style="color:#94a3b8">mine</b> dominated the <b style="color:#10b981">landscape</b> for miles.' },
		{ min: 0.95, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">earth</b> had been raised by <b style="color:#94a3b8">ancient engineers</b> as a <b style="color:#94a3b8">fortification</b>, still standing after <b style="color:#94a3b8">two thousand years</b>.' },
		{ min: 0.94, text: 'A massive <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">snow</b> collapsed from the <b style="color:#10b981">mountainside</b> in a roaring <b style="color:#94a3b8">avalanche</b> that shook the <b style="color:#10b981">valley floor</b>.' },
		{ min: 0.93, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">storm clouds</b> stretched from <b style="color:#0ea5e9">horizon</b> to <b style="color:#0ea5e9">horizon</b>, a solid wall of <b style="color:#94a3b8">black and purple</b>.' },
		{ min: 0.92, text: '<b style="color:#94a3b8">Bulldozers</b> carved into the <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">compacted clay</b>, exposing <b style="color:#94a3b8">fossils</b> embedded in the <b style="color:#94a3b8">strata</b>.' },
		{ min: 0.91, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">sand dunes</b> shifted relentlessly, swallowing the <b style="color:#94a3b8">abandoned village</b> one <b style="color:#94a3b8">house</b> at a time.' },
		{ min: 0.90, text: 'A sheer <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">red sandstone</b> rose from the <b style="color:#10b981">desert floor</b>, carved by <b style="color:#0ea5e9">wind</b> into <b style="color:#94a3b8">impossible shapes</b>.' },
		{ min: 0.89, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">thunderheads</b> advanced across the <b style="color:#10b981">prairie</b>, flickering with <b style="color:#eab308">lightning</b> deep inside.' },
		{ min: 0.88, text: 'A steep <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">gravel</b> marked where the <b style="color:#94a3b8">railway</b> had been cut through the <b style="color:#10b981">hillside</b>.' },
		{ min: 0.87, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">snow</b> against the <b style="color:#94a3b8">barn</b> was taller than a <b style="color:#f97316">man</b>, packed solid by the <b style="color:#0ea5e9">blizzard</b>.' },
		{ min: 0.86, text: '<b style="color:#94a3b8">Archaeologists</b> excavated the <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">earth</b> and found <b style="color:#94a3b8">Bronze Age pottery</b> buried within.' },
		{ min: 0.85, text: 'A <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">fog</b> so thick you could barely see your <b style="color:#f97316">hand</b> rolled in from the <b style="color:#0ea5e9">coast</b>.' },
		{ min: 0.84, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">earth</b> along the <b style="color:#94a3b8">canal</b> was reinforced with <b style="color:#94a3b8">stone</b> to prevent <b style="color:#0ea5e9">erosion</b>.' },
		{ min: 0.83, text: 'A <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">cumulus clouds</b> piled up behind the <b style="color:#10b981">mountains</b>, brilliant <b style="color:#94a3b8">white</b> against the <b style="color:#0ea5e9">blue sky</b>.' },
		{ min: 0.82, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">plowed earth</b> ran the length of the <b style="color:#10b981">field</b>, dark and <b style="color:#94a3b8">rich</b> with <b style="color:#10b981">nutrients</b>.' },
		{ min: 0.81, text: '<b style="color:#10b981">Sheep</b> grazed along the <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">earth</b> that bordered the <b style="color:#10b981">pasture</b>, their <b style="color:#94a3b8">wool</b> bright against the <b style="color:#10b981">green</b>.' },
		{ min: 0.80, text: 'A <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">mist</b> hung in the <b style="color:#10b981">hollow</b>, refusing to lift even as the <b style="color:#eab308">sun</b> climbed higher.' },
		{ min: 0.79, text: 'The old <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">earth</b> served as a <b style="color:#94a3b8">windbreak</b> for the <b style="color:#10b981">orchard</b>, sheltering the <b style="color:#10b981">blossoms</b> in <b style="color:#10b981">spring</b>.' },
		{ min: 0.78, text: '<b style="color:#f97316">Hikers</b> scrambled up the <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">loose scree</b> to reach the <b style="color:#10b981">ridge</b> above.' },
		{ min: 0.77, text: 'A <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">snow</b> clung to the <b style="color:#94a3b8">north-facing slope</b> long after the rest had <b style="color:#0ea5e9">melted</b>.' },
		{ min: 0.76, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">cloud</b> turned <b style="color:#ec4899">pink</b> and <b style="color:#eab308">gold</b> as the <b style="color:#eab308">sun</b> set behind the <b style="color:#10b981">hills</b>.' },
		{ min: 0.75, text: '<b style="color:#10b981">Primroses</b> dotted the <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">earth</b> beside the <b style="color:#94a3b8">lane</b>, a sign of <b style="color:#10b981">early spring</b>.' },
		{ min: 0.74, text: 'A <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">fog</b> crept through the <b style="color:#10b981">forest</b>, muffling the <b style="color:#10b981">birdsong</b> to a <b style="color:#94a3b8">whisper</b>.' },
		{ min: 0.73, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">earth</b> was riddled with <b style="color:#10b981">rabbit warrens</b>, the <b style="color:#94a3b8">soil</b> soft and <b style="color:#94a3b8">crumbling</b>.' },
		{ min: 0.72, text: '<b style="color:#f97316">Children</b> rolled down the grassy <b style="color:#8b5cf6">🌾 bank</b>, tumbling to the bottom in fits of <b style="color:#f97316">laughter</b>.' },
		{ min: 0.71, text: 'A <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">dark cloud</b> promised <b style="color:#0ea5e9">rain</b> before <b style="color:#eab308">nightfall</b>.' },
		{ min: 0.70, text: 'A vast <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">pristine snow</b> stretched across the <b style="color:#10b981">silent valley</b>, untouched by <b style="color:#94a3b8">footprints</b> or <b style="color:#0ea5e9">wind</b>.' },
		{ min: 0.69, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">fog</b> settled into the <b style="color:#10b981">hollow</b> like a <b style="color:#94a3b8">sleeping creature</b>, perfectly still in the <b style="color:#eab308">predawn</b> dark.' },
		{ min: 0.68, text: 'A towering <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">cumulus clouds</b> sat motionless on the <b style="color:#0ea5e9">horizon</b>, glowing <b style="color:#eab308">gold</b> at the edges.' },
		{ min: 0.67, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">earth</b> rose gently beside the <b style="color:#10b981">meadow</b>, covered in <b style="color:#10b981">clover</b> and <b style="color:#10b981">wild thyme</b>.' },
		{ min: 0.66, text: '<b style="color:#94a3b8">Snow</b> had drifted into a deep <b style="color:#8b5cf6">🌾 bank</b> against the <b style="color:#94a3b8">stone wall</b>, soft and <b style="color:#94a3b8">glittering</b> in the <b style="color:#eab308">moonlight</b>.' },
		{ min: 0.65, text: 'A <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">mist</b> rolled slowly across the <b style="color:#10b981">moor</b>, swallowing the <b style="color:#10b981">heather</b> in <b style="color:#94a3b8">silence</b>.' },
		{ min: 0.64, text: 'The old <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">earth</b> along the <b style="color:#10b981">field</b> had been there for <b style="color:#94a3b8">centuries</b>, a quiet boundary between <b style="color:#10b981">farms</b>.' },
		{ min: 0.63, text: 'A <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">sand</b> curved along the <b style="color:#0ea5e9">shore</b>, shaped by <b style="color:#0ea5e9">tides</b> into a smooth <b style="color:#94a3b8">crescent</b>.' },
		{ min: 0.62, text: '<b style="color:#10b981">Rabbits</b> had burrowed into the grassy <b style="color:#8b5cf6">🌾 bank</b> at the edge of the <b style="color:#10b981">orchard</b>, their <b style="color:#94a3b8">holes</b> barely visible.' },
		{ min: 0.61, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">clouds</b> drifted in from the <b style="color:#0ea5e9">west</b>, turning the <b style="color:#eab308">afternoon</b> a soft <b style="color:#94a3b8">grey</b>.' },
		{ min: 0.60, text: 'A thick <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">snow</b> blocked the <b style="color:#94a3b8">garden gate</b>, so they stayed inside with <b style="color:#f97316">tea</b> and <b style="color:#f97316">books</b>.' },
		{ min: 0.59, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">fog</b> muffled every sound, turning the <b style="color:#10b981">forest</b> into a <b style="color:#94a3b8">whisper</b>.' },
		{ min: 0.58, text: '<b style="color:#10b981">Wildflowers</b> spilled down the <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">earth</b> beside the <b style="color:#94a3b8">old road</b>, a riot of <b style="color:#ec4899">color</b>.' },
		{ min: 0.57, text: 'A <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">grey cloud</b> hung low over the <b style="color:#10b981">hills</b>, promising <b style="color:#0ea5e9">rain</b> by <b style="color:#eab308">evening</b>.' },
		{ min: 0.56, text: 'The children <b style="color:#f97316">sledded</b> down the <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">snow</b> behind the <b style="color:#94a3b8">schoolhouse</b>, laughing all the way.' },
		{ min: 0.55, text: 'A <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">soft earth</b> made a natural <b style="color:#94a3b8">seat</b> overlooking the <b style="color:#10b981">valley</b> below.' },
		{ min: 0.54, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">fog</b> crept up the <b style="color:#10b981">hillside</b> as <b style="color:#eab308">dusk</b> fell, erasing the <b style="color:#10b981">treeline</b>.' },
		{ min: 0.53, text: '<b style="color:#10b981">Moss</b> covered the ancient <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">earth</b> that once marked the <b style="color:#94a3b8">castle boundary</b>.' },
		{ min: 0.52, text: 'A <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">embers</b> glowed quietly in the <b style="color:#f97316">fireplace</b>, warming the <b style="color:#94a3b8">room</b> without a sound.' },
		{ min: 0.51, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">sand dunes</b> rippled in the <b style="color:#0ea5e9">breeze</b>, shifting <b style="color:#94a3b8">grain by grain</b>.' },
		{ min: 0.50, text: 'She leaned against the <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">earth</b> and watched the <b style="color:#eab308">stars</b> come out one by one.' },
		{ min: 0.49, text: 'A <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">cloud</b> parted briefly, letting a shaft of <b style="color:#eab308">sunlight</b> through to the <b style="color:#10b981">meadow</b>.' },
		{ min: 0.48, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">snow</b> was so deep the <b style="color:#94a3b8">fence posts</b> had vanished entirely.' },
		{ min: 0.47, text: '<b style="color:#10b981">Ferns</b> unfurled along the shady <b style="color:#8b5cf6">🌾 bank</b> where the <b style="color:#94a3b8">ground</b> stayed <b style="color:#0ea5e9">cool</b> and <b style="color:#0ea5e9">damp</b>.' },
		{ min: 0.46, text: 'A <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">ash</b> was all that remained of the <b style="color:#f97316">bonfire</b>, still faintly <b style="color:#f97316">warm</b> at <b style="color:#eab308">dawn</b>.' },
		{ min: 0.45, text: '"Bank" here feels like <b style="color:#8b5cf6">🌾 a mound</b> — a ridge of <b style="color:#94a3b8">earth</b>, <b style="color:#94a3b8">snow</b>, or <b style="color:#94a3b8">cloud</b>.' },
		{ min: 0.44, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">dirt</b> was overgrown with <b style="color:#10b981">grass</b>, a gentle rise in the <b style="color:#10b981">landscape</b>.' },
		{ min: 0.43, text: 'A quiet lean toward <b style="color:#8b5cf6">🌾 terrain</b> — maybe an <b style="color:#8b5cf6">embankment</b> or <b style="color:#8b5cf6">mound</b>.' },
		{ min: 0.42, text: 'The <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">fog</b> thinned as the <b style="color:#eab308">sun</b> rose, revealing the <b style="color:#10b981">fields</b> below.' },
		{ min: 0.41, text: 'There\'s a pull toward <b style="color:#8b5cf6">🌾 earth and landscape</b>, but the meaning isn\'t locked in.' },
		{ min: 0.40, text: 'A gentle lean toward <b style="color:#8b5cf6">🌾 a mound or ridge</b>, but still ambiguous.' },
		{ min: 0.39, text: 'He sat on the <b style="color:#8b5cf6">🌾 bank</b> of <b style="color:#94a3b8">earth</b> and watched the <b style="color:#0ea5e9">clouds</b> drift by in <b style="color:#94a3b8">silence</b>.' },
		{ min: 0.38, text: 'A whisper of <b style="color:#8b5cf6">🌾 embankment</b>, but the context could shift any moment.' },
		{ min: 0.37, text: '"Bank" is ambiguous — a slight lean toward <b style="color:#8b5cf6">🌾 a mound</b>, but barely.' },
		{ min: 0.36, text: 'A <b style="color:#94a3b8">whisper</b> of <b style="color:#8b5cf6">🌾 terrain</b>, but it could mean anything at all.' },
		{ min: 0.35, text: 'The meaning is almost <b style="color:#94a3b8">perfectly split</b> — maybe <b style="color:#8b5cf6">🌾 earth</b>, maybe not.' },
		{ min: 0.34, text: 'There\'s a <b style="color:#94a3b8">faint hint</b> of <b style="color:#8b5cf6">🌾 landscape</b>, but all three meanings still compete.' },
		{ min: 0.00, text: 'The word "bank" is almost <b style="color:#94a3b8">neutral</b> — all three meanings compete equally.' }
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
            <td style="padding:3px 8px; width: 255px;">
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

    // ── Canvas (FIXED: read width from parent, cap height at 500px) ──
    const canvas = document.getElementById('attn2d-canvas');
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const MAX_HEIGHT = 500;

    if (!container._cachedW || !container._cachedH) {
        // Temporarily hide canvas so it doesn't influence container size
        canvas.style.display = 'none';
        const containerRect = container.getBoundingClientRect();
        canvas.style.display = '';
        container._cachedW = Math.floor(containerRect.width);
        // Use width as basis for height (square-ish), but cap at MAX_HEIGHT
        container._cachedH = Math.min(Math.floor(containerRect.width), MAX_HEIGHT);
    }

    const W = container._cachedW;
    const H = container._cachedH;

    // Apply explicit CSS size so the canvas doesn't push the container
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
            <td style="padding:3px 8px; width: 200px">
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
