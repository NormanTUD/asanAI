/* ----------------------------------------------------
 * layernorm_visualizer_v5.js
 * Enhanced: Formula application & Visual Scaling
 * ---------------------------------------------------- */

const LN_V5_THEME = {
    INPUT_CELL_BG: 'rgba(150, 150, 150, 0.1)',
    HIGHLIGHT: '#fd7e14',
    POSITIVE: '#ff4d4d', // Reddish for positive
    NEGATIVE: '#4d79ff', // Bluish for negative
    NEUTRAL: '#f8f9fa'
};

function getLayerNormV5Styles(instanceId, rows, cols) {
    return `
    [data-ln-id="${instanceId}"] {
        --cell-size: 42px;
        display: flex; flex-direction: column; align-items: center;
        width: 100%; font-family: 'Segoe UI', system-ui, sans-serif;
    }
    [data-ln-id="${instanceId}"] .grid {
        display: grid; 
        grid-template-columns: repeat(${cols}, var(--cell-size));
        gap: 6px;
    }
    [data-ln-id="${instanceId}"] .cell {
        width: var(--cell-size); height: var(--cell-size);
        border-radius: 6px; display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: bold; border: 1px solid rgba(128,128,128,0.2);
        transition: all 0.3s ease;
    }
    [data-ln-id="${instanceId}"] .input-cell { background: ${LN_V5_THEME.INPUT_CELL_BG}; }
    [data-ln-id="${instanceId}"] .scanning {
        outline: 3px solid ${LN_V5_THEME.HIGHLIGHT};
        outline-offset: -2px;
        background: rgba(253, 126, 20, 0.1) !important;
    }
    [data-ln-id="${instanceId}"] .calc-panel {
        background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 10px;
        width: 100%; max-width: 380px; margin: 15px 0; font-family: 'Fira Code', monospace;
    }
    [data-ln-id="${instanceId}"] .math-step { font-size: 12px; margin-bottom: 6px; opacity: 0.8; }
    [data-ln-id="${instanceId}"] .math-apply { 
        margin-top: 10px; padding-top: 10px; border-top: 1px solid #444;
        color: ${LN_V5_THEME.HIGHLIGHT}; font-size: 13px; font-weight: bold;
    }
    [data-ln-id="${instanceId}"] .active-val { color: white; background: #444; padding: 0 4px; border-radius: 3px; }
    `;
}

class LayerNormVisualizerV5 {
    constructor(container, options = {}) {
        this.container = container;
        this.instanceId = 'ln-v5-' + Math.random().toString(36).substr(2, 9);
        this.rows = options.gridRows || 3;
        this.cols = options.gridCols || 4;
        this.isRunning = false;
        this.init();
    }

    init() {
        const style = document.createElement('style');
        style.innerHTML = getLayerNormV5Styles(this.instanceId, this.rows, this.cols);
        document.head.appendChild(style);
        this.container.setAttribute('data-ln-id', this.instanceId);
        this.render();
        this.startLoop();
    }

    render() {
        const genCells = (type) => Array.from({length: this.rows * this.cols})
            .map(() => `<div class="cell ${type}-cell">${type === 'input' ? (Math.random() * 10).toFixed(1) : ''}</div>`).join('');

        this.container.innerHTML = `
            <div style="font-weight:bold; margin-bottom:10px; font-size:14px;">Input Activations</div>
            <div class="grid">${genCells('input')}</div>
            
            <div class="calc-panel">
                <div class="math-step" id="step-mean">μ = (Σx) / n</div>
                <div class="math-step" id="step-var">σ² = Σ(x-μ)² / n</div>
                <div class="math-apply" id="step-apply">Applying: (x - μ) / √σ²</div>
            </div>

            <div style="font-weight:bold; margin-bottom:10px; font-size:14px;">Normalized Output (μ≈0, σ≈1)</div>
            <div class="grid">${genCells('output')}</div>
        `;
        this.inputCells = this.container.querySelectorAll('.input-cell');
        this.outputCells = this.container.querySelectorAll('.output-cell');
        this.stepMean = this.container.querySelector('#step-mean');
        this.stepVar = this.container.querySelector('#step-var');
        this.stepApply = this.container.querySelector('#step-apply');
    }

    async run() {
        this.isRunning = true;
        for (let r = 0; r < this.rows; r++) {
            const indices = Array.from({length: this.cols}, (_, i) => r * this.cols + i);
            
            // Highlight current row
            indices.forEach(i => this.inputCells[i].classList.add('scanning'));
            const vals = indices.map(i => parseFloat(this.inputCells[i].textContent));
            
            // 1. Calculate Mean
            const mean = vals.reduce((a, b) => a + b) / this.cols;
            this.stepMean.innerHTML = `Step 1 (Center): <span class="active-val">μ = ${mean.toFixed(2)}</span>`;
            await new Promise(r => setTimeout(r, 800));

            // 2. Calculate Variance
            const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.cols;
            this.stepVar.innerHTML = `Step 2 (Scale): <span class="active-val">σ² = ${variance.toFixed(2)}</span>`;
            await new Promise(r => setTimeout(r, 800));

            // 3. Apply to each cell in the row
            for (let i of indices) {
                const x = parseFloat(this.inputCells[i].textContent);
                const norm = (x - mean) / Math.sqrt(variance + 1e-5);
                
                // Show specific math for this cell
                this.stepApply.innerHTML = `(${x} - ${mean.toFixed(1)}) / ${Math.sqrt(variance).toFixed(1)} = <span style="color:white">${norm.toFixed(2)}</span>`;
                
                const cell = this.outputCells[i];
                cell.textContent = norm.toFixed(2);
                
                // Color coding: Blue for negative, Red for positive, Intensity based on value
                const opacity = Math.min(Math.abs(norm), 1);
                const color = norm >= 0 ? LN_V5_THEME.POSITIVE : LN_V5_THEME.NEGATIVE;
                cell.style.backgroundColor = color;
                cell.style.color = 'white';
                cell.style.opacity = 0.3 + (opacity * 0.7);
                
                await new Promise(r => setTimeout(r, 400));
            }

            await new Promise(r => setTimeout(r, 1000));
            indices.forEach(i => this.inputCells[i].classList.remove('scanning'));
            this.stepApply.innerHTML = "Applying: (x - μ) / √σ²";
        }
        await new Promise(r => setTimeout(r, 2000));
        this.render();
        this.isRunning = false;
    }

    startLoop() {
        const loop = async () => { if (!this.isRunning) await this.run(); requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
    }
}

window.make_layernorm_visual_explanation = (sel, opt) => {
    document.querySelectorAll(sel).forEach(el => { if(!el.visualizer) el.visualizer = new LayerNormVisualizerV5(el, opt); });
};
