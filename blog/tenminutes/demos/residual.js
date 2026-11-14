(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function residualScene(root, api) {
    var DE = api.lang === "de";
    var SENTENCE = DE ? "Die Katze saß auf der Matte weil sie müde war" : "The cat sat on the mat because she was tired";
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
          highlight(g, r, 7, 7, col, 0.16);
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
          highlight(g, r, 8, 9, col, 0.18);
          box(g, r, 8, 9, col, DE ? "Fokus" : "focus", fs, 1);
          scribble(g, r, 9, col, DE ? "Fokus: neue Information" : "focus: new information", fs, -0.07);
          arrow(g, r, 9, 1, col, DE ? "Vorhersage" : "prediction", fs);
        }
      }
    ];
    var STREAM_LAYERS = [
      DE ? "Start" : "Start",
      DE ? "Attention + FFN 1" : "Attention + FFN 1",
      DE ? "Attention + FFN 2" : "Attention + FFN 2"
    ];
    var UPDATES = [
      [0.8, 0.3, 0.2, 0.5, 0.1, 0.4],
      [0.4, 0.5, 0.3, 0.4, 0.6, 0.2],
      [0.3, 0.2, 0.5, 0.3, 0.4, 0.3]
    ];
    var el = document.createElement("div");
    el.className = "ls-res-scene";
    el.innerHTML = '<div class="ls-res-stage"><canvas class="ls-canvas" role="img"></canvas></div><div class="ls-scene-row ls-res-layers"></div><div class="ls-res-readout" aria-live="polite"></div><p class="ls-res-caption"></p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-res-stage");
    var canvas = el.querySelector("canvas");
    var layerRow = el.querySelector(".ls-res-layers");
    var readout = el.querySelector(".ls-res-readout");
    var caption = el.querySelector(".ls-res-caption");
    var size = null;
    var phase = "notebook";
    var layer = 0;
    var streamLayer = 0;
    var separate = false;
    var streamShown = [0, 0, 0, 0, 0, 0];
    var streamFrom = streamShown.slice();
    var streamTarget = streamShown.slice();
    var streamStart = 0;
    var streamRaf = 0;
    var clamp = api.util.clamp;

    function pal() {
      var C = api.colors();
      return {
        paper: C.paper,
        paper2: C.paper2,
        ink: C.ink,
        soft: C.inkSoft,
        muted: C.muted,
        line: C.line,
        lineStrong: C.lineStrong,
        petrol: C.petrol,
        green: C.green,
        blue: C.blue,
        teal: C.sky,
        coral: C.coral,
        gold: C.gold
      };
    }
    function wordRects(g, w, h, C, fs) {
      var words = SENTENCE.split(" ");
      var pad = Math.max(18, w * 0.045);
      var maxW = w - pad * 2;
      var lineH = fs * 1.7;
      var x = pad;
      var y = Math.max(96, h * 0.40);
      var rects = [];
      var space = g.measureText(" ").width;
      words.forEach(function (word) {
        var wordW = g.measureText(word).width;
        if (x + wordW > pad + maxW && x > pad) { x = pad; y += lineH; }
        rects.push({ word: word, x: x, y: y, w: wordW, i: rects.length });
        x += wordW + space;
      });
      return rects;
    }
    function underline(g, r, i, col, fs) {
      var q = r[i]; if (!q) return;
      g.strokeStyle = col; g.globalAlpha = 0.8; g.lineWidth = 1.4;
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
    function highlight(g, r, a, b, col, alpha) {
      var q1 = r[a], q2 = r[b]; if (!q1 || !q2) return;
      g.fillStyle = col; g.globalAlpha = alpha;
      g.fillRect(q1.x - 3, q1.y - fsFor(r) * 0.85, q2.x + q2.w - q1.x + 6, fsFor(r) * 1.15);
      g.globalAlpha = 1;
    }
    function fsFor(r) { return r && r.length ? Math.max(16, Math.min(26, r[0].w * 1.3)) : 20; }
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
    function drawNotebook(C, w, h, g) {
      var pad = Math.max(14, w * 0.035);
      var fs = Math.max(17, Math.min(27, w * 0.040));
      g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
      g.strokeStyle = C.line; g.lineWidth = 1; g.strokeRect(8, 8, w - 16, h - 16);
      g.strokeStyle = C.line; g.globalAlpha = 0.55;
      for (var yy = 48; yy < h - 12; yy += 27) { g.beginPath(); g.moveTo(16, yy); g.lineTo(w - 16, yy); g.stroke(); }
      g.globalAlpha = 0.35; g.beginPath(); g.moveTo(pad + 14, 16); g.lineTo(pad + 14, h - 16); g.stroke(); g.globalAlpha = 1;
      g.fillStyle = C.petrol; g.font = '700 ' + Math.max(12, fs * 0.62) + 'px "Barlow", sans-serif';
      g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.fillText(DE ? "Das gemeinsame Notizbuch" : "The shared notebook", pad, 34);
      g.fillStyle = C.muted; g.font = '600 ' + Math.max(9, fs * 0.44) + 'px "Open Sans", sans-serif';
      g.fillText(DE ? "Jede Schicht liest und schreibt dazu." : "Every layer reads and writes into it.", pad, 50);
      g.fillStyle = C.ink; g.font = '600 ' + fs + 'px Georgia, serif';
      var rects = wordRects(g, w, h, C, fs);
      rects.forEach(function (q) { g.fillText(q.word, q.x, q.y); });
      for (var i = 0; i < layer; i++) NOTE_LAYERS[i].draw(g, rects, ["#63a44b", "#1275ac", "#9f9700", "#9185be", "#5c9baf"][i], C, fs);
      if (!layer) {
        g.fillStyle = C.muted; g.font = 'italic ' + Math.max(10, fs * 0.5) + 'px "Open Sans", sans-serif';
        g.fillText(DE ? "Noch leer. Drücke Weiter, und die erste Schicht schreibt." : "Still empty. Press Next and the first layer writes.", pad, h - 22);
      }
    }
    function streamAt(n) {
      var v = [0, 0, 0, 0, 0, 0];
      for (var i = 0; i <= n; i++) for (var j = 0; j < 6; j++) v[j] += UPDATES[i][j];
      return v;
    }
    function drawStream(C, w, h, g) {
      var stream = streamShown.slice();
      var update = UPDATES[streamLayer];
      var pad = 24;
      var wide = h > 260;
      var barX0 = wide ? pad + 124 : pad;
      var barW = (w - barX0 - pad) / 6;
      var baseY = wide ? h * 0.70 : h * 0.62;
      var scale = Math.min(70, h * 0.18);
      g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
      g.strokeStyle = C.line; g.lineWidth = 1; g.strokeRect(8, 8, w - 16, h - 16);
      if (wide) {
        var sentence = DE
          ? [["Die", ""], ["Katze", "att"], ["saß", "mlp"], ["auf", ""], ["der", ""], ["Matte", ""], ["weil", ""], ["sie", "att"], ["müde", "mlp"], ["war", ""]]
          : [["The", ""], ["cat", "att"], ["sat", "mlp"], ["on", ""], ["the", ""], ["mat", ""], ["because", ""], ["she", "att"], ["was", "mlp"], ["tired", ""]];
        g.fillStyle = C.paper2; g.strokeStyle = C.line;
        g.fillRect(pad, 10, w - pad * 2, 54); g.strokeRect(pad, 10, w - pad * 2, 54);
        g.font = '600 ' + api.font("canvas") + 'px "Open Sans", sans-serif';
        g.textAlign = "left";
        var tx = pad + 10, ty = 34;
        sentence.forEach(function (pair) {
          g.fillStyle = pair[1] === "att" ? C.green : pair[1] === "mlp" ? C.gold : C.soft;
          g.fillText(pair[0], tx, ty);
          tx += g.measureText(pair[0] + " ").width;
        });
        g.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        g.fillStyle = C.green; g.fillText(DE ? "Attention" : "attention", pad + 10, 52);
        g.fillStyle = C.gold; g.fillText("Attention + FFN", pad + 78, 52);
        g.fillStyle = C.muted; g.fillText("Embedding", pad + 184, 52);
      }
      g.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      g.textAlign = "center";
      for (var j = 0; j < 6; j++) {
        var x = barX0 + j * barW + barW / 2;
        var bh = stream[j] * scale;
        g.fillStyle = C.blue; g.globalAlpha = 0.85;
        g.fillRect(x - barW * 0.22, baseY - Math.max(0, bh), barW * 0.44, Math.abs(bh));
        g.globalAlpha = 1;
        g.fillStyle = C.soft; g.fillText("d" + (j + 1), x, baseY + 18);
        if (update[j]) {
          g.fillStyle = C.gold;
          g.fillRect(x - barW * 0.12, baseY - Math.max(0, update[j] * scale), barW * 0.24, Math.abs(update[j] * scale));
        }
      }
      g.strokeStyle = C.lineStrong; g.beginPath(); g.moveTo(barX0, baseY); g.lineTo(w - pad, baseY); g.stroke();
      g.fillStyle = C.muted; g.textAlign = "left";
      g.fillText(DE ? "blau: Stream · gold: Update" : "blue: stream · gold: update", barX0, 20);
      for (var i = 0; i < STREAM_LAYERS.length; i++) {
        var on = i === streamLayer;
        if (wide) {
          var yy = 84 + i * 26;
          g.fillStyle = on ? C.petrol : C.paper; g.strokeStyle = on ? C.petrol : C.lineStrong;
          g.fillRect(pad, yy - 13, 128, 22); g.strokeRect(pad, yy - 13, 128, 22);
          g.fillStyle = on ? "#fff" : C.ink; g.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
          g.textAlign = "left"; g.fillText(STREAM_LAYERS[i], pad + 6, yy + 2);
        } else {
          var lw = (w - pad * 2) / STREAM_LAYERS.length;
          var lx = pad + i * lw;
          g.fillStyle = on ? C.petrol : C.paper; g.strokeStyle = on ? C.petrol : C.lineStrong;
          g.fillRect(lx + 1, 6, lw - 3, 18); g.strokeRect(lx + 1, 6, lw - 3, 18);
          g.fillStyle = on ? "#fff" : C.ink; g.font = '600 ' + Math.max(8, api.font("canvas-sm") - 2) + 'px "Open Sans", sans-serif';
          g.textAlign = "center"; g.fillText(STREAM_LAYERS[i].replace("Attention + FFN", "A+FFN"), lx + lw / 2, 18);
        }
      }
    }
    function streamStep(now) {
      var t = Math.min(1, (now - streamStart) / 320);
      var e = t * t * (3 - 2 * t);
      for (var j = 0; j < 6; j++) streamShown[j] = streamFrom[j] + (streamTarget[j] - streamFrom[j]) * e;
      draw();
      if (t < 1) streamRaf = requestAnimationFrame(streamStep); else streamRaf = 0;
    }
    function animateStream(target) {
      streamFrom = streamShown.slice();
      streamTarget = target.slice();
      streamStart = performance.now();
      if (!streamRaf) streamRaf = requestAnimationFrame(streamStep);
    }
    function draw() {
      if (!size) return;
      var C = pal();
      var g = size.ctx;
      g.clearRect(0, 0, size.w, size.h);
      if (phase === "notebook") drawNotebook(C, size.w, size.h, g);
      else drawStream(C, size.w, size.h, g);
    }
    function sync() {
      var C = pal();
      layerRow.innerHTML = "";
      if (phase === "notebook") {
        var noteColors = ["#63a44b", "#1275ac", "#9f9700", "#9185be", "#5c9baf"];
        NOTE_LAYERS.forEach(function (l, i) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "ls-chip" + (i + 1 === layer ? " is-on" : i + 1 < layer ? " is-done" : "");
          b.textContent = l.name;
          b.style.borderLeft = "3px solid " + noteColors[i];
          b.style.borderLeftColor = noteColors[i];
          b.addEventListener("click", function () { layer = i + 1; phase = "notebook"; sync(); draw(); });
          layerRow.appendChild(b);
        });
        var info = layer ? NOTE_LAYERS[layer - 1] : null;
        readout.innerHTML = '<span>' + (DE ? "Notizbuch" : "notebook") + '</span><b>' + (DE ? "Schicht " : "layer ") + layer + ' / 5</b><span>' + (info ? info.desc : (DE ? "Noch leer." : "still empty.")) + '</span>';
        caption.textContent = DE ? "Jede Schicht liest das Notizbuch und schreibt ihre Erkenntnis dazu; nichts wird gelöscht." : "Every layer reads the notebook and writes its insight into it; nothing is deleted.";
      } else {
        STREAM_LAYERS.forEach(function (l, i) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "ls-chip" + (i === streamLayer ? " is-on" : i < streamLayer ? " is-done" : "");
          b.textContent = l;
          b.addEventListener("click", function () { streamLayer = i; phase = "stream"; sync(); draw(); animateStream(streamAt(i)); });
          layerRow.appendChild(b);
        });
        var stream = streamAt(streamLayer);
        readout.innerHTML = '<span>x<sub>' + streamLayer + '</sub></span><span>' + (DE ? "Stream" : "stream") + ' <b>' + stream.map(function (v) { return v.toFixed(1); }).join(" · ") + '</b></span><span>' + (DE ? "Update" : "update") + ' <b>' + UPDATES[streamLayer].map(function (v) { return v.toFixed(1); }).join(" · ") + '</b></span>';
        caption.textContent = DE ? "Attention und FFN lesen den Stream, berechnen ein Update und addieren es. Die Dimension bleibt gleich, deshalb addiert jede Schicht nur." : "Attention and FFN read the stream, compute an update and add it. The dimension stays the same, so every layer only adds.";
      }
    }
    function next() {
      if (phase === "notebook") {
        if (layer < NOTE_LAYERS.length) { layer++; sync(); draw(); return true; }
        if (separate) return false;
        phase = "stream"; streamLayer = 0; streamShown = [0, 0, 0, 0, 0, 0]; sync(); draw(); animateStream(streamAt(0)); return true;
      }
      if (streamLayer < STREAM_LAYERS.length - 1) { streamLayer++; sync(); draw(); animateStream(streamAt(streamLayer)); return true; }
      return false;
    }
    function prev() {
      if (phase === "stream") {
        if (streamLayer > 0) { streamLayer--; sync(); draw(); return true; }
        if (separate) return false;
        phase = "notebook"; layer = NOTE_LAYERS.length; sync(); draw(); return true;
      }
      if (layer > 0) { layer--; sync(); draw(); return true; }
      return false;
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", draw);
    resize();
    sync();
    return {
      update: function (s) { if (s && s.phase) { separate = true; phase = s.phase === "stream" ? "stream" : "notebook"; layer = 0; streamLayer = 0; sync(); draw(); } },
      next: next,
      prev: prev,
      onKey: function (e) { return api.util.arrowKey(e, next, prev); },
      resize: resize,
      pause: function () {},
      resume: function () { draw(); },
      destroy: function () { if (streamRaf) cancelAnimationFrame(streamRaf); window.removeEventListener("resize", resize); window.removeEventListener("tm:theme", draw); el.remove(); }
    };
  }

  core.register("residual", residualScene);
})();
