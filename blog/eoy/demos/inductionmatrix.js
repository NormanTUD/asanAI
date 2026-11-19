(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;

  function inductionMatrixScene(root, api) {
    var DE = api.lang === "de";
    var tokens = ["A", "B", "C", "A", "B", "C", "A"];
    var pred = ["–", "A", "B", "C", "A", "B", "C"];
    var weights = [0.01, 0.06, 0.01, 0.03, 0.82, 0.01, 0.06];
    var stage = 0;
    var labels = DE
      ? ["Muster", "Vorgänger", "Match", "Attention", "Kopie"]
      : ["Pattern", "Predecessor", "Match", "Attention", "Copy"];
    var el = document.createElement("div");
    el.className = "ls-ix-scene";
    root.appendChild(el);

    function pct(v) { return Math.round(v * 100) + "%"; }

    function table() {
      var good = stage === 2 ? 4 : (stage === 0 ? -1 : 4);
      var bad = stage === 2 ? 3 : -1;
      var marked = stage === 0 ? [3, 4, 6] : (stage === 1 ? [3, 4] : (stage === 2 ? [4, 6] : [4]));
      function colClass(i) {
        if (i === bad) return " is-bad-col";
        if (i === good || marked.indexOf(i) >= 0) return " is-hot-col";
        return "";
      }
      var head = '<tr><th>' + (DE ? "Position" : "Position") + '</th>' + tokens.map(function (t, i) { return '<th class="' + colClass(i).trim() + '">' + i + '</th>'; }).join("") + '</tr>';
      var tokenRow = '<tr><th>' + (DE ? "Token" : "Token") + '</th>' + tokens.map(function (t, i) { return '<td class="' + colClass(i).trim() + '"><b>' + t + '</b></td>'; }).join("") + '</tr>';
      var predRow = '<tr><th>' + (DE ? "Vorgänger" : "Predecessor") + '</th>' + pred.map(function (t, i) { return '<td class="' + colClass(i).trim() + '">' + t + '</td>'; }).join("") + '</tr>';
      var weightRow = '<tr class="is-selected"><th>' + (DE ? "A (6) liest" : "A (6) reads") + '</th>' + weights.map(function (v, i) {
        var visible = stage >= 3;
        var hot = visible && i === 4;
        return '<td class="' + (hot ? "is-hot" : "") + '">' + (visible ? pct(v) : "—") + '</td>';
      }).join("") + '</tr>';
      return '<table><thead>' + head + '</thead><tbody>' + tokenRow + predRow + weightRow + '</tbody></table>';
    }

    function callout() {
      if (stage === 0) {
        return '<div class="ls-ix-step">1 · ' + (DE ? "Das Muster" : "The pattern") + '</div>' +
          '<h4>' + (DE ? "Nach dem früheren A kam B" : "After the earlier A came B") + '</h4>' +
          '<p>' + (DE ? "Position 6 ist das aktuelle A. Position 3 ist ein früheres A. Direkt danach, an Position 4, steht B. Das ist die Vorhersage, die der Kopf kopieren soll." : "Position 6 is the current A. Position 3 is an earlier A. Directly after it, at position 4, stands B. That is the prediction the head should copy.") + '</p>';
      }
      if (stage === 1) {
        return '<div class="ls-ix-step">2 · ' + (DE ? "Vorgänger merken" : "Remember predecessor") + '</div>' +
          '<h4>' + (DE ? "Schicht 1: Previous-Token-Head" : "Layer 1: previous-token head") + '</h4>' +
          '<p>' + (DE ? "An Position 4 steht B. Der Vorgänger dieses B ist A. Der Head schreibt kein Wort. Er addiert an Position 4 einen gelernten Vektor, der „vorher kam A“ bedeutet." : "Position 4 holds B. The predecessor of this B is A. The head writes no word. It adds a learned vector at position 4 that means “the previous token was A”.") + '</p>' +
          '<div class="ls-ix-flow"><span>A (3)</span><b>→ W_V → W_O</b><span>+ Position 4</span><b>→</b><strong>Vektor „Vorgänger A“</strong></div>';
      }
      if (stage === 2) {
        return '<div class="ls-ix-step">3 · ' + (DE ? "Query trifft Key" : "Query meets key") + '</div>' +
          '<h4>' + (DE ? "Schicht 2: Induction Head" : "Layer 2: induction head") + '</h4>' +
          '<p>' + (DE ? "Das aktuelle A fragt mit einer Query. An Position 4 enthält der Key den Vorgänger-Vektor A, deshalb ist der QK-Score hoch. Position 3 enthält den Vorgänger-Vektor C, deshalb ist der Score niedrig." : "The current A asks with a query. At position 4 the key contains the predecessor vector A, so the QK score is high. Position 3 contains the predecessor vector C, so the score is low.") + '</p>' +
          '<div class="ls-ix-matchcards">' +
            '<div class="ls-ix-q"><span>Query 6</span><b>A</b></div><div class="ls-ix-arrow">→</div>' +
            '<div class="ls-ix-key is-good"><span>Key 4</span><b>A</b><em>' + (DE ? "Vorgänger" : "predecessor") + '</em></div>' +
            '<div class="ls-ix-key is-bad"><span>Key 3</span><b>C</b><em>' + (DE ? "Vorgänger" : "predecessor") + '</em></div>' +
          '</div>';
      }
      if (stage === 3) {
        return '<div class="ls-ix-step">4 · ' + (DE ? "Attention-Gewichte" : "Attention weights") + '</div>' +
          '<h4>' + (DE ? "QK wählt Position 4" : "QK selects position 4") + '</h4>' +
          '<p>' + (DE ? "Softmax macht aus den QK-Scores eine Verteilung. Die Zeile für das aktuelle A liest 82 % von Position 4, also von B. Die übrigen 18 % verteilen sich auf die anderen Tokens." : "Softmax turns the QK scores into a distribution. The row for the current A reads 82% from position 4, that is B. The remaining 18% spread over the other tokens.") + '</p>';
      }
      return '<div class="ls-ix-step">5 · ' + (DE ? "OV kopiert B" : "OV copies B") + '</div>' +
        '<h4>' + (DE ? "Output × Value" : "Output × Value") + '</h4>' +
        '<p>' + (DE ? "QK hat die Spalte gewählt. Jetzt schreibt OV den Value von B an Position 6. Der Logit von B steigt, also wird B als nächstes Token wahrscheinlicher." : "QK selected the column. Now OV writes B's value to position 6. B's logit rises, so B becomes more likely as the next token.") + '</p>' +
        '<div class="ls-ix-flow"><span>Value B</span><b>→</b><span>Position 6</span><b>→</b><strong>Logit B ↑</strong></div>';
    }

    function render() {
      el.innerHTML =
        '<div class="ls-ix-head"><b>' + (DE ? "Der Induktionskopf in fünf Schritten" : "The induction head in five steps") + '</b><span>' + (DE ? "Klicke einen Schritt oder drücke Weiter." : "Click a step or press Next.") + '</span></div>' +
        '<div class="ls-ix-progress" role="group" aria-label="' + (DE ? "Schritte" : "Steps") + '">' + labels.map(function (label, i) {
          return '<button type="button" data-stage="' + i + '" class="' + (i === stage ? "is-on" : "") + '" aria-pressed="' + (i === stage ? "true" : "false") + '"><b>' + (i + 1) + '</b>' + api.esc(label) + '</button>';
        }).join("") + '</div>' +
        '<div class="ls-ix-main">' +
          '<div class="ls-ix-table-wrap">' + table() + '</div>' +
          '<div class="ls-ix-callout" aria-live="polite">' + callout() + '</div>' +
        '</div>' +
        '<p class="ls-ix-foot">' + (DE ? "Die konkreten Zahlen sind illustrativ. Entscheidend sind Positionen, Key und die Kopie." : "The concrete numbers are illustrative. Positions, keys, and the copy are the point.") + '</p>';
      el.querySelectorAll("[data-stage]").forEach(function (button) {
        button.addEventListener("click", function () { stage = parseInt(button.getAttribute("data-stage"), 10); render(); });
      });
      el.querySelector("table").setAttribute("aria-label", DE
        ? "Induktionskopf, Schritt " + (stage + 1) + ". Zeile 6, Token A, liest 82 Prozent von Position 4, Token B."
        : "Induction head, step " + (stage + 1) + ". Row 6, token A, reads 82 percent from position 4, token B.");
    }

    render();
    return {
      update: function () {},
      next: function () { if (stage < labels.length - 1) { stage++; render(); return true; } return false; },
      prev: function () { if (stage > 0) { stage--; render(); return true; } return false; },
      resize: function () {},
      destroy: function () { el.remove(); }
    };
  }

  core.register("inductionmatrix", inductionMatrixScene);
})();
