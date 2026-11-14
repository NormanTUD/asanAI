(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function backpropScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-bp-scene";
    el.innerHTML = '<div class="ls-bp-stage"><canvas class="ls-bp-canvas" role="img"></canvas></div>' +
      '<div class="ls-bp-readout" aria-live="polite"></div>' +
      '<p class="ls-bp-caption"></p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-bp-stage");
    var canvas = el.querySelector("canvas");
    var readout = el.querySelector(".ls-bp-readout");
    var caption = el.querySelector(".ls-bp-caption");
    var C = api.colors();
    var LAYERS = [2, 3, 3, 3, 1];
    var inputs = [0.82, 0.38];
    var target = 0.88;
    var weights = [], biases = [];
    var seed = 23;
    function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    for (var l = 0; l < LAYERS.length - 1; l++) {
      var rows = LAYERS[l + 1], cols = LAYERS[l];
      var w = [];
      for (var r = 0; r < rows; r++) {
        var row = [];
        for (var c = 0; c < cols; c++) row.push((rand() - 0.5) * 0.9);
        w.push(row);
      }
      weights.push(w);
      biases.push(new Array(rows).fill(0).map(function () { return (rand() - 0.5) * 0.2; }));
    }
    var acts = [], step = 0, size = null;
    function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
    function forward() {
      acts = [inputs.slice()];
      for (var l = 0; l < weights.length; l++) {
        var prev = acts[l], next = [];
        for (var r = 0; r < weights[l].length; r++) {
          var z = biases[l][r];
          for (var c = 0; c < prev.length; c++) z += weights[l][r][c] * prev[c];
          next.push(sigmoid(z));
        }
        acts.push(next);
      }
    }
    function output() { return acts[acts.length - 1][0]; }
    function delta(l, index) {
      var out = acts[l][index];
      if (l === acts.length - 1) return (target - out) * out * (1 - out);
      var s = 0, next = acts[l + 1], w = weights[l];
      for (var r = 0; r < next.length; r++) {
        var d = delta(l + 1, r);
        s += d * w[r][index];
      }
      return s * out * (1 - out);
    }
    function applyLayer(l) {
      var lr = 1.8;
      var prev = acts[l], curr = acts[l + 1];
      for (var r = 0; r < curr.length; r++) {
        var d = delta(l + 1, r);
        for (var c = 0; c < prev.length; c++) weights[l][r][c] += lr * d * prev[c];
        biases[l][r] += lr * d;
      }
      forward();
    }
    forward();
    function stepLabel() {
      return [
        DE ? "Vorwärts: ŷ und y" : "Forward: ŷ and y",
        DE ? "Letzte Schicht" : "Last layer",
        DE ? "Die Schicht davor wird zur neuen letzten Schicht" : "The previous layer becomes the new last layer",
        DE ? "Noch eine Schicht zurück" : "One layer further back",
        DE ? "Und noch eine" : "And another one",
        DE ? "Optimizer: alle Gradienten" : "Optimizer: all gradients"
      ][step];
    }
    function draw() {
      if (!size) return;
      var ctx = size.ctx, w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.43, h * 0.48, 12, w * 0.48, h * 0.5, Math.max(w, h) * 0.75);
      bg.addColorStop(0, V.alpha(C.paper2, 0.95));
      bg.addColorStop(0.58, V.alpha(C.paper, 0.55));
      bg.addColorStop(1, V.alpha(C.paper, 0.98));
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      V.grid(ctx, w, h, C, 26, 0.13);
      var padL = 26, padR = 230, top = 44, bottom = 34;
      var netW = w - padL - padR;
      function lx(l) { return padL + l / (LAYERS.length - 1) * netW; }
      function ny(l, i) {
        var n = LAYERS[l], gap = Math.min(48, (h - top - bottom) / Math.max(2, n));
        return h / 2 + (i - (n - 1) / 2) * gap;
      }
      function edge(l, a, b, col, width, alpha) {
        ctx.strokeStyle = col; ctx.globalAlpha = alpha == null ? 0.55 : alpha; ctx.lineWidth = width || 1;
        ctx.beginPath(); ctx.moveTo(lx(l), ny(l, a)); ctx.lineTo(lx(l + 1), ny(l + 1, b)); ctx.stroke(); ctx.globalAlpha = 1;
      }
      for (var l = 0; l < weights.length; l++) {
        for (var r = 0; r < weights[l].length; r++) {
          for (var c = 0; c < weights[l][r].length; c++) {
            var wv = weights[l][r][c];
            var active = step === l + 1 || (step === 5);
            edge(l, c, r, wv >= 0 ? C.blue : C.lilac, 0.8 + Math.min(3.2, Math.abs(wv) * 3), active ? 0.82 : 0.30);
          }
        }
      }
      // backward gradient arrows for the active layer
      if (step > 0) {
        var backs = step >= 5 ? [0, 1, 2, 3] : [Math.min(step - 1, weights.length - 1)];
        backs.forEach(function (back) {
          for (var br = 0; br < acts[back + 1].length; br++) {
            V.arrow(ctx, lx(back + 1), ny(back + 1, br), lx(back) + 6, ny(back, Math.min(br, LAYERS[back] - 1)), C.gold, 1.5, 4.5);
          }
        });
      }
      for (var ll = 0; ll < LAYERS.length; ll++) {
        ctx.fillStyle = ll === Math.max(0, step) ? C.petrol : C.muted;
        ctx.font = '700 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(ll === 0 ? (DE ? "Input" : "input") : ll === LAYERS.length - 1 ? (DE ? "Output" : "output") : (DE ? "Hidden " + ll : "hidden " + ll), lx(ll), 16);
        for (var n = 0; n < LAYERS[ll]; n++) {
          var a = acts[ll][n], x = lx(ll), y = ny(ll, n);
          ctx.save();
          ctx.shadowColor = a > 0.5 ? C.green : C.blue; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.fillStyle = V.alpha(a > 0.5 ? C.green : C.blue, 0.25 + a * 0.6); ctx.fill();
          ctx.restore();
          ctx.strokeStyle = ll === Math.max(0, step) ? C.gold : C.lineStrong; ctx.lineWidth = ll === Math.max(0, step) ? 2.2 : 1; ctx.stroke();
          ctx.fillStyle = C.ink; ctx.font = '700 ' + Math.max(7, api.font("canvas-sm") - 2) + 'px "Open Sans", sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(a.toFixed(2), x, y + 18);
        }
      }
      // output / target card
      var bx = w - padR + 14, by = top + 6, bw = padR - 28;
      var yhat = output(), err = target - yhat;
      ctx.fillStyle = "rgba(255,255,255,.78)"; ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      ctx.fillRect(bx, by, bw, 136); ctx.strokeRect(bx, by, bw, 136);
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillStyle = C.muted; ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "Soll y" : "target y", bx + 10, by + 10);
      ctx.fillStyle = C.petrol; ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif';
      ctx.fillText(target.toFixed(2), bx + 10, by + 24);
      ctx.fillStyle = C.muted; ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.fillText(DE ? "Ist ŷ" : "output ŷ", bx + 10, by + 50);
      ctx.fillStyle = Math.abs(err) < 0.08 ? C.green : C.gold; ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif';
      ctx.fillText(yhat.toFixed(3), bx + 10, by + 64);
      ctx.fillStyle = err >= 0 ? C.blue : C.coral; ctx.font = '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif';
      ctx.fillText((DE ? "Differenz " : "difference ") + err.toFixed(3), bx + 10, by + 88);
      ctx.fillStyle = C.line; ctx.fillRect(bx + 10, by + 112, bw - 20, 6);
      ctx.fillStyle = Math.abs(err) < 0.08 ? C.green : C.coral;
      ctx.fillRect(bx + 10, by + 112, (bw - 20) * Math.min(1, Math.abs(err)), 6);
      if (step === 1) {
        ctx.fillStyle = C.gold; ctx.font = '700 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left"; ctx.textBaseline = "bottom";
        ctx.fillText(DE ? "Wäre der erste Wert kleiner und der zweite größer, wäre ŷ näher an y." : "If the first value were smaller and the second larger, ŷ would be closer to y.", 18, h - 12);
      } else if (step === 5) {
        ctx.fillStyle = C.green; ctx.font = '700 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
        ctx.textAlign = "left"; ctx.textBaseline = "bottom";
        ctx.fillText(DE ? "Optimizer: alle Gradienten sind gesammelt; jetzt werden alle Gewichte aktualisiert." : "Optimizer: all gradients are collected; now all weights are updated.", 18, h - 12);
      }
      ctx.fillStyle = C.petrol; ctx.font = '700 ' + Math.max(10, api.font("canvas-sm")) + 'px "Barlow", sans-serif';
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(stepLabel(), 18, 34);
      readout.innerHTML = '<span><b>' + (DE ? "Schritt" : "step") + '</b> ' + (step + 1) + ' / 6</span><span><b>ŷ</b> ' + yhat.toFixed(3) + '</span><span><b>y</b> ' + target.toFixed(2) + '</span><span><b>' + (DE ? "Differenz" : "difference") + '</b> ' + err.toFixed(3) + '</span>';
      caption.textContent = DE
        ? "Vorwärts läuft der Input durch fünf Schichten. Der Fehler sagt, wie weit die Ausgabe vom Ziel entfernt ist. Backpropagation nimmt diesen Fehler, korrigiert zuerst die letzte Schicht, dann die Schicht davor, und wiederholt das bis zum Input. Der Optimizer nimmt die Gradienten, also die gesammelten Unterschiede, und aktualisiert die Gewichte. So wird das Netz Schritt für Schritt besser."
        : "Forward passes the input through five layers. The error says how far the output is from the target. Backpropagation takes that error, corrects the last layer first, then the layer before it, and repeats down to the input. The optimizer takes the gradients, the collected differences, and updates the weights. That is how the network gets better.";
    }
    function next() {
      if (step >= 5) return false;
      if (step >= 1 && step <= 4) applyLayer(4 - step);
      step++;
      if (step === 5) { for (var l = 0; l < weights.length; l++) applyLayer(l); }
      draw();
      if (canvas.animate) { try { canvas.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 320, easing: "ease-out" }); } catch (e) {} }
      return true;
    }
    function prev() {
      if (step <= 0) return false;
      step--;
      forward();
      draw();
      if (canvas.animate) { try { canvas.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 280, easing: "ease-out" }); } catch (e) {} }
      return true;
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    return {
      update: function () {},
      next: next,
      prev: prev,
      onKey: function (e) { return api.util.arrowKey(e, next, prev); },
      resize: resize,
      pause: function () {},
      resume: function () { draw(); },
      destroy: function () { window.removeEventListener("resize", resize); el.remove(); }
    };
  }

  core.register("backprop", backpropScene);
})();
