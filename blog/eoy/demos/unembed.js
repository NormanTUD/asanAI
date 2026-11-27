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
    set(".ls-sim-tabs", "Zwei Ansichten: Länge vs. Richtung und Unembedding.", "Two views: length vs. direction and unembedding.");
    set(".ls-sim-canvas", "Punktwolke der Wörter; rechts die Logit-Balken, der Längenregler verändert den grünen Vektor, die Winkel bleiben gleich.", "Word point cloud; logit bars on the right, and the length slider changes the green vector while the angles stay the same.");
    set(".ls-sim-select", "Wählt das Wort, dessen Vektor und Nachbarn untersucht werden.", "Chooses the word whose vector and neighbours are inspected.");
    set(".ls-sim-pause", "Hält die Drehung der Punktwolke an, ohne die Auswahl zu ändern.", "Stops the rotation of the point cloud without changing the selection.");
    set(".ls-sim-scale", "Verändert die Länge des grünen Vektors; die Kosinus-Winkel zu den anderen Wörtern bleiben gleich.", "Changes the length of the green vector; the cosine angles to the other words stay the same.");
    set(".ls-sim-next-angle", "Springt zum nächsten Winkel im Unembedding-Lauf.", "Jumps to the next angle in the unembedding run.");
    set(".ls-sim-readout", "Aktuelle Winkel, Skalen und die daraus folgenden Token-Logits.", "Current angles, scales, and the resulting token logits.");
    set(".ls-sim-unembed-list", "Die konkurrierenden nächsten Token mit ihrem Score. Klicke einen Token, um seinen Winkel im Plot zu sehen.", "The competing next tokens with their scores. Click a token to show its angle in the plot.");
    root.querySelectorAll(".ls-sim-tab").forEach(function (b, i) {
      var de = ["Länge vs. Richtung: Ziehe den Regler; die Richtung und die Kosinus-Winkel bleiben, nur die Länge ändert sich.", "Unembedding: das versteckte Vektor-Ergebnis wird zu Token-Logits."][i] || "Ansicht wechseln.";
      var en = ["Length vs. direction: drag the slider; the direction and cosine angles stay, only the length changes.", "Unembedding: the hidden vector result becomes token logits."][i] || "Switch the view.";
      b.setAttribute("data-tip", DE ? de : en);
    });
    return inst;
  }
  core.register("unembed", unembedScene);
})();
