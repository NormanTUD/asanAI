(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function crossEntropyScene(root, api) {
    var DE = api.lang === "de";
    var tokens = ["Paris", "London", "Berlin", "the"];
    var initial = [1.69, 2.2, 0.77, 0.37];
    var logits = initial.slice();
    var target = 0, lr = 0.9;
    var history = [];
    var tween = 0, tweenFrom = null, tweenTo = null, tweenStart = 0, tweenDur = 560, pulseStart = 0, prevProbs = null;
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
          prevProbs = null;
          pulseStart = 0;
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
      prevProbs = p.slice();
      var g = gradients(p);
      var next = logits.map(function (z, i) { return z - lr * g[i]; });
      tweenFrom = logits.slice();
      tweenTo = next;
      tweenStart = performance.now();
      pulseStart = tweenStart;
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
      var bg = ctx.createRadialGradient(w * 0.38, h * 0.35, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      bg.addColorStop(0, "rgba(247,250,249,.96)");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      var p = softmax(logits);
      var loss = lossOf(p);
      var g = gradients(p);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(DE ? "Die Hauptstadt von Frankreich ist ___" : "The capital of France is ___", pad, 6);
      var gaugeW = Math.min(190, w * 0.30);
      var towersW = w - gaugeW - pad * 2;
      var topY = 40, baseY = h - 58;
      var maxH = Math.max(30, baseY - topY);
      var n = tokens.length;
      var gap = Math.max(10, towersW * 0.06);
      var tw = Math.min(58, (towersW - gap * (n - 1)) / n);
      var startX = pad + Math.max(0, (towersW - (tw * n + gap * (n - 1))) / 2);
      var centers = tokens.map(function (_, i) { return startX + i * (tw + gap) + tw / 2; });
      // soft horizontal guide lines
      ctx.strokeStyle = "rgba(0,75,111,.05)";
      ctx.lineWidth = 1;
      for (var gl = 1; gl <= 3; gl++) {
        var gy = baseY - maxH * gl / 4;
        ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(startX + towersW, gy); ctx.stroke();
      }
      // ghost of the previous probability
      if (prevProbs) {
        tokens.forEach(function (tok, i) {
          var x = startX + i * (tw + gap);
          var gh = prevProbs[i] * maxH;
          ctx.strokeStyle = C.muted;
          ctx.globalAlpha = 0.32;
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 1;
          ctx.strokeRect(x, baseY - gh, tw, gh);
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        });
      }
      // towers
      tokens.forEach(function (tok, i) {
        var x = startX + i * (tw + gap);
        var isTarget = i === target;
        var ph = Math.max(1, p[i] * maxH);
        ctx.fillStyle = isTarget ? "rgba(99,164,75,.10)" : "rgba(0,75,111,.05)";
        ctx.fillRect(x, topY, tw, baseY - topY);
        var grad = ctx.createLinearGradient(0, baseY - ph, 0, baseY);
        var col = isTarget ? C.green : (i === 1 ? C.sky : C.petrol);
        grad.addColorStop(0, col);
        grad.addColorStop(1, isTarget ? "rgba(99,164,75,.08)" : "rgba(0,75,111,.04)");
        ctx.fillStyle = grad;
        ctx.fillRect(x, baseY - ph, tw, ph);
        ctx.strokeStyle = isTarget ? C.green : C.line;
        ctx.lineWidth = isTarget ? 1.6 : 1;
        ctx.strokeRect(x, baseY - ph, tw, ph);
        var capY = baseY - ph;
        ctx.shadowColor = col;
        ctx.shadowBlur = isTarget ? 14 : 6;
        ctx.fillStyle = isTarget ? C.gold : col;
        ctx.beginPath(); ctx.arc(x + tw / 2, capY, isTarget ? 4 : 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = isTarget ? C.green : C.inkSoft || C.soft || C.ink;
        ctx.font = (isTarget ? '700 ' : '600 ') + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText((p[i] * 100).toFixed(1) + "%", x + tw / 2, Math.max(topY + 10, capY - 8));
        ctx.fillStyle = isTarget ? C.petrol : C.ink;
        ctx.font = (isTarget ? '700 ' : '600 ') + Math.max(10, Math.min(12, tw * 0.24)) + 'px "Open Sans", sans-serif';
        ctx.textBaseline = "top";
        ctx.fillText(tok, x + tw / 2, baseY + 6);
        // one-hot marker
        var ohY = baseY + 25;
        ctx.strokeStyle = isTarget ? C.gold : C.lineStrong;
        ctx.fillStyle = isTarget ? C.gold : "rgba(255,255,255,.7)";
        ctx.fillRect(x + tw / 2 - 5, ohY, 10, 10);
        ctx.strokeRect(x + tw / 2 - 5, ohY, 10, 10);
        // gradient chip
        var up = g[i] >= 0;
        ctx.fillStyle = up ? C.blue : C.muted;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.font = '600 9px "Open Sans", sans-serif';
        ctx.fillText((up ? "▲ " : "▼ ") + Math.abs(g[i]).toFixed(2), x + tw / 2, ohY + 14);
      });
      // target star
      var tIdx = target, tx = centers[tIdx], ty = baseY - p[tIdx] * maxH;
      ctx.fillStyle = C.gold;
      ctx.beginPath();
      for (var k = 0; k < 10; k++) {
        var ang = -Math.PI / 2 + k * Math.PI / 5;
        var rad = k % 2 === 0 ? 7 : 3;
        var px = tx + Math.cos(ang) * rad;
        var py = ty - 17 + Math.sin(ang) * rad;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      // gauge
      var gcx = w - pad - gaugeW / 2, gcy = topY + maxH * 0.35;
      var gr = Math.min(gaugeW * 0.33, maxH * 0.27);
      var start = Math.PI * 0.75, end = Math.PI * 2.25;
      var ratio = clamp(loss / maxLoss(), 0, 1);
      var gaugeCol = ratio < 0.45 ? C.green : (ratio < 0.75 ? C.gold : C.lilac);
      ctx.lineWidth = 11; ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(0,75,111,.10)";
      ctx.beginPath(); ctx.arc(gcx, gcy, gr, start, end); ctx.stroke();
      ctx.shadowColor = gaugeCol; ctx.shadowBlur = 14;
      ctx.strokeStyle = gaugeCol;
      ctx.beginPath(); ctx.arc(gcx, gcy, gr, start, start + (end - start) * ratio); ctx.stroke();
      ctx.shadowBlur = 0; ctx.lineCap = "butt";
      var na = start + (end - start) * ratio;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gcx, gcy); ctx.lineTo(gcx + Math.cos(na) * gr * 0.78, gcy + Math.sin(na) * gr * 0.78); ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.arc(gcx, gcy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.muted;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "Cross-Entropy" : "cross-entropy", gcx, gcy - gr - 14);
      ctx.fillStyle = C.ink;
      ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif';
      ctx.fillText(loss.toFixed(3), gcx, gcy + gr * 0.38);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "−log p(Ziel)" : "−log p(target)", gcx, gcy + gr * 0.62);
      // training beam
      var age = performance.now() - pulseStart;
      if (age >= 0 && age < 900) {
        var qx = tx, qy = ty - 24, ex = gcx, ey = gcy;
        var mx = (qx + ex) / 2 + 20, my = Math.min(qy, ey) - 28;
        ctx.globalAlpha = 0.55 * (1 - age / 900);
        ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(qx, qy); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
        for (var b = 0; b < 7; b++) {
          var u = ((b / 7) + age / 900) % 1;
          var bx = (1 - u) * (1 - u) * qx + 2 * (1 - u) * u * mx + u * u * ex;
          var by = (1 - u) * (1 - u) * qy + 2 * (1 - u) * u * my + u * u * ey;
          ctx.fillStyle = C.gold;
          ctx.beginPath(); ctx.arc(bx, by, 2.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      // sparkline
      var sx = gcx - gr * 0.95, sy = gcy + gr + 16, sw = gr * 1.9, sh = 26;
      ctx.strokeStyle = "rgba(0,75,111,.12)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, sy + sh); ctx.lineTo(sx + sw, sy + sh); ctx.stroke();
      if (history.length > 1) {
        var maxHh = Math.max.apply(null, history.concat([0.4]));
        ctx.strokeStyle = C.blue; ctx.lineWidth = 1.6;
        ctx.beginPath();
        history.forEach(function (v, i) {
          var x = sx + (i / (history.length - 1)) * sw;
          var y = sy + sh - (v / maxHh) * sh;
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
      prevProbs = null;
      pulseStart = 0;
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
