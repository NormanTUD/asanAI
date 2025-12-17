/* ----------------------------------------------------
 * pooling_visualizer.js
 * Encapsulated script for creating multiple general pooling
 * (Max or Average) simulation instances on a single page.
 * ---------------------------------------------------- */

// --- 1. Encapsulated CSS ---
function getMaxpoolingStyles(instanceId) {
	return `
	/* General setup and variables for instance ${instanceId} */
	[data-mp-id="${instanceId}"] {
	    --grid-size: 4;
	    --filter-size: 2;
	    --stride-size: 2;
	    --output-size: 2;
	    --cell-size: 35px; 
	    --border-size: 1px; 
	    --scan-duration: 2000ms;
	    --fade-duration: 300ms;

	    display: flex;
	    align-items: center;
	    justify-content: center;
	    font-family: Arial, sans-serif;
	    padding: 0px; 
	    box-sizing: border-box;
	    width: 100%;
	}

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

	[data-mp-id="${instanceId}"] .grid {
	    display: inline-grid; /* Fix: Nur so breit wie der Inhalt */
	    box-shadow: 0 4px 10px rgba(0,0,0,0.08); 
	    background-color: #ddd; /* Als Border-Ersatz */
	    box-sizing: border-box;
	}

	[data-mp-id="${instanceId}"] .input-grid {
	    grid-template-columns: repeat(var(--grid-size), var(--cell-size));
	    grid-template-rows: repeat(var(--grid-size), var(--cell-size));
	}

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

	[data-mp-id="${instanceId}"] .pooling-wrapper {
	    position: absolute;
	    width: calc(var(--grid-size) * var(--cell-size)); 
	    height: calc(var(--grid-size) * var(--cell-size));
	    top: 0;
	    left: 0;
	    overflow: hidden;
	    pointer-events: none;
	}

	[data-mp-id="${instanceId}"] .pooling-window {
	    position: absolute;
	    width: calc(var(--filter-size) * var(--cell-size));
	    height: calc(var(--filter-size) * var(--cell-size));
	    border: 2px solid #ff8c00; /* Etwas dickerer Rand zur besseren Sichtbarkeit */
	    background-color: rgba(255,140,0,0.15);
	    box-sizing: border-box;
	    z-index: 10;
	    opacity: 1;
	    transform: translate(0, 0); 
	    transition: transform 0ms ease-in-out, opacity var(--fade-duration) ease-in-out;
	}

	[data-mp-id="${instanceId}"] .pooling-window.smooth {
	    transition: transform var(--scan-duration) ease-in-out, opacity var(--fade-duration) ease-in-out;
	}

	[data-mp-id="${instanceId}"] .pooling-window.hidden {
	    opacity: 0;
	}

	[data-mp-id="${instanceId}"] .cell.max-value {
	    background-color: #ff8c00;
	    color: white;
	    border-color: #cc7000;
	}

	[data-mp-id="${instanceId}"] .output-cell[data-calculated="true"] {
	    background-color: #ffe6cc;
	    color: #cc7000;
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
	<div class="maxpooling-container" data-mp-id="${instanceId}" role="region" aria-label="Pooling demo">
	    <div style="position:relative; display:inline-block;" data-input-wrapper="true">
            <div class="grid input-grid" data-element-type="inputGrid" role="grid">
                <div class="cell" data-value="1">1</div><div class="cell" data-value="3">3</div><div class="cell" data-value="2">2</div><div class="cell" data-value="4">4</div>
                <div class="cell" data-value="0">0</div><div class="cell" data-value="5">5</div><div class="cell" data-value="1">1</div><div class="cell" data-value="0">0</div>
                <div class="cell" data-value="6">6</div><div class="cell" data-value="2">2</div><div class="cell" data-value="7">7</div><div class="cell" data-value="3">3</div>
                <div class="cell" data-value="1">1</div><div class="cell" data-value="0">0</div><div class="cell" data-value="4">4</div><div class="cell" data-value="8">8</div>
            </div>
            <div class="pooling-wrapper" data-element-type="poolingWrapper">
                <div class="pooling-window" data-element-type="poolingWindow"></div>
            </div>
	    </div>
        <div style="font-size: 20px;">&darr;</div>
	    <div>
		    <div class="grid feature-map" data-element-type="outputGrid" role="grid"></div>
	    </div>
	</div>
    `;
}

// --- 3. PoolingVisualizer Class ---
class PoolingVisualizer {
	constructor(containerElement, options = {}) {
		if (!containerElement) throw new Error('Container element is required.');

		this.container = containerElement;
		this.instanceId = 'mp-instance-' + Math.random().toString(36).substring(2, 9);
		this.isRunning = false;

		this.SCAN_DURATION_MS = 2000;
		this.FADE_DURATION_MS = 300;
		this.RESET_DURATION_MS = 500;

		this.GRID_SIZE = options.gridSize || 4;
		this.FILTER_SIZE = options.filterSize || 2;
		this.STRIDE_SIZE = options.strideSize || 2;
		this.POOLING_TYPE = options.poolingType || 'max';
		this.OUTPUT_SIZE = (this.GRID_SIZE - this.FILTER_SIZE) / this.STRIDE_SIZE + 1;

		if (this.OUTPUT_SIZE % 1 !== 0) {
			this.OUTPUT_SIZE = Math.floor(this.OUTPUT_SIZE);
		}

		this.MAX_WIDTH_PX = options.maxWidth || 150;

		this.setupDOM();
		this.initOutputGrid();
		this.setupResponsiveness();
		this.startSimulationLoop();
	}

