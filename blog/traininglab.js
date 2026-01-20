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

		const lr = parseFloat(document.getElementById(`${id}-lr`).value);
		c.model.compile({ optimizer: tf.train.adam(lr), loss: 'meanSquaredError' });

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
			div.style = "margin-bottom:8px; font-size:0.75em; border-bottom:1px solid #f8fafc; padding-bottom:4px;";
			div.innerHTML = `
		<div style="display:flex; justify-content:space-between">
		    <label>Weight W${i+1}</label>
		    <b id="w-val-${i}">${w.toFixed(5)}</b>
		</div>
		<input type="range" class="w-slider" data-idx="${i}" min="-3" max="3" step="0.01" value="${w}" 
		style="width:100%; height:12px;" oninput="TrainLab.manualUpdate('${id}', 0, ${i}, this.value)">`;
			container.appendChild(div);
		});
	},

	manualUpdate: function(id, layerIdx, wIdx, val) {
		const layer = this.configs[id].model.layers[layerIdx];
		let [W, B] = layer.getWeights();
		let wData = W.dataSync();
		wData[wIdx] = parseFloat(val);
		// Ensure we pass the original shape back to the tensor
		layer.setWeights([tf.tensor(wData, W.shape), B]);

		const label = document.getElementById(`w-val-${wIdx}`);
		if(label) label.innerText = parseFloat(val).toFixed(5);

		this.updateVisuals(id);
		this.updateLivePrediction();
	},

	toggleTraining: async function(id) {
		const c = this.configs[id];
		if(c.isTraining) return;
		c.isTraining = true;

		const lr = parseFloat(document.getElementById(`${id}-lr`).value);
		c.model.optimizer = tf.train.adam(lr);

		const xs = tf.tensor2d(c.data.map(r => r.slice(0, c.inputs.length)));
		const ys = tf.tensor2d(c.data.map(r => r.slice(c.inputs.length)));
		const epochs = parseInt(document.getElementById(`${id}-epochs`).value);

		for(let i=0; i < epochs && c.isTraining; i++) {
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
	},

	updateLivePrediction: function() {
		const x1 = parseFloat(document.getElementById('pred-x1').value) || 0;
		const x2 = parseFloat(document.getElementById('pred-x2').value) || 0;
		const model = this.configs.deep.model;
		if(model) {
			tf.tidy(() => {
				const out = model.predict(tf.tensor2d([[x1, x2]]));
				document.getElementById('pred-output').innerText = out.dataSync()[0].toFixed(4);
			});
		}
	},

	syncSliders: function(id) {
		const weights = this.configs[id].model.layers[0].getWeights()[0].dataSync();
		weights.forEach((w, i) => {
			const s = document.querySelector(`.w-slider[data-idx="${i}"]`);
			if(s) { s.value = w; document.getElementById(`w-val-${i}`).innerText = w.toFixed(5); }
		});
	},

	updateVisuals: function(id) {
		const c = this.configs[id];

		// 1. Boundary Plot
		this.plotDeepData();

		// 2. Loss Plot
		Plotly.react('master-loss-landscape', [{ 
			y: [...c.loss], 
			type: 'scatter', 
			fill: 'tozeroy', 
			line:{color:'#ef4444'} 
		}], { 
			margin: {t:10,b:30,l:40,r:10}, height: 200, 
			yaxis: {type:'log', title:'Error'}, xaxis: {title:'Epochs'} 
		});

		// 3. TABLE UPDATES: Live Prediction and Error per Row
		if (c.model) {
			tf.tidy(() => {
				// Extract only the input columns from the training data
				const inputData = c.data.map(r => r.slice(0, c.inputs.length));
				const xs = tf.tensor2d(inputData);

				// Get predictions for the entire dataset at once
				const preds = c.model.predict(xs).dataSync();

				c.data.forEach((row, ri) => {
					const targetVal = row[c.inputs.length]; // The 'Target' column
					const predVal = preds[ri];
					const error = Math.abs(predVal - targetVal);

					const predCell = document.getElementById(`pred-${id}-${ri}`);
					const errCell = document.getElementById(`err-${id}-${ri}`);

					if(predCell && errCell) {
						predCell.innerText = predVal.toFixed(3);
						errCell.innerText = error.toFixed(3);

						// Visual feedback: color error based on accuracy
						errCell.style.color = error > 0.2 ? '#ef4444' : '#22c55e';
						errCell.style.fontWeight = 'bold';
					}
				});
			});
		}

		// 4. Activation Heatmaps
		const vizContainer = document.getElementById(id+'-tensor-viz');
		if(vizContainer) {
			c.model.layers.forEach((l, idx) => {
				let cvs = document.getElementById(`cvs-${idx}`);
				if(!cvs && l.getWeights().length > 0) {
					let lbl = document.createElement('div'); lbl.style = "font-size:10px; margin-top:5px;";
					const actName = l.activation.constructor.name.replace('Activation','');
					lbl.innerText = `Layer ${idx+1} (${actName})`;
					vizContainer.appendChild(lbl);
					cvs = document.createElement('canvas'); cvs.id = `cvs-${idx}`; cvs.className = "heatmap-canvas";
					vizContainer.appendChild(cvs);
				}
				if(cvs) tf.tidy(() => {
					const w = l.getWeights()[0];
					const norm = w.sub(w.min()).div(w.max().sub(w.min()).add(0.0001));
					tf.browser.toPixels(tf.image.resizeBilinear(norm.reshape([w.shape[0], w.shape[1] || 1, 1]), [45, 270]), cvs);
				});
			});
		}

		// 5. Mathematical Formulas
		const mon = document.getElementById(id+'-math-monitor');
		if(mon) {
			let h = "";
			c.model.layers.forEach((l, idx) => {
				const weights = l.getWeights();
				if (weights.length < 2) return; 

				const W = weights[0].arraySync();
				const B = weights[1].arraySync();
				const actDisplay = "ReLU";
				const texW = "\\begin{pmatrix} " + (Array.isArray(W[0]) ? W.map(r => r.map(v=>v.toFixed(4)).join(" & ")).join(" \\\\ ") : W.map(v=>v.toFixed(4)).join(" & ")) + " \\end{pmatrix}";

				h += `<div class="formula-block">
		<b>Layer ${idx+1} (${actDisplay}):</b> <br>
		$ \\text{output} = \\text{${actDisplay}}\\left( \\text{input} \\cdot ${texW} + (${B[0].toFixed(5)}) \\right) $
	    </div>`;
			});
			mon.innerHTML = h;
			if(window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([mon]);
		}
	}, 

	plotDeepData: function() {
		const c = this.configs.deep;
		const steps = 20;
		const gridX = [], gridY = [];
		for(let i=0; i<=steps; i++) for(let j=0; j<=steps; j++) { gridX.push(i/steps); gridY.push(j/steps); }

		tf.tidy(() => {
			const preds = c.model.predict(tf.tensor2d(gridX.map((v,i) => [v, gridY[i]]))).dataSync();
			Plotly.react('deep-data-chart', [
				{ 
					x: gridX, y: gridY, z: Array.from(preds), 
					type: 'contour', 
					colorscale: 'RdBu', 
					showscale: false, 
					opacity: 0.4,
					reversescale: true // Matches red=0, blue=1 for the background
				}, 
				{ 
					x: c.data.map(r=>r[0]), 
					y: c.data.map(r=>r[1]), 
					mode: 'markers', 
					marker: { 
						// Map 0 to Red (#ef4444) and anything else (1) to Blue (#3b82f6)
						color: c.data.map(r => r[2] === 0 ? '#ef4444' : '#3b82f6'), 
						size: 12, 
						line: { width: 2, color: 'white' } 
					} 
				}
			], { margin:{t:10,b:30,l:30,r:10}, height: 280 });
		});
	},

	renderUI: function(id) {
		const c = this.configs[id];
		const tbody = document.querySelector(`#${id}-train-table tbody`);
		// Added Pred and Error headers
		document.getElementById(id+'-thr').innerHTML = 
			c.inputs.map(h => `<th>${h}</th>`).join('') + 
			`<th>Target</th><th>Pred</th><th>Err</th>`;

		tbody.innerHTML = "";
		c.data.forEach((row, ri) => {
			const tr = tbody.insertRow();
			row.forEach((v, ci) => {
				const inp = document.createElement('input');
				inp.type="number"; inp.value=v; inp.step="0.1"; inp.style.width="40px";
				inp.oninput = (e) => { 
					c.data[ri][ci] = parseFloat(e.target.value) || 0; 
					this.updateVisuals(id); 
				};
				tr.insertCell().appendChild(inp);
			});
			// Add placeholders for Prediction and Error
			tr.insertCell().id = `pred-${id}-${ri}`;
			tr.insertCell().id = `err-${id}-${ri}`;
		});
	},

	addRow: function(id) { this.configs[id].data.push([0,0,0]); this.renderUI(id); }
};

function train_onload() { TrainLab.init('deep'); }
