(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var V = window.LearnSysVisuals;

  if (!document.getElementById("ls-induction-style")) {
    var st = document.createElement("style");
    st.id = "ls-induction-style";
    st.textContent = '.ls-ind-scene{position:relative;width:100%;height:100%;min-height:360px;overflow:hidden;background:var(--tm-paper,#fff)}.ls-ind-scene .ls-ind-canvas{display:block;width:100%;height:100%;min-height:360px}.ls-ind-tip{position:absolute;z-index:20;max-width:260px;padding:6px 8px;border:1px solid var(--tm-line-strong,#b9c8c3);background:var(--tm-paper,#fff);color:var(--tm-ink,#000);font:12px/1.35 "Open Sans",sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.12);pointer-events:none;opacity:0;transition:opacity .12s;border-radius:4px}.ls-ind-tip.is-on{opacity:1}';
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
    var tipEl = document.createElement("div");
    tipEl.className = "ls-ind-tip";
    host.appendChild(tipEl);
    root.appendChild(host);
    var ctx = canvas.getContext("2d");
    var W = 1, H = 1;
    var mode = "sequence";
    var current = 6;
    var seqGeo = { xs: [], chipW: 0, chipH: 0, cy: 0 };
    var headsSel = 0;
    var hoverHits = [];
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
      var size = small ? 9 : 10;
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

    function drawPatternRow(c, x, w, y, tok, pred, small) {
      var sz = small ? 9 : 10;
      var tokW = pillWidth(c, tok, sz);
      var predW = pillWidth(c, pred, sz);
      var arrowW = 18;
      var gap = 6;
      var ellW = 12;
      var total = 2 * tokW + 2 * predW + 2 * arrowW + ellW + 4 * gap;
      var cx = x + (w - total) / 2;
      function chip(text, width, color, filled, tip) {
        textPill(c, text, cx + width / 2, y, color, filled, sz);
        addHover(cx, y - sz - 3, width, sz * 2 + 6, tip);
        cx += width;
      }
      chip(tok, tokW, C.green, true, DE ? "Früheres „" + tok + "“: Danach kam „" + pred + "“." : "Earlier “" + tok + "”: it was followed by “" + pred + "”.");
      cx += gap;
      var ax0 = cx;
      cx += arrowW;
      V.arrow(c, ax0, y, cx - 2, y, V.alpha(C.green, 0.85), 1.3, 5);
      cx += gap;
      chip(pred, predW, C.lilac, true, DE ? "„" + pred + "“ folgte auf das frühere „" + tok + "“." : "“" + pred + "” followed the earlier “" + tok + "”.");
      cx += gap;
      addHover(cx, y - sz - 3, ellW, sz * 2 + 6, DE ? "Ausgelassene Wörter. Das Muster wiederholt sich." : "Omitted words. The pattern repeats.");
      txt(c, "…", cx + ellW / 2, y, { align: "center", size: sz + 1, color: C.muted });
      cx += ellW + gap;
      chip(tok, tokW, C.gold, true, DE ? "Aktuelles „" + tok + "“." : "Current “" + tok + "”.");
      cx += gap;
      ax0 = cx;
      cx += arrowW;
      V.arrow(c, ax0, y, cx - 2, y, V.alpha(C.gold, 0.85), 1.3, 5);
      cx += gap;
      chip(pred, predW, C.lilac, false, DE ? "Vorhersage: „" + pred + "“, weil das Muster sich wiederholt." : "Prediction: “" + pred + "”, because the pattern repeats.");
      txt(c, DE ? "Muster" : "pattern", x, y - 14, {
        size: small ? 8 : 9, color: C.petrol,
        font: '700 ' + (small ? 8 : 9) + 'px "Open Sans", sans-serif'
      });
    }

    function drawExampleCard(c, x, y, w, h, tok, pred, small) {
      c.save();
      c.fillStyle = V.alpha(C.paper2, 0.9);
      c.fillRect(x, y, w, h);
      c.strokeStyle = V.alpha(C.line, 0.95);
      c.lineWidth = 1;
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      c.restore();
      var yOff = small ? 0 : Math.max(0, (h - 200) / 2);
      txt(c, DE ? "Beispieltext" : "Example text", x + 12, y + yOff + 18, {
        size: small ? 11 : 12.5, color: C.petrol,
        font: '700 ' + (small ? 11 : 12.5) + 'px "Barlow", "Open Sans", sans-serif'
      });
      txt(c, DE ? "Suche das frühere „" + tok + "“ und kopiere, was danach kam." : "Find the earlier “" + tok + "” and copy what followed.", x + 12, y + yOff + 34, {
        size: small ? 9 : 10.5, color: C.petrol,
        font: '600 ' + (small ? 9 : 10.5) + 'px "Open Sans", sans-serif'
      });
      addHover(x + 12, y + yOff + 26, w - 24, 16, DE ? "Die Idee: Suche das frühere „" + tok + "“ und kopiere, was danach kam." : "The idea: find the earlier “" + tok + "” and copy what followed.");

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
      var size = small ? 10 : 13.5;
      var lineH = size * 1.5;
      var textEnd = drawPassage(c, segs, x + 12, y + yOff + 56, w - 24, size, lineH);
      drawLegend(c, x + 12, textEnd + 12, small);
      var py = textEnd + (small ? 30 : 38);
      var nextText = (DE ? "Nächstes Token: " : "next token: ") + pred;
      var nextW = pillWidth(c, nextText, small ? 10.5 : 13) + 8;
      textPill(c, nextText, x + w / 2, py, C.gold, true, small ? 10.5 : 13);
      addHover(x + w / 2 - nextW / 2, py - 12, nextW, 24, DE ? "Vorhersage: „" + pred + "“, weil das Muster sich wiederholt." : "Prediction: “" + pred + "”, because the pattern repeats.");
      addHover(x + 12, y + yOff + 48, w - 24, textEnd - (y + yOff + 48), DE ? "Der Text enthält das Muster: früheres „" + tok + "“ → „" + pred + "“, später wieder „" + tok + "“." : "The text contains the pattern: earlier “" + tok + "” → “" + pred + "”, later “" + tok + "” again.");
      drawPatternRow(c, x + 12, w - 24, py + (small ? 26 : 34), tok, pred, small);
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
        size: 13, color: C.petrol,
        font: '700 13px "Barlow", "Open Sans", sans-serif'
      });
      wrapText(c, DE
        ? "Das Modell setzt ein Muster aus dem Text fort, ohne eine Tabelle. Das ist ein Baustein des In-Context-Lernens."
        : "The model continues a pattern from the text without a table. That is a building block of in-context learning.",
        x + 12, y + yOff + 38, w - 24, 16, { size: 11, color: C.soft });
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
        size: small ? 11 : 12.5, color: C.petrol,
        font: '700 ' + (small ? 11 : 12.5) + 'px "Barlow", "Open Sans", sans-serif'
      });
      if (sub) {
        txt(c, sub, x + w - 10, y + 16, {
          align: "right", size: small ? 8 : 9, color: color,
          font: '700 ' + (small ? 8 : 9) + 'px "Open Sans", sans-serif'
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
          align: "center", size: small ? 8.5 : 9.5, color: color,
          font: '700 ' + (small ? 8.5 : 9.5) + 'px "Open Sans", sans-serif',
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
      var qkvSize = small ? 9.5 : 11;
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
      txt(c, DE ? "Query fragt, Key bietet, Value wird kopiert. Wofür? Muster fortsetzen." : "Query asks, key offers, value is copied. Why? Continue a pattern.", pad, 66, { size: small ? 9 : 10.5, color: C.petrol });
      addHover(qx, qy - 11, qW, 22, DE ? "Query (Frage): Was sucht das aktuelle Token? Hier fragt „" + tok + "“." : "Query (question): what does the current token look for? Here “" + tok + "” asks.");
      addHover(qx + qW + qGap, qy - 11, kW, 22, DE ? "Key (Angebot): Was steht an einer Stelle? An der „" + pred + "“-Stelle: davor " + tok + "." : "Key (offer): what does a position hold? At “" + pred + "”: before " + tok + ".");
      addHover(qx + qW + kW + 2 * qGap, qy - 11, vW, 22, DE ? "Value (Inhalt): Was wird bei einem Treffer kopiert? Hier „" + pred + "“." : "Value (content): what is copied on a match? Here “" + pred + "”.");
      addHover(pad, 58, W - 2 * pad, 16, DE ? "Query fragt, Key bietet, Value wird kopiert. QK wählt die Stelle, OV übernimmt den Inhalt." : "Query asks, key offers, value is copied. QK picks the place, OV takes the content.");
      txt(c, DE ? "Hover für Details" : "hover for details", W - pad, 30, { align: "right", size: small ? 8 : 9, color: C.muted });
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
        drawExampleCard(c, pad, contentTop, leftW, exH, tok, pred, false);
        drawPurposeCard(c, pad, contentTop + exH + gap, leftW, leftH - exH - gap);
        var panelH = (contentBottom - contentTop - 2 * gap) / 3;
        drawLayer1Panel(c, rightX, contentTop, rightW, panelH, tok, pred, false);
        drawLayer2PanelAlone(c, rightX, contentTop + panelH + gap, rightW, panelH, tok, pred, false);
        drawTogetherPanel(c, rightX, contentTop + 2 * (panelH + gap), rightW, panelH, tok, pred, false);
      }
    }

    function drawLayer1Panel(c, x, y, w, h, tok, pred, small) {
      var top = infoPanel(c, x, y, w, h, DE ? "Schicht 1 allein" : "Layer 1 alone", "Previous-Token-Head", C.blue, small);
      addHover(x, y, w, 30, DE ? "Schicht 1: Previous-Token-Head. Sie merkt sich für jede Stelle, welches Token davor kam." : "Layer 1: previous-token head. It records, for each position, which token came before it.");
      wrapText(c, DE ? "Der Head schaut auf das Token davor und schreibt es als Key." : "The head looks at the token before it and writes it as a key.", x + 10, top + 8, w - 20, small ? 11 : 12, { size: small ? 9.5 : 10.5, color: C.soft });
      addHover(x + 10, top + 2, w - 20, 26, DE ? "Sie liest das Token davor und schreibt daraus den Key an die nächste Stelle." : "It reads the previous token and writes it as a key at the next position.");
      var rowY = y + h * 0.54;
      var size = small ? 10.5 : 12;
      var tw = pillWidth(c, tok, size);
      var pw = pillWidth(c, pred, size);
      var gap = Math.max(34, w * 0.18);
      var pairW = tw + pw + gap;
      var tx = x + (w - pairW) / 2 + tw / 2;
      var px = tx + tw / 2 + gap + pw / 2;
      var chipH = size * 1.9;
      textPill(c, tok, tx, rowY, C.green, true, size);
      textPill(c, pred, px, rowY, C.lilac, true, size);
      addHover(tx - tw / 2, rowY - chipH / 2, tw, chipH, DE ? "Früheres " + tok + ": das Token davor." : "Earlier " + tok + ": the token before.");
      addHover(px - pw / 2, rowY - chipH / 2, pw, chipH, DE ? "Stelle von „" + pred + "“. Hier entsteht der Key." : "Position of “" + pred + "”. The key is created here.");
      var keyText = (DE ? "Key: davor " : "key: before ") + tok;
      var keySize = small ? 9 : 10;
      var keyW = pillWidth(c, keyText, keySize) + 4;
      textPill(c, keyText, px, rowY - chipH / 2 - 12, C.sky, false, keySize);
      addHover(px - keyW / 2, rowY - chipH / 2 - 12 - keySize * 0.95 - 2, keyW, keySize * 2, DE ? "Key = gelernte Info, kein Text: „Mein Vorgänger war " + tok + "“." : "Key = learned info, not text: “my predecessor was " + tok + "”.");
      attnArc(c, px, rowY + chipH / 2, tx, rowY + chipH / 2, C.blue, pred + " → " + tok, small, small ? 16 : 22);
      addHover(Math.min(tx, px), rowY + chipH / 2, Math.abs(px - tx), 38, DE ? "Attention der Schicht 1: „" + pred + "“ liest das Token davor, „" + tok + "“." : "Layer-1 attention: “" + pred + "” reads the previous token, “" + tok + "”.");
      txt(c, DE ? "Key = gelernte Info, kein Text. Er steht an „" + pred + "“." : "Key = learned info, not text. It sits at “" + pred + "”.", x + 10, y + h - 10, {
        size: small ? 8.5 : 9.5, color: C.muted
      });
    }

    function drawLayer2PanelAlone(c, x, y, w, h, tok, pred, small) {
      var top = infoPanel(c, x, y, w, h, DE ? "Schicht 2 allein" : "Layer 2 alone", "Induction-Head", C.gold, small);
      addHover(x, y, w, 30, DE ? "Schicht 2: Induction-Head. Sie vergleicht die Query des aktuellen Tokens mit den Keys." : "Layer 2: induction head. It compares the query of the current token with the keys.");
      txt(c, DE ? "Query „" + tok + "“ liest die Keys." : "Query “" + tok + "” reads the keys.", x + 10, top + 8, {
        size: small ? 9.5 : 10.5, color: C.soft
      });
      addHover(x + 10, top + 2, w - 20, 24, DE ? "Die Query fragt: Wo stand davor dasselbe Token? Die Keys antworten mit ihren Vorgängern." : "The query asks: where did the same token stand before? The keys answer with their predecessors.");
      var tokens = [tok, pred, "…", DE ? "der" : "the", tok];
      var keys = ["–", tok, pred, "…", DE ? "der" : "the"];
      var weights = [0.03, 0.82, 0.04, 0.02, 0.09];
      var n = tokens.length;
      var colW = Math.min(78, (w - 20) / n);
      var startX = x + (w - n * colW) / 2;
      var tokenY = y + h * 0.46;
      var keyY = y + h * 0.62;
      var weightY = y + h * 0.80;
      var chipSize = small ? 9.5 : 10.5;
      var cx4 = startX + 4 * colW + colW / 2;
      for (var i = 0; i < n; i++) {
        var cx = startX + i * colW + colW / 2;
        var col = i === 4 ? C.gold : i === 1 ? C.lilac : i === 0 ? C.green : C.lineStrong;
        textPill(c, tokens[i], cx, tokenY, col, i === 0 || i === 1 || i === 4, chipSize);
        var ttip = i === 4 ? (DE ? "Aktuelles " + tok + ": seine Query fragt nach dem früheren Vorkommen." : "Current " + tok + ": its query asks for the earlier occurrence.")
          : i === 1 ? (DE ? pred + ": das Token, das auf das frühere " + tok + " folgte." : pred + ": the token that followed the earlier " + tok + ".")
          : i === 0 ? (DE ? "Früheres " + tok + "." : "Earlier " + tok + ".")
          : (DE ? "Token " + tokens[i] + "." : "Token " + tokens[i] + ".");
        addHover(cx - colW / 2, tokenY - chipSize * 0.95, colW, chipSize * 1.9, ttip);
      }
      txt(c, "Key", x + 10, keyY - 9, {
        size: small ? 8 : 9, color: C.sky,
        font: '700 ' + (small ? 8 : 9) + 'px "Open Sans", sans-serif'
      });
      for (var i = 0; i < n; i++) {
        var cx = startX + i * colW + colW / 2;
        txt(c, keys[i], cx, keyY, {
          align: "center", size: small ? 8.5 : 9.5, color: i === 1 ? C.sky : C.muted,
          font: '700 ' + (small ? 8.5 : 9.5) + 'px "Open Sans", sans-serif'
        });
        addHover(cx - colW / 2, keyY - 9, colW, 18, i === 1
          ? (DE ? "Key bei „" + pred + "“: davor war „" + tok + "“. Deshalb passt die Query." : "Key at “" + pred + "”: before it was “" + tok + "”. That is why the query matches.")
          : (DE ? "Key bei „" + tokens[i] + "“: davor war „" + keys[i] + "“." : "Key at “" + tokens[i] + "”: before it was “" + keys[i] + "”."));
      }
      txt(c, "Gewicht", x + 10, weightY - 9, {
        size: small ? 8 : 9, color: C.muted,
        font: '700 ' + (small ? 8 : 9) + 'px "Open Sans", sans-serif'
      });
      for (var i = 0; i < n; i++) {
        var cx = startX + i * colW + colW / 2;
        var pct = Math.round(weights[i] * 100) + "%";
        txt(c, pct, cx, weightY, {
          align: "center", size: small ? 8.5 : 9.5, color: i === 1 ? C.gold : C.muted,
          font: '700 ' + (small ? 8.5 : 9.5) + 'px "Open Sans", sans-serif'
        });
        addHover(cx - colW / 2, weightY - 9, colW, 18, DE ? "Attention-Gewicht für „" + tokens[i] + "“: " + pct + (i === 1 ? ". Das ist der höchste Wert." : ".") : "Attention weight for “" + tokens[i] + "”: " + pct + (i === 1 ? ". This is the highest value." : "."));
      }
      txt(c, (DE ? "Query: " : "query: ") + tok, cx4, tokenY - chipSize * 0.95 - 9, {
        align: "center", size: small ? 8.5 : 9.5, color: C.gold,
        font: '700 ' + (small ? 8.5 : 9.5) + 'px "Open Sans", sans-serif', bg: C.paper2, bgAlpha: 0.85
      });
      addHover(cx4 - 44, tokenY - chipSize * 0.95 - 20, 88, 18, DE ? "Query des aktuellen „" + tok + "“." : "Query of the current “" + tok + "”.");
      txt(c, DE ? "QK wählt die Stelle von „" + pred + "“; die Zeile summiert zu 100 % (illustrativ)." : "QK selects the “" + pred + "” position; the row sums to 100 % (illustrative).", x + 10, y + h - 10, {
        size: small ? 8.5 : 9.5, color: C.muted
      });
      addHover(x + 10, y + h - 20, w - 20, 18, DE ? "QK berechnet die Scores; Softmax normiert jede Zeile auf 100 %. Die konkreten Zahlen sind illustrativ." : "QK computes the scores; softmax normalises each row to 100 %. The concrete numbers are illustrative.");
    }

    function drawTogetherPanel(c, x, y, w, h, tok, pred, small) {
      var top = infoPanel(c, x, y, w, h, DE ? "Zusammen" : "Together", DE ? "Warum " + pred + "?" : "why " + pred + "?", C.petrol, small);
      addHover(x, y, w, 30, DE ? "Zusammen: Die Attention wählt die Stelle; der OV-Teil addiert den Value." : "Together: attention selects the position; the OV part adds the value.");
      wrapText(c, DE
        ? "Warum „" + pred + "“? Auf das frühere „" + tok + "“ folgte „" + pred + "“. Der OV-Teil addiert diesen Wert an der aktuellen Stelle."
        : "Why “" + pred + "”? The earlier “" + tok + "” was followed by “" + pred + "”. The OV part adds that value at the current position.",
        x + 10, top + 8, w - 20, small ? 11 : 12, { size: small ? 9.5 : 10.5, color: C.soft });
      addHover(x + 10, top + 2, w - 20, 34, DE ? "Grund: Das Muster war früher " + tok + " → " + pred + ". Deshalb wird der Wert " + pred + " kopiert." : "Reason: the pattern was " + tok + " → " + pred + " earlier. That is why the value " + pred + " is copied.");
      var tokens = [tok, pred, "…", DE ? "der" : "the", tok];
      var n = tokens.length;
      var colW = Math.min(78, (w - 20) / n);
      var startX = x + (w - n * colW) / 2;
      var tokenY = y + h * 0.52;
      var chipSize = small ? 9.5 : 10.5;
      var cx1 = startX + 1 * colW + colW / 2;
      var cx4 = startX + 4 * colW + colW / 2;
      for (var i = 0; i < n; i++) {
        var cx = startX + i * colW + colW / 2;
        var col = i === 4 ? C.gold : i === 1 ? C.lilac : i === 0 ? C.green : C.lineStrong;
        textPill(c, tokens[i], cx, tokenY, col, i === 0 || i === 1 || i === 4, chipSize);
      }
      addHover(cx1 - colW / 2, tokenY - chipSize * 0.95, colW, chipSize * 1.9, DE ? "Value an der Trefferstelle: „" + pred + "“." : "Value at the match: “" + pred + "”.");
      addHover(cx4 - colW / 2, tokenY - chipSize * 0.95, colW, chipSize * 1.9, DE ? "Aktuelle Stelle: Hier wird der Value „" + pred + "“ addiert." : "Current position: the value “" + pred + "” is added here.");
      txt(c, (DE ? "Wert: " : "value: ") + pred, cx1, tokenY - chipSize * 0.95 - 9, {
        align: "center", size: small ? 8.5 : 9.5, color: C.lilac,
        font: '700 ' + (small ? 8.5 : 9.5) + 'px "Open Sans", sans-serif'
      });
      txt(c, DE ? "aktuell + " + pred : "current + " + pred, cx4, tokenY - chipSize * 0.95 - 9, {
        align: "center", size: small ? 8.5 : 9.5, color: C.gold,
        font: '700 ' + (small ? 8.5 : 9.5) + 'px "Open Sans", sans-serif'
      });
      attnArc(c, cx1, tokenY + chipSize * 0.95, cx4, tokenY + chipSize * 0.95, C.lilac, DE ? "OV addiert den Wert" : "OV adds the value", small, small ? 16 : 22);
      addHover(Math.min(cx1, cx4), tokenY + chipSize * 0.95, Math.abs(cx4 - cx1), 40, DE ? "OV addiert den Value „" + pred + "“ zum aktuellen Vektor. Dadurch steigt die Wahrscheinlichkeit für „" + pred + "“." : "OV adds the value “" + pred + "” to the current vector. That raises the probability of “" + pred + "”.");
      txt(c, DE ? "Nächstes Token: " + pred : "next token: " + pred, x + w / 2, y + h - 12, {
        align: "center", size: small ? 12 : 14, color: C.petrol,
        font: '700 ' + (small ? 12 : 14) + 'px "Barlow", "Open Sans", sans-serif'
      });
      addHover(x + 20, y + h - 28, w - 40, 24, DE ? "Nächstes Token: „" + pred + "“. Der kopierte Value macht dieses Token wahrscheinlicher." : "Next token: “" + pred + "”. The copied value makes this token more likely.");
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
      var cap = maxW ? 72 : 34;
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
          size: small ? 8.5 : 9.5,
          color: C.petrol,
          font: '700 ' + (small ? 8.5 : 9.5) + 'px "Open Sans", sans-serif'
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
      var ts = w < 230 ? 14 : 15.5;
      txt(c, item.title, x + 10, y + h * 0.36, {
        size: ts,
        font: '700 ' + ts + 'px "Barlow", "Open Sans", sans-serif',
        color: C.ink
      });
      var ss = w < 230 ? 10 : 11;
      wrapText(c, item.sub, x + 10, y + h * 0.60, w - 20, ss * 1.3, {
        size: ss, color: C.muted
      });
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
          tokens: [DE ? "Hund" : "dog", DE ? "bellt" : "barks", "…", DE ? "Hund" : "dog"],
          from: 3, to: 1, out: "",
          pred: DE ? "bellt" : "barks",
          qkv: DE ? "Query: Hund · Key: davor Hund bei bellt · Value: bellt" : "Query: dog · Key: before dog at barks · Value: barks",
          body: DE ? "Sucht ein früheres Hund und schaut auf das bellt danach. Das ist ein Sequenzmuster, kein Faktenwissen." : "Finds an earlier dog and looks at the barks that followed. This is a sequence pattern, not factual knowledge."
        },
        {
          title: DE ? "Duplicate" : "Duplicate",
          sub: DE ? "Lena … Lena → Position" : "Lena … Lena → position",
          color: C.green,
          tokens: ["Lena", "…", "Lena"],
          from: 2, to: 0, out: DE ? "Position" : "position",
          qkv: DE ? "Query: Lena · Key: Lena · Value: Position des früheren Lena" : "Query: Lena · Key: Lena · Value: position of the earlier Lena",
          body: DE ? "Schaut auf ein früheres Vorkommen desselben Tokens und gibt dessen Position weiter. Im IOI-Schaltkreis signalisiert das einen wiederholten Namen." : "Looks at an earlier occurrence of the same token and passes on its position. In the IOI circuit this signals that a name was repeated."
        },
        {
          title: "Successor",
          sub: DE ? "Montag → Dienstag" : "Monday → Tuesday",
          color: C.sky,
          tokens: [DE ? "Mo" : "Mon", DE ? "Di" : "Tue"],
          from: 0, to: 1, out: "+1",
          qkv: DE ? "Query: Montag · Key/Value: gelernte Ordnung +1 → Dienstag" : "Query: Monday · Key/Value: learned order +1 → Tuesday",
          body: DE ? "Erhöht ein geordnetes Token über eine gelernte Richtung. Die Ordnung steht nicht im Text; sie ist im Gewicht gelernt. Bei Zahlen, Monaten und Wochentagen funktioniert dieselbe Struktur." : "Increments an ordered token through a learned direction. The order is not in the text; it is learned in the weights. The same structure works for numbers, months, and weekdays."
        },
        {
          title: "Name-Mover",
          sub: "Mary … John … Mary → Mary",
          color: C.petrol,
          tokens: ["Mary", "John", "Mary"],
          from: 2, to: 0, out: "Mary",
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
        addHover(x, y, cardW, cardH, items[i].title + ": " + items[i].sub + ". " + items[i].qkv);
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
      var tsz = small ? 15 : 17;
      txt(c, item.title, detX + 12, detY + 24, {
        size: tsz,
        font: '700 ' + tsz + 'px "Barlow", "Open Sans", sans-serif',
        color: C.petrol
      });
      var qsz = small ? 10 : 11;
      var qkvEnd = wrapText(c, item.qkv, detX + 12, detY + 48, detW - 24, small ? 12 : 13, {
        size: qsz,
        color: item.color,
        font: '700 ' + qsz + 'px "Open Sans", sans-serif'
      });
      addHover(detX + 10, detY + 38, detW - 20, qkvEnd - detY - 38 + 8, item.qkv);
      var exY = qkvEnd + (small ? 66 : 70);
      var exMax = Math.min(detW - 40, 460);
      drawMiniTokens(c, item.tokens, detX + detW / 2, exY, item.color, item.from, item.to, item.out, exMax);
      var bodyY = exY + (small ? 48 : 54);
      if (item.pred) {
        var predY = exY + (small ? 52 : 56);
        textPill(c, (DE ? "Nächstes Token: " : "next token: ") + item.pred, detX + detW / 2, predY, C.gold, true, small ? 10.5 : 12);
        bodyY = predY + (small ? 26 : 30);
      }
      var bsz = small ? 11 : 12;
      wrapText(c, item.body, detX + 12, bodyY, detW - 24, small ? 13.5 : 14.5, {
        size: bsz, color: C.soft
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
      txt(c, DE ? "Drei Signale, ein Fenster." : "Three signals, one window.", pad, 50, { size: small ? 9.5 : 10.5, color: C.muted });
      accent(c, pad, 64, 38);
      txt(c, DE ? "schematisch" : "schematic", W - pad, 30, { align: "right", size: 8.5, color: C.muted });
      txt(c, DE ? "Alle drei Signale ändern sich im selben Trainingsfenster." : "All three signals change in the same training window.", pad, 80, {
        size: small ? 9 : 10, color: C.soft
      });

      var x0 = pad + (small ? 40 : 54);
      var x1 = W - pad - 10;
      var yTop = 104;
      var yBottom = H - (small ? 78 : 86);
      var gap = small ? 8 : 12;
      var panelH = Math.max(64, (yBottom - yTop - 2 * gap) / 3);
      var pw = x1 - x0;
      var py = [yTop, yTop + panelH + gap, yTop + 2 * (panelH + gap)];
      var wa = x0 + tokenFrac(2.5) * pw;
      var wb = x0 + tokenFrac(5) * pw;
      var wc = (wa + wb) / 2;
      var N = 90;
      var induction = [], icl = [], loss = [], oneLoss = [];
      function smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
      for (var i = 0; i <= N; i++) {
        var t = i / N;
        induction.push(0.10 + 0.70 * sigmoid((t - 0.50) / 0.055));
        icl.push(0.10 + 0.32 * sigmoid((t - 0.56) / 0.065));
        loss.push(3.00 - 0.65 * smooth((t - 0.05) / 0.95) + 0.10 * Math.exp(-Math.pow((t - 0.56) / 0.06, 2)));
        oneLoss.push(3.00 - 0.65 * smooth((t - 0.05) / 0.95));
      }
      var lossBump = loss[Math.round(0.56 * N)];
      function panel(title, color, ticks, unit, py0) {
        c.save();
        c.fillStyle = V.alpha(C.paper2, 0.55);
        c.fillRect(x0, py0, pw, panelH);
        c.strokeStyle = V.alpha(C.line, 0.9);
        c.lineWidth = 1;
        c.strokeRect(x0 + 0.5, py0 + 0.5, pw - 1, panelH - 1);
        c.fillStyle = V.alpha(C.lilac, 0.12);
        c.fillRect(wa, py0, wb - wa, panelH);
        c.strokeStyle = V.alpha(C.lilac, 0.55);
        c.setLineDash([4, 4]);
        c.beginPath();
        c.moveTo(wa, py0);
        c.lineTo(wa, py0 + panelH);
        c.moveTo(wb, py0);
        c.lineTo(wb, py0 + panelH);
        c.stroke();
        c.restore();
        for (var k = 0; k < ticks.length; k++) {
          var gy = py0 + panelH - (k / (ticks.length - 1)) * panelH;
          c.save();
          c.strokeStyle = V.alpha(C.line, 0.5);
          c.setLineDash([2, 5]);
          c.beginPath();
          c.moveTo(x0, gy);
          c.lineTo(x1, gy);
          c.stroke();
          c.restore();
          txt(c, ticks[k], x0 - 7, gy, { align: "right", size: small ? 7.6 : 8.6, color: C.muted });
        }
        txt(c, title, x0 + 8, py0 + 13, {
          size: small ? 9.5 : 11, color: color,
          font: '700 ' + (small ? 9.5 : 11) + 'px "Barlow", "Open Sans", sans-serif',
          bg: C.paper2, bgAlpha: 0.85
        });
        if (unit) txt(c, unit, x1 - 8, py0 + 13, { align: "right", size: small ? 8 : 9, color: C.muted, bg: C.paper2, bgAlpha: 0.85 });
      }
      function line(values, color, width, dashed, py0, min, max) {
        c.save();
        c.strokeStyle = color;
        c.lineWidth = width;
        if (dashed) c.setLineDash([4, 4]);
        c.lineJoin = "round";
        c.lineCap = "round";
        c.beginPath();
        for (var i = 0; i <= N; i++) {
          var x = x0 + (i / N) * pw;
          var v = (values[i] - min) / (max - min);
          var y = py0 + (1 - v) * panelH;
          if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
        c.restore();
      }
      panel(DE ? "Induktionskopf" : "Induction head", C.blue, ["0", DE ? "0,5" : "0.5", "1"], DE ? "Score" : "score", py[0]);
      line(induction, C.blue, 2.4, false, py[0], 0, 1);
      line(new Array(N + 1).fill(0.05), C.muted, 1.2, true, py[0], 0, 1);
      panel(DE ? "In-Context-Learning" : "In-context learning", C.gold, ["0", DE ? "0,25" : "0.25", DE ? "0,5" : "0.5"], "nats", py[1]);
      line(icl, C.gold, 2.4, false, py[1], 0, 0.5);
      line(new Array(N + 1).fill(0.12), C.muted, 1.2, true, py[1], 0, 0.5);
      panel(DE ? "Trainings-Loss" : "Training loss", C.green, [DE ? "2,2" : "2.2", DE ? "2,6" : "2.6", DE ? "3,0" : "3.0"], "nats", py[2]);
      line(loss, C.green, 2.4, false, py[2], 2.2, 3.0);
      line(oneLoss, C.muted, 1.2, true, py[2], 2.2, 3.0);

      txt(c, DE ? "Phase Change · ~2,5–5B Tokens" : "phase change · ~2.5–5B tokens", wc, yTop - 10, {
        align: "center", size: small ? 9 : 10.5, color: C.gold,
        font: '700 ' + (small ? 9 : 10.5) + 'px "Barlow", "Open Sans", sans-serif',
        bg: C.paper, bgAlpha: 0.9
      });
      txt(c, DE ? "< 0,15 nats" : "< 0.15 nats", x0 + 8, py[1] + panelH - (0.15 / 0.5) * panelH - 8, {
        size: small ? 7.6 : 8.6, color: C.gold
      });
      txt(c, DE ? "~0,4 nats" : "~0.4 nats", x1 - 8, py[1] + panelH - (0.40 / 0.5) * panelH - 8, {
        align: "right", size: small ? 7.6 : 8.6, color: C.gold
      });
      txt(c, DE ? "Buckel" : "bump", x0 + 0.56 * pw, py[2] + panelH - ((lossBump - 2.2) / 0.8) * panelH - 10, {
        align: "center", size: small ? 7.6 : 8.6, color: C.green
      });

      var baseY = py[2] + panelH;
      c.save();
      c.strokeStyle = V.alpha(C.lineStrong, 0.9);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x0, baseY + 4);
      c.lineTo(x1, baseY + 4);
      c.stroke();
      c.restore();
      var ticks = [{ v: 1, l: "1B" }, { v: 2.5, l: DE ? "2,5B" : "2.5B" }, { v: 5, l: "5B" }, { v: 10, l: "10B" }];
      for (var k = 0; k < ticks.length; k++) {
        var tx = x0 + tokenFrac(ticks[k].v) * pw;
        c.save();
        c.strokeStyle = V.alpha(C.lineStrong, 0.8);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(tx, baseY + 4);
        c.lineTo(tx, baseY + 8);
        c.stroke();
        c.restore();
        txt(c, ticks[k].l, tx, baseY + 18, { align: "center", size: small ? 7.6 : 8.4, color: C.muted });
      }

      var ly = baseY + 34;
      var l1 = DE ? "mehrschichtiges Modell" : "multi-layer model";
      var l2 = DE ? "1-Schicht-Modell" : "1-layer model";
      var adv = legendWidth(c, l1, small ? 7.8 : 8.6);
      legendItem(c, x0, ly, C.soft, l1, small ? 7.8 : 8.6);
      var lx2 = x0 + adv + 8;
      c.save();
      c.strokeStyle = C.muted;
      c.lineWidth = 1.4;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(lx2, ly);
      c.lineTo(lx2 + 13, ly);
      c.stroke();
      c.restore();
      txt(c, l2, lx2 + 17, ly, { size: small ? 7.8 : 8.6, color: C.soft });
      txt(c, DE
        ? "Vorher: ICL < 0,15 · Im Fenster: Induktionskopf, ICL-Sprung, Loss-Buckel · Nachher: ICL ~0,4 nats."
        : "Before: ICL < 0.15 · In the window: induction head, ICL jump, loss bump · After: ICL ~0.4 nats.",
        pad, ly + 18, { size: small ? 7.2 : 8.2, color: C.muted });
      txt(c, "Olsson et al. (2022), In-context Learning and Induction Heads", pad, H - 10, {
        size: small ? 7 : 7.8, color: C.muted
      });
    }
    function addHover(x, y, w, h, text) {
      if (!text) return;
      hoverHits.push({ x: x, y: y, w: w, h: h, text: text });
    }

    function updateTip(x, y) {
      var hit = null;
      for (var i = hoverHits.length - 1; i >= 0; i--) {
        var h = hoverHits[i];
        if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) { hit = h; break; }
      }
      if (!hit) { tipEl.classList.remove("is-on"); return; }
      tipEl.textContent = hit.text;
      tipEl.classList.add("is-on");
      var left = Math.max(8, Math.min(x + 14, W - 270));
      var top = Math.max(8, Math.min(y + 14, H - 64));
      tipEl.style.left = left + "px";
      tipEl.style.top = top + "px";
    }

    function draw() {
      if (!W || !H) return;
      hoverHits = [];
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
    canvas.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      updateTip(e.clientX - r.left, e.clientY - r.top);
    });
    canvas.addEventListener("pointerleave", function () { tipEl.classList.remove("is-on"); });
    fit();

    return {
      update: function (s) {
        if (s && s.mode) setMode(s.mode);
      },
      next: function () {
        if (mode === "heads" && headsSel < 3) { headsSel += 1; draw(); return true; }
        return false;
      },
      prev: function () {
        if (mode === "heads" && headsSel > 0) { headsSel -= 1; draw(); return true; }
        return false;
      },
      hasNext: function () { return mode === "heads" && headsSel < 3; },
      hasPrev: function () { return mode === "heads" && headsSel > 0; },
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
