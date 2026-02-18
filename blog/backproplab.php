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

<div id="backprop-interactive"></div>

<script>
function renderBackpropSliders(containerId) {
  const root = document.getElementById(containerId);
  if (!root) return;

  // ── Sigmoid helper ──
  const sig = z => 1 / (1 + Math.exp(-z));

  // ── State ──
  const S = {
    x1: 0.05, x2: 0.10,
    t1: 0.01, t2: 0.99,
    lr: 0.5,
    w1: 0.15, w2: 0.20, w3: 0.25, w4: 0.30,
    b1: 0.35, b2: 0.35,
    w5: 0.40, w6: 0.45, w7: 0.50, w8: 0.55,
    b3: 0.60, b4: 0.60
  };

  // ── Build HTML ──
  root.innerHTML = `
  <style>
    #${containerId} { font-family: system-ui, -apple-system, sans-serif; max-width: 960px; }
    #${containerId} .bp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; }
    #${containerId} .bp-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
    #${containerId} .bp-card h3 { margin: 0 0 10px 0; font-size: 0.95rem; color: #334155; }
    #${containerId} .bp-slider-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 0.85rem; }
    #${containerId} .bp-slider-row label { min-width: 28px; font-weight: 600; color: #475569; }
    #${containerId} .bp-slider-row input[type=range] { flex: 1; accent-color: #3b82f6; }
    #${containerId} .bp-slider-row .bp-val { min-width: 52px; text-align: right; font-family: monospace; font-size: 0.85rem; color: #1e293b; }
    #${containerId} .bp-results { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 18px; }
    #${containerId} .bp-results h3 { margin: 0 0 12px 0; font-size: 1rem; }
    #${containerId} .bp-section { margin-bottom: 16px; }
    #${containerId} .bp-section h4 { margin: 0 0 6px 0; font-size: 0.9rem; color: #1e40af; border-bottom: 1px solid #dbeafe; padding-bottom: 4px; }
    #${containerId} .bp-eq { font-family: monospace; font-size: 0.85rem; line-height: 1.9; color: #1e293b; padding: 8px 12px; background: #f1f5f9; border-radius: 6px; overflow-x: auto; }
    #${containerId} .bp-eq .bp-hl { color: #dc2626; font-weight: 700; }
    #${containerId} .bp-eq .bp-bl { color: #2563eb; font-weight: 700; }
    #${containerId} .bp-eq .bp-gr { color: #16a34a; font-weight: 700; }
    #${containerId} .bp-eq .bp-or { color: #d97706; font-weight: 700; }
    #${containerId} .bp-loss-bar { height: 24px; border-radius: 4px; transition: width 0.3s ease; }
    #${containerId} .bp-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    #${containerId} .bp-table th, #${containerId} .bp-table td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; }
    #${containerId} .bp-table th { background: #f1f5f9; font-weight: 600; color: #475569; }
    #${containerId} .bp-table td { font-family: monospace; }
    #${containerId} .bp-arrow { font-size: 1.2rem; color: #94a3b8; text-align: center; padding: 4px 0; }
    @media (max-width: 640px) { #${containerId} .bp-grid { grid-template-columns: 1fr; } }
  </style>

  <div class="bp-grid">
    <!-- Inputs & Targets -->
    <div class="bp-card">
      <h3>📥 Inputs & Targets</h3>
      <div class="bp-slider-row"><label>x₁</label><input type="range" min="-2" max="2" step="0.01" data-key="x1"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>x₂</label><input type="range" min="-2" max="2" step="0.01" data-key="x2"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>t₁</label><input type="range" min="0" max="1" step="0.01" data-key="t1"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>t₂</label><input type="range" min="0" max="1" step="0.01" data-key="t2"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>η</label><input type="range" min="0.01" max="5" step="0.01" data-key="lr"><span class="bp-val"></span></div>
    </div>

    <!-- Weights -->
    <div class="bp-card">
      <h3>⚖️ Input→Hidden Weights</h3>
      <div class="bp-slider-row"><label>w₁</label><input type="range" min="-3" max="3" step="0.01" data-key="w1"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>w₂</label><input type="range" min="-3" max="3" step="0.01" data-key="w2"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>w₃</label><input type="range" min="-3" max="3" step="0.01" data-key="w3"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>w₄</label><input type="range" min="-3" max="3" step="0.01" data-key="w4"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>b₁</label><input type="range" min="-3" max="3" step="0.01" data-key="b1"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>b₂</label><input type="range" min="-3" max="3" step="0.01" data-key="b2"><span class="bp-val"></span></div>
    </div>

    <div class="bp-card">
      <h3>⚖️ Hidden→Output Weights</h3>
      <div class="bp-slider-row"><label>w₅</label><input type="range" min="-3" max="3" step="0.01" data-key="w5"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>w₆</label><input type="range" min="-3" max="3" step="0.01" data-key="w6"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>w₇</label><input type="range" min="-3" max="3" step="0.01" data-key="w7"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>w₈</label><input type="range" min="-3" max="3" step="0.01" data-key="w8"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>b₃</label><input type="range" min="-3" max="3" step="0.01" data-key="b3"><span class="bp-val"></span></div>
      <div class="bp-slider-row"><label>b₄</label><input type="range" min="-3" max="3" step="0.01" data-key="b4"><span class="bp-val"></span></div>
    </div>

    <!-- Mini network diagram (text-based) -->
    <div class="bp-card" style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
      <h3>🔗 Network Shape</h3>
      <pre style="font-size:0.8rem; line-height:1.5; color:#475569; text-align:center;" id="bp-mini-diagram"></pre>
    </div>
  </div>

  <!-- Live Results -->
  <div class="bp-results" id="bp-results-panel"></div>
  `;

  // ── Wire up sliders ──
  const sliders = root.querySelectorAll('input[type=range]');
  sliders.forEach(sl => {
    const key = sl.dataset.key;
    sl.value = S[key];
    sl.nextElementSibling.textContent = Number(S[key]).toFixed(2);
    sl.addEventListener('input', () => {
      S[key] = parseFloat(sl.value);
      sl.nextElementSibling.textContent = S[key].toFixed(2);
      recompute();
    });
  });

  function f(v, d=4) { return Number(v).toFixed(d); }

  function recompute() {
    const { x1, x2, t1, t2, lr, w1, w2, w3, w4, b1, b2, w5, w6, w7, w8, b3, b4 } = S;

    // ═══════════════════════════════════════
    // FORWARD PASS
    // ═══════════════════════════════════════
    const zh1 = w1*x1 + w2*x2 + b1;
    const h1  = sig(zh1);
    const zh2 = w3*x1 + w4*x2 + b2;
    const h2  = sig(zh2);

    const zo1 = w5*h1 + w6*h2 + b3;
    const o1  = sig(zo1);
    const zo2 = w7*h1 + w8*h2 + b4;
    const o2  = sig(zo2);

    const E1 = 0.5*(t1-o1)**2;
    const E2 = 0.5*(t2-o2)**2;
    const E  = E1 + E2;

    // ═══════════════════════════════════════
    // BACKWARD PASS
    // ═══════════════════════════════════════

    // Output deltas
    const dE_do1 = -(t1 - o1);
    const do1_dzo1 = o1*(1-o1);
    const delta_o1 = dE_do1 * do1_dzo1;

    const dE_do2 = -(t2 - o2);
    const do2_dzo2 = o2*(1-o2);
    const delta_o2 = dE_do2 * do2_dzo2;

    // Gradients for output weights
    const gw5 = delta_o1 * h1;
    const gw6 = delta_o1 * h2;
    const gb3 = delta_o1;
    const gw7 = delta_o2 * h1;
    const gw8 = delta_o2 * h2;
    const gb4 = delta_o2;

    // Hidden deltas
    const dE_dh1 = delta_o1*w5 + delta_o2*w7;
    const delta_h1 = dE_dh1 * h1*(1-h1);
    const dE_dh2 = delta_o1*w6 + delta_o2*w8;
    const delta_h2 = dE_dh2 * h2*(1-h2);

    // Gradients for hidden weights
    const gw1 = delta_h1 * x1;
    const gw2 = delta_h1 * x2;
    const gb1_g = delta_h1;
    const gw3 = delta_h2 * x1;
    const gw4 = delta_h2 * x2;
    const gb2_g = delta_h2;

    // Updated weights
    const nw5 = w5 - lr*gw5, nw6 = w6 - lr*gw6, nw7 = w7 - lr*gw7, nw8 = w8 - lr*gw8;
    const nb3 = b3 - lr*gb3, nb4 = b4 - lr*gb4;
    const nw1 = w1 - lr*gw1, nw2 = w2 - lr*gw2, nw3 = w3 - lr*gw3, nw4 = w4 - lr*gw4;
    const nb1 = b1 - lr*gb1_g, nb2 = b2 - lr*gb2_g;

    // ── Mini diagram ──
    root.querySelector('#bp-mini-diagram').textContent =
`  x₁ (${f(x1,2)}) ──w₁──┐          ┌──w₅── o₁ (${f(o1)}) → target ${f(t1,2)}
              ├─ h₁ (${f(h1)}) ─┤
  x₂ (${f(x2,2)}) ──w₂──┘          └──w₇── o₂ (${f(o2)}) → target ${f(t2,2)}
  x₁ (${f(x1,2)}) ──w₃──┐          ┌──w₆──┘
              ├─ h₂ (${f(h2)}) ─┤
  x₂ (${f(x2,2)}) ──w₄──┘          └──w₈──┘`;

    // ── Build results HTML ──
    const panel = root.querySelector('#bp-results-panel');
    panel.innerHTML = `

    <!-- ════════ FORWARD PASS ════════ -->
    <div class="bp-section">
      <h3>➡️ FORWARD PASS</h3>

      <h4>Hidden Neuron h₁</h4>
      <div class="bp-eq">
z<sub>h₁</sub> = w₁·x₁ + w₂·x₂ + b₁<br>
&nbsp;&nbsp;&nbsp;&nbsp; = <span class="bp-bl">${f(w1)}</span> × <span class="bp-bl">${f(x1)}</span> + <span class="bp-bl">${f(w2)}</span> × <span class="bp-bl">${f(x2)}</span> + <span class="bp-bl">${f(b1)}</span><br>
&nbsp;&nbsp;&nbsp;&nbsp; = ${f(w1*x1)} + ${f(w2*x2)} + ${f(b1)}<br>
&nbsp;&nbsp;&nbsp;&nbsp; = <b>${f(zh1)}</b><br><br>
h₁ = σ(${f(zh1)}) = 1 / (1 + e<sup>−${f(zh1)}</sup>) = <b class="bp-bl">${f(h1)}</b>
      </div>

      <h4>Hidden Neuron h₂</h4>
      <div class="bp-eq">
z<sub>h₂</sub> = w₃·x₁ + w₄·x₂ + b₂<br>
&nbsp;&nbsp;&nbsp;&nbsp; = <span class="bp-bl">${f(w3)}</span> × <span class="bp-bl">${f(x1)}</span> + <span class="bp-bl">${f(w4)}</span> × <span class="bp-bl">${f(x2)}</span> + <span class="bp-bl">${f(b2)}</span><br>
&nbsp;&nbsp;&nbsp;&nbsp; = ${f(w3*x1)} + ${f(w4*x2)} + ${f(b2)}<br>
&nbsp;&nbsp;&nbsp;&nbsp; = <b>${f(zh2)}</b><br><br>
h₂ = σ(${f(zh2)}) = <b class="bp-bl">${f(h2)}</b>
      </div>

      <h4>Output Neuron o₁</h4>
      <div class="bp-eq">
z<sub>o₁</sub> = w₅·h₁ + w₆·h₂ + b₃<br>
&nbsp;&nbsp;&nbsp;&nbsp; = <span class="bp-bl">${f(w5)}</span> × <span class="bp-bl">${f(h1)}</span> + <span class="bp-bl">${f(w6)}</span> × <span class="bp-bl">${f(h2)}</span> + <span class="bp-bl">${f(b3)}</span><br>
&nbsp;&nbsp;&nbsp;&nbsp; = ${f(w5*h1)} + ${f(w6*h2)} + ${f(b3)}<br>
&nbsp;&nbsp;&nbsp;&nbsp; = <b>${f(zo1)}</b><br><br>
o₁ = σ(${f(zo1)}) = <b class="bp-bl">${f(o1)}</b> &nbsp;&nbsp; (target = ${f(t1,2)})
      </div>

      <h4>Output Neuron o₂</h4>
      <div class="bp-eq">
z<sub>o₂</sub> = w₇·h₁ + w₈·h₂ + b₄<br>
&nbsp;&nbsp;&nbsp;&nbsp; = <span class="bp-bl">${f(w7)}</span> × <span class="bp-bl">${f(h1)}</span> + <span class="bp-bl">${f(w8)}</span> × <span class="bp-bl">${f(h2)}</span> + <span class="bp-bl">${f(b4)}</span><br>
&nbsp;&nbsp;&nbsp;&nbsp; = ${f(w7*h1)} + ${f(w8*h2)} + ${f(b4)}<br>
&nbsp;&nbsp;&nbsp;&nbsp; = <b>${f(zo2)}</b><br><br>
o₂ = σ(${f(zo2)}) = <b class="bp-bl">${f(o2)}</b> &nbsp;&nbsp; (target = ${f(t2,2)})
      </div>

      <h4>Total Error</h4>
      <div class="bp-eq">
E = ½(t₁ − o₁)² + ½(t₂ − o₂)²<br>
&nbsp; = ½(${f(t1,2)} − ${f(o1)})² + ½(${f(t2,2)} − ${f(o2)})²<br>
&nbsp; = ½ × ${f((t1-o1)**2)} + ½ × ${f((t2-o2)**2)}<br>
&nbsp; = ${f(E1)} + ${f(E2)}<br>
&nbsp; = <b class="bp-hl">${f(E)}</b>
      </div>
      <div style="margin-top:8px;">
        <div style="background:#fee2e2; border-radius:6px; overflow:hidden; height:24px; width:100%;">
          <div class="bp-loss-bar" style="background:#ef4444; width:${Math.min(E/0.6*100,100)}%;"></div>
        </div>
        <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">Loss bar (0 = perfect, ~0.6 = max for these defaults)</div>
      </div>
    </div>

    <div class="bp-arrow">⬇️ Now the error flows BACKWARD ⬇️</div>

    <!-- ════════ BACKWARD PASS ════════ -->
    <div class="bp-section">
      <h3>⬅️ BACKWARD PASS — The Three Terms for Every Weight</h3>

      <h4>δ<sub>o₁</sub> — Error signal at output neuron o₁</h4>
      <div class="bp-eq">
<b>Term 1 (how wrong?):</b> &nbsp; ∂E/∂o₁ = −(t₁ − o₁) = −(${f(t1,2)} − ${f(o1)}) = <span class="bp-hl">${f(dE_do1)}</span><br>
<b>Term 2 (sigmoid slope):</b> &nbsp; ∂o₁/∂z<sub>o₁</sub> = o₁·(1−o₁) = ${f(o1)} × ${f(1-o1)} = <span class="bp-hl">${f(do1_dzo1)}</span><br><br>
<b>δ<sub>o₁</sub></b> = Term1 × Term2 = ${f(dE_do1)} × ${f(do1_dzo1)} = <b class="bp-hl">${f(delta_o1)}</b><br>
<span style="color:#64748b; font-size:0.8rem;">Positive → output is too high. Negative → output is too low.</span>
      </div>

      <h4>δ<sub>o₂</sub> — Error signal at output neuron o₂</h4>
      <div class="bp-eq">
∂E/∂o₂ = −(t₂ − o₂) = −(${f(t2,2)} − ${f(o2)}) = <span class="bp-hl">${f(dE_do2)}</span><br>
∂o₂/∂z<sub>o₂</sub> = o₂·(1−o₂) = ${f(o2)} × ${f(1-o2)} = <span class="bp-hl">${f(do2_dzo2)}</span><br><br>
<b>δ<sub>o₂</sub></b> = ${f(dE_do2)} × ${f(do2_dzo2)} = <b class="bp-hl">${f(delta_o2)}</b>
      </div>

      <h4>Gradients for output-layer weights</h4>
      <div class="bp-eq">
<b>∂E/∂w₅</b> = δ<sub>o₁</sub> × h₁ = ${f(delta_o1)} × ${f(h1)} = <b class="bp-hl">${f(gw5)}</b> &nbsp;&nbsp; <span style="color:#64748b;">(Term 3 = h₁, the value that flowed through w₅)</span><br>
<b>∂E/∂w₆</b> = δ<sub>o₁</sub> × h₂ = ${f(delta_o1)} × ${f(h2)} = <b class="bp-hl">${f(gw6)}</b><br>
<b>∂E/∂b₃</b> = δ<sub>o₁</sub> × 1 &nbsp;= <b class="bp-hl">${f(gb3)}</b> &nbsp;&nbsp; <span style="color:#64748b;">(bias input is always 1)</span><br>
<b>∂E/∂w₇</b> = δ<sub>o₂</sub> × h₁ = ${f(delta_o2)} × ${f(h1)} = <b class="bp-hl">${f(gw7)}</b><br>
<b>∂E/∂w₈</b> = δ<sub>o₂</sub> × h₂ = ${f(delta_o2)} × ${f(h2)} = <b class="bp-hl">${f(gw8)}</b><br>
<b>∂E/∂b₄</b> = δ<sub>o₂</sub> × 1 &nbsp;= <b class="bp-hl">${f(gb4)}</b>
      </div>

      <h4>δ<sub>h₁</sub> — Error signal at hidden neuron h₁ (blame from BOTH outputs)</h4>
      <div class="bp-eq">
<b>Blame from o₁:</b> δ<sub>o₁</sub> × w₅ = ${f(delta_o1)} × ${f(w5)} = ${f(delta_o1*w5)}<br>
<b>Blame from o₂:</b> δ<sub>o₂</sub> × w₇ = ${f(delta_o2)} × ${f(w7)} = ${f(delta_o2*w7)}<br>
<b>Total blame at h₁:</b> ${f(delta_o1*w5)} + ${f(delta_o2*w7)} = <span class="bp-or">${f(dE_dh1)}</span><br><br>
<b>Sigmoid slope at h₁:</b> h₁·(1−h₁) = ${f(h1)} × ${f(1-h1)} = ${f(h1*(1-h1))}<br><br>
<b>δ<sub>h₁</sub></b> = ${f(dE_dh1)} × ${f(h1*(1-h1))} = <b class="bp-or">${f(delta_h1)}</b>
      </div>

      <h4>δ<sub>h₂</sub> — Error signal at hidden neuron h₂</h4>
      <div class="bp-eq">
Blame from o₁: δ<sub>o₁</sub> × w₆ = ${f(delta_o1)} × ${f(w6)} = ${f(delta_o1*w6)}<br>
Blame from o₂: δ<sub>o₂</sub> × w₈ = ${f(delta_o2)} × ${f(w8)} = ${f(delta_o2*w8)}<br>
Total blame: ${f(delta_o1*w6)} + ${f(delta_o2*w8)} = <span class="bp-or">${f(dE_dh2)}</span><br><br>
Sigmoid slope: ${f(h2)} × ${f(1-h2)} = ${f(h2*(1-h2))}<br><br>
<b>δ<sub>h₂</sub></b> = ${f(dE_dh2)} × ${f(h2*(1-h2))} = <b class="bp-or">${f(delta_h2)}</b>
      </div>

      <h4>Gradients for hidden-layer weights</h4>
      <div class="bp-eq">
<b>∂E/∂w₁</b> = δ<sub>h₁</sub> × x₁ = ${f(delta_h1)} × ${f(x1)} = <b class="bp-or">${f(gw1)}</b><br>
<b>∂E/∂w₂</b> = δ<sub>h₁</sub> × x₂ = ${f(delta_h1)} × ${f(x2)} = <b class="bp-or">${f(gw2)}</b><br>
<b>∂E/∂b₁</b> = δ<sub>h₁</sub> × 1 &nbsp;= <b class="bp-or">${f(gb1_g)}</b><br>
<b>∂E/∂w₃</b> = δ<sub>h₂</sub> × x₁ = ${f(delta_h2)} × ${f(x1)} = <b class="bp-or">${f(gw3)}</b><br>
<b>∂E/∂w₄</b> = δ<sub>h₂</sub> × x₂ = ${f(delta_h2)} × ${f(x2)} = <b class="bp-or">${f(gw4)}</b><br>
<b>∂E/∂b₂</b> = δ<sub>h₂</sub> × 1 &nbsp;= <b class="bp-or">${f(gb2_g)}</b>
      </div>
    </div>

    <div class="bp-arrow">⬇️ Apply gradient descent: w_new = w_old − η × gradient ⬇️</div>

    <!-- ════════ WEIGHT UPDATE ════════ -->
    <div class="bp-section">
      <h3>✅ WEIGHT UPDATE (η = ${f(lr,2)})</h3>
      <table class="bp-table">
        <thead>
          <tr><th>Weight</th><th>Old Value</th><th>Gradient</th><th>η × Gradient</th><th>New Value</th><th>Change</th></tr>
        </thead>
        <tbody>
          <tr><td>w₁</td><td>${f(w1)}</td><td>${f(gw1)}</td><td>${f(lr*gw1)}</td><td class="bp-gr">${f(nw1)}</td><td>${f(nw1-w1)}</td></tr>
          <tr><td>w₂</td><td>${f(w2)}</td><td>${f(gw2)}</td><td>${f(lr*gw2)}</td><td class="bp-gr">${f(nw2)}</td><td>${f(nw2-w2)}</td></tr>
          <tr><td>w₃</td><td>${f(w3)}</td><td>${f(gw3)}</td><td>${f(lr*gw3)}</td><td class="bp-gr">${f(nw3)}</td><td>${f(nw3-w3)}</td></tr>
          <tr><td>w₄</td><td>${f(w4)}</td><td>${f(gw4)}</td><td>${f(lr*gw4)}</td><td class="bp-gr">${f(nw4)}</td><td>${f(nw4-w4)}</td></tr>
          <tr style="border-top:1px solid #cbd5e1;"><td>b₁</td><td>${f(b1)}</td><td>${f(gb1_g)}</td><td>${f(lr*gb1_g)}</td><td class="bp-gr">${f(nb1)}</td><td>${f(nb1-b1)}</td></tr>
          <tr><td>b₂</td><td>${f(b2)}</td><td>${f(gb2_g)}</td><td>${f(lr*gb2_g)}</td><td class="bp-gr">${f(nb2)}</td><td>${f(nb2-b2)}</td></tr>
          <tr style="border-top:2px solid #94a3b8;"><td>w₅</td><td>${f(w5)}</td><td>${f(gw5)}</td><td>${f(lr*gw5)}</td><td class="bp-gr">${f(nw5)}</td><td>${f(nw5-w5)}</td></tr>
          <tr><td>w₆</td><td>${f(w6)}</td><td>${f(gw6)}</td><td>${f(lr*gw6)}</td><td class="bp-gr">${f(nw6)}</td><td>${f(nw6-w6)}</td></tr>
          <tr><td>w₇</td><td>${f(w7)}</td><td>${f(gw7)}</td><td>${f(lr*gw7)}</td><td class="bp-gr">${f(nw7)}</td><td>${f(nw7-w7)}</td></tr>
          <tr><td>w₈</td><td>${f(w8)}</td><td>${f(gw8)}</td><td>${f(lr*gw8)}</td><td class="bp-gr">${f(nw8)}</td><td>${f(nw8-w8)}</td></tr>
          <tr style="border-top:1px solid #cbd5e1;"><td>b₃</td><td>${f(b3)}</td><td>${f(gb3)}</td><td>${f(lr*gb3)}</td><td class="bp-gr">${f(nb3)}</td><td>${f(nb3-b3)}</td></tr>
          <tr><td>b₄</td><td>${f(b4)}</td><td>${f(gb4)}</td><td>${f(lr*gb4)}</td><td class="bp-gr">${f(nb4)}</td><td>${f(nb4-b4)}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ════════ APPLY BUTTON ════════ -->
    <div style="text-align:center; margin-top:12px;">
      <button id="bp-apply-btn" style="
        background: linear-gradient(135deg, #10b981, #059669);
        color: white; border: none; padding: 12px 32px;
        border-radius: 8px; font-size: 1rem; font-weight: 700;
        cursor: pointer; box-shadow: 0 2px 8px rgba(16,185,129,0.3);
      ">
        ✅ Apply Updated Weights (set sliders to new values)
      </button>
    </div>
    `;

    // ── Wire up the Apply button ──
    const applyBtn = root.querySelector('#bp-apply-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        S.w1 = nw1; S.w2 = nw2; S.w3 = nw3; S.w4 = nw4;
        S.b1 = nb1; S.b2 = nb2;
        S.w5 = nw5; S.w6 = nw6; S.w7 = nw7; S.w8 = nw8;
        S.b3 = nb3; S.b4 = nb4;

        // Sync sliders back
        sliders.forEach(sl => {
          const key = sl.dataset.key;
          sl.value = S[key];
          sl.nextElementSibling.textContent = S[key].toFixed(2);
        });

        recompute();
      });
    }
  }

  // ── Initial render ──
  recompute();
}

// ── Auto-initialize ──
renderBackpropSliders('backprop-interactive');
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
