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
        sub: DE ? "das ganze Korpus" : "the whole corpus",
        prompt: DE ? "Die Katze sitzt auf der ___" : "The cat sits on the ___",
        note: DE ? "Im Korpus stehen Milliarden solcher Fortsetzungen. Jede wird zum Vergleich und zum Nudge." : "The corpus holds billions of such continuations. Each one becomes a comparison and a nudge."
      },
      first: {
        label: DE ? "f(1. Trainingsdatensatz)" : "f(first training example)",
        tag: DE ? "Fine-tuning" : "Fine-tuning",
        sub: DE ? "Beispiel 1" : "example 1",
        prompt: DE ? "Die Katze sitzt auf der ___" : "The cat sits on the ___",
        note: DE ? "Im ersten Trainingsdatensatz steht „Matte“. Der Vergleich macht „Matte“ wahrscheinlicher." : "The first training example says “mat”. The comparison makes “mat” more likely."
      },
      second: {
        label: DE ? "f(2. Trainingsdatensatz)" : "f(second training example)",
        tag: DE ? "Fine-tuning" : "Fine-tuning",
        sub: DE ? "Beispiel 2" : "example 2",
        prompt: DE ? "Die Katze schläft auf der ___" : "The cat sleeps on the ___",
        note: DE ? "Im zweiten Trainingsdatensatz steht „Matte“. Dieselbe Funktion, ein neues Beispiel, derselbe Nudge." : "The second training example says “mat”. The same function, a new example, the same nudge."
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
          '<button type="button" class="ls-fx-input" data-fx-input="first"><span class="ls-fx-input-label">' + INPUTS.first.label + '</span><b>' + INPUTS.first.tag + '</b><small>' + INPUTS.first.sub + '</small></button>' +
          '<button type="button" class="ls-fx-input" data-fx-input="second"><span class="ls-fx-input-label">' + INPUTS.second.label + '</span><b>' + INPUTS.second.tag + '</b><small>' + INPUTS.second.sub + '</small></button>' +
        '</div>' +
        '<div class="ls-fx-core" aria-hidden="true">' +
          '<span class="ls-fx-core-ring"></span>' +
          '<span class="ls-fx-core-node"><b>f(x)</b><small>Transformer</small></span>' +
        '</div>' +
        '<div class="ls-fx-output">' +
          '<div class="ls-fx-output-head"><span>' + (DE ? "Ausgabe" : "Output") + '</span><b class="ls-fx-active-label">' + INPUTS.corpus.label + '</b></div>' +
          '<div class="ls-bs-fx-prompt">' + INPUTS.corpus.prompt + '</div>' +
          '<div class="ls-bs-fx-cands">' +
            '<div class="ls-bs-fx-cand is-good"><span>' + (DE ? "Matte" : "mat") + '</span><i><b data-fx-bar></b></i><em data-fx-pct>45 %</em><small>' + (DE ? "in den Daten" : "in the data") + '</small></div>' +
            '<div class="ls-bs-fx-cand is-mid"><span>' + (DE ? "Heizung" : "heater") + '</span><i><b data-fx-bar></b></i><em data-fx-pct>40 %</em><small>' + (DE ? "plausibel, nicht in diesem Beispiel" : "plausible, not in this example") + '</small></div>' +
            '<div class="ls-bs-fx-cand is-bad"><span>' + (DE ? "Gleichung" : "equation") + '</span><i><b data-fx-bar></b></i><em data-fx-pct>15 %</em><small>' + (DE ? "passt nicht" : "does not fit") + '</small></div>' +
          '</div>' +
          '<p class="ls-bs-fx-note">' + INPUTS.corpus.note + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="ls-fx-loop"><span>' + (DE ? "Vergleich mit dem nächsten Token in den Daten" : "compare with the next token in the data") + '</span><i>→</i><b>Nudge</b><span>' + (DE ? "Gewichte ein wenig in die richtige Richtung" : "move the weights a little in the right direction") + '</span></div>' +
      '<div class="ls-bs-fx-bar"><button type="button" class="ls-btn ls-bs-fx-nudge">' + (DE ? "Nudge (Gewichte anpassen)" : "Nudge (adjust weights)") + '</button><span class="ls-bs-fx-readout" aria-live="polite"></span></div>';
    root.appendChild(el);
    var inputs = el.querySelectorAll("[data-fx-input]");
    var prompt = el.querySelector(".ls-bs-fx-prompt");
    var note = el.querySelector(".ls-bs-fx-note");
    var activeLabel = el.querySelector(".ls-fx-active-label");
    var bars = el.querySelectorAll("[data-fx-bar]");
    var pcts = el.querySelectorAll("[data-fx-pct]");
    var readout = el.querySelector(".ls-bs-fx-readout");
    var btn = el.querySelector(".ls-bs-fx-nudge");
    var active = "corpus";
    var step = 0;
    var values = [[45, 40, 15], [65, 27, 8], [82, 14, 4], [90, 8, 2], [95, 4, 1], [98, 1.5, 0.5], [99, 0.8, 0.2]];
    var jitterTimer = 0, autoTimers = [];
    function stopJitter() { if (jitterTimer) { clearInterval(jitterTimer); jitterTimer = 0; } }
    function stopAuto() { autoTimers.forEach(function (t) { clearTimeout(t); }); autoTimers = []; }
    function renderJitter() {
      var m = 98.6 + Math.random() * 0.7;
      var h = 0.5 + Math.random() * 0.5;
      var g = 0.1 + Math.random() * 0.3;
      var vals = [m, h, g];
      for (var i = 0; i < bars.length; i++) {
        bars[i].style.width = vals[i] + "%";
        if (pcts[i]) pcts[i].textContent = vals[i].toFixed(1) + " %";
      }
    }
    function startJitter() { stopJitter(); renderJitter(); jitterTimer = setInterval(renderJitter, 240); }
    function render() {
      stopJitter();
      for (var i = 0; i < bars.length; i++) {
        bars[i].style.width = values[step][i] + "%";
        if (pcts[i]) pcts[i].textContent = values[step][i] + " %";
      }
      if (readout) readout.textContent = step === 0
        ? (DE ? "Nudge 0 / 6: die Verteilung ist noch unsicher." : "Nudge 0 / 6: the distribution is still uncertain.")
        : step < 6
          ? (DE ? "Nudge " + step + " / 6: „Matte“ wird wahrscheinlicher." : "Nudge " + step + " / 6: “mat” becomes more likely.")
          : (DE ? "99 %: „Matte“ ist fast sicher; die Werte fluktuieren leicht." : "99 %: “mat” is almost certain; the values fluctuate slightly.");
      if (btn) btn.disabled = step >= values.length - 1;
      if (step >= values.length - 1) startJitter();
    }
    function setActive(name) {
      if (!INPUTS[name]) return;
      active = name;
      inputs.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-fx-input") === name); });
      prompt.textContent = INPUTS[name].prompt;
      note.textContent = INPUTS[name].note;
      activeLabel.textContent = INPUTS[name].label;
    }
    inputs.forEach(function (b) {
      b.addEventListener("click", function () { setActive(b.getAttribute("data-fx-input")); });
    });
    function manualNudge() { stopAuto(); if (step < values.length - 1) { step++; render(); } }
    if (btn) btn.addEventListener("click", manualNudge);
    autoTimers.push(setTimeout(function () { if (step === 0) { step = 1; render(); } }, 700));
    autoTimers.push(setTimeout(function () { if (step === 1) { step = 2; render(); } }, 1400));
    render();
    return {
      update: function () {},
      next: function () { stopAuto(); if (step < values.length - 1) { step++; render(); return true; } return false; },
      prev: function () { return false; },
      hasNext: function () { return step < values.length - 1; },
      hasPrev: function () { return false; },
      resize: function () {},
      destroy: function () { stopJitter(); stopAuto(); el.remove(); }
    };
  }
  core.register("fx", fxScene);
})();
