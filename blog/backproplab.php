<?php include_once("functions.php"); ?>

<div class="md">
You've already learned how **gradient descent** finds the bottom of a valley, and how the **chain rule** lets us pass error signals through a chain of operations. **Backpropagation** is the algorithm that puts these two ideas together to train an entire neural network.

The word "backpropagation" literally means **"propagating errors backward."** Here's the intuition:

1. **Forward Pass:** Data flows *forward* through the network — input → hidden layer → output → prediction.
2. **Compute Loss:** We compare the prediction to the true answer and get a single number: the **error** (loss).
3. **Backward Pass:** That error signal flows *backward* through every layer. Each neuron asks: *"How much did I contribute to this mistake?"* and adjusts its weights accordingly.

The mathematical engine behind step 3 is the **chain rule**, applied systematically from the output layer all the way back to the first layer.

## The Network We'll Use

We'll work with the simplest possible network that still demonstrates every concept: **2 inputs, 2 hidden neurons, 2 outputs**. This is the same architecture used in Matt Mazur's classic walkthrough, and it's enough to see every moving part.

$$
\text{Input } \mathbf{x} = \begin{pmatrix} x_1 \\ x_2 \end{pmatrix}
\xrightarrow{W^{(1)}, b^{(1)}}
\text{Hidden } \mathbf{h} = \begin{pmatrix} h_1 \\ h_2 \end{pmatrix}
\xrightarrow{W^{(2)}, b^{(2)}}
\text{Output } \mathbf{o} = \begin{pmatrix} o_1 \\ o_2 \end{pmatrix}
$$

Each arrow represents a **linear transformation** followed by the **sigmoid activation function**:

$$
\sigma(z) = \frac{1}{1 + e^{-z}}
$$

The sigmoid squashes any number into the range $(0, 1)$, which is essential for keeping values bounded and for computing smooth gradients.

## The Sigmoid Derivative (Key Identity)

One reason sigmoid is pedagogically useful is that its derivative has an elegant closed form:

$$
\sigma'(z) = \sigma(z) \cdot (1 - \sigma(z))
$$

This means once we know the *output* of a sigmoid neuron, we instantly know its derivative — no extra computation needed. You'll see this identity used at every neuron during the backward pass.

## The Loss Function

We use the **Mean Squared Error (MSE)** to measure how wrong the network is:

$$
E_{\text{total}} = \sum_{i} \frac{1}{2}(t_i - o_i)^2
$$

where $t_i$ is the target (true value) and $o_i$ is the network's output. The $\frac{1}{2}$ is a mathematical convenience — it cancels with the exponent when we take the derivative:

$$
\frac{\partial}{\partial o_i} \left[ \frac{1}{2}(t_i - o_i)^2 \right] = -(t_i - o_i)
$$

## What "Information Flows Back" Really Means

During the **forward pass**, numbers flow left-to-right: inputs get multiplied by weights, summed, and squeezed through activation functions to produce outputs.

During the **backward pass**, a single number — the **error gradient** — flows right-to-left. At each node, the chain rule **splits** this gradient and distributes it to every incoming connection. Each weight receives a specific "blame signal" proportional to how much it contributed to the error.

Concretely, for any weight $w$:

$$
\frac{\partial E}{\partial w} = \underbrace{\frac{\partial E}{\partial o}}_{\text{error at output}} \times \underbrace{\frac{\partial o}{\partial z}}_{\text{activation slope}} \times \underbrace{\frac{\partial z}{\partial w}}_{\text{input to this node}}
$$

This is the chain rule applied link by link. The backward pass computes these products starting from the output and working toward the input — that's why it's called **back**propagation.
</div>

<div id="bp-visual"></div>

