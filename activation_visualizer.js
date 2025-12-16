/* ----------------------------------------------------
 * activation_visualizer.js
 * Visualisierung mit Plotly.js und robustem Cleanup
 * ---------------------------------------------------- */

function getActivationStyles(instanceId) {
    return `
    [data-act-id="${instanceId}"] {
        --primary-color: #007bff;
        --secondary-color: #6c757d;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: sans-serif;
        padding: 5px;
        background: transparent;
        width: 100%;
        box-sizing: border-box;
    }

    [data-act-id="${instanceId}"] .plot-container {
        width: 100%;
        height: 150px;
    }

    [data-act-id="${instanceId}"] .io-container {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 5px;
    }

    [data-act-id="${instanceId}"] .cell {
        min-width: 40px;
        height: 24px;
        border: 1px solid var(--secondary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 3px;
        transition: all 0.2s ease;
    }

    [data-act-id="${instanceId}"] .cell.active {
        border-color: var(--primary-color);
        background: #fff;
        font-weight: bold;
    }

    [data-act-id="${instanceId}"] .formula-name {
        font-size: 11px;
        color: #666;
        text-transform: lowercase;
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
        this.isDestroyed = false;
        this.timer = null;

        this.init();
    }

    init() {
        this.container.setAttribute('data-act-id', this.instanceId);
        
        const styleSheet = document.createElement("style");
        styleSheet.setAttribute('data-style-for', this.instanceId);
        styleSheet.innerText = getActivationStyles(this.instanceId);
        document.head.appendChild(styleSheet);

        this.renderStructure();
        
        // Timeout stellt sicher, dass das Div im DOM registriert ist, bevor Plotly feuert
        setTimeout(() => {
            if (!this.isDestroyed) {
                this.initPlot();
                this.startLoop();
            }
        }, 0);
    }

    activate(x) {
        const alpha = 1.0;
        const theta = 1.0;
        switch (this.type) {
            case 'elu': return x > 0 ? x : alpha * (Math.exp(x) - 1);
            case 'relu': return Math.max(0, x);
            case 'leakyrelu': return x > 0 ? x : 0.1 * x;
            case 'softmax': return Math.exp(x) / (Math.exp(x) + Math.exp(0)); 
            case 'thresholdedrelu': return x > theta ? x : 0;
            case 'snake': return x + (1 - Math.cos(2 * x)) / 2;
            default: return x;
        }
    }

    renderStructure() {
        this.container.innerHTML = `
            <div class="formula-name">${this.type.toLowerCase()}</div>
            <div id="${this.plotId}" class="plot-container"></div>
            <div class="io-container">
                <div class="cell input-cell">0.0</div>
                <div style="font-size:10px; color:#999;">→</div>
                <div class="cell output-cell">0.0</div>
            </div>
        `;
        this.inputEl = this.container.querySelector('.input-cell');
        this.outputEl = this.container.querySelector('.output-cell');
    }

    initPlot() {
        const plotDiv = document.getElementById(this.plotId);
        if (!plotDiv || typeof Plotly === 'undefined') return;

        const xValues = [], yValues = [];
        for (let x = -3; x <= 3; x += 0.1) {
            xValues.push(x);
            yValues.push(this.activate(x));
        }

        const data = [{
            x: xValues, y: yValues,
            type: 'scatter', mode: 'lines',
            line: { color: '#007bff', width: 2.5 },
            fill: 'tozeroy', fillcolor: 'rgba(0,123,255,0.05)'
        }];

        const layout = {
            margin: { l: 20, r: 10, t: 5, b: 20 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: false,
            xaxis: { showgrid: true, gridcolor: '#eee', zerolinecolor: '#ccc', fixedrange: true },
            yaxis: { showgrid: true, gridcolor: '#eee', zerolinecolor: '#ccc', fixedrange: true }
        };

        Plotly.newPlot(this.plotId, data, layout, { staticPlot: true, responsive: true });
    }

    async runAnimation() {
        if (this.isDestroyed || this.isRunning) return;
        
        const plotDiv = document.getElementById(this.plotId);
        if (!plotDiv) return;

        this.isRunning = true;
        const val = (Math.random() * 4 - 2);
        const result = this.activate(val);

        // UI Update (ohne x: und y:)
        this.inputEl.textContent = val.toFixed(1);
        this.inputEl.classList.add('active');

        await new Promise(r => this.timer = setTimeout(r, 700));
        if (this.isDestroyed) return;

        this.outputEl.textContent = result.toFixed(2);
        this.outputEl.classList.add('active');

        await new Promise(r => this.timer = setTimeout(r, 1200));
        if (this.isDestroyed) return;

        this.inputEl.classList.remove('active');
        this.outputEl.classList.remove('active');
        this.isRunning = false;
    }

    startLoop() {
        const loop = async () => {
            if (this.isDestroyed) return;
            // Prüfen ob Element noch im DOM ist
            if (!document.body.contains(this.container)) {
                this.destroy();
                return;
            }
            await this.runAnimation();
            this.timer = setTimeout(() => requestAnimationFrame(loop), 500);
        };
        requestAnimationFrame(loop);
    }

    destroy() {
        this.isDestroyed = true;
        clearTimeout(this.timer);
        const style = document.querySelector(`style[data-style-for="${this.instanceId}"]`);
        if (style) style.remove();
        if (this.container) {
            this.container.innerHTML = '';
            delete this.container.visualizer;
        }
    }
}

window.make_activation_visual_explanation = function(selector = '.activation_visual_explanation') {
    const containers = document.querySelectorAll(selector);
    const types = ['elu', 'relu', 'leakyrelu', 'softmax', 'thresholdedrelu', 'snake'];
    
    containers.forEach(container => {
        // Altes Instanz-Cleanup
        if (container.visualizer) {
            container.visualizer.destroy();
        }

        const foundType = types.find(t => container.classList.contains(t));
        if (foundType) {
            container.visualizer = new ActivationVisualizer(container, { type: foundType });
        }
    });
};
