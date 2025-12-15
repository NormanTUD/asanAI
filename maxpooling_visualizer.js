/* ----------------------------------------------------
 * maxpooling_visualizer.js
 * Encapsulated script for creating multiple max-pooling
 * simulation instances on a single page.
 * ---------------------------------------------------- */

// --- 1. Encapsulated CSS ---
function getMaxpoolingStyles(instanceId) {
	return `
	/* General setup and variables for instance ${instanceId} */
	[data-mp-id="${instanceId}"] {
	    /* layout / behaviour */
	    --grid-size: 4; /* Input 4x4 */
	    --filter-size: 2; /* Pool 2x2 */
	    --stride-size: 2;
	    --output-size: 2; /* Output 2x2 */

	    /* visual defaults */
	    --cell-size: 35px; 
	    --border-size: 1px; 

	    /* transitions */
	    --scan-duration: 800ms;
	    --fade-duration: 150ms;

	    /* Page skeleton */
	    display: flex;
	    align-items: center;
	    justify-content: center;
	    font-family: Arial, sans-serif;
	    padding: 0px; 
	    box-sizing: border-box;
	    width: 100%;
	}

	/* The max-pooling area */
	[data-mp-id="${instanceId}"] .maxpooling-container {
	    width: 100%; 
	    display: flex;
	    flex-direction: column;
	    gap: 12px;
	    align-items: center;
	    position: relative;
	    box-sizing: border-box;
	    justify-content: center;
	}

	/* Grid base style (both input and output share) */
	[data-mp-id="${instanceId}"] .grid {
	    display: grid;
	    border: var(--border-size) solid #333;
	    box-shadow: 0 4px 10px rgba(0,0,0,0.08); 
	    background-color: #fff;
	    box-sizing: border-box;
	    max-width: 100%; 
	}

	/* Input Feature Map (e.g., a 4x4 grid) */
	[data-mp-id="${instanceId}"] .input-grid {
	    grid-template-columns: repeat(var(--grid-size), var(--cell-size));
	    grid-template-rows: repeat(var(--grid-size), var(--cell-size));
	}

	/* Output Pooled Feature Map (e.g., a 2x2 grid) */
	[data-mp-id="${instanceId}"] .feature-map {
	    grid-template-columns: repeat(var(--output-size), var(--cell-size));
	    grid-template-rows: repeat(var(--output-size), var(--cell-size));
	}

	[data-mp-id="${instanceId}"] .cell, 
	[data-mp-id="${instanceId}"] .output-cell {
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
	    transition: background-color 0.12s, color 0.12s;
	}

	/* Pooling window overlay */
	[data-mp-id="${instanceId}"] .pooling-wrapper {
	    position: absolute;
	    width: calc(var(--grid-size) * var(--cell-size) + 2 * var(--border-size)); 
	    height: calc(var(--grid-size) * var(--cell-size) + 2 * var(--border-size));
	    top: 0;
	    left: 0;
	    overflow: hidden;
	    pointer-events: none;
	    box-sizing: border-box;
	}

	[data-mp-id="${instanceId}"] .pooling-window {
	    position: absolute;
	    width: calc(var(--filter-size) * var(--cell-size));
	    height: calc(var(--filter-size) * var(--cell-size));
	    border: var(--border-size) solid #ff8c00; /* Deep Orange border */
	    background-color: rgba(255,140,0,0.15); /* Light orange background */
	    box-sizing: border-box;
	    z-index: 10;
	    opacity: 1;
	    transform: translate(var(--border-size), var(--border-size));
	    transition: transform 0ms ease-in-out, opacity var(--fade-duration) ease-in-out;
	}

	[data-mp-id="${instanceId}"] .pooling-window.smooth {
	    transition: transform var(--scan-duration) ease-in-out, opacity var(--fade-duration) ease-in-out;
	}

	[data-mp-id="${instanceId}"] .pooling-window.hidden {
	    opacity: 0;
	}

	/* Styling for the max-value cell in the input grid */
	[data-mp-id="${instanceId}"] .cell.max-value {
	    background-color: #ff8c00; /* Deep Orange */
	    color: white;
	    border-color: #cc7000;
	    transform: scale(1.05);
	}
    
    /* Styling for the calculated output cell */
	[data-mp-id="${instanceId}"] .output-cell[data-calculated="true"] {
	    background-color: #ffe6cc; /* Very light orange */
	    color: #cc7000; /* Darker orange text */
	    border-color: #ff8c00;
	}
	[data-mp-id="${instanceId}"] .output-cell::before {
	    content: attr(data-value);
	}
	[data-mp-id="${instanceId}"] .output-cell.reset {
	    opacity: 0;
	}
    `;
}

