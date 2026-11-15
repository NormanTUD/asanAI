(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function crossEntropyScene(root, api) {
    var DE = api.lang === "de";
    var tokens = ["Paris", "London", "Berlin", "the"];
    var initial = [1.0, 2.2, 0.6, 0.2];
    var logits = initial.slice();
    var target = 0, lr = 0.9;
    var history = [];
    var tween = 0, tweenFrom = null, tweenTo = null, tweenStart = 0, tweenDur = 560;
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var el = document.createElement("div");
    el.className = "ls-ce-scene";
    el.innerHTML =
      '<div class="ls-ce-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-ce-controls">' +
        '<span class="ls-ce-control-label">' + (DE ? "Ziel-Token" : "target token") + '</span>' +
        '<span class="ls-ce-targets"></span>' +
        '<button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-ce-train">' + (DE ? "Trainingsschritt" : "Training step") + '</button>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-ce-reset">' + (DE ? "Zurücksetzen" : "Reset") + '</button>' +
      '</div>' +
      '<div class="ls-ce-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-ce-stage");
    var canvas = el.querySelector("canvas");
    var targetsEl = el.querySelector(".ls-ce-targets");
    var trainBtn = el.querySelector(".ls-ce-train");
    var resetBtn = el.querySelector(".ls-ce-reset");
    var readout = el.querySelector(".ls-ce-readout");
    var size = null, ctx = null;
    var C = api.colors();
    function softmax(z) {
      var max = Math.max.apply(null, z);
      var ex = z.map(function (v) { return Math.exp(v - max); });
      var sum = ex.reduce(function (a, b) { return a + b; }, 0);
      return ex.map(function (e) { return e / sum; });
    }
    function lossOf(p) { return -Math.log(Math.max(1e-9, p[target])); }
    function gradients(p) {
      return p.map(function (v, i) { return v - (i === target ? 1 : 0); });
    }
    function maxLoss() { return 3.0; }
    function buildTargets() {
      targetsEl.innerHTML = "";
      tokens.forEach(function (tok, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ls-chip" + (i === target ? " is-on" : "");
        b.textContent = tok;
        b.addEventListener("click", function () {
          target = i;
          history = [lossOf(softmax(logits))];
          buildTargets();
          draw();
        });
        targetsEl.appendChild(b);
      });
    }
    function applyLogits(next) {
      logits = next.slice();
      draw();
    }
    function trainStep() {
      if (tween) { cancelAnimationFrame(tween); tween = 0; }
      var p = softmax(logits);
      var g = gradients(p);
      var next = logits.map(function (z, i) { return z - lr * g[i]; });
      tweenFrom = logits.slice();
      tweenTo = next;
      tweenStart = performance.now();
      history.push(lossOf(p));
      if (history.length > 28) history.shift();
      if (reduced) {
        applyLogits(next);
        history.push(lossOf(softmax(next)));
        if (history.length > 28) history.shift();
        return;
      }
      function step(now) {
        var t = Math.min(1, (now - tweenStart) / tweenDur);
        var e = ease(t);
        logits = tweenFrom.map(function (z, i) { return lerp(z, tweenTo[i], e); });
        draw();
        if (t < 1) tween = requestAnimationFrame(step);
        else {
          logits = tweenTo.slice();
          tween = 0;
          history.push(lossOf(softmax(logits)));
          if (history.length > 28) history.shift();
          draw();
        }
      }
      tween = requestAnimationFrame(step);
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h, pad = 16;
      ctx.clearRect(0, 0, w, h);
      var p = softmax(logits);
      var loss = lossOf(p);
      var g = gradients(p);
      var top = 6;
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(DE ? "Die Hauptstadt von Frankreich ist ___" : "The capital of France is ___", pad, top);
      var gaugeW = Math.min(170, w * 0.34);
      var leftW = w - gaugeW - pad * 2;
      var rowH = Math.max(38, (h - 52) / tokens.length);
      var barX = pad + 92;
      var barMax = Math.max(70, leftW - 120);
      tokens.forEach(function (tok, i) {
        var y = 34 + i * rowH;
        var isTarget = i === target;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isTarget ? C.green : C.ink;
        ctx.font = (isTarget ? '700 ' : '600 ') + api.font("canvas") + 'px "Open Sans", sans-serif';
        ctx.fillText(tok, barX - 10, y + 10);
        ctx.fillStyle = isTarget ? "rgba(99,164,75,.14)" : "rgba(0,75,111,.06)";
        ctx.fillRect(barX, y - 1, barMax, 22);
        ctx.strokeStyle = isTarget ? C.green : C.lineStrong;
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, y - 1, barMax, 22);
        var bw = Math.max(2, p[i] * barMax);
        ctx.fillStyle = isTarget ? C.green : C.sky;
        ctx.fillRect(barX, y - 1, bw, 22);
        ctx.fillStyle = isTarget ? C.greenDeep || C.petrol : C.muted;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillText((p[i] * 100).toFixed(1) + "%", barX + barMax + 8, y + 10);
        ctx.fillStyle = i === target ? C.green : C.muted;
        ctx.fillText((DE ? "∇ " : "grad ") + (g[i] >= 0 ? "+" : "") + g[i].toFixed(2), barX + 4, y + 28);
      });
      // loss gauge
      var cx = w - pad - gaugeW / 2;
      var cy = h * 0.50;
      var r = Math.min(gaugeW * 0.38, h * 0.25);
      var start = Math.PI * 0.75, end = Math.PI * 2.25;
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(0,75,111,.10)";
      ctx.beginPath(); ctx.arc(cx, cy, r, start, end); ctx.stroke();
      var ratio = clamp(loss / maxLoss(), 0, 1);
      ctx.strokeStyle = ratio < 0.45 ? C.green : (ratio < 0.75 ? C.gold : C.lilac);
      ctx.beginPath(); ctx.arc(cx, cy, r, start, start + (end - start) * ratio); ctx.stroke();
      ctx.lineCap = "butt";
      ctx.fillStyle = C.muted;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "Cross-Entropy" : "cross-entropy", cx, cy - 18);
      ctx.fillStyle = C.ink;
      ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif';
      ctx.fillText(loss.toFixed(3), cx, cy + 2);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "−log p(Ziel)" : "−log p(target)", cx, cy + 24);
      // sparkline
      var sx = cx - r * 0.9, sy = cy + r + 18, sw = r * 1.8, sh = 28;
      ctx.strokeStyle = "rgba(0,75,111,.12)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, sy + sh); ctx.lineTo(sx + sw, sy + sh); ctx.stroke();
      if (history.length > 1) {
        var maxH = Math.max.apply(null, history.concat([0.4]));
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        history.forEach(function (v, i) {
          var x = sx + (i / (history.length - 1)) * sw;
          var y = sy + sh - (v / maxH) * sh;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    }
    function resize() {
      size = api.fit(canvas, stage);
      draw();
    }
    function reset() {
      if (tween) { cancelAnimationFrame(tween); tween = 0; }
      logits = initial.slice();
      history = [lossOf(softmax(logits))];
      draw();
    }
    trainBtn.addEventListener("click", trainStep);
    resetBtn.addEventListener("click", reset);
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    buildTargets();
    reset();
    resize();
    return {
      update: function () {},
      resize: resize,
      destroy: function () {
        if (tween) cancelAnimationFrame(tween);
        window.removeEventListener("resize", resize);
        el.remove();
      }
    };
  }
  core.register("crossentropy", crossEntropyScene);
})();
