/**
 * AttentionEngine: Modular Transformer Component
 * Origin: Vaswani et al. (2017)
 * Methods: Multi-Head Projection, Scaled Dot-Product, LaTeX Logging
 */

const nr_fixed = 4;
const posEmbedScalar = 1;

window.addEventListener('DOMContentLoaded', (event) => {
	document.getElementById("ifscalfactornotone").style.display =  posEmbedScalar == 1 ? 'none' : 'block'
	document.getElementById("posEmbedScaleFactor").innerHTML = posEmbedScalar;
});

window.lastActiveInputId = 'transformer-training-data';
window.persistentEmbeddingSpace = null;
window.currentWeights = null;
window.lossHistory = [];
window.last_d_model = null;

const contextSize = 128;
const attentionRenderRegistry = new Map();

/**
 * Intersection Observer for Attention UI
 */
const attentionObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			const containerId = entry.target.id;
			const data = attentionRenderRegistry.get(containerId);
			if (data && !data.rendered) {
				console.log("Starting actual rendering");
				const engineInstance = data.instance;
				engineInstance.executeActualRender(data.headData, data.tokens);
				data.rendered = true;
			}
		}
	});
}, { threshold: 0 });

function reset_graph() {
	document.getElementById('training-loss-plot').style.display = 'none';
	document.getElementById('training-loss-plot').innerHTML = '';
}

function get_or_init_embeddings(tokens, d_model) {
	// 1. Ensure the global space exists before any logic
	if (window.persistentEmbeddingSpace === null) {
		window.persistentEmbeddingSpace = {};
	}

	// 2. Reset if dimensions changed
	if (window.last_d_model !== d_model) {
		window.persistentEmbeddingSpace = {};
		window.last_d_model = d_model;
		reset_graph();
	}

	// 3. Capture the reference AFTER potential resets
	const space = window.persistentEmbeddingSpace;
	
	const gaussianRandom = () => {
		let u = 0, v = 0;
		while(u === 0) u = Math.random();
		while(v === 0) v = Math.random();
		return (Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v));
	};

	tokens.forEach(token => {
		// space is now guaranteed to be an object {}
		if (!space[token]) {
			space[token] = Array.from({ length: d_model }, () =>
				parseFloat(gaussianRandom().toFixed(nr_fixed))
			);
		}
	});
	return space;
}

function initWeights(r, c) {
	const limit = Math.sqrt(6 / (r + c));
	return Array.from({ length: r }, () => 
		Array.from({ length: c }, () => (Math.random() * 2 * limit) - limit)
	);
}

class AttentionEngine {
	constructor(config) {
		this.d_model = config.d_model;
		this.n_heads = config.n_heads;
		this.d_k = config.d_model / config.n_heads;
		this.containerId = config.containerId; // Store ID specifically
		this.container = document.getElementById(config.containerId);

		this.this_weights = config.weights || {
			query: initWeights(this.d_model, this.d_model),
			key: initWeights(this.d_model, this.d_model),
			value: initWeights(this.d_model, this.d_model),
			output: initWeights(this.d_model, this.d_model)
		};

		// Start observing if container exists
		if (this.container) {
			attentionObserver.observe(this.container);
		}
	}

	dot(A, B) {
		if (!Array.isArray(A) || !Array.isArray(B) || A.length === 0 || B.length === 0) {
			throw new Error(`Matrix multiplication error: Invalid input dimensions. A: ${A?.length}, B: ${B?.length}`);
		}
		if (!Array.isArray(B[0])) {
			throw new Error("Matrix multiplication error: B must be a 2D array (B[0] is undefined).");
		}
		if (A[0].length !== B.length) {
			throw new Error(`Dimension mismatch: A columns (${A[0].length}) must match B rows (${B.length})`);
		}

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
		const Q_full = this.dot(h0, this.this_weights.query);
		const K_full = this.dot(h0, this.this_weights.key);
		const V_full = this.dot(h0, this.this_weights.value);

		// Fix #2: Single-head attention (no head splitting), matching training
		// Fix #3: Scale by √d_model (not √d_k)
		let scores = this.dot(Q_full, this.transpose(K_full)).map(row =>
			row.map(v => v / Math.sqrt(this.d_model))
		);

		// Fix #4: Apply causal mask (matching training's upper-triangle × 1e9)
		for (let r = 0; r < scores.length; r++) {
			for (let c = r + 1; c < scores[r].length; c++) {
				scores[r][c] -= 1e9;
			}
		}

		const attn_weights = this.softmax(scores);
		const context = this.dot(attn_weights, V_full);

		let headData = [{
			headIdx: 0,
			Qi: Q_full, Ki: K_full, Vi: V_full,
			this_weights: attn_weights,
			context: context,
			h0: h0,
			WQ: this.this_weights.query,
			WK: this.this_weights.key,
			WV: this.this_weights.value
		}];

		this.renderUI(headData, tokens);
		return headData;
	}

	transpose(M) {
		if (!M || M.length === 0 || !M[0]) {
			throw new Error("Transpose error: Cannot transpose an empty or 1D array.");
		}
		return M[0].map((_, i) => M.map(row => row[i]));
	}

	renderUI(headData, tokens) {
		if (!this.containerId) return;

		// Update the registry with the latest calculation data
		attentionRenderRegistry.set(this.containerId, {
			headData: headData,
			tokens: tokens,
			instance: this,
			rendered: false
		});

		// If it's already in view, the observer won't "re-fire" unless we nudge it,
		// so we check visibility manually once or wait for the next scroll.
		// For responsiveness, we clear the innerHTML with a loader.
		if (!this.container.innerHTML) {
			this.container.innerHTML = `<div style="padding:20px; color:#64748b;">Scroll to view Attention Matrix...</div>`;
		}
	}