// --- 2. HTML Template ---
function getMaxpoolingHtml(instanceId) {
	return `
	<div class="maxpooling-container" data-mp-id="${instanceId}" role="region" aria-label="Max-Pooling demo">
	    <div style="position:relative;" data-input-wrapper="true">
            <div class="grid input-grid" data-element-type="inputGrid" aria-hidden="false" role="grid">
		        <div class="cell" data-value="1">1</div><div class="cell" data-value="3">3</div><div class="cell" data-value="2">2</div><div class="cell" data-value="4">4</div>
		        <div class="cell" data-value="0">0</div><div class="cell" data-value="5">5</div><div class="cell" data-value="1">1</div><div class="cell" data-value="0">0</div>
		        <div class="cell" data-value="6">6</div><div class="cell" data-value="2">2</div><div class="cell" data-value="7">7</div><div class="cell" data-value="3">3</div>
		        <div class="cell" data-value="1">1</div><div class="cell" data-value="0">0</div><div class="cell" data-value="4">4</div><div class="cell" data-value="8">8</div>
		    </div>

            <div class="pooling-wrapper" data-element-type="poolingWrapper" aria-hidden="true">
		        <div class="pooling-window" data-element-type="poolingWindow" aria-hidden="true">
		            </div>
		    </div>
	    </div>

        <div>
		    <div class="grid feature-map" data-element-type="outputGrid" aria-hidden="false" role="grid"></div>
	    </div>
	</div>
    `;
}

// --- 3. MaxpoolingVisualizer Class ---
class MaxpoolingVisualizer {
	constructor(containerElement, options = {}) {
		if (!containerElement) throw new Error('Container element is required.');

		this.container = containerElement;
		this.instanceId = 'mp-instance-' + Math.random().toString(36).substring(2, 9);
		this.isRunning = false;

		// Configuration
		this.SCAN_DURATION_MS = 2000;
		this.FADE_DURATION_MS = 300;
		this.RESET_DURATION_MS = 500;

		// Default Max-Pooling parameters (4x4 input, 2x2 filter, stride 2 -> 2x2 output)
		this.GRID_SIZE = options.gridSize || 4;
		this.FILTER_SIZE = options.filterSize || 2;
		this.STRIDE_SIZE = options.strideSize || 2;
		this.OUTPUT_SIZE = (this.GRID_SIZE - this.FILTER_SIZE) / this.STRIDE_SIZE + 1;
		
		if (this.OUTPUT_SIZE % 1 !== 0) {
            console.warn(`Pooling parameters result in a fractional output size. GRID_SIZE: ${this.GRID_SIZE}, FILTER_SIZE: ${this.FILTER_SIZE}, STRIDE_SIZE: ${this.STRIDE_SIZE}. The visualizer might behave unexpectedly.`);
            this.OUTPUT_SIZE = Math.floor(this.OUTPUT_SIZE);
        }

		this.MAX_WIDTH_PX = options.maxWidth || 150;

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
		style.setAttribute('data-mp-instance-id', this.instanceId);
		style.textContent = getMaxpoolingStyles(this.instanceId);
		document.head.appendChild(style);

		// 2. Inject HTML and set configured max-width
		this.container.setAttribute('data-mp-id', this.instanceId);
		this.container.style.maxWidth = this.MAX_WIDTH_PX + 'px';
		this.container.innerHTML = getMaxpoolingHtml(this.instanceId);

		// 3. Element References
		this.poolingContainer = this.container.querySelector('.maxpooling-container');
		this.inputGrid = this.container.querySelector('[data-element-type="inputGrid"]');
		this.inputCells = this.inputGrid.querySelectorAll('.cell');
		this.outputGrid = this.container.querySelector('[data-element-type="outputGrid"]');
		this.poolingWindowElement = this.container.querySelector('[data-element-type="poolingWindow"]');
		this.inputGridContainer = this.container.querySelector('[data-input-wrapper="true"]');
		this.inputGridContainer.style.width = '100%';

		// 4. Set initial CSS variables
		this.setCssVariables();
	}

	getNumberCsVar(name, fallback) {
		const style = getComputedStyle(this.container);
		const v = style.getPropertyValue(name).trim();
		const parsed = parseFloat(v);
		return isNaN(parsed) ? fallback : parsed;
	}

	getCellSize() { return Math.round(this.getNumberCsVar('--cell-size', 35)); }
	getBorderSize() { return Math.round(this.getNumberCsVar('--border-size', 1)); }

