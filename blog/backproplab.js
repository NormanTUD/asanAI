// ═══════════════════════════════════════════════════════════════════════════
// backproplab.js — Backprop visualizer with animated signal flow,
// influence cones, and recursively expandable formulas.
// Everything lives inside a single IIFE-scoped module entry point.
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// SECTION 1 — Sigmoid plot with hover tangent (kept from original, tidied)
// ─────────────────────────────────────────────────────────────────────────

function sigmoidPlot(containerId) {
  if (typeof Plotly === "undefined") return console.error("Plotly not loaded");
  const container = document.getElementById(containerId);
  if (!container) return;

  const sig = z => 1 / (1 + Math.exp(-z));
  const dsig = z => { const s = sig(z); return s * (1 - s); };

  const N = 500, zMin = -10, zMax = 10;
  const zs = [], ss = [], ds = [];
  for (let i = 0; i <= N; i++) {
    const z = zMin + (zMax - zMin) * i / N;
    zs.push(z); ss.push(sig(z)); ds.push(dsig(z));
  }

  const traces = [
    { x: zs, y: ss, mode: "lines", name: "σ(z)",
      line: { color: "#2E86AB", width: 3 }, hoverinfo: "none" },
    { x: zs, y: ds, mode: "lines", name: "σ'(z)",
      line: { color: "#e74c3c", width: 2, dash: "dot" }, hoverinfo: "none" }
  ];
  const layout = {
    title: { text: "Sigmoid and its derivative", font: { size: 17 } },
    xaxis: { title: "z", range: [zMin, zMax], gridcolor: "#E5E5E5", zeroline: true },
    yaxis: { title: "value", range: [-0.15, 1.15], gridcolor: "#E5E5E5", zeroline: true },
    plot_bgcolor: "white", paper_bgcolor: "white", hovermode: false,
    showlegend: true,
    legend: { x: 0.01, y: 0.99, bgcolor: "rgba(255,255,255,0.85)", bordercolor: "#ccc", borderwidth: 1 },
    margin: { t: 50, b: 60, l: 55, r: 20 }
  };
  Plotly.newPlot(container, traces, layout,
    { displayModeBar: false, responsive: true, staticPlot: true }
  ).then(() => attachTangentOverlay(container, sig, dsig, zMin, zMax));
}

function attachTangentOverlay(container, sig, dsig, zMin, zMax) {
  container.style.position = "relative";
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    pointerEvents: "none", zIndex: 1000
  });
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let plot = null;
  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const r = container.getBoundingClientRect();
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const updatePlot = () => {
    const fl = container._fullLayout; if (!fl?.xaxis) return false;
    const xa = fl.xaxis, ya = fl.yaxis;
    plot = {
      left: xa._offset, top: ya._offset, w: xa._length, h: ya._length,
      xMin: xa.range[0], xMax: xa.range[1], yMin: ya.range[0], yMax: ya.range[1]
    };
    return true;
  };
  const d2p = (dx, dy) => plot && ({
    x: plot.left + (dx - plot.xMin) / (plot.xMax - plot.xMin) * plot.w,
    y: plot.top + (1 - (dy - plot.yMin) / (plot.yMax - plot.yMin)) * plot.h
  });
  const p2x = px => plot && plot.xMin + (px - plot.left) / plot.w * (plot.xMax - plot.xMin);

  const clear = () => { const r = container.getBoundingClientRect(); ctx.clearRect(0, 0, r.width, r.height); };
  const draw = z => {
    clear();
    const s = sig(z), m = dsig(z), L = 2.5;
    const p0 = d2p(z - L, s + m * -L), p1 = d2p(z + L, s + m * L), pc = d2p(z, s);
    if (!p0 || !p1 || !pc) return;
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
    ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(pc.x, pc.y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#f59e0b"; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    const label = `z=${z.toFixed(2)}   σ=${s.toFixed(4)}   σ'=${m.toFixed(4)}`;
    ctx.font = "13px monospace";
    const tw = ctx.measureText(label).width;
    let lx = pc.x + 10, ly = pc.y - 18;
    if (ly < plot.top + 20) ly = pc.y + 24;
    ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(lx - 4, ly - 13, tw + 8, 18);
    ctx.strokeStyle = "#cbd5e1"; ctx.strokeRect(lx - 4, ly - 13, tw + 8, 18);
    ctx.fillStyle = "#334155"; ctx.fillText(label, lx, ly);
  };

  resize(); updatePlot();
  window.addEventListener("resize", () => { resize(); setTimeout(updatePlot, 100); });

  let raf = null, mx = null, my = null;
  container.style.pointerEvents = "all";
  container.addEventListener("mousemove", e => {
    mx = e.clientX; my = e.clientY;
    if (!raf) raf = requestAnimationFrame(() => {
      raf = null; if (!plot) updatePlot(); if (!plot) return;
      const r = container.getBoundingClientRect();
      const px = mx - r.left, py = my - r.top;
      if (px < plot.left || px > plot.left + plot.w || py < plot.top || py > plot.top + plot.h) return clear();
      const z = p2x(px); if (z == null || z < zMin || z > zMax) return clear();
      draw(z);
    });
  });
  container.addEventListener("mouseleave", () => { mx = my = null; clear(); });
}


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 — Backprop visualizer (main event)
// Everything in one IIFE-scoped function; nothing leaks to window.
// ═══════════════════════════════════════════════════════════════════════════

