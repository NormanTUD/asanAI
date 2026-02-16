/**
 * AttentionEngine: Modular Transformer Component
 * Origin: Vaswani et al. (2017)
 * Methods: Multi-Head Projection, Scaled Dot-Product, LaTeX Logging
 */

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

window.tlab_trajectory_data = {
	tokens: [],
	steps: [] // Array of { name: "Stage Name", data: [[dim1, dim2...], ...] }
};

const contextSize = 128;
const attentionRenderRegistry = new Map();

const positionalShiftRegistry = new Map();

const embeddingRenderRegistry = new Map();

const embeddingObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			const containerId = entry.target.id;
			const data = embeddingRenderRegistry.get(containerId);

			if (data && !data.rendered) {
				console.log("Embedding plot visible: Rendering...");
				_execute_embedding_render(data.d_model);
				data.rendered = true;
			}
		}
	});
}, { threshold: 0 });

const positionalShiftObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			const containerId = entry.target.id;
			const data = positionalShiftRegistry.get(containerId);

			if (data && !data.rendered) {
				console.log("Positional Shift Plot visible: Rendering...");
				_execute_shift_render(data.tokenStrings, data.d_model, data.injectedEmbeddings);
				data.rendered = true;
			}
		}
	});
}, { threshold: 0 });

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

const trajectoryRenderRegistry = new Map();

const trajectoryObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			const containerId = entry.target.id;
			const data = trajectoryRenderRegistry.get(containerId);

			if (data && !data.rendered) {
				console.log("Trajectory visible: Rendering plot...");
				tlab_render_trajectory_plot(data.d_model);
				data.rendered = true;
				// Optional: Stop observing after first render to save resources
				// trajectoryObserver.unobserve(entry.target);
			}
		}
	});
}, { threshold: 0.1 });

const multiLayerAttentionRegistry = new Map();

