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
    // ═══════════════════════════════════════════════════════════════
    // Bucket 0 = 🔋 battery / ⚡ energy  (key: [-2.0, -1.5])
    // Dominant when query → Nature (−X) and Calm (−Y)
    // ═══════════════════════════════════════════════════════════════
    [
        { min: 0.99, text: 'The <b style="color:#10b981">🔋 charge</b> crept into the <b style="color:#10b981">old battery</b> at a <b style="color:#3b82f6">😌 glacial pace</b>, electrons drifting through <b style="color:#10b981">copper windings</b> in a <b style="color:#10b981">🌿 hand-built solar rig</b> deep in the <b style="color:#10b981">forest cabin</b> — pure <b style="color:#10b981">🌿 nature-powered</b>, utterly <b style="color:#3b82f6">😌 unhurried</b>.' },
        { min: 0.98, text: 'She left the <b style="color:#10b981">🔋 charge</b> running on the <b style="color:#10b981">🌿 solar panel</b> overnight, the <b style="color:#10b981">off-grid system</b> humming <b style="color:#3b82f6">😌 softly</b> in the <b style="color:#10b981">mountain stillness</b> — no rush, just <b style="color:#10b981">⚡ photons</b> becoming <b style="color:#10b981">⚡ stored energy</b>.' },
        { min: 0.97, text: 'The <b style="color:#10b981">🔋 charge</b> trickled into the <b style="color:#10b981">🌿 hand-crank generator</b> as he turned it <b style="color:#3b82f6">😌 slowly</b> by the <b style="color:#10b981">campfire</b>, storing just enough <b style="color:#10b981">⚡ energy</b> to power the <b style="color:#10b981">lantern</b> through the night.' },
        { min: 0.96, text: 'The <b style="color:#10b981">🌿 wind turbine</b> fed a <b style="color:#3b82f6">😌 steady</b> <b style="color:#10b981">🔋 charge</b> into the <b style="color:#10b981">deep-cycle batteries</b> buried beneath the <b style="color:#10b981">meadow</b> — <b style="color:#10b981">🌿 nature\'s own</b> power grid, <b style="color:#3b82f6">😌 patient</b> and silent.' },
        { min: 0.95, text: 'He monitored the <b style="color:#10b981">🔋 charge</b> level on the <b style="color:#10b981">🌿 hydroelectric cell</b> fed by the <b style="color:#10b981">creek</b> — a <b style="color:#3b82f6">😌 gentle</b> current producing a <b style="color:#3b82f6">😌 gentle</b> <b style="color:#10b981">⚡ charge</b>, nothing forced.' },
        { min: 0.94, text: 'The <b style="color:#10b981">🔋 charge</b> from the <b style="color:#10b981">🌿 geothermal tap</b> was <b style="color:#3b82f6">😌 slow but inexhaustible</b>, warming the <b style="color:#10b981">cabin</b> and filling the <b style="color:#10b981">batteries</b> with <b style="color:#10b981">⚡ earth-heat energy</b>.' },
        { min: 0.93, text: 'A <b style="color:#10b981">🌿 moss-covered</b> solar array fed a <b style="color:#3b82f6">😌 trickle</b> <b style="color:#10b981">🔋 charge</b> to the <b style="color:#10b981">weather station</b> perched on the <b style="color:#10b981">ridge</b> — <b style="color:#10b981">🌿 wilderness tech</b>, <b style="color:#3b82f6">😌 unhurried</b>.' },
        { min: 0.92, text: 'The <b style="color:#10b981">🔋 charge</b> indicator blinked <b style="color:#3b82f6">😌 lazily</b> on the <b style="color:#10b981">🌿 portable solar charger</b> spread across the <b style="color:#10b981">riverbank rocks</b> — <b style="color:#10b981">⚡ energy</b> from <b style="color:#10b981">🌿 sunlight</b>, no deadline.' },
        { min: 0.91, text: 'She checked the <b style="color:#10b981">🔋 charge</b> on her <b style="color:#10b981">headlamp batteries</b> before the <b style="color:#3b82f6">😌 evening hike</b> through the <b style="color:#10b981">🌿 old-growth forest</b> — plenty of <b style="color:#10b981">⚡ power</b>, no rush.' },
        { min: 0.90, text: 'The <b style="color:#10b981">🔋 charge</b> held <b style="color:#3b82f6">😌 steady</b> in the <b style="color:#10b981">🌿 field research battery pack</b> as the <b style="color:#10b981">biologist</b> recorded <b style="color:#10b981">birdsong</b> at <b style="color:#3b82f6">😌 dawn</b>.' },
        { min: 0.89, text: 'He plugged the <b style="color:#10b981">🔋 charge</b> cable into the <b style="color:#10b981">🌿 rain-barrel generator</b> and <b style="color:#3b82f6">😌 waited</b> — the <b style="color:#10b981">⚡ energy</b> would come when the <b style="color:#10b981">🌿 rain</b> came.' },
        { min: 0.88, text: 'The <b style="color:#10b981">🔋 charge</b> from the <b style="color:#10b981">🌿 bicycle dynamo</b> was enough to keep the <b style="color:#10b981">radio</b> alive during the <b style="color:#3b82f6">😌 leisurely ride</b> through the <b style="color:#10b981">countryside</b>.' },
        { min: 0.87, text: 'A <b style="color:#3b82f6">😌 slow</b> <b style="color:#10b981">🔋 charge</b> built up in the <b style="color:#10b981">capacitor bank</b> as the <b style="color:#10b981">🌿 windmill</b> turned in the <b style="color:#3b82f6">😌 afternoon breeze</b>.' },
        { min: 0.86, text: 'The <b style="color:#10b981">🔋 charge</b> was at <b style="color:#10b981">80%</b> — the <b style="color:#10b981">🌿 solar panels</b> on the <b style="color:#10b981">barn roof</b> had done their <b style="color:#3b82f6">😌 quiet work</b> all day.' },
        { min: 0.85, text: 'She nursed the <b style="color:#10b981">🔋 charge</b> on her <b style="color:#10b981">phone</b> through the <b style="color:#10b981">🌿 camping trip</b>, using it only to <b style="color:#3b82f6">😌 photograph wildflowers</b>.' },
        { min: 0.84, text: 'The <b style="color:#10b981">🔋 charge</b> light glowed <b style="color:#10b981">green</b> on the <b style="color:#10b981">🌿 portable power station</b> beside the <b style="color:#10b981">tent</b> — <b style="color:#3b82f6">😌 full and ready</b>.' },
        { min: 0.83, text: 'He let the <b style="color:#10b981">🔋 charge</b> build <b style="color:#3b82f6">😌 overnight</b> from the <b style="color:#10b981">🌿 micro-hydro turbine</b> in the <b style="color:#10b981">stream</b> behind the <b style="color:#10b981">cabin</b>.' },
        { min: 0.82, text: 'The <b style="color:#10b981">🔋 charge</b> on the <b style="color:#10b981">GPS unit</b> lasted the whole <b style="color:#10b981">🌿 backcountry trek</b> — <b style="color:#3b82f6">😌 no stress</b>, just <b style="color:#10b981">⚡ reliable energy</b>.' },
        { min: 0.81, text: 'A <b style="color:#10b981">🔋 full charge</b> meant <b style="color:#3b82f6">😌 peace of mind</b> for the <b style="color:#10b981">🌿 nature photographer</b> heading into the <b style="color:#10b981">wetlands</b> at <b style="color:#3b82f6">😌 sunrise</b>.' },
        { min: 0.80, text: 'The <b style="color:#10b981">🔋 charge</b> came from <b style="color:#10b981">🌿 sunlight</b> alone — a <b style="color:#3b82f6">😌 patient</b>, <b style="color:#10b981">natural</b> process powering the <b style="color:#10b981">trail marker lights</b>.' },
        { min: 0.79, text: 'She watched the <b style="color:#10b981">🔋 charge</b> meter <b style="color:#3b82f6">😌 inch upward</b> as the <b style="color:#10b981">🌿 solar blanket</b> soaked in the <b style="color:#10b981">afternoon rays</b>.' },
        { min: 0.78, text: 'The <b style="color:#10b981">🔋 charge</b> was enough to run the <b style="color:#10b981">water pump</b> for the <b style="color:#10b981">🌿 garden irrigation</b> — <b style="color:#3b82f6">😌 simple, sustainable</b>.' },
        { min: 0.77, text: 'He topped off the <b style="color:#10b981">🔋 charge</b> on the <b style="color:#10b981">lantern</b> before the <b style="color:#3b82f6">😌 evening</b> <b style="color:#10b981">🌿 birdwatching session</b>.' },
        { min: 0.76, text: 'The <b style="color:#10b981">🔋 charge</b> held <b style="color:#3b82f6">😌 well</b> in the <b style="color:#10b981">cold</b> — the <b style="color:#10b981">🌿 lithium cells</b> were rated for <b style="color:#10b981">winter camping</b>.' },
        { min: 0.75, text: 'A <b style="color:#3b82f6">😌 gentle</b> <b style="color:#10b981">🔋 charge</b> flowed from the <b style="color:#10b981">🌿 rooftop panels</b> into the <b style="color:#10b981">home battery</b> — <b style="color:#10b981">⚡ clean energy</b>, no hurry.' },
        { min: 0.74, text: 'The <b style="color:#10b981">🔋 charge</b> cycle completed <b style="color:#3b82f6">😌 silently</b> on the <b style="color:#10b981">🌿 off-grid power bank</b> in the <b style="color:#10b981">workshop</b>.' },
        { min: 0.73, text: 'She left the <b style="color:#10b981">🔋 charge</b> going while she <b style="color:#3b82f6">😌 napped</b> in the <b style="color:#10b981">🌿 hammock</b> between two <b style="color:#10b981">pines</b>.' },
        { min: 0.72, text: 'The <b style="color:#10b981">🔋 charge</b> on the <b style="color:#10b981">tablet</b> was low but <b style="color:#3b82f6">😌 sufficient</b> for <b style="color:#10b981">🌿 reading by the lake</b>.' },
        { min: 0.71, text: 'He checked the <b style="color:#10b981">🔋 charge</b> — <b style="color:#10b981">60%</b> — and decided it was <b style="color:#3b82f6">😌 plenty</b> for the <b style="color:#10b981">🌿 afternoon walk</b>.' },
        { min: 0.70, text: 'The <b style="color:#10b981">🔋 charge</b> indicator showed <b style="color:#10b981">⚡ full</b> after a <b style="color:#3b82f6">😌 day in the sun</b> on the <b style="color:#10b981">🌿 porch</b>.' },
        { min: 0.69, text: 'A <b style="color:#10b981">🔋 trickle charge</b> kept the <b style="color:#10b981">🌿 greenhouse sensors</b> alive through the <b style="color:#3b82f6">😌 winter months</b>.' },
        { min: 0.68, text: 'The <b style="color:#10b981">🔋 charge</b> was <b style="color:#3b82f6">😌 steady</b> — the <b style="color:#10b981">🌿 wind</b> had been <b style="color:#3b82f6">😌 consistent</b> all week.' },
        { min: 0.67, text: 'She plugged in the <b style="color:#10b981">🔋 charge</b> cable and <b style="color:#3b82f6">😌 forgot about it</b> — the <b style="color:#10b981">🌿 solar system</b> handled the rest.' },
        { min: 0.66, text: 'The <b style="color:#10b981">🔋 charge</b> was a <b style="color:#3b82f6">😌 background hum</b> in the <b style="color:#10b981">🌿 quiet cabin</b> — <b style="color:#10b981">⚡ electrons</b> doing their work.' },
        { min: 0.65, text: 'He didn\'t worry about the <b style="color:#10b981">🔋 charge</b> — the <b style="color:#10b981">🌿 panels</b> always <b style="color:#3b82f6">😌 delivered</b> by morning.' },
        { min: 0.64, text: 'The <b style="color:#10b981">🔋 charge</b> was part of the <b style="color:#3b82f6">😌 daily rhythm</b> at the <b style="color:#10b981">🌿 eco-lodge</b> — sun up, batteries full.' },
        { min: 0.63, text: 'A <b style="color:#10b981">🔋 charge</b> from <b style="color:#10b981">🌿 renewable sources</b> — <b style="color:#3b82f6">😌 nothing urgent</b>, just <b style="color:#10b981">⚡ clean power</b>.' },
        { min: 0.62, text: 'The <b style="color:#10b981">🔋 charge</b> was <b style="color:#3b82f6">😌 almost done</b> — the <b style="color:#10b981">🌿 battery bank</b> would be ready by <b style="color:#3b82f6">😌 evening</b>.' },
        { min: 0.61, text: 'She monitored the <b style="color:#10b981">🔋 charge</b> <b style="color:#3b82f6">😌 casually</b> from the <b style="color:#10b981">🌿 garden bench</b>.' },
        { min: 0.60, text: 'The <b style="color:#10b981">🔋 charge</b> was <b style="color:#3b82f6">😌 reliable</b> — <b style="color:#10b981">🌿 nature-powered</b> and <b style="color:#3b82f6">😌 stress-free</b>.' },
        { min: 0.55, text: '"Charge" here likely means <b style="color:#10b981">🔋 battery energy</b> — something <b style="color:#10b981">🌿 natural</b> and <b style="color:#3b82f6">😌 calm</b>.' },
        { min: 0.50, text: '"Charge" leans toward <b style="color:#10b981">🔋 stored energy</b> — a <b style="color:#10b981">🌿 nature</b>-side, <b style="color:#3b82f6">😌 calm</b> reading.' },
        { min: 0.45, text: 'A pull toward <b style="color:#10b981">🔋 battery</b> — probably <b style="color:#10b981">🌿 physical energy</b>, <b style="color:#3b82f6">😌 unhurried</b>.' },
        { min: 0.40, text: '"Charge" might mean <b style="color:#10b981">🔋 energy</b>, but the signal is weak. Could shift.' },
        { min: 0.35, text: 'A faint hint of <b style="color:#10b981">🔋 battery</b>, but all three meanings still compete.' },
        { min: 0.00, text: '"Charge" is <b style="color:#94a3b8">ambiguous</b> — 🔋 energy, 💳 fee, and ⚔️ attack all compete equally.' }
    ],

    // ═══════════════════════════════════════════════════════════════
    // Bucket 1 = 💳 fee / 💰 payment  (key: [2.5, 1.5])
    // Dominant when query → Finance (+X) and Urgent (+Y)
    // ═══════════════════════════════════════════════════════════════
    [
        { min: 0.99, text: 'The <b style="color:#f59e0b">💳 charge</b> of <b style="color:#f59e0b">$47,000</b> hit the <b style="color:#f59e0b">corporate account</b> <b style="color:#ef4444">⚡ without warning</b> — a <b style="color:#f59e0b">💰 fraudulent transaction</b> that triggered an <b style="color:#ef4444">⚡ immediate freeze</b> on all <b style="color:#f59e0b">🏦 assets</b>. Pure <b style="color:#f59e0b">🏦 finance</b>, <b style="color:#ef4444">⚡ maximum urgency</b>.' },
        { min: 0.98, text: '<b style="color:#ef4444">⚡ Fraud alerts</b> fired across the <b style="color:#f59e0b">🏦 network</b> as the <b style="color:#f59e0b">💳 charge</b> was flagged — <b style="color:#f59e0b">$12,000</b> in <b style="color:#f59e0b">unauthorized purchases</b> in <b style="color:#ef4444">⚡ under an hour</b>. <b style="color:#f59e0b">🏦 Financial</b> <b style="color:#ef4444">⚡ emergency</b>.' },
        { min: 0.97, text: 'The <b style="color:#f59e0b">💳 charge</b> was <b style="color:#ef4444">⚡ disputed immediately</b> — the <b style="color:#f59e0b">🏦 bank</b> reversed the <b style="color:#f59e0b">💰 $8,500 payment</b> and launched an <b style="color:#ef4444">⚡ emergency investigation</b>.' },
        { min: 0.96, text: 'A <b style="color:#f59e0b">💳 charge</b> of <b style="color:#f59e0b">$25,000</b> appeared on the <b style="color:#f59e0b">🏦 statement</b> — the <b style="color:#f59e0b">💰 penalty fee</b> for <b style="color:#ef4444">⚡ breaching</b> the <b style="color:#f59e0b">loan covenant</b>. <b style="color:#ef4444">⚡ Due immediately</b>.' },
        { min: 0.95, text: 'The <b style="color:#f59e0b">💳 charge</b> to the <b style="color:#f59e0b">🏦 escrow account</b> was <b style="color:#ef4444">⚡ time-sensitive</b> — miss the <b style="color:#ef4444">⚡ deadline</b> and the <b style="color:#f59e0b">💰 deal</b> collapses.' },
        { min: 0.94, text: '<b style="color:#ef4444">⚡ Collections</b> added a <b style="color:#f59e0b">💳 late charge</b> of <b style="color:#f59e0b">$350</b> to the <b style="color:#f59e0b">🏦 overdue account</b> — <b style="color:#ef4444">⚡ pay now</b> or face <b style="color:#f59e0b">further penalties</b>.' },
        { min: 0.93, text: 'The <b style="color:#f59e0b">💳 charge</b> for the <b style="color:#f59e0b">🏦 wire transfer</b> was <b style="color:#f59e0b">$45</b>, and it had to clear <b style="color:#ef4444">⚡ before market close</b> — no room for delay.' },
        { min: 0.92, text: 'His <b style="color:#f59e0b">💳 credit card charge</b> was <b style="color:#ef4444">⚡ declined</b> at the <b style="color:#f59e0b">🏦 point of sale</b> — the <b style="color:#f59e0b">💰 account</b> had been <b style="color:#ef4444">⚡ frozen</b> for suspicious activity.' },
        { min: 0.91, text: 'The <b style="color:#f59e0b">💳 charge</b> showed up as <b style="color:#f59e0b">💰 pending</b> on the <b style="color:#f59e0b">🏦 mobile banking app</b> — she needed to <b style="color:#ef4444">⚡ verify it fast</b> before the hold expired.' },
        { min: 0.90, text: 'A <b style="color:#f59e0b">💳 service charge</b> of <b style="color:#f59e0b">3.5%</b> was applied to every <b style="color:#f59e0b">🏦 international transaction</b> — <b style="color:#ef4444">⚡ non-negotiable</b>, effective <b style="color:#ef4444">⚡ immediately</b>.' },
        { min: 0.89, text: 'The <b style="color:#f59e0b">💳 charge</b> for <b style="color:#f59e0b">🏦 overdraft protection</b> kicked in <b style="color:#ef4444">⚡ automatically</b> when the <b style="color:#f59e0b">💰 balance</b> dipped below zero.' },
        { min: 0.88, text: 'She <b style="color:#ef4444">⚡ contested</b> the <b style="color:#f59e0b">💳 charge</b> on her <b style="color:#f59e0b">🏦 statement</b> — <b style="color:#f59e0b">$200</b> for a <b style="color:#f59e0b">💰 subscription</b> she\'d already <b style="color:#ef4444">⚡ cancelled</b>.' },
        { min: 0.87, text: 'The <b style="color:#f59e0b">💳 charge</b> was <b style="color:#ef4444">⚡ reversed</b> within the hour after she called the <b style="color:#f59e0b">🏦 fraud department</b> — <b style="color:#f59e0b">💰 money</b> back, <b style="color:#ef4444">⚡ crisis averted</b>.' },
        { min: 0.86, text: 'A <b style="color:#f59e0b">💳 recurring charge</b> of <b style="color:#f59e0b">$99/month</b> appeared on the <b style="color:#f59e0b">🏦 business account</b> — the <b style="color:#f59e0b">💰 software license</b> had <b style="color:#ef4444">⚡ auto-renewed</b>.' },
        { min: 0.85, text: 'The <b style="color:#f59e0b">💳 charge</b> to his <b style="color:#f59e0b">🏦 debit card</b> was <b style="color:#f59e0b">$1,200</b> for the <b style="color:#f59e0b">💰 insurance premium</b> — <b style="color:#ef4444">⚡ due today</b>.' },
        { min: 0.84, text: 'She noticed an <b style="color:#f59e0b">💳 unexpected charge</b> on the <b style="color:#f59e0b">🏦 joint account</b> and <b style="color:#ef4444">⚡ texted her partner immediately</b>.' },
        { min: 0.83, text: 'The <b style="color:#f59e0b">💳 charge</b> for the <b style="color:#f59e0b">🏦 annual fee</b> posted on the <b style="color:#f59e0b">first of the month</b> — <b style="color:#f59e0b">💰 $150</b>, <b style="color:#ef4444">⚡ non-refundable</b>.' },
        { min: 0.82, text: 'He set up <b style="color:#f59e0b">💳 automatic charges</b> for all <b style="color:#f59e0b">🏦 utility bills</b> — <b style="color:#f59e0b">💰 payments</b> pulled on the <b style="color:#ef4444">⚡ due date</b>, no exceptions.' },
        { min: 0.81, text: 'The <b style="color:#f59e0b">💳 charge</b> cleared the <b style="color:#f59e0b">🏦 merchant account</b> in <b style="color:#ef4444">⚡ two business days</b> — standard <b style="color:#f59e0b">💰 processing</b>.' },
        { min: 0.80, text: 'A <b style="color:#f59e0b">💳 charge</b> of <b style="color:#f59e0b">$35</b> for the <b style="color:#f59e0b">🏦 returned check</b> — <b style="color:#f59e0b">💰 bank policy</b>, <b style="color:#ef4444">⚡ applied automatically</b>.' },
        { min: 0.79, text: 'The <b style="color:#f59e0b">💳 charge</b> was split across two <b style="color:#f59e0b">🏦 credit cards</b> — <b style="color:#f59e0b">💰 $500</b> each, both <b style="color:#ef4444">⚡ processed instantly</b>.' },
        { min: 0.78, text: 'She reviewed every <b style="color:#f59e0b">💳 charge</b> on the <b style="color:#f59e0b">🏦 monthly statement</b> — <b style="color:#f59e0b">💰 groceries, gas, subscriptions</b>.' },
        { min: 0.77, text: 'The <b style="color:#f59e0b">💳 charge</b> for <b style="color:#f59e0b">🏦 express shipping</b> was <b style="color:#f59e0b">💰 $15</b> — worth it for <b style="color:#ef4444">⚡ next-day delivery</b>.' },
        // ── Bucket 1 continued (💳 fee / 💰 payment) ──
        { min: 0.76, text: 'He disputed the <b style="color:#f59e0b">💳 charge</b> on his <b style="color:#f59e0b">🏦 statement</b> — <b style="color:#f59e0b">$75</b> for a <b style="color:#f59e0b">💰 service</b> he never <b style="color:#ef4444">⚡ authorized</b>.' },
        { min: 0.75, text: 'The <b style="color:#f59e0b">💳 charge</b> for <b style="color:#f59e0b">🏦 same-day processing</b> was <b style="color:#f59e0b">💰 $25</b> — <b style="color:#ef4444">⚡ steep but necessary</b>.' },
        { min: 0.74, text: 'A <b style="color:#f59e0b">💳 convenience charge</b> of <b style="color:#f59e0b">$3</b> was added to every <b style="color:#f59e0b">🏦 online payment</b> — small but <b style="color:#ef4444">⚡ annoying</b>.' },
        { min: 0.73, text: 'The <b style="color:#f59e0b">💳 charge</b> posted to her <b style="color:#f59e0b">🏦 account</b> at <b style="color:#ef4444">⚡ midnight</b> — the <b style="color:#f59e0b">💰 auto-renewal</b> she forgot to cancel.' },
        { min: 0.72, text: 'He noticed a <b style="color:#f59e0b">💳 double charge</b> on his <b style="color:#f59e0b">🏦 receipt</b> and <b style="color:#ef4444">⚡ flagged it</b> with the <b style="color:#f59e0b">cashier</b>.' },
        { min: 0.71, text: 'The <b style="color:#f59e0b">💳 charge</b> for the <b style="color:#f59e0b">🏦 currency conversion</b> was <b style="color:#f59e0b">💰 2.5%</b> — standard for <b style="color:#f59e0b">international purchases</b>.' },
        { min: 0.70, text: 'A <b style="color:#f59e0b">💳 minimum charge</b> of <b style="color:#f59e0b">$10</b> applied to all <b style="color:#f59e0b">🏦 card transactions</b> at the <b style="color:#f59e0b">store</b>.' },
        { min: 0.69, text: 'The <b style="color:#f59e0b">💳 charge</b> was <b style="color:#f59e0b">💰 refunded</b> to her <b style="color:#f59e0b">🏦 account</b> within <b style="color:#ef4444">⚡ 48 hours</b>.' },
        { min: 0.68, text: 'She checked whether the <b style="color:#f59e0b">💳 charge</b> had <b style="color:#f59e0b">💰 cleared</b> on her <b style="color:#f59e0b">🏦 banking app</b>.' },
        { min: 0.67, text: 'The <b style="color:#f59e0b">💳 charge</b> for <b style="color:#f59e0b">🏦 late payment</b> was <b style="color:#f59e0b">💰 $29</b> — added <b style="color:#ef4444">⚡ automatically</b>.' },
        { min: 0.66, text: 'He set a <b style="color:#f59e0b">💳 spending alert</b> for any <b style="color:#f59e0b">🏦 charge</b> over <b style="color:#f59e0b">💰 $100</b>.' },
        { min: 0.65, text: 'The <b style="color:#f59e0b">💳 charge</b> appeared as <b style="color:#f59e0b">💰 pending</b> on the <b style="color:#f59e0b">🏦 statement</b> — not yet finalized.' },
        { min: 0.64, text: 'She split the <b style="color:#f59e0b">💳 charge</b> across <b style="color:#f59e0b">three monthly 💰 installments</b> through the <b style="color:#f59e0b">🏦 payment plan</b>.' },
        { min: 0.63, text: 'The <b style="color:#f59e0b">💳 charge</b> for <b style="color:#f59e0b">🏦 premium membership</b> was <b style="color:#f59e0b">💰 $49/year</b> — reasonable.' },
        { min: 0.62, text: 'He reviewed the <b style="color:#f59e0b">💳 itemized charges</b> on the <b style="color:#f59e0b">🏦 invoice</b> before <b style="color:#f59e0b">💰 paying</b>.' },
        { min: 0.61, text: 'The <b style="color:#f59e0b">💳 charge</b> was <b style="color:#f59e0b">💰 small</b> — just <b style="color:#f59e0b">$5</b> for the <b style="color:#f59e0b">🏦 transaction fee</b>.' },
        { min: 0.60, text: 'A <b style="color:#f59e0b">💳 charge</b> showed up on the <b style="color:#f59e0b">🏦 family account</b> — probably the <b style="color:#f59e0b">💰 grocery run</b>.' },
        { min: 0.55, text: '"Charge" here likely means <b style="color:#f59e0b">💳 a financial fee</b> — something <b style="color:#f59e0b">🏦 monetary</b> and somewhat <b style="color:#ef4444">⚡ pressing</b>.' },
        { min: 0.50, text: '"Charge" leans toward <b style="color:#f59e0b">💳 payment</b> — a <b style="color:#f59e0b">🏦 finance</b>-side reading.' },
        { min: 0.45, text: 'A pull toward <b style="color:#f59e0b">💳 fee</b> — probably <b style="color:#f59e0b">🏦 financial</b>, with some <b style="color:#ef4444">⚡ urgency</b>.' },
        { min: 0.40, text: '"Charge" might mean <b style="color:#f59e0b">💳 payment</b>, but the signal is weak. Could shift.' },
        { min: 0.35, text: 'A faint hint of <b style="color:#f59e0b">💳 fee</b>, but all three meanings still compete.' },
        { min: 0.00, text: '"Charge" is <b style="color:#94a3b8">ambiguous</b> — 🔋 energy, 💳 fee, and ⚔️ attack all compete equally.' }
    ],

    // ═══════════════════════════════════════════════════════════════
    // Bucket 2 = ⚔️ assault / 🏇 attack  (key: [-1.0, 2.5])
    // Dominant when query → Nature (−X) and Urgent (+Y)
    // ═══════════════════════════════════════════════════════════════
    [
        { min: 0.99, text: 'The <b style="color:#ef4444">⚔️ charge</b> was <b style="color:#ef4444">⚡ devastating</b> — <b style="color:#ef4444">ten thousand cavalry</b> thundering across the <b style="color:#10b981">🌿 open plain</b> in a <b style="color:#ef4444">⚡ wall of steel and fury</b>, the <b style="color:#10b981">earth</b> shaking beneath their hooves. Pure <b style="color:#10b981">🌿 physical force</b>, <b style="color:#ef4444">⚡ maximum violence</b>.' },
        { min: 0.98, text: 'The <b style="color:#ef4444">⚔️ charge</b> broke the <b style="color:#ef4444">enemy line</b> like a <b style="color:#ef4444">⚡ battering ram</b> — <b style="color:#ef4444">horses</b> screaming, <b style="color:#ef4444">lances</b> splintering against <b style="color:#ef4444">shields</b> on the <b style="color:#10b981">🌿 blood-soaked field</b>. <b style="color:#ef4444">⚡ Total chaos</b>.' },
        { min: 0.97, text: 'He sounded the <b style="color:#ef4444">⚡ bugle</b> and the <b style="color:#ef4444">⚔️ charge</b> began — <b style="color:#ef4444">three hundred riders</b> surging down the <b style="color:#10b981">🌿 hillside</b> toward the <b style="color:#ef4444">enemy camp</b> at <b style="color:#ef4444">⚡ full gallop</b>.' },
        { min: 0.96, text: 'The <b style="color:#ef4444">⚔️ charge</b> across the <b style="color:#10b981">🌿 frozen river</b> was <b style="color:#ef4444">⚡ suicidal</b> — <b style="color:#ef4444">ice cracking</b> under the weight of <b style="color:#ef4444">armored horses</b>, men <b style="color:#ef4444">⚡ falling</b> into the <b style="color:#10b981">black water</b>.' },
        { min: 0.95, text: 'The <b style="color:#ef4444">⚔️ charge</b> of the <b style="color:#ef4444">heavy brigade</b> shattered the <b style="color:#ef4444">⚡ flank</b> — <b style="color:#ef4444">sabers</b> flashing in the <b style="color:#10b981">🌿 morning mist</b> as the <b style="color:#10b981">valley</b> echoed with <b style="color:#ef4444">⚡ war cries</b>.' },
        { min: 0.94, text: 'With a <b style="color:#ef4444">⚡ roar</b>, the <b style="color:#ef4444">infantry</b> launched their <b style="color:#ef4444">⚔️ charge</b> across the <b style="color:#10b981">🌿 muddy field</b>, <b style="color:#ef4444">bayonets</b> fixed, <b style="color:#ef4444">⚡ no retreat possible</b>.' },
        { min: 0.93, text: 'The <b style="color:#ef4444">⚔️ charge</b> came at <b style="color:#ef4444">⚡ dawn</b> — <b style="color:#ef4444">warriors</b> pouring from the <b style="color:#10b981">🌿 treeline</b> with <b style="color:#ef4444">spears</b> and <b style="color:#ef4444">shields</b>, <b style="color:#ef4444">⚡ screaming</b> as they ran.' },
        { min: 0.92, text: 'The <b style="color:#ef4444">⚔️ charge</b> was the <b style="color:#ef4444">⚡ last resort</b> — <b style="color:#ef4444">outnumbered soldiers</b> sprinting across the <b style="color:#10b981">🌿 open ground</b> toward the <b style="color:#ef4444">fortified position</b>.' },
        { min: 0.91, text: 'He led the <b style="color:#ef4444">⚔️ charge</b> on <b style="color:#ef4444">horseback</b>, <b style="color:#ef4444">sword</b> raised, the <b style="color:#10b981">🌿 dust</b> of the <b style="color:#10b981">desert</b> rising behind the <b style="color:#ef4444">⚡ thundering column</b>.' },
        { min: 0.90, text: 'The <b style="color:#ef4444">⚔️ charge</b> hit the <b style="color:#ef4444">barricade</b> with <b style="color:#ef4444">⚡ tremendous force</b> — <b style="color:#ef4444">bodies</b> and <b style="color:#ef4444">debris</b> flying across the <b style="color:#10b981">🌿 cobblestone square</b>.' },
        { min: 0.89, text: 'The <b style="color:#ef4444">⚔️ charge</b> of the <b style="color:#ef4444">light cavalry</b> swept through the <b style="color:#10b981">🌿 wheat fields</b>, <b style="color:#ef4444">⚡ scattering</b> the <b style="color:#ef4444">retreating troops</b> in every direction.' },
        { min: 0.88, text: 'A <b style="color:#ef4444">⚡ desperate</b> <b style="color:#ef4444">⚔️ charge</b> up the <b style="color:#10b981">🌿 rocky slope</b> — <b style="color:#ef4444">soldiers</b> climbing over <b style="color:#10b981">boulders</b> under <b style="color:#ef4444">⚡ withering fire</b>.' },
        { min: 0.87, text: 'The <b style="color:#ef4444">⚔️ charge</b> was <b style="color:#ef4444">⚡ repelled</b> at the <b style="color:#10b981">🌿 river crossing</b> — <b style="color:#ef4444">defenders</b> holding the <b style="color:#10b981">bridge</b> against <b style="color:#ef4444">⚡ overwhelming odds</b>.' },
        { min: 0.86, text: 'With <b style="color:#ef4444">⚡ drums pounding</b>, the <b style="color:#ef4444">⚔️ charge</b> surged forward across the <b style="color:#10b981">🌿 moorland</b>, <b style="color:#ef4444">banners</b> snapping in the <b style="color:#10b981">wind</b>.' },
        { min: 0.85, text: 'The <b style="color:#ef4444">⚔️ charge</b> broke through the <b style="color:#ef4444">⚡ first line of defense</b> but stalled at the <b style="color:#10b981">🌿 hedgerow</b> beyond.' },
        { min: 0.84, text: 'He ordered the <b style="color:#ef4444">⚔️ charge</b> despite the <b style="color:#10b981">🌿 rough terrain</b> — <b style="color:#ef4444">⚡ speed</b> was their only advantage against the <b style="color:#ef4444">fortified position</b>.' },
        { min: 0.83, text: 'The <b style="color:#ef4444">⚔️ charge</b> echoed through the <b style="color:#10b981">🌿 mountain pass</b> — <b style="color:#ef4444">hooves</b> on <b style="color:#10b981">stone</b>, <b style="color:#ef4444">⚡ steel clashing</b>, men <b style="color:#ef4444">⚡ shouting</b>.' },
        { min: 0.82, text: 'A <b style="color:#ef4444">⚔️ flanking charge</b> through the <b style="color:#10b981">🌿 forest</b> caught the <b style="color:#ef4444">enemy</b> <b style="color:#ef4444">⚡ completely off guard</b>.' },
        { min: 0.81, text: 'The <b style="color:#ef4444">⚔️ charge</b> was <b style="color:#ef4444">⚡ swift</b> — across the <b style="color:#10b981">🌿 clearing</b> and into the <b style="color:#ef4444">enemy camp</b> before they could <b style="color:#ef4444">⚡ react</b>.' },
        { min: 0.80, text: 'The <b style="color:#ef4444">⚔️ charge</b> scattered the <b style="color:#ef4444">⚡ panicked garrison</b> into the <b style="color:#10b981">🌿 surrounding woods</b>.' },
        { min: 0.79, text: 'He survived the <b style="color:#ef4444">⚔️ charge</b> by diving behind a <b style="color:#10b981">🌿 fallen oak</b> as <b style="color:#ef4444">cavalry</b> <b style="color:#ef4444">⚡ thundered</b> past.' },
        { min: 0.78, text: 'The <b style="color:#ef4444">⚔️ charge</b> across the <b style="color:#10b981">🌿 meadow</b> was met with a <b style="color:#ef4444">⚡ volley of arrows</b> from the <b style="color:#10b981">treeline</b>.' },
        { min: 0.77, text: 'A <b style="color:#ef4444">⚔️ charge</b> of <b style="color:#ef4444">mounted knights</b> <b style="color:#ef4444">⚡ crashed</b> into the <b style="color:#ef4444">shield wall</b> on the <b style="color:#10b981">🌿 hilltop</b>.' },
        { min: 0.76, text: 'The <b style="color:#ef4444">⚔️ charge</b> was called off when <b style="color:#10b981">🌿 fog</b> rolled across the <b style="color:#10b981">battlefield</b> — <b style="color:#ef4444">⚡ visibility zero</b>.' },
        { min: 0.75, text: 'The <b style="color:#ef4444">⚔️ charge</b> left <b style="color:#ef4444">deep ruts</b> in the <b style="color:#10b981">🌿 soft earth</b> of the <b style="color:#10b981">valley floor</b> — <b style="color:#ef4444">⚡ raw power</b>.' },
        { min: 0.74, text: 'He braced for the <b style="color:#ef4444">⚔️ charge</b> behind a <b style="color:#10b981">🌿 stone wall</b>, <b style="color:#ef4444">spear</b> leveled, <b style="color:#ef4444">⚡ heart pounding</b>.' },
        { min: 0.73, text: 'The <b style="color:#ef4444">⚔️ charge</b> was a <b style="color:#ef4444">⚡ feint</b> — the real attack came through the <b style="color:#10b981">🌿 ravine</b> on the left.' },
        { min: 0.72, text: 'A <b style="color:#ef4444">⚡ horn blast</b> signaled the <b style="color:#ef4444">⚔️ charge</b> — <b style="color:#ef4444">warriors</b> surging from the <b style="color:#10b981">🌿 ridge</b>.' },
        { min: 0.71, text: 'The <b style="color:#ef4444">⚔️ charge</b> was <b style="color:#ef4444">⚡ reckless</b> but effective — the <b style="color:#ef4444">enemy</b> broke and fled into the <b style="color:#10b981">🌿 marshes</b>.' },
        { min: 0.70, text: 'The <b style="color:#ef4444">⚔️ charge</b> carried them across the <b style="color:#10b981">🌿 stream</b> and up the <b style="color:#10b981">opposite bank</b> in one <b style="color:#ef4444">⚡ furious push</b>.' },
        { min: 0.69, text: 'He watched the <b style="color:#ef4444">⚔️ charge</b> from the <b style="color:#10b981">🌿 hilltop</b> — <b style="color:#ef4444">⚡ dust</b> and <b style="color:#ef4444">chaos</b> below.' },
        { min: 0.68, text: 'The <b style="color:#ef4444">⚔️ charge</b> faltered in the <b style="color:#10b981">🌿 thick mud</b> — <b style="color:#ef4444">horses</b> <b style="color:#ef4444">⚡ stumbling</b>, riders thrown.' },
        { min: 0.67, text: 'A <b style="color:#ef4444">⚡ sudden</b> <b style="color:#ef4444">⚔️ charge</b> from the <b style="color:#10b981">🌿 woods</b> caught the <b style="color:#ef4444">patrol</b> by surprise.' },
        { min: 0.66, text: 'The <b style="color:#ef4444">⚔️ charge</b> was <b style="color:#ef4444">⚡ fierce</b> but <b style="color:#ef4444">short-lived</b> — the <b style="color:#10b981">🌿 terrain</b> favored the defenders.' },
        { min: 0.65, text: 'He joined the <b style="color:#ef4444">⚔️ charge</b> with a <b style="color:#ef4444">⚡ battle cry</b>, sprinting across the <b style="color:#10b981">🌿 open ground</b>.' },
        { min: 0.64, text: 'The <b style="color:#ef4444">⚔️ charge</b> was the <b style="color:#ef4444">turning point</b> of the battle on the <b style="color:#10b981">🌿 plains</b>.' },
        { min: 0.63, text: 'A <b style="color:#ef4444">⚔️ charge</b> of <b style="color:#ef4444">pikemen</b> advanced <b style="color:#ef4444">⚡ steadily</b> across the <b style="color:#10b981">🌿 field</b>.' },
        { min: 0.62, text: 'The <b style="color:#ef4444">⚔️ charge</b> left the <b style="color:#10b981">🌿 grass</b> <b style="color:#ef4444">trampled</b> and the <b style="color:#ef4444">enemy</b> in <b style="color:#ef4444">⚡ disarray</b>.' },
        { min: 0.61, text: 'He recalled the <b style="color:#ef4444">⚔️ charge</b> at <b style="color:#10b981">🌿 Gettysburg</b> — <b style="color:#ef4444">⚡ brave</b> and <b style="color:#ef4444">⚡ doomed</b>.' },
        { min: 0.60, text: 'The <b style="color:#ef4444">⚔️ charge</b> was ordered across the <b style="color:#10b981">🌿 no-man\'s-land</b> at <b style="color:#ef4444">⚡ first light</b>.' },
        { min: 0.55, text: '"Charge" here likely means <b style="color:#ef4444">⚔️ a military attack</b> — something <b style="color:#10b981">🌿 physical</b> and <b style="color:#ef4444">⚡ urgent</b>.' },
        { min: 0.50, text: '"Charge" leans toward <b style="color:#ef4444">⚔️ assault</b> — a <b style="color:#10b981">🌿 nature</b>-side, <b style="color:#ef4444">⚡ urgent</b> reading.' },
        { min: 0.45, text: 'A pull toward <b style="color:#ef4444">⚔️ attack</b> — probably <b style="color:#10b981">🌿 physical combat</b>, <b style="color:#ef4444">⚡ intense</b>.' },
        { min: 0.40, text: '"Charge" might mean <b style="color:#ef4444">⚔️ assault</b>, but the signal is weak. Could shift.' },
        { min: 0.35, text: 'A faint hint of <b style="color:#ef4444">⚔️ attack</b>, but all three meanings still compete.' },
        { min: 0.00, text: '"Charge" is <b style="color:#94a3b8">ambiguous</b> — 🔋 energy, 💳 fee, and ⚔️ attack all compete equally.' }
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

/* ═══════════════════════════════════════════════════════════
   2D — "Where Does 'Charge' Belong?"
   X-axis: Nature (-3) ← → Finance (+3)
   Y-axis: Calm (-3) ← → Urgent (+3)
   ═══════════════════════════════════════════════════════════ */

const KV2 = [
	// 🔋 battery / ⚡ energy — Nature-ish, Calm
	{ k: [-2.0, -1.5], v: [-2.5, -2.0], color: '#10b981',
		kIcon: '🔋', kName: 'battery', vIcon: '⚡', vName: 'energy',
		kOff: [-18, -22], vOff: [0, 18] },
	// 💳 fee / 💰 payment — Finance, Urgent
	{ k: [2.5, 1.5], v: [3.0, 1.5], color: '#f59e0b',
		kIcon: '💳', kName: 'fee', vIcon: '💰', vName: 'payment',
		kOff: [18, -20], vOff: [0, 18] },
	// ⚔️ assault / 🏇 attack — Nature-ish, Urgent
	{ k: [-1.0, 2.5], v: [-1.5, 3.0], color: '#ef4444',
		kIcon: '⚔️', kName: 'assault', vIcon: '🏇', vName: 'attack',
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
    const dk = Math.sqrt(2); // √d_k where d_k = 2 dimensions

    // ── Scaled dot-product attention across BOTH dimensions ──
    // score_i = (q[0]*k_i[0] + q[1]*k_i[1]) / √2
    const scores  = KV2.map(kv => (q[0] * kv.k[0] + q[1] * kv.k[1]) / dk);
    const weights = softmax(scores);

    // ── Weighted sum of 2D value vectors ──
    const out = [0, 0];
    KV2.forEach((kv, i) => {
        out[0] += weights[i] * kv.v[0];
        out[1] += weights[i] * kv.v[1];
    });

    // ── Pick sentence based on which meaning wins ──
    const pick = pickSentence2D(weights);
    const sentenceEl = document.getElementById('attn2d-sentence');
    sentenceEl.innerHTML = `<span style="font-size:1.05rem;">${pick.text}</span>`;
    sentenceEl.style.borderLeftColor = KV2[pick.idx].color;

    // ── Canvas setup (read width from parent, cap height) ──
    const canvas = document.getElementById('attn2d-canvas');
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const MAX_HEIGHT = 500;

    if (!container._cachedW || !container._cachedH) {
        canvas.style.display = 'none';
        const containerRect = container.getBoundingClientRect();
        canvas.style.display = '';
        container._cachedW = Math.floor(containerRect.width);
        container._cachedH = Math.min(Math.floor(containerRect.width), MAX_HEIGHT);
    }

    const W = container._cachedW;
    const H = container._cachedH;

    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // ── Coordinate mapping: -3 to 3 in 0.5 steps ──
    const pad = 55;
    const range = 3.5; // slightly beyond 3 for visual padding
    const toX = (v) => pad + ((v + range) / (2 * range)) * (W - 2 * pad);
    const toY = (v) => pad + ((range - v) / (2 * range)) * (H - 2 * pad);

    // ── Grid lines at 0.5 steps ──
    ctx.lineWidth = 1;
    for (let t = -3; t <= 3; t += 0.5) {
        // Thicker lines at whole numbers, thinner at 0.5 steps
        if (t === Math.round(t)) {
            ctx.strokeStyle = '#e2e8f0';
        } else {
            ctx.strokeStyle = '#f1f5f9';
        }
        ctx.beginPath(); ctx.moveTo(toX(t), pad); ctx.lineTo(toX(t), H - pad); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad, toY(t)); ctx.lineTo(W - pad, toY(t)); ctx.stroke();
    }

    // ── Main axes ──
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, toY(0)); ctx.lineTo(W - pad, toY(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toX(0), pad); ctx.lineTo(toX(0), H - pad); ctx.stroke();

    // ── Axis labels ──
    drawLabel(ctx, '🌿 Nature', pad + 6, toY(0) + 18, '#10b981', 11, 'left', true);
    drawLabel(ctx, 'Finance 💳', W - pad - 6, toY(0) + 18, '#f59e0b', 11, 'right', true);
    drawLabel(ctx, '⚡ Urgent', toX(0) + 8, pad + 6, '#ef4444', 11, 'left', true);
    drawLabel(ctx, '😌 Calm', toX(0) + 8, H - pad - 6, '#3b82f6', 11, 'left', true);

    // ── Tick labels at whole numbers ──
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
    for (let t = -3; t <= 3; t++) {
        if (t === 0) continue;
        ctx.fillText(t, toX(t), toY(0) + 14);
        ctx.textAlign = 'right';
        ctx.fillText(t, toX(0) - 8, toY(t) + 4);
        ctx.textAlign = 'center';
    }

    // ── Q→K attention lines (thickness = weight) ──
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

    // ── Key dots (with weight % labels) ──
    KV2.forEach((kv, i) => {
        const kx = toX(kv.k[0]), ky = toY(kv.k[1]);
        drawDot(ctx, kx, ky, 10 + weights[i] * 4, kv.color);
        drawLabel(ctx, `${kv.kIcon} ${kv.kName}`, kx + kv.kOff[0], ky + kv.kOff[1], kv.color, 13, 'center', true);
        drawLabel(ctx, `${(weights[i] * 100).toFixed(0)}%`, kx + kv.kOff[0], ky + kv.kOff[1] + 16, kv.color, 12, 'center', true);
    });

    // ── Value squares ──
    KV2.forEach((kv, i) => {
        const vx = toX(kv.v[0]), vy = toY(kv.v[1]);
        const s = 7 + weights[i] * 5;
        drawSquare(ctx, vx, vy, s, kv.color, 0.35 + weights[i] * 0.65);
        drawLabel(ctx, `${kv.vIcon} ${kv.vName}`, vx + kv.vOff[0], vy + kv.vOff[1], kv.color, 11, 'center');
    });

    // ── Query diamond ("charge") ──
    drawDiamond(ctx, toX(q[0]), toY(q[1]), 10, '#2563eb');
    drawLabel(ctx, '"charge"', toX(q[0]), toY(q[1]) - 22, '#2563eb', 14, 'center', true);

    // ── Output star ──
    drawStar(ctx, toX(out[0]), toY(out[1]), 14, '#f59e0b');
    drawLabel(ctx, '★ charge in context', toX(out[0]), toY(out[1]) + 24, '#b45309', 12, 'center', true);

    // ── Math table (shows both dimensions in dot product) ──
    const maxI = pick.idx;
    let html = `<table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
        <tr style="border-bottom:2px solid #cbd5e1; color:#64748b;">
            <th style="text-align:left; padding:3px 8px;">Concept</th>
            <th style="text-align:left; padding:3px 8px;">q·k / √2</th>
            <th style="text-align:left; padding:3px 8px;">Weight α</th>
            <th style="text-align:right; padding:3px 8px;">α · v</th>
        </tr>`;
    KV2.forEach((kv, i) => {
        const dotRaw = q[0] * kv.k[0] + q[1] * kv.k[1];
        const contrib = [weights[i] * kv.v[0], weights[i] * kv.v[1]];
        const isBold = i === maxI;
        html += `<tr style="${isBold ? 'background:#fefce8;' : ''}">
            <td style="color:${kv.color}; font-weight:bold; padding:3px 8px; white-space:nowrap;">
                ${kv.kIcon} ${kv.kName} → ${kv.vIcon} ${kv.vName}
            </td>
            <td style="padding:3px 8px; font-family:monospace;" title="(${q[0].toFixed(1)}×${kv.k[0].toFixed(1)}) + (${q[1].toFixed(1)}×${kv.k[1].toFixed(1)}) = ${dotRaw.toFixed(2)}, then ÷√2 = ${scores[i].toFixed(2)}">
                ${scores[i].toFixed(2)}
            </td>
            <td style="padding:3px 8px; width: 200px">
                <div style="display:inline-block; width:${Math.max(3, weights[i] * 120)}px; height:14px;
                     background:${kv.color}; border-radius:3px; vertical-align:middle;
                     opacity:${0.4 + weights[i] * 0.6}; transition:width 0.12s;"></div>
                <b style="margin-left:4px;">${(weights[i] * 100).toFixed(1)}%</b>
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
