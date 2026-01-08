const TrainLab = {
    configs: {
        deep: { 
            inputs: ["x₁", "x₂"], 
            outputs: ["y"], 
            layers: [{nodes: 4, act: 'relu'}], 
            data: [[0,0,0],[0,1,1],[1,0,1],[1,1,0]], 
            model: null, 
            loss: [], 
            isTraining: false 
        }
    },

    init: function(id) {
        const c = this.configs[id];
        if(!c) return;
        c.loss = [];
        if(c.model) c.model.dispose();

        c.model = tf.sequential();
        c.layers.forEach((l, i) => {
            c.model.add(tf.layers.dense({ 
                units: parseInt(l.nodes), 
                activation: l.act, 
                inputShape: i === 0 ? [c.inputs.length] : undefined 
            }));
        });
        c.model.add(tf.layers.dense({ units: c.outputs.length, activation: 'sigmoid' }));
        c.model.compile({ optimizer: tf.train.adam(0.1), loss: 'meanSquaredError' });

        this.renderUI(id);
        this.createWeightSliders(id);
        this.updateVisuals(id);
    },

    createWeightSliders: function(id) {
        const container = document.getElementById('manual-weight-sliders');
        if(!container) return;
        container.innerHTML = "";
        const weights = this.configs[id].model.layers[0].getWeights()[0].dataSync();

        weights.forEach((w, i) => {
            const div = document.createElement('div');
            div.className = "slider-group";
            div.innerHTML = `<label>W${i}: <span id="w-val-${i}">${w.toFixed(2)}</span></label>
            <input type="range" class="w-slider" data-idx="${i}" min="-3" max="3" step="0.01" value="${w}" oninput="TrainLab.manualUpdate('${id}', 0, ${i}, this.value)">`;
            container.appendChild(div);
        });
    },

    manualUpdate: function(id, layerIdx, wIdx, val) {
        const layer = this.configs[id].model.layers[layerIdx];
        let [W, B] = layer.getWeights();
        let wData = W.dataSync();
        wData[wIdx] = parseFloat(val);
        layer.setWeights([tf.tensor(wData, W.shape), B]);
        document.getElementById(`w-val-${wIdx}`).innerText = parseFloat(val).toFixed(2);
        this.updateVisuals(id);
    },

    toggleTraining: async function(id) {
        const c = this.configs[id];
        if(c.isTraining) return;
        c.isTraining = true;

        document.querySelectorAll('input:not([id^="pred-"]), button:not(.btn-stop)').forEach(el => el.disabled = true);

        const xs = tf.tensor2d(c.data.map(r => r.slice(0, c.inputs.length)));
        const ys = tf.tensor2d(c.data.map(r => r.slice(c.inputs.length)));

        for(let i=0; i<parseInt(document.getElementById('deep-epochs').value) && c.isTraining; i++) {
            const h = await c.model.fit(xs, ys, { epochs: 1, verbose: 0 });
            c.loss.push(h.history.loss[0]);
            if(i % 10 === 0) {
                this.updateVisuals(id);
                this.syncSliders(id);
                this.updateLivePrediction();
                await tf.nextFrame();
            }
        }
        c.isTraining = false;
        document.querySelectorAll('input, button').forEach(el => el.disabled = false);
    },

    updateLivePrediction: function() {
        const x1 = parseFloat(document.getElementById('pred-x1').value) || 0;
        const x2 = parseFloat(document.getElementById('pred-x2').value) || 0;
        const model = this.configs.deep.model;
        if(model) {
            tf.tidy(() => {
                const input = tf.tensor2d([[x1, x2]]);
                const output = model.predict(input);
                const val = output.dataSync()[0];
                document.getElementById('pred-output').innerText = val.toFixed(3);
            });
        }
    },

    syncSliders: function(id) {
        const weights = this.configs[id].model.layers[0].getWeights()[0].dataSync();
        weights.forEach((w, i) => {
            const s = document.querySelector(`.w-slider[data-idx="${i}"]`);
            if(s) { s.value = w; document.getElementById(`w-val-${i}`).innerText = w.toFixed(2); }
        });
    },

    updateVisuals: function(id) {
        const c = this.configs[id];
        this.plotDeepData();
        Plotly.react('master-loss-landscape', [{ y: c.loss, type: 'scatter', fill: 'tozeroy', line:{color:'#ef4444'} }], { margin: {t:20,b:30,l:40,r:10}, title: 'Loss Verlauf', yaxis:{type:'log'} });

        const vizContainer = document.getElementById(id+'-tensor-viz');
        if(vizContainer) {
            c.model.layers.forEach((l, idx) => {
                if(l.getWeights().length > 0) {
                    let cvs = document.getElementById(`cvs-${idx}`);
                    if(!cvs) { cvs = document.createElement('canvas'); cvs.id = `cvs-${idx}`; cvs.className = "heatmap-canvas"; vizContainer.appendChild(cvs); }
                    tf.tidy(() => {
                        const w = l.getWeights()[0];
                        const min = w.min(), max = w.max();
                        const normalized = w.sub(min).div(max.sub(min).add(0.0001));
                        const resized = tf.image.resizeBilinear(normalized.reshape([w.shape[0], w.shape[1] || 1, 1]), [60, 200]);
                        tf.browser.toPixels(resized, cvs);
                    });
                }
            });
        }

        const mon = document.getElementById(id+'-math-monitor');
        if(mon) {
            let h = "";
            c.model.layers.forEach((l, idx) => {
                const W = l.getWeights()[0].arraySync();
                const texW = "\\begin{pmatrix} " + (Array.isArray(W[0]) ? W.map(r => r.map(v=>v.toFixed(2)).join(" & ")).join(" \\\\ ") : W.map(v=>v.toFixed(2)).join(" & ")) + " \\end{pmatrix}";
                h += `<div>$ W_{${idx+1}} \\text{ approx } ${texW} $</div>`;
            });
            mon.innerHTML = h;
            if(window.MathJax) MathJax.typesetPromise([mon]);
        }
    },

    plotDeepData: function() {
        const c = this.configs.deep;
        const steps = 15;
        const gridX = [], gridY = [];
        for(let i=0; i<=steps; i++) for(let j=0; j<=steps; j++) { gridX.push(i/steps); gridY.push(j/steps); }
        tf.tidy(() => {
            const inputs = tf.tensor2d(gridX.map((v,i) => [v, gridY[i]]));
            const preds = c.model.predict(inputs).dataSync();
            Plotly.react('deep-data-chart', [{ x: gridX, y: gridY, z: Array.from(preds), type: 'contour', colorscale: 'RdBu', showscale: false, opacity: 0.6 }, { x: c.data.map(r=>r[0]), y: c.data.map(r=>r[1]), mode: 'markers', marker: { color: c.data.map(r=>r[2]), size: 12, line: {width:1, color:'black'}} }], { margin:{t:30,b:30,l:30,r:10}, title: 'Decision Boundary' });
        });
    },

    renderUI: function(id) {
        const c = this.configs[id];
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
                inp.oninput = (e) => { c.data[ri][ci] = parseFloat(e.target.value) || 0; this.updateVisuals(id); };
                td.appendChild(inp);
            });
        });
    },

    addRow: function(id) { this.configs[id].data.push(new Array(this.configs[id].inputs.length + 1).fill(0)); this.renderUI(id); }
};

function train_onload() { TrainLab.init('deep'); }
