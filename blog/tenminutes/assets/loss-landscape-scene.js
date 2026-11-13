(function () {
  "use strict";

  window.LossLandscapeScene = function (root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-loss-scene";
    el.innerHTML =
      '<div class="ls-loss-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-loss-side"><div class="ls-loss-examples"><div class="ls-loss-side-title">' + (DE ? "Beispiele" : "Examples") + '</div><div class="ls-loss-table" aria-live="polite"></div></div><div class="ls-loss-data-wrap"><canvas class="ls-loss-data"></canvas></div><div class="ls-loss-status" aria-live="polite"></div></div>' +
      '<div class="ls-loss-formula"></div>' +
      '<div class="ls-loss-controls">' +
        '<div class="ls-loss-opts" role="group" aria-label="' + (DE ? "Optimierer" : "Optimizer") + '"><button type="button" class="ls-chip is-on" data-opt="sgd">SGD</button><button type="button" class="ls-chip" data-opt="adam">Adam</button><button type="button" class="ls-chip" data-opt="momentum">Momentum</button></div>' +
        '<label class="ls-range">' + (DE ? "Lernrate" : "Learning rate") + ' <input type="range" class="ls-loss-lr" min="0.01" max="0.25" step="0.01" value="0.08"><output>0.08</output></label>' +
        '<button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-loss-train">' + (DE ? "Training starten" : "Start training") + '</button>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-loss-pause">' + (DE ? "Pause" : "Pause") + '</button>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-loss-reset">' + (DE ? "Zurücksetzen" : "Reset") + '</button>' +
      '</div>' +
      '<div class="ls-loss-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-loss-stage");
    var canvas = el.querySelector("canvas");
    var dataCanvas = el.querySelector(".ls-loss-data");
    var tableEl = el.querySelector(".ls-loss-table");
    var formulaEl = el.querySelector(".ls-loss-formula");
    var statusEl = el.querySelector(".ls-loss-status");
    var readout = el.querySelector(".ls-loss-readout");
    var lrEl = el.querySelector(".ls-loss-lr");
    var lrOut = lrEl.nextElementSibling;
    var trainBtn = el.querySelector(".ls-loss-train");
    var pauseBtn = el.querySelector(".ls-loss-pause");
    var resetBtn = el.querySelector(".ls-loss-reset");
    var optEls = el.querySelectorAll("[data-opt]");
    var C = api.colors();
    var optOrder = ["sgd", "adam", "momentum"];
    var data = null, worker = null;
    var optimizer = "sgd", step = 0, playing = false, finished = false, visible = true, started = false, timer = 0, formulaKey = "";
    var yaw = -0.72, pitch = 0.86, zoom = 1, drag = null;
    var size = null, minL = 0, maxL = 1;

    function mix(a, b, t) {
      function rgb(h) { h = h.replace("#", ""); return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]; }
      var A = rgb(a), B = rgb(b);
      return "rgb(" + Math.round(A[0] + (B[0]-A[0])*t) + "," + Math.round(A[1] + (B[1]-A[1])*t) + "," + Math.round(A[2] + (B[2]-A[2])*t) + ")";
    }
    function lossColor(t) {
      t = Math.max(0, Math.min(1, t));
      return t < 0.55 ? mix(C.green, C.gold, t / 0.55) : mix(C.gold, C.lilac, (t - 0.55) / 0.45);
    }
    function optColor(name) { return name === "adam" ? C.gold : name === "momentum" ? C.lime : C.blue; }
    function trajectory() { return data && data.trajectories ? data.trajectories[optimizer] : []; }
    function current() { var tr = trajectory(); return tr[Math.min(step, tr.length - 1)]; }
    function project(a, b, L) {
      var r = data.range;
      var x = (a - r.a0) / (r.a1 - r.a0) - 0.5;
      var y = (b - r.b0) / (r.b1 - r.b0) - 0.5;
      var z = (L - minL) / Math.max(1e-9, maxL - minL);
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x1 = x * cy - y * sy;
      var y1 = x * sy + y * cy;
      var y2 = y1 * cp + z * 0.9 * sp;
      var z2 = -y1 * sp + z * 0.9 * cp;
      var s = Math.min(size.w * 0.36, size.h * 0.44) * zoom / (1 + z2 * 0.18);
      return { x: size.w * 0.5 + x1 * s, y: size.h * 0.56 - y2 * s, z: z2 };
    }
    function drawExamples() {
      if (!data) { tableEl.innerHTML = '<span>' + (DE ? "Lade Beispiele …" : "Loading examples …") + '</span>'; return; }
      var cur = current() || { a: 0, b: 0 };
      var rows = data.examples.xs.map(function (x, i) {
        var yhat = cur.a * x + cur.b;
        return '<span><b>x ' + x + '</b><small>y ' + data.examples.ys[i].toFixed(2) + ' · ŷ ' + yhat.toFixed(2) + '</small></span>';
      }).join("");
      tableEl.innerHTML = rows;
    }
    function drawData() {
      if (!data || !dataCanvas) return;
      var ds = api.fit(dataCanvas, dataCanvas.parentNode);
      if (!ds) return;
      var c = ds.ctx, w = ds.w, h = ds.h, pad = 8;
      c.clearRect(0, 0, w, h);
      c.fillStyle = C.paper; c.fillRect(0, 0, w, h);
      var xs = data.examples.xs, ys = data.examples.ys;
      var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
      var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
      function X(x) { return pad + (x - minX) / (maxX - minX) * (w - 2 * pad); }
      function Y(y) { return h - pad - (y - minY) / (maxY - minY) * (h - 2 * pad); }
      c.strokeStyle = C.line; c.beginPath(); c.moveTo(pad, h - pad); c.lineTo(w - pad, h - pad); c.stroke();
      xs.forEach(function (x, i) { c.beginPath(); c.arc(X(x), Y(ys[i]), 2.4, 0, Math.PI * 2); c.fillStyle = C.green; c.fill(); });
      var cur = current();
      if (cur) {
        c.strokeStyle = C.blue; c.lineWidth = 1.8; c.beginPath();
        c.moveTo(X(minX), Y(cur.a * minX + cur.b)); c.lineTo(X(maxX), Y(cur.a * maxX + cur.b)); c.stroke();
      }
      c.fillStyle = C.muted; c.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      c.fillText(DE ? "Daten + aktuelle Gerade" : "data + current line", 6, 12);
    }
    function renderFormula() {
      if (!formulaEl || !data) return;
      var cur = current();
      if (!cur) return;
      var key = optimizer + "|" + step + "|" + cur.a.toFixed(4) + "|" + cur.b.toFixed(4);
      if (key === formulaKey) return;
      formulaKey = key;
      var tex = '\\underbrace{\\hat y}_{\\text{' + (DE ? 'Ausgabe' : 'output') + '}} = \\underbrace{w x + b}_{\\text{' + (DE ? 'lineares Modell' : 'linear model') + '}},\\quad w=' + cur.a.toFixed(3) + ',\\ b=' + cur.b.toFixed(3) +
        '\\qquad \\underbrace{L(w,b)}_{\\text{' + (DE ? 'Fehler' : 'loss') + '}} = \\underbrace{\\frac{1}{n}\\sum_i(\\hat y_i-y_i)^2}_{\\text{MSE}} = ' + cur.loss.toFixed(4);
      formulaEl.innerHTML = '<div class="ls-math" data-tex="' + api.esc(tex) + '" data-tex-display="true"><code class="ls-tex-source">' + api.esc(tex) + '</code></div>';
      if (api.typeset) { try { api.typeset(formulaEl); } catch (e) {} }
    }
    function draw() {
      if (!size || !data) return;
      var ctx = size.ctx, w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, h);
      var n = data.z.length;
      minL = Infinity; maxL = -Infinity;
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) { minL = Math.min(minL, data.z[i][j]); maxL = Math.max(maxL, data.z[i][j]); }
      var cells = [];
      for (var i2 = 0; i2 < n - 1; i2++) for (var j2 = 0; j2 < n - 1; j2++) {
        var a0 = data.range.a0 + (data.range.a1 - data.range.a0) * j2 / (n - 1);
        var a1 = data.range.a0 + (data.range.a1 - data.range.a0) * (j2 + 1) / (n - 1);
        var b0 = data.range.b0 + (data.range.b1 - data.range.b0) * i2 / (n - 1);
        var b1 = data.range.b0 + (data.range.b1 - data.range.b0) * (i2 + 1) / (n - 1);
        var p0 = project(a0, b0, data.z[i2][j2]), p1 = project(a1, b0, data.z[i2][j2 + 1]);
        var p2 = project(a1, b1, data.z[i2 + 1][j2 + 1]), p3 = project(a0, b1, data.z[i2 + 1][j2]);
        cells.push({ p: [p0, p1, p2, p3], z: (p0.z + p1.z + p2.z + p3.z) / 4, l: (data.z[i2][j2] + data.z[i2][j2 + 1] + data.z[i2 + 1][j2 + 1] + data.z[i2 + 1][j2]) / 4 });
      }
      cells.sort(function (a, b) { return a.z - b.z; });
      cells.forEach(function (c) {
        var t = (c.l - minL) / Math.max(1e-9, maxL - minL);
        ctx.fillStyle = lossColor(t); ctx.globalAlpha = 0.84;
        ctx.beginPath(); ctx.moveTo(c.p[0].x, c.p[0].y); ctx.lineTo(c.p[1].x, c.p[1].y); ctx.lineTo(c.p[2].x, c.p[2].y); ctx.lineTo(c.p[3].x, c.p[3].y); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 0.14; ctx.strokeStyle = C.paper; ctx.lineWidth = 0.6; ctx.stroke();
      });
      ctx.globalAlpha = 1;
      optOrder.forEach(function (name) {
        if (name === optimizer) return;
        var tr = data.trajectories[name] || [];
        if (tr.length < 2) return;
        ctx.beginPath(); tr.forEach(function (p, k) { var q = project(p.a, p.b, p.loss); if (k === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); });
        ctx.strokeStyle = optColor(name); ctx.globalAlpha = 0.18; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      });
      ctx.globalAlpha = 1;
      var tr = trajectory();
      if (tr.length > 1) {
        ctx.beginPath(); for (var s = 0; s <= Math.min(step, tr.length - 1); s++) { var q = project(tr[s].a, tr[s].b, tr[s].loss); if (s === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); }
        ctx.strokeStyle = optColor(optimizer); ctx.lineWidth = 2.8; ctx.stroke();
      }
      var cur = current();
      if (cur) {
        var bp = project(cur.a, cur.b, cur.loss);
        ctx.beginPath(); ctx.arc(bp.x, bp.y + 5, 10, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,.16)"; ctx.fill();
        ctx.beginPath(); ctx.arc(bp.x, bp.y, 8, 0, Math.PI * 2); ctx.fillStyle = optColor(optimizer); ctx.fill(); ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = C.ink; ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "left";
        ctx.fillText(optimizer.toUpperCase() + " · L " + cur.loss.toFixed(4), bp.x + 12, bp.y - 10);
      }
      var o = project(data.range.a0, data.range.b0, minL), ea = project(data.range.a1, data.range.b0, minL), eb = project(data.range.a0, data.range.b1, minL);
      ctx.strokeStyle = C.petrol; ctx.globalAlpha = .7; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(ea.x, ea.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(eb.x, eb.y); ctx.stroke();
      ctx.fillStyle = C.petrol; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.fillText("w", ea.x + 4, ea.y); ctx.fillText("b", eb.x + 4, eb.y);
      ctx.fillStyle = C.muted; ctx.textAlign = "left"; ctx.fillText(DE ? "Loss" : "loss", 18, 20);
      ctx.textAlign = "right"; ctx.fillText(DE ? "Ziehen zum Drehen" : "drag to rotate", size.w - 18, 20);
      updateReadout(); drawExamples(); drawData(); renderFormula();
    }
    function updateReadout() {
      if (!data) { readout.innerHTML = '<span>' + (DE ? "Training wird vorbereitet …" : "Preparing training …") + '</span>'; return; }
      var cur = current() || { a: 0, b: 0, loss: 0 };
      readout.innerHTML = '<span><b>w</b> ' + cur.a.toFixed(3) + '</span><span><b>b</b> ' + cur.b.toFixed(3) + '</span><span><b>Loss</b> ' + cur.loss.toFixed(4) + '</span><span><b>' + (DE ? "Optimierer" : "optimizer") + '</b> ' + optimizer.toUpperCase() + '</span><span><b>' + (DE ? "Schritt" : "step") + '</b> ' + step + ' / ' + (trajectory().length - 1) + '</span>';
    }
    function setStatus(text) { statusEl.textContent = text; }
    function setOpt(name) {
      optimizer = name; step = 0; started = false; finished = false;
      optEls.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-opt") === name); });
      formulaKey = ""; draw();
    }
    function startWorker() {
      if (worker) { worker.terminate(); worker = null; }
      data = null; step = 0; playing = false; finished = false; started = false; clearTimeout(timer); timer = 0;
      setStatus(DE ? "Berechne die Loss-Fläche …" : "Computing the loss surface …");
      readout.innerHTML = '<span>' + (DE ? "Die Fläche wird im Hintergrund berechnet." : "The surface is computed in the background.") + '</span>';
      worker = new Worker("assets/loss-landscape-worker.js?v=4");
      worker.onmessage = function (e) {
        data = e.data;
        started = false;
        finished = false;
        setStatus(DE ? "Bereit · Weiter startet SGD." : "Ready · Next starts SGD.");
        setOpt("sgd");
        draw();
      };
      worker.onerror = function () { setStatus(DE ? "Worker-Fehler" : "Worker error"); };
      worker.postMessage({
        cmd: "train",
        lr: parseFloat(lrEl.value) || 0.08,
        points: (window.TM_SINUS_DATA && window.TM_SINUS_DATA.points) || []
      });
    }
    function tick() {
      if (!playing || !data) return;
      var tr = trajectory();
      if (step < tr.length - 1) { step++; draw(); timer = setTimeout(tick, 55); return; }
      playing = false;
      started = true;
      finished = optimizer === "momentum";
      var oi = optOrder.indexOf(optimizer);
      var nextName = oi < optOrder.length - 1 ? optOrder[oi + 1].toUpperCase() : null;
      setStatus(finished
        ? (DE ? "Fertig · SGD, Adam und Momentum." : "Done · SGD, Adam and Momentum.")
        : (DE ? optimizer.toUpperCase() + " fertig · Weiter für " + nextName + "." : optimizer.toUpperCase() + " done · Next for " + nextName + "."));
      pauseBtn.textContent = DE ? "Nochmal" : "Again";
    }
    function startTraining() {
      if (!data) { startWorker(); return; }
      playing = true; finished = false; started = true; clearTimeout(timer); timer = 0;
      step = 0; formulaKey = "";
      optEls.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-opt") === optimizer); });
      setStatus(DE ? "Training läuft: " + optimizer.toUpperCase() + "." : "Training: " + optimizer.toUpperCase() + ".");
      pauseBtn.textContent = DE ? "Pause" : "Pause";
      draw(); timer = setTimeout(tick, 140);
    }
    function pause() { playing = false; clearTimeout(timer); timer = 0; pauseBtn.textContent = DE ? "Weiter" : "Resume"; }
    function resumeTraining() {
      if (!data) { startWorker(); return; }
      if (finished) { startTraining(); return; }
      playing = true; clearTimeout(timer); timer = 0;
      pauseBtn.textContent = DE ? "Pause" : "Pause";
      timer = setTimeout(tick, 120);
    }
    function reset() {
      playing = false; finished = false; started = false; clearTimeout(timer); timer = 0;
      step = 0; optimizer = "sgd"; formulaKey = "";
      optEls.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-opt") === "sgd"); });
      pauseBtn.textContent = DE ? "Pause" : "Pause";
      setStatus(DE ? "Bereit · Weiter startet SGD." : "Ready · Next starts SGD.");
      if (data) draw();
    }
    trainBtn.addEventListener("click", startTraining);
    pauseBtn.addEventListener("click", function () {
      if (playing) { pause(); return; }
      if (!data) { startWorker(); return; }
      if (step >= trajectory().length - 1) { startTraining(); return; }
      playing = true;
      pauseBtn.textContent = DE ? "Pause" : "Pause";
      timer = setTimeout(tick, 160);
    });
    resetBtn.addEventListener("click", reset);
    optEls.forEach(function (b) { b.addEventListener("click", function () { if (!data) return; pause(); setOpt(b.getAttribute("data-opt")); }); });
    lrEl.addEventListener("input", function () { lrOut.textContent = (parseFloat(lrEl.value) || 0.08).toFixed(2); });
    canvas.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY }; });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.008;
      pitch = Math.max(0.25, Math.min(1.3, pitch + (e.clientY - drag.y) * 0.006));
      drag.x = e.clientX; drag.y = e.clientY; draw();
    });
    window.addEventListener("pointerup", function () { drag = null; });
    function resize() { size = api.fit(canvas, stage); if (data) draw(); else drawData(); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries.some(function (en) { return en.isIntersecting; });
        if (!visible) { pause(); return; }
        if (data) draw();
      }, { threshold: 0.05 }).observe(stage);
    }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); if (data) draw(); });
    resize(); startWorker();
    return {
      update: function () {},
      next: function () {
        if (!data) { startWorker(); return true; }
        if (playing) {
          pause();
          if (optimizer === "momentum") return false;
          var oi = optOrder.indexOf(optimizer);
          setOpt(optOrder[oi + 1]);
          startTraining();
          return true;
        }
        if (!started) { startTraining(); return true; }
        if (optimizer === "momentum" && step >= trajectory().length - 1) return false;
        var ci = optOrder.indexOf(optimizer);
        if (ci < optOrder.length - 1) {
          setOpt(optOrder[ci + 1]);
          startTraining();
          return true;
        }
        return false;
      },
      prev: function () { return false; },
      pause: pause,
      resume: function () { visible = true; if (data) draw(); },
      resize: resize,
      destroy: function () { playing = false; clearTimeout(timer); if (worker) worker.terminate(); worker = null; window.removeEventListener("resize", resize); el.remove(); }
    };
  };
})();
