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
			containerEl.innerHTML = `<div style="padding:20px; color:#64748b;">Wait for Attention Matrix to load...</div>`;
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
	    background:${l === 0 ? '#fff' : '#bfdbfe'}; font-weight:${l === 0 ? 'bold' : 'normal'};">
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

		// Attach metadata so the observer callback knows what to render
		headDiv.dataset.containerId = this.containerId;
		headDiv.dataset.layerIdx = layerIdx;
		headDiv.dataset.headIdx = headIdx;

		// Show a lightweight placeholder
		headDiv.innerHTML = `<div style="padding:20px; color:#94a3b8;">Wait for Head ${headIdx + 1}...</div>`;

		// Observe — the actual render fires only when this div is in the viewport
		headContentObserver.observe(headDiv);
	}

	_executeHeadRender(layerIdx, headIdx) {
		const headDiv = document.getElementById(`head-content-${this.containerId}-${layerIdx}-${headIdx}`);
		if (!headDiv || headDiv.dataset.rendered === 'true') return;

		const registry = multiLayerAttentionRegistry.get(this.containerId);
		const layerData = registry.layers[layerIdx];
		const hd = layerData.headData[headIdx];
		const layerTokens = layerData.tokens;
		const layerInstance = layerData.instance;
		const escapedTokens = layerTokens.map(t => String(t).replace(/#/g, '\\#'));

		const displayTokens = layerData.tokenStrings
			? [...layerData.tokenStrings]
			: layerTokens.map(t => {
				if (typeof t === 'string') return t;
				return tlab_get_top_word_only(t);
			});

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
	    <div style="margin-bottom:20px;">
		$$ \\text{Layer}_{${layerIdx + 1}},\\; \\text{Head}_{${headIdx + 1}} = \\text{Softmax} \\left( \\frac{Q_{${headIdx + 1}} K_{${headIdx + 1}}^T}{\\sqrt{d_k}} \\right) \\cdot V_{${headIdx + 1}} $$
	    </div>
	    <div style="overflow-x:auto;">
		${layerInstance.generateMathTable(hd, escapedTokens)}
	    </div>`;

		headDiv.dataset.rendered = 'true';

		// Stop observing since it's now rendered
		headContentObserver.unobserve(headDiv);

		render_temml();

		requestAnimationFrame(() => {
			renderDynamicAttentionWeb(
				webContainerId, webCanvasId, webStripId,
				displayTokens, hd.this_weights
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