function reset_graph() {
	document.getElementById('training-loss-plot').style.display = 'none';
	document.getElementById('training-loss-plot').innerHTML = '';
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

	const gaussianRandom = () => {
		let u = 0, v = 0;
		while(u === 0) u = Math.random();
		while(v === 0) v = Math.random();
		return (Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v));
	};

	tokens.forEach(token => {
		if (!space[token]) {
			space[token] = Array.from({ length: d_model }, () =>
				parseFloat(gaussianRandom().toFixed(nr_fixed))
			);
		}
	});

	// ── FIX: Remove tokens no longer in the training vocabulary ──
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

	forward(h0, tokens, tokenStrings = null) {
		const Q_full = this.dot(h0, this.this_weights.query);
		const K_full = this.dot(h0, this.this_weights.key);
		const V_full = this.dot(h0, this.this_weights.value);

		let headData = [];

		for (let head = 0; head < this.n_heads; head++) {
			const startCol = head * this.d_k;
			const endCol = startCol + this.d_k;

			const Qi = Q_full.map(row => row.slice(startCol, endCol));
			const Ki = K_full.map(row => row.slice(startCol, endCol));
			const Vi = V_full.map(row => row.slice(startCol, endCol));

			const WQ_slice = this.this_weights.query.map(row => row.slice(startCol, endCol));
			const WK_slice = this.this_weights.key.map(row => row.slice(startCol, endCol));
			const WV_slice = this.this_weights.value.map(row => row.slice(startCol, endCol));

			let scores = this.dot(Qi, this.transpose(Ki)).map(row =>
				row.map(v => v / Math.sqrt(this.d_k))
			);

			for (let r = 0; r < scores.length; r++) {
				for (let c = r + 1; c < scores[r].length; c++) {
					scores[r][c] -= 1e9;
				}
			}

			const attn_weights = this.softmax(scores);
			const context = this.dot(attn_weights, Vi);

			headData.push({
				headIdx: head,
				Qi, Ki, Vi,
				this_weights: attn_weights,
				context,
				h0,
				WQ: WQ_slice, WK: WK_slice, WV: WV_slice
			});
		}

		this.renderUI(headData, tokens, tokenStrings);  // ← pass tokenStrings
		return headData;
	}

	transpose(M) {
		if (!M || M.length === 0 || !M[0]) {
			throw new Error("Transpose error: Cannot transpose an empty or 1D array.");
		}
		return M[0].map((_, i) => M.map(row => row[i]));
	}

	renderUI(headData, tokens, tokenStrings = null) {
		if (!this.containerId) return;

		if (!multiLayerAttentionRegistry.has(this.containerId)) {
			multiLayerAttentionRegistry.set(this.containerId, {
				layers: [],
				rendered: false
			});
		}

		const entry = multiLayerAttentionRegistry.get(this.containerId);
		entry.layers.push({
			headData: headData,
			tokens: tokens,
			tokenStrings: tokenStrings,  // ← NEW: preserve original order
			instance: this
		});
		entry.rendered = false;

		attentionRenderRegistry.set(this.containerId, {
			headData: headData,
			tokens: tokens,
			tokenStrings: tokenStrings,  // ← NEW
			instance: this,
			rendered: false
		});

		if (!this.container && !this.containerId) return;
		const containerEl = document.getElementById(this.containerId);
		if (containerEl && !containerEl.innerHTML) {
			containerEl.innerHTML = `<div style="padding:20px; color:#64748b;">Scroll to view Attention Matrix...</div>`;
		}
	}

	executeActualRender(headData, tokens) {
		if (!this.container || !tokens.length) return;

		const registry = multiLayerAttentionRegistry.get(this.containerId);
		if (!registry || registry.layers.length === 0) {
			this._renderSingleLayer(headData, tokens, 0);
			return;
		}

		const layers = registry.layers;
		const numLayers = layers.length;

		let html = `<div class="attention-layer-tabs" style="border:1px solid #3b82f6; border-radius:8px; overflow:hidden;">`;

		// ── Layer Tab Headers (lightweight) ──
		html += `<div class="layer-tab-list" style="background:#dbeafe; display:flex; border-bottom:2px solid #3b82f6; flex-wrap:wrap;">`;
		for (let l = 0; l < numLayers; l++) {
			html += `<button class="mha-layer-tab-btn" id="layer-tab-btn-${this.containerId}-${l}"
	    onclick="showLayer('${this.containerId}', ${l}, ${numLayers})"
	    style="padding:10px 18px; border:none; border-right:1px solid #93c5fd; cursor:pointer;
	    background:${l === 0 ? '#fff' : '#bfdbfe'}; font-weight:${l === 0 ? 'bold' : 'normal'}; font-size:0.9rem;">
	    Layer ${l + 1}
	</button>`;
		}
		html += `</div>`;

		// ── Empty layer content containers (NO math generated yet) ──
		for (let l = 0; l < numLayers; l++) {
			html += `<div id="layer-content-${this.containerId}-${l}" class="layer-tab-content"
	    style="display:${l === 0 ? 'block' : 'none'};"
	    data-layer-idx="${l}" data-rendered="false">
	    <div style="padding:20px; color:#64748b;">Loading Layer ${l + 1}...</div>
	</div>`;
		}

		html += `</div>`;
		this.container.innerHTML = html;

		// Only render the FIRST visible layer
		this._renderLayerContent(0);
	}

	_renderLayerContent(layerIdx) {
		const contentDiv = document.getElementById(`layer-content-${this.containerId}-${layerIdx}`);
		if (!contentDiv || contentDiv.dataset.rendered === 'true') return;

		const registry = multiLayerAttentionRegistry.get(this.containerId);
		const layerData = registry.layers[layerIdx];
		const layerHeadData = layerData.headData;
		const layerTokens = layerData.tokens;
		const layerInstance = layerData.instance;

		let html = '';

		// Head tab buttons (lightweight)
		html += `<div class="head-tab-list" style="background:#f0f4f8; display:flex; border-bottom:1px solid #3b82f6; flex-wrap:wrap;">`;
		for (let h = 0; h < layerHeadData.length; h++) {
			html += `<button class="mha-head-tab-btn" id="head-tab-btn-${this.containerId}-${layerIdx}-${h}"
	    onclick="showHeadInLayer('${this.containerId}', ${layerIdx}, ${h}, ${layerHeadData.length})"
	    style="padding:8px 16px; border:none; border-right:1px solid #93c5fd; cursor:pointer;
	    background:${h === 0 ? '#fff' : '#e2e8f0'}; font-weight:${h === 0 ? 'bold' : 'normal'}; font-size:0.85rem;">
	    Head ${h + 1}
	</button>`;
		}
		html += `</div>`;

		// Empty head containers
		for (let h = 0; h < layerHeadData.length; h++) {
			html += `<div id="head-content-${this.containerId}-${layerIdx}-${h}" class="head-tab-in-layer"
	    style="padding:20px; display:${h === 0 ? 'block' : 'none'}"
	    data-head-idx="${h}" data-rendered="false">
	    <div style="color:#94a3b8;">Loading Head ${h + 1}...</div>
	</div>`;
		}

		contentDiv.innerHTML = html;
		contentDiv.dataset.rendered = 'true';

		// Render only the first head
		this._renderHeadContent(layerIdx, 0);
	}

	_renderHeadContent(layerIdx, headIdx) {
		const headDiv = document.getElementById(`head-content-${this.containerId}-${layerIdx}-${headIdx}`);
		if (!headDiv || headDiv.dataset.rendered === 'true') return;

		const registry = multiLayerAttentionRegistry.get(this.containerId);
		const layerData = registry.layers[layerIdx];
		const hd = layerData.headData[headIdx];
		const layerTokens = layerData.tokens;
		const layerInstance = layerData.instance;
		const escapedTokens = layerTokens.map(t => String(t).replace(/#/g, '\\#'));

		// ── FIX: Use the preserved string tokens if available ──
		// layerData.tokenStrings is the original ordered array of words.
		// Only fall back to dot-product lookup if strings weren't provided.
		const displayTokens = layerData.tokenStrings
			? [...layerData.tokenStrings]
			: layerTokens.map(t => {
				if (typeof t === 'string') return t;
				return tlab_get_top_word_only(t);
			});

		// ... rest of the method stays exactly the same ...
		const webContainerId = `attn-web-container-${this.containerId}-${layerIdx}-${headIdx}`;
		const webCanvasId    = `attn-web-canvas-${this.containerId}-${layerIdx}-${headIdx}`;
		const webStripId     = `attn-web-strip-${this.containerId}-${layerIdx}-${headIdx}`;

		headDiv.innerHTML = `
    <p style="margin:0 0 4px 0; color:#1e40af; font-weight:bold;">Attention Connectivity Web</p>
    <p style="font-size:0.8rem; color:#64748b; margin-bottom:8px;">
	Hover over a word to see where it focuses its attention.
    </p>
    <div id="${webContainerId}" style="position:relative; height:200px; margin-bottom:20px; background:#fcfdfe; border:1px solid #e2e8f0; border-radius:8px; overflow-x:auto; overflow-y:hidden;">
	<canvas id="${webCanvasId}" style="position:absolute; top:0; left:0; pointer-events:none; z-index:5;"></canvas>
	<div id="${webStripId}" style="display:flex; justify-content:center; gap:10px; position:absolute; bottom:40px; width:max-content; min-width:100%; padding:0 20px; flex-wrap:nowrap;"></div>
    </div>

    <div id="attn-heatmap-${this.containerId}-${layerIdx}-${headIdx}" style="width:100%; margin-bottom:20px;"></div>
    <div style="margin-bottom:20px; font-size: 0.9rem;">
	$$ \\text{Layer}_{${layerIdx + 1}},\\; \\text{Head}_{${headIdx + 1}} = \\text{Softmax} \\left( \\frac{Q_{${headIdx + 1}} K_{${headIdx + 1}}^T}{\\sqrt{d_k}} \\right) \\cdot V_{${headIdx + 1}} $$
    </div>
    <div style="overflow-x:auto;">
	${layerInstance.generateMathTable(hd, escapedTokens)}
    </div>`;

		headDiv.dataset.rendered = 'true';
		render_temml();

		requestAnimationFrame(() => {
			renderDynamicAttentionWeb(
				webContainerId,
				webCanvasId,
				webStripId,
				displayTokens,
				hd.this_weights
			);
		});
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

		let html = `<table style="border-collapse: collapse; width: 100%; border: 1px solid #3b82f6;">${wq_wk_wv_matrix_html}`;

		// Header (Keys)
		html += `<tr><th style="border: 1px solid #3b82f6; padding: 8px; background: #f8fafc;">Query \\ Key</th>`;
		tokens.forEach((t, j) => {
			// Render Key as a vertical vector if it's an embedding array
			const keyVector = Array.isArray(h0[j]) ? `$K_${j} = ${toColPmatrix(h0[j])}$` : t;
			html += `<th style="border: 1px solid #3b82f6; padding: 8px; background: #f8fafc;">Key: ${keyVector}</th>`;
		});
		html += `</tr>`;

		// Rows (Queries)
		this_weights.forEach((row, i) => {
			html += `<tr>`;
			// Render Query as a vertical vector
			const queryVector = Array.isArray(h0[i]) ? `$Q_${i} = ${toColPmatrix(h0[i])}$` : tokens[i];
			html += `<td style="border: 1px solid #3b82f6; padding: 8px; background: #f8fafc;"><strong>Query: ${queryVector}</strong></td>`;

			row.forEach((weight, j) => {
				const intensity = Math.floor(255 - (weight * 150));
				const bgColor = `rgb(${intensity}, ${intensity}, 255)`;
				const dk_int = Math.round(this.d_k);
				const resultVec = Vi[j].map(v => v * weight);

				let cellEq;
				if (i === 0 && j === 0) {
					// Full derivation for the first cell
					cellEq = `
	    \\text{SoftMax} \\left( \\frac{
		\\underbrace{(W_Q h_0[${i}])^T}_{Q_${i}^T} \\cdot
		\\underbrace{(W_K h_0[${j}])}_{K_${j}}
	    }{\\sqrt{${dk_int}}} \\right) \\cdot \\underbrace{V_{${j}}}_{h_{${j}} \\cdot W_V}
	    = ${weight.toFixed(nr_fixed)} \\cdot ${toColPmatrix(Vi[j])}
	    = ${toColPmatrix(resultVec)}
	`.replace(/\s+/g, ' ');
				} else {
					// Descriptive shorthand for subsequent cells
					// Shows the relationship between Q_i, K_j and the weight
					cellEq = `
	    \\underbrace{ \\text{attn}(Q_{${i}}, K_{${j}}) }_{${weight.toFixed(nr_fixed)}}
	    \\cdot \\underbrace{V_{${j}}}_{h_{${j}} \\cdot W_V} = ${toColPmatrix(resultVec)}
	`.replace(/\s+/g, ' ');
				}

				html += `<td style="border: 1px solid #3b82f6; padding: 12px; background: ${bgColor}; text-align: center;">$${cellEq}$</td>`;
			});
			html += `</tr>`;
		});

		html += `</table>`;
		return html;
	}
}

window.showLayer = (containerId, layerIdx, numLayers) => {
	for (let l = 0; l < numLayers; l++) {
		const content = document.getElementById(`layer-content-${containerId}-${l}`);
		if (content) content.style.display = 'none';
		const btn = document.getElementById(`layer-tab-btn-${containerId}-${l}`);
		if (btn) { btn.style.background = '#bfdbfe'; btn.style.fontWeight = 'normal'; }
	}

	const activeContent = document.getElementById(`layer-content-${containerId}-${layerIdx}`);
	if (activeContent) activeContent.style.display = 'block';
	const activeBtn = document.getElementById(`layer-tab-btn-${containerId}-${layerIdx}`);
	if (activeBtn) { activeBtn.style.background = '#fff'; activeBtn.style.fontWeight = 'bold'; }

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
	for (let h = 0; h < numHeads; h++) {
		const content = document.getElementById(`head-content-${containerId}-${layerIdx}-${h}`);
		if (content) content.style.display = 'none';
		const btn = document.getElementById(`head-tab-btn-${containerId}-${layerIdx}-${h}`);
		if (btn) { btn.style.background = '#e2e8f0'; btn.style.fontWeight = 'normal'; }
	}

	const activeContent = document.getElementById(`head-content-${containerId}-${layerIdx}-${headIdx}`);
	if (activeContent) activeContent.style.display = 'block';
	const activeBtn = document.getElementById(`head-tab-btn-${containerId}-${layerIdx}-${headIdx}`);
	if (activeBtn) { activeBtn.style.background = '#fff'; activeBtn.style.fontWeight = 'bold'; }

	// LAZY: Render this head's content if not yet done
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
			const div_term = Math.pow(10000, i / d_model);

			peVec[i] = Math.sin(pos / div_term);
			if (i + 1 < d_model) {
				peVec[i + 1] = Math.cos(pos / div_term);
			}
		}

		const combined = semanticVec.map((val, i) => val + peVec[i]);
		injectedEncodings.push(combined);

		if (resultsContainer) {
			const displaySemantic = semanticVec.map(v => v.toFixed(nr_fixed));
			const displayPE = peVec.map(v => v.toFixed(nr_fixed));
			const displayCombined = combined.map(v => v.toFixed(nr_fixed));

			html += `
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

async function train_transformer() {
	const btn = event.target;
	const status = document.getElementById('training-status');

	const trainingData = document.getElementById('transformer-training-data').value;
	const preCheckTokens = transformer_tokenize_render(trainingData, null);
	if (preCheckTokens.length < 2) {
		status.style.display = 'block';
		status.innerText = 'Need at least 2 tokens in training data.';
		return;
	}

	if (window.isTraining) {
		window.isTraining = false;
		return;
	}

	window.isTraining = true;
	btn.classList.add('active');
	btn.innerText = 'Stop Training';
	status.style.display = 'block';

	const lr = parseFloat(document.getElementById('train-lr').value) || 0.05;
	const epochs = parseInt(document.getElementById('train-epochs').value) || 500;
	const optType = document.getElementById('train-optimizer').value;
	const d_model = parseInt(document.getElementById('transformer-dimension-model').value);
	const n_layers = parseInt(document.getElementById('transformer-depth').value);

	let optimizer = optType === 'adam' ? tf.train.adam(lr) :
		optType === 'rmsprop' ? tf.train.rmsprop(lr) : tf.train.sgd(lr);

	const tokens = transformer_tokenize_render(trainingData, null);

	if (tokens.length === 0) {
		window.isTraining = false;
		btn.classList.remove('active');
		btn.innerText = 'Train Model';
		return;
	}

	if (!window.currentWeights) {
		window.currentWeights = get_init_weights(n_layers, d_model);
	}

	get_or_init_embeddings(tokens, d_model);

	const weightVars = convert_weights_to_tensors(window.currentWeights);
	const allVars = collectTrainableVars(weightVars);
	const clipValue = 1.0;
	let completedAll = true;

	// --- ETA Logic: Start ---
	const startTime = performance.now();
	const formatETA = (ms) => {
		if (isNaN(ms) || ms < 0) return "Calculating...";
		let seconds = Math.floor(ms / 1000);
		let hours = Math.floor(seconds / 3600);
		seconds %= 3600;
		let minutes = Math.floor(seconds / 60);
		seconds %= 60;
		return [hours, minutes, seconds]
			.map(v => v < 10 ? "0" + v : v)
			.join(":");
	};
	// --- ETA Logic: End ---

	for (let i = 0; i < epochs; i++) {
		if (!window.isTraining) {
			completedAll = false;
			break;
		}

		const { value: cost, grads } = tf.variableGrads(
			() => tf.tidy(() => calculate_tf_loss(tokens, weightVars, d_model, n_layers)),
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

		const lossValue = await cost.data();
		window.lossHistory.push(lossValue[0]);

		if (i % 25 === 0 || i === epochs - 1) {
			// --- ETA Calculation ---
			const currentTime = performance.now();
			const elapsed = currentTime - startTime;
			const avgTimePerEpoch = elapsed / (i + 1);
			const remainingEpochs = epochs - (i + 1);
			const etaMs = remainingEpochs * avgTimePerEpoch;
			const etaString = formatETA(etaMs);
			// -----------------------

			window.currentWeights = await convert_tensors_to_weights(weightVars);
			status.innerText = `Epoch ${i}: Loss = ${lossValue[0].toFixed(6)} | ETA: ${etaString}`;
			renderLossGraph();
			run_transformer_demo();
			await tf.nextFrame();

			calculate_vector_math();

			tled_syncTableFromSpace();
		}
		cost.dispose();
	}

	window.isTraining = false;
	btn.classList.remove('active');
	btn.innerText = 'Train Model';
	status.innerText += completedAll ? " Training Complete!" : " Training Stopped.";
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

	// Full context window,  multi-position loss provides dense gradient signal
	// at every position, so the old "halve the context" trick is no longer needed.
	const thiscontextSize = Math.min(contextSize, tokens.length - 1);

	if (thiscontextSize < 1) return tf.scalar(10);

	// Causal mask (upper triangle → future positions get -1e9 after subtraction)
	const mask = tf.tidy(() => {
		const ones = tf.ones([thiscontextSize, thiscontextSize]);
		const upperTriangle = tf.linalg.bandPart(ones, 0, -1);
		const diagonal = tf.linalg.bandPart(ones, 0, 0);
		return tf.sub(upperTriangle, diagonal).mul(tf.scalar(1e9));
	});

	for (let startIdx = 0; startIdx < tokens.length - thiscontextSize; startIdx++) {
		const inputIds = tokens.slice(startIdx, startIdx + thiscontextSize)
			.map(t => vars.vocab_map.indexOf(t));

		const targetIds = tokens.slice(startIdx + 1, startIdx + thiscontextSize + 1)
			.map(t => vars.vocab_map.indexOf(t));

		let x = tf.gather(vars.embeddings, tf.tensor1d(inputIds, 'int32'));

		// Positional encoding
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
		x = tf.add(x, peTensor);

		// Transformer layers (Pre-LN)
		for (let i = 0; i < n_layers; i++) {
			const l = vars.layers[i];
			let normX = tf_layer_norm(x, l.gamma, l.beta);
			const q = tf.matMul(normX, l.wq);
			const k = tf.matMul(normX, l.wk);
			const v = tf.matMul(normX, l.wv);
			let scores = tf.matMul(q, k.transpose()).div(tf.sqrt(tf.scalar(d_model)));
			scores = tf.sub(scores, mask);
			const weights = tf.softmax(scores);
			x = tf.add(x, tf.matMul(tf.matMul(weights, v), l.wo));

			let normX2 = tf_layer_norm(x, l.gamma2, l.beta2);
			let ffn = tf.relu(tf.add(tf.matMul(normX2, l.w1), l.b1));
			ffn = tf.add(tf.matMul(ffn, l.w2), l.b2);
			x = tf.add(x, ffn);
		}

		const logits = tf.matMul(x, vars.embeddings.transpose()); // [seqLen, vocabSize]
		const labels = tf.oneHot(tf.tensor1d(targetIds, 'int32'), vars.vocab_map.length);
		losses.push(tf.losses.softmaxCrossEntropy(labels, logits));
	}

	if (losses.length === 0) return tf.scalar(10);
	return tf.addN(losses).div(tf.scalar(losses.length));
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
		const headData = engine.forward(h, contextTokens, contextTokens);

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
		calculate_vector_math();
	}
	const weights = window.currentWeights;

	// 1. Embedding Space
	window.persistentEmbeddingSpace = get_or_init_embeddings(trainingTokens, d_model);
	render_embedding_plot(d_model);
	tled_initEditor();

	// 2. Visualizations
	tokensWithPositional = calculate_positional_injection(knownTokens, d_model);
	render_positional_waves(d_model, knownTokens);

	const h0 = render_positional_shift_plot(knownTokens, d_model);

	render_architecture_stats(d_model, n_heads, n_layers, temperature);

	const migrationContainer = document.getElementById('transformer-migration-plots-container');
	if (migrationContainer) {
		migrationContainer.innerHTML = '';
		transformerLabVisMigrationDataRegistry.clear();
	}

	// Reset trajectory collector so it captures fresh data for this run
	window.tlab_trajectory_collector = null;

	// Remove stale full-trajectory plot so it gets recreated
	const oldTrajDiv = document.getElementById('transformer-trajectory-full-path');
	if (oldTrajDiv) oldTrajDiv.remove();

	if (tokensWithPositional.length === 0) {
		document.getElementById('transformer-output-projection').innerHTML =
			`<div style="padding:20px; color: #64748b; text-align:center;">
		Input words not found in Training Data.
	     </div>`;
	} else {
		// ── Layer 0: Explicit processing for detailed visualizations ──
		multiLayerAttentionRegistry.clear();

		const normH0 = calculateLayerNorm(h0, weights[0]["gamma"], weights[0]["beta"]);

		const engine = new AttentionEngine({
			d_model: d_model,
			n_heads: n_heads,
			containerId: "mha-calculation-details",
			weights: weights[0]["attention"]
		});

		const headData = engine.forward(normH0, tokensWithPositional, knownTokens);
		const multiHeadOutput = updateConcatenationDisplay(headData, tokensWithPositional);

		const Wo_layer0 = weights[0]["attention"]["output"];
		const projected = multiHeadOutput.map(row =>
			Wo_layer0[0].map((_, j) => row.reduce((sum, val, k) => sum + val * Wo_layer0[k][j], 0))
		);

		const h1 = h0.map((row, i) => row.map((val, j) => val + projected[i][j]));

		render_h1_logic(h0, normH0, multiHeadOutput, weights[0]["gamma"], weights[0]["beta"], weights[0]["attention"]["output"]);

		const h2 = run_ffn_block(h1, weights[0]);

		// Pass knownTokens (string[]) for labeling
		create_migration_plot('migration-layer-1', tokensWithPositional, h0, h2, 1, d_model, h2, knownTokens);

		run_deep_layers(h2, tokensWithPositional, n_layers, d_model, n_heads, weights, 1, knownTokens);

		// After run_deep_layers call in run_and_visualize_network:
		// Force the combined multi-layer render
		const mhaContainer = document.getElementById('mha-calculation-details');
		if (mhaContainer) {
			const registryEntry = attentionRenderRegistry.get('mha-calculation-details');
			if (registryEntry) {
				registryEntry.rendered = false;
				const engineInstance = registryEntry.instance;
				engineInstance.executeActualRender(registryEntry.headData, registryEntry.tokens);
			}
		}

		// ── All layers processed: trigger trajectory plot immediately ──
		if (window.tlab_trajectory_collector) {
			if (d_model === 2 || d_model === 3) {
				const containerId = 'transformer-trajectory-full-path';
				let trajDiv = document.getElementById(containerId);

				// Recreate div if it was removed
				if (!trajDiv) {
					trajDiv = document.createElement('div');
					trajDiv.id = containerId;
					// Append to appropriate parent, e.g., migrationContainer or a specific wrapper
					document.getElementById('transformer-migration-plots-container').appendChild(trajDiv);
				}

				// Register the data for the observer
				trajectoryRenderRegistry.set(containerId, {
					d_model: d_model,
					rendered: false
				});

				// Start observing
				trajectoryObserver.observe(trajDiv);
			} else {
				$("#transformer-trajectory-full-path").remove();
			}
		}
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

			const normH = calculateLayerNorm(h_current, layerWeights["gamma"], layerWeights["beta"]);

			const attnEngine = new AttentionEngine({ d_model, n_heads, containerId: null, weights: layerWeights["attention"] });
			const headData = attnEngine.forward(normH, knownMasterTokens);

			const concat = knownMasterTokens.map((_, tIdx) => [].concat(...headData.map(hd => hd.context[tIdx])));

			const Wo = layerWeights["attention"]["output"];
			const projected = concat.map(row =>
				Wo[0].map((_, j) => row.reduce((sum, val, k) => sum + val * Wo[k][j], 0))
			);

			const h_attn = h_current.map((row, i) => row.map((val, j) => val + projected[i][j]));

			h_current = run_ffn_block(h_attn, layerWeights);
		}

		render_final_projection(h_current, vocabulary, d_model, temperature);
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

	// 1. Prepare W_vocab
	const W_vocab = vocabulary.map(word => window.persistentEmbeddingSpace[word] || new Array(d_model).fill(0));

	// 2. Calculate Logits and explain step-by-step
	let calculationHtml = `<div style="margin-top: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
	<h3>1. Step-by-Step Logit Calculation (Manual Verification)</h3>
	<p>To get the logit for each word, we calculate the dot product between the final hidden state vector $h_\\text{last}$ and the word's learned embedding row $w_\\text{row}$ from the Unembedding Matrix $W_\\text{vocab}$. It really only uses the last row of the last calculation of the network, as that one is the last word the transformer has seen, and this one is used for the next word. The previous numbers in the last matrix are not used here per se, but they were needed to calculate this one in the attention and $W_\\text{FFN}$ matrices. They are just ignored in the last step, yet calculated because that is required by the structure</p>
	
	<span class="md">
To get from the long matrix to the single vector, the model performs a **Terminal Selection**.

If we represent the output of the last transformer block as a matrix $H$:
$$H = \\begin{pmatrix}
h_0 \\\\
h_1 \\\\
\\vdots \\\\
h_{n-1}
\\end{pmatrix} \\in \\mathbb{R}^{n \\times d_{\\text{model}}}$$

The "Migration Map" prints the entire flattened matrix because it wants to show the path of every word. However, the \`render_final_projection\` function is only interested in the <b>prediction</b>:

$$h_{\\text{last}} = H[n-1]$$

Remember that the $n$ is the number of tokens in the <b>Inference</b>-sequence, not in the training sequence, even though the $h_\\text{after}$ may be from the training data.
</span>

This single row $h_{\\text{last}}$ is a vector in $d_{\\text{model}}$ space. When the model is, for example, $d_{\\text{model}}=3$, it is always exactly 3 numbers (but in general, it's always $d_\\text{model}$). These 3 numbers are a "compressed summary" of the entire sequence's context, which is why the previous tokens can be "ignored" at this specific final stage, their influence is already baked into that last vector.
	</span>

	<p>Current $h_\\text{last} = [${h_last.map(v => v.toFixed(nr_fixed)).join(', ')}]$</p>`;

	const logits = vocabulary.map((word, i) => {
		const w_row = W_vocab[i];

		// Manual calculation string for LaTeX
		let dotProductFormula = `\\text{logit}_{\\text{${word}}} = `;
		let sum = 0;
		let terms = [];

		h_last.forEach((h_val, dim) => {
			const product = h_val * w_row[dim];
			sum += product;
			terms.push(`(${h_val.toFixed(nr_fixed)} \\cdot ${w_row[dim].toFixed(nr_fixed)})`);
		});

		dotProductFormula += terms.join(' + ') + ` = ${sum.toFixed(nr_fixed)}`;

		calculationHtml += `<div style="margin-bottom: 10px; font-size: 0.9rem;">
	    <strong>Word: "${word}"</strong><br>
	    $$${dotProductFormula}$$
	</div>`;

		return { word, val: sum, w_row };
	});

	calculationHtml += `</div>`;

	// 3. Probabilities (Softmax)
	const scaledLogits = logits.map(item => item.val / temperature);
	const maxLogit = Math.max(...scaledLogits);
	const exps = scaledLogits.map(val => Math.exp(val - maxLogit));
	const sumExps = exps.reduce((a, b) => a + b, 0);

	const predictions = logits.map((item, i) => ({
		word: item.word,
		prob: exps[i] / sumExps,
		logit: item.val
	})).sort((a, b) => b.prob - a.prob);

	// 4. Build Interface
	let html = `<h3>2. Final Probabilities (Click to Generate)</h3>`;
	html += `<div class="prediction-chip-container" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom: 20px;">`;
	predictions.forEach(p => {
		const intensity = Math.min(1, p.prob * 5);
		html += `<button class="predict-chip" onclick="select_suggested_word('${p.word}')"
	    style="background:rgba(59, 130, 246, ${intensity}); padding:8px 15px; border-radius:20px; border:1px solid #3b82f6; cursor:pointer; color: ${p.prob > 0.4 ? 'white' : 'black'}">
	    <strong>${p.word}</strong> (${(p.prob * 100).toFixed(1)}%)
	</button>`;
	});
	html += `</div>`;

	// Combine both parts
	container.innerHTML = calculationHtml + html;

	// Trigger TeMML rendering for the math formulas
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
	<div style="background: #e0f2fe; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 0.9rem;">
	    <strong>Configuration:</strong> $d_{v} = ${dv}$, $N = ${n}$, $T = ${t}$ <br>
	    <em>Note: $T > 1.0$ increases randomness (flattens SoftMax), $T < 1.0$ makes predictions more confident.</em>
	</div>
    `;
	statsContainer.innerHTML = infoHtml;
}

function render_embedding_plot(dimensions) {
	const containerId = 'transformer-plotly-space';
	const container = document.getElementById(containerId);
	if (!container) return;

	// Register/update the data, reset rendered flag
	embeddingRenderRegistry.set(containerId, {
		d_model: dimensions,
		rendered: false
	});

	// Show placeholder if empty
	if (!container.innerHTML) {
		container.innerHTML = `<div style="padding:20px; color:#64748b;">Scroll to view Embedding Space...</div>`;
	}

	// Start observing
	embeddingObserver.observe(container);
}

function _execute_embedding_render (dimensions) {
	const container = document.getElementById('transformer-plotly-space');
	if (!container) return;

	// Clean up ghost instances from previous renders (both Plotly and ECharts)
	Plotly.purge(container);
	const existingChart = echarts.getInstanceByDom(container);
	if (existingChart) existingChart.dispose();
	container.innerHTML = '';

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

		const layout = { title: "Embedding Space" };
		if (dimensions === 3) {
			layout.scene = {
				xaxis: { title: 'Dim 0' },
				yaxis: { title: 'Dim 1' },
				zaxis: { title: 'Dim 2' }
			};
		} else {
			layout.xaxis = { title: 'Dim 0' };
			layout.yaxis = { title: dimensions >= 2 ? 'Dim 1' : '' };
		}

		Plotly.newPlot(container, traces, layout);
	} else {
		const myChart = echarts.init(container);
		const parallelAxis = Array.from({ length: dimensions }, (_, i) => ({ dim: i, name: `D${i}` }));

		const data = tokens.map(token => ({
			name: token,
			value: window.persistentEmbeddingSpace[token]
		}));

		myChart.setOption({
			title: { text: "Embedding Space", left: 'center' },
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

		myChart.resize();
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

    const matrixToPmatrix = (matrix) =>
        `\\begin{pmatrix} ` + matrix.map(row => row.map(v => v.toFixed(nr_fixed)).join(' & ')).join(' \\\\ ') + ` \\end{pmatrix}`;

    const vecToPmatrix = (vec) =>
        `\\begin{pmatrix} ${vec.map(v => v.toFixed(nr_fixed)).join(' & ')} \\end{pmatrix}`;

    // Project the Multi-Head Output using WO
    const projectedMHA = multiHeadOutput.map(row =>
        WO[0].map((_, i) => row.reduce((acc, _, j) => acc + row[j] * WO[j][i], 0))
    );

    // h1 = h0 + projected (Pre-LN: no normalization on the sublayer output)
    const h1 = h0.map((row, i) => row.map((val, j) => val + projectedMHA[i][j]));

    // ── FIX: Display Pre-LN steps instead of Post-LN ──
    normContainer.innerHTML = `
        <p style="font-size:0.9rem; font-weight:bold; color:#065f46;">Pre-Layer Normalization (applied <em>before</em> the sublayer)</p>

        <div style="margin-bottom:15px;">
            <p style="font-size:0.85rem; color:#1e40af;">1. Normalize $h_0$ before attention:</p>
            $$ \\text{Norm}(h_0) = \\underbrace{\\gamma}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} \\underbrace{\\odot}_{\\substack{\\text{Hadamard} \\\\ \\text{Product}}} \\frac{h_0 - \\underbrace{\\mu}_{\\text{Mean of } h_0}}{\\sqrt{\\underbrace{\\sigma^2}_{\\text{Variance of } h_0}} + \\underbrace{\\epsilon}_{${epsilon}}} + \\underbrace{\\beta}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} $$
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
    let gamma2 = params.gamma2 || new Array(d_model).fill(1.0);
    let beta2 = params.beta2 || new Array(d_model).fill(0.0);

    // Pre-LN: normalize h1 BEFORE FFN
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

    // Residual: h2 = h1 + FFN(normed_h1), no post-norm
    const h2 = h1.map((row, i) => row.map((val, j) => val + out_FFN[i][j]));

    render_ffn_absolute_full(h1, normed_h1, W1, b1, out_L1, W2, b2, out_FFN, h2, gamma2, beta2);

    return h2;
}



