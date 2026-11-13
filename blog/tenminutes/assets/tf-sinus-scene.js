(function () {
  "use strict";

  window.TfSinusScene = function (root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-sinus-scene";
    el.innerHTML = '<div class="ls-sinus-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-sinus-losschart"><canvas class="ls-sinus-loss-canvas" aria-label="Loss curve"></canvas></div>' +
      '<div class="ls-sinus-controls"><button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-sinus-train">' + (DE ? "Training pausieren" : "Pause training") + '</button>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-sinus-reset">' + (DE ? "Neu starten" : "Restart") + '</button>' +
        '<span class="ls-sinus-loss" aria-live="polite"></span></div>' +
      '<div class="ls-sinus-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-sinus-stage");
    var canvas = el.querySelector("canvas");
    var trainBtn = el.querySelector(".ls-sinus-train");
    var resetBtn = el.querySelector(".ls-sinus-reset");
    var lossCanvas = el.querySelector(".ls-sinus-loss-canvas");
    var lossCtx = null, lossSize = null;
    var lossEl = el.querySelector(".ls-sinus-loss");
    var readout = el.querySelector(".ls-sinus-readout");
    var C = api.colors();
    var size = null, ctx = null, model = null, xsTensor = null, ysTensor = null;
    var points = [], curve = [], trainLoss = 0, epochs = 0, training = false, visible = true, timer = 0, lossHistory = [];
    var drag = null, fitReady = false;
    var TRAIN_END = 0.70, X_MIN = -0.20, X_MAX = 1.20, Y_MIN = -0.45, Y_MAX = 1.15;
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    function truth(x) { return 0.5 + 0.42 * Math.sin(2 * Math.PI * x); }
    function makePoints() {
      points = [];
      var seed = 11;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      for (var i = 0; i < 18; i++) {
        var x = 0.10 + 0.60 * i / 17;
        points.push({ x: x, y: truth(x) + (rnd() - 0.5) * 0.035 });
      }
    }
    function makeTensors() {
      if (xsTensor) xsTensor.dispose();
      if (ysTensor) ysTensor.dispose();
      xsTensor = tf.tensor2d(points.map(function (p) { return [p.x]; }), [points.length, 1]);
      ysTensor = tf.tensor2d(points.map(function (p) { return [p.y]; }), [points.length, 1]);
    }
    function buildModel() {
      if (model) model.dispose();
      model = tf.sequential();
      model.add(tf.layers.dense({ inputShape: [1], units: 32, activation: "relu" }));
      model.add(tf.layers.dense({ units: 32, activation: "relu" }));
      model.add(tf.layers.dense({ units: 32, activation: "relu" }));
      model.add(tf.layers.dense({ units: 1, activation: "linear" }));
      model.compile({ optimizer: tf.train.adam(0.03), loss: "meanSquaredError" });
      epochs = 0; trainLoss = 0; fitReady = true;
    }
    function grid() {
      var out = [];
      for (var i = 0; i <= 120; i++) out.push([X_MIN + (X_MAX - X_MIN) * i / 120]);
      return out;
    }
    function predict() {
      if (!model || !fitReady) return;
      var g = grid();
      var y = tf.tidy(function () { return model.predict(tf.tensor2d(g, [g.length, 1])).dataSync(); });
      curve = [];
      for (var i = 0; i < g.length; i++) curve.push({ x: g[i][0], y: y[i] });
    }
    function outsideError() {
      if (!curve.length) return 0;
      var s = 0, n = 0;
      curve.forEach(function (p) {
        if (p.x < 0.72) return;
        var d = p.y - truth(p.x);
        s += d * d; n++;
      });
      return n ? Math.sqrt(s / n) : 0;
    }
    function px(x) { return 34 + (x - X_MIN) / (X_MAX - X_MIN) * (size.w - 54); }
    function py(y) { return size.h - 38 - (y - Y_MIN) / (Y_MAX - Y_MIN) * (size.h - 70); }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, size.w, size.h);
      var split = px(TRAIN_END);
      ctx.fillStyle = "rgba(159,151,0,.07)";
      ctx.fillRect(split, 28, size.w - 20 - split, size.h - 66);
      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(34, size.h - 38); ctx.lineTo(size.w - 20, size.h - 38); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(34, 20); ctx.lineTo(34, size.h - 38); ctx.stroke();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = C.muted; ctx.globalAlpha = .55;
      ctx.beginPath();
      for (var i = 0; i <= 120; i++) {
        var x = X_MIN + (X_MAX - X_MIN) * i / 120;
        if (i === 0) ctx.moveTo(px(x), py(truth(x))); else ctx.lineTo(px(x), py(truth(x)));
      }
      ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = C.gold; ctx.globalAlpha = .7;
      ctx.beginPath(); ctx.moveTo(split, 20); ctx.lineTo(split, size.h - 38); ctx.stroke(); ctx.restore();
      if (curve.length) {
        ctx.strokeStyle = C.green; ctx.lineWidth = 2.6; ctx.beginPath();
        curve.forEach(function (p, k) { if (k === 0) ctx.moveTo(px(p.x), py(p.y)); else ctx.lineTo(px(p.x), py(p.y)); });
        ctx.stroke();
      }
      points.forEach(function (p) {
        ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 4, 0, Math.PI * 2);
        ctx.fillStyle = C.paper; ctx.fill(); ctx.strokeStyle = C.blue; ctx.lineWidth = 1.6; ctx.stroke();
      });
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(DE ? "links außerhalb" : "left outside", 38, 16);
      ctx.textAlign = "right";
      ctx.fillText(DE ? "rechts außerhalb" : "right outside", size.w - 24, 16);
      ctx.textAlign = "left";
      ctx.fillText("x → 32 → 32 → 32 → 1 · " + (DE ? "Punkte = (x, y)" : "points = (x, y)"), 38, size.h - 18);
      drawLossChart();
      updateReadout();
    }
    function drawLossChart() {
      if (!lossCanvas) return;
      lossSize = api.fit(lossCanvas, lossCanvas.parentNode);
      lossCtx = lossSize.ctx;
      var w = lossSize.w, h = lossSize.h;
      lossCtx.clearRect(0, 0, w, h);
      lossCtx.fillStyle = C.paper; lossCtx.fillRect(0, 0, w, h);
      if (!lossHistory.length) return;
      var max = Math.max.apply(null, lossHistory.concat([1e-6]));
      lossCtx.strokeStyle = C.line; lossCtx.lineWidth = 1;
      lossCtx.beginPath(); lossCtx.moveTo(8, h - 8); lossCtx.lineTo(w - 8, h - 8); lossCtx.stroke();
      lossCtx.strokeStyle = C.gold; lossCtx.lineWidth = 1.8;
      lossCtx.beginPath();
      lossHistory.forEach(function (v, i) {
        var x = 8 + i / Math.max(1, lossHistory.length - 1) * (w - 16);
        var y = h - 8 - (v / max) * (h - 16);
        if (i === 0) lossCtx.moveTo(x, y); else lossCtx.lineTo(x, y);
      });
      lossCtx.stroke();
      lossCtx.fillStyle = C.muted; lossCtx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; lossCtx.textAlign = "left";
      lossCtx.fillText("Loss", 8, 12);
    }
    function updateReadout() {
      lossEl.textContent = "Loss " + (trainLoss || 0).toFixed(4);
      readout.innerHTML = '<span><b>' + (DE ? "Epochen" : "epochs") + '</b> ' + epochs + '</span><span><b>' + (DE ? "Trainings-Loss" : "training loss") + '</b> ' + (trainLoss || 0).toFixed(4) + '</span><span><b>' + (DE ? "außen" : "outside") + '</b> ' + outsideError().toFixed(3) + '</span><span><b>' + (DE ? "Modell" : "model") + '</b> 1 → 32 → 32 → 32 → 1</span><span><b>(x, y)</b> ' + (DE ? "input, output" : "input, output") + '</span>';
    }
    function trainTick() {
      if (!visible || !training || !model) { timer = 0; return; }
      model.fit(xsTensor, ysTensor, { epochs: 1, batchSize: points.length, shuffle: true, verbose: 0 }).then(function (h) {
        trainLoss = h.history.loss[0];
        epochs++;
        lossHistory.push(trainLoss);
        if (lossHistory.length > 80) lossHistory.shift();
        predict();
        draw();
        if (visible && training) timer = setTimeout(trainTick, reduced ? 600 : 90);
      }).catch(function () { timer = 0; });
    }
    function resumeTraining() {
      training = true;
      trainBtn.textContent = DE ? "Training pausieren" : "Pause training";
      if (!timer && visible && model) trainTick();
    }
    function pauseTraining() {
      training = false;
      trainBtn.textContent = DE ? "Training fortsetzen" : "Resume training";
      if (timer) { clearTimeout(timer); timer = 0; }
    }
    function resetAll() {
      if (timer) clearTimeout(timer); timer = 0;
      training = false; lossHistory = []; makePoints(); makeTensors(); buildModel(); predict(); draw();
      trainBtn.textContent = DE ? "Training starten" : "Start training";
    }
    function initTf() {
      if (!window.tf) {
        readout.textContent = DE ? "TF.js konnte nicht geladen werden." : "TF.js could not be loaded.";
        return;
      }
      makePoints(); makeTensors(); buildModel(); predict(); draw();
      trainBtn.textContent = DE ? "Training starten" : "Start training";
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
      var y = Y_MIN + (size.h - 38 - p.y) / (size.h - 70) * (Y_MAX - Y_MIN);
      points[drag].y = Math.max(Y_MIN, Math.min(Y_MAX, y));
      makeTensors();
      draw();
    });
    canvas.addEventListener("pointerup", function () { drag = null; });
    canvas.addEventListener("pointercancel", function () { drag = null; });
    trainBtn.addEventListener("click", function () { if (training) pauseTraining(); else resumeTraining(); });
    resetBtn.addEventListener("click", resetAll);
    function resize() { size = api.fit(canvas, stage); draw(); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries.some(function (en) { return en.isIntersecting; });
        if (!visible) pauseTraining(); else if (training && !timer) trainTick();
      }, { threshold: 0.05 }).observe(stage);
    }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    if (window.tf) initTf(); else setTimeout(initTf, 300);
    return {
      update: function () {},
      resize: resize,
      pause: pauseTraining,
      resume: function () { visible = true; if (training && !timer) trainTick(); },
      destroy: function () {
        if (timer) clearTimeout(timer);
        if (model) model.dispose();
        if (xsTensor) xsTensor.dispose();
        if (ysTensor) ysTensor.dispose();
        window.removeEventListener("resize", resize);
        el.remove();
      }
    };
  };
})();
