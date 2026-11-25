(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function crossEntropyScene(root, api) {
    var DE = api.lang === "de";
    var tokens = ["Paris", "London", "Berlin", "Rome"];
    var sentences = DE ? [
      "Die Hauptstadt von Frankreich ist ___",
      "Die Hauptstadt des Vereinigten Königreichs ist ___",
      "Die Hauptstadt von Deutschland ist ___",
      "Die Hauptstadt von Italien ist ___"
    ] : [
      "The capital of France is ___",
      "The capital of the UK is ___",
      "The capital of Germany is ___",
      "The capital of Italy is ___"
    ];
    var initial = [1.69, 2.2, 0.77, 0.37];
    var logits = initial.slice();
    var target = 0, lr = 0.9;
    var history = [];
    var sequenceDone = false;
    var tween = 0, tweenFrom = null, tweenTo = null, tweenStart = 0, tweenDur = 560, pulseStart = 0, prevProbs = null;
    var BATCH_STEPS = 5;
    var BATCH_STEP_MS = 220;
    var batchToken = 0, batchLeft = 0, batchTotal = 0, batchDone = 0;
    var barGeom = null, dragBar = -1;
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var el = document.createElement("div");
    el.className = "ls-ce-scene";
    el.innerHTML =
      '<div class="ls-ce-stage" data-tip="' + (DE ? "Ziehe einen Balken nach oben oder unten, um seine Wahrscheinlichkeit von Hand zu setzen." : "Drag a bar up or down to set that token's probability by hand.") + '"><canvas class="ls-canvas" role="img" data-tip="' + (DE ? "Balken zeigen die vorhergesagten Wahrscheinlichkeiten; die Anzeige rechts zeigt den Loss für das Ziel-Token." : "Bars show predicted probabilities; the gauge shows the cross-entropy loss for the target token.") + '"></canvas></div>' +
      '<div class="ls-ce-controls">' +
        '<span class="ls-ce-control-label" data-tip="' + (DE ? "Wähle, welches Token das Modell als Nächstes vorhersagen soll." : "Choose which token the model should predict next.") + '">' + (DE ? "Ziel-Token" : "target token") + '</span>' +
        '<span class="ls-ce-targets" data-tip="' + (DE ? "Jedes Chip setzt das Ziel-Token und startet den Loss neu." : "Each chip sets the target token and resets the loss history.") + '"></span>' +
        '<button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-ce-train" data-tip="' + (DE ? "Führt einen Gradientenschritt aus und erhöht die Wahrscheinlichkeit des Ziels." : "Run one gradient step to push probability toward the target.") + '">' + (DE ? "Trainingsschritt" : "Training step") + '</button>' +
        '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-ce-reset" data-tip="' + (DE ? "Setzt Logits und Loss-Verlauf auf den Anfang zurück." : "Restore the initial logits and clear the loss history.") + '">' + (DE ? "Zurücksetzen" : "Reset") + '</button>' +
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
        b.setAttribute("data-tip", DE ? "Setzt dieses Token als Ziel und startet den Loss neu." : "Set this token as the target and reset the loss history.");
        b.textContent = tok;
        b.addEventListener("click", function () {
          target = i;
          sequenceDone = false;
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
    function trainStep(done, duration) {
      if (tween) { cancelAnimationFrame(tween); tween = 0; }
      var dur = typeof duration === "number" ? duration : tweenDur;
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
        if (done) done();
        return;
      }
      function step(now) {
        var t = Math.min(1, (now - tweenStart) / dur);
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
          if (done) done();
        }
      }
      tween = requestAnimationFrame(step);
    }
    function cancelBatch(snap) {
      batchToken++;
      batchLeft = 0;
      batchTotal = 0;
      batchDone = 0;
      if (tween) {
        cancelAnimationFrame(tween);
        tween = 0;
        if (snap && tweenTo) {
          logits = tweenTo.slice();
          draw();
        }
      }
    }
    function runBatch(count, done) {
      cancelBatch(false);
      var token = batchToken;
      batchLeft = count;
      batchTotal = count;
      batchDone = 0;
      function nextStep() {
        if (token !== batchToken) return;
        if (batchLeft <= 0) {
          batchTotal = 0;
          batchDone = 0;
          if (done) done();
          return;
        }
        batchLeft--;
        trainStep(function () {
          if (token !== batchToken) return;
          batchDone++;
          draw();
          if (batchLeft > 0) {
            nextStep();
          } else {
            batchTotal = 0;
            batchDone = 0;
            if (done) done();
          }
        }, BATCH_STEP_MS);
      }
      nextStep();
    }
    function setProb(index, value) {
      var p = softmax(logits);
      var targetP = clamp(value, 0, 1);
      var rest = 1 - targetP;
      var sumOther = 0;
      for (var i = 0; i < p.length; i++) {
        if (i !== index) sumOther += p[i];
      }
      var next = p.map(function (v, i) {
        if (i === index) return targetP;
        return sumOther > 1e-9 ? v / sumOther * rest : rest / (p.length - 1);
      });
      logits = next.map(function (v) { return Math.log(Math.max(1e-9, v)); });
      return next;
    }
    function barAt(x, y) {
      if (!barGeom) return -1;
      if (y < barGeom.topY - 12 || y > barGeom.baseY + 8) return -1;
      for (var i = 0; i < barGeom.n; i++) {
        var bx = barGeom.startX + i * (barGeom.tw + barGeom.gap);
        if (x >= bx - 2 && x <= bx + barGeom.tw + 2) return i;
      }
      return -1;
    }
    function setBarFromY(index, y) {
      if (!barGeom) return;
      var value = clamp((barGeom.baseY - y) / barGeom.maxH, 0, 1);
      setProb(index, value);
      history.push(lossOf(softmax(logits)));
      if (history.length > 28) history.shift();
      draw();
    }
    function endBarDrag() {
      if (dragBar < 0) return;
      dragBar = -1;
      canvas.style.cursor = "default";
      draw();
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
      ctx.fillText(sentences[target] || "", pad, 6);
      var gaugeW = Math.min(190, w * 0.30);
      var towersW = w - gaugeW - pad * 2;
      var topY = 40, baseY = h - 58;
      var maxH = Math.max(30, baseY - topY);
      var n = tokens.length;
      var gap = Math.max(10, towersW * 0.06);
      var tw = Math.min(58, (towersW - gap * (n - 1)) / n);
      var startX = pad + Math.max(0, (towersW - (tw * n + gap * (n - 1))) / 2);
      var centers = tokens.map(function (_, i) { return startX + i * (tw + gap) + tw / 2; });
      barGeom = { topY: topY, baseY: baseY, maxH: maxH, startX: startX, tw: tw, gap: gap, n: n };
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
        ctx.shadowBlur = isTarget ? 10 : 4;
        ctx.fillStyle = C.paper;
        ctx.strokeStyle = isTarget ? C.gold : col;
        ctx.lineWidth = isTarget ? 1.8 : 1.3;
        ctx.beginPath(); ctx.arc(x + tw / 2, capY, isTarget ? 7 : 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isTarget ? C.gold : col;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x + tw / 2 - 3, capY); ctx.lineTo(x + tw / 2 + 3, capY); ctx.stroke();
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
        ctx.fillStyle = isTarget ? C.paper : C.muted;
        ctx.font = '700 7px "Open Sans", sans-serif';
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(isTarget ? "1" : "0", x + tw / 2, ohY + 5.5);
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
      // explicit loss readout
      if (readout) {
        var batchInfo = batchTotal > 0
          ? '<span><b>' + (DE ? "Schritte" : "steps") + '</b> ' + Math.min(batchTotal, batchDone + 1) + ' / ' + batchTotal + '</span>'
          : '';
        readout.innerHTML = '<span><b>' + (DE ? "Ziel" : "target") + ' ' + (target + 1) + '/' + tokens.length + ' · ' + tokens[target] + '</b></span>' +
          '<span><b>Loss</b> ' + loss.toFixed(4) + '</span>' +
          '<span><b>p(' + tokens[target] + ')</b> ' + (p[target] * 100).toFixed(1) + '%</span>' +
          '<span><b>Σ</b> ' + (p.reduce(function (a, b) { return a + b; }, 0) * 100).toFixed(1) + '%</span>' +
          '<span><b>∇ ' + tokens[target] + '</b> ' + (g[target] >= 0 ? "+" : "") + g[target].toFixed(3) + '</span>' + batchInfo;
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
      canvas.__lsCE = { target: target, history: history.slice(), batchTotal: batchTotal, batchDone: batchDone, probs: p.slice(), geom: barGeom };
    }
    function resize() {
      size = api.fit(canvas, stage);
      draw();
    }
    function reset() {
      endBarDrag();
      cancelBatch(false);
      logits = initial.slice();
      target = 0;
      sequenceDone = false;
      prevProbs = null;
      pulseStart = 0;
      history = [lossOf(softmax(logits))];
      buildTargets();
      draw();
    }
    function nextTarget() {
      if (dragBar >= 0) return true;
      if (tween || batchLeft > 0) return true;
      var isLast = target >= tokens.length - 1;
      if (isLast && sequenceDone) return false;
      var next = isLast ? target : target + 1;
      runBatch(BATCH_STEPS, function () {
        if (isLast) {
          sequenceDone = true;
        } else {
          target = next;
          sequenceDone = false;
          prevProbs = null;
          pulseStart = 0;
          history = [lossOf(softmax(logits))];
          buildTargets();
          draw();
        }
      });
      return true;
    }
    function prevTarget() {
      endBarDrag();
      if (target <= 0) { cancelBatch(true); return false; }
      cancelBatch(true);
      target--;
      sequenceDone = false;
      prevProbs = null;
      pulseStart = 0;
      history = [lossOf(softmax(logits))];
      buildTargets();
      draw();
      return true;
    }
    canvas.addEventListener("pointerdown", function (e) {
      if (!size || !barGeom) return;
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var i = barAt(x, y);
      if (i < 0) return;
      cancelBatch(false);
      if (i !== target) {
        target = i;
        sequenceDone = false;
        buildTargets();
      }
      dragBar = i;
      prevProbs = softmax(logits).slice();
      history = [lossOf(softmax(logits))];
      pulseStart = 0;
      canvas.style.cursor = "ns-resize";
      if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }
      setBarFromY(i, y);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!size || !barGeom) return;
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (dragBar >= 0) {
        setBarFromY(dragBar, y);
      } else {
        canvas.style.cursor = barAt(x, y) >= 0 ? "ns-resize" : "default";
      }
    });
    core.canvasTip(canvas, function (x, y) {
      var i = barAt(x, y);
      if (i < 0 || !size) return DE ? "Balken sind Modellwahrscheinlichkeiten. Fahre über einen Balken für Ziel, Loss und Gradient; ziehen setzt die Wahrscheinlichkeit." : "Bars are model probabilities. Hover a bar for target, loss, and gradient; drag to set its probability.";
      var p = softmax(logits);
      var isTarget = i === target;
      var loss = lossOf(p);
      var grad = gradients(p)[i];
      return DE
        ? tokens[i] + ": Modellwahrscheinlichkeit " + (p[i] * 100).toFixed(1) + "%. " +
          (isTarget ? "Ziel-Token; Loss = " + loss.toFixed(3) + "." : "Nicht das Ziel; Loss = " + loss.toFixed(3) + ".") +
          " Gradient " + grad.toFixed(2) + ". Ziehen setzt diese Wahrscheinlichkeit; der Rest wird verteilt."
        : tokens[i] + ": model probability " + (p[i] * 100).toFixed(1) + "%. " +
          (isTarget ? "Target token; loss = " + loss.toFixed(3) + "." : "Not the target; loss = " + loss.toFixed(3) + ".") +
          " Gradient " + grad.toFixed(2) + ". Drag to set this probability; the rest is redistributed.";
    });
    canvas.addEventListener("pointerup", endBarDrag);
    canvas.addEventListener("pointercancel", endBarDrag);
    trainBtn.addEventListener("click", function () { cancelBatch(false); trainStep(); });
    resetBtn.addEventListener("click", reset);
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    reset();
    resize();
    return {
      update: function () {},
      next: nextTarget,
      prev: prevTarget,
      hasNext: function () { return !(target >= tokens.length - 1 && sequenceDone); },
      hasPrev: function () { return target > 0; },
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
