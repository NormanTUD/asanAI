(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var V = window.LearnSysVisuals;

  if (!document.getElementById("ls-induction-style")) {
    var st = document.createElement("style");
    st.id = "ls-induction-style";
    st.textContent = '.ls-ind-scene{position:relative;width:100%;height:100%;min-height:360px;overflow:hidden;background:var(--tm-paper,#fff)}.ls-ind-scene .ls-ind-canvas{display:block;width:100%;height:100%;min-height:360px}';
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
        ? "Echter Beispieltext mit Hund und bellt. Links der Text; rechts drei Schritte: Schicht 1 merkt den Vorgänger, Schicht 2 findet den Key, zusammen wird bellt kopiert und vorhergesagt."
        : "Real example text with dog and barks. On the left the text; on the right three steps: layer 1 remembers the predecessor, layer 2 finds the key, together barks is copied and predicted.",
      copy: DE
        ? "Drei Schritte des Kopierens: Vorgänger merken, Stelle finden, kopieren."
        : "Three copying steps: remember the predecessor, find the place, copy.",
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

    function chipBox(c, text, cx, cy, w, h, color, filled, fontSize) {
      c.save();
      c.fillStyle = filled ? V.alpha(color, 0.12) : C.paper;
      c.fillRect(cx - w / 2, cy - h / 2, w, h);
      c.strokeStyle = filled ? color : V.alpha(C.lineStrong, 0.9);
      c.lineWidth = filled ? 1.8 : 1;
      c.strokeRect(cx - w / 2 + 0.5, cy - h / 2 + 0.5, w - 1, h - 1);
      c.fillStyle = C.ink;
      var fs = fontSize || h * 0.5;
      c.font = '700 ' + Math.round(fs) + 'px "Barlow", "Open Sans", sans-serif';
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, cx, cy + 1);
      c.restore();
    }

    function pillWidth(c, text, size) {
      c.save();
      c.font = '700 ' + size + 'px "Barlow", "Open Sans", sans-serif';
      var w = c.measureText(text).width + size * 1.5;
      c.restore();
      return w;
    }

    function textPill(c, text, cx, cy, color, filled, size) {
      var sz = size || 10;
      var w = pillWidth(c, text, sz);
      var h = sz * 1.9;
      c.save();
      c.fillStyle = filled ? V.alpha(color, 0.15) : C.paper;
      c.fillRect(cx - w / 2, cy - h / 2, w, h);
      c.strokeStyle = color;
      c.lineWidth = filled ? 1.6 : 1;
      c.strokeRect(cx - w / 2 + 0.5, cy - h / 2 + 0.5, w - 1, h - 1);
      c.fillStyle = filled ? C.ink : C.soft;
      c.font = '700 ' + sz + 'px "Barlow", "Open Sans", sans-serif';
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, cx, cy + 1);
      c.restore();
      return w;
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

    function drawPassage(c, segs, x, y, maxW, size, lineH) {
      var lx = x, ly = y + size;
      for (var i = 0; i < segs.length; i++) {
        var seg = segs[i];
        var bold = !!seg.c;
        var font = (bold ? '700 ' : '400 ') + size + 'px "Open Sans", "Segoe UI", sans-serif';
        c.save();
        c.font = font;
        var w = c.measureText(seg.t).width;
        var sp = c.measureText(" ").width;
        c.restore();
        var need = (lx > x ? sp : 0) + w;
        if (lx > x && lx + need > x + maxW) {
          ly += lineH;
          lx = x;
        } else if (lx > x) {
          lx += sp;
        }
        if (bold) {
          c.save();
          c.fillStyle = V.alpha(seg.c, 0.16);
          c.fillRect(lx - 1.5, ly - size * 0.92, w + 3, size * 1.2);
          c.restore();
        }
        c.save();
        c.font = font;
        c.fillStyle = bold ? seg.c : C.ink;
        c.textAlign = "left";
        c.textBaseline = "alphabetic";
        c.fillText(seg.t, lx, ly);
        c.restore();
        lx += w;
      }
      return ly + lineH * 0.3;
    }

    function drawLegend(c, x, y, small) {
      var items = [
        [C.green, DE ? "früheres Vorkommen" : "earlier occurrence"],
        [C.lilac, DE ? "was danach kam" : "what followed"],
        [C.gold, DE ? "aktuelles Vorkommen" : "current occurrence"]
      ];
      var cx = x;
      var size = small ? 8 : 9;
      for (var i = 0; i < items.length; i++) {
        c.save();
        c.fillStyle = items[i][0];
        c.beginPath();
        c.arc(cx + 4, y, 3.6, 0, Math.PI * 2);
        c.fill();
        c.restore();
        c.save();
        c.font = '600 ' + size + 'px "Open Sans", sans-serif';
        var tw = c.measureText(items[i][1]).width;
        c.restore();
        txt(c, items[i][1], cx + 11, y, { size: size, color: C.soft, font: '600 ' + size + 'px "Open Sans", sans-serif' });
        cx += 11 + tw + (small ? 10 : 16);
      }
    }

    function drawExampleCard(c, x, y, w, h, pred, small) {
      c.save();
      c.fillStyle = V.alpha(C.paper2, 0.9);
      c.fillRect(x, y, w, h);
      c.strokeStyle = V.alpha(C.line, 0.95);
      c.lineWidth = 1;
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      c.restore();
      var yOff = small ? 0 : Math.max(0, (h - 200) / 2);
      txt(c, DE ? "Beispieltext" : "Example text", x + 12, y + yOff + 18, {
        size: small ? 10 : 11.5, color: C.petrol,
        font: '700 ' + (small ? 10 : 11.5) + 'px "Barlow", "Open Sans", sans-serif'
      });

      var segs = DE ? [
        { t: "Auf" }, { t: "dem" }, { t: "Hof" }, { t: "ist" }, { t: "es" }, { t: "ruhig." },
        { t: "Der" }, { t: "Hund", c: C.green }, { t: "bellt,", c: C.lilac },
        { t: "sobald" }, { t: "die" }, { t: "Katze" }, { t: "den" }, { t: "Hof" }, { t: "betritt." },
        { t: "Die" }, { t: "Katze" }, { t: "erschrickt" }, { t: "und" }, { t: "läuft" }, { t: "davon." },
        { t: "Am" }, { t: "nächsten" }, { t: "Tag" }, { t: "kommt" }, { t: "die" }, { t: "Katze" }, { t: "wieder," },
        { t: "und" }, { t: "der" }, { t: "Hund", c: C.gold }, { t: "…" }
      ] : [
        { t: "The" }, { t: "yard" }, { t: "is" }, { t: "quiet." },
        { t: "The" }, { t: "dog", c: C.green }, { t: "barks", c: C.lilac },
        { t: "whenever" }, { t: "the" }, { t: "cat" }, { t: "enters" }, { t: "the" }, { t: "yard." },
        { t: "The" }, { t: "cat" }, { t: "gets" }, { t: "scared" }, { t: "and" }, { t: "runs" }, { t: "away." },
        { t: "The" }, { t: "next" }, { t: "day" }, { t: "the" }, { t: "cat" }, { t: "comes" }, { t: "back," },
        { t: "and" }, { t: "the" }, { t: "dog", c: C.gold }, { t: "…" }
      ];
      var size = small ? 9.5 : 12;
      var lineH = size * 1.5;
      var textEnd = drawPassage(c, segs, x + 12, y + yOff + 38, w - 24, size, lineH);
      drawLegend(c, x + 12, textEnd + 12, small);
      var py = textEnd + (small ? 30 : 38);
      textPill(c, (DE ? "Nächstes Token: " : "next token: ") + pred, x + w / 2, py, C.gold, true, small ? 9.5 : 11.5);
    }

    function drawPurposeCard(c, x, y, w, h) {
      c.save();
      c.fillStyle = V.alpha(C.paper2, 0.65);
      c.fillRect(x, y, w, h);
      c.strokeStyle = V.alpha(C.line, 0.95);
      c.lineWidth = 1;
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      c.restore();
      var yOff = Math.max(0, (h - 110) / 2);
      txt(c, DE ? "Wofür überhaupt?" : "Why at all?", x + 12, y + yOff + 18, {
        size: 11.5, color: C.petrol,
        font: '700 11.5px "Barlow", "Open Sans", sans-serif'
      });
      wrapText(c, DE
        ? "Das Modell setzt ein Muster aus dem Text fort, ohne eine Tabelle. Das ist ein Baustein des In-Context-Lernens."
        : "The model continues a pattern from the text without a table. That is a building block of in-context learning.",
        x + 12, y + yOff + 38, w - 24, 15, { size: 10, color: C.soft });
    }

    function infoPanel(c, x, y, w, h, title, sub, color, small) {
      c.save();
      c.fillStyle = V.alpha(C.paper2, 0.85);
      c.fillRect(x, y, w, h);
      c.strokeStyle = V.alpha(C.line, 0.9);
      c.lineWidth = 1;
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      c.fillStyle = color;
      c.fillRect(x, y, w, 3);
      c.restore();
      txt(c, title, x + 10, y + 16, {
        size: small ? 9.6 : 10.8, color: C.petrol,
        font: '700 ' + (small ? 9.6 : 10.8) + 'px "Barlow", "Open Sans", sans-serif'
      });
      if (sub) {
        txt(c, sub, x + w - 10, y + 16, {
          align: "right", size: small ? 7.2 : 8, color: color,
          font: '700 ' + (small ? 7.2 : 8) + 'px "Open Sans", sans-serif'
        });
      }
      return y + (small ? 28 : 32);
    }

    function attnArc(c, x1, y1, x2, y2, color, label, small, bow) {
      var midx = (x1 + x2) / 2;
      var midy = Math.max(y1, y2) + (bow || 20);
      c.save();
      c.strokeStyle = color;
      c.lineWidth = 1.6;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x1, y1);
      c.quadraticCurveTo(midx, midy, x2, y2);
      c.stroke();
      c.restore();
      arrowHead(c, x2, y2, x2 - midx, y2 - midy, 6, color);
      if (label) {
        txt(c, label, midx, midy + 11, {
          align: "center", size: small ? 7 : 7.8, color: color,
          font: '700 ' + (small ? 7 : 7.8) + 'px "Open Sans", sans-serif',
          bg: C.paper2, bgAlpha: 0.9
        });
      }
    }

    function drawSequence(c) {
      var pad = Math.max(16, Math.min(28, W * 0.04));
      var small = W < 680;
      var tok = DE ? "Hund" : "dog";
      var pred = DE ? "bellt" : "barks";
      seqGeo = { xs: [], chipW: 0, chipH: 0, cy: 0 };

      head(c, DE ? "Induktion" : "Induction", pad, 26, { size: small ? 18 : 22 });
      var qkvSize = small ? 8.5 : 9.5;
      var qText = (DE ? "Query: " : "query: ") + tok;
      var kText = (DE ? "Key: davor " : "key: before ") + tok;
      var vText = (DE ? "Value: " : "value: ") + pred;
      var qW = pillWidth(c, qText, qkvSize);
      var kW = pillWidth(c, kText, qkvSize);
      var vW = pillWidth(c, vText, qkvSize);
      var qGap = small ? 8 : 12;
      var qTotal = qW + kW + vW + 2 * qGap;
      var qx = (W - qTotal) / 2;
      var qy = 50;
      textPill(c, qText, qx + qW / 2, qy, C.gold, true, qkvSize);
      textPill(c, kText, qx + qW + qGap + kW / 2, qy, C.sky, true, qkvSize);
      textPill(c, vText, qx + qW + kW + 2 * qGap + vW / 2, qy, C.lilac, true, qkvSize);
      txt(c, DE ? "Query fragt, Key bietet, Value wird kopiert. Wofür? Muster fortsetzen." : "Query asks, key offers, value is copied. Why? Continue a pattern.", pad, 66, { size: small ? 8 : 9, color: C.petrol });
      accent(c, pad, 80, 38);

      var contentTop = 94;
      var contentBottom = H - 16;
      var gap = small ? 10 : 16;
      if (small) {
        var ph = (contentBottom - contentTop - 2 * gap) / 3;
        drawLayer1Panel(c, pad, contentTop, W - 2 * pad, ph, tok, pred, true);
        drawLayer2PanelAlone(c, pad, contentTop + ph + gap, W - 2 * pad, ph, tok, pred, true);
        drawTogetherPanel(c, pad, contentTop + 2 * (ph + gap), W - 2 * pad, ph, tok, pred, true);
      } else {
        var leftW = (W - 2 * pad - gap) * 0.44;
        var rightX = pad + leftW + gap;
        var rightW = W - 2 * pad - gap - leftW;
        var leftH = contentBottom - contentTop;
        var exH = Math.min(300, leftH * 0.56);
        drawExampleCard(c, pad, contentTop, leftW, exH, pred, false);
        drawPurposeCard(c, pad, contentTop + exH + gap, leftW, leftH - exH - gap);
        var panelH = (contentBottom - contentTop - 2 * gap) / 3;
        drawLayer1Panel(c, rightX, contentTop, rightW, panelH, tok, pred, false);
        drawLayer2PanelAlone(c, rightX, contentTop + panelH + gap, rightW, panelH, tok, pred, false);
        drawTogetherPanel(c, rightX, contentTop + 2 * (panelH + gap), rightW, panelH, tok, pred, false);
      }
    }

    function drawLayer1Panel(c, x, y, w, h, tok, pred, small) {
      var top = infoPanel(c, x, y, w, h, DE ? "Schicht 1 allein" : "Layer 1 alone", "Previous-Token-Head", C.blue, small);
      wrapText(c, DE ? "Der Head schaut auf das Token davor und schreibt es als Key." : "The head looks at the token before it and writes it as a key.", x + 10, top + 8, w - 20, small ? 11 : 12, { size: small ? 8 : 8.8, color: C.soft });
      var rowY = y + h * 0.48;
      var size = small ? 9.5 : 11;
      var tw = pillWidth(c, tok, size);
      var pw = pillWidth(c, pred, size);
      var gap = Math.max(34, w * 0.18);
      var pairW = tw + pw + gap;
      var tx = x + (w - pairW) / 2 + tw / 2;
      var px = tx + tw / 2 + gap + pw / 2;
      var chipH = size * 1.9;
      textPill(c, tok, tx, rowY, C.green, true, size);
      textPill(c, pred, px, rowY, C.lilac, true, size);
      textPill(c, (DE ? "Key: davor " : "key: before ") + tok, px, rowY - chipH / 2 - 12, C.sky, false, small ? 8 : 9);
      attnArc(c, px, rowY + chipH / 2, tx, rowY + chipH / 2, C.blue, pred + " → " + tok, small, small ? 16 : 22);
      txt(c, DE ? "Key = gelernte Info, kein Text. Er steht an „" + pred + "“." : "Key = learned info, not text. It sits at “" + pred + "”.", x + 10, y + h - 10, {
        size: small ? 7.2 : 8, color: C.muted
      });
    }

    function drawLayer2PanelAlone(c, x, y, w, h, tok, pred, small) {
      var top = infoPanel(c, x, y, w, h, DE ? "Schicht 2 allein" : "Layer 2 alone", "Induction-Head", C.gold, small);
      txt(c, DE ? "Query „" + tok + "“ liest die Keys." : "Query “" + tok + "” reads the keys.", x + 10, top + 8, {
        size: small ? 8 : 8.8, color: C.soft
      });
      var tokens = [tok, pred, "…", DE ? "der" : "the", tok];
      var keys = ["–", tok, pred, "…", DE ? "der" : "the"];
      var weights = [0.03, 0.82, 0.04, 0.02, 0.09];
      var n = tokens.length;
      var colW = Math.min(78, (w - 20) / n);
      var startX = x + (w - n * colW) / 2;
      var tokenY = y + h * 0.44;
      var keyY = y + h * 0.62;
      var weightY = y + h * 0.80;
      var chipSize = small ? 8.5 : 9.5;
      var cx4 = startX + 4 * colW + colW / 2;
      for (var i = 0; i < n; i++) {
        var cx = startX + i * colW + colW / 2;
        var col = i === 4 ? C.gold : i === 1 ? C.lilac : i === 0 ? C.green : C.lineStrong;
        textPill(c, tokens[i], cx, tokenY, col, i === 0 || i === 1 || i === 4, chipSize);
      }
      txt(c, "Key", x + 10, keyY - 9, {
        size: small ? 6.4 : 7, color: C.sky,
        font: '700 ' + (small ? 6.4 : 7) + 'px "Open Sans", sans-serif'
      });
      for (var i = 0; i < n; i++) {
        var cx = startX + i * colW + colW / 2;
        txt(c, keys[i], cx, keyY, {
          align: "center", size: small ? 7.2 : 8, color: i === 1 ? C.sky : C.muted,
          font: '700 ' + (small ? 7.2 : 8) + 'px "Open Sans", sans-serif'
        });
      }
      txt(c, "Gewicht", x + 10, weightY - 9, {
        size: small ? 6.4 : 7, color: C.muted,
        font: '700 ' + (small ? 6.4 : 7) + 'px "Open Sans", sans-serif'
      });
      for (var i = 0; i < n; i++) {
        var cx = startX + i * colW + colW / 2;
        txt(c, Math.round(weights[i] * 100) + "%", cx, weightY, {
          align: "center", size: small ? 7 : 7.8, color: i === 1 ? C.gold : C.muted,
          font: '700 ' + (small ? 7 : 7.8) + 'px "Open Sans", sans-serif'
        });
      }
      txt(c, (DE ? "Query: " : "query: ") + tok, cx4, tokenY - chipSize * 0.95 - 9, {
        align: "center", size: small ? 7.4 : 8.2, color: C.gold,
        font: '700 ' + (small ? 7.4 : 8.2) + 'px "Open Sans", sans-serif', bg: C.paper2, bgAlpha: 0.85
      });
      txt(c, DE ? "Zeile summiert zu 100 %. Der Key bei „" + pred + "“ passt." : "Row sums to 100 %. The key at “" + pred + "” matches.", x + 10, y + h - 10, {
        size: small ? 7 : 7.8, color: C.muted
      });
    }


    function drawTogetherPanel(c, x, y, w, h, tok, pred, small) {
      var top = infoPanel(c, x, y, w, h, DE ? "Zusammen" : "Together", DE ? "Wert kopieren" : "copy the value", C.petrol, small);
      wrapText(c, DE
        ? "Die Attention findet über „" + tok + "“ die Stelle von „" + pred + "“. Der OV-Teil schreibt den Wert dort an die aktuelle Stelle."
        : "The attention finds the “" + pred + "” position via “" + tok + "”. The OV part writes the value there to the current position.",
        x + 10, top + 8, w - 20, small ? 11 : 12, { size: small ? 8 : 8.8, color: C.soft });
      var tokens = [tok, pred, "…", DE ? "der" : "the", tok];
      var n = tokens.length;
      var colW = Math.min(78, (w - 20) / n);
      var startX = x + (w - n * colW) / 2;
      var tokenY = y + h * 0.52;
      var chipSize = small ? 8.5 : 9.5;
      var cx1 = startX + 1 * colW + colW / 2;
      var cx4 = startX + 4 * colW + colW / 2;
      for (var i = 0; i < n; i++) {
        var cx = startX + i * colW + colW / 2;
        var col = i === 4 ? C.gold : i === 1 ? C.lilac : i === 0 ? C.green : C.lineStrong;
        textPill(c, tokens[i], cx, tokenY, col, i === 0 || i === 1 || i === 4, chipSize);
      }
      txt(c, (DE ? "Wert: " : "value: ") + pred, cx1, tokenY - chipSize * 0.95 - 9, {
        align: "center", size: small ? 7.4 : 8.2, color: C.lilac,
        font: '700 ' + (small ? 7.4 : 8.2) + 'px "Open Sans", sans-serif'
      });
      txt(c, DE ? "aktuell" : "current", cx4, tokenY - chipSize * 0.95 - 9, {
        align: "center", size: small ? 7.4 : 8.2, color: C.gold,
        font: '700 ' + (small ? 7.4 : 8.2) + 'px "Open Sans", sans-serif'
      });
      attnArc(c, cx1, tokenY + chipSize * 0.95, cx4, tokenY + chipSize * 0.95, C.lilac, DE ? "OV kopiert den Wert" : "OV copies the value", small, small ? 16 : 22);
      txt(c, DE ? "Nächstes Token: " + pred : "next token: " + pred, x + w / 2, y + h - 12, {
        align: "center", size: small ? 10 : 11.5, color: C.petrol,
        font: '700 ' + (small ? 10 : 11.5) + 'px "Barlow", "Open Sans", sans-serif'
      });
    }

    function drawStage(c) {
      V.aurora(c, W, H, C, { vignette: 0.10 });
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

    function drawMiniTokens(c, tokens, cx, cy, color, from, to, outText, maxW) {
      var gap = 4;
      var avail = maxW || (W * 0.22);
      var cap = maxW ? 48 : 34;
      var cw = Math.max(22, Math.min(cap, (avail - (tokens.length - 1) * gap) / Math.max(1, tokens.length)));
      var ch = Math.round(cw * 0.94);
      var total = tokens.length * cw + (tokens.length - 1) * gap;
      var x0 = cx - total / 2;
      var xs = [];
      for (var i = 0; i < tokens.length; i++) {
        var x = x0 + i * (cw + gap) + cw / 2;
        xs.push(x);
        var on = i === from || i === to;
        var fs = Math.min(ch * 0.5, (cw - 6) / (Math.max(2, tokens[i].length) * 0.6));
        chipBox(c, tokens[i], x, cy, cw, ch, on ? color : C.lineStrong, on, fs);
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
          txt(c, outText, (ax + bx) / 2, ay - 24, {
            align: "center",
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
          title: DE ? "Vorgänger merken" : "Remember predecessor",
          body: DE ? "Ein Hilfskopf merkt sich: Vor diesem Token kam A." : "A helper head remembers: before this token came A.",
          color: C.green,
          matrix: "W_K",
          from: 3, to: 4
        },
        {
          n: "2",
          title: DE ? "Stelle finden" : "Find the place",
          body: DE ? "Der Induktionskopf findet das frühere A und schaut auf B." : "The induction head finds the earlier A and looks at B.",
          color: C.gold,
          matrix: "W_Q^T W_K",
          from: 6, to: 4
        },
        {
          n: "3",
          title: DE ? "Kopieren" : "Copy",
          body: DE ? "Die OV-Matrix kopiert B an die neue Stelle. Der Logit von B steigt." : "The OV matrix copies B to the new place. B's logit rises.",
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
        drawMiniTokens(c, row.mini || ["A", "B"], miniX, y + rowH - 30, row.color,
          typeof row.miniFrom === "number" ? row.miniFrom : (row.from === 4 ? 1 : 0),
          typeof row.miniTo === "number" ? row.miniTo : (row.to === 4 ? 1 : 0),
          "");
        txt(c, row.matrix, W - pad - 4, y + rowH - 42, {
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
      drawMiniTokens(c, item.tokens, x + w / 2, y + h - 26, item.color, item.from, item.to, "", w - 20);
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
          sub: DE ? "Hund bellt … Hund → bellt" : "dog barks … dog → barks",
          color: C.gold,
          tokens: [DE ? "Hund" : "dog", DE ? "bellt" : "barks", DE ? "Hund" : "dog"],
          from: 2, to: 1,
          qkv: DE ? "Query: Hund · Key: davor Hund bei bellt · Value: bellt" : "Query: dog · Key: before dog at barks · Value: barks",
          body: DE ? "Sucht ein früheres Hund und schaut auf das bellt danach. Das ist ein Sequenzmuster, kein Faktenwissen." : "Finds an earlier dog and looks at the barks that followed. This is a sequence pattern, not factual knowledge."
        },
        {
          title: DE ? "Duplicate" : "Duplicate",
          sub: DE ? "Anna … Anna → Position" : "Anna … Anna → position",
          color: C.green,
          tokens: ["Anna", "…", "Anna"],
          from: 2, to: 0,
          qkv: DE ? "Query: Anna · Key: Anna · Value: Position des früheren Anna" : "Query: Anna · Key: Anna · Value: position of the earlier Anna",
          body: DE ? "Schaut auf ein früheres Vorkommen desselben Tokens und gibt dessen Position weiter. Im IOI-Schaltkreis signalisiert das einen wiederholten Namen." : "Looks at an earlier occurrence of the same token and passes on its position. In the IOI circuit this signals that a name was repeated."
        },
        {
          title: "Successor",
          sub: DE ? "Montag → Dienstag" : "Monday → Tuesday",
          color: C.sky,
          tokens: [DE ? "Mo" : "Mon", DE ? "Di" : "Tue"],
          from: 0, to: 1,
          qkv: DE ? "Query: Montag · Key/Value: gelernte Ordnung +1 → Dienstag" : "Query: Monday · Key/Value: learned order +1 → Tuesday",
          body: DE ? "Erhöht ein geordnetes Token über eine gelernte Richtung. Die Ordnung steht nicht im Text; sie ist im Gewicht gelernt. Bei Zahlen, Monaten und Wochentagen funktioniert dieselbe Struktur." : "Increments an ordered token through a learned direction. The order is not in the text; it is learned in the weights. The same structure works for numbers, months, and weekdays."
        },
        {
          title: "Name-Mover",
          sub: "Mary … John … Mary → Mary",
          color: C.petrol,
          tokens: ["Mary", "John", "Mary"],
          from: 2, to: 0,
          qkv: DE ? "Query: Frage nach Mary · Key: Mary im Text · Value: Mary" : "Query: question about Mary · Key: Mary in the text · Value: Mary",
          body: DE ? "Im IOI-Satz schaut der Name-Mover-Head auf Mary und kopiert sie in die Antwort. S-Inhibition-Heads unterdrücken den wiederholten John. Das ist faktenbezogenes Kopieren, kein Sequenzmuster." : "In the IOI sentence the name-mover head looks at Mary and copies her into the answer. S-inhibition heads suppress the repeated John. This is fact-like copying, not a sequence pattern."
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
      var qkvEnd = wrapText(c, item.qkv, detX + 10, detY + 30, detW - 20, small ? 10 : 11, {
        size: small ? 7.6 : 8.4,
        color: item.color,
        font: '700 ' + (small ? 7.6 : 8.4) + 'px "Open Sans", sans-serif'
      });
      wrapText(c, item.body, detX + 10, qkvEnd + 4, detW - 20, small ? 12 : 13, {
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
      head(c, DE ? "Zwei Schichten, ein Trick" : "Two layers, one trick", pad, 30, { size: small ? 17 : 21 });
      txt(c, DE ? "A und B sind Platzhalter für beliebige Wörter." : "A and B are placeholders for arbitrary words.", pad, 50, { size: 10.5, color: C.muted });
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

      txt(c, DE ? "Schicht 1 · Vorgänger merken" : "Layer 1 · remember predecessor", x1, y - 66, { align: "center", size: 8.2, color: C.muted });
      txt(c, DE ? "Schicht 2 · Stelle finden & kopieren" : "Layer 2 · find & copy", x2, y - 66, { align: "center", size: 8.2, color: C.muted });
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
      txt(c, "K-Composition: der Key kennt den Vorgänger", kx, y + 46, {
        align: "center",
        size: 7.8,
        color: C.petrol
      });
      txt(c, DE ? "1 Vorgänger merken   2 frühere A-Stelle finden   3 B kopieren" : "1 remember predecessor   2 find earlier A   3 copy B", W / 2, H - 18, {
        align: "center",
        size: small ? 7.4 : 8.4,
        color: C.muted
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
