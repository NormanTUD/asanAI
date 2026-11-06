"use strict";

/*
If you see stuff jumping around, try setting "overflow-anchor: none" to that element.
*/

window._trajectoryVfEnabled = false;
window.tlabVisualizationMode = 'train';
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
const attentionRenderRegistry = new Map();
const positionalShiftRegistry = new Map();
const embeddingRenderRegistry = new Map();
const trajectoryRenderRegistry = new Map();
const multiLayerAttentionRegistry = new Map();
const transformerLabVisMigrationDataRegistry = new Map();
const positionalWavesRegistry = new Map();
window.tlab_trajectory_collector = null;
window._trajectoryVfEnabled = false;

const oldTrajWrapper = document.getElementById('transformer-trajectory-full-path-wrapper');
const oldTrajDiv = document.getElementById('transformer-trajectory-full-path');
if (oldTrajDiv) {
	const trajChart = echarts.getInstanceByDom(oldTrajDiv);
	if (trajChart) dispose(trajChart);
	if (oldTrajWrapper) {
		oldTrajWrapper.remove();
	} else {
		oldTrajDiv.remove();
	}
}

window.addEventListener('DOMContentLoaded', (event) => {
	document.getElementById("ifscalfactornotone").style.display =  posEmbedScalar == 1 ? 'none' : 'block'
	document.getElementById("posEmbedScaleFactor").innerHTML = posEmbedScalar;
});

window.persistentEmbeddingSpace = null;
window.currentWeights = null;
window.lossHistory = [];
window.last_d_model = null;

const vectorMathRenderRegistry = {
    lastRendered: false,
    needsUpdate: false,
    isInViewport: false,
    _lastResultHtml: null
};

function _defaultGrid3DConfig(overrides = {}) {
	return {
		viewControl: {
			projection: 'perspective', alpha: 30, beta: 40,
			distance: 200, autoRotate: false, damping: 0.9
		},
		light: {
			main: { intensity: 1.2, shadow: false },
			ambient: { intensity: 0.3 }
		},
		environment: themeColor('#f9fafb'),
		boxWidth: 100, boxHeight: 100, boxDepth: 100,
		...overrides
	};
}

function _resetParamBreakdownState(nrDiv, toggleDiv, chartDiv) {
	if (nrDiv) { nrDiv.innerHTML = ''; nrDiv.style.display = 'none'; }
	if (toggleDiv) toggleDiv.style.display = 'none';
	if (chartDiv) chartDiv.style.display = 'none';

	if (window._paramBreakdownOpen) {
		window._paramBreakdownOpen = false;
		window._paramBreakdownRendered = false;
		const btn = document.getElementById('param-breakdown-btn');
		if (btn) {
			btn.innerHTML = `<span id="param-breakdown-arrow" style="transition: transform 0.2s; transform: rotate(0deg);">▶</span> Show Parameter Breakdown`;
		}
		paramBreakdownObserver.unobserve(chartDiv);
	}
}

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

	const existing = registry.get(containerId);
	if (existing && window.isTraining) {
		// Merge new data into existing entry, preserving UI state
		Object.assign(existing, data);
		existing.rendered = false;
	} else {
		data.rendered = false;
		registry.set(containerId, data);
	}

	if (placeholder && !container.innerHTML) {
		container.innerHTML = placeholder;
	}
	observer.observe(container);

	if (!window.isTraining && isElementInViewport(container)) {
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

		if (el.tagName === 'DIV') {
			el.querySelectorAll('input,select,textarea,button').forEach(c => { c.disabled = lock; });
		} else {
			el.disabled = lock;
		}

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

function runSimpleForwardPass(tokens, weights, d_model, n_heads, n_layers, recordFinal) {
	if (n_layers === undefined) n_layers = weights.length;
	let h = embedTokensWithPE(tokens, d_model);

	// Provenance: record the final (inference) pass under the 'R:' namespace so
	// that h_last can be traced back through every layer to the input token.
	// Only the final prediction pass requests this; per-window prediction calls
	// must not overwrite those grids.
	if (recordFinal && window.Prov) {
		window.Prov.recordPre(tokens, d_model, window.persistentEmbeddingSpace, 'R:0');
	}

	for (let l = 0; l < n_layers; l++) {
		const w = weights[l];
		const h_in = h;
		const result = forwardOneLayer(h_in, w, d_model, n_heads, tokens, null);
		h = result.h_out;

		if (recordFinal && window.Prov) {
			// FFN sublayer internals — identical math to run_ffn_block()
			const gamma2 = w.gamma2 || new Array(d_model).fill(1.0);
			const beta2 = w.beta2 || new Array(d_model).fill(0.0);
			const norm2 = calculateLayerNorm(result.h_attn, gamma2, beta2);
			const outL1 = matMul(norm2, w.W1, w.b1).map(row => row.map(v => geluApprox(v)));
			const outFFN = matMul(outL1, w.W2, w.b2);

			window.Prov.recordLayer(l, {
				d_model, n_heads,
				h_in,
				norm: result.normH,
				gamma: w.gamma, beta: w.beta,
				Wo: w.attention.output,
				concat: result.concat,
				proj: result.projected,
				h1: result.h_attn,
				tokens,
				headData: result.headData,
				attention: w.attention
			}, 'R');

			window.Prov.recordFfn(l, {
				gamma2, beta2,
				norm2,
				W1: w.W1, b1: w.b1,
				outL1,
				W2: w.W2, b2: w.b2,
				outFFN,
				h2: result.h_out,
				h1: result.h_attn
			}, 'R');
		}
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

function erfApprox(x) {
	const sign = x < 0 ? -1 : 1;
	const ax = Math.abs(x);
	const t = 1 / (1 + 0.3275911 * ax);
	const poly = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
	return sign * poly;
}

function geluApprox(x) {
	return 0.5 * x * (1 + erfApprox(x / Math.SQRT2));
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

		// Provenance: record all intermediate values of the attention sublayer
		if (window.Prov) {
			window.Prov.recordLayer(ffnLayerIndex, {
				d_model, n_heads,
				h_in: h_current,
				norm: normH,
				gamma: layerWeights.gamma,
				beta: layerWeights.beta,
				Wo,
				concat,
				proj: projected,
				h1: h_attn,
				tokens: tokenStrings,
				headData,
				attention: layerWeights.attention
			});
		}
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

function _vmProtectInput(fn) {
    const inputEl = document.getElementById('transformer-vector-math-input');
    if (!inputEl) { fn(); return; }

    const savedValue    = inputEl.value;
    const savedSelStart = inputEl.selectionStart;
    const savedSelEnd   = inputEl.selectionEnd;
    const wasFocused    = (document.activeElement === inputEl);

    fn();

    // Restore if anything changed the input
    if (inputEl.value !== savedValue) {
        inputEl.value = savedValue;
    }
    if (wasFocused) {
        inputEl.focus({ preventScroll: true });
        try { inputEl.setSelectionRange(savedSelStart, savedSelEnd); }
        catch(e) {}
    }
}

function _vmUpdateResult(resDiv, html) {
    if (!resDiv) return;
    // Skip if content hasn't changed
    if (vectorMathRenderRegistry._lastResultHtml === html) return;
    vectorMathRenderRegistry._lastResultHtml = html;

    _vmProtectInput(() => {
        resDiv.innerHTML = html;

        // SCOPED math rendering — never global render_temml()
        try {
            if (typeof temml.renderMathInElement === 'function') {
                temml.renderMathInElement(resDiv, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$',  right: '$',  display: false}
                    ],
                    throwOnError: false,
                    annotate: true
                });
            }
        } catch(e) {}

        if (typeof ensureDisplayMathScrollable === 'function') {
            ensureDisplayMathScrollable(resDiv);
        }

        // Re-observe the result div (innerHTML killed the old observation)
        vectorMathObserver.observe(resDiv);
    });
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

function drawTrainingPlaceholder() {
	// The plot box is always mounted; draw a message instead of leaving it
	// empty, so the panel reads as "not started yet" rather than "broken".
	const box = document.getElementById('training-loss-plot');
	if (!box || typeof Plotly === 'undefined') return;
	const layout = {
		annotations: [{
			text: 'The training plot appears here<br>' +
				'<span style="font-size:0.82em">Press Train Model to start</span>',
			showarrow: false,
			x: 0.5, y: 0.5,
			xref: 'paper', yref: 'paper',
			xanchor: 'center', yanchor: 'middle', align: 'center',
			font: { size: 13, color: themeColor('#94a3b8') }
		}],
		margin: { t: 16, b: 16, l: 16, r: 16 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		dragmode: false,
		xaxis: { visible: false },
		yaxis: { visible: false },
	};
	try {
		Plotly.react(box, [], layout, { responsive: true, displayModeBar: false });
	} catch (e) { /* Plotly unavailable */ }
}

function reset_graph() {
	// The loss panel stays mounted at a fixed 200px so the page never shifts
	// during training. Use Plotly.purge so the next Plotly.react() call
	// re-creates the chart cleanly — clearing innerHTML alone leaves Plotly's
	// internal state referring to a chart whose DOM is gone, which renders
	// an empty box.
	const lp = document.getElementById('training-loss-plot');
	if (lp) {
		if (typeof Plotly !== 'undefined') {
			try { Plotly.purge(lp); } catch (e) { lp.innerHTML = ''; }
		} else {
			lp.innerHTML = '';
		}
	}
	drawTrainingPlaceholder();
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
		_resetParamBreakdownState(nrDiv, toggleDiv, chartDiv);
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
		_resetParamBreakdownState(nrDiv, toggleDiv, chartDiv);
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

function buildSunburstData(layerBreakdowns, embeddingParams, grandTotal, d_model, n_heads, d_ff) {
	const data = createEmptySunburstArrays();

	appendSunburstRoot(data, grandTotal);
	appendSunburstEmbeddings(data, embeddingParams);

	layerBreakdowns.forEach(lb => {
		appendSunburstLayer(data, lb, d_model, d_ff);
	});

	return data;
}

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

function appendSunburstRoot(data, grandTotal) {
	data.ids.push('total');
	data.labels.push(`Total: ${grandTotal.toLocaleString()}`);
	data.parents.push('');
	data.values.push(grandTotal);
	data.hoverTexts.push(`Total parameters: ${grandTotal.toLocaleString()}`);
	data.colors.push('#1e293b');
}

function appendSunburstEmbeddings(data, embeddingParams) {
	data.ids.push('embeddings');
	data.labels.push('Embeddings');
	data.parents.push('total');
	data.values.push(embeddingParams);
	data.hoverTexts.push(`Embedding table: ${embeddingParams.toLocaleString()} params<br>vocab × d_model`);
	data.colors.push(data.embColor);
}

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

function appendSunburstLeaf(data, id, label, parentId, value, hoverDesc, color) {
	data.ids.push(id);
	data.labels.push(label);
	data.parents.push(parentId);
	data.values.push(value);
	data.hoverTexts.push(`${label}: ${value.toLocaleString()} params<br>${hoverDesc}`);
	data.colors.push(color);
}

// ─── Plotly trace & layout construction ─────────────────────────────

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

function buildSunburstLayout() {
	return {
		title: { text: 'Parameter Distribution', font: { size: 14, color: '#1e293b' } },
		margin: { t: 40, b: 10, l: 10, r: 10 }
	};
}

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

function aggregateLayerTotals(layerBreakdowns) {
	let totalAttn = 0, totalFFN = 0, totalNorm = 0;
	layerBreakdowns.forEach(lb => {
		totalAttn += lb.attention.total;
		totalFFN += lb.ffn.total;
		totalNorm += lb.norm.total;
	});
	return { totalAttn, totalFFN, totalNorm };
}

function inferDModelFromBreakdowns(layerBreakdowns) {
	return layerBreakdowns.length > 0 ? (layerBreakdowns[0].norm.pre_attn / 2) : 0;
}

function buildParamTableHeader() {
	return `<table style="width:100%; border-collapse:collapse; font-family:'Inter',sans-serif; font-size:0.8rem;">
    <thead>
    <tr style="background:var(--mn-bg-subtle, #f1f5f9); border-bottom:2px solid var(--mn-border, #cbd5e1); color:var(--mn-text, #0f172a);">
	<th style="padding:6px 10px; text-align:left;">Component</th>
	<th style="padding:6px 10px; text-align:right;">Parameters</th>
	<th style="padding:6px 10px; text-align:right;">% of Total</th>
	<th style="padding:6px 10px; text-align:left;">Shape</th>
    </tr>
    </thead>
    <tbody>`;
}

function buildEmbeddingRow(embeddingParams, vocabSize, d_model, fmt, pct) {
	return `<tr style="background:color-mix(in srgb, var(--mn-accent) 10%, transparent); border-bottom:1px solid var(--mn-border, #e2e8f0);">
    <td style="padding:6px 10px; font-weight:600; color:var(--mn-accent);">Embeddings</td>
    <td style="padding:6px 10px; text-align:right; font-weight:600;">${fmt(embeddingParams)}</td>
    <td style="padding:6px 10px; text-align:right;">${pct(embeddingParams)}%</td>
    <td style="padding:6px 10px; color:var(--mn-text-muted);">${vocabSize} × ${d_model || '?'}</td>
    </tr>`;
}

function buildAllLayerRows(layerBreakdowns, fmt, pct) {
	return layerBreakdowns.map(lb => buildSingleLayerRows(lb, fmt, pct)).join('');
}

function buildSingleLayerRows(lb, fmt, pct) {
	let html = `<tr style="background:var(--mn-bg-subtle, #f8fafc); border-bottom:1px solid var(--mn-border, #f1f5f9); color:var(--mn-text, #0f172a);">
	<td style="padding:6px 10px; font-weight:600;" colspan="4">Layer ${lb.layer} — ${fmt(lb.total)} params (${pct(lb.total)}%)</td>
    </tr>`;

	html += buildLayerSubRow('Attention (Q+K+V+O)', '#3b82f6', lb.attention.total, '4 × (d×d)', fmt, pct);
	html += buildLayerSubRow('FFN (W₁+b₁+W₂+b₂)', '#f59e0b', lb.ffn.total, 'd×4d + 4d + 4d×d + d', fmt, pct);
	html += buildLayerSubRow('LayerNorm (γ+β ×2)', '#10b981', lb.norm.total, '4 × d', fmt, pct, 'border-bottom:1px solid var(--mn-border, #e2e8f0);');

	return html;
}

function buildLayerSubRow(label, color, total, shape, fmt, pct, extraStyle = 'border-bottom:1px solid var(--mn-border, #f1f5f9);') {
	return `<tr style="${extraStyle}">
	<td style="padding:4px 10px 4px 30px; color:${color};">${label}</td>
	<td style="padding:4px 10px; text-align:right;">${fmt(total)}</td>
	<td style="padding:4px 10px; text-align:right;">${pct(total)}%</td>
	<td style="padding:4px 10px; color:var(--mn-text-muted);">${shape}</td>
    </tr>`;
}

function buildTotalRow(grandTotal, totalAttn, totalFFN, fmt, pct) {
	const attnVsFFN = totalAttn > 0 ? (totalFFN / totalAttn).toFixed(1) : '—';
	return `<tr style="background:color-mix(in srgb, var(--mn-emerald) 12%, transparent); border-top:2px solid var(--mn-emerald); font-weight:700;">
    <td style="padding:8px 10px;">Total</td>
    <td style="padding:8px 10px; text-align:right;">${fmt(grandTotal)}</td>
    <td style="padding:8px 10px; text-align:right;">100%</td>
    <td style="padding:8px 10px; color:var(--mn-emerald); font-weight:normal; font-size:0.75rem;">
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
        { bg: '#bfdbfe' }, { bg: themeColor('#fff') }
    );

    const registryEntry = attentionRenderRegistry.get(containerId);
    if (registryEntry && registryEntry.instance) {
        registryEntry.instance._renderLayerContent(layerIdx);
    }

    const heatmaps = activeContent?.querySelectorAll('[id^="attn-heatmap-"]');
    if (heatmaps) heatmaps.forEach(hm => { try { Plotly.Plots.resize(hm); } catch(e) {} });

    // SCOPED, not global
    if (activeContent) _renderTemmlOnElements([activeContent]);
};


window.showHeadInLayer = (containerId, layerIdx, headIdx, numHeads) => {
    const activeContent = switchTab(`${containerId}-${layerIdx}`, headIdx, numHeads,
        { content: 'head-content', btn: 'head-tab-btn' },
        { bg: '#e2e8f0' }, { bg: themeColor('#fff') }
    );

    const registryEntry = attentionRenderRegistry.get(containerId);
    if (registryEntry && registryEntry.instance) {
        registryEntry.instance._renderHeadContent(layerIdx, headIdx);
    }

    const heatmapDiv = activeContent?.querySelector('[id^="attn-heatmap-"]');
    if (heatmapDiv) { try { Plotly.Plots.resize(heatmapDiv); } catch(e) {} }

    // SCOPED, not global
    if (activeContent) _renderTemmlOnElements([activeContent]);
};

function calculate_positional_injection(tokens, d_model) {
	const injectedEncodings = computeInjectedEncodings(tokens, d_model);
	renderPositionalInjectionHtml(tokens, injectedEncodings, d_model);
	return injectedEncodings;
}

function computeInjectedEncodings(tokens, d_model) {
	const roundedSpace = {};
	tokens.forEach(t => {
		const vec = window.persistentEmbeddingSpace?.[t];
		roundedSpace[t] = vec
			? vec.map(v => parseFloat(v.toFixed(nr_fixed)))
			: new Array(d_model).fill(0);
	});
	return embedTokensWithPE(tokens, d_model, roundedSpace);
}

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

function buildInjectionRowHtml(token, pos, semanticVec, peVec, combined) {
    const displaySemantic = semanticVec.map(v => v.toFixed(nr_fixed));
    const displayPE = peVec.map(v => v.toFixed(nr_fixed));
    const displayCombined = combined.map(v => v.toFixed(nr_fixed));
    const dispToken = displayToken(token);

    return `
    <div style="margin-bottom: 10px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; background: ${themeColor('#fff')}; overflow: auto;">
        <strong>Pos ${pos}: ${escapeHtml(dispToken)}</strong>
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
        PlotState.loadingMarkup('Waiting for Positional Waves plot to load...')
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

	tokens.forEach((token, pos) => {
		traces.push({
			x: [pos], y: [0], mode: 'markers+text',
			text: [displayToken(token)], textposition: 'top center',
			textfont: { color: themeColor('#1e293b'), size: 12 },
			marker: { size: 12, color: '#3b82f6' },
			name: `Pos ${pos}: ${displayToken(token)}`, showlegend: false
		});
	});

	const axisTitleFont = { size: 12, color: themeColor('#64748b') };
	const tickFont = { size: 11, color: themeColor('#64748b') };

	const layout = {
		title: {
			text: 'Sinusoidal Positional Waves',
			font: { size: 16, color: themeColor('#1e293b') }
		},
		margin: { t: 50, b: 50, l: 50, r: 20 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		font: { color: themeColor('#475569') },
		xaxis: {
			title: { text: 'Token Position', font: axisTitleFont },
			gridcolor: themeColor('#f1f5f9'),
			zerolinecolor: themeColor('#e2e8f0'),
			tickfont: tickFont
		},
		yaxis: {
			title: { text: 'PE Value', font: axisTitleFont },
			range: [-1.1, 1.1],
			gridcolor: themeColor('#f1f5f9'),
			zerolinecolor: themeColor('#e2e8f0'),
			tickfont: tickFont
		},
		hoverlabel: { bgcolor: themeColor('#1e293b'), font: { color: themeColor('#f8fafc'), size: 12 } }
	};

	Plotly.react(containerId, traces, layout);
}

function run_transformer_demo(activeId = null) {
	const trainingInput = document.getElementById('transformer-training-data');
	const masterInput = document.getElementById('transformer-master-token-input');

	if (!trainingInput || !masterInput) return;

	// 1. Tokenize both for logic
	const trainingTokens = transformer_tokenize_render(trainingInput.value, null);
	// The inference prompt has no EOS: the next token is predicted from the
	// last real prompt token, not from a marker the model never saw as input.
	const masterTokens = transformer_tokenize_render(masterInput.value, null, false);

	// 2. BPE visualization: respect the toggle mode
	const vizMode = window.tlabVisualizationMode || 'train';
	const vizSourceValue = (vizMode === 'inference')
		? masterInput.value
		: trainingInput.value;
	const vizTokens = transformer_tokenize_render(vizSourceValue, "transformer-viz-bpe", vizMode !== 'inference');

	// 3. Run the network
	run_and_visualize_network(vizTokens, trainingTokens, masterTokens);

	show_nr_of_params();

	// TDA live: keep a "current state" snapshot even when not training
	if (window.TDALive && !window.isTraining) {
		const { d_model, n_layers, n_heads } = getTransformerConfig();
		const trainTokens = transformer_tokenize_render(trainingInput.value, null);
		window.TDALive.captureEpoch({
			epoch: -1,
			tokens: trainTokens,
			d_model, n_layers, n_heads,
			weights: window.currentWeights,
			prevWeights: null,
			loss: null
		});
	}

	// Keep the address bar in sync with the current run (cheap + debounced).
	if (typeof scheduleRunUrlSync === 'function') scheduleRunUrlSync();

	// Keep the Probability Flow residual-write chart in step with the new
	// weights/token position (the river itself may already be rendered).
	if (typeof _themeriver_render_residual_contrib === 'function' &&
		document.getElementById('transformer-residual-contrib-plot')) {
		const tokenSel = document.getElementById('themeriver-token-select');
		const tokenIdx = tokenSel ? (parseInt(tokenSel.value) || 0) : 0;
		_themeriver_render_residual_contrib(tokenIdx, getTransformerConfig().d_model);
	}
	if (typeof _themeriver_render_residual_3d === 'function' &&
		document.getElementById('transformer-residual-stream-3d')) {
		_themeriver_render_residual_3d();
	}
}

/* ── TransformerRun: one shareable snapshot of the current experiment ──
   Prompt + architecture + training settings live in many controls; this
   unifies them in the URL so a reader can copy a link to the exact run. */
const TRANSFORMER_RUN_KEYS = ['d', 'h', 'n', 'c', 't', 'train', 'prompt', 'epochs', 'lr', 'opt'];
let _runUrlTimer = null;
let _lastRunUrl = null;

function collectTransformerRun() {
	const cfg = getTransformerConfig();
	const val = (id) => document.getElementById(id);
	const ctx = val('transformer-context-size');
	const train = val('transformer-training-data');
	const prompt = val('transformer-master-token-input');
	const epochs = val('train-epochs');
	const lr = val('train-lr');
	const opt = document.querySelector('input[name="train-optimizer-choice"]:checked');
	return {
		d: cfg.d_model,
		h: cfg.n_heads,
		n: cfg.n_layers,
		c: ctx ? parseInt(ctx.value) : undefined,
		t: cfg.temperature,
		train: train ? train.value : undefined,
		prompt: prompt ? prompt.value : undefined,
		epochs: epochs ? parseInt(epochs.value) : undefined,
		lr: lr ? parseFloat(lr.value) : undefined,
		opt: opt ? opt.value : undefined
	};
}

function _runNum(params, key) {
	if (!params.has(key)) return undefined;
	const v = Number(params.get(key));
	return Number.isFinite(v) ? v : undefined;
}

function transformerRunFromURL() {
	const params = new URLSearchParams(location.search);
	if (!TRANSFORMER_RUN_KEYS.some((k) => params.has(k))) return null;
	return {
		d: _runNum(params, 'd'),
		h: _runNum(params, 'h'),
		n: _runNum(params, 'n'),
		c: _runNum(params, 'c'),
		t: _runNum(params, 't'),
		train: params.has('train') ? params.get('train') : undefined,
		prompt: params.has('prompt') ? params.get('prompt') : undefined,
		epochs: _runNum(params, 'epochs'),
		lr: _runNum(params, 'lr'),
		opt: params.get('opt') || undefined
	};
}

function applyTransformerRun(cfg) {
	if (!cfg) return;
	const setVal = (id, v) => {
		if (v === undefined || v === null) return;
		const el = document.getElementById(id);
		if (el) el.value = String(v);
	};
	setVal('transformer-dimension-model', cfg.d);
	setVal('transformer-heads', cfg.h);
	setVal('transformer-depth', cfg.n);
	setVal('transformer-context-size', cfg.c);
	setVal('transformer-temperature', cfg.t);
	setVal('train-epochs', cfg.epochs);
	setVal('train-lr', cfg.lr);
	if (typeof cfg.train === 'string') {
		const trainEl = document.getElementById('transformer-training-data');
		if (trainEl) trainEl.value = cfg.train;
	}
	if (typeof cfg.prompt === 'string') {
		const promptEl = document.getElementById('transformer-master-token-input');
		if (promptEl) promptEl.value = cfg.prompt;
	}
	if (cfg.opt) {
		const radio = document.querySelector('input[name="train-optimizer-choice"][value="' + cfg.opt + '"]');
		if (radio) radio.checked = true;
	}
	const label = (id, v) => {
		if (v === undefined) return;
		const el = document.getElementById(id);
		if (el) el.innerText = String(v);
	};
	label('dim-val', cfg.d);
	label('heads-val', cfg.h);
	label('depth-val', cfg.n);
	label('context-val', cfg.c);
	label('temp-val', cfg.t);
	if (typeof render_token_picker_chips === 'function') render_token_picker_chips();
	if (typeof updateArchitectureValidityUI === 'function') updateArchitectureValidityUI();
}

function transformerRunParams() {
	const cfg = collectTransformerRun();
	const params = new URLSearchParams(location.search);
	TRANSFORMER_RUN_KEYS.forEach((k) => params.delete(k));
	const put = (k, v) => {
		if (v === undefined || v === null || v === '' || Number.isNaN(v)) return;
		params.set(k, String(v));
	};
	put('d', cfg.d);
	put('h', cfg.h);
	put('n', cfg.n);
	put('c', cfg.c);
	put('t', cfg.t);
	put('epochs', cfg.epochs);
	put('lr', cfg.lr);
	put('opt', cfg.opt);
	put('train', cfg.train);
	put('prompt', cfg.prompt);
	return params;
}

function scheduleRunUrlSync() {
	if (_runUrlTimer) clearTimeout(_runUrlTimer);
	_runUrlTimer = setTimeout(() => {
		_runUrlTimer = null;
		const qs = transformerRunParams().toString();
		if (qs === _lastRunUrl) return;
		_lastRunUrl = qs;
		try {
			history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
		} catch (e) { /* history unavailable */ }
	}, 300);
}

function bindTransformerRunURL() {
	const root = document.getElementById('transformer_site');
	if (!root || root._runUrlBound) return;
	root._runUrlBound = true;
	const onChange = (e) => {
		const t = e.target;
		if (!t || !t.closest) return;
		if (t.closest('#transformer_config, #transformer-train-card, #transformer-training-data')) {
			scheduleRunUrlSync();
		}
	};
	root.addEventListener('input', onChange);
	root.addEventListener('change', onChange);
}

function scrollToRunStep(attempt) {
	attempt = attempt || 0;
	const step = new URLSearchParams(location.search).get('step');
	if (!step) return;
	const target = document.getElementById('step-' + step);
	if (!target) return;
	target.scrollIntoView({ behavior: 'auto', block: 'start' });
	// The loader / resume banner can move the page after this runs; retry
	// briefly until the section actually sits at the top.
	if (attempt < 2 && Math.abs(target.getBoundingClientRect().top) > 8) {
		setTimeout(() => scrollToRunStep(attempt + 1), 700);
	}
}

window.TransformerRun = {
	snapshot: collectTransformerRun,
	apply: applyTransformerRun,
	fromURL: transformerRunFromURL,
	toURL: () => location.origin + location.pathname + '?' + transformerRunParams().toString(),
	share: function (btn) {
		const url = this.toURL();
		const done = () => {
			if (!btn) return;
			const old = btn.textContent;
			btn.textContent = 'Link copied';
			setTimeout(() => { btn.textContent = old; }, 1600);
		};
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(url).then(done).catch(done);
		} else {
			done();
		}
	}
};

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
	if (window.TDALive) window.TDALive.beginSession();

	return {
		lr:       parseFloat(document.getElementById('train-lr').value) || 0.05,
		epochs:   parseInt(document.getElementById('train-epochs').value) || 500,
		optType:  (document.querySelector('input[name="train-optimizer-choice"]:checked') || {}).value || 'adam',
	};
}

function createOptimizer(optType, lr) {
	if (optType === 'adam')    return tf.train.adam(lr);
	if (optType === 'rmsprop') return tf.train.rmsprop(lr);
	return tf.train.sgd(lr);
}

function computeAndApplyGradients(tokens, weightVars, d_model, n_layers, n_heads, allVars, optimizer, clipValue) {
	const { value: cost, grads } = tf.variableGrads(
		() => tidy(() => calculate_tf_loss(tokens, weightVars, d_model, n_layers, n_heads)),
		allVars
	);

	const clippedGrads = {};
	for (const name in grads) {
		clippedGrads[name] = tf.clipByValue(grads[name], -clipValue, clipValue);
	}
	optimizer.applyGradients(clippedGrads);

	for (const name in grads) {
		dispose(grads[name]);
		dispose(clippedGrads[name]);
	}

	return cost;
}

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

function disposeWeightVars(weightVars) {
	if (!weightVars) return;
	weightVars.layers.forEach(layer => {
		dispose(layer.wq);
		dispose(layer.wk);
		dispose(layer.wv);
		dispose(layer.wo);
		dispose(layer.gamma);
		dispose(layer.beta);
		dispose(layer.gamma2);
		dispose(layer.beta2);
		dispose(layer.w1);
		dispose(layer.b1);
		dispose(layer.w2);
		dispose(layer.b2);
	});
	dispose(weightVars.embeddings);
}

function finalizeTrainingSession(btn, status, completedAll) {
	window.isTraining = false;
	lockArchitectureControls(false);  // ← ADD THIS LINE
	btn.classList.remove('active');
	btn.innerText = 'Train Model';
	status.innerText += completedAll ? " Training Complete!" : " Training Stopped.";
	hideTrainingProgressBar();
	if (window.TDALive) window.TDALive.endSession();
	if (typeof render_token_picker === 'function') render_token_picker();
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

	// Training is CPU-heavy; the expensive visual rebuild is throttled so the
	// page keeps responding to hover/scroll/slider input while it runs.
	const VISUAL_INTERVAL_MS = 150;
	let lastVisualSync = 0;

	for (let i = 0; i < epochs; i++) {
		if (!window.isTraining) { completedAll = false; break; }
		const isLast = (i === epochs - 1);
		const doVisualSync = isLast || (performance.now() - lastVisualSync >= VISUAL_INTERVAL_MS);
		await runSingleEpoch(i, epochs, tokens, weightVars, allVars, optimizer, d_model, n_layers, n_heads, status, startTime, doVisualSync);
		if (doVisualSync) lastVisualSync = performance.now();
		// Yield a frame even when the visual sync was skipped.
		await tf.nextFrame();
	}

	// Sync final weights back to JS arrays BEFORE disposing
	window.currentWeights = await convert_tensors_to_weights(weightVars);

	// NOW dispose all tf.variables
	disposeWeightVars(weightVars);

	// Also dispose the optimizer's internal state
	dispose(optimizer);

	// Reflect the final (or last stopped) state once the tensors are gone.
	run_transformer_demo();

	finalizeTrainingSession(btn, status, completedAll);
}

function getTrainingTokens() {
	const trainingData = document.getElementById('transformer-training-data').value;
	return transformer_tokenize_render(trainingData, null);
}

function ensureWeightsAndEmbeddings(tokens, n_layers, d_model) {
	if (!window.currentWeights) {
		window.currentWeights = get_init_weights(n_layers, d_model);
	}
	get_or_init_embeddings(tokens, d_model);
}

async function runSingleEpoch(epochIdx, totalEpochs, tokens, weightVars, allVars, optimizer, d_model, n_layers, n_heads, status, startTime, doVisualSync = true) {
	const clipValue = 1.0;
	const thisContextSize = Math.min(getContextSize(), tokens.length - 1);

	// TDA live: snapshot the weights BEFORE the gradient step so we can
	// compute the weight deltas (W_new - W_prev) for this epoch.
	const tdaPrevWeights = (doVisualSync && window.TDALive && window.currentWeights)
		? JSON.parse(JSON.stringify(window.currentWeights))
		: null;

	// Gradient step
	const cost = computeAndApplyGradients(
		tokens, weightVars, d_model, n_layers, n_heads, allVars, optimizer, clipValue
	);

	const lossValue = await cost.data();
	window.lossHistory.push(lossValue[0]);

	// Progress & ETA
	updateEpochProgress(epochIdx, totalEpochs, lossValue[0], startTime, status);

	if (doVisualSync) {
		// Sync state
		await syncTrainingState(weightVars);

		// TDA live: capture residual stream + weight deltas for this epoch
		if (window.TDALive) {
			window.TDALive.captureEpoch({
				epoch: epochIdx,
				tokens,
				d_model, n_layers, n_heads,
				weights: window.currentWeights,
				prevWeights: tdaPrevWeights,
				loss: lossValue[0]
			});
		}
	}

	dispose(cost);
}

function updateEpochProgress(epochIdx, totalEpochs, loss, startTime, status) {
	updateTrainingProgressBar(epochIdx + 1, totalEpochs, loss);

	const elapsed         = performance.now() - startTime;
	const avgTimePerEpoch = elapsed / (epochIdx + 1);
	const etaMs           = (totalEpochs - (epochIdx + 1)) * avgTimePerEpoch;
	status.innerText = `Epoch ${epochIdx + 1}: Loss = ${loss.toFixed(6)} | ETA: ${formatETA(etaMs)}`;
}

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
			wq: tf.variable(tensor2d(layer.attention.query)),
			wk: tf.variable(tensor2d(layer.attention.key)),
			wv: tf.variable(tensor2d(layer.attention.value)),
			wo: tf.variable(tensor2d(layer.attention.output)),

			// Layer Norm 1 Parameters
			gamma: tf.variable(tensor1d(layer.gamma)),
			beta: tf.variable(tensor1d(layer.beta)),

			// Layer Norm 2 Parameters (NEW)
			gamma2: tf.variable(tensor1d(layer.gamma2 || new Array(layer.gamma.length).fill(1.0))),
			beta2: tf.variable(tensor1d(layer.beta2 || new Array(layer.beta.length).fill(0.0))),

			// FFN Weights
			w1: tf.variable(tensor2d(layer.W1)),
			b1: tf.variable(tensor1d(layer.b1)),
			w2: tf.variable(tensor2d(layer.W2)),
			b2: tf.variable(tensor1d(layer.b2))
		})),
		embeddings: tf.variable(tensor2d(embMatrix)),
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
		return scalar(100);
	}

	const mask = buildCausalMask(thiscontextSize);
	const losses = collectWindowLosses(tokens, vars, d_model, n_layers, n_heads, d_k, thiscontextSize, mask);

	dispose(mask);

	if (losses.length === 0) return scalar(10);
	return addN(losses).div(scalar(losses.length));
}

