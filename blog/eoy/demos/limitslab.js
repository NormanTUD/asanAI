(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function limitsLabScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc;
    var reduced = !!api.reducedMotion;
    function L(de, en) { return DE ? de : en; }
    var ORDER = ["paraphrase", "citation", "boundary", "context"];
    var TESTS = {
      paraphrase: {
        id: "paraphrase",
        label: L("Formatierung", "Formatting"),
        kicker: L("01 · Eingabeform", "01 · Input format"),
        title: L("Dieselbe Aufgabe, ein anderes Format", "Same task, a different format"),
        task: L("Support-Ticket klassifizieren", "Classify a support ticket"),
        scenario: L("Dieselbe Beschwerde, dreimal anders gerahmt: Fließtext, Markdown und Chat-Template. Das Label soll gleich bleiben.", "The same complaint, framed three ways: prose, Markdown, and a chat template. The label should stay the same."),
        prompt: L("Meine Bestellung ist seit zwei Wochen nicht da. Ich möchte sie stornieren.", "My order has not arrived for two weeks. I want to cancel it."),
        variants: [
          { q: L("Fließtext: Aufgabe + Beispiel + Label", "Prose: task + example + label"), a: L("„Storno“", "“Cancel”"), ok: true },
          { q: L("Markdown: Überschrift + Liste + Label", "Markdown: heading + list + label"), a: L("„Storno“", "“Cancel”"), ok: true },
          { q: L("Chat-Template: System + User + Assistant", "Chat template: system + user + assistant"), a: L("„Versandstatus“", "“Shipping status”"), ok: false }
        ],
        protocol: [
          L("Dasselbe Beispiel in mehreren plausiblen Formaten", "same example in several plausible formats"),
          L("Jedes Format mehrfach abfragen", "query each format repeatedly"),
          L("Streuung der Labels statt einen Punkt messen", "measure label spread instead of one point")
        ],
        observation: L("Zwei Formate liefern „Storno“, das Chat-Template „Versandstatus“. Die Bedeutung des Tickets hat sich nicht geändert.", "Two formats return “Cancel”; the chat template returns “Shipping status”. The ticket's meaning did not change."),
        wait: L("Noch nicht geprüft. Die Beobachtung erscheint nach dem Start.", "Not checked yet. The observation appears after you start."),
        why: L("Die Formatierung ist Teil des Modells, nicht nur Verpackung. Schon bedeutungserhaltende Änderungen an Reihenfolge, Trennern oder Rollenmarkierungen verschieben die Antwort.", "Formatting is part of the model, not just packaging. Meaning-preserving changes to order, separators, or role markers already move the answer."),
        fix: L("Mehrere plausible Formate testen, die Spannweite berichten und bei Abweichung nachfragen.", "Test several plausible formats, report the spread, and ask again when answers diverge."),
        cite: "Sclar et al. (2023)",
        evidence: L("Sclar et al. (2023): bei LLaMA-2-13B bis zu 76 Genauigkeitspunkte Unterschied zwischen bedeutungserhaltenden Prompt-Formaten.", "Sclar et al. (2023): up to 76 accuracy points between meaning-preserving prompt formats with LLaMA-2-13B.")
      },
      citation: {
        id: "citation",
        label: L("Erfundenes Zitat", "Fabricated citation"),
        kicker: L("02 · Existenz", "02 · Existence"),
        title: L("Eine Quelle muss auffindbar sein", "A source has to be findable"),
        task: L("Literaturangabe prüfen", "Check a bibliographic entry"),
        scenario: L("Eine Antwort nennt Autoren, Journal, Jahr und DOI. Das sieht vollständig aus; ob die Arbeit existiert, entscheidet erst der Abgleich mit einer Bibliothek.", "An answer names authors, journal, year, and DOI. It looks complete; whether the work exists is decided only by checking a library."),
        prompt: L("Nenne eine Studie, die zeigt, dass Koffein die Reaktionszeit verbessert.", "Name a study showing that caffeine improves reaction time."),
        answer: "Müller & Schmidt (2019), Caffeine and Reaction Time, Journal of Psychopharmacology 33(4), 412–421. DOI 10.1177/0269881119823456",
        check: L("DOI nicht gefunden · Titel nicht gefunden", "DOI not found · title not found"),
        protocol: [
          L("DOI auflösen", "resolve the DOI"),
          L("Titel, Autoren und Journal in Crossref/PubMed suchen", "search title, authors, and journal in Crossref/PubMed"),
          L("Zitatstelle im PDF prüfen", "check the quoted passage in the PDF")
        ],
        observation: L("Die Angabe sieht vollständig aus; DOI und Titel existieren nicht. Walters & Wilder (2023) fanden 55 % erfundene GPT-3.5- und 18 % erfundene GPT-4-Zitate in 84 kurzen Literaturübersichten.", "The entry looks complete; the DOI and title do not exist. Walters & Wilder (2023) found 55% fabricated GPT-3.5 and 18% fabricated GPT-4 citations in 84 short literature reviews."),
        wait: L("Noch nicht geprüft. Die Beobachtung erscheint nach dem Start.", "Not checked yet. The observation appears after you start."),
        why: L("Das Modell erzeugt die Oberfläche einer bibliografischen Angabe, aber keine Datenbankabfrage. Eine Quelle ist erst belegt, wenn DOI oder Titel auflösbar sind.", "The model generates the surface of a bibliographic entry, not a database lookup. A source is supported only when its DOI or title resolves."),
        whyChecked: L("Die Prüfung entlarvt das Zitat, liefert aber keinen Ersatz. Ohne auffindbare Quelle bleibt die Behauptung unbelegt.", "The check exposes the citation but supplies no replacement. Without a findable source the claim remains unsupported."),
        fix: L("RAG, DOI und Titel prüfen, nur belegte Sätze zitieren.", "RAG, check DOI and title, cite only supported sentences."),
        cite: "Walters & Wilder (2023); Ji et al. (2023)",
        evidence: L("Walters & Wilder (2023): 51 % erfundene Zitate über sechs Studien; selbst bei GPT-4 blieben 18 % erfunden und 24 % der echten Angaben hatten substanzielle Fehler.", "Walters & Wilder (2023): 51% fabricated citations across six studies; even GPT-4 left 18% fabricated and 24% of real entries had substantive errors.")
      },
      boundary: {
        id: "boundary",
        label: L("Kalibrierung", "Calibration"),
        kicker: L("03 · Konfidenz", "03 · Confidence"),
        title: L("Sicherheit ist keine Korrektheit", "Confidence is not correctness"),
        task: L("Aktuelle Auskunft einholen", "Get a current piece of information"),
        scenario: L("Gefragt sind die heutigen Öffnungszeiten des Bürgeramts. Das Modell hat keinen Zugriff auf den aktuellen Aushang; seine Konfidenz ist ein gelerntes Signal, kein Beleg.", "The question is today's opening hours of the city office. The model has no access to the current notice; its confidence is a learned signal, not evidence."),
        prompt: L("Welche Öffnungszeiten hat das Bürgeramt heute?", "What are the city office's opening hours today?"),
        answer: L("Heute 8–16 Uhr", "Today 8–16"),
        conf: 91,
        asked: L("Auf Nachfrage bleibt es bei 8–16 Uhr. Das Modell hat keinen Zugriff und zeigt keine Unsicherheit.", "When asked again, it stays at 8–16. The model has no access and shows no uncertainty."),
        protocol: [
          L("Zugriff prüfen: Gibt es eine Quelle oder ein Werkzeug?", "check access: is there a source or a tool?"),
          L("„Ich weiß es nicht“ als gültige Antwort erlauben", "allow “I do not know” as a valid answer"),
          L("Konfidenz gegen Korrektheit kalibrieren", "calibrate confidence against correctness")
        ],
        observation: L("Das Modell antwortet mit 91 % Konfidenz, obwohl es den Aushang nicht kennt.", "The model answers with 91% confidence although it does not know the notice."),
        wait: L("Noch nicht geprüft. Die Beobachtung erscheint nach dem Start.", "Not checked yet. The observation appears after you start."),
        why: L("Kein Zugriff auf aktuelle oder private Daten. Kadavath et al. (2022) zeigen, dass Konfidenz oft nützlich ist, aber nicht überall kalibriert bleibt; auf neuen Aufgaben kann P(IK) danebenliegen.", "No access to current or private data. Kadavath et al. (2022) show that confidence is often useful but does not remain calibrated everywhere; P(IK) can be off on new tasks."),
        fix: L("Retrieval, Werkzeuge, Rückfragen, Unsicherheit anzeigen.", "Retrieval, tools, follow-up questions, show uncertainty."),
        cite: "Kadavath et al. (2022); Ji et al. (2023)",
        evidence: L("Kadavath et al. (2022): größere Modelle sind auf Multiple-Choice- und Wahr/Falsch-Fragen gut kalibriert, wenn das Format stimmt; P(IK) generalisiert nur teilweise auf neue Aufgaben.", "Kadavath et al. (2022): larger models are well calibrated on multiple-choice and true/false questions in the right format; P(IK) only partly generalises to new tasks.")
      },
      context: {
        id: "context",
        label: L("Kontext", "Context"),
        kicker: L("04 · Arbeitsgedächtnis", "04 · Working memory"),
        title: L("Die Mitte geht unter", "The middle gets lost"),
        task: L("Vertrag prüfen", "Check a contract"),
        scenario: L("Die entscheidende Klausel steht an unterschiedlichen Stellen im langen Dokument.", "The decisive clause sits at different positions in a long document."),
        prompt: L("Wann endet der Vertrag?", "When does the contract end?"),
        fact: L("Der Vertrag endet am 14. März 2027.", "The contract ends on 14 March 2027."),
        positions: [
          { label: L("Anfang", "Start"), answer: L("14. März 2027", "14 March 2027"), ok: true },
          { label: L("Mitte", "Middle"), answer: L("14. März 2025", "14 March 2025"), ok: false },
          { label: L("Ende", "End"), answer: L("14. März 2027", "14 March 2027"), ok: true }
        ],
        protocol: [
          L("Fakt an Anfang, Mitte und Ende platzieren", "place the fact at start, middle, and end"),
          L("RAG-Chunks und Reihenfolge variieren", "vary RAG chunks and order"),
          L("Retrieval und Faithfulness getrennt prüfen", "evaluate retrieval and faithfulness separately")
        ],
        observation: L("Anfang und Ende liefern 2027; in der Mitte antwortet das Modell mit 2025.", "Start and end give 2027; in the middle the model answers 2025."),
        wait: L("Noch nicht geprüft. Die Beobachtung erscheint nach dem Start.", "Not checked yet. The observation appears after you start."),
        why: L("Das Arbeitsgedächtnis ist der Kontext. Liu et al. (2023) finden eine U-förmige Kurve: Information am Anfang und Ende wird besser genutzt als in der Mitte, selbst bei ausdrücklich langkontextfähigen Modellen.", "Working memory is the context. Liu et al. (2023) find a U-shaped curve: information at the start and end is used better than in the middle, even for explicitly long-context models."),
        fix: L("Wichtiges an den Rand, Retrieval und Chunking, Zitatstelle verlangen.", "Put important facts at the edges, use retrieval and chunking, ask for the supporting quote."),
        cite: "Liu et al. (2023)",
        evidence: L("Liu et al. (2023): Multi-Dokument-QA und Key-Value-Retrieval verschlechtern sich, wenn die relevante Information in der Mitte eines langen Kontexts liegt; Anfang und Ende sind robuster.", "Liu et al. (2023): multi-document QA and key-value retrieval degrade when the relevant information sits in the middle of a long context; the start and end are more robust.")
      }
    };
    var el = document.createElement("div");
    el.className = "ls-ll";
    root.appendChild(el);
    var state = { test: "paraphrase", run: {}, running: null, pos: 1, verified: false, asked: false };
    var timer = 0;
    function clearTimer() { if (timer) { clearTimeout(timer); timer = 0; } }
    function isRun(id) { return !!state.run[id]; }
    function test() { return TESTS[state.test] || TESTS.paraphrase; }
    function head() {
      return '<div class="ls-ll-head" data-tip="' + L("Der Prüfstand zeigt vier Bruchstellen; die Protokolle sind echt, die Antworten konstruiert.", "The test bench shows four failure points; protocols are real, the answers are constructed.") + '"><div class="ls-ll-headtop"><span class="ls-ll-kicker">' + L("Zuverlässigkeit · Prüfstand", "Reliability · test bench") + '</span><span class="ls-ll-live"><i></i> ' + L("BEREIT", "READY") + '</span></div><b>' + L("Vier Bruchstellen, kein Benchmark", "Four failure points, not a benchmark") + '</b><p>' + L("Ein Prompt ist eine Stichprobe. Wähle einen Test, starte den Prüfstand und lies das reale Protokoll. Antworten sind konstruiert, Protokolle echt.", "One prompt is one sample. Choose a test, run the check, and read the real protocol. Answers are constructed, protocols are real.") + '</p></div>';
    }
    function tabs() {
      return '<div class="ls-ll-tabs" role="tablist">' + ORDER.map(function (id) {
        var t = TESTS[id];
        var done = isRun(id);
        return '<button type="button" role="tab" class="ls-ll-tab' + (state.test === id ? ' is-active' : '') + (done ? ' is-done' : '') + '" data-test="' + id + '" aria-selected="' + (state.test === id ? "true" : "false") + '" data-tip="' + L("Wechselt den Test; ein Häkchen markiert bereits gelaufene Tests.", "Switches the test; a check mark marks tests already run.") + '">' + (done ? '<span class="ls-ll-tab-check">✓</span> ' : '') + esc(t.label) + '</button>';
      }).join("") + '</div>';
    }
    function visualHead(t) {
      return '<div class="ls-ll-visual-head"><span>' + esc(t.kicker) + '</span><b>' + esc(t.title) + '</b></div>';
    }
    function taskHTML(t) {
      return '<div class="ls-ll-task"><span>' + L("Aufgabe", "Task") + '</span><b>' + esc(t.task) + '</b><p>' + esc(t.scenario) + '</p></div>';
    }
    function protocolHTML(t) {
      return '<div class="ls-ll-protocol"><b>' + L("So testest du es wirklich", "How to test it for real") + '</b><ol>' +
        t.protocol.map(function (step) { return '<li>' + esc(step) + '</li>'; }).join("") + '</ol></div>';
    }
    function runButton(id, revealed) {
      return '<button type="button" class="ls-ll-run" data-run="' + id + '" data-tip="' + L("Zeigt sofort das konstruierte Beispiel und das reale Protokoll.", "Shows the constructed example and the real protocol immediately.") + '">' + (revealed ? L("Prüfung erneut zeigen", "Show check again") : L("Prüfstand starten", "Start check")) + '</button>';
    }
    function visualParaphrase(t) {
      var revealed = isRun(t.id);
      var vars = t.variants.map(function (v) {
        return '<div class="ls-ll-var' + (revealed && !v.ok ? ' is-bad' : '') + '">' +
          '<span class="ls-ll-q">' + esc(v.q) + '</span>' +
          '<span class="ls-ll-arrow">→</span>' +
          '<span class="ls-ll-a' + (revealed ? (v.ok ? ' is-ok' : ' is-bad') : '') + '">' + (revealed ? esc(v.a) : '•••') + '</span>' +
          (revealed ? '<span class="ls-ll-badge ' + (v.ok ? 'is-ok' : 'is-bad') + '">' + (v.ok ? '✓' : '✗') + '</span>' : '') +
        '</div>';
      }).join("");
      return '<div class="ls-ll-visual">' + visualHead(t) + taskHTML(t) +
        '<div class="ls-ll-vars">' + vars + '</div>' +
        '<div class="ls-ll-consistency"><span>' + L("Konsistenz", "Consistency") + '</span><div class="ls-ll-meter-track"><i style="width:' + (revealed ? '66%' : '0%') + '"></i></div><b>' + (revealed ? "2 / 3" : "– / 3") + '</b></div>' +
        protocolHTML(t) +
        runButton(t.id, revealed) +
      '</div>';
    }
    function visualCitation(t) {
      var revealed = isRun(t.id);
      var answer = revealed ? '<div class="ls-ll-cite-card"><span class="ls-ll-cite-label">' + L("Konstruierte Antwort", "Constructed answer") + '</span><code>' + esc(t.answer) + '</code>' +
        '<div class="ls-ll-cite-actions"><button type="button" class="ls-ll-check" data-verify data-tip="' + L("Prüft DOI und Titel der erfundenen Angabe.", "Checks the DOI and title of the invented entry.") + '">' + L("Quelle prüfen", "Check source") + '</button></div>' +
        (state.verified ? '<div class="ls-ll-cite-result is-bad">' + esc(t.check) + '</div>' : '<div class="ls-ll-cite-result">' + L("Die Form ist korrekt. Aber existiert die Quelle?", "The shape is correct. But does the source exist?") + '</div>') +
      '</div>' : '<div class="ls-ll-wait' + (state.running === t.id ? ' is-running' : '') + '">' + (state.running === t.id ? L("Prüfung läuft …", "Running check …") : L("Noch nicht geprüft", "Not checked yet")) + '</div>';
      return '<div class="ls-ll-visual">' + visualHead(t) + taskHTML(t) +
        '<div class="ls-ll-prompt">' + esc(t.prompt) + '</div>' +
        answer + protocolHTML(t) +
        runButton(t.id, revealed) +
      '</div>';
    }
    function visualBoundary(t) {
      var revealed = isRun(t.id);
      var answer = revealed ? '<div class="ls-ll-answer"><b>' + esc(t.answer) + '</b><span class="ls-ll-conf">' + L("Konfidenz", "Confidence") + ' ' + t.conf + '%</span>' +
        '<div class="ls-ll-confbar"><i style="width:' + t.conf + '%"></i></div>' +
        '<button type="button" class="ls-ll-ask" data-ask data-tip="' + L("Fragt nach der Unsicherheit; das Modell bleibt trotzdem sicher.", "Asks for uncertainty; the model stays confident anyway.") + '">' + L("Unsicherheit anfordern", "Ask for uncertainty") + '</button>' +
        (state.asked ? '<p class="ls-ll-asked is-bad">' + esc(t.asked) + '</p>' : '') +
      '</div>' : '<div class="ls-ll-wait' + (state.running === t.id ? ' is-running' : '') + '">' + (state.running === t.id ? L("Prüfung läuft …", "Running check …") : L("Noch nicht geprüft", "Not checked yet")) + '</div>';
      return '<div class="ls-ll-visual">' + visualHead(t) + taskHTML(t) +
        '<div class="ls-ll-boundary">' +
          '<div class="ls-ll-b-world"><span>' + L("Dein Büro", "Your office") + '</span><b>?</b><small>' + L("privat, kein Zugriff", "private, no access") + '</small></div>' +
          '<div class="ls-ll-b-link">' + (revealed ? "?" : "—") + '</div>' +
          '<div class="ls-ll-b-model"><b>LLM</b><small>' + L("Trainingsdaten · Beispiel", "training data · example") + '</small></div>' +
        '</div>' +
        '<div class="ls-ll-prompt">' + esc(t.prompt) + '</div>' +
        answer + protocolHTML(t) +
        runButton(t.id, revealed) +
      '</div>';
    }
    function visualContext(t) {
      var revealed = isRun(t.id);
      var pos = t.positions[state.pos] || t.positions[1];
      var pct = [8, 50, 92][state.pos] || 50;
      var segments = "";
      for (var i = 0; i < 12; i++) segments += '<span></span>';
      return '<div class="ls-ll-visual">' + visualHead(t) + taskHTML(t) +
        '<div class="ls-ll-context-bar" aria-hidden="true">' + segments + '<i class="ls-ll-context-fact" style="left:' + pct + '%"></i><span class="ls-ll-context-mid">' + L("Mitte", "middle") + '</span></div>' +
        '<div class="ls-ll-pos">' + t.positions.map(function (p, idx) {
          return '<button type="button" class="ls-ll-posbtn' + (idx === state.pos ? ' is-active' : '') + '" data-pos="' + idx + '" data-tip="' + L("Legt den Fakt an diese Stelle im langen Dokument.", "Places the fact at this position in the long document.") + '">' + esc(p.label) + '</button>';
        }).join("") + '</div>' +
        '<div class="ls-ll-prompt">' + esc(t.prompt) + '</div>' +
        (revealed ? '<div class="ls-ll-answer ' + (pos.ok ? 'is-ok' : 'is-bad') + '"><b>' + esc(pos.answer) + '</b><span class="ls-ll-badge ' + (pos.ok ? 'is-ok' : 'is-bad') + '">' + (pos.ok ? '✓' : '✗') + '</span></div>' : '<div class="ls-ll-wait' + (state.running === t.id ? ' is-running' : '') + '">' + (state.running === t.id ? L("Prüfung läuft …", "Running check …") : L("Noch nicht geprüft", "Not checked yet")) + '</div>') +
        protocolHTML(t) +
        runButton(t.id, revealed) +
      '</div>';
    }
    function visual(t) {
      if (t.id === "paraphrase") return visualParaphrase(t);
      if (t.id === "citation") return visualCitation(t);
      if (t.id === "boundary") return visualBoundary(t);
      return visualContext(t);
    }
    function readout(t) {
      var revealed = isRun(t.id);
      var why = t.why;
      if (revealed && t.id === "citation" && state.verified && t.whyChecked) why = t.whyChecked;
      if (revealed && t.id === "boundary" && state.asked) why = t.asked;
      return '<div class="ls-ll-observe" data-tip="' + L("Die Beobachtung erscheint nach dem Start; darunter stehen Grund und Gegenmittel.", "The observation appears after starting; the reason and countermeasure follow below.") + '">' +
        '<div class="ls-ll-observe-head"><span>' + L("Beobachtung", "Observation") + '</span><b class="ls-ll-stamp">' + L("BEISPIEL", "EXAMPLE") + '</b></div>' +
        '<p class="ls-ll-observe-lead">' + esc(revealed ? t.observation : t.wait) + '</p>' +
        (revealed ? '<p class="ls-ll-why">' + esc(why) + '</p>' +
          (t.evidence ? '<p class="ls-ll-evidence"><b>' + L("Befund", "Finding") + ':</b> ' + esc(t.evidence) + '</p>' : '') +
          '<div class="ls-ll-fix"><b>' + L("Was hilft?", "What helps?") + ':</b> ' + esc(t.fix) + '</div>' +
          '<span class="ls-ll-cite"><b>' + L("Quelle", "Source") + ':</b> ' + esc(t.cite) + '</span>' : '') +
      '</div>';
    }
    function summary() {
      var count = ORDER.filter(isRun).length;
      return '<div class="ls-ll-summary" data-tip="' + L("Zählt die gelaufenen Tests; kein einzelner Test beweist Zuverlässigkeit.", "Counts the tests run; no single test proves reliability.") + '"><span>' + count + ' / 4 ' + L("Tests gelaufen", "tests run") + '</span><div class="ls-ll-summary-track"><i style="width:' + (count * 25) + '%"></i></div> <span>' + L("Kein Test beweist Zuverlässigkeit; erst Variationen zeigen, wo sie bricht.", "No single test proves reliability; only variations show where it breaks.") + '</span></div>';
    }
    function render() {
      var t = test();
      el.innerHTML = head() + tabs() + '<div class="ls-ll-board">' + visual(t) + readout(t) + '</div>' + summary();
    }
    function runTest(id) {
      clearTimer();
      state.test = id;
      state.verified = false;
      state.asked = false;
      state.running = null;
      state.run[id] = true;
      render();
    }
    function onClick(event) {
      var tab = event.target.closest ? event.target.closest("[data-test]") : null;
      if (tab && el.contains(tab)) {
        clearTimer();
        state.running = null;
        state.test = tab.getAttribute("data-test");
        render();
        return;
      }
      var run = event.target.closest ? event.target.closest("[data-run]") : null;
      if (run && el.contains(run)) { runTest(run.getAttribute("data-run")); return; }
      var verify = event.target.closest ? event.target.closest("[data-verify]") : null;
      if (verify && el.contains(verify)) { state.verified = true; render(); return; }
      var ask = event.target.closest ? event.target.closest("[data-ask]") : null;
      if (ask && el.contains(ask)) { state.asked = true; render(); return; }
      var pos = event.target.closest ? event.target.closest("[data-pos]") : null;
      if (pos && el.contains(pos)) {
        clearTimer();
        state.running = null;
        state.run.context = false;
        state.pos = parseInt(pos.getAttribute("data-pos"), 10) || 0;
        render();
      }
    }
    el.addEventListener("click", onClick);
    render();
    return {
      update: function (s) {
        if (s && s.test && TESTS[s.test] && s.test !== state.test) { state.test = s.test; render(); }
      },
      next: function () {
        var i = ORDER.indexOf(state.test);
        if (i < 0 || i >= ORDER.length - 1) return false;
        state.test = ORDER[i + 1];
        state.verified = false;
        state.asked = false;
        state.running = null;
        render();
        return true;
      },
      prev: function () {
        var i = ORDER.indexOf(state.test);
        if (i <= 0) return false;
        state.test = ORDER[i - 1];
        state.verified = false;
        state.asked = false;
        state.running = null;
        render();
        return true;
      },
      hasNext: function () { var i = ORDER.indexOf(state.test); return i >= 0 && i < ORDER.length - 1; },
      hasPrev: function () { return ORDER.indexOf(state.test) > 0; },
      resize: function () {},
      destroy: function () { clearTimer(); if (el.parentNode) el.parentNode.removeChild(el); }
    };
  }
  core.register("limitslab", limitsLabScene);
})();
