/* ----------------------------------------------------
 * conv_transpose_visualizer.js
 * Visualisiert den "Stempel-Vorgang" von Conv2DTranspose
 * inklusive Gewichtung und Akkumulation (Summation).
 * ---------------------------------------------------- */

function getConvTransposeStyles(instanceId) {
    return `
    [data-ct-id="${instanceId}"] {
        --grid-size: 3;
        --filter-size: 3;
        --output-size: 5;
        --cell-size: 38px;
        --scan-duration: 1000ms;

        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        width: 100%;
        padding: 20px;
        box-sizing: border-box;
    }

    [data-ct-id="${instanceId}"] .ct-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        align-items: center;
    }

    [data-ct-id="${instanceId}"] .grid {
        display: grid;
        background-color: #fff;
        border: 2px solid #444;
        border-radius: 4px;
        overflow: hidden;
    }

    [data-ct-id="${instanceId}"] .input-grid {
        grid-template-columns: repeat(var(--grid-size), var(--cell-size));
    }

    [data-ct-id="${instanceId}"] .output-grid {
        grid-template-columns: repeat(var(--output-size), var(--cell-size));
        position: relative;
    }

    [data-ct-id="${instanceId}"] .cell {
        width: var(--cell-size);
        height: var(--cell-size);
        border: 1px solid #eee;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 14px;
        transition: all 0.3s;
    }

    [data-ct-id="${instanceId}"] .input-cell {
        background: #f0f0f0;
        font-weight: bold;
    }

    [data-ct-id="${instanceId}"] .input-cell.active {
        background-color: #007bff;
        color: white;
        transform: scale(1.1);
        z-index: 10;
    }

    [data-ct-id="${instanceId}"] .output-cell {
        background: #fff;
        color: #999;
        font-size: 12px;
    }

    [data-ct-id="${instanceId}"] .output-cell.highlight {
        background-color: rgba(0, 123, 255, 0.1);
        color: #007bff;
        border-color: #007bff;
    }

    /* Der "Schatten" des Kernels auf dem Output */
    [data-ct-id="${instanceId}"] .kernel-overlay {
        position: absolute;
        width: calc(var(--filter-size) * var(--cell-size));
        height: calc(var(--filter-size) * var(--cell-size));
        border: 2px solid #007bff;
        background-color: rgba(0, 123, 255, 0.05);
        pointer-events: none;
        transition: transform var(--scan-duration) cubic-bezier(0.4, 0, 0.2, 1);
        box-sizing: border-box;
    }

    [data-ct-id="${instanceId}"] .label {
        font-size: 12px;
        font-weight: bold;
        color: #666;
        text-transform: uppercase;
        margin-bottom: 5px;
    }
    `;
}

class ConvTransposeVisualizer {
    constructor(containerElement) {
        this.container = containerElement;
        this.instanceId = 'ct-' + Math.random().toString(36).substring(2, 9);
        
        // Konfiguration
        this.IN_SIZE = 3;
        this.K_SIZE = 3;
        this.STRIDE = 1;
        this.OUT_SIZE = 5; // (In-1)*Stride + K_Size -> (3-1)*1 + 3 = 5

        // Beispiel-Werte
        this.INPUT_VALS = [
            0.5, 1.0, 0.5,
            1.0, 2.0, 1.0,
            0.5, 1.0, 0.5
        ];

        // Der Kernel (Lernbare Gewichte)
        this.KERNEL = [
            0.1, 0.2, 0.1,
            0.2, 0.5, 0.2,
            0.1, 0.2, 0.1
        ];

        this.isRunning = true;
        this.init();
    }

    init() {
        const style = document.createElement('style');
        style.textContent = getConvTransposeStyles(this.instanceId);
        document.head.appendChild(style);

        this.container.setAttribute('data-ct-id', this.instanceId);
        this.render();
        this.animate();
    }

    render() {
        let inputHTML = '';
        this.INPUT_VALS.forEach(v => {
            inputHTML += `<div class="cell input-cell">${v}</div>`;
        });

        let outputHTML = '';
        for (let i = 0; i < this.OUT_SIZE * this.OUT_SIZE; i++) {
            outputHTML += `<div class="cell output-cell">0.0</div>`;
        }

        this.container.innerHTML = `
            <div class="ct-container">
                <div>
                    <div class="label">Input (Small)</div>
                    <div class="grid input-grid">${inputHTML}</div>
                </div>
                <div>
                    <div class="label">Output (Upsampled + Summed)</div>
                    <div class="grid output-grid">
                        ${outputHTML}
                        <div class="kernel-overlay"></div>
                    </div>
                </div>
            </div>
        `;

        this.inputCells = this.container.querySelectorAll('.input-cell');
        this.outputCells = this.container.querySelectorAll('.output-cell');
        this.overlay = this.container.querySelector('.kernel-overlay');
    }

    async animate() {
        const cellSize = 38;

        while (this.isRunning) {
            // Reset Output-Werte am Anfang jedes Durchlaufs
            let accumulationBuffer = new Array(this.OUT_SIZE * this.OUT_SIZE).fill(0);
            this.outputCells.forEach(c => {
                c.textContent = "0.0";
                c.classList.remove('highlight');
            });

            for (let r = 0; r < this.IN_SIZE; r++) {
                for (let c = 0; c < this.IN_SIZE; c++) {
                    const inIdx = r * this.IN_SIZE + c;
                    const val = this.INPUT_VALS[inIdx];

                    // UI: Aktiviere Input-Pixel
                    this.inputCells.forEach(cell => cell.classList.remove('active'));
                    this.inputCells[inIdx].classList.add('active');

                    // UI: Bewege den "Stempel" (Overlay)
                    this.overlay.style.transform = `translate(${c * this.STRIDE * cellSize}px, ${r * this.STRIDE * cellSize}px)`;

                    // Akkumulation: Stempel den Kernel auf den Output
                    this.outputCells.forEach(cell => cell.classList.remove('highlight'));
                    
                    for (let kr = 0; kr < this.K_SIZE; kr++) {
                        for (let kc = 0; kc < this.K_SIZE; kc++) {
                            const outR = r * this.STRIDE + kr;
                            const outC = c * this.STRIDE + kc;
                            const outIdx = outR * this.OUT_SIZE + outC;
                            const kIdx = kr * this.K_SIZE + kc;

                            // Die Kern-Logik: Input * Kernel-Gewicht
                            const contribution = val * this.KERNEL[kIdx];
                            accumulationBuffer[outIdx] += contribution;

                            // UI Update
                            this.outputCells[outIdx].textContent = accumulationBuffer[outIdx].toFixed(1);
                            this.outputCells[outIdx].classList.add('highlight');
                        }
                    }

                    await new Promise(res => setTimeout(res, 1000));
                }
            }
            await new Promise(res => setTimeout(res, 2000));
        }
    }
}

window.make_conv_transpose_visualizer = function(selector = '.conv_transpose_visualizer') {
    document.querySelectorAll(selector).forEach(el => {
        new ConvTransposeVisualizer(el);
    });
};
