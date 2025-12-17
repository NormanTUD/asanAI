/* ----------------------------------------------------
 * activation_visualizer.js - Marker follows the curve
 * ---------------------------------------------------- */

function getActivationStyles(instanceId) {
    return `
    [data-act-id="${instanceId}"] {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: inherit;
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
        this.type = (options.type || 'relu').toLowerCase();
        this.instanceId = Math.random().toString(36).substr(2, 9);
        this.plotId = `plot-${this.instanceId}`;
        this.isRunning = false;
        this.isDestroyed = false;
        this.timer = null;
        this.barColors = ['#FF6384', '#36A2EB', '#FFCE56'];
        
        // Initialer State
        this.currentX = 0;
        this.currentY = 0;

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

    calculate(x, context = []) {
        const theta = 1.0;
        switch (this.type) {
            case 'relu': return Math.max(0, x);
            case 'leakyrelu': return x > 0 ? x : 0.1 * x;
            case 'elu': return x > 0 ? x : 1.0 * (Math.exp(x) - 1);
            case 'thresholdedrelu': return x > theta ? x : 0;
            case 'snake': return x + (Math.pow(Math.sin(x), 2));
            case 'softmax':
                if (context.length === 0) return 1.0;
                const exps = context.map(v => Math.exp(v));
                const sum = exps.reduce((a, b) => a + b, 0);
                return Math.exp(x) / sum;
            default: return x;
        }
    }

    renderStructure() {
        const isSoftmax = this.type === 'softmax';
        const ioContent = isSoftmax ? '' : `
            <div class="values-row">
                <span class="cell input-cell">0.00</span>
                <span style="color:#ccc;">→</span>
                <span class="cell output-cell">0.00</span>
            </div>
        `;

        this.container.innerHTML = `
            <div class="formula-name">${this.type}</div>
            <div id="${this.plotId}" class="plot-container"></div>
            <div class="io-container">${ioContent}</div>
        `;
        
        if (!isSoftmax) {
            this.inputEl = this.container.querySelector('.input-cell');
            this.outputEl = this.container.querySelector('.output-cell');
        }
    }

    initPlot() {
        const plotDiv = document.getElementById(this.plotId);
        if (!plotDiv || typeof Plotly === 'undefined') return;

        let data = [];
        const gray = 'rgb(128, 128, 128)';
        
        let layout = {
            margin: { l: 30, r: 30, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: false,
            xaxis: { showgrid: false, zerolinecolor: '#ccc', tickfont: {size: 9, color: gray} },
            yaxis: { showgrid: false, zerolinecolor: '#ccc', tickfont: {size: 9, color: gray} }
        };

        if (this.type === 'softmax') {
            layout.grid = {rows: 1, columns: 2, pattern: 'independent'};
            data = [
                { x: ['z1', 'z2', 'z3'], y: [0, 0, 0], type: 'bar', marker: {color: this.barColors}, xaxis: 'x', yaxis: 'y' },
                { x: ['p1', 'p2', 'p3'], y: [0, 0, 0], type: 'bar', marker: {color: this.barColors}, xaxis: 'x2', yaxis: 'y2' }
            ];
            layout.xaxis = { domain: [0, 0.45], title: {text: 'Logits', font: {size: 10, color: gray}}, fixedrange: true };
            layout.xaxis2 = { domain: [0.55, 1], title: {text: 'Softmax', font: {size: 10, color: gray}}, fixedrange: true };
            layout.yaxis = { range: [-4, 4], fixedrange: true };
            layout.yaxis2 = { range: [0, 1.1], fixedrange: true };
        } else {
            const startX = (this.type === 'thresholdedrelu') ? -1 : -3;
            const endX = (this.type === 'thresholdedrelu') ? 4 : 3;
            const xVals = [], yVals = [];
            for (let x = startX; x <= endX; x += 0.1) {
                xVals.push(x);
                yVals.push(this.calculate(x));
            }
            data.push({
                x: xVals, y: yVals,
                type: 'scatter', mode: 'lines',
                line: { color: '#007bff', width: 2.5 },
                hoverinfo: 'none'
            });
            data.push({
                x: [this.currentX], y: [this.currentY],
                type: 'scatter', mode: 'markers',
                marker: { symbol: 'x', size: 10, color: '#ff4757' },
                hoverinfo: 'none'
            });
            layout.xaxis.fixedrange = true;
            layout.yaxis.fixedrange = true;
        }

        Plotly.newPlot(this.plotId, data, layout, { staticPlot: true, responsive: true });
    }

    async animateTo(targetX, duration = 1000) {
        const startX = this.currentX;
        const startTime = performance.now();

        return new Promise(resolve => {
            const step = (now) => {
                if (this.isDestroyed) return resolve();
                
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Sinus-Easing
                const ease = 0.5 * (1 - Math.cos(Math.PI * progress));
                
                // Wir berechnen nur X linear (mit Easing)
                this.currentX = startX + (targetX - startX) * ease;
                // Y wird JEDEN Frame basierend auf der Funktion berechnet -> Marker folgt der Kurve
                this.currentY = this.calculate(this.currentX);

                const plotDiv = document.getElementById(this.plotId);
                if (plotDiv) {
                    Plotly.restyle(this.plotId, { x: [[this.currentX]], y: [[this.currentY]] }, [1]);
                }

                if (this.inputEl) this.inputEl.textContent = this.currentX.toFixed(2);
                if (this.outputEl) this.outputEl.textContent = this.currentY.toFixed(2);

                if (progress < 1) {
                    this.animFrame = requestAnimationFrame(step);
                } else {
                    resolve();
                }
            };
            this.animFrame = requestAnimationFrame(step);
        });
    }

    async runAnimation() {
        if (this.isDestroyed || !document.getElementById(this.plotId)) return;
        this.isRunning = true;

        try {
            if (this.type === 'softmax') {
                const logits = [ (Math.random() * 6 - 3), (Math.random() * 6 - 3), (Math.random() * 6 - 3) ];
                const probs = logits.map(l => this.calculate(l, logits));
                if (document.getElementById(this.plotId)) {
                    Plotly.restyle(this.plotId, { y: [logits] }, [0]);
                    Plotly.restyle(this.plotId, { y: [probs] }, [1]);
                }
            } else {
                const minX = (this.type === 'thresholdedrelu') ? -0.5 : -2;
                const maxX = (this.type === 'thresholdedrelu') ? 3.5 : 2;
                const targetX = (Math.random() * (maxX - minX) + minX);

                // Marker folgt nun der Kurve während der 1000ms
                await this.animateTo(targetX, 1000);
            }

            await new Promise(r => this.timer = setTimeout(r, 5000));
        } catch (e) {
            console.warn("Animation error:", e);
        } finally {
            this.isRunning = false;
        }
    }

    startLoop() {
        const loop = async () => {
            if (this.isDestroyed || !document.body.contains(this.container)) {
                this.destroy();
                return;
            }
            if (!this.isRunning) {
                await this.runAnimation();
            }
            this.timer = setTimeout(() => requestAnimationFrame(loop), 50);
        };
        requestAnimationFrame(loop);
    }

    destroy() {
        this.isDestroyed = true;
        if (this.timer) clearTimeout(this.timer);
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
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
