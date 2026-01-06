/**
 * Master Viz Engine: Final Laboratory Edition (Stable)
 */

let masterState = {
    data: [[2, 2, 5], [8, 8, 2], [2, 8, 8], [8, 2, 1]], 
    weights: { w1: 0.1, w2: 0.1, b: 0.5 },
    isOptimizing: false,
    lr: 0.005, // Deutlich verringert gegen Overshooting
    path: { x: [], y: [], z: [] }
};

async function initMasterLab() {
    renderPointTable();
    updatePlots();
    updateMath();
}

function updateMath() {
    const mathContainer = document.getElementById('master-math-display');
    if (!mathContainer) return;

    const w1 = masterState.weights.w1.toFixed(3);
    const w2 = masterState.weights.w2.toFixed(3);
    const b = masterState.weights.b.toFixed(3);
    const loss = calcCurrentLoss().toFixed(4);

    // Volle LaTeX-Integration wie in der Vorlage
    mathContainer.innerHTML = `
        <div class="math-row">$$ \hat{y} = w_1 x_1 + w_2 x_2 + b $$</div>
        <div class="math-row">$$ \hat{y} = ${w1} \cdot x_1 + ${w2} \cdot x_2 + ${b} $$</div>
        <div class="math-row">$$ L = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2 = ${loss} $$</div>
    `;
    if (window.MathJax) MathJax.typesetPromise([mathContainer]);
}

function generateResiduals() {
    let traces = [];
    traces.push({
        x: masterState.data.map(d => d[0]),
        y: masterState.data.map(d => d[2]),
        mode: 'markers', type: 'scatter', name: 'Daten',
        marker: { size: 12, color: '#1e293b' }
    });

    masterState.data.forEach((row) => {
        const pred = masterState.weights.w1 * row[0] + masterState.weights.w2 * row[1] + masterState.weights.b;
        traces.push({
            x: [row[0], row[0]], y: [row[2], pred],
            mode: 'lines', type: 'scatter',
            line: { color: 'rgba(239, 68, 68, 0.5)', width: 2, dash: 'dot' },
            showlegend: false, hoverinfo: 'none'
        });
    });

    const lineX = [0, 10];
    const lineY = lineX.map(x => masterState.weights.w1 * x + masterState.weights.w2 * 5 + masterState.weights.b);
    traces.push({
        x: lineX, y: lineY, mode: 'lines', name: 'Modell',
        line: { color: '#3b82f6', width: 4 }
    });

    return traces;
}

function generateLossLandscape() {
    const size = 30;
    const range = Array.from({length: size}, (_, i) => (i - size/2) / 5);
    const zData = range.map(w1 => range.map(w2 => {
        let totalLoss = 0;
        masterState.data.forEach(p => {
            const pred = w1 * p[0] + w2 * p[1] + masterState.weights.b;
            totalLoss += Math.pow(pred - p[2], 2);
        });
        return Math.log((totalLoss / masterState.data.length) + 1);
    }));

    return [
        { z: zData, x: range, y: range, type: 'surface', colorscale: 'Portland', opacity: 0.8, showscale: false },
        {
            x: masterState.path.x, y: masterState.path.y, z: masterState.path.z,
            mode: 'lines', type: 'scatter3d',
            line: { width: 6, color: 'yellow' }
        },
        {
            x: [masterState.weights.w1], y: [masterState.weights.w2], z: [Math.log(calcCurrentLoss() + 1)],
            mode: 'markers', type: 'scatter3d',
            marker: { size: 8, color: 'white', symbol: 'diamond', line: {color: 'black', width: 2} }
        }
    ];
}

function updatePlots() {
    Plotly.react('master-manifold-plot', generateResiduals(), {
        xaxis: { range: [0, 10], title: 'Feature X1' },
        yaxis: { range: [-2, 15], title: 'Target Y' },
        margin: { t: 20, l: 40, r: 20, b: 40 }, showlegend: false
    });
    Plotly.react('master-loss-landscape', generateLossLandscape(), {
        scene: { 
            xaxis: { title: 'w1', range: [-3, 3] }, 
            yaxis: { title: 'w2', range: [-3, 3] },
            zaxis: { title: 'Log-Loss' } 
        },
        margin: { t: 0, l: 0, r: 0, b: 0 }
    });
    updateMath();
}