function buildCausalMask(contextSize) {
	return tidy(() => {
		const ones = tf.ones([contextSize, contextSize]);
		const upperTriangle = tf.linalg.bandPart(ones, 0, -1);
		const diagonal = tf.linalg.bandPart(ones, 0, 0);
		return tf.sub(upperTriangle, diagonal).mul(scalar(1e9));
	});
}

function collectWindowLosses(tokens, vars, d_model, n_layers, n_heads, d_k, contextSize, mask) {
	const losses = [];

	for (let startIdx = 0; startIdx < tokens.length - contextSize; startIdx++) {
		const loss = tidy(() => {
			const inputIds  = mapTokensToIds(tokens, startIdx, contextSize, vars.vocab_map);
			const targetIds = mapTokensToIds(tokens, startIdx + 1, contextSize, vars.vocab_map);

			let x = embedAndEncodePositions(inputIds, vars.embeddings, d_model);

			x = applyTransformerLayers(x, vars.layers, n_layers, n_heads, d_k, contextSize, d_model, mask);

			const logits = tf.matMul(x, vars.embeddings.transpose());
			const labels = tf.oneHot(tensor1d(targetIds, 'int32'), vars.vocab_map.length);
			return tf.losses.softmaxCrossEntropy(labels, logits);
		});

		losses.push(loss);
	}

	return losses;
}

function mapTokensToIds(tokens, startIdx, contextSize, vocabMap) {
	return tokens.slice(startIdx, startIdx + contextSize)
		.map(t => vocabMap.indexOf(t));
}

function embedAndEncodePositions(inputIds, embeddingsTensor, d_model) {
	let x = tf.gather(embeddingsTensor, tensor1d(inputIds, 'int32'));

	const peTensor = tidy(() => {
		const pos = tf.range(0, inputIds.length, 1).reshape([inputIds.length, 1]);
		const i = tf.range(0, d_model, 1).reshape([1, d_model]);
		const divTerm = tf.pow(
			scalar(10000),
			i.div(scalar(2)).floor().mul(scalar(2)).div(scalar(d_model))
		);
		const args = pos.div(divTerm);
		return tf.where(
			i.mod(scalar(2)).equal(scalar(0)),
			tf.sin(args),
			tf.cos(args)
		).mul(scalar(posEmbedScalar));
	});

	return add(x, peTensor);
}

function applyTransformerLayers(x, layers, n_layers, n_heads, d_k, contextSize, d_model, mask) {
	for (let i = 0; i < n_layers; i++) {
		x = applySingleTransformerLayer(x, layers[i], n_heads, d_k, contextSize, d_model, mask);
	}
	return x;
}

function applySingleTransformerLayer(x, layer, n_heads, d_k, contextSize, d_model, mask) {
	// Pre-LN + Multi-Head Attention
	const normX = tf_layer_norm(x, layer.gamma, layer.beta);
	const attnOutput = computeTfMultiHeadAttention(normX, layer, n_heads, d_k, contextSize, d_model, mask);
	x = add(x, attnOutput);

	// Pre-LN + FFN
	const normX2 = tf_layer_norm(x, layer.gamma2, layer.beta2);
	let ffn = tf_gelu(add(tf.matMul(normX2, layer.w1), layer.b1));
	ffn = add(tf.matMul(ffn, layer.w2), layer.b2);
	return add(x, ffn);
}

function computeTfMultiHeadAttention(normX, layer, n_heads, d_k, contextSize, d_model, mask) {
	const q = tf.matMul(normX, layer.wq);
	const k = tf.matMul(normX, layer.wk);
	const v = tf.matMul(normX, layer.wv);

	const qHeads = q.reshape([contextSize, n_heads, d_k]).transpose([1, 0, 2]);
	const kHeads = k.reshape([contextSize, n_heads, d_k]).transpose([1, 0, 2]);
	const vHeads = v.reshape([contextSize, n_heads, d_k]).transpose([1, 0, 2]);

	let scores = tf.matMul(qHeads, kHeads.transpose([0, 2, 1]))
		.div(tf.sqrt(scalar(d_k)));

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

function renderLossGraph() {
	if (!window.lossHistory || window.lossHistory.length === 0) {
		drawTrainingPlaceholder();
		return;
	}

	const lineColor = themeColor('#10b981');
	const trace = {
		x: Array.from({length: window.lossHistory.length}, (_, i) => i),
		y: window.lossHistory,
		type: 'scatter',
		mode: 'lines',
		line: { color: lineColor, width: 2 }
	};

	const axisTitleFont = { size: 11, color: themeColor('#64748b') };
	const tickFont = { size: 11, color: themeColor('#64748b') };

	const layout = {
		title: { text: 'Training Loss', font: { size: 12, color: themeColor('#1e293b') } },
		margin: { t: 30, b: 30, l: 40, r: 10 },
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
		dragmode: false,
		font: { color: themeColor('#475569') },
		xaxis: {
			title: { text: 'Total Epochs', font: axisTitleFont },
			gridcolor: themeColor('#f1f5f9'),
			zerolinecolor: themeColor('#e2e8f0'),
			tickfont: tickFont
		},
		yaxis: {
			title: { text: 'Loss', font: axisTitleFont },
			gridcolor: themeColor('#f1f5f9'),
			zerolinecolor: themeColor('#e2e8f0'),
			tickfont: tickFont
		},
		hoverlabel: { bgcolor: themeColor('#1e293b'), font: { color: themeColor('#f8fafc'), size: 12 } }
	};

	// Loss panel is always mounted at a fixed height; just render into it.
	Plotly.react('training-loss-plot', [trace], layout, { responsive: true, displayModeBar: false });
}

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
				if (chart) dispose(chart);
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
					if (chart) dispose(chart);
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
			if (trajChart) dispose(trajChart);
			oldTrajDiv.remove();
		}
		trajectoryRenderRegistry.delete('transformer-trajectory-full-path');
	}

	const themeRiverDiv = document.getElementById('transformer-themeriver-plot');
	if (themeRiverDiv) {
		const trChart = echarts.getInstanceByDom(themeRiverDiv);
		if (trChart) dispose(trChart);
	}
	const themeRiverWrapper = document.getElementById('themeriver-wrapper');
	if (themeRiverWrapper) themeRiverWrapper.remove();
	themeRiverRegistry.clear();

	return needsReinit;
}

function renderPreAttentionVisualizations(knownTokens, trainingTokens, d_model, n_heads, n_layers, temperature) {
	window.persistentEmbeddingSpace = get_or_init_embeddings(trainingTokens, d_model);
	render_token_picker();
	render_embedding_plot(d_model);
	tled_initEditor();

	calculate_positional_injection(knownTokens, d_model);
	render_positional_waves(d_model, knownTokens);

	const h0 = render_positional_shift_plot(knownTokens, d_model);

	return h0;
}

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

	themeRiverRegistry.forEach((val) => { val.rendered = false; });
}

function runVisualizedLayer0(h0, tokensWithPositional, knownTokens, weights, d_model, n_heads) {
	const layer = weights[0];
	const normH0 = calculateLayerNorm(h0, layer.gamma, layer.beta);
	const headData = causalMultiHeadAttention(normH0, layer.attention, d_model, n_heads);
	const virtualContainerId = "unified-attention-engine";
	const engine = new AttentionEngine({ d_model, n_heads, containerId: virtualContainerId, weights: layer.attention });
	engine.forward(normH0, tokensWithPositional, knownTokens);
	const regEntry = attentionRenderRegistry.get(virtualContainerId);
	if (regEntry) { regEntry.headData = headData; regEntry.rendered = false; }
	const multiHeadOutput = h0.map((_, tIdx) => [].concat(...headData.map(hd => hd.context[tIdx])));
	const Wo_layer0 = layer.attention.output;
	const projected = matMul(multiHeadOutput, Wo_layer0);
	const h1 = matAdd(h0, projected);
	const h2 = run_ffn_block(h1, layer, true, 0, knownTokens);
	if (window.Prov) window.Prov.recordLayer(0, {
		d_model, n_heads,
		h_in: h0,
		norm: normH0,
		gamma: layer.gamma,
		beta: layer.beta,
		Wo: Wo_layer0,
		concat: multiHeadOutput,
		proj: projected,
		h1,
		tokens: knownTokens,
		headData,
		attention: layer.attention
	});
	if (!window.__tmLayerTrace) window.__tmLayerTrace = [];
	window.__tmLayerTrace[0] = { h_in: h0, h_attn: h1, h_out: h2, headData, tokenStrings: knownTokens, normH: normH0, concat: multiHeadOutput, projected, Wo: Wo_layer0, gamma: layer.gamma, beta: layer.beta, ffn: (window.__tmFFNTrace || [])[0] };
	ensureFFNLayerContainers(0);
	return h2;
}

function _h1NamingForLayer(layerIndex) {
	const L = layerIndex + 1;
	const sup = `^{(${L})}`;
	const base = layerIndex * 2;
	const hInName = `h_{${base}}`;
	const hOutName = `h_{${base + 1}}`;
	const hInStage = layerIndex === 0
		? 'emb. + PE'
		: `out layer ${layerIndex}`;
	return { L, sup, hInName, hOutName, hInStage };
}

function buildH1NormHtmlForLayer(h0, normH0, gamma, beta, ts, naming) {
	const { sup, hInName, hInStage } = naming;

	return `
    <p style="font-weight:bold; color:#065f46;">Pre-Layer Normalization (applied <em>before</em> the sublayer)</p>

    <div style="margin-bottom:15px;">
    <p style="font-size:0.85rem; color:#1e40af;">1. Normalize $${hInName}${sup}$ before attention:</p>
    $$ \\text{LayerNorm}(\\underbrace{${hInName}${sup}}_{\\text{${hInStage}}}) = \\underbrace{\\gamma${sup}}_{\\substack{\\text{Learnable} \\\\ \\text{Scale Parameter}}} \\underbrace{\\odot}_{\\substack{\\text{Hadamard} \\\\ \\text{Product}}} \\frac{\\underbrace{${hInName}${sup}}_{\\text{${hInStage}}} - \\underbrace{\\mu}_{\\text{Mean of } ${hInName}${sup}}}{\\sqrt{\\underbrace{\\sigma^2}_{\\text{Variance of } ${hInName}${sup}} + \\underbrace{\\epsilon}_{${epsilon}}}} + \\underbrace{\\beta${sup}}_{\\substack{\\text{Learnable} \\\\ \\text{Shift Parameter}}} $$
    <div style="overflow-x:auto; padding-bottom: 10px">
    $$ \\underbrace{${matrixToPmatrixLabeled(normH0, ts, 'after LN')}}_{\\text{LayerNorm}\\left(${hInName}${sup}\\right)} = \\text{LayerNorm}\\!\\left(\\underbrace{${matrixToPmatrixLabeled(h0, ts, hInStage)}}_{${hInName}${sup}},\\; \\underbrace{${vecToPmatrix(gamma)}}_{\\gamma${sup}},\\; \\underbrace{${vecToPmatrix(beta)}}_{\\beta${sup}}\\right) $$
    <br>
    </div>
    </div>
    `;
}

function buildH1FinalHtmlForLayer(h0, projectedMHA, multiHeadOutput, h1, WO, ts, naming) {
	const { sup, hInName, hOutName, hInStage } = naming;

	return `
    <div style="margin-bottom:15px;">
    <p style="font-size:0.85rem; color:#1e40af;">2. Output projection $\\underbrace{W^O{${sup}}}_{\\text{Output Projection Matrix}}$ mixes head outputs:</p>
    $$ \\underbrace{\\text{MultiHeadAttention}_{\\text{proj}}${sup}}_{\\text{Projected attention output}} = \\underbrace{\\text{Concat}(\\text{Heads})}_{\\text{Concatenated head contexts}} \\cdot \\underbrace{W^O{${sup}}}_{\\text{Output Projection Matrix}} $$
    <div style="overflow-x:auto; overflow-y: hidden; padding-bottom: 10px">
    $$ \\underbrace{${matrixToPmatrixLabeled(projectedMHA, ts, 'after output projection')}}_{\\text{MultiHeadAttention}_{\\text{proj}}${sup}} = \\underbrace{${matrixToPmatrixLabeled(multiHeadOutput, ts, 'concat heads')}}_{\\text{Concat}\\left(\\text{Heads}\\right)} \\cdot \\underbrace{${matrixToPmatrix(WO)}}_{W^O{${sup}}} $$
    </div>
    </div>

    <div style="margin-bottom:10px;">
    <p style="font-size:0.85rem; color:#1e40af;">3. Residual connection (Pre-LN: no normalization on sublayer output):</p>
    $$ \\underbrace{${hOutName}${sup}}_{\\text{Output of attention sublayer}} = \\underbrace{${hInName}${sup}}_{\\text{${hInStage}}} + \\underbrace{\\text{MultiHeadAttention}_{\\text{proj}}${sup}}_{\\text{Projected attention output}} $$
    </div>
    <div style="overflow-x:auto; overflow-y: hidden; padding-bottom: 10px">
    $$ \\underbrace{${matrixToPmatrixLabeled(h1, ts, 'after attn residual')}}_{${hOutName}${sup}} = \\underbrace{${matrixToPmatrixLabeled(h0, ts, hInStage)}}_{${hInName}${sup}} + \\underbrace{${matrixToPmatrixLabeled(projectedMHA, ts, 'after output projection')}}_{\\text{MultiHeadAttention}_{\\text{proj}}${sup}} $$
    </div>
    `;
}

function renderAttentionDetails() {
	const open = document.querySelector('.unified-layer-card[open]');
	if (!open) return;
	const layerIdx = parseInt(open.dataset.layerIdx, 10);
	if (!isNaN(layerIdx)) renderLayerAttention(layerIdx);
}

function renderTrajectoryPlot(d_model) {
	if (!window.tlab_trajectory_collector) return;

	const containerId = 'transformer-trajectory-full-path';
	const wrapperId   = containerId + '-wrapper';
	let trajDiv  = document.getElementById(containerId);
	let wrapper  = document.getElementById(wrapperId);

	const targetHeight = getTrajectoryPlotHeight(d_model);

	if (!trajDiv) {
		// ── Build wrapper (houses toggle + plot) ──
		wrapper = document.createElement('div');
		wrapper.id = wrapperId;
		wrapper.style.cssText =
			'border:2px solid ' + themeColor('#cbd5e1') + '; border-radius:12px; margin-top:10px; background:' + themeColor('#f8fafc') + ';';
		wrapper.setAttribute('data-d-model', d_model);

		if (d_model <= 3) {
			wrapper.appendChild(createTrajectoryVFToggleButton());
		}

		trajDiv = document.createElement('div');
		trajDiv.id = containerId;
		trajDiv.style.cssText =
			`width:100%; height:${targetHeight}px; min-height:${targetHeight}px;` +
			`display:flex; align-items:center; justify-content:center;`;
		trajDiv.setAttribute('data-d-model', d_model);

		wrapper.appendChild(trajDiv);
		document.getElementById('transformer-migration-plots-container').appendChild(wrapper);
	} else {
		const prevDModel = parseInt(trajDiv.getAttribute('data-d-model') || '0');
		if (prevDModel !== d_model) {
			trajDiv.setAttribute('data-d-model', d_model);
			trajDiv.style.height    = targetHeight + 'px';
			trajDiv.style.minHeight = targetHeight + 'px';

			if (wrapper) {
				wrapper.setAttribute('data-d-model', d_model);
				const existingBtn = wrapper.querySelector('.trajectory-vf-toggle');
				if (d_model <= 3 && !existingBtn) {
					wrapper.insertBefore(createTrajectoryVFToggleButton(), trajDiv);
				} else if (d_model > 3 && existingBtn) {
					existingBtn.remove();
					window._trajectoryVfEnabled = false;
				}
			}
		}
	}

	registerLazyRenderable(
		containerId,
		trajectoryRenderRegistry,
		trajectoryObserver,
		{ d_model },
		() => tlab_render_trajectory_plot(d_model),
		`<div class="plot-loading traj-loading-placeholder" style="height:100%; flex-direction:column; gap:14px;"><div class="spinner"></div><span>Loading token trajectory: embedding → position → layer outputs...</span></div>`
	);
}

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
	window.__tmLayerTrace = [];
	window.__tmFFNTrace = [];
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

	// 2b. Provenance: record the initial hidden states h_0 = embedding + PE
	if (window.Prov) window.Prov.recordPre(knownTokens, d_model);

	// 2c. Final probabilities first: the output projection must fill even if
	// a later visualization (3D/GL, charts) throws. It only needs the weights.
	renderFinalProbabilities(masterTokens, vocabulary, weights, d_model, n_heads, n_layers, temperature);

	// 3. Prepare migration/trajectory state
	prepareMigrationState(needsReinit);
	for (let l = 0; l < n_layers; l++) {
		ensureUnifiedLayerContainer(l, n_layers, 'mha-calculation-details');
	}

	// 4. Core forward pass + visualization
	renderForwardPassOrPlaceholder(tokensWithPositional, knownTokens, h0, weights, d_model, n_heads, n_layers);
	window.dispatchEvent(new CustomEvent("tm:transformer-data"));
}

