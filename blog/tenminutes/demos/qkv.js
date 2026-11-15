(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function qkvScene(root, api) {
    var DE = api.lang === "de";
    var tokens = ["The", "animal", "did", "not", "cross", "the", "street", "because", "it", "was", "too", "tired"];
    var query = 8;
    function norm(a) { var s = a.reduce(function (x, y) { return x + y; }, 0); return a.map(function (v) { return v / s; }); }
    var W = [
      norm([0.01, 0.52, 0.01, 0.01, 0.03, 0.01, 0.10, 0.03, 0.16, 0.03, 0.01, 0.08]),
      norm([0.02, 0.08, 0.01, 0.01, 0.04, 0.02, 0.55, 0.03, 0.10, 0.04, 0.02, 0.08])
    ];
    var head = 0, weights = W[0].slice(), prev = W[0].slice();
    var t = 1, start = 0, raf = 0, loopRaf = 0, running = true;
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var el = document.createElement("div");
    el.className = "ls-qkv-scene";
    el.innerHTML =
      '<div class="ls-qkv-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-qkv-controls">' +
        '<span class="ls-qkv-query">' + (DE ? "Query" : "query") + ' <b>it</b></span>' +
        '<button type="button" class="ls-chip is-on" data-head="0">' + (DE ? "Head 1 · Wer?" : "Head 1 · who?") + '</button>' +
        '<button type="button" class="ls-chip" data-head="1">' + (DE ? "Head 2 · Wo?" : "Head 2 · where?") + '</button>' +
      '</div>' +
      '<div class="ls-qkv-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-qkv-stage");
    var canvas = el.querySelector("canvas");
    var readout = el.querySelector(".ls-qkv-readout");
    var size = null, ctx = null;
    var C = api.colors();
    function setHead(h) {
      if (h === head) return;
      prev = weights.slice();
      head = h;
      start = performance.now();
      t = 0;
      el.querySelectorAll("[data-head]").forEach(function (b) {
        b.classList.toggle("is-on", parseInt(b.getAttribute("data-head"), 10) === head);
      });
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
      var y = 30;
      return { w: w, h: h, pad: pad, gap: gap, bw: bw, bh: bh, y: y };
    }
    function draw() {
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
        var lift = Math.min(72, 28 + Math.abs(qx - x) * 0.22);
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
        }
      });
      // value particles travel from key to query
      if (!reduced) {
        var now = performance.now();
        tokens.forEach(function (tok, i) {
          if (i === query || weights[i] < 0.10) return;
          var x = centers[i];
          var mx = (qx + x) / 2;
          var lift = Math.min(72, 28 + Math.abs(qx - x) * 0.22);
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
      var base = y + bh + 82;
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
      // readout top weights
      var top = tokens.map(function (tok, i) { return { tok: tok, w: weights[i] }; })
        .filter(function (x, i) { return i !== query; })
        .sort(function (a, b) { return b.w - a.w; }).slice(0, 3);
      readout.innerHTML = top.map(function (x) {
        return '<span><b>' + api.esc(x.tok) + '</b> ' + (x.w * 100).toFixed(1) + '%</span>';
      }).join("");
      canvas.setAttribute("aria-label", DE
        ? "Attention-Gewichte von „it“ zu den Tokens. " + top.map(function (x) { return x.tok + ": " + (x.w * 100).toFixed(1) + "%"; }).join(", ")
        : "Attention weights from “it” to the tokens. " + top.map(function (x) { return x.tok + ": " + (x.w * 100).toFixed(1) + "%"; }).join(", "));
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
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    if (!reduced) loopRaf = requestAnimationFrame(loop);
    return {
      update: function (s) { if (s && typeof s.head === "number") setHead(s.head ? 1 : 0); },
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
