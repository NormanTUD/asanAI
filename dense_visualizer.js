/* ----------------------------------------------------
 * dense_visualizer.js
 * Visualisiert die Berechnung eines einzelnen Neurons
 * in einer Dense (Fully Connected) Layer.
 * Die Überarbeitung stellt den SIMULTANEN Datenfluss mit
 * klarer visueller Verbindung zum Neuron dar.
 * ---------------------------------------------------- */

// --- 1. Encapsulated CSS ---
function getDenseStyles(instanceId) {
	return `
	/* General setup for instance ${instanceId} */
	[data-dense-id="${instanceId}"] {
		/* Variables */
		--input-count: 4;
		--cell-size: 35px;
		--color-input: #333;
		--color-weight: #007bff;
		--color-bias: #ffc107;
		--color-output: #28a745;
		--flow-duration: 900ms; /* Dauer des Datenflusses */
		--calc-delay: 1500ms; /* Dauer der Summen- und Aktivierungsphase */
		--pulse-color: #ff0000; /* Farbe für den Flusspuls */
		--neuron-radius: 30px; /* Hälfte der Neuron-Größe */
		--flow-path-length: 120px; /* Geschätzte Distanz vom Input zur Neuron-Kante */

		/* Page skeleton */
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-family: Arial, sans-serif;
		padding: 10px;
		box-sizing: border-box;
		width: 100%;
	}

	[data-dense-id="${instanceId}"] .dense-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		width: 100%;
		max-width: 400px;
	}
	
	[data-dense-id="${instanceId}"] .data-flow {
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative; 
	}

	/* Input Vector (Flattened Data) */
	[data-dense-id="${instanceId}"] .input-vector {
		display: flex;
		flex-direction: column; 
		gap: 5px;
		align-items: flex-end; 
		margin-right: 0; 
		z-index: 10;
	}

	[data-dense-id="${instanceId}"] .input-val {
		width: var(--cell-size);
		height: var(--cell-size);
		background-color: var(--color-input);
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		font-weight: bold;
		font-size: 0.9rem;
		border-radius: 4px;
		transition: box-shadow 0.2s;
	}

	/* Weights and Neuron Structure */
	[data-dense-id="${instanceId}"] .neuron-structure {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 0; /* Wichtig: Gaps werden über Margins/Padding gesteuert */
	}

	[data-dense-id="${instanceId}"] .weight-line-container {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0; 
		position: relative;
		z-index: 5;
	}

	[data-dense-id="${instanceId}"] .weight-line {
		display: flex;
		align-items: center;
		height: calc(var(--cell-size) + 5px); 
		position: relative;
		left: 0; /* Startet direkt am Input */
	}

	/* Die Gewichtszelle */
	[data-dense-id="${instanceId}"] .weight-box {
		width: var(--cell-size);
		height: 25px; 
		background-color: var(--color-weight);
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 0.8rem;
		border-radius: 4px;
		margin-left: 10px; /* Kleiner Abstand zum Input */
		box-shadow: 0 2px 5px rgba(0,0,0,0.2);
	}
	
	/* NEU: Die Verbindungslinie (vom Gewicht zum Neuron) */
	[data-dense-id="${instanceId}"] .weight-line::after {
		content: '';
		position: absolute;
		/* Startpunkt: Rechtes Ende der Gewichtszelle + 10px Margin */
		left: calc(var(--cell-size) + 10px + var(--cell-size)); 
		top: calc(var(--cell-size) / 2 + 2.5px); /* Zentriert auf der Höhe */
		width: calc(var(--flow-path-length) - var(--cell-size) - 10px - 10px); /* Restliche Strecke */
		height: 2px;
		background-color: var(--color-weight);
		z-index: 8;
	}
	
	/* --- Signal-Dot für den Fluss --- */
	@keyframes flow-animation {
		0% { opacity: 1; transform: translateX(0); background-color: var(--pulse-color); }
		90% { opacity: 1; transform: translateX(var(--flow-path-length)); background-color: var(--pulse-color); } 
		100% { opacity: 0; transform: translateX(var(--flow-path-length)); background-color: var(--pulse-color); }
	}
	
	[data-dense-id="${instanceId}"] .signal-dot {
		position: absolute;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--pulse-color); 
		opacity: 0;
		/* Startpunkt: Mitte des Input-Val rechts */
		left: calc(var(--cell-size) / 2); 
		top: calc(var(--cell-size) / 2 + 2.5px - 4px); /* -4px für halbe Dot-Höhe */
		z-index: 20;
		transition: opacity 0.1s;
	}
	
	[data-dense-id="${instanceId}"] .weight-line.active .signal-dot {
		opacity: 1;
		animation: flow-animation var(--flow-duration) linear forwards;
	}
	/* --- ENDE: Signal-Dot --- */


	/* Das Neuron (Hauptknoten) */
	[data-dense-id="${instanceId}"] .neuron-node {
		width: calc(2 * var(--neuron-radius));
		height: calc(2 * var(--neuron-radius));
		background-color: #f8f9fa;
		border: 3px solid #6c757d;
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		position: relative;
		font-size: 0.8rem;
		box-shadow: 0 4px 10px rgba(0,0,0,0.1);
		transition: border-color var(--calc-delay) ease-in-out, background-color 0.1s;
		/* NEU: Positioniert, um die Verbindungslinien zu empfangen */
		margin-left: 10px; 
		z-index: 10;
	}
	
	/* Highlight-Zustände */
	[data-dense-id="${instanceId}"] .neuron-node.summing {
		border-color: var(--color-bias);
		background-color: rgba(255, 193, 7, 0.2);
	}
	[data-dense-id="${instanceId}"] .neuron-node.activated {
		border-color: var(--color-output);
		background-color: rgba(40, 167, 69, 0.2);
	}


	[data-dense-id="${instanceId}"] .neuron-node .math-sum {
		font-size: 1.2rem;
		color: var(--color-input);
		margin-bottom: 2px;
	}

	[data-dense-id="${instanceId}"] .neuron-node .math-sigma {
		font-size: 1.2rem;
		color: var(--color-output);
		font-style: italic;
	}

	/* Bias Addition */
	[data-dense-id="${instanceId}"] .bias-term {
		/* ... (unverändert) ... */
		position: absolute;
		top: -15px;
		right: -15px;
		width: 30px;
		height: 30px;
		background-color: var(--color-bias);
		color: white;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		font-weight: bold;
		font-size: 0.8rem;
		z-index: 20;
		box-shadow: 0 2px 5px rgba(0,0,0,0.3);
		transition: box-shadow 0.2s;
	}
	[data-dense-id="${instanceId}"] .bias-term::before {
		content: '+';
		position: absolute;
		left: -15px;
		font-size: 1.2rem;
		color: var(--color-bias);
	}

	/* Output (Aktiviertes Ergebnis) */
	[data-dense-id="${instanceId}"] .output-result {
		width: var(--cell-size);
		height: var(--cell-size);
		background-color: var(--color-output);
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		font-weight: bold;
		font-size: 1rem;
		border-radius: 4px;
		box-shadow: 0 4px 10px rgba(0,0,0,0.2);
		margin-left: 15px; /* Kleiner Abstand vom Neuron */
		transition: box-shadow 0.3s;
	}
    `;
}

