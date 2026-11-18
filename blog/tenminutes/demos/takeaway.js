(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function takeawayScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-tw-scene";
    el.innerHTML =
      '<div class="ls-tw-lead"><span>' + (DE ? "Der rote Faden" : "The through-line") + '</span><b>' + (DE ? "Daten werden zu Wahrscheinlichkeiten über das nächste Token." : "Data becomes probabilities over the next token.") + '</b></div>' +
      '<div class="ls-tw-flow" aria-label="' + (DE ? "Kette vom Datum zum nächsten Token" : "Chain from data to next token") + '">' +
        '<span>Daten</span><i>→</i><span>Tokens</span><i>→</i><span>Embeddings</span><i>→</i><span>Attention</span><i>→</i><span>nächstes Token</span>' +
      '</div>' +
      '<div class="ls-tw-grid">' +
        '<article class="ls-tw-card ls-tw-card--can"><span>' + (DE ? "Was es kann" : "What it can do") + '</span><b>' + (DE ? "Muster fortsetzen" : "Continue patterns") + '</b><p>' + (DE ? "Es schreibt flüssig, übersetzt und kombiniert Bekanntes, weil es gelernt hat, wie Texte wahrscheinlich weitergehen." : "It writes fluently, translates, and combines known material because it has learned how texts probably continue.") + '</p><em>' + (DE ? "Beispiel: Ein Aufsatz entsteht, weil Aufsätze so fortgesetzt werden." : "Example: An essay appears because essays continue this way.") + '</em></article>' +
        '<article class="ls-tw-card ls-tw-card--fail"><span>' + (DE ? "Wo es irrt" : "Where it fails") + '</span><b>' + (DE ? "Plausibel ist nicht wahr" : "Plausible is not true") + '</b><p>' + (DE ? "Es optimiert nicht Wahrheit, sondern Anschlussfähigkeit. Deshalb erfindet es Quellen, die an dieser Stelle perfekt passen." : "It optimises for continuation, not truth. That is why it invents sources that fit the spot perfectly.") + '</p><em>' + (DE ? "Beispiel: Die erfundene Quelle klingt echt, weil sie echt klingt." : "Example: The invented source sounds real because it sounds real.") + '</em></article>' +
        '<article class="ls-tw-card ls-tw-card--open"><span>' + (DE ? "Was offen bleibt" : "What stays open") + '</span><b>' + (DE ? "Funktion ist nicht Erleben" : "Function is not experience") + '</b><p>' + (DE ? "Verhalten, Bericht und globale Verfügbarkeit sind prüfbar. Ob damit Erleben verbunden ist, zeigt kein Demo." : "Behaviour, report, and global availability can be tested. No demo shows whether experience comes with them.") + '</p><em>' + (DE ? "Beispiel: Der J-Space zeigt Zugang, nicht Qualia." : "Example: The J-space shows access, not qualia.") + '</em></article>' +
      '</div>' +
      '<div class="ls-tw-bottom"><div><b>' + (DE ? "Dein Spickzettel" : "Your cheat sheet") + '</b><p>' + (DE ? "Welche Daten? Welche Aufgabe? Welche Evidenz? Wer haftet?" : "Which data? Which task? Which evidence? Who is accountable?") + '</p></div><p class="ls-tw-final">' + (DE ? "Prompt, RAG, Fine-Tuning und Agenten sind verschiedene Griffe an derselben Maschine. Das Urteil bleibt bei dir." : "Prompting, RAG, fine-tuning, and agents are different handles on the same machine. The judgement stays with you.") + '</p></div>';
    root.appendChild(el);
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }
  core.register("takeaway", takeawayScene);
})();
