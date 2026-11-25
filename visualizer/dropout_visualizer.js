/* ----------------------------------------------------
 * dropout_visualizer_v5.js
 * Encapsulated script for visualizing the Dropout Layer
 * operation, using two vertically stacked grids and 
 * sequential masking highlighting.
 * ---------------------------------------------------- */

// --- 1. Utility Functions & Constants ---

// Maps a numeric value (0 to 1) to one of 8 distinct colors for consistency
const COLOR_PALETTE = [
    '#f8b195', // 1: Light Red
    '#f67280', // 2: Pink
    '#c06c84', // 3: Mauve
    '#6c5b7b', // 4: Purple
    '#355c7d', // 5: Dark Blue
    '#28a745', // 6: Green
    '#ffc107', // 7: Yellow
    '#007bff'  // 8: Blue
];
const DROPPED_COLOR = '#000000'; // Black for dropped (0) values
const ACTIVE_HIGHLIGHT_COLOR = '#28a745'; // Green for values that pass through
const DROPPED_HIGHLIGHT_COLOR = '#dc3545'; // Red for dropped values

function getColorForValue(value) {
    if (value <= 0.01) return DROPPED_COLOR; // Handle the "0.00" case
    // Map value (0.01 to 1.0) to an index in COLOR_PALETTE (0 to 7)
    const index = Math.min(Math.floor(value * COLOR_PALETTE.length), COLOR_PALETTE.length - 1);
    return COLOR_PALETTE[index];
}

// --- 2. Encapsulated CSS ---
function getDropoutStyles(instanceId, rows, cols) {
    return `
	/* General setup and variables for instance ${instanceId} */
	[data-dropout-id="${instanceId}"] {
	    /* Visual defaults */
	    --cell-size: 35px;
	    --grid-rows: ${rows};
	    --grid-cols: ${cols};
	    --anim-duration: 400ms; 
	    --flow-delay: 450ms; /* Delay for slower sequential step */
	    --reset-duration: 1200ms; 
	    --gap-size: 5px; 
	    
	    /* Colors */
	    --color-dropped: ${DROPPED_COLOR};

	    /* Page skeleton */
	    display: flex;
	    flex-direction: column;
	    align-items: center;
	    font-family: Arial, sans-serif;
	    padding: 10px; 
	    box-sizing: border-box;
	    width: 100%;
	}

	[data-dropout-id="${instanceId}"] .dropout-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px; 
		width: 100%;
	}

    /* Grid Block Container */
	[data-dropout-id="${instanceId}"] .grid-block {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

	[data-dropout-id="${instanceId}"] .feature-grid {
		display: grid;
		grid-template-columns: repeat(var(--grid-cols), var(--cell-size));
		grid-template-rows: repeat(var(--grid-rows), var(--cell-size));
		gap: var(--gap-size);
		padding: 5px;
		border: 1px solid #ced4da;
        border-radius: 6px;
	}

	[data-dropout-id="${instanceId}"] .grid-cell {
		width: var(--cell-size);
		height: var(--cell-size);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: bold;
		color: #fff;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		transition: background-color var(--anim-duration), box-shadow var(--anim-duration);
	}

    /* Cell States */
    [data-dropout-id="${instanceId}"] .grid-cell.dropped-value {
		background-color: var(--color-dropped) !important; /* Forces black for 0 */
		color: #fff;
	}

    /* Animation/Highlighting */
    [data-dropout-id="${instanceId}"] .grid-cell.active-pass {
        box-shadow: 0 0 10px 3px ${ACTIVE_HIGHLIGHT_COLOR};
    }
    [data-dropout-id="${instanceId}"] .grid-cell.dropped-pulse {
        box-shadow: 0 0 10px 3px ${DROPPED_HIGHLIGHT_COLOR};
    }
    
    /* Dropout Arrow/Label Block */
	[data-dropout-id="${instanceId}"] .dropout-arrow-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 10px 0; /* Reduced margin */
	}
	[data-dropout-id="${instanceId}"] .dropout-arrow-block .arrow {
		font-size: 40px;
		color: #6c757d;
		line-height: 0.5; /* Tighten the space around the arrow */
	}
	[data-dropout-id="${instanceId}"] .dropout-arrow-block .label {
		font-size: 14px;
		font-weight: bold;
		color: #343a40;
		margin-top: 5px;
		letter-spacing: 1px;
	}

	[data-dropout-id="${instanceId}"] h3 {
		font-size: 16px;
		color: #343a40;
		margin-bottom: 5px;
	}

	[data-dropout-id="${instanceId}"] .description {
		margin-top: 15px;
		font-style: italic;
		color: #6c757d;
		font-size: 14px;
	}
	`;
}