// --- 2. HTML Template (Unverändert) ---
function getDenseHtml(instanceId) {
	return `
	<div class="dense-container" data-dense-id="${instanceId}" role="region" aria-label="Dense Layer Neuron Calculation Demo">
		
		<div class="data-flow">
			
			<div class="input-vector" data-element-type="inputVector">
				</div>

			<div class="neuron-structure">
				<div class="weight-line-container" data-element-type="weightLines">
					</div>
				
				<div class="neuron-node" data-element-type="neuronNode">
					<div class="bias-term" data-element-type="biasTerm">b</div> 
					<div class="math-sum">
						<math xmlns="http://www.w3.org/1998/Math/MathML">
							<mo>&#x2211;</mo>
							<msub>
								<mi>x</mi>
								<mi>i</mi>
							</msub>
							<msub>
								<mi>w</mi>
								<mi>i</mi>
							</msub>
						</math>
					</div>
					<div class="math-sigma">
						<math xmlns="http://www.w3.org/1998/Math/MathML">
							<mi>&#x3C3;</mi>
							<mo>(</mo>
							<mi>z</mi>
							<mo>)</mo>
						</math>
					</div>
				</div>

				<div class="output-result" data-element-type="outputResult">
					z'
				</div>
			</div>
			
		</div>

		<div style="margin-top: 15px; font-style: italic; font-size: 0.9rem;">
			<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
				<msup>
					<mi>z</mi>
					<mo>′</mo>
				</msup>
				<mo>=</mo>
				<mi>&#x3C3;</mi>
				<mfenced open="(" close=")">
					<mfenced open="(" close=")">
						<munderover>
							<mo>&#x2211;</mo>
							<mrow>
								<mi>i</mi>
								<mo>=</mo>
								<mn>1</mn>
							</mrow>
							<mi>N</mi>
						</munderover>
						<msub>
							<mi>x</mi>
							<mi>i</mi>
						</msub>
						<msub>
							<mi>w</mi>
							<mi>i</mi>
						</msub>
					</mfenced>
					<mo>+</mo>
					<mi>b</mi>
				</mfenced>
			</math>
		</div>
	</div>
	`;
}

