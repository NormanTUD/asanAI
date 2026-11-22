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
        title: L("Dieselbe Frage, andere Form", "Same question, different form"),
        prompt: L("Wie viele Beine hat eine Spinne?", "How many legs does a spider have?"),
        variants: [
          { q: L("„Wie viele Beine hat eine Spinne?“", "“How many legs does a spider have?”"), a: L("„Acht.“", "“Eight.”"), ok: true },
          { q: L("„Eine Spinne: wie viele Beine?“", "“A spider: how many legs?”"), a: L("„Sechs.“", "“Six.”"), ok: false },
          { q: L("„Antworte kurz: Beine einer Spinne?“", "“Answer briefly: legs of a spider?”"), a: L("„Acht.“", "“Eight.”"), ok: true }
        ],
        wait: L("Starte den Test: drei Formulierungen, eine Frage.", "Run the test: three phrasings, one question."),
        why: L("Die Frage ist dieselbe, die Formulierung ist anders. Das Modell antwortet nicht stabil. Ein einzelner Prompt zeigt nicht, ob es die Regel beherrscht.", "The question is the same; the wording is different. The model does not answer stably. A single prompt does not show whether it has learned the rule."),
        fix: L("Paraphrasen testen, Konsistenz messen, bei Abweichung nachfragen.", "Test paraphrases, measure consistency, ask again when answers diverge."),
        cite: "Sclar et al. (2023)"
      },
      citation: {
        id: "citation",
        label: L("Zitat", "Citation"),
        kicker: L("02 · Grounding", "02 · Grounding"),
        title: L("Die Form ist kein Beweis", "The shape is not proof"),
        prompt: L("Nenne eine Studie, die zeigt, dass Koffein die Reaktionszeit verbessert.", "Name a study showing that caffeine improves reaction time."),
        answer: "Müller & Schmidt (2019), Caffeine and Reaction Time, Journal of Psychopharmacology 33(4), 412–421. DOI 10.1177/0269881119823456",
        check: L("DOI nicht gefunden · Titel nicht gefunden", "DOI not found · title not found"),
        wait: L("Starte den Test: Das Modell soll eine Quelle nennen.", "Run the test: the model is asked for a source."),
        why: L("Das Modell hat die Form einer bibliografischen Angabe gelernt, keine Bibliothek. Es kann eine Quelle erfinden, die plausibel aussieht. Die Form ist kein Beweis.", "The model learned the shape of a bibliographic entry, not a library. It can invent a source that looks plausible. The shape is not proof."),
        whyChecked: L("Die Prüfung entlarvt das Zitat, liefert aber keinen Ersatz. Ohne echte Quelle bleibt die Behauptung unbelegt.", "The check exposes the citation but supplies no replacement. Without a real source, the claim remains unsupported."),
        fix: L("RAG, DOI und Titel prüfen, nur belegte Sätze zitieren.", "RAG, check DOI and title, cite only supported sentences."),
        cite: "Walters & Wilder (2023); Ji et al. (2023)"
      },
      boundary: {
        id: "boundary",
        label: L("Wissensgrenze", "Knowledge boundary"),
        kicker: L("03 · Kalibrierung", "03 · Calibration"),
        title: L("Kein Zugriff, trotzdem sicher", "No access, still confident"),
        prompt: L("Wie viele Fahrräder stehen heute vor meinem Büro in Leipzig?", "How many bicycles are in front of my office in Leipzig today?"),
        answer: L("14 Fahrräder", "14 bicycles"),
        conf: 91,
        asked: L("Auf Nachfrage bleibt es bei 14. Das Modell hat keinen Zugriff und zeigt keine Unsicherheit.", "When asked again, it stays at 14. The model has no access and shows no uncertainty."),
        wait: L("Starte den Test: Das Modell soll etwas über dein Büro sagen.", "Run the test: the model is asked about your office."),
        why: L("Das Modell hat keinen Zugriff auf dein Büro, deine Akte oder das Wetter. Es kann trotzdem confident antworten. Kalibrierung ist nicht garantiert; Zugriff und Rückfragen fehlen.", "The model has no access to your office, your file, or the weather. It can still answer confidently. Calibration is not guaranteed; access and follow-up questions are missing."),
        fix: L("Retrieval, Werkzeuge, Rückfragen, „Ich weiß es nicht“ als gültige Antwort.", "Retrieval, tools, follow-up questions, “I do not know” as a valid answer."),
        cite: "Kadavath et al. (2022); Ji et al. (2023)"
      },
      context: {
        id: "context",
        label: L("Kontext", "Context"),
        kicker: L("04 · Arbeitsgedächtnis", "04 · Working memory"),
        title: L("Die Mitte geht unter", "The middle gets lost"),
        prompt: L("Wann endet der Vertrag?", "When does the contract end?"),
        fact: L("Der Vertrag endet am 14. März 2027.", "The contract ends on 14 March 2027."),
        positions: [
          { label: L("Anfang", "Start"), answer: L("14. März 2027", "14 March 2027"), ok: true },
          { label: L("Mitte", "Middle"), answer: L("14. März 2025", "14 March 2025"), ok: false },
          { label: L("Ende", "End"), answer: L("14. März 2027", "14 March 2027"), ok: true }
        ],
        wait: L("Starte den Test: Der Fakt steht an einer Stelle im langen Kontext.", "Run the test: the fact sits somewhere in a long context."),
        why: L("Das Arbeitsgedächtnis ist der Kontext. Informationen in der Mitte langer Kontexte werden schlechter genutzt. Die Position im Prompt ist Teil des Ergebnisses.", "Working memory is the context. Information in the middle of long contexts is used less well. Position in the prompt is part of the result."),
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
      return '<div class="ls-ll-head"><span class="ls-ll-kicker">' + L("Zuverlässigkeit · Prüfstand", "Reliability · test bench") + '</span><b>' + L("Ein Prompt ist kein Test", "One prompt is not a test") + '</b><p>' + L("Wähle einen Test, starte ihn und sieh, was bricht.", "Choose a test, run it, and see what breaks.") + '</p></div>';
    }
    function tabs() {
      return '<div class="ls-ll-tabs" role="tablist">' + ORDER.map(function (id) {
        var t = TESTS[id];
        return '<button type="button" role="tab" class="ls-ll-tab' + (state.test === id ? ' is-active' : '') + '" data-test="' + id + '" aria-selected="' + (state.test === id ? "true" : "false") + '">' + esc(t.label) + '</button>';
      }).join("") + '</div>';
    }
    function visualHead(t) {
      return '<div class="ls-ll-visual-head"><span>' + esc(t.kicker) + '</span><b>' + esc(t.title) + '</b></div>';
    }
    function runButton(id, revealed) {
      return '<button type="button" class="ls-ll-run" data-run="' + id + '">' + (revealed ? L("Nochmal starten", "Run again") : L("Test starten", "Run test")) + '</button>';
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
      return '<div class="ls-ll-visual">' + visualHead(t) +
        '<div class="ls-ll-vars">' + vars + '</div>' +
        '<div class="ls-ll-consistency"><span>' + L("Konsistenz", "Consistency") + '</span><div class="ls-ll-meter-track"><i style="width:' + (revealed ? '66%' : '0%') + '"></i></div><b>' + (revealed ? "2 / 3" : "– / 3") + '</b></div>' +
        runButton(t.id, revealed) +
      '</div>';
    }
    function visualCitation(t) {
      var revealed = isRun(t.id);
      var answer = revealed ? '<div class="ls-ll-cite-card"><span class="ls-ll-cite-label">' + L("Antwort des Modells", "Model answer") + '</span><code>' + esc(t.answer) + '</code>' +
        '<div class="ls-ll-cite-actions"><button type="button" class="ls-ll-check" data-verify>' + L("Quelle prüfen", "Check source") + '</button></div>' +
        (state.verified ? '<div class="ls-ll-cite-result is-bad">' + esc(t.check) + '</div>' : '<div class="ls-ll-cite-result">' + L("Die Form ist korrekt. Aber existiert die Quelle?", "The shape is correct. But does the source exist?") + '</div>') +
      '</div>' : '<div class="ls-ll-wait' + (state.running === t.id ? ' is-running' : '') + '">' + (state.running === t.id ? L("Antwort wird erzeugt ...", "Generating answer ...") : L("Antwort erzeugen", "Generate answer")) + '</div>';
      return '<div class="ls-ll-visual">' + visualHead(t) +
        '<div class="ls-ll-prompt">' + esc(t.prompt) + '</div>' +
        answer +
        runButton(t.id, revealed) +
      '</div>';
    }
    function visualBoundary(t) {
      var revealed = isRun(t.id);
      var answer = revealed ? '<div class="ls-ll-answer"><b>' + esc(t.answer) + '</b><span class="ls-ll-conf">' + L("Konfidenz", "Confidence") + ' ' + t.conf + '%</span>' +
        '<div class="ls-ll-confbar"><i style="width:' + t.conf + '%"></i></div>' +
        '<button type="button" class="ls-ll-ask" data-ask>' + L("Unsicherheit anfordern", "Ask for uncertainty") + '</button>' +
        (state.asked ? '<p class="ls-ll-asked is-bad">' + esc(t.asked) + '</p>' : '') +
      '</div>' : '<div class="ls-ll-wait' + (state.running === t.id ? ' is-running' : '') + '">' + (state.running === t.id ? L("Antwort wird erzeugt ...", "Generating answer ...") : L("Antwort erzeugen", "Generate answer")) + '</div>';
      return '<div class="ls-ll-visual">' + visualHead(t) +
        '<div class="ls-ll-boundary">' +
          '<div class="ls-ll-b-world"><span>' + L("Dein Büro", "Your office") + '</span><b>?</b><small>' + L("privat, kein Zugriff", "private, no access") + '</small></div>' +
          '<div class="ls-ll-b-link">' + (revealed ? "?" : "—") + '</div>' +
          '<div class="ls-ll-b-model"><b>LLM</b><small>' + L("Trainingsdaten", "training data") + '</small></div>' +
        '</div>' +
        '<div class="ls-ll-prompt">' + esc(t.prompt) + '</div>' +
        answer +
        runButton(t.id, revealed) +
      '</div>';
    }
    function visualContext(t) {
      var revealed = isRun(t.id);
      var pos = t.positions[state.pos] || t.positions[1];
      var pct = [8, 50, 92][state.pos] || 50;
      var segments = "";
      for (var i = 0; i < 12; i++) segments += '<span></span>';
      return '<div class="ls-ll-visual">' + visualHead(t) +
        '<div class="ls-ll-context-bar" aria-hidden="true">' + segments + '<i class="ls-ll-context-fact" style="left:' + pct + '%"></i><span class="ls-ll-context-mid">' + L("Mitte", "middle") + '</span></div>' +
        '<div class="ls-ll-pos">' + t.positions.map(function (p, idx) {
          return '<button type="button" class="ls-ll-posbtn' + (idx === state.pos ? ' is-active' : '') + '" data-pos="' + idx + '">' + esc(p.label) + '</button>';
        }).join("") + '</div>' +
        '<div class="ls-ll-prompt">' + esc(t.prompt) + '</div>' +
        (revealed ? '<div class="ls-ll-answer ' + (pos.ok ? 'is-ok' : 'is-bad') + '"><b>' + esc(pos.answer) + '</b><span class="ls-ll-badge ' + (pos.ok ? 'is-ok' : 'is-bad') + '">' + (pos.ok ? '✓' : '✗') + '</span></div>' : '<div class="ls-ll-wait' + (state.running === t.id ? ' is-running' : '') + '">' + (state.running === t.id ? L("Antwort wird erzeugt ...", "Generating answer ...") : L("Antwort erzeugen", "Generate answer")) + '</div>') +
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
      return '<div class="ls-ll-readout">' +
        '<div class="ls-ll-readout-head"><span>' + esc(t.kicker) + '</span><b>' + esc(t.title) + '</b></div>' +
        '<p class="ls-ll-why">' + esc(revealed ? why : t.wait) + '</p>' +
        (revealed ? '<div class="ls-ll-fix"><b>' + L("Was hilft?", "What helps?") + ':</b> ' + esc(t.fix) + '</div>' +
          '<span class="ls-ll-cite"><b>' + L("Quelle", "Source") + ':</b> ' + esc(t.cite) + '</span>' : '') +
      '</div>';
    }
    function summary() {
      var count = ORDER.filter(isRun).length;
      return '<div class="ls-ll-summary"><span>' + count + ' / 4 ' + L("Tests gelaufen", "tests run") + '</span><div class="ls-ll-summary-track"><i style="width:' + (count * 25) + '%"></i></div><span>' + L("Stress-Tests, keine Benchmark-Werte.", "Stress tests, not benchmark scores.") + '</span></div>';
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
