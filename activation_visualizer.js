/* ----------------------------------------------------
 * activation_visualizer.js
 * Visualisiert verschiedene Aktivierungsfunktionen: 
 * ELU, ReLU, Leaky ReLU, Softmax, Thresholded ReLU, Snake.
 * ---------------------------------------------------- */

// --- 1. Encapsulated CSS ---
function getActivationStyles(instanceId) {
    return `
    [data-act-id="${instanceId}"] {
        --primary-color: #007bff;
        --secondary-color: #6c757d;
        --accent-color: #28a745;
        --bg-color: #f8f9fa;
        --cell-size: 40px;
        
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        padding: 15px;
        background: var(--bg-color);
        border-radius: 8px;
        width: 100%;
        box-sizing: border-box;
    }

    [data-act-id="${instanceId}"] .graph-container {
        width: 100%;
        max-width: 300px;
        height: 150px;
        border-bottom: 2px solid #333;
        border-left: 2px solid #333;
        position: relative;
        margin-bottom: 20px;
        background: white;
    }

    [data-act-id="${instanceId}"] .axis-label {
        position: absolute;
        font-size: 10px;
        color: #666;
    }

    [data-act-id="${instanceId}"] .io-container {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    [data-act-id="${instanceId}"] .value-box {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    [data-act-id="${instanceId}"] .cell {
        width: var(--cell-size);
        height: var(--cell-size);
        border: 2px solid var(--secondary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        background: white;
        transition: all 0.3s ease;
    }

    [data-act-id="${instanceId}"] .cell.active {
        border-color: var(--primary-color);
        background: #e7f1ff;
        transform: scale(1.1);
    }

    [data-act-id="${instanceId}"] .arrow {
        font-size: 24px;
        color: var(--secondary-color);
    }

    [data-act-id="${instanceId}"] .formula-display {
        margin-top: 10px;
        font-style: italic;
        font-size: 14px;
        color: #333;
    }
    `;
}

// --- 2. Visualizer Class ---
class ActivationVisualizer {
    constructor(container, options = {}) {
        this.container = container;
        this.type = options.type || 'relu';
        this.instanceId = Math.random().toString(36).substr(2, 9);
        this.isRunning = false;

        this.init();
    }

    init() {
        this.container.setAttribute('data-act-id', this.instanceId);
        
        const styleSheet = document.createElement("style");
        styleSheet.innerText = getActivationStyles(this.instanceId);
        document.head.appendChild(styleSheet);

        this.renderStructure();
        this.startLoop();
    }

    renderStructure() {
        const formulas = {
            relu: 'f(x) = max(0, x)',
            leakyrelu: 'f(x) = x > 0 ? x : 0.1x',
            elu: 'f(x) = x > 0 ? x : α(e^x - 1)',
            softmax: 'f(x_i) = e^{x_i} / Σ e^{x_j}',
            thresholdedrelu: 'f(x) = x > θ ? x : 0',
            snake: 'f(x) = x + sin²(ax)/a'
        };

        this.container.innerHTML = `
            <div class="formula-display"><strong>${this.type.toUpperCase()}:</strong> ${formulas[this.type]}</div>
            <div class="graph-container" id="graph-${this.instanceId}">
                </div>
            <div class="io-container">
                <div class="value-box">
                    <span style="font-size: 10px">Input x</span>
                    <div class="cell input-cell">0.0</div>
                </div>
                <div class="arrow">→</div>
                <div class="value-box">
                    <span style="font-size: 10px">Output y</span>
                    <div class="cell output-cell">0.0</div>
                </div>
            </div>
        `;

        this.inputEl = this.container.querySelector('.input-cell');
        this.outputEl = this.container.querySelector('.output-cell');
    }

    activate(x) {
        const alpha = 1.0;
        const theta = 1.0;

        switch (this.type) {
            case 'relu': return Math.max(0, x);
            case 'leakyrelu': return x > 0 ? x : 0.1 * x;
            case 'elu': return x > 0 ? x : alpha * (Math.exp(x) - 1);
            case 'softmax': return Math.exp(x) / (Math.exp(x) + Math.exp(1)); // Vereinfacht für Visualisierung
            case 'thresholdedrelu': return x > theta ? x : 0;
            case 'snake': return x + (1 - Math.cos(2 * x)) / 2;
            default: return x;
        }
    }

    async runAnimation() {
        this.isRunning = true;
        
        // Zufälliger Input zwischen -3 und 3
        const val = (Math.random() * 6 - 3).toFixed(1);
        const result = this.activate(parseFloat(val)).toFixed(2);

        this.inputEl.textContent = val;
        this.inputEl.classList.add('active');
        
        await new Promise(r => setTimeout(r, 600));
        
        this.outputEl.textContent = result;
        this.outputEl.classList.add('active');
        this.outputEl.style.backgroundColor = parseFloat(result) > 0 ? '#d4edda' : '#f8d7da';

        await new Promise(r => setTimeout(r, 1500));
        
        this.inputEl.classList.remove('active');
        this.outputEl.classList.remove('active');
        this.outputEl.style.backgroundColor = 'white';

        this.isRunning = false;
    }

    startLoop() {
        const loop = async () => {
            if (!this.isRunning) await this.runAnimation();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

// --- 3. Global Initialization Function ---
/**
 * Scannt das DOM nach Elementen mit der Klasse .activation_visual_explanation.
 * Entscheidet anhand der Zusatzklasse (z.B. .relu), welcher Typ gerendert wird.
 */
window.make_activation_visual_explanation = function(selector = '.activation_visual_explanation') {
    const containers = document.querySelectorAll(selector);
    
    const types = ['elu', 'relu', 'leakyrelu', 'softmax', 'thresholdedrelu', 'snake'];
    
    containers.forEach(container => {
        if (!container.visualizer) {
            // Finde heraus, welche Typ-Klasse das Element hat
            const foundType = types.find(t => container.classList.contains(t));
            if (foundType) {
                container.visualizer = new ActivationVisualizer(container, { type: foundType });
            }
        }
    });
};
