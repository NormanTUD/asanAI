/* ----------------------------------------------------
 * separable_conv_visualizer.js
 * Visualizes Depthwise Separable Conv: 
 * Step 1: Depthwise (Spatial) -> Step 2: Pointwise (Cross-Channel)
 * ---------------------------------------------------- */

function getSeparableStyles(instanceId) {
    return `
    [data-sep-id="${instanceId}"] {
        --cell-size: 30px;
        --border-width: 1px;
        --bg-active: rgba(255, 255, 255, 0.15);
        display: flex; flex-direction: column; align-items: center;
        width: 100%; font-family: 'Monaco', 'Consolas', monospace;
        background: transparent; color: #ccc;
    }
    [data-sep-id="${instanceId}"] .main-layout {
        display: flex; gap: 30px; align-items: flex-start; justify-content: center; flex-wrap: wrap;
    }
    [data-sep-id="${instanceId}"] .step-box {
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        padding: 15px; border: 1px dashed #444; border-radius: 8px;
    }
    [data-sep-id="${instanceId}"] .grid {
        display: grid; background-color: #444; border: var(--border-width) solid #444;
        gap: var(--border-width); position: relative;
    }
    [data-sep-id="${instanceId}"] .input-grid { grid-template-columns: repeat(4, var(--cell-size)); }
    [data-sep-id="${instanceId}"] .output-grid { grid-template-columns: repeat(2, var(--cell-size)); }
    [data-sep-id="${instanceId}"] .pointwise-grid { grid-template-columns: repeat(1, var(--cell-size)); }

    [data-sep-id="${instanceId}"] .cell {
        width: var(--cell-size); height: var(--cell-size); background-color: rgba(255,255,255,0.03);
        display: flex; align-items: center; justify-content: center; font-size: 10px; transition: all 0.3s;
    }
    [data-sep-id="${instanceId}"] .filter-overlay {
        position: absolute; top: 0; left: 0;
        width: calc(3 * var(--cell-size) + 2 * var(--border-width));
        height: calc(3 * var(--cell-size) + 2 * var(--border-width));
        border: 2px solid; pointer-events: none; z-index: 10;
        transition: transform 0.4s ease-in-out;
    }
    [data-sep-id="${instanceId}"] .label { font-size: 10px; color: #888; text-transform: uppercase; margin-bottom: 4px; }
    [data-sep-id="${instanceId}"] .cell.active { background-color: var(--bg-active); }
    [data-sep-id="${instanceId}"] .arrow { font-size: 20px; color: #444; align-self: center; }
    `;
}

class SeparableConvVisualizer {
    constructor(container) {
        this.container = container;
        this.instanceId = 'sep-' + Math.random().toString(36).substr(2, 9);
        this.channels = [
            { name: 'CH A', color: '#4dabf7' },
            { name: 'CH B', color: '#ff922b' }
        ];
        this.init();
    }

    init() {
        const style = document.createElement('style');
        style.textContent = getSeparableStyles(this.instanceId);
        document.head.appendChild(style);
        this.container.setAttribute('data-sep-id', this.instanceId);

        this.container.innerHTML = `
            <div class="main-layout">
                <div class="step-box">
                    <div class="label">Step 1: Depthwise (3x3)</div>
                    ${this.channels.map((ch, i) => `
                        <div id="${this.instanceId}-ch-${i}">
                            <div class="grid input-grid">
                                <div class="filter-overlay" style="border-color:${ch.color}"></div>
                                ${Array.from({length: 16}, () => `<div class="cell">${(Math.random()*5).toFixed(0)}</div>`).join('')}
                            </div>
                        </div>
                    `).join('<div style="height:10px"></div>')}
                </div>

                <div class="arrow">→</div>

                <div class="step-box">
                    <div class="label">Step 2: Pointwise (1x1)</div>
                    <div class="grid pointwise-grid" style="margin-top:40px">
                        <div class="cell" style="border: 2px solid #51cf66; color:#51cf66">W1</div>
                        <div class="cell" style="border: 2px solid #51cf66; color:#51cf66">W2</div>
                    </div>
                    <div style="font-size:9px; color:#666; width:60px; text-align:center">Combines Channels</div>
                </div>

                <div class="arrow">→</div>

                <div class="step-box">
                    <div class="label">Final Output</div>
                    <div class="grid output-grid" style="margin-top:40px">
                        ${Array.from({length: 4}, () => `<div class="cell out-cell">0</div>`).join('')}
                    </div>
                </div>
            </div>
        `;
        this.run();
    }

    async run() {
        const step = 30 + 1;
        const chViews = this.channels.map((_, i) => ({
            overlay: this.container.querySelector(`#${this.instanceId}-ch-${i} .filter-overlay`),
            inputs: this.container.querySelectorAll(`#${this.instanceId}-ch-${i} .input-grid .cell`)
        }));
        const outputs = this.container.querySelectorAll('.out-cell');

        while (true) {
            outputs.forEach(o => { o.textContent = '0'; o.style.color = '#555'; });

            for (let r = 0; r < 2; r++) {
                for (let c = 0; c < 2; c++) {
                    const offset = `translate(${c * step}px, ${r * step}px)`;
                    
                    // Move Depthwise Filters
                    chViews.forEach(v => {
                        v.overlay.style.transform = offset;
                        v.inputs.forEach((cell, idx) => {
                            const ir = Math.floor(idx / 4); const ic = idx % 4;
                            cell.classList.toggle('active', ir >= r && ir < r + 3 && ic >= c && ic < c + 3);
                        });
                    });

                    await new Promise(res => setTimeout(res, 800));

                    // Write Pointwise Result
                    const outIdx = r * 2 + c;
                    outputs[outIdx].textContent = (Math.random() * 9).toFixed(1);
                    outputs[outIdx].style.color = '#51cf66';
                    outputs[outIdx].style.fontWeight = 'bold';

                    await new Promise(res => setTimeout(res, 400));
                }
            }
            await new Promise(res => setTimeout(res, 2000));
        }
    }
}

window.make_separable_conv_visualizer = (sel) => {
    document.querySelectorAll(sel).forEach(el => { if (!el.visualizer) el.visualizer = new SeparableConvVisualizer(el); });
};
