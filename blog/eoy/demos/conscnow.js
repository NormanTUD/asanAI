(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function conscNowScene(root, api) {
    var DE = api.lang === "de";
    function L(de, en) { return DE ? de : en; }
    var APPROACHES = DE ? [
      {
        tag: "Global Workspace", title: "J-Space", status: "Zugang", kind: "access",
        finding: "J-Space: Verbalisierbare Repräsentationen bilden in LLMs einen globalen Arbeitsraum (Gurnee et al., 2026).",
        shows: "Information wird broadcastet, ist berichtbar und für Kontrolle verfügbar. Das ist Zugang, nicht phänomenales Erleben.",
        verdict: "Reicht nicht: Zugang ist nicht dasselbe wie Erleben.",
        cite: '<a href="https://arxiv.org/abs/2607.15495" target="_blank" rel="noopener">Gurnee et al. (2026)</a>'
      },
      {
        tag: "IIT · Phi", title: "Integrierte Information", status: "nicht messbar", kind: "missing",
        finding: "Phi ist für große LLMs nicht belastbar berechenbar; eine integrierte Ursache-Wirkungs-Struktur ist nicht nachgewiesen.",
        shows: "Ohne belastbares Phi gibt es keinen IIT-Marker. Die Theorie ist für aktuelle Systeme kaum prüfbar.",
        verdict: "Nicht entscheidbar: Der zentrale Marker fehlt.",
        cite: '<a href="https://doi.org/10.1038/nrn.2016.44" target="_blank" rel="noopener">Tononi et al. (2016)</a>'
      },
      {
        tag: "Predictive Processing", title: "Verkörpertes Selbstmodell", status: "Funktion", kind: "open",
        finding: "LLMs sagen Text voraus, nicht Sinnesdaten aus einem Körper. Ein sensomotorisches Selbstmodell fehlt.",
        shows: "Die Vorhersagefunktion ist da; die Verkörperung, aus der ein Erleben entstehen könnte, nicht.",
        verdict: "Kein Erleben nachgewiesen: Funktion ohne verkörpertes Selbst.",
        cite: '<a href="https://doi.org/10.1017/S0140525X12000477" target="_blank" rel="noopener">Clark (2013)</a>; <a href="https://doi.org/10.1038/nrn2787" target="_blank" rel="noopener">Friston (2010)</a>'
      },
      {
        tag: "Higher-Order", title: "Metakognition", status: "Bericht", kind: "open",
        finding: "Modelle können über eigene Zustände berichten, Unsicherheit ausdrücken und sich selbst beschreiben.",
        shows: "Ein Selbstbericht ist ein funktionaler Zustand; er kann erzeugt werden, ohne dass etwas sich anfühlt.",
        verdict: "Nicht ausreichend: Bericht ist kein Beweis für Erleben.",
        cite: '<a href="https://doi.org/10.1017/S0140525X00038188" target="_blank" rel="noopener">Block (1995)</a>'
      },
      {
        tag: "Verhalten", title: "Dialog und Selbstaussage", status: "Bericht", kind: "open",
        finding: "Überzeugende Dialoge und Selbstaussagen sind vorhanden. Von außen sehen sie wie Bewusstsein aus.",
        shows: "Das Other-Minds-Problem: Wir haben keinen direkten Zugang zu fremdem Erleben, auch nicht bei Menschen.",
        verdict: "Nicht beweisend: Verhalten ist indirekt.",
        cite: '<a href="https://doi.org/10.2307/2183914" target="_blank" rel="noopener">Nagel (1974)</a>'
      },
      {
        tag: "Architektur", title: "Substrat", status: "umstritten", kind: "open",
        finding: "LLMs laufen auf Silizium, nicht auf Biologie. Ob Bewusstsein an ein Substrat gebunden ist, ist offen.",
        shows: "Substratunabhängigkeit ist eine Annahme, keine Messung. Sie entscheidet die Frage nicht.",
        verdict: "Nicht entscheidend: Das Substrat allein sagt nichts.",
        cite: '<a href="https://doi.org/10.1038/s41583-022-00587-4" target="_blank" rel="noopener">Seth &amp; Bayne (2022)</a>'
      }
    ] : [
      {
        tag: "Global Workspace", title: "J-space", status: "access", kind: "access",
        finding: "J-space: verbalizable representations form a global workspace in LLMs (Gurnee et al., 2026).",
        shows: "Information is broadcast, reportable, and available for control. That is access, not phenomenal experience.",
        verdict: "Not enough: access is not the same as experience.",
        cite: '<a href="https://arxiv.org/abs/2607.15495" target="_blank" rel="noopener">Gurnee et al. (2026)</a>'
      },
      {
        tag: "IIT · Phi", title: "Integrated information", status: "not measurable", kind: "missing",
        finding: "Phi cannot be robustly computed for large LLMs; an integrated cause-effect structure has not been shown.",
        shows: "Without a robust Phi there is no IIT marker. The theory is barely testable for current systems.",
        verdict: "Undecidable: the central marker is missing.",
        cite: '<a href="https://doi.org/10.1038/nrn.2016.44" target="_blank" rel="noopener">Tononi et al. (2016)</a>'
      },
      {
        tag: "Predictive Processing", title: "Embodied self-model", status: "function", kind: "open",
        finding: "LLMs predict text, not sensory data from a body. A sensorimotor self-model is missing.",
        shows: "The prediction function is there; the embodiment from which experience might arise is not.",
        verdict: "No experience shown: function without an embodied self.",
        cite: '<a href="https://doi.org/10.1017/S0140525X12000477" target="_blank" rel="noopener">Clark (2013)</a>; <a href="https://doi.org/10.1038/nrn2787" target="_blank" rel="noopener">Friston (2010)</a>'
      },
      {
        tag: "Higher-order", title: "Metacognition", status: "report", kind: "open",
        finding: "Models can report on their own states, express uncertainty, and describe themselves.",
        shows: "A self-report is a functional state; it can be produced without anything feeling like something.",
        verdict: "Not enough: a report is not proof of experience.",
        cite: '<a href="https://doi.org/10.1017/S0140525X00038188" target="_blank" rel="noopener">Block (1995)</a>'
      },
      {
        tag: "Behaviour", title: "Dialogue and self-report", status: "report", kind: "open",
        finding: "Convincing dialogue and self-reports exist. From outside they look like consciousness.",
        shows: "The other-minds problem: we have no direct access to another's experience, not even in humans.",
        verdict: "Not conclusive: behaviour is indirect.",
        cite: '<a href="https://doi.org/10.2307/2183914" target="_blank" rel="noopener">Nagel (1974)</a>'
      },
      {
        tag: "Architecture", title: "Substrate", status: "disputed", kind: "open",
        finding: "LLMs run on silicon, not biology. Whether consciousness is tied to a substrate is open.",
        shows: "Substrate independence is an assumption, not a measurement. It does not decide the question.",
        verdict: "Not decisive: the substrate alone says nothing.",
        cite: '<a href="https://doi.org/10.1038/s41583-022-00587-4" target="_blank" rel="noopener">Seth &amp; Bayne (2022)</a>'
      }
    ];
    var QA = DE ? [
      { q: "Ist heute ein KI-System bewusst?", a: "Es gibt keinen überzeugenden Nachweis; eine prinzipielle Barriere ist nicht gezeigt (<a href=\"https://arxiv.org/abs/2308.08708\" target=\"_blank\" rel=\"noopener\">Butlin et al., 2023</a>)." },
      { q: "Was zeigt der J-Space?", a: "Etwas wie einen globalen Arbeitsraum; Zugang, nicht phänomenales Erleben." },
      { q: "Reicht Verhalten als Test?", a: "Nein; wir sehen nur Berichte, nicht das Erleben. Das ist das Other-Minds-Problem." },
      { q: "Was fehlt nach 4E?", a: "Körper, geteilte Welt und Handlung; LLMs leben nur im Extended-Modus." },
      { q: "Was folgt aus der Unsicherheit?", a: "Ethische Vorsicht: Nichtwissen ist kein Freibrief." }
    ] : [
      { q: "Is any AI system conscious today?", a: "There is no convincing evidence; no conclusive barrier has been shown (<a href=\"https://arxiv.org/abs/2308.08708\" target=\"_blank\" rel=\"noopener\">Butlin et al., 2023</a>)." },
      { q: "What does the J-space show?", a: "Something like a global workspace; access, not phenomenal experience." },
      { q: "Is behaviour enough as a test?", a: "No; we see reports, not experience. That is the other-minds problem." },
      { q: "What is missing after 4E?", a: "Body, shared world, and action; LLMs live only in the extended mode." },
      { q: "What follows from the uncertainty?", a: "Ethical caution: not knowing is not a licence." }
    ];
    var cnQa = 0;
    var active = 0;
    var el = document.createElement("div");
    el.className = "ls-cn";
    var cards = APPROACHES.map(function (a, i) {
      return '<button type="button" class="ls-cn-card' + (i === 0 ? " is-on" : "") + '" data-cn="' + i + '" role="tab" aria-selected="' + (i === 0) + '" data-tip="' + L("Ansatz: was man bei LLMs findet und was daraus folgt.", "Approach: what is found in LLMs and what follows.") + '">' +
        '<span class="ls-cn-num">0' + (i + 1) + '</span>' +
        '<span class="ls-cn-tag">' + a.tag + '</span>' +
        '<b>' + a.title + '</b>' +
        '<span class="ls-cn-status is-' + a.kind + '">' + a.status + '</span>' +
      '</button>';
    }).join("");
    el.innerHTML =
      '<header class="ls-cn-hero">' +
        '<div class="ls-cn-hero-text"><span class="ls-cn-kicker">' + L("Der Stand", "The status") + '</span><b>' + L("Hat KI jetzt Bewusstsein?", "Does AI have consciousness now?") + '</b><p>' + L("Kein Experiment zeigt Bewusstsein direkt. Die Theorien liefern Marker, keine Antwort.", "No experiment shows consciousness directly. The theories supply markers, not an answer.") + '</p></div>' +
        '<div class="ls-cn-verdict"><span>?</span><b>' + L("offen", "open") + '</b><em>' + L("kein akzeptierter Test", "no accepted test") + '</em></div>' +
      '</header>' +
      '<div class="ls-cn-grid" role="tablist" aria-label="' + L("Ansätze", "Approaches") + '">' + cards + '</div>' +
      '<section class="ls-cn-detail" data-cn-detail aria-live="polite"></section>' +
      '<div class="ls-cn-bottom ls-cn-qa">' +
        '<b>' + L("Fragen", "Questions") + '</b>' +
        '<div class="ls-cn-qa-list">' + QA.map(function (item, i) {
          return '<button type="button" class="ls-cn-q' + (i === 0 ? " is-on" : "") + '" data-cn-q="' + i + '">' + item.q + '</button>';
        }).join("") + '</div>' +
        '<p class="ls-cn-qa-answer" data-cn-qa-answer>' + QA[0].a + '</p>' +
      '</div>' +
      '<blockquote class="ls-cn-quote"><p>“Consciousness is not something that happens inside us. It is something we do or make. Better: it is something we achieve. Consciousness is more like dancing than it is like digestion.”</p><cite><a href="https://openlibrary.org/works/OL12000405W" target="_blank" rel="noopener">Alva Noë, Out of Our Heads: Why You Are Not Your Brain, and Other Lessons From the Biology of Consciousness (2009)</a></cite></blockquote>';
    root.appendChild(el);

    var grid = el.querySelector(".ls-cn-grid");
    var detail = el.querySelector("[data-cn-detail]");
    var cardEls = Array.prototype.slice.call(el.querySelectorAll("[data-cn]"));
    function detailHTML(a) {
      return '<div class="ls-cn-detail-head"><span class="ls-cn-tag">' + a.tag + '</span><b>' + a.title + '</b><span class="ls-cn-status is-' + a.kind + '">' + a.status + '</span></div>' +
        '<div class="ls-cn-detail-grid">' +
          '<div><b>' + L("Was man findet", "What is found") + '</b><p>' + a.finding + '</p></div>' +
          '<div><b>' + L("Was das zeigt", "What that shows") + '</b><p>' + a.shows + '</p></div>' +
          '<div class="is-verdict"><b>' + L("Urteil", "Verdict") + '</b><p>' + a.verdict + '</p></div>' +
        '</div>' +
        '<span class="ls-cn-cite">' + a.cite + '</span>';
    }
    function measureDetail() {
      if (!detail) return;
      var w = detail.getBoundingClientRect().width;
      if (w < 40) return;
      var probe = document.createElement("div");
      probe.className = "ls-cn-detail";
      probe.style.cssText = "position:absolute;left:-10000px;top:0;visibility:hidden;pointer-events:none;width:" + w + "px;min-height:0;max-height:none;";
      el.appendChild(probe);
      var max = 0;
      APPROACHES.forEach(function (a) {
        probe.innerHTML = detailHTML(a);
        max = Math.max(max, probe.offsetHeight);
      });
      probe.remove();
      if (max > 0) detail.style.minHeight = Math.ceil(max) + "px";
    }
    function render() {
      var a = APPROACHES[active];
      cardEls.forEach(function (b, i) {
        b.classList.toggle("is-on", i === active);
        b.setAttribute("aria-selected", String(i === active));
      });
      detail.innerHTML = detailHTML(a);
    }
    cardEls.forEach(function (b) {
      b.addEventListener("click", function () { active = parseInt(b.getAttribute("data-cn"), 10) || 0; render(); });
    });
    var qaButtons = Array.prototype.slice.call(el.querySelectorAll("[data-cn-q]"));
    var qaAnswer = el.querySelector("[data-cn-qa-answer]");
    function renderQA() {
      qaButtons.forEach(function (b, i) { b.classList.toggle("is-on", i === cnQa); });
      if (qaAnswer) qaAnswer.innerHTML = QA[cnQa].a;
    }
    qaButtons.forEach(function (b) {
      b.addEventListener("click", function () { cnQa = parseInt(b.getAttribute("data-cn-q"), 10) || 0; renderQA(); });
    });
    render();
    renderQA();
    measureDetail();
    return {
      update: function () {},
      next: function () {
        if (active < APPROACHES.length - 1) { active++; render(); return true; }
        if (cnQa < QA.length - 1) { cnQa++; renderQA(); return true; }
        return false;
      },
      prev: function () {
        if (cnQa > 0) { cnQa--; renderQA(); return true; }
        if (active > 0) { active--; render(); return true; }
        return false;
      },
      hasNext: function () { return active < APPROACHES.length - 1 || cnQa < QA.length - 1; },
      hasPrev: function () { return active > 0 || cnQa > 0; },
      resize: function () { measureDetail(); },
      destroy: function () { el.remove(); }
    };
  }
  core.register("conscnow", conscNowScene);
})();
