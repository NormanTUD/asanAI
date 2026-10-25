(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroPitts");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(32, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      var cx = w * 0.5, cy = h * 0.5;
      var pts = [];
      for (var i = 0; i < 9; i++) {
        var a = (i / 9) * Math.PI * 2;
        pts.push({ x: cx + Math.cos(a) * Math.min(w, h) * 0.3, y: cy + Math.sin(a) * Math.min(w, h) * 0.22 });
      }
      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1;
      pts.forEach(function (p, i) {
        var q = pts[(i + 1) % pts.length];
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      });
      ctx.restore();
      pts.forEach(function (p, i) {
        var pulse = 0.5 + 0.5 * Math.sin(t * 1.2 + i);
        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = c.accent;
        MP.dot(ctx, p.x, p.y, 3 + pulse * 2, c.accent);
        ctx.restore();
      });
      for (var k = 0; k < 8; k++) {
        var ang = k * 0.8 + t * 0.2;
        var r = Math.min(w, h) * (0.08 + k * 0.025);
        MP.glowDot(ctx, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.7, 1.8, c.accent2, c.accent);
      }
      MP.label(ctx, "stability, neutrality, and the shape of a net", w * 0.5, h * 0.92, c.muted, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var phase = document.getElementById("phaseLab");
  if (phase) {
    var st = { a: -0.4, b: 1.0, c: -1.0, d: -0.4 };
    var eigenEl = document.getElementById("eigenVal");
    var typeEl = document.getElementById("typeVal");
    var stableEl = document.getElementById("stableVal");

    function setPreset(a, b, c2, d) {
      st.a = a; st.b = b; st.c = c2; st.d = d;
      ["pa", "pb", "pc", "pd"].forEach(function (id, i) {
        var el = document.getElementById(id);
        if (el) { el.value = [a, b, c2, d][i]; MP.rangeFill(el); }
      });
      updateReadout();
    }
    function updateReadout() {
      var tr = st.a + st.d;
      var det = st.a * st.d - st.b * st.c;
      var disc = tr * tr - 4 * det;
      var l1, l2, label;
      if (disc < 0) {
        var re = tr / 2, im = Math.sqrt(-disc) / 2;
        l1 = re.toFixed(2) + " + " + im.toFixed(2) + "i";
        l2 = re.toFixed(2) + " − " + im.toFixed(2) + "i";
        label = Math.abs(re) < 0.01 ? "centre" : re < 0 ? "stable spiral" : "unstable spiral";
      } else {
        var s = Math.sqrt(disc);
        var r1 = (tr + s) / 2, r2 = (tr - s) / 2;
        l1 = r1.toFixed(2); l2 = r2.toFixed(2);
        if (r1 * r2 < 0) label = "saddle";
        else if (r1 < 0 && r2 < 0) label = "stable node";
        else if (r1 > 0 && r2 > 0) label = "unstable node";
        else label = "neutral";
      }
      if (eigenEl) eigenEl.textContent = l1 + " , " + l2;
      if (typeEl) typeEl.textContent = label;
      if (stableEl) stableEl.textContent = (tr < 0 ? "yes" : tr > 0 ? "no" : "neutral");
    }
    ["pa", "pb", "pc", "pd"].forEach(function (id) {
      MP.bindRange(id, function (v) {
        st[id[1]] = v;
        updateReadout();
      });
    });
    MP.on("presetStable", "click", function () { setPreset(-0.7, 0.2, 0.2, -0.5); });
    MP.on("presetSpiral", "click", function () { setPreset(-0.4, 1.0, -1.0, -0.4); });
    MP.on("presetSaddle", "click", function () { setPreset(0.5, 0.2, 0.2, -0.5); });
    MP.on("presetCenter", "click", function () { setPreset(0, 1.0, -1.0, 0); });
    updateReadout();

    MP.canvas(phase, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(24, Math.min(w, h) * 0.055), c.line);
      ctx.restore();

      var cx = w * 0.5, cy = h * 0.5;
      var scale = Math.min(w, h) * 0.36;
      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(w, cy);
      ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
      ctx.stroke();
      ctx.restore();

      var N = 13;
      for (var i = 0; i <= N; i++) {
        for (var j = 0; j <= N; j++) {
          var x = (i / N) * 2 - 1;
          var y = (j / N) * 2 - 1;
          if (x * x + y * y > 1.05) continue;
          var dx = st.a * x + st.b * y;
          var dy = st.c * x + st.d * y;
          var len = Math.hypot(dx, dy);
          if (len < 0.001) continue;
          var ux = dx / len, uy = dy / len;
          var px = cx + x * scale, py = cy - y * scale;
          var L = Math.min(14, len * 10);
          MP.arrow(ctx, px, py, px + ux * L, py - uy * L, c.accent, 1, 4);
        }
      }

      var starts = [];
      for (var k = 0; k < 8; k++) {
        var a = (k / 8) * Math.PI * 2;
        starts.push({ x: Math.cos(a) * 0.9, y: Math.sin(a) * 0.9 });
      }
      var hstep = 0.02;
      starts.forEach(function (p, idx) {
        var X = p.x, Y = p.y;
        ctx.save();
        ctx.strokeStyle = idx % 2 === 0 ? c.accent2 : c.accent;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (var s = 0; s < 260; s++) {
          var dx2 = st.a * X + st.b * Y;
          var dy2 = st.c * X + st.d * Y;
          X += dx2 * hstep;
          Y += dy2 * hstep;
          if (Math.abs(X) > 2 || Math.abs(Y) > 2) break;
          var sx = cx + X * scale, sy = cy - Y * scale;
          if (s === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.restore();
        MP.glowDot(ctx, cx + p.x * scale, cy - p.y * scale, 2.2, c.accent, c.accent);
      });

      MP.glowDot(ctx, cx, cy, 3, c.ink, c.ink);
      MP.label(ctx, "phase portrait · a continuous reading of Pitts's linear dynamics", w * 0.5, h * 0.95, c.muted, 9, "center");
    }, { maxDpr: 2 });
  }

  var act = document.getElementById("activationLab");
  if (act) {
    var drive = 0.5, threshold = 0.3;
    var driveEl = document.getElementById("driveVal");
    var outEl = document.getElementById("actOut");
    var regimeEl = document.getElementById("actRegime");
    function activation(s) {
      if (s < threshold) return 0;
      if (s > threshold + 1) return 1;
      return s - threshold;
    }
    function updateAct() {
      var out = activation(drive);
      if (driveEl) driveEl.textContent = drive.toFixed(2);
      if (outEl) outEl.textContent = out.toFixed(2);
      if (regimeEl) regimeEl.textContent = drive < threshold ? "silent" : drive > threshold + 1 ? "saturated" : "linear";
    }
    MP.bindRange("drive", function (v) { drive = v; updateAct(); });
    MP.bindRange("threshold", function (v) { threshold = v; updateAct(); });
    updateAct();

    MP.canvas(act, function (ctx, w, h) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(24, Math.min(w, h) * 0.06), c.line);
      ctx.restore();

      var left = w * 0.1, right = w * 0.95, top = h * 0.16, bottom = h * 0.82;
      var pw = right - left, ph = bottom - top;
      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.lineTo(right, bottom);
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, "activation", left - 10, top - 10, c.faint, 8, "right");
      MP.label(ctx, "stimulation →", right, bottom + 18, c.faint, 9, "right");
      MP.label(ctx, "0", left, bottom + 18, c.faint, 8);
      MP.label(ctx, "1.5", right, bottom + 18, c.faint, 8, "right");
      MP.label(ctx, "1", left - 10, top, c.faint, 8, "right");
      MP.label(ctx, "0", left - 10, bottom, c.faint, 8, "right");

      function px(s) { return left + (s / 1.5) * pw; }
      function py(v) { return bottom - v * ph; }

      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (var i = 0; i <= 120; i++) {
        var s = (i / 120) * 1.5;
        var x = px(s), y = py(activation(s));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(px(threshold), top); ctx.lineTo(px(threshold), bottom);
      ctx.moveTo(left, py(1)); ctx.lineTo(right, py(1));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      MP.label(ctx, "threshold", px(threshold), top - 10, c.accent, 8, "center");
      MP.label(ctx, "saturation", left + 8, py(1) - 8, c.faint, 8);

      MP.glowDot(ctx, px(drive), py(activation(drive)), 4, c.accent2, c.accent);
      MP.label(ctx, "input", px(drive), h * 0.9, c.muted, 8, "center");
    }, { maxDpr: 2 });
  }
})();
