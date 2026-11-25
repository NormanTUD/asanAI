/* TOKEN / EGO — small, dependency-free helpers. */
(function (root) {
  "use strict";
  var TEGO = (root.TEGO = root.TEGO || {});

  var U = {};

  U.clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.invLerp = function (a, b, x) { return b === a ? 0 : (x - a) / (b - a); };
  U.smooth = function (t) { t = U.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  U.smoother = function (t) { t = U.clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  U.easeOut = function (t) { t = U.clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
  U.easeIn = function (t) { t = U.clamp(t, 0, 1); return t * t * t; };
  U.easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  U.expo = function (t) { t = U.clamp(t, 0, 1); return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  U.damp = function (a, b, lambda, dt) { return U.lerp(a, b, 1 - Math.exp(-lambda * dt)); };
  U.signed = function (x) { return x < 0 ? -1 : 1; };
  U.mod = function (x, m) { return ((x % m) + m) % m; };

  U.mulberry32 = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  U.gauss = function (rng) {
    var u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  U.hash = function (n) {
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };

  U.dot = function (a, b) {
    var s = 0;
    for (var i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
  };

  U.norm = function (a) {
    var s = 0;
    for (var i = 0; i < a.length; i++) s += a[i] * a[i];
    return Math.sqrt(s);
  };

  U.mean = function (a) {
    var s = 0;
    for (var i = 0; i < a.length; i++) s += a[i];
    return s / a.length;
  };

  U.variance = function (a, mean) {
    var s = 0, m = mean === undefined ? U.mean(a) : mean;
    for (var i = 0; i < a.length; i++) { var d = a[i] - m; s += d * d; }
    return s / a.length;
  };

  U.softmax = function (logits, temperature) {
    var t = temperature === undefined ? 1 : Math.max(1e-4, temperature);
    var n = logits.length, out = new Float64Array(n), m = -Infinity, i;
    for (i = 0; i < n; i++) if (logits[i] > m) m = logits[i];
    var s = 0;
    for (i = 0; i < n; i++) { out[i] = Math.exp((logits[i] - m) / t); s += out[i]; }
    for (i = 0; i < n; i++) out[i] /= s;
    return out;
  };

  U.erf = function (x) {
    // Abramowitz & Stegun 7.1.26 — plenty for the GELU display; the model
    // uses the tanh approximation below, as GPT-2 does.
    var sign = x < 0 ? -1 : 1, ax = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * ax);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
    return sign * y;
  };

  U.gelu = function (x) {
    return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
  };

  U.geluExact = function (x) {
    return 0.5 * x * (1 + U.erf(x / Math.SQRT2));
  };

  U.fmt = function (x, digits) {
    if (!isFinite(x)) return x > 0 ? "∞" : "-∞";
    var d = digits === undefined ? 3 : digits;
    if (x === 0) return "0";
    var ax = Math.abs(x);
    if (ax >= 1e5 || ax < 1e-4) return x.toExponential(2);
    return x.toFixed(d).replace(/\.?0+$/, "");
  };

  U.pct = function (x, digits) { return (100 * x).toFixed(digits === undefined ? 1 : digits) + "%"; };

  U.hsl = function (h, s, l, a) {
    return "hsla(" + h + "," + s + "%," + l + "%," + (a === undefined ? 1 : a) + ")";
  };

  U.colorHex = function (c) { return "#" + c.toString(16).padStart(6, "0"); };

  U.mixColor = function (a, b, t) {
    var ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    var br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    return (Math.round(U.lerp(ar, br, t)) << 16) | (Math.round(U.lerp(ag, bg, t)) << 8) | Math.round(U.lerp(ab, bb, t));
  };

  U.colorScaled = function (c, k) {
    var r = U.clamp(Math.round(((c >> 16) & 255) * k), 0, 255);
    var g = U.clamp(Math.round(((c >> 8) & 255) * k), 0, 255);
    var b = U.clamp(Math.round((c & 255) * k), 0, 255);
    return (r << 16) | (g << 8) | b;
  };

  U.heatColor = function (t) {
    // black -> deep blue -> cyan -> magenta -> white/gold
    t = U.clamp(t, 0, 1);
    var stops = [
      [0.0, [2, 4, 12]],
      [0.22, [10, 26, 74]],
      [0.45, [27, 160, 210]],
      [0.68, [180, 70, 220]],
      [0.86, [255, 120, 180]],
      [1.0, [255, 245, 210]],
    ];
    for (var i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        var a = stops[i - 1], b = stops[i];
        var f = (t - a[0]) / (b[0] - a[0]);
        return [Math.round(U.lerp(a[1][0], b[1][0], f)), Math.round(U.lerp(a[1][1], b[1][1], f)), Math.round(U.lerp(a[1][2], b[1][2], f))];
      }
    }
    return stops[stops.length - 1][1];
  };

  U.heatColorCss = function (t) {
    var c = U.heatColor(t);
    return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
  };

  U.argSortDesc = function (arr) {
    var idx = new Array(arr.length);
    for (var i = 0; i < arr.length; i++) idx[i] = i;
    idx.sort(function (a, b) { return arr[b] - arr[a]; });
    return idx;
  };

  U.topK = function (arr, k) {
    var idx = U.argSortDesc(arr);
    return idx.slice(0, k).map(function (i) { return { index: i, value: arr[i] }; });
  };

  U.sum = function (arr) { var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i]; return s; };

  U.standardize = function (arr) {
    var m = U.mean(arr), v = U.variance(arr, m) || 1e-9, s = Math.sqrt(v);
    return Array.prototype.map.call(arr, function (x) { return (x - m) / s; });
  };

  U.normalize = function (arr) {
    var n = U.norm(arr) || 1;
    return Array.prototype.map.call(arr, function (x) { return x / n; });
  };

  U.orthogonal = function (rng, n) {
    // Gram-Schmidt on Gaussian vectors. Rows are orthonormal.
    var rows = [];
    for (var i = 0; i < n; i++) {
      var v = new Float64Array(n);
      for (var j = 0; j < n; j++) v[j] = U.gauss(rng);
      for (var k = 0; k < i; k++) {
        var d = U.dot(v, rows[k]);
        for (var j2 = 0; j2 < n; j2++) v[j2] -= d * rows[k][j2];
      }
      var nn = U.norm(v) || 1;
      for (var j3 = 0; j3 < n; j3++) v[j3] /= nn;
      rows.push(v);
    }
    return rows;
  };

  U.pca3 = function (vec) {
    // A deterministic 3D projection of an arbitrary vector, used for the
    // vector glyphs. The first three coordinates are the most interpretable;
    // the rest are folded in with fixed weights so the glyph still moves when
    // high dimensions change.
    var x = 0, y = 0, z = 0;
    for (var i = 0; i < vec.length; i++) {
      var a = (i + 1) * 0.61803398875;
      var w = 1 / (1 + i * 0.08);
      x += vec[i] * Math.cos(a) * w;
      y += vec[i] * Math.sin(a * 1.13) * w;
      z += vec[i] * Math.cos(a * 0.71 + 1.2) * w;
    }
    var n = Math.sqrt(x * x + y * y + z * z) || 1;
    return [x / n, y / n, z / n];
  };

  U.now = function () { return (root.performance && performance.now ? performance.now() : Date.now()) / 1000; };

  U.emitter = function () {
    var map = {};
    return {
      on: function (k, fn) { (map[k] = map[k] || []).push(fn); return this; },
      off: function (k, fn) { if (map[k]) map[k] = map[k].filter(function (f) { return f !== fn; }); return this; },
      emit: function (k) {
        var args = Array.prototype.slice.call(arguments, 1);
        (map[k] || []).slice().forEach(function (fn) { try { fn.apply(null, args); } catch (e) { console.error(e); } });
        return this;
      },
    };
  };

  U.canvas = function (w, h) {
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    return c;
  };

  U.roundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  U.makeLabel = function (text, opts) {
    opts = opts || {};
    var color = opts.color || "#e9f3ff";
    var size = opts.size || 52;
    var font = opts.font || "600 " + size + "px 'Segoe UI', 'Helvetica Neue', system-ui, sans-serif";
    var pad = opts.pad === undefined ? 18 : opts.pad;
    var c = U.canvas(8, 8);
    var ctx = c.getContext("2d");
    ctx.font = font;
    var w = Math.ceil(ctx.measureText(text).width) + pad * 2;
    var h = Math.ceil(size * 1.55) + pad * 2;
    c.width = w; c.height = h;
    ctx = c.getContext("2d");
    ctx.font = font;
    if (opts.bg) {
      ctx.fillStyle = "rgba(3,6,16,0.72)";
      U.roundRect(ctx, 1, 1, w - 2, h - 2, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(143,180,230,0.22)";
      ctx.lineWidth = 1;
      U.roundRect(ctx, 1.5, 1.5, w - 3, h - 3, 10);
      ctx.stroke();
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (opts.glow !== false) {
      ctx.shadowColor = opts.glowColor || color;
      ctx.shadowBlur = opts.blur === undefined ? 22 : opts.blur;
    }
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2 + 1);
    if (opts.underline) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pad, h - pad * 0.55);
      ctx.lineTo(w - pad, h - pad * 0.55);
      ctx.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return { texture: tex, width: w, height: h, canvas: c };
  };

  U.makeRadialSprite = function (color, size) {
    var c = U.canvas(size || 256, size || 256);
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(c.width / 2, c.height / 2, 0, c.width / 2, c.height / 2, c.width / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.08, color);
    g.addColorStop(0.35, color.replace("1)", "0.35)"));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  };

  U.makeNoiseTexture = function (size, rng) {
    var c = U.canvas(size || 512, size || 512);
    var ctx = c.getContext("2d");
    var img = ctx.createImageData(c.width, c.height);
    var r = rng || U.mulberry32(1234567);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = Math.floor(255 * r());
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  };

  U.disposeObject = function (obj, keepTextures) {
    if (!obj) return;
    obj.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function (m) {
          if (!keepTextures) for (var k in m) if (m[k] && m[k].isTexture) m[k].dispose();
          m.dispose();
        });
      }
    });
    if (obj.parent) obj.parent.remove(obj);
  };

  TEGO.U = U;
  if (typeof module === "object" && module.exports) module.exports = { U: U };
})(typeof globalThis !== "undefined" ? globalThis : this);