function getKnownTokensForVisualization(inputTokens, masterTokens, vocabulary) {
	const vizMode = window.tlabVisualizationMode || 'train';
	const vizSourceTokens = (vizMode === 'inference') ? masterTokens : inputTokens;
	return vizSourceTokens.filter(token => vocabulary.includes(token));
}

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
	tlab_render_themeriver(d_model);        // ← NEU
	pruneOrphanedMigrationPlots();

	forceRerenderVisibleMigrationPlots();
	forceRerenderVisibleTrajectoryPlot(d_model);
	forceRerenderVisibleThemeRiver(d_model); // ← NEU
}

function forceRerenderVisibleMigrationPlots() {
	transformerLabVisMigrationDataRegistry.forEach((data, id) => {
		// During training, always re-render visible plots
		// regardless of the rendered flag
		if (!data.rendered || window.isTraining) {
			const el = document.getElementById(id);
			if (el && isElementInViewport(el)) {
				render_migration_logic(
					id, data.tokens, data.start_h, data.end_h,
					data.layerNum, data.d_model, data.h_after,
					data.tokenStrings
				);
				data.rendered = true;
			}
		}
	});
}

function forceRerenderVisibleTrajectoryPlot(d_model) {
	const trajId = 'transformer-trajectory-full-path';
	const trajEntry = trajectoryRenderRegistry.get(trajId);
	if (trajEntry && (!trajEntry.rendered || window.isTraining)) {
		const trajEl = document.getElementById(trajId);
		if (trajEl && isElementInViewport(trajEl)) {
			tlab_render_trajectory_plot(d_model);
			trajEntry.rendered = true;
		}
	}
}

function showEmptyInputMessage() {
	document.getElementById('transformer-output-projection').innerHTML =
		`<div style="padding:20px; color: #64748b; text-align:center;">
	    Input words not found in Training Data.
	</div>`;
}

function renderFinalProbabilities(masterTokens, vocabulary, weights, d_model, n_heads, n_layers, temperature) {
	let finalTokens = masterTokens.filter(token => vocabulary.includes(token));
	// Unknown prompt tokens still have a zero embedding, so run them through
	// instead of blanking the panel. With no prompt at all (e.g. after Clear)
	// fall back to the last real training token so the projection stays filled.
	if (finalTokens.length === 0 && masterTokens.length > 0) finalTokens = masterTokens.slice();
	if (finalTokens.length === 0) {
		const real = vocabulary.filter(token => token !== TM_EOS_TOKEN);
		if (real.length) finalTokens = [real[real.length - 1]];
	}
	if (finalTokens.length === 0) return;

	const h_final = runSimpleForwardPass(finalTokens, weights, d_model, n_heads, n_layers, true);

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

	// Keep the token separate without inserting a visible space.
	if (masterInput.value.length > 0 && !/[\s\u200B]$/.test(masterInput.value)) {
		masterInput.value += TM_TOKEN_BOUNDARY;
	}

	masterInput.value += word;

	// Set master as active and re-run
	run_transformer_demo('transformer-master-token-input');
};

