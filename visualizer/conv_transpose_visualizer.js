/* ----------------------------------------------------
 * conv_transpose_visualizer.js
 * Visualizes the "stamping" process of Conv2DTranspose.
 * ---------------------------------------------------- */

function getConvTransposeStyles(instanceId) {
    return `
    [data-ct-id="${instanceId}"] {
        --grid-size: 3;
        --filter-size: 3;
        --output-size: 5;
        --cell-size: 30px;
        --border-size: 1px;
        --scan-duration: 1200ms;

        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        width: 100%;
    }

    [data-ct-id="${instanceId}"] .ct-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
        position: relative;
    }

    [data-ct-id="${instanceId}"] .grid {
        display: grid;
        background-color: #fff;
        border: 1px solid #333;
    }

    [data-ct-id="${instanceId}"] .input-grid {
        grid-template-columns: repeat(var(--grid-size), var(--cell-size));
        grid-template-rows: repeat(var(--grid-size), var(--cell-size));
    }

    [data-ct-id="${instanceId}"] .output-grid {
        grid-template-columns: repeat(var(--output-size), var(--cell-size));
        grid-template-rows: repeat(var(--output-size), var(--cell-size));
        position: relative;
    }

    [data-ct-id="${instanceId}"] .cell {
        border: 1px solid #ddd;
        width: var(--cell-size);
        height: var(--cell-size);
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 12px;
        font-weight: bold;
        background: #f9f9f9;
    }

    [data-ct-id="${instanceId}"] .cell.active-in {
        background-color: #ff5722;
        color: white;
        transform: scale(1.1);
        z-index: 2;
    }

    /* The 'Stamp' or Projection Overlay */
    [data-ct-id="${instanceId}"] .projection-overlay {
        position: absolute;
        width: calc(var(--filter-size) * var(--cell-size));
        height: calc(var(--filter-size) * var(--cell-size));
        border: 2px solid #ff5722;
        background-color: rgba(255, 87, 34, 0.2);
        pointer-events: none;
        transition: transform var(--scan-duration) ease-in-out, opacity 0.3s;
        display: grid;
        grid-template-columns: repeat(var(--filter-size), 1fr);
        grid-template-rows: repeat(var(--filter-size), 1fr);
    }

    [data-ct-id="${instanceId}"] .proj-cell {
        border: 1px dashed rgba(255, 87, 34, 0.4);
    }

    [data-ct-id="${instanceId}"] .out-cell {
        border: 1px solid #eee;
        width: var(--cell-size);
        height: var(--cell-size);
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 10px;
        color: #bbb;
        transition: background-color 0.3s;
    }

    [data-ct-id="${instanceId}"] .out-cell.highlight {
        background-color: #fff3e0;
        color: #e64a19;
        font-weight: bold;
    }
    `;
}

class ConvTransposeVisualizer {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.instanceId = 'ct-instance-' + Math.random().toString(36).substring(2, 9);
        this.isRunning = false;

        this.IN_SIZE = 3;
        this.K_SIZE = 3;
        this.OUT_SIZE = 5; // Result of 3x3 input with 3x3 kernel, stride 1, no padding
        this.MAX_WIDTH = options.maxWidth || 200;

        this.setupDOM();
        this.startLoop();
    }

    setupDOM() {
        const style = document.createElement('style');
        style.textContent = getConvTransposeStyles(this.instanceId);
        document.head.appendChild(style);

        this.container.setAttribute('data-ct-id', this.instanceId);
        this.container.style.maxWidth = this.MAX_WIDTH + 'px';

        let inputCells = '';
        for(let i=0; i < this.IN_SIZE * this.IN_SIZE; i++) {
            inputCells += `<div class="cell" data-idx="${i}">1</div>`;
        }

        let outputCells = '';
        for(let i=0; i < this.OUT_SIZE * this.OUT_SIZE; i++) {
            outputCells += `<div class="out-cell">0</div>`;
        }

        this.container.innerHTML = `
            <div class="ct-container">
                <div class="grid input-grid">${inputCells}</div>
                <div style="font-size:12px; color:#666;">Projecting Kernel...</div>
                <div class="grid output-grid">
                    ${outputCells}
                    <div class="projection-overlay">
                        ${'<div class="proj-cell"></div>'.repeat(this.K_SIZE * this.K_SIZE)}
                    </div>
                </div>
            </div>
        `;

        this.overlay = this.container.querySelector('.projection-overlay');
        this.inCells = this.container.querySelectorAll('.cell');
        this.outCells = this.container.querySelectorAll('.out-cell');
    }

    async startLoop() {
        this.isRunning = true;
        const cellSize = 30; // Matches CSS

        while (this.isRunning) {
            for (let r = 0; r < this.IN_SIZE; r++) {
                for (let c = 0; c < this.IN_SIZE; c++) {
                    if (!this.isRunning) return;

                    // Highlight input
                    this.inCells.forEach(cell => cell.classList.remove('active-in'));
                    const idx = r * this.IN_SIZE + c;
                    this.inCells[idx].classList.add('active-in');

                    // Move Overlay
                    const tx = c * cellSize;
                    const ty = r * cellSize;
                    this.overlay.style.transform = `translate(${tx}px, ${ty}px)`;

                    // Highlight output area
                    this.outCells.forEach(cell => cell.classList.remove('highlight'));
                    for(let i=0; i<this.K_SIZE; i++) {
                        for(let j=0; j<this.K_SIZE; j++) {
                            const oIdx = (r + i) * this.OUT_SIZE + (c + j);
                            this.outCells[oIdx].classList.add('highlight');
                            // In a real transpose, we'd add values here
                            this.outCells[oIdx].textContent = parseInt(this.outCells[oIdx].textContent) + 1;
                        }
                    }

                    await new Promise(res => setTimeout(res, 1200));
                }
            }
            // Reset for loop
            await new Promise(res => setTimeout(res, 2000));
            this.outCells.forEach(cell => cell.textContent = "0");
        }
    }
}

window.make_conv_transpose_visualizer = function(selector = '.conv_transpose_visualizer') {
    document.querySelectorAll(selector).forEach(el => {
        if (!el.visualizer) el.visualizer = new ConvTransposeVisualizer(el);
    });
};
