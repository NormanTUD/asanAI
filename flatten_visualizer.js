/* ----------------------------------------------------
 * flatten_visualizer.js
 * Encapsulated script for visualizing the Flatten Layer
 * operation in a neural network.
 * ---------------------------------------------------- */

// --- 1. Encapsulated CSS ---
function getFlattenStyles(instanceId) {
	return `
	/* General setup and variables for instance ${instanceId} */
	[data-flatten-id="${instanceId}"] {
		/* Visual defaults */
		--cell-size: 30px;
		--grid-rows: 4;
		--grid-cols: 4;
		--anim-duration: 400ms;
		--reset-duration: 500ms; /* Dauer für den sanften Reset */
		--input-color: #007bff; 
		--output-color: #28a745; 
		--output-height: 20px; /* Platzhalter, wird dynamisch gesetzt */

		/* Page skeleton */
		display: flex;
		flex-direction: column;
		align-items: center;
		font-family: Arial, sans-serif;
		padding: 10px; 
		box-sizing: border-box;
		width: 100%;
		/* Max width is set via JS style.maxWidth */
	}

	[data-flatten-id="${instanceId}"] .flatten-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px; 
		width: 100%;
	}
	
	[data-flatten-id="${instanceId}"] h3 {
		font-size: 1rem;
		margin: 0;
		text-align: center;
	}

	/* Input Grid (Feature Map) */
	[data-flatten-id="${instanceId}"] .input-grid {
		display: grid;
		grid-template-columns: repeat(var(--grid-cols), var(--cell-size));
		grid-template-rows: repeat(var(--grid-rows), var(--cell-size));
		gap: 2px;
		border: 2px solid var(--input-color);
		box-shadow: 0 4px 10px rgba(0,0,0,0.1);
		position: relative;
	}

	[data-flatten-id="${instanceId}"] .input-cell {
		width: var(--cell-size);
		height: var(--cell-size);
		background-color: var(--input-color);
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		font-weight: bold;
		font-size: 0.7rem; 
		box-sizing: border-box;
		border: 1px solid rgba(255,255,255,0.4);
		transition: background-color 0.3s, opacity 0.5s;
		z-index: 1; /* Standard z-Index */
        /* Übergänge für Position und Transform hinzufügen, um den Reset smooth zu machen */
        transition: background-color 0.3s, opacity 0.5s, 
                    transform var(--anim-duration) ease-in-out, 
                    top var(--reset-duration) ease-out, 
                    left var(--reset-duration) ease-out;
	}
	
	/* Coloring based on data-value attribute (low activation proxy) */
	[data-flatten-id="${instanceId}"] .input-cell[data-value="0"] {
		background-color: lightgrey;
		color: #333;
	}
    
    /* Stil für verarbeitete Zellen */
	[data-flatten-id="${instanceId}"] .input-cell.faded {
		background-color: #e9ecef;
		color: #6c757d; 
		border: 1px solid #ced4da;
		opacity: 0.7; 
		transition: background-color 0.5s, opacity 0.5s;
	}

	/* Collection Point visualizer */
	[data-flatten-id="${instanceId}"] .collection-point {
		position: absolute;
		top: calc(var(--grid-rows) * var(--cell-size) + 10px); 
		left: 50%;
		transform: translateX(-50%);
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--output-color);
		opacity: 0; 
		transition: opacity 0.3s;
		z-index: 50;
	}

	/* Flattening Arrow/Separator */
	[data-flatten-id="${instanceId}"] .separator {
		font-size: 1rem; 
		color: #6c757d;
		font-weight: 300;
		text-align: center;
	}
	
	/* Compact text output (MathML-ähnlich) */
	[data-flatten-id="${instanceId}"] .output-text {
		font-family: monospace;
		color: #333;
		font-size: 0.7rem;
		max-width: 100%;
		text-align: left;
		opacity: 0.3;
		transition: opacity 0.3s;
		/* Feste Höhe, um Layout-Verschiebungen zu verhindern */
		height: var(--output-height);
		overflow: hidden; /* Sicherstellen, dass nichts überläuft */
	}
	
	/* Temporäre Klasse zur Messung der Höhe */
	[data-flatten-id="${instanceId}"] .output-measurer {
		visibility: hidden;
		position: absolute;
		/* Alle Layout-relevanten Stile müssen hier wiederholt werden */
		font-family: monospace;
		font-size: 0.7rem;
		max-width: 100%; 
		width: var(--max-width-px); /* Wichtig: Breite setzen */
		padding: 0;
		margin: 0;
		box-sizing: border-box;
		white-space: normal;
		word-break: break-all;
	}

	/* Animation Class for the 'Explode and Reassemble' effect */
	[data-flatten-id="${instanceId}"] .input-cell.animate-move {
		position: absolute;
		z-index: 100;
	}
    `;
}

