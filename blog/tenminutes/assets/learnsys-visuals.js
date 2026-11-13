(function () {
  "use strict";

  var V = {};

  V.clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  V.lerp = function (a, b, t) { return a + (b - a) * t; };
  V.ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  V.rad = function (deg) { return deg * Math.PI / 180; };
  V.deg = function (rad) { return rad * 180 / Math.PI; };

  V.dot = function (a, b) { return a[0] * b[0] + a[1] * b[1]; };
  V.norm = function (a) { return Math.hypot(a[0], a[1]); };
  V.unit = function (a) { var n = V.norm(a) || 1; return [a[0] / n, a[1] / n]; };
  V.angle = function (a, b) {
    var n = V.norm(a) * V.norm(b);
    if (!n) return 0;
    return Math.acos(V.clamp(V.dot(a, b) / n, -1, 1));
  };

  V.softmax = function (values, temp) {
    var t = temp || 1;
    var max = Math.max.apply(null, values);
    var ex = values.map(function (v) { return Math.exp((v - max) / t); });
    var sum = ex.reduce(function (a, b) { return a + b; }, 0) || 1;
    return ex.map(function (v) { return v / sum; });
  };

  V.fmt = function (v, digits) {
    var d = typeof digits === "number" ? digits : 2;
    var s = Number(v).toFixed(d);
    return s === "-0." + new Array(d + 1).join("0") ? (0).toFixed(d) : s;
  };

  V.rgb = function (hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
  };

  V.mix = function (a, b, t) {
    var A = V.rgb(a), B = V.rgb(b), u = V.clamp(t, 0, 1);
    return "rgb(" + Math.round(A[0] + (B[0] - A[0]) * u) + "," + Math.round(A[1] + (B[1] - A[1]) * u) + "," + Math.round(A[2] + (B[2] - A[2]) * u) + ")";
  };

  V.alpha = function (hex, a) {
    var c = V.rgb(hex);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  };

  V.arrow = function (ctx, x1, y1, x2, y2, color, width, head) {
    var dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    if (len < 0.01) return;
    var w = width || 1.6;
    var h = Math.max(4, head || w * 3.2);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - dx / len * h * 0.8, y2 - dy / len * h * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - dx / len * h + dy / len * h * 0.48, y2 - dy / len * h - dx / len * h * 0.48);
    ctx.lineTo(x2 - dx / len * h - dy / len * h * 0.48, y2 - dy / len * h + dx / len * h * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  V.label = function (ctx, text, x, y, opt) {
    var o = opt || {};
    var size = o.size || 11;
    var font = o.font || '600 ' + size + 'px "Open Sans", sans-serif';
    var align = o.align || "left";
    var color = o.color || "#000";
    var alpha = typeof o.alpha === "number" ? o.alpha : 1;
    var pad = typeof o.pad === "number" ? o.pad : 3;
    var baseline = o.baseline || "middle";
    ctx.save();
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    var tw = ctx.measureText(text).width;
    var bx = align === "center" ? x - tw / 2 - pad : align === "right" ? x - tw - pad : x - pad;
    var by = baseline === "middle" ? y - size * 0.78 : baseline === "bottom" ? y - size * 1.1 : y - size * 0.25;
    var bh = size * 1.45;
    if (o.bg !== false) {
      ctx.globalAlpha = alpha * (typeof o.bgAlpha === "number" ? o.bgAlpha : 0.88);
      ctx.fillStyle = o.bg || "#fff";
      ctx.fillRect(bx, by, tw + pad * 2, bh);
    }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillText(text, align === "center" ? x : align === "right" ? x - pad : x + pad, y);
    ctx.restore();
  };

  V.heading = function (ctx, text, x, y, color, size, alpha) {
    V.label(ctx, text, x, y, {
      font: '700 ' + (size || 13) + 'px "Barlow", sans-serif',
      color: color,
      alpha: typeof alpha === "number" ? alpha : 1,
      pad: 2,
      bgAlpha: 0.82
    });
  };

  V.grid = function (ctx, w, h, C, step, alpha) {
    var s = step || 28;
    ctx.save();
    ctx.fillStyle = C.line;
    ctx.globalAlpha = typeof alpha === "number" ? alpha : 0.2;
    for (var x = s; x < w; x += s) {
      for (var y = s; y < h; y += s) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.restore();
  };

  V.axes = function (ctx, w, h, C, pad) {
    var p = pad || 26;
    ctx.save();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(p, h - p);
    ctx.lineTo(w - p, h - p);
    ctx.moveTo(p, h - p);
    ctx.lineTo(p, p);
    ctx.stroke();
    ctx.restore();
  };

  V.arc = function (ctx, cx, cy, r, a0, a1, color, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1);
    ctx.stroke();
    ctx.restore();
  };

  V.project = function (p, yaw, pitch, scale, cx, cy) {
    var x = p[0], y = p[1], z = p[2];
    var cyaw = Math.cos(yaw), syaw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    var x1 = x * cyaw - y * syaw;
    var y1 = x * syaw + y * cyaw;
    var y2 = y1 * cp - z * sp;
    var z2 = y1 * sp + z * cp;
    var s = scale / (1 + z2 * 0.20);
    return { x: cx + x1 * s, y: cy - y2 * s, z: z2 };
  };

  V.matrix = function (ctx, values, rows, cols, x, y, w, h, C, opt) {
    var o = opt || {};
    var cell = Math.min(w / cols, h / rows);
    var ox = x + (w - cell * cols) / 2;
    var oy = y + (h - cell * rows) / 2;
    var max = typeof o.max === "number" ? o.max : 0;
    var min = typeof o.min === "number" ? o.min : 0;
    if (!max && !min) {
      values.forEach(function (v) { max = Math.max(max, v); min = Math.min(min, v); });
      var ext = Math.max(Math.abs(max), Math.abs(min), 0.0001);
      max = ext; min = -ext;
    }
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var v = values[r * cols + c] || 0;
        var t = v >= 0 ? v / (max || 1) : v / (Math.abs(min) || 1);
        var col = v >= 0 ? V.mix(C.paper, C.green, Math.min(1, Math.abs(t))) : V.mix(C.paper, C.blue, Math.min(1, Math.abs(t)));
        ctx.fillStyle = col;
        ctx.fillRect(ox + c * cell, oy + r * cell, Math.ceil(cell), Math.ceil(cell));
        if (cell > 12) {
          ctx.strokeStyle = V.alpha(C.paper, 0.38);
          ctx.lineWidth = 0.5;
          ctx.strokeRect(ox + c * cell, oy + r * cell, Math.ceil(cell), Math.ceil(cell));
        }
      }
    }
    ctx.strokeStyle = V.alpha(C.lineStrong || C.line, 0.8);
    ctx.lineWidth = 1;
    ctx.strokeRect(ox - 0.5, oy - 0.5, cell * cols + 1, cell * rows + 1);
    return { x: ox, y: oy, cell: cell };
  };

  V.tokenChip = function (ctx, text, x, y, color, C, opt) {
    var o = opt || {};
    var size = o.size || 11;
    ctx.save();
    ctx.font = '600 ' + size + 'px "Open Sans", sans-serif';
    var tw = ctx.measureText(text).width;
    var padX = 7, h = size * 1.9;
    var w = tw + padX * 2;
    var bx = o.align === "right" ? x - w : o.align === "center" ? x - w / 2 : x;
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.fillStyle = o.fill || V.alpha(color, 0.14);
    ctx.fillRect(bx, y - h / 2, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = o.width || 1;
    ctx.strokeRect(bx + 0.5, y - h / 2 + 0.5, w - 1, h - 1);
    ctx.fillStyle = o.color || C.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + padX, y);
    ctx.restore();
    return w;
  };

  window.LearnSysVisuals = V;
})();
