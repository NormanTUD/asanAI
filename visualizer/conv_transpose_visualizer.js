/* ----------------------------------------------------
 * conv_transpose_visualizer.js
 * Visualisiert Conv2DTranspose: Input * Kernel = Stamp.
 * Fixes: Pixelgenaues Alignment & Kernel-Anzeige.
 * ---------------------------------------------------- */

function getConvTransposeStyles(instanceId) {
    return `
    [data-ct-id="${instanceId}"] {
        --grid-size: 3;
        --filter-size: 3;
        --output-size: 5;
        --cell-size: 45px;
        --border-width: 1px;
        --scan-duration: 2500ms;

        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        padding: 20px;
        box-sizing: border-box;
        color: #333;
    }

    [data-ct-id="${instanceId}"] .ct-layout {
        display: flex;
        flex-direction: column;
        gap: 30px;
        align-items: center;
    }

    [data-ct-id="${instanceId}"] .grid {
        display: grid;
        background-color: #333; /* Border-Farbe */
        border: var(--border-width) solid #333;
        gap: var(--border-width);
    }

    [data-ct-id="${instanceId}"] .input-grid { grid-template-columns: repeat(var(--grid-size), var(--cell-size)); }
    [data-ct-id="${instanceId}"] .output-grid { 
        grid-template-columns: repeat(var(--output-size), var(--cell-size)); 
        position: relative;
        background-color: #333;
    }
    [data-ct-id="${instanceId}"] .kernel-grid { 
        grid-template-columns: repeat(var(--filter-size), 30px); 
        background-color: #007bff;
    }

    [data-ct-id="${instanceId}"] .cell {
        width: var(--cell-size);
        height: var(--cell-size);
        background: white;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 14px;
        font-weight: bold;
        box-sizing: border-box;
    }

    [data-ct-id="${instanceId}"] .k-cell {
        width: 30px; height: 30px;
        background: #e7f3ff;
        font-size: 10px;
    }

    [data-ct-id="${instanceId}"] .input-cell.active {
        background-color: #007bff;
        color: white;
    }

    [data-ct-id="${instanceId}"] .output-cell.highlight {
        background-color: #eef7ff;
    }

    /* PRÄZISE OVERLAY BERECHNUNG */
    [data-ct-id="${instanceId}"] .kernel-overlay {
        position: absolute;
        top: 0; left: 0;
        /* (Zellen * Größe) + (Anzahl der Lücken * Lückengröße) */
        width: calc(var(--filter-size) * var(--cell-size) + (var(--filter-size) - 1) * var(--border-width));
        height: calc(var(--filter-size) * var(--cell-size) + (var(--filter-size) - 1) * var(--border-width));
        border: 3px solid #007bff;
        background-color: rgba(0, 123, 255, 0.1);
        pointer-events: none;
        transition: transform var(--scan-duration) ease-in-out;
        box-sizing: border-box;
        z-index: 5;
    }

    [data-ct-id="${instanceId}"] .info-box {
        display: flex;
        gap: 20px;
        align-items: center;
        margin: 10px 0;
        padding: 10px;
        background: #f0f0f0;
        border-radius: 8px;
    }
    `;
}

class ConvTransposeVisualizer {
    constructor(containerElement) {
        this.container = containerElement;
        this.instanceId = 'ct-' + Math.random().toString(36).substring(2, 9);
        
        this.IN_SIZE = 3; this.K_SIZE = 3; this.OUT_SIZE = 5;
        this.KERNEL = [0.1, 0.5, 0.1, 0.5, 1.0, 0.5, 0.1, 0.5, 0.1];
        this.INPUT_DATA = [1, 2, 1, 0, 3, 0, 1, 2, 1];

        this.init();
    }

    init() {
        const style = document.createElement('style');
        style.textContent = getConvTransposeStyles(this.instanceId);
        document.head.appendChild(style);
        this.container.setAttribute('data-ct-id', this.instanceId);
        this.render();
        this.loop();
    }

    render() {
        const kCells = this.KERNEL.map(v => `<div class="cell k-cell">${v}</div>`).join('');
        const iCells = this.INPUT_DATA.map(v => `<div class="cell input-cell">${v}</div>`).join('');
        const oCells = Array(this.OUT_SIZE * this.OUT_SIZE).fill(0).map(() => `<div class="cell output-cell">0.0</div>`).join('');

        this.container.innerHTML = `
            <div class="ct-layout">
                <div class="info-box">
                    <div style="text-align:center">
                        <div style="font-size:10px; font-weight:bold">LEARNED KERNEL</div>
                        <div class="grid kernel-grid">${kCells}</div>
                    </div>
                    <div style="font-size: 20px; font-weight: bold">×</div>
                    <div style="text-align:center">
                        <div style="font-size:10px; font-weight:bold">INPUT PIXEL</div>
                        <div id="active-val-${this.instanceId}" style="font-size:24px; color:#007bff">?</div>
                    </div>
                </div>

                <div class="grid input-grid">${iCells}</div>
                
                <div class="grid output-grid">
                    ${oCells}
                    <div class="kernel-overlay"></div>
                </div>
            </div>
        `;
        this.inputCells = this.container.querySelectorAll('.input-cell');
        this.outputCells = this.container.querySelectorAll('.output-cell');
        this.overlay = this.container.querySelector('.kernel-overlay');
        this.valDisplay = this.container.querySelector(`#active-val-${this.instanceId}`);
    }

    async loop() {
        const step = 45 + 1; // Cell + Border

        while (true) {
            let buffer = new Array(this.OUT_SIZE * this.OUT_SIZE).fill(0);
            this.outputCells.forEach(c => c.textContent = "0.0");

            for (let r = 0; r < this.IN_SIZE; r++) {
                for (let c = 0; c < this.IN_SIZE; c++) {
                    const val = this.INPUT_DATA[r * this.IN_SIZE + c];
                    this.valDisplay.textContent = val;

                    this.inputCells.forEach(ic => ic.classList.remove('active'));
                    this.inputCells[r * this.IN_SIZE + c].classList.add('active');

                    // Animation des Rahmens
                    this.overlay.style.transform = `translate(${c * step}px, ${r * step}px)`;

                    this.outputCells.forEach(oc => oc.classList.remove('highlight'));
                    
                    for (let kr = 0; kr < this.K_SIZE; kr++) {
                        for (let kc = 0; kc < this.K_SIZE; kc++) {
                            const oIdx = (r + kr) * this.OUT_SIZE + (c + kc);
                            buffer[oIdx] += val * this.KERNEL[kr * this.K_SIZE + kc];
                            this.outputCells[oIdx].textContent = buffer[oIdx].toFixed(1);
                            this.outputCells[oIdx].classList.add('highlight');
                        }
                    }
                    await new Promise(r => setTimeout(r, 2500));
                }
            }
            await new Promise(r => setTimeout(r, 3000));
        }
    }
}

window.make_conv_transpose_visualizer = (sel = '.conv_transpose_visualizer') => {
    document.querySelectorAll(sel).forEach(el => new ConvTransposeVisualizer(el));
};
