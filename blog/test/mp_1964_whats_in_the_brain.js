(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroInk");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(32, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      var cx = w * 0.5, cy = h * 0.52;
      var R = Math.min(w, h) * 0.23;
      var pts = [];
      for (var i = 0; i < 3; i++) {
        var a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        pts.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * 0.8 });
      }
      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.2;
      pts.forEach(function (p, i) {
        var q = pts[(i + 1) % 3];
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      });
      ctx.restore();
      pts.forEach(function (p, i) {
        ctx.save();
        ctx.shadowBlur = 22;
        ctx.shadowColor = c.accent;
        MP.dot(ctx, p.x, p.y, 7, c.accent);
        ctx.restore();
        MP.label(ctx, ["sender", "signal", "receiver"][i], p.x, p.y + (i === 0 ? -22 : 26), c.muted, 9, "center");
      });
      var prog = (t * 0.3) % 1;
      var a2 = pts[0], b2 = pts[1];
      MP.glowDot(ctx, MP.lerp(a2.x, b2.x, prog), MP.lerp(a2.y, b2.y, prog), 3, c.accent2, c.accent);
      MP.label(ctx, "A means B to C", cx, cy + R * 0.85, c.accent, 11, "center");
      MP.label(ctx, "the Lekton is in the head", cx, cy - R * 0.85, c.muted, 9, "center");
    }, { maxDpr: 1.6 });
  }

  var tri = document.getElementById("triadLab");
  if (tri) {
    var st = { triadic: true, ectopic: false };
    var modeEl = document.getElementById("triadMode");
    var signalEl = document.getElementById("triadSignal");
    var meaningEl = document.getElementById("triadMeaning");
    var bTri = document.getElementById("modeTriad");
    var bDy = document.getElementById("modeDyad");
    function updateReadout() {
      if (modeEl) modeEl.textContent = st.triadic ? "triadic" : "dyadic";
      if (signalEl) signalEl.textContent = st.ectopic ? "false (noise)" : "true (bound cause)";
      if (meaningEl) meaningEl.textContent = st.triadic ? (st.ectopic ? "false meaning" : "A means B to C") : "not represented";
      if (bTri) bTri.classList.toggle("is-active", st.triadic);
      if (bDy) bDy.classList.toggle("is-active", !st.triadic);
    }
    MP.on("modeTriad", "click", function () { st.triadic = true; updateReadout(); });
    MP.on("modeDyad", "click", function () { st.triadic = false; updateReadout(); });
    MP.on("ectopic", "click", function () { st.ectopic = !st.ectopic; updateReadout(); });
    updateReadout();

    MP.canvas(tri, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(26, Math.min(w, h) * 0.06), c.line);
      ctx.restore();

      var S = { x: w * 0.5, y: h * 0.18 };
      var M = { x: w * 0.24, y: h * 0.8 };
      var R = { x: w * 0.76, y: h * 0.8 };
      var L = { x: w * 0.5, y: h * 0.55 };
      var main = st.ectopic ? "#ef6a6a" : c.accent;

      function node(p, label, color) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        MP.dot(ctx, p.x, p.y, 18, c.panel2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        MP.label(ctx, label, p.x, p.y, color, 9, "center");
      }
      function arrow(a, b, color, dashed, width) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width || 1.4;
        ctx.globalAlpha = 0.75;
        ctx.setLineDash(dashed ? [5, 5] : []);
        var mx = (a.x + b.x) / 2;
        var my = (a.y + b.y) / 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx, my - 18, b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);
        var ang = Math.atan2(b.y - (my - 18), b.x - mx);
        MP.arrow(ctx, b.x - Math.cos(ang) * 26, b.y - Math.sin(ang) * 26, b.x - Math.cos(ang) * 18, b.y - Math.sin(ang) * 18, color, 1.4, 6);
        ctx.restore();
      }

      arrow(S, M, main, false, 1.6);
      arrow(M, R, main, false, 1.6);
      MP.label(ctx, "utterance", w * 0.34, h * 0.46, c.faint, 8, "center");
      MP.label(ctx, "signal", w * 0.63, h * 0.46, c.faint, 8, "center");

      if (st.triadic) {
        arrow(M, L, c.accent2, true, 1.2);
        arrow(L, R, c.accent2, true, 1.2);
        ctx.save();
        ctx.translate(L.x, L.y);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 1.6;
        ctx.shadowBlur = 24;
        ctx.shadowColor = c.accent;
        ctx.strokeRect(-12, -12, 24, 24);
        ctx.restore();
        MP.label(ctx, "Lekton", L.x, L.y - 26, c.accent, 10, "center");
        MP.label(ctx, "meaning", L.x, L.y + 28, c.faint, 8, "center");
      } else {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.translate(L.x, L.y);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = c.faint;
        ctx.strokeRect(-12, -12, 24, 24);
        ctx.restore();
        MP.label(ctx, "no third term", L.x, L.y, c.faint, 9, "center");
      }

      node(S, "S", c.muted);
      node(M, "B", main);
      node(R, "R", c.muted);

      var pp = (t * 0.5) % 1;
      MP.glowDot(ctx, MP.lerp(S.x, M.x, pp), MP.lerp(S.y, M.y, pp), 3, c.accent2, c.accent);
      MP.glowDot(ctx, MP.lerp(M.x, R.x, pp), MP.lerp(M.y, R.y, pp), 3, c.accent2, c.accent);

      if (st.ectopic) {
        ctx.save();
        ctx.strokeStyle = "#ef6a6a";
        ctx.globalAlpha = 0.8;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(M.x, h * 0.08);
        ctx.lineTo(M.x, M.y - 22);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        MP.label(ctx, "ectopic · no bound cause", M.x, h * 0.08, "#ef6a6a", 9, "center");
        MP.label(ctx, "the receiver gets noise", w * 0.5, h * 0.94, "#ef6a6a", 10, "center");
      } else {
        MP.label(ctx, "the signal implies its bound cause", w * 0.5, h * 0.94, c.muted, 10, "center");
      }
    }, { maxDpr: 2 });
  }

  var gold = document.getElementById("goldenLab");
  if (gold) {
    var ratio = 1.61803398875;
    var ratioEl = document.getElementById("ratioVal");
    var ratioEl2 = document.getElementById("ratioVal2");
    var errEl = document.getElementById("ratioErr");
    var phi = (1 + Math.sqrt(5)) / 2;
    MP.bindRange("ratio", function (v) {
      ratio = v;
      if (ratioEl) ratioEl.textContent = ratio.toFixed(4);
      if (ratioEl2) ratioEl2.textContent = ratio.toFixed(4);
      if (errEl) errEl.textContent = Math.abs(ratio - phi).toFixed(4);
    });
    MP.canvas(gold, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(26, Math.min(w, h) * 0.06), c.line);
      ctx.restore();

      var H = h * 0.52;
      var W = H * ratio;
      var maxW = w * 0.76;
      if (W > maxW) { W = maxW; H = W / ratio; }
      var x = (w - W) / 2;
      var y = h * 0.18;
      var near = Math.abs(ratio - phi) < 0.012;

      ctx.save();
      if (near) { ctx.shadowBlur = 28; ctx.shadowColor = c.accent; }
      ctx.strokeStyle = near ? c.accent : c.ink;
      ctx.lineWidth = near ? 2.2 : 1.4;
      ctx.strokeRect(x, y, W, H);
      ctx.restore();

      var sq = H;
      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x + sq, y);
      ctx.lineTo(x + sq, y + H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      MP.label(ctx, "square", x + sq / 2, y + H + 18, c.faint, 8, "center");
      MP.label(ctx, "remainder", x + sq + (W - sq) / 2, y + H + 18, c.faint, 8, "center");

      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = c.accent;
      ctx.setLineDash([2, 5]);
      ctx.strokeRect(x, y, H * phi, H);
      ctx.setLineDash([]);
      ctx.restore();

      MP.label(ctx, "φ = " + phi.toFixed(6), w * 0.5, h * 0.08, c.accent, 11, "center");
      MP.label(ctx, near ? "recognised at a glance" : "drag toward the golden section", w * 0.5, h * 0.9, near ? c.accent : c.muted, 10, "center");

      if (near) {
        ctx.save();
        ctx.strokeStyle = c.accent;
        ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + W / 2, y + H / 2, Math.max(W, H) * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }, { maxDpr: 2 });
  }
})();
