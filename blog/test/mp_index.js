(function () {
  "use strict";
  var canvas = document.getElementById("indexCanvas");
  if (!canvas || !window.MP) return;

  var labels = ["1943 · calculus", "1943 · statistics", "1945 · heterarchy", "1947 · universals", "1948 · organization", "1951 · mind", "1951 · den", "1955 · mysterium", "1956 · ethics", "1959 · frog", "1961 · number", "1974 · recollections"];
  var nodes = labels.map(function (label, i) {
    var a = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
    var r = 0.22 + (i % 3) * 0.085;
    return { a: a, r: r, label: label, phase: i * 1.7, size: 3.4 + (i % 4) * 0.7 };
  });
  var mouse = { x: 0.5, y: 0.5, active: false };

  canvas.addEventListener("pointermove", function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) / rect.width;
    mouse.y = (e.clientY - rect.top) / rect.height;
    mouse.active = true;
  });
  canvas.addEventListener("pointerleave", function () { mouse.active = false; });

  MP.canvas(canvas, function (ctx, w, h, t) {
    var c = MP.colors();
    var cx = w * 0.62;
    var cy = h * 0.48;
    var scale = Math.min(w, h);
    var rot = t * 0.035;

    ctx.save();
    ctx.globalAlpha = 0.55;
    for (var ring = 1; ring <= 3; ring++) {
      ctx.beginPath();
      ctx.arc(cx, cy, scale * (0.14 + ring * 0.1), 0, Math.PI * 2);
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    var pts = nodes.map(function (n) {
      var a = n.a + rot;
      var rr = scale * n.r;
      var wob = Math.sin(t * 0.7 + n.phase) * scale * 0.008;
      var x = cx + Math.cos(a) * (rr + wob);
      var y = cy + Math.sin(a) * (rr + wob) * 0.72;
      if (mouse.active) {
        x += (mouse.x - 0.5) * scale * 0.018 * (0.4 + n.r);
        y += (mouse.y - 0.5) * scale * 0.014 * (0.4 + n.r);
      }
      return { x: x, y: y, n: n };
    });

    ctx.save();
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      var q = pts[(i + 1) % pts.length];
      var r = pts[(i + 5) % pts.length];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = i % 3 === 0 ? c.accent : c.line;
      ctx.globalAlpha = i % 3 === 0 ? 0.28 : 0.15;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(r.x, r.y);
      ctx.strokeStyle = c.line;
      ctx.globalAlpha = 0.08;
      ctx.stroke();
    }
    ctx.restore();

    for (var k = 0; k < pts.length; k++) {
      var a2 = pts[k];
      var b2 = pts[(k + 1) % pts.length];
      var prog = (t * 0.18 + k * 0.11) % 1;
      var px = MP.lerp(a2.x, b2.x, prog);
      var py = MP.lerp(a2.y, b2.y, prog);
      MP.glowDot(ctx, px, py, 2, c.accent2, c.accent);
    }

    pts.forEach(function (p, i) {
      var pulse = 0.55 + 0.45 * Math.sin(t * 1.4 + p.n.phase);
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = c.accent;
      MP.dot(ctx, p.x, p.y, p.n.size * (0.75 + 0.35 * pulse), c.accent);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.n.size * 3.2, 0, Math.PI * 2);
      ctx.strokeStyle = c.accent;
      ctx.globalAlpha = 0.08 + 0.06 * pulse;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = c.ink;
    ctx.font = '600 ' + Math.round(scale * 0.055) + 'px "Iowan Old Style", Palatino, Georgia, serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MP", cx, cy + scale * 0.004);
    ctx.globalAlpha = 0.5;
    ctx.font = Math.round(scale * 0.009) + 'px "SFMono-Regular", Menlo, monospace';
    ctx.fillStyle = c.muted;
    ctx.fillText("A LOGICAL CALCULUS", cx, cy + scale * 0.055);
    ctx.restore();

    if (mouse.active) {
      var best = null;
      var bestD = 1e9;
      pts.forEach(function (p) {
        var dx = p.x - mouse.x * w;
        var dy = p.y - mouse.y * h;
        var d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = p; }
      });
      if (best && bestD < Math.pow(scale * 0.09, 2)) {
        var tx = best.x + 14;
        var ty = best.y - 18;
        ctx.save();
        ctx.font = '10px "SFMono-Regular", Menlo, monospace';
        var tw = ctx.measureText(best.n.label).width;
        ctx.fillStyle = c.panel;
        ctx.strokeStyle = c.accent;
        ctx.globalAlpha = 0.95;
        MP.rr(ctx, tx - 5, ty - 12, tw + 12, 22, 6);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = c.ink;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(best.n.label, tx + 1, ty);
        ctx.restore();
      }
    }
  }, { maxDpr: 1.6, forceMotion: false });
})();