	setCssVariables() {
		this.container.style.setProperty('--grid-size', String(this.GRID_SIZE));
		this.container.style.setProperty('--filter-size', String(this.FILTER_SIZE));
		this.container.style.setProperty('--stride-size', String(this.STRIDE_SIZE));
		this.container.style.setProperty('--output-size', String(this.OUTPUT_SIZE));
		this.container.style.setProperty('--scan-duration', this.SCAN_DURATION_MS + 'ms');
		this.container.style.setProperty('--fade-duration', this.FADE_DURATION_MS + 'ms');
	}

	/* ------------------------------
	 * Responsiveness and Sizing
	 * ------------------------------ */

	computeAndApplySizes() {
		void this.poolingContainer.offsetWidth; 
		const availableWidth = this.poolingContainer.getBoundingClientRect().width;
		const borderSize = this.getBorderSize();
		const safety = 2; 

		const widthForCells = availableWidth - (2 * borderSize) - safety;
		const totalCells = this.GRID_SIZE;

		const maxCellByWidth = Math.floor(widthForCells / totalCells);
		const effectiveCellSize = Math.max(3, maxCellByWidth);

		this.container.style.setProperty('--cell-size', effectiveCellSize + 'px');

		// Reposition the window
		this.poolingWindowElement.style.transform = `translate(${borderSize}px, ${borderSize}px)`;
	}

