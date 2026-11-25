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
      core: "Burg · Turm · König · Mauer · Thron · Krone",
      ring: "Mechanik · Tür · öffnen · Schloss · Schlüssel · Hebel",
      bend: "Biegung",
      bendButton: "Raum biegen",
      separated: "getrennt",
      notSeparated: "noch nicht getrennt",
      plane: "Trennebene",
      hint: "Das ist ein MLP: Bereich anheben, bis eine Ebene trennt.",
      prev: "Voriger Kontext",
      next: "Nächster Kontext",
      step: "Kontext",
      coreState: "wird angehoben",
      ringState: "bleibt unten",
      demoBadge: "Schematische Demo · keine Messung"
    } : {
      fruitTitle: "I ate the apple",
      techTitle: "I bought an Apple laptop",
      stream: "“apple” + context",
      output: "richer vector",
      core: "castle · tower · king · wall · throne · crown",
      ring: "mechanism · door · open · lock · key · lever",
      bend: "Bend",
      bendButton: "Bend space",
      separated: "separated",
      notSeparated: "not separated",
      plane: "separating plane",
      hint: "This is an MLP: lift the region until a plane separates it.",
      prev: "Previous context",
      next: "Next context",
      step: "Context",
      coreState: "is lifted",
      ringState: "stays below",
      demoBadge: "Schematic demo · not a measurement"
    };
    var el = document.createElement("div");
    el.className = "ls-ffn-scene";
    el.innerHTML =
      '<div class="ls-ffn-stepper">' +
        '<button type="button" class="ls-btn ls-btn--tiny ls-ffn-prev" aria-label="' + api.esc(labels.prev) + '" data-tip-de="Zeigt den vorigen Beispielkontext." data-tip-en="Shows the previous example context.">←</button>' +
        '<span class="ls-ffn-step-label" aria-live="polite"></span>' +
        '<button type="button" class="ls-btn ls-btn--tiny ls-ffn-next" aria-label="' + api.esc(labels.next) + '" data-tip-de="Zeigt den nächsten Beispielkontext." data-tip-en="Shows the next example context.">→</button>' +
      '</div>' +
      '<div class="ls-ffn-contexts"></div>' +
      '<div class="ls-ffn-bend">' +
        '<div class="ls-ffn-bend-legend" data-tip-de="Legende: Kernmuster gegen Ringmuster." data-tip-en="Legend: core pattern versus ring pattern."><span><i class="is-core"></i>' + labels.core + ' <small>' + labels.coreState + '</small></span><span><i class="is-ring"></i>' + labels.ring + ' <small>' + labels.ringState + '</small></span></div>' +
        '<div class="ls-ffn-bend-stage"><canvas class="ls-ffn-bend-canvas" role="img" data-tip-de="Punktwolke im FFN-Raum; beobachte, wie die Biegung Kern und Ring trennt." data-tip-en="Point cloud in FFN space; watch how the bend separates core and ring."></canvas><span class="ls-ffn-demo-badge">' + labels.demoBadge + '</span></div>' +
        '<div class="ls-ffn-bend-bar">' +
          '<label class="ls-range">' + labels.bend + ' <input type="range" class="ls-ffn-bend-range" min="0" max="1" step="0.01" value="0" data-tip-de="Hebt den Kernbereich an; höhere Werte machen die Trennebene sichtbar." data-tip-en="Lifts the core region; higher values reveal the separating plane."><output>0.00</output></label>' +
          '<button type="button" class="ls-btn ls-btn--tiny ls-ffn-bend-toggle" data-tip-de="Animiert die Biegung bis zur Trennebene oder zurück." data-tip-en="Animates the bend to the separating plane or back.">' + labels.bendButton + '</button>' +
          '<span class="ls-ffn-bend-readout" aria-live="polite"></span>' +
        '</div>' +
      '</div>' +
      '<div class="ls-ffn-dims"><canvas class="ls-ffn-dims-canvas" role="img" data-tip-de="Zeigt d_model, d_ff und zurück zu d_model; das FFN arbeitet pro Token." data-tip-en="Shows d_model, d_ff and back to d_model; the FFN works per token."></canvas><p class="ls-ffn-dims-caption">' + (DE ? "Input und Output bleiben d_model; das FFN dehnt den Vektor auf d_ff und projiziert ihn zurück. Es arbeitet pro Token." : "Input and output stay at d_model; the FFN expands the vector to d_ff and projects it back. It works per token.") + '</p></div>' +
      '<details class="ls-ffn-more"><summary>' + (DE ? "Mehr zur Geometrie" : "More on the geometry") + '</summary><p class="ls-ffn-caveat">' + (DE ? "Die Punkte sind symbolisch: Im echten Modell liegen die Muster nichtlinear in einem hochdimensionalen Raum. Das MLP hebt sie in einen noch höheren Raum, macht die Cluster trennbarer und projiziert zurück. So isoliert es Bedeutungen und reicht eine abstraktere Repräsentation weiter. Die Beschriftungen sind eine didaktische Hilfe; die Muster sind gelernte Richtungen in W₁." : "The points are symbolic: in a real model the patterns lie nonlinearly in a high-dimensional space. The MLP lifts them into a higher space, makes the clusters more separable, and projects back. That is how it isolates meanings and passes on a more abstract representation. The labels are a teaching aid; the patterns are learned directions in W₁.") + '</p></details>';
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
      card.setAttribute("data-tip", DE ? "Kontextkarte: zeigt, welche Muster in W₁ und W₂ reagieren." : "Context card: shows which patterns react in W₁ and W₂.");
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
    var ffnPoints = null, ffnEdges = null, bendProjected = [], ffnHover = -1;
    function buildFfnGraph() {
      if (ffnPoints) return;
      var seed = 17;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      var pointLabels = [
        labels.core.split(" · "),
        labels.ring.split(" · ")
      ];
      ffnPoints = [];
      for (var c = 0; c < 2; c++) {
        var n = c === 0 ? 90 : 150;
        for (var k = 0; k < n; k++) {
          var a = k * 2.399963229728653 + rnd() * 0.25;
          var r = c === 0 ? 0.32 * Math.sqrt((k + 0.5) / n) : 0.55 + 0.34 * Math.sqrt((k + 0.5) / n);
          ffnPoints.push({ x: Math.cos(a) * r + (rnd() - 0.5) * 0.025, y: Math.sin(a) * r + (rnd() - 0.5) * 0.025, c: c, label: pointLabels[c][k % pointLabels[c].length] });
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
      var cx = w * 0.5, cy = h * 0.63;
      var scale = Math.min(w * 0.38, h * 0.34);
      var bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, C.paper || "#fff");
      bg.addColorStop(1, C.paper2 || C.paper || "#fff");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      var halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.64);
      halo.addColorStop(0, V.alpha(C.green, 0.10));
      halo.addColorStop(0.55, V.alpha(C.blue, 0.045));
      halo.addColorStop(1, V.alpha(C.paper || "#fff", 0));
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
      function warp(x, y) {
        var r = Math.hypot(x, y);
        var t = Math.max(0, Math.min(1, (r - 0.30) / 0.24));
        var ringDamp = 1 - 0.80 * (t * t * (3 - 2 * t));
        return { x: x, y: y, z: bend * 1.45 * Math.exp(-(r * r) / 0.20) * ringDamp };
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
        return { x: p.x, y: p.y, z: p.z, c: pt.c, label: pt.label };
      });
      bendProjected = projected;
      var center = project(0, 0, bend * 1.45);
      var baseCenter = project(0, 0, 0);
      var coreR = 0.42 * scale, ringR = 0.95 * scale;
      var activeColor = activeMode === "fruit" ? C.green : C.gold;
      ctx.save();
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.12 + 0.08 * bend;
      ctx.beginPath(); ctx.ellipse(baseCenter.x, baseCenter.y, ringR, ringR * 0.34, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.18 + 0.08 * bend;
      ctx.beginPath(); ctx.ellipse(center.x, center.y, coreR, coreR * 0.34, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      var haloTag = activeMode === "fruit" ? labels.core.split(" · ")[0] : labels.ring.split(" · ")[0];
      var haloR = activeMode === "fruit" ? coreR : ringR;
      var haloCenter = activeMode === "fruit" ? center : baseCenter;
      ctx.fillStyle = activeColor;
      ctx.font = '700 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Barlow", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(haloTag, haloCenter.x, Math.max(14, haloCenter.y - haloR * 0.34 - 7));
      ctx.restore();
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
        var col = p.c === 0 ? C.green : C.gold;
        if (active) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.c === 0 ? 7 : 6, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.globalAlpha = 0.10;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, (p.c === 0 ? 2.6 : 2.3) * (active ? 1.12 : 1), 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.globalAlpha = active ? 0.92 : 0.22;
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
        var band = 12 + 10 * lineAlpha;
        var planeGrad = ctx.createLinearGradient(0, ly - band, 0, ly + band);
        planeGrad.addColorStop(0, V.alpha(C.petrol, 0));
        planeGrad.addColorStop(0.5, V.alpha(C.petrol, 0.10 * lineAlpha));
        planeGrad.addColorStop(1, V.alpha(C.petrol, 0));
        ctx.fillStyle = planeGrad;
        ctx.fillRect(8, ly - band, w - 16, band * 2);
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = C.petrol;
        ctx.globalAlpha = 0.75 * lineAlpha;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(16, ly); ctx.lineTo(w - 16, ly); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = C.petrol;
        ctx.globalAlpha = lineAlpha;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "right";
        ctx.fillText(labels.plane, w - 18, ly - 7);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(labels.bend + " " + bend.toFixed(2), 14, 18);
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
      var from = bend, t0 = performance.now(), dur = (api.motion && api.motion.scale) ? api.motion.scale(620) : 620;
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
    bendCanvas.addEventListener("pointermove", function (e) {
      if (!size) return;
      var r = bendCanvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var best = -1, bestD = 14 * 14;
      bendProjected.forEach(function (p, i) {
        var d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best !== ffnHover) { ffnHover = best; drawBend(); }
      bendCanvas.style.cursor = best >= 0 ? "help" : "default";
    });
    bendCanvas.addEventListener("pointerleave", function () {
      if (ffnHover !== -1) { ffnHover = -1; drawBend(); }
    });
    core.canvasTip(bendCanvas, function (x, y) {
      var best = -1, bestD = 14 * 14;
      bendProjected.forEach(function (p, i) {
        var d = Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best < 0) return DE ? "Punktwolke: Kern und Ring liegen übereinander; die Biegung hebt den Kern an, bis eine Ebene trennt. Fahre über einen Punkt." : "Point cloud: core and ring overlap; the bend lifts the core until a plane separates them. Hover a point.";
      var p = bendProjected[best];
      var isCore = p.c === 0;
      return p.label + (DE ? " · " : " · ") + (isCore ? labels.core.split(" · ")[0] : labels.ring.split(" · ")[0]) +
        ". " + (DE ? "Biegung " : "Bend ") + bend.toFixed(2) + ". " +
        (DE ? (isCore ? "Kernmuster: wird angehoben und lässt sich von den Mechanik-Punkten trennen." : "Ringmuster: bleibt unten; die Biegung trennt es vom Kern.") : (isCore ? "Core pattern: lifted so the separating plane can cut it from the mechanism points." : "Ring pattern: stays low; the bend separates it from the core."));
    });
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
      hasNext: function () { return bend < 0.94 || modeOrder.indexOf(activeMode) < modeOrder.length - 1; },
      hasPrev: function () { return modeOrder.indexOf(activeMode) > 0; },
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
