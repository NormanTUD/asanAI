/* ----------------------------------------------------
 * activation_visualizer.js
 * ---------------------------------------------------- */

function getActivationStyles(instanceId) {
    return `
    [data-act-id="${instanceId}"] {
        --primary-color: #007bff;
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
        height: 140px;
    }

    [data-act-id="${instanceId}"] .io-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        margin-top: 5px;
        width: 100%;
    }

    [data-act-id="${instanceId}"] .values-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
    }

    [data-act-id="${instanceId}"] .cell {
        font-size: 13px;
        color: #444;
        transition: all 0.3s ease;
        padding: 2px 5px;
        border-radius: 4px;
    }

    [data-act-id="${instanceId}"] .cell.active {
        color: var(--primary-color);
        font-weight: bold;
        transform: scale(1.2);
    }

    [data-act-id="${instanceId}"] .softmax-note {
        font-size: 9px;
        color: #888;
        margin-top: 2px;
    }

    [data-act-id="${instanceId}"] .formula-name {
        font-size: 11px;
        color: #666;
        text-transform: lowercase;
        margin-bottom: -5px;
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
        
        setTimeout(() => {
            if (!this.isDestroyed && document.getElementById(this.plotId)) {
                this.initPlot();
                this.startLoop();
            }
        }, 50);
    }

    activate(x, allValues = [x]) {
        const alpha = 1.0;
        const theta = 1.0;
        switch (this.type) {
            case 'elu': return x > 0 ? x : alpha * (Math.exp(x) - 1);
            case 'relu': return Math.max(0, x);
            case 'leakyrelu': return x > 0 ? x : 0.1 * x;
            case 'softmax': 
                const exps = allValues.map(v => Math.exp(v));
                const sum = exps.reduce((a, b) => a + b, 0);
                return Math.exp(x) / sum;
            case 'thresholdedrelu': return x > theta ? x : 0;
            case 'snake': return x + (1 - Math.cos(2 * x)) / 2;
            default: return x;
        }
    }

    renderStructure() {
        const isSoftmax = this.type === 'softmax';
        this.container.innerHTML = `
            <div class="formula-name">${this.type.toLowerCase()}</div>
            <div id="${this.plotId}" class="plot-container"></div>
            <div class="io-container">
                <div class="values-row">
                    <div class="cell input-cell">0.0</div>
                    <div style="font-size:10px; color:#ccc;">→</div>
                    <div class="cell output-cell">0.0</div>
                </div>
                ${isSoftmax ? '<div class="softmax-note">normalizes sum to 1.0</div>' : ''}
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
            // Für den Plot bei Softmax nehmen wir einen festen Kontext an
            yValues.push(this.activate(x, [x, 0.5, -0.5]));
        }

        const data = [{
            x: xValues, y: yValues,
            type: 'scatter', mode: 'lines',
            line: { color: '#007bff', width: 2 },
            fill: 'tozeroy', fillcolor: 'rgba(0,123,255,0.03)'
        }];

        const layout = {
            margin: { l: 15, r: 10, t: 5, b: 20 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: false,
            xaxis: { showgrid: false, zerolinecolor: '#ccc', fixedrange: true, tickfont: {size: 8} },
            yaxis: { showgrid: false, zerolinecolor: '#ccc', fixedrange: true, tickfont: {size: 8} }
        };

        Plotly.newPlot(this.plotId, data, layout, { staticPlot: true, responsive: true });
    }

    async runAnimation() {
        if (this.isDestroyed || this.isRunning || !document.getElementById(this.plotId)) return;
        this.isRunning = true;

        const val = (Math.random() * 4 - 2);
        // Bei Softmax simulieren wir ein Set aus 3 Werten, um die Abhängigkeit zu zeigen
        const context = [val, 0.8, -0.5];
        const result = this.activate(val, context);

        this.inputEl.textContent = val.toFixed(1);
        this.inputEl.classList.add('active');

        await new Promise(r => this.timer = setTimeout(r, 600));
        if (this.isDestroyed) return;

        this.outputEl.textContent = result.toFixed(2);
        this.outputEl.classList.add('active');

        await new Promise(r => this.timer = setTimeout(r, 1500));
        if (this.isDestroyed) return;

        this.inputEl.classList.remove('active');
        this.outputEl.classList.remove('active');
        this.isRunning = false;
    }

    startLoop() {
        const loop = async () => {
            if (this.isDestroyed) return;
            if (!document.body.contains(this.container)) {
                this.destroy();
                return;
            }
            await this.runAnimation();
            this.timer = setTimeout(() => requestAnimationFrame(loop), 100);
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
    document.querySelectorAll(selector).forEach(container => {
        if (container.visualizer) container.visualizer.destroy();
        const types = ['elu', 'relu', 'leakyrelu', 'softmax', 'thresholdedrelu', 'snake'];
        const foundType = types.find(t => container.classList.contains(t));
        if (foundType) {
            container.visualizer = new ActivationVisualizer(container, { type: foundType });
        }
    });
};
