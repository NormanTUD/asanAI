(function () {
  "use strict";
  if (!window.MP) return;

  var hero = document.getElementById("heroUniversals");
  if (hero) {
    MP.canvas(hero, function (ctx, w, h, t) {
      var c = MP.colors();
      var cx = w * 0.55;
      var cy = h * 0.48;
      var s = Math.min(w, h) * 0.18;

      ctx.save();
      ctx.globalAlpha = 0.14;
      MP.grid(ctx, w, h, Math.max(34, Math.min(w, h) * 0.08), c.line);
      ctx.restore();

      for (var i = 0; i < 14; i++) {
        var ph = t * 0.35 + i * 0.45;
        var scale = 0.55 + 0.5 * Math.sin(ph * 0.7) + 0.08 * i / 14;
        var rot = ph * 0.5;
        var ox = Math.cos(ph * 0.6 + i) * Math.min(w, h) * 0.045;
        var oy = Math.sin(ph * 0.5 + i * 1.3) * Math.min(w, h) * 0.035;
        ctx.save();
        ctx.translate(cx + ox, cy + oy);
        ctx.rotate(rot);
        ctx.scale(scale, scale);
        ctx.strokeStyle = c.accent;
        ctx.globalAlpha = 0.06 + 0.06 * (i / 14);
        ctx.lineWidth = 1;
        ctx.strokeRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.22);
      var pulse = 0.5 + 0.5 * Math.sin(t * 1.1);
      ctx.strokeStyle = c.accent;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1.6;
      ctx.shadowBlur = 24;
      ctx.shadowColor = c.accent;
      ctx.strokeRect(-s / 2, -s / 2, s, s);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.2 + 0.2 * pulse;
      ctx.strokeRect(-s * 0.72, -s * 0.72, s * 1.44, s * 1.44);
      ctx.restore();

      for (var k = 0; k < 3; k++) {
        var a = t * 0.4 + k * Math.PI * 2 / 3;
        MP.glowDot(ctx, cx + Math.cos(a) * s * 1.15, cy + Math.sin(a) * s * 1.15, 2.4, c.accent2, c.accent);
      }
      MP.label(ctx, "the same figure, under a group", w * 0.5, h * 0.92, c.muted, 10, "center");
    }, { maxDpr: 1.6 });
  }

  var avgCanvas = document.getElementById("averageLab");
  var grp = "translation";
  var nTrans = 7;
  var shapeName = "F";

  function shapePath(ctx, name) {
    ctx.beginPath();
    if (name === "square") {
      ctx.rect(-26, -26, 52, 52);
    } else if (name === "triangle") {
      ctx.moveTo(0, -32);
      ctx.lineTo(30, 26);
      ctx.lineTo(-30, 26);
      ctx.closePath();
    } else {
      ctx.moveTo(-22, -30);
      ctx.lineTo(22, -30);
      ctx.lineTo(22, -12);
      ctx.lineTo(-6, -12);
      ctx.lineTo(-6, 2);
      ctx.lineTo(14, 2);
      ctx.lineTo(14, 18);
      ctx.lineTo(-6, 18);
      ctx.lineTo(-6, 30);
      ctx.lineTo(-22, 30);
      ctx.closePath();
    }
  }
  function transformFor(i, n, t) {
    var f = n === 1 ? 0 : i / (n - 1);
    var mid = (n - 1) / 2;
    var off = i - mid;
    if (grp === "translation") return { dx: off * 34, dy: Math.sin(i * 0.9) * 8, s: 1, r: 0 };
    if (grp === "scale") return { dx: 0, dy: 0, s: 0.36 + f * 1.15, r: 0 };
    return { dx: 0, dy: 0, s: 1, r: (i / n) * Math.PI * 2 + t * 0.08 };
  }

  if (avgCanvas) {
    var off = document.createElement("canvas");
    off.width = 360; off.height = 210;
    var octx = off.getContext("2d");
    var tint = document.createElement("canvas");
    tint.width = off.width; tint.height = off.height;
    var tctx = tint.getContext("2d");

    MP.on("grpTranslation", "click", function () { grp = "translation"; setActive(); });
    MP.on("grpScale", "click", function () { grp = "scale"; setActive(); });
    MP.on("grpRotation", "click", function () { grp = "rotation"; setActive(); });
    MP.on("shapeSquare", "click", function () { shapeName = "square"; setActive(); });
    MP.on("shapeF", "click", function () { shapeName = "F"; setActive(); });
    MP.on("shapeTriangle", "click", function () { shapeName = "triangle"; setActive(); });
    function setActive() {
      document.querySelectorAll("[data-group]").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-group") === grp); });
      document.querySelectorAll("[data-shape]").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-shape") === shapeName); });
    }
    setActive();
    MP.bindRange("nTrans", function (v) { nTrans = Math.round(v); var o = document.getElementById("nTransVal"); if (o) o.textContent = nTrans; });

    MP.canvas(avgCanvas, function (ctx, w, h, t) {
      var c = MP.colors();
      var accent = c.accent;
      var rgb = hexToRgb(accent);
      ctx.save();
      ctx.globalAlpha = 0.18;
      MP.grid(ctx, w, h, Math.max(26, Math.min(w, h) * 0.07), c.line);
      ctx.restore();

      var wantH = Math.round(off.width * h / w);
      if (off.height !== wantH) { off.height = wantH; tint.height = wantH; }
      octx.clearRect(0, 0, off.width, off.height);
      octx.save();
      octx.translate(off.width / 2, off.height / 2);
      var sc = Math.min(off.width, off.height) / 300;
      octx.scale(sc, sc);
      for (var i = 0; i < nTrans; i++) {
        var tr = transformFor(i, nTrans, t);
        octx.save();
        octx.translate(tr.dx, tr.dy);
        octx.rotate(tr.r);
        octx.scale(tr.s, tr.s);
        octx.globalAlpha = 1 / nTrans;
        octx.fillStyle = "#ffffff";
        shapePath(octx, shapeName);
        octx.fill();
        octx.restore();
      }
      octx.restore();

      var data = octx.getImageData(0, 0, off.width, off.height);
      var out = tctx.createImageData(off.width, off.height);
      for (var p = 0; p < data.data.length; p += 4) {
        var a = data.data[p + 3] / 255;
        out.data[p] = rgb.r;
        out.data[p + 1] = rgb.g;
        out.data[p + 2] = rgb.b;
        out.data[p + 3] = Math.round(a * 255);
      }
      tctx.putImageData(out, 0, 0);

      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(tint, 0, 0, w, h);
      ctx.restore();

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale((w / off.width) * sc, (h / off.height) * sc);
      for (var j = 0; j < nTrans; j++) {
        var tr2 = transformFor(j, nTrans, t);
        ctx.save();
        ctx.translate(tr2.dx, tr2.dy);
        ctx.rotate(tr2.r);
        ctx.scale(tr2.s, tr2.s);
        ctx.strokeStyle = c.ink;
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = 1.2 / tr2.s;
        shapePath(ctx, shapeName);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      MP.label(ctx, "average of " + nTrans + " transforms", w / 2, h - 22, c.muted, 10, "center");
      MP.label(ctx, grp.toUpperCase(), w / 2, 26, c.accent, 11, "center");
    }, { maxDpr: 2 });
  }

  function hexToRgb(hex) {
    var h = hex.replace("#", "").trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var num = parseInt(h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  var reflexCanvas = document.getElementById("reflexLab");
  if (reflexCanvas) {
    var spots = [
      { x: -0.42, y: -0.18, b: 0.9 },
      { x: 0.35, y: -0.32, b: 0.55 },
      { x: 0.08, y: 0.4, b: 0.35 }
    ];
    var gaze = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var drag = -1;
    var autoReflex = true;
    var errorEl = document.getElementById("gazeErr");
    var cogEl = document.getElementById("cogVal");
    var gazeEl = document.getElementById("gazeVal");

    function cog() {
      var sw = 0, sx = 0, sy = 0;
      spots.forEach(function (s) { sw += s.b; sx += s.x * s.b; sy += s.y * s.b; });
      return sw > 0 ? { x: sx / sw, y: sy / sw } : { x: 0, y: 0 };
    }
    function updateReadout() {
      var cg = cog();
      var ex = cg.x - gaze.x, ey = cg.y - gaze.y;
      if (errorEl) errorEl.textContent = Math.hypot(ex, ey).toFixed(3);
      if (cogEl) cogEl.textContent = cg.x.toFixed(2) + ", " + cg.y.toFixed(2);
      if (gazeEl) gazeEl.textContent = gaze.x.toFixed(2) + ", " + gaze.y.toFixed(2);
    }
    function pointerToField(e, rect) {
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;
      var fx = (x - 0.3) / 0.28;
      var fy = (y - 0.5) / 0.42;
      return { x: fx, y: fy, px: x, py: y };
    }
    reflexCanvas.addEventListener("pointerdown", function (e) {
      var rect = reflexCanvas.getBoundingClientRect();
      var p = pointerToField(e, rect);
      var best = -1, bd = 0.12;
      spots.forEach(function (s, i) {
        var d = Math.hypot((s.x - gaze.x) - p.x, (s.y - gaze.y) - p.y);
        if (d < bd) { bd = d; best = i; }
      });
      drag = best;
      if (best >= 0) reflexCanvas.setPointerCapture(e.pointerId);
    });
    reflexCanvas.addEventListener("pointermove", function (e) {
      if (drag < 0) return;
      var rect = reflexCanvas.getBoundingClientRect();
      var p = pointerToField(e, rect);
      spots[drag].x = MP.clamp(p.x + gaze.x, -1, 1);
      spots[drag].y = MP.clamp(p.y + gaze.y, -1, 1);
      updateReadout();
    });
    reflexCanvas.addEventListener("pointerup", function () { drag = -1; });
    MP.on("centerGaze", "click", function () {
      var cg = cog();
      autoReflex = true;
      target.x = cg.x; target.y = cg.y;
      gaze.x = cg.x; gaze.y = cg.y;
      var b = document.getElementById("centerGaze");
      if (b) b.textContent = "Reflex on";
      updateReadout();
    });
    MP.on("resetGaze", "click", function () {
      autoReflex = false;
      gaze.x = 0; gaze.y = 0; target.x = 0; target.y = 0;
      var b = document.getElementById("centerGaze");
      if (b) b.textContent = "Enable reflex";
      updateReadout();
    });
    MP.bindRange("bright0", function (v) { spots[0].b = v; updateReadout(); });
    MP.bindRange("bright1", function (v) { spots[1].b = v; updateReadout(); });
    MP.bindRange("bright2", function (v) { spots[2].b = v; updateReadout(); });
    updateReadout();

    MP.canvas(reflexCanvas, function (ctx, w, h, t, dt) {
      var c = MP.colors();
      var cg = cog();
      if (autoReflex && (target.x !== cg.x || target.y !== cg.y)) { target.x = cg.x; target.y = cg.y; }
      var k = MP.reduced ? 1 : 1 - Math.exp(-(dt || 0.016) * 3.2);
      gaze.x += (target.x - gaze.x) * k;
      gaze.y += (target.y - gaze.y) * k;
      updateReadout();

      var fx = w * 0.05, fy = h * 0.1, fw = w * 0.52, fh = h * 0.8;
      var cx = w * 0.75, cy = h * 0.5;
      var cw = w * 0.19, ch = h * 0.32;

      ctx.save();
      ctx.globalAlpha = 0.2;
      MP.grid(ctx, w, h, Math.max(26, Math.min(w, h) * 0.06), c.line);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1;
      MP.rr(ctx, fx, fy, fw, fh, 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fx + fw / 2, fy);
      ctx.lineTo(fx + fw / 2, fy + fh);
      ctx.moveTo(fx, fy + fh / 2);
      ctx.lineTo(fx + fw, fy + fh / 2);
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, "visual field", fx + 10, fy + 14, c.faint, 9);
      MP.label(ctx, "gaze", fx + fw / 2 + 8, fy + fh / 2 + 14, c.faint, 8);

      var mapX = function (x) { return fx + fw / 2 + (x - gaze.x) * fw * 0.42; };
      var mapY = function (y) { return fy + fh / 2 + (y - gaze.y) * fh * 0.42; };

      spots.forEach(function (s, i) {
        var px = mapX(s.x), py = mapY(s.y);
        var r = 10 + s.b * 14;
        ctx.save();
        ctx.shadowBlur = 26 * s.b;
        ctx.shadowColor = c.accent;
        ctx.globalAlpha = 0.75;
        MP.dot(ctx, px, py, r, c.accent);
        ctx.restore();
        ctx.strokeStyle = c.accent2;
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, r + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        MP.label(ctx, "S" + (i + 1), px, py, c.ink, 9, "center");
      });

      var cgx = mapX(cg.x), cgy = mapY(cg.y);
      ctx.save();
      ctx.strokeStyle = c.accent2;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cgx - 12, cgy);
      ctx.lineTo(cgx + 12, cgy);
      ctx.moveTo(cgx, cgy - 12);
      ctx.lineTo(cgx, cgy + 12);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      MP.label(ctx, "centre of brightness", cgx, cgy - 20, c.accent, 9, "center");

      ctx.save();
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1;
      MP.rr(ctx, cx - cw, cy - ch, cw * 2, ch * 2, 12);
      ctx.stroke();
      ctx.restore();
      MP.label(ctx, "superior colliculus", cx, cy - ch - 16, c.faint, 9, "center");

      var u = cg.x - gaze.x;
      var v = cg.y - gaze.y;
      for (var gy = 0; gy < 9; gy++) {
        for (var gx = 0; gx < 9; gx++) {
          var nx = (gx / 8) * 2 - 1;
          var ny = (gy / 8) * 2 - 1;
          var d = Math.hypot(nx - MP.clamp(u, -1, 1), ny - MP.clamp(v, -1, 1));
          var inten = Math.exp(-d * d * 9);
          var px2 = cx - cw + (gx / 8) * cw * 2;
          var py2 = cy - ch + (gy / 8) * ch * 2;
          ctx.save();
          ctx.globalAlpha = 0.08 + inten * 0.9;
          MP.dot(ctx, px2, py2, 2 + inten * 7, c.accent);
          ctx.restore();
        }
      }
      MP.label(ctx, "retinal error: " + Math.hypot(u, v).toFixed(2), cx, cy + ch + 22, c.muted, 9, "center");

      var ex = w * 0.88, ey = h * 0.5;
      [0, 1].forEach(function (i) {
        var x = ex + (i ? 26 : -26);
        ctx.save();
        ctx.strokeStyle = c.line;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(x, ey, 17, 0, Math.PI * 2);
        ctx.stroke();
        var pdx = (cg.x - gaze.x) * 9;
        var pdy = (cg.y - gaze.y) * 9;
        var pr = Math.hypot(pdx, pdy);
        if (pr > 9) { pdx *= 9 / pr; pdy *= 9 / pr; }
        MP.dot(ctx, x + pdx, ey + pdy, 6, c.accent);
        ctx.restore();
      });
      MP.label(ctx, "eyes", ex, ey + 36, c.faint, 8, "center");
    }, { maxDpr: 2 });
  }
})();