// --- 2. HTML Template (Simplified Output) ---
function getFlattenHtml(instanceId) {
	return `
	<div class="flatten-container" data-flatten-id="${instanceId}" role="region" aria-label="Flatten Layer demo">
		<div class="input-grid" data-element-type="inputGrid" role="grid">
			<div class="collection-point" data-element-type="collectionPoint"></div>
		</div>
		
		<div class="separator">
			<span role="img" aria-label="Downwards arrow">↓</span> Flatten Layer
		</div>
		
		<div class="output-text" data-element-type="outputText" role="log">
		</div>
	</div>
    `;
}

// --- 3. FlattenVisualizer Class ---
class FlattenVisualizer {
	constructor(containerElement, options = {}) {
		if (!containerElement) throw new Error('Container element is required.');

		this.container = containerElement;
		this.instanceId = 'flatten-instance-' + Math.random().toString(36).substring(2, 9);
		this.isRunning = false;
        // isLooping ist immer true, da kein Stop-Button existiert
		this.isLooping = true; 
        this.animationFrameId = null;

		// Configuration
		this.GRID_ROWS = options.rows || 4;
		this.GRID_COLS = options.cols || 4;
		this.CELL_SIZE = options.cellSize || 30; // in px
		this.ANIMATION_DURATION_MS = options.animDuration || 1000;
        this.RESET_DURATION_MS = options.resetDuration || 500; // Dauer für den Reset
		this.MAX_WIDTH_PX = options.maxWidth || 210; 
		this.CELL_DATA = this.createInputData(); 
		this.currentOutputString = '[';
		this.totalCells = this.GRID_ROWS * this.GRID_COLS;

		// Setup the DOM and CSS
		this.setupDOM();
		
		// NEU: Höhe dynamisch bestimmen, nachdem DOM und Styles gesetzt sind
		this.outputHeightPx = this.calculateOutputHeightDynamically();
		this.container.style.setProperty('--output-height', this.outputHeightPx + 'px'); 

		this.initGrids(); // Setzt den Initialzustand

		// Die Schleife wird sofort gestartet
        this.startLoop(); 
	}

	// Creates a matrix of floating point numbers (0.1 to 1.6 for a 4x4 grid)
	createInputData() {
		const data = [];
		for (let i = 0; i < this.GRID_ROWS; i++) {
			const row = [];
			for (let j = 0; j < this.GRID_COLS; j++) {
				row.push((i * this.GRID_COLS + j + 1) / 10.0); 
			}
			data.push(row);
		}
		return data;
	}
	
	/**
	 * NEU: Misst die tatsächliche, gerenderte Höhe des vollständigen Textes
	 * mit der maximalen Breite des Containers, um den Zeilenumbruch zu berücksichtigen.
	 */
	calculateOutputHeightDynamically() {
		const exampleValue = '1.6'; // Höchster Wert im Beispiel
		const separator = ', ';
		// Erstellen des vollständigen erwarteten Ausgabe-Strings
		const fullString = '[' + Array(this.totalCells).fill(exampleValue).join(separator) + ']';
		
		// 1. Erstellen eines unsichtbaren Mess-Elements
		const measurer = document.createElement('div');
		measurer.classList.add('output-measurer');
		measurer.setAttribute('data-flatten-id', this.instanceId); // Für Scoped CSS
		
		// 2. Setzen des Inhalts und der Breite
		measurer.textContent = fullString;
		
		// 3. Temporäres Hinzufügen zum DOM zur Messung
		this.container.appendChild(measurer);
		
		// Wichtig: Wir müssen sicherstellen, dass die Breite des Mess-Elements
		// der max-width des Containers entspricht, um den Zeilenumbruch zu simulieren.
		// Dies wurde über die CSS-Variable --max-width-px gelöst.
		
		// 4. Höhe messen
		const height = measurer.offsetHeight;
		
		// 5. Entfernen des Mess-Elements
		this.container.removeChild(measurer);
		
		// Füge einen Puffer von 4px hinzu, um Rundungsfehler zu vermeiden
		return height + 4; 
	}


