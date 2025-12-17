/* ----------------------------------------------------
 * flatten_visualizer.js (Minimal Dark-Mode Edition)
 * ---------------------------------------------------- */

const FLATTEN_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F06292'];

function getFlattenStyles(instanceId) {
    return `
    [data-flatten-id="${instanceId}"] {
        --cell-size: 35px;
        --accent: #6c5ce7;
        display: flex; flex-direction: column; align-items: center;
        padding: 20px; position: relative;
        max-width: fit-content; margin: 0 auto;
    }
    [data-flatten-id="${instanceId}"] .input-matrix {
        display: grid; 
        grid-template-columns: repeat(3, var(--cell-size)); /* 3 Spalten */
        gap: 6px; padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);
    }
    [data-flatten-id="${instanceId}"] .output-vector {
        display: flex; gap: 4px; margin-top: 30px; padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);
    }
    [data-flatten-id="${instanceId}"] .cell {
        width: var(--cell-size); height: var(--cell-size);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: bold; color: white; border-radius: 6px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: transform 0.2s, opacity 0.2s;
    }
    [data-flatten-id="${instanceId}"] .moving-cell {
        position: absolute; z-index: 1000; pointer-events: none;
        box-shadow: 0 5px 15px rgba(0,0,0,0.4);
    }
    [data-flatten-id="${instanceId}"] .placeholder { 
        background: rgba(255, 255, 255, 0.1); 
        border: 1px dashed rgba(255, 255, 255, 0.2); 
        color: transparent; box-shadow: none; 
    }
    [data-flatten-id="${instanceId}"] .arrow {
        margin: 10px 0; color: rgba(255, 255, 255, 0.3); font-size: 18px;
    }
    `;
}

class FlattenVisualizer {
    constructor(container) {
        this.container = container;
        this.instanceId = 'flat-' + Math.random().toString(36).substr(2, 5);
        this.isRunning = false;
        this.init();
    }

    init() {
        const style = document.createElement('style');
        style.textContent = getFlattenStyles(this.instanceId);
        document.head.appendChild(style);
        this.container.setAttribute('data-flatten-id', this.instanceId);
        this.render();
        this.startLoop();
    }

    render() {
        this.container.querySelectorAll('.moving-cell').forEach(el => el.remove());
        
        this.container.innerHTML = `
            <div class="input-matrix" id="inGrid"></div>
            <div class="arrow">↓</div>
            <div class="output-vector" id="outRow"></div>
        `;

        const inGrid = this.container.querySelector('#inGrid');
        const outRow = this.container.querySelector('#outRow');

        for (let i = 0; i < 6; i++) {
            // Input (3x2)
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.backgroundColor = FLATTEN_COLORS[i];
            cell.textContent = (0.1 + (i * 0.1)).toFixed(1);
            inGrid.appendChild(cell);
            
            // Output (1x6)
            const ph = document.createElement('div');
            ph.className = 'cell placeholder';
            outRow.appendChild(ph);
        }
    }

    async animate() {
        if (this.isRunning) return;
        this.isRunning = true;

        const inputs = Array.from(this.container.querySelectorAll('#inGrid .cell'));
        const outputs = Array.from(this.container.querySelectorAll('#outRow .cell'));

        for (let i = 0; i < inputs.length; i++) {
            const source = inputs[i];
            const target = outputs[i];
            
            const cRect = this.container.getBoundingClientRect();
            const sRect = source.getBoundingClientRect();
            const tRect = target.getBoundingClientRect();

            const flyer = document.createElement('div');
            flyer.className = 'cell moving-cell';
            flyer.style.backgroundColor = source.style.backgroundColor;
            flyer.textContent = source.textContent;
            
            flyer.style.left = (sRect.left - cRect.left) + 'px';
            flyer.style.top = (sRect.top - cRect.top) + 'px';
            
            this.container.appendChild(flyer);
            source.style.opacity = '0.1';

            void flyer.offsetWidth;

            flyer.style.transition = 'all 0.45s cubic-bezier(0.5, 0, 0.3, 1.2)';
            flyer.style.left = (tRect.left - cRect.left) + 'px';
            flyer.style.top = (tRect.top - cRect.top) + 'px';

            await new Promise(r => setTimeout(r, 470));

            target.style.backgroundColor = flyer.style.backgroundColor;
            target.textContent = flyer.textContent;
            target.classList.remove('placeholder');
            flyer.remove();
            
            await new Promise(r => setTimeout(r, 60));
        }

        await new Promise(r => setTimeout(r, 3000));
        this.render();
        this.isRunning = false;
    }

    async startLoop() {
        while (true) {
            if (!this.isRunning) await this.animate();
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

window.make_flatten_visual_explanation = (selector = '.flatten_visual_explanation') => {
    document.querySelectorAll(selector).forEach(el => {
        if (!el.dataset.initialized) {
            new FlattenVisualizer(el);
            el.dataset.initialized = "true";
        }
    });
};
