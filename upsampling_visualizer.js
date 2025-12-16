/* ----------------------------------------------------
 * upsampling_visualizer.js
 * Encapsulated script for visualizing Upsampling2D (Nearest Neighbor).
 * ---------------------------------------------------- */

// --- 1. Encapsulated CSS ---
function getUpsamplingStyles(instanceId) {
    return `
    [data-us-id="${instanceId}"] {
        --grid-size: 2;
        --upsample-factor: 2;
        --output-size: 4;
        --cell-size: 35px;
        --border-size: 1px;
        --scan-duration: 800ms;
        --fade-duration: 300ms;

        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        padding: 0px;
        box-sizing: border-box;
        width: 100%;
    }

    [data-us-id="${instanceId}"] .upsampling-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 15px;
        align-items: center;
        position: relative;
    }

    [data-us-id="${instanceId}"] .grid {
        display: grid;
        box-shadow: 0 4px 10px rgba(0,0,0,0.08);
        background-color: #fff;
        box-sizing: border-box;
    }

    [data-us-id="${instanceId}"] .input-grid {
        grid-template-columns: repeat(var(--grid-size), var(--cell-size));
        grid-template-rows: repeat(var(--grid-size), var(--cell-size));
    }

    [data-us-id="${instanceId}"] .output-grid {
        grid-template-columns: repeat(var(--output-size), var(--cell-size));
        grid-template-rows: repeat(var(--output-size), var(--cell-size));
    }

    [data-us-id="${instanceId}"] .cell, 
    [data-us-id="${instanceId}"] .output-cell {
        border: 1px solid #ddd;
        background-color: #f0f0f0;
        box-sizing: border-box;
        width: var(--cell-size);
        height: var(--cell-size);
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: calc(var(--cell-size) * 0.5);
        font-weight: bold;
        color: #444;
        transition: all 0.2s ease;
    }

    /* Highlight the active source cell */
    [data-us-id="${instanceId}"] .cell.active-source {
        background-color: #9b59b6; /* Purple */
        color: white;
        transform: scale(1.1);
        z-index: 5;
    }

    /* Highlight the corresponding target cells in the output */
    [data-us-id="${instanceId}"] .output-cell.active-target {
        background-color: #e8daef; /* Light Purple */
        border-color: #9b59b6;
        color: #8e44ad;
    }

    [data-us-id="${instanceId}"] .output-cell::before {
        content: attr(data-value);
    }
    
    [data-us-id="${instanceId}"] .output-cell.reset {
        opacity: 0;
    }
    `;
}

// --- 2. HTML Template ---
function getUpsamplingHtml(instanceId) {
    return `
    <div class="upsampling-container" data-us-id="${instanceId}">
        <div class="grid input-grid" data-element-type="inputGrid">
            <div class="cell" data-value="7">7</div><div class="cell" data-value="3">3</div>
            <div class="cell" data-value="2">2</div><div class="cell" data-value="9">9</div>
        </div>
        
        <div style="font-size: 20px;">&darr;</div>

        <div class="grid output-grid" data-element-type="outputGrid"></div>
    </div>
    `;
}

// --- 3. UpsamplingVisualizer Class ---
class UpsamplingVisualizer {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.instanceId = 'us-instance-' + Math.random().toString(36).substring(2, 9);
        this.isRunning = false;

        this.GRID_SIZE = options.gridSize || 2;
        this.UP_FACTOR = options.upFactor || 2;
        this.OUTPUT_SIZE = this.GRID_SIZE * this.UP_FACTOR;
        this.SCAN_DURATION_MS = options.speed || 800;
        this.MAX_WIDTH_PX = options.maxWidth || 150;

        this.setupDOM();
        this.initOutputGrid();
        this.setupResponsiveness();
        this.startSimulationLoop();
    }

    setupDOM() {
        const style = document.createElement('style');
        style.textContent = getUpsamplingStyles(this.instanceId);
        document.head.appendChild(style);

        this.container.setAttribute('data-us-id', this.instanceId);
        this.container.style.maxWidth = this.MAX_WIDTH_PX + 'px';
        this.container.innerHTML = getUpsamplingHtml(this.instanceId);

        this.inputGrid = this.container.querySelector('.input-grid');
        this.outputGrid = this.container.querySelector('.output-grid');
        this.inputCells = this.inputGrid.querySelectorAll('.cell');
        
        this.container.style.setProperty('--grid-size', this.GRID_SIZE);
        this.container.style.setProperty('--output-size', this.OUTPUT_SIZE);
    }

    initOutputGrid() {
        this.outputGrid.innerHTML = '';
        const total = this.OUTPUT_SIZE * this.OUTPUT_SIZE;
        for (let i = 0; i < total; i++) {
            const cell = document.createElement('div');
            cell.classList.add('output-cell');
            cell.setAttribute('data-value', '?');
            this.outputGrid.appendChild(cell);
        }
    }

    setupResponsiveness() {
        this.resizeObserver = new ResizeObserver(() => {
            const containerWidth = this.container.getBoundingClientRect().width;
            const cellSize = Math.floor((containerWidth - 10) / this.OUTPUT_SIZE);
            this.container.style.setProperty('--cell-size', Math.max(cellSize, 10) + 'px');
        });
        this.resizeObserver.observe(this.container);
    }

    async startSimulationLoop() {
        this.isRunning = true;
        const outputCells = this.outputGrid.querySelectorAll('.output-cell');
        
        while (this.isRunning) {
            // Reset state
            outputCells.forEach(c => {
                c.setAttribute('data-value', '?');
                c.classList.remove('active-target');
            });

            // Loop through each input cell
            for (let r = 0; r < this.GRID_SIZE; r++) {
                for (let c = 0; c < this.GRID_SIZE; c++) {
                    if (!this.isRunning) return;

                    const inputIdx = r * this.GRID_SIZE + c;
                    const val = this.inputCells[inputIdx].getAttribute('data-value');

                    // Highlight Source
                    this.inputCells[inputIdx].classList.add('active-source');

                    // Calculate target block in output
                    const targetRows = Array.from({length: this.UP_FACTOR}, (_, i) => r * this.UP_FACTOR + i);
                    const targetCols = Array.from({length: this.UP_FACTOR}, (_, i) => c * this.UP_FACTOR + i);

                    // Fill target cells
                    for (let tr of targetRows) {
                        for (let tc of targetCols) {
                            const outIdx = tr * this.OUTPUT_SIZE + tc;
                            outputCells[outIdx].classList.add('active-target');
                            outputCells[outIdx].setAttribute('data-value', val);
                        }
                    }

                    await new Promise(r => setTimeout(r, this.SCAN_DURATION_MS));
                    this.inputCells[inputIdx].classList.remove('active-source');
                    outputCells.forEach(oc => oc.classList.remove('active-target'));
                }
            }
            await new Promise(r => setTimeout(r, 2000)); // Pause at end
        }
    }
}

window.make_upsampling_visualizer = function(selector = '.upsampling_visualizer', options = {}) {
    document.querySelectorAll(selector).forEach(el => {
        if (!el.visualizer) el.visualizer = new UpsamplingVisualizer(el, options);
    });
};