/**
 * Erzeugt LaTeX-Output für Matrizen ohne Limitierungen.
 */
/**
 * Goal: Show FFN LayerNorm parameters
 */
function render_ffn_absolute_full(h1, normed_h1, W1, b1, out_L1, W2, b2, out_FFN, h2, gamma, beta) {
	const rawMP = (m) => `\\begin{pmatrix} ${m.map(r => r.map(v => v.toFixed(nr_fixed)).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
	const rawVP = (v) => `\\begin{pmatrix} ${v.map(val => val.toFixed(nr_fixed)).join(' & ')} \\end{pmatrix}`;

	document.getElementById('ffn-step-1').innerHTML = `
    <div style="margin-bottom:15px; padding:10px; border:1px solid #10b981; border-radius:8px; background:#ecfdf5;">
	<p style="font-size:0.85rem; color:#065f46;"><strong>Pre-LN:</strong> Normalize $h_1$ before FFN</p>
	$$ \\text{Norm}(h_1) = \\underbrace{\\gamma_{\\text{ffn}}}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} \\underbrace{\\odot}_{\\substack{\\text{Hadamard} \\\\ \\text{Product}}} \\frac{h_1 - \\underbrace{\\mu}_{\\text{Mean of } h_1}}{\\sqrt{\\underbrace{\\sigma^2}_{\\text{Variance of } h_1} + \\underbrace{${epsilon}}_\\epsilon}} + \\underbrace{\\beta_{\\text{ffn}}}_{\\substack{\\text{Learnable} \\\\ \\text{Parameter}}} $$
	<div style="overflow-x:auto;">
	    $$ \\underbrace{${rawMP(normed_h1)}}_{\\text{Norm}\\left(h_1\\right)} = \\text{LayerNorm}\\!\\left(\\underbrace{${rawMP(h1)}}_{h_1},\\; \\underbrace{${rawVP(gamma)}}_\\gamma,\\; \\underbrace{${rawVP(beta)}}_\\beta\\right) $$
		<br>
	</div>
    </div>
    $$ \\text{out}_{L1} = \\text{ReLU}\\!\\left(\\text{Norm}(h_1) \\cdot W_1 + b_1\\right) = \\underbrace{${rawMP(out_L1)}}_{\\text{out}_{L1}} $$
    `;

	document.getElementById('ffn-step-2').innerHTML = `
    $$ \\text{out}_{L2} = \\text{out}_{L1} \\cdot W_2 + b_2 = \\underbrace{${rawMP(out_FFN)}}_{\\text{Out}_\\text{FFN}} $$
    `;

	document.getElementById('ffn-step-3').innerHTML = `
    <div style="margin-bottom:10px;">
	<p style="font-size:0.85rem; color:#1e40af;"><strong>Residual connection</strong> (Pre-LN: no normalization on sublayer output):</p>
	$$ h_2 = h_1 + \\text{out}_{L2} $$
    </div>
    <div style="overflow-x:auto;">
	$$ \\underbrace{${rawMP(h2)}}_{h_2} = \\underbrace{${rawMP(h1)}}_{h_1} + \\underbrace{${rawMP(out_FFN)}}_{\\text{out}_{L2}} $$
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
		const layerWeights = this_weights[n];

		// Pre-LN: normalize BEFORE attention
		const normH = calculateLayerNorm(h_current, layerWeights["gamma"], layerWeights["beta"]);

		// 1. Sublayer 1: Attention (on normalized input)
		// Use the shared container so all layers appear in the tabbed UI
		const engine = new AttentionEngine({
			d_model,
			n_heads,
			containerId: "mha-calculation-details",
			weights: layerWeights["attention"]
		});

		const headData = engine.forward(normH, tokens, tokenStrings);
		const concatOutput = tokens.map((_, tIdx) => [].concat(...headData.map(h => h.context[tIdx])));

		// Apply Wo (output projection)
		const Wo = layerWeights["attention"]["output"];
		const projected = concatOutput.map(row =>
			Wo[0].map((_, j) => row.reduce((sum, val, k) => sum + val * Wo[k][j], 0))
		);

		// 2. Residual connection
		const h_attn = h_current.map((row, i) => row.map((val, j) => val + projected[i][j]));

		// 3. Sublayer 2: Feed Forward & Add
		const h_after = run_ffn_block(h_attn, layerWeights);

		// Visualization — pass tokenStrings for human-readable labels
		create_migration_plot(`migration-layer-${n + 1}`, tokens, h_before_layer, h_after, n + 1, d_model, h_after, tokenStrings);
		tlab_render_weight_grid(layerWeights, n);

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
				render_migration_logic(id, data.tokens, data.start_h, data.end_h, data.layerNum, data.d_model, data.h_after, data.tokenStrings);
				data.rendered = true;
			}
		}
	});
}, { threshold: 0.1 });

