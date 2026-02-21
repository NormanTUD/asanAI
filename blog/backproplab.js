function sigmoid_plot() {
    // Reason 10: guard against missing dependencies or DOM
    if (typeof Plotly === 'undefined') {
        console.error('sigmoid_plot: Plotly not loaded');
        return;
    }
    var container = document.getElementById('sigmoid-plot');
    if (!container) {
        console.error('sigmoid_plot: #sigmoid-plot not found');
        return;
    }

    var sigmoid = function(z) { return 1 / (1 + Math.exp(-z)); };
    var sigmoid_deriv = function(z) { var s = sigmoid(z); return s * (1 - s); };

    var N = 500;
    var zMin = -10, zMax = 10;
    var z_vals = [], sig_vals = [], deriv_vals = [];
    for (var i = 0; i <= N; i++) {
        var z = zMin + (zMax - zMin) * i / N;
        z_vals.push(z);
        sig_vals.push(sigmoid(z));
        deriv_vals.push(sigmoid_deriv(z));
    }

    var yMin = -0.15, yMax = 1.15;

    var traces = [
        {
            x: z_vals, y: sig_vals,
            type: 'scatter', mode: 'lines',
            name: 'Sigmoid',
            line: { color: '#2E86AB', width: 3 },
            hoverinfo: 'none'
        },
        {
            x: z_vals, y: deriv_vals,
            type: 'scatter', mode: 'lines',
            name: 'Derivative',
            line: { color: '#e74c3c', width: 2, dash: 'dot' },
            hoverinfo: 'none'
        }
    ];

    var margins = { t: 50, b: 70, l: 55, r: 20 };

    var layout = {
        title: { text: 'Sigmoid and derivative of Sigmoid', font: { size: 17 } },
        xaxis: {
            title: 'z', range: [zMin, zMax],
            gridcolor: '#E5E5E5', zeroline: true, zerolinecolor: '#aaa'
        },
        yaxis: {
            title: 'Value', range: [yMin, yMax],
            gridcolor: '#E5E5E5', zeroline: true, zerolinecolor: '#aaa'
        },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        hovermode: false,
        showlegend: true,
        legend: {
            x: 0.01, y: 0.99,
            bgcolor: 'rgba(255,255,255,0.85)',
            bordercolor: '#ccc', borderwidth: 1
        },
        margin: margins
    };

    var config = {
        displayModeBar: false,
        responsive: true,
        staticPlot: true
    };

    Plotly.newPlot(container, traces, layout, config).then(function() {

        container.style.position = 'relative';
        container.style.pointerEvents = 'all';

        var canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1000';
        container.appendChild(canvas);

        var ctx = canvas.getContext('2d');

        function resizeCanvas() {
            var dpr = window.devicePixelRatio || 1;
            var rect = container.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        var plotArea = null;

        function updatePlotArea() {
            var fl = container._fullLayout;
            if (!fl || !fl.xaxis || !fl.yaxis) return false;
            var xa = fl.xaxis;
            var ya = fl.yaxis;
            plotArea = {
                left: xa._offset,
                top: ya._offset,
                width: xa._length,
                height: ya._length,
                xMin: xa.range[0],
                xMax: xa.range[1],
                yMin: ya.range[0],
                yMax: ya.range[1]
            };
            return true;
        }
        updatePlotArea();
        window.addEventListener('resize', function() {
            setTimeout(function() { updatePlotArea(); resizeCanvas(); }, 100);
        });

        function dataToPixel(dataX, dataY) {
            if (!plotArea) return null;
            var px = plotArea.left + (dataX - plotArea.xMin) / (plotArea.xMax - plotArea.xMin) * plotArea.width;
            var py = plotArea.top + (1 - (dataY - plotArea.yMin) / (plotArea.yMax - plotArea.yMin)) * plotArea.height;
            return { x: px, y: py };
        }

        function pixelToData(px, py) {
            if (!plotArea) return null;
            var dataX = plotArea.xMin + (px - plotArea.left) / plotArea.width * (plotArea.xMax - plotArea.xMin);
            var dataY = plotArea.yMin + (1 - (py - plotArea.top) / plotArea.height) * (plotArea.yMax - plotArea.yMin);
            return { z: dataX, v: dataY };
        }

        function clearCanvas() {
            var rect = container.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);
        }

        function drawTangent(z) {
            clearCanvas();

            var s = sigmoid(z);
            var slope = sigmoid_deriv(z);

            var halfLen = 2.5;
            var tZ0 = z - halfLen, tZ1 = z + halfLen;
            var tY0 = s + slope * (tZ0 - z);
            var tY1 = s + slope * (tZ1 - z);

            var p0 = dataToPixel(tZ0, tY0);
            var p1 = dataToPixel(tZ1, tY1);
            var pc = dataToPixel(z, s);
            if (!p0 || !p1 || !pc) return;

            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(pc.x, pc.y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = '#f59e0b';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = '13px monospace';
            ctx.fillStyle = '#334155';
            var label = 'z=' + z.toFixed(2) +
                        '  σ(z)=' + s.toFixed(4) +
                        '  slope=' + slope.toFixed(4);
            var labelY = pc.y - 18;
            if (labelY < plotArea.top + 20) labelY = pc.y + 24;
            var labelX = pc.x + 10;

            var textWidth = ctx.measureText(label).width;
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.fillRect(labelX - 4, labelY - 13, textWidth + 8, 18);
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.strokeRect(labelX - 4, labelY - 13, textWidth + 8, 18);

            ctx.fillStyle = '#334155';
            ctx.fillText(label, labelX, labelY);
        }

        var rafId = null;
        var lastMouseX = null, lastMouseY = null;

        function onFrame() {
            rafId = null;
            if (lastMouseX === null) return;
            if (!plotArea) { updatePlotArea(); }
            if (!plotArea) return;

            var containerRect = container.getBoundingClientRect();
            var px = lastMouseX - containerRect.left;
            var py = lastMouseY - containerRect.top;

            if (px < plotArea.left || px > plotArea.left + plotArea.width ||
                py < plotArea.top || py > plotArea.top + plotArea.height) {
                clearCanvas();
                return;
            }

            var data = pixelToData(px, py);
            if (!data || data.z < zMin || data.z > zMax) {
                clearCanvas();
                return;
            }

            drawTangent(data.z);
        }

        container.addEventListener('mousemove', function(evt) {
            lastMouseX = evt.clientX;
            lastMouseY = evt.clientY;
            if (!rafId) {
                rafId = requestAnimationFrame(onFrame);
            }
        });

        container.addEventListener('mouseleave', function() {
            lastMouseX = null;
            lastMouseY = null;
            clearCanvas();
        });
    });
}

function renderBackpropVisual(id) {
	const root = document.getElementById(id);
	if (!root) return;
	const sig = z => 1 / (1 + Math.exp(-z));
	const f = (v, d=4) => Number(v).toFixed(d);

	// Color constants for LaTeX
	const C = {
		inp:   '#6366f1', // indigo - inputs
		w_ih:  '#3b82f6', // blue - weights input→hidden
		b_h:   '#8b5cf6', // violet - biases hidden
		hid:   '#0ea5e9', // sky - hidden neurons
		w_ho:  '#10b981', // emerald - weights hidden→output
		b_o:   '#14b8a6', // teal - biases output
		out:   '#f97316', // orange - output neurons
		tgt:   '#eab308', // yellow - targets
		loss:  '#ef4444', // red - loss/error
		delta: '#dc2626', // red-600 - deltas
		grad:  '#be123c', // rose-700 - gradients
		lr:    '#a855f7', // purple - learning rate
		sig:   '#64748b', // slate - sigmoid notation
	};

	// Helper: wrap value in \color
	const cv = (color, text) => `\\color{${color}}{${text}}`;

	const S = {
		x1:0.05, x2:0.10, t1:0.01, t2:0.99, lr:0.5,
		w1:0.15, w2:0.20, w3:0.25, w4:0.30, b1:0.35, b2:0.35,
		w5:0.40, w6:0.45, w7:0.50, w8:0.55, b3:0.60, b4:0.60
	};

	let locked = null;

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
    #${id} .bp-info-panel .bp-section {
      border-left: 3px solid #e2e8f0; padding-left: 12px; margin: 10px 0;
    }
    #${id} .bp-info-panel .bp-section-hid { border-left-color: #0ea5e9; }
    #${id} .bp-info-panel .bp-section-out { border-left-color: #f97316; }
    #${id} .bp-info-panel .bp-section-loss { border-left-color: #ef4444; }
    #${id} .bp-info-panel .bp-section-back { border-left-color: #dc2626; }
    #${id} .bp-info-panel .bp-section-grad { border-left-color: #be123c; }
    #${id} .bp-info-panel .bp-section-update { border-left-color: #a855f7; }
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
<fieldset style="border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px; margin-bottom:6px;">
  <legend style="font-size:0.78rem; font-weight:700; color:#64748b;">Inputs</legend>
  <div style="display:flex; gap:10px; flex-wrap:wrap;">
    <div class="bp-group"><label>$$x_1$$</label><input style='width: 100px;'type="number" data-k="x1" step="0.01"></div>
    <div class="bp-group"><label>$$x_2$$</label><input style='width: 100px;'type="number" data-k="x2" step="0.01"></div>
  </div>
</fieldset>

<fieldset style="border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px; margin-bottom:6px;">
  <legend style="font-size:0.78rem; font-weight:700; color:#f59e0b;">Targets (Ground Truth)</legend>
  <div style="display:flex; gap:10px; flex-wrap:wrap;">
    <div class="bp-group"><label>$$t_1$$</label><input style='width: 100px;'type="number" data-k="t1" step="0.01"></div>
    <div class="bp-group"><label>$$t_2$$</label><input style='width: 100px;'type="number" data-k="t2" step="0.01"></div>
  </div>
</fieldset>

<fieldset style="border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px; margin-bottom:6px;">
  <legend style="font-size:0.78rem; font-weight:700; color:#8b5cf6;">Hyperparameters</legend>
  <div style="display:flex; gap:10px; flex-wrap:wrap;">
    <div class="bp-group"><label>$$\\eta \\text{ (learning rate)}$$</label><input style='width: 100px;'type="number" data-k="lr" step="0.05" min="0.01" max="5"></div>
  </div>
</fieldset>

<fieldset style="border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px; margin-bottom:6px;">
  <legend style="font-size:0.78rem; font-weight:700; color:#3b82f6;">Weights &amp; Biases — Input → Hidden</legend>
  <div style="display:flex; gap:10px; flex-wrap:wrap;">
    <div class="bp-group"><label>$$w_1$$</label><input style='width: 100px;'type="number" data-k="w1" step="0.01"></div>
    <div class="bp-group"><label>$$w_2$$</label><input style='width: 100px;'type="number" data-k="w2" step="0.01"></div>
    <div class="bp-group"><label>$$w_3$$</label><input style='width: 100px;'type="number" data-k="w3" step="0.01"></div>
    <div class="bp-group"><label>$$w_4$$</label><input style='width: 100px;'type="number" data-k="w4" step="0.01"></div>
    <div class="bp-group"><label>$$b_1$$</label><input style='width: 100px;'type="number" data-k="b1" step="0.01"></div>
    <div class="bp-group"><label>$$b_2$$</label><input style='width: 100px;'type="number" data-k="b2" step="0.01"></div>
  </div>
</fieldset>

<fieldset style="border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px; margin-bottom:6px;">
  <legend style="font-size:0.78rem; font-weight:700; color:#10b981;">Weights &amp; Biases — Hidden → Output</legend>
  <div style="display:flex; gap:10px; flex-wrap:wrap;">
    <div class="bp-group"><label>$$w_5$$</label><input style='width: 100px;'type="number" data-k="w5" step="0.01"></div>
    <div class="bp-group"><label>$$w_6$$</label><input style='width: 100px;'type="number" data-k="w6" step="0.01"></div>
    <div class="bp-group"><label>$$w_7$$</label><input style='width: 100px;'type="number" data-k="w7" step="0.01"></div>
    <div class="bp-group"><label>$$w_8$$</label><input style='width: 100px;'type="number" data-k="w8" step="0.01"></div>
    <div class="bp-group"><label>$$b_3$$</label><input style='width: 100px;'type="number" data-k="b3" step="0.01"></div>
    <div class="bp-group"><label>$$b_4$$</label><input style='width: 100px;'type="number" data-k="b4" step="0.01"></div>
  </div>
</fieldset>

<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;">
  <button class="bp-btn" style="background:#10b981;" id="${id}-apply">✅ Apply 1 Step</button>
  <button class="bp-btn" style="background:#8b5cf6;" id="${id}-train">⟳ Train 100</button>
  <button class="bp-btn" style="background:#64748b;" id="${id}-reset">↺ Reset</button>
</div>

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
		numInputs.forEach(inp => { inp.value = parseFloat(S[inp.dataset.k]).toFixed(4); });
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

		if (locked) {
			if (locked.type === 'node') showNodeInfo(locked.key, true);
			else if (locked.type === 'weight') showWeightInfo(locked.key, true);
		}
	}

	function drawSVG() {
		const {x1,x2,t1,t2} = S;
		let html = '';

		conns.forEach(([from,to,wk,wl]) => {
			const a=nodes[from], b=nodes[to];
			let mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
			if (wk === 'w2' || wk === 'w6') my -= 14;
			if (wk === 'w3' || wk === 'w7') my += 32;
			const val=S[wk];
			const thick=Math.max(1,Math.min(5,Math.abs(val)*3));
			const col=val>=0?'#3b82f6':'#ef4444';
			html += `<line class="bp-conn" data-wk="${wk}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${col}" stroke-width="${thick}" stroke-opacity="0.5"/>`;
			const [base, sub] = wl.split('_');
			html += `<text class="bp-wlabel" data-wk="${wk}" x="${mx}" y="${my-6}" text-anchor="middle" font-size="11" fill="#334155" font-weight="600" style="cursor:pointer;">${base}<tspan font-size="8" dy="3">${sub}</tspan><tspan dy="-3">=${f(val,4)}</tspan></text>`;
		});

		html += `<line x1="${nodes.o1.x}" y1="${nodes.o1.y}" x2="${nodes.t1.x}" y2="${nodes.t1.y}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,4"/>`;
		html += `<line x1="${nodes.o2.x}" y1="${nodes.o2.y}" x2="${nodes.t2.x}" y2="${nodes.t2.y}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,4"/>`;

		const vals = {x1:f(x1,4),x2:f(x2,4),h1:f(R.h1),h2:f(R.h2),o1:f(R.o1),o2:f(R.o2),t1:f(t1,4),t2:f(t2,4)};
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

			if (nk==='h1') {
				html += `<text x="${nd.x}" y="${nd.y+r+14}" text-anchor="middle" font-size="15" fill="#d97706" style="pointer-events:none;">δ<tspan baseline-shift="sub" font-size="7">h<tspan baseline-shift="sub" font-size="5">1</tspan></tspan> = ${f(R.d_h1)}</text>`;
			}
			if (nk==='h2') {
				html += `<text x="${nd.x}" y="${nd.y+r+14}" text-anchor="middle" font-size="15" fill="#d97706" style="pointer-events:none;">δ<tspan baseline-shift="sub" font-size="7">h<tspan baseline-shift="sub" font-size="5">2</tspan></tspan> = ${f(R.d_h2)}</text>`;
			}
			if (nk==='o1') {
				html += `<text x="${nd.x}" y="${nd.y+r+14}" text-anchor="middle" font-size="15" fill="#dc2626" style="pointer-events:none;">δ<tspan baseline-shift="sub" font-size="7">o<tspan baseline-shift="sub" font-size="5">1</tspan></tspan> = ${f(R.d_o1)}</text>`;
			}
			if (nk==='o2') {
				html += `<text x="${nd.x}" y="${nd.y+r+14}" text-anchor="middle" font-size="15" fill="#dc2626" style="pointer-events:none;">δ<tspan baseline-shift="sub" font-size="7">o<tspan baseline-shift="sub" font-size="5">2</tspan></tspan> = ${f(R.d_o2)}</text>`;
			}
		}

		html += `<text x="80" y="30" text-anchor="middle" font-size="13" fill="#94a3b8" font-weight="600">Input</text>`;
		html += `<text x="330" y="30" text-anchor="middle" font-size="13" fill="#94a3b8" font-weight="600">Hidden</text>`;
		html += `<text x="580" y="30" text-anchor="middle" font-size="13" fill="#94a3b8" font-weight="600">Output</text>`;
		html += `<text x="750" y="30" text-anchor="middle" font-size="13" fill="#94a3b8" font-weight="600">Target</text>`;

		html += `<text x="665" y="210" text-anchor="middle" font-size="13" fill="#ef4444" font-weight="700">Loss = ${f(R.E)}</text>`;

		svg.innerHTML = html;

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

		if (locked) {
			if (locked.type==='node') highlightForNode(locked.key);
			else if (locked.type==='weight') highlightWeights([locked.key]);
		}

		try { render_temml(); } catch(e) {}
	}

	function unlock() {
		locked = null;
		clearHighlights();
		info.innerHTML = `<div class="md"><span style="color:#94a3b8;">Click any neuron or weight label to see its equations.</span></div>`;
		drawSVG();
		try { render_temml(); } catch(e) {}
	}

	svg.addEventListener('click', (e) => {
		if (e.target === svg || e.target.tagName === 'svg') unlock();
	});

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
			h1:['w1','w2','w5','w7'], h2:['w3','w4','w6','w8'],
			o1:['w1','w2','w3','w4','w5','w6'], o2:['w1','w2','w3','w4','w7','w8'],
			t1:['w1','w2','w3','w4','w5','w6'], t2:['w1','w2','w3','w4','w7','w8'],
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
		const {x1,x2,t1,t2,w1,w2,w3,w4,b1,b2,w5,w6,w7,w8,b3,b4,lr} = S;
		let h = '';

		// ════════════════════════════════════════════════════════════
		// INPUT NEURONS
		// ════════════════════════════════════════════════════════════
		if (nk==='x1') {
			h = `<h3>$${cv(C.inp,'x_1')}$ — Input Neuron</h3>
<div class="bp-section">
$$${cv(C.inp,'x_1')} = ${f(x1,4)}$$
This is a raw input value. No computation is performed — it is fed directly into the hidden layer via weights $${cv(C.w_ih,'w_1')}$ (to $h_1$) and $${cv(C.w_ih,'w_3')}$ (to $h_2$).
</div>`;
		} else if (nk==='x2') {
			h = `<h3>$${cv(C.inp,'x_2')}$ — Input Neuron</h3>
<div class="bp-section">
$$${cv(C.inp,'x_2')} = ${f(x2,4)}$$
This is a raw input value. No computation is performed — it is fed directly into the hidden layer via weights $${cv(C.w_ih,'w_2')}$ (to $h_1$) and $${cv(C.w_ih,'w_4')}$ (to $h_2$).
</div>`;
		}

		// ════════════════════════════════════════════════════════════
		// TARGET NEURONS
		// ════════════════════════════════════════════════════════════
		else if (nk==='t1') {
			h = `<h3>$${cv(C.tgt,'t_1')}$ — Target (Ground Truth)</h3>

<div class="bp-section bp-section-out"><b>⬆ Prerequisite: How was $${cv(C.out,'o_1')}$ computed?</b>

<b>Step 1 — Hidden layer forward pass (needed to get $h_1, h_2$):</b>
$$${cv(C.hid,'z_{h_1}')} = \\underbrace{${cv(C.w_ih,f(w1))}}_{${cv(C.w_ih,'w_1')}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} + \\underbrace{${cv(C.w_ih,f(w2))}}_{${cv(C.w_ih,'w_2')}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} + \\underbrace{${cv(C.b_h,f(b1))}}_{${cv(C.b_h,'b_1')}} = ${cv(C.hid,f(R.zh1))}$$
$$${cv(C.hid,'h_1')} = \\sigma\\!\\left(${cv(C.hid,f(R.zh1))}\\right) = ${cv(C.hid,f(R.h1))}$$
$$${cv(C.hid,'z_{h_2}')} = \\underbrace{${cv(C.w_ih,f(w3))}}_{${cv(C.w_ih,'w_3')}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} + \\underbrace{${cv(C.w_ih,f(w4))}}_{${cv(C.w_ih,'w_4')}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} + \\underbrace{${cv(C.b_h,f(b2))}}_{${cv(C.b_h,'b_2')}} = ${cv(C.hid,f(R.zh2))}$$
$$${cv(C.hid,'h_2')} = \\sigma\\!\\left(${cv(C.hid,f(R.zh2))}\\right) = ${cv(C.hid,f(R.h2))}$$

<b>Step 2 — Output neuron $o_1$ forward pass:</b>
$$${cv(C.out,'z_{o_1}')} = \\underbrace{${cv(C.w_ho,f(w5))}}_{${cv(C.w_ho,'w_5')}} \\cdot \\underbrace{${cv(C.hid,f(R.h1))}}_{${cv(C.hid,'h_1')}} + \\underbrace{${cv(C.w_ho,f(w6))}}_{${cv(C.w_ho,'w_6')}} \\cdot \\underbrace{${cv(C.hid,f(R.h2))}}_{${cv(C.hid,'h_2')}} + \\underbrace{${cv(C.b_o,f(b3))}}_{${cv(C.b_o,'b_3')}} = ${cv(C.out,f(R.zo1))}$$
$$${cv(C.out,'o_1')} = \\sigma\\!\\left(${cv(C.out,f(R.zo1))}\\right) = ${cv(C.out,f(R.o1))}$$
</div>

<div class="bp-section bp-section-loss"><b>⬇ Loss computation for $t_1$:</b>
$$${cv(C.loss,'E_1')} = \\tfrac{1}{2}\\!\\left(\\underbrace{${cv(C.tgt,f(t1,4))}}_{${cv(C.tgt,'t_1')}} - \\underbrace{${cv(C.out,f(R.o1))}}_{${cv(C.out,'o_1')}}\\right)^{\\!2} = ${cv(C.loss,f(R.E1))}$$
$$${cv(C.loss,'E_{\\text{total}}')} = ${cv(C.loss,'E_1')} + ${cv(C.loss,'E_2')} = ${cv(C.loss,f(R.E1))} + ${cv(C.loss,f(R.E2))} = ${cv(C.loss,f(R.E))}$$
</div>`;
		} else if (nk==='t2') {
			h = `<h3>$${cv(C.tgt,'t_2')}$ — Target (Ground Truth)</h3>

<div class="bp-section bp-section-out"><b>⬆ Prerequisite: How was $${cv(C.out,'o_2')}$ computed?</b>

<b>Step 1 — Hidden layer forward pass:</b>
$$${cv(C.hid,'z_{h_1}')} = \\underbrace{${cv(C.w_ih,f(w1))}}_{${cv(C.w_ih,'w_1')}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} + \\underbrace{${cv(C.w_ih,f(w2))}}_{${cv(C.w_ih,'w_2')}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} + \\underbrace{${cv(C.b_h,f(b1))}}_{${cv(C.b_h,'b_1')}} = ${cv(C.hid,f(R.zh1))}$$
$$${cv(C.hid,'h_1')} = \\sigma\\!\\left(${cv(C.hid,f(R.zh1))}\\right) = ${cv(C.hid,f(R.h1))}$$
$$${cv(C.hid,'z_{h_2}')} = \\underbrace{${cv(C.w_ih,f(w3))}}_{${cv(C.w_ih,'w_3')}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} + \\underbrace{${cv(C.w_ih,f(w4))}}_{${cv(C.w_ih,'w_4')}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} + \\underbrace{${cv(C.b_h,f(b2))}}_{${cv(C.b_h,'b_2')}} = ${cv(C.hid,f(R.zh2))}$$
$$${cv(C.hid,'h_2')} = \\sigma\\!\\left(${cv(C.hid,f(R.zh2))}\\right) = ${cv(C.hid,f(R.h2))}$$

<b>Step 2 — Output neuron $o_2$ forward pass:</b>
$$${cv(C.out,'z_{o_2}')} = \\underbrace{${cv(C.w_ho,f(w7))}}_{${cv(C.w_ho,'w_7')}} \\cdot \\underbrace{${cv(C.hid,f(R.h1))}}_{${cv(C.hid,'h_1')}} + \\underbrace{${cv(C.w_ho,f(w8))}}_{${cv(C.w_ho,'w_8')}} \\cdot \\underbrace{${cv(C.hid,f(R.h2))}}_{${cv(C.hid,'h_2')}} + \\underbrace{${cv(C.b_o,f(b4))}}_{${cv(C.b_o,'b_4')}} = ${cv(C.out,f(R.zo2))}$$
$$${cv(C.out,'o_2')} = \\sigma\\!\\left(${cv(C.out,f(R.zo2))}\\right) = ${cv(C.out,f(R.o2))}$$
</div>

<div class="bp-section bp-section-loss"><b>⬇ Loss computation for $t_2$:</b>
$$${cv(C.loss,'E_2')} = \\tfrac{1}{2}\\!\\left(\\underbrace{${cv(C.tgt,f(t2,4))}}_{${cv(C.tgt,'t_2')}} - \\underbrace{${cv(C.out,f(R.o2))}}_{${cv(C.out,'o_2')}}\\right)^{\\!2} = ${cv(C.loss,f(R.E2))}$$
$$${cv(C.loss,'E_{\\text{total}}')} = ${cv(C.loss,'E_1')} + ${cv(C.loss,'E_2')} = ${cv(C.loss,f(R.E1))} + ${cv(C.loss,f(R.E2))} = ${cv(C.loss,f(R.E))}$$
</div>`;
		}

		// ════════════════════════════════════════════════════════════
		// HIDDEN NEURONS
		// ════════════════════════════════════════════════════════════
		else if (nk==='h1') {
			h = `<h3>$${cv(C.hid,'h_1')}$ — Hidden Neuron</h3>

<div class="bp-section bp-section-hid"><b>① Forward Pass — Computing ${cv(C.hid,'h_1')}</b>

$$${cv(C.hid,'z_{h_1}')} = \\underbrace{${cv(C.w_ih,f(w1))}}_{\\substack{${cv(C.w_ih,'w_1')} \\\\ \\text{weight from }${cv(C.inp,'x_1')}}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} \\;+\\; \\underbrace{${cv(C.w_ih,f(w2))}}_{\\substack{${cv(C.w_ih,'w_2')} \\\\ \\text{weight from }${cv(C.inp,'x_2')}}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} \\;+\\; \\underbrace{${cv(C.b_h,f(b1))}}_{${cv(C.b_h,'b_1')}} = ${cv(C.hid,f(R.zh1))}$$

$$${cv(C.hid,'h_1')} = \\underbrace{\\sigma\\!\\left(${cv(C.hid,f(R.zh1))}\\right)}_{\\substack{${cv(C.sig,'\\text{sigmoid squashes}')} \\\\ ${cv(C.sig,'\\text{to range (0,1)}')}}} = \\frac{1}{1+e^{-${cv(C.hid,f(R.zh1))}}} = \\boxed{${cv(C.hid,f(R.h1))}}$$
</div>

<div class="bp-section bp-section-out"><b>② Prerequisite: Output layer forward + backward (needed for $\\delta_{o_1}, \\delta_{o_2}$)</b>

We need $\\delta_{o_1}$ and $\\delta_{o_2}$ to compute the backward pass for $h_1$. Here's how they were computed:

<b>Output $o_1$:</b>
$$${cv(C.out,'z_{o_1}')} = ${cv(C.w_ho,f(w5))} \\cdot ${cv(C.hid,f(R.h1))} + ${cv(C.w_ho,f(w6))} \\cdot ${cv(C.hid,f(R.h2))} + ${cv(C.b_o,f(b3))} = ${cv(C.out,f(R.zo1))}$$
$$${cv(C.out,'o_1')} = \\sigma(${cv(C.out,f(R.zo1))}) = ${cv(C.out,f(R.o1))}$$
$$\\frac{\\partial E}{\\partial o_1} = -(${cv(C.tgt,f(t1))} - ${cv(C.out,f(R.o1))}) = ${f(R.dE_do1)}$$
$$${cv(C.delta,'\\delta_{o_1}')} = \\underbrace{${f(R.dE_do1)}}_{\\frac{\\partial E}{\\partial o_1}} \\times \\underbrace{${cv(C.out,f(R.o1))} \\cdot ${cv(C.out,f(1-R.o1))}}_{\\sigma'(z_{o_1})} = ${cv(C.delta,f(R.d_o1))}$$

<b>Output $o_2$:</b>
$$${cv(C.out,'z_{o_2}')} = ${cv(C.w_ho,f(w7))} \\cdot ${cv(C.hid,f(R.h1))} + ${cv(C.w_ho,f(w8))} \\cdot ${cv(C.hid,f(R.h2))} + ${cv(C.b_o,f(b4))} = ${cv(C.out,f(R.zo2))}$$
$$${cv(C.out,'o_2')} = \\sigma(${cv(C.out,f(R.zo2))}) = ${cv(C.out,f(R.o2))}$$
$$\\frac{\\partial E}{\\partial o_2} = -(${cv(C.tgt,f(t2))} - ${cv(C.out,f(R.o2))}) = ${f(R.dE_do2)}$$
$$${cv(C.delta,'\\delta_{o_2}')} = \\underbrace{${f(R.dE_do2)}}_{\\frac{\\partial E}{\\partial o_2}} \\times \\underbrace{${cv(C.out,f(R.o2))} \\cdot ${cv(C.out,f(1-R.o2))}}_{\\sigma'(z_{o_2})} = ${cv(C.delta,f(R.d_o2))}$$
</div>

<div class="bp-section bp-section-back"><b>③ Backward Pass — Error signal for $${cv(C.hid,'h_1')}$</b>

Blame arrives from <em>both</em> output neurons, weighted by the connections:

$$\\frac{\\partial E}{\\partial h_1} = \\underbrace{${cv(C.delta,f(R.d_o1))}}_{\\substack{${cv(C.delta,'\\delta_{o_1}')} \\\\ \\text{error from }${cv(C.out,'o_1')}}} \\cdot \\underbrace{${cv(C.w_ho,f(w5))}}_{\\substack{${cv(C.w_ho,'w_5')} \\\\ h_1 \\to o_1}} \\;+\\; \\underbrace{${cv(C.delta,f(R.d_o2))}}_{\\substack{${cv(C.delta,'\\delta_{o_2}')} \\\\ \\text{error from }${cv(C.out,'o_2')}}} \\cdot \\underbrace{${cv(C.w_ho,f(w7))}}_{\\substack{${cv(C.w_ho,'w_7')} \\\\ h_1 \\to o_2}} = ${f(R.dE_dh1)}$$

$$\\underbrace{${cv(C.hid,'h_1')}(1-${cv(C.hid,'h_1')})}_{\\substack{${cv(C.sig,"\\sigma'(z_{h_1})")} \\\\ \\text{sigmoid derivative}}} = ${cv(C.hid,f(R.h1))} \\times ${f(1-R.h1)} = ${f(R.h1*(1-R.h1))}$$

$$${cv(C.delta,'\\delta_{h_1}')} = \\underbrace{${f(R.dE_dh1)}}_{\\frac{\\partial E}{\\partial h_1}} \\times \\underbrace{${f(R.h1*(1-R.h1))}}_{\\sigma'(z_{h_1})} = \\boxed{${cv(C.delta,f(R.d_h1))}}$$
</div>

<div class="bp-section bp-section-grad"><b>④ Weight Gradients — How much each weight feeding into $h_1$ should change</b>

$$${cv(C.grad,'\\frac{\\partial E}{\\partial w_1}')} = \\underbrace{${cv(C.delta,f(R.d_h1))}}_{${cv(C.delta,'\\delta_{h_1}')}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} = ${cv(C.grad,f(R.gw1))}$$

$$${cv(C.grad,'\\frac{\\partial E}{\\partial w_2}')} = \\underbrace{${cv(C.delta,f(R.d_h1))}}_{${cv(C.delta,'\\delta_{h_1}')}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} = ${cv(C.grad,f(R.gw2))}$$

$$${cv(C.grad,'\\frac{\\partial E}{\\partial b_1}')} = ${cv(C.delta,'\\delta_{h_1}')} = ${cv(C.grad,f(R.gb1))}$$
</div>

<div class="bp-section bp-section-update"><b>⑤ Weight Updates</b>

$$${cv(C.w_ih,'w_1^{\\,\\text{new}}')} = \\underbrace{${cv(C.w_ih,f(w1))}}_{w_1} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(R.gw1))}}_{\\frac{\\partial E}{\\partial w_1}} = ${f(w1 - lr*R.gw1)}$$

$$${cv(C.w_ih,'w_2^{\\,\\text{new}}')} = \\underbrace{${cv(C.w_ih,f(w2))}}_{w_2} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(R.gw2))}}_{\\frac{\\partial E}{\\partial w_2}} = ${f(w2 - lr*R.gw2)}$$

$$${cv(C.b_h,'b_1^{\\,\\text{new}}')} = \\underbrace{${cv(C.b_h,f(b1))}}_{b_1} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(R.gb1))}}_{\\frac{\\partial E}{\\partial b_1}} = ${f(b1 - lr*R.gb1)}$$
</div>`;
		}

		else if (nk==='h2') {
			h = `<h3>$${cv(C.hid,'h_2')}$ — Hidden Neuron</h3>

<div class="bp-section bp-section-hid"><b>① Forward Pass — Computing $${cv(C.hid,'h_2')}$</b>

$$${cv(C.hid,'z_{h_2}')} = \\underbrace{${cv(C.w_ih,f(w3))}}_{\\substack{${cv(C.w_ih,'w_3')} \\\\ \\text{weight from }${cv(C.inp,'x_1')}}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} \\;+\\; \\underbrace{${cv(C.w_ih,f(w4))}}_{\\substack{${cv(C.w_ih,'w_4')} \\\\ \\text{weight from }${cv(C.inp,'x_2')}}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} \\;+\\; \\underbrace{${cv(C.b_h,f(b2))}}_{${cv(C.b_h,'b_2')}} = ${cv(C.hid,f(R.zh2))}$$

$$${cv(C.hid,'h_2')} = \\underbrace{\\sigma\\!\\left(${cv(C.hid,f(R.zh2))}\\right)}_{\\substack{${cv(C.sig,'\\text{sigmoid squashes}')} \\\\ ${cv(C.sig,'\\text{to range (0,1)}')}}} = \\frac{1}{1+e^{-${cv(C.hid,f(R.zh2))}}} = \\boxed{${cv(C.hid,f(R.h2))}}$$
</div>

<div class="bp-section bp-section-out"><b>② Prerequisite: Output layer forward + backward (needed for $\\delta_{o_1}, \\delta_{o_2}$)</b>

We need $\\delta_{o_1}$ and $\\delta_{o_2}$ to compute the backward pass for $h_2$. Here's how they were computed:

<b>Output $o_1$:</b>
$$${cv(C.out,'z_{o_1}')} = ${cv(C.w_ho,f(w5))} \\cdot ${cv(C.hid,f(R.h1))} + ${cv(C.w_ho,f(w6))} \\cdot ${cv(C.hid,f(R.h2))} + ${cv(C.b_o,f(b3))} = ${cv(C.out,f(R.zo1))}$$
$$${cv(C.out,'o_1')} = \\sigma(${cv(C.out,f(R.zo1))}) = ${cv(C.out,f(R.o1))}$$
$$\\frac{\\partial E}{\\partial o_1} = -(${cv(C.tgt,f(t1))} - ${cv(C.out,f(R.o1))}) = ${f(R.dE_do1)}$$
$$${cv(C.delta,'\\delta_{o_1}')} = \\underbrace{${f(R.dE_do1)}}_{\\frac{\\partial E}{\\partial o_1}} \\times \\underbrace{${cv(C.out,f(R.o1))} \\cdot ${cv(C.out,f(1-R.o1))}}_{\\sigma'(z_{o_1})} = ${cv(C.delta,f(R.d_o1))}$$

<b>Output $o_2$:</b>
$$${cv(C.out,'z_{o_2}')} = ${cv(C.w_ho,f(w7))} \\cdot ${cv(C.hid,f(R.h1))} + ${cv(C.w_ho,f(w8))} \\cdot ${cv(C.hid,f(R.h2))} + ${cv(C.b_o,f(b4))} = ${cv(C.out,f(R.zo2))}$$
$$${cv(C.out,'o_2')} = \\sigma(${cv(C.out,f(R.zo2))}) = ${cv(C.out,f(R.o2))}$$
$$\\frac{\\partial E}{\\partial o_2} = -(${cv(C.tgt,f(t2))} - ${cv(C.out,f(R.o2))}) = ${f(R.dE_do2)}$$
$$${cv(C.delta,'\\delta_{o_2}')} = \\underbrace{${f(R.dE_do2)}}_{\\frac{\\partial E}{\\partial o_2}} \\times \\underbrace{${cv(C.out,f(R.o2))} \\cdot ${cv(C.out,f(1-R.o2))}}_{\\sigma'(z_{o_2})} = ${cv(C.delta,f(R.d_o2))}$$
</div>

<div class="bp-section bp-section-back"><b>③ Backward Pass — Error signal for $${cv(C.hid,'h_2')}$</b>

Blame arrives from <em>both</em> output neurons, weighted by the connections:

$$\\frac{\\partial E}{\\partial h_2} = \\underbrace{${cv(C.delta,f(R.d_o1))}}_{\\substack{${cv(C.delta,'\\delta_{o_1}')} \\\\ \\text{error from }${cv(C.out,'o_1')}}} \\cdot \\underbrace{${cv(C.w_ho,f(w6))}}_{\\substack{${cv(C.w_ho,'w_6')} \\\\ h_2 \\to o_1}} \\;+\\; \\underbrace{${cv(C.delta,f(R.d_o2))}}_{\\substack{${cv(C.delta,'\\delta_{o_2}')} \\\\ \\text{error from }${cv(C.out,'o_2')}}} \\cdot \\underbrace{${cv(C.w_ho,f(w8))}}_{\\substack{${cv(C.w_ho,'w_8')} \\\\ h_2 \\to o_2}} = ${f(R.dE_dh2)}$$

$$\\underbrace{${cv(C.hid,'h_2')}(1-${cv(C.hid,'h_2')})}_{\\substack{${cv(C.sig,"\\sigma'(z_{h_2})")} \\\\ \\text{sigmoid derivative}}} = ${cv(C.hid,f(R.h2))} \\times ${f(1-R.h2)} = ${f(R.h2*(1-R.h2))}$$

$$${cv(C.delta,'\\delta_{h_2}')} = \\underbrace{${f(R.dE_dh2)}}_{\\frac{\\partial E}{\\partial h_2}} \\times \\underbrace{${f(R.h2*(1-R.h2))}}_{\\sigma'(z_{h_2})} = \\boxed{${cv(C.delta,f(R.d_h2))}}$$
</div>

<div class="bp-section bp-section-grad"><b>④ Weight Gradients — How much each weight feeding into $h_2$ should change</b>

$$${cv(C.grad,'\\frac{\\partial E}{\\partial w_3}')} = \\underbrace{${cv(C.delta,f(R.d_h2))}}_{${cv(C.delta,'\\delta_{h_2}')}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} = ${cv(C.grad,f(R.gw3))}$$

$$${cv(C.grad,'\\frac{\\partial E}{\\partial w_4}')} = \\underbrace{${cv(C.delta,f(R.d_h2))}}_{${cv(C.delta,'\\delta_{h_2}')}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} = ${cv(C.grad,f(R.gw4))}$$

$$${cv(C.grad,'\\frac{\\partial E}{\\partial b_2}')} = ${cv(C.delta,'\\delta_{h_2}')} = ${cv(C.grad,f(R.gb2))}$$
</div>

<div class="bp-section bp-section-update"><b>⑤ Weight Updates</b>

$$${cv(C.w_ih,'w_3^{\\,\\text{new}}')} = \\underbrace{${cv(C.w_ih,f(w3))}}_{w_3} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(R.gw3))}}_{\\frac{\\partial E}{\\partial w_3}} = ${f(w3 - lr*R.gw3)}$$

$$${cv(C.w_ih,'w_4^{\\,\\text{new}}')} = \\underbrace{${cv(C.w_ih,f(w4))}}_{w_4} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(R.gw4))}}_{\\frac{\\partial E}{\\partial w_4}} = ${f(w4 - lr*R.gw4)}$$

$$${cv(C.b_h,'b_2^{\\,\\text{new}}')} = \\underbrace{${cv(C.b_h,f(b2))}}_{b_2} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(R.gb2))}}_{\\frac{\\partial E}{\\partial b_2}} = ${f(b2 - lr*R.gb2)}$$
</div>`;
		}

		// ════════════════════════════════════════════════════════════
		// OUTPUT NEURONS
		// ════════════════════════════════════════════════════════════
		else if (nk==='o1') {
			const dir = R.d_o1 > 0 ? 'Prediction too HIGH — needs to decrease' : R.d_o1 < 0 ? 'Prediction too LOW — needs to increase' : 'Perfect!';
			h = `<h3>${cv(C.out,'o_1')} — Output Neuron</h3>
<p style="color:#64748b;"><em>${dir}</em> &nbsp; (target $${cv(C.tgt,'t_1')} = ${cv(C.tgt,f(t1,4))}$)</p>

<div class="bp-section bp-section-hid"><b>① Prerequisite: Hidden layer forward pass (needed to get $h_1, h_2$)</b>

$$${cv(C.hid,'z_{h_1}')} = \\underbrace{${cv(C.w_ih,f(w1))}}_{${cv(C.w_ih,'w_1')}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} + \\underbrace{${cv(C.w_ih,f(w2))}}_{${cv(C.w_ih,'w_2')}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} + \\underbrace{${cv(C.b_h,f(b1))}}_{${cv(C.b_h,'b_1')}} = ${cv(C.hid,f(R.zh1))}$$
$$${cv(C.hid,'h_1')} = \\sigma\\!\\left(${cv(C.hid,f(R.zh1))}\\right) = ${cv(C.hid,f(R.h1))}$$

$$${cv(C.hid,'z_{h_2}')} = \\underbrace{${cv(C.w_ih,f(w3))}}_{${cv(C.w_ih,'w_3')}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} + \\underbrace{${cv(C.w_ih,f(w4))}}_{${cv(C.w_ih,'w_4')}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} + \\underbrace{${cv(C.b_h,f(b2))}}_{${cv(C.b_h,'b_2')}} = ${cv(C.hid,f(R.zh2))}$$
$$${cv(C.hid,'h_2')} = \\sigma\\!\\left(${cv(C.hid,f(R.zh2))}\\right) = ${cv(C.hid,f(R.h2))}$$
</div>

<div class="bp-section bp-section-out"><b>② Forward Pass — Computing $${cv(C.out,'o_1')}$</b>

$$${cv(C.out,'z_{o_1}')} = \\underbrace{${cv(C.w_ho,f(w5))}}_{\\substack{${cv(C.w_ho,'w_5')} \\\\ \\text{weight from }${cv(C.hid,'h_1')}}} \\cdot \\underbrace{${cv(C.hid,f(R.h1))}}_{${cv(C.hid,'h_1')}} \\;+\\; \\underbrace{${cv(C.w_ho,f(w6))}}_{\\substack{${cv(C.w_ho,'w_6')} \\\\ \\text{weight from }${cv(C.hid,'h_2')}}} \\cdot \\underbrace{${cv(C.hid,f(R.h2))}}_{${cv(C.hid,'h_2')}} \\;+\\; \\underbrace{${cv(C.b_o,f(b3))}}_{${cv(C.b_o,'b_3')}} = ${cv(C.out,f(R.zo1))}$$

$$${cv(C.out,'o_1')} = \\underbrace{\\sigma\\!\\left(${cv(C.out,f(R.zo1))}\\right)}_{\\substack{${cv(C.sig,'\\text{sigmoid squashes}')} \\\\ ${cv(C.sig,'\\text{to range (0,1)}')}}} = \\frac{1}{1+e^{-${cv(C.out,f(R.zo1))}}} = \\boxed{${cv(C.out,f(R.o1))}}$$
</div>

<div class="bp-section bp-section-loss"><b>③ Loss — How wrong is this prediction?</b>

$$${cv(C.loss,'E_1')} = \\tfrac{1}{2}\\!\\left(\\underbrace{${cv(C.tgt,f(t1,4))}}_{${cv(C.tgt,'t_1')}} - \\underbrace{${cv(C.out,f(R.o1))}}_{${cv(C.out,'o_1')}}\\right)^{\\!2} = ${cv(C.loss,f(R.E1))}$$
$$${cv(C.loss,'E_{\\text{total}}')} = ${cv(C.loss,'E_1')} + ${cv(C.loss,'E_2')} = ${cv(C.loss,f(R.E1))} + ${cv(C.loss,f(R.E2))} = ${cv(C.loss,f(R.E))}$$
</div>

<div class="bp-section bp-section-back"><b>④ Backward Pass — The 3 chain-rule factors</b>

$$\\underbrace{\\frac{\\partial E}{\\partial o_1}}_{\\substack{\\text{how wrong?} \\\\ \\text{direction of error}}} = -\\!\\left(\\underbrace{${cv(C.tgt,f(t1,4))}}_{${cv(C.tgt,'t_1')}} - \\underbrace{${cv(C.out,f(R.o1))}}_{${cv(C.out,'o_1')}}\\right) = ${f(R.dE_do1)}$$

$$\\underbrace{\\frac{\\partial o_1}{\\partial z_{o_1}}}_{\\substack{${cv(C.sig,"\\sigma'(z_{o_1})")} \\\\ \\text{sigmoid derivative}}} = \\underbrace{${cv(C.out,f(R.o1))}}_{o_1} \\cdot \\underbrace{${cv(C.out,f(1-R.o1))}}_{1-o_1} = ${f(R.do1_dz1)}$$

$$${cv(C.delta,'\\delta_{o_1}')} = \\underbrace{${f(R.dE_do1)}}_{\\frac{\\partial E}{\\partial o_1}} \\times \\underbrace{${f(R.do1_dz1)}}_{\\sigma'(z_{o_1})} = \\boxed{${cv(C.delta,f(R.d_o1))}}$$
</div>

<div class="bp-section bp-section-grad"><b>⑤ Weight Gradients</b>

Each gradient = $\\delta_{o_1} \\times$ (the value that flowed through that weight):

$$${cv(C.grad,'\\frac{\\partial E}{\\partial w_5}')} = \\underbrace{${cv(C.delta,f(R.d_o1))}}_{${cv(C.delta,'\\delta_{o_1}')}} \\cdot \\underbrace{${cv(C.hid,f(R.h1))}}_{${cv(C.hid,'h_1')}} = ${cv(C.grad,f(R.gw5))}$$

$$${cv(C.grad,'\\frac{\\partial E}{\\partial w_6}')} = \\underbrace{${cv(C.delta,f(R.d_o1))}}_{${cv(C.delta,'\\delta_{o_1}')}} \\cdot \\underbrace{${cv(C.hid,f(R.h2))}}_{${cv(C.hid,'h_2')}} = ${cv(C.grad,f(R.gw6))}$$

$$${cv(C.grad,'\\frac{\\partial E}{\\partial b_3}')} = ${cv(C.delta,'\\delta_{o_1}')} = ${cv(C.grad,f(R.gb3))}$$
</div>

<div class="bp-section bp-section-update"><b>⑥ Weight Updates</b>

$$${cv(C.w_ho,'w_5^{\\,\\text{new}}')} = \\underbrace{${cv(C.w_ho,f(w5))}}_{w_5} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(R.gw5))}}_{\\frac{\\partial E}{\\partial w_5}} = ${f(w5 - lr*R.gw5)}$$

$$${cv(C.w_ho,'w_6^{\\,\\text{new}}')} = \\underbrace{${cv(C.w_ho,f(w6))}}_{w_6} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(R.gw6))}}_{\\frac{\\partial E}{\\partial w_6}} = ${f(w6 - lr*R.gw6)}$$

$$${cv(C.b_o,'b_3^{\\,\\text{new}}')} = \\underbrace{${cv(C.b_o,f(b3))}}_{b_3} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(R.gb3))}}_{\\frac{\\partial E}{\\partial b_3}} = ${f(b3 - lr*R.gb3)}$$
</div>`;
		}

		else if (nk==='o2') {
			const dir = R.d_o2 > 0 ? 'Prediction too HIGH — needs to decrease' : R.d_o2 < 0 ? 'Prediction too LOW — needs to increase' : 'Perfect!';
			h = `<h3>${cv(C.out,'o_2')} — Output Neuron</h3>
<p style="color:#64748b;"><em>${dir}</em> &nbsp; (target $${cv(C.tgt,'t_2')} = ${cv(C.tgt,f(t2,4))}$)</p>

<div class="bp-section bp-section-hid"><b>① Prerequisite: Hidden layer forward pass (needed to get $h_1, h_2$)</b>

$$${cv(C.hid,'z_{h_1}')} = \\underbrace{${cv(C.w_ih,f(w1))}}_{${cv(C.w_ih,'w_1')}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} + \\underbrace{${cv(C.w_ih,f(w2))}}_{${cv(C.w_ih,'w_2')}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} + \\underbrace{${cv(C.b_h,f(b1))}}_{${cv(C.b_h,'b_1')}} = ${cv(C.hid,f(R.zh1))}$$
$$${cv(C.hid,'h_1')} = \\sigma\\!\\left(${cv(C.hid,f(R.zh1))}\\right) = ${cv(C.hid,f(R.h1))}$$

$$${cv(C.hid,'z_{h_2}')} = \\underbrace{${cv(C.w_ih,f(w3))}}_{${cv(C.w_ih,'w_3')}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} + \\underbrace{${cv(C.w_ih,f(w4))}}_{${cv(C.w_ih,'w_4')}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} + \\underbrace{${cv(C.b_h,f(b2))}}_{${cv(C.b_h,'b_2')}} = ${cv(C.hid,f(R.zh2))}$$
$$${cv(C.hid,'h_2')} = \\sigma\\!\\left(${cv(C.hid,f(R.zh2))}\\right) = ${cv(C.hid,f(R.h2))}$$
</div>

<div class="bp-section bp-section-out"><b>② Forward Pass — Computing $${cv(C.out,'o_2')}$</b>

$$${cv(C.out,'z_{o_2}')} = \\underbrace{${cv(C.w_ho,f(w7))}}_{\\substack{${cv(C.w_ho,'w_7')} \\\\ \\text{weight from }${cv(C.hid,'h_1')}}} \\cdot \\underbrace{${cv(C.hid,f(R.h1))}}_{${cv(C.hid,'h_1')}} \\;+\\; \\underbrace{${cv(C.w_ho,f(w8))}}_{\\substack{${cv(C.w_ho,'w_8')} \\\\ \\text{weight from }${cv(C.hid,'h_2')}}} \\cdot \\underbrace{${cv(C.hid,f(R.h2))}}_{${cv(C.hid,'h_2')}} \\;+\\; \\underbrace{${cv(C.b_o,f(b4))}}_{${cv(C.b_o,'b_4')}} = ${cv(C.out,f(R.zo2))}$$

$$${cv(C.out,'o_2')} = \\underbrace{\\sigma\\!\\left(${cv(C.out,f(R.zo2))}\\right)}_{\\substack{${cv(C.sig,'\\text{sigmoid squashes}')} \\\\ ${cv(C.sig,'\\text{to range (0,1)}')}}} = \\frac{1}{1+e^{-${cv(C.out,f(R.zo2))}}} = \\boxed{${cv(C.out,f(R.o2))}}$$
</div>

<div class="bp-section bp-section-loss"><b>③ Loss — How wrong is this prediction?</b>

$$${cv(C.loss,'E_2')} = \\tfrac{1}{2}\\!\\left(\\underbrace{${cv(C.tgt,f(t2,4))}}_{${cv(C.tgt,'t_2')}} - \\underbrace{${cv(C.out,f(R.o2))}}_{${cv(C.out,'o_2')}}\\right)^{\\!2} = ${cv(C.loss,f(R.E2))}$$
$$${cv(C.loss,'E_{\\text{total}}')} = ${cv(C.loss,'E_1')} + ${cv(C.loss,'E_2')} = ${cv(C.loss,f(R.E1))} + ${cv(C.loss,f(R.E2))} = ${cv(C.loss,f(R.E))}$$
</div>

<div class="bp-section bp-section-back"><b>④ Backward Pass — The 3 chain-rule factors</b>

$$\\underbrace{\\frac{\\partial E}{\\partial o_2}}_{\\substack{\\text{how wrong?} \\\\ \\text{direction of error}}} = -\\!\\left(\\underbrace{${cv(C.tgt,f(t2,4))}}_{${cv(C.tgt,'t_2')}} - \\underbrace{${cv(C.out,f(R.o2))}}_{${cv(C.out,'o_2')}}\\right) = ${f(R.dE_do2)}$$

$$\\underbrace{\\frac{\\partial o_2}{\\partial z_{o_2}}}_{\\substack{${cv(C.sig,"\\sigma'(z_{o_2})")} \\\\ \\text{sigmoid derivative}}} = \\underbrace{${cv(C.out,f(R.o2))}}_{o_2} \\cdot \\underbrace{${cv(C.out,f(1-R.o2))}}_{1-o_2} = ${f(R.do2_dz2)}$$

$$${cv(C.delta,'\\delta_{o_2}')} = \\underbrace{${f(R.dE_do2)}}_{\\frac{\\partial E}{\\partial o_2}} \\times \\underbrace{${f(R.do2_dz2)}}_{\\sigma'(z_{o_2})} = \\boxed{${cv(C.delta,f(R.d_o2))}}$$
</div>

<div class="bp-section bp-section-grad"><b>⑤ Weight Gradients</b>

Each gradient = $\\delta_{o_2} \\times$ (the value that flowed through that weight):

$$${cv(C.grad,'\\frac{\\partial E}{\\partial w_7}')} = \\underbrace{${cv(C.delta,f(R.d_o2))}}_{${cv(C.delta,'\\delta_{o_2}')}} \\cdot \\underbrace{${cv(C.hid,f(R.h1))}}_{${cv(C.hid,'h_1')}} = ${cv(C.grad,f(R.gw7))}$$

$$${cv(C.grad,'\\frac{\\partial E}{\\partial w_8}')} = \\underbrace{${cv(C.delta,f(R.d_o2))}}_{${cv(C.delta,'\\delta_{o_2}')}} \\cdot \\underbrace{${cv(C.hid,f(R.h2))}}_{${cv(C.hid,'h_2')}} = ${cv(C.grad,f(R.gw8))}$$

$$${cv(C.grad,'\\frac{\\partial E}{\\partial b_4}')} = ${cv(C.delta,'\\delta_{o_2}')} = ${cv(C.grad,f(R.gb4))}$$
</div>

<div class="bp-section bp-section-update"><b>⑥ Weight Updates</b>

$$${cv(C.w_ho,'w_7^{\\,\\text{new}}')} = \\underbrace{${cv(C.w_ho,f(w7))}}_{w_7} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(R.gw7))}}_{\\frac{\\partial E}{\\partial w_7}} = ${f(w7 - lr*R.gw7)}$$

$$${cv(C.w_ho,'w_8^{\\,\\text{new}}')} = \\underbrace{${cv(C.w_ho,f(w8))}}_{w_8} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(R.gw8))}}_{\\frac{\\partial E}{\\partial w_8}} = ${f(w8 - lr*R.gw8)}$$

$$${cv(C.b_o,'b_4^{\\,\\text{new}}')} = \\underbrace{${cv(C.b_o,f(b4))}}_{b_4} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(R.gb4))}}_{\\frac{\\partial E}{\\partial b_4}} = ${f(b4 - lr*R.gb4)}$$
</div>`;
		}

		renderInfo(h);
	}

	function showWeightInfo(wk, isLocked) {
		highlightWeights([wk]);
		const {x1,x2,t1,t2,w1,w2,w3,w4,b1,b2,w5,w6,w7,w8,b3,b4,lr} = S;
		const wVal = S[wk];
		const labels = {w1:'w_1',w2:'w_2',w3:'w_3',w4:'w_4',w5:'w_5',w6:'w_6',w7:'w_7',w8:'w_8'};

		// ── Input→Hidden weights (w1..w4) ──
		if (wk==='w1' || wk==='w2' || wk==='w3' || wk==='w4') {
			const isH1 = (wk==='w1' || wk==='w2');
			const hLabel = isH1 ? 'h_1' : 'h_2';
			const hVal = isH1 ? R.h1 : R.h2;
			const zh = isH1 ? R.zh1 : R.zh2;
			const dH = isH1 ? R.d_h1 : R.d_h2;
			const dE_dh = isH1 ? R.dE_dh1 : R.dE_dh2;
			const inputLabel = (wk==='w1'||wk==='w3') ? 'x_1' : 'x_2';
			const inputVal = (wk==='w1'||wk==='w3') ? x1 : x2;
			const grad = (wk==='w1') ? R.gw1 : (wk==='w2') ? R.gw2 : (wk==='w3') ? R.gw3 : R.gw4;
			const bLabel = isH1 ? 'b_1' : 'b_2';
			const bVal = isH1 ? b1 : b2;
			const wH1 = isH1 ? w1 : w3;
			const wH2 = isH1 ? w2 : w4;
			const wH1l = isH1 ? 'w_1' : 'w_3';
			const wH2l = isH1 ? 'w_2' : 'w_4';
			const w_o1 = isH1 ? w5 : w6;
			const w_o2 = isH1 ? w7 : w8;
			const w_o1l = isH1 ? 'w_5' : 'w_6';
			const w_o2l = isH1 ? 'w_7' : 'w_8';
			const nw = wVal - lr*grad;
			const dir = grad > 0 ? '\\searrow \\text{ weight decreases}' : grad < 0 ? '\\nearrow \\text{ weight increases}' : '\\text{no change}';

			let h = `<h3>${cv(C.w_ih,labels[wk])} = ${cv(C.w_ih,f(wVal))} — Weight (Input → Hidden)</h3>
<p>Connects ${cv(C.inp,inputLabel)} to ${cv(C.hid,hLabel)}</p>

<div class="bp-section bp-section-hid"><b>① Forward Pass — How ${cv(C.hid,hLabel)} was computed (this weight participates here)</b>

$$${cv(C.hid,'z_{'+hLabel+'}')} = \\underbrace{${cv(C.w_ih,f(wH1))}}_{${cv(C.w_ih,wH1l)}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} \\;+\\; \\underbrace{${cv(C.w_ih,f(wH2))}}_{${cv(C.w_ih,wH2l)}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} \\;+\\; \\underbrace{${cv(C.b_h,f(bVal))}}_{${cv(C.b_h,bLabel)}} = ${cv(C.hid,f(zh))}$$

$$${cv(C.hid,hLabel)} = \\sigma\\!\\left(${cv(C.hid,f(zh))}\\right) = ${cv(C.hid,f(hVal))}$$
</div>

<div class="bp-section bp-section-out"><b>② Prerequisite: Output deltas (needed to compute $\\delta_{${hLabel}}$)</b>

<b>Output $o_1$:</b>
$$${cv(C.out,'z_{o_1}')} = ${cv(C.w_ho,f(w5))} \\cdot ${cv(C.hid,f(R.h1))} + ${cv(C.w_ho,f(w6))} \\cdot ${cv(C.hid,f(R.h2))} + ${cv(C.b_o,f(b3))} = ${cv(C.out,f(R.zo1))}$$
$$${cv(C.out,'o_1')} = \\sigma(${cv(C.out,f(R.zo1))}) = ${cv(C.out,f(R.o1))}$$
$$${cv(C.delta,'\\delta_{o_1}')} = -(${cv(C.tgt,f(t1))} - ${cv(C.out,f(R.o1))}) \\cdot ${cv(C.out,f(R.o1))} \\cdot ${cv(C.out,f(1-R.o1))} = ${cv(C.delta,f(R.d_o1))}$$

<b>Output $o_2$:</b>
$$${cv(C.out,'z_{o_2}')} = ${cv(C.w_ho,f(w7))} \\cdot ${cv(C.hid,f(R.h1))} + ${cv(C.w_ho,f(w8))} \\cdot ${cv(C.hid,f(R.h2))} + ${cv(C.b_o,f(b4))} = ${cv(C.out,f(R.zo2))}$$
$$${cv(C.out,'o_2')} = \\sigma(${cv(C.out,f(R.zo2))}) = ${cv(C.out,f(R.o2))}$$
$$${cv(C.delta,'\\delta_{o_2}')} = -(${cv(C.tgt,f(t2))} - ${cv(C.out,f(R.o2))}) \\cdot ${cv(C.out,f(R.o2))} \\cdot ${cv(C.out,f(1-R.o2))} = ${cv(C.delta,f(R.d_o2))}$$
</div>

<div class="bp-section bp-section-back"><b>③ Hidden delta $\\delta_{${hLabel}}$</b>

$$\\frac{\\partial E}{\\partial ${hLabel}} = \\underbrace{${cv(C.delta,f(R.d_o1))}}_{${cv(C.delta,'\\delta_{o_1}')}} \\cdot \\underbrace{${cv(C.w_ho,f(w_o1))}}_{${cv(C.w_ho,w_o1l)}} \\;+\\; \\underbrace{${cv(C.delta,f(R.d_o2))}}_{${cv(C.delta,'\\delta_{o_2}')}} \\cdot \\underbrace{${cv(C.w_ho,f(w_o2))}}_{${cv(C.w_ho,w_o2l)}} = ${f(dE_dh)}$$

$$${cv(C.delta,'\\delta_{'+hLabel+'}')} = \\underbrace{${f(dE_dh)}}_{\\frac{\\partial E}{\\partial ${hLabel}}} \\times \\underbrace{${cv(C.hid,f(hVal))} \\cdot ${cv(C.hid,f(1-hVal))}}_{\\sigma'(z_{${hLabel}})} = ${cv(C.delta,f(dH))}$$
</div>

<div class="bp-section bp-section-grad"><b>④ Gradient for this weight</b>

$$${cv(C.grad,'\\frac{\\partial E}{\\partial '+labels[wk]+'}')} = \\underbrace{${cv(C.delta,f(dH))}}_{${cv(C.delta,'\\delta_{'+hLabel+'}')}} \\cdot \\underbrace{${cv(C.inp,f(inputVal))}}_{${cv(C.inp,inputLabel)}} = ${cv(C.grad,f(grad))}$$
</div>

<div class="bp-section bp-section-update"><b>⑤ Weight Update</b>

$$${cv(C.w_ih,labels[wk]+'^{\\,\\text{new}}')} = \\underbrace{${cv(C.w_ih,f(wVal))}}_{${cv(C.w_ih,labels[wk])}} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(grad))}}_{\\frac{\\partial E}{\\partial ${labels[wk]}}} = ${f(nw)}$$

$$${dir}$$
</div>`;
			renderInfo(h);
			return;
		}

		// ── Hidden→Output weights (w5..w8) ──
		if (wk==='w5' || wk==='w6' || wk==='w7' || wk==='w8') {
			const isO1 = (wk==='w5' || wk==='w6');
			const oLabel = isO1 ? 'o_1' : 'o_2';
			const oVal = isO1 ? R.o1 : R.o2;
			const zo = isO1 ? R.zo1 : R.zo2;
			const dO = isO1 ? R.d_o1 : R.d_o2;
			const dE_do = isO1 ? R.dE_do1 : R.dE_do2;
			const tLabel = isO1 ? 't_1' : 't_2';
			const tVal = isO1 ? t1 : t2;
			const inputLabel = (wk==='w5'||wk==='w7') ? 'h_1' : 'h_2';
			const inputVal = (wk==='w5'||wk==='w7') ? R.h1 : R.h2;
			const grad = (wk==='w5') ? R.gw5 : (wk==='w6') ? R.gw6 : (wk==='w7') ? R.gw7 : R.gw8;
			const bLabel = isO1 ? 'b_3' : 'b_4';
			const bVal = isO1 ? b3 : b4;
			const wO1 = isO1 ? w5 : w7;
			const wO2 = isO1 ? w6 : w8;
			const wO1l = isO1 ? 'w_5' : 'w_7';
			const wO2l = isO1 ? 'w_6' : 'w_8';
			const nw = wVal - lr*grad;
			const dir = grad > 0 ? '\\searrow \\text{ weight decreases}' : grad < 0 ? '\\nearrow \\text{ weight increases}' : '\\text{no change}';

			let h = `<h3>${cv(C.w_ho,labels[wk])} = ${cv(C.w_ho,f(wVal))} — Weight (Hidden → Output)</h3>
<p>Connects ${cv(C.hid,inputLabel)} to ${cv(C.out,oLabel)}</p>

<div class="bp-section bp-section-hid"><b>① Prerequisite: Hidden layer forward pass</b>

$$${cv(C.hid,'z_{h_1}')} = \\underbrace{${cv(C.w_ih,f(w1))}}_{${cv(C.w_ih,'w_1')}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} + \\underbrace{${cv(C.w_ih,f(w2))}}_{${cv(C.w_ih,'w_2')}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} + \\underbrace{${cv(C.b_h,f(b1))}}_{${cv(C.b_h,'b_1')}} = ${cv(C.hid,f(R.zh1))}$$
$$${cv(C.hid,'h_1')} = \\sigma(${cv(C.hid,f(R.zh1))}) = ${cv(C.hid,f(R.h1))}$$

$$${cv(C.hid,'z_{h_2}')} = \\underbrace{${cv(C.w_ih,f(w3))}}_{${cv(C.w_ih,'w_3')}} \\cdot \\underbrace{${cv(C.inp,f(x1))}}_{${cv(C.inp,'x_1')}} + \\underbrace{${cv(C.w_ih,f(w4))}}_{${cv(C.w_ih,'w_4')}} \\cdot \\underbrace{${cv(C.inp,f(x2))}}_{${cv(C.inp,'x_2')}} + \\underbrace{${cv(C.b_h,f(b2))}}_{${cv(C.b_h,'b_2')}} = ${cv(C.hid,f(R.zh2))}$$
$$${cv(C.hid,'h_2')} = \\sigma(${cv(C.hid,f(R.zh2))}) = ${cv(C.hid,f(R.h2))}$$
</div>

<div class="bp-section bp-section-out"><b>② Forward Pass — How ${cv(C.out,oLabel)} was computed (this weight participates here)</b>

$$${cv(C.out,'z_{'+oLabel+'}')} = \\underbrace{${cv(C.w_ho,f(wO1))}}_{${cv(C.w_ho,wO1l)}} \\cdot \\underbrace{${cv(C.hid,f(R.h1))}}_{${cv(C.hid,'h_1')}} \\;+\\; \\underbrace{${cv(C.w_ho,f(wO2))}}_{${cv(C.w_ho,wO2l)}} \\cdot \\underbrace{${cv(C.hid,f(R.h2))}}_{${cv(C.hid,'h_2')}} \\;+\\; \\underbrace{${cv(C.b_o,f(bVal))}}_{${cv(C.b_o,bLabel)}} = ${cv(C.out,f(zo))}$$

$$${cv(C.out,oLabel)} = \\sigma\\!\\left(${cv(C.out,f(zo))}\\right) = ${cv(C.out,f(oVal))}$$
</div>

<div class="bp-section bp-section-loss"><b>③ Loss</b>

$$${cv(C.loss,'E_{'+oLabel.replace('o_','')+'}')} = \\tfrac{1}{2}\\!\\left(${cv(C.tgt,f(tVal))} - ${cv(C.out,f(oVal))}\\right)^{\\!2} = ${cv(C.loss,f(isO1?R.E1:R.E2))}$$
</div>

<div class="bp-section bp-section-back"><b>④ Output delta $\\delta_{${oLabel}}$</b>

$$\\frac{\\partial E}{\\partial ${oLabel}} = -(${cv(C.tgt,f(tVal))} - ${cv(C.out,f(oVal))}) = ${f(dE_do)}$$

$$${cv(C.delta,'\\delta_{'+oLabel+'}')} = \\underbrace{${f(dE_do)}}_{\\frac{\\partial E}{\\partial ${oLabel}}} \\times \\underbrace{${cv(C.out,f(oVal))} \\cdot ${cv(C.out,f(1-oVal))}}_{\\sigma'(z_{${oLabel}})} = ${cv(C.delta,f(dO))}$$
</div>

<div class="bp-section bp-section-grad"><b>⑤ Gradient for this weight</b>

$$${cv(C.grad,'\\frac{\\partial E}{\\partial '+labels[wk]+'}')} = \\underbrace{${cv(C.delta,f(dO))}}_{${cv(C.delta,'\\delta_{'+oLabel+'}')}} \\cdot \\underbrace{${cv(C.hid,f(inputVal))}}_{${cv(C.hid,inputLabel)}} = ${cv(C.grad,f(grad))}$$
</div>

<div class="bp-section bp-section-update"><b>⑥ Weight Update</b>

$$${cv(C.w_ho,labels[wk]+'^{\\,\\text{new}}')} = \\underbrace{${cv(C.w_ho,f(wVal))}}_{${cv(C.w_ho,labels[wk])}} - \\underbrace{${cv(C.lr,f(lr))}}_{\\eta} \\cdot \\underbrace{${cv(C.grad,f(grad))}}_{\\frac{\\partial E}{\\partial ${labels[wk]}}} = ${f(nw)}$$

$$${dir}$$
</div>`;
			renderInfo(h);
			return;
		}
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
	syncInputs();
}

async function loadBackproplabModule () {
	renderBackpropVisual('bp-visual');
	sigmoid_plot();
}