function computeFinalPredictions(h_last, vocabulary, d_model, temperature) {
	const W_vocab = vocabulary.map(word =>
		window.persistentEmbeddingSpace[word] || new Array(d_model).fill(0)
	);

	const logits = vocabulary.map((word, i) => {
		const w_row = W_vocab[i];
		return { word, val: dotProduct(h_last, w_row), w_row };
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

function buildHLastDisplayLatex(h_last) {
	// One component per matrix row, so long residual vectors stay readable
	// without a very wide single-line equation.
	return h_last.map((v, dim) =>
		`\\underbrace{${v.toFixed(nr_fixed)}}_{\\substack{h_{${dim}} \\\\ \\text{hidden dim ${dim}}}}`
	).join(' \\\\ ');
}

function buildHLastSection(h_last) {
	const hLastRows = buildHLastDisplayLatex(h_last);
	const isDe = !!(window.TM && TM.lang && TM.lang() === 'de');
	const head = isDe ? 'Aktuell' : 'Current';
	const note = isDe
		? '(die letzte Zeile der Ausgabematrix der letzten Schicht der Inferenzdaten)'
		: "(the last layers' output matrix last line of the inference-data)";
	return `<div style="margin-top: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; text-align: center;">
    <span class="md">
    <div class="logit_calc" style="text-align: center; margin-left: auto; margin-right: auto;">
    <p style="margin: 0 0 4px;">${head}</p>
    $$h_\\text{last} = \\begin{bmatrix} ${hLastRows} \\end{bmatrix}$$
    <p style="margin: 4px 0 0;">${note}</p>
    </div>\n`;
}

function buildVocabMatrixMultiplicationSection(h_last, vocabWords, W_vocab, logits) {
	const vocabMatrixRows = W_vocab.map((row, wIdx) => {
		const displayWord = /^\s+$/.test(vocabWords[wIdx]) ? vocabWords[wIdx].replace(/ /g, '␣') : vocabWords[wIdx];
		const safeWord = displayWord.replace(/#/g, '\\#').replace(/_/g, '\\_');
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

function buildLogitLatexRows(logits) {
	return logits.map(({ word, val }) => {
		const displayWord = /^\s+$/.test(word) ? word.replace(/ /g, '␣') : word;
		const safeWord = displayWord.replace(/#/g, '\\#').replace(/_/g, '\\_');
		return `\\color{#6366f1}{\\text{${safeWord}}} & ${val.toFixed(nr_fixed)}`;
	}).join(' \\\\ ');
}

function buildSoftmaxSection(logits, logitValues) {
	const probs = softmax(logitValues);
	const logitRows = buildLogitLatexRows(logits);

	const probRows = logits.map(({ word }, i) => {
		const displayWord = /^\s+$/.test(word) ? word.replace(/ /g, '␣') : word;
		const safeWord = displayWord.replace(/#/g, '\\#').replace(/_/g, '\\_');
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

function computeEntropyBits(probs) {
    return -probs.reduce((sum, p) => sum + (p > 1e-12 ? p * Math.log2(p) : 0), 0);
}

function buildTemperatureSection(logits, logitValues, temperature) {
    const probs = softmax(logitValues);

    const scaledLogitValues = logitValues.map(v => v / temperature);
    const scaledProbs = softmax(scaledLogitValues);

    const scaledProbRows = buildTemperatureComparisonRows(logits, probs, scaledProbs, temperature);
    const entropySection = buildEntropyLatex(probs, scaledProbs, logits.length, temperature);

    return `
<div style="overflow-x:auto; padding:10px 0;">
$$
\\text{softmax}\\!\\left(\\frac{\\underbrace{\\text{logit}_w}_{\\substack{\\text{Raw score} \\\\ \\text{for word } w}}}{\\underbrace{${temperature.toFixed(1)}}_{\\substack{\\text{Temperature} \\\\ T > 1 \\text{ flattens} \\\\ T < 1 \\text{ sharpens}}}}\\right) =
\\left(\\begin{array}{l|r|r|r}
\\text{word} & \\underbrace{P_{T=1}}_{\\substack{\\text{Original} \\\\ \\text{probability}}} & \\underbrace{P_{T=${temperature.toFixed(1)}}}_{\\substack{\\text{Scaled} \\\\ \\text{probability}}} & \\underbrace{\\Delta}_{\\substack{\\text{Change from} \\\\ \\text{scaling}}} \\\\
\\hline
    ${scaledProbRows}
\\end{array}\\right)
$$
</div>

        ${entropySection}`;
}

function buildTemperatureComparisonRows(logits, probs, scaledProbs, temperature) {
	return logits.map(({ word }, i) => {
		const displayWord = /^\s+$/.test(word) ? word.replace(/ /g, '␣') : word;
		const safeWord = displayWord.replace(/#/g, '\\#').replace(/_/g, '\\_');
		const color = getPositionColor(i, logits.length, 'temml');
		const origPct = (probs[i] * 100).toFixed(2);
		const scaledPct = (scaledProbs[i] * 100).toFixed(2);
		const diff = (scaledProbs[i] - probs[i]) * 100;
		const diffSign = diff >= 0 ? '+' : '';
		return `${color} \\text{${safeWord}} & ${color} ${origPct}\\% & ${color} ${scaledPct}\\% & ${color} ${diffSign}${diff.toFixed(2)}\\%`;
	}).join(' \\\\ ');
}

function buildEntropyLatex(probs, scaledProbs, vocabSize, temperature) {
    const entropyOrig = computeEntropyBits(probs);
    const entropyScaled = computeEntropyBits(scaledProbs);
    const maxEntropy = Math.log2(vocabSize);

    return `<div class="lg-scroll" style="padding:10px 0;">
$$
\\underbrace{H_{T=1}}_{\\substack{\\text{Entropy of} \\\\ \\text{unscaled distribution} \\\\ \\text{(Temperature = 1)}}} = ${entropyOrig.toFixed(4)} \\text{ bits}, \\quad
\\underbrace{H_{T=${temperature.toFixed(1)}}}_{\\substack{\\text{Entropy after} \\\\ \\text{temperature scaling} \\\\ \\text{(T = ${temperature.toFixed(1)})}}} = ${entropyScaled.toFixed(4)} \\text{ bits}, \\quad
\\underbrace{H_{\\max}}_{\\substack{\\text{Maximum possible entropy} \\\\ \\text{(uniform distribution} \\\\ \\text{over all ${vocabSize} words)}}} = \\log_2(${vocabSize}) = ${maxEntropy.toFixed(4)} \\text{ bits}
$$
</div>`;
}

function ensureProjectionSubContainers(container) {
	const oldChips = document.getElementById('tlab-final-chips');
	if (oldChips) oldChips.remove();

	let detailsDiv = document.getElementById('tlab-final-details');
	if (!detailsDiv) {
		container.innerHTML = `<div id="tlab-final-details"></div>`;
		detailsDiv = document.getElementById('tlab-final-details');
	}

	return { detailsDiv };
}

function render_final_projection(h_final, vocabulary, d_model, temperature) {
    const container = document.getElementById('transformer-output-projection');
    if (!container) return;

    const h_last = h_final[h_final.length - 1];
    const { logits } = computeFinalPredictions(h_last, vocabulary, d_model, temperature);
    const { detailsDiv } = ensureProjectionSubContainers(container);

    detailsDiv.innerHTML = buildLogitDetailsHtml(h_last, logits);

    // SCOPED rendering — do NOT call global render_temml()
    _renderTemmlOnElements([detailsDiv]);

    // Provenance: record the final stage and annotate the rendered numbers
    if (window.Prov) {
        const logitValues = logits.map(l => l.val);
        const originalProbs = softmax(logitValues);
        const scaledProbs = softmax(logitValues.map(v => v / temperature));
        window.Prov.recordFinal({
            h_last,
            W_vocab: logits.map(l => l.w_row),
            logitValues,
            originalProbs,
            scaledProbs,
            temperature,
            vocabulary,
            vocabSize: vocabulary.length,
            h_final,
            lastLayer: getTransformerConfig().n_layers
        });
        const overDivs = detailsDiv.querySelectorAll('div[style*="overflow-x:auto"]');
        const hLastP = detailsDiv.querySelector('.logit_calc');
        window.Prov.apply(hLastP || detailsDiv, { inline: true, grids: ['F:h_last'] });
        window.Prov.apply(overDivs[0], [
            { grid: 'F:Wv' },
            { grid: 'F:h_last', oneCol: 0 },
            { grid: 'F:logits', oneCol: 1 }
        ]);
        window.Prov.apply(overDivs[1], [
            { grid: 'F:probs_pct', oneCol: 1 },
            { grid: 'F:logits', oneCol: 1 }
        ]);
        window.Prov.apply(overDivs[2], [{
            cols: [
                { grid: 'F:probs_pct', col: 1 },
                { grid: 'F:sprobs_pct', col: 2 },
                { grid: 'F:delta_pct', col: 3 }
            ]
        }]);
        window.Prov.apply(overDivs[3], { inline: true, grids: ['F:ent_orig', 'F:ent_scaled', 'F:ent_max'] });
    }
    if (typeof render_token_picker === 'function') render_token_picker();
}

window.appendToken = (token) => {
	const input = document.getElementById('transformer-master-token-input');
	if (!input) return;

	// Logic to handle "##" tokens (subwords)
	if (token.startsWith('##')) {
		input.value += token.replace('##', '');
	} else {
		const boundary = (input.value && !/[\s\u200B]$/.test(input.value) && !/^\s/.test(token)) ? TM_TOKEN_BOUNDARY : '';
		input.value += boundary + token;
	}
	// Trigger update
	if (typeof render_token_picker_chips === 'function') render_token_picker_chips();
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
		PlotState.loadingMarkup('Wait for Embedding Space to load...')
	);
}

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

function renderLowDimEmbeddingPlot(container, tokens, dimensions, highlightPos, steps) {
	let chart = echarts.getInstanceByDom(container);
	if (!chart) chart = echarts.init(container);

	if (dimensions === 3) {
		_embedding_render_3d_echarts(chart, tokens, highlightPos, steps);
	} else {
		_embedding_render_2d_echarts(chart, tokens, dimensions, highlightPos, steps);
	}

	if (!container._ecEmbResize) {
		container._ecEmbResize = () => {
			const c = echarts.getInstanceByDom(container);
			if (c) c.resize();
		};
		window.addEventListener('resize', container._ecEmbResize);
	}
}

function _embedding_render_2d_echarts(chart, tokens, dimensions, highlightPos, steps) {
	const series = [];

	const vocabData = tokens.map(token => {
		const vec = window.persistentEmbeddingSpace[token];
		return {
			value: [vec[0], vec.length >= 2 ? vec[1] : 0],
			name: displayToken(token),
			itemStyle: {
				color: `hsl(${getHueFromToken(token)}, 75%, 50%)`
			}
		};
	});

	series.push({
		type: 'scatter',
		name: 'Vocabulary',
		data: vocabData,
		symbolSize: 8,
		itemStyle: { opacity: 0.85 },
		label: {
			show: true,
			position: 'top',
			formatter: p => p.name,
			fontSize: 11,
			color: '#1e293b'
		},
		tooltip: {
			formatter: p => `<b>${p.name}</b><br>(${p.value[0].toFixed(4)}, ${p.value[1].toFixed(4)})`
		},
		z: 5
	});

	if (steps && steps.length > 0) {
		const arrowColor = '#3b82f6';
		const arrowData = steps.map(step => ({
			value: [
				step.from[0],
				dimensions >= 2 ? step.from[1] : 0,
				step.to[0],
				dimensions >= 2 ? step.to[1] : 0
			],
			_label: step.label
		}));

		series.push({
			type: 'custom',
			name: 'Steps',
			renderItem: function (params, api) {
				const sPx = api.coord([api.value(0), api.value(1)]);
				const ePx = api.coord([api.value(2), api.value(3)]);
				return _ec2d_render_arrow(sPx, ePx, arrowColor, 3);
			},
			encode: { x: [0, 2], y: [1, 3] },
			data: arrowData,
			tooltip: { formatter: p => `<b>${p.data._label}</b>` },
			z: 10
		});
	}

	if (highlightPos) {
		series.push({
			type: 'scatter',
			name: 'Result',
			data: [{
				value: [highlightPos[0], dimensions >= 2 ? highlightPos[1] : 0]
			}],
			symbol: 'diamond',
			symbolSize: 14,
			itemStyle: { color: '#ef4444' },
			tooltip: {
				formatter: p =>
				`<b>Result</b><br>(${p.value[0].toFixed(4)}, ${p.value[1].toFixed(4)})`
			},
			z: 15
		});
	}

	chart.setOption({
		title: {
			text: 'Embedding Space', left: 'center',
			textStyle: { fontSize: 14, color: themeColor('#1e293b') }
		},
		tooltip: { show: true, trigger: 'item', confine: true },
		legend: { show: false, bottom: 0 },
		xAxis: {
			type: 'value', name: 'Dim 0',
			nameLocation: 'center', nameGap: 25,
			splitLine: { lineStyle: { color: themeColor('#f0f0f0') } }
		},
		yAxis: {
			type: 'value',
			name: dimensions >= 2 ? 'Dim 1' : '',
			nameLocation: 'center', nameGap: 35,
			splitLine: { lineStyle: { color: themeColor('#f0f0f0') } }
		},
		grid: { top: 50, bottom: 50, left: 55, right: 30 },
		series: series,
		animation: false
	}, true);
}

function _embedding_render_3d_echarts(chart, tokens, highlightPos, steps) {
	const series = [];
	const arrowColor = '#3b82f6';

	series.push({
		name: 'Vocabulary',
		type: 'scatter3D',
		data: tokens.map(token => {
			const vec = window.persistentEmbeddingSpace[token];
			return {
				name: displayToken(token),
				value: [vec[0], vec[1] || 0, vec[2] || 0],
				itemStyle: {
					color: `hsl(${getHueFromToken(token)}, 75%, 50%)`
				}
			};
		}),
		symbolSize: 6,
		itemStyle: { opacity: 0.85 },
		label: {
			show: true, position: 'top', distance: 5,
			formatter: p => p.name,
			textStyle: { fontSize: 10, color: themeColor('#1e293b') }
		}
	});

	if (steps && steps.length > 0) {
		steps.forEach((step, idx) => {
			const from3 = step.from.slice(0, 3);
			const to3   = step.to.slice(0, 3);

			const shaftEnd = _computeArrowheadBase(from3, to3, 0.5);
			series.push({
				type: 'line3D',
				data: [from3, shaftEnd],
				lineStyle: { width: 5, color: arrowColor, opacity: 0.85 },
				silent: true
			});

			_add3DArrowheadSeries(series, from3, to3, arrowColor, {
				lineWidth: 7, maxHeadLen: 0.5, spreadRatio: 0.4, name: 'Steps'
			});

			series.push({
				type: 'scatter3D',
				data: [{
					value: [(from3[0]+to3[0])/2, (from3[1]+to3[1])/2, (from3[2]+to3[2])/2],
					_hover: step.label
				}],
				symbolSize: 4,
				itemStyle: { color: 'rgba(59,130,246,0.01)' },
				tooltip: { formatter: p => `<b>${p.data._hover}</b>` }
			});
		});
	}

	if (highlightPos) {
		series.push({
			name: 'Result',
			type: 'scatter3D',
			data: [{ value: highlightPos.slice(0, 3) }],
			symbol: 'diamond', symbolSize: 10,
			itemStyle: { color: '#ef4444' },
			tooltip: {
				formatter: p =>
				`<b>Result</b><br>(${p.value[0].toFixed(4)}, ${p.value[1].toFixed(4)}, ${p.value[2].toFixed(4)})`
			}
		});
	}

	chart.setOption({
		title: {
			text: 'Embedding Space', left: 'center',
			textStyle: { fontSize: 14, color: themeColor('#1e293b') }
		},
		tooltip: { show: true, trigger: 'item', confine: true },
		xAxis3D: { type: 'value', name: 'Dim 0' },
		yAxis3D: { type: 'value', name: 'Dim 1' },
		zAxis3D: { type: 'value', name: 'Dim 2' },
		grid3D: _defaultGrid3DConfig(),
		series: series,
		animation: false
	}, true);
}

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

function _execute_embedding_render(dimensions, highlightPos = null, steps = []) {
	const container = document.getElementById('transformer-plotly-space');
	if (!container) return;

	if (!window.persistentEmbeddingSpace || Object.keys(window.persistentEmbeddingSpace).length === 0) {
		_renderChartError(
			container,
			'⚠️ Invalid Configuration — embedding space unavailable',
			'No embedding space exists because <i>d<sub>model</sub></i> is not evenly divisible by <i>h</i>. Fix the configuration above to restore this visualization.'
		);
		return;
	}

	const existingChart = echarts.getInstanceByDom(container);
	if (existingChart) dispose(existingChart);
	container.innerHTML = '';

	const tokens = Object.keys(window.persistentEmbeddingSpace);

	if (dimensions <= 3) {
		renderLowDimEmbeddingPlot(container, tokens, dimensions, highlightPos, steps);
	} else {
		renderHighDimEmbeddingPlot(container, tokens, dimensions);
	}
}

// Updated Tokenizer to allow different containers

const TM_EOS_TOKEN = '<|endoftext|>';
// Invisible boundary between adjacent chips: keeps them as separate tokens
// without inserting a visible space the reader did not type.
const TM_TOKEN_BOUNDARY = '\u200B';

function tokenizeTextCore(text, type) {
	const raw = String(text == null ? '' : text);
	const cleaned = raw.split(TM_EOS_TOKEN).join(' ').replace(/ {2,}/g, ' ');
	const tokens = [];
	let i = 0;
	while (i < cleaned.length) {
		const ch = String.fromCodePoint(cleaned.codePointAt(i));
		if (ch === TM_TOKEN_BOUNDARY) {
			// Chip boundary, not a token: keeps adjacent chips separate
			// without creating a space token.
			i += ch.length;
			continue;
		}
		if (/\s/u.test(ch)) {
			tokens.push(ch);
			i += ch.length;
			continue;
		}
		const word = cleaned.slice(i).match(/^[\p{L}\p{M}\p{N}_]+/u);
		if (word) {
			tokens.push(word[0]);
			i += word[0].length;
			continue;
		}
		tokens.push(ch);
		i += ch.length;
	}
	return tokens;
}

function tokenizeText(text, type) {
	const tokens = tokenizeTextCore(text, type);
	tokens.push(TM_EOS_TOKEN);
	return tokens;
}

function renderTokenChips(container, tokens) {
	if (!container) return;

	container.innerHTML = '';

	tokens.forEach((t, i) => {
		const c = tokenColor(t);
		const displayToken = t.replace(/ /g, '␣').replace(/\t/g, '⇥').replace(/\n/g, '⏎').replace(/\r/g, '␍');

		const badge = document.createElement('div');
		badge.className = 'token-badge token-enter';
		badge.style.cssText = `
	    --token-bg: ${c.bg};
	    --token-glow: ${c.glow};
	    --token-border: ${c.border};
	    animation-delay: ${i * 18}ms;
	`;

		badge.innerHTML = `
	    <span class="token-text">${escapeHtml(displayToken)}</span><br><span class="token-id">${c.id}</span>
	`;

		badge.setAttribute('title', `"${t}" → ID ${c.id}`);
		container.appendChild(badge);
	});
}


function _tmPickerDisplay(token) {
	return String(token).replace(/ /g, '␣').replace(/\t/g, '⇥').replace(/\n/g, '⏎').replace(/\r/g, '␍');
}

function _tmTokenColorChip(token) {
	var color = tokenColor(token);
	var chip = document.createElement('button');
	chip.type = 'button';
	chip.className = 'tm-token-chip';
	chip.textContent = _tmPickerDisplay(token);
	chip.style.background = color.bg;
	chip.style.borderColor = color.border;
	chip.title = token === ' ' ? ((window.TM && TM.lang && TM.lang() === 'de') ? 'Leerzeichen' : 'space') : token;
	return chip;
}

function _tmTokenPickerProbs() {
	var cache = window._cachedFinalProjection;
	if (!cache || !cache.h_final || !cache.h_final.length) return {};
	var tempEl = document.getElementById('transformer-temperature');
	var temperature = parseFloat(tempEl ? tempEl.value : 1) || 1;
	try {
		var computed = computeFinalPredictions(cache.h_final[cache.h_final.length - 1], cache.vocabulary, cache.d_model, temperature);
		var map = {};
		computed.predictions.forEach(function (p) { map[p.word] = p.prob; });
		return map;
	} catch (e) { return {}; }
}

function _tmTokenPickerSelectedProbs(tokens) {
	if (window.isTraining || !window.currentWeights || !window.persistentEmbeddingSpace) return {};
	const cfg = getTransformerConfig();
	if (!cfg.d_model || !cfg.n_heads || !cfg.n_layers || cfg.d_model % cfg.n_heads !== 0) return {};
	try {
		const h = runSimpleForwardPass(tokens, window.currentWeights, cfg.d_model, cfg.n_heads, cfg.n_layers, false);
		const vocab = Object.keys(window.persistentEmbeddingSpace).filter(token => token !== TM_EOS_TOKEN);
		const rows = vocab.map(word => window.persistentEmbeddingSpace[word]);
		const result = {};
		if (tokens.length) {
			const firstIdx = vocab.indexOf(tokens[0]);
			if (firstIdx >= 0) {
				const start = runSimpleForwardPass([TM_EOS_TOKEN], window.currentWeights, cfg.d_model, cfg.n_heads, cfg.n_layers, false);
				const logits = rows.map(row => dotProduct(start[0], row));
				const probs = softmax(logits.map(v => v / (cfg.temperature || 1)));
				result[0] = probs[firstIdx];
			}
		}
		for (let i = 1; i < tokens.length; i++) {
			const idx = vocab.indexOf(tokens[i]);
			if (idx < 0) continue;
			const logits = rows.map(row => dotProduct(h[i - 1], row));
			const probs = softmax(logits.map(v => v / (cfg.temperature || 1)));
			result[i] = probs[idx];
		}
		return result;
	} catch (e) {
		return {};
	}
}

function render_token_picker_chips() {
	var input = document.getElementById('transformer-master-token-input');
	var chips = document.getElementById('transformer-token-picker-chips');
	if (!input || !chips) return;
	var typeEl = document.getElementById('transformer-tokenizer-type');
	var type = typeEl ? typeEl.value : 'regex';
	var tokens = tokenizeTextCore(input.value, type);
	var selectedProbs = _tmTokenPickerSelectedProbs(tokens);
	chips.innerHTML = '';
	tokens.forEach(function (token, idx) {
		var chip = _tmTokenColorChip(token);
		chip.classList.add('is-selected');
		chip.setAttribute('data-idx', String(idx));
		var prob = selectedProbs[idx];
		if (prob != null) {
			var pct = document.createElement('span');
			pct.className = 'tm-token-chip-prob';
			pct.textContent = (prob * 100).toFixed(1) + '%';
			chip.appendChild(pct);
		}
		var removeLabel = (window.TM && TM.lang && TM.lang() === 'de') ? ' — zum Entfernen klicken' : ' — click to remove';
		chip.title = (token === ' ' ? ((window.TM && TM.lang && TM.lang() === 'de') ? 'Leerzeichen' : 'space') : token) + (prob != null ? ' — ' + (prob * 100).toFixed(1) + '%' : '') + removeLabel;
		chips.appendChild(chip);
	});
}

function render_token_picker() {
	var palette = document.getElementById('transformer-token-picker-palette');
	var chips = document.getElementById('transformer-token-picker-chips');
	var input = document.getElementById('transformer-master-token-input');
	if (!palette || !chips || !input || !window.persistentEmbeddingSpace) return;

	var probs = _tmTokenPickerProbs();
	var tokens = Object.keys(window.persistentEmbeddingSpace);
	tokens.sort(function (a, b) {
		var pa = probs[a] || 0, pb = probs[b] || 0;
		if (pb !== pa) return pb - pa;
		return a.localeCompare(b);
	});
	var signature = tokens.join('\u0001') + '|' + tokens.map(function (token) {
		return (probs[token] || 0).toFixed(4);
	}).join(',');
	if (palette.dataset.tmPickerSig !== signature) {
		palette.innerHTML = '';
		tokens.forEach(function (token) {
			var chip = _tmTokenColorChip(token);
			chip.setAttribute('data-token', token);
			if (probs[token] != null) {
				var pct = document.createElement('span');
				pct.className = 'tm-token-chip-prob';
				pct.textContent = (probs[token] * 100).toFixed(1) + '%';
				chip.appendChild(pct);
			}
			palette.appendChild(chip);
		});
		palette.dataset.tmPickerSig = signature;
	}

	if (!palette._tmPickerBound) {
		palette._tmPickerBound = true;
		var clearBtn = document.getElementById('transformer-token-picker-clear');
		var typeEl = document.getElementById('transformer-tokenizer-type');
		var tempEl = document.getElementById('transformer-temperature');
		palette.addEventListener('click', function (event) {
			var chip = event.target.closest && event.target.closest('.tm-token-chip');
			if (!chip) return;
			var token = chip.getAttribute('data-token');
			if (token == null || token === TM_EOS_TOKEN) return;
			// Keep words as separate tokens: a non-space token appended after
			// another word gets an invisible boundary, not a visible space.
			if (token.indexOf('##') === 0) {
				input.value += token.slice(2);
			} else {
				var needsBoundary = input.value && !/[\s\u200B]$/.test(input.value) && !/^\s/.test(token);
				input.value += (needsBoundary ? TM_TOKEN_BOUNDARY : '') + token;
			}
			input.dispatchEvent(new Event('input', { bubbles: true }));
			render_token_picker_chips();
		});
		if (clearBtn) clearBtn.addEventListener('click', function () {
			input.value = '';
			input.dispatchEvent(new Event('input', { bubbles: true }));
			render_token_picker_chips();
		});
		chips.addEventListener('click', function (event) {
			var chip = event.target.closest && event.target.closest('.tm-token-chip');
			if (!chip) return;
			var idx = parseInt(chip.getAttribute('data-idx'), 10);
			var type = typeEl ? typeEl.value : 'regex';
			var tokens = tokenizeTextCore(input.value, type);
			if (idx < 0 || idx >= tokens.length) return;
			tokens.splice(idx, 1);
			input.value = tokens.join(TM_TOKEN_BOUNDARY);
			input.dispatchEvent(new Event('input', { bubbles: true }));
			render_token_picker_chips();
		});
		input.addEventListener('input', function () {
			render_token_picker_chips();
			render_token_picker();
		});
		if (tempEl) tempEl.addEventListener('input', function () { render_token_picker(); });
	}
	render_token_picker_chips();
}

function transformer_tokenize_render(text, containerId = "transformer-viz-bpe", appendEos = true) {
	const typeElement = document.getElementById('transformer-tokenizer-type');
	const type = typeElement ? typeElement.value : 'regex';

	// Training corpora end with EOS so the model learns when to stop.
	// Inference prompts must NOT carry it: the next-token distribution is
	// read from the last real prompt token, and EOS was never trained as an
	// input token, so appending it made the model predict EOS right away.
	const tokens = appendEos ? tokenizeText(text, type) : tokenizeTextCore(text, type);

	const container = document.getElementById(containerId);
	const signature = tokens.join('\u0001');
	if (container && container.dataset.tmTokenSig === signature && container.children.length) {
		return tokens;
	}
	renderTokenChips(container, tokens);
	if (container) container.dataset.tmTokenSig = signature;

	return tokens;
}

function _renderConcatCore(container, headData, tokens, tokenStrings, stageLabel) {
	if (!container || !headData.length) return [];
	const ts = tokenStrings || null;

	const headMatricesLaTeX = headData.map((h, i) =>
		`\\underbrace{${matrixToPmatrixLabeled(h.context, ts, stageLabel ? `head ${i+1} ctx` : undefined)}}_{\\text{Head } ${i + 1}}`
	).join(', ');

	const fullMatrixData = tokens.map((_, tIdx) =>
		[].concat(...headData.map(h => h.context[tIdx]))
	);

	const finalLaTeX = `\\underbrace{${matrixToPmatrixLabeled(fullMatrixData, ts, stageLabel || undefined)}}_{\\text{Total } d_{\\text{model}}}`;
	const newHtml = `<div style='overflow-x: auto; overflow-y: hidden; max-width: 100%;'>$$ \\text{Concat} \\left( \\left[ ${headMatricesLaTeX} \\right] \\right) = ${finalLaTeX} $$</div>`;

	heightLockedMathUpdate([container], [newHtml]);
	return fullMatrixData;
}

function updateConcatenationDisplay(headData, tokens, tokenStrings) {
	return _renderConcatCore(document.getElementById('transformer-concat-viz'), headData, tokens, tokenStrings, null);
}

function updateConcatenationDisplayForLayer(headData, tokens, layerIndex, tokenStrings) {
	const container = document.getElementById(`unified-layer-${layerIndex}-concat-viz`);
	const full = _renderConcatCore(container, headData, tokens, tokenStrings, 'after concat');

	// Provenance: annotate the concatenation equation (per-head contexts + full matrix)
	if (window.Prov && container) {
		const P = 'L:' + (layerIndex + 1);
		const entries = headData.map((h, hi) => ({ grid: P + ':head:' + hi + ':ctx' }));
		entries.push({ grid: P + ':concat' });
		window.Prov.apply(container, entries);
	}
	return full;
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

function clearFFNEquationsContainer() {
	const container = document.getElementById('ffn-equations-container');
	if (!container) return;

	// FIX: During training, do NOT destroy the unified tabs.
	// Only do a full clear when the architecture config has changed
	// (detected by comparing the number of existing layer tabs to n_layers).
	const { n_layers } = getTransformerConfig();
	const existingCards = container.querySelectorAll('.unified-layer-card');

	if (existingCards.length === n_layers) {
		container.querySelectorAll('.unified-layer-tab-content').forEach(div => {
			div.dataset.ffnRendered = 'false';
			const body = div.querySelector('[id$="-formula-body"]');
			if (body) body.dataset.formulasRendered = 'false';
		});
		return;
	}

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

	const out_L1 = matMul(normed_h1, W1, b1).map(row => row.map(v => geluApprox(v)));

	const out_FFN = matMul(out_L1, W2, b2);

	const h2 = matAdd(h1, out_FFN);

	if (!window.__tmFFNTrace) window.__tmFFNTrace = [];
	window.__tmFFNTrace[layerIndex] = { h1, normed_h1, out_L1, out_FFN, h2, W1, b1, W2, b2, gamma2, beta2 };

	if (!skipRender) {
		// Provenance: record the FFN sublayer values
		if (window.Prov) {
			window.Prov.recordFfn(layerIndex, {
				gamma2, beta2,
				norm2: normed_h1,
				W1, b1,
				outL1: out_L1,
				W2, b2,
				outFFN: out_FFN,
				h2,
				h1
			});
		}
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

const flattenDisplay = (mat) => {
	if (!mat || !mat.length) return '';
	return mat.map(row =>
		Array.isArray(row)
		? row.map(v => v.toFixed(nr_fixed)).join(',')
		: row.toFixed(nr_fixed)
	).join(';');
};

function _ffnContentHash(h1, normed_h1, out_L1, out_FFN, h2, gamma, beta) {
	// Hash the DISPLAYED values (toFixed(nr_fixed)) so we only re-render
	// when what the user actually sees would change
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

function heightLockedMathUpdate(elements, htmlArray) {
	// elements and htmlArray must be same length
	const updated = [];
	elements.forEach((el, i) => {
		if (el && htmlArray[i] !== undefined) {
			_heightLockedUpdate(el, htmlArray[i]);
			updated.push(el);
		}
	});
	_renderTemmlOnElements(updated);
}

function _heightLockedUpdate(el, newHtml) {
	if (!el) return false;
	if (el.innerHTML === newHtml) return false;

	el.innerHTML = newHtml;

	return true;
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

	heightLockedMathUpdate([step1, step2, step3], [step1Html, step2Html, step3Html]);

	// Provenance: annotate the three FFN steps
	if (window.Prov) {
		const P = 'L:' + (layerIndex + 1);
		window.Prov.apply(step1, [
			{ grid: P + ':norm2' },
			{ grid: P + ':h1' },
			{ vec: P + ':gamma2' },
			{ vec: P + ':beta2' },
			{ grid: P + ':outL1' },
			{ grid: P + ':norm2' },
			{ grid: P + ':W1' },
			{ vec: P + ':b1' }
		]);
		window.Prov.apply(step2, [
			{ grid: P + ':outFFN' },
			{ grid: P + ':outL1' },
			{ grid: P + ':W2' },
			{ vec: P + ':b2' }
		]);
		window.Prov.apply(step3, [
			{ grid: P + ':h2' },
			{ grid: P + ':h1' },
			{ grid: P + ':outFFN' }
		]);
	}
}

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

function _buildFFNStep1Html(naming, h1, normed_h1, W1, b1, out_L1, gamma, beta, ts) {
    const { sup, h1name, h1Stage } = naming;

    const preLNHtml = _buildFFNPreLNSection(sup, h1name, h1Stage, h1, normed_h1, gamma, beta, ts);
    const expansionHtml = _buildFFNExpansionSection(sup, h1name, normed_h1, W1, b1, out_L1, ts);

    return preLNHtml + expansionHtml;
}

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

function _buildFFNExpansionSection(sup, h1name, normed_h1, W1, b1, out_L1, ts) {
    return `
    <p style="font-size:0.85rem; color:#1e40af;"><strong>FFN Layer 1: Expansion + GELU</strong></p>

    $$ \\underbrace{\\text{out}_{L1}${sup}}_{\\text{Hidden layer (expanded)}} = \\underbrace{\\text{GELU}}_{\\substack{\\text{Activation} \\\\ 0.5x(1 + \\text{erf}(x/\\sqrt{2}))}}\\!\\left(\\underbrace{\\text{Norm}(${h1name}${sup})}_{\\text{Normalized input}} \\cdot \\underbrace{W_1${sup}}_{\\substack{\\text{Expansion} \\\\ \\text{Weight Matrix}}} + \\underbrace{b_1${sup}}_{\\text{Expansion Bias}}\\right) $$

    <div style="overflow-x:auto; padding-bottom: 10px;">
    $$ \\underbrace{${matrixToPmatrixLabeled(out_L1, ts, 'after GELU')}}_{\\text{out}_{L1}${sup}} = \\text{GELU}\\!\\left( \\underbrace{${matrixToPmatrixLabeled(normed_h1, ts, 'after LN₂')}}_{\\text{Norm}(${h1name}${sup})} \\cdot \\underbrace{${matrixToPmatrix(W1)}}_{W_1${sup}} + \\underbrace{${vecToPmatrix(b1)}}_{b_1${sup}} \\right) $$
    </div>`;
}

function _buildFFNStep2Html(naming, out_L1, W2, b2, out_FFN, ts) {
    const { sup } = naming;

    return `
    <p style="font-size:0.85rem; color:#1e40af;"><strong>FFN Layer 2: Compression</strong></p>

    $$ \\underbrace{\\text{out}_{L2}${sup}}_{\\text{FFN output (compressed)}} = \\underbrace{\\text{out}_{L1}${sup}}_{\\text{Hidden layer (expanded)}} \\cdot \\underbrace{W_2${sup}}_{\\substack{\\text{Compression} \\\\ \\text{Weight Matrix}}} + \\underbrace{b_2${sup}}_{\\text{Compression Bias}} $$

    <div style="overflow-x:auto; padding-bottom: 10px;">
    $$ \\underbrace{${matrixToPmatrixLabeled(out_FFN, ts, 'FFN output')}}_{\\text{Out}_\\text{FFN}${sup}} = \\underbrace{${matrixToPmatrixLabeled(out_L1, ts, 'after GELU')}}_{\\text{out}_{L1}${sup}} \\cdot \\underbrace{${matrixToPmatrix(W2)}}_{W_2${sup}} + \\underbrace{${vecToPmatrix(b2)}}_{b_2${sup}} $$
    </div>`;
}

function _buildFFNStep3Html(naming, h1, out_FFN, h2, ts) {
    const { sup, h1name, h2name, h1Stage } = naming;

    return `
    <div style="margin-bottom:10px;">
    <p style="font-size:0.85rem; color:#1e40af;"><strong>Residual connection</strong> (Pre-LN: no normalization on sublayer output):</p>
    $$ \\underbrace{${h2name}${sup}}_{\\text{Layer output}} = \\underbrace{${h1name}${sup}}_{\\text{${h1Stage}}} + \\underbrace{\\text{out}_{L2}${sup}}_{\\text{FFN output (compressed)}} $$
    </div>
    <div style="overflow-x:auto; overflow-y: hidden; padding-bottom: 10px;">
    $$ \\underbrace{${matrixToPmatrixLabeled(h2, ts, 'layer output')}}_{${h2name}${sup}} = \\underbrace{${matrixToPmatrixLabeled(h1, ts, h1Stage)}}_{${h1name}${sup}} + \\underbrace{${matrixToPmatrixLabeled(out_FFN, ts, 'FFN output')}}_{\\text{out}_{L2}${sup}} $$
    </div>`;
}

function _renderTemmlOnElements(elements) {
    if (typeof temml.renderMathInElement !== 'function') {
        // DO NOT fall back to global render_temml() — it can wipe
        // the vector math input by processing the entire document.
        console.warn('renderMathInElement not available, skipping scoped render');
        return;
    }
    elements.forEach(el => {
        if (!el) return;
        try {
            temml.renderMathInElement(el, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ],
                throwOnError: false,
                annotate: true
            });
        } catch(e) {}
        if (typeof ensureDisplayMathScrollable === 'function') {
            ensureDisplayMathScrollable(el);
        }
    });
}

function run_deep_layers(h_initial, tokens, total_depth, d_model, n_heads, this_weights, startLayer = 0, tokenStrings = null) {
	let h_current = h_initial;
	for (let n = startLayer; n < total_depth; n++) {
		const layer = this_weights[n];
		const h_before_layer = h_current.map(row => row.slice());
		const normH = calculateLayerNorm(h_current, layer.gamma, layer.beta);
		const headData = causalMultiHeadAttention(normH, layer.attention, d_model, n_heads);
		const virtualContainerId = "unified-attention-engine";
		const engine = new AttentionEngine({ d_model, n_heads, containerId: virtualContainerId, weights: layer.attention });
		engine.forward(normH, tokenStrings || h_current, tokenStrings);
		const regEntry = attentionRenderRegistry.get(virtualContainerId);
		if (regEntry) { regEntry.headData = headData; regEntry.rendered = false; }
		const concat = h_current.map((_, tIdx) => [].concat(...headData.map(hd => hd.context[tIdx])));
		const projected = matMul(concat, layer.attention.output);
		const h_attn = matAdd(h_current, projected);
		const h_out = run_ffn_block(h_attn, layer, true, n, tokenStrings);
		if (!window.__tmLayerTrace) window.__tmLayerTrace = [];
		window.__tmLayerTrace[n] = { h_in: h_before_layer, h_attn, h_out, headData, tokenStrings, normH, concat, projected, Wo: layer.attention.output, gamma: layer.gamma, beta: layer.beta, ffn: (window.__tmFFNTrace || [])[n] };
		create_migration_plot(`migration-layer-${n + 1}`, tokens, h_before_layer, h_out, n + 1, d_model, h_out, tokenStrings);
		h_current = h_out;
	}
	return h_current;
}

// ─── Sub-functions ───────────────────────────────────────────

function _vf2d_magnitude_color(normMag) {
	const r = Math.round(normMag * 239 + (1 - normMag) * 59);
	const g = Math.round(normMag * 68 + (1 - normMag) * 130);
	const b = Math.round(normMag * 68 + (1 - normMag) * 246);
	return `rgb(${r},${g},${b})`;
}

function _vf2d_arrow_geometry(p, maxMag, maxArrowLen) {
	const normMag = p.mag / maxMag;
	const arrowLen = maxArrowLen * normMag;
	const lineWidth = 2;

	// Use the ACTUAL dx/dy direction, not unit vectors
	// This preserves the exact direction without floating-point drift
	let ux = 0, uy = 0;
	if (p.mag > 1e-10) {
		ux = p.dx / p.mag;
		uy = p.dy / p.mag;
	}

	return { ux, uy, arrowLen, lineWidth, normMag };
}

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

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
        rect.bottom > 0 &&
        rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
        rect.right > 0
    );
}

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

function tlab_render_echarts(plotDiv, tokens, start_h, end_h, layerNum, d_model, isLastLayer, nextWordIndex) {
	let myChart = echarts.getInstanceByDom(plotDiv);
	if (!myChart) myChart = echarts.init(plotDiv);

	const axes = Array.from({ length: d_model }, (_, i) => ({
		dim: i, name: `Dim ${i}`
	}));

	const data = tokens.map((token, i) => {
		const sourceWord = displayToken(tlab_get_top_word_only(start_h[i]));
		const destWord = displayToken(tlab_get_top_word_only(end_h[i]));
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
		() => render_migration_logic(id, tokens, start_h, end_h, layerNum, d_model, h_after, tokenStrings),
		PlotState.loadingMarkup('Loading feature migration plot...')
	);

}

function getMigrationDisplayTokens(tokens, tokenStrings) {
	if (tokenStrings && tokenStrings.length === tokens.length) {
		return tokenStrings.map(t => displayToken(t));
	}
	return tokens.map((t, i) => {
		if (typeof t === 'string') return displayToken(t);
		return displayToken(tlab_get_top_word_only(t));
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
	} else {
		// ── FIX: always sync with current input ──
		window.tlab_trajectory_collector.tokens = [...tokens];
		window.tlab_trajectory_collector.displayTokens = [...displayTokens];
		window.tlab_trajectory_collector.d_model = d_model;
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
	toggleBtn.textContent = existingVfEnabled ? ((window.TM && TM.lang && TM.lang() === 'de') ? '🧭 Vektorfeld ausblenden' : '🧭 Hide Vector Field') : ((window.TM && TM.lang && TM.lang() === 'de') ? '🧭 Vektorfeld zeigen' : '🧭 Show Vector Field');
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
		toggleBtn.style.background = toggleBtn.dataset.mode === 'off' ? themeColor('#ffffff') : '#dbeafe';
	});
	toggleBtn.addEventListener('click', () => {
		const currentMode = toggleBtn.dataset.mode;
		const migId = toggleBtn.dataset.migrationId;
		const regData = transformerLabVisMigrationDataRegistry.get(migId);
		if (!regData) return;

		if (currentMode === 'off') {
			toggleBtn.dataset.mode = 'on';
			toggleBtn.textContent = ((window.TM && TM.lang && TM.lang() === 'de') ? '🧭 Vektorfeld ausblenden' : '🧭 Hide Vector Field');
			toggleBtn.style.background = '#dbeafe';
			regData._vfEnabled = true;
			render_migration_logic(migId, regData.tokens, regData.start_h, regData.end_h, regData.layerNum, regData.d_model, regData.h_after, regData.tokenStrings);
		} else {
			toggleBtn.dataset.mode = 'off';
			toggleBtn.textContent = ((window.TM && TM.lang && TM.lang() === 'de') ? '🧭 Vektorfeld zeigen' : '🧭 Show Vector Field');
			toggleBtn.style.background = themeColor('#ffffff');
			regData._vfEnabled = false;
			render_migration_logic(migId, regData.tokens, regData.start_h, regData.end_h, regData.layerNum, regData.d_model, regData.h_after, regData.tokenStrings);
		}
	});

	return toggleBtn;
}

function createMigrationPlotDOM(id, d_model, existingVfEnabled, parentContainer) {
	const wrapperDiv = document.createElement('div');
	wrapperDiv.style.cssText = "border: 2px solid " + themeColor('#cbd5e1') + "; border-radius: 12px; margin-top: 10px; background: " + themeColor('#fff') + ";";
	wrapperDiv.setAttribute('data-migration-wrapper', id);
	wrapperDiv.setAttribute('data-d-model', d_model); // track d_model

	const toggleBtn = createVFToggleButton(id, d_model, existingVfEnabled);
	wrapperDiv.appendChild(toggleBtn);

	const plotDiv = document.createElement('div');
	plotDiv.id = id;
	const migrationHeight = 500;
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
				const migrationHeight = 500;
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
	return d_model <= 3 ? 850 : 520;
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

function _renderChartError(container, title, message) {
	if (window.PlotState) {
		PlotState.error(container, title, message);
		return;
	}
	container.innerHTML = '';
	const err = document.createElement('div');
	err.style.cssText = `
		display: flex; flex-direction: column; align-items: center; justify-content: center;
		gap: 6px; width: 100%; height: 100%; min-height: 160px; text-align: center; padding: 24px;
		box-sizing: border-box;
		background: ${themeColor('#fef2f2')};
		border: 2px solid ${themeColor('#ef4444')};
		border-radius: 12px;
		color: ${themeColor('#991b1b')};
		font-size: 0.85rem; line-height: 1.6;
	`;
	err.innerHTML = `
		<div style="font-weight: 700; font-size: 0.95rem;">${title}</div>
		<div style="max-width: 520px; opacity: 0.92;">${message}</div>
	`;
	container.appendChild(err);
}

function _renderMigrationError(plotDiv) {
	_renderChartError(
		plotDiv,
		'⚠️ Invalid Configuration — vector field unavailable',
		'No embedding space exists because <i>d<sub>model</sub></i> is not evenly divisible by <i>h</i>. Fix the configuration above to restore this visualization.'
	);
}

function render_migration_logic(id, tokens, start_h, end_h, layerNum, d_model, h_after, tokenStrings) {
	document.querySelectorAll('.weight-grid-viz').forEach(el => el.remove());
	const plotDiv = document.getElementById(id);
	if (!plotDiv) return;

	const loadingPlaceholder = plotDiv.querySelector('.plot-loading');
	if (loadingPlaceholder) loadingPlaceholder.remove();

	plotDiv.style.width = '100%';

	if (!window.persistentEmbeddingSpace || Object.keys(window.persistentEmbeddingSpace).length === 0) {
		_renderMigrationError(plotDiv);
		syncVFToggleButtonState(id, plotDiv, false);
		return;
	}

	const regData = transformerLabVisMigrationDataRegistry.get(id);
	const vfEnabled = regData && regData._vfEnabled && d_model < 4;

	if (d_model <= 3) {
		renderMigrationLowDim(id, plotDiv, tokens, start_h, end_h, layerNum, d_model, vfEnabled);
	} else {
		renderMigrationHighDim(id, plotDiv, tokens, start_h, end_h, layerNum, d_model);
	}

	syncVFToggleButtonState(id, plotDiv, vfEnabled);
	tlab_render_latex_matrix(id, plotDiv, tokens, start_h, end_h, h_after, d_model, tokenStrings);
}

function _mig_ec2d_vocab_series() {
	const data = [];
	Object.entries(window.persistentEmbeddingSpace).forEach(([word, vec]) => {
		data.push({ value: [vec[0], vec[1] || 0], name: displayToken(word) });
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

function _ec2d_render_dashed_arrow(startPx, endPx, color, lineW) {
	const dx = endPx[0] - startPx[0];
	const dy = endPx[1] - startPx[1];
	const len = Math.sqrt(dx * dx + dy * dy);

	if (len < 1) {
		return { type: 'circle', shape: { cx: startPx[0], cy: startPx[1], r: 3 }, style: { fill: color } };
	}

	const ux = dx / len, uy = dy / len;
	const headLen = Math.min(10, len * 0.3);
	const headW = Math.max(2.5, lineW * 2);
	const px = -uy, py = ux;
	const bx = endPx[0] - ux * headLen;
	const by = endPx[1] - uy * headLen;

	return {
		type: 'group',
		children: [
			{
				type: 'line',
				shape: { x1: startPx[0], y1: startPx[1], x2: bx, y2: by },
				style: { stroke: color, lineWidth: lineW, lineDash: [6, 4], opacity: 0.7 }
			},
			{
				type: 'polygon',
				shape: {
					points: [
						[endPx[0], endPx[1]],
						[bx + px * headW, by + py * headW],
						[bx - px * headW, by - py * headW]
					]
				},
				style: { fill: color, opacity: 0.7 }
			},
			{
				type: 'circle',
				shape: { cx: startPx[0], cy: startPx[1], r: Math.max(2, lineW) },
				style: { fill: color, stroke: '#fff', lineWidth: 1 }
			}
		]
	};
}

function _mig_ec2d_two_segment_arrow_series(tokens, raw_h, pe_h, end_h, d_model, nTokens) {
	// Segment 1: Raw Embedding → Embedding + PE (dashed style)
	const seg1Data = tokens.map((token, i) => ({
		value: [
			raw_h[i][0], d_model >= 2 ? raw_h[i][1] : 0,
			pe_h[i][0],  d_model >= 2 ? pe_h[i][1] : 0,
			i
		],
		_src: displayToken(tlab_get_top_word_only(raw_h[i])),
		_dst: displayToken(tlab_get_top_word_only(pe_h[i])),
		_pos: i + 1,
		_stage: 'Raw Emb → +PE'
	}));

	const seg1 = {
		type: 'custom',
		name: 'Embedding → +PE',
		renderItem: function (params, api) {
			const sPx = api.coord([api.value(0), api.value(1)]);
			const ePx = api.coord([api.value(2), api.value(3)]);
			const color = getPositionColor(api.value(4), nTokens);
			return _ec2d_render_dashed_arrow(sPx, ePx, color, 2.5);
		},
		encode: { x: [0, 2], y: [1, 3] },
		data: seg1Data,
		tooltip: { formatter: p =>
			`${p.data._stage}: '${p.data._src}' → '${p.data._dst}', position ${p.data._pos}` },
		z: 9
	};

	// Segment 2: Embedding + PE → Layer 1 Output (solid arrow)
	const seg2Data = tokens.map((token, i) => ({
		value: [
			pe_h[i][0],  d_model >= 2 ? pe_h[i][1] : 0,
			end_h[i][0], d_model >= 2 ? end_h[i][1] : 0,
			i
		],
		_src: displayToken(tlab_get_top_word_only(pe_h[i])),
		_dst: displayToken(tlab_get_top_word_only(end_h[i])),
		_pos: i + 1,
		_stage: '+PE → Layer 1 Out'
	}));

	const seg2 = {
		type: 'custom',
		name: 'Migration',
		renderItem: function (params, api) {
			const sPx = api.coord([api.value(0), api.value(1)]);
			const ePx = api.coord([api.value(2), api.value(3)]);
			const color = getPositionColor(api.value(4), nTokens);
			return _ec2d_render_arrow(sPx, ePx, color, 3);
		},
		encode: { x: [0, 2], y: [1, 3] },
		data: seg2Data,
		tooltip: { formatter: p =>
			`${p.data._stage}: '${p.data._src}' → '${p.data._dst}', position ${p.data._pos}` },
		z: 10
	};

	// Start markers at raw embedding positions
	const startMarkers = {
		type: 'custom',
		name: 'Raw Embedding',
		renderItem: function (params, api) {
			const px = api.coord([api.value(0), api.value(1)]);
			const color = getPositionColor(api.value(2), nTokens);
			return {
				type: 'circle',
				shape: { cx: px[0], cy: px[1], r: 5 },
				style: { fill: color, stroke: '#000', lineWidth: 1.5 }
			};
		},
		encode: { x: [0], y: [1] },
		data: tokens.map((token, i) => ({
			value: [
				raw_h[i][0], d_model >= 2 ? raw_h[i][1] : 0,
				i
			],
			_label: `Raw embedding: '${displayToken(tlab_get_top_word_only(raw_h[i]))}' pos ${i + 1}`
		})),
		tooltip: { formatter: p => p.data._label },
		z: 11
	};

	return [seg1, seg2, startMarkers];
}

function _mig_ec2d_arrow_series(tokens, start_h, end_h, d_model, nTokens, layerNum, raw_h) {
	// For layer 1, if raw embeddings are available, draw two-segment arrows
	if (layerNum === 1 && raw_h) {
		return _mig_ec2d_two_segment_arrow_series(tokens, raw_h, start_h, end_h, d_model, nTokens);
	}

	// Original single-segment arrow for layers > 1
	const data = tokens.map((token, i) => ({
		value: [
			start_h[i][0], d_model >= 2 ? start_h[i][1] : 0,
			end_h[i][0],   d_model >= 2 ? end_h[i][1] : 0,
			i
		],
		_src: displayToken(tlab_get_top_word_only(start_h[i])),
		_dst: displayToken(tlab_get_top_word_only(end_h[i])),
		_pos: i + 1
	}));

	return {
		type: 'custom',
		name: 'Migration',
		renderItem: function (params, api) {
			const sPx = api.coord([api.value(0), api.value(1)]);
			const ePx = api.coord([api.value(2), api.value(3)]);
			const color = getPositionColor(api.value(4), nTokens);
			return _ec2d_render_arrow(sPx, ePx, color, 3);
		},
		encode: { x: [0, 2], y: [1, 3] },
		data: data,
		tooltip: { formatter: p =>
			`From '${p.data._src}' to '${p.data._dst}', position ${p.data._pos}` },
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
		const arrowLen = maxArrowLen * normMag;  // length = magnitude, no minimum

		let ux = 0, uy = 0, uz = 0;
		if (pt.mag > 1e-10) { ux = pt.dx / pt.mag; uy = pt.dy / pt.mag; uz = pt.dz / pt.mag; }

		const endX = pt.x + ux * arrowLen;
		const endY = pt.y + uy * arrowLen;
		const endZ = pt.z + uz * arrowLen;

		series.push({
			name: 'VF', type: 'line3D',
			data: [[pt.x, pt.y, pt.z], [endX, endY, endZ]],
			lineStyle: { width: 3, color: color, opacity: 0.3 },  // ← constant width
			silent: true
		});

		tipData.push({
			value: [endX, endY, endZ],
			itemStyle: { color: color, opacity: 0.4 },
			symbolSize: 5,  // ← constant tip size
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
		const { ux, uy, arrowLen, lineWidth, normMag } = _vf2d_arrow_geometry(p, maxMag, maxArrowLen);
		return {
			// Store start, end, AND the original direction for pixel-space fallback
			value: [p.x, p.y, p.x + ux * arrowLen, p.y + uy * arrowLen, normMag, ux, uy],
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
			const lineW = 2;

			const dx = ePx[0] - sPx[0], dy = ePx[1] - sPx[1];
			const len = Math.sqrt(dx * dx + dy * dy);

			// Too short to draw meaningfully
			if (len < 2) return { type: 'circle', shape: { cx: sPx[0], cy: sPx[1], r: 1 }, style: { fill: color, opacity: 0.3 } };

			const ux2 = dx / len, uy2 = dy / len;

			// Ensure arrowhead never exceeds 40% of total length
			const headLen = Math.min(8, len * 0.3);
			// If headLen would be > 80% of len, skip arrowhead entirely
			if (headLen > len * 0.8) {
				// Just draw a simple line, no arrowhead
				return {
					type: 'line',
					shape: { x1: sPx[0], y1: sPx[1], x2: ePx[0], y2: ePx[1] },
					style: { stroke: color, lineWidth: lineW, opacity: 0.4 }
				};
			}

			const headW = 4;
			const px = -uy2, py = ux2;
			const bx = ePx[0] - ux2 * headLen, by = ePx[1] - uy2 * headLen;

			return {
				type: 'group', children: [
					{ type: 'line', shape: { x1: sPx[0], y1: sPx[1], x2: bx, y2: by }, style: { stroke: color, lineWidth: lineW, opacity: 0.4 } },
					{ type: 'polygon', shape: { points: [[ePx[0], ePx[1]], [bx + px * headW, by + py * headW], [bx - px * headW, by - py * headW]] }, style: { fill: color, opacity: 0.4 } },
					{ type: 'circle', shape: { cx: sPx[0], cy: sPx[1], r: 2 }, style: { fill: color, stroke: '#fff', lineWidth: 0.5, opacity: 0.3 } }
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

function _traj_vf_2d_plotly_traces(computed) {
	if (!computed) return [];
	const { points, maxMag, maxArrowLen } = computed;

	const traces = [];

	points.forEach(p => {
		const { ux, uy, arrowLen, normMag } = _vf2d_arrow_geometry(p, maxMag, maxArrowLen);
		if (arrowLen < 1e-6) return;

		const r = Math.round(normMag * 239 + (1 - normMag) * 59);
		const g = Math.round(normMag * 68  + (1 - normMag) * 130);
		const b = Math.round(normMag * 68  + (1 - normMag) * 246);
		const color = `rgba(${r},${g},${b},0.35)`;

		const endX = p.x + ux * arrowLen;
		const endY = p.y + uy * arrowLen;

		// Each VF arrow is a line+markers trace with an arrow marker at the end
		traces.push({
			type: 'scatter',
			x: [p.x, endX],
			y: [p.y, endY],
			mode: 'lines+markers',
			line: { width: 2, color: color },
			marker: {
				size: [3, 10],
				symbol: ['circle', 'arrow'],
				angleref: 'previous',
				color: color
			},
			hoverinfo: 'text',
			hovertemplate: `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})<br>|Δh|: ${p.mag.toFixed(4)}<extra></extra>`,
			showlegend: false,
			legendgroup: 'vf'
		});
	});

	// Add one dummy trace for the legend
	if (traces.length > 0) {
		traces[0].showlegend = true;
		traces[0].name = 'Vector Field';
	}

	return traces;
}

function _migration_render_2d_echarts(chart, migId, tokens, start_h, end_h, layerNum, d_model, vfEnabled) {
	const series = [];
	const nTokens = tokens.length;

	series.push(_mig_ec2d_vocab_series());

	// For layer 1, retrieve raw embeddings (before PE) from trajectory collector
	let raw_h = null;
	if (layerNum === 1 && window.tlab_trajectory_collector &&
		window.tlab_trajectory_collector.steps["00_raw"]) {
		raw_h = window.tlab_trajectory_collector.steps["00_raw"].data;
	}

	const arrowResult = _mig_ec2d_arrow_series(tokens, start_h, end_h, d_model, nTokens, layerNum, raw_h);

	// arrowResult is either a single series object or an array of series (for layer 1)
	if (Array.isArray(arrowResult)) {
		arrowResult.forEach(s => series.push(s));
	} else {
		series.push(arrowResult);
	}

	if (vfEnabled) {
		const { n_heads } = getTransformerConfig();
		const computed = _compute_vector_field_points_2d(migId, layerNum, d_model, n_heads);
		if (computed) {
			series.push(_vf_ec2d_custom_series(computed));
		}
	}

	chart.setOption({
		title: { text: `Layer ${layerNum}: Feature Migration`, left: 'center', 			textStyle: { fontSize: 14, color: themeColor('#1e293b') } },
		tooltip: { show: true, trigger: 'item', confine: true },
		xAxis: { type: 'value', name: 'Dim 0', nameLocation: 'center', nameGap: 25, splitLine: { lineStyle: { color: themeColor('#f0f0f0') } } },
		yAxis: { type: 'value', name: 'Dim 1', nameLocation: 'center', nameGap: 35, splitLine: { lineStyle: { color: themeColor('#f0f0f0') } } },
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
		data.push({ name: displayToken(word), value: [vec[0], vec[1] || 0, vec[2] || 0] });
	});
	return {
		name: 'Vocab Embeddings', type: 'scatter3D', data: data,
		symbol: 'diamond', symbolSize: 8,
		itemStyle: { color: 'rgba(100,116,139,0.8)', borderWidth: 1, borderColor: '#334155' },
		label: { show: true, position: 'top', distance: 5, formatter: p => p.name, textStyle: { fontSize: 10, color: themeColor('#475569') } }
	};
}

function _migration_render_3d_echarts(chart, migId, tokens, start_h, end_h, layerNum, d_model, vfEnabled) {
	const series = [];
	const legendData = ['Vocab Embeddings'];
	const nTokens = tokens.length;

	series.push(_mig_ec3d_vocab_series());

	// For layer 1, retrieve raw embeddings
	let raw_h = null;
	if (layerNum === 1 && window.tlab_trajectory_collector &&
		window.tlab_trajectory_collector.steps["00_raw"]) {
		raw_h = window.tlab_trajectory_collector.steps["00_raw"].data;
	}

	tokens.forEach((token, i) => {
		const color = getPositionColor(i, nTokens);
		const src = displayToken(tlab_get_top_word_only(start_h[i]));
		const dst = displayToken(tlab_get_top_word_only(end_h[i]));
		const label = `${src}→${dst} (${i + 1})`;
		legendData.push(label);

		if (layerNum === 1 && raw_h) {
			// Two-segment path for layer 1
			const rawSrc = displayToken(tlab_get_top_word_only(raw_h[i]));

			// Segment 1: Raw Embedding → Embedding + PE (dashed-style via thinner line)
			const rawFrom3 = raw_h[i].slice(0, 3);
			const peFrom3 = start_h[i].slice(0, 3);

			const shaftEnd1 = _computeArrowheadBase(rawFrom3, peFrom3, 0.4);
			series.push({
				name: label, type: 'line3D',
				data: [rawFrom3, shaftEnd1],
				lineStyle: { width: 3, color: color, opacity: 0.6 }
			});
			_add3DArrowheadSeries(series, rawFrom3, peFrom3, color, {
				lineWidth: 5, maxHeadLen: 0.4, spreadRatio: 0.3, name: label
			});

			// Segment 2: Embedding + PE → Layer Output (solid, thicker)
			const to3 = end_h[i].slice(0, 3);
			const shaftEnd2 = _computeArrowheadBase(peFrom3, to3, 0.5);
			series.push({
				name: label, type: 'line3D',
				data: [peFrom3, shaftEnd2],
				lineStyle: { width: 4, color: color, opacity: 0.85 }
			});
			_add3DArrowheadSeries(series, peFrom3, to3, color, {
				lineWidth: 7, maxHeadLen: 0.5, spreadRatio: 0.4, name: label
			});

			// Start marker at raw embedding position
			series.push({
				name: label, type: 'scatter3D',
				data: [{
					value: rawFrom3, symbolSize: 8,
					itemStyle: { color: color, borderWidth: 2, borderColor: '#000' },
					_hover: `Raw Embedding: '${rawSrc}' pos ${i + 1}`
				}],
				symbol: 'circle',
				tooltip: { formatter: p => p.data._hover }
			});

			// Mid marker at PE position (smaller, shows the bend point)
			series.push({
				name: label, type: 'scatter3D',
				data: [{
					value: peFrom3, symbolSize: 5,
					itemStyle: { color: color, borderWidth: 1, borderColor: '#fff', opacity: 0.8 },
					_hover: `+PE: '${src}' pos ${i + 1}`
				}],
				symbol: 'circle',
				tooltip: { formatter: p => p.data._hover }
			});
		} else {
			// Original single-segment arrow for layers > 1
			const from3 = start_h[i].slice(0, 3);
			const to3   = end_h[i].slice(0, 3);

			const shaftEnd = _computeArrowheadBase(from3, to3, 0.5);
			series.push({
				name: label, type: 'line3D',
				data: [from3, shaftEnd],
				lineStyle: { width: 4, color: color, opacity: 0.85 }
			});

			_add3DArrowheadSeries(series, from3, to3, color, {
				lineWidth: 7, maxHeadLen: 0.5, spreadRatio: 0.4, name: label
			});

			series.push({
				name: label, type: 'scatter3D',
				data: [{
					value: from3, symbolSize: 8,
					itemStyle: { color: color, borderWidth: 2, borderColor: '#000' },
					_hover: `Start: '${src}' pos ${i + 1}`
				}],
				symbol: 'circle',
				tooltip: { formatter: p => p.data._hover }
			});
		}
	});

	if (vfEnabled) {
		const { n_heads } = getTransformerConfig();
		const computed = _compute_vector_field_points_3d(migId, layerNum, d_model, n_heads);
		if (computed) series.push(..._vf_ec3d_series(computed));
	}

	chart.setOption({
		title: { text: `Layer ${layerNum}: Feature Migration`, left: 'center',
			textStyle: { fontSize: 14, color: themeColor('#1e293b') } },
		tooltip: { show: true, trigger: 'item', confine: true },
		legend: { data: legendData, type: 'scroll', orient: 'horizontal', bottom: 0,
			left: 'center', width: '92%', textStyle: { fontSize: 11, color: themeColor('#1e293b') } },
		xAxis3D: { type: 'value', name: 'Dim 0' },
		yAxis3D: { type: 'value', name: 'Dim 1' },
		zAxis3D: { type: 'value', name: 'Dim 2' },
		grid3D: _defaultGrid3DConfig({ bottom: 55 }),
		series: series,
		animation: false
	}, true);
}

function _traj_ec3d_line_series_with_arrows(tokenLabel, color, dataPoints, tIdx) {
	const seriesArr = [];
	const pts = dataPoints.map(p => p.data[tIdx].slice(0, 3));

	for (let i = 0; i < pts.length - 1; i++) {
		const from3 = pts[i];
		const to3   = pts[i + 1];

		// Shaft shortened to arrowhead base
		const shaftEnd = _computeArrowheadBase(from3, to3, 0.4);
		seriesArr.push({
			name: tokenLabel,
			type: 'line3D',
			data: [from3, shaftEnd],
			lineStyle: { width: 4, color: color, opacity: 0.85 }
		});

		// Oriented V-chevron arrowhead
		_add3DArrowheadSeries(seriesArr, from3, to3, color, {
			lineWidth: 6, maxHeadLen: 0.4, spreadRatio: 0.35, name: tokenLabel
		});
	}

	return seriesArr;
}

function renderMigrationLowDim(id, plotDiv, tokens, start_h, end_h, layerNum, d_model, vfEnabled) {
	// Purge any old Plotly chart on this div

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
	let chart = echarts.getInstanceByDom(plotDiv);
	if (!chart) chart = echarts.init(plotDiv);

	const axes = Array.from({ length: d_model }, (_, i) => ({
		dim: i, name: `Dim ${i}`
	}));

	// For layer 1, include raw embeddings as an additional starting point
	let raw_h = null;
	if (layerNum === 1 && window.tlab_trajectory_collector &&
		window.tlab_trajectory_collector.steps["00_raw"]) {
		raw_h = window.tlab_trajectory_collector.steps["00_raw"].data;
	}

	const data = [];
	tokens.forEach((token, i) => {
		const sourceWord = displayToken(tlab_get_top_word_only(start_h[i]));
		const destWord = displayToken(tlab_get_top_word_only(end_h[i]));

		if (layerNum === 1 && raw_h) {
			// Add raw embedding line (will appear as first trace)
			data.push({
				value: [...raw_h[i], i + 1],
				name: token,
				source: displayToken(tlab_get_top_word_only(raw_h[i])),
				destination: sourceWord,
				pos: i + 1,
				lineStyle: { opacity: 0.4, type: 'dashed' }
			});
		}

		data.push({
			value: [...end_h[i], i + 1],
			name: token,
			source: sourceWord,
			destination: destWord,
			pos: i + 1
		});
	});

	chart.setOption({
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

function syncVFToggleButtonState(id, plotDiv, vfEnabled) {
	const wrapper = plotDiv.closest('[data-migration-wrapper]');
	const toggleBtn = wrapper ? wrapper.querySelector('.migration-vf-toggle') : null;
	if (!toggleBtn) return;

	if (vfEnabled) {
		toggleBtn.dataset.mode = 'on';
		toggleBtn.textContent = ((window.TM && TM.lang && TM.lang() === 'de') ? '🧭 Vektorfeld ausblenden' : '🧭 Hide Vector Field');
		toggleBtn.style.background = '#dbeafe';
	} else {
		toggleBtn.dataset.mode = 'off';
		toggleBtn.textContent = ((window.TM && TM.lang && TM.lang() === 'de') ? '🧭 Vektorfeld zeigen' : '🧭 Show Vector Field');
		toggleBtn.style.background = themeColor('#ffffff');
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

function _vf_substitute_context_3d(realContext, substitutePos, x, y, z) {
	return realContext.map((row, idx) => {
		if (idx === substitutePos) return [x, y, z];
		return [...row];
	});
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

// ─── Helper: Build 2D embedding landmark trace ───
function _traj_build_embedding_landmarks_2D(embSnap, snapVocab, dimA, dimB) {
	const xs = [], ys = [], texts = [];
	for (const word of snapVocab) {
		const v = embSnap[word];
		xs.push(v[dimA] || 0);
		ys.push(v[dimB] || 0);
		texts.push(displayToken(word));
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
	heading.innerHTML = `<b>Token Trajectory — choose a dimension pair (${pairCount} possible)</b>`;
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

function _traj_build_endpoint_marker(x, y, tColor, tokenLabel, labels, tIdx, dataPoints, embSnap, snapVocab, isStart) {
	const pIdx = isStart ? 0 : dataPoints.length - 1;
	const logitWord = _traj_get_logit_word(dataPoints[pIdx].data[tIdx], embSnap, snapVocab);
	const label = isStart ? 'Start' : 'End';
	return {
		type: 'scatter',
		x: [isStart ? x[0] : x[x.length - 1]],
		y: [isStart ? y[0] : y[y.length - 1]],
		mode: 'markers',
		marker: {
			size: isStart ? 10 : 14,
			symbol: isStart ? 0 : 17,
			color: tColor,
			line: { width: isStart ? 2 : 1.5, color: '#000' }
		},
		legendgroup: tokenLabel,
		showlegend: false,
		hoverinfo: 'text',
		hovertemplate: '%{text}<extra></extra>',
		text: [`Token: ${labels[tIdx]} — ${label}<br>Stage: ${dataPoints[pIdx].name}<br>Nearest logit: <b>${logitWord}</b>`]
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
		traces.push(_traj_build_endpoint_marker(x, y, tColor, tokenLabel, labels, tIdx, dataPoints, embSnap, snapVocab, 1));
		traces.push(_traj_build_endpoint_marker(x, y, tColor, tokenLabel, labels, tIdx, dataPoints, embSnap, snapVocab, 0));

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
		legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.2, font: { size: 11, color: themeColor('#1e293b') } }
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
function _traj_high_dim_pair_score(dataPoints, dimA, dimB) {
	let n = 0, sumA = 0, sumB = 0, sumA2 = 0, sumB2 = 0;
	dataPoints.forEach(p => {
		(p.data || []).forEach(v => {
			if (!v) return;
			const a = v[dimA] || 0, b = v[dimB] || 0;
			sumA += a; sumB += b; sumA2 += a * a; sumB2 += b * b; n++;
		});
	});
	if (!n) return 0;
	return (sumA2 / n - (sumA / n) ** 2) + (sumB2 / n - (sumB / n) ** 2);
}

function _traj_render_high_dimensional(trajDiv, tokens, labels, dataPoints, d_model, embSnap, snapVocab) {
	const pairs = _traj_generate_dimension_pairs(d_model);
	_traj_ensure_heading(trajDiv, pairs.length);

	let controls = trajDiv.querySelector('[data-traj-controls]');
	if (!controls) {
		controls = document.createElement('div');
		controls.setAttribute('data-traj-controls', 'true');
		controls.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px 12px; align-items:center; justify-content:center; padding:4px 10px 12px;';
		controls.innerHTML = '<label style="font:600 0.82rem Barlow, system-ui, sans-serif; color:#1e40af;">Dimension pair: <select data-traj-pair style="padding:4px 8px; border:1px solid #93c5fd; border-radius:6px; background:#fff;"></select></label>';
		trajDiv.appendChild(controls);
	}
	const select = controls.querySelector('[data-traj-pair]');
	if (!select) return;

	const best = pairs.reduce((acc, pair) => {
		const score = _traj_high_dim_pair_score(dataPoints, pair[0], pair[1]);
		return (!acc || score > acc.score) ? { pair, score } : acc;
	}, null).pair;

	if (!select.options.length) {
		pairs.forEach(pair => {
			const option = document.createElement('option');
			option.value = pair[0] + ',' + pair[1];
			option.textContent = `Dim ${pair[0]} / Dim ${pair[1]}`;
			select.appendChild(option);
		});
	}
	select.value = best[0] + ',' + best[1];

	const grid = _traj_ensure_grid(trajDiv);
	function renderPair(a, b) {
		grid.innerHTML = '';
		_traj_render_single_slice(grid, tokens, labels, dataPoints, a, b, embSnap, snapVocab);
	}
	select.onchange = function () {
		const parts = select.value.split(',').map(Number);
		renderPair(parts[0], parts[1]);
	};
	renderPair(best[0], best[1]);
}

function _traj_build_2d_token_traces(tokens, labels, dataPoints, embSnap, snapVocab) {
	const traces = [];
	const annotations = [];

	traces.push(_traj_build_embedding_landmarks_2D(embSnap, snapVocab, 0, 1));

	tokens.forEach((token, tIdx) => {
		if (!dataPoints.every(p => p.data && p.data[tIdx])) return;

		const x = dataPoints.map(p => p.data[tIdx][0]);
		const y = dataPoints.map(p => p.data[tIdx][1]);
		const tColor = getPositionColor(tIdx, tokens.length);
		const tokenLabel = `${labels[tIdx]} (${tIdx + 1})`;
		const hoverTexts = _traj_build_hover_texts(tIdx, labels, dataPoints, embSnap, snapVocab);

		traces.push(_traj_build_token_line_trace(x, y, tokenLabel, tColor, hoverTexts));
		traces.push(_traj_build_endpoint_marker(x, y, tColor, tokenLabel, labels, tIdx, dataPoints, embSnap, snapVocab, 1));
		traces.push(_traj_build_endpoint_marker(x, y, tColor, tokenLabel, labels, tIdx, dataPoints, embSnap, snapVocab, 0));

		if (tIdx === 0) {
			annotations.push(..._traj_build_stage_annotations(x, y, dataPoints));
		}
	});

	return { traces, annotations };
}

function _traj_render_low_dimensional(trajDiv, tokens, labels, dataPoints, d_model, embSnap, snapVocab, vfEnabled) {
	if (d_model === 3) {
		_traj_render_3d_echarts(trajDiv, tokens, labels, dataPoints, embSnap, snapVocab, vfEnabled);
		return;
	}

	// ── 2D: Plotly path ──
	const result = _traj_build_2d_token_traces(tokens, labels, dataPoints, embSnap, snapVocab);

	// ── VF overlay (all-layers) — now as TRACES, not annotations ──
	let vfTraces = [];
	if (vfEnabled) {
		const { n_heads, n_layers } = getTransformerConfig();
		const computed = _compute_trajectory_vf_2d(d_model, n_heads, n_layers);
		if (computed) vfTraces = _traj_vf_2d_plotly_traces(computed);
	}

	const axisTemplate = {
		showticklabels: false, showgrid: true, zeroline: false,
		title: { text: "" }, backgroundcolor: "#f9fafb"
	};

	const layout = {
		title: '<b>Token Trajectory: Embedding + Position through the Layers</b>',
		xaxis: axisTemplate, yaxis: axisTemplate,
		annotations: result.annotations,  // ← only stage labels, no VF annotations
		margin: { l: 10, r: 10, b: 50, t: 80 },
		showlegend: true,
		legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.1, font: { size: 14, color: themeColor('#1e293b') } }
	};

	// Combine token traces + VF traces
	Plotly.react(trajDiv.id, [...result.traces, ...vfTraces], layout);
}

// ─── Main 3D ECharts renderer ───────────────────────────────

function _traj_render_3d_echarts(trajDiv, tokens, labels, dataPoints, embSnap, snapVocab, vfEnabled) {
	let chart = echarts.getInstanceByDom(trajDiv);
	if (!chart) chart = echarts.init(trajDiv);

	const series = [];
	const legendData = [];

	// 1. Vocabulary embedding landmarks
	series.push(_traj_ec3d_landmark_series(embSnap, snapVocab));
	legendData.push('Vocab Embeddings');

	// 2. Per-token trajectories
	tokens.forEach((token, tIdx) => {
		const hasData = dataPoints.every(p => p.data && p.data[tIdx]);
		if (!hasData) return;

		const tColor = getPositionColor(tIdx, tokens.length);
		const tokenLabel = `${labels[tIdx]} (${tIdx + 1})`;
		legendData.push(tokenLabel);

		series.push(..._traj_ec3d_line_series_with_arrows(tokenLabel, tColor, dataPoints, tIdx));
		series.push(_traj_ec3d_marker_series(
			tokenLabel, tColor, dataPoints, tIdx, labels, embSnap, snapVocab
		));
	});

	// 3. All-layers vector field overlay
	if (vfEnabled) {
		const { n_heads, n_layers } = getTransformerConfig();
		const computed = _compute_trajectory_vf_3d(3, n_heads, n_layers);
		if (computed) series.push(..._vf_ec3d_series(computed));
	}

	chart.setOption(_traj_ec3d_option(series, legendData), true);

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
			return { name: displayToken(word), value: [v[0], v[1] || 0, v[2] || 0] };
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
			textStyle: { fontSize: 10, color: themeColor('#475569'), fontFamily: 'Inter, sans-serif' }
		}
	};
}

// ─── Step markers (hover, start/end emphasis) for one token ──

function _traj_ec3d_marker_series(tokenLabel, color, dataPoints, tIdx, labels, embSnap, snapVocab) {
	const data = dataPoints.map((p, pIdx) => {
		const fromStage = pIdx > 0 ? dataPoints[pIdx - 1].name : '(start)';
		const hoverHtml = buildTrajectoryHoverText(
			labels[tIdx], tIdx, fromStage, p.name,
			p.data[tIdx], embSnap, snapVocab
		);

		const isStart = pIdx === 0;

		return {
			value: p.data[tIdx].slice(0, 3),
			symbolSize: isStart ? 10 : 4,
			itemStyle: {
				color: color,
				borderWidth: isStart ? 2 : 0,
				borderColor: '#000',
				opacity: isStart ? 1 : 0.01   // ← invisible but still hoverable
			},
			_hover: hoverHtml
		};
	});

	return {
		name: tokenLabel,
		type: 'scatter3D',
		data: data,
		symbol: 'circle',
		tooltip: { formatter: params => params.data._hover }
	};
}

// ─── Full chart option ───────────────────────────────────────

function _traj_ec3d_option(series, legendData) {
	return {
		title: {
			text: 'Token Trajectory: Embedding → +Position → Layer Outputs',
			left: 'center', top: 10,
			textStyle: { fontSize: 14, fontWeight: 'bold', color: themeColor('#1e293b') }
		},
		tooltip: { show: true, trigger: 'item', confine: true },
		legend: {
			data: legendData,
			orient: 'horizontal',
			bottom: 5, left: 'center',
			textStyle: { fontSize: 12, color: themeColor('#1e293b') }
		},
		xAxis3D: { type: 'value', name: 'Dim 0' },
		yAxis3D: { type: 'value', name: 'Dim 1' },
		zAxis3D: { type: 'value', name: 'Dim 2' },
		grid3D:_defaultGrid3DConfig({
			axisLine:    { lineStyle: { color: themeColor('#cbd5e1') } },
			axisPointer: { show: false }
		}),
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

	const placeholder = trajDiv.querySelector('.traj-loading-placeholder');
	if (placeholder) placeholder.remove();
	trajDiv.style.display        = 'block';
	trajDiv.style.alignItems     = '';
	trajDiv.style.justifyContent = '';
	trajDiv.style.width          = '100%';

	const labels = displayTokens || tokens.map((t, i) => {
		if (typeof t === 'string') return displayToken(t);
		return displayToken(tlab_get_top_word_only(t));
	});

	const dataPoints = sortedKeys.map(k => steps[k]);
	const { embSnap, snapVocab } = _traj_snapshot_embeddings();
	const vfEnabled = window._trajectoryVfEnabled && d_model <= 3;

	if (d_model >= 4) {
		_traj_render_high_dimensional(trajDiv, tokens, labels, dataPoints, d_model, embSnap, snapVocab);
		requestAnimationFrame(() => {
			const actualHeight = trajDiv.scrollHeight;
			trajDiv.style.height    = actualHeight + 'px';
			trajDiv.style.minHeight = actualHeight + 'px';
		});
	} else {
		_traj_render_low_dimensional(trajDiv, tokens, labels, dataPoints, d_model, embSnap, snapVocab, vfEnabled);
	}
}

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

			if (fromItem.word === toItem.word) {
				if (fromProb === toProb) {
					return `${colorCmd} \\text{${cleanFrom}}`;
				}
				const arrow = toProb > fromProb ? '\\uparrow' : '\\downarrow';
				return `${colorCmd} \\text{${cleanFrom}} (${fromProb}\\% \\,${arrow}\\, ${toProb}\\%)`;
			}

			return `${colorCmd} \\text{${cleanFrom}} (${fromProb}\\%) \\rightarrow \\text{${cleanTo}} (${toProb}\\%)`;
		}).join(' & ');
	}).join(' \\\\ ');
}

function ensureLatexDebugDiv(id, plotDiv) {
	let latexDiv = document.getElementById(id + '-latex-debug');
	if (!latexDiv) {
		latexDiv = document.createElement('div');
		latexDiv.id = id + '-latex-debug';
		latexDiv.style.cssText = 'margin-top: 20px; overflow-x: auto; font-size: 0.8rem; max-width: 100%; box-sizing: border-box;';

		plotDiv.parentNode.insertBefore(latexDiv, plotDiv.nextSibling);
	}
	return latexDiv;
}

function tlab_render_latex_matrix(id, plotDiv, tokens, start_h, end_h, h_after, d_model, tokenStrings) {
	const vocabRows = buildVocabTransitionRows(tokens, start_h, end_h, d_model);
	const ts = tokenStrings || null;

	let stageLabel = 'layer output';
	const layerMatch = id.match(/migration-layer-(\d+)/);
	if (layerMatch) {
		stageLabel = `out layer ${parseInt(layerMatch[1])}`;
	}

	const hAfterMatrix = matrixToPmatrixLabeled(h_after, ts, stageLabel);
	const isDe = !!(window.TM && TM.lang && TM.lang() === 'de');
	const interpNote = isDe
		? 'Die linke Matrix ist der Hidden State $h_\\text{after}$ nach diesem Layer. Die rechte Gleichung projiziert ihn mit der Vokabular-Matrix $W_\\text{vocab}$ auf Wörter: Sie zeigt, welche Wörter der Layer nahelegt und wie sich diese Repräsentationen verschieben. In der Tabelle stehen gleiche Wörter ohne Prozentwerte; ↑/↓ zeigt, ob die Wahrscheinlichkeit steigt oder fällt, ein Wortwechsel steht als alt → neu. Jede Zeile gehört zu einer Token-Position; die Spalten sind die wahrscheinlichsten Wörter vor und nach der Projektion. Das ist Logit-Lens/Feature Migration und nur zur Interpretation; der Forward-Pass benutzt diese Projektion nicht.'
		: 'The left matrix is the hidden state $h_\\text{after}$ after this layer. The equation on the right projects it with the vocabulary matrix $W_\\text{vocab}$ onto words: it shows which words the layer suggests and how those representations shift. In the table, unchanged words appear without percentages; ↑/↓ shows whether their probability rises or falls, and a word change appears as old → new. Each row belongs to one token position; the columns are the most likely words before and after the projection. This is logit lens/feature migration and only for interpretation; the forward pass does not use it.';
	const latexString = `<div style="overflow-x: auto; overflow-y: hidden; max-width: 100%; padding-bottom: 10px;">
<div style="display:block; margin:6px 0;">$$h_\\text{after} = ${hAfterMatrix}$$</div>
<p style="font-size:.78rem; color:var(--mn-text-secondary, #475569); margin:8px 0; line-height:1.45;">${interpNote}</p>
<div style="display:block; margin:6px 0;">$$h_\\text{after} \\cdot W_\\text{vocab} = \\begin{pmatrix} ${vocabRows} \\end{pmatrix}$$</div>
</div>`;

	const latexDiv = ensureLatexDebugDiv(id, plotDiv);

	if (latexDiv._lastLatexHash === latexString) return;
	latexDiv._lastLatexHash = latexString;

	heightLockedMathUpdate([latexDiv], [latexString]);
}

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
		word: displayToken(s.word).replace(/#/g, '\\#').replace(/_/g, '\\_'),
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
		PlotState.loadingMarkup('Wait for Positional Shift Plot to load...')
	);

	return injectedEmbeddings;
}

function _execute_shift_render(tokenStrings, d_model, injectedEmbeddings) {
	const container = document.getElementById('transformer-pe-shift-plot');
	if (!Array.isArray(tokenStrings) || typeof tokenStrings[0] !== 'string') {
		console.error("Plotting requires an array of string tokens.");
		return;
	}

	if (!window.persistentEmbeddingSpace || Object.keys(window.persistentEmbeddingSpace).length === 0) {
		_renderChartError(
			container,
			'⚠️ Invalid Configuration — positional shift unavailable',
			'No embedding space exists because <i>d<sub>model</sub></i> is not evenly divisible by <i>h</i>. Fix the configuration above to restore this visualization.'
		);
		return;
	}

	// Unified cleanup: dispose any existing ECharts instance
	const existingChart = echarts.getInstanceByDom(container);
	if (existingChart) dispose(existingChart);
	container.innerHTML = '';

	if (d_model === 3) {
		_shift_render_3d_echarts(container, tokenStrings, injectedEmbeddings);
	} else if (d_model <= 2) {
		_shift_render_2d_echarts(container, tokenStrings, d_model, injectedEmbeddings);
	} else {
		// d_model >= 4  →  existing ECharts parallel-coordinates path
		const echartsData = [];
		tokenStrings.forEach((token, pos) => {
			const semanticBase = window.persistentEmbeddingSpace[token];
			if (!semanticBase) return;
			const combined = injectedEmbeddings[pos];
			if (!combined) return;
			const tokenColor = `hsl(${getHueFromToken(token)}, 75%, 50%)`;
			echartsData.push(
				buildShiftEChartsEntry(token, pos, semanticBase, combined, tokenColor)
			);
		});
		renderShiftECharts(container, echartsData, d_model);
	}
}

function _shift_render_2d_echarts(container, tokenStrings, d_model, injectedEmbeddings) {
	const chart = echarts.init(container);
	const series = [];

	tokenStrings.forEach((token, pos) => {
		const semanticBase = window.persistentEmbeddingSpace[token];
		if (!semanticBase) return;
		const combined = injectedEmbeddings[pos];
		if (!combined) return;

		const tokenColor = `hsl(${getHueFromToken(token)}, 75%, 50%)`;
		const dispToken = displayToken(token);
		const name = `${dispToken} (pos ${pos})`;

		const x0 = semanticBase[0];
		const y0 = d_model >= 2 ? semanticBase[1] : 0;
		const x1 = combined[0];
		const y1 = d_model >= 2 ? combined[1] : 0;

		series.push({
			type: 'custom',
			name: name,
			renderItem: function (params, api) {
				const sPx = api.coord([api.value(0), api.value(1)]);
				const ePx = api.coord([api.value(2), api.value(3)]);
				return _ec2d_render_arrow(sPx, ePx, tokenColor, 3);
			},
			encode: { x: [0, 2], y: [1, 3] },
			data: [{ value: [x0, y0, x1, y1] }],
			tooltip: {
				formatter: () =>
				`Token: <b>${dispToken}</b><br>Pos: ${pos}<br>` +
				`Base: (${x0.toFixed(3)}, ${y0.toFixed(3)})<br>` +
				`+PE:  (${x1.toFixed(3)}, ${y1.toFixed(3)})`
			},
			z: 10
		});

		series.push({
			type: 'scatter', name: name,
			data: [{ value: [x0, y0], _hover: `${dispToken} base` }],
			symbolSize: 7,
			itemStyle: { color: tokenColor, borderWidth: 2, borderColor: themeColor('#1e293b') },
			tooltip: { formatter: p => `<b>${dispToken}</b> base embedding` },
			z: 12
		});

		series.push({
			type: 'scatter', name: name,
			data: [{ value: [x1, y1], _hover: `${dispToken} +PE` }],
			symbol: 'triangle', symbolSize: 11,
			itemStyle: { color: tokenColor, borderWidth: 1, borderColor: '#ffffff' },
			label: { show: true, formatter: dispToken, position: 'top', color: tokenColor, fontSize: 9 },
			tooltip: { formatter: p => `<b>${dispToken}</b> + positional encoding` },
			z: 12
		});
	});

	const axisTextColor = themeColor('#64748b');
	const axisNameColor = themeColor('#94a3b8');
	const axisLineColor = themeColor('#cbd5e1');

	chart.setOption({
		title: {
			text: (window.TM && TM.lang && TM.lang() === 'de') ? 'Semantischer Vektor → + Positionsverschiebung' : 'Semantic Vector → + Positional Shift', left: 'center',
			textStyle: { fontSize: 14, color: themeColor('#1e293b') }
		},
		backgroundColor: 'transparent',
		tooltip: { show: true, trigger: 'item', confine: true },
		legend: { show: true, bottom: 5, left: 'center', textStyle: { fontSize: 11, color: axisTextColor } },
		xAxis: {
			type: 'value', name: 'Dim 0',
			nameLocation: 'center', nameGap: 25,
			nameTextStyle: { color: axisNameColor },
			axisLabel: { color: axisTextColor },
			axisLine: { lineStyle: { color: axisLineColor } },
			splitLine: { lineStyle: { color: themeColor('#f0f0f0') } }
		},
		yAxis: {
			type: 'value',
			name: d_model >= 2 ? 'Dim 1' : '',
			nameLocation: 'center', nameGap: 35,
			nameTextStyle: { color: axisNameColor },
			axisLabel: { color: axisTextColor },
			axisLine: { lineStyle: { color: axisLineColor } },
			splitLine: { lineStyle: { color: themeColor('#f0f0f0') } }
		},
		grid: { top: 50, bottom: 60, left: 55, right: 30 },
		series: series,
		animation: false
	}, true);

	_wireEChartsResize(container, '_ecShiftResize');
}

function _shift_render_3d_echarts(container, tokenStrings, injectedEmbeddings) {
	const chart = echarts.init(container);
	const series = [];
	const legendData = [];

	tokenStrings.forEach((token, pos) => {
		const semanticBase = window.persistentEmbeddingSpace[token];
		if (!semanticBase) return;
		const combined = injectedEmbeddings[pos];
		if (!combined) return;

		const tokenColor = `hsl(${getHueFromToken(token)}, 75%, 50%)`;
		const dispToken = displayToken(token);
		const name = `${dispToken} (pos ${pos})`;
		legendData.push(name);

		const from3 = [semanticBase[0], semanticBase[1], semanticBase[2]];
		const to3   = [combined[0], combined[1], combined[2]];

		series.push({
			name: name, type: 'line3D',
			data: [from3, to3],
			lineStyle: { width: 6, color: tokenColor, opacity: 0.85 }
		});

		series.push({
			name: name, type: 'scatter3D',
			data: [
				{
					value: from3, symbolSize: 8,
					itemStyle: { color: tokenColor, borderWidth: 2, borderColor: themeColor('#1e293b') },
					_hover: `${dispToken} base (pos ${pos})`
				},
				{
					value: to3, symbolSize: 13,
					itemStyle: { color: tokenColor, borderWidth: 2, borderColor: '#ffffff' },
					label: { show: true, formatter: dispToken, color: tokenColor, fontSize: 9 },
					_hover: `${dispToken} + PE (pos ${pos})`
				}
			],
			symbol: 'circle',
			tooltip: { formatter: p => p.data._hover }
		});
	});

	const axis3DText = themeColor('#94a3b8');
	const axis3DLine = themeColor('#475569');

	chart.setOption({
		title: {
			text: 'Semantic Vector → + Positional Shift', left: 'center',
			textStyle: { fontSize: 14, color: themeColor('#1e293b') }
		},
		backgroundColor: 'transparent',
		tooltip: { show: true, trigger: 'item', confine: true },
		legend: {
			data: legendData, type: 'scroll', orient: 'horizontal',
			bottom: 0, left: 'center', width: '92%', textStyle: { fontSize: 11, color: axis3DText }
		},
		xAxis3D: {
			type: 'value', name: 'Dim 0',
			nameTextStyle: { color: axis3DText },
			axisLabel: { color: axis3DText },
			axisLine: { lineStyle: { color: axis3DLine } },
			splitLine: { lineStyle: { color: themeColor('#334155') } }
		},
		yAxis3D: {
			type: 'value', name: 'Dim 1',
			nameTextStyle: { color: axis3DText },
			axisLabel: { color: axis3DText },
			axisLine: { lineStyle: { color: axis3DLine } },
			splitLine: { lineStyle: { color: themeColor('#334155') } }
		},
		zAxis3D: {
			type: 'value', name: 'Dim 2',
			nameTextStyle: { color: axis3DText },
			axisLabel: { color: axis3DText },
			axisLine: { lineStyle: { color: axis3DLine } },
			splitLine: { lineStyle: { color: themeColor('#334155') } }
		},
		grid3D: _defaultGrid3DConfig({ bottom: 55 }),
		series: series,
		animation: false
	}, true);

	_wireEChartsResize(container, '_ecShiftResize');
}

function _wireEChartsResize(container, key) {
	if (!container[key]) {
		container[key] = () => {
			const c = echarts.getInstanceByDom(container);
			if (c) c.resize();
		};
		window.addEventListener('resize', container[key]);
	}
}

function getHueFromToken(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	return Math.abs(hash) % 360;
}

function buildShiftEChartsEntry(token, pos, semanticBase, combined, tokenColor) {
	return {
		value: semanticBase.flatMap((val, i) => [val, combined[i]]),
		name: `${displayToken(token)} (pos ${pos})`,
		lineStyle: { color: tokenColor }
	};
}

function renderShiftECharts(container, echartsData, d_model) {
	const myChart = echarts.init(container);
	const axes = [];
	const axisTextColor = themeColor('#64748b');
	const axisNameColor = themeColor('#94a3b8');
	const axisLineColor = themeColor('#cbd5e1');
	for (let i = 0; i < d_model; i++) {
		axes.push(
			{
				dim: i * 2,
				name: `D${i} Base`,
				nameTextStyle: { color: axisNameColor },
				axisLabel: { color: axisTextColor },
				axisLine: { lineStyle: { color: axisLineColor } }
			},
			{
				dim: i * 2 + 1,
				name: `D${i} +PE`,
				nameTextStyle: { color: axisNameColor },
				axisLabel: { color: axisTextColor },
				axisLine: { lineStyle: { color: axisLineColor } }
			}
		);
	}

	myChart.setOption({
		backgroundColor: 'transparent',
		title: {
			text: (window.TM && TM.lang && TM.lang() === 'de') ? "Semantischer Vektor → + Positionsverschiebung" : "Semantic Vector → + Positional Shift",
			left: 'center',
			textStyle: { fontSize: 14, color: themeColor('#1e293b') }
		},
		tooltip: { trigger: 'item', formatter: p => `Token: <b>${p.name}</b>` },
		legend: { data: echartsData.map(d => d.name), bottom: 0, left: 'center', textStyle: { fontSize: 10, color: themeColor('#1e293b') } },
		grid: { top: 50, bottom: 55, left: 20, right: 20 },
		parallelAxis: axes,
		series: [{
			type: 'parallel', data: echartsData,
			lineStyle: { width: 2, opacity: 0.6 },
			emphasis: { lineStyle: { width: 5 } }
		}]
	});
	myChart.resize();
}

function tf_layer_norm(x, gamma, beta) {
	return tidy(() => {
		const { mean, variance } = tf.moments(x, -1, true);
		const tf_epsilon = scalar(epsilon);
		const normalized = x.sub(mean).div(tf.sqrt(variance.add(tf_epsilon)));
		return normalized.mul(gamma).add(beta);
	});
}

function tf_gelu(x) {
	return tidy(() => {
		const half = scalar(0.5);
		const one = scalar(1);
		const sqrtTwo = scalar(Math.SQRT2);
		return x.mul(half).mul(one.add(tf.erf(x.div(sqrtTwo))));
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
	background: ${themeColor('#fef2f2')};
	border: 2px solid ${themeColor('#ef4444')};
	border-radius: 8px;
	font-size: 0.85rem;
	color: ${themeColor('#991b1b')};
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

	if (msgDiv) _renderTemmlOnElements([msgDiv]);
}

function getValidHeads(d_model) {
	const maxHeads = parseInt(document.getElementById('transformer-heads').max) || 8;
	const valid = [];
	for (let candidate = 1; candidate <= maxHeads; candidate++) {
		if (d_model % candidate === 0) valid.push(candidate);
	}
	return valid;
}

function getValidDimensions(h) {
	const minDim = parseInt(document.getElementById('transformer-dimension-model').min) || 2;
	const maxDim = parseInt(document.getElementById('transformer-dimension-model').max) || 16;
	const valid = [];
	for (let candidate = minDim; candidate <= maxDim; candidate++) {
		if (candidate % h === 0) valid.push(candidate);
	}
	return valid;
}

function setSliderOutline(sliderId, outline) {
	const el = document.getElementById(sliderId);
	if (el) el.style.outline = outline;
}

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

// ═══════════════════════════════════════════════════════════════
// Vector Math — v9 NUCLEAR REWRITE
//
// Strategy: The input value is stored in a JS variable, NOT
// read from the DOM. The DOM input is just a view. All renders
// read from the JS variable. A MutationObserver + polling loop
// ensures the DOM input always reflects the JS variable.
//
// This makes it IMPOSSIBLE for any external DOM mutation to
// lose the user's input, because the source of truth is a
// plain JS string, not a DOM element.
// ═══════════════════════════════════════════════════════════════

// ── Source of truth: a plain JS string ──
window._vmInputValue = '';
window._vmInputSelStart = 0;
window._vmInputSelEnd = 0;

// ── Guardian: runs every 50ms and restores input if wiped ──
(function _vmStartGuardian() {
    setInterval(() => {
        const el = document.getElementById('transformer-vector-math-input');
        if (!el) return;

        // If the DOM input was cleared but our JS variable has content,
        // restore it immediately
        if (el.value === '' && window._vmInputValue !== '') {
            el.value = window._vmInputValue;
            try {
                if (document.activeElement === el) {
                    el.setSelectionRange(window._vmInputSelStart, window._vmInputSelEnd);
                }
            } catch(e) {}
        }

        // If the DOM input has content that DIFFERS from our variable,
        // and the user is actively editing, trust the DOM
        if (document.activeElement === el && el.value !== '' && el.value !== window._vmInputValue) {
            window._vmInputValue = el.value;
            window._vmInputSelStart = el.selectionStart;
            window._vmInputSelEnd = el.selectionEnd;
        }
    }, 50);
})();

const vectorMathObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        // If ANY observed element is intersecting, consider it in viewport
        if (entry.isIntersecting) {
            vectorMathRenderRegistry.isInViewport = true;
        }

        // Only set to false if the STABLE parent (not just the result div)
        // goes out of viewport
        if (!entry.isIntersecting && entry.target.id !== 'transformer-vector-math-result') {
            vectorMathRenderRegistry.isInViewport = false;
        }
    });

    // If in viewport and pending update, execute it
    if (vectorMathRenderRegistry.isInViewport && vectorMathRenderRegistry.needsUpdate) {
        calculate_vector_math();
        vectorMathRenderRegistry.needsUpdate = false;
    }
}, { threshold: 0 });

setInterval(() => {
	const el = document.getElementById('transformer-vector-math-input');
	if (!el) return;

	// Only restore if the element is NOT focused (don't fight user edits)
	if (el.value === '' && window._vmInputValue !== '' && document.activeElement !== el) {
		el.value = window._vmInputValue;
	}

	if (document.activeElement === el && el.value !== '' && el.value !== window._vmInputValue) {
		window._vmInputValue = el.value;
		window._vmInputSelStart = el.selectionStart;
		window._vmInputSelEnd = el.selectionEnd;
	}
}, 50);

function observer_vector_math() {
	const vmResult = document.getElementById('transformer-vector-math-result');
	const vmInput  = document.getElementById('transformer-vector-math-input');
	if (vmResult) vectorMathObserver.observe(vmResult);
	if (vmInput) {
		const stableParent = vmInput.closest('div[style*="background"]');
		if (stableParent) vectorMathObserver.observe(stableParent);

		// Attach the input tracking events ONCE
		if (!vmInput._vmEventsAttached) {
			vmInput._vmEventsAttached = true;

			vmInput.addEventListener('input', () => {
				window._vmInputValue = vmInput.value;
				window._vmInputSelStart = vmInput.selectionStart;
				window._vmInputSelEnd = vmInput.selectionEnd;
			});

			vmInput.addEventListener('keyup', () => {
				window._vmInputValue = vmInput.value;
				window._vmInputSelStart = vmInput.selectionStart;
				window._vmInputSelEnd = vmInput.selectionEnd;
			});

			// Add to the input element setup in observer_vector_math()
			vmInput.addEventListener('blur', (e) => {
				// Allow blur ONLY for truly intentional actions:
				// 1. User pressed Enter/Tab/Escape (flagged via keydown)
				// 2. User clicked on something OUTSIDE the vector-math area
				//    (relatedTarget exists AND is not inside the VM container)

				if (window._vmIntentionalBlur) {
					window._vmIntentionalBlur = false;
					return; // Let it blur naturally
				}

				// Check if relatedTarget is inside the vector-math container
				// (which means it was a DOM mutation, not a real user click outside)
				const vmContainer = vmInput.closest('div[style*="background"]');
				const targetIsInsideVM = e.relatedTarget && vmContainer && vmContainer.contains(e.relatedTarget);
				const targetIsResultDiv = e.relatedTarget && e.relatedTarget.closest('#transformer-vector-math-result');

				// If relatedTarget is null (DOM mutation stole focus) OR
				// relatedTarget is inside the VM area (Temml reflow artifact),
				// then refocus
				if (!e.relatedTarget || targetIsInsideVM || targetIsResultDiv) {
					requestAnimationFrame(() => {
						const el = document.getElementById('transformer-vector-math-input');
						if (el && document.activeElement !== el) {
							el.focus({ preventScroll: true });
							try {
								el.setSelectionRange(window._vmInputSelStart, window._vmInputSelEnd);
							} catch(e) {}
						}
					});
				}
				// else: relatedTarget is outside the VM area → real click outside → let it blur
			});

			// Mark intentional blurs
			vmInput.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') {
					window._vmIntentionalBlur = true;
				}
			});

			// Also track selection changes (click, shift+arrow, etc.)
			vmInput.addEventListener('select', () => {
				window._vmInputSelStart = vmInput.selectionStart;
				window._vmInputSelEnd = vmInput.selectionEnd;
			});
		}
	}
}

// ── Result rendering: completely isolated from input ──
function _vmRenderResult(html) {
    const resDiv = document.getElementById('transformer-vector-math-result');
    if (!resDiv) return;

    // Skip if content hasn't changed
    if (vectorMathRenderRegistry._lastResultHtml === html) return;
    vectorMathRenderRegistry._lastResultHtml = html;

    // Snapshot the input BEFORE touching the DOM
    const inputEl = document.getElementById('transformer-vector-math-input');
    const preValue = inputEl ? inputEl.value : '';
    const preFocused = inputEl && (document.activeElement === inputEl);
    const preSelStart = inputEl ? inputEl.selectionStart : 0;
    const preSelEnd = inputEl ? inputEl.selectionEnd : 0;

    // Update result div
    resDiv.innerHTML = html;

    // Scoped math rendering — NEVER global render_temml()
    try {
        if (typeof temml.renderMathInElement === 'function') {
            temml.renderMathInElement(resDiv, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ],
                throwOnError: false,
                annotate: true
            });
        }
    } catch(e) {}

    if (typeof ensureDisplayMathScrollable === 'function') {
        ensureDisplayMathScrollable(resDiv);
    }

    // IMMEDIATELY restore input if it was disturbed
    if (inputEl) {
        if (inputEl.value !== window._vmInputValue && window._vmInputValue !== '') {
            inputEl.value = window._vmInputValue;
        } else if (inputEl.value !== preValue && preValue !== '') {
            inputEl.value = preValue;
        }

        if (preFocused) {
            inputEl.focus({ preventScroll: true });
            try {
                inputEl.setSelectionRange(preSelStart, preSelEnd);
            } catch(e) {}
        }
    }

    // Re-observe (innerHTML kills observation)
    vectorMathObserver.observe(resDiv);
}

// ── Core math: reads from _vmInputValue, NEVER from DOM ──
function _vmDoMath(updatePlot) {
    const resDiv = document.getElementById('transformer-vector-math-result');
    if (!resDiv) return;

    // READ FROM JS VARIABLE, NOT FROM DOM
    const inputVal = window._vmInputValue;
    const space = window.persistentEmbeddingSpace;

    if (!hasValidEmbeddingSpace(space)) {
        _vmRenderResult("<em style='color: #94a3b8;'>Enter an equation...</em>");
        return;
    }

    const vocabKeys = Object.keys(space);
    if (vocabKeys.length === 0) {
        _vmRenderResult("<em style='color: #94a3b8;'>No vocabulary loaded yet.</em>");
        return;
    }

    const d_model = space[vocabKeys[0]].length;
    const tokens = tokenizeVectorMathInput(inputVal);

    if (!tokens || tokens.length === 0) {
        _vmRenderResult("<em style='color: #94a3b8;'>Enter an equation...</em>");
        if (updatePlot) {
            _execute_embedding_render(d_model, null, []);
        }
        return;
    }

    try {
        const { result, steps } = evaluateVectorExpression(
            tokens, space, vocabKeys, d_model);
        const nearest = findNearestEmbedding(result.val, space, vocabKeys);
        const html = buildVectorMathResultHtml(result, nearest, d_model);

        _vmRenderResult(html);

        if (updatePlot) {
            _execute_embedding_render(d_model, result.val, steps);
        }
    } catch (e) {
        _vmRenderResult("<span style='color: #ef4444;'>Syntax Error.</span>");
    }
}

// ── Public API ──
window.calculate_vector_math = function() {
    if (!vectorMathRenderRegistry.isInViewport) {
        vectorMathRenderRegistry.needsUpdate = true;
        return;
    }
    _vmDoMath(false);
    vectorMathRenderRegistry.needsUpdate = false;
};

window.debounced_vector_math = debounce(function() {
    if (!vectorMathRenderRegistry.isInViewport) {
        vectorMathRenderRegistry.needsUpdate = true;
        return;
    }
    _vmDoMath(false);
    vectorMathRenderRegistry.needsUpdate = false;
}, 400);

window.immediate_vector_math = function() {
    if (!vectorMathRenderRegistry.isInViewport) {
        vectorMathRenderRegistry.needsUpdate = true;
        return;
    }
    _vmDoMath(true);
    vectorMathRenderRegistry.needsUpdate = false;
};

function hasValidEmbeddingSpace(space) {
	return space && Object.keys(space).length > 0;
}

function tokenizeVectorMathInput(inputVal) {
	return inputVal.match(/[a-zA-ZäöüÄÖÜ0-9_#]+|\d*\.\d+|\d+|[\+\-\*\/\(\)]/g);
}

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

function buildLowerCaseVocabMap(space, vocabKeys) {
	return vocabKeys.reduce((acc, word) => {
		acc[word.toLowerCase()] = { vec: space[word], original: word };
		return acc;
	}, {});
}

function isNumericLiteral(token, lowerVocab) {
    return !isNaN(token) && !lowerVocab[token.toLowerCase()];
}

function parseScalar(token, d_model) {
    const s = parseFloat(token);
    return { val: Array(d_model).fill(s), tex: `${s}`, isScalar: true, label: `${s}` };
}

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

function buildTokenChipStrip(strip, tokens) {
	const existingChips = strip.querySelectorAll('.sa-token-block');

	if (existingChips.length === tokens.length) {
		existingChips.forEach((chip, i) => {
			const displayWord = displayToken(
				(typeof tokens[i] === 'string') ? tokens[i] : tlab_get_top_word_only(tokens[i])
			);
			if (chip.textContent.trim() !== displayWord) {
				chip.textContent = displayWord;
			}
		});
		return existingChips;
	}

	strip.innerHTML = tokens.map((word, i) => {
		const displayWord = displayToken(
			(typeof word === 'string') ? word : tlab_get_top_word_only(word)
		);
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

	// Always redraw through the current closure; the scroll listener and
	// the ResizeObserver only attach once, but the chips are rebuilt on
	// every token change.
	container._attnWebDraw = drawArcs;

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
			container.addEventListener('scroll', () => {
				if (container._attnWebDraw) container._attnWebDraw();
			});
			attachResizeHandler(containerId, () => {
				if (container._attnWebDraw) container._attnWebDraw();
			});
			// The web is often first rendered while its tab is hidden
			// (clientWidth 0); redraw the moment it gets a real size and
			// whenever the token strip grows or shrinks.
			if (typeof ResizeObserver !== 'undefined') {
				container._attnWebResizeObserver = new ResizeObserver(() => {
					if (container._attnWebDraw) container._attnWebDraw();
				});
				container._attnWebResizeObserver.observe(container);
				container._attnWebResizeObserver.observe(strip);
			}
		}
		container._attnWebInitialized = true;
	}

	drawArcs();
}

function attachChipHoverEvents(chips, onHover, onLeave) {
	chips.forEach((chip, idx) => {
		chip.addEventListener('mouseover', () => onHover(idx));
		chip.addEventListener('mouseout', onLeave);
	});
}

function drawAttentionArcs(container, canvas, chips, tokens, weights, hoverIndex) {
	// A hidden tab reports zero size; keep the previous canvas and wait
	// for the ResizeObserver to fire once the tab becomes visible.
	if (!container.clientWidth) return;

	const scrollW = container.scrollWidth;
	const scrollH = container.scrollHeight;
	canvas.width  = scrollW;
	canvas.height = scrollH;
	canvas.style.width  = scrollW + 'px';
	canvas.style.height = scrollH + 'px';

	const ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const containerRect = container.getBoundingClientRect();

	// Cache chip rects ONCE per draw — they don't change inside a single
	// drawArcs call, so calling getBoundingClientRect 2× per arc pair
	// (N² pairs) was the dominant cost: N read-pairs per draw instead of 2·N².
	const chipRects = new Array(chips.length);
	for (let k = 0; k < chips.length; k++) {
		chipRects[k] = chips[k].getBoundingClientRect();
	}

	const n = Math.min(tokens.length, chips.length, weights.length);  // ← ADD THIS

	for (let i = 0; i < n; i++) {                                     // ← USE n
		for (let j = 0; j < n; j++) {                                 // ← USE n
			if (i === j) continue;
			if (!weights[i] || weights[i].length <= j) continue;      // ← SAFETY CHECK
			const strength = weights[i][j];
			if (strength < 0.01) continue;

			drawSingleArc(ctx, container, containerRect, chipRects[i], chipRects[j], strength, hoverIndex === i);
		}
	}

	highlightHoveredChip(chips, hoverIndex);
}

function drawSingleArc(ctx, container, containerRect, chip1, chip2, strength, isSource) {
	const scrollLeft = container.scrollLeft;
	const scrollTop  = container.scrollTop;

	const x1 = (chip1.left + chip1.width / 2) - containerRect.left + scrollLeft;
	const x2 = (chip2.left + chip2.width / 2) - containerRect.left + scrollLeft;
	const baseY = (chip1.top - containerRect.top) + scrollTop;

	// Non-source base colour: #cbd5e1 → #64748b in dark mode (see __MN_DARK.pairs).
	// Parse the swapped hex into rgb so we can layer alpha 0.2 on top.
	const dimHex = themeColor('#cbd5e1');
	const dimR = parseInt(dimHex.slice(1, 3), 16);
	const dimG = parseInt(dimHex.slice(3, 5), 16);
	const dimB = parseInt(dimHex.slice(5, 7), 16);

	ctx.beginPath();
	if (isSource) {
		ctx.lineWidth   = 2 + strength * 20;
		ctx.strokeStyle = `rgba(37, 99, 235, ${0.3 + strength * 0.7})`;
	} else {
		ctx.lineWidth   = 1;
		ctx.strokeStyle = `rgba(${dimR}, ${dimG}, ${dimB}, 0.2)`;
	}

	const dist = Math.abs(x2 - x1);
	const h    = Math.min(dist * 0.5, 150);

	ctx.moveTo(x1, baseY);
	ctx.bezierCurveTo(x1, baseY - h, x2, baseY - h, x2, baseY);
	ctx.stroke();

	if (isSource && strength > 0.05) {
		// #1e40af → #bfdbfe in dark mode so the percentage label stays readable.
		ctx.fillStyle = themeColor('#1e40af');
		ctx.font = "bold 14px Inter, sans-serif";
		ctx.fillText(Math.round(strength * 100) + "%", (x1 + x2) / 2 - 10, baseY - h / 1.5);
	}
}

function highlightHoveredChip(chips, hoverIndex) {
	chips.forEach((chip, idx) => {
		chip.style.borderColor = (idx === hoverIndex) ? '#2563eb' : 'transparent';
	});
}

function attachResizeHandler(containerId, drawFn) {
	const resizeKey = `_resizeHandler_${containerId}`;
	if (window[resizeKey]) window.removeEventListener('resize', window[resizeKey]);
	window[resizeKey] = drawFn;
	window.addEventListener('resize', drawFn);
}

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
	<!--
	<div style="padding: 10px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; gap: 10px;">
	    <input type="text" id="tled-new-token-input" placeholder="New token name..."
		style="flex-grow: 1; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;"
		onkeyup="if(event.key==='Enter') tled_addToken()">
	    <button onclick="tled_addToken()"
		style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">
		+ Add Token
	    </button>
	</div>
	-->
    </div>`;

	container.innerHTML = html;
}

function tled_generateRowHtml(word, vec, d_model) {
	const safeWord = word.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
		const safeWordAttr = word.replace(/"/g, '&quot;');
			const dispWord = displayToken(word);

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
				style="width: 70px; padding: 4px; border: 1px solid var(--mn-border, #cbd5e1); border-radius: 4px; text-align: center; font-size: 12px; background: var(--mn-surface, white); color: var(--mn-text, #1e293b);"
				oninput="tled_updateEmbedding(this)"
	>
    </td>`;
			}

			return `
    <tr style="border-bottom: 1px solid #f1f5f9;" id="tled-row-${safeWordAttr}">
    <td style="padding: 8px 10px; font-weight: 500;">${escapeHtml(dispWord)}</td>
    ${dimCells}
    </tr>`;
		}

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

	num = num / 10.0 + 0.5; // Translate to 0 -> 1

	// Clamp to [0, 1] if the value falls in the far tails
	if (num > 1 || num < 0) {
		return gaussianRandom(min, max); // Resample if out of bounds
	}

	return num * (max - min) + min;
};

function tled_addToken() {
	const nameInput = document.getElementById('tled-new-token-input');
	if (!nameInput) return;

	const tokenName = nameInput.value.trim();
	if (!tokenName) {
		console.warn("Please enter a token name.");
		return;
	}

	const space = window.persistentEmbeddingSpace;
	if (!space) {
		console.warn("No embedding space initialized. Please enter training data first.");
		return;
	}

	if (space[tokenName]) {
		console.warn(`Token "${tokenName}" already exists in the vocabulary.`);
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

function setVisualizationMode(mode) {
	window.tlabVisualizationMode = mode;

	const trainBtn = document.getElementById('view-toggle-train');
	const inferBtn = document.getElementById('view-toggle-inference');

	if (trainBtn && inferBtn) {
		const t = mode === 'train';
		trainBtn.style.background = t ? '#3b82f6' : '#1f2937';
		trainBtn.style.color      = t ? '#ffffff' : '#9ca3af';
		inferBtn.style.background = t ? '#1f2937' : '#3b82f6';
		inferBtn.style.color      = t ? '#9ca3af' : '#ffffff';
		trainBtn.style.border     = t ? '1px solid #3b82f6' : '1px solid #374151';
		inferBtn.style.border     = t ? '1px solid #374151' : '1px solid #3b82f6';
	}

	_gracefulModeTransition(
		() => {
			run_transformer_demo();
		},
		() => {}
	);
}

function _gracefulModeTransition(heavyWork, afterSettle) {
	let executed = false;

	// Kill stale overlay from rapid clicks
	const stale = document.getElementById('tlab-mode-overlay');
	if (stale) stale.remove();

	// ── Build overlay ────────────────────────────────────────────
	const ov = document.createElement('div');
	ov.id = 'tlab-mode-overlay';
	ov.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: opacity;
  `;

	ov.innerHTML = `
    <div class="tlab-ob" style="
      position: absolute;
      inset: 0;
      background:
	radial-gradient(ellipse 80% 60% at 50% 40%,
	  rgba(30, 58, 138, 0.25) 0%, transparent 70%),
	radial-gradient(ellipse 60% 80% at 70% 60%,
	  rgba(99, 102, 241, 0.12) 0%, transparent 60%),
	linear-gradient(160deg,
	  rgba(15, 23, 42, 0.92) 0%,
	  rgba(15, 23, 42, 0.97) 100%);
      backdrop-filter: blur(16px) saturate(1.5);
      -webkit-backdrop-filter: blur(16px) saturate(1.5);
    "></div>
    <div class="tlab-oc" style="
      position: relative;
      z-index: 1;
      text-align: center;
      transform: translateY(8px) scale(0.96);
      opacity: 0;
      transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.08s,
		  opacity  0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.08s;
    ">
      <div class="tlab-orb-wrap" style="
	position: relative; width: 56px; height: 56px; margin: 0 auto 20px;
      ">
	<div class="tlab-orb-ring" style="
	  position: absolute; inset: 0; border-radius: 50%;
	  border: 1.5px solid rgba(96, 165, 250, 0.25);
	  animation: tlab-ripple 2.8s ease-out infinite;
	"></div>
	<div class="tlab-orb-ring" style="
	  position: absolute; inset: 0; border-radius: 50%;
	  border: 1.5px solid rgba(96, 165, 250, 0.25);
	  animation: tlab-ripple 2.8s ease-out infinite 0.7s;
	"></div>
	<div class="tlab-orb-ring" style="
	  position: absolute; inset: 0; border-radius: 50%;
	  border: 1.5px solid rgba(96, 165, 250, 0.25);
	  animation: tlab-ripple 2.8s ease-out infinite 1.4s;
	"></div>
	<div class="tlab-orb-core" style="
	  position: absolute; inset: 12px; border-radius: 50%;
	  background: radial-gradient(circle at 38% 32%,
	    rgba(147, 197, 253, 0.95),
	    rgba(59, 130, 246, 0.7) 55%,
	    rgba(37, 99, 235, 0.35) 100%);
	  box-shadow:
	    0 0 24px 4px rgba(59, 130, 246, 0.35),
	    0 0 80px 8px rgba(59, 130, 246, 0.10),
	    inset 0 -3px 6px rgba(30, 64, 175, 0.3);
	  animation: tlab-breathe 2.4s ease-in-out infinite;
	"></div>
      </div>
      <div class="tlab-ol" style="
	font-family: 'Inter', system-ui, -apple-system, sans-serif;
	font-size: 0.68rem;
	font-weight: 600;
	letter-spacing: 0.14em;
	text-transform: uppercase;
	color: rgba(148, 163, 184, 0.9);
      ">Updating view</div>
    </div>`;

	document.body.appendChild(ov);

	// ── Inject keyframes if missing ──────────────────────────────
	if (!document.getElementById('tlab-kf')) {
		const kf = document.createElement('style');
		kf.id = 'tlab-kf';
		kf.textContent = `
      @keyframes tlab-ripple {
	0%   { transform: scale(0.5); opacity: 0.9; }
	100% { transform: scale(2.6); opacity: 0;   }
      }
      @keyframes tlab-breathe {
	0%, 100% { transform: scale(1);    opacity: 0.85; }
	50%      { transform: scale(1.12); opacity: 1;    }
      }
      @keyframes tlab-shimmer {
	0%   { background-position: 200% 0; }
	100% { background-position: -200% 0; }
      }
    `;
		document.head.appendChild(kf);
	}

	// ── Phase 1 — Fade IN ────────────────────────────────────────
	// Force reflow so browser registers opacity:0 BEFORE we set 1
	void ov.offsetHeight;

	ov.style.opacity = '1';

	// Animate inner card up
	const card = ov.querySelector('.tlab-oc');
	if (card) {
		card.style.transform = 'translateY(0) scale(1)';
		card.style.opacity = '1';
	}

	// ── Phase 2 — Execute work when fully opaque ─────────────────
	const run = () => {
		if (executed) return;
		executed = true;

		// Do the heavy DOM work — user can't see it behind the overlay
		heavyWork();

		// Tag content sections for stagger reveal
		const sections = _getRevealTargets();
		sections.forEach(el => {
			el.style.opacity = '0';
			el.style.transform = 'translateY(16px)';
			el.style.transition = 'none';
		});

		// ── Phase 3 — Fade OUT + stagger reveal ──────────────────
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (afterSettle) afterSettle();

				// Fade out overlay
				ov.style.opacity = '0';
				if (card) {
					card.style.transform = 'translateY(-8px) scale(0.98)';
					card.style.opacity = '0';
				}

				// Stagger reveal each section
				sections.forEach((el, i) => {
					setTimeout(() => {
						el.style.transition =
							'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), ' +
							'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
						el.style.opacity = '1';
						el.style.transform = 'translateY(0)';

						// Clean up inline styles after animation
						const cleanup = () => {
							el.style.removeProperty('opacity');
							el.style.removeProperty('transform');
							el.style.removeProperty('transition');
						};
						el.addEventListener('transitionend', cleanup, { once: true });
						setTimeout(cleanup, 600);
					}, i * 60);
				});

				// Remove overlay after fade
				const removeOverlay = () => { if (ov.parentNode) ov.remove(); };
				ov.addEventListener('transitionend', (e) => {
					if (e.target === ov) removeOverlay();
				}, { once: true });
				setTimeout(removeOverlay, 1000);
			});
		});
	};

	// Fire when fade-in transition ends
	ov.addEventListener('transitionend', (e) => {
		if (e.target === ov && e.propertyName === 'opacity') run();
	}, { once: true });

	// Safety net
	setTimeout(run, 500);
}

/* ═══════════════════════════════════════════════════════════════════════
   Gather content sections to stagger-reveal
   — Adjust selectors to match your layout
   ═══════════════════════════════════════════════════════════════════════ */
function _getRevealTargets() {
	const candidates = document.querySelectorAll([
		'.transformer-container > *',
		'.transformer-section',
		'.plot-container',
		'.equation-block',
		'.equation-container',
		'[id$="-plot"]',
		'[id$="-equations"]'
	].join(','));

	return Array.from(candidates).slice(0, 20);
}

function _render_h1_logic_core(containerIds, h0, normH0, multiHeadOutput, gamma, beta, WO, tokenStrings, naming) {
	const normContainer = document.getElementById(containerIds.norm);
	const finalContainer = document.getElementById(containerIds.final);
	if (!normContainer || !finalContainer || !gamma || !beta || !WO) return;

	const projectedMHA = matMul(multiHeadOutput, WO);
	const h1 = matAdd(h0, projectedMHA);

	const hash = computeH1Hash(h0, normH0, multiHeadOutput, projectedMHA, h1, gamma, beta);
	if (normContainer._lastHash === hash && finalContainer._lastHash === hash) return h1;
	normContainer._lastHash = hash;
	finalContainer._lastHash = hash;

	const ts = tokenStrings || null;
	// Use the *ForLayer builders — they already accept a naming object
	const normHtml = buildH1NormHtmlForLayer(h0, normH0, gamma, beta, ts, naming);
	const finalHtml = buildH1FinalHtmlForLayer(h0, projectedMHA, multiHeadOutput, h1, WO, ts, naming);

	heightLockedMathUpdate(
		[normContainer, finalContainer],
		[normHtml, finalHtml]
	);

	// Provenance: annotate the rendered h1/LayerNorm equations
	if (window.Prov) {
		const P = 'L:' + naming.L;
		window.Prov.apply(normContainer, [
			{ grid: P + ':norm' },
			{ grid: P + ':hin' },
			{ vec: P + ':gamma' },
			{ vec: P + ':beta' }
		]);
		window.Prov.apply(finalContainer, [
			{ grid: P + ':proj' },
			{ grid: P + ':concat' },
			{ grid: P + ':Wo' },
			{ grid: P + ':h1' },
			{ grid: P + ':hin' },
			{ grid: P + ':proj' }
		]);
	}

	return h1;
}

function render_h1_logic(h0, normH0, multiHeadOutput, gamma, beta, WO, tokenStrings) {
	const naming = { L: 1, sup: '', hInName: 'h_0', hOutName: 'h_1', hInStage: 'embedding + PE' };
	return _render_h1_logic_core(
		{ norm: 'transformer-h1-layernorm-viz', final: 'transformer-h1-final-viz' },
		h0, normH0, multiHeadOutput, gamma, beta, WO, tokenStrings, naming
	);
}

function render_h1_logic_for_layer(h0, normH0, multiHeadOutput, gamma, beta, WO, layerIndex, tokenStrings) {
	const naming = _h1NamingForLayer(layerIndex);
	const prefix = `unified-layer-${layerIndex}`;
	return _render_h1_logic_core(
		{ norm: `${prefix}-layernorm-viz`, final: `${prefix}-h1-final-viz` },
		h0, normH0, multiHeadOutput, gamma, beta, WO, tokenStrings, naming
	);
}

function computeH1Hash(h0, normH0, multiHeadOutput, projectedMHA, h1, gamma, beta) {
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

function matrixToPmatrixLabeled(matrix, tokenStrings, stageLabel) {
	if (!tokenStrings || tokenStrings.length !== matrix.length) {
		return matrixToPmatrix(matrix);
	}

	const total = matrix.length;
	const numCols = matrix[0].length;
	const colSpec = 'r|' + 'r'.repeat(numCols);
	const escapeLabel = (value) => String(value)
		.replace(/#/g, '\\#')
		.replace(/_/g, '\\_')
		.replace(/&/g, '\\&');

	const rows = matrix.map((row, tIdx) => {
		const colorCmd = getPositionColor(tIdx, total, 'temml');
		const safeLabel = escapeLabel(displayToken(tokenStrings[tIdx]));
		const label = `${colorCmd} \\text{${safeLabel}}_{${tIdx}}`;
		const vals = row.map(v => `${colorCmd} ${v.toFixed(nr_fixed)}`).join(' & ');
		return `${label} & ${vals}`;
	}).join(' \\\\ ');

	let footer = '';
	if (stageLabel) {
		const safeStage = escapeLabel(stageLabel);
		const firstLabel = escapeLabel(displayToken(tokenStrings[0]));
		const blanks = Array(numCols).fill('').join(' & ');
		footer = ` \\\\ \\underbrace{\\phantom{\\text{${firstLabel}}}}_{\\text{${safeStage}}} & ${blanks}`;
	}

	return `\\left(\\begin{array}{${colSpec}} ${rows}${footer} \\end{array}\\right)`;
}

function _tmLayerCard(layerIdx) {
	return document.getElementById(`unified-layer-${layerIdx}-card`);
}

function ensureUnifiedLayerContainer(layerIndex, n_layers, containerId) {
	const container = document.getElementById('ffn-equations-container');
	if (!container) return;

	container.style.overflowAnchor = 'none';
	let stack = container.querySelector('.unified-layer-stack');
	if (!stack) {
		stack = document.createElement('div');
		stack.className = 'unified-layer-stack';
		container.appendChild(stack);
	}

	const prefix = `unified-layer-${layerIndex}`;
	if (document.getElementById(`${prefix}-card`)) return;

	const isDe = !!(window.TM && TM.lang && TM.lang() === 'de');
	const card = document.createElement('section');
	card.id = `${prefix}-card`;
	card.className = 'tm-layer-card';
	card.dataset.layerIdx = layerIndex;

	const head = document.createElement('button');
	head.type = 'button';
	head.className = 'tm-layer-head';
	head.setAttribute('aria-expanded', 'false');
	head.innerHTML = `<span class="tm-layer-num">Layer ${layerIndex + 1}</span><span class="tm-layer-sub">${isDe ? 'Attention mischt, das FFN schreibt, der Residual-Stream addiert.' : 'Attention mixes, the FFN writes, the residual stream adds.'}</span><span class="tm-layer-chevron" aria-hidden="true">⌄</span>`;
	card.appendChild(head);

	const preview = document.createElement('div');
	preview.className = 'tm-layer-preview';
	preview.innerHTML = `<canvas id="${prefix}-residual-canvas" data-layer-idx="${layerIndex}" class="layer-residual-canvas" aria-label="${isDe ? 'Residual-Stream-Updates dieser Schicht pro Token' : 'Residual stream updates for this layer, per token'}"></canvas>`;
	card.appendChild(preview);

	const body = document.createElement('div');
	body.className = 'tm-layer-body';
	body.hidden = true;
	body.innerHTML = `
    <div class="tm-level-rail" role="tablist" aria-label="${isDe ? 'Detailstufe' : 'Detail level'}">
	<button type="button" class="tm-level-step is-active" data-level="0" role="tab" aria-selected="true">${isDe ? 'Wohin die Punkte wandern' : 'Where the points move'}</button>
	<button type="button" class="tm-level-step" data-level="1" role="tab" aria-selected="false">Attention</button>
	<button type="button" class="tm-level-step" data-level="2" role="tab" aria-selected="false">${isDe ? 'Formeln' : 'Formulas'}</button>
    </div>
    <div class="tm-level-pane" data-level="0">
	<p class="tm-level-text">${isDe ? 'Diese Schicht liest den laufenden Vektor und schreibt ein Update. Die Pfeile zeigen die Token-Vektoren vor dieser Schicht (grau) und danach (farbig), auf zwei Hauptkomponenten projiziert. Der Residual-Stream addiert das Update zum alten Vektor; nichts wird überschrieben. Unten stehen dieselben Vektoren als parallele Koordinaten, damit du alle Dimensionen auf einmal siehst.' : 'This layer reads the running vector and writes an update. The arrows show the token vectors before this layer (grey) and after it (coloured), projected onto two principal components. The residual stream adds the update to the old vector; nothing is overwritten. Below, the same vectors appear as parallel coordinates, so you can see every dimension at once.'}</p>
	<canvas id="${prefix}-migration-canvas" data-layer-idx="${layerIndex}" class="tm-migration-canvas" aria-label="${isDe ? 'Pfeile zeigen, wohin sich die Token-Vektoren in dieser Schicht bewegen' : 'Arrows show where the token vectors move in this layer'}"></canvas>
	<div id="${prefix}-migration-container" class="tm-migration-detail">
	    <p class="migration-parallel-note">${isDe ? 'Parallele Koordinaten: Jede Linie ist ein Token, jede senkrechte Achse eine Dimension. Der Weg der Linie zeigt, wie sich der Vektor des Tokens von Schicht zu Schicht verändert; so siehst du alle Dimensionen auf einmal, ohne sie auf zwei Achsen zu projizieren.' : 'Parallel coordinates: each line is one token, each vertical axis is one dimension. The path shows how the token vector changes from layer to layer, so you can see all dimensions at once without projecting them onto two axes.'}</p>
	</div>
    </div>
    <div class="tm-level-pane" data-level="1" hidden>
	<p class="tm-level-text">${isDe ? 'Attention lässt jedes Token die anderen lesen. Die Query fragt, was es sucht; der Key sagt, was ein anderes Token anbietet; der Value ist der Inhalt, der bei einem guten Match weitergegeben wird. Die Köpfe laufen parallel, jeder mit einer eigenen Frage. Die Bögen unten sind Attention-Gewichte: Eine dickere Linie trägt mehr Information. Die Tabs zeigen einen Kopf nach dem anderen.' : 'Attention lets every token read the others. The query asks what it is looking for; the key says what another token offers; the value is the content that travels when the match is good. The heads run in parallel, each with its own question. The arcs below are attention weights: a thicker line carries more information. The tabs show one head at a time.'}</p>
	<p class="unified-layer-hint">${isDe ? 'Klicke auf ein Wort, um zu sehen, worauf es seine Attention richtet.' : 'Click a word to see where it focuses its attention.'}</p>
	<div id="${prefix}-attention-heads"></div>
    </div>
    <div class="tm-level-pane" data-level="2" hidden>
	<p class="tm-level-text">${isDe ? 'Hier stehen die exakten Matrizen, die diese Schicht gerechnet hat: Pre-LayerNorm, Query-, Key- und Value-Projektionen, die Softmax-Gewichte, der gewichtete Value-Mix, die Ausgabeprojektion, der Residual-Schritt, dann die FFN-Expansion, GELU und die Kompression. Jede Zeile ist eine Token-Position; jede Spalte eine Dimension. Die Formeln sind dieselben wie im Prosa-Teil, nur mit den echten Zahlen dieser Schicht.' : 'Here are the exact matrices this layer computed: pre-LayerNorm, the query, key and value projections, the softmax weights, the weighted value mix, the output projection, the residual add, then the FFN expansion, GELU and compression. Each row is a token position; each column is a dimension. These are the same equations as in the prose, with the real numbers of this layer.'}</p>
	<div id="${prefix}-formula-body">
	    <div id="${prefix}-layernorm-viz" class="tm-formula-block"></div>
	    <div id="${prefix}-concat-viz" class="tm-formula-block"></div>
	    <div id="${prefix}-h1-final-viz" class="tm-formula-block"></div>
	    <p class="tm-formula-kicker">${isDe ? 'Feed-Forward-Netz:' : 'Feed-Forward Network:'}</p>
	    <div id="${prefix}-step-1" class="math_transformer"></div>
	    <div id="${prefix}-step-2" class="math_transformer"></div>
	    <div id="${prefix}-step-3" class="math_transformer"></div>
	    <div id="${prefix}-hlast" class="tm-hlast"></div>
	</div>
    </div>
    `;
	card.appendChild(body);

	head.addEventListener('click', function () {
		const open = body.hidden;
		body.hidden = !open;
		head.setAttribute('aria-expanded', String(open));
		card.classList.toggle('is-open', open);
		if (open) setLayerLevel(layerIndex, 0);
	});
	body.querySelectorAll('.tm-level-step').forEach(function (btn) {
		btn.addEventListener('click', function () {
			setLayerLevel(layerIndex, parseInt(btn.dataset.level, 10));
		});
	});
	stack.appendChild(card);
}

function setLayerLevel(layerIdx, level) {
	const card = _tmLayerCard(layerIdx);
	if (!card) return;
	card.querySelectorAll('.tm-level-step').forEach(function (btn) {
		const active = parseInt(btn.dataset.level, 10) === level;
		btn.classList.toggle('is-active', active);
		btn.setAttribute('aria-selected', String(active));
	});
	card.querySelectorAll('.tm-level-pane').forEach(function (pane) {
		pane.hidden = parseInt(pane.dataset.level, 10) !== level;
	});
	if (level === 0) {
		if (window.TransformerSteps && window.TransformerSteps.renderLayerMigration) {
			window.TransformerSteps.renderLayerMigration(`unified-layer-${layerIdx}-migration-canvas`, layerIdx);
		}
		renderLayerMigrationPlot(layerIdx);
	} else if (level === 1) {
		renderLayerAttention(layerIdx);
	} else if (level === 2) {
		renderLayerFormulas(layerIdx);
	}
}

function openUnifiedLayer(layerIdx) {
	const card = _tmLayerCard(layerIdx);
	if (!card) return;
	const body = card.querySelector('.tm-layer-body');
	const head = card.querySelector('.tm-layer-head');
	if (body) body.hidden = false;
	if (head) head.setAttribute('aria-expanded', 'true');
	card.classList.add('is-open');
	setLayerLevel(layerIdx, 0);
}

window.showUnifiedLayer = function (layerIdx) {
	openUnifiedLayer(layerIdx);
};

function renderLayerAttention(layerIdx) {
	const registryEntry = attentionRenderRegistry.get('unified-attention-engine');
	if (!registryEntry || !registryEntry.instance) return;
	if (typeof registryEntry.instance.renderLayer === 'function') {
		registryEntry.instance.renderLayer(layerIdx);
	} else {
		const mhaRegistry = multiLayerAttentionRegistry.get('unified-attention-engine');
		if (mhaRegistry && mhaRegistry.layers[layerIdx]) {
			registryEntry.instance.executeActualRender(registryEntry.headData, registryEntry.tokens);
		}
	}
}

function renderLayerMigrationPlot(layerIdx) {
	const migrationId = `migration-layer-${layerIdx + 1}`;
	const migrationData = transformerLabVisMigrationDataRegistry.get(migrationId);
	if (!migrationData) return;
	const plotDiv = document.getElementById(migrationId);
	if (!plotDiv) return;
	tlab_render_latex_matrix(migrationId, plotDiv, migrationData.tokens, migrationData.start_h, migrationData.end_h, migrationData.h_after, migrationData.d_model, migrationData.tokenStrings);
	if (isElementInViewport(plotDiv)) {
		render_migration_logic(migrationId, migrationData.tokens, migrationData.start_h, migrationData.end_h, migrationData.layerNum, migrationData.d_model, migrationData.h_after, migrationData.tokenStrings);
		migrationData.rendered = true;
	}
}

function renderLayerFormulas(layerIdx) {
	const trace = (window.__tmLayerTrace || [])[layerIdx];
	if (!trace) return;
	const prefix = `unified-layer-${layerIdx}`;
	const body = document.getElementById(`${prefix}-formula-body`);
	if (!body || body.dataset.formulasRendered === 'true') return;
	const tokens = trace.tokenStrings || [];
	if (trace.headData && trace.concat) {
		updateConcatenationDisplayForLayer(trace.headData, tokens, layerIdx, tokens);
	}
	if (trace.normH && trace.Wo) {
		render_h1_logic_for_layer(trace.h_in, trace.normH, trace.concat, trace.gamma, trace.beta, trace.Wo, layerIdx, tokens);
	}
	const ffn = trace.ffn || (window.__tmFFNTrace || [])[layerIdx];
	if (ffn) {
		render_ffn(ffn.h1, ffn.normed_h1, ffn.W1, ffn.b1, ffn.out_L1, ffn.W2, ffn.b2, ffn.out_FFN, ffn.h2, ffn.gamma2, ffn.beta2, layerIdx, tokens);
	}
	const hlast = document.getElementById(`${prefix}-hlast`);
	if (hlast && layerIdx === (window.__tmLayerTrace || []).length - 1 && window._cachedFinalProjection && window._cachedFinalProjection.h_final) {
		const hFinal = window._cachedFinalProjection.h_final;
		const hLast = hFinal[hFinal.length - 1];
		const isDe = !!(window.TM && TM.lang && TM.lang() === 'de');
		const rows = buildHLastDisplayLatex(hLast);
		hlast.innerHTML = `<p>${isDe ? 'Aktuell' : 'Current'}</p>$$h_\\text{last} = \\begin{bmatrix} ${rows} \\end{bmatrix}$$<p>${isDe ? '(die letzte Zeile der Ausgabematrix der letzten Schicht der Inferenzdaten)' : "(the last layers' output matrix last line of the inference-data)"}</p>`;
	}
	body.dataset.formulasRendered = 'true';
	_renderTemmlOnElements([body]);
}

function ensureFFNLayerContainers(layerIndex) {
	// Delegate to the unified layer container system
	const { n_layers } = getTransformerConfig();
	ensureUnifiedLayerContainer(layerIndex, n_layers, 'mha-calculation-details');
}

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

function _add3DArrowheadSeries(series, from3, to3, color, options = {}) {
	const lineWidth   = options.lineWidth   || 7;
	const maxHeadLen  = options.maxHeadLen  || 0.5;
	const spreadRatio = options.spreadRatio || 0.4;
	const name        = options.name        || undefined;

	const dx = to3[0] - from3[0];
	const dy = to3[1] - from3[1];
	const dz = to3[2] - from3[2];
	const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
	if (mag < 1e-10) return;

	const nx = dx / mag, ny = dy / mag, nz = dz / mag;
	const headLen = Math.min(mag * 0.3, maxHeadLen);
	const { perp1, perp2 } = computePerpendicularVectors(nx, ny, nz);
	const spread = headLen * spreadRatio;

	// Base center (pulled back from tip along shaft direction)
	const bx = to3[0] - nx * headLen;
	const by = to3[1] - ny * headLen;
	const bz = to3[2] - nz * headLen;

	// Wing points in perp1 plane
	const w1a = [bx + spread * perp1.x, by + spread * perp1.y, bz + spread * perp1.z];
	const w1b = [bx - spread * perp1.x, by - spread * perp1.y, bz - spread * perp1.z];

	// Wing points in perp2 plane
	const w2a = [bx + spread * perp2.x, by + spread * perp2.y, bz + spread * perp2.z];
	const w2b = [bx - spread * perp2.x, by - spread * perp2.y, bz - spread * perp2.z];

	// V-chevron 1: wing → tip → wing (one continuous polyline = clean V shape)
	series.push({
		type: 'line3D',
		name: name,
		data: [w1a, to3, w1b],
		lineStyle: { width: lineWidth, color: color },
		silent: true
	});

	// V-chevron 2: perpendicular plane
	series.push({
		type: 'line3D',
		name: name,
		data: [w2a, to3, w2b],
		lineStyle: { width: lineWidth, color: color },
		silent: true
	});
}

function _computeArrowheadBase(from3, to3, maxHeadLen) {
	const dx = to3[0] - from3[0];
	const dy = to3[1] - from3[1];
	const dz = to3[2] - from3[2];
	const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
	if (mag < 1e-10) return [...to3];
	const headLen = Math.min(mag * 0.3, maxHeadLen || 0.5);
	const nx = dx / mag, ny = dy / mag, nz = dz / mag;
	return [to3[0] - nx * headLen, to3[1] - ny * headLen, to3[2] - nz * headLen];
}

const themeRiverRegistry = new Map();
const themeRiverObserver = createLazyRenderObserver(themeRiverRegistry, (id, data) => {
	_execute_themeriver_render(data.d_model);
});

window._themeriver_on_change = function () {
	const entry = themeRiverRegistry.get('transformer-themeriver-plot');
	if (entry) _execute_themeriver_render(entry.d_model);
};

/* The final projection is often rendered while the page loader still hides
   #contents (width 0). Re-run the math-scroll pass once it gets a real width
   so wide matrices cannot stay unclamped and trip the layout guardrail. */
function _observeOutputProjectionMath() {
	const out = document.getElementById('transformer-output-projection');
	if (!out || out._mathScrollObs || typeof ResizeObserver === 'undefined') return;
	out._mathScrollObs = new ResizeObserver(() => {
		if (out.clientWidth > 0 && typeof ensureDisplayMathScrollable === 'function') {
			ensureDisplayMathScrollable(out);
		}
	});
	out._mathScrollObs.observe(out);
}

async function loadTransformerModule () {
	updateLoadingStatus("Loading section about transformers...");

	observer_vector_math();

	drawTrainingPlaceholder();
	const initialRun = transformerRunFromURL();
	if (initialRun) applyTransformerRun(initialRun);
	updateTrainButtonState();
	updateArchitectureValidityUI();
	run_transformer_demo();
	bindTransformerRunURL();
	_observeOutputProjectionMath();
	window.addEventListener('blogPostLoadComplete', scrollToRunStep, { once: true });
	scrollToRunStep();

	const inputElement = document.getElementById('transformer-master-token-input');
	inputElement.addEventListener('input', (event) => {
		debouncedRun('transformer-master-token-input');
	});

	return Promise.resolve();
}

function displayToken(token) {
	if (typeof token !== 'string') return String(token);
	return /^\s+$/.test(token) ? token.replace(/ /g, '␣') : token;
}

function createTrajectoryVFToggleButton() {
	const toggleBtn = document.createElement('button');
	toggleBtn.className = 'trajectory-vf-toggle';
	toggleBtn.dataset.mode = window._trajectoryVfEnabled ? 'on' : 'off';
	toggleBtn.textContent = window._trajectoryVfEnabled
		? ((window.TM && TM.lang && TM.lang() === 'de') ? '🧭 Vektorfeld ausblenden' : '🧭 Hide Vector Field')
		: ((window.TM && TM.lang && TM.lang() === 'de') ? '🧭 Vektorfeld zeigen' : '🧭 Show Vector Field');
	toggleBtn.style.cssText = `
	margin: 8px 12px; padding: 6px 16px; border-radius: 6px;
	border: 1px solid #8b5cf6;
	background: ${window._trajectoryVfEnabled ? '#ede9fe' : '#fff'};
	color: #8b5cf6;
	cursor: pointer; font-weight: 600; font-size: 0.82rem;
	transition: all 0.15s;
	`;

	toggleBtn.addEventListener('mouseover', () => {
		toggleBtn.style.background =
			toggleBtn.dataset.mode === 'off' ? '#f5f3ff' : '#fce7f3';
	});
	toggleBtn.addEventListener('mouseout', () => {
		toggleBtn.style.background =
			toggleBtn.dataset.mode === 'off' ? '#fff' : '#ede9fe';
	});

	toggleBtn.addEventListener('click', () => {
		const isOn = toggleBtn.dataset.mode === 'on';
		window._trajectoryVfEnabled = !isOn;
		toggleBtn.dataset.mode = isOn ? 'off' : 'on';
		toggleBtn.textContent = isOn
			? ((window.TM && TM.lang && TM.lang() === 'de') ? '🧭 Vektorfeld zeigen' : '🧭 Show Vector Field')
			: ((window.TM && TM.lang && TM.lang() === 'de') ? '🧭 Vektorfeld ausblenden' : '🧭 Hide Vector Field');
		toggleBtn.style.background = isOn ? themeColor('#ffffff') : '#ede9fe';

		// Re-render trajectory
		const trajDiv = document.getElementById('transformer-trajectory-full-path');
		const d_model = trajDiv
			? parseInt(trajDiv.getAttribute('data-d-model') || '0')
			: 0;
		if (d_model > 0) {
			const trajEntry = trajectoryRenderRegistry.get('transformer-trajectory-full-path');
			if (trajEntry) trajEntry.rendered = false;
			tlab_render_trajectory_plot(d_model);
		}
	});

	return toggleBtn;
}

function _compute_trajectory_vf_2d(d_model, n_heads, n_layers) {
	const collector = window.tlab_trajectory_collector;
	if (!collector || !collector.steps["01_pe"]) return null;

	const h0 = collector.steps["01_pe"].data;
	const seqLen = h0.length;
	const substitutePos = seqLen - 1;
	const weights = window.currentWeights;
	if (!weights || weights.length < n_layers) return null;

	// ── Bounds from every trajectory stage + vocab embeddings ──
	let xMin = Infinity, xMax = -Infinity,
		yMin = Infinity, yMax = -Infinity;

	const updateBounds2d = (vec) => {
		if (vec[0] < xMin) xMin = vec[0];
		if (vec[0] > xMax) xMax = vec[0];
		if (vec.length > 1) {
			if (vec[1] < yMin) yMin = vec[1];
			if (vec[1] > yMax) yMax = vec[1];
		}
	};

	Object.keys(collector.steps).sort().forEach(key => {
		collector.steps[key].data.forEach(updateBounds2d);
	});
	Object.values(window.persistentEmbeddingSpace).forEach(updateBounds2d);

	if (xMin === xMax) { xMin -= 1; xMax += 1; }
	if (yMin === yMax) { yMin -= 1; yMax += 1; }
	const pad = 2;
	xMin -= pad; xMax += pad; yMin -= pad; yMax += pad;

	// ── Sample grid, run ALL layers for each point ──
	const gridRes = 12;
	const points = [];
	let maxMag = 0;

	for (let i = 0; i <= gridRes; i++) {
		for (let j = 0; j <= gridRes; j++) {
			const x = xMin + (xMax - xMin) * (i / gridRes);
			const y = yMin + (yMax - yMin) * (j / gridRes);

			const modifiedH0 = h0.map((row, idx) =>
				idx === substitutePos
				? (d_model >= 2 ? [x, y] : [x])
				: [...row]
			);

			let h = modifiedH0;
			for (let l = 0; l < n_layers; l++) {
				h = forwardOneLayer(h, weights[l], d_model, n_heads, null, null, null).h_out;
			}

			const hOut = h[substitutePos];
			const dx = hOut[0] - x;
			const dy = (d_model >= 2 ? hOut[1] : 0) - y;
			const mag = Math.sqrt(dx * dx + dy * dy);

			points.push({ x, y, dx, dy, mag });
			if (mag > maxMag) maxMag = mag;
		}
	}

	if (maxMag < 1e-8) maxMag = 1e-8;
	const cellW = (xMax - xMin) / gridRes;
	const cellH = (yMax - yMin) / gridRes;
	return { points, maxMag, maxArrowLen: Math.min(cellW, cellH) * 1.2 };
}

function _compute_trajectory_vf_3d(d_model, n_heads, n_layers) {
	const collector = window.tlab_trajectory_collector;
	if (!collector || !collector.steps["01_pe"]) return null;

	const h0 = collector.steps["01_pe"].data;
	const seqLen = h0.length;
	const substitutePos = seqLen - 1;
	const weights = window.currentWeights;
	if (!weights || weights.length < n_layers) return null;

	let xMin = Infinity, xMax = -Infinity,
		yMin = Infinity, yMax = -Infinity,
		zMin = Infinity, zMax = -Infinity;

	const updateBounds3d = (vec) => {
		if (vec[0] < xMin) xMin = vec[0];
		if (vec[0] > xMax) xMax = vec[0];
		if (vec.length > 1) { if (vec[1] < yMin) yMin = vec[1]; if (vec[1] > yMax) yMax = vec[1]; }
		if (vec.length > 2) { if (vec[2] < zMin) zMin = vec[2]; if (vec[2] > zMax) zMax = vec[2]; }
	};

	Object.keys(collector.steps).sort().forEach(key => {
		collector.steps[key].data.forEach(updateBounds3d);
	});
	Object.values(window.persistentEmbeddingSpace).forEach(updateBounds3d);

	if (xMin === xMax) { xMin -= 1; xMax += 1; }
	if (yMin === yMax) { yMin -= 1; yMax += 1; }
	if (zMin === zMax) { zMin -= 1; zMax += 1; }
	const pad = 2;
	xMin -= pad; xMax += pad; yMin -= pad; yMax += pad; zMin -= pad; zMax += pad;

	const gridRes = 6;
	const points = [];
	let maxMag = 0;

	for (let i = 0; i <= gridRes; i++) {
		for (let j = 0; j <= gridRes; j++) {
			for (let k = 0; k <= gridRes; k++) {
				const x = xMin + (xMax - xMin) * (i / gridRes);
				const y = yMin + (yMax - yMin) * (j / gridRes);
				const z = zMin + (zMax - zMin) * (k / gridRes);

				const modifiedH0 = h0.map((row, idx) =>
					idx === substitutePos ? [x, y, z] : [...row]
				);

				let h = modifiedH0;
				for (let l = 0; l < n_layers; l++) {
					h = forwardOneLayer(h, weights[l], d_model, n_heads, null, null, null).h_out;
				}

				const hOut = h[substitutePos];
				const dx = hOut[0] - x;
				const dy = hOut[1] - y;
				const dz = hOut[2] - z;
				const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);

				points.push({ x, y, z, dx, dy, dz, mag });
				if (mag > maxMag) maxMag = mag;
			}
		}
	}

	if (maxMag < 1e-8) maxMag = 1e-8;
	const cellX = (xMax - xMin) / gridRes;
	const cellY = (yMax - yMin) / gridRes;
	const cellZ = (zMax - zMin) / gridRes;
	return { points, maxMag, maxArrowLen: Math.min(cellX, cellY, cellZ) * 1.1 };
}

function _traj_vf_2d_plotly_annotations(computed) {
	if (!computed) return [];
	const { points, maxMag, maxArrowLen } = computed;

	return points.map(p => {
		const { ux, uy, arrowLen, normMag } = _vf2d_arrow_geometry(p, maxMag, maxArrowLen);
		const r = Math.round(normMag * 239 + (1 - normMag) * 59);
		const g = Math.round(normMag * 68  + (1 - normMag) * 130);
		const b = Math.round(normMag * 68  + (1 - normMag) * 246);
		const color = `rgba(${r},${g},${b},0.35)`;

		return {
			x: p.x + ux * arrowLen,
			y: p.y + uy * arrowLen,
			ax: p.x, ay: p.y,
			xref: 'x', yref: 'y',
			axref: 'x', ayref: 'y',
			showarrow: true,
			arrowhead: 2,
			arrowsize: 1.2,        // ← constant arrowhead size
			arrowwidth: 2,         // ← constant line width
			arrowcolor: color,
			text: '', standoff: 0
		};
	}).filter(a => {
		const dx = a.x - a.ax, dy = a.y - a.ay;
		return Math.sqrt(dx * dx + dy * dy) > 1e-6;
	});
}

// Re-render the transformer visualizations when the user toggles dark/light mode
// so that plot colours stay readable.
if (window.__MN_DARK) {
	window.__MN_DARK.onChange((isDark) => {
		if (window.isTraining) return;
		if (typeof debounced_run_transformer_demo === 'function') {
			debounced_run_transformer_demo();
		}
		const lossPlot = document.getElementById('training-loss-plot');
		if (lossPlot && lossPlot.style.display !== 'none') {
			renderLossGraph();
		}
		updateArchitectureValidityUI();
	});
}
