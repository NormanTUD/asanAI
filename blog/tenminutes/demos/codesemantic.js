(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function codeSemanticScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-codesem-scene";
    el.innerHTML = '<div class="ls-codesem-stage"><canvas class="ls-codesem-canvas" role="img"></canvas></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-codesem-stage");
    var canvas = el.querySelector(".ls-codesem-canvas");
    var C = api.colors();
    var size = null, kind = "language", raf = 0, running = true;
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var CARDS = [
      {
        key: "py",
        title: DE ? "Python-Stil" : "Python style",
        code: "def quickSort",
        color: "green",
        noise: ["def"],
        tokens: [{ t: "def", noise: true }, { t: "quick" }, { t: "Sort" }]
      },
      {
        key: "js",
        title: DE ? "JavaScript-Stil" : "JavaScript style",
        code: "function quick_sort",
        color: "blue",
        noise: ["function", "_"],
        tokens: [{ t: "function", noise: true }, { t: "quick" }, { t: "_", noise: true }, { t: "sort" }]
      }
    ];
    var LANG_CARDS = [
      {
        key: "de",
        title: "Deutsch",
        color: "green",
        variants: [
          { label: DE ? "mit Tippfehlern" : "with typos", sentence: "Der Hundt läuft die Strasse.", noise: ["Hundt", "Strasse"] },
          { label: DE ? "mit Tippfehler" : "with a typo", sentence: "Der Hund läuft die Strase.", noise: ["Strase"] },
          { label: DE ? "sauber" : "clean", sentence: "Der Hund läuft die Straße.", noise: [] }
        ]
      },
      {
        key: "en",
        title: "English",
        color: "blue",
        variants: [
          { label: DE ? "mit Tippfehler" : "with a typo", sentence: "The dgo runs the street.", noise: ["dgo"] },
          { label: DE ? "mit Tippfehler" : "with a typo", sentence: "The dog runz the street.", noise: ["runz"] },
          { label: DE ? "sauber" : "clean", sentence: "The dog runs the street.", noise: [] }
        ]
      },
      {
        key: "fr",
        title: "Français",
        color: "gold",
        variants: [
          { label: DE ? "mit Tippfehler" : "with a typo", sentence: "Le chienn court la rue.", noise: ["chienn"] },
          { label: DE ? "mit Tippfehler" : "with a typo", sentence: "Le chien court la ruee.", noise: ["ruee"] },
          { label: DE ? "sauber" : "clean", sentence: "Le chien court la rue.", noise: [] }
        ]
      }
    ];
    function fontPx(scale, min) {
      return Math.max(min || 8, api.font("canvas-sm") * scale);
    }
    function cardColor(card) {
      return C[card.color] || C.petrol;
    }
    function drawCard(ctx, card, x, y, cw, ch, active) {
      var col = cardColor(card);
      var tokenPositions = [];
      ctx.save();
      ctx.fillStyle = C.paper;
      ctx.strokeStyle = active ? V.alpha(col, 0.72) : V.alpha(C.line, 0.9);
      ctx.lineWidth = active ? 1.6 : 1;
      ctx.fillRect(x, y, cw, ch);
      ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
      ctx.fillStyle = V.alpha(col, active ? 0.10 : 0.04);
      ctx.fillRect(x, y, cw, 22);
      ctx.fillStyle = active ? col : C.muted;
      ctx.font = '700 ' + Math.max(11, Math.min(14, cw * 0.05)) + 'px "Barlow", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(card.title, x + 9, y + 12);
      var codeFont = Math.max(11, Math.min(15, cw * 0.055));
      ctx.font = '700 ' + codeFont + 'px ui-monospace,"Cascadia Code",Menlo,Consolas,monospace';
      var codeY = y + Math.max(32, Math.min(40, ch * 0.34));
      var codeX = x + 10;
      card.noise.forEach(function (noiseText) {
        var idx = card.code.indexOf(noiseText);
        if (idx < 0) return;
        var pre = card.code.slice(0, idx);
        var nx = codeX + ctx.measureText(pre).width;
        var nw = ctx.measureText(noiseText).width;
        ctx.fillStyle = V.alpha(C.lilac, 0.20);
        ctx.fillRect(nx - 2, codeY - 9, nw + 4, 16);
      });
      ctx.fillStyle = C.ink;
      ctx.fillText(card.code, codeX, codeY);
      var chipY = y + ch - Math.max(14, Math.min(22, ch * 0.19));
      var tx = x + 10;
      var chipFont = Math.max(6, Math.min(10, cw * 0.034));
      card.tokens.forEach(function (tok) {
        ctx.font = '700 ' + chipFont + 'px "Open Sans", sans-serif';
        var tw = ctx.measureText(tok.t).width;
        var w = tw + 10, h = chipFont + 10;
        var noise = !!tok.noise;
        ctx.fillStyle = noise ? V.alpha(C.lilac, 0.10) : V.alpha(col, active ? 0.08 : 0.03);
        ctx.fillRect(tx, chipY - h / 2, w, h);
        ctx.strokeStyle = noise ? V.alpha(C.lilac, 0.65) : V.alpha(col, active ? 0.55 : 0.22);
        ctx.lineWidth = 1;
        ctx.strokeRect(tx + 0.5, chipY - h / 2 + 0.5, w - 1, h - 1);
        ctx.fillStyle = noise ? C.lilac : (active ? C.ink : C.muted);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tok.t, tx + w / 2, chipY + 0.5);
        tokenPositions.push({ x: tx + w / 2, y: chipY, noise: noise, color: col, i: tokenPositions.length });
        tx += w + 4;
      });
      ctx.restore();
      return tokenPositions;
    }
    function wrapWords(ctx, text, maxWidth) {
      var words = String(text || "").split(/\s+/).filter(Boolean);
      var lines = [], line = "", lineWidth = 0;
      var spaceWidth = ctx.measureText(" ").width;
      words.forEach(function (word) {
        var wordWidth = ctx.measureText(word).width;
        if (line && lineWidth + spaceWidth + wordWidth > maxWidth) {
          lines.push(line);
          line = word;
          lineWidth = wordWidth;
        } else {
          if (line) { line += " "; lineWidth += spaceWidth; }
          line += word;
          lineWidth += wordWidth;
        }
      });
      if (line) lines.push(line);
      return lines;
    }
    function drawLangCard(ctx, card, x, y, cw, ch, active) {
      var col = cardColor(card);
      var noisePoints = [];
      var titleFont = Math.max(11, Math.min(14, cw * 0.05));
      var labelFont = Math.max(8, Math.min(10, cw * 0.034));
      var sentenceFont = Math.max(12, Math.min(16, cw * 0.058));
      var headerH = Math.max(26, Math.min(30, ch * 0.17));
      var pad = Math.max(9, Math.min(12, cw * 0.04));
      ctx.save();
      ctx.fillStyle = C.paper;
      ctx.strokeStyle = active ? V.alpha(col, 0.72) : V.alpha(C.line, 0.9);
      ctx.lineWidth = active ? 1.6 : 1;
      ctx.fillRect(x, y, cw, ch);
      ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
      ctx.fillStyle = V.alpha(col, active ? 0.10 : 0.04);
      ctx.fillRect(x, y, cw, headerH);
      ctx.fillStyle = active ? col : C.muted;
      ctx.font = '700 ' + titleFont + 'px "Barlow", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(card.title, x + pad, y + headerH / 2 + 1);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 1, y + headerH, cw - 2, ch - headerH - 1);
      ctx.clip();
      var rowH = (ch - headerH - 4) / card.variants.length;
      var maxW = cw - pad * 2;
      card.variants.forEach(function (variant, vi) {
        var rowY = y + headerH + vi * rowH;
        ctx.font = '700 ' + labelFont + 'px "Open Sans", sans-serif';
        ctx.fillStyle = variant.noise.length ? C.lilac : col;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(variant.label, x + pad, rowY + labelFont * 0.85);
        ctx.font = '600 ' + sentenceFont + 'px "Open Sans", sans-serif';
        var lines = wrapWords(ctx, variant.sentence, maxW);
        var lineY = rowY + labelFont * 1.8 + sentenceFont * 0.82;
        lines.forEach(function (lineText) {
          if (lineY > rowY + rowH - 1) return;
          var lx = x + pad;
          ctx.textBaseline = "alphabetic";
          lineText.split(" ").forEach(function (word, wi) {
            if (wi) lx += ctx.measureText(" ").width;
            var ww = ctx.measureText(word).width;
            var key = word.replace(/[.,!?;:„“"'()]/g, "");
            if (variant.noise.indexOf(key) >= 0) {
              ctx.fillStyle = V.alpha(C.lilac, 0.22);
              ctx.fillRect(lx - 1, lineY - sentenceFont * 0.82, ww + 2, sentenceFont * 1.12);
              noisePoints.push({ x: lx + ww / 2, y: lineY, noise: true, color: col, i: noisePoints.length });
            }
            ctx.fillStyle = C.ink;
            ctx.fillText(word, lx, lineY);
            lx += ww;
          });
          lineY += sentenceFont * 1.18;
        });
      });
      ctx.restore();
      ctx.restore();
      return noisePoints;
    }
    function draw(now) {
      if (!size) return;
      now = now || performance.now();
      var ctx = size.ctx, w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.64, h * 0.46, 10, w * 0.54, h * 0.5, Math.max(w, h) * 0.8);
      bg.addColorStop(0, V.alpha(C.paper2, 0.92));
      bg.addColorStop(1, V.alpha(C.paper, 0));
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      V.grid(ctx, w, h, C, 28, 0.12);
      var isLang = kind === "language";
      var list = isLang ? LANG_CARDS : CARDS;
      var cardW = Math.min(w * 0.38, 330);
      var cardX = 14;
      var gap = isLang ? Math.max(6, h * 0.018) : Math.max(10, h * 0.045);
      var cardH, starts = [];
      if (isLang) {
        var y0 = Math.max(28, h * 0.07);
        cardH = Math.min(h * 0.30, 180);
        if (y0 + cardH * 3 + gap * 2 > h - 8) cardH = Math.max(76, (h - y0 - gap * 2 - 8) / 3);
        for (var ci = 0; ci < 3; ci++) starts.push(y0 + ci * (cardH + gap));
      } else {
        cardH = Math.min(h * 0.36, 124);
        var yA = Math.max(36, h * 0.12);
        var yB = yA + cardH + gap;
        if (yB + cardH > h - 10) {
          cardH = Math.max(62, (h - yA - gap - 16) / 2);
          yB = yA + cardH + gap;
        }
        starts = [yA, yB];
      }
      var spaceX = cardX + cardW + Math.max(18, w * 0.03);
      var spaceRight = w - 14;
      var spaceTop = Math.max(44, h * 0.11);
      var spaceBottom = h - Math.max(24, h * 0.075);
      var spaceW = Math.max(90, spaceRight - spaceX);
      var spaceH = Math.max(84, spaceBottom - spaceTop);
      var nodeR = Math.min(42, w * 0.07, h * 0.13);
      var nodeX = spaceX + spaceW * 0.74;
      var nodeY = spaceTop + spaceH * 0.52;
      var filterX = spaceX - Math.max(8, w * 0.012);
      var positions = list.map(function (card, idx) {
        return isLang
          ? drawLangCard(ctx, card, cardX, starts[idx], cardW, cardH, true)
          : drawCard(ctx, card, cardX, starts[idx], cardW, cardH, true);
      });
      ctx.save();
      ctx.fillStyle = V.alpha(C.paper2, 0.45);
      ctx.fillRect(spaceX, spaceTop, spaceW, spaceH);
      ctx.strokeStyle = V.alpha(C.line, 0.8);
      ctx.lineWidth = 1;
      ctx.strokeRect(spaceX + 0.5, spaceTop + 0.5, spaceW - 1, spaceH - 1);
      var axisX = spaceX + 16;
      var axisY = spaceTop + spaceH - 16;
      V.arrow(ctx, axisX, axisY, spaceX + spaceW - 12, axisY, V.alpha(C.line, 0.9), 1, 5);
      V.arrow(ctx, axisX, axisY, axisX, spaceTop + 10, V.alpha(C.line, 0.9), 1, 5);
      V.label(ctx, DE ? "Dim 1" : "dim 1", spaceX + spaceW - 14, axisY - 8, { font: '600 ' + fontPx(0.78, 7) + 'px "Open Sans", sans-serif', color: C.muted, align: "right", bg: false });
      V.label(ctx, DE ? "Dim 2" : "dim 2", axisX + 6, spaceTop + 16, { font: '600 ' + fontPx(0.78, 7) + 'px "Open Sans", sans-serif', color: C.muted, align: "left", bg: false });
      ctx.restore();
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = V.alpha(C.lilac, 0.45);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(filterX, spaceTop);
      ctx.lineTo(filterX, spaceBottom);
      ctx.stroke();
      ctx.restore();
      V.label(ctx, DE ? "Rauschfilter" : "noise filter", filterX, spaceTop - 9, { font: '700 ' + fontPx(1.0, 9) + 'px "Barlow", sans-serif', color: C.lilac, align: "center" });
      function drawNoiseDots(tokenPositions) {
        tokenPositions.forEach(function (pos) {
          if (!pos.noise) return;
          var end = { x: filterX - 6, y: pos.y + (nodeY - pos.y) * 0.22 };
          if (reduced) {
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = C.lilac;
            ctx.beginPath();
            ctx.arc(end.x, end.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
          }
          var u = ((now / 1500) + pos.i * 0.23) % 1;
          var px = pos.x + (end.x - pos.x) * V.ease(u);
          var py = pos.y + (end.y - pos.y) * V.ease(u);
          ctx.save();
          ctx.globalAlpha = 0.12 + 0.65 * Math.sin(Math.PI * u);
          ctx.fillStyle = C.lilac;
          ctx.beginPath();
          ctx.arc(px, py, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }
      var startGroups = list.map(function (card, idx) {
        var count = card.variants ? card.variants.length : 1;
        var baseX = spaceX + spaceW * (0.16 + 0.07 * (idx / Math.max(1, list.length - 1)));
        var baseY = spaceTop + spaceH * ((idx + 1) / (list.length + 1));
        var spread = count > 1 ? 9 : 0;
        var entries = [];
        for (var j = 0; j < count; j++) {
          entries.push({ x: baseX + (j - (count - 1) / 2) * spread, y: baseY, card: card });
        }
        return { card: card, baseX: baseX, baseY: baseY, entries: entries };
      });
      var startEntries = [];
      startGroups.forEach(function (group) { startEntries = startEntries.concat(group.entries); });
      function drawMovingPoints(start, card, idx) {
        var col = cardColor(card);
        var dx = nodeX - start.x, dy = nodeY - start.y;
        var len = Math.hypot(dx, dy) || 1;
        var ex = nodeX - dx / len * (nodeR + 2);
        var ey = nodeY - dy / len * (nodeR + 2);
        var u = reduced ? 0.72 : ((now / 1700) + idx * 0.23) % 1;
        var e = V.ease(u);
        var px = start.x + (ex - start.x) * e;
        var py = start.y + (ey - start.y) * e;
        ctx.save();
        ctx.globalAlpha = reduced ? 0.55 : 0.10 + 0.82 * Math.sin(Math.PI * u);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(px, py, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      function drawStartPoint(start) {
        var col = cardColor(start.card);
        ctx.save();
        ctx.beginPath();
        ctx.arc(start.x, start.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = V.alpha(col, 0.18);
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
      function drawStartGroup(group) {
        V.label(ctx, group.card.key.toUpperCase(), group.baseX, group.baseY - 15, { font: '700 ' + fontPx(0.92, 9) + 'px "Open Sans", sans-serif', color: cardColor(group.card), align: "center", bg: false });
      }
      list.forEach(function (card, idx) { drawNoiseDots(positions[idx]); });
      startEntries.forEach(function (start, idx) {
        drawMovingPoints(start, start.card, idx);
        drawStartPoint(start);
      });
      startGroups.forEach(drawStartGroup);
      var nodeMain = isLang ? (DE ? "Bedeutung" : "meaning") : "Quicksort";
      var nodeSub = isLang ? (DE ? "Hund läuft Straße" : "dog runs street") : (DE ? "Funktion" : "function");
      var nodeAbove = isLang ? (DE ? "sprachunabhängig" : "language-independent") : (DE ? "abstrakte Bedeutung" : "abstract meaning");
      var nodeBelow = isLang ? (DE ? "drei Sätze, ein Punkt" : "three sentences, one point") : (DE ? "beide landen hier" : "both land here");
      var pulse = 0.5 + 0.5 * Math.sin(now / 430);
      ctx.save();
      var glow = ctx.createRadialGradient(nodeX, nodeY, 2, nodeX, nodeY, nodeR * 2.1);
      glow.addColorStop(0, V.alpha(C.petrol, 0.22));
      glow.addColorStop(1, V.alpha(C.paper, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, nodeR * 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = V.alpha(C.petrol, 0.18 + pulse * 0.20);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, nodeR + 6 + pulse * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = V.alpha(C.petrol, 0.13);
      ctx.fill();
      ctx.strokeStyle = C.petrol;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = C.petrol;
      ctx.font = '700 ' + fontPx(1.18, 11) + 'px "Barlow", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(nodeMain, nodeX, nodeY - 6);
      ctx.fillStyle = C.soft;
      ctx.font = '600 ' + fontPx(0.98, 9) + 'px "Open Sans", sans-serif';
      ctx.fillText(nodeSub, nodeX, nodeY + 13);
      V.label(ctx, nodeAbove, nodeX, nodeY - nodeR - 24, { font: '700 ' + fontPx(1.05, 10) + 'px "Barlow", sans-serif', color: C.petrol, align: "center" });
      V.label(ctx, nodeBelow, nodeX, nodeY + nodeR + 22, { font: '600 ' + fontPx(0.95, 9) + 'px "Open Sans", sans-serif', color: C.petrol, align: "center" });
      V.label(ctx, DE ? "lila = Rauschen" : "lilac = noise", w - 14, h - 12, { font: '600 ' + fontPx(0.9, 9) + 'px "Open Sans", sans-serif', color: C.lilac, align: "right", bg: false });
      var headingSize = Math.max(10, Math.min(12, w * 0.016));
      var spaceTitle = w < 520
        ? (DE ? "Embedding-Raum" : "Embedding space")
        : (DE ? "Fiktiver Embedding-Raum" : "Fictional embedding space");
      V.heading(ctx, isLang ? (DE ? "Drei Sprachen, eine Bedeutung" : "Three languages, one meaning") : (DE ? "Verschiedene Oberflächen, ein Punkt" : "Different surfaces, one point"), 14, 16, C.petrol, headingSize, 1);
      V.label(ctx, spaceTitle, w - 14, 16, { font: '700 ' + headingSize + 'px "Barlow", sans-serif', color: C.muted, align: "right", alpha: 1 });
      canvas.setAttribute("aria-label", isLang
        ? (DE ? "Neun Sätze in drei Sprachen, jeweils mit und ohne Tippfehler, zeigen auf denselben sprachunabhängigen Bedeutungs-Knoten. Tippfehler, Schreibweise und Sprache sind Rauschen; die Bedeutung landet auf demselben Punkt." : "Nine sentences in three languages, with and without typos, point to the same language-independent meaning node. Typos, spelling, and language are noise; the meaning lands on the same point.")
        : (DE ? "Zwei Codeblöcke, def quickSort und function quick_sort, zeigen auf denselben abstrakten Quicksort-Knoten. def und function sind Rauschen; die Bedeutung landet auf demselben Punkt." : "Two code blocks, def quickSort and function quick_sort, point to the same abstract quicksort node. def and function are noise; the meaning lands on the same point."));
    }
    function setKind(next) {
      kind = next === "code" ? "code" : "language";
      if (canvas.animate) {
        try { canvas.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 220, easing: "ease-out" }); } catch (e) {}
      }
      draw();
    }
    function loop() {
      if (!running) return;
      draw(performance.now());
      raf = requestAnimationFrame(loop);
    }
    function resize() {
      size = api.fit(canvas, stage);
      draw();
    }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    if (!reduced) raf = requestAnimationFrame(loop);
    return {
      update: function (s) { if (s && s.kind) setKind(s.kind); },
      setKind: setKind,
      next: function () { return false; },
      prev: function () { return false; },
      resize: resize,
      pause: function () { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
      resume: function () { if (!running && !reduced) { running = true; raf = requestAnimationFrame(loop); } else { running = true; draw(); } },
      destroy: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        el.remove();
      }
    };
  }
  core.register("codesemantic", codeSemanticScene);
})();
