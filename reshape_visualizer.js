/* ----------------------------------------------------
 * reshape_visualizer_v4.js
 * ---------------------------------------------------- */

const RESHAPE_PALETTE = [
    '#f8b195', '#f67280', '#c06c84', '#6c5b7b', 
    '#355c7d', '#28a745', '#ffc107', '#007bff'
];

function getReshapeStyles(instanceId) {
    return `
    [data-reshape-id="${instanceId}"] {
        --cell-size: 35px;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: sans-serif;
        padding: 20px;
        width: 100%;
        position: relative;
    }

    [data-reshape-id="${instanceId}"] .tensor-input-group {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border-left: 3px solid #6c757d;
        border-right: 3px solid #6c757d;
        border-radius: 8px;
    }

    [data-reshape-id="${instanceId}"] .grid {
        display: grid;
        gap: 4px;
    }

    [data-reshape-id="${instanceId}"] .input-grid {
        grid-template-columns: repeat(2, var(--cell-size));
    }

    [data-reshape-id="${instanceId}"] .output-grid {
        grid-template-columns: repeat(4, var(--cell-size));
        margin-top: 30px;
        padding: 5px;
        border-top: 2px solid #dee2e6;
    }

    [data-reshape-id="${instanceId}"] .cell {
        width: var(--cell-size);
        height: var(--cell-size);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        color: white;
        border-radius: 4px;
    }

    [data-reshape-id="${instanceId}"] .moving-cell {
        position: absolute;
        z-index: 9999;
        pointer-events: none;
        /* Transition nur hier für den Flug-Effekt */
        transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    [data-reshape-id="${instanceId}"] .placeholder {
        background: rgba(0,0,0,0.05);
        border: 1px dashed #ccc;
        color: transparent;
    }

    [data-reshape-id="${instanceId}"] .label {
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;
        font-weight: bold;
    }
    `;
}

class ReshapeVisualizer {
    constructor(container) {
        this.container = container;
        this.instanceId = 'res-' + Math.random().toString(36).substr(2, 5);
        this.isRunning = false;
        this.init();
    }

    init() {
        const style = document.createElement('style');
        style.textContent = getReshapeStyles(this.instanceId);
        document.head.appendChild(style);
        this.container.setAttribute('data-reshape-id', this.instanceId);
        this.render();
        this.startLoop();
    }

    render() {
        this.container.innerHTML = `
            <div class="label">Input: [2, 2, 2]</div>
            <div class="tensor-input-group">
                <div class="grid input-grid" id="g1"></div>
                <div class="grid input-grid" id="g2"></div>
            </div>
            <div style="margin: 15px 0; color: #999;">&darr; reshape &darr;</div>
            <div class="label">Output: [2, 4]</div>
            <div class="grid output-grid" id="gOut"></div>
        `;

        const g1 = this.container.querySelector('#g1');
        const g2 = this.container.querySelector('#g2');
        const out = this.container.querySelector('#gOut');

        for (let i = 0; i < 8; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.backgroundColor = RESHAPE_PALETTE[i];
            cell.textContent = (0.1 + (i * 0.1)).toFixed(1);
            (i < 4 ? g1 : g2).appendChild(cell);

            const ph = document.createElement('div');
            ph.className = 'cell placeholder';
            out.appendChild(ph);
        }
    }

    async animate() {
        this.isRunning = true;
        const inputs = Array.from(this.container.querySelectorAll('.input-grid .cell'));
        const outputs = Array.from(this.container.querySelectorAll('.output-grid .cell'));

        for (let i = 0; i < inputs.length; i++) {
            const source = inputs[i];
            const target = outputs[i];

            const cRect = this.container.getBoundingClientRect();
            const sRect = source.getBoundingClientRect();
            const tRect = target.getBoundingClientRect();

            const flyer = source.cloneNode(true);
            flyer.classList.add('moving-cell');
            
            // Exakte Startposition
            flyer.style.left = (sRect.left - cRect.left) + 'px';
            flyer.style.top = (sRect.top - cRect.top) + 'px';
            this.container.appendChild(flyer);

            source.style.opacity = '0.1';

            // Animation triggern
            const deltaX = tRect.left - sRect.left;
            const deltaY = tRect.top - sRect.top;

            // Browser Zeit geben für das Rendering der Startposition
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            flyer.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

            // Warten bis Flug fertig
            await new Promise(r => setTimeout(r, 650));

            target.style.backgroundColor = flyer.style.backgroundColor;
            target.textContent = flyer.textContent;
            target.classList.remove('placeholder');
            flyer.remove();

            await new Promise(r => setTimeout(r, 100));
        }

        // Pause am Ende der gesamten Animation
        await new Promise(r => setTimeout(r, 2000));
        this.render(); // Reset DOM
        this.isRunning = false;
    }

    async startLoop() {
        // Endlosschleife ohne parallele Timeouts
        while (true) {
            if (!this.isRunning) {
                await this.animate();
            }
            // Kurze Sicherheits-Pause vor dem nächsten Check
            await new Promise(r => setTimeout(r, 500));
        }
    }
}

window.make_reshape_visualizer = (selector) => {
    document.querySelectorAll(selector).forEach(el => new ReshapeVisualizer(el));
};
