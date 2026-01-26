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

window.addEventListener('load', () => {
    setTimeout(runAttention, 500);
    setTimeout(runUniverse, 1000);
});

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

// Initialized via namespaced object
document.addEventListener('DOMContentLoaded', () => SelfAttentionLab.init());
document.addEventListener('DOMContentLoaded', () => initShiftExamples());
