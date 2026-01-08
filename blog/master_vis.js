/**
 * Master Viz Engine: 2D Regression Lab (Stable & Synchronized)
 */

let masterState = {
    // [X1, Target]
    data: [[2, 5], [4, 8], [6, 7], [8, 12]], 
    weights: { w1: 0.5, b: 1.0 },
    optimizer: 'adam',
    isOptimizing: false,
    lr: 0.02,
    path: { x: [], y: [], z: [] },
    // Adam State
    m: {w1:0, b:0}, v: {w1:0, b:0}, t: 0
};

async function initMasterLab() {
    injectDynamicHTML();
    renderPointTable();
    updatePlots();
}

function injectDynamicHTML() {
    const container = document.getElementById('master-data-input');
    if (!container) return;
    
    container.innerHTML = `
        <div id="table-area"></div>
        <div class="control-panel" style="background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #cbd5e0; margin-top:15px;">
            <h4 style="margin-top:0">Optimizer Settings</h4>
            <select id="opt-select" onchange="masterState.optimizer=this.value" style="width:100%; padding:5px; margin-bottom:10px;">
                <option value="adam">Adam Optimizer (Stabil)</option>
                <option value="sgd">Standard SGD</option>
            </select>
            <label>Learning Rate: <input type="range" min="0.001" max="0.1" step="0.001" value="0.02" oninput="masterState.lr=parseFloat(this.value); document.getElementById('lr-val').innerText=this.value"></label>
            <span id="lr-val">0.02</span>
            <hr>
            <label>Gewicht (w1): <input type="range" min="-3" max="3" step="0.05" id="w1-range" value="0.5"></label><br>
            <label>Bias (b): <input type="range" min="-5" max="10" step="0.1" id="b-range" value="1.0"></label>
        </div>
        <div id="master-math-display" style="background:white; padding:15px; border-radius:8px; border:1px solid #e2e8f0; margin-top:15px; min-height:80px;"></div>
    `;

    document.getElementById('w1-range').oninput = (e) => { masterState.weights.w1 = parseFloat(e.target.value); updatePlots(); };
    document.getElementById('b-range').oninput = (e) => { masterState.weights.b = parseFloat(e.target.value); updatePlots(); };
}

function updateMath() {
    const container = document.getElementById('master-math-display');
    if (!container || !window.MathJax) return;
    const {w1, b} = masterState.weights;
    const loss = calcCurrentLoss();

    container.innerHTML = `
        <div class="math-row">Vorhersage: $y = ${w1.toFixed(2)} \\cdot x + ${b.toFixed(2)}$</div>
        <div class="math-row">Loss (MSE): $L = \\frac{1}{n} \\sum (y_i - \\hat{y}_i)^2 = ${loss.toFixed(4)}$</div>
    `;
    MathJax.typesetPromise([container]);
}

function calcCurrentLoss(w1 = masterState.weights.w1, b = masterState.weights.b) {
    const n = masterState.data.length;
    if (n === 0) return 0;
    return masterState.data.reduce((acc, p) => acc + Math.pow((w1 * p[0] + b) - p[1], 2), 0) / n;
}

function generateResiduals() {
    let traces = [];
    const {w1, b} = masterState.weights;

    // Datenpunkte
    traces.push({
        x: masterState.data.map(d => d[0]), y: masterState.data.map(d => d[1]),
        mode: 'markers', type: 'scatter', marker: { size: 12, color: '#1e293b' }, name: 'Daten'
    });

    // Residuen mit Labels
    masterState.data.forEach(p => {
        const pred = w1 * p[0] + b;
        const diff = (p[1] - pred).toFixed(2);
        traces.push({
            x: [p[0], p[0]], y: [p[1], pred],
            mode: 'lines+text', type: 'scatter', 
            line: { color: 'red', width: 1.5, dash: 'dot' },
            text: ['', `Δ:${diff}`], textposition: 'right center',
            textfont: { size: 10, color: 'red' },
            showlegend: false
        });
    });

    // Linie
    const lx = [0, 10];
    const ly = lx.map(x => w1 * x + b);
    traces.push({ x: lx, y: ly, mode: 'lines', line: { color: '#3b82f6', width: 4 }, name: 'Modell' });

    return traces;
}

