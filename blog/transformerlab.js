"use strict";

const widthEmbeddingInit = 5;
const nr_fixed = 4;
const posEmbedScalar = 1;
let trainingDebounceTimer;
const epsilon = 1e-6;

window.addEventListener('DOMContentLoaded', (event) => {
	document.getElementById("ifscalfactornotone").style.display =  posEmbedScalar == 1 ? 'none' : 'block'
	document.getElementById("posEmbedScaleFactor").innerHTML = posEmbedScalar;
});

window.lastActiveInputId = 'transformer-training-data';
window.persistentEmbeddingSpace = null;
window.currentWeights = null;
window.lossHistory = [];
window.last_d_model = null;

const vectorMathRenderRegistry = {
	lastRendered: false,
	needsUpdate: false,
	isInViewport: false
};

window.tlab_trajectory_data = {
	tokens: [],
	steps: [] // Array of { name: "Stage Name", data: [[dim1, dim2...], ...] }
};

/**
 * Pure-JS multi-head self-attention WITH causal mask.
 * Matches the training path in calculate_tf_loss exactly:
 *   - Q/K/V split into n_heads of dimension d_k = d_model / n_heads
 *   - Scores scaled by √d_k
 *   - Strict upper-triangle positions set to -1e9 before softmax
 *
 * @param {number[][]} normH    - Layer-normed hidden states [seqLen × d_model]
 * @param {object}     weights  - { query, key, value } weight matrices [d_model × d_model]
 * @param {number}     d_model
 * @param {number}     n_heads
 * @returns {object[]} headData - One entry per head, each with
 *          { q, k, v, scores, weights, context }
 */
function causalMultiHeadAttention(normH, weights, d_model, n_heads) {
	const seqLen = normH.length;
	const d_k = d_model / n_heads;

	// Full-width linear projections
	const Q = matMul(normH, weights.query);   // [seqLen, d_model]
	const K = matMul(normH, weights.key);
	const V = matMul(normH, weights.value);

	const headData = [];

	for (let h = 0; h < n_heads; h++) {
		const off = h * d_k;

		// Slice this head's dimensions from the full projection
		const qH = Q.map(row => row.slice(off, off + d_k));
		const kH = K.map(row => row.slice(off, off + d_k));
		const vH = V.map(row => row.slice(off, off + d_k));

		// ── Scaled dot-product scores: (Q_h · K_h^T) / √d_k ──
		const scores = Array.from({ length: seqLen }, (_, i) =>
			Array.from({ length: seqLen }, (_, j) => {
				let dot = 0;
				for (let d = 0; d < d_k; d++) dot += qH[i][d] * kH[j][d];
				return dot / Math.sqrt(d_k);
			})
		);

		// ── CAUSAL MASK: token i cannot attend to any token j > i ──
		// Mirrors training:  scores = tf.sub(scores, mask)
		// where mask is upper-triangle × 1e9
		for (let i = 0; i < seqLen; i++) {
			for (let j = i + 1; j < seqLen; j++) {
				scores[i][j] = -1e9;
			}
		}

		// Softmax per query position (rows)
		const attnWeights = scores.map(row => softmax(row));

		// Context: weighted sum of value vectors
		const context = Array.from({ length: seqLen }, (_, i) => {
			const out = new Array(d_k).fill(0);
			for (let j = 0; j < seqLen; j++) {
				for (let d = 0; d < d_k; d++) {
					out[d] += attnWeights[i][j] * vH[j][d];
				}
			}
			return out;
		});

		headData.push({
			q: qH,
			k: kH,
			v: vH,
			scores: scores,
			weights: attnWeights,
			context: context
		});
	}

	return headData;
}

/**
 * Locks all architecture-defining controls during training.
 * These parameters define weight matrix shapes — changing them
 * mid-training would destroy all learned weights.
 *
 * Temperature, learning rate, epochs, and optimizer remain unlocked
 * because they don't affect weight shapes.
 */
function lockArchitectureControls(lock) {
	const controlIds = [
		// Architecture (would break weights)
		'transformer-dimension-model',   // d_model
		'transformer-heads',             // n_heads
		'transformer-depth',             // n_layers
		'transformer-context-size',      // context size
		'transformer-tokenizer-type',    // tokenizer

		// Training hyperparameters (safe, but locked by request)
		'train-epochs',                  // epochs
		'train-lr',                      // learning rate
		'train-optimizer',               // optimizer
	];

	controlIds.forEach(id => {
		const el = document.getElementById(id);
		if (!el) return;

		el.disabled = lock;

		// Visual feedback: grey out when locked
		el.style.opacity = lock ? '0.45' : '1';
		el.style.cursor  = lock ? 'not-allowed' : '';
		el.style.pointerEvents = lock ? 'none' : '';
	});

	// Also lock the training data textarea — changing vocabulary
	// would invalidate the embedding matrix dimensions
	const trainingData = document.getElementById('transformer-training-data');
	if (trainingData) {
		trainingData.disabled = lock;
		trainingData.style.opacity = lock ? '0.45' : '1';
		trainingData.style.cursor  = lock ? 'not-allowed' : '';
	}
}

/**
 * Element-wise addition of two matrices of the same shape.
 * Used for residual connections throughout the transformer.
 * @param {number[][]} A - First matrix  [rows × cols]
 * @param {number[][]} B - Second matrix [rows × cols]
 * @returns {number[][]} Result matrix A + B [rows × cols]
 */
function matAdd(A, B) {
	return A.map((row, i) => row.map((val, j) => val + B[i][j]));
}

/**
 * Reads all transformer hyperparameter values from the DOM sliders.
 * Centralizes the repeated getElementById + parseInt/parseFloat pattern
 * from run_and_visualize_network, train_transformer, tlab_get_top_vocab_list,
 * and the training-loop forward-pass display.
 *
 * @returns {{ d_model: number, n_heads: number, n_layers: number, temperature: number }}
 */
function getTransformerConfig() {
	return {
		d_model:     parseInt(document.getElementById('transformer-dimension-model')?.value)  || 3,
		n_heads:     parseInt(document.getElementById('transformer-heads')?.value)             || 1,
		n_layers:    parseInt(document.getElementById('transformer-depth')?.value)             || 1,
		temperature: parseFloat(document.getElementById('transformer-temperature')?.value)     || 1.0,
	};
}

/**
 * Runs a complete inference forward pass without visualization:
 * embeds tokens with positional encoding, then passes through
 * all transformer layers, returning the final hidden states.
 *
 * @param {string[]}  tokens   - Array of token strings
 * @param {object[]}  weights  - Array of layer weight objects
 * @param {number}    d_model  - Model dimension
 * @param {number}    n_heads  - Number of attention heads
 * @param {number}    [n_layers=weights.length] - Layers to run (defaults to all)
 * @returns {number[][]} Final hidden states [seqLen × d_model]
 */
function runSimpleForwardPass(tokens, weights, d_model, n_heads, n_layers) {
	if (n_layers === undefined) n_layers = weights.length;
	let h = embedTokensWithPE(tokens, d_model);
	for (let l = 0; l < n_layers; l++) {
		const result = forwardOneLayer(h, weights[l], d_model, n_heads, tokens, null);
		h = result.h_out;
	}
	return h;
}

/**
 * Looks up embeddings for each token from the persistent embedding space
 * and adds sinusoidal positional encoding.
 *
 * @param {string[]} tokens  - Array of token strings
 * @param {number}   d_model - Embedding dimension
 * @param {object}   [embSpace=window.persistentEmbeddingSpace] - Embedding lookup
 * @returns {number[][]} Matrix [tokens.length × d_model] with PE added
 */
function embedTokensWithPE(tokens, d_model, embSpace = window.persistentEmbeddingSpace) {
	return tokens.map((token, pos) => {
		const emb = (embSpace && embSpace[token]) || new Array(d_model).fill(0);
		return addPositionalEncoding(emb, pos, d_model, posEmbedScalar);
	});
}

/**
 * Computes softmax probabilities from an array of raw logit values.
 * Uses the max-subtraction trick for numerical stability.
 * @param {number[]} logits - Raw scores
 * @returns {number[]} Probabilities that sum to 1
 */
function softmax(logits) {
	const maxLogit = Math.max(...logits);
	const exps = logits.map(l => Math.exp(l - maxLogit));
	const sumExps = exps.reduce((a, b) => a + b, 0);
	return exps.map(e => e / sumExps);
}

/**
 * Multiplies a matrix (rows of vectors) by a weight matrix.
 * @param {number[][]} matrix - Input matrix [seqLen × inputDim]
 * @param {number[][]} weights - Weight matrix [inputDim × outputDim]
 * @returns {number[][]} Result matrix [seqLen × outputDim]
 */
function matMul(matrix, weights, bias = null) {
	return matrix.map(row =>
		weights[0].map((_, j) => {
			let sum = bias ? bias[j] : 0;
			for (let k = 0; k < row.length; k++) sum += row[k] * weights[k][j];
			return sum;
		})
	);
}

/**
 * Runs a single transformer layer forward pass (Pre-LN architecture).
 *
 * FIX: Attention is now computed inline via causalMultiHeadAttention(),
 * which applies a causal mask matching the training path. Previously
 * the entire computation was delegated to AttentionEngine, which used
 * BIDIRECTIONAL attention (no mask) — a critical train/inference mismatch.
 *
 * AttentionEngine is still instantiated when containerId is provided so
 * its rendering scaffolding is created, but the registry's headData is
 * overwritten with the correctly-masked version.
 *
 * @param {number[][]}    h_current    - Input hidden states [seqLen × d_model]
 * @param {object}        layerWeights - Weight object for this layer
 * @param {number}        d_model
 * @param {number}        n_heads
 * @param {string[]|null} tokenStrings - Human-readable token labels (for visualization)
 * @param {string|null}   containerId  - AttentionEngine container ID (null = no viz)
 * @returns {{ h_out, headData, concat, projected, normH, h_attn }}
 */
function forwardOneLayer(h_current, layerWeights, d_model, n_heads, tokenStrings = null, containerId = null) {
	// 1. Pre-LN before attention
	const normH = calculateLayerNorm(h_current, layerWeights.gamma, layerWeights.beta);

	// 2. Multi-head attention WITH causal mask
	const headData = causalMultiHeadAttention(
		normH,
		layerWeights.attention,
		d_model,
		n_heads
	);

	// 3. Visualization setup (unchanged)
	if (containerId) {
		const engine = new AttentionEngine({
			d_model,
			n_heads,
			containerId,
			weights: layerWeights.attention
		});
		engine.forward(normH, tokenStrings || h_current, tokenStrings);

		const entry = attentionRenderRegistry.get(containerId);
		if (entry) {
			entry.headData = headData;
			entry.rendered = false;
		}
	}

	// 4. Concatenate heads
	const concat = h_current.map((_, tIdx) =>
		[].concat(...headData.map(hd => hd.context[tIdx]))
	);

	// 5. Output projection
	const Wo = layerWeights.attention.output;
	const projected = matMul(concat, Wo);

	// 6. Residual connection
	const h_attn = matAdd(h_current, projected);

	// 7. FFN block — ALWAYS skip render here.
	//    Only runVisualizedLayer0 should write to ffn-step-1/2/3.
	const h_out = run_ffn_block(h_attn, layerWeights, /*skipRender=*/ true);

	return { h_out, headData, concat, projected, normH, h_attn };
}

function matrixToPmatrix(matrix) {
	return `\\begin{pmatrix} ` +
		matrix.map(row => row.map(v => v.toFixed(nr_fixed)).join(' & ')).join(' \\\\ ') +
		` \\end{pmatrix}`;
}

function vecToPmatrix(vec) {
	return `\\begin{pmatrix} ${vec.map(v => v.toFixed(nr_fixed)).join(' & ')} \\end{pmatrix}`;
}

function switchTab(containerId, activeIdx, totalCount, idPrefixes, inactiveStyle, activeStyle) {
	// Hide all and reset button styles
	for (let i = 0; i < totalCount; i++) {
		const content = document.getElementById(`${idPrefixes.content}-${containerId}-${i}`);
		if (content) content.style.display = 'none';
		const btn = document.getElementById(`${idPrefixes.btn}-${containerId}-${i}`);
		if (btn) {
			btn.style.background = inactiveStyle.bg;
			btn.style.fontWeight = 'normal';
		}
	}

	// Show active and highlight its button
	const activeContent = document.getElementById(`${idPrefixes.content}-${containerId}-${activeIdx}`);
	if (activeContent) activeContent.style.display = 'block';
	const activeBtn = document.getElementById(`${idPrefixes.btn}-${containerId}-${activeIdx}`);
	if (activeBtn) {
		activeBtn.style.background = activeStyle.bg;
		activeBtn.style.fontWeight = 'bold';
	}

	return activeContent;
}

function getContextSize() {
	const slider = document.getElementById('transformer-context-size');
	return slider ? parseInt(slider.value) : 16;
}

function dotProduct(a, b) {
	let sum = 0;
	const len = Math.min(a.length, b.length);
	for (let i = 0; i < len; i++) {
		sum += a[i] * (b[i] || 0);
	}
	return sum;
}

window.currentTrainingWindows = [];
const attentionRenderRegistry = new Map();
const positionalShiftRegistry = new Map();
const embeddingRenderRegistry = new Map();
const trajectoryRenderRegistry = new Map();
const multiLayerAttentionRegistry = new Map();
const transformerLabVisMigrationDataRegistry = new Map();

/**
 * Creates a lazy IntersectionObserver that fires a render callback
 * the first time an element becomes visible, then marks it as rendered.
 *
 * @param {Map}      registry   - A Map keyed by container ID holding { rendered, ...data }
 * @param {Function} renderFn   - Called as renderFn(containerId, dataFromRegistry)
 * @param {object}   [options]  - IntersectionObserver options (default: { threshold: 0 })
 * @returns {IntersectionObserver}
 */
function createLazyRenderObserver(registry, renderFn, options = { threshold: 0 }) {
	return new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const containerId = entry.target.id;
				const data = registry.get(containerId);
				if (data && !data.rendered) {
					renderFn(containerId, data);
					data.rendered = true;
				}
			}
		});
	}, options);
}

const embeddingObserver = createLazyRenderObserver(embeddingRenderRegistry, (id, data) => {
	_execute_embedding_render(data.d_model);
});

const positionalShiftObserver = createLazyRenderObserver(positionalShiftRegistry, (id, data) => {
	_execute_shift_render(data.tokenStrings, data.d_model, data.injectedEmbeddings);
});

const attentionObserver = createLazyRenderObserver(attentionRenderRegistry, (id, data) => {
	data.instance.executeActualRender(data.headData, data.tokens);
});

const trajectoryObserver = createLazyRenderObserver(trajectoryRenderRegistry, (id, data) => {
	tlab_render_trajectory_plot(data.d_model);
});

const migrationObserver = createLazyRenderObserver(transformerLabVisMigrationDataRegistry, (id, data) => {
	render_migration_logic(id, data.tokens, data.start_h, data.end_h, data.layerNum, data.d_model, data.h_after, data.tokenStrings);
});

const headContentObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			const el = entry.target;
			const containerId = el.dataset.containerId;
			const layerIdx = parseInt(el.dataset.layerIdx);
			const headIdx = parseInt(el.dataset.headIdx);

			if (el.dataset.rendered === 'true') return;

			const registryEntry = attentionRenderRegistry.get(containerId);
			if (registryEntry && registryEntry.instance) {
				console.log(`Head ${headIdx} in Layer ${layerIdx} visible: Rendering...`);
				registryEntry.instance._executeHeadRender(layerIdx, headIdx);
			}
		}
	});
}, { threshold: 0 });

const positionalWavesRegistry = new Map();

const positionalWavesObserver = createLazyRenderObserver(positionalWavesRegistry, (id, data) => {
	_execute_positional_waves_render(data.d_model, data.tokens);
});

const vectorMathObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		vectorMathRenderRegistry.isInViewport = entry.isIntersecting;
		// If it just scrolled into view and there's a pending update, render now
		if (entry.isIntersecting && vectorMathRenderRegistry.needsUpdate) {
			_execute_vector_math();
			vectorMathRenderRegistry.needsUpdate = false;
		}
	});
}, { threshold: 0 });

function observer_vector_math () {
	const vmContainer = document.getElementById('transformer-vector-math-result');
	if (vmContainer) {
		vectorMathObserver.observe(vmContainer);
	}
	// Also observe the input container in case it's separate
	const vmInput = document.getElementById('transformer-vector-math-input');
	if (vmInput && vmInput.parentElement) {
		vectorMathObserver.observe(vmInput.parentElement);
	}
}

function getPositionColor(index, total, format = 'rgb') {
	const t = total > 1 ? index / (total - 1) : 0;
	const r = Math.round(59 + (16 - 59) * t);
	const g = Math.round(130 + (185 - 130) * t);
	const b = Math.round(246 + (129 - 246) * t);

	if (format === 'object') return { r, g, b };
	if (format === 'temml')  return `\\color[RGB]{${r},${g},${b}}`;
	return `rgb(${r}, ${g}, ${b})`;
}

function reset_graph() {
	document.getElementById('training-loss-plot').style.display = 'none';
	document.getElementById('training-loss-plot').innerHTML = '';
}

function computePositionalEncoding(pos, d_model, scalar = 1.0) {
	const pe = new Array(d_model);
	for (let i = 0; i < d_model; i++) {
		const divTerm = Math.pow(10000, (2 * Math.floor(i / 2)) / d_model);
		pe[i] = ((i % 2 === 0)
			? Math.sin(pos / divTerm)
			: Math.cos(pos / divTerm)) * scalar;
	}
	return pe;
}

function addPositionalEncoding(embedding, pos, d_model, scalar = 1.0) {
	const pe = computePositionalEncoding(pos, d_model, scalar);
	return embedding.map((val, i) => val + pe[i]);
}

function countAllNumbers(data) {
	let count = 0;

	// 1. Fall: Es ist direkt eine Zahl
	if (typeof data === 'number') {
		return 1;
	}

	// 2. Fall: Es ist ein Objekt oder Array (und nicht null)
	if (data !== null && typeof data === 'object') {
		// Wir iterieren über alle Werte des Objekts/Arrays
		for (let key in data) {
			if (Object.prototype.hasOwnProperty.call(data, key)) {
				count += countAllNumbers(data[key]);
			}
		}
	}

	return count;
}

function show_nr_of_params() {
	const nr_params = countAllNumbers(currentWeights);

	if(!nr_params) {
		document.getElementById("nr_params").innerHTML = "";
		document.getElementById('nr_params').style.display = 'none';
		return;
	}

	document.getElementById("nr_params").innerHTML = `The current network has ${nr_params} internal parameters.`;
	document.getElementById('nr_params').style.display = 'block';
}

