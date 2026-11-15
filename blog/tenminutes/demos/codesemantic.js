(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function codeSemanticScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-codesem-scene";
    el.innerHTML = '<div class="ls-codesem-stage"><canvas class="ls-codesem-canvas" role="img"></canvas></div>' +
      '<div class="ls-codesem-modes" role="group" aria-label="' + (DE ? "Art des Rauschens" : "Kind of noise") + '">' +
        '<button type="button" class="ls-chip is-on" data-sem-kind="language">' + (DE ? "Sprache" : "Language") + '</button>' +
        '<button type="button" class="ls-chip" data-sem-kind="code">Code</button>' +
      '</div>' +
      '<div class="ls-codesem-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-codesem-stage");
    var canvas = el.querySelector(".ls-codesem-canvas");
    var readout = el.querySelector(".ls-codesem-readout");
    var kindBtns = Array.prototype.slice.call(el.querySelectorAll("[data-sem-kind]"));
    var C = api.colors();
    var size = null, kind = "language", raf = 0, running = true, lastReadout = "";
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
        sentence: "Der Hundt läuft die Strasse.",
        color: "green",
        noise: ["Hundt", "Strasse"],
        tokens: [{ t: "Hundt", noise: true }, { t: "läuft" }, { t: "Strasse", noise: true }]
      },
      {
        key: "en",
        title: "English",
        sentence: "The dgo runs the street.",
        color: "blue",
        noise: ["dgo"],
        tokens: [{ t: "dgo", noise: true }, { t: "runs" }, { t: "street" }]
      },
      {
        key: "fr",
        title: "Français",
        sentence: "Le chienn court la rue.",
        color: "gold",
        noise: ["chienn"],
        tokens: [{ t: "chienn", noise: true }, { t: "court" }, { t: "rue" }]
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
      ctx.font = '700 ' + fontPx(1.05, 9) + 'px "Barlow", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(card.title, x + 9, y + 11);
      var codeFont = Math.max(10, Math.min(13, cw * 0.052));
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
    function drawLangCard(ctx, card, x, y, cw, ch, active) {
      var col = cardColor(card);
      var tokenPositions = [];
      ctx.save();
      ctx.fillStyle = C.paper;
      ctx.strokeStyle = active ? V.alpha(col, 0.72) : V.alpha(C.line, 0.9);
      ctx.lineWidth = active ? 1.6 : 1;
      ctx.fillRect(x, y, cw, ch);
      ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
      ctx.fillStyle = V.alpha(col, active ? 0.10 : 0.04);
      ctx.fillRect(x, y, cw, 20);
      ctx.fillStyle = active ? col : C.muted;
      ctx.font = '700 ' + fontPx(1.0, 9) + 'px "Barlow", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(card.title, x + 9, y + 10);
      var sentenceFont = Math.max(7, Math.min(10, (cw - 18) / Math.max(12, card.sentence.length * 0.52)));
      ctx.font = '600 ' + sentenceFont + 'px "Open Sans", sans-serif';
      var sentY = y + Math.min(30, ch * 0.44);
      var sentX = x + 10;
      card.noise.forEach(function (noiseText) {
        var idx = card.sentence.indexOf(noiseText);
        if (idx < 0) return;
        var pre = card.sentence.slice(0, idx);
        var nx = sentX + ctx.measureText(pre).width;
        var nw = ctx.measureText(noiseText).width;
        ctx.fillStyle = V.alpha(C.lilac, 0.22);
        ctx.fillRect(nx - 2, sentY - 7, nw + 4, 13);
      });
      ctx.fillStyle = C.ink;
      ctx.fillText(card.sentence, sentX, sentY);
      var chipY = y + ch - Math.max(12, Math.min(18, ch * 0.16));
      var tx = x + 10;
      var chipFont = Math.max(6, Math.min(9, cw * 0.028));
      card.tokens.forEach(function (tok) {
        ctx.font = '700 ' + chipFont + 'px "Open Sans", sans-serif';
        var tw = ctx.measureText(tok.t).width;
        var w = tw + 9, h = chipFont + 9;
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
        tx += w + 3;
      });
      ctx.restore();
      return tokenPositions;
    }
    function drawPath(ctx, a, b, col, alpha, dash) {
      var mx = (a.x + b.x) / 2;
      var my = (a.y + b.y) / 2 + (b.y - a.y) * 0.16 - 12;
      ctx.save();
      ctx.strokeStyle = col;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.5;
      if (dash) ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(mx, my, b.x, b.y);
      ctx.stroke();
      ctx.restore();
      return { mx: mx, my: my };
    }
    function pathPoint(a, b, mx, my, u) {
      return {
        x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * b.x,
        y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * my + u * u * b.y
      };
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
      var cardW = Math.min(w * 0.40, 330);
      var cardX = 16;
      var gap = isLang ? Math.max(5, h * 0.02) : Math.max(10, h * 0.045);
      var cardH, starts = [];
      if (isLang) {
        cardH = Math.min(h * 0.25, 82);
        var y0 = Math.max(26, h * 0.08);
        if (y0 + cardH * 3 + gap * 2 > h - 8) cardH = Math.max(44, (h - y0 - gap * 2 - 8) / 3);
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
      var nodeR = Math.min(44, w * 0.075, h * 0.14);
      var nodeX = w - Math.max(70, w * 0.15);
      var nodeY = h * 0.50;
      var filterX = nodeX - nodeR - Math.max(42, w * 0.085);
      var positions = list.map(function (card, idx) {
        return isLang
          ? drawLangCard(ctx, card, cardX, starts[idx], cardW, cardH, true)
          : drawCard(ctx, card, cardX, starts[idx], cardW, cardH, true);
      });
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = V.alpha(C.lilac, 0.45);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(filterX, h * 0.13);
      ctx.lineTo(filterX, h * 0.87);
      ctx.stroke();
      ctx.restore();
      V.label(ctx, DE ? "Rauschfilter" : "noise filter", filterX, h * 0.105, { font: '700 ' + fontPx(0.95, 9) + 'px "Barlow", sans-serif', color: C.lilac, align: "center" });
      function drawTokenPaths(positions, card) {
        var col = cardColor(card);
        positions.forEach(function (pos) {
          if (pos.noise) {
            var end = { x: filterX - 7, y: pos.y + (nodeY - pos.y) * 0.32 };
            drawPath(ctx, pos, end, C.lilac, 0.42, true);
            ctx.save();
            ctx.strokeStyle = C.lilac;
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(end.x - 4, end.y - 4);
            ctx.lineTo(end.x + 4, end.y + 4);
            ctx.moveTo(end.x + 4, end.y - 4);
            ctx.lineTo(end.x - 4, end.y + 4);
            ctx.stroke();
            ctx.restore();
            return;
          }
          var target = { x: nodeX - nodeR * 0.35, y: nodeY };
          var mid = drawPath(ctx, pos, target, col, 0.62, false);
          if (!reduced) {
            for (var k = 0; k < 2; k++) {
              var u = ((now / 1250) + pos.i * 0.19 + k * 0.5) % 1;
              var p = pathPoint(pos, target, mid.mx, mid.my, u);
              ctx.globalAlpha = 0.16 + 0.62 * (1 - u);
              ctx.fillStyle = col;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
        });
      }
      list.forEach(function (card, idx) { drawTokenPaths(positions[idx], card); });
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
      ctx.font = '700 ' + fontPx(1.05, 10) + 'px "Barlow", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(nodeMain, nodeX, nodeY - 5);
      ctx.fillStyle = C.soft;
      ctx.font = '600 ' + fontPx(0.82, 8) + 'px "Open Sans", sans-serif';
      ctx.fillText(nodeSub, nodeX, nodeY + 12);
      V.label(ctx, nodeAbove, nodeX, nodeY - nodeR - 22, { font: '700 ' + fontPx(0.95, 9) + 'px "Barlow", sans-serif', color: C.petrol, align: "center" });
      V.label(ctx, nodeBelow, nodeX, nodeY + nodeR + 20, { font: '600 ' + fontPx(0.82, 8) + 'px "Open Sans", sans-serif', color: C.petrol, align: "center" });
      V.label(ctx, DE ? "lila = Rauschen" : "lilac = noise", w - 14, h - 12, { font: '600 ' + fontPx(0.8, 8) + 'px "Open Sans", sans-serif', color: C.lilac, align: "right", bg: false });
      V.heading(ctx, isLang ? (DE ? "Drei Sprachen, eine Bedeutung" : "Three languages, one meaning") : (DE ? "Verschiedene Oberflächen, ein Punkt" : "Different surfaces, one point"), 14, 16, C.petrol, 10, 1);
      V.heading(ctx, isLang ? (DE ? "Sprache" : "Language") : "Code", w - 14, 16, C.muted, 10, 1);
      canvas.setAttribute("aria-label", isLang
        ? (DE ? "Drei Sätze in drei Sprachen, mit Tippfehlern, zeigen auf denselben sprachunabhängigen Bedeutungs-Knoten. Tippfehler, Schreibweise und Sprache sind Rauschen; die Bedeutung landet auf demselben Punkt." : "Three sentences in three languages, with typos, point to the same language-independent meaning node. Typos, spelling, and language are noise; the meaning lands on the same point.")
        : (DE ? "Zwei Codeblöcke, def quickSort und function quick_sort, zeigen auf denselben abstrakten Quicksort-Knoten. def und function sind Rauschen; die Bedeutung landet auf demselben Punkt." : "Two code blocks, def quickSort and function quick_sort, point to the same abstract quicksort node. def and function are noise; the meaning lands on the same point."));
      updateReadout();
    }
    function updateReadout() {
      var html;
      if (kind === "language") {
        html = '<span><b>Deutsch / English / Français</b> → ' + (DE ? "Hund läuft Straße" : "dog runs street") + '</span><span><b>' + (DE ? "Rauschen" : "noise") + '</b> ' + (DE ? "Tippfehler, Schreibweise, Sprache" : "typos, spelling, language") + '</span><span><b>' + (DE ? "ein Punkt" : "one point") + '</b> ' + (DE ? "sprachunabhängige Bedeutung" : "language-independent meaning") + '</span>';
      } else {
        html = '<span><b>' + (DE ? "Beide" : "Both") + '</b> def quickSort / function quick_sort</span><span><b>' + (DE ? "Rauschen" : "noise") + '</b> def, function, _</span><span><b>' + (DE ? "ein Punkt" : "one point") + '</b> Quicksort-Funktion</span>';
      }
      if (html !== lastReadout) {
        lastReadout = html;
        readout.innerHTML = html;
      }
    }
    function setKind(next) {
      kind = next === "code" ? "code" : "language";
      kindBtns.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-sem-kind") === kind); });
      if (canvas.animate) {
        try { canvas.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 220, easing: "ease-out" }); } catch (e) {}
      }
      draw();
    }
    kindBtns.forEach(function (b) {
      b.addEventListener("click", function () { setKind(b.getAttribute("data-sem-kind")); });
    });
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
