/* ----------------------------------------------------
 * convolution_visualizer.js
 * Encapsulated script for creating multiple convolution
 * simulation instances on a single page.
 * ---------------------------------------------------- */

// --- 1. Encapsulated CSS ---
function getConvolutionStyles(instanceId) {
    return `
        /* General setup and variables for instance ${instanceId} */
        [data-conv-id="${instanceId}"] {
            /* layout / behaviour */
            --grid-size: 5;
            --filter-size: 3;
            --output-size: 3;

            /* visual defaults (will be overridden from JS for responsiveness) */
            --cell-size: 30px;
            /* FIX 7: Reduziere die Randgröße von 4px auf 1px für Kompaktheit */
            --border-size: 1px; 

            /* transitions */
            --scan-duration: 1000ms;
            --fade-duration: 150ms;

            /* Page skeleton */
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            /* FIX 1: Remove padding to give more room for content */
            padding: 0px; 
            box-sizing: border-box;
            width: 100%;
            /* max-width wird jetzt vom JS direkt über style gesetzt */
        }

        /* The convolution area should take 100% of the parent width and be responsive */
        [data-conv-id="${instanceId}"] .convolution-container {
            /* FIX 2: Use 100% of the available (max-width constrained) space */
            width: 100%; 
            display: flex;
            /* FIX 3: Force stacked layout and use minimal gap */
            flex-direction: column;
            gap: 8px; /* Gap auch reduziert, von 16px auf 8px */
            align-items: center;
            position: relative;
            box-sizing: border-box;
            justify-content: center;
        }

        /* Grid base style (both input and output share) */
        [data-conv-id="${instanceId}"] .grid {
            display: grid;
            border: var(--border-size) solid #333;
            box-shadow: 0 4px 10px rgba(0,0,0,0.08); /* Schatten reduziert */
            background-color: #fff;
            box-sizing: border-box;
            /* Stellt sicher, dass das Grid nicht überläuft, wenn die Zelle zu groß ist */
            max-width: 100%; 
        }

        [data-conv-id="${instanceId}"] .input-grid {
            grid-template-columns: repeat(var(--grid-size), var(--cell-size));
            grid-template-rows: repeat(var(--grid-size), var(--cell-size));
        }

        [data-conv-id="${instanceId}"] .feature-map {
            grid-template-columns: repeat(var(--output-size), var(--cell-size));
            grid-template-rows: repeat(var(--output-size), var(--cell-size));
        }

        [data-conv-id="${instanceId}"] .cell {
            border: 1px solid #ddd;
            background-color: #f0f0f0;
            box-sizing: border-box;
            width: var(--cell-size);
            height: var(--cell-size);
            display: block;
        }

        [data-conv-id="${instanceId}"] .cell.black {
            background-color: black;
            border-color: black;
        }

        /* Filter overlay that moves over the input grid */
        [data-conv-id="${instanceId}"] .filter-wrapper {
            position: absolute;
            /* Hier muss die Randgröße ebenfalls auf 1px reduziert werden */
            width: calc(var(--grid-size) * var(--cell-size) + 2 * var(--border-size)); 
            height: calc(var(--grid-size) * var(--cell-size) + 2 * var(--border-size));
            top: 0;
            left: 0;
            overflow: hidden;
            pointer-events: none;
            box-sizing: border-box;
        }

        [data-conv-id="${instanceId}"] .filter {
            position: absolute;
            width: calc(var(--filter-size) * var(--cell-size));
            height: calc(var(--filter-size) * var(--cell-size));
            border: var(--border-size) solid #00bfff;
            background-color: rgba(255,255,0,0.12);
            box-sizing: border-box;
            z-index: 10;
            opacity: 1;
            transform: translate(var(--border-size), var(--border-size));
            transition: transform 0ms ease-in-out, opacity var(--fade-duration) ease-in-out;
        }

        [data-conv-id="${instanceId}"] .filter.smooth {
            transition: transform var(--scan-duration) ease-in-out, opacity var(--fade-duration) ease-in-out;
        }

        [data-conv-id="${instanceId}"] .filter.hidden {
            opacity: 0;
        }

        [data-conv-id="${instanceId}"] .filter-pattern {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
            height: 100%;
            width: 100%;
            box-sizing: border-box;
        }

        [data-conv-id="${instanceId}"] .pattern-val {
            display: flex;
            justify-content: center;
            align-items: center;
            /* Font-Size stark reduziert */
            font-size: 0.5rem; 
            font-weight: bold;
            color: #00bfff;
            opacity: 0.9;
            border: 1px solid rgba(0,191,255,0.25);
            box-sizing: border-box;
        }

        [data-conv-id="${instanceId}"] .pattern-val[data-val="1"] {
            background-color: rgba(0,191,255,0.12);
        }

        /* Output cell visuals */
        [data-conv-id="${instanceId}"] .output-cell {
            border: 1px solid #333;
            display: flex;
            justify-content: center;
            align-items: center;
            /* Font-Size reduziert, um Überlauf zu vermeiden */
            font-size: calc(var(--cell-size) * 0.75); 
            font-weight: bold;
            background-color: #fff;
            color: #888;
            transition: background-color 0.12s, color 0.12s, transform 0.12s, opacity 500ms ease-in-out;
            width: var(--cell-size);
            height: var(--cell-size);
            box-sizing: border-box;
        }

        [data-conv-id="${instanceId}"] .output-cell[data-calculated="true"] {
            background-color: #d4edda;
            color: #155724;
        }

        [data-conv-id="${instanceId}"] .output-cell[data-value="1"] {
            background-color: #28a745;
            color: white;
            transform: scale(1.05);
        }

        [data-conv-id="${instanceId}"] .output-cell::before {
            content: attr(data-value);
        }

        [data-conv-id="${instanceId}"] .output-cell.reset {
            opacity: 0;
        }
    `;
}

