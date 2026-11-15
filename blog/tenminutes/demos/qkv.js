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
    var simplexTrail = [];
    var graphHover = -1, graphMouse = { x: 0, y: 0 };
    var t = 1, start = 0, raf = 0, loopRaf = 0, running = true;
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var el = document.createElement("div");
    el.className = "ls-qkv-scene";
    el.innerHTML =
      '<div class="ls-qkv-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-qkv-vectors" aria-hidden="true"></div>' +
      '<div class="ls-qkv-controls">' +
        '<button type="button" class="ls-chip is-on" data-head="0">' + (DE ? "Head 1 · Wer?" : "Head 1 · who?") + '</button>' +
        '<button type="button" class="ls-chip" data-head="1">' + (DE ? "Head 2 · Wo?" : "Head 2 · where?") + '</button>' +
        '<span class="ls-qkv-view"><button type="button" class="ls-chip is-on" data-view="arcs">' + (DE ? "Bögen" : "Arcs") + '</button><button type="button" class="ls-chip" data-view="simplex">Simplex</button><button type="button" class="ls-chip" data-view="graph">' + (DE ? "Graph" : "Graph") + '</button></span>' +
        '<span class="ls-qkv-query">' + (DE ? "Query" : "query") + ' <b>' + (DE ? "es" : "it") + '</b></span>' +
      '</div>' +
      '<div class="ls-qkv-percent"></div>' +
      '<div class="ls-qkv-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-qkv-stage");
    var canvas = el.querySelector("canvas");
    var readout = el.querySelector(".ls-qkv-readout");
    var percentEl = el.querySelector(".ls-qkv-percent");
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
      // value particles travel from key to query
      if (!reduced) {
        var now = performance.now();
        tokens.forEach(function (tok, i) {
          if (i === query || weights[i] < 0.10) return;
          var x = centers[i];
          var mx = (qx + x) / 2;
          var lift = Math.min(60, 20 + Math.abs(qx - x) * 0.18, Math.max(8, y - 18));
          for (var k = 0; k < 2; k++) {
            var u = ((now / 1100) + i * 0.13 + k * 0.5) % 1;
            var px = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * mx + u * u * qx;
            var py = (1 - u) * (1 - u) * (y - 2) + 2 * (1 - u) * u * (y - lift) + u * u * (qy - 2);
            ctx.globalAlpha = 0.15 + 0.55 * (1 - u);
            ctx.fillStyle = C.gold;
            ctx.beginPath(); ctx.arc(px, py, 2.4, 0, Math.PI * 2); ctx.fill();
          }
        });
        ctx.globalAlpha = 1;
      }
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
      });
      // weight bars
      var base = y + bh + 70;
      var maxBar = Math.max(34, h - base - 26);
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
    function drawSimplex() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h, now = performance.now();
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
      var verts = [
        { x: cx, y: cy - R },
        { x: cx - R * 0.94, y: cy + R * 0.62 },
        { x: cx + R * 0.94, y: cy + R * 0.62 }
      ];
      var cols = [C.green, C.sky, C.gold];
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
      if (!simplexTrail.length || Math.hypot(ox - simplexTrail[simplexTrail.length - 1].x, oy - simplexTrail[simplexTrail.length - 1].y) > 1.2) {
        simplexTrail.push({ x: ox, y: oy, t: now });
        if (simplexTrail.length > 26) simplexTrail.shift();
      }
      simplexTrail.forEach(function (p, i) {
        var age = now - p.t;
        if (age > 2200) return;
        ctx.globalAlpha = 0.18 * (1 - i / simplexTrail.length);
        ctx.fillStyle = C.gold;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      verts.forEach(function (v, i) {
        ctx.strokeStyle = cols[i]; ctx.globalAlpha = 0.40; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(v.x, v.y); ctx.lineTo(ox, oy); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
        for (var k = 0; k < 2; k++) {
          var u = ((now / 950) + i * 0.27 + k * 0.5) % 1;
          var px = v.x + (ox - v.x) * u, py = v.y + (oy - v.y) * u;
          ctx.globalAlpha = 0.18 + 0.55 * (1 - u);
          ctx.fillStyle = cols[i];
          ctx.beginPath(); ctx.arc(px, py, 2.1, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
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
      var pulse = 0.5 + 0.5 * Math.sin(now / 420);
      ctx.shadowColor = C.gold; ctx.shadowBlur = 18 + pulse * 8;
      ctx.fillStyle = C.gold;
      ctx.beginPath(); ctx.arc(ox, oy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + api.font("canvas-sm") + 'px "Barlow", sans-serif';
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(DE ? "3 Value-Vektoren → Ausgabe" : "3 value vectors → output", 12, 8);
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText(DE ? "2-Simplex (Dreieck)" : "2-simplex (triangle)", w - 12, 8);
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillStyle = C.muted;
      ctx.fillText(DE ? "Ecken: v_j = W_V x_j (gelernt) · Variablen: α_j" : "corners: v_j = W_V x_j (learned) · variables: α_j", w / 2, h - 22);
      ctx.fillText(DE ? "Ausgabe = Σ α_j v_j bleibt im Dreieck." : "output = Σ α_j v_j stays inside the triangle", w / 2, h - 8);
      function fmt2(v) { return v.toFixed(2).replace(".", DE ? "," : "."); }
      var rawTxt = raw.map(fmt2).join(" · ");
      var normTxt = ws.map(fmt2).join(" · ");
      var pctTxt = ws.map(function (v) { return (v * 100).toFixed(0) + "%"; }).join(" · ");
      setPercent('<span class="ls-qkv-percent-lead">' + (DE ? "So werden aus den Gewichten α Prozente:" : "How the weights α become percentages:") + '</span>' +
        '<span><b>' + (DE ? "α roh" : "raw α") + '</b> ' + rawTxt + ' <i>Σ ' + fmt2(sum) + '</i></span>' +
        '<span><b>÷ Σ</b> ' + normTxt + ' <i>Σ ' + (DE ? "1,00" : "1.00") + '</i></span>' +
        '<span><b>× 100</b> ' + pctTxt + ' <i>Σ 100%</i></span>');
      setReadout(ids.map(function (id, i) {
        return '<span><b>v(' + api.esc(tokens[id]) + ')</b> ' + (ws[i] * 100).toFixed(1) + '%</span>';
      }).join("") + '<span><b>Σ</b> 100%</span>');
      canvas.setAttribute("aria-label", DE ? "Attention als gewichtete Mischung: Die drei Ecken sind die gelernten Value-Vektoren der Tokens Tier, Straße und es; der Ausgabepunkt liegt in ihrem Dreieck." : "Attention as a weighted mixture: the three corners are the learned value vectors of the tokens animal, street, and it; the output point lies inside their triangle.");
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
    function draw() {
      if (!size) return;
      if (view === "simplex") drawSimplex();
      else if (view === "graph") drawGraph(performance.now());
      else drawArcs();
    }
    function setView(v) {
      if (v !== "arcs" && v !== "simplex" && v !== "graph") return;
      view = v;
      graphHover = -1;
      el.querySelectorAll("[data-view]").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-view") === view); });
      draw();
    }
    function loop() {
      if (!running) return;
      draw();
      loopRaf = requestAnimationFrame(loop);
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    el.querySelectorAll("[data-head]").forEach(function (b) {
      b.addEventListener("click", function () { setHead(parseInt(b.getAttribute("data-head"), 10)); });
    });
    el.querySelectorAll("[data-view]").forEach(function (b) {
      b.addEventListener("click", function () { setView(b.getAttribute("data-view")); });
    });
    canvas.addEventListener("pointermove", function (e) {
      if (view !== "graph" || !size) return;
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
    canvas.addEventListener("pointerleave", function () { graphHover = -1; draw(); });
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
