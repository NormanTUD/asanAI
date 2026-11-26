(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function gradientScene(root, api) {
    var inst = window.LossLandscapeScene(root, api);
    if (inst && root) {
      var DE = api.lang === "de";
      var node;
      node = root.querySelector(".ls-canvas");
      if (node) node.setAttribute("data-tip", DE ? "Die Loss-Fläche über zwei Parameter; höher oder rötlicher bedeutet schlechter." : "The loss surface over two parameters; higher or redder means worse.");
      node = root.querySelector(".ls-loss-data");
      if (node) node.setAttribute("data-tip", DE ? "Datenpunkte + aktuelle Gerade: Fahre über Punkte oder Gerade für x, y und f(x)." : "Data points + current line: hover points or the line for x, y, and f(x).");
      node = root.querySelector(".ls-loss-table");
      if (node) node.setAttribute("data-tip", DE ? "Jedes Beispiel mit x, Zielwert y und aktuellem f(x)." : "Each example with its x, target y, and current f(x).");
      node = root.querySelector(".ls-loss-formula");
      if (node) node.setAttribute("data-tip", DE ? "Das lineare Modell und sein aktueller Loss als Formel." : "The linear model and its current loss as math.");
      node = root.querySelector('[data-opt="sgd"]');
      if (node) node.setAttribute("data-tip", DE ? "Einfacher Gradientenabstieg; folgt der steilsten Richtung mit fester Schrittweite." : "Plain gradient descent; follows the steepest slope at a fixed step size.");
      node = root.querySelector('[data-opt="adam"]');
      if (node) node.setAttribute("data-tip", DE ? "Adaptiver Momenten-Optimierer; nimmt oft einen glatteren Pfad." : "Adaptive moment optimizer; often takes a smoother path.");
      node = root.querySelector('[data-opt="momentum"]');
      if (node) node.setAttribute("data-tip", DE ? "Sammelt frühere Gradienten und läuft durch flache Richtungen weiter." : "Accumulates past gradients to keep moving through shallow directions.");
      node = root.querySelector(".ls-loss-lr");
      if (node) node.setAttribute("data-tip", DE ? "Bestimmt, wie weit jeder Schritt die Loss-Fläche hinabgeht." : "Controls how far each step moves down the loss surface.");
      node = root.querySelector(".ls-loss-train");
      if (node) node.setAttribute("data-tip", DE ? "Startet oder setzt den Pfad des Optimierers fort." : "Start or continue the optimizer's path.");
      node = root.querySelector(".ls-loss-pause");
      if (node) node.setAttribute("data-tip", DE ? "Hält die Animation an, ohne die Gewichte zurückzusetzen." : "Stop the animation without resetting the weights.");
      node = root.querySelector(".ls-loss-reset");
      if (node) node.setAttribute("data-tip", DE ? "Setzt die Parameter auf den Startpunkt zurück." : "Return the parameters to the starting point.");
      node = root.querySelector(".ls-loss-readout");
      if (node) node.setAttribute("data-tip", DE ? "Aktuelle Gewichte, Loss, Optimierer und Schrittnummer." : "Current weights, loss, optimizer, and step.");
    }
    return inst;
  }

  core.register("gradient", gradientScene);
})();
