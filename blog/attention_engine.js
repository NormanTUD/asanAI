class AttentionEngine {
	static HEAD_COLORS = [
		'#3b82f6', '#ef4444', '#10b981', '#f59e0b',
		'#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
		'#f97316', '#6366f1', '#14b8a6', '#e11d48'
	];

	constructor(config) {
		this.d_model = config.d_model;
		this.n_heads = config.n_heads;
		this.d_k = config.d_model / config.n_heads;
		this.containerId = config.containerId;
		this.container = document.getElementById(config.containerId);

		this.this_weights = config.weights || {
			query: initWeights(this.d_model, this.d_model),
			key: initWeights(this.d_model, this.d_model),
			value: initWeights(this.d_model, this.d_model),
			output: initWeights(this.d_model, this.d_model)
		};

		// APV state per layer
		this._apvActiveHeads = new Map();   // layerIdx → Set of active head indices
		this._apvHoveredToken = new Map();  // layerIdx → { side, index } | null
		this._apvMode = new Map();          // layerIdx → 'headview' | 'matrix'
		this._apvOptions = Object.assign({
			arcHeight: 120,
			minOpacity: 0.02,
			tokenSpacing: 80,
			columnGap: 30,
			showHeadSelector: true,
			mode: 'headview',
			rowHeight: 22,
			leftColumnX: 100,
			rightColumnX: 350,
			topPadding: 40,
		}, config.apvOptions || {});

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

		const existingLayerIndex = entry.layers.findIndex(l => l.instance === this);
		const layerEntry = {
			headData: headData,
			tokens: tokens,
			tokenStrings: tokenStrings,
			instance: this
		};

		if (existingLayerIndex !== -1) {
			entry.layers[existingLayerIndex] = layerEntry;
		} else {
			entry.layers.push(layerEntry);
		}
		entry.rendered = false;

		attentionRenderRegistry.set(this.containerId, {
			headData: headData,
			tokens: tokens,
			tokenStrings: tokenStrings,
			instance: this,
			rendered: false
		});

		if (!this.container && !this.containerId) return;
		const containerEl = document.getElementById(this.containerId);
		if (containerEl && !containerEl.innerHTML.trim()) {
			containerEl.innerHTML = `<div style="padding:20px; color:#64748b;">Wait for Attention Matrix to load...</div>`;
		}
	}

	_apvEscapeHtml(str) {
		const div = document.createElement('div');
		div.textContent = str;
		return div.innerHTML;
	}

	_apvResolveTokenLabels(tokenStrings, headDataArray) {
		if (tokenStrings && Array.isArray(tokenStrings) && typeof tokenStrings[0] === 'string') {
			return [...tokenStrings];
		}
		if (headDataArray && headDataArray[0] && headDataArray[0].h0) {
			return headDataArray[0].h0.map(vec => {
				if (typeof tlab_get_top_word_only === 'function') {
					return tlab_get_top_word_only(vec);
				}
				return '???';
			});
		}
		return tokenStrings || [];
	}

	_updateLayerContent(layerIdx) {
		const contentDiv = document.getElementById(`layer-content-${this.containerId}-${layerIdx}`);
		if (!contentDiv) return;

		const registry = multiLayerAttentionRegistry.get(this.containerId);
		const layerData = registry.layers[layerIdx];
		const layerHeadData = layerData.headData;

		const headTabList = contentDiv.querySelector('.head-tab-list');
		const existingHeadBtnCount = headTabList ? headTabList.querySelectorAll('.mha-head-tab-btn').length : 0;

		if (existingHeadBtnCount !== layerHeadData.length && headTabList) {
			let headTabHtml = '';
			for (let h = 0; h < layerHeadData.length; h++) {
				const headDiv = document.getElementById(`head-content-${this.containerId}-${layerIdx}-${h}`);
				const isActive = headDiv ? headDiv.style.display !== 'none' : h === 0;
				headTabHtml += `<button class="mha-head-tab-btn" id="head-tab-btn-${this.containerId}-${layerIdx}-${h}"
		onclick="showHeadInLayer('${this.containerId}', ${layerIdx}, ${h}, ${layerHeadData.length})"
		style="padding:8px 16px; border:none; border-right:1px solid #93c5fd; cursor:pointer;
		background:${isActive ? '#fff' : '#e2e8f0'}; font-weight:${isActive ? 'bold' : 'normal'}; font-size:0.85rem;">
		Head ${h + 1}
	    </button>`;
			}
			headTabList.innerHTML = headTabHtml;
		}

		// Re-render heads that were already rendered (re-draw per-head APV)
		for (let h = 0; h < layerHeadData.length; h++) {
			const headDiv = document.getElementById(`head-content-${this.containerId}-${layerIdx}-${h}`);
			if (headDiv && headDiv.dataset.wasRenderedOnce === 'true') {
				headDiv.dataset.rendered = 'false';
				this._executeHeadRender(layerIdx, h);
			}
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

		const existingTabs = this.container.querySelector('.attention-layer-tabs');
		if (existingTabs) {
			const tabList = existingTabs.querySelector('.layer-tab-list');
			const existingBtnCount = tabList ? tabList.querySelectorAll('.mha-layer-tab-btn').length : 0;

			if (existingBtnCount !== numLayers) {
				let tabHtml = '';
				for (let l = 0; l < numLayers; l++) {
					const contentDiv = document.getElementById(`layer-content-${this.containerId}-${l}`);
					const isActive = contentDiv ? contentDiv.style.display !== 'none' : l === 0;
					tabHtml += `<button class="mha-layer-tab-btn" id="layer-tab-btn-${this.containerId}-${l}"
			onclick="showLayer('${this.containerId}', ${l}, ${numLayers})"
			style="padding:10px 18px; border:none; border-right:1px solid #93c5fd; cursor:pointer;
			background:${isActive ? '#fff' : '#bfdbfe'}; font-weight:${isActive ? 'bold' : 'normal'};">
			Layer ${l + 1}
		    </button>`;
				}
				tabList.innerHTML = tabHtml;

				for (let l = 0; l < numLayers; l++) {
					let contentDiv = document.getElementById(`layer-content-${this.containerId}-${l}`);
					if (!contentDiv) {
						contentDiv = document.createElement('div');
						contentDiv.id = `layer-content-${this.containerId}-${l}`;
						contentDiv.className = 'layer-tab-content';
						contentDiv.style.display = 'none';
						contentDiv.dataset.layerIdx = l;
						contentDiv.dataset.rendered = 'false';
						contentDiv.innerHTML = `<div style="padding:20px; color:#64748b;">Loading Layer ${l + 1}...</div>`;
						existingTabs.appendChild(contentDiv);
					}
				}
			}

			for (let l = 0; l < numLayers; l++) {
				const contentDiv = document.getElementById(`layer-content-${this.containerId}-${l}`);
				if (contentDiv && contentDiv.dataset.rendered === 'true') {
					this._updateLayerContent(l);
				}
			}
			return;
		}

		// ── First-time build: restore persisted layer ──
		const saved = this._apvLoadState();
		let startLayer = 0;
		if (saved && typeof saved.activeLayer === 'number' &&
			saved.activeLayer >= 0 && saved.activeLayer < numLayers) {
			startLayer = saved.activeLayer;
		}

		let html = `<div class="attention-layer-tabs" style="border:1px solid #3b82f6; border-radius:8px; overflow:hidden;">`;

		html += `<div class="layer-tab-list" style="background:#dbeafe; display:flex; border-bottom:2px solid #3b82f6; flex-wrap:wrap;">`;
		for (let l = 0; l < numLayers; l++) {
			html += `<button class="mha-layer-tab-btn" id="layer-tab-btn-${this.containerId}-${l}"
		onclick="showLayer('${this.containerId}', ${l}, ${numLayers})"
		style="padding:10px 18px; border:none; border-right:1px solid #93c5fd; cursor:pointer;
		background:${l === startLayer ? '#fff' : '#bfdbfe'}; font-weight:${l === startLayer ? 'bold' : 'normal'};">
		Layer ${l + 1}
	    </button>`;
		}
		html += `</div>`;

		for (let l = 0; l < numLayers; l++) {
			html += `<div id="layer-content-${this.containerId}-${l}" class="layer-tab-content"
		style="display:${l === startLayer ? 'block' : 'none'};"
		data-layer-idx="${l}" data-rendered="false">
		<div style="padding:20px; color:#64748b;">Loading Layer ${l + 1}...</div>
	    </div>`;
		}

		html += `</div>`;
		this.container.innerHTML = html;

		// Store engine instance globally for APV callbacks
		if (!window.__apv_instances) window.__apv_instances = {};
		window.__apv_instances[this.containerId] = this;

		this._renderLayerContent(startLayer);
	}

	_renderLayerContent(layerIdx) {
		const contentDiv = document.getElementById(`layer-content-${this.containerId}-${layerIdx}`);
		if (!contentDiv) return;

		const registry = multiLayerAttentionRegistry.get(this.containerId);
		const layerData = registry.layers[layerIdx];
		const layerHeadData = layerData.headData;

		if (contentDiv.dataset.rendered === 'true') {
			this._updateLayerContent(layerIdx);
			return;
		}

		// ── Initialize APV state for this layer ──
		if (!this._apvHoveredToken.has(layerIdx)) {
			this._apvHoveredToken.set(layerIdx, null);
		}

		let html = '';

		// ── Head tabs ──
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

		// ── Head content panels ──
		for (let h = 0; h < layerHeadData.length; h++) {
			html += `<div id="head-content-${this.containerId}-${layerIdx}-${h}" class="head-tab-in-layer"
	style="padding:20px; display:${h === 0 ? 'block' : 'none'}"
	data-head-idx="${h}" data-rendered="false">
	<div style="color:#94a3b8;">Loading Head ${h + 1}...</div>
    </div>`;
		}

		contentDiv.innerHTML = html;
		contentDiv.dataset.rendered = 'true';

		// Store engine instance globally for APV callbacks
		if (!window.__apv_instances) window.__apv_instances = {};
		window.__apv_instances[this.containerId] = this;

		// Render first head content
		this._renderHeadContent(layerIdx, 0);
	}

	_renderHeadContent(layerIdx, headIdx) {
		const headDiv = document.getElementById(`head-content-${this.containerId}-${layerIdx}-${headIdx}`);
		if (!headDiv || headDiv.dataset.rendered === 'true') return;

		headDiv.dataset.containerId = this.containerId;
		headDiv.dataset.layerIdx = layerIdx;
		headDiv.dataset.headIdx = headIdx;

		// If this head was already rendered once, skip the placeholder entirely
		// and render directly (synchronous update, no observer needed)
		if (headDiv.dataset.wasRenderedOnce === 'true') {
			this._executeHeadRender(layerIdx, headIdx);
			return;
		}

		// First time: show placeholder and use lazy observer
		headDiv.innerHTML = `<div style="padding:20px; color:#94a3b8;">Loading Head ${headIdx + 1}...</div>`;
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

		const color = AttentionEngine.HEAD_COLORS[headIdx % AttentionEngine.HEAD_COLORS.length];

		const apvHeadCanvasId = `apv-head-canvas-${this.containerId}-${layerIdx}-${headIdx}-headview`;
		const apvMatrixCanvasId = `apv-head-canvas-${this.containerId}-${layerIdx}-${headIdx}-matrix`;

		headDiv.innerHTML = `
    <div class="apv-per-head-section" style="margin-bottom:20px; padding:16px; background:#fafbfc; border:1px solid #e2e8f0; border-radius:8px;">
	<div id="apv-headview-wrap-${this.containerId}-${layerIdx}-${headIdx}"
	    style="display:block; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow-x:auto; overflow-y:hidden; min-height:180px; margin-bottom:8px;">
	    <svg id="${apvHeadCanvasId}" style="width:100%; min-height:180px;"></svg>
	</div>

	<div id="apv-matrix-wrap-${this.containerId}-${layerIdx}-${headIdx}"
	    style="display:block; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow-x:auto; overflow-y:hidden; min-height:180px; margin-bottom:8px;">
	    <svg id="${apvMatrixCanvasId}" style="width:100%; min-height:180px;"></svg>
	</div>

	<div style="font-size:0.75rem; color:#94a3b8; text-align:center;">
	    Hover over a token to highlight its attention connections. Line thickness = attention weight.
	</div>
    </div>

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
		headDiv.dataset.wasRenderedOnce = 'true';

		headContentObserver.unobserve(headDiv);

		render_temml();

		requestAnimationFrame(() => {
			this._apvDrawSingleHead(layerIdx, headIdx, 'headview');
			this._apvDrawSingleHead(layerIdx, headIdx, 'matrix');

			renderDynamicAttentionWeb(
				webContainerId, webCanvasId, webStripId,
				displayTokens, hd.this_weights
			);
		});
	}

	_apvDrawSingleHead(layerIdx, headIdx, mode) {
		const registry = multiLayerAttentionRegistry.get(this.containerId);
		if (!registry) return;
		const layerData = registry.layers[layerIdx];
		if (!layerData) return;

		const headDataArray = layerData.headData;
		const displayTokens = this._apvResolveTokenLabels(layerData.tokenStrings, headDataArray);
		const singleHeadData = headDataArray[headIdx];

		const canvasId = `apv-head-canvas-${this.containerId}-${layerIdx}-${headIdx}-${mode}`;
		const svg = document.getElementById(canvasId);
		if (!svg) return;

		if (mode === 'matrix') {
			this._apvDrawSingleHeadMatrix(svg, layerIdx, headIdx, singleHeadData, displayTokens);
		} else {
			this._apvDrawSingleHeadView(svg, layerIdx, headIdx, singleHeadData, displayTokens);
		}
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

	_apvDraw(layerIdx) {
		const registry = multiLayerAttentionRegistry.get(this.containerId);
		if (!registry) return;
		const layerData = registry.layers[layerIdx];
		if (!layerData) return;

		const headDataArray = layerData.headData;
		const displayTokens = this._apvResolveTokenLabels(layerData.tokenStrings, headDataArray);

		const canvasId = `apv-canvas-${this.containerId}-${layerIdx}`;
		const svg = document.getElementById(canvasId);
		if (!svg) return;

		const mode = this._apvMode.get(layerIdx) || 'headview';

		if (mode === 'matrix') {
			this._apvDrawMatrixView(svg, layerIdx, headDataArray, displayTokens);
		} else {
			this._apvDrawHeadView(svg, layerIdx, headDataArray, displayTokens);
		}
	}

	_apvDrawHeadView(svg, layerIdx, headDataArray, tokens) {
		const n = tokens.length;
		const { rowHeight, leftColumnX, rightColumnX, topPadding, minOpacity } = this._apvOptions;
		const activeHeads = this._apvActiveHeads.get(layerIdx) || new Set();

		const svgHeight = topPadding + n * rowHeight + 40;
		const svgWidth = rightColumnX + 120;

		svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
		svg.style.minHeight = svgHeight + 'px';

		let svgContent = '';

		svgContent += `<text x="${leftColumnX}" y="18" font-size="11" fill="#64748b"
	    font-weight="600" text-anchor="middle">Query (attending)</text>`;
		svgContent += `<text x="${rightColumnX}" y="18" font-size="11" fill="#64748b"
	    font-weight="600" text-anchor="middle">Key (attended to)</text>`;

		const hovered = this._apvHoveredToken.get(layerIdx);

		for (let i = 0; i < n; i++) {
			const y = topPadding + i * rowHeight;
			const isHoveredLeft = hovered && hovered.side === 'left' && hovered.index === i;
			const isHoveredRight = hovered && hovered.side === 'right' && hovered.index === i;

			svgContent += `<text x="${leftColumnX}" y="${y + 4}"
		font-size="12" fill="${isHoveredLeft ? '#1e40af' : '#334155'}"
		font-weight="${isHoveredLeft ? '700' : '500'}" text-anchor="end"
		style="cursor:pointer;"
		data-apv-side="left" data-apv-idx="${i}"
		>${this._apvEscapeHtml(tokens[i])}</text>`;

			svgContent += `<text x="${rightColumnX}" y="${y + 4}"
		font-size="12" fill="${isHoveredRight ? '#1e40af' : '#334155'}"
		font-weight="${isHoveredRight ? '700' : '500'}" text-anchor="start"
		style="cursor:pointer;"
		data-apv-side="right" data-apv-idx="${i}"
		>${this._apvEscapeHtml(tokens[i])}</text>`;
		}

		headDataArray.forEach((head, hIdx) => {
			if (!activeHeads.has(hIdx)) return;

			const color = AttentionEngine.HEAD_COLORS[hIdx % AttentionEngine.HEAD_COLORS.length];
			const weights = head.this_weights;

			for (let qi = 0; qi < n; qi++) {
				for (let ki = 0; ki < n; ki++) {
					const w = weights[qi][ki];
					if (w < minOpacity) continue;

					const y1 = topPadding + qi * rowHeight;
					const y2 = topPadding + ki * rowHeight;
					const x1 = leftColumnX + 6;
					const x2 = rightColumnX - 6;
					const cpx = (x1 + x2) / 2;

					svgContent += `<path d="M ${x1} ${y1} C ${cpx} ${y1}, ${cpx} ${y2}, ${x2} ${y2}"
			fill="none" stroke="${color}"
			stroke-width="${(1 + w * 5).toFixed(1)}"
			stroke-opacity="${w.toFixed(3)}"
			data-apv-head="${hIdx}" data-apv-qi="${qi}" data-apv-ki="${ki}"
		    />`;
				}
			}
		});

		svg.innerHTML = svgContent;
		this._apvAttachHoverEvents(svg, layerIdx);
	}

	_apvAttachHoverEvents(svg, layerIdx) {
		const self = this;
		let currentHover = null;

		svg.addEventListener('mouseover', (e) => {
			const el = e.target.closest('[data-apv-side]');
			if (el) {
				const side = el.getAttribute('data-apv-side');
				const index = parseInt(el.getAttribute('data-apv-idx'));
				const key = `${side}-${index}`;
				if (currentHover === key) return;
				currentHover = key;
				self._apvHoveredToken.set(layerIdx, { side, index });
				self._apvUpdateHoverState(svg, layerIdx);
			}
		});

		svg.addEventListener('mouseout', (e) => {
			const el = e.target.closest('[data-apv-side]');
			if (el) {
				const related = e.relatedTarget?.closest?.('[data-apv-side]');
				if (related) return;
				currentHover = null;
				self._apvHoveredToken.set(layerIdx, null);
				self._apvUpdateHoverState(svg, layerIdx);
			}
		});
	}

	_apvUpdateHoverState(svg, layerIdx) {
		const registry = multiLayerAttentionRegistry.get(this.containerId);
		if (!registry) return;
		const layerData = registry.layers[layerIdx];
		const headDataArray = layerData.headData;
		const displayTokens = this._apvResolveTokenLabels(layerData.tokenStrings, headDataArray);
		const { minOpacity } = this._apvOptions;
		const hovered = this._apvHoveredToken.get(layerIdx);
		const activeHeads = this._apvActiveHeads.get(layerIdx) || new Set();

		// Update paths
		const paths = svg.querySelectorAll('path[data-apv-qi]');
		paths.forEach(path => {
			const hIdx = parseInt(path.getAttribute('data-apv-head'));
			const qi = parseInt(path.getAttribute('data-apv-qi'));
			const ki = parseInt(path.getAttribute('data-apv-ki'));

			if (!activeHeads.has(hIdx)) {
				path.setAttribute('stroke-opacity', '0');
				return;
			}

			const w = headDataArray[hIdx].this_weights[qi][ki];

			if (!hovered) {
				path.setAttribute('stroke-opacity', w.toFixed(3));
				path.setAttribute('stroke-width', (1 + w * 5).toFixed(1));
			} else {
				const { side, index } = hovered;
				if ((side === 'left' && index === qi) || (side === 'right' && index === ki)) {
					const opacity = 0.3 + w * 0.7;
					const strokeWidth = 2 + w * 8;
					path.setAttribute('stroke-opacity', opacity.toFixed(3));
					path.setAttribute('stroke-width', strokeWidth.toFixed(1));
				} else {
					path.setAttribute('stroke-opacity', '0.04');
					path.setAttribute('stroke-width', '0.5');
				}
			}
		});

		// ── Update token text styling ──
		const texts = svg.querySelectorAll('text[data-apv-side]');
		texts.forEach(text => {
			const side = text.getAttribute('data-apv-side');
			const idx = parseInt(text.getAttribute('data-apv-idx'));

			const isHovered = hovered && hovered.side === side && hovered.index === idx;
			text.setAttribute('fill', isHovered ? '#1e40af' : '#334155');
			text.setAttribute('font-weight', isHovered ? '700' : '500');
		});

		// ── Update percentage labels ──
		svg.querySelectorAll('.apv-weight-label').forEach(el => el.remove());

		if (hovered) {
			const { rowHeight, leftColumnX, rightColumnX, topPadding } = this._apvOptions;
			const arcX1 = leftColumnX + 6;
			const arcX2 = rightColumnX - 6;

			const labelCandidates = [];

			headDataArray.forEach((head, hIdx) => {
				if (!activeHeads.has(hIdx)) return;
				const color = AttentionEngine.HEAD_COLORS[hIdx % AttentionEngine.HEAD_COLORS.length];
				const weights = head.this_weights;
				const n = displayTokens.length;

				for (let qi = 0; qi < n; qi++) {
					for (let ki = 0; ki < n; ki++) {
						const w = weights[qi][ki];
						if (w < 0.05) continue;

						const { side, index } = hovered;
						const isRelevant = (side === 'left' && index === qi) ||
							(side === 'right' && index === ki);
						if (!isRelevant) continue;

						const targetIdx = (side === 'left') ? ki : qi;

						labelCandidates.push({
							targetIdx,
							color,
							text: `${(w * 100).toFixed(0)}%`,
							hIdx
						});
					}
				}
			});

			const groups = new Map();
			labelCandidates.forEach(lbl => {
				if (!groups.has(lbl.targetIdx)) groups.set(lbl.targetIdx, []);
				groups.get(lbl.targetIdx).push(lbl);
			});

			const labelGap = 30;

			groups.forEach((group, targetIdx) => {
				const y = topPadding + targetIdx * rowHeight + 4;
				group.sort((a, b) => a.hIdx - b.hIdx);

				if (hovered.side === 'left') {
					const anchorX = arcX2 - 4;
					group.forEach((lbl, i) => {
						const lx = anchorX - i * labelGap;
						const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
						label.setAttribute('x', lx.toFixed(1));
						label.setAttribute('y', y.toFixed(1));
						label.setAttribute('font-size', '9');
						label.setAttribute('fill', lbl.color);
						label.setAttribute('font-weight', '700');
						label.setAttribute('text-anchor', 'end');
						label.setAttribute('class', 'apv-weight-label');
						label.setAttribute('stroke', '#fff');
						label.setAttribute('stroke-width', '2.5');
						label.setAttribute('paint-order', 'stroke');
						label.textContent = lbl.text;
						svg.appendChild(label);
					});
				} else {
					const anchorX = arcX1 + 4;
					group.forEach((lbl, i) => {
						const lx = anchorX + i * labelGap;
						const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
						label.setAttribute('x', lx.toFixed(1));
						label.setAttribute('y', y.toFixed(1));
						label.setAttribute('font-size', '9');
						label.setAttribute('fill', lbl.color);
						label.setAttribute('font-weight', '700');
						label.setAttribute('text-anchor', 'start');
						label.setAttribute('class', 'apv-weight-label');
						label.setAttribute('stroke', '#fff');
						label.setAttribute('stroke-width', '2.5');
						label.setAttribute('paint-order', 'stroke');
						label.textContent = lbl.text;
						svg.appendChild(label);
					});
				}
			});
		}
	}

	_apvDrawMatrixView(svg, layerIdx, headDataArray, tokens) {
		const n = tokens.length;
		const cellSize = Math.max(18, Math.min(40, 300 / n));
		const matrixSize = n * cellSize;
		const padding = 80;
		const activeHeads = [...(this._apvActiveHeads.get(layerIdx) || new Set())].sort((a, b) => a - b);

		const totalWidth = matrixSize + padding;
		const totalHeight = activeHeads.length * (matrixSize + padding) + padding;

		svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
		svg.style.minHeight = totalHeight + 'px';

		let svgContent = '';

		activeHeads.forEach((hIdx, row) => {
			const offsetX = padding / 2;
			const offsetY = padding / 2 + row * (matrixSize + padding);
			const color = AttentionEngine.HEAD_COLORS[hIdx % AttentionEngine.HEAD_COLORS.length];
			const weights = headDataArray[hIdx].this_weights;

			svgContent += `<text x="${offsetX + matrixSize / 2}" y="${offsetY - 30}"
		font-size="12" fill="${color}" font-weight="700" text-anchor="middle"
		>Head ${hIdx + 1}</text>`;

			for (let i = 0; i < n; i++) {
				svgContent += `<text x="${offsetX - 4}" y="${offsetY + i * cellSize + cellSize / 2 + 4}"
		    font-size="9" fill="#64748b" text-anchor="end"
		    >${this._apvEscapeHtml(tokens[i])}</text>`;
			}

			for (let j = 0; j < n; j++) {
				svgContent += `<text
		    x="${offsetX + j * cellSize + cellSize / 2}"
		    y="${offsetY - 6}"
		    font-size="9" fill="#64748b" text-anchor="start"
		    transform="rotate(-45, ${offsetX + j * cellSize + cellSize / 2}, ${offsetY - 6})"
		    >${this._apvEscapeHtml(tokens[j])}</text>`;
			}

			for (let qi = 0; qi < n; qi++) {
				for (let ki = 0; ki < n; ki++) {
					const w = weights[qi][ki];
					const x = offsetX + ki * cellSize;
					const y = offsetY + qi * cellSize;
					const alpha = Math.max(0.05, w);

					svgContent += `<rect x="${x}" y="${y}"
			width="${cellSize}" height="${cellSize}"
			fill="${color}" fill-opacity="${alpha.toFixed(3)}"
			stroke="#e2e8f0" stroke-width="0.5"
			data-apv-head="${hIdx}" data-apv-qi="${qi}" data-apv-ki="${ki}"
			style="cursor:crosshair;"
		    />`;

					if (cellSize >= 28 && w > 0.05) {
						svgContent += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 3}"
			    font-size="8" fill="${w > 0.5 ? '#fff' : '#334155'}"
			    text-anchor="middle" pointer-events="none"
			    >${(w * 100).toFixed(0)}</text>`;
					}
				}
			}
		});

		svg.innerHTML = svgContent;
		this._apvAttachMatrixTooltip(svg, layerIdx, headDataArray, tokens);
	}

	_apvAttachMatrixTooltip(svg, layerIdx, headDataArray, tokens, headDisplayOffset = 0) {
		const tooltipId = `apv-tooltip-${this.containerId}-${layerIdx}`;
		let tooltip = document.getElementById(tooltipId);
		if (!tooltip) {
			tooltip = document.createElement('div');
			tooltip.id = tooltipId;
			tooltip.style.cssText = `
	    position:fixed; padding:6px 10px; background:#1e293b; color:#fff;
	    border-radius:6px; font-size:0.78rem; pointer-events:none;
	    z-index:9999; display:none; white-space:nowrap;
	    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	`;
			document.body.appendChild(tooltip);
		}

		svg.addEventListener('mousemove', (e) => {
			const rect = e.target.closest('rect[data-apv-qi]');
			if (rect) {
				const hIdx = parseInt(rect.getAttribute('data-apv-head'));
				const qi = parseInt(rect.getAttribute('data-apv-qi'));
				const ki = parseInt(rect.getAttribute('data-apv-ki'));

				// Guard against out-of-bounds index
				if (!headDataArray[hIdx]) {
					tooltip.style.display = 'none';
					return;
				}

				const w = headDataArray[hIdx].this_weights[qi][ki];
				// Use headDisplayOffset so the tooltip shows the real head number
				const displayHeadNum = hIdx + headDisplayOffset + 1;

				tooltip.innerHTML = `<b>Head ${displayHeadNum}</b>: "${tokens[qi]}" → "${tokens[ki]}" = <b>${(w * 100).toFixed(1)}%</b>`;
				tooltip.style.display = 'block';
				tooltip.style.left = (e.clientX + 12) + 'px';
				tooltip.style.top = (e.clientY - 30) + 'px';
			} else {
				tooltip.style.display = 'none';
			}
		});

		svg.addEventListener('mouseleave', () => {
			tooltip.style.display = 'none';
		});
	}

	_apvLoadState() {
		try {
			const raw = localStorage.getItem(this._apvGetStorageKey());
			if (raw) return JSON.parse(raw);
		} catch (e) {
			// Corrupted or unavailable — fall through to defaults
		}
		return null;
	}

	_apvSaveState() {
		try {
			const layerStates = {};
			this._apvActiveHeads.forEach((heads, layerIdx) => {
				layerStates[layerIdx] = {
					activeHeads: [...heads],
					mode: this._apvMode.get(layerIdx) || 'headview'
				};
			});

			// Determine active layer from visible tab
			let activeLayer = 0;
			const registry = multiLayerAttentionRegistry.get(this.containerId);
			if (registry) {
				for (let l = 0; l < registry.layers.length; l++) {
					const contentDiv = document.getElementById(`layer-content-${this.containerId}-${l}`);
					if (contentDiv && contentDiv.style.display !== 'none') {
						activeLayer = l;
						break;
					}
				}
			}

			const state = {
				activeLayer,
				layerStates
			};
			localStorage.setItem(this._apvGetStorageKey(), JSON.stringify(state));
		} catch (e) {
			// localStorage might be full or unavailable — fail silently
		}
	}

	_apvGetStorageKey() {
		return `apv-state-${this.containerId}`;
	}

	apvToggleHead(layerIdx, headIdx, isActive) {
		const heads = this._apvActiveHeads.get(layerIdx);
		if (!heads) return;
		if (isActive) {
			heads.add(headIdx);
		} else {
			heads.delete(headIdx);
		}
		this._apvDraw(layerIdx);
		this._apvSaveState();
	}

	apvSetMode(layerIdx, mode) {
		this._apvMode.set(layerIdx, mode);

		// Update button styling without full rebuild
		const contentDiv = document.getElementById(`layer-content-${this.containerId}-${layerIdx}`);
		if (contentDiv) {
			const buttons = contentDiv.querySelectorAll('.apv-mode-btn');
			buttons.forEach(btn => {
				const isHead = btn.textContent.trim() === 'Head View' && mode === 'headview';
				const isMatrix = btn.textContent.trim() === 'Matrix View' && mode === 'matrix';
				const active = isHead || isMatrix;
				btn.style.background = active ? '#3b82f6' : '#fff';
				btn.style.color = active ? '#fff' : '#334155';
			});
		}

		this._apvDraw(layerIdx);
		this._apvSaveState();
	}

	_apvDrawSingleHeadView(svg, layerIdx, headIdx, headData, tokens) {
		const n = tokens.length;
		const { rowHeight, leftColumnX, rightColumnX, topPadding, minOpacity } = this._apvOptions;
		const color = AttentionEngine.HEAD_COLORS[headIdx % AttentionEngine.HEAD_COLORS.length];

		const svgHeight = topPadding + n * rowHeight + 40;
		const svgWidth = rightColumnX + 120;

		svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
		svg.style.minHeight = svgHeight + 'px';

		let svgContent = '';

		svgContent += `<text x="${leftColumnX}" y="18" font-size="11" fill="#64748b"
	font-weight="600" text-anchor="middle">Query (attending)</text>`;
		svgContent += `<text x="${rightColumnX}" y="18" font-size="11" fill="#64748b"
	font-weight="600" text-anchor="middle">Key (attended to)</text>`;

		const hoverKey = `${layerIdx}-${headIdx}`;
		const hovered = this._apvHoveredToken.get(hoverKey) || null;

		for (let i = 0; i < n; i++) {
			const y = topPadding + i * rowHeight;
			const isHoveredLeft = hovered && hovered.side === 'left' && hovered.index === i;
			const isHoveredRight = hovered && hovered.side === 'right' && hovered.index === i;

			svgContent += `<text x="${leftColumnX}" y="${y + 4}"
	    font-size="12" fill="${isHoveredLeft ? '#1e40af' : '#334155'}"
	    font-weight="${isHoveredLeft ? '700' : '500'}" text-anchor="end"
	    style="cursor:pointer;"
	    data-apv-side="left" data-apv-idx="${i}"
	    >${this._apvEscapeHtml(tokens[i])}</text>`;

			svgContent += `<text x="${rightColumnX}" y="${y + 4}"
	    font-size="12" fill="${isHoveredRight ? '#1e40af' : '#334155'}"
	    font-weight="${isHoveredRight ? '700' : '500'}" text-anchor="start"
	    style="cursor:pointer;"
	    data-apv-side="right" data-apv-idx="${i}"
	    >${this._apvEscapeHtml(tokens[i])}</text>`;
		}

		const weights = headData.this_weights;
		for (let qi = 0; qi < n; qi++) {
			for (let ki = 0; ki < n; ki++) {
				const w = weights[qi][ki];
				if (w < minOpacity) continue;

				const y1 = topPadding + qi * rowHeight;
				const y2 = topPadding + ki * rowHeight;
				const x1 = leftColumnX + 6;
				const x2 = rightColumnX - 6;
				const cpx = (x1 + x2) / 2;

				svgContent += `<path d="M ${x1} ${y1} C ${cpx} ${y1}, ${cpx} ${y2}, ${x2} ${y2}"
		fill="none" stroke="${color}"
		stroke-width="${(1 + w * 5).toFixed(1)}"
		stroke-opacity="${w.toFixed(3)}"
		data-apv-qi="${qi}" data-apv-ki="${ki}"
	    />`;
			}
		}

		svg.innerHTML = svgContent;
		this._apvAttachSingleHeadHoverEvents(svg, layerIdx, headIdx, headData, tokens);
	}

	_apvDrawSingleHeadMatrix(svg, layerIdx, headIdx, headData, tokens) {
		const n = tokens.length;
		const cellSize = Math.max(18, Math.min(40, 300 / n));
		const matrixSize = n * cellSize;
		const padding = 80;
		const color = AttentionEngine.HEAD_COLORS[headIdx % AttentionEngine.HEAD_COLORS.length];
		const weights = headData.this_weights;

		const totalWidth = matrixSize + padding;
		const totalHeight = matrixSize + padding;

		svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
		svg.style.minHeight = totalHeight + 'px';

		let svgContent = '';

		const offsetX = padding / 2;
		const offsetY = padding / 2;

		svgContent += `<text x="${offsetX + matrixSize / 2}" y="${offsetY - 30}"
	font-size="12" fill="${color}" font-weight="700" text-anchor="middle"
	>Head ${headIdx + 1}</text>`;

		for (let i = 0; i < n; i++) {
			svgContent += `<text x="${offsetX - 4}" y="${offsetY + i * cellSize + cellSize / 2 + 4}"
	    font-size="9" fill="#64748b" text-anchor="end"
	    >${this._apvEscapeHtml(tokens[i])}</text>`;
		}

		for (let j = 0; j < n; j++) {
			svgContent += `<text
	    x="${offsetX + j * cellSize + cellSize / 2}"
	    y="${offsetY - 6}"
	    font-size="9" fill="#64748b" text-anchor="start"
	    transform="rotate(-45, ${offsetX + j * cellSize + cellSize / 2}, ${offsetY - 6})"
	    >${this._apvEscapeHtml(tokens[j])}</text>`;
		}

		for (let qi = 0; qi < n; qi++) {
			for (let ki = 0; ki < n; ki++) {
				const w = weights[qi][ki];
				const x = offsetX + ki * cellSize;
				const y = offsetY + qi * cellSize;
				const alpha = Math.max(0.05, w);

				// FIX: use data-apv-head="0" to match the [headData] wrapper array index
				svgContent += `<rect x="${x}" y="${y}"
		width="${cellSize}" height="${cellSize}"
		fill="${color}" fill-opacity="${alpha.toFixed(3)}"
		stroke="#e2e8f0" stroke-width="0.5"
		data-apv-head="0" data-apv-qi="${qi}" data-apv-ki="${ki}"
		style="cursor:crosshair;"
	    />`;

				if (cellSize >= 28 && w > 0.05) {
					svgContent += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 3}"
		    font-size="8" fill="${w > 0.5 ? '#fff' : '#334155'}"
		    text-anchor="middle" pointer-events="none"
		    >${(w * 100).toFixed(0)}</text>`;
				}
			}
		}

		svg.innerHTML = svgContent;
		// FIX: pass headIdx as headDisplayOffset so the tooltip shows the correct head number
		this._apvAttachMatrixTooltip(svg, layerIdx, [headData], tokens, headIdx);
	}

	_apvAttachSingleHeadHoverEvents(svg, layerIdx, headIdx, headData, tokens) {
		const self = this;
		const hoverKey = `${layerIdx}-${headIdx}`;
		const color = AttentionEngine.HEAD_COLORS[headIdx % AttentionEngine.HEAD_COLORS.length];
		const { rowHeight, leftColumnX, rightColumnX, topPadding, minOpacity } = this._apvOptions;
		let currentHover = null;

		svg.addEventListener('mouseover', (e) => {
			const el = e.target.closest('[data-apv-side]');
			if (el) {
				const side = el.getAttribute('data-apv-side');
				const index = parseInt(el.getAttribute('data-apv-idx'));
				const key = `${side}-${index}`;
				if (currentHover === key) return;
				currentHover = key;
				self._apvHoveredToken.set(hoverKey, { side, index });
				updateHover();
			}
		});

		svg.addEventListener('mouseout', (e) => {
			const el = e.target.closest('[data-apv-side]');
			if (el) {
				const related = e.relatedTarget?.closest?.('[data-apv-side]');
				if (related) return;
				currentHover = null;
				self._apvHoveredToken.set(hoverKey, null);
				updateHover();
			}
		});

		function updateHover() {
			const hovered = self._apvHoveredToken.get(hoverKey);
			const weights = headData.this_weights;
			const n = tokens.length;

			// Update paths
			const paths = svg.querySelectorAll('path[data-apv-qi]');
			paths.forEach(path => {
				const qi = parseInt(path.getAttribute('data-apv-qi'));
				const ki = parseInt(path.getAttribute('data-apv-ki'));
				const w = weights[qi][ki];

				if (!hovered) {
					path.setAttribute('stroke-opacity', w.toFixed(3));
					path.setAttribute('stroke-width', (1 + w * 5).toFixed(1));
				} else {
					const { side, index } = hovered;
					if ((side === 'left' && index === qi) || (side === 'right' && index === ki)) {
						const opacity = 0.3 + w * 0.7;
						const strokeWidth = 2 + w * 8;
						path.setAttribute('stroke-opacity', opacity.toFixed(3));
						path.setAttribute('stroke-width', strokeWidth.toFixed(1));
					} else {
						path.setAttribute('stroke-opacity', '0.04');
						path.setAttribute('stroke-width', '0.5');
					}
				}
			});

			// Update token text styling
			const texts = svg.querySelectorAll('text[data-apv-side]');
			texts.forEach(text => {
				const side = text.getAttribute('data-apv-side');
				const idx = parseInt(text.getAttribute('data-apv-idx'));
				const isHovered = hovered && hovered.side === side && hovered.index === idx;
				text.setAttribute('fill', isHovered ? '#1e40af' : '#334155');
				text.setAttribute('font-weight', isHovered ? '700' : '500');
			});

			// Update percentage labels
			svg.querySelectorAll('.apv-weight-label').forEach(el => el.remove());

			if (hovered) {
				const arcX1 = leftColumnX + 6;
				const arcX2 = rightColumnX - 6;

				for (let qi = 0; qi < n; qi++) {
					for (let ki = 0; ki < n; ki++) {
						const w = weights[qi][ki];
						if (w < 0.05) continue;

						const { side, index } = hovered;
						const isRelevant = (side === 'left' && index === qi) ||
							(side === 'right' && index === ki);
						if (!isRelevant) continue;

						const targetIdx = (side === 'left') ? ki : qi;
						const y = topPadding + targetIdx * rowHeight + 4;
						const anchorX = (side === 'left') ? arcX2 - 4 : arcX1 + 4;
						const textAnchor = (side === 'left') ? 'end' : 'start';

						const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
						label.setAttribute('x', anchorX.toFixed(1));
						label.setAttribute('y', y.toFixed(1));
						label.setAttribute('font-size', '9');
						label.setAttribute('fill', color);
						label.setAttribute('font-weight', '700');
						label.setAttribute('text-anchor', textAnchor);
						label.setAttribute('class', 'apv-weight-label');
						label.setAttribute('stroke', '#fff');
						label.setAttribute('stroke-width', '2.5');
						label.setAttribute('paint-order', 'stroke');
						label.textContent = `${(w * 100).toFixed(0)}%`;
						svg.appendChild(label);
					}
				}
			}
		}
	}
}