	setupDOM() {
		// 1. Inject scoped CSS
		const style = document.createElement('style');
		style.setAttribute('data-flatten-instance-id', this.instanceId);
		style.textContent = getFlattenStyles(this.instanceId);
		document.head.appendChild(style);

		// 2. Inject HTML and set configured max-width
		this.container.setAttribute('data-flatten-id', this.instanceId);
		this.container.style.maxWidth = this.MAX_WIDTH_PX + 'px'; 
		this.container.innerHTML = getFlattenHtml(this.instanceId);

		// 3. Element References
		this.inputGrid = this.container.querySelector('[data-element-type="inputGrid"]');
		this.outputText = this.container.querySelector('[data-element-type="outputText"]'); 
		this.collectionPoint = this.container.querySelector('[data-element-type="collectionPoint"]');

		// 4. Set CSS variables and dynamic text
		this.container.style.setProperty('--grid-rows', String(this.GRID_ROWS));
		this.container.style.setProperty('--grid-cols', String(this.GRID_COLS));
		this.container.style.setProperty('--cell-size', this.CELL_SIZE + 'px');
		this.container.style.setProperty('--anim-duration', this.ANIMATION_DURATION_MS + 'ms');
        this.container.style.setProperty('--reset-duration', this.RESET_DURATION_MS + 'ms');
		// NEU: Max Width als CSS-Variable für das Mess-Element
		this.container.style.setProperty('--max-width-px', this.MAX_WIDTH_PX + 'px'); 
	}

	initGrids() {
		this.inputGrid.querySelectorAll('.input-cell').forEach(cell => cell.remove());
		
		this.outputText.innerHTML = this.currentOutputString + ']';
		this.outputText.style.opacity = '0.3';
		this.currentOutputString = '[';

		// Create Input Cells
		this.CELL_DATA.flat().forEach((val, index) => {
			const cell = document.createElement('div');
			cell.classList.add('input-cell');
			
			const displayVal = val.toFixed(1); 
			cell.textContent = displayVal;
			cell.setAttribute('data-original-value', displayVal); 
			
			const dataValAttr = val > 0.5 ? '1' : '0';
			cell.setAttribute('data-value', dataValAttr); 
			
			cell.setAttribute('data-index', index);
			this.inputGrid.appendChild(cell);
		});
	}
    
    // Funktion zum Starten der Endlosschleife
    startLoop() {
        if (this.isRunning) return;
        
        const loop = () => {
            if (this.isRunning) {
                // Sollte nicht passieren, aber zur Sicherheit
                this.animationFrameId = requestAnimationFrame(loop);
                return;
            }

            // Animation ausführen
            this.runFlattenAnimation().then(() => {
                // Nach der Animation eine kurze Pause, dann den Reset ausführen
                setTimeout(() => {
                    this.resetGrids().then(() => { // Warten auf das Ende des Resets
                        // Nach dem Reset eine kurze Pause, dann den nächsten Frame anfordern
                        setTimeout(() => {
                            this.animationFrameId = requestAnimationFrame(loop);
                        }, 500); // Kürzere Pause nach dem smooth Reset
                    });
                }, 1000); // 1 Sekunde Pause zwischen dem Ende der Animation und dem Reset
            });
        };

        this.animationFrameId = requestAnimationFrame(loop);
    }
    
