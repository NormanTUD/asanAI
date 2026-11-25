(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function residualScene(root, api) {
    var DE = api.lang === "de";
    var V = api.visual || window.LearnSysVisuals;
    var ease = core.ease;
    var clamp = core.clamp;
    var SENTENCE = DE ? "Die Katze saß auf der Matte weil sie müde war" : "The cat sat on the mat because she was tired";
    var SENTENCE_PAIRS = DE
      ? [["Die", ""], ["Katze", "att"], ["saß", "ffn"], ["auf", ""], ["der", ""], ["Matte", ""], ["weil", ""], ["sie", "att"], ["müde", "ffn"], ["war", ""]]
      : [["The", ""], ["cat", "att"], ["sat", "ffn"], ["on", ""], ["the", ""], ["mat", ""], ["because", ""], ["she", "att"], ["was", "ffn"], ["tired", ""]];
    var NOTE_LAYERS = [
      {
        name: DE ? "Schicht 1" : "Layer 1",
        desc: DE ? "Erkennt die grundlegendsten Bausteine: Was ist ein Nomen? Ein Verb? Ein Artikel?" : "Finds the basic building blocks: what is a noun, a verb, an article?",
        draw: function (g, r, col, C, fs) {
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (i) { underline(g, r, i, col, fs); });
          scribble(g, r, 2, col, "VERB!", fs, -0.08);
          scribble(g, r, 6, col, DE ? "Konjunktion" : "conjunction", fs, 0.06);
          scribble(g, r, 8, col, DE ? "auch Verb" : "also a verb", fs, 0.06);
          label(g, r, 0, DE ? "Artikel" : "article", col, fs);
          label(g, r, 1, DE ? "Nomen" : "noun", col, fs);
          label(g, r, 3, DE ? "Präp." : "prep.", col, fs);
          label(g, r, 4, DE ? "Artikel" : "article", col, fs);
        }
      },
      {
        name: DE ? "Schicht 2" : "Layer 2",
        desc: DE ? "Erkennt Satzglieder, Subjekt-Verb-Beziehungen und Phrasenstruktur." : "Finds sentence parts, subject-verb relations and phrase structure.",
        draw: function (g, r, col, C, fs) {
          bracket(g, r, 0, 1, col, DE ? "Subjekt" : "subject", fs);
          arrow(g, r, 2, 1, col, DE ? "Verb → Subjekt" : "verb → subject", fs);
          bracket(g, r, 3, 5, col, DE ? "Präpositionalphrase" : "prepositional phrase", fs, 1);
          box(g, r, 6, 9, col, DE ? "Nebensatz (kausal)" : "subordinate clause", fs, 1);
          scribble(g, r, 2, col, "V2", fs, -0.04);
          scribble(g, r, 6, col, DE ? "Verb am Ende" : "verb at the end", fs, 0.05);
        }
      },
      {
        name: DE ? "Schicht 3" : "Layer 3",
        desc: DE ? "Löst Pronomen auf: Wer ist „sie“? Worauf bezieht sich was?" : "Resolves pronouns: who is “she”? What refers to what?",
        draw: function (g, r, col, C, fs) {
          highlight(g, r, 7, 7, col, 0.16, fs);
          circleWord(g, r, 7, col, fs);
          circleWord(g, r, 1, col, fs);
          arrow(g, r, 7, 1, col, DE ? "sie → Katze" : "she → cat", fs);
          strike(g, r, 5, col, fs);
          scribble(g, r, 5, col, DE ? "Matte kann nicht müde sein" : "a mat cannot be tired", fs, 0.08);
        }
      },
      {
        name: DE ? "Schicht 4" : "Layer 4",
        desc: DE ? "Versteht Bedeutungsbeziehungen, Kausalität und semantische Rollen." : "Understands meaning relations, causality and semantic roles.",
        draw: function (g, r, col, C, fs) {
          arrow(g, r, 8, 2, col, DE ? "Grund → Handlung" : "reason → action", fs);
          box(g, r, 0, 9, col, DE ? "Kohärentes Narrativ" : "coherent narrative", fs, 1);
          scribble(g, r, 8, col, DE ? "müde → saß" : "tired → sat", fs, -0.05);
          scribble(g, r, 2, col, DE ? "semantische Rolle" : "semantic role", fs, 0.07);
        }
      },
      {
        name: DE ? "Schicht 5" : "Layer 5",
        desc: DE ? "Versteht den kommunikativen Zweck und bereitet die Vorhersage des nächsten Tokens vor." : "Understands the communicative purpose and prepares the next-token prediction.",
        draw: function (g, r, col, C, fs) {
          highlight(g, r, 8, 9, col, 0.18, fs);
          box(g, r, 8, 9, col, DE ? "Fokus" : "focus", fs, 1);
          scribble(g, r, 9, col, DE ? "Fokus: neue Information" : "focus: new information", fs, -0.07);
          arrow(g, r, 9, 1, col, DE ? "Vorhersage" : "prediction", fs);
        }
      }
    ];
    var STREAM_LAYERS = [
      "Start",
      DE ? "Attention + FFN 1" : "Attention + FFN 1",
      DE ? "Attention + FFN 2" : "Attention + FFN 2"
    ];
    var START_BASE = [0.46, 0.24, 0.34, 0.18, 0.56, 0.30];
    var LAYER_UPDATES = [
      {
        attn: [0.50, 0.20, 0.15, 0.30, 0.04, 0.25],
        ffn: [0.30, 0.10, 0.05, 0.20, 0.06, 0.15]
      },
      {
        attn: [0.25, 0.30, 0.18, 0.20, 0.35, 0.10],
        ffn: [0.15, 0.20, 0.12, 0.20, 0.25, 0.10]
      }
    ];
    var el = document.createElement("div");
    el.className = "ls-res-scene";
    el.innerHTML =
      '<div class="ls-res-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-res-toolbar"><div class="ls-res-phases" role="group" aria-label="' + (DE ? "Ansicht" : "View") + '"></div><div class="ls-scene-row ls-res-layers"></div></div>' +
      '<div class="ls-res-readout" aria-live="polite"></div>' +
      '<p class="ls-res-caption"></p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-res-stage");
    var canvas = el.querySelector("canvas");
    var phaseRow = el.querySelector(".ls-res-phases");
    var layerRow = el.querySelector(".ls-res-layers");
    var readout = el.querySelector(".ls-res-readout");
    var caption = el.querySelector(".ls-res-caption");
    caption.setAttribute("data-tip", DE ? "Ordnet die Ansicht didaktisch ein." : "Gives the didactic framing of the view.");
    var size = null;
    var phase = "notebook";
    var layer = 0;
    var streamLayer = 0;
    var separate = false;
    var noteStart = 0;
    var noteProgress = 1;
    var baseShown = START_BASE.slice(), attnShown = zeros(), ffnShown = zeros();
    var baseFrom = START_BASE.slice(), attnFrom = zeros(), ffnFrom = zeros();
    var baseTarget = START_BASE.slice(), attnTarget = zeros(), ffnTarget = zeros();
    var streamStart = 0;
    var selectedDim = 0;
    var hoverDim = -1;
    var barHits = [];
    var running = true;
    var raf = 0;
    var reduced = !!api.reducedMotion;

    function zeros() { return [0, 0, 0, 0, 0, 0]; }
    function addInto(target, source) {
      for (var i = 0; i < 6; i++) target[i] += source[i];
      return target;
    }
    function totalAt(n) {
      var v = START_BASE.slice();
      for (var i = 0; i < n; i++) {
        addInto(v, LAYER_UPDATES[i].attn);
        addInto(v, LAYER_UPDATES[i].ffn);
      }
      return v;
    }
    function partsAt(n) {
      if (n <= 0) return { base: START_BASE.slice(), attn: zeros(), ffn: zeros() };
      var base = totalAt(n - 1);
      var u = LAYER_UPDATES[n - 1];
      return { base: base, attn: u.attn.slice(), ffn: u.ffn.slice() };
    }
    function totalParts(parts) {
      var v = zeros();
      addInto(v, parts.base);
      addInto(v, parts.attn);
      addInto(v, parts.ffn);
      return v;
    }
    function maxTotal() {
      var best = 0;
      for (var n = 0; n < STREAM_LAYERS.length; n++) {
        var p = partsAt(n);
        var t = totalParts(p);
        for (var j = 0; j < 6; j++) best = Math.max(best, t[j]);
      }
      return Math.max(1, best);
    }
    function noteColors(C) { return [C.green, C.blue, C.gold, C.lilac, C.sky]; }
    function streamColors(C) { return [C.sky, C.green, C.gold]; }
    function pal() {
      var C = api.colors();
      return {
        paper: C.paper,
        paper2: C.paper2,
        ink: C.ink,
        soft: C.soft,
        muted: C.muted,
        line: C.line,
        lineStrong: C.lineStrong,
        petrol: C.petrol,
        green: C.green,
        blue: C.blue,
        sky: C.sky,
        gold: C.gold,
        lilac: C.lilac
      };
    }
    function rr(g, x, y, w, h, r) {
      var rad = Math.min(r || 0, Math.min(w, h) / 2);
      g.beginPath();
      g.moveTo(x + rad, y);
      g.lineTo(x + w - rad, y);
      g.quadraticCurveTo(x + w, y, x + w, y + rad);
      g.lineTo(x + w, y + h - rad);
      g.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      g.lineTo(x + rad, y + h);
      g.quadraticCurveTo(x, y + h, x, y + h - rad);
      g.lineTo(x, y + rad);
      g.quadraticCurveTo(x, y, x + rad, y);
      g.closePath();
    }
    function wordRects(g, x0, yTop, maxWidth, fs, yBottom) {
      var words = SENTENCE.split(" ");
      var lineH = Math.max(fs * 1.7, 56);
      var space = g.measureText(" ").width;
      var lines = [];
      var line = { words: [], width: 0 };
      words.forEach(function (word) {
        var wordW = g.measureText(word).width;
        if (line.words.length && line.width + space + wordW > maxWidth) {
          lines.push(line);
          line = { words: [], width: 0 };
        }
        if (line.words.length) line.width += space;
        line.words.push({ word: word, w: wordW });
        line.width += wordW;
      });
      if (line.words.length) lines.push(line);
      var rects = [];
      var blockH = (lines.length - 1) * lineH + fs;
      var y = (yTop + yBottom) / 2 - blockH / 2 + fs * 0.8;
      lines.forEach(function (ln) {
        var x = x0 + Math.max(0, (maxWidth - ln.width) / 2);
        ln.words.forEach(function (item) {
          rects.push({ word: item.word, x: x, y: y, w: item.w, i: rects.length });
          x += item.w + space;
        });
        y += lineH;
      });
      return rects;
    }
    function underline(g, r, i, col, fs) {
      var q = r[i]; if (!q) return;
      g.strokeStyle = col; g.globalAlpha = 0.82; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(q.x, q.y + 5); g.lineTo(q.x + q.w, q.y + 5); g.stroke();
      g.globalAlpha = 1;
    }
    function label(g, r, i, text, col, fs) {
      var q = r[i]; if (!q) return;
      g.fillStyle = col; g.font = "600 " + Math.max(8, fs * 0.48) + "px 'Open Sans', sans-serif";
      g.textAlign = "center"; g.textBaseline = "bottom";
      g.fillText(text, q.x + q.w / 2, q.y - fs * 0.9);
      g.textAlign = "left"; g.textBaseline = "alphabetic";
    }
    function scribble(g, r, i, col, text, fs, rot) {
      var q = r[i]; if (!q) return;
      g.save();
      g.translate(q.x + q.w / 2, q.y - fs * 1.15);
      g.rotate(rot || 0);
      g.fillStyle = col; g.font = "italic 600 " + Math.max(8, fs * 0.52) + "px 'Courier New', monospace";
      g.textAlign = "center"; g.textBaseline = "bottom";
      g.fillText(text, 0, 0);
      g.restore();
      g.textAlign = "left"; g.textBaseline = "alphabetic";
    }
    function highlight(g, r, a, b, col, alpha, fs) {
      var q1 = r[a], q2 = r[b]; if (!q1 || !q2) return;
      g.fillStyle = col; g.globalAlpha = alpha;
      g.fillRect(q1.x - 3, q1.y - fs * 0.85, q2.x + q2.w - q1.x + 6, fs * 1.15);
      g.globalAlpha = 1;
    }
    function bracket(g, r, a, b, col, text, fs, below) {
      var q1 = r[a], q2 = r[b]; if (!q1 || !q2) return;
      var y = below ? q2.y + 14 : q1.y - fs * 0.95;
      g.strokeStyle = col; g.lineWidth = 1.3; g.globalAlpha = 0.8;
      g.beginPath();
      g.moveTo(q1.x, y + (below ? -5 : 5));
      g.lineTo(q1.x, y);
      g.lineTo(q2.x + q2.w, y);
      g.lineTo(q2.x + q2.w, y + (below ? -5 : 5));
      g.stroke();
      g.globalAlpha = 1;
      g.fillStyle = col; g.font = "600 " + Math.max(8, fs * 0.5) + "px 'Open Sans', sans-serif";
      g.textAlign = "center"; g.textBaseline = below ? "top" : "bottom";
      g.fillText(text, (q1.x + q2.x + q2.w) / 2, y + (below ? 3 : -2));
      g.textAlign = "left"; g.textBaseline = "alphabetic";
    }
    function box(g, r, a, b, col, text, fs, below) {
      var q1 = r[a], q2 = r[b]; if (!q1 || !q2) return;
      var top = q1.y - fs * 0.95;
      var bottom = q2.y + 8;
      g.strokeStyle = col; g.lineWidth = 1.2; g.globalAlpha = 0.75;
      g.strokeRect(q1.x - 5, top, q2.x + q2.w - q1.x + 10, bottom - top);
      g.globalAlpha = 1;
      g.fillStyle = col; g.font = "600 " + Math.max(8, fs * 0.5) + "px 'Open Sans', sans-serif";
      g.textAlign = "center"; g.textBaseline = "bottom";
      g.fillText(text, (q1.x + q2.x + q2.w) / 2, top - 3);
      g.textAlign = "left"; g.textBaseline = "alphabetic";
    }
    function arrow(g, r, a, b, col, text, fs) {
      var q1 = r[a], q2 = r[b]; if (!q1 || !q2) return;
      var x1 = q1.x + q1.w / 2, y1 = q1.y - fs * 0.55;
      var x2 = q2.x + q2.w / 2, y2 = q2.y - fs * 0.55;
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1.4; g.globalAlpha = 0.85;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      var ang = Math.atan2(y2 - y1, x2 - x1);
      var ah = Math.max(5, fs * 0.28);
      g.beginPath();
      g.moveTo(x2, y2);
      g.lineTo(x2 - ah * Math.cos(ang - 0.42), y2 - ah * Math.sin(ang - 0.42));
      g.lineTo(x2 - ah * Math.cos(ang + 0.42), y2 - ah * Math.sin(ang + 0.42));
      g.closePath(); g.fill();
      g.globalAlpha = 1;
      g.font = "600 " + Math.max(8, fs * 0.48) + "px 'Open Sans', sans-serif";
      g.textAlign = "center"; g.textBaseline = "bottom";
      g.fillText(text, (x1 + x2) / 2, Math.min(y1, y2) - 4);
      g.textAlign = "left"; g.textBaseline = "alphabetic";
    }
    function strike(g, r, i, col, fs) {
      var q = r[i]; if (!q) return;
      g.strokeStyle = col; g.lineWidth = 1.5; g.globalAlpha = 0.8;
      g.beginPath(); g.moveTo(q.x - 2, q.y - fs * 0.3); g.lineTo(q.x + q.w + 2, q.y - fs * 0.3); g.stroke();
      g.globalAlpha = 1;
    }
    function circleWord(g, r, i, col, fs) {
      var q = r[i]; if (!q) return;
      g.strokeStyle = col; g.lineWidth = 1.3; g.globalAlpha = 0.85;
      g.beginPath();
      g.ellipse(q.x + q.w / 2, q.y - fs * 0.28, q.w / 2 + 5, fs * 0.62, 0, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 1;
    }
    function drawBackdrop(C, w, h, g) {
      g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
      var bg = g.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, V.alpha(C.paper2, 0.95));
      bg.addColorStop(0.55, V.alpha(C.paper, 0.55));
      bg.addColorStop(1, V.alpha(C.paper2, 0.75));
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      var glow = g.createRadialGradient(w * 0.28, h * 0.15, 8, w * 0.28, h * 0.15, Math.max(w, h) * 0.7);
      glow.addColorStop(0, V.alpha(C.green, 0.045));
      glow.addColorStop(1, V.alpha(C.paper, 0));
      g.fillStyle = glow; g.fillRect(0, 0, w, h);
      V.grid(g, w, h, C, 28, 0.055);
    }
    function drawNotebook(C, w, h, g) {
      var pad = Math.max(10, Math.min(18, w * 0.022));
      var cardX = pad, cardY = pad, cardW = w - pad * 2, cardH = h - pad * 2;
      var colors = noteColors(C);
      g.save();
      g.shadowColor = V.alpha(C.petrol, 0.16);
      g.shadowBlur = 20;
      g.shadowOffsetY = 7;
      g.fillStyle = C.paper;
      g.fillRect(cardX, cardY, cardW, cardH);
      g.restore();
      g.strokeStyle = V.alpha(C.lineStrong, 0.75);
      g.lineWidth = 1;
      g.strokeRect(cardX + 0.5, cardY + 0.5, cardW - 1, cardH - 1);
      g.save();
      g.beginPath();
      g.rect(cardX + 1, cardY + 1, cardW - 2, cardH - 2);
      g.clip();
      var paper = g.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
      paper.addColorStop(0, V.alpha(C.paper2, 0.7));
      paper.addColorStop(1, V.alpha(C.paper, 0.2));
      g.fillStyle = paper; g.fillRect(cardX, cardY, cardW, cardH);
      g.strokeStyle = V.alpha(C.line, 0.42);
      g.lineWidth = 1;
      for (var yy = cardY + 76; yy < cardY + cardH - 12; yy += 26) {
        g.beginPath(); g.moveTo(cardX + 14, yy); g.lineTo(cardX + cardW - 14, yy); g.stroke();
      }
      g.strokeStyle = V.alpha(C.lilac, 0.28);
      g.beginPath(); g.moveTo(cardX + 34, cardY + 14); g.lineTo(cardX + 34, cardY + cardH - 14); g.stroke();
      for (var hole = 0; hole < 7; hole++) {
        g.fillStyle = V.alpha(C.paper2, 0.9);
        g.strokeStyle = V.alpha(C.lineStrong, 0.45);
        g.beginPath();
        g.arc(cardX + 17, cardY + 58 + hole * ((cardH - 90) / 7), 2.5, 0, Math.PI * 2);
        g.fill(); g.stroke();
      }
      var tabX = cardX + cardW - 17;
      var tabH = Math.max(16, Math.min(34, (cardH - 110) / 5 - 5));
      var tabGap = 5;
      for (var t = 0; t < NOTE_LAYERS.length; t++) {
        var ti = t + 1;
        var active = ti === layer;
        var ty = cardY + 88 + t * (tabH + tabGap);
        g.fillStyle = V.alpha(colors[t], active ? 0.95 : 0.32);
        g.fillRect(tabX - (active ? 7 : 0), ty, 12 + (active ? 7 : 0), tabH);
        g.fillStyle = active ? C.paper : V.alpha(C.ink, 0.55);
        g.font = "700 " + Math.max(8, Math.min(11, tabH * 0.42)) + "px 'Barlow', sans-serif";
        g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(String(ti), tabX + 6, ty + tabH / 2 + 0.5);
      }
      var titleSize = Math.max(13, Math.min(19, cardW * 0.024));
      g.fillStyle = C.ink;
      g.font = '700 ' + titleSize + 'px "Barlow", sans-serif';
      g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.fillText(DE ? "Das gemeinsame Notizbuch" : "The shared notebook", cardX + 48, cardY + 30);
      if (cardW > 420) {
        g.fillStyle = C.muted;
        g.font = '600 ' + Math.max(9, titleSize * 0.56) + 'px "Open Sans", sans-serif';
        g.fillText(DE ? "Jede Schicht liest den Stand und schreibt ihre Beobachtung dazu." : "Every layer reads the state and writes its observation into it.", cardX + 48, cardY + 47);
      }
      if (cardW > 340) {
        var badgeW = cardW > 520 ? 108 : 92;
        var badgeX = cardX + cardW - badgeW - 16;
        g.fillStyle = layer ? V.alpha(colors[layer - 1], 0.14) : V.alpha(C.line, 0.35);
        g.fillRect(badgeX, cardY + 14, badgeW, 28);
        g.strokeStyle = layer ? V.alpha(colors[layer - 1], 0.65) : V.alpha(C.lineStrong, 0.6);
        g.strokeRect(badgeX + 0.5, cardY + 14.5, badgeW - 1, 27);
        g.fillStyle = C.ink;
        g.font = '700 ' + Math.max(8, Math.min(11, cardW * 0.015)) + 'px "Open Sans", sans-serif';
        g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(layer ? (DE ? "Schicht " : "Layer ") + layer + " / 5" : (DE ? "Tokens" : "Tokens"), badgeX + badgeW / 2, cardY + 28.5);
      }
      var fs = Math.max(15, Math.min(29, cardW * 0.038));
      g.font = '600 ' + fs + 'px Georgia, serif';
      var rects = wordRects(g, cardX + 50, cardY + 76, cardW - 100, fs, cardY + cardH - 40);
      g.fillStyle = C.ink;
      g.textAlign = "left"; g.textBaseline = "alphabetic";
      rects.forEach(function (q) { g.fillText(q.word, q.x, q.y); });
      for (var i = 0; i < layer; i++) {
        var p = i === layer - 1 ? noteProgress : 1;
        g.save();
        g.globalAlpha = p;
        g.translate(0, (1 - p) * 5);
        if (i === layer - 1) {
          g.shadowColor = V.alpha(colors[i], 0.22);
          g.shadowBlur = 6;
        }
        NOTE_LAYERS[i].draw(g, rects, colors[i], C, fs);
        g.restore();
      }
      var hintY = cardY + cardH - 23;
      g.fillStyle = C.soft;
      g.font = 'italic ' + Math.max(9, fs * 0.45) + 'px "Open Sans", sans-serif';
      g.textAlign = "left"; g.textBaseline = "alphabetic";
      var hint = layer === 0
        ? (DE ? "Die Tokens stehen schon da. Drücke Weiter, und die erste Schicht schreibt." : "The tokens are already here. Press Next and the first layer writes.")
        : layer < NOTE_LAYERS.length
          ? (DE ? "Weiter: Schicht " + (layer + 1) + " schreibt." : "Next: layer " + (layer + 1) + " writes.")
          : (DE ? "Weiter: aus dem Notizbuch wird der Stream." : "Next: the notebook becomes the stream.");
      g.fillText(hint, cardX + 50, hintY);
      g.restore();
    }
    function drawLegend(g, x, y, C, onPaper) {
      var items = [
        { col: C.blue, label: DE ? "getragen" : "carried" },
        { col: C.green, label: "Attention" },
        { col: C.gold, label: "FFN" }
      ];
      g.font = '600 ' + Math.max(8, Math.min(10, api.font("canvas-sm"))) + 'px "Open Sans", sans-serif';
      g.textAlign = "left"; g.textBaseline = "middle";
      items.forEach(function (item, i) {
        var xx = x + i * 92;
        g.fillStyle = item.col;
        g.fillRect(xx, y - 4, 8, 8);
        g.fillStyle = onPaper ? C.ink : V.alpha(C.paper, 0.88);
        g.fillText(item.label, xx + 12, y + 0.5);
      });
    }
    function drawMiniBars(g, x, y, w, h, parts, C, max) {
      var total = totalParts(parts);
      var slot = w / 6;
      var barW = Math.max(2, slot * 0.5);
      for (var j = 0; j < 6; j++) {
        var xx = x + slot * (j + 0.5) - barW / 2;
        var baseH = parts.base[j] / max * h;
        var attnH = parts.attn[j] / max * h;
        var ffnH = parts.ffn[j] / max * h;
        var yy = y + h;
        g.fillStyle = V.alpha(C.blue, 0.8); g.fillRect(xx, yy - baseH, barW, baseH); yy -= baseH;
        g.fillStyle = V.alpha(C.green, 0.85); g.fillRect(xx, yy - attnH, barW, attnH); yy -= attnH;
        g.fillStyle = V.alpha(C.gold, 0.9); g.fillRect(xx, yy - ffnH, barW, ffnH);
        if (total[j] === 0) {
          g.strokeStyle = V.alpha(C.paper, 0.24);
          g.beginPath(); g.moveTo(xx, y + h - 0.5); g.lineTo(xx + barW, y + h - 0.5); g.stroke();
        }
      }
    }
    function drawSentenceStrip(g, x, y, w, C, onDark) {
      g.font = '600 ' + Math.max(8, Math.min(11, w * 0.016)) + 'px "Open Sans", sans-serif';
      g.textAlign = "left"; g.textBaseline = "middle";
      var xx = x;
      SENTENCE_PAIRS.forEach(function (pair) {
        var word = pair[0] + " ";
        var col = pair[1] === "att" ? C.green : pair[1] === "ffn" ? C.gold : onDark;
        g.fillStyle = col;
        g.fillText(word, xx, y);
        xx += g.measureText(word).width;
      });
    }
    function drawFlowGap(g, x1, x2, y, now, col) {
      g.strokeStyle = V.alpha(col, 0.35);
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(x1, y); g.lineTo(x2, y); g.stroke();
      if (reduced) return;
      for (var k = 0; k < 3; k++) {
        var u = ((now / 1500) + k / 3) % 1;
        var xx = x1 + (x2 - x1) * u;
        var yy = y + Math.sin(u * Math.PI * 2 + k) * 3;
        g.fillStyle = V.alpha(col, 0.35 + 0.5 * Math.sin(Math.PI * u));
        g.beginPath(); g.arc(xx, yy, 2, 0, Math.PI * 2); g.fill();
      }
    }
    function drawStream(C, w, h, g, now) {
      var pad = Math.max(10, Math.min(18, w * 0.022));
      var panelX = pad, panelY = pad, panelW = w - pad * 2;
      var riverH = Math.min(230, Math.max(110, h * 0.42));
      var barY = panelY + riverH + 10;
      var barH = h - barY - pad;
      var wide = w >= 560;
      var riverBg = V.mix(C.petrol, C.paper || "#ffffff", 0.86);
      var onDark = C.ink;
      var onDarkSoft = C.soft;
      var onDarkFaint = C.muted;
      g.save();
      g.shadowColor = V.alpha(C.petrol, 0.16);
      g.shadowBlur = 18;
      g.shadowOffsetY = 6;
      g.fillStyle = riverBg;
      g.fillRect(panelX, panelY, panelW, riverH);
      g.restore();
      g.strokeStyle = V.alpha(C.petrol, 0.16);
      g.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, riverH - 1);
      g.fillStyle = onDark;
      g.font = '700 ' + Math.max(12, Math.min(17, panelW * 0.022)) + 'px "Barlow", sans-serif';
      g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.fillText(DE ? "Residual Stream" : "Residual stream", panelX + 16, panelY + 23);
      g.fillStyle = onDarkSoft;
      g.font = '600 ' + Math.max(9, Math.min(12, panelW * 0.014)) + 'px "Open Sans", sans-serif';
      if (wide) g.fillText(DE ? "xₗ₊₁ = xₗ + Aₗ + Fₗ · dieselbe Dimension, nur Addition" : "xₗ₊₁ = xₗ + Aₗ + Fₗ · same dimension, only addition", panelX + 16, panelY + 40);
      if (wide) drawSentenceStrip(g, panelX + 16, panelY + 56, panelW - 32, C, onDarkSoft);
      else g.fillText(DE ? "Derselbe Satz, jetzt als Stream." : "The same sentence, now as a stream.", panelX + 16, panelY + 40);
      var sx = panelX + 14;
      var sy = panelY + (wide ? 68 : 50);
      var gap = wide ? 10 : 6;
      var sw = (panelW - 28 - gap * 2) / 3;
      var sh = wide ? Math.min(70, riverH - sy + panelY - 12) : Math.min(48, riverH - sy + panelY - 10);
      var totalsMax = maxTotal();
      var streamPalette = streamColors(C);
      for (var i = 0; i < STREAM_LAYERS.length; i++) {
        var x = sx + i * (sw + gap);
        var active = i === streamLayer;
        var col = streamPalette[i];
        g.fillStyle = active ? V.alpha(col, 0.10) : V.alpha(C.petrol, 0.035);
        g.fillRect(x, sy, sw, sh);
        g.strokeStyle = active ? V.alpha(col, 0.95) : V.alpha(C.petrol, 0.16);
        g.lineWidth = active ? 1.8 : 1;
        g.strokeRect(x + 0.5, sy + 0.5, sw - 1, sh - 1);
        if (active) {
          g.save();
          g.shadowColor = V.alpha(col, 0.6);
          g.shadowBlur = 12;
          g.strokeStyle = V.alpha(col, 0.55);
          g.strokeRect(x + 0.5, sy + 0.5, sw - 1, sh - 1);
          g.restore();
        }
        var label = i === 0 ? "Start" : (wide ? STREAM_LAYERS[i] : "A + FFN " + i);
        g.fillStyle = active ? onDark : onDarkSoft;
        g.font = '700 ' + Math.max(8, Math.min(11, sw * 0.048)) + 'px "Barlow", sans-serif';
        g.textAlign = "left"; g.textBaseline = "middle";
        g.fillText(label, x + 8, sy + 13);
        var p = partsAt(i);
        drawMiniBars(g, x + 8, sy + sh - Math.max(16, sh * 0.34), sw - 16, Math.max(10, sh * 0.26), p, C, totalsMax);
        g.fillStyle = onDarkFaint;
        g.font = '600 ' + Math.max(8, Math.min(10, sw * 0.04)) + 'px "Open Sans", sans-serif';
        g.textAlign = "right"; g.textBaseline = "middle";
        var sum = totalParts(p).reduce(function (a, b) { return a + b; }, 0);
        g.fillText("Σ " + sum.toFixed(1), x + sw - 8, sy + 13);
      }
      for (var gi = 0; gi < 2; gi++) {
        var gx1 = sx + gi * (sw + gap) + sw;
        var gx2 = sx + (gi + 1) * (sw + gap);
        drawFlowGap(g, gx1 + 2, gx2 - 2, sy + sh / 2, now, streamPalette[gi + 1]);
      }
      g.save();
      g.shadowColor = V.alpha(C.petrol, 0.14);
      g.shadowBlur = 14;
      g.shadowOffsetY = 4;
      g.fillStyle = C.paper;
      g.fillRect(panelX, barY, panelW, barH);
      g.restore();
      g.strokeStyle = V.alpha(C.lineStrong, 0.8);
      g.strokeRect(panelX + 0.5, barY + 0.5, panelW - 1, barH - 1);
      g.fillStyle = C.ink;
      g.font = '700 ' + Math.max(11, Math.min(15, panelW * 0.019)) + 'px "Barlow", sans-serif';
      g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.fillText(DE ? "Sechs Dimensionen" : "Six dimensions", panelX + 16, barY + 24);
      g.fillStyle = C.soft;
      g.font = '600 ' + Math.max(8, Math.min(10, panelW * 0.0125)) + 'px "Open Sans", sans-serif';
      var layerText = streamLayer === 0 ? (DE ? "Start: sechs konstruierte Dimensionen" : "Start: six constructed dimensions") : (DE ? "Schicht " + streamLayer + " · getragen + Attention + FFN" : "Layer " + streamLayer + " · carried + attention + FFN");
      g.fillText(layerText, panelX + 16, barY + 40);
      if (panelW > 430) drawLegend(g, panelX + panelW - 286, barY + 26, C, true);
      var plotX = panelX + 24;
      var plotW = panelW - 48;
      var plotTop = barY + (panelW > 430 ? 62 : 52);
      var baseline = barY + barH - 30;
      var plotH = Math.max(36, baseline - plotTop - 10);
      var maxVal = Math.max(1, maxTotal());
      var scale = plotH / Math.max(maxVal, 1.2);
      var slot = plotW / 6;
      barHits = [];
      for (var d = 0; d < 6; d++) {
        var cx = plotX + slot * (d + 0.5);
        var bw = Math.min(46, slot * 0.54);
        var baseV = baseShown[d], attnV = attnShown[d], ffnV = ffnShown[d];
        var baseH = baseV * scale, attnH = attnV * scale, ffnH = ffnV * scale;
        var totalV = baseV + attnV + ffnV;
        if (d === hoverDim || d === selectedDim) {
          g.fillStyle = d === selectedDim ? V.alpha(C.petrol, 0.055) : V.alpha(C.line, 0.16);
          g.fillRect(plotX + slot * d, plotTop, slot, plotH);
        }
        var y = baseline;
        g.fillStyle = V.alpha(C.blue, 0.80); g.fillRect(cx - bw / 2, y - baseH, bw, baseH); y -= baseH;
        g.fillStyle = V.alpha(C.green, 0.88); g.fillRect(cx - bw / 2, y - attnH, bw, attnH); y -= attnH;
        g.fillStyle = V.alpha(C.gold, 0.92); g.fillRect(cx - bw / 2, y - ffnH, bw, ffnH);
        if (totalV > 0.001) {
          g.strokeStyle = d === selectedDim ? C.petrol : V.alpha(C.lineStrong, 0.7);
          g.lineWidth = d === selectedDim ? 1.6 : 0.8;
          g.strokeRect(cx - bw / 2 + 0.5, baseline - totalV * scale + 0.5, bw - 1, Math.max(1, totalV * scale - 1));
          g.fillStyle = d === selectedDim ? C.petrol : C.soft;
          g.font = '700 ' + Math.max(8, Math.min(10, slot * 0.2)) + 'px "Open Sans", sans-serif';
          g.textAlign = "center"; g.textBaseline = "alphabetic";
          g.fillText(totalV.toFixed(2), cx, Math.max(plotTop + 8, baseline - totalV * scale - 5));
        } else {
          g.strokeStyle = V.alpha(C.lineStrong, 0.55);
          g.setLineDash([2, 3]);
          g.beginPath(); g.moveTo(cx - bw / 2, baseline); g.lineTo(cx + bw / 2, baseline); g.stroke();
          g.setLineDash([]);
        }
        g.fillStyle = d === selectedDim ? C.petrol : C.muted;
        g.font = '600 ' + Math.max(8, Math.min(10, slot * 0.22)) + 'px "Open Sans", sans-serif';
        g.textAlign = "center"; g.textBaseline = "alphabetic";
        g.fillText("d" + (d + 1), cx, baseline + 16);
        barHits.push({ x: plotX + slot * d, y: plotTop, w: slot, h: plotH + 18, i: d });
      }
      if (streamLayer === 0) {
        g.fillStyle = C.soft;
        g.font = 'italic ' + Math.max(10, Math.min(14, panelW * 0.02)) + 'px "Open Sans", sans-serif';
        g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(DE ? "x₀ = 0" : "x₀ = 0", plotX + plotW / 2, plotTop + plotH * 0.4);
      }
      g.strokeStyle = V.alpha(C.lineStrong, 0.9);
      g.beginPath(); g.moveTo(plotX, baseline); g.lineTo(plotX + plotW, baseline); g.stroke();
    }
    function draw(now) {
      if (!size) return;
      now = now || performance.now();
      var C = pal();
      var g = size.ctx;
      g.clearRect(0, 0, size.w, size.h);
      drawBackdrop(C, size.w, size.h, g);
      if (phase === "notebook") drawNotebook(C, size.w, size.h, g);
      else drawStream(C, size.w, size.h, g, now);
    }
    function equationHTML(n) {
      if (n === 0) return '<span class="ls-res-eq"><b class="is-x">x<sub>0</sub></b> = 0</span>';
      return '<span class="ls-res-eq"><b class="is-x">x<sub>' + n + '</sub></b> = <b class="is-base">x<sub>' + (n - 1) + '</sub></b> + <b class="is-att">A<sub>' + n + '</sub></b> + <b class="is-ffn">F<sub>' + n + '</sub></b></span>';
    }
    function dimDetailHTML(n) {
      var p = partsAt(n);
      var total = totalParts(p)[selectedDim];
      return '<span class="ls-res-dim"><b>d' + (selectedDim + 1) + '</b>' +
        '<span class="is-base">' + p.base[selectedDim].toFixed(2) + '</span> + ' +
        '<span class="is-att">' + p.attn[selectedDim].toFixed(2) + '</span> + ' +
        '<span class="is-ffn">' + p.ffn[selectedDim].toFixed(2) + '</span> = ' +
        '<b>' + total.toFixed(2) + '</b></span>';
    }
    function syncPhaseButtons(C) {
      phaseRow.innerHTML = "";
      phaseRow.hidden = separate;
      [
        { id: "notebook", label: DE ? "Notizbuch" : "Notebook" },
        { id: "stream", label: DE ? "Stream" : "Stream" }
      ].forEach(function (p) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ls-res-phase" + (phase === p.id ? " is-on" : "");
        b.textContent = p.label;
        b.setAttribute("data-tip", p.id === "notebook"
          ? (DE ? "Wechselt zur Notizbuch-Ansicht." : "Switches to the notebook view.")
          : (DE ? "Wechselt zur Stream-Ansicht." : "Switches to the stream view."));
        b.setAttribute("aria-pressed", phase === p.id ? "true" : "false");
        b.addEventListener("click", function () { setPhase(p.id); });
        phaseRow.appendChild(b);
      });
    }
    function syncLayerButtons(C) {
      layerRow.innerHTML = "";
      if (phase === "notebook") {
        var colors = noteColors(C);
        var startChip = document.createElement("button");
        startChip.type = "button";
        startChip.className = "ls-chip" + (layer === 0 ? " is-on" : "");
        startChip.textContent = DE ? "Tokens" : "Tokens";
        startChip.setAttribute("data-tip", DE ? "Zeigt nur die Tokens, bevor eine Schicht schreibt." : "Shows only the tokens before any layer writes.");
        startChip.style.borderLeft = "3px solid " + C.muted;
        startChip.setAttribute("aria-pressed", layer === 0 ? "true" : "false");
        startChip.addEventListener("click", function () {
          phase = "notebook";
          layer = 0;
          noteProgress = 1;
          noteStart = 0;
          sync();
          draw();
        });
        layerRow.appendChild(startChip);
        NOTE_LAYERS.forEach(function (l, i) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "ls-chip" + (i + 1 === layer ? " is-on" : i + 1 < layer ? " is-done" : "");
          b.textContent = l.name;
          b.setAttribute("data-tip", DE ? "Öffnet Schicht " + (i + 1) + " und zeigt, was sie im Notizbuch ergänzt." : "Opens layer " + (i + 1) + " and shows what it adds to the notebook.");
          b.style.borderLeft = "3px solid " + colors[i];
          b.setAttribute("aria-pressed", i + 1 === layer ? "true" : "false");
          b.addEventListener("click", function () {
            phase = "notebook";
            layer = i + 1;
            startNote();
            sync();
            draw();
          });
          layerRow.appendChild(b);
        });
      } else {
        var sc = streamColors(C);
        STREAM_LAYERS.forEach(function (l, i) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "ls-chip" + (i === streamLayer ? " is-on" : i < streamLayer ? " is-done" : "");
          b.textContent = l;
          b.setAttribute("data-tip", i === 0
            ? (DE ? "Zeigt den Ausgangszustand des Streams." : "Shows the initial state of the stream.")
            : (DE ? "Zeigt den Stream nach Attention und FFN " + i + "." : "Shows the stream after attention and FFN " + i + "."));
          b.style.borderLeft = "3px solid " + sc[i];
          b.setAttribute("aria-pressed", i === streamLayer ? "true" : "false");
          b.addEventListener("click", function () {
            phase = "stream";
            streamLayer = i;
            setStreamTarget(i, true);
            sync();
            draw();
            ensureLoop();
          });
          layerRow.appendChild(b);
        });
      }
    }
    function setCaptions(noteText, streamText) {
      caption.innerHTML = '<span class="ls-res-caption-view"></span><span class="ls-res-caption-view"></span>';
      var views = caption.children;
      views[0].textContent = noteText;
      views[1].textContent = streamText;
      views[0].classList.toggle("is-ghost", phase !== "notebook");
      views[1].classList.toggle("is-ghost", phase !== "stream");
      views[0].setAttribute("aria-hidden", phase === "notebook" ? "false" : "true");
      views[1].setAttribute("aria-hidden", phase === "stream" ? "false" : "true");
    }
    function sync() {
      var C = pal();
      syncPhaseButtons(C);
      syncLayerButtons(C);
      var noteCaption = DE ? "Jede Schicht liest das Notizbuch und schreibt ihre Erkenntnis dazu; nichts wird gelöscht. Die Rollen der Schichten sind eine didaktische Erzählung, keine Messung." : "Every layer reads the notebook and writes its insight into it; nothing is deleted. The layer roles are a didactic story, not a measurement.";
      var streamCaption = DE ? "Attention und FFN lesen den Stream, berechnen getrennte Updates und addieren beide. Die Dimension bleibt gleich; jede Schicht trägt den alten Stand weiter." : "Attention and the FFN read the stream, compute separate updates, and add both. The dimension stays the same; every layer carries the old state forward.";
      if (phase === "notebook") {
        var colors = noteColors(C);
        var info = layer ? NOTE_LAYERS[layer - 1] : null;
        readout.innerHTML = '<span class="ls-res-phase-label">' + (DE ? "Notizbuch" : "Notebook") + '</span>' +
          '<b style="color:' + (info ? colors[layer - 1] : C.muted) + '">' + (info ? (DE ? "Schicht " : "Layer ") + layer + ' / 5' : (DE ? "Tokens stehen" : "Tokens are here")) + '</b>' +
          '<span>' + (info ? info.desc : (DE ? "Die Tokens stehen im Notizbuch. Drücke Weiter, um die erste Schicht zu öffnen." : "The tokens are in the notebook. Press Next to open the first layer.")) + '</span>';
      } else {
        readout.innerHTML = '<div class="ls-res-eq-row">' + equationHTML(streamLayer) + dimDetailHTML(streamLayer) + '</div>' +
          '<span class="ls-res-hint">' + (DE ? "Ziehe über eine Dimension oder klicke sie an." : "Hover a dimension or click it.") + '</span>';
      }
      setCaptions(noteCaption, streamCaption);
      var aria = phase === "notebook"
        ? (layer ? (DE ? "Notizbuch mit fünf Schichten. Schicht " + layer + " von 5." : "Notebook with five layers. Layer " + layer + " of 5.") : (DE ? "Notizbuch mit den Tokens und fünf Schichten. Noch keine Schicht geöffnet." : "Notebook with the tokens and five layers. No layer opened yet."))
        : (DE ? "Residual Stream x " + streamLayer + " mit sechs Dimensionen: getragen plus Attention plus FFN." : "Residual stream x " + streamLayer + " with six dimensions: carried plus attention plus FFN.");
      canvas.setAttribute("aria-label", aria);
      canvas.setAttribute("data-tip", phase === "notebook"
        ? (DE ? "Notizbuch: jede Schicht schreibt ihre Erkenntnis dazu, ohne zu löschen." : "Notebook: every layer adds its insight without deleting.")
        : (DE ? "Stream: getragener Zustand plus Attention-Update plus FFN-Update." : "Stream: carried state plus attention update plus FFN update."));
    }
    function startNote() {
      noteProgress = reduced ? 1 : 0;
      noteStart = reduced ? 0 : performance.now();
      if (phase === "notebook") ensureLoop();
    }
    function stepNote(now) {
      if (!noteStart) return;
      var t = clamp((now - noteStart) / 460, 0, 1);
      noteProgress = ease(t);
      if (t >= 1) noteStart = 0;
    }
    function setStreamTarget(n, animate) {
      var p = partsAt(n);
      baseFrom = baseShown.slice();
      attnFrom = attnShown.slice();
      ffnFrom = ffnShown.slice();
      baseTarget = p.base;
      attnTarget = p.attn;
      ffnTarget = p.ffn;
      if (animate && !reduced) {
        streamStart = performance.now();
      } else {
        baseShown = baseTarget.slice();
        attnShown = attnTarget.slice();
        ffnShown = ffnTarget.slice();
        streamStart = 0;
      }
      if (phase === "stream") ensureLoop();
    }
    function stepStream(now) {
      if (!streamStart) return;
      var t = clamp((now - streamStart) / 420, 0, 1);
      var e = ease(t);
      for (var j = 0; j < 6; j++) {
        baseShown[j] = baseFrom[j] + (baseTarget[j] - baseFrom[j]) * e;
        attnShown[j] = attnFrom[j] + (attnTarget[j] - attnFrom[j]) * e;
        ffnShown[j] = ffnFrom[j] + (ffnTarget[j] - ffnFrom[j]) * e;
      }
      if (t >= 1) streamStart = 0;
    }
    function ensureLoop() {
      if (raf || !running) return;
      if (reduced) return;
      raf = requestAnimationFrame(loop);
    }
    function loop(now) {
      raf = 0;
      stepNote(now);
      stepStream(now);
      draw(now);
      if (running && !reduced && (phase === "stream" || noteStart)) ensureLoop();
    }
    function resetStream() {
      baseShown = START_BASE.slice(); attnShown = zeros(); ffnShown = zeros();
      baseFrom = START_BASE.slice(); attnFrom = zeros(); ffnFrom = zeros();
      baseTarget = START_BASE.slice(); attnTarget = zeros(); ffnTarget = zeros();
      streamStart = 0;
    }
    function setPhase(next) {
      if (separate || next === phase) return;
      phase = next;
      if (phase === "notebook") {
        layer = NOTE_LAYERS.length;
        startNote();
      } else {
        streamLayer = 0;
        resetStream();
        setStreamTarget(0, false);
        ensureLoop();
      }
      sync();
      draw();
    }
    function next() {
      if (phase === "notebook") {
        if (layer < NOTE_LAYERS.length) {
          layer++;
          startNote();
          sync();
          draw();
          return true;
        }
        if (separate) return false;
        phase = "stream";
        streamLayer = 0;
        resetStream();
        setStreamTarget(0, false);
        sync();
        draw();
        ensureLoop();
        return true;
      }
      if (streamLayer < STREAM_LAYERS.length - 1) {
        streamLayer++;
        setStreamTarget(streamLayer, true);
        sync();
        draw();
        return true;
      }
      return false;
    }
    function prev() {
      if (phase === "stream") {
        if (streamLayer > 0) {
          streamLayer--;
          setStreamTarget(streamLayer, true);
          sync();
          draw();
          return true;
        }
        if (separate) return false;
        phase = "notebook";
        layer = NOTE_LAYERS.length;
        startNote();
        sync();
        draw();
        return true;
      }
      if (layer > 0) {
        layer--;
        startNote();
        sync();
        draw();
        return true;
      }
      return false;
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    function pointerBar(e) {
      if (phase !== "stream") return -1;
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      for (var i = 0; i < barHits.length; i++) {
        var h = barHits[i];
        if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h.i;
      }
      return -1;
    }
    canvas.addEventListener("pointermove", function (e) {
      var hit = pointerBar(e);
      if (hit === hoverDim) return;
      hoverDim = hit;
      canvas.style.cursor = hit >= 0 ? "pointer" : "default";
      draw();
    });
    core.canvasTip(canvas, function (x, y) {
      if (phase !== "stream") return DE ? "Notizbuch: Jede Schicht liest den aktuellen Stream und schreibt ihre Beobachtung dazu. Weiter zeigt die Updates." : "Notebook: every layer reads the current stream and writes its observation. Next shows the updates.";
      for (var i = 0; i < barHits.length; i++) {
        var h = barHits[i];
        if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
          var d = h.i;
          var base = baseShown[d] || 0, attn = attnShown[d] || 0, ffn = ffnShown[d] || 0;
          return (DE ? "Dimension " : "Dimension ") + (d + 1) + ": Residual " + base.toFixed(2) + " + Attention " + attn.toFixed(2) + " + FFN " + ffn.toFixed(2) + " = " + (base + attn + ffn).toFixed(2) + ". Klicken fixiert die Dimension.";
        }
      }
      return DE ? "Balken: Residual, Attention-Update und FFN-Update addieren sich pro Dimension. Fahre über einen Balken." : "Bars: residual, attention update, and FFN update add per dimension. Hover a bar.";
    });
    canvas.addEventListener("pointerleave", function () {
      if (hoverDim === -1) return;
      hoverDim = -1;
      canvas.style.cursor = "default";
      draw();
    });
    canvas.addEventListener("click", function (e) {
      var hit = pointerBar(e);
      if (hit < 0) return;
      selectedDim = hit;
      sync();
      draw();
    });
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { draw(); });
    resize();
    sync();
    draw();
    return {
      update: function (s) {
        if (s && s.phase) {
          separate = true;
          phase = s.phase === "stream" ? "stream" : "notebook";
          layer = 0;
          streamLayer = 0;
          resetStream();
          if (phase === "stream") setStreamTarget(0, false);
          sync();
          draw();
          ensureLoop();
        }
      },
      next: next,
      prev: prev,
      hasNext: function () {
        if (phase === "notebook") return !separate || layer < NOTE_LAYERS.length;
        return streamLayer < STREAM_LAYERS.length - 1;
      },
      hasPrev: function () {
        if (phase === "stream") return streamLayer > 0 || !separate;
        return layer > 0;
      },
      onKey: function (e) { return api.util.arrowKey(e, next, prev); },
      resize: resize,
      pause: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      },
      resume: function () {
        running = true;
        draw();
        if (phase === "stream" || noteStart) ensureLoop();
      },
      destroy: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        window.removeEventListener("resize", resize);
        el.remove();
      }
    };
  }
  core.register("residual", residualScene);
})();
