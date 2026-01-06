/**
 * Master Viz Engine: Residuen & Stable Loss Landscape
 */

let masterState = {
    // [X1, X2, Target]
    data: [[2, 2, 5], [8, 8, 2], [2, 8, 8], [8, 2, 1]], 
    weights: { w1: 0.1, w2: 0.1, b: 0.5 },
    isOptimizing: false,
    lr: 0.01,
    path: { x: [], y: [], z: [] }
};

async function initMasterLab() {
    renderPointTable();
    updatePlots();
}

// 1. Der 2D Datenraum mit Fehlerbalken (Residuen)
function generateResiduals() {
    let traces = [];
    
    // Echte Datenpunkte
    traces.push({
        x: masterState.data.map(d => d[0]),
        y: masterState.data.map(d => d[2]),
        mode: 'markers',
        type: 'scatter',
        name: 'Echte Daten',
        marker: { size: 12, color: '#1e293b' }
    });

    // Fehlerlinien (Residuen)
    masterState.data.forEach((row) => {
        const pred = masterState.weights.w1 * row[0] + masterState.weights.w2 * row[1] + masterState.weights.b;
        const dist = Math.abs(row[2] - pred).toFixed(2);
        
        traces.push({
            x: [row[0], row[0]],
            y: [row[2], pred],
            mode: 'lines+text',
            type: 'scatter',
            line: { color: 'rgba(239, 68, 68, 0.5)', width: 2, dash: 'dot' },
            text: ['', dist],
            textposition: 'right center',
            showlegend: false,
            hoverinfo: 'none'
        });
    });

    // Aktuelle Hypothese (Regressionsgerade)
    const lineX = [0, 10];
    const lineY = lineX.map(x => masterState.weights.w1 * x + masterState.weights.w2 * 5 + masterState.weights.b);
    traces.push({
        x: lineX, y: lineY,
        mode: 'lines',
        name: 'KI Vorhersage',
        line: { color: '#3b82f6', width: 4 }
    });

    return traces;
}

// 2. Die Loss-Landschaft (3D Schüssel)
function generateLossLandscape() {
    const size = 25;
    const range = Array.from({length: size}, (_, i) => (i - size/2) / 5);
    const zData = range.map(w1 => range.map(w2 => {
        let totalLoss = 0;
        masterState.data.forEach(p => {
            const pred = w1 * p[0] + w2 * p[1] + masterState.weights.b;
            totalLoss += Math.pow(pred - p[2], 2);
        });
        return Math.log(totalLoss + 1);
    }));

    return [
        {
            z: zData, x: range, y: range,
            type: 'surface', colorscale: 'Portland', opacity: 0.8, showscale: false
        },
        {
            x: masterState.path.x, y: masterState.path.y, z: masterState.path.z,
            mode: 'markers+lines', type: 'scatter3d',
            marker: { size: 4, color: 'yellow' },
            line: { width: 6, color: 'yellow' }
        }
    ];
}

function updatePlots() {
    const dataLayout = {
        xaxis: { range: [0, 10], title: 'Input X' },
        yaxis: { range: [0, 15], title: 'Zielwert (Target)' },
        margin: { t: 20, l: 40, r: 20, b: 40 },
        showlegend: false
    };

    const lossLayout = {
        scene: {
            xaxis: { title: 'W1', range: [-2.5, 2.5] },
            yaxis: { title: 'W2', range: [-2.5, 2.5] },
            zaxis: { title: 'Loss' },
            camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } }
        },
        margin: { t: 0, l: 0, r: 0, b: 0 }
    };

    Plotly.react('master-manifold-plot', generateResiduals(), dataLayout);
    Plotly.react('master-loss-landscape', generateLossLandscape(), lossLayout);
}

// Die vom Button gesuchte Funktion
async function startOptimizationAnimation() {
    if (masterState.isOptimizing) return;
    masterState.isOptimizing = true;
    masterState.path = { x: [], y: [], z: [] };

    for (let i = 0; i < 60; i++) {
        if (!masterState.isOptimizing) break;

        const w1 = masterState.weights.w1;
        const w2 = masterState.weights.w2;
        
        // Einfacher Gradient Descent Schritt
        let gradW1 = 0; let gradW2 = 0;
        masterState.data.forEach(p => {
            const error = (w1 * p[0] + w2 * p[1] + masterState.weights.b) - p[2];
            gradW1 += error * p[0];
            gradW2 += error * p[1];
        });

        masterState.weights.w1 -= (masterState.lr / 10) * gradW1;
        masterState.weights.w2 -= (masterState.lr / 10) * gradW2;

        const currentLoss = masterState.data.reduce((acc, p) => 
            acc + Math.pow((masterState.weights.w1 * p[0] + masterState.weights.w2 * p[1] + masterState.weights.b) - p[2], 2), 0);
        
        masterState.path.x.push(masterState.weights.w1);
        masterState.path.y.push(masterState.weights.w2);
        masterState.path.z.push(Math.log(currentLoss + 1));

        updatePlots();
        await new Promise(r => setTimeout(r, 50));
    }
    masterState.isOptimizing = false;
}

// Tabellen-Logik
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
        <table><thead><tr><th>X1</th><th>X2</th><th>Target</th><th></th></tr></thead><tbody>${rows}</tbody></table>
        <button class="btn btn-train" onclick="masterState.data.push([5,5,5]);renderPointTable();updatePlots()">+ Datenpunkt</button>
    `;
}

window.addEventListener('load', initMasterLab);
