const TrainLab = {
	configs: {
		deep: { 
			inputs: ["x₁", "x₂"], 
			outputs: ["y"], 
			layers: [{nodes: 4, act: 'relu'}], 
			data: [[0,0,0],[0,1,1],[1,0,1],[1,1,0]], 
			model: null, 
			loss: [], 
			isTraining: false,
			currentEpoch: 0
		}
	},

	init: function(id) {
		const c = this.configs[id];
		if(!c) return;
		c.loss = [];
		c.isTraining = false;
		c.currentEpoch = 0;
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
		this.updateButtonState(id, "START");
	},

	updateButtonState: function(id, text) {
		const btn = document.getElementById(`${id}-train-btn`);
		if(btn) {
			btn.innerText = text;
			btn.style.background = text === "STOP" ? "#ef4444" : "#22c55e";
		}
	},

	createWeightSliders: function(id) {
		const container = document.getElementById('manual-weight-sliders');
		if(!container) return;
		container.innerHTML = "";
		const weights = this.configs[id].model.layers[0].getWeights()[0].dataSync();

		weights.forEach((w, i) => {
			const div = document.createElement('div');
			div.className = "manual-weight-item";
			div.innerHTML = `
	    <div style="display:flex; justify-content:space-between; align-items:center;">
		<label>W${i+1}</label>
		<b id="w-val-${i}" style="font-family:monospace;">${w.toFixed(4)}</b>
	    </div>
	    <input type="range" class="w-slider" data-idx="${i}" min="-3" max="3" step="0.01" value="${w}" 
	    style="width:100%;" oninput="TrainLab.manualUpdate('${id}', 0, ${i}, this.value)">`;
			container.appendChild(div);
		});
	},

	manualUpdate: function(id, layerIdx, wIdx, val) {
		const layer = this.configs[id].model.layers[layerIdx];
		let [W, B] = layer.getWeights();
		let wData = W.dataSync();
		wData[wIdx] = parseFloat(val);
		layer.setWeights([tf.tensor(wData, W.shape), B]);

		const label = document.getElementById(`w-val-${wIdx}`);
		if(label) label.innerText = parseFloat(val).toFixed(5);

		this.updateVisuals(id);
		this.updateLivePrediction();
	},

	toggleTraining: async function(id) {
		const c = this.configs[id];

		if(c.isTraining) {
			c.isTraining = false;
			this.updateButtonState(id, "CONTINUE");
			return;
		}

		c.isTraining = true;
		this.updateButtonState(id, "STOP");

		const lr = parseFloat(document.getElementById(`${id}-lr`).value);
		c.model.optimizer = tf.train.adam(lr);

		const xs = tf.tensor2d(c.data.map(r => r.slice(0, c.inputs.length)));
		const ys = tf.tensor2d(c.data.map(r => r.slice(c.inputs.length)));
		const totalEpochs = parseInt(document.getElementById(`${id}-epochs`).value);

		while(c.currentEpoch < totalEpochs && c.isTraining) {
			const h = await c.model.fit(xs, ys, { epochs: 1, verbose: 0 });
			c.loss.push(h.history.loss[0]);
			c.currentEpoch++;

			if(c.currentEpoch % 10 === 0) {
				this.updateVisuals(id);
				this.syncSliders(id);
				this.updateLivePrediction();
				await tf.nextFrame();
			}
		}

		if (c.currentEpoch >= totalEpochs) {
			c.isTraining = false;
			this.updateButtonState(id, "START");
			c.currentEpoch = 0; 
		}
	},

	updateLivePrediction: function() {
		const x1 = parseFloat(document.getElementById('pred-x1').value) || 0;
		const x2 = parseFloat(document.getElementById('pred-x2').value) || 0;
		const model = this.configs.deep.model;
		if(model) {
			tf.tidy(() => {
				const out = model.predict(tf.tensor2d([[x1, x2]]));
				const val = out.dataSync()[0];
				const el = document.getElementById('pred-output');
				el.innerText = val.toFixed(4);
				el.style.color = val > 0.5 ? '#3b82f6' : '#ef4444';
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
		this.plotDeepData();

		Plotly.react('master-loss-landscape', [{ 
			y: [...c.loss], 
			type: 'scatter', 
			fill: 'tozeroy', 
			line:{color:'#ef4444'} 
		}], { 
			margin: {t:10,b:30,l:40,r:10}, height: 180, 
			yaxis: {type:'log', title:'Error'}, xaxis: {title:'Epochs'} 
		});

		if (c.model) {
			tf.tidy(() => {
				const inputData = c.data.map(r => r.slice(0, c.inputs.length));
				const xs = tf.tensor2d(inputData);
				const preds = c.model.predict(xs).dataSync();

				c.data.forEach((row, ri) => {
					const targetVal = row[c.inputs.length];
					const predVal = preds[ri];
					const error = Math.abs(predVal - targetVal);
					const predCell = document.getElementById(`pred-${id}-${ri}`);
					const errCell = document.getElementById(`err-${id}-${ri}`);

					if(predCell && errCell) {
						predCell.innerText = predVal.toFixed(3);
						errCell.innerText = error.toFixed(3);
						errCell.style.color = error > 0.2 ? '#ef4444' : '#22c55e';
					}
				});
			});
		}

		// Crystal Clear Heatmaps
		const vizContainer = document.getElementById(id+'-tensor-viz');
		if(vizContainer) {
			c.model.layers.forEach((l, idx) => {
				let cvs = document.getElementById(`cvs-${idx}`);
				if(!cvs && l.getWeights().length > 0) {
					let lbl = document.createElement('div'); lbl.className = "heatmap-label";
					const actName = l.activation.constructor.name.replace('Activation','');
					lbl.innerText = `Layer ${idx+1} (${actName})`;
					vizContainer.appendChild(lbl);
					cvs = document.createElement('canvas'); cvs.id = `cvs-${idx}`; cvs.className = "heatmap-canvas";
					vizContainer.appendChild(cvs);
				}
				if(cvs) tf.tidy(() => {
					const w = l.getWeights()[0];
					const norm = w.sub(w.min()).div(w.max().sub(w.min()).add(0.0001));
					const smallW = w.shape[0];
					const smallH = w.shape[1] || 1;
					tf.browser.toPixels(norm.reshape([smallW, smallH, 1]), cvs);
				});
			});
		}

		// RESTORED: Detailed Mathematical Formulas with live values
		const mon = document.getElementById(id+'-math-monitor');
		if(mon) {
			let h = "";
			c.model.layers.forEach((l, idx) => {
				const weights = l.getWeights();
				if (weights.length < 2) return; 

				const W = weights[0].arraySync();
				const B = weights[1].arraySync();
				const actDisplay = idx === c.model.layers.length - 1 ? "Sigmoid" : "ReLU";

				// Create matrix string: \begin{pmatrix} w11 & w12 \\ w21 & w22 \end{pmatrix}
				const texW = "\\begin{pmatrix} " + (Array.isArray(W[0]) 
					? W.map(r => r.map(v => v.toFixed(3)).join(" & ")).join(" \\\\ ") 
					: W.map(v => v.toFixed(3)).join(" & ")) + " \\end{pmatrix}";

				h += `<div class="formula-block">
		    <b>Layer ${idx+1}:</b><br>
		    $ \\text{out} = \\text{${actDisplay}}\\left( X \\cdot ${texW} + ${B[0].toFixed(3)} \\right) $
		</div>`;
			});
			mon.innerHTML = h;
			if(window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([mon]);
		}
	}, 

	plotDeepData: function() {
		const c = this.configs.deep;
		const steps = 25;
		const gridX = [], gridY = [];
		for(let i=0; i<=steps; i++) for(let j=0; j<=steps; j++) { gridX.push(i/steps); gridY.push(j/steps); }

		tf.tidy(() => {
			const preds = c.model.predict(tf.tensor2d(gridX.map((v,i) => [v, gridY[i]]))).dataSync();
			Plotly.react('deep-data-chart', [
				{ 
					x: gridX, y: gridY, z: Array.from(preds), 
					type: 'contour', colorscale: 'RdBu', showscale: false, opacity: 0.4, reversescale: true 
				}, 
				{ 
					x: c.data.map(r=>r[0]), y: c.data.map(r=>r[1]), 
					mode: 'markers', 
					marker: { color: c.data.map(r => r[2] === 0 ? '#ef4444' : '#3b82f6'), size: 12, line: { width: 2, color: 'white' } } 
				}
			], { margin:{t:10,b:30,l:30,r:10}, height: 250 });
		});
	},

	addRow: function(id) { this.configs[id].data.push([0.5,0.5,0]); this.renderUI(id); },

	renderUI: function(id) {
		const c = this.configs[id];
		const tbody = document.querySelector(`#${id}-train-table tbody`);
		document.getElementById(id+'-thr').innerHTML = `<th style="width:18%">x₁</th><th style="width:18%">x₂</th><th style="width:18%">Tgt</th><th style="width:18%">Prd</th><th style="width:18%">Err</th><th style="width:10%"></th>`;
		tbody.innerHTML = "";
		c.data.forEach((row, ri) => {
			const tr = tbody.insertRow();
			row.forEach((v, ci) => {
				const td = tr.insertCell();
				const inp = document.createElement('input');
				inp.type="number"; inp.value=v; inp.step="0.1";
				inp.oninput = (e) => { c.data[ri][ci] = parseFloat(e.target.value) || 0; this.updateVisuals(id); };
				td.appendChild(inp);
			});
			const predCell = tr.insertCell(); predCell.id = `pred-${id}-${ri}`;
			const errCell = tr.insertCell(); errCell.id = `err-${id}-${ri}`;
			const delCell = tr.insertCell();
			const delBtn = document.createElement('button');
			delBtn.innerHTML = "×";
			delBtn.style = "color:#ef4444; border:none; background:none; cursor:pointer; font-weight:bold;";
			delBtn.onclick = () => this.removeRow(id, ri);
			delCell.appendChild(delBtn);
		});
	},

	removeRow: function(id, index) {
		this.configs[id].data.splice(index, 1);
		this.renderUI(id);
		this.updateVisuals(id);
	}
};

function train_onload() { TrainLab.init('deep'); }

// Wrap everything in a listener to ensure the HTML is parsed first
document.addEventListener('DOMContentLoaded', () => {
	const traininglab_observer = new IntersectionObserver((entries, obs) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				// Ensure the function exists before calling
				if (typeof train_onload === 'function') {
					train_onload();
				}
				obs.unobserve(entry.target);
			}
		});
	}, {
		threshold: 0.1
	});

	const target = document.querySelector('.lab-dashboard');

	if (target) {
		traininglab_observer.observe(target);
	} else {
		// If the element isn't there yet, wait a tiny bit longer
		// as a final safety measure before the fallback
		setTimeout(() => {
			if (typeof train_onload === 'function') train_onload();
		}, 100);
	}
});
