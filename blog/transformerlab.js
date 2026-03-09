"use strict";

/*
If you see stuff jumping around, try setting "overflow-anchor: none" to that element.
*/

window._cachedFinalProjection = null;
window._activeUnifiedLayerIdx = 0;
window.isTraining = false;
window._paramBreakdownOpen = false;
window._paramBreakdownRendered = false;
const widthEmbeddingInit = 5;
const nr_fixed = 4;
const posEmbedScalar = 1;
let trainingDebounceTimer;
const epsilon = 1e-6;
window.currentTrainingWindows = [];
const attentionRenderRegistry = new Map();
const positionalShiftRegistry = new Map();
const embeddingRenderRegistry = new Map();
const trajectoryRenderRegistry = new Map();
const multiLayerAttentionRegistry = new Map();
const transformerLabVisMigrationDataRegistry = new Map();
const positionalWavesRegistry = new Map();

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
	steps: []
};

function buildTrajectoryHoverText(tokenLabel, tIdx, fromStage, toStage, hVec, embSnap, snapVocab) {
	const logitWord = _traj_get_logit_word(hVec, embSnap, snapVocab);
	return `Token: ${tokenLabel} (pos ${tIdx + 1})<br>` +
		`From: ${fromStage}<br>` +
		`To: ${toStage}<br>` +
		`Nearest logit: <b>${logitWord}</b>`;
}

function registerLazyRenderable(containerId, registry, observer, data, renderFn, placeholder) {
	const container = document.getElementById(containerId);
	if (!container) return;

	data.rendered = false;
	registry.set(containerId, data);

	if (placeholder && !container.innerHTML) {
		container.innerHTML = placeholder;
	}

	observer.observe(container);

	if (isElementInViewport(container)) {
		renderFn();
		const entry = registry.get(containerId);
		if (entry) entry.rendered = true;
	}
}

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

function matAdd(A, B) {
	return A.map((row, i) => row.map((val, j) => val + B[i][j]));
}

function getTransformerConfig() {
	return {
		d_model:     parseInt(document.getElementById('transformer-dimension-model')?.value)  || 3,
		n_heads:     parseInt(document.getElementById('transformer-heads')?.value)             || 1,
		n_layers:    parseInt(document.getElementById('transformer-depth')?.value)             || 1,
		temperature: parseFloat(document.getElementById('transformer-temperature')?.value)     || 1.0,
	};
}

function runSimpleForwardPass(tokens, weights, d_model, n_heads, n_layers) {
	if (n_layers === undefined) n_layers = weights.length;
	let h = embedTokensWithPE(tokens, d_model);
	for (let l = 0; l < n_layers; l++) {
		const result = forwardOneLayer(h, weights[l], d_model, n_heads, tokens, null);
		h = result.h_out;
	}
	return h;
}

function embedTokensWithPE(tokens, d_model, embSpace = window.persistentEmbeddingSpace) {
	return tokens.map((token, pos) => {
		const emb = (embSpace && embSpace[token]) || new Array(d_model).fill(0);
		return addPositionalEncoding(emb, pos, d_model, posEmbedScalar);
	});
}

function softmax(logits) {
	const maxLogit = Math.max(...logits);
	const exps = logits.map(l => Math.exp(l - maxLogit));
	const sumExps = exps.reduce((a, b) => a + b, 0);
	return exps.map(e => e / sumExps);
}

function matMul(matrix, weights, bias = null) {
	return matrix.map(row =>
		weights[0].map((_, j) => {
			let sum = bias ? bias[j] : 0;
			for (let k = 0; k < row.length; k++) sum += row[k] * weights[k][j];
			return sum;
		})
	);
}

function forwardOneLayer(h_current, layerWeights, d_model, n_heads, tokenStrings = null, containerId = null, ffnLayerIndex = null) {
	// 1. Pre-LN before attention
	const normH = calculateLayerNorm(h_current, layerWeights.gamma, layerWeights.beta);

	// 2. Multi-head attention WITH causal mask
	const headData = causalMultiHeadAttention(
		normH,
		layerWeights.attention,
		d_model,
		n_heads
	);

	// 3. Visualization setup
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

	// 6b. Per-layer concat/layernorm/h1 visualization — now with tokenStrings
	if (ffnLayerIndex !== null) {
		ensureFFNLayerContainers(ffnLayerIndex);
		updateConcatenationDisplayForLayer(headData, tokenStrings || h_current, ffnLayerIndex, tokenStrings);
		render_h1_logic_for_layer(h_current, normH, concat, layerWeights.gamma, layerWeights.beta, Wo, ffnLayerIndex, tokenStrings);
	}

	// 7. FFN block — now with tokenStrings
	const skipFFNRender = (ffnLayerIndex === null);
	const h_out = run_ffn_block(h_attn, layerWeights, skipFFNRender, ffnLayerIndex !== null ? ffnLayerIndex : 0, tokenStrings);

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
	$("#show_training_sentences").hide();
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

const paramBreakdownObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting && window._paramBreakdownOpen && !window._paramBreakdownRendered) {
			_executeParamBreakdownRender();
		}
	});
}, { threshold: 0 });

function show_nr_of_params() {
	const weights = window.currentWeights;
	const nrDiv = document.getElementById('nr_params');
	const toggleDiv = document.getElementById('param-breakdown-toggle');
	const chartDiv = document.getElementById('param-breakdown-chart');

	if (!weights || weights.length === 0) {
		if (nrDiv) { nrDiv.innerHTML = ''; nrDiv.style.display = 'none'; }
		if (toggleDiv) toggleDiv.style.display = 'none';
		if (chartDiv) chartDiv.style.display = 'none';

		// *** FIX: Reset the toggle state so it doesn't get out of sync ***
		if (window._paramBreakdownOpen) {
			window._paramBreakdownOpen = false;
			window._paramBreakdownRendered = false;
			const btn = document.getElementById('param-breakdown-btn');
			if (btn) {
				btn.innerHTML = `<span id="param-breakdown-arrow" style="transition: transform 0.2s; transform: rotate(0deg);">▶</span> Show Parameter Breakdown`;
			}
			paramBreakdownObserver.unobserve(chartDiv);
		}
		return;
	}

	// Count internal layer parameters (attention, FFN, LayerNorm)
	const internalParams = countAllNumbers(weights);

	// Count embedding parameters (vocab_size × d_model) to match the sunburst chart
	const vocab = window.persistentEmbeddingSpace ? Object.keys(window.persistentEmbeddingSpace) : [];
	const d_model = window.last_d_model || 0;
	const embeddingParams = vocab.length * d_model;

	const nr_params = internalParams + embeddingParams;

	if (!nr_params) {
		if (nrDiv) { nrDiv.innerHTML = ''; nrDiv.style.display = 'none'; }
		if (toggleDiv) toggleDiv.style.display = 'none';
		if (chartDiv) chartDiv.style.display = 'none';

		// *** FIX: Same reset here for the zero-params case ***
		if (window._paramBreakdownOpen) {
			window._paramBreakdownOpen = false;
			window._paramBreakdownRendered = false;
			const btn = document.getElementById('param-breakdown-btn');
			if (btn) {
				btn.innerHTML = `<span id="param-breakdown-arrow" style="transition: transform 0.2s; transform: rotate(0deg);">▶</span> Show Parameter Breakdown`;
			}
			paramBreakdownObserver.unobserve(chartDiv);
		}
		return;
	}

	if (nrDiv) {
		nrDiv.innerHTML = `The current network has <b>${nr_params.toLocaleString()}</b> parameters.`;
		nrDiv.style.display = 'block';
	}

	if (toggleDiv) toggleDiv.style.display = 'block';

	// If the panel is already open, force an immediate re-render
	if (window._paramBreakdownOpen) {
		window._paramBreakdownRendered = false;
		_executeParamBreakdownRender();
	}
}

function toggleParamBreakdown() {
	const chartDiv = document.getElementById('param-breakdown-chart');
	const btn = document.getElementById('param-breakdown-btn');
	if (!chartDiv || !btn) return;

	window._paramBreakdownOpen = !window._paramBreakdownOpen;

	if (window._paramBreakdownOpen) {
		chartDiv.style.display = 'block';

		// Update button text with arrow already rotated via inline style
		btn.innerHTML = `<span id="param-breakdown-arrow" style="transition: transform 0.2s; transform: rotate(90deg);">▶</span> Hide Parameter Breakdown`;

		// Start observing for lazy render
		paramBreakdownObserver.observe(chartDiv);

		// Always render immediately when opening — don't rely on observer
		window._paramBreakdownRendered = false;
		_executeParamBreakdownRender();
	} else {
		chartDiv.style.display = 'none';

		// Update button text with arrow in default (collapsed) rotation
		btn.innerHTML = `<span id="param-breakdown-arrow" style="transition: transform 0.2s; transform: rotate(0deg);">▶</span> Show Parameter Breakdown`;

		paramBreakdownObserver.unobserve(chartDiv);
	}
}

function _executeParamBreakdownRender() {
	if (window._paramBreakdownRendered) return;

	const weights = window.currentWeights;
	if (!weights || weights.length === 0) return;

	window._paramBreakdownRendered = true;
	renderParamBreakdown(weights);
}

function renderParamBreakdown(weights) {
	const { d_model, n_heads } = getTransformerConfig();
	const d_ff = d_model * 4;
	const n_layers = weights.length;

	// Count embedding parameters
	const vocab = window.persistentEmbeddingSpace ? Object.keys(window.persistentEmbeddingSpace) : [];
	const embeddingParams = vocab.length * d_model;

	// Per-layer breakdown
	const layerBreakdowns = [];
	let totalAttention = 0;
	let totalFFN = 0;
	let totalNorm = 0;

	for (let l = 0; l < n_layers; l++) {
		const layer = weights[l];

		const qParams = countAllNumbers(layer.attention.query);
		const kParams = countAllNumbers(layer.attention.key);
		const vParams = countAllNumbers(layer.attention.value);
		const oParams = countAllNumbers(layer.attention.output);
		const attnTotal = qParams + kParams + vParams + oParams;

		const w1Params = countAllNumbers(layer.W1);
		const b1Params = countAllNumbers(layer.b1);
		const w2Params = countAllNumbers(layer.W2);
		const b2Params = countAllNumbers(layer.b2);
		const ffnTotal = w1Params + b1Params + w2Params + b2Params;

		const norm1Params = countAllNumbers(layer.gamma) + countAllNumbers(layer.beta);
		const norm2Params = countAllNumbers(layer.gamma2 || []) + countAllNumbers(layer.beta2 || []);
		const normTotal = norm1Params + norm2Params;

		totalAttention += attnTotal;
		totalFFN += ffnTotal;
		totalNorm += normTotal;

		layerBreakdowns.push({
			layer: l + 1,
			attention: { q: qParams, k: kParams, v: vParams, o: oParams, total: attnTotal },
			ffn: { w1: w1Params, b1: b1Params, w2: w2Params, b2: b2Params, total: ffnTotal },
			norm: { pre_attn: norm1Params, pre_ffn: norm2Params, total: normTotal },
			total: attnTotal + ffnTotal + normTotal
		});
	}

	const grandTotal = embeddingParams + totalAttention + totalFFN + totalNorm;

	renderParamSunburst(layerBreakdowns, embeddingParams, grandTotal, d_model, n_heads, d_ff);
	renderParamTable(layerBreakdowns, embeddingParams, grandTotal);
}

function renderParamSunburst(layerBreakdowns, embeddingParams, grandTotal, d_model, n_heads, d_ff) {
    const sunburstData = buildSunburstData(layerBreakdowns, embeddingParams, grandTotal, d_model, n_heads, d_ff);
    const trace = buildSunburstTrace(sunburstData);
    const layout = buildSunburstLayout();

    Plotly.react('param-breakdown-plotly', [trace], layout, { responsive: true });
}

// ─── Sunburst data assembly ─────────────────────────────────────────

/**
 * Assembles all parallel arrays (ids, labels, parents, values, hoverTexts, colors)
 * needed by the Plotly sunburst trace.
 */
function buildSunburstData(layerBreakdowns, embeddingParams, grandTotal, d_model, n_heads, d_ff) {
    const data = createEmptySunburstArrays();

    appendSunburstRoot(data, grandTotal);
    appendSunburstEmbeddings(data, embeddingParams);

    layerBreakdowns.forEach(lb => {
        appendSunburstLayer(data, lb, d_model, d_ff);
    });

    return data;
}

/**
 * Creates the empty accumulator object for sunburst arrays.
 */
function createEmptySunburstArrays() {
    return {
        ids: [], labels: [], parents: [], values: [], hoverTexts: [], colors: [],
        // Color constants
        embColor: '#6366f1',
        attnColor: '#3b82f6',
        ffnColor: '#f59e0b',
        normColor: '#10b981'
    };
}

/**
 * Appends the root "Total" node.
 */
function appendSunburstRoot(data, grandTotal) {
    data.ids.push('total');
    data.labels.push(`Total: ${grandTotal.toLocaleString()}`);
    data.parents.push('');
    data.values.push(grandTotal);
    data.hoverTexts.push(`Total parameters: ${grandTotal.toLocaleString()}`);
    data.colors.push('#1e293b');
}

/**
 * Appends the "Embeddings" node under root.
 */
function appendSunburstEmbeddings(data, embeddingParams) {
    data.ids.push('embeddings');
    data.labels.push('Embeddings');
    data.parents.push('total');
    data.values.push(embeddingParams);
    data.hoverTexts.push(`Embedding table: ${embeddingParams.toLocaleString()} params<br>vocab × d_model`);
    data.colors.push(data.embColor);
}

/**
 * Appends a full layer node (attention + FFN + LayerNorm) with all children.
 */
function appendSunburstLayer(data, lb, d_model, d_ff) {
    const layerId = `layer-${lb.layer}`;

    // Layer parent node
    data.ids.push(layerId);
    data.labels.push(`Layer ${lb.layer}`);
    data.parents.push('total');
    data.values.push(lb.total);
    data.hoverTexts.push(`Layer ${lb.layer}: ${lb.total.toLocaleString()} params`);
    data.colors.push('#475569');

    appendSunburstAttention(data, layerId, lb, d_model);
    appendSunburstFFN(data, layerId, lb, d_model, d_ff);
    appendSunburstNorm(data, layerId, lb, d_model);
}

/**
 * Appends the Attention sub-tree for a layer.
 */
function appendSunburstAttention(data, layerId, lb, d_model) {
    const attnId = `${layerId}-attn`;

    data.ids.push(attnId);
    data.labels.push('Attention');
    data.parents.push(layerId);
    data.values.push(lb.attention.total);
    data.hoverTexts.push(`Attention: ${lb.attention.total.toLocaleString()} params<br>Q + K + V + O projections`);
    data.colors.push(data.attnColor);

    const attnChildren = [
        { key: 'q', label: 'W_Q', desc: `Query: ${d_model}×${d_model}` },
        { key: 'k', label: 'W_K', desc: `Key: ${d_model}×${d_model}` },
        { key: 'v', label: 'W_V', desc: `Value: ${d_model}×${d_model}` },
        { key: 'o', label: 'W_O', desc: `Output: ${d_model}×${d_model}` }
    ];

    attnChildren.forEach(({ key, label, desc }) => {
        appendSunburstLeaf(data, `${attnId}-${key}`, label, attnId, lb.attention[key], desc, data.attnColor);
    });
}

/**
 * Appends the FFN sub-tree for a layer.
 */
function appendSunburstFFN(data, layerId, lb, d_model, d_ff) {
    const ffnId = `${layerId}-ffn`;

    data.ids.push(ffnId);
    data.labels.push('FFN');
    data.parents.push(layerId);
    data.values.push(lb.ffn.total);
    data.hoverTexts.push(`FFN: ${lb.ffn.total.toLocaleString()} params<br>W1 + b1 + W2 + b2`);
    data.colors.push(data.ffnColor);

    const ffnChildren = [
        { key: 'w1', label: 'W₁', desc: `Expansion: ${d_model}×${d_ff}` },
        { key: 'b1', label: 'b₁', desc: `Bias: ${d_ff}` },
        { key: 'w2', label: 'W₂', desc: `Compression: ${d_ff}×${d_model}` },
        { key: 'b2', label: 'b₂', desc: `Bias: ${d_model}` }
    ];

    ffnChildren.forEach(({ key, label, desc }) => {
        appendSunburstLeaf(data, `${ffnId}-${key}`, label, ffnId, lb.ffn[key], desc, data.ffnColor);
    });
}

/**
 * Appends the LayerNorm sub-tree for a layer.
 */
function appendSunburstNorm(data, layerId, lb, d_model) {
    const normId = `${layerId}-norm`;

    data.ids.push(normId);
    data.labels.push('LayerNorm');
    data.parents.push(layerId);
    data.values.push(lb.norm.total);
    data.hoverTexts.push(`LayerNorm: ${lb.norm.total.toLocaleString()} params<br>γ + β (pre-attn & pre-FFN)`);
    data.colors.push(data.normColor);

    appendSunburstLeaf(data, `${normId}-pre-attn`, 'Pre-Attn', normId, lb.norm.pre_attn,
        `Pre-Attention Norm: ${lb.norm.pre_attn.toLocaleString()} params<br>γ (${d_model}) + β (${d_model})`, data.normColor);

    appendSunburstLeaf(data, `${normId}-pre-ffn`, 'Pre-FFN', normId, lb.norm.pre_ffn,
        `Pre-FFN Norm: ${lb.norm.pre_ffn.toLocaleString()} params<br>γ₂ (${d_model}) + β₂ (${d_model})`, data.normColor);
}

/**
 * Appends a single leaf node to the sunburst arrays.
 */
function appendSunburstLeaf(data, id, label, parentId, value, hoverDesc, color) {
    data.ids.push(id);
    data.labels.push(label);
    data.parents.push(parentId);
    data.values.push(value);
    data.hoverTexts.push(`${label}: ${value.toLocaleString()} params<br>${hoverDesc}`);
    data.colors.push(color);
}

// ─── Plotly trace & layout construction ─────────────────────────────

/**
 * Builds the Plotly sunburst trace object from assembled data arrays.
 */
function buildSunburstTrace(data) {
    return {
        type: 'sunburst',
        ids: data.ids,
        labels: data.labels,
        parents: data.parents,
        values: data.values,
        hovertext: data.hoverTexts,
        hoverinfo: 'text',
        branchvalues: 'total',
        marker: { colors: data.colors, line: { width: 1, color: '#fff' } },
        textinfo: 'label+percent parent',
        insidetextorientation: 'radial',
        maxdepth: 3
    };
}

/**
 * Builds the Plotly layout for the sunburst chart.
 */
function buildSunburstLayout() {
    return {
        title: { text: 'Parameter Distribution', font: { size: 14, color: '#1e293b' } },
        margin: { t: 40, b: 10, l: 10, r: 10 }
    };
}

/**
 * Renders a compact HTML summary table of parameter counts.
 */
function renderParamTable(layerBreakdowns, embeddingParams, grandTotal) {
    const tableDiv = document.getElementById('param-breakdown-table');
    if (!tableDiv) return;

    const fmt = (n) => n.toLocaleString();
    const pct = (n) => ((n / grandTotal) * 100).toFixed(1);

    const { totalAttn, totalFFN, totalNorm } = aggregateLayerTotals(layerBreakdowns);
    const d_model = inferDModelFromBreakdowns(layerBreakdowns);
    const vocab = window.persistentEmbeddingSpace ? Object.keys(window.persistentEmbeddingSpace) : [];

    let html = buildParamTableHeader();
    html += buildEmbeddingRow(embeddingParams, vocab.length, d_model, fmt, pct);
    html += buildAllLayerRows(layerBreakdowns, fmt, pct);
    html += buildTotalRow(grandTotal, totalAttn, totalFFN, fmt, pct);
    html += `</tbody></table>`;

    tableDiv.innerHTML = html;
}

/**
 * Sums attention, FFN, and norm parameter counts across all layers.
 */
function aggregateLayerTotals(layerBreakdowns) {
    let totalAttn = 0, totalFFN = 0, totalNorm = 0;
    layerBreakdowns.forEach(lb => {
        totalAttn += lb.attention.total;
        totalFFN += lb.ffn.total;
        totalNorm += lb.norm.total;
    });
    return { totalAttn, totalFFN, totalNorm };
}

/**
 * Infers d_model from the first layer's pre-attention norm param count.
 */
function inferDModelFromBreakdowns(layerBreakdowns) {
    return layerBreakdowns.length > 0 ? (layerBreakdowns[0].norm.pre_attn / 2) : 0;
}

/**
 * Builds the <table> opening tag and <thead> for the parameter breakdown table.
 */
function buildParamTableHeader() {
    return `<table style="width:100%; border-collapse:collapse; font-family:'Inter',sans-serif; font-size:0.8rem;">
    <thead>
    <tr style="background:#f1f5f9; border-bottom:2px solid #cbd5e1;">
        <th style="padding:6px 10px; text-align:left;">Component</th>
        <th style="padding:6px 10px; text-align:right;">Parameters</th>
        <th style="padding:6px 10px; text-align:right;">% of Total</th>
        <th style="padding:6px 10px; text-align:left;">Shape</th>
    </tr>
    </thead>
    <tbody>`;
}

/**
 * Builds the embedding row HTML.
 */
function buildEmbeddingRow(embeddingParams, vocabSize, d_model, fmt, pct) {
    return `<tr style="background:#eef2ff; border-bottom:1px solid #e2e8f0;">
    <td style="padding:6px 10px; font-weight:600; color:#6366f1;">Embeddings</td>
    <td style="padding:6px 10px; text-align:right; font-weight:600;">${fmt(embeddingParams)}</td>
    <td style="padding:6px 10px; text-align:right;">${pct(embeddingParams)}%</td>
    <td style="padding:6px 10px; color:#64748b;">${vocabSize} × ${d_model || '?'}</td>
    </tr>`;
}

/**
 * Builds all per-layer rows (header + attention + FFN + norm sub-rows).
 */
function buildAllLayerRows(layerBreakdowns, fmt, pct) {
    return layerBreakdowns.map(lb => buildSingleLayerRows(lb, fmt, pct)).join('');
}

/**
 * Builds the rows for a single layer: a header row plus three detail sub-rows.
 */