// --- 2. HTML Template ---
function getConvolutionHtml(instanceId) {
    return `
        <div class="convolution-container" data-conv-id="${instanceId}" role="region" aria-label="Convolution demo">
            <div style="position:relative;" data-input-wrapper="true">
                <div class="grid input-grid" data-element-type="inputGrid" aria-hidden="false" role="grid">
                    <div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div>
                    <div class="cell"></div><div class="cell black"></div><div class="cell"></div><div class="cell black"></div><div class="cell"></div>
                    <div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div>
                    <div class="cell black"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell black"></div>
                    <div class="cell"></div><div class="cell black"></div><div class="cell black"></div><div class="cell black"></div><div class="cell"></div>
                </div>

                <div class="filter-wrapper" data-element-type="filterWrapper" aria-hidden="true">
                    <div class="filter" data-element-type="filter" aria-hidden="true">
                        <div class="filter-pattern" data-element-type="filterPattern">
                            <div class="pattern-val" data-val="0">0</div><div class="pattern-val" data-val="0">0</div><div class="pattern-val" data-val="0">0</div>
                            <div class="pattern-val" data-val="0">0</div><div class="pattern-val" data-val="1">1</div><div class="pattern-val" data-val="0">0</div>
                            <div class="pattern-val" data-val="0">0</div><div class="pattern-val" data-val="0">0</div><div class="pattern-val" data-val="0">0</div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div class="grid feature-map" data-element-type="outputGrid" aria-hidden="false" role="grid"></div>
            </div>
        </div>
    `;
}

// --- 3. ConvolutionVisualizer Class ---
class ConvolutionVisualizer {
    constructor(containerElement, options = {}) {
        if (!containerElement) throw new Error('Container element is required.');

        this.container = containerElement;
        this.instanceId = 'conv-instance-' + Math.random().toString(36).substring(2, 9);
        this.isRunning = false;

        // Konfiguration (inkl. neuer Max-Breite)
        this.SCAN_DURATION_MS = 1000;
        this.FADE_DURATION_MS = 150;
        this.RESET_DURATION_MS = 500;
        this.GRID_SIZE = 5;
        this.FILTER_SIZE = 3;
        this.OUTPUT_SIZE = 3;
        this.MATCH_THRESHOLD = 0;
        // FIX: Max width bleibt bei 150px
        this.MAX_WIDTH_PX = options.maxWidth || 150; 
        this.KERNEL = [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0]
        ];

