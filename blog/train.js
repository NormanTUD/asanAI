const configs = {
    deep: { inputs: ["x₁", "x₂"], outputs: ["y"], layers: [{nodes: 4, act: 'relu'}], data: [[0,0,0],[0,1,1],[1,0,1],[1,1,0]], model: null, loss: [], isTraining: false, totalEpochs: 0 }
};

const visibleBlocks = { deep: true }; 

function initBlock(id) {
    const c = configs[id];
    c.loss = []; c.totalEpochs = 0;
    if(c.model) c.model.dispose();

    c.model = tf.sequential();
    c.layers.forEach((l, i) => {
        c.model.add(tf.layers.dense({ units: parseInt(l.nodes), activation: l.act, inputShape: i === 0 ? [c.inputs.length] : undefined }));
    });
    c.model.add(tf.layers.dense({ units: c.outputs.length, activation: 'sigmoid' }));

    const lr = parseFloat(document.getElementById(id+'-lr').value) || 0.1;
    c.model.compile({ optimizer: tf.train.adam(lr), loss: 'meanSquaredError' });

    renderUI(id);
    updateVisuals(id, true);
}

function setUiLocked(locked) {
    const inputs = document.querySelectorAll('input, button:not(.btn-stop)');
    inputs.forEach(el => el.disabled = locked);
}

async function toggleTraining(id) {
    const c = configs[id];
    if(c.isTraining) return;

    c.isTraining = true;
    setUiLocked(true);
    const btn = document.getElementById(`btn-${id}-train`);
    if(btn) btn.innerText = "⏳ Training läuft...";

    const xs = tf.tensor2d(c.data.map(r => r.slice(0, c.inputs.length)));
    const ys = tf.tensor2d(c.data.map(r => r.slice(c.inputs.length)));
    const epochs = parseInt(document.getElementById(id+'-epochs').value) || 100;

    for(let i=0; i<epochs && c.isTraining; i++) {
        const h = await c.model.fit(xs, ys, { epochs: 1, verbose: 0 });
        c.loss.push(h.history.loss[0]);
        if(i % 15 === 0) {
            updateVisuals(id);
            await tf.nextFrame();
        }
    }

    c.isTraining = false;
    setUiLocked(false);
    if(btn) btn.innerText = "🚀 Start Gradient Descent";
    xs.dispose(); ys.dispose();
}

function updateVisuals(id, force = false) {
    const c = configs[id];
    
    // 1. Decision Boundary (Manifold)
    plotDeepData();

    // 2. Loss Landscape (Das "Gebirge")
    plotLossLandscape(id);

    // 3. Heatmaps
    const vizContainer = document.getElementById(id+'-tensor-viz');
    if(vizContainer) {
        c.model.layers.forEach((l, idx) => {
            if(l.getWeights().length > 0) {
                let cvs = document.getElementById(`cvs-${id}-${idx}`);
                if(!cvs) {
                    cvs = document.createElement('canvas');
                    cvs.id = `cvs-${id}-${idx}`;
                    cvs.className = "heatmap-canvas";
                    vizContainer.appendChild(cvs);
                }
                tf.tidy(() => {
                    const w = l.getWeights()[0];
                    const norm = w.reshape([w.shape[0], w.shape[1]||1]).sub(w.min()).div(w.max().sub(w.min()).add(0.001)).mul(255).cast('int32');
                    tf.browser.toPixels(norm, cvs);
                });
            }
        });
    }

    // 4. Mathematik Monitor (mit \text{approx})
    const mon = document.getElementById(id+'-math-monitor');
    if(mon) {
        let h = "";
        c.model.layers.forEach((l, idx) => {
            const w = l.getWeights(); if(!w.length) return;
            const W = w[0].arraySync();
            const texW = "\\begin{pmatrix} " + (Array.isArray(W[0]) ? W.map(r => r.map(v=>v.toFixed(2)).join(" & ")).join(" \\\\ ") : W.map(v=>v.toFixed(2)).join(" & ")) + " \\end{pmatrix}";
            h += `<div>$ W_{${idx+1}} \\text{ approx } ${texW} $</div>`;
        });
        mon.innerHTML = h; 
        if(window.MathJax) MathJax.typesetPromise([mon]);
    }
}

function plotLossLandscape(id) {
    const c = configs[id];
    const chartEl = document.getElementById('master-loss-landscape');
    if(!chartEl) return;

    // Vereinfachte Loss-Visualisierung für Echtzeit-Performance
    const layout = {
        title: 'Loss History (Log)',
        margin: {t:30, b:30, l:40, r:10},
        yaxis: {type: 'log'},
        autosize: true
    };
    Plotly.react(chartEl, [{
        y: c.loss, type: 'scatter', line: {color: '#ef4444'}
    }], layout, {responsive: true});
}

function plotDeepData() {
    const c = configs.deep;
    const chartEl = document.getElementById('deep-data-chart');
    if(!chartEl) return;

    const steps = 12;
    const gridX = [], gridY = [];
    for(let i=0; i<=steps; i++) {
        for(let j=0; j<=steps; j++) {
            gridX.push(i/steps); gridY.push(j/steps);
        }
    }

    tf.tidy(() => {
        const inputs = tf.tensor2d(gridX.map((v,i) => [v, gridY[i]]));
        const preds = c.model.predict(inputs).dataSync();
        Plotly.react(chartEl, [
            { x: gridX, y: gridY, z: Array.from(preds), type: 'contour', colorscale: 'RdBu', showscale: false, opacity: 0.5 },
            { x: c.data.map(r=>r[0]), y: c.data.map(r=>r[1]), mode: 'markers', marker: { color: c.data.map(r=>r[2]), size: 10, line: {width:1, color:'black'}} }
        ], { margin:{t:30,b:20,l:30,r:10}, title: 'KI Erkennung (Decision Boundary)' }, {displayModeBar: false});
    });
}

function renderUI(id) {
    const c = configs[id];
    const gui = document.getElementById(id+'-gui');
    const thr = document.getElementById(id+'-thr');
    const tbody = document.querySelector(`#${id}-train-table tbody`);
    
    gui.innerHTML = c.layers.map((l, i) => `<div class="layer-box"><b>L${i+1} (${l.act}):</b> ${l.nodes} Nodes</div>`).join('');
    thr.innerHTML = c.inputs.map(h => `<th>${h}</th>`).join('') + `<th>Soll</th>`;
    
    tbody.innerHTML = "";
    c.data.forEach((row, ri) => {
        const tr = tbody.insertRow();
        row.forEach((v, ci) => {
            const td = tr.insertCell();
            const inp = document.createElement('input');
            inp.type="number"; inp.value=v; inp.step="0.1"; inp.style.width="45px";
            inp.oninput = (e) => { c.data[ri][ci] = parseFloat(e.target.value) || 0; updateVisuals(id); };
            td.appendChild(inp);
        });
    });
}

function addRow(id) {
    configs[id].data.push(new Array(configs[id].inputs.length + 1).fill(0));
    renderUI(id);
}

function train_onload() {
    initBlock('deep');
}
