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
        label: L("Paraphrase", "Paraphrase"),
        kicker: L("01 · Stabilität", "01 · Stability"),
        title: L("Dieselbe Absicht, andere Form", "Same intent, different form"),
        task: L("Support-Ticket klassifizieren", "Classify a support ticket"),
        scenario: L("Drei Formulierungen derselben Beschwerde. Das Label soll stabil bleiben.", "Three phrasings of the same complaint. The label should stay stable."),
        prompt: L("Meine Bestellung ist seit zwei Wochen nicht da. Ich möchte sie stornieren.", "My order has not arrived for two weeks. I want to cancel it."),
        variants: [
          { q: L("„Meine Bestellung ist seit zwei Wochen nicht da. Ich möchte sie stornieren.“", "“My order has not arrived for two weeks. I want to cancel it.”"), a: L("„Storno“", "“Cancel”"), ok: true },
          { q: L("„Paket kommt nicht an, Bestellung bitte abbrechen.“", "“Parcel is not arriving, please cancel the order.”"), a: L("„Storno“", "“Cancel”"), ok: true },
          { q: L("„Sendung ist zu spät, ich brauche sie nicht mehr.“", "“Delivery is late, I no longer need it.”"), a: L("„Versandstatus“", "“Shipping status”"), ok: false }
        ],
        protocol: [
          L("10 bedeutungsgleiche Formulierungen", "10 meaning-preserving phrasings"),
          L("3 Wiederholungen pro Formulierung", "3 repetitions per phrasing"),
          L("Label-Konsistenz messen", "measure label consistency")
        ],
        observation: L("2 von 3 Varianten erhalten „Storno“, eine „Versandstatus“. Die Absicht ist gleich, das Label nicht.", "2 of 3 variants get “Cancel”, one gets “Shipping status”. The intent is the same, the label is not."),
        wait: L("Noch nicht simuliert. Die Beobachtung erscheint nach dem Start.", "Not simulated yet. The observation appears after you start."),
        why: L("Die Absicht ist dieselbe, die Formulierung ist anders. Das Modell antwortet nicht stabil. Ein einzelner Prompt ist eine Stichprobe.", "The intent is the same; the wording is different. The model does not answer stably. A single prompt is one sample."),
        fix: L("Paraphrasen testen, Konsistenz messen, bei Abweichung nachfragen.", "Test paraphrases, measure consistency, ask again when answers diverge."),
        cite: "Sclar et al. (2023)"
      },
      citation: {
        id: "citation",
        label: L("Zitat", "Citation"),
        kicker: L("02 · Grounding", "02 · Grounding"),
        title: L("Die Form ist kein Beweis", "The shape is not proof"),
        task: L("Quellenangabe für einen Artikel", "Source for an article"),
        scenario: L("Das Modell soll eine Studie für eine Aussage nennen. Die Form allein sagt nichts über Existenz.", "The model is asked for a study supporting a claim. The shape alone says nothing about existence."),
        prompt: L("Nenne eine Studie, die zeigt, dass Koffein die Reaktionszeit verbessert.", "Name a study showing that caffeine improves reaction time."),
        answer: "Müller & Schmidt (2019), Caffeine and Reaction Time, Journal of Psychopharmacology 33(4), 412–421. DOI 10.1177/0269881119823456",
        check: L("DOI nicht gefunden · Titel nicht gefunden", "DOI not found · title not found"),
        protocol: [
          L("DOI auflösen", "resolve the DOI"),
          L("Titel, Autoren und Journal in Crossref/PubMed suchen", "search title, authors, and journal in Crossref/PubMed"),
          L("Zitatstelle im PDF prüfen", "check the quoted passage in the PDF")
        ],
        observation: L("Die Angabe sieht vollständig aus; DOI und Titel existieren nicht.", "The entry looks complete; the DOI and title do not exist."),
        wait: L("Noch nicht simuliert. Die Beobachtung erscheint nach dem Start.", "Not simulated yet. The observation appears after you start."),
        why: L("Das Modell hat die Form einer bibliografischen Angabe gelernt, keine Bibliothek. Die Form ist kein Beweis.", "The model learned the shape of a bibliographic entry, not a library. The shape is not proof."),
        whyChecked: L("Die Form ist kein Beweis: Die Prüfung entlarvt das Zitat, liefert aber keinen Ersatz. Ohne echte Quelle bleibt die Behauptung unbelegt.", "The shape is not proof: the check exposes the citation but supplies no replacement. Without a real source, the claim remains unsupported."),
        fix: L("RAG, DOI und Titel prüfen, nur belegte Sätze zitieren.", "RAG, check DOI and title, cite only supported sentences."),
        cite: "Walters & Wilder (2023); Ji et al. (2023)"
      },
      boundary: {
        id: "boundary",
        label: L("Wissensgrenze", "Knowledge boundary"),
        kicker: L("03 · Kalibrierung", "03 · Calibration"),
        title: L("Kein Zugriff, trotzdem sicher", "No access, still confident"),
        task: L("Aktuelle Auskunft einholen", "Get a current piece of information"),
        scenario: L("Gefragt sind die heutigen Öffnungszeiten des Bürgeramts. Das Modell hat keinen Zugriff auf den aktuellen Aushang.", "The question is today's opening hours of the city office. The model has no access to the current notice."),
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
        wait: L("Noch nicht simuliert. Die Beobachtung erscheint nach dem Start.", "Not simulated yet. The observation appears after you start."),
        why: L("Kein Zugriff auf aktuelle oder private Daten; Kalibrierung ist nicht garantiert.", "No access to current or private data; calibration is not guaranteed."),
        fix: L("Retrieval, Werkzeuge, Rückfragen, Unsicherheit anzeigen.", "Retrieval, tools, follow-up questions, show uncertainty."),
        cite: "Kadavath et al. (2022); Ji et al. (2023)"
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
        wait: L("Noch nicht simuliert. Die Beobachtung erscheint nach dem Start.", "Not simulated yet. The observation appears after you start."),
        why: L("Das Arbeitsgedächtnis ist der Kontext. Die Mitte langer Kontexte wird schlechter genutzt (Liu et al., 2023). RAG kann das verstärken, wenn es viele Chunks packt.", "Working memory is the context. The middle of long contexts is used less well (Liu et al., 2023). RAG can amplify this when it packs many chunks."),
        fix: L("Wichtiges an den Rand, Retrieval und Chunking, Zitatstelle verlangen.", "Put important facts at the edges, use retrieval and chunking, ask for the supporting quote."),
        cite: "Liu et al. (2023)"
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
      return '<div class="ls-ll-head"><span class="ls-ll-kicker">' + L("Zuverlässigkeit · Prüfstand", "Reliability · test bench") + '</span><b>' + L("Vier Bruchstellen, kein Benchmark", "Four failure points, not a benchmark") + '</b><p>' + L("Ein Prompt ist eine Stichprobe. Wähle einen Test, starte die Simulation und lies das reale Protokoll. Antworten sind konstruiert, Protokolle echt.", "One prompt is one sample. Choose a test, run the simulation, and read the real protocol. Answers are constructed, protocols are real.") + '</p></div>';
    }
    function tabs() {
      return '<div class="ls-ll-tabs" role="tablist">' + ORDER.map(function (id) {
        var t = TESTS[id];
        var done = isRun(id);
        return '<button type="button" role="tab" class="ls-ll-tab' + (state.test === id ? ' is-active' : '') + (done ? ' is-done' : '') + '" data-test="' + id + '" aria-selected="' + (state.test === id ? "true" : "false") + '">' + (done ? '<span class="ls-ll-tab-check">✓</span> ' : '') + esc(t.label) + '</button>';
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
      return '<button type="button" class="ls-ll-run" data-run="' + id + '">' + (revealed ? L("Simulation erneut ansehen", "View simulation again") : L("Simulation ansehen", "View simulation")) + '</button>';
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
      var answer = revealed ? '<div class="ls-ll-cite-card"><span class="ls-ll-cite-label">' + L("Simulierte Antwort", "Simulated answer") + '</span><code>' + esc(t.answer) + '</code>' +
        '<div class="ls-ll-cite-actions"><button type="button" class="ls-ll-check" data-verify>' + L("Quelle prüfen", "Check source") + '</button></div>' +
        (state.verified ? '<div class="ls-ll-cite-result is-bad">' + esc(t.check) + '</div>' : '<div class="ls-ll-cite-result">' + L("Die Form ist korrekt. Aber existiert die Quelle?", "The shape is correct. But does the source exist?") + '</div>') +
      '</div>' : '<div class="ls-ll-wait' + (state.running === t.id ? ' is-running' : '') + '">' + (state.running === t.id ? L("Simulation läuft …", "Running simulation …") : L("Noch nicht simuliert", "Not simulated yet")) + '</div>';
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
        '<button type="button" class="ls-ll-ask" data-ask>' + L("Unsicherheit anfordern", "Ask for uncertainty") + '</button>' +
        (state.asked ? '<p class="ls-ll-asked is-bad">' + esc(t.asked) + '</p>' : '') +
      '</div>' : '<div class="ls-ll-wait' + (state.running === t.id ? ' is-running' : '') + '">' + (state.running === t.id ? L("Simulation läuft …", "Running simulation …") : L("Noch nicht simuliert", "Not simulated yet")) + '</div>';
      return '<div class="ls-ll-visual">' + visualHead(t) + taskHTML(t) +
        '<div class="ls-ll-boundary">' +
          '<div class="ls-ll-b-world"><span>' + L("Dein Büro", "Your office") + '</span><b>?</b><small>' + L("privat, kein Zugriff", "private, no access") + '</small></div>' +
          '<div class="ls-ll-b-link">' + (revealed ? "?" : "—") + '</div>' +
          '<div class="ls-ll-b-model"><b>LLM</b><small>' + L("Trainingsdaten · simuliert", "training data · simulated") + '</small></div>' +
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
          return '<button type="button" class="ls-ll-posbtn' + (idx === state.pos ? ' is-active' : '') + '" data-pos="' + idx + '">' + esc(p.label) + '</button>';
        }).join("") + '</div>' +
        '<div class="ls-ll-prompt">' + esc(t.prompt) + '</div>' +
        (revealed ? '<div class="ls-ll-answer ' + (pos.ok ? 'is-ok' : 'is-bad') + '"><b>' + esc(pos.answer) + '</b><span class="ls-ll-badge ' + (pos.ok ? 'is-ok' : 'is-bad') + '">' + (pos.ok ? '✓' : '✗') + '</span></div>' : '<div class="ls-ll-wait' + (state.running === t.id ? ' is-running' : '') + '">' + (state.running === t.id ? L("Simulation läuft …", "Running simulation …") : L("Noch nicht simuliert", "Not simulated yet")) + '</div>') +
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
      return '<div class="ls-ll-observe">' +
        '<div class="ls-ll-observe-head"><span>' + L("Beobachtung", "Observation") + '</span><b class="ls-ll-stamp">' + L("SIMULIERT", "SIMULATED") + '</b></div>' +
        '<p class="ls-ll-observe-lead">' + esc(revealed ? t.observation : t.wait) + '</p>' +
        (revealed ? '<p class="ls-ll-why">' + esc(why) + '</p>' +
          '<div class="ls-ll-fix"><b>' + L("Was hilft?", "What helps?") + ':</b> ' + esc(t.fix) + '</div>' +
          '<span class="ls-ll-cite"><b>' + L("Quelle", "Source") + ':</b> ' + esc(t.cite) + '</span>' : '') +
      '</div>';
    }
    function summary() {
      var count = ORDER.filter(isRun).length;
      return '<div class="ls-ll-summary"><span>' + count + ' / 4 ' + L("Tests gelaufen", "tests run") + '</span><div class="ls-ll-summary-track"><i style="width:' + (count * 25) + '%"></i></div> <span>' + L("Kein Test beweist Zuverlässigkeit; erst Variationen zeigen, wo sie bricht.", "No single test proves reliability; only variations show where it breaks.") + '</span></div>';
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
      state.run[id] = false;
      if (reduced) { state.running = null; state.run[id] = true; render(); return; }
      state.running = id;
      render();
      timer = setTimeout(function () {
        timer = 0;
        state.running = null;
        state.run[id] = true;
        render();
      }, 520);
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
      next: function () { return false; },
      prev: function () { return false; },
      hasNext: function () { return false; },
      hasPrev: function () { return false; },
      resize: function () {},
      destroy: function () { clearTimer(); if (el.parentNode) el.parentNode.removeChild(el); }
    };
  }
  core.register("limitslab", limitsLabScene);
})();