<script>
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
    #${id} .bp-info-panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; min-height: 90px; font-size: 0.85rem; line-height: 1.8; overflow-x: auto; }
    #${id} .bp-info-panel .eq { font-family: 'Courier New', monospace; font-size: 0.82rem; background: #f1f5f9; padding: 6px 10px; border-radius: 5px; margin: 4px 0; display: block; white-space: pre-wrap; }
    #${id} .bp-info-panel b.r { color: #dc2626; } 
    #${id} .bp-info-panel b.b { color: #2563eb; }
    #${id} .bp-info-panel b.g { color: #16a34a; }
    #${id} .bp-info-panel b.o { color: #d97706; }
    #${id} .bp-loss { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    #${id} .bp-loss-track { flex: 1; height: 14px; background: #fee2e2; border-radius: 7px; overflow: hidden; }
    #${id} .bp-loss-fill { height: 100%; background: #ef4444; border-radius: 7px; transition: width 0.3s; }
    @keyframes bpPulse { 0%,100%{stroke-width:2;stroke-opacity:0.3} 50%{stroke-width:7;stroke-opacity:1} }
    #${id} .pulse { animation: bpPulse 0.7s ease-in-out infinite; }
    #${id} .dim { opacity: 0.12; }
  </style>

  <!-- Controls -->
  <div class="bp-top">
    <div class="bp-group"><label>x₁</label><input type="number" data-k="x1" step="0.01"></div>
    <div class="bp-group"><label>x₂</label><input type="number" data-k="x2" step="0.01"></div>
    <div class="bp-group"><label>t₁</label><input type="number" data-k="t1" step="0.01"></div>
    <div class="bp-group"><label>t₂</label><input type="number" data-k="t2" step="0.01"></div>
    <div class="bp-group"><label>η</label><input type="number" data-k="lr" step="0.05" min="0.01" max="5"></div>
    <div class="bp-group"><label>w₁</label><input type="number" data-k="w1" step="0.01"></div>
    <div class="bp-group"><label>w₂</label><input type="number" data-k="w2" step="0.01"></div>
    <div class="bp-group"><label>w₃</label><input type="number" data-k="w3" step="0.01"></div>
    <div class="bp-group"><label>w₄</label><input type="number" data-k="w4" step="0.01"></div>
    <div class="bp-group"><label>b₁</label><input type="number" data-k="b1" step="0.01"></div>
    <div class="bp-group"><label>b₂</label><input type="number" data-k="b2" step="0.01"></div>
    <div class="bp-group"><label>w₅</label><input type="number" data-k="w5" step="0.01"></div>
    <div class="bp-group"><label>w₆</label><input type="number" data-k="w6" step="0.01"></div>
    <div class="bp-group"><label>w₇</label><input type="number" data-k="w7" step="0.01"></div>
    <div class="bp-group"><label>w₈</label><input type="number" data-k="w8" step="0.01"></div>
    <div class="bp-group"><label>b₃</label><input type="number" data-k="b3" step="0.01"></div>
    <div class="bp-group"><label>b₄</label><input type="number" data-k="b4" step="0.01"></div>
    <button class="bp-btn" style="background:#10b981;" id="${id}-apply">✅ Apply 1 Step</button>
    <button class="bp-btn" style="background:#8b5cf6;" id="${id}-train">⟳ Train 100</button>
    <button class="bp-btn" style="background:#64748b;" id="${id}-reset">↺ Reset</button>
  </div>

  <!-- SVG Diagram -->
  <svg id="${id}-svg" width="100%" viewBox="0 0 820 400" style="background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; display:block; margin-bottom:8px;"></svg>

  <!-- Loss bar -->
  <div class="bp-loss">
    <span style="font-size:0.8rem; font-weight:600; color:#475569;">Loss:</span>
    <div class="bp-loss-track"><div class="bp-loss-fill" id="${id}-lossbar"></div></div>
    <span id="${id}-lossval" style="font-size:0.82rem; font-family:monospace; min-width:70px;"></span>
  </div>

  <!-- Info panel -->
  <div class="bp-info-panel" id="${id}-info">
    <span style="color:#94a3b8;">Hover over any neuron or weight label in the diagram to see its full equations here.</span>
  </div>
  `;

  // ── Wire inputs ──
  const inputs = root.querySelectorAll('input[data-k]');
  inputs.forEach(inp => {
    inp.value = S[inp.dataset.k];
    inp.addEventListener('input', () => { S[inp.dataset.k] = parseFloat(inp.value) || 0; recompute(); });
  });
  function syncInputs() {
    inputs.forEach(inp => { inp.value = parseFloat(S[inp.dataset.k]).toFixed(2); });
  }

  // ── Node positions ──
  const nodes = {
    x1:  {x:80,  y:120, label:'x₁', layer:'input'},
    x2:  {x:80,  y:280, label:'x₂', layer:'input'},
    h1:  {x:330, y:120, label:'h₁', layer:'hidden'},
    h2:  {x:330, y:280, label:'h₂', layer:'hidden'},
    o1:  {x:580, y:120, label:'o₁', layer:'output'},
    o2:  {x:580, y:280, label:'o₂', layer:'output'},
    t1:  {x:750, y:120, label:'t₁', layer:'target'},
    t2:  {x:750, y:280, label:'t₂', layer:'target'},
  };

  // ── Connections: [from, to, weight_key, label] ──
  const conns = [
    ['x1','h1','w1','w₁'], ['x2','h1','w2','w₂'],
    ['x1','h2','w3','w₃'], ['x2','h2','w4','w₄'],
    ['h1','o1','w5','w₅'], ['h2','o1','w6','w₆'],
    ['h1','o2','w7','w₇'], ['h2','o2','w8','w₈'],
  ];

  // Which connections are relevant to each node
  const nodeConns = {
    h1: ['w1','w2'],
    h2: ['w3','w4'],
    o1: ['w5','w6'],
    o2: ['w7','w8'],
  };
  // For backward: which output connections carry blame back
  const nodeBackConns = {
    h1: ['w5','w7'],
    h2: ['w6','w8'],
  };

  const svg = document.getElementById(`${id}-svg`);
  const info = document.getElementById(`${id}-info`);
  let R = {}; // computed results

  function recompute() {
    const {x1,x2,t1,t2,lr,w1,w2,w3,w4,b1,b2,w5,w6,w7,w8,b3,b4} = S;

    // Forward
    const zh1 = w1*x1 + w2*x2 + b1;
    const h1 = sig(zh1);
    const zh2 = w3*x1 + w4*x2 + b2;
    const h2 = sig(zh2);
    const zo1 = w5*h1 + w6*h2 + b3;
    const o1 = sig(zo1);
    const zo2 = w7*h1 + w8*h2 + b4;
    const o2 = sig(zo2);
    const E1 = 0.5*(t1-o1)**2;
    const E2 = 0.5*(t2-o2)**2;
    const E = E1+E2;

    // Backward
    const dE_do1 = -(t1-o1);
    const do1_dz1 = o1*(1-o1);
    const d_o1 = dE_do1 * do1_dz1;

    const dE_do2 = -(t2-o2);
    const do2_dz2 = o2*(1-o2);
    const d_o2 = dE_do2 * do2_dz2;

    const gw5=d_o1*h1, gw6=d_o1*h2, gb3=d_o1;
    const gw7=d_o2*h1, gw8=d_o2*h2, gb4=d_o2;

    const dE_dh1 = d_o1*w5 + d_o2*w7;
    const d_h1 = dE_dh1 * h1*(1-h1);
    const dE_dh2 = d_o1*w6 + d_o2*w8;
    const d_h2 = dE_dh2 * h2*(1-h2);

    const gw1=d_h1*x1, gw2=d_h1*x2, gb1=d_h1;
    const gw3=d_h2*x1, gw4=d_h2*x2, gb2=d_h2;

    R = {zh1,h1,zh2,h2,zo1,o1,zo2,o2,E1,E2,E,
         dE_do1,do1_dz1,d_o1,dE_do2,do2_dz2,d_o2,
         gw5,gw6,gb3,gw7,gw8,gb4,
         dE_dh1,d_h1,dE_dh2,d_h2,
         gw1,gw2,gb1,gw3,gw4,gb2};

    drawSVG();
    // Loss bar
    document.getElementById(`${id}-lossbar`).style.width = Math.min(E/0.6*100,100)+'%';
    document.getElementById(`${id}-lossval`).textContent = f(E);
  }

  function drawSVG() {
    const {x1,x2,t1,t2} = S;
    let html = '';

    // Draw connections
    conns.forEach(([from,to,wk,wl]) => {
      const a = nodes[from], b = nodes[to];
      const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
      const val = S[wk];
      const thick = Math.max(1, Math.min(5, Math.abs(val)*3));
      const col = val >= 0 ? '#3b82f6' : '#ef4444';
      html += `<line class="bp-conn" data-wk="${wk}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${col}" stroke-width="${thick}" stroke-opacity="0.5"/>`;
      html += `<text class="bp-wlabel" data-wk="${wk}" x="${mx}" y="${my-6}" text-anchor="middle" font-size="11" fill="#334155" font-weight="600" style="cursor:pointer;">${wl}=${f(val,2)}</text>`;
    });

    // Draw error lines
    html += `<line x1="${nodes.o1.x}" y1="${nodes.o1.y}" x2="${nodes.t1.x}" y2="${nodes.t1.y}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,4"/>`;
    html += `<line x1="${nodes.o2.x}" y1="${nodes.o2.y}" x2="${nodes.t2.x}" y2="${nodes.t2.y}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,4"/>`;

    // Draw nodes
    const vals = {
      x1: f(x1,2), x2: f(x2,2),
      h1: f(R.h1), h2: f(R.h2),
      o1: f(R.o1), o2: f(R.o2),
      t1: f(t1,2), t2: f(t2,2),
    };
    const colors = {input:'#64748b', hidden:'#3b82f6', output:'#10b981', target:'#f59e0b'};
    const fills  = {input:'#f1f5f9', hidden:'#eff6ff', output:'#ecfdf5', target:'#fffbeb'};
    const radii  = {input:28, hidden:34, output:34, target:24};

    for (const [nk, nd] of Object.entries(nodes)) {
      const r = radii[nd.layer];
      const col = colors[nd.layer];
      const fill = fills[nd.layer];
      html += `<circle class="bp-node" data-nk="${nk}" cx="${nd.x}" cy="${nd.y}" r="${r}" fill="${fill}" stroke="${col}" stroke-width="2.5" style="cursor:pointer;"/>`;
      html += `<text x="${nd.x}" y="${nd.y-8}" text-anchor="middle" font-size="12" font-weight="700" fill="${col}" style="pointer-events:none;">${nd.label}</text>`;
      html += `<text x="${nd.x}" y="${nd.y+10}" text-anchor="middle" font-size="11" font-family="monospace" fill="#1e293b" style="pointer-events:none;">${vals[nk]}</text>`;

      // Show delta below hidden/output nodes
      if (nk === 'h1') html += `<text x="${nd.x}" y="${nd.y+r+14}" text-anchor="middle" font-size="10" fill="#d97706" style="pointer-events:none;">δ=${f(R.d_h1)}</text>`;
      if (nk === 'h2') html += `<text x="${nd.x}" y="${nd.y+r+14}" text-anchor="middle" font-size="10" fill="#d97706" style="pointer-events:none;">δ=${f(R.d_h2)}</text>`;
      if (nk === 'o1') html += `<text x="${nd.x}" y="${nd.y+r+14}" text-anchor="middle" font-size="10" fill="#dc2626" style="pointer-events:none;">δ=${f(R.d_o1)}</text>`;
      if (nk === 'o2') html += `<text x="${nd.x}" y="${nd.y+r+14}" text-anchor="middle" font-size="10" fill="#dc2626" style="pointer-events:none;">δ=${f(R.d_o2)}</text>`;
    }

    // Layer labels
    html += `<text x="80" y="30" text-anchor="middle" font-size="13" fill="#94a3b8" font-weight="600">Input</text>`;
    html += `<text x="330" y="30" text-anchor="middle" font-size="13" fill="#94a3b8" font-weight="600">Hidden</text>`;
    html += `<text x="580" y="30" text-anchor="middle" font-size="13" fill="#94a3b8" font-weight="600">Output</text>`;
    html += `<text x="750" y="30" text-anchor="middle" font-size="13" fill="#94a3b8" font-weight="600">Target</text>`;

    // Loss display
    html += `<text x="665" y="210" text-anchor="middle" font-size="13" fill="#ef4444" font-weight="700">E = ${f(R.E)}</text>`;

    svg.innerHTML = html;

    // ── Hover events on nodes ──
    svg.querySelectorAll('.bp-node').forEach(el => {
      el.addEventListener('mouseenter', () => showNodeInfo(el.dataset.nk));
      el.addEventListener('mouseleave', clearHighlights);
    });
    // ── Hover events on weight labels ──
    svg.querySelectorAll('.bp-wlabel').forEach(el => {
      el.addEventListener('mouseenter', () => showWeightInfo(el.dataset.wk));
      el.addEventListener('mouseleave', clearHighlights);
    });
  }

  function highlightWeights(keys) {
    svg.querySelectorAll('.bp-conn').forEach(el => {
      if (keys.includes(el.dataset.wk)) {
        el.classList.add('pulse');
        el.setAttribute('stroke', '#f59e0b');
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

  function clearHighlights() {
    svg.querySelectorAll('.bp-conn').forEach(el => {
      el.classList.remove('pulse','dim');
      const val = S[el.dataset.wk];
      el.setAttribute('stroke', val >= 0 ? '#3b82f6' : '#ef4444');
    });
    svg.querySelectorAll('.bp-wlabel').forEach(el => el.classList.remove('dim'));
    info.innerHTML = `<span style="color:#94a3b8;">Hover over any neuron or weight label to see equations.</span>`;
  }

  function showNodeInfo(nk) {
    const {x1,x2,t1,t2,w1,w2,w3,w4,b1,b2,w5,w6,w7,w8,b3,b4} = S;
    let h = '';
    if (nk === 'x1') {
      h = `<b>Input x₁ = ${f(x1,2)}</b> — This is a raw input value. No computation here.`;
    } else if (nk === 'x2') {
      h = `<b>Input x₂ = ${f(x2,2)}</b> — This is a raw input value. No computation here.`;
    } else if (nk === 't1') {
      h = `<b>Target t₁ = ${f(t1,2)}</b> — What we want o₁ to output. Error₁ = ½(${f(t1,2)} − ${f(R.o1)})² = <b class="r">${f(R.E1)}</b>`;
    } else if (nk === 't2') {
      h = `<b>Target t₂ = ${f(t2,2)}</b> — What we want o₂ to output. Error₂ = ½(${f(t2,2)} − ${f(R.o2)})² = <b class="r">${f(R.E2)}</b>`;
    } else if (nk === 'h1') {
      highlightWeights(['w1','w2']);
      h = `<b class="b">Hidden neuron h₁</b><br>
