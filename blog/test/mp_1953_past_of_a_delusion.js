(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroDelusion");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(32, Math.min(w, h) * 0.075), c.line);
      ctx.restore();

      var cx = w * 0.5, cy = h * 0.5;
      var R = Math.min(w, h) * 0.22;
      for (var i = 0; i < 4; i++) {
        var a = (i / 4) * Math.PI * 2 - Math.PI / 2;
        var x = cx + Math.cos(a) * R;
        var y = cy + Math.sin(a) * R * 0.7;
        ctx.save();
        ctx.strokeStyle = c.accent;
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        MP.label(ctx, ["symptom", "theory", "resistance", "proof"][i], x, y + 26, c.muted, 8, "center");
      }
      MP.label(ctx, "the loop that explains everything", w * 0.5, h * 0.9, c.muted, 10, "center");
      MP.label(ctx, "and therefore nothing", w * 0.5, h * 0.95, c.faint, 9, "center");
    }, { maxDpr: 1.6 });
  }

  var canvas = document.getElementById("loopLab");
  if (!canvas) return;

  var st = { gain: 0.78, open: false };
  var gainEl = document.getElementById("gainVal");
  var loopEl = document.getElementById("loopVal");
  var statusEl = document.getElementById("loopStatus");
  var btn = document.getElementById("externalTest");

  function update() {
    if (gainEl) gainEl.textContent = st.gain.toFixed(2);
    if (loopEl) loopEl.textContent = st.open ? "open to test" : st.gain > 0.6 ? "self-sealing" : "loosely coupled";
    if (statusEl) statusEl.textContent = st.open ? "an external observation can break the loop" : st.gain > 0.6 ? "the loop confirms itself" : "the loop is weak";
    if (btn) btn.textContent = st.open ? "Close the loop" : "Admit an external test";
    if (btn) btn.classList.toggle("is-active", st.open);
  }
  MP.bindRange("loopGain", function (v) { st.gain = v; update(); });
  MP.on("externalTest", "click", function () { st.open = !st.open; update(); });
  MP.on("resetLoop", "click", function () { st.gain = 0.78; st.open = false; var e = document.getElementById("loopGain"); if (e) { e.value = 0.78; MP.rangeFill(e); } update(); });
  update();

  MP.canvas(canvas, function (ctx, w, h, t) {
    var c = MP.colors();
    ctx.save();
    ctx.globalAlpha = 0.18;
    MP.grid(ctx, w, h, Math.max(26, Math.min(w, h) * 0.06), c.line);
    ctx.restore();

    var cx = w * 0.5, cy = h * 0.5;
    var R = Math.min(w, h) * 0.26;
    var nodes = ["symptom", "interpretation", "resistance", "confirmation"];
    var pts = [];
    for (var i = 0; i < 4; i++) {
      var a = (i / 4) * Math.PI * 2 - Math.PI / 2;
      pts.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * 0.72, a: a, label: nodes[i] });
    }

    var loopColor = st.open ? c.faint : st.gain > 0.6 ? "#ef6a6a" : c.accent;
    for (var k = 0; k < 4; k++) {
      var p = pts[k];
      var q = pts[(k + 1) % 4];
      ctx.save();
      ctx.strokeStyle = loopColor;
      ctx.globalAlpha = st.open ? 0.2 : 0.7;
      ctx.lineWidth = 1.8 + st.gain * 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.quadraticCurveTo(cx, cy, q.x, q.y);
      ctx.stroke();
      var ang = Math.atan2(q.y - cy, q.x - cx);
      MP.arrow(ctx, q.x - Math.cos(ang) * 26, q.y - Math.sin(ang) * 26, q.x - Math.cos(ang) * 16, q.y - Math.sin(ang) * 16, loopColor, 1.4, 6);
      ctx.restore();
    }

    pts.forEach(function (p, i) {
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = loopColor;
      MP.dot(ctx, p.x, p.y, 15, c.panel2);
      ctx.strokeStyle = loopColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, p.label, p.x, p.y + 28, c.muted, 8, "center");
    });

    var prog = (t * (0.25 + st.gain * 0.6)) % 4;
    if (!isFinite(prog)) prog = 0;
    var seg = ((Math.floor(prog) % 4) + 4) % 4;
    var f = prog - seg;
    var a1 = pts[seg], b1 = pts[(seg + 1) % 4];
    var px = MP.lerp(a1.x, b1.x, f);
    var py = MP.lerp(a1.y, b1.y, f);
    MP.glowDot(ctx, px, py, 4, loopColor, loopColor);

    if (st.open) {
      var target = pts[3];
      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(w * 0.88, h * 0.12);
      ctx.lineTo(target.x + 20, target.y - 20);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      MP.label(ctx, "external observation", w * 0.88, h * 0.08, c.accent, 8, "center");
    } else if (st.gain > 0.6) {
      ctx.save();
      ctx.strokeStyle = "#ef6a6a";
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, "no exit", cx, cy, "#ef6a6a", 9, "center");
    }

    MP.label(ctx, "symptom → interpretation → resistance → confirmation → symptom", w * 0.5, h * 0.95, c.muted, 8, "center");
  }, { maxDpr: 2 });
})();
