/**
 * AttentionEngine: Modular Transformer Component
 * Origin: Vaswani et al. (2017)
 * Methods: Multi-Head Projection, Scaled Dot-Product, LaTeX Logging
 */
class AttentionEngine {
	constructor(config) {
		this.d_model = config.d_model;
		this.n_heads = config.n_heads;
		this.d_k = config.d_model / config.n_heads;
		this.container = document.getElementById(config.containerId);

		this.weights = {
			query: this.initWeights(this.d_model, this.d_model),
			key: this.initWeights(this.d_model, this.d_model),
			value: this.initWeights(this.d_model, this.d_model),
			output: this.initWeights(this.d_model, this.d_model)
		};
	}

	initWeights(r, c) {
		// Glorot Initialization for training readiness
		const limit = Math.sqrt(6 / (r + c));
		return Array.from({ length: r }, () => 
			Array.from({ length: c }, () => (Math.random() * 2 * limit) - limit)
		);
	}

	// Matrix Multiplication Helper
	dot(A, B) {
		return A.map(row => 
			B[0].map((_, i) => row.reduce((acc, _, j) => acc + row[j] * B[j][i], 0))
		);
	}

	softmax(arr) {
		return arr.map(row => {
			const max = Math.max(...row);
			const exps = row.map(v => Math.exp(v - max));
			const sum = exps.reduce((a, b) => a + b);
			return exps.map(v => v / sum);
		});
	}

	forward(h0, tokens) {
		const Q_full = this.dot(h0, this.weights.query);
		const K_full = this.dot(h0, this.weights.key);
		const V_full = this.dot(h0, this.weights.value);

		let headData = [];
		for (let i = 0; i < this.n_heads; i++) {
			const start = i * this.d_k;
			const end = start + this.d_k;

			const Qi = Q_full.map(r => r.slice(start, end));
			const Ki = K_full.map(r => r.slice(start, end));
			const Vi = V_full.map(r => r.slice(start, end));

			const scores = this.dot(Qi, this.transpose(Ki)).map(row => 
				row.map(v => v / Math.sqrt(this.d_k))
			);
			const weights = this.softmax(scores);
			const context = this.dot(weights, Vi);

			headData.push({ headIdx: i, Qi, Ki, Vi, weights, context });
		}

		this.renderUI(headData, tokens);
		return headData;
	}

	transpose(M) { return M[0].map((_, i) => M.map(row => row[i])); }