<b>Forward (weighted sum → sigmoid):</b>
<span class="eq">z_h₁ = w₁·x₁ + w₂·x₂ + b₁
     = ${f(w1)}×${f(x1)} + ${f(w2)}×${f(x2)} + ${f(b1)}
     = ${f(w1*x1)} + ${f(w2*x2)} + ${f(b1)} = <b class="b">${f(R.zh1)}</b>

h₁ = σ(${f(R.zh1)}) = 1/(1+e^(−${f(R.zh1)})) = <b class="b">${f(R.h1)}</b></span>
<b>Backward (blame from both outputs via w₅ and w₇):</b>
<span class="eq">∂E/∂h₁ = δ_o₁·w₅ + δ_o₂·w₇
        = ${f(R.d_o1)}×${f(w5)} + ${f(R.d_o2)}×${f(w7)}
        = ${f(R.d_o1*w5)} + ${f(R.d_o2*w7)} = <b class="o">${f(R.dE_dh1)}</b>

sigmoid slope = h₁·(1−h₁) = ${f(R.h1)}×${f(1-R.h1)} = ${f(R.h1*(1-R.h1))}

δ_h₁ = ${f(R.dE_dh1)} × ${f(R.h1*(1-R.h1))} = <b class="o">${f(R.d_h1)}</b></span>
<b>Weight gradients:</b>
<span class="eq">∂E/∂w₁ = δ_h₁ × x₁ = ${f(R.d_h1)} × ${f(x1)} = <b class="r">${f(R.gw1)}</b>
∂E/∂w₂ = δ_h₁ × x₂ = ${f(R.d_h1)} × ${f(x2)} = <b class="r">${f(R.gw2)}</b>
∂E/∂b₁ = δ_h₁ × 1  = <b class="r">${f(R.gb1)}</b></span>`;
    } else if (nk === 'h2') {
      highlightWeights(['w3','w4']);
      h = `<b class="b">Hidden neuron h₂</b><br>
