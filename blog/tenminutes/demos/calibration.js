(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function calibrationScene(root, api) {
    var DE = api.lang === "de";
    // Synthetic claims: confidence and correctness. The data are illustrative.
    var claims = [
      // p, correct
      [0.96, true], [0.95, false], [0.94, true], [0.93, false], [0.92, true],
      [0.90, false], [0.89, true], [0.88, true], [0.86, false], [0.85, true],
      [0.84, true], [0.83, false], [0.82, true], [0.81, true], [0.80, false],
      [0.78, true], [0.76, false], [0.74, true], [0.72, true], [0.70, false],
      [0.68, true], [0.66, true], [0.64, false], [0.62, true], [0.60, false],
      [0.58, true], [0.56, true], [0.54, false], [0.52, true], [0.50, true],
      [0.47, false], [0.44, true], [0.41, false], [0.38, true], [0.35, false],
      [0.32, true], [0.29, true], [0.26, false], [0.23, true], [0.20, false],
      [0.95, true], [0.94, true], [0.93, false], [0.91, true], [0.89, false],
      [0.87, true], [0.85, false], [0.83, true], [0.80, true], [0.77, false]
    ].map(function (x) { return { c: x[0], ok: x[1] }; });
    var hallucinations = claims.filter(function (x) { return x.c > 0.8 && !x.ok; }).length;
    var temp = 1, targetTemp = 1, tempTween = 0, tempStart = 0, tempDur = 420;
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var el = document.createElement("div");
    el.className = "ls-cal-scene";
    el.innerHTML =
      '<div class="ls-cal-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-cal-controls"><label class="ls-range">' + (DE ? "Temperatur" : "temperature") + ' <input type="range" class="ls-cal-temp" min="0.6" max="2.4" step="0.05" value="1"><output>1.00</output></label></div>' +
      '<div class="ls-cal-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-cal-stage");
    var canvas = el.querySelector("canvas");
    var tempEl = el.querySelector(".ls-cal-temp");
    var tempOut = el.querySelector(".ls-cal-controls output");
    var readout = el.querySelector(".ls-cal-readout");
    var size = null, ctx = null;
    var C = api.colors();
    function scale(p, T) {
      var p2 = clamp(p, 0.001, 0.999);
      var logit = Math.log(p2 / (1 - p2));
      return 1 / (1 + Math.exp(-logit / T));
    }
    function binsFor(T) {
      var bins = [];
      for (var i = 0; i < 4; i++) bins.push({ sum: 0, n: 0, ok: 0 });
      claims.forEach(function (x) {
        var c = scale(x.c, T);
        var b = Math.min(3, Math.floor(c * 4));
        bins[b].sum += c;
        bins[b].n++;
        if (x.ok) bins[b].ok++;
      });
      return bins.filter(function (b) { return b.n > 0; }).map(function (b, i) {
        return { x: b.sum / b.n, y: b.ok / b.n, n: b.n, i: i };
      });
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h, padL = 40, padR = 16, padT = 18, padB = 32;
      ctx.clearRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      bg.addColorStop(0, "rgba(247,250,249,.95)");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      var plotW = Math.max(70, w - padL - padR), plotH = Math.max(70, h - padT - padB);
      function X(v) { return padL + v * plotW; }
      function Y(v) { return h - padB - v * plotH; }
      // grid
      ctx.strokeStyle = "rgba(0,75,111,.08)";
      ctx.lineWidth = 1;
      for (var g = 1; g < 4; g++) {
        ctx.beginPath(); ctx.moveTo(X(g / 4), Y(0)); ctx.lineTo(X(g / 4), Y(1)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(X(0), Y(g / 4)); ctx.lineTo(X(1), Y(g / 4)); ctx.stroke();
      }
      // diagonal
      ctx.strokeStyle = C.muted;
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1), Y(1)); ctx.stroke();
      ctx.setLineDash([]);
      // axes
      ctx.strokeStyle = C.lineStrong;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB); ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(DE ? "Konfidenz des Modells" : "model confidence", (padL + w - padR) / 2, h - 15);
      ctx.save();
      ctx.translate(12, (padT + h - padB) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = "top";
      ctx.fillText(DE ? "Trefferquote" : "accuracy", 0, 0);
      ctx.restore();
      ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillStyle = C.muted;
      ctx.fillText(DE ? "perfekt kalibriert" : "perfectly calibrated", X(0.55), Y(0.55) - 8);
      // high-confidence band
      ctx.fillStyle = "rgba(145,133,190,.06)";
      ctx.fillRect(X(0.8), padT, X(1) - X(0.8), h - padB - padT);
      ctx.fillStyle = C.lilac;
      ctx.font = '600 9px "Open Sans", sans-serif';
      ctx.textAlign = "right"; ctx.textBaseline = "top";
      ctx.fillText(DE ? "hohe Konfidenz" : "high confidence", X(1) - 4, padT + 3);
      // ghost of the unscaled reliability curve
      var baseBins = binsFor(1);
      if (baseBins.length > 1) {
        ctx.strokeStyle = C.muted;
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        baseBins.forEach(function (b, i) {
          if (i === 0) ctx.moveTo(X(b.x), Y(b.y)); else ctx.lineTo(X(b.x), Y(b.y));
        });
        ctx.stroke();
        ctx.setLineDash([]);
        baseBins.forEach(function (b) {
          ctx.strokeStyle = C.muted;
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), 2.5, 0, Math.PI * 2); ctx.stroke();
        });
      }
      // points + line
      var bins = binsFor(temp);
      if (bins.length > 1) {
        ctx.strokeStyle = C.petrol;
        ctx.lineWidth = 2;
        ctx.beginPath();
        bins.forEach(function (b, i) {
          if (i === 0) ctx.moveTo(X(b.x), Y(b.y)); else ctx.lineTo(X(b.x), Y(b.y));
        });
        ctx.stroke();
      }
      bins.forEach(function (b) {
        var over = b.x - b.y > 0.10;
        var under = b.y - b.x > 0.10;
        var col = over ? C.lilac : (under ? C.gold : C.green);
        var r = 4 + Math.min(7, b.n * 0.45);
        ctx.shadowColor = col;
        ctx.shadowBlur = 12;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.stroke();
      });
      // readout
      var overBins = bins.filter(function (b) { return b.x - b.y > 0.10; }).length;
      tempOut.textContent = temp.toFixed(2);
      readout.innerHTML =
        '<span><b>T</b> ' + temp.toFixed(2) + '</span>' +
        '<span><b>' + (DE ? "Halluzinationen" : "hallucinations") + '</b> ' + hallucinations + ' ' + (DE ? "(p > 80 %, falsch)" : "(p > 80%, wrong)") + '</span>' +
        '<span><b>' + (DE ? "überconfident" : "overconfident") + '</b> ' + overBins + '</span>';
      canvas.setAttribute("aria-label", DE
        ? "Kalibrierungsdiagramm: Konfidenz gegen Trefferquote bei Temperatur " + temp.toFixed(2) + "."
        : "Calibration diagram: confidence against accuracy at temperature " + temp.toFixed(2) + ".");
    }
    function setTemp(v) {
      targetTemp = clamp(parseFloat(v) || 1, 0.6, 2.4);
      if (reduced) { temp = targetTemp; draw(); return; }
      tempStart = performance.now();
      if (tempTween) cancelAnimationFrame(tempTween);
      var from = temp;
      function step(now) {
        var t = Math.min(1, (now - tempStart) / tempDur);
        var e = ease(t);
        temp = lerp(from, targetTemp, e);
        draw();
        tempTween = t < 1 ? requestAnimationFrame(step) : 0;
      }
      tempTween = requestAnimationFrame(step);
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    tempEl.addEventListener("input", function () { setTemp(tempEl.value); });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    return {
      update: function () {},
      resize: resize,
      destroy: function () { if (tempTween) cancelAnimationFrame(tempTween); window.removeEventListener("resize", resize); el.remove(); }
    };
  }
  core.register("calibration", calibrationScene);
})();