	async runFlattenAnimation() {
		if (this.isRunning) return;
		this.isRunning = true;

		this.outputText.style.opacity = '1';

		const inputCells = Array.from(this.inputGrid.querySelectorAll('.input-cell'));
		
		const inputGridRect = this.inputGrid.getBoundingClientRect();
		const targetX = inputGridRect.width / 2 - this.CELL_SIZE / 2;
		const targetY = inputGridRect.height + 20; 

		this.collectionPoint.style.opacity = '1'; 

		// 1. Prepare all cells for animation (set position)
		inputCells.forEach((cell, i) => {
			const initialX = (i % this.GRID_COLS) * (this.CELL_SIZE + 2);
			const initialY = Math.floor(i / this.GRID_COLS) * (this.CELL_SIZE + 2);
			
			// Diese Positionen sind für den Ausgangspunkt der Animation
			cell.style.position = 'absolute';
			cell.style.top = initialY + 'px';
			cell.style.left = initialX + 'px';
			cell.style.zIndex = '100';
			cell.style.opacity = '1'; 
			cell.classList.remove('faded');
		});

		// Force reflow
		void this.container.offsetWidth; 

        // Promise, um das Ende der Animation zu signalisieren
        return new Promise(async (resolve) => {
            // 2. Animate the cells one by one (row-major order)
            for (let i = 0; i < inputCells.length; i++) {
                
                const inputCell = inputCells[i];

                // Calculate the transformation needed to move to the collection point
                const initialX = parseFloat(inputCell.style.left);
                const initialY = parseFloat(inputCell.style.top);
                const translateX = targetX - initialX;
                const translateY = targetY - initialY;
                
                // Start the move
                inputCell.classList.add('animate-move');
                inputCell.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.5)`;
                inputCell.style.opacity = '0.7';

                // Wait for the cell to arrive
                await this.wait(this.ANIMATION_DURATION_MS * 0.7);

                // 3. Update the text output and fade out the moving cell
                const value = inputCell.getAttribute('data-original-value');
                const separator = (i === 0) ? '' : ', ';
                
                const wrapChar = ''; 
                this.currentOutputString += separator + wrapChar + value;
                this.outputText.innerHTML = this.currentOutputString + (i === this.totalCells - 1 ? ']' : ', ...');
                
                inputCell.style.opacity = '0'; // Temporarily hide the moving cell

                // Pause for a slight moment before the next cell moves
                await this.wait(this.ANIMATION_DURATION_MS * 0.3);
            }

            // 4. Final cleanup: Apply fade effect to final positions
            this.outputText.innerHTML = this.currentOutputString + ']'; // Finalize output text
            this.collectionPoint.style.opacity = '0';

            // Mark cells as faded for the next step (reset)
            inputCells.forEach(cell => {
                // Hier bleiben die Zellen in ihren 'gesammelten' Positionen
                // Die `animate-move` Klasse und `transform` bleiben aktiv, bis `resetGrids` aufgerufen wird
                cell.classList.add('faded');
                cell.style.opacity = '0.7'; // Zurück auf 0.7 setzen, um sie sichtbar zu machen, bevor sie zurückfliegen
            });
            
            this.isRunning = false;
            resolve(); // Signalisieren, dass der Durchlauf beendet ist
        });
	}

	// Resets the visualization back to the initial state (jetzt smooth)
	async resetGrids() {
		return new Promise(resolve => {
            const inputCells = Array.from(this.inputGrid.querySelectorAll('.input-cell'));

            // 1. Die Zellen zurückfliegen lassen
            inputCells.forEach(cell => {
                // Wir setzen transform zurück, wodurch die Zelle dank der CSS-Transition
                // zu ihren ursprünglichen top/left-Koordinaten zurückkehrt.
                cell.style.transform = 'translate(0, 0) scale(1)';
                
                // Opacity zurücksetzen
                cell.style.opacity = '1';
                
                // Die 'faded'-Klasse entfernen, damit die ursprüngliche Farbe zurückkehrt
                cell.classList.remove('faded'); 
            });
            
            // 2. Warten auf das Ende der Transition
            // Wir verwenden die Reset-Dauer.
            this.wait(this.RESET_DURATION_MS).then(() => {

                // 3. Endgültiges Cleanup nach der Animation (Entfernen von Position/Transform)
                inputCells.forEach(cell => {
                    cell.classList.remove('animate-move');
                    cell.style.position = '';
                    cell.style.top = '';
                    cell.style.left = '';
                    cell.style.transform = '';
                    cell.style.zIndex = '1';
                });
                
                // 4. Text-Reset
                this.collectionPoint.style.opacity = '0';
                this.currentOutputString = '[';
                this.outputText.innerHTML = this.currentOutputString + ']';
                this.outputText.style.opacity = '0.3';

                this.isRunning = false; 
                resolve();
            });
		});
	}

	wait(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

// --- 4. Initialization Function ---
/**
 * Initialisiert alle Flatten Visualizer.
 */
window.make_flatten_visual_explanation = function(selector = '.flatten_visual_explanation', options = {}) {
	const containers = document.querySelectorAll(selector);
	containers.forEach(container => {
		if (!container.visualizer) {
			try {
				const visualizer = new FlattenVisualizer(container, options);
				// Attach the instance to the DOM element for external control
				container.visualizer = visualizer; 
			} catch (error) {
				console.error('Failed to initialize FlattenVisualizer for element:', container, error);
			}
		}
	});
};