// --- 3. DenseVisualizer Class ---
class DenseVisualizer {
	constructor(containerElement, options = {}) {
		if (!containerElement) throw new Error('Container element is required.');

		this.container = containerElement;
		this.instanceId = 'dense-instance-' + Math.random().toString(36).substring(2, 9);
		this.isRunning = false;
		this.animationFrameId = null;

		// Configuration
		this.INPUT_COUNT = options.inputCount || 4;
		this.INPUT_VALUES = options.inputValues || this.generateInputValues();
		this.WEIGHT_VALUES = options.weightValues || this.generateWeightValues();
		this.BIAS_VALUE = options.biasValue || 0.5;
		this.CELL_SIZE = options.cellSize || 35;
		this.FLOW_DURATION_MS = options.flowDuration || 900;
		this.CALC_DELAY_MS = options.calcDelay || 1500;
		
		// Setup the DOM and CSS
		this.setupDOM();
		this.initElements();
		
		// Start the loop
		this.startLoop();
	}

	generateInputValues() {
		return Array.from({ length: this.INPUT_COUNT }, () => (Math.random() * 2 - 1).toFixed(2));
	}

	generateWeightValues() {
		return Array.from({ length: this.INPUT_COUNT }, () => (Math.random() * 2 - 1).toFixed(2));
	}

	setupDOM() {
		const style = document.createElement('style');
		style.setAttribute('data-dense-instance-id', this.instanceId);
		style.textContent = getDenseStyles(this.instanceId);
		document.head.appendChild(style);

		this.container.setAttribute('data-dense-id', this.instanceId);
		this.container.innerHTML = getDenseHtml(this.instanceId);

		this.container.style.setProperty('--input-count', String(this.INPUT_COUNT));
		this.container.style.setProperty('--cell-size', this.CELL_SIZE + 'px');
		this.container.style.setProperty('--flow-duration', this.FLOW_DURATION_MS + 'ms');
		this.container.style.setProperty('--calc-delay', this.CALC_DELAY_MS + 'ms');
		
		// Berechne die genaue Pfadlänge basierend auf der tatsächlichen DOM-Struktur
		// Input (35px) + Gap (10px) + Weight (35px) + Gap/Line (10px) + Neuron-Radius (30px)
		// Wir setzen die Path-Length auf den Abstand vom Startpunkt des Dots (Mitte des Input-Vals) 
		// bis zur Kante des Neurons.
		const flowPathLength = (this.CELL_SIZE / 2) + 10 + this.CELL_SIZE + 10 + 3; // 3px ist Border des Neurons
		this.container.style.setProperty('--flow-path-length', flowPathLength + 'px');

	}

	initElements() {
		// Element References
		this.inputVector = this.container.querySelector('[data-element-type="inputVector"]');
		this.weightLinesContainer = this.container.querySelector('[data-element-type="weightLines"]');
		this.biasTerm = this.container.querySelector('[data-element-type="biasTerm"]');
		this.outputResult = this.container.querySelector('[data-element-type="outputResult"]');
		this.neuronNode = this.container.querySelector('[data-element-type="neuronNode"]');

		// 1. Input und Gewichte hinzufügen
		this.inputVector.innerHTML = '';
		this.weightLinesContainer.innerHTML = '';
		
		this.inputElements = [];
		this.weightLineElements = [];
		
		for (let i = 0; i < this.INPUT_COUNT; i++) {
			// Input-Element
			const inputDiv = document.createElement('div');
			inputDiv.classList.add('input-val');
			inputDiv.textContent = this.INPUT_VALUES[i];
			this.inputVector.appendChild(inputDiv);
			this.inputElements.push(inputDiv);
			
			// Weight-Line-Element
			const lineDiv = document.createElement('div');
			lineDiv.classList.add('weight-line');
			
			// Signal Dot hinzufügen
			const signalDot = document.createElement('div');
			signalDot.classList.add('signal-dot');
			lineDiv.appendChild(signalDot);

			const weightBox = document.createElement('div');
			weightBox.classList.add('weight-box');
			weightBox.textContent = 'w'+(i+1); 
			
			lineDiv.appendChild(weightBox);
			this.weightLinesContainer.appendChild(lineDiv);
			this.weightLineElements.push(lineDiv);
		}
		
		// 2. Bias-Wert setzen
		this.biasTerm.textContent = this.BIAS_VALUE;
		
		// 3. Output-Wert initial zurücksetzen
		this.outputResult.textContent = 'z\'';
	}

