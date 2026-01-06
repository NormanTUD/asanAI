const configs = {
	lin: { inputs: ["x"], outputs: ["y"], layers: [], data: [[1,2],[2,4],[3,6]], model: null, loss: [], isTraining: false, totalEpochs: 0 },
	deep: { inputs: ["In 1", "In 2"], outputs: ["Out"], layers: [{nodes: 4, act: 'relu'}], data: [[0,0,0],[0,1,1],[1,0,1],[1,1,0]], model: null, loss: [], isTraining: false, totalEpochs: 0 }
};

function initBlock(id, resetLoss=true) {
	const c = configs[id];
	log(id, `Initialisiere Modell (Reset: ${resetLoss})...`);
	if(resetLoss) {
		c.loss = []; c.totalEpochs = 0;
		const btn = document.getElementById(`btn-${id}-train`);
		if(btn) btn.innerText = "🚀 Training Starten";
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

	c.model.compile({ optimizer: tf.train.adam(parseFloat(document.getElementById(id+'-lr').value)), loss: 'meanSquaredError' });

	if(id === 'deep') {
		window.model = c.model;
		document.getElementById('deep-tensor-viz').innerHTML = '';
		setTimeout(() => { if(typeof restart_fcnn === 'function') restart_fcnn(1); }, 100);
	}

	renderUI(id);
	updateVisuals(id);
	log(id, `Modell bereit.`);
}

function addDeepLayer() {
	configs.deep.layers.push({nodes: 4, act: 'relu'});
	initBlock('deep', false);
}

function removeDeepLayer(index) {
	configs.deep.layers.splice(index, 1);
	initBlock('deep', false);
}

function renderUI(id) {
	const c = configs[id];
	if(id === 'deep') {
		const gui = document.getElementById('deep-gui');
		gui.innerHTML = "";

		const dIn = document.createElement('div'); dIn.className="layer-box"; dIn.style.borderColor="#10b981";
		dIn.innerHTML = `<span class="layer-badge">INPUT</span>${c.inputs.length} Nodes`;
		gui.appendChild(dIn);

		c.layers.forEach((l, i) => {
			const div = document.createElement('div'); div.className="layer-box";
			div.innerHTML = `<span class="layer-badge">HIDDEN ${i+1}</span>
				    Nodes: <input type="number" value="${l.nodes}" onchange="configs.deep.layers[${i}].nodes=parseInt(this.value); initBlock('deep', false)">
				    <select onchange="configs.deep.layers[${i}].act=this.value; initBlock('deep', false)">
					<option value="relu" ${l.act==='relu'?'selected':''}>ReLU</option>
					<option value="tanh" ${l.act==='tanh'?'selected':''}>Tanh</option>
				    </select>
				    <button onclick="removeDeepLayer(${i})" style="color:red; border:none; background:none; cursor:pointer; float:right;">✖</button>`;
			gui.appendChild(div);
		});

		const btnAdd = document.createElement('button');
		btnAdd.className="btn";
		btnAdd.innerText="+ Schicht hinzufügen";
		btnAdd.onclick = addDeepLayer;
		gui.appendChild(btnAdd);

		const dOut = document.createElement('div'); dOut.className="layer-box"; dOut.style.borderColor="#8b5cf6";
		dOut.innerHTML = `<span class="layer-badge">OUTPUT</span>1 Node`;
		gui.appendChild(dOut);

		document.getElementById('deep-thr').innerHTML = c.inputs.map(h => `<th class="in-col">${h}</th>`).join('') + `<th class="out-col">Soll</th><th class="res-col">Ist</th>`;
		updateTableRows(id);

		const area = document.getElementById('manual-input-area'); area.innerHTML = "";
		c.inputs.forEach(() => {
			const inp = document.createElement('input'); inp.type="number"; inp.value="0"; inp.className="manual-val"; inp.step="0.1";
			inp.oninput = runManualPred; area.appendChild(inp);
		});
	}
}

function updateVisuals(id) {
	const c = configs[id];

	const layout = {
		margin: {t:30, b:30, l:40, r:10},
		title: 'Gesamte Loss History',
		xaxis: {
			title: 'Epoche',
			autorange: true
		},
		yaxis: {
			title: 'Loss',
			autorange: true,
			type: 'log'
		},
		autosize: true,
		uirevision: c.loss.length.toString()
	};

	const config = { responsive: true };
	const epochsX = c.loss.map((_, index) => index);

	Plotly.react(id+'-loss-chart', [{
		x: epochsX,
		y: c.loss,
		type: 'scatter',
		line: {color: '#ef4444', width: 2},
		name: 'MSE'
	}], layout, config);

	if(id === 'deep') {
		const vizContainer = document.getElementById('deep-tensor-viz');
		let canvasIndex = 0;
		c.model.layers.forEach((l) => {
			if(l.getWeights().length > 0) {
				let cvs = document.getElementById(`weight-cvs-${canvasIndex}`);
				if(!cvs) {
					cvs = document.createElement('canvas');
					cvs.id = `weight-cvs-${canvasIndex}`;
					cvs.className = "heatmap-canvas";
					vizContainer.appendChild(cvs);
				}
				tf.tidy(() => {
					const w = l.getWeights()[0];
					const norm = w.reshape([w.shape[0], w.shape[1]||1]).sub(w.min()).div(w.max().sub(w.min()).add(0.001)).mul(255).cast('int32');
					tf.browser.toPixels(norm, cvs);
				});
				canvasIndex++;
			}
		});
		while(document.getElementById(`weight-cvs-${canvasIndex}`)) {
			document.getElementById(`weight-cvs-${canvasIndex}`).remove();
			canvasIndex++;
		}
		plotDeepData();
	}

	const mon = document.getElementById(id+'-math-monitor');
	let h = "";
	c.model.layers.forEach((l, idx) => {
		const w = l.getWeights(); if(!w.length) return;
		const W = w[0].arraySync(), B = w[1].arraySync();
		const texW = "\\begin{pmatrix} " + (Array.isArray(W[0]) ? W.map(r => r.map(v=>v.toFixed(2)).join(" & ")).join(" \\\\ ") : W.map(v=>v.toFixed(2)).join(" & ")) + " \\end{pmatrix}";
		const texB = "\\begin{pmatrix} " + B.map(v => v.toFixed(2)).join(" \\\\ ") + " \\end{pmatrix}";
		h += `<div>$ y_{${idx+1}} = \\sigma ( ${texW}^T \\cdot x_{${idx}} + ${texB} ) $</div>`;
	});
	mon.innerHTML = h; MathJax.typesetPromise([mon]);
	if(id==='lin') plotLinData();
}

async function toggleTraining(id) {
	const c = configs[id];
	if(c.isTraining) {
		c.isTraining = false;
		log(id, "Training pausiert.");
		return;
	}

	c.isTraining = true;
	const btn = document.getElementById(`btn-${id}-train`);
	btn.className = "btn btn-stop"; btn.innerText = "🛑 Stoppen";
	log(id, "Training läuft...");

	const xs = tf.tensor2d(c.data.map(r => r.slice(0, c.inputs.length)));
	const ys = tf.tensor2d(c.data.map(r => r.slice(c.inputs.length)));

	const epochs = parseInt(document.getElementById(id+'-epochs').value);

	for(let i=0; i<epochs && c.isTraining; i++) {
		const h = await c.model.fit(xs, ys, { epochs: 1, verbose: 0 });
		c.loss.push(h.history.loss[0]);
		c.totalEpochs++;
		if(i % 5 === 0 || i === epochs-1) {
			updateVisuals(id); livePredict(id);
			document.getElementById(id+'-console').firstChild.textContent = `[Epoch ${c.totalEpochs}] Loss: ${h.history.loss[0].toFixed(6)}`;
		}
		await tf.nextFrame();
	}

	c.isTraining = false;
	btn.className = "btn btn-train";
	btn.innerText = "🚀 Training Fortsetzen"; 
	xs.dispose(); ys.dispose();
	log(id, "Training Zyklus beendet.");
}

function plotLinData() {
	const c = configs.lin;
	const x = c.data.map(r => r[0]), y = c.data.map(r => r[1]);
	const tx = []; for(let i=0; i<=6; i+=0.5) tx.push(i);
	const py = c.model.predict(tf.tensor2d(tx, [tx.length, 1])).dataSync();
	Plotly.react('lin-data-chart', [{x,y,mode:'markers',name:'Data'}, {x:tx,y:Array.from(py),mode:'lines',name:'Pred'}], {margin:{t:30,b:30,l:30,r:10}, title: 'Regression', autosize:true}, {responsive:true});
}

function plotDeepData() {
	const c = configs.deep;
	if(c.inputs.length !== 2) {
		document.getElementById('deep-data-chart').innerHTML = "<br><center>Visualisierung nur für 2 Inputs verfügbar</center>";
		return;
	}

	const x1 = c.data.map(r => r[0]);
	const x2 = c.data.map(r => r[1]);
	const y_true = c.data.map(r => r[2]);

	const gridX = [], gridY = [], gridZ = [];
	const steps = 20;
	for(let i=0; i<=steps; i++) {
		for(let j=0; j<=steps; j++) {
			gridX.push(i/steps * 1.2 - 0.1);
			gridY.push(j/steps * 1.2 - 0.1);
		}
	}

	tf.tidy(() => {
		const inputs = tf.tensor2d(gridX.map((v,i) => [v, gridY[i]]));
		const preds = c.model.predict(inputs).dataSync();

		const traceContour = {
			x: gridX, y: gridY, z: Array.from(preds),
			type: 'contour', showscale: false, opacity: 0.4,
			colorscale: 'RdBu', contours: { start: 0, end: 1, size: 0.1 }
		};

		const traceData = {
			x: x1, y: x2, mode: 'markers+text',
			text: y_true, textposition: 'top center',
			marker: { size: 12, color: y_true, colorscale: [[0, 'red'], [1, 'blue']], line: {color: 'black', width: 2} }
		};

		Plotly.react('deep-data-chart', [traceContour, traceData], {
			margin:{t:30,b:30,l:30,r:10},
			title: 'Decision Boundary',
			xaxis: {range: [-0.1, 1.1]}, yaxis: {range: [-0.1, 1.1]},
			autosize: true
		}, {responsive: true});
	});
}

function loadPreset(n) {
	if(n==='AND') configs.deep = {...configs.deep, layers:[{nodes:2,act:'relu'}], data:[[0,0,0],[0,1,0],[1,0,0],[1,1,1]]};
	if(n==='XOR') configs.deep = {...configs.deep, layers:[{nodes:4,act:'relu'}], data:[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]};
	initBlock('deep');
}

function addRow(id) { 
	configs[id].data.push(new Array(configs[id].inputs.length + 1).fill(0)); 
	updateTableRows(id); 
}

function livePredict(id) {
	if(id !== 'deep') return;
	configs[id].data.forEach((row, ri) => {
		const el = document.getElementById(`res-${id}-${ri}`);
		if(!el) return;
		tf.tidy(() => {
			const p = configs[id].model.predict(tf.tensor2d([row.slice(0, configs[id].inputs.length)])).dataSync();
			el.innerText = p[0].toFixed(3);
		});
	});
	runManualPred();
}

function runManualPred() {
	const inps = document.querySelectorAll('.manual-val');
	if(!inps.length) return;
	const vals = Array.from(inps).map(i => parseFloat(i.value) || 0);
	tf.tidy(() => {
		const p = configs.deep.model.predict(tf.tensor2d([vals])).dataSync();
		document.getElementById('manual-result').innerText = p[0].toFixed(4);
	});
}

function updateTableRows(id) {
	const tbody = document.querySelector(`#${id}-train-table tbody`);
	if(!tbody) return;
	tbody.innerHTML = "";
	configs[id].data.forEach((row, ri) => {
		const tr = tbody.insertRow();
		row.forEach((v, ci) => {
			const td = tr.insertCell();
			const inp = document.createElement('input');
			inp.type = "number"; inp.value = v; inp.step = "0.1";
			inp.oninput = (e) => { configs[id].data[ri][ci] = parseFloat(e.target.value) || 0; livePredict(id); };
			td.appendChild(inp);
		});
		tr.insertCell().id = `res-${id}-${ri}`; tr.cells[tr.cells.length-1].className = "res-col";
	});
	livePredict(id);
}