	setupDOM() {
		const style = document.createElement('style');
		style.setAttribute('data-mp-instance-id', this.instanceId);
		style.textContent = getMaxpoolingStyles(this.instanceId);
		document.head.appendChild(style);

		this.container.setAttribute('data-mp-id', this.instanceId);
		this.container.style.maxWidth = this.MAX_WIDTH_PX + 'px';
		this.container.innerHTML = getMaxpoolingHtml(this.instanceId);

		this.poolingContainer = this.container.querySelector('.maxpooling-container');
		this.inputGrid = this.container.querySelector('[data-element-type="inputGrid"]');
		this.inputCells = this.inputGrid.querySelectorAll('.cell');
		this.outputGrid = this.container.querySelector('[data-element-type="outputGrid"]');
		this.poolingWindowElement = this.container.querySelector('[data-element-type="poolingWindow"]');

		this.setCssVariables();
	}

	setCssVariables() {
		this.container.style.setProperty('--grid-size', String(this.GRID_SIZE));
		this.container.style.setProperty('--filter-size', String(this.FILTER_SIZE));
		this.container.style.setProperty('--stride-size', String(this.STRIDE_SIZE));
		this.container.style.setProperty('--output-size', String(this.OUTPUT_SIZE));
		this.container.style.setProperty('--scan-duration', this.SCAN_DURATION_MS + 'ms');
		this.container.style.setProperty('--fade-duration', this.FADE_DURATION_MS + 'ms');
	}

	computeAndApplySizes() {
		const containerWidth = this.container.getBoundingClientRect().width;
		// Fix: Wie im Upsampling-Script berechnen, um weiße Ränder zu vermeiden
		const cellSize = Math.floor((containerWidth - 2) / this.GRID_SIZE);
		const finalCellSize = Math.max(cellSize, 5);
		
		this.container.style.setProperty('--cell-size', finalCellSize + 'px');
	}

	setupResponsiveness() {
		this.resizeObserver = new ResizeObserver(() => {
			this.computeAndApplySizes();
		});
		this.resizeObserver.observe(this.container);
		this.computeAndApplySizes(); 
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

	getInputMatrix() {
		const data = Array.from(this.inputCells).map(cell => parseInt(cell.getAttribute('data-value') || 0));
		const matrix = [];
		for (let i = 0; i < this.GRID_SIZE; i++) {
			matrix.push(data.slice(i * this.GRID_SIZE, (i + 1) * this.GRID_SIZE));
		}
		return matrix;
	}

	findMaxCellIndex(inputMatrix, rowStart, colStart, maxValue) {
		for (let i = 0; i < this.FILTER_SIZE; i++) {
			for (let j = 0; j < this.FILTER_SIZE; j++) {
				if (inputMatrix[rowStart + i][colStart + j] === maxValue) {
					return (rowStart + i) * this.GRID_SIZE + (colStart + j);
				}
			}
		}
		return -1;
	}

	performPooling(inputMatrix, rowStart, colStart) {
		let sum = 0;
		let maxVal = -Infinity;
		for (let i = 0; i < this.FILTER_SIZE; i++) {
			for (let j = 0; j < this.FILTER_SIZE; j++) {
				const val = inputMatrix[rowStart + i][colStart + j];
				sum += val;
				if (this.POOLING_TYPE === 'max') maxVal = Math.max(maxVal, val);
			}
		}
		if (this.POOLING_TYPE === 'avg') return parseFloat((sum / (this.FILTER_SIZE * this.FILTER_SIZE)).toFixed(2));
		return maxVal;
	}

	setWindowTransform(tx, ty, smooth = true) {
		this.poolingWindowElement.classList.toggle('smooth', smooth);
		this.poolingWindowElement.style.transform = `translate(${tx}px, ${ty}px)`;
	}

	async startSimulationLoop() {
		this.isRunning = true;
		while (this.isRunning) {
			const inputMatrix = this.getInputMatrix();
			const outputCells = this.outputGrid.querySelectorAll('.output-cell');
			
			// Reset Output
			outputCells.forEach(cell => {
				cell.removeAttribute('data-calculated');
				cell.setAttribute('data-value', '?');
			});

			for (let r = 0; r < this.OUTPUT_SIZE; r++) {
				for (let c = 0; c < this.OUTPUT_SIZE; c++) {
					if (!this.isRunning) return;

					const cellSize = parseInt(getComputedStyle(this.container).getPropertyValue('--cell-size'));
					const tx = c * this.STRIDE_SIZE * cellSize;
					const ty = r * this.STRIDE_SIZE * cellSize;

					this.setWindowTransform(tx, ty, (r + c > 0));
					await new Promise(res => setTimeout(res, this.SCAN_DURATION_MS));

					const resVal = this.performPooling(inputMatrix, r * this.STRIDE_SIZE, c * this.STRIDE_SIZE);
					
					if (this.POOLING_TYPE === 'max') {
						const maxIdx = this.findMaxCellIndex(inputMatrix, r * this.STRIDE_SIZE, c * this.STRIDE_SIZE, resVal);
						if (maxIdx >= 0) this.inputCells[maxIdx].classList.add('max-value');
					}

					const outIdx = r * this.OUTPUT_SIZE + c;
					outputCells[outIdx].setAttribute('data-value', resVal);
					outputCells[outIdx].setAttribute('data-calculated', 'true');

					await new Promise(res => setTimeout(res, this.SCAN_DURATION_MS));
					this.inputCells.forEach(cell => cell.classList.remove('max-value'));
				}
			}
			await new Promise(res => setTimeout(res, 2000));
		}
	}

	stopSimulationLoop() {
		this.isRunning = false;
	}
}

window.make_pooling_visualizer = function(selector = '.pooling_visualizer', options = {}) {
	document.querySelectorAll(selector).forEach(container => {
		if (!container.visualizer) container.visualizer = new PoolingVisualizer(container, options);
	});
};
