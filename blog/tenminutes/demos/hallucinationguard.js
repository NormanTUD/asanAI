(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function hallucinationGuardScene(root, api) {
    var DE = api.lang === "de";
    var rag = false, cot = false, verify = false;
    var el = document.createElement("div");
    el.className = "ls-hg-scene";
    el.innerHTML =
      '<div class="ls-hg-question"><span>' + (DE ? "Frage" : "Question") + '</span><b>' + (DE ? "Wie hoch ist der Eiffelturm mit Antenne?" : "How tall is the Eiffel Tower with its antenna?") + '</b></div>' +
      '<div class="ls-hg-toggles" role="group">' +
        '<button type="button" class="ls-chip" data-hg="rag" aria-pressed="false">' + (DE ? "Quellen (RAG)" : "Sources (RAG)") + '</button>' +
        '<button type="button" class="ls-chip" data-hg="cot" aria-pressed="false">' + (DE ? "Schrittweise" : "Step by step") + '</button>' +
        '<button type="button" class="ls-chip" data-hg="verify" aria-pressed="false">' + (DE ? "Gegenprüfung" : "Verification") + '</button>' +
      '</div>' +
      '<div class="ls-hg-grid">' +
        '<section class="ls-hg-panel"><div class="ls-hg-head"><b>' + (DE ? "Kontext" : "Context") + '</b><span>' + (DE ? "was das Modell sieht" : "what the model sees") + '</span></div><div class="ls-hg-source"></div></section>' +
        '<section class="ls-hg-panel"><div class="ls-hg-head"><b>' + (DE ? "Antwort" : "Answer") + '</b><span>' + (DE ? "mit oder ohne Deckung" : "with or without support") + '</span></div><div class="ls-hg-answer"></div><div class="ls-hg-cite"></div></section>' +
      '</div>' +
      '<div class="ls-hg-steps"></div>' +
      '<div class="ls-hg-risk"><span>' + (DE ? "Halluzinationsrisiko" : "hallucination risk") + '</span><div class="ls-hg-bar"><i></i></div><b class="ls-hg-risk-val"></b></div>' +
      '<p class="ls-hg-readout"></p>';
    root.appendChild(el);
    var sourceEl = el.querySelector(".ls-hg-source");
    var answerEl = el.querySelector(".ls-hg-answer");
    var citeEl = el.querySelector(".ls-hg-cite");
    var stepsEl = el.querySelector(".ls-hg-steps");
    var riskEl = el.querySelector(".ls-hg-risk");
    var riskBar = el.querySelector(".ls-hg-bar i");
    var riskVal = el.querySelector(".ls-hg-risk-val");
    var readout = el.querySelector(".ls-hg-readout");
    var btns = Array.prototype.slice.call(el.querySelectorAll("[data-hg]"));
    function render() {
      btns.forEach(function (b) {
        var on = b.getAttribute("data-hg") === "rag" ? rag : b.getAttribute("data-hg") === "cot" ? cot : verify;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      sourceEl.innerHTML = rag
        ? '<article class="ls-hg-doc"><div class="ls-hg-doc-head"><b>S1</b><span>' + (DE ? "vertrauenswürdig" : "trusted") + '</span></div><p><b>Wikipedia</b> · ' + (DE ? "Eiffelturm" : "Eiffel Tower") + '</p><p>' + (DE ? "Der Eiffelturm ist mit Antenne 330 Meter hoch." : "The Eiffel Tower is 330 metres tall including its antenna.") + '</p></article>'
        : '<div class="ls-hg-empty">' + (DE ? "Keine Quelle im Kontext. Das Modell antwortet aus dem Gedächtnis." : "No source in the context. The model answers from memory.") + '</div>';
      var answer, cite, risk, htmlSteps = "";
      if (verify && !rag) {
        answer = DE ? "Keine Quelle im Kontext. Ich rate nicht." : "No source in the context. I will not guess.";
        cite = DE ? "Keine Deckung · Eingeständnis statt Erfindung" : "No support · admission instead of invention";
        risk = 12;
      } else if (rag) {
        answer = DE ? "Der Eiffelturm ist mit Antenne 330 m hoch. [S1]" : "The Eiffel Tower is 330 m tall with its antenna. [S1]";
        cite = "S1 · " + (DE ? "Wikipedia: Eiffelturm" : "Wikipedia: Eiffel Tower");
        risk = 18;
      } else {
        answer = DE ? "Der Eiffelturm ist 300 m hoch." : "The Eiffel Tower is 300 m tall.";
        cite = DE ? "Keine Quelle · aus dem Gedächtnis" : "No source · from memory";
        risk = 86;
      }
      if (cot) {
        htmlSteps += '<div class="ls-hg-step"><b>1</b><span>' + (DE ? "Frage: Wie hoch ist der Eiffelturm mit Antenne?" : "Question: how tall is the Eiffel Tower with its antenna?") + '</span></div>';
        htmlSteps += '<div class="ls-hg-step"><b>2</b><span>' + (rag ? (DE ? "S1 sagt: 330 m mit Antenne." : "S1 says: 330 m with antenna.") : (DE ? "Ich erinnere mich an 300 m; keine Quelle im Kontext." : "I recall 300 m; no source in the context.")) + '</span></div>';
        htmlSteps += '<div class="ls-hg-step"><b>3</b><span>' + (DE ? "Schluss: " : "Conclusion: ") + answer + '</span></div>';
      }
      if (verify) {
        htmlSteps += '<div class="ls-hg-step is-check"><b>✓</b><span>' + (rag ? (DE ? "Gegenprüfung: Steht 330 in S1? Ja. Antwort bleibt gedeckt." : "Check: does S1 say 330? Yes. The answer stays grounded.") : (DE ? "Gegenprüfung: Keine Quelle. Also keine Behauptung." : "Check: no source. So no claim.")) + '</span></div>';
      }
      stepsEl.innerHTML = htmlSteps;
      stepsEl.hidden = !cot && !verify;
      answerEl.textContent = answer;
      citeEl.textContent = cite;
      riskVal.textContent = "";
      riskVal.hidden = true;
      riskEl.setAttribute("aria-label", (DE ? "Halluzinationsrisiko: " : "Hallucination risk: ") + (risk < 30 ? (DE ? "niedrig" : "low") : risk < 60 ? (DE ? "mittel" : "medium") : (DE ? "hoch" : "high")));
      riskBar.style.width = risk + "%";
      riskBar.style.background = risk < 30 ? "var(--ls-green)" : risk < 60 ? "var(--ls-gold)" : "var(--ls-lilac)";
      riskEl.className = "ls-hg-risk " + (risk < 30 ? "is-low" : risk < 60 ? "is-mid" : "is-high");
      readout.textContent = !rag && !cot && !verify
        ? (DE ? "Ohne Quelle, ohne Zwischenschritte und ohne Prüfung bleibt die Antwort eine selbstsichere Vermutung." : "Without a source, steps, or verification, the answer is a confident guess.")
        : rag && verify
          ? (DE ? "Quelle plus Gegenprüfung: Die Antwort ist gedeckt oder das Modell sagt, dass die Deckung fehlt." : "Source plus verification: the answer is grounded, or the model says support is missing.")
          : cot && !rag
            ? (DE ? "Schrittweise allein macht die Lücke sichtbar, aber es fehlt weiterhin die Quelle." : "Step by step alone makes the gap visible, but the source is still missing.")
            : (DE ? "Die Schalter verändern, was das Modell im Kontext hat und wie es prüft." : "The toggles change what the model has in context and how it checks.");
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var key = b.getAttribute("data-hg");
        if (key === "rag") rag = !rag;
        else if (key === "cot") cot = !cot;
        else verify = !verify;
        render();
      });
    });
    render();
    return {
      update: function () {},
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }
  core.register("hallucinationguard", hallucinationGuardScene);
})();
