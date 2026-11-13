(function () {
  "use strict";

  window.UnembedScene = function (root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-unembed-scene";
    el.innerHTML =
      '<div class="ls-unembed-stage"><canvas class="ls-unembed-canvas" role="img"></canvas></div>' +
      '<div class="ls-unembed-controls">' +
        '<label class="ls-range ls-unembed-angle">' + (DE ? "Winkel" : "Angle") + ' <input type="range" min="5" max="135" step="1" value="38"><output>38°</output></label>' +
        '<div class="ls-unembed-nav">' +
          '<button type="button" class="ls-btn ls-btn--ghost ls-btn--tiny ls-unembed-prev" data-no-height-test="1">← ' + (DE ? "Zurück" : "Back") + '</button>' +
          '<span class="ls-unembed-progress" aria-live="polite"></span>' +
          '<button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-unembed-next" data-no-height-test="1">' + (DE ? "Weiter →" : "Next →") + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="ls-unembed-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-unembed-stage");
    var canvas = el.querySelector("canvas");
    var angleEl = el.querySelector(".ls-unembed-angle");
    var angleInput = angleEl.querySelector("input");
    var angleOut = angleEl.querySelector("output");
    var prevBtn = el.querySelector(".ls-unembed-prev");
    var nextBtn = el.querySelector(".ls-unembed-next");
    var progress = el.querySelector(".ls-unembed-progress");
    var readout = el.querySelector(".ls-unembed-readout");
    var C = api.colors();
    var size = null, ctx = null;
    var step = 0, angleDeg = 38;
    var fadeStart = 0, fadeDur = 260, softStart = 0, softDur = 620;
    var raf = 0;
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (reduced) { fadeDur = 0; softDur = 0; }
    var STEP_LABELS = DE
      ? ["Dot-Produkt", "Winkel", "W_U", "Softmax", "GPU"]
      : ["Dot product", "Angle", "W_U", "Softmax", "GPU"];
    var U = [0.82, 0.34];
    var V_LEN = 0.95;
    var H = [0.90, 0.35];
    var TOKENS = [
      { t: " the", w: [0.86, 0.50], c: "green" },
      { t: " Paris", w: [0.98, 0.08], c: "blue" },
      { t: " a", w: [0.20, 0.98], c: "sky" },
      { t: " city", w: [0.58, -0.82], c: "gold" },
      { t: " France", w: [-0.36, 0.93], c: "lilac" }
    ];
    var SORTED = TOKENS.map(function (row) {
      return { t: row.t, w: row.w, c: row.c, logit: V.dot(H, row.w) };
    }).sort(function (a, b) { return b.logit - a.logit; });
    var TEMP = 0.45;
    var PROBS = V.softmax(SORTED.map(function (row) { return row.logit; }), TEMP);
    var TOP = SORTED[0];
    var TOP_P = PROBS[0];

    function vecV() {
      var a = Math.atan2(U[1], U[0]) + V.rad(angleDeg);
      return [Math.cos(a) * V_LEN, Math.sin(a) * V_LEN];
    }
    function world(cx, cy, scale) {
      return function (p) { return { x: cx + p[0] * scale, y: cy - p[1] * scale }; };
    }
    function background(w, h) {
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, w, h);
      var g = ctx.createRadialGradient(w * 0.46, h * 0.42, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
      g.addColorStop(0, V.alpha(C.paper2, 0.72));
      g.addColorStop(0.62, V.alpha(C.paper, 0.28));
      g.addColorStop(1, V.alpha(C.paper, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      V.grid(ctx, w, h, C, 30, 0.18);
    }
    function header(w, alpha) {
      V.heading(ctx, (step + 1) + " / 5 · " + STEP_LABELS[step], 16, 16, C.muted, 10, alpha);
      var right = ["u · v = Σ uᵢvᵢ", "cos θ = (u·v) / (|u||v|)", "logits = W_U · h", "p = softmax(logits)", "N·L = h·w"][step];
      V.heading(ctx, right, w - 16, 16, C.petrol, 10, alpha);
    }
    function axesAt(origin, scale, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(origin.x - scale * 1.15, origin.y);
      ctx.lineTo(origin.x + scale * 1.15, origin.y);
      ctx.moveTo(origin.x, origin.y + scale * 1.05);
      ctx.lineTo(origin.x, origin.y - scale * 1.05);
      ctx.stroke();
      ctx.restore();
    }
    function dotStep(w, h, alpha) {
      var origin = { x: w * 0.37, y: h * 0.56 };
      var scale = Math.min(w * 0.29, h * 0.33);
      var to = world(origin.x, origin.y, scale);
      var v = vecV();
      var dot = V.dot(U, v);
      var projLen = dot / (V.norm(v) || 1);
      var proj = [V.unit(v)[0] * projLen, V.unit(v)[1] * projLen];
      axesAt(origin, scale, alpha);
      var o = to([0, 0]), uTip = to(U), vTip = to(v), pTip = to(proj);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(pTip.x, pTip.y);
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.globalAlpha = alpha * 0.32;
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(uTip.x, uTip.y);
      ctx.lineTo(pTip.x, pTip.y);
      ctx.stroke();
      ctx.restore();
      var aU = Math.atan2(U[1], U[0]);
      var aV = Math.atan2(v[1], v[0]);
      V.arc(ctx, o.x, o.y, scale * 0.38, -Math.max(aU, aV), -Math.min(aU, aV), C.gold, 1.8);
      V.arrow(ctx, o.x, o.y, uTip.x, uTip.y, C.blue, 3, 8);
      V.arrow(ctx, o.x, o.y, vTip.x, vTip.y, C.green, 3, 8);
      V.tokenChip(ctx, "u", uTip.x + 8, uTip.y - 8, C.blue, C, { alpha: alpha, size: 11 });
      V.tokenChip(ctx, "v", vTip.x + 8, vTip.y + 12, C.green, C, { alpha: alpha, size: 11 });
      V.heading(ctx, DE ? "Projektion von u auf v" : "projection of u onto v", (o.x + pTip.x) / 2, (o.y + pTip.y) / 2 - 14, C.gold, 10, alpha);
      var pad = 18;
      var font = '600 ' + Math.max(9, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = font;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.ink;
      ctx.fillText((DE ? "u = (" : "u = (") + V.fmt(U[0]) + ", " + V.fmt(U[1]) + ")", pad, h - 48);
      ctx.fillText((DE ? "v = (" : "v = (") + V.fmt(v[0]) + ", " + V.fmt(v[1]) + ")", pad, h - 30);
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + Math.max(10, api.font("canvas") - 1) + 'px "Barlow", sans-serif';
      ctx.fillText("u·v = " + V.fmt(U[0]) + "·" + V.fmt(v[0]) + " + " + V.fmt(U[1]) + "·" + V.fmt(v[1]) + " = " + V.fmt(dot), pad, h - 10);
      ctx.restore();
    }
    function angleStep(w, h, alpha) {
      var origin = { x: w * 0.38, y: h * 0.55 };
      var scale = Math.min(w * 0.30, h * 0.34);
      var to = world(origin.x, origin.y, scale);
      var v = vecV();
      var uu = V.unit(U), uv = V.unit(v);
      var dot = V.dot(U, v);
      var cos = dot / ((V.norm(U) * V.norm(v)) || 1);
      var theta = V.deg(Math.acos(V.clamp(cos, -1, 1)));
      var o = to([0, 0]);
      ctx.save();
      ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = C.lineStrong || C.line;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(o.x, o.y, scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      axesAt(origin, scale, alpha * 0.8);
      var uTip = to(uu), vTip = to(uv);
      var aU = Math.atan2(uu[1], uu[0]);
      var aV = Math.atan2(uv[1], uv[0]);
      V.arc(ctx, o.x, o.y, scale * 0.34, -Math.max(aU, aV), -Math.min(aU, aV), C.gold, 2.2);
      V.arrow(ctx, o.x, o.y, uTip.x, uTip.y, C.blue, 3, 8);
      V.arrow(ctx, o.x, o.y, vTip.x, vTip.y, C.green, 3, 8);
      V.tokenChip(ctx, DE ? "u / |u|" : "u / |u|", uTip.x + 8, uTip.y - 8, C.blue, C, { alpha: alpha, size: 10 });
      V.tokenChip(ctx, DE ? "v / |v|" : "v / |v|", vTip.x + 8, vTip.y + 12, C.green, C, { alpha: alpha, size: 10 });
      V.heading(ctx, "θ = " + V.fmt(theta, 1) + "°", o.x + scale * 0.46, o.y - scale * 0.20, C.gold, 15, alpha);
      var pad = 18;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.ink;
      ctx.font = '600 ' + Math.max(9, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif';
      ctx.fillText((DE ? "|u| = " : "|u| = ") + V.fmt(V.norm(U)) + "    |v| = " + V.fmt(V.norm(v)), pad, h - 48);
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + Math.max(10, api.font("canvas") - 1) + 'px "Barlow", sans-serif';
      ctx.fillText("cos θ = " + V.fmt(cos) + "     θ = arccos(" + V.fmt(cos) + ") = " + V.fmt(theta, 1) + "°", pad, h - 10);
      ctx.restore();
      V.label(ctx, DE ? "Länge ändert den Winkel nicht" : "length does not change the angle", origin.x, origin.y + scale * 1.18, {
        font: '600 ' + Math.max(9, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif',
        color: C.muted, align: "center", alpha: alpha, bg: false
      });
    }
    function wuStep(w, h, alpha) {
      var cx = w * 0.32, cy = h * 0.55;
      var scale = Math.min(w * 0.25, h * 0.32);
      var to = world(cx, cy, scale);
      var o = to([0, 0]);
      axesAt({ x: cx, y: cy }, scale, alpha * 0.7);
      SORTED.forEach(function (row, i) {
        var tip = to(row.w);
        var col = C[row.c] || C.blue;
        V.arrow(ctx, o.x, o.y, tip.x, tip.y, col, i === 0 ? 2.6 : 1.4, i === 0 ? 7 : 5);
        var align = row.w[0] < -0.1 ? "right" : "left";
        V.tokenChip(ctx, row.t, tip.x + (align === "right" ? -7 : 7), tip.y + (row.w[1] < -0.2 ? 12 : -8), col, C, { alpha: alpha, size: 10, align: align });
      });
      var hTip = to(H);
      V.arrow(ctx, o.x, o.y, hTip.x, hTip.y, C.petrol, 4, 10);
      V.tokenChip(ctx, "h", hTip.x + 8, hTip.y - 10, C.petrol, C, { alpha: alpha, size: 12 });
      var aH = Math.atan2(H[1], H[0]);
      var aTop = Math.atan2(TOP.w[1], TOP.w[0]);
      V.arc(ctx, o.x, o.y, scale * 0.34, -Math.max(aH, aTop), -Math.min(aH, aTop), C.gold, 2);
      V.heading(ctx, DE ? "je kleiner der Winkel, desto größer der Logit" : "smaller angle, larger logit", cx, cy + scale * 1.24, C.gold, 10, alpha);
      var x0 = w * 0.62, maxW = w * 0.32;
      var top = Math.max.apply(null, SORTED.map(function (row) { return row.logit; })) || 1;
      V.heading(ctx, "logits = h · wᵢ", x0, 46, C.petrol, 11, alpha);
      SORTED.forEach(function (row, i) {
        var y = 70 + i * Math.max(28, (h - 110) / SORTED.length);
        var col = C[row.c] || C.blue;
        var len = Math.max(1, row.logit / top * maxW);
        V.label(ctx, row.t, x0 - 8, y, {
          font: '600 ' + Math.max(10, api.font("canvas-sm")) + 'px "Open Sans", sans-serif',
          color: i === 0 ? C.green : C.soft, align: "right", alpha: alpha
        });
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = i === 0 ? C.green : V.alpha(col, 0.58);
        ctx.fillRect(x0, y - 7, len, 14);
        ctx.restore();
        V.label(ctx, V.fmt(row.logit), x0 + len + 7, y, {
          font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif',
          color: i === 0 ? C.green : C.muted, alpha: alpha, bg: false
        });
      });
    }
    function softmaxStep(w, h, alpha, soft) {
      var xL = w * 0.34, xR = w * 0.64, maxW = w * 0.20;
      var top = Math.max.apply(null, SORTED.map(function (row) { return row.logit; })) || 1;
      var pTop = Math.max.apply(null, PROBS) || 1;
      V.heading(ctx, "Logits", xL, 44, C.petrol, 11, alpha);
      V.heading(ctx, "Softmax", xR, 44, C.petrol, 11, alpha);
      var m = V.ease(soft);
      var rows = SORTED.map(function (row, i) {
        var y = 76 + i * Math.max(26, (h - 122) / SORTED.length);
        var col = C[row.c] || C.blue;
        var lLen = Math.max(1, row.logit / top * maxW);
        var pLen = Math.max(1, PROBS[i] / pTop * maxW);
        return { row: row, y: y, col: col, lLen: lLen, pLen: pLen };
      });
      rows.forEach(function (r, ri) {
        var col = r.row.c === "green" ? C.green : (C[r.row.c] || C.blue);
        V.label(ctx, r.row.t, xL - 8, r.y, {
          font: '600 ' + Math.max(10, api.font("canvas-sm")) + 'px "Open Sans", sans-serif',
          color: r.row === TOP ? C.green : C.soft, align: "right", alpha: alpha
        });
        ctx.save();
        ctx.globalAlpha = alpha * 0.92;
        ctx.fillStyle = r.row === TOP ? C.green : V.alpha(col, 0.58);
        ctx.fillRect(xL, r.y - 7, r.lLen * m, 14);
        ctx.fillStyle = r.row === TOP ? C.green : V.alpha(col, 0.58);
        ctx.fillRect(xR, r.y - 7, r.pLen * m, 14);
        ctx.restore();
        V.label(ctx, V.fmt(r.row.logit), xL + r.lLen * m + 6, r.y, {
          font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif',
          color: r.row === TOP ? C.green : C.muted, alpha: alpha, bg: false
        });
        V.label(ctx, Math.round(PROBS[ri] * 100) + "%", xR + r.pLen * m + 6, r.y, {
          font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif',
          color: r.row === TOP ? C.green : C.muted, alpha: alpha, bg: false
        });
      });
      ctx.save();
      ctx.globalAlpha = alpha * 0.30 * m;
      rows.forEach(function (r) {
        var col = r.row === TOP ? C.green : (C[r.row.c] || C.blue);
        var x1 = xL + r.lLen * m, x2 = xR, mx = (x1 + x2) / 2;
        ctx.strokeStyle = col;
        ctx.lineWidth = r.row === TOP ? 1.8 : 1;
        ctx.beginPath();
        ctx.moveTo(x1, r.y);
        ctx.bezierCurveTo(mx, r.y, mx, r.y, x2, r.y);
        ctx.stroke();
      });
      ctx.restore();
      V.heading(ctx, DE ? "p = exp(z/T) / Σ exp(z/T)" : "p = exp(z/T) / Σ exp(z/T)", (xL + xR + maxW) / 2, h - 18, C.muted, 10, alpha);
      if (m > 0.5) {
        V.tokenChip(ctx, TOP.t, w - 18, 70, C.green, C, { alpha: alpha, size: 13, align: "right", fill: V.alpha(C.green, 0.14), width: 1.4 });
        V.label(ctx, DE ? "gezogen" : "drawn", w - 18, 92, {
          font: '700 ' + Math.max(9, api.font("canvas-sm")) + 'px "Open Sans", sans-serif',
          color: C.green, align: "right", alpha: alpha * (m - 0.5) * 2, bg: false
        });
      }
    }
    function gpuStep(w, h, alpha) {
      var cx = w * 0.27, cy = h * 0.55, s = Math.min(w * 0.19, h * 0.26);
      var light = [Math.cos(V.rad(angleDeg)), Math.sin(V.rad(angleDeg))];
      var normal = V.unit([0.30, 0.94]);
      var ndl = V.dot(normal, light);
      var bright = 0.18 + 0.78 * Math.max(0, ndl);
      var a = { x: cx - s, y: cy + s * 0.62 };
      var b = { x: cx + s, y: cy + s * 0.62 };
      var c = { x: cx + s * 0.10, y: cy - s * 0.82 };
      ctx.save();
      ctx.globalAlpha = alpha;
      var g = ctx.createLinearGradient(c.x, c.y, b.x, b.y);
      g.addColorStop(0, V.mix(C.paper, C.green, bright));
      g.addColorStop(1, V.mix(C.green, C.ink, 0.18 + 0.34 * Math.max(0, ndl)));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(c.x, c.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = V.alpha(C.petrol, 0.75);
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
      var mid = { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
      var nTip = { x: mid.x + normal[0] * s * 0.78, y: mid.y - normal[1] * s * 0.78 };
      var lTip = { x: mid.x + light[0] * s * 0.82, y: mid.y - light[1] * s * 0.82 };
      V.arrow(ctx, mid.x, mid.y, nTip.x, nTip.y, C.petrol, 2.4, 7);
      V.arrow(ctx, mid.x, mid.y, lTip.x, lTip.y, C.gold, 2.4, 7);
      V.tokenChip(ctx, "N", nTip.x + 6, nTip.y - 6, C.petrol, C, { alpha: alpha, size: 10 });
      V.tokenChip(ctx, "L", lTip.x + 6, lTip.y - 6, C.gold, C, { alpha: alpha, size: 10 });
      V.heading(ctx, "N·L = " + V.fmt(ndl), cx, cy + s * 1.02, C.petrol, 14, alpha);
      var mx = w * 0.58, my = 58, mw = Math.min(w * 0.22, 130), mh = Math.min(h * 0.44, 130);
      var vals = [0.86, 0.42, -0.18, 0.55, 0.94, 0.21, -0.33, 0.48, 0.72];
      V.matrix(ctx, vals, 3, 3, mx, my, mw, mh, C);
      V.heading(ctx, "W_U", mx, my - 10, C.petrol, 11, alpha);
      var hx = mx + mw + 14, hy = my + mh * 0.5;
      V.tokenChip(ctx, "h", hx + 22, hy - 16, C.blue, C, { alpha: alpha, size: 11, align: "center" });
      V.tokenChip(ctx, DE ? "eine Zeile" : "one row", hx + 22, hy + 14, C.green, C, { alpha: alpha, size: 9, align: "center" });
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.strokeRect(mx + 0.5, my + mh / 3 + 0.5, mw - 1, mh / 3 - 1);
      ctx.restore();
      V.heading(ctx, "h · w = " + V.fmt(TOP.logit), w - 18, h - 18, C.green, 14, alpha);
      var chipX = w * 0.58, chipY = my + mh + 38;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = V.alpha(C.petrol, 0.08);
      ctx.fillRect(chipX, chipY - 18, Math.min(w * 0.32, 190), 44);
      ctx.strokeStyle = V.alpha(C.petrol, 0.35);
      ctx.strokeRect(chipX + 0.5, chipY - 17.5, Math.min(w * 0.32, 190) - 1, 43);
      ctx.restore();
      V.heading(ctx, "GPU · SIMT · tensor cores", chipX + 9, chipY - 3, C.petrol, 10, alpha);
      V.label(ctx, DE ? "dieselbe Multiply-Accumulate-Kette" : "same multiply-accumulate chain", chipX + 9, chipY + 14, {
        font: '600 ' + Math.max(9, api.font("canvas-sm") - 1) + 'px "Open Sans", sans-serif',
        color: C.muted, alpha: alpha, bg: false
      });
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h;
      var now = performance.now();
      var fade = fadeDur ? V.ease(V.clamp((now - fadeStart) / fadeDur, 0, 1)) : 1;
      var soft = 1;
      if (step === 3) soft = softDur ? V.ease(V.clamp((now - softStart) / softDur, 0, 1)) : 1;
      background(w, h);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate((1 - fade) * 12, 0);
      header(w, fade);
      if (step === 0) dotStep(w, h, fade);
      else if (step === 1) angleStep(w, h, fade);
      else if (step === 2) wuStep(w, h, fade);
      else if (step === 3) softmaxStep(w, h, fade, soft);
      else gpuStep(w, h, fade);
      ctx.restore();
      if (fade < 1 || (step === 3 && soft < 1)) {
        raf = requestAnimationFrame(draw);
      } else {
        raf = 0;
      }
      setAria(w);
    }
    function setAria(w) {
      var text = DE
        ? ["Dot-Produkt: zwei Vektoren, projizierte Länge und Winkel.", "Winkel: Einheitsvektoren, Cosinus und arccos.", "Unembedding: der letzte Vektor h und die Zeilen von W_U ergeben Logits.", "Softmax: aus Logits werden Wahrscheinlichkeiten, ein Token wird gezogen.", "GPU: dasselbe Skalarprodukt beleuchtet ein Dreieck und berechnet Logits."][step]
        : ["Dot product: two vectors, projected length, and angle.", "Angle: unit vectors, cosine, and arccos.", "Unembedding: the last vector h and the rows of W_U produce logits.", "Softmax: logits become probabilities, one token is drawn.", "GPU: the same dot product shades a triangle and computes logits."][step];
      canvas.setAttribute("aria-label", text);
    }
    function updateReadout() {
      var v = vecV();
      var dot = V.dot(U, v);
      var cos = dot / ((V.norm(U) * V.norm(v)) || 1);
      var theta = V.deg(Math.acos(V.clamp(cos, -1, 1)));
      var light = [Math.cos(V.rad(angleDeg)), Math.sin(V.rad(angleDeg))];
      var ndl = V.dot(V.unit([0.30, 0.94]), light);
      var html = "";
      if (step === 0) {
        html = "<span><b>u·v</b> " + V.fmt(dot) + "</span><span><b>|u|</b> " + V.fmt(V.norm(U)) + "</span><span><b>|v|</b> " + V.fmt(V.norm(v)) + "</span><span><b>cos θ</b> " + V.fmt(cos) + "</span><span><b>θ</b> " + V.fmt(theta, 1) + "°</span>";
      } else if (step === 1) {
        html = "<span><b>cos θ</b> " + V.fmt(cos) + "</span><span><b>θ</b> " + V.fmt(theta, 1) + "°</span><span><b>|u|</b> " + V.fmt(V.norm(U)) + "</span><span><b>|v|</b> " + V.fmt(V.norm(v)) + "</span>";
      } else if (step === 2) {
        html = "<span><b>h</b> (" + V.fmt(H[0]) + ", " + V.fmt(H[1]) + ")</span><span><b>" + TOP.t + "</b> logit " + V.fmt(TOP.logit) + "</span><span><b>" + (DE ? "Zeilen" : "rows") + "</b> " + TOKENS.length + "</span>";
      } else if (step === 3) {
        html = "<span><b>" + TOP.t + "</b> p " + Math.round(TOP_P * 100) + "%</span><span><b>T</b> " + V.fmt(TEMP) + "</span><span><b>" + (DE ? "Verteilung" : "distribution") + "</b> Σ p = 100%</span>";
      } else {
        html = "<span><b>N·L</b> " + V.fmt(ndl) + "</span><span><b>h·w</b> " + V.fmt(TOP.logit) + "</span><span><b>" + (DE ? "Operation" : "operation") + "</b> MAC</span>";
      }
      readout.innerHTML = html;
    }
    function updateControls() {
      var useAngle = step === 0 || step === 1 || step === 4;
      angleEl.classList.toggle("is-hidden", !useAngle);
      angleEl.firstChild.nodeValue = step === 4 ? (DE ? "Licht " : "Light ") : (DE ? "Winkel " : "Angle ");
      angleInput.value = String(angleDeg);
      angleOut.textContent = angleDeg + "°";
      progress.textContent = (step + 1) + " / 5";
      prevBtn.disabled = false;
      nextBtn.textContent = step === 4 ? (DE ? "Nächste Folie →" : "Next slide →") : (DE ? "Weiter →" : "Next →");
    }
    function setStep(next) {
      step = Math.max(0, Math.min(4, next));
      fadeStart = performance.now();
      if (step === 3) softStart = performance.now();
      updateControls();
      updateReadout();
      draw();
    }
    function nextInternal() {
      if (step < 4) { setStep(step + 1); return true; }
      return false;
    }
    function prevInternal() {
      if (step > 0) { setStep(step - 1); return true; }
      return false;
    }
    angleInput.addEventListener("input", function () {
      angleDeg = parseInt(angleInput.value, 10) || 38;
      angleOut.textContent = angleDeg + "°";
      updateReadout();
      draw();
    });
    nextBtn.addEventListener("click", function () { if (!nextInternal()) api.goNext(); });
    prevBtn.addEventListener("click", function () { if (!prevInternal()) api.goPrev(); });
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    setStep(0);
    return {
      update: function () {},
      next: nextInternal,
      prev: prevInternal,
      onKey: function (e) { return api.util.arrowKey(e, nextInternal, prevInternal); },
      resize: resize,
      pause: function () { if (raf) cancelAnimationFrame(raf); raf = 0; },
      resume: function () { draw(); },
      destroy: function () { if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", resize); el.remove(); }
    };
  };
})();
