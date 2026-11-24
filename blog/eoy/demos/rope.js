(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;

  function ropeScene(root, api) {
    var DE = api.lang === "de";
    function L(de, en) { return DE ? de : en; }
    var clamp = api.util && api.util.clamp ? api.util.clamp : core.clamp;
    var reduced = !!api.reducedMotion;
    var D_MODEL = 64;
    function esc(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    var TIPS = {
      guide: ["Führe die Demo Schritt für Schritt. ← / → wechselt den Schritt; die Punkte springen direkt.", "Walk the demo step by step. ← / → changes the step; the dots jump directly."],
      step: ["Aktueller Schritt der geführten Demo.", "Current step of the guided demo."],
      title: ["Was dieser Schritt zeigt.", "What this step shows."],
      body: ["Erklärung zum aktuellen Schritt.", "Explanation of the current step."],
      nav: ["Vorheriger / nächster Schritt. Pfeiltasten ← → funktionieren ebenfalls.", "Previous / next step. Arrow keys ← → work too."],
      dot: ["Springt direkt zu diesem Schritt.", "Jumps straight to this step."],
      m: ["Position m: Stelle des Query-Tokens. q wird um m·θ gedreht.", "Position m: place of the query token. q is rotated by m·θ."],
      n: ["Position n: Stelle des Key-Tokens. k wird um n·θ gedreht.", "Position n: place of the key token. k is rotated by n·θ."],
      pairs: ["Dimensionspaare: jedes Paar sind 2 Dimensionen (cos, sin). Bei P Paaren werden 2P Dimensionen gedreht; die übrigen bleiben unverändert.", "Dimension pairs: each pair is 2 dimensions (cos, sin). With P pairs, 2P dimensions rotate; the rest stay unchanged."],
      readout: ["q·k ist der Mittelwert der Cosinus-Scores aller P Paare. Nur der relative Abstand n−m zählt.", "q·k is the mean of the cosine scores over all P pairs. Only the relative distance n−m matters."],
      viewTitle: ["Was die Visualisierung gerade zeigt.", "What the visualisation currently shows."],
      viewFoot: ["Details zur aktuellen Ansicht. In 3D steht hier auch der Abstand zwischen q- und k-Richtung.", "Details of the current view. In 3D this also shows the distance between the q and k directions."],
      dial: ["2D: ein Frequenzpaar. q und k sind um mθ bzw. nθ gedreht; der Winkel zwischen ihnen ist (n−m)θ.", "2D: one frequency pair. q and k are rotated by mθ and nθ; the angle between them is (n−m)θ."],
      helix: ["3D: Position als dritte Achse. Jedes Paar beschreibt eine Helix; hell das gewählte Paar, blass die anderen. Ziehen dreht.", "3D: position as the third axis. Each pair traces a helix; the selected pair is bright, the others faint. Drag rotates."],
      curve: ["Score über den Abstand |m−n|. Dick: Mittelwert über alle P Paare; dünn: das gewählte Paar. Gleicher Abstand → gleicher Score.", "Score over the distance |m−n|. Thick: mean over all P pairs; thin: the selected pair. Same distance → same score."],
      matrix: ["Score-Matrix: Farbe = kombinierter Score für jedes (m,n). Gleiche Farbe entlang der Diagonalen, weil nur n−m zählt.", "Score matrix: colour = combined score for each (m,n). Equal colour along diagonals because only n−m matters."],
      metric: ["Abstand zwischen q- und k-Richtung: Euklid = gerade Sehne, Großkreis = Bogen auf dem Einheitskreis.", "Distance between the q and k directions: Euclidean = straight chord, great circle = arc on the unit circle."],
      chip: ["Paar i mit θ_i = 10000^(−2i/d). Klick zeigt dieses Paar im 2D-Rad, in der Kurve und in 3D.", "Pair i with θ_i = 10000^(−2i/d). Click to show this pair in the 2D dial, the curve and 3D."],
      rot: ["R(φ) dreht zwei Dimensionen um φ.\nφ = Position × θ_i.\ncos/sin bilden die Rotation; die Matrix ist orthogonal, also bleibt die Länge.", "R(φ) rotates two dimensions by φ.\nφ = position × θ_i.\ncos/sin form the rotation; the matrix is orthogonal, so lengths are preserved."],
      score: ["q_m und k_n sind dieselben Vektoren, nur gedreht.\nR((n−m)θ_i) ist die Relativdrehung: qᵀ R k.\nDeshalb zählt nur die Differenz n−m.", "q_m and k_n are the same vectors, only rotated.\nR((n−m)θ_i) is the relative rotation: qᵀ R k.\nThat is why only the difference n−m matters."],
      sum: ["Jedes Paar liefert cos((n−m)θ_i).\nScore = Mittelwert über P Paare.\nP = Anzahl der Dimensionspaare.", "Each pair contributes cos((n−m)θ_i).\nScore = mean over P pairs.\nP = number of dimension pairs."],
      freq: ["θ_i fällt geometrisch mit i.\nBasis 10000 und d/2 Paare sind die RoPE-Konstruktion.\nKleine i drehen schnell, große i langsam.", "θ_i falls geometrically with i.\nBase 10000 and d/2 pairs are the RoPE construction.\nSmall i rotate fast, large i slowly."],
      formulaHead: ["RoPE in vier Zeilen: Drehung, Score pro Paar, Summe über P Paare, Frequenz. Fahre über eine Zeile, um jeden Teil zu lesen.", "RoPE in four lines: rotation, score per pair, sum over P pairs, frequency. Hover a line to read every part."],
      meta: ["d = Modellbreite (hier 64). d/2 = 32 mögliche Paare. P = wie viele Paare die Demo nutzt.", "d = model width (here 64). d/2 = 32 possible pairs. P = how many pairs the demo uses."]
    };
    function tip(k) { var t = TIPS[k]; return t ? L(t[0], t[1]) : ""; }

    var el = document.createElement("div");
    el.className = "ls-rope-scene";
    el.innerHTML =
      '<div class="ls-rope-guide" data-tip="' + esc(tip("guide")) + '">' +
        '<div class="ls-rope-guide-top">' +
          '<span class="ls-rope-guide-step" data-rope-guide-step data-tip="' + esc(tip("step")) + '"></span>' +
          '<div class="ls-rope-guide-dots" data-rope-guide-dots></div>' +
          '<div class="ls-rope-guide-nav" data-tip="' + esc(tip("nav")) + '">' +
            '<button type="button" data-rope-guide-prev aria-label="' + L("Vorheriger Schritt", "Previous step") + '">←</button>' +
            '<button type="button" data-rope-guide-next aria-label="' + L("Nächster Schritt", "Next step") + '">→</button>' +
          '</div>' +
        '</div>' +
        '<h3 class="ls-rope-guide-title" data-rope-guide-title data-tip="' + esc(tip("title")) + '"></h3>' +
        '<p class="ls-rope-guide-body" data-rope-guide-body data-tip="' + esc(tip("body")) + '"></p>' +
        '<span class="ls-rope-guide-hint">← / →</span>' +
      '</div>' +
      '<div class="ls-rope-left">' +
        '<div class="ls-rope-formula" data-tip="' + esc(tip("formulaHead")) + '">' +
          '<div class="ls-rope-formula-head"><b>RoPE</b><span>' + L("Formel", "formula") + '</span></div>' +
          '<div class="ls-rope-eqrow" data-tip="' + esc(tip("rot")) + '">' +
            '<span class="ls-rope-eqlabel">' + L("Drehung", "rotation") + '</span>' +
            '<div class="ls-rope-tex" data-tex="R(\\varphi)=\\begin{pmatrix}\\cos\\varphi &amp; -\\sin\\varphi \\\\ \\sin\\varphi &amp; \\cos\\varphi\\end{pmatrix}"></div>' +
          '</div>' +
          '<div class="ls-rope-eqrow is-key" data-tip="' + esc(tip("score")) + '">' +
            '<span class="ls-rope-eqlabel">' + L("Paar i", "pair i") + '</span>' +
            '<div class="ls-rope-tex" data-tex="q_m\\cdot k_n=q^{\\top}R((n-m)\\theta_i)\\,k"></div>' +
          '</div>' +
          '<div class="ls-rope-eqrow" data-tip="' + esc(tip("sum")) + '">' +
            '<span class="ls-rope-eqlabel">' + L("Summe", "sum") + '</span>' +
            '<div class="ls-rope-tex" data-tex="\\mathrm{Score}=\\frac{1}{P}\\sum_{i=1}^{P}\\cos((n-m)\\theta_i)"></div>' +
          '</div>' +
          '<div class="ls-rope-eqrow" data-tip="' + esc(tip("freq")) + '">' +
            '<span class="ls-rope-eqlabel">' + L("Frequenz", "frequency") + '</span>' +
            '<div class="ls-rope-tex" data-tex="\\theta_i=10000^{-2i/d}"></div>' +
          '</div>' +
          '<div class="ls-rope-eqmeta" data-tip="' + esc(tip("meta")) + '">d = 64 ' + L("Dimensionen", "dimensions") + ' → 32 ' + L("Paare", "pairs") + ' · P = <b data-rope-pmeta>4</b> ' + L("im Demo", "in the demo") + '</div>' +
        '</div>' +
        '<div class="ls-rope-controls">' +
          '<label class="ls-rope-range" data-tip="' + esc(tip("m")) + '"><span>' + L("Position m", "Position m") + '</span><input type="range" data-rope="m" min="0" max="31" value="3"><output>3</output></label>' +
          '<label class="ls-rope-range" data-tip="' + esc(tip("n")) + '"><span>' + L("Position n", "Position n") + '</span><input type="range" data-rope="n" min="0" max="31" value="10"><output>10</output></label>' +
          '<label class="ls-rope-range ls-rope-range--pairs" data-tip="' + esc(tip("pairs")) + '"><span>' + L("Dimensionspaare", "Dimension pairs") + ' <em>' + L("(2 Dim. pro Paar)", "(2 dims per pair)") + '</em></span><input type="range" data-rope="pairs" min="1" max="8" step="1" value="4"><output>4</output></label>' +
          '<div class="ls-rope-freqs" data-rope-freqs role="group" aria-label="' + L("Frequenzpaare", "Frequency pairs") + '"></div>' +
        '</div>' +
        '<p class="ls-rope-readout" aria-live="polite" data-tip="' + esc(tip("readout")) + '"></p>' +
      '</div>' +
      '<div class="ls-rope-view">' +
        '<div class="ls-rope-view-head">' +
          '<div class="ls-rope-view-head-text" data-tip="' + esc(tip("viewTitle")) + '"><b data-rope-view-title>' + L("2 Dimensionen", "2 dimensions") + '</b><span data-rope-view-sub>' + L("q dreht mθ · k dreht nθ", "q rotates mθ · k rotates nθ") + '</span></div>' +
          '<div class="ls-rope-metric-wrap" data-rope-metric-group hidden>' +
            '<span class="ls-rope-metric-label">' + L("3D-Metrik", "3D metric") + '</span>' +
            '<div class="ls-rope-metric" role="group" aria-label="' + L("3D-Metrik", "3D metric") + '" data-tip="' + esc(tip("metric")) + '">' +
              '<button type="button" data-rope-metric="euclid" class="is-on">' + L("Euklid", "Euclidean") + '</button>' +
              '<button type="button" data-rope-metric="greatcircle">' + L("Großkreis", "Great circle") + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<canvas class="ls-rope-dial" role="img" data-tip="' + esc(tip("dial")) + '" aria-label="' + L("q und k in einem 2D-Paar, um ihre Positionen gedreht", "q and k in a 2D pair, rotated by their positions") + '"></canvas>' +
        '<canvas class="ls-rope-helix" role="img" hidden data-tip="' + esc(tip("helix")) + '" aria-label="' + L("Die Rotation über Positionen als Helix; die Position ist die dritte Achse", "The rotation across positions as a helix; the position is the third axis") + '"></canvas>' +
        '<canvas class="ls-rope-curve" role="img" hidden data-tip="' + esc(tip("curve")) + '" aria-label="' + L("Dot-Produkt als Funktion des relativen Abstands", "Dot product as a function of relative distance") + '"></canvas>' +
        '<canvas class="ls-rope-matrix" role="img" hidden data-tip="' + esc(tip("matrix")) + '" aria-label="' + L("Score-Matrix über alle Positionen", "Score matrix across all positions") + '"></canvas>' +
        '<p class="ls-rope-view-foot" data-rope-view-foot data-tip="' + esc(tip("viewFoot")) + '"></p>' +
      '</div>';;
    root.appendChild(el);
    var tipEl = document.createElement("div");
    tipEl.className = "ls-rope-tip";
    tipEl.hidden = true;
    document.body.appendChild(tipEl);

    function readTheme() {
      var cs = window.getComputedStyle(el);
      function v(name, fallback) { var x = cs.getPropertyValue(name); return (x || fallback).trim(); }
      return {
        ink: v("--rope-ink", "#1b2a2b"),
        muted: v("--rope-muted", "#627476"),
        line: v("--rope-line", "rgba(0,75,111,.14)"),
        lineStrong: v("--rope-line-strong", "rgba(0,75,111,.30)"),
        sky: v("--rope-sky", "#1275ac"),
        skyBright: v("--rope-sky-bright", "#3f9fd0"),
        gold: v("--rope-gold", "#8a7b00"),
        goldBright: v("--rope-gold-bright", "#c9a227"),
        rose: v("--rope-rose", "#b24a4e"),
        glow: v("--rope-glow", "rgba(18,117,172,.08)")
      };
    }
    var C = readTheme();

    var dialCanvas = el.querySelector(".ls-rope-dial");
    var helixCanvas = el.querySelector(".ls-rope-helix");
    var curveCanvas = el.querySelector(".ls-rope-curve");
    var matrixCanvas = el.querySelector(".ls-rope-matrix");
    var viewTitle = el.querySelector("[data-rope-view-title]");
    var viewSub = el.querySelector("[data-rope-view-sub]");
    var viewFoot = el.querySelector("[data-rope-view-foot]");
    var readout = el.querySelector(".ls-rope-readout");
    var mEl = el.querySelector('[data-rope="m"]');
    var nEl = el.querySelector('[data-rope="n"]');
    var pairsEl = el.querySelector('[data-rope="pairs"]');
    var freqEl = el.querySelector("[data-rope-freqs]");
    var pmetaEl = el.querySelector("[data-rope-pmeta]");
    var metricBtns = Array.prototype.slice.call(el.querySelectorAll("[data-rope-metric]"));
    var metricGroup = el.querySelector("[data-rope-metric-group]");
    var guideStep = el.querySelector("[data-rope-guide-step]");
    var guideTitle = el.querySelector("[data-rope-guide-title]");
    var guideBody = el.querySelector("[data-rope-guide-body]");
    var guideDots = el.querySelector("[data-rope-guide-dots]");
    var guidePrev = el.querySelector("[data-rope-guide-prev]");
    var guideNext = el.querySelector("[data-rope-guide-next]");

    var state = { m: 3, n: 10, maxPos: 32, selected: 0, pairs: 4, rope: false, view: "2d", metric: "euclid", spin: !reduced, step: 0 };
    var dialBox = null, helixBox = null, curveBox = null, matrixBox = null;
    var dispQ = 0, dispK = 0, yaw = 0.62, pitch = 0.34;
    var drag = null, raf = 0, last = 0, guideMeasured = false;

    function theta(i) { return Math.pow(10000, -2 * i / D_MODEL); }
    function selTheta() { return theta(state.selected); }
    function targetAngles() {
      var th = selTheta();
      return { q: state.rope ? state.m * th : 0, k: state.rope ? state.n * th : 0 };
    }
    function pairDotSel() { return state.rope ? Math.cos((state.n - state.m) * selTheta()) : 1; }
    function scoreAt(rel) {
      if (!state.rope) return 1;
      var sum = 0;
      for (var i = 0; i < state.pairs; i++) sum += Math.cos(rel * theta(i));
      return sum / state.pairs;
    }

    var STEPS = DE ? [
      {
        view: "2d", rope: false,
        title: "Das Problem: keine Position",
        body: "Die vorherige Folie addiert einen festen Sinus-/Cosinus-Vektor zum Token. Das macht die Position sichtbar, aber der Vektor wird Teil des Inhalts. Ohne Positionsinformation ist Attention sogar blind für die Reihenfolge: <b>q·k ist für jedes Token-Paar gleich</b>. Im 2D-Paar stehen q und k deshalb beide bei 0°."
      },
      {
        view: "2d", rope: true,
        title: "Die Idee: Query und Key drehen",
        body: "RoPE addiert nichts. Es <b>dreht q um mθ und k um nθ</b>. Das 2D-Rad zeigt dafür <b>ein</b> Frequenzpaar; der große Score in der Mitte ist der Mittelwert über alle Paare. Der Winkel im Paar ist (n−m)θ<sub>i</sub>; nur er zählt. Die Drehung ist orthogonal, die Länge bleibt. Das ist die Konstruktion von Su et al. (2021)."
      },
      {
        view: "curve", rope: true,
        title: "Die Folge: der relative Abstand",
        body: "Jedes Paar gibt eine Cosinus-Kurve. Die dicke Kurve ist der <b>Mittelwert über alle Paare</b>; deshalb ist sie kein einzelner Sinus. Dünn eingezeichnet ist das gewählte Paar. <b>Gleicher Abstand, gleicher Score</b>; der aktuelle Abstand ist markiert."
      },
      {
        view: "matrix", rope: true,
        title: "Alle Positionen: die Matrix",
        body: "Die Matrix zeigt den <b>kombinierten Score aller Paare</b> für alle Paare (m,n). Entlang der Diagonalen ist |m−n| gleich, also die Farbe gleich. <b>Die relative Position ist die Diagonalstruktur</b>: nur n−m zählt."
      },
      {
        view: "3d", rope: true,
        title: "Die Geometrie: die Helix",
        body: "Die Position als dritte Achse: die Rotation wird zur Helix. Hell ist das gewählte Paar, blass die anderen drei; die Steigung hängt von θ ab. Die zwei Dimensionen drehen sich um die Positionsachse. Unten schaltest du zwischen Euklid (Sehne) und Großkreis (Bogen); Ziehen dreht die Ansicht."
      },
      {
        view: "3d", rope: true,
        title: "Warum mehrere Frequenzen?",
        body: "Die Paare haben verschiedene Frequenzen θ_i = 10000^(−2i/d); jedes dreht anders schnell. Die Summe ihrer Cosinus-Kurven ist der Score, deshalb ist die Kurve kein einzelner Sinus. <b>Die Summe bildet den Fingerabdruck.</b> Vorteile: relativ, orthogonal (Norm bleibt), keine zusätzlichen gelernten Positionsparameter, kompatibel mit linearer Attention. Grenzen: gerade Dimensionenzahl, Basis und Paarung sind Design, Long-Context braucht Skalierung oder Interpolation (YaRN, LongRoPE)."
      }
    ] : [
      {
        view: "2d", rope: false,
        title: "The problem: no position",
        body: "The previous slide adds a fixed sine/cosine vector to the token. That makes position visible, but the vector becomes part of the content. Without positional information, attention is blind to order: <b>q·k is the same for every token pair</b>. In the 2D pair, q and k both sit at 0°."
      },
      {
        view: "2d", rope: true,
        title: "The idea: rotate query and key",
        body: "RoPE adds nothing. It <b>rotates q by mθ and k by nθ</b>. The 2D dial shows <b>one</b> frequency pair; the large score below is the mean over all pairs. The angle inside the pair is (n−m)θ<sub>i</sub>; only it matters. The rotation is orthogonal, so lengths stay the same. This is the construction of Su et al. (2021)."
      },
      {
        view: "curve", rope: true,
        title: "The consequence: relative distance",
        body: "Each pair gives a cosine curve. The thick curve is the <b>mean over all pairs</b>; that is why it is not a single sine. The selected pair is drawn thin. <b>Same distance, same score</b>; the current distance is marked."
      },
      {
        view: "matrix", rope: true,
        title: "All positions: the matrix",
        body: "The matrix shows the <b>combined score of all pairs</b> for every pair (m,n). Along a diagonal, |m−n| is equal, so the colour is equal. <b>The relative position is the diagonal structure</b>: only n−m matters."
      },
      {
        view: "3d", rope: true,
        title: "The geometry: the helix",
        body: "Position as the third axis: the rotation becomes a helix. The selected pair is bright, the other three faint; the pitch depends on θ. The two dimensions rotate around the position axis. Below you switch between Euclidean (chord) and great circle (arc); drag rotates the view."
      },
      {
        view: "3d", rope: true,
        title: "Why several frequencies?",
        body: "The pairs have different frequencies θ_i = 10000^(−2i/d); each rotates at a different speed. The sum of their cosine curves is the score, which is why the curve is not a single sine. <b>The sum forms the fingerprint.</b> Advantages: relative, orthogonal (norm preserved), no extra learned position parameters, compatible with linear attention. Limits: even number of dimensions, base and pairing are design choices, long context needs scaling or interpolation (YaRN, LongRoPE)."
      }
    ];

    function renderGuide() {
      var s = STEPS[state.step];
      guideStep.textContent = L("Schritt ", "Step ") + (state.step + 1) + " / " + STEPS.length;
      guideTitle.textContent = s.title;
      guideBody.innerHTML = s.body;
      guideDots.innerHTML = "";
      STEPS.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ls-rope-guide-dot" + (i === state.step ? " is-on" : "");
        b.setAttribute("data-rope-step", String(i));
        b.setAttribute("aria-label", L("Schritt ", "Step ") + (i + 1));
        b.setAttribute("data-tip", esc(L("Schritt ", "Step ") + (i + 1) + ": " + STEPS[i].title));
        b.addEventListener("click", function () { applyStep(i); });
        guideDots.appendChild(b);
      });
      guidePrev.disabled = state.step === 0;
      guideNext.disabled = state.step === STEPS.length - 1;
    }

    function measureGuideHeight() {
      if (!el.getClientRects().length) return;
      var curTitle = guideTitle.textContent;
      var curBody = guideBody.innerHTML;
      guideTitle.style.minHeight = "0px";
      guideBody.style.minHeight = "0px";
      var maxTitle = 0, maxBody = 0;
      for (var i = 0; i < STEPS.length; i++) {
        guideTitle.textContent = STEPS[i].title;
        guideBody.innerHTML = STEPS[i].body;
        maxTitle = Math.max(maxTitle, guideTitle.offsetHeight);
        maxBody = Math.max(maxBody, guideBody.offsetHeight);
      }
      guideTitle.textContent = curTitle;
      guideBody.innerHTML = curBody;
      if (maxBody > 0) {
        guideTitle.style.minHeight = maxTitle + "px";
        guideBody.style.minHeight = maxBody + "px";
        guideMeasured = true;
      }
    }

    function applyStep(i) {
      state.step = clamp(i, 0, STEPS.length - 1);
      var s = STEPS[state.step];
      state.rope = !!s.rope;
      state.view = s.view;
      syncControls();
      setView(s.view);
      renderGuide();
      measureGuideHeight();
    }

    function nextStep() {
      if (state.step < STEPS.length - 1) { applyStep(state.step + 1); return true; }
      return false;
    }
    function prevStep() {
      if (state.step > 0) { applyStep(state.step - 1); return true; }
      return false;
    }

    function fit() {
      if (!dialCanvas.hidden) dialBox = api.fit(dialCanvas, dialCanvas);
      if (!helixCanvas.hidden) helixBox = api.fit(helixCanvas, helixCanvas);
      if (!curveCanvas.hidden) curveBox = api.fit(curveCanvas, curveCanvas);
      if (!matrixCanvas.hidden) matrixBox = api.fit(matrixCanvas, matrixCanvas);
    }

    function drawDial() {
      if (!dialBox || state.view !== "2d") return;
      C = readTheme();
      var ctx = dialBox.ctx, w = dialBox.w, h = dialBox.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h * 0.47, R = Math.min(w * 0.30, h * 0.38);
      var pulse = 0.86 + 0.14 * Math.sin(performance.now() * 0.0024);

      var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.6);
      glow.addColorStop(0, C.glow);
      glow.addColorStop(0.62, "rgba(0,0,0,0)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(cx - R - 12, cy); ctx.lineTo(cx + R + 12, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - R - 12); ctx.lineTo(cx, cy + R + 12); ctx.stroke();

      for (var k = 0; k < 24; k++) {
        var a = k * Math.PI / 12;
        var len = k % 3 === 0 ? 8 : 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (R - len), cy + Math.sin(a) * (R - len));
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.strokeStyle = k % 3 === 0 ? C.lineStrong : C.line;
        ctx.stroke();
      }
      ctx.fillStyle = C.muted;
      ctx.font = '600 8px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("0°", cx + R + 19, cy + 3);
      ctx.fillText("90°", cx, cy - R - 18);
      ctx.fillText("180°", cx - R - 20, cy + 3);
      ctx.fillText("270°", cx, cy + R + 21);

      function arrow(angle, colorA, colorB, dashed, width) {
        var x = cx + Math.cos(angle) * R;
        var y = cy + Math.sin(angle) * R;
        var grad = ctx.createLinearGradient(cx, cy, x, y);
        grad.addColorStop(0, colorA);
        grad.addColorStop(1, colorB);
        ctx.save();
        if (dashed) ctx.setLineDash([5, 4]);
        ctx.strokeStyle = grad;
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.shadowColor = colorB;
        ctx.shadowBlur = 16 * pulse;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
        ctx.setLineDash([]);
        var ah = 8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - Math.cos(angle - 0.42) * ah, y - Math.sin(angle - 0.42) * ah);
        ctx.lineTo(x - Math.cos(angle + 0.42) * ah, y - Math.sin(angle + 0.42) * ah);
        ctx.closePath();
        ctx.fillStyle = colorB;
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(x, y, dashed ? 3 : 3.6, 0, Math.PI * 2);
        ctx.fillStyle = colorB;
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;
        return { x: x, y: y };
      }

      var aq = dispQ, ak = dispK;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R, cy);
      ctx.strokeStyle = C.line;
      ctx.setLineDash([2, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      var q = arrow(aq, C.gold, C.goldBright, false, 2.6);
      var kk = arrow(ak, C.sky, C.skyBright, true, 2.1);
      var delta = Math.atan2(Math.sin(ak - aq), Math.cos(ak - aq));
      if (Math.abs(delta) > 0.02) {
        var start = aq, end = aq + delta;
        ctx.save();
        ctx.strokeStyle = C.rose;
        ctx.lineWidth = 2;
        ctx.shadowColor = C.rose;
        ctx.shadowBlur = 12 * pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.62, Math.min(start, end), Math.max(start, end));
        ctx.stroke();
        ctx.restore();
        var mid = aq + delta / 2;
        ctx.fillStyle = C.rose;
        ctx.font = '700 10px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("∠", cx + Math.cos(mid) * R * 0.72, cy + Math.sin(mid) * R * 0.72 + 3);
      }

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = C.ink;
      ctx.shadowColor = C.ink;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();

      ctx.font = '700 11px "Open Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillStyle = C.gold;
      ctx.fillText("q", q.x + 9, q.y - 4);
      ctx.fillStyle = C.sky;
      ctx.fillText("k", kk.x + 9, kk.y + 13);
    }

    function drawHelix() {
      if (!helixBox || state.view !== "3d") return;
      C = readTheme();
      var ctx = helixBox.ctx, w = helixBox.w, h = helixBox.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w * 0.5, cy = h * 0.50;
      var unit = Math.min(w * 0.34, h * 0.33);
      var focal = 3.8;
      var cyw = Math.cos(yaw), syw = Math.sin(yaw);
      var cp = Math.cos(pitch), sp = Math.sin(pitch);

      function project(x, y, z) {
        var xr = x * cyw - y * syw;
        var yr = x * syw + y * cyw;
        var sx = xr;
        var sy = z * cp - yr * sp;
        var depth = z * sp + yr * cp;
        var scale = focal / (focal + depth);
        return { x: cx + sx * scale * unit, y: cy - sy * scale * unit, depth: depth, scale: scale };
      }
      function zAt(p) { return (p / (state.maxPos - 1)) * 2.6 - 1.3; }

      var glow = ctx.createRadialGradient(cx, cy - unit * 0.2, 0, cx, cy - unit * 0.2, unit * 2.2);
      glow.addColorStop(0, C.glow);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      function axis(from, to, label, color) {
        var a = project(from[0], from[1], from[2]);
        var b = project(to[0], to[1], to[2]);
        ctx.save();
        ctx.globalAlpha = 0.58;
        ctx.strokeStyle = color || C.lineStrong;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = C.muted;
        ctx.font = '600 8px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(label, b.x, b.y - 7);
      }
      axis([0, 0, -1.3], [1.35, 0, -1.3], L("Dimension 1", "Dimension 1"), C.gold);
      axis([0, 0, -1.3], [0, 1.35, -1.3], L("Dimension 2", "Dimension 2"), C.sky);
      axis([0, 0, -1.3], [0, 0, 1.35], L("Position", "Position"), C.lineStrong);

      function ring(z, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var i = 0; i <= 64; i++) {
          var a = i / 64 * Math.PI * 2;
          var p = project(Math.cos(a) * 1.06, Math.sin(a) * 1.06, z);
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 0.9;
      for (var r = 0; r <= 4; r++) ring(-1.3 + r * 0.65, C.line);
      ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.30;
      ring(zAt(state.m), C.gold);
      ring(zAt(state.n), C.sky);
      ctx.globalAlpha = 1;

      function helixLine(pair, isSelected) {
        var th = theta(pair);
        var grad = null;
        if (isSelected) {
          grad = ctx.createLinearGradient(0, cy - unit * 1.4, 0, cy + unit * 1.4);
          grad.addColorStop(0, C.gold);
          grad.addColorStop(1, C.sky);
        }
        ctx.save();
        ctx.globalAlpha = isSelected ? 1 : 0.16;
        ctx.strokeStyle = isSelected ? grad : C.sky;
        ctx.lineWidth = isSelected ? 2.2 : 1;
        ctx.lineCap = "round";
        if (isSelected) {
          ctx.shadowColor = C.sky;
          ctx.shadowBlur = 14;
        }
        ctx.beginPath();
        var started = false;
        for (var p = 0; p < state.maxPos; p += 0.2) {
          var a = state.rope ? p * th : 0;
          var q = project(Math.cos(a), Math.sin(a), zAt(p));
          if (!started) { ctx.moveTo(q.x, q.y); started = true; } else ctx.lineTo(q.x, q.y);
        }
        ctx.stroke();
        ctx.restore();
      }
      for (var pi = 0; pi < state.pairs; pi++) {
        if (pi !== state.selected) helixLine(pi, false);
      }
      helixLine(state.selected, true);

      function marker(pos, color, label) {
        var a = state.rope ? pos * selTheta() : 0;
        var z = zAt(pos);
        var base = project(0, 0, z);
        var tip = project(Math.cos(a), Math.sin(a), z);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.restore();
        ctx.fillStyle = color;
        ctx.font = '700 9px "Open Sans", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(label, tip.x + 8, tip.y - 4);
      }
      marker(state.m, C.gold, "q");
      marker(state.n, C.sky, "k");

      if (state.rope) {
        var aq = state.m * selTheta();
        var ak = state.n * selTheta();
        var delta = Math.atan2(Math.sin(ak - aq), Math.cos(ak - aq));
        var baseZ = -1.3;
        var isArc = state.metric === "greatcircle";
        ctx.save();
        ctx.strokeStyle = C.rose;
        ctx.lineWidth = 1.7;
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = C.rose;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        if (isArc) {
          for (var si = 0; si <= 32; si++) {
            var aa = aq + delta * (si / 32);
            var ap = project(Math.cos(aa), Math.sin(aa), baseZ);
            if (si === 0) ctx.moveTo(ap.x, ap.y); else ctx.lineTo(ap.x, ap.y);
          }
        } else {
          var ap1 = project(Math.cos(aq), Math.sin(aq), baseZ);
          var ap2 = project(Math.cos(ak), Math.sin(ak), baseZ);
          ctx.moveTo(ap1.x, ap1.y); ctx.lineTo(ap2.x, ap2.y);
        }
        ctx.stroke();
        ctx.restore();
        var midA = aq + delta / 2;
        var lab = project(Math.cos(midA) * 1.18, Math.sin(midA) * 1.18, baseZ);
        ctx.fillStyle = C.rose;
        ctx.font = '700 8px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(isArc ? L("Großkreis", "great circle") : L("Sehne", "chord"), lab.x, lab.y - 4);
      }

      ctx.fillStyle = C.muted;
      ctx.font = '600 8px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(L("Gold: q · Blau: k · blass: andere Paare", "gold: q · blue: k · faint: other pairs"), w / 2, h - 9);
    }

    function drawCurve() {
      if (!curveBox || state.view !== "curve") return;
      C = readTheme();
      var ctx = curveBox.ctx, w = curveBox.w, h = curveBox.h;
      ctx.clearRect(0, 0, w, h);
      var x0 = 48, x1 = w - 18, y0 = h - 36, y1 = 22;
      var maxRel = state.maxPos - 1;
      function X(rel) { return x0 + (rel / maxRel) * (x1 - x0); }
      function Y(v) { return y0 - ((v + 1) / 2) * (y0 - y1); }

      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      [-1, 0, 1].forEach(function (v) {
        ctx.globalAlpha = v === 0 ? 0.55 : 0.28;
        ctx.beginPath(); ctx.moveTo(x0, Y(v)); ctx.lineTo(x1, Y(v)); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.muted;
      ctx.font = '600 9px "Open Sans", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText("+1", x0 - 7, Y(1) + 3);
      ctx.fillText("0", x0 - 7, Y(0) + 3);
      ctx.fillText("−1", x0 - 7, Y(-1) + 3);
      for (var t = 0; t <= 4; t++) {
        var rv = Math.round(maxRel * t / 4);
        var xx = X(rv);
        ctx.strokeStyle = C.line;
        ctx.beginPath(); ctx.moveTo(xx, y0); ctx.lineTo(xx, y0 + 4); ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.textAlign = "center";
        ctx.fillText(String(rv), xx, h - 20);
      }
      ctx.textAlign = "center";
      ctx.fillText(L("relativer Abstand |m−n|", "relative distance |m−n|"), (x0 + x1) / 2, h - 7);
      ctx.save();
      ctx.translate(12, (y0 + y1) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = C.muted;
      ctx.fillText("q·k", 0, 0);
      ctx.restore();

      var selPts = [];
      for (var relS = 0; relS <= maxRel + 1e-6; relS += 0.05) {
        var vS = state.rope ? Math.cos(relS * selTheta()) : 1;
        selPts.push({ x: X(relS), y: Y(vS) });
      }
      ctx.save();
      ctx.strokeStyle = C.sky;
      ctx.globalAlpha = 0.38;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      selPts.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();
      ctx.restore();

      var pts = [];
      for (var rel = 0; rel <= maxRel + 1e-6; rel += 0.05) {
        pts.push({ x: X(rel), y: Y(scoreAt(rel)) });
      }
      ctx.save();
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = C.gold;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      pts.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();
      ctx.restore();

      var cr = Math.abs(state.n - state.m);
      var cv = scoreAt(cr);
      var cxp = X(cr), cyp = Y(cv);
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = C.lineStrong;
      ctx.beginPath(); ctx.moveTo(cxp, y0); ctx.lineTo(cxp, y1); ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(cxp, cyp, 5, 0, Math.PI * 2);
      ctx.fillStyle = C.gold; ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.font = '700 10px "Open Sans", sans-serif';
      ctx.textAlign = cxp > w - 80 ? "right" : "left";
      ctx.fillText(cv.toFixed(3), cxp + (cxp > w - 80 ? -9 : 9), cyp - 8);
    }

    function drawMatrix() {
      if (!matrixBox || state.view !== "matrix") return;
      C = readTheme();
      var ctx = matrixBox.ctx, w = matrixBox.w, h = matrixBox.h;
      ctx.clearRect(0, 0, w, h);
      var N = state.maxPos;
      var size = Math.max(80, Math.min(w - 58, h - 52));
      var cell = size / N;
      var ox = (w - size) / 2, oy = (h - size) / 2 + 2;

      for (var m = 0; m < N; m++) {
        for (var n = 0; n < N; n++) {
          var v = scoreAt(Math.abs(m - n));
          ctx.globalAlpha = Math.pow(Math.abs(v), 0.65) * 0.85;
          ctx.fillStyle = v >= 0 ? C.gold : C.rose;
          ctx.fillRect(ox + n * cell, oy + m * cell, Math.ceil(cell) + 0.5, Math.ceil(cell) + 0.5);
        }
      }
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 0.5;
      for (var i = 0; i <= N; i++) {
        ctx.beginPath(); ctx.moveTo(ox + i * cell, oy); ctx.lineTo(ox + i * cell, oy + size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, oy + i * cell); ctx.lineTo(ox + size, oy + i * cell); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = C.lineStrong;
      ctx.lineWidth = 1;
      ctx.strokeRect(ox, oy, size, size);

      var sx = ox + state.n * cell, sy = oy + state.m * cell;
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = C.lineStrong;
      ctx.beginPath(); ctx.moveTo(ox, sy + cell / 2); ctx.lineTo(ox + size, sy + cell / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + cell / 2, oy); ctx.lineTo(sx + cell / 2, oy + size); ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = C.gold;
      ctx.shadowBlur = 10;
      ctx.strokeRect(sx, sy, cell, cell);
      ctx.restore();

      ctx.fillStyle = C.muted;
      ctx.font = '600 9px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("n →", ox + size / 2, oy + size + 15);
      ctx.save();
      ctx.translate(ox - 16, oy + size / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("m →", 0, 0);
      ctx.restore();
      ctx.textAlign = "left";
      ctx.fillText("0", ox, oy - 6);
      ctx.textAlign = "right";
      ctx.fillText(String(N - 1), ox + size, oy - 6);
      ctx.textAlign = "left";
      ctx.fillText("0", ox - 5, oy + 8);
      ctx.textAlign = "right";
      ctx.fillText(String(N - 1), ox - 5, oy + size - 2);
      ctx.textAlign = "left";
      ctx.fillStyle = C.rose;
      ctx.fillText("−1", ox + size - 44, oy + size + 15);
      ctx.fillStyle = C.gold;
      ctx.fillText("+1", ox + size - 16, oy + size + 15);
    }

    function drawActive() {
      if (state.view === "2d") drawDial();
      else if (state.view === "3d") drawHelix();
      else if (state.view === "curve") drawCurve();
      else drawMatrix();
    }

    function syncText() {
      var rel = Math.abs(state.n - state.m);
      var score = scoreAt(rel);
      var selDot = pairDotSel();
      var selAngle = state.rope ? (state.n - state.m) * selTheta() : 0;
      var minor = Math.atan2(Math.sin(selAngle), Math.cos(selAngle));
      var p = state.selected + 1;
      var dimA = 2 * state.selected + 1, dimB = 2 * state.selected + 2;
      readout.innerHTML =
        '<span class="ls-rope-readout-main">q·k = <b>' + score.toFixed(3) + '</b></span>' +
        '<span class="ls-rope-readout-sub">' + (state.rope
          ? 'm=' + state.m + ', n=' + state.n + ' · ' + L("Ø über P = ", "mean over P = ") + state.pairs + ' · ' + L("Paar ", "pair ") + p + ' (' + L("Dimensionen", "dimensions") + ' ' + dimA + ', ' + dimB + ') θ=' + selTheta().toFixed(3)
          : L("RoPE aus · q und k bleiben stehen", "RoPE off · q and k stay put")) + '</span>';
      if (state.view === "2d") {
        viewTitle.textContent = L("2 Dimensionen · Paar ", "2 dimensions · pair ") + p + " / " + state.pairs;
        viewSub.textContent = L("q dreht mθ_i · k dreht nθ_i", "q rotates mθ_i · k rotates nθ_i");
        viewFoot.textContent = state.rope
          ? L("Paar ", "pair ") + p + ' (' + L("Dimensionen", "dimensions") + ' ' + dimA + ', ' + dimB + '): q·k_i = ' + selDot.toFixed(3) + L(" · Winkel q↔k = ", " · angle q↔k = ") + (minor * 180 / Math.PI).toFixed(1) + "°"
          : L("RoPE aus: q und k bleiben an derselben Stelle", "RoPE off: q and k stay at the same place");
      } else if (state.view === "3d") {
        viewTitle.textContent = L("3. Achse: Position · Paar ", "3rd axis: position · pair ") + p + " / " + state.pairs;
        viewSub.textContent = L("dieselbe Drehung als Helix", "same rotation as a helix");
        var minorAbs = Math.abs(minor);
        var metricText = state.metric === "greatcircle"
          ? L("Großkreis Δ = ", "great circle Δ = ") + (minorAbs * 180 / Math.PI).toFixed(1) + "° = " + minorAbs.toFixed(2) + " rad"
          : L("Sehne |q−k| = ", "chord |q−k| = ") + (2 * Math.sin(minorAbs / 2)).toFixed(3) + L(" · Δ = ", " · Δ = ") + (minorAbs * 180 / Math.PI).toFixed(1) + "°";
        viewFoot.textContent = state.rope
          ? metricText + L(" · Paar hell; andere blass · Ziehen dreht", " · selected pair bright; others faint · drag rotates")
          : L("ohne RoPE: gerade Linie · Ziehen dreht", "without RoPE: straight line · drag rotates");
      } else if (state.view === "curve") {
        viewTitle.textContent = L("Score über P = ", "Score over P = ") + state.pairs;
        viewSub.textContent = L("Mittelwert der Cosinus-Kurven", "mean of the cosine curves");
        viewFoot.textContent = state.rope
          ? L("Kombiniert; dünn: Paar ", "combined; thin: pair ") + p + L(". Gleicher Abstand, gleicher Score.", ". Same distance, same score.")
          : L("ohne RoPE: der Score bleibt bei 1", "without RoPE: the score stays 1");
      } else {
        viewTitle.textContent = L("Score-Matrix · P = ", "Score matrix · P = ") + state.pairs;
        viewSub.textContent = L("kombinierter Score für alle (m,n)", "combined score for all (m,n)");
        viewFoot.textContent = state.rope
          ? L("Diagonalen bleiben: nur n−m zählt. Summe der Cosinus-Kurven.", "Diagonals remain: only n−m matters. Sum of the cosine curves.")
          : L("ohne RoPE: alle Scores sind 1", "without RoPE: all scores are 1");
      }
    }

    function setView(view) {
      state.view = ["2d", "3d", "curve", "matrix"].indexOf(view) >= 0 ? view : "2d";
      dialCanvas.hidden = state.view !== "2d";
      helixCanvas.hidden = state.view !== "3d";
      curveCanvas.hidden = state.view !== "curve";
      matrixCanvas.hidden = state.view !== "matrix";
      if (metricGroup) metricGroup.hidden = state.view !== "3d";
      fit();
      dispQ = targetAngles().q;
      dispK = targetAngles().k;
      syncText();
      drawActive();
    }

    function syncControls() {
      mEl.value = String(state.m);
      nEl.value = String(state.n);
      mEl.nextElementSibling.textContent = String(state.m);
      nEl.nextElementSibling.textContent = String(state.n);
      if (pairsEl) {
        pairsEl.value = String(state.pairs);
        if (pairsEl.nextElementSibling) pairsEl.nextElementSibling.textContent = String(state.pairs);
      }
      if (pmetaEl) pmetaEl.textContent = String(state.pairs);
      metricBtns.forEach(function (b) {
        var on = b.getAttribute("data-rope-metric") === state.metric;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
    }

    function renderFreqs() {
      freqEl.innerHTML = '<span class="ls-rope-freqs-label" data-tip="' + esc(tip("chip")) + '">' + L("Paar wählen · 2 Dimensionen pro Paar · ", "Pick a pair · 2 dimensions per pair · ") + state.pairs + L(" von 32", " of 32") + '</span>';
      for (var i = 0; i < state.pairs; i++) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ls-rope-freq" + (i === state.selected ? " is-on" : "");
        b.innerHTML = '<span>' + L("Paar ", "pair ") + (i + 1) + '</span><b>θ ' + theta(i).toFixed(3) + '</b>';
        b.title = L("Paar ", "pair ") + (i + 1) + L(" · Dimensionen ", " · dimensions ") + (2 * i + 1) + "/" + (2 * i + 2);
        b.setAttribute("data-tip", esc(L("Paar ", "pair ") + (i + 1) + L(" · Dimensionen ", " · dimensions ") + (2 * i + 1) + ", " + (2 * i + 2) + ". " + tip("chip")));
        b.setAttribute("aria-pressed", String(i === state.selected));
        b.addEventListener("click", (function (idx) {
          return function () {
            state.selected = idx;
            renderFreqs();
            syncText();
            drawActive();
          };
        })(i));
        freqEl.appendChild(b);
      }
    }

    function renderTex() {
      if (!window.temml || !window.temml.renderToString) return false;
      el.querySelectorAll("[data-tex]").forEach(function (node) {
        if (node.getAttribute("data-tex-rendered") === "1") return;
        try {
          node.innerHTML = window.temml.renderToString(node.getAttribute("data-tex"), { displayMode: false, throwOnError: false });
          node.setAttribute("data-tex-rendered", "1");
        } catch (err) {
          node.textContent = node.getAttribute("data-tex");
        }
      });
      return true;
    }

    mEl.addEventListener("input", function () {
      state.m = clamp(parseInt(mEl.value, 10) || 0, 0, state.maxPos - 1);
      mEl.nextElementSibling.textContent = String(state.m);
      syncText(); drawActive();
    });
    nEl.addEventListener("input", function () {
      state.n = clamp(parseInt(nEl.value, 10) || 0, 0, state.maxPos - 1);
      nEl.nextElementSibling.textContent = String(state.n);
      syncText(); drawActive();
    });
    if (pairsEl) pairsEl.addEventListener("input", function () {
      state.pairs = clamp(parseInt(pairsEl.value, 10) || 1, 1, 8);
      if (state.selected > state.pairs - 1) state.selected = state.pairs - 1;
      syncControls();
      renderFreqs();
      syncText();
      drawActive();
    });
    guidePrev.addEventListener("click", function () { prevStep(); });
    guideNext.addEventListener("click", function () { nextStep(); });
    metricBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        state.metric = b.getAttribute("data-rope-metric") === "greatcircle" ? "greatcircle" : "euclid";
        syncControls();
        syncText();
        drawActive();
      });
    });

    var tipTarget = null;
    function placeTip(x, y) {
      if (tipEl.hidden) return;
      var pad = 14;
      var w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      var left = x + pad, top = y + pad;
      if (left + w > window.innerWidth - 8) left = x - w - pad;
      if (top + h > window.innerHeight - 8) top = y - h - pad;
      tipEl.style.left = Math.max(8, left) + "px";
      tipEl.style.top = Math.max(8, top) + "px";
    }
    function showTip(node, x, y) {
      var text = node.getAttribute("data-tip");
      if (!text) return;
      tipTarget = node;
      tipEl.textContent = text;
      tipEl.hidden = false;
      placeTip(x, y);
    }
    function hideTip() {
      tipTarget = null;
      tipEl.hidden = true;
    }
    el.addEventListener("pointerover", function (e) {
      var node = e.target && e.target.closest ? e.target.closest("[data-tip]") : null;
      if (node && el.contains(node)) showTip(node, e.clientX, e.clientY);
    });
    el.addEventListener("pointermove", function (e) {
      if (tipTarget) placeTip(e.clientX, e.clientY);
    });
    el.addEventListener("pointerout", function (e) {
      if (!tipTarget) return;
      if (!e.relatedTarget || !tipTarget.contains(e.relatedTarget)) hideTip();
    });
    el.addEventListener("pointerdown", hideTip);
    el.addEventListener("focusin", function (e) {
      var node = e.target && e.target.closest ? e.target.closest("[data-tip]") : null;
      if (!node || !el.contains(node)) return;
      var r = node.getBoundingClientRect();
      showTip(node, r.left + r.width / 2, r.bottom - 4);
    });
    el.addEventListener("focusout", hideTip);

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!guideMeasured) measureGuideHeight();
      if (now - last < 33) return;
      last = now;
      var ta = targetAngles();
      if (reduced) {
        dispQ = ta.q; dispK = ta.k;
      } else {
        dispQ += (ta.q - dispQ) * 0.16;
        dispK += (ta.k - dispK) * 0.16;
      }
      if (state.spin && !drag && !reduced) yaw += 0.004;
      drawActive();
    }

    helixCanvas.addEventListener("pointerdown", function (e) {
      drag = { x: e.clientX, y: e.clientY };
      try { helixCanvas.setPointerCapture(e.pointerId); } catch (err) {}
    });
    helixCanvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.008;
      pitch = clamp(pitch + (e.clientY - drag.y) * 0.006, -0.9, 0.9);
      drag.x = e.clientX; drag.y = e.clientY;
      drawHelix();
    });
    helixCanvas.addEventListener("pointerup", function () { drag = null; });
    helixCanvas.addEventListener("pointercancel", function () { drag = null; });

    function resize() {
      fit();
      dispQ = targetAngles().q;
      dispK = targetAngles().k;
      syncText();
      measureGuideHeight();
      renderTex();
      drawDial();
      drawHelix();
    }

    applyStep(0);
    renderFreqs();
    if (!renderTex()) window.addEventListener("load", renderTex, { once: true });
    raf = requestAnimationFrame(loop);

    return {
      update: function () {},
      next: function () { return false; },
      prev: function () { return false; },
      hasNext: function () { return false; },
      hasPrev: function () { return false; },
      resize: resize,
      ownsKeys: function () { return true; },
      onKey: function (e) { return api.util.arrowKey(e, nextStep, prevStep); },
      pause: function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } },
      resume: function () { if (!raf) raf = requestAnimationFrame(loop); },
      destroy: function () {
        if (raf) cancelAnimationFrame(raf);
        tipEl.remove();
        el.remove();
      }
    };
  }

  core.register("rope", ropeScene);
})();