async function startOptimizationAnimation() {
    if (masterState.isOptimizing) return;
    masterState.isOptimizing = true;
    masterState.path = { x: [], y: [], z: [] };

    for (let step = 0; step < 120; step++) {
        if (!masterState.isOptimizing) break;

        const { w1, w2, b } = masterState.weights;
        const n = masterState.data.length;
        let dW1 = 0, dW2 = 0, dB = 0;

        masterState.data.forEach(p => {
            const error = (w1 * p[0] + w2 * p[1] + b) - p[2];
            dW1 += (2/n) * error * p[0];
            dW2 += (2/n) * error * p[1];
            dB += (2/n) * error;
        });

        // Update mit Sicherheits-Check gegen NaN (Overshooting)
        masterState.weights.w1 -= masterState.lr * dW1;
        masterState.weights.w2 -= masterState.lr * dW2;
        masterState.weights.b -= masterState.lr * dB;

        masterState.path.x.push(masterState.weights.w1);
        masterState.path.y.push(masterState.weights.w2);
        masterState.path.z.push(Math.log(calcCurrentLoss() + 1));

        if (step % 2 === 0) updatePlots(); // Performance-Optimierung
        await new Promise(r => setTimeout(r, 30));
    }
    masterState.isOptimizing = false;
    updatePlots();
}

function calcCurrentLoss() {
    const n = masterState.data.length;
    if (n === 0) return 0;
    return masterState.data.reduce((acc, p) => 
        acc + Math.pow((masterState.weights.w1 * p[0] + masterState.weights.w2 * p[1] + masterState.weights.b) - p[2], 2), 0) / n;
}

function renderPointTable() {
    const container = document.getElementById('master-data-input');
    if (!container) return;
    let rows = masterState.data.map((row, i) => `
        <tr>
            <td><input type="number" step="0.5" value="${row[0]}" oninput="masterState.data[${i}][0]=parseFloat(this.value);updatePlots()"></td>
            <td><input type="number" step="0.5" value="${row[1]}" oninput="masterState.data[${i}][1]=parseFloat(this.value);updatePlots()"></td>
            <td><input type="number" step="0.5" value="${row[2]}" oninput="masterState.data[${i}][2]=parseFloat(this.value);updatePlots()"></td>
            <td><button onclick="masterState.data.splice(${i},1);renderPointTable();updatePlots()">✕</button></td>
        </tr>`).join('');

    container.innerHTML = `
        <table><thead><tr><th>X1</th><th>X2</th><th>Ziel</th><th></th></tr></thead><tbody>${rows}</tbody></table>
        <button class="btn" style="width:100%; background:#64748b; color:white;" onclick="masterState.data.push([Math.random()*8,Math.random()*8,Math.random()*8]);renderPointTable();updatePlots()">+ Punkt</button>
        <div style="margin-top:15px; background:#f8fafc; padding:10px; border-radius:8px;">
            <label>w1: <input type="range" min="-3" max="3" step="0.1" value="${masterState.weights.w1}" oninput="masterState.weights.w1=parseFloat(this.value);updatePlots()"></label><br>
            <label>w2: <input type="range" min="-3" max="3" step="0.1" value="${masterState.weights.w2}" oninput="masterState.weights.w2=parseFloat(this.value);updatePlots()"></label><br>
            <label>Bias: <input type="range" min="-5" max="10" step="0.1" value="${masterState.weights.b}" oninput="masterState.weights.b=parseFloat(this.value);updatePlots()"></label>
        </div>
        <div id="master-math-display" style="margin-top:10px;"></div>
    `;
}

window.addEventListener('load', () => setTimeout(initMasterLab, 500));
