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
        keys: [{ label: "Gebäude · Turm · Graben", on: true }, { label: "Stein · Hügel · alt", on: true }, { label: "Tür · Schlüssel · Metall", on: false }],
        values: [{ label: "Hinweis: Gebäude, Turm, Graben", on: true }, { label: "Hinweis: Stein, Hügel, alt", on: true }, { label: "Hinweis: Tür, Schlüssel, Metall", on: false }],
        desc: "Die Gebäude-, Turm- und Graben-Muster passen; das Tür-/Schlüssel-Muster bleibt still."
      },
      tech: {
        keys: [{ label: "Tür · Schlüssel · Metall", on: true }, { label: "Gebäude · Turm · Graben", on: false }, { label: "Stein · Hügel · alt", on: false }],
        values: [{ label: "Hinweis: Tür, Schlüssel, Metall", on: true }, { label: "Hinweis: Gebäude, Turm, Graben", on: false }, { label: "Hinweis: Stein, Hügel, alt", on: false }],
        desc: "Jetzt passt das Tür-/Schlüssel-Muster; die Gebäude-Muster bleiben still."
      }
    } : {
      fruit: {
        keys: [{ label: "fruit · red · sweet", on: true }, { label: "tree · orchard · pie", on: true }, { label: "company · laptop · iPhone", on: false }],
        values: [{ label: "Pull: fruit, red, sweet", on: true }, { label: "Pull: tree, orchard, pie", on: true }, { label: "Pull: company, laptop, iPhone", on: false }],
        desc: "The fruit, red, and sweet patterns match; the company pattern stays silent."
      },
      tech: {
        keys: [{ label: "company · laptop · iPhone", on: true }, { label: "fruit · red · sweet", on: false }, { label: "tree · orchard · pie", on: false }],
        values: [{ label: "Pull: company, laptop, iPhone", on: true }, { label: "Pull: fruit, red, sweet", on: false }, { label: "Pull: tree, orchard, pie", on: false }],
        desc: "Now the company pattern matches; the fruit patterns stay silent."
      }
    };
    var labels = DE ? {
      fruitTitle: "Das Schloss war alt",
      techTitle: "Das Schloss war kaputt",
      stream: "„Schloss“ + Kontext",
      output: "reicherer Vektor",
      core: "Schloss (Gebäude) · Turm · Graben",
      ring: "Schloss (Tür) · Schlüssel · Metall",
      bend: "Biegung",
      bendButton: "Raum biegen",
      returnButton: "W₂ zurück",
      liftTag: "W₁ hebt an",
      returnTag: "W₂ projiziert zurück",
      separated: "getrennt",
      notSeparated: "noch nicht getrennt",
      plane: "Trennebene",
      hint: "Das ist ein MLP: Bereich anheben, bis eine Ebene trennt.",
      prev: "Voriger Kontext",
      next: "Nächster Kontext",
      step: "Kontext",
      coreState: "wird angehoben",
      ringState: "bleibt unten",
      demoBadge: "Schematische Demo · keine Messung",
      backTitle: "Rückprojektion nach 2D",
      backCard: "Oben sind die Bedeutungen noch gemischt. Im höherdimensionalen Raum werden sie getrennt und gedreht; W₂ projiziert sie danach unterschiedlich in den ursprünglichen 2D-Raum.",
      backTag: "W₂ · zurück nach 2D",
      backReplay: "Nochmal",
      backLeft: "Gebäude · Turm · Graben",
      backRight: "Tür · Schlüssel · Metall",
      backMixed: "2D · gemischt",
      backHighDim: "höherdimensional getrennt + gedreht",
      backSide: "3D · von der Seite",
      back2d: "ursprünglicher 2D-Raum",
      back2dSeparated: "2D · getrennt",
      backW2: "W₂ projiziert zurück"
    } : {
      fruitTitle: "I ate the apple",
      techTitle: "I bought an Apple laptop",
      stream: "“apple” + context",
      output: "richer vector",
      core: "fruit · red · sweet · tree · orchard · pie",
      ring: "company · laptop · iPhone · Cupertino · logo · stock",
      bend: "Bend",
      bendButton: "Bend space",
      returnButton: "W₂ back",
      liftTag: "W₁ lifts",
      returnTag: "W₂ projects back",
      separated: "separated",
      notSeparated: "not separated",
      plane: "separating plane",
      hint: "This is an MLP: lift the region until a plane separates it.",
      prev: "Previous context",
      next: "Next context",
      step: "Context",
      coreState: "is lifted",
      ringState: "stays below",
      demoBadge: "Schematic demo · not a measurement",
      backTitle: "Back-projection to 2D",
      backCard: "At the top the meanings are still mixed. In the higher-dimensional space they are separated and rotated; W₂ then projects them back differently into the original 2D space.",
      backTag: "W₂ · back to 2D",
      backReplay: "Replay",
      backLeft: "fruit · red · sweet",
      backRight: "company · laptop · iPhone",
      backMixed: "2D · mixed",
      backHighDim: "separated + rotated in higher dimensions",
      backSide: "3D · side view",
      back2d: "original 2D space",
      back2dSeparated: "2D · separated",
      backW2: "W₂ projects back"
    };
    function mathInline(tex) {
      var safe = api.esc(tex);
      return '<span class="ls-math ls-math--inline" data-tex="' + safe + '" data-tex-display="false"><code class="ls-tex-source">' + safe + '</code></span>';
    }
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
      '<div class="ls-ffn-dims"><canvas class="ls-ffn-dims-canvas" role="img" data-tip-de="Zeigt d_model, d_ff und zurück zu d_model; das FFN arbeitet pro Token." data-tip-en="Shows d_model, d_ff and back to d_model; the FFN works per token."></canvas><p class="ls-ffn-dims-caption">' + (DE ? "Beides sind vollverbundene Schichten: " + mathInline("W_1") + " hebt den Vektor auf " + mathInline("d_{\\text{ff}}") + ", " + mathInline("W_2") + " projiziert ihn zurück auf " + mathInline("d_{\\text{model}}") + ". Das FFN arbeitet pro Token." : "Both are dense layers: " + mathInline("W_1") + " lifts the vector to " + mathInline("d_{\\text{ff}}") + ", " + mathInline("W_2") + " projects it back to " + mathInline("d_{\\text{model}}") + ". The FFN works per token.") + '</p></div>';
    root.appendChild(el);
    var dimsCaption = el.querySelector(".ls-ffn-dims-caption");
    if (dimsCaption && api.typeset) { try { api.typeset(dimsCaption); } catch (e) {} }
    var contextsEl = el.querySelector(".ls-ffn-contexts");
    var coreStateEl = el.querySelector(".ls-ffn-bend-legend span:nth-child(1) small");
    var ringStateEl = el.querySelector(".ls-ffn-bend-legend span:nth-child(2) small");
    var stepperEl = el.querySelector(".ls-ffn-stepper");
    var prevBtn = el.querySelector(".ls-ffn-prev");
    var nextBtn = el.querySelector(".ls-ffn-next");
    var stepLabel = el.querySelector(".ls-ffn-step-label");
    var bendStage = el.querySelector(".ls-ffn-bend-stage");
    var bendCanvas = el.querySelector(".ls-ffn-bend-canvas");
    var bendRange = el.querySelector(".ls-ffn-bend-range");
    var bendRangeLabel = bendRange.closest("label");
    var bendOut = el.querySelector(".ls-ffn-bend-bar output");
    var bendReadout = el.querySelector(".ls-ffn-bend-readout");
    var bendToggle = el.querySelector(".ls-ffn-bend-toggle");
    var dimsCanvas = el.querySelector(".ls-ffn-dims-canvas");
    var dimsSize = null;
    var bend = 0, bendRaf = 0, bendDir = 1, dimsPhase = 0, dimsRaf = 0, backT = 0, backRaf = 0, size = null, ctx = null;
    var modeOrder = ["fruit", "tech", "back"];
    var activeMode = "fruit";
    function pill(item, withState) {
      return '<span class="ls-ffn-pill ' + (item.on ? "is-fire" : "is-idle") + '">' + api.esc(item.label) +
        (withState ? '<small>' + (item.on ? (DE ? "passt" : "matches") : (DE ? "still" : "silent")) + '</small>' : '') + '</span>';
    }
    function contextCard(mode, title) {
      if (mode === "back") {
        var backCard = document.createElement("article");
        backCard.className = "ls-ffn-context" + (mode === activeMode ? " is-active" : "");
        backCard.setAttribute("data-mode", mode);
        backCard.setAttribute("data-tip", DE ? "Rückprojektion: beide Bedeutungen landen unterschiedlich im ursprünglichen 2D-Raum." : "Back-projection: both meanings land differently in the original 2D space.");
        backCard.innerHTML = '<div class="ls-ffn-context-head"><span class="ls-ffn-stream-pill">' + labels.backTag + '</span><span class="ls-ffn-context-title">' + api.esc(title) + '</span></div>' +
          '<div class="ls-ffn-flow"><span class="ls-ffn-out-pill">' + labels.backLeft + '</span><span class="ls-ffn-arrow" aria-hidden="true">→</span><span class="ls-ffn-out-pill">' + labels.backRight + '</span></div>' +
          '<p class="ls-ffn-desc">' + labels.backCard + '</p>';
        contextsEl.appendChild(backCard);
        return;
      }
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
          '<div class="ls-ffn-group"><div class="ls-ffn-head">' + (DE ? "Richtung in W₂" : "Pull in W₂") + '</div><div class="ls-ffn-chips">' + d.values.map(function (v) { return pill(v, false); }).join("") + '</div></div>' +
          '<span class="ls-ffn-out-pill">' + labels.output + '</span>' +
        '</div>' +
        '<p class="ls-ffn-desc">' + d.desc + '</p>';
      contextsEl.appendChild(card);
    }
    contextCard("fruit", labels.fruitTitle);
    contextCard("tech", labels.techTitle);
    contextCard("back", labels.backTitle);
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
      stepLabel.textContent = mode === "back" ? labels.backTitle + " · " + (idx + 1) + " / " + modeOrder.length : labels.step + " " + (idx + 1) + " / " + modeOrder.length;
      prevBtn.disabled = idx <= 0;
      nextBtn.disabled = idx >= modeOrder.length - 1;
      var isBack = mode === "back";
      el.classList.toggle("is-back", isBack);
      if (bendRangeLabel) bendRangeLabel.style.display = isBack ? "none" : "";
      if (bendToggle) {
        bendToggle.setAttribute("data-tip-de", isBack ? "Spielt die Rückprojektion erneut ab." : "Animiert die Biegung bis zur Trennebene oder zurück.");
        bendToggle.setAttribute("data-tip-en", isBack ? "Replays the back-projection." : "Animates the bend to the separating plane or back.");
      }
      if (isBack) {
        backT = 0;
        updateBendReadout();
        runBack();
      } else {
        if (backRaf) cancelAnimationFrame(backRaf);
        backRaf = 0;
        backT = 0;
        updateBendReadout();
      }
      drawBend();
      if (coreStateEl) coreStateEl.textContent = activeMode === "back" ? labels.back2d : activeMode === "fruit" ? labels.coreState : labels.ringState;
      if (ringStateEl) ringStateEl.textContent = activeMode === "back" ? labels.back2d : activeMode === "tech" ? labels.coreState : labels.ringState;
      pulseDims();
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
      if (activeMode === "back") {
        drawBackProjection(cx, cy, scale);
        return;
      }
      function warp(x, y, c, liftVal) {
        var b = (liftVal == null) ? bend : liftVal;
        var r = Math.hypot(x, y);
        if (activeMode === "fruit") {
          var t = Math.max(0, Math.min(1, (r - 0.30) / 0.24));
          var ringDamp = 1 - 0.45 * (t * t * (3 - 2 * t));
          var coreZ = b * (0.10 + 1.35 * Math.exp(-(r * r) / 0.20) * ringDamp);
          return { x: x, y: y, z: c === 1 ? coreZ * 0.12 : coreZ };
        }
        var ringZ = b * (0.10 + 1.35 * Math.exp(-Math.pow((r - 0.72) / 0.22, 2)));
        return { x: x, y: y, z: c === 0 ? ringZ * 0.12 : ringZ };
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
          var wp = warp(-1 + 2 * i / N, -1 + 2 * j / N, activeMode === "fruit" ? 0 : 1);
          var p = project(wp.x, wp.y, wp.z);
          if (j === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.beginPath();
        for (var j2 = 0; j2 <= N; j2++) {
          var wp2 = warp(-1 + 2 * j2 / N, -1 + 2 * i / N, activeMode === "fruit" ? 0 : 1);
          var p2 = project(wp2.x, wp2.y, wp2.z);
          if (j2 === 0) ctx.moveTo(p2.x, p2.y); else ctx.lineTo(p2.x, p2.y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      var projected = ffnPoints.map(function (pt) {
        var wp = warp(pt.x, pt.y, pt.c);
        var p = project(wp.x, wp.y, wp.z);
        return { x: p.x, y: p.y, z: p.z, c: pt.c, label: pt.label };
      });
      bendProjected = projected;
      var activeC = activeMode === "fruit" ? 0 : 1;
      var activeColor = activeMode === "back" ? C.petrol : activeMode === "fruit" ? C.green : C.gold;
      if (bend > 0.02 && bendDir < 0) {
        ctx.save();
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = activeColor;
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = 0.8;
        for (var gi = 0; gi < ffnPoints.length; gi += 4) {
          var gp = ffnPoints[gi];
          if (gp.c !== activeC) continue;
          var gwp = warp(gp.x, gp.y, gp.c, 1);
          var gpr = project(gwp.x, gwp.y, gwp.z);
          var cwp = warp(gp.x, gp.y, gp.c);
          var cpr = project(cwp.x, cwp.y, cwp.z);
          ctx.beginPath(); ctx.arc(gpr.x, gpr.y, 1.4, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(gpr.x, gpr.y); ctx.lineTo(cpr.x, cpr.y); ctx.stroke();
        }
        ctx.restore();
        ctx.save();
        ctx.fillStyle = activeColor;
        ctx.globalAlpha = 0.85;
        ctx.font = '700 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Barlow", sans-serif';
        ctx.textAlign = "right";
        ctx.fillText(labels.returnTag, w - 14, 18);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      var liftCenter = activeMode === "fruit" ? project(0, 0, bend * 1.45) : project(0.72, 0, bend * 1.45);
      var center = liftCenter;
      var baseCenter = project(0, 0, 0);
      var coreR = 0.42 * scale, ringR = 0.95 * scale;
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
      var haloCenter = activeMode === "fruit" ? liftCenter : project(0.72, 0, bend * 1.45);
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
      if (bend > 0.02 && bendDir >= 0) {
        ctx.textAlign = "right";
        ctx.fillStyle = activeColor;
        ctx.globalAlpha = 0.85;
        ctx.fillText(labels.liftTag, w - 14, 18);
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
      }
      bendCanvas.setAttribute("aria-label", (DE ? "Feine Punktwolke des FFN-Raums. " : "Fine point cloud of the FFN space. ") + labels.hint + " " + (bend > 0.6 ? labels.separated : labels.notSeparated) + ".");
    }
    function drawBackProjection(cx, cy, scale) {
      var w = size.w, h = size.h;
      var t = ease(clamp(backT, 0, 1));
      var rise = ease(clamp((t - 0.10) / 0.50, 0, 1));
      var bot = ease(clamp((t - 0.55) / 0.45, 0, 1));
      var font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      var fontBold = '700 ' + Math.max(8, api.font("canvas-sm") - 1) + 'px "Barlow", sans-serif';
      var top = { x: cx, y: h * 0.16 };
      var mid = { x: cx, y: h * 0.46 };
      var groundY = h * 0.54;
      var liftedY = lerp(groundY, h * 0.37, rise);
      var gx0 = w * 0.12, gx1 = w * 0.88, gy0 = h * 0.66, gy1 = h * 0.94;
      var tgtA = { x: gx0 + (gx1 - gx0) * 0.28, y: gy0 + (gy1 - gy0) * 0.52 };
      var tgtB = { x: gx0 + (gx1 - gx0) * 0.72, y: gy0 + (gy1 - gy0) * 0.42 };
      function outline(x, y, rx, ry, angle, color, alpha) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle || 0);
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      function cluster(x, y, rx, ry, angle, color, alpha) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        for (var k = 0; k < 26; k++) {
          var a = k * 2.399963229728653;
          var rr = Math.sqrt((k + 0.5) / 26);
          ctx.beginPath();
          ctx.arc(Math.cos(a) * rr * rx, Math.sin(a) * rr * ry, 1.7, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha * (0.45 + 0.5 * (1 - rr));
          ctx.fill();
        }
        ctx.restore();
      }
      function mixedEgg(x, y, rx, ry, alpha) {
        outline(x, y, rx, ry, 0, C.line, 0.6 * alpha);
        outline(x, y, rx * 0.36, ry * 0.36, 0, C.line, 0.4 * alpha);
        for (var k = 0; k < 84; k++) {
          var a = k * 2.399963229728653;
          var inner = k < 34;
          var rr = inner ? 0.32 * Math.sqrt((k + 0.5) / 34) : 0.55 + 0.40 * Math.sqrt((k - 34 + 0.5) / 50);
          ctx.beginPath();
          ctx.arc(x + Math.cos(a) * rr * rx, y + Math.sin(a) * rr * ry, 1.7, 0, Math.PI * 2);
          ctx.fillStyle = k % 2 ? C.gold : C.green;
          ctx.globalAlpha = alpha * (0.45 + 0.5 * (1 - rr));
          ctx.fill();
        }
      }
      function arrow(x0, y0, x1, y1, color, prog) {
        var x = lerp(x0, x1, prog), y = lerp(y0, y1, prog);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
        if (prog > 0.04) {
          var ang = Math.atan2(y1 - y0, x1 - x0);
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - Math.cos(ang - 0.45) * 8, y - Math.sin(ang - 0.45) * 8);
          ctx.lineTo(x - Math.cos(ang + 0.45) * 8, y - Math.sin(ang + 0.45) * 8);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.save();
      ctx.fillStyle = C.soft;
      ctx.globalAlpha = 0.9;
      ctx.font = fontBold;
      ctx.textAlign = "center";
      ctx.fillText(labels.backMixed, cx, h * 0.05);
      ctx.restore();
      mixedEgg(top.x, top.y, w * 0.18, h * 0.055, 1);
      ctx.save();
      ctx.strokeStyle = C.line;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, groundY, w * 0.20, h * 0.045, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - w * 0.23, groundY); ctx.lineTo(cx + w * 0.23, groundY); ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = C.lineStrong;
      ctx.fillStyle = C.muted;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - w * 0.25, groundY); ctx.lineTo(cx - w * 0.25, h * 0.33); ctx.stroke();
      ctx.font = font;
      ctx.textAlign = "left";
      ctx.fillText("z", cx - w * 0.25 - 12, h * 0.34);
      ctx.fillText("x", cx + w * 0.23, groundY + 14);
      ctx.restore();
      var planeY = (groundY + liftedY) / 2;
      var planeAlpha = Math.max(0, Math.min(1, (rise - 0.35) / 0.65));
      if (planeAlpha > 0.01) {
        ctx.save();
        ctx.strokeStyle = C.petrol;
        ctx.globalAlpha = 0.55 * planeAlpha;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(cx - w * 0.22, planeY); ctx.lineTo(cx + w * 0.22, planeY); ctx.stroke();
        ctx.fillStyle = C.petrol;
        ctx.globalAlpha = planeAlpha;
        ctx.font = font;
        ctx.textAlign = "right";
        ctx.fillText(labels.plane, cx + w * 0.22, planeY - 7);
        ctx.restore();
      }
      ctx.save();
      ctx.fillStyle = C.petrol;
      ctx.globalAlpha = 0.85;
      ctx.font = fontBold;
      ctx.textAlign = "center";
      ctx.fillText(labels.backHighDim, cx, h * 0.30);
      ctx.font = font;
      ctx.globalAlpha = 0.65;
      ctx.fillText(labels.backSide, cx, h * 0.34);
      ctx.restore();
      var midAlpha = 0.25 + 0.75 * rise;
      outline(cx, groundY, w * 0.16, h * 0.040, 0, C.gold, 0.55 * midAlpha);
      cluster(cx, groundY, w * 0.15, h * 0.038, 0.15, C.gold, 0.55 + 0.35 * midAlpha);
      outline(cx, liftedY, w * 0.085, h * 0.026, 0, C.green, 0.65 * midAlpha);
      cluster(cx, liftedY, w * 0.075, h * 0.023, -0.25, C.green, 0.55 + 0.45 * midAlpha);
      arrow(top.x - 6, top.y, mid.x, groundY, C.gold, rise);
      arrow(top.x + 6, top.y, mid.x, liftedY, C.green, rise);
      ctx.save();
      ctx.strokeStyle = C.line;
      ctx.globalAlpha = 0.20;
      ctx.lineWidth = 1;
      for (var gx = 0; gx <= 6; gx++) {
        var xLine = gx0 + (gx1 - gx0) * gx / 6;
        ctx.beginPath(); ctx.moveTo(xLine, gy0); ctx.lineTo(xLine, gy1); ctx.stroke();
      }
      for (var gy = 0; gy <= 4; gy++) {
        var yLine = gy0 + (gy1 - gy0) * gy / 4;
        ctx.beginPath(); ctx.moveTo(gx0, yLine); ctx.lineTo(gx1, yLine); ctx.stroke();
      }
      ctx.strokeStyle = C.lineStrong;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(gx0, gy1); ctx.lineTo(gx1, gy1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx0, gy1); ctx.lineTo(gx0, gy0); ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = font;
      ctx.textAlign = "left";
      ctx.fillText("x", gx1 - 10, gy1 - 6);
      ctx.fillText("y", gx0 - 14, gy0 + 8);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = C.petrol;
      ctx.globalAlpha = 0.8 * bot;
      ctx.font = fontBold;
      ctx.textAlign = "center";
      ctx.fillText(labels.back2dSeparated, cx, gy0 - 10);
      ctx.restore();
      var gapX = (tgtA.x + tgtB.x) / 2;
      ctx.save();
      ctx.strokeStyle = C.petrol;
      ctx.globalAlpha = 0.35 * bot;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(gapX, gy0 + 6); ctx.lineTo(gapX, gy1 - 4); ctx.stroke();
      ctx.restore();
      var targetAlpha = 0.15 + 0.85 * bot;
      outline(tgtA.x, tgtA.y, w * 0.085, h * 0.030, -0.35, C.green, 0.6 * targetAlpha);
      cluster(tgtA.x, tgtA.y, w * 0.075, h * 0.028, -0.35, C.green, targetAlpha);
      outline(tgtB.x, tgtB.y, w * 0.085, h * 0.030, 0.45, C.gold, 0.6 * targetAlpha);
      cluster(tgtB.x, tgtB.y, w * 0.075, h * 0.028, 0.45, C.gold, targetAlpha);
      arrow(mid.x, liftedY, tgtA.x, tgtA.y, C.green, bot);
      arrow(mid.x, groundY, tgtB.x, tgtB.y, C.gold, bot);
      ctx.save();
      ctx.fillStyle = C.soft;
      ctx.globalAlpha = 0.8 * bot;
      ctx.font = fontBold;
      ctx.textAlign = "right";
      ctx.fillText(labels.backW2, w - 18, h * 0.585);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = bot;
      ctx.font = font;
      ctx.textAlign = "center";
      var labelOffset = Math.max(18, h * 0.055);
      ctx.fillStyle = C.green;
      ctx.fillText(labels.backLeft, tgtA.x, tgtA.y + labelOffset);
      ctx.fillStyle = C.gold;
      ctx.fillText(labels.backRight, tgtB.x, tgtB.y + labelOffset);
      ctx.restore();
      bendProjected = [];
      bendCanvas.setAttribute("aria-label", DE ? "Rückprojektion: oben gemischte Egg-Verteilung, in der Mitte als 3D-Seitenansicht getrennt und gedreht, unten zwei klar getrennte 2D-Ergebnisse." : "Back-projection: mixed egg-shaped distribution at the top, separated and rotated in a 3D side view in the middle, two clearly separated 2D results at the bottom.");
    }
    function updateBendReadout() {
      if (activeMode === "back") {
        bendOut.textContent = backT.toFixed(2);
        bendToggle.textContent = labels.backReplay;
        bendReadout.textContent = labels.backTag;
        return;
      }
      bendOut.textContent = bend.toFixed(2);
      bendToggle.textContent = bend > 0.5 ? labels.returnButton : labels.bendButton;
      var extra = bend > 0.02 ? " · " + (bendDir < 0 ? labels.returnTag : labels.liftTag) : "";
      bendReadout.textContent = labels.bend + " " + bend.toFixed(2) + " · " + (bend > 0.6 ? labels.separated : labels.notSeparated) + extra;
    }
    function setBend(v) {
      bendDir = v >= bend ? 1 : -1;
      bend = Math.max(0, Math.min(1, v));
      bendRange.value = String(bend);
      updateBendReadout();
      drawBend();
    }
    function animateBend(target) {
      if (bendRaf) cancelAnimationFrame(bendRaf);
      bendDir = target >= bend ? 1 : -1;
      var from = bend, t0 = performance.now(), dur = (api.motion && api.motion.scale) ? api.motion.scale(620) : 620;
      function frame(now) {
        var t = Math.max(0, Math.min(1, (now - t0) / dur));
        var e = 1 - Math.pow(1 - t, 3);
        bend = from + (target - from) * e;
        bendRange.value = String(bend);
        updateBendReadout();
        drawBend();
        dimsPhase = (dimsPhase + 0.05) % 1;
        drawDims();
        if (t < 1) bendRaf = requestAnimationFrame(frame);
        else bendRaf = 0;
      }
      bendRaf = requestAnimationFrame(frame);
    }
    function runBack() {
      if (backRaf) cancelAnimationFrame(backRaf);
      var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) { backT = 1; updateBendReadout(); drawBend(); return; }
      var t0 = performance.now(), dur = (api.motion && api.motion.scale) ? api.motion.scale(950) : 950;
      function frame(now) {
        var t = Math.max(0, Math.min(1, (now - t0) / dur));
        backT = ease(t);
        updateBendReadout();
        drawBend();
        if (t < 1) backRaf = requestAnimationFrame(frame);
        else backRaf = 0;
      }
      backRaf = requestAnimationFrame(frame);
    }
    bendRange.addEventListener("input", function () { if (activeMode !== "back") setBend(parseFloat(bendRange.value) || 0); });
    bendToggle.addEventListener("click", function () {
      if (activeMode === "back") runBack();
      else animateBend(bend > 0.5 ? 0 : 1);
    });
    function drawDims() {
      if (!dimsCanvas || !dimsCanvas.parentNode) return;
      dimsSize = api.fit(dimsCanvas, dimsCanvas);
      var g = dimsSize.ctx, w = dimsSize.w, h = dimsSize.h;
      g.clearRect(0, 0, w, h);
      g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
      var groups = [
        { x: w * 0.16, n: 8, color: C.blue, label: (DE ? "Eingabe" : "Input") + " · d_model" },
        { x: w * 0.50, n: 24, color: C.gold, label: (DE ? "Verborgen" : "Hidden") + " · d_ff" },
        { x: w * 0.84, n: 8, color: C.green, label: (DE ? "Ausgabe" : "Output") + " · d_model" }
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
      g.globalAlpha = 1;
      dimsCanvas.setAttribute("aria-label", DE ? "Eingabe d_model, verborgene d_ff und Ausgabe d_model als Balken." : "Input d_model, hidden d_ff and output d_model as bars.");
    }
    function pulseDims() {
      if (dimsRaf) cancelAnimationFrame(dimsRaf);
      dimsPhase = 0;
      drawDims();
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
      if (best < 0) return DE ? "Punktwolke: Die aktive Gruppe wird angehoben, bis eine Ebene trennt. Fahre über einen Punkt." : "Point cloud: the active group is lifted until a plane separates it. Hover a point.";
      var p = bendProjected[best];
      var isCore = p.c === 0;
      return p.label + (DE ? " · " : " · ") + (isCore ? labels.core.split(" · ")[0] : labels.ring.split(" · ")[0]) +
        ". " + (DE ? "Biegung " : "Bend ") + bend.toFixed(2) + ". " +
        (DE ? (isCore ? "Kernmuster: wird angehoben und lässt sich vom anderen Muster trennen." : "Ringmuster: bleibt unten; die Biegung trennt es vom Kern.") : (isCore ? "Core pattern: lifted so the separating plane can cut it from the other pattern." : "Ring pattern: stays low; the bend separates it from the core."));
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
        if (activeMode === "back") return false;
        if (bend < 0.94) { animateBend(1); return true; }
        return stepContext(1);
      },
      prev: function () { return stepContext(-1); },
      hasNext: function () {
        if (activeMode === "back") return false;
        return bend < 0.94 || modeOrder.indexOf(activeMode) < modeOrder.length - 1;
      },
      hasPrev: function () { return modeOrder.indexOf(activeMode) > 0; },
      onKey: function (e) {
        if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return false;
        if (e.key === "ArrowLeft") return stepContext(-1);
        if (e.key === "ArrowRight") {
          if (activeMode === "back") return false;
          if (bend < 0.94) { animateBend(1); return true; }
          return stepContext(1);
        }
        return false;
      },
      resize: resize,
      destroy: function () {
        if (bendRaf) cancelAnimationFrame(bendRaf);
        if (backRaf) cancelAnimationFrame(backRaf);
        if (dimsRaf) cancelAnimationFrame(dimsRaf);
        if (ro) ro.disconnect();
        window.removeEventListener("resize", resize);
        window.removeEventListener("tm:theme", onTheme);
        el.remove();
      }
    };
  }

  core.register("ffn", ffnScene);
})();
