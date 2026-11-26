(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;

  var RES = 50;
  var PIXELS = RES * RES;
  var OCTAVES = 5;
  var INPUT_DIM = 2 + 4 * OCTAVES;
  var LAYERS = [96, 96, 96, 96];
  var BATCH = 512;
  var LR = 0.01;
  var SPS = 60;
  var VIEW_N = 72;
  var HISTORY_MAX = 520;
  var OPERA = "opera.jpg";

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function nextSeed() {
    return ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0) || 1;
  }

  function encodePoint(out, o, x, y) {
    out[o++] = x;
    out[o++] = y;
    for (var k = 0; k < OCTAVES; k++) {
      var freq = Math.PI * Math.pow(2, k);
      out[o++] = Math.sin(freq * x);
      out[o++] = Math.cos(freq * x);
      out[o++] = Math.sin(freq * y);
      out[o++] = Math.cos(freq * y);
    }
    return o;
  }

  function waitTf(asset) {
    if (window.tf) return Promise.resolve(window.tf);
    if (window.__eoyTfPromise) return window.__eoyTfPromise;
    window.__eoyTfPromise = new Promise(function (resolve, reject) {
      var done = false;
      var poll = 0;
      function finish(ok) {
        if (done) return;
        done = true;
        if (poll) clearInterval(poll);
        if (window.tf) resolve(window.tf);
        else if (ok) setTimeout(function () {
          if (window.tf) resolve(window.tf);
          else reject(new Error("tf"));
        }, 60);
        else reject(new Error("tf"));
      }
      var existing = document.querySelector('script[src*="tf.min.js"]');
      if (existing) {
        existing.addEventListener("load", function () { finish(true); });
        existing.addEventListener("error", function () { finish(false); });
        var tries = 0;
        poll = setInterval(function () {
          if (window.tf) finish(true);
          else if (++tries > 240) finish(false);
        }, 50);
        return;
      }
      var script = document.createElement("script");
      script.src = asset || "assets/tf.min.js";
      script.async = true;
      script.onload = function () { finish(true); };
      script.onerror = function () { finish(false); };
      document.head.appendChild(script);
    });
    var promise = window.__eoyTfPromise;
    promise.catch(function () {
      if (window.__eoyTfPromise === promise) window.__eoyTfPromise = null;
    });
    return promise;
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.decoding = "async";
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("image")); };
      img.src = src;
    });
  }

  function fallbackImage() {
    var c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    var x = c.getContext("2d");
    var bg = x.createLinearGradient(0, 0, 512, 512);
    bg.addColorStop(0, "#e9f3ee");
    bg.addColorStop(0.5, "#d6e8f0");
    bg.addColorStop(1, "#f3efe0");
    x.fillStyle = bg;
    x.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 9; i++) {
      var cx = 90 + (i * 97) % 350;
      var cy = 80 + (i * 61) % 360;
      var r = 40 + (i * 37) % 130;
      var g = x.createRadialGradient(cx, cy, 4, cx, cy, r);
      g.addColorStop(0, ["#63a44b", "#1275ac", "#9f9700", "#9185be"][i % 4]);
      g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g;
      x.beginPath();
      x.arc(cx, cy, r, 0, Math.PI * 2);
      x.fill();
    }
    var img = new Image();
    return new Promise(function (resolve, reject) {
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("image")); };
      img.src = c.toDataURL("image/png");
    });
  }

  function imageScene(root, api) {
    var DE = api.lang === "de";
    function L(de, en) { return DE ? de : en; }

    var el = document.createElement("div");
    el.className = "ls-imagelab";
    el.innerHTML =
      '<div class="ls-il-topline">' +
        '<span class="ls-il-kicker">' + L("Bild als Funktion", "An image as a function") + '</span>' +
        '<span class="ls-il-formula">(x, y) &rarr; (R, G, B)</span>' +
      '</div>' +
      '<div class="ls-il-grid">' +
        '<figure class="ls-il-card ls-il-target">' +
          '<div class="ls-il-cardhead"><span>' + L("Ziel", "Target") + '</span><span class="ls-il-meta">50 &times; 50 &times; 3</span></div>' +
          '<div class="ls-il-canvaswrap"><canvas class="ls-il-target-canvas" role="img" aria-label="' + L("Zielbild: das Beispiel, zentriert auf 50 mal 50 Pixel und in Farbe.", "Target image: the example, centre-cropped to 50 by 50 pixels and in colour.") + '"></canvas></div>' +
          '<figcaption class="ls-il-caption"><span class="ls-il-name">' + L("Opera (Beispiel)", "Opera (example)") + '</span><span>' + L("2.500 Pixel", "2,500 pixels") + '</span></figcaption>' +
        '</figure>' +
        '<figure class="ls-il-card ls-il-pred">' +
          '<div class="ls-il-cardhead"><span>' + L("Vorhersage", "Prediction") + '</span><span class="ls-il-live"><i></i><span class="ls-il-live-label">' + L("Lädt", "Loading") + '</span></span></div>' +
          '<div class="ls-il-canvaswrap"><canvas class="ls-il-pred-canvas" role="img" aria-label="' + L("Vorhersage des Netzes: für jede Koordinate eine Farbe.", "Network prediction: a colour for every coordinate.") + '"></canvas><span class="ls-il-badge">' + L("Netz", "net") + '</span></div>' +
          '<figcaption class="ls-il-caption"><span>' + L("nur (x, y) als Eingabe", "only (x, y) as input") + '</span><span class="ls-il-epoch">' + L("Epoche", "Epoch") + ' <b>0.00</b></span></figcaption>' +
        '</figure>' +
        '<aside class="ls-il-side">' +
          '<div class="ls-il-card ls-il-loss">' +
            '<div class="ls-il-cardhead"><span>Loss</span><span class="ls-il-lossval">–</span></div>' +
            '<div class="ls-il-losschart"><canvas class="ls-il-loss-canvas" role="img" aria-label="' + L("Loss-Kurve: zeigt, wie der Fehler während des Trainings fällt.", "Loss curve: shows how the error falls during training.") + '"></canvas></div>' +
            '<div class="ls-il-losscaption"><span>' + L("bester", "best") + ' <b class="ls-il-best">–</b></span><span>' + L("MSE", "MSE") + '</span></div>' +
          '</div>' +
          '<div class="ls-il-status" aria-live="polite"><span class="ls-il-status-dot"></span><span class="ls-il-status-text">' + L("Netz wird vorbereitet …", "Preparing network …") + '</span></div>' +
          '<div class="ls-il-controls">' +
            '<button type="button" class="ls-btn ls-btn--tiny ls-il-toggle" disabled data-tip="' + L("Pausiert das Training. Das Netz lernt nur, solange diese Folie aktiv ist.", "Pauses training. The network learns only while this slide is active.") + '">' + L("Training starten", "Start training") + '</button>' +
            '<button type="button" class="ls-btn ls-btn--tiny ls-il-reset" disabled data-tip="' + L("Baut das Netz mit neuen Zufallsgewichten neu und startet das Training von vorn.", "Rebuilds the network with new random weights and starts training from scratch.") + '">' + L("Neu starten", "Restart") + '</button>' +
          '</div>' +
        '</aside>' +
      '</div>' +
      '<details class="ls-il-optional">' +
        '<summary><span>' + L("Eigenes Bild & Grenzen", "Own image & limits") + '</span><span class="ls-il-optional-hint">' + L("optional", "optional") + '</span></summary>' +
        '<div class="ls-il-optional-body">' +
          '<div class="ls-il-uploadrow">' +
            '<label class="ls-btn ls-btn--tiny ls-il-upload">' + L("Eigenes Bild", "Own image") + '<input type="file" class="ls-il-file" accept="image/*"></label>' +
            '<button type="button" class="ls-btn ls-btn--tiny ls-il-restore">' + L("Opera", "Opera") + '</button>' +
            '<span class="ls-il-filename">' + L("Opera (Beispiel)", "Opera (example)") + '</span>' +
          '</div>' +
          '<p class="ls-il-hint">' + L("Jedes Bild wird zentriert auf 50 × 50 Pixel gebracht und in RGB gelernt. Uploads bleiben im Browser.", "Every image is centre-cropped to 50 × 50 pixels and learned in RGB. Uploads stay in the browser.") + '</p>' +
          '<div class="ls-il-extrarow">' +
            '<label class="ls-il-check"><input type="checkbox" class="ls-il-extrap"> ' + L("Außerhalb des gelernten Bereichs", "Outside the trained region") + '</label>' +
            '<label class="ls-il-range">' + L("Rand", "Margin") + ' <output class="ls-il-factor">1,5×</output><input type="range" class="ls-il-factorinput" min="1.05" max="3" step="0.05" value="1.5" disabled></label>' +
          '</div>' +
          '<p class="ls-il-hint ls-il-extranote">' + L("Das Netz kennt nur x, y ∈ [−1, 1]. Außerhalb rechnet es weiter, aber dort gab es keine Daten.", "The network only knows x, y ∈ [−1, 1]. Outside it keeps computing, but there was no data there.") + '</p>' +
        '</div>' +
      '</details>';
    root.appendChild(el);

    var targetCv = el.querySelector(".ls-il-target-canvas");
    var predCv = el.querySelector(".ls-il-pred-canvas");
    var lossCv = el.querySelector(".ls-il-loss-canvas");
    var lossVal = el.querySelector(".ls-il-lossval");
    var bestVal = el.querySelector(".ls-il-best");
    var epochEl = el.querySelector(".ls-il-epoch b");
    var liveEl = el.querySelector(".ls-il-live");
    var liveLabel = el.querySelector(".ls-il-live-label");
    var statusEl = el.querySelector(".ls-il-status");
    var statusText = el.querySelector(".ls-il-status-text");
    var toggleBtn = el.querySelector(".ls-il-toggle");
    var resetBtn = el.querySelector(".ls-il-reset");
    var fileInput = el.querySelector(".ls-il-file");
    var fileName = el.querySelector(".ls-il-filename");
    var restoreBtn = el.querySelector(".ls-il-restore");
    var extrapCheck = el.querySelector(".ls-il-extrap");
    var factorOut = el.querySelector(".ls-il-factor");
    var factorInput = el.querySelector(".ls-il-factorinput");
    var extraNote = el.querySelector(".ls-il-extranote");
    var grid = el.querySelector(".ls-il-grid");

    var C = api.colors();
    var st = {
      dead: false,
      booting: false,
      ready: false,
      active: false,
      running: false,
      userPaused: false,
      model: null,
      opt: null,
      xTrain: null,
      yTrain: null,
      xView: null,
      viewN: 0,
      viewFactor: 1.5,
      viewToken: 0,
      viewData: null,
      viewBusy: false,
      pred: null,
      predBusy: false,
      predDirty: true,
      pendingLoss: null,
      target: null,
      targetOff: null,
      step: 0,
      seen: 0,
      loss: NaN,
      best: Infinity,
      history: [],
      gen: 0,
      extrap: false,
      idx: new Int32Array(BATCH),
      off: document.createElement("canvas"),
      raf: 0,
      lastTs: 0,
      acc: 0,
      lastTrainPred: 0,
      lastViewPred: 0,
      startTimer: 0,
      webgl: true
    };
    var rng = mulberry32(1);

    function preprocess(img) {
      if (!img) return false;
      var iw = img.naturalWidth || img.width;
      var ih = img.naturalHeight || img.height;
      if (!iw || !ih) return false;
      var side = Math.min(iw, ih);
      var sx = (iw - side) / 2;
      var sy = (ih - side) / 2;
      var c = document.createElement("canvas");
      c.width = RES;
      c.height = RES;
      var ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return false;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, side, side, 0, 0, RES, RES);
      var data;
      try {
        data = ctx.getImageData(0, 0, RES, RES).data;
      } catch (e) {
        return false;
      }
      var target = new Float32Array(PIXELS * 3);
      for (var i = 0; i < PIXELS; i++) {
        target[i * 3] = data[i * 4] / 255;
        target[i * 3 + 1] = data[i * 4 + 1] / 255;
        target[i * 3 + 2] = data[i * 4 + 2] / 255;
      }
      st.target = target;
      st.targetOff = c;
      return true;
    }

    function buildTrainTensors() {
      if (!window.tf || !st.target) return;
      var feats = new Float32Array(PIXELS * INPUT_DIM);
      var labels = new Float32Array(PIXELS * 3);
      var o = 0;
      for (var row = 0; row < RES; row++) {
        for (var col = 0; col < RES; col++) {
          var idx = row * RES + col;
          var x = ((col + 0.5) / RES) * 2 - 1;
          var y = ((row + 0.5) / RES) * 2 - 1;
          o = encodePoint(feats, o, x, y);
          labels[idx * 3] = st.target[idx * 3];
          labels[idx * 3 + 1] = st.target[idx * 3 + 1];
          labels[idx * 3 + 2] = st.target[idx * 3 + 2];
        }
      }
      var oldX = st.xTrain;
      var oldY = st.yTrain;
      st.xTrain = tf.tensor2d(feats, [PIXELS, INPUT_DIM]);
      st.yTrain = tf.tensor2d(labels, [PIXELS, 3]);
      if (oldX) setTimeout(function () { try { oldX.dispose(); } catch (e) {} }, 4000);
      if (oldY) setTimeout(function () { try { oldY.dispose(); } catch (e) {} }, 4000);
    }

    function makeModel(seed) {
      var model = tf.sequential();
      for (var i = 0; i < LAYERS.length; i++) {
        model.add(tf.layers.dense({
          inputShape: i === 0 ? [INPUT_DIM] : undefined,
          units: LAYERS[i],
          activation: "tanh",
          kernelInitializer: tf.initializers.glorotUniform({ seed: (seed + i * 2654435761) >>> 0 }),
          biasInitializer: "zeros"
        }));
      }
      model.add(tf.layers.dense({
        units: 3,
        activation: "linear",
        kernelInitializer: tf.initializers.glorotUniform({ seed: (seed ^ 0x9E3779B9) >>> 0 }),
        biasInitializer: "zeros"
      }));
      return model;
    }

    function makeOptimizer() {
      var old = st.opt;
      st.opt = tf.train.adam(LR);
      if (old && old.dispose) setTimeout(function () { try { old.dispose(); } catch (e) {} }, 600);
    }

    function resetNetwork(seed) {
      if (!st.ready || st.dead) return;
      st.gen++;
      var seedValue = (seed == null ? nextSeed() : seed) >>> 0;
      rng = mulberry32(seedValue || 1);
      var oldModel = st.model;
      st.model = makeModel(seedValue);
      makeOptimizer();
      st.step = 0;
      st.seen = 0;
      st.loss = NaN;
      st.best = Infinity;
      st.history = [];
      st.pred = null;
      st.viewData = null;
      st.predBusy = false;
      st.viewBusy = false;
      st.predDirty = true;
      st.lastTrainPred = 0;
      st.lastViewPred = 0;
      st.acc = 0;
      if (st.pendingLoss) { try { st.pendingLoss.dispose(); } catch (e) {} st.pendingLoss = null; }
      if (oldModel) setTimeout(function () { try { oldModel.dispose(); } catch (e) {} }, 4000);
      drawTarget();
      drawPrediction();
      drawLoss();
      updateReadout();
      updateUi();
      if (st.active) {
        requestTrainPrediction(true);
        if (st.extrap) requestViewPrediction(true);
      }
    }

    function computeLoss(data) {
      if (!data || !st.target) return NaN;
      var sum = 0;
      for (var i = 0; i < PIXELS * 3; i++) {
        var d = data[i] - st.target[i];
        sum += d * d;
      }
      return sum / (PIXELS * 3);
    }

    function pushHistory(step, loss) {
      if (!isFinite(loss)) return;
      st.history.push({ s: step, l: loss });
      if (st.history.length > HISTORY_MAX) {
        var out = [];
        for (var i = 0; i < st.history.length; i += 2) out.push(st.history[i]);
        var last = st.history[st.history.length - 1];
        if (out[out.length - 1] !== last) out.push(last);
        st.history = out;
      }
    }

    function trainStep() {
      if (!st.model || !st.opt || !st.xTrain || !st.yTrain) return false;
      var idxT = null;
      var xb = null;
      var yb = null;
      try {
        for (var i = 0; i < BATCH; i++) st.idx[i] = (rng() * PIXELS) | 0;
        idxT = tf.tensor1d(st.idx, "int32");
        xb = tf.gather(st.xTrain, idxT);
        yb = tf.gather(st.yTrain, idxT);
        var vars = st.model.trainableWeights.map(function (w) { return w.val; });
        var lossT = st.opt.minimize(function () {
          var pred = st.model.apply(xb);
          var diff = pred.sub(yb);
          return tf.mean(tf.square(diff));
        }, true, vars);
        if (st.pendingLoss) { try { st.pendingLoss.dispose(); } catch (e) {} }
        st.pendingLoss = lossT;
        st.step++;
        st.seen += BATCH;
        return true;
      } catch (e) {
        st.running = false;
        st.userPaused = true;
        stopLoop();
        updateUi();
        if (statusText) statusText.textContent = L("Training angehalten. Bitte neu starten.", "Training stopped. Please restart.");
        return false;
      } finally {
        if (xb) xb.dispose();
        if (yb) yb.dispose();
        if (idxT) idxT.dispose();
      }
    }

    function requestTrainPrediction(force) {
      if (!st.model || !st.xTrain || st.predBusy || st.dead) return;
      if (!force && (document.hidden || !st.active)) return;
      var gen = st.gen;
      st.predBusy = true;
      var out = null;
      try {
        out = st.model.apply(st.xTrain);
      } catch (e) {
        st.predBusy = false;
        return;
      }
      out.data().then(function (data) {
        if (gen !== st.gen || st.dead) return;
        st.pred = data;
        st.predDirty = false;
        var loss = computeLoss(data);
        if (isFinite(loss)) {
          st.loss = loss;
          if (loss < st.best) st.best = loss;
          pushHistory(st.step, loss);
        }
        drawPrediction();
        drawLoss();
        updateReadout();
      }).catch(function () {}).finally(function () {
        try { out.dispose(); } catch (e) {}
        if (gen === st.gen) st.predBusy = false;
      });
    }

    function buildViewInput() {
      if (!window.tf) return;
      var oldView = st.xView;
      st.xView = null;
      st.viewToken++;
      if (oldView) setTimeout(function () { try { oldView.dispose(); } catch (e) {} }, 4000);
      var n = VIEW_N;
      var f = st.viewFactor;
      var feats = new Float32Array(n * n * INPUT_DIM);
      var o = 0;
      for (var row = 0; row < n; row++) {
        for (var col = 0; col < n; col++) {
          var x = -f + ((col + 0.5) / n) * 2 * f;
          var y = -f + ((row + 0.5) / n) * 2 * f;
          o = encodePoint(feats, o, x, y);
        }
      }
      st.xView = tf.tensor2d(feats, [n * n, INPUT_DIM]);
      st.viewN = n;
      st.viewData = null;
    }

    function requestViewPrediction(force) {
      if (!st.model || !st.xView || st.viewBusy || st.dead) return;
      if (!force && (document.hidden || !st.active)) return;
      var gen = st.gen;
      var token = st.viewToken;
      var factor = st.viewFactor;
      st.viewBusy = true;
      var out = null;
      try {
        out = st.model.apply(st.xView);
      } catch (e) {
        st.viewBusy = false;
        return;
      }
      out.data().then(function (data) {
        if (gen !== st.gen || token !== st.viewToken || factor !== st.viewFactor || st.dead) return;
        st.viewData = data;
        drawPrediction();
      }).catch(function () {}).finally(function () {
        try { out.dispose(); } catch (e) {}
        if (gen === st.gen && token === st.viewToken && factor === st.viewFactor) st.viewBusy = false;
      });
    }

    function placeholder(ctx, w, h, text) {
      ctx.save();
      ctx.fillStyle = C.paper2 || C.paper || "#f7f9f8";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = C.muted || "#627476";
      ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, w / 2, h / 2);
      ctx.restore();
    }

    function drawTarget() {
      var f = api.fit(targetCv, targetCv.parentElement);
      if (!f.w || !f.h) return;
      f.ctx.clearRect(0, 0, f.w, f.h);
      if (st.targetOff) {
        f.ctx.imageSmoothingEnabled = true;
        f.ctx.imageSmoothingQuality = "high";
        f.ctx.drawImage(st.targetOff, 0, 0, RES, RES, 0, 0, f.w, f.h);
      } else {
        placeholder(f.ctx, f.w, f.h, L("Bild lädt …", "Image loading …"));
      }
    }

    function drawExtrapFrame(ctx, w, h) {
      var m = (st.viewFactor - 1) / (2 * st.viewFactor);
      var x = m * w;
      var y = m * h;
      var sw = w - 2 * x;
      var sh = h - 2 * y;
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.petrol || "#004b6f";
      ctx.globalAlpha = 0.6;
      ctx.strokeRect(x + 0.5, y + 0.5, sw - 1, sh - 1);
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      var label = L("gelernt", "trained");
      ctx.font = '600 9px ui-monospace, SFMono-Regular, Menlo, monospace';
      var tw = ctx.measureText(label).width;
      ctx.globalAlpha = 0.88;
      ctx.fillStyle = C.paper || "#ffffff";
      ctx.fillRect(x + 7, y + 7, tw + 12, 18);
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.petrol || "#004b6f";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + 13, y + 16.5);
      ctx.restore();
    }

    function drawPrediction() {
      var f = api.fit(predCv, predCv.parentElement);
      if (!f.w || !f.h) return;
      var ctx = f.ctx;
      ctx.clearRect(0, 0, f.w, f.h);
      var data = st.extrap ? st.viewData : st.pred;
      var n = st.extrap ? st.viewN : RES;
      if (!data || !n) {
        placeholder(ctx, f.w, f.h, L("Netz rechnet …", "Network computing …"));
        if (st.extrap) drawExtrapFrame(ctx, f.w, f.h);
        return;
      }
      if (st.off.width !== n || st.off.height !== n) {
        st.off.width = n;
        st.off.height = n;
      }
      var octx = st.off.getContext("2d");
      var img = octx.createImageData(n, n);
      for (var i = 0; i < n * n; i++) {
        var q = i * 4;
        img.data[q] = clamp(data[i * 3], 0, 1) * 255;
        img.data[q + 1] = clamp(data[i * 3 + 1], 0, 1) * 255;
        img.data[q + 2] = clamp(data[i * 3 + 2], 0, 1) * 255;
        img.data[q + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(st.off, 0, 0, n, n, 0, 0, f.w, f.h);
      if (st.extrap) drawExtrapFrame(ctx, f.w, f.h);
    }

    function drawLoss() {
      var f = api.fit(lossCv, lossCv.parentElement);
      if (!f.w || !f.h) return;
      var ctx = f.ctx;
      ctx.clearRect(0, 0, f.w, f.h);
      ctx.strokeStyle = C.line || "#dbe3e0";
      ctx.lineWidth = 1;
      for (var i = 1; i < 4; i++) {
        var gy = Math.round((i / 4) * f.h) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(f.w, gy);
        ctx.stroke();
      }
      var hist = st.history;
      if (hist.length < 2) {
        placeholder(ctx, f.w, f.h, L("warte auf Loss …", "waiting for loss …"));
        return;
      }
      var min = Infinity;
      var max = -Infinity;
      for (var j = 0; j < hist.length; j++) {
        if (hist[j].l < min) min = hist[j].l;
        if (hist[j].l > max) max = hist[j].l;
      }
      if (!isFinite(min) || !isFinite(max)) return;
      var span = max - min;
      if (span < 1e-9) span = Math.max(1e-6, Math.abs(max) * 0.1);
      var pad = span * 0.14;
      min -= pad;
      max += pad;
      var x0 = 6;
      var x1 = f.w - 6;
      var y0 = 6;
      var y1 = f.h - 6;
      var s0 = hist[0].s;
      var s1 = hist[hist.length - 1].s;
      if (s1 === s0) s1 = s0 + 1;
      function px(s) { return x0 + ((s - s0) / (s1 - s0)) * (x1 - x0); }
      function py(l) { return y1 - ((l - min) / (max - min)) * (y1 - y0); }
      ctx.beginPath();
      ctx.moveTo(px(hist[0].s), py(hist[0].l));
      for (var k = 1; k < hist.length; k++) ctx.lineTo(px(hist[k].s), py(hist[k].l));
      ctx.lineTo(px(hist[hist.length - 1].s), y1);
      ctx.lineTo(px(hist[0].s), y1);
      ctx.closePath();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = C.green || "#63a44b";
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(px(hist[0].s), py(hist[0].l));
      for (var m = 1; m < hist.length; m++) ctx.lineTo(px(hist[m].s), py(hist[m].l));
      ctx.strokeStyle = C.green || "#63a44b";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
      var last = hist[hist.length - 1];
      ctx.beginPath();
      ctx.arc(px(last.s), py(last.l), 3.2, 0, Math.PI * 2);
      ctx.fillStyle = C.green || "#63a44b";
      ctx.fill();
    }

    function updateReadout() {
      var loss = st.loss;
      if (lossVal) lossVal.textContent = isFinite(loss) ? loss.toFixed(4) : "–";
      if (bestVal) bestVal.textContent = isFinite(st.best) ? st.best.toFixed(4) : "–";
      if (epochEl) epochEl.textContent = (st.seen / PIXELS).toFixed(2);
    }

    function updateUi() {
      if (!toggleBtn || !resetBtn) return;
      if (!st.ready) {
        toggleBtn.disabled = true;
        resetBtn.disabled = true;
        if (liveEl) liveEl.classList.remove("is-live", "is-paused");
        if (liveLabel) liveLabel.textContent = L("Lädt", "Loading");
        if (statusText) statusText.textContent = L("Netz wird vorbereitet …", "Preparing network …");
        if (statusEl) statusEl.classList.remove("is-live");
        el.classList.remove("is-training");
        return;
      }
      toggleBtn.disabled = false;
      resetBtn.disabled = false;
      toggleBtn.textContent = st.running ? L("Pause", "Pause") : L("Training starten", "Start training");
      if (liveEl) {
        liveEl.classList.toggle("is-live", st.running);
        liveEl.classList.toggle("is-paused", !st.running && st.userPaused);
      }
      if (liveLabel) liveLabel.textContent = st.running ? L("Live", "Live") : (st.userPaused ? L("Pause", "Paused") : L("Bereit", "Ready"));
      if (statusText) {
        statusText.textContent = st.running
          ? L("Das Netz sieht nur (x, y) und lernt die Farbe.", "The network sees only (x, y) and learns the colour.")
          : (st.userPaused ? L("Pausiert. Die Folie ist aktiv, das Training steht.", "Paused. The slide is active, training is stopped.") : L("Bereit.", "Ready."));
      }
      if (statusEl) statusEl.classList.toggle("is-live", st.running);
      el.classList.toggle("is-training", st.running);
    }

    function frame(ts) {
      if (!st.active || st.dead) {
        st.raf = 0;
        return;
      }
      st.raf = requestAnimationFrame(frame);
      var now = ts || performance.now();
      if (!st.lastTs) st.lastTs = now;
      var dt = Math.min(120, now - st.lastTs);
      st.lastTs = now;
      if (st.running && !document.hidden) {
        var sps = st.webgl ? SPS : 16;
        var cap = st.webgl ? 4 : 1;
        var dtStep = Math.min(0.03, dt / 1000);
        var target = Math.min(cap, dtStep * sps + st.acc);
        var n = Math.floor(target);
        st.acc = target - n;
        var t0 = performance.now();
        for (var i = 0; i < n; i++) {
          if (i > 0 && performance.now() - t0 > 13) break;
          if (!trainStep()) break;
        }
        if (st.pendingLoss) {
          try { st.pendingLoss.dataSync(); } catch (e) {}
          try { st.pendingLoss.dispose(); } catch (e) {}
          st.pendingLoss = null;
        }
      }
      var predInterval = st.webgl ? 280 : 900;
      var viewInterval = st.webgl ? 520 : 1400;
      if ((st.running || st.predDirty) && !st.predBusy && now - st.lastTrainPred > predInterval) {
        st.lastTrainPred = now;
        requestTrainPrediction(false);
      }
      if (st.extrap && !st.viewBusy && now - st.lastViewPred > (st.running ? viewInterval : viewInterval + 500)) {
        st.lastViewPred = now;
        requestViewPrediction(false);
      }
    }

    function ensureLoop() {
      if (st.raf || st.dead || !st.active) return;
      st.lastTs = 0;
      st.raf = requestAnimationFrame(frame);
    }

    function stopLoop() {
      if (st.raf) cancelAnimationFrame(st.raf);
      st.raf = 0;
      st.lastTs = 0;
    }

    function clearStart() {
      if (st.startTimer) clearTimeout(st.startTimer);
      st.startTimer = 0;
    }

    function scheduleStart() {
      if (st.dead || !st.ready) return;
      st.running = true;
      updateUi();
      if (st.raf) return;
      clearStart();
      st.startTimer = setTimeout(function () {
        st.startTimer = 0;
        if (st.dead || !st.active || st.userPaused || !st.ready || !st.running || document.hidden) return;
        st.acc = 0;
        st.lastTs = 0;
        ensureLoop();
      }, 320);
    }

    function setActive(active) {
      st.active = !!active;
      if (st.active) {
        if (!st.userPaused && st.ready) {
          st.lastTs = 0;
          if (st.running) ensureLoop();
          else scheduleStart();
        } else {
          st.running = false;
          clearStart();
        }
        if (st.ready) {
          st.lastTrainPred = 0;
          requestTrainPrediction(true);
          if (st.extrap) {
            st.lastViewPred = 0;
            requestViewPrediction(true);
          }
        }
      } else {
        st.running = false;
        clearStart();
        stopLoop();
      }
      updateUi();
    }

    function toggleTraining() {
      if (!st.ready) return;
      if (st.running) {
        st.userPaused = true;
        st.running = false;
        st.acc = 0;
        clearStart();
        stopLoop();
      } else {
        st.userPaused = false;
        st.running = true;
        st.acc = 0;
        clearStart();
        ensureLoop();
      }
      updateUi();
    }

    function formatFactor(v) {
      var s = String(Math.round(v * 100) / 100);
      return DE ? s.replace(".", ",") : s;
    }

    function updateExtraNote() {
      if (!extraNote) return;
      extraNote.textContent = st.extrap
        ? L("Die Vorhersage zeigt ±" + formatFactor(st.viewFactor) + "×. Nur das gestrichelte Quadrat war im Training.", "The prediction shows ±" + formatFactor(st.viewFactor) + "×. Only the dashed square was in training.")
        : L("Das Netz kennt nur x, y ∈ [−1, 1]. Außerhalb rechnet es weiter, aber dort gab es keine Daten.", "The network only knows x, y ∈ [−1, 1]. Outside it keeps computing, but there was no data there.");
    }

    function setExtrap(on) {
      st.extrap = !!on;
      if (factorInput) factorInput.disabled = !st.extrap;
      if (st.extrap) {
        buildViewInput();
        st.viewBusy = false;
        st.lastViewPred = 0;
        requestViewPrediction(true);
      } else {
        st.viewData = null;
        st.viewBusy = false;
      }
      updateExtraNote();
      drawPrediction();
    }

    function setFactor(value) {
      var f = clamp(Number(value) || 1.5, 1.05, 3);
      st.viewFactor = f;
      if (factorOut) factorOut.textContent = formatFactor(f) + "×";
      if (!st.extrap) {
        updateExtraNote();
        return;
      }
      buildViewInput();
      st.viewBusy = false;
      st.lastViewPred = 0;
      requestViewPrediction(true);
      updateExtraNote();
      drawPrediction();
    }

    function adoptImage(img, name) {
      if (!img || !preprocess(img)) return false;
      if (fileName) fileName.textContent = name;
      drawTarget();
      if (!st.ready) return true;
      st.userPaused = false;
      buildTrainTensors();
      resetNetwork(nextSeed());
      if (st.active) scheduleStart();
      return true;
    }

    function loadOpera() {
      loadImage(api.asset(OPERA)).then(function (img) {
        if (st.dead) return;
        if (adoptImage(img, L("Opera (Beispiel)", "Opera (example)"))) return;
        if (statusText) statusText.textContent = L("Das Bild konnte nicht gelesen werden.", "The image could not be read.");
      }).catch(function () {
        if (statusText) statusText.textContent = L("Das Bild konnte nicht geladen werden.", "The image could not be loaded.");
      });
    }

    function handleFile(file) {
      if (!file || !/^image\//.test(file.type || "")) {
        if (extraNote) extraNote.textContent = L("Bitte eine Bilddatei auswählen.", "Please choose an image file.");
        return;
      }
      var url = URL.createObjectURL(file);
      loadImage(url).then(function (img) {
        URL.revokeObjectURL(url);
        if (st.dead) return;
        if (!adoptImage(img, file.name || L("Eigenes Bild", "Own image"))) {
          if (extraNote) extraNote.textContent = L("Dieses Bild konnte nicht gelesen werden.", "This image could not be read.");
        }
      }).catch(function () {
        URL.revokeObjectURL(url);
        if (extraNote) extraNote.textContent = L("Dieses Bild konnte nicht gelesen werden.", "This image could not be read.");
      });
    }

    function boot() {
      if (st.booting || st.ready || st.dead) return;
      st.booting = true;
      updateUi();
      waitTf(api.asset("assets/tf.min.js")).then(function () {
        if (st.dead) return null;
        return window.tf.ready();
      }).then(function () {
        if (st.dead) return null;
        st.webgl = !!(window.tf.getBackend && window.tf.getBackend() === "webgl");
        return loadImage(api.asset(OPERA)).catch(function () { return fallbackImage(); });
      }).then(function (img) {
        if (st.dead || !img) return;
        if (!preprocess(img)) throw new Error("image");
        if (fileName) fileName.textContent = L("Opera (Beispiel)", "Opera (example)");
        buildTrainTensors();
        st.ready = true;
        st.booting = false;
        buildViewInput();
        resetNetwork(nextSeed());
        drawTarget();
        updateUi();
        if (st.active && !st.userPaused) scheduleStart();
      }).catch(function () {
        st.booting = false;
        st.ready = false;
        updateUi();
        if (statusText) statusText.textContent = L("TF.js oder das Bild konnte nicht geladen werden.", "TF.js or the image could not be loaded.");
      });
    }

    function onVisibility() {
      if (document.hidden) {
        stopLoop();
      } else if (st.active && st.running) {
        st.lastTs = 0;
        ensureLoop();
      }
    }

    function resize() {
      C = api.colors();
      drawTarget();
      drawPrediction();
      drawLoss();
    }

    function destroy() {
      st.dead = true;
      clearStart();
      stopLoop();
      document.removeEventListener("visibilitychange", onVisibility);
      if (st.pendingLoss) { try { st.pendingLoss.dispose(); } catch (e) {} st.pendingLoss = null; }
      if (st.model) { try { st.model.dispose(); } catch (e) {} st.model = null; }
      if (st.opt && st.opt.dispose) { try { st.opt.dispose(); } catch (e) {} st.opt = null; }
      if (st.xTrain) { try { st.xTrain.dispose(); } catch (e) {} st.xTrain = null; }
      if (st.yTrain) { try { st.yTrain.dispose(); } catch (e) {} st.yTrain = null; }
      if (st.xView) { try { st.xView.dispose(); } catch (e) {} st.xView = null; }
      if (el.parentNode) el.parentNode.removeChild(el);
    }

    toggleBtn.addEventListener("click", toggleTraining);
    resetBtn.addEventListener("click", function () {
      st.userPaused = false;
      resetNetwork(nextSeed());
      if (st.active) scheduleStart();
      updateUi();
    });
    restoreBtn.addEventListener("click", loadOpera);
    fileInput.addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
      e.target.value = "";
    });
    extrapCheck.addEventListener("change", function () { setExtrap(extrapCheck.checked); });
    factorInput.addEventListener("input", function () { setFactor(factorInput.value); });
    document.addEventListener("visibilitychange", onVisibility);
    grid.addEventListener("dragover", function (e) {
      e.preventDefault();
      grid.classList.add("is-drop");
    });
    grid.addEventListener("dragleave", function (e) {
      if (!grid.contains(e.relatedTarget)) grid.classList.remove("is-drop");
    });
    grid.addEventListener("drop", function (e) {
      e.preventDefault();
      grid.classList.remove("is-drop");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    drawTarget();
    drawPrediction();
    drawLoss();
    updateReadout();
    updateUi();
    updateExtraNote();
    if (factorOut) factorOut.textContent = formatFactor(st.viewFactor) + "×";

    return {
      update: function () {},
      resume: function () {
        setActive(true);
        if (!st.ready) boot();
      },
      pause: function () { setActive(false); },
      resize: resize,
      destroy: destroy
    };
  }

  core.register("imagelab", imageScene);
})();
