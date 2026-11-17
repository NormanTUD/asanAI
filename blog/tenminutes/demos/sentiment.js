(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var V = window.LearnSysVisuals;
  if (!V) return;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function hash(i, s) {
    var n = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function rgb(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
  }

  function rgba(hex, a) {
    var c = rgb(hex);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  function sentimentScene(root, api) {
    var DE = api.lang === "de";
    var C = api.colors();
    var mode = "direction";
    var alpha = 0.8;
    var nudge = false;
    var W = 1, H = 1, ctx = null;
    var sliderEl = null;

    if (!document.getElementById("ls-sentiment-style")) {
      var st = document.createElement("style");
      st.id = "ls-sentiment-style";
      st.textContent =
        ".ls-sent{display:grid;grid-template-rows:minmax(0,1fr) 46px 66px;height:100%;min-height:0;background:transparent}" +
        ".ls-sent-stage{position:relative;min-height:0;overflow:hidden;border:1px solid var(--tm-line,#dbe3e0);background:var(--tm-paper-2,#f7f9f8)}" +
        ".ls-sent-stage canvas{display:block;width:100%;height:100%}" +
        ".ls-sent-controls{display:flex;align-items:center;gap:8px;height:46px;min-width:0;padding:6px 2px;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin}" +
        ".ls-sent-controls::-webkit-scrollbar{height:4px}.ls-sent-controls::-webkit-scrollbar-thumb{background:var(--tm-line-strong,#b9c8c3)}" +
        ".ls-sent-label{font:600 11px/1 'Open Sans',sans-serif;color:var(--tm-muted,#627476);white-space:nowrap}" +
        ".ls-sent-range{width:150px;max-width:38vw;accent-color:var(--tm-green,#63a44b)}" +
        ".ls-sent-btn{border:1px solid var(--tm-line-strong,#b9c8c3);background:#fff;color:var(--tm-ink,#000);padding:5px 9px;font:600 11px/1 'Open Sans',sans-serif;cursor:pointer;border-radius:0;min-height:30px;white-space:nowrap}" +
        ".ls-sent-btn:hover{border-color:var(--tm-petrol,#004b6f);color:var(--tm-petrol,#004b6f)}" +
        ".ls-sent-btn.is-on{background:var(--tm-green,#63a44b);border-color:var(--tm-green,#63a44b);color:#fff}" +
        ".ls-sent-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--tm-line,#dbe3e0);background:#fff;color:var(--tm-ink,#000);padding:4px 8px;font:600 10.5px/1.2 'Open Sans',sans-serif;white-space:nowrap}" +
        ".ls-sent-chip i{display:inline-block;width:8px;height:8px;flex:0 0 auto}" +
        ".ls-sent-out{font:600 11px/1 'Open Sans',sans-serif;color:var(--tm-ink,#000);min-width:40px;text-align:right}" +
        ".ls-sent-readout{display:flex;align-items:flex-start;align-content:flex-start;flex-wrap:wrap;gap:2px 14px;height:66px;min-width:0;padding:3px 2px;overflow:hidden;font:400 11px/1.45 'Open Sans',sans-serif;color:var(--tm-muted,#627476)}" +
        ".ls-sent-readout span{max-width:100%}" +
        ".ls-sent-src{color:var(--tm-petrol,#004b6f);font-weight:600;white-space:nowrap}" +
        ".ls-sent-src a{color:inherit;text-decoration:none;border-bottom:1px dotted currentColor}" +
        ".ls-sent-src a:hover{color:var(--tm-blue,#1275ac)}" +
        "@media(max-width:640px){.ls-sent{grid-template-rows:minmax(0,1fr) 46px 76px}.ls-sent-readout{height:76px;font-size:10.5px}}";
      document.head.appendChild(st);
    }

    var el = document.createElement("div");
    el.className = "ls-sent";
    el.innerHTML =
      '<div class="ls-sent-stage"><canvas role="img"></canvas></div>' +
      '<div class="ls-sent-controls" role="group"></div>' +
      '<div class="ls-sent-readout" aria-live="polite"></div>';
    root.appendChild(el);

    var stage = el.querySelector(".ls-sent-stage");
    var canvas = el.querySelector("canvas");
    var controls = el.querySelector(".ls-sent-controls");
    var readout = el.querySelector(".ls-sent-readout");

    function drawText(c, s, x, y, o) {
      var opt = o || {};
      var size = opt.size || 11;
      var display = !!opt.display;
      c.save();
      c.font = (display ? "700 " : "400 ") + size + "px " + (display ? '"Barlow", "Open Sans", sans-serif' : '"Open Sans", "Segoe UI", sans-serif');
      c.textAlign = opt.align || "left";
      c.textBaseline = "middle";
      if (opt.bg) {
        var tw = c.measureText(s).width;
        var padX = opt.padX == null ? 5 : opt.padX;
        var bh = size * 1.55;
        var bx = opt.align === "center" ? x - tw / 2 - padX : opt.align === "right" ? x - tw - padX : x - padX;
        c.fillStyle = opt.bg;
        c.fillRect(bx, y - bh / 2, tw + padX * 2, bh);
      }
      c.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
      c.fillStyle = opt.color || C.muted;
      c.fillText(s, x, y);
      c.restore();
    }

    function pill(c, s, x, y, color, align) {
      var size = 10.5, padX = 8, bh = 20;
      c.save();
      c.font = "600 " + size + 'px "Open Sans", "Segoe UI", sans-serif';
      var tw = c.measureText(s).width;
      var bx = align === "right" ? x - tw - padX * 2 : align === "center" ? x - tw / 2 - padX : x;
      c.fillStyle = rgba(C.paper, 0.94);
      c.fillRect(bx, y - bh / 2, tw + padX * 2, bh);
      c.strokeStyle = rgba(color, 0.62);
      c.lineWidth = 1;
      c.strokeRect(bx + 0.5, y - bh / 2 + 0.5, tw + padX * 2 - 1, bh - 1);
      c.fillStyle = C.ink;
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.fillText(s, bx + padX, y + 0.5);
      c.restore();
    }

    function arrow(c, x1, y1, x2, y2, color, width, head) {
      var dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      if (len < 0.01) return;
      var w = width || 1.5;
      var h = Math.max(4, head || w * 3.4);
      c.save();
      c.strokeStyle = color;
      c.fillStyle = color;
      c.lineWidth = w;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2 - dx / len * h * 0.8, y2 - dy / len * h * 0.8);
      c.stroke();
      c.beginPath();
      c.moveTo(x2, y2);
      c.lineTo(x2 - dx / len * h + dy / len * h * 0.48, y2 - dy / len * h - dx / len * h * 0.48);
      c.lineTo(x2 - dx / len * h - dy / len * h * 0.48, y2 - dy / len * h + dx / len * h * 0.48);
      c.closePath();
      c.fill();
      c.restore();
    }

    function drawDots(c) {
      c.save();
      c.fillStyle = rgba(C.line, 0.62);
      for (var x = 24; x < W; x += 30) {
        for (var y = 24; y < H; y += 30) c.fillRect(x, y, 1, 1);
      }
      c.restore();
    }

    function makeCloud(cx, cy, rx, ry, n, seed) {
      var pts = [];
      for (var i = 0; i < n; i++) {
        var u = hash(i + 3, seed) + hash(i + 41, seed + 1) - 1;
        var v = hash(i + 17, seed + 5) + hash(i + 59, seed + 9) - 1;
        pts.push({ x: cx + u * rx, y: cy + v * ry, a: 0.16 + hash(i, seed + 13) * 0.26 });
      }
      return pts;
    }

    var NEG = makeCloud(-1.14, 0, 0.64, 0.55, 44, 2);
    var POS = makeCloud(1.14, 0, 0.64, 0.55, 44, 7);

    function drawCloud(c, pts, color) {
      for (var i = 0; i < pts.length; i++) {
        c.beginPath();
        c.arc(pts[i].x, pts[i].y, 1.8, 0, Math.PI * 2);
        c.fillStyle = rgba(color, pts[i].a);
        c.fill();
      }
    }

    function mapFor(top, bottom) {
      var padX = Math.max(22, Math.min(36, W * 0.05));
      var availW = W - padX * 2;
      var availH = Math.max(1, bottom - top);
      var sc = Math.min(availW / 5.2, availH / 2.6);
      var cx = W / 2;
      var cy = top + availH / 2;
      return {
        padX: padX,
        sx: function (x) { return cx + x * sc; },
        sy: function (y) { return cy - y * sc; }
      };
    }

    function drawAxis(c, map) {
      var y = map.sy(0);
      var x0 = map.sx(-2.2);
      var x1 = map.sx(2.24);
      arrow(c, x0, y, x1, y, C.gold, 2, 9);
      drawText(c, "Sentiment", x1, y - 17, {
        align: "right",
        size: 11,
        display: true,
        color: C.gold,
        bg: rgba(C.paper2 || C.paper, 0.9)
      });
      drawText(c, DE ? "negativ" : "negative", map.sx(-1.14), map.sy(-0.92), {
        align: "center",
        size: 10.5,
        color: C.lilac
      });
      drawText(c, DE ? "positiv" : "positive", map.sx(1.14), map.sy(-0.92), {
        align: "center",
        size: 10.5,
        color: C.green
      });
    }

    function drawProjectionHistogram(c, map) {
      var axisY = map.sy(0);
      var x0 = map.sx(-2.2), x1 = map.sx(2.2);
      var bins = 18;
      var bw = (x1 - x0) / bins;
      var neg = [], pos = [], i;
      for (i = 0; i < bins; i++) { neg.push(0); pos.push(0); }
      function add(arr, v) {
        var k = Math.floor((clamp(v, -2.2, 2.2) + 2.2) / 4.4 * bins);
        k = Math.max(0, Math.min(bins - 1, k));
        arr[k]++;
      }
      for (i = 0; i < NEG.length; i++) add(neg, NEG[i].x);
      for (i = 0; i < POS.length; i++) add(pos, POS[i].x);
      var max = 1;
      for (i = 0; i < bins; i++) max = Math.max(max, neg[i], pos[i]);
      var hMax = Math.min(46, Math.max(24, H * 0.075));
      c.save();
      for (i = 0; i < bins; i++) {
        var x = x0 + i * bw;
        if (pos[i]) {
          var hp = pos[i] / max * hMax;
          c.fillStyle = rgba(C.green, 0.22);
          c.fillRect(x + 0.5, axisY - hp, Math.max(1, bw - 1), hp);
        }
        if (neg[i]) {
          var hn = neg[i] / max * hMax;
          c.fillStyle = rgba(C.lilac, 0.22);
          c.fillRect(x + 0.5, axisY + 1, Math.max(1, bw - 1), hn);
        }
      }
      c.restore();
      drawText(c, DE ? "Projektionen auf w" : "projections onto w", x0, axisY - hMax - 9, {
        size: 8.8,
        color: C.muted
      });
      drawText(c, DE ? "positiv" : "positive", x1, axisY - hMax - 9, {
        align: "right",
        size: 8.8,
        color: C.green
      });
    }

    function drawClouds(c, map) {
      var neg = [], pos = [];
      for (var i = 0; i < NEG.length; i++) {
        neg.push({ x: map.sx(NEG[i].x), y: map.sy(NEG[i].y), a: NEG[i].a });
        pos.push({ x: map.sx(POS[i].x), y: map.sy(POS[i].y), a: POS[i].a });
      }
      drawCloud(c, neg, C.lilac);
      drawCloud(c, pos, C.green);
    }

    function drawDot(c, x, y, color) {
      var glow = c.createRadialGradient(x, y, 1, x, y, 34);
      glow.addColorStop(0, rgba(color, 0.22));
      glow.addColorStop(1, rgba(color, 0));
      c.fillStyle = glow;
      c.beginPath();
      c.arc(x, y, 34, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(x, y, 7.5, 0, Math.PI * 2);
      c.fillStyle = color;
      c.fill();
      c.strokeStyle = rgba(C.paper, 0.95);
      c.lineWidth = 2;
      c.stroke();
      c.beginPath();
      c.arc(x, y, 2.4, 0, Math.PI * 2);
      c.fillStyle = rgba(C.ink, 0.62);
      c.fill();
    }

    function drawDirection(c) {
      var map = mapFor(58, H - 52);
      drawText(c, DE ? "Eine Achse im Aktivierungsraum" : "One axis in activation space", map.padX, 27, {
        size: 10.5,
        color: C.muted
      });
      drawText(c, DE ? "Bedeutung = Richtung" : "Meaning = direction", W - map.padX, 27, {
        align: "right",
        size: 11,
        display: true,
        color: C.gold
      });
      drawAxis(c, map);
      drawProjectionHistogram(c, map);
      drawClouds(c, map);

      var ax = clamp(alpha, -1.2, 1.2);
      var px = map.sx(ax);
      var py = map.sy(0.52);
      var axisY = map.sy(0);

      c.save();
      c.setLineDash([4, 4]);
      c.strokeStyle = rgba(C.blue, 0.52);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px, axisY);
      c.stroke();
      c.restore();

      c.beginPath();
      c.arc(px, axisY, 4.2, 0, Math.PI * 2);
      c.fillStyle = C.gold;
      c.fill();
      c.strokeStyle = rgba(C.paper, 0.95);
      c.lineWidth = 1.5;
      c.stroke();

      drawDot(c, px, py, C.green);
      pill(c, (DE ? "Projektion = " : "Projection = ") + (ax >= 0 ? "+" : "-") + Math.abs(ax).toFixed(1), px, py - 30, C.green, "center");
    }

    function formatAlpha(v) {
      return (v >= 0 ? "+" : "") + v.toFixed(2);
    }

    function drawSteer(c) {
      var narrow = W < 560;
      var map = mapFor(narrow ? 70 : 60, H - 92);
      var padX = map.padX;

      drawText(c, DE ? "Steuern mit der Richtung w" : "Steering with direction w", padX, 27, {
        size: 13,
        display: true,
        color: C.ink
      });
      if (narrow) {
        drawText(c, "x' = x + α·w", padX, 50, { size: 15, display: true, color: C.gold });
        drawText(c, "α = " + formatAlpha(alpha), padX + 104, 50, { size: 10.5, color: C.muted });
      } else {
        drawText(c, "x' = x + α·w", W - padX, 27, { align: "right", size: 16, display: true, color: C.gold });
        drawText(c, "α = " + formatAlpha(alpha), W - padX, 47, { align: "right", size: 10.5, color: C.muted });
      }

      drawAxis(c, map);
      drawClouds(c, map);

      var base = -0.35;
      var cur = clamp(base + alpha, -2.05, 2.05);
      var axisY = map.sy(0);
      var bx = map.sx(base);
      var cx = map.sx(cur);
      var wx = map.sx(base + 0.82);

      c.save();
      c.setLineDash([5, 4]);
      c.strokeStyle = rgba(C.blue, 0.46);
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(bx, axisY);
      c.lineTo(cx, axisY);
      c.stroke();
      c.restore();

      arrow(c, bx, axisY - 17, wx, axisY - 17, rgba(C.lilac, 0.8), 1.4, 6);
      drawText(c, "w", wx + 6, axisY - 17, { size: 10, display: true, color: C.lilac });

      c.beginPath();
      c.arc(bx, axisY, 3.4, 0, Math.PI * 2);
      c.strokeStyle = rgba(C.muted, 0.7);
      c.lineWidth = 1.2;
      c.stroke();

      var dotColor = cur > 0.12 ? C.green : cur < -0.12 ? C.lilac : C.petrol;
      drawDot(c, cx, axisY, dotColor);

      var cardW = narrow ? W - padX * 2 : Math.min(W * 0.58, 370);
      var cardH = 54;
      var cardX = padX;
      var cardY = H - 70;
      var positive = cur >= 0;
      var accent = positive ? C.green : C.lilac;

      c.fillStyle = rgba(C.paper, 0.95);
      c.fillRect(cardX, cardY, cardW, cardH);
      c.strokeStyle = rgba(C.line, 0.95);
      c.lineWidth = 1;
      c.strokeRect(cardX + 0.5, cardY + 0.5, cardW - 1, cardH - 1);

      c.beginPath();
      c.arc(cardX + 14, cardY + 16, 3.2, 0, Math.PI * 2);
      c.fillStyle = accent;
      c.fill();
      drawText(c, positive ? (DE ? "positiv" : "positive") : (DE ? "negativ" : "negative"), cardX + 23, cardY + 16, {
        size: 10,
        display: true,
        color: accent
      });
      drawText(c,
        positive
          ? (DE ? "Fortsetzung: „… ich würde ihn sofort wieder ansehen.“" : "Continuation: “… I would watch it again right away.”")
          : (DE ? "Fortsetzung: „… ich habe nach zehn Minuten abgeschaltet.“" : "Continuation: “… I turned it off after ten minutes.”"),
        cardX + 12, cardY + 36, { size: 10.5, color: C.ink });
    }

    function scatterMap(r) {
      var pad = 12;
      var w = Math.max(1, r.w - pad * 2);
      var h = Math.max(1, r.h - pad * 2);
      return {
        sx: function (x) { return r.x + pad + (x + 1.8) / 3.6 * w; },
        sy: function (y) { return r.y + pad + (1.8 - y) / 3.6 * h; }
      };
    }

    function buildScatter() {
      var out = [], i;
      for (i = 0; i < 34; i++) {
        var tx = 0.72 + (hash(i + 2, 21) + hash(i + 31, 22) - 1) * 0.38;
        var ty = 0.82 + (hash(i + 6, 23) + hash(i + 37, 24) - 1) * 0.38;
        if (ty < tx + 0.18) ty = tx + 0.18 + hash(i + 44, 25) * 0.45;
        out.push({ x: clamp(tx, -1.62, 1.62), y: clamp(ty, -1.62, 1.62), truth: true, a: 0.18 + hash(i, 26) * 0.24 });
      }
      for (i = 0; i < 34; i++) {
        var fx = -0.72 + (hash(i + 4, 31) + hash(i + 29, 32) - 1) * 0.38;
        var fy = -0.82 + (hash(i + 8, 33) + hash(i + 39, 34) - 1) * 0.38;
        if (fy > fx - 0.18) fy = fx - 0.18 - hash(i + 46, 35) * 0.45;
        out.push({ x: clamp(fx, -1.62, 1.62), y: clamp(fy, -1.62, 1.62), truth: false, a: 0.18 + hash(i + 5, 36) * 0.24 });
      }
      return out;
    }

    var SCATTER = buildScatter();

    function drawScatter(c, r) {
      var m = scatterMap(r);
      c.save();
      c.strokeStyle = rgba(C.line, 0.7);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(m.sx(-1.8), m.sy(0));
      c.lineTo(m.sx(1.8), m.sy(0));
      c.moveTo(m.sx(0), m.sy(-1.8));
      c.lineTo(m.sx(0), m.sy(1.8));
      c.stroke();
      c.restore();

      for (var i = 0; i < SCATTER.length; i++) {
        var p = SCATTER[i];
        c.beginPath();
        c.arc(m.sx(p.x), m.sy(p.y), 1.9, 0, Math.PI * 2);
        c.fillStyle = rgba(p.truth ? C.green : C.lilac, p.a);
        c.fill();
      }

      c.save();
      c.strokeStyle = rgba(C.petrol, 0.8);
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(m.sx(-1.75), m.sy(-1.7));
      c.lineTo(m.sx(1.75), m.sy(1.8));
      c.stroke();
      c.restore();
      drawText(c, DE ? "Probe" : "probe", m.sx(0.42), m.sy(0.72), {
        size: 10,
        display: true,
        color: C.petrol,
        bg: rgba(C.paper2 || C.paper, 0.88)
      });
      drawText(c, DE ? "wahr" : "true", m.sx(1.24), m.sy(1.48), { align: "center", size: 10.5, color: C.green });
      drawText(c, DE ? "falsch" : "false", m.sx(-1.24), m.sy(-1.48), { align: "center", size: 10.5, color: C.lilac });
    }

    function drawHeadGrid(c, x, y, w, h) {
      var cols = 8, rows = 6;
      var cell = Math.min(w / cols, h / rows);
      var gw = cell * cols, gh = cell * rows;
      var ox = x + (w - gw) / 2;
      var oy = y + (h - gh) / 2;
      var selected = [3, 12, 21, 30, 44];
      for (var r = 0; r < rows; r++) {
        for (var col = 0; col < cols; col++) {
          var idx = r * cols + col;
          var on = selected.indexOf(idx) >= 0;
          c.fillStyle = on ? rgba(C.gold, 0.2) : rgba(C.paper, 0.88);
          c.fillRect(ox + col * cell, oy + r * cell, cell - 2, cell - 2);
          c.strokeStyle = on ? C.gold : rgba(C.line, 0.9);
          c.lineWidth = on ? 1.5 : 1;
          c.strokeRect(ox + col * cell + 0.5, oy + r * cell + 0.5, cell - 3, cell - 3);
          if (on) {
            c.beginPath();
            c.arc(ox + col * cell + (cell - 2) / 2, oy + r * cell + (cell - 2) / 2, 2.4, 0, Math.PI * 2);
            c.fillStyle = C.gold;
            c.fill();
          }
        }
      }
    }

    function drawNudge(c, r) {
      var ox = r.x + 20;
      var oy = r.y + r.h / 2 + 12;
      var len = Math.min(r.w * 0.56, 118);
      var p1x = ox + len;
      var p1y = oy - len * 0.42;
      var shiftX = len * 0.24;
      var shiftY = -len * 0.12;
      var p2x = p1x + shiftX;
      var p2y = p1y + shiftY;
      var on = nudge;

      arrow(c, ox, oy, p1x, p1y, rgba(C.petrol, 0.72), 1.6, 6);
      arrow(c, ox, oy, p2x, p2y, rgba(C.gold, on ? 1 : 0.42), on ? 2 : 1.4, 6);
      c.save();
      c.setLineDash([3, 4]);
      c.strokeStyle = rgba(C.lilac, 0.8);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(p1x, p1y);
      c.lineTo(p2x, p2y);
      c.stroke();
      c.restore();

      drawText(c, "x", p1x + 5, p1y - 4, { size: 9.5, display: true, color: C.petrol });
      drawText(c, "x'", p2x + 5, p2y - 4, { size: 9.5, display: true, color: C.gold });
      drawText(c, "+ασw", p1x + shiftX / 2 + 4, p1y + shiftY / 2 - 8, { size: 9, color: C.lilac });
    }

    function drawTruthBar(c, x, y, w) {
      var labelW = 54, valueW = 48;
      var trackX = x + labelW + 6;
      var trackW = Math.max(40, w - labelW - valueW - 12);
      drawText(c, DE ? "Basis" : "base", x, y + 18, { size: 9.5, color: C.muted });
      drawText(c, "ITI", x, y + 32, { size: 9.5, display: true, color: C.green });

      c.fillStyle = rgba(C.line, 0.42);
      c.fillRect(trackX, y + 14, trackW, 8);
      c.fillStyle = rgba(C.petrol, 0.55);
      c.fillRect(trackX, y + 14, trackW * 0.325, 8);

      c.fillStyle = rgba(C.line, 0.42);
      c.fillRect(trackX, y + 28, trackW, 8);
      c.fillStyle = C.green;
      c.fillRect(trackX, y + 28, trackW * 0.651, 8);

      drawText(c, "32.5 %", x + w, y + 18, { align: "right", size: 10, display: true, color: C.ink });
      drawText(c, "65.1 %", x + w, y + 32, { align: "right", size: 10, display: true, color: C.green });
    }

    function drawIti(c) {
      var narrow = W < 620;
      var padX = Math.max(18, Math.min(30, W * 0.035));
      if (narrow) {
        drawText(c, "ITI", padX, 22, { size: 18, display: true, color: C.ink });
        drawText(c, DE ? "Aktivierung zur Inferenzzeit verschieben" : "Shift activations at inference time", padX + 34, 23, {
          size: 10,
          color: C.muted
        });
      } else {
        drawText(c, DE ? "ITI: Aktivierung zur Inferenzzeit verschieben" : "ITI: shift activations at inference time", padX, 24, {
          size: 14,
          display: true,
          color: C.ink
        });
      }

      var top = narrow ? 42 : 48;
      var barTop = H - 62;
      var contentBottom = barTop - 10;
      var leftW = W * (narrow ? 0.48 : 0.45);
      var rightX = padX + leftW + (narrow ? 10 : 24);
      var rightW = Math.max(80, W - padX - rightX);
      var scatter = { x: padX, y: top, w: leftW, h: contentBottom - top };
      var cell = Math.max(6, Math.min(rightW / 8, (contentBottom - top) / 17));
      var gridW = cell * 8;
      var gridH = cell * 6;
      var gridY = top + 14;

      drawScatter(c, scatter);
      drawText(c, DE ? "Heads · K = 48" : "Heads · K = 48", rightX, top + 4, { size: 9.5, display: true, color: C.ink });
      drawHeadGrid(c, rightX, gridY, gridW, gridH);
      drawText(c, DE ? "5 ausgewählt" : "5 selected", rightX, gridY + gridH + 10, { size: 8.5, color: C.muted });

      var nudgeY = gridY + gridH + 18;
      var nudgeRect = {
        x: rightX,
        y: nudgeY,
        w: rightW,
        h: Math.max(24, Math.min(104, contentBottom - nudgeY))
      };
      drawNudge(c, nudgeRect);

      drawText(c, "TruthfulQA · true*informative · Alpaca", padX, barTop, { size: 9.5, display: true, color: C.ink });
      drawTruthBar(c, padX, barTop, W - padX * 2);
      drawText(c, "K = 48 · α = 15 · LLaMA-7B", W - padX, H - 14, { align: "right", size: 8.5, color: C.muted });
    }

    function makeChip(text, color) {
      var s = document.createElement("span");
      s.className = "ls-sent-chip";
      s.innerHTML = (color ? '<i style="background:' + color + '"></i>' : "") + text;
      return s;
    }

    function makeButton(label, fn) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ls-sent-btn";
      b.textContent = label;
      b.addEventListener("click", fn);
      return b;
    }

    function setAlpha(v) {
      alpha = clamp(v, -1.5, 1.5);
      if (sliderEl) sliderEl.value = String(alpha);
      var out = controls.querySelector(".ls-sent-out");
      if (out) out.textContent = formatAlpha(alpha);
      syncReadout();
      draw();
    }

    function buildControls() {
      controls.innerHTML = "";
      sliderEl = null;
      if (mode === "steer") {
        var lab = document.createElement("span");
        lab.className = "ls-sent-label";
        lab.textContent = "α";
        var range = document.createElement("input");
        range.type = "range";
        range.className = "ls-sent-range";
        range.min = "-1.5";
        range.max = "1.5";
        range.step = "0.05";
        range.value = String(alpha);
        range.setAttribute("aria-label", DE ? "Steuerstärke α" : "steering strength α");
        var out = document.createElement("output");
        out.className = "ls-sent-out";
        out.textContent = formatAlpha(alpha);
        range.addEventListener("input", function () {
          alpha = clamp(parseFloat(range.value) || 0, -1.5, 1.5);
          out.textContent = formatAlpha(alpha);
          syncReadout();
          draw();
        });
        sliderEl = range;
        controls.appendChild(lab);
        controls.appendChild(range);
        controls.appendChild(out);
        controls.appendChild(makeButton("- w", function () { setAlpha(alpha - 0.2); }));
        controls.appendChild(makeButton("+ w", function () { setAlpha(alpha + 0.2); }));
        controls.appendChild(makeButton(DE ? "Zurücksetzen" : "Reset", function () { setAlpha(0.8); }));
      } else if (mode === "iti") {
        var btn = makeButton(
          nudge ? (DE ? "Verschiebung zurücknehmen" : "Undo nudge") : (DE ? "+ασw anwenden" : "Apply +ασw"),
          function () {
            nudge = !nudge;
            buildControls();
            syncReadout();
            draw();
          }
        );
        if (nudge) btn.classList.add("is-on");
        controls.appendChild(btn);
        controls.appendChild(makeChip("K = 48", null));
        controls.appendChild(makeChip("α = 15", null));
        controls.appendChild(makeChip("LLaMA-7B", null));
      } else {
        var lab = document.createElement("span");
        lab.className = "ls-sent-label";
        lab.textContent = DE ? "Aktivierung" : "activation";
        var range = document.createElement("input");
        range.type = "range";
        range.className = "ls-sent-range";
        range.min = "-1.2";
        range.max = "1.2";
        range.step = "0.05";
        range.value = String(alpha);
        range.setAttribute("aria-label", DE ? "Position der Aktivierung" : "position of the activation");
        var out = document.createElement("output");
        out.className = "ls-sent-out";
        out.textContent = formatAlpha(alpha);
        range.addEventListener("input", function () {
          alpha = clamp(parseFloat(range.value) || 0, -1.2, 1.2);
          out.textContent = formatAlpha(alpha);
          syncReadout();
          draw();
        });
        sliderEl = range;
        controls.appendChild(lab);
        controls.appendChild(range);
        controls.appendChild(out);
        controls.appendChild(makeChip(DE ? "negativ" : "negative", C.lilac));
        controls.appendChild(makeChip(DE ? "positiv" : "positive", C.green));
        controls.appendChild(makeChip("w", C.gold));
      }
    }

    function syncReadout() {
      var srcT = '<span class="ls-sent-src"><a href="https://arxiv.org/abs/2310.15154" target="_blank" rel="noopener">Tigges et al. (2023)</a></span>';
      var srcL = '<span class="ls-sent-src"><a href="https://arxiv.org/abs/2306.03341" target="_blank" rel="noopener">Li et al. (2023)</a></span>';
      if (mode === "direction") {
        readout.innerHTML = srcT + "<span>" + (DE
          ? "Ohne die Richtung verliert Pythia-2.8B 76 % seiner über dem Zufall liegenden SST-Genauigkeit."
          : "Without the direction, Pythia-2.8B loses 76% of its above-chance SST accuracy.") + "</span>";
      } else if (mode === "steer") {
        readout.innerHTML = srcT + "<span>" + (DE
          ? "Das Vorzeichen der Projektion kippt die Fortsetzung."
          : "The sign of the projection flips the continuation.") + "</span>";
      } else {
        readout.innerHTML = srcL + "<span>" + (DE
          ? "ITI addiert α·σ·w an ausgewählten Attention-Heads zur Inferenzzeit. Alpaca: 32.5 % → 65.1 % auf TruthfulQA true*informative."
          : "ITI adds α·σ·w at selected attention heads at inference time. Alpaca: 32.5% → 65.1% on TruthfulQA true*informative.") + "</span>";
      }
    }

    function ariaForMode() {
      if (mode === "direction") {
        return DE
          ? "Aktivierungsebene mit positiver und negativer Punktwolke, goldener Sentiment-Achse und Projektion plus 0.8."
          : "Activation plane with positive and negative point clouds, a golden sentiment axis and projection plus 0.8.";
      }
      if (mode === "steer") {
        return DE
          ? "Steuerungs-Demo: Eine Aktivierung wandert entlang der Sentiment-Achse; α steuert die Verschiebung."
          : "Steering demo: an activation moves along the sentiment axis; α controls the shift.";
      }
      return DE
        ? "ITI-Demo: Wahr-Falsch-Streuung, ausgewählte Heads, Vektorverschiebung und TruthfulQA-Balken von 32.5 auf 65.1 Prozent."
        : "ITI demo: true/false scatter, selected heads, vector shift and TruthfulQA bars from 32.5 to 65.1 percent.";
    }

    function draw() {
      if (!ctx || !W || !H) return;
      C = api.colors();
      V.aurora(ctx, W, H, C, { vignette: 0.08, gold: 0.055 });
      if (mode === "steer") drawSteer(ctx);
      else if (mode === "iti") drawIti(ctx);
      else drawDirection(ctx);
      canvas.setAttribute("aria-label", ariaForMode());
    }

    function resize() {
      var r = api.fit(canvas, stage);
      W = r.w;
      H = r.h;
      ctx = r.ctx;
      draw();
    }

    function update(s) {
      var st = s || {};
      var next = st.mode || mode;
      if (next !== "direction" && next !== "steer" && next !== "iti") next = "direction";
      var changed = next !== mode;
      mode = next;
      if (typeof st.alpha === "number" && isFinite(st.alpha)) alpha = clamp(st.alpha, -1.5, 1.5);
      if (typeof st.nudge === "boolean") nudge = st.nudge;
      if (changed || (mode === "iti" && typeof st.nudge === "boolean")) buildControls();
      else if (sliderEl) sliderEl.value = String(alpha);
      syncReadout();
      draw();
    }

    function onTheme() {
      C = api.colors();
      buildControls();
      resize();
    }

    window.addEventListener("tm:theme", onTheme);
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { resize(); });
      ro.observe(stage);
    }
    buildControls();
    syncReadout();
    resize();

    return {
      update: update,
      resize: resize,
      destroy: function () {
        window.removeEventListener("tm:theme", onTheme);
        if (ro) ro.disconnect();
        el.remove();
      }
    };
  }

  core.register("sentiment", sentimentScene);
})();
