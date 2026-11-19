(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function takeawayScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-tk-scene";
    el.innerHTML =
      '<div class="ls-tk-lead"><span>' + (DE ? "Der rote Faden" : "The through-line") + '</span><b>' + (DE ? "Drei Bewegungen, ein Mechanismus." : "Three moves, one mechanism.") + '</b></div>' +
      '<div class="ls-tk-grid">' +
        '<article class="ls-tk-card"><span>01</span><b>' + (DE ? "Zeichen werden Bedeutung" : "Signs become meaning") + '</b><p>' + (DE ? "Daten, Tokens, Embeddings, Position: Text wird zu Vektoren, Bedeutung wird Geometrie." : "Data, tokens, embeddings, position: text becomes vectors, meaning becomes geometry.") + '</p><em>' + (DE ? "Von den Kerben im Wolfsknochen über Gauß und Ceres bis zum Tokenizer." : "From notches in a wolf bone through Gauss and Ceres to the tokenizer.") + '</em></article>' +
        '<article class="ls-tk-card"><span>02</span><b>' + (DE ? "Bedeutung wird Kontext" : "Meaning becomes context") + '</b><p>' + (DE ? "Attention, FFN, Residual, Unembedding, Training: Der Kontext mischt, das Modell sagt das nächste Token voraus." : "Attention, FFN, residual, unembedding, training: context mixes, the model predicts the next token.") + '</p><em>' + (DE ? "Nicht eine Datenbank, sondern eine gelernte Funktion über Wahrscheinlichkeiten." : "Not a database, but a learned function over probabilities.") + '</em></article>' +
        '<article class="ls-tk-card"><span>03</span><b>' + (DE ? "Kontext wird Wirkung" : "Context becomes impact") + '</b><p>' + (DE ? "Weltmodell, Agenten, Halluzination, Macht, Bewusstsein: Aus Vorhersage wird Verhalten, aus Verhalten werden Fragen." : "World model, agents, hallucination, power, consciousness: prediction becomes behaviour, behaviour becomes questions.") + '</p><em>' + (DE ? "Ob es erlebt, bleibt offen. Was du daraus machst, bleibt deine Entscheidung." : "Whether it experiences anything stays open. What you make of it stays your decision.") + '</em></article>' +
      '</div>' +
      '<div class="ls-tk-bottom"><p><b>' + (DE ? "Zum Mitnehmen" : "Takeaway") + '</b> ' + (DE ? "Ein LLM ist kein Orakel und kein Beweis für Bewusstsein. Es ist eine gelernte Funktion, die aus Daten Wahrscheinlichkeiten über das nächste Token bildet. Das erklärt, was es kann, und warum es irrt." : "An LLM is not an oracle and not proof of consciousness. It is a learned function that turns data into probabilities over the next token. That explains what it can do and why it errs.") + '</p><p class="ls-tk-check">' + (DE ? "Prüffragen: Welche Daten? Welche Aufgabe? Welche Evidenz? Wer haftet?" : "Questions to ask: which data? Which task? Which evidence? Who is accountable?") + '</p></div>';
    root.appendChild(el);
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }
  core.register("takeaway", takeawayScene);
})();