function buildSingleLayerRows(lb, fmt, pct) {
    let html = `<tr style="background:#f8fafc; border-bottom:1px solid #f1f5f9;">
        <td style="padding:6px 10px; font-weight:600;" colspan="4">Layer ${lb.layer} — ${fmt(lb.total)} params (${pct(lb.total)}%)</td>
    </tr>`;

    html += buildLayerSubRow('Attention (Q+K+V+O)', '#3b82f6', lb.attention.total, '4 × (d×d)', fmt, pct);
    html += buildLayerSubRow('FFN (W₁+b₁+W₂+b₂)', '#f59e0b', lb.ffn.total, 'd×4d + 4d + 4d×d + d', fmt, pct);
    html += buildLayerSubRow('LayerNorm (γ+β ×2)', '#10b981', lb.norm.total, '4 × d', fmt, pct, 'border-bottom:1px solid #e2e8f0;');

    return html;
}

/**
 * Builds a single indented sub-row for a layer component (attention, FFN, or norm).
 */
function buildLayerSubRow(label, color, total, shape, fmt, pct, extraStyle = 'border-bottom:1px solid #f1f5f9;') {
    return `<tr style="${extraStyle}">
        <td style="padding:4px 10px 4px 30px; color:${color};">${label}</td>
        <td style="padding:4px 10px; text-align:right;">${fmt(total)}</td>
        <td style="padding:4px 10px; text-align:right;">${pct(total)}%</td>
        <td style="padding:4px 10px; color:#64748b;">${shape}</td>
    </tr>`;
}

/**
 * Builds the grand-total summary row at the bottom of the table.
 */
