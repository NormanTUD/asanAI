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
          { name: "Paris", cls: "is-good", status: DE ? "richtig, aber am Anfang unsicher" : "right, but uncertain at first" },
          { name: "Hund", cls: "is-bad", status: DE ? "zufälliges Wort" : "random word" },
          { name: "Wolke", cls: "is-bad", status: DE ? "zufälliges Wort" : "random word" }
        ],
        sample: DE ? "Daten: Milliarden von Paaren (x, nächstes Token). Beispiel: „Die Hauptstadt von Frankreich ist Paris.“" : "Data: billions of pairs (x, next token). Example: “The capital of France is Paris.”",
        note: DE ? "Pretraining: Im Rohkorpus steht „Die Hauptstadt von Frankreich ist Paris“. Am Anfang sind die Alternativen zufällige Wörter; erst mit den Daten wird „Paris“ wahrscheinlich." : "Pretraining: the raw corpus contains “The capital of France is Paris”. At first the alternatives are random words; only with the data does “Paris” become likely."
      },
      rawq: {
        label: DE ? "f_θ(Frage an Rohdaten)" : "f_θ(question on raw data)",
        tex: DE ? "f_{\\theta}(\\text{Frage an Rohdaten})" : "f_{\\theta}(\\text{question on raw data})",
        tag: DE ? "vor dem Fine-tuning" : "before fine-tuning",
        sub: DE ? "Wikipedia-Stil" : "Wikipedia style",
        size: 8,
        sizeLabel: DE ? "1 Frage" : "1 question",
        prompt: DE ? "Was ist die Hauptstadt von Frankreich? ___" : "What is the capital of France? ___",
        target: "Die",
        targetIdx: 0,
        startStep: 0,
        levels: [[55, 30, 15], [50, 38, 12], [42, 48, 10], [30, 62, 8], [18, 76, 6], [8, 90, 2], [1, 98.5, 0.5]],
        cands: [
          { name: DE ? "Die" : "The", cls: "is-good", status: DE ? "nächster Token im Wikipedia-Stil" : "next token, Wikipedia style" },
          { name: "Paris", cls: "is-mid", status: DE ? "richtige Antwort, aber nicht der nächste Token" : "right answer, but not the next token" },
          { name: "Frankreich", cls: "is-bad", status: DE ? "passt nicht" : "does not fit" }
        ],
        sample: DE ? "Vollständige Fortsetzung: „Die Hauptstadt von Frankreich ist Paris.“ Wir betrachten nur das nächste Token." : "Full continuation: “The capital of France is Paris.” We only look at the next token.",
        note: DE ? "Vor dem Fine-tuning setzt das Modell die Frage wie einen Wikipedia-Artikel fort: „Die Hauptstadt von Frankreich ist Paris.“ Es antwortet nicht direkt; das nächste Token ist „Die“." : "Before fine-tuning the model continues the question like a Wikipedia article: “The capital of France is Paris.” It does not answer directly; the next token is “The”."
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
          { name: "Paris", cls: "is-good", status: DE ? "Antwort aus dem Datensatz" : "answer in the dataset" },
          { name: "Rom", cls: "is-mid", status: DE ? "aus dem Pretraining, falsches Land" : "from pretraining, wrong country" },
          { name: "Frankreich", cls: "is-bad", status: DE ? "kein Antwort-Token" : "not an answer token" }
        ],
        sample: DE ? "x: „Was ist die Hauptstadt von Frankreich?“  ·  y: „Paris“" : "x: “What is the capital of France?”  ·  y: “Paris”",
        note: DE ? "Fine-tuning-Beispiel 1: Im Datensatz steht das Frage-Antwort-Paar. Das Modell lernt die Form Frage → Antwort und nutzt das Wissen aus dem Pretraining." : "Fine-tuning example 1: the dataset contains the question-answer pair. The model learns the question → answer form and uses knowledge from pretraining.",
        dataset: true
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
          { name: "Rom", cls: "is-good", status: DE ? "Antwort aus dem Datensatz" : "answer in the dataset" },
          { name: "Paris", cls: "is-mid", status: DE ? "aus dem Pretraining, falsches Land" : "from pretraining, wrong country" },
          { name: "Italien", cls: "is-bad", status: DE ? "kein Antwort-Token" : "not an answer token" }
        ],
        sample: DE ? "x: „Was ist die Hauptstadt von Italien?“  ·  y: „Rom“" : "x: “What is the capital of Italy?”  ·  y: “Rome”",
        note: DE ? "Fine-tuning-Beispiel 2: Dieselbe Frageform, anderes Land. Das Wissen „Rom“ steht schon aus dem Pretraining in den Gewichten; das Modell lernt, es als direkte Antwort zu nutzen." : "Fine-tuning example 2: the same question form, another country. The knowledge “Rome” is already in the weights from pretraining; the model learns to use it as a direct answer.",
        dataset: true
      }
    };
    var ORDER = ["corpus", "rawq", "first", "second"];
    var visited = {};
    el.innerHTML =
      '<div class="ls-fx-hero" data-tip="' + (DE ? "Die Architektur als Funktion: Eingabe rein, Verteilung über das nächste Token raus." : "The architecture as a function: input in, distribution over the next token out.") + '">' +
        '<span class="ls-fx-kicker">' + (DE ? "Die Architektur als Funktion" : "The architecture as a function") + '</span>' +
        '<h2>f<sub>θ</sub>(x) ' + (DE ? "lernt aus Daten" : "learns from data") + '</h2>' +
        '<p>' + (DE ? "Text rein, eine Verteilung über das nächste Token raus. Der Trainingsschritt gilt für alle Beispiele; die Form der Funktion bleibt gleich." : "Text in, a distribution over the next token out. The training step applies to all examples; the form of the function stays the same.") + '</p>' +
      '</div>' +
      '<div class="ls-fx-batch" data-tip="' + (DE ? "Der Trainingsschritt passt die Gewichte θ an; er wirkt auf alle Beispiele zugleich." : "The training step adjusts the weights θ; it affects all examples at once.") + '"><b>' + (DE ? "alle Beispiele" : "all examples") + '</b><span class="ls-fx-batch-dots"><i></i><i></i><i></i><i></i><i></i><i class="is-on"></i><i></i><i></i><i></i><i></i><i></i><i></i></span><small>' + (DE ? "jedes Paar (x, nächstes Token) zieht θ ein wenig" : "every pair (x, next token) pulls θ a little") + '</small></div>' +
      '<div class="ls-fx-stage">' +
        '<div class="ls-fx-inputs" role="group" aria-label="' + (DE ? "Eingaben für f" : "Inputs to f") + '">' +
          '<button type="button" class="ls-fx-input is-on" data-fx-input="corpus" data-tip="' + (DE ? "Pretraining-Beispiel: aus Milliarden von Paaren wird das nächste Token wahrscheinlich." : "Pretraining example: across billions of pairs the next token becomes likely.") + '" aria-label="' + INPUTS.corpus.label + '"><span class="ls-fx-input-label ls-math ls-math--inline" data-tex-display="false" data-tex="' + INPUTS.corpus.tex + '">' + INPUTS.corpus.label + '</span><b>' + INPUTS.corpus.tag + '</b><small>' + INPUTS.corpus.sub + '</small><span class="ls-fx-size"><i style="width:' + INPUTS.corpus.size + '%"></i></span><small class="ls-fx-size-label">' + INPUTS.corpus.sizeLabel + '</small></button>' +
          '<button type="button" class="ls-fx-input" data-fx-input="rawq" data-tip="' + (DE ? "Rohdaten-Frage vor dem Fine-tuning: das Modell setzt wie Wikipedia fort statt zu antworten." : "Raw-data question before fine-tuning: the model continues like Wikipedia instead of answering.") + '" aria-label="' + INPUTS.rawq.label + '"><span class="ls-fx-input-label ls-math ls-math--inline" data-tex-display="false" data-tex="' + INPUTS.rawq.tex + '">' + INPUTS.rawq.label + '</span><b>' + INPUTS.rawq.tag + '</b><small>' + INPUTS.rawq.sub + '</small><span class="ls-fx-size"><i style="width:' + INPUTS.rawq.size + '%"></i></span><small class="ls-fx-size-label">' + INPUTS.rawq.sizeLabel + '</small></button>' +
          '<button type="button" class="ls-fx-input" data-fx-input="first" data-tip="' + (DE ? "Erstes Fine-tuning-Beispiel: ein Frage-Antwort-Paar, das die Form trainiert." : "First fine-tuning example: a question-answer pair that trains the form.") + '" aria-label="' + INPUTS.first.label + '"><span class="ls-fx-input-label ls-math ls-math--inline" data-tex-display="false" data-tex="' + INPUTS.first.tex + '">' + INPUTS.first.label + '</span><b>' + INPUTS.first.tag + '</b><small>' + INPUTS.first.sub + '</small><span class="ls-fx-size"><i style="width:' + INPUTS.first.size + '%"></i></span><small class="ls-fx-size-label">' + INPUTS.first.sizeLabel + '</small></button>' +
          '<button type="button" class="ls-fx-input" data-fx-input="second" data-tip="' + (DE ? "Zweites Fine-tuning-Beispiel: gleiche Frageform, anderes Land." : "Second fine-tuning example: the same question form, another country.") + '" aria-label="' + INPUTS.second.label + '"><span class="ls-fx-input-label ls-math ls-math--inline" data-tex-display="false" data-tex="' + INPUTS.second.tex + '">' + INPUTS.second.label + '</span><b>' + INPUTS.second.tag + '</b><small>' + INPUTS.second.sub + '</small><span class="ls-fx-size"><i style="width:' + INPUTS.second.size + '%"></i></span><small class="ls-fx-size-label">' + INPUTS.second.sizeLabel + '</small></button>' +
        '</div>' +
        '<div class="ls-fx-x" data-tip="' + (DE ? "x ist der Satz, den das Modell liest. Aus ihm berechnet f_θ die Verteilung." : "x is the sentence the model reads. f_θ computes the distribution from it.") + '"><span class="ls-fx-x-label">x = ' + (DE ? "Text" : "text") + '</span><div class="ls-bs-fx-prompt"></div><small>' + (DE ? "so geht der Satz in f_θ" : "the sentence enters f_θ") + '</small></div>' +
        '<span class="ls-fx-link ls-fx-link--a" aria-hidden="true">→</span>' +
        '<div class="ls-fx-core" data-tip="' + (DE ? "Der Transformer wendet f mit den Gewichten θ auf die Eingabe an." : "The transformer applies f with the weights θ to the input.") + '" aria-hidden="true">' +
          '<span class="ls-fx-core-ring"></span>' +
          '<span class="ls-fx-core-node"><b class="ls-math ls-math--inline" data-tex-display="false" data-tex="f_{\\theta}(x)">f<sub>θ</sub>(x)</b><small>Transformer</small></span>' +
          '<span class="ls-fx-core-caption">' + (DE ? "θ = Gewichte" : "θ = weights") + '</span>' +
        '</div>' +
        '<span class="ls-fx-link ls-fx-link--b" aria-hidden="true">→</span>' +
        '<div class="ls-fx-output" data-tip="' + (DE ? "Ausgabe: eine Verteilung über das nächste Token mit den drei stärksten Kandidaten." : "Output: a distribution over the next token with the three strongest candidates.") + '">' +
          '<div class="ls-fx-output-head"><span>' + (DE ? "P(nächstes Token)" : "P(next token)") + '</span><b class="ls-fx-active-label ls-math ls-math--inline" data-tex-display="false" data-tex="' + INPUTS.corpus.tex + '">' + INPUTS.corpus.label + '</b></div>' +
          '<div class="ls-fx-start" data-tip="' + (DE ? "Startverteilung: was das Modell vor dem Trainingsschritt ausgibt." : "Starting distribution: what the model outputs before the training step.") + '"><span>' + (DE ? "Anfang" : "start") + '</span><span class="ls-fx-startbars"><i><b data-fx-start></b></i><i><b data-fx-start></b></i><i><b data-fx-start></b></i></span><small>' + (DE ? "was zuerst rauskommt" : "what comes out first") + '</small></div>' +
          '<div class="ls-fx-sample"></div>' +
          '<div class="ls-fx-dataset" data-tip="' + (DE ? "Die beiden Frage-Antwort-Paare, aus denen das Fine-tuning die Antwortform lernt." : "The two question-answer pairs from which fine-tuning learns the answer form.") + '" hidden><b>' + (DE ? "Fine-tuning-Datensatz" : "fine-tuning dataset") + '</b><span data-fx-pair="first">' + (DE ? "Was ist die Hauptstadt von Frankreich?" : "What is the capital of France?") + ' → Paris</span><span data-fx-pair="second">' + (DE ? "Was ist die Hauptstadt von Italien?" : "What is the capital of Italy?") + ' → Rom</span><small>' + (DE ? "Das Wissen kommt aus dem Pretraining; Fine-tuning lernt die Frageform." : "The knowledge comes from pretraining; fine-tuning learns the question form.") + '</small></div>' +
          '<div class="ls-bs-fx-cands"></div>' +
          '<p class="ls-bs-fx-note"></p>' +
          '<div class="ls-fx-summary" hidden><b>Fine-tuning</b><span><i>1</i>' + (DE ? "Fakten: Paris, Rom" : "facts: Paris, Rome") + '</span><span><i>2</i>' + (DE ? "Gespräch: direkte Antworten" : "conversation: direct answers") + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="ls-fx-two" data-tip="' + (DE ? "Pretraining und Fine-tuning ergänzen sich: Wissen plus Antwortform." : "Pretraining and fine-tuning complement each other: knowledge plus answer form.") + '"><span><b>1</b>' + (DE ? "Pretraining: Milliarden Tokens → Muster, Sprache, Fakten" : "pretraining: billions of tokens → patterns, language, facts") + '</span><i>+</i><span><b>2</b>' + (DE ? "Fine-tuning: Frage-Antwort-Paare → Form" : "fine-tuning: question-answer pairs → form") + '</span><em>=</em><strong>' + (DE ? "beide nötig" : "both needed") + '</strong></div>' +
      '<div class="ls-fx-loop" data-tip="' + (DE ? "Der Trainingsschritt vergleicht die Ausgabe mit dem echten nächsten Token und zieht die Gewichte nach." : "The training step compares the output with the true next token and pulls the weights.") + '"><span>' + (DE ? "Vergleich mit dem nächsten Token in den Daten" : "compare with the next token in the data") + '</span><i>→</i><b>' + (DE ? "Trainingsschritt" : "Training step") + '</b><span>' + (DE ? "θ = Gewichte: gilt für alle Beispiele" : "θ = weights: applies to all examples") + '</span></div>' +
      '<div class="ls-bs-fx-bar"><button type="button" class="ls-btn ls-bs-fx-nudge" data-tip="' + (DE ? "Einen Trainingsschritt ausführen und die Verteilung in Richtung Ziel-Token verschieben." : "Run one training step and shift the distribution toward the target token.") + '">' + (DE ? "Trainingsschritt" : "Training step") + '</button><span class="ls-bs-fx-readout" aria-live="polite"></span></div>';
    root.appendChild(el);
    var inputs = el.querySelectorAll("[data-fx-input]");
    var promptEl = el.querySelector(".ls-bs-fx-prompt");
    var noteEl = el.querySelector(".ls-bs-fx-note");
    var sampleEl = el.querySelector(".ls-fx-sample");
    var candsEl = el.querySelector(".ls-bs-fx-cands");
    var startBars = el.querySelectorAll("[data-fx-start]");
    var activeLabel = el.querySelector(".ls-fx-active-label");
    var summaryEl = el.querySelector(".ls-fx-summary");
    var datasetEl = el.querySelector(".ls-fx-dataset");
    var outputEl = el.querySelector(".ls-fx-output");
    var headEl = el.querySelector(".ls-fx-output-head");
    var readout = el.querySelector(".ls-bs-fx-readout");
    var btn = el.querySelector(".ls-bs-fx-nudge");
    var active = "corpus";
    var step = 0;
    var bars = [], pcts = [];
    var autoTimers = [];
    var lastMeasureWidth = 0;
    function stopAuto() { autoTimers.forEach(function (t) { clearTimeout(t); }); autoTimers = []; }
    function typeset(node) { if (api.typeset) { try { api.typeset(node || el); } catch (e) {} } }
    function renderStart() {
      var vals = INPUTS[active].levels[0];
      for (var i = 0; i < startBars.length; i++) startBars[i].style.height = (vals[i] || 0) + "%";
    }
    function renderCandidates() {
      var data = INPUTS[active];
      candsEl.innerHTML = data.cands.map(function (c) {
        return '<div class="ls-bs-fx-cand ' + c.cls + '" data-tip="' + (DE ? "Kandidat für das nächste Token; der Balken zeigt seine Wahrscheinlichkeit." : "Candidate for the next token; the bar shows its probability.") + '"><span>' + c.name + '</span><i><b data-fx-bar></b></i><em data-fx-pct>0 %</em><small>' + c.status + '</small></div>';
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
    function renderSummary() {
      if (!summaryEl) return;
      summaryEl.hidden = !(visited.first && visited.second);
    }
    function renderDataset() {
      if (!datasetEl) return;
      datasetEl.hidden = !INPUTS[active].dataset;
      if (datasetEl.hidden) return;
      datasetEl.querySelectorAll("[data-fx-pair]").forEach(function (row) {
        row.classList.toggle("is-on", row.getAttribute("data-fx-pair") === active);
      });
    }
    function render() {
      var data = INPUTS[active];
      var vals = data.levels[step] || data.levels[data.levels.length - 1];
      for (var i = 0; i < bars.length; i++) {
        bars[i].style.width = vals[i] + "%";
        if (pcts[i]) pcts[i].textContent = vals[i] + " %";
      }
      if (readout) readout.textContent = step === 0
        ? (DE ? "Trainingsschritt 0 / 6: die Verteilung ist noch unsicher." : "Training step 0 / 6: the distribution is still uncertain.")
        : step < 6
          ? (DE ? "Trainingsschritt " + step + " / 6: „" + data.target + "“ wird wahrscheinlicher." : "Training step " + step + " / 6: “" + data.target + "” becomes more likely.")
          : (DE ? "99 %: „" + data.target + "“ ist fast sicher. Der Trainingsschritt zeigt die Fluktuation." : "99 %: “" + data.target + "” is almost certain. The training step shows the fluctuation.");
      if (btn) btn.disabled = false;
    }
    function paintInput(name) {
      active = name;
      var data = INPUTS[name];
      inputs.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-fx-input") === name); });
      promptEl.textContent = data.prompt;
      sampleEl.textContent = data.sample;
      noteEl.textContent = data.note;
      renderDataset();
      activeLabel.removeAttribute("data-tex-rendered");
      activeLabel.setAttribute("data-tex", data.tex);
      activeLabel.textContent = data.label;
      typeset(activeLabel.parentNode);
      renderCandidates();
      renderStart();
      render();
      renderSummary();
    }
    function setActive(name) {
      if (!INPUTS[name]) return;
      stopAuto();
      visited[name] = true;
      step = INPUTS[name].startStep;
      paintInput(name);
    }
    /* Measure every example once and reserve the tallest slot for each variable
       part, so switching examples or revealing the fine-tuning dataset never
       changes the slide height or pushes the rows below it. */
    function measureOutputMax() {
      if (!outputEl) return;
      var width = Math.round(outputEl.getBoundingClientRect().width);
      if (!width || width === lastMeasureWidth) return;
      var savedActive = active, savedStep = step, savedVisited = visited;
      var parts = [headEl, promptEl, sampleEl, noteEl, candsEl, summaryEl];
      outputEl.style.minHeight = "";
      parts.forEach(function (node) { if (node) node.style.minHeight = ""; });
      visited = {};
      var partMax = [0, 0, 0, 0, 0, 0];
      ORDER.forEach(function (name) {
        paintInput(name);
        parts.forEach(function (node, i) {
          if (node) partMax[i] = Math.max(partMax[i], node.offsetHeight);
        });
      });
      parts.forEach(function (node, i) {
        if (node && partMax[i] > 0) node.style.minHeight = partMax[i] + "px";
      });
      var max = 0;
      ORDER.forEach(function (name) {
        paintInput(name);
        max = Math.max(max, outputEl.offsetHeight);
      });
      visited = savedVisited;
      active = savedActive;
      step = savedStep;
      paintInput(savedActive);
      if (max > 0) outputEl.style.minHeight = Math.ceil(max) + "px";
      lastMeasureWidth = width;
    }
    inputs.forEach(function (b) {
      b.addEventListener("click", function () { setActive(b.getAttribute("data-fx-input")); });
    });
    function manualNudge() {
      stopAuto();
      if (step < INPUTS[active].levels.length - 1) { step++; render(); }
      else renderJitter();
    }
    if (btn) btn.addEventListener("click", manualNudge);
    typeset(el);
    function startAuto() {
      var autoStart = INPUTS.corpus.startStep;
      autoTimers.push(setTimeout(function () { if (step === autoStart) { step++; render(); } }, 700));
      autoTimers.push(setTimeout(function () { if (step === autoStart + 1) { step++; render(); } }, 1400));
    }
    function reset() {
      stopAuto();
      visited = {};
      setActive("corpus");
      startAuto();
    }
    measureOutputMax();
    setActive("corpus");
    startAuto();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { lastMeasureWidth = 0; measureOutputMax(); }).catch(function () {});
    }
    return {
      update: function (state, meta) {
        if (meta && (meta.revisit || meta.subDir === 0)) return;
        reset();
      },
      next: function () {
        stopAuto();
        if (step < INPUTS[active].levels.length - 1) { step++; render(); return true; }
        var idx = ORDER.indexOf(active);
        if (idx >= 0 && idx < ORDER.length - 1) { setActive(ORDER[idx + 1]); return true; }
        return false;
      },
      prev: function () { return false; },
      hasNext: function () { return step < INPUTS[active].levels.length - 1 || ORDER.indexOf(active) < ORDER.length - 1; },
      hasPrev: function () { return false; },
      resize: function () { measureOutputMax(); },
      destroy: function () { stopAuto(); el.remove(); }
    };
  }
  core.register("fx", fxScene);
})();