function create_migration_plot(id, tokens, start_h, end_h, layerNum, d_model, h_after, tokenStrings) {
	const container = document.getElementById('transformer-migration-plots-container');
	if (!container) return;

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
		// Look up raw embeddings using STRING tokens
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

	// ── Create DOM element for per-layer migration plot (lazy rendered) ──
	let plotDiv = document.getElementById(id);
	if (!plotDiv) {
		const wrapperDiv = document.createElement('div');
		wrapperDiv.style.cssText = "border: 2px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-top: 30px; background: #fff;";

		plotDiv = document.createElement('div');
		plotDiv.id = id;
		plotDiv.style.cssText = "height: 500px; width: 100%;";

		wrapperDiv.appendChild(plotDiv);
		container.appendChild(wrapperDiv);

		migrationObserver.observe(plotDiv);
	}

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

		let weightContainer = plotDiv.nextElementSibling;
		if (!weightContainer || !weightContainer.classList.contains('weight-grid-viz')) {
			weightContainer = document.createElement('div');
			weightContainer.className = 'weight-grid-viz';
			// Column layout: Header on top, then the horizontal row of matrices
			weightContainer.style = "display: flex; flex-direction: column; align-items: center; margin: 40px 0; padding: 0; clear: both; width: 100%;";
			plotDiv.parentNode.insertBefore(weightContainer, plotDiv.nextSibling);
		}

		weightContainer.innerHTML = '';

		// 2. Horizontal container for the matrices
		const gridBox = document.createElement('div');
		// display: flex with gap ensures they sit side-by-side
		gridBox.style = "display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; gap: 10px; width: 100%;";
		weightContainer.appendChild(gridBox);

		const weights = window.currentWeights[layerNum];
		const targets = [
			{ name: 'W1', data: weights.W1 },
			{ name: 'W2', data: weights.W2 },
			{ name: 'Q',  data: weights.attention?.query },
			{ name: 'K',  data: weights.attention?.key },
			{ name: 'V',  data: weights.attention?.value }
		];

		targets.forEach(target => {
			if (!target.data || !target.data.length) return;

			const wrap = document.createElement('div');
			// flex: 1 tells each matrix to take up an equal share of the width
			wrap.style = "text-align: center; flex: 1; display: flex; flex-direction: column; min-width: 0;";
			wrap.innerHTML = `<div style="font-size: 10px; font-weight: bold; color: #94a3b8; margin-bottom: 5px; font-family: monospace; white-space: nowrap;">${target.name}</div>`;

			const canvas = document.createElement('canvas');
			const rows = target.data.length;
			const cols = Array.isArray(target.data[0]) ? target.data[0].length : 1;

			// Set internal resolution
			canvas.width = cols;
			canvas.height = rows;

			// CSS to force it to fill its flex-allocated width
			canvas.style.width = "100%";
			canvas.style.height = "auto";
			canvas.style.imageRendering = "pixelated";
			canvas.style.display = "block";
			canvas.style.maxHeight = "145px";
			// Optional: slight border to distinguish adjacent white/yellow pixels
			canvas.style.outline = "1px solid #f1f5f9";

			const ctx = canvas.getContext('2d');

			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					const val = Array.isArray(target.data[r]) ? target.data[r][c] : target.data[r];

					const t = Math.max(0, Math.min(1, (val + 1) / 2));
					const red = Math.floor(t * 255);
					const green = Math.floor(32 + t * 223);
					const blue = Math.floor(77 * (1 - t));

					ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
					ctx.fillRect(c, r, 1, 1);
				}
			}
			wrap.appendChild(canvas);
			gridBox.appendChild(wrap);
		});
	});
}

