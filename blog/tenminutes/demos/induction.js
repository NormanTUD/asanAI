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
    var current = 6;
    var seqGeo = { xs: [], chipW: 0, chipH: 0, cy: 0 };
    var headsSel = 0;
    var headsHits = [];
    var copyStep = 2;
    var copyHits = [];
    var ARIA = {
      sequence: DE
        ? "Token-Reihe A B C A B C A; das letzte A beachtet das frühere B und sagt B voraus."
        : "Token strip A B C A B C A; the final A attends to the earlier B and predicts B.",
      copy: DE
        ? "Drei Schritte des Kopierens: Key-Shift, Query-Match und OV-Copy."
        : "Three copying steps: key shift, query match, and OV copy.",
      circuit: DE
        ? "Schaltkreis aus zwei Köpfen: Previous-Token-Head in Schicht 1, Induction Head in Schicht 2."
        : "Two-head circuit: a previous-token head in layer one, an induction head in layer two.",
      heads: DE
        ? "Vier Attention-Head-Typen: Induktion, Duplicate, Successor und Name-Mover."
        : "Four attention-head types: induction, duplicate, successor, and name-mover.",
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
      txt(c, DE ? "Ein Muster setzt sich fort. Klicke ein Token." : "A pattern continues. Click a token.", pad, 50, { size: 10.5, color: C.muted });
      accent(c, pad, 64, 38);
      var tokens = ["A", "B", "C", "A", "B", "C", "A"];
      var tok = tokens[current];
      var prev = -1;
      for (var q = current - 1; q >= 0; q--) {
        if (tokens[q] === tok) { prev = q; break; }
      }
      var source = prev >= 0 ? prev + 1 : -1;
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
        var filled = i === current || i === source;
        var color = i === current ? C.gold : i === source ? C.sky : C.lineStrong;
        chipBox(c, tokens[i], cx, cy, chipW, chipH, color, filled);
      }
      seqGeo = { xs: xs, chipW: chipW, chipH: chipH, cy: cy };
      var yTop = cy - chipH / 2;
      var a0x = xs[current], a1x = source >= 0 ? xs[source] : xs[current], ay0 = yTop - 2, ay1 = yTop - 4;
      if (source >= 0 && source !== current) {
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
      }

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
      var target = source >= 0 ? tokens[source] : "";
      var probs = ["A", "B", "C"].map(function (t) {
        if (!target) return { t: t, p: 1 / 3, col: C.lineStrong };
        return { t: t, p: t === target ? 0.74 : 0.13, col: t === target ? C.gold : C.sky };
      });
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
      var note = source >= 0
        ? (DE ? "Token " + tok + " → " + target + " (nach dem früheren " + tok + ")" : "token " + tok + " → " + target + " (after the earlier " + tok + ")")
        : (DE ? "Kein früheres " + tok + " → keine Induktion" : "no earlier " + tok + " → no induction");
      txt(c, note, px, py + probs.length * rowH + 14, { size: 9.5, color: C.ink });
    }


    function drawStage(c) {
      c.clearRect(0, 0, W, H);
      c.fillStyle = C.paper;
      c.fillRect(0, 0, W, H);
      var g = c.createRadialGradient(W * 0.18, H * 0.08, 0, W * 0.18, H * 0.08, Math.max(W, H) * 0.95);
      g.addColorStop(0, V.alpha(C.petrol, 0.17));
      g.addColorStop(0.42, V.alpha(C.sky, 0.065));
      g.addColorStop(1, V.alpha(C.paper, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      var g2 = c.createRadialGradient(W * 0.92, H * 0.94, 0, W * 0.92, H * 0.94, Math.max(W, H) * 0.8);
      g2.addColorStop(0, V.alpha(C.green, 0.045));
      g2.addColorStop(1, V.alpha(C.paper, 0));
      c.fillStyle = g2;
      c.fillRect(0, 0, W, H);
      var vig = c.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.24, W * 0.5, H * 0.5, Math.max(W, H) * 0.74);
      vig.addColorStop(0, V.alpha(C.petrol, 0));
      vig.addColorStop(1, V.alpha(C.petrol, 0.09));
      c.fillStyle = vig;
      c.fillRect(0, 0, W, H);
      c.save();
      c.fillStyle = V.alpha(C.petrol, 0.055);
      for (var gx = 24; gx < W; gx += 30) {
        for (var gy = 24; gy < H; gy += 30) c.fillRect(gx, gy, 1, 1);
      }
      c.restore();
      c.strokeStyle = V.alpha(C.line, 0.78);
      c.lineWidth = 1;
      c.strokeRect(0.5, 0.5, W - 1, H - 1);
    }

    function wrapText(c, text, x, y, maxW, lineH, opt) {
      var o = opt || {};
      var words = String(text || "").split(/\s+/);
      var line = "";
      var yy = y;
      c.save();
      c.font = o.font || ('400 ' + (o.size || 10) + 'px "Open Sans", sans-serif');
      for (var i = 0; i < words.length; i++) {
        var test = line ? line + " " + words[i] : words[i];
        if (line && c.measureText(test).width > maxW) {
          c.restore();
          txt(c, line, x, yy, o);
          c.save();
          c.font = o.font || ('400 ' + (o.size || 10) + 'px "Open Sans", sans-serif');
          line = words[i];
          yy += lineH;
        } else {
          line = test;
        }
      }
      c.restore();
      if (line) txt(c, line, x, yy, o);
      return yy + lineH;
    }

    function drawMiniTokens(c, tokens, cx, cy, color, from, to, outText) {
      var gap = 4;
      var cw = Math.max(22, Math.min(34, (W * 0.22) / Math.max(3, tokens.length)));
      var ch = Math.round(cw * 0.94);
      var total = tokens.length * cw + (tokens.length - 1) * gap;
      var x0 = cx - total / 2;
      var xs = [];
      for (var i = 0; i < tokens.length; i++) {
        var x = x0 + i * (cw + gap) + cw / 2;
        xs.push(x);
        var on = i === from || i === to;
        chipBox(c, tokens[i], x, cy, cw, ch, on ? color : C.lineStrong, on);
      }
      if (from >= 0 && to >= 0 && xs[from] != null && xs[to] != null) {
        var ax = xs[from], bx = xs[to], ay = cy - ch / 2 - 3, by = ay;
        c.save();
        c.strokeStyle = V.alpha(color, 0.9);
        c.lineWidth = 1.4;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(ax, ay);
        c.bezierCurveTo(ax, ay - 20, bx, by - 20, bx, by);
        c.stroke();
        c.restore();
        arrowHead(c, bx, by, bx - ax, 0, 5.5, color);
        if (outText) {
          txt(c, outText, Math.max(ax, bx) + 5, ay - 12, {
            size: 8.4,
            color: C.petrol,
            font: '700 8.4px "Barlow", "Open Sans", sans-serif'
          });
        }
      }
    }

    function drawCopy(c) {
      var pad = Math.max(16, Math.min(28, W * 0.04));
      var small = W < 620;
      head(c, DE ? "Der Kopiervorgang" : "The copy operation", pad, 30, { size: small ? 18 : 22 });
      txt(c, DE ? "Drei Schritte, drei gelernte Matrizen" : "Three steps, three learned matrices", pad, 50, { size: 10.5, color: C.muted });
      accent(c, pad, 64, 38);

      var tokens = ["A", "B", "C", "A", "B", "C", "A"];
      var gap = Math.max(4, Math.min(9, W * 0.012));
      var cw = Math.min(38, (W - 2 * pad - 6 * gap) / 7);
      cw = Math.max(22, cw);
      var ch = Math.round(cw * 1.02);
      var total = 7 * cw + 6 * gap;
      var start = (W - total) / 2;
      var cy = 104;
      var xs = [];
      for (var i = 0; i < tokens.length; i++) {
        var cx = start + i * (cw + gap) + cw / 2;
        xs.push(cx);
        var on = i === 3 || i === 4 || i === 6;
        var col = i === 6 ? C.gold : i === 4 ? C.sky : i === 3 ? C.green : C.lineStrong;
        chipBox(c, tokens[i], cx, cy, cw, ch, col, on);
      }
      txt(c, DE ? "früheres A" : "earlier A", xs[3], cy - ch / 2 - 10, { align: "center", size: 8.2, color: C.green });
      txt(c, "B", xs[4], cy - ch / 2 - 10, { align: "center", size: 8.2, color: C.sky });
      txt(c, DE ? "aktuell" : "current", xs[6], cy - ch / 2 - 10, { align: "center", size: 8.2, color: C.gold });

      var rowY = cy + ch / 2 + 18;
      var rowH = Math.max(52, (H - rowY - 30) / 3);
      copyHits = [];
      var rows = [
        {
          n: "1",
          title: DE ? "Key-Shift" : "Key shift",
          body: DE ? "Der Previous-Token-Head schreibt A in den Key der Position nach dem früheren A." : "The previous-token head writes A into the key one step after the earlier A.",
          color: C.green,
          matrix: "W_K",
          from: 3, to: 4
        },
        {
          n: "2",
          title: DE ? "Query-Match" : "Query match",
          body: DE ? "Die Query des aktuellen A passt auf diesen Key. Die Attention fällt auf B." : "The current A query matches that key. Attention lands on B.",
          color: C.gold,
          matrix: "W_Q^T W_K",
          from: 6, to: 4
        },
        {
          n: "3",
          title: "OV-Copy",
          body: DE ? "Die OV-Matrix kopiert den Value von B an die aktuelle Position. Der Logit von B steigt." : "The OV matrix copies B's value to the current position. B's logit rises.",
          color: C.sky,
          matrix: "W_O W_V",
          mini: ["B", "B"],
          miniFrom: 0, miniTo: 0
        }
      ];
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        var y = rowY + r * rowH;
        var isSel = r === copyStep;
        copyHits.push({ x: pad, y: y, w: W - 2 * pad, h: rowH - 6, i: r });
        c.save();
        c.fillStyle = V.alpha(row.color, isSel ? 0.11 : 0.045);
        c.fillRect(pad, y, W - 2 * pad, rowH - 6);
        c.strokeStyle = V.alpha(row.color, isSel ? 0.62 : 0.22);
        c.lineWidth = isSel ? 1.6 : 1;
        c.strokeRect(pad + 0.5, y + 0.5, W - 2 * pad - 1, rowH - 7);
        c.restore();
        c.fillStyle = isSel ? row.color : V.alpha(row.color, 0.55);
        c.beginPath();
        c.arc(pad + 18, y + 18, 10, 0, Math.PI * 2);
        c.fill();
        txt(c, row.n, pad + 18, y + 18, {
          align: "center",
          size: 10,
          font: '700 10px "Barlow", "Open Sans", sans-serif',
          color: "#fff"
        });
        txt(c, row.title, pad + 36, y + 15, {
          size: small ? 10.5 : 12,
          font: '700 ' + (small ? 10.5 : 12) + 'px "Barlow", "Open Sans", sans-serif',
          color: C.petrol
        });
        wrapText(c, row.body, pad + 36, y + 32, W - pad - (small ? 106 : 168) - (pad + 36), small ? 10 : 11, {
          size: small ? 7.6 : 9.0,
          color: C.soft
        });
        var miniX = W - pad - (small ? 96 : 132);
        drawMiniTokens(c, row.mini || ["A", "B"], miniX, y + rowH - 20, row.color,
          typeof row.miniFrom === "number" ? row.miniFrom : (row.from === 4 ? 1 : 0),
          typeof row.miniTo === "number" ? row.miniTo : (row.to === 4 ? 1 : 0),
          "");
        txt(c, row.matrix, W - pad - 4, y + rowH - 34, {
          align: "right",
          size: small ? 7.4 : 8.2,
          color: C.petrol,
          font: '700 ' + (small ? 7.4 : 8.2) + 'px "Open Sans", sans-serif'
        });
      }
      txt(c, DE
        ? "Kein Schritt liest eine Tabelle: Jeder Schritt ist eine Matrix auf Vektoren."
        : "No step reads a table: every step is a matrix on vectors.",
        pad, H - 18, { size: 8.6, color: C.muted });
    }

    function drawHeadCard(c, x, y, w, h, item, selected) {
      c.save();
      c.fillStyle = selected ? V.alpha(item.color, 0.12) : V.alpha(C.paper, 0.72);
      c.fillRect(x, y, w, h);
      c.strokeStyle = selected ? item.color : V.alpha(C.lineStrong, 0.9);
      c.lineWidth = selected ? 1.8 : 1;
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      c.restore();
      if (selected) {
        c.fillStyle = item.color;
        c.fillRect(x, y, w, 3);
      }
      txt(c, item.title, x + 10, y + 16, {
        size: w < 230 ? 11 : 12.5,
        font: '700 ' + (w < 230 ? 11 : 12.5) + 'px "Barlow", "Open Sans", sans-serif',
        color: C.ink
      });
      txt(c, item.sub, x + 10, y + 31, {
        size: w < 230 ? 7.8 : 8.6,
        color: C.muted
      });
      drawMiniTokens(c, item.tokens, x + w / 2, y + h - 22, item.color, item.from, item.to, item.out);
    }

    function drawHeads(c) {
      var pad = Math.max(16, Math.min(28, W * 0.04));
      var small = W < 620;
      head(c, DE ? "Vier Köpfe, vier Regeln" : "Four heads, four rules", pad, 30, { size: small ? 18 : 22 });
      txt(c, DE ? "Attention wählt die Quelle, OV schreibt den Inhalt." : "Attention selects the source, OV writes the content.", pad, 50, { size: 10.5, color: C.muted });
      accent(c, pad, 64, 38);
      var items = [
        {
          title: "Induction",
          sub: DE ? "A B … A → B" : "A B … A → B",
          color: C.gold,
          tokens: ["A", "B", "A"],
          from: 2, to: 1, out: "B",
          body: DE ? "Der Kopf sucht ein früheres A und attendiert auf das B, das darauf folgte. Die OV-Matrix kopiert B. Das ist ein Sequenzmuster, kein Faktenwissen." : "The head finds an earlier A and attends to the B that followed it. The OV matrix copies B. This is a sequence pattern, not factual knowledge."
        },
        {
          title: DE ? "Duplicate" : "Duplicate",
          sub: DE ? "A … A → Position" : "A … A → position",
          color: C.green,
          tokens: ["A", "B", "A"],
          from: 2, to: 0, out: DE ? "Pos." : "pos.",
          body: DE ? "Der Kopf attendiert auf ein früheres Vorkommen desselben Tokens und kopiert dessen Position. Im IOI-Schaltkreis signalisiert das, dass ein Name wiederholt wurde." : "The head attends to an earlier occurrence of the same token and copies its position. In the IOI circuit this signals that a name was repeated."
        },
        {
          title: "Successor",
          sub: DE ? "4 → 5, Montag → Dienstag" : "4 → 5, Monday → Tuesday",
          color: C.sky,
          tokens: ["4", "5", "6"],
          from: 0, to: 1, out: "+1",
          body: DE ? "Der Kopf erhöht ein geordnetes Token über eine gelernte Richtung. Die Ordnung steht nicht im Kontext; sie ist im Gewicht gelernt. Bei Zahlen, Monaten und Wochentagen funktioniert dieselbe Struktur." : "The head increments an ordered token through a learned direction. The order is not in the context; it is learned in the weights. The same structure works for numbers, months, and weekdays."
        },
        {
          title: "Name-Mover",
          sub: DE ? "Mary … John … Mary" : "Mary … John … Mary",
          color: C.petrol,
          tokens: ["Mary", "John", "Mary"],
          from: 2, to: 0, out: "Mary",
          body: DE ? "Im IOI-Satz attendiert der Name-Mover-Head auf Mary und kopiert sie in die Antwort. S-Inhibition-Heads unterdrücken den wiederholten John. Das ist faktenbezogenes Kopieren, kein Sequenzmuster." : "In the IOI sentence the name-mover head attends to Mary and copies her into the answer. S-inhibition heads suppress the repeated John. This is fact-like copying, not a sequence pattern."
        }
      ];
      var gap = 10;
      var top = 88;
      var detailH = small ? 98 : 112;
      var cardH = Math.max(72, Math.min(102, (H - top - detailH - 26 - gap) / 2));
      var cardW = (W - 2 * pad - gap) / 2;
      headsHits = [];
      for (var i = 0; i < items.length; i++) {
        var col = i % 2;
        var row = Math.floor(i / 2);
        var x = pad + col * (cardW + gap);
        var y = top + row * (cardH + gap);
        headsHits.push({ x: x, y: y, w: cardW, h: cardH, i: i });
        drawHeadCard(c, x, y, cardW, cardH, items[i], i === headsSel);
      }
      var detY = top + 2 * cardH + gap + 6;
      var detX = pad;
      var detW = W - 2 * pad;
      var item = items[headsSel];
      c.save();
      c.fillStyle = V.alpha(C.paper2, 0.9);
      c.fillRect(detX, detY, detW, H - detY - 12);
      c.strokeStyle = V.alpha(item.color, 0.38);
      c.lineWidth = 1;
      c.strokeRect(detX + 0.5, detY + 0.5, detW - 1, H - detY - 13);
      c.restore();
      txt(c, item.title, detX + 10, detY + 14, {
        size: small ? 11 : 12.5,
        font: '700 ' + (small ? 11 : 12.5) + 'px "Barlow", "Open Sans", sans-serif',
        color: C.petrol
      });
      wrapText(c, item.body, detX + 10, detY + 31, detW - 20, small ? 12 : 13, {
        size: small ? 8.2 : 9.2,
        color: C.soft
      });
      txt(c, "Olsson et al. (2022) · Ferrando et al. (2024) · Gould et al. (2023) · Wang et al. (2022)",
        W - pad - 10, H - 18, {
          align: "right",
          size: 7.2,
          color: C.muted
        });
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
      txt(c, "W_O W_V", W - pad - 8, y + 31, {
        align: "right",
        size: 7.8,
        color: C.petrol,
        font: '700 7.8px "Open Sans", sans-serif'
      });
      txt(c, "W_Q^T W_K", x2, y + r2 + 22, {
        align: "center",
        size: 7.8,
        color: C.petrol,
        font: '700 7.8px "Open Sans", sans-serif'
      });
      c.save();
      c.strokeStyle = V.alpha(C.petrol, 0.36);
      c.lineWidth = 1;
      c.setLineDash([3, 4]);
      c.beginPath();
      c.moveTo(kx, y + 8);
      c.lineTo(kx, y + 34);
      c.stroke();
      c.restore();
      txt(c, "K-Composition", kx, y + 46, {
        align: "center",
        size: 7.8,
        color: C.petrol
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
      drawStage(ctx);
      if (mode === "copy") drawCopy(ctx);
      else if (mode === "circuit") drawCircuit(ctx);
      else if (mode === "heads") drawHeads(ctx);
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
      if (next !== "sequence" && next !== "copy" && next !== "circuit" && next !== "heads" && next !== "emergence") return;
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
    canvas.addEventListener("click", function (e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (mode === "copy") {
        for (var cs = 0; cs < copyHits.length; cs++) {
          var ch = copyHits[cs];
          if (x >= ch.x && x <= ch.x + ch.w && y >= ch.y && y <= ch.y + ch.h) {
            copyStep = ch.i;
            draw();
            return;
          }
        }
        return;
      }
      if (mode === "heads") {
        for (var h = 0; h < headsHits.length; h++) {
          var hit = headsHits[h];
          if (x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h) {
            headsSel = hit.i;
            draw();
            return;
          }
        }
        return;
      }
      if (mode !== "sequence" || !seqGeo.xs.length) return;
      if (Math.abs(y - seqGeo.cy) > seqGeo.chipH * 0.7) return;
      var best = -1, bestD = 1e9;
      for (var i = 0; i < seqGeo.xs.length; i++) {
        var d = Math.abs(seqGeo.xs[i] - x);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best >= 0 && bestD <= seqGeo.chipW * 0.8) {
        current = best;
        draw();
      }
    });
    canvas.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (mode === "copy") {
        var overCopy = false;
        for (var cs = 0; cs < copyHits.length; cs++) {
          var ch = copyHits[cs];
          if (x >= ch.x && x <= ch.x + ch.w && y >= ch.y && y <= ch.y + ch.h) { overCopy = true; break; }
        }
        canvas.style.cursor = overCopy ? "pointer" : "";
        return;
      }
      if (mode === "heads") {
        var over = false;
        for (var h = 0; h < headsHits.length; h++) {
          var hit = headsHits[h];
          if (x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h) { over = true; break; }
        }
        canvas.style.cursor = over ? "pointer" : "";
        return;
      }
      if (mode !== "sequence" || !seqGeo.xs.length) { canvas.style.cursor = ""; return; }
      var hit = Math.abs(y - seqGeo.cy) <= seqGeo.chipH * 0.7;
      if (hit) {
        hit = false;
        for (var i = 0; i < seqGeo.xs.length; i++) if (Math.abs(seqGeo.xs[i] - x) <= seqGeo.chipW * 0.8) { hit = true; break; }
      }
      canvas.style.cursor = hit ? "pointer" : "";
    });
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
