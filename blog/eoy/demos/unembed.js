(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function unembedScene(root, api) {
    var inst = window.UnembedScene ? window.UnembedScene(root, api) : null;
    if (!inst || !root) return inst;
    var DE = api.lang === "de";
    function set(sel, de, en) {
      var node = root.querySelector(sel);
      if (node) node.setAttribute("data-tip", DE ? de : en);
    }
    set(".ls-sim-tabs", "Drei Ansichten: Richtungen, Skaleninvarianz und Unembedding.", "Three views: directions, scale invariance, and unembedding.");
    set(".ls-sim-canvas", "Punktwolke der Wörter; der aktuelle Tab bestimmt, ob Richtungen, Längen oder Token-Logits gezeigt werden.", "Word point cloud; the active tab decides whether directions, magnitudes, or token logits are shown.");
    set(".ls-sim-select", "Wählt das Wort, dessen Vektor und Nachbarn untersucht werden.", "Chooses the word whose vector and neighbours are inspected.");
    set(".ls-sim-pause", "Hält die Drehung der Punktwolke an, ohne die Auswahl zu ändern.", "Stops the rotation of the point cloud without changing the selection.");
    set(".ls-sim-scale", "Verkürzt oder verlängert Vektor B, um zu zeigen, dass die Richtung erhalten bleibt.", "Shortens or lengthens vector B to show that its direction is preserved.");
    set(".ls-sim-next-angle", "Springt zum nächsten Winkel im Unembedding-Lauf.", "Jumps to the next angle in the unembedding run.");
    set(".ls-sim-readout", "Aktuelle Winkel, Skalen und die daraus folgenden Token-Logits.", "Current angles, scales, and the resulting token logits.");
    set(".ls-sim-unembed-list", "Die konkurrierenden nächsten Token mit ihrem Score. Klicke einen Token, um seinen Winkel im Plot zu sehen.", "The competing next tokens with their scores. Click a token to show its angle in the plot.");
    root.querySelectorAll(".ls-sim-tab").forEach(function (b, i) {
      var de = ["Richtungen: Bedeutung liegt in der Richtung, nicht in der Länge.", "Skaleninvarianz: derselbe Vektor darf länger oder kürzer sein.", "Unembedding: das versteckte Vektor-Ergebnis wird zu Token-Logits."][i] || "Ansicht wechseln.";
      var en = ["Directions: meaning lives in the direction, not the length.", "Scale invariance: the same vector may be longer or shorter.", "Unembedding: the hidden vector result becomes token logits."][i] || "Switch the view.";
      b.setAttribute("data-tip", DE ? de : en);
    });
    return inst;
  }
  core.register("unembed", unembedScene);
})();
