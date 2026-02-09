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
		    }{\\sqrt{${dk_int}}} \\right) 
		}_{\\text{Weight} ${weight.toFixed(3)}} 
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
	const masterInput = document.getElementById('transformer-master-token-input');
	const trainingInput = document.getElementById('transformer-training-data');
	const dimSlider = document.getElementById('transformer-dimension-model');
	const headSlider = document.getElementById('transformer-heads');
	const depthSlider = document.getElementById('transformer-depth');
	const tempSlider = document.getElementById('transformer-temperature'); // New

	if (!masterInput || !trainingInput || !dimSlider || !headSlider || !depthSlider || !tempSlider) return;

	const text = trainingInput.value;
	const d_model = parseInt(dimSlider.value);
	const n_heads = parseInt(headSlider.value);
	const n_layers = parseInt(depthSlider.value);
	const temperature = parseFloat(tempSlider.value); // New

	// Process and Render
	const trainingTokens = transformer_tokenize_render(text, "transformer-viz-bpe", true);
	const vocabulary = new Set(trainingTokens);
	const inputTokens = transformer_tokenize_render(text, "transformer-viz-bpe-inference", false);
	const knownTokens = inputTokens.filter(token => vocabulary.has(token));

	calculate_positional_injection(knownTokens, d_model);
	render_positional_waves(d_model, knownTokens);
	render_positional_shift_plot(knownTokens, d_model);
	render_embedding_plot(knownTokens, d_model);
	render_causal_mask(knownTokens);

	render_architecture_stats(d_model, n_heads, n_layers, temperature);

	// 1. Initialize inside your main function
	const engine = new AttentionEngine({
		d_model: parseInt(document.getElementById('transformer-dimension-model').value),
		n_heads: parseInt(document.getElementById('transformer-heads').value),
		containerId: "mha-calculation-details"
	});

	// 2. Prepare h0 (Tokens x Dimensions)
	// Use your existing knownTokens array from transformerlab.js
	const mockH0 = knownTokens.map(() => 
		Array.from({length: engine.d_model}, () => Math.random() - 0.5)
	);

	// 3. Execute the forward pass and UI render
	const headData = engine.forward(mockH0, knownTokens);

	const multiHeadOutput = updateConcatenationDisplay(headData, knownTokens);

	// Calculate h1
	const h1 = get_h1(mockH0, multiHeadOutput);
	const h1_after_residual = render_h1_logic(mockH0, multiHeadOutput);

	const h2 = run_ffn_block(h1_after_residual);

	run_deep_layers(h2, knownTokens, n_layers, d_model, n_heads);
}

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
		// 1. Semantic Base (Static) - IDENTICAL to render_embedding_plot
		const hash = token.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
		const getCoord = (seed) => (((Math.abs(hash) * seed) % 200) - 100) / 100;

		const base = [
			getCoord(1), 
			d_model >= 2 ? getCoord(2) : 0, 
			d_model >= 3 ? getCoord(3) : 0
		];

		// 2. Calculate PE Nudge
		const pe = [];
		for (let i = 0; i < d_model; i++) {
			let div_term = Math.pow(10000, (2 * Math.floor(i/2)) / d_model);
			pe[i] = (i % 2 === 0) ? Math.sin(pos / div_term) : Math.cos(pos / div_term);
		}

		// 3. Target Coordinate (h0 = Embedding + PE)
		const h0 = base.map((val, i) => val + (pe[i] || 0));

		// Trace for the migration line
		traces.push({
			x: [base[0], h0[0]],
			y: [base[1], h0[1]],
			z: [base[2], h0[2]],
			type: d_model === 3 ? 'scatter3d' : 'scatter',
			mode: 'lines+markers',
			name: `${token} (pos ${pos})`,
			line: { width: 3, color: `hsl(${Math.abs(hash) % 360}, 70%, 50%)` },
			marker: { 
				size: [4, 8], // Small start, larger end
				color: `hsl(${Math.abs(hash) % 360}, 70%, 50%)`,
				symbol: 'circle'
			}
		});
	});

	const layout = {
		title: 'Positional Migration: $Embedding \\to h_0$',
		showlegend: true,
		margin: { l: 0, r: 0, b: 0, t: 40 },
		scene: { // For 3D
			xaxis: { title: 'Dim 1', range: [-2, 2] },
			yaxis: { title: 'Dim 2', range: [-2, 2] },
			zaxis: { title: 'Dim 3', range: [-2, 2] }
		},
		xaxis: { title: 'Dim 1', range: [-2, 2] }, // For 1D/2D
		yaxis: { title: 'Dim 2', range: [-2, 2] }
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

function transformer_tokenize_render(text) {
	const container = document.getElementById(`transformer-viz-bpe`);
	if (!container) return [];

	let tokens = [];
	const subUnits = ["tion", "ing", "haus", "er", "ly", "is", "ment", "ness", "ation"];
	const words = text.split(/\s+/);

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

	return tokens; // Return for the embedding function
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

	// Validierung oder Fallback
	if (W1) validateShape('W1', W1, d_model, d_ff); else W1 = initFFNWeights(d_model, d_ff);
	if (b1) validateShape('b1', b1, d_ff, 1); else b1 = new Array(d_ff).fill(0).map(() => Math.random() * 0.01);
	if (W2) validateShape('W2', W2, d_ff, d_model); else W2 = initFFNWeights(d_ff, d_model);
	if (b2) validateShape('b2', b2, d_model, 1); else b2 = new Array(d_model).fill(0).map(() => Math.random() * 0.01);

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
	$$ \\text{out}_{\\text{FFN}} = \\text{out}_{L1} W_2 + b_2 $$
	$$ \\text{out}_{\\text{FFN}} = \\underbrace{${rawMP(out_L1)}}_{\\text{out}_{L1}} \\cdot \\underbrace{${rawMP(W2)}}_{W_2} + \\underbrace{${rawVP(b2)}}_{b_2} = \\underbrace{${rawMP(out_FFN)}}_{\\text{out}_{\\text{FFN}}} $$
    `;

	// Anzeige Schritt 3 (Finale h2 Gleichung)
	document.getElementById('ffn-step-3').innerHTML = `
	$$ h_2 = h_1 + \\text{LayerNorm}(\\text{out}_{\\text{FFN}}) $$
	$$ h_2 = \\underbrace{${rawMP(h1)}}_{h_1} + \\underbrace{\\text{LayerNorm}(${rawMP(out_FFN)})}_{\\text{Stabilisierter Output}} = \\underbrace{${rawMP(h2)}}_{h_2} $$
    `;

	// Temml Render-Trigger
	if (typeof render_temml === "function") render_temml();
}

function run_deep_layers(h_initial, tokens, total_depth, d_model, n_heads) {
	let h_current = h_initial;
	let statusHtml = "";

	for (let n = 0; n < total_depth; n++) {
		// Save the "earlier" state
		const h_before = JSON.parse(JSON.stringify(h_current));

		// 1. Process Layer (MHA + FFN)
		// Enable detailed UI logging ONLY for the first layer (n=0)
		const engine = new AttentionEngine({ 
			d_model, 
			n_heads, 
			containerId: (n === 0) ? "mha-calculation-details" : null 
		});

		const headData = engine.forward(h_current, tokens);
		const concatOutput = tokens.map((_, tIdx) => [].concat(...headData.map(h => h.context[tIdx])));

		// Sublayer 1 & 2 transitions
		const zn = get_h1(h_current, concatOutput);
		const h_after = run_ffn_block(zn); // Note: run_ffn_block updates UI internally

		// 2. Automate Migration Plot
		create_migration_plot(`migration-layer-${n+1}`, tokens, h_before, h_after, n + 1, d_model);

		// Update current state for the next layer in the stack
		h_current = h_after;

		statusHtml += `<div style="padding:5px; border-left:3px solid #3b82f6; margin-bottom:5px; background:#f8fafc;">
	    Layer ${n+1} processed.</div>`;
	}

	const statusContainer = document.getElementById('transformer-multi-layer-status');
	if (statusContainer) statusContainer.innerHTML = statusHtml;
}

/**
 * Clean Migration Plot (No Labels)
 */
function create_migration_plot(id, tokens, start_h, end_h, layerNum, d_model) {
	const container = document.getElementById('transformer-migration-plots-container');
	const plotDiv = document.createElement('div');
	plotDiv.id = id;
	plotDiv.style.cssText = "height: 250px; border: 1px solid #e2e8f0; border-radius: 8px;";
	container.appendChild(plotDiv);

	const traces = tokens.map((_, i) => ({
		x: [start_h[i][0], end_h[i][0]],
		y: [start_h[i][1] || 0, end_h[i][1] || 0],
		z: [start_h[i][2] || 0, end_h[i][2] || 0],
		type: 'scatter3d',
		mode: 'lines+markers',
		line: { width: 4, color: `hsl(${(i * 137) % 360}, 70%, 50%)` },
		marker: { size: [2, 5], color: `hsl(${(i * 137) % 360}, 70%, 50%)` },
		hoverinfo: 'none'
	}));

	Plotly.newPlot(id, traces, {
		margin: { l:0, r:0, b:0, t:0 },
		scene: { 
			xaxis: { title: '', showlabels: false }, 
			yaxis: { title: '', showlabels: false }, 
			zaxis: { title: '', showlabels: false } 
		},
		showlegend: false
	});
}

async function loadTransformerModule () {
	updateLoadingStatus("Loading section about transformers...");
	run_transformer_demo()
	return Promise.resolve();
}
