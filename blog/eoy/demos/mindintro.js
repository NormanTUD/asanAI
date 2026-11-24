(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function mindIntroScene(root, api) {
    var DE = api.lang === "de";
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
        '<div class="ls-mi2-orb" aria-hidden="true"><span>?</span><em>' + L("Quale", "quale") + '</em></div>' +
      '</header>' +
      '<div class="ls-mi2-main">' +
        '<section class="ls-mi2-qualia" data-tip="' + L("Qualia sind die gefühlten Eigenschaften einer Erfahrung; Messungen erreichen nur ihre Bedingungen.", "Qualia are the felt qualities of an experience; measurements reach only their conditions.") + '">' +
          '<div class="ls-mi2-head"><span>Qualia</span><b>' + L("Die Röte des Roten", "The redness of red") + '</b></div>' +
          '<div class="ls-mi2-split">' +
            '<div class="ls-mi2-side is-out" data-tip="' + L("Von außen messbar: Wellenlänge, Zapfen, Neuronen und Bericht.", "Measurable from outside: wavelength, cones, neurons, and report.") + '">' +
              '<div class="ls-mi2-measure"><svg viewBox="0 0 180 54" aria-hidden="true"><path d="M5 47 C30 47 44 40 58 35 C82 25 96 11 112 13 C132 16 148 33 175 36" fill="none" stroke="var(--ls-blue)" stroke-width="1.8"></path><line x1="108" y1="7" x2="108" y2="49" stroke="var(--ls-gold)" stroke-dasharray="3 2"></line><text x="112" y="11" class="ls-mi2-measure-label">700 nm</text></svg><div class="ls-mi2-bars"><i></i><i></i><i></i><i></i></div><span>' + L("Zapfen · Neuronen · Bericht", "cones · neurons · report") + '</span></div>' +
              '<b>' + L("Von außen", "From outside") + '</b><p>' + L("Messung, Aktivität, Beschreibung", "measurement, activity, description") + '</p>' +
            '</div>' +
            '<div class="ls-mi2-gap" data-tip="' + L("Die Erklärungslücke: aus Messdaten folgt nicht, wie sich etwas anfühlt.", "The explanatory gap: measurements do not imply how something feels.") + '"><span>?</span><b>' + L("Erklärungslücke", "explanatory gap") + '</b></div>' +
            '<div class="ls-mi2-side is-in" data-tip="' + L("Von innen: die gefühlte Röte, die in keiner Messung vorkommt.", "From inside: the felt redness that appears in no measurement.") + '">' +
              '<div class="ls-mi2-felt"><span>?</span></div>' +
              '<b>' + L("Von innen", "From inside") + '</b><p>' + L("Wie sich das Rot anfühlt", "what the red feels like") + '</p>' +
            '</div>' +
          '</div>' +
          '<p class="ls-mi2-def">' + L("Qualia (Singular Quale) sind die gefühlten Eigenschaften einer Erfahrung: die Röte des Roten, der Schmerz des Schmerzes, der Klang einer Geige. Messungen beschreiben die Bedingungen, nicht das Erleben. Diese Lücke heißt das harte Problem (Chalmers, 1995).", "Qualia (singular quale) are the felt qualities of an experience: the redness of red, the painfulness of pain, the sound of a violin. Measurements describe the conditions, not the experience. This gap is the hard problem (Chalmers, 1995).") + '</p>' +
          '<div class="ls-mi2-examples"><span>' + L("Rot", "red") + '</span><span>' + L("Schmerz", "pain") + '</span><span>' + L("Kaffee", "coffee") + '</span><span>' + L("ein Akkord", "a chord") + '</span></div>' +
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
                '<p class="ls-mi2-answer" data-mi-answer-text hidden></p>' +
              '</div>' +
            '</div>' +
          '</section>' +
          '<section class="ls-mi2-spectrum" data-tip="' + L("Invertiertes Spektrum: gleiche Worte, anderes Erleben.", "Inverted spectrum: same words, different experience.") + '">' +
            '<div class="ls-mi2-spectrum-head"><span>' + L("Other Minds", "Other minds") + '</span><b>' + L("Gleiche Worte, anderes Erleben", "Same words, different experience") + '</b></div>' +
            '<p class="ls-mi2-spectrum-lead">' + L("A und B sehen dieselbe Tomate. Beide sagen: „Das ist rot.“ Aber was A innerlich sieht, könnte das sein, was B „grün“ nennt.", "A and B see the same tomato. Both say: “That is red.” But what A sees inwardly could be what B calls “green.”") + '</p>' +
            '<div class="ls-mi2-observers">' +
              '<div class="ls-mi2-observer"><span class="ls-mi2-avatar">A</span><div class="ls-mi2-bubble">' + L("„Das ist rot.“", "“That is red.”") + '</div><div class="ls-mi2-quale is-red" data-mi-quale-a><span>' + L("Rot", "red") + '</span></div></div>' +
              '<div class="ls-mi2-observer"><span class="ls-mi2-avatar">B</span><div class="ls-mi2-bubble">' + L("„Das ist rot.“", "“That is red.”") + '</div><div class="ls-mi2-quale is-green" data-mi-quale-b><span>' + L("Grün", "green") + '</span></div></div>' +
            '</div>' +
            '<p class="ls-mi2-spectrum-note">' + L("Von außen sind Worte und Verhalten identisch. Ob die inneren Farben vertauscht sind, ist nicht messbar. Das ist das Other-Minds-Problem.", "From outside, words and behaviour are identical. Whether the inner colours are swapped cannot be measured. That is the other-minds problem.") + '</p>' +
            '<div class="ls-mi2-spectrum-foot"><button type="button" class="ls-mi2-swap" data-mi-swap data-tip="' + L("Tauscht die inneren Farben, ohne die Worte zu ändern.", "Swaps the inner colours without changing the words.") + '">' + L("Qualia tauschen", "Swap qualia") + '</button><span data-mi-spectrum-status aria-live="polite">' + L("Beide berichten dasselbe. Von außen ist der Unterschied unsichtbar.", "Both report the same. From outside the difference is invisible.") + '</span></div>' +
          '</section>' +
        '</aside>' +
      '</div>' +
      '<div class="ls-mi2-bottom">' +
        '<article class="ls-mi2-bottom-card" data-tip="' + L("Prüfbar sind Aufgaben und Berichte; das zeigt Zugang, nicht Erleben.", "Tasks and reports are testable; that shows access, not experience.") + '"><span>01</span><b>' + L("Was prüfbar ist", "What can be tested") + '</b><p>' + L("Aufgaben, Verhalten, Selbstbericht und globale Verfügbarkeit. Das zeigt Zugang, nicht Qualia.", "Tasks, behaviour, self-report, and global availability. That shows access, not qualia.") + '</p></article>' +
        '<article class="ls-mi2-bottom-card" data-tip="' + L("Bewusstsein hat Typen und Stufen, nicht nur Ja oder Nein.", "Consciousness has types and levels, not just yes or no.") + '"><span>02</span><b>' + L("Nicht binär", "Not binary") + '</b><p>' + L("Bewusstsein ist nicht nur Ja oder Nein: phänomenale Typen und Tulvings anoetisch-noetisch-autonoetische Stufen.", "Consciousness is not only yes or no: phenomenal types and Tulving's anoetic-noetic-autonoetic levels.") + '</p></article>' +
      '</div>';
    root.appendChild(el);

    var mary = el.querySelector("[data-mi-mary]");
    var reveal = el.querySelector("[data-mi-reveal]");
    var choice = el.querySelector("[data-mi-choice]");
    var answerText = el.querySelector("[data-mi-answer-text]");
    if (reveal) reveal.addEventListener("click", function () {
      mary.classList.add("is-revealed");
      reveal.hidden = true;
      choice.hidden = false;
    });
    el.querySelectorAll("[data-mi-answer]").forEach(function (b) {
      b.addEventListener("click", function () {
        var yes = b.getAttribute("data-mi-answer") === "yes";
        el.querySelectorAll("[data-mi-answer]").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        answerText.hidden = false;
        answerText.textContent = yes
          ? L("Dann gibt es Wissen jenseits der physikalischen Fakten: das Erleben selbst.", "Then there is knowledge beyond physical facts: the experience itself.")
          : L("Dann müsste alles Erleben in den physikalischen Fakten stecken. Genau das ist umstritten.", "Then all experience would have to be contained in physical facts. That is exactly what is disputed.");
      });
    });

    var swapped = false;
    var qualeA = el.querySelector("[data-mi-quale-a]");
    var qualeB = el.querySelector("[data-mi-quale-b]");
    var status = el.querySelector("[data-mi-spectrum-status]");
    var swap = el.querySelector("[data-mi-swap]");
    function renderSpectrum() {
      if (!qualeA || !qualeB) return;
      qualeA.className = "ls-mi2-quale " + (swapped ? "is-green" : "is-red");
      qualeB.className = "ls-mi2-quale " + (swapped ? "is-red" : "is-green");
      qualeA.querySelector("span").textContent = swapped ? L("Grün", "green") : L("Rot", "red");
      qualeB.querySelector("span").textContent = swapped ? L("Rot", "red") : L("Grün", "green");
      if (status) status.textContent = swapped
        ? L("Jetzt sieht A Grün und B Rot. Die Worte sind gleich geblieben.", "Now A sees green and B sees red. The words stayed the same.")
        : L("Beide berichten dasselbe. Von außen ist der Unterschied unsichtbar.", "Both report the same. From outside the difference is invisible.");
    }
    if (swap) swap.addEventListener("click", function () { swapped = !swapped; renderSpectrum(); });
    renderSpectrum();
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }
  core.register("mindintro", mindIntroScene);
})();
