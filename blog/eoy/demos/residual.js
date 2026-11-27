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
        desc: DE ? "Frühe Schichten (in einem 32-Schichten-Modell grob 1–10): reagieren auf konkrete Tokens und Positionen, filtern allgemeines Rauschen und bauen erste abstraktere Merkmale auf." : "Early layers (roughly 1–10 in a 32-layer model): react to concrete tokens and positions, filter general noise, and build first abstract features.",
        draw: function (g, r, col, C, fs) {
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (i) { underline(g, r, i, col, fs); });
          scribble(g, r, 2, col, DE ? "Token + Position" : "token + position", fs, -0.08);
          scribble(g, r, 6, col, DE ? "Rauschen filtern" : "filter noise", fs, 0.06);
          label(g, r, 0, DE ? "Token" : "token", col, fs);
          label(g, r, 9, DE ? "Position" : "position", col, fs);
        }
      },
      {
        name: DE ? "Schicht 2" : "Layer 2",
        desc: DE ? "Nächste Schichten (grob 11–20): kombinieren die Ausgaben der früheren Schichten zu größeren, komplexeren Bedeutungseinheiten; die Richtungen im abstrakten Raum haben oft keine menschliche Bezeichnung." : "Next layers (roughly 11–20): combine earlier outputs into larger, more complex meaning units; the directions in the abstract space often have no human label.",
        draw: function (g, r, col, C, fs) {
          bracket(g, r, 0, 1, col, DE ? "lokal kombiniert" : "locally combined", fs);
          bracket(g, r, 3, 5, col, DE ? "abstrakt" : "abstract", fs, 1);
          box(g, r, 6, 9, col, DE ? "komplexere Einheit" : "more complex unit", fs, 1);
          scribble(g, r, 2, col, DE ? "gelernte Richtung" : "learned direction", fs, -0.04);
          scribble(g, r, 6, col, DE ? "kein Label" : "no label", fs, 0.05);
        }
      },
      {
        name: DE ? "Schicht 3" : "Layer 3",
        desc: DE ? "Mittlere Schichten (grob 21–26): verfeinern zusammengesetzte Bedeutungen und Beziehungen; das sind gelernte Merkmalskombinationen, keine sauberen linguistischen Regeln." : "Middle layers (roughly 21–26): refine composed meanings and relations; these are learned feature combinations, not clean linguistic rules.",
        draw: function (g, r, col, C, fs) {
          highlight(g, r, 7, 7, col, 0.16, fs);
          box(g, r, 0, 9, col, DE ? "zusammengesetzte Bedeutung" : "composed meaning", fs, 1);
          scribble(g, r, 1, col, DE ? "abstrakt" : "abstract", fs, -0.05);
          scribble(g, r, 8, col, DE ? "Relation" : "relation", fs, 0.06);
        }
      },
      {
        name: DE ? "Schicht 4" : "Layer 4",
        desc: DE ? "Spätere Schichten (grob 27–30): richten die Repräsentation auf die Aufgabe aus, sammeln plausible Vorhersagen und unterdrücken irrelevante Merkmale." : "Later layers (roughly 27–30): align the representation with the task, gather plausible predictions, and suppress irrelevant features.",
        draw: function (g, r, col, C, fs) {
          highlight(g, r, 0, 9, col, 0.12, fs);
          box(g, r, 0, 9, col, DE ? "aufgabenrelevante Merkmale" : "task-relevant features", fs, 1);
          scribble(g, r, 2, col, DE ? "Rauschen unterdrücken" : "suppress noise", fs, 0.07);
          scribble(g, r, 8, col, DE ? "Vorhersage vorbereiten" : "prepare prediction", fs, -0.05);
        }
      },
      {
        name: DE ? "Schicht 5" : "Layer 5",
        desc: DE ? "Letzte Schichten (grob 31–32): schärfen die Ausgabeverteilung und bereiten die Vorhersage des nächsten Tokens vor." : "Final layers (roughly 31–32): sharpen the output distribution and prepare the next-token prediction.",
        draw: function (g, r, col, C, fs) {
          highlight(g, r, 8, 9, col, 0.18, fs);
          box(g, r, 8, 9, col, DE ? "Ausgabeverteilung" : "output distribution", fs, 1);
          scribble(g, r, 9, col, DE ? "nächster Token" : "next token", fs, -0.07);
          arrow(g, r, 9, 1, col, DE ? "Vorhersage" : "prediction", fs);
        }
      }
    ];
    var STREAM_LAYERS = [
      "Start",
      DE ? "Transformer-Block 1" : "Transformer block 1",
      DE ? "Transformer-Block 2" : "Transformer block 2",
      DE ? "Transformer-Block 3" : "Transformer block 3",
      DE ? "Transformer-Block 4" : "Transformer block 4",
      DE ? "Transformer-Block 5" : "Transformer block 5"
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
      },
      {
        attn: [0.18, 0.12, 0.25, 0.10, 0.22, 0.30],
        ffn: [0.10, 0.15, 0.08, 0.18, 0.12, 0.20]
      },
      {
        attn: [0.12, 0.22, 0.10, 0.28, 0.15, 0.18],
        ffn: [0.08, 0.10, 0.16, 0.12, 0.20, 0.14]
      },
      {
        attn: [0.08, 0.15, 0.20, 0.12, 0.10, 0.25],
        ffn: [0.06, 0.08, 0.10, 0.16, 0.14, 0.12]
      }
    ];
    var el = document.createElement("div");
    el.className = "ls-res-scene";
    el.innerHTML =
      '<div class="ls-res-toolbar"><div class="ls-res-phases" role="group" aria-label="' + (DE ? "Ansicht" : "View") + '"></div><div class="ls-scene-row ls-res-layers"></div></div>' +
      '<div class="ls-res-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-res-note" aria-live="polite" hidden></div>' +
      '<div class="ls-res-readout" aria-live="polite"></div>' +
      '<p class="ls-res-caption"></p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-res-stage");
    var canvas = el.querySelector("canvas");
    var phaseRow = el.querySelector(".ls-res-phases");
    var layerRow = el.querySelector(".ls-res-layers");
    var readout = el.querySelector(".ls-res-readout");
    var streamNote = el.querySelector(".ls-res-note");
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
    var normStep = 0;
    var normShown = START_BASE.slice(), normFrom = START_BASE.slice(), normTarget = START_BASE.slice();
    var normStart = 0;
    var streamStart = 0;
    var hoverDim = -1;
    var barHits = [];
    var streamBoxHits = [];
    var running = true;
    var raf = 0;
    var reduced = !!api.reducedMotion;

    function zeros() { return [0, 0, 0, 0, 0, 0]; }
    function addInto(target, source) {
      for (var i = 0; i < 6; i++) target[i] += source[i];
      return target;
    }
    function layerNormDisplay(v) {
      var mean = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
      var centered = v.map(function (x) { return x - mean; });
      var variance = centered.reduce(function (a, b) { return a + b * b; }, 0) / v.length;
      var std = Math.sqrt(variance + 1e-5);
      return centered.map(function (x) { return x / std; });
    }
    var streamCache = null;
    function buildStreamStates() {
      if (streamCache) return streamCache;
      var states = [START_BASE.slice()];
      var raws = [START_BASE.slice()];
      for (var n = 1; n < STREAM_LAYERS.length; n++) {
        var base = states[n - 1];
        var u = LAYER_UPDATES[n - 1];
        var raw = base.map(function (v, j) { return v + u.attn[j] + u.ffn[j]; });
        raws[n] = raw;
        states[n] = layerNormDisplay(raw);
      }
      streamCache = { states: states, raws: raws };
      return streamCache;
    }
    function partsAt(n) {
      var S = buildStreamStates();
      if (n <= 0) {
        return { base: START_BASE.slice(), attn: zeros(), ffn: zeros(), raw: START_BASE.slice(), norm: START_BASE.slice() };
      }
      var u = LAYER_UPDATES[n - 1];
      return { base: S.states[n - 1].slice(), attn: u.attn.slice(), ffn: u.ffn.slice(), raw: S.raws[n].slice(), norm: S.states[n].slice() };
    }
    function maxAbsStream() {
      var S = buildStreamStates();
      var best = 1;
      for (var n = 0; n < STREAM_LAYERS.length; n++) {
        for (var j = 0; j < 6; j++) {
          best = Math.max(best, Math.abs(S.states[n][j]), Math.abs(S.raws[n][j]));
        }
      }
      for (var k = 0; k < LAYER_UPDATES.length; k++) {
        for (var j2 = 0; j2 < 6; j2++) {
          best = Math.max(best, Math.abs(LAYER_UPDATES[k].attn[j2]), Math.abs(LAYER_UPDATES[k].ffn[j2]));
        }
      }
      return best;
    }
    function noteColors(C) { return [C.green, C.blue, C.gold, C.lilac, C.sky]; }
    function streamColors(C) { return [C.sky, C.green, C.gold, C.lilac, C.blue, C.petrol]; }
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
      g.shadowColor = "rgba(0,0,0,0.22)";
      g.shadowBlur = 26;
      g.shadowOffsetX = 2;
      g.shadowOffsetY = 10;
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
      g.strokeStyle = V.alpha(C.lilac, 0.28);
      g.beginPath(); g.moveTo(cardX + 34, cardY + 14); g.lineTo(cardX + 34, cardY + cardH - 14); g.stroke();
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
      var fs = Math.max(15, Math.min(29, cardW * 0.038));
      g.font = '600 ' + fs + 'px Georgia, serif';
      var rects = wordRects(g, cardX + 50, cardY + 76, cardW - 100, fs, cardY + cardH - 40);
      var lineYs = [];
      rects.forEach(function (q) { if (lineYs.indexOf(q.y) === -1) lineYs.push(q.y); });
      lineYs.sort(function (a, b) { return a - b; });
      var ruleYs = [];
      if (lineYs.length) {
        var lineH = lineYs.length > 1 ? lineYs[1] - lineYs[0] : Math.max(fs * 1.7, 56);
        var lineOffset = fs * 0.36;
        var baseLine = lineYs[0] + lineOffset;
        g.strokeStyle = V.alpha(C.ink, 0.42);
        g.lineWidth = 1.15;
        function drawRule(yy) {
          g.beginPath(); g.moveTo(cardX + 1, yy); g.lineTo(cardX + cardW - 14, yy); g.stroke();
          ruleYs.push(yy);
        }
        for (var up = baseLine - lineH; up > cardY + 58; up -= lineH) drawRule(up);
        for (var down = baseLine; down < cardY + cardH - 34; down += lineH) drawRule(down);
        ruleYs.sort(function (a, b) { return a - b; });
      }
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
        ? ""
        : layer < NOTE_LAYERS.length
          ? (DE ? "Weiter: Schicht " + (layer + 1) + " schreibt." : "Next: layer " + (layer + 1) + " writes.")
          : (DE ? "Weiter: aus dem Notizbuch wird der Stream." : "Next: the notebook becomes the stream.");
      if (hint) g.fillText(hint, cardX + 50, hintY);
      var holes = [];
      var gapMidpoints = [];
      for (var ri = 0; ri < ruleYs.length - 1; ri++) {
        gapMidpoints.push((ruleYs[ri] + ruleYs[ri + 1]) / 2);
      }
      if (gapMidpoints.length) {
        var holeCount = Math.min(7, gapMidpoints.length);
        for (var hi = 0; hi < holeCount; hi++) {
          var idx = holeCount === 1 ? 0 : Math.round(hi * (gapMidpoints.length - 1) / (holeCount - 1));
          holes.push({ x: cardX + 17, y: gapMidpoints[idx] });
        }
      } else {
        for (var hole = 0; hole < 7; hole++) {
          holes.push({ x: cardX + 17, y: cardY + 58 + hole * ((cardH - 90) / 7) });
        }
      }
      holes.forEach(function (h) {
        var grad = g.createRadialGradient(h.x + 1, h.y + 1, 1, h.x + 1, h.y + 1, 7);
        grad.addColorStop(0, "rgba(0,0,0,0.20)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grad;
        g.beginPath();
        g.arc(h.x + 1, h.y + 1, 7, 0, Math.PI * 2);
        g.fill();
      });
      g.save();
      g.globalCompositeOperation = "destination-out";
      holes.forEach(function (h) {
        g.beginPath();
        g.arc(h.x, h.y, 2.6, 0, Math.PI * 2);
        g.fill();
      });
      g.restore();
      holes.forEach(function (h) {
        g.strokeStyle = V.alpha(C.lineStrong, 0.55);
        g.lineWidth = 0.8;
        g.beginPath();
        g.arc(h.x, h.y, 2.6, 0, Math.PI * 2);
        g.stroke();
      });
      g.restore();
    }
    function drawLegend(g, x, y, C, onPaper) {
      var items = [
        { col: C.blue, label: DE ? "vorherige Outputs" : "previous outputs" },
        { col: C.petrol, label: "Transformer-Block" },
        { col: C.green, label: "LayerNorm" }
      ];
      g.font = '600 ' + Math.max(8, Math.min(10, api.font("canvas-sm"))) + 'px "Open Sans", sans-serif';
      g.textAlign = "left"; g.textBaseline = "middle";
      items.forEach(function (item, i) {
        var xx = x + i * 118;
        g.fillStyle = item.col;
        g.fillRect(xx, y - 4, 8, 8);
        g.fillStyle = onPaper ? C.ink : V.alpha(C.paper, 0.88);
        g.fillText(item.label, xx + 12, y + 0.5);
      });
    }
    function drawMiniBars(g, x, y, w, h, values, C) {
      var slot = w / 6;
      var barW = Math.max(2, slot * 0.5);
      var zero = y + h / 2;
      var maxAbs = Math.max.apply(null, values.map(function (v) { return Math.abs(v || 0); }).concat([1]));
      g.strokeStyle = V.alpha(C.lineStrong, 0.35);
      g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(x, zero); g.lineTo(x + w, zero); g.stroke();
      for (var j = 0; j < 6; j++) {
        var xx = x + slot * (j + 0.5) - barW / 2;
        var v = values[j] || 0;
        var bh = v / maxAbs * (h / 2 - 2);
        g.fillStyle = V.alpha(C.petrol, 0.82);
        g.fillRect(xx, Math.min(zero, zero - bh), barW, Math.max(1, Math.abs(bh)));
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
    function drawFlowGap(g, x1, x2, y, now, col, showLn) {
      g.strokeStyle = V.alpha(col, 0.45);
      g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x1, y); g.lineTo(x2 - 6, y); g.stroke();
      g.fillStyle = V.alpha(col, 0.65);
      g.beginPath();
      g.moveTo(x2, y);
      g.lineTo(x2 - 6, y - 3);
      g.lineTo(x2 - 6, y + 3);
      g.closePath();
      g.fill();
      if (showLn) {
        g.fillStyle = V.alpha(col, 0.82);
        g.font = '700 ' + Math.max(7, api.font("canvas-sm") - 2) + 'px "Barlow", sans-serif';
        g.textAlign = "center"; g.textBaseline = "bottom";
        g.fillText("LN", (x1 + x2) / 2, y - 5);
      }
    }
    function drawStream(C, w, h, g, now) {
      var pad = Math.max(10, Math.min(18, w * 0.022));
      var panelX = pad, panelY = pad, panelW = w - pad * 2;
      var riverH = Math.min(240, Math.max(120, h * 0.44));
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
      if (wide) drawSentenceStrip(g, panelX + 16, panelY + 42, panelW - 32, C, onDarkSoft);
      else g.fillText(DE ? "Derselbe Satz, jetzt als Stream." : "The same sentence, now as a stream.", panelX + 16, panelY + 38);
      var sx = panelX + 14;
      var sy = panelY + (wide ? 58 : 48);
      var gap = wide ? 16 : 10;
      var stages = STREAM_LAYERS.length;
      var sw = (panelW - 28 - gap * (stages - 1)) / stages;
      var sh = wide ? Math.max(64, riverH - sy + panelY - 10) : Math.max(48, riverH - sy + panelY - 8);
      var streamPalette = streamColors(C);
      streamBoxHits = [];
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
        var label = i === 0 ? "Start" : "Block " + i;
        g.fillStyle = active ? onDark : onDarkSoft;
        g.font = '700 ' + Math.max(9, Math.min(12, sw * 0.052)) + 'px "Barlow", sans-serif';
        g.textAlign = "left"; g.textBaseline = "middle";
        g.fillText(label, x + 8, sy + 13);
        var p = partsAt(i);
        var miniVals = i === 0 ? START_BASE : p.norm;
        drawMiniBars(g, x + 8, sy + sh - Math.max(18, sh * 0.34), sw - 16, Math.max(12, sh * 0.28), miniVals, C);
        streamBoxHits.push({ x: x, y: sy, w: sw, h: sh, i: i });
      }
      for (var gi = 0; gi < STREAM_LAYERS.length - 1; gi++) {
        var gx1 = sx + gi * (sw + gap) + sw;
        var gx2 = sx + (gi + 1) * (sw + gap);
        drawFlowGap(g, gx1 + 2, gx2 - 2, sy + sh / 2, now, streamPalette[gi + 1], gi > 0);
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
      var layerText;
      if (streamLayer === 0) layerText = DE ? "Start: sechs konstruierte Dimensionen" : "Start: six constructed dimensions";
      else if (normStep === 0) layerText = DE ? "Block " + streamLayer + " · Schritt 1/2: Addition (vor LayerNorm)" : "Block " + streamLayer + " · step 1/2: addition (before LayerNorm)";
      else layerText = DE ? "Block " + streamLayer + " · Schritt 2/2: LayerNorm · Mittelwert 0, Std 1" : "Block " + streamLayer + " · step 2/2: LayerNorm · mean 0, std 1";
      g.fillText(layerText, panelX + 16, barY + 40);
      if (panelW > 430) drawLegend(g, panelX + panelW - 390, barY + 26, C, true);
      var plotX = panelX + 24;
      var plotW = panelW - 48;
      var plotTop = barY + (panelW > 430 ? 58 : 48);
      var plotBottom = barY + barH - 34;
      var plotH = Math.max(60, plotBottom - plotTop);
      var zeroY = plotTop + plotH / 2;
      var halfH = plotH / 2 - 8;
      var maxAbs = maxAbsStream();
      var scale = halfH / Math.max(maxAbs, 0.8);
      var slot = plotW / 6;
      barHits = [];
      function yFor(v) { return zeroY - v * scale; }
      function drawSeg(x, w, y1, y2, color, alpha) {
        var top = Math.min(y1, y2);
        var hh = Math.abs(y2 - y1);
        if (hh < 0.4) return;
        g.save();
        g.globalAlpha = alpha;
        g.fillStyle = color;
        g.fillRect(x, top, w, hh);
        g.restore();
      }
      g.strokeStyle = V.alpha(C.lineStrong, 0.55);
      g.setLineDash([3, 4]);
      g.beginPath(); g.moveTo(plotX, zeroY); g.lineTo(plotX + plotW, zeroY); g.stroke();
      g.setLineDash([]);
      g.fillStyle = C.muted;
      g.font = '600 ' + Math.max(8, Math.min(10, slot * 0.22)) + 'px "Open Sans", sans-serif';
      g.textAlign = "left"; g.textBaseline = "middle";
      g.fillText("0", plotX - 12, zeroY);
      for (var d = 0; d < 6; d++) {
        var cx = plotX + slot * (d + 0.5);
        var bw = Math.min(46, slot * 0.54);
        var baseV = baseShown[d], attnV = attnShown[d], ffnV = ffnShown[d];
        var updV = attnV + ffnV;
        var rawV = baseV + updV;
        var y0 = zeroY, yb = yFor(baseV), yr = yFor(rawV);
        if (d === hoverDim) {
          g.fillStyle = V.alpha(C.line, 0.16);
          g.fillRect(plotX + slot * d, plotTop, slot, plotBottom - plotTop);
        }
        if (normStep === 0) {
          drawSeg(cx - bw / 2, bw, y0, yb, C.blue, 0.80);
          drawSeg(cx - bw / 2, bw, yb, yr, C.petrol, 0.88);
          g.strokeStyle = d === hoverDim ? C.petrol : V.alpha(C.lineStrong, 0.7);
          g.lineWidth = d === hoverDim ? 1.6 : 0.8;
          g.beginPath(); g.moveTo(cx - bw / 2 - 3, yr); g.lineTo(cx + bw / 2 + 3, yr); g.stroke();
          g.fillStyle = d === hoverDim ? C.petrol : C.soft;
          g.font = '700 ' + Math.max(8, Math.min(10, slot * 0.2)) + 'px "Open Sans", sans-serif';
          g.textAlign = "center"; g.textBaseline = "alphabetic";
          var ly = rawV >= 0 ? yr - 5 : yr + 12;
          ly = Math.max(plotTop + 10, Math.min(plotBottom - 4, ly));
          g.fillText(rawV.toFixed(2), cx, ly);
        } else {
          drawSeg(cx - bw / 2, bw, y0, yb, C.blue, 0.14);
          drawSeg(cx - bw / 2, bw, yb, yr, C.petrol, 0.14);
          var yn = yFor(normShown[d]);
          drawSeg(cx - bw / 2, bw, zeroY, yn, C.green, 0.90);
          g.strokeStyle = d === hoverDim ? C.green : V.alpha(C.lineStrong, 0.7);
          g.lineWidth = d === hoverDim ? 1.6 : 0.8;
          g.beginPath(); g.moveTo(cx - bw / 2 - 3, yn); g.lineTo(cx + bw / 2 + 3, yn); g.stroke();
          g.fillStyle = d === hoverDim ? C.green : C.soft;
          g.font = '700 ' + Math.max(8, Math.min(10, slot * 0.2)) + 'px "Open Sans", sans-serif';
          g.textAlign = "center"; g.textBaseline = "alphabetic";
          var ny = normShown[d] >= 0 ? yn - 5 : yn + 12;
          ny = Math.max(plotTop + 10, Math.min(plotBottom - 4, ny));
          g.fillText(normShown[d].toFixed(2), cx, ny);
        }
        g.fillStyle = d === hoverDim ? C.petrol : C.muted;
        g.font = '600 ' + Math.max(8, Math.min(10, slot * 0.22)) + 'px "Open Sans", sans-serif';
        g.textAlign = "center"; g.textBaseline = "alphabetic";
        g.fillText("d" + (d + 1), cx, plotBottom + 16);
        barHits.push({ x: plotX + slot * d, y: plotTop, w: slot, h: plotBottom - plotTop + 18, i: d });
      }
      g.strokeStyle = V.alpha(C.lineStrong, 0.9);
      g.beginPath(); g.moveTo(plotX, plotBottom); g.lineTo(plotX + plotW, plotBottom); g.stroke();
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
      return '<span class="ls-res-eq"><b class="is-x">x<sub>' + n + '</sub></b> = <b class="is-base">x<sub>' + (n - 1) + '</sub></b> + <b class="is-att">Transformer-Block<sub>' + n + '</sub></b></span>';
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
            : (DE ? "Zeigt den Stream nach Transformer-Block " + i + "." : "Shows the stream after transformer block " + i + "."));
          b.style.borderLeft = "3px solid " + sc[i];
          b.setAttribute("aria-pressed", i === streamLayer ? "true" : "false");
          b.addEventListener("click", function () {
            phase = "stream";
            streamLayer = i;
            normStep = 0;
            setStreamTarget(i, true, 0);
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
      var noteCaption = DE ? "Starke Vereinfachung, keine Messung: Die fünf Notizbuch-Schichten stehen für Gruppen vieler echter Schichten. In einem 32-Schichten-Modell arbeiten die ersten ~10 grob an Tokens, Positionen, lokalem Rauschen und ersten abstrakten Merkmalen; die nächsten ~15–20 an komplexeren, oft unbenannten Bedeutungsrichtungen; die letzten ~6–8 an Aufgabenausrichtung und nächster-Token-Vorhersage. Das ist modellabhängig (Tenney et al., 2019; Lad et al., 2024)." : "Strong simplification, not a measurement: the five notebook layers stand for groups of many real layers. In a 32-layer model, the first ~10 work roughly on tokens, positions, local noise, and first abstract features; the next ~15–20 on more complex meaning directions that often have no human label; the final ~6–8 on task alignment and next-token prediction. This depends on the model (Tenney et al., 2019; Lad et al., 2024).";
      var streamCaption = "";
      if (streamNote) {
        streamNote.hidden = phase !== "stream";
        streamNote.textContent = phase === "stream"
          ? (DE ? "Hellblau: vorherige Outputs. Dunkelblau: Transformer-Block. Grün: nach LayerNorm. Zwei Schritte pro Block: 1) Addition (bleibt additiv, auch mit negativen Werten), 2) LayerNorm: Mittelwert 0, Standardabweichung 1 (Werte können über ±1 hinausgehen). Post-LN hier; GPT-2/Pre-LN normalisiert die Kopie vor Attention/FFN und am Ende (Vaswani et al., 2017; Xiong et al., 2020)." : "Light blue: previous outputs. Dark blue: transformer block. Green: after LayerNorm. Two steps per block: 1) addition (still additive, even with negative values), 2) LayerNorm: mean 0, standard deviation 1 (values can go beyond ±1). Post-LN here; GPT-2/pre-LN normalizes the copy before attention/FFN and at the end (Vaswani et al., 2017; Xiong et al., 2020).")
          : "";
      }
      if (phase === "notebook") {
        readout.hidden = false;
        var colors = noteColors(C);
        var info = layer ? NOTE_LAYERS[layer - 1] : null;
        readout.innerHTML = '<span class="ls-res-phase-label">' + (DE ? "Notizbuch" : "Notebook") + '</span>' +
          '<b style="color:' + (info ? colors[layer - 1] : C.muted) + '">' + (info ? (DE ? "Schicht " : "Layer ") + layer + ' / 5' : (DE ? "Vereinfachung" : "Simplification")) + '</b>' +
          '<span>' + (info ? info.desc : (DE ? "Fünf didaktische Gruppen für die vielen Schichten eines echten Modells." : "Five didactic groups for the many layers of a real model.")) + '</span>';
      } else {
        readout.innerHTML = "";
        readout.hidden = true;
      }
      caption.hidden = phase !== "notebook";
      setCaptions(noteCaption, streamCaption);
      var aria = phase === "notebook"
        ? (layer ? (DE ? "Notizbuch mit fünf Schichten. Schicht " + layer + " von 5." : "Notebook with five layers. Layer " + layer + " of 5.") : (DE ? "Notizbuch mit den Tokens und fünf Schichten. Noch keine Schicht geöffnet." : "Notebook with the tokens and five layers. No layer opened yet."))
        : (DE ? "Residual Stream x " + streamLayer + " mit sechs Dimensionen: vorherige Outputs plus Transformer-Block." : "Residual stream x " + streamLayer + " with six dimensions: previous outputs plus transformer block.");
      canvas.setAttribute("aria-label", aria);
      canvas.setAttribute("data-tip", phase === "notebook"
        ? (DE ? "Notizbuch: jede Schicht schreibt ihre Erkenntnis dazu, ohne zu löschen." : "Notebook: every layer adds its insight without deleting.")
        : (DE ? "Stream: vorherige Outputs plus Transformer-Block-Update." : "Stream: previous outputs plus transformer block update."));
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
    function setStreamTarget(n, animate, step) {
      var p = partsAt(n);
      baseFrom = baseShown.slice();
      attnFrom = attnShown.slice();
      ffnFrom = ffnShown.slice();
      baseTarget = p.base;
      attnTarget = p.attn;
      ffnTarget = p.ffn;
      if (step === 1) {
        normFrom = normShown.slice();
        normTarget = p.norm.slice();
        if (animate && !reduced) normStart = performance.now();
        else { normShown = normTarget.slice(); normStart = 0; }
      } else {
        normStep = 0;
        normShown = p.raw.slice();
        normFrom = normShown.slice();
        normTarget = normShown.slice();
        normStart = 0;
      }
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
      if (streamStart) {
        var t = clamp((now - streamStart) / 420, 0, 1);
        var e = ease(t);
        for (var j = 0; j < 6; j++) {
          baseShown[j] = baseFrom[j] + (baseTarget[j] - baseFrom[j]) * e;
          attnShown[j] = attnFrom[j] + (attnTarget[j] - attnFrom[j]) * e;
          ffnShown[j] = ffnFrom[j] + (ffnTarget[j] - ffnFrom[j]) * e;
        }
        if (t >= 1) streamStart = 0;
      }
      if (normStart) {
        var tn = clamp((now - normStart) / 420, 0, 1);
        var en = ease(tn);
        for (var k = 0; k < 6; k++) normShown[k] = normFrom[k] + (normTarget[k] - normFrom[k]) * en;
        if (tn >= 1) normStart = 0;
      }
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
      normStep = 0;
      normShown = START_BASE.slice(); normFrom = START_BASE.slice(); normTarget = START_BASE.slice();
      normStart = 0;
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
        normStep = 0;
        resetStream();
        setStreamTarget(0, false, 0);
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
        normStep = 0;
        resetStream();
        setStreamTarget(0, false, 0);
        sync();
        draw();
        ensureLoop();
        return true;
      }
      if (streamLayer === 0) {
        streamLayer = 1;
        normStep = 0;
        setStreamTarget(1, true, 0);
        sync();
        draw();
        return true;
      }
      if (normStep === 0) {
        normStep = 1;
        setStreamTarget(streamLayer, true, 1);
        sync();
        draw();
        return true;
      }
      if (streamLayer < STREAM_LAYERS.length - 1) {
        streamLayer++;
        normStep = 0;
        setStreamTarget(streamLayer, true, 0);
        sync();
        draw();
        return true;
      }
      return false;
    }
    function prev() {
      if (phase === "stream") {
        if (streamLayer > 0) {
          if (normStep === 1) {
            normStep = 0;
            setStreamTarget(streamLayer, false, 0);
          } else if (streamLayer === 1) {
            streamLayer = 0;
            normStep = 0;
            setStreamTarget(0, false, 0);
          } else {
            streamLayer--;
            normStep = 1;
            setStreamTarget(streamLayer, true, 1);
          }
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
    function pointerStreamBox(e) {
      if (phase !== "stream") return -1;
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      for (var i = 0; i < streamBoxHits.length; i++) {
        var h = streamBoxHits[i];
        if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h.i;
      }
      return -1;
    }
    canvas.addEventListener("pointermove", function (e) {
      var box = pointerStreamBox(e);
      if (box >= 0) {
        canvas.style.cursor = "pointer";
        if (hoverDim !== -1) { hoverDim = -1; draw(); }
        return;
      }
      var hit = pointerBar(e);
      if (hit === hoverDim) { canvas.style.cursor = hit >= 0 ? "help" : "default"; return; }
      hoverDim = hit;
      canvas.style.cursor = hit >= 0 ? "help" : "default";
      draw();
    });
    core.canvasTip(canvas, function (x, y) {
      if (phase !== "stream") return DE ? "Notizbuch: Jede Schicht liest den aktuellen Stream und schreibt ihre Beobachtung dazu. Weiter zeigt die Updates." : "Notebook: every layer reads the current stream and writes its observation. Next shows the updates.";
      for (var i = 0; i < barHits.length; i++) {
        var h = barHits[i];
        if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
          var d = h.i;
          var base = baseShown[d] || 0, attn = attnShown[d] || 0, ffn = ffnShown[d] || 0;
          var n = streamLayer;
          var raw = base + attn + ffn;
          if (normStep === 1) {
            return "LN(x" + n + ") · d" + (d + 1) + ": " + raw.toFixed(2) + " → " + normShown[d].toFixed(2) + (DE ? " (Mittelwert 0, Std 1)" : " (mean 0, std 1)");
          }
          var eq = n === 0 ? "Start" : "x" + n + " = x" + (n - 1) + " + A" + n + " + F" + n;
          return eq + " · d" + (d + 1) + " " + base.toFixed(2) + " + " + attn.toFixed(2) + " + " + ffn.toFixed(2) + " = " + raw.toFixed(2);
        }
      }
      return DE ? "Balken: vorherige Outputs plus Transformer-Block pro Dimension. Fahre über einen Balken." : "Bars: previous outputs plus transformer block per dimension. Hover a bar.";
    });
    canvas.addEventListener("pointerleave", function () {
      if (hoverDim === -1) return;
      hoverDim = -1;
      canvas.style.cursor = "default";
      draw();
    });
    canvas.addEventListener("click", function (e) {
      var box = pointerStreamBox(e);
      if (box < 0 || phase !== "stream") return;
      streamLayer = box;
      normStep = 0;
      setStreamTarget(streamLayer, true, 0);
      sync();
      draw();
      ensureLoop();
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
          if (phase === "stream") { streamLayer = 0; normStep = 0; setStreamTarget(0, false, 0); }
          sync();
          draw();
          ensureLoop();
        }
      },
      next: next,
      prev: prev,
      hasNext: function () {
        if (phase === "notebook") return !separate || layer < NOTE_LAYERS.length;
        if (streamLayer === 0) return true;
        if (normStep === 0) return true;
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
