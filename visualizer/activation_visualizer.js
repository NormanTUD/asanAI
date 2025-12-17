/* ----------------------------------------------------
 * activation_visualizer.js - Ultra Smooth & Path Following
 * ---------------------------------------------------- */

function getActivationStyles(instanceId) {
    const gray = 'rgb(128, 128, 128)';
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
    [data-act-id="${instanceId}"] .plot-container { width: 100%; height: 180px; }
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
    [data-act-id="${instanceId}"] .cell { font-size: 13px; color: ${gray}; }
    [data-act-id="${instanceId}"] .formula-name {
        font-size: 12px;
        font-weight: bold;
        color: ${gray};
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
        this.isDestroyed = false;
        this.isVisible = false;
        this.plotInitialized = false;
        
        // Animation State
        this.currentX = 0;
        this.targetX = 0;
        this.startX = 0;
        this.barColors = ['#FF6384', '#36A2EB', '#FFCE56'];

        this.init();
    }

    init() {
        this.container.setAttribute('data-act-id', this.instanceId);
        const styleSheet = document.createElement("style");
        styleSheet.setAttribute('data-style-for', this.instanceId);
        styleSheet.innerText = getActivationStyles(this.instanceId);
        document.head.appendChild(styleSheet);

        this.renderStructure();

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const wasVisible = this.isVisible;
                this.isVisible = entry.isIntersecting;
                if (this.isVisible && !wasVisible && this.plotInitialized) {
                    this.startLoop();
                }
            });
        }, { threshold: 0.05 });
        this.observer.observe(this.container);

        setTimeout(() => {
            if (!this.isDestroyed && document.getElementById(this.plotId)) {
                this.initPlot();
            }
        }, 40);
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
        this.container.innerHTML = `
            <div class="formula-name">${this.type}</div>
            <div id="${this.plotId}" class="plot-container"></div>
            <div class="io-container">
                ${isSoftmax ? '' : `
                    <div class="values-row">
                        <span class="cell input-cell">0.00</span>
                        <span style="color:rgb(128,128, 128);">→</span>
                        <span class="cell output-cell">0.00</span>
                    </div>
                `}
            </div>
        `;
        if (!isSoftmax) {
            this.inputEl = this.container.querySelector('.input-cell');
            this.outputEl = this.container.querySelector('.output-cell');
        }
    }

    initPlot() {
        const plotDiv = document.getElementById(this.plotId);
        if (!plotDiv || typeof Plotly === 'undefined') return;

        const gray = 'rgb(128, 128, 128)';
        let data = [];
        let layout = {
            margin: { l: 30, r: 30, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: false,
            xaxis: { showgrid: false, zerolinecolor: '#ccc', tickfont: {size: 9, color: gray}, fixedrange: true },
            yaxis: { showgrid: false, zerolinecolor: '#ccc', tickfont: {size: 9, color: gray}, fixedrange: true }
        };

        if (this.type === 'softmax') {
            layout.grid = {rows: 1, columns: 2, pattern: 'independent'};
            data = [
                { x: ['z1', 'z2', 'z3'], y: [0, 0, 0], type: 'bar', marker: {color: this.barColors}, xaxis: 'x', yaxis: 'y' },
                { x: ['p1', 'p2', 'p3'], y: [0, 0, 0], type: 'bar', marker: {color: this.barColors}, xaxis: 'x2', yaxis: 'y2' }
            ];
            layout.xaxis = { domain: [0, 0.45], title: {text: 'Logits', font: {size: 10, color: gray}}, tickfont: {color: gray}, fixedrange: true };
            layout.xaxis2 = { domain: [0.55, 1], title: {text: 'Softmax', font: {size: 10, color: gray}}, tickfont: {color: gray}, fixedrange: true };
            layout.yaxis.range = [-4, 4];
            layout.yaxis2 = { range: [0, 1.1], tickfont: {color: gray}, fixedrange: true };
        } else {
            const startX = (this.type === 'thresholdedrelu') ? -1 : -3;
            const endX = (this.type === 'thresholdedrelu') ? 4 : 3;
            const xVals = [], yVals = [];
            for (let x = startX; x <= endX; x += 0.1) {
                xVals.push(x);
                yVals.push(this.calculate(x));
            }
            data.push({ x: xVals, y: yVals, type: 'scatter', mode: 'lines', line: { color: '#007bff', width: 2.5 }, hoverinfo: 'none' });
            data.push({ x: [this.currentX], y: [this.calculate(this.currentX)], type: 'scatter', mode: 'markers', marker: { symbol: 'x', size: 10, color: '#ff4757' }, hoverinfo: 'none' });
        }

        Plotly.newPlot(this.plotId, data, layout, { staticPlot: true, responsive: true }).then(() => {
            this.plotInitialized = true;
            if (this.isVisible) this.startLoop();
        });
    }

    startLoop() {
        if (this.isDestroyed || !this.isVisible) return;
        
        const run = async () => {
            if (this.isDestroyed || !this.isVisible) return;
            
            if (this.type === 'softmax') {
                const logits = [ (Math.random() * 6 - 3), (Math.random() * 6 - 3), (Math.random() * 6 - 3) ];
                const probs = logits.map(l => this.calculate(l, logits));
                const plotDiv = document.getElementById(this.plotId);
                if (plotDiv) {
                    await Plotly.animate(this.plotId, { data: [{y: logits}, {y: probs}], traces: [0, 1] }, 
                        { transition: { duration: 800, easing: 'cubic-in-out' }, frame: { duration: 800, redraw: false } });
                }
                this.timer = setTimeout(() => run(), 2000);
            } else {
                const minX = (this.type === 'thresholdedrelu') ? -0.5 : -2;
                const maxX = (this.type === 'thresholdedrelu') ? 3.5 : 2;
                this.targetX = Math.random() * (maxX - minX) + minX;
                this.startX = this.currentX;
                
                const duration = 1200;
                const startTime = performance.now();

                const animate = (now) => {
                    if (this.isDestroyed || !this.isVisible) return;
                    const plotDiv = document.getElementById(this.plotId);
                    if (!plotDiv) return;

                    const progress = Math.min((now - startTime) / duration, 1);
                    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                    
                    this.currentX = this.startX + (this.targetX - this.startX) * ease;
                    const currentY = this.calculate(this.currentX);

                    // Manueller Update pro Frame für Pfadtreue
                    Plotly.restyle(this.plotId, { x: [[this.currentX]], y: [[currentY]] }, [1]);
                    
                    if (this.inputEl) this.inputEl.textContent = this.currentX.toFixed(2);
                    if (this.outputEl) this.outputEl.textContent = currentY.toFixed(2);

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        this.timer = setTimeout(() => run(), 1500);
                    }
                };
                requestAnimationFrame(animate);
            }
        };
        run();
    }

    destroy() {
        this.isDestroyed = true;
        this.isVisible = false;
        if (this.observer) this.observer.disconnect();
        if (this.timer) clearTimeout(this.timer);
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