<b>Forward:</b>
<span class="eq">z_h₂ = w₃·x₁ + w₄·x₂ + b₂
     = ${f(w3)}×${f(x1)} + ${f(w4)}×${f(x2)} + ${f(b2)}
     = ${f(w3*x1)} + ${f(w4*x2)} + ${f(b2)} = <b class="b">${f(R.zh2)}</b>

h₂ = σ(${f(R.zh2)}) = <b class="b">${f(R.h2)}</b></span>
<b>Backward (blame via w₆ and w₈):</b>
<span class="eq">∂E/∂h₂ = δ_o₁·w₆ + δ_o₂·w₈
        = ${f(R.d_o1)}×${f(w6)} + ${f(R.d_o2)}×${f(w8)}
        = ${f(R.d_o1*w6)} + ${f(R.d_o2*w8)} = <b class="o">${f(R.dE_dh2)}</b>

sigmoid slope = ${f(R.h2)}×${f(1-R.h2)} = ${f(R.h2*(1-R.h2))}

δ_h₂ = ${f(R.dE_dh2)} × ${f(R.h2*(1-R.h2))} = <b class="o">${f(R.d_h2)}</b></span>
<b>Weight gradients:</b>
<span class="eq">∂E/∂w₃ = δ_h₂ × x₁ = ${f(R.d_h2)} × ${f(x1)} = <b class="r">${f(R.gw3)}</b>
∂E/∂w₄ = δ_h₂ × x₂ = ${f(R.d_h2)} × ${f(x2)} = <b class="r">${f(R.gw4)}</b>
∂E/∂b₂ = δ_h₂ × 1  = <b class="r">${f(R.gb2)}</b></span>`;
    } else if (nk === 'o1') {
      highlightWeights(['w5','w6']);
      h = `<b class="g">Output neuron o₁</b> &nbsp; (target t₁ = ${f(t1,2)})<br>
<b>Forward:</b>
<span class="eq">z_o₁ = w₅·h₁ + w₆·h₂ + b₃
     = ${f(w5)}×${f(R.h1)} + ${f(w6)}×${f(R.h2)} + ${f(b3)}
     = ${f(w5*R.h1)} + ${f(w6*R.h2)} + ${f(b3)} = <b class="b">${f(R.zo1)}</b>

o₁ = σ(${f(R.zo1)}) = <b class="g">${f(R.o1)}</b></span>
<b>Backward — the 3 chain-rule terms:</b>
<span class="eq">Term 1 "how wrong?":   ∂E/∂o₁ = −(t₁−o₁) = −(${f(t1,2)}−${f(R.o1)}) = <b class="r">${f(R.dE_do1)}</b>
Term 2 "sigmoid slope": ∂o₁/∂z  = o₁·(1−o₁) = ${f(R.o1)}×${f(1-R.o1)} = <b class="r">${f(R.do1_dz1)}</b>