function buildTotalRow(grandTotal, totalAttn, totalFFN, fmt, pct) {
    const attnVsFFN = totalAttn > 0 ? (totalFFN / totalAttn).toFixed(1) : '—';
    return `<tr style="background:#f0fdf4; border-top:2px solid #10b981; font-weight:700;">
    <td style="padding:8px 10px;">Total</td>
    <td style="padding:8px 10px; text-align:right;">${fmt(grandTotal)}</td>
    <td style="padding:8px 10px; text-align:right;">100%</td>
    <td style="padding:8px 10px; color:#064e3b; font-weight:normal; font-size:0.75rem;">
        FFN is ${attnVsFFN}× the size of Attention
    </td>
    </tr>`;
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

	let html = `<div class='transformer_positional_embeddings'>`;

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

    registerLazyRenderable(
        containerId,
        positionalWavesRegistry,
        positionalWavesObserver,
        { d_model, tokens },
        () => _execute_positional_waves_render(d_model, tokens),
        `<div style="padding:20px; color:#64748b;">Waiting for Positional Waves plot to load...</div>`
    );
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

	/*
TODO: Mention in text
Without this, a single pathological training example could produce a gradient so large that it destroys all learned weights in one step — the "exploding gradient" problem.The aha: This connects directly to the catastrophic forgetting and Frame Problem discussion in your philosophy file
. Gradient clipping is a brute-force solution: "no single learning event is allowed to change the model more than X amount." It's the numerical equivalent of a biological immune system — the body allows gradual adaptation (learning) but violently rejects sudden massive changes (infection/explosion). Without it, one bad sentence in the training data could "infect" the entire model. With it, the damage is bounded. But just like an immune system, it's imperfect — it can also suppress legitimate large updates that the model actually needs, slowing learning on genuinely novel patterns.
*/

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
		window._cachedFinalProjection = null;

		reset_graph();
		calculate_vector_math();

		// Clear the global migration container
		const migrationContainer = document.getElementById('transformer-migration-plots-container');
		if (migrationContainer) {
			// Dispose any ECharts instances inside before clearing
			migrationContainer.querySelectorAll('[id^="migration-layer-"]').forEach(el => {
				const chart = echarts.getInstanceByDom(el);
				if (chart) chart.dispose();
			});
			migrationContainer.innerHTML = '';
			transformerLabVisMigrationDataRegistry.clear();
		}

		// Also clear per-layer migration containers inside unified tabs
		const ffnContainer = document.getElementById('ffn-equations-container');
		if (ffnContainer) {
			ffnContainer.querySelectorAll('[id$="-migration-container"]').forEach(el => {
				// Dispose ECharts on any plot divs inside
				el.querySelectorAll('[id^="migration-layer-"]').forEach(plotEl => {
					const chart = echarts.getInstanceByDom(plotEl);
					if (chart) chart.dispose();
				});
				el.innerHTML = '';
			});
			// Force full rebuild of unified tabs since d_model changed
			ffnContainer.innerHTML = '';
		}

		// Clear multi-layer attention registry so stale layer data doesn't persist
		multiLayerAttentionRegistry.clear();

		window.tlab_trajectory_collector = null;
		const oldTrajDiv = document.getElementById('transformer-trajectory-full-path');
		if (oldTrajDiv) {
			// Dispose any ECharts or Plotly on the trajectory div
			const trajChart = echarts.getInstanceByDom(oldTrajDiv);
			if (trajChart) trajChart.dispose();
			Plotly.purge(oldTrajDiv);
			oldTrajDiv.remove();
		}
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
		// Mark all migration entries as needing re-render.
		// NOTE: The IntersectionObserver will handle entries that scroll INTO
		// view later. For entries already in the viewport, the caller
		// (renderForwardPassOrPlaceholder) must explicitly check and re-render
		// them after the forward pass completes.
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

function runVisualizedLayer0(h0, tokensWithPositional, knownTokens, weights, d_model, n_heads) {
	multiLayerAttentionRegistry.clear();

	const normH0 = calculateLayerNorm(h0, weights[0]["gamma"], weights[0]["beta"]);

	const headData = causalMultiHeadAttention(normH0, weights[0]["attention"], d_model, n_heads);

	// Use per-layer unified containers for layer 0
	ensureFFNLayerContainers(0);

	// Register attention engine with a virtual container ID that maps to unified tabs
	const virtualContainerId = "unified-attention-engine";
	const engine = new AttentionEngine({
		d_model, n_heads,
		containerId: virtualContainerId,
		weights: weights[0]["attention"]
	});
	engine.forward(normH0, tokensWithPositional, knownTokens);

	const regEntry = attentionRenderRegistry.get(virtualContainerId);
	if (regEntry) { regEntry.headData = headData; regEntry.rendered = false; }

	const multiHeadOutput = updateConcatenationDisplayForLayer(headData, tokensWithPositional, 0, knownTokens);

	// Also still update the old global container for backward compat
	updateConcatenationDisplay(headData, tokensWithPositional, knownTokens);

	const Wo_layer0 = weights[0]["attention"]["output"];
	const projected = matMul(multiHeadOutput, Wo_layer0);
	const h1 = matAdd(h0, projected);

	render_h1_logic_for_layer(h0, normH0, multiHeadOutput, weights[0]["gamma"], weights[0]["beta"], Wo_layer0, 0, knownTokens);

	// Keep old global render for backward compat
	render_h1_logic(h0, normH0, multiHeadOutput, weights[0]["gamma"], weights[0]["beta"], Wo_layer0, knownTokens);

	const h2 = run_ffn_block(h1, weights[0], false, 0, knownTokens);
	return h2;
}

/**
 * Per-layer version of render_h1_logic.
 * Renders the LayerNorm + output projection + residual connection
 * into the unified layer tab containers instead of the global ones.
 *
 * @param {number[][]} h0             - Input to this sub-block (pre-attention hidden state)
 * @param {number[][]} normH0         - LayerNorm(h0)
 * @param {number[][]} multiHeadOutput - Concatenated head contexts
 * @param {number[]}   gamma          - LayerNorm scale parameter
 * @param {number[]}   beta           - LayerNorm shift parameter
 * @param {number[][]} WO             - Output projection matrix
 * @param {number}     layerIndex     - Zero-based layer index
 * @param {string[]}   tokenStrings   - Token labels for matrix row annotations
 */
function render_h1_logic_for_layer(h0, normH0, multiHeadOutput, gamma, beta, WO, layerIndex, tokenStrings) {
    const prefix = `unified-layer-${layerIndex}`;
    const normContainer = document.getElementById(`${prefix}-layernorm-viz`);
    const finalContainer = document.getElementById(`${prefix}-h1-final-viz`);
    if (!normContainer || !finalContainer || !gamma || !beta || !WO) return;

    const projectedMHA = projectMHAOutput(multiHeadOutput, WO);
    const h1 = matAdd(h0, projectedMHA);

    const hash = computeH1Hash(h0, normH0, multiHeadOutput, projectedMHA, h1, gamma, beta);
    if (normContainer._lastHash === hash && finalContainer._lastHash === hash) {
        return h1;
    }
    normContainer._lastHash = hash;
    finalContainer._lastHash = hash;

    const ts = tokenStrings || null;
    const naming = _h1NamingForLayer(layerIndex);

    const normHtml = buildH1NormHtmlForLayer(h0, normH0, gamma, beta, ts, naming);
    const finalHtml = buildH1FinalHtmlForLayer(h0, projectedMHA, multiHeadOutput, h1, WO, ts, naming);

    _heightLockedUpdate(normContainer, normHtml);
    _heightLockedUpdate(finalContainer, finalHtml);
    _renderTemmlOnElements([normContainer, finalContainer]);
    _releaseHeightLocks([normContainer, finalContainer]);

    return h1;
}

/**
 * Derives LaTeX naming conventions for the h1 display of a given layer.
 */
function _h1NamingForLayer(layerIndex) {
    const L = layerIndex + 1;
    const sup = `^{(${L})}`;
    const base = layerIndex * 2;
    const hInName = `h_{${base}}`;
    const hOutName = `h_{${base + 1}}`;
    const hInStage = layerIndex === 0
        ? 'embedding + PE'
        : `out layer ${layerIndex}`;
    return { L, sup, hInName, hOutName, hInStage };
}

/**
 * Builds the Pre-Layer Normalization HTML for a specific layer's h1 section.
 */
function buildH1NormHtmlForLayer(h0, normH0, gamma, beta, ts, naming) {
    const { sup, hInName, hInStage } = naming;

    return `
    <p style="font-weight:bold; color:#065f46;">Pre-Layer Normalization (applied <em>before</em> the sublayer)</p>

    <div style="margin-bottom:15px;">
    <p style="font-size:0.85rem; color:#1e40af;">1. Normalize $${hInName}${sup}$ before attention:</p>
    $$ \\text{LayerNorm}(${hInName}${sup}) = \\underbrace{\\gamma${sup}}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} \\underbrace{\\odot}_{\\substack{\\text{Hadamard} \\\\ \\text{Product}}} \\frac{${hInName}${sup} - \\underbrace{\\mu}_{\\text{Mean of } ${hInName}${sup}}}{\\sqrt{\\underbrace{\\sigma^2}_{\\text{Variance of } ${hInName}${sup}}} + \\underbrace{\\epsilon}_{${epsilon}}} + \\underbrace{\\beta${sup}}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} $$
    <div style="overflow-x:auto; padding-bottom: 10px">
    $$ \\underbrace{${matrixToPmatrixLabeled(normH0, ts, 'after LN')}}_{\\text{LayerNorm}\\left(${hInName}${sup}\\right)} = \\text{LayerNorm}\\!\\left(\\underbrace{${matrixToPmatrixLabeled(h0, ts, hInStage)}}_{${hInName}${sup}},\\; \\underbrace{${vecToPmatrix(gamma)}}_{\\gamma${sup}},\\; \\underbrace{${vecToPmatrix(beta)}}_{\\beta${sup}}\\right) $$
    <br>
    </div>
    </div>
    `;
}

/**
 * Builds the output projection + residual connection HTML for a specific layer's h1 section.
 */
function buildH1FinalHtmlForLayer(h0, projectedMHA, multiHeadOutput, h1, WO, ts, naming) {
    const { sup, hInName, hOutName, hInStage } = naming;

    return `
    <div style="margin-bottom:15px;">
    <p style="font-size:0.85rem; color:#1e40af;">2. Output projection $W^O{${sup}}$ mixes head outputs:</p>
    $$ \\text{MHA}_{\\text{proj}}${sup} = \\text{Concat}(\\text{Heads}) \\cdot W^O{${sup}} $$
    <div style="overflow-x:auto; overflow-y: hidden; padding-bottom: 10px">
    $$ \\underbrace{${matrixToPmatrixLabeled(projectedMHA, ts, 'after W^O proj')}}_{\\text{MHA}_\\text{proj}${sup}} = \\underbrace{${matrixToPmatrixLabeled(multiHeadOutput, ts, 'concat heads')}}_{\\text{Concat}\\left(\\text{Heads}\\right)} \\cdot \\underbrace{${matrixToPmatrix(WO)}}_{W^O{${sup}}} $$
    </div>
    </div>

    <div style="margin-bottom:10px;">
    <p style="font-size:0.85rem; color:#1e40af;">3. Residual connection (Pre-LN: no normalization on sublayer output):</p>
    $$ ${hOutName}${sup} = ${hInName}${sup} + \\text{MHA}_{\\text{proj}}${sup} $$
    </div>
    <div style="overflow-x:auto; overflow-y: hidden; padding-bottom: 10px">
    $$ \\underbrace{${matrixToPmatrixLabeled(h1, ts, 'after attn residual')}}_{${hOutName}${sup}} = \\underbrace{${matrixToPmatrixLabeled(h0, ts, hInStage)}}_{${hInName}${sup}} + \\underbrace{${matrixToPmatrixLabeled(projectedMHA, ts, 'after W^O proj')}}_{\\text{MHA}_{\\text{proj}}${sup}} $$
    </div>
    `;
}

/**
 * Triggers the detailed attention rendering and path visualization
 * for the MHA calculation details container.
 */
function renderAttentionDetails() {
	const virtualContainerId = "unified-attention-engine";
	const registryEntry = attentionRenderRegistry.get(virtualContainerId);
	if (registryEntry && registryEntry.instance) {
		registryEntry.rendered = false;
		registryEntry.instance.executeActualRender(registryEntry.headData, registryEntry.tokens);
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

    const targetHeight = getTrajectoryPlotHeight(d_model);

    if (!trajDiv) {
        trajDiv = document.createElement('div');
        trajDiv.id = containerId;
        document.getElementById('transformer-migration-plots-container').appendChild(trajDiv);

        trajDiv.style.cssText = `width:100%; height:${targetHeight}px; min-height:${targetHeight}px; border: 2px solid rgb(203, 213, 225); border-radius:12px; background:#f8fafc; display:flex; align-items:center; justify-content:center;`;
        trajDiv.setAttribute('data-d-model', d_model);
    } else {
        // Update height if d_model changed
        const prevDModel = parseInt(trajDiv.getAttribute('data-d-model') || '0');
        if (prevDModel !== d_model) {
            trajDiv.setAttribute('data-d-model', d_model);
            trajDiv.style.height = targetHeight + 'px';
            trajDiv.style.minHeight = targetHeight + 'px';
        }
    }

    registerLazyRenderable(
        containerId,
        trajectoryRenderRegistry,
        trajectoryObserver,
        { d_model },
        () => tlab_render_trajectory_plot(d_model),
        `<div class="traj-loading-placeholder" style="color:#94a3b8; font-size:0.95rem; padding:20px; text-align:center;">
            Rendering the Token Trajectory Plot may take a while
        </div>`
    );
}

/**
 * Removes migration plot DOM elements and registry entries
 * for layers that are no longer active.
 */
function pruneOrphanedMigrationPlots() {
    const globalContainer = document.getElementById('transformer-migration-plots-container');
    if (!window._activeMigrationIds) return;

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

function renderForwardPassOrPlaceholder(tokensWithPositional, knownTokens, h0, weights, d_model, n_heads, n_layers) {
    if (tokensWithPositional.length === 0) {
        showEmptyInputMessage();
        return;
    }

    clearFFNEquationsContainer();

    const h2 = runVisualizedLayer0(h0, tokensWithPositional, knownTokens, weights, d_model, n_heads);

    create_migration_plot('migration-layer-1', tokensWithPositional, h0, h2, 1, d_model, h2, knownTokens);

    run_deep_layers(h2, tokensWithPositional, n_layers, d_model, n_heads, weights, 1, knownTokens);

    renderAttentionDetails();
    renderTrajectoryPlot(d_model);
    pruneOrphanedMigrationPlots();

    forceRerenderVisibleMigrationPlots();
    forceRerenderVisibleTrajectoryPlot(d_model);
}

/**
 * Forces re-render of migration plots that are already in the viewport.
 * The IntersectionObserver only fires on visibility *transitions*, so
 * plots that were already visible when rendered=false was set in
 * prepareMigrationState() would never get re-rendered during training.
 */
function forceRerenderVisibleMigrationPlots() {
    transformerLabVisMigrationDataRegistry.forEach((data, id) => {
        if (!data.rendered) {
            const el = document.getElementById(id);
            if (el && isElementInViewport(el)) {
                render_migration_logic(id, data.tokens, data.start_h, data.end_h, data.layerNum, data.d_model, data.h_after, data.tokenStrings);
                data.rendered = true;
            }
        }
    });
}

/**
 * Forces re-render of the trajectory plot if it is already visible.
 * Its rendered flag was reset in prepareMigrationState() but
 * trajectoryObserver won't re-fire for an already-visible element.
 */
function forceRerenderVisibleTrajectoryPlot(d_model) {
    const trajId = 'transformer-trajectory-full-path';
    const trajEntry = trajectoryRenderRegistry.get(trajId);
    if (trajEntry && !trajEntry.rendered) {
        const trajEl = document.getElementById(trajId);
        if (trajEl && isElementInViewport(trajEl)) {
            tlab_render_trajectory_plot(d_model);
            trajEntry.rendered = true;
        }
    }
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
/**
 * Renders final prediction probabilities from the master token input.
 */
function renderFinalProbabilities(masterTokens, vocabulary, weights, d_model, n_heads, n_layers, temperature) {
    const knownMasterTokens = masterTokens.filter(token => vocabulary.includes(token));
    if (knownMasterTokens.length === 0) return;

    const h_final = runSimpleForwardPass(knownMasterTokens, weights, d_model, n_heads, n_layers);

    // *** NEU: Cache für Temperature-only Re-Rendering ***
    window._cachedFinalProjection = {
        h_final: h_final,
        vocabulary: vocabulary,
        d_model: d_model
    };

    render_final_projection(h_final, vocabulary, d_model, temperature);
}

window.select_suggested_word = (word) => {
	const masterInput = document.getElementById('transformer-master-token-input');
	masterInput.value += " " + word;

	// Set master as active and re-run
	run_transformer_demo('transformer-master-token-input');
};

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

	// Original probabilities (T=1.0)
	const originalLogits = logits.map(item => item.val);
	const originalProbs = softmax(originalLogits);

	// Temperature-scaled probabilities
	const scaledLogits = logits.map(item => item.val / temperature);
	const probs = softmax(scaledLogits);

	const predictions = logits.map((item, i) => ({
		word: item.word,
		prob: probs[i],
		originalProb: originalProbs[i],
		logit: item.val
	})).sort((a, b) => b.prob - a.prob);

	return { logits, predictions };
}

function buildPredictionChipsHtml(predictions, temperature) {
	let html = `<b>Final Probabilities (Click to Generate)</b>`;
	html += `<div class="prediction-chip-container" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom: 10px;">`;

	predictions.forEach(p => {
		const intensity = Math.min(1, p.prob * 5);
		const safeWord = p.word.replace(/'/g, "\\'").replace(/"/g, '&quot;');

		const tempInfo = `<span style="font-size:0.7rem; opacity:0.85; display:block; margin-top:2px; visibility:${Math.abs(temperature - 1.0) < 0.01 ? 'hidden' : 'visible'};">
    Original: ${(p.originalProb * 100).toFixed(1)}%<br>
    T=${temperature}: ${(p.prob * 100).toFixed(1)}%
</span>`;

		html += `<button class="predict-chip" onclick="select_suggested_word('${safeWord}')"
	    style="background:rgba(59, 130, 246, ${intensity}); padding:8px 15px; border-radius:20px; border:1px solid #3b82f6; cursor:pointer; color: ${p.prob > 0.4 ? 'white' : 'black'}; text-align:center;">
	    <strong>${p.word}</strong> (${(p.prob * 100).toFixed(1)}%)
	    ${tempInfo}
	</button>`;
	});

	html += `</div>`;
	return html;
}

function buildLogitDetailsHtml(h_last, logits) {
    const temperature = parseFloat(document.getElementById('transformer-temperature')?.value) || 1.0;
    const logitValues = logits.map(l => l.val);
    const vocabWords = logits.map(l => l.word);
    const W_vocab = logits.map(l => l.w_row);

    let html = buildHLastSection(h_last);
    html += buildVocabMatrixMultiplicationSection(h_last, vocabWords, W_vocab, logits);
    html += buildSoftmaxSection(logits, logitValues);
    html += buildTemperatureSection(logits, logitValues, temperature);
    html += `</span></div>`;
    return html;
}

/**
 * Builds the opening section showing the current h_last vector.
 */
function buildHLastDisplayLatex(h_last) {
    return h_last.map((v, dim) =>
        `\\underbrace{${v.toFixed(nr_fixed)}}_{\\substack{h_{${dim}} \\\\ \\text{hidden dim ${dim}}}}`
    ).join(', ');
}

function buildHLastSection(h_last) {
    const hLastLatex = buildHLastDisplayLatex(h_last);
    return `<div style="margin-top: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
    <span class="md">
    <p class="logit_calc">Current $h_\\text{last} = [${hLastLatex}]$ (the last layers' output matrix last line of the <i>inference</i>-data)</p>\n`;
}

/**
 * Builds the W_vocab × h_last = logits matrix multiplication LaTeX section.
 */
function buildVocabMatrixMultiplicationSection(h_last, vocabWords, W_vocab, logits) {
    const vocabMatrixRows = W_vocab.map((row, wIdx) => {
        const safeWord = vocabWords[wIdx].replace(/#/g, '\\#').replace(/_/g, '\\_');
        const vals = row.map(v => v.toFixed(nr_fixed)).join(' & ');
        return `\\color{#6366f1}{\\text{${safeWord}}} & ${vals}`;
    }).join(' \\\\ ');

    const vocabColSpec = 'r|' + 'r'.repeat(h_last.length);

    const hLastRows = h_last.map((v, dim) => {
        const color = getPositionColor(dim, h_last.length, 'temml');
        return `${color} ${v.toFixed(nr_fixed)}`;
    }).join(' \\\\ ');

    const logitRows = buildLogitLatexRows(logits);

    return `<div style="overflow-x:auto; padding:10px 0;">
$$
\\underbrace{
    \\left(\\begin{array}{${vocabColSpec}} ${vocabMatrixRows} \\end{array}\\right)
}_{W_{\\text{vocab}}\\;(\\text{${vocabWords.length} words} \\times d_{\\text{model}})}
\\cdot
\\underbrace{
    \\begin{pmatrix} ${hLastRows} \\end{pmatrix}
}_{h_{\\text{last}}}
=
\\underbrace{
    \\left(\\begin{array}{r|r} ${logitRows} \\end{array}\\right)
}_{\\text{logits}}
$$
</div>`;
}

/**
 * Builds the LaTeX rows for the logit vector display.
 */
function buildLogitLatexRows(logits) {
    return logits.map(({ word, val }) => {
        const safeWord = word.replace(/#/g, '\\#').replace(/_/g, '\\_');
        return `\\color{#6366f1}{\\text{${safeWord}}} & ${val.toFixed(nr_fixed)}`;
    }).join(' \\\\ ');
}

/**
 * Computes softmax probabilities from raw logit values.
 */
function computeSoftmaxFromLogits(logitValues) {
    const maxLogit = Math.max(...logitValues);
    const exps = logitValues.map(v => Math.exp(v - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sumExps);
}

/**
 * Builds the softmax(logits) = probabilities LaTeX section.
 */
function buildSoftmaxSection(logits, logitValues) {
    const probs = computeSoftmaxFromLogits(logitValues);
    const logitRows = buildLogitLatexRows(logits);

    const probRows = logits.map(({ word }, i) => {
        const safeWord = word.replace(/#/g, '\\#').replace(/_/g, '\\_');
        const color = getPositionColor(i, logits.length, 'temml');
        const pct = (probs[i] * 100).toFixed(2);
        return `${color} \\text{${safeWord}} & ${color} ${pct}\\%`;
    }).join(' \\\\ ');

    return `
<div style="overflow-x:auto; padding:10px 0;">
$$
\\underbrace{
    \\left(\\begin{array}{l|r}
    \\text{word} & \\% \\\\
    \\hline
    ${probRows}
    \\end{array}\\right)
}_{\\text{word probabilities}}
= \\text{softmax}\\!\\left(
\\underbrace{
    \\left(\\begin{array}{r|r} ${logitRows} \\end{array}\\right)
}_{\\text{logits}}
\\right)
$$
</div>`;
}

/**
 * Computes entropy in bits from a probability distribution.
 */
function computeEntropyBits(probs) {
    return -probs.reduce((sum, p) => sum + (p > 1e-12 ? p * Math.log2(p) : 0), 0);
}

/**
 * Builds the temperature-scaling comparison LaTeX section.
 */
function buildTemperatureSection(logits, logitValues, temperature) {
    const probs = computeSoftmaxFromLogits(logitValues);

    const scaledLogitValues = logitValues.map(v => v / temperature);
    const scaledProbs = computeSoftmaxFromLogits(scaledLogitValues);

    const scaledProbRows = buildTemperatureComparisonRows(logits, probs, scaledProbs, temperature);
    const entropySection = buildEntropyLatex(probs, scaledProbs, logits.length, temperature);

    return `
<div style="overflow-x:auto; padding:10px 0;">
$$
\\text{softmax}\\!\\left(\\frac{\\text{logit}_w}{\\underbrace{${temperature.toFixed(1)}}_{\\text{Temperature}}}\\right) =
\\left(\\begin{array}{l|r|r|r}
\\text{word} & P_{T=1} & P_{T=${temperature.toFixed(1)}} & \\Delta \\\\
\\hline
    ${scaledProbRows}
\\end{array}\\right)
$$
</div>

${entropySection}`;
}

/**
 * Builds the per-word probability comparison rows for the temperature table.
 */
function buildTemperatureComparisonRows(logits, probs, scaledProbs, temperature) {
    return logits.map(({ word }, i) => {
        const safeWord = word.replace(/#/g, '\\#').replace(/_/g, '\\_');
        const color = getPositionColor(i, logits.length, 'temml');
        const origPct = (probs[i] * 100).toFixed(2);
        const scaledPct = (scaledProbs[i] * 100).toFixed(2);
        const diff = (scaledProbs[i] - probs[i]) * 100;
        const diffSign = diff >= 0 ? '+' : '';
        return `${color} \\text{${safeWord}} & ${color} ${origPct}\\% & ${color} ${scaledPct}\\% & ${color} ${diffSign}${diff.toFixed(2)}\\%`;
    }).join(' \\\\ ');
}

/**
 * Builds the entropy comparison LaTeX display.
 */
function buildEntropyLatex(probs, scaledProbs, vocabSize, temperature) {
    const entropyOrig = computeEntropyBits(probs);
    const entropyScaled = computeEntropyBits(scaledProbs);
    const maxEntropy = Math.log2(vocabSize);

    return `<div style="overflow-x:auto; padding:10px 0;">
$$
H_{T=1} = ${entropyOrig.toFixed(4)} \\text{ bits}, \\quad
H_{T=${temperature.toFixed(1)}} = ${entropyScaled.toFixed(4)} \\text{ bits}, \\quad
H_{\\max} = \\log_2(${vocabSize}) = ${maxEntropy.toFixed(4)} \\text{ bits}
$$
</div>`;
}

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

function render_final_projection(h_final, vocabulary, d_model, temperature) {
	const container = document.getElementById('transformer-output-projection');
	if (!container) return;

	const h_last = h_final[h_final.length - 1];

	// 1. Pure computation
	const { logits, predictions } = computeFinalPredictions(h_last, vocabulary, d_model, temperature);

	// 2. Ensure DOM structure
	const { chipsDiv, detailsDiv } = ensureProjectionSubContainers(container);

	// 3. Always update chips
	chipsDiv.innerHTML = buildPredictionChipsHtml(predictions, temperature);

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

function render_embedding_plot(dimensions, highlightPos = null, steps = []) {
    const containerId = 'transformer-plotly-space';

    registerLazyRenderable(
        containerId,
        embeddingRenderRegistry,
        embeddingObserver,
        { d_model: dimensions, highlightPos, steps },
        () => _execute_embedding_render(dimensions, highlightPos, steps),
        `<div style="padding:20px; color:#64748b;">Wait for Embedding Space to load...</div>`
    );
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
 * Uses the same token-badge styling as the tokenizer lab.
 */
function renderTokenChips(container, tokens) {
	if (!container) return;

	container.innerHTML = '';

	tokens.forEach((t, i) => {
		const c = tokenColor(t);
		const displayToken = (t === ' ') ? '␣' : t;

		const badge = document.createElement('div');
		badge.className = 'token-badge token-enter';
		badge.style.cssText = `
	    --token-bg: ${c.bg};
	    --token-glow: ${c.glow};
	    --token-border: ${c.border};
	    animation-delay: ${i * 18}ms;
	`;

		badge.innerHTML = `
	    <span class="token-text">${escapeHtml(displayToken)}</span>
	`;

		badge.setAttribute('title', `"${t}" → ID ${c.id}`);
		container.appendChild(badge);
	});
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

function updateConcatenationDisplay(headData, tokens, tokenStrings) {
    const container = document.getElementById('transformer-concat-viz');
    if (!container || !headData.length) return [];

    const ts = tokenStrings || null;

    const headMatricesLaTeX = headData.map((h, i) => {
        return `\\underbrace{${matrixToPmatrixLabeled(h.context, ts)}}_{\\text{Head } ${i + 1}}`;
    }).join(', ');

    const fullMatrixData = tokens.map((_, tIdx) => {
        return [].concat(...headData.map(h => h.context[tIdx]));
    });

    const finalMatrixLaTeX = `\\underbrace{${matrixToPmatrixLabeled(fullMatrixData, ts)}}_{\\text{Total } d_{\\text{model}}}`;
    const newHtml = `<span style='overflow-x: auto; overflow-y: hidden'>$$ \\text{Concat} \\left( \\left[ ${headMatricesLaTeX} \\right] \\right) = ${finalMatrixLaTeX} $$</span>`;

    _heightLockedUpdate(container, newHtml);
    _renderTemmlOnElements([container]);
    _releaseHeightLocks([container]);

    return fullMatrixData;
}

function updateConcatenationDisplayForLayer(headData, tokens, layerIndex, tokenStrings) {
    const prefix = `unified-layer-${layerIndex}`;
    const container = document.getElementById(`${prefix}-concat-viz`);
    if (!container || !headData.length) return [];

    const ts = tokenStrings || null;

    const headMatricesLaTeX = headData.map((h, i) => {
        return `\\underbrace{${matrixToPmatrixLabeled(h.context, ts, `head ${i+1} ctx`)}}_{\\text{Head } ${i + 1}}`;
    }).join(', ');

    const fullMatrixData = tokens.map((_, tIdx) => {
        return [].concat(...headData.map(h => h.context[tIdx]));
    });

    const finalMatrixLaTeX = `\\underbrace{${matrixToPmatrixLabeled(fullMatrixData, ts, 'after concat')}}_{\\text{Total } d_{\\text{model}}}`;
    const newHtml = `<div style='overflow-x: auto; overflow-y: hidden; max-width: 100%;'>$$ \\text{Concat} \\left( \\left[ ${headMatricesLaTeX} \\right] \\right) = ${finalMatrixLaTeX} $$</span>`;

    _heightLockedUpdate(container, newHtml);
    _renderTemmlOnElements([container]);
    _releaseHeightLocks([container]);

    return fullMatrixData;
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

window.showFFNLayer = function(layerIdx) {
    // Redirect to the unified layer system
    showUnifiedLayer(layerIdx);
};

function clearFFNEquationsContainer() {
	const container = document.getElementById('ffn-equations-container');
	if (!container) return;

	// FIX: During training, do NOT destroy the unified tabs.
	// Only do a full clear when the architecture config has changed
	// (detected by comparing the number of existing layer tabs to n_layers).
	const { n_layers } = getTransformerConfig();
	const existingTabs = container.querySelectorAll('.unified-layer-tab-btn');

	if (existingTabs.length === n_layers) {
		// FIX: Tabs already exist with correct count — keep them, just mark FFN as needing update
		container.querySelectorAll('.unified-layer-tab-content').forEach(div => {
			div.dataset.ffnRendered = 'false';
		});
		return;
	}

	// Architecture changed — full clear so unified tabs get rebuilt fresh
	container.innerHTML = '';
}

function run_ffn_block(h1, params = {}, skipRender = false, layerIndex = 0, tokenStrings = null) {
	const d_model = h1[0].length;
	const d_ff = d_model * 4;

	let W1 = assertShape('W1', params.W1, d_model, d_ff);
	let b1 = assertShape('b1', params.b1, d_ff, 1);
	let W2 = assertShape('W2', params.W2, d_ff, d_model);
	let b2 = assertShape('b2', params.b2, d_model, 1);
	let gamma2 = params.gamma2 || new Array(d_model).fill(1.0);
	let beta2 = params.beta2 || new Array(d_model).fill(0.0);

	const normed_h1 = calculateLayerNorm(h1, gamma2, beta2);

	const out_L1 = matMul(normed_h1, W1, b1).map(row => row.map(v => Math.max(0, v)));

	const out_FFN = matMul(out_L1, W2, b2);

	const h2 = matAdd(h1, out_FFN);

	if (!skipRender) {
		render_ffn(h1, normed_h1, W1, b1, out_L1, W2, b2, out_FFN, h2, gamma2, beta2, layerIndex, tokenStrings);
	}

	return h2;
}

function render_ffn(h1, normed_h1, W1, b1, out_L1, W2, b2, out_FFN, h2, gamma, beta, layerIndex, tokenStrings) {
    ensureFFNLayerContainers(layerIndex);
    const prefix = `unified-layer-${layerIndex}`;

    const contentDiv = document.getElementById(`${prefix}-content`);
    if (!contentDiv) return;

    // Store latest data for deferred rendering
    contentDiv._deferredFFNData = { h1, normed_h1, W1, b1, out_L1, W2, b2, out_FFN, h2, gamma, beta, layerIndex, tokenStrings };

    if (contentDiv.style.display === 'none') {
        contentDiv.dataset.ffnRendered = 'false';
        return;
    }

    const hash = _ffnContentHash(h1, normed_h1, out_L1, out_FFN, h2, gamma, beta);

    if (contentDiv.dataset.ffnRendered === 'true' && contentDiv._lastFFNHash === hash) {
        return;
    }

    contentDiv._lastFFNHash = hash;
    _writeFFNContent(prefix, h1, normed_h1, W1, b1, out_L1, W2, b2, out_FFN, h2, gamma, beta, layerIndex, tokenStrings);
    contentDiv.dataset.ffnRendered = 'true';
}

function _ffnContentHash(h1, normed_h1, out_L1, out_FFN, h2, gamma, beta) {
	// Hash the DISPLAYED values (toFixed(nr_fixed)) so we only re-render
	// when what the user actually sees would change
	const flattenDisplay = (mat) => {
		if (!mat || !mat.length) return '';
		return mat.map(row => 
			Array.isArray(row) 
				? row.map(v => v.toFixed(nr_fixed)).join(',')
				: row.toFixed(nr_fixed)
		).join(';');
	};
	return [
		flattenDisplay(h1),
		flattenDisplay(normed_h1),
		flattenDisplay(out_L1),
		flattenDisplay(out_FFN),
		flattenDisplay(h2),
		flattenDisplay(gamma),
		flattenDisplay(beta)
	].join('|');
}

function _heightLockedUpdate(el, newHtml) {
	if (!el) return false;
	if (el.innerHTML === newHtml) return false;

	// Cancel any pending unlock from a previous update cycle
	if (el._heightUnlockRafId) {
		cancelAnimationFrame(el._heightUnlockRafId);
		el._heightUnlockRafId = null;
	}

	const savedPageScrollY = window.scrollY;
	const savedPageScrollX = window.scrollX;

	// Lock to exact current height — prevent BOTH shrink and grow
	const previousHeight = el.offsetHeight;
	if (previousHeight > 0) {
		el.style.minHeight = previousHeight + 'px';
		el.style.maxHeight = previousHeight + 'px';
		el.style.overflow = 'hidden';
	}

	const scrollable = el.querySelectorAll('[style*="overflow"]');
	const savedScrolls = [];
	scrollable.forEach((child, idx) => {
		if (child.scrollLeft > 0 || child.scrollTop > 0) {
			savedScrolls.push({ index: idx, scrollLeft: child.scrollLeft, scrollTop: child.scrollTop });
		}
	});

	el.innerHTML = newHtml;

	window.scrollTo(savedPageScrollX, savedPageScrollY);

	if (savedScrolls.length > 0) {
		requestAnimationFrame(() => {
			const newScrollable = el.querySelectorAll('[style*="overflow"]');
			savedScrolls.forEach(({ index, scrollLeft, scrollTop }) => {
				if (newScrollable[index]) {
					newScrollable[index].scrollLeft = scrollLeft;
					newScrollable[index].scrollTop = scrollTop;
				}
			});
		});
	}

	// NOTE: Height lock is NOT released here.
	// The caller MUST call _releaseHeightLocks([el]) after any
	// post-processing (render_temml, etc.) is complete.
	// This is the key fix: previously the lock was released via
	// double-rAF BEFORE temml rendered, causing the height jump.

	return true;
}

function _releaseHeightLocks(elements) {
	if (!elements || elements.length === 0) return;

	// Save scroll position before releasing locks
	const savedPageScrollY = window.scrollY;
	const savedPageScrollX = window.scrollX;

	elements.forEach(el => {
		if (!el) return;

		// Cancel any pending rAF-based unlock
		if (el._heightUnlockRafId) {
			cancelAnimationFrame(el._heightUnlockRafId);
			el._heightUnlockRafId = null;
		}

		// FIX: Snap to the NEW natural height synchronously BEFORE
		// removing the lock. This prevents the visible jump.
		// scrollHeight gives the true content height even when
		// maxHeight is constraining the element.
		const newNaturalHeight = el.scrollHeight;

		if (newNaturalHeight > 0) {
			// Snap to new height in the same JS frame (before paint)
			el.style.minHeight = newNaturalHeight + 'px';
			el.style.maxHeight = newNaturalHeight + 'px';
		}

		// Now release in a single rAF — the browser already painted
		// at newNaturalHeight, so removing constraints causes zero
		// visual change.
		el._heightUnlockRafId = requestAnimationFrame(() => {
			el._heightUnlockRafId = null;
			el.style.minHeight = '';
			el.style.maxHeight = '';
			el.style.overflow = '';
		});
	});

	// Restore scroll position
	window.scrollTo(savedPageScrollX, savedPageScrollY);
}

function _writeFFNContent(prefix, h1, normed_h1, W1, b1, out_L1, W2, b2, out_FFN, h2, gamma, beta, layerIndex, tokenStrings) {
    const naming = _ffnNaming(layerIndex);
    const ts = tokenStrings || null;

    const step1 = document.getElementById(`${prefix}-step-1`);
    const step2 = document.getElementById(`${prefix}-step-2`);
    const step3 = document.getElementById(`${prefix}-step-3`);
    if (!step1 || !step2 || !step3) return;

    const step1Html = _buildFFNStep1Html(naming, h1, normed_h1, W1, b1, out_L1, gamma, beta, ts);
    const step2Html = _buildFFNStep2Html(naming, out_L1, W2, b2, out_FFN, ts);
    const step3Html = _buildFFNStep3Html(naming, h1, out_FFN, h2, ts);

    _heightLockedUpdate(step1, step1Html);
    _heightLockedUpdate(step2, step2Html);
    _heightLockedUpdate(step3, step3Html);

    _renderTemmlOnElements([step1, step2, step3]);
    _releaseHeightLocks([step1, step2, step3]);
}

/**
 * Derives LaTeX naming conventions for a given layer index.
 */
function _ffnNaming(layerIndex) {
    const L = layerIndex + 1;
    const sup = `^{(${L})}`;
    const base = layerIndex * 2;
    const h1name = `h_{${base + 1}}`;
    const h2name = `h_{${base + 2}}`;
    const h1Stage = layerIndex === 0
        ? 'after attn residual'
        : `out layer ${layerIndex}`;
    return { L, sup, h1name, h2name, h1Stage };
}

/**
 * Builds the HTML for FFN Step 1: Pre-LN normalization + Expansion + ReLU.
 */
function _buildFFNStep1Html(naming, h1, normed_h1, W1, b1, out_L1, gamma, beta, ts) {
    const { sup, h1name, h1Stage } = naming;

    const preLNHtml = _buildFFNPreLNSection(sup, h1name, h1Stage, h1, normed_h1, gamma, beta, ts);
    const expansionHtml = _buildFFNExpansionSection(sup, h1name, normed_h1, W1, b1, out_L1, ts);

    return preLNHtml + expansionHtml;
}

/**
 * Builds the Pre-LayerNorm sub-section of Step 1.
 */
function _buildFFNPreLNSection(sup, h1name, h1Stage, h1, normed_h1, gamma, beta, ts) {
    return `
    <div style="margin-bottom:15px; padding:10px; border:1px solid #10b981; border-radius:8px; background:#ecfdf5;">
    <p style="font-size:0.85rem; color:#065f46;"><strong>Pre-LN:</strong> Normalize $${h1name}${sup}$ before FFN</p>
    $$ \\text{LayerNorm}(${h1name}${sup}) = \\underbrace{\\gamma_{\\text{ffn}}${sup}}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} \\underbrace{\\odot}_{\\substack{\\text{Hadamard} \\\\ \\text{Product}}} \\frac{${h1name}${sup} - \\underbrace{\\mu}_{\\text{Mean of } ${h1name}${sup}}}{\\sqrt{\\underbrace{\\sigma^2}_{\\text{Variance of } ${h1name}${sup}} + \\underbrace{${epsilon}}_\\epsilon}} + \\underbrace{\\beta_{\\text{ffn}}${sup}}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} $$
    <div style="overflow-x:auto;">
    $$ \\underbrace{${matrixToPmatrixLabeled(normed_h1, ts, 'after LN₂')}}_{\\text{Norm}\\left(${h1name}${sup}\\right)} = \\text{LayerNorm}\\!\\left(\\underbrace{${matrixToPmatrixLabeled(h1, ts, h1Stage)}}_{${h1name}${sup}},\\; \\underbrace{${vecToPmatrix(gamma)}}_{\\gamma${sup}},\\; \\underbrace{${vecToPmatrix(beta)}}_{\\beta${sup}}\\right) $$
    <br>
    </div>
    </div>`;
}

/**
 * Builds the Expansion + ReLU sub-section of Step 1.
 */
function _buildFFNExpansionSection(sup, h1name, normed_h1, W1, b1, out_L1, ts) {
    return `
    <p style="font-size:0.85rem; color:#1e40af;"><strong>FFN Layer 1: Expansion + ReLU</strong></p>

    $$ \\text{out}_{L1}${sup} = \\text{ReLU}\\!\\left(\\text{Norm}(${h1name}${sup}) \\cdot W_1${sup} + b_1${sup}\\right) $$

    <div style="overflow-x:auto; padding-bottom: 10px;">
    $$ \\underbrace{${matrixToPmatrixLabeled(out_L1, ts, 'after ReLU')}}_{\\text{out}_{L1}${sup}} = \\text{ReLU}\\!\\left( \\underbrace{${matrixToPmatrixLabeled(normed_h1, ts, 'after LN₂')}}_{\\text{Norm}(${h1name}${sup})} \\cdot \\underbrace{${matrixToPmatrix(W1)}}_{W_1${sup}} + \\underbrace{${vecToPmatrix(b1)}}_{b_1${sup}} \\right) $$
    </div>`;
}

/**
 * Builds the HTML for FFN Step 2: Compression.
 */
function _buildFFNStep2Html(naming, out_L1, W2, b2, out_FFN, ts) {
    const { sup } = naming;

    return `
    <p style="font-size:0.85rem; color:#1e40af;"><strong>FFN Layer 2: Compression</strong></p>

    $$ \\text{out}_{L2}${sup} = \\text{out}_{L1}${sup} \\cdot W_2${sup} + b_2${sup} $$

    <div style="overflow-x:auto; padding-bottom: 10px;">
    $$ \\underbrace{${matrixToPmatrixLabeled(out_FFN, ts, 'FFN output')}}_{\\text{Out}_\\text{FFN}${sup}} = \\underbrace{${matrixToPmatrixLabeled(out_L1, ts, 'after ReLU')}}_{\\text{out}_{L1}${sup}} \\cdot \\underbrace{${matrixToPmatrix(W2)}}_{W_2${sup}} + \\underbrace{${vecToPmatrix(b2)}}_{b_2${sup}} $$
    </div>`;
}

/**
 * Builds the HTML for FFN Step 3: Residual connection.
 */
function _buildFFNStep3Html(naming, h1, out_FFN, h2, ts) {
    const { sup, h1name, h2name, h1Stage } = naming;

    return `
    <div style="margin-bottom:10px;">
    <p style="font-size:0.85rem; color:#1e40af;"><strong>Residual connection</strong> (Pre-LN: no normalization on sublayer output):</p>
    $$ ${h2name}${sup} = ${h1name}${sup} + \\text{out}_{L2}${sup} $$
    </div>
    <div style="overflow-x:auto; overflow-y: hidden; padding-bottom: 10px;">
    $$ \\underbrace{${matrixToPmatrixLabeled(h2, ts, 'layer output')}}_{${h2name}${sup}} = \\underbrace{${matrixToPmatrixLabeled(h1, ts, h1Stage)}}_{${h1name}${sup}} + \\underbrace{${matrixToPmatrixLabeled(out_FFN, ts, 'FFN output')}}_{\\text{out}_{L2}${sup}} $$
    </div>`;
}

/**
 * Renders temml math on specific DOM elements only.
 * This prevents the "raw $$ → rendered math" height jump that causes
 * scroll anchoring issues when the global render_temml() runs later.
 */
function _renderTemmlOnElements(elements) {
	if (typeof renderMathInElement !== 'function') {
		// Fallback: if renderMathInElement isn't available, use global
		render_temml();
		return;
	}
	elements.forEach(el => {
		try {
			renderMathInElement(el, {
				delimiters: [
					{left: '$$', right: '$$', display: true},
					{left: '$', right: '$', display: false}
				],
				throwOnError: false
			});
		} catch(e) {
			// Silent fallback
		}
	});
}

function run_deep_layers(h_initial, tokens, total_depth, d_model, n_heads, this_weights, startLayer = 0, tokenStrings = null) {
	let h_current = h_initial;

	for (let n = startLayer; n < total_depth; n++) {
		const h_before_layer = JSON.parse(JSON.stringify(h_current));

		// tokenStrings is now threaded into forwardOneLayer
		const result = forwardOneLayer(h_current, this_weights[n], d_model, n_heads, tokenStrings, "unified-attention-engine", n);

		create_migration_plot(`migration-layer-${n + 1}`, tokens, h_before_layer, result.h_out, n + 1, d_model, result.h_out, tokenStrings);
		tlab_render_weight_grid(`migration-layer-${n + 1}`, n);

		h_current = result.h_out;
	}

	return h_current;
}

// ─── Sub-functions ───────────────────────────────────────────

/**
 * Interpolates a color from blue → red based on normalized magnitude.
 * @param {number} normMag - Value in [0, 1]
 * @returns {string} CSS rgb() color string
 */
function _vf2d_magnitude_color(normMag) {
    const r = Math.round(normMag * 239 + (1 - normMag) * 59);
    const g = Math.round(normMag * 68 + (1 - normMag) * 130);
    const b = Math.round(normMag * 68 + (1 - normMag) * 246);
    return `rgb(${r},${g},${b})`;
}

/**
 * Computes the unit direction and scaled arrow length for a single grid point.
 * @returns {{ ux, uy, arrowLen, lineWidth }}
 */
function _vf2d_arrow_geometry(p, maxMag, maxArrowLen) {
    const normMag = p.mag / maxMag;
    const arrowLen = Math.max(maxArrowLen * 0.08, maxArrowLen * normMag);
    const lineWidth = 1.5 + normMag * 3.5;

    let ux = 0, uy = 0;
    if (p.mag > 1e-10) {
        ux = p.dx / p.mag;
        uy = p.dy / p.mag;
    }

    return { ux, uy, arrowLen, lineWidth, normMag };
}

/**
 * Samples a 3D grid of points, runs a forward pass at each, and records displacement.
 * @returns {{ points: object[], maxMag: number }}
 */
function _vf3d_sample_grid(bounds, gridRes, layerWeights, d_model, n_heads) {
    const { xMin, xMax, yMin, yMax, zMin, zMax } = bounds;
    const points = [];
    let maxMag = 0;

    for (let i = 0; i <= gridRes; i++) {
        for (let j = 0; j <= gridRes; j++) {
            for (let k = 0; k <= gridRes; k++) {
                const x = xMin + (xMax - xMin) * (i / gridRes);
                const y = yMin + (yMax - yMin) * (j / gridRes);
                const z = zMin + (zMax - zMin) * (k / gridRes);

                const h_in = [[x, y, z]];
                const result = forwardOneLayer(h_in, layerWeights, d_model, n_heads, null, null, null);
                const h_out = result.h_out[0];

                const dx = h_out[0] - x;
                const dy = h_out[1] - y;
                const dz = h_out[2] - z;
                const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);

                points.push({ x, y, z, dx, dy, dz, mag });
                if (mag > maxMag) maxMag = mag;
            }
        }
    }

    if (maxMag < 1e-8) maxMag = 1e-8;
    return { points, maxMag };
}

/**
 * Interpolates a color from blue → purple → red based on normalized magnitude.
 * @param {number} normMag - Value in [0, 1]
 * @returns {string} CSS rgb() color string
 */
function _vf3d_magnitude_color(normMag) {
    let r, g, b;
    if (normMag < 0.5) {
        const t = normMag * 2;
        r = Math.round(59 + (168 - 59) * t);
        g = Math.round(130 + (85 - 130) * t);
        b = Math.round(246 + (247 - 246) * t);
    } else {
        const t = (normMag - 0.5) * 2;
        r = Math.round(168 + (239 - 168) * t);
        g = Math.round(85 + (68 - 85) * t);
        b = Math.round(247 + (68 - 247) * t);
    }
    return `rgb(${r},${g},${b})`;
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

function tlab_render_echarts(plotDiv, tokens, start_h, end_h, layerNum, d_model, isLastLayer, nextWordIndex) {
    let myChart = echarts.getInstanceByDom(plotDiv);
    if (!myChart) myChart = echarts.init(plotDiv);

    const axes = Array.from({ length: d_model }, (_, i) => ({
        dim: i, name: `Dim ${i}`
    }));

    const data = tokens.map((token, i) => {
        const sourceWord = tlab_get_top_word_only(start_h[i]);
        const destWord = tlab_get_top_word_only(end_h[i]);
        return {
            value: [...end_h[i], i + 1],
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
        visualMap: {
            type: 'continuous',
            min: 1,
            max: tokens.length,
            dimension: d_model,
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
    }, true);
}

// Ensure this exists at the top level of your script
if (!window.tlab_trajectory_data) {
	window.tlab_trajectory_data = { tokens: [], steps: [] };
}

/**
 * Creates and shows a loading overlay on top of the migration plot wrapper.
 * Returns the overlay element so it can be updated and removed later.
 */
function _vf_show_loading_overlay(wrapperEl, totalPoints) {
	if (!wrapperEl) return null;

	const overlay = document.createElement('div');
	overlay.className = 'vf-loading-overlay';
	overlay.style.cssText = `
	position: absolute; top: 0; left: 0; width: 100%; height: 100%;
	background: rgba(255, 255, 255, 0.92);
	display: flex; flex-direction: column; align-items: center; justify-content: center;
	z-index: 100; border-radius: 12px;
	font-family: 'Inter', sans-serif;
    `;

	overlay.innerHTML = `
	<div style="text-align: center;">
	    <div style="font-size: 1.1rem; font-weight: 600; color: #1e40af; margin-bottom: 12px;">
		🧭 Calculating Vector Field
	    </div>
	    <div style="width: 280px; height: 18px; background: #e2e8f0; border-radius: 9px; overflow: hidden; margin-bottom: 8px;">
		<div class="vf-loading-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 9px; transition: width 0.1s ease;"></div>
	    </div>
	    <div class="vf-loading-text" style="font-size: 0.85rem; color: #64748b;">
		0 of ${totalPoints} done (0%)
	    </div>
	</div>
    `;

	// Ensure wrapper has relative positioning for the absolute overlay
	const originalPosition = wrapperEl.style.position;
	if (!originalPosition || originalPosition === 'static') {
		wrapperEl.style.position = 'relative';
	}
	wrapperEl._vfOriginalPosition = originalPosition;

	wrapperEl.appendChild(overlay);
	return overlay;
}

/**
 * Updates the loading overlay with current progress.
 */
function _vf_update_loading_overlay(overlay, computed, total) {
    if (!overlay) return;

    const pct = Math.min(100, (computed / total) * 100);
    const fill = overlay.querySelector('.vf-loading-fill');
    const text = overlay.querySelector('.vf-loading-text');

    if (fill) fill.style.width = pct.toFixed(1) + '%';
    if (text) text.textContent = `${computed} of ${total} done (${pct.toFixed(0)}%)`;
}

/**
 * Removes the loading overlay and restores the wrapper's original positioning.
 */
function _vf_remove_loading_overlay(overlay) {
	if (!overlay) return;

	const wrapper = overlay.parentElement;
	if (wrapper && wrapper._vfOriginalPosition !== undefined) {
		wrapper.style.position = wrapper._vfOriginalPosition || '';
		delete wrapper._vfOriginalPosition;
	}

	overlay.remove();
}

function create_migration_plot(id, tokens, start_h, end_h, layerNum, d_model, h_after, tokenStrings) {
	const globalContainer = document.getElementById('transformer-migration-plots-container');
	if (!globalContainer) return;

	if (window._activeMigrationIds) {
		window._activeMigrationIds.add(id);
	}

	const displayTokens = getMigrationDisplayTokens(tokens, tokenStrings);

	// Initialize/update trajectory collector
	initTrajectoryCollector(tokens, displayTokens, d_model, start_h);
	recordTrajectoryLayerOutput(layerNum, end_h);

	// Determine parent container
	const parentContainer = getMigrationParentContainer(layerNum, globalContainer);

	// Preserve existing VF toggle state
	const existingRegData = transformerLabVisMigrationDataRegistry.get(id);
	const existingVfEnabled = existingRegData ? !!existingRegData._vfEnabled : false;

	// Ensure DOM elements exist
	ensureMigrationPlotDiv(id, d_model, existingVfEnabled, parentContainer);

	// Build registry data and register for lazy rendering
	const registryData = buildMigrationRegistryData(tokens, start_h, end_h, layerNum, d_model, h_after, tokenStrings, existingVfEnabled);

	registerLazyRenderable(
		id,
		transformerLabVisMigrationDataRegistry,
		migrationObserver,
		registryData,
		() => render_migration_logic(id, tokens, start_h, end_h, layerNum, d_model, h_after, tokenStrings)
	);
}

function getMigrationDisplayTokens(tokens, tokenStrings) {
	if (tokenStrings && tokenStrings.length === tokens.length) {
		return tokenStrings;
	}
	return tokens.map((t, i) => {
		if (typeof t === 'string') return t;
		return tlab_get_top_word_only(t);
	});
}

function initTrajectoryCollector(tokens, displayTokens, d_model, start_h) {
	if (!window.tlab_trajectory_collector) {
		window.tlab_trajectory_collector = {
			steps: {},
			tokens: [...tokens],
			displayTokens: [...displayTokens],
			d_model: d_model
		};
	}

	if (!window.tlab_trajectory_collector.steps["00_raw"]) {
		const rawEmbs = displayTokens.map(t => {
			if (window.persistentEmbeddingSpace && window.persistentEmbeddingSpace[t]) {
				return window.persistentEmbeddingSpace[t];
			}
			return new Array(d_model).fill(0);
		});

		const freeze = (data) => JSON.parse(JSON.stringify(data));

		window.tlab_trajectory_collector.steps["00_raw"] = {
			name: "Original Embedding",
			data: freeze(rawEmbs)
		};
		window.tlab_trajectory_collector.steps["01_pe"] = {
			name: "Embedding + Position",
			data: freeze(start_h)
		};
	}
}

function recordTrajectoryLayerOutput(layerNum, end_h) {
	const freeze = (data) => JSON.parse(JSON.stringify(data));
	const layerKey = "02_layer_" + String(layerNum).padStart(2, '0');
	window.tlab_trajectory_collector.steps[layerKey] = {
		name: `Layer ${layerNum} Output`,
		data: freeze(end_h)
	};
}

function getMigrationParentContainer(layerNum, globalContainer) {
	const layerIndex = layerNum - 1;
	const unifiedMigrationContainer = document.getElementById(`unified-layer-${layerIndex}-migration-container`);
	return unifiedMigrationContainer || globalContainer;
}

function createVFToggleButton(id, d_model, existingVfEnabled) {
	const toggleBtn = document.createElement('button');
	toggleBtn.className = 'migration-vf-toggle';
	toggleBtn.dataset.mode = existingVfEnabled ? 'on' : 'off';
	toggleBtn.dataset.migrationId = id;
	toggleBtn.textContent = existingVfEnabled ? '🧭 Hide Vector Field' : '🧭 Show Vector Field';
	toggleBtn.style.cssText = `
	margin: 8px 12px; padding: 6px 16px; border-radius: 6px;
	border: 1px solid #3b82f6; background: ${existingVfEnabled ? '#dbeafe' : '#fff'}; color: #3b82f6;
	cursor: pointer; font-weight: 600; font-size: 0.82rem;
	transition: all 0.15s;
    `;
	if (d_model >= 4) {
		toggleBtn.style.display = 'none';
	}

	toggleBtn.addEventListener('mouseover', () => {
		toggleBtn.style.background = toggleBtn.dataset.mode === 'off' ? '#eff6ff' : '#fee2e2';
	});
	toggleBtn.addEventListener('mouseout', () => {
		toggleBtn.style.background = toggleBtn.dataset.mode === 'off' ? '#fff' : '#dbeafe';
	});
	toggleBtn.addEventListener('click', () => {
		const currentMode = toggleBtn.dataset.mode;
		const migId = toggleBtn.dataset.migrationId;
		const regData = transformerLabVisMigrationDataRegistry.get(migId);
		if (!regData) return;

		if (currentMode === 'off') {
			toggleBtn.dataset.mode = 'on';
			toggleBtn.textContent = '🧭 Hide Vector Field';
			toggleBtn.style.background = '#dbeafe';
			regData._vfEnabled = true;
			render_migration_logic(migId, regData.tokens, regData.start_h, regData.end_h, regData.layerNum, regData.d_model, regData.h_after, regData.tokenStrings);
		} else {
			toggleBtn.dataset.mode = 'off';
			toggleBtn.textContent = '🧭 Show Vector Field';
			toggleBtn.style.background = '#fff';
			regData._vfEnabled = false;
			render_migration_logic(migId, regData.tokens, regData.start_h, regData.end_h, regData.layerNum, regData.d_model, regData.h_after, regData.tokenStrings);
		}
	});

	return toggleBtn;
}

function getMigrationPlotHeight(d_model) {
	// d_model <= 3: Plotly 2D/3D scatter — 500px is appropriate
	// d_model >= 4: ECharts parallel coordinates — 500px is also fine
	return 500;
}

function createMigrationPlotDOM(id, d_model, existingVfEnabled, parentContainer) {
	const wrapperDiv = document.createElement('div');
	wrapperDiv.style.cssText = "border: 2px solid #cbd5e1; border-radius: 12px; margin-top: 10px; background: #fff;";
	wrapperDiv.setAttribute('data-migration-wrapper', id);
	wrapperDiv.setAttribute('data-d-model', d_model); // track d_model

	const toggleBtn = createVFToggleButton(id, d_model, existingVfEnabled);
	wrapperDiv.appendChild(toggleBtn);

	const plotDiv = document.createElement('div');
	plotDiv.id = id;
	const migrationHeight = getMigrationPlotHeight(d_model);
	plotDiv.style.cssText = `height: ${migrationHeight}px; width: 100%; position: relative;`;

	wrapperDiv.appendChild(plotDiv);
	parentContainer.appendChild(wrapperDiv);

	return plotDiv;
}

function ensureMigrationPlotDiv(id, d_model, existingVfEnabled, parentContainer) {
	let plotDiv = document.getElementById(id);
	if (!plotDiv) {
		plotDiv = createMigrationPlotDOM(id, d_model, existingVfEnabled, parentContainer);
	} else {
		// If d_model changed, update the height
		const wrapper = plotDiv.closest('[data-migration-wrapper]');
		if (wrapper) {
			const prevDModel = parseInt(wrapper.getAttribute('data-d-model') || '0');
			if (prevDModel !== d_model) {
				wrapper.setAttribute('data-d-model', d_model);
				const migrationHeight = getMigrationPlotHeight(d_model);
				plotDiv.style.height = migrationHeight + 'px';
			}
			if (wrapper.parentNode !== parentContainer) {
				parentContainer.appendChild(wrapper);
			}
		}
	}
	return plotDiv;
}

function getTrajectoryPlotHeight(d_model) {
	if (d_model <= 3) {
		return 850;
	}

	const nPairs = (d_model * (d_model - 1)) / 2;

	// Measure the actual container width to match the CSS grid layout:
	// grid-template-columns: repeat(auto-fill, minmax(400px, 1fr))
	const migrationContainer = document.getElementById('transformer-migration-plots-container');
	const containerWidth = migrationContainer
		? migrationContainer.getBoundingClientRect().width
		: 800; // fallback

	// Subtract padding (the grid has padding:10px on each side)
	const availableWidth = Math.max(400, containerWidth - 20);

	// auto-fill with minmax(400px, 1fr): how many 400px columns fit?
	const cols = Math.max(1, Math.floor(availableWidth / 400));
	const rows = Math.ceil(nPairs / cols);

	// Each slice div is 400px tall + 15px gap between rows
	// Plus the heading (~60px) and container padding
	return 60 + rows * 400 + Math.max(0, rows - 1) * 15 + 20;
}

window.addEventListener('resize', debounce(() => {
	const trajDiv = document.getElementById('transformer-trajectory-full-path');
	if (!trajDiv) return;

	const d_model = parseInt(trajDiv.getAttribute('data-d-model') || '0');
	if (d_model < 4) return; // only high-dim uses the grid

	const newHeight = getTrajectoryPlotHeight(d_model);
	trajDiv.style.height = newHeight + 'px';
	trajDiv.style.minHeight = newHeight + 'px';
}, 300));

function buildMigrationRegistryData(tokens, start_h, end_h, layerNum, d_model, h_after, tokenStrings, existingVfEnabled) {
	return {
		tokens: [...tokens],
		start_h: Array.isArray(start_h) ? start_h.slice() : start_h,
		end_h: Array.isArray(end_h) ? end_h.slice() : end_h,
		layerNum,
		d_model,
		h_after,
		tokenStrings: tokenStrings || null,
		_vfEnabled: existingVfEnabled,
	};
}

function render_migration_logic(id, tokens, start_h, end_h, layerNum, d_model, h_after, tokenStrings) {
    const plotDiv = document.getElementById(id);
    if (!plotDiv) return;

    plotDiv.style.width = '100%';

    const regData = transformerLabVisMigrationDataRegistry.get(id);
    const vfEnabled = regData && regData._vfEnabled && d_model < 4;

    if (d_model <= 3) {
        renderMigrationLowDim(id, plotDiv, tokens, start_h, end_h, layerNum, d_model, vfEnabled);
    } else {
        renderMigrationHighDim(id, plotDiv, tokens, start_h, end_h, layerNum, d_model);
    }

    syncVFToggleButtonState(id, plotDiv, vfEnabled);
    tlab_render_latex_matrix(id, plotDiv, tokens, start_h, end_h, h_after, d_model, tokenStrings);
    tlab_render_weight_grid(id, layerNum - 1);
}

function _mig_ec2d_vocab_series() {
    const data = [];
    Object.entries(window.persistentEmbeddingSpace).forEach(([word, vec]) => {
        data.push({ value: [vec[0], vec[1] || 0], name: word });
    });
    return {
        type: 'scatter', name: 'Vocab', data: data,
        symbol: 'diamond', symbolSize: 10,
        itemStyle: { color: 'rgba(71,85,105,0.9)', borderWidth: 1, borderColor: '#000' },
        label: { show: true, position: 'top', formatter: p => p.name, fontSize: 10, color: '#1e293b' },
        tooltip: { formatter: p => `<b>${p.name}</b>` },
        z: 5
    };
}

function _ec2d_render_arrow(startPx, endPx, color, lineW) {
    const dx = endPx[0] - startPx[0];
    const dy = endPx[1] - startPx[1];
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len < 1) {
        return { type: 'circle', shape: { cx: startPx[0], cy: startPx[1], r: 3 }, style: { fill: color } };
    }

    const ux = dx / len, uy = dy / len;
    const headLen = Math.min(12, len * 0.3);
    const headW = Math.max(3, lineW * 2.5);
    const px = -uy, py = ux;
    const bx = endPx[0] - ux * headLen;
    const by = endPx[1] - uy * headLen;

    return {
        type: 'group',
        children: [
            { type: 'line', shape: { x1: startPx[0], y1: startPx[1], x2: bx, y2: by }, style: { stroke: color, lineWidth: lineW } },
            { type: 'polygon', shape: { points: [[endPx[0], endPx[1]], [bx + px * headW, by + py * headW], [bx - px * headW, by - py * headW]] }, style: { fill: color } },
            { type: 'circle', shape: { cx: startPx[0], cy: startPx[1], r: Math.max(2, lineW) }, style: { fill: color, stroke: '#fff', lineWidth: 1 } }
        ]
    };
}

function _mig_ec2d_arrow_series(tokens, start_h, end_h, d_model, nTokens) {
    const data = tokens.map((token, i) => ({
        value: [
            start_h[i][0], d_model >= 2 ? start_h[i][1] : 0,
            end_h[i][0], d_model >= 2 ? end_h[i][1] : 0,
            i
        ],
        _src: tlab_get_top_word_only(start_h[i]),
        _dst: tlab_get_top_word_only(end_h[i]),
        _pos: i + 1
    }));

    return {
        type: 'custom',
        name: 'Migration',
        renderItem: function (params, api) {
            const sPx = api.coord([api.value(0), api.value(1)]);
            const ePx = api.coord([api.value(2), api.value(3)]);
            const color = getPositionColor(api.value(4), nTokens);
            return _ec2d_render_arrow(sPx, ePx, color, 2);
        },
        encode: { x: [0, 2], y: [1, 3] },
        data: data,
        tooltip: { formatter: p => `From '${p.data._src}' to '${p.data._dst}', position ${p.data._pos}` },
        z: 10
    };
}

function _vf_ec3d_series(computed) {
    const { points, maxMag, maxArrowLen } = computed;
    const series = [];
    const tipData = [];

    points.forEach(pt => {
        const normMag = pt.mag / maxMag;
        const color = _vf3d_magnitude_color(normMag);
        const arrowLen = Math.max(maxArrowLen * 0.06, maxArrowLen * normMag);

        let ux = 0, uy = 0, uz = 0;
        if (pt.mag > 1e-10) { ux = pt.dx / pt.mag; uy = pt.dy / pt.mag; uz = pt.dz / pt.mag; }

        const endX = pt.x + ux * arrowLen;
        const endY = pt.y + uy * arrowLen;
        const endZ = pt.z + uz * arrowLen;

        series.push({
            name: 'VF', type: 'line3D',
            data: [[pt.x, pt.y, pt.z], [endX, endY, endZ]],
            lineStyle: { width: 1 + normMag * 4, color: color, opacity: 0.2 },
            silent: true
        });

        tipData.push({
            value: [endX, endY, endZ],
            itemStyle: { color: color, opacity: 0.3 },
            symbolSize: Math.max(3, 3 + normMag * 8),
            _hover: `(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}, ${pt.z.toFixed(2)})<br>|Δh|: ${pt.mag.toFixed(4)}`
        });
    });

    series.push({
        name: 'VF Tips', type: 'scatter3D',
        data: tipData, symbol: 'triangle',
        tooltip: { formatter: p => p.data._hover }
    });

    return series;
}

function _vf_ec2d_custom_series(computed) {
    const { points, maxMag, maxArrowLen } = computed;

    const data = points.map(p => {
        const { ux, uy, arrowLen, normMag } = _vf2d_arrow_geometry(p, maxMag, maxArrowLen);
        return {
            value: [p.x, p.y, p.x + ux * arrowLen, p.y + uy * arrowLen, normMag],
            _mag: p.mag, _dx: p.dx, _dy: p.dy
        };
    });

    return {
        type: 'custom', name: 'Vector Field',
        renderItem: function (params, api) {
            const sPx = api.coord([api.value(0), api.value(1)]);
            const ePx = api.coord([api.value(2), api.value(3)]);
            const normMag = api.value(4);
            const color = _vf2d_magnitude_color(normMag);
            const lineW = 1 + normMag * 3;

            const dx = ePx[0] - sPx[0], dy = ePx[1] - sPx[1];
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len < 0.5) return { type: 'circle', shape: { cx: sPx[0], cy: sPx[1], r: 1 }, style: { fill: color, opacity: 0.2 } };

            const ux2 = dx / len, uy2 = dy / len;
            const headLen = Math.min(8, len * 0.35);
            const headW = Math.max(2, lineW * 1.5);
            const px = -uy2, py = ux2;
            const bx = ePx[0] - ux2 * headLen, by = ePx[1] - uy2 * headLen;

            return {
                type: 'group', children: [
                    { type: 'line', shape: { x1: sPx[0], y1: sPx[1], x2: bx, y2: by }, style: { stroke: color, lineWidth: lineW, opacity: 0.25 } },
                    { type: 'polygon', shape: { points: [[ePx[0], ePx[1]], [bx + px * headW, by + py * headW], [bx - px * headW, by - py * headW]] }, style: { fill: color, opacity: 0.25 } }
                ]
            };
        },
        encode: { x: [0, 2], y: [1, 3] },
        data: data,
        tooltip: {
            formatter: p => `Point: (${p.data.value[0].toFixed(2)}, ${p.data.value[1].toFixed(2)})<br>Δ: (${p.data._dx.toFixed(3)}, ${p.data._dy.toFixed(3)})<br>|Δh|: ${p.data._mag.toFixed(4)}`
        },
        z: 1
    };
}

function _migration_render_2d_echarts(chart, migId, tokens, start_h, end_h, layerNum, d_model, vfEnabled) {
    const series = [];
    const nTokens = tokens.length;

    series.push(_mig_ec2d_vocab_series());
    series.push(_mig_ec2d_arrow_series(tokens, start_h, end_h, d_model, nTokens));

    if (vfEnabled) {
        const { n_heads } = getTransformerConfig();
        const computed = _compute_vector_field_points_2d(migId, layerNum, d_model, n_heads);
        if (computed) {
            series.push(_vf_ec2d_custom_series(computed));
        }
    }

    chart.setOption({
        title: { text: `Layer ${layerNum}: Feature Migration`, left: 'center', textStyle: { fontSize: 14, color: '#1e293b' } },
        tooltip: { show: true, trigger: 'item', confine: true },
        xAxis: { type: 'value', name: 'Dim 0', nameLocation: 'center', nameGap: 25, splitLine: { lineStyle: { color: '#f0f0f0' } } },
        yAxis: { type: 'value', name: 'Dim 1', nameLocation: 'center', nameGap: 35, splitLine: { lineStyle: { color: '#f0f0f0' } } },
        grid: { top: 60, bottom: 50, left: 55, right: 80 },
        graphic: _mig_ec_position_legend(nTokens),
        series: series,
        animation: false
    }, true);
}

function _mig_ec_position_legend(nTokens) {
    if (nTokens < 2) return [];

    const stops = [];
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const idx = Math.round(t * (nTokens - 1));
        const { r, g, b } = getPositionColor(idx, nTokens, 'object');
        stops.push({ offset: t, color: `rgb(${r},${g},${b})` });
    }

    return [{
        type: 'group', right: 15, top: '15%',
        children: [
            { type: 'text', style: { text: 'Position', fill: '#64748b', fontSize: 10, textAlign: 'center' }, left: -2, top: -18 },
            { type: 'text', style: { text: String(nTokens), fill: '#64748b', fontSize: 9, textAlign: 'center' }, left: 2, top: -4 },
            { type: 'rect', shape: { width: 14, height: 140 }, top: 8, style: { fill: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: stops } } },
            { type: 'text', style: { text: '1', fill: '#64748b', fontSize: 9, textAlign: 'center' }, left: 3, top: 152 }
        ]
    }];
}

function _mig_ec3d_vocab_series() {
    const data = [];
    Object.entries(window.persistentEmbeddingSpace).forEach(([word, vec]) => {
        data.push({ name: word, value: [vec[0], vec[1] || 0, vec[2] || 0] });
    });
    return {
        name: 'Vocab Embeddings', type: 'scatter3D', data: data,
        symbol: 'diamond', symbolSize: 8,
        itemStyle: { color: 'rgba(100,116,139,0.8)', borderWidth: 1, borderColor: '#334155' },
        label: { show: true, position: 'top', distance: 5, formatter: p => p.name, textStyle: { fontSize: 10, color: '#475569' } }
    };
}

function _migration_render_3d_echarts(chart, migId, tokens, start_h, end_h, layerNum, d_model, vfEnabled) {
    const series = [];
    const legendData = ['Vocab Embeddings'];
    const nTokens = tokens.length;

    series.push(_mig_ec3d_vocab_series());

    tokens.forEach((token, i) => {
        const color = getPositionColor(i, nTokens);
        const src = tlab_get_top_word_only(start_h[i]);
        const dst = tlab_get_top_word_only(end_h[i]);
        const label = `${src}→${dst} (${i + 1})`;
        legendData.push(label);

        series.push({
            name: label, type: 'line3D',
            data: [start_h[i].slice(0, 3), end_h[i].slice(0, 3)],
            lineStyle: { width: 4, color: color, opacity: 0.85 }
        });

        series.push({
            name: label, type: 'scatter3D',
            data: [
                { value: start_h[i].slice(0, 3), symbolSize: 8, itemStyle: { color: color, borderWidth: 2, borderColor: '#000' }, _hover: `Start: '${src}' pos ${i + 1}` },
                { value: end_h[i].slice(0, 3), symbolSize: 14, itemStyle: { color: color, borderWidth: 2, borderColor: '#fff' }, _hover: `End: '${dst}' pos ${i + 1}` }
            ],
            symbol: 'circle',
            tooltip: { formatter: p => p.data._hover }
        });
    });

    if (vfEnabled) {
        const { n_heads } = getTransformerConfig();
        const computed = _compute_vector_field_points_3d(migId, layerNum, d_model, n_heads);
        if (computed) series.push(..._vf_ec3d_series(computed));
    }

    chart.setOption({
        title: { text: `Layer ${layerNum}: Feature Migration`, left: 'center', textStyle: { fontSize: 14, color: '#1e293b' } },
        tooltip: { show: true, trigger: 'item', confine: true },
        legend: { data: legendData, orient: 'horizontal', bottom: 5, left: 'center', textStyle: { fontSize: 11 } },
        xAxis3D: { type: 'value', name: 'Dim 0' },
        yAxis3D: { type: 'value', name: 'Dim 1' },
        zAxis3D: { type: 'value', name: 'Dim 2' },
        grid3D: {
            viewControl: { projection: 'perspective', alpha: 30, beta: 40, distance: 200, autoRotate: false, damping: 0.9 },
            light: { main: { intensity: 1.2, shadow: false }, ambient: { intensity: 0.3 } },
            environment: '#f9fafb', boxWidth: 100, boxHeight: 100, boxDepth: 100
        },
        series: series,
        animation: false
    }, true);
}

function renderMigrationLowDim(id, plotDiv, tokens, start_h, end_h, layerNum, d_model, vfEnabled) {
    // Purge any old Plotly chart on this div
    Plotly.purge(plotDiv);

    let chart = echarts.getInstanceByDom(plotDiv);
    if (!chart) chart = echarts.init(plotDiv);

    if (d_model === 3) {
        _migration_render_3d_echarts(chart, id, tokens, start_h, end_h, layerNum, d_model, vfEnabled);
    } else {
        _migration_render_2d_echarts(chart, id, tokens, start_h, end_h, layerNum, d_model, vfEnabled);
    }

    if (!plotDiv._ecMigResize) {
        plotDiv._ecMigResize = () => {
            const c = echarts.getInstanceByDom(plotDiv);
            if (c) c.resize();
        };
        window.addEventListener('resize', plotDiv._ecMigResize);
    }
}

function renderMigrationHighDim(id, plotDiv, tokens, start_h, end_h, layerNum, d_model) {
    Plotly.purge(plotDiv);
    const migrationContainers = document.querySelectorAll('[id^="migration-layer-"]');
    const totalLayersCount = migrationContainers.length;
    const isLastInDom = totalLayersCount > 0 && migrationContainers[totalLayersCount - 1].id === id;
    const nextWordIndex = tokens.length - 1;
    tlab_render_echarts(plotDiv, tokens, start_h, end_h, layerNum, d_model, isLastInDom, nextWordIndex);
}

/**
 * Builds base Plotly traces for all tokens in a migration plot.
 */
function buildAllMigrationTokenTraces(tokens, start_h, end_h, d_model, is3D) {
    const traces = [];
    tokens.forEach((token, i) => {
        traces.push(...buildMigrationTokenTrace(token, i, start_h, end_h, d_model, is3D, tokens));
    });
    return traces;
}

/**
 * Dispatches vector field computation and trace building for 2D or 3D.
 * Returns an array of Plotly traces (empty if nothing could be computed).
 */
function computeVectorFieldTraces(id, layerNum, d_model) {
    const { n_heads } = getTransformerConfig();

    if (d_model === 2) {
        const computed = _compute_vector_field_points_2d(id, layerNum, d_model, n_heads);
        if (computed) {
            return _build_vector_field_traces_2d(
                computed.points, computed.maxMag, computed.maxArrowLen,
                computed.seqLen, computed.substitutePos
            );
        }
    } else if (d_model === 3) {
        const computed = _compute_vector_field_points_3d(id, layerNum, d_model, n_heads);
        if (computed) {
            return _build_vector_field_traces_3d(
                computed.points, computed.maxMag, computed.maxArrowLen,
                computed.seqLen, computed.substitutePos
            );
        }
    }

    return [];
}

/**
 * Synchronizes the vector field toggle button's DOM state
 * to match the authoritative registry value.
 */
function syncVFToggleButtonState(id, plotDiv, vfEnabled) {
    const wrapper = plotDiv.closest('[data-migration-wrapper]');
    const toggleBtn = wrapper ? wrapper.querySelector('.migration-vf-toggle') : null;
    if (!toggleBtn) return;

    if (vfEnabled) {
        toggleBtn.dataset.mode = 'on';
        toggleBtn.textContent = '🧭 Hide Vector Field';
        toggleBtn.style.background = '#dbeafe';
    } else {
        toggleBtn.dataset.mode = 'off';
        toggleBtn.textContent = '🧭 Show Vector Field';
        toggleBtn.style.background = '#fff';
    }
}

function _compute_vector_field_points_2d(migrationId, layerNum, d_model, n_heads) {
	const regData = transformerLabVisMigrationDataRegistry.get(migrationId);
	if (!regData) return null;

	const realContext = regData.start_h;
	const seqLen = realContext.length;
	const substitutePos = seqLen - 1;

	const allVecs = Object.values(window.persistentEmbeddingSpace);
	let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
	allVecs.forEach(v => {
		if (v[0] < xMin) xMin = v[0];
		if (v[0] > xMax) xMax = v[0];
		if (v.length > 1 && v[1] < yMin) yMin = v[1];
		if (v.length > 1 && v[1] > yMax) yMax = v[1];
	});
	realContext.forEach(v => {
		if (v[0] < xMin) xMin = v[0];
		if (v[0] > xMax) xMax = v[0];
		if (v.length > 1 && v[1] < yMin) yMin = v[1];
		if (v.length > 1 && v[1] > yMax) yMax = v[1];
	});
	if (xMin === xMax) { xMin -= 1; xMax += 1; }
	if (yMin === yMax) { yMin -= 1; yMax += 1; }
	const pad = 2;
	xMin -= pad; xMax += pad; yMin -= pad; yMax += pad;

	const gridRes = 12;
	const layerWeights = window.currentWeights[layerNum - 1];
	const totalPoints = (gridRes + 1) * (gridRes + 1);

	const points = [];
	let maxMag = 0;

	for (let i = 0; i <= gridRes; i++) {
		for (let j = 0; j <= gridRes; j++) {
			const x = xMin + (xMax - xMin) * (i / gridRes);
			const y = yMin + (yMax - yMin) * (j / gridRes);

			const modifiedContext = realContext.map((row, idx) => {
				if (idx === substitutePos) {
					return [x, y];
				}
				return [...row];
			});

			const result = forwardOneLayer(modifiedContext, layerWeights, d_model, n_heads, null, null, null);
			const h_out = result.h_out[substitutePos];

			const dx = h_out[0] - x;
			const dy = h_out[1] - y;
			const mag = Math.sqrt(dx * dx + dy * dy);

			points.push({ x, y, dx, dy, mag });
			if (mag > maxMag) maxMag = mag;
		}
	}

	if (maxMag < 1e-8) maxMag = 1e-8;

	const cellW = (xMax - xMin) / gridRes;
	const cellH = (yMax - yMin) / gridRes;
	const maxArrowLen = Math.min(cellW, cellH) * 1.2;

	return { points, maxMag, maxArrowLen, seqLen, substitutePos };
}

function _build_vector_field_traces_2d(points, maxMag, maxArrowLen, seqLen, substitutePos) {
	const newTraces = [];

	for (let k = 0; k < points.length; k++) {
		const p = points[k];
		const normMag = p.mag / maxMag;

		const r = Math.round(normMag * 239 + (1 - normMag) * 59);
		const g = Math.round(normMag * 68 + (1 - normMag) * 130);
		const b = Math.round(normMag * 68 + (1 - normMag) * 246);
		const color = `rgb(${r},${g},${b})`;

		const arrowLen = Math.max(maxArrowLen * 0.08, maxArrowLen * normMag);

		let ux = 0, uy = 0;
		if (p.mag > 1e-10) {
			ux = p.dx / p.mag;
			uy = p.dy / p.mag;
		}

		const endX = p.x + ux * arrowLen;
		const endY = p.y + uy * arrowLen;

		const lineWidth = 1.5 + normMag * 3.5;

		newTraces.push({
			type: 'scatter',
			x: [p.x, endX],
			y: [p.y, endY],
			mode: 'lines',
			line: { width: lineWidth, color: color },
			opacity: 0.2,
			showlegend: false,
			hoverinfo: 'skip',
			_isVectorField: true
		});

		const headSize = Math.max(5, 6 + normMag * 10);
		newTraces.push({
			type: 'scatter',
			x: [p.x, endX],
			y: [p.y, endY],
			mode: 'markers',
			marker: {
				size: [0, headSize],
				symbol: 'arrow',
				angleref: 'previous',
				color: color
			},
			opacity: 0.2,
			showlegend: false,
			hovertemplate:
				`Point: (${p.x.toFixed(2)}, ${p.y.toFixed(2)})<br>` +
				`Δ: (${p.dx.toFixed(3)}, ${p.dy.toFixed(3)})<br>` +
				`Magnitude: ${p.mag.toFixed(4)}<br>` +
				`Context: ${seqLen} tokens, substituted at pos ${substitutePos}<extra></extra>`,
			_isVectorField: true
		});
	}

	newTraces.push({
		type: 'scatter',
		x: [null], y: [null],
		mode: 'markers',
		marker: {
			colorscale: [[0, 'rgb(59,130,246)'], [1, 'rgb(239,68,68)']],
			cmin: 0, cmax: maxMag,
			color: [0, maxMag],
			showscale: true,
			colorbar: { title: '|Δh|', thickness: 15, len: 0.5, x: 1.08, y: 0.5 }
		},
		showlegend: false,
		hoverinfo: 'none',
		_isVectorField: true
	});

	return newTraces;
}

function _add_vector_field_overlay_2d_sync(migrationId, layerNum, d_model, n_heads) {
	const computed = _compute_vector_field_points_2d(migrationId, layerNum, d_model, n_heads);
	if (!computed) return;

	const newTraces = _build_vector_field_traces_2d(
		computed.points, computed.maxMag, computed.maxArrowLen,
		computed.seqLen, computed.substitutePos
	);

	Plotly.addTraces(migrationId, newTraces);
}

async function add_vector_field_overlay_2d(migrationId, layerNum, d_model, n_heads) {
	const regData = transformerLabVisMigrationDataRegistry.get(migrationId);
	if (!regData) return;

	const realContext = regData.start_h;
	const seqLen = realContext.length;
	const substitutePos = seqLen - 1;

	const bounds = _vf2d_overlay_compute_bounds(realContext);
	const gridRes = 12;
	const layerWeights = window.currentWeights[layerNum - 1];
	const totalPoints = (gridRes + 1) * (gridRes + 1);

	const wrapper = document.getElementById(migrationId)?.closest('[data-migration-wrapper]');
	const loadingOverlay = _vf_show_loading_overlay(wrapper, totalPoints);

	const { points, maxMag } = await _vf2d_overlay_sample_grid_async(
		bounds, gridRes, layerWeights, d_model, n_heads,
		realContext, substitutePos, loadingOverlay, totalPoints
	);

	const maxArrowLen = _vf2d_overlay_max_arrow_length(bounds, gridRes);
	const newTraces = _build_vector_field_traces_2d(points, maxMag, maxArrowLen, seqLen, substitutePos);

	_vf_remove_loading_overlay(loadingOverlay);
	Plotly.addTraces(migrationId, newTraces);
}

/**
 * Computes the 2D bounding box from both embedding space and the real context vectors.
 * Includes padding.
 * @returns {{ xMin, xMax, yMin, yMax }}
 */
function _vf2d_overlay_compute_bounds(realContext) {
	const allVecs = Object.values(window.persistentEmbeddingSpace);
	let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;

	const updateBounds = (v) => {
		if (v[0] < xMin) xMin = v[0];
		if (v[0] > xMax) xMax = v[0];
		if (v.length > 1 && v[1] < yMin) yMin = v[1];
		if (v.length > 1 && v[1] > yMax) yMax = v[1];
	};

	allVecs.forEach(updateBounds);
	realContext.forEach(updateBounds);

	if (xMin === xMax) { xMin -= 1; xMax += 1; }
	if (yMin === yMax) { yMin -= 1; yMax += 1; }

	const pad = 2;
	return {
		xMin: xMin - pad, xMax: xMax + pad,
		yMin: yMin - pad, yMax: yMax + pad
	};
}

/**
 * Asynchronously samples a 2D grid, running a forward pass at each point.
 * Yields to the browser every 10 points and updates the loading overlay.
 * @returns {Promise<{ points: object[], maxMag: number }>}
 */
async function _vf2d_overlay_sample_grid_async(bounds, gridRes, layerWeights, d_model, n_heads, realContext, substitutePos, loadingOverlay, totalPoints) {
	const { xMin, xMax, yMin, yMax } = bounds;
	const points = [];
	let maxMag = 0;
	let computed = 0;

	for (let i = 0; i <= gridRes; i++) {
		for (let j = 0; j <= gridRes; j++) {
			const x = xMin + (xMax - xMin) * (i / gridRes);
			const y = yMin + (yMax - yMin) * (j / gridRes);

			const modifiedContext = _vf_substitute_context_2d(realContext, substitutePos, x, y);

			const result = forwardOneLayer(modifiedContext, layerWeights, d_model, n_heads, null, null, null);
			const h_out = result.h_out[substitutePos];

			const dx = h_out[0] - x;
			const dy = h_out[1] - y;
			const mag = Math.sqrt(dx * dx + dy * dy);

			points.push({ x, y, dx, dy, mag });
			if (mag > maxMag) maxMag = mag;

			computed++;
			_vf_update_loading_overlay(loadingOverlay, computed, totalPoints);

			if (computed % 10 === 0) {
				await new Promise(r => setTimeout(r, 0));
			}
		}
	}

	if (maxMag < 1e-8) maxMag = 1e-8;
	return { points, maxMag };
}

/**
 * Creates a copy of the real context with one position substituted by [x, y].
 */
function _vf_substitute_context_2d(realContext, substitutePos, x, y) {
	return realContext.map((row, idx) => {
		if (idx === substitutePos) return [x, y];
		return [...row];
	});
}

/**
 * Computes the maximum visual arrow length from the 2D grid cell size.
 */
function _vf2d_overlay_max_arrow_length(bounds, gridRes) {
	const cellW = (bounds.xMax - bounds.xMin) / gridRes;
	const cellH = (bounds.yMax - bounds.yMin) / gridRes;
	return Math.min(cellW, cellH) * 1.2;
}

function _compute_vector_field_points_3d(migrationId, layerNum, d_model, n_heads) {
    const regData = transformerLabVisMigrationDataRegistry.get(migrationId);
    if (!regData) return null;

    const realContext = regData.start_h;
    const seqLen = realContext.length;
    const substitutePos = seqLen - 1;

    const bounds = _vf3d_overlay_compute_bounds_from_context_and_embeddings(realContext);
    const gridRes = 6;
    const layerWeights = window.currentWeights[layerNum - 1];

    const { points, maxMag } = _vf3d_sample_grid_with_context(
        bounds, gridRes, layerWeights, d_model, n_heads, realContext, substitutePos
    );

    const maxArrowLen = _vf3d_compute_max_arrow_length(bounds, gridRes);

    return { points, maxMag, maxArrowLen, seqLen, substitutePos };
}

function _vf3d_overlay_compute_bounds_from_context_and_embeddings(realContext) {
    const allVecs = Object.values(window.persistentEmbeddingSpace);
    let xMin = Infinity, xMax = -Infinity;
    let yMin = Infinity, yMax = -Infinity;
    let zMin = Infinity, zMax = -Infinity;

    const updateBounds = (v) => {
        if (v[0] < xMin) xMin = v[0];
        if (v[0] > xMax) xMax = v[0];
        if (v.length > 1) {
            if (v[1] < yMin) yMin = v[1];
            if (v[1] > yMax) yMax = v[1];
        }
        if (v.length > 2) {
            if (v[2] < zMin) zMin = v[2];
            if (v[2] > zMax) zMax = v[2];
        }
    };

    allVecs.forEach(updateBounds);
    realContext.forEach(updateBounds);

    if (xMin === xMax) { xMin -= 1; xMax += 1; }
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    if (zMin === zMax) { zMin -= 1; zMax += 1; }

    const pad = 2;
    return {
        xMin: xMin - pad, xMax: xMax + pad,
        yMin: yMin - pad, yMax: yMax + pad,
        zMin: zMin - pad, zMax: zMax + pad
    };
}

function _vf3d_sample_grid_with_context(bounds, gridRes, layerWeights, d_model, n_heads, realContext, substitutePos) {
    const { xMin, xMax, yMin, yMax, zMin, zMax } = bounds;
    const points = [];
    let maxMag = 0;

    for (let i = 0; i <= gridRes; i++) {
        for (let j = 0; j <= gridRes; j++) {
            for (let k = 0; k <= gridRes; k++) {
                const x = xMin + (xMax - xMin) * (i / gridRes);
                const y = yMin + (yMax - yMin) * (j / gridRes);
                const z = zMin + (zMax - zMin) * (k / gridRes);

                const result = _vf3d_evaluate_single_point(
                    x, y, z, realContext, substitutePos, layerWeights, d_model, n_heads
                );

                points.push(result);
                if (result.mag > maxMag) maxMag = result.mag;
            }
        }
    }

    if (maxMag < 1e-8) maxMag = 1e-8;
    return { points, maxMag };
}

function _vf3d_evaluate_single_point(x, y, z, realContext, substitutePos, layerWeights, d_model, n_heads) {
    const modifiedContext = _vf_substitute_context_3d(realContext, substitutePos, x, y, z);
    const result = forwardOneLayer(modifiedContext, layerWeights, d_model, n_heads, null, null, null);
    const h_out = result.h_out[substitutePos];

    const dx = h_out[0] - x;
    const dy = h_out[1] - y;
    const dz = h_out[2] - z;
    const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return { x, y, z, dx, dy, dz, mag };
}

function _vf3d_compute_max_arrow_length(bounds, gridRes) {
    const cellX = (bounds.xMax - bounds.xMin) / gridRes;
    const cellY = (bounds.yMax - bounds.yMin) / gridRes;
    const cellZ = (bounds.zMax - bounds.zMin) / gridRes;
    return Math.min(cellX, cellY, cellZ) * 1.1;
}

function _build_vector_field_traces_3d(points, maxMag, maxArrowLen, seqLen, substitutePos) {
	const newTraces = [];

	for (let p = 0; p < points.length; p++) {
		const pt = points[p];
		const normMag = pt.mag / maxMag;

		let r, g, b;
		if (normMag < 0.5) {
			const t = normMag * 2;
			r = Math.round(59 + (168 - 59) * t);
			g = Math.round(130 + (85 - 130) * t);
			b = Math.round(246 + (247 - 246) * t);
		} else {
			const t = (normMag - 0.5) * 2;
			r = Math.round(168 + (239 - 168) * t);
			g = Math.round(85 + (68 - 85) * t);
			b = Math.round(247 + (68 - 247) * t);
		}
		const color = `rgb(${r},${g},${b})`;

		const arrowLen = Math.max(maxArrowLen * 0.06, maxArrowLen * normMag);

		let ux = 0, uy = 0, uz = 0;
		if (pt.mag > 1e-10) {
			ux = pt.dx / pt.mag;
			uy = pt.dy / pt.mag;
			uz = pt.dz / pt.mag;
		}

		const headFraction = 0.3;
		const tailLen = arrowLen * (1 - headFraction);
		const headLen = arrowLen * headFraction;

		const tailEndX = pt.x + ux * tailLen;
		const tailEndY = pt.y + uy * tailLen;
		const tailEndZ = pt.z + uz * tailLen;

		const tipX = pt.x + ux * arrowLen;
		const tipY = pt.y + uy * arrowLen;
		const tipZ = pt.z + uz * arrowLen;

		const lineWidth = 2 + normMag * 6;

		newTraces.push({
			type: 'scatter3d',
			x: [pt.x, tailEndX],
			y: [pt.y, tailEndY],
			z: [pt.z, tailEndZ],
			mode: 'lines',
			line: { width: lineWidth, color: color },
			opacity: 0.2,
			showlegend: false,
			hoverinfo: 'skip',
			_isVectorField: true
		});

		const coneSize = Math.max(0.05, headLen);
		newTraces.push({
			type: 'cone',
			x: [tipX],
			y: [tipY],
			z: [tipZ],
			u: [ux],
			v: [uy],
			w: [uz],
			sizemode: 'absolute',
			sizeref: coneSize,
			anchor: 'tip',
			colorscale: [[0, color], [1, color]],
			showscale: false,
			showlegend: false,
			opacity: 0.2,
			hovertemplate:
				`Point: (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}, ${pt.z.toFixed(2)})<br>` +
				`Δ: (${pt.dx.toFixed(3)}, ${pt.dy.toFixed(3)}, ${pt.dz.toFixed(3)})<br>` +
				`Magnitude: ${pt.mag.toFixed(4)}<br>` +
				`Context: ${seqLen} tokens, substituted at pos ${substitutePos}<extra></extra>`,
			_isVectorField: true
		});
	}

	newTraces.push({
		type: 'scatter3d',
		x: [null], y: [null], z: [null],
		mode: 'markers',
		marker: {
			colorscale: [
				[0, 'rgb(59,130,246)'],
				[0.5, 'rgb(168,85,247)'],
				[1, 'rgb(239,68,68)']
			],
			cmin: 0,
			cmax: maxMag,
			color: [0, maxMag],
			showscale: true,
			colorbar: {
				title: '|Δh|',
				thickness: 15,
				len: 0.5,
				x: 1.08,
				y: 0.5
			}
		},
		showlegend: false,
		hoverinfo: 'none',
		_isVectorField: true
	});

	return newTraces;
}

function _add_vector_field_overlay_3d_sync(migrationId, layerNum, d_model, n_heads) {
	const computed = _compute_vector_field_points_3d(migrationId, layerNum, d_model, n_heads);
	if (!computed) return;

	const newTraces = _build_vector_field_traces_3d(
		computed.points, computed.maxMag, computed.maxArrowLen,
		computed.seqLen, computed.substitutePos
	);

	Plotly.addTraces(migrationId, newTraces);
}

function remove_vector_field_overlay(migrationId) {
	const regData = transformerLabVisMigrationDataRegistry.get(migrationId);
	if (!regData) return;

	// Just re-render the migration plot — since the toggle is already 'off',
	// render_migration_logic will NOT include VF traces
	render_migration_logic(
		migrationId,
		regData.tokens,
		regData.start_h,
		regData.end_h,
		regData.layerNum,
		regData.d_model,
		regData.h_after,
		regData.tokenStrings
	);
}

function add_vector_field_overlay(migrationId, layerNum, d_model) {
	const plotDiv = document.getElementById(migrationId);
	if (!plotDiv || !window.currentWeights) return;
	if (d_model >= 4) return;

	const regData = transformerLabVisMigrationDataRegistry.get(migrationId);
	if (!regData) return;

	const { n_heads } = getTransformerConfig();
	const is3D = d_model === 3;

	// Build base traces
	const baseTraces = [];
	regData.tokens.forEach((token, i) => {
		baseTraces.push(...buildMigrationTokenTrace(
			token, i, regData.start_h, regData.end_h, d_model, is3D, regData.tokens
		));
	});
	baseTraces.push(buildMigrationColorbarTrace(is3D, regData.tokens));

	// Build vector field traces
	let vfTraces = [];
	if (d_model === 2) {
		const computed = _compute_vector_field_points_2d(migrationId, layerNum, d_model, n_heads);
		if (computed) {
			vfTraces = _build_vector_field_traces_2d(
				computed.points, computed.maxMag, computed.maxArrowLen,
				computed.seqLen, computed.substitutePos
			);
		}
	} else if (d_model === 3) {
		const computed = _compute_vector_field_points_3d(migrationId, layerNum, d_model, n_heads);
		if (computed) {
			vfTraces = _build_vector_field_traces_3d(
				computed.points, computed.maxMag, computed.maxArrowLen,
				computed.seqLen, computed.substitutePos
			);
		}
	}

	const allTraces = [...baseTraces, ...vfTraces];
	const layout = buildMigrationLayout(layerNum, is3D);
	Plotly.react(migrationId, allTraces, layout, { responsive: true });
}

/**
 * Async version of the 3D vector field overlay with loading progress UI.
 * The original synchronous helpers (_compute_vector_field_points_3d,
 * _build_vector_field_traces_3d) handle the math; this function adds
 * chunked async execution with a progress overlay.
 */
async function add_vector_field_overlay_3d(migrationId, layerNum, d_model, n_heads) {
    const regData = transformerLabVisMigrationDataRegistry.get(migrationId);
    if (!regData) return;

    const realContext = regData.start_h;
    const seqLen = realContext.length;
    const substitutePos = seqLen - 1;

    const bounds = _vf3d_overlay_compute_bounds(realContext);
    const gridRes = 6;
    const layerWeights = window.currentWeights[layerNum - 1];
    const totalPoints = (gridRes + 1) ** 3;

    const wrapper = document.getElementById(migrationId)?.closest('[data-migration-wrapper]');
    const loadingOverlay = _vf_show_loading_overlay(wrapper, totalPoints);

    const { points, maxMag } = await _vf3d_overlay_sample_grid_async(
        bounds, gridRes, layerWeights, d_model, n_heads,
        realContext, substitutePos, loadingOverlay, totalPoints
    );

    const maxArrowLen = _vf3d_overlay_max_arrow_length(bounds, gridRes);
    const newTraces = _build_vector_field_traces_3d(points, maxMag, maxArrowLen, seqLen, substitutePos);

    _vf_remove_loading_overlay(loadingOverlay);
    Plotly.addTraces(migrationId, newTraces);
}

/**
 * Computes the 3D bounding box from both embedding space and the real context vectors.
 * Includes padding.
 * @returns {{ xMin, xMax, yMin, yMax, zMin, zMax }}
 */
function _vf3d_overlay_compute_bounds(realContext) {
    const allVecs = Object.values(window.persistentEmbeddingSpace);
    let xMin = Infinity, xMax = -Infinity;
    let yMin = Infinity, yMax = -Infinity;
    let zMin = Infinity, zMax = -Infinity;

    const updateBounds = (v) => {
        if (v[0] < xMin) xMin = v[0];
        if (v[0] > xMax) xMax = v[0];
        if (v.length > 1) {
            if (v[1] < yMin) yMin = v[1];
            if (v[1] > yMax) yMax = v[1];
        }
        if (v.length > 2) {
            if (v[2] < zMin) zMin = v[2];
            if (v[2] > zMax) zMax = v[2];
        }
    };

    allVecs.forEach(updateBounds);
    realContext.forEach(updateBounds);

    if (xMin === xMax) { xMin -= 1; xMax += 1; }
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    if (zMin === zMax) { zMin -= 1; zMax += 1; }

    const pad = 2;
    return {
        xMin: xMin - pad, xMax: xMax + pad,
        yMin: yMin - pad, yMax: yMax + pad,
        zMin: zMin - pad, zMax: zMax + pad
    };
}

/**
 * Asynchronously samples a 3D grid, running a forward pass at each point.
 * Yields to the browser every 10 points and updates the loading overlay.
 * @returns {Promise<{ points: object[], maxMag: number }>}
 */
async function _vf3d_overlay_sample_grid_async(bounds, gridRes, layerWeights, d_model, n_heads, realContext, substitutePos, loadingOverlay, totalPoints) {
    const { xMin, xMax, yMin, yMax, zMin, zMax } = bounds;
    const points = [];
    let maxMag = 0;
    let computed = 0;

    for (let i = 0; i <= gridRes; i++) {
        for (let j = 0; j <= gridRes; j++) {
            for (let k = 0; k <= gridRes; k++) {
                const x = xMin + (xMax - xMin) * (i / gridRes);
                const y = yMin + (yMax - yMin) * (j / gridRes);
                const z = zMin + (zMax - zMin) * (k / gridRes);

                const modifiedContext = _vf_substitute_context_3d(realContext, substitutePos, x, y, z);

                const result = forwardOneLayer(modifiedContext, layerWeights, d_model, n_heads, null, null, null);
                const h_out = result.h_out[substitutePos];

                const dx = h_out[0] - x;
                const dy = h_out[1] - y;
                const dz = h_out[2] - z;
                const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);

                points.push({ x, y, z, dx, dy, dz, mag });
                if (mag > maxMag) maxMag = mag;

                computed++;
                _vf_update_loading_overlay(loadingOverlay, computed, totalPoints);

                if (computed % 10 === 0) {
                    await new Promise(r => setTimeout(r, 0));
                }
            }
        }
    }

    if (maxMag < 1e-8) maxMag = 1e-8;
    return { points, maxMag };
}

/**
 * Creates a copy of the real context with one position substituted by [x, y, z].
 */
function _vf_substitute_context_3d(realContext, substitutePos, x, y, z) {
    return realContext.map((row, idx) => {
        if (idx === substitutePos) return [x, y, z];
        return [...row];
    });
}

/**
 * Computes the maximum visual arrow length from the 3D grid cell size.
 */
function _vf3d_overlay_max_arrow_length(bounds, gridRes) {
    const cellX = (bounds.xMax - bounds.xMin) / gridRes;
    const cellY = (bounds.yMax - bounds.yMin) / gridRes;
    const cellZ = (bounds.zMax - bounds.zMin) / gridRes;
    return Math.min(cellX, cellY, cellZ) * 1.1;
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

        // ← Uses extracted function
        const hoverTexts = dataPoints.map((p, pIdx) => {
            const fromStage = pIdx > 0 ? dataPoints[pIdx - 1].name : '(start)';
            return buildTrajectoryHoverText(labels[tIdx], tIdx, fromStage, p.name, p.data[tIdx], embSnap, snapVocab);
        });

        traces.push({
            type: 'scatter3d',
            x, y, z,
            mode: 'lines',
            name: tokenLabel,
            legendgroup: tokenLabel,
            line: { width: 5, color: tColor },
            hoverinfo: 'text',
            hovertemplate: '%{text}<extra></extra>',
            text: hoverTexts
        });

        for (let i = 0; i < x.length - 1; i++) {
            // ← Uses extracted function
            const coneHoverText = buildTrajectoryHoverText(
                labels[tIdx], tIdx, dataPoints[i].name, dataPoints[i + 1].name,
                dataPoints[i + 1].data[tIdx], embSnap, snapVocab
            );

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

        // Start marker
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

        // End marker
        const endIdx = dataPoints.length - 1;
        const endLogit = _traj_get_logit_word(dataPoints[endIdx].data[tIdx], embSnap, snapVocab);
        traces.push({
            type: 'scatter3d',
            x: [x[x.length - 1]], y: [y[y.length - 1]], z: [z[z.length - 1]],
            mode: 'text',
            text: ['☖'],
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

        // ← Uses extracted function
        const hoverTexts = dataPoints.map((p, pIdx) => {
            const fromStage = pIdx > 0 ? dataPoints[pIdx - 1].name : '(start)';
            return buildTrajectoryHoverText(labels[tIdx], tIdx, fromStage, p.name, p.data[tIdx], embSnap, snapVocab);
        });

        traces.push({
            type: 'scatter',
            x, y,
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

function _traj_render_low_dimensional(trajDiv, tokens, labels, dataPoints, d_model, embSnap, snapVocab) {
    if (d_model === 3) {
        _traj_render_3d_echarts(trajDiv, tokens, labels, dataPoints, embSnap, snapVocab);
        return;
    }

    // ── 2D: unchanged Plotly path ──
    const result = _traj_build_2d_token_traces(tokens, labels, dataPoints, embSnap, snapVocab);

    const axisTemplate = {
        showticklabels: false, showgrid: true, zeroline: false,
        title: { text: "" }, backgroundcolor: "#f9fafb"
    };

    const layout = {
        title: '<b>Token Trajectory from Embedding → Embedding + Position through the Layers</b>',
        xaxis: axisTemplate, yaxis: axisTemplate,
        annotations: result.annotations,
        margin: { l: 10, r: 10, b: 50, t: 80 },
        showlegend: true,
        legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.1, font: { size: 14 } }
    };

    Plotly.react(trajDiv.id, result.traces, layout);
}

// ─── Main 3D ECharts renderer ───────────────────────────────

function _traj_render_3d_echarts(trajDiv, tokens, labels, dataPoints, embSnap, snapVocab) {
    // Clean up whichever renderer was used previously
    Plotly.purge(trajDiv);
    let chart = echarts.getInstanceByDom(trajDiv);
    if (!chart) chart = echarts.init(trajDiv);

    const series = [];
    const legendData = [];

    // 1. Vocabulary embedding landmarks
    series.push(_traj_ec3d_landmark_series(embSnap, snapVocab));
    legendData.push('Vocab Embeddings');

    // 2. Per-token: one line3D + one scatter3D (same name → shared legend entry)
    tokens.forEach((token, tIdx) => {
        const hasData = dataPoints.every(p => p.data && p.data[tIdx]);
        if (!hasData) return;

        const tColor = getPositionColor(tIdx, tokens.length);
        const tokenLabel = `${labels[tIdx]} (${tIdx + 1})`;
        legendData.push(tokenLabel);

        series.push(_traj_ec3d_line_series(tokenLabel, tColor, dataPoints, tIdx));
        series.push(_traj_ec3d_marker_series(
            tokenLabel, tColor, dataPoints, tIdx, labels, embSnap, snapVocab
        ));
    });

    // 3. Render (true = full replace, not merge — safe when series count changes)
    chart.setOption(_traj_ec3d_option(series, legendData), true);

    // 4. Wire resize
    if (trajDiv._ecResizeTraj) window.removeEventListener('resize', trajDiv._ecResizeTraj);
    trajDiv._ecResizeTraj = () => {
        const c = echarts.getInstanceByDom(trajDiv);
        if (c) c.resize();
    };
    window.addEventListener('resize', trajDiv._ecResizeTraj);
}

// ─── Embedding landmark diamonds ─────────────────────────────

function _traj_ec3d_landmark_series(embSnap, snapVocab) {
    return {
        name: 'Vocab Embeddings',
        type: 'scatter3D',
        data: snapVocab.map(word => {
            const v = embSnap[word];
            return { name: word, value: [v[0], v[1] || 0, v[2] || 0] };
        }),
        symbol: 'diamond',
        symbolSize: 8,
        itemStyle: {
            color: 'rgba(100,116,139,0.8)',
            borderWidth: 1,
            borderColor: '#334155'
        },
        label: {
            show: true,
            position: 'top',
            distance: 5,
            formatter: p => p.name,
            textStyle: { fontSize: 10, color: '#475569', fontFamily: 'Inter, sans-serif' }
        }
    };
}

// ─── Trajectory line for one token ───────────────────────────

function _traj_ec3d_line_series(tokenLabel, color, dataPoints, tIdx) {
    return {
        name: tokenLabel,
        type: 'line3D',
        data: dataPoints.map(p => p.data[tIdx].slice(0, 3)),
        lineStyle: { width: 4, color: color, opacity: 0.85 }
    };
}

// ─── Step markers (hover, start/end emphasis) for one token ──

function _traj_ec3d_marker_series(tokenLabel, color, dataPoints, tIdx, labels, embSnap, snapVocab) {
    const nSteps = dataPoints.length;

    const data = dataPoints.map((p, pIdx) => {
        const fromStage = pIdx > 0 ? dataPoints[pIdx - 1].name : '(start)';
        const hoverHtml = buildTrajectoryHoverText(
            labels[tIdx], tIdx, fromStage, p.name,
            p.data[tIdx], embSnap, snapVocab
        );

        const isStart = pIdx === 0;
        const isEnd   = pIdx === nSteps - 1;

        return {
            value: p.data[tIdx].slice(0, 3),
            // Per-item symbolSize: end 14, start 10, mid 6
            symbolSize: isEnd ? 14 : (isStart ? 10 : 6),
            itemStyle: {
                color: color,
                borderWidth: (isStart || isEnd) ? 2 : 0,
                borderColor: '#000',
                opacity: isStart || isEnd ? 1 : 0.7
            },
            _hover: hoverHtml
        };
    });

    return {
        name: tokenLabel,
        type: 'scatter3D',
        data: data,
        symbol: 'circle',
        symbolSize: 6,    // fallback if per-item symbolSize is ignored
        tooltip: {
            formatter: params => params.data._hover
        }
    };
}

// ─── Full chart option ───────────────────────────────────────

function _traj_ec3d_option(series, legendData) {
    return {
        title: {
            text: 'Token Trajectory: Embedding → +Position → Layer Outputs',
            left: 'center', top: 10,
            textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' }
        },
        tooltip: { show: true, trigger: 'item', confine: true },
        legend: {
            data: legendData,
            orient: 'horizontal',
            bottom: 5, left: 'center',
            textStyle: { fontSize: 12 }
        },
        xAxis3D: { type: 'value', name: 'Dim 0' },
        yAxis3D: { type: 'value', name: 'Dim 1' },
        zAxis3D: { type: 'value', name: 'Dim 2' },
        grid3D: {
            viewControl: {
                projection: 'perspective',
                alpha: 30,      // vertical angle (matches old camera.eye.z)
                beta: 40,       // horizontal angle
                distance: 200,
                autoRotate: false,
                damping: 0.9
            },
            light: {
                main:    { intensity: 1.2, shadow: false },
                ambient: { intensity: 0.3 }
            },
            environment: '#f9fafb',
            axisLine:    { lineStyle: { color: '#cbd5e1' } },
            axisPointer: { show: false },
            boxWidth: 100, boxHeight: 100, boxDepth: 100
        },
        series: series
    };
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

		// After rendering, measure actual content height and update
		requestAnimationFrame(() => {
			const actualHeight = trajDiv.scrollHeight;
			trajDiv.style.height = actualHeight + 'px';
			trajDiv.style.minHeight = actualHeight + 'px';
		});
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
function tlab_render_latex_matrix(id, plotDiv, tokens, start_h, end_h, h_after, d_model, tokenStrings) {
	const vocabRows = buildVocabTransitionRows(tokens, start_h, end_h, d_model);

	const ts = tokenStrings || null;

	// Determine the stage label from the id: "migration-layer-N" → layer N
	let stageLabel = 'layer output';
	const layerMatch = id.match(/migration-layer-(\d+)/);
	if (layerMatch) {
		const layerNum = parseInt(layerMatch[1]);
		stageLabel = `out layer ${layerNum}`;
	}

	const hAfterMatrix = matrixToPmatrixLabeled(h_after, ts, stageLabel);

	const latexString = `$$h_\\text{after} = ${hAfterMatrix}, \\quad h_\\text{after} \\cdot W_\\text{vocab} = \\begin{pmatrix} ${vocabRows} \\end{pmatrix}$$`;

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

    if (!Array.isArray(tokenStrings) || typeof tokenStrings[0] !== 'string') {
        console.error("Plotting requires an array of string tokens.");
        return [];
    }

    const injectedEmbeddings = embedTokensWithPE(tokenStrings, d_model);

    registerLazyRenderable(
        containerId,
        positionalShiftRegistry,
        positionalShiftObserver,
        { tokenStrings, d_model, injectedEmbeddings },
        () => _execute_shift_render(tokenStrings, d_model, injectedEmbeddings),
        `<div style="padding:20px; color:#64748b;">Wait for Positional Shift Plot to load...</div>`
    );

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

	// ── NO AUTO-SNAPPING ──
	// Just update the labels to reflect whatever the user chose.
	document.getElementById('dim-val').innerText = d_model;
	document.getElementById('heads-val').innerText = h;

	// Clear stale weights so the next valid run reinitializes cleanly
	window.currentWeights = null;
	window.persistentEmbeddingSpace = null;
	window.last_d_model = d_model;

	// Check validity and update the UI accordingly
	updateArchitectureValidityUI();

	// Only re-run the demo if the config is valid
	if (d_model % h === 0) {
		debounced_run_transformer_demo();
	}
}

function updateArchitectureValidityUI() {
	const d_model = parseInt(document.getElementById('transformer-dimension-model').value) || 3;
	const h       = parseInt(document.getElementById('transformer-heads').value) || 1;
	const isValid = (d_model % h === 0);

	// ── Train button ──
	const trainBtn = document.querySelector('.train-btn');
	if (trainBtn) {
		if (!isValid) {
			trainBtn.disabled = true;
			trainBtn.title = `d_model (${d_model}) must be divisible by heads (${h})`;
			trainBtn.style.opacity = '0.45';
			trainBtn.style.cursor = 'not-allowed';
		} else {
			// Delegate to the existing function so the token-count check
			// is also evaluated before enabling.
			updateTrainButtonState();
		}
	}

	// ── Validity message container ──
	let msgDiv = document.getElementById('arch-validity-message');
	if (!msgDiv) {
		const headsSlider = document.getElementById('transformer-heads');
		if (!headsSlider) return;
		msgDiv = document.createElement('div');
		msgDiv.id = 'arch-validity-message';
		const parentDiv = headsSlider.closest('div[style]');
		if (parentDiv && parentDiv.parentNode) {
			parentDiv.parentNode.insertBefore(msgDiv, parentDiv.nextSibling);
		}
	}

	if (isValid) {
		msgDiv.style.display = 'none';
		msgDiv.innerHTML = '';
		setSliderOutline('transformer-dimension-model', '');
		setSliderOutline('transformer-heads', '');
		return;
	}

	// ── Invalid state: build the message ──
	setSliderOutline('transformer-dimension-model', '2px solid #ef4444');
	setSliderOutline('transformer-heads', '2px solid #ef4444');

	const validHeads = getValidHeads(d_model);
	const validDims  = getValidDimensions(h);

	const dkValue = (d_model / h).toFixed(2);

	msgDiv.style.cssText = `
	display: block;
	margin-top: 10px;
	padding: 12px 16px;
	background: #fef2f2;
	border: 2px solid #ef4444;
	border-radius: 8px;
	font-size: 0.85rem;
	color: #991b1b;
	line-height: 1.7;
    `;

	msgDiv.innerHTML = `
	<strong>⚠️ Invalid Configuration — Training Disabled</strong><br>
	<p>
	    $d_{\\text{model}}$ must be evenly divisible by $h$ so that each
	    attention head receives an equal integer-sized slice of the vector:
	</p>
	<p style="text-align:center;">
	    $d_k = \\dfrac{d_{\\text{model}}}{h} = \\dfrac{${d_model}}{${h}} = ${dkValue}$
	    &nbsp;— <strong>not an integer.</strong>
	</p>

	<p style="margin-top:8px;">
	    <strong>Fix option A</strong> — keep $d_{\\text{model}} = ${d_model}$,
	    change $h$ to one of:
	    <code>${validHeads.length > 0 ? validHeads.join(', ') : 'none in slider range'}</code>
	</p>
	<p>
	    <strong>Fix option B</strong> — keep $h = ${h}$,
	    change $d_{\\text{model}}$ to one of:
	    <code>${validDims.length > 0 ? validDims.join(', ') : 'none in slider range'}</code>
	</p>
    `;

	render_temml();
}

/**
 * Returns all valid head counts (within the slider range) for a given d_model.
 */
function getValidHeads(d_model) {
	const maxHeads = parseInt(document.getElementById('transformer-heads').max) || 8;
	const valid = [];
	for (let candidate = 1; candidate <= maxHeads; candidate++) {
		if (d_model % candidate === 0) valid.push(candidate);
	}
	return valid;
}

/**
 * Returns all valid d_model values (within the slider range) for a given head count.
 */
function getValidDimensions(h) {
	const minDim = parseInt(document.getElementById('transformer-dimension-model').min) || 2;
	const maxDim = parseInt(document.getElementById('transformer-dimension-model').max) || 16;
	const valid = [];
	for (let candidate = minDim; candidate <= maxDim; candidate++) {
		if (candidate % h === 0) valid.push(candidate);
	}
	return valid;
}

/**
 * Utility: sets a colored outline on a slider to indicate validity.
 */
function setSliderOutline(sliderId, outline) {
	const el = document.getElementById(sliderId);
	if (el) el.style.outline = outline;
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

	const d_model = parseInt(document.getElementById('transformer-dimension-model').value) || 3;
	const h       = parseInt(document.getElementById('transformer-heads').value) || 1;

	if (d_model % h !== 0) {
		btn.disabled = true;
		btn.title = `d_model (${d_model}) must be divisible by heads (${h})`;
		btn.style.opacity = '0.45';
		btn.style.cursor = 'not-allowed';
	} else if (tokens.length < 2) {
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
 * Builds the token chip HTML strip. If chips already exist and token count
 * matches, patches labels in-place to avoid DOM destruction (flicker).
 * Returns the chip elements.
 */
function buildTokenChipStrip(strip, tokens) {
    const existingChips = strip.querySelectorAll('.sa-token-block');

    // If same number of chips, patch in-place — no DOM rebuild
    if (existingChips.length === tokens.length) {
        existingChips.forEach((chip, i) => {
            const displayWord = (typeof tokens[i] === 'string') ? tokens[i] : tlab_get_top_word_only(tokens[i]);
            if (chip.textContent.trim() !== displayWord) {
                chip.textContent = displayWord;
            }
        });
        return existingChips;
    }

    // Different count — full rebuild
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
 * Only re-attaches hover events if the chips were rebuilt (not patched).
 */
function renderDynamicAttentionWeb(containerId, canvasId, stripId, tokens, weights) {
    const container = document.getElementById(containerId);
    const canvas    = document.getElementById(canvasId);
    const strip     = document.getElementById(stripId);
    if (!container || !canvas || !strip) return;

    const prevChipCount = strip.querySelectorAll('.sa-token-block').length;
    const chips = buildTokenChipStrip(strip, tokens);
    const chipsRebuilt = (prevChipCount !== tokens.length);

    // Store latest weights on the container so drawArcs always reads fresh data
    container._attnWebWeights = weights;
    container._attnWebTokens = tokens;

    let hoverIndex = container._attnWebHoverIndex ?? null;

    const drawArcs = () => drawAttentionArcs(
        container, canvas, chips, 
        container._attnWebTokens, 
        container._attnWebWeights, 
        container._attnWebHoverIndex ?? null
    );

    // Only re-attach events if chips were rebuilt or first time
    if (chipsRebuilt || !container._attnWebInitialized) {
        container._attnWebHoverIndex = null;

        attachChipHoverEvents(chips, (idx) => {
            container._attnWebHoverIndex = idx;
            drawArcs();
        }, () => {
            container._attnWebHoverIndex = null;
            drawArcs();
        });

        // Only attach scroll listener once
        if (!container._attnWebInitialized) {
            container.addEventListener('scroll', drawArcs);
            attachResizeHandler(containerId, drawArcs);
        }
        container._attnWebInitialized = true;
    }

    drawArcs();
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

    const n = Math.min(tokens.length, chips.length, weights.length);  // ← ADD THIS

    for (let i = 0; i < n; i++) {                                     // ← USE n
        for (let j = 0; j < n; j++) {                                 // ← USE n
            if (i === j) continue;
            if (!weights[i] || weights[i].length <= j) continue;      // ← SAFETY CHECK
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

function render_h1_logic(h0, normH0, multiHeadOutput, gamma, beta, WO, tokenStrings) {
	const normContainer = document.getElementById('transformer-h1-layernorm-viz');
	const finalContainer = document.getElementById('transformer-h1-final-viz');
	if (!normContainer || !finalContainer || !gamma || !beta || !WO) return;

	const projectedMHA = multiHeadOutput.map(row =>
		WO[0].map((_, i) => row.reduce((acc, _, j) => acc + row[j] * WO[j][i], 0))
	);

	const h1 = matAdd(h0, projectedMHA);

	const flattenDisplay = (mat) => {
		if (!mat || !mat.length) return '';
		return mat.map(row =>
			Array.isArray(row)
			? row.map(v => v.toFixed(nr_fixed)).join(',')
			: row.toFixed(nr_fixed)
		).join(';');
	};
	const hash = [
		flattenDisplay(h0),
		flattenDisplay(normH0),
		flattenDisplay(multiHeadOutput),
		flattenDisplay(projectedMHA),
		flattenDisplay(h1),
		flattenDisplay(gamma),
		flattenDisplay(beta)
	].join('|');

	if (normContainer._lastHash === hash && finalContainer._lastHash === hash) {
		return h1;
	}
	normContainer._lastHash = hash;
	finalContainer._lastHash = hash;

	const ts = tokenStrings || null;

	const normHtml = `
    <p style="font-weight:bold; color:#065f46;">Pre-Layer Normalization (applied <em>before</em> the sublayer)</p>

    <div style="margin-bottom:15px;">
    <p style="font-size:0.85rem; color:#1e40af;">1. Normalize $h_0$ before attention:</p>
    $$ \\text{LayerNorm}(h_0) = \\underbrace{\\gamma}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} \\underbrace{\\odot}_{\\substack{\\text{Hadamard} \\\\ \\text{Product}}} \\frac{h_0 - \\underbrace{\\mu}_{\\text{Mean of } h_0}}{\\sqrt{\\underbrace{\\sigma^2}_{\\text{Variance of } h_0}} + \\underbrace{\\epsilon}_{${epsilon}}} + \\underbrace{\\beta}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} $$
    <div style="overflow-x:auto; padding-bottom: 10px">
    $$ \\underbrace{${matrixToPmatrixLabeled(normH0, ts)}}_{\\text{LayerNorm}\\left(h_0\\right)} = \\text{LayerNorm}\\!\\left(\\underbrace{${matrixToPmatrixLabeled(h0, ts)}}_{h_0},\\; \\underbrace{${vecToPmatrix(gamma)}}_\\gamma,\\; \\underbrace{${vecToPmatrix(beta)}}_\\beta\\right) $$
    <br>
    </div>
    </div>
    `;

	const finalHtml = `
    <div style="margin-bottom:15px;">
    <p style="font-size:0.85rem; color:#1e40af;">2. Output projection $W^O$ mixes head outputs:</p>
    $$ \\text{MHA}_{\\text{proj}} = \\text{Concat}(\\text{Heads}) \\cdot W^O $$
    <div style="overflow-x:auto; overflow-y: hidden; padding-bottom: 10px">
    $$ \\underbrace{${matrixToPmatrixLabeled(projectedMHA, ts)}}_{\\text{MHA}_\\text{proj}} = \\underbrace{${matrixToPmatrixLabeled(multiHeadOutput, ts)}}_{\\text{Concat}\\left(\\text{Heads}\\right)} \\cdot \\underbrace{${matrixToPmatrix(WO)}}_{W^O} $$
    </div>
    </div>

    <div style="margin-bottom:10px;">
    <p style="font-size:0.85rem; color:#1e40af;">3. Residual connection (Pre-LN: no normalization on sublayer output):</p>
    $$ h_1 = h_0 + \\text{MHA}_{\\text{proj}} $$
    </div>
    <div style="overflow-x:auto; overflow-y: hidden; padding-bottom: 10px">
    $$ \\underbrace{${matrixToPmatrixLabeled(h1, ts)}}_{h_1} = \\underbrace{${matrixToPmatrixLabeled(h0, ts)}}_{h_0} + \\underbrace{${matrixToPmatrixLabeled(projectedMHA, ts)}}_{\\text{MHA}_{\\text{proj}}} $$
    </div>
    `;

	_heightLockedUpdate(normContainer, normHtml);
	_heightLockedUpdate(finalContainer, finalHtml);

	_renderTemmlOnElements([normContainer, finalContainer]);

	_releaseHeightLocks([normContainer, finalContainer]);

	return h1;
}

function render_h1_logic(h0, normH0, multiHeadOutput, gamma, beta, WO, tokenStrings) {
    const normContainer = document.getElementById('transformer-h1-layernorm-viz');
    const finalContainer = document.getElementById('transformer-h1-final-viz');
    if (!normContainer || !finalContainer || !gamma || !beta || !WO) return;

    const projectedMHA = projectMHAOutput(multiHeadOutput, WO);
    const h1 = matAdd(h0, projectedMHA);

    const hash = computeH1Hash(h0, normH0, multiHeadOutput, projectedMHA, h1, gamma, beta);
    if (normContainer._lastHash === hash && finalContainer._lastHash === hash) {
        return h1;
    }
    normContainer._lastHash = hash;
    finalContainer._lastHash = hash;

    const ts = tokenStrings || null;

    const normHtml = buildH1NormHtml(h0, normH0, gamma, beta, ts);
    const finalHtml = buildH1FinalHtml(h0, projectedMHA, multiHeadOutput, h1, WO, ts);

    _heightLockedUpdate(normContainer, normHtml);
    _heightLockedUpdate(finalContainer, finalHtml);
    _renderTemmlOnElements([normContainer, finalContainer]);
    _releaseHeightLocks([normContainer, finalContainer]);

    return h1;
}

/**
 * Projects the concatenated multi-head output through W^O.
 */
function projectMHAOutput(multiHeadOutput, WO) {
    return multiHeadOutput.map(row =>
        WO[0].map((_, i) => row.reduce((acc, _, j) => acc + row[j] * WO[j][i], 0))
    );
}

/**
 * Computes a display-level hash of all matrices involved in h1 rendering.
 * Only triggers re-render when visible output would actually change.
 */
function computeH1Hash(h0, normH0, multiHeadOutput, projectedMHA, h1, gamma, beta) {
    const flattenDisplay = (mat) => {
        if (!mat || !mat.length) return '';
        return mat.map(row =>
            Array.isArray(row)
                ? row.map(v => v.toFixed(nr_fixed)).join(',')
                : row.toFixed(nr_fixed)
        ).join(';');
    };
    return [
        flattenDisplay(h0),
        flattenDisplay(normH0),
        flattenDisplay(multiHeadOutput),
        flattenDisplay(projectedMHA),
        flattenDisplay(h1),
        flattenDisplay(gamma),
        flattenDisplay(beta)
    ].join('|');
}

/**
 * Builds the HTML for the Pre-Layer Normalization section of h1.
 */
function buildH1NormHtml(h0, normH0, gamma, beta, ts) {
    return `
    <p style="font-weight:bold; color:#065f46;">Pre-Layer Normalization (applied <em>before</em> the sublayer)</p>

    <div style="margin-bottom:15px;">
    <p style="font-size:0.85rem; color:#1e40af;">1. Normalize $h_0$ before attention:</p>
    $$ \\text{LayerNorm}(h_0) = \\underbrace{\\gamma}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} \\underbrace{\\odot}_{\\substack{\\text{Hadamard} \\\\ \\text{Product}}} \\frac{h_0 - \\underbrace{\\mu}_{\\text{Mean of } h_0}}{\\sqrt{\\underbrace{\\sigma^2}_{\\text{Variance of } h_0}} + \\underbrace{\\epsilon}_{${epsilon}}} + \\underbrace{\\beta}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} $$
    <div style="overflow-x:auto; padding-bottom: 10px">
    $$ \\underbrace{${matrixToPmatrixLabeled(normH0, ts)}}_{\\text{LayerNorm}\\left(h_0\\right)} = \\text{LayerNorm}\\!\\left(\\underbrace{${matrixToPmatrixLabeled(h0, ts)}}_{h_0},\\; \\underbrace{${vecToPmatrix(gamma)}}_\\gamma,\\; \\underbrace{${vecToPmatrix(beta)}}_\\beta\\right) $$
    <br>
    </div>
    </div>
    `;
}

/**
 * Builds the HTML for the output projection + residual connection section of h1.
 */
function buildH1FinalHtml(h0, projectedMHA, multiHeadOutput, h1, WO, ts) {
    return `
    <div style="margin-bottom:15px;">
    <p style="font-size:0.85rem; color:#1e40af;">2. Output projection $W^O$ mixes head outputs:</p>
    $$ \\text{MHA}_{\\text{proj}} = \\text{Concat}(\\text{Heads}) \\cdot W^O $$
    <div style="overflow-x:auto; overflow-y: hidden; padding-bottom: 10px">
    $$ \\underbrace{${matrixToPmatrixLabeled(projectedMHA, ts)}}_{\\text{MHA}_\\text{proj}} = \\underbrace{${matrixToPmatrixLabeled(multiHeadOutput, ts)}}_{\\text{Concat}\\left(\\text{Heads}\\right)} \\cdot \\underbrace{${matrixToPmatrix(WO)}}_{W^O} $$
    </div>
    </div>

    <div style="margin-bottom:10px;">
    <p style="font-size:0.85rem; color:#1e40af;">3. Residual connection (Pre-LN: no normalization on sublayer output):</p>
    $$ h_1 = h_0 + \\text{MHA}_{\\text{proj}} $$
    </div>
    <div style="overflow-x:auto; overflow-y: hidden; padding-bottom: 10px">
    $$ \\underbrace{${matrixToPmatrixLabeled(h1, ts)}}_{h_1} = \\underbrace{${matrixToPmatrixLabeled(h0, ts)}}_{h_0} + \\underbrace{${matrixToPmatrixLabeled(projectedMHA, ts)}}_{\\text{MHA}_{\\text{proj}}} $$
    </div>
    `;
}

function preserveScrollPositions(container, mutationFn) {
	// Save the global vertical scroll position
	const savedPageScrollY = window.scrollY;
	const savedPageScrollX = window.scrollX;

	// Cancel any pending minHeight release from a previous call
	if (container._heightUnlockRafId) {
		cancelAnimationFrame(container._heightUnlockRafId);
		container._heightUnlockRafId = null;
	}

	// Lock the container height to prevent layout collapse during mutation
	const previousHeight = container.offsetHeight;
	if (previousHeight > 0) {
		container.style.minHeight = previousHeight + 'px';
	}

	// 1. Snapshot scrollLeft of every overflow-x child
	const scrollable = container.querySelectorAll('[style*="overflow"]');
	const saved = [];
	scrollable.forEach((el, idx) => {
		if (el.scrollLeft > 0 || el.scrollTop > 0) {
			saved.push({ index: idx, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop });
		}
	});

	// 2. Execute the DOM mutation (innerHTML replacement, etc.)
	mutationFn();

	// Immediately restore page scroll (before browser paints)
	window.scrollTo(savedPageScrollX, savedPageScrollY);

	// 3. Restore scroll positions on the new elements at the same indices
	if (saved.length > 0) {
		requestAnimationFrame(() => {
			const newScrollable = container.querySelectorAll('[style*="overflow"]');
			saved.forEach(({ index, scrollLeft, scrollTop }) => {
				if (newScrollable[index]) {
					newScrollable[index].scrollLeft = scrollLeft;
					newScrollable[index].scrollTop = scrollTop;
				}
			});
		});
	}

	// NOTE: minHeight is NOT released here.
	// The caller must call _releaseHeightLocks([container]) after post-processing.
}

function matrixToPmatrixLabeled(matrix, tokenStrings, stageLabel) {
	if (!tokenStrings || tokenStrings.length !== matrix.length) {
		return matrixToPmatrix(matrix); // fallback to unlabeled
	}

	const total = matrix.length;
	const numCols = matrix[0].length;

	const colSpec = 'r|' + 'r'.repeat(numCols);

	const rows = matrix.map((row, tIdx) => {
		const colorCmd = getPositionColor(tIdx, total, 'temml');
		const safeLabel = tokenStrings[tIdx]
			.replace(/#/g, '\\#')
			.replace(/_/g, '\\_')
			.replace(/&/g, '\\&');
		
		// Build the subscript: token index + optional stage label
		let subscript;
		if (stageLabel) {
			// Convert stage label to LaTeX-safe form.
			// Handle "^X" patterns by breaking out of \text{}, 
			// rendering as math superscript, then re-entering \text{}.
			// e.g. "after W^O proj" → "\text{after W}^{O}\text{ proj}"
			const safeStage = stageLabel
				.replace(/#/g, '\\#')
				.replace(/_/g, '\\_')
				.replace(/&/g, '\\&')
				// Split around ^X patterns: close \text{}, do ^{X}, reopen \text{}
				.replace(/\^(\w+)/g, '}^{$1}\\text{');
			subscript = `_{${tIdx},\\,\\text{${safeStage}}}`;
		} else {
			subscript = `_{${tIdx}}`;
		}
		
		const label = `${colorCmd} \\text{${safeLabel}}${subscript}`;
		const vals = row.map(v => `${colorCmd} ${v.toFixed(nr_fixed)}`).join(' & ');
		return `${label} & ${vals}`;
	}).join(' \\\\ ');

	return `\\left(\\begin{array}{${colSpec}} ${rows} \\end{array}\\right)`;
}

function ensureUnifiedLayerContainer(layerIndex, n_layers, containerId) {
	const container = document.getElementById('ffn-equations-container');
	if (!container) return;

	container.style.overflowAnchor = 'none';

	let tabsWrapper = container.querySelector('.unified-layer-tabs');

	if (!tabsWrapper) {
		tabsWrapper = document.createElement('div');
		tabsWrapper.className = 'unified-layer-tabs';
		tabsWrapper.style.cssText = 'border:1px solid #3b82f6; border-radius:8px; overflow:hidden; margin-top:20px; overflow-anchor:none;';

		const tabList = document.createElement('div');
		tabList.className = 'unified-tab-list';
		tabList.style.cssText = 'background:#dbeafe; display:flex; border-bottom:2px solid #3b82f6; flex-wrap:wrap;';

		tabsWrapper.appendChild(tabList);
		container.appendChild(tabsWrapper);
	}

	const tabList = tabsWrapper.querySelector('.unified-tab-list');
	const prefix = `unified-layer-${layerIndex}`;

	// FIX: If the tab button already exists, don't recreate it
	if (document.getElementById(`${prefix}-tab-btn`)) {
		return;
	}

	const isActive = (layerIndex === window._activeUnifiedLayerIdx);

	const btn = document.createElement('button');
	btn.id = `${prefix}-tab-btn`;
	btn.className = 'unified-layer-tab-btn';
	btn.textContent = `Layer ${layerIndex + 1}`;
	btn.style.cssText = `padding:10px 18px; border:none; border-right:1px solid #93c5fd; cursor:pointer;
    background:${isActive ? '#fff' : '#bfdbfe'};
    font-weight:${isActive ? 'bold' : 'normal'};`;
	btn.onclick = () => showUnifiedLayer(layerIndex);
	tabList.appendChild(btn);

	const contentDiv = document.createElement('div');
	contentDiv.id = `${prefix}-content`;
	contentDiv.className = 'unified-layer-tab-content';
	contentDiv.dataset.layerIdx = layerIndex;
	contentDiv.dataset.rendered = 'false';
	contentDiv.style.display = isActive ? 'block' : 'none';
	contentDiv.style.padding = '15px';
	contentDiv.style.background = '#f8f9ff';
	contentDiv.style.overflowAnchor = 'none';

	contentDiv.innerHTML = `
    <!-- ===== ATTENTION SECTION ===== -->
    <div style="margin-bottom: 24px;">
	<div id="${prefix}-layernorm-viz" style="margin-top: 10px; padding: 20px; border: 1px solid #10b981; border-radius: 12px; background: #ecfdf5; overflow-x: auto;"></div>
	<div id="${prefix}-attention-heads" style="margin-top: 16px;"></div>
	<div id="${prefix}-concat-viz" style="margin-top: 16px; padding: 20px; border: 1px solid #3b82f6; border-radius: 12px; background: #f0f4f8; overflow: auto;"></div>
	<div id="${prefix}-h1-final-viz" style="margin-top: 16px; padding: 20px; border: 1px solid #8b5cf6; border-radius: 12px; background: #f5f3ff; overflow-x: auto;"></div>
    </div>

    <!-- ===== FFN SECTION ===== -->
    <div>
	<p style="color: #f59e0b; margin: 0 0 12px 0; font-size: 0.95rem;">
	    Feed-Forward Network:
	</p>
	<div id="${prefix}-step-1" class="math_transformer" style="overflow-anchor:none;"></div>
	<div id="${prefix}-step-2" class="math_transformer" style="overflow-anchor:none;"></div>
	<div id="${prefix}-step-3" class="math_transformer" style="overflow-anchor:none;"></div>
    </div>

    <!-- ===== MIGRATION PLOT (per-layer) ===== -->
    <div id="${prefix}-migration-container" style="margin-top: 24px;">
    </div>
    `;

	tabsWrapper.appendChild(contentDiv);
}

window.showUnifiedLayer = function(layerIdx) {
	window._activeUnifiedLayerIdx = layerIdx;

	const container = document.getElementById('ffn-equations-container');
	if (!container) return;

	// Hide all layer contents
	container.querySelectorAll('.unified-layer-tab-content').forEach(div => {
		div.style.display = 'none';
	});
	container.querySelectorAll('.unified-layer-tab-btn').forEach(btn => {
		btn.style.background = '#bfdbfe';
		btn.style.fontWeight = 'normal';
	});

	// Show selected layer
	const contentDiv = document.getElementById(`unified-layer-${layerIdx}-content`);
	if (contentDiv) {
		contentDiv.style.display = 'block';

		// Deferred FFN rendering
		if (contentDiv.dataset.ffnRendered === 'false' && contentDiv._deferredFFNData) {
			const d = contentDiv._deferredFFNData;
			const hash = _ffnContentHash(d.h1, d.normed_h1, d.out_L1, d.out_FFN, d.h2, d.gamma, d.beta);
			contentDiv._lastFFNHash = hash;
			_writeFFNContent(
				`unified-layer-${layerIdx}`,
				d.h1, d.normed_h1, d.W1, d.b1, d.out_L1,
				d.W2, d.b2, d.out_FFN, d.h2, d.gamma, d.beta, d.layerIndex,
				d.tokenStrings
			);
			contentDiv.dataset.ffnRendered = 'true';
		}
	}

	// Highlight active tab button
	const activeBtn = document.getElementById(`unified-layer-${layerIdx}-tab-btn`);
	if (activeBtn) {
		activeBtn.style.background = '#fff';
		activeBtn.style.fontWeight = 'bold';
	}

	// Trigger attention head rendering for this layer
	const registryEntry = attentionRenderRegistry.get('unified-attention-engine');
	if (registryEntry && registryEntry.instance) {
		const mhaRegistry = multiLayerAttentionRegistry.get('unified-attention-engine');
		if (mhaRegistry && mhaRegistry.layers[layerIdx]) {
			const attnSection = document.getElementById(`unified-layer-${layerIdx}-attention-heads`);
			if (attnSection && !attnSection.querySelector('.head-tab-list')) {
				registryEntry.instance.executeActualRender(registryEntry.headData, registryEntry.tokens);
			} else {
				registryEntry.instance._renderLayerContent(layerIdx);
			}
		}
	}

	// Trigger migration plot rendering for this layer
	const migrationId = `migration-layer-${layerIdx + 1}`;
	const migrationData = transformerLabVisMigrationDataRegistry.get(migrationId);
	if (migrationData && !migrationData.rendered) {
		const plotDiv = document.getElementById(migrationId);
		if (plotDiv) {
			render_migration_logic(
				migrationId,
				migrationData.tokens,
				migrationData.start_h,
				migrationData.end_h,
				migrationData.layerNum,
				migrationData.d_model,
				migrationData.h_after,
				migrationData.tokenStrings
			);
			migrationData.rendered = true;
		}
	}

	render_temml();
};

function ensureFFNLayerContainers(layerIndex) {
	// Delegate to the unified layer container system
	const { n_layers } = getTransformerConfig();
	ensureUnifiedLayerContainer(layerIndex, n_layers, 'mha-calculation-details');
}

// ============================================================
// Unified Sticky Bottom Bar
// Replaces the old training progress bar. Always visible when
// #transformer_site is in the viewport. Shows "Start Training"
// when idle, becomes the full training bar when training.
// ============================================================

(function () {
	let barEl = null;
	let siteIsVisible = false;
	let miniChartInited = false;

	/** Create the bar once and append to <body> */
	/** Create the bar once and append to <body> */
	function createStickyBar() {
		if (barEl) return barEl;

		barEl = buildStickyBarElement();
		document.body.appendChild(barEl);

		wireTrainButton();
		wireStopButton();
		wireButtonHoverEffects();

		return barEl;
	}

	/** Builds the root bar element with all inner HTML. */
	function buildStickyBarElement() {
		const el = document.createElement('div');
		el.id = 'training-progress-bar-container';
		el.style.cssText = buildBarRootStyles();
		el.innerHTML = buildIdlePanelHtml() + buildTrainingPanelHtml();
		return el;
	}

	/** Returns the CSS for the root sticky bar container. */
	function buildBarRootStyles() {
		return `
	position: fixed; bottom: 0; left: 0; width: 100%;
	background: #1e293b; color: #f8fafc;
	padding: 10px 20px; display: none; align-items: center;
	gap: 14px; z-index: 999;
	font-family: 'Inter', sans-serif; font-size: 0.85rem;
	box-shadow: 0 -2px 12px rgba(0,0,0,0.3);
	transition: opacity 0.25s ease, transform 0.25s ease;
	opacity: 0; transform: translateY(100%);
    `;
	}

	/** Returns the HTML for the idle-state sub-panel. */
	function buildIdlePanelHtml() {
		return `
	<div id="tlab-bar-idle" style="display:flex; align-items:center; gap:14px; width:100%;">
	    <span style="flex-grow:1; color:#94a3b8; font-size:0.82rem;">
		Transformer Lab — ready to train
	    </span>
	    <button id="tlab-bar-train-btn" style="${buildTrainButtonStyles()}">▶ Start Training</button>
	</div>
    `;
	}

	/** Returns inline styles for the idle-panel train button. */
	function buildTrainButtonStyles() {
		return `
	margin-right: 35px;
	background: linear-gradient(135deg, #3b82f6, #6366f1);
	color: white; border: none; padding: 8px 22px;
	border-radius: 8px; cursor: pointer; font-weight: 700;
	font-size: 0.85rem; white-space: nowrap;
	transition: background 0.15s, transform 0.1s;
	box-shadow: 0 2px 8px rgba(99,102,241,0.4);
    `;
	}

	/** Returns the HTML for the training-state sub-panel. */
	function buildTrainingPanelHtml() {
		return `
	<div id="tlab-bar-training" style="display:none; align-items:center; gap:14px; width:100%;">
	    ${buildMiniChartHtml()}
	    ${buildEpochLabelHtml()}
	    ${buildProgressTrackHtml()}
	    ${buildLossLabelHtml()}
	    ${buildEtaLabelHtml()}
	    ${buildStopButtonHtml()}
	</div>
    `;
	}

	/** Returns the HTML for the mini loss sparkline container. */
	function buildMiniChartHtml() {
		return `
	<div id="tlab-bar-mini-chart" style="
	    width: 120px; height: 36px; flex-shrink: 0;
	    background: #334155; border-radius: 6px; overflow: hidden;
	    position: relative;
	">
	    <canvas id="tlab-bar-mini-canvas" width="120" height="36"
		style="width:120px;height:36px;display:block;"></canvas>
	</div>
    `;
	}

	/** Returns the HTML for the epoch label span. */
	function buildEpochLabelHtml() {
		return `
	<span id="training-progress-label" style="white-space:nowrap; min-width:140px;">
	    Starting training...
	</span>
    `;
	}

	/** Returns the HTML for the progress bar track + fill + percent overlay. */
	function buildProgressTrackHtml() {
		return `
	<div style="flex-grow:1; background:#334155; border-radius:6px; height:18px; overflow:hidden; position:relative;">
	    <div id="training-progress-fill" style="
		width:0%; height:100%;
		background: linear-gradient(90deg, #3b82f6, #10b981);
		border-radius:6px; transition: width 0.15s ease;
	    "></div>
	    <span id="training-progress-percent" style="
		position:absolute; top:0; left:0; width:100%; height:100%;
		display:flex; align-items:center; justify-content:center;
		font-size:0.75rem; font-weight:600; color:#fff;
		text-shadow:0 1px 2px rgba(0,0,0,0.5); pointer-events:none;
	    ">0%</span>
	</div>
    `;
	}

	/** Returns the HTML for the loss display label. */
	function buildLossLabelHtml() {
		return `
	<span id="training-progress-loss" style="
	    white-space:nowrap; min-width:120px; text-align:right; color:#94a3b8;
	">Loss: —</span>
    `;
	}

	/** Returns the HTML for the ETA display label. */
	function buildEtaLabelHtml() {
		return `
	<span id="tlab-bar-eta" style="
	    white-space:nowrap; min-width:100px; text-align:right; color:#64748b;
	    font-size:0.78rem;
	">ETA: —</span>
    `;
	}

	/** Returns the HTML for the stop training button. */
	function buildStopButtonHtml() {
		return `
	<button id="tlab-bar-stop-btn" style="
	    background: #ef4444; color: white; border: none;
	    padding: 6px 16px; border-radius: 6px; cursor: pointer;
	    font-weight: 600; font-size: 0.82rem; white-space: nowrap;
	    margin-right: 50px; transition: background 0.15s;
	">⏹ Stop</button>
    `;
	}

	/** Wires the click handler on the idle-panel train button. */
	function wireTrainButton() {
		document.getElementById('tlab-bar-train-btn').addEventListener('click', () => {
			train_transformer();
		});
	}

	/** Wires the click handler on the training-panel stop button. */
	function wireStopButton() {
		document.getElementById('tlab-bar-stop-btn').addEventListener('click', () => {
			window.isTraining = false;
		});
	}

	/** Attaches hover scale/color effects to both action buttons. */
	function wireButtonHoverEffects() {
		const trainBtn = document.getElementById('tlab-bar-train-btn');
		trainBtn.addEventListener('mouseover', () => { trainBtn.style.transform = 'scale(1.04)'; });
		trainBtn.addEventListener('mouseout',  () => { trainBtn.style.transform = 'scale(1)'; });

		const stopBtn = document.getElementById('tlab-bar-stop-btn');
		stopBtn.addEventListener('mouseover', () => { stopBtn.style.background = '#dc2626'; });
		stopBtn.addEventListener('mouseout',  () => { stopBtn.style.background = '#ef4444'; });
	}


	/** Slide the bar into view */
	function showBar() {
		if (!barEl) createStickyBar();
		barEl.style.display = 'flex';
		void barEl.offsetHeight; // force reflow
		barEl.style.opacity = '1';
		barEl.style.transform = 'translateY(0)';
	}

	/** Slide the bar out of view */
	function hideBar() {
		if (!barEl) return;
		barEl.style.opacity = '0';
		barEl.style.transform = 'translateY(100%)';
		setTimeout(() => {
			if (barEl && barEl.style.opacity === '0') {
				barEl.style.display = 'none';
			}
		}, 260);
	}

	/** Switch between idle / training sub-panels */
	function syncBarMode() {
		if (!barEl) return;

		const idlePanel     = document.getElementById('tlab-bar-idle');
		const trainingPanel = document.getElementById('tlab-bar-training');
		const trainBtn      = document.getElementById('tlab-bar-train-btn');

		if (window.isTraining) {
			idlePanel.style.display     = 'none';
			trainingPanel.style.display = 'flex';
		} else {
			idlePanel.style.display     = 'flex';
			trainingPanel.style.display = 'none';

			// Sync disabled state with the main train button
			const mainBtn = document.querySelector('.train-btn');
			if (mainBtn && trainBtn) {
				trainBtn.disabled       = mainBtn.disabled;
				trainBtn.style.opacity  = mainBtn.disabled ? '0.45' : '1';
				trainBtn.style.cursor   = mainBtn.disabled ? 'not-allowed' : 'pointer';
			}
		}
	}

	/** Draw a tiny sparkline of the loss history */
	function drawMiniLossChart() {
		const canvas = document.getElementById('tlab-bar-mini-canvas');
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		const w = canvas.width;
		const h = canvas.height;
		const history = window.lossHistory;

		ctx.clearRect(0, 0, w, h);
		if (!history || history.length < 2) return;

		const maxLoss = Math.max(...history);
		const minLoss = Math.min(...history);
		const range = maxLoss - minLoss || 1;

		// Filled area
		ctx.beginPath();
		ctx.moveTo(0, h);
		for (let i = 0; i < history.length; i++) {
			const x = (i / (history.length - 1)) * w;
			const y = h - ((history[i] - minLoss) / range) * (h - 4) - 2;
			ctx.lineTo(x, y);
		}
		ctx.lineTo(w, h);
		ctx.closePath();
		ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
		ctx.fill();

		// Line
		ctx.beginPath();
		for (let i = 0; i < history.length; i++) {
			const x = (i / (history.length - 1)) * w;
			const y = h - ((history[i] - minLoss) / range) * (h - 4) - 2;
			if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
		}
		ctx.strokeStyle = '#10b981';
		ctx.lineWidth = 1.5;
		ctx.stroke();
	}

	// ---- Observe #transformer_site visibility ----

	function initSiteObserver() {
		const site = document.getElementById('transformer_site');
		if (!site) return;

		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				siteIsVisible = entry.isIntersecting;
				if (siteIsVisible) {
					showBar();
					syncBarMode();
				} else {
					hideBar();
				}
			});
		}, { threshold: 0 });

		observer.observe(site);
	}

	// ---- Public API (replaces old functions) ----

	window.showTrainingProgressBar = function () {
		if (!barEl) createStickyBar();
		window._trainingBarStartTime = performance.now();
		syncBarMode();
		if (siteIsVisible) showBar();
	};

	window.updateTrainingProgressBar = function (currentEpoch, totalEpochs, loss) {
		if (!barEl) createStickyBar();

		// Ensure training panel is showing
		syncBarMode();

		const fill    = document.getElementById('training-progress-fill');
		const label   = document.getElementById('training-progress-label');
		const percent = document.getElementById('training-progress-percent');
		const lossLbl = document.getElementById('training-progress-loss');
		const etaLbl  = document.getElementById('tlab-bar-eta');

		if (!fill || !label || !percent || !lossLbl) return;

		const pct = Math.min(100, (currentEpoch / totalEpochs) * 100);

		fill.style.width    = pct.toFixed(1) + '%';
		percent.textContent = pct.toFixed(1) + '%';
		label.textContent   = `Epoch ${currentEpoch} / ${totalEpochs}`;
		lossLbl.textContent = `Loss: ${loss.toFixed(6)}`;

		// ETA guesstimate
		if (etaLbl) {
			if (!window._trainingBarStartTime) {
				window._trainingBarStartTime = performance.now();
			}
			const elapsed = performance.now() - window._trainingBarStartTime;
			const avgPerEpoch = elapsed / currentEpoch;
			const remaining = (totalEpochs - currentEpoch) * avgPerEpoch;
			etaLbl.textContent = `ETA: ${formatETA(remaining)}`;
		}

		drawMiniLossChart();
	};

	window.hideTrainingProgressBar = function () {
		window._trainingBarStartTime = null;
		const etaLbl = document.getElementById('tlab-bar-eta');
		if (etaLbl) etaLbl.textContent = 'ETA: —';
		syncBarMode();
	};

	// Also patch updateTrainButtonState to keep the bar's button in sync
	const _origUpdateTrainButtonState = window.updateTrainButtonState;
	window.updateTrainButtonState = function () {
		if (typeof _origUpdateTrainButtonState === 'function') {
			_origUpdateTrainButtonState();
		}
		syncBarMode();
	};

	// ---- Initialize ----
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initSiteObserver);
	} else {
		initSiteObserver();
	}
})();

/**
 * Re-renders ONLY the final softmax/probability display when temperature changes.
 * Skips the entire forward pass since temperature only affects the
 * softmax(logits / T) step — the logits themselves don't change.
 */
function rerender_temperature_only() {
    const cached = window._cachedFinalProjection;
    if (!cached) {
        // Kein Cache vorhanden (z.B. erster Aufruf) → voller Durchlauf
        debounced_run_transformer_demo();
        return;
    }

    const temperature = parseFloat(
        document.getElementById('transformer-temperature')?.value
    ) || 1.0;

    render_final_projection(
        cached.h_final,
        cached.vocabulary,
        cached.d_model,
        temperature
    );
}

async function loadTransformerModule () {
	updateLoadingStatus("Loading section about transformers...");

	observer_vector_math();

	updateTrainButtonState();
	updateArchitectureValidityUI();
	run_transformer_demo()

	const inputElement = document.getElementById('transformer-master-token-input');
	inputElement.addEventListener('input', (event) => {
		debouncedRun('transformer-master-token-input');
	});

	return Promise.resolve();
}
