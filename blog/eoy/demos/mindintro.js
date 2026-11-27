(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function mindIntroScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc || function (s) { return String(s == null ? "" : s); };
    function L(de, en) { return DE ? de : en; }
    var el = document.createElement("div");
    el.className = "ls-mi2";
    el.innerHTML =
      '<header class="ls-mi2-hero">' +
        '<div class="ls-mi2-hero-text">' +
          '<span class="ls-mi2-kicker">' + L("Bewusstsein · Qualia", "Consciousness · qualia") + '</span>' +
          '<b>' + L("Hat eine KI Bewusstsein?", "Does an AI have consciousness?") + '</b>' +
          '<p>' + L("Die Frage klingt nach Ja oder Nein. Aber wir sehen nur Verhalten und Selbstberichte, nicht das Erleben dahinter.", "The question sounds like yes or no. But we see only behaviour and self-reports, not the experience behind them.") + '</p>' +
          '<span class="ls-mi2-hero-note">' + L("Du bist die einzige Person mit direktem Zugang zu deinem Erleben.", "You are the only person with direct access to your experience.") + '</span>' +
          '<span class="ls-mi2-hero-hint">' + L("Schau auf den roten Punkt. Wo ist das Rot?", "Look at the red dot. Where is the red?") + '</span>' +
        '</div>' +
      '</header>' +
      '<div class="ls-mi2-stages" role="tablist" aria-label="' + L("Bewusstseins-Ansichten", "Consciousness views") + '">' +
        '<button type="button" class="ls-mi2-stage-tab is-on" data-mi-stage="red" role="tab" aria-selected="true"><span>01</span>' + L("Die Röte des Roten", "The redness of red") + '</button>' +
        '<button type="button" class="ls-mi2-stage-tab" data-mi-stage="mary" role="tab" aria-selected="false"><span>02</span>' + L("Marys Zimmer", "Mary's Room") + '</button>' +
        '<button type="button" class="ls-mi2-stage-tab" data-mi-stage="inverted" role="tab" aria-selected="false"><span>03</span>' + L("Invertierte Qualia", "Inverted qualia") + '</button>' +
      '</div>' +
      '<div class="ls-mi2-main">' +
        '<section class="ls-mi2-qualia" data-tip="' + L("Qualia sind die gefühlten Eigenschaften einer Erfahrung; Messungen erreichen nur ihre Bedingungen.", "Qualia are the felt qualities of an experience; measurements reach only their conditions.") + '">' +
        '<div class="ls-mi2-orb" aria-hidden="true"><span>?</span><em>' + L("Quale", "quale") + '</em></div>' +
          '<div class="ls-mi2-head"><span>Qualia</span><b>' + L("Die Röte des Roten", "The redness of red") + '</b></div>' +
          '<div class="ls-mi2-split">' +
            '<div class="ls-mi2-side is-out" data-tip="' + L("Von außen messbar: Wellenlänge, Zapfen, Neuronen und Bericht.", "Measurable from outside: wavelength, cones, neurons, and report.") + '">' +
              '<div class="ls-mi2-measure"><svg viewBox="0 0 180 54" aria-hidden="true"><path d="M5 47 C30 47 44 40 58 35 C82 25 96 11 112 13 C132 16 148 33 175 36" fill="none" stroke="var(--ls-blue)" stroke-width="1.8"></path><line x1="108" y1="7" x2="108" y2="49" stroke="var(--ls-gold)" stroke-dasharray="3 2"></line><text x="112" y="11" class="ls-mi2-measure-label">700 nm</text></svg><div class="ls-mi2-bars"><i></i><i></i><i></i><i></i></div><span>' + L("Zapfen · Neuronen · Bericht", "cones · neurons · report") + '</span></div>' +
              '<b>' + L("Von außen", "From outside") + '</b><p>' + L("Messung, Aktivität, Beschreibung", "measurement, activity, description") + '</p>' +
            '</div>' +
            '<div class="ls-mi2-gap" data-tip="' + L("Die Erklärungslücke: aus Messdaten folgt nicht, wie sich etwas anfühlt.", "The explanatory gap: measurements do not imply how something feels.") + '"><span>?</span><b>' + L("Erklärungs-<br>lücke", "explanatory<br>gap") + '</b></div>' +
            '<div class="ls-mi2-side is-in" data-tip="' + L("Von innen: die gefühlte Röte, die in keiner Messung vorkommt.", "From inside: the felt redness that appears in no measurement.") + '">' +
              '<div class="ls-mi2-felt"><span>?</span></div>' +
              '<b>' + L("Von innen", "From inside") + '</b><p>' + L("Wie sich das Rot anfühlt", "what the red feels like") + '</p>' +
            '</div>' +
          '</div>' +
          '<p class="ls-mi2-def">' + L("Qualia sind die gefühlten Eigenschaften einer Erfahrung, etwa die Röte des Roten.", "Qualia are felt qualities of experience, such as redness of red.") + '</p>' +
          '<div class="ls-mi2-problems">' +
            '<p class="is-easy"><b>' + L("Leichtes Problem:", "Easy problem:") + '</b> ' + L("Muster erkennen, integrieren, berichten: Mechanismen sind denkbar; „easy“ ist relativ und kann Jahrhunderte kosten.", "Discriminate, integrate, report: mechanisms are conceivable; “easy” is relative and can take centuries.") + '</p>' +
            '<p class="is-hard"><b>' + L("Schweres Problem:", "Hard problem:") + '</b> ' + L("Warum wird Verarbeitung subjektiv erlebt? Wir haben nicht einmal den Hauch einer Richtung für eine Antwort. Chalmers (1995): „Why should physical processing give rise to a rich inner life at all?“", "Why is processing subjectively experienced? We do not even have a hint of a direction for an answer. Chalmers (1995): “Why should physical processing give rise to a rich inner life at all?”") + ' <a href="https://consc.net/papers/facing.pdf" target="_blank" rel="noopener">Originalarbeit (PDF)</a></p>' +
          '</div>' +
        '</section>' +
        '<aside class="ls-mi2-right">' +
          '<section class="ls-mi2-mary" data-mi-mary data-tip="' + L("Marys Zimmer: Klick zeigt ihr den roten Apfel.", "Mary's room: click to show her the red apple.") + '">' +
            '<div class="ls-mi2-room"><span class="ls-mi2-apple is-bw"></span><span class="ls-mi2-apple is-red"></span><span class="ls-mi2-room-label">' + L("grau", "grey") + '</span><span class="ls-mi2-room-label is-right">' + L("rot", "red") + '</span></div>' +
            '<div class="ls-mi2-mary-text">' +
              '<b>Mary\'s Room</b>' +
              '<p>' + L("Mary kennt alle physikalischen Fakten über Farben, sieht aber nie Rot. Was passiert, wenn sie ihn zum ersten Mal sieht?", "Mary knows every physical fact about colour, but never sees red. What happens when she sees it for the first time?") + '</p>' +
              '<button type="button" class="ls-mi2-reveal" data-mi-reveal data-tip="' + L("Zeigt Mary den roten Apfel. Achte darauf, was sich verändert.", "Shows Mary the red apple. Watch what changes.") + '">' + L("Rot zeigen", "Show red") + '</button>' +
              '<div class="ls-mi2-choice" data-mi-choice hidden>' +
                '<span>' + L("Lernt sie etwas Neues?", "Does she learn something new?") + '</span>' +
                '<div class="ls-mi2-choice-row"><button type="button" data-mi-answer="yes">' + L("Ja", "Yes") + '</button><button type="button" data-mi-answer="no">' + L("Nein", "No") + '</button></div>' +
                '<p class="ls-mi2-answer" data-mi-answer-text aria-live="polite"></p>' +
              '</div>' +
            '</div>' +
          '</section>' +
          '<section class="ls-mi2-spectrum" data-tip="' + L("Invertiertes Spektrum: gleiche Worte, anderes Erleben.", "Inverted spectrum: same words, different experience.") + '">' +
            '<div class="ls-mi2-spectrum-head"><span>' + L("Other Minds", "Other minds") + '</span><b>' + L("Gleiche Worte, anderes Erleben", "Same words, different experience") + '</b></div>' +
            '<p class="ls-mi2-spectrum-lead">' + L("A und B sehen dieselbe Tomate und sagen beide „rot“. Was A innerlich sieht, könnte B „grün“ nennen.", "A and B see the same tomato and both say “red.” What A sees inwardly could be what B calls “green.”") + '</p>' +
            '<figure class="ls-mi2-spectrum-fig"><img src="inverted_qualia_strawberry.jpg" alt="' + L("Invertierte Qualia: Eine Erdbeere, deren Farben innen anders erlebt werden.", "Inverted qualia: a strawberry whose colours are experienced differently inside.") + '"><figcaption>Was a bee, <a href="https://creativecommons.org/licenses/by-sa/2.5" target="_blank" rel="noopener">CC BY-SA 2.5</a>, via <a href="https://commons.wikimedia.org/wiki/File:Inverted_qualia_of_colour_strawberry.jpg" target="_blank" rel="noopener">Wikimedia Commons</a>; <a href="https://en.wikipedia.org/wiki/Inverted_spectrum" target="_blank" rel="noopener">Inverted spectrum</a>.</figcaption></figure>' +
          '</section>' +
        '</aside>' +
      '</div>';
    root.appendChild(el);

    var stage = "red";
    var stageBtns = Array.prototype.slice.call(el.querySelectorAll("[data-mi-stage]"));
    function setStage(name) {
      stage = name;
      el.setAttribute("data-stage", name);
      stageBtns.forEach(function (b) {
        var on = b.getAttribute("data-mi-stage") === name;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", String(on));
      });
    }
    stageBtns.forEach(function (b) {
      b.addEventListener("click", function () { setStage(b.getAttribute("data-mi-stage")); });
    });
    setStage("red");

    var mary = el.querySelector("[data-mi-mary]");
    var reveal = el.querySelector("[data-mi-reveal]");
    var choice = el.querySelector("[data-mi-choice]");
    var answerText = el.querySelector("[data-mi-answer-text]");
    var maryRevealed = false;
    var maryAnswerState = 0;
    function revealMary() {
      if (!mary || maryRevealed) return;
      maryRevealed = true;
      mary.classList.add("is-revealed");
      if (reveal) reveal.hidden = true;
      if (choice) choice.hidden = false;
    }
    function setMaryAnswer(yes) {
      maryAnswerState = yes ? 1 : 2;
      el.querySelectorAll("[data-mi-answer]").forEach(function (x) {
        x.classList.toggle("is-on", (x.getAttribute("data-mi-answer") === "yes") === yes);
      });
      if (answerText) {
        answerText.classList.add("is-on");
        answerText.textContent = yes
          ? L("Dann gibt es Wissen jenseits der physikalischen Fakten: das Erleben selbst.", "Then there is knowledge beyond physical facts: the experience itself.")
          : L("Dann müsste alles Erleben in den physikalischen Fakten stecken. Genau das ist umstritten.", "Then all experience would have to be contained in physical facts. That is exactly what is disputed.");
      }
    }
    if (reveal) reveal.addEventListener("click", revealMary);
    el.querySelectorAll("[data-mi-answer]").forEach(function (b) {
      b.addEventListener("click", function () {
        setMaryAnswer(b.getAttribute("data-mi-answer") === "yes");
      });
    });

    return {
      update: function () {},
      next: function () {
        if (stage === "red") { setStage("mary"); return true; }
        if (stage === "mary") {
          if (!maryRevealed) { revealMary(); return true; }
          if (maryAnswerState === 0) { setMaryAnswer(true); return true; }
          if (maryAnswerState === 1) { setMaryAnswer(false); return true; }
          setStage("inverted");
          return true;
        }
        return false;
      },
      prev: function () {
        if (stage === "inverted") { setStage("mary"); return true; }
        if (stage === "mary") { setStage("red"); return true; }
        return false;
      },
      hasNext: function () { return stage !== "inverted"; },
      hasPrev: function () { return stage !== "red"; },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }
  core.register("mindintro", mindIntroScene);
})();
