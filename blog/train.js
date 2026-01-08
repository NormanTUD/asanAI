const configs = {
    deep: { 
        inputs: ["x₁", "x₂"], 
        outputs: ["y"], 
        layers: [{nodes: 4, act: 'relu'}], 
        data: [[0,0,0],[0,1,1],[1,0,1],[1,1,0]], 
        model: null, 
        loss: [], 
        isTraining: false, 
        totalEpochs: 0 
    }
};

function initBlock(id) {
    const c = configs[id];
    c.loss = []; c.totalEpochs = 0;
    if(c.model) c.model.dispose();

    c.model = tf.sequential();
    c.layers.forEach((l, i) => {
        c.model.add(tf.layers.dense({ 
            units: parseInt(l.nodes), 
            activation: l.act, 
            inputShape: i === 0 ? [c.inputs.length] : undefined,
            kernelInitializer: 'glorotUniform'
        }));
    });
    c.model.add(tf.layers.dense({ units: c.outputs.length, activation: 'sigmoid' }));

    const lr = parseFloat(document.getElementById(id+'-lr').value) || 0.1;
    c.model.compile({ optimizer: tf.train.adam(lr), loss: 'meanSquaredError' });

    renderUI(id);
    createWeightSliders(id); // Initialisiert die Slider
    updateVisuals(id, true);
}

function createWeightSliders(id) {
    const container = document.getElementById('manual-weight-sliders');
    if(!container) return;
    container.innerHTML = "";
    
    const weights = configs[id].model.layers[0].getWeights()[0].dataSync();
    weights.forEach((w, i) => {
        const div = document.createElement('div');
        div.className = "slider-group";
        div.innerHTML = `
            <label>W${i}: <span id="w-val-${i}">${w.toFixed(2)}</span></label>
            <input type="range" class="weight-slider" data-idx="${i}" 
                   min="-2" max="2" step="0.01" value="${w}" 
                   oninput="updateSingleWeight('${id}', ${i}, this.value)">
        `;
        container.appendChild(div);
    });
}

function updateSingleWeight(id, index, value) {
    const c = configs[id];
    const layer = c.model.layers[0];
    let [weights, biases] = layer.getWeights();
    let wData = weights.dataSync();
    wData[index] = parseFloat(value);
    
    const newWeights = tf.tensor(wData, weights.shape);
    layer.setWeights([newWeights, biases]);
    document.getElementById(`w-val-${index}`).innerText = parseFloat(value).toFixed(2);
    updateVisuals(id);
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
    if(btn) btn.innerText = "⏳ Optimierung...";

    const xs = tf.tensor2d(c.data.map(r => r.slice(0, c.inputs.length)));
    const ys = tf.tensor2d(c.data.map(r => r.slice(c.inputs.length)));
    const epochs = parseInt(document.getElementById(id+'-epochs').value) || 100;

    for(let i=0; i<epochs && c.isTraining; i++) {
        const h = await c.model.fit(xs, ys, { epochs: 1, verbose: 0 });
        c.loss.push(h.history.loss[0]);
        
        if(i % 10 === 0) {
            updateVisuals(id);
            syncSlidersWithModel(id); // Slider bewegen sich mit
            await tf.nextFrame();
        }
    }

    c.isTraining = false;
    setUiLocked(false);
    if(btn) btn.innerText = "🚀 Start Gradient Descent";
    xs.dispose(); ys.dispose();
}

function syncSlidersWithModel(id) {
    const weights = configs[id].model.layers[0].getWeights()[0].dataSync();
    weights.forEach((w, i) => {
        const slider = document.querySelector(`.weight-slider[data-idx="${i}"]`);
        if(slider) {
            slider.value = w;
            document.getElementById(`w-val-${i}`).innerText = w.toFixed(2);
        }
    });
}

function updateVisuals(id, force = false) {
    const c = configs[id];
    
    // 1. Manifold Plot
    plotDeepData();

    // 2. Loss Plot (Das mathematische Gebirge der Fehler)
    const lossEl = document.getElementById('master-loss-landscape');
    if(lossEl) {
        Plotly.react(lossEl, [{
            y: c.loss, type: 'scatter', line: {color: '#ef4444', width: 2}, fill: 'tozeroy'
        }], { 
            margin: {t:30, b:30, l:40, r:10}, title: 'Loss Landscape (MSE)', 
            yaxis: {type: 'log', title: 'Error'} 
        }, {responsive: true});
    }

    // 3. Mathematik Monitor (mit \text{approx})
    const mon = document.getElementById(id+'-math-monitor');
    if(mon) {
        let h = "";
        c.model.layers.forEach((l, idx) => {
            const w = l.getWeights()[0]; if(!w) return;
            const W = w.arraySync();
            const texW = "\\begin{pmatrix} " + (Array.isArray(W[0]) ? W.map(r => r.map(v=>v.toFixed(2)).join(" & ")).join(" \\\\ ") : W.map(v=>v.toFixed(2)).join(" & ")) + " \\end{pmatrix}";
            h += `<div style="margin-bottom:8px;">$ W_{${idx+1}} \\text{ approx } ${texW} $</div>`;
        });
        mon.innerHTML = h; 
        if(window.MathJax) MathJax.typesetPromise([mon]);
    }
}

// ... (plotDeepData, renderUI, addRow bleiben gleich wie im vorherigen Schritt)

function plotDeepData() {
    const c = configs.deep;
    const chartEl = document.getElementById('deep-data-chart');
    if(!chartEl) return;

    const steps = 15;
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
            { x: gridX, y: gridY, z: Array.from(preds), type: 'contour', colorscale: 'RdBu', showscale: false, opacity: 0.6 },
            { x: c.data.map(r=>r[0]), y: c.data.map(r=>r[1]), mode: 'markers', marker: { color: c.data.map(r=>r[2]), size: 10, line: {width:1, color:'black'}} }
        ], { margin:{t:30,b:20,l:30,r:10}, title: 'KI-Manifold (Datenformung)' }, {displayModeBar: false});
    });
}

function renderUI(id) {
    const c = configs[id];
    const tbody = document.querySelector(`#${id}-train-table tbody`);
    const thr = document.getElementById(id+'-thr');
    
    thr.innerHTML = c.inputs.map(h => `<th>${h}</th>`).join('') + `<th>Soll</th>`;
    tbody.innerHTML = "";
    c.data.forEach((row, ri) => {
        const tr = tbody.insertRow();
        row.forEach((v, ci) => {
            const td = tr.insertCell();
            const inp = document.createElement('input');
            inp.type="number"; inp.value=v; inp.step="0.1"; inp.style.width="40px";
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
