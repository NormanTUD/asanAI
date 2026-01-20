const DeepLab = {
    configs: {
        lin: { inputs: ["x"], outputs: ["y"], layers: [], data: [[1,2],[2,4],[3,6]], model: null, loss: [], isTraining: false, totalEpochs: 0 },
        deep: { inputs: ["In 1", "In 2"], outputs: ["Out"], layers: [{nodes: 4, act: 'relu'}], data: [[0,0,0],[0,1,1],[1,0,1],[1,1,0]], model: null, loss: [], isTraining: false, totalEpochs: 0 }
    },
    visibleBlocks: { lin: true, deep: true },

    init: function(id, resetLoss=true) {
        const c = this.configs[id];
        if(resetLoss) {
            c.loss = []; c.totalEpochs = 0;
            const btn = document.getElementById(`btn-${id}-train`);
            if(btn) btn.innerText = "🚀 Start Training";
        }
        if(c.model) c.model.dispose();

        c.model = tf.sequential();
        if(c.layers.length > 0) {
            c.layers.forEach((l, i) => {
                c.model.add(tf.layers.dense({ units: parseInt(l.nodes), activation: l.act, inputShape: i === 0 ? [c.inputs.length] : undefined }));
            });
            c.model.add(tf.layers.dense({ units: c.outputs.length, activation: id==='lin'?null:'sigmoid' }));
        } else {
            c.model.add(tf.layers.dense({ units: c.outputs.length, inputShape: [c.inputs.length], activation: id==='lin'?null:'sigmoid' }));
        }

        const lrEl = document.getElementById(id+'-lr');
        const lr = lrEl ? parseFloat(lrEl.value) : 0.01;
        c.model.compile({ optimizer: tf.train.adam(lr), loss: 'meanSquaredError' });

        if(id === 'deep') {
            window.model = c.model;
            const viz = document.getElementById('deep-tensor-viz');
            if(viz) viz.innerHTML = '';
            setTimeout(() => { if(typeof restart_fcnn === 'function') restart_fcnn(1); }, 100);
        }

        this.renderUI(id);
        this.updateVisuals(id, true);
    },

    addDeepLayer: function() {
        this.configs.deep.layers.push({nodes: 4, act: 'relu'});
        this.init('deep', false);
    },

    removeDeepLayer: function(index) {
        this.configs.deep.layers.splice(index, 1);
        this.init('deep', false);
    },

    renderUI: function(id) {
        const c = this.configs[id];
        if(id === 'deep') {
            const gui = document.getElementById('deep-gui');
            if(!gui) return;
            gui.innerHTML = "";

            const dIn = document.createElement('div'); dIn.className="layer-box"; dIn.style.borderColor="#10b981";
            dIn.innerHTML = `<span class="layer-badge">INPUT</span>${c.inputs.length} Nodes`;
            gui.appendChild(dIn);

            c.layers.forEach((l, i) => {
                const div = document.createElement('div'); div.className="layer-box";
                div.innerHTML = `<span class="layer-badge">HIDDEN ${i+1}</span>
                        Nodes: <input type="number" value="${l.nodes}" onchange="DeepLab.configs.deep.layers[${i}].nodes=parseInt(this.value); DeepLab.init('deep', false)">
                        <select onchange="DeepLab.configs.deep.layers[${i}].act=this.value; DeepLab.init('deep', false)">
                            <option value="relu" ${l.act==='relu'?'selected':''}>ReLU</option>
                            <option value="tanh" ${l.act==='tanh'?'selected':''}>Tanh</option>
                        </select>
                        <button onclick="DeepLab.removeDeepLayer(${i})" style="color:red; border:none; background:none; cursor:pointer; float:right;">✖</button>`;
                gui.appendChild(div);
            });

            const btnAdd = document.createElement('button');
            btnAdd.className="btn"; btnAdd.innerText="+ Add Layer";
            btnAdd.onclick = () => this.addDeepLayer();
            gui.appendChild(btnAdd);

            const dOut = document.createElement('div'); dOut.className="layer-box"; dOut.style.borderColor="#8b5cf6";
            dOut.innerHTML = `<span class="layer-badge">OUTPUT</span>1 Node`;
            gui.appendChild(dOut);

            const thr = document.getElementById('deep-thr');
            if(thr) thr.innerHTML = c.inputs.map(h => `<th class="in-col">${h}</th>`).join('') + `<th class="out-col">Target</th><th class="res-col">Result</th>`;
            
            this.updateTableRows(id);

            const area = document.getElementById('manual-input-area'); 
            if(area) {
                area.innerHTML = "";
                c.inputs.forEach(() => {
                    const inp = document.createElement('input'); inp.type="number"; inp.value="0"; inp.className="manual-val"; inp.step="0.1";
                    inp.oninput = () => this.runManualPred(); area.appendChild(inp);
                });
            }
        }
    },

	updateVisuals: function(id, force = false) {
    if (!this.visibleBlocks[id] && !force) return;
    const c = this.configs[id];
    
    // 1. Smooth Loss Chart - Check if element exists before calling Plotly
    const chartEl = document.getElementById(id + '-loss-chart');
    if (chartEl && c.loss.length > 0) {
        if (chartEl.data && !force) {
            Plotly.extendTraces(chartEl, {
                x: [[c.totalEpochs]],
                y: [[c.loss[c.loss.length - 1]]]
            }, [0]);
        } else {
            const layout = {
                margin: { t: 30, b: 30, l: 40, r: 10 },
                yaxis: { type: 'log', autorange: true },
                autosize: true,
                uirevision: 'constant' // IMPORTANT: Prevents zoom/pan resets which cause flickering
            };
            Plotly.newPlot(chartEl, [{
                x: c.loss.map((_, i) => i),
                y: c.loss,
                type: 'scatter',
                line: { color: '#ef4444', width: 2 }
            }], layout, { responsive: true });
        }
    }

    // 2. Persistent Weight Visualization
    if (id === 'deep') {
        const vizContainer = document.getElementById('deep-tensor-viz');
        if (vizContainer) {
            let canvasIndex = 0;
            c.model.layers.forEach((l) => {
                if (l.getWeights().length > 0) {
                    let cvs = document.getElementById(`weight-cvs-${canvasIndex}`);
                    if (!cvs) {
                        cvs = document.createElement('canvas');
                        cvs.id = `weight-cvs-${canvasIndex}`;
                        cvs.className = "heatmap-canvas";
                        cvs.style.width = "60px"; // Fixed size prevents layout jumps
                        cvs.style.height = "60px";
                        vizContainer.appendChild(cvs);
                    }
                    tf.tidy(() => {
                        const w = l.getWeights()[0];
                        const norm = w.reshape([w.shape[0], w.shape[1] || 1])
                            .sub(w.min()).div(w.max().sub(w.min()).add(0.001))
                            .mul(255).cast('int32');
                        tf.browser.toPixels(norm, cvs);
                    });
                    canvasIndex++;
                }
            });
        }
        // Throttle the Decision Boundary - this is the biggest flicker culprit
        if (force || c.totalEpochs % 10 === 0) {
            this.plotDeepData(force);
        }
    }

    // 3. Prevent Math Monitor Flicker
    const mon = document.getElementById(id + '-math-monitor');
    if (mon && (force || c.totalEpochs % 50 === 0)) { // High throttle: MathJax is very slow
        let h = "";
        c.model.layers.forEach((l, idx) => {
            const w = l.getWeights();
            if (!w.length) return;
            const W = w[0].arraySync(), B = w[1].arraySync();
            const texW = "\\begin{pmatrix} " + (Array.isArray(W[0]) ? W.map(r => r.map(v => v.toFixed(2)).join(" & ")).join(" \\\\ ") : W.map(v => v.toFixed(2)).join(" & ")) + " \\end{pmatrix}";
            const texB = "\\begin{pmatrix} " + B.map(v => v.toFixed(2)).join(" \\\\ ") + " \\end{pmatrix}";
            h += `<div style="min-height:40px">$ y_{${idx + 1}} = \\text{ReLU}( ${texW}^T x + ${texB} ) $</div>`;
        });
        mon.innerHTML = h;
        if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([mon]);
    }
},

    toggleTraining: async function(id) {
    const c = this.configs[id];
    if (c.isTraining) { c.isTraining = false; return; }

    c.isTraining = true;
    const btn = document.getElementById(`btn-${id}-train`);
    if (btn) { btn.className = "btn btn-stop"; btn.innerText = "🛑 Stop"; }

    const xs = tf.tensor2d(c.data.map(r => r.slice(0, c.inputs.length)));
    const ys = tf.tensor2d(c.data.map(r => r.slice(c.inputs.length)));
    const epochs = parseInt(document.getElementById(id + '-epochs')?.value) || 100;

    for (let i = 0; i < epochs && c.isTraining; i++) {
        const h = await c.model.fit(xs, ys, { epochs: 1, verbose: 0 });
        c.loss.push(h.history.loss[0]);
        c.totalEpochs++;

        // Sync updates with the screen refresh rate
        if (i % 5 === 0 || i === epochs - 1) {
            await new Promise(resolve => requestAnimationFrame(async () => {
                this.updateVisuals(id);
                this.livePredict(id);
                const cons = document.getElementById(id + '-console');
                if (cons && cons.firstChild) {
                    cons.firstChild.textContent = `[Epoch ${c.totalEpochs}] Loss: ${h.history.loss[0].toFixed(6)}`;
                }
                resolve();
            }));
        }
        await tf.nextFrame();
    }

    c.isTraining = false;
    if (btn) { btn.className = "btn btn-train"; btn.innerText = "🚀 Continue Training"; }
    xs.dispose(); ys.dispose();
},

    plotLinData: function(force = false) {
        if(!this.visibleBlocks.lin && !force) return;
        const c = this.configs.lin;
        const chartEl = document.getElementById('lin-data-chart');
        if(!chartEl) return;
        const x = c.data.map(r => r[0]), y = c.data.map(r => r[1]);
        const tx = []; for(let i=0; i<=6; i+=0.5) tx.push(i);
        const py = c.model.predict(tf.tensor2d(tx, [tx.length, 1])).dataSync();
        Plotly.react('lin-data-chart', [{x, y, mode:'markers', name:'Data'}, {x:tx, y:Array.from(py), mode:'lines', name:'Pred'}], {margin:{t:30,b:30,l:30,r:10}, title: 'Regression', autosize:true}, {responsive:true});
    },

    plotDeepData: function(force = false) {
        if(!this.visibleBlocks.deep && !force) return;
        const c = this.configs.deep;
        const chartEl = document.getElementById('deep-data-chart');
        if(!chartEl || c.inputs.length !== 2) return;
        const gridX = [], gridY = [];
        const steps = 20;
        for(let i=0; i<=steps; i++) for(let j=0; j<=steps; j++) { gridX.push(i/steps * 1.2 - 0.1); gridY.push(j/steps * 1.2 - 0.1); }
        tf.tidy(() => {
            const inputs = tf.tensor2d(gridX.map((v,i) => [v, gridY[i]]));
            const preds = c.model.predict(inputs).dataSync();
            Plotly.react('deep-data-chart', [
                { x: gridX, y: gridY, z: Array.from(preds), type: 'contour', showscale: false, opacity: 0.4, colorscale: 'RdBu' },
		    // Inside plotDeepData function
		    {
			    x: c.data.map(r=>r[0]),
			    y: c.data.map(r=>r[1]),
			    mode: 'markers+text',
			    text: c.data.map(r=>r[2]),
			    textposition: 'top center',
			    marker: {
				    size: 12,
				    color: c.data.map(r=>r[2]),
				    // SWAP THESE: 0 for Blue (Class 0), 1 for Red (Class 1)
				    colorscale: [[0, 'blue'], [1, 'red']],
				    line: {color: 'black', width: 2}
			    }
		    },
            ], { margin:{t:30,b:30,l:30,r:10}, title: 'Decision Boundary', xaxis: {range: [-0.1, 1.1]}, yaxis: {range: [-0.1, 1.1]}, autosize: true }, {responsive: true});
        });
    },

    loadPreset: function(n) {
        if(n==='AND') this.configs.deep = {...this.configs.deep, layers:[{nodes:2,act:'relu'}], data:[[0,0,0],[0,1,0],[1,0,0],[1,1,1]]};
        if(n==='XOR') this.configs.deep = {...this.configs.deep, layers:[{nodes:4,act:'relu'}], data:[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]};
        this.init('deep');
    },

    addRow: function(id) { 
        this.configs[id].data.push(new Array(this.configs[id].inputs.length + 1).fill(0)); 
        this.updateTableRows(id); 
    },

    livePredict: function(id) {
        if(id !== 'deep') return;
        this.configs[id].data.forEach((row, ri) => {
            const el = document.getElementById(`res-${id}-${ri}`);
            if(!el) return;
            tf.tidy(() => {
                const p = this.configs[id].model.predict(tf.tensor2d([row.slice(0, this.configs[id].inputs.length)])).dataSync();
                el.innerText = p[0].toFixed(3);
            });
        });
        this.runManualPred();
    },

    runManualPred: function() {
        const inps = document.querySelectorAll('.manual-val');
        if(!inps.length) return;
        const vals = Array.from(inps).map(i => parseFloat(i.value) || 0);
        tf.tidy(() => {
            const p = this.configs.deep.model.predict(tf.tensor2d([vals])).dataSync();
            const resEl = document.getElementById('manual-result');
            if(resEl) resEl.innerText = p[0].toFixed(4);
        });
    },

    updateTableRows: function(id) {
        const tbody = document.querySelector(`#${id}-train-table tbody`);
        if(!tbody) return;
        tbody.innerHTML = "";
        this.configs[id].data.forEach((row, ri) => {
            const tr = tbody.insertRow();
            row.forEach((v, ci) => {
                const td = tr.insertCell();
                const inp = document.createElement('input');
                inp.type = "number"; inp.value = v; inp.step = "0.1";
                inp.oninput = (e) => { this.configs[id].data[ri][ci] = parseFloat(e.target.value) || 0; this.livePredict(id); };
                td.appendChild(inp);
            });
            const resCell = tr.insertCell();
            resCell.id = `res-${id}-${ri}`;
            resCell.className = "res-col";
        });
        this.livePredict(id);
    },

    setupObservers: function() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const isLin = entry.target.id.includes('lin');
                this.visibleBlocks[isLin ? 'lin' : 'deep'] = entry.isIntersecting;
                if(entry.isIntersecting) this.updateVisuals(isLin ? 'lin' : 'deep');
            });
        }, { threshold: 0.1 });
        ['lin-loss-chart', 'deep-loss-chart'].forEach(id => {
            const el = document.getElementById(id);
            if(el) observer.observe(el);
        });
    }
};

window.addEventListener('load', () => {
    DeepLab.init('lin');
    DeepLab.init('deep');
    DeepLab.setupObservers();
});