function get_or_init_embeddings(tokens, d_model) {
	if (window.persistentEmbeddingSpace === null) {
		window.persistentEmbeddingSpace = {};
	}

	if (window.last_d_model !== d_model) {
		window.persistentEmbeddingSpace = {};
		window.last_d_model = d_model;
		reset_graph();
	}

	const space = window.persistentEmbeddingSpace;

	tokens.forEach(token => {
		if (!space[token]) {
			space[token] = Array.from({ length: d_model }, () =>
				parseFloat(gaussianRandom(-widthEmbeddingInit, widthEmbeddingInit).toFixed(nr_fixed))
			);
		}
	});

	const tokenSet = new Set(tokens);
	Object.keys(space).forEach(key => {
		if (!tokenSet.has(key)) {
			delete space[key];
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

window.showLayer = (containerId, layerIdx, numLayers) => {
	const activeContent = switchTab(containerId, layerIdx, numLayers,
		{ content: 'layer-content', btn: 'layer-tab-btn' },
		{ bg: '#bfdbfe' },
		{ bg: '#fff' }
	);

	// LAZY: Render this layer's content if not yet done
	const registryEntry = attentionRenderRegistry.get(containerId);
	if (registryEntry && registryEntry.instance) {
		registryEntry.instance._renderLayerContent(layerIdx);
	}

	const heatmaps = activeContent?.querySelectorAll('[id^="attn-heatmap-"]');
	if (heatmaps) heatmaps.forEach(hm => { try { Plotly.Plots.resize(hm); } catch(e) {} });
	render_temml();
};

window.showHeadInLayer = (containerId, layerIdx, headIdx, numHeads) => {
	const activeContent = switchTab(`${containerId}-${layerIdx}`, headIdx, numHeads,
		{ content: 'head-content', btn: 'head-tab-btn' },
		{ bg: '#e2e8f0' },
		{ bg: '#fff' }
	);

	// LAZY: Register the head for observation (renders when visible)
	const registryEntry = attentionRenderRegistry.get(containerId);
	if (registryEntry && registryEntry.instance) {
		registryEntry.instance._renderHeadContent(layerIdx, headIdx);
	}

	const heatmapDiv = activeContent?.querySelector('[id^="attn-heatmap-"]');
	if (heatmapDiv) { try { Plotly.Plots.resize(heatmapDiv); } catch(e) {} }
	render_temml();
};

// Keep backward compatibility — old showHead still works for any legacy calls
window.showHead = (idx) => {
	document.querySelectorAll('.head-tab').forEach(el => el.style.display = 'none');
	const activeTab = document.getElementById(`head-content-${idx}`);
	if (activeTab) activeTab.style.display = 'block';

	document.querySelectorAll('.mha-tab-btn').forEach(btn => {
		btn.style.background = '#e2e8f0';
		btn.style.fontWeight = 'normal';
	});
	const btn = document.getElementById(`tab-btn-${idx}`);
	if (btn) {
		btn.style.background = '#fff';
		btn.style.fontWeight = 'bold';
	}

	const heatmapDiv = activeTab?.querySelector('[id^="attn-heatmap-"]');
	if (heatmapDiv) {
		try { Plotly.Plots.resize(heatmapDiv); } catch(e) {}
	}

	render_temml();
};

function calculate_positional_injection(tokens, d_model) {
	const injectedEncodings = computeInjectedEncodings(tokens, d_model);
	renderPositionalInjectionHtml(tokens, injectedEncodings, d_model);
	return injectedEncodings;
}

/**
 * Computes the combined embedding + PE vector for each token.
 * Pure computation — no DOM access.
 */
function computeInjectedEncodings(tokens, d_model) {
	return tokens.map((token, pos) => {
		const semanticVec = (window.persistentEmbeddingSpace && window.persistentEmbeddingSpace[token])
			? window.persistentEmbeddingSpace[token].map(v => parseFloat(v.toFixed(nr_fixed)))
			: Array.from({ length: d_model }, () => 0);

		const peVec = computePositionalEncoding(pos, d_model, posEmbedScalar);
		return semanticVec.map((val, i) => val + peVec[i]);
	});
}

/**
 * Renders the positional injection table into the DOM.
 */
function renderPositionalInjectionHtml(tokens, injectedEncodings, d_model) {
	const resultsContainer = document.getElementById('transformer-pe-integration-results');
	if (!resultsContainer) return;

	let html = `<h3>Vector Injection (Inference Sequence)</h3><div class='transformer_positional_embeddings'>`;

	tokens.forEach((token, pos) => {
		const semanticVec = (window.persistentEmbeddingSpace && window.persistentEmbeddingSpace[token])
			? window.persistentEmbeddingSpace[token].map(v => parseFloat(v.toFixed(nr_fixed)))
			: Array.from({ length: d_model }, () => 0);

		const peVec = computePositionalEncoding(pos, d_model, posEmbedScalar);
		const combined = injectedEncodings[pos];

		html += buildInjectionRowHtml(token, pos, semanticVec, peVec, combined);
	});

	html += `</div>`;

	resultsContainer.innerHTML = html;
}

/**
 * Builds the HTML for a single token's injection row.
 */
function buildInjectionRowHtml(token, pos, semanticVec, peVec, combined) {
    const displaySemantic = semanticVec.map(v => v.toFixed(nr_fixed));
    const displayPE = peVec.map(v => v.toFixed(nr_fixed));
    const displayCombined = combined.map(v => v.toFixed(nr_fixed));

    return `
    <div style="margin-bottom: 10px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; background: #fff; overflow: auto;">
        <strong>Pos ${pos}: ${token}</strong>
        <table style="width:100%; font-family: monospace; font-size: 11px; margin-top: 5px; border-collapse: collapse;">
            <tr style="color: #64748b;">
                <td style="padding-right: 10px;">Embedding Vector</td>
                ${displaySemantic.map(v => `<td>${v}</td>`).join('')}
            </tr>
            <tr style="color: #3b82f6;">
                <td style="padding-right: 10px;">PE (Sin/Cos)</td>
                ${displayPE.map(v => `<td>${v}</td>`).join('')}
            </tr>
            <tr style="font-weight:bold; border-top: 1px solid #eee;">
                <td style="padding-right: 10px;">Combined</td>
                ${displayCombined.map(v => `<td>${v}</td>`).join('')}
            </tr>
        </table>
    </div>`;
}

function render_positional_waves(d_model, tokens) {
	const containerId = 'transformer-pe-wave-plot';
	const container = document.getElementById(containerId);
	if (!container) return;

	// Store latest data in registry, mark as needing render
	positionalWavesRegistry.set(containerId, {
		d_model: d_model,
		tokens: tokens,
		rendered: false
	});

	// Placeholder only on first call (don't clobber existing Plotly chart)
	if (!container.innerHTML) {
		container.innerHTML = `<div style="padding:20px; color:#64748b;">Waiting for Positional Waves plot to load...</div>`;
	}

	// Start observing (no-op if already observed)
	positionalWavesObserver.observe(container);

	// If already in viewport, render immediately
	if (isElementInViewport(container)) {
		_execute_positional_waves_render(d_model, tokens);
		const entry = positionalWavesRegistry.get(containerId);
		if (entry) entry.rendered = true;
	}
}

function _execute_positional_waves_render(d_model, tokens) {
	const containerId = 'transformer-pe-wave-plot';
	const container = document.getElementById(containerId);
	if (!container) return;

	const traces = [];
	const resolution = 0.1;
	const seqLen = tokens.length;
	const maxPos = Math.max(1, seqLen);

	for (let i = 0; i < d_model; i++) {
		let x = [], y = [];
		for (let p = 0; p <= maxPos; p += resolution) {
			let div_term = Math.pow(10000, (2 * Math.floor(i / 2)) / d_model);
			let val = ((i % 2 === 0)
				? Math.sin(p / div_term)
				: Math.cos(p / div_term)) * posEmbedScalar;
			x.push(p);
			y.push(val);
		}
		traces.push({
			x: x, y: y, mode: 'lines',
			name: `Dim ${i} ${i % 2 === 0 ? 'Sin' : 'Cos'}`,
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
		xaxis: { title: 'Token Position' },
		yaxis: { title: 'PE Value', range: [-1.1, 1.1] }
	};

	// Plotly.react does an efficient diff-and-patch update in place,
	// unlike newPlot which tears down and rebuilds the entire chart.
	Plotly.react(containerId, traces, layout);
}

function run_transformer_demo(activeId = null) {
    if (activeId) {
        window.lastActiveInputId = activeId;
    }

    const trainingInput = document.getElementById('transformer-training-data');
    const masterInput = document.getElementById('transformer-master-token-input');

    if (!trainingInput || !masterInput) return;

    // 1. Tokenize both for logic
    const trainingTokens = transformer_tokenize_render(trainingInput.value, null);
    const masterTokens = transformer_tokenize_render(masterInput.value, null);

    // 2. BPE visualization: respect the toggle mode
    const vizMode = window.tlabVisualizationMode || 'train';
    const vizSourceValue = (vizMode === 'inference')
        ? masterInput.value
        : trainingInput.value;
    const vizTokens = transformer_tokenize_render(vizSourceValue, "transformer-viz-bpe");

    // 3. Run the network
    run_and_visualize_network(vizTokens, trainingTokens, masterTokens);

    show_nr_of_params();
}

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

	show_nr_of_params();

	return weights;
}

// Global state flag
window.isTraining = false;

/**
 * Checks whether training can start. Returns the token array if valid,
 * or null if training should be aborted.
 */
function validateTrainingPreconditions(status) {
	const trainingData = document.getElementById('transformer-training-data').value;
	const preCheckTokens = transformer_tokenize_render(trainingData, null);

	if (preCheckTokens.length < 2) {
		status.style.display = 'block';
		status.innerText = 'Need at least 2 tokens in training data.';
		return null;
	}

	return preCheckTokens;
}

/**
 * Sets up UI state and resets history for a new training run.
 * Returns the parsed hyperparameters.
 */
function initTrainingSession(btn, status) {
	window.isTraining = true;
	lockArchitectureControls(true);   // ← ADD THIS LINE
	btn.classList.add('active');
	btn.innerText = 'Stop Training';
	status.style.display = 'block';

	window.lossHistory = [];
	reset_graph();
	showTrainingProgressBar();

	return {
		lr:       parseFloat(document.getElementById('train-lr').value) || 0.05,
		epochs:   parseInt(document.getElementById('train-epochs').value) || 500,
		optType:  document.getElementById('train-optimizer').value,
	};
}

/**
 * Instantiates the TensorFlow.js optimizer based on user selection.
 */
function createOptimizer(optType, lr) {
	if (optType === 'adam')    return tf.train.adam(lr);
	if (optType === 'rmsprop') return tf.train.rmsprop(lr);
	return tf.train.sgd(lr);
}

/**
 * Constructs sliding-window input/target pairs for the current epoch.
 * Mutates window.currentTrainingWindows.
 */
function buildTrainingWindows(tokens, contextSize) {
	window.currentTrainingWindows = [];
	for (let startIdx = 0; startIdx < tokens.length - contextSize; startIdx++) {
		const inputSlice  = tokens.slice(startIdx, startIdx + contextSize);
		const targetSlice = tokens.slice(startIdx + 1, startIdx + contextSize + 1);
		window.currentTrainingWindows.push({ input: inputSlice, target: targetSlice });
	}
}

/**
 * Runs one gradient step: computes loss, clips gradients, applies them.
 * Returns the loss tensor (caller must dispose).
 */
function computeAndApplyGradients(tokens, weightVars, d_model, n_layers, n_heads, allVars, optimizer, clipValue) {
	const { value: cost, grads } = tf.variableGrads(
		() => tf.tidy(() => calculate_tf_loss(tokens, weightVars, d_model, n_layers, n_heads)),
		allVars
	);

	const clippedGrads = {};
	for (const name in grads) {
		clippedGrads[name] = tf.clipByValue(grads[name], -clipValue, clipValue);
	}
	optimizer.applyGradients(clippedGrads);

	for (const name in grads) {
		grads[name].dispose();
		clippedGrads[name].dispose();
	}

	return cost;
}

/**
 * Generates HTML showing expected vs. predicted tokens for each
 * training window, and injects it into the DOM.
 */
function renderTrainingWindowPredictions(d_model, n_layers) {
    const sentenceSpan = document.getElementById('current_training_sentence');
    if (!sentenceSpan || window.currentTrainingWindows.length === 0) return;

    const vocab     = Object.keys(window.persistentEmbeddingSpace);
    const embMatrix = vocab.map(word => window.persistentEmbeddingSpace[word]);
    const { n_heads: n_heads_local } = getTransformerConfig();

    const maxWordLen = Math.max(
        ...window.currentTrainingWindows.flatMap(w => w.target.map(t => t.length)),
        ...vocab.map(v => v.length),
        1
    );
    const chipMinWidth = Math.max(250, maxWordLen * 9 + 70) + 'px';

    const windowsHtml = window.currentTrainingWindows.map((w, idx) => {
        const predictions = getPredictionsForWindow(w, vocab, embMatrix, d_model, n_heads_local, n_layers);
        return renderSingleWindowHtml(w, predictions, idx, chipMinWidth);
    }).join('');

    sentenceSpan.innerHTML = windowsHtml;
    $("#show_training_sentences").show();
}

/**
 * Runs a forward pass for a single training window and returns
 * top-1 predictions at each position.
 */
function getPredictionsForWindow(w, vocab, embMatrix, d_model, n_heads, n_layers) {
    const predictions = [];
    try {
        const h = runSimpleForwardPass(w.input, window.currentWeights, d_model, n_heads, n_layers);

        for (let pos = 0; pos < h.length; pos++) {
            const logits = embMatrix.map(embRow =>
                h[pos].reduce((sum, val, k) => sum + val * embRow[k], 0));
            const probs = softmax(logits);

            let bestIdx = 0;
            for (let j = 1; j < probs.length; j++) {
                if (probs[j] > probs[bestIdx]) bestIdx = j;
            }
            predictions.push({ word: vocab[bestIdx], prob: probs[bestIdx] });
        }
    } catch (e) {
        w.target.forEach(() => predictions.push({ word: '?', prob: 0 }));
    }
    return predictions;
}

/**
 * Builds the HTML chip display for a single training window.
 */
function renderSingleWindowHtml(w, predictions, idx, chipMinWidth) {
	const targetHtml = w.target.map((targetWord, pos) => {
		const pred      = predictions[pos] || { word: '?', prob: 0 };
		const isCorrect = pred.word === targetWord;
		const icon      = isCorrect ? '✅' : '❌';
		const probStr   = (pred.prob * 100).toFixed(1);
		const bgColor   = isCorrect ? '#dcfce7' : '#fee2e2';

		return `<span style="display:inline-block; margin:2px; padding:2px 6px; border-radius:4px; background:${bgColor}; font-size:0.8rem; min-width:${chipMinWidth}; text-align:center; box-sizing:border-box;" title="Target: ${targetWord} | Predicted: ${pred.word} (${probStr}%)">
	    ${icon} <b>${targetWord}</b>→<span style="color:${isCorrect ? '#16a34a' : '#dc2626'}">${pred.word}</span> <span style="opacity:0.6; font-size:0.7rem;">${probStr}%</span>
	</span>`;
	}).join('');

	return `<div style="margin-bottom:6px; padding:6px 10px; background:#f1f5f9; border-radius:6px; font-family:monospace; font-size:0.85rem;">
	<strong>Window ${idx + 1}:</strong>
	[${w.input.join(' ')}] →<br>
	<div style="margin-top:4px; margin-left:10px;">
	    <span style="color:#64748b; font-size:0.75rem;">Expected vs Predicted:</span><br>
	    ${targetHtml}
	</div>
    </div>`;
}

/**
 * Formats a duration in milliseconds as HH:MM:SS.
 */
function formatETA(ms) {
	if (isNaN(ms) || ms < 0) return "Calculating...";
	let seconds = Math.floor(ms / 1000);
	const hours   = Math.floor(seconds / 3600);
	seconds %= 3600;
	const minutes = Math.floor(seconds / 60);
	seconds %= 60;
	return [hours, minutes, seconds]
		.map(v => v < 10 ? "0" + v : v)
		.join(":");
}

/**
 * Resets UI elements after training completes or is stopped.
 */
function finalizeTrainingSession(btn, status, completedAll) {
	window.isTraining = false;
	lockArchitectureControls(false);  // ← ADD THIS LINE
	btn.classList.remove('active');
	btn.innerText = 'Train Model';
	status.innerText += completedAll ? " Training Complete!" : " Training Stopped.";
	hideTrainingProgressBar();
}

async function train_transformer() {
    const { d_model, n_layers, n_heads } = getTransformerConfig();
    const btn    = document.querySelector('.train-btn');
    const status = document.getElementById('training-status');

    if (!validateTrainingPreconditions(status)) return;
    if (window.isTraining) { window.isTraining = false; return; }

    const { lr, epochs, optType } = initTrainingSession(btn, status);
    const optimizer = createOptimizer(optType, lr);

    const tokens = getTrainingTokens();
    if (tokens.length === 0) { finalizeTrainingSession(btn, status, false); return; }

    ensureWeightsAndEmbeddings(tokens, n_layers, d_model);

    const weightVars = convert_weights_to_tensors(window.currentWeights);
    const allVars    = collectTrainableVars(weightVars);
    const startTime  = performance.now();
    let completedAll = true;

    for (let i = 0; i < epochs; i++) {
        if (!window.isTraining) { completedAll = false; break; }
        await runSingleEpoch(i, epochs, tokens, weightVars, allVars, optimizer, d_model, n_layers, n_heads, status, startTime);
    }

    finalizeTrainingSession(btn, status, completedAll);
}

/**
 * Tokenizes the training data from the DOM input.
 */
function getTrainingTokens() {
    const trainingData = document.getElementById('transformer-training-data').value;
    return transformer_tokenize_render(trainingData, null);
}

/**
 * Ensures weights and embeddings are initialized for the current config.
 */
function ensureWeightsAndEmbeddings(tokens, n_layers, d_model) {
    if (!window.currentWeights) {
        window.currentWeights = get_init_weights(n_layers, d_model);
    }
    get_or_init_embeddings(tokens, d_model);
}

/**
 * Runs a single training epoch: gradient step, predictions, progress update, state sync.
 */
async function runSingleEpoch(epochIdx, totalEpochs, tokens, weightVars, allVars, optimizer, d_model, n_layers, n_heads, status, startTime) {
    const clipValue = 1.0;
    const thisContextSize = Math.min(getContextSize(), tokens.length - 1);
    buildTrainingWindows(tokens, thisContextSize);

    // Gradient step
    const cost = computeAndApplyGradients(
        tokens, weightVars, d_model, n_layers, n_heads, allVars, optimizer, clipValue
    );

    const lossValue = await cost.data();
    window.lossHistory.push(lossValue[0]);

    // Render predictions
    renderTrainingWindowPredictions(d_model, n_layers);

    // Progress & ETA
    updateEpochProgress(epochIdx, totalEpochs, lossValue[0], startTime, status);

    // Sync state
    await syncTrainingState(weightVars);

    cost.dispose();
}

/**
 * Updates the progress bar and status text for the current epoch.
 */
function updateEpochProgress(epochIdx, totalEpochs, loss, startTime, status) {
    updateTrainingProgressBar(epochIdx + 1, totalEpochs, loss);

    const elapsed         = performance.now() - startTime;
    const avgTimePerEpoch = elapsed / (epochIdx + 1);
    const etaMs           = (totalEpochs - (epochIdx + 1)) * avgTimePerEpoch;
    status.innerText = `Epoch ${epochIdx + 1}: Loss = ${loss.toFixed(6)} | ETA: ${formatETA(etaMs)}`;
}

/**
 * Syncs tensor weights back to JS, re-renders the demo, and yields to the browser.
 */
async function syncTrainingState(weightVars) {
    renderLossGraph();
    window.currentWeights = await convert_tensors_to_weights(weightVars);
    run_transformer_demo();
    await tf.nextFrame();
    calculate_vector_math();
    tled_syncTableFromSpace();
}

/**
 * Creates the progress bar label element.
 */
function createProgressLabel() {
    const span = document.createElement('span');
    span.id = 'training-progress-label';
    span.style.cssText = 'white-space: nowrap; min-width: 180px;';
    span.textContent = 'Starting training...';
    return span;
}

/**
 * Creates the progress bar track with fill and percentage overlay.
 */
function createProgressTrack() {
    const track = document.createElement('div');
    track.style.cssText = 'flex-grow: 1; background: #334155; border-radius: 6px; height: 18px; overflow: hidden; position: relative;';

    const fill = document.createElement('div');
    fill.id = 'training-progress-fill';
    fill.style.cssText = 'width: 0%; height: 100%; background: linear-gradient(90deg, #3b82f6, #10b981); border-radius: 6px; transition: width 0.15s ease;';

    const percent = document.createElement('span');
    percent.id = 'training-progress-percent';
    percent.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); pointer-events: none;';
    percent.textContent = '0%';

    track.appendChild(fill);
    track.appendChild(percent);
    return track;
}

/**
 * Creates the loss display label.
 */
function createLossLabel() {
    const span = document.createElement('span');
    span.id = 'training-progress-loss';
    span.style.cssText = 'white-space: nowrap; min-width: 120px; text-align: right; color: #94a3b8;';
    span.textContent = 'Loss: —';
    return span;
}

/**
 * Creates the stop training button.
 */
function createStopButton() {
    const btn = document.createElement('button');
    btn.textContent = '⏹ Stop';
    btn.style.cssText = 'background: #ef4444; color: white; border: none; margin-right: 50px; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.82rem; white-space: nowrap; transition: background 0.15s;';
    btn.addEventListener('click', () => { window.isTraining = false; });
    btn.addEventListener('mouseover', () => { btn.style.background = '#dc2626'; });
    btn.addEventListener('mouseout', () => { btn.style.background = '#ef4444'; });
    return btn;
}

/**
 * Refactored: assembles the progress bar from smaller components.
 */
function showTrainingProgressBar() {
    hideTrainingProgressBar();

    const bar = document.createElement('div');
    bar.id = 'training-progress-bar-container';
    bar.style.cssText = `
        position: fixed; bottom: 0; left: 0; width: 100%;
        background: #1e293b; color: #f8fafc; padding: 10px 20px;
        display: flex; align-items: center; gap: 15px; z-index: 99999;
        font-family: 'Inter', sans-serif; font-size: 0.85rem;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.3); transition: opacity 0.3s ease;
    `;

    bar.appendChild(createProgressLabel());
    bar.appendChild(createProgressTrack());
    bar.appendChild(createLossLabel());
    bar.appendChild(createStopButton());

    document.body.appendChild(bar);
}

/**
 * Updates the progress bar with current epoch, total epochs, and loss.
 */
function updateTrainingProgressBar(currentEpoch, totalEpochs, loss) {
	const fill = document.getElementById('training-progress-fill');
	const label = document.getElementById('training-progress-label');
	const percent = document.getElementById('training-progress-percent');
	const lossLabel = document.getElementById('training-progress-loss');

	if (!fill || !label || !percent || !lossLabel) return;

	const pct = Math.min(100, (currentEpoch / totalEpochs) * 100);

	fill.style.width = pct.toFixed(1) + '%';
	percent.textContent = pct.toFixed(1) + '%';
	label.textContent = `Epoch ${currentEpoch} / ${totalEpochs}`;
	lossLabel.textContent = `Loss: ${loss.toFixed(6)}`;
}

/**
 * Removes the progress bar from the DOM.
 */
function hideTrainingProgressBar() {
	const bar = document.getElementById('training-progress-bar-container');
	if (bar) {
		bar.style.opacity = '0';
		setTimeout(() => bar.remove(), 300);
	}
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

function calculate_tf_loss(tokens, vars, d_model, n_layers, n_heads) {
    if (n_heads === undefined) n_heads = getTransformerConfig().n_heads;

    const d_k = d_model / n_heads;
    const thiscontextSize = Math.min(getContextSize(), tokens.length - 1);

    if (thiscontextSize < 1) {
        console.error("Context must have at least 2 elements");
        return tf.scalar(100);
    }

    const mask = buildCausalMask(thiscontextSize);
    const losses = collectWindowLosses(tokens, vars, d_model, n_layers, n_heads, d_k, thiscontextSize, mask);

    mask.dispose();

    if (losses.length === 0) return tf.scalar(10);
    return tf.addN(losses).div(tf.scalar(losses.length));
}

/**
 * Builds the upper-triangle causal mask tensor.
 */
function buildCausalMask(contextSize) {
    return tf.tidy(() => {
        const ones = tf.ones([contextSize, contextSize]);
        const upperTriangle = tf.linalg.bandPart(ones, 0, -1);
        const diagonal = tf.linalg.bandPart(ones, 0, 0);
        return tf.sub(upperTriangle, diagonal).mul(tf.scalar(1e9));
    });
}

/**
 * Collects cross-entropy losses for all sliding windows.
 */
function collectWindowLosses(tokens, vars, d_model, n_layers, n_heads, d_k, contextSize, mask) {
	const losses = [];

	for (let startIdx = 0; startIdx < tokens.length - contextSize; startIdx++) {
		const loss = tf.tidy(() => {
			const inputIds  = mapTokensToIds(tokens, startIdx, contextSize, vars.vocab_map);
			const targetIds = mapTokensToIds(tokens, startIdx + 1, contextSize, vars.vocab_map);

			let x = embedAndEncodePositions(inputIds, vars.embeddings, d_model);

			x = applyTransformerLayers(x, vars.layers, n_layers, n_heads, d_k, contextSize, d_model, mask);

			const logits = tf.matMul(x, vars.embeddings.transpose());
			const labels = tf.oneHot(tf.tensor1d(targetIds, 'int32'), vars.vocab_map.length);
			return tf.losses.softmaxCrossEntropy(labels, logits);
		});

		losses.push(loss);
	}

	return losses;
}

/**
 * Maps a slice of tokens to vocabulary indices.
 */
function mapTokensToIds(tokens, startIdx, contextSize, vocabMap) {
    return tokens.slice(startIdx, startIdx + contextSize)
        .map(t => vocabMap.indexOf(t));
}

/**
 * Gathers embeddings and adds sinusoidal positional encoding (TF tensors).
 */
function embedAndEncodePositions(inputIds, embeddingsTensor, d_model) {
    let x = tf.gather(embeddingsTensor, tf.tensor1d(inputIds, 'int32'));

    const peTensor = tf.tidy(() => {
        const pos = tf.range(0, inputIds.length, 1).reshape([inputIds.length, 1]);
        const i = tf.range(0, d_model, 1).reshape([1, d_model]);
        const divTerm = tf.pow(
            tf.scalar(10000),
            i.div(tf.scalar(2)).floor().mul(tf.scalar(2)).div(tf.scalar(d_model))
        );
        const args = pos.div(divTerm);
        return tf.where(
            i.mod(tf.scalar(2)).equal(tf.scalar(0)),
            tf.sin(args),
            tf.cos(args)
        ).mul(tf.scalar(posEmbedScalar));
    });

    return tf.add(x, peTensor);
}

/**
 * Applies all transformer layers (Pre-LN) to the input tensor.
 */
function applyTransformerLayers(x, layers, n_layers, n_heads, d_k, contextSize, d_model, mask) {
    for (let i = 0; i < n_layers; i++) {
        x = applySingleTransformerLayer(x, layers[i], n_heads, d_k, contextSize, d_model, mask);
    }
    return x;
}

/**
 * Applies a single Pre-LN transformer layer: attention + FFN.
 */
function applySingleTransformerLayer(x, layer, n_heads, d_k, contextSize, d_model, mask) {
    // Pre-LN + Multi-Head Attention
    const normX = tf_layer_norm(x, layer.gamma, layer.beta);
    const attnOutput = computeTfMultiHeadAttention(normX, layer, n_heads, d_k, contextSize, d_model, mask);
    x = tf.add(x, attnOutput);

    // Pre-LN + FFN
    const normX2 = tf_layer_norm(x, layer.gamma2, layer.beta2);
    let ffn = tf.relu(tf.add(tf.matMul(normX2, layer.w1), layer.b1));
    ffn = tf.add(tf.matMul(ffn, layer.w2), layer.b2);
    return tf.add(x, ffn);
}

/**
 * Computes multi-head attention with causal masking in TensorFlow.js.
 */
function computeTfMultiHeadAttention(normX, layer, n_heads, d_k, contextSize, d_model, mask) {
    const q = tf.matMul(normX, layer.wq);
    const k = tf.matMul(normX, layer.wk);
    const v = tf.matMul(normX, layer.wv);

    const qHeads = q.reshape([contextSize, n_heads, d_k]).transpose([1, 0, 2]);
    const kHeads = k.reshape([contextSize, n_heads, d_k]).transpose([1, 0, 2]);
    const vHeads = v.reshape([contextSize, n_heads, d_k]).transpose([1, 0, 2]);

    let scores = tf.matMul(qHeads, kHeads.transpose([0, 2, 1]))
        .div(tf.sqrt(tf.scalar(d_k)));

    scores = tf.sub(scores, mask.expandDims(0));

    const attnWeights = tf.softmax(scores, -1);
    const context = tf.matMul(attnWeights, vHeads);

    const concat = context.transpose([1, 0, 2]).reshape([contextSize, d_model]);
    return tf.matMul(concat, layer.wo);
}

function collectTrainableVars(weightVars) {
	const vars = [];
	weightVars.layers.forEach(l => {
		vars.push(
			l.wq, l.wk, l.wv, l.wo,
			l.gamma, l.beta, l.gamma2, l.beta2,
			l.w1, l.b1, l.w2, l.b2
		);
	});
	vars.push(weightVars.embeddings);
	return vars;
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

function calculate_corpus_loss(tokens, weights, d_model, n_layers) {
	const maxStart = Math.max(1, tokens.length - getContextSize());
	const startIdx = Math.floor(Math.random() * maxStart);
	const endIdx = Math.min(startIdx + getContextSize(), tokens.length - 1);

	const contextTokens = tokens.slice(startIdx, endIdx);
	const targetToken = tokens[endIdx]; // The token coming AFTER the context

	const { n_heads: n_heads_local } = getTransformerConfig();
	let h = runSimpleForwardPass(contextTokens, weights, d_model, n_heads_local, n_layers);

	const h_final = h[h.length - 1]; // Last token's hidden state

	// 2. Project to Vocabulary (Logits)
	const vocab = [...new Set(tokens)];

	// ✅ FIX: Use the actual learned embeddings (weight tying) instead of
	// hash-based fake projection weights. This matches how calculate_tf_loss
	// computes logits:
	//     logits = tf.matMul(x, vars.embeddings.transpose())
	// and how render_final_projection does it:
	//     W_vocab = vocabulary.map(word => persistentEmbeddingSpace[word])
	let maxLogit = -Infinity;
	const logits = vocab.map(word => {
		const w_row = (window.persistentEmbeddingSpace && window.persistentEmbeddingSpace[word])
			? window.persistentEmbeddingSpace[word]
			: new Array(d_model).fill(0);

		const val = h_final.reduce((sum, v, i) => sum + v * w_row[i], 0);
		if (val > maxLogit) maxLogit = val;
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

/**
 * Checks if weights need reinitialization due to config changes,
 * and performs the reinit if necessary.
 * @returns {boolean} Whether a reinit was performed
 */
function handleWeightReinit(d_model, n_heads, n_layers) {
	const needsReinit = !window.currentWeights ||
		window.currentWeights.length !== n_layers ||
		window.last_d_model !== d_model ||
		window.last_n_heads !== n_heads;

	if (needsReinit) {
		window.currentWeights = get_init_weights(n_layers, d_model);
		window.last_d_model = d_model;
		window.last_n_heads = n_heads;
		reset_graph();
		calculate_vector_math();

		const migrationContainer = document.getElementById('transformer-migration-plots-container');
		if (migrationContainer) {
			migrationContainer.innerHTML = '';
			transformerLabVisMigrationDataRegistry.clear();
		}

		window.tlab_trajectory_collector = null;
		const oldTrajDiv = document.getElementById('transformer-trajectory-full-path');
		if (oldTrajDiv) oldTrajDiv.remove();
		trajectoryRenderRegistry.delete('transformer-trajectory-full-path');
	}

	return needsReinit;
}

/**
 * Renders all pre-attention visualizations: embedding space, positional
 * injection, positional waves, shift plot, and architecture stats.
 * @returns {number[][]} h0 — the positional-shift embeddings
 */
function renderPreAttentionVisualizations(knownTokens, trainingTokens, d_model, n_heads, n_layers, temperature) {
	window.persistentEmbeddingSpace = get_or_init_embeddings(trainingTokens, d_model);
	render_embedding_plot(d_model);
	tled_initEditor();

	calculate_positional_injection(knownTokens, d_model);
	render_positional_waves(d_model, knownTokens);

	const h0 = render_positional_shift_plot(knownTokens, d_model);

	render_architecture_stats(d_model, n_heads, n_layers, temperature);

	return h0;
}

/**
 * Prepares migration and trajectory state for a new forward pass.
 * Resets trajectory steps, marks migration entries for re-render,
 * and initializes the active migration ID set.
 */
function prepareMigrationState(needsReinit) {
	const migrationContainer = document.getElementById('transformer-migration-plots-container');
	if (migrationContainer && !needsReinit) {
		transformerLabVisMigrationDataRegistry.forEach((val, key) => {
			val.rendered = false;
		});
	}

	window._activeMigrationIds = new Set();

	if (window.tlab_trajectory_collector) {
		window.tlab_trajectory_collector.steps = {};
	}

	const oldTrajDiv = document.getElementById('transformer-trajectory-full-path');
	if (oldTrajDiv) {
		const trajEntry = trajectoryRenderRegistry.get('transformer-trajectory-full-path');
		if (trajEntry) {
			trajEntry.rendered = false;
		}
	}
}

/**
 * Runs the detailed Layer-0 forward pass with full visualization:
 * layer norm, multi-head attention, concatenation, projection,
 * residual connection, and FFN block.
 * @returns {number[][]} h2 — hidden states after layer 0
 */
function runVisualizedLayer0(h0, tokensWithPositional, knownTokens, weights, d_model, n_heads) {
	multiLayerAttentionRegistry.clear();

	const normH0 = calculateLayerNorm(h0, weights[0]["gamma"], weights[0]["beta"]);

	const headData = causalMultiHeadAttention(
		normH0,
		weights[0]["attention"],
		d_model,
		n_heads
	);

	const engine = new AttentionEngine({
		d_model: d_model,
		n_heads: n_heads,
		containerId: "mha-calculation-details",
		weights: weights[0]["attention"]
	});
	engine.forward(normH0, tokensWithPositional, knownTokens);

	const regEntry = attentionRenderRegistry.get("mha-calculation-details");
	if (regEntry) {
		regEntry.headData = headData;
		regEntry.rendered = false;
	}

	const multiHeadOutput = updateConcatenationDisplay(headData, tokensWithPositional);

	const Wo_layer0 = weights[0]["attention"]["output"];
	const projected = matMul(multiHeadOutput, Wo_layer0);

	const h1 = matAdd(h0, projected);

	render_h1_logic(h0, normH0, multiHeadOutput, weights[0]["gamma"], weights[0]["beta"], weights[0]["attention"]["output"]);

	const h2 = run_ffn_block(h1, weights[0]);

	return h2;
}

/**
 * Triggers the detailed attention rendering and path visualization
 * for the MHA calculation details container.
 */
function renderAttentionDetails() {
	const mhaContainer = document.getElementById('mha-calculation-details');
	if (mhaContainer) {
		const registryEntry = attentionRenderRegistry.get('mha-calculation-details');
		if (registryEntry) {
			registryEntry.rendered = false;
			const engineInstance = registryEntry.instance;
			engineInstance.executeActualRender(registryEntry.headData, registryEntry.tokens);

			const apvContainer = document.getElementById('attention-path-viz');
			if (apvContainer) {
				AttentionPathVisualizer.fromRegistry(
					'mha-calculation-details',
					'attention-path-viz',
					{ mode: 'headview' }
				);
			}
		}
	}
}

/**
 * Creates or updates the trajectory plot div, registers it for
 * lazy rendering, and renders immediately if already in viewport.
 */
function renderTrajectoryPlot(d_model) {
	if (!window.tlab_trajectory_collector) return;

	const containerId = 'transformer-trajectory-full-path';
	let trajDiv = document.getElementById(containerId);

	if (!trajDiv) {
		trajDiv = document.createElement('div');
		trajDiv.id = containerId;
		document.getElementById('transformer-migration-plots-container').appendChild(trajDiv);

		trajDiv.style.cssText = "width:100%; min-height:250px; border:2px dashed #cbd5e1; border-radius:12px; background:#f8fafc; display:flex; align-items:center; justify-content:center;";
		trajDiv.innerHTML = `<div class="traj-loading-placeholder" style="color:#94a3b8; font-size:0.95rem; padding:20px; text-align:center;">
			Rendering the Token Trajectory Plot may take a while
		</div>`;
	}

	trajectoryRenderRegistry.set(containerId, {
		d_model: d_model,
		rendered: false
	});

	trajectoryObserver.observe(trajDiv);

	if (isElementInViewport(trajDiv)) {
		tlab_render_trajectory_plot(d_model);
		const trajEntry = trajectoryRenderRegistry.get(containerId);
		if (trajEntry) trajEntry.rendered = true;
	}
}

/**
 * Removes migration plot DOM elements and registry entries
 * for layers that are no longer active.
 */
function pruneOrphanedMigrationPlots() {
	const migrationContainer = document.getElementById('transformer-migration-plots-container');
	if (!migrationContainer || !window._activeMigrationIds) return;

	const activeIds = window._activeMigrationIds;

	const keysToDelete = [];
	transformerLabVisMigrationDataRegistry.forEach((val, key) => {
		if (!activeIds.has(key)) {
			keysToDelete.push(key);
		}
	});
	keysToDelete.forEach(key => {
		const orphanDiv = document.getElementById(key);
		if (orphanDiv) {
			const wrapper = orphanDiv.closest('[data-migration-wrapper]') || orphanDiv.parentNode;
			if (wrapper && wrapper.parentNode) {
				wrapper.remove();
			}
		}

		const latexDiv = document.getElementById(key + '-latex-debug');
		if (latexDiv) latexDiv.remove();

		transformerLabVisMigrationDataRegistry.delete(key);
	});
}

/**
 * Main orchestrator: runs a complete forward pass through the transformer
 * and renders all visualizations.
 */
/**
 * Main orchestrator: runs a complete forward pass through the transformer
 * and renders all visualizations.
 */
function run_and_visualize_network(inputTokens, trainingTokens, masterTokens) {
    const config = getTransformerConfig();
    const { d_model, n_heads, temperature, n_layers } = config;

    const vocabulary = [...new Set(trainingTokens)];
    const knownTokens = getKnownTokensForVisualization(inputTokens, masterTokens, vocabulary);

    if (!validateModelDimensions(d_model, n_heads)) return;

    // 1. Reinitialize weights if config changed
    const needsReinit = handleWeightReinit(d_model, n_heads, n_layers);
    const weights = window.currentWeights;

    // 2. Pre-attention visualizations
    const h0 = renderPreAttentionVisualizations(knownTokens, trainingTokens, d_model, n_heads, n_layers, temperature);
    const tokensWithPositional = embedTokensWithPE(knownTokens, d_model);

    // 3. Prepare migration/trajectory state
    prepareMigrationState(needsReinit);

    // 4. Core forward pass + visualization
    renderForwardPassOrPlaceholder(tokensWithPositional, knownTokens, h0, weights, d_model, n_heads, n_layers);

    // 5. Final probabilities — ALWAYS based on master-token-input
    renderFinalProbabilities(masterTokens, vocabulary, weights, d_model, n_heads, n_layers, temperature);
}

/**
 * Determines which tokens to visualize based on the current toggle mode.
 */
function getKnownTokensForVisualization(inputTokens, masterTokens, vocabulary) {
    const vizMode = window.tlabVisualizationMode || 'train';
    const vizSourceTokens = (vizMode === 'inference') ? masterTokens : inputTokens;
    return vizSourceTokens.filter(token => vocabulary.includes(token));
}

/**
 * Validates that d_model is divisible by n_heads. Shows error if not.
 * @returns {boolean} true if valid
 */
function validateModelDimensions(d_model, n_heads) {
    if (d_model % n_heads !== 0) {
        const container = document.getElementById('transformer-output-projection');
        if (container) {
            container.innerHTML = `<div style="color:red; padding:20px;">Error: d_model (${d_model}) must be divisible by n_heads (${n_heads}).</div>`;
        }
        return false;
    }
    return true;
}

/**
 * Runs the forward pass with visualization if tokens exist,
 * otherwise shows a placeholder message.
 */
function renderForwardPassOrPlaceholder(tokensWithPositional, knownTokens, h0, weights, d_model, n_heads, n_layers) {
    if (tokensWithPositional.length === 0) {
        showEmptyInputMessage();
        return;
    }

    const h2 = runVisualizedLayer0(h0, tokensWithPositional, knownTokens, weights, d_model, n_heads);

    create_migration_plot('migration-layer-1', tokensWithPositional, h0, h2, 1, d_model, h2, knownTokens);

    run_deep_layers(h2, tokensWithPositional, n_layers, d_model, n_heads, weights, 1, knownTokens);

    renderAttentionDetails();
    renderTrajectoryPlot(d_model);
    pruneOrphanedMigrationPlots();
}

/**
 * Shows a message when no input tokens match the training vocabulary.
 */
function showEmptyInputMessage() {
    document.getElementById('transformer-output-projection').innerHTML =
        `<div style="padding:20px; color: #64748b; text-align:center;">
            Input words not found in Training Data.
        </div>`;
}

/**
 * Renders final prediction probabilities from the master token input.
 */
function renderFinalProbabilities(masterTokens, vocabulary, weights, d_model, n_heads, n_layers, temperature) {
    const knownMasterTokens = masterTokens.filter(token => vocabulary.includes(token));
    if (knownMasterTokens.length === 0) return;

    const h_final = runSimpleForwardPass(knownMasterTokens, weights, d_model, n_heads, n_layers);
    render_final_projection(h_final, vocabulary, d_model, temperature);
}

window.select_suggested_word = (word) => {
	const masterInput = document.getElementById('transformer-master-token-input');
	masterInput.value += " " + word;

	// Set master as active and re-run
	run_transformer_demo('transformer-master-token-input');
};

/**
 * Computes logits and sorted predictions from the final hidden state.
 * Pure computation — no DOM access.
 */
function computeFinalPredictions(h_last, vocabulary, d_model, temperature) {
    const W_vocab = vocabulary.map(word =>
        window.persistentEmbeddingSpace[word] || new Array(d_model).fill(0)
    );

    const logits = vocabulary.map((word, i) => {
        const w_row = W_vocab[i];
        let sum = 0;
        h_last.forEach((h_val, dim) => { sum += h_val * w_row[dim]; });
        return { word, val: sum, w_row };
    });

    const scaledLogits = logits.map(item => item.val / temperature);
    const probs = softmax(scaledLogits);

    const predictions = logits.map((item, i) => ({
        word: item.word, prob: probs[i], logit: item.val
    })).sort((a, b) => b.prob - a.prob);

    return { logits, predictions };
}

/**
 * Builds the clickable prediction chip HTML.
 */
function buildPredictionChipsHtml(predictions) {
    let html = `<h3>2. Final Probabilities (Click to Generate)</h3>`;
    html += `<div class="prediction-chip-container" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom: 10px;">`;

    predictions.forEach(p => {
        const intensity = Math.min(1, p.prob * 5);
        const safeWord = p.word.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        html += `<button class="predict-chip" onclick="select_suggested_word('${safeWord}')"
            style="background:rgba(59, 130, 246, ${intensity}); padding:8px 15px; border-radius:20px; border:1px solid #3b82f6; cursor:pointer; color: ${p.prob > 0.4 ? 'white' : 'black'}">
            <strong>${p.word}</strong> (${(p.prob * 100).toFixed(1)}%)
        </button>`;
    });

    html += `</div>`;
    return html;
}

/**
 * Builds the step-by-step logit calculation LaTeX HTML.
 */
function buildLogitDetailsHtml(h_last, logits) {
    let html = `<div style="margin-top: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
    <strong>Step-by-Step Logit Calculation</strong>
    <p>To get the logit for each word, we calculate the dot product between the final hidden state vector $h_\\text{last}$ and the word's learned embedding row $w_\\text{row}$ from the Unembedding Matrix $W_\\text{vocab}$. It really only uses the last row of the last calculation of the network, as that one is the last word the transformer has seen, and this one is used for the next word. The previous numbers in the last matrix are not used here per se, but they were needed to calculate this one in the attention and $W_\\text{FFN}$ matrices. They are just ignored in the last step, yet calculated because that is required by the structure</p>

    <span class="md">
To get from the long matrix to the single vector, the model performs a <strong>Terminal Selection</strong>.

If we represent the output of the last transformer block as a matrix $H$:
$$H = \\begin{pmatrix}
h_0 \\\\
h_1 \\\\
\\vdots \\\\
h_{n-1}
\\end{pmatrix} \\in \\mathbb{R}^{n \\times d_{\\text{model}}}$$

The "Migration Map" prints the entire flattened matrix because it wants to show the path of every word. However, the final projection is only interested in the <b>prediction</b>:

$$h_{\\text{last}} = H[n-1]$$

Remember that the $n$ is the number of tokens in the <b>Inference</b>-sequence, not in the training sequence, even though the $h_\\text{after}$ may be from the training data.
</span>

This single row $h_{\\text{last}}$ is a vector in $d_{\\text{model}}$ space. When the model is, for example, $d_{\\text{model}}=3$, it is always exactly 3 numbers (but in general, it's always $d_\\text{model}$). These 3 numbers are a "compressed summary" of the entire sequence's context, which is why the previous tokens can be "ignored" at this specific final stage, their influence is already baked into that last vector.

    <p style="margin-bottom: 10px; overflow: scroll;">Current $h_\\text{last} = [${h_last.map(v => v.toFixed(nr_fixed)).join(', ')}]$</p>
`;

    logits.forEach(({ word, val, w_row }) => {
        const terms = h_last.map((h_val, dim) =>
            `(${h_val.toFixed(nr_fixed)} \\cdot ${w_row[dim].toFixed(nr_fixed)})`
        );
        html += `<div style="margin-bottom: 10px; overflow: scroll;">
    $$\\text{logit}_{\\text{${word}}} = ${terms.join(' + ')} = ${val.toFixed(nr_fixed)}$$
        </div>`;
    });

    html += `</div>`;
    return html;
}

/**
 * Ensures the stable sub-containers exist inside the projection container.
 * Returns { chipsDiv, detailsDiv }.
 */
function ensureProjectionSubContainers(container) {
    let chipsDiv = document.getElementById('tlab-final-chips');
    let detailsDiv = document.getElementById('tlab-final-details');

    if (!chipsDiv || !detailsDiv) {
        container.innerHTML = `
            <div id="tlab-final-chips" style="position: sticky; top: 0; z-index: 10; background: #fff; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;"></div>
            <div id="tlab-final-details"></div>
        `;
        chipsDiv = document.getElementById('tlab-final-chips');
        detailsDiv = document.getElementById('tlab-final-details');
    }

    return { chipsDiv, detailsDiv };
}

/**
 * Renders the final output projection — now a clean orchestrator.
 */
function render_final_projection(h_final, vocabulary, d_model, temperature) {
    const container = document.getElementById('transformer-output-projection');
    if (!container) return;

    const h_last = h_final[h_final.length - 1];

    // 1. Pure computation
    const { logits, predictions } = computeFinalPredictions(h_last, vocabulary, d_model, temperature);

    // 2. Ensure DOM structure
    const { chipsDiv, detailsDiv } = ensureProjectionSubContainers(container);

    // 3. Always update chips
    chipsDiv.innerHTML = buildPredictionChipsHtml(predictions);

    // 4. Conditionally update details (avoid layout shifts during training)
    if (!window.isTraining || isElementInViewport(detailsDiv)) {
        detailsDiv.innerHTML = buildLogitDetailsHtml(h_last, logits);
    }

    render_temml();
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
	<div style="background: #e0f2fe; padding: 10px; border-radius: 8px; margin-top: 10px;">
	    <strong>Configuration:</strong> $d_{v} = ${dv}$, $N = ${n}$, $T = ${t}$ <br>
	    <em>Note: $T > 1.0$ increases randomness (flattens SoftMax), $T < 1.0$ makes predictions more confident.</em>
	</div>
    `;
	statsContainer.innerHTML = infoHtml;
}

function render_embedding_plot(dimensions, highlightPos = null, steps = []) {
	const containerId = 'transformer-plotly-space';
	const container = document.getElementById(containerId);
	if (!container) return;

	embeddingRenderRegistry.set(containerId, {
		d_model: dimensions,
		highlightPos: highlightPos,
		steps: steps,
		rendered: false
	});

	if (!container.innerHTML) {
		container.innerHTML = `<div style="padding:20px; color:#64748b;">Wait for Embedding Space to load...</div>`;
	}

	embeddingObserver.observe(container);

	// ── FIX: If already in viewport, render immediately ──
	if (isElementInViewport(container)) {
		_execute_embedding_render(dimensions, highlightPos, steps);
		const entry = embeddingRenderRegistry.get(containerId);
		if (entry) entry.rendered = true;
	}
}

// ── 3D Arrowhead geometry (extracted from _execute_embedding_render) ──

/**
 * Creates 3D arrowhead line traces forming a triangular cone at `tip`.
 * @param {number[]} from - Arrow origin [x, y, z]
 * @param {number[]} tip  - Arrow destination [x, y, z]
 * @param {string}   color
 * @param {number}   headLength
 * @returns {object[]} Array of Plotly scatter3d traces
 */
function make3DArrowhead(from, tip, color, headLength) {
    const dx = tip[0] - from[0];
    const dy = tip[1] - from[1];
    const dz = tip[2] - from[2];
    const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (mag < 1e-10) return [];

    const nx = dx / mag;
    const ny = dy / mag;
    const nz = dz / mag;

    const { perp1, perp2 } = computePerpendicularVectors(nx, ny, nz);

    const bx = tip[0] - nx * headLength;
    const by = tip[1] - ny * headLength;
    const bz = tip[2] - nz * headLength;

    const spread = headLength * 0.4;
    const nPetals = 3;
    const basePoints = computeArrowBasePoints(bx, by, bz, perp1, perp2, spread, nPetals);

    return [
        ...buildPetalToTipTraces(basePoints, tip, color, nPetals),
        ...buildBaseRingTraces(basePoints, color, nPetals)
    ];
}

/**
 * Finds two vectors perpendicular to a given normalized direction.
 */
function computePerpendicularVectors(nx, ny, nz) {
    let ax, ay, az;
    if (Math.abs(nx) < 0.9) {
        ax = 1; ay = 0; az = 0;
    } else {
        ax = 0; ay = 1; az = 0;
    }

    // Cross product: perp1 = direction × arbitrary
    let p1x = ny * az - nz * ay;
    let p1y = nz * ax - nx * az;
    let p1z = nx * ay - ny * ax;
    const p1mag = Math.sqrt(p1x * p1x + p1y * p1y + p1z * p1z);
    p1x /= p1mag; p1y /= p1mag; p1z /= p1mag;

    // Cross product: perp2 = direction × perp1
    let p2x = ny * p1z - nz * p1y;
    let p2y = nz * p1x - nx * p1z;
    let p2z = nx * p1y - ny * p1x;
    const p2mag = Math.sqrt(p2x * p2x + p2y * p2y + p2z * p2z);
    p2x /= p2mag; p2y /= p2mag; p2z /= p2mag;

    return {
        perp1: { x: p1x, y: p1y, z: p1z },
        perp2: { x: p2x, y: p2y, z: p2z }
    };
}

/**
 * Computes points around the base of an arrowhead cone.
 */
function computeArrowBasePoints(bx, by, bz, perp1, perp2, spread, nPetals) {
    const pts = [];
    for (let i = 0; i < nPetals; i++) {
        const angle = (2 * Math.PI * i) / nPetals;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        pts.push([
            bx + spread * (cos * perp1.x + sin * perp2.x),
            by + spread * (cos * perp1.y + sin * perp2.y),
            bz + spread * (cos * perp1.z + sin * perp2.z)
        ]);
    }
    return pts;
}

/**
 * Builds scatter3d line traces from each base point to the tip.
 */
function buildPetalToTipTraces(basePoints, tip, color, nPetals) {
    const traces = [];
    for (let i = 0; i < nPetals; i++) {
        traces.push({
            type: 'scatter3d',
            x: [basePoints[i][0], tip[0]],
            y: [basePoints[i][1], tip[1]],
            z: [basePoints[i][2], tip[2]],
            mode: 'lines',
            line: { color, width: 6 },
            hoverinfo: 'skip',
            showlegend: false
        });
    }
    return traces;
}

/**
 * Connects adjacent base points to form the triangular ring.
 */
function buildBaseRingTraces(basePoints, color, nPetals) {
    const traces = [];
    for (let i = 0; i < nPetals; i++) {
        const j = (i + 1) % nPetals;
        traces.push({
            type: 'scatter3d',
            x: [basePoints[i][0], basePoints[j][0]],
            y: [basePoints[i][1], basePoints[j][1]],
            z: [basePoints[i][2], basePoints[j][2]],
            mode: 'lines',
            line: { color, width: 6 },
            hoverinfo: 'skip',
            showlegend: false
        });
    }
    return traces;
}

/**
 * Builds Plotly traces for vocabulary token points.
 * Works for 1D, 2D, and 3D.
 */
function buildVocabPointTraces(tokens, is3D) {
    return tokens.map(token => {
        const vec = window.persistentEmbeddingSpace[token];
        const trace = {
            x: [vec[0]],
            y: [vec.length >= 2 ? vec[1] : 0],
            mode: 'markers+text',
            text: [token],
            textposition: 'top center',
            name: token,
            marker: { size: is3D ? 6 : 8, opacity: 0.85 },
            cliponaxis: false,
            type: is3D ? 'scatter3d' : 'scatter'
        };
        if (is3D) trace.z = [vec[2]];
        return trace;
    });
}

/**
 * Builds Plotly traces and annotations for calculation step arrows.
 */
function buildStepArrowTraces(steps, dimensions, is3D) {
    const traces = [];
    const annotations = [];
    const arrowColor = '#3b82f6';

    steps.forEach(step => {
        if (is3D) {
            traces.push(...build3DArrowTraces(step, arrowColor));
        } else {
            annotations.push(build2DAnnotationArrow(step, dimensions, arrowColor));
            traces.push(build2DHoverMarker(step, dimensions, arrowColor));
        }
    });

    return { traces, annotations };
}

function build3DArrowTraces(step, arrowColor) {
    const traces = [];

    // Line shaft
    traces.push({
        type: 'scatter3d',
        x: [step.from[0], step.to[0]],
        y: [step.from[1], step.to[1]],
        z: [step.from[2], step.to[2]],
        mode: 'lines',
        line: { color: arrowColor, width: 5 },
        hoverinfo: 'text',
        text: [step.label, step.label],
        showlegend: false
    });

    // Arrowhead
    const dx = step.to[0] - step.from[0];
    const dy = step.to[1] - step.from[1];
    const dz = step.to[2] - step.from[2];
    const arrowLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const headLen = Math.min(arrowLen * 0.25, 0.5);
    traces.push(...make3DArrowhead(step.from, step.to, arrowColor, headLen));

    // Midpoint hover label
    traces.push({
        type: 'scatter3d',
        x: [(step.from[0] + step.to[0]) / 2],
        y: [(step.from[1] + step.to[1]) / 2],
        z: [(step.from[2] + step.to[2]) / 2],
        mode: 'markers',
        marker: { size: 4, color: 'rgba(59,130,246,0.01)' },
        text: [step.label],
        hovertemplate: '<b>%{text}</b><extra></extra>',
        showlegend: false
    });

    return traces;
}

function build2DAnnotationArrow(step, dimensions, arrowColor) {
    return {
        ax: step.from[0],
        ay: dimensions >= 2 ? step.from[1] : 0,
        axref: 'x', ayref: 'y',
        x: step.to[0],
        y: dimensions >= 2 ? step.to[1] : 0,
        xref: 'x', yref: 'y',
        showarrow: true,
        arrowhead: 2, arrowsize: 1.5,
        arrowwidth: 3, arrowcolor: arrowColor
    };
}

function build2DHoverMarker(step, dimensions, arrowColor) {
    return {
        type: 'scatter',
        x: [(step.from[0] + step.to[0]) / 2],
        y: [((dimensions >= 2 ? step.from[1] : 0) + (dimensions >= 2 ? step.to[1] : 0)) / 2],
        mode: 'markers',
        marker: { size: 12, color: 'rgba(59,130,246,0.01)' },
        text: [step.label],
        hovertemplate: '<b>%{text}</b><extra></extra>',
        showlegend: false,
        cliponaxis: false
    };
}

/**
 * Builds the red diamond highlight trace for a result position.
 */
function buildResultHighlightTrace(highlightPos, dimensions, is3D) {
    const trace = {
        x: [highlightPos[0]],
        y: [dimensions >= 2 ? highlightPos[1] : 0],
        mode: 'markers',
        marker: { size: is3D ? 10 : 14, color: '#ef4444', symbol: 'diamond' },
        name: 'Result',
        showlegend: false,
        type: is3D ? 'scatter3d' : 'scatter',
        hovertemplate: is3D
            ? '<b>Result</b><br>(%{x:.4f}, %{y:.4f}, %{z:.4f})<extra></extra>'
            : '<b>Result</b><br>(%{x:.4f}, %{y:.4f})<extra></extra>'
    };
    if (is3D) trace.z = [highlightPos[2]];
    return trace;
}

/**
 * Renders the embedding space for d_model <= 3 using Plotly.
 */
function renderLowDimEmbeddingPlot(container, tokens, dimensions, highlightPos, steps) {
	const is3D = (dimensions === 3);
	const traces = [];
	const annotations = [];

	// Vocabulary points
	traces.push(...buildVocabPointTraces(tokens, is3D));

	// Step arrows
	const arrowResult = buildStepArrowTraces(steps, dimensions, is3D);
	traces.push(...arrowResult.traces);
	annotations.push(...arrowResult.annotations);

	// Result highlight
	if (highlightPos) {
		traces.push(buildResultHighlightTrace(highlightPos, dimensions, is3D));
	}

	// Layout
	const layout = {
		title: "Embedding Space",
		showlegend: false,
		annotations
	};

	if (is3D) {
		layout.scene = {
			xaxis: { title: 'Dim 0' },
			yaxis: { title: 'Dim 1' },
			zaxis: { title: 'Dim 2' }
		};
	} else {
		layout.xaxis = { title: 'Dim 0' };
		layout.yaxis = { title: dimensions >= 2 ? 'Dim 1' : '' };
	}

	Plotly.react(container, traces, layout);
}

/**
 * Renders the embedding space for d_model >= 4 using ECharts parallel coordinates.
 */
function renderHighDimEmbeddingPlot(container, tokens, dimensions) {
    const myChart = echarts.init(container);
    const parallelAxis = Array.from({ length: dimensions }, (_, i) => ({
        dim: i, name: `D${i}`
    }));

    const data = tokens.map(token => ({
        name: token,
        value: window.persistentEmbeddingSpace[token]
    }));

    myChart.setOption({
        title: { text: "Embedding Space", left: 'center' },
        tooltip: { trigger: 'item', formatter: p => `Token: <b>${p.name}</b>` },
        parallelAxis,
        parallel: { left: 40, right: 40, bottom: 20, top: 50 },
        series: [{
            type: 'parallel',
            data,
            lineStyle: { width: 2, opacity: 0.5, color: '#6366f1' },
            emphasis: { lineStyle: { width: 6, color: '#f59e0b' } }
        }]
    });

    myChart.resize();
}

/**
 * Main embedding render — now a clean dispatcher.
 */
function _execute_embedding_render(dimensions, highlightPos = null, steps = []) {
    const container = document.getElementById('transformer-plotly-space');
    if (!container) return;

    Plotly.purge(container);
    const existingChart = echarts.getInstanceByDom(container);
    if (existingChart) existingChart.dispose();
    container.innerHTML = '';

    const tokens = Object.keys(window.persistentEmbeddingSpace);

    if (dimensions <= 3) {
        renderLowDimEmbeddingPlot(container, tokens, dimensions, highlightPos, steps);
    } else {
        renderHighDimEmbeddingPlot(container, tokens, dimensions);
    }
}

// Updated Tokenizer to allow different containers
/**
 * Tokenizes text based on the selected tokenizer type.
 * Pure computation — no DOM access.
 */
function tokenizeText(text, type) {
    if (type === 'bpe') {
        const words = text.match(/\S+|\s+/g) || [];
        return words.flatMap(word => {
            if (word.length > 4) {
                return word.match(/.{1,3}/g);
            }
            return word;
        });
    }
    return text.match(/[\w]+|[^\w\s]/g) || [];
}

/**
 * Generates a stable hash-based hue for a token string.
 */
function getTokenHue(token) {
    const hash = token.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
    return Math.abs(hash) % 360;
}

/**
 * Renders token chips into a container element.
 */
function renderTokenChips(container, tokens) {
    if (!container) return;

    container.innerHTML = tokens.map(t => {
        const hue = getTokenHue(t);
        const id = Math.abs(t.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)) % 1000;
        return `
        <div style="background: hsl(${hue}, 65%, 40%); color: white; padding: 5px 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 0.85rem; display: flex; flex-direction: column; align-items: center;">
            ${t}
            <span style="font-size: 0.6rem; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.2); width: 100%; text-align: center;">ID: ${id}</span>
        </div>`;
    }).join('');
}

/**
 * Refactored: tokenizes and optionally renders.
 */
function transformer_tokenize_render(text, containerId = "transformer-viz-bpe") {
    const typeElement = document.getElementById('transformer-tokenizer-type');
    const type = typeElement ? typeElement.value : 'regex';

    const tokens = tokenizeText(text, type);

    const container = document.getElementById(containerId);
    renderTokenChips(container, tokens);

    return tokens;
}

/**
 * FIX: Updated to display Pre-LN architecture (matching actual computation).
 * Old version showed Post-LN: h1 = h0 + LayerNorm(MHA_proj)
 * New version shows Pre-LN:   normH0 = LayerNorm(h0), then h1 = h0 + Attention(normH0) × Wo
 *
 * NEW SIGNATURE: Added normH0 as second parameter.
 */
function render_h1_logic(h0, normH0, multiHeadOutput, gamma, beta, WO) {
	const normContainer = document.getElementById('transformer-h1-layernorm-viz');
	const finalContainer = document.getElementById('transformer-h1-final-viz');
	if (!normContainer || !finalContainer || !gamma || !beta || !WO) return;

	// Project the Multi-Head Output using WO
	const projectedMHA = multiHeadOutput.map(row =>
		WO[0].map((_, i) => row.reduce((acc, _, j) => acc + row[j] * WO[j][i], 0))
	);

	// h1 = h0 + projected (Pre-LN: no normalization on the sublayer output)
	const h1 = matAdd(h0, projectedMHA);

	// ── FIX: Display Pre-LN steps instead of Post-LN ──
	normContainer.innerHTML = `
	<p style="font-weight:bold; color:#065f46;">Pre-Layer Normalization (applied <em>before</em> the sublayer)</p>

	<div style="margin-bottom:15px;">
	    <p style="font-size:0.85rem; color:#1e40af;">1. Normalize $h_0$ before attention:</p>
	    $$ \\text{LayerNorm}(h_0) = \\underbrace{\\gamma}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} \\underbrace{\\odot}_{\\substack{\\text{Hadamard} \\\\ \\text{Product}}} \\frac{h_0 - \\underbrace{\\mu}_{\\text{Mean of } h_0}}{\\sqrt{\\underbrace{\\sigma^2}_{\\text{Variance of } h_0}} + \\underbrace{\\epsilon}_{${epsilon}}} + \\underbrace{\\beta}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} $$
	    <div style="overflow-x:auto;">
		$$ \\underbrace{${matrixToPmatrix(normH0)}}_{\\text{LayerNorm}\\left(h_0\\right)} = \\text{LayerNorm}\\!\\left(\\underbrace{${matrixToPmatrix(h0)}}_{h_0},\\; \\underbrace{${vecToPmatrix(gamma)}}_\\gamma,\\; \\underbrace{${vecToPmatrix(beta)}}_\\beta\\right) $$
		<br>
	    </div>
	</div>

	<div style="margin-bottom:15px;">
	    <p style="font-size:0.85rem; color:#1e40af;">2. Output projection $W^O$ mixes head outputs:</p>
	    $$ \\text{MHA}_{\\text{proj}} = \\text{Concat}(\\text{Heads}) \\cdot W^O $$
	    <div style="overflow-x:auto;">
		$$ \\underbrace{${matrixToPmatrix(projectedMHA)}}_{\\text{MHA}_\\text{proj}} = \\underbrace{${matrixToPmatrix(multiHeadOutput)}}_{\\text{Concat}\\left(\\text{Heads}\\right)} \\cdot \\underbrace{${matrixToPmatrix(WO)}}_{W^O} $$
	    </div>
	</div>
    `;

	finalContainer.innerHTML = `
    <div style="margin-bottom:10px;">
	<p style="font-size:0.85rem; color:#1e40af;">3. Residual connection (Pre-LN: no normalization on sublayer output):</p>
	$$ h_1 = h_0 + \\text{MHA}_{\\text{proj}} $$
    </div>
    <div style="overflow-x:auto;">
	$$ \\underbrace{${matrixToPmatrix(h1)}}_{h_1} = \\underbrace{${matrixToPmatrix(h0)}}_{h_0} + \\underbrace{${matrixToPmatrix(projectedMHA)}}_{\\text{MHA}_{\\text{proj}}} $$
    </div>
    `;

	render_temml();
	return h1;
}

/**
 * Algorithm: Block Matrix Concatenation
 * Returns: Array (Matrix of Tokens x d_model)
 */
function updateConcatenationDisplay(headData, tokens) {
	const container = document.getElementById('transformer-concat-viz');
	if (!container || !headData.length) return [];

	const headMatricesLaTeX = headData.map((h, i) => {
		return `\\underbrace{${matrixToPmatrix(h.context)}}_{\\text{Head } ${i + 1}}`;
	}).join(', ');

	// Perform the actual numerical concatenation
	const fullMatrixData = tokens.map((_, tIdx) => {
		return [].concat(...headData.map(h => h.context[tIdx]));
	});

	const finalMatrixLaTeX = `\\underbrace{${matrixToPmatrix(fullMatrixData)}}_{\\text{Total } d_{\\text{model}}}`;
	container.innerHTML = `$$ \\text{Concat} \\left( \\left[ ${headMatricesLaTeX} \\right] \\right) = ${finalMatrixLaTeX} $$`;

	render_temml();

	return fullMatrixData; // Now returns the calculated value
}

function calculateLayerNorm(matrix, gamma, beta) {
	return matrix.map(row => {
		const mean = row.reduce((a, b) => a + b, 0) / row.length;
		const variance = row.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / row.length;

		return row.map((val, i) => {
			const standardized = (val - mean) / Math.sqrt(variance + epsilon);
			return standardized * gamma[i] + beta[i];
		});
	});
}

function validateShape(name, data, expectedRows, expectedCols) {
	if (!data) return false;
	const actualRows = data.length;
	const actualCols = Array.isArray(data[0]) ? data[0].length : 1;

	if (actualRows !== expectedRows || actualCols !== expectedCols) {
		throw new Error(`Shape Mismatch for ${name}: Expected [${expectedRows}, ${expectedCols}], got [${actualRows}, ${actualCols}]`);
	}
	return true;
}

function assertShape(name, value, expected_rows, expected_cols) {
        try {
                validateShape(name, value, expected_rows, expected_cols);
                return value;
        } catch (err) {
                throw new Error(
                        `${name} has invalid shape. Expected ${expected_rows}x${expected_cols}.`
                );
        }
}

function run_ffn_block(h1, params = {}, skipRender = false) {
	const d_model = h1[0].length;
	const d_ff = d_model * 4;

	let W1 = assertShape('W1', params.W1, d_model, d_ff);
	let b1 = assertShape('b1', params.b1, d_ff, 1);
	let W2 = assertShape('W2', params.W2, d_ff, d_model);
	let b2 = assertShape('b2', params.b2, d_model, 1);
	let gamma2 = params.gamma2 || new Array(d_model).fill(1.0);
	let beta2 = params.beta2 || new Array(d_model).fill(0.0);

	// Pre-LN: normalize h1 BEFORE FFN
	const normed_h1 = calculateLayerNorm(h1, gamma2, beta2);

	const out_L1 = matMul(normed_h1, W1, b1).map(row => row.map(v => Math.max(0, v)));

	const out_FFN = matMul(out_L1, W2, b2);

	// Residual: h2 = h1 + FFN(normed_h1), no post-norm
	const h2 = matAdd(h1, out_FFN);

	if (!skipRender) {
		render_ffn(h1, normed_h1, W1, b1, out_L1, W2, b2, out_FFN, h2, gamma2, beta2);
	}

	return h2;
}

function render_ffn(h1, normed_h1, W1, b1, out_L1, W2, b2, out_FFN, h2, gamma, beta) {
	document.getElementById('ffn-step-1').innerHTML = `
    <div style="margin-bottom:15px; padding:10px; border:1px solid #10b981; border-radius:8px; background:#ecfdf5;">
	<p style="font-size:0.85rem; color:#065f46;"><strong>Pre-LN:</strong> Normalize $h_1$ before FFN</p>
	$$ \\text{LayerNorm}(h_1) = \\underbrace{\\gamma_{\\text{ffn}}}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} \\underbrace{\\odot}_{\\substack{\\text{Hadamard} \\\\ \\text{Product}}} \\frac{h_1 - \\underbrace{\\mu}_{\\text{Mean of } h_1}}{\\sqrt{\\underbrace{\\sigma^2}_{\\text{Variance of } h_1} + \\underbrace{${epsilon}}_\\epsilon}} + \\underbrace{\\beta_{\\text{ffn}}}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} $$
	<div style="overflow-x:auto;">
	    $$ \\underbrace{${matrixToPmatrix(normed_h1)}}_{\\text{Norm}\\left(h_1\\right)} = \\text{LayerNorm}\\!\\left(\\underbrace{${matrixToPmatrix(h1)}}_{h_1},\\; \\underbrace{${vecToPmatrix(gamma)}}_\\gamma,\\; \\underbrace{${vecToPmatrix(beta)}}_\\beta\\right) $$
		<br>
	</div>
    </div>
    $$ \\text{out}_{L1} = \\text{ReLU}\\!\\left(\\text{Norm}(h_1) \\cdot W_1 + b_1\\right) = \\underbrace{${matrixToPmatrix(out_L1)}}_{\\text{out}_{L1}} $$
    `;

	document.getElementById('ffn-step-2').innerHTML = `
    $$ \\text{out}_{L2} = \\text{out}_{L1} \\cdot W_2 + b_2 = \\underbrace{${matrixToPmatrix(out_FFN)}}_{\\text{Out}_\\text{FFN}} $$
    `;

	document.getElementById('ffn-step-3').innerHTML = `
    <div style="margin-bottom:10px;">
	<p style="font-size:0.85rem; color:#1e40af;"><strong>Residual connection</strong> (Pre-LN: no normalization on sublayer output):</p>
	$$ h_2 = h_1 + \\text{out}_{L2} $$
    </div>
    <div style="overflow-x:auto;">
	$$ \\underbrace{${matrixToPmatrix(h2)}}_{h_2} = \\underbrace{${matrixToPmatrix(h1)}}_{h_1} + \\underbrace{${matrixToPmatrix(out_FFN)}}_{\\text{out}_{L2}} $$
    </div>
    `;

	render_temml();
}

/**
 * Goal: Unified N-Layer Trajectory Plotting
 * Logic: Every iteration i maps to Layer i+1 Plot
 */
/**
 * Goal: Unified N-Layer Trajectory Plotting
 * Logic: Every iteration i maps to Layer i+1 Plot
 * @param {string[]} [tokenStrings] - Human-readable token strings for labeling
 */
function run_deep_layers(h_initial, tokens, total_depth, d_model, n_heads, this_weights, startLayer = 0, tokenStrings = null) {
	let h_current = h_initial;

	for (let n = startLayer; n < total_depth; n++) {
		const h_before_layer = JSON.parse(JSON.stringify(h_current));

		const result = forwardOneLayer(h_current, this_weights[n], d_model, n_heads, tokenStrings, "mha-calculation-details");

		create_migration_plot(`migration-layer-${n + 1}`, tokens, h_before_layer, result.h_out, n + 1, d_model, result.h_out, tokenStrings);
		tlab_render_weight_grid(`migration-layer-${n + 1}`, n);

		h_current = result.h_out;
	}

	return h_current;
}

/**
 * Global Registry for Deferred Rendering
 * Stores the latest data for each plot ID to ensure that when it
 * becomes visible, it renders with the most recent calculation.
 */

function create_migration_plot(id, tokens, start_h, end_h, layerNum, d_model, h_after, tokenStrings) {
    const container = document.getElementById('transformer-migration-plots-container');
    if (!container) return;

    // Track this ID as active for orphan cleanup
    if (window._activeMigrationIds) {
        window._activeMigrationIds.add(id);
    }

    // Resolve human-readable display names for each token position
    const displayTokens = (tokenStrings && tokenStrings.length === tokens.length)
        ? tokenStrings
        : tokens.map((t, i) => {
            if (typeof t === 'string') return t;
            return tlab_get_top_word_only(t);
        });

    const freeze = (data) => JSON.parse(JSON.stringify(data));

    // ── Eagerly capture trajectory data (not deferred to render) ──
    if (!window.tlab_trajectory_collector) {
        window.tlab_trajectory_collector = {
            steps: {},
            tokens: [...tokens],
            displayTokens: [...displayTokens],
            d_model: d_model
        };
    }

    // Capture initial states on the very first layer
    if (!window.tlab_trajectory_collector.steps["00_raw"]) {
        const rawEmbs = displayTokens.map(t => {
            if (window.persistentEmbeddingSpace && window.persistentEmbeddingSpace[t]) {
                return window.persistentEmbeddingSpace[t];
            }
            return new Array(d_model).fill(0);
        });

        window.tlab_trajectory_collector.steps["00_raw"] = {
            name: "Original Embedding",
            data: freeze(rawEmbs)
        };
        window.tlab_trajectory_collector.steps["01_pe"] = {
            name: "Embedding + Position",
            data: freeze(start_h)
        };
    }

    // Capture this layer's output
    const layerKey = "02_layer_" + String(layerNum).padStart(2, '0');
    window.tlab_trajectory_collector.steps[layerKey] = {
        name: `Layer ${layerNum} Output`,
        data: freeze(end_h)
    };

    // ── REUSE existing DOM element, only create if it doesn't exist yet ──
    let plotDiv = document.getElementById(id);
    if (!plotDiv) {
        const wrapperDiv = document.createElement('div');
        wrapperDiv.style.cssText = "border: 2px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-top: 30px; background: #fff;";
        wrapperDiv.setAttribute('data-migration-wrapper', id);

        plotDiv = document.createElement('div');
        plotDiv.id = id;
        plotDiv.style.cssText = "height: 500px; width: 100%;";

        wrapperDiv.appendChild(plotDiv);
        container.appendChild(wrapperDiv);

        migrationObserver.observe(plotDiv);
    }

    // Update the registry with fresh data; mark as not yet rendered
    transformerLabVisMigrationDataRegistry.set(id, {
        tokens: [...tokens],
        start_h: Array.isArray(start_h) ? start_h.slice() : start_h,
        end_h: Array.isArray(end_h) ? end_h.slice() : end_h,
        layerNum: layerNum,
        d_model: d_model,
        h_after: h_after,
        tokenStrings: tokenStrings || null,
        rendered: false
    });

    // ── IMMEDIATE RENDER if the element is already visible ──
    // This is the key fix: instead of waiting for the IntersectionObserver
    // (which may not fire if the element is already in the viewport),
    // we check visibility and render immediately.
    if (isElementInViewport(plotDiv)) {
        render_migration_logic(id, tokens, start_h, end_h, layerNum, d_model, h_after, tokenStrings);
        const entry = transformerLabVisMigrationDataRegistry.get(id);
        if (entry) entry.rendered = true;
    }
}

/**
 * Helper: Check if an element is currently visible in the viewport.
 * Used to decide whether to render immediately or defer to the observer.
 */
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
        rect.bottom > 0 &&
        rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
        rect.right > 0
    );
}

/**
 * Maps a weight value to a colorblind-friendly scale (Blue to Yellow).
 * Low/Negative = Blue, Neutral = Teal, High/Positive = Yellow.
 */
function tlab_get_colorblind_pixel(val) {
	// Clamp value between -1 and 1
	const t = Math.max(0, Math.min(1, (val + 1) / 2));

	// Simple Blue-Yellow transition (Cividis-like)
	// t=0 (Blueish): 0, 32, 77
	// t=1 (Yellow): 255, 255, 0
	const r = Math.floor(t * 255);
	const g = Math.floor(32 + t * 223);
	const b = Math.floor(77 * (1 - t));

	return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Renders weight matrices side-by-side, stretching them to fill the full width.
 */
function tlab_render_weight_grid(id, layerNum) {
    requestAnimationFrame(() => {
        const plotDiv = document.getElementById(id);
        if (!plotDiv || !window.currentWeights || !window.currentWeights[layerNum]) return;

        if (window._activeMigrationIds) {
            window._activeMigrationIds.add(id);
        }

        const gridBox = ensureWeightGridContainer(plotDiv);
        const targets = getWeightTargets(layerNum);

        targets.forEach(target => renderSingleWeightCanvas(gridBox, target));
        removeOrphanedWeightWrappers(gridBox, targets);
    });
}

/**
 * Ensures the weight grid container and row exist, creating them if needed.
 * @returns {HTMLElement} The grid row element
 */
function ensureWeightGridContainer(plotDiv) {
    let weightContainer = plotDiv.nextElementSibling;
    if (!weightContainer || !weightContainer.classList.contains('weight-grid-viz')) {
        weightContainer = document.createElement('div');
        weightContainer.className = 'weight-grid-viz';
        weightContainer.style = "display: flex; flex-direction: column; align-items: center; margin: 40px 0; padding: 0; clear: both; width: 100%;";
        plotDiv.parentNode.insertBefore(weightContainer, plotDiv.nextSibling);
    }

    let gridBox = weightContainer.querySelector('.weight-grid-row');
    if (!gridBox) {
        gridBox = document.createElement('div');
        gridBox.className = 'weight-grid-row';
        gridBox.style = "display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; gap: 10px; width: 100%;";
        weightContainer.appendChild(gridBox);
    }

    return gridBox;
}

/**
 * Extracts the weight matrices to visualize for a given layer.
 */
function getWeightTargets(layerNum) {
    const weights = window.currentWeights[layerNum];
    return [
        { name: 'W1', data: weights.W1 },
        { name: 'W2', data: weights.W2 },
        { name: 'Q',  data: weights.attention?.query },
        { name: 'K',  data: weights.attention?.key },
        { name: 'V',  data: weights.attention?.value }
    ].filter(t => t.data && t.data.length);
}

/**
 * Renders (or updates) a single weight matrix as a pixel canvas.
 */
function renderSingleWeightCanvas(gridBox, target) {
    const rows = target.data.length;
    const cols = Array.isArray(target.data[0]) ? target.data[0].length : 1;

    let wrap = gridBox.querySelector(`[data-weight-name="${target.name}"]`);
    let canvas;

    if (!wrap) {
        wrap = document.createElement('div');
        wrap.setAttribute('data-weight-name', target.name);
        wrap.style = "text-align: center; flex: 1 1 0%; display: flex; flex-direction: column; min-width: 0px;";
        wrap.innerHTML = `<div style="font-size: 10px; font-weight: bold; color: #94a3b8; margin-bottom: 5px; font-family: monospace; white-space: nowrap;">${target.name}</div>`;

        canvas = document.createElement('canvas');
        canvas.style.cssText = "width:100%; height:auto; image-rendering:pixelated; display:block; max-height:145px; outline:1px solid #f1f5f9;";
        wrap.appendChild(canvas);
        gridBox.appendChild(wrap);
    } else {
        canvas = wrap.querySelector('canvas');
    }

    if (canvas.width !== cols || canvas.height !== rows) {
        canvas.width = cols;
        canvas.height = rows;
    }

    paintWeightPixels(canvas, target.data, rows, cols);
}

/**
 * Paints weight values as colored pixels onto a canvas.
 */
function paintWeightPixels(canvas, data, rows, cols) {
    const ctx = canvas.getContext('2d');
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = Array.isArray(data[r]) ? data[r][c] : data[r];
            ctx.fillStyle = tlab_get_colorblind_pixel(val);
            ctx.fillRect(c, r, 1, 1);
        }
    }
}

/**
 * Removes weight wrapper elements that no longer correspond to active matrices.
 */
function removeOrphanedWeightWrappers(gridBox, targets) {
    const activeNames = new Set(targets.map(t => t.name));
    gridBox.querySelectorAll('[data-weight-name]').forEach(el => {
        if (!activeNames.has(el.getAttribute('data-weight-name'))) {
            el.remove();
        }
    });
}

/**
 * Sub-function: ECharts with Position Visual Map
 * Cite: Based on Apache ECharts visualMap and parallel coordinates
 */
function tlab_render_echarts(plotDiv, tokens, start_h, end_h, layerNum, d_model, isLastLayer, nextWordIndex) {
	const myChart = echarts.init(plotDiv);

	const axes = Array.from({ length: d_model }, (_, i) => ({
		dim: i, name: `Dim ${i}`
	}));

	// Prepare data with position index as the last dimension for visualMap
	const data = tokens.map((token, i) => {
		const sourceWord = tlab_get_top_word_only(start_h[i]);
		const destWord = tlab_get_top_word_only(end_h[i]);
		return {
			value: [...end_h[i], i + 1], // Attach position as an extra dimension
			name: token,
			source: sourceWord,
			destination: destWord,
			pos: i + 1
		};
	});

	myChart.setOption({
		title: { text: `Layer ${layerNum} Migration`, left: 'center' },
		tooltip: {
			trigger: 'item',
			formatter: p => `From '${p.data.source}' to '${p.data.destination}', position ${p.data.pos}`
		},
		// 4. Color -> Position Gradient Legend
		visualMap: {
			type: 'continuous',
			min: 1,
			max: tokens.length,
			dimension: d_model, // Use the position dimension we attached above
			orient: 'horizontal',
			bottom: 10,
			left: 'center',
			text: ['End Position', 'Start Position'],
			inRange: { color: ['rgb(59, 130, 246)', 'rgb(16, 185, 129)'] }
		},
		parallelAxis: axes,
		series: [{
			type: 'parallel',
			data: data,
			lineStyle: { width: 2, opacity: 0.7 }
		}]
	});
}

// Ensure this exists at the top level of your script
if (!window.tlab_trajectory_data) {
	window.tlab_trajectory_data = { tokens: [], steps: [] };
}

function render_migration_logic(id, tokens, start_h, end_h, layerNum, d_model, h_after, tokenStrings) {
	const plotDiv = document.getElementById(id);
	if (!plotDiv) return;

	// Ensure consistent container size
	plotDiv.style.width = '100%';
	plotDiv.style.minHeight = '500px'; // Fixed height to prevent layout shifts

	const nextWordIndex = tokens.length - 1;
	const migrationContainers = document.querySelectorAll('[id^="migration-layer-"]');
	const totalLayersCount = migrationContainers.length;
	const isLastInDom = totalLayersCount > 0 && migrationContainers[totalLayersCount - 1].id === id;

	if (d_model <= 3) {
		// Use Plotly.react for smoother updates
		tlab_render_plotly_react(id, tokens, start_h, end_h, layerNum, d_model, isLastInDom, nextWordIndex);
	} else {
		tlab_render_echarts(plotDiv, tokens, start_h, end_h, layerNum, d_model, isLastInDom, nextWordIndex);
	}

	tlab_render_latex_matrix(id, plotDiv, tokens, start_h, end_h, h_after, d_model);
	tlab_render_weight_grid(id, layerNum - 1);
}

/**
 * Builds a single token's migration traces (line + arrowhead).
 */
function buildMigrationTokenTrace(token, i, start_h, end_h, d_model, is3D, tokens) {
    const posColor = getPositionColor(i, tokens.length);
    const sourceWord = tlab_get_top_word_only(start_h[i]);
    const destWord = tlab_get_top_word_only(end_h[i]);
    const hoverLabel = `From '${sourceWord}' to '${destWord}', position ${i + 1}`;

    const x = [start_h[i][0], end_h[i][0]];
    const y = d_model >= 2 ? [start_h[i][1], end_h[i][1]] : [0, 0];

    if (is3D) {
        return buildMigration3DTraces(x, y, start_h[i], end_h[i], posColor, hoverLabel);
    } else {
        return buildMigration2DTraces(x, y, posColor, hoverLabel);
    }
}

function buildMigration3DTraces(x, y, startVec, endVec, posColor, hoverLabel) {
    const z = [startVec[2], endVec[2]];
    return [
        {
            type: 'scatter3d',
            x, y, z,
            mode: 'lines',
            line: { width: 4, color: posColor },
            showlegend: false,
            hovertemplate: `${hoverLabel}<extra></extra>`
        },
        {
            type: 'cone',
            x: [x[1]], y: [y[1]], z: [z[1]],
            u: [x[1] - x[0]], v: [y[1] - y[0]], w: [z[1] - z[0]],
            sizemode: 'absolute',
            sizeref: 0.15,
            anchor: 'tip',
            colorscale: [[0, posColor], [1, posColor]],
            showscale: false,
            hoverinfo: 'skip',
            showlegend: false
        }
    ];
}

function buildMigration2DTraces(x, y, posColor, hoverLabel) {
    return [
        {
            type: 'scatter',
            x, y,
            mode: 'lines+markers',
            line: { width: 2, color: posColor },
            marker: { size: [0, 12], symbol: 'arrow', angleref: 'previous', color: posColor },
            showlegend: false,
            hovertemplate: `${hoverLabel}<extra></extra>`
        }
    ];
}

/**
 * Builds the invisible colorbar reference trace.
 */
function buildMigrationColorbarTrace(is3D, tokens) {
    const trace = {
        type: is3D ? 'scatter3d' : 'scatter',
        x: [null], y: [null],
        mode: 'markers',
        showlegend: false,
        marker: {
            colorscale: [[0, 'rgb(59, 130, 246)'], [1, 'rgb(16, 185, 129)']],
            cmin: 1,
            cmax: tokens.length,
            color: [1, tokens.length],
            showscale: true,
            colorbar: { title: 'Position', thickness: 15, len: 0.7 }
        },
        hoverinfo: 'none'
    };
    if (is3D) trace.z = [null];
    return trace;
}

/**
 * Builds the Plotly layout for migration plots.
 */
function buildMigrationLayout(layerNum, is3D) {
    const commonLayout = {
        title: `Layer ${layerNum}: Feature Migration`,
        autosize: true,
        hovermode: 'closest',
        margin: { t: 50, b: 20, l: 20, r: 80 }
    };

    if (is3D) {
        return {
            ...commonLayout,
            scene: {
                xaxis: { title: 'Dim 0' },
                yaxis: { title: 'Dim 1' },
                zaxis: { title: 'Dim 2' }
            }
        };
    }
    return {
        ...commonLayout,
        xaxis: { title: 'Dim 0' },
        yaxis: { title: 'Dim 1' }
    };
}

/**
 * Refactored: now a clean orchestrator.
 */
function tlab_render_plotly_react(id, tokens, start_h, end_h, layerNum, d_model, isLastLayer, nextWordIndex) {
    const is3D = d_model === 3;
    const traces = [];

    tokens.forEach((token, i) => {
        traces.push(...buildMigrationTokenTrace(token, i, start_h, end_h, d_model, is3D, tokens));
    });

    traces.push(buildMigrationColorbarTrace(is3D, tokens));

    const layout = buildMigrationLayout(layerNum, is3D);

    Plotly.react(id, traces, layout, { responsive: true });
}

// ─── Helper: Snapshot embedding space and build vocabulary lookup ───
function _traj_snapshot_embeddings() {
	const embSnap = {};
	if (window.persistentEmbeddingSpace) {
		for (const word in window.persistentEmbeddingSpace) {
			embSnap[word] = [...window.persistentEmbeddingSpace[word]];
		}
	}
	return { embSnap, snapVocab: Object.keys(embSnap) };
}

// ─── Helper: Find nearest vocabulary word by cosine similarity ───
function _traj_get_logit_word(hVec, embSnap, snapVocab) {
	if (!hVec || snapVocab.length === 0) return '???';
	let bestWord = '???';
	let bestSim = -Infinity;
	let hMag = 0;
	for (let i = 0; i < hVec.length; i++) hMag += hVec[i] * hVec[i];
	hMag = Math.sqrt(hMag);
	if (hMag < 1e-12) return '???';
	for (let w = 0; w < snapVocab.length; w++) {
		const word = snapVocab[w];
		const wVec = embSnap[word];
		let dot = 0, wMag = 0;
		for (let i = 0; i < hVec.length; i++) {
			dot += hVec[i] * (wVec[i] || 0);
			wMag += (wVec[i] || 0) * (wVec[i] || 0);
		}
		wMag = Math.sqrt(wMag);
		if (wMag < 1e-12) continue;
		const cosSim = dot / (hMag * wMag);
		if (cosSim > bestSim) {
			bestSim = cosSim;
			bestWord = word;
		}
	}
	return bestWord;
}

// ─── Helper: Build 3D embedding landmark traces ───
function _traj_build_embedding_landmarks_3D(embSnap, snapVocab) {
	const xs = [], ys = [], zs = [], texts = [];
	for (const word of snapVocab) {
		const v = embSnap[word];
		xs.push(v[0]);
		ys.push(v[1] || 0);
		zs.push(v[2] || 0);
		texts.push(word);
	}
	return [
		{
			type: 'scatter3d',
			x: xs, y: ys, z: zs,
			mode: 'markers',
			marker: {
				size: 5,
				symbol: 'diamond',
				color: 'rgba(100, 116, 139, 0.8)',
				line: { width: 1, color: '#334155' }
			},
			text: texts,
			hovertemplate: '<b>Embedding: %{text}</b><extra></extra>',
			name: 'Vocab Embeddings',
			legendgroup: 'vocab_emb',
			showlegend: true
		},
		{
			type: 'scatter3d',
			x: xs, y: ys, z: zs,
			mode: 'text',
			text: texts,
			textposition: 'top center',
			textfont: { size: 10, color: '#475569', family: 'Inter, sans-serif' },
			hoverinfo: 'skip',
			name: 'Vocab Labels',
			legendgroup: 'vocab_emb',
			showlegend: false
		}
	];
}

// ─── Helper: Build 2D embedding landmark trace ───
function _traj_build_embedding_landmarks_2D(embSnap, snapVocab, dimA, dimB) {
	const xs = [], ys = [], texts = [];
	for (const word of snapVocab) {
		const v = embSnap[word];
		xs.push(v[dimA] || 0);
		ys.push(v[dimB] || 0);
		texts.push(word);
	}
	return {
		type: 'scatter',
		x: xs, y: ys,
		mode: 'markers+text',
		text: texts,
		textposition: 'top center',
		textfont: { size: 10, color: '#475569' },
		marker: {
			size: 8,
			symbol: 'diamond',
			color: 'rgba(100, 116, 139, 0.7)',
			line: { width: 1, color: '#334155' }
		},
		name: 'Vocab Embeddings',
		legendgroup: 'vocab_emb',
		showlegend: true,
		hoverinfo: 'text',
		hovertemplate: '<b>Embedding: %{text}</b><extra></extra>'
	};
}

// ─── 1. Generate all unique dimension pairs ───
function _traj_generate_dimension_pairs(d_model) {
    const pairs = [];
    for (let i = 0; i < d_model; i++) {
        for (let j = i + 1; j < d_model; j++) {
            pairs.push([i, j]);
        }
    }
    return pairs;
}

// ─── 2. Ensure the heading element exists and update its text ───
function _traj_ensure_heading(trajDiv, pairCount) {
    let heading = trajDiv.querySelector('[data-traj-heading]');
    if (!heading) {
        heading = document.createElement('div');
        heading.setAttribute('data-traj-heading', 'true');
        heading.style.cssText = "text-align:center; padding:15px 10px 5px; font-size:1rem; color:#1e40af; width:100%;";
        trajDiv.prepend(heading);  // Use prepend to ensure it's ABOVE the grid
    }
    heading.innerHTML = `<b>Token Trajectory — 2D Projections (${pairCount} dimension pairs)</b>`;
    return heading;
}

// ─── 3. Ensure the grid container exists ───
function _traj_ensure_grid(trajDiv) {
    let grid = trajDiv.querySelector('[data-traj-grid]');
    if (!grid) {
        grid = document.createElement('div');
        grid.setAttribute('data-traj-grid', 'true');
        grid.style.cssText = "display:grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap:15px; padding:10px;";
        trajDiv.appendChild(grid);
    }
    return grid;
}

// ─── 4. Ensure a slice plot div exists for a given dimension pair ───
function _traj_ensure_slice_div(grid, dimA, dimB) {
    const plotId = `traj-slice-${dimA}-${dimB}`;
    let sliceDiv = document.getElementById(plotId);
    if (!sliceDiv) {
        sliceDiv = document.createElement('div');
        sliceDiv.id = plotId;
        sliceDiv.style.cssText = "height:400px; border:1px solid #e2e8f0; border-radius:8px; background:#fff;";
        grid.appendChild(sliceDiv);
    }
    return plotId;
}

// ─── 5. Build hover text array for a single token across all stages ───
function _traj_build_hover_texts(tIdx, labels, dataPoints, embSnap, snapVocab) {
    return dataPoints.map((p, pIdx) => {
        const logitWord = _traj_get_logit_word(p.data[tIdx], embSnap, snapVocab);
        const fromStage = pIdx > 0 ? dataPoints[pIdx - 1].name : '(start)';
        const toStage = p.name;
        return `Token: ${labels[tIdx]} (pos ${tIdx + 1})<br>` +
            `From: ${fromStage}<br>` +
            `To: ${toStage}<br>` +
            `Nearest logit: <b>${logitWord}</b>`;
    });
}

// ─── 6. Build the main trajectory line trace for one token in a 2D slice ───
function _traj_build_token_line_trace(x, y, tokenLabel, tColor, hoverTexts) {
    return {
        type: 'scatter',
        x: x, y: y,
        mode: 'lines+markers',
        name: tokenLabel,
        legendgroup: tokenLabel,
        line: { width: 2, color: tColor },
        marker: {
            size: x.map((_, i) => i === 0 ? 0 : 10),
            symbol: 'arrow',
            angleref: 'previous',
            color: tColor
        },
        hoverinfo: 'text',
        hovertemplate: '%{text}<extra></extra>',
        text: hoverTexts,
        showlegend: true
    };
}

// ─── 7. Build the start marker trace for one token ───
function _traj_build_start_marker(x, y, tColor, tokenLabel, labels, tIdx, dataPoints, embSnap, snapVocab) {
    const startLogit = _traj_get_logit_word(dataPoints[0].data[tIdx], embSnap, snapVocab);
    return {
        type: 'scatter',
        x: [x[0]], y: [y[0]],
        mode: 'markers',
        marker: { size: 10, symbol: 0, color: tColor, line: { width: 2, color: '#000' } },
        legendgroup: tokenLabel,
        showlegend: false,
        hoverinfo: 'text',
        hovertemplate: '%{text}<extra></extra>',
        text: [`Token: ${labels[tIdx]} — Start<br>Stage: ${dataPoints[0].name}<br>Nearest logit: <b>${startLogit}</b>`]
    };
}

// ─── 8. Build the end marker trace for one token ───
function _traj_build_end_marker(x, y, tColor, tokenLabel, labels, tIdx, dataPoints, embSnap, snapVocab) {
    const endIdx = dataPoints.length - 1;
    const endLogit = _traj_get_logit_word(dataPoints[endIdx].data[tIdx], embSnap, snapVocab);
    return {
        type: 'scatter',
        x: [x[x.length - 1]], y: [y[y.length - 1]],
        mode: 'markers',
        marker: { size: 14, symbol: 17, color: tColor, line: { width: 1.5, color: '#000' } },
        legendgroup: tokenLabel,
        showlegend: false,
        hoverinfo: 'text',
        hovertemplate: '%{text}<extra></extra>',
        text: [`Token: ${labels[tIdx]} — End<br>Stage: ${dataPoints[endIdx].name}<br>Nearest logit: <b>${endLogit}</b>`]
    };
}

// ─── 9. Build stage-label annotations (only for the first token) ───
function _traj_build_stage_annotations(x, y, dataPoints) {
    return dataPoints.map((p, pIdx) => ({
        x: x[pIdx], y: y[pIdx],
        xref: 'x', yref: 'y',
        text: p.name,
        showarrow: false,
        font: { size: 8, color: '#64748b' },
        yshift: 12
    }));
}

// ─── 10. Collect all traces and annotations for a single dimension-pair slice ───
function _traj_build_slice_traces(tokens, labels, dataPoints, dimA, dimB, embSnap, snapVocab) {
    const traces = [];
    const annotations = [];

    // Embedding landmark points
    traces.push(_traj_build_embedding_landmarks_2D(embSnap, snapVocab, dimA, dimB));

    tokens.forEach((token, tIdx) => {
        const hasDataInAllSteps = dataPoints.every(p => p.data && p.data[tIdx]);
        if (!hasDataInAllSteps) return;

        const x = dataPoints.map(p => p.data[tIdx][dimA]);
        const y = dataPoints.map(p => p.data[tIdx][dimB]);
        const tColor = getPositionColor(tIdx, tokens.length);
        const tokenLabel = `${labels[tIdx]} (${tIdx + 1})`;

        const hoverTexts = _traj_build_hover_texts(tIdx, labels, dataPoints, embSnap, snapVocab);

        traces.push(_traj_build_token_line_trace(x, y, tokenLabel, tColor, hoverTexts));
        traces.push(_traj_build_start_marker(x, y, tColor, tokenLabel, labels, tIdx, dataPoints, embSnap, snapVocab));
        traces.push(_traj_build_end_marker(x, y, tColor, tokenLabel, labels, tIdx, dataPoints, embSnap, snapVocab));

        // Stage annotations only for the first token to avoid clutter
        if (tIdx === 0) {
            annotations.push(..._traj_build_stage_annotations(x, y, dataPoints));
        }
    });

    return { traces, annotations };
}

// ─── 11. Build the Plotly layout for a single dimension-pair slice ───
function _traj_build_slice_layout(dimA, dimB, annotations) {
    return {
        title: { text: `Dim ${dimA} × Dim ${dimB}`, font: { size: 13 } },
        xaxis: { title: `Dim ${dimA}`, showgrid: true, zeroline: false },
        yaxis: { title: `Dim ${dimB}`, showgrid: true, zeroline: false },
        annotations: annotations,
        margin: { l: 45, r: 10, b: 45, t: 40 },
        showlegend: true,
        legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.2, font: { size: 11 } }
    };
}

// ─── 12. Render a single dimension-pair slice plot ───
function _traj_render_single_slice(grid, tokens, labels, dataPoints, dimA, dimB, embSnap, snapVocab) {
    const plotId = _traj_ensure_slice_div(grid, dimA, dimB);
    const { traces, annotations } = _traj_build_slice_traces(tokens, labels, dataPoints, dimA, dimB, embSnap, snapVocab);
    const layout = _traj_build_slice_layout(dimA, dimB, annotations);
    Plotly.react(plotId, traces, layout, { responsive: true });
}

// ─── Main function: now a clean orchestrator ───
function _traj_render_high_dimensional(trajDiv, tokens, labels, dataPoints, d_model, embSnap, snapVocab) {
    const pairs = _traj_generate_dimension_pairs(d_model);

    _traj_ensure_heading(trajDiv, pairs.length);
    const grid = _traj_ensure_grid(trajDiv);

    pairs.forEach(([dimA, dimB]) => {
        _traj_render_single_slice(grid, tokens, labels, dataPoints, dimA, dimB, embSnap, snapVocab);
    });
}

// ─── Helper: Build 3D token trajectory traces ───
function _traj_build_3d_token_traces(tokens, labels, dataPoints, embSnap, snapVocab) {
	const traces = [];

	_traj_build_embedding_landmarks_3D(embSnap, snapVocab).forEach(t => traces.push(t));

	tokens.forEach((token, tIdx) => {
		const hasDataInAllSteps = dataPoints.every(p => p.data && p.data[tIdx]);
		if (!hasDataInAllSteps) return;

		const x = dataPoints.map(p => p.data[tIdx][0]);
		const y = dataPoints.map(p => p.data[tIdx][1]);
		const z = dataPoints.map(p => p.data[tIdx][2]);
		const tColor = getPositionColor(tIdx, tokens.length);
		const tokenLabel = `${labels[tIdx]} (${tIdx + 1})`;

		const hoverTexts = dataPoints.map((p, pIdx) => {
			const logitWord = _traj_get_logit_word(p.data[tIdx], embSnap, snapVocab);
			const fromStage = pIdx > 0 ? dataPoints[pIdx - 1].name : '(start)';
			const toStage = p.name;
			return `Token: ${labels[tIdx]} (pos ${tIdx + 1})<br>` +
				`From: ${fromStage}<br>` +
				`To: ${toStage}<br>` +
				`Nearest logit: <b>${logitWord}</b>`;
		});

		traces.push({
			type: 'scatter3d',
			x: x, y: y, z: z,
			mode: 'lines',
			name: tokenLabel,
			legendgroup: tokenLabel,
			line: { width: 5, color: tColor },
			hoverinfo: 'text',
			hovertemplate: '%{text}<extra></extra>',
			text: hoverTexts
		});

		for (let i = 0; i < x.length - 1; i++) {
			const logitWord = _traj_get_logit_word(dataPoints[i + 1].data[tIdx], embSnap, snapVocab);
			const fromStage = dataPoints[i].name;
			const toStage = dataPoints[i + 1].name;
			const coneHoverText = `Token: ${labels[tIdx]} (pos ${tIdx + 1})<br>` +
				`From: ${fromStage}<br>` +
				`To: ${toStage}<br>` +
				`Nearest logit: <b>${logitWord}</b>`;

			traces.push({
				type: 'cone',
				x: [x[i + 1]], y: [y[i + 1]], z: [z[i + 1]],
				u: [x[i + 1] - x[i]], v: [y[i + 1] - y[i]], w: [z[i + 1] - z[i]],
				sizemode: 'absolute', sizeref: 0.15, anchor: 'tip',
				colorscale: [[0, tColor], [1, tColor]], showscale: false,
				hoverinfo: 'text',
				text: [coneHoverText],
				hovertemplate: '%{text}<extra></extra>',
				legendgroup: tokenLabel,
				showlegend: false
			});
		}

		const startLogit = _traj_get_logit_word(dataPoints[0].data[tIdx], embSnap, snapVocab);
		traces.push({
			type: 'scatter3d',
			x: [x[0]], y: [y[0]], z: [z[0]],
			mode: 'markers',
			marker: { size: 6, symbol: 'circle', color: tColor,
				line: { width: 1, color: '#000' } },
			legendgroup: tokenLabel,
			showlegend: false,
			hoverinfo: 'text',
			hovertemplate: '%{text}<extra></extra>',
			text: [`Token: ${labels[tIdx]} — Start<br>Stage: ${dataPoints[0].name}<br>Nearest logit: <b>${startLogit}</b>`]
		});

		const endIdx = dataPoints.length - 1;
		const endLogit = _traj_get_logit_word(dataPoints[endIdx].data[tIdx], embSnap, snapVocab);
		traces.push({
			type: 'scatter3d',
			x: [x[x.length - 1]], y: [y[y.length - 1]], z: [z[z.length - 1]],
			mode: 'text',
			text: ['★'],
			textposition: 'middle center',
			textfont: { size: 18, color: tColor, family: 'Arial, sans-serif' },
			legendgroup: tokenLabel,
			showlegend: false,
			hoverinfo: 'text',
			hovertemplate: `Token: ${labels[tIdx]} — End<br>Stage: ${dataPoints[endIdx].name}<br>Nearest logit: <b>${endLogit}</b><extra></extra>`
		});
	});

	return traces;
}

// ─── Helper: Build 2D token trajectory traces ───
function _traj_build_2d_token_traces(tokens, labels, dataPoints, embSnap, snapVocab) {
	const traces = [];
	const annotations = [];

	traces.push(_traj_build_embedding_landmarks_2D(embSnap, snapVocab, 0, 1));

	tokens.forEach((token, tIdx) => {
		const hasDataInAllSteps = dataPoints.every(p => p.data && p.data[tIdx]);
		if (!hasDataInAllSteps) return;

		const x = dataPoints.map(p => p.data[tIdx][0]);
		const y = dataPoints.map(p => p.data[tIdx][1]);
		const tColor = getPositionColor(tIdx, tokens.length);
		const tokenLabel = `${labels[tIdx]} (${tIdx + 1})`;

		const hoverTexts = dataPoints.map((p, pIdx) => {
			const logitWord = _traj_get_logit_word(p.data[tIdx], embSnap, snapVocab);
			const fromStage = pIdx > 0 ? dataPoints[pIdx - 1].name : '(start)';
			const toStage = p.name;
			return `Token: ${labels[tIdx]} (pos ${tIdx + 1})<br>` +
				`From: ${fromStage}<br>` +
				`To: ${toStage}<br>` +
				`Nearest logit: <b>${logitWord}</b>`;
		});

		traces.push({
			type: 'scatter',
			x: x, y: y,
			mode: 'lines+markers',
			name: tokenLabel,
			legendgroup: tokenLabel,
			line: { width: 2, color: tColor },
			marker: {
				size: x.map((_, i) => i === 0 ? 0 : 10),
				symbol: 'arrow',
				angleref: 'previous',
				color: tColor
			},
			hoverinfo: 'text',
			hovertemplate: '%{text}<extra></extra>',
			text: hoverTexts
		});

		const startLogit = _traj_get_logit_word(dataPoints[0].data[tIdx], embSnap, snapVocab);
		traces.push({
			type: 'scatter',
			x: [x[0]], y: [y[0]],
			mode: 'markers',
			marker: { size: 10, symbol: 0, color: tColor,
				line: { width: 2, color: '#000' } },
			legendgroup: tokenLabel,
			showlegend: false,
			hoverinfo: 'text',
			hovertemplate: '%{text}<extra></extra>',
			text: [`Token: ${labels[tIdx]} — Start<br>Stage: ${dataPoints[0].name}<br>Nearest logit: <b>${startLogit}</b>`]
		});

		const endIdx = dataPoints.length - 1;
		const endLogit = _traj_get_logit_word(dataPoints[endIdx].data[tIdx], embSnap, snapVocab);
		traces.push({
			type: 'scatter',
			x: [x[x.length - 1]], y: [y[y.length - 1]],
			mode: 'markers',
			marker: { size: 14, symbol: 17, color: tColor,
				line: { width: 1.5, color: '#000' } },
			legendgroup: tokenLabel,
			showlegend: false,
			hoverinfo: 'text',
			hovertemplate: '%{text}<extra></extra>',
			text: [`Token: ${labels[tIdx]} — End<br>Stage: ${dataPoints[endIdx].name}<br>Nearest logit: <b>${endLogit}</b>`]
		});

		if (tIdx === 0) {
			dataPoints.forEach((p, pIdx) => {
				annotations.push({
					x: x[pIdx], y: y[pIdx],
					xref: 'x', yref: 'y',
					text: p.name,
					showarrow: false,
					font: { size: 9, color: '#64748b' },
					yshift: 12
				});
			});
		}
	});

	return { traces, annotations };
}

// ─── Helper: Render the low-dimensional (d_model 2 or 3) single trajectory plot ───
function _traj_render_low_dimensional(trajDiv, tokens, labels, dataPoints, d_model, embSnap, snapVocab) {
	trajDiv.style.height = '850px';

	let traces, annotations;

	if (d_model === 3) {
		traces = _traj_build_3d_token_traces(tokens, labels, dataPoints, embSnap, snapVocab);
		annotations = [];
	} else {
		const result = _traj_build_2d_token_traces(tokens, labels, dataPoints, embSnap, snapVocab);
		traces = result.traces;
		annotations = result.annotations;
	}

	const axisTemplate = {
		showticklabels: false,
		showgrid: true,
		zeroline: false,
		title: { text: "" },
		backgroundcolor: "#f9fafb"
	};

	const layout = {
		title: `<b>Token Trajectory from Embedding → Embedding + Position through the Layers</b>`,
		scene: {
			xaxis: axisTemplate, yaxis: axisTemplate, zaxis: axisTemplate,
			camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } }
		},
		xaxis: axisTemplate,
		yaxis: axisTemplate,
		annotations: d_model !== 3 ? annotations : [],
		margin: { l: 10, r: 10, b: 50, t: 80 },
		showlegend: true,
		legend: {
			orientation: 'h', x: 0.5, xanchor: 'center', y: -0.1,
			font: { size: 14 }
		}
	};

	Plotly.react(trajDiv.id, traces, layout);
}

// ─── Main function: now a clean orchestrator ───
function tlab_render_trajectory_plot(d_model) {
	const mainContainer = document.getElementById('transformer-migration-plots-container');
	if (!mainContainer || !window.tlab_trajectory_collector) return;

	const { tokens, steps, displayTokens } = window.tlab_trajectory_collector;

	const sortedKeys = Object.keys(steps).sort();
	if (sortedKeys.length < 3) return;

	let trajDiv = document.getElementById('transformer-trajectory-full-path');
	if (!trajDiv) {
		trajDiv = document.createElement('div');
		trajDiv.id = 'transformer-trajectory-full-path';
		mainContainer.appendChild(trajDiv);
	}

	// Remove the loading placeholder and reset flex centering styles
	const placeholder = trajDiv.querySelector('.traj-loading-placeholder');
	if (placeholder) placeholder.remove();
	trajDiv.style.display = 'block';
	trajDiv.style.alignItems = '';
	trajDiv.style.justifyContent = '';

	trajDiv.style.width = '100%';

	const labels = displayTokens || tokens.map((t, i) => {
		if (typeof t === 'string') return t;
		return tlab_get_top_word_only(t);
	});

	const dataPoints = sortedKeys.map(k => steps[k]);

	const { embSnap, snapVocab } = _traj_snapshot_embeddings();

	if (d_model >= 4) {
		_traj_render_high_dimensional(trajDiv, tokens, labels, dataPoints, d_model, embSnap, snapVocab);
	} else {
		_traj_render_low_dimensional(trajDiv, tokens, labels, dataPoints, d_model, embSnap, snapVocab);
	}
}

/**
 * Builds a colored pmatrix LaTeX string from a numeric matrix.
 */
function toColoredPMatrix(matrix) {
    if (!Array.isArray(matrix) || !matrix.length) return '';
    const rows = matrix.map((row, tIdx) => {
        const colorCmd = getPositionColor(tIdx, matrix.length, 'temml');
        return row.map(v => `${colorCmd} ${v.toFixed(nr_fixed)}`).join(' & ');
    }).join(' \\\\ ');
    return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

/**
 * Builds the vocabulary probability transition rows for the LaTeX display.
 */
function buildVocabTransitionRows(tokens, start_h, end_h, d_model) {
    return tokens.map((_, tIdx) => {
        const fromList = tlab_get_top_vocab_list(start_h[tIdx], d_model);
        const toList = tlab_get_top_vocab_list(end_h[tIdx], d_model);
        const colorCmd = getPositionColor(tIdx, tokens.length, 'temml');

        return fromList.map((fromItem, i) => {
            const toItem = toList[i] || { word: '???', prob: 0 };
            const cleanFrom = fromItem.word.replace(/#/g, '\\#').replace(/_/g, '\\_');
            const cleanTo = toItem.word.replace(/#/g, '\\#').replace(/_/g, '\\_');
            const fromProb = Math.round(fromItem.prob * 100);
            const toProb = Math.round(toItem.prob * 100);

            return `${colorCmd} \\text{${cleanFrom} } (${fromProb}\\%) \\rightarrow \\text{${cleanTo}} (${toProb}\\%)`;
        }).join(' & ');
    }).join(' \\\\ ');
}

/**
 * Ensures the LaTeX debug div exists in the DOM, creating it if needed.
 * @returns {HTMLElement}
 */
function ensureLatexDebugDiv(id, plotDiv) {
    let latexDiv = document.getElementById(id + '-latex-debug');
    if (!latexDiv) {
        latexDiv = document.createElement('div');
        latexDiv.id = id + '-latex-debug';
        latexDiv.style.marginTop = '20px';
        latexDiv.style.overflowX = 'auto';
        latexDiv.style.fontSize = '0.8rem';

        const weightGrid = plotDiv.nextElementSibling;
        if (weightGrid && weightGrid.classList.contains('weight-grid-viz')) {
            weightGrid.parentNode.insertBefore(latexDiv, weightGrid.nextSibling);
        } else {
            plotDiv.parentNode.insertBefore(latexDiv, plotDiv.nextSibling);
        }
    }
    return latexDiv;
}

/**
 * Refactored: now a clean orchestrator.
 */
function tlab_render_latex_matrix(id, plotDiv, tokens, start_h, end_h, h_after, d_model) {
    const vocabRows = buildVocabTransitionRows(tokens, start_h, end_h, d_model);
    const latexString = `$$h_\\text{after} = ${toColoredPMatrix(h_after)}, \\quad h_\\text{after} \\cdot W_\\text{vocab} = \\begin{pmatrix} ${vocabRows} \\end{pmatrix}$$`;

    const latexDiv = ensureLatexDebugDiv(id, plotDiv);
    latexDiv.innerHTML = latexString;
    render_temml();
}

/**
 * Core Helpers
 */
function tlab_get_top_word_only(h_vec) {
	if (!window.persistentEmbeddingSpace) return "???";
	const vocabulary = Object.keys(window.persistentEmbeddingSpace);
	let maxDot = -Infinity;
	let bestWord = "???";
	vocabulary.forEach(word => {
		const w_vec = window.persistentEmbeddingSpace[word];
		const dot = dotProduct(h_vec, w_vec);
		if (dot > maxDot) {
			maxDot = dot;
			bestWord = word;
		}
	});
	return bestWord;
}

function tlab_get_top_vocab_list(h_vec, d_model) {
	if (!window.persistentEmbeddingSpace) return [];
	const vocabulary = Object.keys(window.persistentEmbeddingSpace);
	const { temperature } = getTransformerConfig();

	let scores = vocabulary.map(word => {
		const w_vec = window.persistentEmbeddingSpace[word];
		const dot = dotProduct(h_vec, w_vec);
		return { word, score: dot };
	});

	const scaledScores = scores.map(s => s.score / temperature);
	const probs = softmax(scaledScores);

	return scores.map((s, i) => ({
		word: s.word.replace(/#/g, '\\#').replace(/_/g, '\\_'),
		prob: probs[i]
	})).sort((a, b) => b.prob - a.prob).slice(0, d_model);
}

function render_positional_shift_plot(tokenStrings, d_model) {
	const containerId = 'transformer-pe-shift-plot';
	const container = document.getElementById(containerId);

	if (!Array.isArray(tokenStrings) || typeof tokenStrings[0] !== 'string') {
		console.error("Plotting requires an array of string tokens.");
		return [];
	}

	// Compute embeddings eagerly so we can return them immediately
	const injectedEmbeddings = embedTokensWithPE(tokenStrings, d_model);

	// Update registry with latest parameters, pre-computed embeddings, and reset render flag
	positionalShiftRegistry.set(containerId, {
		tokenStrings: tokenStrings,
		d_model: d_model,
		injectedEmbeddings: injectedEmbeddings,
		rendered: false
	});

	if (container) {
		if (!container.innerHTML) {
			container.innerHTML = `<div style="padding:20px; color:#64748b;">Wait for Positional Shift Plot to load...</div>`;
		}
		positionalShiftObserver.observe(container);
	}

	if (container && isElementInViewport(container)) {
		_execute_shift_render(tokenStrings, d_model, injectedEmbeddings);
		const entry = positionalShiftRegistry.get(containerId);
		if (entry) entry.rendered = true;
	}

	return injectedEmbeddings;
}

function _execute_shift_render(tokenStrings, d_model, injectedEmbeddings) {
    const container = document.getElementById('transformer-pe-shift-plot');
    if (!Array.isArray(tokenStrings) || typeof tokenStrings[0] !== 'string') {
        console.error("Plotting requires an array of string tokens.");
        return;
    }

    purgeExistingCharts(container);

    const traceData = buildShiftTraceData(tokenStrings, d_model, injectedEmbeddings);

    if (d_model <= 3 && traceData.plotlyTraces.length > 0) {
        renderShiftPlotly(container, traceData.plotlyTraces, d_model);
    } else if (d_model > 3) {
        renderShiftECharts(container, traceData.echartsData, d_model);
    }
}

/**
 * Tears down any previous Plotly or ECharts instance on the container.
 */
function purgeExistingCharts(container) {
    Plotly.purge(container);
    const existingChart = echarts.getInstanceByDom(container);
    if (existingChart) existingChart.dispose();
    container.innerHTML = '';
}

/**
 * Derives a stable hue from a token string for consistent coloring.
 */
function getHueFromToken(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

/**
 * Builds all Plotly traces (for d_model <= 3) and ECharts data (for d_model > 3)
 * representing the positional shift arrows from base embedding to PE-injected embedding.
 *
 * @returns {{ plotlyTraces: object[], echartsData: object[] }}
 */
function buildShiftTraceData(tokenStrings, d_model, injectedEmbeddings) {
    const plotlyTraces = [];
    const echartsData = [];

    tokenStrings.forEach((token, pos) => {
        const semanticBase = window.persistentEmbeddingSpace[token];
        if (!semanticBase) return;

        const combined = injectedEmbeddings[pos];
        if (!combined) return;

        const peVec = combined.map((val, i) => val - semanticBase[i]);
        const tokenColor = `hsl(${getHueFromToken(token)}, 75%, 50%)`;

        if (d_model <= 3) {
            plotlyTraces.push(
                ...buildShiftPlotlyTraces(token, pos, semanticBase, combined, peVec, tokenColor, d_model)
            );
        } else {
            echartsData.push(buildShiftEChartsEntry(token, pos, semanticBase, combined, tokenColor));
        }
    });

    return { plotlyTraces, echartsData };
}

/**
 * Builds Plotly traces for a single token's positional shift (2D or 3D).
 */
function buildShiftPlotlyTraces(token, pos, semanticBase, combined, peVec, tokenColor, d_model) {
    const traces = [];
    const x = [semanticBase[0], combined[0]];
    const y = d_model >= 2 ? [semanticBase[1], combined[1]] : [0, 0];

    if (d_model === 3) {
        const z = [semanticBase[2], combined[2]];

        traces.push({
            type: 'scatter3d',
            x, y, z,
            mode: 'lines',
            line: { width: 6, color: tokenColor },
            name: `${token} (pos ${pos})`,
            legendgroup: token,
            hoverinfo: 'text',
            text: `Token: ${token}<br>Pos: ${pos}`
        });

        traces.push({
            type: 'cone',
            x: [combined[0]], y: [combined[1]], z: [combined[2]],
            u: [peVec[0]], v: [peVec[1]], w: [peVec[2]],
            sizemode: 'absolute', sizeref: 0.15, anchor: 'tip',
            colorscale: [[0, tokenColor], [1, tokenColor]],
            showscale: false,
            legendgroup: token,
            showlegend: false,
            hoverinfo: 'skip'
        });
    } else {
        traces.push({
            type: 'scatter', x, y,
            mode: 'lines+markers',
            line: { width: 3, color: tokenColor },
            name: `${token} (pos ${pos})`,
            legendgroup: token,
            marker: { size: [0, 12], symbol: 'arrow', angleref: 'previous', color: tokenColor },
            hoverinfo: 'text',
            text: `Token: ${token}<br>Pos: ${pos}`
        });
    }

    return traces;
}

/**
 * Builds a single ECharts parallel-coordinates data entry for high-dimensional shifts.
 */
function buildShiftEChartsEntry(token, pos, semanticBase, combined, tokenColor) {
    return {
        value: semanticBase.flatMap((val, i) => [val, combined[i]]),
        name: `${token} (pos ${pos})`,
        lineStyle: { color: tokenColor }
    };
}

/**
 * Renders the positional shift plot using Plotly (d_model <= 3).
 */
function renderShiftPlotly(container, traces, d_model) {
    const layout = {
        title: "Semantic Vector → + Positional Shift",
        margin: { l: 40, r: 40, b: 40, t: 40 },
        showlegend: true
    };

    if (d_model === 3) {
        layout.scene = {
            xaxis: { title: 'Dim 0' },
            yaxis: { title: 'Dim 1' },
            zaxis: { title: 'Dim 2' }
        };
        layout.margin = { l: 0, r: 0, b: 0, t: 40 };
    } else {
        layout.xaxis = { title: 'Dim 0' };
        layout.yaxis = { title: d_model === 2 ? 'Dim 1' : '' };
    }

    Plotly.newPlot(container, traces, layout);
}

/**
 * Renders the positional shift plot using ECharts parallel coordinates (d_model > 3).
 */
function renderShiftECharts(container, echartsData, d_model) {
    const myChart = echarts.init(container);
    const axes = [];
    for (let i = 0; i < d_model; i++) {
        axes.push({ dim: i * 2, name: `D${i} Base` }, { dim: i * 2 + 1, name: `D${i} +PE` });
    }

    myChart.setOption({
        title: { text: "Semantic Vector → + Positional Shift", left: 'center' },
        tooltip: { trigger: 'item', formatter: p => `Token: <b>${p.name}</b>` },
        parallelAxis: axes,
        series: [{
            type: 'parallel', data: echartsData,
            lineStyle: { width: 2, opacity: 0.6 },
            emphasis: { lineStyle: { width: 5 } }
        }]
    });
    myChart.resize();
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
		const tf_epsilon = tf.scalar(epsilon);
		const normalized = x.sub(mean).div(tf.sqrt(variance.add(tf_epsilon)));
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
	debounced_run_transformer_demo();
}

/**
 * A standard debounce function.
 * Credits: This pattern is a staple of web optimization,
 * popularized by libraries like Underscore.js and Lodash.
 */
function debounce(func, wait) {
	let timeout;
	return function(...args) {
		const context = this;
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(context, args), wait);
	};
}

// 1. Define the debounced version of your heavy function
// 300ms is usually the "sweet spot" for human typing speed
const debouncedRun = debounce((id) => {
	run_transformer_demo(id);
}, 600);

window.calculate_vector_math = function() {
    // If currently visible, render immediately
    if (vectorMathRenderRegistry.isInViewport) {
        _execute_vector_math();
        vectorMathRenderRegistry.needsUpdate = false;
    } else {
        // Not visible — just flag that we need a re-render when it scrolls into view
        vectorMathRenderRegistry.needsUpdate = true;
    }
};

/**
 * The actual heavy computation + rendering logic.
 * Extracted from the old calculate_vector_math so it can be called lazily.
 */
/**
 * The actual heavy computation + rendering logic for vector math.
 */
function _execute_vector_math() {
    const inputVal = document.getElementById('transformer-vector-math-input').value;
    const resDiv   = document.getElementById('transformer-vector-math-result');
    const space    = window.persistentEmbeddingSpace;

    if (!hasValidEmbeddingSpace(space)) {
        resDiv.innerHTML = "<em style='color: #94a3b8;'>Enter an equation and press Enter...</em>";
        return;
    }

    const vocabKeys = Object.keys(space);
    const d_model   = space[vocabKeys[0]].length;
    const tokens    = tokenizeVectorMathInput(inputVal);

    if (!tokens) {
        resDiv.innerHTML = "<em style='color: #94a3b8;'>Enter an equation and press Enter...</em>";
        _execute_embedding_render(d_model, null, []);
        return;
    }

    try {
        const { result, steps } = evaluateVectorExpression(tokens, space, vocabKeys, d_model);
        const nearest = findNearestEmbedding(result.val, space, vocabKeys);
        const html    = buildVectorMathResultHtml(result, nearest, d_model);

        resDiv.innerHTML = html;
        render_temml();
        _execute_embedding_render(d_model, result.val, steps);
    } catch (e) {
        console.error("Vector Math Parse Error:", e);
        resDiv.innerHTML = "<span style='color: #ef4444;'>Syntax Error. Please check your equation formatting.</span>";
    }
}

/**
 * Checks if the embedding space is initialized and non-empty.
 */
function hasValidEmbeddingSpace(space) {
    return space && Object.keys(space).length > 0;
}

/**
 * Tokenizes the vector math input string into operators and operands.
 */
function tokenizeVectorMathInput(inputVal) {
    return inputVal.match(/[a-zA-ZäöüÄÖÜ0-9_#]+|\d*\.\d+|\d+|[\+\-\*\/\(\)]/g);
}

/**
 * Evaluates a vector math expression and returns the result + intermediate steps.
 * Uses a recursive descent parser.
 */
function evaluateVectorExpression(tokens, space, vocabKeys, d_model) {
    const lowerVocab = buildLowerCaseVocabMap(space, vocabKeys);
    let pos = 0;
    let steps = [];

    const toVecTex = (arr) => `\\begin{pmatrix} ${arr.map(v => v.toFixed(nr_fixed)).join(' \\\\ ')} \\end{pmatrix}`;

    function peek()    { return tokens[pos]; }
    function consume() { return tokens[pos++]; }

    function parseFactor() {
        let token = consume();
        if (!token) throw new Error("Unexpected end of input");

        if (token === '(') return parseParenthesized();
        if (token === '-') return parseNegation();
        if (isNumericLiteral(token, lowerVocab)) return parseScalar(token, d_model);
        return parseWordVector(token, lowerVocab, d_model, toVecTex);
    }

    function parseParenthesized() {
        let res = parseExpression();
        if (peek() === ')') consume();
        return { val: res.val, tex: `\\left( ${res.tex} \\right)`, isScalar: res.isScalar, label: res.label };
    }

    function parseNegation() {
        let res = parseFactor();
        return { val: res.val.map(v => -v), tex: `-${res.tex}`, isScalar: res.isScalar, label: `-${res.label}` };
    }

    function parseTerm() {
        let left = parseFactor();
        while (peek() === '*' || peek() === '/') {
            let op = consume();
            let right = parseFactor();
            left = applyMultiplicativeOp(left, right, op);
        }
        return left;
    }

    function parseExpression() {
        let left = parseTerm();
        while (peek() === '+' || peek() === '-') {
            let op = consume();
            let right = parseTerm();
            let prev = [...left.val];

            left.val = (op === '+')
                ? left.val.map((v, i) => v + right.val[i])
                : left.val.map((v, i) => v - right.val[i]);

            steps.push({ from: prev, to: [...left.val], label: `${op} ${right.label}` });
            left.tex   = `${left.tex} ${op} ${right.tex}`;
            left.label = `${left.label}${op}${right.label}`;
        }
        return left;
    }

    const result = parseExpression();
    return { result, steps };
}

/**
 * Builds a lowercase → { vec, original } lookup map from the embedding space.
 */
function buildLowerCaseVocabMap(space, vocabKeys) {
    return vocabKeys.reduce((acc, word) => {
        acc[word.toLowerCase()] = { vec: space[word], original: word };
        return acc;
    }, {});
}

/**
 * Checks if a token is a numeric literal (not a vocabulary word).
 */
function isNumericLiteral(token, lowerVocab) {
    return !isNaN(token) && !lowerVocab[token.toLowerCase()];
}

/**
 * Parses a numeric scalar into a vector-math operand.
 */
function parseScalar(token, d_model) {
    const s = parseFloat(token);
    return { val: Array(d_model).fill(s), tex: `${s}`, isScalar: true, label: `${s}` };
}

/**
 * Parses a word token into its embedding vector operand.
 */
function parseWordVector(token, lowerVocab, d_model, toVecTex) {
    const entry = lowerVocab[token.toLowerCase()];
    const vec = entry ? [...entry.vec] : Array(d_model).fill(0);
    const displayName = entry ? entry.original : token;
    const safeName = displayName.replace(/#/g, '\\#').replace(/_/g, '\\_');

    return {
        val: vec,
        tex: `\\underbrace{${toVecTex(vec)}}_{\\text{${safeName}}}`,
        isScalar: false,
        label: safeName
    };
}

/**
 * Applies * or / between two vector-math operands.
 */
function applyMultiplicativeOp(left, right, op) {
	const opTex = op === '*' ? '\\cdot' : '\\div';

	if (op === '*') {
		if (left.isScalar) {
			left.val = right.val.map(v => left.val[0] * v);
			left.isScalar = right.isScalar;
		} else {
			left.val = left.val.map((v, i) => v * (right.isScalar ? right.val[0] : right.val[i]));
		}
	} else {
		left.val = left.val.map((v, i) => v / (right.isScalar ? right.val[0] : (right.val[i] || 1)));
	}

	left.tex   = `${left.tex} ${opTex} ${right.tex}`;
	left.label = `${left.label}${op}${right.label}`;
	return left;
}

/**
 * Finds the nearest vocabulary word to a result vector by Euclidean distance.
 */
function findNearestEmbedding(resultVec, space, vocabKeys) {
    let nearest = "None";
    let nearestVec = Array(resultVec.length).fill(0);
    let minDist = Infinity;

    vocabKeys.forEach(w => {
        const v = space[w];
        const d = Math.sqrt(v.reduce((s, val, i) => s + Math.pow(val - resultVec[i], 2), 0));
        if (d < minDist) {
            minDist = d;
            nearest = w;
            nearestVec = v;
        }
    });

    return { word: nearest, vec: nearestVec, distance: minDist };
}

/**
 * Builds the LaTeX HTML for the vector math result display.
 */
function buildVectorMathResultHtml(result, nearest, d_model) {
    const toVecTex = (arr) => `\\begin{pmatrix} ${arr.map(v => v.toFixed(nr_fixed)).join(' \\\\ ')} \\end{pmatrix}`;

    const isExact = nearest.distance < 0.001;
    const symbol = isExact ? "=" : "\\approx";
    const safeNearest = nearest.word.replace(/#/g, '\\#').replace(/_/g, '\\_');

    const resultTex = `\\underbrace{${toVecTex(result.val)}}_{\\substack{ ${symbol} \\text{ ${safeNearest}} \\\\ ${toVecTex(nearest.vec)} }}`;

    return `
        <div style="overflow-x: auto; padding: 10px 0; font-size: 1.1em;">
            $$ ${result.tex} = ${resultTex} $$
        </div>
    `;
}


function debounced_run_transformer_demo(activeId) {
	updateTrainButtonState();
	clearTimeout(trainingDebounceTimer);
	trainingDebounceTimer = setTimeout(() => {
		run_transformer_demo(activeId);
	}, 600);
}

function updateTrainButtonState() {
	const btn = document.querySelector('.train-btn');
	if (!btn) return;

	const trainingData = document.getElementById('transformer-training-data').value;
	const tokens = transformer_tokenize_render(trainingData, null);

	if (tokens.length < 2) {
		btn.disabled = true;
		btn.title = 'Need at least 2 tokens in training data';
		btn.style.opacity = '0.5';
		btn.style.cursor = 'not-allowed';
	} else {
		btn.disabled = false;
		btn.title = '';
		btn.style.opacity = '1';
		btn.style.cursor = 'pointer';
	}
}

/**
 * Dynamic Attention Web Renderer
 * Draws bezier arcs between tokens weighted by a real attention matrix.
 * Mirrors the visual style of SelfAttentionLab.drawWeb() but works
 * with any tokens[] and weights[][] passed in dynamically.
 *
 * The token strip is horizontally scrollable so that long sequences
 * don't stack vertically, and the canvas is sized to the full
 * scrollable width so arcs connect correctly.
 */
function renderDynamicAttentionWeb(containerId, canvasId, stripId, tokens, weights) {
    const container = document.getElementById(containerId);
    const canvas    = document.getElementById(canvasId);
    const strip     = document.getElementById(stripId);
    if (!container || !canvas || !strip) return;

    const chips = buildTokenChipStrip(strip, tokens);
    let hoverIndex = null;

    const drawArcs = () => drawAttentionArcs(container, canvas, chips, tokens, weights, hoverIndex);

    attachChipHoverEvents(chips, (idx) => { hoverIndex = idx; drawArcs(); }, () => { hoverIndex = null; drawArcs(); });
    container.addEventListener('scroll', drawArcs);

    drawArcs();

    attachResizeHandler(containerId, drawArcs);
}

/**
 * Builds the token chip HTML strip and returns the chip elements.
 */
function buildTokenChipStrip(strip, tokens) {
    strip.innerHTML = tokens.map((word, i) => {
        const displayWord = (typeof word === 'string') ? word : tlab_get_top_word_only(word);
        return `<div class="sa-token-block" style="
            display:inline-block; padding:8px 14px; margin:0 6px;
            background:#e0e7ff; border-radius:8px; cursor:pointer;
            font-weight:600; font-size:0.95rem; user-select:none;
            white-space:nowrap; flex-shrink:0; min-width:60px;
            text-align:center;
            border:2px solid transparent; transition: border-color 0.15s;"
            data-token-idx="${i}">
            ${displayWord}
        </div>`;
    }).join('');

    return strip.querySelectorAll('.sa-token-block');
}

/**
 * Attaches mouseover/mouseout events to each chip.
 */
function attachChipHoverEvents(chips, onHover, onLeave) {
    chips.forEach((chip, idx) => {
        chip.addEventListener('mouseover', () => onHover(idx));
        chip.addEventListener('mouseout', onLeave);
    });
}

/**
 * Draws bezier attention arcs on the canvas.
 */
function drawAttentionArcs(container, canvas, chips, tokens, weights, hoverIndex) {
    const scrollW = container.scrollWidth;
    const scrollH = container.scrollHeight;
    canvas.width  = scrollW;
    canvas.height = scrollH;
    canvas.style.width  = scrollW + 'px';
    canvas.style.height = scrollH + 'px';

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const containerRect = container.getBoundingClientRect();

    for (let i = 0; i < tokens.length; i++) {
        for (let j = 0; j < tokens.length; j++) {
            if (i === j) continue;
            const strength = weights[i][j];
            if (strength < 0.01) continue;

            drawSingleArc(ctx, container, containerRect, chips[i], chips[j], strength, hoverIndex === i);
        }
    }

    highlightHoveredChip(chips, hoverIndex);
}

/**
 * Draws a single bezier arc between two chips.
 */
function drawSingleArc(ctx, container, containerRect, chip1El, chip2El, strength, isSource) {
    const chip1 = chip1El.getBoundingClientRect();
    const chip2 = chip2El.getBoundingClientRect();

    const scrollLeft = container.scrollLeft;
    const scrollTop  = container.scrollTop;

    const x1 = (chip1.left + chip1.width / 2) - containerRect.left + scrollLeft;
    const x2 = (chip2.left + chip2.width / 2) - containerRect.left + scrollLeft;
    const baseY = (chip1.top - containerRect.top) + scrollTop;

    ctx.beginPath();
    if (isSource) {
        ctx.lineWidth   = 2 + strength * 20;
        ctx.strokeStyle = `rgba(37, 99, 235, ${0.3 + strength * 0.7})`;
    } else {
        ctx.lineWidth   = 1;
        ctx.strokeStyle = `rgba(203, 213, 225, 0.2)`;
    }

    const dist = Math.abs(x2 - x1);
    const h    = Math.min(dist * 0.5, 150);

    ctx.moveTo(x1, baseY);
    ctx.bezierCurveTo(x1, baseY - h, x2, baseY - h, x2, baseY);
    ctx.stroke();

    if (isSource && strength > 0.05) {
        ctx.fillStyle = "#1e40af";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.fillText(Math.round(strength * 100) + "%", (x1 + x2) / 2 - 10, baseY - h / 1.5);
    }
}

/**
 * Highlights the hovered chip with a border.
 */
function highlightHoveredChip(chips, hoverIndex) {
    chips.forEach((chip, idx) => {
        chip.style.borderColor = (idx === hoverIndex) ? '#2563eb' : 'transparent';
    });
}

/**
 * Attaches a window resize handler, cleaning up any previous one.
 */
function attachResizeHandler(containerId, drawFn) {
    const resizeKey = `_resizeHandler_${containerId}`;
    if (window[resizeKey]) window.removeEventListener('resize', window[resizeKey]);
    window[resizeKey] = drawFn;
    window.addEventListener('resize', drawFn);
}

/**
 * Transformer Lab — Embedding Editor
 * Adapted from embeddinglab.js's interactive table system.
 * All functions prefixed with `tled_` to avoid namespace collisions
 * with the Embedding Lab's own functions (e.g., addTokenToSpace, removeTokenFromSpace, etc.).
 *
 * Supports N-dimensional embeddings (not just 1D/2D/3D).
 */

/**
 * Initializes (or re-initializes) the editable embedding table
 * for the Transformer Lab's persistentEmbeddingSpace.
 *
 * Call this after every run_transformer_demo() so the table
 * reflects the latest vocabulary and vectors.
 */
function tled_initEditor() {
    const container = document.getElementById('tled-editor-container');
    if (!container) return;

    const space = window.persistentEmbeddingSpace;
    if (!space || Object.keys(space).length === 0) {
        container.innerHTML = `<p style="color:#94a3b8; padding:10px;">No embeddings yet. Enter training data and run the model.</p>`;
        return;
    }

    const words = Object.keys(space);
    const d_model = space[words[0]].length;

    // Build dimension header labels
    let dimHeaders = '';
    for (let d = 0; d < d_model; d++) {
        dimHeaders += `<th style="padding: 10px; text-align: center; white-space: nowrap;">D${d}</th>`;
    }

    let html = `
    <div style="overflow-x: auto; margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: white;">
        <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 13px;" id="tled-table">
            <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <tr>
                    <th style="padding: 10px; text-align: left;">Token</th>
                    ${dimHeaders}
                </tr>
            </thead>
            <tbody>`;

    words.forEach(word => {
        html += tled_generateRowHtml(word, space[word], d_model);
    });

    html += `
            </tbody>
        </table>
        <div style="padding: 10px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; gap: 10px;">
            <input type="text" id="tled-new-token-input" placeholder="New token name..."
                style="flex-grow: 1; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;"
                onkeyup="if(event.key==='Enter') tled_addToken()">
            <button onclick="tled_addToken()"
                style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                + Add Token
            </button>
        </div>
    </div>`;

    container.innerHTML = html;
}

/**
 * Generates a single table row for a token.
 * Each dimension gets its own numeric input.
 */
function tled_generateRowHtml(word, vec, d_model) {
	// Escape word for use in HTML attributes (handle quotes, etc.)
	const safeWord = word.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
		const safeWordAttr = word.replace(/"/g, '&quot;');

			let dimCells = '';
			for (let d = 0; d < d_model; d++) {
				dimCells += `
	<td style="padding: 5px; text-align: center;">
	    <input
		type="number"
		value="${vec[d].toFixed(4)}"
		step="0.1"
		data-tled-word="${safeWordAttr}"
		data-tled-dim="${d}"
		style="width: 70px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; font-size: 12px;"
		oninput="tled_updateEmbedding(this)"
	    >
	</td>`;
			}

			return `
    <tr style="border-bottom: 1px solid #f1f5f9;" id="tled-row-${safeWordAttr}">
	<td style="padding: 8px 10px; font-weight: 500;">${word}</td>
	${dimCells}
    </tr>`;
		}

/**
 * Called when a user edits a single dimension value in the table.
 * Updates persistentEmbeddingSpace and refreshes the transformer visualization.
 */
function tled_updateEmbedding(inputEl) {
	const word = inputEl.getAttribute('data-tled-word');
	const dim = parseInt(inputEl.getAttribute('data-tled-dim'));
	const val = parseFloat(inputEl.value) || 0;

	const space = window.persistentEmbeddingSpace;
	if (!space || !space[word]) return;

	// Update the value in the global embedding space
	space[word][dim] = val;

	// Re-render the embedding plot and vector math (lightweight refresh)
	const d_model = space[word].length;
	render_embedding_plot(d_model);

	// Recalculate vector math if there's an active equation
	calculate_vector_math();
}

const gaussianRandom = (min, max) => {
	let u = 0, v = 0;
	while (u === 0) u = Math.random();
	while (v === 0) v = Math.random();

	// Standard Normal Distribution (mean = 0, std = 1)
	let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

	// If no range is provided, return standard distribution
	if (min === undefined || max === undefined) return num;

	/**
	 * Scaling the value:
	 * 1. Divide by 10 to narrow the spread (mostly within -1.0 to 1.0).
	 * 2. Shift by 0.5 to center it.
	 * 3. Scale by the range (max - min).
	 */
	num = num / 10.0 + 0.5; // Translate to 0 -> 1

	// Clamp to [0, 1] if the value falls in the far tails
	if (num > 1 || num < 0) {
		return gaussianRandom(min, max); // Resample if out of bounds
	}

	return num * (max - min) + min;
};

/**
 * Adds a new token to the transformer's embedding space
 * with Gaussian-random initialization
 */
function tled_addToken() {
	const nameInput = document.getElementById('tled-new-token-input');
	if (!nameInput) return;

	const tokenName = nameInput.value.trim();
	if (!tokenName) {
		alert("Please enter a token name.");
		return;
	}

	const space = window.persistentEmbeddingSpace;
	if (!space) {
		alert("No embedding space initialized. Please enter training data first.");
		return;
	}

	if (space[tokenName]) {
		alert(`Token "${tokenName}" already exists in the vocabulary.`);
		return;
	}

	const existingWords = Object.keys(space);
	if (existingWords.length === 0) return;

	const d_model = space[existingWords[0]].length;

	space[tokenName] = Array.from({ length: d_model }, () =>
		parseFloat(gaussianRandom(-widthEmbeddingInit, widthEmbeddingInit).toFixed(4))
	);

	// Update the table by appending a new row
	const tbody = document.querySelector('#tled-table tbody');
	if (tbody) {
		tbody.insertAdjacentHTML('beforeend',
			tled_generateRowHtml(tokenName, space[tokenName], d_model)
		);
	}

	// Clear input
	nameInput.value = '';

	// Refresh the embedding plot
	render_embedding_plot(d_model);

	calculate_vector_math();
}

/**
 * Synchronizes the table to reflect the current state of
 * persistentEmbeddingSpace. Call this after training steps
 * update the embeddings so the table shows the trained values.
 *
 * Strategy: Instead of rebuilding the entire table (which would
 * lose focus/scroll position), we update existing input values
 * in-place and add/remove rows as needed.
 */
function tled_syncTableFromSpace() {
	const container = document.getElementById('tled-editor-container');
	if (!container) return;

	const space = window.persistentEmbeddingSpace;
	if (!space || Object.keys(space).length === 0) return;

	const table = document.getElementById('tled-table');

	// If the table doesn't exist yet (first run), do a full init
	if (!table) {
		tled_initEditor();
		return;
	}

	const words = Object.keys(space);
	const d_model = space[words[0]].length;

	// Check if d_model changed (dimension slider moved) — full rebuild needed
	const firstInput = table.querySelector('input[data-tled-dim]');
	if (firstInput) {
		const firstWord = firstInput.getAttribute('data-tled-word');
		const existingDims = table.querySelectorAll(`input[data-tled-word="${firstWord}"]`).length;
		if (existingDims !== d_model) {
			tled_initEditor();
			return;
		}
	}

	// Update existing rows in-place
	const existingRows = new Set();
	table.querySelectorAll('tbody tr').forEach(row => {
		const wordCell = row.querySelector('td');
		if (wordCell) existingRows.add(wordCell.textContent.trim());
	});

// Add new tokens that appeared (e.g., from training data change)
	words.forEach(word => {
		if (!existingRows.has(word)) {
			const tbody = table.querySelector('tbody');
			if (tbody) {
				tbody.insertAdjacentHTML('beforeend',
					tled_generateRowHtml(word, space[word], d_model)
				);
			}
		}
	});

	// Remove tokens that no longer exist
	existingRows.forEach(word => {
		if (!space[word]) {
			const row = document.getElementById(`tled-row-${word}`);
			if (row) row.remove();
		}
});

	// Update all input values to match current embeddings
	words.forEach(word => {
		const vec = space[word];
		for (let d = 0; d < d_model; d++) {
			const input = table.querySelector(
`input[data-tled-word="${word}"][data-tled-dim="${d}"]`
            );
            if (input && document.activeElement !== input) {
                // Only update if the user isn't currently editing this cell
                input.value = vec[d].toFixed(4);
            }
        }
    });
}

// ── Visualization mode: 'train' (default) or 'inference' ──
window.tlabVisualizationMode = 'train';

/**
 * Switches which data (training tokens or inference tokens) is shown
 * in all plots and visualizations. Does NOT affect any computation.
 */
function setVisualizationMode(mode) {
	window.tlabVisualizationMode = mode;

	// Update button styles
	const trainBtn = document.getElementById('view-toggle-train');
	const inferBtn = document.getElementById('view-toggle-inference');
	if (trainBtn && inferBtn) {
		if (mode === 'train') {
			trainBtn.style.background = '#3b82f6';
			trainBtn.style.color = 'white';
			inferBtn.style.background = 'white';
			inferBtn.style.color = '#3b82f6';
		} else {
			inferBtn.style.background = '#3b82f6';
			inferBtn.style.color = 'white';
			trainBtn.style.background = 'white';
			trainBtn.style.color = '#3b82f6';
		}
	}

	// Re-run visualization with the new mode (no retraining)
	run_transformer_demo();
}

async function loadTransformerModule () {
	updateLoadingStatus("Loading section about transformers...");

	observer_vector_math();

	updateTrainButtonState();
	run_transformer_demo()

	const inputElement = document.getElementById('transformer-master-token-input');
	inputElement.addEventListener('input', (event) => {
		debouncedRun('transformer-master-token-input');
	});

	return Promise.resolve();
}