	executeActualRender(headData, tokens) {
		if (!this.container) return;
		if (!tokens.length) return;

		let html = `<div class="attention-tabs" style="border:1px solid #3b82f6; border-radius:8px; overflow:hidden;">`;

		// Tab Headers
		html += `<div class="tab-list" style="background:#f0f4f8; display:flex; border-bottom:1px solid #3b82f6;">`;
		headData.forEach((h, i) => {
			html += `<button class="mha-tab-btn" id="tab-btn-${i}" onclick="showHead(${i})" 
	style="padding:10px 20px; border:none; border-right:1px solid #3b82f6; cursor:pointer; 
	background:${i === 0 ? '#fff' : '#e2e8f0'}; font-weight:${i === 0 ? 'bold' : 'normal'}">Head ${i + 1}</button>`;
		});
		html += `</div>`;

		// Tab Content
		headData.forEach((h, i) => {
			// FIX: Ensure 't' is treated as a string before calling .replace
			const escapedTokens = tokens.map(t => String(t).replace(/#/g, '\\#'));

			html += `<div id="head-content-${i}" class="head-tab" style="padding:20px; display:${i === 0 ? 'block' : 'none'}">
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
		const { this_weights, Qi, Ki, Vi, h0, WQ, WK, WV } = head;

		// Helper for Matrix display
		const toMatrix = (mat) => `\\begin{pmatrix} ${mat.map(row => row.map(v => v.toFixed(nr_fixed)).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;

		// Helper for Column Vector display
		const toColPmatrix = (arr) => {
			if (!Array.isArray(arr)) return arr; // Fallback for raw strings
			return `\\begin{pmatrix} ${arr.map(v => typeof v === 'number' ? v.toFixed(nr_fixed) : v).join(' \\\\ ')} \\end{pmatrix}`;
		};

		const wq_wk_wv_matrix_html = `
	$$ W_Q = ${toMatrix(WQ)} $$
	$$ W_K = ${toMatrix(WK)} $$
	$$ W_V = ${toMatrix(WV)} $$
    `;

		let html = `<table style="border-collapse: collapse; width: 100%; border: 1px solid #3b82f6; font-size: 0.52rem;">${wq_wk_wv_matrix_html}`;

		// Header (Keys)
		html += `<tr><th style="border: 1px solid #3b82f6; padding: 8px; background: #f8fafc;">Query \\ Key</th>`;
		tokens.forEach((t, j) => {
			// Render Key as a vertical vector if it's an embedding array
			const keyVector = Array.isArray(h0[j]) ? `$${toColPmatrix(h0[j])}$` : t;
			html += `<th style="border: 1px solid #3b82f6; padding: 8px; background: #f8fafc;">Key: ${keyVector}</th>`;
		});
		html += `</tr>`;

		// Rows (Queries)
		this_weights.forEach((row, i) => {
			html += `<tr>`;
			// Render Query as a vertical vector
			const queryVector = Array.isArray(h0[i]) ? `$${toColPmatrix(h0[i])}$` : tokens[i];
			html += `<td style="border: 1px solid #3b82f6; padding: 8px; background: #f8fafc;"><strong>Query: ${queryVector}</strong></td>`;

			row.forEach((weight, j) => {
				const intensity = Math.floor(255 - (weight * 150));
				const bgColor = `rgb(${intensity}, ${intensity}, 255)`;
				const dk_int = Math.round(this.d_k);
				const resultVec = Vi[j].map(v => v * weight);

				let cellEq;
				if (i === 0 && j === 0) {
					cellEq = `
		    \\text{SoftMax} \\left( \\frac{
			\\overbrace{ \\left( W_Q \\cdot ${toColPmatrix(h0[i])} \\right)^T }^{Q_i^T} \\cdot
			\\overbrace{ \\left( W_K \\cdot ${toColPmatrix(h0[j])} \\right) }^{K_j}
		    }{\\sqrt{${dk_int}}} \\right) \\cdot V_j
		    = ${weight.toFixed(nr_fixed)} \\cdot
		      ${toColPmatrix(Vi[j])}
		    = ${toColPmatrix(resultVec)}
		`.replace(/\s+/g, ' ');
				} else {
					cellEq = `${weight.toFixed(nr_fixed)} \\cdot ${toColPmatrix(Vi[j])} = ${toColPmatrix(resultVec)}`;
				}

				html += `<td style="border: 1px solid #3b82f6; padding: 12px; background: ${bgColor}; text-align: center;">$${cellEq}$</td>`;
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
	const injectedEncodings = [];

	let html = `<h3>Vector Injection (Inference Sequence)</h3>`;

	tokens.forEach((token, pos) => {
		const hash = token.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
		const semanticVec = Array.from({length: d_model}, (_, i) => 
			parseFloat(((Math.abs(hash * (i + 1)) % 1000) / 500 - 1).toFixed(nr_fixed))
		);

		const peVec = new Array(d_model);
		for (let i = 0; i < d_model; i += 2) {
			// FIXED: Correct exponentiation for the div_term
			const div_term = Math.pow(10000, i / d_model);
			
			peVec[i] = Math.sin(pos / div_term);
			if (i + 1 < d_model) {
				peVec[i + 1] = Math.cos(pos / div_term);
			}
		}

		const combined = semanticVec.map((val, i) => val + peVec[i]);
		injectedEncodings.push(combined);

		if (resultsContainer) {
			const displayCombined = combined.map(v => v.toFixed(nr_fixed));
			html += `
			<div style="margin-bottom: 10px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; background: #fff; overflow: auto;">
				<strong>Pos ${pos}: ${token}</strong>
				<table style="width:100%; font-family: monospace; font-size: 11px; margin-top: 5px;">
					<tr><td>PE (Sin/Cos)</td>${peVec.map(v => `<td>${v.toFixed(nr_fixed)}</td>`).join('')}</tr>
					<tr style="font-weight:bold;"><td>Combined</td>${displayCombined.map(v => `<td>${v}</td>`).join('')}</tr>
				</table>
			</div>`;
		}
	});

	if (resultsContainer) resultsContainer.innerHTML = html;
	return injectedEncodings;
}

function render_positional_waves(d_model, tokens) {
	const traces = [];
	const resolution = 0.1;
	const seqLen = tokens.length;
	// Ensure a minimum scale for visibility, but fit to tokens.length
	const maxPos = Math.max(1, seqLen); 

	for (let i = 0; i < d_model; i++) {
		let x = [], y = [];
		for (let p = 0; p <= maxPos; p += resolution) {
			// Frequency scaling logic
			let div_term = Math.pow(10000, (2 * (Math.floor(i/2))) / d_model);

			// NEW: Normalize the position 'p' relative to sequence length 
			// This 'stretches' the wave to fit the actual input tokens.
			const normalizedP = seqLen > 1 ? p / (seqLen - 1) : p;

			// We multiply by Math.PI to ensure at least half a wave cycle fits the length
			let val = ((i % 2 === 0)                            
				? Math.sin((normalizedP * Math.PI) / div_term)                            
				: Math.cos((normalizedP * Math.PI) / div_term)) * posEmbedScalar; // <--- Nudge reduziert

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
		title: 'Adaptive Sinusoidal Positional Waves',
		margin: { t: 40, b: 40, l: 40, r: 20 },
		xaxis: { title: 'Normalized Token Position' },
		yaxis: { title: 'PE Value', range: [-1.1, 1.1] }
	};

	Plotly.newPlot('transformer-pe-wave-plot', traces, layout);
}

function run_transformer_demo(activeId = null) {
    if (activeId) {
        window.lastActiveInputId = activeId;
    }

    const trainingInput = document.getElementById('transformer-training-data');
    const masterInput = document.getElementById('transformer-master-token-input');
    
    if (!trainingInput || !masterInput) return;

    // 1. Tokenisierung für die Logik (ohne UI-Render)
    const trainingTokens = transformer_tokenize_render(trainingInput.value, null);
    const masterTokens = transformer_tokenize_render(masterInput.value, null);

    // 2. Tokenisierung für die VISUELLE ANZEIGE (BPE-Box oben)
    // Wir rendern die Tokens des Feldes, das gerade bearbeitet wird
    const vizSourceValue = document.getElementById(window.lastActiveInputId).value;
    const vizTokens = transformer_tokenize_render(vizSourceValue, "transformer-viz-bpe");

    // 3. Netzwerk ausführen
    run_and_visualize_network(vizTokens, trainingTokens, masterTokens);
}

/**
 * FULL implementation of run_and_visualize_network
 */


/**
 * Origin: Ba et al. (2016) Layer Normalization
 * Goal: Initialize learnable parameters for stabilization
 */
function get_init_weights(n_layers, d_model) {
	const weights = [];
	const d_ff = d_model * 4;

	for (let n = 0; n < n_layers; n++) {
		weights.push({
			// Norm 1 (Pre-Attention)
			gamma: new Array(d_model).fill(1.0), 
			beta: new Array(d_model).fill(0.0),

			// Attention
			attention: {
				query: initWeights(d_model, d_model),
				key: initWeights(d_model, d_model),
				value: initWeights(d_model, d_model),
				output: initWeights(d_model, d_model)
			},

			// Norm 2 (Pre-FFN) -- NEW: Separate norm for the second block
			gamma2: new Array(d_model).fill(1.0), 
			beta2: new Array(d_model).fill(0.0),

			// Feed-Forward Network
			W1: initWeights(d_model, d_ff),
			b1: new Array(d_ff).fill(0),
			W2: initWeights(d_ff, d_model),
			b2: new Array(d_model).fill(0)
		});
	}
	return weights;
}

// Global state flag
window.isTraining = false;

async function train_transformer() {
	const btn = event.target; // Get the clicked button
	const status = document.getElementById('training-status');

	// Toggle logic
	if (window.isTraining) {
		window.isTraining = false;
		return; // Stop logic handled by the loop check
	}

	// Start Training State
	window.isTraining = true;
	btn.classList.add('active');
	btn.innerText = 'Stop Training';

	const lr = parseFloat(document.getElementById('train-lr').value) || 0.05;
	const epochs = parseInt(document.getElementById('train-epochs').value) || 500;
	const optType = document.getElementById('train-optimizer').value;
	const d_model = parseInt(document.getElementById('transformer-dimension-model').value);
	const n_layers = parseInt(document.getElementById('transformer-depth').value);

	let optimizer = optType === 'adam' ? tf.train.adam(lr) : 
		optType === 'rmsprop' ? tf.train.rmsprop(lr) : tf.train.sgd(lr);

	const trainingData = document.getElementById('transformer-training-data').value;
	const tokens = transformer_tokenize_render(trainingData, null);

	if(tokens.length == 0) {
		window.isTraining = false;
		btn.classList.remove('active');
		btn.innerText = 'Train Model';
		return;
	}

	if (!window.currentWeights) window.currentWeights = get_init_weights(n_layers, d_model);
	get_or_init_embeddings(tokens, d_model);

	const weightVars = convert_weights_to_tensors(window.currentWeights);

	for (let i = 0; i < epochs; i++) {
		// BREAK if user toggled the button
		if (!window.isTraining) break;

		const cost = optimizer.minimize(() => {
			return tf.tidy(() => calculate_tf_loss(tokens, weightVars, d_model, n_layers));
		}, true);

		const lossValue = await cost.data();
		window.lossHistory.push(lossValue[0]);

		if (i % 25 === 0 || i === epochs - 1) {
			window.currentWeights = await convert_tensors_to_weights(weightVars);
			status.innerText = `Epoch ${i}: Loss = ${lossValue[0].toFixed(6)}`;
			renderLossGraph();
			run_transformer_demo(); 
			await tf.nextFrame();
		}
		cost.dispose();
	}

	// Reset UI State after finish or stop
	window.isTraining = false;
	btn.classList.remove('active');
	btn.innerText = 'Train Model';
	status.innerText += window.isTraining ? " Training Complete!" : " Training Stopped.";
}

function convert_weights_to_tensors(weights) {
	const vocab = Object.keys(window.persistentEmbeddingSpace);
	const embMatrix = vocab.map(word => window.persistentEmbeddingSpace[word]);

	const vars = {
		layers: weights.map(layer => ({
			// Attention Weights
			wq: tf.variable(tf.tensor2d(layer.attention.query)),
			wk: tf.variable(tf.tensor2d(layer.attention.key)),
			wv: tf.variable(tf.tensor2d(layer.attention.value)),
			wo: tf.variable(tf.tensor2d(layer.attention.output)),

			// Layer Norm 1 Parameters
			gamma: tf.variable(tf.tensor1d(layer.gamma)),
			beta: tf.variable(tf.tensor1d(layer.beta)),

			// Layer Norm 2 Parameters (NEW)
			gamma2: tf.variable(tf.tensor1d(layer.gamma2 || new Array(layer.gamma.length).fill(1.0))),
			beta2: tf.variable(tf.tensor1d(layer.beta2 || new Array(layer.beta.length).fill(0.0))),

			// FFN Weights
			w1: tf.variable(tf.tensor2d(layer.W1)),
			b1: tf.variable(tf.tensor1d(layer.b1)),
			w2: tf.variable(tf.tensor2d(layer.W2)),
			b2: tf.variable(tf.tensor1d(layer.b2))
		})),
		embeddings: tf.variable(tf.tensor2d(embMatrix)),
		vocab_map: vocab
	};
	return vars;
}

function calculate_tf_loss(tokens, vars, d_model, n_layers) {
	const losses = [];
	const thiscontextSize = Math.min(contextSize, tokens.length - 1);

	const mask = tf.tidy(() => {
		const ones = tf.ones([thiscontextSize, thiscontextSize]);
		const upperTriangle = tf.linalg.bandPart(ones, 0, -1); 
		const diagonal = tf.linalg.bandPart(ones, 0, 0);
		return tf.sub(upperTriangle, diagonal).mul(tf.scalar(1e9)); // Large negative mask
	});

	for (let startIdx = 0; startIdx < tokens.length - thiscontextSize; startIdx++) {
		const inputIds = tokens.slice(startIdx, startIdx + thiscontextSize)
			.map(t => vars.vocab_map.indexOf(t));
		const targetId = vars.vocab_map.indexOf(tokens[startIdx + thiscontextSize]);

		let x = tf.gather(vars.embeddings, tf.tensor1d(inputIds, 'int32'));

		// PE Injection matching UI logic
		const peTensor = tf.tidy(() => {
			const pos = tf.range(0, inputIds.length, 1).reshape([inputIds.length, 1]);
			const i = tf.range(0, d_model, 1).reshape([1, d_model]);
			const divTerm = tf.pow(tf.scalar(10000), i.div(tf.scalar(2)).floor().mul(tf.scalar(2)).div(tf.scalar(d_model)));
			const args = pos.div(divTerm);
			return tf.where(i.mod(tf.scalar(2)).equal(tf.scalar(0)), tf.sin(args), tf.cos(args)).mul(tf.scalar(posEmbedScalar));
		});
		x = tf.add(x, peTensor);

		for (let i = 0; i < n_layers; i++) {
			const l = vars.layers[i];
			// Attention Block
			let normX = tf_layer_norm(x, l.gamma, l.beta);
			const q = tf.matMul(normX, l.wq);
			const k = tf.matMul(normX, l.wk);
			const v = tf.matMul(normX, l.wv);
			let scores = tf.matMul(q, k.transpose()).div(tf.sqrt(tf.scalar(d_model)));
			scores = tf.sub(scores, mask); 
			const weights = tf.softmax(scores);
			x = tf.add(x, tf.matMul(tf.matMul(weights, v), l.wo));

			// FFN Block
			let normX2 = tf_layer_norm(x, l.gamma2, l.beta2);
			let ffn = tf.relu(tf.add(tf.matMul(normX2, l.w1), l.b1));
			ffn = tf.add(tf.matMul(ffn, l.w2), l.b2);
			x = tf.add(x, ffn);
		}

		// Project last token hidden state to Vocabulary
		const lastTokenVector = x.slice([thiscontextSize - 1, 0], [1, d_model]);
		const logits = tf.matMul(lastTokenVector, vars.embeddings.transpose());
		const label = tf.oneHot(tf.tensor1d([targetId], 'int32'), vars.vocab_map.length);

		losses.push(tf.losses.softmaxCrossEntropy(label, logits));
	}
	return tf.addN(losses).div(tf.scalar(losses.length));
}

async function convert_tensors_to_weights(vars) {
	const newWeights = []; 
	for (const layer of vars.layers) {
		newWeights.push({
			attention: {
				query: (await layer.wq.array()),
				key: (await layer.wk.array()),
				value: (await layer.wv.array()),
				output: (await layer.wo.array())
			},
			// CRITICAL FIX: Explicitly await FFN and Norm 2 parameters
			W1: await layer.w1.array(), 
			b1: await layer.b1.array(),
			W2: await layer.w2.array(),
			b2: await layer.b2.array(),
			gamma: await layer.gamma.array(),
			beta: await layer.beta.array(),
			gamma2: await layer.gamma2.array(),
			beta2: await layer.beta2.array()
		});
	}

	// Sync embeddings back to the global persistent space
	const embArray = await vars.embeddings.array();
	vars.vocab_map.forEach((word, i) => {
		window.persistentEmbeddingSpace[word] = embArray[i];
	});

	return newWeights;
}

/**
 * NEW Helper: Calculate Cross-Entropy Loss over the corpus
 * Strategy: Predict next token for a random window in the text
 */
function calculate_corpus_loss(tokens, weights, d_model, n_layers) {
	// Optimization: Don't calculate loss on the *entire* text every epoch (too slow).
	// Pick a random window of context size 3-5.
	// Pick a random start index ensuring we have a 'next' token
	const startIdx = 0;
	const endIdx = Math.min(startIdx + contextSize, tokens.length - 1);

	const contextTokens = tokens.slice(startIdx, endIdx);
	const targetToken = tokens[endIdx]; // The token coming AFTER the context

	// 1. Run Forward Pass
	// We use a simplified forward pass that returns just the final hidden state
	// Note: We use the existing logic but stripped down for speed

	// a. Embeddings + PE
	const space = window.persistentEmbeddingSpace;
	let h = contextTokens.map((t, pos) => {
		const emb = space[t] || Array(d_model).fill(0);
		// Add simple PE (re-calculating PE here is fast enough)
		const pe = new Array(d_model).fill(0);
		for (let i = 0; i < d_model; i++) {
			let div = Math.pow(10000, (2 * Math.floor(i / 2)) / d_model);
			pe[i] = (i % 2 === 0) ? Math.sin(pos / div) : Math.cos(pos / div);
		}
		return emb.map((v, i) => v + pe[i]);
	});

	// b. Layers
	const n_heads = weights[0].attention.query.length > 0 ? 
		weights[0].attention.query.length / (d_model/weights[0].attention.query.length) : 2; // heuristic

	// Use the existing run_deep_layers logic but with provided weights
	// We need to adapt run_deep_layers to accept custom weights easily or reimplement the loop here.
	// For speed/stability in this "fake" trainer, we reimplement the core loop:

	for(let l=0; l<n_layers; l++) {
		const w = weights[l];
		// Simplified Attention (assuming 1 head for loss calc speed or implementing full logic?)
		// To reuse code, we instantiate the engine. This is slower but correct.
		const engine = new AttentionEngine({ d_model: d_model, n_heads: 2, containerId: null, weights: w.attention });
		const headData = engine.forward(h, contextTokens);

		// Concatenate
		const concat = contextTokens.map((_, tIdx) => [].concat(...headData.map(hd => hd.context[tIdx])));

		// Post-LN
		const h1 = get_h1(h, concat, w.gamma, w.beta);

		// FFN
		h = run_ffn_block(h1, w);
	}

	const h_final = h[h.length - 1]; // Last token's hidden state

	// 2. Project to Vocabulary (Logits)
	// We only care about the target token's probability vs the others.
	// In a real generic transformer, we project to ALL tokens.
	const vocab = [...new Set(tokens)];

	// To save time, we calculate logits for the Target and a few random Negatives
	// (Sampled Softmax) - but for small demos, full softmax is fine.

	let maxLogit = -Infinity;
	const logits = vocab.map(word => {
		// Re-generate fixed vocab weight on the fly (same seed logic as render_final_projection)
		const hash = word.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
		const w_row = Array.from({ length: d_model }, (_, i) => {
			const seed = Math.abs(hash * (i + 13));
			return ((seed % 2000) / 1000) - 1;
		});

		const val = h_final.reduce((sum, v, i) => sum + v * w_row[i], 0);
		if(val > maxLogit) maxLogit = val;
		return { word, val };
	});

	// 3. Softmax & Loss
	// P(target) = exp(target_logit) / sum(exp(logits))
	// Loss = -log(P(target)) = -target_logit + log(sum(exp(logits)))

	const targetLogitObj = logits.find(x => x.word === targetToken);
	if (!targetLogitObj) return 10; // High loss if something broke

	let sumExp = 0;
	logits.forEach(l => {
		sumExp += Math.exp(l.val - maxLogit); // stability shift
	});

	const logSumExp = maxLogit + Math.log(sumExp);
	const loss = -targetLogitObj.val + logSumExp;

	return Math.max(0, loss); // ensure non-negative
}

function renderLossGraph() {
	const trace = {
		x: Array.from({length: window.lossHistory.length}, (_, i) => i),
		y: window.lossHistory,
		type: 'scatter',
		mode: 'lines',
		line: { color: '#10b981', width: 2 },
		fill: 'tozeroy'
	};

	const layout = {
		title: { text: 'Training Loss', font: { size: 12 } },
		margin: { t: 30, b: 30, l: 40, r: 10 },
		xaxis: { title: 'Total Epochs' },
		yaxis: { title: 'Loss' }
	};

	document.getElementById('training-loss-plot').style.display = 'block';

	Plotly.newPlot('training-loss-plot', [trace], layout);
}

function run_and_visualize_network(inputTokens, trainingTokens, masterTokens) {
	const dimSlider = document.getElementById('transformer-dimension-model');
	const d_model = parseInt(dimSlider.value);
	const headSlider = document.getElementById('transformer-heads');
	const n_heads = parseInt(headSlider.value);
	const tempSlider = document.getElementById('transformer-temperature');
	const temperature = parseFloat(tempSlider.value);
	const depthSlider = document.getElementById('transformer-depth');
	const n_layers = parseInt(depthSlider.value);

	const vocabulary = [...new Set(trainingTokens)];
	const knownTokens = inputTokens.filter(token => vocabulary.includes(token));

	if (d_model % n_heads !== 0) {
		console.warn(`Incompatible Dimensions: d_model (${d_model}) must be divisible by n_heads (${n_heads}).`);
	}

	const needsReinit = !window.currentWeights ||
		window.currentWeights.length !== n_layers ||
		window.last_d_model !== d_model ||
		window.last_n_heads !== n_heads;

	if (needsReinit) {
		window.currentWeights = get_init_weights(n_layers, d_model);
		window.last_d_model = d_model;
		window.last_n_heads = n_heads;
		reset_graph();
	}
	const weights = window.currentWeights;

	// 1. Embedding Space
	window.persistentEmbeddingSpace = get_or_init_embeddings(trainingTokens, d_model);
	render_embedding_plot(d_model);

	// 2. Visualizations
	tokensWithPositional = calculate_positional_injection(knownTokens, d_model);
	render_positional_waves(d_model, knownTokens);

	const h0 = render_positional_shift_plot(knownTokens, d_model);

	render_architecture_stats(d_model, n_heads, n_layers, temperature);

	if (tokensWithPositional.length === 0) {
		document.getElementById('transformer-output-projection').innerHTML =
			`<div style="padding:20px; color: #64748b; text-align:center;">
		Input words not found in Training Data.
	     </div>`;
	} else {
		// Fix #6: Pre-LN — normalize h0 BEFORE attention (matching training)
		const normH0 = calculateLayerNorm(h0, weights[0]["gamma"], weights[0]["beta"]);

		const engine = new AttentionEngine({
			d_model: d_model,
			n_heads: n_heads,
			containerId: "mha-calculation-details",
			weights: weights[0]["attention"]
		});

		const headData = engine.forward(normH0, tokensWithPositional);
		const multiHeadOutput = updateConcatenationDisplay(headData, tokensWithPositional);

		// Fix #5: Apply Wo (output projection), matching training's tf.matMul(..., l.wo)
		const Wo_layer0 = weights[0]["attention"]["output"];
		const projected = multiHeadOutput.map(row =>
			Wo_layer0[0].map((_, j) => row.reduce((sum, val, k) => sum + val * Wo_layer0[k][j], 0))
		);

		// Residual connection: h1 = h0 + projected (Pre-LN already applied before attention)
		const h1 = h0.map((row, i) => row.map((val, j) => val + projected[i][j]));

		if (typeof render_h1_logic === "function") {
			render_h1_logic(h0, multiHeadOutput, weights[0]["gamma"], weights[0]["beta"], weights[0]["attention"]["output"]);
		}

		const h2 = run_ffn_block(h1, weights[0]);
		run_deep_layers(h2, tokensWithPositional, n_layers, d_model, n_heads, weights);
	}

	// 3. FINAL PROBABILITIES (based on master-token-input)
	const knownMasterTokens = masterTokens.filter(token => vocabulary.includes(token));

	if (knownMasterTokens.length > 0) {
		let h_master = knownMasterTokens.map((t, pos) => {
			const emb = window.persistentEmbeddingSpace[t] || new Array(d_model).fill(0);
			const pe = new Array(d_model).fill(0);
			for (let i = 0; i < d_model; i++) {
				let div = Math.pow(10000, (2 * Math.floor(i / 2)) / d_model);
				pe[i] = (i % 2 === 0) ? Math.sin(pos / div) : Math.cos(pos / div);
			}
			return emb.map((v, i) => v + pe[i]);
		});

		let h_current = h_master;
		for (let l = 0; l < n_layers; l++) {
			const layerWeights = weights[l];

			// Fix #6: Pre-LN — normalize BEFORE attention (matching training)
			const normH = calculateLayerNorm(h_current, layerWeights["gamma"], layerWeights["beta"]);

			const attnEngine = new AttentionEngine({ d_model, n_heads, containerId: null, weights: layerWeights["attention"] });
			const headData = attnEngine.forward(normH, knownMasterTokens);

			const concat = knownMasterTokens.map((_, tIdx) => [].concat(...headData.map(hd => hd.context[tIdx])));

			// Fix #5: Apply Wo (output projection)
			const Wo = layerWeights["attention"]["output"];
			const projected = concat.map(row =>
				Wo[0].map((_, j) => row.reduce((sum, val, k) => sum + val * Wo[k][j], 0))
			);

			// Residual connection (Pre-LN: no additional norm here)
			const h_attn = h_current.map((row, i) => row.map((val, j) => val + projected[i][j]));

			h_current = run_ffn_block(h_attn, layerWeights);
		}

		if (typeof render_final_projection === "function") {
			render_final_projection(h_current, vocabulary, d_model, temperature);
		}
	}
}

window.select_suggested_word = (word) => {
	const masterInput = document.getElementById('transformer-master-token-input');
	masterInput.value += " " + word;

	// Set master as active and re-run
	run_transformer_demo('transformer-master-token-input');
};

function render_final_projection(h_final, vocabulary, d_model, temperature) {
	const container = document.getElementById('transformer-output-projection');
	if (!container) return;

	const lastIdx = h_final.length - 1;
	const h_last = h_final[lastIdx];

	// Use learned embeddings for projection [cite: 24]
	const W_vocab = vocabulary.map(word => window.persistentEmbeddingSpace[word] || new Array(d_model).fill(0));

	const logits = vocabulary.map((word, i) => {
		const w_row = W_vocab[i];
		const val = h_last.reduce((sum, h_val, dim) => sum + h_val * w_row[dim], 0);
		return { word, val, w_row };
	});

	const scaledLogits = logits.map(item => item.val / temperature);
	const maxLogit = Math.max(...scaledLogits);
	const exps = scaledLogits.map(val => Math.exp(val - maxLogit));
	const sumExps = exps.reduce((a, b) => a + b, 0);
	const predictions = logits.map((item, i) => ({
		word: item.word,
		prob: exps[i] / sumExps,
		logit: item.val
	})).sort((a, b) => b.prob - a.prob);

	// Build the restored chip-based results interface [cite: 25]
	let html = `<h3>2. Final Probabilities (Click to Generate)</h3>`;
	html += `<div class="prediction-chip-container" style="display:flex; flex-wrap:wrap; gap:10px;">`;
	predictions.forEach(p => {
		const intensity = Math.min(1, p.prob * 5); 
		html += `<button class="predict-chip" onclick="select_suggested_word('${p.word}')" 
		style="background:rgba(59, 130, 246, ${intensity}); padding:8px 15px; border-radius:20px; border:1px solid #3b82f6; cursor:pointer; color: ${p.prob > 0.4 ? 'white' : 'black'}">
		<strong>${p.word}</strong> (${(p.prob * 100).toFixed(1)}%)
		</button>`;
	});
	html += `</div>`;

	container.innerHTML = html;
}

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

function render_architecture_stats(d, h, n, t) {
	const statsContainerName = 'transformer-temperature-config';
	const statsContainer = document.getElementById(statsContainerName);
	if (!statsContainer) {
		console.error(`render_architecture_stats: ${statsContainerName} not found`);
		return;
	}

	const dv = (d / h).toFixed(nr_fixed);
	const infoHtml = `
	<div style="background: #e0f2fe; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 0.9rem;">
	    <strong>Configuration:</strong> $d_{v} = ${dv}$, $N = ${n}$, $T = ${t}$ <br>
	    <em>Note: $T > 1.0$ increases randomness (flattens SoftMax), $T < 1.0$ makes predictions more confident.</em>
	</div>
    `;
	statsContainer.innerHTML = infoHtml;
}

function create_migration_plot(id, tokens, start_h, end_h, layerNum, d_model) {
	const container = document.getElementById('transformer-migration-plots-container');
	let plotDiv = document.getElementById(id);
	if (!plotDiv) {
		plotDiv = document.createElement('div');
		plotDiv.id = id;
		plotDiv.style.cssText = "height: 500px; width: 100%; margin-top: 30px;";
		container.appendChild(plotDiv);
	}

	if (d_model <= 3) {
		const traces = [];
		tokens.forEach((token, i) => {
			const x = [start_h[i][0], end_h[i][0]];
			const y = d_model >= 2 ? [start_h[i][1], end_h[i][1]] : [0, 0];
			const z = d_model === 3 ? [start_h[i][2], end_h[i][2]] : [0, 0];

			if (d_model === 3) {
				traces.push({
					type: 'scatter3d', x: x, y: y, z: z, mode: 'lines',
					line: { width: 4 }, name: token, showlegend: false
				});
				traces.push({
					type: 'cone', x: [x[1]], y: [y[1]], z: [z[1]],
					u: [x[1] - x[0]], v: [y[1] - y[0]], w: [z[1] - z[0]],
					sizemode: 'absolute', sizeref: 0.15, anchor: 'tip',
					colorscale: [[0, '#10b981'], [1, '#10b981']], showscale: false
				});
			} else {
				traces.push({
					type: 'scatter', x: x, y: y, mode: 'lines+markers',
					name: token, line: { width: 2 },
					marker: { size: [0, 12], symbol: 'arrow', angleref: 'previous' }
				});
			}
		});
		Plotly.newPlot(id, traces, { title: `Layer ${layerNum}: Feature Migration` });
	} else {
		if (typeof echarts === 'undefined') return;
		Plotly.purge(plotDiv);
		const myChart = echarts.init(plotDiv);
		const axes = [];
		for (let i = 0; i < d_model; i++) {
			axes.push({ dim: i * 2, name: `D${i} Pre` }, { dim: i * 2 + 1, name: `D${i} Post` });
		}
		const data = tokens.map((token, tIdx) => ({
			value: start_h[tIdx].flatMap((val, i) => [val, end_h[tIdx][i]]),
			name: token
		}));
		myChart.setOption({
			title: { text: `Layer ${layerNum} Migration`, left: 'center' },
			tooltip: { trigger: 'item', formatter: p => `Token: <b>${p.name}</b>` },
			parallelAxis: axes,
			series: [{
				type: 'parallel', data: data,
				lineStyle: { width: 1.5, opacity: 0.3, color: '#10b981' },
				emphasis: { lineStyle: { width: 5, color: '#ef4444' } }
			}]
		});
	}
}

function render_embedding_plot(dimensions) {
	const container = document.getElementById('transformer-plotly-space');
	if (!container) return;

	const tokens = Object.keys(window.persistentEmbeddingSpace);

	if (dimensions <= 3) {
		const traces = tokens.map(token => {
			const vec = window.persistentEmbeddingSpace[token];
			return {
				type: dimensions === 3 ? 'scatter3d' : 'scatter',
				x: [vec[0]], 
				y: [dimensions >= 2 ? vec[1] : 0], 
				z: [dimensions === 3 ? vec[2] : 0],
				mode: 'markers+text', 
				text: [token], 
				name: token, 
				marker: { size: 10 }
			};
		});
		Plotly.newPlot(container, traces, { title: "Embedding Space" });
	} else {
		if (typeof echarts === 'undefined') return;
		Plotly.purge(container);

		const myChart = echarts.init(container);
		const parallelAxis = Array.from({ length: dimensions }, (_, i) => ({ dim: i, name: `D${i}` }));

		const data = tokens.map(token => ({
			name: token,
			value: window.persistentEmbeddingSpace[token]
		}));

		myChart.setOption({
			tooltip: { trigger: 'item', formatter: p => `Token: <b>${p.name}</b>` },
			parallelAxis: parallelAxis,
			parallel: { left: 40, right: 40, bottom: 20, top: 50 },
			series: [{ 
				type: 'parallel', 
				data: data, 
				lineStyle: { width: 2, opacity: 0.5, color: '#6366f1' },
				emphasis: { lineStyle: { width: 6, color: '#f59e0b' } } 
			}]
		});
	}
}

// Updated Tokenizer to allow different containers
function transformer_tokenize_render(text, containerId = "transformer-viz-bpe") {
	const container = document.getElementById(containerId);

	const typeElement = document.getElementById('transformer-tokenizer-type');
	const type = typeElement ? typeElement.value : 'regex';

	let tokens = [];
	const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""); // `
	const words = cleanText.split(/\s+/);

	if (type === 'bpe') {
		// Character-level / Subword Split: 
		// We split by words first, then break long words into chunks to simulate BPE behavior
		const words = text.match(/\S+|\s+/g) || [];
		tokens = words.flatMap(word => {
			if (word.length > 4) {
				// Split long words into chunks of 3 for demonstration
				return word.match(/.{1,3}/g);
			}
			return word;
		});
	} else {
		// Standard Regex Word Split: 
		// Matches sequences of alphanumeric characters or single non-alphanumeric characters
		tokens = text.match(/[\w]+|[^\w\s]/g) || [];
	}

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

function render_h1_logic(h0, multiHeadOutput, gamma, beta, WO) {
	const normContainer = document.getElementById('transformer-h1-layernorm-viz');
	const finalContainer = document.getElementById('transformer-h1-final-viz');
	if (!normContainer || !finalContainer || !gamma || !beta || !WO) return;

	const matrixToPmatrix = (matrix) =>
		`\\begin{pmatrix} ` + matrix.map(row => row.map(v => v.toFixed(nr_fixed)).join(' & ')).join(' \\\\ ') + ` \\end{pmatrix}`;

	const vecToPmatrix = (vec) =>
		`\\begin{pmatrix} ${vec.map(v => v.toFixed(nr_fixed)).join(' & ')} \\end{pmatrix}`;

	// 0. Project the Multi-Head Output using WO (Linear Transformation)
	const projectedMHA = multiHeadOutput.map(row => 
		WO[0].map((_, i) => row.reduce((acc, _, j) => acc + row[j] * WO[j][i], 0))
	);

	const eps = 1e-5;
	const means = [];
	const variances = [];
	const meanCalcs = []; 
	const varCalcs = [];  

	// Apply LayerNorm to the PROJECTED output
	const standardized = projectedMHA.map(row => {
		const n = row.length;
		const sum = row.reduce((a, b) => a + b, 0);
		const mean = sum / n;

		const sumSqDiff = row.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
		const variance = sumSqDiff / n;

		means.push(mean);
		variances.push(variance);
		meanCalcs.push(`\\frac{${sum.toFixed(nr_fixed)}}{${n}}`);
		varCalcs.push(`\\frac{${sumSqDiff.toFixed(nr_fixed)}}{${n}}`);

		return row.map(val => (val - mean) / Math.sqrt(variance + eps));
	});

	const normMH = standardized.map(row =>
		row.map((val, j) => val * gamma[j] + beta[j])
	);

	const h1 = h0.map((row, i) => row.map((val, j) => val + normMH[i][j]));

	normContainer.innerHTML = `
    <div style="margin-bottom:20px; padding:15px; border:1px solid #3b82f6; border-radius:8px; background:#f0f9ff;">
	<p style="font-size:0.85rem; color:#1e40af;">Transformation to mix information across attention heads:</p>
	$$ \\text{MHA}_\\text{proj} = \\text{Concat}(\\text{Heads}) \\cdot W^O $$
	<div style="overflow-x:auto;">
	    $$ ${matrixToPmatrix(projectedMHA)} = ${matrixToPmatrix(multiHeadOutput)} \\cdot ${matrixToPmatrix(WO)} $$
	</div>
    </div>

    <div style="margin-bottom:10px;">
	1. Calculate Row-wise Mean ($\\mu$) and Variance ($\\sigma^2$) on $\\text{MHA}_\\text{proj}$:
	$$ \\vec{\\mu} = ${vecToPmatrix(means)}^T, \\quad \\vec{\\sigma}^2 = ${vecToPmatrix(variances)}^T $$
    </div>
    <div style="margin-bottom:10px;">
	2. Standardize ($\\hat{x} = \\frac{x - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}}$):
	$$ \\hat{x} = ${matrixToPmatrix(standardized)} $$
    </div>
    <div style="margin-bottom:10px;">
	3. Scale and Shift:
	$$ \\text{LayerNorm}(\\text{MHA}_\\text{proj}) = \\gamma \\odot \\hat{x} + \\beta $$
    </div>
    $$ \\underbrace{${matrixToPmatrix(normMH)}}_{\\text{Result}} =
       \\underbrace{${vecToPmatrix(gamma)}}_{\\gamma} \\odot
       \\underbrace{${matrixToPmatrix(standardized)}}_{\\hat{x}} +
       \\underbrace{${vecToPmatrix(beta)}}_{\\beta} $$
    `;

	finalContainer.innerHTML = `
    <div style="margin-bottom:10px;">$$ h_1 = h_0 + \\text{LayerNorm}(\\text{MHA}_\\text{proj}) $$</div>
    <div style="overflow-x:auto;">
	$$ ${matrixToPmatrix(h1)} = \\underbrace{${matrixToPmatrix(h0)}}_{h_0} + \\underbrace{${matrixToPmatrix(normMH)}}_{\\text{LayerNorm}} $$
    </div>
    `;

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
			matrix.map(row => row.map(v => v.toFixed(nr_fixed)).join(' & ')).join(' \\\\ ') + 
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

function calculateLayerNorm(matrix, gamma, beta) {
	const eps = 1e-5;
	return matrix.map(row => {
		const mean = row.reduce((a, b) => a + b, 0) / row.length;
		const variance = row.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / row.length;

		return row.map((val, i) => {
			const standardized = (val - mean) / Math.sqrt(variance + eps);
			return standardized * gamma[i] + beta[i];
		});
	});
}

/**
 * Goal: Calculate h1 = h0 + LayerNorm(MultiHead(h0))
 * Note: This implements the "Post-LN" architecture.
 */
function get_h1(h0, multiHeadOutput, gamma, beta) {
	// 1. Apply LayerNorm to the Multi-Head output
	const normMH = calculateLayerNorm(multiHeadOutput, gamma, beta);

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

function assert_or_init(name, value, expected_rows, expected_cols) {
        try {
                validateShape(name, value, expected_rows, expected_cols);
                return value;
        } catch (err) {
                throw new Error(
                        `${name} has invalid shape. Expected ${expected_rows}x${expected_cols}.`
                );
        }
}

/**
 * FFN Block mit optionalen Gewichten und Biases
 * @param {Array} h1 - Input Hidden State
 * @param {Object} params - {W1, b1, W2, b2} (optional)
 */
/**
 * Goal: Execute FFN with concrete Gamma/Beta for visualization
 * Origin: Vaswani et al. (2017)
 */
function run_ffn_block(h1, params = {}) {
	const d_model = h1[0].length;
	const d_ff = d_model * 4;

	let W1 = assert_or_init('W1', params.W1, d_model, d_ff);
	let b1 = assert_or_init('b1', params.b1, d_ff, 1);
	let W2 = assert_or_init('W2', params.W2, d_ff, d_model);
	let b2 = assert_or_init('b2', params.b2, d_model, 1);
	// Fix #7: Use gamma2/beta2 (the FFN's own LayerNorm params, not attention's)
	let gamma2 = params.gamma2 || new Array(d_model).fill(1.0);
	let beta2 = params.beta2 || new Array(d_model).fill(0.0);

	// Fix #7: Pre-LN — normalize h1 BEFORE FFN (matching training's tf_layer_norm(x, l.gamma2, l.beta2))
	const normed_h1 = calculateLayerNorm(h1, gamma2, beta2);

	const out_L1 = normed_h1.map(row => {
		return b1.map((bias, j) => {
			let sum = bias;
			for (let i = 0; i < d_model; i++) sum += row[i] * W1[i][j];
			return Math.max(0, sum);
		});
	});

	const out_FFN = out_L1.map(row => {
		return b2.map((bias, j) => {
			let sum = bias;
			for (let i = 0; i < d_ff; i++) sum += row[i] * W2[i][j];
			return sum;
		});
	});

	// Fix #7: Residual — h2 = h1 + FFN(normed_h1), NO post-norm on output
	// (matching training's: x = tf.add(x, ffn))
	const h2 = h1.map((row, i) => row.map((val, j) => val + out_FFN[i][j]));

	// Visualization (now passing correct gamma2/beta2 for display)
	render_ffn_absolute_full(h1, W1, b1, out_L1, W2, b2, out_FFN, h2, gamma2, beta2);

	return h2;
}


/**
 * Erzeugt LaTeX-Output für Matrizen ohne Limitierungen.
 */
/**
 * Goal: Show FFN LayerNorm parameters
 */
/**
 * Goal: Full FFN derivation with concrete LayerNorm weights
 * Origin: Vaswani et al. (2017)
 */
function render_ffn_absolute_full(h1, W1, b1, out_L1, W2, b2, out_FFN, h2, gamma, beta) {
	const rawMP = (m) => `\\begin{pmatrix} ${m.map(r => r.map(v => v.toFixed(nr_fixed)).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
	const rawVP = (v) => `\\begin{pmatrix} ${v.map(val => val.toFixed(nr_fixed)).join(' & ')} \\end{pmatrix}`;

	const eps = 1e-5;
	const stdFFN = out_FFN.map(row => {
		const mean = row.reduce((a, b) => a + b, 0) / row.length;
		const variance = row.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / row.length;
		return row.map(val => (val - mean) / Math.sqrt(variance + eps));
	});

	document.getElementById('ffn-step-1').innerHTML = `
	$$ \\text{out}_{L1} = \\text{ReLU}(h_1 W_1 + b_1) = ${rawMP(out_L1)} $$
    `;

	document.getElementById('ffn-step-2').innerHTML = `
	$$ \\text{out}_{L2} = \\text{out}_{L1} W_2 + b_2 = ${rawMP(out_FFN)} $$
    `;

	document.getElementById('ffn-step-3').innerHTML = `
	<div style="margin-bottom:10px;">$$ h_2 = h_1 + (\\gamma_\\text{ffn} \\odot \\text{std}(\\text{out}_{L2}) + \\beta_\\text{ffn}) $$</div>
	$$ ${rawMP(h2)} = ${rawMP(h1)} + \\left( \\underbrace{${rawVP(gamma)}}_{\\gamma} \\odot ${rawMP(stdFFN)} + \\underbrace{${rawVP(beta)}}_{\\beta} \\right) $$
    `;

	if (typeof render_temml === "function") render_temml();
}

/**
 * Goal: Unified N-Layer Trajectory Plotting
 * Logic: Every iteration i maps to Layer i+1 Plot
 */
function run_deep_layers(h_initial, tokens, total_depth, d_model, n_heads, this_weights) {
	let h_current = h_initial;

	for (let n = 0; n < total_depth; n++) {
		const h_before_layer = JSON.parse(JSON.stringify(h_current));
		const layerWeights = this_weights[n];

		// Fix #6: Pre-LN — normalize BEFORE attention (matching training)
		const normH = calculateLayerNorm(h_current, layerWeights["gamma"], layerWeights["beta"]);

		// 1. Sublayer 1: Attention (on normalized input)
		const engine = new AttentionEngine({ 
			d_model, 
			n_heads, 
			containerId: (n === 0) ? "mha-calculation-details" : null,
			weights: layerWeights["attention"]
		});

		const headData = engine.forward(normH, tokens);
		const concatOutput = tokens.map((_, tIdx) => [].concat(...headData.map(h => h.context[tIdx])));

		// Fix #5: Apply Wo (output projection), matching training's tf.matMul(..., l.wo)
		const Wo = layerWeights["attention"]["output"];
		const projected = concatOutput.map(row =>
			Wo[0].map((_, j) => row.reduce((sum, val, k) => sum + val * Wo[k][j], 0))
		);

		// 2. Residual connection (Pre-LN: no additional norm here)
		const h_attn = h_current.map((row, i) => row.map((val, j) => val + projected[i][j]));

		// 3. Sublayer 2: Feed Forward & Add & Norm
		const h_after = run_ffn_block(h_attn, layerWeights);

		// Visualization
		create_migration_plot(`migration-layer-${n+1}`, tokens, h_before_layer, h_after, n + 1, d_model);
		
		h_current = h_after;
	}
	return h_current;
}


/**
 * Global Registry for Deferred Rendering
 * Stores the latest data for each plot ID to ensure that when it 
 * becomes visible, it renders with the most recent calculation.
 */
const transformerLabVisMigrationDataRegistry = new Map();

/**
 * Intersection Observer for Lazy Rendering
 */
const migrationObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			const id = entry.target.id;
			const data = transformerLabVisMigrationDataRegistry.get(id);
			if (data && !data.rendered) {
				// Execute the actual heavy rendering
				render_migration_logic(id, data.tokens, data.start_h, data.end_h, data.layerNum, data.d_model);
				data.rendered = true; // Mark to avoid redundant draws until data changes
			}
		}
	});
}, { threshold: 0.1 });

/**
 * Optimized migration plot creation.
 * Removed manual layout triggers (getBoundingClientRect) and slow deep-cloning.
 */
function create_migration_plot(id, tokens, start_h, end_h, layerNum, d_model) {
	const container = document.getElementById('transformer-migration-plots-container');
	if (!container) return;

	let plotDiv = document.getElementById(id);
	if (!plotDiv) {
		plotDiv = document.createElement('div');
		plotDiv.id = id;
		plotDiv.style.cssText = "height: 500px; width: 100%; margin-top: 30px;";
		container.appendChild(plotDiv);

		// The observer handles the initial visibility check automatically 
		// as soon as it starts observing, firing the callback if visible.
		migrationObserver.observe(plotDiv);
	}

	// Optimization: Use .slice() or Float32Array.from() if start_h/end_h are numeric arrays.
	// JSON stringify/parse is a major CPU sink for high-dimensional vectors.
	transformerLabVisMigrationDataRegistry.set(id, {
		tokens: [...tokens], 
		start_h: Array.isArray(start_h) ? start_h.slice() : start_h,
		end_h: Array.isArray(end_h) ? end_h.slice() : end_h,
		layerNum,
		d_model,
		rendered: false 
	});

	// NOTE: Removed getBoundingClientRect(). 
	// If the element is visible, the IntersectionObserver attached above 
	// will trigger its callback in the next microtask.
}


/**
 * Extracted rendering logic (The original create_migration_plot body)
 */
function render_migration_logic(id, tokens, start_h, end_h, layerNum, d_model) {
	const plotDiv = document.getElementById(id);
	if (!plotDiv) return;

	if (d_model <= 3) {
		const traces = [];
		tokens.forEach((token, i) => {
			const x = [start_h[i][0], end_h[i][0]];
			const y = d_model >= 2 ? [start_h[i][1], end_h[i][1]] : [0, 0];
			const z = d_model === 3 ? [start_h[i][2], end_h[i][2]] : [0, 0];

			if (d_model === 3) {
				traces.push({
					type: 'scatter3d', x: x, y: y, z: z, mode: 'lines',
					line: { width: 4 }, name: token, showlegend: false
				});
				traces.push({
					type: 'cone', x: [x[1]], y: [y[1]], z: [z[1]],
					u: [x[1] - x[0]], v: [y[1] - y[0]], w: [z[1] - z[0]],
					sizemode: 'absolute', sizeref: 0.15, anchor: 'tip',
					colorscale: [[0, '#10b981'], [1, '#10b981']], showscale: false
				});
			} else {
				traces.push({
					type: 'scatter', x: x, y: y, mode: 'lines+markers',
					name: token, line: { width: 2 },
					marker: { size: [0, 12], symbol: 'arrow', angleref: 'previous' }
				});
			}
		});
		Plotly.newPlot(id, traces, { title: `Layer ${layerNum}: Feature Migration` });
	} else {
		if (typeof echarts === 'undefined') return;
		Plotly.purge(plotDiv);
		const myChart = echarts.init(plotDiv);
		const axes = [];
		for (let i = 0; i < d_model; i++) {
			axes.push({ dim: i * 2, name: `D${i} Pre` }, { dim: i * 2 + 1, name: `D${i} Post` });
		}
		const data = tokens.map((token, tIdx) => ({
			value: start_h[tIdx].flatMap((val, i) => [val, end_h[tIdx][i]]),
			name: token
		}));
		myChart.setOption({
			title: { text: `Layer ${layerNum} Migration`, left: 'center' },
			tooltip: { trigger: 'item', formatter: p => `Token: <b>${p.name}</b>` },
			parallelAxis: axes,
			series: [{
				type: 'parallel', data: data,
				lineStyle: { width: 1.5, opacity: 0.3, color: '#10b981' },
				emphasis: { lineStyle: { width: 5, color: '#ef4444' } }
			}]
		});
	}
}

function render_positional_shift_plot(tokenStrings, d_model) {
    const container = document.getElementById('transformer-pe-shift-plot');
    if (!Array.isArray(tokenStrings) || typeof tokenStrings[0] !== 'string') {
        console.error("Plotting requires an array of string tokens.");
        return [];
    }

    const injectedEmbeddings = [];
    const traces = [];

    tokenStrings.forEach((token, pos) => {
        const semanticBase = window.persistentEmbeddingSpace[token];
        if (!semanticBase) return;

        const peVec = new Array(d_model).fill(0);
	    for (let i = 0; i < d_model; i += 2) {
		    let div_term = Math.pow(10000, i / d_model);
		    peVec[i] = Math.sin(pos / div_term) * posEmbedScalar; 
		    if (i + 1 < d_model) peVec[i + 1] = Math.cos(pos / div_term) * posEmbedScalar;
        }

        const combined = semanticBase.map((val, i) => val + peVec[i]);
        injectedEmbeddings.push(combined);

        if (container && d_model <= 3) {
            const x = [semanticBase[0], combined[0]];
            const y = d_model >= 2 ? [semanticBase[1], combined[1]] : [0, 0];
            const z = d_model === 3 ? [semanticBase[2], combined[2]] : [0, 0];

            if (d_model === 3) {
                // Line Trace
                traces.push({
                    type: 'scatter3d', 
                    x: x, y: y, z: z, 
                    mode: 'lines',
                    line: { width: 6, color: '#3b82f6' }, 
                    name: `${token} (pos ${pos})`,
                    hoverinfo: 'text',
                    text: `Token: ${token}<br>Pos: ${pos}` // Added for hover
                });
                
                // Arrow Tip (Cone) Trace
                traces.push({
                    type: 'cone', 
                    x: [combined[0]], y: [combined[1]], z: [combined[2]],
                    u: [peVec[0]], v: [peVec[1]], w: [peVec[2]],
                    sizemode: 'absolute', sizeref: 0.15, anchor: 'tip',
                    colorscale: [[0, '#3b82f6'], [1, '#1d4ed8']], 
                    showscale: false,
                    hoverinfo: 'text',
                    text: `Token: ${token}` // Added for hover
                });
            }
        }
    });

    if (container && traces.length > 0) {
        Plotly.newPlot(container, traces, {
            title: "Semantic Vector → + Positional Shift",
            scene: {
                xaxis: {title: 'Dim 0'},
                yaxis: {title: 'Dim 1'},
                zaxis: {title: 'Dim 2'}
            },
            margin: { l: 0, r: 0, b: 0, t: 40 }
        });
    }

    return injectedEmbeddings;
}

function calculate_batched_loss(tokens, weights, d_model, n_layers, batchSize = 5) {
	let totalLoss = 0;
	for(let i = 0; i < batchSize; i++) {
		totalLoss += calculate_corpus_loss(tokens, weights, d_model, n_layers);
	}
	return totalLoss / batchSize;
}

function tf_layer_norm(x, gamma, beta) {
	return tf.tidy(() => {
		const { mean, variance } = tf.moments(x, -1, true);
		const epsilon = tf.scalar(1e-6);
		const normalized = x.sub(mean).div(tf.sqrt(variance.add(epsilon)));
		return normalized.mul(gamma).add(beta);
	});
}

function syncTransformerSettings(trigger) {
	const dimSlider = document.getElementById('transformer-dimension-model');
	const headSlider = document.getElementById('transformer-heads');

	let d_model = parseInt(dimSlider.value);
	let h = parseInt(headSlider.value);

	// 1. Enforce Mathematical Dependency: d_model % h == 0
	if (trigger === 'heads') {
		if (d_model % h !== 0) {
			// Snap dimension UP to nearest multiple of heads
			d_model = Math.ceil(d_model / h) * h;
			dimSlider.value = d_model;
		}
	} else if (trigger === 'dim') {
		if (d_model < h) {
			h = d_model;
			headSlider.value = h;
		}
		// Snap heads DOWN to the nearest divisor of the new dimension
		while (d_model % h !== 0 && h > 1) {
			h--;
		}
		headSlider.value = h;
	}

	// 2. CRITICAL: Clear "Ghost" Memory
	// This prevents the "4 must match 6" error by forcing the model to 
	// recreate matrices that match the new slider values.
	window.currentWeights = null; 
	window.persistentEmbeddingSpace = null;
	window.last_d_model = d_model;

	// 3. Update UI Labels
	document.getElementById('dim-val').innerText = dimSlider.value;
	document.getElementById('heads-val').innerText = headSlider.value;

	// 4. Restart Engine
	if (typeof run_transformer_demo === 'function') {
		run_transformer_demo();
	}
}

async function loadTransformerModule () {
	updateLoadingStatus("Loading section about transformers...");
	run_transformer_demo()
	return Promise.resolve();
}