function generateLossLandscape() {
    const size = 25;
    // Wir plotten w1 gegen b für die Landschaft
    const wRange = Array.from({length: size}, (_, i) => (i - size/2) / 4); 
    const bRange = Array.from({length: size}, (_, i) => (i - size/2) / 2 + masterState.weights.b); // Dynamisch um aktuellen Bias

    const zData = wRange.map(w => bRange.map(b => Math.log(calcCurrentLoss(w, b) + 1)));
    const currentZ = Math.log(calcCurrentLoss() + 1);

    return [
        {
            z: zData, x: bRange, y: wRange,
            type: 'surface', colorscale: 'Portland', opacity: 0.7, showscale: false
        },
        {
            x: [masterState.weights.b], y: [masterState.weights.w1], z: [currentZ],
            mode: 'markers', type: 'scatter3d',
            marker: { size: 10, color: 'white', symbol: 'diamond', line: {color: 'black', width: 2} }
        }
    ];
}

function updatePlots() {
	if($("#master-manifold-plot").length == 0) {
		return false;
	}
    Plotly.react('master-manifold-plot', generateResiduals(), {
        xaxis: {range:[0,10], title: 'Input (x)'}, 
        yaxis: {range:[-2,15], title: 'Target (y)'}, 
        margin: {t:10,b:40,l:40,r:10}, showlegend: false
    });
    
    // Bereinigtes Layout gegen die GUI Warnings
    const lossLayout = {
        scene: { 
            xaxis: {title: 'Bias (b)'}, 
            yaxis: {title: 'Gewicht (w1)'}, 
            zaxis: {title: 'Log Loss'},
            camera: {eye: {x:1.6, y:1.6, z:1.4}}
        },
        margin: {t:0,b:0,l:0,r:0}
    };

    Plotly.react('master-loss-landscape', generateLossLandscape(), lossLayout);
    updateMath();
}

async function startOptimizationAnimation() {
    if (masterState.isOptimizing) return;
    masterState.isOptimizing = true;
    masterState.m = {w1:0, b:0}; masterState.v = {w1:0, b:0}; masterState.t = 0;

    for (let i = 0; i < 100; i++) {
        if (!masterState.isOptimizing) break;

        const n = masterState.data.length;
        let dw1=0, db=0;

        masterState.data.forEach(p => {
            const err = (masterState.weights.w1 * p[0] + masterState.weights.b) - p[1];
            dw1 += (2/n) * err * p[0];
            db += (2/n) * err;
        });

        if (masterState.optimizer === 'sgd') {
            masterState.weights.w1 -= masterState.lr * dw1;
            masterState.weights.b -= masterState.lr * db;
        } else { // Adam
            masterState.t++;
            ['w1', 'b'].forEach(k => {
                const grad = k === 'w1' ? dw1 : db;
                masterState.m[k] = 0.9 * masterState.m[k] + 0.1 * grad;
                masterState.v[k] = 0.999 * masterState.v[k] + 0.001 * grad * grad;
                const mHat = masterState.m[k] / (1 - Math.pow(0.9, masterState.t));
                const vHat = masterState.v[k] / (1 - Math.pow(0.999, masterState.t));
                masterState.weights[k] -= masterState.lr * mHat / (Math.sqrt(vHat) + 1e-8);
            });
        }
        updatePlots();
        await new Promise(r => setTimeout(r, 40));
    }
    masterState.isOptimizing = false;
}

function renderPointTable() {
    const area = document.getElementById('table-area');
    if (!area) return;
    let rows = masterState.data.map((row, i) => `
        <tr>
            <td><input type="number" step="0.5" value="${row[0]}" oninput="masterState.data[${i}][0]=parseFloat(this.value);updatePlots()"></td>
            <td><input type="number" step="0.5" value="${row[1]}" oninput="masterState.data[${i}][1]=parseFloat(this.value);updatePlots()"></td>
            <td><button onclick="masterState.data.splice(${i},1);renderPointTable();updatePlots()">✕</button></td>
        </tr>`).join('');
    area.innerHTML = `<table><thead><tr><th>X (Input)</th><th>Y (Target)</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    <button class="btn" style="width:100%; margin-top:5px; background:#64748b; color:white;" onclick="masterState.data.push([Math.random()*8, Math.random()*10]);renderPointTable();updatePlots()">+ Datenpunkt</button>`;
}

window.addEventListener('load', () => setTimeout(initMasterLab, 500));
