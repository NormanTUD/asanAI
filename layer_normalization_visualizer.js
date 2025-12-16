/* ----------------------------------------------------
 * layernorm_visualizer.js
 * Visualisiert die Layer Normalization Operation:
 * Berechnet Mittelwert/Varianz pro Zeile und transformiert sie.
 * ---------------------------------------------------- */

const LN_COLORS = {
    PRIMARY: '#6f42c1', // Purple for LayerNorm
    HIGHLIGHT: '#fd7e14', // Orange for statistics
    SUCCESS: '#28a745',
    TEXT_DIM: '#6c757d'
};

// --- 1. CSS ---
function getLayerNormStyles(instanceId, rows, cols) {
    return `
    [data-ln-id="${instanceId}"] {
        --cell-size: 40px;
        --grid-rows: ${rows};
        --grid-cols: ${cols};
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        padding: 20px;
        width: 100%;
    }

    [data-ln-id="${instanceId}"] .ln-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 25px;
    }

    [data-ln-id="${instanceId}"] .grid-wrapper {
        position: relative;
        display: grid;
        grid-template-columns: repeat(var(--grid-cols), var(--cell-size));
        grid-template-rows: repeat(var(--grid-rows), var(--cell-size));
        gap: 4px;
        padding: 8px;
        background: #f8f9fa;
        border: 2px solid #dee2e6;
        border-radius: 8px;
    }

    [data-ln-id="${instanceId}"] .ln-cell {
        width: var(--cell-size);
        height: var(--cell-size);
        background: white;
        border: 1px solid #dee2e6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        transition: all 0.3s ease;
        border-radius: 4px;
    }

    /* Highlight für die aktuell verarbeitete Zeile */
    [data-ln-id="${instanceId}"] .row-scanner {
        position: absolute;
        left: 4px;
        width: calc(100% - 8px);
        height: calc(var(--cell-size) + 4px);
        border: 2px solid ${LN_COLORS.HIGHLIGHT};
        background: rgba(253, 126, 20, 0.1);
        border-radius: 6px;
        pointer-events: none;
        transition: top 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        display: none;
    }

    [data-ln-id="${instanceId}"] .stats-panel {
        font-size: 13px;
        color: #333;
        background: #fff;
        padding: 10px 20px;
        border-radius: 20px;
        border: 1px solid ${LN_COLORS.PRIMARY};
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        min-width: 200px;
        text-align: center;
    }

    [data-ln-id="${instanceId}"] .formula {
        font-family: serif;
        font-style: italic;
        margin-top: 10px;
        color: ${LN_COLORS.TEXT_DIM};
    }

    [data-ln-id="${instanceId}"] .active-cell {
        background: ${LN_COLORS.PRIMARY} !important;
        color: white;
        transform: scale(1.05);
    }
    `;
}

// --- 2. Class ---
class LayerNormVisualizer {
    constructor(container, options = {}) {
        this.container = container;
        this.instanceId = 'ln-' + Math.random().toString(36).substr(2, 9);
        this.rows = options.gridRows || 4;
        this.cols = options.gridCols || 4;
        this.isRunning = false;

        this.init();
    }

    init() {
        const style = document.createElement('style');
        style.innerHTML = getLayerNormStyles(this.instanceId, this.rows, this.cols);
        document.head.appendChild(style);

        this.container.setAttribute('data-ln-id', this.instanceId);
        this.renderStructure();
        this.startLoop();
    }

    renderStructure() {
        let cellsHtml = '';
        for (let i = 0; i < this.rows * this.cols; i++) {
            const val = (Math.random() * 10).toFixed(1);
            cellsHtml += `<div class="ln-cell" data-index="${i}">${val}</div>`;
        }

        this.container.innerHTML = `
            <div class="ln-container">
                <h3>Layer Normalization</h3>
                <div class="stats-panel">
                    <span class="stats-text">Warte auf Start...</span>
                </div>
                <div class="grid-wrapper">
                    <div class="row-scanner"></div>
                    ${cellsHtml}
                </div>
                <div class="formula">y = (x - μ) / √(σ² + ε)</div>
            </div>
        `;

        this.cells = this.container.querySelectorAll('.ln-cell');
        this.scanner = this.container.querySelector('.row-scanner');
        this.statsText = this.container.querySelector('.stats-text');
    }

    async runAnimation() {
        this.isRunning = true;
        this.scanner.style.display = 'block';

        for (let r = 0; r < this.rows; r++) {
            // 1. Scanner positionieren
            const topPos = 8 + r * (40 + 4); // 8px padding + index * (cell + gap)
            this.scanner.style.top = topPos + 'px';

            // 2. Werte der Zeile sammeln
            let rowValues = [];
            for (let c = 0; c < this.cols; c++) {
                const cell = this.cells[r * this.cols + c];
                cell.classList.add('active-cell');
                rowValues.push(parseFloat(cell.textContent));
            }

            // 3. Stats berechnen
            const mean = rowValues.reduce((a, b) => a + b) / this.cols;
            const variance = rowValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.cols;
            
            this.statsText.innerHTML = `Zeile ${r+1}: <b>μ</b>=${mean.toFixed(2)} | <b>σ²</b>=${variance.toFixed(2)}`;
            await new Promise(r => setTimeout(r, 800));

            // 4. Zellen transformieren
            for (let c = 0; c < this.cols; c++) {
                const cell = this.cells[r * this.cols + c];
                const x = parseFloat(cell.textContent);
                const normalized = (x - mean) / Math.sqrt(variance + 0.00001);
                
                cell.textContent = normalized.toFixed(2);
                cell.style.backgroundColor = this.getNormColor(normalized);
                cell.classList.remove('active-cell');
            }
            
            await new Promise(r => setTimeout(r, 400));
        }

        this.scanner.style.display = 'none';
        this.statsText.textContent = "Normalisierung abgeschlossen.";
        await new Promise(r => setTimeout(r, 2000));
        this.reset();
    }

    getNormColor(val) {
        // Mapping von ca -2 bis +2 auf eine Blau-Weiß-Rot Skala
        const intensity = Math.min(Math.max((val + 2) / 4, 0), 1);
        const r = Math.floor(111 + (144 * intensity)); 
        const g = Math.floor(66 + (100 * intensity));
        return `rgba(${r}, ${g}, 193, 0.2)`;
    }

    reset() {
        this.renderStructure();
        this.isRunning = false;
    }

    startLoop() {
        const loop = async () => {
            if (!this.isRunning) {
                await this.runAnimation();
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

// --- 3. Global Init ---
window.make_layernorm_visual_explanation = function(selector = '.layernorm_visual_explanation', options = {}) {
    document.querySelectorAll(selector).forEach(container => {
        if (!container.visualizer) {
            container.visualizer = new LayerNormVisualizer(container, options);
        }
    });
};
