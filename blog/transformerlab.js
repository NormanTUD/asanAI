const TransformerLab = {
	debug_transformer: true,

	// 3D Space: [Power, Status/Age, Gender, TypeIndex]
	// TypeIndex: 0=Noun, 1=Verb, 2=Adjective, 3=Other/Functional
	vocab: {
		"The": [0.5, 0.5, 0.5, 3], 
		"king": [0.95, 0.8, 0.1, 0], 
		"queen": [0.95, 0.8, 0.9, 0],
		"prince": [0.75, 0.2, 0.1, 0],
		"princess": [0.75, 0.2, 0.9, 0],
		"knight": [0.65, 0.5, 0.1, 0],
		"is": [0.2, 0.5, 0.5, 1],
		"was": [0.2, 0.7, 0.5, 1],
		"rules": [0.9, 0.6, 0.5, 1], 
		"governs": [0.85, 0.6, 0.5, 1],
		"lives": [0.3, 0.5, 0.5, 1],
		"in": [0.1, 0.5, 0.5, 3],
		"wise": [0.8, 0.9, 0.5, 2], 
		"brave": [0.7, 0.4, 0.5, 2],
		"young": [0.2, 0.1, 0.5, 2], 
		"old": [0.2, 0.9, 0.5, 2],
		"palace": [0.9, 0.3, 0.5, 0],
		"castle": [0.85, 0.8, 0.5, 0],
		"village": [0.2, 0.4, 0.5, 0],
		"forest": [0.0, 0.5, 0.5, 0],
		"and": [0.1, 0.5, 0.5, 3],
		"a": [0.1, 0.5, 0.5, 3]
	},

	// Design Goal: Break the Noun <-> Verb loop by forcing Verbs to point to 
	// Function words (Index 3) or Adjectives (Index 2).
	W_ffn: [
		// Row 0 (Noun): Strongly targets Verb (Index 1)
		// Logic: "King" -> "rules"
		[0.1, 1.3, 0.1, 0.1], 
		
		// Row 1 (Verb): Targets Func (Index 3) & Adj (Index 2). 
		// CRITICAL FIX: The 0.0 in the first slot prevents "rules" -> "queen".
		// The 1.6 in the last slot pushes it towards "in", "a", "the".
		[0.0, 0.1, 0.5, 1.6], 
		
		// Row 2 (Adj): Strongly targets Noun (Index 0)
		// Logic: "wise" -> "queen"
		[1.2, 0.1, 0.1, 0.1],
		
		// Row 3 (Func): Targets Noun (Index 0)
		// Logic: "The"/"in" -> "castle"/"king". 
		// (Weights are low because the input 'TypeIndex' for Func is high (3.0))
		[0.35, 0.0, 0.1, 0.0] 
	],

	init: function() { this.run(); },

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
		this.renderTokenVisuals(words);
		let tokens = words.filter(w => this.vocab[w]);
		if(tokens.length === 0) return;

		// 1. EMBEDDING LAYER
		const x_in_raw = tokens.map(t => [...this.vocab[t]]);
		// Applying positional shift (0.03 per word on Power dimension)
		const x_in = tokens.map((t, i) => this.vocab[t].map((v, d) => v + (d === 0 ? i * 0.03 : 0)));

		// 2. ATTENTION LAYER
		const { weights, output: v_att } = this.calculateAttention(x_in);
		const lastIdx = tokens.length - 1;

		// 3. RESIDUAL CONNECTION
		const x_res = v_att[lastIdx].map((v, i) => v + x_in[lastIdx][i]);

		// 4. FEED-FORWARD NETWORK (FFN)
		const x_ffn = [0,1,2,3].map(i => x_res.reduce((sum, v, j) => sum + v * this.W_ffn[j][i], 0));

		// 5. ACTIVATION (ReLU)
		const x_out = x_ffn.map(v => Math.max(0, v));
		this.current_x_out = x_out; 

		// Debug Logging
		if (this.debug_transformer) {
			console.group(`Transformer Trace: "${words.join(' ')}"`);
			console.log("1. Input Tokens:", tokens);
			console.log("2. Latent Embeddings (x_in):", x_in[lastIdx]);
			console.log("3. Attention Weights (Last Token):", weights[lastIdx]);
			console.log("4. Context Vector (v_att):", v_att[lastIdx]);
			console.log("5. Post-Residual (x_res = x_in + v_att):", x_res);
			console.log("6. FFN Output (x_ffn = x_res * W_ffn):", x_ffn);
			console.log("7. ReLU Output (x_out):", x_out);
			console.groupEnd();
		}

		// Prediction & Rendering
		const predFinal = this.getPrediction(x_out, tokens);
		this.plot3D(tokens, x_in, predFinal.top[0]);
		this.renderAttentionTable(tokens, weights);
		this.renderAttentionMath(tokens, weights, v_att[lastIdx]);
		this.renderFFNHeatmap(); 
		this.renderMath(x_in[lastIdx], v_att[lastIdx], x_res, x_out);
		this.renderProbs(predFinal.top);

		if (window.MathJax && window.MathJax.typesetPromise) {
			MathJax.typesetPromise([document.getElementById('math-attn-base'), document.getElementById('res-ffn-viz')]).catch(err => console.dir(err));
		}
	},

	calculateAttention: function(embs) {
		const n = embs.length;
        const dim = embs[0].length;
		let w = Array.from({length:n}, () => Array(n).fill(0));
		for(let i=0; i<n; i++) {
			for(let j=0; j<n; j++) {
				w[i][j] = embs[i].reduce((acc, v, k) => acc + v * embs[j][k], 0) / Math.sqrt(dim);
			}
			let exp = w[i].map(v => Math.exp(v));
			let sum = exp.reduce((a,b) => a+b);
			w[i] = exp.map(v => v/sum);
		}
		const out = embs.map((_, i) => [0,1,2,3].map(d => embs.reduce((s, curr, j) => s + w[i][j] * curr[d], 0)));
		return { weights: w, output: out };
	},

	getPrediction: function(vec, tokens) {
		const lastWord = tokens[tokens.length - 1];
		const lastType = this.vocab[lastWord] ? this.vocab[lastWord][3] : 3;

		// This matrix defines the "Grammar" mathematically
		// Rows = Current Type, Cols = Next Type Likelihood
		// Types: 0:Noun, 1:Verb, 2:Adj, 3:Func
		const typeTransitions = this.W_ffn;

		let list = Object.keys(this.vocab).map(word => {
			const v = this.vocab[word];
			const wordType = v[3];

			// 1. Semantic Similarity: Distance in 4D space
			const dist = Math.sqrt(v.reduce((s, x, i) => s + Math.pow(x - vec[i], 2), 0));
			let p = Math.exp(-dist * 8); 

			// 2. Structural Calculation: Type Transition
			// This makes it "calculated" based on the grammar of types
			const typeScore = typeTransitions[lastType][wordType];
			p *= typeScore;

			// 3. Simple Repetition Penalty
			if (word === lastWord) p *= 0.01;
			if (word === "The" && tokens.length > 3) p *= 0.5; // Discourage "The" loops

			return { word, prob: p, id: this.getHash(word), coords: v };
		});

		// Softmax normalization
		const sum = list.reduce((a, b) => a + b.prob, 0);
		list.forEach(s => s.prob /= sum);

		return { top: list.sort((a, b) => b.prob - a.prob) };
	},

	plot3D: function(tokens, embs, next) {
		const last = embs[embs.length-1];
		const x_out = this.current_x_out || last; // Fallback falls run() noch nicht fertig war

		const typeColors = { 0: '#ec4899', 1: '#8b5cf6', 2: '#f59e0b', 3: '#94a3b8' };
		const vocabWords = Object.keys(this.vocab);
		const vocabColors = vocabWords.map(w => typeColors[this.vocab[w][3]]);

		const data = [
			// 1. Das gesamte Vokabular als Hintergrundpunkte
			{ 
				x: vocabWords.map(w => this.vocab[w][0]), 
				y: vocabWords.map(w => this.vocab[w][1]), 
				z: vocabWords.map(w => this.vocab[w][2]), 
				mode: 'markers', text: vocabWords, 
				marker: { size: 4, color: vocabColors, opacity: 0.3 }, 
				type: 'scatter3d', name: 'Vocab' 
			},
			// 2. Der Pfad des aktuellen Satzes (Blau)
			{ 
				x: embs.map(e => e[0]), 
				y: embs.map(e => e[1]), 
				z: embs.map(e => e[2]), 
				mode: 'lines+markers+text', text: tokens, 
				line: { width: 5, color: '#3b82f6' }, 
				marker: { size: 3, color: '#1e3a8a' }, 
				type: 'scatter3d', name: 'Path' 
			},
			// 3. Die mathematische Vorhersage (Grüner gestrichelter Vektor zum exakten Rechenwert)
			{ 
				x: [last[0], x_out[0]], 
				y: [last[1], x_out[1]], 
				z: [last[2], x_out[2]], 
				mode: 'lines', 
				line: { width: 4, color: '#10b981', dash: 'dash' }, 
				type: 'scatter3d', name: 'Math Target' 
			},
			// 4. Ein kleiner Kegel an der Spitze des mathematischen Vektors
			{ 
				type: 'cone', 
				x: [x_out[0]], y: [x_out[1]], z: [x_out[2]], 
				u: [x_out[0] - last[0]], v: [x_out[1] - last[1]], w: [x_out[2] - last[2]], 
				sizemode: 'absolute', sizeref: 0.1, showscale: false, 
				colorscale: [[0, '#10b981'], [1, '#10b981']], anchor: 'tip', name: 'Target Dir' 
			},
			// 5. Das tatsächlich gewählte nächste Wort (Stern)
			{ 
				x: [next.coords[0]], 
				y: [next.coords[1]], 
				z: [next.coords[2]], 
				mode: 'markers+text', 
				text: ['★ ' + next.word], 
				textposition: 'top center',
				marker: { 
					size: 4, symbol: 'star', color: '#f59e0b', 
					line: { color: '#b45309', width: 2 } 
				}, 
				type: 'scatter3d', name: 'Chosen Word' 
			}
		];

		const layout = { 
			margin: { l: 0, r: 0, b: 0, t: 0 }, 
			paper_bgcolor: 'rgba(0,0,0,0)', 
			scene: { 
				xaxis: { title: 'Power' }, 
				yaxis: { title: 'Status' }, 
				zaxis: { title: 'Gender' } 
			},
			showlegend: false
		};

		Plotly.newPlot('plot-embeddings', data, layout);
	},

	renderFFNHeatmap: function() {
		const labels = ['Power', 'Status', 'Gender', 'Type'];
		let h = `<table class="attn-table"><tr><th class="row-label">In \\ Out</th>`;
		labels.forEach(l => h += `<th>${l}</th>`);
		h += `</tr>`;
		this.W_ffn.forEach((row, i) => {
			h += `<tr><td class="row-label">${labels[i]}</td>`;
			row.forEach(val => {
				const color = val > 0 ? `rgba(245, 158, 11, ${val/2})` : `rgba(239, 68, 68, ${Math.abs(val)})`;
				h += `<td style="background:${color}; color:${Math.abs(val) > 0.8 ? 'white' : 'black'};">${val.toFixed(2)}</td>`;
			});
			h += `</tr>`;
		});
		document.getElementById('ffn-matrix-container').innerHTML = h + `</table>`;
	},

	renderTokenVisuals: function(words) {
		document.getElementById('viz-tokens').innerHTML = words.map(w => `<div style="background: hsl(${this.getHash(w)%360}, 65%, 40%); color: white; padding: 4px 10px; border-radius: 4px; font-family: monospace;">${w}</div>`).join('');
		let table = `<table class="token-table"><tr><th>Token</th><th>ID</th></tr>`;
		words.forEach(w => table += `<tr><td>"${w}"</td><td>${this.getHash(w)}</td></tr>`);
		document.getElementById('token-table-container').innerHTML = table + `</table>`;
	},

	renderAttentionTable: function(tokens, weights) {
		let h = `<table class="attn-table"><tr><th class="row-label">Q \\ K</th>`;
		tokens.forEach(t => h += `<th>${t}</th>`);
		h += `</tr>`;
		weights.forEach((row, i) => {
			h += `<tr><td class="row-label">${tokens[i]}</td>`;
			row.forEach(w => h += `<td style="background:rgba(59, 130, 246, ${w}); color:${w > 0.4 ? 'white' : 'black'};">${w.toFixed(2)}</td>`);
			h += `</tr>`;
		});
		document.getElementById('attn-matrix-container').innerHTML = h + `</table>`;
	},

	renderAttentionMath: function(tokens, weights, v_att_vec) {
		const lastIdx = tokens.length - 1;
		const qToken = tokens[lastIdx];
		const w = weights[lastIdx];

		const fmtVec = (vec) => `\\begin{bmatrix} ${vec.map(v => v.toFixed(2)).join('\\\\')} \\end{bmatrix}`;

		let parts = tokens.map((kToken, i) => {
			const score = w[i].toFixed(2);
			const emb = this.vocab[kToken];

			return `\\underbrace{${score}}_{\\text{V (Q}=\\text{${qToken}}\\text{, K}=\\text{${kToken}}\\text{)}} \\cdot \\underbrace{${fmtVec(emb)}}_{\\text{Embedding } '\\text{${kToken}}'}`;
		});

		// Calculate direction labels
		const pArr = v_att_vec[0] > 0.1 ? "\\uparrow \\text{Power}" : v_att_vec[0] < -0.1 ? "\\downarrow \\text{Power}" : "\\rightarrow \\text{Power}";
		const sArr = v_att_vec[1] > 0.1 ? "\\uparrow \\text{Status}" : v_att_vec[1] < -0.1 ? "\\downarrow \\text{Status}" : "\\rightarrow \\text{Status}";

		// Semantic Gender Logic for Attention Vector
		let gLab = "\\rightarrow \\text{Neutral}";
		if (v_att_vec[2] > 0.1) gLab = "\\uparrow \\text{Femine}";
		else if (v_att_vec[2] < -0.1) gLab = "\\downarrow \\text{Masculine}";

		const typeNames = ["Noun", "Verb", "Adj", "Func"];
		const typeDesc = typeNames[Math.round(v_att_vec[3])] || "Mix";

		document.getElementById('math-attn-base').innerHTML =
			`$$\\vec{v}_{\\text{att}} = ` + parts.join(' + ') +
			` = \\underbrace{${fmtVec(v_att_vec)}}_{\\substack{\\text{Context Vector} \\\\ ${pArr}, ${sArr}, ${gLab} \\\\ \\rightarrow \\text{${typeDesc}}}}$$`;
	},

	renderMath: function(x_in, v_att, x_res, x_out) {
		const fmtVec = (vec) => `\\begin{bmatrix} ${vec.map(v => v.toFixed(2)).join('\\\\')} \\end{bmatrix}`;
		const fmtW = (m) => `\\begin{bmatrix} ${m.map(r => r.join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;

		// Helper to get semantic direction labels
		const getLabels = (v1, v2) => {
			const p = v2[0] > v1[0] ? "\\uparrow \\text{Power}" : "\\downarrow \\text{Power}";
			const s = v2[1] > v1[1] ? "\\uparrow \\text{Status}" : "\\downarrow \\text{Status}";

			// Gender Shift Logic: 0.1 = Masculine, 0.9 = Femine
			let g = "";
			if (Math.abs(v2[2] - v1[2]) < 0.05) g = "\\rightarrow \\text{Neutral}";
			else g = v2[2] > v1[2] ? "\\uparrow \\text{Femine}" : "\\downarrow \\text{Masculine}";

			return `${p}, ${s}, ${g}`;
		};

		const typeNames = ["Noun", "Verb", "Adj", "Func"];

		const resLabels = getLabels(x_in, x_res);
		const resType = typeNames[Math.round(x_res[3])] || "Mix";

		const outLabels = getLabels(x_res, x_out);
		const oldType = typeNames[Math.round(x_res[3])] || "Other";
		const newType = typeNames[Math.round(x_out[3])] || "Other";
		const typeMove = oldType === newType ? `\\text{Stay } ${newType}` : `${oldType} \\rightarrow ${newType}`;

		const mathHTML = `
	    <div style="display: flex; flex-direction: column; gap: 25px;">
		<div class="math-step">
		    <small style="color: #64748b; font-weight: bold;">LAYER FLOW: RESIDUAL ADDITION</small>
		    $$ \\underbrace{${fmtVec(x_res)}}_{\\substack{\\vec{x}_{\\text{res}} \\\\ ${resLabels} \\\\ \\rightarrow ${resType}}} = \\underbrace{${fmtVec(x_in)}}_{\\vec{x}_{\\text{in}}} + \\underbrace{${fmtVec(v_att)}}_{\\vec{v}_{\\text{att}}} $$
		</div>
		<div class="math-step">
		    <small style="color: #64748b; font-weight: bold;">LAYER FLOW: FEED-FORWARD (W_ffn)</small>
		    $$ \\underbrace{${fmtVec(x_out)}}_{\\substack{\\vec{x}_{\\text{out}} \\\\ ${outLabels} \\\\ ${typeMove}}} = \\max(0, \\underbrace{${fmtVec(x_res)}}_{\\vec{x}_{\\text{res}}} \\cdot \\underbrace{${fmtW(this.W_ffn)}}_{W_{\\text{ffn}}}) $$
		</div>
	    </div>`;
		document.getElementById('res-ffn-viz').innerHTML = mathHTML;
	},

	renderProbs: function(top) {
		document.getElementById('prob-bars-container').innerHTML = top.map(s => `
	<div class="prob-item" onclick="TransformerLab.addToken('${s.word}')">
	    <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
		<span><b>${s.word}</b></span>
		<span>${(s.prob*100).toFixed(1)}%</span>
	    </div>
	    <div style="background: #e2e8f0; height: 8px; border-radius: 4px;">
		<div style="background: #3b82f6; width: ${s.prob*100}%; height: 100%;"></div>
	    </div>
	</div>`).join('');
	}
};
document.addEventListener('DOMContentLoaded', () => TransformerLab.init());
