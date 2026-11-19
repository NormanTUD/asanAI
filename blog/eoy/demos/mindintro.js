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
      '<div class="ls-mi-grid">' +
        '<article><span>01</span><b>' + (DE ? "Was prüfbar ist" : "What can be tested") + '</b><p>' + (DE ? "Aufgaben, Verhalten, Selbstbericht und globale Verfügbarkeit von Information. Das zeigt Zugang, nicht Qualia." : "Tasks, behaviour, self-report, and global availability of information. That shows access, not qualia.") + '</p></article>' +
        '<article><span>02</span><b>' + (DE ? "Was von außen fehlt" : "What is missing from outside") + '</b><p>' + (DE ? "Das Other-Minds-Problem: Ich habe keinen direkten Zugang zu deinem Erleben, und du keinen zu meinem. Berichte sind die Brücke, aber sie bleiben indirekt." : "The other-minds problem: I have no direct access to your experience, and you have none to mine. Reports are the bridge, but they stay indirect.") + '</p></article>' +
        '<article><span>03</span><b>' + (DE ? "Warum nicht binär" : "Why it is not binary") + '</b><p>' + (DE ? "Die Unfinishable Map fragt nicht nur ob, sondern welche Art von Bewusstsein. Sie unterscheidet phänomenale Typen und Stufen von Zugang, Bericht und Erleben." : "The Unfinishable Map asks not only whether, but what kind of consciousness. It distinguishes phenomenal types and levels of access, report, and experience.") + '</p></article>' +
      '</div>' +
      '<p class="ls-mi-note">' + (DE ? "Die Frage bleibt offen. Die nächste Folie zeigt, warum Regeln allein noch kein Verstehen sind." : "The question stays open. The next slide shows why rules alone are not yet understanding.") + '</p>';
    root.appendChild(el);
    return { update: function () {}, resize: function () {}, destroy: function () { el.remove(); } };
  }
  core.register("mindintro", mindIntroScene);
})();