function tlab_render_plotly(id, tokens, start_h, end_h, layerNum, d_model, isLastLayer, nextWordIndex) {
	const traces = [];
	const is3D = d_model === 3;

	tokens.forEach((token, i) => {
		const t = tokens.length > 1 ? i / (tokens.length - 1) : 0;
		const r = Math.round(59 + (16 - 59) * t);
		const g = Math.round(130 + (185 - 130) * t);
		const b = Math.round(246 + (129 - 246) * t);
		const posColor = `rgb(${r}, ${g}, ${b})`;

		const sourceWord = tlab_get_top_word_only(start_h[i]);
		const destWord = tlab_get_top_word_only(end_h[i]);
		const hoverLabel = `From '${sourceWord}' to '${destWord}', position ${i + 1}`;

		const x = [start_h[i][0], end_h[i][0]];
		const y = d_model >= 2 ? [start_h[i][1], end_h[i][1]] : [0, 0];

		if (is3D) {
			const z = [start_h[i][2], end_h[i][2]];
			// 3D Line
			traces.push({
				type: 'scatter3d', x: x, y: y, z: z, mode: 'lines',
				line: { width: 4, color: posColor },
				showlegend: false,
				hovertemplate: `${hoverLabel}<extra></extra>`
			});
			// 3D Cone
			traces.push({
				type: 'cone', x: [x[1]], y: [y[1]], z: [z[1]],
				u: [x[1] - x[0]], v: [y[1] - y[0]], w: [z[1] - z[0]],
				sizemode: 'absolute', sizeref: 0.15, anchor: 'tip',
				colorscale: [[0, posColor], [1, posColor]], showscale: false,
				hoverinfo: 'skip', showlegend: false
			});
		} else {
			// 2D Line and Arrow
			traces.push({
				type: 'scatter', x: x, y: y, mode: 'lines+markers',
				line: { width: 2, color: posColor },
				marker: { size: [0, 12], symbol: 'arrow', angleref: 'previous', color: posColor },
				showlegend: false,
				hovertemplate: `${hoverLabel}<extra></extra>`
			});
		}
	});

	// Colorbar Trace - dimensionality must match exactly to avoid "b is undefined"
	const colorbarTrace = {
		type: is3D ? 'scatter3d' : 'scatter',
		x: [null], y: [null],
		mode: 'markers',
		showlegend: false,
		marker: {
			colorscale: [[0, 'rgb(59, 130, 246)'], [1, 'rgb(16, 185, 129)']],
			cmin: 1, cmax: tokens.length, color: [1, tokens.length],
			showscale: true,
			colorbar: { title: 'Position', thickness: 15, len: 0.7 }
		},
		hoverinfo: 'none'
	};
	if (is3D) colorbarTrace.z = [null];
	traces.push(colorbarTrace);

	// Separate Layouts to prevent 3D properties from breaking 2D rendering
	const commonLayout = {
		title: `Layer ${layerNum}: Feature Migration`,
		autosize: true,
		hovermode: 'closest',
		margin: { t: 50, b: 20, l: 20, r: 80 }
	};

	const layout = is3D ? {
		...commonLayout,
		scene: {
			xaxis: { title: 'Dim 0' },
			yaxis: { title: 'Dim 1' },
			zaxis: { title: 'Dim 2' }
		}
	} : {
		...commonLayout,
		xaxis: { title: 'Dim 0' },
		yaxis: { title: 'Dim 1' }
	};

	Plotly.newPlot(id, traces, layout, { responsive: true });
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

/**
 * render_migration_logic
 * Captures the state of tokens at each stage of the forward pass.
 */
/**
 * render_migration_logic
 * Captures the state of tokens at each stage of the forward pass.
 * 
 * @param {string} id - DOM element ID for the plot
 * @param {Array} tokens - Token embedding vectors (numeric arrays)
 * @param {Array} start_h - Hidden states before this layer
 * @param {Array} end_h - Hidden states after this layer
 * @param {number} layerNum - Current layer number
 * @param {number} d_model - Model dimension
 * @param {Array} h_after - Final hidden states after residual
 * @param {string[]} [tokenStrings] - Human-readable token strings for labeling
 */
/**
 * render_migration_logic
 * Handles VISUAL rendering of per-layer migration plots.
 * Data capture is now done eagerly in create_migration_plot.
 *
 * @param {string} id - DOM element ID for the plot
 * @param {Array} tokens - Token embedding vectors (numeric arrays)
 * @param {Array} start_h - Hidden states before this layer
 * @param {Array} end_h - Hidden states after this layer
 * @param {number} layerNum - Current layer number
 * @param {number} d_model - Model dimension
 * @param {Array} h_after - Final hidden states after residual
 * @param {string[]} [tokenStrings] - Human-readable token strings for labeling
 */
function render_migration_logic(id, tokens, start_h, end_h, layerNum, d_model, h_after, tokenStrings) {
    const plotDiv = document.getElementById(id);
    if (!plotDiv) return;
    plotDiv.style.width = '100%';

    const nextWordIndex = tokens.length - 1;
    const migrationContainers = document.querySelectorAll('[id^="migration-layer-"]');
    const totalLayersCount = migrationContainers.length;
    const isLastInDom = totalLayersCount > 0 && migrationContainers[totalLayersCount - 1].id === id;

    if (d_model <= 3) {
        tlab_render_plotly(id, tokens, start_h, end_h, layerNum, d_model, isLastInDom, nextWordIndex);
    } else {
        tlab_render_echarts(plotDiv, tokens, start_h, end_h, layerNum, d_model, isLastInDom, nextWordIndex);
    }
    tlab_render_latex_matrix(id, plotDiv, tokens, start_h, end_h, h_after, d_model);
    tlab_render_weight_grid(id, layerNum);
}



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
		trajDiv.style.cssText = "width:100%; height:850px;";
		mainContainer.appendChild(trajDiv);
	}

	const labels = displayTokens || tokens.map((t, i) => {
		if (typeof t === 'string') return t;
		return tlab_get_top_word_only(t);
	});

	const dataPoints = sortedKeys.map(k => steps[k]);

	const getTokenColor = (tIdx, total) => {
		if (total <= 1) return 'rgb(59, 130, 246)';
		const t = tIdx / (total - 1);
		const r = Math.round(59 + (16 - 59) * t);
		const g = Math.round(130 + (185 - 130) * t);
		const b = Math.round(246 + (129 - 246) * t);
		return `rgb(${r}, ${g}, ${b})`;
	};

	const traces = [];
	const annotations = [];

	tokens.forEach((token, tIdx) => {
		const x = dataPoints.map(p => p.data[tIdx][0]);
		const y = dataPoints.map(p => p.data[tIdx][1]);
		const z = d_model === 3 ? dataPoints.map(p => p.data[tIdx][2]) : null;
		const tColor = getTokenColor(tIdx, tokens.length);

		const tokenLabel = `${labels[tIdx]} (${tIdx + 1})`;

		// Hover text now includes the position number
		const hoverTexts = dataPoints.map(p => `${labels[tIdx]} (${tIdx + 1}) @ ${p.name}`);

		if (d_model === 3) {
			traces.push({
				type: 'scatter3d',
				x: x, y: y, z: z,
				mode: 'lines',
				name: tokenLabel,
				line: { width: 5, color: tColor },
				hoverinfo: 'text',
				hovertemplate: '<b>%{text}</b><extra></extra>',
				text: hoverTexts
			});

			for (let i = 0; i < x.length - 1; i++) {
				traces.push({
					type: 'cone',
					x: [x[i + 1]], y: [y[i + 1]], z: [z[i + 1]],
					u: [x[i + 1] - x[i]], v: [y[i + 1] - y[i]], w: [z[i + 1] - z[i]],
					sizemode: 'absolute', sizeref: 0.15, anchor: 'tip',
					colorscale: [[0, tColor], [1, tColor]], showscale: false,
					hoverinfo: 'skip', showlegend: false
				});
			}

		} else {
			traces.push({
				type: 'scatter',
				x: x, y: y,
				mode: 'lines',
				name: tokenLabel,
				line: { width: 2, color: tColor, dash: 'dot' },
				hoverinfo: 'text',
				hovertemplate: '<b>%{text}</b><extra></extra>',
				text: hoverTexts
			});

			for (let i = 0; i < x.length - 1; i++) {
				annotations.push({
					x: x[i + 1], y: y[i + 1],
					ax: x[i], ay: y[i],
					xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
					showarrow: true,
					arrowhead: 3,
					arrowsize: 1.5,
					arrowwidth: 3,
					arrowcolor: tColor,
					opacity: 0.9
				});
			}

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
		}
	});

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





