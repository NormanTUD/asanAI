/* ----------------------------------------------------
 * activation_visualizer.js - Corrected Calculation Logic
 * ---------------------------------------------------- */

function getActivationStyles(instanceId) {
    return `
    [data-act-id="${instanceId}"] {
        --primary-color: #007bff;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        padding: 10px;
        width: 100%;
        box-sizing: border-box;
    }

    [data-act-id="${instanceId}"] .plot-container {
        width: 100%;
        height: 180px;
    }

    [data-act-id="${instanceId}"] .io-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 10px;
        min-height: 40px;
    }

    [data-act-id="${instanceId}"] .values-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-family: monospace;
    }

    [data-act-id="${instanceId}"] .cell {
        font-size: 13px;
        color: #555;
        transition: color 0.2s ease;
    }

    [data-act-id="${instanceId}"] .cell.active {
        color: var(--primary-color);
        font-weight: bold;
    }

    [data-act-id="${instanceId}"] .softmax-note {
        font-size: 10px;
        color: #007bff;
        margin-top: 4px;
        font-weight: 600;
    }

    [data-act-id="${instanceId}"] .formula-name {
        font-size: 12px;
        font-weight: bold;
        color: #999;
        text-transform: uppercase;
        margin-bottom: 5px;
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

    // Mathematisch korrekte Implementierungen
    calculate(x, context = []) {
        const alpha = 1.0;
        const theta = 1.0;
        
        switch (this.type) {
            case 'relu': 
                return Math.max(0, x);
            case 'leakyrelu': 
                return x > 0 ? x : 0.1 * x;
            case 'elu': 
                return x > 0 ? x : alpha * (Math.exp(x) - 1);
            case 'thresholdedrelu': 
                return x > theta ? x : 0;
            case 'snake': 
                return x + (Math.pow(Math.sin(x), 2)); // vereinfachte Snake: x + sin^2(x)
            case 'softmax':
                if (context.length === 0) return 1.0;
                const exps = context.map(v => Math.exp(v));
                const sum = exps.reduce((a, b) => a + b, 0);
                return Math.exp(x) / sum;
            default: 
                return x;
        }
    }

    renderStructure() {
        const isSoftmax = this.type === 'softmax';
        this.container.innerHTML = `
            <div class="formula-name">${this.type}</div>
            <div id="${this.plotId}" class="plot-container"></div>
            <div class="io-container">
                <div class="values-row">
                    <span class="cell input-cell">...</span>
                    <span style="color:#ccc;">→</span>
                    <span class="cell output-cell">...</span>
                </div>
                ${isSoftmax ? '<div class="softmax-note">Summe aller Ausgänge = 1.0</div>' : ''}
            </div>
        `;
        this.inputEl = this.container.querySelector('.input-cell');
        this.outputEl = this.container.querySelector('.output-cell');
    }

    initPlot() {
        const plotDiv = document.getElementById(this.plotId);
        if (!plotDiv || typeof Plotly === 'undefined') return;

        let data = [];
        let layout = {
            margin: { l: 30, r: 30, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: false,
            xaxis: { showgrid: false, zerolinecolor: '#ccc', tickfont: {size: 9} },
            yaxis: { showgrid: false, zerolinecolor: '#ccc', tickfont: {size: 9} }
        };

        if (this.type === 'softmax') {
            layout.grid = {rows: 1, columns: 2, pattern: 'independent'};
            data = [
                { x: ['z1', 'z2', 'z3'], y: [0, 0, 0], type: 'bar', marker: {color: '#ddd'}, xaxis: 'x', yaxis: 'y' },
                { x: ['p1', 'p2', 'p3'], y: [0, 0, 0], type: 'bar', marker: {color: '#007bff'}, xaxis: 'x2', yaxis: 'y2' }
            ];
            layout.xaxis = { domain: [0, 0.45], title: 'Logits' };
            layout.xaxis2 = { domain: [0.55, 1], title: 'Softmax' };
            layout.yaxis = { range: [-4, 4] };
            layout.yaxis2 = { range: [0, 1.1] };
        } else {
            const xVals = [], yVals = [];
            for (let x = -3; x <= 3; x += 0.1) {
                xVals.push(x);
                yVals.push(this.calculate(x));
            }
            data = [{
                x: xVals, y: yVals,
                type: 'scatter', mode: 'lines',
                line: { color: '#007bff', width: 2.5 },
                fill: 'tozeroy', fillcolor: 'rgba(0,123,255,0.05)'
            }];
        }

        Plotly.newPlot(this.plotId, data, layout, { staticPlot: true, responsive: true });
    }

    async runAnimation() {
        if (this.isDestroyed || this.isRunning) return;
        this.isRunning = true;

        if (this.type === 'softmax') {
            // Exakte Softmax Berechnung
            const logits = [ (Math.random() * 6 - 3), (Math.random() * 6 - 3), (Math.random() * 6 - 3) ];
            const probs = logits.map(l => this.calculate(l, logits));

            this.inputEl.textContent = `[${logits.map(v => v.toFixed(1)).join(', ')}]`;
            Plotly.restyle(this.plotId, { y: [logits] }, [0]);
            Plotly.restyle(this.plotId, { y: [[0, 0, 0]] }, [1]);

            await new Promise(r => this.timer = setTimeout(r, 1200));
            if (this.isDestroyed) return;

            this.outputEl.textContent = `[${probs.map(v => v.toFixed(2)).join(', ')}]`;
            this.outputEl.classList.add('active');
            Plotly.restyle(this.plotId, { y: [probs] }, [1]);

        } else {
            // Exakte Skalar-Berechnung (z.B. ReLU)
            const x = (Math.random() * 4 - 2);
            const y = this.calculate(x);

            this.inputEl.textContent = x.toFixed(2);
            this.outputEl.textContent = "...";
            this.outputEl.classList.remove('active');

            await new Promise(r => this.timer = setTimeout(r, 800));
            if (this.isDestroyed) return;

            this.outputEl.textContent = y.toFixed(2);
            this.outputEl.classList.add('active');
        }

        await new Promise(r => this.timer = setTimeout(r, 2500));
        if (this.isDestroyed) return;

        this.outputEl.classList.remove('active');
        this.isRunning = false;
    }

    startLoop() {
        const loop = async () => {
            if (this.isDestroyed) return;
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
    document.querySelectorAll(selector).forEach(container => {
        if (container.visualizer) container.visualizer.destroy();
        const types = ['elu', 'relu', 'leakyrelu', 'softmax', 'thresholdedrelu', 'snake'];
        const foundType = types.find(t => container.classList.contains(t));
        if (foundType) {
            container.visualizer = new ActivationVisualizer(container, { type: foundType });
        }
    });
};