	setupResponsiveness() {
		this.resizeObserver = new ResizeObserver(() => {
			try {
				this.computeAndApplySizes();
			} catch (err) {
				console.error('ResizeObserver handler failed:', err);
			}
		});

		// Observe the container itself and the main pooling area
		this.resizeObserver.observe(this.container);
		this.resizeObserver.observe(this.poolingContainer); 

		this.computeAndApplySizes(); // Initial call
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

	getInputMatrix() {
		const data = Array.from(this.inputCells).map(cell => parseInt(cell.getAttribute('data-value') || 0));
		const matrix = [];
		for (let i = 0; i < this.GRID_SIZE; i++) {
			matrix.push(data.slice(i * this.GRID_SIZE, (i + 1) * this.GRID_SIZE));
		}
		return matrix;
	}
    
    // Highlights the cell in the input grid that matches the output max-value
    highlightMaxCell(rowStart, colStart, maxValue) {
        // Clear previous highlights
        this.inputCells.forEach(cell => cell.classList.remove('max-value'));

        for (let i = 0; i < this.FILTER_SIZE; i++) {
			for (let j = 0; j < this.FILTER_SIZE; j++) {
                const r = rowStart + i;
                const c = colStart + j;
                const index = r * this.GRID_SIZE + c;
                
                if (index >= 0 && index < this.inputCells.length) {
                    const cellValue = parseInt(this.inputCells[index].getAttribute('data-value') || 0);
                    if (cellValue === maxValue) {
                        this.inputCells[index].classList.add('max-value');
                        // Highlight only the first match to avoid complex state
                        return; 
                    }
                }
			}
		}
    }


	performMaxpooling(inputMatrix, rowStart, colStart) {
		let maxVal = -Infinity;
		for (let i = 0; i < this.FILTER_SIZE; i++) {
			for (let j = 0; j < this.FILTER_SIZE; j++) {
				const inputVal = inputMatrix[rowStart + i][colStart + j];
				maxVal = Math.max(maxVal, inputVal);
			}
		}
		return maxVal;
	}

	setWindowTransformInstant(x, y) {
		this.poolingWindowElement.classList.remove('smooth');
		this.poolingWindowElement.style.transform = `translate(${x}px, ${y}px)`;
	}

	setWindowTransformSmooth(x, y) {
		this.poolingWindowElement.classList.add('smooth');
		void this.poolingWindowElement.offsetWidth; // force reflow
		this.poolingWindowElement.style.transform = `translate(${x}px, ${y}px)`;
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
		this.startMaxpoolingSimulation();
	}

	stopSimulationLoop() {
		this.isRunning = false;
	}

	resetSimulation(restartImmediately = false) {
		if (!this.isRunning) return;

		const outputCells = this.outputGrid.querySelectorAll('.output-cell');
		this.poolingWindowElement.classList.add('hidden');
        this.inputCells.forEach(cell => cell.classList.remove('max-value'));

		outputCells.forEach(cell => { cell.classList.add('reset'); });

		setTimeout(() => {
			const border = this.getBorderSize();
			this.setWindowTransformInstant(border, border);

			outputCells.forEach(cell => {
				cell.setAttribute('data-value', '?');
				cell.removeAttribute('data-calculated');
				cell.classList.remove('reset');
			});

			requestAnimationFrame(() => {
				this.poolingWindowElement.classList.remove('hidden');
				setTimeout(() => {
					this.poolingWindowElement.classList.add('smooth');
					if (restartImmediately) {
						this.startMaxpoolingSimulation();
					}
				}, 50);
			});
		}, this.RESET_DURATION_MS);
	}

	async startMaxpoolingSimulation() {
		if (!this.isRunning) return;

		try {
			if (this.outputGrid.childElementCount === 0) {
				this.initOutputGrid();
			}

			const inputData = this.getInputMatrix();
			const outputCells = this.outputGrid.querySelectorAll('.output-cell');
			const totalSteps = this.OUTPUT_SIZE * this.OUTPUT_SIZE;

			this.computeAndApplySizes(); 
			const border = this.getBorderSize();
			this.setWindowTransformInstant(border, border);

			await this.nextAnimationFrame();
			this.poolingWindowElement.classList.add('smooth');

			for (let step = 0; step < totalSteps; step++) {
				if (!this.isRunning) break; 

				const cellSize = this.getCellSize();
				const outputRow = Math.floor(step / this.OUTPUT_SIZE);
				const outputCol = step % this.OUTPUT_SIZE;
                
                // Calculate the starting index in the input grid based on stride
                const inputRowStart = outputRow * this.STRIDE_SIZE;
                const inputColStart = outputCol * this.STRIDE_SIZE;

                const applyResult = async (rStart, cStart) => {
					const result = this.performMaxpooling(inputData, rStart, cStart);
					const idx = outputRow * this.OUTPUT_SIZE + outputCol;
					const outCell = outputCells[idx];
					if (outCell) {
                        // Highlight the max cell *before* setting the output value
                        this.highlightMaxCell(rStart, cStart, result);

                        // Delay setting the output to match the window movement duration
                        await this.wait(this.SCAN_DURATION_MS * 0.5); 
                        
                        if (!this.isRunning) return;
                        outCell.setAttribute('data-value', result);
                        outCell.setAttribute('data-calculated', 'true');
                        
                        await this.wait(this.SCAN_DURATION_MS * 0.5);
                        this.inputCells.forEach(cell => cell.classList.remove('max-value'));
					}
				};
                
                // Calculate the final window translation (x, y)
                const tx = inputColStart * cellSize + border;
                const ty = inputRowStart * cellSize + border + (inputRowStart / this.STRIDE_SIZE * border); // Account for row border offset

                // Initial position is instant
				if (step === 0) {
                    this.setWindowTransformInstant(tx, ty);
                    await applyResult(inputRowStart, inputColStart);
                    continue;
                }

                // Smoothly slide the window to the new position
                this.setWindowTransformSmooth(tx, ty);

                // Calculate the output value and update the display
                await applyResult(inputRowStart, inputColStart);
			}

			if (this.isRunning) {
				this.resetSimulation(true); 
			}

		} catch (err) {
			console.error('Max-Pooling Simulation failed:', err);
			if (this.isRunning) {
				this.resetSimulation(true);
			}
		}
	}

	// Public method for cleanup 
	remove() {
		this.stopSimulationLoop();
        this.resizeObserver.disconnect();

		const style = document.querySelector(`style[data-mp-instance-id="${this.instanceId}"]`);
		if (style) style.remove();

		this.container.innerHTML = '';
		this.container.removeAttribute('data-mp-id');
		this.container.style.maxWidth = ''; // Reset style
		delete this.container.visualizer;
	}
}

// --- 4. Initialization Function ---
/**
 * Initialisiert alle Max-Pooling Visualizer.
 * @param {string} selector CSS-Selektor für die Container-Elemente (Standard: '.maxpooling_visual_explanation').
 * @param {object} options Konfigurationsoptionen.
 * @param {number} [options.maxWidth=150] Maximale Breite des Visualizers in Pixeln.
 * @param {number} [options.gridSize=4] Größe der quadratischen Eingabematrix (z.B. 4).
 * @param {number} [options.filterSize=2] Größe des quadratischen Pooling-Fensters (z.B. 2).
 * @param {number} [options.strideSize=2] Schritte, die das Pooling-Fenster pro Bewegung macht (z.B. 2).
 */
window.make_maxpooling_visual_explanation = function(selector = '.maxpooling_visual_explanation', options = {}) {
	// Wenn options ein numerischer Wert ist, behandle es als maxWidth
	if (typeof options === 'number') {
		options = { maxWidth: options };
	}

	const containers = document.querySelectorAll(selector);
	containers.forEach(container => {
		// Only initialize if not already done
		if (!container.visualizer) {
			try {
				const visualizer = new MaxpoolingVisualizer(container, options);
				// Attach the instance to the DOM element for external control
				container.visualizer = visualizer; 
			} catch (error) {
				console.error('Failed to initialize MaxpoolingVisualizer for element:', container, error);
			}
		}
	});
};
