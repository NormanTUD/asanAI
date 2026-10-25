(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroCoda");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      var cx = w * 0.5, cy = h * 0.5;
      var R = Math.min(w, h) * 0.22;
      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(32, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = c.accent;
      ctx.fill();
      ctx.restore();

      for (var i = 0; i < 18; i++) {
        var a = t * 0.2 + (i / 18) * Math.PI * 2;
        var rr = R * (0.35 + 0.55 * ((i * 0.618) % 1));
        MP.glowDot(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8, 1.8, c.accent2, c.accent);
      }

      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.2);
      ctx.lineTo(w * 0.1, h * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w * 0.1, h * 0.5, h * 0.03, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, "peephole", w * 0.1, h * 0.86, c.faint, 9, "center");
      MP.label(ctx, "participation", w * 0.5, h * 0.86, c.muted, 9, "center");

      var loopR = Math.min(w, h) * 0.06;
      var lx = w * 0.82, ly = h * 0.5;
      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(lx, ly, loopR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, "T", lx, ly - loopR - 10, c.accent, 9, "center");
      MP.label(ctx, "F", lx, ly + loopR + 10, c.faint, 9, "center");
      var prog = (t * 0.6) % 1;
      var pa = prog * Math.PI * 2 - Math.PI / 2;
      MP.glowDot(ctx, lx + Math.cos(pa) * loopR, ly + Math.sin(pa) * loopR, 2.4, c.accent2, c.accent);
      MP.label(ctx, "the liar's loop", lx, ly + loopR + 28, c.faint, 8, "center");
    }, { maxDpr: 1.6 });
  }

  var canvas = document.getElementById("codaLab");
  if (!canvas) return;

  var st = { part: 0.5 };
  var stanceEl = document.getElementById("stanceVal");
  var respEl = document.getElementById("responsibilityVal");
  var quoteEl = document.getElementById("stanceQuote");

  MP.bindRange("participation", function (v) {
    st.part = v / 100;
    if (stanceEl) stanceEl.textContent = st.part < 0.2 ? "I am apart" : st.part > 0.8 ? "I am part" : "between the two";
    if (respEl) respEl.textContent = st.part < 0.2 ? "the universe is a spectacle" : st.part > 0.8 ? "my act changes the whole" : "a decision is required";
    if (quoteEl) quoteEl.textContent = st.part < 0.2
      ? "“Am I apart from the Universe? That is whenever I look I am looking as through a peephole upon an unfolding universe.”"
      : st.part > 0.8
        ? "“Am I part of the Universe? That is whenever I act, I am changing myself and the universe as well.”"
        : "“We become metaphysicians … whenever we decide upon in principle undecidable questions.”";
  });

  MP.canvas(canvas, function (ctx, w, h, t) {
    var c = MP.colors();
    var p = st.part;
    ctx.save();
    ctx.globalAlpha = 0.18;
    MP.grid(ctx, w, h, Math.max(28, Math.min(w, h) * 0.065), c.line);
    ctx.restore();

    var cx = w * 0.58, cy = h * 0.5;
    var R = Math.min(w, h) * 0.27;
    var warm = p;

    ctx.save();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 1.2 + warm * 0.6;
    ctx.globalAlpha = 0.25 + warm * 0.45;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.06 + warm * 0.12;
    ctx.fillStyle = c.accent;
    ctx.fill();
    ctx.restore();

    for (var r = 1; r <= 4; r++) {
      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.globalAlpha = (0.04 + warm * 0.12) * (1 - r / 6);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R * (0.25 + r * 0.18) + Math.sin(t * 1.2 + r) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (var i = 0; i < 26; i++) {
      var a = (i / 26) * Math.PI * 2 + t * 0.08;
      var rr = R * (0.3 + 0.6 * ((i * 0.618) % 1));
      var px = cx + Math.cos(a) * rr;
      var py = cy + Math.sin(a) * rr * 0.82;
      ctx.save();
      ctx.globalAlpha = 0.2 + warm * 0.5;
      MP.dot(ctx, px, py, 1.2 + (i % 3) * 0.4, i % 4 === 0 ? c.accent : c.muted);
      ctx.restore();
    }

    var wallX = w * 0.2;
    ctx.save();
    ctx.strokeStyle = c.line;
    ctx.globalAlpha = 1 - p * 0.9;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wallX, h * 0.16);
    ctx.lineTo(wallX, h * 0.84);
    ctx.stroke();
    ctx.restore();
    MP.label(ctx, "the wall of the observer", wallX, h * 0.88, c.faint, 8, "center");

    var eyeX = w * 0.1, eyeY = h * 0.5;
    ctx.save();
    ctx.globalAlpha = 1 - p * 0.85;
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 22, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    MP.label(ctx, "the knower", eyeX, eyeY + 30, c.muted, 8, "center");

    ctx.save();
    ctx.globalAlpha = 0.12 + p * 0.5;
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(eyeX + 28, eyeY);
    ctx.lineTo(cx - R, eyeY);
    ctx.stroke();
    ctx.restore();

    var fx = cx - R * 0.2, fy = cy + R * 0.15;
    ctx.save();
    ctx.globalAlpha = 0.15 + p * 0.85;
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 1.4;
    MP.dot(ctx, fx, fy - R * 0.18, R * 0.07, c.accent);
    ctx.beginPath();
    ctx.moveTo(fx, fy - R * 0.1);
    ctx.lineTo(fx, fy + R * 0.12);
    ctx.moveTo(fx, fy - R * 0.02);
    ctx.lineTo(fx - R * 0.1, fy + R * 0.06);
    ctx.moveTo(fx, fy - R * 0.02);
    ctx.lineTo(fx + R * 0.1, fy + R * 0.06);
    ctx.moveTo(fx, fy + R * 0.12);
    ctx.lineTo(fx - R * 0.08, fy + R * 0.24);
    ctx.moveTo(fx, fy + R * 0.12);
    ctx.lineTo(fx + R * 0.08, fy + R * 0.24);
    ctx.stroke();
    ctx.restore();
    MP.label(ctx, "the actor", cx, cy + R + 18, c.accent, 9, "center");

    var lx = w * 0.86, ly = h * 0.5;
    var loopR = Math.min(w, h) * 0.06;
    ctx.save();
    ctx.strokeStyle = c.accent;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(lx, ly, loopR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    MP.label(ctx, "T", lx, ly - loopR - 10, c.accent, 9, "center");
    MP.label(ctx, "F", lx, ly + loopR + 10, c.faint, 9, "center");
    var prog = (t * 0.6) % 1;
    var pa = prog * Math.PI * 2 - Math.PI / 2;
    MP.glowDot(ctx, lx + Math.cos(pa) * loopR, ly + Math.sin(pa) * loopR, 2.4, c.accent2, c.accent);
    MP.label(ctx, "the liar's loop", lx, ly + loopR + 28, c.faint, 8, "center");

    MP.label(ctx, p < 0.2 ? "a peephole on an unfolding universe" : p > 0.8 ? "an actor inside a changing universe" : "the undecidable between them", w * 0.5, h * 0.94, p < 0.2 || p > 0.8 ? c.accent : c.muted, 10, "center");
  }, { maxDpr: 2 });
})();
