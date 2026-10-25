(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroComputing");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(32, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      var left = w * 0.08, mid = w * 0.48, right = w * 0.92;
      var cy = h * 0.5;
      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      for (var i = 0; i <= 120; i++) {
        var u = i / 120;
        var x = left + u * (mid - left);
        var y = cy + Math.sin(u * Math.PI * 5 + t) * h * 0.16;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, "analog", (left + mid) / 2, h * 0.18, c.muted, 10, "center");

      for (var k = 0; k <= 24; k++) {
        var u2 = k / 24;
        var x2 = mid + u2 * (right - mid);
        var level = Math.sin(u2 * Math.PI * 5 + t) > 0 ? 1 : 0;
        var y2 = cy + (level ? -1 : 1) * h * 0.16;
        ctx.save();
        ctx.fillStyle = c.accent;
        ctx.globalAlpha = level ? 0.9 : 0.25;
        MP.dot(ctx, x2, y2, 3.2, c.accent);
        ctx.restore();
      }
      MP.label(ctx, "digital", (mid + right) / 2, h * 0.18, c.accent, 10, "center");
      MP.arrow(ctx, mid - 14, cy, mid + 14, cy, c.accent2, 1.6, 7);
      MP.label(ctx, "sample & quantize", w * 0.5, h * 0.86, c.muted, 10, "center");
      MP.label(ctx, "bits, not volts", w * 0.5, h * 0.92, c.faint, 9, "center");
    }, { maxDpr: 1.6 });
  }

  var analog = document.getElementById("analogLab");
  if (analog) {
    var bits = 6;
    var levelsEl = document.getElementById("levelsVal");
    var errEl = document.getElementById("quantErr");
    var precEl = document.getElementById("precVal");
    function updateAnalog() {
      var levels = Math.pow(2, bits);
      if (levelsEl) levelsEl.textContent = levels;
      if (errEl) errEl.textContent = (0.5 / levels).toExponential(2);
      if (precEl) precEl.textContent = Math.log10(levels).toFixed(2) + " digits";
    }
    MP.bindRange("bits", function (v) { bits = Math.round(v); updateAnalog(); });
    updateAnalog();

    MP.canvas(analog, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(26, Math.min(w, h) * 0.06), c.line);
      ctx.restore();

      var left = w * 0.08, right = w * 0.96;
      var top = h * 0.16, bottom = h * 0.82;
      var midY = (top + bottom) / 2;
      var amp = (bottom - top) * 0.36;
      var levels = Math.pow(2, bits);

      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, midY);
      ctx.lineTo(right, midY);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      for (var i = 0; i <= 200; i++) {
        var u = i / 200;
        var x = left + u * (right - left);
        var y = midY + Math.sin(u * Math.PI * 4 + t * 0.8) * amp;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      var step = (amp * 2) / levels;
      ctx.save();
      ctx.strokeStyle = c.accent2;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      var prevY = null;
      for (var j = 0; j <= 120; j++) {
        var u2 = j / 120;
        var x2 = left + u2 * (right - left);
        var raw = Math.sin(u2 * Math.PI * 4 + t * 0.8) * amp;
        var q = Math.round(raw / step) * step;
        var y2 = midY + q;
        if (prevY === null) ctx.moveTo(x2, y2);
        else { ctx.lineTo(x2, prevY); ctx.lineTo(x2, y2); }
        prevY = y2;
      }
      ctx.stroke();
      ctx.restore();

      MP.label(ctx, "analog signal", left, top - 10, c.accent, 9);
      MP.label(ctx, bits + "-bit quantisation · " + levels + " levels", right, top - 10, c.accent2, 9, "right");
      MP.label(ctx, "sampling time →", right, h * 0.92, c.faint, 9, "right");
      MP.label(ctx, "one step = " + step.toFixed(4) + " of full scale", w * 0.5, h * 0.05, c.muted, 9, "center");
    }, { maxDpr: 2 });
  }

  var cap = document.getElementById("capacityLab");
  if (cap) {
    var Ts = 1.0, dT = 0.05, Tm = 2.0;
    var binEl = document.getElementById("binCap");
    var intEl = document.getElementById("intCap");
    var optEl = document.getElementById("optCap");
    var ratEl = document.getElementById("capRatio");
    function intervalCap(Ts, dT, Tm) {
      if (Tm <= Ts) return 0;
      return (2 / (Tm + Ts)) * Math.log((Tm - Ts) / dT) / Math.LN2;
    }
    function optimum(Ts, dT) {
      var best = { Tm: Ts + dT, C: 0 };
      for (var m = Ts + dT; m <= 8; m += 0.01) {
        var v = intervalCap(Ts, dT, m);
        if (v > best.C) best = { Tm: m, C: v };
      }
      return best;
    }
    function updateCap() {
      var b = 1 / Ts;
      var v = intervalCap(Ts, dT, Tm);
      var o = optimum(Ts, dT);
      if (binEl) binEl.textContent = b.toFixed(2);
      if (intEl) intEl.textContent = v.toFixed(2);
      if (optEl) optEl.textContent = o.Tm.toFixed(2) + " ms";
      if (ratEl) ratEl.textContent = (v / b).toFixed(2) + "×";
    }
    MP.bindRange("ts", function (v) { Ts = v; updateCap(); });
    MP.bindRange("dt", function (v) { dT = v; updateCap(); });
    MP.bindRange("tm", function (v) { Tm = v; updateCap(); });
    updateCap();

    MP.canvas(cap, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(26, Math.min(w, h) * 0.06), c.line);
      ctx.restore();

      var left = w * 0.1, right = w * 0.95, top = h * 0.14, bottom = h * 0.82;
      var pw = right - left, ph = bottom - top;
      var maxY = 4;
      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.stroke();
      ctx.restore();
      for (var g = 0; g <= 4; g++) {
        var yy = bottom - (g / 4) * ph;
        MP.label(ctx, g.toFixed(0), left - 10, yy, c.faint, 8, "right");
        ctx.save();
        ctx.strokeStyle = c.line;
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.moveTo(left, yy);
        ctx.lineTo(right, yy);
        ctx.stroke();
        ctx.restore();
      }
      MP.label(ctx, "bits / ms", left - 10, top - 12, c.faint, 8, "right");
      MP.label(ctx, "Tₘ (ms) →", right, bottom + 18, c.faint, 9, "right");
      MP.label(ctx, "0", left, bottom + 18, c.faint, 8);
      MP.label(ctx, "8", right, bottom + 18, c.faint, 8, "right");

      var bx = left + ((Tm) / 8) * pw;
      ctx.save();
      ctx.strokeStyle = c.ink;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(bx, top);
      ctx.lineTo(bx, bottom);
      ctx.stroke();
      ctx.restore();

      var bin = 1 / Ts;
      ctx.save();
      ctx.strokeStyle = "#e5c15a";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(left, bottom - (bin / maxY) * ph);
      ctx.lineTo(right, bottom - (bin / maxY) * ph);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (var i = 0; i <= 160; i++) {
        var tm = (i / 160) * 8;
        var v = intervalCap(Ts, dT, tm);
        var x = left + (tm / 8) * pw;
        var y = bottom - (v / maxY) * ph;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      var cur = intervalCap(Ts, dT, Tm);
      MP.glowDot(ctx, bx, bottom - (cur / maxY) * ph, 4, c.accent2, c.accent);
      var o = optimum(Ts, dT);
      var ox = left + (o.Tm / 8) * pw;
      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(ox, top);
      ctx.lineTo(ox, bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      MP.label(ctx, "optimum", ox, top - 12, c.accent, 8, "center");

      MP.dot(ctx, left + 14, top + 14, 4, c.accent);
      MP.label(ctx, "interval modulation", left + 24, top + 14, c.muted, 9);
      MP.dot(ctx, left + 14, top + 36, 4, "#e5c15a");
      MP.label(ctx, "binary", left + 24, top + 36, c.muted, 9);

      MP.label(ctx, "the same link, two codings", w * 0.5, h * 0.95, c.muted, 9, "center");
    }, { maxDpr: 2 });
  }
})();
