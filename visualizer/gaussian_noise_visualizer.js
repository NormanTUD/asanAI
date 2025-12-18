/* ----------------------------------------------------
 * gaussian_noise_visualizer.js
 * Vertical Layout: Input -> Noise -> Output
 * Styled to match Reshape Visualizer.
 * ---------------------------------------------------- */

function getGaussianStyles(instanceId) {
    return `
    [data-gn-id="${instanceId}"] {
        --cell-size: 35px;
        --border-width: 4px;
        --accent-color: #ffc107;
        display: flex; flex-direction: column; align-items: center;
        width: 100%; font-family: sans-serif; padding: 20px;
        background: transparent;
    }
    [data-gn-id="${instanceId}"] .main-layout {
        display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    [data-gn-id="${instanceId}"] .grid-column {
        display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    [data-gn-id="${instanceId}"] .grid {
        display: grid; grid-template-columns: repeat(4, var(--cell-size));
        gap: var(--border-width);
    }
    [data-gn-id="${instanceId}"] .cell {
        width: var(--cell-size); height: var(--cell-size);
        background-color: rgba(0,0,0,0.05); border-radius: 4px;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: bold; color: #444;
        transition: all 0.3s ease;
    }
    [data-gn-id="${instanceId}"] .cell.active {
        transform: scale(1.1);
        z-index: 10;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        background-color: rgba(0,0,0,0.1);
    }
    [data-gn-id="${instanceId}"] .math-operator {
        font-size: 20px; font-weight: bold; color: #ccc; margin: 5px 0;
    }
    [data-gn-id="${instanceId}"] .label {
        font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666;
    }
    [data-gn-id="${instanceId}"] .noise-label { color: var(--accent-color); }
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
                        ${Array.from({length: 16}, () => `<div class="cell">0.5</div>`).join('')}
                    </div>
                </div>
                <div class="math-operator">&plus;</div>
                <div class="grid-column">
                    <div class="label noise-label">Gaussian Noise</div>
                    <div class="grid" id="${this.instanceId}-noise">
                        ${Array.from({length: 16}, () => `<div class="cell" style="color:transparent; background:rgba(0,0,0,0.03); border: 1px dashed #ccc;">0</div>`).join('')}
                    </div>
                </div>
                <div class="math-operator">&equals;</div>
                <div class="grid-column">
                    <div class="label">Resulting Output</div>
                    <div class="grid" id="${this.instanceId}-output">
                        ${Array.from({length: 16}, () => `<div class="cell" style="color:transparent; background:rgba(0,0,0,0.03);">0.5</div>`).join('')}
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
            // Reset to "Placeholder" state
            for(let i=0; i<16; i++) {
                noiseCells[i].textContent = "0";
                noiseCells[i].style.color = "transparent";
                noiseCells[i].style.backgroundColor = "rgba(0,0,0,0.03)";
                outCells[i].textContent = "0.5";
                outCells[i].style.color = "transparent";
                outCells[i].style.backgroundColor = "rgba(0,0,0,0.03)";
                [inCells[i], noiseCells[i], outCells[i]].forEach(c => c.classList.remove('active'));
            }

            for (let i = 0; i < 16; i++) {
                [inCells[i], noiseCells[i], outCells[i]].forEach(c => c.classList.add('active'));

                const noise = (this.randomGaussian() * 0.18);
                const result = 0.5 + noise;

                // Step 1: Generate Noise
                await new Promise(r => setTimeout(r, 700)); 
                noiseCells[i].textContent = (noise >= 0 ? '+' : '') + noise.toFixed(1);
                noiseCells[i].style.color = "white";
                
                // Coloring logic based on noise polarity
                const intensity = Math.min(Math.abs(noise) * 4, 0.8);
                noiseCells[i].style.backgroundColor = noise > 0 
                    ? `rgba(40, 167, 69, ${intensity + 0.2})`  // Greenish
                    : `rgba(220, 53, 69, ${intensity + 0.2})`; // Reddish

                // Step 2: Compute Result
                await new Promise(r => setTimeout(r, 500));
                outCells[i].textContent = result.toFixed(1);
                outCells[i].style.color = "white";
                outCells[i].style.backgroundColor = "#355c7d"; // Deep blue like Reshape palette

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