δ_o₁ = Term1 × Term2 = ${f(R.dE_do1)} × ${f(R.do1_dz1)} = <b class="r">${f(R.d_o1)}</b>
${R.d_o1 > 0 ? '↑ Positive → output is TOO HIGH, needs to decrease' : R.d_o1 < 0 ? '↓ Negative → output is TOO LOW, needs to increase' : '✓ Zero → output is perfect!'}</span>
<b>Weight gradients (δ × "what flowed through"):</b>
<span class="eq">∂E/∂w₅ = δ_o₁ × h₁ = ${f(R.d_o1)} × ${f(R.h1)} = <b class="r">${f(R.gw5)}</b>
∂E/∂w₆ = δ_o₁ × h₂ = ${f(R.d_o1)} × ${f(R.h2)} = <b class="r">${f(R.gw6)}</b>
∂E/∂b₃ = δ_o₁ × 1  = <b class="r">${f(R.gb3)}</b></span>`;
    } else if (nk === 'o2') {
      highlightWeights(['w7','w8']);
      h = `<b class="g">Output neuron o₂</b> &nbsp; (target t₂ = ${f(t2,2)})<br>
<b>Forward:</b>
<span class="eq">z_o₂ = w₇·h₁ + w₈·h₂ + b₄
     = ${f(w7)}×${f(R.h1)} + ${f(w8)}×${f(R.h2)} + ${f(b4)}
     = ${f(w7*R.h1)} + ${f(w8*R.h2)} +
     = ${f(w7*R.h1)} + ${f(w8*R.h2)} + ${f(b4)} = <b class="b">${f(R.zo2)}</b>

o₂ = σ(${f(R.zo2)}) = <b class="g">${f(R.o2)}</b></span>
<b>Backward — the 3 chain-rule terms:</b>
<span class="eq">Term 1 "how wrong?":   ∂E/∂o₂ = −(t₂−o₂) = −(${f(t2,2)}−${f(R.o2)}) = <b class="r">${f(R.dE_do2)}</b>
Term 2 "sigmoid slope": ∂o₂/∂z  = o₂·(1−o₂) = ${f(R.o2)}×${f(1-R.o2)} = <b class="r">${f(R.do2_dz2)}</b>

δ_o₂ = Term1 × Term2 = ${f(R.dE_do2)} × ${f(R.do2_dz2)} = <b class="r">${f(R.d_o2)}</b>
${R.d_o2 > 0 ? '↑ Positive → output is TOO HIGH, needs to decrease' : R.d_o2 < 0 ? '↓ Negative → output is TOO LOW, needs to increase' : '✓ Zero → output is perfect!'}</span>
<b>Weight gradients (δ × "what flowed through"):</b>
<span class="eq">∂E/∂w₇ = δ_o₂ × h₁ = ${f(R.d_o2)} × ${f(R.h1)} = <b class="r">${f(R.gw7)}</b>
∂E/∂w₈ = δ_o₂ × h₂ = ${f(R.d_o2)} × ${f(R.h2)} = <b class="r">${f(R.gw8)}</b>
∂E/∂b₄ = δ_o₂ × 1  = <b class="r">${f(R.gb4)}</b></span>`;
    }
    info.innerHTML = h;
  }

  function showWeightInfo(wk) {
    highlightWeights([wk]);
    const {x1,x2,t1,t2,w1,w2,w3,w4,b1,b2,w5,w6,w7,w8,b3,b4,lr} = S;
    const wVal = S[wk];
    const gradMap = {
      w1: {g:R.gw1, delta:'δ_h₁', dv:f(R.d_h1), inp:'x₁', iv:f(x1), nw:wVal-lr*R.gw1},
      w2: {g:R.gw2, delta:'δ_h₁', dv:f(R.d_h1), inp:'x₂', iv:f(x2), nw:wVal-lr*R.gw2},
      w3: {g:R.gw3, delta:'δ_h₂', dv:f(R.d_h2), inp:'x₁', iv:f(x1), nw:wVal-lr*R.gw3},
      w4: {g:R.gw4, delta:'δ_h₂', dv:f(R.d_h2), inp:'x₂', iv:f(x2), nw:wVal-lr*R.gw4},
      w5: {g:R.gw5, delta:'δ_o₁', dv:f(R.d_o1), inp:'h₁', iv:f(R.h1), nw:wVal-lr*R.gw5},
      w6: {g:R.gw6, delta:'δ_o₁', dv:f(R.d_o1), inp:'h₂', iv:f(R.h2), nw:wVal-lr*R.gw6},
      w7: {g:R.gw7, delta:'δ_o₂', dv:f(R.d_o2), inp:'h₁', iv:f(R.h1), nw:wVal-lr*R.gw7},
      w8: {g:R.gw8, delta:'δ_o₂', dv:f(R.d_o2), inp:'h₂', iv:f(R.h2), nw:wVal-lr*R.gw8},
    };
    const m = gradMap[wk];
    if (!m) return;
    const labels = {w1:'w₁',w2:'w₂',w3:'w₃',w4:'w₄',w5:'w₅',w6:'w₆',w7:'w₇',w8:'w₈'};
    info.innerHTML = `<b>Weight ${labels[wk]} = ${f(wVal)}</b><br>
<span class="eq"><b>Gradient:</b>
∂E/∂${labels[wk]} = ${m.delta} × ${m.inp}
            = ${m.dv} × ${m.iv}
            = <b class="r">${f(m.g)}</b>

