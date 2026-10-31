(function () {
  "use strict";
  if (!window.MP) return;

  var SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';

  var hero = document.getElementById("heroDelusion");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      var cx = w * 0.5;
      var cy = h * 0.48;
      var R = Math.min(w, h) * 0.23;
      var labels = ["symptom", "theory", "resistance", "proof"];
      var spin = t * 0.12;

      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(32, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      for (var m = 0; m < 2; m++) {
        var sign = m === 0 ? 1 : -1;
        var alpha = m === 0 ? 0.4 : 0.13;
        var pts = [];
        for (var i = 0; i < 4; i++) {
          var a = (i / 4) * Math.PI * 2 - Math.PI / 2 + spin;
          pts.push({
            x: cx + Math.cos(a) * R,
            y: cy + Math.sin(a) * R * 0.68 * sign
          });
        }
        for (var k = 0; k < 4; k++) {
          var p = pts[k];
          var q = pts[(k + 1) % 4];
          ctx.save();
          ctx.strokeStyle = c.accent;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = m === 0 ? 1.8 : 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.quadraticCurveTo(cx, cy, q.x, q.y);
          ctx.stroke();
          ctx.restore();
        }
        if (m === 0) {
          pts.forEach(function (pt, idx) {
            ctx.save();
            ctx.shadowBlur = 22;
            ctx.shadowColor = c.accent;
            MP.dot(ctx, pt.x, pt.y, 8, c.accent);
            ctx.restore();
            ctx.save();
            ctx.globalAlpha = 0.85;
            MP.label(ctx, labels[idx], pt.x, pt.y + (pt.y < cy ? -22 : 26), c.muted, 9, "center");
            ctx.restore();
          });
        }
      }

      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(w, h) * 0.045, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + Math.min(w, h) * 0.045);
      ctx.lineTo(cx, cy + Math.min(w, h) * 0.085);
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, "no exit", cx, cy + Math.min(w, h) * 0.12, c.faint, 9, "center");

      ctx.save();
      ctx.globalAlpha = 0.055;
      MP.label(ctx, "↻", w * 0.84, h * 0.3, c.accent, Math.min(w, h) * 0.4, "center", SERIF);
      ctx.restore();

      MP.label(ctx, "the theory that can explain every resistance", w * 0.5, h * 0.93, c.faint, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var loopCanvas = document.getElementById("loopLab");
  if (loopCanvas) {
    var loop = { gain: 0.78, open: false };
    var gainEl = document.getElementById("gainVal");
    var loopEl = document.getElementById("loopVal");
    var predEl = document.getElementById("predVal");
    var statusEl = document.getElementById("loopStatus");
    var testBtn = document.getElementById("externalTest");

    function loopUpdate() {
      if (gainEl) gainEl.textContent = loop.gain.toFixed(2);
      if (loopEl) loopEl.textContent = loop.open ? "open to test" : loop.gain > 0.6 ? "self-sealing" : "loosely coupled";
      if (predEl) predEl.textContent = loop.open ? "many" : loop.gain > 0.6 ? "0" : "1–2";
      if (statusEl) statusEl.textContent = loop.open ? "an external observation can break the loop" : loop.gain > 0.6 ? "the loop confirms itself" : "the loop is weak";
      if (testBtn) {
        testBtn.textContent = loop.open ? "Close the loop" : "Admit an external test";
        testBtn.classList.toggle("is-active", loop.open);
      }
    }

    MP.bindRange("loopGain", function (v) { loop.gain = v; loopUpdate(); });
    MP.on("externalTest", "click", function () { loop.open = !loop.open; loopUpdate(); });
    MP.on("resetLoop", "click", function () {
      loop.gain = 0.78;
      loop.open = false;
      var e = document.getElementById("loopGain");
      if (e) { e.value = "0.78"; MP.rangeFill(e); }
      loopUpdate();
    });
    loopUpdate();

    MP.canvas(loopCanvas, function (ctx, w, h, t) {
      var c = MP.colors();
      var cx = w * 0.5;
      var cy = h * 0.5;
      var R = Math.min(w, h) * 0.26;
      var nodes = ["symptom", "interpretation", "resistance", "confirmation"];
      var pts = [];
      for (var i = 0; i < 4; i++) {
        var a = (i / 4) * Math.PI * 2 - Math.PI / 2;
        pts.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * 0.72, a: a, label: nodes[i] });
      }

      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(26, Math.min(w, h) * 0.06), c.line);
      ctx.restore();

      var closed = !loop.open;
      var hot = closed && loop.gain > 0.6;
      var loopColor = loop.open ? c.faint : hot ? "#ef6a6a" : c.accent;

      for (var k = 0; k < 4; k++) {
        var p = pts[k];
        var q = pts[(k + 1) % 4];
        ctx.save();
        ctx.strokeStyle = loopColor;
        ctx.globalAlpha = loop.open ? 0.2 : 0.7;
        ctx.lineWidth = 1.8 + loop.gain * 1.6;
        if (loop.open && k === 3) ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.quadraticCurveTo(cx, cy, q.x, q.y);
        ctx.stroke();
        ctx.setLineDash([]);
        var ang = Math.atan2(q.y - cy, q.x - cx);
        MP.arrow(ctx, q.x - Math.cos(ang) * 26, q.y - Math.sin(ang) * 26, q.x - Math.cos(ang) * 16, q.y - Math.sin(ang) * 16, loopColor, 1.4, 6);
        ctx.restore();
      }

      pts.forEach(function (pt) {
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = loopColor;
        MP.dot(ctx, pt.x, pt.y, 15, c.panel2);
        ctx.strokeStyle = loopColor;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        MP.label(ctx, pt.label, pt.x, pt.y + 28, c.muted, 8, "center");
      });

      var prog = (t * (0.25 + loop.gain * 0.6)) % 4;
      if (!isFinite(prog)) prog = 0;
      var seg = ((Math.floor(prog) % 4) + 4) % 4;
      var f = prog - seg;
      var a1 = pts[seg], b1 = pts[(seg + 1) % 4];
      var px = MP.lerp(a1.x, b1.x, f);
      var py = MP.lerp(a1.y, b1.y, f);
      MP.glowDot(ctx, px, py, 4, loopColor, loopColor);

      if (loop.open) {
        var target = pts[3];
        ctx.save();
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(w * 0.88, h * 0.12);
        ctx.lineTo(target.x + 20, target.y - 20);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        MP.label(ctx, "external observation", w * 0.88, h * 0.08, c.accent, 8, "center");
        MP.label(ctx, "a prediction can fail", cx, cy, c.accent, 9, "center");
      } else if (hot) {
        ctx.save();
        ctx.strokeStyle = "#ef6a6a";
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        MP.label(ctx, "no exit", cx, cy, "#ef6a6a", 9, "center");
      } else {
        MP.label(ctx, "weak coupling", cx, cy, c.faint, 9, "center");
      }

      MP.label(ctx, "symptom → interpretation → resistance → confirmation → symptom", w * 0.5, h * 0.95, c.muted, 8, "center");
    }, { maxDpr: 2 });
  }

  var forgetCanvas = document.getElementById("forgetLab");
  if (forgetCanvas) {
    var forget = { half: 0.5, total: false };
    var halfEl = document.getElementById("halfVal");
    var weekEl = document.getElementById("weekVal");
    var yearEl = document.getElementById("yearVal");
    var verdictEl = document.getElementById("verdictVal");
    var recallBtn = document.getElementById("totalRecall");

    function pct(v) {
      if (v >= 99.999) return "100%";
      if (v >= 1) return v.toFixed(1) + "%";
      if (v >= 0.001) return v.toFixed(3) + "%";
      return "<0.001%";
    }
    function retention(t, h) { return 100 * Math.pow(2, -t / h); }

    function forgetUpdate() {
      var h = forget.total ? 1e9 : forget.half;
      if (halfEl) halfEl.textContent = forget.total ? "∞" : forget.half.toFixed(2);
      if (weekEl) weekEl.textContent = pct(retention(7, h));
      if (yearEl) yearEl.textContent = pct(retention(365, h));
      if (verdictEl) verdictEl.textContent = forget.total ? "a head the size of a small elephant" : forget.half < 0.75 ? "the trace is gone in days" : "a longer trace, against the evidence";
      if (recallBtn) {
        recallBtn.textContent = forget.total ? "Return to the forgetting curve" : "Imagine total recall";
        recallBtn.classList.toggle("is-active", forget.total);
      }
    }

    MP.bindRange("forgetHalf", function (v) { forget.half = v; forgetUpdate(); });
    MP.on("totalRecall", "click", function () { forget.total = !forget.total; forgetUpdate(); });
    MP.on("resetForget", "click", function () {
      forget.half = 0.5;
      forget.total = false;
      var e = document.getElementById("forgetHalf");
      if (e) { e.value = "0.5"; MP.rangeFill(e); }
      forgetUpdate();
    });
    forgetUpdate();

    MP.canvas(forgetCanvas, function (ctx, w, h, t) {
      var c = MP.colors();
      var left = w * 0.11;
      var right = w * 0.92;
      var top = h * 0.12;
      var bottom = h * 0.84;
      var spanX = right - left;
      var spanY = bottom - top;
      var hh = forget.total ? 1e9 : forget.half;

      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(26, Math.min(w, h) * 0.06), c.line);
      ctx.restore();

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
        var y = bottom - (g / 4) * spanY;
        ctx.save();
        ctx.strokeStyle = c.line;
        ctx.globalAlpha = g === 0 ? 0.35 : 0.18;
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
        ctx.restore();
        MP.label(ctx, (g * 25) + "%", left - w * 0.02, y, c.faint, 8, "right");
      }
      for (var d = 0; d <= 14; d += 2) {
        var x = left + (d / 14) * spanX;
        MP.label(ctx, d + "d", x, bottom + h * 0.035, c.faint, 8, "center");
      }

      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i <= 220; i++) {
        var tt = (i / 220) * 14;
        var v = retention(tt, hh);
        var xx = left + (tt / 14) * spanX;
        var yy = bottom - (v / 100) * spanY;
        if (i === 0) ctx.moveTo(xx, yy);
        else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      ctx.restore();

      if (!forget.total && forget.half <= 14) {
        var hx = left + (forget.half / 14) * spanX;
        var hy = bottom - 0.5 * spanY;
        ctx.save();
        ctx.strokeStyle = c.accent;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(hx, bottom);
        ctx.lineTo(hx, hy);
        ctx.lineTo(left, hy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        MP.glowDot(ctx, hx, hy, 4, c.accent, c.accent);
        MP.label(ctx, "half-life " + forget.half.toFixed(1) + " d", hx + 8, hy - 12, c.accent, 8, "left");
      }

      var wx = left + (7 / 14) * spanX;
      var wv = retention(7, hh);
      var wy = bottom - (wv / 100) * spanY;
      MP.glowDot(ctx, wx, wy, 3.5, c.accent2, c.accent);
      MP.label(ctx, "1 week", wx, wy - 12, c.muted, 8, "center");

      if (forget.total) {
        var ex = right - Math.min(w, h) * 0.11;
        var ey = bottom - Math.min(w, h) * 0.12;
        ctx.save();
        ctx.strokeStyle = c.accent;
        ctx.globalAlpha = 0.45;
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ex, ey - 4, Math.min(w, h) * 0.075, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        MP.label(ctx, "a small elephant", ex, ey + Math.min(w, h) * 0.095, c.accent, 8, "center");
        MP.label(ctx, "no forgetting", ex, ey - Math.min(w, h) * 0.095, c.faint, 8, "center");
      }

      MP.label(ctx, "retention", left - w * 0.02, top - h * 0.03, c.faint, 8, "right");
      MP.label(ctx, "time since encoding", w * 0.5, h * 0.95, c.faint, 9, "center");

      var pulse = 0.5 + 0.5 * Math.sin(t * 1.8);
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.2 * pulse;
      MP.label(ctx, forget.total ? "total recall is the impossible limit" : "R(t) = 2^(-t/h)", w * 0.5, top + h * 0.04, c.accent, 9, "center");
      ctx.restore();
    }, { maxDpr: 2 });
  }
})();