function tlab_render_latex_matrix(id, plotDiv, tokens, start_h, end_h, h_after, d_model) {
	// Helper to calculate RGB components based on position
	const getPosColorComponents = (index, total) => {
		if (total <= 1) return { r: 59, g: 130, b: 246 };
		const ratio = index / (total - 1);
		return {
			r: Math.round(59 + (16 - 59) * ratio),
			g: Math.round(130 + (185 - 130) * ratio),
			b: Math.round(246 + (129 - 246) * ratio)
		};
	};

	// Formats color for TeMML: \color[RGB]{r,g,b}
	const formatTeMMLColor = (c) => `\\color[RGB]{${c.r},${c.g},${c.b}}`;

	const toPMatrixColored = (matrix) => {
		if (!Array.isArray(matrix) || !matrix.length) return '';

		const rows = matrix.map((row, tIdx) => {
			const colorObj = getPosColorComponents(tIdx, matrix.length);
			const colorCmd = formatTeMMLColor(colorObj);
			// Apply color to each individual cell to avoid grouping errors with '&'
			return row.map(v => `${colorCmd} ${v.toFixed(nr_fixed)}`).join(' & ');
		}).join(' \\\\ ');

		return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
	};

	const vocabRows = tokens.map((_, tIdx) => {
		const fromList = tlab_get_top_vocab_list(start_h[tIdx], d_model);
		const toList = tlab_get_top_vocab_list(end_h[tIdx], d_model);

		const colorObj = getPosColorComponents(tIdx, tokens.length);
		const colorCmd = formatTeMMLColor(colorObj);

		// Apply color to each mapping pair (each cell)
		return fromList.map((fromItem, i) => {
			const toItem = toList[i] || {word: '???', prob: 0};
			const cleanFrom = fromItem.word.replace(/#/g, '\\#').replace(/_/g, '\\_');
			const cleanTo = toItem.word.replace(/#/g, '\\#').replace(/_/g, '\\_');

			// Calculate percentage strings
			const fromProb = Math.round(fromItem.prob * 100);
			const toProb = Math.round(toItem.prob * 100);

			return `${colorCmd} \\text{${cleanFrom}} (${fromProb}\\%) \\rightarrow \\text{${cleanTo}} (${toProb}\\%)`;
		}).join(' & ');
	}).join(' \\\\ ');

	// Restored h_after and added probability mapping
	const latexString = `$$h_\\text{after} = ${toPMatrixColored(h_after)}, \\quad h_\\text{after} \\cdot W_\\text{vocab} \\approx \\begin{pmatrix} ${vocabRows} \\end{pmatrix}$$`;

	let latexDiv = document.getElementById(id + '-latex-debug');
	if (!latexDiv) {
		latexDiv = document.createElement('div');
		latexDiv.id = id + '-latex-debug';
		latexDiv.style.marginTop = '20px';
		latexDiv.style.overflowX = 'auto';
		latexDiv.style.fontSize = '0.8rem';
		plotDiv.parentNode.insertBefore(latexDiv, plotDiv.nextSibling);
	}
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
		const dotProduct = h_vec.reduce((sum, val, i) => sum + val * (w_vec[i] || 0), 0);
		if (dotProduct > maxDot) {
			maxDot = dotProduct;
			bestWord = word;
		}
	});
	return bestWord;
}

