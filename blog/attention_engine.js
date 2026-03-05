class AttentionEngine {
	static HEAD_COLORS = [
		'#3b82f6'
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
		this._apvActiveHeads = new Map();
		this._apvHoveredToken = new Map();
		this._apvMode = new Map();
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

		// Only observe if the container actually exists in the DOM
		if (this.container) {
			attentionObserver.observe(this.container);
		}
	}

	_buildWhatHappensNextSection(n, d_k, d_model, n_heads) {
		return `<div style="padding:12px; background:#f0fdf4; border:1px solid #10b981; border-radius:8px;">
    <p style="font-weight:600; color:#065f46; margin-bottom:6px;">What Happens Next</p>
    <p style="font-size:0.85rem; color:#334155; margin-bottom:6px;">
	This head's context matrix is <b>one of ${n_heads} heads</b>. All heads run in parallel, each
	capturing different relationships. Their outputs are then:
    </p>
    <ol style="font-size:0.85rem; color:#334155; margin:0 0 8px 20px; padding:0;">
	<li style="margin-bottom:4px;">
	    <b>Concatenated</b> along the $d_k$ dimension:
	    $\\text{Concat}(\\text{head}_1, \\ldots, \\text{head}_{${n_heads}}) \\in \\mathbb{R}^{${n} \\times ${d_model}}$
	</li>
	<li style="margin-bottom:4px;">
	    <b>Output projection</b> $W^O \\in \\mathbb{R}^{${d_model} \\times ${d_model}}$
	    mixes head outputs:
	    $\\text{MHA}_{\\text{proj}} = \\text{Concat}(\\text{heads}) \\cdot W^O$
	</li>
	<li style="margin-bottom:4px;">
	    <b>Added back</b> to the input via the residual connection:
	    $h_1 = h_0 + \\text{MHA}_{\\text{proj}}$
	</li>
    </ol>
    <p style="font-size:0.8rem; color:#64748b;">
	The concatenation, projection, and residual steps are shown in the sections below this head view.
    </p>
</div>`;
	}

	_buildContextMatrixSection(headIdx, layerNum, n, d_k, weights, Vi, context, displayTokens) {
		const weightMatrixTex = this._attnWeightMatrixLabeled(weights, displayTokens, n);
		const vMatrixTex = this._attnRowLabeledMatrix(Vi, displayTokens, n);
		const contextMatrixTex = this._attnRowLabeledMatrix(context, displayTokens, n);

		return `<div style="margin-bottom:16px; padding:12px; background:#fff; border:1px solid #e2e8f0; border-radius:8px;">
    <p style="font-weight:600; color:#1e40af; margin-bottom:6px;">Context Matrix for Head ${headIdx + 1}</p>
    <p style="font-size:0.85rem; color:#334155; margin-bottom:8px;">
	Each token's <b>context vector</b> is a weighted average of all Value vectors it can see.
	The attention weights (from Softmax) determine how much each Value contributes.
	Token $i$ can only attend to tokens $0 \\ldots i$ (causal mask).
    </p>
    $$ \\text{context}_i = \\sum_{j=0}^{i} \\underbrace{\\alpha_{i,j}}_{\\substack{\\text{attention} \\\\ \\text{weight}}} \\cdot \\underbrace{V_j}_{\\substack{\\text{Value vector} \\\\ \\text{of token } j}} $$
    <p style="font-size:0.8rem; color:#64748b;">
	This produces one $d_k = ${d_k}$-dimensional context vector per token per head.
    </p>
    <p style="font-size:0.85rem; color:#334155; margin-bottom:4px;">
	Stacking all context vectors gives the output of this head — a matrix of shape
	$(T \\times d_k) = (${n} \\times ${d_k})$.
    </p>
    <p style="font-size:0.82rem; color:#64748b; margin-bottom:10px;">
	In the <b>Attention Weights</b> matrix: rows are <b>query</b> tokens (who is looking),
	columns are <b>key</b> tokens (who is being looked at).
	Each row sums to 1 (softmax). The column headers show which token each column corresponds to.
    </p>
    <div style="overflow-x:auto;">
    $$ \\underbrace{${contextMatrixTex}}_{\\text{head}_{${headIdx + 1}}\\;(${n} \\times ${d_k})} = \\underbrace{${weightMatrixTex}}_{\\substack{\\text{Attention Weights}\\;(${n} \\times ${n}) \\\\ \\text{rows}=\\text{query},\\; \\text{cols}=\\text{key}}} \\cdot \\underbrace{${vMatrixTex}}_{V_{${headIdx + 1}}\\;(${n} \\times ${d_k})} $$
    </div>
</div>`;
	}


	/**
	 * Returns a Temml \color command string for a given token position.
	 */
	_attnPosColor(tIdx, n) {
		return getPositionColor(tIdx, n, 'temml');
	}

	/**
	 * Returns a LaTeX-safe token string (escapes #, _, &).
	 */
	_attnSafeTok(displayTokens, tIdx) {
		return displayTokens[tIdx]
			.replace(/#/g, '\\#')
			.replace(/_/g, '\\_')
			.replace(/&/g, '\\&');
	}

	/**
	 * Returns a colored \text{word}_{pos} LaTeX label for a token.
	 */
	_attnColorLabel(displayTokens, tIdx, n) {
		const color = this._attnPosColor(tIdx, n);
		const safe = this._attnSafeTok(displayTokens, tIdx);
		return `${color} \\text{${safe}}_{${tIdx}}`;
	}

	/**
	 * Formats a numeric value safely, returning 0 for non-finite inputs.
	 */
	_attnNum(v) {
		if (typeof v === 'number' && isFinite(v)) return v;
		if (typeof v === 'string') return parseFloat(v) || 0;
		return 0;
	}

	/**
	 * Builds a LaTeX matrix with colored row labels (\text{word}_{pos})
	 * and values colored by the row's position color.
	 */
	_attnWeightMatrixLabeled(mat, displayTokens, n) {
		if (!Array.isArray(mat) || !Array.isArray(mat[0])) return `(?)`;
		const numCols = mat[0].length;
		const colSpec = 'r|' + 'r'.repeat(numCols);

		const colHeaders = mat[0].map((_, j) => {
			return `${this._attnPosColor(j, n)} \\text{${this._attnSafeTok(displayTokens, j)}}_{${j}}`;
		}).join(' & ');

		const rows = mat.map((row, i) => {
			const rowLabel = `${this._attnPosColor(i, n)} \\text{${this._attnSafeTok(displayTokens, i)}}_{${i}}`;
			const vals = row.map((v, j) => {
				return `${this._attnPosColor(j, n)} ${this._attnNum(v).toFixed(nr_fixed)}`;
			}).join(' & ');
			return `${rowLabel} & ${vals}`;
		}).join(' \\\\ ');

		return `\\left(\\begin{array}{${colSpec}} & ${colHeaders} \\\\ \\hline ${rows} \\end{array}\\right)`;
	}

	/**
	 * Builds a LaTeX matrix with colored row labels and values colored
	 * by the row's position. Column headers are blank spaces.
	 * Used for V matrices and context matrices.
	 */
	_attnRowLabeledMatrix(mat, displayTokens, n) {
		if (!Array.isArray(mat) || !Array.isArray(mat[0])) return `(?)`;
		const numCols = mat[0].length;
		const colSpec = 'r|' + 'r'.repeat(numCols);

		const colHeaders = mat[0].map(() => ` `).join(' & ');

		const rows = mat.map((row, tIdx) => {
			const color = this._attnPosColor(tIdx, n);
			const label = `${color} \\text{${this._attnSafeTok(displayTokens, tIdx)}}_{${tIdx}}`;
			const vals = row.map(v => `${color} ${this._attnNum(v).toFixed(nr_fixed)}`).join(' & ');
			return `${label} & ${vals}`;
		}).join(' \\\\ ');

		return `\\left(\\begin{array}{${colSpec}} & ${colHeaders} \\\\ \\hline ${rows} \\end{array}\\right)`;
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
				WQ: WQ_slice, WK: WK_slice, WV: WV_slice,
				d_model: this.d_model
			});
		}

		this.renderUI(headData, tokens, tokenStrings);
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

		// Only write placeholder if container exists in DOM
		if (!this.containerId) return;
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
		// Try unified mode first
		let contentDiv = document.getElementById(`unified-layer-${layerIdx}-attention-heads`);

		// Fall back to old mode
		if (!contentDiv) {
			contentDiv = document.getElementById(`layer-content-${this.containerId}-${layerIdx}`);
		}
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
		if (!tokens.length) return;

		const registry = multiLayerAttentionRegistry.get(this.containerId);
		if (!registry || registry.layers.length === 0) {
			if (this.container) {
				this._renderSingleLayer(headData, tokens, 0);
			}
			return;
		}

		const layers = registry.layers;

		// Check if unified layer containers exist
		const ffnContainer = document.getElementById('ffn-equations-container');
		const hasUnifiedTabs = ffnContainer && ffnContainer.querySelector('.unified-layer-tabs');

		if (hasUnifiedTabs) {
			this._renderUnifiedMode(layers);
		} else if (this.container) {
			this._renderFallbackMode(layers);
		}
	}

	/**
	 * Renders attention heads inside unified layer tabs (when FFN unified view exists).
	 * Replaces the main attention container with a redirect message and injects
	 * head tabs into each unified layer's attention section.
	 */
	_renderUnifiedMode(layers) {
		const numLayers = layers.length;

		// Replace old attention container with a pointer message
		if (this.container) {
			if (this.container.querySelector('.attention-layer-tabs')) {
				this.container.innerHTML = '';
			}
			if (!this.container.querySelector('.unified-redirect-msg')) {
				this.container.innerHTML = `<div class="unified-redirect-msg" style="padding:15px; color:#64748b; text-align:center; font-style:italic;">
		Attention details are shown within each layer tab below ↓
	    </div>`;
			}
		}

		this._registerGlobalApvInstance();

		for (let l = 0; l < numLayers; l++) {
			const attnSection = document.getElementById(`unified-layer-${l}-attention-heads`);
			if (!attnSection) continue;

			const layerHeadData = layers[l].headData;
			const existingHeadTabList = attnSection.querySelector('.head-tab-list');

			if (!existingHeadTabList) {
				this._buildUnifiedLayerHeadTabs(attnSection, l, layerHeadData);
			} else {
				this._updateUnifiedLayerHeadTabs(existingHeadTabList, l, layerHeadData);
			}
		}
	}

	/**
	 * First-time build of head tabs inside a unified layer's attention section.
	 */
	_buildUnifiedLayerHeadTabs(attnSection, layerIdx, layerHeadData) {
		let html = '';
		html += `<div class="head-tab-list" style="background:#f0f4f8; display:flex; border-bottom:1px solid #3b82f6; flex-wrap:wrap; border-radius:8px 8px 0 0;">`;
		for (let h = 0; h < layerHeadData.length; h++) {
			html += this._buildHeadTabButtonHtml(layerIdx, h, h === 0);
		}
		html += `</div>`;

		for (let h = 0; h < layerHeadData.length; h++) {
			html += `<div id="head-content-${this.containerId}-${layerIdx}-${h}" class="head-tab-in-layer"
	    style="contain:layout; overflow-anchor:none; padding:20px; display:${h === 0 ? 'block' : 'none'}"
	    data-head-idx="${h}" data-rendered="false"
	    data-container-id="${this.containerId}" data-layer-idx="${layerIdx}" data-head-idx="${h}">
	    <div style="color:#94a3b8;">Loading Head ${h + 1}...</div>
	</div>`;
		}

		attnSection.innerHTML = html;

		if (!this._apvHoveredToken.has(layerIdx)) {
			this._apvHoveredToken.set(layerIdx, null);
		}

		// Render first head immediately
		this._renderHeadContent(layerIdx, 0);
	}

	/**
	 * Updates existing head tabs in a unified layer when data changes (e.g. after training).
	 */
	_updateUnifiedLayerHeadTabs(existingHeadTabList, layerIdx, layerHeadData) {
		const existingBtnCount = existingHeadTabList.querySelectorAll('.mha-head-tab-btn').length;

		if (existingBtnCount !== layerHeadData.length) {
			let headTabHtml = '';
			for (let h = 0; h < layerHeadData.length; h++) {
				const headDiv = document.getElementById(`head-content-${this.containerId}-${layerIdx}-${h}`);
				const isActive = headDiv ? headDiv.style.display !== 'none' : h === 0;
				headTabHtml += this._buildHeadTabButtonHtml(layerIdx, h, isActive);
			}
			existingHeadTabList.innerHTML = headTabHtml;
		}

		// Re-render visible heads that were already rendered (patch update)
		for (let h = 0; h < layerHeadData.length; h++) {
			const headDiv = document.getElementById(`head-content-${this.containerId}-${layerIdx}-${h}`);
			if (headDiv && headDiv.dataset.wasRenderedOnce === 'true') {
				if (headDiv.style.display === 'none') continue;
				const layerContent = document.getElementById(`unified-layer-${layerIdx}-content`);
				if (layerContent && layerContent.style.display === 'none') continue;

				headDiv.dataset.rendered = 'false';
				this._executeHeadRender(layerIdx, h);
			}
		}
	}

	/**
	 * Fallback rendering mode when unified tabs don't exist.
	 * Handles both updating existing tabs and first-time build.
	 */
	_renderFallbackMode(layers) {
		const numLayers = layers.length;
		const existingTabs = this.container.querySelector('.attention-layer-tabs');

		if (existingTabs) {
			this._updateFallbackTabs(existingTabs, numLayers);
			return;
		}

		this._buildFallbackTabs(numLayers);
	}

	/**
	 * Updates existing fallback layer tabs when the number of layers changes,
	 * and re-renders any already-rendered layer content.
	 */
	_updateFallbackTabs(existingTabs, numLayers) {
		const tabList = existingTabs.querySelector('.layer-tab-list');
		const existingBtnCount = tabList ? tabList.querySelectorAll('.mha-layer-tab-btn').length : 0;

		if (existingBtnCount !== numLayers) {
			let tabHtml = '';
			for (let l = 0; l < numLayers; l++) {
				const contentDiv = document.getElementById(`layer-content-${this.containerId}-${l}`);
				const isActive = contentDiv ? contentDiv.style.display !== 'none' : l === 0;
				tabHtml += this._buildLayerTabButtonHtml(l, isActive);
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
	}

	/**
	 * First-time build of fallback layer tabs (when no unified tabs exist).
	 * Restores persisted active layer from localStorage.
	 */
	_buildFallbackTabs(numLayers) {
		const saved = this._apvLoadState();
		let startLayer = 0;
		if (saved && typeof saved.activeLayer === 'number' &&
			saved.activeLayer >= 0 && saved.activeLayer < numLayers) {
			startLayer = saved.activeLayer;
		}

		let html = `<div class="attention-layer-tabs" style="border:1px solid #3b82f6; border-radius:8px; overflow:hidden;">`;

		html += `<div class="layer-tab-list" style="background:#dbeafe; display:flex; border-bottom:2px solid #3b82f6; flex-wrap:wrap;">`;
		for (let l = 0; l < numLayers; l++) {
			html += this._buildLayerTabButtonHtml(l, l === startLayer);
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

		this._registerGlobalApvInstance();
		this._renderLayerContent(startLayer);
	}

	/**
	 * Generates the HTML for a single head tab button.
	 */
	_buildHeadTabButtonHtml(layerIdx, headIdx, isActive) {
		return `<button class="mha-head-tab-btn" id="head-tab-btn-${this.containerId}-${layerIdx}-${headIdx}"
	onclick="showHeadInLayer('${this.containerId}', ${layerIdx}, ${headIdx}, ${this._getLayerHeadCount(layerIdx)})"
	style="padding:8px 16px; border:none; border-right:1px solid #93c5fd; cursor:pointer;
	background:${isActive ? '#fff' : '#e2e8f0'}; font-weight:${isActive ? 'bold' : 'normal'}; font-size:0.85rem;">
	Head ${headIdx + 1}
    </button>`;
	}

	/**
	 * Generates the HTML for a single layer tab button.
	 */
	_buildLayerTabButtonHtml(layerIdx, isActive) {
		const registry = multiLayerAttentionRegistry.get(this.containerId);
		const numLayers = registry ? registry.layers.length : 1;
		return `<button class="mha-layer-tab-btn" id="layer-tab-btn-${this.containerId}-${layerIdx}"
	onclick="showLayer('${this.containerId}', ${layerIdx}, ${numLayers})"
	style="padding:10px 18px; border:none; border-right:1px solid #93c5fd; cursor:pointer;
	background:${isActive ? '#fff' : '#bfdbfe'}; font-weight:${isActive ? 'bold' : 'normal'};">
	Layer ${layerIdx + 1}
    </button>`;
	}

	/**
	 * Returns the number of heads for a given layer index.
	 */
	_getLayerHeadCount(layerIdx) {
		const registry = multiLayerAttentionRegistry.get(this.containerId);
		if (registry && registry.layers[layerIdx]) {
			return registry.layers[layerIdx].headData.length;
		}
		return 0;
	}

	/**
	 * Registers this engine instance globally so APV callbacks can find it.
	 */
	_registerGlobalApvInstance() {
		if (!window.__apv_instances) window.__apv_instances = {};
		window.__apv_instances[this.containerId] = this;
	}

	_renderLayerContent(layerIdx) {
		// ── Try unified mode first ──
		const unifiedAttnSection = document.getElementById(`unified-layer-${layerIdx}-attention-heads`);
		if (unifiedAttnSection) {
			// In unified mode, head content divs live inside the unified container
			const registry = multiLayerAttentionRegistry.get(this.containerId);
			if (!registry || !registry.layers[layerIdx]) return;

			const layerData = registry.layers[layerIdx];
			const layerHeadData = layerData.headData;

			// Check if head tabs exist; if not, executeActualRender will create them
			const headTabList = unifiedAttnSection.querySelector('.head-tab-list');
			if (!headTabList) {
				// Force executeActualRender to build the head tabs
				this.executeActualRender(layerData.headData, layerData.tokens);
				return;
			}

			// Initialize APV state for this layer
			if (!this._apvHoveredToken.has(layerIdx)) {
				this._apvHoveredToken.set(layerIdx, null);
			}

			// Find which head is currently visible and render it
			for (let h = 0; h < layerHeadData.length; h++) {
				const headDiv = document.getElementById(`head-content-${this.containerId}-${layerIdx}-${h}`);
				if (headDiv && headDiv.style.display !== 'none') {
					this._renderHeadContent(layerIdx, h);
					break;
				}
			}
			return;
		}

		// ── Fallback: original layer-content-* mode ──
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
	style="contain:layout;padding:20px; display:${h === 0 ? 'block' : 'none'}"
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

		// Always render directly — no placeholder text, no observer delay
		this._executeHeadRender(layerIdx, headIdx);
	}

	generateEquationsOnly(head) {
		const { WQ, WK, WV } = head;
		const toMatrix = (mat) => `\\begin{pmatrix} ${mat.map(row => row.map(v => v.toFixed(nr_fixed)).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;

		return `
<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:24px;">
	<div>$$ W_Q = ${toMatrix(WQ)} $$</div>
	<div>$$ W_K = ${toMatrix(WK)} $$</div>
	<div>$$ W_V = ${toMatrix(WV)} $$</div>
</div>
`;
	}

	_findScrollParent(el) {
		let node = el.parentElement;
		while (node) {
			const style = getComputedStyle(node);
			if (/(auto|scroll)/.test(style.overflow + style.overflowY)) {
				return node;
			}
			node = node.parentElement;
		}
		return null; // falls back to window
	}

	_morphHtml(container, newHtml) {
		// Quick check: if identical, do nothing
		if (container.innerHTML === newHtml) return false;

		// Parse new HTML into an offscreen element
		const offscreen = document.createElement('div');
		offscreen.innerHTML = newHtml;

		// FIX: Cancel any pending height unlock from a previous call
		if (container._heightUnlockRafId) {
			cancelAnimationFrame(container._heightUnlockRafId);
			container._heightUnlockRafId = null;
		}

		// FIX: Lock the container height to prevent BOTH shrink AND grow
		const previousHeight = container.offsetHeight;
		if (previousHeight > 0) {
			container.style.minHeight = previousHeight + 'px';
			container.style.maxHeight = previousHeight + 'px';
			container.style.overflow = 'hidden';
		}

		// Save scroll position of nearest scrollable ancestor
		const scrollParent = this._findScrollParent(container);
		const savedScrollTop = scrollParent ? scrollParent.scrollTop : window.scrollY;
		const savedScrollLeft = scrollParent ? scrollParent.scrollLeft : window.scrollX;

		// Atomic swap
		container.replaceChildren(...offscreen.childNodes);

		// Restore scroll position before the browser paints
		if (scrollParent) {
			scrollParent.scrollTop = savedScrollTop;
			scrollParent.scrollLeft = savedScrollLeft;
		} else {
			window.scrollTo(savedScrollLeft, savedScrollTop);
		}

		// NOTE: Height lock is NOT released here.
		// The caller is responsible for releasing after post-processing
		// (e.g. render_temml()) is complete.

		return true; // content was updated
	}

	_executeHeadRender(layerIdx, headIdx) {
		const headDiv = document.getElementById(`head-content-${this.containerId}-${layerIdx}-${headIdx}`);
		if (!headDiv) return;

		if (headDiv.dataset.wasRenderedOnce === 'true') {
			this._executeHeadPatchUpdate(headDiv, layerIdx, headIdx);
			return;
		}

		if (headDiv.dataset.rendered === 'true') return;

		this._executeHeadFirstRender(headDiv, layerIdx, headIdx);
	}

	_resolveHeadRenderData(layerIdx, headIdx) {
		const registry = multiLayerAttentionRegistry.get(this.containerId);
		if (!registry) return null;
		const layerData = registry.layers[layerIdx];
		if (!layerData) return null;

		const hd = layerData.headData[headIdx];
		const displayTokens = layerData.tokenStrings
			? [...layerData.tokenStrings]
			: layerData.tokens.map(t => {
				if (typeof t === 'string') return t;
				return tlab_get_top_word_only(t);
			});

		return { layerData, hd, displayTokens };
	}

	_saveScroll(referenceEl) {
		const scrollParent = this._findScrollParent(referenceEl);
		return {
			scrollParent,
			scrollTop: scrollParent ? scrollParent.scrollTop : window.scrollY,
			scrollLeft: scrollParent ? scrollParent.scrollLeft : window.scrollX
		};
	}

	_restoreScroll(saved) {
		if (saved.scrollParent) {
			saved.scrollParent.scrollTop = saved.scrollTop;
			saved.scrollParent.scrollLeft = saved.scrollLeft;
		} else {
			window.scrollTo(saved.scrollLeft, saved.scrollTop);
		}
	}

	_lockHeight(el) {
		if (el._heightUnlockRafId) {
			cancelAnimationFrame(el._heightUnlockRafId);
			el._heightUnlockRafId = null;
		}
		const lockedHeight = el.offsetHeight;
		if (lockedHeight > 0) {
			el.style.minHeight = lockedHeight + 'px';
			el.style.maxHeight = lockedHeight + 'px';
			el.style.overflow = 'hidden';
		}
	}

	_unlockHeightImmediate(el) {
		el.style.minHeight = '';
		el.style.maxHeight = '';
		el.style.overflow = '';
	}

	_buildFirstRenderHtml(
		layerIdx, headIdx, hd, displayTokens, layerInstance,
		webContainerId, webCanvasId, webStripId,
		apvHeadCanvasId, apvMatrixCanvasId
	) {
		return `
<div style="margin-bottom:20px;">
$$ \\text{Layer}_{${layerIdx + 1}},\\; \\text{Head}_{${headIdx + 1}} = \\text{Softmax} \\left( \\frac{Q_{${headIdx + 1}} K_{${headIdx + 1}}^T}{\\sqrt{d_k}} \\right) \\cdot V_{${headIdx + 1}} $$
</div>
<div id="apv-equations-${this.containerId}-${layerIdx}-${headIdx}" style="overflow-x:auto; margin-bottom:20px; overflow-anchor:none;">
    ${layerInstance.generateEquationsOnly(hd)}
</div>

<p style="font-size:0.8rem; color:#64748b; margin-bottom:8px;">
Hover over a word to see where it focuses its attention.
</p>
<div id="${webContainerId}" style="padding-top:20px;position:relative; height:200px; margin-bottom:20px; background:#fcfdfe; border:1px solid #e2e8f0; border-radius:8px; overflow-x:auto; overflow-y:hidden;">
<canvas id="${webCanvasId}" style="position:absolute; top:0; left:0; pointer-events:none; z-index:5;"></canvas>
<div id="${webStripId}" style="display:flex; justify-content:center; gap:10px; position:absolute; bottom:40px; width:max-content; min-width:100%; padding:0 20px; flex-wrap:nowrap;"></div>
</div>

<div class="apv-per-head-section" style="margin-bottom:20px; padding:16px; background:#fafbfc; border:1px solid #e2e8f0; border-radius:8px; overflow-anchor:none">
<div id="apv-headview-wrap-${this.containerId}-${layerIdx}-${headIdx}"
style="display:block; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow-x:auto; overflow-y:hidden; min-height:180px; margin-bottom:8px; overflow-anchor:none; contain:layout style;">
<svg id="${apvHeadCanvasId}" style="width:100%; min-height:180px;"></svg>
</div>

<div style="font-size:0.75rem; color:#94a3b8; text-align:center;">
Hover over a token to highlight its attention connections. Line thickness = attention weight.
</div>
</div>

<div style="margin-bottom:20px; padding:16px; background:#fafbfc; border:1px solid #e2e8f0; border-radius:8px; overflow-anchor:none">
<div id="apv-matrix-wrap-${this.containerId}-${layerIdx}-${headIdx}"
style="display:block; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow-x:auto; overflow-y:hidden; min-height:180px; margin-bottom:8px; overflow-anchor:none; contain:layout style;">
<svg id="${apvMatrixCanvasId}" style="width:100%; min-height:180px;"></svg>
</div>
</div>

<div id="apv-attn-result-${this.containerId}-${layerIdx}-${headIdx}"
 style="margin-top:20px; padding:20px; border:1px solid #f59e0b; border-radius:12px; background:#fffbeb; overflow-x:auto; overflow-anchor:none;">
    ${this._buildAttentionResultHtml(layerIdx, headIdx, hd, displayTokens)}
</div>

<div id="attn-heatmap-${this.containerId}-${layerIdx}-${headIdx}" style="width:100%; margin-bottom:20px;"></div>`;
	}

	/**
	 * Generates all the DOM element IDs needed for a head's first render.
	 */
	_buildHeadElementIds(layerIdx, headIdx) {
		const base = `${this.containerId}-${layerIdx}-${headIdx}`;
		return {
			webContainerId:    `attn-web-container-${base}`,
			webCanvasId:       `attn-web-canvas-${base}`,
			webStripId:        `attn-web-strip-${base}`,
			apvHeadCanvasId:   `apv-head-canvas-${base}-headview`,
			apvMatrixCanvasId: `apv-head-canvas-${base}-matrix`,
		};
	}

	/**
	 * Atomically swaps the content of a head div with new HTML,
	 * preserving the user's scroll position.
	 */
	_swapHeadDivContent(headDiv, html) {
		const offscreen = document.createElement('div');
		offscreen.innerHTML = html;

		const savedScroll = this._saveScroll(headDiv);
		headDiv.replaceChildren(...offscreen.childNodes);
		this._restoreScroll(savedScroll);
	}

	/**
	 * Marks a head div as fully rendered and records the current
	 * weights hash so future patch updates can detect changes.
	 */
	_markHeadRendered(headDiv, layerIdx, headIdx, weights) {
		headDiv.dataset.rendered = 'true';
		headDiv.dataset.wasRenderedOnce = 'true';

		const hashKey = `_apvLastHash_${layerIdx}_${headIdx}`;
		this[hashKey] = this._apvComputeWeightsHash(weights);
	}

	/**
	 * Schedules the post-swap async rendering work: SVG head/matrix
	 * views and the interactive attention web. Called once after the
	 * DOM has been populated and Temml has processed math.
	 */
	_schedulePostRenderDrawing(layerIdx, headIdx, displayTokens, weights) {
		requestAnimationFrame(() => {
			this._apvDrawSingleHeadSync(layerIdx, headIdx, 'headview');
			this._apvDrawSingleHeadSync(layerIdx, headIdx, 'matrix');
			this._renderAttentionWebForHead(layerIdx, headIdx, displayTokens, weights);
		});
	}

	/**
	 * Performs the complete first-time render of a single attention head
	 * into its container div. Orchestrates data resolution, HTML generation,
	 * DOM swap, state bookkeeping, and async drawing.
	 */
	_executeHeadFirstRender(headDiv, layerIdx, headIdx) {
		const resolved = this._resolveHeadRenderData(layerIdx, headIdx);
		if (!resolved) return;
		const { layerData, hd, displayTokens } = resolved;

		const ids = this._buildHeadElementIds(layerIdx, headIdx);

		const html = this._buildFirstRenderHtml(
			layerIdx, headIdx, hd, displayTokens, layerData.instance,
			ids.webContainerId, ids.webCanvasId, ids.webStripId,
			ids.apvHeadCanvasId, ids.apvMatrixCanvasId
		);

		this._swapHeadDivContent(headDiv, html);
		this._markHeadRendered(headDiv, layerIdx, headIdx, hd.this_weights);

		headContentObserver.unobserve(headDiv);
		render_temml();

		this._schedulePostRenderDrawing(layerIdx, headIdx, displayTokens, hd.this_weights);
	}

	_executeHeadPatchUpdate(headDiv, layerIdx, headIdx) {
		headDiv.dataset.rendered = 'true';

		const resolved = this._resolveHeadRenderData(layerIdx, headIdx);
		if (!resolved) return;
		const { layerData, hd, displayTokens } = resolved;

		// Skip if weights haven't changed
		const weightsHash = this._apvComputeWeightsHash(hd.this_weights);
		const hashKey = `_apvLastHash_${layerIdx}_${headIdx}`;
		if (this[hashKey] === weightsHash) return;
		this[hashKey] = weightsHash;

		// Save scroll & lock height
		const savedScroll = this._saveScroll(headDiv);
		this._lockHeight(headDiv);

		// Patch SVGs in-place
		this._apvDrawSingleHeadSync(layerIdx, headIdx, 'headview');
		this._apvDrawSingleHeadSync(layerIdx, headIdx, 'matrix');

		// Re-render attention web
		this._renderAttentionWebForHead(layerIdx, headIdx, displayTokens, hd.this_weights);

		// Morph equations & result HTML
		const { needsTemml, equationsContainer, resultContainer } =
			this._morphEquationsAndResult(layerIdx, headIdx, hd, displayTokens, layerData);

		// Restore scroll
		this._restoreScroll(savedScroll);

		// Re-render math if needed
		if (needsTemml) {
			render_temml();
		}

		// Release height locks on morphed containers
		if (equationsContainer) this._unlockHeightImmediate(equationsContainer);
		if (resultContainer) this._unlockHeightImmediate(resultContainer);

		// Snap headDiv to new natural height, then schedule lock release
		this._snapAndScheduleHeightUnlock(headDiv, savedScroll);
	}

	_morphEquationsAndResult(layerIdx, headIdx, hd, displayTokens, layerData) {
		let needsTemml = false;

		// Equations
		const equationsId = `apv-equations-${this.containerId}-${layerIdx}-${headIdx}`;
		const equationsContainer = document.getElementById(equationsId);
		if (equationsContainer) {
			const layerInstance = layerData.instance;
			const newEquationsHtml = layerInstance.generateEquationsOnly(hd);
			if (this._morphHtml(equationsContainer, newEquationsHtml)) {
				needsTemml = true;
			}
		}

		// Attention result
		const resultId = `apv-attn-result-${this.containerId}-${layerIdx}-${headIdx}`;
		const resultContainer = document.getElementById(resultId);
		if (resultContainer) {
			const newResultHtml = this._buildAttentionResultHtml(layerIdx, headIdx, hd, displayTokens);
			if (this._morphHtml(resultContainer, newResultHtml)) {
				needsTemml = true;
			}
		}

		return { needsTemml, equationsContainer, resultContainer };
	}

	_renderAttentionWebForHead(layerIdx, headIdx, displayTokens, weights) {
		const webContainerId = `attn-web-container-${this.containerId}-${layerIdx}-${headIdx}`;
		const webCanvasId = `attn-web-canvas-${this.containerId}-${layerIdx}-${headIdx}`;
		const webStripId = `attn-web-strip-${this.containerId}-${layerIdx}-${headIdx}`;
		renderDynamicAttentionWeb(
			webContainerId, webCanvasId, webStripId,
			displayTokens, weights
		);
	}

	_snapAndScheduleHeightUnlock(el, savedScroll) {
		const newNaturalHeight = el.scrollHeight;
		el.style.minHeight = newNaturalHeight + 'px';
		el.style.maxHeight = newNaturalHeight + 'px';

		this._restoreScroll(savedScroll);

		el._heightUnlockRafId = requestAnimationFrame(() => {
			el._heightUnlockRafId = null;
			el.style.minHeight = '';
			el.style.maxHeight = '';
			el.style.overflow = '';
		});
	}

	_apvDrawSingleHeadSync(layerIdx, headIdx, mode) {
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

		const prevTokenCount = parseInt(svg.dataset.apvTokenCount || '0');
		const tokenCountChanged = prevTokenCount !== displayTokens.length;

		if (svg.hasChildNodes() && !tokenCountChanged) {
			// Patch in-place — no DOM rebuild, no flicker
			if (mode === 'matrix') {
				this._apvPatchMatrix(svg, layerIdx, headIdx, singleHeadData, displayTokens);
			} else {
				this._apvPatchHeadView(svg, layerIdx, headIdx, singleHeadData, displayTokens);
			}
		} else {
			// Full render — wrapper height is already locked by _executeHeadRender
			if (mode === 'matrix') {
				this._apvDrawSingleHeadMatrixSync(svg, layerIdx, headIdx, singleHeadData, displayTokens);
				this._apvAttachMatrixTooltip(svg, layerIdx, [singleHeadData], displayTokens, headIdx);
			} else {
				this._apvDrawSingleHeadViewSync(svg, layerIdx, headIdx, singleHeadData, displayTokens);
				this._apvAttachSingleHeadHoverEvents(svg, layerIdx, headIdx, singleHeadData, displayTokens);
			}
			svg.dataset.apvTokenCount = displayTokens.length;
		}
	}

	_apvDrawSingleHeadMatrixSync(svg, layerIdx, headIdx, headData, tokens) {
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

		const frag = document.createDocumentFragment();

		const makeSvgEl = (tag, attrs, content) => {
			const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
			for (const [k, v] of Object.entries(attrs)) {
				if (k === 'style') el.style.cssText = v;
				else el.setAttribute(k, v);
			}
			if (content !== undefined) el.textContent = content;
			return el;
		};

		const offsetX = padding / 2;
		const offsetY = padding / 2;

		frag.appendChild(makeSvgEl('text', {
			x: String(offsetX + matrixSize / 2), y: String(offsetY - 30),
			'font-size': '12', fill: color, 'font-weight': '700', 'text-anchor': 'middle'
		}, `Head ${headIdx + 1}`));

		for (let i = 0; i < n; i++) {
			frag.appendChild(makeSvgEl('text', {
				x: String(offsetX - 4),
				y: String(offsetY + i * cellSize + cellSize / 2 + 4),
				'font-size': '9', fill: '#64748b', 'text-anchor': 'end',
				'data-apv-token-side': 'row',
				'data-apv-token-idx': String(i),
				style: 'cursor:pointer;'
			}, tokens[i]));
		}

		for (let j = 0; j < n; j++) {
			const cx = offsetX + j * cellSize + cellSize / 2;
			const cy = offsetY - 6;
			frag.appendChild(makeSvgEl('text', {
				x: String(cx), y: String(cy),
				'font-size': '9', fill: '#64748b', 'text-anchor': 'start',
				transform: `rotate(-45, ${cx}, ${cy})`,
				'data-apv-token-side': 'col',
				'data-apv-token-idx': String(j),
				style: 'cursor:pointer;'
			}, tokens[j]));
		}

		for (let qi = 0; qi < n; qi++) {
			for (let ki = qi + 1; ki < n; ki++) {
				const x = offsetX + ki * cellSize;
				const y = offsetY + qi * cellSize;
				frag.appendChild(makeSvgEl('rect', {
					x: String(x), y: String(y),
					width: String(cellSize), height: String(cellSize),
					fill: '#94a3b8', 'fill-opacity': '0.12',
					'pointer-events': 'none'
				}));
			}
		}

		if (n > 1) {
			let pathD = '';
			for (let i = 0; i < n; i++) {
				const x1 = offsetX + (i + 1) * cellSize;
				const y1 = offsetY + i * cellSize;
				const y2 = offsetY + (i + 1) * cellSize;
				if (i === 0) {
					pathD += `M ${x1} ${y1}`;
				} else {
					pathD += ` L ${x1} ${y1}`;
				}
				pathD += ` L ${x1} ${y2}`;
			}
			frag.appendChild(makeSvgEl('path', {
				d: pathD,
				fill: 'none',
				stroke: '#64748b',
				'stroke-width': '1.5',
				'stroke-dasharray': '4,3',
				'pointer-events': 'none',
				'opacity': '0.6'
			}));

			frag.appendChild(makeSvgEl('text', {
				x: String(offsetX + matrixSize - 2),
				y: String(offsetY + 12),
				'font-size': '7', fill: '#94a3b8', 'text-anchor': 'end',
				'pointer-events': 'none', 'font-style': 'italic'
			}, 'causal mask'));
		}

		for (let qi = 0; qi < n; qi++) {
			for (let ki = 0; ki < n; ki++) {
				const w = weights[qi][ki];
				const x = offsetX + ki * cellSize;
				const y = offsetY + qi * cellSize;
				const alpha = Math.max(0.05, w);

				frag.appendChild(makeSvgEl('rect', {
					x: String(x), y: String(y),
					width: String(cellSize), height: String(cellSize),
					fill: color, 'fill-opacity': alpha.toFixed(3),
					stroke: '#e2e8f0', 'stroke-width': '0.5',
					'data-apv-head': '0', 'data-apv-qi': String(qi), 'data-apv-ki': String(ki),
					style: 'cursor:crosshair;'
				}));

				if (cellSize >= 28 && w > 0.05) {
					frag.appendChild(makeSvgEl('text', {
						x: String(x + cellSize / 2), y: String(y + cellSize / 2 + 3),
						'font-size': '8', fill: w > 0.5 ? '#fff' : '#334155',
						'text-anchor': 'middle', 'pointer-events': 'none'
					}, (w * 100).toFixed(0)));
				}
			}
		}

		// No wrapper height locking here — caller is responsible
		svg.replaceChildren(frag);
	}


	_apvDrawSingleHeadViewSync(svg, layerIdx, headIdx, headData, tokens) {
		const n = tokens.length;
		const { rowHeight, leftColumnX, rightColumnX, topPadding, minOpacity } = this._apvOptions;
		const color = AttentionEngine.HEAD_COLORS[headIdx % AttentionEngine.HEAD_COLORS.length];

		const svgHeight = topPadding + n * rowHeight + 40;
		const svgWidth = rightColumnX + 120;

		svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
		svg.style.minHeight = svgHeight + 'px';

		const frag = document.createDocumentFragment();

		const makeText = (attrs, content) => {
			const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			for (const [k, v] of Object.entries(attrs)) {
				if (k === 'style') el.style.cssText = v;
				else el.setAttribute(k, v);
			}
			el.textContent = content;
			return el;
		};

		const makePath = (attrs) => {
			const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
			return el;
		};

		frag.appendChild(makeText({
			x: String(leftColumnX), y: '18', 'font-size': '11', fill: '#64748b',
			'font-weight': '600', 'text-anchor': 'middle'
		}, 'Query (attending)'));

		frag.appendChild(makeText({
			x: String(rightColumnX), y: '18', 'font-size': '11', fill: '#64748b',
			'font-weight': '600', 'text-anchor': 'middle'
		}, 'Key (attended to)'));

		const hoverKey = `${layerIdx}-${headIdx}`;
		const hovered = this._apvHoveredToken.get(hoverKey) || null;

		for (let i = 0; i < n; i++) {
			const y = topPadding + i * rowHeight;
			const isHoveredLeft = hovered && hovered.side === 'left' && hovered.index === i;
			const isHoveredRight = hovered && hovered.side === 'right' && hovered.index === i;

			frag.appendChild(makeText({
				x: String(leftColumnX), y: String(y + 4),
				'font-size': '12', fill: isHoveredLeft ? '#1e40af' : '#334155',
				'font-weight': isHoveredLeft ? '700' : '500', 'text-anchor': 'end',
				style: 'cursor:pointer;',
				'data-apv-side': 'left', 'data-apv-idx': String(i)
			}, tokens[i]));

			frag.appendChild(makeText({
				x: String(rightColumnX), y: String(y + 4),
				'font-size': '12', fill: isHoveredRight ? '#1e40af' : '#334155',
				'font-weight': isHoveredRight ? '700' : '500', 'text-anchor': 'start',
				style: 'cursor:pointer;',
				'data-apv-side': 'right', 'data-apv-idx': String(i)
			}, tokens[i]));
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

				frag.appendChild(makePath({
					d: `M ${x1} ${y1} C ${cpx} ${y1}, ${cpx} ${y2}, ${x2} ${y2}`,
					fill: 'none', stroke: color,
					'stroke-width': (1 + w * 5).toFixed(1),
					'stroke-opacity': w.toFixed(3),
					'data-apv-qi': String(qi), 'data-apv-ki': String(ki)
				}));
			}
		}

		// No wrapper height locking here — caller is responsible
		svg.replaceChildren(frag);
	}

	_buildAttentionResultHtml(layerIdx, headIdx, hd, displayTokens) {
		const n = displayTokens.length;
		const weights = hd.this_weights || hd.weights;
		const Vi = hd.Vi || hd.v;
		const context = hd.context;
		const d_k = Vi && Vi[0] ? Vi[0].length : 1;
		const d_model = hd.d_model || this.d_model;
		const n_heads = Math.round(d_model / d_k);
		const L = layerIdx + 1;

		if (!weights || !Vi || !context || !Array.isArray(Vi[0]) || !Array.isArray(context[0])) {
			return `<p style="color:#94a3b8;">Attention result data not available for this head.</p>`;
		}

		let html = '';

		// Header
		html += `<p style="font-weight:bold; color:#92400e; font-size:0.95rem; margin-bottom:12px;">
	What Happens with the Attention Weights — Head ${headIdx + 1}, Layer ${L}
    </p>`;

		// Step 1: Context matrix equation with labeled matrices
		html += this._buildContextMatrixSection(
			headIdx, L, n, d_k, weights, Vi, context, displayTokens
		);

		// Step 2: What happens next (concat, projection, residual)
		html += this._buildWhatHappensNextSection(n, d_k, d_model, n_heads);

		return html;
	}

	_apvComputeWeightsHash(weights) {
		// Fast hash: sample a few values and combine them
		// This avoids iterating every cell while still detecting meaningful changes
		if (!weights || weights.length === 0) return '0';
		const n = weights.length;
		let hash = n;
		// Sample diagonal + first row + last row
		for (let i = 0; i < n; i++) {
			hash = (hash * 31 + (weights[i][i] * 10000 | 0)) | 0;          // diagonal
			hash = (hash * 31 + (weights[0][i] * 10000 | 0)) | 0;          // first row
			hash = (hash * 31 + (weights[n - 1][i] * 10000 | 0)) | 0;      // last row
		}
		// Also sample middle row if exists
		if (n > 2) {
			const mid = (n / 2) | 0;
			for (let i = 0; i < n; i++) {
				hash = (hash * 31 + (weights[mid][i] * 10000 | 0)) | 0;
			}
		}
		return String(hash);
	}

	_apvDrawSingleHead(layerIdx, headIdx, mode) {
		// ── Lazy-init the per-head visibility observer & tracking maps ──
		if (!this._apvHeadVisibility) {
			this._apvHeadVisibility = new Map();  // "layerIdx-headIdx" → boolean
			this._apvHeadPending    = new Map();  // "layerIdx-headIdx-mode" → true
			this._apvHeadDebounce   = new Map();  // "layerIdx-headIdx-mode" → timerId

			this._apvSectionObserver = new IntersectionObserver((entries) => {
				for (const entry of entries) {
					const el    = entry.target;
					const lIdx  = parseInt(el.dataset.apvLayerIdx);
					const hIdx  = parseInt(el.dataset.apvHeadIdx);
					const key   = `${lIdx}-${hIdx}`;
					const wasVisible = this._apvHeadVisibility.get(key) || false;
					this._apvHeadVisibility.set(key, entry.isIntersecting);

					// Became visible → flush any pending draws
					if (entry.isIntersecting && !wasVisible) {
						for (const m of ['headview', 'matrix']) {
							const pendingKey = `${lIdx}-${hIdx}-${m}`;
							if (this._apvHeadPending.get(pendingKey)) {
								this._apvHeadPending.delete(pendingKey);
								this._apvExecuteDraw(lIdx, hIdx, m);
							}
						}
					}
				}
			}, { threshold: 0 });
		}

		const visKey     = `${layerIdx}-${headIdx}`;
		const debounceKey = `${layerIdx}-${headIdx}-${mode}`;

		// ── Observe the .apv-per-head-section wrapper if not already ──
		const headDiv = document.getElementById(
			`head-content-${this.containerId}-${layerIdx}-${headIdx}`
		);
		if (headDiv && !this._apvHeadVisibility.has(visKey)) {
			const section = headDiv.querySelector('.apv-per-head-section');
			if (section) {
				section.dataset.apvLayerIdx = layerIdx;
				section.dataset.apvHeadIdx  = headIdx;
				this._apvSectionObserver.observe(section);
				// Assume not visible until the observer fires
				this._apvHeadVisibility.set(visKey, false);
			}
		}

		// ── Debounce: cancel any prior timer for this key, start a new one ──
		const prevTimer = this._apvHeadDebounce.get(debounceKey);
		if (prevTimer) cancelAnimationFrame(prevTimer);

		this._apvHeadDebounce.set(debounceKey, requestAnimationFrame(() => {
			this._apvHeadDebounce.delete(debounceKey);

			// If currently in view → draw immediately
			if (this._apvHeadVisibility.get(visKey)) {
				this._apvExecuteDraw(layerIdx, headIdx, mode);
			} else {
				// Not in view → just mark pending; the observer will flush it
				this._apvHeadPending.set(debounceKey, true);
			}
		}));
	}

	_apvExecuteDraw(layerIdx, headIdx, mode) {
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

		const prevTokenCount = parseInt(svg.dataset.apvTokenCount || '0');
		const tokenCountChanged = prevTokenCount !== displayTokens.length;

		if (svg.hasChildNodes() && !tokenCountChanged) {
			// Patch in-place — no flicker
			if (mode === 'matrix') {
				this._apvPatchMatrix(svg, layerIdx, headIdx, singleHeadData, displayTokens);
			} else {
				this._apvPatchHeadView(svg, layerIdx, headIdx, singleHeadData, displayTokens);
			}
		} else {
			// Full render — lock wrapper, draw, schedule unlock
			const wrapper = svg.parentElement;
			if (wrapper) {
				wrapper.style.minHeight = wrapper.offsetHeight + 'px';
			}

			if (mode === 'matrix') {
				this._apvDrawSingleHeadMatrixSync(svg, layerIdx, headIdx, singleHeadData, displayTokens);
				this._apvAttachMatrixTooltip(svg, layerIdx, [singleHeadData], displayTokens, headIdx);
			} else {
				this._apvDrawSingleHeadViewSync(svg, layerIdx, headIdx, singleHeadData, displayTokens);
				this._apvAttachSingleHeadHoverEvents(svg, layerIdx, headIdx, singleHeadData, displayTokens);
			}
			svg.dataset.apvTokenCount = displayTokens.length;

			if (wrapper) {
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						wrapper.style.minHeight = '';
					});
				});
			}
		}
	}

	_apvPatchHeadView(svg, layerIdx, headIdx, headData, tokens) {
		const { rowHeight, leftColumnX, rightColumnX, topPadding, minOpacity } = this._apvOptions;
		const color = AttentionEngine.HEAD_COLORS[headIdx % AttentionEngine.HEAD_COLORS.length];
		const weights = headData.this_weights;
		const n = tokens.length;

		// ── Patch token labels ──
		const textEls = svg.querySelectorAll('text[data-apv-side]');
		textEls.forEach(el => {
			const idx = parseInt(el.getAttribute('data-apv-idx'));
			if (idx < n) {
				el.textContent = tokens[idx];
			}
		});

		// ── Build a lookup of existing paths by qi-ki ──
		const existingPaths = new Map();
		svg.querySelectorAll('path[data-apv-qi]').forEach(p => {
			const qi = p.getAttribute('data-apv-qi');
			const ki = p.getAttribute('data-apv-ki');
			existingPaths.set(`${qi}-${ki}`, p);
		});

		// ── Patch or create/remove paths ──
		const neededPaths = new Set();
		for (let qi = 0; qi < n; qi++) {
			for (let ki = 0; ki < n; ki++) {
				const w = weights[qi][ki];
				const key = `${qi}-${ki}`;

				if (w < minOpacity) {
					// Remove if exists
					const existing = existingPaths.get(key);
					if (existing) existing.remove();
					continue;
				}

				neededPaths.add(key);

				const y1 = topPadding + qi * rowHeight;
				const y2 = topPadding + ki * rowHeight;
				const x1 = leftColumnX + 6;
				const x2 = rightColumnX - 6;
				const cpx = (x1 + x2) / 2;
				const d = `M ${x1} ${y1} C ${cpx} ${y1}, ${cpx} ${y2}, ${x2} ${y2}`;
				const sw = (1 + w * 5).toFixed(1);
				const so = w.toFixed(3);

				const existing = existingPaths.get(key);
				if (existing) {
					// Update in place
					existing.setAttribute('d', d);
					existing.setAttribute('stroke-width', sw);
					existing.setAttribute('stroke-opacity', so);
					existing.setAttribute('stroke', color);
				} else {
					// Create new path
					const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
					path.setAttribute('d', d);
					path.setAttribute('fill', 'none');
					path.setAttribute('stroke', color);
					path.setAttribute('stroke-width', sw);
					path.setAttribute('stroke-opacity', so);
					path.setAttribute('data-apv-qi', qi);
					path.setAttribute('data-apv-ki', ki);
					svg.appendChild(path);
				}
			}
		}

		// Remove paths that are no longer needed
		existingPaths.forEach((path, key) => {
			if (!neededPaths.has(key)) path.remove();
		});
	}

	_apvPatchMatrix(svg, layerIdx, headIdx, headData, tokens) {
		const n = tokens.length;
		const cellSize = Math.max(18, Math.min(40, 300 / n));
		const color = AttentionEngine.HEAD_COLORS[headIdx % AttentionEngine.HEAD_COLORS.length];
		const weights = headData.this_weights;
		const padding = 80;
		const offsetX = padding / 2;
		const offsetY = padding / 2;

		// ── Update live tooltip data so the mousemove handler reads fresh values ──
		if (svg._apvTooltipData) {
			svg._apvTooltipData.headDataArray = [headData];
			svg._apvTooltipData.tokens = tokens;
			svg._apvTooltipData.layerIdx = layerIdx;
		}

		// ── Invalidate tooltip cache and force immediate rebuild if visible ──
		if (svg._apvTooltipCache) {
			svg._apvTooltipCache.lastKey = null;
		}
		if (svg._apvTooltipRebuild) {
			svg._apvTooltipRebuild();
		}

		// ── Patch row labels ──
		svg.querySelectorAll('text[data-apv-token-side="row"]').forEach(el => {
			const idx = parseInt(el.getAttribute('data-apv-token-idx'));
			if (idx < n) {
				el.textContent = tokens[idx];
			}
		});

		// ── Patch column labels ──
		svg.querySelectorAll('text[data-apv-token-side="col"]').forEach(el => {
			const idx = parseInt(el.getAttribute('data-apv-token-idx'));
			if (idx < n) {
				el.textContent = tokens[idx];
			}
		});

		// ── Patch rect fill-opacity ──
		const rects = svg.querySelectorAll('rect[data-apv-qi]');
		rects.forEach(rect => {
			const qi = parseInt(rect.getAttribute('data-apv-qi'));
			const ki = parseInt(rect.getAttribute('data-apv-ki'));
			if (qi >= n || ki >= n) return;

			const w = weights[qi][ki];
			const alpha = Math.max(0.05, w);
			rect.setAttribute('fill-opacity', alpha.toFixed(3));
			rect.setAttribute('fill', color);
		});

		// ── Patch value text inside cells ──
		if (cellSize >= 28) {
			const valueTexts = svg.querySelectorAll('text[pointer-events="none"]');
			valueTexts.forEach(txt => {
				const x = parseFloat(txt.getAttribute('x'));
				const y = parseFloat(txt.getAttribute('y'));
				const kiCalc = Math.round((x - offsetX - cellSize / 2) / cellSize);
				const qiCalc = Math.round((y - 3 - offsetY - cellSize / 2) / cellSize);

				if (qiCalc >= 0 && qiCalc < n && kiCalc >= 0 && kiCalc < n) {
					const w = weights[qiCalc][kiCalc];
					if (w > 0.05) {
						txt.textContent = (w * 100).toFixed(0);
						txt.setAttribute('fill', w > 0.5 ? '#fff' : '#334155');
					} else {
						txt.textContent = '';
					}
				}
			});
		}
	}

	_apvFlushHeadDraw(key) {
		const [layerIdxStr, headIdxStr, mode] = key.split('-');
		const layerIdx = parseInt(layerIdxStr, 10);
		const headIdx  = parseInt(headIdxStr, 10);

		const registry = multiLayerAttentionRegistry.get(this.containerId);
		if (!registry) return;
		const layerData = registry.layers[layerIdx];
		if (!layerData) return;

		const headDataArray  = layerData.headData;
		const displayTokens  = this._apvResolveTokenLabels(layerData.tokenStrings, headDataArray);
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
		const hovered = this._apvHoveredToken.get(layerIdx);
		const activeHeads = this._apvActiveHeads.get(layerIdx) || new Set();

		this._apvUpdatePathOpacities(svg, headDataArray, activeHeads, hovered);
		this._apvUpdateTokenTextStyles(svg, hovered);
		this._apvReplaceWeightLabels(svg, layerIdx, headDataArray, displayTokens, activeHeads, hovered);
	}

	_apvAppendWeightLabel(svg, x, y, color, text, textAnchor) {
		const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		label.setAttribute('x', x.toFixed(1));
		label.setAttribute('y', y.toFixed(1));
		label.setAttribute('font-size', '9');
		label.setAttribute('fill', color);
		label.setAttribute('font-weight', '700');
		label.setAttribute('text-anchor', textAnchor);
		label.setAttribute('class', 'apv-weight-label');
		label.setAttribute('stroke', '#fff');
		label.setAttribute('stroke-width', '2.5');
		label.setAttribute('paint-order', 'stroke');
		label.textContent = text;
		svg.appendChild(label);
	}

	_apvRenderLabelGroups(svg, groups, hovered) {
		const { rowHeight, leftColumnX, rightColumnX, topPadding } = this._apvOptions;
		const arcX1 = leftColumnX + 6;
		const arcX2 = rightColumnX - 6;
		const labelGap = 30;

		groups.forEach((group, targetIdx) => {
			const y = topPadding + targetIdx * rowHeight + 4;

			if (hovered.side === 'left') {
				const anchorX = arcX2 - 4;
				group.forEach((lbl, i) => {
					this._apvAppendWeightLabel(svg, anchorX - i * labelGap, y, lbl.color, lbl.text, 'end');
				});
			} else {
				const anchorX = arcX1 + 4;
				group.forEach((lbl, i) => {
					this._apvAppendWeightLabel(svg, anchorX + i * labelGap, y, lbl.color, lbl.text, 'start');
				});
			}
		});
	}

	_apvGroupLabelsByTarget(candidates) {
		const groups = new Map();
		candidates.forEach(lbl => {
			if (!groups.has(lbl.targetIdx)) groups.set(lbl.targetIdx, []);
			groups.get(lbl.targetIdx).push(lbl);
		});
		// Sort each group by head index for consistent ordering
		groups.forEach(group => group.sort((a, b) => a.hIdx - b.hIdx));
		return groups;
	}

	_apvCollectLabelCandidates(headDataArray, displayTokens, activeHeads, hovered) {
		const candidates = [];
		const n = displayTokens.length;

		headDataArray.forEach((head, hIdx) => {
			if (!activeHeads.has(hIdx)) return;

			const color = AttentionEngine.HEAD_COLORS[hIdx % AttentionEngine.HEAD_COLORS.length];
			const weights = head.this_weights;

			for (let qi = 0; qi < n; qi++) {
				for (let ki = 0; ki < n; ki++) {
					const w = weights[qi][ki];
					if (w < 0.05) continue;

					const { side, index } = hovered;
					const isRelevant =
						(side === 'left' && index === qi) ||
						(side === 'right' && index === ki);
					if (!isRelevant) continue;

					const targetIdx = (side === 'left') ? ki : qi;
					candidates.push({ targetIdx, color, text: `${(w * 100).toFixed(0)}%`, hIdx });
				}
			}
		});

		return candidates;
	}

	_apvReplaceWeightLabels(svg, layerIdx, headDataArray, displayTokens, activeHeads, hovered) {
		svg.querySelectorAll('.apv-weight-label').forEach(el => el.remove());

		if (!hovered) return;

		const labelCandidates = this._apvCollectLabelCandidates(
			headDataArray, displayTokens, activeHeads, hovered
		);
		const groups = this._apvGroupLabelsByTarget(labelCandidates);
		this._apvRenderLabelGroups(svg, groups, hovered);
	}

	_apvUpdateTokenTextStyles(svg, hovered) {
		const texts = svg.querySelectorAll('text[data-apv-side]');
		texts.forEach(text => {
			const side = text.getAttribute('data-apv-side');
			const idx = parseInt(text.getAttribute('data-apv-idx'));
			const isHovered = hovered && hovered.side === side && hovered.index === idx;
			text.setAttribute('fill', isHovered ? '#1e40af' : '#334155');
			text.setAttribute('font-weight', isHovered ? '700' : '500');
		});
	}

	_apvUpdatePathOpacities(svg, headDataArray, activeHeads, hovered) {
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
				const isHighlighted =
					(side === 'left' && index === qi) ||
					(side === 'right' && index === ki);

				if (isHighlighted) {
					path.setAttribute('stroke-opacity', (0.3 + w * 0.7).toFixed(3));
					path.setAttribute('stroke-width', (2 + w * 8).toFixed(1));
				} else {
					path.setAttribute('stroke-opacity', '0.04');
					path.setAttribute('stroke-width', '0.5');
				}
			}
		});
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
		// Store live-updating data reference on the SVG element itself
		svg._apvTooltipData = {
			headDataArray,
			tokens,
			layerIdx,
			headDisplayOffset
		};

		// If already attached, just invalidate cache and force rebuild
		if (svg._apvTooltipAttached) {
			if (svg._apvTooltipCache) {
				svg._apvTooltipCache.lastKey = null;
			}
			if (svg._apvTooltipRebuild) {
				svg._apvTooltipRebuild();
			}
			return;
		}
		svg._apvTooltipAttached = true;

		const tooltip = this._createTooltipElement(layerIdx, headDisplayOffset);
		const cache = { lastKey: null };
		svg._apvTooltipCache = cache;

		let lastMouseEvent = null;
		const self = this;

		const buildTooltip = (e) => {
			const liveData = svg._apvTooltipData;
			if (!liveData) return;

			// Try grid cell first
			const rect = e.target.closest('rect[data-apv-qi]');
			if (rect) {
				const hIdx = parseInt(rect.getAttribute('data-apv-head'));
				const qi = parseInt(rect.getAttribute('data-apv-qi'));
				const ki = parseInt(rect.getAttribute('data-apv-ki'));
				const tooltipKey = `rect-${hIdx}-${qi}-${ki}`;
				if (tooltipKey === cache.lastKey) {
					self._positionTooltip(tooltip, e);
					return;
				}
				cache.lastKey = tooltipKey;

				const html = self._buildCellTooltipHtml(liveData, hIdx, qi, ki);
				if (!html) {
					tooltip.style.display = 'none';
					return;
				}
				tooltip.innerHTML = html;
				render_temml();
				self._positionTooltip(tooltip, e);
				return;
			}

			// Try row/column label
			const textEl = e.target.closest('text[data-apv-token-side]');
			if (textEl) {
				const side = textEl.getAttribute('data-apv-token-side');
				const idx = parseInt(textEl.getAttribute('data-apv-token-idx'));
				const tooltipKey = `label-${side}-${idx}`;
				if (tooltipKey === cache.lastKey) {
					self._positionTooltip(tooltip, e);
					return;
				}
				cache.lastKey = tooltipKey;

				const html = self._buildLabelTooltipHtml(liveData, idx);
				if (!html) {
					tooltip.style.display = 'none';
					return;
				}
				tooltip.innerHTML = html;
				render_temml();
				self._positionTooltip(tooltip, e);
				return;
			}

			// Nothing relevant
			tooltip.style.display = 'none';
			cache.lastKey = null;
		};

		svg.addEventListener('mousemove', (e) => {
			lastMouseEvent = e;
			buildTooltip(e);
		});

		svg.addEventListener('mouseleave', () => {
			lastMouseEvent = null;
			tooltip.style.display = 'none';
			cache.lastKey = null;
		});

		svg._apvTooltipRebuild = () => {
			if (lastMouseEvent && tooltip.style.display !== 'none') {
				cache.lastKey = null;
				buildTooltip(lastMouseEvent);
			}
		};
	}

	_createTooltipElement(layerIdx, headDisplayOffset) {
		const tooltipId = `apv-tooltip-${this.containerId}-${layerIdx}-${headDisplayOffset}`;

		let tooltip = document.getElementById(tooltipId);
		if (tooltip) tooltip.remove();

		tooltip = document.createElement('div');
		tooltip.id = tooltipId;
		tooltip.style.cssText = `
		position:fixed; padding:10px 14px; background:#1e293b; color:#fff;
		border-radius:8px; font-size:0.8rem; pointer-events:none;
		z-index:9999; display:none; white-space:normal;
		box-shadow: 0 4px 16px rgba(0,0,0,0.25);
		max-width:90vw; max-height:80vh; overflow-y:auto;
		line-height:1.5;
	    `;
		document.body.appendChild(tooltip);
		return tooltip;
	}

	/**
	 * Positions the tooltip near the cursor, clamping to viewport edges.
	 */
	_positionTooltip(tooltip, e) {
		tooltip.style.display = 'block';
		const tw = tooltip.offsetWidth;
		const th = tooltip.offsetHeight;
		let left = e.clientX + 16;
		let top = e.clientY - 20;

		if (left + tw > window.innerWidth - 10) {
			left = e.clientX - tw - 16;
		}
		if (left < 10) {
			left = 10;
		}
		if (top + th > window.innerHeight - 10) {
			top = window.innerHeight - th - 10;
		}
		if (top < 10) {
			top = 10;
		}

		tooltip.style.left = left + 'px';
		tooltip.style.top = top + 'px';
	}

	_tooltipColVec(arr) {
		return `\\begin{pmatrix} ${arr.map(v => typeof v === 'number' ? v.toFixed(nr_fixed) : v).join(' \\\\ ')} \\end{pmatrix}`;
	}

	_tooltipRowVec(arr) {
		return `\\begin{pmatrix} ${arr.map(v => typeof v === 'number' ? v.toFixed(nr_fixed) : v).join(' & ')} \\end{pmatrix}`;
	}

	_tooltipMatrix(mat) {
		return `\\begin{pmatrix} ${mat.map(row => row.map(v => v.toFixed(nr_fixed)).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
	}

	_tooltipDotVec(a, b) {
		return a.reduce((s, v, i) => s + v * b[i], 0);
	}

	/**
	 * Builds tooltip HTML when hovering a grid cell (rect) in the attention matrix.
	 * Returns null if the head data is missing.
	 */
	_buildCellTooltipHtml(liveData, hIdx, qi, ki) {
		const { headDataArray, tokens, layerIdx, headDisplayOffset } = liveData;
		if (!headDataArray[hIdx]) return null;

		const hd = headDataArray[hIdx];
		const ctx = this._buildCellTooltipContext(hd, qi, ki, tokens, layerIdx, headDisplayOffset);

		let html = '';
		html += this._buildCellTooltipHeader(ctx);
		html += this._buildCellTooltipDkDerivation(ctx);
		html += this._buildCellTooltipAbstractScore(ctx);
		html += this._buildProjectionHtml('Q', qi, hd.WQ, ctx.h0_qi, ctx.q_i, tokens[qi], ctx.hLabel, layerIdx);
		html += this._buildProjectionHtml('K', ki, hd.WK, ctx.h0_kj, ctx.k_j, tokens[ki], ctx.hLabel, layerIdx);
		html += this._buildProjectionHtml('V', ki, hd.WV, ctx.h0_kj, ctx.v_j, tokens[ki], ctx.hLabel, layerIdx);
		html += this._buildCellTooltipDotProduct(ctx);
		html += this._buildSoftmaxHtml(ctx.rawScoresRow, ctx.softmaxRow, qi, ki, ctx.n, tokens);
		html += this._buildCellTooltipWeightedV(ctx);

		return html;
	}

	/**
	 * Precomputes all derived values needed by the cell tooltip sub-builders.
	 * Returns a context object shared across all tooltip section builders.
	 */
	_buildCellTooltipContext(hd, qi, ki, tokens, layerIdx, headDisplayOffset) {
		const d_k = hd.Qi[0].length;
		const d_k_int = Math.round(d_k);
		const d_model = hd.d_model || this.d_model;
		const d_model_int = Math.round(d_model);
		const n_heads = Math.round(d_model / d_k);
		const n = tokens.length;
		const w = hd.this_weights[qi][ki];
		const displayHeadNum = (headDisplayOffset || 0) + 1;
		const hLabel = `h_{${layerIdx}}`;

		const q_i = hd.Qi[qi];
		const k_j = hd.Ki[ki];
		const v_j = hd.Vi[ki];
		const h0_qi = hd.h0[qi];
		const h0_kj = hd.h0[ki];

		const rawScore = this._tooltipDotVec(q_i, k_j) / Math.sqrt(d_k);
		const rawScoresRow = this._computeRawScoresRow(hd, qi, n, d_k);
		const softmaxRow = this._computeSoftmaxRow(rawScoresRow);

		return {
			d_k, d_k_int, d_model, d_model_int, n_heads, n, w,
			displayHeadNum, hLabel,
			q_i, k_j, v_j, h0_qi, h0_kj,
			rawScore, rawScoresRow, softmaxRow,
			qi, ki, tokens
		};
	}

	/**
	 * Builds the tooltip header line showing head number, token pair, and weight percentage.
	 */
	_buildCellTooltipHeader(ctx) {
		const { displayHeadNum, tokens, qi, ki, w } = ctx;
		return `<div style="margin-bottom:8px; font-weight:bold; font-size:0.85rem;">` +
			`Head ${displayHeadNum}: "${tokens[qi]}" → "${tokens[ki]}" = ${(w * 100).toFixed(1)}%` +
			`</div>`;
	}

	/**
	 * Builds the d_k = d_model / n_heads derivation line.
	 */
	_buildCellTooltipDkDerivation(ctx) {
		const { d_model_int, n_heads, d_k_int } = ctx;
		return `<div style="margin-bottom:6px; padding:4px 8px; background:rgba(255,255,255,0.08); border-radius:4px; font-size:0.75rem;">` +
			`$d_k = \\frac{d_{\\text{model}}}{n_{\\text{heads}}} = \\frac{${d_model_int}}{${n_heads}} = ${d_k_int}$` +
			`</div>`;
	}


	/**
	 * Builds the abstract attention score equation: score(Q_i, K_j) = Q^T·K / sqrt(d_k).
	 */
	_buildCellTooltipAbstractScore(ctx) {
		const { qi, ki, d_k_int, rawScore } = ctx;
		return `<div style="margin-bottom:6px;">` +
			`$\\text{score}(Q_{${qi}}, K_{${ki}}) = \\frac{Q_{${qi}}^T \\cdot K_{${ki}}}{\\sqrt{d_k}} = ` +
			`\\frac{Q_{${qi}}^T \\cdot K_{${ki}}}{\\sqrt{${d_k_int}}} = ${rawScore.toFixed(nr_fixed)}$` +
			`</div>`;
	}

	/**
	 * Builds the expanded dot product showing the actual Q and K vectors,
	 * their element-wise product, and the scaled result.
	 */
	_buildCellTooltipDotProduct(ctx) {
		const { q_i, k_j, qi, ki, d_k, d_k_int, rawScore, tokens } = ctx;
		const dotProduct = this._tooltipDotVec(q_i, k_j);
		return `<div style="margin-bottom:6px;">` +
			`$\\frac{\\underbrace{${this._tooltipRowVec(q_i)}}_{Q_{${qi}}^T\\;(\\text{"${tokens[qi]}"})} \\cdot ` +
			`\\underbrace{${this._tooltipColVec(k_j)}}_{K_{${ki}}\\;(\\text{"${tokens[ki]}"})}}{\\sqrt{${d_k_int}}} = ` +
			`\\frac{${dotProduct.toFixed(nr_fixed)}}{${Math.sqrt(d_k).toFixed(nr_fixed)}} = ${rawScore.toFixed(nr_fixed)}$` +
			`</div>`;
	}

	/**
	 * Builds the weighted value contribution line: α_{i,j} · V_j = result vector.
	 */
	_buildCellTooltipWeightedV(ctx) {
		const { w, v_j, qi, ki } = ctx;
		const weightedV = v_j.map(v => w * v);
		return `<div style="margin-top:6px; padding:4px 8px; background:rgba(255,255,255,0.08); border-radius:4px; font-size:0.75rem;">` +
			`$\\alpha_{${qi},${ki}} \\cdot V_{${ki}} = ${w.toFixed(nr_fixed)} \\cdot ` +
			`${this._tooltipColVec(v_j)} = ${this._tooltipColVec(weightedV)}$` +
			`</div>`;
	}

	/**
	 * Builds tooltip HTML when hovering a row or column token label.
	 * Returns null if head data is missing.
	 */
	_buildLabelTooltipHtml(liveData, idx) {
		const { headDataArray, tokens, layerIdx, headDisplayOffset } = liveData;
		const hd = headDataArray[0];
		if (!hd) return null;

		const hLabel = `h_{${layerIdx}}`;
		const displayHeadNum = headDisplayOffset + 1;
		const h0_vec = hd.h0[idx];

		let html = '';
		html += `<div style="margin-bottom:8px; font-weight:bold; font-size:0.85rem;">`;
		html += `Token "${tokens[idx]}" (index ${idx}) — Head ${displayHeadNum}, Layer ${layerIdx + 1}`;
		html += `</div>`;

		// Input embedding
		html += `<div style="margin-bottom:6px;">`;
		html += `$\\underbrace{${this._tooltipColVec(h0_vec)}}_{\\substack{${hLabel}[${idx}] \\\\ \\text{"${tokens[idx]}"}}}$`;
		html += `</div>`;

		// Q, K, V projections
		html += this._buildProjectionHtml('Q', idx, hd.WQ, h0_vec, hd.Qi[idx], tokens[idx], hLabel, layerIdx);
		html += this._buildProjectionHtml('K', idx, hd.WK, h0_vec, hd.Ki[idx], tokens[idx], hLabel, layerIdx);
		html += this._buildProjectionHtml('V', idx, hd.WV, h0_vec, hd.Vi[idx], tokens[idx], hLabel, layerIdx);

		return html;
	}

	/**
	 * Builds a single projection equation line (Q, K, or V).
	 */
	_buildProjectionHtml(label, idx, weightMatrix, inputVec, resultVec, tokenStr, hLabel, layerIdx) {
		return `<div style="margin-bottom:6px;">` +
			`$\\underbrace{${label}_{${idx}}}_{\\text{"${tokenStr}"}} = ` +
			`\\underbrace{${this._tooltipMatrix(weightMatrix)}}_{W_${label}}^T \\cdot ` +
			`\\underbrace{${this._tooltipColVec(inputVec)}}_{\\substack{${hLabel}[${idx}] \\\\ \\text{"${tokenStr}"}}} = ` +
			`${this._tooltipColVec(resultVec)}$` +
			`</div>`;
	}

	/**
	 * Computes the raw (pre-softmax) attention scores for a single query row,
	 * applying the causal mask (−1e9 for future positions).
	 */
	_computeRawScoresRow(hd, qi, n, d_k) {
		const rawScoresRow = [];
		for (let c = 0; c < n; c++) {
			let s = this._tooltipDotVec(hd.Qi[qi], hd.Ki[c]) / Math.sqrt(d_k);
			if (c > qi) s = -1e9;
			rawScoresRow.push(s);
		}
		return rawScoresRow;
	}

	/**
	 * Computes the softmax of a row of raw scores.
	 */
	_computeSoftmaxRow(rawScoresRow) {
		const maxVal = Math.max(...rawScoresRow);
		const exps = rawScoresRow.map(v => Math.exp(v - maxVal));
		const sumExp = exps.reduce((a, b) => a + b, 0);
		return exps.map(v => v / sumExp);
	}

	/**
	 * Builds the softmax breakdown HTML: the fraction and the full result row
	 * with the current cell boxed.
	 */
	_buildSoftmaxHtml(rawScoresRow, softmaxRow, qi, ki, n, tokens) {
		let html = '';

		// Softmax fraction
		html += `<div style="margin-bottom:4px;">`;
		const softmaxNumer = `e^{${ki > qi ? '-\\infty' : rawScoresRow[ki].toFixed(nr_fixed)}}`;
		const denomParts = [];
		for (let c = 0; c < n; c++) {
			if (c > qi) {
				denomParts.push(`e^{-\\infty}`);
			} else {
				denomParts.push(`e^{${rawScoresRow[c].toFixed(nr_fixed)}}`);
			}
		}
		html += `$\\text{softmax}_{${ki}} = \\frac{${softmaxNumer}}{${denomParts.join(' + ')}}$`;
		html += `</div>`;

		// Full softmax result row
		html += `<div style="margin-bottom:2px;">`;
		html += `$= \\Big(`;
		const parts = [];
		for (let c = 0; c < n; c++) {
			const val = (softmaxRow[c] * 100).toFixed(1) + '\\%';
			if (c === ki) {
				parts.push(`\\boxed{\\underbrace{${val}}_{\\text{${tokens[c]}}}}`);
			} else {
				parts.push(`\\underbrace{${val}}_{\\text{${tokens[c]}}}`);
			}
		}
		html += parts.join(',\\;');
		html += `\\Big)$`;
		html += `</div>`;

		return html;
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
		const wrapper = svg.parentElement;
		if (wrapper) {
			wrapper.style.minHeight = wrapper.offsetHeight + 'px';
		}

		this._apvDrawSingleHeadViewSync(svg, layerIdx, headIdx, headData, tokens);

		if (wrapper) {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					wrapper.style.minHeight = '';
				});
			});
		}
	}

	_apvDrawSingleHeadMatrix(svg, layerIdx, headIdx, headData, tokens) {
		const wrapper = svg.parentElement;
		if (wrapper) {
			wrapper.style.minHeight = wrapper.offsetHeight + 'px';
		}

		this._apvDrawSingleHeadMatrixSync(svg, layerIdx, headIdx, headData, tokens);

		if (wrapper) {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					wrapper.style.minHeight = '';
				});
			});
		}
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
