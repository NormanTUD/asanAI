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
          '<p class="ls-mi2-def">' + L("Qualia (Singular Quale) sind die gefühlten Eigenschaften einer Erfahrung: die Röte des Roten, der Schmerz des Schmerzes, der Klang einer Geige. Messungen beschreiben die Bedingungen, nicht das Erleben.", "Qualia (singular quale) are the felt qualities of an experience: the redness of red, the painfulness of pain, the sound of a violin. Measurements describe the conditions, not the experience.") + '</p>' +
          '<div class="ls-mi2-examples"><span>' + L("Rot", "red") + '</span><span>' + L("Schmerz", "pain") + '</span><span>' + L("Kaffee", "coffee") + '</span><span>' + L("ein Akkord", "a chord") + '</span></div>' +
        '</section>' +
        '<aside class="ls-mi2-right">' +
          '<section class="ls-mi2-mary" data-tip="' + L("Marys Zimmer: ein Gedankenexperiment über Wissen und Erfahrung.", "Mary's room: a thought experiment about knowledge and experience.") + '">' +
            '<div class="ls-mi2-room"><span class="ls-mi2-apple is-bw"></span><span class="ls-mi2-apple is-red"></span><span class="ls-mi2-room-label">' + L("grau", "grey") + '</span><span class="ls-mi2-room-label is-right">' + L("rot", "red") + '</span></div>' +
            '<div><b>Mary\'s Room</b><p>' + L("Mary kennt alle physikalischen Fakten über Farben, sieht aber nie Rot. Lernt sie beim ersten Rot etwas Neues? Wenn ja, ist physikalisches Wissen nicht alles, was es über Erfahrung zu wissen gibt.", "Mary knows every physical fact about colour but has never seen red. Does she learn something new when she first sees red? If so, physical knowledge is not everything there is to know about experience.") + '</p></div>' +
          '</section>' +
          '<div class="ls-mi2-cards">' +
            '<article data-tip="' + L("Prüfbar sind Aufgaben und Berichte; das zeigt Zugang, nicht Erleben.", "Tasks and reports are testable; that shows access, not experience.") + '"><span>01</span><b>' + L("Was prüfbar ist", "What can be tested") + '</b><p>' + L("Aufgaben, Verhalten, Selbstbericht und globale Verfügbarkeit. Das zeigt Zugang, nicht Qualia.", "Tasks, behaviour, self-report, and global availability. That shows access, not qualia.") + '</p></article>' +
            '<article data-tip="' + L("Das Other-Minds-Problem: fremdes Erleben ist nur über Berichte erreichbar.", "The other-minds problem: other experience is reachable only through reports.") + '"><span>02</span><b>' + L("Was von außen fehlt", "What is missing from outside") + '</b><p>' + L("Other Minds: Ich habe keinen direkten Zugang zu deinem Erleben. Berichte sind die Brücke, aber sie bleiben indirekt.", "Other minds: I have no direct access to your experience. Reports are the bridge, but they stay indirect.") + '</p></article>' +
          '</div>' +
        '</aside>' +
      '</div>' +
      '<div class="ls-mi2-notbinary" data-tip="' + L("Bewusstsein hat Typen und Stufen, nicht nur Ja oder Nein.", "Consciousness has types and levels, not just yes or no.") + '"><span>03</span><b>' + L("Nicht binär", "Not binary") + '</b><p>' + L("Bewusstsein ist nicht nur Ja oder Nein: Man kann phänomenale Typen unterscheiden und sie mit Tulvings anoetisch-noetisch-autonoetischen Stufen kreuzen.", "Consciousness is not only yes or no: one can distinguish phenomenal types and cross them with Tulving's anoetic-noetic-autonoetic levels.") + '</p></div>';
    root.appendChild(el);
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }
  core.register("mindintro", mindIntroScene);
})();
