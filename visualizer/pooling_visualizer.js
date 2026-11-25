/* ----------------------------------------------------
 * pooling_visualizer.js
 * Encapsulated script for creating multiple general pooling
 * (Max or Average) simulation instances on a single page.
 * ---------------------------------------------------- */

// --- 1. Encapsulated CSS ---
function getMaxpoolingStyles(instanceId) {
	return `
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
	    display: inline-grid;
	    box-shadow: 0 4px 10px rgba(0,0,0,0.08); 
	    background-color: #ddd; 
	    box-sizing: border-box;
	    border: 1px solid #ddd; /* Äußerer Rahmen */
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
	    border: 0.5px solid #ccc; /* Dünnere Linien für bessere Ausrichtung */
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
	    /* Exakte Größe des Grids inkl. aller internen Linien */
	    width: 100%;
	    height: 100%;
	    top: 0;
	    left: 0;
	    overflow: hidden;
	    pointer-events: none;
	}

	[data-mp-id="${instanceId}"] .pooling-window {
	    position: absolute;
	    /* Das Fenster muss minimal größer sein, um die Border der Zellen zu überlagern */
	    width: calc(var(--filter-size) * var(--cell-size));
	    height: calc(var(--filter-size) * var(--cell-size));
	    border: 2px solid #ff8c00; 
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

	[data-mp-id="${instanceId}"] .cell.max-value {
	    background-color: #ff8c00;
	    color: white;
	}

	[data-mp-id="${instanceId}"] .output-cell[data-calculated="true"] {
	    background-color: #ffe6cc;
	    color: #cc7000;
	    border-color: #ff8c00;
	}

	[data-mp-id="${instanceId}"] .output-cell::before {
	    content: attr(data-value);
	}
    `;
}

// --- 2. HTML Template ---
function getMaxpoolingHtml(instanceId) {
	return `
	<div class="maxpooling-container" data-mp-id="${instanceId}">
	    <div style="position:relative; display:inline-block;" data-input-wrapper="true">
            <div class="grid input-grid" data-element-type="inputGrid">
                <div class="cell" data-value="1">1</div><div class="cell" data-value="3">3</div><div class="cell" data-value="2">2</div><div class="cell" data-value="4">4</div>
                <div class="cell" data-value="0">0</div><div class="cell" data-value="5">5</div><div class="cell" data-value="1">1</div><div class="cell" data-value="0">0</div>
                <div class="cell" data-value="6">6</div><div class="cell" data-value="2">2</div><div class="cell" data-value="7">7</div><div class="cell" data-value="3">3</div>
                <div class="cell" data-value="1">1</div><div class="cell" data-value="0">0</div><div class="cell" data-value="4">4</div><div class="cell" data-value="8">8</div>
            </div>
            <div class="pooling-wrapper">
                <div class="pooling-window" data-element-type="poolingWindow"></div>
            </div>
	    </div>
        <div style="font-size: 20px; margin: 5px 0;">&darr;</div>
	    <div class="grid feature-map" data-element-type="outputGrid"></div>
	</div>
    `;
}

// --- 3. PoolingVisualizer Class ---
class PoolingVisualizer {
	constructor(containerElement, options = {}) {
		this.container = containerElement;
		this.instanceId = 'mp-instance-' + Math.random().toString(36).substring(2, 9);
		this.isRunning = false;

		this.SCAN_DURATION_MS = 1500;
		this.GRID_SIZE = options.gridSize || 4;
		this.FILTER_SIZE = options.filterSize || 2;
		this.STRIDE_SIZE = options.strideSize || 2;
		this.POOLING_TYPE = options.poolingType || 'max';
		this.OUTPUT_SIZE = Math.floor((this.GRID_SIZE - this.FILTER_SIZE) / this.STRIDE_SIZE + 1);
		this.MAX_WIDTH_PX = options.maxWidth || 150;

		this.setupDOM();
		this.initOutputGrid();
		this.setupResponsiveness();
		this.startSimulationLoop();
	}

