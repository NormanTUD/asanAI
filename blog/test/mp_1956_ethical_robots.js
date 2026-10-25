(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroEthics");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(32, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      var cx = w * 0.5;
      var cy = h * 0.5;
      var R = Math.min(w, h) * 0.22;
      for (var i = 0; i < 3; i++) {
        var a = t * 0.25 + (i / 3) * Math.PI * 2;
        var x = cx + Math.cos(a) * R;
        var y = cy + Math.sin(a) * R * 0.7;
        ctx.save();
        ctx.strokeStyle = i === 0 ? c.accent : c.line;
        ctx.globalAlpha = i === 0 ? 0.8 : 0.4;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        if (i === 0) {
          ctx.save();
          ctx.shadowBlur = 20;
          ctx.shadowColor = c.accent;
          MP.dot(ctx, x, y, 4, c.accent);
          ctx.restore();
        }
        MP.label(ctx, ["ethical", "moral", "virtuous"][i], x, y + 40, i === 0 ? c.accent : c.muted, 9, "center");
      }
      for (var k = 0; k < 3; k++) {
        var a1 = t * 0.25 + (k / 3) * Math.PI * 2;
        var a2 = t * 0.25 + ((k + 1) / 3) * Math.PI * 2;
        var x1 = cx + Math.cos(a1) * R;
        var y1 = cy + Math.sin(a1) * R * 0.7;
        var x2 = cx + Math.cos(a2) * R;
        var y2 = cy + Math.sin(a2) * R * 0.7;
        ctx.save();
        ctx.strokeStyle = c.accent;
        ctx.globalAlpha = 0.22;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      MP.label(ctx, "a society of machines that learn the rules by playing", w * 0.5, h * 0.92, c.muted, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var canvas = document.getElementById("ethicsLab");
  if (!canvas) return;

  var st = { changeAt: 50, curiosity: 0.6, running: false, t: 100 };
  var ethEl = document.getElementById("ethVal");
  var morEl = document.getElementById("morVal");
  var virEl = document.getElementById("virVal");
  var phaseEl = document.getElementById("phaseVal");

  MP.bindRange("changeAt", function (v) { st.changeAt = v; renderReadout(); });
  MP.bindRange("curiosity", function (v) { st.curiosity = v; renderReadout(); });
  MP.on("runEthics", "click", function () {
    st.t = 0;
    st.running = true;
  });
  MP.on("resetEthics", "click", function () {
    st.t = 0;
    st.running = false;
    renderReadout();
  });

  function eth(t) {
    var tau = 20 - 13 * st.curiosity;
    var peak = 0.62 + 0.32 * st.curiosity;
    if (t < st.changeAt) return 0.12 + (peak - 0.12) * (1 - Math.exp(-t / Math.max(2, tau)));
    return 0.1 + (peak - 0.1) * (1 - Math.exp(-(t - st.changeAt) / Math.max(2, tau)));
  }
  function mor(t) { return t < st.changeAt ? 0.64 : 0.38; }
  function vir(t) { return t < st.changeAt ? 0.98 : 0.06; }
  function renderReadout() {
    if (ethEl) ethEl.textContent = eth(st.t).toFixed(2);
    if (morEl) morEl.textContent = mor(st.t).toFixed(2);
    if (virEl) virEl.textContent = vir(st.t).toFixed(2);
    if (phaseEl) phaseEl.textContent = st.t < st.changeAt ? "before rule change" : "after rule change";
  }
  renderReadout();

  MP.canvas(canvas, function (ctx, w, h, t, dt) {
    var c = MP.colors();
    if (st.running) {
      st.t += (dt || 0.016) * 22;
      if (st.t >= 100) { st.t = 100; st.running = false; }
      renderReadout();
    }
    ctx.save();
    ctx.globalAlpha = 0.2;
    MP.grid(ctx, w, h, Math.max(28, Math.min(w, h) * 0.065), c.line);
    ctx.restore();

    var left = w * 0.1, right = w * 0.95, top = h * 0.14, bottom = h * 0.84;
    var pw = right - left, ph = bottom - top;

    ctx.save();
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.stroke();
    ctx.restore();
    for (var g = 0; g <= 5; g++) {
      var yy = bottom - (g / 5) * ph;
      MP.label(ctx, (g / 5).toFixed(1), left - 10, yy, c.faint, 8, "right");
      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(left, yy);
      ctx.lineTo(right, yy);
      ctx.stroke();
      ctx.restore();
    }
    MP.label(ctx, "success", left - 10, top - 12, c.faint, 8, "right");
    MP.label(ctx, "trials →", right, bottom + 18, c.faint, 9, "right");
    MP.label(ctx, "1.0", left - 10, top, c.faint, 8, "right");
    MP.label(ctx, "0.0", left - 10, bottom, c.faint, 8, "right");

    var changeX = left + (st.changeAt / 100) * pw;
    ctx.save();
    ctx.strokeStyle = c.accent;
    ctx.setLineDash([4, 5]);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(changeX, top);
    ctx.lineTo(changeX, bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    MP.label(ctx, "the rules change", changeX, top - 12, c.accent, 9, "center");

    function drawCurve(fn, color, width, dashed) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dashed ? [5, 5] : []);
      ctx.beginPath();
      var n = 120;
      for (var i = 0; i <= n; i++) {
        var tt = (i / n) * Math.min(st.t, 100);
        var v = fn(tt);
        var x = left + (tt / 100) * pw;
        var y = bottom - v * ph;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
    drawCurve(mor, "#e5c15a", 1.6, true);
    drawCurve(vir, "#f07b9a", 1.6, true);
    drawCurve(eth, c.accent, 2.6, false);

    var markerX = left + (st.t / 100) * pw;
    ctx.save();
    ctx.strokeStyle = c.ink;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(markerX, top);
    ctx.lineTo(markerX, bottom);
    ctx.stroke();
    ctx.restore();

    var labels = [
      { name: "ethical", color: c.accent, v: eth(st.t) },
      { name: "moral", color: "#e5c15a", v: mor(st.t) },
      { name: "virtuous", color: "#f07b9a", v: vir(st.t) }
    ];
    labels.forEach(function (l, i) {
      var lx = left + 10 + i * 150;
      MP.dot(ctx, lx, top + 12, 4, l.color);
      MP.label(ctx, l.name, lx + 10, top + 12, c.muted, 9);
    });

    MP.label(ctx, "ethical: learns the rules", w * 0.5, h * 0.94, c.muted, 9, "center");
  }, { maxDpr: 2 });
})();