// --- 3. DropoutVisualizer Class ---
class DropoutVisualizer {
	constructor(container, options = {}) {
		this.container = container;
		this.instanceId = this.generateId();

		this.options = {
			gridRows: options.gridRows || 4, 
			gridCols: options.gridCols || 4,
			dropoutRate: options.dropoutRate || 0.25, 
		};

        this.inputCount = this.options.gridRows * this.options.gridCols;
		
		this.ANIM_DURATION_MS = 400; 
		this.FLOW_DELAY_MS = 450; 
		this.RESET_DURATION_MS = 1200; 

		this.isRunning = false;
		this.animationFrameId = null;

		this.init();
	}

	generateId() {
		return 'dropout-' + Math.random().toString(36).substr(2, 9);
	}

	init() {
		// 1. Apply styles
		const style = document.createElement('style');
		style.setAttribute('data-dropout-instance-id', this.instanceId);
		style.innerHTML = getDropoutStyles(this.instanceId, this.options.gridRows, this.options.gridCols);
		document.head.appendChild(style);

		// 2. Set ID attribute
		this.container.setAttribute('data-dropout-id', this.instanceId);
		
		// 3. Initial state
		this.INPUT_DATA = this.generateInputData();

		// 4. Build DOM
		this.initElements();

		// 5. Start loop
		this.startLoop();
	}