	setupDOM() {
		const style = document.createElement('style');
		style.textContent = getMaxpoolingStyles(this.instanceId);
		document.head.appendChild(style);

		this.container.setAttribute('data-mp-id', this.instanceId);
		this.container.style.maxWidth = this.MAX_WIDTH_PX + 'px';
		this.container.innerHTML = getMaxpoolingHtml(this.instanceId);

		this.inputGrid = this.container.querySelector('[data-element-type="inputGrid"]');
		this.inputCells = this.inputGrid.querySelectorAll('.cell');
		this.outputGrid = this.container.querySelector('[data-element-type="outputGrid"]');
		this.poolingWindowElement = this.container.querySelector('[data-element-type="poolingWindow"]');

		this.container.style.setProperty('--grid-size', this.GRID_SIZE);
		this.container.style.setProperty('--output-size', this.OUTPUT_SIZE);
		this.container.style.setProperty('--filter-size', this.FILTER_SIZE);
	}

	computeAndApplySizes() {
		const containerWidth = this.container.getBoundingClientRect().width;
		// Wir ziehen 4px für die äußeren Grid-Borders ab
		const cellSize = Math.floor((containerWidth - 4) / this.GRID_SIZE);
		this.container.style.setProperty('--cell-size', Math.max(cellSize, 5) + 'px');
	}

	setupResponsiveness() {
		new ResizeObserver(() => this.computeAndApplySizes()).observe(this.container);
		this.computeAndApplySizes(); 
	}

	initOutputGrid() {
		this.outputGrid.innerHTML = '';
		for (let i = 0; i < this.OUTPUT_SIZE * this.OUTPUT_SIZE; i++) {
			const cell = document.createElement('div');
			cell.classList.add('output-cell');
			cell.setAttribute('data-value', '?');
			this.outputGrid.appendChild(cell);
		}
	}

	async startSimulationLoop() {
		this.isRunning = true;
		const outputCells = this.outputGrid.querySelectorAll('.output-cell');
		const inputData = Array.from(this.inputCells).map(c => parseInt(c.getAttribute('data-value')));

		while (this.isRunning) {
			outputCells.forEach(c => {
				c.removeAttribute('data-calculated');
				c.setAttribute('data-value', '?');
			});

			for (let r = 0; r < this.OUTPUT_SIZE; r++) {
				for (let c = 0; c < this.OUTPUT_SIZE; c++) {
					if (!this.isRunning) return;

					const cellSize = parseFloat(getComputedStyle(this.container).getPropertyValue('--cell-size'));
					
					// FIX: Die Verschiebung muss die Zellgröße berücksichtigen. 
					// Da die Zellen "box-sizing: border-box" nutzen, liegen sie Kante an Kante.
					const tx = c * this.STRIDE_SIZE * cellSize;
					const ty = r * this.STRIDE_SIZE * cellSize;

					this.poolingWindowElement.classList.toggle('smooth', (r + c > 0));
					this.poolingWindowElement.style.transform = `translate(${tx}px, ${ty}px)`;

					await new Promise(res => setTimeout(res, this.SCAN_DURATION_MS));

					// Berechnung
					const startIdx = (r * this.STRIDE_SIZE) * this.GRID_SIZE + (c * this.STRIDE_SIZE);
					let vals = [];
					let indices = [];
					for(let i=0; i<this.FILTER_SIZE; i++) {
						for(let j=0; j<this.FILTER_SIZE; j++) {
							const idx = startIdx + (i * this.GRID_SIZE) + j;
							vals.push(inputData[idx]);
							indices.push(idx);
						}
					}

					const resVal = this.POOLING_TYPE === 'max' ? Math.max(...vals) : parseFloat((vals.reduce((a,b)=>a+b)/vals.length).toFixed(1));
					
					if (this.POOLING_TYPE === 'max') {
						const maxLocalIdx = vals.indexOf(Math.max(...vals));
						this.inputCells[indices[maxLocalIdx]].classList.add('max-value');
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
}

window.make_pooling_visualizer = function(selector = '.pooling_visualizer', options = {}) {
	document.querySelectorAll(selector).forEach(el => {
		if (!el.visualizer) el.visualizer = new PoolingVisualizer(el, options);
	});
};
