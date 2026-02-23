/**
 * AttentionPathVisualizer
 *
 * A callable, per-layer attention visualizer inspired by BertViz's head view.
 * For each layer, it renders all attention heads side-by-side with interactive
 * bezier arcs connecting tokens, weighted by attention scores.
 *
 * Usage:
 *   const viz = new AttentionPathVisualizer({ containerId: 'my-div' });
 *   viz.renderLayer(layerIndex, headDataArray, tokenStrings);
 *
 * Or as a one-liner:
 *   AttentionPathVisualizer.visualize('my-div', layerIndex, headDataArray, tokenStrings);
 *
 * Integration with existing AttentionEngine:
 *   After engine.forward(), pass the returned headData directly.
 *
 * Dependencies:
 *   - Reads from window.persistentEmbeddingSpace for token resolution
 *   - Uses tlab_get_top_word_only() for embedding→word mapping
 *   - Compatible with the multiLayerAttentionRegistry from transformerlab.js
 */
class AttentionPathVisualizer {

    // ─── Color palette for heads (BertViz-style) ───
    static HEAD_COLORS = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
        '#f97316', '#6366f1', '#14b8a6', '#e11d48'
    ];

    /**
     * @param {Object} config
     * @param {string} config.containerId - DOM element ID to render into
     * @param {Object} [config.options]   - Optional display settings
     * @param {number} [config.options.arcHeight=120]       - Max bezier arc height in px
     * @param {number} [config.options.minOpacity=0.02]     - Minimum attention weight to draw
     * @param {number} [config.options.tokenSpacing=80]     - Horizontal spacing between tokens
     * @param {number} [config.options.columnGap=30]        - Gap between left/right token columns
     * @param {boolean} [config.options.showHeadSelector=true] - Show head toggle checkboxes
     * @param {string} [config.options.mode='headview']     - 'headview' | 'modelview' | 'matrix'
     */
    constructor(config) {
        this.containerId = config.containerId;
        this.container = document.getElementById(config.containerId);
        this.options = Object.assign({
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
        }, config.options || {});

        this._activeHeads = new Set();  // Which heads are currently visible
        this._hoveredToken = null;      // { side: 'left'|'right', index: number }
        this._currentData = null;       // Cached for re-renders
    }

    // ═══════════════════════════════════════════════════
    //  PUBLIC API
    // ═══════════════════════════════════════════════════

    /**
     * Render a single layer's attention patterns.
     *
     * @param {number} layerIndex         - Zero-based layer index (for labeling)
     * @param {Array}  headDataArray      - Array of head objects from AttentionEngine.forward()
     *   Each element: { headIdx, this_weights (attention matrix), Qi, Ki, Vi, context, ... }
     * @param {string[]} tokenStrings     - Human-readable token labels
     */
	renderLayer(layerIndex, headDataArray, tokenStrings) {
		if (!this.container) {
			console.error(`AttentionPathVisualizer: container '${this.containerId}' not found`);
			return;
		}

		const displayTokens = this._resolveTokenLabels(tokenStrings, headDataArray);

		this._currentData = {
			layerIndex,
			headDataArray,
			displayTokens
		};

		// ── Restore persisted state, or default to all heads on + headview ──
		const saved = this._loadState();

		this._activeHeads.clear();

		if (saved && Array.isArray(saved.activeHeads)) {
			// Validate saved heads against actual head count
			const validHeads = saved.activeHeads.filter(h => h >= 0 && h < headDataArray.length);
			if (validHeads.length > 0) {
				validHeads.forEach(h => this._activeHeads.add(h));
			} else {
				// Saved state had heads that no longer exist — default to head 0
				this._activeHeads.add(0);
			}
		} else {
			// No saved state — default: all heads active
			headDataArray.forEach((_, i) => this._activeHeads.add(i));
		}

		if (saved && saved.mode) {
			this.options.mode = saved.mode;
		}

		this._buildUI();
	}

    /**
     * Render all layers at once (model view).
     * Reads from the multiLayerAttentionRegistry if available.
     *
     * @param {string} containerId
     * @param {Array}  allLayersData - Array of { headData, tokens, tokenStrings }
     */
    renderAllLayers(allLayersData) {
        if (!this.container) return;

        let html = `<div class="apv-model-view" style="
            font-family: 'Inter', sans-serif;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
        ">`;

        // Layer tabs
        html += `<div style="display:flex; background:#f1f5f9; border-bottom:2px solid #3b82f6; flex-wrap:wrap;">`;
        allLayersData.forEach((_, l) => {
            html += `<button class="apv-layer-tab" id="apv-ltab-${this.containerId}-${l}"
                onclick="window.__apv_instances['${this.containerId}'].switchLayer(${l})"
                style="padding:10px 18px; border:none; cursor:pointer;
                background:${l === 0 ? '#fff' : '#dbeafe'}; font-weight:${l === 0 ? 'bold' : 'normal'};
                border-right:1px solid #93c5fd; font-size:0.9rem;">
                Layer ${l + 1}
            </button>`;
        });
        html += `</div>`;

        // Layer content panels
        allLayersData.forEach((layerData, l) => {
            html += `<div id="apv-lpanel-${this.containerId}-${l}"
                style="display:${l === 0 ? 'block' : 'none'}; padding:0;">
            </div>`;
        });

        html += `</div>`;
        this.container.innerHTML = html;

        // Store instance globally for onclick callbacks
        if (!window.__apv_instances) window.__apv_instances = {};
        window.__apv_instances[this.containerId] = this;

        this._allLayersData = allLayersData;

        // Render first layer
        this._renderLayerPanel(0);

	    // ── Restore persisted layer, or default to layer 0 ──
	    const saved = this._loadState();
	    let startLayer = 0;

	    if (saved && typeof saved.activeLayer === 'number' &&
		    saved.activeLayer >= 0 && saved.activeLayer < allLayersData.length) {
		    startLayer = saved.activeLayer;
	    }

	    this._activeLayer = startLayer;
	    this.switchLayer(startLayer);

    }

    /**
     * Switch to a different layer tab (called from onclick).
     */
	switchLayer(layerIdx) {
		if (!this._allLayersData) return;

		this._activeLayer = layerIdx;  // ← track it

		this._allLayersData.forEach((_, l) => {
			const panel = document.getElementById(`apv-lpanel-${this.containerId}-${l}`);
			const tab = document.getElementById(`apv-ltab-${this.containerId}-${l}`);
			if (panel) panel.style.display = l === layerIdx ? 'block' : 'none';
			if (tab) {
				tab.style.background = l === layerIdx ? '#fff' : '#dbeafe';
				tab.style.fontWeight = l === layerIdx ? 'bold' : 'normal';
			}
		});

		this._renderLayerPanel(layerIdx);
		this._saveState();  // ← persist
	}

    // ═══════════════════════════════════════════════════
    //  STATIC CONVENIENCE METHOD
    // ═══════════════════════════════════════════════════

    /**
     * One-liner: create a visualizer and render a single layer.
     *
     * @param {string}   containerId
     * @param {number}   layerIndex
     * @param {Array}    headDataArray
     * @param {string[]} tokenStrings
     * @param {Object}   [options]
     * @returns {AttentionPathVisualizer}
     */
    static visualize(containerId, layerIndex, headDataArray, tokenStrings, options = {}) {
        const viz = new AttentionPathVisualizer({ containerId, options });
        viz.renderLayer(layerIndex, headDataArray, tokenStrings);
        return viz;
    }

    /**
     * Convenience: pull data from the existing multiLayerAttentionRegistry
     * and render all layers.
     *
     * @param {string} sourceContainerId - The containerId used by AttentionEngine (e.g. 'mha-calculation-details')
     * @param {string} targetContainerId - Where to render the path visualizer
     * @param {Object} [options]
     * @returns {AttentionPathVisualizer|null}
     */
    static fromRegistry(sourceContainerId, targetContainerId, options = {}) {
        const registry = multiLayerAttentionRegistry.get(sourceContainerId);
        if (!registry || !registry.layers || registry.layers.length === 0) {
            console.warn('AttentionPathVisualizer.fromRegistry: No data in registry for', sourceContainerId);
            return null;
        }

        const viz = new AttentionPathVisualizer({ containerId: targetContainerId, options });
        viz.renderAllLayers(registry.layers);
        return viz;
    }

    // ═══════════════════════════════════════════════════
    //  PRIVATE: UI CONSTRUCTION
    // ═══════════════════════════════════════════════════

	_buildUI() {
		const { layerIndex, headDataArray, displayTokens } = this._currentData;
		const numHeads = headDataArray.length;

		// Determine active mode for button highlighting
		const isHead = this.options.mode === 'headview';
		const isMatrix = this.options.mode === 'matrix';

		let html = `<div class="apv-root" style="
	font-family: 'Inter', sans-serif;
	background: #fafbfc;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 16px;
	overflow: hidden;
    ">`;

		// Title + mode buttons
		html += `<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
	<h3 style="margin:0; color:#1e293b; font-size:1.05rem;">
	    🔍 Attention Path Visualizer — Layer ${layerIndex + 1}
	</h3>
	<div style="display:flex; gap:8px;">
	    <button onclick="window.__apv_instances['${this.containerId}'].setMode('headview')"
		class="apv-mode-btn" style="padding:4px 10px; border-radius:6px; border:1px solid #cbd5e1;
		cursor:pointer; font-size:0.8rem;
		background:${isHead ? '#3b82f6' : '#fff'};
		color:${isHead ? '#fff' : '#334155'};">Head View</button>
	    <button onclick="window.__apv_instances['${this.containerId}'].setMode('matrix')"
		class="apv-mode-btn" style="padding:4px 10px; border-radius:6px; border:1px solid #cbd5e1;
		cursor:pointer; font-size:0.8rem;
		background:${isMatrix ? '#3b82f6' : '#fff'};
		color:${isMatrix ? '#fff' : '#334155'};">Matrix View</button>
	</div>
    </div>`;

		// Head selector checkboxes
		if (this.options.showHeadSelector) {
			html += `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; align-items:center;">
	    <span style="font-size:0.8rem; color:#64748b; font-weight:600;">Heads:</span>`;
			for (let h = 0; h < numHeads; h++) {
				const color = AttentionPathVisualizer.HEAD_COLORS[h % AttentionPathVisualizer.HEAD_COLORS.length];
				const isChecked = this._activeHeads.has(h);
				html += `<label style="display:flex; align-items:center; gap:4px; cursor:pointer; font-size:0.82rem;">
		<input type="checkbox" ${isChecked ? 'checked' : ''}
		    onchange="window.__apv_instances['${this.containerId}'].toggleHead(${h}, this.checked)"
		    style="accent-color:${color};">
		<span style="color:${color}; font-weight:600;">Head ${h + 1}</span>
	    </label>`;
			}
			html += `</div>`;
		}

		// SVG canvas for the attention arcs
		const canvasId = `apv-canvas-${this.containerId}`;
		html += `<div id="apv-viewport-${this.containerId}" style="
	position:relative; overflow-x:auto; overflow-y:hidden;
	background:#fff; border:1px solid #e2e8f0; border-radius:8px;
	min-height:200px;
    ">
	<svg id="${canvasId}" style="width:100%; min-height:200px;"></svg>
    </div>`;

		// Legend
		html += `<div style="margin-top:10px; font-size:0.75rem; color:#94a3b8; text-align:center;">
	Hover over a token to highlight its attention connections. Line thickness = attention weight.
    </div>`;

		html += `</div>`;

		this.container.innerHTML = html;

		// Store instance for callbacks
		if (!window.__apv_instances) window.__apv_instances = {};
		window.__apv_instances[this.containerId] = this;

		// Draw
		requestAnimationFrame(() => this._draw());
	}

    /**
     * Render a layer panel inside the model-view tabs.
     */
    _renderLayerPanel(layerIdx) {
        const panelId = `apv-lpanel-${this.containerId}-${layerIdx}`;
        const panel = document.getElementById(panelId);
        if (!panel) return;

        // Only render once
        if (panel.dataset.rendered === 'true') return;

        const layerData = this._allLayersData[layerIdx];
        const displayTokens = this._resolveTokenLabels(layerData.tokenStrings, layerData.headData);

        // Create a sub-container
        const subId = `apv-sub-${this.containerId}-${layerIdx}`;
        panel.innerHTML = `<div id="${subId}"></div>`;

        const subViz = new AttentionPathVisualizer({
            containerId: subId,
            options: this.options
        });
        subViz.renderLayer(layerIdx, layerData.headData, displayTokens);

        panel.dataset.rendered = 'true';
    }

    // ═══════════════════════════════════════════════════
    //  PRIVATE: SVG DRAWING ENGINE
    // ═══════════════════════════════════════════════════

    _draw() {
        const { headDataArray, displayTokens, layerIndex } = this._currentData;
        const canvasId = `apv-canvas-${this.containerId}`;
        const svg = document.getElementById(canvasId);
        if (!svg) return;

        const mode = this.options.mode;

        if (mode === 'matrix') {
            this._drawMatrixView(svg, headDataArray, displayTokens);
        } else {
            this._drawHeadView(svg, headDataArray, displayTokens);
        }
    }

    /**
     * BertViz-style "Head View": Left column (query tokens) → Right column (key tokens)
     * with colored bezier arcs for each head.
     */
    _drawHeadView(svg, headDataArray, tokens) {
        const n = tokens.length;
        const {
            rowHeight, leftColumnX, rightColumnX, topPadding, minOpacity
        } = this.options;

        const svgHeight = topPadding + n * rowHeight + 40;
        const svgWidth = rightColumnX + 120;

        svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
        svg.style.minHeight = svgHeight + 'px';

        let svgContent = '';

        // ── Column labels ──
        svgContent += `<text x="${leftColumnX}" y="18" font-size="11" fill="#64748b"
            font-weight="600" text-anchor="middle">Query (attending)</text>`;
        svgContent += `<text x="${rightColumnX}" y="18" font-size="11" fill="#64748b"
            font-weight="600" text-anchor="middle">Key (attended to)</text>`;

        // ── Token labels (left = queries, right = keys) ──
        for (let i = 0; i < n; i++) {
            const y = topPadding + i * rowHeight;
            const isHoveredLeft = this._hoveredToken &&
                this._hoveredToken.side === 'left' && this._hoveredToken.index === i;
            const isHoveredRight = this._hoveredToken &&
                this._hoveredToken.side === 'right' && this._hoveredToken.index === i;

            // Left token (query)
            svgContent += `<text x="${leftColumnX}" y="${y + 4}"
                font-size="12" fill="${isHoveredLeft ? '#1e40af' : '#334155'}"
                font-weight="${isHoveredLeft ? '700' : '500'}" text-anchor="end"
                style="cursor:pointer;"
                data-apv-side="left" data-apv-idx="${i}"
                >${this._escapeHtml(tokens[i])}</text>`;

            // Right token (key)
            svgContent += `<text x="${rightColumnX}" y="${y + 4}"
                font-size="12" fill="${isHoveredRight ? '#1e40af' : '#334155'}"
                font-weight="${isHoveredRight ? '700' : '500'}" text-anchor="start"
                style="cursor:pointer;"
                data-apv-side="right" data-apv-idx="${i}"
                >${this._escapeHtml(tokens[i])}</text>`;
        }

        // ── Attention arcs (one color per head) ──
        // In _drawHeadView, REPLACE the arc-drawing section with this simplified version:
// (Remove all the if(this._hoveredToken) branching from the path generation)

	    headDataArray.forEach((head, hIdx) => {
		    if (!this._activeHeads.has(hIdx)) return;

		    const color = AttentionPathVisualizer.HEAD_COLORS[hIdx % AttentionPathVisualizer.HEAD_COLORS.length];
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

				    // Render with natural weight — hover updates are handled
				    // by _updateHoverState() which modifies attributes in-place
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

        // Attach hover events
        this._attachHoverEvents(svg);
    }

    /**
     * Matrix View: Renders a compact heatmap grid for each active head.
     */
	_drawMatrixView(svg, headDataArray, tokens) {
		const n = tokens.length;
		const cellSize = Math.max(18, Math.min(40, 300 / n));
		const matrixSize = n * cellSize;
		const padding = 80;

		const activeHeads = [...this._activeHeads].sort((a, b) => a - b);
		const totalWidth = matrixSize + padding;
		const totalHeight = activeHeads.length * (matrixSize + padding) + padding;

		svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
		svg.style.minHeight = totalHeight + 'px';

		let svgContent = '';

		activeHeads.forEach((hIdx, row) => {
			const offsetX = padding / 2;
			const offsetY = padding / 2 + row * (matrixSize + padding);
			const color = AttentionPathVisualizer.HEAD_COLORS[hIdx % AttentionPathVisualizer.HEAD_COLORS.length];
			const weights = headDataArray[hIdx].this_weights;

			// Head label
			svgContent += `<text x="${offsetX + matrixSize / 2}" y="${offsetY - 30}"
	    font-size="12" fill="${color}" font-weight="700" text-anchor="middle"
	    >Head ${hIdx + 1}</text>`;

			// Row labels (queries)
			for (let i = 0; i < n; i++) {
				svgContent += `<text x="${offsetX - 4}" y="${offsetY + i * cellSize + cellSize / 2 + 4}"
		font-size="9" fill="#64748b" text-anchor="end"
		>${this._escapeHtml(tokens[i])}</text>`;
			}

			// Column labels (keys) — rotated
			for (let j = 0; j < n; j++) {
				svgContent += `<text
		x="${offsetX + j * cellSize + cellSize / 2}"
		y="${offsetY - 6}"
		font-size="9" fill="#64748b" text-anchor="start"
		transform="rotate(-45, ${offsetX + j * cellSize + cellSize / 2}, ${offsetY - 6})"
		>${this._escapeHtml(tokens[j])}</text>`;
			}

			// Cells
			for (let qi = 0; qi < n; qi++) {
				for (let ki = 0; ki < n; ki++) {
					const w = weights[qi][ki];
					const x = offsetX + ki * cellSize;
					const y = offsetY + qi * cellSize;

					// Color intensity
					const alpha = Math.max(0.05, w);

					svgContent += `<rect x="${x}" y="${y}"
		    width="${cellSize}" height="${cellSize}"
		    fill="${color}" fill-opacity="${alpha.toFixed(3)}"
		    stroke="#e2e8f0" stroke-width="0.5"
		    data-apv-head="${hIdx}" data-apv-qi="${qi}" data-apv-ki="${ki}"
		    style="cursor:crosshair;"
		/>`;

					// Show value text in cells if they're large enough
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

		// Tooltip on hover for matrix cells
		this._attachMatrixTooltip(svg, headDataArray, tokens);
	}


    // ═══════════════════════════════════════════════════
    //  PRIVATE: EVENT HANDLING
    // ═══════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════
//  REPLACE these methods in AttentionPathVisualizer
// ═══════════════════════════════════════════════════

	_attachHoverEvents(svg) {
		const self = this;
		let currentHover = null; // Track locally to avoid redundant updates

		svg.addEventListener('mouseover', (e) => {
			const el = e.target.closest('[data-apv-side]');
			if (el) {
				const side = el.getAttribute('data-apv-side');
				const index = parseInt(el.getAttribute('data-apv-idx'));
				const key = `${side}-${index}`;

				// Only update if the hover target actually changed
				if (currentHover === key) return;
				currentHover = key;

				self._hoveredToken = { side, index };
				self._updateHoverState(svg); // ← Non-destructive update
			}
		});

		svg.addEventListener('mouseout', (e) => {
			const el = e.target.closest('[data-apv-side]');
			if (el) {
				// Check if we're moving to another apv element (not leaving entirely)
				const related = e.relatedTarget?.closest?.('[data-apv-side]');
				if (related) return; // Still inside the token area, don't clear

				currentHover = null;
				self._hoveredToken = null;
				self._updateHoverState(svg); // ← Non-destructive update
			}
		});
	}

	/**
	 * NON-DESTRUCTIVE hover update.
	 * Instead of rebuilding the entire SVG (which destroys the element
	 * under the cursor and causes an infinite mouseover/mouseout loop),
	 * this method updates stroke-opacity and stroke-width on existing
	 * <path> elements and font-weight on existing <text> elements.
	 */
	_updateHoverState(svg) {
		const { headDataArray, displayTokens } = this._currentData;
		const { minOpacity } = this.options;
		const hovered = this._hoveredToken;

		// ── Update all attention arc paths ──
		const paths = svg.querySelectorAll('path[data-apv-qi]');
		paths.forEach(path => {
			const hIdx = parseInt(path.getAttribute('data-apv-head'));
			const qi = parseInt(path.getAttribute('data-apv-qi'));
			const ki = parseInt(path.getAttribute('data-apv-ki'));

			if (!this._activeHeads.has(hIdx)) {
				path.setAttribute('stroke-opacity', '0');
				return;
			}

			const w = headDataArray[hIdx].this_weights[qi][ki];

			if (!hovered) {
				// No hover: show natural weights
				path.setAttribute('stroke-opacity', w.toFixed(3));
				path.setAttribute('stroke-width', (1 + w * 5).toFixed(1));
			} else {
				const { side, index } = hovered;
				if ((side === 'left' && index === qi) || (side === 'right' && index === ki)) {
// This arc is connected to the hovered token — highlight it
                const opacity = 0.3 + w * 0.7;
                const strokeWidth = 2 + w * 8;
                path.setAttribute('stroke-opacity', opacity.toFixed(3));
                path.setAttribute('stroke-width', strokeWidth.toFixed(1));
            } else {
                // Dim everything else
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
    // Remove old labels
    svg.querySelectorAll('.apv-weight-label').forEach(el => el.remove());

    // Add new labels for hovered connections
    if (hovered) {
        const { rowHeight, leftColumnX, rightColumnX, topPadding } = this.options;

        headDataArray.forEach((head, hIdx) => {
            if (!this._activeHeads.has(hIdx)) return;
            const color = AttentionPathVisualizer.HEAD_COLORS[hIdx % AttentionPathVisualizer.HEAD_COLORS.length];
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

                    const y1 = topPadding + qi * rowHeight;
                    const y2 = topPadding + ki * rowHeight;
                    const cpx = (leftColumnX + 6 + rightColumnX - 6) / 2;
                    const labelY = (y1 + y2) / 2;

                    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    label.setAttribute('x', cpx);
                    label.setAttribute('y', labelY - 4);
                    label.setAttribute('font-size', '9');
                    label.setAttribute('fill', color);
                    label.setAttribute('font-weight', '700');
                    label.setAttribute('text-anchor', 'middle');
                    label.setAttribute('class', 'apv-weight-label');
                    label.textContent = `${(w * 100).toFixed(0)}%`;
                    svg.appendChild(label);
                }
            }
        });
    }
}

    _attachMatrixTooltip(svg, headDataArray, tokens) {
        // Create or reuse a tooltip div
        let tooltip = document.getElementById(`apv-tooltip-${this.containerId}`);
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = `apv-tooltip-${this.containerId}`;
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
                const w = headDataArray[hIdx].this_weights[qi][ki];

                tooltip.innerHTML = `<b>Head ${hIdx + 1}</b>: "${tokens[qi]}" → "${tokens[ki]}" = <b>${(w * 100).toFixed(1)}%</b>`;
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

    // ═══════════════════════════════════════════════════
    //  PRIVATE: CALLBACKS (from UI buttons/checkboxes)
    // ═══════════════════════════════════════════════════

	toggleHead(headIdx, isActive) {
		if (isActive) {
			this._activeHeads.add(headIdx);
		} else {
			this._activeHeads.delete(headIdx);
		}
		this._draw();
		this._saveState();  // ← persist
	}

	setMode(mode) {
		this.options.mode = mode;
		this._buildUI();
		this._saveState();  // ← persist
	}

    // ═══════════════════════════════════════════════════
    //  PRIVATE: UTILITIES
    // ═══════════════════════════════════════════════════

    /**
     * Resolve token labels from various input formats.
     * Handles: string arrays, embedding vectors, or mixed.
     */
    _resolveTokenLabels(tokenStrings, headDataArray) {
        if (tokenStrings && Array.isArray(tokenStrings) && typeof tokenStrings[0] === 'string') {
            return [...tokenStrings];
        }

        // Fallback: try to resolve from headData's h0 via embedding lookup
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

    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

// ═══════════════════════════════════════════════════
//  PRIVATE: STATE PERSISTENCE
// ═══════════════════════════════════════════════════

	_getStorageKey() {
		return `apv-state-${this.containerId}`;
	}

	_saveState(extra = {}) {
		try {
			const state = {
				mode: this.options.mode,
				activeHeads: [...this._activeHeads],
				activeLayer: this._activeLayer ?? 0,
				...extra
			};
			localStorage.setItem(this._getStorageKey(), JSON.stringify(state));
		} catch (e) {
			// localStorage might be full or unavailable — fail silently
		}
	}

	_loadState() {
		try {
			const raw = localStorage.getItem(this._getStorageKey());
			if (raw) return JSON.parse(raw);
		} catch (e) {
			// Corrupted or unavailable — fall through to defaults
		}
		return null;
	}
}
