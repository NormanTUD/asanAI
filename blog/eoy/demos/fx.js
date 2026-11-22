(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function fxScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-fx-scene";
    el.innerHTML =
      '<div class="ls-bs-fx" data-fx>' +
        '<div class="ls-bs-fx-head"><b>' + (DE ? "Die Architektur ist eine Funktion" : "The architecture is a function") + '</b><span>' + (DE ? "Daten rein, nächste Token-Wahrscheinlichkeit raus." : "Data in, next-token probability out.") + '</span></div>' +
        '<div class="ls-bs-fx-flow">' +
          '<span class="ls-bs-fx-node"><b>x</b><small>' + (DE ? "Daten" : "data") + '</small></span><i>→</i>' +
          '<span class="ls-bs-fx-node is-main"><b>f(x)</b><small>Transformer</small></span><i>→</i>' +
          '<span class="ls-bs-fx-node"><b>P</b><small>' + (DE ? "nächstes Token" : "next token") + '</small></span>' +
        '</div>' +
        '<div class="ls-bs-fx-loop">01 Input · 02 ' + (DE ? "Vorhersage" : "prediction") + ' · 03 ' + (DE ? "Vergleich mit dem nächsten Token in den Daten" : "compare with the next token in the data") + ' · 04 <b>Nudge</b>: ' + (DE ? "Gewichte ein wenig in die richtige Richtung" : "nudge the weights a little in the right direction") + '</div>' +
        '<div class="ls-bs-fx-stages">' +
          '<div class="ls-bs-fx-stage"><span>Pretraining</span><b>f(' + (DE ? "fast das ganze Internet" : "almost the whole internet") + ')</b><p>' + (DE ? "Der gewaltige Datensatz liefert Milliarden von nächsten Tokens. Jeder Vergleich nudged die Gewichte." : "The huge dataset supplies billions of next tokens. Every comparison nudges the weights.") + '</p></div>' +
          '<div class="ls-bs-fx-stage"><span>Fine-tuning</span><b>f(' + (DE ? "kleine Menge spezifischer Fragen" : "small set of specific questions") + ')</b><p>' + (DE ? "Wenige, gezielte Beispiele nudged dieselben Gewichte in Richtung hilfreicher Antworten." : "A few targeted examples nudge the same weights toward helpful answers.") + '</p></div>' +
        '</div>' +
        '<div class="ls-bs-fx-example">' +
          '<div class="ls-bs-fx-prompt">' + (DE ? "Die Katze sitzt auf der " : "The cat sits on the ") + '<b>___</b></div>' +
          '<div class="ls-bs-fx-cands">' +
            '<div class="ls-bs-fx-cand is-good"><span>' + (DE ? "Matte" : "mat") + '</span><i><b data-fx-bar></b></i><em data-fx-pct>45 %</em><small>' + (DE ? "in den Daten" : "in the data") + '</small></div>' +
            '<div class="ls-bs-fx-cand is-mid"><span>' + (DE ? "Heizung" : "heater") + '</span><i><b data-fx-bar></b></i><em data-fx-pct>35 %</em><small>' + (DE ? "plausibel, nicht in diesem Beispiel" : "plausible, not in this example") + '</small></div>' +
            '<div class="ls-bs-fx-cand is-bad"><span>' + (DE ? "Gleichung" : "equation") + '</span><i><b data-fx-bar></b></i><em data-fx-pct>8 %</em><small>' + (DE ? "passt nicht" : "does not fit") + '</small></div>' +
          '</div>' +
          '<p class="ls-bs-fx-note">' + (DE ? "In den Daten steht „Die Katze sitzt auf der Matte“. Das Netz bekommt „Die Katze sitzt auf der“ und soll „Matte“ vorhersagen. Jeder Nudge macht „Matte“ wahrscheinlicher. „Heizung“ ist auch plausibel, war in diesem Beispiel aber nicht der nächste Token; „Gleichung“ passt semantisch nicht und kommt in den Daten nicht vor." : "The data says “The cat sits on the mat”. The network gets “The cat sits on the” and should predict “mat”. Every nudge makes “mat” more likely. “Heater” is also plausible, but was not the next token in this example; “equation” does not fit semantically and is not in the data.") + '</p>' +
        '</div>' +
        '<div class="ls-bs-fx-bar"><button type="button" class="ls-btn ls-btn--tiny ls-bs-fx-nudge">' + (DE ? "Nudge (Gewichte anpassen)" : "Nudge (adjust weights)") + '</button><span class="ls-bs-fx-readout" aria-live="polite"></span></div>' +
      '</div>';
    root.appendChild(el);
    var bars = el.querySelectorAll("[data-fx-bar]");
    var pcts = el.querySelectorAll("[data-fx-pct]");
    var readout = el.querySelector(".ls-bs-fx-readout");
    var btn = el.querySelector(".ls-bs-fx-nudge");
    var step = 0;
    // HARD RULE: the slide nudges twice on its own, the reader can continue to
    // 99 %, and at the top the percentages fluctuate slightly. Do not freeze
    // at 82 % or disable the button before 99 %.
    var values = [[45, 40, 15], [65, 27, 8], [82, 14, 4], [90, 8, 2], [95, 4, 1], [98, 1.5, 0.5], [99, 0.8, 0.2]];
    var jitterTimer = 0;
    var autoTimers = [];
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
    function startJitter() {
      stopJitter();
      renderJitter();
      jitterTimer = setInterval(renderJitter, 240);
    }
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
    function manualNudge() {
      stopAuto();
      if (step < values.length - 1) { step++; render(); }
    }
    if (btn) btn.addEventListener("click", manualNudge);
    // Two automatic nudges make the mechanism visible without a click.
    autoTimers.push(setTimeout(function () { if (step === 0) { step = 1; render(); } }, 700));
    autoTimers.push(setTimeout(function () { if (step === 1) { step = 2; render(); } }, 1400));
    render();
    return {
      update: function () {},
      next: function () {
        stopAuto();
        if (step < values.length - 1) { step++; render(); return true; }
        return false;
      },
      prev: function () { return false; },
      hasNext: function () { return step < values.length - 1; },
      hasPrev: function () { return false; },
      resize: function () {},
      destroy: function () { stopJitter(); stopAuto(); el.remove(); }
    };
  }
  core.register("fx", fxScene);
})();
