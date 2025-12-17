/* ----------------------------------------------------
 * depthwise_conv_visualizer.js
 * Visualisiert DepthwiseConv2D: Ein Filter pro Kanal.
 * Orientiert sich an der stabilen Logik des ConvTranspose-Visualizers.
 * ---------------------------------------------------- */

function getDepthwiseStyles(instanceId) {
    return `
    [data-dw-id="${instanceId}"] {
        --grid-size: 5;
        --filter-size: 3;
        --output-size: 3;
        --cell-size: 40px;
        --border-width: 1px;
        --accent-color: #6f42c1;

        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        padding: 20px;
        box-sizing: border-box;
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    [data-dw-id="${instanceId}"] .dw-layout {
        display: flex;
        flex-direction: column;
        gap: 25px;
        align-items: center;
    }

    [data-dw-id="${instanceId}"] .grid {
        display: grid;
        background-color: #444; 
        border: var(--border-width) solid #444;
        gap: var(--border-width);
        position: relative;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    [data-dw-id="${instanceId}"] .input-grid { 
        grid-template-columns: repeat(var(--grid-size), var(--cell-size)); 
    }
    
    [data-dw-id="${instanceId}"] .output-grid { 
        grid-template-columns: repeat(var(--output-size), var(--cell-size)); 
    }

    [data-dw-id="${instanceId}"] .cell {
        width: var(--cell-size);
        height: var(--cell-size);
        background-color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: bold;
        color: #333;
        transition: background-color 0.3s;
    }

    [data-dw-id="${instanceId}"] .filter-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: calc(var(--filter-size) * var(--cell-size) + (var(--filter-size) - 1) * var(--border-width));
        height: calc(var(--filter-size) * var(--cell-size) + (var(--filter-size) - 1) * var(--border-width));
        border: 3px solid var(--accent-color);
        background-color: rgba(111, 66, 193, 0.1);
        pointer-events: none;
        z-index: 10;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        box-sizing: border-box;
    }

    [data-dw-id="${instanceId}"] .cell.active-out {
        background-color: #e2d9f3;
        color: var(--accent-color);
    }

    [data-dw-id="${instanceId}"] .label {
        font-size: 12px;
        font-weight: 700;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
    }
    `;
}

class DepthwiseConvVisualizer {
    constructor(container, options = {}) {
        this.container = container;
        this.instanceId = 'dw-' + Math.random().toString(36).substr(2, 9);
        
        this.IN_SIZE = options.gridSize || 5;
        this.K_SIZE = options.filterSize || 3;
        this.OUT_SIZE = this.IN_SIZE - this.K_SIZE + 1;
        
        // Daten initialisieren (damit Matrix nicht leer ist)
        this.INPUT_DATA = Array.from({length: this.IN_SIZE * this.IN_SIZE}, () => (Math.random() * 5).toFixed(0));
        
        this.init();
    }

    init() {
        const style = document.createElement('style');
        style.textContent = getDepthwiseStyles(this.instanceId);
        document.head.appendChild(style);

        this.container.setAttribute('data-dw-id', this.instanceId);
        this.container.innerHTML = `
            <div class="dw-layout">
                <div>
                    <div class="label">Input Channel</div>
                    <div class="grid input-grid">
                        <div class="filter-overlay"></div>
                    </div>
                </div>
                <div>
                    <div class="label">Depthwise Output</div>
                    <div class="grid output-grid"></div>
                </div>
            </div>
        `;

        this.inputGrid = this.container.querySelector('.input-grid');
        this.outputGrid = this.container.querySelector('.output-grid');
        this.overlay = this.container.querySelector('.filter-overlay');

        this.setupGrids();
        this.run();
    }

    setupGrids() {
        // Input Grid füllen
        this.INPUT_DATA.forEach(val => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = val;
            this.inputGrid.appendChild(cell);
        });

        // Output Grid füllen (Platzhalter)
        for (let i = 0; i < this.OUT_SIZE * this.OUT_SIZE; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell output-cell';
            cell.textContent = '0.0';
            this.outputGrid.appendChild(cell);
        }
        this.outputCells = this.container.querySelectorAll('.output-cell');
    }

    async run() {
        const step = 40 + 1; // cell-size + border

        while (true) {
            // Reset am Anfang
            this.outputCells.forEach(c => {
                c.textContent = '...';
                c.classList.remove('active-out');
            });
            this.overlay.style.transform = `translate(0px, 0px)`;
            await new Promise(r => setTimeout(r, 1000));

            for (let r = 0; r < this.OUT_SIZE; r++) {
                for (let c = 0; c < this.OUT_SIZE; c++) {
                    // 1. Bewege Filter
                    this.overlay.style.transform = `translate(${c * step}px, ${r * step}px)`;
                    
                    // Kurze Pause für die Bewegung
                    await new Promise(r => setTimeout(r, 700));

                    // 2. Berechne Wert (Simuliert)
                    const outIdx = r * this.OUT_SIZE + c;
                    const simulatedVal = (Math.random() * 10).toFixed(1);
                    
                    // 3. Output aktualisieren
                    this.outputCells[outIdx].textContent = simulatedVal;
                    this.outputCells[outIdx].classList.add('active-out');

                    await new Promise(r => setTimeout(r, 400));
                }
            }

            // Pause am Ende vor Neustart
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

window.make_depthwise_conv_visualizer = (sel, opt) => {
    document.querySelectorAll(sel).forEach(el => {
        if (!el.visualizer) el.visualizer = new DepthwiseConvVisualizer(el, opt);
    });
};
