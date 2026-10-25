(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroStatistical");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(30, Math.min(w, h) * 0.07), c.line);
      ctx.restore();

      var left = w * 0.08, right = w * 0.92;
      var midY = h * 0.52;
      var amp = h * 0.16;

      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      for (var i = 0; i <= 120; i++) {
        var x = left + (i / 120) * (right - left);
        var u = i / 120;
        var y = midY + (1 / (1 + Math.exp(-(u - 0.5) * 9)) - 0.5) * -amp * 2;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      for (var k = 0; k < 5; k++) {
        var u2 = 0.12 + k * 0.18;
        var x2 = left + u2 * (right - left);
        var y2 = midY + (1 / (1 + Math.exp(-(u2 - 0.5) * 9)) - 0.5) * -amp * 2;
        var pulse = 0.5 + 0.5 * Math.sin(t * 2 + k);
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.4 * pulse;
        ctx.strokeStyle = c.line;
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.moveTo(x2, h * 0.86);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        MP.glowDot(ctx, x2, y2, 3, c.accent2, c.accent);
      }
      MP.label(ctx, "threshold h′", left + 0.5 * (right - left), h * 0.86, c.faint, 9, "center");
      MP.label(ctx, "afferent rate p", right, h * 0.94, c.muted, 9, "right");
      MP.label(ctx, "E(p)", left, h * 0.08, c.accent, 11);
      MP.label(ctx, "the stretch reflex is a sigmoid with a body", w * 0.5, h * 0.08, c.muted, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var canvas = document.getElementById("reflexServo");
  if (!canvas) return;

  var state = { L: 1.0, load: 4, h: 0.5, cut: false, p: 0.5, E: 0.5, T: 0 };
  var lenEl = document.getElementById("lenVal");
  var affEl = document.getElementById("affVal");
  var effEl = document.getElementById("effVal");
  var tenEl = document.getElementById("tenVal");
  var cutBtn = document.getElementById("cutFeedback");

  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
  function receptor(L) { return sigmoid((L - 0.85) * 5.2); }
  function motor(p, h) { return sigmoid((p - h) / 0.11); }

  MP.bindRange("load", function (v) { state.load = v; });
  MP.bindRange("centralH", function (v) { state.h = v; });
  MP.on("cutFeedback", "click", function () {
    state.cut = !state.cut;
    if (cutBtn) cutBtn.classList.toggle("is-active", state.cut);
    if (cutBtn) cutBtn.textContent = state.cut ? "Reconnect afferents" : "Cut afferents";
  });
  MP.on("resetServo", "click", function () {
    state.L = 1.0;
  });

  MP.canvas(canvas, function (ctx, w, h, t, dt) {
    var c = MP.colors();
    var p = state.cut ? 0 : receptor(state.L);
    var E = motor(p, state.h);
    var T = 7.2 * E;
    var rate = 0.55;
    state.L += (state.load - T) * rate * (dt || 0.016);
    state.L = MP.clamp(state.L, 0.35, 1.75);
    state.p = p; state.E = E; state.T = T;
    if (lenEl) lenEl.textContent = state.L.toFixed(2);
    if (affEl) affEl.textContent = p.toFixed(3);
    if (effEl) effEl.textContent = E.toFixed(3);
    if (tenEl) tenEl.textContent = T.toFixed(1);

    ctx.save();
    ctx.globalAlpha = 0.2;
    MP.grid(ctx, w, h, Math.max(28, Math.min(w, h) * 0.065), c.line);
    ctx.restore();

    var mx = w * 0.22;
    var top = h * 0.18;
    var bottom = h * 0.74;
    var stretch = (state.L - 0.35) / 1.4;
    var mh = (bottom - top) * (0.55 + stretch * 0.45);

    ctx.save();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.85;
    MP.rr(ctx, mx - 34, top, 68, mh, 22);
    ctx.stroke();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = c.accent;
    ctx.fill();
    ctx.restore();
    for (var i = 0; i < 6; i++) {
      var yy = top + (i / 5) * mh;
      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(mx - 24, yy);
      ctx.lineTo(mx + 24, yy);
      ctx.stroke();
      ctx.restore();
    }
    MP.label(ctx, "muscle", mx, top - 14, c.muted, 9, "center");

    ctx.save();
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(mx, top + mh);
    ctx.lineTo(mx, bottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx - 20, bottom);
    ctx.lineTo(mx + 20, bottom);
    ctx.stroke();
    MP.rr(ctx, mx - 22, bottom, 44, 30, 5);
    ctx.fillStyle = c.panel2;
    ctx.fill();
    ctx.strokeStyle = c.line;
    ctx.stroke();
    ctx.restore();
    MP.label(ctx, "load " + state.load.toFixed(1), mx, bottom + 48, c.faint, 9, "center");

    var sx = w * 0.46;
    var sy = h * 0.42;
    ctx.save();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(sx, sy, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx, sy + 20, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    MP.label(ctx, "spindle", sx, sy - 24, c.muted, 9, "center");

    ctx.save();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(mx + 34, sy);
    ctx.quadraticCurveTo(w * 0.34, sy - 40, sx - 12, sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    MP.label(ctx, "afferent p = " + p.toFixed(2), w * 0.35, sy - 48, c.accent, 9, "center");

    var cx = w * 0.62;
    var cy = h * 0.42;
    ctx.save();
    ctx.strokeStyle = state.cut ? "#d96b6b" : c.accent;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.12;
    ctx.fill();
    ctx.restore();
    MP.label(ctx, "motor", cx, cy, c.ink, 8, "center");
    MP.label(ctx, "threshold h′ = " + state.h.toFixed(2), cx, cy + 34, c.faint, 8, "center");

    ctx.save();
    ctx.strokeStyle = state.cut ? "#d96b6b" : c.accent;
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.7;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sx + 12, sy + 10);
    ctx.quadraticCurveTo(w * 0.54, sy - 10, cx - 18, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx + 18, cy);
    ctx.quadraticCurveTo(w * 0.5, cy + 70, mx + 34, top + mh * 0.5);
    ctx.stroke();
    ctx.restore();
    MP.label(ctx, "efferent E = " + E.toFixed(2), w * 0.56, cy + 60, c.accent, 9, "center");

    if (state.cut) {
      MP.label(ctx, "afferents cut · the loop is open", w * 0.5, h * 0.9, "#d96b6b", 10, "center");
    }

    var px = w * 0.76, py = h * 0.16, pw = w * 0.2, ph = h * 0.62;
    ctx.save();
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + ph);
    ctx.lineTo(px + pw, py + ph);
    ctx.stroke();
    ctx.restore();
    MP.label(ctx, "E(p)", px - 8, py - 10, c.faint, 8);
    MP.label(ctx, "1", px - 8, py + 4, c.faint, 8, "ahead");
    MP.label(ctx, "0", px - 8, py + ph, c.faint, 8, "ahead");
    MP.label(ctx, "p →", px + pw, py + ph + 16, c.faint, 8, "right");

    ctx.save();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var j = 0; j <= 80; j++) {
      var u = j / 80;
      var v = motor(u, state.h);
      var xx = px + u * pw;
      var yy = py + ph - v * ph;
      if (j === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    ctx.restore();

    var curX = px + MP.clamp(p, 0, 1) * pw;
    var curY = py + ph - E * ph;
    ctx.save();
    ctx.strokeStyle = c.line;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(curX, py + ph);
    ctx.lineTo(curX, curY);
    ctx.lineTo(px, curY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    MP.glowDot(ctx, curX, curY, 4, c.accent2, c.accent);

    MP.label(ctx, "gain set by h′", w * 0.86, h * 0.88, c.muted, 9, "center");
  }, { maxDpr: 2 });
})();
