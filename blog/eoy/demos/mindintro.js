(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function mindIntroScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-mi-scene";
    el.innerHTML =
      '<div class="ls-mi-question"><span>' + (DE ? "Die Frage" : "The question") + '</span><b>' + (DE ? "Hat eine KI Bewusstsein?" : "Does an AI have consciousness?") + '</b><p>' + (DE ? "Die Frage klingt nach Ja oder Nein. Aber schon der Zugang ist unklar: Wir sehen Verhalten und Selbstberichte, nicht das Erleben dahinter." : "The question sounds like yes or no. But access is already unclear: we see behaviour and self-reports, not the experience behind them.") + '</p></div>' +
      '<div class="ls-mi-qualia">' +
        '<div class="ls-mi-qualia-head"><span>Qualia</span><b>' + (DE ? "Die Röte des Roten" : "The redness of red") + '</b></div>' +
        '<div class="ls-mi-qualia-split">' +
          '<div class="ls-mi-outside"><div class="ls-mi-measure"><svg class="ls-mi-measure-graph" viewBox="0 0 160 46" aria-hidden="true"><path d="M4 40 C28 40 40 34 52 30 C74 22 86 10 100 12 C118 14 132 28 156 30" fill="none" stroke="var(--ls-blue)" stroke-width="1.6"></path><line x1="96" y1="6" x2="96" y2="42" stroke="var(--ls-gold)" stroke-dasharray="3 2"></line><text x="100" y="10" class="ls-mi-measure-label">700 nm</text></svg><div class="ls-mi-measure-bars"><i></i><i></i><i></i><i></i></div><span class="ls-mi-measure-note">' + (DE ? "Zapfen · Neuronen · Bericht" : "cones · neurons · report") + '</span></div><b>' + (DE ? "Von außen" : "From outside") + '</b><p>' + (DE ? "Messung, Aktivität, Beschreibung" : "measurement, activity, description") + '</p></div>' +
          '<div class="ls-mi-gap"><span>?</span><b>' + (DE ? "Erklärungslücke" : "Explanatory gap") + '</b></div>' +
          '<div class="ls-mi-inside"><div class="ls-mi-swatch is-felt"><i></i><span>?</span></div><b>' + (DE ? "Von innen" : "From inside") + '</b><p>' + (DE ? "Wie sich das Rot anfühlt" : "What the red feels like") + '</p></div>' +
        '</div>' +
        '<p class="ls-mi-qualia-text">' + (DE ? "Wir können die Wellenlänge messen, die Zapfen und Neuronen beobachten und deinen Bericht lesen. Aber die gefühlte Röte ist in keiner dieser Beschreibungen enthalten. Diese gefühlte Eigenschaft heißt Quale." : "We can measure the wavelength, observe the cones and neurons, and read your report. But the felt redness is not contained in any of these descriptions. This felt property is called a quale.") + '</p>' +
      '</div>' +
      '<div class="ls-mi-mary">' +
        '<div class="ls-mi-mary-room"><span class="ls-mi-mary-apple is-bw"></span><span class="ls-mi-mary-apple is-red"></span></div>' +
        '<div><b>' + (DE ? "Mary's Room" : "Mary's room") + '</b><p>' + (DE ? "Mary kennt alle physikalischen Fakten über Rot, sieht aber nur Schwarz-Weiß. Lernt sie etwas Neues, wenn sie Rot zum ersten Mal sieht? Wenn ja, dann ist physikalisches Wissen nicht alles, was es über Erfahrung zu wissen gibt." : "Mary knows every physical fact about red but sees only black and white. Does she learn something new when she sees red for the first time? If so, physical knowledge is not everything there is to know about experience.") + '</p></div>' +
      '</div>' +
      '<div class="ls-mi-grid">' +
        '<article><span>01</span><b>' + (DE ? "Was prüfbar ist" : "What can be tested") + '</b><p>' + (DE ? "Aufgaben, Verhalten, Selbstbericht und globale Verfügbarkeit von Information. Das zeigt Zugang, nicht Qualia." : "Tasks, behaviour, self-report, and global availability of information. That shows access, not qualia.") + '</p></article>' +
        '<article><span>02</span><b>' + (DE ? "Was von außen fehlt" : "What is missing from outside") + '</b><p>' + (DE ? "Das Other-Minds-Problem: Ich habe keinen direkten Zugang zu deinem Erleben, und du keinen zu meinem. Berichte sind die Brücke, aber sie bleiben indirekt." : "The other-minds problem: I have no direct access to your experience, and you have none to mine. Reports are the bridge, but they stay indirect.") + '</p></article>' +
        '<article><span>03</span><b>' + (DE ? "Warum nicht binär" : "Why it is not binary") + '</b><p>' + (DE ? "Die Unfinishable Map fragt nicht nur ob, sondern welche Art von Bewusstsein. Sie unterscheidet phänomenale Typen und kreuzt sie mit Tulvings anoetisch-noetisch-autonoetischen Stufen." : "The Unfinishable Map asks not only whether, but what kind of consciousness. It distinguishes phenomenal types and crosses them with Tulving's anoetic-noetic-autonoetic levels.") + '</p></article>' +
      '</div>' +
      '<p class="ls-mi-note">' + (DE ? "Die Frage bleibt offen. Die nächste Folie zeigt, warum Regeln allein noch kein Verstehen sind." : "The question stays open. The next slide shows why rules alone are not yet understanding.") + '</p>';
    root.appendChild(el);
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }
  core.register("mindintro", mindIntroScene);
})();
