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

	_executeHeadRender(layerIdx, headIdx) {
		const headDiv = document.getElementById(`head-content-${this.containerId}-${layerIdx}-${headIdx}`);
		if (!headDiv) return;

		// ── If already rendered once, do a PATCH update instead of full rebuild ──
		if (headDiv.dataset.wasRenderedOnce === 'true') {
			headDiv.dataset.rendered = 'true';

			const registry = multiLayerAttentionRegistry.get(this.containerId);
			const layerData = registry.layers[layerIdx];
			const hd = layerData.headData[headIdx];
			const displayTokens = layerData.tokenStrings
				? [...layerData.tokenStrings]
				: layerData.tokens.map(t => {
					if (typeof t === 'string') return t;
					return tlab_get_top_word_only(t);
				});

			// Compute a simple hash of the weights to detect actual changes
			const weightsHash = this._apvComputeWeightsHash(hd.this_weights);
			const hashKey = `_apvLastHash_${layerIdx}_${headIdx}`;
			if (this[hashKey] === weightsHash) {
				return; // Nothing changed — skip all re-rendering
			}
			this[hashKey] = weightsHash;

			requestAnimationFrame(() => {
				// Patch SVGs in-place (no flicker)
				this._apvDrawSingleHead(layerIdx, headIdx, 'headview');
				this._apvDrawSingleHead(layerIdx, headIdx, 'matrix');

				// Update the attention web
				const webContainerId = `attn-web-container-${this.containerId}-${layerIdx}-${headIdx}`;
				const webCanvasId = `attn-web-canvas-${this.containerId}-${layerIdx}-${headIdx}`;
				const webStripId = `attn-web-strip-${this.containerId}-${layerIdx}-${headIdx}`;
				renderDynamicAttentionWeb(
					webContainerId, webCanvasId, webStripId,
					displayTokens, hd.this_weights
				);

				// Update the equations (W_Q, W_K, W_V)
				const equationsId = `apv-equations-${this.containerId}-${layerIdx}-${headIdx}`;
				const equationsContainer = document.getElementById(equationsId);
				if (equationsContainer) {
					const layerInstance = layerData.instance;
					equationsContainer.innerHTML = layerInstance.generateEquationsOnly(hd);
					render_temml();
				}
			});

			return;
		}

		if (headDiv.dataset.rendered === 'true') return;

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
<div style="margin-bottom:20px;">
	$$ \\text{Layer}_{${layerIdx + 1}},\\; \\text{Head}_{${headIdx + 1}} = \\text{Softmax} \\left( \\frac{Q_{${headIdx + 1}} K_{${headIdx + 1}}^T}{\\sqrt{d_k}} \\right) \\cdot V_{${headIdx + 1}} $$
</div>
<div id="apv-equations-${this.containerId}-${layerIdx}-${headIdx}" style="overflow-x:auto; margin-bottom:20px;">
	${layerInstance.generateEquationsOnly(hd)}
</div>

<p style="font-size:0.8rem; color:#64748b; margin-bottom:8px;">
	Hover over a word to see where it focuses its attention.
</p>
<div id="${webContainerId}" style="position:relative; height:200px; margin-bottom:20px; background:#fcfdfe; border:1px solid #e2e8f0; border-radius:8px; overflow-x:auto; overflow-y:hidden;">
	<canvas id="${webCanvasId}" style="position:absolute; top:0; left:0; pointer-events:none; z-index:5;"></canvas>
	<div id="${webStripId}" style="display:flex; justify-content:center; gap:10px; position:absolute; bottom:40px; width:max-content; min-width:100%; padding:0 20px; flex-wrap:nowrap;"></div>
</div>

<div class="apv-per-head-section" style="margin-bottom:20px; padding:16px; background:#fafbfc; border:1px solid #e2e8f0; border-radius:8px;">
	<div id="apv-headview-wrap-${this.containerId}-${layerIdx}-${headIdx}"
	    style="display:block; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow-x:auto; overflow-y:hidden; min-height:180px; margin-bottom:8px;">
	    <svg id="${apvHeadCanvasId}" style="width:100%; min-height:180px;"></svg>
	</div>

	<div style="font-size:0.75rem; color:#94a3b8; text-align:center;">
	    Hover over a token to highlight its attention connections. Line thickness = attention weight.
	</div>
</div>

<div style="margin-bottom:20px; padding:16px; background:#fafbfc; border:1px solid #e2e8f0; border-radius:8px;">
	<div id="apv-matrix-wrap-${this.containerId}-${layerIdx}-${headIdx}"
	    style="display:block; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow-x:auto; overflow-y:hidden; min-height:180px; margin-bottom:8px;">
	    <svg id="${apvMatrixCanvasId}" style="width:100%; min-height:180px;"></svg>
	</div>
</div>

<div id="attn-heatmap-${this.containerId}-${layerIdx}-${headIdx}" style="width:100%; margin-bottom:20px;"></div>`;

		headDiv.dataset.rendered = 'true';
		headDiv.dataset.wasRenderedOnce = 'true';

		// Store initial weights hash
		const hashKey = `_apvLastHash_${layerIdx}_${headIdx}`;
		this[hashKey] = this._apvComputeWeightsHash(hd.this_weights);

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

		// Always try to patch first if SVG has children, regardless of token count change
		const prevTokenCount = parseInt(svg.dataset.apvTokenCount || '0');
		const tokenCountChanged = prevTokenCount !== displayTokens.length;

		if (svg.hasChildNodes() && !tokenCountChanged) {
			// Patch: update existing DOM elements in-place — no flicker
			if (mode === 'matrix') {
				this._apvPatchMatrix(svg, layerIdx, headIdx, singleHeadData, displayTokens);
			} else {
				this._apvPatchHeadView(svg, layerIdx, headIdx, singleHeadData, displayTokens);
			}
		} else {
			// Full render needed: use DocumentFragment to avoid blank-frame flicker
			if (mode === 'matrix') {
				this._apvDrawSingleHeadMatrix(svg, layerIdx, headIdx, singleHeadData, displayTokens);
				this._apvAttachMatrixTooltip(svg, layerIdx, [singleHeadData], displayTokens, headIdx);
			} else {
				this._apvDrawSingleHeadView(svg, layerIdx, headIdx, singleHeadData, displayTokens);
				this._apvAttachSingleHeadHoverEvents(svg, layerIdx, headIdx, singleHeadData, displayTokens);
			}
			svg.dataset.apvTokenCount = displayTokens.length;
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

		const self = this;

		// Helper: format a vector as a column pmatrix
		const toColVec = (arr) => {
			return `\\begin{pmatrix} ${arr.map(v => typeof v === 'number' ? v.toFixed(nr_fixed) : v).join(' \\\\ ')} \\end{pmatrix}`;
		};

		// Helper: format a matrix as pmatrix
		const toMatrix = (mat) => {
			return `\\begin{pmatrix} ${mat.map(row => row.map(v => v.toFixed(nr_fixed)).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
		};

		// Helper: format a row vector as a row pmatrix
		const toRowVec = (arr) => {
			return `\\begin{pmatrix} ${arr.map(v => typeof v === 'number' ? v.toFixed(nr_fixed) : v).join(' & ')} \\end{pmatrix}`;
		};

		// Helper: compute dot product of two arrays
		const dotVec = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

		const positionTooltip = (e) => {
			tooltip.style.display = 'block';
			// Position: try right of cursor, but clamp to viewport
			const tw = tooltip.offsetWidth;
			const th = tooltip.offsetHeight;
			let left = e.clientX + 16;
			let top = e.clientY - 20;
			if (left + tw > window.innerWidth - 10) left = e.clientX - tw - 16;
			if (top + th > window.innerHeight - 10) top = window.innerHeight - th - 10;
			if (top < 10) top = 10;
			tooltip.style.left = left + 'px';
			tooltip.style.top = top + 'px';
		};

		svg.addEventListener('mousemove', (e) => {
			// ── Case 1: Hovering a grid cell (rect) ──
			const rect = e.target.closest('rect[data-apv-qi]');
			if (rect) {
				const hIdx = parseInt(rect.getAttribute('data-apv-head'));
				const qi = parseInt(rect.getAttribute('data-apv-qi'));
				const ki = parseInt(rect.getAttribute('data-apv-ki'));

				if (!headDataArray[hIdx]) {
					tooltip.style.display = 'none';
					return;
				}

				const hd = headDataArray[hIdx];
				const w = hd.this_weights[qi][ki];
				const displayHeadNum = hIdx + headDisplayOffset + 1;
				const dk = hd.Qi[0].length;
				const dk_int = Math.round(dk);

				// Get vectors
				const q_i = hd.Qi[qi];   // query vector for token qi
				const k_j = hd.Ki[ki];   // key vector for token ki
				const h0_qi = hd.h0[qi]; // input embedding for query token
				const h0_kj = hd.h0[ki]; // input embedding for key token

				// Raw score (before softmax)
				const rawScore = dotVec(q_i, k_j) / Math.sqrt(dk);

				// All raw scores for this row (for softmax display)
				const n = tokens.length;
				const rawScoresRow = [];
				for (let c = 0; c < n; c++) {
					let s = dotVec(hd.Qi[qi], hd.Ki[c]) / Math.sqrt(dk);
					// Apply causal mask
					if (c > qi) s = -1e9;
					rawScoresRow.push(s);
				}

				// Softmax computation
				const maxVal = Math.max(...rawScoresRow);
				const exps = rawScoresRow.map(v => Math.exp(v - maxVal));
				const sumExp = exps.reduce((a, b) => a + b, 0);
				const softmaxRow = exps.map(v => v / sumExp);

				// ── Build HTML ──
				let html = '';

				// Line 1: Header
				html += `<div style="margin-bottom:8px; font-weight:bold; font-size:0.85rem;">`;
				html += `Head ${displayHeadNum}: "${tokens[qi]}" → "${tokens[ki]}" = ${(w * 100).toFixed(1)}%`;
				html += `</div>`;

				// Row 1: Abstract equation
				html += `<div style="margin-bottom:6px;">`;
				html += `$\\text{score}(Q_{${qi}}, K_{${ki}}) = \\frac{Q_{${qi}}^T \\cdot K_{${ki}}}{\\sqrt{d_k}} = \\frac{Q_{${qi}}^T \\cdot K_{${ki}}}{\\sqrt{${dk_int}}} = ${rawScore.toFixed(nr_fixed)}$`;
				html += `</div>`;

				// Row 2: Full numerical equation with underbraces
				html += `<div style="margin-bottom:6px;">`;
				html += `$Q_{${qi}} = \\underbrace{${toMatrix(hd.WQ)}}_{W_Q}^T \\cdot \\underbrace{${toColVec(h0_qi)}}_{h_0[${qi}]} = ${toColVec(q_i)}$`;
				html += `</div>`;

				html += `<div style="margin-bottom:6px;">`;
				html += `$K_{${ki}} = \\underbrace{${toMatrix(hd.WK)}}_{W_K}^T \\cdot \\underbrace{${toColVec(h0_kj)}}_{h_0[${ki}]} = ${toColVec(k_j)}$`;
				html += `</div>`;

				html += `<div style="margin-bottom:6px;">`;
				html += `$\\frac{\\underbrace{${toRowVec(q_i)}}_{Q_{${qi}}^T} \\cdot \\underbrace{${toColVec(k_j)}}_{K_{${ki}}}}{\\sqrt{${dk_int}}} = \\frac{${dotVec(q_i, k_j).toFixed(nr_fixed)}}{${Math.sqrt(dk).toFixed(nr_fixed)}} = ${rawScore.toFixed(nr_fixed)}$`;
				html += `</div>`;

				// Row 3: Softmax over the full row, highlighting current cell
				html += `<div style="margin-bottom:4px;">`;
				// Build the softmax equation showing all values
				let softmaxNumer = '';
				let softmaxDenom = '';
				const maskedScores = rawScoresRow.map((s, c) => c > qi ? '-\\infty' : s.toFixed(nr_fixed));

				// Numerator: e^{score_{qi,ki}}
				softmaxNumer = `e^{${ki > qi ? '-\\infty' : rawScoresRow[ki].toFixed(nr_fixed)}}`;

				// Denominator: sum of e^{score_{qi,c}} for all c
				let denomParts = [];
				for (let c = 0; c < n; c++) {
					if (c > qi) {
						denomParts.push(`e^{-\\infty}`);
					} else {
						denomParts.push(`e^{${rawScoresRow[c].toFixed(nr_fixed)}}`);
					}
				}
				softmaxDenom = denomParts.join(' + ');

				html += `$\\text{softmax}_{${ki}} = \\frac{${softmaxNumer}}{${softmaxDenom}}$`;
				html += `</div>`;

				// Show the full softmax result row with the current cell highlighted
				html += `<div style="margin-bottom:2px;">`;
				html += `$= \\Big(`;
				let parts = [];
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

				tooltip.innerHTML = html;
				render_temml();
				positionTooltip(e);
				return;
			}

			// ── Case 2: Hovering a border word (row or column label) ──
			const textEl = e.target.closest('text[data-apv-token-side]');
			if (textEl) {
				const side = textEl.getAttribute('data-apv-token-side');
				const idx = parseInt(textEl.getAttribute('data-apv-token-idx'));

				// Use head index 0 from headDataArray (single-head context: headDataArray has 1 element)
				const hd = headDataArray[0];
				if (!hd) {
					tooltip.style.display = 'none';
					return;
				}

				const h0_vec = hd.h0[idx];
				const q_vec = hd.Qi[idx];
				const k_vec = hd.Ki[idx];
				const v_vec = hd.Vi[idx];
				const displayHeadNum = headDisplayOffset + 1;

				let html = '';
				html += `<div style="margin-bottom:8px; font-weight:bold; font-size:0.85rem;">`;
				html += `Token "${tokens[idx]}" (index ${idx}) — Head ${displayHeadNum}`;
				html += `</div>`;

				// Input embedding
				html += `<div style="margin-bottom:6px;">`;
				html += `$\\underbrace{${toColVec(h0_vec)}}_{h_0[${idx}]}$`;
				html += `</div>`;

				// Q projection
				html += `<div style="margin-bottom:6px;">`;
				html += `$\\underbrace{Q_{${idx}}}_{W_Q^T \\cdot h_0[${idx}]} = \\underbrace{${toMatrix(hd.WQ)}}_{W_Q}^T \\cdot \\underbrace{${toColVec(h0_vec)}}_{h_0[${idx}]} = ${toColVec(q_vec)}$`;
				html += `</div>`;

				// K projection
				html += `<div style="margin-bottom:6px;">`;
				html += `$\\underbrace{K_{${idx}}}_{W_K^T \\cdot h_0[${idx}]} = \\underbrace{${toMatrix(hd.WK)}}_{W_K}^T \\cdot \\underbrace{${toColVec(h0_vec)}}_{h_0[${idx}]} = ${toColVec(k_vec)}$`;
				html += `</div>`;

				// V projection
				html += `<div style="margin-bottom:6px;">`;
				html += `$\\underbrace{V_{${idx}}}_{W_V^T \\cdot h_0[${idx}]} = \\underbrace{${toMatrix(hd.WV)}}_{W_V}^T \\cdot \\underbrace{${toColVec(h0_vec)}}_{h_0[${idx}]} = ${toColVec(v_vec)}$`;
				html += `</div>`;

				tooltip.innerHTML = html;
				render_temml();
				positionTooltip(e);
				return;
			}

			// ── Case 3: Not hovering anything relevant ──
			tooltip.style.display = 'none';
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

		// Build into a DocumentFragment to avoid blank-frame flicker
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

		// Atomic swap: replaceChildren removes all old children and appends the fragment in one
		// synchronous operation — the browser won't paint a blank frame between removal and insertion
		svg.replaceChildren(frag);
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

		// Row labels (query side) — with data attributes for hover
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

		// Column labels (key side) — with data attributes for hover
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

		svg.replaceChildren(frag);
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
