(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function gaussScene(root, api) {
    var inst = window.GaussScene ? window.GaussScene(root, api) : null;
    if (inst && root) {
      var DE = api.lang === "de";
      var node;
      node = root.querySelector(".ls-gauss-canvas");
      if (node) node.setAttribute("data-tip", DE ? "Wahrheitskurve gegen verrauschte Beobachtungen; die Anpassung sollte der glatten Linie folgen." : "Truth curve versus noisy observations; the fit should follow the smooth line.");
      node = root.querySelector(".ls-gauss-error-canvas");
      if (node) node.setAttribute("data-tip", DE ? "Verteilung der Messfehler mit der Gauß-Glockenkurve darüber." : "Distribution of measurement errors with the Gaussian bell curve overlaid.");
      node = root.querySelector(".ls-gauss-quality");
      if (node) node.setAttribute("data-tip", DE ? "Simuliert bessere oder schlechtere Teleskope über die Rauschstärke." : "Simulates better or worse telescopes by changing the noise level.");
      node = root.querySelector(".ls-gauss-resample");
      if (node) node.setAttribute("data-tip", DE ? "Zieht einen neuen Satz synthetischer Messungen." : "Draws a new set of synthetic measurements.");
      node = root.querySelector(".ls-gauss-readout");
      if (node) node.setAttribute("data-tip", DE ? "Streuung, Zahl der Beobachtungen, mittlerer Fehler und Fit-Methode." : "Scatter, observation count, mean error, and fitting method.");
      node = root.querySelector(".ls-gauss-status");
      if (node) node.setAttribute("data-tip", DE ? "Die Kernaussage: Keine einzelne Messung entscheidet allein." : "The key point: no single measurement decides alone.");
      node = root.querySelector(".ls-gauss-note");
      if (node) node.setAttribute("data-tip", DE ? "Die Daten sind synthetisch, nicht Piazzis Originalmessungen." : "The data are synthetic, not Piazzi's original measurements.");
    }
    return inst;
  }
  core.register("gauss", gaussScene);
})();
