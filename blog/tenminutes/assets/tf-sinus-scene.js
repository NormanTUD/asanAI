(function () {
  "use strict";

  window.TfSinusScene = function (root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-sinus-scene";
    el.innerHTML =
      '<div class="ls-sinus-tabs" role="tablist">' +
        '<button type="button" class="ls-sinus-tab is-on" data-phase="linear">' + (DE ? "1 Neuron" : "1 neuron") + '</button>' +
        '<button type="button" class="ls-sinus-tab" data-phase="net">' + (DE ? "32 × 32 × 32" : "32 × 32 × 32") + '</button>' +
      '</div>' +
      '<div class="ls-sinus-stage">' +
        '<canvas class="ls-sinus-canvas" role="img"></canvas>' +
        '<div class="ls-sinus-matrices" hidden>' +
          '<div class="ls-sinus-matrices-head"><b>' + (DE ? "Gewichte live" : "Live weights") + '</b><span>' + (DE ? "ohne Bias" : "without bias") + '</span><button type="button" class="ls-btn ls-btn--tiny ls-sinus-matrices-close" aria-label="' + (DE ? "Schließen" : "Close") + '">×</button></div>' +
          '<div class="ls-sinus-matrix-grid">' +
            '<figure><canvas data-matrix="0"></canvas><figcaption>W₁ · 1×32</figcaption></figure>' +
            '<figure><canvas data-matrix="1"></canvas><figcaption>W₂ · 32×32</figcaption></figure>' +
            '<figure><canvas data-matrix="2"></canvas><figcaption>W₃ · 32×32</figcaption></figure>' +
            '<figure><canvas data-matrix="3"></canvas><figcaption>W₄ · 32×1</figcaption></figure>' +
          '</div>' +
          '<div class="ls-sinus-matrix-legend"><span>−</span><span>0</span><span>+</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="ls-sinus-losschart"><canvas class="ls-sinus-loss-canvas" aria-label="Loss curve"></canvas></div>' +
      '<div class="ls-sinus-controls">' +
        '<button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-sinus-train">' + (DE ? "Training pausieren" : "Pause training") + '</button>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-sinus-reset">' + (DE ? "Neu starten" : "Restart") + '</button>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-sinus-matrix-btn">' + (DE ? "Matrizen zeigen" : "Show matrices") + '</button>' +
        '<span class="ls-sinus-loss" aria-live="polite"></span>' +
      '</div>' +
      '<div class="ls-sinus-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-sinus-stage");
    var canvas = el.querySelector(".ls-sinus-canvas");
    var trainBtn = el.querySelector(".ls-sinus-train");
    var resetBtn = el.querySelector(".ls-sinus-reset");
    var matrixBtn = el.querySelector(".ls-sinus-matrix-btn");
    var matrixClose = el.querySelector(".ls-sinus-matrices-close");
    var matrixOverlay = el.querySelector(".ls-sinus-matrices");
    var matrixCanvases = Array.prototype.slice.call(el.querySelectorAll("[data-matrix]"));
    var tabs = Array.prototype.slice.call(el.querySelectorAll("[data-phase]"));
    var lossCanvas = el.querySelector(".ls-sinus-loss-canvas");
    var lossCtx = null, lossSize = null;
    var lossEl = el.querySelector(".ls-sinus-loss");
    var readout = el.querySelector(".ls-sinus-readout");
    var C = api.colors();
    var size = null, ctx = null;
    var xsTensor = null, ysTensor = null;
    var points = [];
    var phase = "linear";
    var training = false, visible = true, timer = 0;
    var drag = null, fitReady = false;
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var TRAIN_END = 0.70, X_MIN = -0.20, X_MAX = 1.20, Y_MIN = -0.45, Y_MAX = 1.15;
    var TARGET_EPOCHS = 180;
    var gen = 0;
    var data = {
      linear: { model: null, curve: [], epochs: 0, loss: 0, history: [] },
      net: { model: null, curve: [], epochs: 0, loss: 0, history: [] }
    };
    function active() { return data[phase]; }
    function fitSmall(cv, host) {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var r = (host || cv).getBoundingClientRect();
      var w = Math.max(40, Math.round(r.width));
      var h = Math.max(40, Math.round(r.height));
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      var c = cv.getContext("2d");
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h, ctx: c };
    }
    function truth(x) { return 0.5 + 0.42 * Math.sin(2 * Math.PI * x); }
    function makePoints(reset) {
      if (reset && window.TM_SINUS_DATA) window.TM_SINUS_DATA.reset();
      var src = window.TM_SINUS_DATA && window.TM_SINUS_DATA.points;
      points = src ? src.map(function (p) { return { x: p.x, y: p.y }; }) : [];
      if (!points.length) {
        var seed = 11;
        function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
        for (var i = 0; i < 18; i++) {
          var x = 0.10 + 0.60 * i / 17;
          points.push({ x: x, y: truth(x) + (rnd() - 0.5) * 0.035 });
        }
      }
    }
    function makeTensors() {
      if (xsTensor) xsTensor.dispose();
      if (ysTensor) ysTensor.dispose();
      xsTensor = tf.tensor2d(points.map(function (p) { return [p.x]; }), [points.length, 1]);
      ysTensor = tf.tensor2d(points.map(function (p) { return [p.y]; }), [points.length, 1]);
    }
    function buildLinear() {
      if (data.linear.model) data.linear.model.dispose();
      var m = tf.sequential();
      m.add(tf.layers.dense({ inputShape: [1], units: 1, activation: "linear" }));
      m.compile({ optimizer: tf.train.adam(0.05), loss: "meanSquaredError" });
      data.linear.model = m;
      data.linear.epochs = 0;
      data.linear.loss = 0;
      data.linear.history = [];
    }
    function buildNet() {
      if (data.net.model) data.net.model.dispose();
      var m = tf.sequential();
      m.add(tf.layers.dense({ inputShape: [1], units: 32, activation: "relu" }));
      m.add(tf.layers.dense({ units: 32, activation: "relu" }));
      m.add(tf.layers.dense({ units: 32, activation: "relu" }));
      m.add(tf.layers.dense({ units: 1, activation: "linear" }));
      m.compile({ optimizer: tf.train.adam(0.03), loss: "meanSquaredError" });
      data.net.model = m;
      data.net.epochs = 0;
      data.net.loss = 0;
      data.net.history = [];
    }
    function grid() {
      var out = [];
      for (var i = 0; i <= 140; i++) out.push([X_MIN + (X_MAX - X_MIN) * i / 140]);
      return out;
    }
    function predict() {
      var a = active();
      if (!a.model || !fitReady) return;
      var g = grid();
      var y = tf.tidy(function () { return a.model.predict(tf.tensor2d(g, [g.length, 1])).dataSync(); });
      a.curve = [];
      for (var i = 0; i < g.length; i++) a.curve.push({ x: g[i][0], y: y[i] });
    }
    function curveAt(x) {
      var c = active().curve;
      if (!c.length) return 0;
      var lo = X_MIN, hi = X_MAX;
      for (var i = 1; i < c.length; i++) {
        if (c[i].x >= x) {
          var t = (x - c[i - 1].x) / Math.max(1e-9, c[i].x - c[i - 1].x);
          return c[i - 1].y + (c[i].y - c[i - 1].y) * V.clamp(t, 0, 1);
        }
      }
      return c[c.length - 1].y;
    }
    function outsideError() {
      var c = active().curve;
      if (!c.length) return 0;
      var s = 0, n = 0;
      c.forEach(function (p) {
        if (p.x > 0.10 && p.x < TRAIN_END) return;
        var d = p.y - truth(p.x);
        s += d * d; n++;
      });
      return n ? Math.sqrt(s / n) : 0;
    }
    function px(x) { return 34 + (x - X_MIN) / (X_MAX - X_MIN) * (size.w - 54); }
    function py(y) { return size.h - 40 - (y - Y_MIN) / (Y_MAX - Y_MIN) * (size.h - 74); }
    function legend(w, h) {
      var items = [
        { label: DE ? "Daten" : "data", color: C.blue, kind: "dot" },
        { label: DE ? "Modell" : "model", color: C.green, kind: "line" },
        { label: DE ? "wahrer Sinus" : "true sine", color: C.muted, kind: "dash" }
      ];
      var x = 44, y = 16;
      items.forEach(function (it) {
        ctx.save();
        ctx.strokeStyle = it.color;
        ctx.fillStyle = it.color;
        ctx.lineWidth = it.kind === "line" ? 2.4 : 1.4;
        if (it.kind === "dash") ctx.setLineDash([4, 3]);
        if (it.kind === "dot") {
          ctx.beginPath();
          ctx.arc(x, y, 3.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(x - 7, y);
          ctx.lineTo(x + 7, y);
          ctx.stroke();
        }
        ctx.restore();
        V.label(ctx, it.label, x + 12, y, {
          font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif',
          color: C.muted, alpha: 1, bg: false
        });
        x += ctx.measureText(it.label).width + 34;
      });
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, size.w, size.h);
      ctx.fillStyle = V.alpha(C.gold, 0.055);
      ctx.fillRect(34, 26, px(0.10) - 34, size.h - 68);
      ctx.fillRect(px(TRAIN_END), 26, size.w - 20 - px(TRAIN_END), size.h - 68);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(34, size.h - 40);
      ctx.lineTo(size.w - 20, size.h - 40);
      ctx.moveTo(34, 22);
      ctx.lineTo(34, size.h - 40);
      ctx.stroke();
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = C.muted;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      for (var i = 0; i <= 140; i++) {
        var x = X_MIN + (X_MAX - X_MIN) * i / 140;
        if (i === 0) ctx.moveTo(px(x), py(truth(x))); else ctx.lineTo(px(x), py(truth(x)));
      }
      ctx.stroke();
      ctx.restore();
      var a = active();
      if (a.curve.length) {
        if (phase === "linear" && a.epochs > 4) {
          points.forEach(function (p) {
            var yhat = curveAt(p.x);
            ctx.save();
            ctx.strokeStyle = V.alpha(C.lilac, 0.72);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(px(p.x), py(p.y));
            ctx.lineTo(px(p.x), py(yhat));
            ctx.stroke();
            ctx.restore();
          });
        }
        ctx.save();
        ctx.strokeStyle = phase === "net" ? C.green : C.petrol;
        ctx.lineWidth = 2.8;
        ctx.lineJoin = "round";
        ctx.beginPath();
        a.curve.forEach(function (p, k) { if (k === 0) ctx.moveTo(px(p.x), py(p.y)); else ctx.lineTo(px(p.x), py(p.y)); });
        ctx.stroke();
        ctx.restore();
      }
      points.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(px(p.x), py(p.y), 4, 0, Math.PI * 2);
        ctx.fillStyle = C.paper;
        ctx.fill();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      });
      legend(size.w, size.h);
      V.heading(ctx, phase === "linear" ? "1 Neuron · ŷ = w x + b" : "1 → 32 → 32 → 32 → 1", size.w - 20, 18, C.petrol, 10, 1);
      if (phase === "linear") {
        var wv = linearParams();
        V.label(ctx, "w = " + V.fmt(wv.w) + "    b = " + V.fmt(wv.b), 44, size.h - 58, {
          font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif',
          color: C.petrol, alpha: 1
        });
        if (a.epochs > 18) {
          var msg = DE ? "Eine Gerade kann den Sinus nicht biegen." : "A line cannot bend the sine.";
          V.label(ctx, msg, size.w * 0.5, 42, {
            font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Barlow", sans-serif',
            color: C.gold, align: "center", alpha: 1
          });
        }
      } else {
        V.label(ctx, DE ? "Drei versteckte Schichten, je 32 ReLU" : "three hidden layers, 32 ReLU each", 44, size.h - 58, {
          font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif',
          color: C.petrol, alpha: 1
        });
      }
      drawLossChart();
      updateReadout();
      canvas.setAttribute("aria-label", DE
        ? "Sinus-Demo. Modell: " + (phase === "linear" ? "ein Neuron, Gerade" : "drei versteckte Schichten mit 32 ReLU-Neuronen") + ". Loss " + V.fmt(a.loss, 4) + "."
        : "Sine demo. Model: " + (phase === "linear" ? "one neuron, a line" : "three hidden layers with 32 ReLU neurons") + ". Loss " + V.fmt(a.loss, 4) + ".");
    }
    function linearParams() {
      var w = 0, b = 0;
      var m = data.linear.model;
      if (m && m.layers && m.layers[0]) {
        var ws = m.layers[0].getWeights();
        if (ws && ws[0]) { var k = ws[0].dataSync(); w = k[0] || 0; }
        if (ws && ws[1]) { var bias = ws[1].dataSync(); b = bias[0] || 0; }
      }
      return { w: w, b: b };
    }
    function drawLossChart() {
      if (!lossCanvas) return;
      lossSize = api.fit(lossCanvas, lossCanvas.parentNode);
      lossCtx = lossSize.ctx;
      var w = lossSize.w, h = lossSize.h;
      lossCtx.clearRect(0, 0, w, h);
      lossCtx.fillStyle = C.paper;
      lossCtx.fillRect(0, 0, w, h);
      lossCtx.strokeStyle = C.line;
      lossCtx.lineWidth = 1;
      lossCtx.beginPath();
      lossCtx.moveTo(8, h - 8);
      lossCtx.lineTo(w - 8, h - 8);
      lossCtx.stroke();
      V.label(lossCtx, "Loss (log)", 8, 11, {
        font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif',
        color: C.muted, bg: false, alpha: 1
      });
      var hist = active().history;
      if (!hist.length) return;
      var logs = hist.map(function (v) { return Math.log10(Math.max(1e-8, v)); });
      var min = Math.min.apply(null, logs), max = Math.max.apply(null, logs);
      if (max - min < 1e-6) { max += 0.5; min -= 0.5; }
      lossCtx.strokeStyle = phase === "net" ? C.green : C.petrol;
      lossCtx.lineWidth = 1.8;
      lossCtx.beginPath();
      logs.forEach(function (v, i) {
        var x = 8 + i / Math.max(1, logs.length - 1) * (w - 16);
        var y = h - 8 - (v - min) / (max - min) * (h - 18);
        if (i === 0) lossCtx.moveTo(x, y); else lossCtx.lineTo(x, y);
      });
      lossCtx.stroke();
      V.label(lossCtx, "Epoche " + active().epochs, w - 8, 11, {
        font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif',
        color: C.muted, align: "right", bg: false, alpha: 1
      });
    }
    function updateReadout() {
      var a = active();
      lossEl.textContent = "Loss " + V.fmt(a.loss, 4);
      var model = phase === "linear" ? "1 → 1" : "1 → 32 → 32 → 32 → 1";
      var params = phase === "linear" ? linearParams() : null;
      readout.innerHTML = '<span><b>' + (DE ? "Modell" : "model") + '</b> ' + model + '</span>' +
        '<span><b>' + (DE ? "Epochen" : "epochs") + '</b> ' + a.epochs + '</span>' +
        '<span><b>Loss</b> ' + V.fmt(a.loss, 4) + '</span>' +
        '<span><b>' + (DE ? "außen" : "outside") + '</b> ' + V.fmt(outsideError(), 3) + '</span>' +
        (params ? '<span><b>w</b> ' + V.fmt(params.w) + '</span><span><b>b</b> ' + V.fmt(params.b) + '</span>' : '') +
        '<span><b>(x, y)</b> ' + (DE ? "input, output" : "input, output") + '</span>';
    }
    function updateMatrixCanvases() {
      if (matrixOverlay.hidden || phase !== "net" || !data.net.model) return;
      matrixCanvases.forEach(function (cv, li) {
        var layer = data.net.model.layers[li];
        if (!layer) return;
        var ws = layer.getWeights();
        if (!ws || !ws[0]) return;
        var kernel = ws[0];
        var shape = kernel.shape;
        var vals = kernel.dataSync();
        var rows = shape[0], cols = shape[1];
        var fit = fitSmall(cv, cv);
        if (!fit) return;
        fit.ctx.clearRect(0, 0, fit.w, fit.h);
        fit.ctx.fillStyle = C.paper;
        fit.ctx.fillRect(0, 0, fit.w, fit.h);
        V.matrix(fit.ctx, Array.prototype.slice.call(vals), rows, cols, 4, 4, fit.w - 8, fit.h - 8, C);
      });
    }
    function trainTick() {
      var a = active();
      if (!visible || !training || !a.model) { timer = 0; return; }
      var g = gen, p = phase, m = a.model;
      var epochsPer = p === "linear" ? 6 : 2;
      m.fit(xsTensor, ysTensor, { epochs: epochsPer, batchSize: points.length, shuffle: true, verbose: 0 }).then(function (h) {
        if (g !== gen || phase !== p || a.model !== m) return;
        var losses = h.history.loss;
        a.epochs += epochsPer;
        a.loss = losses[losses.length - 1];
        a.history.push(a.loss);
        if (a.history.length > 110) a.history.shift();
        predict();
        draw();
        updateMatrixCanvases();
        if (visible && training) timer = setTimeout(trainTick, reduced ? 500 : (p === "linear" ? 80 : 64));
      }).catch(function () { timer = 0; });
    }
    function resumeTraining() {
      training = true;
      trainBtn.textContent = DE ? "Training pausieren" : "Pause training";
      if (!timer && visible && active().model) trainTick();
    }
    function pauseTraining() {
      training = false;
      trainBtn.textContent = DE ? "Training fortsetzen" : "Resume training";
      if (timer) { clearTimeout(timer); timer = 0; }
    }
    function resetActive() {
      if (timer) { clearTimeout(timer); timer = 0; }
      if (active().model) active().model.stopTraining = true;
      training = false;
      gen++;
      var p = phase;
      setTimeout(function () {
        if (phase !== p) return;
        if (p === "linear") buildLinear(); else buildNet();
        predict();
        draw();
        updateMatrixCanvases();
        trainBtn.textContent = DE ? "Training starten" : "Start training";
        if (visible) resumeTraining();
      }, 140);
    }
    function switchPhase(next) {
      if (next === phase) return;
      pauseTraining();
      phase = next;
      tabs.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-phase") === phase); });
      if (!active().model) {
        if (phase === "linear") buildLinear(); else buildNet();
      }
      predict();
      draw();
      updateMatrixCanvases();
      trainBtn.textContent = DE ? "Training starten" : "Start training";
    }
    function startTf() {
      makePoints();
      makeTensors();
      buildLinear();
      buildNet();
      fitReady = true;
      predict();
      draw();
      trainBtn.textContent = DE ? "Training starten" : "Start training";
    }
    function initTf() {
      if (!window.tf) {
        readout.textContent = DE ? "TF.js konnte nicht geladen werden." : "TF.js could not be loaded.";
        return;
      }
      if (tf.getBackend && tf.getBackend() !== "cpu" && tf.setBackend) {
        tf.setBackend("cpu").then(startTf).catch(startTf);
      } else {
        startTf();
      }
    }
    function pointerPos(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    canvas.addEventListener("pointerdown", function (e) {
      var p = pointerPos(e);
      var best = -1, bd = 1e9;
      points.forEach(function (pt, i) {
        var d = Math.abs(px(pt.x) - p.x) + Math.abs(py(pt.y) - p.y);
        if (d < bd) { bd = d; best = i; }
      });
      if (best >= 0 && bd < 22) {
        drag = best;
        canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      }
    });
    canvas.addEventListener("pointermove", function (e) {
      if (drag == null) return;
      var p = pointerPos(e);
      var y = Y_MIN + (size.h - 40 - p.y) / (size.h - 74) * (Y_MAX - Y_MIN);
      points[drag].y = V.clamp(y, Y_MIN, Y_MAX);
      if (window.TM_SINUS_DATA && window.TM_SINUS_DATA.points[drag]) window.TM_SINUS_DATA.points[drag].y = points[drag].y;
      makeTensors();
      predict();
      draw();
    });
    canvas.addEventListener("pointerup", function () { drag = null; });
    canvas.addEventListener("pointercancel", function () { drag = null; });
    tabs.forEach(function (b) {
      b.addEventListener("click", function () { switchPhase(b.getAttribute("data-phase")); });
    });
    trainBtn.addEventListener("click", function () { if (training) pauseTraining(); else resumeTraining(); });
    resetBtn.addEventListener("click", resetActive);
    matrixBtn.addEventListener("click", function () {
      if (phase !== "net") switchPhase("net");
      matrixOverlay.hidden = !matrixOverlay.hidden;
      matrixBtn.textContent = matrixOverlay.hidden ? (DE ? "Matrizen zeigen" : "Show matrices") : (DE ? "Matrizen schließen" : "Hide matrices");
      updateMatrixCanvases();
    });
    matrixClose.addEventListener("click", function () {
      matrixOverlay.hidden = true;
      matrixBtn.textContent = DE ? "Matrizen zeigen" : "Show matrices";
    });
    function resize() { size = api.fit(canvas, stage); draw(); updateMatrixCanvases(); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries.some(function (en) { return en.isIntersecting; });
        if (!visible) pauseTraining(); else if (training && !timer) trainTick();
      }, { threshold: 0.05 }).observe(stage);
    }
    function nextInternal() {
      var a = active();
      if (training) {
        pauseTraining();
        if (a.model) a.model.stopTraining = true;
        return false;
      }
      if (a.epochs === 0) { resumeTraining(); return true; }
      return false;
    }
    function prevInternal() {
      return false;
    }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); updateMatrixCanvases(); });
    resize();
    if (window.tf) initTf(); else setTimeout(initTf, 300);
    return {
      update: function (s) {
        if (s && s.phase && s.phase !== phase) switchPhase(s.phase);
      },
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) { return api.util.arrowKey(e, nextInternal, prevInternal); },
      resize: resize,
      pause: pauseTraining,
      resume: function () { visible = true; if (training && !timer) trainTick(); },
      destroy: function () {
        training = false;
        if (timer) clearTimeout(timer);
        timer = 0;
        gen++;
        if (data.linear.model) data.linear.model.stopTraining = true;
        if (data.net.model) data.net.model.stopTraining = true;
        var lm = data.linear.model, nm = data.net.model, xs = xsTensor, ys = ysTensor;
        data.linear.model = null; data.net.model = null; xsTensor = null; ysTensor = null;
        setTimeout(function () {
          if (lm) lm.dispose();
          if (nm) nm.dispose();
          if (xs) xs.dispose();
          if (ys) ys.dispose();
        }, 320);
        window.removeEventListener("resize", resize);
        el.remove();
      }
    };
  };
})();
