(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function hallucinationTypesScene(root, api) {
    var DE = api.lang === "de";
    var TYPES = DE ? [
      {
        id: "fact", label: "Falsche Fakten", color: "lilac",
        question: "An welchem Fluss liegt Berlin?",
        answer: "An der Elbe.",
        why: "Das Modell setzt ein häufiges Muster fort. Die Aussage klingt ruhig und bestimmt, ist aber geografisch falsch.",
        check: "Die Antwort widerspricht einer einfachen, überprüfbaren Tatsache.",
        fix: "Quelle prüfen, RAG nutzen, Zitat verlangen.",
        source: "Ji et al. (2023)"
      },
      {
        id: "citation", label: "Erfundene Quellen", color: "gold",
        question: "Nenne eine Quelle für diese Behauptung.",
        answer: "Smith & Weber (2018), Journal of Memory and Language 102, 44–61. DOI 10.12345/jml.2018.044.",
        why: "Die Form stimmt: Autoren, Jahr, Journal, Seiten, DOI. Die Quelle existiert aber nicht. Das Modell hat eine Zitationsform gelernt, keine Bibliothek.",
        check: "DOI auflösen; Titel suchen und Autoren, Journal und Jahr gegenprüfen.",
        fix: "Nur bereitgestellte Quellen zitieren; Link-Check erzwingen.",
        source: "Ji et al. (2023)"
      },
      {
        id: "intrinsic", label: "Intrinsic", color: "sky",
        question: "Quelle: „Das Treffen war 2019.“ Fasse die Quelle zusammen.",
        answer: "Das Treffen war 2021.",
        why: "Die Quelle sagt 2019. Die Antwort widerspricht der gegebenen Quelle direkt; die Zusammenfassung ist nicht faithful.",
        check: "Steht die Aussage so in der Quelle? Nein.",
        fix: "Faithfulness-Check, Zitat aus der Quelle verlangen.",
        source: "Maynez et al. (2020)"
      },
      {
        id: "extrinsic", label: "Extrinsic", color: "green",
        question: "Quelle: „Das Team gewann 2022.“ Fasse die Quelle zusammen.",
        answer: "Das Team gewann 2022 in Berlin mit 5:0.",
        why: "Die Quelle sagt nur, dass das Team 2022 gewann. Ort und Ergebnis sind ergänzt und nicht gedeckt.",
        check: "Welche Teile stehen wirklich in der Quelle? Nur das Jahr.",
        fix: "Attribution: jede Ergänzung braucht eine Quelle.",
        source: "Maynez et al. (2020)"
      },
      {
        id: "context", label: "Kontext ignoriert", color: "blue",
        question: "Lies den Kontext: Der Preis ist 42 €. Wie hoch ist der Preis?",
        answer: "43 €.",
        why: "Der Kontext enthält die Antwort. Das Modell folgt stattdessen einem gelernten Muster oder einer alten Erinnerung.",
        check: "Die Zahl steht anders im Kontext. Das ist ein Input-Konflikt.",
        fix: "Kontext zuerst, wörtlich zitieren, Antwort daraus ableiten.",
        source: "Huang et al. (2023)"
      },
      {
        id: "outdated", label: "Veraltet", color: "gold",
        question: "Wie viele Menschen leben in der Stadt?",
        answer: "8 Millionen.",
        why: "Die Zahl war einmal richtig. Das Modell hat keinen eingebauten Kalender; Training endet zu einem Stichtag.",
        check: "Gibt es ein Datum? Ist die Zahl noch aktuell?",
        fix: "Retrieval mit Datum, Quelle mit Stand nennen.",
        source: "Huang et al. (2023)"
      },
      {
        id: "entity", label: "Entität vertauscht", color: "lilac",
        question: "Wo hängt die Mona Lisa?",
        answer: "Im Prado in Madrid.",
        why: "Das Modell vertauscht zwei bekannte Museen. Die Form der Antwort ist plausibel, die Entität ist falsch.",
        check: "Name, Ort und Beziehung einzeln prüfen.",
        fix: "Entitäten extrahieren und gegen eine Quelle abgleichen.",
        source: "Ji et al. (2023)"
      },
      {
        id: "negation", label: "Negation", color: "blue",
        question: "Was bedeutet „nicht glücklich“?",
        answer: "Traurig.",
        why: "Negation ist keine saubere Umkehrung. Im gelernten Raum bleibt „nicht glücklich“ oft näher an „glücklich“ als an „traurig“.",
        check: "Wird die Verneinung logisch sauber behandelt?",
        fix: "Logische Schritte separat prüfen; nicht raten lassen.",
        source: "Ji et al. (2023)"
      },
      {
        id: "sampling", label: "Sampling", color: "green",
        question: "Ergänze: „Berlin liegt an der …“",
        answer: "Elbe.",
        why: "Zufall im Sampling kann ein unwahrscheinliches, aber flüssiges Token wählen. Danach baut das Modell plausibel darauf weiter.",
        check: "Wiederholt sich die Antwort bei niedriger Temperatur?",
        fix: "Temperatur senken, mehrere Antworten vergleichen, Selbstkonsistenz.",
        source: "Ji et al. (2023)"
      }
    ] : [
      {
        id: "fact", label: "False facts", color: "lilac",
        question: "Which river is Berlin on?",
        answer: "The Elbe.",
        why: "The model continues a frequent pattern. The statement sounds calm and certain but is geographically false.",
        check: "The answer contradicts a simple, checkable fact.",
        fix: "Check the source, use RAG, require a citation.",
        source: "Ji et al. (2023)"
      },
      {
        id: "citation", label: "Fabricated citations", color: "gold",
        question: "Give a source for this claim.",
        answer: "Smith & Weber (2018), Journal of Memory and Language 102, 44–61. DOI 10.12345/jml.2018.044.",
        why: "The form is right: authors, year, journal, pages, DOI. The source does not exist. The model learned the shape of a citation, not a library.",
        check: "Resolve the DOI; search the title and check authors, journal, and year.",
        fix: "Cite only provided sources; enforce link checks.",
        source: "Ji et al. (2023)"
      },
      {
        id: "intrinsic", label: "Intrinsic", color: "sky",
        question: "Source: “The meeting was in 2019.” Summarise the source.",
        answer: "The meeting was in 2021.",
        why: "The source says 2019. The answer directly contradicts the given source; the summary is not faithful.",
        check: "Does the source actually say this? No.",
        fix: "Faithfulness check, require a quote from the source.",
        source: "Maynez et al. (2020)"
      },
      {
        id: "extrinsic", label: "Extrinsic", color: "green",
        question: "Source: “The team won in 2022.” Summarise the source.",
        answer: "The team won in Berlin in 2022 with 5–0.",
        why: "The source only says the team won in 2022. Place and score are added and unsupported.",
        check: "Which parts are really in the source? Only the year.",
        fix: "Attribution: every addition needs a source.",
        source: "Maynez et al. (2020)"
      },
      {
        id: "context", label: "Context ignored", color: "blue",
        question: "Read the context: the price is €42. What is the price?",
        answer: "€43.",
        why: "The context contains the answer. The model follows a learned pattern or an old memory instead.",
        check: "The number differs from the context. That is an input conflict.",
        fix: "Context first, quote it, derive the answer from it.",
        source: "Huang et al. (2023)"
      },
      {
        id: "outdated", label: "Outdated", color: "gold",
        question: "How many people live in the city?",
        answer: "8 million.",
        why: "The number was once right. The model has no built-in calendar; training ends at a cut-off date.",
        check: "Is there a date? Is the number still current?",
        fix: "Retrieval with a date, name the source and its date.",
        source: "Huang et al. (2023)"
      },
      {
        id: "entity", label: "Entity swap", color: "lilac",
        question: "Where is the Mona Lisa?",
        answer: "In the Prado in Madrid.",
        why: "The model swaps two famous museums. The shape is plausible; the entity is wrong.",
        check: "Check name, place, and relation separately.",
        fix: "Extract entities and compare them against a source.",
        source: "Ji et al. (2023)"
      },
      {
        id: "negation", label: "Negation", color: "blue",
        question: "What does “not happy” mean?",
        answer: "Sad.",
        why: "Negation is not a clean reversal. In the learned space, “not happy” often stays closer to “happy” than to “sad”.",
        check: "Is the negation handled logically?",
        fix: "Check logical steps separately; do not let the model guess.",
        source: "Ji et al. (2023)"
      },
      {
        id: "sampling", label: "Sampling", color: "green",
        question: "Complete: “Berlin lies on the …”",
        answer: "Elbe.",
        why: "Randomness in sampling can pick an unlikely but fluent token. The model then builds plausibly on it.",
        check: "Does the answer repeat at a lower temperature?",
        fix: "Lower the temperature, compare several answers, use self-consistency.",
        source: "Ji et al. (2023)"
      }
    ];
    var selected = 0;
    var el = document.createElement("div");
    el.className = "ls-htl-scene";
    el.innerHTML = '<div class="ls-htl-chips" role="tablist"></div>' +
      '<div class="ls-htl-grid">' +
        '<article class="ls-htl-card"><div class="ls-htl-kicker"></div><h4 class="ls-htl-title"></h4><div class="ls-htl-example"></div><p class="ls-htl-why"></p></article>' +
        '<aside class="ls-htl-side"><div><b>' + (DE ? "Woran erkennen?" : "How to spot it") + '</b><p class="ls-htl-check"></p></div><div><b>' + (DE ? "Gegenmittel" : "Countermeasure") + '</b><p class="ls-htl-fix"></p></div><div><b>' + (DE ? "Quelle" : "Source") + '</b><p class="ls-htl-src"></p></div></aside>' +
      '</div>';
    root.appendChild(el);
    var chips = el.querySelector(".ls-htl-chips");
    var card = el.querySelector(".ls-htl-card");
    var kicker = el.querySelector(".ls-htl-kicker");
    var title = el.querySelector(".ls-htl-title");
    var example = el.querySelector(".ls-htl-example");
    var why = el.querySelector(".ls-htl-why");
    var check = el.querySelector(".ls-htl-check");
    var fix = el.querySelector(".ls-htl-fix");
    var src = el.querySelector(".ls-htl-src");
    function renderChips() {
      chips.innerHTML = TYPES.map(function (t, i) {
        return '<button type="button" class="ls-chip' + (i === selected ? ' is-on' : '') + '" data-htl="' + i + '" role="tab" aria-selected="' + (i === selected ? 'true' : 'false') + '">' + api.esc(t.label) + '</button>';
      }).join("");
      chips.querySelectorAll("[data-htl]").forEach(function (b) {
        b.addEventListener("click", function () { selected = parseInt(b.getAttribute("data-htl"), 10); render(); });
      });
    }
    function render() {
      var t = TYPES[selected];
      card.className = "ls-htl-card is-" + t.color;
      kicker.textContent = DE ? "Typ " + (selected + 1) + " / " + TYPES.length : "Type " + (selected + 1) + " / " + TYPES.length;
      title.textContent = t.label;
      example.innerHTML = '<span class="ls-htl-q">' + (DE ? "Frage" : "Question") + '</span><p>' + api.esc(t.question) + '</p><span class="ls-htl-a">' + (DE ? "Antwort" : "Answer") + '</span><p>' + api.esc(t.answer) + '</p>';
      why.textContent = t.why;
      check.textContent = t.check;
      fix.textContent = t.fix;
      src.textContent = t.source;
      renderChips();
    }
    render();
    return {
      update: function () {},
      next: function () {
        if (selected < TYPES.length - 1) { selected++; render(); return true; }
        return false;
      },
      prev: function () {
        if (selected > 0) { selected--; render(); return true; }
        return false;
      },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }
  core.register("hallucinationtypes", hallucinationTypesScene);
})();
