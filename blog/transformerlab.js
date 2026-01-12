const TransformerLab = {
	// 3D Space: [Power, Status/Age, Gender, TypeIndex]
	// 3D Space: [Power, Status/Age, Gender, TypeIndex]
	vocab: {
		// [Power, Status, Gender, TypeIndex]
		"The":      [0.8, 0.1, 0.5, 3.0], 
		"a":        [0.4, 0.1, 0.5, 3.0], 
		"king":     [2.0, 0.8, 0.0, 0.0], 
		"queen":    [2.0, 0.8, 1.0, 0.0],
		"prince":   [0.6, 0.2, 0.0, 0.0], 
		"princess": [0.6, 0.2, 1.0, 0.0],
		"is":       [0.2, 0.5, 0.5, 1.0], 
		"wise":     [0.5, 0.8, 0.5, 2.0], 
		"brave":    [0.5, 0.6, 0.5, 2.0], 
		"and":      [0.1, 0.1, 0.5, 3.0] // "and" braucht sehr niedrige Werte
	},

	W_ffn: [
		[0.0, 1.0, 0.0, 0.0],  // Nomen (0) -> Verb (1)
		[0.0, 0.0, 1.0, 0.0],  // Verb (1)  -> Adj (2)
		[-1.0, -1.0, 0.0, 1.0], // Adj (2)   -> Zwingt Power/Status RUNTER (-1.0) für Typ 3 (and)
		[1.0, 0.0, 0.0, 0.0]   // Func (3)  -> Nomen (0)
	],

	init: function() { this.run(); },

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
		this.renderTokenVisuals(words);
		let tokens = words.filter(w => this.vocab[w]);
		if(tokens.length === 0) return;

		const x_in = tokens.map((t, i) => this.vocab[t].map((v, d) => v + (d === 0 ? i * 0.03 : 0)));
		const { weights, output: v_att } = this.calculateAttention(x_in);
		const lastIdx = tokens.length - 1;

		const x_res = v_att[lastIdx].map((v, i) => v + x_in[lastIdx][i]);
		const x_norm = this.layerNorm(x_res);

		// REMOVED ReLU: Calculation is now purely linear
		const x_out = [0,1,2,3].map(i => x_norm.reduce((sum, v, j) => sum + v * this.W_ffn[j][i], 0));
		this.current_x_out = x_out; 

		console.group(`Transformer Trace: "${words.join(' ')}"`);
		console.log("1. Input Tokens:", tokens);
		console.log("2. Post-Residual (x_res):", x_res);
		console.log("3. LayerNorm (x_norm):", x_norm);
		console.log("4. Linear Output (x_out):", x_out); // Updated Label
		console.groupEnd();

		const predFinal = this.getPrediction(x_out, tokens);
		this.plot3D(tokens, x_in, predFinal.top[0]);
		this.renderAttentionTable(tokens, weights);
		this.renderAttentionMath(tokens, weights, v_att[lastIdx]);
		this.renderFFNHeatmap(); 
		this.renderMath(x_in[lastIdx], v_att[lastIdx], x_res, x_norm, x_out); 
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

		// 1. Bestimme den Typ des letzten Wortes (Sicherheitscheck für Indizes)
		// Wir runden ab, um sicherzustellen, dass 0.5 oder 1.0 korrekt auf Matrix-Zeilen zeigen
		const lastWordData = this.vocab[lastWord] || [0, 0, 0, 3];
		const lastType = Math.min(3, Math.max(0, Math.floor(lastWordData[3])));

		// Die Übergangsmatrix aus der FFN
		const typeTransitions = this.W_ffn;

		let list = Object.keys(this.vocab).map(word => {
			const v = this.vocab[word];
			const wordType = Math.min(3, Math.max(0, Math.floor(v[3])));

			// 2. Semantische Distanz (Euklidisch)
			// Wie nah liegt das Wort im 3D-Raum am berechneten Ziel-Vektor x_out?
			const dist = Math.sqrt(v.reduce((s, x, i) => s + Math.pow(x - vec[i], 2), 0));

			// 3. Basispunke durch Distanz (Exponential für schärfere Trennung)
			let p = Math.exp(-dist * 8); 

			// 4. Grammatikalische Steuerung durch die W_ffn Matrix
			// Wir schauen in der Zeile des 'lastType' nach, wie gut der 'wordType' passt
			const typeScore = typeTransitions[lastType][wordType];
			p *= typeScore;

			// 5. Strafe für Wiederholungen (Repetition Penalty)
			if (word === lastWord) p *= 0.01;

			// Bonus: Verhindert Endlosschleifen von Artikeln am Satzende
			if (word === "The" && tokens.length > 5) p *= 0.5;

			return { 
				word, 
				prob: p, 
				id: this.getHash(word), 
				coords: v 
			};
		});

		// 6. Softmax-ähnliche Normalisierung
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
				x: embs.map(e => e[0]), 
				y: embs.map(e => e[1]), 
				z: embs.map(e => e[2]), 
				mode: 'lines+markers+text', text: tokens, 
				line: { width: 5, color: '#3b82f6' }, 
				marker: { size: 3, color: '#1e3a8a' }, 
				type: 'scatter3d', name: 'Path' 
			},
			{ 
				x: [last[0], x_out[0]], 
				y: [last[1], x_out[1]], 
				z: [last[2], x_out[2]], 
				mode: 'lines', 
				line: { width: 4, color: '#10b981', dash: 'dash' }, 
				type: 'scatter3d', name: 'Math Target' 
			},
			{ 
				type: 'cone', 
				x: [x_out[0]], y: [x_out[1]], z: [x_out[2]], 
				u: [x_out[0] - last[0]], v: [x_out[1] - last[1]], w: [x_out[2] - last[2]], 
				sizemode: 'absolute', sizeref: 0.1, showscale: false, 
				colorscale: [[0, '#10b981'], [1, '#10b981']], anchor: 'tip', name: 'Target Dir' 
			},
			{ 
				x: [next.coords[0]], 
				y: [next.coords[1]], 
				z: [next.coords[2]], 
				mode: 'markers+text', 
				text: ['★ ' + next.word], 
				textposition: 'top center',
				marker: { size: 4, symbol: 'star', color: '#f59e0b', line: { color: '#b45309', width: 2 } }, 
				type: 'scatter3d', name: 'Chosen Word' 
			}
		];

		const layout = { 
			margin: { l: 0, r: 0, b: 0, t: 0 }, 
			paper_bgcolor: 'rgba(0,0,0,0)', 
			scene: { xaxis: { title: 'Power' }, yaxis: { title: 'Status' }, zaxis: { title: 'Gender' } },
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

		const pArr = v_att_vec[0] > 0.1 ? "\\uparrow \\text{Power}" : v_att_vec[0] < -0.1 ? "\\downarrow \\text{Power}" : "\\rightarrow \\text{Power}";
		const sArr = v_att_vec[1] > 0.1 ? "\\uparrow \\text{Status}" : v_att_vec[1] < -0.1 ? "\\downarrow \\text{Status}" : "\\rightarrow \\text{Status}";
		let gLab = v_att_vec[2] > 0.1 ? "\\uparrow \\text{Femine}" : v_att_vec[2] < -0.1 ? "\\downarrow \\text{Masculine}" : "\\rightarrow \\text{Neutral}";

		const typeNames = ["Noun", "Verb", "Adj", "Func"];
		const typeDesc = typeNames[Math.round(v_att_vec[3])] || "Mix";

		document.getElementById('math-attn-base').innerHTML =
			`$$\\vec{v}_{\\text{att}} = ` + parts.join(' + ') +
			` = \\underbrace{${fmtVec(v_att_vec)}}_{\\substack{\\text{Context Vector} \\\\ ${pArr}, ${sArr}, ${gLab} \\\\ \\rightarrow \\text{${typeDesc}}}}$$`;
	},

	renderMath: function(x_in, v_att, x_res, x_norm, x_out) {
		const fmtVec = (vec) => `\\begin{bmatrix} ${vec.map(v => v.toFixed(2)).join('\\\\')} \\end{bmatrix}`;
		const fmtW = (m) => `\\begin{bmatrix} ${m.map(r => r.join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;

		const mathHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
	<div class="math-step">
	    <small style="color: #64748b; font-weight: bold;">STEP 1: RESIDUAL ADDITION</small>
	    $$ \\vec{x}_{\\text{res}} = 
	    \\underbrace{${fmtVec(x_in)}}_{\\text{Input Embedding}} + 
	    \\underbrace{${fmtVec(v_att)}}_{\\text{Context Vector (Attn)}} = 
	    \\underbrace{${fmtVec(x_res)}}_{\\text{Combined Signal}} $$
	</div>
	<div class="math-step">
	    <small style="color: #3b82f6; font-weight: bold;">STEP 2: LAYER NORMALIZATION (STABILIZER)</small>
	    $$ \\vec{x}_{\\text{norm}} = \\text{LN}(\\underbrace{${fmtVec(x_res)}}_{\\text{Combined Signal}}) = 
	    \\underbrace{${fmtVec(x_norm)}}_{\\text{Normalized}} $$
	</div>
	<div class="math-step">
	    <small style="color: #f59e0b; font-weight: bold;">STEP 3: FEED-FORWARD (KNOWLEDGE RETRIEVAL)</small>
	    $$ \\vec{x}_{\\text{out}} = 
	    \\underbrace{${fmtVec(x_norm)}}_{\\text{Normalized}} \\cdot 
	    \\underbrace{${fmtW(this.W_ffn)}}_{W_{\\text{ffn}} \\text{ (Transition Matrix)}} = 
	    \\underbrace{${fmtVec(x_out)}}_{\\text{The next word is the one closest to this in the Embedding Space}} $$
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

			// Simulation der internen Logik
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
		// 1. Update the sidebar (Original bottom list)
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

		// 2. Update the "Next:" bar at the top
		const topThree = top.slice(0, 3); // Get the 3 most likely words
		document.getElementById('top-tokens-container').innerHTML = topThree.map(s => `
	<button class="btn"
		style="padding: 4px 12px; font-size: 0.85rem; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; cursor: pointer;"
		onclick="TransformerLab.addToken('${s.word}')">
	    ${s.word}
	</button>
    `).join('');
	}
};
document.addEventListener('DOMContentLoaded', () => TransformerLab.init());
