(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function limitsLabScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc;
    function L(de, en) { return DE ? de : en; }
    var ORDER = ["format", "citation", "boundary", "context"];
    var TESTS = {
      format: {
        label: L("Formatierung", "Formatting"),
        title: L("Gleiches Ticket, zwei Formate", "Same ticket, two formats"),
        lead: L("Das Modell klassifiziert denselben Text einmal als Fließtext und einmal als Chat. Das Label soll gleich bleiben.", "The model classifies the same text once as plain text and once as chat. The label should stay the same."),
        cases: [
          { label: L("Text A · Fließtext", "Text A · plain text"), text: L("Aufgabe: Klassifiziere das Ticket.\nTicket: „Mein Paket ist zu spät, ich möchte stornieren.“\nLabel:", "Task: classify the ticket.\nTicket: “My parcel is late, I want to cancel.”\nLabel:"), answer: L("Storno", "Cancel"), ok: true },
          { label: L("Text B · Chat-Format", "Text B · chat format"), text: L("System: Du bist ein Klassifikator.\nUser: „Mein Paket ist zu spät, ich möchte stornieren.“\nAssistant:", "System: You are a classifier.\nUser: “My parcel is late, I want to cancel.”\nAssistant:"), answer: L("Versandstatus", "Shipping status"), ok: false }
        ],
        result: L("Gleiche Bedeutung, anderes Label.", "Same meaning, different label."),
        aha: L("Darum funktioniert derselbe Prompt in einem anderen Tool plötzlich anders: Das Format ist ein Teil der Eingabe.", "This is why the same prompt suddenly behaves differently in another tool: the format is part of the input."),
        why: L("Die äußere Form verändert die Antwort.", "The outer form changes the answer."),
        fix: L("Mehrere Formate testen und die Streuung berichten.", "Test several formats and report the spread."),
        source: L("Sclar et al. (2023): bis zu 76 Genauigkeitspunkte Unterschied zwischen bedeutungserhaltenden Prompt-Formaten.", "Sclar et al. (2023): up to 76 accuracy points between meaning-preserving prompt formats."),
        url: "https://arxiv.org/abs/2310.11324",
        practice: [L("Drei bis fünf plausible Formate testen.", "Test three to five plausible formats."), L("Min/Max der Ergebnisse berichten.", "Report the min/max result."), L("Das Format erst nach der Prüfung einfrieren.", "Freeze the format only after checking.")]
      },
      citation: {
        label: L("Zitat", "Citation"),
        title: L("Die Antwort nennt eine Quelle", "The answer names a source"),
        lead: L("Das ist die vollständige Antwort des Modells. Danach prüfen wir, ob die Arbeit wirklich existiert.", "This is the model's complete answer. Then we check whether the work really exists."),
        question: L("Nenne eine Studie, die zeigt, dass Koffein die Reaktionszeit verbessert.", "Name a study showing that caffeine improves reaction time."),
        answer: "Müller & Schmidt (2019), Caffeine and Reaction Time, Journal of Psychopharmacology 33(4), 412–421. DOI 10.1177/0269881119823456",
        check: L("DOI nicht gefunden · Titel nicht gefunden", "DOI not found · title not found"),
        result: L("Die Angabe sieht vollständig aus, aber die Quelle existiert nicht.", "The entry looks complete, but the source does not exist."),
        aha: L("Darum kannst du eine perfekt aussehende Quelle nicht einfach übernehmen: Aussehen ist nicht Auffindbarkeit.", "This is why a perfect-looking citation cannot simply be trusted: appearance is not findability."),
        why: L("Das Modell erzeugt die Oberfläche einer Literaturangabe, keine Bibliotheksabfrage.", "The model generates the surface of a citation, not a library lookup."),
        fix: L("DOI und Titel auflösen und nur belegte Quellen zitieren.", "Resolve the DOI and title and cite only verified sources."),
        source: L("Walters & Wilder (2023): 51 % erfundene Zitate über sechs Studien; GPT-3.5 55 %, GPT-4 18 %.", "Walters & Wilder (2023): 51% fabricated citations across six studies; GPT-3.5 55%, GPT-4 18%."),
        url: "https://www.nature.com/articles/s41598-023-41032-5",
        practice: [L("DOI und Titel in einer Bibliothek auflösen.", "Resolve DOI and title in a library."), L("Nur gefundene Quellen zitieren.", "Cite only sources you found."), L("RAG mit echtem Korpus statt Modellgedächtnis.", "RAG with a real corpus, not model memory.")]
      },
      boundary: {
        label: L("Kalibrierung", "Calibration"),
        title: L("Das Modell antwortet ohne Zugriff", "The model answers without access"),
        lead: L("Die Frage braucht den heutigen Aushang. Das Modell hat keinen Zugriff; trotzdem klingt die Antwort sicher.", "The question needs today's notice. The model has no access, yet the answer sounds certain."),
        question: L("Welche Öffnungszeiten hat das Bürgeramt heute?", "What are the city office's opening hours today?"),
        answer: L("Heute 8–16 Uhr", "Today 8–16"),
        conf: 91,
        result: L("Sicher, aber ohne Quelle.", "Confident, but without a source."),
        aha: L("Darum klingt die KI sicher, obwohl sie den aktuellen Aushang gar nicht kennen kann.", "This is why the AI sounds certain even though it cannot know the current notice."),
        why: L("Konfidenz ist ein gelerntes Signal, kein Zugriff auf die Welt.", "Confidence is a learned signal, not access to the world."),
        fix: L("Retrieval oder ein Werkzeug nutzen und Unsicherheit sichtbar machen.", "Use retrieval or a tool and make uncertainty visible."),
        source: L("Kadavath et al. (2022): Konfidenz ist oft nützlich, bleibt aber nicht überall kalibriert.", "Kadavath et al. (2022): confidence is often useful but does not remain calibrated everywhere."),
        url: "https://arxiv.org/abs/2207.05221",
        practice: [L("Zugriff prüfen: Quelle oder Werkzeug?", "Check access: source or tool?"), L("„Weiß nicht“ als Antwort erlauben.", "Allow “I don't know” as an answer."), L("Unsicherheit sichtbar machen, nicht nur Prozent.", "Show uncertainty, not just a percentage.")]
      },
      context: {
        label: L("Kontext", "Context"),
        title: L("Der Fakt steht an drei Stellen", "The fact sits in three places"),
        lead: L("Derselbe Vertrag, dieselbe Frage. Nur die Position der entscheidenden Klausel ändert sich.", "The same contract, the same question. Only the position of the decisive clause changes."),
        question: L("Wann endet der Vertrag?", "When does the contract end?"),
        fact: L("Der Vertrag endet am 14. März 2027.", "The contract ends on 14 March 2027."),
        cases: [
          { label: L("Klausel am Anfang", "Clause at the start"), answer: L("14. März 2027", "14 March 2027"), ok: true },
          { label: L("Klausel in der Mitte", "Clause in the middle"), answer: L("14. März 2025", "14 March 2025"), ok: false },
          { label: L("Klausel am Ende", "Clause at the end"), answer: L("14. März 2027", "14 March 2027"), ok: true }
        ],
        result: L("Anfang und Ende liefern 2027; in der Mitte antwortet das Modell mit 2025.", "Start and end give 2027; in the middle the model answers 2025."),
        aha: L("Darum übersieht die KI eine wichtige Stelle mitten im langen Dokument, obwohl sie am Anfang und Ende sitzt.", "This is why the AI misses an important passage in the middle of a long document even though it is there."),
        why: L("Relevante Information am Anfang und Ende wird besser genutzt als in der Mitte.", "Relevant information at the start and end is used better than in the middle."),
        fix: L("Wichtiges an den Rand legen und die Belegstelle verlangen.", "Put important facts at the edges and ask for the supporting quote."),
        source: L("Liu et al. (2023): U-förmige Nutzung langer Kontexte, auch bei langkontextfähigen Modellen.", "Liu et al. (2023): U-shaped use of long contexts, even for long-context models."),
        url: "https://arxiv.org/abs/2307.03172",
        practice: [L("Wichtiges an Anfang oder Ende legen.", "Put key facts at the start or end."), L("Die Belegstelle zitieren lassen.", "Require the supporting quote."), L("Chunks und Reihenfolge explizit prüfen.", "Check chunks and order explicitly.")]
      }
    };
    var state = { test: "format", run: {}, checked: false };
    var el = document.createElement("div");
    el.className = "ls-ll";
    root.appendChild(el);
    function type() { return TESTS[state.test]; }
    function index() { return ORDER.indexOf(state.test); }
    function isRun() { return !!state.run[state.test]; }
    function answer(t, value) { return isRun() ? esc(value) : "?"; }

    function top(t) {
      var dots = ORDER.map(function (id, i) { return '<i class="' + (i === index() ? 'is-on' : i < index() ? 'is-done' : '') + '"></i>'; }).join("");
      return '<div class="ls-ll-top"><span class="ls-ll-step">' + L("Test ", "Test ") + (index() + 1) + ' / ' + ORDER.length + '</span><span class="ls-ll-kind">' + esc(t.label) + '</span><span class="ls-ll-dots" aria-hidden="true">' + dots + '</span></div>' +
        '<b class="ls-ll-title">' + esc(t.title) + '</b><p class="ls-ll-lead">' + esc(t.lead) + '</p>';
    }
    function question(t) {
      if (!t.question) return "";
      return '<div class="ls-ll-question"><span>' + L("Die Frage", "The question") + '</span><b>' + esc(t.question) + '</b></div>';
    }
    function formatDemo(t) {
      return '<div class="ls-ll-cases">' + t.cases.map(function (c) {
        return '<div class="ls-ll-case' + (isRun() && !c.ok ? ' is-bad' : '') + '"><span>' + esc(c.label) + '</span><pre>' + esc(c.text) + '</pre><div class="ls-ll-case-out"><span>' + L("Antwort", "Answer") + '</span><b>' + answer(t, c.answer) + '</b></div></div>';
      }).join("") + '</div>';
    }
    function citationDemo(t) {
      if (!isRun()) return '<div class="ls-ll-wait">' + L("Noch nicht geprüft. Klicke auf „Prüfstand starten“.", "Not checked yet. Click “Start check”.") + '</div>';
      return '<div class="ls-ll-cite"><span>' + L("Antwort des Modells", "Model answer") + '</span><code>' + esc(t.answer) + '</code><button type="button" class="ls-ll-check" data-check>' + (state.checked ? L("Erneut prüfen", "Check again") : L("DOI und Titel prüfen", "Check DOI and title")) + '</button>' + (state.checked ? '<p class="ls-ll-check-result is-bad">' + esc(t.check) + '</p>' : '') + '</div>';
    }
    function boundaryDemo(t) {
      return '<div class="ls-ll-seven"><div class="ls-ll-seven-row"><span>' + L("Frage", "Question") + '</span><b>' + esc(t.question) + '</b></div><div class="ls-ll-seven-row"><span>' + L("Antwort", "Answer") + '</span><b>' + (isRun() ? esc(t.answer) : "?") + '</b></div><div class="ls-ll-seven-row"><span>' + L("Konfidenz", "Confidence") + '</span><b>' + (isRun() ? t.conf + " %" : "?") + '</b></div><div class="ls-ll-seven-row"><span>' + L("Quelle", "Source") + '</span><b class="is-bad">' + L("keine", "none") + '</b></div></div>';
    }
    function contextDemo(t) {
      return '<div class="ls-ll-cases ls-ll-cases--rows">' + t.cases.map(function (c) {
        return '<div class="ls-ll-case' + (isRun() && !c.ok ? ' is-bad' : '') + '"><span>' + esc(c.label) + '</span><div class="ls-ll-case-out"><span>' + L("Antwort", "Answer") + '</span><b>' + answer(t, c.answer) + '</b></div></div>';
      }).join("") + '</div>';
    }
    function demo(t) {
      var html;
      if (t === TESTS.format) html = formatDemo(t);
      else if (t === TESTS.citation) html = citationDemo(t);
      else if (t === TESTS.boundary) html = boundaryDemo(t);
      else html = contextDemo(t);
      return '<div class="ls-ll-demo">' + html + '</div>';
    }
    function result(t) {
      if (!isRun()) return '<div class="ls-ll-result is-waiting"><div class="ls-ll-result-head"><span>' + L("Ergebnis", "Result") + '</span></div><p>' + L("Starte den Prüfstand, dann erscheint hier das Ergebnis.", "Start the check; the result will appear here.") + '</p></div>';
      return '<div class="ls-ll-result"><div class="ls-ll-result-head"><span>' + L("Ergebnis", "Result") + '</span><b class="ls-ll-stamp">' + L("BEISPIEL", "EXAMPLE") + '</b></div><b>' + esc(t.result) + '</b><p class="ls-ll-aha"><b>' + L("Aha", "Aha") + '</b> ' + esc(t.aha) + '</p><p class="ls-ll-observe-lead"><b>' + L("Warum?", "Why?") + '</b> ' + esc(t.why) + '</p><p class="ls-ll-why"><b>' + L("Was hilft?", "What helps?") + '</b> ' + esc(t.fix) + '</p><p class="ls-ll-source"><b>' + L("Quelle", "Source") + ':</b> ' + (t.url ? '<a href="' + t.url + '" target="_blank" rel="noopener">' + esc(t.source) + '</a>' : esc(t.source)) + '</p></div>';
    }
    function practice(t) {
      return '<div class="ls-ll-practice"><b>' + L("Bevor du der Antwort glaubst", "Before you trust the answer") + '</b>' + (t.practice || []).map(function (p, i) { return '<span><i>' + (i + 1) + '</i>' + esc(p) + '</span>'; }).join("") + '</div>';
    }
    function render() {
      var t = type();
      el.style.setProperty("--ll-accent", ["var(--ls-blue)", "var(--ls-gold)", "#c95656", "var(--ls-green)"][index()] || "var(--ls-petrol)");
      el.innerHTML = top(t) + question(t) + demo(t) + result(t) + practice(t) + '<div class="ls-ll-footer"><button type="button" class="ls-ll-run" data-run>' + (isRun() ? L("Ergebnis erneut zeigen", "Show result again") : L("Prüfstand starten", "Start check")) + '</button><span>' + L("Weiter mit ← → oder Next", "Continue with ← → or Next") + '</span></div>';
    }
    function runCurrent() { state.run[state.test] = true; state.checked = false; render(); }
    el.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest("[data-run]")) { runCurrent(); return; }
      if (event.target.closest && event.target.closest("[data-check]")) { state.checked = true; render(); }
    });
    render();
    return {
      update: function (s) {
        if (s && s.test && TESTS[s.test] && s.test !== state.test) { state.test = s.test; state.checked = false; render(); }
      },
      next: function () {
        if (!isRun()) { runCurrent(); return true; }
        if (index() >= ORDER.length - 1) return false;
        state.test = ORDER[index() + 1];
        state.checked = false;
        state.run[state.test] = true;
        render();
        return true;
      },
      prev: function () {
        if (index() <= 0) return false;
        state.test = ORDER[index() - 1];
        state.checked = false;
        state.run[state.test] = true;
        render();
        return true;
      },
      hasNext: function () { return !isRun() || index() < ORDER.length - 1; },
      hasPrev: function () { return index() > 0; },
      resize: function () {},
      destroy: function () { if (el.parentNode) el.parentNode.removeChild(el); }
    };
  }
  core.register("limitslab", limitsLabScene);
})();
