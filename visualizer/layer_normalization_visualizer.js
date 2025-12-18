/* ----------------------------------------------------
 * layernorm_visualizer_v5.js
 * Multi-color Input & Slower Animation
 * ---------------------------------------------------- */

const LN_V5_THEME = {
    HIGHLIGHT: '#6c5ce7', 
    POSITIVE: '#FF6B6B',  
    NEGATIVE: '#45B7D1',  
    // Palette für die Input-Zellen (analog zum Flatten-Visualizer)
    INPUT_PALETTE: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F06292'],
    BORDER: 'rgba(128, 128, 128, 0.2)'
};

function getLayerNormV5Styles(instanceId, rows, cols) {
    return `
    [data-ln-id="${instanceId}"] {
        --cell-size: 42px;
        display: flex; flex-direction: column; align-items: center;
        width: 100%; font-family: inherit;
        padding: 20px;
    }
    [data-ln-id="${instanceId}"] .grid {
        display: grid; 
        grid-template-columns: repeat(${cols}, var(--cell-size));
        gap: 8px; padding: 12px;
        border-radius: 10px;
        border: 1px solid ${LN_V5_THEME.BORDER};
        background: rgba(128, 128, 128, 0.05);
    }
    [data-ln-id="${instanceId}"] .cell {
        width: var(--cell-size); height: var(--cell-size);
        border-radius: 6px; display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: bold; color: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.15);
        transition: all 0.4s ease;
    }
    [data-ln-id="${instanceId}"] .scanning {
        outline: 3px solid ${LN_V5_THEME.HIGHLIGHT};
        outline-offset: 2px;
        transform: scale(1.05);
        z-index: 10;
    }
    [data-ln-id="${instanceId}"] .calc-panel {
        margin: 20px 0; padding: 15px; border-radius: 10px;
        width: 100%; max-width: 380px;
        border: 1px solid ${LN_V5_THEME.BORDER};
        font-family: 'Fira Code', monospace;
    }
    [data-ln-id="${instanceId}"] .math-step { font-size: 12px; margin-bottom: 8px; opacity: 0.8; }
    [data-ln-id="${instanceId}"] .math-apply { 
        margin-top: 10px; padding-top: 10px; border-top: 1px solid ${LN_V5_THEME.BORDER};
        color: ${LN_V5_THEME.HIGHLIGHT}; font-size: 13px; font-weight: bold;
    }
    [data-ln-id="${instanceId}"] .active-val { 
        color: white; background: ${LN_V5_THEME.HIGHLIGHT}; 
        padding: 2px 6px; border-radius: 4px; 
    }
    [data-ln-id="${instanceId}"] .label {
        font-weight: bold; margin-bottom: 10px; font-size: 12px; 
        text-transform: uppercase; letter-spacing: 1px; opacity: 0.7;
    }
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
        const genInputCells = () => Array.from({length: this.rows * this.cols})
            .map((_, i) => {
                const color = LN_V5_THEME.INPUT_PALETTE[i % LN_V5_THEME.INPUT_PALETTE.length];
                return `<div class="cell input-cell" style="background-color: ${color}">${(Math.random() * 10).toFixed(1)}</div>`;
            }).join('');

        const genOutputCells = () => Array.from({length: this.rows * this.cols})
            .map(() => `<div class="cell output-cell" style="background-color: transparent; color: transparent;">0.0</div>`).join('');

        this.container.innerHTML = `
            <div class="grid">${genInputCells()}</div>
            
            <div class="calc-panel">
                <div class="math-step" id="step-mean">μ = (Σx) / n</div>
                <div class="math-step" id="step-var">σ² = Σ(x-μ)² / n</div>
                <div class="math-apply" id="step-apply">Applying: (x - μ) / √σ²</div>
            </div>

            <div class="grid">${genOutputCells()}</div>
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
            indices.forEach(i => this.inputCells[i].classList.add('scanning'));
            
            const vals = indices.map(i => parseFloat(this.inputCells[i].textContent));
            
            // 1. Mean (Slower: 1200ms)
            const mean = vals.reduce((a, b) => a + b) / this.cols;
            this.stepMean.innerHTML = `Step 1 (Mean): <span class="active-val">${mean.toFixed(2)}</span>`;
            await new Promise(r => setTimeout(r, 1200));

            // 2. Variance (Slower: 1200ms)
            const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.cols;
            this.stepVar.innerHTML = `Step 2 (Var): <span class="active-val">${variance.toFixed(2)}</span>`;
            await new Promise(r => setTimeout(r, 1200));

            // 3. Apply (Slower: 700ms per cell)
            for (let i of indices) {
                const x = parseFloat(this.inputCells[i].textContent);
                const norm = (x - mean) / Math.sqrt(variance + 1e-5);
                this.stepApply.innerHTML = `(${x} - ${mean.toFixed(1)}) / ${Math.sqrt(variance).toFixed(1)} = ${norm.toFixed(2)}`;
                
                const cell = this.outputCells[i];
                cell.textContent = norm.toFixed(2);
                cell.style.color = "white";
                cell.style.backgroundColor = norm >= 0 ? LN_V5_THEME.POSITIVE : LN_V5_THEME.NEGATIVE;
                cell.style.opacity = 0.4 + (Math.min(Math.abs(norm), 1) * 0.6);
                
                await new Promise(r => setTimeout(r, 700));
            }

            await new Promise(r => setTimeout(r, 1500));
            indices.forEach(i => this.inputCells[i].classList.remove('scanning'));
            this.stepApply.innerHTML = "Applying: (x - μ) / √σ²";
        }
        await new Promise(r => setTimeout(r, 3000));
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
