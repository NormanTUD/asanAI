(function () {
  "use strict";

  var shaft = document.getElementById("da-shaft");
  var pairsEl = document.getElementById("da-pairs");
  var dimsEl = document.getElementById("da-dims");
  var proj = document.getElementById("da-proj");
  var cosEl = document.getElementById("da-cos");
  var cosBar = document.getElementById("da-cos-bar");
  var distEl = document.getElementById("da-dist");
  var distBar = document.getElementById("da-dist-bar");
  var readout = document.getElementById("da-readout");
  var info = document.getElementById("da-info");
  var shown = document.getElementById("da-shown");
  var tokenAEl = document.getElementById("da-token-a");
  var tokenBEl = document.getElementById("da-token-b");
  var travelBtn = document.querySelector("[data-da-travel]");
  if (!shaft || !pairsEl) return;

  var MAXD = 4096;
  var TOKENS = {
    Katze: ["Katze", "cat"],
    Hund: ["Hund", "dog"],
    Paris: ["Paris", "Paris"]
  };
  var PAIRS = [["Katze", "Hund"], ["Katze", "Paris"], ["Hund", "Paris"]];
  var DIMS = [8, 64, 768, 4096];
  var state = { pair: 0, dims: 64, row: 0, travel: 0 };
  var sample = [];
  var V = null;

  function L(de, en) { return T2.t(de, en); }
  function tokenName(k) { return L(TOKENS[k][0], TOKENS[k][1]); }
  function pair() { return PAIRS[state.pair]; }

  function rand(seed, i) {
    var x = Math.sin(seed * 12.9898 + (i + 1) * 78.233) * 43758.5453;
    x -= Math.floor(x);
    return x * 2 - 1;
  }

  function vectors() {
    if (V) return V;
    var k = [], h = [], p = [];
    for (var i = 0; i < MAXD; i++) {
      var b = rand(1, i);
      k.push(b);
      h.push(0.82 * b + 0.18 * rand(2, i));
      p.push(rand(3, i));
    }
    V = { Katze: k, Hund: h, Paris: p };
    return V;
  }

  function vecPair() {
    var v = vectors();
    return [v[pair()[0]], v[pair()[1]]];
  }

  function cosine(a, b, n) {
    var dot = 0, na = 0, nb = 0;
    for (var i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  }

  function sampleDims(n) {
    if (n <= 64) {
      var all = [];
      for (var i = 0; i < n; i++) all.push(i);
      return all;
    }
    var out = [];
    for (var j = 0; j < 64; j++) out.push(Math.round(j * (n - 1) / 63));
    return out;
  }

  function buildPairs() {
    pairsEl.innerHTML = PAIRS.map(function (p, i) {
      return '<button type="button" class="proto-chip' + (i === state.pair ? ' is-on' : '') + '" data-pair="' + i + '" aria-pressed="' + (i === state.pair ? 'true' : 'false') + '">' + tokenName(p[0]) + ' · ' + tokenName(p[1]) + '</button>';
    }).join("");
    pairsEl.querySelectorAll("[data-pair]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.pair = parseInt(b.getAttribute("data-pair"), 10);
        state.row = 0;
        renderAll();
      });
    });
  }

  function buildDims() {
    dimsEl.innerHTML = DIMS.map(function (n) {
      return '<button type="button" class="proto-chip' + (n === state.dims ? ' is-on' : '') + '" data-dims="' + n + '" aria-pressed="' + (n === state.dims ? 'true' : 'false') + '">' + n + '</button>';
    }).join("");
    dimsEl.querySelectorAll("[data-dims]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.dims = parseInt(b.getAttribute("data-dims"), 10);
        state.row = 0;
        renderAll();
      });
    });
  }

  function barStyle(v) {
    var p = Math.max(-1, Math.min(1, v));
    var left = p >= 0 ? 50 : (50 + p * 50);
    return "left:" + left + "%;width:" + (Math.abs(p) * 50).toFixed(1) + "%;";
  }

  function renderShaft() {
    var v = vectors();
    var a = v[pair()[0]], b = v[pair()[1]];
    sample = sampleDims(state.dims);
    shaft.innerHTML = sample.map(function (idx, row) {
      var va = a[idx], vb = b[idx];
      return '<button type="button" class="da-cell' + (row === state.row ? ' is-on' : '') + '" data-row="' + row + '" data-dim="' + idx + '" role="option" aria-selected="' + (row === state.row ? 'true' : 'false') + '" title="d' + (idx + 1) + ': ' + tokenName(pair()[0]) + ' ' + va.toFixed(2) + ', ' + tokenName(pair()[1]) + ' ' + vb.toFixed(2) + '">' +
        '<span class="da-dim">d' + (idx + 1) + '</span>' +
        '<span class="da-bars"><span class="da-track"><i style="' + barStyle(va) + '"></i></span><span class="da-track is-b"><i style="' + barStyle(vb) + '"></i></span></span>' +
        '<span class="da-val">' + (va >= 0 ? "+" : "") + va.toFixed(2) + '</span>' +
      '</button>';
    }).join("");
    shaft.querySelectorAll("[data-row]").forEach(function (b) {
      b.addEventListener("click", function () {
        stopTravel();
        state.row = parseInt(b.getAttribute("data-row"), 10);
        updateSelection(true);
      });
    });
    shown.textContent = state.dims <= 64 ? state.dims + " " + L("Dimensionen", "dimensions") : "64 " + L("von", "of") + " " + state.dims;
    tokenAEl.textContent = tokenName(pair()[0]);
    tokenBEl.textContent = tokenName(pair()[1]);
    updateSelection(false);
  }

  function updateSelection(scroll) {
    sample = sampleDims(state.dims);
    state.row = T2.clamp(state.row, 0, sample.length - 1);
    shaft.querySelectorAll("[data-row]").forEach(function (b) {
      var on = parseInt(b.getAttribute("data-row"), 10) === state.row;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      if (on && scroll) {
        try { b.scrollIntoView({ block: "nearest" }); } catch (e) {}
      }
    });
    updateMetrics();
  }

  function updateMetrics() {
    var n = state.dims;
    var v = vecPair();
    var a = v[0], b = v[1];
    var cos = cosine(a, b, n);
    var d2 = Math.hypot(a[0] - b[0], a[1] - b[1]);
    cosEl.textContent = cos.toFixed(2);
    cosBar.style.width = Math.max(0, cos) * 100 + "%";
    distEl.textContent = d2.toFixed(2);
    distBar.style.width = Math.min(100, d2 / 2.8 * 100) + "%";
    var idx = sample[state.row] || 0;
    var nameA = tokenName(pair()[0]), nameB = tokenName(pair()[1]);
    var verdict = cos > 0.72
      ? L("Im Vollen sind sie nah.", "In the full space they are close.")
      : cos > 0.25
        ? L("Im Vollen sind sie entfernt verwandt.", "In the full space they are distantly related.")
        : L("Im Vollen sind sie fast unabhängig.", "In the full space they are nearly independent.");
    var shadow = d2 > 1.2
      ? L("Im Schatten liegen sie weit auseinander.", "In the shadow they lie far apart.")
      : L("Im Schatten liegen sie nah beieinander.", "In the shadow they lie close together.");
    readout.innerHTML = T2.esc(nameA + " und " + nameB + ": Kosinus " + cos.toFixed(2) + " über " + n + " Dimensionen. " + verdict + " " + shadow + " Die Projektion nutzt nur d1 und d2.");
    info.innerHTML = T2.esc(L(
      "Dimension d" + (idx + 1) + " von " + n + ": " + nameA + " " + a[idx].toFixed(2) + ", " + nameB + " " + b[idx].toFixed(2) + ". Der Kosinus über alle " + n + " Dimensionen ist " + cos.toFixed(2) + ".",
      "Dimension d" + (idx + 1) + " of " + n + ": " + nameA + " " + a[idx].toFixed(2) + ", " + nameB + " " + b[idx].toFixed(2) + ". The cosine over all " + n + " dimensions is " + cos.toFixed(2) + "."
    ));
    proj.setAttribute("aria-label", L("Zweidimensionale Projektion von " + nameA + " und " + nameB, "Two-dimensional projection of " + nameA + " and " + nameB));
    drawProjection();
  }

  function drawProjection() {
    if (!proj || !proj.clientHeight) return;
    var box = T2.fit(proj, proj);
    var ctx = box.ctx, w = box.w, h = box.h;
    ctx.clearRect(0, 0, w, h);
    var pad = 28;
    var size = Math.min(w - pad * 2, h - pad * 2);
    var ox = w / 2, oy = h / 2;
    function X(x) { return ox + x * size / 2.4; }
    function Y(y) { return oy - y * size / 2.4; }
    var line = T2.cssVar("--line") || "#d8d2c2";
    var muted = T2.cssVar("--muted") || "#627476";
    var sky = T2.cssVar("--sky") || "#3f7fb0";
    var green = T2.cssVar("--green") || "#63a44b";
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    for (var g = -1; g <= 1; g++) {
      ctx.globalAlpha = g === 0 ? 0.8 : 0.32;
      ctx.beginPath(); ctx.moveTo(X(-1.2), Y(g)); ctx.lineTo(X(1.2), Y(g)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(g), Y(-1.2)); ctx.lineTo(X(g), Y(1.2)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    var v = vecPair();
    var a = v[0], b = v[1];
    var ax = X(a[0]), ay = Y(a[1]), bx = X(b[0]), by = Y(b[1]);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = muted;
    ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.restore();
    function point(x, y, color, label) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = '700 10px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(label, x + 9, y - 7);
    }
    point(ax, ay, sky, tokenName(pair()[0]));
    point(bx, by, green, tokenName(pair()[1]));
    ctx.fillStyle = muted;
    ctx.font = '600 9px "Open Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("d1", w - 14, oy + 3);
    ctx.save();
    ctx.translate(ox + 3, 14);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("d2", 0, 0);
    ctx.restore();
  }

  function move(step) {
    stopTravel();
    state.row = T2.clamp(state.row + step, 0, sample.length - 1);
    updateSelection(true);
  }

  function stopTravel() {
    if (!state.travel) return;
    clearInterval(state.travel);
    state.travel = 0;
    travelBtn.textContent = L("Reise", "Travel");
  }

  function travel() {
    if (state.travel) { stopTravel(); return; }
    if (state.row >= sample.length - 1) state.row = 0;
    travelBtn.textContent = L("Stopp", "Stop");
    state.travel = setInterval(function () {
      if (state.row >= sample.length - 1) { stopTravel(); return; }
      state.row++;
      updateSelection(true);
    }, T2.reduced() ? 40 : 160);
  }

  function renderAll() {
    buildPairs();
    buildDims();
    renderShaft();
  }

  /* Wiring */
  document.querySelector("[data-da-prev]").addEventListener("click", function () { move(-1); });
  document.querySelector("[data-da-next]").addEventListener("click", function () { move(1); });
  travelBtn.addEventListener("click", travel);
  document.querySelector("[data-da-reset]").addEventListener("click", function () {
    stopTravel();
    state.pair = 0;
    state.dims = 64;
    state.row = 0;
    renderAll();
  });
  shaft.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
    else if (e.key === "Home") { e.preventDefault(); stopTravel(); state.row = 0; updateSelection(true); }
    else if (e.key === "End") { e.preventDefault(); stopTravel(); state.row = sample.length - 1; updateSelection(true); }
  });

  T2.onLang(function () { renderAll(); });
  T2.onTheme(function () { drawProjection(); });
  T2.onResize(proj, function () { drawProjection(); });

  renderAll();
  window.addEventListener("beforeunload", stopTravel);
})();
