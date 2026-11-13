(function () {
  "use strict";

  window.GaussScene = function (root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-gauss-scene";
    el.innerHTML =
      '<div class="ls-gauss-plots">' +
        '<div class="ls-gauss-plot-title">' + (DE ? "Ceres: Wahrheit gegen verrauschte Beobachtungen" : "Ceres: truth vs. noisy observations") + '</div>' +
        '<div class="ls-gauss-panel ls-gauss-panel--scatter"><canvas class="ls-gauss-canvas" role="img"></canvas></div>' +
        '<div class="ls-gauss-panel ls-gauss-panel--hist"><canvas class="ls-gauss-error-canvas" aria-label="' + (DE ? "Fehlerverteilung und Glockenkurve" : "Error distribution and bell curve") + '"></canvas></div>' +
      '</div>' +
      '<aside class="ls-gauss-side">' +
        '<figure class="ls-gauss-fig"><img src="assets/img/ceres.jpg" alt="' + (DE ? "Ceres, aufgenommen von der NASA-Sonde Dawn" : "Ceres, photographed by NASA's Dawn spacecraft") + '"><figcaption>' + (DE ? "Ceres, Dawn (NASA/JPL-Caltech/UCLA/MPS/DLR/IDA), Bild: Justin Cowart, Public Domain, " : "Ceres, Dawn (NASA/JPL-Caltech/UCLA/MPS/DLR/IDA), image: Justin Cowart, public domain, ") + '<a href="https://commons.wikimedia.org/wiki/File:Ceres_-_RC3_-_Haulani_Crater_(22381131691)_(cropped).jpg" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure>' +
        '<figure class="ls-gauss-fig"><img src="assets/img/flammarion.jpg" alt="' + (DE ? "Der Flammarion-Holzschnitt: ein Wanderer am Rand der Welt blickt in den Sternenhimmel" : "The Flammarion engraving: a traveller at the edge of the world looks into the starry sky") + '"><figcaption>' + (DE ? "The Flammarion Engraving (1888), Unknown Artist, Public Domain, " : "The Flammarion Engraving (1888), Unknown Artist, public domain, ") + '<a href="https://commons.wikimedia.org/wiki/File:Flammarion_Woodcut_1888_Color_2.jpg" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure>' +
      '</aside>' +
      '<div class="ls-gauss-controls">' +
        '<div class="ls-gauss-telescope">' +
          '<span>' + (DE ? "Bessere Teleskope" : "Better telescopes") + '</span>' +
          '<input type="range" class="ls-gauss-quality" min="0.1" max="2" step="0.1" value="2">' +
          '<span>' + (DE ? "Schlechtere Teleskope" : "Worse telescopes") + '</span>' +
          '<output>σ 2.0</output>' +
        '</div>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-gauss-resample">' + (DE ? "Neue Messungen" : "New measurements") + '</button>' +
        '<span class="ls-gauss-status" aria-live="polite"></span>' +
      '</div>' +
      '<div class="ls-gauss-readout" aria-live="polite"></div>' +
      '<p class="ls-gauss-note">' + (DE ? "Synthetische Daten, nicht Piazzis Messungen. Der Plot ist nur zur Veranschaulichung da." : "Synthetic data, not Piazzi's measurements. The plot is only here to show the idea.") + '</p>';
    root.appendChild(el);
    var plotCanvas = el.querySelector(".ls-gauss-canvas");
    var errorCanvas = el.querySelector(".ls-gauss-error-canvas");
    var qualityEl = el.querySelector(".ls-gauss-quality");
    var qualityOut = el.querySelector(".ls-gauss-telescope output");
    var resampleBtn = el.querySelector(".ls-gauss-resample");
    var statusEl = el.querySelector(".ls-gauss-status");
    var readout = el.querySelector(".ls-gauss-readout");
    var C = api.colors();
    var plotSize = null, errorSize = null;
    var N = 150;
    var sigma = 2;
    var xs = [], zs = [];
    var seed = 73;
    function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    function gaussian() {
      var u = 0, v = 0;
      while (!u) u = rand();
      while (!v) v = rand();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    function sample() {
      xs = []; zs = [];
      for (var i = 0; i < N; i++) { xs.push(rand() * 10); zs.push(gaussian()); }
    }
    function truth(x) { return Math.sin(x / 2) * 3 + 5; }
    function obsY(i) { return truth(xs[i]) + zs[i] * sigma; }
    sample();
    function axes(ctx, w, h, pad, xMin, xMax, yMin, yMax, xLabel, yLabel, ticksX, ticksY) {
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, h - pad);
      ctx.lineTo(w - pad, h - pad);
      ctx.moveTo(pad, h - pad);
      ctx.lineTo(pad, pad);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      (ticksX || []).forEach(function (t) {
        var x = pad + (t - xMin) / (xMax - xMin) * (w - pad * 2);
        ctx.fillText(String(t), x, h - pad + 5);
      });
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      (ticksY || []).forEach(function (t) {
        var y = h - pad - (t - yMin) / (yMax - yMin) * (h - pad * 2);
        ctx.fillText(String(t), pad - 5, y);
      });
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(xLabel, w / 2, h - 2);
      ctx.save();
      ctx.translate(11, h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = "top";
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }
    function legend(ctx, x, y, items) {
      items.forEach(function (it) {
        ctx.save();
        ctx.strokeStyle = it.color;
        ctx.fillStyle = it.color;
        ctx.lineWidth = it.line ? 2 : 0;
        if (it.line) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 12, y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x + 6, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        V.label(ctx, it.label, x + 17, y, {
          font: '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif',
          color: C.muted, bg: false
        });
        x += 17 + ctx.measureText(it.label).width + 16;
      });
    }
    function drawScatter() {
      plotSize = api.fit(plotCanvas, plotCanvas.parentNode);
      var ctx = plotSize.ctx, w = plotSize.w, h = plotSize.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, w, h);
      V.grid(ctx, w, h, C, 22, 0.12);
      var pad = 34;
      var xMin = 0, xMax = 10, yMin = 0, yMax = 10;
      axes(ctx, w, h, pad, xMin, xMax, yMin, yMax, DE ? "Zeit / Bogen" : "Time / Arc", DE ? "Himmelsposition" : "Celestial Position", [0, 5, 10], [0, 5, 10]);
      function X(x) { return pad + (x - xMin) / (xMax - xMin) * (w - pad * 2); }
      function Y(y) { return h - pad - (y - yMin) / (yMax - yMin) * (h - pad * 2); }
      ctx.save();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (var i = 0; i <= 220; i++) {
        var x = xMin + (xMax - xMin) * i / 220;
        if (i === 0) ctx.moveTo(X(x), Y(truth(x))); else ctx.lineTo(X(x), Y(truth(x)));
      }
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.55;
      for (var k = 0; k < N; k++) {
        var y = obsY(k);
        ctx.beginPath();
        ctx.arc(X(xs[k]), Y(y), 2.7, 0, Math.PI * 2);
        ctx.fillStyle = C.blue;
        ctx.fill();
      }
      ctx.restore();
      legend(ctx, pad, 12, [
        { label: DE ? "Wahre Bahn" : "True Orbit", color: C.green, line: true },
        { label: DE ? "Beobachtungen" : "Observations", color: C.blue, line: false }
      ]);
    }
    function drawError() {
      errorSize = api.fit(errorCanvas, errorCanvas.parentNode);
      var ctx = errorSize.ctx, w = errorSize.w, h = errorSize.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, w, h);
      V.grid(ctx, w, h, C, 22, 0.12);
      var pad = 34;
      var xMin = -4, xMax = 4;
      var errors = [];
      for (var i = 0; i < N; i++) errors.push(zs[i] * sigma);
      var bins = 20, counts = new Array(bins).fill(0);
      var binW = (xMax - xMin) / bins;
      errors.forEach(function (e) {
        var b = Math.floor((e - xMin) / binW);
        if (b >= 0 && b < bins) counts[b]++;
      });
      var densities = counts.map(function (c) { return c / (N * binW); });
      var pdfMax = 1 / (sigma * Math.sqrt(2 * Math.PI));
      var yMax = Math.max(pdfMax, Math.max.apply(null, densities)) * 1.08;
      axes(ctx, w, h, pad, xMin, xMax, 0, yMax, DE ? "Residuum (Δ)" : "Residual Error (Δ)", DE ? "Wahrscheinlichkeitsdichte" : "Probability Density", [-4, 0, 4], []);
      function X(x) { return pad + (x - xMin) / (xMax - xMin) * (w - pad * 2); }
      function Y(y) { return h - pad - y / yMax * (h - pad * 2); }
      for (var b = 0; b < bins; b++) {
        var x0 = xMin + b * binW, x1 = x0 + binW;
        var y0 = Y(0), y1 = Y(densities[b]);
        ctx.fillStyle = V.alpha(C.blue, 0.28);
        ctx.fillRect(X(x0) + 0.5, y1, Math.max(1, X(x1) - X(x0) - 1), y0 - y1);
        ctx.strokeStyle = V.alpha(C.blue, 0.55);
        ctx.lineWidth = 1;
        ctx.strokeRect(X(x0) + 0.5, y1, Math.max(1, X(x1) - X(x0) - 1), y0 - y1);
      }
      ctx.save();
      ctx.strokeStyle = C.lilac;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (var j = 0; j <= 160; j++) {
        var x = xMin + (xMax - xMin) * j / 160;
        var pdf = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(x / sigma, 2));
        if (j === 0) ctx.moveTo(X(x), Y(pdf)); else ctx.lineTo(X(x), Y(pdf));
      }
      ctx.stroke();
      ctx.restore();
      legend(ctx, pad, 12, [
        { label: DE ? "Fehlerverteilung" : "Actual Error Dist.", color: C.blue, line: false },
        { label: DE ? "Glockenkurve" : "Theoretical Curve", color: C.lilac, line: true }
      ]);
    }
    function draw() {
      drawScatter();
      drawError();
      var mean = 0;
      for (var i = 0; i < N; i++) mean += zs[i] * sigma;
      mean /= N;
      readout.innerHTML = '<span><b>' + (DE ? "Streuung" : "scatter") + '</b> σ ' + sigma.toFixed(1) + '</span>' +
        '<span><b>' + (DE ? "Beobachtungen" : "observations") + '</b> ' + N + '</span>' +
        '<span><b>' + (DE ? "Mittlerer Fehler" : "mean error") + '</b> ' + (mean >= 0 ? "+" : "") + mean.toFixed(2) + '</span>' +
        '<span><b>' + (DE ? "Methode" : "method") + '</b> ' + (DE ? "kleinste Quadrate" : "least squares") + '</span>';
      statusEl.textContent = DE ? "Gauß glaubt keiner einzelnen Messung." : "Gauss believes no single measurement.";
    }
    function resize() { draw(); }
    qualityEl.addEventListener("input", function () {
      sigma = parseFloat(qualityEl.value) || 2;
      qualityOut.textContent = "σ " + sigma.toFixed(1);
      draw();
    });
    resampleBtn.addEventListener("click", function () { sample(); draw(); });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    return {
      update: function (s) {
        if (!s) return;
        if (s.phase === "intro") { el.classList.add("is-intro"); return; }
        el.classList.remove("is-intro");
        if (typeof s.sigma === "number") {
          sigma = Math.max(0.1, Math.min(2, s.sigma));
          qualityEl.value = String(sigma);
          qualityOut.textContent = "σ " + sigma.toFixed(1);
        }
        resize();
      },
      resize: resize,
      pause: function () {},
      resume: function () { draw(); },
      destroy: function () { window.removeEventListener("resize", resize); el.remove(); }
    };
  };
})();
