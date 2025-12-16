/* ----------------------------------------------------
 * layernorm_visualizer_v4.js
 * Fix: Border-Overlap & klarere Statistik-Berechnung
 * ---------------------------------------------------- */

const LN_V4_THEME = {
    INPUT_CELL_BG: 'rgba(150, 150, 150, 0.1)',
    OUTPUT_CELL_BG: '#6f42c1',
    HIGHLIGHT: '#fd7e14'
};

function getLayerNormV4Styles(instanceId, rows, cols) {
    return `
    [data-ln-id="${instanceId}"] {
        --cell-size: 38px;
        display: flex; flex-direction: column; align-items: center;
        width: 100%; background: transparent; box-sizing: border-box;
    }
    [data-ln-id="${instanceId}"] * { box-sizing: border-box; }

    [data-ln-id="${instanceId}"] .visualizer-layout {
        display: flex; flex-direction: column; align-items: center; gap: 15px;
    }

    [data-ln-id="${instanceId}"] .grid {
        display: grid; 
        grid-template-columns: repeat(${cols}, var(--cell-size));
        gap: 4px;
    }

    [data-ln-id="${instanceId}"] .cell {
        width: var(--cell-size); height: var(--cell-size);
        border-radius: 4px; display: flex; align-items: center; justify-content: center;
        font-size: 10px; font-weight: 600; border: 1px solid rgba(128,128,128,0.2);
        transition: all 0.2s ease;
    }

    [data-ln-id="${instanceId}"] .input-cell { background: ${LN_V4_THEME.INPUT_CELL_BG}; }
    [data-ln-id="${instanceId}"] .output-cell { background: ${LN_V4_THEME.OUTPUT_CELL_BG}; color: white; opacity: 0.1; }

    /* Scan-Effekt ohne Overlap durch inset shadow oder outline */
    [data-ln-id="${instanceId}"] .scanning {
        outline: 2px solid ${LN_V4_THEME.HIGHLIGHT};
        outline-offset: -2px; /* Rahmen nach innen legen verhindert Überlappung */
        background: rgba(253, 126, 20, 0.15) !important;
    }

    [data-ln-id="${instanceId}"] .output-active { opacity: 1; }

    [data-ln-id="${instanceId}"] .calc-panel {
        padding: 12px; border-radius: 8px; border: 1px dashed rgba(128,128,128,0.3);
        width: 100%; max-width: 300px; margin: 10px 0; font-family: monospace;
    }

    [data-ln-id="${instanceId}"] .math-step {
        font-size: 11px; margin-bottom: 4px; line-height: 1.4;
    }

    [data-ln-id="${instanceId}"] .highlight-txt { color: ${LN_V4_THEME.HIGHLIGHT}; font-weight: bold; }
    `;
}

class LayerNormVisualizerV4 {
    constructor(container, options = {}) {
        this.container = container;
        this.instanceId = 'ln-v4-' + Math.random().toString(36).substr(2, 9);
        this.rows = options.gridRows || 4;
        this.cols = options.gridCols || 4;
        this.isRunning = false;
        this.init();
    }

    init() {
        const style = document.createElement('style');
        style.innerHTML = getLayerNormV4Styles(this.instanceId, this.rows, this.cols);
        document.head.appendChild(style);
        this.container.setAttribute('data-ln-id', this.instanceId);
        this.render();
        this.startLoop();
    }

    render() {
        const genCells = (type) => Array.from({length: this.rows * this.cols})
            .map((_, i) => `<div class="cell ${type}-cell">${type === 'input' ? (Math.random() * 6).toFixed(1) : '0.0'}</div>`).join('');

        this.container.innerHTML = `
            <div class="visualizer-layout">
                <div class="grid">${genCells('input')}</div>
                <div class="calc-panel">
                    <div class="math-step" id="step-mean"><b>μ</b> = sum(row) / ${this.cols}</div>
                    <div class="math-step" id="step-var"><b>σ²</b> = sum((x-μ)²) / ${this.cols}</div>
                </div>
                <div class="grid">${genCells('output')}</div>
            </div>
        `;
        this.inputCells = this.container.querySelectorAll('.input-cell');
        this.outputCells = this.container.querySelectorAll('.output-cell');
        this.stepMean = this.container.querySelector('#step-mean');
        this.stepVar = this.container.querySelector('#step-var');
    }

    async run() {
        this.isRunning = true;
        for (let r = 0; r < this.rows; r++) {
            const indices = Array.from({length: this.cols}, (_, i) => r * this.cols + i);
            
            // 1. Highlight & Mean
            indices.forEach(i => this.inputCells[i].classList.add('scanning'));
            const vals = indices.map(i => parseFloat(this.inputCells[i].textContent));
            const mean = vals.reduce((a, b) => a + b) / this.cols;
            this.stepMean.innerHTML = `<b>μ</b> = (${vals.join('+')})/${this.cols} = <span class="highlight-txt">${mean.toFixed(2)}</span>`;
            await new Promise(r => setTimeout(r, 1200));

            // 2. Variance
            const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.cols;
            this.stepVar.innerHTML = `<b>σ²</b> = avg((x - ${mean.toFixed(1)})²) = <span class="highlight-txt">${variance.toFixed(2)}</span>`;
            await new Promise(r => setTimeout(r, 1200));

            // 3. Transform
            for (let i of indices) {
                const x = parseFloat(this.inputCells[i].textContent);
                const norm = (x - mean) / Math.sqrt(variance + 1e-5);
                this.outputCells[i].textContent = norm.toFixed(2);
                this.outputCells[i].classList.add('output-active');
                await new Promise(r => setTimeout(r, 100));
            }

            await new Promise(r => setTimeout(r, 600));
            indices.forEach(i => this.inputCells[i].classList.remove('scanning'));
            this.stepMean.innerHTML = `<b>μ</b> = ...`;
            this.stepVar.innerHTML = `<b>σ²</b> = ...`;
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
    document.querySelectorAll(sel).forEach(el => { if(!el.visualizer) el.visualizer = new LayerNormVisualizerV4(el, opt); });
};
