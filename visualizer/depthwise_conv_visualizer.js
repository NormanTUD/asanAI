/* ----------------------------------------------------
 * depthwise_conv_visualizer.js
 * Visualizes DepthwiseConv2D: Independent kernels per channel.
 * Clean UI, Transparent Background, Darkmode-friendly.
 * ---------------------------------------------------- */

function getDepthwiseStyles(instanceId) {
    return `
    [data-dw-id="${instanceId}"] {
        --grid-size: 5;
        --filter-size: 3;
        --output-size: 3;
        --cell-size: 32px;
        --border-width: 1px;
        --text-color: #888;
        display: flex; flex-direction: column; align-items: center;
        width: 100%; padding: 10px; font-family: 'Monaco', 'Consolas', monospace;
        background: transparent;
    }
    [data-dw-id="${instanceId}"] .channels-container {
        display: flex; gap: 40px; justify-content: center; flex-wrap: wrap;
    }
    [data-dw-id="${instanceId}"] .channel-view {
        display: flex; flex-direction: column; align-items: center; gap: 15px;
    }
    [data-dw-id="${instanceId}"] .grid {
        display: grid; background-color: #444; border: var(--border-width) solid #444;
        gap: var(--border-width); position: relative;
    }
    [data-dw-id="${instanceId}"] .input-grid { grid-template-columns: repeat(var(--grid-size), var(--cell-size)); }
    [data-dw-id="${instanceId}"] .kernel-grid { grid-template-columns: repeat(var(--filter-size), calc(var(--cell-size) * 0.7)); }
    [data-dw-id="${instanceId}"] .output-grid { grid-template-columns: repeat(var(--output-size), var(--cell-size)); }
    
    [data-dw-id="${instanceId}"] .cell {
        width: var(--cell-size); height: var(--cell-size); background-color: rgba(255,255,255,0.05);
        display: flex; align-items: center; justify-content: center; font-size: 11px; color: #ccc;
    }
    [data-dw-id="${instanceId}"] .kernel-grid .cell {
        width: calc(var(--cell-size) * 0.7); height: calc(var(--cell-size) * 0.7);
        font-size: 9px; border: 1px solid rgba(255,255,255,0.2);
    }
    [data-dw-id="${instanceId}"] .filter-overlay {
        position: absolute; top: 0; left: 0;
        width: calc(var(--filter-size) * var(--cell-size) + (var(--filter-size)-1) * var(--border-width));
        height: calc(var(--filter-size) * var(--cell-size) + (var(--filter-size)-1) * var(--border-width));
        border: 2px solid; pointer-events: none; z-index: 10;
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        box-sizing: border-box;
    }
    [data-dw-id="${instanceId}"] .section-label {
        font-size: 10px; color: var(--text-color); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;
    }
    [data-dw-id="${instanceId}"] .cell.active { background-color: rgba(255,255,255,0.2); }
    `;
}

class DepthwiseConvVisualizer {
    constructor(container) {
        this.container = container;
        this.instanceId = 'dw-' + Math.random().toString(36).substr(2, 9);
        this.channels = [
            { name: 'CH 1', color: '#00cfb4' }, // Cyan-ish
            { name: 'CH 2', color: '#ff6b6b' }  // Coral-ish
        ];
        this.IN_SIZE = 5;
        this.K_SIZE = 3;
        this.OUT_SIZE = this.IN_SIZE - this.K_SIZE + 1;
        this.init();
    }

    init() {
        const style = document.createElement('style');
        style.textContent = getDepthwiseStyles(this.instanceId);
        document.head.appendChild(style);
        this.container.setAttribute('data-dw-id', this.instanceId);

        let html = `<div class="channels-container">`;
        this.channels.forEach((ch, i) => {
            html += `
                <div class="channel-view" id="${this.instanceId}-ch-${i}">
                    <div>
                        <div class="section-label" style="color:${ch.color}">${ch.name} INPUT</div>
                        <div class="grid input-grid">
                            <div class="filter-overlay" style="border-color:${ch.color}; box-shadow: 0 0 10px ${ch.color}44"></div>
                            ${Array.from({length: 25}, () => `<div class="cell">${(Math.random()*5).toFixed(0)}</div>`).join('')}
                        </div>
                    </div>
                    <div>
                        <div class="section-label">KERNEL (Spatial)</div>
                        <div class="grid kernel-grid">
                            ${Array.from({length: 9}, () => `<div class="cell" style="color:${ch.color}">0.1</div>`).join('')}
                        </div>
                    </div>
                    <div>
                        <div class="section-label">OUTPUT</div>
                        <div class="grid output-grid">
                            ${Array.from({length: 9}, () => `<div class="cell out-cell">0</div>`).join('')}
                        </div>
                    </div>
                </div>`;
        });
        html += `</div>`;
        this.container.innerHTML = html;
        this.run();
    }

    async run() {
        const stepSize = 32 + 1;
        const channelViews = this.channels.map((_, i) => ({
            overlay: this.container.querySelector(`#${this.instanceId}-ch-${i} .filter-overlay`),
            outputs: this.container.querySelectorAll(`#${this.instanceId}-ch-${i} .out-cell`),
            inputs: this.container.querySelectorAll(`#${this.instanceId}-ch-${i} .input-grid .cell`)
        }));

        while (true) {
            channelViews.forEach(v => v.outputs.forEach(o => { o.textContent = '0'; o.style.color = '#555'; }));

            for (let r = 0; r < this.OUT_SIZE; r++) {
                for (let c = 0; c < this.OUT_SIZE; c++) {
                    const offset = `translate(${c * stepSize}px, ${r * stepSize}px)`;
                    
                    channelViews.forEach(v => {
                        v.overlay.style.transform = offset;
                        v.inputs.forEach((cell, idx) => {
                            const ir = Math.floor(idx / this.IN_SIZE);
                            const ic = idx % this.IN_SIZE;
                            const active = (ir >= r && ir < r + this.K_SIZE && ic >= c && ic < c + this.K_SIZE);
                            cell.classList.toggle('active', active);
                        });
                    });
                    
                    await new Promise(res => setTimeout(res, 800));

                    const outIdx = r * this.OUT_SIZE + c;
                    channelViews.forEach((v, i) => {
                        v.outputs[outIdx].textContent = (Math.random() * 9).toFixed(1);
                        v.outputs[outIdx].style.color = this.channels[i].color;
                        v.outputs[outIdx].style.fontWeight = 'bold';
                    });
                    
                    await new Promise(res => setTimeout(res, 400));
                }
            }
            await new Promise(res => setTimeout(res, 2000));
        }
    }
}

window.make_depthwise_conv_visualizer = (sel) => {
    document.querySelectorAll(sel).forEach(el => { if (!el.visualizer) el.visualizer = new DepthwiseConvVisualizer(el); });
};
