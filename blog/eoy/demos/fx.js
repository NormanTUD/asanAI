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
        label: DE ? "f(Daten)" : "f(data)",
        tag: DE ? "Pretraining" : "Pretraining",
        sub: DE ? "Vervollständigen" : "completion",
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
        note: DE ? "Pretraining: Im Rohkorpus steht „Die Hauptstadt von Frankreich ist Paris“. Die Vervollständigung funktioniert, weil das Modell diese Fortsetzung gesehen hat." : "Pretraining: the raw corpus contains “The capital of France is Paris”. Completion works because the model has seen this continuation."
      },
      rawq: {
        label: DE ? "f(Frage an Rohdaten)" : "f(question on raw data)",
        tag: DE ? "vor dem Fine-tuning" : "before fine-tuning",
        sub: DE ? "Wikipedia-Stil" : "Wikipedia style",
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
        note: DE ? "Vor dem Fine-tuning setzt das Modell die Frage wie einen Wikipedia-Artikel fort: „Die Hauptstadt von Frankreich ist Paris.“ Es antwortet nicht direkt." : "Before fine-tuning the model continues the question like a Wikipedia article: “The capital of France is Paris.” It does not answer directly."
      },
      first: {
        label: DE ? "f(1. Trainingsdatensatz)" : "f(first training example)",
        tag: DE ? "Fine-tuning" : "Fine-tuning",
        sub: DE ? "Frage → Antwort" : "question → answer",
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
        note: DE ? "Fine-tuning-Beispiel 1: Im Datensatz steht das Frage-Antwort-Paar. Das Modell antwortet jetzt direkt mit „Paris“." : "Fine-tuning example 1: the dataset contains the question-answer pair. The model now answers directly with “Paris”."
      },
      second: {
        label: DE ? "f(2. Trainingsdatensatz)" : "f(second training example)",
        tag: DE ? "Fine-tuning" : "Fine-tuning",
        sub: DE ? "zweite Frage" : "second question",
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
        note: DE ? "Fine-tuning-Beispiel 2: Im Datensatz steht die zweite Frage-Antwort-Paarung. Dieselbe Funktion, anderes Land, direkte Antwort." : "Fine-tuning example 2: the dataset contains the second question-answer pair. The same function, another country, a direct answer."
      }
    };
    el.innerHTML =
      '<div class="ls-fx-hero">' +
        '<span class="ls-fx-kicker">' + (DE ? "Die Architektur als Funktion" : "The architecture as a function") + '</span>' +
        '<h2>f(x) ' + (DE ? "lernt aus Daten" : "learns from data") + '</h2>' +
        '<p>' + (DE ? "Daten rein, nächste Token-Wahrscheinlichkeit raus. Jeder Vergleich mit dem nächsten Token nudged dieselben Gewichte." : "Data in, next-token probability out. Every comparison with the next token nudges the same weights.") + '</p>' +
      '</div>' +
      '<div class="ls-fx-stage">' +
        '<div class="ls-fx-inputs" role="group" aria-label="' + (DE ? "Eingaben für f" : "Inputs to f") + '">' +
          '<button type="button" class="ls-fx-input is-on" data-fx-input="corpus"><span class="ls-fx-input-label">' + INPUTS.corpus.label + '</span><b>' + INPUTS.corpus.tag + '</b><small>' + INPUTS.corpus.sub + '</small></button>' +
          '<button type="button" class="ls-fx-input" data-fx-input="rawq"><span class="ls-fx-input-label">' + INPUTS.rawq.label + '</span><b>' + INPUTS.rawq.tag + '</b><small>' + INPUTS.rawq.sub + '</small></button>' +
          '<button type="button" class="ls-fx-input" data-fx-input="first"><span class="ls-fx-input-label">' + INPUTS.first.label + '</span><b>' + INPUTS.first.tag + '</b><small>' + INPUTS.first.sub + '</small></button>' +
          '<button type="button" class="ls-fx-input" data-fx-input="second"><span class="ls-fx-input-label">' + INPUTS.second.label + '</span><b>' + INPUTS.second.tag + '</b><small>' + INPUTS.second.sub + '</small></button>' +
        '</div>' +
        '<span class="ls-fx-link" aria-hidden="true">→</span>' +
        '<div class="ls-fx-core" aria-hidden="true">' +
          '<span class="ls-fx-core-ring"></span>' +
          '<span class="ls-fx-core-node"><b>f(x)</b><small>Transformer</small></span>' +
          '<span class="ls-fx-core-caption">' + (DE ? "dieselbe Funktion" : "the same function") + '</span>' +
        '</div>' +
        '<span class="ls-fx-link" aria-hidden="true">→</span>' +
        '<div class="ls-fx-output">' +
          '<div class="ls-fx-output-head"><span>' + (DE ? "P(nächstes Token)" : "P(next token)") + '</span><b class="ls-fx-active-label">' + INPUTS.corpus.label + '</b></div>' +
          '<div class="ls-bs-fx-prompt"></div>' +
          '<div class="ls-bs-fx-cands"></div>' +
          '<p class="ls-bs-fx-note"></p>' +
        '</div>' +
      '</div>' +
      '<div class="ls-fx-loop"><span>' + (DE ? "Vergleich mit dem nächsten Token in den Daten" : "compare with the next token in the data") + '</span><i>→</i><b>Nudge</b><span>' + (DE ? "Gewichte ein wenig in die richtige Richtung" : "move the weights a little in the right direction") + '</span></div>' +
      '<div class="ls-bs-fx-bar"><button type="button" class="ls-btn ls-bs-fx-nudge">' + (DE ? "Nudge (Gewichte anpassen)" : "Nudge (adjust weights)") + '</button><span class="ls-bs-fx-readout" aria-live="polite"></span></div>';
    root.appendChild(el);
    var inputs = el.querySelectorAll("[data-fx-input]");
    var promptEl = el.querySelector(".ls-bs-fx-prompt");
    var noteEl = el.querySelector(".ls-bs-fx-note");
    var candsEl = el.querySelector(".ls-bs-fx-cands");
    var activeLabel = el.querySelector(".ls-fx-active-label");
    var readout = el.querySelector(".ls-bs-fx-readout");
    var btn = el.querySelector(".ls-bs-fx-nudge");
    var active = "corpus";
    var step = 0;
    var bars = [], pcts = [];
    var jitterTimer = 0, autoTimers = [];
    function stopJitter() { if (jitterTimer) { clearInterval(jitterTimer); jitterTimer = 0; } }
    function stopAuto() { autoTimers.forEach(function (t) { clearTimeout(t); }); autoTimers = []; }
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
      inputs.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-fx-input") === name); });
      promptEl.textContent = INPUTS[name].prompt;
      noteEl.textContent = INPUTS[name].note;
      activeLabel.textContent = INPUTS[name].label;
      step = INPUTS[name].startStep;
      renderCandidates();
      render();
    }
    inputs.forEach(function (b) {
      b.addEventListener("click", function () { setActive(b.getAttribute("data-fx-input")); });
    });
    function manualNudge() { stopAuto(); if (step < INPUTS[active].levels.length - 1) { step++; render(); } }
    if (btn) btn.addEventListener("click", manualNudge);
    setActive("corpus");
    var autoStart = INPUTS.corpus.startStep;
    autoTimers.push(setTimeout(function () { if (step === autoStart) { step++; render(); } }, 700));
    autoTimers.push(setTimeout(function () { if (step === autoStart + 1) { step++; render(); } }, 1400));
    return {
      update: function () {},
      next: function () { stopAuto(); if (step < INPUTS[active].levels.length - 1) { step++; render(); return true; } return false; },
      prev: function () { return false; },
      hasNext: function () { return step < INPUTS[active].levels.length - 1; },
      hasPrev: function () { return false; },
      resize: function () {},
      destroy: function () { stopJitter(); stopAuto(); el.remove(); }
    };
  }
  core.register("fx", fxScene);
})();
