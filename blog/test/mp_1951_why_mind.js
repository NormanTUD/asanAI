(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroMind");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(32, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      var ex = w * 0.35, ey = h * 0.5;
      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(ex, ey, w * 0.2, h * 0.14, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ex, ey, h * 0.05, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      for (var i = 0; i < 26; i++) {
        var u = (i / 26) * Math.PI * 2;
        var r = h * (0.06 + 0.02 * Math.sin(i * 1.7 + t));
        MP.glowDot(ctx, ex + Math.cos(u) * r, ey + Math.sin(u) * r * 0.7, 1.8, c.accent2, c.accent);
      }

      for (var k = 0; k < 40; k++) {
        var p = (k / 40 + t * 0.06) % 1;
        var x = MP.lerp(w * 0.58, w * 0.93, p);
        var y = h * 0.5 + Math.sin(k * 2.1 + t) * h * 0.035 * (0.3 + p);
        ctx.save();
        ctx.globalAlpha = 0.15 + 0.6 * (1 - p);
        MP.dot(ctx, x, y, 1.2 + p * 1.1, k % 4 === 0 ? c.accent : c.muted);
        ctx.restore();
      }
      MP.label(ctx, "10⁸ in", w * 0.13, h * 0.86, c.faint, 9);
      MP.label(ctx, "3 bits / ms out", w * 0.9, h * 0.86, c.accent, 9, "right");
      MP.label(ctx, "certainty is bought with information", w * 0.5, h * 0.12, c.muted, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var canvas = document.getElementById("funnelLab");
  if (!canvas) return;

  var k = 7;
  var kEl = document.getElementById("kVal");
  var chanceEl = document.getElementById("chanceVal");
  var certaintyEl = document.getElementById("certaintyVal");
  var corruptionEl = document.getElementById("corruptionVal");
  var outEl = document.getElementById("outBitsVal");
  var particles = [];
  var seed = MP.mulberry32(1951);

  function reset(p, initial) {
    p.x = initial ? seed() : -0.02 - seed() * 0.12;
    p.y = 0.08 + seed() * 0.84;
    p.v = 0.08 + seed() * 0.14;
    p.size = 0.8 + seed() * 1.8;
    p.state = 0;
    p.alpha = 0.35 + seed() * 0.5;
    p.ph = seed() * 6.28;
    p.wob = 0.5 + seed();
  }
  for (var i = 0; i < 320; i++) {
    var p = {};
    reset(p, true);
    particles.push(p);
  }

  function stats() {
    var chance = Math.pow(2, -k);
    if (kEl) kEl.textContent = k;
    if (chanceEl) chanceEl.textContent = chance.toExponential(2);
    if (certaintyEl) certaintyEl.textContent = (1 - chance).toFixed(6);
    if (corruptionEl) corruptionEl.textContent = (1e8 / 3).toExponential(2);
    if (outEl) outEl.textContent = "3 bits/ms";
  }
  MP.bindRange("coincidence", function (v) { k = Math.round(v); stats(); });
  MP.on("resetFunnel", "click", function () {
    particles.forEach(function (p) { reset(p, true); });
  });
  stats();

  MP.canvas(canvas, function (ctx, w, h, t, dt) {
    var c = MP.colors();
    var gx = 0.56;
    var survival = Math.pow(2, -k);
    var d = dt || 0.016;

    ctx.save();
    ctx.globalAlpha = 0.18;
    MP.grid(ctx, w, h, Math.max(26, Math.min(w, h) * 0.06), c.line);
    ctx.restore();

    var eyeX = w * 0.05, eyeY = h * 0.5;
    ctx.save();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(eyeX + w * 0.08, eyeY, w * 0.1, h * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    var fieldX = w * 0.06, fieldW = w * 0.2;
    for (var r = 0; r < 700; r++) {
      var fx = fieldX + ((r * 0.61803398875) % 1) * fieldW;
      var fy = h * 0.08 + ((r * 0.41421356237) % 1) * h * 0.84;
      var fl = 0.5 + 0.5 * Math.sin(t * 3 + r * 0.37);
      ctx.save();
      ctx.globalAlpha = 0.06 + fl * 0.22;
      MP.dot(ctx, fx, fy, 0.8, r % 9 === 0 ? c.accent : c.muted);
      ctx.restore();
    }
    MP.label(ctx, "receptors", fieldX + fieldW / 2, h * 0.94, c.faint, 9, "center");

    ctx.save();
    ctx.strokeStyle = c.accent;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(w * 0.24, h * 0.08);
    ctx.bezierCurveTo(w * 0.4, h * 0.12, gx * w - w * 0.06, h * 0.38, gx * w, h * 0.42);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.24, h * 0.92);
    ctx.bezierCurveTo(w * 0.4, h * 0.88, gx * w - w * 0.06, h * 0.62, gx * w, h * 0.58);
    ctx.stroke();
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.moveTo(gx * w, h * 0.42);
    ctx.bezierCurveTo(gx * w + w * 0.1, h * 0.4, w * 0.84, h * 0.38, w * 0.92, h * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx * w, h * 0.58);
    ctx.bezierCurveTo(gx * w + w * 0.1, h * 0.6, w * 0.84, h * 0.62, w * 0.92, h * 0.6);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 22;
    ctx.shadowColor = c.accent;
    ctx.beginPath();
    ctx.moveTo(gx * w, h * 0.36);
    ctx.lineTo(gx * w, h * 0.64);
    ctx.stroke();
    ctx.restore();
    for (var tick = 0; tick < k; tick++) {
      var ty = h * 0.36 + (tick + 0.5) * (h * 0.28 / k);
      MP.dot(ctx, gx * w, ty, 1.4, c.accent2);
    }
    MP.label(ctx, "coincidence gate: k = " + k, gx * w, h * 0.3, c.accent, 10, "center");
    MP.label(ctx, "p = 2⁻ᵏ = " + survival.toExponential(2), gx * w, h * 0.68, c.muted, 9, "center");

    particles.forEach(function (p) {
      if (p.state === 0) {
        p.x += p.v * d * (1.2 - p.y * 0.4);
        p.y += Math.sin(t * 1.7 + p.ph) * 0.0008 * p.wob;
        if (p.x >= gx - 0.01) {
          p.x = gx;
          p.state = seed() < survival ? 1 : 2;
        }
      } else if (p.state === 1) {
        p.x += p.v * d * 1.7;
        p.y += Math.sin(t * 1.2 + p.ph) * 0.0006;
        if (p.x > 1.04) reset(p, false);
      } else {
        p.alpha -= d * 1.6;
        p.x += p.v * d * 0.25;
        if (p.alpha <= 0) reset(p, false);
      }
      var px = p.x * w;
      var py = p.y * h;
      if (p.state === 2) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha * 0.5);
        MP.dot(ctx, px, py, p.size * 0.8, c.faint);
        ctx.restore();
      } else if (p.state === 1) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = c.accent;
        ctx.globalAlpha = 0.9;
        MP.dot(ctx, px, py, p.size * 1.2, c.accent2);
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        MP.dot(ctx, px, py, p.size, c.muted);
        ctx.restore();
      }
    });

    for (var o = 0; o < 3; o++) {
      var op = (t * 0.8 + o / 3) % 1;
      var ox = w * 0.92 + Math.sin(op * 6.28) * 3;
      var oy = h * 0.38 + o * h * 0.06;
      MP.glowDot(ctx, ox, oy, 2.4, c.accent2, c.accent);
    }
    MP.label(ctx, "optic nerve", w * 0.43, h * 0.96, c.faint, 9, "center");
    MP.label(ctx, "output", w * 0.92, h * 0.94, c.accent, 9, "center");
  }, { maxDpr: 2 });
})();
