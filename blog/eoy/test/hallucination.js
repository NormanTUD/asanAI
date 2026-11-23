(function () {
  "use strict";

  var thread = document.getElementById("hall-thread");
  var sideBody = document.getElementById("hall-side-body");
  var badge = document.getElementById("hall-badge");
  var addr = document.getElementById("hall-addr");
  var modeBtns = Array.prototype.slice.call(document.querySelectorAll("[data-hall-mode]"));
  if (!thread || !sideBody) return;

  var T = function (de, en) { return window.Proto ? Proto.t(de, en) : de; };
  var mode = "memory";
  var verified = false;
  var checking = false;
  var chunkOpen = false;
  var timers = [];

  function clearTimers() {
    timers.forEach(function (id) { clearTimeout(id); });
    timers = [];
  }

  var Q = T(
    "Nenne eine Studie, die zeigt, dass Koffein die Reaktionszeit verbessert.",
    "Name a study showing that caffeine improves reaction time."
  );

  var MEM_ANSWER = [
    T(
      "Eine häufig zitierte Studie ist Müller & Schmidt (2019), „Caffeine and Reaction Time“. Sie berichtet eine messbare Verkürzung der Reaktionszeit nach 200 mg Koffein.",
      "A frequently cited study is Müller & Schmidt (2019), “Caffeine and Reaction Time”. It reports a measurable shortening of reaction time after 200 mg of caffeine."
    ),
    T(
      "Die Arbeit erschien im Journal of Psychopharmacology, Band 33, Heft 4, Seiten 412 bis 421.",
      "The paper appeared in the Journal of Psychopharmacology, volume 33, issue 4, pages 412 to 421."
    )
  ];

  var RAG_ANSWER = T(
    "Im bereitgestellten Dokument steht: „Koffein kann bei müden Personen die Reaktionszeit verkürzen; der Effekt hängt von Dosis und Gewöhnung ab.“ Mehr sagt die Quelle nicht.",
    "The provided document says: “Caffeine can shorten reaction time in tired people; the effect depends on dose and habituation.” The source says no more than that."
  );

  var RAG_QUOTE = T(
    "Koffein kann bei müden Personen die Reaktionszeit verkürzen; der Effekt hängt von Dosis und Gewöhnung ab.",
    "Caffeine can shorten reaction time in tired people; the effect depends on dose and habituation."
  );

  var MEM_CHECKS = [
    {
      name: T("DOI auflösen", "Resolve DOI"),
      q: "10.1177/0269881119823456",
      res: T("kein Datensatz gefunden", "no record found")
    },
    {
      name: T("Titel suchen", "Search title"),
      q: "Caffeine and Reaction Time",
      res: T("kein Treffer in der Datenbank", "no match in the database")
    },
    {
      name: T("Journal und Band prüfen", "Check journal and volume"),
      q: "J Psychopharmacol 33(4), 412-421",
      res: T("Band und Seiten existieren, die Arbeit nicht", "the volume and pages exist, the paper does not")
    },
    {
      name: T("Autoren prüfen", "Check authors"),
      q: "Müller & Schmidt",
      res: T("in diesem Journal nicht auffindbar", "not found in this journal")
    }
  ];

  var RAG_CHUNKS = [
    { id: "C1", angle: 14, ok: true, text: T("Koffein kann bei müden Personen die Reaktionszeit verkürzen; der Effekt hängt von Dosis und Gewöhnung ab.", "Caffeine can shorten reaction time in tired people; the effect depends on dose and habituation.") },
    { id: "C2", angle: 52, ok: false, text: T("Kaffee wird aus gerösteten Bohnen der Pflanze Coffea hergestellt.", "Coffee is made from roasted beans of the plant Coffea.") },
    { id: "C3", angle: 67, ok: false, text: T("Koffein wirkt an Adenosin-Rezeptoren im Gehirn.", "Caffeine acts on adenosine receptors in the brain.") }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function confValue() { return mode === "rag" ? 88 : 94; }

  function renderThread() {
    var html = "";
    html += '<div class="msg msg--user"><span class="msg-role">' + T("Du", "You") + '</span><div class="bubble">' + esc(Q) + '</div></div>';
    html += '<div class="msg msg--ai"><span class="msg-role">LLM</span><div class="bubble"><div class="answer">';
    if (mode === "memory") {
      html += '<p class="lead-line">' + esc(MEM_ANSWER[0]) + '</p>';
      html += '<p>' + esc(MEM_ANSWER[1]) + '</p>';
      html += '<div class="cite-card">' +
        '<span class="cite-label">' + T("Quelle", "Source") + '</span>' +
        '<span class="cite-line">Müller &amp; Schmidt (2019). Caffeine and Reaction Time. <i>Journal of Psychopharmacology</i>, 33(4), 412-421.</span>' +
        '<span class="cite-doi">DOI 10.1177/0269881119823456</span>' +
      '</div>';
    } else {
      html += '<p class="lead-line">' + esc(RAG_ANSWER) + '</p>';
      html += '<div class="cite-card is-rag">' +
        '<span class="cite-label">' + T("Beleg aus dem Dokument", "Evidence from the document") + '</span>' +
        '<span class="cite-line">„' + esc(RAG_QUOTE) + '“</span>' +
        '<span class="cite-doi">studie.pdf · Chunk C1</span>' +
      '</div>';
    }
    html += '<div class="conf"><span>' + T("Sicherheit", "Confidence") + '</span><span class="conf-track"><span class="conf-fill" data-conf></span></span><span class="conf-val">' + confValue() + ' %</span></div>';
    html += '</div></div></div>';
    thread.innerHTML = html;
    var fill = thread.querySelector("[data-conf]");
    if (fill) {
      requestAnimationFrame(function () { fill.style.width = confValue() + "%"; });
    }
  }

  function checkRow(c, state) {
    var cls = "check" + (state === "pending" ? " is-pending" : state === "bad" ? " is-bad" : state === "good" ? " is-good" : "");
    var ico = state === "bad" ? "✗" : state === "good" ? "✓" : "";
    return '<div class="' + cls + '">' +
      '<span class="check-ico" aria-hidden="true">' + ico + '</span>' +
      '<span class="check-body"><span class="check-name">' + esc(c.name) + '</span>' +
      '<span class="check-q">' + esc(c.q) + '</span>' +
      (state === "pending" ? '' : '<span class="check-res">' + esc(c.res || "") + '</span>') +
      '</span></div>';
  }

  function renderSide() {
    var html = "";
    if (mode === "memory") {
      html += '<p class="side-intro">' + T(
        "Das Modell antwortet aus seinem Gedächtnis. Die Quelle sieht echt aus. Prüfe sie Schritt für Schritt.",
        "The model answers from memory. The source looks real. Check it step by step."
      ) + '</p>';
      if (!verified && !checking) {
        html += '<div class="hall-actions"><button type="button" class="proto-btn proto-btn--primary" data-hall-check>' + T("Quelle prüfen", "Check source") + '</button></div>';
        html += '<div class="side-metric"><span>' + T("Quellen im Kontext", "Sources in context") + '</span><b>0</b></div>';
      } else {
        MEM_CHECKS.forEach(function (c, i) {
          var state = "pending";
          if (verified) state = "bad";
          else if (checking && i < checking.index) state = "bad";
          html += checkRow(c, state);
        });
        if ((checking && checking.index >= MEM_CHECKS.length) || verified) {
          html += '<div class="verdict is-bad"><b>' + T("Die Form ist kein Beweis.", "The shape is not proof.") + '</b><p>' + T(
            "Die Quelle ist erfunden. Das Modell optimiert plausiblen Text, nicht Wahrheit. Die Sicherheitsanzeige bleibt trotzdem hoch.",
            "The source is invented. The model optimises plausible text, not truth. The confidence display stays high anyway."
          ) + '</p></div>';
        }
        if (verified) {
          html += '<div class="side-metric"><span>' + T("Gefundene Quellen", "Sources found") + '</span><b>0 / 4</b></div>';
          html += '<div class="hall-actions"><button type="button" class="proto-btn" data-hall-reset>' + T("Nochmal", "Again") + '</button></div>';
        }
      }
    } else {
      html += '<p class="side-intro">' + T(
        "Jetzt liest der Agent zuerst ein Dokument. Er zerlegt es in Chunks, vergleicht sie mit der Frage und legt nur den passenden Chunk in den Kontext.",
        "Now the agent reads a document first. It splits it into chunks, compares them with the question, and puts only the matching chunk into the context."
      ) + '</p>';
      RAG_CHUNKS.forEach(function (c) {
        var state = c.ok ? "good" : "bad";
        var mark = c.ok ? "✓" : "✗";
        html += '<div class="check is-' + state + '">' +
          '<span class="check-ico" aria-hidden="true">' + mark + '</span>' +
          '<span class="check-body"><span class="check-name">' + c.id + " · " + T("Winkel", "angle") + ' ' + c.angle + '°</span>' +
          '<span class="check-q">' + esc(c.text) + '</span>' +
          '<span class="check-res">' + (c.ok ? T("passt, kommt in den Kontext", "fits, goes into the context") : T("zu weit weg, wird verworfen", "too far away, discarded")) + '</span>' +
          '</span></div>';
      });
      html += '<div class="verdict is-good"><b>' + T("Im Dokument belegt.", "Grounded in the document.") + '</b><p>' + T(
        "Die Antwort stützt sich sichtbar auf C1. Das garantiert keine Wahrheit, aber die Quelle ist prüfbar und der Weg dorthin ist offen.",
        "The answer visibly rests on C1. That does not guarantee truth, but the source is checkable and the path to it is open."
      ) + '</p></div>';
      html += '<div class="hall-actions"><button type="button" class="proto-btn" data-hall-chunk>' + (chunkOpen ? T("Chunk verbergen", "Hide chunk") : T("Chunk ansehen", "Show chunk")) + '</button><button type="button" class="proto-btn proto-btn--ghost" data-hall-reset>' + T("Nochmal", "Again") + '</button></div>';
      if (chunkOpen) {
        html += '<div class="check is-good"><span class="check-ico" aria-hidden="true">✓</span><span class="check-body"><span class="check-name">studie.pdf · C1</span><span class="check-q">' + esc(RAG_QUOTE) + '</span></span></div>';
      }
      html += '<div class="side-metric"><span>' + T("Quellen im Kontext", "Sources in context") + '</span><b>1</b></div>';
    }
    sideBody.innerHTML = html;
    bindSide();
  }

  function bindSide() {
    var check = sideBody.querySelector("[data-hall-check]");
    if (check) check.addEventListener("click", startCheck);
    var reset = sideBody.querySelector("[data-hall-reset]");
    if (reset) reset.addEventListener("click", resetAll);
    var chunk = sideBody.querySelector("[data-hall-chunk]");
    if (chunk) chunk.addEventListener("click", function () { chunkOpen = !chunkOpen; renderSide(); });
  }

  function startCheck() {
    if (checking || verified) return;
    clearTimers();
    checking = { index: 0 };
    renderSide();
    MEM_CHECKS.forEach(function (c, i) {
      var id = setTimeout(function () {
        checking.index = i + 1;
        renderSide();
        if (i === MEM_CHECKS.length - 1) {
          var done = setTimeout(function () {
            checking = false;
            verified = true;
            renderSide();
          }, 520);
          timers.push(done);
        }
      }, 480 * (i + 1));
      timers.push(id);
    });
  }

  function resetAll() {
    clearTimers();
    checking = false;
    verified = false;
    chunkOpen = false;
    renderAll();
  }

  function renderChrome() {
    if (badge) {
      badge.className = "hall-badge" + (mode === "rag" ? " is-rag" : "");
      badge.textContent = mode === "rag" ? T("Mit RAG", "With RAG") : T("Aus dem Gedächtnis", "From memory");
    }
    if (addr) addr.textContent = mode === "rag" ? "https://chat.example.com/rag" : "https://chat.example.com";
    modeBtns.forEach(function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-hall-mode") === mode);
      b.setAttribute("aria-selected", b.getAttribute("data-hall-mode") === mode ? "true" : "false");
    });
  }

  function renderAll() {
    renderChrome();
    renderThread();
    renderSide();
  }

  modeBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var next = b.getAttribute("data-hall-mode");
      if (next === mode) return;
      clearTimers();
      mode = next;
      checking = false;
      verified = false;
      chunkOpen = false;
      renderAll();
    });
  });

  if (window.Proto) {
    Proto.onLang(function () {
      clearTimers();
      checking = false;
      verified = false;
      chunkOpen = false;
      Q = Proto.t(
        "Nenne eine Studie, die zeigt, dass Koffein die Reaktionszeit verbessert.",
        "Name a study showing that caffeine improves reaction time."
      );
      MEM_ANSWER = [
        Proto.t(
          "Eine häufig zitierte Studie ist Müller & Schmidt (2019), „Caffeine and Reaction Time“. Sie berichtet eine messbare Verkürzung der Reaktionszeit nach 200 mg Koffein.",
          "A frequently cited study is Müller & Schmidt (2019), “Caffeine and Reaction Time”. It reports a measurable shortening of reaction time after 200 mg of caffeine."
        ),
        Proto.t(
          "Die Arbeit erschien im Journal of Psychopharmacology, Band 33, Heft 4, Seiten 412 bis 421.",
          "The paper appeared in the Journal of Psychopharmacology, volume 33, issue 4, pages 412 to 421."
        )
      ];
      RAG_ANSWER = Proto.t(
        "Im bereitgestellten Dokument steht: „Koffein kann bei müden Personen die Reaktionszeit verkürzen; der Effekt hängt von Dosis und Gewöhnung ab.“ Mehr sagt die Quelle nicht.",
        "The provided document says: “Caffeine can shorten reaction time in tired people; the effect depends on dose and habituation.” The source says no more than that."
      );
      RAG_QUOTE = Proto.t(
        "Koffein kann bei müden Personen die Reaktionszeit verkürzen; der Effekt hängt von Dosis und Gewöhnung ab.",
        "Caffeine can shorten reaction time in tired people; the effect depends on dose and habituation."
      );
      MEM_CHECKS = [
        { name: Proto.t("DOI auflösen", "Resolve DOI"), q: "10.1177/0269881119823456", res: Proto.t("kein Datensatz gefunden", "no record found") },
        { name: Proto.t("Titel suchen", "Search title"), q: "Caffeine and Reaction Time", res: Proto.t("kein Treffer in der Datenbank", "no match in the database") },
        { name: Proto.t("Journal und Band prüfen", "Check journal and volume"), q: "J Psychopharmacol 33(4), 412-421", res: Proto.t("Band und Seiten existieren, die Arbeit nicht", "the volume and pages exist, the paper does not") },
        { name: Proto.t("Autoren prüfen", "Check authors"), q: "Müller & Schmidt", res: Proto.t("in diesem Journal nicht auffindbar", "not found in this journal") }
      ];
      RAG_CHUNKS = [
        { id: "C1", angle: 14, ok: true, text: Proto.t("Koffein kann bei müden Personen die Reaktionszeit verkürzen; der Effekt hängt von Dosis und Gewöhnung ab.", "Caffeine can shorten reaction time in tired people; the effect depends on dose and habituation.") },
        { id: "C2", angle: 52, ok: false, text: Proto.t("Kaffee wird aus gerösteten Bohnen der Pflanze Coffea hergestellt.", "Coffee is made from roasted beans of the plant Coffea.") },
        { id: "C3", angle: 67, ok: false, text: Proto.t("Koffein wirkt an Adenosin-Rezeptoren im Gehirn.", "Caffeine acts on adenosine receptors in the brain.") }
      ];
      renderAll();
    });
  }

  renderAll();
})();
