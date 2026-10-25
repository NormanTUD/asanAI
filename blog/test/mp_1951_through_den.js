(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroDen");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.16;
      MP.grid(ctx, w, h, Math.max(32, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1;
      for (var i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.55, Math.min(w, h) * (0.16 + i * 0.06), Math.PI, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      var y = h * 0.58;
      for (var x = 0.12; x < 0.9; x += 0.1) {
        MP.glowDot(ctx, x * w, y + Math.sin(t * 1.4 + x * 9) * 5, 2.2, c.accent2, c.accent);
      }
      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(w * 0.56, h * 0.28);
      ctx.lineTo(w * 0.9, h * 0.28);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      MP.label(ctx, "past \u2190", w * 0.2, h * 0.26, c.accent, 10, "center");
      MP.label(ctx, "\u2192 future", w * 0.78, h * 0.32, c.muted, 10, "center");
      MP.label(ctx, "a computing machine can only corrupt revelation", w * 0.5, h * 0.9, c.muted, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var canvas = document.getElementById("denLab");
  if (!canvas) return;

  var st = { fireAt: null, delay: 1.6, intAt: null, done: false, thwarted: false };
  var pastEl = document.getElementById("pastVal");
  var futureEl = document.getElementById("futureVal");
  var willEl = document.getElementById("willVal");

  MP.bindRange("pathDelay", function (v) { st.delay = v; });
  MP.on("fireSignal", "click", function () {
    st.fireAt = performance.now() / 1000;
    st.intAt = null;
    st.done = false;
    st.thwarted = false;
  });
  MP.on("intervene", "click", function () {
    st.intAt = performance.now() / 1000;
  });
  MP.on("resetDen", "click", function () {
    st.fireAt = null; st.intAt = null; st.done = false; st.thwarted = false;
  });

  function polyPoint(pts, p) {
    var n = pts.length - 1;
    var u = MP.clamp(p, 0, 1) * n;
    var i = Math.min(n - 1, Math.floor(u));
    var f = u - i;
    return {
      x: MP.lerp(pts[i].x, pts[i + 1].x, f),
      y: MP.lerp(pts[i].y, pts[i + 1].y, f)
    };
  }

  MP.canvas(canvas, function (ctx, w, h, t) {
    var c = MP.colors();
    var now = performance.now() / 1000;
    var ys = h * 0.56;
    var xs = [0.08, 0.22, 0.38, 0.54, 0.7, 0.86];
    var pts = xs.map(function (x) { return { x: x * w, y: ys }; });
    var nowPt = pts[3];

    var pastPts = [pts[3], pts[2], pts[1], pts[0]];
    var futPts = [pts[3], pts[4], pts[5]];

    var pastProg = 0, futProg = 0, intProg = 0;
    if (st.fireAt !== null) {
      var el = now - st.fireAt;
      pastProg = MP.clamp(el / 1.1, 0, 1);
      futProg = MP.clamp(el / st.delay, 0, 1);
    }
    if (st.intAt !== null) {
      intProg = MP.clamp((now - st.intAt) / 0.9, 0, 1);
      if (intProg >= 0.98 && futProg < 0.98) st.thwarted = true;
    }
    if (futProg >= 0.98 && !st.thwarted) st.done = true;

    ctx.save();
    ctx.globalAlpha = 0.2;
    MP.grid(ctx, w, h, Math.max(28, Math.min(w, h) * 0.065), c.line);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(nowPt.x, h * 0.16);
    ctx.lineTo(nowPt.x, h * 0.84);
    ctx.stroke();
    ctx.restore();
    MP.label(ctx, "NOW", nowPt.x, h * 0.13, c.accent, 10, "center");
    MP.label(ctx, "receptors", xs[0] * w, h * 0.84, c.faint, 9, "center");
    MP.label(ctx, "effector", xs[5] * w, h * 0.84, c.faint, 9, "center");

    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      var past = i < 3;
      ctx.save();
      ctx.strokeStyle = past ? c.accent : c.line;
      ctx.globalAlpha = past ? 0.55 : 0.35;
      ctx.lineWidth = past ? 1.6 : 1.2;
      ctx.setLineDash(past ? [] : [4, 6]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      var mid = { x: (a.x + b.x) / 2, y: a.y - 14 };
      MP.label(ctx, past ? "implies" : "intends", mid.x, mid.y, past ? c.accent : c.faint, 8, "center");
    }

    pts.forEach(function (p, i) {
      var isNow = i === 3;
      var isEff = i === 5;
      ctx.save();
      if (isNow) { ctx.shadowBlur = 22; ctx.shadowColor = c.accent; }
      MP.dot(ctx, p.x, p.y, isNow ? 9 : 6, isNow ? c.accent : c.panel2);
      ctx.strokeStyle = isNow ? c.accent2 : c.line;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isNow ? 9 : 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, i === 0 ? "R" : i === 5 ? "E" : "N" + i, p.x, p.y, isNow ? c.ink : c.muted, 9, "center");
    });

    if (st.fireAt !== null && pastProg > 0) {
      var pp = polyPoint(pastPts, pastProg);
      MP.glowDot(ctx, pp.x, pp.y, 6, c.accent2, c.accent);
    }
    if (st.fireAt !== null && futProg > 0 && !st.thwarted) {
      var fp = polyPoint(futPts, futProg);
      ctx.save();
      ctx.globalAlpha = 0.9;
      MP.glowDot(ctx, fp.x, fp.y, 5, c.accent2, c.accent);
      ctx.restore();
    }
    if (st.intAt !== null && intProg > 0) {
      var ix = w * 0.8, iy = h * 0.14;
      var ex = pts[5].x, ey = pts[5].y;
      var ip = { x: MP.lerp(ix, ex, intProg), y: MP.lerp(iy, ey, intProg) };
      ctx.save();
      ctx.strokeStyle = "#d96b6b";
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.quadraticCurveTo(w * 0.88, h * 0.28, ex, ey);
      ctx.stroke();
      ctx.restore();
      MP.glowDot(ctx, ip.x, ip.y, 5, "#ffb0a0", "#d96b6b");
      MP.label(ctx, "intervention", ix, iy - 12, "#d96b6b", 9, "center");
    }

    if (st.thwarted) {
      MP.label(ctx, "THWARTED", pts[5].x, h * 0.9, "#d96b6b", 12, "center");
    } else if (st.done) {
      MP.label(ctx, "DONE", pts[5].x, h * 0.9, c.accent, 12, "center");
    } else if (st.fireAt !== null) {
      MP.label(ctx, "in flight", pts[5].x, h * 0.9, c.muted, 10, "center");
    }

    MP.label(ctx, "solid: the signal implies its antecedents", w * 0.28, h * 0.94, c.accent, 9, "center");
    MP.label(ctx, "dashed: it does not imply its consequences", w * 0.74, h * 0.94, c.muted, 9, "center");

    if (pastEl) pastEl.textContent = st.fireAt !== null && pastProg >= 0.99 ? "implied" : "—";
    if (futureEl) futureEl.textContent = st.thwarted ? "interrupted" : st.done ? "realised" : st.fireAt !== null ? "intended" : "—";
    if (willEl) willEl.textContent = st.thwarted ? "free: deed ≠ intention" : st.done ? "deed followed intention" : "—";
  }, { maxDpr: 2 });
})();
