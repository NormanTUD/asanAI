/* ----------------------------------------------------
 * gaussian_noise_visualizer_v3.js
 * Vertical Layout: Input -> Noise -> Output
 * ---------------------------------------------------- */

function getGaussianStyles(instanceId) {
    return `
    [data-gn-id="${instanceId}"] {
        --cell-size: 40px;
        --border-color: #444;
        --accent-color: #f0ad4e;
        display: flex; flex-direction: column; align-items: center;
        width: 100%; font-family: 'Monaco', 'Consolas', monospace;
        background: transparent; color: #ccc; padding: 20px;
    }
    [data-gn-id="${instanceId}"] .main-layout {
        display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    [data-gn-id="${instanceId}"] .grid-column {
        display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    [data-gn-id="${instanceId}"] .grid {
        display: grid; grid-template-columns: repeat(4, var(--cell-size));
        background-color: var(--border-color); border: 1px solid var(--border-color);
        gap: 1px;
    }
    [data-gn-id="${instanceId}"] .cell {
        width: var(--cell-size); height: var(--cell-size);
        background-color: rgba(255,255,255,0.05);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; transition: background 0.4s;
    }
    [data-gn-id="${instanceId}"] .cell.active {
        outline: 2px solid var(--accent-color);
        outline-offset: -2px;
        z-index: 10;
        background-color: rgba(255, 255, 255, 0.15);
    }
    [data-gn-id="${instanceId}"] .math-operator {
        font-size: 20px; font-weight: bold; color: #666; margin: 5px 0;
    }
    [data-gn-id="${instanceId}"] .label {
        font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 1px;
    }
    `;
}

class GaussianNoiseVisualizer {
    constructor(container) {
        this.container = container;
        this.instanceId = 'gn-' + Math.random().toString(36).substr(2, 9);
        this.init();
    }

    init() {
        const style = document.createElement('style');
        style.textContent = getGaussianStyles(this.instanceId);
        document.head.appendChild(style);
        this.container.setAttribute('data-gn-id', this.instanceId);

        this.container.innerHTML = `
            <div class="main-layout">
                <div class="grid-column">
                    <div class="label">Input</div>
                    <div class="grid" id="${this.instanceId}-input">
                        ${Array.from({length: 16}, () => `<div class="cell">0.50</div>`).join('')}
                    </div>
                </div>
                <div class="math-operator">+</div>
                <div class="grid-column">
                    <div class="label" style="color:var(--accent-color)">Gaussian Noise</div>
                    <div class="grid" id="${this.instanceId}-noise">
                        ${Array.from({length: 16}, () => `<div class="cell">0.00</div>`).join('')}
                    </div>
                </div>
                <div class="math-operator">=</div>
                <div class="grid-column">
                    <div class="label">Resulting Output</div>
                    <div class="grid" id="${this.instanceId}-output">
                        ${Array.from({length: 16}, () => `<div class="cell">0.50</div>`).join('')}
                    </div>
                </div>
            </div>
        `;
        this.run();
    }

    randomGaussian() {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    async run() {
        const inCells = this.container.querySelectorAll(`#${this.instanceId}-input .cell`);
        const noiseCells = this.container.querySelectorAll(`#${this.instanceId}-noise .cell`);
        const outCells = this.container.querySelectorAll(`#${this.instanceId}-output .cell`);

        while (true) {
            // Reset
            for(let i=0; i<16; i++) {
                noiseCells[i].textContent = "0.00";
                noiseCells[i].style.backgroundColor = "";
                outCells[i].textContent = "0.50";
                [inCells[i], noiseCells[i], outCells[i]].forEach(c => c.classList.remove('active'));
            }

            for (let i = 0; i < 16; i++) {
                // Focus: Markiere Zellen in allen drei Matrizen
                [inCells[i], noiseCells[i], outCells[i]].forEach(c => c.classList.add('active'));

                const noise = (this.randomGaussian() * 0.18);
                const result = 0.5 + noise;

                // Schritt 1: Rauschen generieren
                await new Promise(r => setTimeout(r, 700)); 
                noiseCells[i].textContent = (noise >= 0 ? '+' : '') + noise.toFixed(2);
                const intensity = Math.min(Math.abs(noise) * 3, 0.7);
                noiseCells[i].style.backgroundColor = noise > 0 
                    ? `rgba(40, 167, 69, ${intensity})` 
                    : `rgba(220, 53, 69, ${intensity})`;

                // Schritt 2: Ergebnis berechnen
                await new Promise(r => setTimeout(r, 500));
                outCells[i].textContent = result.toFixed(2);

                // Kurzes Verweilen auf dem Ergebnis
                await new Promise(r => setTimeout(r, 400));
                [inCells[i], noiseCells[i], outCells[i]].forEach(c => c.classList.remove('active'));
            }
            
            await new Promise(r => setTimeout(r, 3000));
        }
    }
}

window.make_gaussian_noise_visualizer = (sel) => {
    document.querySelectorAll(sel).forEach(el => { if (!el.visualizer) el.visualizer = new GaussianNoiseVisualizer(el); });
};