        // Setup the DOM and CSS
        this.setupDOM();
        this.initOutputGrid();
        
        // Start the responsiveness observer
        this.setupResponsiveness();

        // Start the simulation loop
        this.startSimulationLoop();
    }

    setupDOM() {
        // 1. Inject scoped CSS
        const style = document.createElement('style');
        style.setAttribute('data-conv-instance-id', this.instanceId);
        style.textContent = getConvolutionStyles(this.instanceId);
        document.head.appendChild(style);

        // 2. Inject HTML and set configured max-width
        this.container.setAttribute('data-conv-id', this.instanceId);
        this.container.style.maxWidth = this.MAX_WIDTH_PX + 'px'; // Setzt die Max-Breite
        this.container.innerHTML = getConvolutionHtml(this.instanceId);

        // 3. Element References
        this.convolutionContainer = this.container.querySelector('.convolution-container');
        this.inputGrid = this.container.querySelector('[data-element-type="inputGrid"]');
        this.outputGrid = this.container.querySelector('[data-element-type="outputGrid"]');
        this.filterElement = this.container.querySelector('[data-element-type="filter"]');
        
        // Input-Wrapper (div mit position: relative)
        this.inputGridContainer = this.container.querySelector('[data-input-wrapper="true"]');
        // WICHTIGE ZUSATZREGEL: Stellt sicher, dass der Wrapper im gestapelten Zustand die volle Breite einnimmt.
        this.inputGridContainer.style.width = '100%';

        this.filterPatternElement = this.container.querySelector('[data-element-type="filterPattern"]');


        // 4. Set initial CSS variables
        this.setCssVariables();
        this.updateFilterPattern();
    }
    
    getNumberCsVar(name, fallback) {
        const style = getComputedStyle(this.container);
        const v = style.getPropertyValue(name).trim();
        const parsed = parseFloat(v);
        return isNaN(parsed) ? fallback : parsed;
    }

    // ACHTUNG: Die border-size ist jetzt 1px im CSS festgelegt
    getCellSize() { return Math.round(this.getNumberCsVar('--cell-size', 60)); }
    getBorderSize() { return Math.round(this.getNumberCsVar('--border-size', 1)); }

    setCssVariables() {
        this.container.style.setProperty('--grid-size', String(this.GRID_SIZE));
        this.container.style.setProperty('--filter-size', String(this.FILTER_SIZE));
        this.container.style.setProperty('--output-size', String(this.OUTPUT_SIZE));
        this.container.style.setProperty('--scan-duration', this.SCAN_DURATION_MS + 'ms');
        this.container.style.setProperty('--fade-duration', this.FADE_DURATION_MS + 'ms');
    }

    updateFilterPattern() {
        if (!this.filterPatternElement) return;

        let flatKernel = this.KERNEL.flat();
        let patternVals = this.filterPatternElement.querySelectorAll('.pattern-val');
        
        patternVals.forEach((cell, index) => {
            const val = flatKernel[index] || 0;
            const displayVal = typeof val === 'number' && val % 1 !== 0 ? val.toFixed(2) : val;
            cell.textContent = displayVal;
            cell.setAttribute('data-val', val !== 0 ? '1' : '0'); 
        });
    }

    setKernel(newKernel) {
        if (newKernel && newKernel.length === this.FILTER_SIZE && newKernel.every(row => row.length === this.FILTER_SIZE)) {
            this.KERNEL = newKernel;
            this.updateFilterPattern();
            this.resetSimulation(true); 
        } else {
            console.error(`Kernel must be a ${this.FILTER_SIZE}x${this.FILTER_SIZE} array.`);
        }
    }

    /* ------------------------------
     * Responsiveness and Sizing
     * ------------------------------ */

    computeAndApplySizes() {
        // Sicherstellen, dass die DOM-Breiten aktuell sind
        void this.convolutionContainer.offsetWidth; 
        
        // Verfügbare Breite des inneren Containers, der die 100% Breite des Elternelements hat
        const availableWidth = this.convolutionContainer.getBoundingClientRect().width;
        
        const borderSize = this.getBorderSize(); // Jetzt 1px
        // FIX 8: Sicherheitsabstand auf 2px reduziert
        const safety = 2; 

        // Das Layout ist immer gestapelt (flex-direction: column)
        const widthForCells = availableWidth - (2 * borderSize) - safety;
        const totalCells = this.GRID_SIZE; // 5 Zellen
        
        const maxCellByWidth = Math.floor(widthForCells / totalCells);
        
        // FIX 6: Setze die minimale Zellgröße auf 3px
        const effectiveCellSize = Math.max(3, maxCellByWidth); 

        // Wenden Sie die berechnete Größe an
        this.container.style.setProperty('--cell-size', effectiveCellSize + 'px');
        
        // Filter neu positionieren
        this.filterElement.style.transform = `translate(${borderSize}px, ${borderSize}px)`;
    }

    setupResponsiveness() {
        this.resizeObserver = new ResizeObserver(() => {
            try {
                this.computeAndApplySizes();
            } catch (err) {
                console.error('ResizeObserver handler failed:', err);
            }
        });

        if (this.container.parentElement) {
            this.resizeObserver.observe(this.container.parentElement);
        }
        this.resizeObserver.observe(this.container);
        this.resizeObserver.observe(this.convolutionContainer); 

        this.computeAndApplySizes(); // Initialer Aufruf
    }

    /* ------------------------------
     * Simulation logic
     * ------------------------------ */

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

    getInputData() {
        const data = [];
        const cells = this.inputGrid.querySelectorAll('.cell');
        cells.forEach(cell => {
            data.push(cell.classList.contains('black') ? 1 : 0);
        });
        const matrix = [];
        for (let i = 0; i < this.GRID_SIZE; i++) {
            matrix.push(data.slice(i * this.GRID_SIZE, (i + 1) * this.GRID_SIZE));
        }
        return matrix;
    }

    performConvolution(inputMatrix, row, col) {
        let result = 0;
        for (let i = 0; i < this.FILTER_SIZE; i++) {
            for (let j = 0; j < this.FILTER_SIZE; j++) {
                const inputVal = inputMatrix[row + i][col + j];
                const kernelVal = this.KERNEL[i][j];
                result += inputVal * kernelVal;
            }
        }
        return result > this.MATCH_THRESHOLD ? 1 : 0;
    }

    setFilterTransformInstant(x, y) {
        this.filterElement.classList.remove('smooth');
        this.filterElement.style.transform = `translate(${x}px, ${y}px)`;
    }

    setFilterTransformSmooth(x, y) {
        this.filterElement.classList.add('smooth');
        void this.filterElement.offsetWidth; // force reflow
        this.filterElement.style.transform = `translate(${x}px, ${y}px)`;
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    nextAnimationFrame() {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });
    }

    waitForFadeComplete() {
        return this.wait(this.FADE_DURATION_MS + 10);
    }

    startSimulationLoop() {
        this.isRunning = true;
        this.startConvolutionSimulation();
    }

    stopSimulationLoop() {
        this.isRunning = false;
    }

    resetSimulation(restartImmediately = false) {
        if (!this.isRunning) return;

        const outputCells = this.outputGrid.querySelectorAll('.output-cell');
        this.filterElement.classList.add('hidden');

        outputCells.forEach(cell => { cell.classList.add('reset'); });

        setTimeout(() => {
            const border = this.getBorderSize();
            this.setFilterTransformInstant(border, border);

            outputCells.forEach(cell => {
                cell.setAttribute('data-value', '?');
                cell.removeAttribute('data-calculated');
                cell.classList.remove('reset');
            });

            requestAnimationFrame(() => {
                this.filterElement.classList.remove('hidden');
                setTimeout(() => {
                    this.filterElement.classList.add('smooth');
                    if (restartImmediately) {
                        this.startConvolutionSimulation();
                    }
                }, 50);
            });
        }, this.RESET_DURATION_MS);
    }

    async startConvolutionSimulation() {
        if (!this.isRunning) return;
        
        try {
            if (this.outputGrid.childElementCount === 0) {
                this.initOutputGrid();
            }

            const inputData = this.getInputData();
            const outputCells = this.outputGrid.querySelectorAll('.output-cell');
            const totalSteps = this.OUTPUT_SIZE * this.OUTPUT_SIZE;

            this.computeAndApplySizes(); 
            const border = this.getBorderSize();
            this.setFilterTransformInstant(border, border);

            await this.nextAnimationFrame();
            this.filterElement.classList.add('smooth');

            for (let step = 0; step < totalSteps; step++) {
                if (!this.isRunning) break; 

                const cellSize = this.getCellSize();
                const row = Math.floor(step / this.OUTPUT_SIZE);
                const col = step % this.OUTPUT_SIZE;
                
                const applyResult = (r, c, delay) => {
                    const result = this.performConvolution(inputData, r, c);
                    const idx = r * this.OUTPUT_SIZE + c;
                    const outCell = outputCells[idx];
                    if (outCell) {
                        setTimeout(() => {
                            if (!this.isRunning) return;
                            outCell.setAttribute('data-value', result);
                            outCell.setAttribute('data-calculated', 'true');
                        }, delay);
                    }
                };

                if (step === 0) {
                    this.setFilterTransformInstant(border, border);
                    applyResult(row, col, this.SCAN_DURATION_MS);
                    await this.wait(this.SCAN_DURATION_MS);
                    continue;
                }

                const prevRow = Math.floor((step - 1) / this.OUTPUT_SIZE);
                const prevCol = (step - 1) % this.OUTPUT_SIZE;
                const isRowChange = (col === 0 && prevCol === this.OUTPUT_SIZE - 1 && row === prevRow + 1);

                if (isRowChange) {
                    this.filterElement.classList.add('hidden');
                    await this.waitForFadeComplete();

                    const newX = 0 + border;
                    const newY = row * cellSize + border;
                    this.setFilterTransformInstant(newX, newY);

                    await this.nextAnimationFrame();

                    this.filterElement.classList.remove('hidden');
                    await this.waitForFadeComplete();
                    this.filterElement.classList.add('smooth');
                }

                const tx = col * cellSize + border;
                const ty = row * cellSize + border;

                this.setFilterTransformSmooth(tx, ty);
                
                applyResult(row, col, this.SCAN_DURATION_MS);

                await this.wait(this.SCAN_DURATION_MS);
            }

            if (this.isRunning) {
                this.resetSimulation(true); 
            }

        } catch (err) {
            console.error('Simulation failed:', err);
            if (this.isRunning) {
                this.resetSimulation(true);
            }
        }
    }

    // Public method for cleanup 
    remove() {
        this.stopSimulationLoop();
        if (this.container.parentElement) {
            this.resizeObserver.unobserve(this.container.parentElement);
        }
        this.resizeObserver.unobserve(this.container);
        this.resizeObserver.unobserve(this.convolutionContainer); 
        
        const style = document.querySelector(`style[data-conv-instance-id="${this.instanceId}"]`);
        if (style) style.remove();
        
        this.container.innerHTML = '';
        this.container.removeAttribute('data-conv-id');
        this.container.style.maxWidth = ''; // Reset style
        delete this.container.visualizer;
    }
}

// --- 4. Initialization Function ---
/**
 * Initialisiert alle Convolution Visualizer.
 * @param {string} selector CSS-Selektor für die Container-Elemente (Standard: '.conv_visual_explanation').
 * @param {object} options Konfigurationsoptionen.
 * @param {number} [options.maxWidth=150] Maximale Breite des Visualizers in Pixeln.
 */
window.make_conv_visual_explanation = function(selector = '.conv_visual_explanation', options = {}) {
    // Wenn options ein numerischer Wert ist, behandle es als maxWidth
    if (typeof options === 'number') {
        options = { maxWidth: options };
    }
    
    const containers = document.querySelectorAll(selector);
    containers.forEach(container => {
        // Only initialize if not already done
        if (!container.visualizer) {
            try {
                const visualizer = new ConvolutionVisualizer(container, options);
                // Attach the instance to the DOM element for external control
                container.visualizer = visualizer; 
            } catch (error) {
                console.error('Failed to initialize ConvolutionVisualizer for element:', container, error);
            }
        }
    });
};
