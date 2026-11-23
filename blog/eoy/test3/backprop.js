(function () {
  "use strict";

  var svg = document.getElementById("bp-net");
  var table = document.getElementById("bp-table");
  var readout = document.getElementById("bp-readout");
  var controls = document.getElementById("bp-controls");
  var examplesEl = document.getElementById("bp-examples");
  var lossCanvas = document.getElementById("bp-loss");
  var boundaryCanvas = document.getElementById("bp-boundary");
  var paramNameEl = document.getElementById("bp-param-name");
  var paramSlider = document.getElementById("bp-param-slider");
  var paramValueEl = document.getElementById("bp-param-value");
  var gradAnalytic = document.getElementById("bp-grad-analytic");
  var gradNumeric = document.getElementById("bp-grad-numeric");
  var gradDiff = document.getElementById("bp-grad-diff");
  var gradUpdate = document.getElementById("bp-grad-update");
  var chainEl = document.getElementById("bp-chain");
  var checkEl = document.getElementById("bp-check");
  var stepsEl = document.getElementById("bp-steps");
  var exampleLabel = document.getElementById("bp-example-label");
  var dataLossEl = document.getElementById("bp-data-loss");
  var stage = document.querySelector(".bp-stage");
  if (!svg || !table) return;

  var X = [[0, 0], [0, 1], [1, 0], [1, 1]];
  var T = [0, 1, 1, 0];
  var EPS = 1e-4;
  var INIT = {
    W1: [[-1.615, 1.556], [-0.996, 0.972]],
    b1: [-0.894, 0.368],
    W2: [1.338, -1.464],
    b2: 0.142
  };
  var PARAMS = [
    { id: "W1_00", label: "W1₀₀", kind: "w1", i: 0, j: 0 },
    { id: "W1_01", label: "W1₀₁", kind: "w1", i: 0, j: 1 },
    { id: "W1_10", label: "W1₁₀", kind: "w1", i: 1, j: 0 },
    { id: "W1_11", label: "W1₁₁", kind: "w1", i: 1, j: 1 },
    { id: "b1_0", label: "b1₀", kind: "b1", i: 0 },
    { id: "b1_1", label: "b1₁", kind: "b1", i: 1 },
    { id: "W2_0", label: "W2₀", kind: "w2", i: 0 },
    { id: "W2_1", label: "W2₁", kind: "w2", i: 1 },
    { id: "b2", label: "b2", kind: "b2" }
  ];
  var state = {
    W1: clone(INIT.W1),
    b1: INIT.b1.slice(),
    W2: INIT.W2.slice(),
    b2: INIT.b2,
    lr: 0.3,
    selected: "W1_00",
    example: 0,
    steps: 0,
    history: [],
    timer: 0
  };

  function L(de, en) { return T2.t(de, en); }
  function clone(a) { return a.map(function (row) { return row.slice(); }); }
  function f(z) { return Math.tanh(z); }
  function df(h) { return 1 - h * h; }
  function fmt(v, d) { return Number(v).toFixed(d == null ? 4 : d); }
  function param(id) { return PARAMS.filter(function (p) { return p.id === id; })[0]; }

  function paramValue(id) {
    var p = param(id);
    if (p.kind === "w1") return state.W1[p.i][p.j];
    if (p.kind === "b1") return state.b1[p.i];
    if (p.kind === "w2") return state.W2[p.i];
    return state.b2;
  }
  function setParam(id, v) {
    var p = param(id);
    if (p.kind === "w1") state.W1[p.i][p.j] = v;
    else if (p.kind === "b1") state.b1[p.i] = v;
    else if (p.kind === "w2") state.W2[p.i] = v;
    else state.b2 = v;
  }

  function forwardExample(x) {
    var h0 = f(state.W1[0][0] * x[0] + state.W1[0][1] * x[1] + state.b1[0]);
    var h1 = f(state.W1[1][0] * x[0] + state.W1[1][1] * x[1] + state.b1[1]);
    var y = state.W2[0] * h0 + state.W2[1] * h1 + state.b2;
    return { h: [h0, h1], y: y };
  }

  function forwardBatch() {
    var hs = [], ys = [], loss = 0;
    for (var i = 0; i < X.length; i++) {
      var r = forwardExample(X[i]);
      hs.push(r.h);
      ys.push(r.y);
      var e = r.y - T[i];
      loss += e * e;
    }
    return { hs: hs, ys: ys, loss: loss / X.length };
  }

  function lossOnly() {
    var loss = 0;
    for (var i = 0; i < X.length; i++) {
      var y = forwardExample(X[i]).y;
      var e = y - T[i];
      loss += e * e;
    }
    return loss / X.length;
  }

  function gradientsBatch() {
    var gW1 = [[0, 0], [0, 0]], gb1 = [0, 0], gW2 = [0, 0], gb2 = 0;
    var n = X.length;
    for (var k = 0; k < n; k++) {
      var x = X[k], t = T[k];
      var r = forwardExample(x);
      var dy = 2 * (r.y - t) / n;
      gW2[0] += dy * r.h[0];
      gW2[1] += dy * r.h[1];
      gb2 += dy;
      for (var i = 0; i < 2; i++) {
        var dz = dy * state.W2[i] * df(r.h[i]);
        gW1[i][0] += dz * x[0];
        gW1[i][1] += dz * x[1];
        gb1[i] += dz;
      }
    }
    return { gW1: gW1, gb1: gb1, gW2: gW2, gb2: gb2 };
  }

  function analyticGrad(id) {
    var g = gradientsBatch();
    var p = param(id);
    if (p.kind === "w1") return g.gW1[p.i][p.j];
    if (p.kind === "b1") return g.gb1[p.i];
    if (p.kind === "w2") return g.gW2[p.i];
    return g.gb2;
  }

  function numericGrad(id) {
    var old = paramValue(id);
    setParam(id, old + EPS);
    var lp = lossOnly();
    setParam(id, old - EPS);
    var lm = lossOnly();
    setParam(id, old);
    return (lp - lm) / (2 * EPS);
  }

  function computeAll() {
    var forward = forwardBatch();
    var grads = gradientsBatch();
    var numeric = {};
    PARAMS.forEach(function (p) { numeric[p.id] = numericGrad(p.id); });
    return { forward: forward, grads: grads, numeric: numeric, loss: forward.loss };
  }

  function maxDiff(numeric) {
    var mx = 0;
    PARAMS.forEach(function (p) {
      var a = analyticGrad(p.id);
      var d = Math.abs(a - numeric[p.id]);
      if (d > mx) mx = d;
    });
    return mx;
  }

  /* ---------- network drawing ---------- */

  var NS = "http://www.w3.org/2000/svg";
  var NODES = {
    x0: { x: 70, y: 100, label: "x₁", r: 18 },
    x1: { x: 70, y: 240, label: "x₂", r: 18 },
    h0: { x: 288, y: 88, label: "h₁", r: 20 },
    h1: { x: 288, y: 252, label: "h₂", r: 20 },
    y: { x: 495, y: 170, label: "y", r: 22 },
    b10: { x: 168, y: 28, label: "b₁", w: 26, h: 18 },
    b11: { x: 168, y: 312, label: "b₂", w: 26, h: 18 },
    b2: { x: 495, y: 306, label: "b", w: 26, h: 18 }
  };
  var EDGES = [
    { id: "W1_00", a: "x0", b: "h0", kind: "w" },
    { id: "W1_01", a: "x1", b: "h0", kind: "w" },
    { id: "W1_10", a: "x0", b: "h1", kind: "w" },
    { id: "W1_11", a: "x1", b: "h1", kind: "w" },
    { id: "W2_0", a: "h0", b: "y", kind: "w" },
    { id: "W2_1", a: "h1", b: "y", kind: "w" },
    { id: "b1_0", a: "b10", b: "h0", kind: "bias" },
    { id: "b1_1", a: "b11", b: "h1", kind: "bias" },
    { id: "b2", a: "b2", b: "y", kind: "bias" }
  ];

  function svgEl(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function buildNetwork() {
    svg.innerHTML = "";
    EDGES.forEach(function (e) {
      var a = NODES[e.a], b = NODES[e.b];
      var line = svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      line.setAttribute("class", "bp-edge" + (e.kind === "bias" ? " bp-bias-edge" : ""));
      line.setAttribute("data-param", e.id);
      svg.appendChild(line);
    });
    NODES.x0 && [NODES.x0, NODES.x1].forEach(function (n, i) {
      svg.appendChild(svgEl("circle", { cx: n.x, cy: n.y, r: n.r, class: "bp-node", "data-node": "x" + i }));
      var lab = svgEl("text", { x: n.x, y: n.y - 3, class: "bp-node-label" });
      lab.textContent = n.label; svg.appendChild(lab);
      var val = svgEl("text", { x: n.x, y: n.y + 12, class: "bp-node-value", "data-value": "x" + i });
      val.textContent = "0.00"; svg.appendChild(val);
    });
    ["h0", "h1"].forEach(function (key, i) {
      var n = NODES[key];
      svg.appendChild(svgEl("circle", { cx: n.x, cy: n.y, r: n.r, class: "bp-node", "data-node": key }));
      var lab = svgEl("text", { x: n.x, y: n.y - 3, class: "bp-node-label" });
      lab.textContent = n.label; svg.appendChild(lab);
      var val = svgEl("text", { x: n.x, y: n.y + 13, class: "bp-node-value", "data-value": key });
      val.textContent = "0.00"; svg.appendChild(val);
    });
    var y = NODES.y;
    svg.appendChild(svgEl("circle", { cx: y.x, cy: y.y, r: y.r, class: "bp-node out", "data-node": "y" }));
    var yl = svgEl("text", { x: y.x, y: y.y - 3, class: "bp-node-label" });
    yl.textContent = "y"; svg.appendChild(yl);
    var yv = svgEl("text", { x: y.x, y: y.y + 14, class: "bp-node-value", "data-value": "y" });
    yv.textContent = "0.00"; svg.appendChild(yv);
    var target = svgEl("text", { x: y.x, y: y.y + 42, class: "bp-target", id: "bp-target" });
    target.textContent = "t = 0"; svg.appendChild(target);
    ["b10", "b11", "b2"].forEach(function (key) {
      var n = NODES[key];
      svg.appendChild(svgEl("rect", { x: n.x - n.w / 2, y: n.y - n.h / 2, width: n.w, height: n.h, rx: 4, class: "bp-bias", "data-param": key === "b10" ? "b1_0" : key === "b11" ? "b1_1" : "b2" }));
      var lab = svgEl("text", { x: n.x, y: n.y - 2, class: "bp-node-label" });
      lab.textContent = n.label; svg.appendChild(lab);
      var val = svgEl("text", { x: n.x, y: n.y + 11, class: "bp-node-value", "data-value": key });
      val.textContent = "0.00"; svg.appendChild(val);
    });
    var sel = svgEl("text", { x: 0, y: 0, class: "bp-edge-label", id: "bp-edge-sel" });
    svg.appendChild(sel);
    svg.addEventListener("click", function (e) {
      var targetEl = e.target.closest ? e.target.closest("[data-param]") : null;
      if (targetEl) selectParam(targetEl.getAttribute("data-param"));
    });
  }

  function renderNetwork(data) {
    var ex = X[state.example];
    var one = data.forward.hs[state.example];
    var y = data.forward.ys[state.example];
    var vals = {
      x0: ex[0], x1: ex[1], h0: one[0], h1: one[1], y: y,
      b10: state.b1[0], b11: state.b1[1], b2: state.b2
    };
    EDGES.forEach(function (e) {
      var line = svg.querySelector('line[data-param="' + e.id + '"]');
      if (!line) return;
      var w = e.kind === "bias" ? (e.id === "b1_0" ? state.b1[0] : e.id === "b1_1" ? state.b1[1] : state.b2) : paramValue(e.id);
      line.classList.toggle("pos", w >= 0);
      line.classList.toggle("is-selected", state.selected === e.id);
      line.style.strokeWidth = e.kind === "bias" ? (state.selected === e.id ? 2.2 : 1) : (state.selected === e.id ? 3 : Math.min(5, 1 + Math.abs(w) * 1.2));
      line.style.opacity = state.selected === e.id ? 1 : e.kind === "bias" ? 0.45 : 0.62;
    });
    Object.keys(vals).forEach(function (k) {
      var el = svg.querySelector('[data-value="' + k + '"]');
      if (el) {
        el.textContent = Number(vals[k]).toFixed(2);
        el.classList.toggle("is-strong", Math.abs(vals[k]) > 0.5);
      }
    });
    var h0 = svg.querySelector('[data-node="h0"]');
    var h1 = svg.querySelector('[data-node="h1"]');
    if (h0) h0.classList.toggle("act", Math.abs(one[0]) > 0.3);
    if (h1) h1.classList.toggle("act", Math.abs(one[1]) > 0.3);
    var target = document.getElementById("bp-target");
    if (target) target.textContent = "t = " + T[state.example];
    var sel = document.getElementById("bp-edge-sel");
    if (sel) {
      var e = EDGES.filter(function (x) { return x.id === state.selected; })[0];
      if (e) {
        var a = NODES[e.a], b = NODES[e.b];
        sel.setAttribute("x", ((a.x + b.x) / 2).toFixed(1));
        sel.setAttribute("y", ((a.y + b.y) / 2 - 6).toFixed(1));
        sel.textContent = paramValue(e.id).toFixed(3);
      }
    }
    exampleLabel.textContent = L("x = (", "x = (") + ex[0] + ", " + ex[1] + ") · y = " + y.toFixed(3);
  }

  /* ---------- table ---------- */

  function renderTable(data) {
    var maxD = 0;
    var rows = PARAMS.map(function (p) {
      var a = analyticGrad(p.id);
      var n = data.numeric[p.id];
      var d = Math.abs(a - n);
      if (d > maxD) maxD = d;
      var v = paramValue(p.id);
      return '<tr data-param="' + p.id + '" class="' + (state.selected === p.id ? "is-on" : "") + '" tabindex="0">' +
        '<td>' + p.label + '</td>' +
        '<td class="' + (v >= 0 ? "pos" : "neg") + '">' + fmt(v) + '</td>' +
        '<td>' + fmt(a) + '</td>' +
        '<td>' + fmt(n) + '</td>' +
        '<td class="' + (d < 1e-5 ? "ok" : "bad") + '">' + d.toExponential(1) + '</td>' +
      '</tr>';
    }).join("");
    table.innerHTML = '<thead><tr><th>' + L("Parameter", "parameter") + '</th><th>w</th><th>∂L/∂w</th><th>num.</th><th>|Δ|</th></tr></thead><tbody>' + rows + '</tbody>';
    table.querySelectorAll("tr[data-param]").forEach(function (tr) {
      tr.addEventListener("click", function () { selectParam(tr.getAttribute("data-param")); });
      tr.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectParam(tr.getAttribute("data-param")); }
      });
    });
    checkEl.textContent = L("max |Δ| ", "max |Δ| ") + maxD.toExponential(1);
    checkEl.className = "bp-check " + (maxD < 1e-5 ? "ok" : "bad");
  }

  function chainFormula(p) {
    var val = analyticGrad(p.id);
    if (p.kind === "w1") {
      return L(
        "∂L/∂W1ᵢⱼ = (1/4) Σ 2(y−t) · W2ᵢ · (1−hᵢ²) · xⱼ = ",
        "∂L/∂W1ᵢⱼ = (1/4) Σ 2(y−t) · W2ᵢ · (1−hᵢ²) · xⱼ = "
      ) + '<b>' + fmt(val) + '</b>';
    }
    if (p.kind === "b1") {
      return L(
        "∂L/∂b1ᵢ = (1/4) Σ 2(y−t) · W2ᵢ · (1−hᵢ²) = ",
        "∂L/∂b1ᵢ = (1/4) Σ 2(y−t) · W2ᵢ · (1−hᵢ²) = "
      ) + '<b>' + fmt(val) + '</b>';
    }
    if (p.kind === "w2") {
      return L(
        "∂L/∂W2ᵢ = (1/4) Σ 2(y−t) · hᵢ = ",
        "∂L/∂W2ᵢ = (1/4) Σ 2(y−t) · hᵢ = "
      ) + '<b>' + fmt(val) + '</b>';
    }
    return L(
      "∂L/∂b2 = (1/4) Σ 2(y−t) = ",
      "∂L/∂b2 = (1/4) Σ 2(y−t) = "
    ) + '<b>' + fmt(val) + '</b>';
  }

  function renderSelected(data) {
    var p = param(state.selected);
    var v = paramValue(p.id);
    var a = analyticGrad(p.id);
    var n = data.numeric[p.id];
    paramNameEl.textContent = p.label;
    paramSlider.value = String(v);
    paramValueEl.textContent = fmt(v, 3);
    gradAnalytic.textContent = fmt(a);
    gradNumeric.textContent = fmt(n);
    gradDiff.textContent = Math.abs(a - n).toExponential(1);
    gradDiff.className = Math.abs(a - n) < 1e-5 ? "ok" : "bad";
    gradUpdate.textContent = fmt(v - state.lr * a);
    chainEl.innerHTML = chainFormula(p);
  }

  /* ---------- plots ---------- */

  function drawLossCurve() {
    if (!lossCanvas || !lossCanvas.clientHeight) return;
    var box = T2.fit(lossCanvas, lossCanvas);
    var ctx = box.ctx, w = box.w, h = box.h;
    ctx.clearRect(0, 0, w, h);
    var line = "rgba(150,210,230,0.18)";
    var muted = "rgba(143,170,180,0.82)";
    var gold = T2.cssVar("--gold") || "#e3be62";
    var padL = 30, padR = 10, padT = 10, padB = 20;
    var hist = state.history.length ? state.history : [lossOnly()];
    var maxV = Math.max(0.02, Math.max.apply(null, hist));
    function X(i) { return padL + (hist.length === 1 ? 0 : i / (hist.length - 1)) * (w - padL - padR); }
    function Y(v) { return h - padB - (v / maxV) * (h - padT - padB); }
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    for (var g = 0; g <= 2; g++) {
      var yy = padT + (h - padT - padB) * g / 2;
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(w - padR, yy); ctx.stroke();
    }
    ctx.beginPath();
    hist.forEach(function (v, i) { if (i === 0) ctx.moveTo(X(i), Y(v)); else ctx.lineTo(X(i), Y(v)); });
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    var last = hist.length - 1;
    ctx.beginPath(); ctx.arc(X(last), Y(hist[last]), 3.2, 0, Math.PI * 2); ctx.fillStyle = gold; ctx.fill();
    ctx.fillStyle = muted;
    ctx.font = '600 9px "Open Sans", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(maxV.toFixed(2), 4, padT + 4);
    ctx.fillText("0", 4, h - padB + 3);
    ctx.textAlign = "right";
    ctx.fillText(String(Math.max(0, state.steps)), w - padR, h - 5);
    stepsEl.textContent = L("Schritt ", "step ") + state.steps;
  }

  function drawBoundary(data) {
    if (!boundaryCanvas || !boundaryCanvas.clientHeight) return;
    var box = T2.fit(boundaryCanvas, boundaryCanvas);
    var ctx = box.ctx, w = box.w, h = box.h;
    ctx.clearRect(0, 0, w, h);
    var pad = 22;
    var gw = 26, gh = 18;
    for (var gy = 0; gy < gh; gy++) {
      for (var gx = 0; gx < gw; gx++) {
        var x0 = gx / (gw - 1), x1 = 1 - gy / (gh - 1);
        var y = forwardExample([x0, x1]).y;
        var on = y > 0.5;
        ctx.fillStyle = on ? "rgba(124,194,100,0.18)" : "rgba(227,137,140,0.16)";
        ctx.fillRect(pad + gx / gw * (w - pad * 2), pad + gy / gh * (h - pad * 2), (w - pad * 2) / gw + 0.5, (h - pad * 2) / gh + 0.5);
      }
    }
    ctx.strokeStyle = "rgba(150,210,230,0.18)";
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    X.forEach(function (x, i) {
      var px = pad + x[0] * (w - pad * 2);
      var py = h - pad - x[1] * (h - pad * 2);
      ctx.beginPath();
      ctx.arc(px, py, i === state.example ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = T[i] ? (T2.cssVar("--green") || "#7cc264") : (T2.cssVar("--rose") || "#e3898c");
      ctx.fill();
      if (i === state.example) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.4; ctx.stroke(); }
    });
    ctx.fillStyle = "rgba(143,170,180,0.85)";
    ctx.font = '600 9px "Open Sans", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("x₁", w - pad - 12, h - 5);
    ctx.save();
    ctx.translate(7, pad + 12);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("x₂", 0, 0);
    ctx.restore();
    dataLossEl.textContent = L("Loss ", "loss ") + data.loss.toFixed(4);
  }

  /* ---------- controls and examples ---------- */

  function renderExamples() {
    examplesEl.innerHTML = X.map(function (x, i) {
      return '<button type="button" class="proto-chip' + (i === state.example ? ' is-on' : '') + '" data-example="' + i + '">' + x[0] + x[1] + '</button>';
    }).join("");
    examplesEl.querySelectorAll("[data-example]").forEach(function (b) {
      b.addEventListener("click", function () { setExample(parseInt(b.getAttribute("data-example"), 10)); });
    });
  }

  function controlsLab(el) {
    el.innerHTML =
      '<label class="t2-range th-range"><span>' + L("Lernrate", "learning rate") + '</span><input type="range" id="bp-lr" min="0.01" max="0.8" step="0.01" value="' + state.lr + '"><output>' + state.lr.toFixed(2) + '</output></label>' +
      '<button type="button" class="proto-btn proto-btn--primary" data-bp-step>' + L("1 Schritt", "1 step") + '</button>' +
      '<button type="button" class="proto-btn" data-bp-train>' + L("20 Schritte", "20 steps") + '</button>' +
      '<button type="button" class="proto-btn proto-btn--ghost" data-bp-reset>' + L("Reset", "Reset") + '</button>';
    var lr = el.querySelector("#bp-lr");
    lr.addEventListener("input", function () {
      state.lr = parseFloat(lr.value) || 0.3;
      lr.nextElementSibling.textContent = state.lr.toFixed(2);
      renderAll(computeAll());
    });
    el.querySelector("[data-bp-step]").addEventListener("click", stepOnce);
    el.querySelector("[data-bp-train]").addEventListener("click", trainBatch);
    el.querySelector("[data-bp-reset]").addEventListener("click", resetLab);
  }

  paramSlider.addEventListener("input", function () {
    setParam(state.selected, parseFloat(paramSlider.value) || 0);
    state.steps = 0;
    state.history = [];
    var data = computeAll();
    state.history = [data.loss];
    renderAll(data);
    narrateLab(L(
      "Parameter " + param(state.selected).label + " = " + paramValue(state.selected).toFixed(3) + ". Loss " + data.loss.toFixed(4) + ". Gradienten neu berechnet.",
      "Parameter " + param(state.selected).label + " = " + paramValue(state.selected).toFixed(3) + ". Loss " + data.loss.toFixed(4) + ". Gradients recomputed."
    ));
  });

  function selectParam(id) {
    state.selected = id;
    renderAll(computeAll());
    var a = analyticGrad(id), n = numericGrad(id);
    narrateLab(L(
      "Parameter " + param(id).label + ": w = " + paramValue(id).toFixed(3) + ", analytischer Gradient " + a.toFixed(4) + ", numerisch " + n.toFixed(4) + ", Differenz " + Math.abs(a - n).toExponential(1) + ".",
      "Parameter " + param(id).label + ": w = " + paramValue(id).toFixed(3) + ", analytic gradient " + a.toFixed(4) + ", numerical " + n.toFixed(4) + ", difference " + Math.abs(a - n).toExponential(1) + "."
    ));
  }

  function setExample(i) {
    state.example = i;
    renderExamples();
    renderAll(computeAll());
    var r = forwardExample(X[i]);
    narrateLab(L(
      "Beispiel x = (" + X[i][0] + ", " + X[i][1] + "), Ziel " + T[i] + ", Ausgabe y = " + r.y.toFixed(3) + ". Die Gradienten werden über alle vier Beispiele gemittelt.",
      "Example x = (" + X[i][0] + ", " + X[i][1] + "), target " + T[i] + ", output y = " + r.y.toFixed(3) + ". Gradients are averaged over all four examples."
    ));
  }

  function applyStep(silent) {
    var old = lossOnly();
    var g = gradientsBatch();
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 2; j++) state.W1[i][j] -= state.lr * g.gW1[i][j];
      state.b1[i] -= state.lr * g.gb1[i];
      state.W2[i] -= state.lr * g.gW2[i];
    }
    state.b2 -= state.lr * g.gb2;
    state.steps++;
    var data = computeAll();
    state.history.push(data.loss);
    if (state.history.length > 140) state.history.shift();
    renderAll(data);
    if (!silent) {
      narrateLab(L(
        "Schritt " + state.steps + ": Loss " + old.toFixed(4) + " → " + data.loss.toFixed(4) + ". Jedes Gewicht bewegt sich gegen seinen Gradienten.",
        "Step " + state.steps + ": loss " + old.toFixed(4) + " → " + data.loss.toFixed(4) + ". Every weight moves against its gradient."
      ));
    }
    return data.loss;
  }

  function stepOnce() {
    if (state.timer) return;
    applyStep(false);
  }

  function trainBatch() {
    if (state.timer) return;
    var count = 0;
    state.timer = setInterval(function () {
      var loss = applyStep(true);
      count++;
      if (count >= 20 || loss < 1e-7) {
        clearInterval(state.timer);
        state.timer = 0;
        narrateLab(L(
          "20 Schritte: Loss " + loss.toFixed(5) + ". Die analytischen Gradienten stimmen mit den numerischen überein; das Netz hat XOR gelernt.",
          "20 steps: loss " + loss.toFixed(5) + ". The analytic gradients match the numerical ones; the network has learned XOR."
        ));
      }
    }, 120);
  }

  function resetLab() {
    if (state.timer) { clearInterval(state.timer); state.timer = 0; }
    state.W1 = clone(INIT.W1);
    state.b1 = INIT.b1.slice();
    state.W2 = INIT.W2.slice();
    state.b2 = INIT.b2;
    state.lr = 0.3;
    state.selected = "W1_00";
    state.example = 0;
    state.steps = 0;
    state.history = [];
    renderExamples();
    controlsLab(controls);
    var data = computeAll();
    state.history = [data.loss];
    renderAll(data);
    narrateLab(L(
      "Zurückgesetzt. Klick eine Kante oder eine Zeile, um einen Parameter zu wählen. Der analytische Gradient kommt aus Backpropagation, der numerische aus zentralen Differenzen.",
      "Reset. Click an edge or a row to choose a parameter. The analytic gradient comes from backpropagation, the numerical one from central differences."
    ));
  }

  function renderAll(data) {
    renderNetwork(data);
    renderTable(data);
    renderSelected(data);
    drawLossCurve();
    drawBoundary(data);
    renderExamples();
  }

  function narrateLab(html) { readout.innerHTML = html; }

  T2.onResize(stage, function () { renderAll(computeAll()); });
  T2.onTheme(function () { renderAll(computeAll()); });
  T2.onLang(function () {
    controlsLab(controls);
    renderExamples();
    renderAll(computeAll());
    narrateLab(L(
      "Klick eine Kante oder eine Zeile, um einen Parameter zu wählen. Der analytische Gradient kommt aus Backpropagation, der numerische aus zentralen Differenzen.",
      "Click an edge or a row to choose a parameter. The analytic gradient comes from backpropagation, the numerical one from central differences."
    ));
  });

  buildNetwork();
  controlsLab(controls);
  renderExamples();
  var boot = computeAll();
  state.history = [boot.loss];
  renderAll(boot);
  narrateLab(L(
    "Klick eine Kante oder eine Zeile, um einen Parameter zu wählen. Der analytische Gradient kommt aus Backpropagation, der numerische aus zentralen Differenzen.",
    "Click an edge or a row to choose a parameter. The analytic gradient comes from backpropagation, the numerical one from central differences."
  ));
  window.addEventListener("beforeunload", function () { if (state.timer) clearInterval(state.timer); });
})();
