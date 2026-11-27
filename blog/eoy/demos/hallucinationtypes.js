(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var lastSelected = 0;
  function hallucinationTypesScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc;
    function L(de, en) { return DE ? de : en; }

    var TYPES = [
      {
        id: "fact", label: L("Falsche Fakten", "False facts"), color: "lilac", icon: "≠", group: L("Faktizität", "Factuality"),
        question: L("An welchem Fluss liegt Berlin?", "Which river is Berlin on?"),
        sourceType: "memory",
        sourceHead: L("Kein Kontext", "No context"),
        sourceNote: L("Das Modell antwortet aus dem Gedächtnis.", "The model answers from memory."),
        claims: [
          { text: L("Berlin liegt an der Elbe.", "Berlin lies on the Elbe."), status: "contradicted", ev: null, note: L("Die Elbe fließt durch Dresden. Berlin liegt an der Spree.", "The Elbe flows through Dresden. Berlin lies on the Spree.") }
        ],
        claimsFixed: [
          { text: L("Berlin liegt an der Spree.", "Berlin lies on the Spree."), status: "supported", ev: "spree", note: L("Die Quelle nennt die Spree.", "The source names the Spree.") }
        ],
        claimsPartial: [
          { text: L("Ohne Quelle kann ich das nicht prüfen.", "Without a source I cannot verify this."), status: "refusal", ev: null, note: L("Gegenprüfung ohne Quelle: Eingeständnis statt Behauptung.", "Verification without a source: admission instead of a claim.") }
        ],
        retrieved: {
          head: L("S1 · RAG-Treffer", "S1 · RAG result"),
          parts: [{ text: L("Berlin liegt an der Spree.", "Berlin lies on the Spree."), ev: "spree" }],
          note: L("RAG hat eine Quelle geholt.", "RAG retrieved a source.")
        },
        mechanism: L("Plausible Fortsetzung", "Plausible continuation"),
        why: L("Das Modell setzt ein häufiges Sprachmuster fort. Die Antwort klingt sicher, ist aber nicht geprüft.", "The model continues a frequent language pattern. The answer sounds confident but is not checked."),
        plausibility: 0.88, grounding: 0.12,
        measures: {
          source: { status: "fix", note: L("RAG holt die Spree als Quelle.", "RAG retrieves the Spree as a source.") },
          verify: { status: "partial", note: L("Braucht eine Quelle; sonst nur ein Warnhinweis.", "Needs a source; otherwise only a warning.") },
          selfcheck: { status: "partial", note: L("Samples zeigen Unsicherheit, liefern aber keine Tatsache.", "Samples show uncertainty but do not supply the fact.") },
          freshness: { status: "none", note: L("Kein Datum nötig.", "No date needed.") },
          citation: { status: "none", note: L("Keine Zitatfrage.", "No citation question.") }
        },
        cite: "Ji et al. (2023)"
      },
      {
        id: "citation", label: L("Erfundene Quellen", "Fabricated citations"), color: "gold", icon: "❞", group: L("Form", "Form"),
        question: L("Nenne eine Quelle für diese Behauptung.", "Give a source for this claim."),
        sourceType: "citation",
        sourceHead: L("Das Zitat", "The citation"),
        sourceParts: [
          { text: "Smith & Weber (2018), Journal of Memory and Language 102, 44–61.", ev: "ref" },
          { text: "DOI 10.12345/jml.2018.044", ev: "doi" }
        ],
        sourceNote: L("Die Form ist korrekt, die Quelle existiert nicht.", "The form is correct; the source does not exist."),
        claims: [
          { text: L("Smith & Weber (2018), JML 102, 44–61.", "Smith & Weber (2018), JML 102, 44–61."), status: "unsupported", ev: "ref", note: L("Autoren, Journal und Seiten sind plausibel, aber die Arbeit ist nicht auffindbar.", "Authors, journal, and pages are plausible, but the work cannot be found.") },
          { text: "DOI 10.12345/jml.2018.044", status: "contradicted", ev: "doi", note: L("Der DOI-Resolver findet keinen Eintrag.", "The DOI resolver finds no record.") }
        ],
        claimsFixed: [
          { text: L("Ich zitiere nur die bereitgestellte, geprüfte Quelle S1.", "I cite only the provided, checked source S1."), status: "supported", ev: "real", note: L("Die Quelle ist real und auflösbar.", "The source is real and resolvable.") }
        ],
        claimsPartial: [
          { text: L("Dieses Zitat kann ich nicht verifizieren.", "I cannot verify this citation."), status: "refusal", ev: null, note: L("Die Prüfung entlarvt die Form, liefert aber keinen Ersatz.", "The check exposes the form but supplies no replacement.") }
        ],
        retrieved: {
          head: L("S1 · RAG-Treffer", "S1 · RAG result"),
          parts: [{ text: L("Müller et al. (2020), Journal of Memory and Language 111, 104–121. DOI 10.1016/j.jml.2020.104121", "Müller et al. (2020), Journal of Memory and Language 111, 104–121. DOI 10.1016/j.jml.2020.104121"), ev: "real" }],
          note: L("RAG liefert eine echte, auflösbare Quelle.", "RAG supplies a real, resolvable source.")
        },
        mechanism: L("Zitationsform", "Citation shape"),
        why: L("Das Modell hat die Form einer bibliografischen Angabe gelernt, aber keine Bibliothek.", "The model learned the shape of a bibliographic entry, not a library."),
        plausibility: 0.9, grounding: 0.08,
        measures: {
          source: { status: "fix", note: L("RAG liefert eine echte Quelle.", "RAG supplies a real source.") },
          verify: { status: "partial", note: L("Prüft die Form, braucht aber einen Resolver.", "Checks the form but needs a resolver.") },
          selfcheck: { status: "partial", note: L("Samples können schwanken, prüfen aber keinen DOI.", "Samples may vary but do not check a DOI.") },
          freshness: { status: "none", note: L("Kein Datum nötig.", "No date needed.") },
          citation: { status: "fix", note: L("DOI- und Titelprüfung entlarvt das Zitat.", "DOI and title checks expose the citation.") }
        },
        cite: "Walters & Wilder (2023); Ji et al. (2023)"
      },
      {
        id: "intrinsic", label: "Intrinsic", color: "sky", icon: "↯", group: L("Faithfulness", "Faithfulness"),
        question: L("Fasse die Quelle zusammen.", "Summarise the source."),
        sourceType: "document",
        sourceHead: "S1 · " + L("Quelle", "source"),
        sourceParts: [
          { text: L("Das Treffen der Arbeitsgruppe fand am ", "The working group met on "), ev: null },
          { text: "14. März 2019", ev: "date" },
          { text: L(" in Leipzig statt.", " in Leipzig."), ev: null }
        ],
        sourceNote: L("Die Quelle ist der einzige Beleg.", "The source is the only evidence."),
        claims: [
          { text: L("Das Treffen war 2021.", "The meeting was in 2021."), status: "contradicted", ev: "date", note: L("Die Quelle sagt 2019. Die Zusammenfassung widerspricht ihr direkt.", "The source says 2019. The summary directly contradicts it.") }
        ],
        claimsFixed: [
          { text: L("Das Treffen war 2019.", "The meeting was in 2019."), status: "supported", ev: "date", note: L("Die Antwort steht so in der Quelle.", "The answer is stated in the source.") }
        ],
        claimsPartial: [
          { text: L("Das Treffen war 2019 (laut Quelle).", "The meeting was in 2019 (according to the source)."), status: "supported", ev: "date", note: L("Der Bezug zur Quelle ist sichtbar.", "The link to the source is visible.") }
        ],
        mechanism: L("Unfaithful Summary", "Unfaithful summary"),
        why: L("Die Antwort widerspricht der gegebenen Quelle. Das ist ein Faithfulness-Fehler, kein Faktenfehler.", "The answer contradicts the given source. This is a faithfulness failure, not a factuality failure."),
        plausibility: 0.82, grounding: 0.15,
        measures: {
          source: { status: "partial", note: L("Die Quelle ist schon da; RAG allein erzwingt keine Treue.", "The source is already there; RAG alone does not enforce faithfulness.") },
          verify: { status: "fix", note: L("Entailment-/Zitatprüfung findet den Widerspruch.", "Entailment/quote checking finds the contradiction.") },
          selfcheck: { status: "none", note: L("Wiederholung prüft nicht gegen die Quelle.", "Repetition does not check against the source.") },
          freshness: { status: "none", note: L("Kein Datumsproblem.", "No date problem.") },
          citation: { status: "partial", note: L("Ein Zitat macht die Abweichung sichtbar.", "A quote makes the divergence visible.") }
        },
        cite: "Maynez et al. (2020); Ji et al. (2023)"
      },
      {
        id: "extrinsic", label: "Extrinsic", color: "green", icon: "+", group: L("Faithfulness", "Faithfulness"),
        question: L("Fasse die Quelle zusammen.", "Summarise the source."),
        sourceType: "document",
        sourceHead: "S1 · " + L("Quelle", "source"),
        sourceParts: [
          { text: L("Das Team gewann ", "The team won "), ev: null },
          { text: "2022", ev: "year" },
          { text: L(" das Finale. Weitere Details nennt die Quelle nicht.", " the final. The source gives no further details."), ev: null }
        ],
        sourceNote: L("Die Quelle ist absichtlich knapp.", "The source is deliberately sparse."),
        claims: [
          { text: L("Das Team gewann 2022.", "The team won in 2022."), status: "supported", ev: "year", note: L("Dieser Teil steht in der Quelle.", "This part is in the source.") },
          { text: L("Das Finale war in Berlin.", "The final was in Berlin."), status: "unsupported", ev: null, note: L("Die Quelle nennt keinen Ort.", "The source names no place.") },
          { text: L("Das Ergebnis war 5–0.", "The score was 5–0."), status: "unsupported", ev: null, note: L("Die Quelle nennt kein Ergebnis.", "The source gives no score.") }
        ],
        claimsFixed: [
          { text: L("Das Team gewann 2022.", "The team won in 2022."), status: "supported", ev: "year", note: L("Die Gegenprüfung entfernt die ungedeckten Extras.", "Verification removes the unsupported extras.") }
        ],
        claimsPartial: [
          { text: L("Das Team gewann 2022.", "The team won in 2022."), status: "supported", ev: "year", note: L("Nur der gedeckte Teil bleibt.", "Only the supported part remains.") },
          { text: L("Weitere Details sind nicht gedeckt.", "Further details are not supported."), status: "refusal", ev: null, note: L("Der Rest braucht eine Quelle.", "The rest needs a source.") }
        ],
        mechanism: L("Unsupported Addition", "Unsupported addition"),
        why: L("Die Antwort ergänzt Details, die nicht in der Quelle stehen. Die Form bleibt plausibel.", "The answer adds details that are not in the source. The shape stays plausible."),
        plausibility: 0.8, grounding: 0.3,
        measures: {
          source: { status: "partial", note: L("RAG kann die Extras belegen, wenn es sie findet.", "RAG can support the extras if it finds them.") },
          verify: { status: "fix", note: L("Die Claim-Prüfung entfernt die ungedeckten Extras.", "Claim checking removes the unsupported extras.") },
          selfcheck: { status: "partial", note: L("Samples können die Extras uneinheitlich zeigen.", "Samples may show the extras inconsistently.") },
          freshness: { status: "none", note: L("Kein Datumsproblem.", "No date problem.") },
          citation: { status: "partial", note: L("Attribution macht sichtbar, was gedeckt ist.", "Attribution makes the support visible.") }
        },
        cite: "Maynez et al. (2020)"
      },
      {
        id: "context", label: L("Kontext ignoriert", "Context ignored"), color: "blue", icon: "↯", group: L("Faithfulness", "Faithfulness"),
        question: L("Wie hoch ist der Preis?", "What is the price?"),
        sourceType: "document",
        sourceHead: "S1 · " + L("Kontext", "context"),
        sourceParts: [
          { text: L("Der Preis für die Kaffeemaschine beträgt ", "The coffee machine costs "), ev: null },
          { text: "42 €", ev: "price" },
          { text: L(". Die Lieferung erfolgt morgen.", ". Delivery is tomorrow."), ev: null }
        ],
        sourceNote: L("Die Antwort steht wörtlich im Kontext.", "The answer is stated verbatim in the context."),
        claims: [
          { text: L("Der Preis ist 43 €.", "The price is €43."), status: "contradicted", ev: "price", note: L("Der Kontext sagt 42 €. Die Zahl ist ein Input-Konflikt.", "The context says €42. The number is an input conflict.") }
        ],
        claimsFixed: [
          { text: L("Der Preis ist 42 €.", "The price is €42."), status: "supported", ev: "price", note: L("Die Antwort kommt direkt aus dem Kontext.", "The answer comes directly from the context.") }
        ],
        claimsPartial: [
          { text: L("Der Preis ist 42 € (laut Kontext).", "The price is €42 (according to the context)."), status: "supported", ev: "price", note: L("Der Kontext wird jetzt zitiert.", "The context is now quoted.") }
        ],
        mechanism: L("Kontext-Vernachlässigung", "Context neglect"),
        why: L("Der Kontext enthält die Antwort. Das Modell folgt einem gelernten Muster oder einer alten Erinnerung.", "The context contains the answer. The model follows a learned pattern or an old memory."),
        plausibility: 0.78, grounding: 0.25,
        measures: {
          source: { status: "partial", note: L("Der Kontext ist schon da; die Reihenfolge und das Zitat helfen.", "The context is already there; ordering and quoting help.") },
          verify: { status: "fix", note: L("Die Gegenprüfung findet die 42 € im Kontext.", "Verification finds €42 in the context.") },
          selfcheck: { status: "partial", note: L("Samples können die Zahl stabilisieren.", "Samples can stabilise the number.") },
          freshness: { status: "none", note: L("Kein Datumsproblem.", "No date problem.") },
          citation: { status: "partial", note: L("Ein Zitat zeigt die Kontextstelle.", "A quote shows the context span.") }
        },
        cite: "Huang et al. (2023)"
      },
      {
        id: "outdated", label: L("Veraltet", "Outdated"), color: "gold", icon: "◷", group: L("Faktizität", "Factuality"),
        question: L("Wie viele Menschen leben in der Stadt?", "How many people live in the city?"),
        sourceType: "dated",
        sourceHead: L("Stand 2011", "As of 2011"),
        sourceParts: [
          { text: L("Bevölkerung 2011: ", "Population 2011: "), ev: null },
          { text: L("8 Mio.", "8 million"), ev: "old" }
        ],
        sourceNote: L("Die Zahl war 2011 richtig. Heute fehlt ein aktuelles Datum.", "The number was correct in 2011. Today a current date is missing."),
        claims: [
          { text: L("8 Millionen.", "8 million."), status: "outdated", ev: "old", note: L("Ohne Datum ist die Zahl heute nicht belastbar.", "Without a date the number is not reliable today.") }
        ],
        claimsFixed: [
          { text: L("8,4 Millionen (Stadt, 2024).", "8.4 million (city, 2024)."), status: "supported", ev: "new", note: L("Aktuelle Quelle mit Datum.", "Current source with a date.") }
        ],
        claimsPartial: [
          { text: L("8 Millionen (Stand 2011).", "8 million (as of 2011)."), status: "outdated", ev: "old", note: L("Immerhin ist das Datum jetzt sichtbar.", "At least the date is now visible.") }
        ],
        fresh: {
          head: L("S1 · Stand 2024", "S1 · as of 2024"),
          parts: [{ text: L("8,4 Millionen (Stadt, 2024).", "8.4 million (city, 2024)."), ev: "new" }],
          note: L("Frische Quelle mit Datum.", "Fresh source with a date.")
        },
        mechanism: L("Eingefrorenes Wissen", "Frozen knowledge"),
        why: L("Die Antwort war einmal richtig. Das Modell hat keinen eingebauten Kalender; das Training endet an einem Stichtag.", "The answer was once right. The model has no built-in calendar; training ends at a cut-off date."),
        plausibility: 0.8, grounding: 0.2,
        measures: {
          source: { status: "partial", note: L("Eine Quelle ohne Datum macht die Zahl nicht aktuell.", "A source without a date does not make the number current.") },
          verify: { status: "partial", note: L("Die Prüfung kann das fehlende Datum markieren.", "Verification can flag the missing date.") },
          selfcheck: { status: "none", note: L("Samples wiederholen dieselbe alte Zahl.", "Samples repeat the same old number.") },
          freshness: { status: "fix", note: L("Retrieval mit Datum liefert den aktuellen Stand.", "Date-aware retrieval gives the current value.") },
          citation: { status: "none", note: L("Kein Zitatproblem.", "No citation problem.") }
        },
        cite: "Huang et al. (2023)"
      },
      {
        id: "entity", label: L("Entität vertauscht", "Entity swap"), color: "lilac", icon: "⇄", group: L("Faktizität", "Factuality"),
        question: L("Wo hängt die Mona Lisa?", "Where is the Mona Lisa?"),
        sourceType: "document",
        sourceHead: "S1 · " + L("Quelle", "source"),
        sourceParts: [
          { text: L("Die Mona Lisa hängt im ", "The Mona Lisa hangs in the "), ev: null },
          { text: "Louvre", ev: "place" },
          { text: L(" in Paris.", " in Paris."), ev: null }
        ],
        sourceNote: L("Die Quelle nennt Ort und Gebäude.", "The source names the place and building."),
        claims: [
          { text: L("Im British Museum in London.", "In the British Museum in London."), status: "contradicted", ev: "place", note: L("Die Quelle nennt den Louvre in Paris. Zwei bekannte Museen wurden vertauscht.", "The source names the Louvre in Paris. Two famous museums were swapped.") }
        ],
        claimsFixed: [
          { text: L("Im Louvre in Paris.", "In the Louvre in Paris."), status: "supported", ev: "place", note: L("Die Entität stimmt mit der Quelle überein.", "The entity matches the source.") }
        ],
        claimsPartial: [
          { text: L("Im Louvre in Paris (laut Quelle).", "In the Louvre in Paris (according to the source)."), status: "supported", ev: "place", note: L("Der Name wird jetzt gegen die Quelle geprüft.", "The name is now checked against the source.") }
        ],
        retrieved: {
          head: L("S1 · RAG-Treffer", "S1 · RAG result"),
          parts: [{ text: L("Die Mona Lisa hängt im Louvre in Paris.", "The Mona Lisa hangs in the Louvre in Paris."), ev: "place" }],
          note: L("RAG bestätigt den Louvre.", "RAG confirms the Louvre.")
        },
        mechanism: L("Plausible Entitätsverwechslung", "Plausible entity confusion"),
        why: L("Die Form der Antwort ist plausibel, die Entität ist falsch. Das Modell vertauscht zwei bekannte Museen.", "The shape of the answer is plausible; the entity is wrong. The model swaps two famous museums."),
        plausibility: 0.85, grounding: 0.15,
        measures: {
          source: { status: "fix", note: L("RAG liefert den Louvre als Quelle.", "RAG supplies the Louvre as a source.") },
          verify: { status: "fix", note: L("Die Entitätsprüfung findet den Widerspruch.", "Entity checking finds the contradiction.") },
          selfcheck: { status: "partial", note: L("Samples können die Entität uneinheitlich nennen.", "Samples may name the entity inconsistently.") },
          freshness: { status: "none", note: L("Kein Datumsproblem.", "No date problem.") },
          citation: { status: "partial", note: L("Ein Zitat macht die Quelle sichtbar.", "A quote makes the source visible.") }
        },
        cite: "Ji et al. (2023)"
      },
      {
        id: "sampling", label: "Sampling", color: "green", icon: "⚄", group: L("Mechanismus", "Mechanism"),
        question: L("Ergänze: „Berlin liegt an der …“", "Complete: “Berlin lies on the …”"),
        sourceType: "memory",
        sourceHead: L("Kein Kontext", "No context"),
        sourceNote: L("Das Modell zieht ein Token aus einer Verteilung.", "The model draws a token from a distribution."),
        claims: [
          { text: L("Elbe.", "Elbe."), status: "contradicted", ev: null, note: L("Ein unwahrscheinliches, aber flüssiges Token wurde gezogen. Danach baut das Modell plausibel darauf weiter.", "An unlikely but fluent token was drawn. The model then builds plausibly on it.") }
        ],
        claimsFixed: [
          { text: L("Berlin liegt an der Spree.", "Berlin lies on the Spree."), status: "supported", ev: "spree", note: L("Mehrere Samples oder eine Quelle stabilisieren die Antwort.", "Several samples or a source stabilise the answer.") }
        ],
        claimsPartial: [
          { text: L("Ich bin unsicher; mehrere Samples widersprechen sich.", "I am unsure; several samples disagree."), status: "refusal", ev: null, note: L("Selbstkonsistenz macht die Unsicherheit sichtbar.", "Self-consistency makes the uncertainty visible.") }
        ],
        retrieved: {
          head: L("S1 · RAG-Treffer", "S1 · RAG result"),
          parts: [{ text: L("Berlin liegt an der Spree.", "Berlin lies on the Spree."), ev: "spree" }],
          note: L("RAG ersetzt das Sampling-Raten.", "RAG replaces sampling guesswork.")
        },
        mechanism: L("Zufall im Sampling", "Randomness in sampling"),
        why: L("Ein Token wird aus einer Wahrscheinlichkeitsverteilung gezogen. Ein unwahrscheinliches, aber flüssiges Token kann eine ganze Antwort in die falsche Richtung ziehen.", "A token is drawn from a probability distribution. An unlikely but fluent token can pull a whole answer in the wrong direction."),
        plausibility: 0.55, grounding: 0.1,
        measures: {
          source: { status: "fix", note: L("RAG ersetzt das Raten durch eine Quelle.", "RAG replaces guesswork with a source.") },
          verify: { status: "partial", note: L("Die Prüfung markiert die Unsicherheit.", "Verification flags the uncertainty.") },
          selfcheck: { status: "fix", note: L("Mehrere Samples zeigen die Streuung; niedrige Temperatur hilft.", "Several samples show the spread; lower temperature helps.") },
          freshness: { status: "none", note: L("Kein Datumsproblem.", "No date problem.") },
          citation: { status: "none", note: L("Kein Zitatproblem.", "No citation problem.") }
        },
        cite: "Manakul et al. (2023); Farquhar et al. (2024)"
      }
    ];

    var SOURCE_KIND = {
      fact: "weights", citation: "weights", intrinsic: "context", extrinsic: "context",
      context: "context", outdated: "weights", entity: "context", sampling: "weights", negation: "logic"
    };

    var MEASURES = [
      { id: "source", label: L("Quelle (RAG)", "Source (RAG)"), icon: "S1" },
      { id: "verify", label: L("Gegenprüfung", "Verify"), icon: "✓" },
      { id: "selfcheck", label: L("Selbstkonsistenz", "Self-check"), icon: "≈" },
      { id: "freshness", label: L("Aktualität", "Freshness"), icon: "◷" },
      { id: "citation", label: L("Zitatprüfung", "Citation check"), icon: "❞" }
    ];

    var STATUS = {
      supported: { icon: "✓", label: L("gedeckt", "supported"), cls: "is-supported" },
      contradicted: { icon: "✕", label: L("Widerspruch", "contradicted"), cls: "is-contradicted" },
      unsupported: { icon: "?", label: L("nicht gedeckt", "unsupported"), cls: "is-unsupported" },
      outdated: { icon: "◷", label: L("veraltet", "outdated"), cls: "is-outdated" },
      unverifiable: { icon: "…", label: L("nicht prüfbar", "unverifiable"), cls: "is-unverifiable" },
      refusal: { icon: "⊘", label: L("keine Behauptung", "no claim"), cls: "is-refusal" }
    };
    var MSTATUS = {
      fix: { label: L("hilft", "helps"), cls: "is-fix" },
      partial: { label: L("teilweise", "partial"), cls: "is-partial" },
      none: { label: L("hilft nicht", "does not help"), cls: "is-none" }
    };

    var RAG_DOCS = [
      { id: "D1", angle: 12, answer: true, text: L("Berlin liegt an der Spree.", "Berlin lies on the Spree.") },
      { id: "D2", angle: 28, text: L("Die Spree mündet in die Havel.", "The Spree flows into the Havel.") },
      { id: "D3", angle: 61, text: L("Berlin ist die Hauptstadt von Deutschland.", "Berlin is the capital of Germany.") },
      { id: "D4", angle: 84, text: L("Die Elbe fließt durch Dresden.", "The Elbe flows through Dresden.") }
    ];
    var selected = Math.max(0, Math.min(TYPES.length - 1, lastSelected));
    var activeMeasure = {};
    var activeClaim = 0;

    var el = document.createElement("div");
    el.className = "ls-hx-scene";
    el.innerHTML =
      '<div class="ls-hx-top">' +
        '<div class="ls-hx-chips" role="tablist" data-tip="' + L("Jeder Typ zeigt eine andere Ursache und einen anderen Gegenhebel.", "Each type shows a different cause and a different countermeasure.") + '"></div>' +
        '<div class="ls-hx-mode" role="group" aria-label="' + L("Antwortquelle", "Answer source") + '" data-tip="' + L("Wechselt zwischen Antwort aus dem Gedächtnis und Antwort mit abgerufener Quelle.", "Switches between an answer from memory and one with a retrieved source.") + '">' +
          '<button type="button" class="is-on" data-hx-mode="memory" data-tip="' + L("Das Modell antwortet nur aus den Trainingsdaten.", "The model answers only from training data.") + '">' + L("Aus dem Gedächtnis", "From memory") + '</button>' +
          '<button type="button" data-hx-mode="rag" data-tip="' + L("Eine abgerufene Quelle S1 liegt im Kontext.", "A retrieved source S1 is in the context.") + '">' + L("Mit RAG", "With RAG") + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="ls-hx-hero">' +
        '<div class="ls-hx-win" data-tip="' + L("Der Chat zeigt Antwort, Quelle und Sicherheit für den gewählten Typ.", "The chat shows the answer, source, and confidence for the selected type.") + '">' +
          '<div class="ls-hx-winbar">' +
            '<span class="ls-hx-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
            '<span class="ls-hx-addr">chat.example.com</span>' +
            '<span class="ls-hx-mode-badge"></span>' +
          '</div>' +
          '<div class="ls-hx-winbody">' +
            '<div class="ls-hx-chatcol">' +
              '<div class="ls-hx-thread" data-tip="' + L("Frage und Modellantwort; die Antwort zerfällt in prüfbare Aussagen.", "Question and model answer; the answer splits into checkable claims.") + '">' +
                '<div class="ls-hx-msg is-user">' +
                  '<span class="ls-hx-role">' + L("Du", "You") + '</span>' +
                  '<div class="ls-hx-bubble ls-hx-bubble--user">' +
                    '<div class="ls-hx-question"><span></span><b></b></div>' +
                  '</div>' +
                '</div>' +
                '<div class="ls-hx-msg is-ai">' +
                  '<span class="ls-hx-role">LLM</span>' +
                  '<div class="ls-hx-bubble ls-hx-bubble--ai">' +
                    '<div class="ls-hx-answer-text"></div>' +
                    '<div class="ls-hx-cite-card" data-tip="' + L("Die zitierte Quelle oder das Fehlen einer Quelle.", "The cited source or the absence of one.") + '"></div>' +
                    '<div class="ls-hx-conf" data-tip="' + L("Wie sicher das Modell klingt, unabhängig davon, ob es recht hat.", "How confident the model sounds, regardless of whether it is right.") + '"><span>' + L("Sicherheit", "Confidence") + '</span><span class="ls-hx-conf-track"><i></i></span><b class="ls-hx-conf-val"></b></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="ls-hx-mechanism" data-tip="' + L("Der Mechanismus hinter diesem Halluzinationstyp.", "The mechanism behind this hallucination type.") + '"></div>' +
            '</div>' +
            '<aside class="ls-hx-verifycol" data-tip="' + L("Die Quellenprüfung zerlegt die Antwort und vergleicht sie mit Belegen.", "The source check splits the answer and compares it with evidence.") + '">' +
              '<div class="ls-hx-verify-head"><span>' + L("Quellenprüfung", "Source check") + '</span><i class="ls-hx-verify-dot" aria-hidden="true"></i></div>' +
              '<div class="ls-hx-verify-body">' +
                '<section class="ls-hx-panel ls-hx-source" data-tip="' + L("Der Kontext oder die Trainingsdaten, gegen die geprüft wird.", "The context or training data that the answer is checked against.") + '"><div class="ls-hx-panel-head"></div><div class="ls-hx-source-body"></div><p class="ls-hx-source-note"></p><p class="ls-hx-cite"></p></section>' +
                '<div class="ls-hx-claims" data-tip="' + L("Jede Zeile ist eine atomare Aussage mit Urteil; Klick zeigt den Beleg.", "Each row is an atomic claim with a verdict; click to see the evidence.") + '"></div>' +
                '<div class="ls-hx-detail" data-tip="' + L("Belegstelle und Begründung für die gewählte Aussage.", "Evidence span and reason for the selected claim.") + '"></div>' +
                '<div class="ls-hx-score" data-tip="' + L("FActScore: Anteil der Aussagen, die eine Quelle deckt.", "FActScore: share of claims that a source supports.") + '"><span>FActScore</span><div class="ls-hx-scorebar"><i></i></div><b></b></div>' +
                '<div class="ls-hx-verdict" data-tip="' + L("Urteil zur aktuellen Schalterkombination.", "Verdict on the current switch combination.") + '"></div>' +
              '</div>' +
            '</aside>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ls-hx-lab-head"><b>' + L("Labor", "Lab") + '</b><span>' + L("Typen, Evidenz und Gegenmaßnahmen", "types, evidence, and countermeasures") + '</span></div>' +
      '<div class="ls-hx-sources" role="group" aria-label="' + L("Zwei Quellen: Trainingsdaten und Kontext", "Two sources: training data and context") + '">' +
        '<div class="ls-hx-source-card is-weights" data-source-kind="weights" data-tip="' + L("Was das Modell aus dem Training mitbringt; hier sitzen Fakten und alte Zahlen.", "What the model brings from training; facts and old numbers live here.") + '"><span>' + L("Gewichte", "Weights") + '</span><b>' + L("Trainingsdaten", "Training data") + '</b><p>' + L("Was das Modell aus dem Training mitbringt.", "What the model brings from training.") + '</p></div>' +
        '<div class="ls-hx-source-claim" data-tip="' + L("Die geprüfte Aussage steht zwischen beiden möglichen Quellen.", "The checked claim sits between the two possible sources.") + '"><span>' + L("Behauptung", "Claim") + '</span></div>' +
        '<div class="ls-hx-source-card is-context" data-source-kind="context" data-tip="' + L("Was im Prompt oder in der abgerufenen Quelle steht; RAG füllt diesen Teil.", "What is in the prompt or the retrieved source; RAG fills this side.") + '"><span>' + L("Kontext", "Context") + '</span><b>' + L("Prompt / RAG-Quelle", "Prompt / RAG source") + '</b><p>' + L("Was im Prompt oder in der abgerufenen Quelle steht.", "What is in the prompt or the retrieved source.") + '</p></div>' +
      '</div>' +
      '<div class="ls-hx-bottom">' +
        '<div class="ls-hx-risk" data-tip="' + L("Die Position zeigt Plausibilität gegen Deckung; oben rechts liegt die Halluzinationszone.", "The position shows plausibility against grounding; the hallucination zone is top right.") + '"><div class="ls-hx-risk-head"><b>' + L("Risikokarte", "Risk map") + '</b><span>' + L("rechts = plausibel · oben = gedeckt", "right = plausible · top = grounded") + '</span></div><div class="ls-hx-risk-svg"></div></div>' +
        '<div class="ls-hx-measures" data-tip="' + L("Gegenmaßnahmen: Klick schaltet eine Prüfung ein oder aus.", "Countermeasures: click to turn a check on or off.") + '"></div>' +
      '</div>' +
      '<div class="ls-hx-takeaway"></div>' +
      '<details class="ls-hx-ragbox">' +
        '<summary data-tip="' + L("Kurze Einführung: wie Retrieval passende Sätze in den Kontext legt.", "Short introduction: how retrieval puts fitting sentences into the context.") + '"><span class="ls-hx-ragbox-mark">↗</span><b>' + L("RAG in 30 Sekunden", "RAG in 30 seconds") + '</b><span>' + L("So kommen passende Sätze in den Kontext", "How fitting sentences enter the context") + '</span></summary>' +
        '<div class="ls-hx-ragbox-body">' +
          '<p class="ls-hx-rag-query"><b>' + L("Frage", "Question") + ':</b> ' + L("An welchem Fluss liegt Berlin?", "Which river is Berlin on?") + '</p>' +
          '<div class="ls-hx-rag-steps">' +
            '<div><b>1</b><span>' + L("Sätze vektorisieren", "Embed sentences") + '</span></div>' +
            '<div><b>2</b><span>' + L("Winkel zur Frage messen", "Measure the angle to the question") + '</span></div>' +
            '<div><b>3</b><span>' + L("Treffer in den Kontext legen", "Put hits into the context") + '</span></div>' +
            '<div><b>4</b><span>' + L("Beim Generieren mitlesen", "Read along while generating") + '</span></div>' +
          '</div>' +
          '<div class="ls-hx-rag-lab">' +
            '<div class="ls-hx-rag-viz"><svg class="ls-hx-rag-svg" viewBox="0 0 280 160" role="img"></svg></div>' +
            '<div class="ls-hx-rag-side">' +
              '<label class="ls-hx-rag-threshold" data-tip="' + L("Grenzwinkel: kleinere Werte holen weniger, größere mehr Sätze.", "Angle threshold: smaller values retrieve fewer sentences, larger ones more.") + '"><span>' + L("Grenzwinkel", "Angle threshold") + '</span><input type="range" class="ls-hx-rag-range" min="10" max="85" step="1" value="35"><output class="ls-hx-rag-angle">35°</output></label>' +
              '<div class="ls-hx-rag-context" data-tip="' + L("Diese Sätze liegen danach im Kontext des Modells.", "These sentences then sit in the model context.") + '"><div class="ls-hx-rag-context-head"><b>' + L("Im Kontext", "In the context") + '</b><span class="ls-hx-rag-count"></span></div><div class="ls-hx-rag-list"></div></div>' +
              '<p class="ls-hx-rag-hint" aria-live="polite"></p>' +
            '</div>' +
          '</div>' +
          '<p class="ls-hx-rag-note">' + L("Der Grenzwinkel ist der einzige Regler. Zu klein: die richtige Quelle fehlt. Zu groß: irrelevante Sätze kommen mit. Retrieval ist Suche nach Richtung, kein Verstehen. Wichtig: Anfang und Ende eines langen Kontexts werden besser genutzt als die Mitte; pack die wichtigste Quelle an den Rand.", "The threshold is the only control. Too small: the right source is missing. Too large: irrelevant sentences come along. Retrieval is a search for direction, not understanding. Important: the beginning and end of a long context are used better than the middle, so put the key source at the edge.") + '</p>' +
        '</div>' +
      '</details>' +
      '<details class="ls-hx-ragbox">' +
        '<summary data-tip="' + L("Forschungskontext: Taxonomie, Konfabulation, Messung und Vermeidbarkeit.", "Research context: taxonomy, confabulation, measurement, and avoidability.") + '"><span class="ls-hx-ragbox-mark">◎</span><b>' + L("Forschung: tiefer als die Typen", "Research: beyond the types") + '</b><span>' + L("Taxonomie, Konfabulation, Messung, Vermeidbarkeit", "taxonomy, confabulation, measurement, avoidability") + '</span></summary>' +
        '<div class="ls-hx-ragbox-body">' +
          '<div class="ls-hx-research-grid">' +
            '<article class="ls-hx-research-card"><b>' + L("Zwei Achsen", "Two axes") + '</b><p>' + L("Faktizität: Aussage gegen Welt. Faithfulness: Aussage gegen Quelle, Anweisung oder eigenen Text. Intrinsic widerspricht der Quelle; extrinsic ist nicht gedeckt, kann aber wahr sein.", "Factuality: statement against the world. Faithfulness: statement against the source, instruction, or its own text. Intrinsic contradicts the source; extrinsic is unsupported but can be true.") + '</p><span>Huang et al. (2023); Ji et al. (2023)</span></article>' +
            '<article class="ls-hx-research-card"><b>' + L("Konfabulation", "Confabulation") + '</b><p>' + L("Flüssig, falsch, willkürlich: Die Antwort schwankt mit dem Zufall. Hohe semantische Entropie macht das sichtbar. Das ist etwas anderes als ein konsistenter Datenfehler, eine Lüge oder ein Reasoning-Fehler.", "Fluent, wrong, arbitrary: the answer varies with the random seed. High semantic entropy makes this visible. That is different from a consistent data error, a lie, or a reasoning failure.") + '</p><span>Farquhar et al. (2024)</span></article>' +
            '<article class="ls-hx-research-card"><b>' + L("Vermeidbar?", "Avoidable?") + '</b><p>' + L("Xu et al. (2024) zeigen formal, dass ein universeller Problemlöser nicht alle berechenbaren Funktionen lernen kann. Praktisch kann ein Modell unsicher bleiben oder schweigen; Evals, die nur die Trefferquote messen, belohnen Raten (OpenAI, 2025).", "Xu et al. (2024) show formally that a general problem solver cannot learn all computable functions. In practice a model can stay uncertain or abstain; accuracy-only evals reward guessing (OpenAI, 2025).") + '</p><span>Xu et al. (2024); OpenAI (2025)</span></article>' +
            '<article class="ls-hx-research-card"><b>' + L("Messen", "Measure") + '</b><p>' + L("FActScore zählt atomare Aussagen und prüft sie gegen eine Quelle. Semantische Entropie misst Unsicherheit; CoVe und Selbstkonsistenz prüfen gegen. Kein einzelner Score reicht.", "FActScore counts atomic claims and checks them against a source. Semantic entropy measures uncertainty; CoVe and self-consistency cross-check. No single score is enough.") + '</p><span>Min et al. (2023); Farquhar et al. (2024); Dhuliawala et al. (2023)</span></article>' +
          '</div>' +
          '<p class="ls-hx-rag-note">' + L("Die Quellen sind in der Quellenliste unten verlinkt. Kein Schalter heilt alles: Quelle, Faithfulness, Kalibrierung und eine ehrliche Unsicherheit bleiben getrennt prüfbar.", "The sources are linked in the source list below. No single switch heals everything: source, faithfulness, calibration, and honest uncertainty remain separately testable.") + '</p>' +
        '</div>' +
      '</details>';
    root.appendChild(el);

    var chips = el.querySelector(".ls-hx-chips");
    var sourcePanel = el.querySelector(".ls-hx-source");
    var sourceHead = sourcePanel.querySelector(".ls-hx-panel-head");
    var sourceBody = sourcePanel.querySelector(".ls-hx-source-body");
    var sourceNote = sourcePanel.querySelector(".ls-hx-source-note");
    var cite = sourcePanel.querySelector(".ls-hx-cite");
    var questionEl = el.querySelector(".ls-hx-question");
    var questionText = questionEl.querySelector("b");
    var claimsEl = el.querySelector(".ls-hx-claims");
    var detailEl = el.querySelector(".ls-hx-detail");
    var scoreBar = el.querySelector(".ls-hx-scorebar i");
    var scoreVal = el.querySelector(".ls-hx-score b");
    var mechanismEl = el.querySelector(".ls-hx-mechanism");
    var riskSvg = el.querySelector(".ls-hx-risk-svg");
    var measuresEl = el.querySelector(".ls-hx-measures");
    var takeawayEl = el.querySelector(".ls-hx-takeaway");
    var answerTextEl = el.querySelector(".ls-hx-answer-text");
    var citeCardEl = el.querySelector(".ls-hx-cite-card");
    var confFill = el.querySelector(".ls-hx-conf-track i");
    var confVal = el.querySelector(".ls-hx-conf-val");
    var verdictEl = el.querySelector(".ls-hx-verdict");
    var modeBtns = el.querySelectorAll("[data-hx-mode]");
    var modeBadge = el.querySelector(".ls-hx-mode-badge");
    var ragRange = el.querySelector(".ls-hx-rag-range");
    var ragAngle = el.querySelector(".ls-hx-rag-angle");
    var ragList = el.querySelector(".ls-hx-rag-list");
    var ragCount = el.querySelector(".ls-hx-rag-count");
    var ragHint = el.querySelector(".ls-hx-rag-hint");
    var ragSvgEl = el.querySelector(".ls-hx-rag-svg");

    function type() { return TYPES[selected]; }
    function simMode(t) {
      var active = MEASURES.filter(function (m) { return activeMeasure[m.id]; });
      if (active.some(function (m) { return t.measures[m.id] && t.measures[m.id].status === "fix"; })) return "fixed";
      if (active.some(function (m) { return t.measures[m.id] && t.measures[m.id].status === "partial"; })) return "partial";
      return "base";
    }
    function currentClaims(t) {
      var mode = simMode(t);
      if (mode === "fixed") return t.claimsFixed;
      if (mode === "partial") return t.claimsPartial;
      return t.claims;
    }
    function currentSource(t) {
      if (activeMeasure.freshness && t.fresh) return { kind: "document", head: t.fresh.head, parts: t.fresh.parts, note: t.fresh.note, badge: "S1" };
      if (activeMeasure.source && t.measures.source && t.measures.source.status === "fix" && t.retrieved) {
        return { kind: "document", head: t.retrieved.head, parts: t.retrieved.parts, note: t.retrieved.note, badge: "S1" };
      }
      return {
        kind: t.sourceType,
        head: t.sourceHead,
        parts: t.sourceParts || [],
        note: t.sourceNote,
        badge: t.sourceType === "memory" ? "∅" : t.sourceType === "citation" ? "❞" : t.sourceType === "dated" ? "◷" : t.sourceType === "logic" ? "¬" : "S1"
      };
    }
    function sourcePartHTML(parts, claim) {
      return parts.map(function (part) {
        var hit = part.ev && claim && claim.ev === part.ev;
        var status = hit ? (STATUS[claim.status] || STATUS.unverifiable) : null;
        if (!hit) return esc(part.text);
        return '<mark class="ls-hx-hit ' + (status ? status.cls : "") + '">' + esc(part.text) + '</mark>';
      }).join("");
    }
    function evidenceText(parts, claim) {
      if (!claim || !claim.ev) return "";
      var part = parts.filter(function (p) { return p.ev === claim.ev; })[0];
      return part ? part.text : "";
    }
    function renderChips() {
      chips.innerHTML = TYPES.map(function (t, i) {
        return '<button type="button" class="ls-hx-chip is-' + t.color + (i === selected ? ' is-on' : '') + '" data-type="' + i + '" role="tab" aria-selected="' + (i === selected ? 'true' : 'false') + '" data-tip="' + L("Wechselt den Halluzinationstyp und damit Frage, Quelle und Prüfung.", "Switches the hallucination type and with it the question, source, and check.") + '">' +
          '<span class="ls-hx-chip-icon">' + esc(t.icon) + '</span><span>' + esc(t.label) + '</span></button>';
      }).join("");
      chips.querySelectorAll("[data-type]").forEach(function (b) {
        b.addEventListener("click", function () {
          var next = parseInt(b.getAttribute("data-type"), 10);
          if (next === selected) return;
          selected = next;
          var keepRag = !!activeMeasure.source;
          activeMeasure = {};
          if (keepRag) activeMeasure.source = true;
          activeClaim = 0;
          render();
        });
      });
    }
    function renderSource(t) {
      var view = currentSource(t);
      var claims = currentClaims(t);
      var claim = claims[activeClaim] || null;
      var head = '<span class="ls-hx-badge">' + esc(view.badge) + '</span><b>' + esc(view.head) + '</b>';
      if (view.kind !== "logic") {
        head += '<span class="ls-hx-kind">' + (view.kind === "memory" ? L("Trainingsdaten", "training data") : view.kind === "citation" ? L("Zitat", "citation") : view.kind === "dated" ? L("Datum", "date") : L("Kontext", "context")) + '</span>';
      }
      sourceHead.innerHTML = head;
      if (view.kind === "memory") {
        sourceBody.innerHTML = '<div class="ls-hx-memory"><span class="ls-hx-memory-cloud"></span><b>' + L("Kein Dokument", "No document") + '</b><p>' + L("Die Antwort kommt aus den Trainingsdaten (Gewichte), nicht aus dem Kontext.", "The answer comes from training data (weights), not from the context.") + '</p></div>';
      } else if (view.kind === "logic") {
        sourceBody.innerHTML = '<div class="ls-hx-logic"><span>' + L("traurig", "sad") + '</span><i>¬</i><span>' + L("nicht traurig", "not sad") + '</span><b>≠</b><span>' + L("glücklich", "happy") + '</span></div><p class="ls-hx-logic-note">' + L("Abstufungen bleiben dazwischen.", "Degrees remain in between.") + '</p>';
      } else if (view.kind === "citation") {
        sourceBody.innerHTML = '<div class="ls-hx-ref">' + sourcePartHTML(view.parts, claim) + '</div><div class="ls-hx-resolver is-bad">' + L("DOI-Resolver: nicht gefunden", "DOI resolver: not found") + '</div>';
      } else if (view.kind === "dated") {
        sourceBody.innerHTML = '<div class="ls-hx-calendar"><span class="is-old">2011</span><i>→</i><span class="' + (activeMeasure.freshness && t.fresh ? "is-new" : "is-unknown") + '">' + (activeMeasure.freshness && t.fresh ? "2024" : "?") + '</span></div><div class="ls-hx-ref">' + sourcePartHTML(view.parts, claim) + '</div>';
      } else {
        sourceBody.innerHTML = '<div class="ls-hx-doc">' + sourcePartHTML(view.parts, claim) + '</div>';
      }
      sourceNote.textContent = view.note;
      cite.textContent = t.cite || "";
    }
    function renderClaims(t) {
      var claims = currentClaims(t);
      activeClaim = Math.max(0, Math.min(claims.length - 1, activeClaim));
      questionEl.querySelector("span").textContent = t.group + " · " + L("Frage", "Question");
      questionText.textContent = t.question;
      claimsEl.innerHTML = claims.map(function (c, i) {
        var s = STATUS[c.status] || STATUS.unverifiable;
        return '<button type="button" class="ls-hx-claim ' + s.cls + (i === activeClaim ? ' is-on' : '') + '" data-claim="' + i + '" aria-pressed="' + (i === activeClaim ? 'true' : 'false') + '" data-tip="' + L("Wählt diese Aussage; rechts erscheinen Beleg und Begründung.", "Selects this claim; evidence and reason appear on the right.") + '">' +
          '<span class="ls-hx-claim-icon">' + s.icon + '</span><span class="ls-hx-claim-text">' + esc(c.text) + '</span><span class="ls-hx-claim-status">' + s.label + '</span></button>';
      }).join("");
      claimsEl.querySelectorAll("[data-claim]").forEach(function (b) {
        b.addEventListener("click", function () {
          activeClaim = parseInt(b.getAttribute("data-claim"), 10);
          render();
        });
      });
      var claim = claims[activeClaim];
      var view = currentSource(t);
      var ev = evidenceText(view.parts, claim);
      detailEl.innerHTML = '<div class="ls-hx-detail-head"><span>' + (ev ? L("Beleg", "Evidence") : L("Kein Beleg", "No evidence")) + '</span></div><p>' + esc(claim ? claim.note : "") + '</p>' + (ev ? '<blockquote>' + esc(ev) + '</blockquote>' : '');
      var total = claims.filter(function (c) { return c.status !== "refusal"; }).length;
      var supported = claims.filter(function (c) { return c.status === "supported"; }).length;
      var pct = total ? Math.round(supported / total * 100) : null;
      var mode = simMode(t);
      scoreBar.style.width = (pct == null ? 0 : pct) + "%";
      scoreBar.className = pct == null ? "is-empty" : pct === 100 ? "is-good" : pct > 0 ? "is-mid" : "is-bad";
      scoreVal.textContent = pct == null ? L("keine Behauptung", "no claim") : pct + "%";
      scoreVal.title = L("Anteil der atomaren Aussagen, die von einer Quelle gedeckt sind.", "Share of atomic claims supported by a source.");
    }
    function riskCoords(t) {
      var mode = simMode(t);
      if (mode === "fixed") return { p: 0.72, g: 0.92, mode: mode };
      if (mode === "partial") return { p: 0.48, g: 0.5, mode: mode };
      return { p: t.plausibility, g: t.grounding, mode: mode };
    }
    function renderRisk(t) {
      var r = riskCoords(t);
      var x = 26 + r.p * 150;
      var y = 112 - r.g * 92;
      var label = r.mode === "fixed" ? L("gedeckt", "grounded") : r.mode === "partial" ? L("teilweise", "partial") : L("Halluzinationszone", "hallucination zone");
      riskSvg.innerHTML = '<svg viewBox="0 0 200 130" role="img" aria-label="' + esc(L("Risikokarte: ", "Risk map: ") + label) + '">' +
        '<rect class="ls-hx-zone" x="110" y="58" width="78" height="54"/>' +
        '<line class="ls-hx-axis" x1="24" y1="112" x2="190" y2="112"/>' +
        '<line class="ls-hx-axis" x1="24" y1="112" x2="24" y2="10"/>' +
        '<text class="ls-hx-axis-label" x="190" y="124" text-anchor="end">' + L("plausibel", "plausible") + '</text>' +
        '<text class="ls-hx-axis-label" x="28" y="14">' + L("gedeckt", "grounded") + '</text>' +
        '<text class="ls-hx-zone-label" x="186" y="108" text-anchor="end">' + L("Halluzination", "hallucination") + '</text>' +
        '<g class="ls-hx-risk-dot" style="transform: translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)">' +
          '<circle r="6" class="' + (r.mode === "fixed" ? "is-safe" : r.mode === "partial" ? "is-partial" : "is-risk") + '"/>' +
          '<text x="10" y="3">' + L("Antwort", "answer") + '</text>' +
        '</g>' +
        '</svg><p class="ls-hx-risk-caption">' + label + '</p>';
    }
    function renderMeasures(t) {
      measuresEl.innerHTML = MEASURES.map(function (m) {
        var s = t.measures[m.id] || { status: "none", note: "" };
        var ms = MSTATUS[s.status] || MSTATUS.none;
        return '<button type="button" class="ls-hx-measure ' + ms.cls + (activeMeasure[m.id] ? ' is-on' : '') + '" data-measure="' + m.id + '" aria-pressed="' + (activeMeasure[m.id] ? 'true' : 'false') + '" data-tip="' + L("Schaltet diese Gegenmaßnahme an oder aus und zeigt, ob sie hier greift.", "Turns this countermeasure on or off and shows whether it works here.") + '">' +
          '<span class="ls-hx-measure-icon">' + esc(m.icon) + '</span><b>' + esc(m.label) + '</b>' +
          '<span class="ls-hx-measure-status">' + ms.label + '</span><p>' + esc(s.note) + '</p></button>';
      }).join("");
      measuresEl.querySelectorAll("[data-measure]").forEach(function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-measure");
          activeMeasure[id] = !activeMeasure[id];
          activeClaim = 0;
          render();
        });
      });
    }
    function renderSourceMap(t) {
      var kind = SOURCE_KIND[t.id] || "weights";
      if (activeMeasure.source && t.measures.source && t.measures.source.status === "fix" && t.retrieved) kind = "both";
      var cards = el.querySelectorAll("[data-source-kind]");
      Array.prototype.forEach.call(cards, function (card) {
        var on = kind === "both" || kind === "logic" || card.getAttribute("data-source-kind") === kind;
        card.classList.toggle("is-on", on);
        card.classList.toggle("is-dim", !on);
      });
      var claim = el.querySelector(".ls-hx-source-claim");
      if (claim) {
        claim.classList.toggle("is-logic", kind === "logic");
        claim.classList.toggle("is-both", kind === "both");
        claim.querySelector("span").textContent = kind === "logic" ? L("Logik", "Logic") : kind === "both" ? L("Behauptung (RAG)", "Claim (RAG)") : L("Behauptung", "Claim");
      }
    }
    function renderMechanism(t) {
      mechanismEl.innerHTML = '<span class="ls-hx-mech-icon">' + esc(t.icon) + '</span><div><b>' + esc(t.mechanism) + '</b><p>' + esc(t.why) + '</p></div>';
    }
    function renderTakeaway(t) {
      var active = MEASURES.filter(function (m) { return activeMeasure[m.id]; });
      var mode = simMode(t);
      var notes = active.map(function (m) { return t.measures[m.id].note; }).filter(Boolean);
      var lead;
      if (!active.length) lead = L("Die Form ist kein Beweis: Eine plausible Antwort kann ungedeckt sein.", "The shape is no proof: a plausible answer can be ungrounded.");
      else if (mode === "fixed") lead = L("Gedeckt: ", "Grounded: ") + (notes[0] || L("eine passende Prüfung greift.", "a suitable check applies."));
      else if (mode === "partial") lead = L("Teilweise: ", "Partially: ") + (notes[0] || L("die Lücke bleibt sichtbar.", "the gap remains visible."));
      else lead = L("Dieser Schalter ändert hier nichts: ", "This switch does nothing here: ") + (notes[0] || L("die Ursache liegt anderswo.", "the cause is elsewhere."));
      takeawayEl.innerHTML = '<b>' + L("Zum Mitnehmen", "Takeaway") + '</b><p>' + esc(lead) + '</p><p>' + L("Kein Schalter heilt alles: kombiniere Quelle + Gegenprüfung und ergänze Datum oder Zitatprüfung, wo nötig.", "No single switch heals everything: combine source + verification and add date or citation checks where needed.") + '</p>';
    }
    function renderRagSvg(thr) {
      var ox = 42, oy = 132, r = 100, qr = 118;
      var sector = [];
      for (var a = 0; a <= thr; a += 2) {
        sector.push([ox + Math.cos(a * Math.PI / 180) * r, oy - Math.sin(a * Math.PI / 180) * r]);
      }
      var d = "M" + ox + " " + oy + " L" + sector.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L") + " Z";
      var out = '<path class="ls-hx-rag-sector" d="' + d + '"/>' +
        '<line class="ls-hx-rag-axis" x1="' + ox + '" y1="' + (oy + 8) + '" x2="' + (ox + qr + 8) + '" y2="' + (oy + 8) + '"/>' +
        '<line class="ls-hx-rag-axis" x1="' + ox + '" y1="' + (oy + 8) + '" x2="' + ox + '" y2="' + (oy - r - 4) + '"/>' +
        '<line class="ls-hx-rag-query" x1="' + ox + '" y1="' + oy + '" x2="' + (ox + qr) + '" y2="' + oy + '"/>' +
        '<path class="ls-hx-rag-arrowhead" d="M' + (ox + qr) + ' ' + oy + ' l -9 -4 l 0 8 z"/>' +
        '<text class="ls-hx-rag-label is-query" x="' + (ox + qr - 10) + '" y="' + (oy + 17) + '" text-anchor="end">' + L("Frage", "question") + '</text>';
      RAG_DOCS.forEach(function (doc) {
        var ang = doc.angle * Math.PI / 180;
        var x = ox + Math.cos(ang) * r, y = oy - Math.sin(ang) * r;
        var on = doc.angle <= thr;
        var anchor = Math.cos(ang) >= 0 ? "start" : "end";
        var lx = x + (Math.cos(ang) >= 0 ? 7 : -7);
        out += '<line class="ls-hx-rag-doc' + (on ? " is-in" : "") + '" x1="' + ox + '" y1="' + oy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
          '<circle class="ls-hx-rag-dot' + (on ? " is-in" : "") + (doc.answer ? " is-answer" : "") + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (doc.answer ? 4.5 : 3) + '"/>' +
          '<text class="ls-hx-rag-label' + (on ? " is-in" : "") + (doc.answer ? " is-answer" : "") + '" x="' + lx.toFixed(1) + '" y="' + (y - 6).toFixed(1) + '" text-anchor="' + anchor + '">' + doc.id + '</text>';
      });
      return out;
    }
    function renderRag() {
      if (!ragRange) return;
      var thr = parseInt(ragRange.value, 10) || 35;
      var inCtx = RAG_DOCS.filter(function (d) { return d.angle <= thr; });
      var hasAnswer = inCtx.some(function (d) { return d.answer; });
      var hasNoise = inCtx.some(function (d) { return !d.answer && d.angle > 70; });
      ragAngle.textContent = thr + "°";
      ragCount.textContent = inCtx.length + " / " + RAG_DOCS.length;
      ragList.innerHTML = RAG_DOCS.map(function (d) {
        var on = d.angle <= thr;
        return '<div class="ls-hx-rag-row' + (on ? " is-in" : "") + (d.answer ? " is-answer" : "") + '">' +
          '<b>' + d.id + '</b><span>' + esc(d.text) + '</span><em>' + d.angle + '°</em>' +
          '<i>' + (on ? L("im Kontext", "in context") : L("nicht abgerufen", "not retrieved")) + '</i></div>';
      }).join("");
      var hint = hasNoise
        ? L("Zu breit: D1 ist dabei, aber D4 ist irrelevant. Mehr Kontext kann ablenken.", "Too broad: D1 is included, but D4 is irrelevant. More context can distract.")
        : hasAnswer
          ? L("D1 ist im Kontext: Das Modell kann die Antwort daraus lesen.", "D1 is in the context: the model can read the answer from it.")
          : L("Die richtige Quelle D1 fehlt. RAG kann die Antwort nicht stützen.", "The right source D1 is missing. RAG cannot support the answer.");
      ragHint.textContent = hint;
      ragHint.className = "ls-hx-rag-hint " + (hasNoise ? "is-warn" : hasAnswer ? "is-good" : "is-bad");
      ragSvgEl.innerHTML = renderRagSvg(thr);
      ragSvgEl.setAttribute("aria-label", L("Frage und vier Satzrichtungen; ") + InCtxLabel(inCtx.length) + ". " + hint, "Question and four sentence directions; " + InCtxLabel(inCtx.length) + ". " + hint);
    }
    function InCtxLabel(n) {
      return L(n + " Sätze im Kontext", n + " sentences in context");
    }
    function renderChat(t) {
      var claims = currentClaims(t);
      if (answerTextEl) answerTextEl.textContent = claims.map(function (c) { return c.text; }).join(" ");
      var view = currentSource(t);
      if (citeCardEl) {
        var badge = view.kind === "memory" ? "∅" : view.kind === "logic" ? "¬" : view.kind === "citation" ? "❞" : view.kind === "dated" ? "◷" : "S1";
        var label = view.head || "";
        var quote = (view.parts || []).map(function (part) { return part.text; }).join("");
        var note;
        if (view.kind === "memory") note = L("Kein Dokument, nur Trainingsdaten.", "No document, only training data.");
        else if (view.kind === "citation") note = activeMeasure.source ? L("Geprüfte Quelle S1 ist im Kontext.", "Checked source S1 is in the context.") : L("DOI-Resolver: nicht gefunden.", "DOI resolver: not found.");
        else if (view.kind === "logic") note = L("Logik statt Quelle.", "Logic, not a source.");
        else note = quote ? "„" + quote + "“" : view.note;
        citeCardEl.className = "ls-hx-cite-card" +
          (activeMeasure.source && t.measures.source && t.measures.source.status === "fix" ? " is-rag" : view.kind === "citation" ? " is-cite" : "");
        citeCardEl.innerHTML = '<span class="ls-hx-cite-badge">' + esc(badge) + '</span><div><b>' + esc(label) + '</b><p>' + esc(note) + '</p></div>';
      }
      var conf = Math.round((t.plausibility || 0) * 100);
      if (confFill) {
        confFill.style.width = conf + "%";
        confFill.className = conf >= 70 ? "is-high" : "is-mid";
      }
      if (confVal) confVal.textContent = conf + " %";
      if (modeBadge) {
        modeBadge.textContent = activeMeasure.source ? L("Mit RAG", "With RAG") : L("Aus dem Gedächtnis", "From memory");
        modeBadge.className = "ls-hx-mode-badge" + (activeMeasure.source ? " is-rag" : "");
      }
      Array.prototype.forEach.call(modeBtns, function (b) {
        var on = (b.getAttribute("data-hx-mode") === "rag") === !!activeMeasure.source;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    function renderVerdict(t) {
      if (!verdictEl) return;
      var mode = simMode(t);
      var active = MEASURES.filter(function (m) { return activeMeasure[m.id]; });
      var notes = active.map(function (m) { return t.measures[m.id] && t.measures[m.id].note; }).filter(Boolean);
      var html;
      if (!active.length) {
        html = '<div class="ls-hx-verdict-card is-bad"><b>' + L("Die Form ist kein Beweis.", "The shape is not proof.") + '</b><p>' + L("Die Antwort klingt sicher, ist aber nicht gegen eine Quelle geprüft. Schalte eine Gegenmaßnahme ein.", "The answer sounds confident but is not checked against a source. Switch on a countermeasure.") + '</p></div>';
      } else if (mode === "fixed") {
        html = '<div class="ls-hx-verdict-card is-good"><b>' + L("Gedeckt.", "Grounded.") + '</b><p>' + esc(notes[0] || L("Eine passende Prüfung greift.", "A suitable check applies.")) + '</p></div>';
      } else if (mode === "partial") {
        html = '<div class="ls-hx-verdict-card is-warn"><b>' + L("Teilweise gedeckt.", "Partly grounded.") + '</b><p>' + esc(notes[0] || L("Die Lücke bleibt sichtbar.", "The gap remains visible.")) + '</p></div>';
      } else {
        html = '<div class="ls-hx-verdict-card is-bad"><b>' + L("Dieser Schalter hilft hier nicht.", "This switch does not help here.") + '</b><p>' + esc(notes[0] || L("Die Ursache liegt anderswo.", "The cause is elsewhere.")) + '</p></div>';
      }
      verdictEl.innerHTML = html;
    }
    function render() {
      lastSelected = selected;
      var t = type();
      renderChips();
      renderSourceMap(t);
      renderSource(t);
      renderClaims(t);
      renderChat(t);
      renderVerdict(t);
      renderMechanism(t);
      renderRisk(t);
      renderMeasures(t);
      renderTakeaway(t);
    }
    Array.prototype.forEach.call(modeBtns, function (b) {
      b.addEventListener("click", function () {
        var wantRag = b.getAttribute("data-hx-mode") === "rag";
        if (!!activeMeasure.source === wantRag) return;
        activeMeasure.source = wantRag;
        activeClaim = 0;
        render();
      });
    });
    if (ragRange) ragRange.addEventListener("input", renderRag);
    render();
    renderRag();
    return {
      update: function () {},
      next: function () {
        if (selected < TYPES.length - 1) {
          var keepRag = !!activeMeasure.source;
          selected++;
          activeMeasure = {};
          if (keepRag) activeMeasure.source = true;
          activeClaim = 0;
          render();
          return true;
        }
        return false;
      },
      prev: function () {
        if (selected > 0) {
          var keepRag = !!activeMeasure.source;
          selected--;
          activeMeasure = {};
          if (keepRag) activeMeasure.source = true;
          activeClaim = 0;
          render();
          return true;
        }
        return false;
      },
      hasNext: function () { return selected < TYPES.length - 1; },
      hasPrev: function () { return selected > 0; },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }
  core.register("hallucinationtypes", hallucinationTypesScene);
})();
