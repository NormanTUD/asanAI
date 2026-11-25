(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function codeSemanticScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-codesem-scene";
    el.innerHTML = '<div class="ls-codesem-top">' +
      '<div class="ls-codesem-tasks" role="group" aria-label="' + (DE ? "Aufgabe" : "task") + '" data-tip="' + (DE ? "Die Aufgabe entscheidet, welche Merkmale als Signal zählen." : "The task decides which features count as signal.") + '"></div>' +
      '<div class="ls-codesem-compare" aria-live="polite"></div>' +
      '</div>' +
      '<div class="ls-codesem-stage" data-tip="' + (DE ? "Links die Karten, rechts der fiktive Embedding-Raum mit den Zielknoten." : "Cards on the left, the fictional embedding space with target nodes on the right.") + '"><canvas class="ls-codesem-canvas" role="img" data-tip="' + (DE ? "Farbige Punkte wandern zu dem Knoten, der zur Aufgabe passt." : "Coloured points move to the node that fits the task.") + '"></canvas><div class="ls-codesem-tip"></div></div>';
    root.appendChild(el);
    var tasksEl = el.querySelector(".ls-codesem-tasks");
    var compareEl = el.querySelector(".ls-codesem-compare");
    var stage = el.querySelector(".ls-codesem-stage");
    var canvas = el.querySelector(".ls-codesem-canvas");
    canvas.setAttribute("data-ls-canvas-tip", "1");
    var tipEl = el.querySelector(".ls-codesem-tip");
    var C = api.colors();
    var size = null, kind = "language", task = "meaning", raf = 0, running = true;
    var hoverHits = [];
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var CARDS = [
      {
        key: "py",
        title: DE ? "Python-Stil" : "Python style",
        code: "def quickSort",
        color: "green",
        noise: ["def"]
      },
      {
        key: "js",
        title: DE ? "JavaScript-Stil" : "JavaScript style",
        code: "function quick_sort",
        color: "blue",
        noise: ["function", "_"]
      },
      {
        key: "java",
        title: DE ? "Java-Stil" : "Java style",
        code: "void quickSort",
        color: "gold",
        noise: ["void"]
      },
      {
        key: "rust",
        title: DE ? "Rust-Stil" : "Rust style",
        code: "fn quick_sort",
        color: "sky",
        noise: ["fn", "_"]
      },
      {
        key: "go",
        title: DE ? "Go-Stil" : "Go style",
        code: "func quickSort",
        color: "lime",
        noise: ["func"]
      }
    ];
    var LANG_CARDS = [
      {
        key: "de",
        title: "Deutsch",
        color: "green",
        variants: [
          { label: DE ? "mit Tippfehlern" : "with typos", sentence: "Der Hundt läuft auf der Strasse.", noise: ["Hundt", "Strasse"] },
          { label: DE ? "mit Tippfehler" : "with a typo", sentence: "Der Hund läuft auf der Strase.", noise: ["Strase"] },
          { label: DE ? "sauber" : "clean", sentence: "Der Hund läuft auf der Straße.", noise: [] }
        ]
      },
      {
        key: "en",
        title: "English",
        color: "blue",
        variants: [
          { label: DE ? "mit Tippfehler" : "with a typo", sentence: "The dgo runs on the street.", noise: ["dgo"] },
          { label: DE ? "mit Tippfehler" : "with a typo", sentence: "The dog runz on the street.", noise: ["runz"] },
          { label: DE ? "sauber" : "clean", sentence: "The dog runs on the street.", noise: [] }
        ]
      },
      {
        key: "fr",
        title: "Français",
        color: "gold",
        variants: [
          { label: DE ? "mit Tippfehler" : "with a typo", sentence: "Le chienn court dans la rue.", noise: ["chienn"] },
          { label: DE ? "mit Tippfehler" : "with a typo", sentence: "Le chien court dans la ruee.", noise: ["ruee"] },
          { label: DE ? "sauber" : "clean", sentence: "Le chien court dans la rue.", noise: [] }
        ]
      }
    ];
    function fontPx(scale, min) {
      return Math.max(min || 8, api.font("canvas-sm") * scale);
    }
    function cardColor(card) {
      return C[card.color] || C.petrol;
    }
    function isDetailTask() {
      return kind === "language" ? task === "spelling" : task === "rewrite";
    }
    function featureColor() {
      return isDetailTask() ? C.gold : C.lilac;
    }
    function renderCompare() {
      var lang = kind === "language";
      var detail = isDetailTask();
      if (lang) {
        var a = DE ? "Der Hundt läuft auf der Strasse." : "The dgo runs on the strasse.";
        var b = DE ? "Der Hund läuft auf der Straße." : "The dog runs on the street.";
        var head = detail ? (DE ? "Kontext: Rechtschreibtest" : "context: spelling test") : (DE ? "Kontext: Bedeutung" : "context: meaning");
        var va = detail ? (DE ? "2 Fehler" : "2 errors") : (DE ? "gleiche Bedeutung" : "same meaning");
        var vb = detail ? (DE ? "korrekt" : "correct") : (DE ? "gleiche Bedeutung" : "same meaning");
        compareEl.innerHTML = '<div class="cc-head" data-tip="' + (DE ? "Der Kontext, gegen den die beiden Beispiele beurteilt werden." : "The context against which the two examples are judged.") + '">' + head + '</div>' +
          '<div class="cc-row"><span class="cc-sentence">' + a + '</span><span class="cc-verdict ' + (detail ? "is-detail" : "is-good") + '">' + va + '</span></div>' +
          '<div class="cc-row"><span class="cc-sentence">' + b + '</span><span class="cc-verdict is-good">' + vb + '</span></div>';
      } else {
        var ca = "def quick_sort";
        var cb = "function quickSort";
        var cHead = detail ? (DE ? "Kontext: In JS umschreiben" : "context: rewrite in JS") : (DE ? "Kontext: Algorithmus" : "context: algorithm");
        var cVa = detail ? (DE ? "muss nach JS" : "must become JS") : "Quicksort";
        var cVb = detail ? (DE ? "ist schon JS" : "is already JS") : "Quicksort";
        compareEl.innerHTML = '<div class="cc-head" data-tip="' + (DE ? "Der Kontext, gegen den die beiden Codebeispiele beurteilt werden." : "The context against which the two code examples are judged.") + '">' + cHead + '</div>' +
          '<div class="cc-row"><code>' + ca + '</code><span class="cc-verdict ' + (detail ? "is-detail" : "is-good") + '">' + cVa + '</span></div>' +
          '<div class="cc-row"><code>' + cb + '</code><span class="cc-verdict is-good">' + cVb + '</span></div>';
      }
    }
    function renderTasks() {
      var lang = kind === "language";
      var opts = lang
        ? [{ id: "meaning", label: DE ? "Bedeutung" : "meaning" }, { id: "spelling", label: DE ? "Rechtschreibung" : "spelling" }]
        : [{ id: "algorithm", label: DE ? "Algorithmus" : "algorithm" }, { id: "rewrite", label: DE ? "In JS umschreiben" : "rewrite in JS" }];
      tasksEl.innerHTML = '<span>' + (DE ? "Aufgabe:" : "task:") + '</span>' + opts.map(function (o) {
        var on = o.id === task;
        return '<button type="button" class="ls-codesem-task' + (on ? " is-on" : "") + '" data-task="' + o.id + '" aria-pressed="' + (on ? "true" : "false") + '" data-tip="' + (DE ? "Wechselt die Aufgabe und damit, was als Signal zählt." : "Switches the task and with it what counts as signal.") + '">' + api.esc(o.label) + '</button>';
      }).join("");
      tasksEl.querySelectorAll("[data-task]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var next = btn.getAttribute("data-task");
          if (next === task) return;
          task = next;
          renderTasks();
          draw();
        });
      });
      renderCompare();
    }
    function addPointHit(x, y, text, r) {
      hoverHits.push({ x: x, y: y, r: r, text: text });
    }
    function addRectHit(x, y, w, h, text) {
      hoverHits.push({ x: x, y: y, w: w, h: h, text: text });
    }
    function updateTip(x, y) {
      var hit = null;
      for (var i = hoverHits.length - 1; i >= 0; i--) {
        var h = hoverHits[i];
        if (h.r != null) {
          if (Math.hypot(x - h.x, y - h.y) <= h.r + 4) { hit = h; break; }
        } else if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
          hit = h; break;
        }
      }
      if (!hit) { tipEl.classList.remove("is-on"); return; }
      tipEl.textContent = hit.text;
      tipEl.classList.add("is-on");
      var left = Math.max(8, Math.min(x + 14, size.w - 310));
      var top = Math.max(8, Math.min(y + 14, size.h - 84));
      tipEl.style.left = left + "px";
      tipEl.style.top = top + "px";
    }
    function drawCard(ctx, card, x, y, cw, ch, active, featureColor) {
      var col = cardColor(card);
      var noisePoints = [];
      var titleFont = Math.max(11, Math.min(14, cw * 0.05));
      var headerH = Math.max(22, Math.min(28, ch * 0.22));
      var pad = Math.max(8, Math.min(12, cw * 0.04));
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
      var codeFont = Math.min(15, Math.max(8, (cw - 22) / 11.6));
      ctx.font = '700 ' + codeFont + 'px ui-monospace,"Cascadia Code",Menlo,Consolas,monospace';
      var codeY = y + headerH + (ch - headerH) * 0.55;
      var codeX = x + pad;
      card.noise.forEach(function (noiseText) {
        var idx = card.code.indexOf(noiseText);
        if (idx < 0) return;
        var nx = codeX + ctx.measureText(card.code.slice(0, idx)).width;
        var nw = ctx.measureText(noiseText).width;
        ctx.fillStyle = V.alpha(featureColor, 0.22);
        ctx.fillRect(nx - 2, codeY - codeFont * 0.8, nw + 4, codeFont * 1.15);
        noisePoints.push({ x: nx + nw / 2, y: codeY, noise: true, color: col, i: noisePoints.length, text: noiseText, cardTitle: card.title, cardKey: card.key });
      });
      ctx.fillStyle = C.ink;
      ctx.fillText(card.code, codeX, codeY);
      ctx.restore();
      return noisePoints;
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
    function drawLangCard(ctx, card, x, y, cw, ch, active, featureColor) {
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
        ctx.fillStyle = variant.noise.length ? featureColor : col;
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
              ctx.fillStyle = V.alpha(featureColor, 0.22);
              ctx.fillRect(lx - 1, lineY - sentenceFont * 0.82, ww + 2, sentenceFont * 1.12);
              noisePoints.push({ x: lx + ww / 2, y: lineY, noise: true, color: col, i: noisePoints.length, text: key, label: variant.label, sentence: variant.sentence });
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
      hoverHits = [];
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
      var detail = isDetailTask();
      var feat = featureColor();
      var list = isLang ? LANG_CARDS : CARDS;
      var cardW = Math.min(w * 0.38, 330);
      var cardX = 14;
      var gap = isLang ? Math.max(6, h * 0.018) : Math.max(6, h * 0.015);
      var cardH, starts = [];
      if (isLang) {
        var y0 = Math.max(28, h * 0.07);
        cardH = Math.min(h * 0.30, 180);
        if (y0 + cardH * 3 + gap * 2 > h - 8) cardH = Math.max(76, (h - y0 - gap * 2 - 8) / 3);
        for (var ci = 0; ci < 3; ci++) starts.push(y0 + ci * (cardH + gap));
      } else {
        var codeCount = list.length;
        var yA = Math.max(30, h * 0.06);
        cardH = Math.min(h * 0.22, 124);
        if (yA + cardH * codeCount + gap * (codeCount - 1) > h - 8) {
          cardH = Math.max(48, (h - yA - gap * (codeCount - 1) - 8) / codeCount);
        }
        for (var cj = 0; cj < codeCount; cj++) starts.push(yA + cj * (cardH + gap));
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
      var targets = null;
      if (detail) {
        var targetR = Math.min(nodeR * 0.72, spaceW * 0.12, 34);
        var rightRoom = spaceRight - nodeX - targetR - 4;
        var leftRoom = nodeX - spaceX - targetR - 4;
        var half = Math.min(Math.max(targetR * 1.5, 30), Math.max(20, Math.min(rightRoom, leftRoom)));
        var cleanCount = 0, badCount = 0;
        if (isLang) {
          LANG_CARDS.forEach(function (card) {
            card.variants.forEach(function (v) { if (v.noise.length) badCount += 1; else cleanCount += 1; });
          });
        } else {
          CARDS.forEach(function (card) { if (card.key === "js") cleanCount += 1; else badCount += 1; });
        }
        function countLabel(n, one, many) { return n + " " + (n === 1 ? one : many); }
        var okSub = isLang ? countLabel(cleanCount, DE ? "Satz" : "sentence", DE ? "Sätze" : "sentences") : countLabel(cleanCount, DE ? "Block" : "block", DE ? "Blöcke" : "blocks");
        var badSub = isLang ? countLabel(badCount, DE ? "Satz" : "sentence", DE ? "Sätze" : "sentences") : countLabel(badCount, DE ? "Block" : "block", DE ? "Blöcke" : "blocks");
        targets = {
          clean: { x: nodeX - half, y: nodeY, r: targetR, color: C.green, main: isLang ? (DE ? "korrekt" : "correct") : (DE ? "schon JS" : "already JS"), sub: okSub },
          bad: { x: nodeX + half, y: nodeY, r: targetR, color: C.gold, main: isLang ? (DE ? "Fehler" : "errors") : (DE ? "nach JS" : "needs JS"), sub: badSub }
        };
      }
      function targetFor(start) {
        if (!detail) return { x: nodeX, y: nodeY, r: nodeR };
        if (isLang) return start.variant && start.variant.noise.length ? targets.bad : targets.clean;
        return start.card.key === "js" ? targets.clean : targets.bad;
      }
      var positions = list.map(function (card, idx) {
        return isLang
          ? drawLangCard(ctx, card, cardX, starts[idx], cardW, cardH, true, feat)
          : drawCard(ctx, card, cardX, starts[idx], cardW, cardH, true, feat);
      });
      ctx.save();
      ctx.fillStyle = V.alpha(C.paper2, 0.45);
      ctx.fillRect(spaceX, spaceTop, spaceW, spaceH);
      ctx.strokeStyle = V.alpha(C.line, 0.8);
      ctx.lineWidth = 1;
      ctx.strokeRect(spaceX + 0.5, spaceTop + 0.5, spaceW - 1, spaceH - 1);
      ctx.restore();
      ctx.save();
      ctx.setLineDash(detail ? [] : [4, 5]);
      ctx.strokeStyle = V.alpha(feat, detail ? 0.7 : 0.45);
      ctx.lineWidth = detail ? 1.6 : 1.2;
      ctx.beginPath();
      ctx.moveTo(filterX, spaceTop);
      ctx.lineTo(filterX, spaceBottom);
      ctx.stroke();
      ctx.restore();
      V.label(ctx, detail ? (DE ? "Signal behalten" : "keep signal") : (DE ? "Rauschfilter" : "noise filter"), filterX, spaceTop - 9, { font: '700 ' + fontPx(1.0, 9) + 'px "Barlow", sans-serif', color: feat, align: "center" });
      function drawNoiseDots(tokenPositions, featureCol, isDetail) {
        tokenPositions.forEach(function (pos) {
          if (!pos.noise) return;
          if (isDetail) {
            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = featureCol;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
          }
          var end = { x: filterX - 6, y: pos.y + (nodeY - pos.y) * 0.22 };
          if (reduced) {
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = featureCol;
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
          ctx.fillStyle = featureCol;
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
          entries.push({ x: baseX + (j - (count - 1) / 2) * spread, y: baseY, card: card, variant: card.variants ? card.variants[j] : null });
        }
        return { card: card, baseX: baseX, baseY: baseY, entries: entries };
      });
      var startEntries = [];
      startGroups.forEach(function (group) { startEntries = startEntries.concat(group.entries); });
      startEntries.forEach(function (start) {
        var text;
        if (isLang) {
          var variant = start.variant;
          var verdict = detail
            ? (variant && variant.noise.length ? (DE ? "Signal: Tippfehler/Schreibweise zählt." : "signal: typo/spelling counts.") : (DE ? "Signal: korrekt." : "signal: correct."))
            : (DE ? "Rauschen: gleiche Bedeutung." : "noise: same meaning.");
          text = (variant ? variant.sentence + " — " + variant.label : start.card.title) + "\n" +
            (DE ? "Aufgabe: " : "task: ") + (detail ? (DE ? "Rechtschreibung" : "spelling") : (DE ? "Bedeutung" : "meaning")) + " · " + verdict;
        } else {
          var c = start.card;
          var cv = detail ? (c.key === "js" ? (DE ? "ist schon JS." : "is already JS.") : (DE ? "muss nach JS." : "must become JS.")) : "Quicksort.";
          text = c.code + " — " + c.title + "\n" +
            (DE ? "Aufgabe: " : "task: ") + (detail ? (DE ? "In JS umschreiben" : "rewrite in JS") : (DE ? "Algorithmus" : "algorithm")) + " · " + cv;
        }
        start.tip = text;
        addPointHit(start.x, start.y, text, 10);
      });
      function drawMovingPoints(start, card, idx) {
        var col = cardColor(card);
        var tgt = targetFor(start);
        var dx = tgt.x - start.x, dy = tgt.y - start.y;
        var len = Math.hypot(dx, dy) || 1;
        var ex = tgt.x - dx / len * (tgt.r + 2);
        var ey = tgt.y - dy / len * (tgt.r + 2);
        var u = reduced ? 0.72 : ((now / 1700) + idx * 0.23) % 1;
        var e = V.ease(u);
        var px = start.x + (ex - start.x) * e;
        var py = start.y + (ey - start.y) * e;
        addPointHit(px, py, start.tip || start.card.title, 7);
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
      list.forEach(function (card, idx) { drawNoiseDots(positions[idx], feat, detail); });
      list.forEach(function (card, idx) {
        positions[idx].forEach(function (pos) {
          if (!pos.noise) return;
          var t;
          if (isLang) {
            t = "„" + pos.text + "“ in „" + pos.sentence + "“\n" + (DE ? "In dieser Aufgabe: " : "in this task: ") +
              (detail ? (DE ? "Signal (zählt)." : "signal (it counts).") : (DE ? "Rauschen (wird gefiltert)." : "noise (it is filtered)."));
          } else {
            t = "„" + pos.text + "“ in „" + pos.cardTitle + "“\n" + (DE ? "In dieser Aufgabe: " : "in this task: ") +
              (detail ? (DE ? "Signal (Syntax zählt)." : "signal (syntax counts).") : (DE ? "Rauschen (wird gefiltert)." : "noise (it is filtered)."));
          }
          addRectHit(pos.x - 14, pos.y - 10, 28, 20, t);
        });
      });
      startEntries.forEach(function (start, idx) {
        drawMovingPoints(start, start.card, idx);
        drawStartPoint(start);
      });
      startGroups.forEach(drawStartGroup);
      function drawNode(t, color, main, sub, above, below) {
        var pulse = 0.5 + 0.5 * Math.sin(now / 430);
        ctx.save();
        var glow = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, t.r * 2.1);
        glow.addColorStop(0, V.alpha(color, 0.22));
        glow.addColorStop(1, V.alpha(C.paper, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r * 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = V.alpha(color, 0.18 + pulse * 0.20);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r + 5 + pulse * 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fillStyle = V.alpha(color, 0.13);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = '700 ' + fontPx(1.18, 11) + 'px "Barlow", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(main, t.x, t.y - 5);
        ctx.fillStyle = C.soft;
        ctx.font = '600 ' + fontPx(0.98, 9) + 'px "Open Sans", sans-serif';
        ctx.fillText(sub, t.x, t.y + 11);
        if (above) V.label(ctx, above, t.x, t.y - t.r - 18, { font: '700 ' + fontPx(1.05, 10) + 'px "Barlow", sans-serif', color: color, align: "center" });
        if (below) V.label(ctx, below, t.x, t.y + t.r + 18, { font: '600 ' + fontPx(0.95, 9) + 'px "Open Sans", sans-serif', color: color, align: "center" });
      }
      var nodeText;
      if (detail) {
        drawNode(targets.clean, targets.clean.color, targets.clean.main, targets.clean.sub, null, null);
        drawNode(targets.bad, targets.bad.color, targets.bad.main, targets.bad.sub, null, null);
        var cleanText = isLang ? (DE ? "korrekt: saubere Sätze." : "correct: clean sentences.") : (DE ? "schon JS: bereits JavaScript." : "already JS: it is JavaScript.");
        var badText = isLang ? (DE ? "Fehler: Sätze mit Tippfehlern oder Schreibvarianten." : "errors: sentences with typos or spelling variants.") : (DE ? "muss nach JS: noch keine JavaScript-Version." : "needs JS: not JavaScript yet.");
        addPointHit(targets.clean.x, targets.clean.y, cleanText + "\n" + (DE ? "Knoten: " : "node: ") + targets.clean.sub, targets.clean.r);
        addPointHit(targets.bad.x, targets.bad.y, badText + "\n" + (DE ? "Knoten: " : "node: ") + targets.bad.sub, targets.bad.r);
      } else {
        var nodeMain = isLang ? (DE ? "Bedeutung" : "meaning") : "Quicksort";
        var nodeSub = isLang ? (DE ? "Hund läuft Straße" : "dog runs street") : (DE ? "Funktion" : "function");
        var nodeAbove = isLang ? (DE ? "sprachübergreifend" : "cross-lingual") : (DE ? "abstrakte Bedeutung" : "abstract meaning");
        var nodeBelow = isLang ? (DE ? "neun Sätze, ein Punkt" : "nine sentences, one point") : (DE ? "fünf landen hier" : "five land here");
        drawNode({ x: nodeX, y: nodeY, r: nodeR }, C.petrol, nodeMain, nodeSub, nodeAbove, nodeBelow);
        nodeText = isLang ? (DE ? "Bedeutung: Alle Varianten landen hier." : "meaning: all variants land here.") : (DE ? "Quicksort: Alle Varianten landen hier." : "Quicksort: all variants land here.");
        addPointHit(nodeX, nodeY, nodeText, nodeR);
      }
      var legend = detail
        ? (isLang
          ? (DE ? "grün = korrekt · gold = Fehler (Aufgabe: Rechtschreibung)" : "green = correct · gold = error (task: spelling)")
          : (DE ? "grün = schon JS · gold = muss nach JS (Aufgabe: In JS umschreiben)" : "green = already JS · gold = needs JS (task: rewrite in JS)"))
        : (isLang
          ? (DE ? "lila = Rauschen (Aufgabe: Bedeutung)" : "lilac = noise (task: meaning)")
          : (DE ? "lila = Rauschen (Aufgabe: Algorithmus)" : "lilac = noise (task: algorithm)"));
      V.label(ctx, legend, w - 14, h - 12, { font: '600 ' + fontPx(0.9, 9) + 'px "Open Sans", sans-serif', color: feat, align: "right", bg: false });
      var headingSize = Math.max(10, Math.min(12, w * 0.016));
      var spaceTitle = w < 520
        ? (DE ? "Embedding-Raum" : "Embedding space")
        : (DE ? "Fiktiver Embedding-Raum" : "Fictional embedding space");
      var heading = isLang
        ? (detail ? (DE ? "Drei Sprachen, zwei Urteile" : "Three languages, two verdicts") : (DE ? "Drei Sprachen, eine Bedeutung" : "Three languages, one meaning"))
        : (detail ? (DE ? "Verschiedene Oberflächen, zwei Urteile" : "Different surfaces, two verdicts") : (DE ? "Verschiedene Oberflächen, ein Punkt" : "Different surfaces, one point"));
      V.heading(ctx, heading, 14, 16, C.petrol, headingSize, 1);
      V.label(ctx, spaceTitle, w - 14, 16, { font: '700 ' + headingSize + 'px "Barlow", sans-serif', color: C.muted, align: "right", alpha: 1 });
      canvas.setAttribute("aria-label", detail
        ? (isLang
          ? (DE ? "Neun Sätze, Aufgabe Rechtschreibung: saubere Sätze landen beim korrekt-Knoten, fehlerhafte beim Fehler-Knoten." : "Nine sentences, task spelling: clean sentences land at the correct node, faulty ones at the error node.")
          : (DE ? "Fünf Codeblöcke, Aufgabe In JavaScript umschreiben: JavaScript landet bei schon JS, die anderen bei muss nach JS." : "Five code blocks, task rewrite in JavaScript: JavaScript lands at already JS, the others at needs JS."))
        : (isLang
          ? (DE ? "Neun Sätze in drei Sprachen, Aufgabe Bedeutung: Tippfehler, Schreibweise und Sprache werden für diese Aufgabe gefiltert; die Bedeutung landet auf demselben Punkt." : "Nine sentences in three languages, task meaning: typos, spelling, and language are filtered for this task; the meaning lands on the same point.")
          : (DE ? "Fünf Codeblöcke in Python, JavaScript, Java, Rust und Go, Aufgabe Algorithmus: Syntax wird für diese Aufgabe gefiltert; die Bedeutung landet auf demselben Punkt." : "Five code blocks in Python, JavaScript, Java, Rust, and Go, task algorithm: syntax is filtered for this task; the meaning lands on the same point.")));
    }
    function setKind(next) {
      var value = next === "code" ? "code" : "language";
      if (value === kind) return;
      kind = value;
      task = value === "code" ? "algorithm" : "meaning";
      renderTasks();
      var dir = value === "code" ? 1 : -1;
      function apply() {
        draw();
      }
      if (V && V.crossfadeCanvas) V.crossfadeCanvas(canvas, apply, { dir: dir, duration: 260 });
      else apply();
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
    window.addEventListener("tm:theme", function () { C = api.colors(); renderTasks(); draw(); });
    canvas.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      updateTip(e.clientX - r.left, e.clientY - r.top);
    });
    canvas.addEventListener("pointerleave", function () { tipEl.classList.remove("is-on"); });
    renderTasks();
    resize();
    if (!reduced) raf = requestAnimationFrame(loop);
    return {
      update: function (s) { if (s && s.kind) setKind(s.kind); },
      setKind: setKind,
      next: function () {
        if (isDetailTask()) return false;
        task = kind === "language" ? "spelling" : "rewrite";
        renderTasks();
        draw();
        return true;
      },
      prev: function () {
        if (!isDetailTask()) return false;
        task = kind === "language" ? "meaning" : "algorithm";
        renderTasks();
        draw();
        return true;
      },
      hasNext: function () { return !isDetailTask(); },
      hasPrev: function () { return isDetailTask(); },
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
