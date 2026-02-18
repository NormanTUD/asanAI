function renderBackpropVisual(id) {
	const root = document.getElementById(id);
	if (!root) return;
	const sig = z => 1 / (1 + Math.exp(-z));
	const f = (v, d=4) => Number(v).toFixed(d);

	const S = {
		x1:0.05, x2:0.10, t1:0.01, t2:0.99, lr:0.5,
		w1:0.15, w2:0.20, w3:0.25, w4:0.30, b1:0.35, b2:0.35,
		w5:0.40, w6:0.45, w7:0.50, w8:0.55, b3:0.60, b4:0.60
	};

	let locked = null; // which node/weight is currently locked

	root.innerHTML = `
  <style>
    #${id} { font-family: system-ui, sans-serif; max-width: 960px; }
    #${id} * { box-sizing: border-box; }
    #${id} .bp-top { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: flex-end; }
    #${id} .bp-top label { font-size: 0.72rem; color: #475569; font-weight: 600; }
    #${id} .bp-top input[type=number] { width: 58px; font-size: 0.8rem; padding: 2px 4px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; }
    #${id} .bp-top .bp-group { display: flex; flex-direction: column; gap: 2px; }
    #${id} .bp-btn { border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 600; color: #fff; }
    #${id} svg text { user-select: none; }
    #${id} .bp-info-panel {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 14px 18px; min-height: 100px; font-size: 0.92rem; line-height: 1.9;
      overflow-x: auto; position: relative;
    }
    #${id} .bp-info-panel .eq {
      font-family: 'Courier New', monospace; font-size: 0.84rem;
      background: #f1f5f9; padding: 8px 12px; border-radius: 6px;
      margin: 6px 0; display: block; white-space: pre-wrap; line-height: 1.7;
    }
    #${id} .bp-info-panel .bp-close {
      position: absolute; top: 8px; right: 12px; cursor: pointer;
      background: #e2e8f0; border: none; border-radius: 50%; width: 24px; height: 24px;
      font-size: 0.8rem; color: #475569; display: flex; align-items: center; justify-content: center;
    }
    #${id} .bp-info-panel .bp-close:hover { background: #cbd5e1; }
    #${id} .bp-loss { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    #${id} .bp-loss-track { flex: 1; height: 14px; background: #fee2e2; border-radius: 7px; overflow: hidden; }
    #${id} .bp-loss-fill { height: 100%; background: #ef4444; border-radius: 7px; transition: width 0.3s; }
    @keyframes bpPulse { 0%,100%{stroke-width:2;stroke-opacity:0.3} 50%{stroke-width:7;stroke-opacity:1} }
    #${id} .pulse { animation: bpPulse 5s ease-in-out infinite; }
    #${id} .dim { opacity: 0.12; }
    #${id} .bp-locked-ring { fill: none; stroke: #f59e0b; stroke-width: 3; stroke-dasharray: 4,3; }
    #${id} .bp-locked-ring { transform-origin: center; }
  </style>

  <div class="bp-top">
    <div class="bp-group"><label>$$x_1$$</label><input type="number" data-k="x1" step="0.01"></div>
    <div class="bp-group"><label>$$x_2$$</label><input type="number" data-k="x2" step="0.01"></div>
    <div class="bp-group"><label>$$t_1$$</label><input type="number" data-k="t1" step="0.01"></div>
    <div class="bp-group"><label>$$t_2$$</label><input type="number" data-k="t2" step="0.01"></div>
    <div class="bp-group"><label>$$\\eta$$</label><input type="number" data-k="lr" step="0.05" min="0.01" max="5"></div>
    <div class="bp-group"><label>$$w_1$$</label><input type="number" data-k="w1" step="0.01"></div>
    <div class="bp-group"><label>$$w_2$$</label><input type="number" data-k="w2" step="0.01"></div>
    <div class="bp-group"><label>$$w_3$$</label><input type="number" data-k="w3" step="0.01"></div>
    <div class="bp-group"><label>$$w_4$$</label><input type="number" data-k="w4" step="0.01"></div>
    <div class="bp-group"><label>$$b_1$$</label><input type="number" data-k="b1" step="0.01"></div>
    <div class="bp-group"><label>$$b_2$$</label><input type="number" data-k="b2" step="0.01"></div>
    <div class="bp-group"><label>$$w_5$$</label><input type="number" data-k="w5" step="0.01"></div>
    <div class="bp-group"><label>$$w_6$$</label><input type="number" data-k="w6" step="0.01"></div>
    <div class="bp-group"><label>$$w_7$$</label><input type="number" data-k="w7" step="0.01"></div>
    <div class="bp-group"><label>$$w_8$$</label><input type="number" data-k="w8" step="0.01"></div>
    <div class="bp-group"><label>$$b_3$$</label><input type="number" data-k="b3" step="0.01"></div>
    <div class="bp-group"><label>$$b_4$$</label><input type="number" data-k="b4" step="0.01"></div>
    <button class="bp-btn" style="background:#10b981;" id="${id}-apply">✅ Apply 1 Step</button>
    <button class="bp-btn" style="background:#8b5cf6;" id="${id}-train">⟳ Train 100</button>
    <button class="bp-btn" style="background:#64748b;" id="${id}-reset">↺ Reset</button>
  </div>

  <svg id="${id}-svg" width="100%" viewBox="0 0 820 400"
       style="background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; display:block; margin-bottom:8px; cursor:default;">
  </svg>

  <div class="bp-loss">
    <span style="font-size:0.8rem; font-weight:600; color:#475569;">Loss:</span>
    <div class="bp-loss-track"><div class="bp-loss-fill" id="${id}-lossbar"></div></div>
    <span id="${id}-lossval" style="font-size:0.82rem; font-family:monospace; min-width:70px;"></span>
  </div>

  <div class="bp-info-panel" id="${id}-info">
    <div class="md"><span style="color:#94a3b8;">Click any neuron or weight label in the diagram to see its full equations here. Click again or press ✕ to dismiss.</span></div>
  </div>
  `;

	// ── Wire inputs ──
	const numInputs = root.querySelectorAll('input[data-k]');
	numInputs.forEach(inp => {
		inp.value = S[inp.dataset.k];
		inp.addEventListener('input', () => {
			S[inp.dataset.k] = parseFloat(inp.value) || 0;
			recompute();
		});
	});
	function syncInputs() {
		numInputs.forEach(inp => { inp.value = parseFloat(S[inp.dataset.k]).toFixed(2); });
	}

	// ── Node positions ──
	const nodes = {
		x1:{x:80,y:120,label:'x_1',layer:'input'},
		x2:{x:80,y:280,label:'x_2',layer:'input'},
		h1:{x:330,y:120,label:'h_1',layer:'hidden'},
		h2:{x:330,y:280,label:'h_2',layer:'hidden'},
		o1:{x:580,y:120,label:'o_1',layer:'output'},
		o2:{x:580,y:280,label:'o_2',layer:'output'},
		t1:{x:750,y:120,label:'t_1',layer:'target'},
		t2:{x:750,y:280,label:'t_2',layer:'target'},
	};

	const conns = [
		['x1','h1','w1','w_1'],['x2','h1','w2','w_2'],
		['x1','h2','w3','w_3'],['x2','h2','w4','w_4'],
		['h1','o1','w5','w_5'],['h2','o1','w6','w_6'],
		['h1','o2','w7','w_7'],['h2','o2','w8','w_8'],
	];

	const svg = document.getElementById(`${id}-svg`);
	const info = document.getElementById(`${id}-info`);
	let R = {};

	function recompute() {
		const {x1,x2,t1,t2,lr,w1,w2,w3,w4,b1,b2,w5,w6,w7,w8,b3,b4} = S;
		const zh1=w1*x1+w2*x2+b1, h1=sig(zh1);
		const zh2=w3*x1+w4*x2+b2, h2=sig(zh2);
		const zo1=w5*h1+w6*h2+b3, o1=sig(zo1);
		const zo2=w7*h1+w8*h2+b4, o2=sig(zo2);
		const E1=0.5*(t1-o1)**2, E2=0.5*(t2-o2)**2, E=E1+E2;

		const dE_do1=-(t1-o1), do1_dz1=o1*(1-o1), d_o1=dE_do1*do1_dz1;
		const dE_do2=-(t2-o2), do2_dz2=o2*(1-o2), d_o2=dE_do2*do2_dz2;
		const gw5=d_o1*h1, gw6=d_o1*h2, gb3=d_o1;
		const gw7=d_o2*h1, gw8=d_o2*h2, gb4=d_o2;
		const dE_dh1=d_o1*w5+d_o2*w7, d_h1=dE_dh1*h1*(1-h1);
		const dE_dh2=d_o1*w6+d_o2*w8, d_h2=dE_dh2*h2*(1-h2);
		const gw1=d_h1*x1, gw2=d_h1*x2, gb1=d_h1;
		const gw3=d_h2*x1, gw4=d_h2*x2, gb2=d_h2;

		R = {zh1,h1,zh2,h2,zo1,o1,zo2,o2,E1,E2,E,
			dE_do1,do1_dz1,d_o1,dE_do2,do2_dz2,d_o2,
			gw5,gw6,gb3,gw7,gw8,gb4,
			dE_dh1,d_h1,dE_dh2,d_h2,
			gw1,gw2,gb1,gw3,gw4,gb2};

		drawSVG();
		document.getElementById(`${id}-lossbar`).style.width = Math.min(E/0.6*100,100)+'%';
		document.getElementById(`${id}-lossval`).textContent = f(E);

		// Re-render locked panel if something is locked
		if (locked) {
			if (locked.type === 'node') showNodeInfo(locked.key, true);
			else if (locked.type === 'weight') showWeightInfo(locked.key, true);
		}
	}

	function drawSVG() {
		const {x1,x2,t1,t2} = S;
		let html = '';

		// Connections
		conns.forEach(([from,to,wk,wl]) => {
			const a=nodes[from], b=nodes[to];
			const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
			const val=S[wk];
			const thick=Math.max(1,Math.min(5,Math.abs(val)*3));
			const col=val>=0?'#3b82f6':'#ef4444';
			html += `<line class="bp-conn" data-wk="${wk}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${col}" stroke-width="${thick}" stroke-opacity="0.5"/>`;
			html += `<text class="bp-wlabel" data-wk="${wk}" x="${mx}" y="${my-6}" text-anchor="middle" font-size="11" fill="#334155" font-weight="600" style="cursor:pointer;">$${wl}$=${f(val,2)}</text>`;
		});

		// Error dashed lines
		html += `<line x1="${nodes.o1.x}" y1="${nodes.o1.y}" x2="${nodes.t1.x}" y2="${nodes.t1.y}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,4"/>`;
		html += `<line x1="${nodes.o2.x}" y1="${nodes.o2.y}" x2="${nodes.t2.x}" y2="${nodes.t2.y}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,4"/>`;

		// Nodes
		const vals = {x1:f(x1,2),x2:f(x2,2),h1:f(R.h1),h2:f(R.h2),o1:f(R.o1),o2:f(R.o2),t1:f(t1,2),t2:f(t2,2)};
		const colors = {input:'#64748b',hidden:'#3b82f6',output:'#10b981',target:'#f59e0b'};
		const fills  = {input:'#f1f5f9',hidden:'#eff6ff',output:'#ecfdf5',target:'#fffbeb'};
		const radii  = {input:28,hidden:34,output:34,target:24};

		for (const [nk,nd] of Object.entries(nodes)) {
			const r=radii[nd.layer], col=colors[nd.layer], fill=fills[nd.layer];
			const isLocked = locked && locked.type==='node' && locked.key===nk;
			html += `<circle class="bp-node" data-nk="${nk}" cx="${nd.x}" cy="${nd.y}" r="${r}" fill="${fill}" stroke="${isLocked?'#f59e0b':col}" stroke-width="${isLocked?3.5:2.5}" style="cursor:pointer;"/>`;
			if (isLocked) {
				html += `<circle class="bp-locked-ring" cx="${nd.x}" cy="${nd.y}" r="${r+5}"/>`;
			}
			html += `<text x="${nd.x}" y="${nd.y-8}" text-anchor="middle" font-size="12" font-weight="700" fill="${col}" style="pointer-events:none;">$${nd.label}$</text>`;
			html += `<text x="${nd.x}" y="${nd.y+10}" text-anchor="middle" font-size="11" font-family="monospace" fill="#1e293b" style="pointer-events:none;">${vals[nk]}</text>`;

			// Deltas below hidden/output
			if (nk==='h1') html += `<text x="${nd.x}" y="${nd.y+r+14}" text-anchor="middle" font-size="10" fill="#d97706" style="pointer-events:none;">$\\delta$=${f(R.d_h1)}</text>`;
			if (nk==='h2') html += `<text x="${nd.x}" y="${nd.y+r+14}" text-anchor="middle" font-size="10" fill="#d97706" style="pointer-events:none;">$\\delta$=${f(R.d_h2)}</text>`;
			if (nk==='o1') html += `<text x="${nd.x}" y="${nd.y+r+14}" text-anchor="middle" font-size="10" fill="#dc2626" style="pointer-events:none;">$\\delta$=${f(R.d_o1)}</text>`;
			if (nk==='o2') html += `<text x="${nd.x}" y="${nd.y+r+14}" text-anchor="middle" font-size="10" fill="#dc2626" style="pointer-events:none;">$\\delta$=${f(R.d_o2)}</text>`;
		}

		// Layer labels
		html += `<text x="80" y="30" text-anchor="middle" font-size="13" fill="#94a3b8" font-weight="600">Input</text>`;
		html += `<text x="330" y="30" text-anchor="middle" font-size="13" fill="#94a3b8" font-weight="600">Hidden</text>`;
		html += `<text x="580" y="30" text-anchor="middle" font-size="13" fill="#94a3b8" font-weight="600">Output</text>`;
		html += `<text x="750" y="30" text-anchor="middle" font-size="13" fill="#94a3b8" font-weight="600">Target</text>`;

		// Loss
		html += `<text x="665" y="210" text-anchor="middle" font-size="13" fill="#ef4444" font-weight="700">$E$ = ${f(R.E)}</text>`;

		svg.innerHTML = html;

		// ── Click events on nodes ──
		svg.querySelectorAll('.bp-node').forEach(el => {
			el.addEventListener('click', (e) => {
				e.stopPropagation();
				const nk = el.dataset.nk;
				if (locked && locked.type==='node' && locked.key===nk) {
					unlock();
				} else {
					locked = {type:'node', key:nk};
					showNodeInfo(nk, true);
					drawSVG();
				}
			});
		});

		// ── Click events on weight labels ──
		svg.querySelectorAll('.bp-wlabel').forEach(el => {
			el.addEventListener('click', (e) => {
				e.stopPropagation();
				const wk = el.dataset.wk;
				if (locked && locked.type==='weight' && locked.key===wk) {
					unlock();
				} else {
					locked = {type:'weight', key:wk};
					showWeightInfo(wk, true);
					drawSVG();
				}
			});
		});

		// Highlight locked connections
		if (locked) {
			if (locked.type==='node') highlightForNode(locked.key);
			else if (locked.type==='weight') highlightWeights([locked.key]);
		}

		// Render Temml
		try { render_temml(); } catch(e) {}
	}

	function unlock() {
		locked = null;
		clearHighlights();
		info.innerHTML = `<div class="md"><span style="color:#94a3b8;">Click any neuron or weight label to see its equations.</span></div>`;
		drawSVG();
		try { render_temml(); } catch(e) {}
	}

	// Click on SVG background to unlock
	svg.addEventListener('click', (e) => {
		if (e.target === svg || e.target.tagName === 'svg') unlock();
	});

	// Click outside SVG on the info panel close button
	function addCloseButton() {
		const existing = info.querySelector('.bp-close');
		if (!existing) {
			const btn = document.createElement('button');
			btn.className = 'bp-close';
			btn.textContent = '✕';
			btn.addEventListener('click', unlock);
			info.prepend(btn);
		}
	}

	function highlightWeights(keys) {
		svg.querySelectorAll('.bp-conn').forEach(el => {
			if (keys.includes(el.dataset.wk)) {
				el.classList.add('pulse');
				el.setAttribute('stroke','#f59e0b');
				el.classList.remove('dim');
			} else {
				el.classList.add('dim');
				el.classList.remove('pulse');
			}
		});
		svg.querySelectorAll('.bp-wlabel').forEach(el => {
			if (!keys.includes(el.dataset.wk)) el.classList.add('dim');
		});
	}

	function highlightForNode(nk) {
		const map = {
			h1:['w1','w2'], h2:['w3','w4'],
			o1:['w5','w6'], o2:['w7','w8'],
		};
		if (map[nk]) highlightWeights(map[nk]);
	}

	function clearHighlights() {
		svg.querySelectorAll('.bp-conn').forEach(el => {
			el.classList.remove('pulse','dim');
			const val = S[el.dataset.wk];
			el.setAttribute('stroke', val>=0?'#3b82f6':'#ef4444');
		});
		svg.querySelectorAll('.bp-wlabel').forEach(el => el.classList.remove('dim'));
	}

	function renderInfo(html) {
		info.innerHTML = `<div class="md">${html}</div>`;
		addCloseButton();
		try { render_temml(); } catch(e) {}
	}

	function showNodeInfo(nk, isLocked) {
		const {x1,x2,t1,t2,w1,w2,w3,w4,b1,b2,w5,w6,w7,w8,b3,b4} = S;
		let h = '';

		if (nk==='x1') {
			h = `<b>Input $$x_1 = ${f(x1,2)}$$</b><br>Raw input value — no computation, just fed into the network.`;
		} else if (nk==='x2') {
			h = `<b>Input $$x_2 = ${f(x2,2)}$$</b><br>Raw input value — no computation, just fed into the network.`;
		} else if (nk==='t1') {
			h = `<b>Target $$t_1 = ${f(t1,2)}$$</b><br>
$$E_1 = \\tfrac{1}{2}(t_1 - o_1)^2 = \\tfrac{1}{2}(${f(t1,2)} - ${f(R.o1)})^2 = ${f(R.E1)}$$`;
		} else if (nk==='t2') {
			h = `<b>Target $$t_2 = ${f(t2,2)}$$</b><br>
$$E_2 = \\tfrac{1}{2}(t_2 - o_2)^2 = \\tfrac{1}{2}(${f(t2,2)} - ${f(R.o2)})^2 = ${f(R.E2)}$$`;
		} else if (nk==='h1') {
			h = `<b>Hidden neuron $h_1$</b>

<b>Forward:</b>
$$z_{h_1} = w_1 x_1 + w_2 x_2 + b_1 = ${f(w1)}\\cdot${f(x1)} + ${f(w2)}\\cdot${f(x2)} + ${f(b1)} = ${f(R.zh1)}$$
$$h_1 = \\sigma(${f(R.zh1)}) = \\frac{1}{1+e^{-${f(R.zh1)}}} = ${f(R.h1)}$$

<b>Backward</b> — blame arrives from <em>both</em> outputs via $w_5$ and $w_7$:
$$\\frac{\\partial E}{\\partial h_1} = \\delta_{o_1}\\cdot w_5 + \\delta_{o_2}\\cdot w_7 = ${f(R.d_o1)}\\cdot${f(w5)} + ${f(R.d_o2)}\\cdot${f(w7)} = ${f(R.dE_dh1)}$$
$$\\text{sigmoid slope} = h_1(1-h_1) = ${f(R.h1)}\\cdot${f(1-R.h1)} = ${f(R.h1*(1-R.h1))}$$
$$\\delta_{h_1} = ${f(R.dE_dh1)} \\times ${f(R.h1*(1-R.h1))} = ${f(R.d_h1)}$$

<b>Weight gradients:</b>
$$\\frac{\\partial E}{\\partial w_1} = \\delta_{h_1} \\cdot x_1 = ${f(R.d_h1)} \\times ${f(x1)} = ${f(R.gw1)}$$
$$\\frac{\\partial E}{\\partial w_2} = \\delta_{h_1} \\cdot x_2 = ${f(R.d_h1)} \\times ${f(x2)} = ${f(R.gw2)}$$
$$\\frac{\\partial E}{\\partial b_1} = \\delta_{h_1} = ${f(R.gb1)}$$`;
		} else if (nk==='h2') {
			h = `<b>Hidden neuron $h_2$</b>

<b>Forward:</b>
$$z_{h_2} = w_3 x_1 + w_4 x_2 + b_2 = ${f(w3)}\\cdot${f(x1)} + ${f(w4)}\\cdot${f(x2)} + ${f(b2)} = ${f(R.zh2)}$$
$$h_2 = \\sigma(${f(R.zh2)}) = ${f(R.h2)}$$

<b>Backward</b> — blame via $w_6$ and $w_8$:
$$\\frac{\\partial E}{\\partial h_2} = \\delta_{o_1}\\cdot w_6 + \\delta_{o_2}\\cdot w_8 = ${f(R.d_o1)}\\cdot${f(w6)} + ${f(R.d_o2)}\\cdot${f(w8)} = ${f(R.dE_dh2)}$$
$$\\text{sigmoid slope} = h_2(1-h_2) = ${f(R.h2*(1-R.h2))}$$
$$\\delta_{h_2} = ${f(R.dE_dh2)} \\times ${f(R.h2*(1-R.h2))} = ${f(R.d_h2)}$$

<b>Weight gradients:</b>
$$\\frac{\\partial E}{\\partial w_3} = \\delta_{h_2} \\cdot x_1 = ${f(R.d_h2)} \\times ${f(x1)} = ${f(R.gw3)}$$
$$\\frac{\\partial E}{\\partial w_4} = \\delta_{h_2} \\cdot x_2 = ${f(R.d_h2)} \\times ${f(x2)} = ${f(R.gw4)}$$
$$\\frac{\\partial E}{\\partial b_2} = \\delta_{h_2} = ${f(R.gb2)}$$`;
		} else if (nk==='o1') {
			const dir = R.d_o1 > 0 ? 'too HIGH — needs to decrease' : R.d_o1 < 0 ? 'too LOW — needs to increase' : 'perfect!';
			h = `<b>Output neuron $o_1$</b> &nbsp;(target $$t_1=${f(t1,2)}$$)

<b>Forward:</b>
$$z_{o_1} = w_5 h_1 + w_6 h_2 + b_3 = ${f(w5)}\\cdot${f(R.h1)} + ${f(w6)}\\cdot${f(R.h2)} + ${f(b3)} = ${f(R.zo1)}$$
$$o_1 = \\sigma(${f(R.zo1)}) = ${f(R.o1)}$$

<b>Backward — the 3 chain-rule terms:</b>
$$\\underbrace{\\frac{\\partial E}{\\partial o_1}}_{\\text{how wrong?}} = -(t_1 - o_1) = -(${f(t1,2)} - ${f(R.o1)}) = ${f(R.dE_do1)}$$
$$\\underbrace{\\frac{\\partial o_1}{\\partial z_{o_1}}}_{\\text{sigmoid slope}} = o_1(1-o_1) = ${f(R.o1)}\\cdot${f(1-R.o1)} = ${f(R.do1_dz1)}$$
$$\delta_{o_1} = ${f(R.dE_do1)} \\times ${f(R.do1_dz1)} = ${f(R.d_o1)}$$

<em>${dir}</em>

<b>Weight gradients</b> — each is $$\\delta_{o_1} \\times$$ "what flowed through that weight":
$$\\frac{\\partial E}{\\partial w_5} = \\delta_{o_1} \\cdot h_1 = ${f(R.d_o1)} \\times ${f(R.h1)} = ${f(R.gw5)}$$
$$\\frac{\\partial E}{\\partial w_6} = \\delta_{o_1} \\cdot h_2 = ${f(R.d_o1)} \\times ${f(R.h2)} = ${f(R.gw6)}$$
$$\\frac{\\partial E}{\\partial b_3} = \\delta_{o_1} \\cdot 1 = ${f(R.gb3)}$$`;
		} else if (nk==='o2') {
			const dir = R.d_o2 > 0 ? 'too HIGH — needs to decrease' : R.d_o2 < 0 ? 'too LOW — needs to increase' : 'perfect!';
			h = `<b>Output neuron $o_2$</b> &nbsp;(target $t_2=${f(t2,2)}$)

<b>Forward:</b>
$$z_{o_2} = w_7 h_1 + w_8 h_2 + b_4 = ${f(w7)}\\cdot${f(R.h1)} + ${f(w8)}\\cdot${f(R.h2)} + ${f(b4)} = ${f(R.zo2)}$$
$$o_2 = \\sigma(${f(R.zo2)}) = ${f(R.o2)}$$

<b>Backward — the 3 chain-rule terms:</b>
$$\\underbrace{\\frac{\\partial E}{\\partial o_2}}_{\\text{how wrong?}} = -(t_2 - o_2) = -(${f(t2,2)} - ${f(R.o2)}) = ${f(R.dE_do2)}$$
$$\\underbrace{\\frac{\\partial o_2}{\\partial z_{o_2}}}_{\\text{sigmoid slope}} = o_2(1-o_2) = ${f(R.o2)}\\cdot${f(1-R.o2)} = ${f(R.do2_dz2)}$$
$$\\delta_{o_2} = ${f(R.dE_do2)} \\times ${f(R.do2_dz2)} = ${f(R.d_o2)}$$

<em>${dir}</em>

<b>Weight gradients:</b>
$$\\frac{\\partial E}{\\partial w_7} = \\delta_{o_2} \\cdot h_1 = ${f(R.d_o2)} \\times ${f(R.h1)} = ${f(R.gw7)}$$
$$\\frac{\\partial E}{\\partial w_8} = \\delta_{o_2} \\cdot h_2 = ${f(R.d_o2)} \\times ${f(R.h2)} = ${f(R.gw8)}$$
$$\\frac{\\partial E}{\\partial b_4} = \\delta_{o_2} \\cdot 1 = ${f(R.gb4)}$$`;
		}
		renderInfo(h);
	}

	function showWeightInfo(wk, isLocked) {
		highlightWeights([wk]);
		const {x1,x2,w1,w2,w3,w4,b1,b2,w5,w6,w7,w8,b3,b4,lr} = S;
		const wVal = S[wk];
		const labels = {w1:'w_1',w2:'w_2',w3:'w_3',w4:'w_4',w5:'w_5',w6:'w_6',w7:'w_7',w8:'w_8'};
		const gradMap = {
			w1:{g:R.gw1, delta:'\\delta_{h_1}', dv:f(R.d_h1), inp:'x_1', iv:f(x1)},
			w2:{g:R.gw2, delta:'\\delta_{h_1}', dv:f(R.d_h1), inp:'x_2', iv:f(x2)},
			w3:{g:R.gw3, delta:'\\delta_{h_2}', dv:f(R.d_h2), inp:'x_1', iv:f(x1)},
			w4:{g:R.gw4, delta:'\\delta_{h_2}', dv:f(R.d_h2), inp:'x_2', iv:f(x2)},
			w5:{g:R.gw5, delta:'\\delta_{o_1}', dv:f(R.d_o1), inp:'h_1', iv:f(R.h1)},
			w6:{g:R.gw6, delta:'\\delta_{o_1}', dv:f(R.d_o1), inp:'h_2', iv:f(R.h2)},
			w7:{g:R.gw7, delta:'\\delta_{o_2}', dv:f(R.d_o2), inp:'h_1', iv:f(R.h1)},
			w8:{g:R.gw8, delta:'\\delta_{o_2}', dv:f(R.d_o2), inp:'h_2', iv:f(R.h2)},
		};
		const m = gradMap[wk];
		if (!m) return;
		const nw = wVal - lr*m.g;
		const dir = m.g > 0 ? '\\searrow \\text{ decreases}' : m.g < 0 ? '\\nearrow \\text{ increases}' : '\\text{no change}';

		renderInfo(`<b>Weight $$${labels[wk]} = ${f(wVal)}$$</b>

<b>Gradient</b> — the chain rule product:
$$\\frac{\\partial E}{\\partial ${labels[wk]}} = ${m.delta} \\cdot ${m.inp} = ${m.dv} \\times ${m.iv} = ${f(m.g)}$$

<b>Update rule</b> — gradient descent with $$\\eta = ${f(lr,2)}$$:
$$${labels[wk]}^{\\,\\text{new}} = ${labels[wk]} - \\eta \\cdot \\frac{\\partial E}{\\partial ${labels[wk]}} = ${f(wVal)} - ${f(lr)} \\times ${f(m.g)} = ${f(nw)}$$

$$${dir}$$`);
	}

	// ── Buttons ──
	const defaults = JSON.parse(JSON.stringify(S));

	function applyOneStep() {
		const {lr} = S;
		S.w1 -= lr*R.gw1; S.w2 -= lr*R.gw2; S.w3 -= lr*R.gw3; S.w4 -= lr*R.gw4;
		S.b1 -= lr*R.gb1; S.b2 -= lr*R.gb2;
		S.w5 -= lr*R.gw5; S.w6 -= lr*R.gw6; S.w7 -= lr*R.gw7; S.w8 -= lr*R.gw8;
		S.b3 -= lr*R.gb3; S.b4 -= lr*R.gb4;
		syncInputs();
		recompute();
	}

	document.getElementById(`${id}-apply`).addEventListener('click', applyOneStep);

	document.getElementById(`${id}-train`).addEventListener('click', () => {
		for (let i = 0; i < 100; i++) {
			recompute();
			const {lr} = S;
			S.w1 -= lr*R.gw1; S.w2 -= lr*R.gw2; S.w3 -= lr*R.gw3; S.w4 -= lr*R.gw4;
			S.b1 -= lr*R.gb1; S.b2 -= lr*R.gb2;
			S.w5 -= lr*R.gw5; S.w6 -= lr*R.gw6; S.w7 -= lr*R.gw7; S.w8 -= lr*R.gw8;
			S.b3 -= lr*R.gb3; S.b4 -= lr*R.gb4;
		}
		syncInputs();
		recompute();
	});

	document.getElementById(`${id}-reset`).addEventListener('click', () => {
		Object.assign(S, JSON.parse(JSON.stringify(defaults)));
		locked = null;
		syncInputs();
		recompute();
		info.innerHTML = `<div class="md"><span style="color:#94a3b8;">Reset to defaults. Click any neuron or weight.</span></div>`;
		try { render_temml(); } catch(e) {}
	});

	// ── Initial render ──
	recompute();
	try { render_temml(); } catch(e) {}
}

renderBackpropVisual('bp-visual');

