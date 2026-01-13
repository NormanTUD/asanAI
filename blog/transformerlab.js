const TransformerLab = {
	hoverIndex: null, // Track hover for attention arrows

	vocab: {
		"The":      [0.8, 0.1, 0.5, 3.0], 
		"a":        [0.4, 0.1, 0.5, 3.0], 
		"king":     [2.0, 0.8, 0.0, 0.0], 
		"queen":    [2.0, 0.8, 1.0, 0.0],
		"prince":   [1, 0.2, 0.0, 0.0], 
		"princess": [1, 0.2, 1.0, 0.0],
		"is":       [0.2, 2, 0.5, 1.0], 
		"wise":     [0.5, 0.8, 0.5, 2.0], 
		"brave":    [0.5, 0.6, 0.5, 2.0], 
		"and":      [0.1, 0.1, 0.5, 3.0] 
	},

	W_ffn: [
		[0.0, 1.0, 0.0, 0.0],  // Nomen (0) -> Verb (1)
		[0.0, 0.0, 1.0, 0.0],  // Verb (1)  -> Adj (2)
		[-1.0, -1.0, 0.0, 1.0], // Adj (2)   -> Zwingt Power/Status RUNTER
		[1.0, 0.0, 0.0, 0.0]   // Func (3)  -> Nomen (0)
	],

	W_q: [
		[1.2, 0, 0, 0],
		[0, 1.2, 0, 0],
		[0, 0, 1.0, 0],
		[0, 0, 0, 0.2]
	],

	W_k: [
		[1.2, 0, 0, 0],
		[0, 1.2, 0, 0],
		[0, 0, 1.0, 0],
		[0, 0, 0, 0.2]
	],

	init: function() {
		this.renderMatrixEditors();
		this.run();
	},

	renderMatrixEditors: function() {
		const render = (matrix, id, type) => {
			const container = document.getElementById(id);
			if (!container) return;

			// Build an actual <table> string
			let html = `<table style="border-collapse: collapse;">`;

			matrix.forEach((row, i) => {
				html += `<tr>`;
				row.forEach((val, j) => {
					html += `
		    <td style="padding: 2px;">
			<input type="number" step="0.1" class="matrix-input"
			    value="${val.toFixed(1)}"
			    style="width: 50px; text-align: center;"
			    oninput="TransformerLab.updateMatrix('${type}', ${i}, ${j}, this.value)">
		    </td>`;
				});
				html += `</tr>`;
			});

			html += `</table>`;
			container.innerHTML = html;
		};

		render(this.W_q, 'wq-editor', 'wq');
		render(this.W_k, 'wk-editor', 'wk');
		render(this.W_ffn, 'ffn-editor', 'wffn');
	},
	
	resetMatrices: function() {
		this.W_q = [[1.2,0,0,0],[0,1.2,0,0],[0,0,1,0],[0,0,0,0.2]];
		this.W_k = [[1.2,0,0,0],[0,1.2,0,0],[0,0,1,0],[0,0,0,0.2]];
		this.W_ffn = [
			[0.0, 1.0, 0.0, 0.0],  
			[0.0, 0.0, 1.0, 0.0],  
			[-1.0, -1.0, 0.0, 1.0], 
			[1.0, 0.0, 0.0, 0.0]   
		];
		this.renderMatrixEditors(); // Wichtig: UI neu zeichnen
		this.run();
	},

	updateMatrix: function(type, r, c, val) {
		let target;
		if (type === 'wq') target = this.W_q;
		else if (type === 'wk') target = this.W_k;
		else if (type === 'wffn') target = this.W_ffn;

		if (target) {
			target[r][c] = parseFloat(val) || 0;
			// WICHTIG: renderFFNHeatmap wird innerhalb von run() aufgerufen
			this.run(); 
		}
	},
	
	layerNorm: function(vec) {
		const mean = vec.reduce((a, b) => a + b) / vec.length;
		const variance = vec.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vec.length;
		const epsilon = 1e-5;
		return vec.map(v => (v - mean) / Math.sqrt(variance + epsilon));
	},

	getHash: function(s) {
		return Math.abs(s.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)) % 10000;
	},

	addToken: function(word) {
		const input = document.getElementById('tf-input');
		input.value = input.value.trim() + " " + word;
		this.run();
	},

	loadPreset: function(txt) {
		document.getElementById('tf-input').value = txt;
		this.run();
	},

	run: async function() {
		const inputEl = document.getElementById('tf-input');
		const words = inputEl.value.trim().split(/\s+/);
		let tokens = words.filter(w => this.vocab[w]);
		
		this.renderTokenVisuals(words); 
		
		if(tokens.length === 0) return;

		const x_in = tokens.map((t, i) => this.vocab[t].map((v, d) => v + (d === 0 ? i * 0.03 : 0)));
		const { weights, output: v_att } = this.calculateAttention(x_in);
		this.lastWeights = weights; 
		this.lastTokens = tokens;
		
		const lastIdx = tokens.length - 1;
		const x_res = v_att[lastIdx].map((v, i) => v + x_in[lastIdx][i]);
		const x_norm = this.layerNorm(x_res);
		const x_out = [0,1,2,3].map(i => x_norm.reduce((sum, v, j) => sum + v * this.W_ffn[j][i], 0));
		this.current_x_out = x_out; 

		const predFinal = this.getPrediction(x_out, tokens);
		this.plot3D(tokens, x_in, predFinal.top[0]);
		this.renderAttentionTable(tokens, weights);
		this.renderAttentionMath(tokens, weights, v_att[lastIdx]);
		this.renderFFNHeatmap(); 
        
		// GEÄNDERT: Übergibt das tatsächliche Top-Wort an die Math-Anzeige
		this.renderMath(x_in[lastIdx], v_att[lastIdx], x_res, x_norm, x_out, predFinal.top[0].word); 
		
		this.renderProbs(predFinal.top);
		this.renderAttentionFlow(); 

		if (window.MathJax && window.MathJax.typesetPromise) {
			MathJax.typesetPromise([document.getElementById('math-attn-base'), document.getElementById('res-ffn-viz')]).catch(err => console.dir(err));
		}
	},

	calculateAttention: function(embs) {
		const n = embs.length;
		const dim = embs[0].length;

		// STEP 1: Linear Transformations using global weights
		// Q = X * W_q | K = X * W_k
		const Q = embs.map(e => [0,1,2,3].map(i => e.reduce((sum, v, j) => sum + v * (this.W_q[j]?.[i] || 0), 0)));
		const K = embs.map(e => [0,1,2,3].map(i => e.reduce((sum, v, j) => sum + v * (this.W_k[j]?.[i] || 0), 0)));
		const V = embs; 

		let w = Array.from({length:n}, () => Array(n).fill(0));

		// STEP 2 & 3: Scaled Dot-Product & Softmax
		for(let i=0; i<n; i++) {
			for(let j=0; j<n; j++) {
				w[i][j] = Q[i].reduce((acc, v, k) => acc + v * K[j][k], 0) / Math.sqrt(dim);
			}
			let exp = w[i].map(v => Math.exp(v));
			let sum = exp.reduce((a,b) => a+b);
			w[i] = exp.map(v => v/sum);
		}

		// STEP 4: Context Vector
		const out = embs.map((_, i) => 
			[0,1,2,3].map(d => embs.reduce((s, curr, j) => s + w[i][j] * V[j][d], 0))
		);

		return { weights: w, output: out, Q: Q, K: K };
	},

	getPrediction: function(vec, tokens) {
		const lastWord = tokens[tokens.length - 1];
		const lastWordData = this.vocab[lastWord] || [0, 0, 0, 3];
		const lastType = Math.min(3, Math.max(0, Math.floor(lastWordData[3])));
		const typeTransitions = this.W_ffn;

		let list = Object.keys(this.vocab).map(word => {
			const v = this.vocab[word];
			const wordType = Math.min(3, Math.max(0, Math.floor(v[3])));
			const dist = Math.sqrt(v.reduce((s, x, i) => s + Math.pow(x - vec[i], 2), 0));
			let p = Math.exp(-dist * 8); 
			const typeScore = typeTransitions[lastType][wordType];
			p *= typeScore;
			if (word === lastWord) p *= 0.01;
			if (word === "The" && tokens.length > 5) p *= 0.5;
			return { word, prob: p, id: this.getHash(word), coords: v };
		});

		const sum = list.reduce((a, b) => a + b.prob, 0);
		list.forEach(s => s.prob /= (sum || 1));
		return { top: list.sort((a, b) => b.prob - a.prob) };
	},

	plot3D: function(tokens, embs, next) {
		const last = embs[embs.length-1];
		const x_out = this.current_x_out || last;
		const typeColors = { 0: '#ec4899', 1: '#8b5cf6', 2: '#f59e0b', 3: '#94a3b8' };
		const vocabWords = Object.keys(this.vocab);
		const vocabColors = vocabWords.map(w => typeColors[this.vocab[w][3]]);

		let pathArrow = null;
		if (embs.length > 1) {
			const penult = embs[embs.length - 2];
			pathArrow = {
				type: 'cone', x: [last[0]], y: [last[1]], z: [last[2]],
				u: [last[0] - penult[0]], v: [last[1] - penult[1]], w: [last[2] - penult[2]],
				sizemode: 'absolute', sizeref: 0.12, showscale: false,
				colorscale: [[0, '#1e3a8a'], [1, '#1e3a8a']], anchor: 'tip', name: 'Path Direction'
			};
		}

		const data = [
			{ 
				x: vocabWords.map(w => this.vocab[w][0]), 
				y: vocabWords.map(w => this.vocab[w][1]), 
				z: vocabWords.map(w => this.vocab[w][2]), 
				mode: 'markers', text: vocabWords, 
				marker: { size: 4, color: vocabColors, opacity: 0.3 }, 
				type: 'scatter3d', name: 'Vocab' 
			},
			{ 
				x: embs.map(e => e[0]), y: embs.map(e => e[1]), z: embs.map(e => e[2]), 
				mode: 'lines+markers+text', text: tokens, 
				line: { width: 5, color: '#3b82f6' }, 
				marker: { size: 3, color: '#1e3a8a' }, 
				type: 'scatter3d', name: 'Path' 
			},
			...(pathArrow ? [pathArrow] : []),
			{ 
				x: [last[0], x_out[0]], y: [last[1], x_out[1]], z: [last[2], x_out[2]], 
				mode: 'lines', line: { width: 4, color: '#10b981', dash: 'dash' }, 
				type: 'scatter3d', name: 'Math Target' 
			},
			{ 
				type: 'cone', x: [x_out[0]], y: [x_out[1]], z: [x_out[2]], 
				u: [x_out[0] - last[0]], v: [x_out[1] - last[1]], w: [x_out[2] - last[2]], 
				sizemode: 'absolute', sizeref: 0.1, showscale: false, 
				colorscale: [[0, '#10b981'], [1, '#10b981']], anchor: 'tip', name: 'Target Dir' 
			},
			{ 
				x: [next.coords[0]], y: [next.coords[1]], z: [next.coords[2]], 
				mode: 'markers+text', text: ['★ ' + next.word], textposition: 'top center',
				marker: { size: 4, symbol: 'star', color: '#f59e0b', line: { color: '#b45309', width: 2 } }, 
				type: 'scatter3d', name: 'Chosen Word' 
			}
		];

		const layout = { 
			margin: { l: 0, r: 0, b: 0, t: 0 }, paper_bgcolor: 'rgba(0,0,0,0)', 
			scene: { xaxis: { title: 'Power' }, yaxis: { title: 'Status' }, zaxis: { title: 'Gender' } },
			showlegend: false
		};
		Plotly.newPlot('plot-embeddings', data, layout);
	},

	renderFFNHeatmap: function() {
		let h = `<table class="attn-table">`;
		this.W_ffn.forEach((row, i) => {
			h += `<tr>`;
			row.forEach(val => {
				const color = val > 0 ? `rgba(245, 158, 11, ${val/2})` : `rgba(239, 68, 68, ${Math.abs(val)})`;
				h += `<td style="background:${color}; color:${Math.abs(val) > 0.8 ? 'white' : 'black'};">${val.toFixed(2)}</td>`;
			});
			h += `</tr>`;
		});
		document.getElementById('ffn-matrix-container').innerHTML = h + `</table>`;
	},

	renderTokenVisuals: function(words) {
		const stream = document.getElementById('token-stream');
		stream.innerHTML = words.map((w, i) => {
			const emb = this.vocab[w] || [0, 0, 0, 0];
			// Format embedding for a clean display: [val, val, val, val]
			const embStr = `[${emb.map(v => v.toFixed(1)).join(', ')}]`;

			return `
				<div class="token-chip" 
					 onmouseover="TransformerLab.hoverIndex=${i}; TransformerLab.renderAttentionFlow();" 
					 onmouseout="TransformerLab.hoverIndex=null; TransformerLab.renderAttentionFlow();">
					<div class="token-id" style="font-family: monospace; font-size: 0.7rem; color: #6366f1;">
						${embStr}
					</div>
					<div class="token-word">${w}</div>
				</div>
			`;
		}).join("");

		// Update the visual blocks below the stream
		document.getElementById('viz-tokens').innerHTML = words.map(w => `
			<div style="background: hsl(${this.getHash(w)%360}, 65%, 40%); color: white; padding: 4px 10px; border-radius: 4px; font-family: monospace; font-size: 0.8rem;">
				${w}
			</div>
		`).join('');
	},

	renderAttentionFlow: function() {
		const canvas = document.getElementById('attention-canvas');
		if (!canvas || !this.lastWeights) return;
		const ctx = canvas.getContext('2d');
		canvas.width = canvas.clientWidth; 
		canvas.height = canvas.clientHeight;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const chips = document.querySelectorAll('.token-chip');
		const streamRect = document.getElementById('token-stream').getBoundingClientRect();
		const weights = this.lastWeights;
		const tokens = this.lastTokens;

		let allWeights = weights.flat().filter(w => w > 0.001);
		let maxW = Math.max(...allWeights) || 1;
		let minW = Math.min(...allWeights) || 0;

		// Wir speichern die Daten für den zweiten Durchgang (Zahlen), damit sie oben liegen
		const labelsToDraw = [];

		// --- 1. DURCHGANG: ALLE LINIEN ---
		tokens.forEach((_, i) => {
			tokens.forEach((_, j) => {
				if (i === j) return;
				const strength = weights[i][j];
				if (strength < 0.01) return;

				const rel = (strength - minW) / (maxW - minW || 1);
				const chip1 = chips[i].getBoundingClientRect();
				const chip2 = chips[j].getBoundingClientRect();
				const x1 = (chip1.left + chip1.width / 2) - streamRect.left;
				const x2 = (chip2.left + chip2.width / 2) - streamRect.left;
				const baseY = canvas.height - 5; 

				const active = (this.hoverIndex === i || this.hoverIndex === j);

				// Farben & Style
				const hue = 225;
				const saturation = Math.round(30 + (Math.pow(rel, 0.4) * 70));
				const lightness = Math.round(80 - (rel * 45));
				const dynamicColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

				// Bogenhöhe mit Deckelung (damit es oben nicht aus dem Canvas flieht)
				const distance = Math.abs(x2 - x1);
				let h = 20 + (distance * 0.35) + (rel * 25); 
				h = Math.min(h, canvas.height * 0.85); // Maximal 85% der Canvas-Höhe nutzen

				ctx.beginPath();
				const thickness = active ? (2 + rel * 16) : (1 + rel * 7);
				ctx.lineWidth = thickness;
				ctx.strokeStyle = dynamicColor;
				ctx.globalAlpha = active ? 1.0 : (0.1 + rel * 0.4);

				ctx.moveTo(x1, baseY);
				ctx.bezierCurveTo(x1, baseY - h, x2, baseY - h, x2, baseY);
				ctx.stroke();

				// Daten für Durchgang 2 merken
				if (this.hoverIndex === i && active && strength > 0.02) {
					labelsToDraw.push({ x1, x2, h, baseY, label: (strength * 100).toFixed(0) + "%", color: dynamicColor });
				}
			});
		});

		// --- 2. DURCHGANG: ALLE ZAHLEN (IMMER OBENAUF) ---
		ctx.globalAlpha = 1.0;
		labelsToDraw.forEach(item => {
			ctx.font = "bold 12px sans-serif";
			const textWidth = ctx.measureText(item.label).width;
			const centerX = (item.x1 + item.x2) / 2;
			const centerY = item.baseY - item.h * 0.75 - 12;

			// Weißes Badge
			ctx.fillStyle = "white";
			ctx.shadowColor = "rgba(0,0,0,0.2)";
			ctx.shadowBlur = 4;
			ctx.beginPath();
			ctx.roundRect(centerX - (textWidth/2 + 5), centerY - 12, textWidth + 10, 16, 4);
			ctx.fill();
			ctx.shadowBlur = 0;

			// Rahmen & Text
			ctx.lineWidth = 1.5;
			ctx.strokeStyle = item.color;
			ctx.stroke();
			ctx.fillStyle = item.color;
			ctx.fillText(item.label, centerX - textWidth / 2, centerY);
		});
	},

	renderAttentionTable: function(tokens, weights) {
		const n = tokens.length;
		const dim = 4;
		const embs = tokens.map(t => this.vocab[t]);
		const { Q, K } = this.calculateAttention(embs);

		let h = `<table class="attn-table"><tr><th class="row-label">Q \\ K</th>`;
		tokens.forEach(t => h += `<th>${t}</th>`);
		h += `</tr>`;

		const fmtVec = (vec) => `\\begin{bmatrix} ${vec.map(v => v.toFixed(2)).join('\\\\')} \\end{bmatrix}`;
		const fmtW = (m) => `\\begin{bmatrix} ${m.map(r => r.map(v => v.toFixed(1)).join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;

		tokens.forEach((qToken, i) => {
			h += `<tr><td class="row-label">${qToken}</td>`;
			tokens.forEach((kToken, j) => {
				const weight = weights[i][j];
				const qVec = Q[i];
				const kVec = K[j];
				const dotProduct = qVec.reduce((acc, v, k) => acc + v * kVec[k], 0);
				const rawScore = dotProduct / Math.sqrt(dim);

				// Create formatted strings for the dot product components
				const qPart = `\\begin{bmatrix} ${qVec.map(v => v.toFixed(2)).join(' & ')} \\end{bmatrix}`;
				const kPart = `\\begin{bmatrix} ${kVec.map(v => v.toFixed(2)).join('\\\\')} \\end{bmatrix}`;

				const cellMath = `$$
    \\begin{aligned}
    \\vec{q}_i &= \\underbrace{${fmtVec(embs[i])}}_{\\text{Emb: } ${qToken}} \\cdot \\underbrace{${fmtW(this.W_q)}}_{W_q} = ${fmtVec(qVec)} \\\\[8pt]
    \\vec{k}_j &= \\underbrace{${fmtVec(embs[j])}}_{\\text{Emb: } ${kToken}} \\cdot \\underbrace{${fmtW(this.W_k)}}_{W_k} = ${fmtVec(kVec)} \\\\[8pt]
    s_{ij} &= \\frac{ \\underbrace{${qPart}}_{\\vec{q}_i^T} \\cdot \\underbrace{${kPart}}_{\\vec{k}_j} }{\\sqrt{4}} = \\frac{${dotProduct.toFixed(2)}}{2.0} = ${rawScore.toFixed(2)} \\\\[8pt]
    \\text{softmax}(s) &= \\mathbf{${weight.toFixed(2)}}
    \\end{aligned} $$`;

				const color = `rgba(59, 130, 246, ${weight})`;
				h += `<td style="background:${color}; color:${weight > 0.4 ? 'white' : 'black'}; padding: 15px; border: 1px solid #cbd5e1; min-width: 350px;">
	<div style="font-size: 0.7rem; line-height: 1.1;">${cellMath}</div>
      </td>`;
			});
			h += `</tr>`;
		});

		document.getElementById('attn-matrix-container').innerHTML = h + `</table>`;
		if (window.MathJax) MathJax.typesetPromise([document.getElementById('attn-matrix-container')]);
	},

	renderAttentionMath: function(tokens, weights, v_att_vec) {
		const lastIdx = tokens.length - 1;
		const qToken = tokens[lastIdx];
		const w = weights[lastIdx];

		const fmtVec = (vec, label) => `\\underbrace{\\begin{bmatrix} ${vec.map(v => v.toFixed(2)).join('\\\\')} \\end{bmatrix}}_{\\text{${label}}}`;

		let parts = tokens.map((kToken, i) => {
			const score = w[i].toFixed(2);
			const emb = this.vocab[kToken];
			return `\\underbrace{${score}}_{\\text{Attn: } \\text{${qToken}} \\to \\text{${kToken}}} \\cdot ${fmtVec(emb, kToken)}`;
		});

		const typeNames = ["Noun", "Verb", "Adj", "Func"];
		const typeDesc = typeNames[Math.round(v_att_vec[3])] || "Mix";

		// Das Result-Underbrace wurde hier entfernt, nur Context bleibt
		document.getElementById('math-attn-base').innerHTML = `
			<div style="margin-bottom: 10px; color: #64748b; font-size: 0.8rem;">
				Vector Legend: [Power, Status, Gender, TypeIndex]
			</div>
			$$\\vec{v}_{\\text{att}} = ` + parts.join(' + ') + ` = \\underbrace{\\begin{bmatrix} ${v_att_vec.map(v => v.toFixed(2)).join('\\\\')} \\end{bmatrix}}_{\\text{Context: } ${typeDesc}}$$
		`;
	},

	renderMath: function(x_in, v_att, x_res, x_norm, x_out, bestWord) {
		const fmtVec = (vec) => `\\begin{bmatrix} ${vec.map(v => v.toFixed(2)).join('\\\\')} \\end{bmatrix}`;
		const fmtW = (m) => `\\begin{bmatrix} ${m.map(r => r.map(v => v.toFixed(1)).join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;

		const mathHTML = `
<div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="math-step">
	<small style="color: #8b5cf6; font-weight: bold;">STEP 0: PROJECTION (Q & K)</small>
	$$ \\underbrace{\\vec{q}}_{\\text{Query}} = \\underbrace{${fmtVec(x_in)}}_{\\vec{x}_{\\text{in}}} \\cdot \\underbrace{${fmtW(this.W_q)}}_{W_q}
	   \\quad \\text{and} \\quad
	   \\underbrace{\\vec{k}}_{\\text{Key}} = \\underbrace{\\vec{x}_{\\text{in}}}_{\\text{Input}} \\cdot \\underbrace{${fmtW(this.W_k)}}_{W_k} $$
    </div>

    <div class="math-step">
	<small style="color: #64748b; font-weight: bold;">STEP 1: RESIDUAL ADDITION</small>
	$$ \\underbrace{\\vec{x}_{\\text{res}}}_{\\text{Residual Sum}} = \\underbrace{${fmtVec(x_in)}}_{\\vec{x}_{\\text{in}} (\\text{Identity})} + \\underbrace{${fmtVec(v_att)}}_{\\vec{v}_{\\text{att}} (\\text{Context})} = \\underbrace{${fmtVec(x_res)}}_{\\text{Combined State}} $$
    </div>

    <div class="math-step">
	<small style="color: #f59e0b; font-weight: bold;">STEP 2: FEED-FORWARD (KNOWLEDGE)</small>
	$$ \\underbrace{\\vec{x}_{\\text{out}}}_{\\text{Next-Token Target}} = \\underbrace{${fmtW(this.W_ffn)}}_{W_{ffn}} \\cdot \\underbrace{\\text{Norm}(${fmtVec(x_res)})}_{\\text{LayerNorm}(\\vec{x}_{\\text{res}})} = \\underbrace{\\underbrace{${fmtVec(x_out)}}_{\\text{Predicted}}}_{\\approx \\text{ "${bestWord}"}} $$
    </div>
</div>`;

		document.getElementById('res-ffn-viz').innerHTML = mathHTML;
	},

	testSuite: function() {
		const paths = [
			{ input: "The", expected: "king" },
			{ input: "a", expected: "king" },
			{ input: "The king", expected: "is" },
			{ input: "The queen", expected: "is" },
			{ input: "The queen is", expected: "brave" },
			{ input: "The king is wise", expected: "and" },
			{ input: "king", expected: "is" },
			{ input: "queen", expected: "is" },
			{ input: "The princess is", expected: "brave" }
		];
		console.log("%c --- Transformer Lab Test Run ---", "color: #3b82f6; font-weight: bold;");
		paths.forEach(path => {
			const words = path.input.split(/\s+/);
			let tokens = words.filter(w => this.vocab[w]);
			const x_in = tokens.map((t, i) => this.vocab[t]);
			const { weights, output: v_att } = this.calculateAttention(x_in);
			const lastIdx = tokens.length - 1;
			const x_res = v_att[lastIdx].map((v, i) => v + x_in[lastIdx][i]);
			const x_norm = this.layerNorm(x_res);
			const x_out = [0,1,2,3].map(i => x_norm.reduce((sum, v, j) => sum + v * this.W_ffn[j][i], 0));
			const pred = this.getPrediction(x_out, tokens);
			const actual = pred.top[0].word;
			const passed = actual.toLowerCase() === path.expected.toLowerCase();
			console.log(`${passed ? '✅' : '❌'} Input: "${path.input}" -> Expected: "${path.expected}", Got: "${actual}"`);
		});
	},

	renderProbs: function(top) {
		document.getElementById('prob-bars-container').innerHTML = top.map(s => `
		<div class="prob-item" onclick="TransformerLab.addToken('${s.word}')">
			<div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
				<span><b>${s.word}</b></span>
				<span>${(s.prob*100).toFixed(1)}%</span>
			</div>
			<div style="background: #e2e8f0; height: 8px; border-radius: 4px;">
				<div style="background: #3b82f6; width: ${Math.max(0, s.prob)*100}%; height: 100%;"></div>
			</div>
		</div>`).join('');

		const topThree = top.slice(0, 3);
		document.getElementById('top-tokens-container').innerHTML = topThree.map(s => `
			<button class="btn" style="padding: 4px 12px; font-size: 0.85rem; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; cursor: pointer;" onclick="TransformerLab.addToken('${s.word}')">
				${s.word}
			</button>
		`).join('');
	},

	// Hilfsfunktion: Berechnet Vorhersage-Wahrscheinlichkeiten innerhalb von TFJS
	predictTF: function(x_out, trainables, lastWord) {
		const vocabWords = Object.keys(this.vocab);
		const lastWordData = this.vocab[lastWord] || [0, 0, 0, 3];
		const lastType = Math.min(3, Math.max(0, Math.floor(lastWordData[3])));

		// 1. Berechne Distanzen zu allen Embeddings im Vokabular
		const logits = vocabWords.map(word => {
			const v = trainables.embeddings[word];
			const wordType = Math.min(3, Math.max(0, Math.floor(this.vocab[word][3])));

			// Negativer Euklidischer Abstand als Basis für Logits
			const dist = tf.norm(v.sub(x_out.reshape([4])));
			let score = tf.exp(dist.mul(-8.0)); 

			// Typ-Übergang aus der W_ffn Variable einbeziehen (Knowledge-Prior)
			const typeWeight = trainables.W_ffn.slice([lastType, wordType], [1, 1]).reshape([]);
			score = score.mul(typeWeight);

			// Bestrafung für Wort-Wiederholung
			if (word === lastWord) score = score.mul(0.01);

			return score;
		});

		const stackedLogits = tf.stack(logits);
		// Softmax für Wahrscheinlichkeitsverteilung
		return stackedLogits.div(tf.sum(stackedLogits));
	},

	exportData: function() {
		const data = {
			metadata: {
				timestamp: new Date().toISOString(),
				version: "1.0",
				description: "Trained weights and embeddings from TransformerLab"
			},
			vocab: this.vocab,
			weights: {
				W_q: this.W_q,
				W_k: this.W_k,
				W_ffn: this.W_ffn
			}
		};

		const jsonString = JSON.stringify(data, null, 4);
		this.downloadJSON(jsonString, `transformer-model-${Date.now()}.json`);
		console.log("Model exported successfully.");
	},

	downloadJSON: function(content, fileName) {
		const blob = new Blob([content], { type: 'application/json' });
		const a = document.createElement('a');
		const url = URL.createObjectURL(blob);
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		setTimeout(() => {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		}, 0);
	},

	trainModelFull: async function() {
		const status = document.getElementById('training-status');
		const rawInput = document.getElementById('training-input').value.trim();
		if (!rawInput) return;

		const allWords = rawInput.split(/\s+/).filter(w => this.vocab[w]);
		const vocabKeys = Object.keys(this.vocab);
		const trainingPairs = [];

		for (let i = 1; i < allWords.length; i++) {
			trainingPairs.push({
				context: allWords.slice(Math.max(0, i - 3), i),
				targetIdx: vocabKeys.indexOf(allWords[i]),
				lastWord: allWords[i-1]
			});
		}

		// Konservative Learning Rate
		const optimizer = tf.train.adam(0.01); 

		const trainables = {
			W_q: tf.variable(tf.tensor2d(this.W_q)),
			W_k: tf.variable(tf.tensor2d(this.W_k)),
			W_ffn: tf.variable(tf.tensor2d(this.W_ffn)),
			embeddings: {}
		};
		vocabKeys.forEach(w => { 
			trainables.embeddings[w] = tf.variable(tf.tensor1d(this.vocab[w])); 
		});

		try {
			for (let epoch = 0; epoch < 200; epoch++) {
				const lossVal = optimizer.minimize(() => {
					let batchLoss = tf.scalar(0);

					trainingPairs.forEach(pair => {
						const x_in = tf.stack(pair.context.map(w => trainables.embeddings[w]));

						// Forward Pass
						const Q = tf.matMul(x_in, trainables.W_q);
						const K = tf.matMul(x_in, trainables.W_k);
						const scores = tf.matMul(Q, K.transpose()).div(tf.sqrt(tf.scalar(4)));
						const weights = tf.softmax(scores);
						const v_att = tf.matMul(weights, x_in);

						const lastIdx = pair.context.length - 1;
						const x_res = tf.add(v_att.slice([lastIdx, 0], [1, 4]), x_in.slice([lastIdx, 0], [1, 4]));
						const x_out = tf.matMul(x_res, trainables.W_ffn).reshape([4]);

						// Numerisch extrem stabile Logits
						const logits = vocabKeys.map(word => {
							const v_emb = trainables.embeddings[word];
							const lastWordData = this.vocab[pair.lastWord] || [0,0,0,3];
							const lastType = Math.min(3, Math.max(0, Math.floor(lastWordData[3])));
							const wordType = Math.min(3, Math.max(0, Math.floor(this.vocab[word][3])));

							// Distanz berechnen und hart begrenzen
							const distSq = tf.sum(tf.square(tf.sub(v_emb, x_out)));
							const logitDist = tf.neg(distSq.clipByValue(0, 50)); 

							// Typ-Gewichtung stabilisieren (Epsilon hinzufügen gegen log(0))
							const typeWeight = trainables.W_ffn.gather([lastType]).reshape([4]).gather([wordType]);
							const logitType = tf.log(tf.abs(typeWeight).add(tf.scalar(1e-6)));

							return logitDist.add(logitType);
						});

						const stackedLogits = tf.stack(logits);

						// Cross-Entropy mit Log-Sum-Exp Trick
						const maxLogit = tf.max(stackedLogits);
						const stabilized = tf.sub(stackedLogits, maxLogit);
						const logSumExp = tf.log(tf.sum(tf.exp(stabilized)).add(tf.scalar(1e-6)));
						const targetLogit = stabilized.gather([pair.targetIdx]).asScalar();

						batchLoss = batchLoss.add(logSumExp.sub(targetLogit));
					});

					return batchLoss.div(tf.scalar(trainingPairs.length));
				}, true);

				const currentLoss = lossVal.dataSync()[0];
				if (isNaN(currentLoss)) throw new Error("NaN detected");

				if (epoch % 5 === 0) {
					status.innerText = `⏳ Epoche ${epoch}: Loss ${currentLoss.toFixed(4)}`;
					await this.syncWeights(trainables);
					this.run(); 
					await tf.nextFrame(); 
				}
			}
			await this.syncWeights(trainables);
			status.innerText = "✅ Training erfolgreich!";
			this.run();
		} catch (e) {
			status.innerText = "❌ Fehler: Werte zu extrem. Setze Matrizen zurück!";
			console.error(e);
		}
	},

	syncWeights: async function(trainables) {
		// Transfer data from GPU/TF-memory back to JS arrays
		this.W_q = await trainables.W_q.array();
		this.W_k = await trainables.W_k.array();
		this.W_ffn = await trainables.W_ffn.array();

		for (let word of Object.keys(this.vocab)) {
			this.vocab[word] = await trainables.embeddings[word].array();
		}
		this.renderMatrixEditors(); // Update the input fields with new values
	}
};
document.addEventListener('DOMContentLoaded', () => TransformerLab.init());
