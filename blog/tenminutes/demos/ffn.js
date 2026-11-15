(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function ffnScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var C = api.colors();
    var data = DE ? {
      fruit: {
        keys: [{ label: "Mechanik · Tür · öffnen", on: false }, { label: "Burg · Turm · König", on: true }, { label: "alt · prächtig · Garten", on: true }],
        values: [{ label: "Hinweis: Schlüssel, Tür, öffnen", on: false }, { label: "Hinweis: König, Turm, Burg", on: true }, { label: "Hinweis: alt, prächtig, Garten", on: true }],
        desc: "Die Burg-, Turm- und Königs-Muster passen; das Mechanik-Muster bleibt still."
      },
      tech: {
        keys: [{ label: "Mechanik · Tür · öffnen", on: true }, { label: "Burg · Turm · König", on: false }, { label: "alt · prächtig · Garten", on: false }],
        values: [{ label: "Hinweis: Schlüssel, Tür, öffnen", on: true }, { label: "Hinweis: König, Turm, Burg", on: false }, { label: "Hinweis: alt, prächtig, Garten", on: false }],
        desc: "Jetzt passt das Mechanik-Muster; die Burg-, Turm- und Königs-Muster bleiben still."
      }
    } : {
      fruit: {
        keys: [{ label: "mechanism · door · open", on: false }, { label: "castle · tower · king", on: true }, { label: "old · grand · garden", on: true }],
        values: [{ label: "Pull: key, door, open", on: false }, { label: "Pull: king, tower, castle", on: true }, { label: "Pull: old, grand, garden", on: true }],
        desc: "The castle, tower, and king patterns match; the mechanism pattern stays silent."
      },
      tech: {
        keys: [{ label: "mechanism · door · open", on: true }, { label: "castle · tower · king", on: false }, { label: "old · grand · garden", on: false }],
        values: [{ label: "Pull: key, door, open", on: true }, { label: "Pull: king, tower, castle", on: false }, { label: "Pull: old, grand, garden", on: false }],
        desc: "Now the mechanism pattern matches; the castle, tower, and king patterns stay silent."
      }
    };
    var labels = DE ? {
      fruitTitle: "Ich besichtige das Schloss",
      techTitle: "Ich öffne das Schloss",
      stream: "„Schloss“ + Kontext",
      output: "reicherer Vektor",
      core: "Burg · Turm · König",
      ring: "Mechanik · Tür · öffnen",
      bend: "Biegung",
      bendButton: "Raum biegen",
      separated: "getrennt",
      notSeparated: "noch nicht getrennt",
      plane: "Trennebene",
      hint: "Das ist ein MLP: Bereich anheben, bis eine Ebene trennt.",
      prev: "Voriger Kontext",
      next: "Nächster Kontext",
      step: "Kontext"
    } : {
      fruitTitle: "I ate the apple",
      techTitle: "I bought an Apple laptop",
      stream: "“apple” + context",
      output: "richer vector",
      core: "castle · tower · king",
      ring: "mechanism · door · open",
      bend: "Bend",
      bendButton: "Bend space",
      separated: "separated",
      notSeparated: "not separated",
      plane: "separating plane",
      hint: "This is an MLP: lift the region until a plane separates it.",
      prev: "Previous context",
      next: "Next context",
      step: "Context"
    };
    var el = document.createElement("div");
    el.className = "ls-ffn-scene";
    el.innerHTML =
      '<div class="ls-ffn-stepper">' +
        '<button type="button" class="ls-btn ls-btn--tiny ls-ffn-prev" aria-label="' + api.esc(labels.prev) + '">←</button>' +
        '<span class="ls-ffn-step-label" aria-live="polite"></span>' +
        '<button type="button" class="ls-btn ls-btn--tiny ls-ffn-next" aria-label="' + api.esc(labels.next) + '">→</button>' +
      '</div>' +
      '<div class="ls-ffn-contexts"></div>' +
      '<div class="ls-ffn-bend">' +
        '<div class="ls-ffn-bend-legend"><span><i class="is-core"></i>' + labels.core + '</span><span><i class="is-ring"></i>' + labels.ring + '</span></div>' +
        '<div class="ls-ffn-bend-stage"><canvas class="ls-ffn-bend-canvas" role="img"></canvas></div>' +
        '<div class="ls-ffn-bend-bar">' +
          '<label class="ls-range">' + labels.bend + ' <input type="range" class="ls-ffn-bend-range" min="0" max="1" step="0.01" value="0"><output>0.00</output></label>' +
          '<button type="button" class="ls-btn ls-btn--tiny ls-ffn-bend-toggle">' + labels.bendButton + '</button>' +
          '<span class="ls-ffn-bend-readout" aria-live="polite"></span>' +
        '</div>' +
      '</div>' +
      '<div class="ls-ffn-dims"><canvas class="ls-ffn-dims-canvas" role="img"></canvas><p class="ls-ffn-dims-caption">' + (DE ? "Input und Output bleiben d_model; das FFN dehnt den Vektor auf d_ff und projiziert ihn zurück. Es arbeitet pro Token." : "Input and output stay at d_model; the FFN expands the vector to d_ff and projects it back. It works per token.") + '</p></div>' +
      '<p class="ls-ffn-caveat">' + (DE ? "Die Punkte sind symbolisch: Im echten Modell liegen die Muster nichtlinear in einem hochdimensionalen Raum. Das MLP hebt sie in einen noch höheren Raum, macht die Cluster trennbarer und projiziert zurück. So isoliert es Bedeutungen und reicht eine abstraktere Repräsentation weiter. Die Beschriftungen sind eine didaktische Hilfe; die Muster sind gelernte Richtungen in W₁." : "The points are symbolic: in a real model the patterns lie nonlinearly in a high-dimensional space. The MLP lifts them into a higher space, makes the clusters more separable, and projects back. That is how it isolates meanings and passes on a more abstract representation. The labels are a teaching aid; the patterns are learned directions in W₁.") + '</p>';
    root.appendChild(el);
    var contextsEl = el.querySelector(".ls-ffn-contexts");
    var stepperEl = el.querySelector(".ls-ffn-stepper");
    var prevBtn = el.querySelector(".ls-ffn-prev");
    var nextBtn = el.querySelector(".ls-ffn-next");
    var stepLabel = el.querySelector(".ls-ffn-step-label");
    var bendStage = el.querySelector(".ls-ffn-bend-stage");
    var bendCanvas = el.querySelector(".ls-ffn-bend-canvas");
    var bendRange = el.querySelector(".ls-ffn-bend-range");
    var bendOut = el.querySelector(".ls-ffn-bend-bar output");
    var bendReadout = el.querySelector(".ls-ffn-bend-readout");
    var bendToggle = el.querySelector(".ls-ffn-bend-toggle");
    var dimsCanvas = el.querySelector(".ls-ffn-dims-canvas");
    var dimsSize = null;
    var bend = 0, bendRaf = 0, size = null, ctx = null;
    var modeOrder = ["fruit", "tech"];
    var activeMode = "fruit";
    function pill(item, withState) {
      return '<span class="ls-ffn-pill ' + (item.on ? "is-fire" : "is-idle") + '">' + api.esc(item.label) +
        (withState ? '<small>' + (item.on ? (DE ? "passt" : "matches") : (DE ? "still" : "silent")) + '</small>' : '') + '</span>';
    }
    function contextCard(mode, title) {
      var d = data[mode];
      var card = document.createElement("article");
      card.className = "ls-ffn-context" + (mode === "fruit" ? " is-active" : "");
      card.setAttribute("data-mode", mode);
      card.innerHTML =
        '<div class="ls-ffn-context-head"><span class="ls-ffn-stream-pill">' + labels.stream + '</span><span class="ls-ffn-context-title">' + api.esc(title) + '</span></div>' +
        '<div class="ls-ffn-flow">' +
          '<div class="ls-ffn-group"><div class="ls-ffn-head">' + (DE ? "Muster in W₁" : "Patterns in W₁") + '</div><div class="ls-ffn-chips">' + d.keys.map(function (k) { return pill(k, true); }).join("") + '</div></div>' +
          '<span class="ls-ffn-arrow" aria-hidden="true">→</span>' +
          '<div class="ls-ffn-group"><div class="ls-ffn-head">' + (DE ? "Pull in W₂" : "Pull in W₂") + '</div><div class="ls-ffn-chips">' + d.values.map(function (v) { return pill(v, false); }).join("") + '</div></div>' +
          '<span class="ls-ffn-out-pill">' + labels.output + '</span>' +
        '</div>' +
        '<p class="ls-ffn-desc">' + d.desc + '</p>';
      contextsEl.appendChild(card);
    }
    contextCard("fruit", labels.fruitTitle);
    contextCard("tech", labels.techTitle);
    function setContext(mode) {
      if (modeOrder.indexOf(mode) < 0) return;
      activeMode = mode;
      var cards = contextsEl.querySelectorAll(".ls-ffn-context");
      Array.prototype.forEach.call(cards, function (card) {
        var on = card.getAttribute("data-mode") === mode;
        card.classList.toggle("is-active", on);
        card.setAttribute("aria-hidden", on ? "false" : "true");
      });
      var idx = modeOrder.indexOf(mode);
      stepLabel.textContent = labels.step + " " + (idx + 1) + " / " + modeOrder.length;
      prevBtn.disabled = idx <= 0;
      nextBtn.disabled = idx >= modeOrder.length - 1;
      drawBend();
    }
    function stepContext(delta) {
      var idx = modeOrder.indexOf(activeMode) + delta;
      if (idx < 0 || idx >= modeOrder.length) return false;
      setContext(modeOrder[idx]);
      return true;
    }
    prevBtn.addEventListener("click", function () { stepContext(-1); });
    nextBtn.addEventListener("click", function () { stepContext(1); });
    var ffnPoints = null, ffnEdges = null;
    function buildFfnGraph() {
      if (ffnPoints) return;
      var seed = 17;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      ffnPoints = [];
      for (var c = 0; c < 2; c++) {
        var n = c === 0 ? 90 : 150;
        for (var k = 0; k < n; k++) {
          var a = k * 2.399963229728653 + rnd() * 0.25;
          var r = c === 0 ? 0.32 * Math.sqrt((k + 0.5) / n) : 0.55 + 0.34 * Math.sqrt((k + 0.5) / n);
          ffnPoints.push({ x: Math.cos(a) * r + (rnd() - 0.5) * 0.025, y: Math.sin(a) * r + (rnd() - 0.5) * 0.025, c: c });
        }
      }
      ffnEdges = [];
      var lim = 0.15;
      for (var i = 0; i < ffnPoints.length; i++) {
        for (var j = i + 1; j < ffnPoints.length; j++) {
          if (ffnPoints[i].c !== ffnPoints[j].c) continue;
          var dx = ffnPoints[i].x - ffnPoints[j].x, dy = ffnPoints[i].y - ffnPoints[j].y;
          if (dx * dx + dy * dy < lim * lim) ffnEdges.push({ a: i, b: j });
        }
      }
    }
    function drawBend() {
      if (!size) return;
      buildFfnGraph();
      var C = api.colors();
      ctx = size.ctx;
      var w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w * 0.5, cy = h * 0.58;
      var scale = Math.min(w * 0.38, h * 0.34);
      function warp(x, y) {
        var r2 = x * x + y * y;
        return { x: x, y: y, z: bend * 1.45 * Math.exp(-r2 / 0.20) };
      }
      function project(x, y, z) {
        return { x: cx + x * scale + z * scale * 0.25, y: cy + y * scale * 0.35 - z * scale * 0.98, z: z };
      }
      ctx.strokeStyle = C.line;
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 1;
      var N = 12;
      for (var i = 0; i <= N; i++) {
        ctx.beginPath();
        for (var j = 0; j <= N; j++) {
          var wp = warp(-1 + 2 * i / N, -1 + 2 * j / N);
          var p = project(wp.x, wp.y, wp.z);
          if (j === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.beginPath();
        for (var j2 = 0; j2 <= N; j2++) {
          var wp2 = warp(-1 + 2 * j2 / N, -1 + 2 * i / N);
          var p2 = project(wp2.x, wp2.y, wp2.z);
          if (j2 === 0) ctx.moveTo(p2.x, p2.y); else ctx.lineTo(p2.x, p2.y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      var projected = ffnPoints.map(function (pt) {
        var wp = warp(pt.x, pt.y);
        var p = project(wp.x, wp.y, wp.z);
        return { x: p.x, y: p.y, z: p.z, c: pt.c };
      });
      ffnEdges.forEach(function (e) {
        var a = projected[e.a], b = projected[e.b];
        ctx.strokeStyle = a.c === 0 ? C.green : C.gold;
        ctx.globalAlpha = 0.16 + 0.12 * (1 - Math.max(0, Math.min(1, bend)));
        ctx.lineWidth = 0.65;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      projected.sort(function (a, b) { return a.z - b.z; });
      projected.forEach(function (p) {
        var active = (p.c === 0 && activeMode === "fruit") || (p.c === 1 && activeMode === "tech");
        ctx.beginPath();
        ctx.arc(p.x, p.y, (p.c === 0 ? 2.6 : 2.3) * (active ? 1.12 : 1), 0, Math.PI * 2);
        ctx.fillStyle = p.c === 0 ? C.green : C.gold;
        ctx.globalAlpha = active ? 0.9 : 0.22;
        ctx.fill();
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = active ? 1 : 0.4;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      var lineAlpha = Math.max(0, Math.min(1, (bend - 0.45) / 0.25));
      if (lineAlpha > 0.01) {
        var ly = cy - 0.62 * scale * 0.98;
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = C.petrol;
        ctx.globalAlpha = lineAlpha;
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(16, ly); ctx.lineTo(w - 16, ly); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = C.petrol;
        ctx.globalAlpha = lineAlpha;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "right";
        ctx.fillText(labels.plane, w - 18, ly - 6);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(labels.bend + " " + bend.toFixed(2), 14, 18);
      ctx.textAlign = "center";
      ctx.fillText(DE ? "feine Punktwolke · Kanten = Nachbarschaft" : "fine point cloud · edges = neighbourhood", w / 2, h - 10);
      bendCanvas.setAttribute("aria-label", (DE ? "Feine Punktwolke des FFN-Raums. " : "Fine point cloud of the FFN space. ") + labels.hint + " " + (bend > 0.6 ? labels.separated : labels.notSeparated) + ".");
    }
    function updateBendReadout() {
      bendOut.textContent = bend.toFixed(2);
      bendReadout.textContent = labels.bend + " " + bend.toFixed(2) + " · " + (bend > 0.6 ? labels.separated : labels.notSeparated);
    }
    function setBend(v) {
      bend = Math.max(0, Math.min(1, v));
      bendRange.value = String(bend);
      updateBendReadout();
      drawBend();
    }
    function animateBend(target) {
      if (bendRaf) cancelAnimationFrame(bendRaf);
      var from = bend, t0 = performance.now(), dur = 620;
      function frame(now) {
        var t = Math.max(0, Math.min(1, (now - t0) / dur));
        var e = 1 - Math.pow(1 - t, 3);
        bend = from + (target - from) * e;
        bendRange.value = String(bend);
        updateBendReadout();
        drawBend();
        if (t < 1) bendRaf = requestAnimationFrame(frame);
        else bendRaf = 0;
      }
      bendRaf = requestAnimationFrame(frame);
    }
    bendRange.addEventListener("input", function () { setBend(parseFloat(bendRange.value) || 0); });
    bendToggle.addEventListener("click", function () { animateBend(bend > 0.5 ? 0 : 1); });
    function drawDims() {
      if (!dimsCanvas || !dimsCanvas.parentNode) return;
      dimsSize = api.fit(dimsCanvas, dimsCanvas.parentNode);
      var g = dimsSize.ctx, w = dimsSize.w, h = dimsSize.h;
      g.clearRect(0, 0, w, h);
      g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
      var groups = [
        { x: w * 0.16, n: 8, color: C.blue, label: "Input · d_model" },
        { x: w * 0.50, n: 24, color: C.gold, label: "Hidden · d_ff" },
        { x: w * 0.84, n: 8, color: C.green, label: "Output · d_model" }
      ];
      var base = h - 20, top = 24, maxH = h - 48;
      groups.forEach(function (grp, gi) {
        var bw = Math.max(2, Math.min(12, (w * 0.16) / grp.n));
        for (var i = 0; i < grp.n; i++) {
          var bh = (0.28 + 0.60 * Math.abs(Math.sin(i * 0.82 + gi * 1.7 + 0.4))) * maxH;
          g.fillStyle = grp.color; g.globalAlpha = 0.45 + 0.45 * (i / grp.n);
          g.fillRect(grp.x - (grp.n * bw) / 2 + i * bw, base - bh, Math.max(1, bw - 1), bh);
        }
        g.globalAlpha = 1; g.fillStyle = grp.color;
        g.font = '700 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Barlow", sans-serif'; g.textAlign = "center";
        g.fillText(grp.label, grp.x, top - 7);
      });
      g.strokeStyle = C.petrol; g.lineWidth = 1.2; g.fillStyle = C.petrol;
      [[0.28, 0.42, "W₁ · Aktivierung"], [0.62, 0.76, "W₂"]].forEach(function (a) {
        V.arrow(g, w * a[0], h * 0.50, w * a[1], h * 0.50, C.petrol, 1.5, 6);
        g.font = '600 ' + Math.max(7, api.font("canvas-sm") - 2) + 'px "Open Sans", sans-serif'; g.textAlign = "center";
        g.fillText(a[2], w * ((a[0] + a[1]) / 2), h * 0.50 - 6);
      });
      dimsCanvas.setAttribute("aria-label", DE ? "Input d_model, verborgenes d_ff und Output d_model als Balken." : "Input d_model, hidden d_ff and output d_model as bars.");
    }
    function resize() {
      size = api.fit(bendCanvas, bendStage);
      drawBend();
      drawDims();
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(bendStage); }
    function onTheme() { drawBend(); drawDims(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", onTheme);
    updateBendReadout();
    resize();
    setContext(activeMode);
    return {
      update: function (s) {
        if (s && s.mode) setContext(s.mode);
      },
      next: function () {
        if (bend < 0.94) { animateBend(1); return true; }
        return stepContext(1);
      },
      prev: function () { return stepContext(-1); },
      onKey: function (e) {
        if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return false;
        if (e.key === "ArrowLeft") return stepContext(-1);
        if (e.key === "ArrowRight") { if (bend < 0.94) { animateBend(1); return true; } return stepContext(1); }
        return false;
      },
      resize: resize,
      destroy: function () {
        if (bendRaf) cancelAnimationFrame(bendRaf);
        if (ro) ro.disconnect();
        window.removeEventListener("resize", resize);
        window.removeEventListener("tm:theme", onTheme);
        el.remove();
      }
    };
  }

  core.register("ffn", ffnScene);
})();
