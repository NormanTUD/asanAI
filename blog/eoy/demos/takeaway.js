(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function takeawayScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-tk-scene";
    el.innerHTML =
      '<div class="ls-tk-stage" data-tip="' + (DE ? "Die sechs Schritte der Verarbeitung als Raster; jeder Schritt hat ein eigenes Panel." : "The six processing steps as a grid; each step has its own panel.") + '"><canvas class="ls-tk-canvas" data-tip="' + (DE ? "Schematische Animation: vom Text über Tokens und Vektoren bis zur Token-Verteilung." : "Schematic animation: from text through tokens and vectors to the token distribution.") + '" role="img" aria-label="' +
        (DE ? "Animation: Text wird zu Tokens, Vektoren, Attention, FFN und einer Verteilung über das nächste Token." : "Animation: text becomes tokens, vectors, attention, FFN, and a distribution over the next token.") +
      '"></canvas></div>' +
      '<div class="ls-tk-summary">' +
        '<article data-tip="' + (DE ? "Erster Schritt: Text zerlegen und Tokens in gelernte Vektoren übersetzen." : "First step: split text and map tokens into learned vectors.") + '"><span>01</span><b>' + (DE ? "Zeichen → Bedeutung" : "Signs → meaning") + '</b><p>' + (DE ? "Text wird zu Tokens, Tokens zu gelernten Vektoren. Bedeutung wird Geometrie." : "Text becomes tokens, tokens become learned vectors. Meaning becomes geometry.") + '</p></article>' +
        '<article data-tip="' + (DE ? "Zweiter Schritt: Attention mischt Kontext, das FFN verschiebt die Vektoren." : "Second step: attention mixes context and the FFN shifts the vectors.") + '"><span>02</span><b>' + (DE ? "Bedeutung → Kontext" : "Meaning → context") + '</b><p>' + (DE ? "Attention mischt den Kontext, das FFN verschiebt die Punkte, der Residualstrom trägt alles weiter." : "Attention mixes context, the FFN shifts the points, the residual stream carries everything forward.") + '</p></article>' +
        '<article data-tip="' + (DE ? "Dritter Schritt: aus der Verteilung über das nächste Token folgt die Ausgabe." : "Third step: the output follows from the distribution over the next token.") + '"><span>03</span><b>' + (DE ? "Kontext → Wirkung" : "Context → impact") + '</b><p>' + (DE ? "Am Ende steht eine Verteilung über das nächste Token; daraus wird Text, Verhalten und Verantwortung." : "At the end stands a distribution over the next token; from it come text, behaviour, and responsibility.") + '</p></article>' +
      '</div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-tk-stage");
    var canvas = el.querySelector(".ls-tk-canvas");
    var C = api.colors();
    var reduce = !!api.reducedMotion;
    var size = null, ctx = null, raf = 0, start = performance.now(), paused = false;
    var labels = DE
      ? ["Text", "Tokens", "Vektoren", "Attention", "FFN", "Verteilung"]
      : ["Text", "Tokens", "Vectors", "Attention", "FFN", "Distribution"];
    var words = DE ? ["Es", "war", "einmal", "ein", "…"] : ["Once", "upon", "a", "time", "…"];
    function roundRect(c, x, y, w, h, r) {
      if (w <= 0 || h <= 0) return;
      var rr = Math.max(0, Math.min(r, w / 2, h / 2));
      c.beginPath();
      c.moveTo(x + rr, y);
      c.arcTo(x + w, y, x + w, y + h, rr);
      c.arcTo(x + w, y + h, x, y + h, rr);
      c.arcTo(x, y + h, x, y, rr);
      c.arcTo(x, y, x + w, y, rr);
      c.closePath();
    }
    function fit() {
      size = api.fit(canvas, canvas);
      ctx = size.ctx;
      drawFrame(performance.now());
    }
    function font(px, weight) { return (weight || 600) + " " + Math.max(8, Math.round(px)) + 'px "Open Sans", sans-serif'; }
    function panelBg(x, y, w, h) {
      roundRect(ctx, x, y, w, h, 8);
      ctx.fillStyle = C.paper || "#fff";
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    function panelLabel(index, x, y, w) {
      ctx.fillStyle = C.petrol;
      ctx.font = font(api.font("canvas-sm") * 0.86, 700);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("0" + (index + 1) + "  " + labels[index].toUpperCase(), x + 10, y + 8);
    }
    function drawText(x, y, w, h, t, active) {
      var cx = x + w / 2, cy = y + h / 2 + 6;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = font(api.font("canvas") * 1.02, 600);
      ctx.fillStyle = C.ink;
      var text = DE ? "Es war einmal ein" : "Once upon a time";
      ctx.fillText(text, cx, cy);
      var tw = ctx.measureText(text).width;
      var last = DE ? "ein" : "time";
      var lw = ctx.measureText(last).width;
      ctx.fillStyle = C.green;
      ctx.globalAlpha = 0.16;
      roundRect(ctx, cx + tw / 2 - lw - 4, cy - 15, lw + 8, 30, 5);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.petrol;
      ctx.fillText(text, cx, cy);
    }
    function drawTokens(x, y, w, h, t, active) {
      var pad = 14, gap = 5;
      var cw = (w - pad * 2 - gap * (words.length - 1)) / words.length;
      var colors = [C.green, C.blue, C.gold, C.lilac, C.green];
      words.forEach(function (word, i) {
        var bx = x + pad + i * (cw + gap);
        var by = y + h / 2 - 16;
        roundRect(ctx, bx, by, cw, 32, 5);
        ctx.fillStyle = C.paper || "#fff";
        ctx.fill();
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.fillStyle = colors[i % colors.length];
        ctx.font = font(api.font("canvas-sm") * 0.9, 700);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(word, bx + cw / 2, by + 16);
      });
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + pad, y + h - 20);
      ctx.lineTo(x + w - pad, y + h - 20);
      ctx.stroke();
    }
    function dot(cx, cy, r, color) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    function drawVectors(x, y, w, h, t, active) {
      var cx = x + w / 2, cy = y + h / 2 + 8;
      var pts = [[-0.34, 0.16], [-0.12, 0.3], [0.05, 0.06], [0.3, 0.26], [0.44, -0.05], [-0.28, -0.16], [0.16, -0.22]];
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 16, cy); ctx.lineTo(x + w - 12, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, y + 30); ctx.lineTo(cx, y + h - 12); ctx.stroke();
      pts.forEach(function (p, i) {
        var px = cx + p[0] * w * 0.82;
        var py = cy - p[1] * h * 0.82;
        dot(px, py, i === 3 ? 4.5 : 3.2, i === 3 ? C.green : (i % 2 ? C.blue : C.petrol));
      });
    }
    function drawAttention(x, y, w, h, t, active) {
      var cx = x + w / 2, cy = y + h / 2 + 8;
      var R = Math.min(w, h) * 0.29;
      var pts = [];
      for (var i = 0; i < 6; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 3;
        pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
      }
      for (var j = 1; j < 6; j++) {
        var alpha = 0.18 + 0.06 * (j % 3);
        ctx.strokeStyle = C.blue;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[j][0], pts[j][1]); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      pts.forEach(function (p, i) { dot(p[0], p[1], i === 0 ? 5 : 3.6, i === 0 ? C.green : C.petrol); });
    }
    function drawFFN(x, y, w, h, t, active) {
      var cx = x + w / 2, cy = y + h / 2 + 8;
      var left = [[-0.36, -0.18], [-0.36, 0], [-0.36, 0.18]];
      var right = [[0.36, -0.28], [0.36, 0], [0.36, 0.28]];
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - 34, cy - 34); ctx.lineTo(cx + 34, cy - 34); ctx.stroke();
      left.forEach(function (p, i) {
        right.forEach(function (q, j) {
          ctx.globalAlpha = 0.12 + 0.04 * ((i + j) % 3);
          ctx.strokeStyle = C.lilac;
          ctx.beginPath();
          ctx.moveTo(cx + p[0] * w * 0.9, cy + p[1] * h * 0.9);
          ctx.lineTo(cx + q[0] * w * 0.9, cy + q[1] * h * 0.9);
          ctx.stroke();
        });
      });
      ctx.globalAlpha = 1;
      left.forEach(function (p, i) { dot(cx + p[0] * w * 0.9, cy + p[1] * h * 0.9, 3.8, C.blue); });
      right.forEach(function (p, i) { dot(cx + p[0] * w * 0.9, cy + p[1] * h * 0.9, 3.8, C.green); });
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy + 38);
      ctx.quadraticCurveTo(cx, cy + 12, cx + 30, cy + 38);
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.font = font(api.font("canvas-sm") * 0.8, 700);
      ctx.textAlign = "center";
      ctx.fillText("+ x", cx, cy + 58);
    }
    function drawDistribution(x, y, w, h, t, active) {
      var names = DE ? ["Katze", "Hund", "Maus", "Pferd", "…"] : ["cat", "dog", "mouse", "horse", "…"];
      var probs = [0.18, 0.62, 0.09, 0.06, 0.05];
      var pad = 16;
      var top = y + 40;
      var bottom = y + h - 34;
      var maxH = Math.max(28, bottom - top);
      var bw = (w - pad * 2 - 4 * 4) / 5;
      var chosen = 1;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = font(api.font("canvas-sm") * 0.78, 600);
      ctx.fillStyle = C.muted;
      var prefix = DE ? "Es war einmal ein" : "Once upon a time a";
      var px = x + pad;
      ctx.textAlign = "left";
      ctx.fillStyle = C.soft;
      ctx.fillText(prefix, px, y + 26);
      var prefW = ctx.measureText(prefix).width;
      ctx.fillStyle = C.green;
      ctx.font = font(api.font("canvas-sm") * 0.9, 700);
      ctx.fillText(names[chosen], px + prefW + 4, y + 26);
      var endX = px + prefW + 4 + ctx.measureText(names[chosen]).width;
      probs.forEach(function (p, i) {
        var bh = maxH * (p / 0.62);
        var bx = x + pad + i * (bw + 4);
        var by = bottom - bh;
        roundRect(ctx, bx, by, bw, bh, 3);
        ctx.fillStyle = i === chosen ? C.green : [C.blue, C.petrol, C.lilac, C.gold][i % 4];
        ctx.globalAlpha = i === chosen ? 0.92 : 0.46;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = i === chosen ? C.green : C.muted;
        ctx.font = font(api.font("canvas-sm") * 0.72, 700);
        ctx.textAlign = "center";
        ctx.fillText(Math.round(p * 100) + "%", bx + bw / 2, by - 7);
        ctx.fillStyle = i === chosen ? C.petrol : C.muted;
        ctx.font = font(api.font("canvas-sm") * 0.68, 600);
        ctx.fillText(names[i], bx + bw / 2, bottom + 9);
      });
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + pad - 4, bottom); ctx.lineTo(x + w - pad + 4, bottom); ctx.stroke();
      var chosenX = x + pad + chosen * (bw + 4) + bw / 2;
      ctx.strokeStyle = C.green;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(chosenX, bottom - maxH * (probs[chosen] / 0.62) - 12);
      ctx.quadraticCurveTo((chosenX + endX) / 2, y + 12, endX + 3, y + 24);
      ctx.stroke();
      ctx.setLineDash([]);

    }
    function drawFrame(now) {
      if (!size || !ctx || size.w < 40 || size.h < 40) return;
      var t = (now - start) / 1000;
      ctx.clearRect(0, 0, size.w, size.h);
      var cols = 3, rows = 2, gap = 8, pad = 4;
      var pw = (size.w - pad * 2 - gap * (cols - 1)) / cols;
      var ph = (size.h - pad * 2 - gap * (rows - 1) - 18) / rows;
      var drawFns = [drawText, drawTokens, drawVectors, drawAttention, drawFFN, drawDistribution];
      for (var i = 0; i < 6; i++) {
        var x = pad + (i % cols) * (pw + gap);
        var y = pad + Math.floor(i / cols) * (ph + gap);
        panelBg(x, y, pw, ph);
        panelLabel(i, x, y, pw);
        drawFns[i](x, y, pw, ph, 0, false);
      }
    }
    function loop(now) {
      raf = 0;
      if (paused) return;
      drawFrame(now);
      raf = requestAnimationFrame(loop);
    }
    function startLoop() {
      if (reduce || raf || paused) return;
      raf = requestAnimationFrame(loop);
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { fit(); }); ro.observe(stage); }
    window.addEventListener("resize", fit);
    function onTheme() { C = api.colors(); drawFrame(performance.now()); }
    window.addEventListener("tm:theme", onTheme);
    fit();
    startLoop();
    return {
      update: function () {},
      resize: fit,
      pause: function () { paused = true; if (raf) cancelAnimationFrame(raf); raf = 0; },
      resume: function () { paused = false; startLoop(); },
      destroy: function () {
        paused = true;
        if (raf) cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        window.removeEventListener("resize", fit);
        window.removeEventListener("tm:theme", onTheme);
        el.remove();
      }
    };
  }
  core.register("takeaway", takeawayScene);
})();