function tlab_get_top_vocab_list(h_vec, d_model) {
	if (!window.persistentEmbeddingSpace) return [];
	const vocabulary = Object.keys(window.persistentEmbeddingSpace);
	const tempInput = document.getElementById('transformer-temperature');
	const temperature = tempInput ? parseFloat(tempInput.value) : 1.0;

	let scores = vocabulary.map(word => {
		const w_vec = window.persistentEmbeddingSpace[word];
		const dotProduct = h_vec.reduce((sum, val, i) => sum + val * (w_vec[i] || 0), 0);
		return { word, score: dotProduct };
	});

	const scaledScores = scores.map(s => s.score / temperature);
	const maxScore = Math.max(...scaledScores);
	const exps = scaledScores.map(s => Math.exp(s - maxScore));
	const sumExps = exps.reduce((a, b) => a + b, 0);
	const probs = exps.map(e => e / sumExps);

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
	const injectedEmbeddings = compute_positional_injections(tokenStrings, d_model);

	// Update registry with latest parameters, pre-computed embeddings, and reset render flag
	positionalShiftRegistry.set(containerId, {
		tokenStrings: tokenStrings,
		d_model: d_model,
		injectedEmbeddings: injectedEmbeddings,
		rendered: false
	});

	if (container) {
		if (!container.innerHTML) {
			container.innerHTML = `<div style="padding:20px; color:#64748b;">Scroll to view Positional Shift Plot...</div>`;
		}
		positionalShiftObserver.observe(container);
	}

	return injectedEmbeddings;
}

function compute_positional_injections(tokenStrings, d_model) {
	const injectedEmbeddings = [];

	tokenStrings.forEach((token, pos) => {
		const semanticBase = window.persistentEmbeddingSpace[token];
		if (!semanticBase) {
			// If token not found, push zeros so indices stay aligned
			injectedEmbeddings.push(new Array(d_model).fill(0));
			return;
		}

		const peVec = new Array(d_model).fill(0);
		for (let i = 0; i < d_model; i += 2) {
			const div_term = Math.pow(10000, i / d_model);
			peVec[i] = Math.sin(pos / div_term) * posEmbedScalar;
			if (i + 1 < d_model) {
				peVec[i + 1] = Math.cos(pos / div_term) * posEmbedScalar;
			}
		}

		const combined = semanticBase.map((val, i) => val + peVec[i]);
		injectedEmbeddings.push(combined);
	});

	return injectedEmbeddings;
}