	async runDenseAnimation() {
		if (this.isRunning) return;
		this.isRunning = true;
		
		// 1. Reset Zustände
		this.outputResult.textContent = 'z\'';
		this.outputResult.style.boxShadow = '';
		this.neuronNode.classList.remove('summing', 'activated');
		this.neuronNode.style.border = '3px solid #6c757d';
		this.biasTerm.style.boxShadow = '';


		// 2. SIMULTANER Datenfluss (Multiplikation x_i * w_i)
		
		// Input- und Gewicht-Highlight (für die Dauer des Flusses)
		this.inputElements.forEach(el => el.style.boxShadow = '0 0 5px 2px var(--color-input)');
		this.weightLineElements.forEach(line => {
			const box = line.querySelector('.weight-box');
			box.style.boxShadow = '0 0 5px 2px var(--color-weight)';
			// Startet die CSS-Animations-Klasse (Dot-Fluss)
			line.classList.add('active'); 
		});
		
		// Warten auf das Ende des Flusses (Dot erreicht das Neuron)
		await this.wait(this.FLOW_DURATION_MS); 
		
		// Fließelemente zurücksetzen und Highlights entfernen
		this.inputElements.forEach(el => el.style.boxShadow = '');
		this.weightLineElements.forEach(line => {
			line.classList.remove('active');
			line.querySelector('.weight-box').style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)'; // Standard-Schatten
		});

		
		// 3. Summierung und Bias-Addition (Abstrakte Berechnung: Summe + Bias)
		this.neuronNode.classList.add('summing');
		this.biasTerm.style.boxShadow = '0 0 10px 3px var(--color-bias)';
		
		await this.wait(this.CALC_DELAY_MS);
		
		
		// 4. Aktivierungsfunktion (Abstrakte Berechnung: Sigma)
		this.neuronNode.classList.remove('summing');
		this.neuronNode.classList.add('activated');
		this.biasTerm.style.boxShadow = ''; // Bias-Highlight entfernen
		
		await this.wait(this.CALC_DELAY_MS / 2);
		
		
		// 5. Output-Resultat
		this.outputResult.textContent = '0.9'; // Simulierter, aktivierter Output
		this.outputResult.style.boxShadow = '0 0 15px 5px var(--color-output)';

		await this.wait(this.CALC_DELAY_MS);
		
		
		// 6. Cleanup und Reset
		this.neuronNode.classList.remove('activated');
		this.neuronNode.style.border = '3px solid #6c757d';
		this.outputResult.style.boxShadow = '';

		this.isRunning = false;
	}
	
	startLoop() {
		const loop = () => {
			if (this.isRunning) {
				this.animationFrameId = requestAnimationFrame(loop);
				return;
			}
			
			// Neue Zufallswerte für die nächste Iteration
			this.INPUT_VALUES = this.generateInputValues();
			this.WEIGHT_VALUES = this.generateWeightValues();
			this.BIAS_VALUE = (Math.random() * 1 - 0.5).toFixed(2); 

			this.initElements(); 

			this.runDenseAnimation().then(() => {
				// Kurze Pause nach der Animation, bevor der nächste Zyklus startet
				setTimeout(() => {
					this.animationFrameId = requestAnimationFrame(loop);
				}, 1000); 
			});
		};

		this.animationFrameId = requestAnimationFrame(loop);
	}
	
	wait(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

// --- 4. Initialization Function ---
window.make_dense_visual_explanation = function(selector = '.dense_visual_explanation', options = {}) {
	const containers = document.querySelectorAll(selector);
	containers.forEach(container => {
		if (!container.visualizer) {
			try {
				const visualizer = new DenseVisualizer(container, options);
				container.visualizer = visualizer; 
			} catch (error) {
				console.error('Failed to initialize DenseVisualizer for element:', container, error);
			}
		}
	});
};
