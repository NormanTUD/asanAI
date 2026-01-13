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
		stream.innerHTML = words.map((w, i) => `
			<div class="token-chip" 
				 onmouseover="TransformerLab.hoverIndex=${i}; TransformerLab.renderAttentionFlow();" 
				 onmouseout="TransformerLab.hoverIndex=null; TransformerLab.renderAttentionFlow();">
				<div class="token-id">#${100+i}</div>
				<div class="token-word">${w}</div>
			</div>
		`).join("");

		document.getElementById('viz-tokens').innerHTML = words.map(w => `<div style="background: hsl(${this.getHash(w)%360}, 65%, 40%); color: white; padding: 4px 10px; border-radius: 4px; font-family: monospace;">${w}</div>`).join('');
		let table = `<table class="token-table"><tr><th>Token</th><th>ID</th></tr>`;
		words.forEach(w => table += `<tr><td>"${w}"</td><td>${this.getHash(w)}</td></tr>`);
		document.getElementById('token-table-container').innerHTML = table + `</table>`;
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

		tokens.forEach((_, i) => {
			tokens.forEach((_, j) => {
				if (i === j) return;
				const strength = weights[i][j];
				if (strength < 0.01) return;

				const chip1 = chips[i].getBoundingClientRect();
				const chip2 = chips[j].getBoundingClientRect();
				const x1 = (chip1.left + chip1.width / 2) - streamRect.left;
				const x2 = (chip2.left + chip2.width / 2) - streamRect.left;
				const baseY = canvas.height - 5; 

				const active = (this.hoverIndex === i || this.hoverIndex === j);
				ctx.beginPath();
				ctx.lineWidth = active ? strength * 8 : strength * 3;
				ctx.strokeStyle = active ? "#3b82f6" : "#cbd5e0";
				ctx.globalAlpha = (this.hoverIndex === null) ? Math.min(1, strength * 1.5) : (active ? 0.9 : 0.05);
				
				const h = 20 + (strength * 40) + (Math.abs(x2 - x1) * 0.1);
				ctx.moveTo(x1, baseY);
				ctx.bezierCurveTo(x1, baseY - h, x2, baseY - h, x2, baseY);
				ctx.stroke();

				if (this.hoverIndex === i && active && strength > 0.1) {
					ctx.fillStyle = "#1e293b"; ctx.font = "bold 10px sans-serif";
					ctx.globalAlpha = 1;
					ctx.fillText(`${(strength * 100).toFixed(0)}%`, (x1+x2)/2 - 10, baseY - h - 5);
				}
			});
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

		const fmtVec = (vec) => `\\begin{bmatrix} ${vec.map(v => v.toFixed(1)).join('\\\\')} \\end{bmatrix}`;
		const fmtW = (m) => `\\begin{bmatrix} ${m.map(r => r.map(v => v.toFixed(1)).join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;

		tokens.forEach((qToken, i) => {
			h += `<tr><td class="row-label">${qToken}</td>`;
			tokens.forEach((kToken, j) => {
				const weight = weights[i][j];
				const rawScore = (Q[i].reduce((a, v, k) => a + v * K[j][k], 0)) / Math.sqrt(dim);

				// Detailed projection math including the full W_q and W_k matrices
				const cellMath = `$$
	    \\begin{aligned}
	    \\vec{q}_i &= \\underbrace{${fmtVec(embs[i])}}_{\\text{'${qToken}'}} \\cdot \\underbrace{${fmtW(this.W_q)}}_{W_q} \\\\[6pt]
	    \\vec{k}_j &= \\underbrace{${fmtVec(embs[j])}}_{\\text{'${kToken}'}} \\cdot \\underbrace{${fmtW(this.W_k)}}_{W_k} \\\\[6pt]
	    s_{ij} &= \\frac{\\vec{q}_i^T \\cdot \\vec{k}_j}{\\sqrt{d}} = ${rawScore.toFixed(2)} \\\\[6pt]
	    \\text{softmax}(s) &= \\mathbf{${weight.toFixed(2)}}
	    \\end{aligned} $$`;

				const color = `rgba(59, 130, 246, ${weight})`;
				h += `<td style="background:${color}; color:${weight > 0.4 ? 'white' : 'black'}; padding: 10px; border: 1px solid #cbd5e1; min-width: 280px;"><div style="font-size: 0.6rem;">${cellMath}</div></td>`;
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
	}
};
document.addEventListener('DOMContentLoaded', () => TransformerLab.init());