function _execute_shift_render(tokenStrings, d_model, injectedEmbeddings) {
	const container = document.getElementById('transformer-pe-shift-plot');
	if (!Array.isArray(tokenStrings) || typeof tokenStrings[0] !== 'string') {
		console.error("Plotting requires an array of string tokens.");
		return;
	}

	// Clean up ghost instances from previous renders
	Plotly.purge(container);
	const existingChart = echarts.getInstanceByDom(container);
	if (existingChart) existingChart.dispose();
	container.innerHTML = '';

	const getHueFromToken = (str) => {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		return Math.abs(hash) % 360;
	};

	const traces = [];
	const echartsData = [];

	tokenStrings.forEach((token, pos) => {
		const semanticBase = window.persistentEmbeddingSpace[token];
		if (!semanticBase) return;

		const combined = injectedEmbeddings[pos];
		if (!combined) return;

		// Derive the PE vector for visualization (arrow direction)
		const peVec = combined.map((val, i) => val - semanticBase[i]);

		const hue = getHueFromToken(token);
		const tokenColor = `hsl(${hue}, 75%, 50%)`;

		if (d_model <= 3) {
			const x = [semanticBase[0], combined[0]];
			const y = d_model >= 2 ? [semanticBase[1], combined[1]] : [0, 0];
			const z = d_model === 3 ? [semanticBase[2], combined[2]] : [0, 0];

			if (d_model === 3) {
				traces.push({
					type: 'scatter3d',
					x: x, y: y, z: z,
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
					type: 'scatter', x: x, y: y, mode: 'lines+markers',
					line: { width: 3, color: tokenColor },
					name: `${token} (pos ${pos})`,
					legendgroup: token,
					marker: { size: [0, 12], symbol: 'arrow', angleref: 'previous', color: tokenColor },
					hoverinfo: 'text',
					text: `Token: ${token}<br>Pos: ${pos}`
				});
			}
		} else {
			echartsData.push({
				value: semanticBase.flatMap((val, i) => [val, combined[i]]),
				name: `${token} (pos ${pos})`,
				lineStyle: { color: tokenColor }
			});
		}
	});

	if (d_model <= 3 && traces.length > 0) {
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

	} else if (d_model > 3) {
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


/**
 * Calculates vector arithmetic dynamically based on the current Transformer Embedding Space.
 */
window.calculate_vector_math = function() {
	const inputVal = document.getElementById('transformer-vector-math-input').value;
	const resDiv = document.getElementById('transformer-vector-math-result');
	const space = window.persistentEmbeddingSpace;

	// 1. Validate the environment
	if (!space || Object.keys(space).length === 0) {
		resDiv.innerHTML = "<em style='color: #94a3b8;'>Enter an equation and press Enter...</em>";
		return;
	}

	const vocabKeys = Object.keys(space);
	const d_model = space[vocabKeys[0]].length;
	// nr_fixed is pulled from the global scope defined at the top of transformerlab.js

	// 2. Create case-insensitive lookup map
	const lowerVocab = vocabKeys.reduce((acc, word) => {
		acc[word.toLowerCase()] = { vec: space[word], original: word };
		return acc;
	}, {});

	// Tokenize the input equation
	const tokens = inputVal.match(/[a-zA-ZäöüÄÖÜ0-9_#]+|\d*\.\d+|\d+|[\+\-\*\/\(\)]/g);
	if (!tokens) {
		resDiv.innerHTML = "<em style='color: #94a3b8;'>Enter an equation and press Enter...</em>";
		return;
	}

	let pos = 0;

	// Dynamic LaTeX vector formatter based on current d_model
	const toVecTex = (arr) => `\\begin{pmatrix} ${arr.map(v => v.toFixed(nr_fixed)).join(' \\\\ ')} \\end{pmatrix}`;

	function peek() { return tokens[pos]; }
	function consume() { return tokens[pos++]; }

	// 3. Recursive Descent Parser
	function parseFactor() {
		let token = consume();
		if (!token) throw new Error("Unexpected end of input");

		if (token === '(') {
			let res = parseExpression();
			if (peek() === ')') consume();
			return { val: res.val, tex: `\\left( ${res.tex} \\right)`, isScalar: res.isScalar, label: res.label };
		}
		if (token === '-') {
			let res = parseFactor();
			return { val: res.val.map(v => -v), tex: `-${res.tex}`, isScalar: res.isScalar, label: `-${res.label}` };
		}

		// Handle standalone numbers as scalars (if they aren't part of the vocab)
		if (!isNaN(token) && !lowerVocab[token.toLowerCase()]) {
			const s = parseFloat(token);
			return { val: Array(d_model).fill(s), tex: `${s}`, isScalar: true, label: `${s}` };
		}

		// Handle Vocabulary words
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

	function parseTerm() {
		let left = parseFactor();
		while (peek() === '*' || peek() === '/') {
			let op = consume();
			let right = parseFactor();
			let opTex = op === '*' ? '\\cdot' : '\\div';

			if (op === '*') {
				if (left.isScalar) {
					left.val = right.val.map(v => left.val[0] * v);
					left.isScalar = right.isScalar;
				} else {
					left.val = left.val.map(v => v * (right.isScalar ? right.val[0] : 1));
				}
			} else if (op === '/') {
				left.val = left.val.map(v => v / (right.isScalar ? right.val[0] : (right.val[0] || 1)));
			}

			left.tex = `${left.tex} ${opTex} ${right.tex}`;
			left.label = `${left.label}${op}${right.label}`;
		}
		return left;
	}

	function parseExpression() {
		let left = parseTerm();
		while (peek() === '+' || peek() === '-') {
			let op = consume();
			let right = parseTerm();

			if (op === '+') {
				left.val = left.val.map((v, i) => v + right.val[i]);
			} else if (op === '-') {
				left.val = left.val.map((v, i) => v - right.val[i]);
			}

			left.tex = `${left.tex} ${op} ${right.tex}`;
			left.label = `${left.label}${op}${right.label}`;
		}
		return left;
	}

	// 4. Execution and Output Formatting
	try {
		const result = parseExpression();
		let nearest = "None";
		let nearestVec = Array(d_model).fill(0);
		let minDist = Infinity;

		// Euclidean distance search across the entire current vocab
		vocabKeys.forEach(w => {
			const v = space[w];
			const d = Math.sqrt(v.reduce((s, val, i) => s + Math.pow(val - result.val[i], 2), 0));
			if (d < minDist) {
				minDist = d;
				nearest = w;
				nearestVec = v;
			}
		});

		const isExact = minDist < 0.001;
		const symbol = isExact ? "=" : "\\approx";
		const safeNearest = nearest.replace(/#/g, '\\#').replace(/_/g, '\\_');

		const resultTex = `\\underbrace{${toVecTex(result.val)}}_{\\substack{ ${symbol} \\text{ ${safeNearest}} \\\\ ${toVecTex(nearestVec)} }}`;

		resDiv.innerHTML = `
	    <div style="overflow-x: auto; padding: 10px 0; font-size: 1.1em;">
		$$ ${result.tex} = ${resultTex} $$
	    </div>
	`;

		// Trigger LaTeX render
		render_temml();
	} catch(e) {
		console.error("Vector Math Parse Error:", e);
		resDiv.innerHTML = "<span style='color: #ef4444;'>Syntax Error. Please check your equation formatting.</span>";
	}
};

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

	// Build token chips
	strip.innerHTML = tokens.map((word, i) => {
		const displayWord = (typeof word === 'string')
			? word
			: tlab_get_top_word_only(word);
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

	const chips = strip.querySelectorAll('.sa-token-block');
	let hoverIndex = null;

	function drawArcs() {
		const ctx = canvas.getContext('2d');

		// Size canvas to the SCROLLABLE content dimensions, not the visible viewport.
		// This ensures arcs render correctly even when the strip is wider than the container.
		const scrollW = container.scrollWidth;
		const scrollH = container.scrollHeight;
		canvas.width  = scrollW;
		canvas.height = scrollH;
		// Make the canvas element match the scroll dimensions so it covers all chips
		canvas.style.width  = scrollW + 'px';
		canvas.style.height = scrollH + 'px';

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Use the container's bounding rect as origin reference.
		// Because the canvas is positioned absolutely inside the container and sized
		// to scrollWidth, we offset chip positions by the container's own page rect
		// PLUS the current scrollLeft so arcs stay aligned with the scrolled content.
		const containerRect = container.getBoundingClientRect();

		for (let i = 0; i < tokens.length; i++) {
			for (let j = 0; j < tokens.length; j++) {
				if (i === j) continue;
				const strength = weights[i][j];
				if (strength < 0.01) continue;

				const chip1 = chips[i].getBoundingClientRect();
				const chip2 = chips[j].getBoundingClientRect();

				// Translate from page coordinates to container-scroll coordinates
				const scrollLeft = container.scrollLeft;
				const scrollTop  = container.scrollTop;

				const x1 = (chip1.left + chip1.width / 2) - containerRect.left + scrollLeft;
				const x2 = (chip2.left + chip2.width / 2) - containerRect.left + scrollLeft;
				const baseY = (chip1.top - containerRect.top) + scrollTop;

				const isSource = (hoverIndex === i);

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

				// Show percentage label on hovered arcs
				if (isSource && strength > 0.05) {
					ctx.fillStyle = "#1e40af";
					ctx.font = "bold 14px Inter, sans-serif";
					const txt = Math.round(strength * 100) + "%";
					ctx.fillText(txt, (x1 + x2) / 2 - 10, baseY - h / 1.5);
				}
			}
		}

		// Highlight the hovered chip
		chips.forEach((chip, idx) => {
			chip.style.borderColor = (idx === hoverIndex) ? '#2563eb' : 'transparent';
		});
	}

	// Attach hover events
	chips.forEach((chip, idx) => {
		chip.addEventListener('mouseover',  () => { hoverIndex = idx;  drawArcs(); });
		chip.addEventListener('mouseout',   () => { hoverIndex = null; drawArcs(); });
	});

	// Redraw when the container is scrolled (arcs must track chip positions)
	container.addEventListener('scroll', () => drawArcs());

	// Initial draw (all faint)
	drawArcs();

	// Redraw on window resize
	const resizeKey = `_resizeHandler_${containerId}`;
	if (window[resizeKey]) window.removeEventListener('resize', window[resizeKey]);
	window[resizeKey] = () => drawArcs();
	window.addEventListener('resize', window[resizeKey]);
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
    if (typeof calculate_vector_math === 'function') {
        calculate_vector_math();
    }
}

/**
 * Adds a new token to the transformer's embedding space
 * with Gaussian-random initialization (matching get_or_init_embeddings logic).
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

    // Gaussian random initialization (same as get_or_init_embeddings)
    const gaussianRandom = () => {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    space[tokenName] = Array.from({ length: d_model }, () =>
        parseFloat(gaussianRandom().toFixed(4))
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

    if (typeof calculate_vector_math === 'function') {
        calculate_vector_math();
    }
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

async function loadTransformerModule () {
	updateLoadingStatus("Loading section about transformers...");
	updateTrainButtonState();
	run_transformer_demo()

	const inputElement = document.getElementById('transformer-master-token-input');
	inputElement.addEventListener('input', (event) => {
		debouncedRun('transformer-master-token-input');
	});

	return Promise.resolve();
}