	renderUI(headData, tokens) {
		if (!this.container) return;

		let html = `<div class="attention-tabs" style="border:1px solid #3b82f6; border-radius:8px; overflow:hidden;">`;

		// Tab Headers with dynamic active coloring
		html += `<div class="tab-list" style="background:#f0f4f8; display:flex; border-bottom:1px solid #3b82f6;">`;
		headData.forEach((h, i) => {
			html += `<button class="mha-tab-btn" id="tab-btn-${i}" onclick="showHead(${i})" 
		style="padding:10px 20px; border:none; border-right:1px solid #3b82f6; cursor:pointer; 
		background:${i===0?'#fff':'#e2e8f0'}; font-weight:${i===0?'bold':'normal'}">Head ${i+1}</button>`;
		});
		html += `</div>`;

		// Tab Content
		headData.forEach((h, i) => {
			const escapedTokens = tokens.map(t => t.replace(/#/g, '\\#'));
			html += `<div id="head-content-${i}" class="head-tab" style="padding:20px; display:${i===0?'block':'none'}">
		<div style="margin-bottom:20px;">
		    $$ \\text{Head}_{${i}} = \\text{Softmax} \\left( \\frac{Q_i K_i^T}{\\sqrt{d_k}} \\right) \\cdot V_i $$
		</div>
		<div style="overflow-x:auto;">
		    ${this.generateMathTable(h, escapedTokens)}
		</div>
	    </div>`;
		});

		html += `</div>`;
		this.container.innerHTML = html;
		if (typeof render_temml === "function") render_temml();
	}

	generateMathTable(head, tokens) {
		const { weights, Qi, Ki, Vi } = head;
		const K_T = this.transpose(Ki);

		// Helfer für vertikale Vektoren
		const toPmatrix = (arr) => `\\begin{pmatrix} ${arr.map(v => v.toFixed(2)).join(' \\\\ ')} \\end{pmatrix}`;

		// Helfer für horizontale Vektoren
		const toRowPmatrix = (arr) => `\\begin{pmatrix} ${arr.map(v => v.toFixed(2)).join(' & ')} \\end{pmatrix}`;

		let html = `<table style="border-collapse: collapse; width: 100%; border: 1px solid #3b82f6; font-size: 0.65rem;">`;

		// Header
		html += `<tr><th style="border: 1px solid #3b82f6; padding: 8px; background: #f8fafc;">Query \\ Key</th>`;
		tokens.forEach((t, j) => {
			const k_vec_column = K_T.map(row => row[j]);
			html += `<th style="border: 1px solid #3b82f6; padding: 8px; background: #f8fafc;">
		${t}<br><small>$\\underbrace{${toPmatrix(k_vec_column)}}_{\\substack{K^T_{${j}} \\\\ \\text{Emb. } \\text{"${t}"}}}$</small>
	    </th>`;
		});
		html += `</tr>`;

		// Zeilen
		weights.forEach((row, i) => {
			html += `<tr>`;
			html += `<td style="border: 1px solid #3b82f6; padding: 8px; background: #f8fafc; font-weight: bold;">
		${tokens[i]}<br><small>$\\underbrace{${toPmatrix(Qi[i])}}_{\\substack{Q_{${i}} \\\\ \\text{Emb. } \\text{"${tokens[i]}"}}}$</small>
	    </td>`;

			row.forEach((weight, j) => {
				const intensity = Math.floor(255 - (weight * 150));
				const bgColor = `rgb(${intensity}, ${intensity}, 255)`;

				const kj_vec = K_T.map(r => r[j]);
				const dk_int = Math.round(this.d_k);

				const resultVec = Vi[j].map(v => v * weight);

				const cellEq = `\\underbrace{ 
		    \\text{SoftMax} \\left( \\frac{ 
			\\underbrace{${toRowPmatrix(Qi[i])}}_{\\substack{Q_{${i}} \\\\ \\text{Emb. } \\text{"${tokens[i]}"}}} \\cdot 
			\\underbrace{${toPmatrix(kj_vec)}}_{\\substack{K^T_{${j}} \\\\ \\text{Emb. } \\text{"${tokens[j]}"}}} 
		    }{\\sqrt{\\underbrace{${dk_int}}_{d_\\text{model}}}} \\right) 
		}_{\\text{Weight } ${weight.toFixed(3)}} 
		\\cdot \\underbrace{${toPmatrix(Vi[j])}}_{\\text{Emb. } \\text{"${tokens[j]}"}} 
		= \\underbrace{${toPmatrix(resultVec)}}_{\\substack{V_{${i}, ${j}} \\\\ \\text{Value}}}`;

				html += `<td style="border: 1px solid #3b82f6; padding: 12px; background: ${bgColor}; text-align: center;">
		    $${cellEq}$
		</td>`;
			});
			html += `</tr>`;
		});

		html += `</table>`;
		return html;
	}
}

window.showHead = (idx) => {
	// Toggle Content
	document.querySelectorAll('.head-tab').forEach(el => el.style.display = 'none');
	document.getElementById(`head-content-${idx}`).style.display = 'block';

	// Toggle Buttons
	document.querySelectorAll('.mha-tab-btn').forEach(btn => {
		btn.style.background = '#e2e8f0';
		btn.style.fontWeight = 'normal';
	});
	const activeBtn = document.getElementById(`tab-btn-${idx}`);
	activeBtn.style.background = '#fff';
	activeBtn.style.fontWeight = 'bold';

	if (typeof render_temml === "function") render_temml();
};

function calculate_positional_injection(tokens, d_model) {
	const resultsContainer = document.getElementById('transformer-pe-integration-results');
	if (!resultsContainer) return;

	let html = `<h3>Vector Injection (Inference Sequence)</h3>`;

	tokens.forEach((token, pos) => {
		const hash = token.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
		const semanticVec = Array.from({length: d_model}, (_, i) => 
			parseFloat(((Math.abs(hash * (i + 1)) % 1000) / 500 - 1).toFixed(3))
		);

		const peVec = [];
		for (let i = 0; i < d_model; i += 2) {
			let div_term = Math.pow(10000, (2 * i) / d_model);
			peVec[i] = Math.sin(pos / div_term);
			if (i + 1 < d_model) peVec[i + 1] = Math.cos(pos / div_term);
		}

		const combined = semanticVec.map((val, i) => (val + peVec[i]).toFixed(3));

		html += `
	    <div style="margin-bottom: 10px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; background: #fff;">
		<strong>Pos ${pos}: ${token}</strong>
		<table style="width:100%; font-family: monospace; font-size: 11px; margin-top: 5px;">
		    <tr><td>PE (Sin/Cos)</td>${peVec.map(v => `<td>${v.toFixed(3)}</td>`).join('')}</tr>
		    <tr style="font-weight:bold;"><td>Combined</td>${combined.map(v => `<td>${v}</td>`).join('')}</tr>
		</table>
	    </div>`;
	});
	resultsContainer.innerHTML = html;
}

function render_positional_waves(d_model, tokens) {
	const traces = [];
	const resolution = 0.1;
	const maxPos = Math.max(10, tokens.length);

	for (let i = 0; i < d_model; i++) {
		let x = [], y = [];
		for (let p = 0; p <= maxPos; p += resolution) {
			let div_term = Math.pow(10000, (2 * (Math.floor(i/2))) / d_model);
			let val = (i % 2 === 0) ? Math.sin(p / div_term) : Math.cos(p / div_term);
			x.push(p);
			y.push(val);
		}
		traces.push({
			x: x, y: y, mode: 'lines', 
			name: `Dim ${i} ${i%2===0?'Sin':'Cos'}`,
			line: { shape: 'spline', width: 2 }
		});
	}

	// Add markers for actual token positions
	tokens.forEach((token, pos) => {
		traces.push({
			x: [pos], y: [0], mode: 'markers+text',
			text: [token], textposition: 'top center',
			marker: { size: 12, color: '#3b82f6' },
			name: `Pos ${pos}: ${token}`, showlegend: false
		});
	});

	const layout = {
		title: 'Sinusoidal Positional Waves',
		margin: { t: 40, b: 40, l: 40, r: 20 },
		xaxis: { title: 'Token Position (pos)' },
		yaxis: { title: 'PE Value', range: [-1.1, 1.1] }
	};

	Plotly.newPlot('transformer-pe-wave-plot', traces, layout);
}

function run_transformer_demo() {
	console.log("Starting Transformer Demo...");

	const masterInput = document.getElementById('transformer-master-token-input');
	const trainingInput = document.getElementById('transformer-training-data');
	const dimSlider = document.getElementById('transformer-dimension-model');
	const headSlider = document.getElementById('transformer-heads');
	const depthSlider = document.getElementById('transformer-depth');
	const tempSlider = document.getElementById('transformer-temperature');

	if (!masterInput || !trainingInput) {
		console.error("Missing input elements");
		return;
	}

	const text = trainingInput.value;
	const d_model = parseInt(dimSlider.value);
	const n_heads = parseInt(headSlider.value);
	const n_layers = parseInt(depthSlider.value);
	const temperature = parseFloat(tempSlider.value);

	// 1. Tokenize Training Data
	const trainingTokens = transformer_tokenize_render(text, "transformer-viz-bpe");
	const vocabulary = [...new Set(trainingTokens)]; // Unique words

	// 2. Tokenize Input (Inference) Data
	// We pass null as container because we don't need a separate viz for this yet, 
	// or you can add a div with id "inference-viz" in your HTML if you want to see it.
	const inputTokens = transformer_tokenize_render(masterInput.value, null);

	// 3. Filter for Known Tokens (The model can't process words it hasn't learned)
	const knownTokens = inputTokens.filter(token => vocabulary.includes(token));

	console.log("Vocab:", vocabulary);
	console.log("Input:", inputTokens);
	console.log("Known Tokens:", knownTokens);

	// Visualizations
	calculate_positional_injection(knownTokens, d_model);
	render_positional_waves(d_model, knownTokens);
	render_positional_shift_plot(knownTokens, d_model);
	render_embedding_plot(knownTokens, d_model);
	render_causal_mask(knownTokens);
	if (typeof render_mask_logic === "function") render_mask_logic(knownTokens);
	render_architecture_stats(d_model, n_heads, n_layers, temperature);

	// If no known tokens, stop here to prevent errors in math functions
	if (knownTokens.length === 0) {
		document.getElementById('transformer-output-projection').innerHTML = 
			`<div style="padding:20px; color: #64748b; text-align:center;">
		Input words not found in Training Data.<br>
		Type words from the corpus above (e.g. "king", "queen", "wise").
	     </div>`;
		return;
	}

	// --- Forward Pass Simulation ---
	const engine = new AttentionEngine({
		d_model: d_model,
		n_heads: n_heads,
		containerId: "mha-calculation-details"
	});

	const mockH0 = knownTokens.map(() => 
		Array.from({length: engine.d_model}, () => Math.random() - 0.5)
	);

	const headData = engine.forward(mockH0, knownTokens);
	const multiHeadOutput = updateConcatenationDisplay(headData, knownTokens);

	const h1 = get_h1(mockH0, multiHeadOutput);
	if (typeof render_h1_logic === "function") render_h1_logic(mockH0, multiHeadOutput);

	const h2 = run_ffn_block(h1);
	const h_final = run_deep_layers(h2, knownTokens, n_layers, d_model, n_heads);

	// --- Output Projection ---
	// Ensure this function exists before calling
	if (typeof render_final_projection === "function") {
		render_final_projection(h_final, vocabulary, d_model, temperature);
	} else {
		console.error("render_final_projection function is missing!");
	}
}

function render_final_projection(h_final, vocabulary, d_model, temperature) {
    const container = document.getElementById('transformer-output-projection');
    const masterInput = document.getElementById('transformer-master-token-input');
    
    if (!container) return;

    const lastIdx = h_final.length - 1;
    const h_last = h_final[lastIdx];

    // 1. Weights & Logits Calculation
    const W_vocab = vocabulary.map(word => {
        const hash = word.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
        return Array.from({ length: d_model }, (_, i) => {
            const seed = Math.abs(hash * (i + 13));
            return ((seed % 2000) / 1000) - 1;
        });
    });

    const logits = vocabulary.map((word, i) => {
        const w_row = W_vocab[i];
        const val = h_last.reduce((sum, h_val, dim) => sum + h_val * w_row[dim], 0);
        return { word, val, w_row };
    });

    // 2. Softmax Logic
    const scaledLogits = logits.map(item => item.val / temperature);
    const maxLogit = Math.max(...scaledLogits); 
    const exps = scaledLogits.map(val => Math.exp(val - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map(e => e / sumExps);

    const predictions = logits.map((item, i) => ({
        word: item.word,
        logit: item.val,
        prob: probs[i],
        w_row: item.w_row,
        expVal: exps[i]
    })).sort((a, b) => b.prob - a.prob);

    // LaTeX Helpers
    const texSafe = (s) => s.replace(/#/g, '\\#');
    const vecToTex = (v) => `\\begin{pmatrix} ${v.map(n => n.toFixed(2)).join(' & ')} \\end{pmatrix}`;
    const colToTex = (v) => `\\begin{pmatrix} ${v.map(n => n.toFixed(2)).join(' \\\\ ')} \\end{pmatrix}`;

    let html = `<h3>1. Projection Derivations</h3>
                <p>Aligning the hidden state with each vocabulary vector:</p>`;

    // Show derivation for top 5 to keep UI manageable
    predictions.slice(0, 5).forEach((cand, idx) => {
        const derivation = h_last.map((h_val, i) => 
            `(${h_val.toFixed(2)} \\cdot ${cand.w_row[i].toFixed(2)})`
        ).join(' + ');

        html += `
        <div style="margin-bottom: 25px; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <p style="font-weight:bold; color:#3b82f6; margin-top:0;">Option ${idx + 1}: "${cand.word}"</p>
            
            <div style="margin-bottom:10px;">
                $$ \\underbrace{${cand.logit.toFixed(2)}}_{\\text{Logit}} = 
                   \\underbrace{${vecToTex(h_last)}}_{h_{\\text{final}}} \\cdot 
                   \\underbrace{${colToTex(cand.w_row)}}_{W^T_{\\text{vocab}}["${texSafe(cand.word)}"]} $$
            </div>

            <div style="font-size:0.8rem; color:#64748b; margin-bottom:10px;">
                $$ \\text{Sum: } \\underbrace{${derivation}}_{\\sum (h_i \\cdot w_i)} = ${cand.logit.toFixed(2)} $$
            </div>

            <div style="background: #ffffff; padding: 10px; border-radius: 4px; border: 1px dashed #cbd5e1;">
                $$ \\underbrace{${(cand.prob * 100).toFixed(1)}\\%}_{P("${texSafe(cand.word)}")} = 
                   \\frac{\\overbrace{e^{${cand.logit.toFixed(2)} / ${temperature}}}^{${cand.expVal.toFixed(3)}}}
                   {\\underbrace{${sumExps.toFixed(3)}}_{\\sum e^{z_j/T}}} $$
            </div>
        </div>`;
    });

    // The Interactive Button List
    html += `<h3>2. Final Probabilities (Click to Generate)</h3>
             <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">`;

    predictions.slice(0, 10).forEach(p => {
        const isTop = p === predictions[0];
        // Special onclick logic to update the master input and restart simulation
        html += `
            <button onclick="
                const input = document.getElementById('transformer-master-token-input');
                input.value += (input.value ? ' ' : '') + '${p.word}';
                run_transformer_demo();
            " 
            style="flex: 1 1 150px; border: 1px solid ${isTop ? '#3b82f6' : '#cbd5e1'}; 
            background: ${isTop ? '#eff6ff' : '#fff'}; border-radius: 8px; padding: 10px; cursor: pointer; text-align: left; transition: transform 0.1s;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; color: #1e293b;">
                    <span>"${p.word}"</span>
                    <span>${(p.prob * 100).toFixed(0)}%</span>
                </div>
                <div style="width: 100%; background: #e2e8f0; height: 4px; border-radius: 2px; margin-top:5px;">
                    <div style="width: ${p.prob * 100}%; background: #3b82f6; height: 100%;"></div>
                </div>
            </button>
        `;
    });

    html += `</div>`;
    
    // Add a summary of the "Total Pool" for hand-calculators
    html += `
        <div style="margin-top: 20px; font-size: 0.85rem; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            Note: Sum of all $e^{z/T}$ (Denominator) = <b>${sumExps.toFixed(3)}</b>. 
            All probabilities above are derived by dividing the individual token's exponent by this total pool.
        </div>
    `;

    container.innerHTML = html;

    if (typeof render_temml === "function") render_temml();
}

// Make sure this is globally available
window.appendToken = (token) => {
	const input = document.getElementById('transformer-master-token-input');
	if (!input) return;

	// Logic to handle "##" tokens (subwords)
	if (token.startsWith('##')) {
		input.value += token.replace('##', '');
	} else {
		input.value += (input.value ? " " : "") + token;
	}
	// Trigger update
	run_transformer_demo();
};

// Helper to handle the click interaction
window.appendToken = (token) => {
	const input = document.getElementById('transformer-master-token-input');
	// Simple logic to handle spaces (rudimentary)
	if (input.value && !token.startsWith('##')) {
		input.value += " " + token;
	} else if (token.startsWith('##')) {
		input.value += token.replace('##', '');
	} else {
		input.value += token;
	}
	// Trigger update
	run_transformer_demo();
};

function render_architecture_stats(d, h, n, t) {
	const statsContainerName = 'transformer-temperature-config';
	const statsContainer = document.getElementById(statsContainerName);
	if (!statsContainer) {
		console.error(`render_architecture_stats: ${statsContainerName} not found`);
		return;
	}

	const dv = (d / h).toFixed(2);
	const infoHtml = `
	<div style="background: #e0f2fe; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 0.9rem;">
	    <strong>Configuration:</strong> $d_{v} = ${dv}$, $N = ${n}$, $T = ${t}$ <br>
	    <em>Note: $T > 1.0$ increases randomness (flattens SoftMax), $T < 1.0$ makes predictions more confident.</em>
	</div>
    `;
	statsContainer.innerHTML = infoHtml;
}

function render_positional_shift_plot(tokens, d_model) {
	const container = document.getElementById('transformer-pe-shift-plot');
	if (!container || !Array.isArray(tokens)) return;

	const traces = [];

	tokens.forEach((token, pos) => {
		const hash = token.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
		const getCoord = (seed) => (((Math.abs(hash) * seed) % 200) - 100) / 100;

		const base = [getCoord(1), d_model >= 2 ? getCoord(2) : 0, d_model >= 3 ? getCoord(3) : 0];
		const pe = [];
		for (let i = 0; i < d_model; i++) {
			let div_term = Math.pow(10000, (2 * Math.floor(i/2)) / d_model);
			pe[i] = (i % 2 === 0) ? Math.sin(pos / div_term) : Math.cos(pos / div_term);
		}
		const h0 = base.map((val, i) => val + (pe[i] || 0));
		const color = `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;

		// The Migration Line
		traces.push({
			x: [base[0], h0[0]],
			y: [base[1], h0[1]],
			z: [base[2], h0[2]],
			type: d_model === 3 ? 'scatter3d' : 'scatter',
			mode: 'lines',
			line: { width: 3, color: color, dash: 'solid' },
			name: `${token} (pos ${pos})`,
			hoverinfo: 'skip'
		});

		// The Arrowhead
		if (d_model === 3) {
			traces.push({
				type: 'cone',
				x: [h0[0]], y: [h0[1]], z: [h0[2]],
				u: [h0[0] - base[0]], v: [h0[1] - base[1]], w: [h0[2] - base[2]],
				sizemode: 'absolute', sizeref: 0.1, anchor: 'tip',
				colorscale: [[0, color], [1, color]], showscale: false
			});
		} else {
			// 2D Rotation Logic
			const angle = Math.atan2(h0[1] - base[1], h0[0] - base[0]) * (180 / Math.PI) - 90;
			traces.push({
				x: [h0[0]], y: [h0[1]],
				type: 'scatter',
				mode: 'markers',
				marker: {
					symbol: 'triangle-up',
					size: 10,
					color: color,
					angle: angle
				},
				name: token
			});
		}
	});

	const layout = {
		title: 'Positional Migration: $Embedding \\to h_0$',
		margin: { l: 0, r: 0, b: 0, t: 40 },
		scene: { 
			xaxis: { range: [-2, 2] }, yaxis: { range: [-2, 2] }, zaxis: { range: [-2, 2] } 
		},
		xaxis: { range: [-2, 2] }, yaxis: { range: [-2, 2] }
	};

	Plotly.newPlot('transformer-pe-shift-plot', traces, layout);
}

function render_embedding_plot(tokens, dimensions) {
	const plotData = [];

	tokens.forEach((token) => {
		// Deterministic hash for "random" but stable coordinates
		const hash = token.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);

		const getCoord = (seed) => (((Math.abs(hash) * seed) % 200) - 100) / 100;

		const x = [getCoord(1)];
		const y = dimensions >= 2 ? [getCoord(2)] : [0];
		const z = dimensions >= 3 ? [getCoord(3)] : [0];

		plotData.push({
			x: x, y: y, z: z,
			mode: 'markers+text',
			type: dimensions === 3 ? 'scatter3d' : 'scatter',
			name: token,
			text: [token],
			textposition: 'top center',
			marker: {
				size: 8,
				color: `hsl(${Math.abs(hash) % 360}, 70%, 50%)`,
				opacity: 0.8
			}
		});
	});

	const layout = {
		margin: { l: 0, r: 0, b: 0, t: 0 },
		showlegend: false,
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		scene: { // For 3D
			xaxis: { range: [-1, 1], title: 'Dim 1' },
			yaxis: { range: [-1, 1], title: 'Dim 2' },
			zaxis: { range: [-1, 1], title: 'Dim 3' }
		},
		xaxis: { range: [-1.2, 1.2], title: 'Dim 1' }, // For 1D/2D
		yaxis: { range: [-1.2, 1.2], title: 'Dim 2' }
	};

	Plotly.newPlot('transformer-plotly-space', plotData, layout, { responsive: true });
}

function render_embedding_space(tokens, dimensions) {
	const container = document.getElementById('transformer-viz-embeddings');
	if (!container) return;

	container.innerHTML = tokens.map(t => {
		// Create a deterministic seed based on the token string
		const hash = t.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);

		// Generate pseudo-random coordinates based on the hash
		const coords = [];
		for (let i = 0; i < dimensions; i++) {
			// Generates a value between -1.00 and 1.00
			const val = (((Math.abs(hash) * (i + 1)) % 200) - 100) / 100;
			coords.push(val.toFixed(2));
		}

		const hue = Math.abs(hash) % 360;

		return `
	    <div style="border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; background: white; min-width: 120px; box-shadow: 2px 2px 5px rgba(0,0,0,0.05);">
		<div style="font-weight: bold; color: hsl(${hue}, 70%, 30%); margin-bottom: 5px; border-bottom: 1px solid #eee;">
		    "${t}"
		</div>
		<div style="font-family: 'Courier New', monospace; font-size: 0.8rem; color: #475569;">
		    [${coords.join(', ')}]
		</div>
		<div style="font-size: 0.6rem; color: #94a3b8; margin-top: 4px;">
		    $\in \mathbb{R}^{${dimensions}}$
		</div>
	    </div>
	`;
	}).join('');
}

// Updated Tokenizer to allow different containers
function transformer_tokenize_render(text, containerId = "transformer-viz-bpe") {
	const container = document.getElementById(containerId);
	// If container doesn't exist, we just return tokens without rendering (silent mode)

	let tokens = [];
	// Simple logic to split suffixes for demo purposes
	const subUnits = ["tion", "ing", "haus", "er", "ly", "is", "ment", "ness", "ation"];
	// Remove punctuation for cleaner tokens in this demo
	const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""); // `
    const words = cleanText.split(/\s+/);

    words.forEach(word => {
	let found = false;
	for (let unit of subUnits) {
	    if (word.toLowerCase().endsWith(unit) && word.length > unit.length) {
		tokens.push(word.substring(0, word.length - unit.length));
		tokens.push("##" + unit);
		found = true;
		break;
	    }
	}
	if (!found && word.length > 0) tokens.push(word);
    });

    if (container) {
	container.innerHTML = tokens.map(t => {
	    const hash = t.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
	    const hue = Math.abs(hash) % 360;
	    return `
		<div style="background: hsl(${hue}, 65%, 40%); color: white; padding: 5px 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 0.85rem; display: flex; flex-direction: column; align-items: center;">
		${t}
		<span style="font-size: 0.6rem; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.2); width: 100%; text-align: center;">ID: ${Math.abs(hash) % 1000}</span>
		</div>
		`;
	}).join('');
    }

    return tokens;
}

function render_causal_mask(tokens) {
	const container = document.getElementById('transformer-causal-mask-display');
	if (!container || !tokens.length) return;

	const N = tokens.length;
	let matrixLaTeX = "M = \\begin{pmatrix}\n";

	for (let i = 0; i < N; i++) {
		let row = [];
		for (let j = 0; j < N; j++) {
			// Lower triangular logic: 0 if j <= i, else -∞
			if (j <= i) {
				row.push("0");
			} else {
				row.push("-\\infty");
			}
		}
		matrixLaTeX += "  " + row.join(" & ") + (i === N - 1 ? "" : " \\\\") + "\n";
	}
	matrixLaTeX += "\\end{pmatrix}";

	container.innerHTML = `$$${matrixLaTeX}$$`;

	render_temml();
}

function render_mask_logic(tokens) {
	const countEl = document.getElementById('mask-token-count');
	const sentenceEl = document.getElementById('mask-sentence-string');
	const rowsContainer = document.getElementById('mask-rows-container');
	const trainingInput = document.getElementById('transformer-training-data');

	if (!countEl || !sentenceEl || !rowsContainer) return;

	// 1. Update the descriptive sentence text
	countEl.innerText = tokens.length;
	sentenceEl.innerText = trainingInput.value;

	if (tokens.length === 0) {
		rowsContainer.innerHTML = "<p>No tokens detected.</p>";
		return;
	}

	// 2. Generate Row-by-Row Logic in Pure HTML
	// We escape '#' to '\#' for LaTeX compatibility
	const htmlRows = tokens.map((token, i) => {
		const visibleTokens = tokens.slice(0, i + 1);
		const visibleList = visibleTokens.map(t => `<code>"${t}"</code>`).join(', ');
		const escapedToken = token.replace(/#/g, '\\#'); 

		return `
	    <li style="margin-bottom: 10px; list-style-type: none;">
		<strong>Row ${i + 1}:</strong> $Q_{\\text{${escapedToken}}}$ is compared against ${visibleList}.
	    </li>
	`;
	}).join('');

	// Wrap in a list for clean structure
	rowsContainer.innerHTML = `<ul style="padding-left: 0;">${htmlRows}</ul>`;

	render_temml();
}

function render_h1_logic(h0, multiHeadOutput) {
	const normContainer = document.getElementById('transformer-h1-layernorm-viz');
	const finalContainer = document.getElementById('transformer-h1-final-viz');
	if (!normContainer || !finalContainer) return;

	const matrixToPmatrix = (matrix) =>
		`\\begin{pmatrix} ` + matrix.map(row => row.map(v => v.toFixed(2)).join(' & ')).join(' \\\\ ') + ` \\end{pmatrix}`;

	// 1. LayerNorm Calculation
	const eps = 1e-5;
	const normMH = multiHeadOutput.map(row => {
		const mean = row.reduce((a, b) => a + b, 0) / row.length;
		const variance = row.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / row.length;
		return row.map(val => (val - mean) / Math.sqrt(variance + eps));
	});

	// 2. h1 = h0 + normMH
	const h1 = h0.map((row, i) => row.map((val, j) => val + normMH[i][j]));

	// Render LayerNorm Step
	normContainer.innerHTML = `$$ \\text{LayerNorm}(\\text{MultiHead}(h_0)) = ${matrixToPmatrix(normMH)} $$`;

	// Render Final h1 Step
	finalContainer.innerHTML = `$$ h_1 = \\underbrace{${matrixToPmatrix(h0)}}_{h_0} + \\underbrace{${matrixToPmatrix(normMH)}}_{\\text{LayerNorm}} = \\underbrace{${matrixToPmatrix(h1)}}_{h_1} $$`;

	if (typeof render_temml === "function") render_temml();
	return h1;
}

/**
 * Algorithm: Block Matrix Concatenation
 * Returns: Array (Matrix of Tokens x d_model)
 */
function updateConcatenationDisplay(headData, tokens) {
	const container = document.getElementById('transformer-concat-viz');
	if (!container || !headData.length) return [];

	const matrixToPmatrix = (matrix) => {
		return `\\begin{pmatrix} ` + 
			matrix.map(row => row.map(v => v.toFixed(2)).join(' & ')).join(' \\\\ ') + 
			` \\end{pmatrix}`;
	};

	const headMatricesLaTeX = headData.map((h, i) => {
		return `\\underbrace{${matrixToPmatrix(h.context)}}_{\\text{Head } ${i + 1}}`;
	}).join(', ');

	// Perform the actual numerical concatenation
	const fullMatrixData = tokens.map((_, tIdx) => {
		return [].concat(...headData.map(h => h.context[tIdx]));
	});

	const finalMatrixLaTeX = `\\underbrace{${matrixToPmatrix(fullMatrixData)}}_{\\text{Total } d_{\\text{model}}}`;
	container.innerHTML = `$$ \\text{Concat} \\left( \\left[ ${headMatricesLaTeX} \\right] \\right) = ${finalMatrixLaTeX} $$`;

	if (typeof render_temml === "function") render_temml();

	return fullMatrixData; // Now returns the calculated value
}

/**
 * Method: Layer Normalization (Ba et al., 2016)
 * Note: Uses epsilon 1e-5 for numerical stability.
 */
function calculateLayerNorm(matrix) {
	const eps = 1e-5;
	return matrix.map(row => {
		const mean = row.reduce((a, b) => a + b, 0) / row.length;
		const variance = row.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / row.length;
		return row.map(val => (val - mean) / Math.sqrt(variance + eps));
	});
}

/**
 * Goal: Calculate h1 = h0 + LayerNorm(MultiHead(h0))
 * Note: This implements the "Post-LN" architecture.
 */
function get_h1(h0, multiHeadOutput) {
	// 1. Apply LayerNorm to the Multi-Head output
	const normMH = calculateLayerNorm(multiHeadOutput);

	// 2. Element-wise addition (Residual Connection)
	const h1 = h0.map((row, i) =>
		row.map((val, j) => val + normMH[i][j])
	);

	return h1;
}

function concatenateHeads(headData) {
	const numHeads = headData.length;
	const numTokens = headData[0].context.length;
	const d_v = headData[0].context[0].length;

	// Initialize h_concat matrix (Tokens x d_model)
	let concatenatedResult = Array.from({ length: numTokens }, () => []);

	for (let t = 0; t < numTokens; t++) {
		for (let h = 0; h < numHeads; h++) {
			// Append the d_v vector of Head H for Token T
			concatenatedResult[t] = concatenatedResult[t].concat(headData[h].context[t]);
		}
	}
	return concatenatedResult;
}

/**
 * Hilfsfunktion zur Initialisierung von Zufallsgewichten (Glorot)
 */
function initFFNWeights(rows, cols) {
	const limit = Math.sqrt(6 / (rows + cols));
	return Array.from({ length: rows }, () => 
		Array.from({ length: cols }, () => (Math.random() * 2 * limit) - limit)
	);
}

/**
 * Validiert die Form der übergebenen Matrizen/Vektoren
 */
function validateShape(name, data, expectedRows, expectedCols) {
	if (!data) return false;
	const actualRows = data.length;
	const actualCols = Array.isArray(data[0]) ? data[0].length : 1;

	if (actualRows !== expectedRows || actualCols !== expectedCols) {
		throw new Error(`Shape Mismatch for ${name}: Expected [${expectedRows}, ${expectedCols}], got [${actualRows}, ${actualCols}]`);
	}
	return true;
}

/**
 * FFN Block mit optionalen Gewichten und Biases
 * @param {Array} h1 - Input Hidden State
 * @param {Object} params - {W1, b1, W2, b2} (optional)
 */
function run_ffn_block(h1, params = {}) {
	const d_model = h1[0].length;
	const d_ff = d_model * 4;

	// 1. Gewichte & Biases setzen oder zufällig initialisieren
	let W1 = params.W1, b1 = params.b1, W2 = params.W2, b2 = params.b2;

	// Hilfsfunktion für Xavier/Glorot Initialisierung
	function initWeights(rows, cols) {
		const limit = Math.sqrt(6 / (rows + cols));
		return Array.from({ length: rows }, () => 
			Array.from({ length: cols }, () => (Math.random() * 2 - 1) * limit)
		);
	}

	// Validierung oder Fallback
	if (W1) validateShape('W1', W1, d_model, d_ff); 
	else W1 = initWeights(d_model, d_ff);

	if (b1) validateShape('b1', b1, d_ff, 1); 
	else b1 = new Array(d_ff).fill(0); // Standard: Initialisierung mit 0

	if (W2) validateShape('W2', W2, d_ff, d_model); 
	else W2 = initWeights(d_ff, d_model);

	if (b2) validateShape('b2', b2, d_model, 1); 
	else b2 = new Array(d_model).fill(0);

	// 2. Schritt: Expansion & ReLU -> out_L1 = ReLU(h1 * W1 + b1)
	const out_L1 = h1.map(row => {
		return b1.map((bias, j) => {
			let sum = bias;
			for (let i = 0; i < d_model; i++) sum += row[i] * W1[i][j];
			return Math.max(0, sum);
		});
	});

	// 3. Schritt: Projektion -> out_FFN = out_L1 * W2 + b2
	const out_FFN = out_L1.map(row => {
		return b2.map((bias, j) => {
			let sum = bias;
			for (let i = 0; i < d_ff; i++) sum += row[i] * W2[i][j];
			return sum;
		});
	});

	// 4. Schritt: LayerNorm & Residual -> h2 = h1 + LN(out_FFN)
	const ffn_normed = calculateLayerNorm(out_FFN);
	const h2 = h1.map((row, i) => row.map((val, j) => val + ffn_normed[i][j]));

	// Visualisierung triggern
	render_ffn_absolute_full(h1, W1, b1, out_L1, W2, b2, out_FFN, h2);

	return h2;
}

/**
 * Erzeugt LaTeX-Output für Matrizen ohne Limitierungen.
 */
function render_ffn_absolute_full(h1, W1, b1, out_L1, W2, b2, out_FFN, h2) {
	// Helper: Rendert absolut JEDE Zahl in der Matrix
	const rawMP = (m) => {
		const rows = m.map(r => r.map(v => v.toFixed(2)).join(' & ')).join(' \\\\ ');
		return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
	};

	// Helper: Rendert JEDE Zahl im Vektor
	const rawVP = (v) => {
		const content = v.map(val => val.toFixed(2)).join(' & ');
		return `\\begin{pmatrix} ${content} \\end{pmatrix}`;
	};

	// Anzeige Schritt 1
	document.getElementById('ffn-step-1').innerHTML = `
	$$ \\text{out}_{L1} = \\text{ReLU}(h_1 W_1 + b_1) $$
	$$ \\text{out}_{L1} = \\text{ReLU} ( \\underbrace{${rawMP(h1)}}_{h_1} \\cdot \\underbrace{${rawMP(W1)}}_{W_1} + \\underbrace{${rawVP(b1)}}_{b_1} ) = \\underbrace{${rawMP(out_L1)}}_{\\text{out}_{L1}} $$
    `;

	// Anzeige Schritt 2
	document.getElementById('ffn-step-2').innerHTML = `
	$$ \\text{out}_{\\text{L}2} = \\text{out}_{L1} W_2 + b_2 $$
	$$ \\text{out}_{\\text{L}2} = \\underbrace{${rawMP(out_L1)}}_{\\text{out}_{L1}} \\cdot \\underbrace{${rawMP(W2)}}_{W_2} + \\underbrace{${rawVP(b2)}}_{b_2} = \\underbrace{${rawMP(out_FFN)}}_{\\text{out}_{\\text{L}2}} $$
    `;

	// Anzeige Schritt 3 (Finale h2 Gleichung)
	document.getElementById('ffn-step-3').innerHTML = `
	$$ h_2 = h_1 + \\text{LayerNorm}(\\text{out}_{\\text{FFN}}) $$
	$$ h_2 = \\underbrace{${rawMP(h1)}}_{h_1} + \\underbrace{\\text{LayerNorm}(${rawMP(out_FFN)})}_{\\text{Stabilisierter Output}} = \\underbrace{${rawMP(h2)}}_{h_2} $$
    `;

	// Temml Render-Trigger
	if (typeof render_temml === "function") render_temml();
}

/**
 * Goal: Unified N-Layer Trajectory Plotting
 * Logic: Every iteration i maps to Layer i+1 Plot
 */
function run_deep_layers(h_initial, tokens, total_depth, d_model, n_heads) {
	let h_current = h_initial;
	const plotContainer = document.getElementById('transformer-migration-plots-container');
	const statusContainer = document.getElementById('transformer-multi-layer-status');

	if (plotContainer) plotContainer.innerHTML = "";
	let statusHtml = "";

	for (let n = 0; n < total_depth; n++) {
		// Capture the start point for this layer's arrow
		const h_before = JSON.parse(JSON.stringify(h_current));

		// 1. Calculate the Layer (MHA + FFN)
		const engine = new AttentionEngine({ 
			d_model, 
			n_heads, 
			containerId: (n === 0) ? "mha-calculation-details" : null 
		});

		const headData = engine.forward(h_current, tokens);
		const concatOutput = tokens.map((_, tIdx) => [].concat(...headData.map(h => h.context[tIdx])));
		const zn = get_h1(h_current, concatOutput);
		const h_after = run_ffn_block(zn); // Note: this is our h_{n+1}

		// 2. Render Full-Width Migration Plot
		create_migration_plot(`migration-layer-${n+1}`, tokens, h_before, h_after, n + 1, d_model);

		// Update for next iteration
		h_current = h_after;

		statusHtml += `
	    <div style="padding: 10px; border-left: 4px solid #10b981; background: #f0fdf4; margin-bottom: 8px;">
		<strong>Layer ${n + 1} Status:</strong> Vector migration complete.
	    </div>`;
	}

	if (statusContainer) statusContainer.innerHTML = statusHtml;

	return h_current;
}

/**
 * Renders a full-screen width trajectory plot
 */
function create_migration_plot(id, tokens, start_h, end_h, layerNum, d_model) {
	const container = document.getElementById('transformer-migration-plots-container');
	const wrapper = document.createElement('div');
	wrapper.style.cssText = "width: 100%; margin-bottom: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px;";
	wrapper.innerHTML = `<h3 style="text-align: center; color: #1e293b;">Layer ${layerNum}: Feature Space Migration</h3>`;

	const plotDiv = document.createElement('div');
	plotDiv.id = id;
	plotDiv.style.cssText = "height: 500px; width: 100%;";
	wrapper.appendChild(plotDiv);
	container.appendChild(wrapper);

	const traces = [];
	let allX = [], allY = [], allZ = [];

	tokens.forEach((token, i) => {
		const color = `hsl(${(i * 137) % 360}, 70%, 50%)`;
		const start = start_h[i];
		const end = end_h[i];

		// Collect points for range calculation
		allX.push(start[0], end[0]);
		allY.push(start[1] || 0, end[1] || 0);
		allZ.push(start[2] || 0, end[2] || 0);

		// The Stem (Line)
		traces.push({
			x: [start[0], end[0]],
			y: [start[1] || 0, end[1] || 0],
			z: [start[2] || 0, end[2] || 0],
			type: 'scatter3d',
			mode: 'lines',
			line: { width: 6, color: color },
			hoverinfo: 'none',
			showlegend: false
		});

		// The Arrowhead (3D Cone)
		traces.push({
			type: 'cone',
			x: [end[0]],
			y: [end[1] || 0],
			z: [end[2] || 0],
			u: [end[0] - start[0]],
			v: [(end[1] || 0) - (start[1] || 0)],
			w: [(end[2] || 0) - (start[2] || 0)],
			sizemode: 'absolute',
			sizeref: 0.15, 
			anchor: 'tip',
			colorscale: [[0, color], [1, color]],
			showscale: false,
			text: `Token: ${token}`,
			hoverinfo: 'text'
		});
	});

	// Calculate dynamic range with 10% padding
	const getRange = (pts) => {
		const min = Math.min(...pts);
		const max = Math.max(...pts);
		const pad = (max - min) * 0.1 || 0.5; // fallback if points are same
		return [min - pad, max + pad];
	};

	const layout = {
		autosize: true,
		margin: { l: 0, r: 0, b: 0, t: 0 },
		scene: {
			aspectmode: "cube",
			xaxis: { title: 'Dim 1', range: getRange(allX) },
			yaxis: { title: 'Dim 2', range: getRange(allY) },
			zaxis: { title: 'Dim 3', range: getRange(allZ) }
		},
		showlegend: false
	};

	Plotly.newPlot(id, traces, layout);
}

async function loadTransformerModule () {
	updateLoadingStatus("Loading section about transformers...");
	run_transformer_demo()
	return Promise.resolve();
}