<b>Update:</b>
${labels[wk]}_new = ${f(wVal)} − η·${f(m.g)}
         = ${f(wVal)} − ${f(lr)}×${f(m.g)}
         = ${f(wVal)} − ${f(lr*m.g)}
         = <b class="g">${f(m.nw)}</b>  (${m.g > 0 ? '↓ decreases' : m.g < 0 ? '↑ increases' : '— no change'})</span>`;
  }

  // ── Buttons ──
  const defaults = JSON.parse(JSON.stringify(S));

  document.getElementById(`${id}-apply`).addEventListener('click', () => {
    const {lr} = S;
    S.w1 -= lr*R.gw1; S.w2 -= lr*R.gw2; S.w3 -= lr*R.gw3; S.w4 -= lr*R.gw4;
    S.b1 -= lr*R.gb1; S.b2 -= lr*R.gb2;
    S.w5 -= lr*R.gw5; S.w6 -= lr*R.gw6; S.w7 -= lr*R.gw7; S.w8 -= lr*R.gw8;
    S.b3 -= lr*R.gb3; S.b4 -= lr*R.gb4;
    syncInputs();
    recompute();
  });

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
    syncInputs();
    recompute();
    info.innerHTML = `<span style="color:#94a3b8;">Reset to defaults. Hover over any neuron or weight label.</span>`;
  });

  // ── Initial render ──
  recompute();
}

renderBackpropVisual('bp-visual');
</script>


<div class="md">
## What is $\delta$ (delta)? — The Reusable Error Signal

When you hover over neurons in the lab below, you'll see values like $\delta_{o_1}$ or $\delta_{h_1}$. These are **not** a new concept — they are just a **shorthand name** for a product of two things that gets reused many times. Here's exactly what they mean:

### At an output neuron (e.g., $\delta_{o_1}$):

$$
\delta_{o_1} = \underbrace{-(t_1 - o_1)}_{\substack{\text{How wrong is the output?} \\ \text{(derivative of the loss)}}} \times \underbrace{o_1 \cdot (1 - o_1)}_{\substack{\text{How steep is the sigmoid here?} \\ \text{(derivative of the activation)}}}
$$

That's it — **two numbers multiplied together**. The first number says "how far off are we from the target?" and the second says "how sensitive is the sigmoid at this point?" Their product tells us: **if we nudge the input to this neuron by a tiny amount, how much does the total error change?**

**Concrete example** (with default values): $o_1 \approx 0.7514$, target $t_1 = 0.01$:
$$\delta_{o_1} = -(0.01 - 0.7514) \times 0.7514 \times (1 - 0.7514) = 0.7414 \times 0.1868 \approx 0.1385$$

The positive sign means: "the output is **too high** — we need to push it down."

### At a hidden neuron (e.g., $\delta_{h_1}$):

Hidden neurons don't have their own target, so they receive **blame from every output neuron they connect to**, weighted by the connection strength:

$$
\delta_{h_1} = \underbrace{\Big(\delta_{o_1} \cdot w_5 + \delta_{o_2} \cdot w_7\Big)}_{\substack{\text{Total blame arriving at } h_1 \\ \text{from both outputs, weighted} \\ \text{by the connection strengths}}} \times \underbrace{h_1 \cdot (1 - h_1)}_{\substack{\text{Sigmoid slope at } h_1}}
$$

This is the key insight: **the error is distributed proportionally through the same weights that carried the signal forward**. If $w_5$ is large, then $h_1$ contributed a lot to $o_1$'s value, so it receives more blame from $o_1$.

### Why bother giving it a name?

Because $\delta$ gets reused. Once you know $\delta_{o_1}$, you use it to compute the gradient for **every** weight feeding into $o_1$:

$$
\frac{\partial E}{\partial w_5} = \delta_{o_1} \times h_1 \qquad \frac{\partial E}{\partial w_6} = \delta_{o_1} \times h_2 \qquad \frac{\partial E}{\partial b_3} = \delta_{o_1} \times 1
$$

Without the shorthand, you'd have to write out $-(t_1 - o_1) \cdot o_1(1-o_1)$ every single time. The $\delta$ is just a **time-saver**, not a new concept.

## How Each Weight Gradient Is Calculated

Once you have the $\delta$ for a node, the gradient for any weight feeding into that node follows a dead-simple pattern:

$$
\frac{\partial E}{\partial w} = \delta_{\text{node}} \times \text{(whatever value flowed through this weight)}
$$

For output weights, the "value that flowed through" is the hidden neuron's output:
$$\frac{\partial E}{\partial w_5} = \delta_{o_1} \times h_1$$

For hidden weights, the "value that flowed through" is the input:
$$\frac{\partial E}{\partial w_1} = \delta_{h_1} \times x_1$$

For biases, the "value that flowed through" is always 1 (biases have no input multiplier):
$$\frac{\partial E}{\partial b_3} = \delta_{o_1} \times 1 = \delta_{o_1}$$

## Interactive Lab

Below is a complete neural network. Every weight, bias, and intermediate value is visible. Click **"Forward Pass"** to see data flow through the network, then click **"Backward Pass"** to watch the error gradient propagate back through every connection. Finally, click **"Update Weights"** to apply gradient descent.

**Hover over any neuron** to see the exact arithmetic for that node. The weights involved in that calculation will **light up and animate** on the diagram so you can see exactly which connections carry the data.

You can edit any weight, bias, input, target, or learning rate and re-run the process to build intuition.
</div>

<!-- Animation styles for weight highlighting on hover -->
<style>
    @keyframes bp-pulse-flow {
        0%   { stroke-opacity: 0.3; stroke-width: 2; }
        50%  { stroke-opacity: 1.0; stroke-width: 6; }
        100% { stroke-opacity: 0.3; stroke-width: 2; }
    }
    .bp-highlight-line {
        animation: bp-pulse-flow 0.8s ease-in-out infinite;
    }
    @keyframes bp-dash-flow-forward {
        to { stroke-dashoffset: -30; }
    }
    @keyframes bp-dash-flow-backward {
        to { stroke-dashoffset: 30; }
    }
    .bp-flow-forward {
        stroke-dasharray: 12, 6;
        animation: bp-dash-flow-forward 0.5s linear infinite;
    }
    .bp-flow-backward {
        stroke-dasharray: 12, 6;
        animation: bp-dash-flow-backward 0.5s linear infinite;
    }
    .bp-dim-line {
        opacity: 0.15 !important;
        transition: opacity 0.2s ease;
    }
    .bp-connection {
        transition: opacity 0.2s ease, stroke 0.2s ease;
    }
    .bp-weight-label {
        transition: opacity 0.2s ease;
    }
    .bp-dim-label {
        opacity: 0.1 !important;
        transition: opacity 0.2s ease;
    }
</style>

<div id="backprop-lab-container" style="padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; flex-direction: column; gap: 20px; background: #fff;">

    <!-- Controls Row -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
        <div>
            <label><b>Inputs</b></label>
            <div style="display:flex; gap:8px; margin-top:5px;">
                <div>
                    <label style="font-size:0.75rem;">$x_1$</label>
                    <input type="number" id="bp-x1" value="0.05" step="0.01" style="width:70px;" class="bw-cell">
                </div>
                <div>
                    <label style="font-size:0.75rem;">$x_2$</label>
                    <input type="number" id="bp-x2" value="0.10" step="0.01" style="width:70px;" class="bw-cell">
                </div>
            </div>
        </div>
        <div>
            <label><b>Targets</b></label>
            <div style="display:flex; gap:8px; margin-top:5px;">
                <div>
                    <label style="font-size:0.75rem;">$t_1$</label>
                    <input type="number" id="bp-t1" value="0.01" step="0.01" style="width:70px;" class="bw-cell">
                </div>
                <div>
                    <label style="font-size:0.75rem;">$t_2$</label>
                    <input type="number" id="bp-t2" value="0.99" step="0.01" style="width:70px;" class="bw-cell">
                </div>
            </div>
        </div>
        <div>
            <label><b>Learning Rate ($\eta$)</b></label>
            <div style="margin-top:5px;">
                <input type="number" id="bp-lr" value="0.5" step="0.05" min="0.01" max="5" style="width:70px;" class="bw-cell">
            </div>
        </div>
        <div>
            <label><b>Epoch: <span id="bp-epoch-count">0</span></b></label>
            <div style="margin-top:5px; display:flex; gap:6px; flex-wrap:wrap;">
                <button id="bp-btn-forward" class="btn" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;">1. Forward Pass →</button>
                <button id="bp-btn-backward" class="btn" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;" disabled>2. Backward Pass ←</button>
                <button id="bp-btn-update" class="btn" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;" disabled>3. Update Weights</button>
                <button id="bp-btn-auto" class="btn" style="background:#8b5cf6; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;">▶ Auto-Train 100 Epochs</button>
                <button id="bp-btn-reset" class="btn" style="background:#64748b; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;">↺ Reset</button>
            </div>
        </div>
    </div>

    <!-- Network Visualization -->
    <div style="gap: 20px; flex-wrap: wrap; align-items: flex-start;">
        <!-- SVG Network Diagram -->
        <div style="flex: 2; min-width: 450px;">
            <b>Network Diagram</b>
            <div style="font-size:0.75rem; color:#64748b; margin-bottom:8px;">
                <span style="color:#3b82f6;">● Blue = forward signal</span> &nbsp;
                <span style="color:#ef4444;">● Red = backward gradient</span> &nbsp;
                <span style="color:#10b981;">● Green = updated</span> &nbsp;
                <span style="color:#f59e0b;">● Gold pulsing = weights used in hovered calculation</span>
            </div>
            <svg id="bp-network-svg" width="100%" viewBox="0 0 900 560"
                 style="background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
            </svg>
        </div>

        <!-- Weight Editor -->
        <div style="flex: 1; min-width: 250px;">
            <b>Weights & Biases</b>
            <div style="font-size:0.75rem; color:#64748b; margin-bottom:8px;">Edit any value, then re-run forward pass.</div>
            <table id="bp-weight-table" style="width:100%; font-size:0.8rem; border-collapse:collapse;">
                <thead>
                    <tr style="border-bottom:2px solid #e2e8f0;">
                        <th style="text-align:left; padding:4px;">Param</th>
                        <th style="text-align:center; padding:4px;">Value</th>
                        <th style="text-align:center; padding:4px;">$\frac{\partial E}{\partial w}$</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>$w_1$ (x₁→h₁)</td><td><input type="number" id="bp-w1" value="0.15" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw1" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$w_2$ (x₂→h₁)</td><td><input type="number" id="bp-w2" value="0.20" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw2" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$w_3$ (x₁→h₂)</td><td><input type="number" id="bp-w3" value="0.25" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw3" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$w_4$ (x₂→h₂)</td><td><input type="number" id="bp-w4" value="0.30" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw4" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr style="border-top:1px solid #e2e8f0;"><td>$b_1$ (h₁ bias)</td><td><input type="number" id="bp-b1" value="0.35" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gb1" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$b_2$ (h₂ bias)</td><td><input type="number" id="bp-b2" value="0.35" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gb2" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr style="border-top:2px solid #e2e8f0;"><td>$w_5$ (h₁→o₁)</td><td><input type="number" id="bp-w5" value="0.40" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw5" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$w_6$ (h₂→o₁)</td><td><input type="number" id="bp-w6" value="0.45" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw6" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$w_7$ (h₁→o₂)</td><td><input type="number" id="bp-w7" value="0.50" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw7" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$w_8$ (h₂→o₂)</td><td><input type="number" id="bp-w8" value="0.55" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gw8" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr style="border-top:1px solid #e2e8f0;"><td>$b_3$ (o₁ bias)</td><td><input type="number" id="bp-b3" value="0.60" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gb3" style="font-family:monospace; text-align:center;">—</td></tr>
                    <tr><td>$b_4$ (o₂ bias)</td><td><input type="number" id="bp-b4" value="0.60" step="0.01" style="width:65px;" class="bw-cell"></td><td id="bp-gb4" style="font-family:monospace; text-align:center;">—</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Math Step-by-Step Display -->
    <div id="bp-math-display" style="padding: 24px; background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1px solid #cbd5e0; border-radius: 10px; font-size: 1.0rem; overflow-x: auto; min-height: 120px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.04);">
        <span style="color:#94a3b8; font-style:italic;">Click "Forward Pass" to begin. Every computation will be shown here step by step.</span>
    </div>

    <!-- Detailed Walkthrough Panel (new) -->
    <details id="bp-detailed-walkthrough" style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 0;">
        <summary style="padding: 14px 18px; cursor: pointer; font-weight: bold; background: #f8fafc; border-radius: 10px; user-select: none;">
            📖 Show Detailed Hand-Calculation Walkthrough (every single multiplication)
        </summary>
        <div id="bp-detailed-content" class="md" style="padding: 18px; font-size: 0.95rem; line-height: 2.0;">
            <span style="color:#94a3b8; font-style:italic;">Run a forward pass first, then expand this to see every single arithmetic step written out so you can verify with a calculator.</span>
        </div>
    </details>

    <!-- Loss Chart -->
    <div>
        <b>Loss Over Time</b>
        <div id="bp-loss-chart" style="width:100%; height:250px;"></div>
    </div>
</div>

<div class="md" style="margin-top: 30px;">
## What to Watch For

1. **Forward Pass:** Watch the blue signals propagate left-to-right. Each neuron computes a weighted sum, adds a bias, and applies the sigmoid. The final outputs $o_1$ and $o_2$ are compared to the targets to compute the total error.

2. **Backward Pass:** Watch the red gradient signals flow right-to-left. Starting from the loss, each connection receives a gradient computed via the chain rule. Notice how the gradient at each weight is the product of three terms: the upstream error, the local activation derivative, and the input that fed into that weight.

3. **Hover over any neuron:** The weights involved in that neuron's calculation will **pulse gold** on the diagram. During the forward pass, you'll see the incoming weights light up. During the backward pass, you'll see both the incoming weights (that carried the signal forward) and the outgoing weights (that carry the error backward). This makes it visually obvious which connections are involved in each calculation.

4. **Weight Update:** Each weight is nudged in the direction that reduces the error: $w_{\text{new}} = w_{\text{old}} - \eta \cdot \frac{\partial E}{\partial w}$. After updating, run another forward pass to see the loss decrease.

5. **Auto-Train:** Click "Auto-Train 100 Epochs" to watch the loss curve drop. The network will learn to map $(0.05, 0.10)$ to $(0.01, 0.99)$ — watch the outputs converge toward the targets.

6. **Experiment:** Try changing the learning rate. Too high ($> 2$) and the network may overshoot and diverge. Too low ($< 0.01$) and learning is painfully slow. Try changing the initial weights to see how different starting points affect convergence.

## The Full Chain Rule, Expanded — Every Single Step

### For an output-layer weight (e.g., $w_5$ connecting $h_1$ to $o_1$):

We want $\frac{\partial E}{\partial w_5}$. The chain rule says: trace the path from $E$ back to $w_5$ and multiply the derivatives along the way.

**Link 1:** How does $E$ change when $o_1$ changes?
$$\frac{\partial E}{\partial o_1} = \frac{\partial}{\partial o_1}\left[\frac{1}{2}(t_1 - o_1)^2\right] = -(t_1 - o_1)$$

**Link 2:** How does $o_1$ change when $z_{o_1}$ changes? (sigmoid derivative)
$$\frac{\partial o_1}{\partial z_{o_1}} = o_1 \cdot (1 - o_1)$$

**Link 3:** How does $z_{o_1}$ change when $w_5$ changes?
$$\frac{\partial z_{o_1}}{\partial w_5} = h_1 \quad \text{(because } z_{o_1} = w_5 \cdot h_1 + w_6 \cdot h_2 + b_3\text{)}$$

**Multiply all three links together:**
$$\frac{\partial E}{\partial w_5} = \underbrace{-(t_1 - o_1)}_{\text{Link 1}} \cdot \underbrace{o_1(1 - o_1)}_{\text{Link 2}} \cdot \underbrace{h_1}_{\text{Link 3}}$$

**Notice:** Links 1 and 2 together are exactly $\delta_{o_1}$! So:
$$\frac{\partial E}{\partial w_5} = \delta_{o_1} \cdot h_1$$

### For a hidden-layer weight (e.g., $w_1$ connecting $x_1$ to $h_1$):

This is harder because $h_1$ affects **both** $o_1$ and $o_2$, so the error flows back through **two paths**:

**Path A** (through $o_1$): $E \to o_1 \to z_{o_1} \to h_1$
$$\frac{\partial E}{\partial h_1}\bigg|_{\text{via }o_1} = \delta_{o_1} \cdot w_5$$

**Path B** (through $o_2$): $E \to o_2 \to z_{o_2} \to h_1$
$$\frac{\partial E}{\partial h_1}\bigg|_{\text{via }o_2} = \delta_{o_2} \cdot w_7$$

**Total error arriving at $h_1$** (add both paths):
$$\frac{\partial E}{\partial h_1} = \delta_{o_1} \cdot w_5 + \delta_{o_2} \cdot w_7$$

**Then continue the chain through $h_1$'s sigmoid and down to $w_1$:**
$$\frac{\partial E}{\partial w_1} = \underbrace{\left( \delta_{o_1} \cdot w_5 + \delta_{o_2} \cdot w_7 \right)}_{\text{total error at } h_1} \cdot \underbrace{h_1(1 - h_1)}_{\text{sigmoid derivative at } h_1} \cdot \underbrace{x_1}_{\text{input through } w_1}$$

Again, the first two factors together are $\delta_{h_1}$:
$$\frac{\partial E}{\partial w_1} = \delta_{h_1} \cdot x_1$$

## Summary of the $\delta$ Pattern

| Symbol | What it equals | In plain English |
|---|---|---|
| $\delta_{o_1}$ | $-(t_1 - o_1) \times o_1(1-o_1)$ | "How wrong is $o_1$?" × "How steep is the sigmoid at $o_1$?" |
| $\delta_{o_2}$ | $-(t_2 - o_2) \times o_2(1-o_2)$ | Same thing for $o_2$ |
| $\delta_{h_1}$ | $(\delta_{o_1} \cdot w_5 + \delta_{o_2} \cdot w_7) \times h_1(1-h_1)$ | "Total blame from both outputs" × "sigmoid slope at $h_1$" |
| $\delta_{h_2}$ | $(\delta_{o_1} \cdot w_6 + \delta_{o_2} \cdot w_8) \times h_2(1-h_2)$ | "Total blame from both outputs" × "sigmoid slope at $h_2$" |
| $\frac{\partial E}{\partial w}$ | $\delta_{\text{node}} \times \text{input through this weight}$ | "Error signal at the node" × "what flowed through this weight" |
| $w^+ = w - \eta \cdot \frac{\partial E}{\partial w}$ | | "Nudge the weight to reduce the error" |
</div>