function renderBackpropVisual(rootId) {
  const root = document.getElementById(rootId);
  if (!root) return;

  // ── UNIQUE PREFIX so nothing collides with other widgets on the page ──
  const uid = rootId + "-" + Math.random().toString(36).slice(2, 7);

  // ── NETWORK TOPOLOGY ────────────────────────────────────────────────
  // Layer sizes: 3 inputs → 4 hidden → 4 hidden → 2 outputs.
  const LAYERS = [3, 4, 4, 2];
  const L = LAYERS.length;

  // Node id scheme: layer index l ∈ [0..L-1], neuron index i ∈ [0..LAYERS[l]-1]
  // Weight id scheme: `w_l_i_j` = weight from layer (l-1) neuron j → layer l neuron i
  // Bias id scheme:   `b_l_i`   = bias of layer l neuron i (only for l ≥ 1)

  const nodeId = (l, i) => `n_${l}_${i}`;
  const weightId = (l, i, j) => `w_${l}_${i}_${j}`;
  const biasId = (l, i) => `b_${l}_${i}`;


  // ── STATE: all weights, biases, inputs, targets, hyperparams ──────────
  // Deterministic init so reset always returns to a known scene.
  function initState() {
    const S = { lr: 0.5 };
    // Inputs
    for (let i = 0; i < LAYERS[0]; i++) S[`x_${i}`] = [0.05, 0.10, 0.15][i];
    // Targets (only for output layer)
    for (let i = 0; i < LAYERS[L - 1]; i++) S[`t_${i}`] = [0.01, 0.99][i];
    // Weights + biases — pseudo-random but seeded
    let seed = 1;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let l = 1; l < L; l++) {
      for (let i = 0; i < LAYERS[l]; i++) {
        S[biasId(l, i)] = 0.35;
        for (let j = 0; j < LAYERS[l - 1]; j++) {
          S[weightId(l, i, j)] = +(rand() * 0.6 - 0.15).toFixed(3);
        }
      }
    }
    return S;
  }
  let S = initState();
  const defaults = JSON.parse(JSON.stringify(S));

  // ── COMPUTATION: forward + backward, pure function of state ──────────
  function forward(state) {
    const sig = z => 1 / (1 + Math.exp(-z));
    const a = []; // a[l][i] = activation of neuron i in layer l
    const z = []; // z[l][i] = pre-activation
    a.push(Array.from({ length: LAYERS[0] }, (_, i) => state[`x_${i}`]));
    z.push(a[0].slice()); // input "pre-activation" = input itself
    for (let l = 1; l < L; l++) {
      const zl = [], al = [];
      for (let i = 0; i < LAYERS[l]; i++) {
        let s = state[biasId(l, i)];
        for (let j = 0; j < LAYERS[l - 1]; j++) s += state[weightId(l, i, j)] * a[l - 1][j];
        zl.push(s); al.push(sig(s));
      }
      z.push(zl); a.push(al);
    }
    // Loss
    let E = 0, perOutput = [];
    for (let i = 0; i < LAYERS[L - 1]; i++) {
      const e = 0.5 * (state[`t_${i}`] - a[L - 1][i]) ** 2;
      perOutput.push(e); E += e;
    }
    return { a, z, E, perOutput };
  }

  function backward(state, fwd) {
    const { a, z } = fwd;
    const delta = new Array(L);
    // Output layer delta
    delta[L - 1] = [];
    for (let i = 0; i < LAYERS[L - 1]; i++) {
      const o = a[L - 1][i], t = state[`t_${i}`];
      delta[L - 1].push(-(t - o) * o * (1 - o));
    }
    // Hidden layers, right → left
    for (let l = L - 2; l >= 1; l--) {
      delta[l] = [];
      for (let j = 0; j < LAYERS[l]; j++) {
        let s = 0;
        for (let i = 0; i < LAYERS[l + 1]; i++) s += state[weightId(l + 1, i, j)] * delta[l + 1][i];
        const h = a[l][j];
        delta[l].push(s * h * (1 - h));
      }
    }
    delta[0] = new Array(LAYERS[0]).fill(0);
    // Weight & bias gradients
    const grads = {};
    for (let l = 1; l < L; l++) {
      for (let i = 0; i < LAYERS[l]; i++) {
        grads[biasId(l, i)] = delta[l][i];
        for (let j = 0; j < LAYERS[l - 1]; j++) {
          grads[weightId(l, i, j)] = delta[l][i] * a[l - 1][j];
        }
      }
    }
    return { delta, grads };
  }

  let R = null; // { a, z, E, perOutput, delta, grads }
  // What is actually painted on the SVG. Normally mirrors R, but during a
  // pulse animation we hold it on the previous values and reveal R layer
  // by layer as the wave arrives, so numbers visibly change on arrival.
  let dispA = null, dispDelta = null;
  function recompute() {
    const fwd = forward(S);
    const bwd = backward(S, fwd);
    R = { ...fwd, ...bwd };
    dispA = R.a.map(r => r.slice());
    dispDelta = R.delta.map(r => r.slice());
  }

  function applyGradients() {
    for (const k in R.grads) S[k] -= S.lr * R.grads[k];
  }


  // ── GEOMETRY: positions of every neuron in the SVG ────────────────────
  const SVG_W = 900, SVG_H = 460;
  const layerX = l => 100 + l * ((SVG_W - 180) / (L - 1));
  const neuronY = (l, i) => {
    const n = LAYERS[l];
    const gap = (SVG_H - 80) / Math.max(n, 1);
    return 60 + gap * (i + 0.5);
  };
  const neuronR = l => (l === 0 || l === L - 1) ? 26 : 22;

  const layerColor = l =>
    l === 0 ? "#64748b" :
    l === L - 1 ? "#10b981" :
    "#3b82f6";


  // ── HTML SHELL ────────────────────────────────────────────────────────
  root.innerHTML = buildShell(uid);
  const svg = document.getElementById(`${uid}-svg`);
  const infoPanel = document.getElementById(`${uid}-info`);
  const lossBar = document.getElementById(`${uid}-lossbar`);
  const lossVal = document.getElementById(`${uid}-lossval`);
  const inputsBox = document.getElementById(`${uid}-inputs`);
  const targetsBox = document.getElementById(`${uid}-targets`);
  const hpBox = document.getElementById(`${uid}-hp`);

  // Build editable input & target fields dynamically
  function buildIOFields() {
    inputsBox.innerHTML = "";
    for (let i = 0; i < LAYERS[0]; i++) {
      const div = document.createElement("div");
      div.className = "bp-io-field";
      div.innerHTML = `<label>$x_{${i + 1}}$</label>
        <input type="range" min="0" max="1" step="0.01" data-k="x_${i}" value="${S[`x_${i}`]}">
        <input type="number" step="0.01" data-k="x_${i}" value="${S[`x_${i}`]}" class="bp-num">`;
      inputsBox.appendChild(div);
    }
    targetsBox.innerHTML = "";
    for (let i = 0; i < LAYERS[L - 1]; i++) {
      const div = document.createElement("div");
      div.className = "bp-io-field";
      div.innerHTML = `<label>$t_{${i + 1}}$</label>
        <input type="range" min="0" max="1" step="0.01" data-k="t_${i}" value="${S[`t_${i}`]}">
        <input type="number" step="0.01" data-k="t_${i}" value="${S[`t_${i}`]}" class="bp-num">`;
      targetsBox.appendChild(div);
    }
    hpBox.innerHTML = `<div class="bp-io-field">
      <label>$\\eta$ (learning rate)</label>
      <input type="range" min="0.01" max="3" step="0.01" data-k="lr" value="${S.lr}">
      <input type="number" step="0.05" data-k="lr" value="${S.lr}" class="bp-num">
    </div>`;
    // Wire all inputs
    root.querySelectorAll("input[data-k]").forEach(inp => {
      inp.addEventListener("input", e => {
        const k = e.target.dataset.k;
        const v = parseFloat(e.target.value);
        if (isNaN(v)) return;
        S[k] = v;
        // sync sibling (range↔number)
        root.querySelectorAll(`input[data-k="${k}"]`).forEach(o => {
          if (o !== e.target) o.value = v;
        });
        recompute();
        redraw();
        if (activeSelection) refreshInfoPanel();
      });
    });
  }

  function syncIOFields() {
    root.querySelectorAll("input[data-k]").forEach(inp => {
      const k = inp.dataset.k;
      if (S[k] !== undefined) inp.value = +(+S[k]).toFixed(4);
    });
  }


  // ── FORMULA REGISTRY: click-to-expand ────────────────────────────────
  // Each formula is a template with "slots" that reference *other* formulas
  // by symbol. When the user clicks a symbol, we substitute the definition.

  // A formula definition returns { latex, slots }
  // slots is a map symbol → { defId, args } describing how to expand.
  //
  // We render into HTML with <span class="bp-sym" data-def="..."> around
  // each expandable symbol. Clicking toggles substitution.

  function fmt(v, d = 4) {
    if (v === undefined || v === null || isNaN(v)) return "?";
    if (Math.abs(v) < 1e-4 && v !== 0) return v.toExponential(2);
    return (+v).toFixed(d);
  }

  function texToHtml(el, s, display) {
    if (!el) return;
    try {
      if (window.temml && temml.renderToString) {
        el.innerHTML = temml.renderToString(s, { displayMode: !!display });
      } else {
        el.textContent = s;
      }
    } catch (e) {
      el.textContent = s;
    }
  }

  const U = (tex, label) => `\\underbrace{${tex}}_{\\text{${label}}}`;
  const col = v => `\\textcolor{#059669}{${fmt(v)}}`;

  // A more disciplined symbol system: symbols are objects with a "kind"
  const Sym = {
    x:     (i)       => ({ kind: "x", i, id: `x_${i}` }),
    z:     (l, i)    => ({ kind: "z", l, i, id: `z_${l}_${i}` }),
    a:     (l, i)    => ({ kind: "a", l, i, id: `a_${l}_${i}` }),
    w:     (l, i, j) => ({ kind: "w", l, i, j, id: `w_${l}_${i}_${j}` }),
    b:     (l, i)    => ({ kind: "b", l, i, id: `b_${l}_${i}` }),
    delta: (l, i)    => ({ kind: "d", l, i, id: `delta_${l}_${i}` }),
    E:     ()        => ({ kind: "E", id: `E` }),
    grad:  (l, i, j) => ({ kind: "g", l, i, j, id: `g_${l}_${i}_${j}` }),
  };

  // Render a symbol as clickable LaTeX (wrapped in HTML span for click).
  // Note: because we embed HTML around LaTeX, we render LaTeX ourselves
  // per-symbol via KaTeX-style substitution, but for simplicity we emit
  // "raw LaTeX + click handlers layered via character positions." The
  // simplest reliable approach: render the whole formula as HTML with
  // small LaTeX fragments per span, so temml renders each fragment.

  function symLatex(s) {
    switch (s.kind) {
      case "x": return `x_{${s.i + 1}}`;
      case "z": return s.l === L - 1
        ? `z^{(o)}_{${s.i + 1}}`
        : `z^{(${s.l})}_{${s.i + 1}}`;
      case "a": return s.l === 0
        ? `x_{${s.i + 1}}`
        : s.l === L - 1
          ? `o_{${s.i + 1}}`
          : `h^{(${s.l})}_{${s.i + 1}}`;
      case "w": return `w^{(${s.l})}_{${s.i + 1},${s.j + 1}}`;
      case "b": return s.l === L - 1
        ? `b^{(o)}_{${s.i + 1}}`
        : `b^{(${s.l})}_{${s.i + 1}}`;
      case "d": return s.l === L - 1
        ? `\\delta^{(o)}_{${s.i + 1}}`
        : `\\delta^{(${s.l})}_{${s.i + 1}}`;
      case "E": return `E`;
      case "g": return `\\tfrac{\\partial E}{\\partial ${symLatex(Sym.w(s.l, s.i, s.j))}}`;
    }
    return "?";
  }

  // Global expansion state for the current selection (statement keys).
  let expanded = new Set();

  // ── Selection state ──────────────────────────────────────────────────
  let activeSelection = null; // { type: "neuron"|"weight"|"bias", ...ids }
  let hoverKey = null;

  // ── Info panel builders ──────────────────────────────────────────────
  // Each statement = one self-contained LaTeX fragment (so \left/\right and
  // nested underbraces always stay paired) plus a title of mixed text/tex.
  function buildNeuronStatements(l, i, pathPrefix) {
    const stmts = [];
    if (l === 0) {
      stmts.push({
        key: `${pathPrefix}/x`,
        title: [{ t: "text", s: "Input value" }],
        tex: `${U(`x_{${i + 1}}`, "input")} \\;=\\; ${col(S[`x_${i}`])}`
      });
      return stmts;
    }
    const m = LAYERS[l - 1];
    const zL = symLatex(Sym.z(l, i));
    const aL = symLatex(Sym.a(l, i));
    const dL = symLatex(Sym.delta(l, i));
    const bL = symLatex(Sym.b(l, i));

    // ① pre-activation: z = [weighted sum] + [bias]
    {
      const terms = [];
      for (let j = 0; j < m; j++) {
        const w = symLatex(Sym.w(l, i, j)), h = symLatex(Sym.a(l - 1, j));
        terms.push(j === 0 ? `${U(w, "weight")}\\,${U(h, "activation")}` : `${w}\\,${h}`);
      }
      stmts.push({
        key: `${pathPrefix}/z`,
        title: [{ t: "text", s: "① Forward — pre-activation " }, { t: "tex", s: zL }],
        tex: `${U(zL, "pre-activation")} \\;=\\; ${U(terms.join(" \\;+\\; "), "weighted sum")} \\;+\\; ${U(bL, "bias")} \\;=\\; ${col(R.z[l][i])}`
      });
    }

    // ② activation: a = σ(z); expandable to the raw sigmoid
    stmts.push({
      key: `${pathPrefix}/a`,
      title: [{ t: "text", s: "② Forward — activation " }, { t: "tex", s: aL }],
      tex: `${U(aL, "activation")} \\;=\\; \\sigma\\!\\left( ${U(zL, "pre-activation")} \\right) \\;=\\; ${col(R.a[l][i])}`,
      defTex: `${U(aL, "activation")} \\;=\\; \\frac{1}{1 + e^{-${zL}}} \\;=\\; ${col(R.a[l][i])}`
    });

    // ③ error signal δ (full chain-rule form shown inline)
    {
      let rhs;
      if (l === L - 1) {
        const oL = symLatex(Sym.a(L - 1, i));
        rhs = `-\\,${U(`t_{${i + 1}} - ${oL}`, "target − output")} \\;\\cdot\\; ${U(`${oL}\\left(1-${oL}\\right)`, "σ′(z)")}`;
      } else {
        const terms = [];
        for (let k = 0; k < LAYERS[l + 1]; k++)
          terms.push(`${symLatex(Sym.w(l + 1, k, i))}\\,${symLatex(Sym.delta(l + 1, k))}`);
        rhs = `${U(`\\left(${terms.join(" + ")}\\right)`, "error from above")} \\;\\cdot\\; ${U(`${aL}\\left(1-${aL}\\right)`, "σ′(z)")}`;
      }
      stmts.push({
        key: `${pathPrefix}/d`,
        title: [{ t: "text", s: "③ Backward — error signal " }, { t: "tex", s: dL }],
        tex: `${U(dL, "error signal")} \\;=\\; ${rhs} \\;=\\; ${col(R.delta[l][i])}`
      });
    }

    // ④ gradient for each incoming weight
    for (let j = 0; j < m; j++) {
      const wL = symLatex(Sym.w(l, i, j));
      const hL = symLatex(Sym.a(l - 1, j));
      stmts.push({
        key: `${pathPrefix}/g${j}`,
        title: [{ t: "text", s: "④ Gradient for weight " }, { t: "tex", s: wL }],
        tex: `${U(`\\tfrac{\\partial E}{\\partial ${wL}}`, "gradient")} \\;=\\; ${U(dL, "error signal")} \\;\\cdot\\; ${U(hL, "sender activation")} \\;=\\; ${col(R.grads[weightId(l, i, j)])}`
      });
    }

    // ⑤ update for each incoming weight
    for (let j = 0; j < m; j++) {
      const wL = symLatex(Sym.w(l, i, j));
      const wv = S[weightId(l, i, j)];
      const gv = R.grads[weightId(l, i, j)];
      const nw = wv - S.lr * gv;
      stmts.push({
        key: `${pathPrefix}/u${j}`,
        title: [{ t: "text", s: "⑤ Update " }, { t: "tex", s: wL }],
        tex: `${U(wL, "weight")} \\;\\leftarrow\\; ${U(fmt(wv), "current")} \\;-\\; ${U(`${fmt(S.lr)}\\;\\times\\;${fmt(gv)}`, "η · gradient")} \\;=\\; ${col(nw)}`
      });
    }
    return stmts;
  }

  function buildWeightStatements(l, i, j) {
    const pathPrefix = `w_${l}_${i}_${j}`;
    const wv = S[weightId(l, i, j)];
    const gv = R.grads[weightId(l, i, j)];
    const wL = symLatex(Sym.w(l, i, j));
    const hL = symLatex(Sym.a(l - 1, j));
    const aL = symLatex(Sym.a(l, i));
    const dL = symLatex(Sym.delta(l, i));
    return [
      {
        key: `${pathPrefix}/conn`,
        title: [{ t: "text", s: "This weight connects" }],
        tex: `${U(hL, "sender activation")} \\;\\longrightarrow\\; ${U(aL, "receiving neuron")}`
      },
      {
        key: `${pathPrefix}/self`,
        title: [{ t: "text", s: "Current value" }],
        tex: `${U(wL, "weight")} \\;=\\; ${col(wv)}`
      },
      {
        key: `${pathPrefix}/g`,
        title: [{ t: "text", s: "Gradient for " }, { t: "tex", s: wL }],
        tex: `${U(`\\tfrac{\\partial E}{\\partial ${wL}}`, "gradient")} \\;=\\; ${U(dL, "error signal")} \\;\\cdot\\; ${U(hL, "sender activation")} \\;=\\; ${col(gv)}`
      },
      {
        key: `${pathPrefix}/u`,
        title: [{ t: "text", s: "Update (one SGD step)" }],
        tex: `${U(wL, "weight")} \\;\\leftarrow\\; ${U(fmt(wv), "current")} \\;-\\; ${U(`${fmt(S.lr)}\\;\\times\\;${fmt(gv)}`, "η · gradient")} \\;=\\; ${col(wv - S.lr * gv)}`
      }
    ];
  }

  function refreshInfoPanel() {
    infoPanel.innerHTML = "";
    if (!activeSelection) {
      infoPanel.innerHTML = `<div style="color:#94a3b8; padding:12px; text-align:center;">
        <b>Click any neuron or weight</b> to see its equations.<br>
        Every quantity carries an <b>underbrace</b> naming what it is.<br>
        Use <b>show definition</b> to unfold a symbol into its own formula.
      </div>`;
      return;
    }
    // Header
    const hdr = document.createElement("div");
    hdr.className = "bp-info-hdr";
    const h4 = document.createElement("h4");
    const addText = s => h4.appendChild(document.createTextNode(s));
    const addMath = tex => { const sp = document.createElement("span"); texToHtml(sp, tex, false); h4.appendChild(sp); };
    if (activeSelection.type === "neuron") {
      const { l, i } = activeSelection;
      if (l === 0) { addText("Input neuron "); addMath(symLatex(Sym.x(i))); }
      else if (l === L - 1) { addText("Output neuron "); addMath(symLatex(Sym.a(L - 1, i))); }
      else { addText("Hidden neuron "); addMath(symLatex(Sym.a(l, i))); addText(` (layer ${l})`); }
    } else {
      const { l, i, j } = activeSelection;
      addText("Weight "); addMath(symLatex(Sym.w(l, i, j)));
    }
    hdr.appendChild(h4);
    const closeBtn = document.createElement("button");
    closeBtn.className = "bp-close";
    closeBtn.textContent = "✕";
    const collapseBtn = document.createElement("button");
    collapseBtn.className = "bp-collapse-all";
    collapseBtn.textContent = "collapse all";
    hdr.appendChild(closeBtn);
    hdr.appendChild(collapseBtn);
    infoPanel.appendChild(hdr);
    hdr.querySelector(".bp-close").addEventListener("click", () => {
      activeSelection = null; expanded.clear(); refreshInfoPanel(); redraw();
    });
    hdr.querySelector(".bp-collapse-all").addEventListener("click", () => {
      expanded.clear(); refreshInfoPanel();
    });

    // Statements
    let stmts;
    if (activeSelection.type === "neuron") {
      const { l, i } = activeSelection;
      stmts = buildNeuronStatements(l, i, `n_${l}_${i}`);
    } else {
      const { l, i, j } = activeSelection;
      stmts = buildWeightStatements(l, i, j);
    }
    stmts.forEach(st => {
      const wrap = document.createElement("div");
      wrap.className = "bp-stmt";
      const t = document.createElement("div");
      t.className = "bp-stmt-title";
      st.title.forEach(seg => {
        if (seg.t === "tex") {
          const sp = document.createElement("span");
          texToHtml(sp, seg.s, false);
          t.appendChild(sp);
        } else {
          const s = document.createElement("span");
          s.className = "bp-stmt-label";
          s.textContent = seg.s;
          t.appendChild(s);
        }
      });
      if (st.defTex) {
        const btn = document.createElement("button");
        btn.className = "bp-expand";
        const open = expanded.has(st.key);
        btn.textContent = open ? "▾ hide definition" : "▸ show definition";
        btn.addEventListener("click", () => {
          if (expanded.has(st.key)) expanded.delete(st.key);
          else expanded.add(st.key);
          refreshInfoPanel();
        });
        t.appendChild(btn);
      }
      wrap.appendChild(t);
      const body = document.createElement("div");
      body.className = "bp-stmt-body";
      texToHtml(body, st.tex, false);
      wrap.appendChild(body);
      if (st.defTex && expanded.has(st.key)) {
        const def = document.createElement("div");
        def.className = "bp-stmt-def";
        texToHtml(def, st.defTex, false);
        wrap.appendChild(def);
      }
      infoPanel.appendChild(wrap);
    });
  }


  // ── SVG RENDERING: the beautiful network ─────────────────────────────
  // Colors we use extensively:
  const C = {
    pos: "#38bdf8",   // positive weight (cyan)
    neg: "#f87171",   // negative weight (red)
    fwd: "#22d3ee",   // forward pulse
    bwd: "#f43f5e",   // backward pulse
    node: "#e2e8f0",
    ring: "#facc15",
    text: "#e5e7eb",
    bg:   "#0b1220",
    grid: "#1e293b",
    hilite:"#facc15",
  };

  // Weight → color+width mapping (signed).
  function weightStyle(w) {
    const a = Math.abs(w);
    const norm = Math.min(1, a / 1.2);           // saturation ramp
    const width = 0.8 + norm * 5.5;              // 0.8 … 6.3 px
    const color = w >= 0 ? C.pos : C.neg;
    const opacity = 0.25 + norm * 0.75;
    return { color, width, opacity };
  }

  // Neuron fill by activation (0..1) → dark→bright ramp on its layer hue.
  function neuronFill(l, a) {
    const base = layerColor(l);
    const t = Math.max(0, Math.min(1, a));       // clamp
    // Blend from dark navy to layer color by activation
    return blendHex("#0f172a", base, 0.15 + 0.85 * t);
  }
  function blendHex(a, b, t) {
    const pa = hexRGB(a), pb = hexRGB(b);
    const r = Math.round(pa[0] + (pb[0]-pa[0])*t);
    const g = Math.round(pa[1] + (pb[1]-pa[1])*t);
    const bl= Math.round(pa[2] + (pb[2]-pa[2])*t);
    return `rgb(${r},${g},${bl})`;
  }
  function hexRGB(h) {
    const s = h.replace("#","");
    return [parseInt(s.slice(0,2),16), parseInt(s.slice(2,4),16), parseInt(s.slice(4,6),16)];
  }

  // Contribution of a weight to a receiving neuron's z: w_{l,i,j} * a_{l-1,j}.
  // Used for the "cone of influence" highlight.
  function contribution(l, i, j) {
    return S[weightId(l, i, j)] * R.a[l-1][j];
  }
  // Contribution of an incoming edge to the *gradient path*: how much of
  // δ_receiver does this edge feed into upstream? For influence-cone we
  // use |w · a| (forward) or |w · δ| (backward), depending on mode.
  function edgeMagnitude(l, i, j, mode) {
    if (mode === "backward") return Math.abs(S[weightId(l, i, j)] * R.delta[l][i]);
    return Math.abs(S[weightId(l, i, j)] * R.a[l-1][j]);
  }


  // ── DRAW: build the entire SVG each recompute ────────────────────────
  function draw() {
    // Precompute for scaling
    const allEdgeMag = [];
    for (let l = 1; l < L; l++)
      for (let i = 0; i < LAYERS[l]; i++)
        for (let j = 0; j < LAYERS[l-1]; j++)
          allEdgeMag.push(edgeMagnitude(l, i, j, "forward"));
    const maxMag = Math.max(1e-9, ...allEdgeMag);

    let out = "";

    // Defs: gradient for pulses + glow filter
    out += `<defs>
      <radialGradient id="${uid}-fwdPulse" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${C.fwd}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${C.fwd}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${uid}-bwdPulse" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${C.bwd}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${C.bwd}" stop-opacity="0"/>
      </radialGradient>
      <filter id="${uid}-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>`;

    // Background
    out += `<rect width="${SVG_W}" height="${SVG_H}" fill="${C.bg}"/>`;

    // Layer captions
    for (let l = 0; l < L; l++) {
      const name = l === 0 ? "Input" : l === L-1 ? "Output" : `Hidden ${l}`;
      out += `<text x="${layerX(l)}" y="24" text-anchor="middle" font-size="12" fill="#94a3b8" font-weight="600" style="letter-spacing:1px;">${name.toUpperCase()}</text>`;
    }

    // ── EDGES ─────────────────────────────────────────────────────────
    for (let l = 1; l < L; l++) {
      for (let i = 0; i < LAYERS[l]; i++) {
        for (let j = 0; j < LAYERS[l-1]; j++) {
          const w  = S[weightId(l, i, j)];
          const st = weightStyle(w);
          const a  = { x: layerX(l-1), y: neuronY(l-1, j) };
          const b  = { x: layerX(l),   y: neuronY(l, i)   };

          // Dim edges not part of active highlight; boost those that are.
          const inHi = isEdgeInHighlight(l, i, j);
          const globalDim = hoverKey && !inHi ? 0.08 : st.opacity;
          const boostedWidth = inHi ? st.width + 1.5 : st.width;

          out += `<line class="${uid}-edge"
            data-edge="${weightId(l,i,j)}"
            x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"
            stroke="${st.color}" stroke-width="${boostedWidth}"
            stroke-opacity="${globalDim}"
            stroke-linecap="round"
            style="cursor:pointer; transition: stroke-opacity 0.25s, stroke-width 0.25s;"/>`;

          // Weight numeric label — only visible when hover/selected involves this edge
          if (inHi) {
            const mx = (a.x + b.x)/2, my = (a.y + b.y)/2 - 6;
            out += `<text x="${mx}" y="${my}" text-anchor="middle" font-size="10"
              font-family="ui-monospace,monospace" fill="${C.hilite}" style="pointer-events:none;">
              ${fmt(w, 3)}</text>`;
          }
        }
      }
    }

    // ── PULSE OVERLAY (animation groups; positions set by animator) ──
    // We create one <circle> per edge for forward pulse and one for backward,
    // hidden by default (r=0). The animator will set r/cx/cy/opacity.
    for (let l = 1; l < L; l++) {
      for (let i = 0; i < LAYERS[l]; i++) {
        for (let j = 0; j < LAYERS[l-1]; j++) {
          const eid = weightId(l, i, j);
          out += `<circle class="${uid}-fpulse" data-e="${eid}" r="0" fill="url(#${uid}-fwdPulse)" pointer-events="none"/>`;
          out += `<circle class="${uid}-bpulse" data-e="${eid}" r="0" fill="url(#${uid}-bwdPulse)" pointer-events="none"/>`;
        }
      }
    }

    // ── NEURONS ───────────────────────────────────────────────────────
    for (let l = 0; l < L; l++) {
      for (let i = 0; i < LAYERS[l]; i++) {
        const cx = layerX(l), cy = neuronY(l, i);
        const r  = neuronR(l);
        const a  = dispA[l][i];
        const d  = dispDelta[l][i] || 0;
        const fill = neuronFill(l, a);
        const isSel = activeSelection?.type === "neuron"
                     && activeSelection.l === l && activeSelection.i === i;
        const isHi  = hoverKey === `neuron:${l}:${i}` || isNeuronInHighlight(l, i);
        const stroke = isSel ? C.hilite : isHi ? "#fef3c7" : "rgba(255,255,255,0.35)";
        const strokeW = isSel ? 3 : isHi ? 2.2 : 1.2;
        // Delta halo (bwd magnitude)
        const dMag = Math.min(1, Math.abs(d) * 4);
        if (dMag > 0.02) {
          out += `<circle class="${uid}-halo" data-l="${l}" data-i="${i}" cx="${cx}" cy="${cy}" r="${r + 6 + dMag*10}"
            fill="none" stroke="${d >= 0 ? C.bwd : "#60a5fa"}"
            stroke-opacity="${0.15 + dMag*0.35}" stroke-width="${1 + dMag*3}"
            pointer-events="none" style="transition: r 0.3s, stroke-opacity 0.3s, stroke-width 0.3s;"/>`;
        }
        // Body
        out += `<circle class="${uid}-neuron" data-l="${l}" data-i="${i}"
          cx="${cx}" cy="${cy}" r="${r}"
          fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"
          style="cursor:pointer; transition: stroke 0.2s, r 0.2s, fill 0.35s;"
          filter="${isSel || isHi ? `url(#${uid}-glow)` : ''}"/>`;
        // Symbol
        out += `<text x="${cx}" y="${cy - 2}" text-anchor="middle"
          font-size="12" font-weight="700" fill="${C.text}" style="pointer-events:none;">
          ${prettyLabel(l, i)}</text>`;
        // Activation numeric
        out += `<text class="${uid}-nval" data-l="${l}" data-i="${i}" x="${cx}" y="${cy + 12}" text-anchor="middle"
          font-size="10" font-family="ui-monospace,monospace"
          fill="rgba(255,255,255,0.85)" style="pointer-events:none;">
          ${fmt(a, 3)}</text>`;
        // Error-signal numeric (hidden + output layers)
        if (l >= 1) {
          out += `<text class="${uid}-dval" data-l="${l}" data-i="${i}" x="${cx}" y="${cy + 24}" text-anchor="middle"
            font-size="9" font-family="ui-monospace,monospace"
            fill="#fca5a5" style="pointer-events:none;">δ ${fmt(d, 4)}</text>`;
        }

        // For output layer: show target + gap
        if (l === L - 1) {
          const t = S[`t_${i}`];
          const gap = t - a;
          out += `<text x="${cx}" y="${cy + r + 14}" text-anchor="middle"
            font-size="10" font-family="ui-monospace,monospace" fill="#fbbf24" style="pointer-events:none;">
            target ${fmt(t,2)}</text>`;
          out += `<text x="${cx}" y="${cy + r + 26}" text-anchor="middle"
            font-size="10" font-family="ui-monospace,monospace"
            fill="${Math.abs(gap) < 0.05 ? '#4ade80' : '#f87171'}" style="pointer-events:none;">
            Δ=${fmt(gap,3)}</text>`;
        }
      }
    }

    svg.innerHTML = out;

    // Update loss bar
    const lossPct = Math.min(100, R.E / 0.6 * 100);
    lossBar.style.width = lossPct + "%";
    lossVal.textContent = fmt(R.E, 5);

    // Wire events on freshly drawn elements
    wireSVGEvents();
  }

  function prettyLabel(l, i) {
    if (l === 0) return `x${i+1}`;
    if (l === L-1) return `o${i+1}`;
    return `h${l},${i+1}`;
  }

  function redraw() { draw(); }

  // ── HIGHLIGHT LOGIC ("cone of influence") ─────────────────────────
  // If hovering a neuron: highlight all edges directly connected AND recursively
  // faded further out, so you see the full receptive field / fan-out.
  // If hovering an edge: highlight just that edge + endpoint neurons.
  function isEdgeInHighlight(l, i, j) {
    if (!hoverKey && !activeSelection) return false;
    const key = hoverKey || (activeSelection.type === "neuron"
      ? `neuron:${activeSelection.l}:${activeSelection.i}`
      : `weight:${activeSelection.l}:${activeSelection.i}:${activeSelection.j}`);
    const [kind, ...rest] = key.split(":").map((x,k) => k===0 ? x : parseInt(x));
    if (kind === "weight") {
      const [wl, wi, wj] = rest;
      return l === wl && i === wi && j === wj;
    }
    if (kind === "neuron") {
      const [nl, ni] = rest;
      // Direct incoming to that neuron
      if (l === nl && i === ni) return true;
      // Direct outgoing from that neuron
      if (l === nl + 1 && j === ni) return true;
      return false;
    }
    return false;
  }
  function isNeuronInHighlight(l, i) {
    if (!hoverKey && !activeSelection) return false;
    const key = hoverKey || (activeSelection.type === "neuron"
      ? `neuron:${activeSelection.l}:${activeSelection.i}`
      : `weight:${activeSelection.l}:${activeSelection.i}:${activeSelection.j}`);
    const parts = key.split(":");
    if (parts[0] === "neuron") {
      const nl = +parts[1], ni = +parts[2];
      if (l === nl && i === ni) return true;
      // sender neurons for that neuron
      if (l === nl - 1) return true;
      // receiver neurons that this neuron feeds
      if (l === nl + 1) return true;
    } else if (parts[0] === "weight") {
      const wl = +parts[1], wi = +parts[2], wj = +parts[3];
      if (l === wl && i === wi) return true;
      if (l === wl - 1 && i === wj) return true;
    }
    return false;
  }

  // ── EVENT WIRING ──────────────────────────────────────────────────
  function wireSVGEvents() {
    svg.querySelectorAll(`.${uid}-neuron`).forEach(el => {
      const l = +el.dataset.l, i = +el.dataset.i;
      el.addEventListener("mouseenter", () => { hoverKey = `neuron:${l}:${i}`; redraw(); });
      el.addEventListener("mouseleave", () => { hoverKey = null; redraw(); });
      el.addEventListener("click", e => {
        e.stopPropagation();
        if (activeSelection?.type === "neuron" && activeSelection.l === l && activeSelection.i === i) {
          activeSelection = null;
        } else {
          activeSelection = { type: "neuron", l, i };
          expanded.clear();
        }
        refreshInfoPanel();
        redraw();
      });
    });
    svg.querySelectorAll(`.${uid}-edge`).forEach(el => {
      const [, l, i, j] = el.dataset.edge.split("_").map((x,k) => k===0 ? x : +x);
      el.addEventListener("mouseenter", () => { hoverKey = `weight:${l}:${i}:${j}`; redraw(); });
      el.addEventListener("mouseleave", () => { hoverKey = null; redraw(); });
      el.addEventListener("click", e => {
        e.stopPropagation();
        if (activeSelection?.type === "weight"
            && activeSelection.l === l && activeSelection.i === i && activeSelection.j === j) {
          activeSelection = null;
        } else {
          activeSelection = { type: "weight", l, i, j };
          expanded.clear();
        }
        refreshInfoPanel();
        redraw();
      });
    });
    svg.addEventListener("click", e => {
      if (e.target === svg) { activeSelection = null; refreshInfoPanel(); redraw(); }
    });
  }


  // ── ANIMATION: forward + backward pulses along every edge ────────
  // Uses requestAnimationFrame. Each edge has one pulse that travels
  // 0→1 (forward) or 1→0 (backward). Layers are staggered so pulses
  // arrive at layer ℓ+1 just as the previous wave completes.

  let animTok = 0;
  function animatePulses(direction, done) {
    animTok++;
    const myTok = animTok;
    const perLayerMs = 750;
    const start = performance.now();
    const total = perLayerMs * (L - 1);
    const fpulses = svg.querySelectorAll(`.${uid}-fpulse`);
    const bpulses = svg.querySelectorAll(`.${uid}-bpulse`);
    const pulses = direction === "forward" ? fpulses : bpulses;
    const reached = new Set();

    // When the wave front reaches layer l, snap that layer's displayed values
    // (activation label + fill, error label + halo) to the freshly computed
    // ones and give the neurons a brief glow — so values change on arrival.
    function revealLayer(l) {
      if (reached.has(l)) return;
      reached.add(l);
      dispA[l] = R.a[l].slice();
      dispDelta[l] = R.delta[l].slice();
      for (let i = 0; i < LAYERS[l]; i++) {
        const circle = svg.querySelector(`.${uid}-neuron[data-l="${l}"][data-i="${i}"]`);
        const valT = svg.querySelector(`.${uid}-nval[data-l="${l}"][data-i="${i}"]`);
        const dT = svg.querySelector(`.${uid}-dval[data-l="${l}"][data-i="${i}"]`);
        const halo = svg.querySelector(`.${uid}-halo[data-l="${l}"][data-i="${i}"]`);
        if (circle) {
          circle.setAttribute("fill", neuronFill(l, dispA[l][i]));
          circle.setAttribute("filter", `url(#${uid}-glow)`);
        }
        if (valT) valT.textContent = fmt(dispA[l][i], 3);
        if (dT) dT.textContent = `δ ${fmt(dispDelta[l][i], 4)}`;
        if (halo) {
          const dm = Math.min(1, Math.abs(dispDelta[l][i]) * 4);
          halo.setAttribute("r", neuronR(l) + 6 + dm * 10);
          halo.setAttribute("stroke-opacity", 0.15 + dm * 0.35);
          halo.setAttribute("stroke-width", 1 + dm * 3);
          halo.setAttribute("stroke", dispDelta[l][i] >= 0 ? C.bwd : "#60a5fa");
        }
      }
    }
    function revealUpTo(t) {
      if (direction === "forward") {
        for (let l = 1; l < L; l++) if (t >= l * perLayerMs) revealLayer(l);
      } else {
        for (let l = L - 1; l >= 1; l--) if (t >= (L - 1 - l) * perLayerMs) revealLayer(l);
      }
    }

    function frame(now) {
      if (myTok !== animTok) return; // cancelled by newer animation
      const t = (now - start);
      revealUpTo(t);
      pulses.forEach(p => {
        const [, l, i, j] = p.dataset.e.split("_").map((x,k)=>k===0?x:+x);
        const layerStart = direction === "forward"
          ? (l - 1) * perLayerMs
          : (L - 1 - l) * perLayerMs;
        const localT = (t - layerStart) / perLayerMs;
        if (localT < 0 || localT > 1) {
          p.setAttribute("r", 0);
          return;
        }
        const a = { x: layerX(l-1), y: neuronY(l-1, j) };
        const b = { x: layerX(l),   y: neuronY(l, i)   };
        const u = direction === "forward" ? localT : (1 - localT);
        const cx = a.x + (b.x - a.x) * u;
        const cy = a.y + (b.y - a.y) * u;
        const mag = direction === "forward"
          ? Math.abs(S[weightId(l,i,j)] * R.a[l-1][j])
          : Math.abs(S[weightId(l,i,j)] * R.delta[l][i]);
        const rr = 3 + Math.min(14, mag * 30);
        p.setAttribute("cx", cx);
        p.setAttribute("cy", cy);
        p.setAttribute("r", rr);
        p.setAttribute("opacity", Math.sin(localT * Math.PI));
      });
      if (t < total + perLayerMs) requestAnimationFrame(frame);
      else {
        pulses.forEach(p => p.setAttribute("r", 0));
        if (direction === "forward") for (let l = 1; l < L; l++) revealLayer(l);
        else for (let l = L - 1; l >= 1; l--) revealLayer(l);
        draw();
        if (done) done();
      }
    }
    requestAnimationFrame(frame);
  }


  // ── CONTROL BUTTONS ──────────────────────────────────────────────
  document.getElementById(`${uid}-btn-fwd`).addEventListener("click", () => {
    const prevA = dispA.map(r => r.slice());
    const prevD = dispDelta.map(r => r.slice());
    recompute();
    dispA = prevA; dispDelta = prevD;   // hold previous values, reveal on arrival
    draw();
    animatePulses("forward");
  });
  document.getElementById(`${uid}-btn-bwd`).addEventListener("click", () => {
    const prevD = dispDelta.map(r => r.slice());
    recompute();
    dispDelta = prevD;                  // hold previous error signals, reveal on arrival
    draw();
    animatePulses("backward");
  });
  document.getElementById(`${uid}-btn-step`).addEventListener("click", () => {
    const prevA = dispA.map(r => r.slice());
    const prevD = dispDelta.map(r => r.slice());
    applyGradients();          // weights change first, so the waves below carry new values
    recompute();               // forward/backward with the updated weights
    dispA = prevA; dispDelta = prevD;
    draw();
    animatePulses("forward", () => {
      animatePulses("backward", () => {
        syncIOFields();
        redraw();
        if (activeSelection) refreshInfoPanel();
      });
    });
  });
  document.getElementById(`${uid}-btn-train`).addEventListener("click", () => {
    for (let k = 0; k < 100; k++) { recompute(); applyGradients(); }
    syncIOFields();
    recompute();
    redraw();
    if (activeSelection) refreshInfoPanel();
  });
  document.getElementById(`${uid}-btn-reset`).addEventListener("click", () => {
    S = JSON.parse(JSON.stringify(defaults));
    activeSelection = null;
    expanded.clear();
    syncIOFields();
    recompute();
    redraw();
    refreshInfoPanel();
  });


  // ── BOOT ─────────────────────────────────────────────────────────
  buildIOFields();
  recompute();
  draw();
  refreshInfoPanel();
  // Kick off with a gentle forward pulse so the user sees signal immediately
  setTimeout(() => animatePulses("forward"), 400);


  // ═════════════════════════════════════════════════════════════════
  // SHELL HTML — the styled container the whole widget lives inside
  // ═════════════════════════════════════════════════════════════════
  function buildShell(uid) {
    return `
    <style>
      #${uid}-wrap { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
      #${uid}-wrap * { box-sizing: border-box; }
       #${uid}-layout {
         display: grid;
         grid-template-columns: 1fr;
         gap: 14px;
         margin: 10px 0 6px;
       }


      #${uid}-canvas {
        background: #0b1220;
        border-radius: 14px;
        border: 1px solid #1e293b;
        overflow: hidden;
        box-shadow: 0 12px 40px -12px rgba(0,0,0,0.35);
      }
      #${uid}-svg { display: block; width: 100%; height: auto; }

      #${uid}-info {
        background: #0b1220;
        color: #e5e7eb;
        border: 1px solid #1e293b;
        border-radius: 14px;
        padding: 14px 16px;
        max-height: 620px;
        overflow-y: auto;
        font-size: 0.92rem;
        line-height: 1.7;
      }
      #${uid}-info::-webkit-scrollbar { width: 8px; }
      #${uid}-info::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

      #${uid}-info .bp-info-hdr {
        display: flex; align-items: center; gap: 8px;
        border-bottom: 1px solid #1e293b; padding-bottom: 10px; margin-bottom: 10px;
        position: sticky; top: -14px; background: #0b1220; z-index: 3; padding-top: 4px;
      }
      #${uid}-info .bp-info-hdr h4 { margin: 0; font-size: 1.05rem; flex: 1; color: #facc15; }
      #${uid}-info .bp-close,
      #${uid}-info .bp-collapse-all {
        background: #1e293b; color: #e2e8f0; border: none;
        padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.75rem;
      }
      #${uid}-info .bp-close:hover, #${uid}-info .bp-collapse-all:hover { background: #334155; }

       #${uid}-info .bp-stmt {
         border-left: 3px solid #22d3ee;
         padding: 6px 0 6px 10px;
         margin: 14px 0;
       }
       #${uid}-info .bp-stmt-title {
         display: flex; align-items: center; gap: 8px;
         font-size: 0.85rem;
         margin-bottom: 6px;
       }
       #${uid}-info .bp-stmt-label {
         font-size: 0.7rem;
         text-transform: uppercase;
         letter-spacing: 1px;
         color: #94a3b8;
       }
       #${uid}-info .bp-stmt-body {
         display: block;
         overflow-x: auto;
         padding: 2px 2px 6px;
         font-size: 1.02rem;
         line-height: 2.1;
       }
       #${uid}-info .bp-stmt-body::-webkit-scrollbar { height: 6px; }
       #${uid}-info .bp-stmt-body::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
       #${uid}-info .bp-stmt-def {
         margin: 6px 0 2px 8px;
         padding: 6px 12px;
         border-left: 2px dashed #facc15;
         background: rgba(250, 204, 21, 0.06);
         border-radius: 4px;
         overflow-x: auto;
         font-size: 1.02rem;
         line-height: 2.1;
       }
       #${uid}-info .bp-expand {
         margin-left: auto;
         background: #1e293b; color: #7dd3fc; border: none;
         padding: 3px 9px; border-radius: 5px; cursor: pointer;
         font-size: 0.7rem; letter-spacing: 0; text-transform: none;
         flex: none;
       }
       #${uid}-info .bp-expand:hover { background: #334155; }

      #${uid}-controls {
        display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
        margin: 10px 0 4px;
      }
      #${uid}-controls button {
        border: none; border-radius: 8px; padding: 8px 14px;
        font-weight: 700; font-size: 0.82rem; cursor: pointer;
        color: white; transition: transform 0.1s, filter 0.15s;
      }
      #${uid}-controls button:hover { filter: brightness(1.1); }
      #${uid}-controls button:active { transform: translateY(1px); }
      .bp-btn-fwd   { background: linear-gradient(135deg, #0891b2, #22d3ee); }
      .bp-btn-bwd   { background: linear-gradient(135deg, #be123c, #f43f5e); }
      .bp-btn-step  { background: linear-gradient(135deg, #059669, #10b981); }
      .bp-btn-train { background: linear-gradient(135deg, #7c3aed, #a855f7); }
      .bp-btn-reset { background: linear-gradient(135deg, #475569, #64748b); }

      #${uid}-loss-wrap {
        display: flex; align-items: center; gap: 10px; margin-top: 8px;
        font-family: ui-monospace, monospace; font-size: 0.85rem;
      }
      #${uid}-loss-track {
        flex: 1; height: 14px; background: #1e293b;
        border-radius: 7px; overflow: hidden;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
      }
      #${uid}-lossbar {
        height: 100%; width: 0;
        background: linear-gradient(90deg, #10b981, #facc15, #f43f5e);
        border-radius: 7px;
        transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      }
      #${uid}-lossval { min-width: 90px; color: #fbbf24; font-weight: 700; }

      #${uid}-io {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
        margin-top: 12px;
      }
      @media (max-width: 700px) { #${uid}-io { grid-template-columns: 1fr; } }
      #${uid}-io fieldset {
        border: 1px solid #1e293b;
        border-radius: 10px;
        padding: 8px 12px 10px;
        background: rgba(30, 41, 59, 0.15);
      }
      #${uid}-io legend {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #94a3b8;
        padding: 0 6px;
        font-weight: 700;
      }
      .bp-io-field {
        display: grid;
        grid-template-columns: 60px 1fr 64px;
        align-items: center;
        gap: 6px;
        margin: 4px 0;
      }
      .bp-io-field label { font-size: 0.85rem; color: #cbd5e1; }
      .bp-io-field input[type=range] { width: 100%; accent-color: #22d3ee; }
      .bp-io-field input.bp-num {
        width: 60px;
        padding: 3px 5px;
        border: 1px solid #334155;
        background: #0f172a;
        color: #e2e8f0;
        border-radius: 5px;
        font-family: ui-monospace, monospace;
        font-size: 0.78rem;
        text-align: right;
      }

      #${uid}-legend {
        display: flex; flex-wrap: wrap; gap: 14px;
        margin-top: 8px;
        font-size: 0.72rem; color: #94a3b8;
      }
      #${uid}-legend .lg-swatch {
        display: inline-block; width: 14px; height: 6px;
        border-radius: 2px; vertical-align: middle; margin-right: 4px;
      }
    </style>

    <div id="${uid}-wrap">

      <div id="${uid}-controls">
        <button class="bp-btn-fwd"   id="${uid}-btn-fwd">▶ Forward pass</button>
        <button class="bp-btn-bwd"   id="${uid}-btn-bwd">◀ Backward pass</button>
        <button class="bp-btn-step"  id="${uid}-btn-step" title="Apply one gradient step, then watch the new values flow through">✓ Full step</button>
        <button class="bp-btn-train" id="${uid}-btn-train">↻ Train 100</button>
        <button class="bp-btn-reset" id="${uid}-btn-reset">↺ Reset</button>
      </div>

      <div id="${uid}-loss-wrap">
        <span>Loss E =</span>
        <span id="${uid}-lossval">–</span>
        <div id="${uid}-loss-track"><div id="${uid}-lossbar"></div></div>
      </div>

      <div id="${uid}-layout">
        <div id="${uid}-canvas">
          <svg id="${uid}-svg" viewBox="0 0 ${SVG_W} ${SVG_H}" preserveAspectRatio="xMidYMid meet"></svg>
        </div>
        <div id="${uid}-info"></div>
      </div>

      <div id="${uid}-legend">
        <span><span class="lg-swatch" style="background:#38bdf8;"></span>positive weight</span>
        <span><span class="lg-swatch" style="background:#f87171;"></span>negative weight</span>
        <span><span class="lg-swatch" style="background:#22d3ee;"></span>forward signal pulse</span>
        <span><span class="lg-swatch" style="background:#f43f5e;"></span>backward error pulse</span>
        <span><span class="lg-swatch" style="background:#facc15;"></span>selected / highlighted</span>
        <span>neuron brightness ∝ activation • halo ring ∝ |δ|</span>
      </div>

      <div id="${uid}-io">
        <fieldset>
          <legend>Inputs x</legend>
          <div id="${uid}-inputs"></div>
        </fieldset>
        <fieldset>
          <legend>Targets t</legend>
          <div id="${uid}-targets"></div>
        </fieldset>
        <fieldset>
          <legend>Hyperparameters</legend>
          <div id="${uid}-hp"></div>
        </fieldset>
      </div>

    </div>
    `;
  }

} // ── end renderBackpropVisual ──────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3 — Module entry point (called by course loader)
// ═══════════════════════════════════════════════════════════════════════════

async function loadBackproplabModule() {
  sigmoidPlot("sigmoid-plot");
  renderBackpropVisual("bp-visual");
}
