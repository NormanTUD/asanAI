(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function fxScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-bs-fx ls-fx";
    var INPUTS = {
      corpus: {
        label: DE ? "f_θ(Daten)" : "f_θ(data)",
        tex: DE ? "f_{\\theta}(\\text{Daten})" : "f_{\\theta}(\\text{data})",
        tag: "Pretraining",
        sub: DE ? "Vervollständigen" : "completion",
        size: 100,
        sizeLabel: DE ? "≈ 10⁹ Beispiele" : "≈ 10⁹ examples",
        prompt: DE ? "Die Hauptstadt von Frankreich ist ___." : "The capital of France is ___.",
        target: "Paris",
        targetIdx: 0,
        startStep: 2,
        levels: [[20, 55, 25], [30, 50, 20], [45, 42, 13], [62, 30, 8], [76, 18, 6], [90, 8, 2], [98.5, 1, 0.5]],
        cands: [
          { name: "Paris", cls: "is-good", status: DE ? "in den Daten" : "in the data" },
          { name: "Rom", cls: "is-mid", status: DE ? "plausibel, falsch" : "plausible, wrong" },
          { name: "Seine", cls: "is-bad", status: DE ? "passt nicht" : "does not fit" }
        ],
        sample: DE ? "Daten: Milliarden von Paaren (x, nächstes Token). Beispiel: „Die Hauptstadt von Frankreich ist Paris.“" : "Data: billions of pairs (x, next token). Example: “The capital of France is Paris.”",
        note: DE ? "Pretraining: Im Rohkorpus steht „Die Hauptstadt von Frankreich ist Paris“. Die Vervollständigung funktioniert, weil das Modell diese Fortsetzung gesehen hat." : "Pretraining: the raw corpus contains “The capital of France is Paris”. Completion works because the model has seen this continuation."
      },
      rawq: {
        label: DE ? "f_θ(Frage an Rohdaten)" : "f_θ(question on raw data)",
        tex: DE ? "f_{\\theta}(\\text{Frage an Rohdaten})" : "f_{\\theta}(\\text{question on raw data})",
        tag: DE ? "vor dem Fine-tuning" : "before fine-tuning",
        sub: DE ? "Wikipedia-Stil" : "Wikipedia style",
        size: 8,
        sizeLabel: DE ? "1 Frage" : "1 question",
        prompt: DE ? "Was ist die Hauptstadt von Frankreich? ___" : "What is the capital of France? ___",
        target: "Paris",
        targetIdx: 1,
        startStep: 0,
        levels: [[55, 30, 15], [50, 38, 12], [42, 48, 10], [30, 62, 8], [18, 76, 6], [8, 90, 2], [1, 98.5, 0.5]],
        cands: [
          { name: DE ? "Die" : "The", cls: "is-mid", status: DE ? "Wikipedia-Stil, keine direkte Antwort" : "Wikipedia style, not a direct answer" },
          { name: "Paris", cls: "is-good", status: DE ? "richtige Antwort, aber unsicher" : "right answer, but uncertain" },
          { name: "Frankreich", cls: "is-bad", status: DE ? "passt nicht" : "does not fit" }
        ],
        sample: DE ? "Nur die Frage. Im Rohkorpus steht kein Frage-Antwort-Paar, nur Artikeltext." : "Only the question. The raw corpus has no question-answer pair, only article text.",
        note: DE ? "Vor dem Fine-tuning setzt das Modell die Frage wie einen Wikipedia-Artikel fort: „Die Hauptstadt von Frankreich ist Paris.“ Es antwortet nicht direkt." : "Before fine-tuning the model continues the question like a Wikipedia article: “The capital of France is Paris.” It does not answer directly."
      },
      first: {
        label: DE ? "f_θ(1. Trainingsdatensatz)" : "f_θ(first training example)",
        tex: DE ? "f_{\\theta}(\\text{1. Trainingsdatensatz})" : "f_{\\theta}(\\text{first training example})",
        tag: "Fine-tuning",
        sub: DE ? "Frage → Antwort" : "question → answer",
        size: 8,
        sizeLabel: DE ? "1 Beispiel" : "1 example",
        prompt: DE ? "Was ist die Hauptstadt von Frankreich? ___" : "What is the capital of France? ___",
        target: "Paris",
        targetIdx: 0,
        startStep: 4,
        levels: [[30, 55, 15], [38, 50, 12], [48, 42, 10], [62, 30, 8], [76, 18, 6], [90, 8, 2], [98.5, 1, 0.5]],
        cands: [
          { name: "Paris", cls: "is-good", status: DE ? "in den Daten" : "in the data" },
          { name: DE ? "Die" : "The", cls: "is-mid", status: DE ? "Wikipedia-Stil, nicht mehr nötig" : "Wikipedia style, no longer needed" },
          { name: "Frankreich", cls: "is-bad", status: DE ? "passt nicht" : "does not fit" }
        ],
        sample: DE ? "x: „Was ist die Hauptstadt von Frankreich?“  ·  y: „Paris“" : "x: “What is the capital of France?”  ·  y: “Paris”",
        note: DE ? "Fine-tuning-Beispiel 1: Im Datensatz steht das Frage-Antwort-Paar. Das Modell antwortet jetzt direkt mit „Paris“." : "Fine-tuning example 1: the dataset contains the question-answer pair. The model now answers directly with “Paris”."
      },
      second: {
        label: DE ? "f_θ(2. Trainingsdatensatz)" : "f_θ(second training example)",
        tex: DE ? "f_{\\theta}(\\text{2. Trainingsdatensatz})" : "f_{\\theta}(\\text{second training example})",
        tag: "Fine-tuning",
        sub: DE ? "zweite Frage" : "second question",
        size: 8,
        sizeLabel: DE ? "1 Beispiel" : "1 example",
        prompt: DE ? "Was ist die Hauptstadt von Italien? ___" : "What is the capital of Italy? ___",
        target: "Rom",
        targetIdx: 0,
        startStep: 4,
        levels: [[25, 60, 15], [35, 52, 13], [48, 40, 12], [62, 30, 8], [78, 18, 4], [92, 6, 2], [98.5, 1, 0.5]],
        cands: [
          { name: "Rom", cls: "is-good", status: DE ? "in den Daten" : "in the data" },
          { name: DE ? "Die" : "The", cls: "is-mid", status: DE ? "Wikipedia-Stil, nicht mehr nötig" : "Wikipedia style, no longer needed" },
          { name: "Italien", cls: "is-bad", status: DE ? "passt nicht" : "does not fit" }
        ],
        sample: DE ? "x: „Was ist die Hauptstadt von Italien?“  ·  y: „Rom“" : "x: “What is the capital of Italy?”  ·  y: “Rome”",
        note: DE ? "Fine-tuning-Beispiel 2: Im Datensatz steht die zweite Frage-Antwort-Paarung. Dieselbe Funktion, anderes Land, direkte Antwort." : "Fine-tuning example 2: the dataset contains the second question-answer pair. The same function, another country, a direct answer."
      }
    };
    var ORDER = ["corpus", "rawq", "first", "second"];
    var visited = {};
    el.innerHTML =
      '<div class="ls-fx-hero">' +
        '<span class="ls-fx-kicker">' + (DE ? "Die Architektur als Funktion" : "The architecture as a function") + '</span>' +
        '<h2>f<sub>θ</sub>(x) ' + (DE ? "lernt aus Daten" : "learns from data") + '</h2>' +
        '<p>' + (DE ? "Die Form bleibt gleich, etwa f_θ(x) = ax + b. θ sind die jeweiligen Werte von a und b: Beim Training ändert sich θ, nicht die Form von f. Der Nudge gilt für alle Beispiele." : "The form stays the same, for example f_θ(x) = ax + b. θ are the respective values of a and b: training changes θ, not the form of f. The nudge applies to all examples.") + '</p>' +
      '</div>' +
      '<div class="ls-fx-batch"><b>' + (DE ? "alle Beispiele" : "all examples") + '</b><span class="ls-fx-batch-dots"><i></i><i></i><i></i><i></i><i></i><i class="is-on"></i><i></i><i></i><i></i><i></i><i></i><i></i></span><small>' + (DE ? "jedes Paar (x, nächstes Token) zieht θ ein wenig" : "every pair (x, next token) pulls θ a little") + '</small></div>' +
      '<div class="ls-fx-stage">' +
        '<div class="ls-fx-inputs" role="group" aria-label="' + (DE ? "Eingaben für f" : "Inputs to f") + '">' +
          '<button type="button" class="ls-fx-input is-on" data-fx-input="corpus" aria-label="' + INPUTS.corpus.label + '"><span class="ls-fx-input-label ls-math" data-tex="' + INPUTS.corpus.tex + '">' + INPUTS.corpus.label + '</span><b>' + INPUTS.corpus.tag + '</b><small>' + INPUTS.corpus.sub + '</small><span class="ls-fx-size"><i style="width:' + INPUTS.corpus.size + '%"></i></span><small class="ls-fx-size-label">' + INPUTS.corpus.sizeLabel + '</small></button>' +
          '<button type="button" class="ls-fx-input" data-fx-input="rawq" aria-label="' + INPUTS.rawq.label + '"><span class="ls-fx-input-label ls-math" data-tex="' + INPUTS.rawq.tex + '">' + INPUTS.rawq.label + '</span><b>' + INPUTS.rawq.tag + '</b><small>' + INPUTS.rawq.sub + '</small><span class="ls-fx-size"><i style="width:' + INPUTS.rawq.size + '%"></i></span><small class="ls-fx-size-label">' + INPUTS.rawq.sizeLabel + '</small></button>' +
          '<button type="button" class="ls-fx-input" data-fx-input="first" aria-label="' + INPUTS.first.label + '"><span class="ls-fx-input-label ls-math" data-tex="' + INPUTS.first.tex + '">' + INPUTS.first.label + '</span><b>' + INPUTS.first.tag + '</b><small>' + INPUTS.first.sub + '</small><span class="ls-fx-size"><i style="width:' + INPUTS.first.size + '%"></i></span><small class="ls-fx-size-label">' + INPUTS.first.sizeLabel + '</small></button>' +
          '<button type="button" class="ls-fx-input" data-fx-input="second" aria-label="' + INPUTS.second.label + '"><span class="ls-fx-input-label ls-math" data-tex="' + INPUTS.second.tex + '">' + INPUTS.second.label + '</span><b>' + INPUTS.second.tag + '</b><small>' + INPUTS.second.sub + '</small><span class="ls-fx-size"><i style="width:' + INPUTS.second.size + '%"></i></span><small class="ls-fx-size-label">' + INPUTS.second.sizeLabel + '</small></button>' +
        '</div>' +
        '<span class="ls-fx-link" aria-hidden="true">→</span>' +
        '<div class="ls-fx-core" aria-hidden="true">' +
          '<span class="ls-fx-core-ring"></span>' +
          '<span class="ls-fx-core-node"><b class="ls-math" data-tex="f_{\\theta}(x)">f<sub>θ</sub>(x)</b><small>Transformer</small></span>' +
          '<span class="ls-fx-core-caption">' + (DE ? "θ = Gewichte" : "θ = weights") + '</span>' +
        '</div>' +
        '<span class="ls-fx-link" aria-hidden="true">→</span>' +
        '<div class="ls-fx-output">' +
          '<div class="ls-fx-output-head"><span>' + (DE ? "P(nächstes Token)" : "P(next token)") + '</span><b class="ls-fx-active-label ls-math" data-tex="' + INPUTS.corpus.tex + '">' + INPUTS.corpus.label + '</b></div>' +
          '<div class="ls-fx-start"><span>' + (DE ? "Anfang" : "start") + '</span><span class="ls-fx-startbars"><i><b data-fx-start></b></i><i><b data-fx-start></b></i><i><b data-fx-start></b></i></span><small>' + (DE ? "was zuerst rauskommt" : "what comes out first") + '</small></div>' +
          '<div class="ls-bs-fx-prompt"></div>' +
          '<div class="ls-fx-sample"></div>' +
          '<div class="ls-bs-fx-cands"></div>' +
          '<p class="ls-bs-fx-note"></p>' +
          '<div class="ls-fx-summary" hidden><b>Fine-tuning</b><span><i>1</i>' + (DE ? "Fakten: Paris, Rom" : "facts: Paris, Rome") + '</span><span><i>2</i>' + (DE ? "Gespräch: direkte Antworten" : "conversation: direct answers") + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="ls-fx-loop"><span>' + (DE ? "Vergleich mit dem nächsten Token in den Daten" : "compare with the next token in the data") + '</span><i>→</i><b>Nudge</b><span>' + (DE ? "θ = Gewichte: gilt für alle Beispiele" : "θ = weights: applies to all examples") + '</span></div>' +
      '<div class="ls-bs-fx-bar"><button type="button" class="ls-btn ls-bs-fx-nudge">' + (DE ? "Nudge (Gewichte anpassen)" : "Nudge (adjust weights)") + '</button><span class="ls-bs-fx-readout" aria-live="polite"></span></div>';
    root.appendChild(el);
    var inputs = el.querySelectorAll("[data-fx-input]");
    var promptEl = el.querySelector(".ls-bs-fx-prompt");
    var noteEl = el.querySelector(".ls-bs-fx-note");
    var sampleEl = el.querySelector(".ls-fx-sample");
    var candsEl = el.querySelector(".ls-bs-fx-cands");
    var startBars = el.querySelectorAll("[data-fx-start]");
    var activeLabel = el.querySelector(".ls-fx-active-label");
    var summaryEl = el.querySelector(".ls-fx-summary");
    var readout = el.querySelector(".ls-bs-fx-readout");
    var btn = el.querySelector(".ls-bs-fx-nudge");
    var active = "corpus";
    var step = 0;
    var bars = [], pcts = [];
    var jitterTimer = 0, autoTimers = [];
    function stopJitter() { if (jitterTimer) { clearInterval(jitterTimer); jitterTimer = 0; } }
    function stopAuto() { autoTimers.forEach(function (t) { clearTimeout(t); }); autoTimers = []; }
    function typeset(node) { if (api.typeset) { try { api.typeset(node || el); } catch (e) {} } }
    function renderStart() {
      var vals = INPUTS[active].levels[0];
      for (var i = 0; i < startBars.length; i++) startBars[i].style.height = (vals[i] || 0) + "%";
    }
    function renderCandidates() {
      var data = INPUTS[active];
      candsEl.innerHTML = data.cands.map(function (c) {
        return '<div class="ls-bs-fx-cand ' + c.cls + '"><span>' + c.name + '</span><i><b data-fx-bar></b></i><em data-fx-pct>0 %</em><small>' + c.status + '</small></div>';
      }).join("");
      bars = candsEl.querySelectorAll("[data-fx-bar]");
      pcts = candsEl.querySelectorAll("[data-fx-pct]");
    }
    function renderJitter() {
      var target = INPUTS[active].targetIdx;
      var vals = [0.2, 0.2, 0.2];
      vals[target] = 98.6 + Math.random() * 0.7;
      vals[(target + 1) % 3] = 0.5 + Math.random() * 0.5;
      vals[(target + 2) % 3] = 0.1 + Math.random() * 0.3;
      for (var i = 0; i < bars.length; i++) {
        bars[i].style.width = vals[i] + "%";
        if (pcts[i]) pcts[i].textContent = vals[i].toFixed(1) + " %";
      }
    }
    function startJitter() { stopJitter(); renderJitter(); jitterTimer = setInterval(renderJitter, 240); }
    function renderSummary() {
      if (!summaryEl) return;
      summaryEl.hidden = !(visited.first && visited.second);
    }
    function render() {
      stopJitter();
      var data = INPUTS[active];
      var vals = data.levels[step] || data.levels[data.levels.length - 1];
      for (var i = 0; i < bars.length; i++) {
        bars[i].style.width = vals[i] + "%";
        if (pcts[i]) pcts[i].textContent = vals[i] + " %";
      }
      if (readout) readout.textContent = step === 0
        ? (DE ? "Nudge 0 / 6: die Verteilung ist noch unsicher." : "Nudge 0 / 6: the distribution is still uncertain.")
        : step < 6
          ? (DE ? "Nudge " + step + " / 6: „" + data.target + "“ wird wahrscheinlicher." : "Nudge " + step + " / 6: “" + data.target + "” becomes more likely.")
          : (DE ? "99 %: „" + data.target + "“ ist fast sicher; die Werte fluktuieren leicht." : "99 %: “" + data.target + "” is almost certain; the values fluctuate slightly.");
      if (btn) btn.disabled = step >= data.levels.length - 1;
      if (step >= data.levels.length - 1) startJitter();
    }
    function setActive(name) {
      if (!INPUTS[name]) return;
      stopAuto();
      active = name;
      visited[name] = true;
      inputs.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-fx-input") === name); });
      var data = INPUTS[name];
      promptEl.textContent = data.prompt;
      sampleEl.textContent = data.sample;
      noteEl.textContent = data.note;
      activeLabel.setAttribute("data-tex", data.tex);
      activeLabel.textContent = data.label;
      typeset(activeLabel);
      step = data.startStep;
      renderCandidates();
      renderStart();
      render();
      renderSummary();
    }
    inputs.forEach(function (b) {
      b.addEventListener("click", function () { setActive(b.getAttribute("data-fx-input")); });
    });
    function manualNudge() { stopAuto(); if (step < INPUTS[active].levels.length - 1) { step++; render(); } }
    if (btn) btn.addEventListener("click", manualNudge);
    typeset(el);
    setActive("corpus");
    var autoStart = INPUTS.corpus.startStep;
    autoTimers.push(setTimeout(function () { if (step === autoStart) { step++; render(); } }, 700));
    autoTimers.push(setTimeout(function () { if (step === autoStart + 1) { step++; render(); } }, 1400));
    return {
      update: function () {},
      next: function () {
        stopAuto();
        var idx = ORDER.indexOf(active);
        if (idx >= 0 && idx < ORDER.length - 1) { setActive(ORDER[idx + 1]); return true; }
        return false;
      },
      prev: function () { return false; },
      hasNext: function () { return ORDER.indexOf(active) < ORDER.length - 1; },
      hasPrev: function () { return false; },
      resize: function () {},
      destroy: function () { stopJitter(); stopAuto(); el.remove(); }
    };
  }
  core.register("fx", fxScene);
})();
