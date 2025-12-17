/* ----------------------------------------------------
 * gaussian_noise_visualizer.js
 * Visualizes GaussianNoise: Input + Normal Distribution Noise = Output.
 * Transparent, darkmode-friendly, neutral labels.
 * ---------------------------------------------------- */

function getGaussianNoiseStyles(instanceId) {
    return `
    [data-gn-id="${instanceId}"] {
        --cell-size: 35px;
        --border-width: 1px;
        --accent-color: #f0ad4e;
        display: flex; flex-direction: column; align-items: center;
        width: 100%; font-family: 'Monaco', 'Consolas', monospace;
        background: transparent; color: #888;
    }
    [data-gn-id="${instanceId}"] .main-layout {
        display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap;
    }
    [data-gn-id="${instanceId}"] .grid-box {
        display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    [data-gn-id="${instanceId}"] .grid {
        display: grid; grid-template-columns: repeat(4, var(--cell-size));
        background-color: #444; border: var(--border-width) solid #444;
        gap: var(--border-width);
    }
    [data-gn-id="${instanceId}"] .cell {
        width: var(--cell-size); height: var(--cell-size);
        background-color: rgba(255,255,255,0.05);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; transition: all 0.2s;
    }
    [data-gn-id="${instanceId}"] .cell.active {
        background-color: rgba(240, 173, 78, 0.2);
        color: var(--accent-color);
        font-weight: bold;
    }
    [data-gn-id="${instanceId}"] .math-sign {
        font-size: 24px; color: #555; margin-top: 20px;
    }
    [data-gn-id="${instanceId}"] .label {
        font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
    }
    `;
}

class GaussianNoiseVisualizer {
    constructor(container) {
        this.container = container;
        this.instanceId = 'gn-' + Math.random().toString(36).substr(2, 9);
        this.SIZE = 4;
        this.init();
    }

    init() {
        const style = document.createElement('style');
        style.textContent = getGaussianNoiseStyles(this.instanceId);
        document.head.appendChild(style);
        this.container.setAttribute('data-gn-id', this.instanceId);

        this.container.innerHTML = `
            <div class="main-layout">
                <div class="grid-box">
                    <div class="label">Input (x)</div>
                    <div class="grid" id="${this.instanceId}-input">
                        ${Array.from({length: 16}, () => `<div class="cell">0.5</div>`).join('')}
                    </div>
                </div>
                <div class="math-sign">+</div>
                <div class="grid-box">
                    <div class="label" style="color:var(--accent-color)">Noise (ε ~ N)</div>
                    <div class="grid" id="${this.instanceId}-noise">
                        ${Array.from({length: 16}, () => `<div class="cell">0.0</div>`).join('')}
                    </div>
                </div>
                <div class="math-sign">=</div>
                <div class="grid-box">
                    <div class="label">Output (y)</div>
                    <div class="grid" id="${this.instanceId}-output">
                        ${Array.from({length: 16}, () => `<div class="cell">0.5</div>`).join('')}
                    </div>
                </div>
            </div>
        `;
        this.run();
    }

    // Helper for Box-Muller transform to get Gaussian Noise
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
            [...inCells, ...noiseCells, ...outCells].forEach(c => c.classList.remove('active'));

            for (let i = 0; i < 16; i++) {
                const baseValue = 0.5;
                const noise = (this.randomGaussian() * 0.2); // StdDev = 0.2
                const result = baseValue + noise;

                // Highlight current cell
                inCells[i].classList.add('active');
                noiseCells[i].classList.add('active');
                outCells[i].classList.add('active');

                noiseCells[i].textContent = (noise >= 0 ? '+' : '') + noise.toFixed(2);
                outCells[i].textContent = result.toFixed(2);

                // Visual Feedback: background intensity based on noise
                const intensity = Math.min(Math.abs(noise) * 2, 0.6);
                noiseCells[i].style.backgroundColor = noise > 0 
                    ? `rgba(40, 167, 69, ${intensity})` 
                    : `rgba(220, 53, 69, ${intensity})`;

                await new Promise(r => setTimeout(r, 150));
                
                // Keep the active state for a moment, then fade
                if (i % 4 === 3) await new Promise(r => setTimeout(r, 300));
            }
            
            await new Promise(r => setTimeout(r, 2000));
            // Reset text
            noiseCells.forEach(c => { c.textContent = '0.0'; c.style.backgroundColor = ''; });
            outCells.forEach(c => { c.textContent = '0.5'; });
        }
    }
}

window.make_gaussian_noise_visualizer = (sel) => {
    document.querySelectorAll(sel).forEach(el => { if (!el.visualizer) el.visualizer = new GaussianNoiseVisualizer(el); });
};
