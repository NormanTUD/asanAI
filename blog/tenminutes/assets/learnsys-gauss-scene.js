(function () {
  "use strict";

  window.GaussScene = function (root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-gauss-scene";
    el.innerHTML =
      '<div class="ls-gauss-main">' +
        '<div class="ls-gauss-plot"><canvas class="ls-gauss-canvas" role="img"></canvas></div>' +
        '<div class="ls-gauss-error"><canvas class="ls-gauss-error-canvas" aria-label="' + (DE ? "Glockenkurve der Fehler" : "Gaussian error curve") + '"></canvas></div>' +
      '</div>' +
      '<aside class="ls-gauss-side">' +
        '<figure class="ls-gauss-fig"><img src="assets/img/ceres.jpg" alt="' + (DE ? "Ceres, aufgenommen von der NASA-Sonde Dawn" : "Ceres, photographed by NASA's Dawn spacecraft") + '"><figcaption>' + (DE ? "Ceres, Dawn (NASA/JPL-Caltech/UCLA/MPS/DLR/IDA), Bild: Justin Cowart, Public Domain, " : "Ceres, Dawn (NASA/JPL-Caltech/UCLA/MPS/DLR/IDA), image: Justin Cowart, public domain, ") + '<a href="https://commons.wikimedia.org/wiki/File:Ceres_-_RC3_-_Haulani_Crater_(22381131691)_(cropped).jpg" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure>' +
        '<figure class="ls-gauss-fig"><img src="assets/img/flammarion.jpg" alt="' + (DE ? "Der Flammarion-Holzschnitt: ein Wanderer am Rand der Welt blickt in den Sternenhimmel" : "The Flammarion engraving: a traveller at the edge of the world looks into the starry sky") + '"><figcaption>' + (DE ? "The Flammarion Engraving (1888), Unknown Artist, Public Domain, " : "The Flammarion Engraving (1888), Unknown Artist, public domain, ") + '<a href="https://commons.wikimedia.org/wiki/File:Flammarion_Woodcut_1888_Color_2.jpg" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure>' +
      '</aside>' +
      '<div class="ls-gauss-controls">' +
        '<label class="ls-range">' + (DE ? "Teleskop" : "Telescope") + ' <input type="range" class="ls-gauss-quality" min="0" max="1" step="0.01" value="0.35"><output>0.35</output></label>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-gauss-resample">' + (DE ? "Neue Messungen" : "New measurements") + '</button>' +
        '<span class="ls-gauss-status" aria-live="polite"></span>' +
      '</div>' +
      '<div class="ls-gauss-readout" aria-live="polite"></div>' +
      '<p class="ls-gauss-note">' + (DE ? "Synthetische Daten, nicht Piazzis Messungen. Der Plot veranschaulicht das Prinzip." : "Synthetic data, not Piazzi's measurements. The plot illustrates the principle.") + '</p>';
    root.appendChild(el);
    var plot = el.querySelector(".ls-gauss-plot");
    var canvas = el.querySelector(".ls-gauss-canvas");
    var errorCanvas = el.querySelector(".ls-gauss-error-canvas");
    var qualityEl = el.querySelector(".ls-gauss-quality");
    var qualityOut = qualityEl.nextElementSibling;
    var resampleBtn = el.querySelector(".ls-gauss-resample");
    var statusEl = el.querySelector(".ls-gauss-status");
    var readout = el.querySelector(".ls-gauss-readout");
    var C = api.colors();
    var size = null, ctx = null, errorSize = null;
    var quality = 0.35;
    var N = 18;
    var A = 1.0, B = 0.62, PHI = 0.35;
    var z = [], tang = [];
    var seed = 73;
    function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    function gaussian() {
      var u = 0, v = 0;
      while (!u) u = rand();
      while (!v) v = rand();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    function sample() {
      z = []; tang = [];
      for (var i = 0; i < N; i++) { z.push(gaussian()); tang.push(gaussian()); }
    }
    sample();
    function sigma() { return 0.22 - 0.18 * quality; }
    function truePoint(t) {
      var ct = Math.cos(t), st = Math.sin(t), cp = Math.cos(PHI), sp = Math.sin(PHI);
      return [A * ct * cp - B * st * sp, A * ct * sp + B * st * cp];
    }
    function trueCurve(n) {
      var out = [];
      for (var i = 0; i <= n; i++) out.push(truePoint(2 * Math.PI * i / n));
      return out;
    }
    function observation(i, s) {
      var t = 2 * Math.PI * i / N + 0.035 * tang[i];
      var p = truePoint(t);
      var r = Math.hypot(p[0], p[1]) || 1;
      var nx = p[0] / r, ny = p[1] / r;
      var tx = -ny, ty = nx;
      var radial = z[i] * s;
      var lateral = tang[i] * 0.018;
      return [p[0] + nx * radial + tx * lateral, p[1] + ny * radial + ty * lateral];
    }
    function observations(s) {
      var out = [];
      for (var i = 0; i < N; i++) out.push(observation(i, s));
      return out;
    }
    function solve(M, b, n) {
      var a = M.map(function (row, i) { return row.slice().concat([b[i]]); });
      for (var col = 0; col < n; col++) {
        var piv = col;
        for (var r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[piv][col])) piv = r;
        var tmp = a[col]; a[col] = a[piv]; a[piv] = tmp;
        var d = a[col][col] || 1e-9;
        for (var c = col; c <= n; c++) a[col][c] /= d;
        for (var rr = 0; rr < n; rr++) {
          if (rr === col) continue;
          var f = a[rr][col];
          if (!f) continue;
          for (var cc = col; cc <= n; cc++) a[rr][cc] -= f * a[col][cc];
        }
      }
      return a.map(function (row) { return row[n]; });
    }
    function fitCurve(obs) {
      var m = 7, XtX = [], Xtr = [];
      for (var i = 0; i < m; i++) { XtX.push(new Array(m).fill(0)); Xtr.push(0); }
      obs.forEach(function (p) {
        var th = Math.atan2(p[1], p[0]), r = Math.hypot(p[0], p[1]);
        var row = [1, Math.cos(th), Math.sin(th), Math.cos(2 * th), Math.sin(2 * th), Math.cos(3 * th), Math.sin(3 * th)];
        for (var i = 0; i < m; i++) {
          Xtr[i] += row[i] * r;
          for (var j = 0; j < m; j++) XtX[i][j] += row[i] * row[j];
        }
      });
      for (var d = 0; d < m; d++) XtX[d][d] += 1e-7;
      return solve(XtX, Xtr, m);
    }
    function curveFromCoef(c, n) {
      var out = [];
      for (var i = 0; i <= n; i++) {
        var th = 2 * Math.PI * i / n;
        var r = c[0] + c[1] * Math.cos(th) + c[2] * Math.sin(th) + c[3] * Math.cos(2 * th) + c[4] * Math.sin(2 * th) + c[5] * Math.cos(3 * th) + c[6] * Math.sin(3 * th);
        r = Math.max(0.05, r);
        out.push([r * Math.cos(th), r * Math.sin(th)]);
      }
      return out;
    }
    function radiusAt(c, th) {
      var r = c[0] + c[1] * Math.cos(th) + c[2] * Math.sin(th) + c[3] * Math.cos(2 * th) + c[4] * Math.sin(2 * th) + c[5] * Math.cos(3 * th) + c[6] * Math.sin(3 * th);
      return Math.max(0.05, r);
    }
    function nearestDistance(curve, truth) {
      var s = 0;
      curve.forEach(function (p) {
        var best = 1e9;
        truth.forEach(function (q) { var d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < best) best = d; });
        s += best;
      });
      return s / curve.length;
    }
    function rmsResidual(obs, c) {
      var s = 0;
      obs.forEach(function (p) {
        var th = Math.atan2(p[1], p[0]), r = Math.hypot(p[0], p[1]);
        var e = r - radiusAt(c, th);
        s += e * e;
      });
      return Math.sqrt(s / obs.length);
    }
    function mapPoint(p, scale, cx, cy) { return { x: cx + p[0] * scale, y: cy - p[1] * scale }; }
    function drawMain(obs, c, truth) {
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, w, h);
      var g = ctx.createRadialGradient(w * 0.5, h * 0.48, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      g.addColorStop(0, V.alpha(C.paper2, 0.7));
      g.addColorStop(1, V.alpha(C.paper, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      V.grid(ctx, w, h, C, 32, 0.13);
      var scale = Math.min(w * 0.37, h * 0.40);
      var cx = w * 0.5, cy = h * 0.5;
      var fitted = curveFromCoef(c, 180);
      ctx.save();
      ctx.strokeStyle = V.alpha(C.green, 0.55);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      truth.forEach(function (p, i) { var q = mapPoint(p, scale, cx, cy); if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); });
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = C.petrol;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      fitted.forEach(function (p, i) { var q = mapPoint(p, scale, cx, cy); if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); });
      ctx.stroke();
      ctx.restore();
      obs.forEach(function (p) {
        var th = Math.atan2(p[1], p[0]);
        var r = radiusAt(c, th);
        var fit = [r * Math.cos(th), r * Math.sin(th)];
        var a = mapPoint(p, scale, cx, cy), b = mapPoint(fit, scale, cx, cy);
        ctx.save();
        ctx.strokeStyle = V.alpha(C.lilac, 0.72);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(a.x, a.y, 3.4, 0, Math.PI * 2);
        ctx.fillStyle = C.gold;
        ctx.fill();
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
      var sun = mapPoint([0, 0], scale, cx, cy);
      var sunGlow = ctx.createRadialGradient(sun.x, sun.y, 1, sun.x, sun.y, 18);
      sunGlow.addColorStop(0, V.alpha(C.gold, 0.65));
      sunGlow.addColorStop(1, V.alpha(C.gold, 0));
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sun.x, sun.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sun.x, sun.y, 4.6, 0, Math.PI * 2);
      ctx.fillStyle = C.gold;
      ctx.fill();
      V.label(ctx, DE ? "Sonne" : "Sun", sun.x + 8, sun.y - 8, { font: '600 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif', color: C.gold, bg: false });
      var ceres = mapPoint(truth[0], scale, cx, cy);
      ctx.beginPath();
      ctx.arc(ceres.x, ceres.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = C.blue;
      ctx.fill();
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      V.label(ctx, "Ceres", ceres.x + 8, ceres.y - 10, { font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Barlow", sans-serif', color: C.blue });
      V.label(ctx, DE ? "wahre Bahn" : "true orbit", w - 18, h - 18, { font: '600 ' + Math.max(9, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: C.green, align: "right", bg: false });
      V.label(ctx, DE ? "Ausgleichskurve" : "least-squares fit", 18, h - 18, { font: '600 ' + Math.max(9, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: C.petrol, bg: false });
      canvas.setAttribute("aria-label", DE
        ? "Wahre Ceres-Bahn, verrauschte Beobachtungen und eine Ausgleichskurve nach der Methode der kleinsten Quadrate. Streuung " + V.fmt(sigma(), 2) + "."
        : "True Ceres orbit, noisy observations, and a least-squares fit. Scatter " + V.fmt(sigma(), 2) + ".");
    }
    function drawError(obs, c) {
      errorSize = api.fit(errorCanvas, errorCanvas.parentNode);
      var ctx2 = errorSize.ctx, w = errorSize.w, h = errorSize.h;
      ctx2.clearRect(0, 0, w, h);
      ctx2.fillStyle = C.paper;
      ctx2.fillRect(0, 0, w, h);
      var pad = 14;
      var s = sigma();
      var xMax = 0.8;
      function X(x) { return pad + (x + xMax) / (2 * xMax) * (w - pad * 2); }
      var base = h - 16;
      ctx2.strokeStyle = C.line;
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.moveTo(pad, base);
      ctx2.lineTo(w - pad, base);
      ctx2.stroke();
      ctx2.save();
      ctx2.beginPath();
      ctx2.moveTo(X(-xMax), base);
      for (var i = 0; i <= 80; i++) {
        var x = -xMax + 2 * xMax * i / 80;
        var y = Math.exp(-(x * x) / (2 * s * s));
        ctx2.lineTo(X(x), base - y * (h - 30));
      }
      ctx2.lineTo(X(xMax), base);
      ctx2.closePath();
      ctx2.fillStyle = V.alpha(C.gold, 0.13);
      ctx2.fill();
      ctx2.restore();
      ctx2.save();
      ctx2.setLineDash([3, 3]);
      ctx2.strokeStyle = V.alpha(C.line, 0.9);
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.moveTo(X(0), 16);
      ctx2.lineTo(X(0), base);
      ctx2.stroke();
      ctx2.restore();
      ctx2.strokeStyle = V.alpha(C.gold, 0.9);
      ctx2.lineWidth = 2;
      ctx2.beginPath();
      for (var j = 0; j <= 80; j++) {
        var xj = -xMax + 2 * xMax * j / 80;
        var yj = Math.exp(-(xj * xj) / (2 * s * s));
        if (j === 0) ctx2.moveTo(X(xj), base - yj * (h - 30)); else ctx2.lineTo(X(xj), base - yj * (h - 30));
      }
      ctx2.stroke();
      obs.forEach(function (p) {
        var th = Math.atan2(p[1], p[0]);
        var e = Math.hypot(p[0], p[1]) - radiusAt(c, th);
        if (Math.abs(e) > xMax) return;
        ctx2.save();
        ctx2.strokeStyle = V.alpha(C.lilac, 0.65);
        ctx2.lineWidth = 1;
        ctx2.beginPath();
        ctx2.moveTo(X(e), base - 3);
        ctx2.lineTo(X(e), base - 11);
        ctx2.stroke();
        ctx2.restore();
      });
      V.label(ctx2, DE ? "Fehler" : "error", pad, 10, { font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Barlow", sans-serif', color: C.petrol, bg: false });
      V.label(ctx2, "σ " + V.fmt(s, 2), w - pad, 10, { font: '600 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif', color: C.muted, align: "right", bg: false });
      V.label(ctx2, "−3σ", pad, base + 10, { font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: C.muted, bg: false });
      V.label(ctx2, "0", w / 2, base + 10, { font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: C.muted, align: "center", bg: false });
      V.label(ctx2, "+3σ", w - pad, base + 10, { font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif', color: C.muted, align: "right", bg: false });
    }
    function draw() {
      if (!size) return;
      var s = sigma();
      var obs = observations(s);
      var c = fitCurve(obs);
      var truth = trueCurve(220);
      drawMain(obs, c, truth);
      drawError(obs, c);
      var rms = rmsResidual(obs, c);
      var fitError = nearestDistance(curveFromCoef(c, 160), truth);
      readout.innerHTML = '<span><b>' + (DE ? "Streuung" : "scatter") + '</b> σ ' + V.fmt(s, 2) + '</span>' +
        '<span><b>' + (DE ? "Beobachtungen" : "observations") + '</b> ' + N + '</span>' +
        '<span><b>' + (DE ? "Ausgleichsfehler" : "fit error") + '</b> ' + V.fmt(rms, 3) + '</span>' +
        '<span><b>' + (DE ? "Nähe zur Bahn" : "distance to orbit") + '</b> ' + V.fmt(fitError, 3) + '</span>' +
        '<span><b>' + (DE ? "Methode" : "method") + '</b> ' + (DE ? "kleinste Quadrate" : "least squares") + '</span>';
      statusEl.textContent = DE ? "Gauß glaubt keiner einzelnen Messung." : "Gauss believes no single measurement.";
    }
    function resize() { size = api.fit(canvas, plot); draw(); }
    qualityEl.addEventListener("input", function () {
      quality = parseFloat(qualityEl.value) || 0;
      qualityOut.textContent = quality.toFixed(2);
      draw();
    });
    resampleBtn.addEventListener("click", function () { sample(); draw(); });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    return {
      update: function () {},
      resize: resize,
      pause: function () {},
      resume: function () { draw(); },
      destroy: function () { window.removeEventListener("resize", resize); el.remove(); }
    };
  };
})();
