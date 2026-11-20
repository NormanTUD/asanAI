(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function qkvScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var tokens = DE ? ["Das", "Tier", "lief", "nicht", "über", "die", "Straße", "weil", "es", "zu", "müde", "war"] : ["The", "animal", "did", "not", "cross", "the", "street", "because", "it", "was", "too", "tired"];
    var query = 8;
    function norm(a) { var s = a.reduce(function (x, y) { return x + y; }, 0); return a.map(function (v) { return v / s; }); }
    var W = [
      norm([0.01, 0.52, 0.01, 0.01, 0.03, 0.01, 0.10, 0.03, 0.16, 0.03, 0.01, 0.08]),
      norm([0.02, 0.08, 0.01, 0.01, 0.04, 0.02, 0.55, 0.03, 0.10, 0.04, 0.02, 0.08])
    ];
    var head = 0, view = "arcs", weights = W[0].slice(), prev = W[0].slice();
    var simplexGeom = null, simplexDrag = false, simplexCorner = -1, simplexVerts = null;
    var graphHover = -1, graphMouse = { x: 0, y: 0 };
    var arcHits = [], arcHover = -1, pinnedToken = -1;
    var t = 1, start = 0, raf = 0, loopRaf = 0, running = true;
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var el = document.createElement("div");
    el.className = "ls-qkv-scene";
    el.innerHTML =
      '<div class="ls-qkv-stage"><canvas class="ls-canvas" role="img"></canvas><div class="ls-qkv-tip" hidden></div></div>' +
      '<div class="ls-qkv-vectors" aria-hidden="true"></div>' +
      '<div class="ls-qkv-controls">' +
        '<div class="ls-qkv-headrow"><button type="button" class="ls-chip is-on" data-head="0">' + (DE ? "Head 1 · Wer?" : "Head 1 · who?") + '</button>' +
        '<button type="button" class="ls-chip" data-head="1">' + (DE ? "Head 2 · Wo?" : "Head 2 · where?") + '</button></div>' +
        '<div class="ls-qkv-view"><button type="button" class="ls-chip is-on" data-view="arcs">' + (DE ? "Bögen" : "Arcs") + '</button><button type="button" class="ls-chip" data-view="graph">' + (DE ? "Graph" : "Graph") + '</button><button type="button" class="ls-chip" data-view="simplex">Simplex</button></div>' +
        '<span class="ls-qkv-query">' + (DE ? "Query" : "query") + ' <b>' + (DE ? "es" : "it") + '</b></span>' +
      '</div>' +
      '<div class="ls-qkv-percent"></div>' +
      '<div class="ls-qkv-readout" aria-live="polite"></div>' +
      '<div class="ls-scene-formula ls-qkv-formula"><div class="ls-math"></div></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-qkv-stage");
    var canvas = el.querySelector("canvas");
    var tipEl = el.querySelector(".ls-qkv-tip");
    var readout = el.querySelector(".ls-qkv-readout");
    var percentEl = el.querySelector(".ls-qkv-percent");
    var formulaEl = el.querySelector(".ls-qkv-formula .ls-math");
    var pipelineTex = DE
      ? "\\begin{aligned}&\\underbrace{\\underbrace{q_i=W_Qx_i,\\quad k_j=W_Kx_j}_{\\text{Q,K gelernt}}\\;\\rightarrow\\;\\underbrace{\\alpha_{ij}=\\operatorname{softmax}_j\\!\\left(\\frac{q_i^\\top k_j}{\\sqrt{d_k}}\\right)}_{\\text{Gewichte }\\alpha}}_{\\text{bestimmt den Punkt im Gewichts-Simplex}}\\\\&\\underbrace{v_j=W_Vx_j}_{\\text{V gelernt}}\\;\\rightarrow\\;\\underbrace{r_i=\\sum_j\\underbrace{\\alpha_{ij}}_{\\text{Gewicht}}\\underbrace{v_j}_{\\text{Value}}}_{\\text{gewichtete Mischung der Values}}\\;\\rightarrow\\;\\underbrace{y_i=W_Or_i}_{\\text{Head-Ausgabe}}\\end{aligned}"
      : "\\begin{aligned}&\\underbrace{\\underbrace{q_i=W_Qx_i,\\quad k_j=W_Kx_j}_{\\text{Q,K learned}}\\;\\rightarrow\\;\\underbrace{\\alpha_{ij}=\\operatorname{softmax}_j\\!\\left(\\frac{q_i^\\top k_j}{\\sqrt{d_k}}\\right)}_{\\text{weights }\\alpha}}_{\\text{sets the point in the weight simplex}}\\\\&\\underbrace{v_j=W_Vx_j}_{\\text{V learned}}\\;\\rightarrow\\;\\underbrace{r_i=\\sum_j\\underbrace{\\alpha_{ij}}_{\\text{weight}}\\underbrace{v_j}_{\\text{value}}}_{\\text{weighted mixture of the values}}\\;\\rightarrow\\;\\underbrace{y_i=W_Or_i}_{\\text{head output}}\\end{aligned}";
    if (formulaEl) {
      formulaEl.setAttribute("data-tex", pipelineTex);
      formulaEl.removeAttribute("data-tex-rendered");
      if (api.typeset) api.typeset(el.querySelector(".ls-qkv-formula"));
    }
    var lastPercent = "", lastReadout = "";
    function setPercent(html) {
      if (html === lastPercent) return;
      lastPercent = html;
      percentEl.innerHTML = html;
    }
    function setReadout(html) {
      if (html === lastReadout) return;
      lastReadout = html;
      readout.innerHTML = html;
    }
    function hideTip() {
      if (tipEl) tipEl.hidden = true;
    }
    function showTip(i, px, py) {
      if (!tipEl || !size) return;
      var tok = tokens[i] || "";
      var text = i === query
        ? (DE ? "Query „" + tok + "“ · verteilt 100% auf alle Tokens" : "query “" + tok + "” · distributes 100% over all tokens")
        : (DE ? "„" + tokens[query] + "“ → „" + tok + "“ · " + (weights[i] * 100).toFixed(1) + "%" : "“" + tokens[query] + "” → “" + tok + "” · " + (weights[i] * 100).toFixed(1) + "%");
      tipEl.innerHTML = '<b>' + api.esc(tok) + '</b><br>' + api.esc(text);
      tipEl.hidden = false;
      var tw = tipEl.offsetWidth || 180, th = tipEl.offsetHeight || 34;
      tipEl.style.left = Math.max(4, Math.min(size.w - tw - 4, px + 12)) + "px";
      tipEl.style.top = Math.max(4, Math.min(size.h - th - 4, py + 12)) + "px";
    }
    var vectorsEl = el.querySelector(".ls-qkv-vectors");
    var size = null, ctx = null;
    var C = api.colors();
    var VECTOR_DATA = [
      { q: [0.8, 0.3, 0.6, 0.2, 0.9], k: [0.9, 0.2, 0.7, 0.1, 0.8], v: [0.2, 0.8, 0.4, 0.9, 0.3] },
      { q: [0.7, 0.4, 0.5, 0.3, 0.8], k: [0.3, 0.9, 0.2, 0.8, 0.4], v: [0.9, 0.2, 0.7, 0.1, 0.6] }
    ];
    function renderVectors() {
      var vd = VECTOR_DATA[head];
      var rows = [["q", vd.q, "green"], ["k", vd.k, "sky"], ["v", vd.v, "gold"]];
      vectorsEl.innerHTML = rows.map(function (row) {
        return '<div class="ls-qkv-vec ls-qkv-vec--' + row[2] + '"><span>' + row[0] + '</span><span class="ls-qkv-vbars">' +
          row[1].map(function (v) { return '<i style="--v:' + v.toFixed(2) + '"></i>'; }).join("") +
        '</span></div>';
      }).join("");
    }
    function setHead(h) {
      if (h === head) return;
      endSimplexDrag();
      prev = weights.slice();
      head = h;
      start = performance.now();
      t = 0;
      el.querySelectorAll("[data-head]").forEach(function (b) {
        b.classList.toggle("is-on", parseInt(b.getAttribute("data-head"), 10) === head);
      });
      renderVectors();
      if (reduced) { weights = W[head].slice(); t = 1; draw(); return; }
      if (raf) cancelAnimationFrame(raf);
      function step(now) {
        t = Math.min(1, (now - start) / 520);
        var e = ease(t);
        weights = prev.map(function (v, i) { return lerp(v, W[head][i], e); });
        draw();
        raf = t < 1 ? requestAnimationFrame(step) : 0;
      }
      raf = requestAnimationFrame(step);
    }
    function layout() {
      var w = size.w, h = size.h, pad = 12, gap = 4;
      var bw = (w - pad * 2 - gap * (tokens.length - 1)) / tokens.length;
      var bh = Math.min(30, Math.max(22, h * 0.09));
      var y = Math.max(64, Math.min(104, h * 0.36));
      return { w: w, h: h, pad: pad, gap: gap, bw: bw, bh: bh, y: y };
    }
    function drawArcs() {
      if (!size) return;
      arcHits = [];
      ctx = size.ctx;
      var L = layout();
      var w = L.w, h = L.h, pad = L.pad, gap = L.gap, bw = L.bw, bh = L.bh, y = L.y;
      ctx.clearRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
      bg.addColorStop(0, "rgba(247,250,249,.95)");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      var centers = tokens.map(function (_, i) { return pad + i * (bw + gap) + bw / 2; });
      var qx = centers[query], qy = y + bh;
      var color = head === 0 ? C.green : C.blue;
      // arcs
      tokens.forEach(function (tok, i) {
        if (i === query) return;
        var a = weights[i];
        var x = centers[i];
        var mx = (qx + x) / 2;
        var lift = Math.min(60, 20 + Math.abs(qx - x) * 0.18, Math.max(8, y - 18));
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.10 + Math.min(0.78, a * 5.5);
        ctx.lineWidth = 0.7 + Math.min(9, a * 26);
        ctx.beginPath();
        ctx.moveTo(qx, qy - 2);
        ctx.quadraticCurveTo(mx, y - lift, x, y - 2);
        ctx.stroke();
        if (a > 0.12) {
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(x, y - 3, 2.6, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
        if (a > 0.18) {
          var ax = 0.25 * qx + 0.5 * mx + 0.25 * x;
          var ay = 0.25 * (qy - 2) + 0.5 * (y - lift) + 0.25 * (y - 2);
          var label = (a * 100).toFixed(0) + "%";
          ctx.font = '700 9px "Open Sans", sans-serif';
          var lw = ctx.measureText(label).width + 8;
          ctx.fillStyle = "rgba(255,255,255,.86)";
          ctx.fillRect(ax - lw / 2, ay - 7, lw, 14);
          ctx.fillStyle = color;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(label, ax, ay);
        }
      });
      // Q/K/V legend
      var lx = w - pad - 4, ly = 7;
      [["Q", C.green], ["K", C.sky], ["V", C.gold]].forEach(function (item) {
        ctx.fillStyle = item[1];
        ctx.beginPath(); ctx.arc(lx - 14, ly + 8, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.ink;
        ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "right"; ctx.textBaseline = "top";
        ctx.fillText(item[0], lx, ly);
        lx -= 34;
      });
      // tokens
      tokens.forEach(function (tok, i) {
        var x = pad + i * (bw + gap);
        var isQ = i === query;
        var isTop = weights[i] > 0.22;
        ctx.fillStyle = isQ ? "rgba(99,164,75,.16)" : (isTop ? "rgba(0,146,153,.10)" : "rgba(255,255,255,.78)");
        ctx.strokeStyle = isQ ? C.green : (isTop ? C.teal || C.sky : C.line);
        ctx.lineWidth = isQ ? 2 : 1;
        ctx.fillRect(x, y, bw, bh);
        ctx.strokeRect(x, y, bw, bh);
        ctx.fillStyle = isQ ? C.petrol : C.ink;
        ctx.font = (isQ ? '700 ' : '600 ') + Math.max(9, Math.min(12, bw * 0.28)) + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(tok, x + bw / 2, y + bh / 2 + 0.5);
        arcHits.push({ x: x, y: y, w: bw, h: bh, i: i });
      });
      // weight bars
      var base = h - 28;
      var maxBar = Math.max(34, base - (y + bh) - 28);
      tokens.forEach(function (tok, i) {
        var a = weights[i];
        var x = centers[i];
        var bwid = Math.max(4, Math.min(14, bw * 0.40));
        var bhgt = Math.max(2, a * maxBar);
        var grad = ctx.createLinearGradient(0, base - bhgt, 0, base);
        grad.addColorStop(0, color);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(x - bwid / 2, base - bhgt, bwid, bhgt);
        ctx.fillStyle = C.muted;
        ctx.font = '600 9px "Open Sans", sans-serif';
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        if (a > 0.08) ctx.fillText((a * 100).toFixed(0) + "%", x, base + 3);
      });
      // labels
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif';
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(DE ? (head === 0 ? "Head 1 · Wer ist gemeint?" : "Head 2 · Wo ist es?") : (head === 0 ? "Head 1 · who is meant?" : "Head 2 · where is it?"), pad, 6);
      setPercent('<span class="ls-qkv-percent-lead">' + (DE ? "Softmax macht aus den Scores Gewichte:" : "Softmax turns scores into weights:") + '</span><span><b>Σ</b> = ' + (DE ? "1,00" : "1.00") + ' → 100%</span>');
      // readout top weights
      var top = tokens.map(function (tok, i) { return { tok: tok, w: weights[i] }; })
        .filter(function (x, i) { return i !== query; })
        .sort(function (a, b) { return b.w - a.w; }).slice(0, 3);
      setReadout(top.map(function (x) {
        return '<span><b>' + api.esc(x.tok) + '</b> ' + (x.w * 100).toFixed(1) + '%</span>';
      }).join(""));
      canvas.setAttribute("aria-label", DE
        ? "Attention-Gewichte von „it“ zu den Tokens. " + top.map(function (x) { return x.tok + ": " + (x.w * 100).toFixed(1) + "%"; }).join(", ")
        : "Attention weights from “it” to the tokens. " + top.map(function (x) { return x.tok + ": " + (x.w * 100).toFixed(1) + "%"; }).join(", "));
    }
    function barycentric(px, py, verts) {
      var ax = verts[0].x, ay = verts[0].y;
      var bx = verts[1].x, by = verts[1].y;
      var cx = verts[2].x, cy = verts[2].y;
      var v0x = bx - ax, v0y = by - ay;
      var v1x = cx - ax, v1y = cy - ay;
      var v2x = px - ax, v2y = py - ay;
      var d00 = v0x * v0x + v0y * v0y;
      var d01 = v0x * v1x + v0y * v1y;
      var d11 = v1x * v1x + v1y * v1y;
      var d20 = v2x * v0x + v2y * v0y;
      var d21 = v2x * v1x + v2y * v1y;
      var denom = d00 * d11 - d01 * d01 || 1e-9;
      var v = (d11 * d20 - d01 * d21) / denom;
      var w = (d00 * d21 - d01 * d20) / denom;
      return [1 - v - w, v, w];
    }
    function triangleArea(a, b, c) {
      return Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;
    }
    function nearCorner(px, py) {
      if (!simplexGeom) return -1;
      for (var i = 0; i < simplexGeom.verts.length; i++) {
        var v = simplexGeom.verts[i];
        if (Math.hypot(px - v.x, py - v.y) < 18) return i;
      }
      return -1;
    }
    function simplexInside(px, py) {
      if (!simplexGeom) return false;
      var b = barycentric(px, py, simplexGeom.verts);
      return b[0] >= -0.02 && b[1] >= -0.02 && b[2] >= -0.02;
    }
    function setSimplexFromPoint(px, py) {
      if (!simplexGeom) return;
      var b = barycentric(px, py, simplexGeom.verts).map(function (x) { return Math.max(0, x); });
      var sum = b[0] + b[1] + b[2];
      if (sum <= 1e-9) return;
      b = b.map(function (x) { return x / sum; });
      var ids = simplexGeom.ids;
      var mass = weights[ids[0]] + weights[ids[1]] + weights[ids[2]];
      if (mass <= 1e-9) mass = 1;
      ids.forEach(function (id, i) { weights[id] = b[i] * mass; });
      var total = weights.reduce(function (a, c) { return a + c; }, 0) || 1;
      weights = weights.map(function (w) { return w / total; });
      draw();
    }
    function endSimplexDrag() {
      if (!simplexDrag && simplexCorner < 0) return;
      simplexDrag = false;
      simplexCorner = -1;
      canvas.style.cursor = "default";
    }
    function drawGhostSimplex(ids, w, h, cx, cy, R) {
      var others = [];
      for (var i = 0; i < tokens.length; i++) if (ids.indexOf(i) < 0) others.push(i);
      var rx = Math.min(w * 0.40, R * 2.25);
      var ry = Math.min(h * 0.40, R * 1.95);
      ctx.save();
      ctx.setLineDash([2, 7]);
      ctx.strokeStyle = "rgba(0,75,111,.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var a = 0; a <= 72; a++) {
        var t = a / 72 * Math.PI * 2;
        var ex = cx + Math.cos(t) * rx, ey = cy + Math.sin(t) * ry;
        if (a === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex, ey);
      }
      ctx.stroke();
      ctx.restore();
      var start = -Math.PI / 2 + 0.35;
      others.forEach(function (id, k) {
        var ang = start + k * Math.PI * 2 / others.length;
        var x = cx + Math.cos(ang) * rx, y = cy + Math.sin(ang) * ry;
        ctx.beginPath(); ctx.arc(x, y, 2.3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(98,116,118,.34)"; ctx.fill();
        if (w > 560) {
          var lx = cx + Math.cos(ang) * (rx + 12);
          var ly = cy + Math.sin(ang) * (ry + 12);
          ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 2) + 'px "Open Sans", sans-serif';
          ctx.fillStyle = "rgba(98,116,118,.48)";
          ctx.textAlign = Math.cos(ang) > 0.25 ? "left" : Math.cos(ang) < -0.25 ? "right" : "center";
          ctx.textBaseline = "middle";
          ctx.fillText(tokens[id], lx, ly);
        }
      });
      ctx.fillStyle = "rgba(98,116,118,.60)";
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(DE ? others.length + " weitere Tokens · voller " + (tokens.length - 1) + "-Simplex" : others.length + " more tokens · full " + (tokens.length - 1) + "-simplex", 12, h - 44);
    }
    function drawSimplex() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.5, h * 0.38, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      bg.addColorStop(0, "rgba(247,250,249,.98)");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      var ids = [1, 6, 8];
      var raw = ids.map(function (i) { return Math.max(0.0001, weights[i] || 0); });
      var sum = raw.reduce(function (a, b) { return a + b; }, 0);
      var ws = raw.map(function (v) { return v / sum; });
      var cx = w / 2, cy = h * 0.47, R = Math.min(w, h) * 0.30;
      if (!simplexVerts) {
        simplexVerts = [
          { x: cx, y: cy - R },
          { x: cx - R * 0.94, y: cy + R * 0.62 },
          { x: cx + R * 0.94, y: cy + R * 0.62 }
        ];
      }
      var verts = simplexVerts;
      var cols = [C.green, C.sky, C.gold];
      simplexGeom = { verts: verts, ids: ids, ox: 0, oy: 0 };
      drawGhostSimplex(ids, w, h, cx, cy, R);
      // triangle
      ctx.beginPath(); verts.forEach(function (v, i) { if (i === 0) ctx.moveTo(v.x, v.y); else ctx.lineTo(v.x, v.y); }); ctx.closePath();
      var tg = ctx.createLinearGradient(cx, cy - R, cx, cy + R);
      tg.addColorStop(0, "rgba(99,164,75,.10)");
      tg.addColorStop(1, "rgba(0,146,153,.06)");
      ctx.fillStyle = tg; ctx.fill();
      ctx.strokeStyle = C.petrol; ctx.lineWidth = 1.4; ctx.stroke();
      // barycentric grid
      function lerpP(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
      ctx.strokeStyle = "rgba(0,75,111,.10)"; ctx.lineWidth = 1;
      [1 / 3, 2 / 3].forEach(function (t) {
        var ab = lerpP(verts[0], verts[1], t), ac = lerpP(verts[0], verts[2], t);
        ctx.beginPath(); ctx.moveTo(ab.x, ab.y); ctx.lineTo(ac.x, ac.y); ctx.stroke();
        var ba = lerpP(verts[1], verts[0], t), bc = lerpP(verts[1], verts[2], t);
        ctx.beginPath(); ctx.moveTo(ba.x, ba.y); ctx.lineTo(bc.x, bc.y); ctx.stroke();
        var ca = lerpP(verts[2], verts[0], t), cb = lerpP(verts[2], verts[1], t);
        ctx.beginPath(); ctx.moveTo(ca.x, ca.y); ctx.lineTo(cb.x, cb.y); ctx.stroke();
      });
      // output point
      var ox = ws[0] * verts[0].x + ws[1] * verts[1].x + ws[2] * verts[2].x;
      var oy = ws[0] * verts[0].y + ws[1] * verts[1].y + ws[2] * verts[2].y;
      simplexGeom.ox = ox;
      simplexGeom.oy = oy;
      verts.forEach(function (v, i) {
        ctx.strokeStyle = cols[i]; ctx.globalAlpha = 0.40; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(v.x, v.y); ctx.lineTo(ox, oy); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
        ctx.shadowColor = cols[i]; ctx.shadowBlur = 12;
        ctx.fillStyle = cols[i];
        ctx.beginPath(); ctx.arc(v.x, v.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = C.ink;
        ctx.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        var above = v.y < cy;
        ctx.fillText("v(" + tokens[ids[i]] + ")", v.x, above ? v.y - 10 : v.y + 18);
        ctx.fillStyle = cols[i];
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif';
        ctx.fillText((ws[i] * 100).toFixed(0) + "%", v.x, above ? v.y + 14 : v.y - 10);
      });
      var glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, 24);
      glow.addColorStop(0, V.alpha(C.gold, .26));
      glow.addColorStop(1, V.alpha(C.gold, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(ox - 24, oy - 24, 48, 48);
      ctx.shadowColor = C.gold; ctx.shadowBlur = 16;
      ctx.fillStyle = C.gold;
      ctx.beginPath(); ctx.arc(ox, oy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(ox, oy, 12, 0, Math.PI * 2);
      ctx.strokeStyle = C.gold; ctx.globalAlpha = 0.28; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif';
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(DE ? "3 von " + tokens.length + " Value-Vektoren → Mischung r" : "3 of " + tokens.length + " value vectors → mixture r", 12, 8);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText(DE ? (w > 560 ? "2-Simplex · Ausschnitt aus " + (tokens.length - 1) + "-Simplex" : "2-Simplex · " + (tokens.length - 1) + "D") : (w > 560 ? "2-simplex · slice of " + (tokens.length - 1) + "-simplex" : "2-simplex · " + (tokens.length - 1) + "D"), w - 12, 8);
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillStyle = C.muted;
      var cornerNames = ids.map(function (id) { return tokens[id]; }).join(", ");
      ctx.fillText(DE ? "Der volle Simplex hat " + tokens.length + " Ecken und " + (tokens.length - 1) + " Dimensionen." : "The full simplex has " + tokens.length + " corners and " + (tokens.length - 1) + " dimensions.", w / 2, h - 36);
      ctx.fillText(DE ? "Ecken: v_j = W_V x_j von " + cornerNames + " · 3 von " + tokens.length : "corners: v_j = W_V x_j of " + cornerNames + " · 3 of " + tokens.length, w / 2, h - 22);
      ctx.fillText(DE ? "Punkt ziehen = α aus Q,K · Ecken ziehen = V · Σ α_j = 1" : "drag point = α from Q,K · drag corners = V · Σ α_j = 1", w / 2, h - 8);
      function fmt2(v) { return v.toFixed(2).replace(".", DE ? "," : "."); }
      var rawTxt = raw.map(fmt2).join(" · ");
      var normTxt = ws.map(fmt2).join(" · ");
      var pctTxt = ws.map(function (v) { return (v * 100).toFixed(0) + "%"; }).join(" · ");
      setPercent('<span class="ls-qkv-percent-lead">' + (DE ? "Drei von " + tokens.length + " Gewichten α aus Q,K, auf 100 % normiert:" : "Three of " + tokens.length + " weights α from Q,K, normalised to 100%:") + '</span>' +
        '<span><b>' + (DE ? "α roh" : "raw α") + '</b> ' + rawTxt + ' <i>Σ ' + fmt2(sum) + '</i></span>' +
        '<span><b>÷ Σ</b> ' + normTxt + ' <i>Σ ' + (DE ? "1,00" : "1.00") + '</i></span>' +
        '<span><b>× 100</b> ' + pctTxt + ' <i>Σ 100%</i></span>');
      setReadout(ids.map(function (id, i) {
        return '<span><b>v(' + api.esc(tokens[id]) + ')</b> ' + (ws[i] * 100).toFixed(1) + '%</span>';
      }).join("") + '<span><b>Σ</b> 100% · 3/' + tokens.length + '</span><span><b>r_i</b> ' + (DE ? "Mischung" : "mixture") + '</span>' + '<span class="ls-qkv-note">' + (DE ? "α hier direkt gezogen; im echten Head aus Q,K · W_O nach der Mischung · Zahlen illustrativ" : "α dragged directly here; in a real head from Q,K · W_O after the mixture · numbers illustrative") + '</span>');
      canvas.setAttribute("aria-label", DE ? "Attention als gewichtete Mischung: Die drei Ecken sind die gelernten Value-Vektoren v_j = W_V x_j von Tier, Straße und es; der Mischungspunkt r_i = Σ α_j v_j liegt in ihrem Dreieck. Die Gewichte α kommen aus Q und K; W_O bildet r_i danach auf die Head-Ausgabe ab." : "Attention as a weighted mixture: the three corners are the learned value vectors v_j = W_V x_j of animal, street, and it; the mixture point r_i = Σ α_j v_j lies inside their triangle. The weights α come from Q and K; W_O maps r_i to the head output afterwards.");
    }
    function graphLayout(w, h) {
      var n = tokens.length, cx = w / 2, cy = h / 2 + 4, R = Math.min(w, h) * 0.36;
      return tokens.map(function (tok, i) {
        var a = -Math.PI / 2 + (i - query) * Math.PI * 2 / n;
        return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, a: a, i: i };
      });
    }
    function segDist(px, py, ax, ay, bx, by) {
      var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
      var t = L ? clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1) : 0;
      return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
    }
    function graphLabel(ctx, text, x, y, align, color, w, h) {
      ctx.font = '600 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      var tw = ctx.measureText(text).width;
      var lx = clamp(x, tw / 2 + 4, w - tw / 2 - 4);
      var ly = clamp(y, 12, h - 12);
      ctx.fillStyle = "rgba(255,255,255,.90)";
      ctx.fillRect(lx - tw / 2 - 3, ly - 7, tw + 6, 14);
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, lx, ly);
    }
    function drawGraph(now) {
      if (!size) return;
      now = now || performance.now();
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.5, h * 0.45, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
      bg.addColorStop(0, "rgba(247,250,249,.98)");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      V.grid(ctx, w, h, C, 30, 0.10);
      var nodes = graphLayout(w, h);
      var q = nodes[query];
      var col = head === 0 ? C.green : C.blue;
      // complete topology, very faint: every pair is connected
      ctx.lineWidth = 0.6;
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          ctx.strokeStyle = "rgba(0,75,111,.045)";
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
        }
      }
      ctx.strokeStyle = V.alpha(C.petrol, 0.18);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(w / 2, h / 2 + 4, Math.min(w, h) * 0.36, 0, Math.PI * 2); ctx.stroke();
      // query edges, strength = softmax weight
      nodes.forEach(function (node) {
        if (node.i === query) return;
        var a = weights[node.i];
        var hot = graphHover === node.i;
        ctx.strokeStyle = V.alpha(hot ? C.gold : col, 0.06 + 0.30 * a + (hot ? 0.22 : 0));
        ctx.lineWidth = 5 + 18 * a + (hot ? 4 : 0);
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(node.x, node.y); ctx.stroke();
        ctx.strokeStyle = V.alpha(hot ? C.gold : col, 0.15 + 0.80 * a);
        ctx.lineWidth = 0.7 + 8 * a + (hot ? 1.4 : 0);
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(node.x, node.y); ctx.stroke();
        var dx = node.x - q.x, dy = node.y - q.y, len = Math.hypot(dx, dy) || 1;
        if (a > 0.10) {
          var ux = dx / len, uy = dy / len;
          var tipX = node.x - ux * 13, tipY = node.y - uy * 13;
          ctx.fillStyle = hot ? C.gold : V.alpha(col, 0.55 + 0.35 * a);
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(tipX - ux * 7 - uy * 4, tipY - uy * 7 + ux * 4);
          ctx.lineTo(tipX - ux * 7 + uy * 4, tipY - uy * 7 - ux * 4);
          ctx.closePath(); ctx.fill();
        }
        if (!reduced && a > 0.08) {
          for (var k = 0; k < 2; k++) {
            var u = ((now / 1150) + node.i * 0.17 + k * 0.5) % 1;
            ctx.globalAlpha = 0.10 + 0.55 * (1 - u);
            ctx.fillStyle = hot ? C.gold : col;
            ctx.beginPath(); ctx.arc(q.x + dx * u, q.y + dy * u, 1.8 + a * 2, 0, Math.PI * 2); ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
      });
      // nodes and weight rings
      nodes.forEach(function (node) {
        var isQ = node.i === query;
        var a = isQ ? 1 : weights[node.i];
        if (!isQ) {
          ctx.strokeStyle = V.alpha(col, 0.30 + 0.55 * a);
          ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.arc(node.x, node.y, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * a); ctx.stroke();
        }
        if (isQ) {
          ctx.save();
          ctx.shadowColor = V.alpha(C.green, 0.55); ctx.shadowBlur = 18;
          ctx.beginPath(); ctx.arc(node.x, node.y, 14, 0, Math.PI * 2); ctx.fillStyle = V.alpha(C.green, 0.18); ctx.fill();
          ctx.restore();
        }
        ctx.beginPath(); ctx.arc(node.x, node.y, isQ ? 9 : 7, 0, Math.PI * 2);
        ctx.fillStyle = isQ ? C.green : C.paper;
        ctx.fill();
        ctx.strokeStyle = isQ ? C.paper : C.petrol;
        ctx.lineWidth = isQ ? 2 : 1.3;
        ctx.stroke();
        var label = tokens[node.i] + (isQ ? (DE ? " · Q" : " · Q") : "");
        var lx = node.x + Math.cos(node.a) * 25;
        var ly = node.y + Math.sin(node.a) * 25;
        graphLabel(ctx, label, lx, ly, Math.cos(node.a) > 0.25 ? "left" : Math.cos(node.a) < -0.25 ? "right" : "center", isQ ? C.green : C.ink, w, h);
      });
      // hover overlay
      if (graphHover >= 0) {
        var tIdx = graphHover;
        var text = tIdx === query
          ? (DE ? "Query es · verteilt 100% auf alle Tokens" : "query it · distributes 100% over all tokens")
          : (DE ? tokens[query] + " → " + tokens[tIdx] + "  " + (weights[tIdx] * 100).toFixed(1) + "%" : tokens[query] + " → " + tokens[tIdx] + "  " + (weights[tIdx] * 100).toFixed(1) + "%");
        ctx.font = '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif';
        var tw = ctx.measureText(text).width;
        var bx = clamp(graphMouse.x + 14, 6, w - tw - 24);
        var by = clamp(graphMouse.y + 14, 6, h - 30);
        ctx.save();
        ctx.shadowColor = "rgba(0,75,111,.18)"; ctx.shadowBlur = 12;
        ctx.fillStyle = "rgba(255,255,255,.96)";
        ctx.fillRect(bx, by, tw + 18, 26);
        ctx.restore();
        ctx.strokeStyle = tIdx === query ? C.green : C.gold;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(bx + 0.5, by + 0.5, tw + 17, 25);
        ctx.fillStyle = C.petrol;
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText(text, bx + 9, by + 13);
      }
      // headings and legend
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif';
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(DE ? "Attention als Graph" : "Attention as a graph", 12, 7);
      ctx.textAlign = "right";
      ctx.fillStyle = col;
      ctx.font = '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Barlow", sans-serif';
      ctx.fillText(head === 0 ? (DE ? "Head 1 · Wer?" : "Head 1 · who?") : (DE ? "Head 2 · Wo?" : "Head 2 · where?"), w - 12, 7);
      setPercent('<span class="ls-qkv-percent-lead">' + (DE ? "Vollverbunden:" : "Fully connected:") + '</span><span>' + (DE ? "jedes Token kann auf jedes andere schauen." : "every token can attend to every other token.") + '</span><span><b>' + tokens.length + '</b> ' + (DE ? "Knoten" : "nodes") + '</span>');
      var top = tokens.map(function (tok, i) { return { tok: tok, w: i === query ? -1 : weights[i] }; }).sort(function (a, b) { return b.w - a.w; }).slice(0, 3);
      setReadout('<span><b>Query</b> ' + (DE ? "es" : "it") + '</span><span><b>' + (DE ? "verbunden" : "connected") + '</b> ' + tokens.length + '/' + tokens.length + '</span>' + top.map(function (x) { return '<span><b>' + api.esc(x.tok) + '</b> ' + (x.w * 100).toFixed(1) + '%</span>'; }).join(""));
      canvas.setAttribute("aria-label", DE ? "Attention als vollverbundener Graph: alle Token im Kreis, Kanten von der Query es zu jedem Token mit unterschiedlicher Stärke. Fahre über eine Kante, um Verbindung und Prozentwert zu sehen." : "Attention as a fully connected graph: all tokens in a circle, edges from the query it to every token with different strength. Hover an edge to see the connection and percentage.");
    }
    function normalizeWeights() {
      var sum = weights.reduce(function (a, b) { return a + b; }, 0);
      if (!isFinite(sum) || sum <= 1e-9) {
        weights = tokens.map(function () { return 1 / tokens.length; });
      } else if (Math.abs(sum - 1) > 1e-9) {
        weights = weights.map(function (w) { return w / sum; });
      }
    }
    function draw() {
      normalizeWeights();
      if (!size) return;
      if (view === "simplex") drawSimplex();
      else if (view === "graph") drawGraph(performance.now());
      else drawArcs();
      canvas.__lsQkv = { view: view, head: head, weights: weights.slice(), simplex: simplexGeom ? { ids: simplexGeom.ids.slice(), ox: simplexGeom.ox, oy: simplexGeom.oy, verts: simplexGeom.verts.map(function (v) { return { x: v.x, y: v.y }; }) } : null };
    }
    function setView(v) {
      if (v !== "arcs" && v !== "simplex" && v !== "graph") return;
      if (v === view) return;
      var order = { arcs: 0, graph: 1, simplex: 2 };
      var dir = order[v] < order[view] ? -1 : 1;
      function apply() {
        if (v !== "simplex") endSimplexDrag();
        view = v;
        graphHover = -1;
        arcHover = -1;
        pinnedToken = -1;
        hideTip();
        el.querySelectorAll("[data-view]").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-view") === view); });
        draw();
      }
      if (V && V.crossfadeCanvas) V.crossfadeCanvas(canvas, apply, { dir: dir, duration: 280 });
      else apply();
    }
    function loop() {
      if (!running) return;
      if (view !== "simplex") draw();
      loopRaf = requestAnimationFrame(loop);
    }
    function resize() { size = api.fit(canvas, stage); simplexVerts = null; simplexCorner = -1; simplexDrag = false; draw(); }
    el.querySelectorAll("[data-head]").forEach(function (b) {
      b.addEventListener("click", function () { setHead(parseInt(b.getAttribute("data-head"), 10)); });
    });
    el.querySelectorAll("[data-view]").forEach(function (b) {
      b.addEventListener("click", function () { setView(b.getAttribute("data-view")); });
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!size) return;
      if (view === "arcs") {
        var ar = canvas.getBoundingClientRect();
        var ax = e.clientX - ar.left, ay = e.clientY - ar.top;
        var found = -1;
        arcHits.forEach(function (h) { if (ax >= h.x && ax <= h.x + h.w && ay >= h.y && ay <= h.y + h.h) found = h.i; });
        arcHover = found;
        canvas.style.cursor = found >= 0 ? "pointer" : "default";
        if (found >= 0) showTip(found, ax, ay);
        else if (pinnedToken < 0) hideTip();
        return;
      }
      if (view !== "graph") return;
      var r = canvas.getBoundingClientRect();
      graphMouse = { x: e.clientX - r.left, y: e.clientY - r.top };
      var nodes = graphLayout(size.w, size.h);
      var best = -1, bestD = 1e9;
      nodes.forEach(function (node) {
        var d = Math.hypot(graphMouse.x - node.x, graphMouse.y - node.y);
        if (d < 15 && d < bestD) { bestD = d; best = node.i; }
      });
      if (best < 0) {
        nodes.forEach(function (node) {
          if (node.i === query) return;
          var d = segDist(graphMouse.x, graphMouse.y, nodes[query].x, nodes[query].y, node.x, node.y);
          if (d < 8 && d < bestD) { bestD = d; best = node.i; }
        });
      }
      graphHover = best;
      draw();
    });
    canvas.addEventListener("pointerleave", function () {
      graphHover = -1;
      arcHover = -1;
      if (pinnedToken < 0) hideTip();
      if (!simplexDrag) canvas.style.cursor = "default";
      draw();
    });
    canvas.addEventListener("pointerdown", function (e) {
      if (!size) return;
      if (view === "arcs") {
        var ar = canvas.getBoundingClientRect();
        var ax = e.clientX - ar.left, ay = e.clientY - ar.top;
        var found = -1;
        arcHits.forEach(function (h) { if (ax >= h.x && ax <= h.x + h.w && ay >= h.y && ay <= h.y + h.h) found = h.i; });
        if (found >= 0) {
          pinnedToken = pinnedToken === found ? -1 : found;
          if (pinnedToken >= 0) showTip(found, ax, ay); else hideTip();
          return;
        }
      }
      if (view !== "simplex") return;
      var r = canvas.getBoundingClientRect();
      var px = e.clientX - r.left, py = e.clientY - r.top;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      var corner = nearCorner(px, py);
      if (corner >= 0) {
        simplexCorner = corner;
        simplexDrag = false;
        canvas.style.cursor = "move";
        if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }
        return;
      }
      if (!simplexInside(px, py)) return;
      simplexCorner = -1;
      simplexDrag = true;
      canvas.style.cursor = "grabbing";
      if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }
      setSimplexFromPoint(px, py);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (view !== "simplex" || !size) return;
      var r = canvas.getBoundingClientRect();
      var px = e.clientX - r.left, py = e.clientY - r.top;
      if (simplexCorner >= 0 && simplexGeom) {
        var test = simplexGeom.verts.map(function (v) { return { x: v.x, y: v.y }; });
        test[simplexCorner] = { x: clamp(px, 26, size.w - 26), y: clamp(py, 26, size.h - 26) };
        if (triangleArea(test[0], test[1], test[2]) > 1800) {
          simplexGeom.verts[simplexCorner].x = test[simplexCorner].x;
          simplexGeom.verts[simplexCorner].y = test[simplexCorner].y;
          draw();
        }
      } else if (simplexDrag) {
        setSimplexFromPoint(px, py);
      } else {
        canvas.style.cursor = nearCorner(px, py) >= 0 ? "move" : (simplexInside(px, py) ? "grab" : "default");
      }
    });
    canvas.addEventListener("pointerup", endSimplexDrag);
    canvas.addEventListener("pointercancel", endSimplexDrag);
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    renderVectors();
    resize();
    if (!reduced) loopRaf = requestAnimationFrame(loop);
    return {
      update: function (s) {
        if (!s) return;
        if (s.view) setView(s.view);
        if (typeof s.head === "number") setHead(s.head ? 1 : 0);
      },
      resize: resize,
      pause: function () { running = false; if (loopRaf) cancelAnimationFrame(loopRaf); loopRaf = 0; },
      resume: function () { if (!running && !reduced) { running = true; loopRaf = requestAnimationFrame(loop); } else running = true; },
      destroy: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        if (loopRaf) cancelAnimationFrame(loopRaf);
        window.removeEventListener("resize", resize);
        el.remove();
      }
    };
  }
  core.register("qkv", qkvScene);
})();
