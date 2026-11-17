(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var V = window.LearnSysVisuals;

  if (!document.getElementById("ls-induction-style")) {
    var st = document.createElement("style");
    st.id = "ls-induction-style";
    st.textContent = ".ls-ind-scene{position:relative;width:100%;height:100%;min-height:360px;overflow:hidden;background:var(--tm-paper,#fff)}.ls-ind-scene .ls-ind-canvas{display:block;width:100%;height:100%;min-height:360px}";
    document.head.appendChild(st);
  }

  function inductionScene(root, api) {
    var DE = api.lang === "de";
    var C = api.colors();
    var host = document.createElement("div");
    host.className = "ls-ind-scene";
    var canvas = document.createElement("canvas");
    canvas.className = "ls-ind-canvas";
    canvas.setAttribute("role", "img");
    host.appendChild(canvas);
    root.appendChild(host);
    var ctx = canvas.getContext("2d");
    var W = 1, H = 1;
    var mode = "sequence";
    var ARIA = {
      sequence: DE
        ? "Token-Reihe A B C A B C A; das letzte A beachtet das frühere B und sagt B voraus."
        : "Token strip A B C A B C A; the final A attends to the earlier B and predicts B.",
      circuit: DE
        ? "Schaltkreis aus zwei Köpfen: Previous-Token-Head in Schicht 1, Induction Head in Schicht 2."
        : "Two-head circuit: a previous-token head in layer one, an induction head in layer two.",
      emergence: DE
        ? "Schematischer Trainingsverlauf mit drei Kurven und einem Phasenfenster zwischen 2,5 und 5 Milliarden Tokens."
        : "Schematic training curves with a phase window between 2.5 and 5 billion tokens."
    };

    function txt(c, s, x, y, o) {
      var opt = o || {};
      var size = typeof opt.size === "number" ? opt.size : 11;
      V.label(c, s, x, y, {
        size: size,
        font: opt.font || '400 ' + size + 'px "Open Sans", "Segoe UI", sans-serif',
        color: opt.color || C.soft,
        align: opt.align || "left",
        baseline: opt.baseline || "middle",
        alpha: typeof opt.alpha === "number" ? opt.alpha : 1,
        bg: opt.bg === undefined ? false : opt.bg,
        bgAlpha: opt.bgAlpha
      });
    }

    function head(c, s, x, y, o) {
      var opt = o || {};
      var size = typeof opt.size === "number" ? opt.size : 22;
      txt(c, s, x, y, {
        size: size,
        font: '700 ' + size + 'px "Barlow", "Open Sans", sans-serif',
        color: opt.color || C.ink,
        align: opt.align || "left"
      });
    }

    function accent(c, x, y, w) {
      c.save();
      c.strokeStyle = C.gold;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + w, y);
      c.stroke();
      c.restore();
    }

    function arrowHead(c, x, y, dx, dy, size, color) {
      var len = Math.hypot(dx, dy) || 1;
      var ux = dx / len, uy = dy / len;
      var px = -uy, py = ux;
      c.save();
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - ux * size + px * size * 0.46, y - uy * size + py * size * 0.46);
      c.lineTo(x - ux * size - px * size * 0.46, y - uy * size - py * size * 0.46);
      c.closePath();
      c.fill();
      c.restore();
    }

    function curveArrow(c, pts, color, width, dashed) {
      c.save();
      c.strokeStyle = color;
      c.lineWidth = width;
      c.lineCap = "round";
      if (dashed) c.setLineDash([5, 5]);
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      c.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
      c.stroke();
      c.restore();
      arrowHead(c, pts[3][0], pts[3][1], pts[3][0] - pts[2][0], pts[3][1] - pts[2][1], 7, color);
    }

    function chipBox(c, text, cx, cy, w, h, color, filled) {
      c.save();
      c.fillStyle = filled ? V.alpha(color, 0.12) : C.paper;
      c.fillRect(cx - w / 2, cy - h / 2, w, h);
      c.strokeStyle = filled ? color : V.alpha(C.lineStrong, 0.9);
      c.lineWidth = filled ? 1.8 : 1;
      c.strokeRect(cx - w / 2 + 0.5, cy - h / 2 + 0.5, w - 1, h - 1);
      c.fillStyle = C.ink;
      c.font = '700 ' + Math.round(h * 0.5) + 'px "Barlow", "Open Sans", sans-serif';
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, cx, cy + 1);
      c.restore();
    }

    function glowNode(c, x, y, r, color) {
      var g = c.createRadialGradient(x, y, r * 0.25, x, y, r * 2.7);
      g.addColorStop(0, V.alpha(color, 0.32));
      g.addColorStop(0.55, V.alpha(color, 0.10));
      g.addColorStop(1, V.alpha(color, 0));
      c.save();
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r * 2.7, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fillStyle = C.paper;
      c.fill();
      c.strokeStyle = color;
      c.lineWidth = 2;
      c.stroke();
      c.beginPath();
      c.arc(x, y, r * 0.24, 0, Math.PI * 2);
      c.fillStyle = color;
      c.fill();
      c.restore();
    }

    function drawSequence(c) {
      var pad = Math.max(16, Math.min(28, W * 0.04));
      var small = W < 560;
      head(c, DE ? "Induktion" : "Induction", pad, 30, { size: small ? 18 : 22 });
      txt(c, DE ? "Ein Muster setzt sich fort." : "A pattern continues.", pad, 50, { size: 10.5, color: C.muted });
      accent(c, pad, 64, 38);
      var tokens = ["A", "B", "C", "A", "B", "C", "A"];
      var gap = Math.max(5, Math.min(12, W * 0.015));
      var chipW = Math.min(46, (W - 2 * pad - 6 * gap) / 7);
      chipW = Math.max(26, chipW);
      var chipH = Math.min(44, chipW * 1.02);
      var total = 7 * chipW + 6 * gap;
      var start = (W - total) / 2;
      var cy = H * 0.42;
      var xs = [];
      for (var i = 0; i < tokens.length; i++) {
        var cx = start + i * (chipW + gap) + chipW / 2;
        xs.push(cx);
        var filled = i === 6 || i === 4;
        var color = i === 6 ? C.gold : i === 4 ? C.sky : C.lineStrong;
        chipBox(c, tokens[i], cx, cy, chipW, chipH, color, filled);
      }
      var yTop = cy - chipH / 2;
      var a0x = xs[6], a1x = xs[4], ay0 = yTop - 2, ay1 = yTop - 4;
      c.save();
      c.strokeStyle = V.alpha(C.gold, 0.16);
      c.lineWidth = 6;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(a0x, ay0);
      c.bezierCurveTo(a0x, ay0 - 42, a1x, ay1 - 42, a1x, ay1);
      c.stroke();
      c.restore();
      c.save();
      c.strokeStyle = C.gold;
      c.lineWidth = 1.8;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(a0x, ay0);
      c.bezierCurveTo(a0x, ay0 - 42, a1x, ay1 - 42, a1x, ay1);
      c.stroke();
      c.restore();
      arrowHead(c, a1x, ay1, 0, 1, 7, C.gold);
      c.save();
      c.fillStyle = C.gold;
      c.beginPath();
      c.arc(a0x, ay0, 2.3, 0, Math.PI * 2);
      c.fill();
      c.restore();

      var py = cy + chipH / 2 + (small ? 52 : 64);
      var panelW = Math.min(W - 2 * pad, 430);
      var px = (W - panelW) / 2;
      txt(c, "A B … A → B", px, py - 16, {
        size: small ? 13 : 15,
        font: '700 ' + (small ? 13 : 15) + 'px "Barlow", "Open Sans", sans-serif',
        color: C.ink
      });
      txt(c, DE ? "nächstes Token" : "next token", px + panelW, py - 16, {
        align: "right",
        size: 8.5,
        color: C.muted
      });
      var probs = [
        { t: "A", p: 0.10, col: C.lineStrong },
        { t: "B", p: 0.74, col: C.gold },
        { t: "C", p: 0.16, col: C.sky }
      ];
      var rowH = small ? 22 : 26;
      var trackX = px + 24;
      var trackW = panelW - 62;
      for (var k = 0; k < probs.length; k++) {
        var ry = py + k * rowH + 8;
        var item = probs[k];
        txt(c, item.t, px + 8, ry, {
          size: small ? 11 : 12,
          font: '700 ' + (small ? 11 : 12) + 'px "Barlow", "Open Sans", sans-serif',
          color: item.col === C.lineStrong ? C.muted : item.col
        });
        c.save();
        c.fillStyle = V.alpha(C.line, 0.35);
        c.fillRect(trackX, ry - 4, trackW, 8);
        c.fillStyle = V.alpha(item.col, 0.9);
        c.fillRect(trackX, ry - 4, trackW * item.p, 8);
        c.restore();
        txt(c, Math.round(item.p * 100) + " %", px + panelW, ry, {
          align: "right",
          size: 8.5,
          color: item.col === C.gold ? C.gold : C.muted
        });
      }
    }

    function drawCircuit(c) {
      var pad = Math.max(16, Math.min(28, W * 0.04));
      var small = W < 620;
      head(c, DE ? "Induktions-Schaltkreis" : "Induction circuit", pad, 30, { size: small ? 17 : 21 });
      txt(c, DE ? "Zwei Köpfe, zwei Schichten." : "Two heads, two layers.", pad, 50, { size: 10.5, color: C.muted });
      accent(c, pad, 64, 38);
      var y = H * 0.38;
      var x1 = W * (small ? 0.26 : 0.29);
      var x2 = W * (small ? 0.63 : 0.65);
      var r1 = small ? 14 : 17;
      var r2 = small ? 16 : 19;
      var tokY = H * 0.78;
      var tw = small ? 34 : 40;
      var th = small ? 32 : 36;
      var Bx = W - pad - tw / 2 - 6;
      if (Bx < x2 + tw + 12) Bx = x2 + tw + 12;

      c.save();
      c.strokeStyle = V.alpha(C.line, 0.95);
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(pad + 6, y);
      c.lineTo(W - pad - 24, y);
      c.stroke();
      c.restore();
      V.arrow(c, W - pad - 44, y, W - pad - 12, y, V.alpha(C.lineStrong, 0.95), 1.4, 7);
      txt(c, DE ? "Residualstrom" : "residual stream", W - pad - 4, y - 12, {
        align: "right",
        size: 8,
        color: C.muted
      });

      txt(c, DE ? "Schicht 1" : "Layer 1", x1, y - 66, { align: "center", size: 8.5, color: C.muted });
      txt(c, DE ? "Schicht 2" : "Layer 2", x2, y - 66, { align: "center", size: 8.5, color: C.muted });
      txt(c, "Previous-Token-Head", x1, y - 47, {
        align: "center",
        size: small ? 9.8 : 11.5,
        font: '700 ' + (small ? 9.8 : 11.5) + 'px "Barlow", "Open Sans", sans-serif',
        color: C.blue
      });
      txt(c, "Induction Head", x2, y - 47, {
        align: "center",
        size: small ? 9.8 : 11.5,
        font: '700 ' + (small ? 9.8 : 11.5) + 'px "Barlow", "Open Sans", sans-serif',
        color: C.gold
      });

      glowNode(c, x1, y, r1, C.blue);
      glowNode(c, x2, y, r2, C.gold);

      txt(c, DE ? "schreibt in den Strom" : "writes to the stream", x1, y + r1 + 17, {
        align: "center",
        size: 8.1,
        color: C.blue
      });

      var kx = (x1 + x2) / 2;
      c.save();
      c.strokeStyle = V.alpha(C.sky, 0.82);
      c.lineWidth = 1.2;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(x1 + r1 + 9, y);
      c.lineTo(x2 - r2 - 8, y);
      c.stroke();
      c.restore();
      arrowHead(c, x2 - r2 - 6, y, 1, 0, 5, V.alpha(C.sky, 0.9));
      txt(c, DE ? "Key: A (verschoben)" : "key: A (shifted)", kx, y - 13, {
        align: "center",
        size: 8.1,
        color: C.sky
      });

      chipBox(c, "C", x1, tokY, tw, th, C.blue, false);
      txt(c, "j−1", x1, tokY + th / 2 + 11, { align: "center", size: 8, color: C.muted });
      chipBox(c, "A", x2, tokY, tw, th, C.gold, true);
      txt(c, "j", x2, tokY + th / 2 + 11, { align: "center", size: 8, color: C.muted });
      chipBox(c, "B", Bx, tokY, tw, th, C.sky, true);

      V.arrow(c, x1, tokY - th / 2 - 2, x1, y + r1 + 4, V.alpha(C.blue, 0.92), 1.4, 7);
      txt(c, DE ? "liest j−1" : "reads j−1", x1 + 7, (tokY - th / 2 + y + r1) / 2, {
        size: 8,
        color: C.blue
      });
      V.arrow(c, x2, tokY - th / 2 - 2, x2, y + r2 + 4, V.alpha(C.blue, 0.92), 1.4, 7);
      txt(c, "Query A", x2 + 7, (tokY - th / 2 + y + r2) / 2, {
        size: 8,
        color: C.blue
      });

      curveArrow(c, [
        [x2 + r2 * 0.45, y + r2 * 0.72],
        [x2 + r2 + 30, y + 26],
        [Bx, tokY - th / 2 - 30],
        [Bx, tokY - th / 2 - 4]
      ], V.alpha(C.gold, 0.95), 1.6, false);
      txt(c, DE ? "Attention auf B" : "attention B", Bx - 8, (tokY - th / 2 + y + r2) / 2, {
        align: "right",
        size: 8,
        color: C.gold
      });

      var ox = W - pad - 24;
      curveArrow(c, [
        [Bx + tw * 0.34, tokY - th / 2 - 2],
        [Math.min(W - pad - 36, Bx + 38), tokY - 42],
        [ox, y + 36],
        [ox, y + 2]
      ], V.alpha(C.gold, 0.9), 1.4, true);
      txt(c, DE ? "OV · kopieren" : "OV · copy", W - pad - 8, y + 18, {
        align: "right",
        size: 8.1,
        color: C.gold
      });
    }

    function tokenFrac(v) {
      return Math.log(v) / Math.log(10);
    }

    function sigmoid(x) {
      return 1 / (1 + Math.exp(-x));
    }

    function plotLine(c, values, color, width, x0, y0, pw, ph) {
      var n = values.length - 1;
      c.save();
      c.strokeStyle = color;
      c.lineWidth = width;
      c.lineJoin = "round";
      c.lineCap = "round";
      c.beginPath();
      for (var i = 0; i <= n; i++) {
        var x = x0 + (i / n) * pw;
        var y = y0 + values[i] * ph;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      c.restore();
    }

    function legendWidth(c, label, size) {
      c.save();
      c.font = '600 ' + size + 'px "Open Sans", "Segoe UI", sans-serif';
      var tw = c.measureText(label).width;
      c.restore();
      return tw + 30;
    }

    function legendItem(c, cx, cy, color, label, size) {
      c.save();
      c.font = '600 ' + size + 'px "Open Sans", "Segoe UI", sans-serif';
      c.strokeStyle = color;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + 13, cy);
      c.stroke();
      c.fillStyle = C.ink;
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.fillText(label, cx + 17, cy);
      c.restore();
    }

    function drawEmergence(c) {
      var pad = Math.max(16, Math.min(28, W * 0.04));
      var small = W < 620;
      head(c, DE ? "Emergenz" : "Emergence", pad, 30, { size: small ? 18 : 22 });
      txt(c, DE ? "Drei Signale, ein Fenster." : "Three signals, one window.", pad, 50, { size: 10.5, color: C.muted });
      accent(c, pad, 64, 38);
      txt(c, DE ? "schematisch" : "schematic", W - pad, 30, { align: "right", size: 8.5, color: C.muted });

      var x0 = pad + 2;
      var x1 = W - pad - 4;
      var y0 = 92;
      var y1 = H - 84;
      var pw = x1 - x0;
      var ph = y1 - y0;
      if (ph < 90) ph = 90;

      c.save();
      c.fillStyle = V.alpha(C.paper2, 0.5);
      c.fillRect(x0, y0, pw, ph);
      c.strokeStyle = V.alpha(C.line, 0.95);
      c.lineWidth = 1;
      c.strokeRect(x0 + 0.5, y0 + 0.5, pw - 1, ph - 1);
      c.restore();
      c.save();
      c.strokeStyle = V.alpha(C.line, 0.7);
      c.lineWidth = 1;
      c.setLineDash([2, 5]);
      for (var g = 1; g <= 3; g++) {
        var gy = y0 + ph * g / 4;
        c.beginPath();
        c.moveTo(x0, gy);
        c.lineTo(x1, gy);
        c.stroke();
      }
      c.restore();

      var aFrac = tokenFrac(2.5);
      var bFrac = tokenFrac(5);
      var wa = x0 + aFrac * pw;
      var wb = x0 + bFrac * pw;
      c.save();
      c.fillStyle = V.alpha(C.lilac, 0.12);
      c.fillRect(wa, y0, wb - wa, ph);
      c.strokeStyle = V.alpha(C.lilac, 0.55);
      c.lineWidth = 1;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(wa, y0);
      c.lineTo(wa, y1);
      c.moveTo(wb, y0);
      c.lineTo(wb, y1);
      c.stroke();
      c.restore();

      var wc = (wa + wb) / 2;
      txt(c, "Phase Change", wc, y0 - 27, {
        align: "center",
        size: small ? 9 : 10.5,
        font: '700 ' + (small ? 9 : 10.5) + 'px "Barlow", "Open Sans", sans-serif',
        color: C.gold
      });
      txt(c, DE ? "~2,5–5B Tokens" : "~2.5–5B Tokens", wc, y0 - 13, {
        align: "center",
        size: small ? 8.5 : 9.5,
        color: C.gold
      });

      var N = 90;
      var induction = [], icl = [], loss = [];
      for (var i = 0; i <= N; i++) {
        var t = i / N;
        induction.push(0.12 + 0.72 * sigmoid((t - 0.50) / 0.055));
        icl.push(0.10 + 0.64 * sigmoid((t - 0.56) / 0.065));
        var lossFrac = 0.30 + 0.48 * Math.min(1, Math.max(0, (t - 0.05) / 0.95)) +
          0.055 * Math.exp(-Math.pow((t - 0.56) / 0.055, 2));
        loss.push(lossFrac);
      }

      plotLine(c, induction.map(function (v) { return 1 - v; }), C.blue, 1.8, x0, y0, pw, ph);
      plotLine(c, icl.map(function (v) { return 1 - v; }), C.gold, 1.8, x0, y0, pw, ph);
      plotLine(c, loss, C.green, 1.8, x0, y0, pw, ph);

      var ticks = [
        { v: 1, l: "1B" },
        { v: 2.5, l: DE ? "2,5B" : "2.5B" },
        { v: 5, l: "5B" },
        { v: 10, l: "10B" }
      ];
      for (var k = 0; k < ticks.length; k++) {
        var tx = x0 + tokenFrac(ticks[k].v) * pw;
        c.save();
        c.strokeStyle = V.alpha(C.lineStrong, 0.8);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(tx, y1);
        c.lineTo(tx, y1 + 4);
        c.stroke();
        c.restore();
        txt(c, ticks[k].l, tx, y1 + 15, { align: "center", size: 8, color: C.muted });
      }

      var items = small ? [
        [C.blue, "Induction"],
        [C.gold, "ICL"],
        [C.green, DE ? "Loss" : "loss"]
      ] : [
        [C.blue, DE ? "Induction-Kopf" : "Induction head"],
        [C.gold, DE ? "In-Context-Learning" : "In-context learning"],
        [C.green, DE ? "Trainings-Loss" : "Training loss"]
      ];
      var lx = x0 + 8, ly = y0 + 14;
      for (var m = 0; m < items.length; m++) {
        var adv = legendWidth(c, items[m][1], 8.2);
        if (lx + adv > x1 - 4) {
          lx = x0 + 8;
          ly += 15;
        }
        legendItem(c, lx, ly, items[m][0], items[m][1], 8.2);
        lx += adv + 14;
      }

      txt(c, DE
        ? "ICL <0,15 → ~0,4 nats · >75 % des finalen ICL im Fenster"
        : "ICL <0.15 → ~0.4 nats · >75 % of final ICL in window",
        pad, y1 + 33, { size: 8.2, color: C.muted });
      txt(c, "Olsson et al. (2022), In-context Learning and Induction Heads",
        pad, y1 + 49, { size: 8, color: C.muted });
    }

    function draw() {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, W, H);
      var g = ctx.createRadialGradient(W * 0.78, H * 0.12, 0, W * 0.78, H * 0.12, Math.max(W, H) * 0.9);
      g.addColorStop(0, V.alpha(C.green, 0.045));
      g.addColorStop(0.5, V.alpha(C.sky, 0.022));
      g.addColorStop(1, V.alpha(C.paper, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = V.alpha(C.line, 0.75);
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
      if (mode === "circuit") drawCircuit(ctx);
      else if (mode === "emergence") drawEmergence(ctx);
      else drawSequence(ctx);
    }

    function fit() {
      var r = api.fit(canvas, host);
      W = r.w;
      H = r.h;
      ctx = r.ctx;
      draw();
    }

    function setAria() {
      canvas.setAttribute("aria-label", ARIA[mode] || ARIA.sequence);
    }

    function setMode(next) {
      if (next !== "sequence" && next !== "circuit" && next !== "emergence") return;
      if (next === mode) return;
      mode = next;
      setAria();
      draw();
    }

    function onTheme() {
      C = api.colors();
      draw();
    }

    window.addEventListener("tm:theme", onTheme);
    window.addEventListener("resize", fit);
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { fit(); });
      ro.observe(host);
    }
    setAria();
    fit();

    return {
      update: function (s) {
        if (s && s.mode) setMode(s.mode);
      },
      resize: fit,
      destroy: function () {
        window.removeEventListener("tm:theme", onTheme);
        window.removeEventListener("resize", fit);
        if (ro) ro.disconnect();
        host.remove();
      }
    };
  }

  core.register("induction", inductionScene);
})();
