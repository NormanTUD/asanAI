(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroStats");
  if (hero) {
    var rnd = MP.mulberry32(1944);
    var streams = [
      { rate: 0.55, seed: 3, y: 0.3, off: 0 },
      { rate: 0.35, seed: 7, y: 0.5, off: 0.4 },
      { rate: 0.22, seed: 11, y: 0.7, off: 0.8 }
    ];
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      var left = w * 0.06;
      var right = w * 0.58;
      var nodeX = w * 0.68;
      var nodeY = h * 0.5;
      var outX = w * 0.94;

      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(34, Math.min(w, h) * 0.08), c.line);
      ctx.restore();

      streams.forEach(function (s, si) {
        var y = h * s.y;
        ctx.save();
        ctx.strokeStyle = c.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
        ctx.restore();
        MP.label(ctx, ["A", "B", "C"][si], left - 18, y, c.faint, 11, "center");
        for (var i = 0; i < 38; i++) {
          var bx = ((i / 38) * (right - left) + t * 70 * s.rate + s.off * 90) % (right - left);
          var alpha = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(t * 1.4 + i + si));
          if (Math.sin(i * 12.9898 + si * 78.233) * 43758.5453 % 1 > 0.5) {
            MP.glowDot(ctx, left + bx, y, 1.5, c.accent, c.accent);
          }
          ctx.save();
          ctx.globalAlpha = alpha * 0.6;
          MP.dot(ctx, left + bx, y, 1.1, c.muted);
          ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha = 0.5;
        MP.arrow(ctx, right - 30, y, nodeX - 26, MP.lerp(y, nodeY, 0.55), c.accent, 1.1, 6);
        ctx.restore();
      });

      ctx.save();
      ctx.translate(nodeX, nodeY);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.6;
      ctx.shadowBlur = 26;
      ctx.shadowColor = c.accent;
      ctx.strokeRect(-22, -22, 44, 44);
      ctx.restore();
      MP.label(ctx, "Σ ≥ θ", nodeX, nodeY, c.ink, 12, "center");
      MP.label(ctx, "coincidence", nodeX, nodeY + 42, c.faint, 9, "center");

      var pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.3 * pulse;
      MP.arrow(ctx, nodeX + 30, nodeY, outX - 12, nodeY, c.accent, 1.6, 7);
      ctx.restore();
      for (var k = 0; k < 12; k++) {
        var ox = nodeX + 30 + ((k / 12) * (outX - nodeX - 42) + t * 95) % (outX - nodeX - 42);
        var visible = Math.sin(k * 3.7 + t * 6) > 0.2;
        if (visible) MP.glowDot(ctx, ox, nodeY, 1.8, c.accent2, c.accent);
      }
      MP.label(ctx, "ν out", outX + 2, nodeY - 26, c.accent, 10, "center");
      MP.label(ctx, "pulses in, probability out", w * 0.5, h * 0.92, c.muted, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var canvas = document.getElementById("statLab");
  if (!canvas) return;

  var gate = "AND";
  var bins = [];
  var acc = 0;
  var predictedEl = document.getElementById("predVal");
  var observedEl = document.getElementById("obsVal");
  var gateLabel = document.getElementById("gateLabel");
  var rateA = document.getElementById("rateA");
  var rateB = document.getElementById("rateB");
  var rateC = document.getElementById("rateC");

  function rates() {
    return {
      a: parseFloat(rateA.value),
      b: parseFloat(rateB.value),
      c: parseFloat(rateC.value)
    };
  }
  function predict(p) {
    if (gate === "AND") return p.a * p.b;
    if (gate === "OR") return 1 - (1 - p.a) * (1 - p.b);
    if (gate === "XOR") return p.a * (1 - p.b) + (1 - p.a) * p.b;
    if (gate === "NOTC") return p.a * (1 - p.c);
    if (gate === "MAJ") return p.a * p.b + p.a * p.c + p.b * p.c - 2 * p.a * p.b * p.c;
    return p.a;
  }
  function decide(p, r) {
    var a = r() < p.a;
    var b = r() < p.b;
    var c = r() < p.c;
    var out;
    if (gate === "AND") out = a && b;
    else if (gate === "OR") out = a || b;
    else if (gate === "XOR") out = a !== b;
    else if (gate === "NOTC") out = a && !c;
    else if (gate === "MAJ") out = (a ? 1 : 0) + (b ? 1 : 0) + (c ? 1 : 0) >= 2;
    else out = a;
    return { a: a, b: b, c: c, out: out };
  }
  function setGate(g, label) {
    gate = g;
    if (gateLabel) gateLabel.textContent = label;
    document.querySelectorAll("[data-gate]").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-gate") === g);
    });
    updateReadout();
  }
  function updateReadout() {
    var p = rates();
    var pred = predict(p);
    var recent = bins.slice(-60);
    var obs = recent.length ? recent.filter(function (b) { return b.out; }).length / recent.length : 0;
    if (predictedEl) predictedEl.textContent = pred.toFixed(3);
    if (observedEl) observedEl.textContent = obs.toFixed(3);
  }
  document.querySelectorAll("[data-gate]").forEach(function (b) {
    b.addEventListener("click", function () { setGate(b.getAttribute("data-gate"), b.getAttribute("data-label")); });
  });
  [rateA, rateB, rateC].forEach(function (r) {
    if (r) r.addEventListener("input", updateReadout);
    if (r) MP.rangeFill(r);
  });
  setGate("AND", "A ∧ B");

  var rnd = MP.mulberry32(1943);
  MP.canvas(canvas, function (ctx, w, h, t, dt) {
    var c = MP.colors();
    acc += dt || 0;
    while (acc >= 0.09) {
      acc -= 0.09;
      var p = rates();
      var row = decide(p, rnd);
      row.t = t;
      bins.push(row);
      if (bins.length > 78) bins.shift();
      updateReadout();
    }

    ctx.save();
    ctx.globalAlpha = 0.25;
    MP.grid(ctx, w, h, Math.max(24, Math.min(w, h) * 0.06), c.line);
    ctx.restore();

    var left = w * 0.13;
    var right = w * 0.97;
    var top = h * 0.14;
    var rows = 4;
    var gap = (h * 0.72) / (rows - 1);
    var labels = ["A", "B", "C", "N"];
    var keys = ["a", "b", "c", "out"];
    var n = bins.length;
    var step = (right - left) / 78;

    for (var r = 0; r < rows; r++) {
      var y = top + r * gap;
      ctx.save();
      ctx.strokeStyle = r === 3 ? c.accent : c.line;
      ctx.globalAlpha = r === 3 ? 0.5 : 0.25;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, labels[r], left - 22, y, r === 3 ? c.accent : c.muted, 12, "center");
    }

    for (var i = 0; i < n; i++) {
      var b = bins[i];
      var x = right - (n - i) * step;
      for (var rr = 0; rr < rows; rr++) {
        var yy = top + rr * gap;
        var on = b[keys[rr]];
        if (on) {
          ctx.save();
          if (rr === 3) { ctx.shadowBlur = 12; ctx.shadowColor = c.accent; }
          ctx.fillStyle = rr === 3 ? c.accent : c.accent2;
          ctx.globalAlpha = rr === 3 ? 0.95 : 0.6;
          ctx.fillRect(x - Math.max(1, step * 0.28), yy - 5, Math.max(2, step * 0.56), 10);
          ctx.restore();
        } else {
          ctx.save();
          ctx.fillStyle = c.line;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(x - 0.5, yy - 2, 1, 4);
          ctx.restore();
        }
      }
    }

    ctx.save();
    ctx.fillStyle = c.accent;
    ctx.globalAlpha = 0.08;
    ctx.fillRect(right - step, top - 16, step, h * 0.72 + 32);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = c.accent;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(right - step, top - 16);
    ctx.lineTo(right - step, top + h * 0.72 + 16);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    MP.label(ctx, "δ", right - step / 2, top - 24, c.accent, 11, "center");
    MP.label(ctx, "now", right - step / 2, top + h * 0.72 + 24, c.faint, 9, "center");
    MP.label(ctx, "impulse trains · one bin = one coincidence window", left, h * 0.95, c.muted, 9);
  }, { maxDpr: 2 });
})();
