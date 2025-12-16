/* ----------------------------------------------------
 * activation_visualizer_plotly.js
 * ---------------------------------------------------- */

// --- 1. Encapsulated CSS ---
function getActivationStyles(instanceId) {
    return `
    [data-act-id="${instanceId}"] {
        --primary-color: #007bff;
        --secondary-color: #6c757d;
        --text-color: #333;
        
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        padding: 10px;
        background: transparent; /* Kein weißer Hintergrund mehr */
        border-radius: 8px;
        width: 100%;
        box-sizing: border-box;
    }

    [data-act-id="${instanceId}"] .plot-container {
        width: 100%;
        height: 180px; /* Kompakte Höhe für den Plotly-Graph */
        margin-bottom: 10px;
    }

    [data-act-id="${instanceId}"] .io-container {
        display: flex;
        align-items: center;
        gap: 15px;
    }

    [data-act-id="${instanceId}"] .cell {
        width: 50px;
        height: 30px;
        border: 1px solid var(--secondary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: bold;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 4px;
    }

    [data-act-id="${instanceId}"] .cell.active {
        border-color: var(--primary-color);
        box-shadow: 0 0 8px rgba(0,123,255,0.5);
    }

    [data-act-id="${instanceId}"] .formula-display {
        font-size: 12px;
        color: var(--text-color);
        margin-bottom: 5px;
        opacity: 0.8;
    }
    `;
}

class ActivationVisualizer {
    constructor(container, options = {}) {
        this.container = container;
        this.type = options.type || 'relu';
        this.instanceId = Math.random().toString(36).substr(2, 9);
        this.plotId = `plot-${this.instanceId}`;
        this.isRunning = false;

        this.init();
    }

    init() {
        this.container.setAttribute('data-act-id', this.instanceId);
        
        const styleSheet = document.createElement("style");
        styleSheet.setAttribute('data-style-for', this.instanceId);
        styleSheet.innerText = getActivationStyles(this.instanceId);
        document.head.appendChild(styleSheet);

        this.renderStructure();
        this.initPlot();
        this.startLoop();
    }

    // Mathematische Definitionen
    activate(x) {
        const alpha = 1.0;
        const theta = 1.0;
        switch (this.type) {
            case 'relu': return Math.max(0, x);
            case 'leakyrelu': return x > 0 ? x : 0.1 * x;
            case 'elu': return x > 0 ? x : alpha * (Math.exp(x) - 1);
            case 'softmax': return Math.exp(x) / (Math.exp(x) + Math.exp(1)); 
            case 'thresholdedrelu': return x > theta ? x : 0;
            case 'snake': return x + (1 - Math.cos(2 * x)) / 2;
            default: return x;
        }
    }

    renderStructure() {
        // Name explizit in Kleinbuchstaben
        const displayName = this.type.toLowerCase();

        this.container.innerHTML = `
            <div class="formula-display"><strong>${displayName}</strong></div>
            <div id="${this.plotId}" class="plot-container"></div>
            <div class="io-container">
                <div class="cell input-cell">x: 0</div>
                <div style="font-size:12px">→</div>
                <div class="cell output-cell">y: 0</div>
            </div>
        `;

        this.inputEl = this.container.querySelector('.input-cell');
        this.outputEl = this.container.querySelector('.output-cell');
    }

    initPlot() {
        if (typeof Plotly === 'undefined') {
            console.error("Plotly.js nicht geladen!");
            return;
        }

        const xValues = [];
        const yValues = [];
        for (let x = -3; x <= 3; x += 0.1) {
            xValues.push(x);
            yValues.push(this.activate(x));
        }

        const data = [{
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#007bff', width: 3 },
            fill: 'tozeroy',
            fillcolor: 'rgba(0,123,255,0.1)'
        }];

        const layout = {
            margin: { l: 30, r: 10, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: false,
            xaxis: { gridcolor: '#eee', zerolinecolor: '#444' },
            yaxis: { gridcolor: '#eee', zerolinecolor: '#444' }
        };

        Plotly.newPlot(this.plotId, data, layout, { staticPlot: true, responsive: true });
    }

    async runAnimation() {
        this.isRunning = true;
        const val = (Math.random() * 4 - 2); // Bereich -2 bis 2
        const result = this.activate(val);

        this.inputEl.textContent = `x: ${val.toFixed(1)}`;
        this.inputEl.classList.add('active');

        // Punkt im Plotly-Graph hervorheben (optional)
        Plotly.restyle(this.plotId, {
            'marker.color': 'red',
            'marker.size': 10
        }, [0]);

        await new Promise(r => setTimeout(r, 800));

        this.outputEl.textContent = `y: ${result.toFixed(2)}`;
        this.outputEl.classList.add('active');

        await new Promise(r => setTimeout(r, 1200));

        this.inputEl.classList.remove('active');
        this.outputEl.classList.remove('active');
        this.isRunning = false;
    }

    startLoop() {
        const loop = async () => {
            if (this.container.visualizer !== this) return; // Stop if replaced
            if (!this.isRunning) await this.runAnimation();
            this.timer = setTimeout(() => requestAnimationFrame(loop), 500);
        };
        requestAnimationFrame(loop);
    }

    destroy() {
        clearTimeout(this.timer);
        const style = document.querySelector(`style[data-style-for="${this.instanceId}"]`);
        if (style) style.remove();
        this.container.innerHTML = '';
    }
}

// --- 3. Global Initialization Function ---
window.make_activation_visual_explanation = function(selector = '.activation_visual_explanation') {
    const containers = document.querySelectorAll(selector);
    const types = ['elu', 'relu', 'leakyrelu', 'softmax', 'thresholdedrelu', 'snake'];
    
    containers.forEach(container => {
        // WICHTIG: Wenn bereits ein Visualizer existiert, zerstöre ihn zuerst (Cleanup)
        if (container.visualizer) {
            container.visualizer.destroy();
            delete container.visualizer;
        }

        const foundType = types.find(t => container.classList.contains(t));
        if (foundType) {
            container.visualizer = new ActivationVisualizer(container, { type: foundType });
        }
    });
};