	wait(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
    
    // Generates random input values and assigns colors
	generateInputData() {
        const data = [];
        for (let i = 0; i < this.inputCount; i++) {
            const val = (Math.random() * 0.9 + 0.1); // Ensure value is between 0.1 and 1.0
            data.push({
                value: parseFloat(val.toFixed(2)),
                color: getColorForValue(val),
                isDropped: false, // Initial state
            });
        }
        return data;
    }
    
    // Applies a random dropout mask
    applyDropoutMask() {
        this.INPUT_DATA.forEach(item => {
            item.isDropped = (Math.random() < this.options.dropoutRate);
        });
    }

	// --- 4. DOM Construction ---
	initElements() {
		this.container.innerHTML = ''; 

		const gridCellsHtml = (isOutput = false) => {
            return this.INPUT_DATA.map((item, i) => {
                const initialValue = item.value.toFixed(2);
                const initialColor = item.color;
                return `
                    <div class="grid-cell ${isOutput ? 'output-cell' : 'input-cell'}" 
                         data-index="${i}" 
                         style="background-color: ${initialColor};" 
                         title="Value: ${initialValue}">
                        ${initialValue}
                    </div>
                `;
            }).join('');
        };

		const ratePercent = (this.options.dropoutRate * 100).toFixed(0);
		
		const html = `
			<div class="dropout-container">
                <div class="grid-block">
                    <div class="feature-grid input-grid">
                        ${gridCellsHtml(false)}
                    </div>
                </div>
                
                <div class="dropout-arrow-block">
                    <div class="arrow">↓</div>
                </div>
                
                <div class="grid-block">
                    <div class="feature-grid output-grid">
                        ${gridCellsHtml(true)}
                    </div>
                </div>
			</div>
		`;
		
		this.container.innerHTML = html;
		this.inputCells = this.container.querySelectorAll('.input-grid .grid-cell');
		this.outputCells = this.container.querySelectorAll('.output-grid .grid-cell');
	}

	// --- 5. Animation Logic ---
	async runDropoutAnimation() {
		this.isRunning = true;

		// 0. Generate new input and mask, then reset all cells
        this.INPUT_DATA = this.generateInputData();
        this.applyDropoutMask();
        
        // Reset and update base colors/values for both grids
        this.inputCells.forEach((el, i) => {
            const item = this.INPUT_DATA[i];
            el.innerHTML = item.value.toFixed(2);
            el.style.backgroundColor = item.color;
            el.classList.remove('active-pass', 'dropped-pulse');
        });

        this.outputCells.forEach((el, i) => {
            const item = this.INPUT_DATA[i];
            el.innerHTML = item.value.toFixed(2);
            el.style.backgroundColor = item.color;
            el.classList.remove('dropped-value', 'active-pass', 'dropped-pulse');
        });

		await this.wait(50); // Pause for visual reset

		// 1. Sequentially apply mask and highlight the action
        for (let i = 0; i < this.inputCount; i++) {
            const item = this.INPUT_DATA[i];
            const inputCell = this.inputCells[i];
            const outputCell = this.outputCells[i];
            
            if (item.isDropped) {
                // ACTION: Dropout - The value is zeroed/blacked out in the OUTPUT grid
                
                // 1a. Instant change in Output Grid
                outputCell.innerHTML = '0.00';
                outputCell.style.backgroundColor = DROPPED_COLOR;
                outputCell.classList.add('dropped-value');

                // 1b. Pulse highlight in both grids
                inputCell.classList.add('dropped-pulse');
                outputCell.classList.add('dropped-pulse');
            } else {
                // ACTION: Pass-Through - The value remains unchanged

                // 2b. Pulse highlight in both grids
                inputCell.classList.add('active-pass');
                outputCell.classList.add('active-pass');
            }

            // Wait for the slow visualization of the current cell's fate
            await this.wait(this.FLOW_DELAY_MS);
            
            // Remove pulse highlight
            inputCell.classList.remove('active-pass', 'dropped-pulse');
            outputCell.classList.remove('active-pass', 'dropped-pulse');
            
            // Wait briefly before moving to the next cell
            await this.wait(this.FLOW_DELAY_MS / 4);
        }

		// 2. Wait for loop reset
		await this.wait(this.RESET_DURATION_MS);

		this.isRunning = false;
	}

	// --- 6. Main Loop ---
	startLoop() {
		const loop = () => {
			if (this.isRunning) {
				this.animationFrameId = requestAnimationFrame(loop);
				return;
			}

			this.runDropoutAnimation().then(() => {
				setTimeout(() => {
					this.animationFrameId = requestAnimationFrame(loop);
				}, this.RESET_DURATION_MS); 
			});
		};

		this.animationFrameId = requestAnimationFrame(loop);
	}
}

// --- 7. Initialization Function ---
/**
 * Initialisiert alle Dropout Visualizer.
 * @param {string} selector CSS-Selektor für die Container-Elemente (Standard: '.dropout_visual_explanation').
 * @param {object} options Konfigurationsoptionen.
 * @param {number} [options.gridRows=4] Anzahl der Reihen im Input-Grid.
 * @param {number} [options.gridCols=4] Anzahl der Spalten im Input-Grid.
 * @param {number} [options.dropoutRate=0.25] Dropout-Wahrscheinlichkeit (z.B. 0.25 für 25%).
 */
window.make_dropout_visual_explanation = function(selector = '.dropout_visual_explanation', options = {}) {
	const containers = document.querySelectorAll(selector);
	containers.forEach(container => {
		if (!container.visualizer) {
			try {
				const visualizer = new DropoutVisualizer(container, options);
				container.visualizer = visualizer; 
			} catch (error) {
				console.error('Failed to initialize DropoutVisualizer:', error);
			}
		}
	});
};
